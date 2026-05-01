package controller

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ---- Shared types ----

type SubscriptionPlanDTO struct {
	Plan model.SubscriptionPlan `json:"plan"`
}

type BillingPreferenceRequest struct {
	BillingPreference string `json:"billing_preference"`
}

// ---- User APIs ----

func GetSubscriptionPlans(c *gin.Context) {
	var plans []model.SubscriptionPlan
	if err := model.DB.Where("enabled = ?", true).Order("sort_order desc, id desc").Find(&plans).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]SubscriptionPlanDTO, 0, len(plans))
	for _, p := range plans {
		result = append(result, SubscriptionPlanDTO{
			Plan: p,
		})
	}
	common.ApiSuccess(c, result)
}

// GetHomeSubscriptionPlans returns only plans with show_on_home = true (public endpoint).
func GetHomeSubscriptionPlans(c *gin.Context) {
	var plans []model.SubscriptionPlan
	if err := model.DB.Where("enabled = ? AND show_on_home = ?", true, true).Order("sort_order desc, id desc").Find(&plans).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]SubscriptionPlanDTO, 0, len(plans))
	for _, p := range plans {
		result = append(result, SubscriptionPlanDTO{
			Plan: p,
		})
	}
	common.ApiSuccess(c, result)
}

func GetSubscriptionSelf(c *gin.Context) {
	userId := c.GetInt("id")
	settingMap, _ := model.GetUserSetting(userId, false)
	pref := common.NormalizeBillingPreference(settingMap.BillingPreference)

	// Get all subscriptions (including expired)
	allSubscriptions, err := model.GetAllUserSubscriptions(userId)
	if err != nil {
		allSubscriptions = []model.SubscriptionSummary{}
	}

	// Get active subscriptions for backward compatibility
	activeSubscriptions, err := model.GetAllActiveUserSubscriptions(userId)
	if err != nil {
		activeSubscriptions = []model.SubscriptionSummary{}
	}

	common.ApiSuccess(c, gin.H{
		"billing_preference": pref,
		"subscriptions":      activeSubscriptions, // all active subscriptions
		"all_subscriptions":  allSubscriptions,    // all subscriptions including expired
	})
}

func UpdateSubscriptionPreference(c *gin.Context) {
	userId := c.GetInt("id")
	var req BillingPreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	pref := common.NormalizeBillingPreference(req.BillingPreference)

	user, err := model.GetUserById(userId, true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	current := user.GetSetting()
	current.BillingPreference = pref
	user.SetSetting(current)
	if err := user.Update(false); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"billing_preference": pref})
}

// ---- Admin APIs ----

func AdminListSubscriptionPlans(c *gin.Context) {
	var plans []model.SubscriptionPlan
	if err := model.DB.Order("sort_order desc, id desc").Find(&plans).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]SubscriptionPlanDTO, 0, len(plans))
	for _, p := range plans {
		result = append(result, SubscriptionPlanDTO{
			Plan: p,
		})
	}
	common.ApiSuccess(c, result)
}

type AdminUpsertSubscriptionPlanRequest struct {
	Plan model.SubscriptionPlan `json:"plan"`
}

func normalizeAndValidateAllowedGroups(raw string) (string, error) {
	allowedGroups := strings.TrimSpace(raw)
	if allowedGroups == "" {
		return "", nil
	}

	groupRatios := ratio_setting.GetGroupRatioCopy()
	groups := strings.Split(allowedGroups, ",")
	normalized := make([]string, 0, len(groups))
	seen := make(map[string]struct{}, len(groups))

	for _, item := range groups {
		group := strings.TrimSpace(item)
		if group == "" {
			continue
		}
		if _, ok := groupRatios[group]; !ok {
			return "", fmt.Errorf("指定分组 %s 不存在", group)
		}
		if _, ok := seen[group]; ok {
			continue
		}
		seen[group] = struct{}{}
		normalized = append(normalized, group)
	}

	return strings.Join(normalized, ","), nil
}

func normalizeSubscriptionResetModes(plan *model.SubscriptionPlan) {
	if plan == nil {
		return
	}
	plan.QuotaResetMode = model.NormalizeSubscriptionResetMode(plan.QuotaResetMode)
	plan.HourlyResetMode = model.NormalizeSubscriptionResetMode(plan.HourlyResetMode)
	plan.DailyResetMode = model.NormalizeSubscriptionResetMode(plan.DailyResetMode)
	plan.WeeklyResetMode = model.NormalizeSubscriptionResetMode(plan.WeeklyResetMode)
	plan.MonthlyResetMode = model.NormalizeSubscriptionResetMode(plan.MonthlyResetMode)
}

func AdminCreateSubscriptionPlan(c *gin.Context) {
	var req AdminUpsertSubscriptionPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	req.Plan.Id = 0
	if strings.TrimSpace(req.Plan.Title) == "" {
		common.ApiErrorMsg(c, "套餐标题不能为空")
		return
	}
	if req.Plan.PriceAmount < 0 {
		common.ApiErrorMsg(c, "价格不能为负数")
		return
	}
	if req.Plan.PriceAmount > 9999 {
		common.ApiErrorMsg(c, "价格不能超过9999")
		return
	}
	if req.Plan.Currency == "" {
		req.Plan.Currency = "USD"
	}
	req.Plan.Currency = "USD"
	if req.Plan.DurationUnit == "" {
		req.Plan.DurationUnit = model.SubscriptionDurationMonth
	}
	if req.Plan.DurationValue <= 0 && req.Plan.DurationUnit != model.SubscriptionDurationCustom {
		req.Plan.DurationValue = 1
	}
	if req.Plan.MaxPurchasePerUser < 0 {
		common.ApiErrorMsg(c, "购买上限不能为负数")
		return
	}
	if req.Plan.TotalAmount < 0 {
		common.ApiErrorMsg(c, "总额度不能为负数")
		return
	}
	req.Plan.BillingMode = model.NormalizeSubscriptionBillingMode(req.Plan.BillingMode)
	req.Plan.UpgradeGroup = strings.TrimSpace(req.Plan.UpgradeGroup)
	if req.Plan.UpgradeGroup != "" {
		if _, ok := ratio_setting.GetGroupRatioCopy()[req.Plan.UpgradeGroup]; !ok {
			common.ApiErrorMsg(c, "升级分组不存在")
			return
		}
	}
	allowedGroups, err := normalizeAndValidateAllowedGroups(req.Plan.AllowedGroups)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	req.Plan.AllowedGroups = allowedGroups
	// Normalize reset cycle modes here so new plans default to subscription-anchor
	// cycles and historical "interval" payloads stay backward compatible.
	normalizeSubscriptionResetModes(&req.Plan)
	req.Plan.QuotaResetPeriod = model.NormalizeResetPeriod(req.Plan.QuotaResetPeriod)
	if req.Plan.QuotaResetPeriod == model.SubscriptionResetCustom && req.Plan.QuotaResetCustomSeconds <= 0 {
		common.ApiErrorMsg(c, "自定义重置周期需大于0秒")
		return
	}

	// === Validate rate limits ===
	if req.Plan.HourlyLimitAmount < 0 {
		common.ApiErrorMsg(c, "小时限额不能为负数")
		return
	}
	if req.Plan.HourlyLimitAmount > 0 {
		if req.Plan.HourlyLimitHours <= 0 || req.Plan.HourlyLimitHours > 24 {
			common.ApiErrorMsg(c, "小时间隔必须在 1-24 之间")
			return
		}
	}
	if req.Plan.DailyLimitAmount < 0 {
		common.ApiErrorMsg(c, "日限额不能为负数")
		return
	}
	if req.Plan.WeeklyLimitAmount < 0 {
		common.ApiErrorMsg(c, "周限额不能为负数")
		return
	}
	if req.Plan.MonthlyLimitAmount < 0 {
		common.ApiErrorMsg(c, "月限额不能为负数")
		return
	}

	err = model.DB.Create(&req.Plan).Error
	if err != nil {
		common.ApiError(c, err)
		return
	}
	model.InvalidateSubscriptionPlanCache(req.Plan.Id)
	common.ApiSuccess(c, req.Plan)
}

func AdminUpdateSubscriptionPlan(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "无效的ID")
		return
	}
	var req AdminUpsertSubscriptionPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if strings.TrimSpace(req.Plan.Title) == "" {
		common.ApiErrorMsg(c, "套餐标题不能为空")
		return
	}
	if req.Plan.PriceAmount < 0 {
		common.ApiErrorMsg(c, "价格不能为负数")
		return
	}
	if req.Plan.PriceAmount > 9999 {
		common.ApiErrorMsg(c, "价格不能超过9999")
		return
	}
	req.Plan.Id = id
	if req.Plan.Currency == "" {
		req.Plan.Currency = "USD"
	}
	req.Plan.Currency = "USD"
	if req.Plan.DurationUnit == "" {
		req.Plan.DurationUnit = model.SubscriptionDurationMonth
	}
	if req.Plan.DurationValue <= 0 && req.Plan.DurationUnit != model.SubscriptionDurationCustom {
		req.Plan.DurationValue = 1
	}
	if req.Plan.MaxPurchasePerUser < 0 {
		common.ApiErrorMsg(c, "购买上限不能为负数")
		return
	}
	if req.Plan.TotalAmount < 0 {
		common.ApiErrorMsg(c, "总额度不能为负数")
		return
	}
	req.Plan.BillingMode = model.NormalizeSubscriptionBillingMode(req.Plan.BillingMode)
	req.Plan.UpgradeGroup = strings.TrimSpace(req.Plan.UpgradeGroup)
	if req.Plan.UpgradeGroup != "" {
		if _, ok := ratio_setting.GetGroupRatioCopy()[req.Plan.UpgradeGroup]; !ok {
			common.ApiErrorMsg(c, "升级分组不存在")
			return
		}
	}
	allowedGroups, err := normalizeAndValidateAllowedGroups(req.Plan.AllowedGroups)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	req.Plan.AllowedGroups = allowedGroups
	// Normalize reset cycle modes here so new plans default to subscription-anchor
	// cycles and historical "interval" payloads stay backward compatible.
	normalizeSubscriptionResetModes(&req.Plan)
	req.Plan.QuotaResetPeriod = model.NormalizeResetPeriod(req.Plan.QuotaResetPeriod)
	if req.Plan.QuotaResetPeriod == model.SubscriptionResetCustom && req.Plan.QuotaResetCustomSeconds <= 0 {
		common.ApiErrorMsg(c, "自定义重置周期需大于0秒")
		return
	}

	// === Validate rate limits ===
	if req.Plan.HourlyLimitAmount < 0 {
		common.ApiErrorMsg(c, "小时限额不能为负数")
		return
	}
	if req.Plan.HourlyLimitAmount > 0 {
		if req.Plan.HourlyLimitHours <= 0 || req.Plan.HourlyLimitHours > 24 {
			common.ApiErrorMsg(c, "小时间隔必须在 1-24 之间")
			return
		}
	}
	if req.Plan.DailyLimitAmount < 0 {
		common.ApiErrorMsg(c, "日限额不能为负数")
		return
	}
	if req.Plan.WeeklyLimitAmount < 0 {
		common.ApiErrorMsg(c, "周限额不能为负数")
		return
	}
	if req.Plan.MonthlyLimitAmount < 0 {
		common.ApiErrorMsg(c, "月限额不能为负数")
		return
	}

	err = model.DB.Transaction(func(tx *gorm.DB) error {
		// update plan (allow zero values updates with map)
		updateMap := map[string]interface{}{
			"title":                      req.Plan.Title,
			"subtitle":                   req.Plan.Subtitle,
			"price_amount":               req.Plan.PriceAmount,
			"currency":                   req.Plan.Currency,
			"duration_unit":              req.Plan.DurationUnit,
			"duration_value":             req.Plan.DurationValue,
			"custom_seconds":             req.Plan.CustomSeconds,
			"enabled":                    req.Plan.Enabled,
			"show_on_home":               req.Plan.ShowOnHome,
			"sort_order":                 req.Plan.SortOrder,
			"stripe_price_id":            req.Plan.StripePriceId,
			"creem_product_id":           req.Plan.CreemProductId,
			"max_purchase_per_user":      req.Plan.MaxPurchasePerUser,
			"total_amount":               req.Plan.TotalAmount,
			"approximate_times":          req.Plan.ApproximateTimes,
			"billing_mode":               req.Plan.BillingMode,
			"upgrade_group":              req.Plan.UpgradeGroup,
			"allowed_groups":             req.Plan.AllowedGroups,
			"hourly_limit_amount":        req.Plan.HourlyLimitAmount,
			"hourly_limit_hours":         req.Plan.HourlyLimitHours,
			"hourly_approximate_times":   req.Plan.HourlyApproximateTimes,
			"hourly_reset_mode":          req.Plan.HourlyResetMode,
			"daily_limit_amount":         req.Plan.DailyLimitAmount,
			"daily_approximate_times":    req.Plan.DailyApproximateTimes,
			"weekly_limit_amount":        req.Plan.WeeklyLimitAmount,
			"weekly_approximate_times":   req.Plan.WeeklyApproximateTimes,
			"weekly_reset_mode":          req.Plan.WeeklyResetMode,
			"monthly_limit_amount":       req.Plan.MonthlyLimitAmount,
			"monthly_approximate_times":  req.Plan.MonthlyApproximateTimes,
			"monthly_reset_mode":         req.Plan.MonthlyResetMode,
			"quota_reset_period":         req.Plan.QuotaResetPeriod,
			"quota_reset_mode":           req.Plan.QuotaResetMode,
			"quota_reset_custom_seconds": req.Plan.QuotaResetCustomSeconds,
			"daily_reset_mode":           req.Plan.DailyResetMode,
			"updated_at":                 common.GetTimestamp(),
		}
		if err := tx.Model(&model.SubscriptionPlan{}).Where("id = ?", id).Updates(updateMap).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	model.InvalidateSubscriptionPlanCache(id)
	common.ApiSuccess(c, nil)
}

type AdminUpdateSubscriptionPlanStatusRequest struct {
	Enabled *bool `json:"enabled"`
}

func AdminUpdateSubscriptionPlanStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "无效的ID")
		return
	}
	var req AdminUpdateSubscriptionPlanStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Enabled == nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.DB.Model(&model.SubscriptionPlan{}).Where("id = ?", id).Update("enabled", *req.Enabled).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	model.InvalidateSubscriptionPlanCache(id)
	common.ApiSuccess(c, nil)
}

type AdminBindSubscriptionRequest struct {
	UserId int `json:"user_id"`
	PlanId int `json:"plan_id"`
}

func AdminBindSubscription(c *gin.Context) {
	var req AdminBindSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.UserId <= 0 || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	msg, err := model.AdminBindSubscription(req.UserId, req.PlanId, "")
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if msg != "" {
		common.ApiSuccess(c, gin.H{"message": msg})
		return
	}
	common.ApiSuccess(c, nil)
}

// ---- Admin: user subscription management ----

func AdminListUserSubscriptions(c *gin.Context) {
	userId, _ := strconv.Atoi(c.Param("id"))
	if userId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}
	subs, err := model.GetAllUserSubscriptions(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, subs)
}

type AdminCreateUserSubscriptionRequest struct {
	PlanId int `json:"plan_id"`
}

// AdminCreateUserSubscription creates a new user subscription from a plan (no payment).
func AdminCreateUserSubscription(c *gin.Context) {
	userId, _ := strconv.Atoi(c.Param("id"))
	if userId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}
	var req AdminCreateUserSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	msg, err := model.AdminBindSubscription(userId, req.PlanId, "")
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if msg != "" {
		common.ApiSuccess(c, gin.H{"message": msg})
		return
	}
	common.ApiSuccess(c, nil)
}

// AdminInvalidateUserSubscription cancels a user subscription immediately.
func AdminInvalidateUserSubscription(c *gin.Context) {
	subId, _ := strconv.Atoi(c.Param("id"))
	if subId <= 0 {
		common.ApiErrorMsg(c, "无效的订阅ID")
		return
	}
	msg, err := model.AdminInvalidateUserSubscription(subId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if msg != "" {
		common.ApiSuccess(c, gin.H{"message": msg})
		return
	}
	common.ApiSuccess(c, nil)
}

// AdminDeleteUserSubscription hard-deletes a user subscription.
func AdminDeleteUserSubscription(c *gin.Context) {
	subId, _ := strconv.Atoi(c.Param("id"))
	if subId <= 0 {
		common.ApiErrorMsg(c, "无效的订阅ID")
		return
	}
	msg, err := model.AdminDeleteUserSubscription(subId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if msg != "" {
		common.ApiSuccess(c, gin.H{"message": msg})
		return
	}
	common.ApiSuccess(c, nil)
}

// ---- Admin: all site subscriptions overview ----

type AdminAllUserSubscriptionsRequest struct {
	Page       int    `form:"page" binding:"omitempty,min=1"`
	PageSize   int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	Username   string `form:"username" binding:"omitempty"`
	PlanId     int    `form:"plan_id" binding:"omitempty,min=1"`
	Status     string `form:"status" binding:"omitempty"`
	UserGroup  string `form:"user_group" binding:"omitempty"`
}

// AdminListAllUserSubscriptions lists all user subscriptions across the site with pagination and filtering.
func AdminListAllUserSubscriptions(c *gin.Context) {
	var req AdminAllUserSubscriptionsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误: "+err.Error())
		return
	}

	// Set defaults
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	overviews, total, err := model.AdminListAllUserSubscriptions(req.Page, req.PageSize, req.Username, req.PlanId, req.Status, req.UserGroup)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, gin.H{
		"data":  overviews,
		"total": total,
		"page":  req.Page,
		"page_size": req.PageSize,
	})
}
