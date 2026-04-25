package billingexpr_test

import (
	"encoding/base64"
	"testing"

	"github.com/QuantumNous/new-api/pkg/billingexpr"
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
