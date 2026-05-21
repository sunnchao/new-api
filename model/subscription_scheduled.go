package model

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

// UserSubscriptionStatusScheduled marks a subscription created via renewal that
// is waiting to take effect. A scheduled subscription is invisible to the
// consumption pipeline (which only queries status="active") and only flips to
// "active" once either:
//   - the scheduled start_time arrives and the background activation task
//     promotes it, or
//   - the user / admin manually triggers immediate activation.
const UserSubscriptionStatusScheduled = "scheduled"

// EnsureNoExistingScheduledRenewal blocks repeat renewal purchases for the same
// plan while a previous scheduled renewal is still pending. This is a hard rule
// because subscriptions do not support refunds; stacking multiple scheduled
// renewals would mislead users about when their next billing cycle begins.
func EnsureNoExistingScheduledRenewal(userId int, planId int) error {
	if userId <= 0 || planId <= 0 {
		return errors.New("invalid args")
	}
	var count int64
	if err := DB.Model(&UserSubscription{}).
		Where("user_id = ? AND plan_id = ? AND status = ?",
			userId, planId, UserSubscriptionStatusScheduled).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("该套餐已有待生效的续费订阅，请等其生效后再续费")
	}
	return nil
}

// CreateScheduledSubscriptionTx persists a new user subscription with status
// "scheduled". The plan configuration (quota, rate limits, reset modes, upgrade
// group, etc.) is snapshotted onto the subscription row at creation time so
// that subsequent edits to the underlying plan cannot retroactively change the
// terms the user already paid for. Time-dependent fields (end_time and the
// various *_next_reset_time anchors) are pre-computed against `activationAnchor`
// — the moment the subscription is expected to take effect, which is the
// existing active subscription's end_time. When the scheduled subscription is
// later activated at a different wall-clock time, ActivateScheduledSubscriptionTx
// shifts all time fields by the resulting delta without re-reading the plan.
//
// activationAnchor must be the old subscription's EndTime (a positive future
// unix timestamp). source mirrors the existing CreateUserSubscriptionFromPlanTx
// contract ("order" for user-paid renewals, "admin" for admin-triggered ones).
func CreateScheduledSubscriptionTx(tx *gorm.DB, userId int, plan *SubscriptionPlan,
	activationAnchor int64, source string) (*UserSubscription, error) {
	if tx == nil {
		return nil, errors.New("tx is nil")
	}
	if plan == nil || plan.Id == 0 {
		return nil, errors.New("invalid plan")
	}
	if userId <= 0 {
		return nil, errors.New("invalid user id")
	}
	if activationAnchor <= 0 {
		return nil, errors.New("invalid activation anchor")
	}

	anchorTime := time.Unix(activationAnchor, 0)
	endUnix, err := calcPlanEndTime(anchorTime, plan)
	if err != nil {
		return nil, err
	}

	nextReset := int64(0)
	lastReset := int64(0)
	if NormalizeResetPeriod(plan.QuotaResetPeriod) != SubscriptionResetNever {
		lastReset = activationAnchor
		nextReset = calcNextResetTime(anchorTime, plan, endUnix)
	}

	hourlyLastReset := int64(0)
	hourlyNextReset := int64(0)
	if plan.HourlyLimitAmount > 0 {
		hourlyLastReset = activationAnchor
		hourlyNextReset = calcNextHourlyResetTime(anchorTime, plan.HourlyLimitHours, plan.HourlyResetMode, endUnix)
	}

	dailyLastReset := int64(0)
	dailyNextReset := int64(0)
	if plan.DailyLimitAmount > 0 {
		dailyLastReset = activationAnchor
		dailyNextReset = calcNextDailyResetTime(anchorTime, plan.DailyResetMode, endUnix)
	}

	weeklyLastReset := int64(0)
	weeklyNextReset := int64(0)
	if plan.WeeklyLimitAmount > 0 {
		weeklyLastReset = activationAnchor
		weeklyNextReset = calcNextWeeklyResetTime(anchorTime, plan.WeeklyResetMode, endUnix)
	}

	monthlyLastReset := int64(0)
	monthlyNextReset := int64(0)
	if plan.MonthlyLimitAmount > 0 {
		monthlyLastReset = activationAnchor
		monthlyNextReset = calcNextMonthlyResetTime(anchorTime, plan.MonthlyResetMode, endUnix)
	}

	sub := &UserSubscription{
		UserId:           userId,
		PlanId:           plan.Id,
		AmountTotal:      plan.TotalAmount,
		AmountUsed:       0,
		BillingMode:      NormalizeSubscriptionBillingMode(plan.BillingMode),
		ApproximateTimes: plan.ApproximateTimes,
		StartTime:        activationAnchor,
		EndTime:          endUnix,
		Status:           UserSubscriptionStatusScheduled,
		Source:           source,
		LastResetTime:    lastReset,
		NextResetTime:    nextReset,
		UpgradeGroup:     strings.TrimSpace(plan.UpgradeGroup),
		AllowedGroups:    plan.AllowedGroups,
		// PrevUserGroup intentionally left empty; the actual snapshot of the
		// user's current group happens at activation time.

		HourlyLimitAmount:      plan.HourlyLimitAmount,
		HourlyApproximateTimes: plan.HourlyApproximateTimes,
		HourlyLimitHours:       plan.HourlyLimitHours,
		HourlyResetMode:        NormalizeSubscriptionResetMode(plan.HourlyResetMode),
		HourlyAmountUsed:       0,
		HourlyLastResetTime:    hourlyLastReset,
		HourlyNextResetTime:    hourlyNextReset,

		DailyLimitAmount:      plan.DailyLimitAmount,
		DailyApproximateTimes: plan.DailyApproximateTimes,
		DailyResetMode:        NormalizeSubscriptionResetMode(plan.DailyResetMode),
		DailyAmountUsed:       0,
		DailyLastResetTime:    dailyLastReset,
		DailyNextResetTime:    dailyNextReset,

		WeeklyLimitAmount:      plan.WeeklyLimitAmount,
		WeeklyApproximateTimes: plan.WeeklyApproximateTimes,
		WeeklyResetMode:        NormalizeSubscriptionResetMode(plan.WeeklyResetMode),
		WeeklyAmountUsed:       0,
		WeeklyLastResetTime:    weeklyLastReset,
		WeeklyNextResetTime:    weeklyNextReset,

		MonthlyLimitAmount:      plan.MonthlyLimitAmount,
		MonthlyApproximateTimes: plan.MonthlyApproximateTimes,
		MonthlyResetMode:        NormalizeSubscriptionResetMode(plan.MonthlyResetMode),
		MonthlyAmountUsed:       0,
		MonthlyLastResetTime:    monthlyLastReset,
		MonthlyNextResetTime:    monthlyNextReset,
	}
	if err := tx.Create(sub).Error; err != nil {
		return nil, err
	}
	return sub, nil
}

// ActivateScheduledSubscriptionTx flips a scheduled subscription to active and
// shifts every time anchor by (activateTime - StartTime). This preserves the
// total subscription length and the relative spacing of reset cycles regardless
// of whether the user is activating early, on-time, or late. User group upgrade
// (if any) is applied here rather than at scheduling time, so two coexisting
// upgrade groups do not collide while one subscription is still pending.
func ActivateScheduledSubscriptionTx(tx *gorm.DB, sub *UserSubscription, activateTime int64) error {
	if tx == nil || sub == nil {
		return errors.New("invalid activate args")
	}
	if sub.Status != UserSubscriptionStatusScheduled {
		return fmt.Errorf("subscription %d is not scheduled", sub.Id)
	}
	if activateTime <= 0 {
		return errors.New("invalid activate time")
	}

	shift := activateTime - sub.StartTime
	if shift != 0 {
		shiftTimeField(&sub.StartTime, shift)
		shiftTimeField(&sub.EndTime, shift)
		shiftTimeField(&sub.LastResetTime, shift)
		shiftTimeField(&sub.NextResetTime, shift)
		shiftTimeField(&sub.HourlyLastResetTime, shift)
		shiftTimeField(&sub.HourlyNextResetTime, shift)
		shiftTimeField(&sub.DailyLastResetTime, shift)
		shiftTimeField(&sub.DailyNextResetTime, shift)
		shiftTimeField(&sub.WeeklyLastResetTime, shift)
		shiftTimeField(&sub.WeeklyNextResetTime, shift)
		shiftTimeField(&sub.MonthlyLastResetTime, shift)
		shiftTimeField(&sub.MonthlyNextResetTime, shift)
	}

	sub.Status = "active"

	if upgradeGroup := strings.TrimSpace(sub.UpgradeGroup); upgradeGroup != "" {
		currentGroup, err := getUserGroupByIdTx(tx, sub.UserId)
		if err != nil {
			return err
		}
		if currentGroup != upgradeGroup {
			sub.PrevUserGroup = currentGroup
			if err := tx.Model(&User{}).Where("id = ?", sub.UserId).
				Update("group", upgradeGroup).Error; err != nil {
				return err
			}
		}
	}

	sub.UpdatedAt = common.GetTimestamp()
	if err := tx.Save(sub).Error; err != nil {
		return err
	}

	if strings.TrimSpace(sub.UpgradeGroup) != "" {
		_ = UpdateUserGroupCache(sub.UserId, sub.UpgradeGroup)
	}
	return nil
}

// shiftTimeField mutates a unix-timestamp field in place, preserving the
// "not set" semantics (a zero value stays zero).
func shiftTimeField(field *int64, delta int64) {
	if field == nil || *field == 0 {
		return
	}
	*field += delta
}

// UserActivateScheduledSubscription handles the user-facing "activate now"
// action: the caller must own the subscription. The activation timestamp is
// the current time, so the new active window starts immediately and the old
// subscription (still active) keeps running in parallel until it naturally
// expires.
func UserActivateScheduledSubscription(userId int, userSubscriptionId int) (*UserSubscription, error) {
	if userId <= 0 || userSubscriptionId <= 0 {
		return nil, errors.New("invalid args")
	}
	var activated UserSubscription
	err := DB.Transaction(func(tx *gorm.DB) error {
		var sub UserSubscription
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("id = ? AND user_id = ? AND status = ?",
				userSubscriptionId, userId, UserSubscriptionStatusScheduled).
			First(&sub).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("待生效订阅不存在")
			}
			return err
		}
		if err := ActivateScheduledSubscriptionTx(tx, &sub, common.GetTimestamp()); err != nil {
			return err
		}
		activated = sub
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &activated, nil
}

// AdminActivateScheduledSubscription mirrors UserActivateScheduledSubscription
// but skips the owner check. It is intended for admin tooling.
func AdminActivateScheduledSubscription(userSubscriptionId int) (*UserSubscription, error) {
	if userSubscriptionId <= 0 {
		return nil, errors.New("invalid args")
	}
	var activated UserSubscription
	err := DB.Transaction(func(tx *gorm.DB) error {
		var sub UserSubscription
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("id = ? AND status = ?", userSubscriptionId, UserSubscriptionStatusScheduled).
			First(&sub).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("待生效订阅不存在")
			}
			return err
		}
		if err := ActivateScheduledSubscriptionTx(tx, &sub, common.GetTimestamp()); err != nil {
			return err
		}
		activated = sub
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &activated, nil
}

// ActivateDueScheduledSubscriptions is invoked by the subscription maintenance
// task once per minute. It activates every scheduled subscription whose
// start_time anchor (i.e. the previous active subscription's end_time) has
// arrived, keeping the activation timestamp pinned to that anchor so the
// renewal does not lose any time to scheduler latency.
func ActivateDueScheduledSubscriptions(limit int) (int, error) {
	if limit <= 0 {
		limit = 200
	}
	now := GetDBTimestamp()
	var subs []UserSubscription
	if err := DB.Where("status = ? AND start_time > 0 AND start_time <= ?",
		UserSubscriptionStatusScheduled, now).
		Order("start_time asc, id asc").
		Limit(limit).
		Find(&subs).Error; err != nil {
		return 0, err
	}
	if len(subs) == 0 {
		return 0, nil
	}

	activated := 0
	for _, s := range subs {
		subCopy := s
		anchor := subCopy.StartTime
		err := DB.Transaction(func(tx *gorm.DB) error {
			var locked UserSubscription
			if err := tx.Set("gorm:query_option", "FOR UPDATE").
				Where("id = ? AND status = ?", subCopy.Id, UserSubscriptionStatusScheduled).
				First(&locked).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return nil
				}
				return err
			}
			return ActivateScheduledSubscriptionTx(tx, &locked, anchor)
		})
		if err != nil {
			return activated, err
		}
		activated++
	}
	return activated, nil
}
