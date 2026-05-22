package service

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/types"
)

func formatWalletFundingFailureMessage(userQuota int, needQuota int) string {
	message := fmt.Sprintf("余额不足：当前余额 %s", logger.FormatQuota(userQuota))
	if needQuota > 0 {
		message += fmt.Sprintf("，本次需要 %s", logger.FormatQuota(needQuota))
	}
	return message
}

func formatSubscriptionFundingFailureMessage(err *model.SubscriptionQuotaInsufficientError) string {
	if err == nil {
		return "订阅额度不足"
	}
	if err.BillingMode == model.SubscriptionBillingModeRequest {
		message := fmt.Sprintf("订阅请求次数不足：剩余请求次数 %d，本次需要 %d", err.Remain, err.Need)
		if reset := formatSubscriptionResetTime(err); reset != "" {
			message += "，下次重置时间：" + reset
		}
		return message
	}
	message := fmt.Sprintf("订阅额度不足：剩余额度 %s，本次需要 %s", logger.FormatQuota(int(err.Remain)), logger.FormatQuota(int(err.Need)))
	if reset := formatSubscriptionResetTime(err); reset != "" {
		message += "，下次重置时间：" + reset
	}
	return message
}

func formatCombinedFundingFailureMessage(primary *types.NewAPIError, fallback *types.NewAPIError) string {
	parts := make([]string, 0, 2)
	primaryMessage := apiErrorMessage(primary)
	if primaryMessage != "" {
		parts = append(parts, normalizeCombinedFundingFailurePart(primaryMessage))
	}
	fallbackMessage := apiErrorMessage(fallback)
	if fallbackMessage != "" && fallbackMessage != primaryMessage {
		parts = append(parts, normalizeCombinedFundingFailurePart(fallbackMessage))
	}
	if len(parts) == 0 {
		return "额度不足"
	}
	if len(parts) == 1 {
		return parts[0]
	}
	numbered := make([]string, 0, len(parts))
	for i, part := range parts {
		numbered = append(numbered, fundingFailureOrdinal(i)+part)
	}
	return "额度不足：" + strings.Join(numbered, "；")
}

func apiErrorMessage(err *types.NewAPIError) string {
	if err == nil {
		return ""
	}
	return strings.TrimSpace(err.Error())
}

func normalizeCombinedFundingFailurePart(message string) string {
	message = strings.TrimSpace(message)
	switch {
	case strings.HasPrefix(message, "余额不足："),
		strings.HasPrefix(message, "订阅额度不足："),
		strings.HasPrefix(message, "订阅请求次数不足："):
		return strings.Replace(message, "：", "，", 1)
	case strings.HasPrefix(message, "预扣费额度失败, "):
		return "余额不足，" + strings.TrimPrefix(message, "预扣费额度失败, ")
	}
	return message
}

func fundingFailureOrdinal(index int) string {
	switch index {
	case 0:
		return "①"
	case 1:
		return "②"
	default:
		return fmt.Sprintf("%d.", index+1)
	}
}
