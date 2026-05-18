package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func insertSubscriptionRenewUser(t *testing.T, id int) {
	t.Helper()
	require.NoError(t, DB.Create(&User{
		Id:       id,
		Username: "subscription_renew_user",
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}).Error)
}

func insertSubscriptionRenewPlan(t *testing.T, id int, price float64) *SubscriptionPlan {
	t.Helper()
	plan := &SubscriptionPlan{
		Id:            id,
		Title:         "Renew Plan",
		PriceAmount:   price,
		Currency:      "USD",
		DurationUnit:  SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
		TotalAmount:   1000,
		BillingMode:   SubscriptionBillingModeQuota,
	}
	require.NoError(t, DB.Create(plan).Error)
	return plan
}

func insertSubscriptionRenewSubscription(t *testing.T, userId int, planId int, status string, endTime int64) *UserSubscription {
	t.Helper()
	now := common.GetTimestamp()
	sub := &UserSubscription{
		UserId:      userId,
		PlanId:      planId,
		AmountTotal: 1000,
		StartTime:   now - 3600,
		EndTime:     endTime,
		Status:      status,
		Source:      "order",
	}
	require.NoError(t, DB.Create(sub).Error)
	return sub
}

func insertSubscriptionRenewOrder(t *testing.T, tradeNo string, userId int, planId int, subId int, money float64) {
	t.Helper()
	payload := common.GetJsonString(map[string]any{
		"renew":                true,
		"user_subscription_id": subId,
	})
	require.NoError(t, DB.Create(&SubscriptionOrder{
		UserId:          userId,
		PlanId:          planId,
		Money:           money,
		TradeNo:         tradeNo,
		PaymentMethod:   "balance",
		PaymentProvider: "balance",
		ProviderPayload: payload,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}).Error)
}

func TestCompleteRenewalOrderRejectsInactiveSubscription(t *testing.T) {
	testCases := []struct {
		name   string
		status string
		end    int64
	}{
		{
			name:   "expired status",
			status: "expired",
			end:    common.GetTimestamp() - 60,
		},
		{
			name:   "cancelled status",
			status: "cancelled",
			end:    common.GetTimestamp() + 3600,
		},
		{
			name:   "active status but expired by time",
			status: "active",
			end:    common.GetTimestamp() - 60,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			truncateTables(t)

			userId := 1201
			insertSubscriptionRenewUser(t, userId)
			plan := insertSubscriptionRenewPlan(t, 1301, 9.99)
			sub := insertSubscriptionRenewSubscription(t, userId, plan.Id, tc.status, tc.end)
			insertSubscriptionRenewOrder(t, "renew-inactive-"+tc.name, userId, plan.Id, sub.Id, plan.PriceAmount)

			err := CompleteRenewalOrder("renew-inactive-"+tc.name, `{"paid":true}`, "balance", "balance", "")

			require.Error(t, err)
			assert.Contains(t, err.Error(), "subscription is not active")

			var reloaded UserSubscription
			require.NoError(t, DB.First(&reloaded, sub.Id).Error)
			assert.Equal(t, tc.status, reloaded.Status)
			assert.Equal(t, tc.end, reloaded.EndTime)

			order := GetSubscriptionOrderByTradeNo("renew-inactive-" + tc.name)
			require.NotNil(t, order)
			assert.Equal(t, common.TopUpStatusPending, order.Status)
		})
	}
}

func TestGetLatestSubscriptionPlanForRenewalBypassesStalePlanCache(t *testing.T) {
	truncateTables(t)

	plan := insertSubscriptionRenewPlan(t, 1401, 9.99)
	InvalidateSubscriptionPlanCache(plan.Id)

	cached, err := GetSubscriptionPlanById(plan.Id)
	require.NoError(t, err)
	require.Equal(t, 9.99, cached.PriceAmount)

	require.NoError(t, DB.Model(&SubscriptionPlan{}).
		Where("id = ?", plan.Id).
		Update("price_amount", 19.99).Error)

	stale, err := GetSubscriptionPlanById(plan.Id)
	require.NoError(t, err)
	require.Equal(t, 9.99, stale.PriceAmount)

	latest, err := GetLatestSubscriptionPlanForRenewal(plan.Id)
	require.NoError(t, err)
	assert.Equal(t, 19.99, latest.PriceAmount)
}
