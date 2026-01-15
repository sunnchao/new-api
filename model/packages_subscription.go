package model

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

const (
	DurationUnitDay     = "day"
	DurationUnitWeek    = "week"
	DurationUnitMonth   = "month"
	DurationUnitQuarter = "quarter"
)

var durationUnitToSeconds = map[string]int64{
	DurationUnitDay:     24 * 60 * 60,
	DurationUnitWeek:    7 * 24 * 60 * 60,
	DurationUnitMonth:   30 * 24 * 60 * 60,
	DurationUnitQuarter: 90 * 24 * 60 * 60,
}

// PackagesSubscription 订阅模型
type PackagesSubscription struct {
	Id          int     `json:"id" gorm:"primaryKey"`
	HashId      string  `json:"hash_id"`
	UserId      int     `json:"user_id" gorm:"index"`
	ServiceType string  `json:"service_type" gorm:"type:varchar(50);index;default:'claude_code'"` // claude_code, codex_code, gemini_code
	PlanType    string  `json:"plan_type"`                                                        // basic, pro, enterprise
	Status      string  `json:"status" gorm:"default:'active'"`                                   // active, expired, cancelled, pending, exhausted
	StartTime   int64   `json:"start_time"`
	EndTime     int64   `json:"end_time" gorm:"index"`
	AutoRenew   bool    `json:"auto_renew" gorm:"default:true"`
	TotalQuota  int     `json:"total_quota" gorm:"default:0"`  // 总额度
	RemainQuota int     `json:"remain_quota" gorm:"default:0"` // 剩余额度
	UsedQuota   int     `json:"used_quota" gorm:"default:0"`   // 已使用额度
	Price       float64 `json:"price"`
	Currency    string  `json:"currency" gorm:"default:'USD'"`
	// PaymentMethod 支付方式
	PaymentMethod string `json:"payment_method"`
	OrderId       string `json:"order_id" gorm:"index"` // 关联支付订单
	CreatedTime   int64  `json:"created_time"`
	UpdatedTime   int64  `json:"updated_time"`

	// 客户端验证相关字段
	ClientFingerprint string `json:"client_fingerprint" gorm:"index"`   // 客户端指纹
	AllowedClients    string `json:"allowed_clients"`                   // 允许的客户端列表，JSON格式
	MaxClientCount    int    `json:"max_client_count" gorm:"default:3"` // 最大允许的客户端数量

	// 订阅周期额度限制（单订阅）
	DailyQuotaLimit     int   `json:"daily_quota_limit" gorm:"default:0"`
	WeeklyQuotaLimit    int   `json:"weekly_quota_limit" gorm:"default:0"`
	MonthlyQuotaLimit   int   `json:"monthly_quota_limit" gorm:"default:0"`
	DailyQuotaUsed      int   `json:"daily_quota_used" gorm:"default:0"`
	WeeklyQuotaUsed     int   `json:"weekly_quota_used" gorm:"default:0"`
	MonthlyQuotaUsed    int   `json:"monthly_quota_used" gorm:"default:0"`
	DailyQuotaResetAt   int64 `json:"daily_quota_reset_at" gorm:"default:0"`
	WeeklyQuotaResetAt  int64 `json:"weekly_quota_reset_at" gorm:"default:0"`
	MonthlyQuotaResetAt int64 `json:"monthly_quota_reset_at" gorm:"default:0"`

	// 套餐指定抵扣分组
	DeductionGroup string `json:"deduction_group" gorm:"type:varchar(32);default:''"`
}

// PackagesPlan 套餐模型
type PackagesPlan struct {
	Id          int     `json:"id" gorm:"primaryKey"`
	HashId      string  `json:"hash_id"`
	Name        string  `json:"name"`
	Type        string  `json:"type" gorm:"unique"`
	ServiceType string  `json:"service_type" gorm:"type:varchar(50);index;default:'claude_code'"` // claude_code, codex_code, gemini_code
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Currency    string  `json:"currency" gorm:"default:'USD'"`
	TotalQuota  int     `json:"total_quota" gorm:"default:0"` // 总额度

	MaxClientCount int `json:"max_client_count" gorm:"default:3"`

	// 时间限制设置
	IsUnlimitedTime bool      `json:"is_unlimited_time" gorm:"default:false"` // 是否无时间限制
	DurationMonths  int       `json:"duration_months" gorm:"default:1"`       // 订阅时长(月)，当 IsUnlimitedTime 为 false 时有效（兼容字段）
	DurationUnit    string    `json:"duration_unit" gorm:"type:varchar(20);default:'month'"`
	DurationValue   int       `json:"duration_value" gorm:"default:1"`
	Features        JSONValue `json:"features" gorm:"type:json"`
	IsActive        bool      `json:"is_active" gorm:"default:true"`
	ShowInPortal    bool      `json:"show_in_portal" gorm:"default:true"`
	SortOrder       int       `json:"sort_order" gorm:"default:0"`
	CreatedTime     int64     `json:"created_time"`
	UpdatedTime     int64     `json:"updated_time"`

	// 周期额度限制
	DailyQuotaPerPlan   int `json:"daily_quota_per_plan" gorm:"default:0"`
	WeeklyQuotaPerPlan  int `json:"weekly_quota_per_plan" gorm:"default:0"`
	MonthlyQuotaPerPlan int `json:"monthly_quota_per_plan" gorm:"default:0"`

	DeductionGroup string `json:"deduction_group" gorm:"type:varchar(32);default:''"`
}

func ApplyPlanLimitsToSubscription(subscription *PackagesSubscription, plan *PackagesPlan) {
	if subscription == nil || plan == nil {
		return
	}
	subscription.DailyQuotaLimit = plan.DailyQuotaPerPlan
	subscription.WeeklyQuotaLimit = plan.WeeklyQuotaPerPlan
	subscription.MonthlyQuotaLimit = plan.MonthlyQuotaPerPlan
	subscription.DeductionGroup = strings.TrimSpace(plan.DeductionGroup)
}

func getPackagesQuotaResetStarts(now time.Time) (int64, int64, int64) {
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	weekday := int(now.Weekday())
	offset := (weekday + 6) % 7 // Monday as week start
	weekStart := dayStart.AddDate(0, 0, -offset)

	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	return dayStart.Unix(), weekStart.Unix(), monthStart.Unix()
}

func resetSubscriptionQuotaIfNeeded(subscription *PackagesSubscription, dayStart, weekStart, monthStart int64) bool {
	changed := false
	if subscription.DailyQuotaResetAt != dayStart {
		subscription.DailyQuotaUsed = 0
		subscription.DailyQuotaResetAt = dayStart
		changed = true
	}
	if subscription.WeeklyQuotaResetAt != weekStart {
		subscription.WeeklyQuotaUsed = 0
		subscription.WeeklyQuotaResetAt = weekStart
		changed = true
	}
	if subscription.MonthlyQuotaResetAt != monthStart {
		subscription.MonthlyQuotaUsed = 0
		subscription.MonthlyQuotaResetAt = monthStart
		changed = true
	}
	return changed
}

func NormalizeDurationUnit(unit string) string {
	normalized := strings.ToLower(strings.TrimSpace(unit))
	if normalized == "" {
		normalized = DurationUnitMonth
	}
	if _, ok := durationUnitToSeconds[normalized]; !ok {
		normalized = DurationUnitMonth
	}
	return normalized
}

func IsSupportedDurationUnit(unit string) bool {
	_, ok := durationUnitToSeconds[strings.ToLower(strings.TrimSpace(unit))]
	return ok
}

func (plan *PackagesPlan) NormalizeDurationFields() {
	if plan == nil {
		return
	}
	plan.DurationUnit = NormalizeDurationUnit(plan.DurationUnit)
	if plan.DurationValue <= 0 {
		if plan.DurationMonths > 0 {
			if plan.DurationUnit == DurationUnitQuarter {
				plan.DurationValue = plan.DurationMonths / 3
				if plan.DurationValue == 0 {
					plan.DurationValue = 1
				}
			} else {
				plan.DurationValue = plan.DurationMonths
			}
		} else {
			plan.DurationValue = 1
		}
	}
	if plan.DurationUnit == DurationUnitMonth && plan.DurationMonths == 0 {
		plan.DurationMonths = plan.DurationValue
	}
	if plan.DurationUnit == DurationUnitQuarter && plan.DurationMonths == 0 {
		plan.DurationMonths = plan.DurationValue * 3
	}
}

func (plan *PackagesPlan) DurationSeconds() int64 {
	if plan == nil {
		return 0
	}
	plan.NormalizeDurationFields()
	baseSeconds, ok := durationUnitToSeconds[plan.DurationUnit]
	if !ok {
		baseSeconds = durationUnitToSeconds[DurationUnitMonth]
	}
	return int64(plan.DurationValue) * baseSeconds
}

func DurationValueToSeconds(unit string, value int) int64 {
	normalizedUnit := NormalizeDurationUnit(unit)
	if value <= 0 {
		value = 1
	}
	baseSeconds := durationUnitToSeconds[normalizedUnit]
	return int64(value) * baseSeconds
}

func GrantPlanToUser(userId int, plan *PackagesPlan, source string, allowStack bool) (*PackagesSubscription, bool, error) {
	if plan == nil {
		return nil, false, errors.New("plan is nil")
	}
	now := common.GetTimestamp()
	durationSeconds := plan.DurationSeconds()

	subscription, err := GetUserActivePackagesSubscription(userId, plan.ServiceType)
	if err == nil && subscription != nil && allowStack {
		updates := map[string]interface{}{
			"total_quota":  gorm.Expr("total_quota + ?", plan.TotalQuota),
			"remain_quota": gorm.Expr("remain_quota + ?", plan.TotalQuota),
			"updated_time": now,
		}
		updates["daily_quota_limit"] = plan.DailyQuotaPerPlan
		updates["weekly_quota_limit"] = plan.WeeklyQuotaPerPlan
		updates["monthly_quota_limit"] = plan.MonthlyQuotaPerPlan
		updates["deduction_group"] = strings.TrimSpace(plan.DeductionGroup)
		if !plan.IsUnlimitedTime && durationSeconds > 0 {
			updates["end_time"] = subscription.EndTime + durationSeconds
		}
		if plan.IsUnlimitedTime {
			updates["end_time"] = now + 100*365*24*60*60
		}

		if err := DB.Model(&PackagesSubscription{}).Where("id = ?", subscription.Id).Updates(updates).Error; err != nil {
			return nil, false, err
		}
		subscription.TotalQuota += plan.TotalQuota
		subscription.RemainQuota += plan.TotalQuota
		if plan.IsUnlimitedTime {
			subscription.EndTime = now + 100*365*24*60*60
		} else if durationSeconds > 0 {
			subscription.EndTime += durationSeconds
		}
		subscription.UpdatedTime = now
		ApplyPlanLimitsToSubscription(subscription, plan)
		return subscription, true, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}

	endTime := now
	if plan.IsUnlimitedTime {
		endTime += 100 * 365 * 24 * 60 * 60
	} else if durationSeconds > 0 {
		endTime += durationSeconds
	} else {
		endTime += 30 * 24 * 60 * 60
	}

	newSubscription := &PackagesSubscription{
		UserId:         userId,
		PlanType:       plan.Type,
		ServiceType:    plan.ServiceType,
		Status:         "active",
		StartTime:      now,
		EndTime:        endTime,
		AutoRenew:      false,
		TotalQuota:     plan.TotalQuota,
		RemainQuota:    plan.TotalQuota,
		UsedQuota:      0,
		Price:          plan.Price,
		Currency:       plan.Currency,
		PaymentMethod:  source,
		OrderId:        fmt.Sprintf("%s_%d_%d", source, userId, now),
		CreatedTime:    now,
		UpdatedTime:    now,
		MaxClientCount: plan.MaxClientCount,
		HashId:         common.GetUUID(),
	}
	ApplyPlanLimitsToSubscription(newSubscription, plan)

	if err := CreatePackagesSubscription(newSubscription); err != nil {
		return nil, true, err
	}

	return newSubscription, true, nil
}

// PackagesUsageLog Claude Code 使用记录
type PackagesUsageLog struct {
	Id             int    `json:"id" gorm:"primaryKey"`
	UserId         int    `json:"user_id" gorm:"index"`
	SubscriptionId int    `json:"subscription_id" gorm:"index"`
	RequestType    string `json:"request_type"` // chat, code_generation, code_review
	TokensUsed     int    `json:"tokens_used"`
	ClientInfo     string `json:"client_info"` // 客户端信息
	IpAddress      string `json:"ip_address"`
	UserAgent      string `json:"user_agent"`
	CreatedTime    int64  `json:"created_time" gorm:"index"`
}

// ClientFingerprint 客户端指纹结构
type ClientFingerprint struct {
	MachineId   string `json:"machine_id"`
	Platform    string `json:"platform"`
	Hostname    string `json:"hostname"`
	UserId      string `json:"user_id"`
	ProcessName string `json:"process_name"`
	Version     string `json:"version"`
}

// 获取用户当前有效订阅（按服务类型查询）
func GetUserActivePackagesSubscription(userId int, serviceType string) (*PackagesSubscription, error) {
	var subscription PackagesSubscription
	now := common.GetTimestamp()

	query := DB.Where("user_id = ? AND status = 'active' AND end_time > ?", userId, now)

	if serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}

	err := query.Find(&subscription).Error
	if err != nil {
		return nil, err
	}

	return &subscription, nil
}

// 获取用户当前订阅（按HashId查询）
func GetUserActivePackagesSubscriptionByHashId(userId int, hashId string) (*PackagesSubscription, error) {
	var subscription PackagesSubscription

	query := DB.Where("user_id = ? AND hash_id = ?", userId, hashId)
	if err := query.Find(&subscription).Error; err != nil {
		return nil, err
	}

	return &subscription, nil
}

// GetUserActivePackagesSubscriptions 获取用户所有活跃订阅（按到期时间升序排序，优先返回快过期的）
func GetUserActivePackagesSubscriptions(userId int, sub PackagesSubscription, isActive bool) ([]PackagesSubscription, error) {
	var subscriptions []PackagesSubscription

	query := DB.Where("user_id = ?", userId)
	if sub.ServiceType != "" {
		query = query.Where("service_type = ?", sub.ServiceType)
	}
	if sub.DeductionGroup != "" {
		query = query.Where("deduction_group = ?", sub.DeductionGroup)
	}
	if isActive {
		query = query.Where("status = 'active'")
	}

	if err := query.Order("end_time ASC").Find(&subscriptions).Error; err != nil {
		return nil, err
	}

	return subscriptions, nil
}

func ResetActiveSubscriptionsQuota(userId int, now time.Time) (int, error) {
	location, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		location = time.Local
	}

	dayStart, weekStart, monthStart := getPackagesQuotaResetStarts(now.In(location))

	subscriptions, err := GetUserActivePackagesSubscriptions(userId, PackagesSubscription{}, true)
	if err != nil {
		return 0, err
	}

	updated := 0
	updatedTime := common.GetTimestamp()

	for i := range subscriptions {
		subscription := &subscriptions[i]
		if !resetSubscriptionQuotaIfNeeded(subscription, dayStart, weekStart, monthStart) {
			continue
		}

		updates := map[string]any{
			"daily_quota_used":       subscription.DailyQuotaUsed,
			"weekly_quota_used":      subscription.WeeklyQuotaUsed,
			"monthly_quota_used":     subscription.MonthlyQuotaUsed,
			"daily_quota_reset_at":   subscription.DailyQuotaResetAt,
			"weekly_quota_reset_at":  subscription.WeeklyQuotaResetAt,
			"monthly_quota_reset_at": subscription.MonthlyQuotaResetAt,
			"updated_time":           updatedTime,
		}

		if err := DB.Model(&PackagesSubscription{}).Where("id = ?", subscription.Id).Updates(updates).Error; err != nil {
			return updated, err
		}

		updated++
	}

	return updated, nil
}

// 根据订阅ID获取订阅
func GetPackagesSubscriptionById(id int) (*PackagesSubscription, error) {
	var subscription PackagesSubscription
	err := DB.Where("id = ?", id).First(&subscription).Error
	return &subscription, err
}

// 创建订阅
func CreatePackagesSubscription(subscription *PackagesSubscription) error {
	subscription.CreatedTime = common.GetTimestamp()
	subscription.UpdatedTime = common.GetTimestamp()
	return DB.Create(subscription).Error
}

// 更新订阅
func UpdatePackagesSubscription(subscription *PackagesSubscription) error {
	subscription.UpdatedTime = common.GetTimestamp()
	return DB.Save(subscription).Error
}

// 计算可扣除额度，综合剩余额度与日/周/月限额
func calculateSubscriptionDeduct(subscription *PackagesSubscription, quotaUsed int) int {
	if subscription == nil || quotaUsed <= 0 {
		return 0
	}

	available := quotaUsed

	if subscription.RemainQuota < available {
		available = subscription.RemainQuota
	}

	if subscription.DailyQuotaLimit > 0 {
		dailyRemain := subscription.DailyQuotaLimit - subscription.DailyQuotaUsed
		if dailyRemain < available {
			available = dailyRemain
		}
	}

	if subscription.WeeklyQuotaLimit > 0 {
		weeklyRemain := subscription.WeeklyQuotaLimit - subscription.WeeklyQuotaUsed
		if weeklyRemain < available {
			available = weeklyRemain
		}
	}

	if subscription.MonthlyQuotaLimit > 0 {
		monthlyRemain := subscription.MonthlyQuotaLimit - subscription.MonthlyQuotaUsed
		if monthlyRemain < available {
			available = monthlyRemain
		}
	}

	if available < 0 {
		return 0
	}

	return available
}

// 更新订阅使用量（额度制），返回实际扣除额度
func UpdateSubscriptionPackageUsage(subscriptionId int, quotaUsed int, tokenGroup string) (int, error) {
	if quotaUsed <= 0 {
		return 0, nil
	}
	now := common.GetTimestamp()

	var deducted int

	txErr := DB.Transaction(func(tx *gorm.DB) error {
		var subscription PackagesSubscription
		if err := tx.Where("id = ?", subscriptionId).First(&subscription).Error; err != nil {
			return err
		}

		if subscription.DeductionGroup != "" && tokenGroup != subscription.DeductionGroup {
			return errors.New("订阅分组不匹配")
		}

		deducted = calculateSubscriptionDeduct(&subscription, quotaUsed)

		if deducted <= 0 {
			subscription.UpdatedTime = now
			return tx.Save(&subscription).Error
		}

		subscription.RemainQuota -= deducted
		subscription.UsedQuota += deducted
		subscription.DailyQuotaUsed += deducted
		subscription.WeeklyQuotaUsed += deducted
		subscription.MonthlyQuotaUsed += deducted
		subscription.UpdatedTime = now
		if subscription.RemainQuota <= 0 {
			subscription.Status = "exhausted"
		}

		return tx.Save(&subscription).Error
	})
	if txErr != nil {
		return 0, txErr
	}

	return deducted, nil
}

// 检查订阅是否可以使用
func (s *PackagesSubscription) CanUseService() bool {
	now := common.GetTimestamp()
	return s.Status == "active" && s.StartTime <= now && s.EndTime > now && s.RemainQuota > 0
}

// 验证客户端指纹
func (s *PackagesSubscription) ValidateClientFingerprint(fingerprint string) error {
	if s.ClientFingerprint == "" {
		s.ClientFingerprint = fingerprint
		return UpdatePackagesSubscription(s)
	}

	if s.ClientFingerprint == fingerprint {
		return nil
	}

	var allowedClients []string
	if s.AllowedClients != "" {
		if err := json.Unmarshal([]byte(s.AllowedClients), &allowedClients); err != nil {
			common.SysError("解析允许的客户端列表失败: " + err.Error())
			return errors.New("客户端验证失败")
		}
	}

	for _, client := range allowedClients {
		if client == fingerprint {
			return nil
		}
	}

	if len(allowedClients) >= s.MaxClientCount {
		return errors.New("已达到最大客户端数量限制")
	}

	allowedClients = append(allowedClients, fingerprint)
	allowedClientsJSON, err := json.Marshal(allowedClients)
	if err != nil {
		return errors.New("更新客户端列表失败")
	}

	s.AllowedClients = string(allowedClientsJSON)
	return UpdatePackagesSubscription(s)
}

// 生成客户端指纹
func GenerateClientFingerprint(clientInfo ClientFingerprint) string {
	data := fmt.Sprintf("%s-%s-%s-%s-%s-%s",
		clientInfo.MachineId,
		clientInfo.Platform,
		clientInfo.Hostname,
		clientInfo.UserId,
		clientInfo.ProcessName,
		clientInfo.Version)

	hash := md5.Sum([]byte(data))
	return hex.EncodeToString(hash[:])
}

// 获取所有套餐
func GetAllPackagesPlans(includeHidden bool) ([]PackagesPlan, error) {
	var plans []PackagesPlan
	query := DB.Where("is_active = true")
	if !includeHidden {
		query = query.Where("show_in_portal = true")
	}
	err := query.Order("sort_order ASC, price ASC").Find(&plans).Error
	if err != nil {
		return plans, err
	}
	for i := range plans {
		plans[i].NormalizeDurationFields()
	}
	return plans, nil
}

// 根据类型获取套餐
func GetPackagesPlanByType(planType string) (*PackagesPlan, error) {
	var plan PackagesPlan
	if err := DB.Where("type = ? AND is_active = true", planType).First(&plan).Error; err != nil {
		return nil, err
	}
	plan.NormalizeDurationFields()
	return &plan, nil
}

// GetPackagesPlanById 根据ID获取套餐
func GetPackagesPlanById(planId int) (*PackagesPlan, error) {
	var plan PackagesPlan
	if err := DB.Where("id = ?", planId).First(&plan).Error; err != nil {
		return nil, err
	}
	plan.NormalizeDurationFields()
	return &plan, nil
}

// CreatePackagesPlan 创建套餐
func CreatePackagesPlan(plan *PackagesPlan) error {
	return DB.Create(plan).Error
}

// UpdatePackagesPlan 更新套餐
func UpdatePackagesPlan(plan *PackagesPlan) error {
	return DB.Save(plan).Error
}

func UpdatePackagesSubscriptionsByPlan(plan *PackagesPlan) error {
	if plan == nil {
		return nil
	}
	updates := map[string]interface{}{
		"daily_quota_limit":   plan.DailyQuotaPerPlan,
		"weekly_quota_limit":  plan.WeeklyQuotaPerPlan,
		"monthly_quota_limit": plan.MonthlyQuotaPerPlan,
		"deduction_group":     strings.TrimSpace(plan.DeductionGroup),
		"service_type":        plan.ServiceType,
	}
	return DB.Model(&PackagesSubscription{}).
		Where("plan_type = ?", plan.Type).
		Updates(updates).Error
}

// DeletePackagesPlan 删除套餐
func DeletePackagesPlan(planId int) error {
	return DB.Delete(&PackagesPlan{}, planId).Error
}

// CheckPackagesPlanHasSubscriptions 检查套餐是否有关联的订阅
func CheckPackagesPlanHasSubscriptions(planId int) (bool, error) {
	var plan PackagesPlan
	if err := DB.Where("id = ?", planId).First(&plan).Error; err != nil {
		return false, err
	}

	var count int64
	err := DB.Model(&PackagesSubscription{}).
		Where("plan_type = ?", plan.Type).
		Count(&count).Error

	return count > 0, err
}

// 创建使用日志
func CreatePackagesUsageLog(log *PackagesUsageLog) error {
	log.CreatedTime = common.GetTimestamp()
	return DB.Create(log).Error
}

// 获取用户使用统计
func GetPackagesUsageStats(userId int, startTime, endTime int64) (map[string]interface{}, error) {
	var stats map[string]interface{}

	var totalRequests int64
	DB.Model(&PackagesUsageLog{}).
		Where("user_id = ? AND created_time BETWEEN ? AND ?", userId, startTime, endTime).
		Count(&totalRequests)

	var typeStats []struct {
		RequestType string `json:"request_type"`
		Count       int64  `json:"count"`
	}
	DB.Model(&PackagesUsageLog{}).
		Select("request_type, count(*) as count").
		Where("user_id = ? AND created_time BETWEEN ? AND ?", userId, startTime, endTime).
		Group("request_type").
		Scan(&typeStats)

	stats = map[string]interface{}{
		"total_requests": totalRequests,
		"type_stats":     typeStats,
	}

	return stats, nil
}

// InitPackagesPlans 初始化套餐
func InitPackagesPlans() {
	plans := []PackagesPlan{}

	for _, plan := range plans {
		var existingPlan PackagesPlan
		if err := DB.Where("type = ?", plan.Type).First(&existingPlan).Error; err != nil {
			if err := DB.Create(&plan).Error; err != nil {
				common.SysError(fmt.Sprintf("创建套餐失败: %s", err.Error()))
			} else {
				common.SysLog(fmt.Sprintf("创建套餐成功: %s", plan.Name))
			}
		}
	}
}

// 检查过期订阅并更新状态
func CheckExpiredPackagesSubscriptions() error {
	now := common.GetTimestamp()
	return DB.Model(&PackagesSubscription{}).
		Where("status = 'active' AND end_time <= ?", now).
		Update("status", "expired").Error
}

// SearchPackagesUsers 搜索用户（用于订阅管理）
func SearchPackagesUsers(keyword string, page, pageSize int) ([]*User, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	startIdx := (page - 1) * pageSize
	return SearchUsers(keyword, "", startIdx, pageSize)
}

// 获取订阅列表（分页）
func GetPackagesSubscriptions(page, pageSize int, filters map[string]interface{}) ([]PackagesSubscription, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	query := DB.Model(&PackagesSubscription{})

	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if planType, ok := filters["plan_type"].(string); ok && planType != "" {
		query = query.Where("plan_type = ?", planType)
	}
	if serviceType, ok := filters["service_type"].(string); ok && serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}
	if userId, ok := filters["user_id"].(int); ok && userId > 0 {
		query = query.Where("user_id = ?", userId)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var subscriptions []PackagesSubscription
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_time DESC").Find(&subscriptions).Error; err != nil {
		return nil, 0, err
	}

	return subscriptions, total, nil
}

func getMD5Hash(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}

func parsePackagesUserId(keyword string) (int, bool) {
	userId, err := strconv.Atoi(keyword)
	if err != nil {
		return 0, false
	}
	return userId, true
}
