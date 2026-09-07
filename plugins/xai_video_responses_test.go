package plugins_test

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/pkg/jsplugin"
	builtinplugins "github.com/QuantumNous/new-api/plugins"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestXaiVideoResponsesProtocol(t *testing.T) {
	testVideoResponsesProtocol(t, videoResponsesTestCase{
		pluginKey: "xai-video",
		model:     "grok-imagine-video-1.5",
		requestBody: map[string]any{
			"model":   "grok-imagine-video-1.5",
			"input":   "ocean at sunset",
			"seconds": 10,
			"size":    "1280x720",
		},
		wantAction: "text_to_video",
		wantRequest: map[string]any{
			"model":      "grok-imagine-video-1.5",
			"prompt":     "ocean at sunset",
			"duration":   float64(10),
			"size":       "1280x720",
			"resolution": "720p",
		},
		wantUsageKeys:  []string{"resolution", "seconds"},
		wantVendorName: "xai-video",
	})
}

func TestXaiVideoUsageAndNativeContracts(t *testing.T) {
	source, err := builtinplugins.Source("xai-video")
	require.NoError(t, err)
	plugin, err := jsplugin.NewRegistry().RegisterFactory(source, jsplugin.Options{Key: "xai-video"})
	require.NoError(t, err)

	t.Run("extractUsage skips billing_ratios", func(t *testing.T) {
		value, callErr := plugin.Engine.Call(t.Context(), "extractUsage", map[string]any{
			"usagePurpose":  "billing_ratios",
			"upstreamModel": "grok-imagine-video-1.5",
			"requestBody":   map[string]any{"duration": float64(5), "resolution": "720p"},
		})
		require.NoError(t, callErr)
		assert.Nil(t, value)
	})

	t.Run("rejects 1080p on grok-imagine-video", func(t *testing.T) {
		_, callErr := plugin.Engine.CallPath(
			t.Context(),
			"protocols",
			[]string{"openai_video", "decodeRequest"},
			map[string]any{
				"body":  map[string]any{"kind": "json", "value": map[string]any{"model": "grok-imagine-video", "prompt": "waves", "duration": 5, "resolution": "1080p"}},
				"model": "grok-imagine-video",
			},
		)
		require.ErrorContains(t, callErr, "1080p is only supported by grok-imagine-video-1.5")
	})

	t.Run("rejects duration outside 1-15", func(t *testing.T) {
		_, callErr := plugin.Engine.CallPath(
			t.Context(),
			"protocols",
			[]string{"openai_video", "decodeRequest"},
			map[string]any{
				"body":  map[string]any{"kind": "json", "value": map[string]any{"model": "grok-imagine-video-1.5", "prompt": "waves", "seconds": 16}},
				"model": "grok-imagine-video-1.5",
			},
		)
		require.ErrorContains(t, callErr, "duration must be an integer between 1 and 15")
	})

	t.Run("decodes native generations submit", func(t *testing.T) {
		value, callErr := plugin.Engine.CallMember(
			t.Context(),
			"native",
			"decodeSubmit",
			map[string]any{
				"body": map[string]any{
					"kind": "json",
					"value": map[string]any{
						"model":        "grok-imagine-video-1.5",
						"prompt":       "waves",
						"duration":     float64(8),
						"resolution":   "1080p",
						"aspect_ratio": "16:9",
					},
				},
			},
		)
		require.NoError(t, callErr)
		encoded, marshalErr := common.Marshal(value)
		require.NoError(t, marshalErr)
		var decoded map[string]any
		require.NoError(t, common.Unmarshal(encoded, &decoded))
		assert.Equal(t, "text_to_video", decoded["action"])
		assert.Equal(t, "grok-imagine-video-1.5", decoded["model"])
		requestBody, ok := decoded["requestBody"].(map[string]any)
		require.True(t, ok)
		assert.Equal(t, float64(8), requestBody["duration"])
		assert.Equal(t, "1080p", requestBody["resolution"])
		assert.Equal(t, "16:9", requestBody["aspect_ratio"])
	})
}
