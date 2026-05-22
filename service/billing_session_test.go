package service

import (
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newBillingTestContext() *gin.Context {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	return c
}

func seedSubscriptionPlan(t *testing.T, id int, billingMode string) {
	t.Helper()
	plan := &model.SubscriptionPlan{
		Id:             id,
		Title:          "test plan",
		PriceAmount:    1,
		Currency:       "USD",
		DurationUnit:   model.SubscriptionDurationMonth,
		DurationValue:  1,
		Enabled:        true,
		TotalAmount:    1000,
		BillingMode:    billingMode,
		QuotaResetMode: "anchor",
	}
	require.NoError(t, model.DB.Create(plan).Error)
}

func seedActiveSubscriptionWithMode(t *testing.T, id, userId, planId int, billingMode string, total, used int64) {
	t.Helper()
	sub := &model.UserSubscription{
		Id:          id,
		UserId:      userId,
		PlanId:      planId,
		AmountTotal: total,
		AmountUsed:  used,
		BillingMode: billingMode,
		Status:      "active",
		StartTime:   time.Now().Add(-time.Hour).Unix(),
		EndTime:     time.Now().Add(30 * 24 * time.Hour).Unix(),
	}
	require.NoError(t, model.DB.Create(sub).Error)
}

func seedActiveSubscription(t *testing.T, sub *model.UserSubscription) {
	t.Helper()
	if sub.StartTime == 0 {
		sub.StartTime = time.Now().Add(-time.Hour).Unix()
	}
	if sub.EndTime == 0 {
		sub.EndTime = time.Now().Add(30 * 24 * time.Hour).Unix()
	}
	if sub.Status == "" {
		sub.Status = "active"
	}
	require.NoError(t, model.DB.Create(sub).Error)
}

func newBillingTestRelayInfo(userId int, preference string) *relaycommon.RelayInfo {
	return &relaycommon.RelayInfo{
		UserId:          userId,
		TokenId:         0,
		TokenKey:        "",
		TokenUnlimited:  true,
		IsPlayground:    true,
		UsingGroup:      "default",
		OriginModelName: "test-model",
		RequestId:       "req-" + time.Now().Format("150405.000000000"),
		UserSetting: dto.UserSetting{
			BillingPreference: preference,
		},
	}
}

func TestNewBillingSessionWalletFirstCombinesWalletAndSubscriptionQuotaFailures(t *testing.T) {
	truncate(t)
	useCNYQuotaDisplay(t)

	const userID = 101
	const planID = 201
	const subID = 301
	const userQuota = 1043
	const needQuota = 5479

	seedUser(t, userID, userQuota)
	seedSubscriptionPlan(t, planID, model.SubscriptionBillingModeQuota)
	seedActiveSubscriptionWithMode(t, subID, userID, planID, model.SubscriptionBillingModeQuota, 3000, 2000)

	_, apiErr := NewBillingSession(newBillingTestContext(), newBillingTestRelayInfo(userID, "wallet_first"), needQuota)

	require.NotNil(t, apiErr)
	assert.Equal(t, types.ErrorCodeInsufficientUserQuota, apiErr.GetErrorCode())
	message := apiErr.Error()
	assert.Equal(t, "额度不足：①余额不足，当前余额 ¥0.015228，本次需要 ¥0.079993；②订阅额度不足，剩余额度 ¥0.014600，本次需要 ¥0.079993", message)
}

func TestNewBillingSessionSubscriptionFirstCombinesRequestSubscriptionAndWalletFailures(t *testing.T) {
	truncate(t)

	const userID = 102
	const planID = 202
	const subID = 302

	seedUser(t, userID, 0)
	seedSubscriptionPlan(t, planID, model.SubscriptionBillingModeRequest)
	seedActiveSubscriptionWithMode(t, subID, userID, planID, model.SubscriptionBillingModeRequest, 1, 1)

	_, apiErr := NewBillingSession(newBillingTestContext(), newBillingTestRelayInfo(userID, "subscription_first"), 0)

	require.NotNil(t, apiErr)
	assert.Equal(t, types.ErrorCodeInsufficientUserQuota, apiErr.GetErrorCode())
	message := apiErr.Error()
	assert.True(t, strings.HasPrefix(message, "额度不足：①订阅请求次数不足，剩余请求次数 0，本次需要 1；②余额不足，当前余额 "))
	assert.Contains(t, message, "②余额不足")
}

func TestNewBillingSessionSubscriptionOnlyReportsDailyLimitResetTime(t *testing.T) {
	truncate(t)
	originalLocal := time.Local
	shanghai := time.FixedZone("CST", 8*60*60)
	time.Local = shanghai
	t.Cleanup(func() {
		time.Local = originalLocal
	})

	const userID = 103
	const planID = 203
	const subID = 303
	nextReset := time.Date(2026, 5, 20, 9, 30, 45, 0, shanghai).Unix()

	seedUser(t, userID, 100000)
	seedSubscriptionPlan(t, planID, model.SubscriptionBillingModeQuota)
	seedActiveSubscription(t, &model.UserSubscription{
		Id:                 subID,
		UserId:             userID,
		PlanId:             planID,
		AmountTotal:        100000,
		AmountUsed:         0,
		BillingMode:        model.SubscriptionBillingModeQuota,
		DailyLimitAmount:   1000,
		DailyAmountUsed:    900,
		DailyLastResetTime: time.Now().Add(-time.Hour).Unix(),
		DailyNextResetTime: nextReset,
	})

	_, apiErr := NewBillingSession(newBillingTestContext(), newBillingTestRelayInfo(userID, "subscription_only"), 200)

	require.NotNil(t, apiErr)
	message := apiErr.Error()
	assert.Contains(t, message, "订阅额度不足：剩余额度")
	assert.Contains(t, message, "本次需要")
	assert.Contains(t, message, "下次重置时间：2026-05-20 09:30:45 UTC+08:00")
	assert.NotContains(t, message, "①")
	assert.NotContains(t, message, "②")
}

func TestNewBillingSessionWalletOnlyReportsSingleWalletFailure(t *testing.T) {
	truncate(t)
	useCNYQuotaDisplay(t)

	const userID = 104
	const userQuota = 1043
	const needQuota = 5479

	seedUser(t, userID, userQuota)

	_, apiErr := NewBillingSession(newBillingTestContext(), newBillingTestRelayInfo(userID, "wallet_only"), needQuota)

	require.NotNil(t, apiErr)
	assert.Equal(t, types.ErrorCodeInsufficientUserQuota, apiErr.GetErrorCode())
	assert.Equal(t, "余额不足：当前余额 ¥0.015228，本次需要 ¥0.079993", apiErr.Error())
}

func useCNYQuotaDisplay(t *testing.T) {
	t.Helper()
	originalDisplayType := operation_setting.GetGeneralSetting().QuotaDisplayType
	originalQuotaPerUnit := common.QuotaPerUnit
	originalExchangeRate := operation_setting.USDExchangeRate
	t.Cleanup(func() {
		operation_setting.GetGeneralSetting().QuotaDisplayType = originalDisplayType
		common.QuotaPerUnit = originalQuotaPerUnit
		operation_setting.USDExchangeRate = originalExchangeRate
	})
	operation_setting.GetGeneralSetting().QuotaDisplayType = operation_setting.QuotaDisplayTypeCNY
	common.QuotaPerUnit = 500000
	operation_setting.USDExchangeRate = 7.3
}
