package ratio_setting

import (
	"encoding/json"
	"errors"

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

var defaultGroupSpecialUsableGroup = map[string]map[string]string{
	"vip": {
		"append_1":   "vip_special_group_1",
		"-:remove_1": "vip_removed_group_1",
	},
}

// GroupModelBilling 分组模型计费配置
type GroupModelBilling struct {
	QuotaType     int     `json:"quota_type"`               // 0=按量计费, 1=按次计费
	ModelPrice    float64 `json:"model_price,omitempty"`    // 按次计费时的价格(美元)
	BillingSource string  `json:"billing_source,omitempty"` // 资金来源限制: ""=不限制(默认), "wallet_only"=仅余额, "subscription_only"=仅订阅, "wallet_first"=优先余额, "subscription_first"=优先订阅
}

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
		common.SysLog("group ratio not found: " + name)
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

// GetGroupModelBilling 获取指定分组和模型的计费配置
func GetGroupModelBilling(group, modelName string) (*GroupModelBilling, bool) {
	groupModels, ok := groupModelBillingMap.Get(group)
	if !ok {
		return nil, false
	}
	billing, ok := groupModels[modelName]
	if !ok {
		return nil, false
	}
	return &billing, true
}

// GroupModelBilling2JSONString 将分组模型计费配置转为 JSON 字符串
func GroupModelBilling2JSONString() string {
	return groupModelBillingMap.MarshalJSONString()
}

// UpdateGroupModelBillingByJSONString 通过 JSON 字符串更新分组模型计费配置
func UpdateGroupModelBillingByJSONString(jsonStr string) error {
	return types.LoadFromJsonString(groupModelBillingMap, jsonStr)
}

// GetGroupModelBillingCopy 获取分组模型计费配置的副本
func GetGroupModelBillingCopy() map[string]map[string]GroupModelBilling {
	return groupModelBillingMap.ReadAll()
}
