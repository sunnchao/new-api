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

func setupRedemptionTopUpControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	gin.SetMode(gin.TestMode)
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)

	model.DB = db
	model.LOG_DB = db
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Redemption{}))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestBuildTopUpRedemptionResponseKeepsQuotaCodeAsNumber(t *testing.T) {
	response := buildTopUpRedemptionResponse(&model.RedemptionResult{
		Type:  model.RedemptionTypeQuota,
		Quota: 123,
	})

	assert.Equal(t, 123, response)
}

func TestBuildTopUpRedemptionResponseReturnsSubscriptionPayload(t *testing.T) {
	response := buildTopUpRedemptionResponse(&model.RedemptionResult{
		Type: model.RedemptionTypeSubscription,
		Subscription: &model.UserSubscription{
			Id:     77,
			PlanId: 88,
		},
		Plan: &model.SubscriptionPlan{
			Id:    88,
			Title: "Pro",
		},
	})

	payload, ok := response.(gin.H)
	require.True(t, ok)
	assert.Equal(t, model.RedemptionTypeSubscription, payload["type"])
	assert.Equal(t, 77, payload["subscription"].(*model.UserSubscription).Id)
	assert.Equal(t, "Pro", payload["plan"].(*model.SubscriptionPlan).Title)
}

func TestTopUpReturnsSpecificRedeemErrorMessage(t *testing.T) {
	setupRedemptionTopUpControllerTestDB(t)
	confirmPaymentComplianceForTest(t)

	require.NoError(t, model.DB.Create(&model.User{
		Id:       904,
		Username: "redeem-user",
		Group:    "default",
		Status:   common.UserStatusEnabled,
	}).Error)
	require.NoError(t, model.DB.Create(&model.Redemption{
		UserId:       1,
		Key:          "used-redemption-code",
		Status:       common.RedemptionCodeStatusUsed,
		Name:         "Used Code",
		Quota:        100,
		CreatedTime:  common.GetTimestamp(),
		RedeemedTime: common.GetTimestamp(),
		UsedUserId:   901,
	}).Error)

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/user/topup", gin.H{
		"key": "used-redemption-code",
	}, 904)

	TopUp(ctx)

	response := decodeAPIResponse(t, recorder)
	require.False(t, response.Success)
	assert.Equal(t, "该兑换码已被使用", response.Message)
}
