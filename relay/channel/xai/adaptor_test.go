package xai

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConvertImageRequestPassesResolutionQualityAndCapsN(t *testing.T) {
	gin.SetMode(gin.TestMode)
	adaptor := &Adaptor{}
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	info := &relaycommon.RelayInfo{OriginModelName: "grok-imagine-image-2.0"}
	n := uint(2)

	got, err := adaptor.ConvertImageRequest(ctx, info, dto.ImageRequest{
		Model:   "grok-imagine-image-2.0",
		Prompt:  "a red fox",
		N:       &n,
		Quality: "medium",
		Extra: map[string]json.RawMessage{
			"resolution":   json.RawMessage(`"2k"`),
			"aspect_ratio": json.RawMessage(`"16:9"`),
		},
	})
	require.NoError(t, err)
	request, ok := got.(ImageRequest)
	require.True(t, ok)
	assert.Equal(t, "grok-imagine-image-2.0", request.Model)
	assert.Equal(t, "a red fox", request.Prompt)
	assert.Equal(t, 2, request.N)
	assert.Equal(t, "medium", request.Quality)
	assert.Equal(t, "2k", request.Resolution)
	assert.Equal(t, "16:9", request.AspectRatio)

	tooMany := uint(11)
	_, err = adaptor.ConvertImageRequest(ctx, info, dto.ImageRequest{
		Model:  "grok-imagine-image-2.0",
		Prompt: "a red fox",
		N:      &tooMany,
	})
	require.ErrorContains(t, err, "n must be at most 10")
}

func TestXAIStreamHandlerKeepsCachedTokens(t *testing.T) {
	gin.SetMode(gin.TestMode)
	oldTimeout := constant.StreamingTimeout
	constant.StreamingTimeout = 30
	t.Cleanup(func() { constant.StreamingTimeout = oldTimeout })

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)

	body := strings.Join([]string{
		`data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"grok-4.7","choices":[{"index":0,"delta":{"content":"hi"},"finish_reason":null}]}`,
		``,
		`data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"grok-4.7","choices":[],"usage":{"prompt_tokens":1000,"completion_tokens":50,"total_tokens":1050,"prompt_tokens_details":{"cached_tokens":800},"completion_tokens_details":{"reasoning_tokens":20}}}`,
		``,
		`data: [DONE]`,
		``,
	}, "\n")
	resp := &http.Response{
		StatusCode: http.StatusOK,
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader(body)),
	}

	usage, apiErr := xAIStreamHandler(c, &relaycommon.RelayInfo{
		OriginModelName: "grok-4.7",
		ChannelMeta:     &relaycommon.ChannelMeta{UpstreamModelName: "grok-4.7"},
	}, resp)
	require.Nil(t, apiErr)
	require.NotNil(t, usage)
	assert.Equal(t, 1000, usage.PromptTokens)
	assert.Equal(t, 50, usage.CompletionTokens)
	assert.Equal(t, 1050, usage.TotalTokens)
	assert.Equal(t, 800, usage.PromptTokensDetails.CachedTokens, "cache hits must survive the stream conversion")
	assert.Equal(t, 20, usage.CompletionTokenDetails.ReasoningTokens)
}

func TestConvertImageRequestMapsOpenAISizeAndQuality(t *testing.T) {
	gin.SetMode(gin.TestMode)
	adaptor := &Adaptor{}
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	info := &relaycommon.RelayInfo{OriginModelName: "grok-imagine-image-2.0"}

	got, err := adaptor.ConvertImageRequest(ctx, info, dto.ImageRequest{
		Model:   "grok-imagine-image-2.0",
		Prompt:  "a red fox",
		Size:    "1024x1024",
		Quality: "standard",
	})
	require.NoError(t, err)
	request, ok := got.(ImageRequest)
	require.True(t, ok)
	assert.Equal(t, "1k", request.Resolution)
	assert.Equal(t, "low", request.Quality)
}
