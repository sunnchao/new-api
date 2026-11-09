package controller

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Calcium-Ion/go-epay/epay"
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	sqlmysql "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stripe/stripe-go/v81/webhook"
	waffo "github.com/waffo-com/waffo-go/utils"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const topupCallbackFlowQuotaPerUnit = 1000

type topupCallbackFlowGateway struct {
	dbType     common.DatabaseType
	kind       string
	dsn        string
	newOrder   func(*testing.T, *topupCallbackFlowFixture, int, string, int64, float64, string) *model.TopUp
	wrong      func(*testing.T, *topupCallbackFlowFixture, string, int64) *httptest.ResponseRecorder
	expectFail int
}

type topupCallbackFlowFixture struct {
	router  *gin.Engine
	now     time.Time
	userID  int
	keys    *waffo.KeyPair
	gateway topupCallbackFlowGateway
}

type topupCallbackFlowCampaign struct {
	key           string
	enabled       bool
	start, end    int64
	dayStart      int64
	dayEnd        int64
	dayRate       float64
	tiers         string
	periods       string
	giftExpiresIn string
}

type topupCallbackFlowCampaignResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Enabled bool   `json:"enabled"`
		Status  string `json:"status"`
	} `json:"data"`
}

func topupCallbackFlowGateways() []topupCallbackFlowGateway {
	return []topupCallbackFlowGateway{
		{dbType: common.DatabaseTypeSQLite, kind: "sqlite", expectFail: http.StatusOK,
			newOrder: epayFlowOrder, wrong: epayFlowWrong},
		{dbType: common.DatabaseTypeMySQL, dsn: os.Getenv("TEST_MYSQL_DSN"), kind: "mysql", expectFail: http.StatusBadRequest,
			newOrder: stripeFlowOrder, wrong: stripeFlowWrong},
		{dbType: common.DatabaseTypePostgreSQL, dsn: os.Getenv("TEST_POSTGRES_DSN"), kind: "postgres", expectFail: http.StatusUnauthorized,
			newOrder: creemFlowOrder, wrong: creemFlowWrong},
	}
}

func requireTopupCallbackFlowDSN(t *testing.T, gateway topupCallbackFlowGateway) {
	t.Helper()
	if gateway.kind != "sqlite" && gateway.dsn == "" {
		t.Skipf("%s database matrix unavailable: TEST_%s_DSN is not configured", gateway.kind, strings.ToUpper(gateway.kind))
	}
}

func topupCallbackFlowDefaultCampaign(now time.Time) topupCallbackFlowCampaign {
	return topupCallbackFlowCampaign{
		key: "callback-flow", enabled: true,
		start: now.Add(-time.Hour).Unix(), end: now.Add(time.Hour).Unix(),
		tiers: `[{"min_amount":100,"bonus_amount":10},{"min_amount":200,"bonus_amount":20},{"min_amount":400,"bonus_amount":10}]`,
	}
}

func setupTopupCallbackFlowTest(t *testing.T, gateway topupCallbackFlowGateway) *topupCallbackFlowFixture {
	t.Helper()
	requireTopupCallbackFlowDSN(t, gateway)
	gin.SetMode(gin.TestMode)
	require.NoError(t, i18n.Init())

	previous := struct {
		db, logDB                               *gorm.DB
		mainType, logType                       common.DatabaseType
		redis, master                           bool
		quotaPerUnit                            float64
		configs                                 map[string]string
		payAddress, epayID, epayKey             string
		payMethods                              []map[string]string
		stripeAPI, stripeWebhook, stripePrice   string
		creemAPI, creemProducts, creemSecret    string
		creemTestMode                           bool
		waffoEnabled, waffoSandbox              bool
		waffoAPI, waffoPrivate, waffoPublic     string
		waffoSandboxAPI                         string
		waffoSandboxPrivate, waffoSandboxPublic string
		pancakeMerchant, pancakePrivate         string
		pancakeProduct, pancakeStore            string
		serverAddress                           string
	}{
		db: model.DB, logDB: model.LOG_DB,
		mainType: common.MainDatabaseType(), logType: common.LogDatabaseType(),
		redis: common.RedisEnabled, master: common.IsMasterNode, quotaPerUnit: common.QuotaPerUnit,
		configs:    config.GlobalConfig.ExportAllConfigs(),
		payAddress: operation_setting.PayAddress, epayID: operation_setting.EpayId, epayKey: operation_setting.EpayKey,
		payMethods: operation_setting.PayMethods,
		stripeAPI:  setting.StripeApiSecret, stripeWebhook: setting.StripeWebhookSecret, stripePrice: setting.StripePriceId,
		creemAPI: setting.CreemApiKey, creemProducts: setting.CreemProducts, creemSecret: setting.CreemWebhookSecret,
		creemTestMode: setting.CreemTestMode,
		waffoEnabled:  setting.WaffoEnabled, waffoSandbox: setting.WaffoSandbox,
		waffoAPI: setting.WaffoApiKey, waffoPrivate: setting.WaffoPrivateKey, waffoPublic: setting.WaffoPublicCert,
		waffoSandboxAPI: setting.WaffoSandboxApiKey, waffoSandboxPrivate: setting.WaffoSandboxPrivateKey,
		waffoSandboxPublic: setting.WaffoSandboxPublicCert,
		pancakeMerchant:    setting.WaffoPancakeMerchantID, pancakePrivate: setting.WaffoPancakePrivateKey,
		pancakeProduct: setting.WaffoPancakeProductID, pancakeStore: setting.WaffoPancakeStoreID,
		serverAddress: system_setting.ServerAddress,
	}

	var db, adminDB *gorm.DB
	var err error
	var createdDBName string
	if gateway.kind == "sqlite" {
		path := filepath.Join(t.TempDir(), "callback-flow.db")
		db, err = gorm.Open(sqlite.Open(path), &gorm.Config{})
	} else {
		adminDSN := gateway.dsn
		createdDBName = fmt.Sprintf("newapi_callback_%d", time.Now().UnixNano())
		if gateway.kind == "mysql" {
			parsed, parseErr := sqlmysql.ParseDSN(adminDSN)
			require.NoError(t, parseErr)
			host, _, splitErr := net.SplitHostPort(parsed.Addr)
			require.NoError(t, splitErr)
			require.True(t, net.ParseIP(host).IsLoopback(), "database tests only permit loopback instances")
			adminDB, err = gorm.Open(mysql.Open(adminDSN), &gorm.Config{})
			require.NoError(t, err)
			require.NoError(t, adminDB.Exec("CREATE DATABASE "+createdDBName+" CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci").Error)
			parsed.DBName = createdDBName
			db, err = gorm.Open(mysql.Open(parsed.FormatDSN()), &gorm.Config{})
		} else {
			parsed, parseErr := url.Parse(adminDSN)
			require.NoError(t, parseErr)
			require.True(t, net.ParseIP(parsed.Hostname()).IsLoopback(), "database tests only permit loopback instances")
			adminDB, err = gorm.Open(postgres.Open(adminDSN), &gorm.Config{})
			require.NoError(t, err)
			require.NoError(t, adminDB.Exec("CREATE DATABASE "+createdDBName).Error)
			parsed.Path = "/" + createdDBName
			db, err = gorm.Open(postgres.Open(parsed.String()), &gorm.Config{})
		}
	}
	require.NoError(t, err)
	versionSQL := "SELECT version()"
	if gateway.kind == "sqlite" {
		versionSQL = "SELECT sqlite_version()"
	}
	var version string
	require.NoError(t, db.Raw(versionSQL).Scan(&version).Error)
	t.Logf("%s database version: %s", gateway.kind, version)
	require.NoError(t, db.AutoMigrate(
		&model.User{}, &model.TopUp{}, &model.Redemption{}, &model.TopupCampaignEvent{},
		&model.UserGiftQuota{}, &model.Log{}, &model.SubscriptionOrder{}, &model.Option{},
	))
	connection, err := db.DB()
	require.NoError(t, err)
	connection.SetMaxOpenConns(1)

	t.Setenv("LOG_SQL_DSN", "")
	model.DB, model.LOG_DB = db, db
	common.SetDatabaseTypes(gateway.dbType, gateway.dbType)
	common.RedisEnabled = false
	common.IsMasterNode = false
	common.QuotaPerUnit = topupCallbackFlowQuotaPerUnit
	require.NoError(t, model.InitLogDB())
	confirmPaymentComplianceForTest(t)

	operation_setting.PayAddress = "https://pay.example.com"
	operation_setting.EpayId = "epay_id"
	operation_setting.EpayKey = "test-key"
	operation_setting.PayMethods = []map[string]string{{"type": "alipay"}}
	system_setting.ServerAddress = "http://localhost:3000"

	keys, err := waffo.GenerateKeyPair()
	require.NoError(t, err)
	setting.StripeApiSecret = "sk_test_123"
	setting.StripeWebhookSecret = "whsec_callback_flow"
	setting.StripePriceId = "price_callback_flow"
	setting.CreemApiKey = "creem_api_key"
	setting.CreemProducts = `[{"productId":"prod_callback_flow"}]`
	setting.CreemWebhookSecret = "creem_callback_secret"
	setting.CreemTestMode = false
	setting.WaffoEnabled = true
	setting.WaffoSandbox = false
	setting.WaffoApiKey = "waffo_api_key"
	setting.WaffoPrivateKey = keys.PrivateKey
	setting.WaffoPublicCert = keys.PublicKey
	setting.WaffoSandboxApiKey = "waffo_sandbox_api_key"
	setting.WaffoSandboxPrivateKey = keys.PrivateKey
	setting.WaffoSandboxPublicCert = keys.PublicKey
	setting.WaffoPancakeMerchantID = "merchant"
	setting.WaffoPancakePrivateKey = keys.PrivateKey
	setting.WaffoPancakeProductID = "product"
	setting.WaffoPancakeStoreID = "store_callback_flow"
	t.Setenv("WAFFO_WEBHOOK_PUBLIC_KEY", keys.PublicKey)

	now := time.Now()
	user := &model.User{
		Username: "callback-flow-user", Password: "placeholder", Status: common.UserStatusEnabled,
		Group: "default", AffCode: "callback-flow-user",
	}
	require.NoError(t, db.Create(user).Error)

	router := gin.New()
	router.POST("/api/user/epay/notify", EpayNotify)
	router.GET("/api/user/epay/notify", EpayNotify)
	router.POST("/api/stripe/webhook", StripeWebhook)
	router.POST("/api/creem/webhook", CreemWebhook)
	router.POST("/api/waffo/webhook", WaffoWebhook)
	router.POST("/api/waffo-pancake/webhook/:env", WaffoPancakeWebhook)

	t.Cleanup(func() {
		_ = config.GlobalConfig.LoadFromDB(previous.configs)
		model.DB, model.LOG_DB = previous.db, previous.logDB
		common.SetDatabaseTypes(previous.mainType, previous.logType)
		common.IsMasterNode = false
		_ = model.InitLogDB()
		common.SetDatabaseTypes(previous.mainType, previous.logType)
		common.RedisEnabled, common.IsMasterNode = previous.redis, previous.master
		common.QuotaPerUnit = previous.quotaPerUnit
		operation_setting.PayAddress, operation_setting.EpayId, operation_setting.EpayKey = previous.payAddress, previous.epayID, previous.epayKey
		operation_setting.PayMethods = previous.payMethods
		setting.StripeApiSecret, setting.StripeWebhookSecret, setting.StripePriceId = previous.stripeAPI, previous.stripeWebhook, previous.stripePrice
		setting.CreemApiKey, setting.CreemProducts, setting.CreemWebhookSecret = previous.creemAPI, previous.creemProducts, previous.creemSecret
		setting.CreemTestMode = previous.creemTestMode
		setting.WaffoEnabled, setting.WaffoSandbox = previous.waffoEnabled, previous.waffoSandbox
		setting.WaffoApiKey, setting.WaffoPrivateKey, setting.WaffoPublicCert = previous.waffoAPI, previous.waffoPrivate, previous.waffoPublic
		setting.WaffoSandboxApiKey, setting.WaffoSandboxPrivateKey, setting.WaffoSandboxPublicCert = previous.waffoSandboxAPI, previous.waffoSandboxPrivate, previous.waffoSandboxPublic
		setting.WaffoPancakeMerchantID, setting.WaffoPancakePrivateKey = previous.pancakeMerchant, previous.pancakePrivate
		setting.WaffoPancakeProductID, setting.WaffoPancakeStoreID = previous.pancakeProduct, previous.pancakeStore
		system_setting.ServerAddress = previous.serverAddress
		if connection, connErr := db.DB(); connErr == nil {
			_ = connection.Close()
		}
		if adminDB != nil && createdDBName != "" {
			_ = adminDB.Exec("DROP DATABASE " + createdDBName).Error
			if adminConnection, connErr := adminDB.DB(); connErr == nil {
				_ = adminConnection.Close()
			}
		}
	})

	return &topupCallbackFlowFixture{router: router, now: now, userID: user.Id, keys: keys, gateway: gateway}
}

func setTopupCallbackFlowCampaign(t *testing.T, campaign topupCallbackFlowCampaign) {
	t.Helper()
	periods := fmt.Sprintf(`[{"campaign_key":%q,"start_time":%d,"end_time":%d,"day_bonus_start":%d,"day_bonus_end":%d,"day_bonus_rate":%s,"tiers":%s}]`,
		campaign.key, campaign.start, campaign.end, campaign.dayStart, campaign.dayEnd,
		strconv.FormatFloat(campaign.dayRate, 'f', -1, 64), campaign.tiers)
	if campaign.periods != "" {
		periods = campaign.periods
	}
	giftPolicy := `{"mode":"permanent","unit":"day"}`
	if campaign.giftExpiresIn != "" {
		giftPolicy = campaign.giftExpiresIn
	}
	require.NoError(t, operation_setting.ValidateTopupCampaignOption(operation_setting.TopupCampaignPeriodsOption, periods))
	require.NoError(t, operation_setting.ValidateGiftQuotaExpirationOption(operation_setting.GiftQuotaTopupBonusExpirationOption, giftPolicy))
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"topup_campaign_setting.periods":            periods,
		"topup_campaign_setting.enabled":            strconv.FormatBool(campaign.enabled),
		"topup_campaign_setting.campaign_key":       campaign.key,
		"topup_campaign_setting.start_time":         strconv.FormatInt(campaign.start, 10),
		"topup_campaign_setting.end_time":           strconv.FormatInt(campaign.end, 10),
		"topup_campaign_setting.day_bonus_start":    strconv.FormatInt(campaign.dayStart, 10),
		"topup_campaign_setting.day_bonus_end":      strconv.FormatInt(campaign.dayEnd, 10),
		"topup_campaign_setting.day_bonus_rate":     strconv.FormatFloat(campaign.dayRate, 'f', -1, 64),
		"topup_campaign_setting.tiers":              campaign.tiers,
		"gift_quota_expiration_setting.checkin":     giftPolicy,
		"gift_quota_expiration_setting.topup_bonus": giftPolicy,
	}))
	settings := operation_setting.GetTopupCampaignSetting()
	assert.Equal(t, campaign.enabled, settings.Enabled)
	period, ok := settings.PeriodByKey(campaign.key)
	require.True(t, ok)
	assert.Equal(t, campaign.start, period.StartTime)
	assert.Equal(t, campaign.end, period.EndTime)
	assert.Equal(t, campaign.dayRate, period.DayBonusRate)
	require.Len(t, period.Tiers, 3)
}

func (f *topupCallbackFlowFixture) success(t *testing.T, tradeNo string, amountUSD int64) *httptest.ResponseRecorder {
	return topupCallbackFlowServe(f.router, topupCallbackFlowSuccessRequest(t, f.gateway, tradeNo, amountUSD))
}

func (f *topupCallbackFlowFixture) badOrder(t *testing.T, tradeNo string, amountUSD int64) *httptest.ResponseRecorder {
	return f.success(t, tradeNo, amountUSD)
}

func (f *topupCallbackFlowFixture) reset(t *testing.T, campaign topupCallbackFlowCampaign) {
	t.Helper()
	setTopupCallbackFlowCampaign(t, campaign)
	require.NoError(t, model.DB.Exec("DELETE FROM logs").Error)
	require.NoError(t, model.DB.Exec("DELETE FROM user_gift_quotas").Error)
	require.NoError(t, model.DB.Exec("DELETE FROM topup_campaign_events").Error)
	require.NoError(t, model.DB.Exec("DELETE FROM redemptions").Error)
	require.NoError(t, model.DB.Exec("DELETE FROM top_ups").Error)
	require.NoError(t, model.DB.Exec("DELETE FROM subscription_orders").Error)
	require.NoError(t, model.DB.Model(&model.User{}).Where("id = ?", f.userID).
		Updates(map[string]any{"quota": 0, "email": ""}).Error)
}

func topupCallbackFlowTradeNo(prefix string, userID int) string {
	return fmt.Sprintf("%s-%d-%d", prefix, userID, time.Now().UnixNano())
}

func topupCallbackFlowAmountAndMoney(gateway topupCallbackFlowGateway, amountUSD int64) (int64, float64) {
	if gateway.kind == "mysql" {
		return 0, float64(amountUSD)
	}
	if gateway.kind == "postgres" {
		return amountUSD * topupCallbackFlowQuotaPerUnit, float64(amountUSD)
	}
	return amountUSD, float64(amountUSD)
}

func topupCallbackFlowQuota(amountUSD int64) int {
	return int(amountUSD * topupCallbackFlowQuotaPerUnit)
}

func topupCallbackFlowSeedOrder(t *testing.T, userID int, tradeNo, provider string, amount int64, money float64, status string) *model.TopUp {
	t.Helper()
	order := &model.TopUp{
		UserId: userID, Amount: amount, Money: money, TradeNo: tradeNo,
		PaymentMethod: provider, PaymentProvider: provider,
		CreateTime: time.Now().Unix(), Status: status,
	}
	require.NoError(t, model.DB.Create(order).Error)
	return order
}

func epayFlowOrder(t *testing.T, f *topupCallbackFlowFixture, userID int, tradeNo string, amountUSD int64, money float64, status string) *model.TopUp {
	return topupCallbackFlowSeedOrder(t, userID, tradeNo, model.PaymentProviderEpay, amountUSD, money, status)
}

func stripeFlowOrder(t *testing.T, f *topupCallbackFlowFixture, userID int, tradeNo string, amountUSD int64, money float64, status string) *model.TopUp {
	return topupCallbackFlowSeedOrder(t, userID, tradeNo, model.PaymentProviderStripe, amountUSD, money, status)
}

func creemFlowOrder(t *testing.T, f *topupCallbackFlowFixture, userID int, tradeNo string, amountUSD int64, money float64, status string) *model.TopUp {
	return topupCallbackFlowSeedOrder(t, userID, tradeNo, model.PaymentProviderCreem, amountUSD, money, status)
}

func topupCallbackFlowServe(router *gin.Engine, request *http.Request) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func epayFlowRequest(t *testing.T, tradeNo string, money string, tradeStatus string, mutate func(url.Values)) *http.Request {
	t.Helper()
	params := url.Values{
		"pid": {"epay_id"}, "type": {"alipay"}, "money": {money},
		"name": {"callback-flow"}, "out_trade_no": {tradeNo},
		"trade_status": {tradeStatus},
	}
	signed := map[string]string{
		"pid": params.Get("pid"), "type": params.Get("type"), "money": params.Get("money"),
		"name": params.Get("name"), "out_trade_no": params.Get("out_trade_no"),
		"trade_status": params.Get("trade_status"),
	}
	_, err := epay.GenerateParamsWithError(signed, operation_setting.EpayKey)
	require.NoError(t, err)
	for key, value := range signed {
		params.Set(key, value)
	}
	if mutate != nil {
		mutate(params)
	}
	request := httptest.NewRequest(http.MethodPost, "/api/user/epay/notify", strings.NewReader(params.Encode()))
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return request
}

func epayFlowWrong(t *testing.T, f *topupCallbackFlowFixture, tradeNo string, amountUSD int64) *httptest.ResponseRecorder {
	return topupCallbackFlowServe(f.router, epayFlowRequest(t, tradeNo, strconv.FormatInt(amountUSD, 10)+".00", epay.StatusTradeSuccess, func(params url.Values) {
		params.Set("sign", "invalid")
	}))
}

func stripeFlowEventPayload(t *testing.T, tradeNo string, amountTotal int, eventType, status, paymentStatus string) []byte {
	t.Helper()
	return []byte(fmt.Sprintf(`{"id":"evt_callback_flow","object":"event","api_version":"2024-06-20","type":%q,"data":{"object":{"client_reference_id":%q,"customer":"cus_callback_flow","status":%q,"payment_status":%q,"amount_total":%d,"currency":"usd"}}}`,
		eventType, tradeNo, status, paymentStatus, amountTotal))
}

func stripeFlowPayload(t *testing.T, tradeNo string, amountTotal int) []byte {
	return stripeFlowEventPayload(t, tradeNo, amountTotal, "checkout.session.completed", "complete", "paid")
}

func stripeFlowRequest(t *testing.T, payload []byte, signature string) *http.Request {
	t.Helper()
	request := httptest.NewRequest(http.MethodPost, "/api/stripe/webhook", strings.NewReader(string(payload)))
	if signature != "" {
		request.Header.Set("Stripe-Signature", signature)
	}
	return request
}

func stripeFlowSignedRequest(t *testing.T, payload []byte) *http.Request {
	t.Helper()
	signed := webhook.GenerateTestSignedPayload(&webhook.UnsignedPayload{Payload: payload, Secret: setting.StripeWebhookSecret, Timestamp: time.Now()})
	return stripeFlowRequest(t, payload, signed.Header)
}

func stripeFlowWrong(t *testing.T, f *topupCallbackFlowFixture, tradeNo string, amountUSD int64) *httptest.ResponseRecorder {
	payload := stripeFlowPayload(t, tradeNo, int(amountUSD)*100)
	return topupCallbackFlowServe(f.router, stripeFlowRequest(t, payload, "t="+strconv.FormatInt(time.Now().Unix(), 10)+",v1=invalid"))
}

func creemFlowEventPayload(t *testing.T, tradeNo string, amount int, eventType string) []byte {
	t.Helper()
	return []byte(fmt.Sprintf(`{"id":"evt_callback_flow","eventType":%q,"object":{"request_id":%q,"order":{"status":"paid","type":"onetime","amount_paid":%d}},"customer":{"email":"user@example.com","name":"Callback Flow"}}`,
		eventType, tradeNo, amount))
}

func creemFlowPayload(t *testing.T, tradeNo string, amount int) []byte {
	return creemFlowEventPayload(t, tradeNo, amount, "checkout.completed")
}

func creemFlowRequest(t *testing.T, payload []byte, signature string) *http.Request {
	t.Helper()
	request := httptest.NewRequest(http.MethodPost, "/api/creem/webhook", strings.NewReader(string(payload)))
	if signature != "" {
		request.Header.Set(CreemSignatureHeader, signature)
	}
	return request
}

func creemFlowSignedRequest(t *testing.T, payload []byte) *http.Request {
	return creemFlowRequest(t, payload, generateCreemSignature(string(payload), setting.CreemWebhookSecret))
}

func creemFlowWrong(t *testing.T, f *topupCallbackFlowFixture, tradeNo string, amountUSD int64) *httptest.ResponseRecorder {
	return topupCallbackFlowServe(f.router, creemFlowRequest(t, creemFlowPayload(t, tradeNo, int(amountUSD)*100), "invalid"))
}

func topupCallbackFlowSuccessRequest(t *testing.T, gateway topupCallbackFlowGateway, tradeNo string, amountUSD int64) *http.Request {
	t.Helper()
	money := strconv.FormatInt(amountUSD, 10) + ".00"
	switch gateway.kind {
	case "sqlite":
		return epayFlowRequest(t, tradeNo, money, epay.StatusTradeSuccess, nil)
	case "mysql":
		return stripeFlowSignedRequest(t, stripeFlowPayload(t, tradeNo, int(amountUSD)*100))
	default:
		return creemFlowSignedRequest(t, creemFlowPayload(t, tradeNo, int(amountUSD)*100))
	}
}

func topupCallbackFlowMissingSignatureRequest(t *testing.T, gateway topupCallbackFlowGateway, tradeNo string, amountUSD int64) *http.Request {
	t.Helper()
	money := strconv.FormatInt(amountUSD, 10) + ".00"
	switch gateway.kind {
	case "sqlite":
		return epayFlowRequest(t, tradeNo, money, epay.StatusTradeSuccess, func(params url.Values) {
			params.Del("sign")
			params.Del("sign_type")
		})
	case "mysql":
		return stripeFlowRequest(t, stripeFlowPayload(t, tradeNo, int(amountUSD)*100), "")
	default:
		return creemFlowRequest(t, creemFlowPayload(t, tradeNo, int(amountUSD)*100), "")
	}
}

func topupCallbackFlowUnknownRequest(t *testing.T, gateway topupCallbackFlowGateway, tradeNo string, amountUSD int64) *http.Request {
	t.Helper()
	switch gateway.kind {
	case "sqlite":
		return epayFlowRequest(t, tradeNo, strconv.FormatInt(amountUSD, 10)+".00", "WAIT_BUYER_PAY", nil)
	case "mysql":
		payload := stripeFlowEventPayload(t, tradeNo, int(amountUSD)*100, "checkout.session.completed", "incomplete", "unpaid")
		return stripeFlowSignedRequest(t, payload)
	default:
		payload := creemFlowEventPayload(t, tradeNo, int(amountUSD)*100, "checkout.created")
		return creemFlowSignedRequest(t, payload)
	}
}

func waffoFlowPayload(t *testing.T, tradeNo, status string) []byte {
	t.Helper()
	return []byte(fmt.Sprintf(`{"eventType":"PAYMENT_NOTIFICATION","result":{"merchantOrderId":%q,"orderStatus":%q}}`, tradeNo, status))
}

func waffoFlowRequest(t *testing.T, payload []byte, signature string) *http.Request {
	t.Helper()
	request := httptest.NewRequest(http.MethodPost, "/api/waffo/webhook", strings.NewReader(string(payload)))
	if signature != "" {
		request.Header.Set("X-SIGNATURE", signature)
	}
	return request
}

func pancakeFlowPayload(t *testing.T, f *topupCallbackFlowFixture, tradeNo string) []byte {
	t.Helper()
	identity := fmt.Sprintf("new-api-user-%d", f.userID)
	return []byte(fmt.Sprintf(`{"id":"evt_callback_flow","timestamp":%q,"eventType":"order.completed","eventId":"event_callback_flow","storeId":%q,"mode":"test","data":{"orderId":"ORD_callback_flow","orderMerchantExternalId":%q,"merchantProvidedBuyerIdentity":%q,"buyerEmail":"user@example.com","currency":"USD","amount":"400.00","taxAmount":"0.00","productName":"Top-up"}}`,
		time.Now().UTC().Format(time.RFC3339), setting.WaffoPancakeStoreID, tradeNo, identity))
}

func pancakeFlowSignedRequest(t *testing.T, f *topupCallbackFlowFixture, tradeNo string) *http.Request {
	t.Helper()
	payload := pancakeFlowPayload(t, f, tradeNo)
	timestamp := strconv.FormatInt(time.Now().UnixMilli(), 10)
	input := timestamp + "." + string(payload)
	hashed := sha256.Sum256([]byte(input))
	keyBytes, err := base64.StdEncoding.DecodeString(f.keys.PrivateKey)
	require.NoError(t, err)
	privateKey, err := x509.ParsePKCS8PrivateKey(keyBytes)
	require.NoError(t, err)
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey.(*rsa.PrivateKey), crypto.SHA256, hashed[:])
	require.NoError(t, err)
	request := httptest.NewRequest(http.MethodPost, "/api/waffo-pancake/webhook/test", strings.NewReader(string(payload)))
	request.Header.Set("X-Waffo-Signature", fmt.Sprintf("t=%s,v1=%s", timestamp, base64.StdEncoding.EncodeToString(signature)))
	return request
}

func topupCallbackFlowOrder(t *testing.T, tradeNo, expectedStatus string) *model.TopUp {
	t.Helper()
	order := &model.TopUp{}
	require.NoError(t, model.DB.Where("trade_no = ?", tradeNo).First(order).Error)
	assert.Equal(t, expectedStatus, order.Status)
	return order
}

func topupCallbackFlowLedger(t *testing.T, userID int) (int, int64, int64) {
	t.Helper()
	user := &model.User{}
	require.NoError(t, model.DB.Select("quota").Where("id = ?", userID).First(user).Error)
	var events, gift int64
	require.NoError(t, model.DB.Model(&model.TopupCampaignEvent{}).Where("user_id = ?", userID).Count(&events).Error)
	require.NoError(t, model.DB.Model(&model.UserGiftQuota{}).
		Where("user_id = ? AND source = ?", userID, model.GiftQuotaSourceTopupBonus).
		Select("COALESCE(SUM(quota), 0)").Scan(&gift).Error)
	return user.Quota, events, gift
}

func topupCallbackFlowCampaignSelf(t *testing.T, userID int) gin.H {
	t.Helper()
	period := operation_setting.GetTopupCampaignSetting().LatestPeriodAt(time.Now())
	self, err := buildTopupCampaignSelf(userID, period)
	require.NoError(t, err)
	return self
}

func TestTopupCallbackFlow(t *testing.T) {
	for _, gateway := range topupCallbackFlowGateways() {
		t.Run(gateway.kind, func(t *testing.T) {
			fixture := setupTopupCallbackFlowTest(t, gateway)
			fixture.reset(t, topupCallbackFlowDefaultCampaign(fixture.now))
			amount, money := topupCallbackFlowAmountAndMoney(gateway, 400)
			tradeNo := topupCallbackFlowTradeNo("callback-flow-full", fixture.userID)
			order := gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)

			response := fixture.success(t, tradeNo, 400)
			assert.Equal(t, http.StatusOK, response.Code)
			if gateway.kind == "sqlite" {
				assert.Equal(t, "success", response.Body.String())
			}
			topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusSuccess)
			quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
			assert.Equal(t, topupCallbackFlowQuota(400), quota)
			assert.EqualValues(t, 1, events)
			assert.Equal(t, int64(topupCallbackFlowQuota(40)), gift)

			replay := fixture.success(t, tradeNo, 400)
			assert.Equal(t, http.StatusOK, replay.Code)
			quota, events, gift = topupCallbackFlowLedger(t, fixture.userID)
			assert.Equal(t, topupCallbackFlowQuota(400), quota)
			assert.EqualValues(t, 1, events)
			assert.Equal(t, int64(topupCallbackFlowQuota(40)), gift)

			self := topupCallbackFlowCampaignSelf(t, fixture.userID)
			assert.Equal(t, float64(400), self["cumulative_amount"])
			assert.Equal(t, float64(40), self["tier_bonus_granted"])
			assert.Equal(t, true, self["top_reached"])
			assert.NotZero(t, order.Id)
		})
	}
}

func TestTopupCallbackFlowBoundaries(t *testing.T) {
	for _, gateway := range topupCallbackFlowGateways() {
		t.Run(gateway.kind, func(t *testing.T) {
			fixture := setupTopupCallbackFlowTest(t, gateway)
			amount, money := topupCallbackFlowAmountAndMoney(gateway, 100)
			defaultCampaign := func() topupCallbackFlowCampaign {
				return topupCallbackFlowDefaultCampaign(fixture.now)
			}

			t.Run("invalid signature leaves order pending", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				tradeNo := topupCallbackFlowTradeNo("callback-flow-signature", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				response := gateway.wrong(t, fixture, tradeNo, 100)
				if gateway.kind == "sqlite" {
					assert.Equal(t, "fail", response.Body.String())
				} else {
					assert.Equal(t, gateway.expectFail, response.Code)
				}
				topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusPending)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Zero(t, quota)
				assert.Zero(t, events)
				assert.Zero(t, gift)
			})

			t.Run("missing signature leaves order pending", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				tradeNo := topupCallbackFlowTradeNo("callback-flow-missing-signature", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				response := topupCallbackFlowServe(fixture.router, topupCallbackFlowMissingSignatureRequest(t, gateway, tradeNo, 100))
				if gateway.kind == "sqlite" {
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, "fail", response.Body.String())
				} else {
					assert.Equal(t, gateway.expectFail, response.Code)
				}
				topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusPending)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Zero(t, quota)
				assert.Zero(t, events)
				assert.Zero(t, gift)
			})

			t.Run("missing order and wrong provider are rejected", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				missing := topupCallbackFlowTradeNo("callback-flow-missing", fixture.userID)
				response := fixture.badOrder(t, missing, 100)
				if gateway.kind == "sqlite" {
					assert.Equal(t, http.StatusOK, response.Code)
					assert.Equal(t, "fail", response.Body.String())
				} else if gateway.kind == "postgres" {
					assert.Equal(t, http.StatusBadRequest, response.Code)
				} else {
					assert.Equal(t, http.StatusOK, response.Code)
				}
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Zero(t, quota)
				assert.Zero(t, events)
				assert.Zero(t, gift)

				wrongProvider := topupCallbackFlowTradeNo("callback-flow-wrong-provider", fixture.userID)
				topupCallbackFlowSeedOrder(t, fixture.userID, wrongProvider, model.PaymentProviderWaffoPancake, amount, money, common.TopUpStatusPending)
				response = fixture.success(t, wrongProvider, 100)
				if gateway.kind == "sqlite" {
					assert.Equal(t, "fail", response.Body.String())
				} else if gateway.kind == "postgres" {
					assert.Equal(t, http.StatusInternalServerError, response.Code)
				} else {
					assert.Equal(t, http.StatusOK, response.Code)
				}
				topupCallbackFlowOrder(t, wrongProvider, common.TopUpStatusPending)
				quota, events, gift = topupCallbackFlowLedger(t, fixture.userID)
				assert.Zero(t, quota)
				assert.Zero(t, events)
				assert.Zero(t, gift)
			})

			t.Run("non-pending and unknown trade statuses do not settle", func(t *testing.T) {
				for _, status := range []string{common.TopUpStatusExpired, common.TopUpStatusFailed} {
					fixture.reset(t, defaultCampaign())
					tradeNo := topupCallbackFlowTradeNo("callback-flow-"+status, fixture.userID)
					gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, status)
					assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
					topupCallbackFlowOrder(t, tradeNo, status)
					quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
					assert.Zero(t, quota)
					assert.Zero(t, events)
					assert.Zero(t, gift)
				}

				fixture.reset(t, defaultCampaign())
				pending := topupCallbackFlowTradeNo("callback-flow-unknown-event", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, pending, amount, money, common.TopUpStatusPending)
				response := topupCallbackFlowServe(fixture.router, topupCallbackFlowUnknownRequest(t, gateway, pending, 100))
				assert.Equal(t, http.StatusOK, response.Code)
				if gateway.kind == "sqlite" {
					assert.Equal(t, "success", response.Body.String())
				}
				topupCallbackFlowOrder(t, pending, common.TopUpStatusPending)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Zero(t, quota)
				assert.Zero(t, events)
				assert.Zero(t, gift)
			})

			t.Run("disabled upcoming and ended campaigns still credit the order", func(t *testing.T) {
				disabled := defaultCampaign()
				disabled.key = "callback-flow-disabled"
				disabled.enabled = false
				upcoming := defaultCampaign()
				upcoming.key = "callback-flow-upcoming"
				upcoming.start, upcoming.end = fixture.now.Add(time.Hour).Unix(), fixture.now.Add(2*time.Hour).Unix()
				ended := defaultCampaign()
				ended.key = "callback-flow-ended"
				ended.start, ended.end = fixture.now.Add(-3*time.Hour).Unix(), fixture.now.Add(-2*time.Hour).Unix()
				for _, campaign := range []topupCallbackFlowCampaign{disabled, upcoming, ended} {
					fixture.reset(t, campaign)
					tradeNo := topupCallbackFlowTradeNo("callback-flow-"+campaign.key, fixture.userID)
					gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
					assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
					topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusSuccess)
					quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
					assert.Equal(t, topupCallbackFlowQuota(100), quota)
					assert.Zero(t, events)
					assert.Zero(t, gift)
				}
			})

			t.Run("day bonus window grants only inside", func(t *testing.T) {
				inside := defaultCampaign()
				inside.key = "callback-flow-day-inside"
				inside.dayStart, inside.dayEnd = fixture.now.Add(-time.Hour).Unix(), fixture.now.Add(time.Hour).Unix()
				inside.dayRate = 0.05
				fixture.reset(t, inside)
				tradeNo := topupCallbackFlowTradeNo("callback-flow-day-inside", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
				_, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.EqualValues(t, 1, events)
				assert.Equal(t, int64(topupCallbackFlowQuota(15)), gift)
				self := topupCallbackFlowCampaignSelf(t, fixture.userID)
				assert.Equal(t, float64(100), self["cumulative_amount"])
				assert.Equal(t, float64(10), self["tier_bonus_granted"])
				assert.Equal(t, float64(5), self["day_bonus_granted"])

				outside := defaultCampaign()
				outside.key = "callback-flow-day-outside"
				outside.dayStart, outside.dayEnd = fixture.now.Add(-50*time.Minute).Unix(), fixture.now.Add(-40*time.Minute).Unix()
				outside.dayRate = 0.05
				fixture.reset(t, outside)
				tradeNo = topupCallbackFlowTradeNo("callback-flow-day-outside", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
				_, events, gift = topupCallbackFlowLedger(t, fixture.userID)
				assert.EqualValues(t, 1, events)
				assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)
				self = topupCallbackFlowCampaignSelf(t, fixture.userID)
				assert.Equal(t, float64(0), self["day_bonus_granted"])
			})

			t.Run("new campaign key does not inherit previous period", func(t *testing.T) {
				campaign := defaultCampaign()
				campaign.key = "callback-flow-next"
				campaign.periods = fmt.Sprintf(
					`[{"campaign_key":"callback-flow-day","start_time":%d,"end_time":%d,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":%s},`+
						`{"campaign_key":%q,"start_time":%d,"end_time":%d,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":%s}]`,
					fixture.now.Add(-3*time.Hour).Unix(), fixture.now.Add(-2*time.Hour).Unix(), campaign.tiers,
					campaign.key, campaign.start, campaign.end, campaign.tiers,
				)
				fixture.reset(t, campaign)
				require.NoError(t, model.DB.Create(&model.TopupCampaignEvent{
					Source:           model.TopupCampaignSourceTopUp,
					SourceId:         9001,
					TopUpId:          9001,
					UserId:           fixture.userID,
					CampaignKey:      "callback-flow-day",
					AmountQuota:      int64(topupCallbackFlowQuota(400)),
					TierBonusGranted: int64(topupCallbackFlowQuota(40)),
					CreatedAt:        fixture.now.Add(-150 * time.Minute).Unix(),
				}).Error)
				tradeNo := topupCallbackFlowTradeNo("callback-flow-next", fixture.userID)
				order := gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Equal(t, topupCallbackFlowQuota(100), quota)
				assert.EqualValues(t, 2, events)
				assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)
				self := topupCallbackFlowCampaignSelf(t, fixture.userID)
				assert.Equal(t, float64(100), self["cumulative_amount"])
				assert.Equal(t, float64(10), self["tier_bonus_granted"])
				event := &model.TopupCampaignEvent{}
				require.NoError(t, model.DB.Where("source = ? AND source_id = ?", model.TopupCampaignSourceTopUp, order.Id).First(event).Error)
				assert.Equal(t, campaign.key, event.CampaignKey)
				assert.Equal(t, int64(topupCallbackFlowQuota(10)), event.TierBonusGranted)
			})

			t.Run("whitelist restricts campaign participation", func(t *testing.T) {
				allowed := defaultCampaign()
				allowed.key = "callback-flow-whitelist-allowed"
				allowed.periods = fmt.Sprintf(
					`[{"campaign_key":%q,"start_time":%d,"end_time":%d,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":%s,"whitelist_user_ids":[%d]}]`,
					allowed.key, allowed.start, allowed.end, allowed.tiers, fixture.userID,
				)
				fixture.reset(t, allowed)
				tradeNo := topupCallbackFlowTradeNo("callback-flow-whitelist-allowed", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
				_, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.EqualValues(t, 1, events)
				assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)

				blocked := defaultCampaign()
				blocked.key = "callback-flow-whitelist-blocked"
				blocked.periods = fmt.Sprintf(
					`[{"campaign_key":%q,"start_time":%d,"end_time":%d,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":%s,"whitelist_user_ids":[%d]}]`,
					blocked.key, blocked.start, blocked.end, blocked.tiers, fixture.userID+1,
				)
				fixture.reset(t, blocked)
				tradeNo = topupCallbackFlowTradeNo("callback-flow-whitelist-blocked", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Equal(t, topupCallbackFlowQuota(100), quota)
				assert.Zero(t, events)
				assert.Zero(t, gift)
			})

			t.Run("resigned callback amount does not overwrite the local order", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				tradeNo := topupCallbackFlowTradeNo("callback-flow-amount", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				response := topupCallbackFlowServe(fixture.router, topupCallbackFlowSuccessRequest(t, gateway, tradeNo, 9999))
				assert.Equal(t, http.StatusOK, response.Code)
				topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusSuccess)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Equal(t, topupCallbackFlowQuota(100), quota)
				assert.EqualValues(t, 1, events)
				assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)
				self := topupCallbackFlowCampaignSelf(t, fixture.userID)
				assert.Equal(t, float64(100), self["cumulative_amount"])
			})

			t.Run("wallet ceiling keeps the order pending", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				require.NoError(t, model.DB.Model(&model.User{}).Where("id = ?", fixture.userID).
					Update("quota", common.MaxWalletQuota-topupCallbackFlowQuota(100)+1).Error)
				tradeNo := topupCallbackFlowTradeNo("callback-flow-ceiling", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				fixture.success(t, tradeNo, 100)
				topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusPending)
				_, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Zero(t, events)
				assert.Zero(t, gift)
			})

			t.Run("gift quota ceiling records zero bonus", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				require.NoError(t, model.DB.Create(&model.UserGiftQuota{
					UserId: fixture.userID, Source: model.GiftQuotaSourceCheckin, SourceId: 9002,
					Quota: common.MaxQuota - 1, RemainingQuota: common.MaxQuota - 1,
					CreatedAt: fixture.now.Unix(), ExpiresAt: 0,
				}).Error)
				tradeNo := topupCallbackFlowTradeNo("callback-flow-gift-ceiling", fixture.userID)
				order := gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
				topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusSuccess)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Equal(t, topupCallbackFlowQuota(100), quota)
				assert.EqualValues(t, 1, events)
				assert.Zero(t, gift)
				event := &model.TopupCampaignEvent{}
				require.NoError(t, model.DB.Where("source = ? AND source_id = ?", model.TopupCampaignSourceTopUp, order.Id).First(event).Error)
				assert.Zero(t, event.TierBonusGranted)
				assert.Zero(t, event.DayBonusGranted)
				balance, err := model.GetUserQuotaBalance(fixture.userID, time.Now().Unix())
				require.NoError(t, err)
				assert.Equal(t, common.MaxQuota-1, balance.Gift)
			})

			t.Run("gift quota expiration policy is observable in the balance", func(t *testing.T) {
				expires := defaultCampaign()
				expires.key = "callback-flow-expires"
				expires.giftExpiresIn = `{"mode":"duration","unit":"day","value":1}`
				fixture.reset(t, expires)
				assert.Greater(t, operation_setting.GetTopupBonusGiftQuotaExpirationPolicy().ExpiresAt(fixture.now), fixture.now.Unix())
				tradeNo := topupCallbackFlowTradeNo("callback-flow-expires", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				assert.Equal(t, http.StatusOK, fixture.success(t, tradeNo, 100).Code)
				gift := &model.UserGiftQuota{}
				require.NoError(t, model.DB.Where("source = ?", model.GiftQuotaSourceTopupBonus).Order("id DESC").First(gift).Error)
				assert.Greater(t, gift.ExpiresAt, fixture.now.Unix())
				assert.InDelta(t, fixture.now.Add(24*time.Hour).Unix(), gift.ExpiresAt, 5)
				active, err := model.GetUserQuotaBalance(fixture.userID, time.Now().Unix())
				require.NoError(t, err)
				assert.Equal(t, topupCallbackFlowQuota(10), active.Gift)
				expired, err := model.GetUserQuotaBalance(fixture.userID, gift.ExpiresAt+1)
				require.NoError(t, err)
				assert.Zero(t, expired.Gift)
			})

			t.Run("concurrent duplicate callbacks credit exactly once", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				tradeNo := topupCallbackFlowTradeNo("callback-flow-concurrent", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				requests := []*http.Request{
					topupCallbackFlowSuccessRequest(t, gateway, tradeNo, 100),
					topupCallbackFlowSuccessRequest(t, gateway, tradeNo, 100),
				}
				var wg sync.WaitGroup
				responses := make(chan *httptest.ResponseRecorder, len(requests))
				for _, request := range requests {
					wg.Go(func() {
						recorder := httptest.NewRecorder()
						fixture.router.ServeHTTP(recorder, request)
						responses <- recorder
					})
				}
				wg.Wait()
				close(responses)
				for response := range responses {
					assert.Equal(t, http.StatusOK, response.Code)
				}
				topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusSuccess)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Equal(t, topupCallbackFlowQuota(100), quota)
				assert.EqualValues(t, 1, events)
				assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)
			})

			t.Run("return URL alone never settles an order", func(t *testing.T) {
				fixture.reset(t, defaultCampaign())
				tradeNo := topupCallbackFlowTradeNo("callback-flow-return", fixture.userID)
				gateway.newOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
				response := topupCallbackFlowServe(fixture.router, httptest.NewRequest(http.MethodGet, "/api/user/epay/notify?out_trade_no="+url.QueryEscape(tradeNo), nil))
				assert.Equal(t, http.StatusOK, response.Code)
				assert.Equal(t, "fail", response.Body.String())
				topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusPending)
				quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
				assert.Zero(t, quota)
				assert.Zero(t, events)
				assert.Zero(t, gift)
			})
		})
	}
}

func TestTopupCallbackFlowGatewaySignatures(t *testing.T) {
	sqliteGateway := topupCallbackFlowGateways()[0]
	fixture := setupTopupCallbackFlowTest(t, sqliteGateway)
	defaultCampaign := func() topupCallbackFlowCampaign {
		return topupCallbackFlowDefaultCampaign(fixture.now)
	}

	t.Run("Waffo signed callback settles and tampered body is rejected", func(t *testing.T) {
		fixture.reset(t, defaultCampaign())
		tradeNo := topupCallbackFlowTradeNo("callback-flow-waffo", fixture.userID)
		topupCallbackFlowSeedOrder(t, fixture.userID, tradeNo, model.PaymentProviderWaffo, 100, 100, common.TopUpStatusPending)
		payload := waffoFlowPayload(t, tradeNo, "PAY_SUCCESS")
		signature, err := waffo.Sign(string(payload), fixture.keys.PrivateKey)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, topupCallbackFlowServe(fixture.router, waffoFlowRequest(t, payload, signature)).Code)
		topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusSuccess)
		quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
		assert.Equal(t, topupCallbackFlowQuota(100), quota)
		assert.EqualValues(t, 1, events)
		assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)

		other := topupCallbackFlowTradeNo("callback-flow-waffo-bad", fixture.userID)
		topupCallbackFlowSeedOrder(t, fixture.userID, other, model.PaymentProviderWaffo, 100, 100, common.TopUpStatusPending)
		assert.Equal(t, http.StatusBadRequest, topupCallbackFlowServe(fixture.router, waffoFlowRequest(t, waffoFlowPayload(t, other, "PAY_SUCCESS"), signature)).Code)
		topupCallbackFlowOrder(t, other, common.TopUpStatusPending)
		quota, events, gift = topupCallbackFlowLedger(t, fixture.userID)
		assert.Equal(t, topupCallbackFlowQuota(100), quota)
		assert.EqualValues(t, 1, events)
		assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)
	})

	t.Run("Pancake signed callback settles and invalid signature is rejected", func(t *testing.T) {
		fixture.reset(t, defaultCampaign())
		tradeNo := topupCallbackFlowTradeNo("callback-flow-pancake", fixture.userID)
		topupCallbackFlowSeedOrder(t, fixture.userID, tradeNo, model.PaymentProviderWaffoPancake, 100, 100, common.TopUpStatusPending)
		assert.Equal(t, http.StatusOK, topupCallbackFlowServe(fixture.router, pancakeFlowSignedRequest(t, fixture, tradeNo)).Code)
		topupCallbackFlowOrder(t, tradeNo, common.TopUpStatusSuccess)
		quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
		assert.Equal(t, topupCallbackFlowQuota(100), quota)
		assert.EqualValues(t, 1, events)
		assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)

		other := topupCallbackFlowTradeNo("callback-flow-pancake-bad", fixture.userID)
		topupCallbackFlowSeedOrder(t, fixture.userID, other, model.PaymentProviderWaffoPancake, 100, 100, common.TopUpStatusPending)
		bad := pancakeFlowSignedRequest(t, fixture, other)
		bad.Header.Set("X-Waffo-Signature", "t="+strconv.FormatInt(time.Now().UnixMilli(), 10)+",v1=invalid")
		assert.Equal(t, http.StatusUnauthorized, topupCallbackFlowServe(fixture.router, bad).Code)
		topupCallbackFlowOrder(t, other, common.TopUpStatusPending)
		quota, events, gift = topupCallbackFlowLedger(t, fixture.userID)
		assert.Equal(t, topupCallbackFlowQuota(100), quota)
		assert.EqualValues(t, 1, events)
		assert.Equal(t, int64(topupCallbackFlowQuota(10)), gift)
	})

	t.Run("Epay independently reached tiers and redemption source ids", func(t *testing.T) {
		fixture.reset(t, defaultCampaign())
		var firstOrderID int
		for index, amountUSD := range []int64{100, 100, 200} {
			amount, money := topupCallbackFlowAmountAndMoney(sqliteGateway, amountUSD)
			tradeNo := topupCallbackFlowTradeNo(fmt.Sprintf("callback-flow-tier-%d", index), fixture.userID)
			order := epayFlowOrder(t, fixture, fixture.userID, tradeNo, amount, money, common.TopUpStatusPending)
			if index == 0 {
				firstOrderID = order.Id
			}
			response := topupCallbackFlowServe(fixture.router, epayFlowRequest(t, tradeNo, strconv.FormatInt(amountUSD, 10)+".00", epay.StatusTradeSuccess, nil))
			assert.Equal(t, "success", response.Body.String())
		}
		quota, events, gift := topupCallbackFlowLedger(t, fixture.userID)
		assert.Equal(t, topupCallbackFlowQuota(400), quota)
		assert.EqualValues(t, 3, events)
		assert.Equal(t, int64(topupCallbackFlowQuota(40)), gift)
		var grants []int64
		require.NoError(t, model.DB.Model(&model.TopupCampaignEvent{}).Order("id ASC").Pluck("tier_bonus_granted", &grants).Error)
		assert.Equal(t, []int64{
			int64(topupCallbackFlowQuota(10)),
			int64(topupCallbackFlowQuota(20)),
			int64(topupCallbackFlowQuota(10)),
		}, grants)

		redemption := &model.Redemption{
			Id: firstOrderID, UserId: fixture.userID, Key: "callback-flow-redemption-code",
			Status: common.RedemptionCodeStatusEnabled, Quota: topupCallbackFlowQuota(100),
			Type: model.RedemptionTypeQuota, CreatedTime: fixture.now.Unix(),
		}
		require.NoError(t, model.DB.Create(redemption).Error)
		request := httptest.NewRequest(http.MethodPost, "/api/user/topup", strings.NewReader(fmt.Sprintf(`{"key":%q}`, redemption.Key)))
		request.Header.Set("Content-Type", "application/json")
		recorder := httptest.NewRecorder()
		ctx, _ := gin.CreateTestContext(recorder)
		ctx.Request = request
		ctx.Set("id", fixture.userID)
		TopUp(ctx)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var apiResponse struct {
			Success bool `json:"success"`
		}
		require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &apiResponse))
		assert.True(t, apiResponse.Success)
		var sources []string
		require.NoError(t, model.DB.Model(&model.TopupCampaignEvent{}).
			Where("source_id = ?", firstOrderID).Pluck("source", &sources).Error)
		assert.ElementsMatch(t, []string{model.TopupCampaignSourceTopUp, model.TopupCampaignSourceRedemption}, sources)
		quota, events, gift = topupCallbackFlowLedger(t, fixture.userID)
		assert.Equal(t, topupCallbackFlowQuota(500), quota)
		assert.EqualValues(t, 4, events)
		assert.Equal(t, int64(topupCallbackFlowQuota(40)), gift)
	})
}

func TestTopupCallbackFlowCampaignVisibility(t *testing.T) {
	fixture := setupTopupCallbackFlowTest(t, topupCallbackFlowGateways()[0])
	campaign := topupCallbackFlowDefaultCampaign(fixture.now)
	campaign.key = "callback-flow-visibility"
	campaign.periods = fmt.Sprintf(
		`[{"campaign_key":%q,"start_time":%d,"end_time":%d,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":%s,"whitelist_user_ids":[%d]}]`,
		campaign.key, campaign.start, campaign.end, campaign.tiers, fixture.userID,
	)
	fixture.reset(t, campaign)

	response := topupCallbackFlowCampaignResponse{}
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/topup/campaign", nil)
	ctx.Set("id", fixture.userID)
	GetTopupCampaign(ctx)
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	assert.True(t, response.Data.Enabled)
	assert.NotEqual(t, operation_setting.TopupCampaignStatusDisable, response.Data.Status)

	recorder = httptest.NewRecorder()
	ctx, _ = gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/topup/campaign", nil)
	ctx.Set("id", fixture.userID+1)
	GetTopupCampaign(ctx)
	response = topupCallbackFlowCampaignResponse{}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	assert.False(t, response.Data.Enabled)
	assert.Equal(t, operation_setting.TopupCampaignStatusDisable, response.Data.Status)
}
