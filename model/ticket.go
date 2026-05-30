package model

import (
	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

// Ticket 工单
type Ticket struct {
	Id              int            `json:"id"`
	UserId          int            `json:"user_id" gorm:"index"`
	Title           string         `json:"title" gorm:"type:varchar(255)"`
	Category        string         `json:"category" gorm:"type:varchar(32);index"`
	Priority        int            `json:"priority" gorm:"default:1"`
	Status          int            `json:"status" gorm:"default:1;index"`
	Description     string         `json:"description" gorm:"type:text"`
	AttachmentUrls  string         `json:"attachment_urls" gorm:"type:text"`
	CreatedAt       int64          `json:"created_at" gorm:"bigint"`
	UpdatedAt       int64          `json:"updated_at" gorm:"bigint"`
	ClosedAt        int64          `json:"closed_at" gorm:"bigint"`
	AssignedAdminId int            `json:"assigned_admin_id" gorm:"type:int;default:0;index"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TicketMessage 工单对话消息
type TicketMessage struct {
	Id             int            `json:"id"`
	TicketId       int            `json:"ticket_id" gorm:"index"`
	UserId         int            `json:"user_id" gorm:"index"`
	IsAdmin        bool           `json:"is_admin"`
	Content        string         `json:"content" gorm:"type:text"`
	AttachmentUrls string         `json:"attachment_urls" gorm:"type:text"`
	CreatedAt      int64          `json:"created_at" gorm:"bigint"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// 工单状态常量
const (
	TicketStatusPending  = 1 // 待处理
	TicketStatusProgress = 2 // 处理中
	TicketStatusReplied  = 3 // 已回复
	TicketStatusClosed   = 4 // 已关闭
)

// 工单优先级常量
const (
	TicketPriorityLow    = 1 // 低
	TicketPriorityMedium = 2 // 中
	TicketPriorityHigh   = 3 // 高
)

// 工单分类项
type TicketCategoryItem struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

// 默认工单分类
var DefaultTicketCategories = []TicketCategoryItem{
	{Value: "billing", Label: "账单问题"},
	{Value: "technical", Label: "技术支持"},
	{Value: "account", Label: "账户问题"},
	{Value: "other", Label: "其他"},
}

// GetTicketCategories 获取工单分类配置
func GetTicketCategories() []TicketCategoryItem {
	jsonStr := common.OptionMap["TicketCategories"]
	if jsonStr == "" {
		return DefaultTicketCategories
	}
	var categories []TicketCategoryItem
	if err := common.UnmarshalJsonStr(jsonStr, &categories); err != nil {
		return DefaultTicketCategories
	}
	if len(categories) == 0 {
		return DefaultTicketCategories
	}
	return categories
}

// UpdateTicketCategories 更新工单分类配置
func UpdateTicketCategories(categories []TicketCategoryItem) error {
	data, err := common.Marshal(categories)
	if err != nil {
		return err
	}
	return UpdateOption("TicketCategories", string(data))
}

// GetUserTickets 获取用户的工单列表
func GetUserTickets(userId int, status int, page int, pageSize int) (tickets []*Ticket, total int64, err error) {
	tx := DB.Model(&Ticket{}).Where("user_id = ?", userId)
	if status > 0 {
		tx = tx.Where("status = ?", status)
	}
	err = tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = tx.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&tickets).Error
	return tickets, total, err
}

// SearchUserTickets 用户搜索自己的工单
func SearchUserTickets(userId int, keyword string, page int, pageSize int) (tickets []*Ticket, total int64, err error) {
	tx := DB.Model(&Ticket{}).Where("user_id = ?", userId)
	if keyword != "" {
		tx = tx.Where("title LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	err = tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = tx.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&tickets).Error
	return tickets, total, err
}

// GetAllTickets 管理员获取全部工单
func GetAllTickets(status int, category string, priority int, assignedAdminId int, page int, pageSize int) (tickets []*Ticket, total int64, err error) {
	tx := DB.Model(&Ticket{})
	if status > 0 {
		tx = tx.Where("status = ?", status)
	}
	if category != "" {
		tx = tx.Where("category = ?", category)
	}
	if priority > 0 {
		tx = tx.Where("priority = ?", priority)
	}
	if assignedAdminId > 0 {
		tx = tx.Where("assigned_admin_id = ?", assignedAdminId)
	}
	err = tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = tx.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&tickets).Error
	return tickets, total, err
}

// SearchTickets 管理员搜索工单
func SearchTickets(keyword string, status int, page int, pageSize int) (tickets []*Ticket, total int64, err error) {
	tx := DB.Model(&Ticket{})
	if keyword != "" {
		tx = tx.Where("title LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	if status > 0 {
		tx = tx.Where("status = ?", status)
	}
	err = tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	err = tx.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&tickets).Error
	return tickets, total, err
}

// GetTicketById 根据 ID 获取工单
func GetTicketById(id int) (*Ticket, error) {
	ticket := &Ticket{}
	err := DB.First(ticket, "id = ?", id).Error
	return ticket, err
}

// CreateTicket 创建工单
func CreateTicket(ticket *Ticket) error {
	ticket.CreatedAt = common.GetTimestamp()
	ticket.UpdatedAt = common.GetTimestamp()
	return DB.Create(ticket).Error
}

// UpdateTicketStatus 更新工单状态
func UpdateTicketStatus(id int, status int, priority int) error {
	updates := map[string]interface{}{
		"updated_at": common.GetTimestamp(),
	}
	if status > 0 {
		updates["status"] = status
		if status == TicketStatusClosed {
			updates["closed_at"] = common.GetTimestamp()
		}
	}
	if priority > 0 {
		updates["priority"] = priority
	}
	return DB.Model(&Ticket{}).Where("id = ?", id).Updates(updates).Error
}

// AssignTicket 分配工单给管理员
func AssignTicket(id int, adminId int) error {
	return DB.Model(&Ticket{}).Where("id = ?", id).Updates(map[string]interface{}{
		"assigned_admin_id": adminId,
		"status":            TicketStatusProgress,
		"updated_at":        common.GetTimestamp(),
	}).Error
}

// CloseTicket 用户关闭工单
func CloseTicket(id int) error {
	return DB.Model(&Ticket{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     TicketStatusClosed,
		"closed_at":  common.GetTimestamp(),
		"updated_at": common.GetTimestamp(),
	}).Error
}

// DeleteTicket 删除工单
func DeleteTicket(id int) error {
	return DB.Delete(&Ticket{}, id).Error
}

// GetTicketMessages 获取工单的消息列表
func GetTicketMessages(ticketId int) ([]*TicketMessage, error) {
	var messages []*TicketMessage
	err := DB.Where("ticket_id = ?", ticketId).Order("created_at asc").Find(&messages).Error
	return messages, err
}

// CreateTicketMessage 创建工单消息
func CreateTicketMessage(message *TicketMessage) error {
	message.CreatedAt = common.GetTimestamp()
	return DB.Create(message).Error
}

// IsTicketOwner 检查用户是否是工单所有者
func IsTicketOwner(ticketId int, userId int) (bool, error) {
	ticket, err := GetTicketById(ticketId)
	if err != nil {
		return false, err
	}
	return ticket.UserId == userId, nil
}
