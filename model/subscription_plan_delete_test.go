package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func insertSubscriptionPlanForDeleteTest(t *testing.T, id int) *SubscriptionPlan {
	t.Helper()
	plan := &SubscriptionPlan{
		Id:            id,
		Title:         "Delete Test Plan",
		PriceAmount:   9.99,
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

func TestDeleteSubscriptionPlanRequiresDisabledPlan(t *testing.T) {
	truncateTables(t)

	plan := insertSubscriptionPlanForDeleteTest(t, 1701)

	err := DeleteSubscriptionPlan(plan.Id)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "subscription plan must be disabled before deletion")

	var count int64
	require.NoError(t, DB.Model(&SubscriptionPlan{}).Where("id = ?", plan.Id).Count(&count).Error)
	assert.Equal(t, int64(1), count)
}

func TestDeleteSubscriptionPlanDeletesDisabledPlan(t *testing.T) {
	truncateTables(t)

	plan := insertSubscriptionPlanForDeleteTest(t, 1702)
	require.NoError(t, DB.Model(&SubscriptionPlan{}).
		Where("id = ?", plan.Id).
		Update("enabled", false).Error)

	err := DeleteSubscriptionPlan(plan.Id)

	require.NoError(t, err)

	var count int64
	require.NoError(t, DB.Model(&SubscriptionPlan{}).Where("id = ?", plan.Id).Count(&count).Error)
	assert.Equal(t, int64(0), count)

	require.NoError(t, DB.Unscoped().Model(&SubscriptionPlan{}).Where("id = ?", plan.Id).Count(&count).Error)
	assert.Equal(t, int64(1), count)
}

func TestDeletedSubscriptionPlanStillSupportsHistoricalPlanInfo(t *testing.T) {
	truncateTables(t)

	userId := 1703
	require.NoError(t, DB.Create(&User{
		Id:       userId,
		Username: "subscription_plan_delete_user",
		Status:   1,
		Group:    "default",
		AffCode:  "subscription_plan_delete_aff",
	}).Error)
	plan := insertSubscriptionPlanForDeleteTest(t, 1704)
	require.NoError(t, DB.Create(&UserSubscription{
		Id:        1705,
		UserId:    userId,
		PlanId:    plan.Id,
		StartTime: 100,
		EndTime:   200,
		Status:    "expired",
		Source:    "order",
	}).Error)
	require.NoError(t, DB.Model(&SubscriptionPlan{}).
		Where("id = ?", plan.Id).
		Update("enabled", false).Error)
	require.NoError(t, DeleteSubscriptionPlan(plan.Id))

	info, err := GetSubscriptionPlanInfoByUserSubscriptionId(1705)

	require.NoError(t, err)
	require.NotNil(t, info)
	assert.Equal(t, plan.Id, info.PlanId)
	assert.Equal(t, plan.Title, info.PlanTitle)
}
