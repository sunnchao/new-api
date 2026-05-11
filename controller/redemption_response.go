package controller

import (
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

func buildTopUpRedemptionResponse(result *model.RedemptionResult) any {
	if result == nil {
		return 0
	}
	if result.Type == model.RedemptionTypeSubscription {
		data := gin.H{
			"type":         result.Type,
			"subscription": result.Subscription,
		}
		if result.Plan != nil {
			data["plan"] = result.Plan
		}
		return data
	}
	return result.Quota
}
