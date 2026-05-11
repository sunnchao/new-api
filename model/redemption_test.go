package model

import (
	"errors"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func insertUserForRedemptionTest(t *testing.T, id int, quota int) {
	t.Helper()
	user := &User{
		Id:       id,
		Username: "redemption_user",
		Status:   common.UserStatusEnabled,
		Quota:    quota,
		Group:    "default",
	}
	require.NoError(t, DB.Create(user).Error)
}

func insertSubscriptionPlanForRedemptionTest(t *testing.T, id int) *SubscriptionPlan {
	t.Helper()
	plan := &SubscriptionPlan{
		Id:            id,
		Title:         "Redeemable Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
		TotalAmount:   12345,
		BillingMode:   SubscriptionBillingModeQuota,
	}
	require.NoError(t, DB.Create(plan).Error)
	return plan
}

func TestRedeemQuotaCodeKeepsLegacyQuotaBehavior(t *testing.T) {
	truncateTables(t)

	insertUserForRedemptionTest(t, 901, 100)
	code := &Redemption{
		UserId:      1,
		Key:         "quota-redemption-code",
		Status:      common.RedemptionCodeStatusEnabled,
		Name:        "Quota Code",
		Quota:       250,
		CreatedTime: common.GetTimestamp(),
	}
	require.NoError(t, DB.Create(code).Error)

	result, err := Redeem("quota-redemption-code", 901)
	require.NoError(t, err)

	assert.Equal(t, RedemptionTypeQuota, result.Type)
	assert.Equal(t, 250, result.Quota)
	assert.Nil(t, result.Subscription)
	assert.Equal(t, 350, getUserQuotaForPaymentGuardTest(t, 901))

	var saved Redemption
	require.NoError(t, DB.First(&saved, "id = ?", code.Id).Error)
	assert.Equal(t, common.RedemptionCodeStatusUsed, saved.Status)
	assert.Equal(t, 901, saved.UsedUserId)
	assert.NotZero(t, saved.RedeemedTime)
	assert.Zero(t, countUserSubscriptionsForPaymentGuardTest(t, 901))
}

func TestRedeemSubscriptionCodeCreatesUserSubscription(t *testing.T) {
	truncateTables(t)

	insertUserForRedemptionTest(t, 902, 100)
	plan := insertSubscriptionPlanForRedemptionTest(t, 801)
	code := &Redemption{
		UserId:             1,
		Key:                "subscription-redemption-code",
		Status:             common.RedemptionCodeStatusEnabled,
		Name:               "Subscription Code",
		Type:               RedemptionTypeSubscription,
		SubscriptionPlanId: plan.Id,
		CreatedTime:        common.GetTimestamp(),
	}
	require.NoError(t, DB.Create(code).Error)

	result, err := Redeem("subscription-redemption-code", 902)
	require.NoError(t, err)

	assert.Equal(t, RedemptionTypeSubscription, result.Type)
	assert.Zero(t, result.Quota)
	require.NotNil(t, result.Subscription)
	assert.Equal(t, plan.Id, result.Subscription.PlanId)
	assert.Equal(t, "redemption", result.Subscription.Source)
	assert.Equal(t, int64(12345), result.Subscription.AmountTotal)
	assert.Equal(t, 100, getUserQuotaForPaymentGuardTest(t, 902))
	assert.Equal(t, int64(1), countUserSubscriptionsForPaymentGuardTest(t, 902))

	var saved Redemption
	require.NoError(t, DB.First(&saved, "id = ?", code.Id).Error)
	assert.Equal(t, common.RedemptionCodeStatusUsed, saved.Status)
	assert.Equal(t, 902, saved.UsedUserId)
	assert.NotZero(t, saved.RedeemedTime)
}

func TestRedeemSubscriptionCodeBypassesPurchaseLimit(t *testing.T) {
	truncateTables(t)

	insertUserForRedemptionTest(t, 903, 100)
	plan := insertSubscriptionPlanForRedemptionTest(t, 802)
	plan.MaxPurchasePerUser = 1
	require.NoError(t, DB.Save(plan).Error)

	require.NoError(t, DB.Create(&UserSubscription{
		UserId:      903,
		PlanId:      plan.Id,
		AmountTotal: plan.TotalAmount,
		StartTime:   common.GetTimestamp() - 3600,
		EndTime:     common.GetTimestamp() + 3600,
		Status:      "active",
		Source:      "order",
		CreatedAt:   common.GetTimestamp() - 3600,
		UpdatedAt:   common.GetTimestamp() - 3600,
	}).Error)
	code := &Redemption{
		UserId:             1,
		Key:                "subscription-redemption-limit-code",
		Status:             common.RedemptionCodeStatusEnabled,
		Name:               "Subscription Limit Code",
		Type:               RedemptionTypeSubscription,
		SubscriptionPlanId: plan.Id,
		CreatedTime:        common.GetTimestamp(),
	}
	require.NoError(t, DB.Create(code).Error)

	result, err := Redeem("subscription-redemption-limit-code", 903)
	require.NoError(t, err)

	require.NotNil(t, result.Subscription)
	assert.Equal(t, plan.Id, result.Subscription.PlanId)
	assert.Equal(t, "redemption", result.Subscription.Source)
	assert.Equal(t, int64(2), countUserSubscriptionsForPaymentGuardTest(t, 903))

	var saved Redemption
	require.NoError(t, DB.First(&saved, "id = ?", code.Id).Error)
	assert.Equal(t, common.RedemptionCodeStatusUsed, saved.Status)
	assert.Equal(t, 903, saved.UsedUserId)
}

func TestRedeemUsedCodeKeepsSpecificErrorMessage(t *testing.T) {
	truncateTables(t)

	insertUserForRedemptionTest(t, 904, 100)
	require.NoError(t, DB.Create(&Redemption{
		UserId:       1,
		Key:          "used-redemption-code",
		Status:       common.RedemptionCodeStatusUsed,
		Name:         "Used Code",
		Quota:        100,
		CreatedTime:  common.GetTimestamp(),
		RedeemedTime: common.GetTimestamp(),
		UsedUserId:   901,
	}).Error)

	result, err := Redeem("used-redemption-code", 904)
	require.Nil(t, result)
	require.Error(t, err)
	assert.True(t, errors.Is(err, ErrRedeemFailed))
	assert.Equal(t, "该兑换码已被使用", err.Error())
}
