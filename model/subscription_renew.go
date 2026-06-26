package model

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

// CompleteRenewalOrder completes a subscription renewal order.
// It extends the existing UserSubscription's validity and accumulates quota.
func CompleteRenewalOrder(tradeNo string, providerPayload string, expectedPaymentProvider string, actualPaymentMethod string, clientIP string) error {
	if tradeNo == "" {
		return errors.New("tradeNo is empty")
	}
	refCol := "`trade_no`"
	if common.UsingMainDatabase(common.DatabaseTypePostgreSQL) {
		refCol = `"trade_no"`
	}

	var logUserId int
	var logPlanTitle string
	var logMoney float64
	var logPaymentMethod string

	err := DB.Transaction(func(tx *gorm.DB) error {
		var order SubscriptionOrder
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where(refCol+" = ?", tradeNo).First(&order).Error; err != nil {
			return ErrSubscriptionOrderNotFound
		}
		if expectedPaymentProvider != "" && order.PaymentProvider != expectedPaymentProvider {
			return ErrPaymentMethodMismatch
		}
		if order.Status == common.TopUpStatusSuccess {
			return nil
		}
		if order.Status != common.TopUpStatusPending {
			return ErrSubscriptionOrderStatusInvalid
		}

		// Parse renewal metadata from ProviderPayload
		var renewMeta struct {
			Renew              bool `json:"renew"`
			UserSubscriptionId int  `json:"user_subscription_id"`
		}
		if err := common.Unmarshal([]byte(order.ProviderPayload), &renewMeta); err != nil || !renewMeta.Renew || renewMeta.UserSubscriptionId <= 0 {
			return errors.New("invalid renewal order metadata")
		}

		// Get the existing subscription
		var sub UserSubscription
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ? AND user_id = ?", renewMeta.UserSubscriptionId, order.UserId).First(&sub).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("subscription not found")
			}
			return err
		}
		if !IsUserSubscriptionActive(&sub, GetDBTimestamp()) {
			return errors.New("subscription is not active")
		}

		// Verify the subscription's plan matches the order's plan
		if sub.PlanId != order.PlanId {
			return errors.New("subscription plan mismatch")
		}

		// Get the plan (use latest plan config for renewal)
		plan, err := getLatestSubscriptionPlanForRenewalTx(tx, order.PlanId)
		if err != nil {
			return err
		}

		nowUnix := GetDBTimestamp()

		// Create a scheduled subscription instead of mutating the current one.
		// The new subscription becomes active either automatically when the
		// existing subscription's end_time arrives or when the user manually
		// activates it. The existing subscription is left untouched so the user
		// keeps every minute they already paid for (subscriptions are
		// non-refundable).
		if _, err := CreateScheduledSubscriptionTx(tx, sub.UserId, plan, sub.EndTime, "order"); err != nil {
			return err
		}

		// Record top-up for billing history (same as normal subscription)
		if strings.TrimSpace(order.PaymentMethod) != "balance" {
			if err := upsertSubscriptionTopUpTx(tx, &order); err != nil {
				return err
			}
		}

		// Update order status
		order.Status = common.TopUpStatusSuccess
		order.CompleteTime = nowUnix
		if providerPayload != "" {
			order.ProviderPayload = providerPayload
		}
		if actualPaymentMethod != "" && order.PaymentMethod != actualPaymentMethod {
			order.PaymentMethod = actualPaymentMethod
		}
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		logUserId = order.UserId
		logPlanTitle = plan.Title
		logMoney = order.Money
		logPaymentMethod = order.PaymentMethod
		return nil
	})
	if err != nil {
		return err
	}

	if logUserId > 0 {
		msg := fmt.Sprintf("订阅续费成功，已创建待生效订阅，套餐: %s，支付金额: %.2f，支付方式: %s", logPlanTitle, logMoney, logPaymentMethod)
		otherParam := map[string]interface{}{
			"RequestIp": clientIP,
		}
		RecordLog(logUserId, LogTypeSubscriptionPay, msg, otherParam)
	}
	return nil
}

type AdminRenewSubscriptionResult struct {
	UserSubscriptionId int    `json:"user_subscription_id"`
	UserId             int    `json:"user_id"`
	PlanId             int    `json:"plan_id"`
	PlanTitle          string `json:"plan_title"`
	OldEndTime         int64  `json:"old_end_time"`
	NewEndTime         int64  `json:"new_end_time"`
}

func AdminRenewUserSubscription(userSubscriptionId int, adminId int, callerIp string) (*AdminRenewSubscriptionResult, error) {
	if userSubscriptionId <= 0 {
		return nil, errors.New("invalid userSubscriptionId")
	}

	var result *AdminRenewSubscriptionResult
	err := DB.Transaction(func(tx *gorm.DB) error {
		var sub UserSubscription
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ?", userSubscriptionId).First(&sub).Error; err != nil {
			return err
		}

		now := GetDBTimestamp()
		if !IsUserSubscriptionActive(&sub, now) {
			return errors.New("subscription is not active")
		}

		plan, err := getLatestSubscriptionPlanForRenewalTx(tx, sub.PlanId)
		if err != nil {
			return err
		}

		// Mirror the user-facing renewal flow: create a scheduled subscription
		// anchored at the existing subscription's end_time so admin-initiated
		// renewals also defer activation, instead of overwriting the active
		// subscription. The active subscription continues to serve traffic
		// until its natural expiry.
		newSub, err := CreateScheduledSubscriptionTx(tx, sub.UserId, plan, sub.EndTime, "admin")
		if err != nil {
			return err
		}

		result = &AdminRenewSubscriptionResult{
			UserSubscriptionId: newSub.Id,
			UserId:             newSub.UserId,
			PlanId:             plan.Id,
			PlanTitle:          plan.Title,
			OldEndTime:         sub.EndTime,
			NewEndTime:         newSub.EndTime,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if result == nil {
		return nil, errors.New("subscription renewal failed")
	}

	adminInfo := map[string]interface{}{
		"admin_id":             adminId,
		"caller_ip":            callerIp,
		"user_subscription_id": result.UserSubscriptionId,
		"plan_id":              result.PlanId,
		"old_end_time":         result.OldEndTime,
		"new_end_time":         result.NewEndTime,
	}
	RecordLogWithAdminInfo(result.UserId, LogTypeManage,
		fmt.Sprintf("管理员手动续费订阅，套餐: %s，待生效订阅ID: %d，预计生效时间: %d，预计到期时间: %d",
			result.PlanTitle, result.UserSubscriptionId, result.OldEndTime, result.NewEndTime),
		adminInfo,
	)
	return result, nil
}

// renewUserSubscriptionTx extends a subscription's validity and accumulates quota.
// Quota reset cycles are re-computed based on the new end time.
func renewUserSubscriptionTx(tx *gorm.DB, sub *UserSubscription, plan *SubscriptionPlan, now int64) error {
	if tx == nil || sub == nil || plan == nil {
		return errors.New("invalid renewal args")
	}

	nowTime := time.Unix(now, 0)
	wasActive := sub.Status == "active" && sub.EndTime > now

	// Calculate new end time
	var baseTime time.Time
	if wasActive {
		// Still active: extend from current end time (seamless renewal)
		baseTime = time.Unix(sub.EndTime, 0)
	} else {
		// Expired/cancelled: start fresh from now
		baseTime = nowTime
	}

	newEndUnix, err := calcPlanEndTime(baseTime, plan)
	if err != nil {
		return err
	}

	// === Handle quota reset cycle ===
	// For active subscriptions: keep LastResetTime, re-compute NextResetTime with the new end time.
	// This ensures that if the old end_time had clamped NextResetTime to 0,
	// the new (longer) end_time will yield a valid next reset time.
	// For expired subscriptions: reinitialize the reset cycle from now.
	period := NormalizeResetPeriod(plan.QuotaResetPeriod)
	if period != SubscriptionResetNever {
		if wasActive {
			lastReset := sub.LastResetTime
			if lastReset <= 0 {
				lastReset = sub.StartTime
			}
			sub.NextResetTime = calcNextResetTime(time.Unix(lastReset, 0), plan, newEndUnix)
		} else {
			sub.LastResetTime = now
			sub.NextResetTime = calcNextResetTime(nowTime, plan, newEndUnix)
		}
	}

	// === Handle rate limit reset cycles ===
	// Same principle as quota reset: active subs keep their anchor, expired subs restart from now.
	// Hourly limit
	if sub.HourlyLimitAmount > 0 {
		if wasActive {
			base := sub.HourlyLastResetTime
			if base <= 0 {
				base = sub.StartTime
			}
			sub.HourlyNextResetTime = calcNextHourlyResetTime(time.Unix(base, 0), sub.HourlyLimitHours, sub.HourlyResetMode, newEndUnix)
		} else {
			sub.HourlyLastResetTime = now
			sub.HourlyNextResetTime = calcNextHourlyResetTime(nowTime, plan.HourlyLimitHours, sub.HourlyResetMode, newEndUnix)
		}
	}

	// Daily limit
	if sub.DailyLimitAmount > 0 {
		if wasActive {
			base := sub.DailyLastResetTime
			if base <= 0 {
				base = sub.StartTime
			}
			sub.DailyNextResetTime = calcNextDailyResetTime(time.Unix(base, 0), sub.DailyResetMode, newEndUnix)
		} else {
			sub.DailyLastResetTime = now
			sub.DailyNextResetTime = calcNextDailyResetTime(nowTime, sub.DailyResetMode, newEndUnix)
		}
	}

	// Weekly limit
	if sub.WeeklyLimitAmount > 0 {
		if wasActive {
			base := sub.WeeklyLastResetTime
			if base <= 0 {
				base = sub.StartTime
			}
			sub.WeeklyNextResetTime = calcNextWeeklyResetTime(time.Unix(base, 0), sub.WeeklyResetMode, newEndUnix)
		} else {
			sub.WeeklyLastResetTime = now
			sub.WeeklyNextResetTime = calcNextWeeklyResetTime(nowTime, sub.WeeklyResetMode, newEndUnix)
		}
	}

	// Monthly limit
	if sub.MonthlyLimitAmount > 0 {
		if wasActive {
			base := sub.MonthlyLastResetTime
			if base <= 0 {
				base = sub.StartTime
			}
			sub.MonthlyNextResetTime = calcNextMonthlyResetTime(time.Unix(base, 0), sub.MonthlyResetMode, newEndUnix)
		} else {
			sub.MonthlyLastResetTime = now
			sub.MonthlyNextResetTime = calcNextMonthlyResetTime(nowTime, sub.MonthlyResetMode, newEndUnix)
		}
	}

	// === For expired subscriptions: reset rate limit usage counters ===
	// When a subscription has been inactive, the user should get a fresh start
	// on all rate-limit windows after renewing. Total quota usage is preserved.
	if !wasActive {
		sub.HourlyAmountUsed = 0
		sub.DailyAmountUsed = 0
		sub.WeeklyAmountUsed = 0
		sub.MonthlyAmountUsed = 0
	}

	// === Restore status if the subscription had expired or was cancelled ===
	if !wasActive {
		sub.Status = "active"
	}

	sub.EndTime = newEndUnix
	sub.UpdatedAt = common.GetTimestamp()

	return tx.Save(sub).Error
}
