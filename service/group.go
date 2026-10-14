package service

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/gin-gonic/gin"
)

func GetUserUsableGroups(userGroup string) map[string]string {
	groupsCopy := setting.GetUserUsableGroupsCopy()
	unselectableGroups := setting.GetUserUnselectableGroupsCopy()
	for groupName, desc := range unselectableGroups {
		if _, ok := groupsCopy[groupName]; !ok {
			groupsCopy[groupName] = desc
		}
	}
	if userGroup != "" {
		specialSettings, b := ratio_setting.GetGroupRatioSetting().GroupSpecialUsableGroup.Get(userGroup)
		if b {
			// 处理特殊可用分组
			for specialGroup, desc := range specialSettings {
				if after, ok := strings.CutPrefix(specialGroup, "-:"); ok {
					// 移除分组
					groupToRemove := after
					delete(groupsCopy, groupToRemove)
				} else if after, ok := strings.CutPrefix(specialGroup, "+:"); ok {
					// 添加分组
					groupToAdd := after
					groupsCopy[groupToAdd] = desc
				} else if strings.HasPrefix(specialGroup, ratio_setting.SubscriptionGroupRulePrefix) {
					// 订阅专属分组在下方统一隐藏，避免与同组的 +: 规则因 map 遍历顺序产生冲突
					continue
				} else {
					// 直接添加分组
					groupsCopy[specialGroup] = desc
				}
			}
		}
		// 订阅专属分组默认不可见，只有持有明确列出该分组的订阅时才由 GetUserUsableGroupsForUser 放开
		for gatedGroup := range ratio_setting.GetSubscriptionGatedGroups(userGroup) {
			delete(groupsCopy, gatedGroup)
		}
		// 如果userGroup不在UserUsableGroups中，返回UserUsableGroups + userGroup。
		// 描述是英文源文本，由 web 控制台翻译；管理员配置的描述原样显示。
		if _, ok := groupsCopy[userGroup]; !ok {
			groupsCopy[userGroup] = "User group"
		}
	}
	return groupsCopy
}

// GetUserUsableGroupsForUser 在 GetUserUsableGroups 的基础上，加入用户通过订阅解锁的订阅专属分组。
// 订阅的允许分组为空（代表全部分组）时不会解锁，必须明确列出该分组。
func GetUserUsableGroupsForUser(userId int, userGroup string) (map[string]string, error) {
	groups := GetUserUsableGroups(userGroup)
	gatedGroups := ratio_setting.GetSubscriptionGatedGroups(userGroup)
	if len(gatedGroups) == 0 {
		return groups, nil
	}
	explicitGroups, err := model.GetActiveUserSubscriptionExplicitGroups(userId)
	if err != nil {
		return nil, err
	}
	for gatedGroup, desc := range gatedGroups {
		if _, ok := explicitGroups[gatedGroup]; ok {
			groups[gatedGroup] = desc
		}
	}
	return groups, nil
}

// IsGroupUnlockedBySubscription 判断 group 是否是 userGroup 的订阅专属分组，且用户持有明确列出它的有效订阅。
// 非订阅专属分组一律返回 false，且不会查询数据库。
func IsGroupUnlockedBySubscription(userId int, userGroup, group string) (bool, error) {
	if _, gated := ratio_setting.GetSubscriptionGatedGroups(userGroup)[group]; !gated {
		return false, nil
	}
	explicitGroups, err := model.GetActiveUserSubscriptionExplicitGroups(userId)
	if err != nil {
		return false, err
	}
	_, unlocked := explicitGroups[group]
	return unlocked, nil
}

func GroupInUserUsableGroups(userGroup, groupName string) bool {
	_, ok := GetUserUsableGroups(userGroup)[groupName]
	return ok
}

func IsUserSelectableGroup(userGroup, groupName string) bool {
	if groupName == "" || groupName == "auto" {
		return false
	}
	return GroupInUserUsableGroups(userGroup, groupName) && ratio_setting.ContainsGroupRatio(groupName)
}

// GetUserAutoGroup 根据用户分组获取自动分组设置
func GetUserAutoGroup(userGroup string) []string {
	autoGroups := make([]string, 0)
	seen := make(map[string]struct{})
	for _, group := range setting.GetAutoGroups() {
		if !IsUserSelectableGroup(userGroup, group) {
			continue
		}
		if _, ok := seen[group]; ok {
			continue
		}
		seen[group] = struct{}{}
		autoGroups = append(autoGroups, group)
	}
	return autoGroups
}

// FilterUserTokenAutoGroups applies current permissions before the current
// per-token limit. It intentionally does not fall back to the global Auto list.
func FilterUserTokenAutoGroups(userGroup string, groups []string) []string {
	maxCount := setting.GetMaxTokenAutoGroups()
	filtered := make([]string, 0, min(len(groups), maxCount))
	seen := make(map[string]struct{})
	for _, group := range groups {
		if !IsUserSelectableGroup(userGroup, group) {
			continue
		}
		if _, ok := seen[group]; ok {
			continue
		}
		seen[group] = struct{}{}
		filtered = append(filtered, group)
		if len(filtered) == maxCount {
			break
		}
	}
	return filtered
}

// GetRequestAutoGroups resolves the ordered Auto groups for the current token.
// The absence of the context value means that the token inherits the complete
// global Auto list; a present (even empty) value is an explicit token snapshot.
func GetRequestAutoGroups(c *gin.Context, userGroup string) []string {
	value, ok := common.GetContextKey(c, constant.ContextKeyTokenAutoGroups)
	if !ok {
		return GetUserAutoGroup(userGroup)
	}
	groups, ok := value.([]string)
	if !ok {
		return []string{}
	}
	return FilterUserTokenAutoGroups(userGroup, groups)
}

// GetGroupsEnabledModels 按 groups 顺序获取各分组启用的模型并去重
func GetGroupsEnabledModels(groups []string) []string {
	seen := make(map[string]struct{})
	models := make([]string, 0)
	for _, group := range groups {
		for _, modelName := range model.GetGroupEnabledModels(group) {
			if _, ok := seen[modelName]; !ok {
				seen[modelName] = struct{}{}
				models = append(models, modelName)
			}
		}
	}
	return models
}

// GetUserGroupRatio 获取用户使用某个分组的倍率
// userGroup 用户分组
// group 需要获取倍率的分组
func GetUserGroupRatio(userGroup, group string) float64 {
	ratio, ok := ratio_setting.GetGroupGroupRatio(userGroup, group)
	if ok {
		return ratio
	}
	return ratio_setting.GetGroupRatio(group)
}

// GetTokenBackupGroup 根据令牌获取备用分组设置
func GetTokenBackupGroup(backupGroupStr string, userGroup string) []string {
	if backupGroupStr == "" {
		return nil
	}
	groups := GetUserUsableGroups(userGroup)
	autoGroups := make([]string, 0)
	backupGroups := strings.Split(backupGroupStr, ",")

	for _, group := range backupGroups {
		group = strings.TrimSpace(group)
		if _, ok := groups[group]; ok {
			autoGroups = append(autoGroups, group)
		}
	}
	return autoGroups
}
