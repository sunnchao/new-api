package openai

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/types"
	"github.com/stretchr/testify/require"

	"github.com/gin-gonic/gin"
)

func TestOpenaiImageStreamHandlerUsesOnlyCompletedUsageForBilling(t *testing.T) {
	gin.SetMode(gin.TestMode)

	body := strings.Join([]string{
		`data: {"type":"image_generation.partial_image","partial_image_index":0,"b64_json":"partial"}`,
		`data: {"type":"image_generation.completed","b64_json":"final","usage":{"input_tokens":12,"output_tokens":7,"total_tokens":19,"input_tokens_details":{"text_tokens":5,"image_tokens":7}}}`,
		`data: [DONE]`,
		``,
	}, "\n")

	resp := &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"text/event-stream"}},
		Body:       io.NopCloser(strings.NewReader(body)),
	}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)

	oldStreamingTimeout := constant.StreamingTimeout
	constant.StreamingTimeout = 30
	t.Cleanup(func() { constant.StreamingTimeout = oldStreamingTimeout })

	info := &relaycommon.RelayInfo{
		IsStream:        true,
		RelayMode:       relayconstant.RelayModeImagesGenerations,
		OriginModelName: "gpt-image-1",
		StartTime:       time.Now(),
		PriceData:       types.PriceData{},
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "gpt-image-1",
		},
	}

	usage, err := OpenaiImageStreamHandler(c, info, resp)
	require.Nil(t, err)
	require.NotNil(t, usage)
	require.Equal(t, 12, usage.PromptTokens)
	require.Equal(t, 7, usage.CompletionTokens)
	require.Equal(t, 19, usage.TotalTokens)
	require.Equal(t, 7, usage.PromptTokensDetails.ImageTokens)
	require.NotContains(t, info.PriceData.OtherRatios, "n")

	responseBody := w.Body.String()
	require.Contains(t, responseBody, "image_generation.partial_image")
	require.Contains(t, responseBody, "image_generation.completed")
	require.Contains(t, responseBody, "[DONE]")
}

func TestImageDoResponseFallsBackToJSONWhenStreamResponseIsNotSSE(t *testing.T) {
	gin.SetMode(gin.TestMode)

	resp := &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body: io.NopCloser(strings.NewReader(`{
			"usage":{
				"input_tokens":12,
				"output_tokens":7,
				"total_tokens":19,
				"input_tokens_details":{"text_tokens":5,"image_tokens":7}
			},
			"data":[{"b64_json":"final"}]
		}`)),
	}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", nil)

	info := &relaycommon.RelayInfo{
		IsStream:        true,
		RelayMode:       relayconstant.RelayModeImagesGenerations,
		OriginModelName: "gpt-image-1",
		PriceData:       types.PriceData{},
		ChannelMeta:     &relaycommon.ChannelMeta{UpstreamModelName: "gpt-image-1"},
	}

	usageAny, err := (&Adaptor{}).DoResponse(c, resp, info)
	require.Nil(t, err)
	usage, ok := usageAny.(*dto.Usage)
	require.True(t, ok)
	require.Equal(t, 12, usage.PromptTokens)
	require.Equal(t, 7, usage.CompletionTokens)
	require.Equal(t, 19, usage.TotalTokens)
	require.Equal(t, 7, usage.PromptTokensDetails.ImageTokens)
	require.NotContains(t, w.Body.String(), "[DONE]")
	require.Contains(t, w.Body.String(), `"data"`)
}
