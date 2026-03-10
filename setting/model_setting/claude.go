package model_setting

import (
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/setting/config"
)

//var claudeHeadersSettings = map[string][]string{}
//
//var ClaudeThinkingAdapterEnabled = true
//var ClaudeThinkingAdapterMaxTokens = 8192
//var ClaudeThinkingAdapterBudgetTokensPercentage = 0.8

// ClaudeSettings 定义Claude模型的配置
type ClaudeSettings struct {
	HeadersSettings                       map[string]map[string][]string `json:"model_headers_settings"`
	DefaultMaxTokens                      map[string]int                 `json:"default_max_tokens"`
	ThinkingAdapterEnabled                bool                           `json:"thinking_adapter_enabled"`
	ThinkingAdapterBudgetTokensPercentage float64                        `json:"thinking_adapter_budget_tokens_percentage"`

	// LongPromptPricing* controls the pricing tier when total prompt tokens exceed a threshold.
	// Note: bool config keys should end with enabled/Enabled for the UI to parse as boolean.
	LongPromptPricingEnabled        bool  `json:"long_prompt_pricing_enabled"`
	LongPromptPricingRolloutUserIds []int `json:"long_prompt_pricing_rollout_user_ids"`
	// LongPromptPricingRolloutPercentUserIds is a deprecated alias for rollout allowlist.
	// Keep it for backward compatibility with legacy option key:
	// `claude.long_prompt_pricing_rollout_percent`.
	LongPromptPricingRolloutPercentUserIds []int   `json:"long_prompt_pricing_rollout_percent"`
	LongPromptPricingThresholdTokens       int     `json:"long_prompt_pricing_threshold_tokens"`
	LongPromptPricingInputPriceMultiplier  float64 `json:"long_prompt_pricing_input_price_multiplier"`
	LongPromptPricingOutputPriceMultiplier float64 `json:"long_prompt_pricing_output_price_multiplier"`
}

// 默认配置
var defaultClaudeSettings = ClaudeSettings{
	HeadersSettings:        map[string]map[string][]string{},
	ThinkingAdapterEnabled: true,
	DefaultMaxTokens: map[string]int{
		"default": 8192,
	},
	ThinkingAdapterBudgetTokensPercentage: 0.8,

	LongPromptPricingEnabled:               true,
	LongPromptPricingRolloutUserIds:        []int{},
	LongPromptPricingRolloutPercentUserIds: []int{},
	LongPromptPricingThresholdTokens:       200000,
	LongPromptPricingInputPriceMultiplier:  2.0,
	LongPromptPricingOutputPriceMultiplier: 1.5,
}

// 全局实例
var claudeSettings = defaultClaudeSettings

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("claude", &claudeSettings)
}

// GetClaudeSettings 获取Claude配置
func GetClaudeSettings() *ClaudeSettings {
	// check default max tokens must have default key
	if _, ok := claudeSettings.DefaultMaxTokens["default"]; !ok {
		claudeSettings.DefaultMaxTokens["default"] = 8192
	}
	return &claudeSettings
}

func (c *ClaudeSettings) GetLongPromptPricingEnabled() bool {
	return c.LongPromptPricingEnabled
}

func (c *ClaudeSettings) GetLongPromptPricingRolloutUserIds() []int {
	// Canonical key: `claude.long_prompt_pricing_rollout_user_ids`.
	// Fallback to deprecated alias for backward compatibility.
	if len(c.LongPromptPricingRolloutUserIds) > 0 {
		return c.LongPromptPricingRolloutUserIds
	}
	return c.LongPromptPricingRolloutPercentUserIds
}

func (c *ClaudeSettings) GetLongPromptPricingThresholdTokens() int {
	if c.LongPromptPricingThresholdTokens <= 0 {
		return 200000
	}
	return c.LongPromptPricingThresholdTokens
}

func (c *ClaudeSettings) GetLongPromptPricingInputPriceMultiplier() float64 {
	if c.LongPromptPricingInputPriceMultiplier <= 0 {
		return 2.0
	}
	return c.LongPromptPricingInputPriceMultiplier
}

func (c *ClaudeSettings) GetLongPromptPricingOutputPriceMultiplier() float64 {
	if c.LongPromptPricingOutputPriceMultiplier <= 0 {
		return 1.5
	}
	return c.LongPromptPricingOutputPriceMultiplier
}

func (c *ClaudeSettings) GetLongPromptPricingCompletionRatioMultiplier() float64 {
	inputMultiplier := c.GetLongPromptPricingInputPriceMultiplier()
	if inputMultiplier <= 0 {
		return 0.75
	}
	return c.GetLongPromptPricingOutputPriceMultiplier() / inputMultiplier
}

func (c *ClaudeSettings) WriteHeaders(originModel string, httpHeader *http.Header) {
	if headers, ok := c.HeadersSettings[originModel]; ok {
		for headerKey, headerValues := range headers {
			mergedValues := normalizeHeaderListValues(
				append(append([]string(nil), httpHeader.Values(headerKey)...), headerValues...),
			)
			if len(mergedValues) == 0 {
				continue
			}
			httpHeader.Set(headerKey, strings.Join(mergedValues, ","))
		}
	}
}

func normalizeHeaderListValues(values []string) []string {
	normalizedValues := make([]string, 0, len(values))
	seenValues := make(map[string]struct{}, len(values))
	for _, value := range values {
		for _, item := range strings.Split(value, ",") {
			normalizedItem := strings.TrimSpace(item)
			if normalizedItem == "" {
				continue
			}
			if _, exists := seenValues[normalizedItem]; exists {
				continue
			}
			seenValues[normalizedItem] = struct{}{}
			normalizedValues = append(normalizedValues, normalizedItem)
		}
	}
	return normalizedValues
}

func (c *ClaudeSettings) GetDefaultMaxTokens(model string) int {
	if maxTokens, ok := c.DefaultMaxTokens[model]; ok {
		return maxTokens
	}
	return c.DefaultMaxTokens["default"]
}
