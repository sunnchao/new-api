package controller

import (
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupTicketNotifyTestDB(t *testing.T) *gorm.DB {
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
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Ticket{}))

	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestCreateTicketNotifiesRootAdminUser(t *testing.T) {
	setupTicketNotifyTestDB(t)

	root := &model.User{
		Id:       1101,
		Username: "root-admin",
		Role:     common.RoleRootUser,
		Status:   common.UserStatusEnabled,
		Email:    "root@example.com",
		Group:    "default",
		AffCode:  "create-ticket-root-aff",
	}
	root.SetSetting(dto.UserSetting{
		NotifyType: dto.NotifyTypeWebhook,
		WebhookUrl: "https://notify.example.com/tickets",
	})
	require.NoError(t, model.DB.Create(root).Error)
	require.NoError(t, model.DB.Create(&model.User{
		Id:       2101,
		Username: "ticket-owner",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Email:    "owner@example.com",
		Group:    "default",
		AffCode:  "create-ticket-owner-aff",
	}).Error)

	type notifyCall struct {
		userId      int
		userEmail   string
		userSetting dto.UserSetting
		notify      dto.Notify
	}
	notifyCalls := make(chan notifyCall, 1)
	originalNotifyUser := notifyUser
	notifyUser = func(userId int, userEmail string, userSetting dto.UserSetting, data dto.Notify) error {
		notifyCalls <- notifyCall{
			userId:      userId,
			userEmail:   userEmail,
			userSetting: userSetting,
			notify:      data,
		}
		return nil
	}
	t.Cleanup(func() {
		notifyUser = originalNotifyUser
	})

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/ticket/", map[string]interface{}{
		"title":       "Cannot recharge",
		"category":    "billing",
		"priority":    model.TicketPriorityHigh,
		"description": "Payment succeeded but quota did not arrive.",
	}, 2101)

	CreateTicket(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	select {
	case call := <-notifyCalls:
		require.Equal(t, root.Id, call.userId)
		require.Equal(t, root.Email, call.userEmail)
		require.Equal(t, dto.NotifyTypeWebhook, call.userSetting.NotifyType)
		require.Equal(t, "https://notify.example.com/tickets", call.userSetting.WebhookUrl)
		require.Equal(t, dto.NotifyTypeTicketCreated, call.notify.Type)
	case <-time.After(time.Second):
		t.Fatal("expected ticket creation to notify root admin user")
	}
}

func TestNotifyTicketCreatedSendsNotifyUserToRootAdmin(t *testing.T) {
	setupTicketNotifyTestDB(t)

	root := &model.User{
		Id:       1001,
		Username: "root-admin",
		Role:     common.RoleRootUser,
		Status:   common.UserStatusEnabled,
		Email:    "root@example.com",
		Group:    "default",
		AffCode:  "root-admin-aff",
	}
	root.SetSetting(dto.UserSetting{
		NotifyType:    dto.NotifyTypeWebhook,
		WebhookUrl:    "https://notify.example.com/tickets",
		WebhookSecret: "secret",
	})
	require.NoError(t, model.DB.Create(root).Error)

	require.NoError(t, model.DB.Create(&model.User{
		Id:       2001,
		Username: "ticket-owner",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Email:    "owner@example.com",
		Group:    "default",
		AffCode:  "ticket-owner-aff",
	}).Error)

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

	notifyTicketCreated(&model.Ticket{
		Id:              3001,
		UserId:          2001,
		Title:           "Cannot recharge",
		Category:        "billing",
		Priority:        model.TicketPriorityHigh,
		Status:          model.TicketStatusPending,
		Description:     "Payment succeeded but quota did not arrive.",
		AttachmentUrls:  `["/uploads/tickets/202605/a.png"]`,
		AssignedAdminId: 0,
	})

	require.Equal(t, root.Id, capturedUserId)
	require.Equal(t, root.Email, capturedEmail)
	require.Equal(t, dto.NotifyTypeWebhook, capturedSetting.NotifyType)
	require.Equal(t, "https://notify.example.com/tickets", capturedSetting.WebhookUrl)
	require.Equal(t, "secret", capturedSetting.WebhookSecret)
	require.Equal(t, dto.NotifyTypeTicketCreated, capturedNotify.Type)
	require.Equal(t, "新工单通知", capturedNotify.Title)
	require.Contains(t, capturedNotify.Content, "新工单 #{{value}}")
	require.Contains(t, capturedNotify.Content, "Cannot recharge")
	require.Contains(t, capturedNotify.Content, "用户：ticket-owner")
	require.Contains(t, capturedNotify.Content, "附件 1 张")
	require.Equal(t, []interface{}{3001}, capturedNotify.Values)
}

func TestCloseTicketNotifiesAssignedAdmin(t *testing.T) {
	setupTicketNotifyTestDB(t)

	owner := &model.User{
		Id:       2201,
		Username: "ticket-owner",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Email:    "owner@example.com",
		Group:    "default",
		AffCode:  "close-ticket-owner-aff",
	}
	admin := &model.User{
		Id:       1201,
		Username: "assigned-admin",
		Role:     common.RoleAdminUser,
		Status:   common.UserStatusEnabled,
		Email:    "admin@example.com",
		Group:    "default",
		AffCode:  "close-ticket-admin-aff",
	}
	admin.SetSetting(dto.UserSetting{
		NotifyType: dto.NotifyTypeWebhook,
		WebhookUrl: "https://notify.example.com/tickets",
	})
	require.NoError(t, model.DB.Create(owner).Error)
	require.NoError(t, model.DB.Create(admin).Error)

	ticket := &model.Ticket{
		Id:              3201,
		UserId:          owner.Id,
		Title:           "Quota missing",
		Category:        "billing",
		Priority:        model.TicketPriorityMedium,
		Status:          model.TicketStatusPending,
		Description:     "Quota did not arrive.",
		AssignedAdminId: admin.Id,
	}
	require.NoError(t, model.DB.Create(ticket).Error)

	type notifyCall struct {
		userId      int
		userEmail   string
		userSetting dto.UserSetting
		notify      dto.Notify
	}
	notifyCalls := make(chan notifyCall, 1)
	originalNotifyUser := notifyUser
	notifyUser = func(userId int, userEmail string, userSetting dto.UserSetting, data dto.Notify) error {
		notifyCalls <- notifyCall{
			userId:      userId,
			userEmail:   userEmail,
			userSetting: userSetting,
			notify:      data,
		}
		return nil
	}
	t.Cleanup(func() {
		notifyUser = originalNotifyUser
	})

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/ticket/3201/close", nil, owner.Id)
	ctx.Params = gin.Params{{Key: "id", Value: "3201"}}

	CloseTicket(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	select {
	case call := <-notifyCalls:
		require.Equal(t, admin.Id, call.userId)
		require.Equal(t, admin.Email, call.userEmail)
		require.Equal(t, dto.NotifyTypeWebhook, call.userSetting.NotifyType)
		require.Equal(t, dto.NotifyTypeTicketStatus, call.notify.Type)
		require.Equal(t, "工单关闭通知", call.notify.Title)
		require.Contains(t, call.notify.Content, "用户已关闭工单 #{{value}}")
		require.Contains(t, call.notify.Content, "Quota missing")
		require.Equal(t, []interface{}{ticket.Id}, call.notify.Values)
	case <-time.After(time.Second):
		t.Fatal("expected closing a ticket to notify assigned admin")
	}
}

func TestBuildTicketClosedNotifyIncludesTitle(t *testing.T) {
	notify := buildTicketClosedNotify(&model.Ticket{
		Id:    3301,
		Title: "Quota missing",
	})

	require.Equal(t, dto.NotifyTypeTicketStatus, notify.Type)
	require.Equal(t, "工单关闭通知", notify.Title)
	require.Equal(t, []interface{}{3301}, notify.Values)
	require.Contains(t, notify.Content, "用户已关闭工单 #{{value}}")
	require.Contains(t, notify.Content, "Quota missing")
}
