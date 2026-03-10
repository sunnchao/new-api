package model_setting

import "github.com/QuantumNous/new-api/setting/config"

// TokenTierPricingRule defines one tier billing rule.
// 注意：bool字段以 enabled 结尾，便于前端自动识别布尔配置项。
type TokenTierPricingRule struct {
	ID                    string   `json:"id"`
	Enabled               bool     `json:"enabled"`
	ModelPatterns         []string `json:"model_patterns"`
	MinPromptTokens       int      `json:"min_prompt_tokens"`
	MaxPromptTokens       int      `json:"max_prompt_tokens"`
	InputPriceMultiplier  float64  `json:"input_price_multiplier"`
	OutputPriceMultiplier float64  `json:"output_price_multiplier"`
	RolloutUserIds        []int    `json:"rollout_user_ids"`
}

// TokenTierPricingSettings defines global settings for generic token tier billing.
type TokenTierPricingSettings struct {
	Enabled bool                   `json:"enabled"`
	Rules   []TokenTierPricingRule `json:"rules"`
}

var defaultTokenTierPricingSettings = TokenTierPricingSettings{
	Enabled: false,
	Rules:   []TokenTierPricingRule{},
}

var tokenTierPricingSettings = defaultTokenTierPricingSettings

func init() {
	config.GlobalConfig.Register("tier_pricing", &tokenTierPricingSettings)
}

func GetTokenTierPricingSettings() *TokenTierPricingSettings {
	return &tokenTierPricingSettings
}
