package model_setting

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

const (
	TokenTierSourceNone         = "none"
	TokenTierSourceGeneric      = "generic"
	TokenTierSourceClaudeLegacy = "claude_legacy"
)

type TokenTierResolveInput struct {
	UserID          int
	ModelName       string
	PromptTokens    int
	ModelRatio      float64
	CompletionRatio float64
}

type TokenTierResolveResult struct {
	Applied               bool
	Source                string
	RuleID                string
	ThresholdTokens       int
	InputPriceMultiplier  float64
	OutputPriceMultiplier float64
	RolloutMode           string
	RolloutAllowlistSize  int

	ModelRatio      float64
	CompletionRatio float64
}

func ResolveTokenTierPricing(input TokenTierResolveInput) TokenTierResolveResult {
	baseResult := TokenTierResolveResult{
		Applied:              false,
		Source:               TokenTierSourceNone,
		ModelRatio:           input.ModelRatio,
		CompletionRatio:      input.CompletionRatio,
		ThresholdTokens:      0,
		RolloutMode:          "",
		RolloutAllowlistSize: 0,
	}

	if genericResult, ok := resolveGenericTokenTierPricing(input); ok {
		return genericResult
	}

	if legacyResult, ok := resolveClaudeLegacyTierPricing(input); ok {
		return legacyResult
	}

	return baseResult
}

func resolveGenericTokenTierPricing(input TokenTierResolveInput) (TokenTierResolveResult, bool) {
	settings := GetTokenTierPricingSettings()
	if settings == nil || !settings.Enabled || len(settings.Rules) == 0 {
		return TokenTierResolveResult{}, false
	}

	normalizedModel := ratio_setting.FormatMatchingModelName(input.ModelName)
	matchedRule, ok := findMatchedTierRule(settings.Rules, input.UserID, input.ModelName, normalizedModel, input.PromptTokens)
	if !ok {
		return TokenTierResolveResult{}, false
	}

	if matchedRule.InputPriceMultiplier <= 0 || matchedRule.OutputPriceMultiplier <= 0 {
		return TokenTierResolveResult{}, false
	}

	completionRatioMultiplier := common.CompletionRatioMultiplierFromPrices(matchedRule.InputPriceMultiplier, matchedRule.OutputPriceMultiplier)
	result := TokenTierResolveResult{
		Applied:               true,
		Source:                TokenTierSourceGeneric,
		RuleID:                matchedRule.ID,
		ThresholdTokens:       matchedRule.MinPromptTokens,
		InputPriceMultiplier:  matchedRule.InputPriceMultiplier,
		OutputPriceMultiplier: matchedRule.OutputPriceMultiplier,
		ModelRatio:            input.ModelRatio * matchedRule.InputPriceMultiplier,
		CompletionRatio:       input.CompletionRatio * completionRatioMultiplier,
	}
	if len(matchedRule.RolloutUserIds) > 0 {
		result.RolloutMode = "allowlist"
		result.RolloutAllowlistSize = len(matchedRule.RolloutUserIds)
	}
	return result, true
}

func resolveClaudeLegacyTierPricing(input TokenTierResolveInput) (TokenTierResolveResult, bool) {
	if !common.IsClaudeModel(input.ModelName) {
		return TokenTierResolveResult{}, false
	}

	claudeCfg := GetClaudeSettings()
	allowlist := claudeCfg.GetLongPromptPricingRolloutUserIds()
	if !claudeCfg.GetLongPromptPricingEnabled() || !common.ShouldApplyClaudeLongPromptRollout(input.UserID, allowlist) {
		return TokenTierResolveResult{}, false
	}

	threshold := claudeCfg.GetLongPromptPricingThresholdTokens()
	inputMultiplier := claudeCfg.GetLongPromptPricingInputPriceMultiplier()
	outputMultiplier := claudeCfg.GetLongPromptPricingOutputPriceMultiplier()

	modelRatio, completionRatio, applied := common.ApplyClaudeLongPromptTier(
		input.PromptTokens,
		threshold,
		inputMultiplier,
		outputMultiplier,
		input.ModelRatio,
		input.CompletionRatio,
	)
	if !applied {
		return TokenTierResolveResult{}, false
	}

	result := TokenTierResolveResult{
		Applied:               true,
		Source:                TokenTierSourceClaudeLegacy,
		RuleID:                "claude.long_prompt_pricing",
		ThresholdTokens:       threshold,
		InputPriceMultiplier:  inputMultiplier,
		OutputPriceMultiplier: outputMultiplier,
		RolloutMode:           "allowlist",
		RolloutAllowlistSize:  len(allowlist),
		ModelRatio:            modelRatio,
		CompletionRatio:       completionRatio,
	}
	return result, true
}

func findMatchedTierRule(rules []TokenTierPricingRule, userID int, modelName string, normalizedModelName string, promptTokens int) (TokenTierPricingRule, bool) {
	bestIndex := -1
	bestRule := TokenTierPricingRule{}

	for index, rule := range rules {
		if !rule.Enabled {
			continue
		}
		if !matchTierModelPatterns(modelName, normalizedModelName, rule.ModelPatterns) {
			continue
		}
		if !matchPromptTokenRange(promptTokens, rule.MinPromptTokens, rule.MaxPromptTokens) {
			continue
		}
		if len(rule.RolloutUserIds) > 0 && !containsInt(rule.RolloutUserIds, userID) {
			continue
		}

		if bestIndex == -1 {
			bestIndex = index
			bestRule = rule
			continue
		}

		if rule.MinPromptTokens > bestRule.MinPromptTokens {
			bestIndex = index
			bestRule = rule
			continue
		}

		if rule.MinPromptTokens == bestRule.MinPromptTokens {
			bestHasMax := bestRule.MaxPromptTokens > 0
			currentHasMax := rule.MaxPromptTokens > 0
			if currentHasMax && (!bestHasMax || rule.MaxPromptTokens < bestRule.MaxPromptTokens) {
				bestIndex = index
				bestRule = rule
			}
		}
	}

	if bestIndex == -1 {
		return TokenTierPricingRule{}, false
	}

	return bestRule, true
}

func matchTierModelPatterns(modelName string, normalizedModelName string, patterns []string) bool {
	if len(patterns) == 0 {
		return false
	}

	for _, pattern := range patterns {
		trimmed := strings.TrimSpace(pattern)
		if trimmed == "" {
			continue
		}
		if matchTierModelPattern(modelName, trimmed) || matchTierModelPattern(normalizedModelName, trimmed) {
			return true
		}
	}

	return false
}

func matchTierModelPattern(modelName string, pattern string) bool {
	if pattern == "*" {
		return true
	}

	if strings.HasSuffix(pattern, "*") {
		prefix := strings.TrimSuffix(pattern, "*")
		return strings.HasPrefix(modelName, prefix)
	}

	return modelName == pattern
}

func matchPromptTokenRange(promptTokens int, minPromptTokens int, maxPromptTokens int) bool {
	if minPromptTokens > 0 && promptTokens < minPromptTokens {
		return false
	}
	if maxPromptTokens > 0 && promptTokens > maxPromptTokens {
		return false
	}
	return true
}

func containsInt(list []int, target int) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}
