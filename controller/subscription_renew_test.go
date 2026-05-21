package controller

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupSubscriptionRenewControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

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
		&model.Log{},
		&model.SubscriptionPlan{},
		&model.UserSubscription{},
	))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestLoadRenewableSubscriptionAndLatestPlanRejectsInactiveSubscriptions(t *testing.T) {
	db := setupSubscriptionRenewControllerTestDB(t)
	now := common.GetTimestamp()

	require.NoError(t, db.Create(&model.User{
		Id:       2101,
		Username: "renew-controller-user",
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}).Error)
	require.NoError(t, db.Create(&model.SubscriptionPlan{
		Id:            2201,
		Title:         "Renew Controller Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
	}).Error)

	testCases := []struct {
		name   string
		status string
		end    int64
	}{
		{name: "expired", status: "expired", end: now - 60},
		{name: "cancelled", status: "cancelled", end: now + 3600},
		{name: "active but ended", status: "active", end: now - 60},
	}

	for i, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			sub := &model.UserSubscription{
				UserId:    2101,
				PlanId:    2201,
				StartTime: now - 3600,
				EndTime:   tc.end,
				Status:    tc.status,
				Source:    "order",
			}
			sub.Id = 2301 + i
			require.NoError(t, db.Create(sub).Error)

			loadedSub, plan, err := loadRenewableSubscriptionAndLatestPlan(2101, sub.Id)

			require.Error(t, err)
			assert.Nil(t, loadedSub)
			assert.Nil(t, plan)
			assert.Equal(t, "仅生效中的订阅可以续费", err.Error())
		})
	}
}

func TestLoadRenewableSubscriptionAndLatestPlanUsesLatestPlanPrice(t *testing.T) {
	db := setupSubscriptionRenewControllerTestDB(t)
	now := common.GetTimestamp()

	require.NoError(t, db.Create(&model.User{
		Id:       2102,
		Username: "renew-controller-price-user",
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}).Error)
	require.NoError(t, db.Create(&model.SubscriptionPlan{
		Id:            2202,
		Title:         "Renew Controller Price Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
	}).Error)
	require.NoError(t, db.Create(&model.UserSubscription{
		Id:        2302,
		UserId:    2102,
		PlanId:    2202,
		StartTime: now - 3600,
		EndTime:   now + 3600,
		Status:    "active",
		Source:    "order",
	}).Error)

	cached, err := model.GetSubscriptionPlanById(2202)
	require.NoError(t, err)
	require.Equal(t, 9.99, cached.PriceAmount)

	require.NoError(t, db.Model(&model.SubscriptionPlan{}).
		Where("id = ?", 2202).
		Update("price_amount", 19.99).Error)

	sub, plan, err := loadRenewableSubscriptionAndLatestPlan(2102, 2302)

	require.NoError(t, err)
	require.NotNil(t, sub)
	require.NotNil(t, plan)
	assert.Equal(t, 19.99, plan.PriceAmount)
}

func seedControllerRenewUser(t *testing.T, db *gorm.DB, id int) {
	t.Helper()
	require.NoError(t, db.Create(&model.User{
		Id:       id,
		Username: fmt.Sprintf("renew_controller_user_%d", id),
		Status:   common.UserStatusEnabled,
		Group:    "default",
		AffCode:  fmt.Sprintf("renew_controller_aff_%d", id),
	}).Error)
}

func TestAdminRenewUserSubscriptionEndpointRenewsActiveSubscription(t *testing.T) {
	db := setupSubscriptionRenewControllerTestDB(t)
	now := common.GetTimestamp()
	seedControllerRenewUser(t, db, 3101)
	seedControllerRenewUser(t, db, 1)
	require.NoError(t, db.Create(&model.SubscriptionPlan{
		Id:            3201,
		Title:         "Admin Renew Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationDay,
		DurationValue: 7,
		Enabled:       true,
	}).Error)
	require.NoError(t, db.Create(&model.UserSubscription{
		Id:        3301,
		UserId:    3101,
		PlanId:    3201,
		StartTime: now - 3600,
		EndTime:   now + 3600,
		Status:    "active",
		Source:    "order",
	}).Error)

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/subscription/admin/user_subscriptions/3301/renew", nil, 1)
	ctx.Params = gin.Params{{Key: "id", Value: "3301"}}

	AdminRenewUserSubscription(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var payload model.AdminRenewSubscriptionResult
	require.NoError(t, common.Unmarshal(response.Data, &payload))
	assert.NotEqual(t, 3301, payload.UserSubscriptionId, "renewal must create a new scheduled subscription, not modify the existing one")
	assert.Equal(t, int64(now+3600), payload.OldEndTime)
	assert.Equal(t, int64(now+3600+7*24*3600), payload.NewEndTime)

	// Existing active subscription is untouched.
	var original model.UserSubscription
	require.NoError(t, db.First(&original, 3301).Error)
	assert.Equal(t, "active", original.Status)
	assert.Equal(t, int64(now+3600), original.EndTime)

	// New scheduled subscription is persisted with the correct anchor.
	var scheduled model.UserSubscription
	require.NoError(t, db.First(&scheduled, payload.UserSubscriptionId).Error)
	assert.Equal(t, model.UserSubscriptionStatusScheduled, scheduled.Status)
	assert.Equal(t, payload.OldEndTime, scheduled.StartTime)
	assert.Equal(t, payload.NewEndTime, scheduled.EndTime)
}

func TestAdminRenewUserSubscriptionEndpointRejectsInactiveSubscription(t *testing.T) {
	db := setupSubscriptionRenewControllerTestDB(t)
	now := common.GetTimestamp()
	seedControllerRenewUser(t, db, 3102)
	require.NoError(t, db.Create(&model.SubscriptionPlan{
		Id:            3202,
		Title:         "Inactive Admin Renew Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationDay,
		DurationValue: 7,
		Enabled:       true,
	}).Error)
	require.NoError(t, db.Create(&model.UserSubscription{
		Id:        3302,
		UserId:    3102,
		PlanId:    3202,
		StartTime: now - 7200,
		EndTime:   now - 3600,
		Status:    "active",
		Source:    "order",
	}).Error)

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/subscription/admin/user_subscriptions/3302/renew", nil, 1)
	ctx.Params = gin.Params{{Key: "id", Value: "3302"}}

	AdminRenewUserSubscription(ctx)

	response := decodeAPIResponse(t, recorder)
	require.False(t, response.Success)
	assert.Equal(t, "仅生效中的订阅可以续费", response.Message)

	var reloaded model.UserSubscription
	require.NoError(t, db.First(&reloaded, 3302).Error)
	assert.Equal(t, now-3600, reloaded.EndTime)
}
