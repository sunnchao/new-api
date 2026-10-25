package billingexpr_test

import (
	"encoding/base64"
	"testing"

	"github.com/QuantumNous/new-api/pkg/billingexpr"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func encodeRulePayload(raw string) string {
	return base64.StdEncoding.EncodeToString([]byte(raw))
}

func TestApplyRequestRulesMultiplierRule(t *testing.T) {
	exprStr := `apply_request_rules(tier("base", p * 2), "` + encodeRulePayload(`{"version":1,"groups":[{"conditions":[{"source":"header","path":"anthropic-beta","mode":"contains","value":"fast-mode"}],"action_type":"multiplier","multiplier":"2"}]}`) + `")`

	cost, trace, err := billingexpr.RunExprWithRequest(
		exprStr,
		billingexpr.TokenParams{P: 1000},
		billingexpr.RequestInput{
			Headers: map[string]string{
				"Anthropic-Beta": "fast-mode-2026-02-01",
			},
		},
	)
	if err != nil {
		t.Fatal(err)
	}
	if cost != 4000 {
		t.Fatalf("cost = %f, want 4000", cost)
	}
	if trace.MatchedTier != "base" {
		t.Fatalf("tier = %q, want %q", trace.MatchedTier, "base")
	}
}

func TestApplyRequestRulesFixedPriceByTokenGroup(t *testing.T) {
	exprStr := `apply_request_rules(tier("base", p * 2), "` + encodeRulePayload(`{"version":1,"groups":[{"conditions":[{"source":"token_group","mode":"eq","value":"vip"}],"action_type":"fixed","fixed_price":"0.2"}]}`) + `")`

	cost, trace, err := billingexpr.RunExprWithRequest(
		exprStr,
		billingexpr.TokenParams{P: 1000},
		billingexpr.RequestInput{
			UsingGroup: "vip",
		},
	)
	if err != nil {
		t.Fatal(err)
	}
	if cost != 200000 {
		t.Fatalf("cost = %f, want 200000", cost)
	}
	if trace.MatchedTier != "request_fixed_1" {
		t.Fatalf("tier = %q, want %q", trace.MatchedTier, "request_fixed_1")
	}
}

func TestApplyRequestRulesFixedPriceStillSupportsMultipliers(t *testing.T) {
	exprStr := `apply_request_rules(tier("base", p * 2), "` + encodeRulePayload(`{"version":1,"groups":[{"conditions":[{"source":"token_group","mode":"eq","value":"vip"}],"action_type":"fixed","fixed_price":"0.2"},{"conditions":[{"source":"param","path":"service_tier","mode":"eq","value":"fast"}],"action_type":"multiplier","multiplier":"0.5"}]}`) + `")`

	cost, trace, err := billingexpr.RunExprWithRequest(
		exprStr,
		billingexpr.TokenParams{P: 1000},
		billingexpr.RequestInput{
			UsingGroup: "vip",
			Body:       []byte(`{"service_tier":"fast"}`),
		},
	)
	if err != nil {
		t.Fatal(err)
	}
	if cost != 100000 {
		t.Fatalf("cost = %f, want 100000", cost)
	}
	if trace.MatchedTier != "request_fixed_1" {
		t.Fatalf("tier = %q, want %q", trace.MatchedTier, "request_fixed_1")
	}
}

func TestApplyRequestRulesInvalidPayloadReturnsError(t *testing.T) {
	_, _, err := billingexpr.RunExprWithRequest(
		`apply_request_rules(tier("base", p * 2), "not-base64")`,
		billingexpr.TokenParams{P: 1000},
		billingexpr.RequestInput{},
	)
	if err == nil {
		t.Fatal("expected invalid request rule payload error")
	}
}

func TestPluginFixedPriceUnitAppliesOnlyToMatchedImageRules(t *testing.T) {
	exprStr := `apply_request_rules(tier("base", p * 2) * image_count, "` + encodeRulePayload(`{"version":1,"groups":[{"conditions":[{"source":"token_group","mode":"eq","value":"vip"}],"action_type":"fixed","fixed_price":"0.2"}]}`) + `")`
	count := 3
	for _, tc := range []struct {
		group     string
		priceUnit string
		wantCost  float64
		wantUnit  billingexpr.BillingUnit
	}{
		{group: "vip", priceUnit: "image", wantCost: 600000, wantUnit: billingexpr.BillingUnitRequest},
		{group: "vip", priceUnit: "request", wantCost: 200000, wantUnit: billingexpr.BillingUnitRequest},
		{group: "default", priceUnit: "image", wantCost: 6000, wantUnit: billingexpr.BillingUnitToken},
	} {
		t.Run(tc.group+"_"+tc.priceUnit, func(t *testing.T) {
			cost, trace, err := billingexpr.RunExprWithRequest(exprStr, billingexpr.TokenParams{P: 1000}, billingexpr.RequestInput{
				UsingGroup: tc.group, ImageCount: &count, FixedPriceUnit: tc.priceUnit,
			})
			require.NoError(t, err)
			assert.Equal(t, tc.wantCost, cost)
			require.NotNil(t, trace.ImageCount)
			assert.Equal(t, count, *trace.ImageCount)
			assert.Equal(t, tc.wantUnit, trace.BillingUnit)
			if tc.wantUnit == billingexpr.BillingUnitRequest {
				require.NotNil(t, trace.FixedPrice)
				assert.Equal(t, 0.2, *trace.FixedPrice)
			} else {
				assert.Nil(t, trace.FixedPrice)
			}
		})
	}
}

func TestPluginFixedImageRuleValidatesQuantityWithoutImageVariable(t *testing.T) {
	expression := `apply_request_rules(tier("base", p * 2), "` + encodeRulePayload(`{"version":1,"groups":[{"conditions":[{"source":"token_group","mode":"eq","value":"vip"}],"action_type":"fixed","fixed_price":"0.2"}]}`) + `")`
	for _, count := range []int{0, 3, 129} {
		cost, trace, err := billingexpr.RunExprWithRequest(expression, billingexpr.TokenParams{}, billingexpr.RequestInput{
			UsingGroup: "vip", FixedPriceUnit: billingexpr.RequestPriceUnitImage, ImageCount: &count,
		})
		if count != 3 {
			require.ErrorContains(t, err, "image_count must be between 1 and 128")
			continue
		}
		require.NoError(t, err)
		assert.Equal(t, 600000.0, cost)
		require.NotNil(t, trace.ImageCount)
		assert.Equal(t, count, *trace.ImageCount)
	}
}
