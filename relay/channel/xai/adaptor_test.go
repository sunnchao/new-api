package xai

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

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
