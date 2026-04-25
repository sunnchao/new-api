package router

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type subscriptionPlansAPIResponse struct {
	Success bool              `json:"success"`
	Message string            `json:"message"`
	Data    []json.RawMessage `json:"data"`
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

	if err := db.Create(&model.SubscriptionPlan{
		Title:      "Home Plan",
		Enabled:    true,
		ShowOnHome: true,
	}).Error; err != nil {
		t.Fatalf("failed to seed subscription plan: %v", err)
	}

	t.Cleanup(func() {
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

func TestPricingIncludesAnonymousOptionSubset(t *testing.T) {
	setupPricingRouteTestDB(t)

	common.OptionMapRWMutex.Lock()
	originalOptionMap := common.OptionMap
	common.OptionMap = map[string]string{
		"GroupModelBilling": `{"vip":{"gpt-4":{"quota_type":1}}}`,
		"SystemSecret":      "should-not-leak",
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
	if _, ok := optionsByKey["SystemSecret"]; ok {
		t.Fatalf("expected non-pricing options to stay hidden")
	}
}
