package controller

import (
	"fmt"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// UserActivateScheduledSubscription lets the owning user flip a scheduled
// renewal into the active state immediately. The pre-existing active
// subscription is intentionally left untouched: it continues to serve traffic
// in parallel until its natural end_time, at which point only the new
// subscription remains. This matches the no-refund policy — paying for a
// renewal must never void any portion of an already-paid subscription.
func UserActivateScheduledSubscription(c *gin.Context) {
	userId := c.GetInt("id")
	subId, _ := strconv.Atoi(c.Param("id"))
	if subId <= 0 {
		common.ApiErrorMsg(c, "无效的订阅ID")
		return
	}

	sub, err := model.UserActivateScheduledSubscription(userId, subId)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}

	info, _ := model.GetSubscriptionPlanInfoByUserSubscriptionId(sub.Id)
	planTitle := ""
	if info != nil {
		planTitle = info.PlanTitle
	}
	msg := fmt.Sprintf("订阅立即生效，套餐: %s，订阅ID: %d，到期时间: %d",
		planTitle, sub.Id, sub.EndTime)
	model.RecordLog(userId, model.LogTypeSubscriptionPay, msg, map[string]interface{}{
		"RequestIp": c.ClientIP(),
	})

	common.ApiSuccess(c, gin.H{
		"user_subscription_id": sub.Id,
		"start_time":           sub.StartTime,
		"end_time":             sub.EndTime,
		"plan_id":              sub.PlanId,
		"plan_title":           planTitle,
	})
}

// AdminActivateScheduledSubscription is the admin-tooling counterpart of
// UserActivateScheduledSubscription. It bypasses the owner check so support
// staff can promote a pending renewal on behalf of any user.
func AdminActivateScheduledSubscription(c *gin.Context) {
	subId, _ := strconv.Atoi(c.Param("id"))
	if subId <= 0 {
		common.ApiErrorMsg(c, "无效的订阅ID")
		return
	}

	sub, err := model.AdminActivateScheduledSubscription(subId)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}

	info, _ := model.GetSubscriptionPlanInfoByUserSubscriptionId(sub.Id)
	planTitle := ""
	if info != nil {
		planTitle = info.PlanTitle
	}
	adminInfo := map[string]interface{}{
		"admin_id":             c.GetInt("id"),
		"caller_ip":            c.ClientIP(),
		"user_subscription_id": sub.Id,
		"plan_id":              sub.PlanId,
		"start_time":           sub.StartTime,
		"end_time":             sub.EndTime,
	}
	model.RecordLogWithAdminInfo(sub.UserId, model.LogTypeManage,
		fmt.Sprintf("管理员立即激活待生效订阅，套餐: %s，订阅ID: %d，到期时间: %d",
			planTitle, sub.Id, sub.EndTime),
		adminInfo,
	)

	common.ApiSuccess(c, gin.H{
		"user_subscription_id": sub.Id,
		"user_id":              sub.UserId,
		"plan_id":              sub.PlanId,
		"plan_title":           planTitle,
		"start_time":           sub.StartTime,
		"end_time":             sub.EndTime,
	})
}
