package controller

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/billing_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
)

var pricingOptionKeys = []string{
	"billing_setting." + billing_setting.BillingModeField,
	"billing_setting." + billing_setting.BillingExprField,
	"GroupModelBilling",
}

func getPricingOptions() []*model.Option {
	options := make([]*model.Option, 0, len(pricingOptionKeys))

	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()

	for _, key := range pricingOptionKeys {
		value, ok := common.OptionMap[key]
		if !ok {
			continue
		}
		options = append(options, &model.Option{
			Key:   key,
			Value: value,
		})
	}

	return options
}

func filterPricingByUsableGroups(pricing []model.Pricing, usableGroup map[string]string) []model.Pricing {
	if len(pricing) == 0 {
		return pricing
	}
	if len(usableGroup) == 0 {
		return []model.Pricing{}
	}

	filtered := make([]model.Pricing, 0, len(pricing))
	for _, item := range pricing {
		// The pricing cache is shared by all viewers.
		groups := make([]string, 0, len(item.EnableGroup))
		for _, group := range item.EnableGroup {
			if _, ok := usableGroup[group]; ok || group == "all" {
				groups = append(groups, group)
			}
		}
		if len(groups) > 0 {
			item.EnableGroup = groups
			filtered = append(filtered, item)
		}
	}
	return filtered
}

func GetPricing(c *gin.Context) {
	userGroup := common.GetContextKeyString(c, constant.ContextKeyUserGroup)
	userId, hasUser := c.Get("id")
	isAdmin := false
	if hasUser {
		isAdmin = model.IsAdmin(userId.(int))
	}

	usableGroup := service.GetUserUsableGroups(userGroup)
	if hasUser {
		// 订阅解锁的分组仅对已登录用户可见；查询失败时保守地只返回默认可用分组
		unlockedGroups, err := service.GetUserUsableGroupsForUser(userId.(int), userGroup)
		if err != nil {
			common.SysError("GetPricing subscription groups error: " + err.Error())
		} else {
			usableGroup = unlockedGroups
		}
	}
	autoGroups := service.GetUserAutoGroup(userGroup)
	if !isAdmin {
		userUnselectableGroups := setting.GetUserUnselectableGroupsCopy()
		for groupName := range userUnselectableGroups {
			delete(usableGroup, groupName)
		}
		filteredAutoGroups := make([]string, 0, len(autoGroups))
		for _, groupName := range autoGroups {
			if _, hidden := userUnselectableGroups[groupName]; !hidden {
				filteredAutoGroups = append(filteredAutoGroups, groupName)
			}
		}
		autoGroups = filteredAutoGroups
	}
	pricing := filterPricingByUsableGroups(model.GetPricing(), usableGroup)
	groupRatio := ratio_setting.GetGroupRatioCopy()
	for group := range groupRatio {
		if _, ok := usableGroup[group]; !ok {
			delete(groupRatio, group)
			continue
		}
		if userGroup != "" {
			if ratio, ok := ratio_setting.GetGroupGroupRatio(userGroup, group); ok {
				groupRatio[group] = ratio
			}
		}
	}

	c.JSON(200, gin.H{
		"success":            true,
		"data":               pricing,
		"vendors":            model.GetVendors(),
		"group_ratio":        groupRatio,
		"usable_group":       usableGroup,
		"supported_endpoint": model.GetSupportedEndpointMap(),
		"auto_groups":        autoGroups,
		"options":            getPricingOptions(),
		"pricing_version":    "a42d372ccf0b5dd13ecf71203521f9d2",
	})
}

func ResetModelRatio(c *gin.Context) {
	defaultStr := ratio_setting.DefaultModelRatio2JSONString()
	err := model.UpdateOption("ModelRatio", defaultStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	err = ratio_setting.UpdateModelRatioByJSONString(defaultStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccessT(c, "Model ratios reset", nil)
}
