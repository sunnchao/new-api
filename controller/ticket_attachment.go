package controller

import (
	"bytes"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "golang.org/x/image/webp"
)

const (
	ticketAttachmentURLPrefix = "/uploads/tickets/"
	maxTicketAttachmentCount  = 6
	maxTicketAttachmentBytes  = 5 << 20
)

type ticketImageInfo struct {
	Format    string
	Extension string
	Width     int
	Height    int
}

// UploadTicketAttachment uploads one image for ticket creation or replies.
func UploadTicketAttachment(c *gin.Context) {
	if c.GetInt("role") < common.ImageUploadPermission {
		common.ApiErrorMsg(c, "无权上传附件")
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxTicketAttachmentBytes+(1<<20))
	fileHeader, err := c.FormFile("file")
	if err != nil {
		common.ApiErrorMsg(c, "请选择图片文件")
		return
	}
	if fileHeader.Size > maxTicketAttachmentBytes {
		common.ApiErrorMsg(c, "图片大小不能超过 5MB")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxTicketAttachmentBytes+1))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if len(data) == 0 {
		common.ApiErrorMsg(c, "请选择图片文件")
		return
	}
	if len(data) > maxTicketAttachmentBytes {
		common.ApiErrorMsg(c, "图片大小不能超过 5MB")
		return
	}

	info, err := validateTicketImage(data)
	if err != nil {
		common.ApiErrorMsg(c, "仅支持 PNG、JPG、GIF、WebP 图片")
		return
	}

	dateDir := time.Now().Format("200601")
	dir := filepath.Join("uploads", "tickets", dateDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		common.ApiError(c, err)
		return
	}

	filename := uuid.NewString() + info.Extension
	dstPath := filepath.Join(dir, filename)
	if err := os.WriteFile(dstPath, data, 0644); err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, gin.H{
		"url":    ticketAttachmentURLPrefix + dateDir + "/" + filename,
		"size":   len(data),
		"width":  info.Width,
		"height": info.Height,
	})
}

func validateTicketImage(data []byte) (ticketImageInfo, error) {
	config, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return ticketImageInfo{}, err
	}
	if config.Width <= 0 || config.Height <= 0 {
		return ticketImageInfo{}, fmt.Errorf("invalid image dimensions")
	}

	info := ticketImageInfo{
		Format: format,
		Width:  config.Width,
		Height: config.Height,
	}
	switch format {
	case "png":
		info.Extension = ".png"
	case "jpeg":
		info.Extension = ".jpg"
	case "gif":
		info.Extension = ".gif"
	case "webp":
		info.Extension = ".webp"
	default:
		return ticketImageInfo{}, fmt.Errorf("unsupported image format: %s", format)
	}
	return info, nil
}

func normalizeTicketAttachmentUrls(raw string) (string, int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "null" {
		return "", 0, nil
	}

	var urls []string
	if err := common.UnmarshalJsonStr(raw, &urls); err != nil {
		return "", 0, fmt.Errorf("invalid attachment_urls")
	}

	normalized := make([]string, 0, len(urls))
	seen := make(map[string]struct{}, len(urls))
	for _, url := range urls {
		url = strings.TrimSpace(url)
		if url == "" {
			continue
		}
		if !isValidTicketAttachmentURL(url) {
			return "", 0, fmt.Errorf("invalid attachment url")
		}
		if _, ok := seen[url]; ok {
			continue
		}
		seen[url] = struct{}{}
		normalized = append(normalized, url)
	}

	if len(normalized) == 0 {
		return "", 0, nil
	}
	if len(normalized) > maxTicketAttachmentCount {
		return "", 0, fmt.Errorf("too many attachments")
	}

	data, err := common.Marshal(normalized)
	if err != nil {
		return "", 0, err
	}
	return string(data), len(normalized), nil
}

func isValidTicketAttachmentURL(url string) bool {
	return strings.HasPrefix(url, ticketAttachmentURLPrefix) &&
		!strings.Contains(url, "..") &&
		!strings.Contains(url, "\\") &&
		!strings.ContainsAny(url, "\x00\r\n\t")
}

func countTicketAttachmentUrls(raw string) int {
	_, count, err := normalizeTicketAttachmentUrls(raw)
	if err != nil {
		return 0
	}
	return count
}

func buildTicketReplyNotify(ticket *model.Ticket, message *model.TicketMessage, isAdmin bool) dto.Notify {
	content := "工单 #{{value}} 收到用户回复"
	if isAdmin {
		content = "您的工单 #{{value}} 已收到管理员回复"
	}
	if ticket.Title != "" {
		content += "\n标题：" + ticket.Title
	}
	if preview := buildTicketReplyPreview(message.Content, 80); preview != "" {
		content += "\n回复：" + preview
	}
	if count := countTicketAttachmentUrls(message.AttachmentUrls); count > 0 {
		content += fmt.Sprintf("\n附件 %d 张", count)
	}
	return dto.NewNotify(dto.NotifyTypeTicketReply, "工单回复通知", content, []interface{}{ticket.Id})
}

func buildTicketReplyPreview(content string, maxLength int) string {
	preview := strings.Join(strings.Fields(strings.TrimSpace(content)), " ")
	if preview == "" {
		return ""
	}
	if len([]rune(preview)) <= maxLength {
		return preview
	}
	return string([]rune(preview)[:maxLength]) + "..."
}

func renderNotifyContent(notify dto.Notify) string {
	content := notify.Content
	for _, value := range notify.Values {
		content = strings.Replace(content, dto.ContentValueParam, fmt.Sprintf("%v", value), 1)
	}
	return content
}
