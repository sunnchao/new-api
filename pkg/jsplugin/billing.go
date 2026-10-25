package jsplugin

import (
	"fmt"
	"slices"
	"strings"
)

// BillingMeta customizes host billing without claiming a task driver.
type BillingMeta struct {
	RequestRules RequestRuleBillingMeta `json:"requestRules"`
}

type RequestRuleBillingMeta struct {
	FixedPriceUnit string `json:"fixedPriceUnit"`
}

// BillingOnly reports whether the plugin configures billing without a driver.
func (m Meta) BillingOnly() bool {
	return m.Billing != nil && len(m.Routes) == 0 && len(m.Protocols) == 0 && len(m.ChannelTypes) == 0
}

// FixedRequestPriceUnit resolves the first declared billing policy for a model.
func (g *RoutingGeneration) FixedRequestPriceUnit(model string) string {
	if g != nil {
		for _, plugin := range g.plugins {
			if plugin.Meta.Billing != nil && slices.Contains(plugin.Meta.Models, model) {
				return plugin.Meta.Billing.RequestRules.FixedPriceUnit
			}
		}
	}
	return "request"
}

func decodeBillingMeta(value any) (*BillingMeta, error) {
	object, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("plugin meta billing must be an object")
	}
	for key := range object {
		if key != "requestRules" {
			return nil, fmt.Errorf("plugin meta billing has unknown field %q", key)
		}
	}
	rules, ok := object["requestRules"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("plugin meta billing.requestRules must be an object")
	}
	for key := range rules {
		if key != "fixedPriceUnit" {
			return nil, fmt.Errorf("plugin meta billing.requestRules has unknown field %q", key)
		}
	}
	unit, err := stringMetaField(rules, "fixedPriceUnit")
	if err != nil {
		return nil, fmt.Errorf("plugin meta billing.requestRules: %w", err)
	}
	return &BillingMeta{RequestRules: RequestRuleBillingMeta{FixedPriceUnit: strings.TrimSpace(unit)}}, nil
}
