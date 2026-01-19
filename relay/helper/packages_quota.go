package helper

import (
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
)

type SubscriptionUsageDetail struct {
	SubscriptionId string `json:"subscription_id"`
	PlanType       string `json:"plan_type"`
	Quota          int    `json:"quota"`
	EndTime        int64  `json:"end_time"`
}

type SubscriptionQuotaResult struct {
	SubscriptionHashId  string
	PackageServiceType  string
	SubscriptionQuota   int
	QuotaFromBalance    int
	SubscriptionHandled bool
	SubscriptionsUsed   []SubscriptionUsageDetail
}

func ApplySubscriptionQuota(relayInfo *relaycommon.RelayInfo, totalQuota int) (*SubscriptionQuotaResult, error) {
	if relayInfo == nil || totalQuota <= 0 {
		return nil, nil
	}

	serviceType := relayInfo.PackageServiceType
	if serviceType == "" {
		return nil, nil
	}

	tokenGroup := relayInfo.TokenGroup
	if tokenGroup == "" {
		tokenGroup = relayInfo.UsingGroup
	}

	filter := model.PackagesSubscription{ServiceType: serviceType}
	subscriptions, err := model.GetUserActivePackagesSubscriptions(relayInfo.UserId, filter, true)
	if err != nil || len(subscriptions) == 0 {
		return nil, err
	}

	remainingQuota := totalQuota
	result := &SubscriptionQuotaResult{PackageServiceType: serviceType}
	result.SubscriptionsUsed = make([]SubscriptionUsageDetail, 0, len(subscriptions))

	for i := range subscriptions {
		if remainingQuota <= 0 {
			break
		}
		sub := &subscriptions[i]
		deducted, updateErr := model.UpdateSubscriptionPackageUsage(sub.Id, remainingQuota, tokenGroup)
		if updateErr != nil {
			continue
		}
		if deducted <= 0 {
			continue
		}

		result.SubscriptionQuota += deducted
		remainingQuota -= deducted
		result.SubscriptionsUsed = append(result.SubscriptionsUsed, SubscriptionUsageDetail{
			SubscriptionId: sub.HashId,
			PlanType:       sub.PlanType,
			Quota:          deducted,
			EndTime:        sub.EndTime,
		})
		if !result.SubscriptionHandled {
			result.SubscriptionHashId = sub.HashId
			result.SubscriptionHandled = true
		}
	}

	if result.SubscriptionHandled && result.SubscriptionQuota > 0 {
		result.QuotaFromBalance = remainingQuota
		if remainingQuota <= 0 {
			result.QuotaFromBalance = 0
		}
	}

	if result.SubscriptionHandled && remainingQuota < totalQuota {
		if remainingQuota > 0 {
			return result, nil
		}
		return result, nil
	}

	return nil, nil
}

func BuildSubscriptionLogMeta(relayInfo *relaycommon.RelayInfo, usageMeta map[string]interface{}, result *SubscriptionQuotaResult) map[string]interface{} {
	if usageMeta == nil {
		usageMeta = map[string]interface{}{}
	}
	if result == nil {
		return usageMeta
	}

	usageMeta["billing_type"] = "resource_package"
	usageMeta["resource_package_id"] = result.SubscriptionHashId
	usageMeta["package_service_type"] = result.PackageServiceType
	if len(result.SubscriptionsUsed) > 0 {
		usageMeta["subscriptions_used"] = result.SubscriptionsUsed
	}
	usageMeta["quota_from_subscription"] = result.SubscriptionQuota
	usageMeta["quota_from_balance"] = result.QuotaFromBalance
	usageMeta["total_quota"] = result.SubscriptionQuota + result.QuotaFromBalance

	return usageMeta
}

func ClampQuotaForSubscription(totalQuota int) int {
	if totalQuota < 0 {
		return 0
	}
	return totalQuota
}

func ApplySubscriptionDeduction(relayInfo *relaycommon.RelayInfo, quota int) (int, *SubscriptionQuotaResult, error) {
	quota = ClampQuotaForSubscription(quota)
	result, err := ApplySubscriptionQuota(relayInfo, quota)
	if err != nil || result == nil {
		return quota, nil, err
	}

	if result.SubscriptionHandled && result.SubscriptionQuota > 0 {
		if result.QuotaFromBalance <= 0 {
			return 0, result, nil
		}
		return result.QuotaFromBalance, result, nil
	}

	return quota, nil, nil
}

func ShouldSkipPreConsume(relayInfo *relaycommon.RelayInfo) bool {
	return relayInfo != nil && relayInfo.PackageServiceType != ""
}
