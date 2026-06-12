package middleware

import (
	"fmt"
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
)

func GroupClientRestriction() func(c *gin.Context) {
	return func(c *gin.Context) {
		usingGroup := common.GetContextKeyString(c, constant.ContextKeyUsingGroup)
		// Concrete groups can be rejected immediately; auto/backup candidates are
		// filtered in service.CacheGetRandomSatisfiedChannel after selection expands.
		if usingGroup == "" || usingGroup == "auto" || service.IsRequestAllowedForGroup(c, usingGroup) {
			c.Next()
			return
		}

		abortWithOpenAiMessage(
			c,
			http.StatusForbidden,
			fmt.Sprintf("分组 %s 仅允许指定客户端访问", usingGroup),
			types.ErrorCodeAccessDenied,
		)
	}
}
