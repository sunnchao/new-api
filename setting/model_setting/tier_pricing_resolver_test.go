package model_setting

import (
	"math"
	"testing"
)

func TestResolveTokenTierPricing_NoRuleReturnsBase(t *testing.T) {
	origTier := tokenTierPricingSettings
	origClaude := claudeSettings
	defer func() {
		tokenTierPricingSettings = origTier
		claudeSettings = origClaude
	}()

	tokenTierPricingSettings = TokenTierPricingSettings{Enabled: false, Rules: []TokenTierPricingRule{}}
	claudeSettings.LongPromptPricingEnabled = false

	result := ResolveTokenTierPricing(TokenTierResolveInput{
		UserID:          1,
		ModelName:       "gpt-4o",
		PromptTokens:    200000,
		ModelRatio:      2.5,
		CompletionRatio: 4,
	})

	if result.Applied {
		t.Fatalf("expected no tier to be applied")
	}
	if result.Source != TokenTierSourceNone {
		t.Fatalf("expected source none, got %s", result.Source)
	}
	if result.ModelRatio != 2.5 {
		t.Fatalf("expected model ratio unchanged, got %f", result.ModelRatio)
	}
	if result.CompletionRatio != 4 {
		t.Fatalf("expected completion ratio unchanged, got %f", result.CompletionRatio)
	}
}

func TestResolveTokenTierPricing_GenericRuleMatch(t *testing.T) {
	origTier := tokenTierPricingSettings
	origClaude := claudeSettings
	defer func() {
		tokenTierPricingSettings = origTier
		claudeSettings = origClaude
	}()

	tokenTierPricingSettings = TokenTierPricingSettings{
		Enabled: true,
		Rules: []TokenTierPricingRule{
			{
				ID:                    "gpt-4o-long",
				Enabled:               true,
				ModelPatterns:         []string{"gpt-4o*"},
				MinPromptTokens:       100000,
				InputPriceMultiplier:  2.0,
				OutputPriceMultiplier: 1.5,
			},
		},
	}
	claudeSettings.LongPromptPricingEnabled = false

	result := ResolveTokenTierPricing(TokenTierResolveInput{
		UserID:          1,
		ModelName:       "gpt-4o-2024-08-06",
		PromptTokens:    120000,
		ModelRatio:      1.25,
		CompletionRatio: 4,
	})

	if !result.Applied {
		t.Fatalf("expected generic tier to be applied")
	}
	if result.Source != TokenTierSourceGeneric {
		t.Fatalf("expected generic source, got %s", result.Source)
	}
	if result.RuleID != "gpt-4o-long" {
		t.Fatalf("expected rule id gpt-4o-long, got %s", result.RuleID)
	}
	if !floatEquals(result.ModelRatio, 2.5, 1e-9) {
		t.Fatalf("expected model ratio 2.5, got %f", result.ModelRatio)
	}
	if !floatEquals(result.CompletionRatio, 3, 1e-9) {
		t.Fatalf("expected completion ratio 3, got %f", result.CompletionRatio)
	}
}

func TestResolveTokenTierPricing_GenericPrecedenceOverClaudeLegacy(t *testing.T) {
	origTier := tokenTierPricingSettings
	origClaude := claudeSettings
	defer func() {
		tokenTierPricingSettings = origTier
		claudeSettings = origClaude
	}()

	tokenTierPricingSettings = TokenTierPricingSettings{
		Enabled: true,
		Rules: []TokenTierPricingRule{
			{
				ID:                    "claude-generic",
				Enabled:               true,
				ModelPatterns:         []string{"claude-*"},
				MinPromptTokens:       1,
				InputPriceMultiplier:  1.2,
				OutputPriceMultiplier: 1.2,
			},
		},
	}
	claudeSettings.LongPromptPricingEnabled = true
	claudeSettings.LongPromptPricingRolloutUserIds = []int{42}
	claudeSettings.LongPromptPricingThresholdTokens = 100
	claudeSettings.LongPromptPricingInputPriceMultiplier = 2
	claudeSettings.LongPromptPricingOutputPriceMultiplier = 1.5

	result := ResolveTokenTierPricing(TokenTierResolveInput{
		UserID:          42,
		ModelName:       "claude-sonnet-4-20250514",
		PromptTokens:    200,
		ModelRatio:      5,
		CompletionRatio: 5,
	})

	if !result.Applied {
		t.Fatalf("expected tier to be applied")
	}
	if result.Source != TokenTierSourceGeneric {
		t.Fatalf("expected generic source to win precedence, got %s", result.Source)
	}
	if !floatEquals(result.ModelRatio, 6, 1e-9) {
		t.Fatalf("expected model ratio 6, got %f", result.ModelRatio)
	}
	if !floatEquals(result.CompletionRatio, 5, 1e-9) {
		t.Fatalf("expected completion ratio 5, got %f", result.CompletionRatio)
	}
}

func TestResolveTokenTierPricing_ClaudeLegacyFallback(t *testing.T) {
	origTier := tokenTierPricingSettings
	origClaude := claudeSettings
	defer func() {
		tokenTierPricingSettings = origTier
		claudeSettings = origClaude
	}()

	tokenTierPricingSettings = TokenTierPricingSettings{Enabled: false, Rules: []TokenTierPricingRule{}}
	claudeSettings.LongPromptPricingEnabled = true
	claudeSettings.LongPromptPricingRolloutUserIds = []int{7}
	claudeSettings.LongPromptPricingThresholdTokens = 100
	claudeSettings.LongPromptPricingInputPriceMultiplier = 2
	claudeSettings.LongPromptPricingOutputPriceMultiplier = 1.5

	result := ResolveTokenTierPricing(TokenTierResolveInput{
		UserID:          7,
		ModelName:       "claude-3-7-sonnet-20250219",
		PromptTokens:    101,
		ModelRatio:      2,
		CompletionRatio: 4,
	})

	if !result.Applied {
		t.Fatalf("expected claude legacy tier to be applied")
	}
	if result.Source != TokenTierSourceClaudeLegacy {
		t.Fatalf("expected claude legacy source, got %s", result.Source)
	}
	if !floatEquals(result.ModelRatio, 4, 1e-9) {
		t.Fatalf("expected model ratio 4, got %f", result.ModelRatio)
	}
	if !floatEquals(result.CompletionRatio, 3, 1e-9) {
		t.Fatalf("expected completion ratio 3, got %f", result.CompletionRatio)
	}
}

func TestResolveTokenTierPricing_ChooseHighestMinPromptTier(t *testing.T) {
	origTier := tokenTierPricingSettings
	origClaude := claudeSettings
	defer func() {
		tokenTierPricingSettings = origTier
		claudeSettings = origClaude
	}()

	tokenTierPricingSettings = TokenTierPricingSettings{
		Enabled: true,
		Rules: []TokenTierPricingRule{
			{
				ID:                    "tier-a",
				Enabled:               true,
				ModelPatterns:         []string{"gpt-5*"},
				MinPromptTokens:       100000,
				InputPriceMultiplier:  2,
				OutputPriceMultiplier: 1.5,
			},
			{
				ID:                    "tier-b",
				Enabled:               true,
				ModelPatterns:         []string{"gpt-5*"},
				MinPromptTokens:       200000,
				InputPriceMultiplier:  3,
				OutputPriceMultiplier: 2,
			},
		},
	}
	claudeSettings.LongPromptPricingEnabled = false

	result := ResolveTokenTierPricing(TokenTierResolveInput{
		UserID:          100,
		ModelName:       "gpt-5-2025-08-07",
		PromptTokens:    250000,
		ModelRatio:      0.625,
		CompletionRatio: 8,
	})

	if !result.Applied {
		t.Fatalf("expected generic tier to be applied")
	}
	if result.RuleID != "tier-b" {
		t.Fatalf("expected highest min_prompt tier-b, got %s", result.RuleID)
	}
	if !floatEquals(result.ModelRatio, 1.875, 1e-9) {
		t.Fatalf("expected model ratio 1.875, got %f", result.ModelRatio)
	}
	if !floatEquals(result.CompletionRatio, 5.333333333333333, 1e-9) {
		t.Fatalf("unexpected completion ratio %f", result.CompletionRatio)
	}
}

func floatEquals(a, b, eps float64) bool {
	return math.Abs(a-b) <= eps
}
