package model

import (
	"strings"
	"time"
)

const (
	// SubscriptionResetModeAnchor means the next reset point is calculated from
	// the subscription start / last reset timestamp instead of calendar boundaries.
	SubscriptionResetModeAnchor = "anchor"
	// SubscriptionResetModeNatural means the next reset point is aligned to the
	// natural calendar boundary such as 00:00 / Monday / first day of month.
	SubscriptionResetModeNatural = "natural"
	// SubscriptionResetModeInterval is kept as a legacy alias for historical
	// hourly_reset_mode values written by older builds.
	SubscriptionResetModeInterval = "interval"
)

// NormalizeSubscriptionResetMode normalizes reset cycle mode and keeps legacy
// stored values (for example: "interval") backward compatible.
func NormalizeSubscriptionResetMode(mode string) string {
	switch strings.TrimSpace(mode) {
	case SubscriptionResetModeNatural:
		return SubscriptionResetModeNatural
	case SubscriptionResetModeAnchor, SubscriptionResetModeInterval:
		return SubscriptionResetModeAnchor
	default:
		return SubscriptionResetModeAnchor
	}
}

func calcNextNaturalDailyResetTime(base time.Time) time.Time {
	return time.Date(base.Year(), base.Month(), base.Day(), 0, 0, 0, 0, base.Location()).
		AddDate(0, 0, 1)
}

func calcNextNaturalWeeklyResetTime(base time.Time) time.Time {
	weekday := int(base.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	daysUntilMonday := 8 - weekday
	return time.Date(base.Year(), base.Month(), base.Day(), 0, 0, 0, 0, base.Location()).
		AddDate(0, 0, daysUntilMonday)
}

func calcNextNaturalMonthlyResetTime(base time.Time) time.Time {
	return time.Date(base.Year(), base.Month(), 1, 0, 0, 0, 0, base.Location()).
		AddDate(0, 1, 0)
}

func clampResetTimeToSubscriptionEnd(next time.Time, endUnix int64) int64 {
	nextUnix := next.Unix()
	if endUnix > 0 && nextUnix > endUnix {
		return 0
	}
	return nextUnix
}
