package controller

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupUserNotifyTestDB(t *testing.T) *gorm.DB {
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
	require.NoError(t, db.AutoMigrate(&model.User{}))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestTestUserNotificationUsesCurrentUserWebhookSetting(t *testing.T) {
	setupUserNotifyTestDB(t)

	user := &model.User{
		Id:       4101,
		Username: "webhook-user",
		Role:     common.RoleAdminUser,
		Status:   common.UserStatusEnabled,
		Email:    "admin@example.com",
		Group:    "default",
		AffCode:  "webhook-user-aff",
	}
	user.SetSetting(dto.UserSetting{
		NotifyType:    dto.NotifyTypeWebhook,
		WebhookUrl:    "https://open.feishu.cn/open-apis/bot/v2/hook/test-token",
		WebhookSecret: "feishu-secret",
	})
	require.NoError(t, model.DB.Create(user).Error)

	var capturedUserId int
	var capturedEmail string
	var capturedSetting dto.UserSetting
	var capturedNotify dto.Notify
	originalNotifyUser := notifyUser
	notifyUser = func(userId int, userEmail string, userSetting dto.UserSetting, data dto.Notify) error {
		capturedUserId = userId
		capturedEmail = userEmail
		capturedSetting = userSetting
		capturedNotify = data
		return nil
	}
	t.Cleanup(func() {
		notifyUser = originalNotifyUser
	})

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/user/setting/test_notify", nil, user.Id)

	TestUserNotification(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)
	require.Equal(t, user.Id, capturedUserId)
	require.Equal(t, user.Email, capturedEmail)
	require.Equal(t, dto.NotifyTypeWebhook, capturedSetting.NotifyType)
	require.Equal(t, "https://open.feishu.cn/open-apis/bot/v2/hook/test-token", capturedSetting.WebhookUrl)
	require.Equal(t, "feishu-secret", capturedSetting.WebhookSecret)
	require.Equal(t, dto.NotifyTypeChannelTest, capturedNotify.Type)
	require.Equal(t, "通知测试", capturedNotify.Title)
}

func TestTestUserNotificationCanUseWebhookPayloadWithoutSaving(t *testing.T) {
	setupUserNotifyTestDB(t)

	user := &model.User{
		Id:       4102,
		Username: "payload-webhook-user",
		Role:     common.RoleAdminUser,
		Status:   common.UserStatusEnabled,
		Email:    "admin@example.com",
		Group:    "default",
		AffCode:  "payload-webhook-user-aff",
	}
	user.SetSetting(dto.UserSetting{
		NotifyType: dto.NotifyTypeEmail,
	})
	require.NoError(t, model.DB.Create(user).Error)

	var capturedSetting dto.UserSetting
	originalNotifyUser := notifyUser
	notifyUser = func(_ int, _ string, userSetting dto.UserSetting, _ dto.Notify) error {
		capturedSetting = userSetting
		return nil
	}
	t.Cleanup(func() {
		notifyUser = originalNotifyUser
	})

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/user/setting/test_notify", map[string]interface{}{
		"notify_type":    dto.NotifyTypeWebhook,
		"webhook_url":    "https://open.feishu.cn/open-apis/bot/v2/hook/form-token",
		"webhook_secret": "form-secret",
	}, user.Id)

	TestUserNotification(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)
	require.Equal(t, dto.NotifyTypeWebhook, capturedSetting.NotifyType)
	require.Equal(t, "https://open.feishu.cn/open-apis/bot/v2/hook/form-token", capturedSetting.WebhookUrl)
	require.Equal(t, "form-secret", capturedSetting.WebhookSecret)
}

func TestTestUserNotificationTrimsWebhookURL(t *testing.T) {
	setupUserNotifyTestDB(t)

	user := &model.User{
		Id:       4104,
		Username: "trim-test-webhook-user",
		Role:     common.RoleAdminUser,
		Status:   common.UserStatusEnabled,
		Email:    "admin@example.com",
		Group:    "default",
		AffCode:  "trim-test-webhook-user-aff",
	}
	user.SetSetting(dto.UserSetting{
		NotifyType: dto.NotifyTypeEmail,
	})
	require.NoError(t, model.DB.Create(user).Error)

	var capturedSetting dto.UserSetting
	originalNotifyUser := notifyUser
	notifyUser = func(_ int, _ string, userSetting dto.UserSetting, _ dto.Notify) error {
		capturedSetting = userSetting
		return nil
	}
	t.Cleanup(func() {
		notifyUser = originalNotifyUser
	})

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/user/setting/test_notify", map[string]interface{}{
		"notify_type": dto.NotifyTypeWebhook,
		"webhook_url": "  https://open.feishu.cn/open-apis/bot/v2/hook/trim-form-token  ",
	}, user.Id)

	TestUserNotification(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)
	require.Equal(t, "https://open.feishu.cn/open-apis/bot/v2/hook/trim-form-token", capturedSetting.WebhookUrl)
}

func TestUpdateUserSettingTrimsWebhookURL(t *testing.T) {
	setupUserNotifyTestDB(t)

	user := &model.User{
		Id:       4103,
		Username: "trim-webhook-user",
		Role:     common.RoleAdminUser,
		Status:   common.UserStatusEnabled,
		Email:    "admin@example.com",
		Group:    "default",
		AffCode:  "trim-webhook-user-aff",
	}
	require.NoError(t, model.DB.Create(user).Error)

	ctx, recorder := newAuthenticatedContext(t, http.MethodPut, "/api/user/setting", map[string]interface{}{
		"notify_type":             dto.NotifyTypeWebhook,
		"quota_warning_threshold": 0.8,
		"webhook_url":             "  https://open.feishu.cn/open-apis/bot/v2/hook/trim-token  ",
		"webhook_secret":          "secret",
	}, user.Id)

	UpdateUserSetting(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	updatedUser, err := model.GetUserById(user.Id, false)
	require.NoError(t, err)
	settings := updatedUser.GetSetting()
	require.Equal(t, dto.NotifyTypeWebhook, settings.NotifyType)
	require.Equal(t, "https://open.feishu.cn/open-apis/bot/v2/hook/trim-token", settings.WebhookUrl)
	require.Equal(t, "secret", settings.WebhookSecret)
}
