package setting

import (
	"encoding/json"
	"sync"

	"github.com/QuantumNous/new-api/common"
)

var userUsableGroups = map[string]string{
	"default": "默认分组",
	"vip":     "vip分组",
}
var userUsableGroupsMutex sync.RWMutex

var userUnselectableGroups = map[string]string{}
var userUnselectableGroupsMutex sync.RWMutex

func GetUserUsableGroupsCopy() map[string]string {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	copyUserUsableGroups := make(map[string]string)
	for k, v := range userUsableGroups {
		copyUserUsableGroups[k] = v
	}
	return copyUserUsableGroups
}

func GetUserUnselectableGroupsCopy() map[string]string {
	userUnselectableGroupsMutex.RLock()
	defer userUnselectableGroupsMutex.RUnlock()

	copyUserUnselectableGroups := make(map[string]string)
	for k, v := range userUnselectableGroups {
		copyUserUnselectableGroups[k] = v
	}
	return copyUserUnselectableGroups
}

func UserUsableGroups2JSONString() string {
	userUsableGroupsMutex.RLock()
	defer userUsableGroupsMutex.RUnlock()

	jsonBytes, err := json.Marshal(userUsableGroups)
	if err != nil {
		common.SysLog("error marshalling user groups: " + err.Error())
	}
	return string(jsonBytes)
}

func UserUnselectableGroups2JSONString() string {
	userUnselectableGroupsMutex.RLock()
	defer userUnselectableGroupsMutex.RUnlock()

	jsonBytes, err := json.Marshal(userUnselectableGroups)
	if err != nil {
		common.SysLog("error marshalling user unselectable groups: " + err.Error())
	}
	return string(jsonBytes)
}

func UpdateUserUsableGroupsByJSONString(jsonStr string) error {
	userUsableGroupsMutex.Lock()
	defer userUsableGroupsMutex.Unlock()

	userUsableGroups = make(map[string]string)
	return json.Unmarshal([]byte(jsonStr), &userUsableGroups)
}

func UpdateUserUnselectableGroupsByJSONString(jsonStr string) error {
	userUnselectableGroupsMutex.Lock()
	defer userUnselectableGroupsMutex.Unlock()

	userUnselectableGroups = make(map[string]string)
	return json.Unmarshal([]byte(jsonStr), &userUnselectableGroups)
}

func GetUsableGroupDescription(groupName string) string {
	userUsableGroupsMutex.RLock()
	if desc, ok := userUsableGroups[groupName]; ok {
		userUsableGroupsMutex.RUnlock()
		return desc
	}
	userUsableGroupsMutex.RUnlock()
	userUnselectableGroupsMutex.RLock()
	defer userUnselectableGroupsMutex.RUnlock()
	if desc, ok := userUnselectableGroups[groupName]; ok {
		return desc
	}
	return groupName
}
