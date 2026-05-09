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
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
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
