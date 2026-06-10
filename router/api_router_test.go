package router

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type subscriptionPlansAPIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    []struct {
		Plan struct {
			Id         int    `json:"id"`
			Title      string `json:"title"`
			Enabled    bool   `json:"enabled"`
			ShowOnHome bool   `json:"show_on_home"`
			SortOrder  int    `json:"sort_order"`
		} `json:"plan"`
	} `json:"data"`
}

type pricingOptionResponse struct {
	Success bool `json:"success"`
	Options []struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	} `json:"options"`
}

func setupSubscriptionRouteTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	gin.SetMode(gin.TestMode)
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false
	common.GlobalApiRateLimitEnable = false
	common.CriticalRateLimitEnable = false
	common.OptionMapRWMutex.Lock()
	originalOptionMap := common.OptionMap
	common.OptionMap = map[string]string{
		"payment_setting.payment_compliance_confirmed":     "true",
		"payment_setting.payment_compliance_terms_version": operation_setting.CurrentComplianceTermsVersion,
	}
	common.OptionMapRWMutex.Unlock()
	previousPaymentSetting := *operation_setting.GetPaymentSetting()
	paymentSetting := operation_setting.GetPaymentSetting()
	paymentSetting.ComplianceConfirmed = true
	paymentSetting.ComplianceTermsVersion = operation_setting.CurrentComplianceTermsVersion

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	model.DB = db
	model.LOG_DB = db

	if err := db.AutoMigrate(&model.SubscriptionPlan{}); err != nil {
		t.Fatalf("failed to migrate subscription plans table: %v", err)
	}

	plans := []model.SubscriptionPlan{
		{
			Title:      "Home Plan",
			Enabled:    true,
			ShowOnHome: true,
			SortOrder:  30,
		},
		{
			Title:      "Catalog Only Plan",
			Enabled:    true,
			ShowOnHome: false,
			SortOrder:  20,
		},
		{
			Title:      "Disabled Plan",
			Enabled:    false,
			ShowOnHome: true,
			SortOrder:  10,
		},
	}
	if err := db.Select("*").Create(&plans).Error; err != nil {
		t.Fatalf("failed to seed subscription plans: %v", err)
	}
	if err := db.Model(&model.SubscriptionPlan{}).Where("title = ?", "Catalog Only Plan").Update("show_on_home", false).Error; err != nil {
		t.Fatalf("failed to seed catalog-only subscription plan state: %v", err)
	}
	if err := db.Model(&model.SubscriptionPlan{}).Where("title = ?", "Disabled Plan").Update("enabled", false).Error; err != nil {
		t.Fatalf("failed to seed disabled subscription plan state: %v", err)
	}

	t.Cleanup(func() {
		*operation_setting.GetPaymentSetting() = previousPaymentSetting
		common.OptionMapRWMutex.Lock()
		common.OptionMap = originalOptionMap
		common.OptionMapRWMutex.Unlock()
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func setupPricingRouteTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	gin.SetMode(gin.TestMode)
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false
	common.GlobalApiRateLimitEnable = false
	common.CriticalRateLimitEnable = false

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}

	model.DB = db
	model.LOG_DB = db

	if err := db.AutoMigrate(&model.Ability{}, &model.Channel{}, &model.Vendor{}, &model.Model{}); err != nil {
		t.Fatalf("failed to migrate pricing tables: %v", err)
	}

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func setupSubscriptionRouteTestServer() *gin.Engine {
	server := gin.New()
	store := cookie.NewStore([]byte(common.SessionSecret))
	server.Use(sessions.Sessions("session", store))
	SetApiRouter(server)
	return server
}

func TestSubscriptionHomePlansAllowsAnonymousAccess(t *testing.T) {
	setupSubscriptionRouteTestDB(t)
	server := setupSubscriptionRouteTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/subscription/home/plans", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 for anonymous home plans request, got %d", recorder.Code)
	}

	var response subscriptionPlansAPIResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode home plans response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got message: %s", response.Message)
	}
	if len(response.Data) != 1 {
		t.Fatalf("expected exactly one public plan, got %d", len(response.Data))
	}
}

func TestSubscriptionPublicPlansAllowsAnonymousAccess(t *testing.T) {
	setupSubscriptionRouteTestDB(t)
	server := setupSubscriptionRouteTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/subscription/public/plans", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 for anonymous public plans request, got %d", recorder.Code)
	}

	var response subscriptionPlansAPIResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode public plans response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got message: %s", response.Message)
	}
	if len(response.Data) != 2 {
		t.Fatalf("expected two enabled plans, got %d", len(response.Data))
	}
	if response.Data[0].Plan.Title != "Home Plan" {
		t.Fatalf("expected highest sort_order plan first, got %q", response.Data[0].Plan.Title)
	}
	if response.Data[1].Plan.Title != "Catalog Only Plan" {
		t.Fatalf("expected show_on_home=false enabled plan to be included, got %q", response.Data[1].Plan.Title)
	}
	for _, item := range response.Data {
		if !item.Plan.Enabled {
			t.Fatalf("disabled plan %q must not be returned", item.Plan.Title)
		}
	}
}

func TestSubscriptionPublicPlansRespectPaymentCompliance(t *testing.T) {
	setupSubscriptionRouteTestDB(t)
	server := setupSubscriptionRouteTestServer()

	previous := common.OptionMap["payment_setting.payment_compliance_confirmed"]
	common.OptionMap["payment_setting.payment_compliance_confirmed"] = "false"
	previousPaymentSetting := *operation_setting.GetPaymentSetting()
	operation_setting.GetPaymentSetting().ComplianceConfirmed = false
	t.Cleanup(func() {
		common.OptionMap["payment_setting.payment_compliance_confirmed"] = previous
		*operation_setting.GetPaymentSetting() = previousPaymentSetting
	})

	req := httptest.NewRequest(http.MethodGet, "/api/subscription/public/plans", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 when compliance is not confirmed, got %d", recorder.Code)
	}

	var response subscriptionPlansAPIResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode public plans response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response, got message: %s", response.Message)
	}
	if len(response.Data) != 0 {
		t.Fatalf("expected no plans when compliance is not confirmed, got %d", len(response.Data))
	}
}

func TestSubscriptionPlansStillRequireAuthentication(t *testing.T) {
	setupSubscriptionRouteTestDB(t)
	server := setupSubscriptionRouteTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/subscription/plans", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for anonymous authenticated plans request, got %d", recorder.Code)
	}
}

func TestInvoiceAndRealNameRoutesRegister(t *testing.T) {
	setupSubscriptionRouteTestServer()
}

func TestInvoiceAndRealNameAuthBoundaries(t *testing.T) {
	setupSubscriptionRouteTestDB(t)
	server := setupSubscriptionRouteTestServer()

	cases := []string{
		"/api/invoice/eligible-topups",
		"/api/invoice/eligible-records",
		"/api/invoice/self",
		"/api/invoice/profile",
		"/api/realname/status",
	}
	for _, path := range cases {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		recorder := httptest.NewRecorder()
		server.ServeHTTP(recorder, req)
		if recorder.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for anonymous request path=%s, got %d", path, recorder.Code)
		}
	}

	adminReq := httptest.NewRequest(http.MethodGet, "/api/invoice/admin", nil)
	adminRecorder := httptest.NewRecorder()
	server.ServeHTTP(adminRecorder, adminReq)
	if adminRecorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for anonymous invoice admin request, got %d", adminRecorder.Code)
	}
}

func TestPricingIncludesAnonymousOptionSubset(t *testing.T) {
	setupPricingRouteTestDB(t)

	common.OptionMapRWMutex.Lock()
	originalOptionMap := common.OptionMap
	common.OptionMap = map[string]string{
		"GroupModelBilling":            `{"vip":{"gpt-4":{"quota_type":1}}}`,
		"billing_setting.billing_mode": `{"gpt-4":"tiered_expr"}`,
		"billing_setting.billing_expr": `{"gpt-4":"tier(\"base\", p * 1 + c * 2)"}`,
		"SystemSecret":                 "should-not-leak",
	}
	common.OptionMapRWMutex.Unlock()
	t.Cleanup(func() {
		common.OptionMapRWMutex.Lock()
		common.OptionMap = originalOptionMap
		common.OptionMapRWMutex.Unlock()
	})

	server := setupSubscriptionRouteTestServer()

	req := httptest.NewRequest(http.MethodGet, "/api/pricing", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200 for anonymous pricing request, got %d", recorder.Code)
	}

	var response pricingOptionResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode pricing response: %v", err)
	}
	if !response.Success {
		t.Fatalf("expected success response")
	}

	if len(response.Options) != 3 {
		t.Fatalf("expected exactly 3 pricing options, got %d", len(response.Options))
	}

	optionsByKey := make(map[string]string, len(response.Options))
	for _, option := range response.Options {
		optionsByKey[option.Key] = option.Value
	}

	if optionsByKey["GroupModelBilling"] != `{"vip":{"gpt-4":{"quota_type":1}}}` {
		t.Fatalf("expected GroupModelBilling option to be returned")
	}
	if optionsByKey["billing_setting.billing_mode"] != `{"gpt-4":"tiered_expr"}` {
		t.Fatalf("expected billing_setting.billing_mode option to be returned")
	}
	if optionsByKey["billing_setting.billing_expr"] != `{"gpt-4":"tier(\"base\", p * 1 + c * 2)"}` {
		t.Fatalf("expected billing_setting.billing_expr option to be returned")
	}
	if _, ok := optionsByKey["SystemSecret"]; ok {
		t.Fatalf("expected non-pricing options to stay hidden")
	}
}
