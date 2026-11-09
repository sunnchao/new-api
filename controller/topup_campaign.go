package controller

import (
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// GetTopupCampaign returns the latest campaign period — the one running, else
// the next one, else the most recently finished one — together with its status
// and, when the request carries a valid session, the caller's progress in it.
// The endpoint is public so the activity page works before sign-in.
func GetTopupCampaign(c *gin.Context) {
	campaign := operation_setting.GetTopupCampaignSetting()
	now := time.Now()
	userId := c.GetInt("id")
	period := campaign.LatestPeriodAt(now)
	enabled := campaign.Enabled && period.VisibleToUser(userId)
	data := gin.H{
		"enabled":         enabled,
		"campaign_key":    period.CampaignKey,
		"start_time":      period.StartTime,
		"end_time":        period.EndTime,
		"day_bonus_start": period.DayBonusStart,
		"day_bonus_end":   period.DayBonusEnd,
		"day_bonus_rate":  period.DayBonusRate,
		"tiers":           period.Tiers,
		"status":          topupCampaignStatus(enabled, period, now),
		"server_time":     now.Unix(),
	}
	if userId > 0 && enabled {
		self, err := buildTopupCampaignSelf(userId, period)
		if err != nil {
			common.SysError(common.LogText("failed to load topup campaign progress user_id=%d: %s", userId, err.Error()))
		} else {
			data["self"] = self
		}
	}
	common.ApiSuccess(c, data)
}

func topupCampaignStatus(enabled bool, period operation_setting.TopupCampaignPeriod, now time.Time) string {
	if !enabled {
		return operation_setting.TopupCampaignStatusDisable
	}
	return period.StatusAt(now)
}

func buildTopupCampaignSelf(userId int, period operation_setting.TopupCampaignPeriod) (gin.H, error) {
	progress, err := model.GetTopupCampaignProgress(userId, period)
	if err != nil {
		return nil, err
	}
	currentIndex := period.ReachedTierIndex(progress.AmountQuota)
	self := gin.H{
		"cumulative_amount":  topupCampaignQuotaToUSD(progress.AmountQuota),
		"tier_bonus_granted": topupCampaignQuotaToUSD(progress.TierBonusGranted),
		"day_bonus_granted":  topupCampaignQuotaToUSD(progress.DayBonusGranted),
		"current_tier_index": currentIndex,
		"top_reached":        len(period.Tiers) > 0 && currentIndex == len(period.Tiers)-1,
	}
	if currentIndex+1 < len(period.Tiers) {
		next := period.Tiers[currentIndex+1]
		gapQuota := period.TierMinQuota(next) - progress.AmountQuota
		self["next_tier_amount"] = next.MinAmount
		self["next_tier_bonus"] = next.BonusAmount
		self["gap_to_next"] = topupCampaignQuotaToUSD(max(gapQuota, 0))
	}
	return self, nil
}

func topupCampaignQuotaToUSD(quota int64) float64 {
	if common.QuotaPerUnit <= 0 {
		return 0
	}
	return decimal.NewFromInt(quota).
		Div(decimal.NewFromFloat(common.QuotaPerUnit)).
		InexactFloat64()
}
