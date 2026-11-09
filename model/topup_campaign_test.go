package model

import (
	"errors"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testTopupCampaignKey = "campaign-test"

func setTestTopupCampaign(t *testing.T, now time.Time, tiers string, dayRate float64, active bool) {
	t.Helper()
	start := now.Add(-time.Hour).Unix()
	end := now.Add(time.Hour).Unix()
	values := map[string]string{
		"topup_campaign_setting.campaign_key":    testTopupCampaignKey,
		"topup_campaign_setting.start_time":      strconv.FormatInt(start, 10),
		"topup_campaign_setting.end_time":        strconv.FormatInt(end, 10),
		"topup_campaign_setting.day_bonus_start": strconv.FormatInt(start, 10),
		"topup_campaign_setting.day_bonus_end":   strconv.FormatInt(end, 10),
		"topup_campaign_setting.day_bonus_rate":  strconv.FormatFloat(dayRate, 'f', -1, 64),
		"topup_campaign_setting.tiers":           tiers,
	}
	if active {
		values["topup_campaign_setting.enabled"] = "true"
	} else {
		values["topup_campaign_setting.enabled"] = "false"
	}
	require.NoError(t, config.GlobalConfig.LoadFromDB(values))
	t.Cleanup(func() {
		_ = config.GlobalConfig.LoadFromDB(map[string]string{
			"topup_campaign_setting.enabled": "false",
		})
	})
}

func createCampaignTopUp(t *testing.T, userId int, amount int64) *TopUp {
	t.Helper()
	topUp := &TopUp{
		UserId:     userId,
		Amount:     amount,
		Money:      float64(amount),
		TradeNo:    fmt.Sprintf("campaign-%d-%d", userId, time.Now().UnixNano()),
		CreateTime: time.Now().Unix(),
		Status:     common.TopUpStatusSuccess,
	}
	require.NoError(t, DB.Create(topUp).Error)
	return topUp
}

func campaignGiftTotal(t *testing.T, userId int) int64 {
	t.Helper()
	var total int64
	require.NoError(t, DB.Model(&UserGiftQuota{}).
		Where("user_id = ? AND source = ?", userId, GiftQuotaSourceTopupBonus).
		Select("COALESCE(SUM(quota), 0)").Scan(&total).Error)
	return total
}

func TestTopupCampaignGrantsEachReachedTierBonus(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	// A lower bonus on a later tier is valid: each tier grants its own amount.
	setTestTopupCampaign(t, now,
		`[{"min_amount":100,"bonus_amount":10},{"min_amount":200,"bonus_amount":20},{"min_amount":400,"bonus_amount":10}]`,
		0, true)
	user := &User{Id: 3101, Username: "campaign-independent-tiers", Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	first := createCampaignTopUp(t, user.Id, 100)
	firstGrant := grantTopupCampaignBonusAt(first, 100*int(common.QuotaPerUnit), now)
	assert.Equal(t, int64(10*common.QuotaPerUnit), firstGrant.TierBonusQuota)

	second := createCampaignTopUp(t, user.Id, 100)
	secondGrant := grantTopupCampaignBonusAt(second, 100*int(common.QuotaPerUnit), now)
	assert.Equal(t, int64(20*common.QuotaPerUnit), secondGrant.TierBonusQuota)
	assert.Equal(t, int64(30*common.QuotaPerUnit), campaignGiftTotal(t, user.Id))

	third := createCampaignTopUp(t, user.Id, 200)
	thirdGrant := grantTopupCampaignBonusAt(third, 200*int(common.QuotaPerUnit), now)
	assert.Equal(t, int64(10*common.QuotaPerUnit), thirdGrant.TierBonusQuota)
	assert.Equal(t, int64(40*common.QuotaPerUnit), campaignGiftTotal(t, user.Id))

	progress, err := GetTopupCampaignProgress(user.Id, operation_setting.GetTopupCampaignSetting().LatestPeriodAt(now))
	require.NoError(t, err)
	assert.Equal(t, int64(400*common.QuotaPerUnit), progress.AmountQuota)
	assert.Equal(t, int64(40*common.QuotaPerUnit), progress.TierBonusGranted)
}

func TestTopupCampaignGrantsAllTiersReachedByOneTopUp(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	setTestTopupCampaign(t, now,
		`[{"min_amount":100,"bonus_amount":10},{"min_amount":200,"bonus_amount":20},{"min_amount":400,"bonus_amount":10}]`,
		0, true)
	user := &User{Id: 3108, Username: "campaign-tier-jump", Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	topUp := createCampaignTopUp(t, user.Id, 400)
	grant := grantTopupCampaignBonusAt(topUp, 400*int(common.QuotaPerUnit), now)
	assert.Equal(t, int64(40*common.QuotaPerUnit), grant.TierBonusQuota)
	assert.Equal(t, int64(40*common.QuotaPerUnit), campaignGiftTotal(t, user.Id))

	repeated := grantTopupCampaignBonusAt(topUp, 400*int(common.QuotaPerUnit), now)
	assert.Zero(t, repeated.Total())
	assert.Equal(t, int64(40*common.QuotaPerUnit), campaignGiftTotal(t, user.Id))
}

func TestTopupCampaignGrantsDayBonusForEachTopUp(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	setTestTopupCampaign(t, now, `[{"min_amount":100,"bonus_amount":10}]`, 0.05, true)
	user := &User{Id: 3102, Username: "campaign-day", Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	topUp := createCampaignTopUp(t, user.Id, 100)
	grant := grantTopupCampaignBonusAt(topUp, 100*int(common.QuotaPerUnit), now)
	assert.Equal(t, int64(10*common.QuotaPerUnit), grant.TierBonusQuota)
	assert.Equal(t, int64(5*common.QuotaPerUnit), grant.DayBonusQuota)
	assert.Equal(t, int64(15*common.QuotaPerUnit), campaignGiftTotal(t, user.Id))

	second := createCampaignTopUp(t, user.Id, 50)
	secondGrant := grantTopupCampaignBonusAt(second, 50*int(common.QuotaPerUnit), now)
	assert.Zero(t, secondGrant.TierBonusQuota)
	assert.Equal(t, int64(50*common.QuotaPerUnit)*5/100, secondGrant.DayBonusQuota)
}

func TestTopupCampaignIgnoresInactiveCampaign(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	setTestTopupCampaign(t, now, `[{"min_amount":100,"bonus_amount":10}]`, 0.05, false)
	user := &User{Id: 3103, Username: "campaign-off", Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	topUp := createCampaignTopUp(t, user.Id, 100)
	grant := grantTopupCampaignBonusAt(topUp, 100*int(common.QuotaPerUnit), now)
	assert.Zero(t, grant.Total())
	assert.Zero(t, campaignGiftTotal(t, user.Id))

	var events int64
	require.NoError(t, DB.Model(&TopupCampaignEvent{}).Count(&events).Error)
	assert.Zero(t, events)
}

func TestTopupCampaignCountsRedemptionCodes(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	setTestTopupCampaign(t, now, `[{"min_amount":100,"bonus_amount":10}]`, 0.05, true)
	user := &User{Id: 3104, Username: "campaign-redeem", Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	quota := 100 * int(common.QuotaPerUnit)
	grant := grantRedemptionCampaignBonusAt(user.Id, 9001, quota, now)
	assert.Equal(t, int64(10*common.QuotaPerUnit), grant.TierBonusQuota)
	assert.Equal(t, int64(5*common.QuotaPerUnit), grant.DayBonusQuota)
	assert.Equal(t, int64(15*common.QuotaPerUnit), campaignGiftTotal(t, user.Id))

	// A retried settlement of the same code must not count it twice.
	repeated := grantRedemptionCampaignBonusAt(user.Id, 9001, quota, now)
	assert.Zero(t, repeated.Total())
	assert.Equal(t, int64(15*common.QuotaPerUnit), campaignGiftTotal(t, user.Id))

	progress, err := GetTopupCampaignProgress(user.Id, operation_setting.GetTopupCampaignSetting().LatestPeriodAt(time.Now()))
	require.NoError(t, err)
	assert.Equal(t, int64(quota), progress.AmountQuota)
	assert.Equal(t, int64(10*common.QuotaPerUnit), progress.TierBonusGranted)
}

func TestTopupCampaignSeparatesTopUpAndRedemptionIds(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	setTestTopupCampaign(t, now, `[{"min_amount":100,"bonus_amount":10}]`, 0, true)
	user := &User{Id: 3105, Username: "campaign-id-space", Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	topUp := createCampaignTopUp(t, user.Id, 100)
	quota := 100 * int(common.QuotaPerUnit)

	// A redemption code whose numeric id matches a top-up order must still be
	// counted on its own: the idempotency key is (source, source_id).
	redemptionGrant := grantRedemptionCampaignBonusAt(user.Id, topUp.Id, quota, now)
	assert.Equal(t, int64(10*common.QuotaPerUnit), redemptionGrant.TierBonusQuota)

	topUpGrant := grantTopupCampaignBonusAt(topUp, quota, now)
	assert.Zero(t, topUpGrant.TierBonusQuota)

	progress, err := GetTopupCampaignProgress(user.Id, operation_setting.GetTopupCampaignSetting().LatestPeriodAt(time.Now()))
	require.NoError(t, err)
	assert.Equal(t, int64(2*quota), progress.AmountQuota)

	var events int64
	require.NoError(t, DB.Model(&TopupCampaignEvent{}).Where("user_id = ?", user.Id).Count(&events).Error)
	assert.Equal(t, int64(2), events)
}

func TestTopupCampaignIgnoresEventsOutsideTheConfiguredWindow(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	setTestTopupCampaign(t, now, `[{"min_amount":100,"bonus_amount":10}]`, 0, true)
	period := operation_setting.GetTopupCampaignSetting().LatestPeriodAt(now)
	user := &User{Id: 3106, Username: "campaign-window", Group: "default"}
	require.NoError(t, DB.Create(user).Error)

	// An event recorded before the window opened (e.g. the admin moved the
	// start time forward) must not count toward the campaign any more.
	require.NoError(t, DB.Create(&TopupCampaignEvent{
		Source:           TopupCampaignSourceRedemption,
		SourceId:         9101,
		UserId:           user.Id,
		CampaignKey:      period.CampaignKey,
		AmountQuota:      int64(300 * common.QuotaPerUnit),
		TierBonusGranted: int64(40 * common.QuotaPerUnit),
		CreatedAt:        period.StartTime - 60,
	}).Error)

	progress, err := GetTopupCampaignProgress(user.Id, period)
	require.NoError(t, err)
	assert.Zero(t, progress.AmountQuota)
	assert.Zero(t, progress.TierBonusGranted)

	// The first top-up inside the window starts a fresh cumulative total, so it
	// earns the full first tier again instead of a delta over the excluded row.
	topUp := createCampaignTopUp(t, user.Id, 100)
	grant := grantTopupCampaignBonusAt(topUp, 100*int(common.QuotaPerUnit), now)
	assert.Equal(t, int64(10*common.QuotaPerUnit), grant.TierBonusQuota)

	progress, err = GetTopupCampaignProgress(user.Id, period)
	require.NoError(t, err)
	assert.Equal(t, int64(100*common.QuotaPerUnit), progress.AmountQuota)
	assert.Equal(t, int64(10*common.QuotaPerUnit), progress.TierBonusGranted)
}

func TestTopupCampaignKeepsPeriodsSeparate(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	// The first period already ended; the running one starts an hour ago with
	// its own tiers, so the finished period's total must not carry over.
	now := time.Now()
	periods := fmt.Sprintf(
		`[{"campaign_key":"first","start_time":%d,"end_time":%d,"day_bonus_rate":0,"tiers":[{"min_amount":100,"bonus_amount":50}]},`+
			`{"campaign_key":"second","start_time":%d,"end_time":%d,"day_bonus_rate":0,"tiers":[{"min_amount":100,"bonus_amount":10}]}]`,
		now.Add(-48*time.Hour).Unix(), now.Add(-24*time.Hour).Unix(),
		now.Add(-time.Hour).Unix(), now.Add(time.Hour).Unix(),
	)
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"topup_campaign_setting.enabled": "true",
		"topup_campaign_setting.periods": periods,
	}))
	t.Cleanup(func() {
		_ = config.GlobalConfig.LoadFromDB(map[string]string{
			"topup_campaign_setting.enabled": "false",
			"topup_campaign_setting.periods": "[]",
		})
	})

	user := &User{Id: 3107, Username: "campaign-periods", Group: "default"}
	require.NoError(t, DB.Create(user).Error)
	require.NoError(t, DB.Create(&TopupCampaignEvent{
		Source:           TopupCampaignSourceTopUp,
		SourceId:         9201,
		UserId:           user.Id,
		CampaignKey:      "first",
		AmountQuota:      int64(500 * common.QuotaPerUnit),
		TierBonusGranted: int64(50 * common.QuotaPerUnit),
		CreatedAt:        now.Add(-36 * time.Hour).Unix(),
	}).Error)

	second := operation_setting.GetTopupCampaignSetting().Periods[1]
	progress, err := GetTopupCampaignProgress(user.Id, second)
	require.NoError(t, err)
	assert.Zero(t, progress.AmountQuota)

	// The running period grants its own first tier from zero.
	topUp := createCampaignTopUp(t, user.Id, 100)
	grant := grantTopupCampaignBonusAt(topUp, 100*int(common.QuotaPerUnit), now)
	assert.Equal(t, int64(10*common.QuotaPerUnit), grant.TierBonusQuota)

	progress, err = GetTopupCampaignProgress(user.Id, second)
	require.NoError(t, err)
	assert.Equal(t, int64(100*common.QuotaPerUnit), progress.AmountQuota)
	assert.Equal(t, int64(10*common.QuotaPerUnit), progress.TierBonusGranted)

	// A top-up outside every period counts nowhere.
	inactive := grantTopupCampaignBonusAt(
		createCampaignTopUp(t, user.Id, 100),
		100*int(common.QuotaPerUnit),
		now.Add(48*time.Hour),
	)
	assert.Zero(t, inactive.Total())
}

func TestTopupCampaignWhitelistRestrictsParticipation(t *testing.T) {
	truncateTables(t)
	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	now := time.Now()
	periods := fmt.Sprintf(
		`[{"campaign_key":"whitelist","start_time":%d,"end_time":%d,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":[{"min_amount":100,"bonus_amount":10}],"whitelist_user_ids":[3110]}]`,
		now.Add(-time.Hour).Unix(), now.Add(time.Hour).Unix(),
	)
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"topup_campaign_setting.enabled": "true",
		"topup_campaign_setting.periods": periods,
	}))
	t.Cleanup(func() {
		_ = config.GlobalConfig.LoadFromDB(map[string]string{
			"topup_campaign_setting.enabled": "false",
			"topup_campaign_setting.periods": "[]",
		})
	})

	allowed := &User{Id: 3110, Username: "campaign-whitelisted", AffCode: "campaign-whitelisted", Group: "default"}
	blocked := &User{Id: 3111, Username: "campaign-not-whitelisted", AffCode: "campaign-not-whitelisted", Group: "default"}
	require.NoError(t, DB.Create(allowed).Error)
	require.NoError(t, DB.Create(blocked).Error)

	period := operation_setting.GetTopupCampaignSetting().Periods[0]
	assert.True(t, period.VisibleToUser(allowed.Id))
	assert.False(t, period.VisibleToUser(blocked.Id))

	grant := grantTopupCampaignBonusAt(
		createCampaignTopUp(t, allowed.Id, 100),
		100*int(common.QuotaPerUnit),
		now,
	)
	assert.Equal(t, int64(10*common.QuotaPerUnit), grant.TierBonusQuota)

	blockedGrant := grantTopupCampaignBonusAt(
		createCampaignTopUp(t, blocked.Id, 100),
		100*int(common.QuotaPerUnit),
		now,
	)
	assert.Zero(t, blockedGrant.Total())
	assert.Zero(t, campaignGiftTotal(t, blocked.Id))
}

func TestValidateTopupCampaignPeriodsKeepsEachRunSeparate(t *testing.T) {
	// Bonuses are independent per tier, so a higher threshold may grant less.
	independentBonuses := `[{"campaign_key":"november","start_time":100,"end_time":199,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":[{"min_amount":100,"bonus_amount":10},{"min_amount":200,"bonus_amount":20},{"min_amount":400,"bonus_amount":10}]}]`
	require.NoError(t, operation_setting.ValidateTopupCampaignOption(
		operation_setting.TopupCampaignPeriodsOption, independentBonuses,
	))
	require.NoError(t, operation_setting.ValidateTopupCampaignOption(
		operation_setting.TopupCampaignTiersOption,
		`[{"min_amount":100,"bonus_amount":10},{"min_amount":200,"bonus_amount":20},{"min_amount":400,"bonus_amount":10}]`,
	))

	valid := `[` +
		`{"campaign_key":"november","start_time":100,"end_time":199,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":[{"min_amount":100,"bonus_amount":10}]},` +
		`{"campaign_key":"december","start_time":200,"end_time":299,"day_bonus_start":250,"day_bonus_end":299,"day_bonus_rate":0.05,"tiers":[{"min_amount":100,"bonus_amount":10},{"min_amount":300,"bonus_amount":40}]}` +
		`]`
	require.NoError(t, operation_setting.ValidateTopupCampaignOption(
		operation_setting.TopupCampaignPeriodsOption, valid,
	))

	tests := []struct {
		name  string
		value string
		key   string
	}{
		{
			name: "overlapping periods",
			value: `[{"campaign_key":"a","start_time":100,"end_time":200,"tiers":[{"min_amount":100,"bonus_amount":10}]},` +
				`{"campaign_key":"b","start_time":200,"end_time":300,"tiers":[{"min_amount":100,"bonus_amount":10}]}]`,
			key: "Campaign periods cannot overlap",
		},
		{
			name:  "bonus day outside its period",
			value: `[{"campaign_key":"a","start_time":100,"end_time":200,"day_bonus_start":50,"day_bonus_end":150,"day_bonus_rate":0.05,"tiers":[{"min_amount":100,"bonus_amount":10}]}]`,
			key:   "Period {{index}}: bonus day window must be within the campaign period",
		},
		{
			name:  "period without tiers",
			value: `[{"campaign_key":"a","start_time":100,"end_time":200,"tiers":[]}]`,
			key:   "Period {{index}} has invalid tiers: {{error}}",
		},
		{
			name: "duplicate period keys",
			value: `[{"campaign_key":"a","start_time":100,"end_time":199,"tiers":[{"min_amount":100,"bonus_amount":10}]},` +
				`{"campaign_key":"a","start_time":200,"end_time":299,"tiers":[{"min_amount":100,"bonus_amount":10}]}]`,
			key: "Campaign keys must be unique across periods",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := operation_setting.ValidateTopupCampaignOption(
				operation_setting.TopupCampaignPeriodsOption, test.value,
			)
			require.Error(t, err)
			var message *common.Message
			require.True(t, errors.As(err, &message))
			assert.Equal(t, test.key, message.Key)
		})
	}
}

func TestMigrateTopupCampaignEventSourcesBackfillsLegacyRows(t *testing.T) {
	truncateTables(t)
	require.NoError(t, DB.Migrator().DropTable(&TopupCampaignEvent{}))
	t.Cleanup(func() {
		require.NoError(t, DB.Migrator().DropTable(&TopupCampaignEvent{}))
		require.NoError(t, DB.AutoMigrate(&TopupCampaignEvent{}))
	})

	require.NoError(t, DB.Exec(`CREATE TABLE topup_campaign_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		top_up_id integer NOT NULL,
		user_id integer NOT NULL,
		campaign_key varchar(64) NOT NULL,
		amount_quota bigint NOT NULL,
		tier_bonus_granted bigint NOT NULL DEFAULT 0,
		day_bonus_quota bigint NOT NULL DEFAULT 0,
		day_bonus_granted bigint NOT NULL DEFAULT 0,
		created_at bigint NOT NULL
	)`).Error)
	require.NoError(t, DB.Exec(`CREATE UNIQUE INDEX idx_topup_campaign_events_topup ON topup_campaign_events(top_up_id)`).Error)
	require.NoError(t, DB.Exec(`INSERT INTO topup_campaign_events (top_up_id, user_id, campaign_key, amount_quota, created_at) VALUES (11, 3201, 'legacy', 100, 1), (12, 3201, 'legacy', 200, 2)`).Error)

	require.NoError(t, migrateTopupCampaignEventSources())

	var events []TopupCampaignEvent
	require.NoError(t, DB.Order("top_up_id").Find(&events).Error)
	require.Len(t, events, 2)
	for _, event := range events {
		assert.Equal(t, TopupCampaignSourceTopUp, event.Source)
		assert.Equal(t, int64(event.TopUpId), event.SourceId)
	}
	assert.False(t, DB.Migrator().HasIndex(&TopupCampaignEvent{}, "idx_topup_campaign_events_topup"))

	// A second startup must be a no-op.
	require.NoError(t, migrateTopupCampaignEventSources())
}

func TestValidateTopupCampaignWhitelistUserIds(t *testing.T) {
	base := `[{"campaign_key":"whitelist","start_time":100,"end_time":199,"day_bonus_start":0,"day_bonus_end":0,"day_bonus_rate":0,"tiers":[{"min_amount":100,"bonus_amount":10}],"whitelist_user_ids":%s}]`
	require.NoError(t, operation_setting.ValidateTopupCampaignOption(
		operation_setting.TopupCampaignPeriodsOption,
		fmt.Sprintf(base, `[1001,1002]`),
	))
	require.Error(t, operation_setting.ValidateTopupCampaignOption(
		operation_setting.TopupCampaignPeriodsOption,
		fmt.Sprintf(base, `[0]`),
	))
}
