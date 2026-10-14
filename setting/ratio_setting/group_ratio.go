package ratio_setting

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/QuantumNous/new-api/types"
)

var defaultGroupRatio = map[string]float64{
	"default": 1,
	"vip":     1,
	"svip":    1,
}

var groupRatioMap = types.NewRWMap[string, float64]()

var defaultGroupGroupRatio = map[string]map[string]float64{
	"vip": {
		"edit_this": 0.9,
	},
}

var groupGroupRatioMap = types.NewRWMap[string, map[string]float64]()

var defaultGroupSpecialUsableGroup = map[string]map[string]string{}

// GroupModelBilling 分组模型计费配置
type GroupModelBilling struct {
	QuotaType     int     `json:"quota_type"`               // 0=按量计费, 1=按次计费
	ModelPrice    float64 `json:"model_price,omitempty"`    // 按次计费时的价格(美元)
	BillingSource string  `json:"billing_source,omitempty"` // 资金来源限制: ""=不限制(默认), "wallet_only"=仅余额, "subscription_only"=仅订阅, "wallet_first"=优先余额, "subscription_first"=优先订阅
}

// GroupModelBillingDefaultKey is a reserved pseudo-model key used to store the
// default quota_type/model_price/billing_source for an entire group.
const GroupModelBillingDefaultKey = "__default__"

var defaultGroupModelBilling = map[string]map[string]GroupModelBilling{
	// "vip": {
	// 	"gpt-4": {
	// 		"quota_type":  1,
	// 		"model_price": 0.5,
	// 	},
	// },
}

var groupModelBillingMap = types.NewRWMap[string, map[string]GroupModelBilling]()

type GroupRatioSetting struct {
	GroupRatio              *types.RWMap[string, float64]                      `json:"group_ratio"`
	GroupGroupRatio         *types.RWMap[string, map[string]float64]           `json:"group_group_ratio"`
	GroupSpecialUsableGroup *types.RWMap[string, map[string]string]            `json:"group_special_usable_group"`
	GroupModelBilling       *types.RWMap[string, map[string]GroupModelBilling] `json:"group_model_billing"`
}

var groupRatioSetting GroupRatioSetting

func init() {
	groupSpecialUsableGroup := types.NewRWMap[string, map[string]string]()
	groupSpecialUsableGroup.AddAll(defaultGroupSpecialUsableGroup)

	groupRatioMap.AddAll(defaultGroupRatio)
	groupGroupRatioMap.AddAll(defaultGroupGroupRatio)
	groupModelBillingMap.AddAll(defaultGroupModelBilling)

	groupRatioSetting = GroupRatioSetting{
		GroupSpecialUsableGroup: groupSpecialUsableGroup,
		GroupRatio:              groupRatioMap,
		GroupGroupRatio:         groupGroupRatioMap,
		GroupModelBilling:       groupModelBillingMap,
	}

	config.GlobalConfig.Register("group_ratio_setting", &groupRatioSetting)
}

func GetGroupRatioSetting() *GroupRatioSetting {
	if groupRatioSetting.GroupSpecialUsableGroup == nil {
		groupRatioSetting.GroupSpecialUsableGroup = types.NewRWMap[string, map[string]string]()
		groupRatioSetting.GroupSpecialUsableGroup.AddAll(defaultGroupSpecialUsableGroup)
	}
	if groupRatioSetting.GroupModelBilling == nil {
		groupRatioSetting.GroupModelBilling = types.NewRWMap[string, map[string]GroupModelBilling]()
		groupRatioSetting.GroupModelBilling.AddAll(defaultGroupModelBilling)
	}
	return &groupRatioSetting
}

// SubscriptionGroupRulePrefix marks a group_special_usable_group entry whose
// target group stays hidden from users of the rule's owner group until they
// hold an active subscription that explicitly lists the target group.
const SubscriptionGroupRulePrefix = "sub:"

// GetSubscriptionGatedGroups returns the groups, with their descriptions, that
// users of userGroup may only use through a subscription that explicitly lists
// them. A user's own group is never gated.
func GetSubscriptionGatedGroups(userGroup string) map[string]string {
	rules, ok := GetGroupRatioSetting().GroupSpecialUsableGroup.Get(userGroup)
	if !ok {
		return nil
	}
	gated := make(map[string]string)
	for rawKey, desc := range rules {
		group, isGated := strings.CutPrefix(rawKey, SubscriptionGroupRulePrefix)
		if !isGated || group == "" || group == userGroup {
			continue
		}
		gated[group] = desc
	}
	return gated
}

func GetGroupRatioCopy() map[string]float64 {
	return groupRatioMap.ReadAll()
}

func ContainsGroupRatio(name string) bool {
	_, ok := groupRatioMap.Get(name)
	return ok
}

func GroupRatio2JSONString() string {
	return groupRatioMap.MarshalJSONString()
}

func UpdateGroupRatioByJSONString(jsonStr string) error {
	return types.LoadFromJsonString(groupRatioMap, jsonStr)
}

func GetGroupRatio(name string) float64 {
	ratio, ok := groupRatioMap.Get(name)
	if !ok {
		common.SysLog(common.LogText("group ratio not found: %s", name))
		return 1
	}
	return ratio
}

func GetGroupGroupRatio(userGroup, usingGroup string) (float64, bool) {
	gp, ok := groupGroupRatioMap.Get(userGroup)
	if !ok {
		return -1, false
	}
	ratio, ok := gp[usingGroup]
	if !ok {
		return -1, false
	}
	return ratio, true
}

func GroupGroupRatio2JSONString() string {
	return groupGroupRatioMap.MarshalJSONString()
}

func UpdateGroupGroupRatioByJSONString(jsonStr string) error {
	return types.LoadFromJsonString(groupGroupRatioMap, jsonStr)
}

func CheckGroupRatio(jsonStr string) error {
	checkGroupRatio := make(map[string]float64)
	err := json.Unmarshal([]byte(jsonStr), &checkGroupRatio)
	if err != nil {
		return err
	}
	for name, ratio := range checkGroupRatio {
		if ratio < 0 {
			return errors.New("group ratio must be not less than 0: " + name)
		}
	}
	return nil
}

// GetGroupModelBillingSource 获取指定分组+模型的资金来源限制，若模型未单独配置，
// 则回退到分组默认 billing_source（通过保留键 __default__ 存储）。
func GetGroupModelBillingSource(group, modelName string) (string, bool) {
	groupModels, ok := groupModelBillingMap.Get(group)
	if !ok {
		return "", false
	}
	if billing := groupModels[modelName]; billing.BillingSource != "" {
		return billing.BillingSource, true
	}
	billingSource := groupModels[GroupModelBillingDefaultKey].BillingSource
	return billingSource, billingSource != ""
}

// GroupModelBilling2JSONString 将分组模型计费配置转为 JSON 字符串
func GroupModelBilling2JSONString() string {
	return groupModelBillingMap.MarshalJSONString()
}

// UpdateGroupModelBillingByJSONString 通过 JSON 字符串更新分组模型计费配置
func UpdateGroupModelBillingByJSONString(jsonStr string) error {
	return types.LoadFromJsonString(groupModelBillingMap, jsonStr)
}
