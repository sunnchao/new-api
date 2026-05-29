package openai

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
)

type imageStreamEvent struct {
	Type               string                 `json:"type"`
	Usage              *dto.Usage             `json:"usage"`
	InputTokens        int                    `json:"input_tokens"`
	OutputTokens       int                    `json:"output_tokens"`
	TotalTokens        int                    `json:"total_tokens"`
	InputTokensDetails *dto.InputTokenDetails `json:"input_tokens_details"`
}

func OpenaiImageStreamHandler(c *gin.Context, info *relaycommon.RelayInfo, resp *http.Response) (*dto.Usage, *types.NewAPIError) {
	if resp == nil || resp.Body == nil {
		logger.LogError(c, "invalid response or response body")
		return nil, types.NewOpenAIError(fmt.Errorf("invalid response"), types.ErrorCodeBadResponse, http.StatusInternalServerError)
	}

	defer service.CloseResponseBodyGracefully(resp)

	usage := &dto.Usage{}
	var lastStreamData string

	helper.StreamScannerHandler(c, resp, info, func(data string, sr *helper.StreamResult) {
		lastStreamData = data
		if err := helper.StringData(c, data); err != nil {
			sr.Error(err)
			return
		}

		var event imageStreamEvent
		if err := common.UnmarshalJsonStr(data, &event); err != nil {
			logger.LogError(c, "failed to unmarshal image stream event: "+err.Error())
			sr.Error(err)
			return
		}

		if isImageStreamCompletedEvent(event.Type) {
			applyImageStreamUsage(usage, event)
		}
	})
	helper.Done(c)

	if usage.TotalTokens == 0 && lastStreamData != "" {
		var event imageStreamEvent
		if err := common.UnmarshalJsonStr(lastStreamData, &event); err == nil && isImageStreamCompletedEvent(event.Type) {
			applyImageStreamUsage(usage, event)
		}
	}

	return usage, nil
}

func isImageStreamCompletedEvent(eventType string) bool {
	eventType = strings.ToLower(strings.TrimSpace(eventType))
	return eventType == "image_generation.completed" || eventType == "image_edit.completed"
}

func applyImageStreamUsage(usage *dto.Usage, event imageStreamEvent) {
	if usage == nil {
		return
	}

	if event.Usage != nil {
		usage.PromptTokens = event.Usage.PromptTokens
		usage.CompletionTokens = event.Usage.CompletionTokens
		usage.TotalTokens = event.Usage.TotalTokens
		usage.PromptTokensDetails = event.Usage.PromptTokensDetails
		usage.CompletionTokenDetails = event.Usage.CompletionTokenDetails
		usage.InputTokens = event.Usage.InputTokens
		usage.OutputTokens = event.Usage.OutputTokens
		usage.InputTokensDetails = event.Usage.InputTokensDetails
		usage.PromptCacheHitTokens = event.Usage.PromptCacheHitTokens
		usage.UsageSemantic = event.Usage.UsageSemantic
		usage.UsageSource = event.Usage.UsageSource
		usage.ClaudeCacheCreation5mTokens = event.Usage.ClaudeCacheCreation5mTokens
		usage.ClaudeCacheCreation1hTokens = event.Usage.ClaudeCacheCreation1hTokens
		usage.Cost = event.Usage.Cost
	}

	if usage.PromptTokens == 0 && usage.InputTokens > 0 {
		usage.PromptTokens = usage.InputTokens
	}
	if usage.CompletionTokens == 0 && usage.OutputTokens > 0 {
		usage.CompletionTokens = usage.OutputTokens
	}
	if usage.PromptTokens == 0 && event.InputTokens > 0 {
		usage.PromptTokens = event.InputTokens
	}
	if usage.CompletionTokens == 0 && event.OutputTokens > 0 {
		usage.CompletionTokens = event.OutputTokens
	}
	if usage.TotalTokens == 0 && event.TotalTokens > 0 {
		usage.TotalTokens = event.TotalTokens
	}
	if event.InputTokensDetails != nil {
		usage.InputTokensDetails = event.InputTokensDetails
	}
	if usage.InputTokensDetails != nil {
		usage.PromptTokensDetails.ImageTokens += usage.InputTokensDetails.ImageTokens
		usage.PromptTokensDetails.TextTokens += usage.InputTokensDetails.TextTokens
		usage.PromptTokensDetails.AudioTokens += usage.InputTokensDetails.AudioTokens
		usage.PromptTokensDetails.CachedTokens += usage.InputTokensDetails.CachedTokens
		usage.PromptTokensDetails.CachedCreationTokens += usage.InputTokensDetails.CachedCreationTokens
	}
	if usage.TotalTokens == 0 && (usage.PromptTokens != 0 || usage.CompletionTokens != 0) {
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
	}
}
