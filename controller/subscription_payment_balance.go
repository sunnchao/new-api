package controller

import (
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const (
	PaymentMethodBalance = "balance"
)

type SubscriptionBalancePayRequest struct {
	PlanId int `json:"plan_id"`
}

// SubscriptionRequestBalancePay purchases a subscription plan using the user's quota balance.
// It deducts quota synchronously and completes the subscription order immediately.
func SubscriptionRequestBalancePay(c *gin.Context) {
	var req SubscriptionBalancePayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		c.JSON(200, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	plan, err := model.GetSubscriptionPlanById(req.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return
	}
	if plan.PriceAmount < 0 {
		common.ApiErrorMsg(c, "套餐金额错误")
		return
	}

	userId := c.GetInt("id")
	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if user == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}

	// Enforce per-user purchase limit (same behavior as other payment methods).
	if plan.MaxPurchasePerUser > 0 {
		count, err := model.CountUserSubscriptionsByPlan(userId, plan.Id)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			common.ApiErrorMsg(c, "已达到该套餐购买上限")
			return
		}
	}

	// Convert plan money amount (USD) into quota units.
	dCost := decimal.NewFromFloat(plan.PriceAmount).Mul(decimal.NewFromFloat(common.QuotaPerUnit)).Round(0)
	costQuota := int(dCost.IntPart())
	if costQuota < 0 {
		costQuota = 0
	}
	if costQuota > 0 && user.Quota < costQuota {
		c.JSON(200, gin.H{"message": "error", "data": "余额不足，请先充值"})
		return
	}

	tradeNo := fmt.Sprintf("%s%d", common.GetRandomString(6), time.Now().Unix())
	tradeNo = fmt.Sprintf("SUBBALUSR%dNO%s", userId, tradeNo)

	// Create pending order first, then deduct quota, then complete (idempotent).
	order := &model.SubscriptionOrder{
		UserId:        userId,
		PlanId:        plan.Id,
		Money:         plan.PriceAmount,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodBalance,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		c.JSON(200, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	if costQuota > 0 {
		if err := model.DecreaseUserQuota(userId, costQuota); err != nil {
			_ = model.ExpireSubscriptionOrder(tradeNo)
			c.JSON(200, gin.H{"message": "error", "data": "扣款失败，请稍后重试"})
			return
		}
	}

	providerPayload := common.GetJsonString(map[string]any{
		"payment_method": PaymentMethodBalance,
		"cost_quota":     costQuota,
	})
	if err := model.CompleteSubscriptionOrder(tradeNo, providerPayload, c.ClientIP()); err != nil {
		if costQuota > 0 {
			_ = model.IncreaseUserQuota(userId, costQuota, false)
		}
		_ = model.ExpireSubscriptionOrder(tradeNo)
		c.JSON(200, gin.H{"message": "error", "data": "订阅激活失败，请稍后重试"})
		return
	}

	c.JSON(200, gin.H{
		"message": "success",
		"data": gin.H{
			"order_id": tradeNo,
		},
	})
}
