package model

import (
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"gorm.io/gorm"
)

const (
	// TopupCampaignSourceTopUp marks an event created by a paid top-up order.
	TopupCampaignSourceTopUp = "topup"
	// TopupCampaignSourceRedemption marks an event credited by a redemption code.
	TopupCampaignSourceRedemption = "redemption"
)

// TopupCampaignEvent records one completed top-up counted toward a top-up
// campaign. AmountQuota is the credited quota of the order; the granted
// columns record how much tier/day bonus that event actually produced.
// (Source, SourceId) is unique so a retried settlement can never count the same
// order, or the same redemption code, twice.
type TopupCampaignEvent struct {
	Id               int64  `json:"id" gorm:"primaryKey"`
	Source           string `json:"source" gorm:"type:varchar(16);not null;default:'topup';uniqueIndex:idx_topup_campaign_events_source,priority:1"`
	SourceId         int64  `json:"source_id" gorm:"not null;default:0;uniqueIndex:idx_topup_campaign_events_source,priority:2"`
	TopUpId          int    `json:"top_up_id" gorm:"not null;default:0;index"`
	UserId           int    `json:"user_id" gorm:"not null;index:idx_topup_campaign_events_user,priority:1"`
	CampaignKey      string `json:"campaign_key" gorm:"type:varchar(64);not null;index:idx_topup_campaign_events_user,priority:2"`
	AmountQuota      int64  `json:"amount_quota" gorm:"not null"`
	TierBonusGranted int64  `json:"tier_bonus_granted" gorm:"not null;default:0"`
	DayBonusQuota    int64  `json:"day_bonus_quota" gorm:"not null;default:0"`
	DayBonusGranted  int64  `json:"day_bonus_granted" gorm:"not null;default:0"`
	CreatedAt        int64  `json:"created_at" gorm:"not null"`
}

func (TopupCampaignEvent) TableName() string {
	return "topup_campaign_events"
}

// TopupCampaignProgress is the user's running total in one campaign.
type TopupCampaignProgress struct {
	AmountQuota      int64 `json:"amount_quota" gorm:"column:amount_quota"`
	TierBonusGranted int64 `json:"tier_bonus_granted" gorm:"column:tier_bonus_granted"`
	DayBonusGranted  int64 `json:"day_bonus_granted" gorm:"column:day_bonus_granted"`
}

type TopupCampaignGrant struct {
	TierBonusQuota int64
	DayBonusQuota  int64
}

func (g TopupCampaignGrant) Total() int64 {
	return g.TierBonusQuota + g.DayBonusQuota
}

type topupCampaignEventSums struct {
	AmountQuota      int64
	TierBonusGranted int64
	DayBonusQuota    int64
	DayBonusGranted  int64
}

// GrantTopupCampaignBonus counts one completed top-up toward the running
// campaign and grants any newly unlocked bonus as gift quota. It is
// best-effort: a failure is logged and never fails the top-up itself.
func GrantTopupCampaignBonus(topUp *TopUp, creditedQuota int) {
	grantTopupCampaignBonusAt(topUp, creditedQuota, time.Now())
}

// GrantRedemptionCampaignBonus counts quota credited by a redemption code the
// same way as a paid top-up. It is best-effort as well: a campaign failure
// never rolls back an already redeemed code.
func GrantRedemptionCampaignBonus(userId int, redemptionId int, creditedQuota int) {
	grantRedemptionCampaignBonusAt(userId, redemptionId, creditedQuota, time.Now())
}

func grantTopupCampaignBonusAt(topUp *TopUp, creditedQuota int, now time.Time) TopupCampaignGrant {
	if topUp == nil {
		return TopupCampaignGrant{}
	}
	return settleTopupCampaignEventAt(topupCampaignSettlement{
		source:        TopupCampaignSourceTopUp,
		sourceId:      int64(topUp.Id),
		topUpId:       topUp.Id,
		userId:        topUp.UserId,
		creditedQuota: creditedQuota,
	}, now)
}

func grantRedemptionCampaignBonusAt(userId int, redemptionId int, creditedQuota int, now time.Time) TopupCampaignGrant {
	return settleTopupCampaignEventAt(topupCampaignSettlement{
		source:        TopupCampaignSourceRedemption,
		sourceId:      int64(redemptionId),
		userId:        userId,
		creditedQuota: creditedQuota,
	}, now)
}

// topupCampaignSettlement describes one source record to count. Source and
// sourceId form the idempotency key, so a top-up order and a redemption code
// that happen to share a numeric id are still counted separately.
type topupCampaignSettlement struct {
	source        string
	sourceId      int64
	topUpId       int
	userId        int
	creditedQuota int
}

func settleTopupCampaignEventAt(settlement topupCampaignSettlement, now time.Time) TopupCampaignGrant {
	grant := TopupCampaignGrant{}
	if settlement.userId <= 0 || settlement.sourceId <= 0 || settlement.creditedQuota <= 0 {
		return grant
	}
	// Each period keeps its own key, window and tiers, so a period that is not
	// running neither receives events nor leaks totals into the next one.
	campaign, ok := operation_setting.GetTopupCampaignSetting().EnabledPeriodAt(now, settlement.userId)
	if !ok {
		return grant
	}

	err := DB.Transaction(func(tx *gorm.DB) error {
		// Serialize per user so two concurrent top-ups cannot both compute the
		// same "already granted" baseline and over-grant the same tier.
		var user User
		if err := lockForUpdate(tx).Select("id").Where("id = ?", settlement.userId).First(&user).Error; err != nil {
			return err
		}

		var existing int64
		if err := tx.Model(&TopupCampaignEvent{}).
			Where("source = ? AND source_id = ?", settlement.source, settlement.sourceId).
			Count(&existing).Error; err != nil {
			return err
		}
		if existing > 0 {
			return nil
		}

		sums := topupCampaignEventSums{}
		if err := tx.Model(&TopupCampaignEvent{}).
			Where("user_id = ? AND campaign_key = ? AND created_at >= ? AND created_at <= ?",
				settlement.userId, campaign.CampaignKey, campaign.StartTime, campaign.EndTime).
			Select("COALESCE(SUM(amount_quota), 0) AS amount_quota, COALESCE(SUM(tier_bonus_granted), 0) AS tier_bonus_granted, COALESCE(SUM(day_bonus_quota), 0) AS day_bonus_quota, COALESCE(SUM(day_bonus_granted), 0) AS day_bonus_granted").
			Scan(&sums).Error; err != nil {
			return err
		}

		cumulativeQuota := sums.AmountQuota + int64(settlement.creditedQuota)
		tierDelta := campaign.UnlockedTierBonusQuota(cumulativeQuota) - sums.TierBonusGranted
		if tierDelta < 0 {
			tierDelta = 0
		}
		dayBonus := int64(0)
		if campaign.DayBonusActiveAt(now) {
			dayBonus = campaign.DayBonusQuota(int64(settlement.creditedQuota))
		}
		// Recover any day bonus a previous event failed to grant.
		dayDelta := sums.DayBonusQuota + dayBonus - sums.DayBonusGranted
		if dayDelta < 0 {
			dayDelta = 0
		}

		event := &TopupCampaignEvent{
			Source:        settlement.source,
			SourceId:      settlement.sourceId,
			TopUpId:       settlement.topUpId,
			UserId:        settlement.userId,
			CampaignKey:   campaign.CampaignKey,
			AmountQuota:   int64(settlement.creditedQuota),
			DayBonusQuota: dayBonus,
			CreatedAt:     now.Unix(),
		}
		if err := tx.Create(event).Error; err != nil {
			return err
		}

		total := tierDelta + dayDelta
		if total > int64(common.MaxQuota) {
			// Gift quota is bounded by the wallet-safe quota range. Leave the
			// event recorded with zero granted so a later top-up can retry.
			common.SysError(common.LogText("topup campaign bonus exceeds quota range user_id=%d source=%s source_id=%d quota=%d", settlement.userId, settlement.source, settlement.sourceId, total))
			return nil
		}
		if total <= 0 {
			return nil
		}
		// Use the event id as the gift source id: it is unique across top-up
		// orders and redemption codes, which the gift unique key requires.
		expiresAt := operation_setting.GetTopupBonusGiftQuotaExpirationPolicy().ExpiresAt(now)
		if _, err := GrantGiftQuota(tx, settlement.userId, GiftQuotaSourceTopupBonus, event.Id, int(total), now, expiresAt); err != nil {
			// The event stays recorded with zero granted; the next top-up
			// recomputes the shortfall from the stored targets.
			common.SysError(common.LogText("topup campaign bonus grant failed user_id=%d source=%s source_id=%d quota=%d: %s", settlement.userId, settlement.source, settlement.sourceId, total, err.Error()))
			return nil
		}
		if err := tx.Model(&TopupCampaignEvent{}).Where("id = ?", event.Id).Updates(map[string]any{
			"tier_bonus_granted": tierDelta,
			"day_bonus_granted":  dayDelta,
		}).Error; err != nil {
			return err
		}

		grant = TopupCampaignGrant{TierBonusQuota: tierDelta, DayBonusQuota: dayDelta}
		return nil
	})
	if err != nil {
		common.SysError(common.LogText("topup campaign settlement failed user_id=%d source=%s source_id=%d: %s", settlement.userId, settlement.source, settlement.sourceId, err.Error()))
		return TopupCampaignGrant{}
	}
	if grant.Total() > 0 {
		RecordLog(settlement.userId, LogTypeTopup, common.NewMessage("Top-up campaign bonus granted: {{quota}}", map[string]any{
			"quota": logger.FormatQuota(int(grant.Total())),
		}), nil)
		common.SysLog(common.LogText("topup campaign bonus granted user_id=%d source=%s source_id=%d tier_bonus=%d day_bonus=%d", settlement.userId, settlement.source, settlement.sourceId, grant.TierBonusQuota, grant.DayBonusQuota))
	}
	return grant
}

// migrateTopupCampaignEventSources upgrades tables created before redemption
// codes counted toward the campaign. That shape keyed events by top_up_id with
// a unique index; the new key is (source, source_id). Existing rows are
// backfilled as top-up events before AutoMigrate creates the composite unique
// index. It is idempotent and safe on SQLite, MySQL and PostgreSQL.
func migrateTopupCampaignEventSources() error {
	if !DB.Migrator().HasTable(&TopupCampaignEvent{}) {
		return nil
	}
	if DB.Migrator().HasIndex(&TopupCampaignEvent{}, "idx_topup_campaign_events_topup") {
		if err := DB.Migrator().DropIndex(&TopupCampaignEvent{}, "idx_topup_campaign_events_topup"); err != nil {
			return err
		}
	}
	if !DB.Migrator().HasColumn(&TopupCampaignEvent{}, "source") {
		if err := DB.Migrator().AddColumn(&TopupCampaignEvent{}, "Source"); err != nil {
			return err
		}
	}
	if !DB.Migrator().HasColumn(&TopupCampaignEvent{}, "source_id") {
		if err := DB.Migrator().AddColumn(&TopupCampaignEvent{}, "SourceId"); err != nil {
			return err
		}
	}
	return DB.Model(&TopupCampaignEvent{}).
		Where("source_id = ?", 0).
		Updates(map[string]any{
			"source":    TopupCampaignSourceTopUp,
			"source_id": gorm.Expr("top_up_id"),
		}).Error
}

// GetTopupCampaignProgress returns the user's totals in one campaign.
func GetTopupCampaignProgress(userId int, period operation_setting.TopupCampaignPeriod) (TopupCampaignProgress, error) {
	progress := TopupCampaignProgress{}
	err := DB.Model(&TopupCampaignEvent{}).
		Where("user_id = ? AND campaign_key = ? AND created_at >= ? AND created_at <= ?",
			userId, period.CampaignKey, period.StartTime, period.EndTime).
		Select("COALESCE(SUM(amount_quota), 0) AS amount_quota, COALESCE(SUM(tier_bonus_granted), 0) AS tier_bonus_granted, COALESCE(SUM(day_bonus_granted), 0) AS day_bonus_granted").
		Scan(&progress).Error
	return progress, err
}
