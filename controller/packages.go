package controller

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// GetPackagesPlans 获取所有套餐
func GetPackagesPlans(c *gin.Context) {
	includeHiddenStr, hasIncludeHidden := c.GetQuery("include_hidden")
	includeHidden := includeHiddenStr == "true"
	role := c.GetInt("role")
	// 管理端默认返回包含隐藏计划
	if !hasIncludeHidden && role >= common.RoleAdminUser {
		if strings.Contains(c.FullPath(), "/packages-admin/") {
			includeHidden = true
		}
	}
	if includeHidden && role < common.RoleAdminUser {
		includeHidden = false
	}
	plans, err := model.GetAllPackagesPlans(includeHidden)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取套餐失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    plans,
	})
}

type GetPackagesSubscriptionResponse struct {
	*model.PackagesSubscription
	PackagePlan *model.PackagesPlan `json:"package_plan"`
}

// GetPackagesSubscription 获取用户订阅状态
func GetPackagesSubscription(c *gin.Context) {
	userId := c.GetInt("id")
	_ = model.CheckExpiredPackagesSubscriptions()

	var subscription model.PackagesSubscription
	subscriptions, err := model.GetUserActivePackagesSubscriptions(userId, subscription, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "未找到有效订阅",
			"data":    nil,
		})
		return
	}

	planTypes := make(map[string]string)
	var plans []*model.PackagesPlan
	for _, sub := range subscriptions {
		planTypes[sub.PlanType] = sub.PlanType
	}
	for _, planType := range planTypes {
		plan, err := model.GetPackagesPlanByTypeAny(planType)
		if err != nil {
			continue
		}
		newPlan := &model.PackagesPlan{
			Description:    plan.Description,
			Type:           plan.Type,
			HashId:         plan.HashId,
			Name:           plan.Name,
			DeductionGroup: plan.DeductionGroup,
		}
		plans = append(plans, newPlan)
	}

	var newSubscriptions []*GetPackagesSubscriptionResponse
	for i := range subscriptions {
		sub := &subscriptions[i]
		subscription := &GetPackagesSubscriptionResponse{
			PackagesSubscription: sub,
		}
		for _, plan := range plans {
			if plan.Type == sub.PlanType {
				subscription.PackagePlan = plan
				break
			}
		}
		newSubscriptions = append(newSubscriptions, subscription)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    newSubscriptions,
	})
}

type ResetPackagesSubscriptionRequest struct {
	HashId string `json:"hash_id" binding:"required"`
}

// ResetPackagesSubscription 重置订阅今日额度
func ResetPackagesSubscription(c *gin.Context) {
	userId := c.GetInt("id")
	_ = model.CheckExpiredPackagesSubscriptions()

	var req ResetPackagesSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	subscription, err := model.ResetPackagesSubscriptionDailyQuota(userId, req.HashId)
	if err != nil {
		msg := "重置失败"
		switch err.Error() {
		case "subscription_inactive":
			msg = "订阅当前不可重置"
		case "reset_not_allowed":
			msg = "该订阅不支持重置"
		case "reset_limit_reached":
			msg = "已达到可重置次数上限"
		}
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": msg,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "额度已重置",
		"data":    subscription,
	})
}

// PurchaseSubscriptionRequest 购买订阅请求结构
// payment_method: balance
// plan_type: 套餐类型
// hash_id: 套餐 hash_id
// payment_method 为空默认 balance
type PurchaseSubscriptionRequest struct {
	PlanType      string `json:"plan_type" binding:"required"`
	HashId        string `json:"hash_id" binding:"required"`
	PaymentMethod string `json:"payment_method"`
}

// PurchasePackagesSubscription 购买订阅
func PurchasePackagesSubscription(c *gin.Context) {
	userId := c.GetInt("id")
	_ = model.CheckExpiredPackagesSubscriptions()

	var req PurchaseSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	plan, err := model.GetPackagesPlanByType(req.PlanType)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐不存在",
		})
		return
	}
	if req.HashId != "" && plan.HashId != "" && req.HashId != plan.HashId {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐信息已更新，请刷新后重试",
		})
		return
	}
	if !plan.ShowInPortal {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该套餐不可购买",
		})
		return
	}

	user, err := model.GetUserById(userId, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "用户不存在",
		})
		return
	}

	paymentMethod := req.PaymentMethod
	if paymentMethod == "" {
		paymentMethod = "balance"
	}

	if paymentMethod == "balance" {
		costQuota := int(math.Round(plan.Price * common.QuotaPerUnit))
		if costQuota < 0 {
			costQuota = 0
		}
		if costQuota > 0 && user.Quota < costQuota {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "余额不足，请先充值",
			})
			return
		}

		if costQuota > 0 {
			if err := model.DecreaseUserQuota(userId, costQuota); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "扣款失败，请稍后重试",
				})
				return
			}
		}

		subscription, _, err := model.GrantPlanToUser(userId, plan, "balance", false)
		if err != nil {
			if costQuota > 0 {
				_ = model.IncreaseUserQuota(userId, costQuota, false)
			}
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "订阅激活失败，请稍后重试",
			})
			return
		}

		if costQuota > 0 {
			otherParam := map[string]interface{}{
				"RequestIp": c.ClientIP(),
			}
			model.RecordLog(userId, model.LogTypeConsume, fmt.Sprintf("使用余额购买套餐：%s", plan.Name), otherParam)
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "订阅已使用余额支付并激活",
			"data":    subscription,
		})
		return
	}

	orderId := fmt.Sprintf("pkg_%d_%d", userId, time.Now().Unix())
	paymentURL := "/console/subscriptions?success=true"

	now := common.GetTimestamp()
	var endTime int64
	if plan.IsUnlimitedTime {
		endTime = now + 100*365*24*60*60
	} else {
		durationSeconds := plan.DurationSeconds()
		if durationSeconds <= 0 {
			durationSeconds = 30 * 24 * 60 * 60
		}
		endTime = now + durationSeconds
	}

	subscription := &model.PackagesSubscription{
		UserId:         userId,
		PlanType:       plan.Type,
		Status:         "pending",
		StartTime:      now,
		EndTime:        endTime,
		TotalQuota:     plan.TotalQuota,
		RemainQuota:    plan.TotalQuota,
		UsedQuota:      0,
		MaxClientCount: plan.MaxClientCount,
		Price:          plan.Price,
		Currency:       plan.Currency,
		PaymentMethod:  paymentMethod,
		OrderId:        orderId,
		HashId:         common.GetUUID(),
	}
	model.ApplyPlanLimitsToSubscription(subscription, plan)

	if err := model.CreatePackagesSubscription(subscription); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建订阅记录失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"message":     "订单创建成功，请完成支付",
		"data":        subscription,
		"payment_url": paymentURL,
		"order_id":    orderId,
	})
}

// GetPackagesUsageStats 获取使用统计
func GetPackagesUsageStats(c *gin.Context) {
	userId := c.GetInt("id")

	startTimeStr := c.DefaultQuery("start_time", "0")
	endTimeStr := c.DefaultQuery("end_time", strconv.FormatInt(common.GetTimestamp(), 10))

	startTime, _ := strconv.ParseInt(startTimeStr, 10, 64)
	endTime, _ := strconv.ParseInt(endTimeStr, 10, 64)

	if startTime == 0 {
		startTime = common.GetTimestamp() - 30*24*60*60
	}

	stats, err := model.GetPackagesUsageStats(userId, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取统计数据失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

type CancelSubscriptionRequest struct {
	HashId string `json:"hash_id" binding:"required"`
}

// CancelPackagesSubscription 取消订阅
func CancelPackagesSubscription(c *gin.Context) {
	userId := c.GetInt("id")
	_ = model.CheckExpiredPackagesSubscriptions()

	var req CancelSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	subscription, err := model.GetUserActivePackagesSubscriptionByHashId(userId, req.HashId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "未找到有效订阅",
		})
		return
	}
	if subscription.Status != "active" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "订阅当前状态不可取消",
		})
		return
	}

	subscription.Status = "cancelled"
	subscription.AutoRenew = false

	if err := model.UpdatePackagesSubscription(subscription); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "取消订阅失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "订阅已取消",
	})
}

// GetAllPackagesSubscriptions 管理员获取所有订阅
func GetAllPackagesSubscriptions(c *gin.Context) {
	if c.GetInt("role") < common.RoleAdminUser {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		return
	}
	_ = model.CheckExpiredPackagesSubscriptions()

	pageStr := c.DefaultQuery("page", "")
	if pageStr == "" {
		pageStr = c.DefaultQuery("p", "1")
	}
	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	filters := map[string]interface{}{}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if planType := c.Query("plan_type"); planType != "" {
		filters["plan_type"] = planType
	}
	if userIdStr := c.Query("user_id"); userIdStr != "" {
		if userId, err := strconv.Atoi(userIdStr); err == nil {
			filters["user_id"] = userId
		}
	}

	subscriptions, total, err := model.GetPackagesSubscriptions(page, pageSize, filters)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "查询失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"subscriptions": subscriptions,
			"total":         total,
			"page":          page,
			"page_size":     pageSize,
		},
	})
}

type UpdateResetLimitRequest struct {
	ResetQuotaLimit int `json:"reset_quota_limit" binding:"required"`
}

// AdminUpdatePackagesSubscriptionResetLimit 更新订阅重置次数
func AdminUpdatePackagesSubscriptionResetLimit(c *gin.Context) {
	if c.GetInt("role") < common.RoleAdminUser {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		return
	}

	subscriptionId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "订阅ID错误",
		})
		return
	}

	var req UpdateResetLimitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	subscription, err := model.UpdatePackagesSubscriptionResetLimit(subscriptionId, req.ResetQuotaLimit)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "更新重置次数失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "更新成功",
		"data":    subscription,
	})
}

// AdminGrantSubscriptionRequest 管理员手动发放套餐请求
// allow_stack: 是否叠加
type AdminGrantSubscriptionRequest struct {
	UserId     int    `json:"user_id" binding:"required"`
	PlanType   string `json:"plan_type" binding:"required"`
	AllowStack bool   `json:"allow_stack"`
}

// AdminGrantPackagesSubscription 管理员手动发放套餐
func AdminGrantPackagesSubscription(c *gin.Context) {
	if c.GetInt("role") < common.RoleAdminUser {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		return
	}

	var req AdminGrantSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "请求参数错误: " + err.Error(),
		})
		return
	}

	_, err := model.GetUserById(req.UserId, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "用户不存在",
		})
		return
	}

	plan, err := model.GetPackagesPlanByTypeAny(req.PlanType)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐不存在",
		})
		return
	}

	subscription, _, err := model.GrantPlanToUser(req.UserId, plan, "admin_grant", req.AllowStack)
	if err != nil {
		common.SysError("管理员发放套餐失败: " + err.Error())
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "发放套餐失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "套餐发放成功",
		"data":    subscription,
	})
}

// AdminSearchUsers 管理员搜索用户
func AdminSearchUsers(c *gin.Context) {
	keyword := c.Query("keyword")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	users, total, err := model.SearchPackagesUsers(keyword, page, pageSize)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "搜索用户失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"users":     users,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// AdminCancelPackagesSubscription 管理员取消用户订阅
func AdminCancelPackagesSubscription(c *gin.Context) {
	subscriptionId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "订阅ID错误",
		})
		return
	}

	subscription, err := model.GetPackagesSubscriptionById(subscriptionId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "订阅不存在",
		})
		return
	}

	subscription.Status = "cancelled"
	subscription.UpdatedTime = common.GetTimestamp()

	if err := model.UpdatePackagesSubscription(subscription); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "取消订阅失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "订阅已取消",
	})
}

// CreatePlanRequest 创建套餐请求
type CreatePlanRequest struct {
	Name                string                 `json:"name" binding:"required"`
	Type                string                 `json:"type" binding:"required"`
	Description         string                 `json:"description"`
	Price               *float64               `json:"price" binding:"required"`
	Currency            string                 `json:"currency"`
	TotalQuota          int64                  `json:"total_quota" binding:"required"`
	MaxClientCount      int                    `json:"max_client_count"`
	IsUnlimitedTime     bool                   `json:"is_unlimited_time"`
	DurationMonths      int                    `json:"duration_months"`
	DurationUnit        string                 `json:"duration_unit"`
	DurationValue       int                    `json:"duration_value"`
	Features            map[string]interface{} `json:"features"`
	IsActive            bool                   `json:"is_active"`
	SortOrder           int                    `json:"sort_order"`
	ShowInPortal        bool                   `json:"show_in_portal"`
	DailyQuotaPerPlan   int                    `json:"daily_quota_per_plan"`
	WeeklyQuotaPerPlan  int                    `json:"weekly_quota_per_plan"`
	MonthlyQuotaPerPlan int                    `json:"monthly_quota_per_plan"`
	ResetQuotaLimit     *int                   `json:"reset_quota_limit"`
	DeductionGroup      string                 `json:"deduction_group"`
}

// UpdatePlanRequest 更新套餐请求
type UpdatePlanRequest struct {
	Name                string                 `json:"name"`
	Description         string                 `json:"description"`
	Price               *float64               `json:"price"`
	Currency            string                 `json:"currency"`
	MaxClientCount      int                    `json:"max_client_count"`
	IsUnlimitedTime     *bool                  `json:"is_unlimited_time"`
	DurationMonths      int                    `json:"duration_months"`
	DurationUnit        string                 `json:"duration_unit"`
	DurationValue       int                    `json:"duration_value"`
	Features            map[string]interface{} `json:"features"`
	IsActive            *bool                  `json:"is_active"`
	SortOrder           int                    `json:"sort_order"`
	TotalQuota          int64                  `json:"total_quota"`
	ShowInPortal        *bool                  `json:"show_in_portal"`
	DailyQuotaPerPlan   *int64                 `json:"daily_quota_per_plan"`
	WeeklyQuotaPerPlan  *int64                 `json:"weekly_quota_per_plan"`
	MonthlyQuotaPerPlan *int64                 `json:"monthly_quota_per_plan"`
	ResetQuotaLimit     *int                   `json:"reset_quota_limit"`
	DeductionGroup      *string                `json:"deduction_group"`
}

// CreatePackagesPlan 创建套餐
func CreatePackagesPlan(c *gin.Context) {
	if c.GetInt("role") < common.RoleAdminUser {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		return
	}

	var req CreatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	existingPlan, _ := model.GetPackagesPlanByTypeAny(req.Type)
	if existingPlan != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐类型已存在",
		})
		return
	}

	if req.Currency == "" {
		req.Currency = "USD"
	}
	if req.MaxClientCount == 0 {
		req.MaxClientCount = 1
	}
	if req.Price != nil && *req.Price < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "价格不能为负数",
		})
		return
	}
	if req.DailyQuotaPerPlan < 0 || req.WeeklyQuotaPerPlan < 0 || req.MonthlyQuotaPerPlan < 0 ||
		(req.ResetQuotaLimit != nil && *req.ResetQuotaLimit < 0) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "限额不能为负数",
		})
		return
	}

	durationUnit := model.DurationUnitMonth
	if req.DurationUnit != "" {
		if !model.IsSupportedDurationUnit(req.DurationUnit) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "不支持的订阅时长单位",
			})
			return
		}
		durationUnit = model.NormalizeDurationUnit(req.DurationUnit)
	}
	durationValue := req.DurationValue
	if req.IsUnlimitedTime {
		req.DurationMonths = 0
		durationValue = 0
	} else {
		if durationValue <= 0 {
			if req.DurationMonths > 0 {
				durationValue = req.DurationMonths
			} else {
				durationValue = 1
			}
		}
		switch durationUnit {
		case model.DurationUnitMonth:
			req.DurationMonths = durationValue
		case model.DurationUnitQuarter:
			req.DurationMonths = durationValue * 3
		default:
			if req.DurationMonths == 0 {
				req.DurationMonths = durationValue
			}
		}
	}

	priceValue := 0.0
	if req.Price != nil {
		priceValue = *req.Price
	}
	if priceValue < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "价格不能为负数",
		})
		return
	}

	resetQuotaLimit := 1
	if req.ResetQuotaLimit != nil {
		resetQuotaLimit = *req.ResetQuotaLimit
	}

	now := common.GetTimestamp()
	plan := &model.PackagesPlan{
		Name:                req.Name,
		Type:                req.Type,
		Description:         req.Description,
		Price:               priceValue,
		Currency:            req.Currency,
		TotalQuota:          int(req.TotalQuota),
		MaxClientCount:      req.MaxClientCount,
		IsUnlimitedTime:     req.IsUnlimitedTime,
		DurationMonths:      req.DurationMonths,
		DurationUnit:        durationUnit,
		DurationValue:       durationValue,
		Features:            model.JSONValue(nil),
		IsActive:            req.IsActive,
		ShowInPortal:        req.ShowInPortal,
		SortOrder:           req.SortOrder,
		CreatedTime:         now,
		UpdatedTime:         now,
		HashId:              common.GetUUID(),
		DailyQuotaPerPlan:   req.DailyQuotaPerPlan,
		WeeklyQuotaPerPlan:  req.WeeklyQuotaPerPlan,
		MonthlyQuotaPerPlan: req.MonthlyQuotaPerPlan,
		ResetQuotaLimit:     resetQuotaLimit,
		DeductionGroup:      model.NormalizeDeductionGroups(req.DeductionGroup),
	}

	if err := model.CreatePackagesPlan(plan); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建套餐失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "套餐创建成功",
		"data":    plan,
	})
}

// UpdatePackagesPlan 更新套餐
func UpdatePackagesPlan(c *gin.Context) {
	if c.GetInt("role") < common.RoleAdminUser {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		return
	}

	planId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的套餐ID",
		})
		return
	}

	var req UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	plan, err := model.GetPackagesPlanById(planId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐不存在",
		})
		return
	}

	if req.DailyQuotaPerPlan != nil && *req.DailyQuotaPerPlan < 0 ||
		req.WeeklyQuotaPerPlan != nil && *req.WeeklyQuotaPerPlan < 0 ||
		req.MonthlyQuotaPerPlan != nil && *req.MonthlyQuotaPerPlan < 0 ||
		req.ResetQuotaLimit != nil && *req.ResetQuotaLimit < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "限额不能为负数",
		})
		return
	}

	if req.Name != "" {
		plan.Name = req.Name
	}
	if req.Description != "" {
		plan.Description = req.Description
	}
	if req.Price != nil {
		if *req.Price < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "价格不能为负数",
			})
			return
		}
		plan.Price = *req.Price
	}
	if req.Currency != "" {
		plan.Currency = req.Currency
	}
	if req.MaxClientCount > 0 {
		plan.MaxClientCount = req.MaxClientCount
	}
	if req.IsUnlimitedTime != nil {
		plan.IsUnlimitedTime = *req.IsUnlimitedTime
	}
	updatedDurationUnit := plan.DurationUnit
	if req.DurationUnit != "" {
		if !model.IsSupportedDurationUnit(req.DurationUnit) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "不支持的订阅时长单位",
			})
			return
		}
		updatedDurationUnit = model.NormalizeDurationUnit(req.DurationUnit)
	}
	updatedDurationValue := plan.DurationValue
	if req.DurationValue > 0 {
		updatedDurationValue = req.DurationValue
	}
	updatedDurationMonths := plan.DurationMonths
	if req.DurationMonths > 0 {
		updatedDurationMonths = req.DurationMonths
		if updatedDurationUnit == model.DurationUnitMonth {
			updatedDurationValue = req.DurationMonths
		} else if updatedDurationUnit == model.DurationUnitQuarter {
			updatedDurationValue = req.DurationMonths / 3
			if updatedDurationValue == 0 {
				updatedDurationValue = 1
			}
		}
	}
	if plan.IsUnlimitedTime {
		updatedDurationMonths = 0
		updatedDurationValue = 0
	} else {
		switch updatedDurationUnit {
		case model.DurationUnitMonth:
			updatedDurationMonths = updatedDurationValue
		case model.DurationUnitQuarter:
			updatedDurationMonths = updatedDurationValue * 3
		}
		if updatedDurationValue <= 0 {
			updatedDurationValue = 1
			if updatedDurationMonths == 0 {
				updatedDurationMonths = 1
			}
		}
	}
	plan.DurationUnit = updatedDurationUnit
	plan.DurationValue = updatedDurationValue
	plan.DurationMonths = updatedDurationMonths
	if req.TotalQuota > 0 {
		plan.TotalQuota = int(req.TotalQuota)
	}
	if req.DailyQuotaPerPlan != nil {
		plan.DailyQuotaPerPlan = int(*req.DailyQuotaPerPlan)
	}
	if req.WeeklyQuotaPerPlan != nil {
		plan.WeeklyQuotaPerPlan = int(*req.WeeklyQuotaPerPlan)
	}
	if req.MonthlyQuotaPerPlan != nil {
		plan.MonthlyQuotaPerPlan = int(*req.MonthlyQuotaPerPlan)
	}
	if req.ResetQuotaLimit != nil {
		plan.ResetQuotaLimit = *req.ResetQuotaLimit
	}
	if req.DeductionGroup != nil {
		plan.DeductionGroup = model.NormalizeDeductionGroups(*req.DeductionGroup)
	}
	if req.IsActive != nil {
		plan.IsActive = *req.IsActive
	}
	if req.ShowInPortal != nil {
		plan.ShowInPortal = *req.ShowInPortal
	}
	plan.SortOrder = req.SortOrder
	plan.UpdatedTime = common.GetTimestamp()
	if plan.HashId == "" {
		plan.HashId = common.GetUUID()
	}

	if err := model.UpdatePackagesPlan(plan); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "更新套餐失败",
		})
		return
	}

	if err := model.UpdatePackagesSubscriptionsByPlan(plan); err != nil {
		common.SysError("更新套餐关联订阅失败: " + err.Error())
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "套餐更新成功",
		"data":    plan,
	})
}

// DeletePackagesPlan 删除套餐
func DeletePackagesPlan(c *gin.Context) {
	if c.GetInt("role") < common.RoleAdminUser {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		return
	}

	planId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的套餐ID",
		})
		return
	}

	hasSubscriptions, err := model.CheckPackagesPlanHasSubscriptions(planId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "检查套餐关联失败",
		})
		return
	}

	if hasSubscriptions {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该套餐有关联的订阅，无法删除",
		})
		return
	}

	if err := model.DeletePackagesPlan(planId); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "删除套餐失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "套餐删除成功",
	})
}

// GetPackagesPlanById 获取套餐详情
func GetPackagesPlanById(c *gin.Context) {
	if c.GetInt("role") < common.RoleAdminUser {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "权限不足",
		})
		return
	}

	planId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的套餐ID",
		})
		return
	}

	plan, err := model.GetPackagesPlanById(planId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    plan,
	})
}
