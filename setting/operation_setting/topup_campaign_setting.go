package operation_setting

import (
	"cmp"
	"slices"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"

	"github.com/shopspring/decimal"
)

const (
	TopupCampaignSettingKey = "topup_campaign_setting"

	TopupCampaignEnabledOption       = "topup_campaign_setting.enabled"
	TopupCampaignKeyOption           = "topup_campaign_setting.campaign_key"
	TopupCampaignStartTimeOption     = "topup_campaign_setting.start_time"
	TopupCampaignEndTimeOption       = "topup_campaign_setting.end_time"
	TopupCampaignDayBonusStartOption = "topup_campaign_setting.day_bonus_start"
	TopupCampaignDayBonusEndOption   = "topup_campaign_setting.day_bonus_end"
	TopupCampaignDayBonusRateOption  = "topup_campaign_setting.day_bonus_rate"
	TopupCampaignTiersOption         = "topup_campaign_setting.tiers"
	TopupCampaignPeriodsOption       = "topup_campaign_setting.periods"

	topupCampaignMaxTiers       = 20
	topupCampaignMaxPeriods     = 20
	topupCampaignMaxKeyLength   = 64
	topupCampaignMaxAmountUSD   = 1_000_000
	topupCampaignMaxWhitelist   = 1000
	topupCampaignDefaultKey     = "double11-2026"
	TopupCampaignStatusDisable  = "disabled"
	TopupCampaignStatusUpcoming = "upcoming"
	TopupCampaignStatusLive     = "live"
	TopupCampaignStatusDay      = "day"
	TopupCampaignStatusEnded    = "ended"
)

// TopupCampaignTier is one cumulative top-up threshold and its own bonus
// credit. Reaching a tier grants BonusAmount once; bonuses from different tiers
// are independent and do not replace each other.
type TopupCampaignTier struct {
	MinAmount   float64 `json:"min_amount"`
	BonusAmount float64 `json:"bonus_amount"`
}

// TopupCampaignPeriod is one campaign run ("期"): its own time window, bonus
// day and cumulative tiers. Amounts are USD credits; timestamps are Unix
// seconds.
type TopupCampaignPeriod struct {
	CampaignKey      string              `json:"campaign_key"`
	StartTime        int64               `json:"start_time"`
	EndTime          int64               `json:"end_time"`
	DayBonusStart    int64               `json:"day_bonus_start"`
	DayBonusEnd      int64               `json:"day_bonus_end"`
	DayBonusRate     float64             `json:"day_bonus_rate"`
	Tiers            []TopupCampaignTier `json:"tiers"`
	WhitelistUserIds []int               `json:"whitelist_user_ids"`
}

// TopupCampaignSetting holds every campaign run. Periods is authoritative; the
// single-period fields below are the pre-multi-period shape and are still read
// as one period when Periods is empty, so existing installations keep working.
type TopupCampaignSetting struct {
	Enabled bool                  `json:"enabled"`
	Periods []TopupCampaignPeriod `json:"periods"`

	// Deprecated: legacy single-period options, used when Periods is empty.
	CampaignKey   string              `json:"campaign_key"`
	StartTime     int64               `json:"start_time"`
	EndTime       int64               `json:"end_time"`
	DayBonusStart int64               `json:"day_bonus_start"`
	DayBonusEnd   int64               `json:"day_bonus_end"`
	DayBonusRate  float64             `json:"day_bonus_rate"`
	Tiers         []TopupCampaignTier `json:"tiers"`
}

func defaultTopupCampaignPeriod() TopupCampaignPeriod {
	return TopupCampaignPeriod{
		CampaignKey:   "2026-double-11",
		StartTime:     1793894400, // 2026-11-06 00:00:00 UTC+8
		EndTime:       1794412799, // 2026-11-11 23:59:59 UTC+8
		DayBonusStart: 1794326400, // 2026-11-11 00:00:00 UTC+8
		DayBonusEnd:   1794412799, // 2026-11-11 23:59:59 UTC+8
		DayBonusRate:  0.05,
		Tiers: []TopupCampaignTier{
			{MinAmount: 100, BonusAmount: 10},
			{MinAmount: 300, BonusAmount: 40},
			{MinAmount: 500, BonusAmount: 80},
			{MinAmount: 1000, BonusAmount: 200},
			{MinAmount: 2026, BonusAmount: 520},
		},
	}
}

// Only the legacy fields are seeded: until an operator saves periods through
// the multi-period settings they describe the one configured period, so an
// existing installation keeps its edited dates and tiers.
var topupCampaignSetting = TopupCampaignSetting{
	Enabled:       true,
	CampaignKey:   defaultTopupCampaignPeriod().CampaignKey,
	StartTime:     defaultTopupCampaignPeriod().StartTime,
	EndTime:       defaultTopupCampaignPeriod().EndTime,
	DayBonusStart: defaultTopupCampaignPeriod().DayBonusStart,
	DayBonusEnd:   defaultTopupCampaignPeriod().DayBonusEnd,
	DayBonusRate:  defaultTopupCampaignPeriod().DayBonusRate,
	Tiers:         defaultTopupCampaignPeriod().Tiers,
}

func init() {
	config.GlobalConfig.Register(TopupCampaignSettingKey, &topupCampaignSetting)
}

// GetTopupCampaignSetting returns a normalized copy so callers cannot mutate
// the registered configuration.
func GetTopupCampaignSetting() TopupCampaignSetting {
	return topupCampaignSetting.normalized()
}

func (s TopupCampaignSetting) normalized() TopupCampaignSetting {
	normalized := s
	periods := make([]TopupCampaignPeriod, 0, len(normalized.Periods)+1)
	for _, period := range normalized.Periods {
		periods = append(periods, period.normalized())
	}
	if len(periods) == 0 {
		// Pre-multi-period installation: the legacy flat fields describe the
		// one period that configuration still carries.
		periods = append(periods, TopupCampaignPeriod{
			CampaignKey:   normalized.CampaignKey,
			StartTime:     normalized.StartTime,
			EndTime:       normalized.EndTime,
			DayBonusStart: normalized.DayBonusStart,
			DayBonusEnd:   normalized.DayBonusEnd,
			DayBonusRate:  normalized.DayBonusRate,
			Tiers:         normalized.Tiers,
		}.normalized())
	}
	normalized.Periods = periods
	// Keep the deprecated mirror populated so older readers and admin forms
	// always see the latest period's values.
	latest := normalized.LatestPeriodAt(time.Now())
	normalized.CampaignKey = latest.CampaignKey
	normalized.StartTime = latest.StartTime
	normalized.EndTime = latest.EndTime
	normalized.DayBonusStart = latest.DayBonusStart
	normalized.DayBonusEnd = latest.DayBonusEnd
	normalized.DayBonusRate = latest.DayBonusRate
	normalized.Tiers = latest.Tiers
	return normalized
}

func (p TopupCampaignPeriod) normalized() TopupCampaignPeriod {
	normalized := p
	normalized.CampaignKey = strings.TrimSpace(normalized.CampaignKey)
	if normalized.CampaignKey == "" {
		normalized.CampaignKey = topupCampaignDefaultKey
	}
	if len(normalized.CampaignKey) > topupCampaignMaxKeyLength {
		normalized.CampaignKey = normalized.CampaignKey[:topupCampaignMaxKeyLength]
	}
	if normalized.DayBonusRate < 0 || normalized.DayBonusRate > 1 {
		normalized.DayBonusRate = 0
	}
	tiers := make([]TopupCampaignTier, 0, len(normalized.Tiers))
	for _, tier := range normalized.Tiers {
		if tier.MinAmount <= 0 || tier.BonusAmount <= 0 {
			continue
		}
		tiers = append(tiers, tier)
	}
	normalized.Tiers = sortTopupCampaignTiers(tiers)
	normalized.WhitelistUserIds = normalizeTopupCampaignWhitelist(normalized.WhitelistUserIds)
	return normalized
}

func normalizeTopupCampaignWhitelist(userIds []int) []int {
	normalized := make([]int, 0, len(userIds))
	for _, userId := range userIds {
		if userId > 0 {
			normalized = append(normalized, userId)
		}
	}
	slices.Sort(normalized)
	normalized = slices.Compact(normalized)
	if len(normalized) > topupCampaignMaxWhitelist {
		normalized = normalized[:topupCampaignMaxWhitelist]
	}
	return normalized
}

// LatestPeriodAt returns the period the activity page should show: the one in
// progress, else the next one, else the most recently finished one.
func (s TopupCampaignSetting) LatestPeriodAt(now time.Time) TopupCampaignPeriod {
	if len(s.Periods) == 0 {
		return TopupCampaignPeriod{}
	}
	nowUnix := now.Unix()
	var upcoming *TopupCampaignPeriod
	var latest *TopupCampaignPeriod
	for i, period := range s.Periods {
		if nowUnix >= period.StartTime && nowUnix <= period.EndTime {
			return period
		}
		if nowUnix < period.StartTime && (upcoming == nil || period.StartTime < upcoming.StartTime) {
			upcoming = &s.Periods[i]
		}
		if latest == nil || period.EndTime > latest.EndTime {
			latest = &s.Periods[i]
		}
	}
	if upcoming != nil {
		return *upcoming
	}
	return *latest
}

// PeriodByKey returns the configured period carrying the given campaign key.
func (s TopupCampaignSetting) PeriodByKey(campaignKey string) (TopupCampaignPeriod, bool) {
	for _, period := range s.Periods {
		if period.CampaignKey == campaignKey {
			return period, true
		}
	}
	return TopupCampaignPeriod{}, false
}

// VisibleToUser reports whether the campaign period is open to the user.
// An empty whitelist makes the period public; a non-empty whitelist limits it
// to the listed user IDs for production testing.
func (p TopupCampaignPeriod) VisibleToUser(userId int) bool {
	if len(p.WhitelistUserIds) == 0 {
		return true
	}
	return userId > 0 && slices.Contains(p.WhitelistUserIds, userId)
}

// EnabledPeriodAt returns the period a top-up at now should count toward for
// the given user, and whether the promotion is switched on for them.
func (s TopupCampaignSetting) EnabledPeriodAt(now time.Time, userId int) (TopupCampaignPeriod, bool) {
	if !s.Enabled {
		return TopupCampaignPeriod{}, false
	}
	nowUnix := now.Unix()
	for _, period := range s.Periods {
		if nowUnix >= period.StartTime && nowUnix <= period.EndTime && period.VisibleToUser(userId) {
			return period, true
		}
	}
	return TopupCampaignPeriod{}, false
}

func sortTopupCampaignTiers(tiers []TopupCampaignTier) []TopupCampaignTier {
	sorted := make([]TopupCampaignTier, len(tiers))
	copy(sorted, tiers)
	slices.SortFunc(sorted, func(a, b TopupCampaignTier) int {
		return cmp.Compare(a.MinAmount, b.MinAmount)
	})
	return sorted
}

func (p TopupCampaignPeriod) dayBonusWindowValid() bool {
	return p.DayBonusRate > 0 && p.DayBonusStart > 0 && p.DayBonusEnd > p.DayBonusStart
}

// StatusAt reports the promotion phase of this period at the given time.
func (p TopupCampaignPeriod) StatusAt(now time.Time) string {
	if p.StartTime <= 0 || p.EndTime <= p.StartTime {
		return TopupCampaignStatusEnded
	}
	nowUnix := now.Unix()
	if nowUnix < p.StartTime {
		return TopupCampaignStatusUpcoming
	}
	if nowUnix > p.EndTime {
		return TopupCampaignStatusEnded
	}
	if p.dayBonusWindowValid() && nowUnix >= p.DayBonusStart && nowUnix <= p.DayBonusEnd {
		return TopupCampaignStatusDay
	}
	return TopupCampaignStatusLive
}

// ActiveAt reports whether a top-up completed at now counts toward this period.
func (p TopupCampaignPeriod) ActiveAt(now time.Time) bool {
	status := p.StatusAt(now)
	return status == TopupCampaignStatusLive || status == TopupCampaignStatusDay
}

func (p TopupCampaignPeriod) DayBonusActiveAt(now time.Time) bool {
	if !p.dayBonusWindowValid() {
		return false
	}
	nowUnix := now.Unix()
	return nowUnix >= p.DayBonusStart && nowUnix <= p.DayBonusEnd
}

// TierMinQuota converts a tier threshold to credited quota units.
func (p TopupCampaignPeriod) TierMinQuota(tier TopupCampaignTier) int64 {
	if common.QuotaPerUnit <= 0 {
		return 0
	}
	return decimal.NewFromFloat(tier.MinAmount).
		Mul(decimal.NewFromFloat(common.QuotaPerUnit)).
		IntPart()
}

// ReachedTierIndex returns the index of the highest reached tier, or -1.
func (p TopupCampaignPeriod) ReachedTierIndex(cumulativeQuota int64) int {
	index := -1
	for i, tier := range p.Tiers {
		if cumulativeQuota >= p.TierMinQuota(tier) {
			index = i
		}
	}
	return index
}

// UnlockedTierBonusQuota sums the independent bonus of every tier reached at
// the given cumulative top-up quota. Each bonus is paid once, including tiers
// crossed by a single top-up.
func (p TopupCampaignPeriod) UnlockedTierBonusQuota(cumulativeQuota int64) int64 {
	if common.QuotaPerUnit <= 0 {
		return 0
	}
	bonus := decimal.Zero
	for _, tier := range p.Tiers {
		if cumulativeQuota < p.TierMinQuota(tier) {
			break
		}
		bonus = bonus.Add(decimal.NewFromFloat(tier.BonusAmount).
			Mul(decimal.NewFromFloat(common.QuotaPerUnit)))
		if bonus.GreaterThan(decimal.NewFromInt(int64(common.MaxQuota))) {
			return int64(common.MaxQuota)
		}
	}
	return int64(common.QuotaFromDecimal(bonus))
}

// DayBonusQuota returns the extra bonus quota for one top-up on the day window.
func (p TopupCampaignPeriod) DayBonusQuota(amountQuota int64) int64 {
	if amountQuota <= 0 || p.DayBonusRate <= 0 {
		return 0
	}
	bonus := decimal.NewFromInt(amountQuota).Mul(decimal.NewFromFloat(p.DayBonusRate))
	return int64(common.QuotaFromDecimal(bonus))
}

// ValidateTopupCampaignOption validates campaign settings written through the
// admin options API. Values are normalized on read, but invalid input is
// rejected here so a bad save does not silently change the promotion.
func ValidateTopupCampaignOption(key string, value string) error {
	switch key {
	case TopupCampaignEnabledOption:
		return nil
	case TopupCampaignKeyOption:
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			return common.NewMessage("Campaign key cannot be empty")
		}
		if len(trimmed) > topupCampaignMaxKeyLength {
			return common.NewMessage("Campaign key cannot exceed 64 characters")
		}
		return nil
	case TopupCampaignStartTimeOption, TopupCampaignEndTimeOption,
		TopupCampaignDayBonusStartOption, TopupCampaignDayBonusEndOption:
		var timestamp int64
		if err := common.UnmarshalJsonStr(value, &timestamp); err != nil || timestamp < 0 {
			return common.NewMessage("Invalid date")
		}
		return nil
	case TopupCampaignDayBonusRateOption:
		var rate float64
		if err := common.UnmarshalJsonStr(value, &rate); err != nil || rate < 0 || rate > 1 {
			return common.NewMessage("Day bonus rate must be between 0 and 1")
		}
		return nil
	case TopupCampaignTiersOption:
		var tiers []TopupCampaignTier
		if err := common.UnmarshalJsonStr(value, &tiers); err != nil {
			return common.NewMessage("Invalid campaign tiers")
		}
		return validateTopupCampaignTiers(tiers)
	case TopupCampaignPeriodsOption:
		var periods []TopupCampaignPeriod
		if err := common.UnmarshalJsonStr(value, &periods); err != nil {
			return common.NewMessage("Invalid campaign periods")
		}
		if len(periods) == 0 {
			return common.NewMessage("Enter at least one campaign period")
		}
		if len(periods) > topupCampaignMaxPeriods {
			return common.NewMessage("At most 20 campaign periods")
		}
		return validateTopupCampaignPeriods(periods)
	}
	return nil
}

func validateTopupCampaignPeriods(periods []TopupCampaignPeriod) error {
	keys := make(map[string]struct{}, len(periods))
	for i, period := range periods {
		params := map[string]any{"index": i + 1}
		key := strings.TrimSpace(period.CampaignKey)
		if key == "" {
			return common.NewMessage("Period {{index}}: campaign key cannot be empty", params)
		}
		if len(key) > topupCampaignMaxKeyLength {
			return common.NewMessage("Period {{index}}: campaign key cannot exceed 64 characters", params)
		}
		if _, ok := keys[key]; ok {
			return common.NewMessage("Campaign keys must be unique across periods")
		}
		keys[key] = struct{}{}
		if period.StartTime <= 0 || period.EndTime <= period.StartTime {
			return common.NewMessage("Period {{index}}: end time must be after start time", params)
		}
		if period.DayBonusRate < 0 || period.DayBonusRate > 1 {
			return common.NewMessage("Period {{index}}: day bonus rate must be between 0 and 1", params)
		}
		if period.DayBonusStart != 0 || period.DayBonusEnd != 0 {
			if period.DayBonusEnd <= period.DayBonusStart {
				return common.NewMessage("Period {{index}}: bonus day end must be after bonus day start", params)
			}
			if period.DayBonusStart < period.StartTime || period.DayBonusEnd > period.EndTime {
				return common.NewMessage("Period {{index}}: bonus day window must be within the campaign period", params)
			}
		}
		if len(period.WhitelistUserIds) > topupCampaignMaxWhitelist {
			return common.NewMessage("Period {{index}}: at most 1000 whitelist user IDs", params)
		}
		for _, userId := range period.WhitelistUserIds {
			if userId <= 0 {
				return common.NewMessage("Period {{index}}: whitelist user IDs must be positive numbers", params)
			}
		}
		if err := validateTopupCampaignTiers(period.Tiers); err != nil {
			return common.NewMessage("Period {{index}} has invalid tiers: {{error}}", map[string]any{
				"index": i + 1,
				"error": err.Error(),
			})
		}
	}
	for i := range periods {
		for j := i + 1; j < len(periods); j++ {
			if periods[i].EndTime < periods[j].StartTime || periods[j].EndTime < periods[i].StartTime {
				continue
			}
			return common.NewMessage("Campaign periods cannot overlap")
		}
	}
	return nil
}

func validateTopupCampaignTiers(tiers []TopupCampaignTier) error {
	if len(tiers) == 0 {
		return common.NewMessage("Enter at least one tier")
	}
	if len(tiers) > topupCampaignMaxTiers {
		return common.NewMessage("At most 20 tiers")
	}
	previousMin := 0.0
	for i, tier := range tiers {
		if tier.MinAmount <= 0 || tier.MinAmount > topupCampaignMaxAmountUSD ||
			tier.BonusAmount <= 0 || tier.BonusAmount > topupCampaignMaxAmountUSD {
			return common.NewMessage("Tier amounts must be greater than 0", map[string]any{"index": i + 1})
		}
		if tier.MinAmount <= previousMin {
			return common.NewMessage("Tiers must be ordered by minimum amount.")
		}
		previousMin = tier.MinAmount
	}
	return nil
}
