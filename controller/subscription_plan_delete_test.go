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

func setupSubscriptionPlanDeleteControllerTestDB(t *testing.T) *gorm.DB {
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
		&model.SubscriptionPlan{},
	))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestAdminDeleteSubscriptionPlanRejectsEnabledPlan(t *testing.T) {
	confirmPaymentComplianceForTest(t)
	db := setupSubscriptionPlanDeleteControllerTestDB(t)
	require.NoError(t, db.Create(&model.User{
		Id:       4101,
		Username: "delete-plan-admin-user",
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}).Error)
	require.NoError(t, db.Create(&model.SubscriptionPlan{
		Id:            4201,
		Title:         "Enabled Delete Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
	}).Error)

	ctx, recorder := newAuthenticatedContext(t, http.MethodDelete, "/api/subscription/admin/plans/4201", nil, 4101)
	ctx.Params = gin.Params{{Key: "id", Value: "4201"}}

	AdminDeleteSubscriptionPlan(ctx)

	response := decodeAPIResponse(t, recorder)
	require.False(t, response.Success)
	assert.Equal(t, "请先禁用套餐后再删除", response.Message)

	var count int64
	require.NoError(t, db.Model(&model.SubscriptionPlan{}).Where("id = ?", 4201).Count(&count).Error)
	assert.Equal(t, int64(1), count)
}

func TestAdminDeleteSubscriptionPlanDeletesDisabledPlan(t *testing.T) {
	confirmPaymentComplianceForTest(t)
	db := setupSubscriptionPlanDeleteControllerTestDB(t)
	require.NoError(t, db.Create(&model.User{
		Id:       4102,
		Username: "delete-plan-admin-user-2",
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}).Error)
	require.NoError(t, db.Create(&model.SubscriptionPlan{
		Id:            4202,
		Title:         "Disabled Delete Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
	}).Error)
	require.NoError(t, db.Model(&model.SubscriptionPlan{}).
		Where("id = ?", 4202).
		Update("enabled", false).Error)

	ctx, recorder := newAuthenticatedContext(t, http.MethodDelete, "/api/subscription/admin/plans/4202", nil, 4102)
	ctx.Params = gin.Params{{Key: "id", Value: "4202"}}

	AdminDeleteSubscriptionPlan(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var count int64
	require.NoError(t, db.Model(&model.SubscriptionPlan{}).Where("id = ?", 4202).Count(&count).Error)
	assert.Equal(t, int64(0), count)

	require.NoError(t, db.Unscoped().Model(&model.SubscriptionPlan{}).Where("id = ?", 4202).Count(&count).Error)
	assert.Equal(t, int64(1), count)
}
