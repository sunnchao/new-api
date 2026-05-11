package model

import "strings"

const (
	RedemptionTypeQuota        = "quota"
	RedemptionTypeSubscription = "subscription"
)

type RedemptionResult struct {
	Type         string            `json:"type"`
	Quota        int               `json:"quota,omitempty"`
	Subscription *UserSubscription `json:"subscription,omitempty"`
	Plan         *SubscriptionPlan `json:"plan,omitempty"`
}

func normalizeRedemptionType(redemptionType string) string {
	switch strings.TrimSpace(redemptionType) {
	case RedemptionTypeSubscription:
		return RedemptionTypeSubscription
	default:
		return RedemptionTypeQuota
	}
}
