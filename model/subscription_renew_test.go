package model

import (
	"fmt"
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
		Username: fmt.Sprintf("subscription_renew_user_%d", id),
		Status:   common.UserStatusEnabled,
		Group:    "default",
		AffCode:  fmt.Sprintf("aff_%d", id),
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

func TestAdminRenewUserSubscriptionExtendsActiveSubscriptionFromCurrentEndTime(t *testing.T) {
	truncateTables(t)

	userId := 1501
	adminId := 1
	insertSubscriptionRenewUser(t, userId)
	insertSubscriptionRenewUser(t, adminId)
	plan := insertSubscriptionRenewPlan(t, 1502, 9.99)
	now := common.GetTimestamp()
	oldEnd := now + 3600
	sub := insertSubscriptionRenewSubscription(t, userId, plan.Id, "active", oldEnd)

	result, err := AdminRenewUserSubscription(sub.Id, adminId, "127.0.0.1")

	require.NoError(t, err)
	require.NotNil(t, result)
	expectedEnd, err := calcPlanEndTime(time.Unix(oldEnd, 0), plan)
	require.NoError(t, err)
	assert.Equal(t, oldEnd, result.OldEndTime)
	assert.Equal(t, expectedEnd, result.NewEndTime)
	assert.Equal(t, plan.Id, result.PlanId)
	assert.Equal(t, plan.Title, result.PlanTitle)

	var reloaded UserSubscription
	require.NoError(t, DB.First(&reloaded, sub.Id).Error)
	assert.Equal(t, "active", reloaded.Status)
	assert.Equal(t, result.NewEndTime, reloaded.EndTime)

	var log Log
	require.NoError(t, DB.Where("user_id = ? AND type = ?", userId, LogTypeManage).Order("id desc").First(&log).Error)
	assert.Contains(t, log.Content, "管理员手动续费订阅")
	assert.Contains(t, log.Other, "admin_info")
}

func TestAdminRenewUserSubscriptionRejectsInactiveSubscription(t *testing.T) {
	testCases := []struct {
		name   string
		status string
		end    int64
	}{
		{name: "expired", status: "expired", end: common.GetTimestamp() - 60},
		{name: "cancelled", status: "cancelled", end: common.GetTimestamp() + 3600},
		{name: "active but ended", status: "active", end: common.GetTimestamp() - 60},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			truncateTables(t)

			userId := 1601
			insertSubscriptionRenewUser(t, userId)
			plan := insertSubscriptionRenewPlan(t, 1602, 9.99)
			sub := insertSubscriptionRenewSubscription(t, userId, plan.Id, tc.status, tc.end)

			result, err := AdminRenewUserSubscription(sub.Id, 1, "127.0.0.1")

			require.Error(t, err)
			assert.Nil(t, result)
			assert.Contains(t, err.Error(), "subscription is not active")

			var reloaded UserSubscription
			require.NoError(t, DB.First(&reloaded, sub.Id).Error)
			assert.Equal(t, tc.status, reloaded.Status)
			assert.Equal(t, tc.end, reloaded.EndTime)
		})
	}
}
