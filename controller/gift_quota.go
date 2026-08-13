package controller

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GetUserGiftQuotaHistory returns the current user's gift quota grant history.
func GetUserGiftQuotaHistory(c *gin.Context) {
	userId := c.GetInt("id")
	pageInfo := common.GetPageQuery(c)
	if pageInfo.PageSize < 1 {
		pageInfo.PageSize = common.ItemsPerPage
	}

	items, total, err := model.GetUserGiftQuotaHistory(userId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}
