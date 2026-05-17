package controller

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/checkout/session"
	"github.com/thanhpk/randstr"
)

// ---- Request types ----

type RenewBalancePayRequest struct {
	UserSubscriptionId int `json:"user_subscription_id"`
}

type RenewStripePayRequest struct {
	UserSubscriptionId int `json:"user_subscription_id"`
}

type RenewCreemPayRequest struct {
	UserSubscriptionId int `json:"user_subscription_id"`
}

// ---- Balance renewal ----

func SubscriptionRequestRenewBalancePay(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}

	var req RenewBalancePayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.UserSubscriptionId <= 0 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	userId := c.GetInt("id")

	// Verify subscription exists and belongs to user
	var sub model.UserSubscription
	if err := model.DB.Where("id = ? AND user_id = ?", req.UserSubscriptionId, userId).First(&sub).Error; err != nil {
		common.ApiErrorMsg(c, "订阅不存在")
		return
	}

	// Get plan (use latest config)
	plan, err := model.GetSubscriptionPlanById(sub.PlanId)
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

	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if user == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}

	// Convert plan price (USD) into quota units
	dCost := decimal.NewFromFloat(plan.PriceAmount).Mul(decimal.NewFromFloat(common.QuotaPerUnit)).Round(0)
	costQuota := int(dCost.IntPart())
	if costQuota < 0 {
		costQuota = 0
	}
	if costQuota > 0 && user.Quota < costQuota {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "余额不足，请先充值"})
		return
	}

	tradeNo := fmt.Sprintf("RENEWBAL%d%s%d", userId, common.GetRandomString(6), time.Now().Unix())

	providerPayload := common.GetJsonString(map[string]any{
		"renew":                true,
		"user_subscription_id": req.UserSubscriptionId,
		"payment_method":       "balance",
		"cost_quota":           costQuota,
	})

	order := &model.SubscriptionOrder{
		UserId:          userId,
		PlanId:          plan.Id,
		Money:           plan.PriceAmount,
		TradeNo:         tradeNo,
		PaymentMethod:   "balance",
		PaymentProvider: "balance",
		ProviderPayload: providerPayload,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		common.ApiErrorMsg(c, fmt.Sprintf("创建订单失败: %s", err))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	if costQuota > 0 {
		if err := model.DecreaseUserQuota(userId, costQuota, false); err != nil {
			_ = model.ExpireSubscriptionOrder(tradeNo, order.PaymentMethod)
			c.JSON(http.StatusOK, gin.H{"message": "error", "data": "扣款失败，请稍后重试"})
			return
		}
	}

	if err := model.CompleteRenewalOrder(tradeNo, providerPayload, order.PaymentProvider, "balance", c.ClientIP()); err != nil {
		if costQuota > 0 {
			_ = model.IncreaseUserQuota(userId, costQuota, false)
		}
		_ = model.ExpireSubscriptionOrder(tradeNo, order.PaymentMethod)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "订阅续费失败，请稍后重试"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"order_id": tradeNo,
		},
	})
}

// ---- Stripe renewal ----

func SubscriptionRequestRenewStripePay(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}

	var req RenewStripePayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.UserSubscriptionId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	userId := c.GetInt("id")

	// Verify subscription
	var sub model.UserSubscription
	if err := model.DB.Where("id = ? AND user_id = ?", req.UserSubscriptionId, userId).First(&sub).Error; err != nil {
		common.ApiErrorMsg(c, "订阅不存在")
		return
	}

	// Get plan
	plan, err := model.GetSubscriptionPlanById(sub.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return
	}
	if plan.StripePriceId == "" {
		common.ApiErrorMsg(c, "该套餐未配置 StripePriceId")
		return
	}
	if !strings.HasPrefix(setting.StripeApiSecret, "sk_") && !strings.HasPrefix(setting.StripeApiSecret, "rk_") {
		common.ApiErrorMsg(c, "Stripe 未配置或密钥无效")
		return
	}
	if setting.StripeWebhookSecret == "" {
		common.ApiErrorMsg(c, "Stripe Webhook 未配置")
		return
	}

	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if user == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}

	reference := fmt.Sprintf("renew-stripe-ref-%d-%d-%d-%s", userId, req.UserSubscriptionId, time.Now().UnixMilli(), randstr.String(4))
	referenceId := "renew_ref_" + common.Sha1([]byte(reference))

	providerPayload := common.GetJsonString(map[string]any{
		"renew":                true,
		"user_subscription_id": req.UserSubscriptionId,
	})

	order := &model.SubscriptionOrder{
		UserId:          userId,
		PlanId:          plan.Id,
		Money:           plan.PriceAmount,
		TradeNo:         referenceId,
		PaymentMethod:   model.PaymentMethodStripe,
		PaymentProvider: model.PaymentProviderStripe,
		ProviderPayload: providerPayload,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	payLink, err := genStripeRenewalLink(referenceId, user.StripeCustomer, user.Email, plan.StripePriceId)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 续费支付链接创建失败 trade_no=%s plan_id=%d error=%q", referenceId, plan.Id, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link": payLink,
		},
	})
}

func genStripeRenewalLink(referenceId string, customerId string, email string, priceId string) (string, error) {
	stripe.Key = setting.StripeApiSecret

	params := &stripe.CheckoutSessionParams{
		ClientReferenceID: stripe.String(referenceId),
		SuccessURL:        stripe.String(paymentReturnPath("/console/topup")),
		CancelURL:         stripe.String(paymentReturnPath("/console/topup")),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceId),
				Quantity: stripe.Int64(1),
			},
		},
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
	}

	if customerId == "" {
		if email != "" {
			params.CustomerEmail = stripe.String(email)
		}
		params.CustomerCreation = stripe.String(string(stripe.CheckoutSessionCustomerCreationAlways))
	} else {
		params.Customer = stripe.String(customerId)
	}

	result, err := session.New(params)
	if err != nil {
		return "", err
	}
	return result.URL, nil
}

// ---- Creem renewal ----

func SubscriptionRequestRenewCreemPay(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}

	var req RenewCreemPayRequest
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Creem 续费支付请求读取失败 error=%q", err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "read query error"})
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(bodyBytes))

	if err := c.ShouldBindJSON(&req); err != nil || req.UserSubscriptionId <= 0 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	userId := c.GetInt("id")

	// Verify subscription
	var sub model.UserSubscription
	if err := model.DB.Where("id = ? AND user_id = ?", req.UserSubscriptionId, userId).First(&sub).Error; err != nil {
		common.ApiErrorMsg(c, "订阅不存在")
		return
	}

	// Get plan
	plan, err := model.GetSubscriptionPlanById(sub.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return
	}
	if plan.CreemProductId == "" {
		common.ApiErrorMsg(c, "该套餐未配置 CreemProductId")
		return
	}
	if setting.CreemWebhookSecret == "" && !setting.CreemTestMode {
		common.ApiErrorMsg(c, "Creem Webhook 未配置")
		return
	}

	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if user == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}

	reference := "renew-creem-ref-" + randstr.String(6)
	referenceId := "renew_ref_" + common.Sha1([]byte(reference+time.Now().String()+user.Username))

	providerPayload := common.GetJsonString(map[string]any{
		"renew":                true,
		"user_subscription_id": req.UserSubscriptionId,
	})

	order := &model.SubscriptionOrder{
		UserId:          userId,
		PlanId:          plan.Id,
		Money:           plan.PriceAmount,
		TradeNo:         referenceId,
		PaymentMethod:   model.PaymentMethodCreem,
		PaymentProvider: model.PaymentProviderCreem,
		ProviderPayload: providerPayload,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	currency := "USD"
	switch operation_setting.GetGeneralSetting().QuotaDisplayType {
	case operation_setting.QuotaDisplayTypeCNY:
		currency = "CNY"
	case operation_setting.QuotaDisplayTypeUSD:
		currency = "USD"
	default:
		currency = "USD"
	}
	product := &CreemProduct{
		ProductId: plan.CreemProductId,
		Name:      plan.Title,
		Price:     plan.PriceAmount,
		Currency:  currency,
		Quota:     0,
	}

	checkoutUrl, err := genCreemLink(c.Request.Context(), referenceId, product, user.Email, user.Username)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Creem 续费支付链接创建失败 trade_no=%s product_id=%s error=%q", referenceId, product.ProductId, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"checkout_url": checkoutUrl,
			"order_id":     referenceId,
		},
	})
}
