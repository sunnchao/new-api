package model

import (
	"fmt"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func seedScheduledUser(t *testing.T, id int) {
	t.Helper()
	require.NoError(t, DB.Create(&User{
		Id:       id,
		Username: fmt.Sprintf("scheduled_user_%d", id),
		Status:   common.UserStatusEnabled,
		Group:    "default",
		AffCode:  fmt.Sprintf("scheduled_aff_%d", id),
	}).Error)
}

func seedScheduledPlan(t *testing.T, id int) *SubscriptionPlan {
	t.Helper()
	plan := &SubscriptionPlan{
		Id:                 id,
		Title:              "Scheduled Plan",
		PriceAmount:        9.99,
		Currency:           "USD",
		DurationUnit:       SubscriptionDurationDay,
		DurationValue:      7,
		Enabled:            true,
		TotalAmount:        500,
		BillingMode:        SubscriptionBillingModeQuota,
		QuotaResetPeriod:   SubscriptionResetDaily,
		QuotaResetMode:     SubscriptionResetModeAnchor,
		HourlyLimitAmount:  100,
		HourlyLimitHours:   1,
		HourlyResetMode:    SubscriptionResetModeAnchor,
		DailyLimitAmount:   200,
		DailyResetMode:     SubscriptionResetModeAnchor,
		WeeklyLimitAmount:  300,
		WeeklyResetMode:    SubscriptionResetModeAnchor,
		MonthlyLimitAmount: 400,
		MonthlyResetMode:   SubscriptionResetModeAnchor,
		UpgradeGroup:       "vip",
	}
	require.NoError(t, DB.Create(plan).Error)
	return plan
}

func TestCreateScheduledSubscriptionTxSnapshotsPlanFields(t *testing.T) {
	truncateTables(t)
	userId := 5101
	seedScheduledUser(t, userId)
	plan := seedScheduledPlan(t, 5201)

	anchor := common.GetTimestamp() + 7200
	var created *UserSubscription
	require.NoError(t, DB.Transaction(func(tx *gorm.DB) error {
		sub, err := CreateScheduledSubscriptionTx(tx, userId, plan, anchor, "order")
		if err != nil {
			return err
		}
		created = sub
		return nil
	}))

	require.NotNil(t, created)
	assert.Equal(t, UserSubscriptionStatusScheduled, created.Status)
	assert.Equal(t, anchor, created.StartTime)
	expectedEnd, err := calcPlanEndTime(time.Unix(anchor, 0), plan)
	require.NoError(t, err)
	assert.Equal(t, expectedEnd, created.EndTime)

	assert.Equal(t, plan.TotalAmount, created.AmountTotal)
	assert.Equal(t, plan.HourlyLimitAmount, created.HourlyLimitAmount)
	assert.Equal(t, plan.DailyLimitAmount, created.DailyLimitAmount)
	assert.Equal(t, plan.WeeklyLimitAmount, created.WeeklyLimitAmount)
	assert.Equal(t, plan.MonthlyLimitAmount, created.MonthlyLimitAmount)
	assert.Equal(t, plan.UpgradeGroup, created.UpgradeGroup)

	// All reset anchors are pinned to activationAnchor.
	assert.Equal(t, anchor, created.LastResetTime)
	assert.True(t, created.NextResetTime > anchor)
	assert.Equal(t, anchor, created.HourlyLastResetTime)
	assert.Equal(t, anchor, created.DailyLastResetTime)
	assert.Equal(t, anchor, created.WeeklyLastResetTime)
	assert.Equal(t, anchor, created.MonthlyLastResetTime)

	// User group must remain untouched until activation.
	var user User
	require.NoError(t, DB.First(&user, userId).Error)
	assert.Equal(t, "default", user.Group)
}

func TestEnsureNoExistingScheduledRenewalBlocksDuplicate(t *testing.T) {
	truncateTables(t)
	userId := 5102
	seedScheduledUser(t, userId)
	plan := seedScheduledPlan(t, 5202)

	require.NoError(t, DB.Create(&UserSubscription{
		UserId:    userId,
		PlanId:    plan.Id,
		Status:    UserSubscriptionStatusScheduled,
		StartTime: common.GetTimestamp() + 3600,
		EndTime:   common.GetTimestamp() + 7200,
	}).Error)

	err := EnsureNoExistingScheduledRenewal(userId, plan.Id)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "待生效")
}

func TestEnsureNoExistingScheduledRenewalAllowsAfterActivation(t *testing.T) {
	truncateTables(t)
	userId := 5103
	seedScheduledUser(t, userId)
	plan := seedScheduledPlan(t, 5203)

	// Existing active subscription should not block scheduling a renewal.
	require.NoError(t, DB.Create(&UserSubscription{
		UserId:    userId,
		PlanId:    plan.Id,
		Status:    "active",
		StartTime: common.GetTimestamp() - 60,
		EndTime:   common.GetTimestamp() + 3600,
	}).Error)

	require.NoError(t, EnsureNoExistingScheduledRenewal(userId, plan.Id))
}

func TestActivateScheduledSubscriptionAtAnchorKeepsTimes(t *testing.T) {
	truncateTables(t)
	userId := 5104
	seedScheduledUser(t, userId)
	plan := seedScheduledPlan(t, 5204)

	anchor := common.GetTimestamp() + 3600
	var sub *UserSubscription
	require.NoError(t, DB.Transaction(func(tx *gorm.DB) error {
		created, err := CreateScheduledSubscriptionTx(tx, userId, plan, anchor, "order")
		sub = created
		return err
	}))

	originalEnd := sub.EndTime
	originalNextReset := sub.NextResetTime

	require.NoError(t, DB.Transaction(func(tx *gorm.DB) error {
		return ActivateScheduledSubscriptionTx(tx, sub, anchor)
	}))

	assert.Equal(t, "active", sub.Status)
	assert.Equal(t, anchor, sub.StartTime)
	assert.Equal(t, originalEnd, sub.EndTime, "anchor activation must not shift end_time")
	assert.Equal(t, originalNextReset, sub.NextResetTime)

	var user User
	require.NoError(t, DB.First(&user, userId).Error)
	assert.Equal(t, plan.UpgradeGroup, user.Group, "upgrade group must apply on activation")
}

func TestActivateScheduledSubscriptionEarlyShiftsAllTimeFields(t *testing.T) {
	truncateTables(t)
	userId := 5105
	seedScheduledUser(t, userId)
	plan := seedScheduledPlan(t, 5205)

	anchor := common.GetTimestamp() + 24*3600
	var sub *UserSubscription
	require.NoError(t, DB.Transaction(func(tx *gorm.DB) error {
		created, err := CreateScheduledSubscriptionTx(tx, userId, plan, anchor, "order")
		sub = created
		return err
	}))

	originalLen := sub.EndTime - sub.StartTime
	originalHourlyDelta := sub.HourlyNextResetTime - sub.HourlyLastResetTime
	originalDailyDelta := sub.DailyNextResetTime - sub.DailyLastResetTime

	earlyActivate := common.GetTimestamp() // 24h earlier than anchor
	require.NoError(t, DB.Transaction(func(tx *gorm.DB) error {
		return ActivateScheduledSubscriptionTx(tx, sub, earlyActivate)
	}))

	assert.Equal(t, "active", sub.Status)
	assert.Equal(t, earlyActivate, sub.StartTime)
	assert.Equal(t, earlyActivate+originalLen, sub.EndTime, "subscription duration must be preserved across early activation")
	assert.Equal(t, earlyActivate, sub.HourlyLastResetTime)
	assert.Equal(t, earlyActivate+originalHourlyDelta, sub.HourlyNextResetTime)
	assert.Equal(t, earlyActivate, sub.DailyLastResetTime)
	assert.Equal(t, earlyActivate+originalDailyDelta, sub.DailyNextResetTime)
}

func TestActivateScheduledSubscriptionRejectsNonScheduled(t *testing.T) {
	truncateTables(t)
	userId := 5106
	seedScheduledUser(t, userId)
	plan := seedScheduledPlan(t, 5206)

	sub := &UserSubscription{
		UserId:    userId,
		PlanId:    plan.Id,
		Status:    "active",
		StartTime: common.GetTimestamp() - 60,
		EndTime:   common.GetTimestamp() + 3600,
	}
	require.NoError(t, DB.Create(sub).Error)

	err := DB.Transaction(func(tx *gorm.DB) error {
		return ActivateScheduledSubscriptionTx(tx, sub, common.GetTimestamp())
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not scheduled")
}

func TestUserActivateScheduledSubscriptionOnlyOwnerCanActivate(t *testing.T) {
	truncateTables(t)
	owner := 5107
	stranger := 5207
	seedScheduledUser(t, owner)
	seedScheduledUser(t, stranger)
	plan := seedScheduledPlan(t, 5207)

	anchor := common.GetTimestamp() + 3600
	var created *UserSubscription
	require.NoError(t, DB.Transaction(func(tx *gorm.DB) error {
		c, err := CreateScheduledSubscriptionTx(tx, owner, plan, anchor, "order")
		created = c
		return err
	}))

	// Stranger cannot activate someone else's scheduled subscription.
	_, err := UserActivateScheduledSubscription(stranger, created.Id)
	require.Error(t, err)

	// Owner can.
	activated, err := UserActivateScheduledSubscription(owner, created.Id)
	require.NoError(t, err)
	assert.Equal(t, "active", activated.Status)
}

func TestActivateDueScheduledSubscriptionsPromotesArrivedAnchors(t *testing.T) {
	truncateTables(t)
	user1 := 5108
	user2 := 5109
	seedScheduledUser(t, user1)
	seedScheduledUser(t, user2)
	plan := seedScheduledPlan(t, 5208)

	pastAnchor := common.GetTimestamp() - 60
	futureAnchor := common.GetTimestamp() + 3600

	var dueSub, futureSub *UserSubscription
	require.NoError(t, DB.Transaction(func(tx *gorm.DB) error {
		s1, err := CreateScheduledSubscriptionTx(tx, user1, plan, pastAnchor, "order")
		if err != nil {
			return err
		}
		dueSub = s1
		s2, err := CreateScheduledSubscriptionTx(tx, user2, plan, futureAnchor, "order")
		if err != nil {
			return err
		}
		futureSub = s2
		return nil
	}))

	count, err := ActivateDueScheduledSubscriptions(100)
	require.NoError(t, err)
	assert.Equal(t, 1, count)

	var reloadedDue, reloadedFuture UserSubscription
	require.NoError(t, DB.First(&reloadedDue, dueSub.Id).Error)
	require.NoError(t, DB.First(&reloadedFuture, futureSub.Id).Error)
	assert.Equal(t, "active", reloadedDue.Status)
	assert.Equal(t, UserSubscriptionStatusScheduled, reloadedFuture.Status)
}
