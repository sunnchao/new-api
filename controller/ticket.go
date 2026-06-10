package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

// CreateTicket 用户创建工单
func CreateTicket(c *gin.Context) {
	userId := c.GetInt("id")
	var req struct {
		Title          string `json:"title" binding:"required"`
		Category       string `json:"category" binding:"required"`
		Priority       int    `json:"priority"`
		Description    string `json:"description" binding:"required"`
		AttachmentUrls string `json:"attachment_urls"`
	}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	if req.Title == "" || req.Description == "" {
		common.ApiErrorMsg(c, "标题和描述不能为空")
		return
	}
	attachmentUrls, _, err := normalizeTicketAttachmentUrls(req.AttachmentUrls)
	if err != nil {
		common.ApiErrorMsg(c, "附件格式无效")
		return
	}
	if req.Priority < model.TicketPriorityLow || req.Priority > model.TicketPriorityHigh {
		req.Priority = model.TicketPriorityLow
	}
	ticket := &model.Ticket{
		UserId:         userId,
		Title:          req.Title,
		Category:       req.Category,
		Priority:       req.Priority,
		Status:         model.TicketStatusPending,
		Description:    req.Description,
		AttachmentUrls: attachmentUrls,
	}
	if err := model.CreateTicket(ticket); err != nil {
		common.ApiError(c, err)
		return
	}
	go notifyTicketCreated(ticket)
	common.ApiSuccess(c, ticket)
}

// GetUserTickets 用户查看自己的工单列表
func GetUserTickets(c *gin.Context) {
	userId := c.GetInt("id")
	status, _ := strconv.Atoi(c.Query("status"))
	pageInfo := common.GetPageQuery(c)
	tickets, total, err := model.GetUserTickets(userId, status, pageInfo.GetPage(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(tickets)
	common.ApiSuccess(c, pageInfo)
}

// SearchUserTickets 用户搜索自己的工单
func SearchUserTickets(c *gin.Context) {
	userId := c.GetInt("id")
	keyword := c.Query("keyword")
	status, _ := strconv.Atoi(c.Query("status"))
	pageInfo := common.GetPageQuery(c)
	tickets, total, err := model.SearchUserTickets(userId, keyword, status, pageInfo.GetPage(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(tickets)
	common.ApiSuccess(c, pageInfo)
}

// GetTicketDetail 查看工单详情+消息（UserAuth own / AdminAuth）
func GetTicketDetail(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "无效的工单 ID")
		return
	}
	ticket, err := model.GetTicketById(id)
	if err != nil {
		common.ApiErrorMsg(c, "工单不存在")
		return
	}
	// 权限校验：非管理员只能查看自己的工单
	userId := c.GetInt("id")
	role := c.GetInt("role")
	if role < common.RoleAdminUser && ticket.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权访问该工单"})
		return
	}
	messages, err := model.GetTicketMessages(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	// 管理员查看时附带用户上下文信息
	userContext := gin.H{}
	if role >= common.RoleAdminUser {
		userContext = buildTicketUserContext(ticket.UserId)
	}
	common.ApiSuccess(c, gin.H{
		"ticket":       ticket,
		"messages":     messages,
		"user_context": userContext,
	})
}

// SendTicketMessage 添加回复（UserAuth own / AdminAuth）
func SendTicketMessage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "无效的工单 ID")
		return
	}
	ticket, err := model.GetTicketById(id)
	if err != nil {
		common.ApiErrorMsg(c, "工单不存在")
		return
	}
	userId := c.GetInt("id")
	role := c.GetInt("role")
	if role < common.RoleAdminUser && ticket.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "无权操作该工单"})
		return
	}
	var req struct {
		Content        string `json:"content" binding:"required"`
		AttachmentUrls string `json:"attachment_urls"`
	}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil || req.Content == "" {
		common.ApiErrorMsg(c, "回复内容不能为空")
		return
	}
	attachmentUrls, _, err := normalizeTicketAttachmentUrls(req.AttachmentUrls)
	if err != nil {
		common.ApiErrorMsg(c, "附件格式无效")
		return
	}
	isAdmin := role >= common.RoleAdminUser
	message := &model.TicketMessage{
		TicketId:       id,
		UserId:         userId,
		IsAdmin:        isAdmin,
		Content:        req.Content,
		AttachmentUrls: attachmentUrls,
	}
	if err := model.CreateTicketMessage(message); err != nil {
		common.ApiError(c, err)
		return
	}
	// 更新工单状态和时间
	newStatus := model.TicketStatusReplied
	if !isAdmin {
		newStatus = model.TicketStatusPending
	}
	_ = model.UpdateTicketStatus(id, newStatus, 0)

	// 推送站内通知
	go notifyTicketMessage(ticket, message, isAdmin)

	common.ApiSuccess(c, message)
}

// CloseTicket 用户关闭工单
func CloseTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "无效的工单 ID")
		return
	}
	ticket, err := model.GetTicketById(id)
	if err != nil {
		common.ApiErrorMsg(c, "工单不存在")
		return
	}
	userId := c.GetInt("id")
	if ticket.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "只能关闭自己的工单"})
		return
	}
	if err := model.CloseTicket(id); err != nil {
		common.ApiError(c, err)
		return
	}
	go notifyTicketClosed(ticket)
	common.ApiSuccess(c, nil)
}

// GetAllTickets 管理员查看全部工单
func GetAllTickets(c *gin.Context) {
	status, _ := strconv.Atoi(c.Query("status"))
	category := c.Query("category")
	priority, _ := strconv.Atoi(c.Query("priority"))
	assignedAdminId, _ := strconv.Atoi(c.Query("assigned_admin_id"))
	pageInfo := common.GetPageQuery(c)
	tickets, total, err := model.GetAllTickets(status, category, priority, assignedAdminId, pageInfo.GetPage(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(tickets)
	common.ApiSuccess(c, pageInfo)
}

// SearchTickets 管理员搜索工单
func SearchTickets(c *gin.Context) {
	keyword := c.Query("keyword")
	status, _ := strconv.Atoi(c.Query("status"))
	pageInfo := common.GetPageQuery(c)
	tickets, total, err := model.SearchTickets(keyword, status, pageInfo.GetPage(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(tickets)
	common.ApiSuccess(c, pageInfo)
}

// UpdateTicketStatus 管理员修改状态/优先级
func UpdateTicketStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "无效的工单 ID")
		return
	}
	var req struct {
		Status   int `json:"status"`
		Priority int `json:"priority"`
	}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	if err := model.UpdateTicketStatus(id, req.Status, req.Priority); err != nil {
		common.ApiError(c, err)
		return
	}
	// 状态变更通知提交用户
	go notifyTicketStatusChange(id)
	common.ApiSuccess(c, nil)
}

// AssignTicket 管理员分配工单
func AssignTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "无效的工单 ID")
		return
	}
	var req struct {
		AdminId int `json:"admin_id" binding:"required"`
	}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	if err := model.AssignTicket(id, req.AdminId); err != nil {
		common.ApiError(c, err)
		return
	}
	// 通知被分配的管理员
	go notifyTicketAssigned(id, req.AdminId)
	common.ApiSuccess(c, nil)
}

// DeleteTicket 管理员删除工单
func DeleteTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "无效的工单 ID")
		return
	}
	if err := model.DeleteTicket(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GetTicketCategories 获取工单分类配置
func GetTicketCategories(c *gin.Context) {
	categories := model.GetTicketCategories()
	common.ApiSuccess(c, categories)
}

// UpdateTicketCategories 更新工单分类配置
func UpdateTicketCategoriesCtrl(c *gin.Context) {
	var categories []model.TicketCategoryItem
	if err := common.DecodeJson(c.Request.Body, &categories); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	if len(categories) == 0 {
		common.ApiErrorMsg(c, "至少需要一个分类")
		return
	}
	if err := model.UpdateTicketCategories(categories); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, categories)
}

// buildTicketUserContext 构建工单提交用户的上下文信息
func buildTicketUserContext(userId int) gin.H {
	user, err := model.GetUserById(userId, false)
	if err != nil {
		return gin.H{"error": "用户不存在"}
	}
	// 最近 5 条 API 日志摘要
	logs, _, _ := model.GetUserLogs(userId, 0, 0, 0, "", "", 0, 5, "", "", "")
	context := gin.H{
		"username":    user.Username,
		"email":       user.Email,
		"quota":       user.Quota,
		"used_quota":  user.UsedQuota,
		"status":      user.Status,
		"recent_logs": logs,
	}
	return context
}

var notifyUser = service.NotifyUser

// notifyTicketCreated 工单创建通知
func notifyTicketCreated(ticket *model.Ticket) {
	user, err := model.GetUserById(ticket.UserId, false)
	if err != nil {
		common.SysLog(fmt.Sprintf("failed to load ticket owner for ticket created notification: %s", err.Error()))
		return
	}
	admin := model.GetRootUser()
	if admin == nil || admin.Id == 0 {
		common.SysLog("failed to notify ticket created: root admin not found")
		return
	}
	notification := buildTicketCreatedNotify(ticket, user)
	if err := notifyUser(admin.Id, admin.Email, admin.GetSetting(), notification); err != nil {
		common.SysLog(fmt.Sprintf("failed to notify admin %d for ticket created: %s", admin.Id, err.Error()))
	}
}

func buildTicketCreatedNotify(ticket *model.Ticket, user *model.User) dto.Notify {
	content := "收到新工单 #{{value}}"
	if ticket.Title != "" {
		content += "\n标题：" + ticket.Title
	}
	if ticket.Category != "" {
		content += "\n分类：" + ticket.Category
	}
	if ticket.Priority > 0 {
		content += fmt.Sprintf("\n优先级：%s", ticketPriorityText(ticket.Priority))
	}
	if user != nil {
		username := strings.TrimSpace(user.Username)
		if username == "" {
			username = fmt.Sprintf("ID %d", user.Id)
		}
		content += "\n用户：" + username
		if user.Email != "" {
			content += " <" + user.Email + ">"
		}
	}
	if preview := buildTicketReplyPreview(ticket.Description, 120); preview != "" {
		content += "\n描述：" + preview
	}
	if count := countTicketAttachmentUrls(ticket.AttachmentUrls); count > 0 {
		content += fmt.Sprintf("\n附件 %d 张", count)
	}
	return dto.NewNotify(dto.NotifyTypeTicketCreated, "新工单通知", content, []interface{}{ticket.Id})
}

func ticketPriorityText(priority int) string {
	switch priority {
	case model.TicketPriorityMedium:
		return "中"
	case model.TicketPriorityHigh:
		return "高"
	default:
		return "低"
	}
}

// notifyTicketMessage 工单回复通知
func notifyTicketMessage(ticket *model.Ticket, message *model.TicketMessage, isAdmin bool) {
	notification := buildTicketReplyNotify(ticket, message, isAdmin)
	if isAdmin {
		// 管理员回复 → 通知提交用户
		user, err := model.GetUserById(ticket.UserId, false)
		if err != nil {
			return
		}
		_ = notifyUser(user.Id, user.Email, user.GetSetting(), notification)
	} else {
		// 用户回复 → 通知分配的管理员
		if ticket.AssignedAdminId <= 0 {
			service.NotifyRootUser(notification.Type, notification.Title, renderNotifyContent(notification))
			return
		}
		admin, err := model.GetUserById(ticket.AssignedAdminId, false)
		if err != nil {
			return
		}
		_ = notifyUser(admin.Id, admin.Email, admin.GetSetting(), notification)
	}
}

// notifyTicketStatusChange 工单状态变更通知
func notifyTicketStatusChange(ticketId int) {
	ticket, err := model.GetTicketById(ticketId)
	if err != nil {
		return
	}
	user, err := model.GetUserById(ticket.UserId, false)
	if err != nil {
		return
	}
	statusMap := map[int]string{
		model.TicketStatusPending:  "待处理",
		model.TicketStatusProgress: "处理中",
		model.TicketStatusReplied:  "已回复",
		model.TicketStatusClosed:   "已关闭",
	}
	statusText := statusMap[ticket.Status]
	_ = notifyUser(user.Id, user.Email, user.GetSetting(), dto.NewNotify(
		dto.NotifyTypeTicketStatus,
		"工单状态变更",
		"您的工单 #{{value}} 状态已更新为 "+statusText,
		[]interface{}{ticket.Id},
	))
}

// notifyTicketClosed 用户关闭工单通知管理员
func notifyTicketClosed(ticket *model.Ticket) {
	notification := buildTicketClosedNotify(ticket)
	if ticket.AssignedAdminId <= 0 {
		service.NotifyRootUser(notification.Type, notification.Title, renderNotifyContent(notification))
		return
	}
	admin, err := model.GetUserById(ticket.AssignedAdminId, false)
	if err != nil {
		common.SysLog(fmt.Sprintf("failed to load assigned admin for ticket closed notification: %s", err.Error()))
		return
	}
	if err := notifyUser(admin.Id, admin.Email, admin.GetSetting(), notification); err != nil {
		common.SysLog(fmt.Sprintf("failed to notify admin %d for ticket closed: %s", admin.Id, err.Error()))
	}
}

func buildTicketClosedNotify(ticket *model.Ticket) dto.Notify {
	content := "用户已关闭工单 #{{value}}"
	if ticket.Title != "" {
		content += "\n标题：" + ticket.Title
	}
	return dto.NewNotify(dto.NotifyTypeTicketStatus, "工单关闭通知", content, []interface{}{ticket.Id})
}

// notifyTicketAssigned 工单分配通知
func notifyTicketAssigned(ticketId int, adminId int) {
	admin, err := model.GetUserById(adminId, false)
	if err != nil {
		return
	}
	_ = notifyUser(admin.Id, admin.Email, admin.GetSetting(), dto.NewNotify(
		dto.NotifyTypeTicketAssigned,
		"工单分配通知",
		"您被分配了工单 #{{value}}",
		[]interface{}{ticketId},
	))
}
