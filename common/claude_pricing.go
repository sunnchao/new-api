package common

import (
	"hash/fnv"
	"math"
	"strconv"
	"strings"
)

const claudeRolloutBuckets = 10000

func IsClaudeModel(name string) bool {
	name = strings.ToLower(name)
	if strings.HasPrefix(name, "claude-") {
		return true
	}
	// Some providers (e.g. OpenRouter) may use names like "anthropic/claude-...".
	if strings.HasPrefix(name, "anthropic/claude-") || strings.Contains(name, "/claude-") {
		return true
	}
	return false
}

func IsClaudeLongPrompt(totalPromptTokens int, thresholdTokens int) bool {
	if thresholdTokens <= 0 {
		return false
	}
	return totalPromptTokens > thresholdTokens
}

func CompletionRatioMultiplierFromPrices(inputPriceMultiplier, outputPriceMultiplier float64) float64 {
	if inputPriceMultiplier <= 0 || outputPriceMultiplier <= 0 {
		return 1
	}
	return outputPriceMultiplier / inputPriceMultiplier
}

// ApplyClaudeLongPromptTier applies Claude's long-prompt tier to (modelRatio, completionRatio).
//
// The caller is responsible for gating by model type, rollout, and UsePrice.
func ApplyClaudeLongPromptTier(
	totalPromptTokens int,
	thresholdTokens int,
	inputPriceMultiplier float64,
	outputPriceMultiplier float64,
	modelRatio float64,
	completionRatio float64,
) (float64, float64, bool) {
	if !IsClaudeLongPrompt(totalPromptTokens, thresholdTokens) {
		return modelRatio, completionRatio, false
	}
	completionRatioMultiplier := CompletionRatioMultiplierFromPrices(inputPriceMultiplier, outputPriceMultiplier)
	return modelRatio * inputPriceMultiplier,
		completionRatio * completionRatioMultiplier,
		true
}

func StableRolloutBucket(key string) int {
	if key == "" {
		key = "_"
	}
	h := fnv.New32a()
	_, _ = h.Write([]byte(key))
	return int(h.Sum32() % claudeRolloutBuckets)
}

func ShouldApplyPercentRollout(key string, rolloutPercent float64) bool {
	if rolloutPercent <= 0 {
		return false
	}
	if rolloutPercent >= 100 {
		return true
	}
	threshold := int(math.Round(rolloutPercent * (claudeRolloutBuckets / 100.0)))
	if threshold <= 0 {
		return false
	}
	if threshold >= claudeRolloutBuckets {
		return true
	}
	return StableRolloutBucket(key) < threshold
}

func ClaudeLongPromptRolloutKey(userID int) string {
	return "claude-long-prompt:" + strconv.Itoa(userID)
}

func containsInt(list []int, v int) bool {
	for _, item := range list {
		if item == v {
			return true
		}
	}
	return false
}

// ShouldApplyClaudeLongPromptRollout decides whether the Claude long-prompt tier should be enabled
// for the given user.
//
// Gray rollout uses an explicit allowlist. Only users in the allowlist are enabled.
// When the allowlist is empty, the feature is disabled for all users.
func ShouldApplyClaudeLongPromptRollout(userID int, allowlist []int) bool {
	if len(allowlist) == 0 {
		return false
	}
	return containsInt(allowlist, userID)
}
