package operation_setting

import (
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
)

const (
	GiftQuotaExpirationModePermanent = "permanent"
	GiftQuotaExpirationModeDuration  = "duration"
	GiftQuotaExpirationUnitDay       = "day"
	GiftQuotaExpirationUnitMonth     = "month"

	GiftQuotaCheckinExpirationOption    = "gift_quota_expiration_setting.checkin"
	GiftQuotaTopupBonusExpirationOption = "gift_quota_expiration_setting.topup_bonus"
)

type GiftQuotaExpirationPolicy struct {
	Mode  string `json:"mode"`
	Unit  string `json:"unit"`
	Value int    `json:"value"`
}

type GiftQuotaExpirationSetting struct {
	Checkin    GiftQuotaExpirationPolicy `json:"checkin"`
	TopupBonus GiftQuotaExpirationPolicy `json:"topup_bonus"`
}

var giftQuotaExpirationSetting = GiftQuotaExpirationSetting{
	Checkin: GiftQuotaExpirationPolicy{
		Mode: GiftQuotaExpirationModePermanent,
		Unit: GiftQuotaExpirationUnitDay,
	},
	TopupBonus: GiftQuotaExpirationPolicy{
		Mode: GiftQuotaExpirationModePermanent,
		Unit: GiftQuotaExpirationUnitDay,
	},
}

func init() {
	config.GlobalConfig.Register("gift_quota_expiration_setting", &giftQuotaExpirationSetting)
}

func GetCheckinGiftQuotaExpirationPolicy() GiftQuotaExpirationPolicy {
	return giftQuotaExpirationSetting.Checkin.normalized()
}

func GetTopupBonusGiftQuotaExpirationPolicy() GiftQuotaExpirationPolicy {
	return giftQuotaExpirationSetting.TopupBonus.normalized()
}

func ValidateGiftQuotaExpirationOption(key string, value string) error {
	if key != GiftQuotaCheckinExpirationOption && key != GiftQuotaTopupBonusExpirationOption {
		return nil
	}
	var policy GiftQuotaExpirationPolicy
	if err := common.UnmarshalJsonStr(value, &policy); err != nil {
		return fmt.Errorf("invalid gift quota expiration policy: %w", err)
	}
	return policy.Validate()
}

func (p GiftQuotaExpirationPolicy) Validate() error {
	switch p.Mode {
	case GiftQuotaExpirationModePermanent:
		return nil
	case GiftQuotaExpirationModeDuration:
	default:
		return fmt.Errorf("unsupported expiration mode %q", p.Mode)
	}

	if p.Value <= 0 {
		return fmt.Errorf("expiration value must be positive")
	}
	switch p.Unit {
	case GiftQuotaExpirationUnitDay:
		if p.Value > 3650 {
			return fmt.Errorf("expiration days cannot exceed 3650")
		}
	case GiftQuotaExpirationUnitMonth:
		if p.Value > 120 {
			return fmt.Errorf("expiration months cannot exceed 120")
		}
	default:
		return fmt.Errorf("unsupported expiration unit %q", p.Unit)
	}
	return nil
}

func (p GiftQuotaExpirationPolicy) ExpiresAt(grantedAt time.Time) int64 {
	p = p.normalized()
	if p.Mode == GiftQuotaExpirationModePermanent {
		return 0
	}

	grantedAt = grantedAt.UTC()
	if p.Unit == GiftQuotaExpirationUnitDay {
		return grantedAt.AddDate(0, 0, p.Value).Unix()
	}

	targetMonth := time.Date(grantedAt.Year(), grantedAt.Month()+time.Month(p.Value), 1,
		grantedAt.Hour(), grantedAt.Minute(), grantedAt.Second(), grantedAt.Nanosecond(), time.UTC)
	lastDay := time.Date(targetMonth.Year(), targetMonth.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
	day := grantedAt.Day()
	if day > lastDay {
		day = lastDay
	}
	return time.Date(targetMonth.Year(), targetMonth.Month(), day,
		grantedAt.Hour(), grantedAt.Minute(), grantedAt.Second(), grantedAt.Nanosecond(), time.UTC).Unix()
}

func (p GiftQuotaExpirationPolicy) normalized() GiftQuotaExpirationPolicy {
	if p.Validate() == nil {
		return p
	}
	return GiftQuotaExpirationPolicy{
		Mode: GiftQuotaExpirationModePermanent,
		Unit: GiftQuotaExpirationUnitDay,
	}
}
