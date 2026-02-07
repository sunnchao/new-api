package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
)

func GetGroups(c *gin.Context) {
	groupNames := make([]string, 0)
	for groupName := range ratio_setting.GetGroupRatioCopy() {
		groupNames = append(groupNames, groupName)
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    groupNames,
	})
}

func GetUserGroups(c *gin.Context) {
	usableGroups := make(map[string]map[string]interface{})
	userGroup := ""
	userId := c.GetInt("id")
	if userId != 0 {
		userGroup, _ = model.GetUserGroup(userId, false)
	}
	userUsableGroups := service.GetUserUsableGroups(userGroup)
	userUnselectableGroups := setting.GetUserUnselectableGroupsCopy()
	isAdmin := c.GetInt("role") >= common.RoleAdminUser
	for groupName, _ := range ratio_setting.GetGroupRatioCopy() {
		// UserUsableGroups contains the groups that the user can use
		desc, ok := userUsableGroups[groupName]
		if !ok && !isAdmin {
			continue
		}
		if !isAdmin {
			if _, hidden := userUnselectableGroups[groupName]; hidden {
				continue
			}
		}
		if !ok {
			desc = setting.GetUsableGroupDescription(groupName)
		}
		usableGroups[groupName] = map[string]interface{}{
			"ratio": service.GetUserGroupRatio(userGroup, groupName),
			"desc":  desc,
		}
	}
	if _, ok := userUsableGroups["auto"]; ok {
		if isAdmin {
			usableGroups["auto"] = map[string]interface{}{
				"ratio": "自动",
				"desc":  setting.GetUsableGroupDescription("auto"),
			}
		} else {
			if _, hidden := userUnselectableGroups["auto"]; !hidden {
				usableGroups["auto"] = map[string]interface{}{
					"ratio": "自动",
					"desc":  setting.GetUsableGroupDescription("auto"),
				}
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    usableGroups,
	})
}
