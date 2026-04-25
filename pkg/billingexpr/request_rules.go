package billingexpr

import (
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/tidwall/gjson"
)

const (
	requestRuleSourceParam      = "param"
	requestRuleSourceHeader     = "header"
	requestRuleSourceTime       = "time"
	requestRuleSourceTokenGroup = "token_group"

	requestRuleModeEQ       = "eq"
	requestRuleModeContains = "contains"
	requestRuleModeGT       = "gt"
	requestRuleModeGTE      = "gte"
	requestRuleModeLT       = "lt"
	requestRuleModeLTE      = "lte"
	requestRuleModeExists   = "exists"
	requestRuleModeRange    = "range"

	requestRuleActionMultiplier = "multiplier"
	requestRuleActionFixed      = "fixed"
)

type requestRulePayload struct {
	Version int                `json:"version"`
	Groups  []requestRuleGroup `json:"groups"`
}

type requestRuleGroup struct {
	Conditions []requestRuleCondition `json:"conditions"`
	ActionType string                 `json:"action_type"`
	Multiplier string                 `json:"multiplier,omitempty"`
	FixedPrice string                 `json:"fixed_price,omitempty"`
}

type requestRuleCondition struct {
	Source     string `json:"source"`
	Path       string `json:"path,omitempty"`
	Mode       string `json:"mode"`
	Value      string `json:"value,omitempty"`
	TimeFunc   string `json:"timeFunc,omitempty"`
	Timezone   string `json:"timezone,omitempty"`
	RangeStart string `json:"rangeStart,omitempty"`
	RangeEnd   string `json:"rangeEnd,omitempty"`
}

// ApplyRequestPricingRules applies serialized request rule groups to a base
// billing expression result. Fixed-price rules replace the base cost with
// $/request pricing (converted to the expression's $/1M-token unit), while
// multiplier rules continue to scale the chosen base cost.
func ApplyRequestPricingRules(baseCost float64, payload string, request RequestInput, trace *TraceResult) (float64, error) {
	if strings.TrimSpace(payload) == "" {
		return baseCost, nil
	}

	decoded, err := base64.StdEncoding.DecodeString(strings.TrimSpace(payload))
	if err != nil {
		return 0, fmt.Errorf("decode request pricing rules: %w", err)
	}

	var parsed requestRulePayload
	if err := common.Unmarshal(decoded, &parsed); err != nil {
		return 0, fmt.Errorf("parse request pricing rules: %w", err)
	}
	if len(parsed.Groups) == 0 {
		return baseCost, nil
	}

	headers := normalizeHeaders(request.Headers)
	finalCost := baseCost
	multiplier := 1.0
	fixedIndex := -1

	for index, group := range parsed.Groups {
		if len(group.Conditions) == 0 {
			continue
		}
		matched, err := requestRuleGroupMatches(group, request, headers)
		if err != nil {
			return 0, err
		}
		if !matched {
			continue
		}

		actionType := strings.TrimSpace(group.ActionType)
		if actionType == "" {
			actionType = requestRuleActionMultiplier
		}

		switch actionType {
		case requestRuleActionFixed:
			if fixedIndex >= 0 {
				continue
			}
			price, err := strconv.ParseFloat(strings.TrimSpace(group.FixedPrice), 64)
			if err != nil {
				return 0, fmt.Errorf("invalid fixed price in request rule %d: %w", index+1, err)
			}
			finalCost = price * 1_000_000
			fixedIndex = index
		case requestRuleActionMultiplier:
			value, err := strconv.ParseFloat(strings.TrimSpace(group.Multiplier), 64)
			if err != nil {
				return 0, fmt.Errorf("invalid multiplier in request rule %d: %w", index+1, err)
			}
			multiplier *= value
		default:
			return 0, fmt.Errorf("unsupported request rule action %q", actionType)
		}
	}

	finalCost *= multiplier

	if trace != nil {
		trace.Cost = finalCost
		if fixedIndex >= 0 {
			trace.MatchedTier = fmt.Sprintf("request_fixed_%d", fixedIndex+1)
		}
	}

	return finalCost, nil
}

func requestRuleGroupMatches(group requestRuleGroup, request RequestInput, headers map[string]string) (bool, error) {
	for _, cond := range group.Conditions {
		matched, err := requestRuleConditionMatches(cond, request, headers)
		if err != nil {
			return false, err
		}
		if !matched {
			return false, nil
		}
	}
	return true, nil
}

func requestRuleConditionMatches(cond requestRuleCondition, request RequestInput, headers map[string]string) (bool, error) {
	switch strings.TrimSpace(cond.Source) {
	case requestRuleSourceTime:
		return matchTimeCondition(cond)
	case requestRuleSourceHeader:
		return matchStringCondition(headers[strings.ToLower(strings.TrimSpace(cond.Path))], cond, true)
	case requestRuleSourceTokenGroup:
		return matchStringCondition(strings.TrimSpace(request.UsingGroup), cond, true)
	case requestRuleSourceParam, "":
		return matchParamCondition(request.Body, cond)
	default:
		return false, fmt.Errorf("unsupported request rule source %q", cond.Source)
	}
}

func matchTimeCondition(cond requestRuleCondition) (bool, error) {
	current, err := timeConditionValue(cond.TimeFunc, cond.Timezone)
	if err != nil {
		return false, err
	}

	switch strings.TrimSpace(cond.Mode) {
	case requestRuleModeRange:
		start, err := strconv.ParseFloat(strings.TrimSpace(cond.RangeStart), 64)
		if err != nil {
			return false, fmt.Errorf("invalid range start for %s: %w", cond.TimeFunc, err)
		}
		end, err := strconv.ParseFloat(strings.TrimSpace(cond.RangeEnd), 64)
		if err != nil {
			return false, fmt.Errorf("invalid range end for %s: %w", cond.TimeFunc, err)
		}
		return current >= start || current < end, nil
	default:
		target, err := strconv.ParseFloat(strings.TrimSpace(cond.Value), 64)
		if err != nil {
			return false, fmt.Errorf("invalid time condition value for %s: %w", cond.TimeFunc, err)
		}
		return compareNumericCondition(current, target, cond.Mode)
	}
}

func timeConditionValue(timeFunc, timezone string) (float64, error) {
	now := timeInZone(timezone)
	switch strings.TrimSpace(timeFunc) {
	case "hour", "":
		return float64(now.Hour()), nil
	case "minute":
		return float64(now.Minute()), nil
	case "weekday":
		return float64(now.Weekday()), nil
	case "month":
		return float64(now.Month()), nil
	case "day":
		return float64(now.Day()), nil
	default:
		return 0, fmt.Errorf("unsupported time function %q", timeFunc)
	}
}

func matchStringCondition(source string, cond requestRuleCondition, allowContains bool) (bool, error) {
	source = strings.TrimSpace(source)
	value := strings.TrimSpace(cond.Value)

	switch strings.TrimSpace(cond.Mode) {
	case requestRuleModeExists:
		return source != "", nil
	case requestRuleModeContains:
		if !allowContains {
			return false, fmt.Errorf("contains is not supported for source %q", cond.Source)
		}
		return value != "" && strings.Contains(source, value), nil
	case requestRuleModeEQ, "":
		return source == value, nil
	default:
		return false, fmt.Errorf("unsupported string match mode %q for source %q", cond.Mode, cond.Source)
	}
}

func matchParamCondition(body []byte, cond requestRuleCondition) (bool, error) {
	path := strings.TrimSpace(cond.Path)
	if path == "" {
		return false, nil
	}

	result := gjson.GetBytes(body, path)
	switch strings.TrimSpace(cond.Mode) {
	case requestRuleModeExists:
		return result.Exists(), nil
	case requestRuleModeContains:
		return result.Exists() && strings.Contains(fmt.Sprint(result.Value()), strings.TrimSpace(cond.Value)), nil
	case requestRuleModeGT, requestRuleModeGTE, requestRuleModeLT, requestRuleModeLTE:
		if !result.Exists() {
			return false, nil
		}
		target, err := strconv.ParseFloat(strings.TrimSpace(cond.Value), 64)
		if err != nil {
			return false, fmt.Errorf("invalid numeric request rule value for %s: %w", path, err)
		}
		return compareNumericCondition(result.Float(), target, cond.Mode)
	case requestRuleModeEQ, "":
		if !result.Exists() {
			return false, nil
		}
		return compareResultEQ(result, strings.TrimSpace(cond.Value)), nil
	default:
		return false, fmt.Errorf("unsupported request rule mode %q for path %q", cond.Mode, path)
	}
}

func compareNumericCondition(left, right float64, mode string) (bool, error) {
	switch strings.TrimSpace(mode) {
	case requestRuleModeGT:
		return left > right, nil
	case requestRuleModeGTE:
		return left >= right, nil
	case requestRuleModeLT:
		return left < right, nil
	case requestRuleModeLTE:
		return left <= right, nil
	case requestRuleModeEQ, "":
		return left == right, nil
	default:
		return false, fmt.Errorf("unsupported numeric match mode %q", mode)
	}
}

func compareResultEQ(result gjson.Result, raw string) bool {
	switch strings.ToLower(raw) {
	case "true":
		return result.Type == gjson.True
	case "false":
		return result.Type == gjson.False
	}

	if parsed, err := strconv.ParseFloat(raw, 64); err == nil {
		return result.Float() == parsed
	}

	return fmt.Sprint(result.Value()) == raw
}
