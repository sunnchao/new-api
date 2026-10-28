package billingexpr

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTaskUsageExpressionUsesFactsAndTaskQuotaConversion(t *testing.T) {
	expression := `tier("1080p", u("seconds") * (u("resolution") == "1080p" ? 0.4 : 0.2))`
	cost, trace, err := RunExprWithRequest(expression, TokenParams{}, RequestInput{Usage: map[string]any{"seconds": 10.0, "resolution": "1080p"}})
	require.NoError(t, err)
	assert.Equal(t, 4.0, cost)
	assert.Equal(t, "1080p", trace.MatchedTier)
	result, err := ComputeTieredQuotaWithRequest(&BillingSnapshot{ExprString: expression, ExprHash: ExprHashString(expression), GroupRatio: 2, QuotaPerUnit: 500000, ExprVersion: 1, TaskUsageBilling: true}, TokenParams{}, RequestInput{Usage: map[string]any{"seconds": 10.0, "resolution": "1080p"}})
	require.NoError(t, err)
	assert.Equal(t, 4_000_000, result.ActualQuotaAfterGroup)
}

func TestTaskUsageExpressionSelectsGroupBranch(t *testing.T) {
	expression := `group() == "vip"
		? (u("resolution") == "2k" && u("quality") == "medium"
			? tier("vip-2k-medium", u("image_count") * 0.05 + u("input_images") * 0.01)
			: tier("vip", u("image_count") * 0.02 + u("input_images") * 0.01))
		: (u("resolution") == "2k" && u("quality") == "medium"
			? tier("base-2k-medium", u("image_count") * 0.07 + u("input_images") * 0.02)
			: tier("base", u("image_count") * 0.03 + u("input_images") * 0.02))`
	for _, tc := range []struct {
		name       string
		group      string
		resolution string
		quality    string
		cost       float64
		tier       string
	}{
		{name: "vip 2k medium", group: "vip", resolution: "2k", quality: "medium", cost: 0.13, tier: "vip-2k-medium"},
		{name: "vip 1k", group: "vip", resolution: "1k", quality: "low", cost: 0.07, tier: "vip"},
		{name: "default 2k medium", group: "default", resolution: "2k", quality: "medium", cost: 0.20, tier: "base-2k-medium"},
		{name: "empty falls back", group: "", resolution: "2k", quality: "medium", cost: 0.20, tier: "base-2k-medium"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			usage := map[string]any{
				"image_count":  2.0,
				"input_images": 3.0,
				"resolution":   tc.resolution,
				"quality":      tc.quality,
			}
			cost, trace, err := RunExprWithRequest(expression, TokenParams{}, RequestInput{Usage: usage, UsingGroup: tc.group})
			require.NoError(t, err)
			assert.Equal(t, tc.cost, cost)
			assert.Equal(t, tc.tier, trace.MatchedTier)
		})
	}

	snapshot := &BillingSnapshot{
		ExprString:       expression,
		ExprHash:         ExprHashString(expression),
		BillingGroup:     "vip",
		GroupRatio:       1.5,
		QuotaPerUnit:     500000,
		ExprVersion:      1,
		TaskUsageBilling: true,
	}
	result, err := ComputeTieredQuotaWithRequest(snapshot, TokenParams{}, RequestInput{Usage: map[string]any{
		"image_count":  2.0,
		"input_images": 3.0,
		"resolution":   "2k",
		"quality":      "medium",
	}, UsingGroup: snapshot.BillingGroup})
	require.NoError(t, err)
	assert.Equal(t, 97500, result.ActualQuotaAfterGroup)
	assert.Equal(t, "vip-2k-medium", result.MatchedTier)
}
