package controller

import (
	"encoding/base64"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/require"
)

func TestNormalizeTicketAttachmentUrlsKeepsLocalUploadUrls(t *testing.T) {
	normalized, count, err := normalizeTicketAttachmentUrls(`[" /api/uploads/tickets/202605/image-a.png ","/uploads/tickets/202605/image-b.jpg"]`)

	require.NoError(t, err)
	require.Equal(t, 2, count)

	var urls []string
	require.NoError(t, common.UnmarshalJsonStr(normalized, &urls))
	require.Equal(t, []string{
		"/api/uploads/tickets/202605/image-a.png",
		"/api/uploads/tickets/202605/image-b.jpg",
	}, urls)
}

func TestNormalizeTicketAttachmentUrlsRejectsExternalUrls(t *testing.T) {
	_, _, err := normalizeTicketAttachmentUrls(`["https://example.com/image.png"]`)

	require.Error(t, err)
}

func TestNormalizeTicketAttachmentUrlsRejectsTooManyUrls(t *testing.T) {
	_, _, err := normalizeTicketAttachmentUrls(`[
		"/api/uploads/tickets/202605/1.png",
		"/api/uploads/tickets/202605/2.png",
		"/api/uploads/tickets/202605/3.png",
		"/api/uploads/tickets/202605/4.png",
		"/api/uploads/tickets/202605/5.png",
		"/api/uploads/tickets/202605/6.png",
		"/api/uploads/tickets/202605/7.png"
	]`)

	require.Error(t, err)
}

func TestBuildTicketReplyNotifyIncludesPreviewAndAttachmentCount(t *testing.T) {
	notify := buildTicketReplyNotify(
		&model.Ticket{Id: 42, Title: "Billing mismatch"},
		&model.TicketMessage{
			Content:        "第一行回复\n第二行回复内容会作为摘要的一部分",
			AttachmentUrls: `["/api/uploads/tickets/202605/a.png","/api/uploads/tickets/202605/b.jpg"]`,
		},
		true,
	)

	require.Equal(t, dto.NotifyTypeTicketReply, notify.Type)
	require.Equal(t, "工单回复通知", notify.Title)
	require.Equal(t, []interface{}{42}, notify.Values)
	require.Contains(t, notify.Content, "您的工单 #{{value}} 已收到管理员回复")
	require.Contains(t, notify.Content, "Billing mismatch")
	require.Contains(t, notify.Content, "第一行回复")
	require.Contains(t, notify.Content, "附件 2 张")
}

func TestValidateTicketImageAcceptsPngAndRejectsText(t *testing.T) {
	pngData, err := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=")
	require.NoError(t, err)

	info, err := validateTicketImage(pngData)
	require.NoError(t, err)
	require.Equal(t, "png", info.Format)
	require.Equal(t, ".png", info.Extension)
	require.Equal(t, 1, info.Width)
	require.Equal(t, 1, info.Height)

	_, err = validateTicketImage([]byte("not an image"))
	require.Error(t, err)
}
