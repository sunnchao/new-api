# Invoice Application and Real-Name Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained invoice application flow for successful online top-ups, plus personal and company real-name verification and reusable invoice profiles.

**Architecture:** Keep the invoice and real-name domains isolated from the existing top-up flow. New model, service, controller, and frontend feature files read `model.TopUp` as a read-only source, store invoice ownership and duplicate-prevention state in new tables, and expose a compact `/invoices` console page with an admin-only review tab.

**Tech Stack:** Go 1.22+, Gin, GORM, SQLite/MySQL/PostgreSQL, React 19, TypeScript, TanStack Router, React Query, Base UI/shadcn-style components, Tailwind CSS, Bun.

---

## Boundary Rules

- Do not modify `model/topup.go`, `controller/topup.go`, payment callback files, or existing top-up routes.
- Do not modify the `top_ups` schema.
- It is allowed to reference `model.TopUp` from new invoice model/service code.
- It is allowed to modify `model/main.go` only to register new invoice and real-name tables in `AutoMigrate`.
- It is allowed to modify `router/api-router.go` only to add new invoice and real-name route groups.
- All new Go JSON marshal/unmarshal calls must use `common.Marshal`, `common.Unmarshal`, `common.UnmarshalJsonStr`, or `common.DecodeJson`.
- Database code must use GORM and remain compatible with SQLite, MySQL 5.7.8+, and PostgreSQL 9.6+.

## File Structure

### Backend Files To Create

- `model/invoice.go` — invoice request, invoice item, invoice profile models, constants, validation helpers, read-only eligible top-up query, request creation, listing, detail, cancellation, and admin state transitions.
- `model/invoice_test.go` — model-level invoice migration, eligibility, duplicate prevention, ownership, profile, creation, and state transition tests.
- `model/realname.go` — user real-name verification model, constants, masking/hash helpers, status/profile helpers used by the provider callback flow.
- `model/realname_test.go` — model-level real-name migration, profile update, masking, and status transition tests.
- `service/realname/provider.go` — provider interface, request/result structs, registry, mock provider, and callback signature verification contract.
- `service/realname/provider_test.go` — provider registry and mock provider tests.
- `controller/invoice.go` — user invoice APIs, admin invoice APIs, invoice profile APIs, request/response DTOs, and parameter validation.
- `controller/invoice_test.go` — controller tests for user and admin invoice endpoints.
- `controller/realname.go` — real-name status, session creation, and callback endpoints.
- `controller/realname_test.go` — controller tests for personal/company sessions and callbacks.

### Backend Files To Modify

- `model/main.go` — add `InvoiceRequest`, `InvoiceRequestItem`, `UserInvoiceProfile`, and `UserRealNameVerification` to both migration paths.
- `router/api-router.go` — add `/api/invoice`, `/api/invoice/admin`, `/api/realname`, and `/api/realname/callback/:provider` route groups.

### Frontend Files To Create

- `web/default/src/features/invoices/types.ts` — invoice, top-up, profile, real-name, admin action, and page response types.
- `web/default/src/features/invoices/api.ts` — API functions for invoice, invoice profile, real-name status/session, and admin invoice actions.
- `web/default/src/features/invoices/i18n.ts` — feature-level translations for en, zh, fr, ja, ru, vi.
- `web/default/src/features/invoices/lib/format.ts` — money, date, invoice status, real-name status, and selected amount helpers.
- `web/default/src/features/invoices/index.tsx` — `/invoices` page shell with user tabs and admin-only tab.
- `web/default/src/features/invoices/components/invoice-profile-panel.tsx` — compact profile form for personal/company invoice information.
- `web/default/src/features/invoices/components/verification-status-panel.tsx` — personal/company verification status and session start controls.
- `web/default/src/features/invoices/components/eligible-topups-table.tsx` — selectable eligible top-up table and mobile list.
- `web/default/src/features/invoices/components/invoice-request-form.tsx` — invoice submit form and selected amount summary.
- `web/default/src/features/invoices/components/invoice-submit-confirm-dialog.tsx` — second confirmation requiring exact `确认开具发票`.
- `web/default/src/features/invoices/components/invoice-records-table.tsx` — current user's invoice request history.
- `web/default/src/features/invoices/components/admin-invoice-table.tsx` — admin review table.
- `web/default/src/features/invoices/components/admin-invoice-dialogs.tsx` — approve, reject, and issue dialogs.
- `web/default/src/routes/_authenticated/invoices/index.tsx` — TanStack route for `/invoices`.

### Frontend Files To Modify

- `web/default/src/i18n/config.ts` — merge `invoicesI18nResources` into all supported locales.
- `web/default/src/hooks/use-sidebar-data.ts` — add Personal navigation item `Invoices` using a lucide icon.
- `web/default/src/hooks/use-sidebar-config.ts` — add `personal.invoice` default and `/invoices` mapping.
- `web/default/src/features/system-settings/maintenance/config.ts` — add `personal.invoice` to sidebar module defaults.
- `web/default/src/features/system-settings/maintenance/sidebar-modules-section.tsx` — add title and description metadata for the invoice sidebar module.

---

## Task 1: Add Invoice Domain Schema And Model Behavior

**Files:**
- Create: `model/invoice.go`
- Create: `model/invoice_test.go`
- Modify: `model/main.go`
- Test: `model/invoice_test.go`

- [ ] **Step 1: Write the failing invoice model tests**

Create `model/invoice_test.go`:

```go
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
		InvoiceRequestId: request.Id,
		TopUpId:          used.Id,
		TradeNo:          used.TradeNo,
		Money:            used.Money,
		PaymentProvider:  used.PaymentProvider,
		PaymentMethod:    used.PaymentMethod,
		TopUpCreateTime:  used.CreateTime,
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
```

- [ ] **Step 2: Run the invoice model test and verify it fails**

Run:

```bash
go test ./model -run 'TestInvoice' -count=1
```

Expected: FAIL because `InvoiceRequest`, `InvoiceRequestItem`, `UserInvoiceProfile`, and invoice helper functions do not exist.

- [ ] **Step 3: Add invoice model implementation**

Create `model/invoice.go`:

```go
package model

import (
	"errors"
	"net/mail"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	InvoiceTypePersonal = "personal"
	InvoiceTypeCompany  = "company"

	InvoiceProfileSourceManual   = "manual"
	InvoiceProfileSourceVerified = "verified"

	InvoiceStatusPending   = "pending"
	InvoiceStatusApproved  = "approved"
	InvoiceStatusRejected  = "rejected"
	InvoiceStatusIssued    = "issued"
	InvoiceStatusCancelled = "cancelled"

	InvoiceCurrencyUSD     = "USD"
	MaxInvoiceTopUpItemSize = 50
)

var invoiceablePaymentProviders = []string{
	PaymentProviderEpay,
	PaymentProviderStripe,
	PaymentProviderCreem,
	PaymentProviderWaffo,
	PaymentProviderWaffoPancake,
}

var (
	ErrInvoiceTopUpRequired      = errors.New("invoice top-up ids are required")
	ErrInvoiceTopUpLimitExceeded = errors.New("invoice top-up selection exceeds limit")
	ErrInvoiceTopUpNotInvoiceable = errors.New("selected top-up is not invoiceable")
	ErrInvoiceTopUpAlreadyUsed   = errors.New("selected top-up has already been used")
	ErrInvoiceTypeInvalid        = errors.New("invoice type must be personal or company")
	ErrInvoiceTitleRequired      = errors.New("invoice title is required")
	ErrInvoiceTaxNoRequired      = errors.New("company invoice requires tax number")
	ErrInvoiceEmailInvalid       = errors.New("invoice email is invalid")
	ErrInvoiceNotFound           = errors.New("invoice request not found")
	ErrInvoiceStatusTransition   = errors.New("invoice status transition is not allowed")
	ErrInvoiceRejectReasonRequired = errors.New("reject reason is required")
	ErrInvoiceNumberRequired     = errors.New("invoice number is required")
)

type InvoiceRequest struct {
	Id                     int     `json:"id"`
	UserId                 int     `json:"user_id" gorm:"index;not null"`
	Username               string  `json:"username" gorm:"type:varchar(128);not null;default:'';index"`
	InvoiceType            string  `json:"invoice_type" gorm:"type:varchar(16);not null;index"`
	ProfileSource          string  `json:"profile_source" gorm:"type:varchar(16);not null;default:'manual'"`
	RealNameVerificationId *int    `json:"realname_verification_id" gorm:"index"`
	Title                  string  `json:"title" gorm:"type:varchar(255);not null"`
	TaxNo                  string  `json:"tax_no" gorm:"type:varchar(64);not null;default:'';index"`
	Email                  string  `json:"email" gorm:"type:varchar(255);not null;default:''"`
	Phone                  string  `json:"phone" gorm:"type:varchar(64);not null;default:''"`
	Amount                 float64 `json:"amount" gorm:"type:decimal(10,2);not null;default:0"`
	Currency               string  `json:"currency" gorm:"type:varchar(8);not null;default:'USD'"`
	Status                 string  `json:"status" gorm:"type:varchar(16);not null;index"`
	Remark                 string  `json:"remark" gorm:"type:text;not null;default:''"`
	RejectReason           string  `json:"reject_reason" gorm:"type:text;not null;default:''"`
	InvoiceNo              string  `json:"invoice_no" gorm:"type:varchar(128);not null;default:''"`
	InvoiceUrl             string  `json:"invoice_url" gorm:"type:text;not null;default:''"`
	IssueNote              string  `json:"issue_note" gorm:"type:text;not null;default:''"`
	IssuedAt               int64   `json:"issued_at" gorm:"bigint;not null;default:0"`
	ReviewedBy             int     `json:"reviewed_by" gorm:"index;not null;default:0"`
	ReviewedAt             int64   `json:"reviewed_at" gorm:"bigint;not null;default:0"`
	CreatedAt              int64   `json:"created_at" gorm:"bigint;index"`
	UpdatedAt              int64   `json:"updated_at" gorm:"bigint"`
	Items                  []InvoiceRequestItem `json:"items,omitempty" gorm:"foreignKey:InvoiceRequestId"`
}

func (r *InvoiceRequest) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	r.CreatedAt = now
	r.UpdatedAt = now
	if r.Currency == "" {
		r.Currency = InvoiceCurrencyUSD
	}
	if r.Status == "" {
		r.Status = InvoiceStatusPending
	}
	if r.ProfileSource == "" {
		r.ProfileSource = InvoiceProfileSourceManual
	}
	return nil
}

func (r *InvoiceRequest) BeforeUpdate(tx *gorm.DB) error {
	r.UpdatedAt = common.GetTimestamp()
	return nil
}

type InvoiceRequestItem struct {
	Id                 int     `json:"id"`
	InvoiceRequestId   int     `json:"invoice_request_id" gorm:"index;not null"`
	TopUpId            int     `json:"topup_id" gorm:"uniqueIndex;not null"`
	TradeNo            string  `json:"trade_no" gorm:"type:varchar(255);not null;index"`
	Money              float64 `json:"money" gorm:"type:decimal(10,2);not null;default:0"`
	PaymentProvider    string  `json:"payment_provider" gorm:"type:varchar(50);not null;default:''"`
	PaymentMethod      string  `json:"payment_method" gorm:"type:varchar(50);not null;default:''"`
	TopUpCreateTime    int64   `json:"topup_create_time" gorm:"bigint;not null;default:0"`
	TopUpCompleteTime  int64   `json:"topup_complete_time" gorm:"bigint;not null;default:0"`
	CreatedAt          int64   `json:"created_at" gorm:"bigint"`
}

func (i *InvoiceRequestItem) BeforeCreate(tx *gorm.DB) error {
	i.CreatedAt = common.GetTimestamp()
	return nil
}

type UserInvoiceProfile struct {
	Id                     int    `json:"id"`
	UserId                 int    `json:"user_id" gorm:"index;uniqueIndex:idx_user_invoice_profile_type;not null"`
	InvoiceType            string `json:"invoice_type" gorm:"type:varchar(16);uniqueIndex:idx_user_invoice_profile_type;not null"`
	Source                 string `json:"source" gorm:"type:varchar(16);not null;default:'manual'"`
	RealNameVerificationId *int   `json:"realname_verification_id" gorm:"index"`
	Title                  string `json:"title" gorm:"type:varchar(255);not null;default:''"`
	TaxNo                  string `json:"tax_no" gorm:"type:varchar(64);not null;default:''"`
	Email                  string `json:"email" gorm:"type:varchar(255);not null;default:''"`
	Phone                  string `json:"phone" gorm:"type:varchar(64);not null;default:''"`
	BankName               string `json:"bank_name" gorm:"type:varchar(255);not null;default:''"`
	BankAccount            string `json:"bank_account" gorm:"type:varchar(128);not null;default:''"`
	RegisteredAddress      string `json:"registered_address" gorm:"type:varchar(255);not null;default:''"`
	RegisteredPhone        string `json:"registered_phone" gorm:"type:varchar(64);not null;default:''"`
	IsDefault              bool   `json:"is_default" gorm:"default:true"`
	CreatedAt              int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt              int64  `json:"updated_at" gorm:"bigint"`
}

func (p *UserInvoiceProfile) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	p.CreatedAt = now
	p.UpdatedAt = now
	if p.Source == "" {
		p.Source = InvoiceProfileSourceManual
	}
	p.IsDefault = true
	return nil
}

func (p *UserInvoiceProfile) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = common.GetTimestamp()
	return nil
}

type InvoiceCreateInput struct {
	UserId      int
	Username    string
	TopUpIds    []int
	InvoiceType string
	Title       string
	TaxNo       string
	Email       string
	Phone       string
	Remark      string
}

type InvoiceIssueInput struct {
	InvoiceNo  string
	InvoiceUrl string
	IssuedAt   int64
	IssueNote  string
}

func NormalizeInvoiceType(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func IsValidInvoiceType(value string) bool {
	value = NormalizeInvoiceType(value)
	return value == InvoiceTypePersonal || value == InvoiceTypeCompany
}

func validateInvoiceCreateInput(input InvoiceCreateInput) error {
	if len(input.TopUpIds) == 0 {
		return ErrInvoiceTopUpRequired
	}
	if len(input.TopUpIds) > MaxInvoiceTopUpItemSize {
		return ErrInvoiceTopUpLimitExceeded
	}
	if !IsValidInvoiceType(input.InvoiceType) {
		return ErrInvoiceTypeInvalid
	}
	if strings.TrimSpace(input.Title) == "" {
		return ErrInvoiceTitleRequired
	}
	if NormalizeInvoiceType(input.InvoiceType) == InvoiceTypeCompany && strings.TrimSpace(input.TaxNo) == "" {
		return ErrInvoiceTaxNoRequired
	}
	if strings.TrimSpace(input.Email) != "" {
		if _, err := mail.ParseAddress(strings.TrimSpace(input.Email)); err != nil {
			return ErrInvoiceEmailInvalid
		}
	}
	return nil
}

func invoiceableTopUpQuery(tx *gorm.DB, userID int) *gorm.DB {
	usedSubQuery := tx.Model(&InvoiceRequestItem{}).Select("topup_id")
	return tx.Model(&TopUp{}).
		Where("user_id = ?", userID).
		Where("status = ?", common.TopUpStatusSuccess).
		Where("amount > 0").
		Where("money > 0").
		Where("payment_provider IN ?", invoiceablePaymentProviders).
		Where("id NOT IN (?)", usedSubQuery)
}

func ListEligibleInvoiceTopUps(userID int, keyword string, offset int, limit int) ([]TopUp, int64, error) {
	var total int64
	query := invoiceableTopUpQuery(DB, userID)
	if strings.TrimSpace(keyword) != "" {
		like := "%" + strings.TrimSpace(keyword) + "%"
		query = query.Where("trade_no LIKE ? OR payment_provider LIKE ? OR payment_method LIKE ?", like, like, like)
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []TopUp
	if err := query.Order("id desc").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func loadDefaultInvoiceProfile(tx *gorm.DB, userID int, invoiceType string) (*UserInvoiceProfile, error) {
	var profile UserInvoiceProfile
	err := tx.Where("user_id = ? AND invoice_type = ? AND is_default = ?", userID, invoiceType, true).First(&profile).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func CreateInvoiceRequest(input InvoiceCreateInput) (*InvoiceRequest, error) {
	input.InvoiceType = NormalizeInvoiceType(input.InvoiceType)
	input.Title = strings.TrimSpace(input.Title)
	input.TaxNo = strings.TrimSpace(input.TaxNo)
	input.Email = strings.TrimSpace(input.Email)
	input.Phone = strings.TrimSpace(input.Phone)
	input.Remark = strings.TrimSpace(input.Remark)

	if err := validateInvoiceCreateInput(input); err != nil {
		return nil, err
	}

	var created InvoiceRequest
	err := DB.Transaction(func(tx *gorm.DB) error {
		var topUps []TopUp
		if err := invoiceableTopUpQuery(tx, input.UserId).Where("id IN ?", input.TopUpIds).Order("id asc").Find(&topUps).Error; err != nil {
			return err
		}
		if len(topUps) != len(input.TopUpIds) {
			return ErrInvoiceTopUpNotInvoiceable
		}

		profile, err := loadDefaultInvoiceProfile(tx, input.UserId, input.InvoiceType)
		if err != nil {
			return err
		}

		profileSource := InvoiceProfileSourceManual
		var verificationID *int
		if profile != nil && profile.Source == InvoiceProfileSourceVerified {
			profileSource = InvoiceProfileSourceVerified
			verificationID = profile.RealNameVerificationId
		}

		total := 0.0
		for _, topUp := range topUps {
			total += topUp.Money
		}

		created = InvoiceRequest{
			UserId:                 input.UserId,
			Username:               input.Username,
			InvoiceType:            input.InvoiceType,
			ProfileSource:          profileSource,
			RealNameVerificationId: verificationID,
			Title:                  input.Title,
			TaxNo:                  input.TaxNo,
			Email:                  input.Email,
			Phone:                  input.Phone,
			Amount:                 total,
			Currency:               InvoiceCurrencyUSD,
			Status:                 InvoiceStatusPending,
			Remark:                 input.Remark,
		}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}

		for _, topUp := range topUps {
			item := InvoiceRequestItem{
				InvoiceRequestId:   created.Id,
				TopUpId:            topUp.Id,
				TradeNo:            topUp.TradeNo,
				Money:              topUp.Money,
				PaymentProvider:    topUp.PaymentProvider,
				PaymentMethod:      topUp.PaymentMethod,
				TopUpCreateTime:    topUp.CreateTime,
				TopUpCompleteTime:  topUp.CompleteTime,
			}
			if err := tx.Create(&item).Error; err != nil {
				if strings.Contains(strings.ToLower(err.Error()), "unique") || strings.Contains(strings.ToLower(err.Error()), "duplicate") {
					return ErrInvoiceTopUpAlreadyUsed
				}
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &created, nil
}

func ListUserInvoiceRequests(userID int, status string, offset int, limit int) ([]InvoiceRequest, int64, error) {
	query := DB.Model(&InvoiceRequest{}).Where("user_id = ?", userID)
	if strings.TrimSpace(status) != "" {
		query = query.Where("status = ?", strings.TrimSpace(status))
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []InvoiceRequest
	if err := query.Order("id desc").Limit(limit).Offset(offset).Preload("Items").Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func ListAdminInvoiceRequests(status string, keyword string, offset int, limit int) ([]InvoiceRequest, int64, error) {
	query := DB.Model(&InvoiceRequest{})
	if strings.TrimSpace(status) != "" {
		query = query.Where("status = ?", strings.TrimSpace(status))
	}
	if strings.TrimSpace(keyword) != "" {
		like := "%" + strings.TrimSpace(keyword) + "%"
		itemSubQuery := DB.Model(&InvoiceRequestItem{}).Select("invoice_request_id").Where("trade_no LIKE ?", like)
		query = query.Where("username LIKE ? OR title LIKE ? OR tax_no LIKE ? OR id IN (?)", like, like, like, itemSubQuery)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []InvoiceRequest
	if err := query.Order("id desc").Limit(limit).Offset(offset).Preload("Items").Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func GetInvoiceRequestWithItems(id int, userID int, admin bool) (*InvoiceRequest, error) {
	var request InvoiceRequest
	query := DB.Preload("Items").Where("id = ?", id)
	if !admin {
		query = query.Where("user_id = ?", userID)
	}
	if err := query.First(&request).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvoiceNotFound
		}
		return nil, err
	}
	return &request, nil
}

func CancelInvoiceRequest(id int, userID int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		var request InvoiceRequest
		if err := tx.Where("id = ? AND user_id = ?", id, userID).First(&request).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInvoiceNotFound
			}
			return err
		}
		if request.Status != InvoiceStatusPending {
			return ErrInvoiceStatusTransition
		}
		return tx.Model(&request).Updates(map[string]interface{}{"status": InvoiceStatusCancelled}).Error
	})
}

func ApproveInvoiceRequest(id int, operatorID int) error {
	return updateInvoiceStatus(id, InvoiceStatusPending, map[string]interface{}{
		"status":      InvoiceStatusApproved,
		"reviewed_by": operatorID,
		"reviewed_at": common.GetTimestamp(),
	})
}

func RejectInvoiceRequest(id int, operatorID int, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return ErrInvoiceRejectReasonRequired
	}
	return updateInvoiceStatus(id, InvoiceStatusPending, map[string]interface{}{
		"status":        InvoiceStatusRejected,
		"reject_reason": reason,
		"reviewed_by":   operatorID,
		"reviewed_at":   common.GetTimestamp(),
	})
}

func IssueInvoiceRequest(id int, operatorID int, input InvoiceIssueInput) error {
	if strings.TrimSpace(input.InvoiceNo) == "" {
		return ErrInvoiceNumberRequired
	}
	issuedAt := input.IssuedAt
	if issuedAt == 0 {
		issuedAt = common.GetTimestamp()
	}
	return updateInvoiceStatus(id, InvoiceStatusApproved, map[string]interface{}{
		"status":      InvoiceStatusIssued,
		"invoice_no":  strings.TrimSpace(input.InvoiceNo),
		"invoice_url": strings.TrimSpace(input.InvoiceUrl),
		"issued_at":   issuedAt,
		"issue_note":  strings.TrimSpace(input.IssueNote),
		"reviewed_by": operatorID,
		"reviewed_at": common.GetTimestamp(),
	})
}

func updateInvoiceStatus(id int, fromStatus string, values map[string]interface{}) error {
	result := DB.Model(&InvoiceRequest{}).Where("id = ? AND status = ?", id, fromStatus).Updates(values)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		var count int64
		if err := DB.Model(&InvoiceRequest{}).Where("id = ?", id).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return ErrInvoiceNotFound
		}
		return ErrInvoiceStatusTransition
	}
	return nil
}
```

- [ ] **Step 4: Register invoice models in migrations**

Modify `model/main.go` in both `migrateDB()` and `migrateDBFast()` by adding the new models after `&TopUp{}`:

```go
		&TopUp{},
		&InvoiceRequest{},
		&InvoiceRequestItem{},
		&UserInvoiceProfile{},
```

and in the `migrations := []struct { ... }` list:

```go
		{&TopUp{}, "TopUp"},
		{&InvoiceRequest{}, "InvoiceRequest"},
		{&InvoiceRequestItem{}, "InvoiceRequestItem"},
		{&UserInvoiceProfile{}, "UserInvoiceProfile"},
```

- [ ] **Step 5: Run invoice model tests**

Run:

```bash
go test ./model -run 'TestInvoice' -count=1
```

Expected: PASS.

- [ ] **Step 6: Commit invoice model work**

Run:

```bash
git add model/invoice.go model/invoice_test.go model/main.go
git commit -m "Add invoice domain models"
```

---

## Task 2: Add Real-Name Domain Schema And Provider Layer

**Files:**
- Create: `model/realname.go`
- Create: `model/realname_test.go`
- Create: `service/realname/provider.go`
- Create: `service/realname/provider_test.go`
- Modify: `model/main.go`
- Test: `model/realname_test.go`, `service/realname/provider_test.go`

- [ ] **Step 1: Write failing real-name model tests**

Create `model/realname_test.go`:

```go
package model

import (
	"fmt"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupRealNameModelTestDB(t *testing.T) *gorm.DB {
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

	require.NoError(t, db.AutoMigrate(&UserRealNameVerification{}, &UserInvoiceProfile{}))
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestRealNameDomainAutoMigrateSQLite(t *testing.T) {
	db := setupRealNameModelTestDB(t)

	require.True(t, db.Migrator().HasTable(&UserRealNameVerification{}))
	require.True(t, db.Migrator().HasColumn(&UserRealNameVerification{}, "id_no_hash"))
	require.True(t, db.Migrator().HasColumn(&UserRealNameVerification{}, "raw_payload_encrypted"))
}

func TestMaskSensitiveIdentifier(t *testing.T) {
	require.Equal(t, "110***********1234", MaskSensitiveIdentifier("110101199001011234"))
	require.Equal(t, "AB****YZ", MaskSensitiveIdentifier("ABCDEFGYZ"))
	require.Equal(t, "****", MaskSensitiveIdentifier("1234"))
}

func TestCreateRealNameSessionAndApplyVerifiedPersonalProfile(t *testing.T) {
	setupRealNameModelTestDB(t)

	verification, err := CreateRealNameVerificationSession(7, VerifyTypePersonal, "mock", "mock-req-1")
	require.NoError(t, err)
	require.Equal(t, RealNameStatusPending, verification.Status)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		Provider:                "mock",
		ProviderRequestId:       "mock-req-1",
		Status:                  RealNameStatusVerified,
		VerifiedName:            "Alice",
		IdNo:                    "110101199001011234",
		ProviderResultCode:      "OK",
		ProviderResultMessage:   "verified",
		RawPayloadEncrypted:     "encrypted-payload",
	})
	require.NoError(t, err)

	updated, err := GetRealNameVerificationByProviderRequest("mock", "mock-req-1")
	require.NoError(t, err)
	require.Equal(t, RealNameStatusVerified, updated.Status)
	require.Equal(t, "110***********1234", updated.IdNoMasked)
	require.NotEmpty(t, updated.IdNoHash)

	profiles, err := GetUserInvoiceProfiles(7)
	require.NoError(t, err)
	require.NotNil(t, profiles.Personal)
	require.Equal(t, "Alice", profiles.Personal.Title)
	require.Equal(t, InvoiceProfileSourceVerified, profiles.Personal.Source)
}

func TestApplyVerifiedCompanyProfile(t *testing.T) {
	setupRealNameModelTestDB(t)

	verification, err := CreateRealNameVerificationSession(7, VerifyTypeCompany, "mock", "mock-company-1")
	require.NoError(t, err)
	require.Equal(t, VerifyTypeCompany, verification.VerifyType)

	err = ApplyRealNameVerificationResult(RealNameVerificationResultInput{
		Provider:                "mock",
		ProviderRequestId:       "mock-company-1",
		Status:                  RealNameStatusVerified,
		CompanyName:             "Example Ltd",
		CreditCode:              "91310000MA1K00000X",
		LegalPersonName:         "Bob",
		ProviderResultCode:      "OK",
		ProviderResultMessage:   "verified",
	})
	require.NoError(t, err)

	profiles, err := GetUserInvoiceProfiles(7)
	require.NoError(t, err)
	require.NotNil(t, profiles.Company)
	require.Equal(t, "Example Ltd", profiles.Company.Title)
	require.Equal(t, "91310000MA1K00000X", profiles.Company.TaxNo)
}
```

- [ ] **Step 2: Run real-name model tests and verify failure**

Run:

```bash
go test ./model -run 'TestRealName|TestMaskSensitiveIdentifier|TestCreateRealNameSession|TestApplyVerifiedCompanyProfile' -count=1
```

Expected: FAIL because `UserRealNameVerification` and helper functions do not exist.

- [ ] **Step 3: Add real-name model implementation**

Create `model/realname.go`:

```go
package model

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	VerifyTypePersonal = "personal"
	VerifyTypeCompany  = "company"

	RealNameStatusUnverified = "unverified"
	RealNameStatusPending    = "pending"
	RealNameStatusVerified   = "verified"
	RealNameStatusFailed     = "failed"
	RealNameStatusExpired    = "expired"
)

var (
	ErrRealNameVerifyTypeInvalid = errors.New("real-name verification type must be personal or company")
	ErrRealNameStatusInvalid     = errors.New("real-name verification status is invalid")
	ErrRealNameVerificationNotFound = errors.New("real-name verification not found")
)

type UserRealNameVerification struct {
	Id                    int    `json:"id"`
	UserId                int    `json:"user_id" gorm:"index;not null"`
	VerifyType            string `json:"verify_type" gorm:"type:varchar(16);not null;index"`
	Provider              string `json:"provider" gorm:"type:varchar(32);not null;index"`
	ProviderRequestId     string `json:"provider_request_id" gorm:"type:varchar(128);not null;uniqueIndex"`
	Status                string `json:"status" gorm:"type:varchar(16);not null;index"`
	VerifiedName          string `json:"verified_name" gorm:"type:varchar(255);not null;default:''"`
	CompanyName           string `json:"company_name" gorm:"type:varchar(255);not null;default:''"`
	IdNoMasked            string `json:"id_no_masked" gorm:"type:varchar(64);not null;default:''"`
	IdNoHash              string `json:"-" gorm:"type:varchar(128);not null;default:''"`
	CreditCode            string `json:"credit_code" gorm:"type:varchar(64);not null;default:''"`
	CreditCodeHash        string `json:"-" gorm:"type:varchar(128);not null;default:''"`
	LegalPersonNameMasked string `json:"legal_person_name_masked" gorm:"type:varchar(255);not null;default:''"`
	ProviderResultCode    string `json:"provider_result_code" gorm:"type:varchar(64);not null;default:''"`
	ProviderResultMessage string `json:"provider_result_message" gorm:"type:varchar(255);not null;default:''"`
	RawPayloadEncrypted   string `json:"-" gorm:"type:text;not null;default:''"`
	StartedAt             int64  `json:"started_at" gorm:"bigint;not null;default:0"`
	VerifiedAt            int64  `json:"verified_at" gorm:"bigint;not null;default:0"`
	ExpiredAt             int64  `json:"expired_at" gorm:"bigint;not null;default:0"`
	CreatedAt             int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt             int64  `json:"updated_at" gorm:"bigint"`
}

func (v *UserRealNameVerification) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	v.CreatedAt = now
	v.UpdatedAt = now
	if v.StartedAt == 0 {
		v.StartedAt = now
	}
	if v.Status == "" {
		v.Status = RealNameStatusPending
	}
	return nil
}

func (v *UserRealNameVerification) BeforeUpdate(tx *gorm.DB) error {
	v.UpdatedAt = common.GetTimestamp()
	return nil
}

type InvoiceProfiles struct {
	Personal *UserInvoiceProfile `json:"personal"`
	Company  *UserInvoiceProfile `json:"company"`
}

type RealNameVerificationResultInput struct {
	Provider              string
	ProviderRequestId     string
	Status                string
	VerifiedName          string
	CompanyName           string
	IdNo                  string
	CreditCode            string
	LegalPersonName       string
	ProviderResultCode    string
	ProviderResultMessage string
	RawPayloadEncrypted   string
}

func IsValidVerifyType(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == VerifyTypePersonal || value == VerifyTypeCompany
}

func IsValidRealNameResultStatus(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	return value == RealNameStatusVerified || value == RealNameStatusFailed || value == RealNameStatusExpired
}

func MaskSensitiveIdentifier(value string) string {
	value = strings.TrimSpace(value)
	if len(value) <= 4 {
		return "****"
	}
	if len(value) <= 8 {
		return value[:2] + strings.Repeat("*", len(value)-4) + value[len(value)-2:]
	}
	return value[:3] + strings.Repeat("*", len(value)-7) + value[len(value)-4:]
}

func CreateRealNameVerificationSession(userID int, verifyType string, provider string, providerRequestID string) (*UserRealNameVerification, error) {
	verifyType = strings.ToLower(strings.TrimSpace(verifyType))
	provider = strings.TrimSpace(provider)
	providerRequestID = strings.TrimSpace(providerRequestID)
	if !IsValidVerifyType(verifyType) {
		return nil, ErrRealNameVerifyTypeInvalid
	}
	verification := UserRealNameVerification{
		UserId:            userID,
		VerifyType:        verifyType,
		Provider:          provider,
		ProviderRequestId: providerRequestID,
		Status:            RealNameStatusPending,
		StartedAt:         common.GetTimestamp(),
	}
	if err := DB.Create(&verification).Error; err != nil {
		return nil, err
	}
	return &verification, nil
}

func GetRealNameVerificationByProviderRequest(provider string, providerRequestID string) (*UserRealNameVerification, error) {
	var verification UserRealNameVerification
	err := DB.Where("provider = ? AND provider_request_id = ?", provider, providerRequestID).First(&verification).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRealNameVerificationNotFound
	}
	if err != nil {
		return nil, err
	}
	return &verification, nil
}

func GetUserRealNameStatus(userID int) (map[string]*UserRealNameVerification, error) {
	var rows []UserRealNameVerification
	if err := DB.Where("user_id = ?", userID).Order("id desc").Find(&rows).Error; err != nil {
		return nil, err
	}
	result := map[string]*UserRealNameVerification{
		VerifyTypePersonal: nil,
		VerifyTypeCompany:  nil,
	}
	for i := range rows {
		row := rows[i]
		if result[row.VerifyType] == nil {
			result[row.VerifyType] = &row
		}
	}
	return result, nil
}

func GetUserInvoiceProfiles(userID int) (InvoiceProfiles, error) {
	var rows []UserInvoiceProfile
	if err := DB.Where("user_id = ?", userID).Find(&rows).Error; err != nil {
		return InvoiceProfiles{}, err
	}
	var profiles InvoiceProfiles
	for i := range rows {
		row := rows[i]
		switch row.InvoiceType {
		case InvoiceTypePersonal:
			profiles.Personal = &row
		case InvoiceTypeCompany:
			profiles.Company = &row
		}
	}
	return profiles, nil
}

func UpsertManualInvoiceProfile(profile UserInvoiceProfile) (*UserInvoiceProfile, error) {
	profile.InvoiceType = NormalizeInvoiceType(profile.InvoiceType)
	if !IsValidInvoiceType(profile.InvoiceType) {
		return nil, ErrInvoiceTypeInvalid
	}
	profile.Source = InvoiceProfileSourceManual
	profile.IsDefault = true

	var existing UserInvoiceProfile
	err := DB.Where("user_id = ? AND invoice_type = ?", profile.UserId, profile.InvoiceType).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := DB.Create(&profile).Error; err != nil {
			return nil, err
		}
		return &profile, nil
	}
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"source":             InvoiceProfileSourceManual,
		"real_name_verification_id": nil,
		"title":              strings.TrimSpace(profile.Title),
		"tax_no":             strings.TrimSpace(profile.TaxNo),
		"email":              strings.TrimSpace(profile.Email),
		"phone":              strings.TrimSpace(profile.Phone),
		"bank_name":          strings.TrimSpace(profile.BankName),
		"bank_account":       strings.TrimSpace(profile.BankAccount),
		"registered_address": strings.TrimSpace(profile.RegisteredAddress),
		"registered_phone":   strings.TrimSpace(profile.RegisteredPhone),
		"is_default":         true,
	}
	if err := DB.Model(&existing).Updates(updates).Error; err != nil {
		return nil, err
	}
	return GetInvoiceProfile(profile.UserId, profile.InvoiceType)
}

func GetInvoiceProfile(userID int, invoiceType string) (*UserInvoiceProfile, error) {
	var profile UserInvoiceProfile
	err := DB.Where("user_id = ? AND invoice_type = ?", userID, NormalizeInvoiceType(invoiceType)).First(&profile).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func ApplyRealNameVerificationResult(input RealNameVerificationResultInput) error {
	input.Provider = strings.TrimSpace(input.Provider)
	input.ProviderRequestId = strings.TrimSpace(input.ProviderRequestId)
	input.Status = strings.ToLower(strings.TrimSpace(input.Status))
	if !IsValidRealNameResultStatus(input.Status) {
		return ErrRealNameStatusInvalid
	}

	return DB.Transaction(func(tx *gorm.DB) error {
		var verification UserRealNameVerification
		err := tx.Where("provider = ? AND provider_request_id = ?", input.Provider, input.ProviderRequestId).First(&verification).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRealNameVerificationNotFound
		}
		if err != nil {
			return err
		}

		updates := map[string]interface{}{
			"status":                  input.Status,
			"provider_result_code":    strings.TrimSpace(input.ProviderResultCode),
			"provider_result_message": strings.TrimSpace(input.ProviderResultMessage),
			"raw_payload_encrypted":   strings.TrimSpace(input.RawPayloadEncrypted),
		}
		if input.Status == RealNameStatusVerified {
			updates["verified_at"] = common.GetTimestamp()
			updates["verified_name"] = strings.TrimSpace(input.VerifiedName)
			updates["company_name"] = strings.TrimSpace(input.CompanyName)
			if strings.TrimSpace(input.IdNo) != "" {
				updates["id_no_masked"] = MaskSensitiveIdentifier(input.IdNo)
				updates["id_no_hash"] = common.GenerateHMAC(input.IdNo)
			}
			if strings.TrimSpace(input.CreditCode) != "" {
				updates["credit_code"] = strings.TrimSpace(input.CreditCode)
				updates["credit_code_hash"] = common.GenerateHMAC(input.CreditCode)
			}
			if strings.TrimSpace(input.LegalPersonName) != "" {
				updates["legal_person_name_masked"] = MaskSensitiveIdentifier(input.LegalPersonName)
			}
		}
		if err := tx.Model(&verification).Updates(updates).Error; err != nil {
			return err
		}
		if input.Status != RealNameStatusVerified {
			return nil
		}

		var profile UserInvoiceProfile
		profileType := InvoiceTypePersonal
		title := strings.TrimSpace(input.VerifiedName)
		taxNo := ""
		if verification.VerifyType == VerifyTypeCompany {
			profileType = InvoiceTypeCompany
			title = strings.TrimSpace(input.CompanyName)
			taxNo = strings.TrimSpace(input.CreditCode)
		}
		verificationID := verification.Id
		err = tx.Where("user_id = ? AND invoice_type = ?", verification.UserId, profileType).First(&profile).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			profile = UserInvoiceProfile{
				UserId:                 verification.UserId,
				InvoiceType:            profileType,
				Source:                 InvoiceProfileSourceVerified,
				RealNameVerificationId: &verificationID,
				Title:                  title,
				TaxNo:                  taxNo,
				IsDefault:              true,
			}
			return tx.Create(&profile).Error
		}
		if err != nil {
			return err
		}
		return tx.Model(&profile).Updates(map[string]interface{}{
			"source":                    InvoiceProfileSourceVerified,
			"real_name_verification_id": verificationID,
			"title":                     title,
			"tax_no":                    taxNo,
			"is_default":                true,
		}).Error
	})
}
```

- [ ] **Step 4: Register real-name model in migrations**

Modify `model/main.go` in both migration paths by adding `&UserRealNameVerification{}` after `&UserInvoiceProfile{}`:

```go
		&InvoiceRequest{},
		&InvoiceRequestItem{},
		&UserInvoiceProfile{},
		&UserRealNameVerification{},
```

and:

```go
		{&InvoiceRequest{}, "InvoiceRequest"},
		{&InvoiceRequestItem{}, "InvoiceRequestItem"},
		{&UserInvoiceProfile{}, "UserInvoiceProfile"},
		{&UserRealNameVerification{}, "UserRealNameVerification"},
```

- [ ] **Step 5: Write failing provider tests**

Create `service/realname/provider_test.go`:

```go
package realname

import (
	"context"
	"testing"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/require"
)

func TestMockProviderCreatesSession(t *testing.T) {
	provider := MockProvider{}
	session, err := provider.CreateSession(context.Background(), CreateSessionRequest{
		UserID:     7,
		VerifyType: model.VerifyTypePersonal,
	})
	require.NoError(t, err)
	require.Equal(t, "mock", provider.ProviderName())
	require.NotEmpty(t, session.ProviderRequestID)
	require.Contains(t, session.RedirectURL, "/realname/mock/")
}

func TestProviderRegistry(t *testing.T) {
	RegisterProvider(MockProvider{})
	provider, ok := GetProvider("mock")
	require.True(t, ok)
	require.Equal(t, "mock", provider.ProviderName())
}

func TestMockProviderRejectsInvalidSignature(t *testing.T) {
	provider := MockProvider{}
	_, err := provider.VerifyCallback(context.Background(), CallbackRequest{
		ProviderRequestID: "mock-1",
		Status:            model.RealNameStatusVerified,
		Signature:         "bad-signature",
	})
	require.ErrorIs(t, err, ErrInvalidSignature)
}
```

- [ ] **Step 6: Run provider tests and verify failure**

Run:

```bash
go test ./service/realname -count=1
```

Expected: FAIL because `service/realname` does not exist.

- [ ] **Step 7: Add provider abstraction and mock provider**

Create `service/realname/provider.go`:

```go
package realname

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const MockCallbackSignature = "mock-valid-signature"

var (
	ErrUnsupportedProvider = errors.New("unsupported real-name provider")
	ErrInvalidSignature    = errors.New("invalid real-name callback signature")
)

type CreateSessionRequest struct {
	UserID     int
	VerifyType string
}

type Session struct {
	Provider          string                 `json:"provider"`
	ProviderRequestID string                 `json:"provider_request_id"`
	RedirectURL       string                 `json:"redirect_url"`
	QRCodeURL         string                 `json:"qr_code_url"`
	Metadata          map[string]interface{} `json:"metadata"`
}

type CallbackRequest struct {
	ProviderRequestID string
	Status            string
	VerifiedName      string
	CompanyName       string
	IdNo              string
	CreditCode        string
	LegalPersonName   string
	ResultCode        string
	ResultMessage     string
	RawPayload        string
	Signature         string
}

type CallbackResult struct {
	ProviderRequestID string
	Status            string
	VerifiedName      string
	CompanyName       string
	IdNo              string
	CreditCode        string
	LegalPersonName   string
	ResultCode        string
	ResultMessage     string
	RawPayload        string
}

type Provider interface {
	ProviderName() string
	CreateSession(ctx context.Context, request CreateSessionRequest) (Session, error)
	VerifyCallback(ctx context.Context, request CallbackRequest) (CallbackResult, error)
}

var providers = map[string]Provider{}

func RegisterProvider(provider Provider) {
	providers[provider.ProviderName()] = provider
}

func GetProvider(name string) (Provider, bool) {
	provider, ok := providers[strings.TrimSpace(name)]
	return provider, ok
}

type MockProvider struct{}

func (MockProvider) ProviderName() string {
	return "mock"
}

func (p MockProvider) CreateSession(ctx context.Context, request CreateSessionRequest) (Session, error) {
	if !model.IsValidVerifyType(request.VerifyType) {
		return Session{}, model.ErrRealNameVerifyTypeInvalid
	}
	providerRequestID := "mock-" + common.GetUUID()
	return Session{
		Provider:          p.ProviderName(),
		ProviderRequestID: providerRequestID,
		RedirectURL:       fmt.Sprintf("/realname/mock/%s", providerRequestID),
		QRCodeURL:         "",
		Metadata: map[string]interface{}{
			"verify_type": request.VerifyType,
		},
	}, nil
}

func (p MockProvider) VerifyCallback(ctx context.Context, request CallbackRequest) (CallbackResult, error) {
	if request.Signature != MockCallbackSignature {
		return CallbackResult{}, ErrInvalidSignature
	}
	return CallbackResult{
		ProviderRequestID: request.ProviderRequestID,
		Status:            request.Status,
		VerifiedName:      request.VerifiedName,
		CompanyName:       request.CompanyName,
		IdNo:              request.IdNo,
		CreditCode:        request.CreditCode,
		LegalPersonName:   request.LegalPersonName,
		ResultCode:        request.ResultCode,
		ResultMessage:     request.ResultMessage,
		RawPayload:        request.RawPayload,
	}, nil
}

func init() {
	RegisterProvider(MockProvider{})
}
```

- [ ] **Step 8: Run model and provider tests**

Run:

```bash
go test ./model -run 'TestRealName|TestMaskSensitiveIdentifier|TestCreateRealNameSession|TestApplyVerifiedCompanyProfile' -count=1
go test ./service/realname -count=1
```

Expected: PASS.

- [ ] **Step 9: Commit real-name model and provider work**

Run:

```bash
git add model/realname.go model/realname_test.go model/main.go service/realname/provider.go service/realname/provider_test.go
git commit -m "Add real-name verification domain"
```

---

## Task 3: Add Invoice, Profile, And Real-Name Controllers And Routes

**Files:**
- Create: `controller/invoice.go`
- Create: `controller/invoice_test.go`
- Create: `controller/realname.go`
- Create: `controller/realname_test.go`
- Modify: `router/api-router.go`
- Test: `controller/invoice_test.go`, `controller/realname_test.go`

- [ ] **Step 1: Write controller tests for invoice endpoints**

Create `controller/invoice_test.go`:

```go
package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type invoiceAPIResponse struct {
	Success bool              `json:"success"`
	Message string            `json:"message"`
	Data    json.RawMessage   `json:"data"`
}

func setupInvoiceControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	gin.SetMode(gin.TestMode)
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	model.DB = db
	model.LOG_DB = db
	require.NoError(t, db.AutoMigrate(
		&model.User{},
		&model.TopUp{},
		&model.InvoiceRequest{},
		&model.InvoiceRequestItem{},
		&model.UserInvoiceProfile{},
		&model.UserRealNameVerification{},
	))
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
	return db
}

func newInvoiceContext(t *testing.T, method string, target string, body any, userID int, username string, role int) (*gin.Context, *httptest.ResponseRecorder) {
	t.Helper()
	var reader *bytes.Reader
	if body != nil {
		payload, err := common.Marshal(body)
		require.NoError(t, err)
		reader = bytes.NewReader(payload)
	} else {
		reader = bytes.NewReader(nil)
	}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(method, target, reader)
	if body != nil {
		ctx.Request.Header.Set("Content-Type", "application/json")
	}
	ctx.Set("id", userID)
	ctx.Set("username", username)
	ctx.Set("role", role)
	return ctx, recorder
}

func decodeInvoiceAPIResponse(t *testing.T, recorder *httptest.ResponseRecorder, out any) invoiceAPIResponse {
	t.Helper()
	var response invoiceAPIResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	if out != nil && len(response.Data) > 0 {
		require.NoError(t, common.Unmarshal(response.Data, out))
	}
	return response
}

func seedControllerTopUp(t *testing.T, userID int, tradeNo string) model.TopUp {
	t.Helper()
	topUp := model.TopUp{
		UserId:          userID,
		Amount:          100,
		Money:           100,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentProviderStripe,
		PaymentProvider: model.PaymentProviderStripe,
		CreateTime:      1000,
		CompleteTime:    1100,
		Status:          common.TopUpStatusSuccess,
	}
	require.NoError(t, model.DB.Create(&topUp).Error)
	return topUp
}

func TestGetEligibleInvoiceTopUps(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	valid := seedControllerTopUp(t, 7, "valid")
	seedControllerTopUp(t, 8, "other-user")

	ctx, recorder := newInvoiceContext(t, http.MethodGet, "/api/invoice/eligible-topups?p=1&page_size=20", nil, 7, "alice", common.RoleCommonUser)
	GetEligibleInvoiceTopUps(ctx)

	var page common.PageInfo
	response := decodeInvoiceAPIResponse(t, recorder, &page)
	require.True(t, response.Success)
	require.Equal(t, 1, page.Total)

	payload, err := common.Marshal(page.Items)
	require.NoError(t, err)
	var items []model.TopUp
	require.NoError(t, common.Unmarshal(payload, &items))
	require.Len(t, items, 1)
	require.Equal(t, valid.Id, items[0].Id)
}

func TestCreateInvoiceEndpoint(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	topUp := seedControllerTopUp(t, 7, "invoice-create")

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/invoice", gin.H{
		"topup_ids":    []int{topUp.Id},
		"invoice_type": model.InvoiceTypePersonal,
		"title":        "Alice",
		"email":        "alice@example.com",
	}, 7, "alice", common.RoleCommonUser)
	CreateInvoice(ctx)

	var request model.InvoiceRequest
	response := decodeInvoiceAPIResponse(t, recorder, &request)
	require.True(t, response.Success)
	require.Equal(t, "Alice", request.Title)
	require.Equal(t, 100.0, request.Amount)
}

func TestInvoiceDetailRequiresOwnership(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	request := model.InvoiceRequest{
		UserId:      8,
		Username:    "bob",
		InvoiceType: model.InvoiceTypePersonal,
		Title:       "Bob",
		Email:       "bob@example.com",
		Amount:      10,
		Currency:    "USD",
		Status:      model.InvoiceStatusPending,
	}
	require.NoError(t, model.DB.Create(&request).Error)

	ctx, recorder := newInvoiceContext(t, http.MethodGet, fmt.Sprintf("/api/invoice/%d", request.Id), nil, 7, "alice", common.RoleCommonUser)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", request.Id)}}
	GetInvoiceDetail(ctx)

	response := decodeInvoiceAPIResponse(t, recorder, nil)
	require.False(t, response.Success)
}

func TestAdminInvoiceTransitions(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	request := model.InvoiceRequest{
		UserId:      7,
		Username:    "alice",
		InvoiceType: model.InvoiceTypePersonal,
		Title:       "Alice",
		Email:       "alice@example.com",
		Amount:      10,
		Currency:    "USD",
		Status:      model.InvoiceStatusPending,
	}
	require.NoError(t, model.DB.Create(&request).Error)

	ctx, recorder := newInvoiceContext(t, http.MethodPost, fmt.Sprintf("/api/invoice/admin/%d/approve", request.Id), nil, 100, "root", common.RoleRootUser)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", request.Id)}}
	AdminApproveInvoice(ctx)
	response := decodeInvoiceAPIResponse(t, recorder, nil)
	require.True(t, response.Success)

	ctx, recorder = newInvoiceContext(t, http.MethodPost, fmt.Sprintf("/api/invoice/admin/%d/issue", request.Id), gin.H{
		"invoice_no": "INV-001",
	}, 100, "root", common.RoleRootUser)
	ctx.Params = gin.Params{{Key: "id", Value: fmt.Sprintf("%d", request.Id)}}
	AdminIssueInvoice(ctx)
	response = decodeInvoiceAPIResponse(t, recorder, nil)
	require.True(t, response.Success)
}
```

- [ ] **Step 2: Run invoice controller tests and verify failure**

Run:

```bash
go test ./controller -run 'TestGetEligibleInvoiceTopUps|TestCreateInvoiceEndpoint|TestInvoiceDetailRequiresOwnership|TestAdminInvoiceTransitions' -count=1
```

Expected: FAIL because invoice controller functions do not exist.

- [ ] **Step 3: Add invoice controller**

Create `controller/invoice.go`:

```go
package controller

import (
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type createInvoiceRequest struct {
	TopUpIds    []int  `json:"topup_ids"`
	InvoiceType string `json:"invoice_type"`
	Title       string `json:"title"`
	TaxNo       string `json:"tax_no"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Remark      string `json:"remark"`
}

type invoiceProfileRequest struct {
	InvoiceType       string `json:"invoice_type"`
	Title             string `json:"title"`
	TaxNo             string `json:"tax_no"`
	Email             string `json:"email"`
	Phone             string `json:"phone"`
	BankName          string `json:"bank_name"`
	BankAccount       string `json:"bank_account"`
	RegisteredAddress string `json:"registered_address"`
	RegisteredPhone   string `json:"registered_phone"`
}

type rejectInvoiceRequest struct {
	RejectReason string `json:"reject_reason"`
}

func GetEligibleInvoiceTopUps(c *gin.Context) {
	userID := c.GetInt("id")
	pageInfo := common.GetPageQuery(c)
	items, total, err := model.ListEligibleInvoiceTopUps(userID, c.Query("keyword"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

func ListSelfInvoices(c *gin.Context) {
	userID := c.GetInt("id")
	pageInfo := common.GetPageQuery(c)
	items, total, err := model.ListUserInvoiceRequests(userID, c.Query("status"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

func GetInvoiceDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	request, err := model.GetInvoiceRequestWithItems(id, c.GetInt("id"), false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, request)
}

func CreateInvoice(c *gin.Context) {
	var req createInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	request, err := model.CreateInvoiceRequest(model.InvoiceCreateInput{
		UserId:      c.GetInt("id"),
		Username:    c.GetString("username"),
		TopUpIds:    req.TopUpIds,
		InvoiceType: req.InvoiceType,
		Title:       req.Title,
		TaxNo:       req.TaxNo,
		Email:       req.Email,
		Phone:       req.Phone,
		Remark:      req.Remark,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, request)
}

func CancelInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.CancelInvoiceRequest(id, c.GetInt("id")); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func GetInvoiceProfiles(c *gin.Context) {
	profiles, err := model.GetUserInvoiceProfiles(c.GetInt("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, profiles)
}

func UpdateInvoiceProfile(c *gin.Context) {
	var req invoiceProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	profile, err := model.UpsertManualInvoiceProfile(model.UserInvoiceProfile{
		UserId:            c.GetInt("id"),
		InvoiceType:       req.InvoiceType,
		Title:             strings.TrimSpace(req.Title),
		TaxNo:             strings.TrimSpace(req.TaxNo),
		Email:             strings.TrimSpace(req.Email),
		Phone:             strings.TrimSpace(req.Phone),
		BankName:          strings.TrimSpace(req.BankName),
		BankAccount:       strings.TrimSpace(req.BankAccount),
		RegisteredAddress: strings.TrimSpace(req.RegisteredAddress),
		RegisteredPhone:   strings.TrimSpace(req.RegisteredPhone),
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, profile)
}

func AdminListInvoices(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	items, total, err := model.ListAdminInvoiceRequests(c.Query("status"), c.Query("keyword"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

func AdminGetInvoiceDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	request, err := model.GetInvoiceRequestWithItems(id, 0, true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, request)
}

func AdminApproveInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.ApproveInvoiceRequest(id, c.GetInt("id")); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminRejectInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	var req rejectInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.RejectInvoiceRequest(id, c.GetInt("id"), req.RejectReason); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminIssueInvoice(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	var req model.InvoiceIssueInput
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.IssueInvoiceRequest(id, c.GetInt("id"), req); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
```

- [ ] **Step 4: Write real-name controller tests**

Create `controller/realname_test.go`:

```go
package controller

import (
	"net/http"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	realnamesvc "github.com/QuantumNous/new-api/service/realname"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestCreateRealNameSessionEndpoint(t *testing.T) {
	setupInvoiceControllerTestDB(t)

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/session", gin.H{
		"verify_type": model.VerifyTypePersonal,
		"provider":    "mock",
	}, 7, "alice", common.RoleCommonUser)
	CreateRealNameSession(ctx)

	var payload realNameSessionResponse
	response := decodeInvoiceAPIResponse(t, recorder, &payload)
	require.True(t, response.Success)
	require.NotEmpty(t, payload.Session.ProviderRequestID)

	status, err := model.GetUserRealNameStatus(7)
	require.NoError(t, err)
	require.NotNil(t, status[model.VerifyTypePersonal])
}

func TestRealNameCallbackUpdatesProfile(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	verification, err := model.CreateRealNameVerificationSession(7, model.VerifyTypeCompany, "mock", "mock-company-2")
	require.NoError(t, err)

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/callback/mock", gin.H{
		"provider_request_id": verification.ProviderRequestId,
		"status":              model.RealNameStatusVerified,
		"company_name":        "Example Ltd",
		"credit_code":         "91310000MA1K00000X",
		"signature":           realnamesvc.MockCallbackSignature,
	}, 0, "", common.RoleGuestUser)
	ctx.Params = gin.Params{{Key: "provider", Value: "mock"}}
	RealNameCallback(ctx)

	response := decodeInvoiceAPIResponse(t, recorder, nil)
	require.True(t, response.Success)

	profiles, err := model.GetUserInvoiceProfiles(7)
	require.NoError(t, err)
	require.NotNil(t, profiles.Company)
	require.Equal(t, "Example Ltd", profiles.Company.Title)
}
```

- [ ] **Step 5: Add real-name controller**

Create `controller/realname.go`:

```go
package controller

import (
	"context"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	realnamesvc "github.com/QuantumNous/new-api/service/realname"
	"github.com/gin-gonic/gin"
)

type realNameSessionRequest struct {
	VerifyType string `json:"verify_type"`
	Provider   string `json:"provider"`
}

type realNameSessionResponse struct {
	Verification *model.UserRealNameVerification `json:"verification"`
	Session      realnamesvc.Session             `json:"session"`
}

type realNameCallbackRequest struct {
	ProviderRequestID string `json:"provider_request_id"`
	Status            string `json:"status"`
	VerifiedName      string `json:"verified_name"`
	CompanyName       string `json:"company_name"`
	IdNo              string `json:"id_no"`
	CreditCode        string `json:"credit_code"`
	LegalPersonName   string `json:"legal_person_name"`
	ResultCode        string `json:"result_code"`
	ResultMessage     string `json:"result_message"`
	RawPayload        string `json:"raw_payload"`
	Signature         string `json:"signature"`
}

func GetRealNameStatus(c *gin.Context) {
	status, err := model.GetUserRealNameStatus(c.GetInt("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, status)
}

func CreateRealNameSession(c *gin.Context) {
	var req realNameSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	providerName := req.Provider
	if providerName == "" {
		providerName = "mock"
	}
	provider, ok := realnamesvc.GetProvider(providerName)
	if !ok {
		common.ApiError(c, realnamesvc.ErrUnsupportedProvider)
		return
	}
	session, err := provider.CreateSession(context.Background(), realnamesvc.CreateSessionRequest{
		UserID:     c.GetInt("id"),
		VerifyType: req.VerifyType,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	verification, err := model.CreateRealNameVerificationSession(c.GetInt("id"), req.VerifyType, provider.ProviderName(), session.ProviderRequestID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, realNameSessionResponse{Verification: verification, Session: session})
}

func RealNameCallback(c *gin.Context) {
	provider, ok := realnamesvc.GetProvider(c.Param("provider"))
	if !ok {
		common.ApiError(c, realnamesvc.ErrUnsupportedProvider)
		return
	}
	var req realNameCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	result, err := provider.VerifyCallback(context.Background(), realnamesvc.CallbackRequest{
		ProviderRequestID: req.ProviderRequestID,
		Status:            req.Status,
		VerifiedName:      req.VerifiedName,
		CompanyName:       req.CompanyName,
		IdNo:              req.IdNo,
		CreditCode:        req.CreditCode,
		LegalPersonName:   req.LegalPersonName,
		ResultCode:        req.ResultCode,
		ResultMessage:     req.ResultMessage,
		RawPayload:        req.RawPayload,
		Signature:         req.Signature,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.ApplyRealNameVerificationResult(model.RealNameVerificationResultInput{
		Provider:              provider.ProviderName(),
		ProviderRequestId:     result.ProviderRequestID,
		Status:                result.Status,
		VerifiedName:          result.VerifiedName,
		CompanyName:           result.CompanyName,
		IdNo:                  result.IdNo,
		CreditCode:            result.CreditCode,
		LegalPersonName:       result.LegalPersonName,
		ProviderResultCode:    result.ResultCode,
		ProviderResultMessage: result.ResultMessage,
		RawPayloadEncrypted:   result.RawPayload,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
```

- [ ] **Step 6: Register routes**

Modify `router/api-router.go` after the subscription route groups and before `optionRoute`:

```go
		invoiceRoute := apiRouter.Group("/invoice")
		invoiceRoute.Use(middleware.UserAuth())
		{
			invoiceRoute.GET("/eligible-topups", controller.GetEligibleInvoiceTopUps)
			invoiceRoute.GET("/self", controller.ListSelfInvoices)
			invoiceRoute.GET("/profile", controller.GetInvoiceProfiles)
			invoiceRoute.PUT("/profile", controller.UpdateInvoiceProfile)
			invoiceRoute.GET("/:id", controller.GetInvoiceDetail)
			invoiceRoute.POST("", middleware.CriticalRateLimit(), controller.CreateInvoice)
			invoiceRoute.POST("/:id/cancel", middleware.CriticalRateLimit(), controller.CancelInvoice)
		}

		invoiceAdminRoute := apiRouter.Group("/invoice/admin")
		invoiceAdminRoute.Use(middleware.AdminAuth())
		{
			invoiceAdminRoute.GET("", controller.AdminListInvoices)
			invoiceAdminRoute.GET("/:id", controller.AdminGetInvoiceDetail)
			invoiceAdminRoute.POST("/:id/approve", controller.AdminApproveInvoice)
			invoiceAdminRoute.POST("/:id/reject", controller.AdminRejectInvoice)
			invoiceAdminRoute.POST("/:id/issue", controller.AdminIssueInvoice)
		}

		realNameRoute := apiRouter.Group("/realname")
		realNameRoute.Use(middleware.UserAuth())
		{
			realNameRoute.GET("/status", controller.GetRealNameStatus)
			realNameRoute.POST("/session", middleware.CriticalRateLimit(), controller.CreateRealNameSession)
		}
		apiRouter.POST("/realname/callback/:provider", controller.RealNameCallback)
```

- [ ] **Step 7: Run controller tests**

Run:

```bash
go test ./controller -run 'TestGetEligibleInvoiceTopUps|TestCreateInvoiceEndpoint|TestInvoiceDetailRequiresOwnership|TestAdminInvoiceTransitions|TestCreateRealNameSessionEndpoint|TestRealNameCallbackUpdatesProfile' -count=1
```

Expected: PASS.

- [ ] **Step 8: Commit controller and routes work**

Run:

```bash
git add controller/invoice.go controller/invoice_test.go controller/realname.go controller/realname_test.go router/api-router.go
git commit -m "Add invoice and real-name APIs"
```

---

## Task 4: Add Frontend Invoice API, Types, And Formatting Helpers

**Files:**
- Create: `web/default/src/features/invoices/types.ts`
- Create: `web/default/src/features/invoices/api.ts`
- Create: `web/default/src/features/invoices/lib/format.ts`
- Test: TypeScript compiler in later frontend verification task.

- [ ] **Step 1: Create invoice frontend types**

Create `web/default/src/features/invoices/types.ts`:

```ts
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface PageResponse<T> {
  page: number
  page_size: number
  total: number
  items: T[]
}

export type InvoiceType = 'personal' | 'company'
export type InvoiceProfileSource = 'manual' | 'verified'
export type InvoiceStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'issued'
  | 'cancelled'
export type RealNameStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'expired'

export interface InvoiceableTopUp {
  id: number
  user_id: number
  amount: number
  money: number
  trade_no: string
  payment_method: string
  payment_provider: string
  create_time: number
  complete_time: number
  status: string
}

export interface InvoiceRequestItem {
  id: number
  invoice_request_id: number
  topup_id: number
  trade_no: string
  money: number
  payment_provider: string
  payment_method: string
  topup_create_time: number
  topup_complete_time: number
  created_at: number
}

export interface InvoiceRequestRecord {
  id: number
  user_id: number
  username: string
  invoice_type: InvoiceType
  profile_source: InvoiceProfileSource
  realname_verification_id?: number | null
  title: string
  tax_no: string
  email: string
  phone: string
  amount: number
  currency: string
  status: InvoiceStatus
  remark: string
  reject_reason: string
  invoice_no: string
  invoice_url: string
  issue_note: string
  issued_at: number
  reviewed_by: number
  reviewed_at: number
  created_at: number
  updated_at: number
  items?: InvoiceRequestItem[]
}

export interface InvoiceProfile {
  id?: number
  user_id?: number
  invoice_type: InvoiceType
  source?: InvoiceProfileSource
  realname_verification_id?: number | null
  title: string
  tax_no: string
  email: string
  phone: string
  bank_name: string
  bank_account: string
  registered_address: string
  registered_phone: string
  is_default?: boolean
  created_at?: number
  updated_at?: number
}

export interface InvoiceProfiles {
  personal?: InvoiceProfile | null
  company?: InvoiceProfile | null
}

export interface RealNameVerification {
  id: number
  user_id: number
  verify_type: InvoiceType
  provider: string
  provider_request_id: string
  status: RealNameStatus
  verified_name: string
  company_name: string
  id_no_masked: string
  credit_code: string
  legal_person_name_masked: string
  provider_result_code: string
  provider_result_message: string
  started_at: number
  verified_at: number
  expired_at: number
  created_at: number
  updated_at: number
}

export type RealNameStatusMap = Record<
  InvoiceType,
  RealNameVerification | null
>

export interface RealNameSession {
  provider: string
  provider_request_id: string
  redirect_url: string
  qr_code_url: string
  metadata?: Record<string, unknown>
}

export interface CreateInvoicePayload {
  topup_ids: number[]
  invoice_type: InvoiceType
  title: string
  tax_no?: string
  email?: string
  phone?: string
  remark?: string
}

export interface UpdateInvoiceProfilePayload extends InvoiceProfile {}

export interface CreateRealNameSessionPayload {
  verify_type: InvoiceType
  provider?: string
}

export interface CreateRealNameSessionResponse {
  verification: RealNameVerification
  session: RealNameSession
}

export interface AdminIssueInvoicePayload {
  invoice_no: string
  invoice_url?: string
  issued_at?: number
  issue_note?: string
}
```

- [ ] **Step 2: Create invoice API functions**

Create `web/default/src/features/invoices/api.ts`:

```ts
import { api } from '@/lib/api'
import type {
  AdminIssueInvoicePayload,
  ApiResponse,
  CreateInvoicePayload,
  CreateRealNameSessionPayload,
  CreateRealNameSessionResponse,
  InvoiceProfiles,
  InvoiceRequestRecord,
  InvoiceableTopUp,
  PageResponse,
  RealNameStatusMap,
  UpdateInvoiceProfilePayload,
} from './types'

export async function getEligibleTopUps(params: {
  p: number
  page_size: number
  keyword?: string
}): Promise<ApiResponse<PageResponse<InvoiceableTopUp>>> {
  const res = await api.get('/api/invoice/eligible-topups', { params })
  return res.data
}

export async function getSelfInvoices(params: {
  p: number
  page_size: number
  status?: string
}): Promise<ApiResponse<PageResponse<InvoiceRequestRecord>>> {
  const res = await api.get('/api/invoice/self', { params })
  return res.data
}

export async function getInvoiceDetail(
  id: number
): Promise<ApiResponse<InvoiceRequestRecord>> {
  const res = await api.get(`/api/invoice/${id}`)
  return res.data
}

export async function createInvoice(
  payload: CreateInvoicePayload
): Promise<ApiResponse<InvoiceRequestRecord>> {
  const res = await api.post('/api/invoice', payload)
  return res.data
}

export async function cancelInvoice(id: number): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/${id}/cancel`)
  return res.data
}

export async function getInvoiceProfiles(): Promise<
  ApiResponse<InvoiceProfiles>
> {
  const res = await api.get('/api/invoice/profile')
  return res.data
}

export async function updateInvoiceProfile(
  payload: UpdateInvoiceProfilePayload
): Promise<ApiResponse<InvoiceProfile>> {
  const res = await api.put('/api/invoice/profile', payload)
  return res.data
}

export async function getRealNameStatus(): Promise<
  ApiResponse<RealNameStatusMap>
> {
  const res = await api.get('/api/realname/status')
  return res.data
}

export async function createRealNameSession(
  payload: CreateRealNameSessionPayload
): Promise<ApiResponse<CreateRealNameSessionResponse>> {
  const res = await api.post('/api/realname/session', payload)
  return res.data
}

export async function getAdminInvoices(params: {
  p: number
  page_size: number
  status?: string
  keyword?: string
}): Promise<ApiResponse<PageResponse<InvoiceRequestRecord>>> {
  const res = await api.get('/api/invoice/admin', { params })
  return res.data
}

export async function approveInvoice(id: number): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/admin/${id}/approve`)
  return res.data
}

export async function rejectInvoice(
  id: number,
  rejectReason: string
): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/admin/${id}/reject`, {
    reject_reason: rejectReason,
  })
  return res.data
}

export async function issueInvoice(
  id: number,
  payload: AdminIssueInvoicePayload
): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/admin/${id}/issue`, payload)
  return res.data
}
```

- [ ] **Step 3: Create formatting helpers**

Create `web/default/src/features/invoices/lib/format.ts`:

```ts
import type { InvoiceStatus, InvoiceType, RealNameStatus } from '../types'

export function formatInvoiceMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatUnixTime(timestamp?: number) {
  if (!timestamp) return '-'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

export function getInvoiceTypeLabelKey(type: InvoiceType) {
  return type === 'company' ? 'Company invoice' : 'Personal invoice'
}

export function getInvoiceStatusLabelKey(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    pending: 'Pending review',
    approved: 'Approved',
    rejected: 'Rejected',
    issued: 'Issued',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

export function getInvoiceStatusVariant(status: InvoiceStatus) {
  const variants = {
    pending: 'warning',
    approved: 'info',
    rejected: 'danger',
    issued: 'success',
    cancelled: 'neutral',
  } as const
  return variants[status] ?? 'neutral'
}

export function getRealNameStatusLabelKey(status?: RealNameStatus) {
  if (!status) return 'Unverified'
  const labels: Record<RealNameStatus, string> = {
    unverified: 'Unverified',
    pending: 'Verification pending',
    verified: 'Verified',
    failed: 'Verification failed',
    expired: 'Verification expired',
  }
  return labels[status] ?? status
}

export function getRealNameStatusVariant(status?: RealNameStatus) {
  if (!status) return 'neutral'
  const variants = {
    unverified: 'neutral',
    pending: 'warning',
    verified: 'success',
    failed: 'danger',
    expired: 'neutral',
  } as const
  return variants[status] ?? 'neutral'
}

export function sumSelectedTopUps<T extends { money: number }>(items: T[]) {
  return items.reduce((sum, item) => sum + item.money, 0)
}

export const INVOICE_CONFIRM_PHRASE = '确认开具发票'
```

- [ ] **Step 4: Commit frontend API/type helpers**

Run:

```bash
git add web/default/src/features/invoices/types.ts web/default/src/features/invoices/api.ts web/default/src/features/invoices/lib/format.ts
git commit -m "Add invoice frontend API helpers"
```

---

## Task 5: Add Frontend Invoice And Real-Name Page

**Files:**
- Create: `web/default/src/features/invoices/index.tsx`
- Create: `web/default/src/features/invoices/components/invoice-profile-panel.tsx`
- Create: `web/default/src/features/invoices/components/verification-status-panel.tsx`
- Create: `web/default/src/features/invoices/components/eligible-topups-table.tsx`
- Create: `web/default/src/features/invoices/components/invoice-request-form.tsx`
- Create: `web/default/src/features/invoices/components/invoice-submit-confirm-dialog.tsx`
- Create: `web/default/src/features/invoices/components/invoice-records-table.tsx`
- Create: `web/default/src/features/invoices/components/admin-invoice-table.tsx`
- Create: `web/default/src/features/invoices/components/admin-invoice-dialogs.tsx`
- Create: `web/default/src/routes/_authenticated/invoices/index.tsx`
- Test: `bun run typecheck` in Task 7.

- [ ] **Step 1: Create route**

Create `web/default/src/routes/_authenticated/invoices/index.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Invoices } from '@/features/invoices'

export const Route = createFileRoute('/_authenticated/invoices/')({
  component: Invoices,
})
```

- [ ] **Step 2: Create confirmation dialog**

Create `web/default/src/features/invoices/components/invoice-submit-confirm-dialog.tsx`:

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import { INVOICE_CONFIRM_PHRASE, formatInvoiceMoney } from '../lib/format'
import type { InvoiceType } from '../types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  tradeNos: string[]
  amount: number
  currency?: string
  invoiceType: InvoiceType
  title: string
  isLoading?: boolean
  onConfirm: () => void
}

export function InvoiceSubmitConfirmDialog({
  open,
  onOpenChange,
  selectedCount,
  tradeNos,
  amount,
  currency = 'USD',
  invoiceType,
  title,
  isLoading,
  onConfirm,
}: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const matched = value === INVOICE_CONFIRM_PHRASE

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setValue('')
      }}
      title={t('Confirm invoice issuance')}
      desc={
        <div className='space-y-2 text-sm'>
          <div>{t('Selected orders')}: {selectedCount}</div>
          <div className='break-all'>{t('Order numbers')}: {tradeNos.slice(0, 5).join(', ')}</div>
          <div>{t('Invoice title')}: {title}</div>
          <div>{t('Invoice type')}: {t(invoiceType === 'company' ? 'Company invoice' : 'Personal invoice')}</div>
          <div>{t('Invoice amount')}: {formatInvoiceMoney(amount, currency)}</div>
        </div>
      }
      confirmText={t('Submit invoice request')}
      disabled={!matched}
      isLoading={isLoading}
      handleConfirm={onConfirm}
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={INVOICE_CONFIRM_PHRASE}
        autoComplete='off'
      />
    </ConfirmDialog>
  )
}
```

- [ ] **Step 3: Create eligible top-up selector**

Create `web/default/src/features/invoices/components/eligible-topups-table.tsx`:

```tsx
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableEmpty } from '@/components/data-table/table-empty'
import { formatInvoiceMoney, formatUnixTime } from '../lib/format'
import type { InvoiceableTopUp } from '../types'

type Props = {
  items: InvoiceableTopUp[]
  selectedIds: number[]
  onSelectedIdsChange: (ids: number[]) => void
  loading?: boolean
}

export function EligibleTopUpsTable({
  items,
  selectedIds,
  onSelectedIdsChange,
  loading,
}: Props) {
  const { t } = useTranslation()
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected = items.length > 0 && items.every((item) => selectedSet.has(item.id))

  const toggleOne = (id: number, checked: boolean) => {
    if (checked) onSelectedIdsChange([...selectedIds, id])
    else onSelectedIdsChange(selectedIds.filter((itemId) => itemId !== id))
  }

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectedIdsChange([...new Set([...selectedIds, ...items.map((item) => item.id)])])
      return
    }
    const pageIds = new Set(items.map((item) => item.id))
    onSelectedIdsChange(selectedIds.filter((id) => !pageIds.has(id)))
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-10'>
              <Checkbox checked={allSelected} onCheckedChange={(value) => toggleAll(Boolean(value))} />
            </TableHead>
            <TableHead>{t('Order number')}</TableHead>
            <TableHead>{t('Payment provider')}</TableHead>
            <TableHead>{t('Completed at')}</TableHead>
            <TableHead className='text-right'>{t('Amount')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!loading && items.length === 0 && (
            <TableEmpty
              colSpan={5}
              title={t('No invoiceable top-ups')}
              description={t('Successful online top-ups that have not been invoiced will appear here.')}
            />
          )}
          {items.map((item) => (
            <TableRow key={item.id} data-state={selectedSet.has(item.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedSet.has(item.id)}
                  onCheckedChange={(value) => toggleOne(item.id, Boolean(value))}
                />
              </TableCell>
              <TableCell className='max-w-[220px] truncate font-mono text-xs'>{item.trade_no}</TableCell>
              <TableCell>{item.payment_provider}</TableCell>
              <TableCell>{formatUnixTime(item.complete_time)}</TableCell>
              <TableCell className='text-right font-medium'>{formatInvoiceMoney(item.money)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 4: Create profile and verification panels**

Create `web/default/src/features/invoices/components/invoice-profile-panel.tsx`:

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InvoiceProfile, InvoiceType } from '../types'

type Props = {
  type: InvoiceType
  profile?: InvoiceProfile | null
  isLoading?: boolean
  onSave: (profile: InvoiceProfile) => Promise<void>
}

const emptyProfile = (type: InvoiceType): InvoiceProfile => ({
  invoice_type: type,
  title: '',
  tax_no: '',
  email: '',
  phone: '',
  bank_name: '',
  bank_account: '',
  registered_address: '',
  registered_phone: '',
})

export function InvoiceProfilePanel({ type, profile, isLoading, onSave }: Props) {
  const { t } = useTranslation()
  const form = useForm<InvoiceProfile>({ defaultValues: emptyProfile(type) })

  useEffect(() => {
    form.reset(profile ?? emptyProfile(type))
  }, [form, profile, type])

  return (
    <form className='grid gap-3 md:grid-cols-2' onSubmit={form.handleSubmit(onSave)}>
      <div className='space-y-1.5'>
        <Label>{t('Invoice title')}</Label>
        <Input {...form.register('title')} />
      </div>
      <div className='space-y-1.5'>
        <Label>{t('Email')}</Label>
        <Input {...form.register('email')} />
      </div>
      {type === 'company' && (
        <div className='space-y-1.5'>
          <Label>{t('Tax number')}</Label>
          <Input {...form.register('tax_no')} />
        </div>
      )}
      <div className='space-y-1.5'>
        <Label>{t('Phone')}</Label>
        <Input {...form.register('phone')} />
      </div>
      {type === 'company' && (
        <>
          <div className='space-y-1.5'>
            <Label>{t('Bank name')}</Label>
            <Input {...form.register('bank_name')} />
          </div>
          <div className='space-y-1.5'>
            <Label>{t('Bank account')}</Label>
            <Input {...form.register('bank_account')} />
          </div>
          <div className='space-y-1.5'>
            <Label>{t('Registered address')}</Label>
            <Input {...form.register('registered_address')} />
          </div>
          <div className='space-y-1.5'>
            <Label>{t('Registered phone')}</Label>
            <Input {...form.register('registered_phone')} />
          </div>
        </>
      )}
      <div className='md:col-span-2'>
        <Button type='submit' disabled={isLoading}>
          {isLoading ? t('Saving...') : t('Save invoice profile')}
        </Button>
      </div>
    </form>
  )
}
```

Create `web/default/src/features/invoices/components/verification-status-panel.tsx`:

```tsx
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import {
  getRealNameStatusLabelKey,
  getRealNameStatusVariant,
} from '../lib/format'
import type { InvoiceType, RealNameVerification } from '../types'

type Props = {
  type: InvoiceType
  verification?: RealNameVerification | null
  isLoading?: boolean
  onStart: (type: InvoiceType) => void
}

export function VerificationStatusPanel({ type, verification, isLoading, onStart }: Props) {
  const { t } = useTranslation()
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'>
      <div className='flex min-w-0 items-center gap-3'>
        <ShieldCheck className='text-muted-foreground size-5 shrink-0' />
        <div className='min-w-0'>
          <div className='font-medium'>{t(type === 'company' ? 'Company verification' : 'Personal verification')}</div>
          <StatusBadge
            copyable={false}
            variant={getRealNameStatusVariant(verification?.status)}
            label={t(getRealNameStatusLabelKey(verification?.status))}
          />
        </div>
      </div>
      <Button variant='outline' disabled={isLoading} onClick={() => onStart(type)}>
        {t('Start verification')}
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Create invoice submit form**

Create `web/default/src/features/invoices/components/invoice-request-form.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatInvoiceMoney,
  sumSelectedTopUps,
} from '../lib/format'
import { InvoiceSubmitConfirmDialog } from './invoice-submit-confirm-dialog'
import type { CreateInvoicePayload, InvoiceProfile, InvoiceType, InvoiceableTopUp } from '../types'

type Props = {
  selectedTopUps: InvoiceableTopUp[]
  personalProfile?: InvoiceProfile | null
  companyProfile?: InvoiceProfile | null
  isLoading?: boolean
  onSubmit: (payload: CreateInvoicePayload) => Promise<void>
}

type FormValues = {
  invoice_type: InvoiceType
  title: string
  tax_no: string
  email: string
  phone: string
  remark: string
}

export function InvoiceRequestForm({
  selectedTopUps,
  personalProfile,
  companyProfile,
  isLoading,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const form = useForm<FormValues>({
    defaultValues: {
      invoice_type: 'personal',
      title: personalProfile?.title ?? '',
      tax_no: '',
      email: personalProfile?.email ?? '',
      phone: personalProfile?.phone ?? '',
      remark: '',
    },
  })
  const invoiceType = form.watch('invoice_type')
  const amount = useMemo(() => sumSelectedTopUps(selectedTopUps), [selectedTopUps])

  const applyProfile = (type: InvoiceType) => {
    const profile = type === 'company' ? companyProfile : personalProfile
    form.setValue('invoice_type', type)
    form.setValue('title', profile?.title ?? '')
    form.setValue('tax_no', profile?.tax_no ?? '')
    form.setValue('email', profile?.email ?? '')
    form.setValue('phone', profile?.phone ?? '')
  }

  const values = form.watch()
  const disabled =
    selectedTopUps.length === 0 ||
    !values.title.trim() ||
    (invoiceType === 'company' && !values.tax_no.trim())

  const submitPayload = async () => {
    await onSubmit({
      topup_ids: selectedTopUps.map((item) => item.id),
      invoice_type: values.invoice_type,
      title: values.title,
      tax_no: values.tax_no,
      email: values.email,
      phone: values.phone,
      remark: values.remark,
    })
    setConfirmOpen(false)
  }

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <div className='text-sm text-muted-foreground'>{t('Selected amount')}</div>
          <div className='text-xl font-semibold'>{formatInvoiceMoney(amount)}</div>
        </div>
        <div className='text-sm text-muted-foreground'>
          {t('Selected orders')}: {selectedTopUps.length}
        </div>
      </div>
      <form className='grid gap-3 md:grid-cols-2' onSubmit={(event) => {
        event.preventDefault()
        setConfirmOpen(true)
      }}>
        <div className='space-y-1.5'>
          <Label>{t('Invoice type')}</Label>
          <Select value={invoiceType} onValueChange={(value) => applyProfile(value as InvoiceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='personal'>{t('Personal invoice')}</SelectItem>
              <SelectItem value='company'>{t('Company invoice')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-1.5'>
          <Label>{t('Invoice title')}</Label>
          <Input {...form.register('title')} />
        </div>
        {invoiceType === 'company' && (
          <div className='space-y-1.5'>
            <Label>{t('Tax number')}</Label>
            <Input {...form.register('tax_no')} />
          </div>
        )}
        <div className='space-y-1.5'>
          <Label>{t('Email')}</Label>
          <Input {...form.register('email')} />
        </div>
        <div className='space-y-1.5'>
          <Label>{t('Phone')}</Label>
          <Input {...form.register('phone')} />
        </div>
        <div className='space-y-1.5 md:col-span-2'>
          <Label>{t('Remark')}</Label>
          <Textarea {...form.register('remark')} />
        </div>
        <div className='md:col-span-2'>
          <Button type='submit' disabled={disabled || isLoading}>
            {t('Submit invoice request')}
          </Button>
        </div>
      </form>
      <InvoiceSubmitConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        selectedCount={selectedTopUps.length}
        tradeNos={selectedTopUps.map((item) => item.trade_no)}
        amount={amount}
        invoiceType={values.invoice_type}
        title={values.title}
        isLoading={isLoading}
        onConfirm={submitPayload}
      />
    </div>
  )
}
```

- [ ] **Step 6: Create user and admin records tables**

Create `web/default/src/features/invoices/components/invoice-records-table.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/status-badge'
import { TableEmpty } from '@/components/data-table/table-empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatInvoiceMoney,
  formatUnixTime,
  getInvoiceStatusLabelKey,
  getInvoiceStatusVariant,
  getInvoiceTypeLabelKey,
} from '../lib/format'
import type { InvoiceRequestRecord } from '../types'

type Props = {
  items: InvoiceRequestRecord[]
}

export function InvoiceRecordsTable({ items }: Props) {
  const { t } = useTranslation()

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-20'>ID</TableHead>
            <TableHead>{t('Invoice type')}</TableHead>
            <TableHead>{t('Invoice title')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Created at')}</TableHead>
            <TableHead className='text-right'>{t('Amount')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableEmpty
              colSpan={6}
              title={t('No invoice requests')}
              description={t('Submitted invoice requests will appear here.')}
            />
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className='font-mono text-xs'>{item.id}</TableCell>
              <TableCell>{t(getInvoiceTypeLabelKey(item.invoice_type))}</TableCell>
              <TableCell className='max-w-[260px] truncate'>{item.title}</TableCell>
              <TableCell>
                <StatusBadge
                  copyable={false}
                  variant={getInvoiceStatusVariant(item.status)}
                  label={t(getInvoiceStatusLabelKey(item.status))}
                />
              </TableCell>
              <TableCell>{formatUnixTime(item.created_at)}</TableCell>
              <TableCell className='text-right font-medium'>
                {formatInvoiceMoney(item.amount, item.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

Create `web/default/src/features/invoices/components/admin-invoice-dialogs.tsx`:

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AdminIssueInvoicePayload } from '../types'

export type AdminInvoiceDialog =
  | { type: 'approve'; invoiceId: number }
  | { type: 'reject'; invoiceId: number }
  | { type: 'issue'; invoiceId: number }
  | null

type Props = {
  dialog: AdminInvoiceDialog
  onOpenChange: (dialog: AdminInvoiceDialog) => void
  onApprove: (invoiceId: number) => Promise<void>
  onReject: (invoiceId: number, reason: string) => Promise<void>
  onIssue: (invoiceId: number, payload: AdminIssueInvoicePayload) => Promise<void>
  isLoading?: boolean
}

export function AdminInvoiceDialogs({
  dialog,
  onOpenChange,
  onApprove,
  onReject,
  onIssue,
  isLoading,
}: Props) {
  const { t } = useTranslation()
  const [rejectReason, setRejectReason] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [issueNote, setIssueNote] = useState('')

  const close = () => {
    onOpenChange(null)
    setRejectReason('')
    setInvoiceNo('')
    setInvoiceUrl('')
    setIssueNote('')
  }

  return (
    <>
      <ConfirmDialog
        open={dialog?.type === 'approve'}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={t('Approve invoice request')}
        desc={t('Approve this pending invoice request.')}
        confirmText={t('Approve')}
        isLoading={isLoading}
        handleConfirm={async () => {
          if (dialog?.type !== 'approve') return
          await onApprove(dialog.invoiceId)
          close()
        }}
      />

      <ConfirmDialog
        open={dialog?.type === 'reject'}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={t('Reject invoice request')}
        desc={t('Enter a rejection reason for this invoice request.')}
        confirmText={t('Reject')}
        destructive
        disabled={!rejectReason.trim()}
        isLoading={isLoading}
        handleConfirm={async () => {
          if (dialog?.type !== 'reject') return
          await onReject(dialog.invoiceId, rejectReason)
          close()
        }}
      >
        <Textarea
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder={t('Reject reason')}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog?.type === 'issue'}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={t('Mark invoice as issued')}
        desc={t('Enter the issued invoice details.')}
        confirmText={t('Mark as issued')}
        disabled={!invoiceNo.trim()}
        isLoading={isLoading}
        handleConfirm={async () => {
          if (dialog?.type !== 'issue') return
          await onIssue(dialog.invoiceId, {
            invoice_no: invoiceNo,
            invoice_url: invoiceUrl,
            issue_note: issueNote,
          })
          close()
        }}
      >
        <div className='space-y-3'>
          <Input
            value={invoiceNo}
            onChange={(event) => setInvoiceNo(event.target.value)}
            placeholder={t('Invoice number')}
          />
          <Input
            value={invoiceUrl}
            onChange={(event) => setInvoiceUrl(event.target.value)}
            placeholder={t('Invoice URL')}
          />
          <Textarea
            value={issueNote}
            onChange={(event) => setIssueNote(event.target.value)}
            placeholder={t('Issue note')}
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
```

Create `web/default/src/features/invoices/components/admin-invoice-table.tsx`:

```tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, FileCheck2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/status-badge'
import { TableEmpty } from '@/components/data-table/table-empty'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { approveInvoice, issueInvoice, rejectInvoice } from '../api'
import {
  formatInvoiceMoney,
  formatUnixTime,
  getInvoiceStatusLabelKey,
  getInvoiceStatusVariant,
  getInvoiceTypeLabelKey,
} from '../lib/format'
import {
  AdminInvoiceDialogs,
  type AdminInvoiceDialog,
} from './admin-invoice-dialogs'
import type { AdminIssueInvoicePayload, InvoiceRequestRecord } from '../types'

type Props = {
  items: InvoiceRequestRecord[]
}

export function AdminInvoiceTable({ items }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<AdminInvoiceDialog>(null)

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['invoice', 'admin'] })
    await queryClient.invalidateQueries({ queryKey: ['invoice', 'self'] })
  }

  const approveMutation = useMutation({
    mutationFn: approveInvoice,
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(t('Invoice request approved'))
        await invalidate()
      }
    },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectInvoice(id, reason),
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(t('Invoice request rejected'))
        await invalidate()
      }
    },
  })
  const issueMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: AdminIssueInvoicePayload
    }) => issueInvoice(id, payload),
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(t('Invoice marked as issued'))
        await invalidate()
      }
    },
  })

  const isLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    issueMutation.isPending

  return (
    <>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-20'>ID</TableHead>
              <TableHead>{t('User')}</TableHead>
              <TableHead>{t('Invoice type')}</TableHead>
              <TableHead>{t('Invoice title')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Created at')}</TableHead>
              <TableHead className='text-right'>{t('Amount')}</TableHead>
              <TableHead className='text-right'>{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableEmpty
                colSpan={8}
                title={t('No invoice requests')}
                description={t('Invoice requests awaiting review will appear here.')}
              />
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-mono text-xs'>{item.id}</TableCell>
                <TableCell>{item.username}</TableCell>
                <TableCell>{t(getInvoiceTypeLabelKey(item.invoice_type))}</TableCell>
                <TableCell className='max-w-[220px] truncate'>{item.title}</TableCell>
                <TableCell>
                  <StatusBadge
                    copyable={false}
                    variant={getInvoiceStatusVariant(item.status)}
                    label={t(getInvoiceStatusLabelKey(item.status))}
                  />
                </TableCell>
                <TableCell>{formatUnixTime(item.created_at)}</TableCell>
                <TableCell className='text-right font-medium'>
                  {formatInvoiceMoney(item.amount, item.currency)}
                </TableCell>
                <TableCell>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      disabled={item.status !== 'pending'}
                      onClick={() => setDialog({ type: 'approve', invoiceId: item.id })}
                    >
                      <Check className='size-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='icon'
                      disabled={item.status !== 'pending'}
                      onClick={() => setDialog({ type: 'reject', invoiceId: item.id })}
                    >
                      <X className='size-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='icon'
                      disabled={item.status !== 'approved'}
                      onClick={() => setDialog({ type: 'issue', invoiceId: item.id })}
                    >
                      <FileCheck2 className='size-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AdminInvoiceDialogs
        dialog={dialog}
        onOpenChange={setDialog}
        isLoading={isLoading}
        onApprove={(invoiceId) => approveMutation.mutateAsync(invoiceId).then(() => undefined)}
        onReject={(invoiceId, reason) =>
          rejectMutation.mutateAsync({ id: invoiceId, reason }).then(() => undefined)
        }
        onIssue={(invoiceId, payload) =>
          issueMutation.mutateAsync({ id: invoiceId, payload }).then(() => undefined)
        }
      />
    </>
  )
}
```

- [ ] **Step 7: Create page shell**

Create `web/default/src/features/invoices/index.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SectionPageLayout } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'
import {
  createInvoice,
  createRealNameSession,
  getAdminInvoices,
  getEligibleTopUps,
  getInvoiceProfiles,
  getRealNameStatus,
  getSelfInvoices,
  updateInvoiceProfile,
} from './api'
import { EligibleTopUpsTable } from './components/eligible-topups-table'
import { InvoiceProfilePanel } from './components/invoice-profile-panel'
import { InvoiceRequestForm } from './components/invoice-request-form'
import { InvoiceRecordsTable } from './components/invoice-records-table'
import { VerificationStatusPanel } from './components/verification-status-panel'
import { AdminInvoiceTable } from './components/admin-invoice-table'
import type { InvoiceType } from './types'

export function Invoices() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.auth.user)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState('apply')

  const eligibleQuery = useQuery({
    queryKey: ['invoice', 'eligible-topups'],
    queryFn: () => getEligibleTopUps({ p: 1, page_size: 50 }),
  })
  const profilesQuery = useQuery({
    queryKey: ['invoice', 'profiles'],
    queryFn: getInvoiceProfiles,
  })
  const realNameQuery = useQuery({
    queryKey: ['realname', 'status'],
    queryFn: getRealNameStatus,
  })
  const selfInvoicesQuery = useQuery({
    queryKey: ['invoice', 'self'],
    queryFn: () => getSelfInvoices({ p: 1, page_size: 20 }),
  })
  const adminInvoicesQuery = useQuery({
    queryKey: ['invoice', 'admin'],
    queryFn: () => getAdminInvoices({ p: 1, page_size: 20 }),
    enabled: isAdmin,
  })

  const eligibleItems = eligibleQuery.data?.data?.items ?? []
  const selectedTopUps = useMemo(
    () => eligibleItems.filter((item) => selectedIds.includes(item.id)),
    [eligibleItems, selectedIds]
  )
  const profiles = profilesQuery.data?.data

  const saveProfileMutation = useMutation({
    mutationFn: updateInvoiceProfile,
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(t('Invoice profile saved'))
        await queryClient.invalidateQueries({ queryKey: ['invoice', 'profiles'] })
      }
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(t('Invoice request submitted'))
        setSelectedIds([])
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['invoice', 'eligible-topups'] }),
          queryClient.invalidateQueries({ queryKey: ['invoice', 'self'] }),
        ])
      }
    },
  })

  const startVerificationMutation = useMutation({
    mutationFn: (type: InvoiceType) =>
      createRealNameSession({ verify_type: type, provider: 'mock' }),
    onSuccess: async (res) => {
      if (res.success) {
        toast.success(t('Verification session created'))
        await queryClient.invalidateQueries({ queryKey: ['realname', 'status'] })
      }
    },
  })

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Invoices')}</SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Apply for invoices from successful online top-ups')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value='apply'>{t('Apply')}</TabsTrigger>
            <TabsTrigger value='profiles'>{t('Invoice profiles')}</TabsTrigger>
            <TabsTrigger value='history'>{t('Invoice history')}</TabsTrigger>
            {isAdmin && <TabsTrigger value='admin'>{t('Admin review')}</TabsTrigger>}
          </TabsList>
          <TabsContent value='apply' className='mt-4 space-y-4'>
            <EligibleTopUpsTable
              items={eligibleItems}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              loading={eligibleQuery.isLoading}
            />
            <InvoiceRequestForm
              selectedTopUps={selectedTopUps}
              personalProfile={profiles?.personal}
              companyProfile={profiles?.company}
              isLoading={createInvoiceMutation.isPending}
              onSubmit={(payload) => createInvoiceMutation.mutateAsync(payload).then(() => undefined)}
            />
          </TabsContent>
          <TabsContent value='profiles' className='mt-4 space-y-4'>
            <VerificationStatusPanel
              type='personal'
              verification={realNameQuery.data?.data?.personal}
              isLoading={startVerificationMutation.isPending}
              onStart={(type) => startVerificationMutation.mutate(type)}
            />
            <InvoiceProfilePanel
              type='personal'
              profile={profiles?.personal}
              isLoading={saveProfileMutation.isPending}
              onSave={(profile) => saveProfileMutation.mutateAsync(profile).then(() => undefined)}
            />
            <VerificationStatusPanel
              type='company'
              verification={realNameQuery.data?.data?.company}
              isLoading={startVerificationMutation.isPending}
              onStart={(type) => startVerificationMutation.mutate(type)}
            />
            <InvoiceProfilePanel
              type='company'
              profile={profiles?.company}
              isLoading={saveProfileMutation.isPending}
              onSave={(profile) => saveProfileMutation.mutateAsync(profile).then(() => undefined)}
            />
          </TabsContent>
          <TabsContent value='history' className='mt-4'>
            <InvoiceRecordsTable items={selfInvoicesQuery.data?.data?.items ?? []} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value='admin' className='mt-4'>
              <AdminInvoiceTable items={adminInvoicesQuery.data?.data?.items ?? []} />
            </TabsContent>
          )}
        </Tabs>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
```

- [ ] **Step 8: Run invoice feature typecheck**

Run:

```bash
cd web/default && bun run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit invoice page work**

Run:

```bash
git add web/default/src/features/invoices web/default/src/routes/_authenticated/invoices/index.tsx
git commit -m "Add invoice application page"
```

---

## Task 6: Add Navigation, Sidebar Config, And Translations

**Files:**
- Create: `web/default/src/features/invoices/i18n.ts`
- Modify: `web/default/src/i18n/config.ts`
- Modify: `web/default/src/hooks/use-sidebar-data.ts`
- Modify: `web/default/src/hooks/use-sidebar-config.ts`
- Modify: `web/default/src/features/system-settings/maintenance/config.ts`
- Modify: `web/default/src/features/system-settings/maintenance/sidebar-modules-section.tsx`
- Test: `bun run i18n:sync`, `bun run typecheck`

- [ ] **Step 1: Add feature i18n resources**

Create `web/default/src/features/invoices/i18n.ts` with keys used by the invoice feature. Use this structure:

```ts
export const invoicesI18nResources = {
  en: {
    translation: {
      Invoices: 'Invoices',
      Apply: 'Apply',
      'Invoice profiles': 'Invoice profiles',
      'Invoice history': 'Invoice history',
      'Admin review': 'Admin review',
      'Apply for invoices from successful online top-ups':
        'Apply for invoices from successful online top-ups',
      'No invoiceable top-ups': 'No invoiceable top-ups',
      'Successful online top-ups that have not been invoiced will appear here.':
        'Successful online top-ups that have not been invoiced will appear here.',
      'Selected amount': 'Selected amount',
      'Selected orders': 'Selected orders',
      'Order numbers': 'Order numbers',
      'Invoice type': 'Invoice type',
      'Invoice title': 'Invoice title',
      'Invoice amount': 'Invoice amount',
      'Personal invoice': 'Personal invoice',
      'Company invoice': 'Company invoice',
      'Tax number': 'Tax number',
      'Bank name': 'Bank name',
      'Bank account': 'Bank account',
      'Registered address': 'Registered address',
      'Registered phone': 'Registered phone',
      'Submit invoice request': 'Submit invoice request',
      'Confirm invoice issuance': 'Confirm invoice issuance',
      'Invoice request submitted': 'Invoice request submitted',
      'Invoice profile saved': 'Invoice profile saved',
      'Save invoice profile': 'Save invoice profile',
      'Personal verification': 'Personal verification',
      'Company verification': 'Company verification',
      'Start verification': 'Start verification',
      'Verification session created': 'Verification session created',
      Unverified: 'Unverified',
      'Verification pending': 'Verification pending',
      Verified: 'Verified',
      'Verification failed': 'Verification failed',
      'Verification expired': 'Verification expired',
      'Pending review': 'Pending review',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Issued: 'Issued',
      Cancelled: 'Cancelled',
      'Order number': 'Order number',
      'Payment provider': 'Payment provider',
      'Completed at': 'Completed at',
      Amount: 'Amount',
      Status: 'Status',
      'Created at': 'Created at',
      'No invoice requests': 'No invoice requests',
      'Submitted invoice requests will appear here.':
        'Submitted invoice requests will appear here.',
      'Approve invoice request': 'Approve invoice request',
      'Approve this pending invoice request.':
        'Approve this pending invoice request.',
      Approve: 'Approve',
      'Reject invoice request': 'Reject invoice request',
      'Enter a rejection reason for this invoice request.':
        'Enter a rejection reason for this invoice request.',
      Reject: 'Reject',
      'Reject reason': 'Reject reason',
      'Mark invoice as issued': 'Mark invoice as issued',
      'Enter the issued invoice details.': 'Enter the issued invoice details.',
      'Mark as issued': 'Mark as issued',
      'Invoice number': 'Invoice number',
      'Invoice URL': 'Invoice URL',
      'Issue note': 'Issue note',
      'Invoice request approved': 'Invoice request approved',
      'Invoice request rejected': 'Invoice request rejected',
      'Invoice marked as issued': 'Invoice marked as issued',
      User: 'User',
      Actions: 'Actions',
      'Invoice requests awaiting review will appear here.':
        'Invoice requests awaiting review will appear here.',
    },
  },
  zh: {
    translation: {
      Invoices: '发票',
      Apply: '申请',
      'Invoice profiles': '开票信息',
      'Invoice history': '开票记录',
      'Admin review': '管理审核',
      'Apply for invoices from successful online top-ups':
        '基于成功在线充值记录申请发票',
      'No invoiceable top-ups': '暂无可开票充值',
      'Successful online top-ups that have not been invoiced will appear here.':
        '未开票的成功在线充值会显示在这里。',
      'Selected amount': '已选金额',
      'Selected orders': '已选订单',
      'Order numbers': '订单号',
      'Invoice type': '发票类型',
      'Invoice title': '发票抬头',
      'Invoice amount': '开票金额',
      'Personal invoice': '个人发票',
      'Company invoice': '企业发票',
      'Tax number': '税号',
      'Bank name': '开户行',
      'Bank account': '银行账号',
      'Registered address': '注册地址',
      'Registered phone': '注册电话',
      'Submit invoice request': '提交开票申请',
      'Confirm invoice issuance': '确认开具发票',
      'Invoice request submitted': '开票申请已提交',
      'Invoice profile saved': '开票信息已保存',
      'Save invoice profile': '保存开票信息',
      'Personal verification': '个人实名认证',
      'Company verification': '企业实名认证',
      'Start verification': '开始认证',
      'Verification session created': '认证会话已创建',
      Unverified: '未认证',
      'Verification pending': '认证中',
      Verified: '已认证',
      'Verification failed': '认证失败',
      'Verification expired': '认证过期',
      'Pending review': '待审核',
      Approved: '已通过',
      Rejected: '已拒绝',
      Issued: '已开具',
      Cancelled: '已取消',
      'Order number': '订单号',
      'Payment provider': '支付渠道',
      'Completed at': '完成时间',
      Amount: '金额',
      Status: '状态',
      'Created at': '创建时间',
      'No invoice requests': '暂无开票申请',
      'Submitted invoice requests will appear here.':
        '已提交的开票申请会显示在这里。',
      'Approve invoice request': '通过开票申请',
      'Approve this pending invoice request.': '通过这个待审核开票申请。',
      Approve: '通过',
      'Reject invoice request': '拒绝开票申请',
      'Enter a rejection reason for this invoice request.':
        '请输入该开票申请的拒绝原因。',
      Reject: '拒绝',
      'Reject reason': '拒绝原因',
      'Mark invoice as issued': '标记发票已开具',
      'Enter the issued invoice details.': '请输入已开具发票的信息。',
      'Mark as issued': '标记已开具',
      'Invoice number': '发票号码',
      'Invoice URL': '发票链接',
      'Issue note': '开具备注',
      'Invoice request approved': '开票申请已通过',
      'Invoice request rejected': '开票申请已拒绝',
      'Invoice marked as issued': '发票已标记为开具',
      User: '用户',
      Actions: '操作',
      'Invoice requests awaiting review will appear here.':
        '待审核的开票申请会显示在这里。',
    },
  },
  fr: {
    translation: {
      Invoices: 'Factures',
      Apply: 'Demander',
      'Invoice profiles': 'Profils de facturation',
      'Invoice history': 'Historique des factures',
      'Admin review': 'Revue admin',
      'Apply for invoices from successful online top-ups':
        'Demander des factures à partir de recharges en ligne réussies',
      'No invoiceable top-ups': 'Aucune recharge facturable',
      'Successful online top-ups that have not been invoiced will appear here.':
        'Les recharges en ligne réussies non facturées apparaîtront ici.',
      'Selected amount': 'Montant sélectionné',
      'Selected orders': 'Commandes sélectionnées',
      'Order numbers': 'Numéros de commande',
      'Invoice type': 'Type de facture',
      'Invoice title': 'Intitulé de facture',
      'Invoice amount': 'Montant de la facture',
      'Personal invoice': 'Facture personnelle',
      'Company invoice': "Facture d'entreprise",
      'Tax number': 'Numéro fiscal',
      'Bank name': 'Banque',
      'Bank account': 'Compte bancaire',
      'Registered address': 'Adresse enregistrée',
      'Registered phone': 'Téléphone enregistré',
      'Submit invoice request': 'Envoyer la demande de facture',
      'Confirm invoice issuance': "Confirmer l'émission de la facture",
      'Invoice request submitted': 'Demande de facture envoyée',
      'Invoice profile saved': 'Profil de facturation enregistré',
      'Save invoice profile': 'Enregistrer le profil de facturation',
      'Personal verification': 'Vérification personnelle',
      'Company verification': "Vérification d'entreprise",
      'Start verification': 'Démarrer la vérification',
      'Verification session created': 'Session de vérification créée',
      Unverified: 'Non vérifié',
      'Verification pending': 'Vérification en attente',
      Verified: 'Vérifié',
      'Verification failed': 'Échec de la vérification',
      'Verification expired': 'Vérification expirée',
      'Pending review': 'En attente de revue',
      Approved: 'Approuvé',
      Rejected: 'Rejeté',
      Issued: 'Émise',
      Cancelled: 'Annulée',
      'Order number': 'Numéro de commande',
      'Payment provider': 'Prestataire de paiement',
      'Completed at': 'Terminé le',
      Amount: 'Montant',
      Status: 'Statut',
      'Created at': 'Créé le',
      'No invoice requests': 'Aucune demande de facture',
      'Submitted invoice requests will appear here.':
        'Les demandes de facture envoyées apparaîtront ici.',
      'Approve invoice request': 'Approuver la demande de facture',
      'Approve this pending invoice request.':
        'Approuver cette demande de facture en attente.',
      Approve: 'Approuver',
      'Reject invoice request': 'Rejeter la demande de facture',
      'Enter a rejection reason for this invoice request.':
        'Saisissez un motif de rejet pour cette demande de facture.',
      Reject: 'Rejeter',
      'Reject reason': 'Motif de rejet',
      'Mark invoice as issued': 'Marquer la facture comme émise',
      'Enter the issued invoice details.':
        'Saisissez les informations de la facture émise.',
      'Mark as issued': 'Marquer comme émise',
      'Invoice number': 'Numéro de facture',
      'Invoice URL': 'URL de facture',
      'Issue note': "Note d'émission",
      'Invoice request approved': 'Demande de facture approuvée',
      'Invoice request rejected': 'Demande de facture rejetée',
      'Invoice marked as issued': 'Facture marquée comme émise',
      User: 'Utilisateur',
      Actions: 'Actions',
      'Invoice requests awaiting review will appear here.':
        'Les demandes de facture à examiner apparaîtront ici.',
    },
  },
  ja: {
    translation: {
      Invoices: '請求書',
      Apply: '申請',
      'Invoice profiles': '請求書情報',
      'Invoice history': '請求書履歴',
      'Admin review': '管理者レビュー',
      'Apply for invoices from successful online top-ups':
        '成功したオンラインチャージから請求書を申請',
      'No invoiceable top-ups': '請求可能なチャージはありません',
      'Successful online top-ups that have not been invoiced will appear here.':
        '未請求の成功したオンラインチャージがここに表示されます。',
      'Selected amount': '選択金額',
      'Selected orders': '選択した注文',
      'Order numbers': '注文番号',
      'Invoice type': '請求書タイプ',
      'Invoice title': '請求書宛名',
      'Invoice amount': '請求金額',
      'Personal invoice': '個人請求書',
      'Company invoice': '企業請求書',
      'Tax number': '税番号',
      'Bank name': '銀行名',
      'Bank account': '銀行口座',
      'Registered address': '登録住所',
      'Registered phone': '登録電話番号',
      'Submit invoice request': '請求書申請を送信',
      'Confirm invoice issuance': '請求書発行を確認',
      'Invoice request submitted': '請求書申請を送信しました',
      'Invoice profile saved': '請求書情報を保存しました',
      'Save invoice profile': '請求書情報を保存',
      'Personal verification': '個人認証',
      'Company verification': '企業認証',
      'Start verification': '認証を開始',
      'Verification session created': '認証セッションを作成しました',
      Unverified: '未認証',
      'Verification pending': '認証中',
      Verified: '認証済み',
      'Verification failed': '認証失敗',
      'Verification expired': '認証期限切れ',
      'Pending review': 'レビュー待ち',
      Approved: '承認済み',
      Rejected: '却下済み',
      Issued: '発行済み',
      Cancelled: 'キャンセル済み',
      'Order number': '注文番号',
      'Payment provider': '決済プロバイダー',
      'Completed at': '完了日時',
      Amount: '金額',
      Status: 'ステータス',
      'Created at': '作成日時',
      'No invoice requests': '請求書申請はありません',
      'Submitted invoice requests will appear here.':
        '送信した請求書申請がここに表示されます。',
      'Approve invoice request': '請求書申請を承認',
      'Approve this pending invoice request.':
        'このレビュー待ち請求書申請を承認します。',
      Approve: '承認',
      'Reject invoice request': '請求書申請を却下',
      'Enter a rejection reason for this invoice request.':
        'この請求書申請の却下理由を入力してください。',
      Reject: '却下',
      'Reject reason': '却下理由',
      'Mark invoice as issued': '請求書を発行済みにする',
      'Enter the issued invoice details.': '発行済み請求書の詳細を入力してください。',
      'Mark as issued': '発行済みにする',
      'Invoice number': '請求書番号',
      'Invoice URL': '請求書URL',
      'Issue note': '発行メモ',
      'Invoice request approved': '請求書申請を承認しました',
      'Invoice request rejected': '請求書申請を却下しました',
      'Invoice marked as issued': '請求書を発行済みにしました',
      User: 'ユーザー',
      Actions: '操作',
      'Invoice requests awaiting review will appear here.':
        'レビュー待ちの請求書申請がここに表示されます。',
    },
  },
  ru: {
    translation: {
      Invoices: 'Счета',
      Apply: 'Подать заявку',
      'Invoice profiles': 'Профили счетов',
      'Invoice history': 'История счетов',
      'Admin review': 'Проверка администратором',
      'Apply for invoices from successful online top-ups':
        'Подать заявку на счет по успешным онлайн-пополнениям',
      'No invoiceable top-ups': 'Нет пополнений для счета',
      'Successful online top-ups that have not been invoiced will appear here.':
        'Здесь появятся успешные онлайн-пополнения без выставленного счета.',
      'Selected amount': 'Выбранная сумма',
      'Selected orders': 'Выбранные заказы',
      'Order numbers': 'Номера заказов',
      'Invoice type': 'Тип счета',
      'Invoice title': 'Название счета',
      'Invoice amount': 'Сумма счета',
      'Personal invoice': 'Личный счет',
      'Company invoice': 'Счет компании',
      'Tax number': 'Налоговый номер',
      'Bank name': 'Название банка',
      'Bank account': 'Банковский счет',
      'Registered address': 'Юридический адрес',
      'Registered phone': 'Зарегистрированный телефон',
      'Submit invoice request': 'Отправить заявку на счет',
      'Confirm invoice issuance': 'Подтвердить выставление счета',
      'Invoice request submitted': 'Заявка на счет отправлена',
      'Invoice profile saved': 'Профиль счета сохранен',
      'Save invoice profile': 'Сохранить профиль счета',
      'Personal verification': 'Личная верификация',
      'Company verification': 'Верификация компании',
      'Start verification': 'Начать верификацию',
      'Verification session created': 'Сессия верификации создана',
      Unverified: 'Не verified',
      'Verification pending': 'Верификация ожидает',
      Verified: 'Проверено',
      'Verification failed': 'Верификация не пройдена',
      'Verification expired': 'Верификация истекла',
      'Pending review': 'Ожидает проверки',
      Approved: 'Одобрено',
      Rejected: 'Отклонено',
      Issued: 'Выставлен',
      Cancelled: 'Отменен',
      'Order number': 'Номер заказа',
      'Payment provider': 'Платежный провайдер',
      'Completed at': 'Завершено',
      Amount: 'Сумма',
      Status: 'Статус',
      'Created at': 'Создано',
      'No invoice requests': 'Нет заявок на счета',
      'Submitted invoice requests will appear here.':
        'Отправленные заявки на счета появятся здесь.',
      'Approve invoice request': 'Одобрить заявку на счет',
      'Approve this pending invoice request.':
        'Одобрить эту ожидающую заявку на счет.',
      Approve: 'Одобрить',
      'Reject invoice request': 'Отклонить заявку на счет',
      'Enter a rejection reason for this invoice request.':
        'Введите причину отклонения этой заявки на счет.',
      Reject: 'Отклонить',
      'Reject reason': 'Причина отклонения',
      'Mark invoice as issued': 'Отметить счет как выставленный',
      'Enter the issued invoice details.': 'Введите данные выставленного счета.',
      'Mark as issued': 'Отметить как выставленный',
      'Invoice number': 'Номер счета',
      'Invoice URL': 'URL счета',
      'Issue note': 'Примечание к выставлению',
      'Invoice request approved': 'Заявка на счет одобрена',
      'Invoice request rejected': 'Заявка на счет отклонена',
      'Invoice marked as issued': 'Счет отмечен как выставленный',
      User: 'Пользователь',
      Actions: 'Действия',
      'Invoice requests awaiting review will appear here.':
        'Заявки на счета, ожидающие проверки, появятся здесь.',
    },
  },
  vi: {
    translation: {
      Invoices: 'Hóa đơn',
      Apply: 'Đăng ký',
      'Invoice profiles': 'Thông tin hóa đơn',
      'Invoice history': 'Lịch sử hóa đơn',
      'Admin review': 'Duyệt quản trị',
      'Apply for invoices from successful online top-ups':
        'Đăng ký hóa đơn từ các lần nạp trực tuyến thành công',
      'No invoiceable top-ups': 'Không có lần nạp có thể xuất hóa đơn',
      'Successful online top-ups that have not been invoiced will appear here.':
        'Các lần nạp trực tuyến thành công chưa xuất hóa đơn sẽ xuất hiện tại đây.',
      'Selected amount': 'Số tiền đã chọn',
      'Selected orders': 'Đơn đã chọn',
      'Order numbers': 'Mã đơn hàng',
      'Invoice type': 'Loại hóa đơn',
      'Invoice title': 'Tên hóa đơn',
      'Invoice amount': 'Số tiền hóa đơn',
      'Personal invoice': 'Hóa đơn cá nhân',
      'Company invoice': 'Hóa đơn doanh nghiệp',
      'Tax number': 'Mã số thuế',
      'Bank name': 'Tên ngân hàng',
      'Bank account': 'Tài khoản ngân hàng',
      'Registered address': 'Địa chỉ đăng ký',
      'Registered phone': 'Điện thoại đăng ký',
      'Submit invoice request': 'Gửi yêu cầu hóa đơn',
      'Confirm invoice issuance': 'Xác nhận xuất hóa đơn',
      'Invoice request submitted': 'Đã gửi yêu cầu hóa đơn',
      'Invoice profile saved': 'Đã lưu thông tin hóa đơn',
      'Save invoice profile': 'Lưu thông tin hóa đơn',
      'Personal verification': 'Xác minh cá nhân',
      'Company verification': 'Xác minh doanh nghiệp',
      'Start verification': 'Bắt đầu xác minh',
      'Verification session created': 'Đã tạo phiên xác minh',
      Unverified: 'Chưa xác minh',
      'Verification pending': 'Đang xác minh',
      Verified: 'Đã xác minh',
      'Verification failed': 'Xác minh thất bại',
      'Verification expired': 'Xác minh hết hạn',
      'Pending review': 'Chờ duyệt',
      Approved: 'Đã duyệt',
      Rejected: 'Đã từ chối',
      Issued: 'Đã xuất',
      Cancelled: 'Đã hủy',
      'Order number': 'Mã đơn hàng',
      'Payment provider': 'Nhà cung cấp thanh toán',
      'Completed at': 'Hoàn tất lúc',
      Amount: 'Số tiền',
      Status: 'Trạng thái',
      'Created at': 'Tạo lúc',
      'No invoice requests': 'Không có yêu cầu hóa đơn',
      'Submitted invoice requests will appear here.':
        'Các yêu cầu hóa đơn đã gửi sẽ xuất hiện tại đây.',
      'Approve invoice request': 'Duyệt yêu cầu hóa đơn',
      'Approve this pending invoice request.':
        'Duyệt yêu cầu hóa đơn đang chờ này.',
      Approve: 'Duyệt',
      'Reject invoice request': 'Từ chối yêu cầu hóa đơn',
      'Enter a rejection reason for this invoice request.':
        'Nhập lý do từ chối cho yêu cầu hóa đơn này.',
      Reject: 'Từ chối',
      'Reject reason': 'Lý do từ chối',
      'Mark invoice as issued': 'Đánh dấu hóa đơn đã xuất',
      'Enter the issued invoice details.': 'Nhập thông tin hóa đơn đã xuất.',
      'Mark as issued': 'Đánh dấu đã xuất',
      'Invoice number': 'Số hóa đơn',
      'Invoice URL': 'URL hóa đơn',
      'Issue note': 'Ghi chú xuất hóa đơn',
      'Invoice request approved': 'Đã duyệt yêu cầu hóa đơn',
      'Invoice request rejected': 'Đã từ chối yêu cầu hóa đơn',
      'Invoice marked as issued': 'Đã đánh dấu hóa đơn là đã xuất',
      User: 'Người dùng',
      Actions: 'Thao tác',
      'Invoice requests awaiting review will appear here.':
        'Các yêu cầu hóa đơn chờ duyệt sẽ xuất hiện tại đây.',
    },
  },
} as const
```

The required typed confirmation phrase remains the literal `确认开具发票` in code, not a translated key.

- [ ] **Step 2: Merge invoice translations**

Modify `web/default/src/i18n/config.ts`:

```ts
import { invoicesI18nResources } from '../features/invoices/i18n'
```

Then wrap each locale resource with one additional merge:

```ts
  en: mergeFeatureTranslations(
    mergeFeatureTranslations(
      mergeFeatureTranslations(
        mergeFeatureTranslations(en, pricingI18nResources.en),
        subscriptionsI18nResources.en
      ),
      usageLogsI18nResources.en
    ),
    invoicesI18nResources.en
  ),
```

Repeat the same structure for `zh`, `fr`, `ru`, `ja`, and `vi`.

- [ ] **Step 3: Add sidebar item**

Modify `web/default/src/hooks/use-sidebar-data.ts`:

```ts
import {
  LayoutDashboard,
  Activity,
  Key,
  FileText,
  Wallet,
  CreditCard,
  ReceiptText,
  Box,
  Users,
  Ticket,
  User,
  Command,
  Radio,
  FlaskConical,
  MessageSquare,
  ListTodo,
  Settings,
} from 'lucide-react'
```

Add the item after Wallet:

```ts
          {
            title: t('Invoices'),
            url: '/invoices',
            icon: ReceiptText,
          },
```

- [ ] **Step 4: Add sidebar module config**

Modify `web/default/src/hooks/use-sidebar-config.ts` in `DEFAULT_SIDEBAR_MODULES.personal`:

```ts
  personal: {
    enabled: true,
    topup: true,
    invoice: true,
    personal: true,
    subscription: true,
  },
```

Add URL mapping:

```ts
  '/invoices': { section: 'personal', module: 'invoice' },
```

Modify `web/default/src/features/system-settings/maintenance/config.ts` in `SIDEBAR_MODULES_DEFAULT.personal`:

```ts
  personal: {
    enabled: true,
    topup: true,
    invoice: true,
    personal: true,
    subscription: true,
  },
```

Modify `web/default/src/features/system-settings/maintenance/sidebar-modules-section.tsx` in `moduleMeta.personal`:

```tsx
      invoice: {
        title: t('Invoices'),
        description: t('Apply for invoices from successful online top-ups'),
      },
```

- [ ] **Step 5: Run i18n sync and typecheck**

Run:

```bash
cd web/default && bun run i18n:sync
cd web/default && bun run typecheck
```

Expected: both commands PASS.

- [ ] **Step 6: Commit navigation and i18n work**

Run:

```bash
git add web/default/src/features/invoices/i18n.ts web/default/src/i18n/config.ts web/default/src/hooks/use-sidebar-data.ts web/default/src/hooks/use-sidebar-config.ts web/default/src/features/system-settings/maintenance/config.ts web/default/src/features/system-settings/maintenance/sidebar-modules-section.tsx web/default/src/i18n/locales
git commit -m "Add invoice navigation and translations"
```

---

## Task 7: End-To-End Verification

**Files:**
- No new files.
- Verify all modified backend and frontend files.

- [ ] **Step 1: Run backend targeted tests**

Run:

```bash
go test ./model -run 'TestInvoice|TestRealName|TestMaskSensitiveIdentifier|TestCreateRealNameSession|TestApplyVerifiedCompanyProfile' -count=1
go test ./service/realname -count=1
go test ./controller -run 'TestGetEligibleInvoiceTopUps|TestCreateInvoiceEndpoint|TestInvoiceDetailRequiresOwnership|TestAdminInvoiceTransitions|TestCreateRealNameSessionEndpoint|TestRealNameCallbackUpdatesProfile' -count=1
```

Expected: PASS.

- [ ] **Step 2: Run broader backend compile tests**

Run:

```bash
go test ./controller ./model ./service/realname -count=1
```

Expected: PASS.

- [ ] **Step 3: Run frontend checks**

Run:

```bash
cd web/default && bun run i18n:sync
cd web/default && bun run typecheck
cd web/default && bun run build
```

Expected: PASS.

- [ ] **Step 4: Run a local manual API smoke check**

Run the backend:

```bash
go run main.go
```

Run the frontend in another shell:

```bash
cd web/default && bun run dev
```

Open `http://localhost:5173/invoices` with an authenticated browser session. Confirm:

- Personal users can see eligible successful online top-ups.
- Selecting two top-ups updates the selected amount summary.
- Submit opens the second confirmation dialog.
- The final submit button is disabled until the input equals `确认开具发票`.
- Submitted top-ups disappear from `GET /api/invoice/eligible-topups`.
- Admin users see the Admin review tab.
- Admin can approve, reject, and issue records only in allowed states.

- [ ] **Step 5: Inspect git diff for top-up boundary**

Run:

```bash
git diff --name-only HEAD~6..HEAD
```

Expected: changed files do not include `model/topup.go`, `controller/topup.go`, or provider payment callback files. `router/api-router.go` and `model/main.go` are allowed because they register new domains.

- [ ] **Step 6: Final commit if verification changes generated files**

If `bun run i18n:sync` changed locale report or locale ordering, commit that generated drift:

```bash
git add web/default/src/i18n/locales
git commit -m "Normalize invoice locale files"
```

---

## Rollback Notes

- New database state is contained in `invoice_requests`, `invoice_request_items`, `user_invoice_profiles`, and `user_real_name_verifications`.
- Removing the feature from the UI only requires removing the `/invoices` route and sidebar item; it does not affect recharge behavior.
- Existing top-up records remain unchanged throughout this plan.
