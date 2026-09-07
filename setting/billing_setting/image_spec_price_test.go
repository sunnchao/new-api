package billing_setting

import (
	"encoding/json"
	"testing"

	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLookupImageSpecPriceOrder(t *testing.T) {
	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		saved[key] = value
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
	})
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.image_spec_price": `{"grok-imagine-image-2.0":{"2k/medium":0.07,"2k":0.06,"medium":0.04,"1k/low":0.02}}`,
	}))

	tests := []struct {
		name       string
		resolution string
		quality    string
		wantPrice  float64
		wantFound  bool
	}{
		{name: "resolution and quality", resolution: "2K", quality: "Medium", wantPrice: 0.07, wantFound: true},
		{name: "resolution only", resolution: "2k", quality: "", wantPrice: 0.06, wantFound: true},
		{name: "quality only", resolution: "", quality: "medium", wantPrice: 0.04, wantFound: true},
		{name: "unmatched falls through", resolution: "1k", quality: "auto", wantFound: false},
		{name: "unknown model", resolution: "2k", quality: "medium", wantFound: false},
	}

	for _, testCase := range tests {
		t.Run(testCase.name, func(t *testing.T) {
			model := "grok-imagine-image-2.0"
			if testCase.name == "unknown model" {
				model = "missing-model"
			}
			price, found := LookupImageSpecPrice(model, testCase.resolution, testCase.quality)
			require.Equal(t, testCase.wantFound, found)
			if testCase.wantFound {
				assert.Equal(t, testCase.wantPrice, price)
			}
		})
	}
}

func TestOverlayImageSpecPriceUsesRequestExtra(t *testing.T) {
	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		saved[key] = value
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
	})
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.image_spec_price": `{"grok-imagine-image-2.0":{"2k/medium":0.07}}`,
	}))

	request := &dto.ImageRequest{
		Quality: "medium",
		Extra: map[string]json.RawMessage{
			"resolution": json.RawMessage(`"2k"`),
		},
	}
	assert.Equal(t, 0.07, OverlayImageSpecPrice("grok-imagine-image-2.0", request, 0.02))
	assert.Equal(t, 0.02, OverlayImageSpecPrice("grok-imagine-image-2.0", &dto.ImageRequest{Quality: "auto"}, 0.02))
	assert.Equal(t, 0.02, OverlayImageSpecPrice("grok-imagine-image-2.0", nil, 0.02))
}

func TestOverlayImageSpecPriceMapsOpenAISizeAndQuality(t *testing.T) {
	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		saved[key] = value
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
	})
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.image_spec_price": `{"grok-imagine-image-2.0":{"1k/low":0.02,"1k/medium":0.04,"2k/medium":0.07}}`,
	}))

	assert.Equal(t, 0.02, OverlayImageSpecPrice("grok-imagine-image-2.0", &dto.ImageRequest{Size: "1024x1024"}, 0.08))
	assert.Equal(t, 0.02, OverlayImageSpecPrice("grok-imagine-image-2.0", &dto.ImageRequest{Size: "1024x1024", Quality: "standard"}, 0.08))
	assert.Equal(t, 0.04, OverlayImageSpecPrice("grok-imagine-image-2.0", &dto.ImageRequest{Size: "1024x1792", Quality: "hd"}, 0.08))
	assert.Equal(t, 0.07, OverlayImageSpecPrice("grok-imagine-image-2.0", &dto.ImageRequest{
		Size:    "1024x1024",
		Quality: "hd",
		Extra: map[string]json.RawMessage{
			"resolution": json.RawMessage(`"2k"`),
		},
	}, 0.08))
}

func TestGetImageSpecPriceCopyIsDetached(t *testing.T) {
	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		saved[key] = value
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
	})
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.image_spec_price": `{"grok-imagine-image-2.0":{"1k/high":0.08,"2k":0.06}}`,
	}))

	copied := GetImageSpecPriceCopy("grok-imagine-image-2.0")
	require.Equal(t, map[string]float64{"1k/high": 0.08, "2k": 0.06}, copied)
	copied["1k/high"] = 9.99
	copied["new"] = 1
	fresh := GetImageSpecPriceCopy("grok-imagine-image-2.0")
	assert.Equal(t, 0.08, fresh["1k/high"])
	_, exists := fresh["new"]
	assert.False(t, exists)
	assert.Nil(t, GetImageSpecPriceCopy("missing-model"))
}

func TestValidateImageSpecPriceJSON(t *testing.T) {
	require.NoError(t, ValidateImageSpecPriceJSON(`{}`))
	require.NoError(t, ValidateImageSpecPriceJSON(`{"grok-imagine-image-2.0":{"1k/low":0.02,"2k/medium":0.07}}`))
	require.ErrorContains(t, ValidateImageSpecPriceJSON(`{"grok-imagine-image-2.0":{"2K":0.06}}`), "must be lowercase")
	require.ErrorContains(t, ValidateImageSpecPriceJSON(`{"grok-imagine-image-2.0":{"2k":-0.01}}`), "finite and non-negative")
	require.ErrorContains(t, ValidateImageSpecPriceJSON(`{"grok-imagine-image-2.0":0.02}`), "JSON object")
}
