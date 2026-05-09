package model

import (
	"errors"
	"fmt"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupInvoiceModelTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	LOG_DB = db

	require.NoError(t, db.AutoMigrate(
		&User{},
		&TopUp{},
		&InvoiceRequest{},
		&InvoiceRequestItem{},
		&UserInvoiceProfile{},
	))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func seedInvoiceTopUp(t *testing.T, userID int, tradeNo string, status string, amount int64, money float64, provider string) TopUp {
	t.Helper()
	topUp := TopUp{
		UserId:          userID,
		Amount:          amount,
		Money:           money,
		TradeNo:         tradeNo,
		PaymentMethod:   provider,
		PaymentProvider: provider,
		CreateTime:      1000,
		CompleteTime:    1100,
		Status:          status,
	}
	require.NoError(t, DB.Create(&topUp).Error)
	return topUp
}

func TestInvoiceDomainAutoMigrateSQLite(t *testing.T) {
	db := setupInvoiceModelTestDB(t)

	require.True(t, db.Migrator().HasTable(&InvoiceRequest{}))
	require.True(t, db.Migrator().HasTable(&InvoiceRequestItem{}))
	require.True(t, db.Migrator().HasTable(&UserInvoiceProfile{}))
	require.True(t, db.Migrator().HasColumn(&InvoiceRequestItem{}, "topup_id"))
}

func TestListEligibleInvoiceTopUpsFiltersReadOnlyTopUps(t *testing.T) {
	setupInvoiceModelTestDB(t)

	valid := seedInvoiceTopUp(t, 7, "valid-online", common.TopUpStatusSuccess, 100, 100, PaymentProviderStripe)
	seedInvoiceTopUp(t, 8, "other-user", common.TopUpStatusSuccess, 100, 100, PaymentProviderStripe)
	seedInvoiceTopUp(t, 7, "pending", common.TopUpStatusPending, 100, 100, PaymentProviderStripe)
	seedInvoiceTopUp(t, 7, "amount-zero", common.TopUpStatusSuccess, 0, 100, PaymentProviderStripe)
	seedInvoiceTopUp(t, 7, "money-zero", common.TopUpStatusSuccess, 100, 0, PaymentProviderStripe)
	seedInvoiceTopUp(t, 7, "balance", common.TopUpStatusSuccess, 100, 100, PaymentProviderBalance)

	items, total, err := ListEligibleInvoiceTopUps(7, "", 0, 20)
	require.NoError(t, err)
	require.Equal(t, int64(1), total)
	require.Len(t, items, 1)
	require.Equal(t, valid.Id, items[0].Id)
}

func TestListEligibleInvoiceTopUpsExcludesAlreadyUsedTopUp(t *testing.T) {
	setupInvoiceModelTestDB(t)

	used := seedInvoiceTopUp(t, 7, "already-used", common.TopUpStatusSuccess, 100, 100, PaymentProviderStripe)
	free := seedInvoiceTopUp(t, 7, "free", common.TopUpStatusSuccess, 100, 100, PaymentProviderCreem)
	request := InvoiceRequest{
		UserId:      7,
		Username:    "alice",
		InvoiceType: InvoiceTypePersonal,
		Title:       "Alice",
		Email:       "alice@example.com",
		Amount:      100,
		Currency:    "USD",
		Status:      InvoiceStatusPending,
	}
	require.NoError(t, DB.Create(&request).Error)
	require.NoError(t, DB.Create(&InvoiceRequestItem{
		InvoiceRequestId:  request.Id,
		TopUpId:           used.Id,
		TradeNo:           used.TradeNo,
		Money:             used.Money,
		PaymentProvider:   used.PaymentProvider,
		PaymentMethod:     used.PaymentMethod,
		TopUpCreateTime:   used.CreateTime,
		TopUpCompleteTime: used.CompleteTime,
	}).Error)

	items, total, err := ListEligibleInvoiceTopUps(7, "", 0, 20)
	require.NoError(t, err)
	require.Equal(t, int64(1), total)
	require.Len(t, items, 1)
	require.Equal(t, free.Id, items[0].Id)
}

func TestCreateInvoiceRequestCreatesSnapshotsAndRejectsDuplicate(t *testing.T) {
	setupInvoiceModelTestDB(t)

	first := seedInvoiceTopUp(t, 7, "first", common.TopUpStatusSuccess, 100, 12.50, PaymentProviderStripe)
	second := seedInvoiceTopUp(t, 7, "second", common.TopUpStatusSuccess, 200, 8.25, PaymentProviderWaffo)

	request, err := CreateInvoiceRequest(InvoiceCreateInput{
		UserId:      7,
		Username:    "alice",
		TopUpIds:    []int{first.Id, second.Id},
		InvoiceType: InvoiceTypeCompany,
		Title:       "Example Ltd",
		TaxNo:       "91310000MA1K00000X",
		Email:       "finance@example.com",
		Phone:       "13800000000",
		Remark:      "monthly invoice",
	})
	require.NoError(t, err)
	require.Equal(t, 20.75, request.Amount)
	require.Equal(t, InvoiceStatusPending, request.Status)

	var items []InvoiceRequestItem
	require.NoError(t, DB.Where("invoice_request_id = ?", request.Id).Order("topup_id asc").Find(&items).Error)
	require.Len(t, items, 2)
	require.Equal(t, first.TradeNo, items[0].TradeNo)
	require.Equal(t, second.TradeNo, items[1].TradeNo)

	_, err = CreateInvoiceRequest(InvoiceCreateInput{
		UserId:      7,
		Username:    "alice",
		TopUpIds:    []int{first.Id},
		InvoiceType: InvoiceTypePersonal,
		Title:       "Alice",
		Email:       "alice@example.com",
	})
	require.ErrorIs(t, err, ErrInvoiceTopUpAlreadyUsed)
}

func TestCreateInvoiceRequestValidatesOwnerAndCompanyTaxNumber(t *testing.T) {
	setupInvoiceModelTestDB(t)

	otherUserTopUp := seedInvoiceTopUp(t, 8, "other-user-topup", common.TopUpStatusSuccess, 100, 100, PaymentProviderStripe)

	_, err := CreateInvoiceRequest(InvoiceCreateInput{
		UserId:      7,
		Username:    "alice",
		TopUpIds:    []int{otherUserTopUp.Id},
		InvoiceType: InvoiceTypePersonal,
		Title:       "Alice",
		Email:       "alice@example.com",
	})
	require.ErrorIs(t, err, ErrInvoiceTopUpNotInvoiceable)

	ownTopUp := seedInvoiceTopUp(t, 7, "own-company", common.TopUpStatusSuccess, 100, 100, PaymentProviderStripe)
	_, err = CreateInvoiceRequest(InvoiceCreateInput{
		UserId:      7,
		Username:    "alice",
		TopUpIds:    []int{ownTopUp.Id},
		InvoiceType: InvoiceTypeCompany,
		Title:       "Example Ltd",
		Email:       "finance@example.com",
	})
	require.ErrorIs(t, err, ErrInvoiceTaxNoRequired)
}

func TestInvoiceAdminStateTransitions(t *testing.T) {
	setupInvoiceModelTestDB(t)

	request := InvoiceRequest{
		UserId:      7,
		Username:    "alice",
		InvoiceType: InvoiceTypePersonal,
		Title:       "Alice",
		Email:       "alice@example.com",
		Amount:      10,
		Currency:    "USD",
		Status:      InvoiceStatusPending,
	}
	require.NoError(t, DB.Create(&request).Error)

	require.NoError(t, ApproveInvoiceRequest(request.Id, 100))
	updated, err := GetInvoiceRequestWithItems(request.Id, 0, true)
	require.NoError(t, err)
	require.Equal(t, InvoiceStatusApproved, updated.Status)
	require.Equal(t, 100, updated.ReviewedBy)

	require.NoError(t, IssueInvoiceRequest(request.Id, 100, InvoiceIssueInput{
		InvoiceNo:  "INV-20260509-001",
		InvoiceUrl: "https://example.com/invoices/INV-20260509-001.pdf",
		IssuedAt:   2000,
		IssueNote:  "sent by email",
	}))
	issued, err := GetInvoiceRequestWithItems(request.Id, 0, true)
	require.NoError(t, err)
	require.Equal(t, InvoiceStatusIssued, issued.Status)

	err = RejectInvoiceRequest(request.Id, 100, "wrong title")
	require.True(t, errors.Is(err, ErrInvoiceStatusTransition))
}
