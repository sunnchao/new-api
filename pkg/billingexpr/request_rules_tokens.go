package billingexpr

import (
	"fmt"
	"strconv"
	"strings"
)

const requestRuleSourceTokens = "tokens"

// tokenConditionValue resolves a named token field from TokenParams.
// Supported paths: p, c, len, cr, cc, cc1h, img, img_o, ai, ao
func tokenConditionValue(params TokenParams, path string) (float64, bool) {
	switch strings.TrimSpace(path) {
	case "p":
		return params.P, true
	case "c":
		return params.C, true
	case "len":
		return params.Len, true
	case "cr":
		return params.CR, true
	case "cc":
		return params.CC, true
	case "cc1h":
		return params.CC1h, true
	case "img":
		return params.Img, true
	case "img_o":
		return params.ImgO, true
	case "ai":
		return params.AI, true
	case "ao":
		return params.AO, true
	default:
		return 0, false
	}
}

func matchTokenCondition(cond requestRuleCondition, params TokenParams) (bool, error) {
	val, ok := tokenConditionValue(params, cond.Path)
	if !ok {
		return false, fmt.Errorf("unsupported token condition path %q", cond.Path)
	}
	target, err := strconv.ParseFloat(strings.TrimSpace(cond.Value), 64)
	if err != nil {
		return false, fmt.Errorf("invalid token condition value for %s: %w", cond.Path, err)
	}
	return compareNumericCondition(val, target, cond.Mode)
}
