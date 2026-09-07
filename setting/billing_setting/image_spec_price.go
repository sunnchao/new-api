package billing_setting

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
)

// OverlayImageSpecPrice replaces a fixed ModelPrice when the request matches a
// configured resolution/quality spec. Missing specs keep modelPrice unchanged.
func OverlayImageSpecPrice(model string, request any, modelPrice float64) float64 {
	imageReq, ok := request.(*dto.ImageRequest)
	if !ok || imageReq == nil {
		return modelPrice
	}
	resolution, quality := ImageSpecFromRequest(imageReq)
	if price, found := LookupImageSpecPrice(model, resolution, quality); found {
		return price
	}
	return modelPrice
}

// ImageSpecFromRequest reads grok Extra.resolution/quality, then OpenAI size/quality aliases.
func ImageSpecFromRequest(imageReq *dto.ImageRequest) (resolution, quality string) {
	if imageReq == nil {
		return "", ""
	}
	quality = strings.ToLower(strings.TrimSpace(imageReq.Quality))
	switch quality {
	case "standard":
		quality = "low"
	case "hd":
		quality = "medium"
	}
	if raw, exists := imageReq.Extra["resolution"]; exists {
		var value string
		if err := common.Unmarshal(raw, &value); err == nil {
			resolution = value
		}
	}
	if resolution != "" {
		return resolution, quality
	}
	size := strings.ToLower(strings.TrimSpace(imageReq.Size))
	switch size {
	case "1k", "2k":
		resolution = size
	default:
		parts := strings.Split(size, "x")
		if len(parts) == 2 {
			width, widthErr := strconv.Atoi(parts[0])
			height, heightErr := strconv.Atoi(parts[1])
			if widthErr == nil && heightErr == nil && width > 0 && height > 0 {
				if max(width, height) >= 2048 {
					resolution = "2k"
				} else {
					resolution = "1k"
				}
			}
		}
	}
	if resolution != "" && quality == "" {
		quality = "low"
	}
	return resolution, quality
}

// GetImageSpecPriceCopy returns a detached copy of a model's image spec prices.
func GetImageSpecPriceCopy(model string) map[string]float64 {
	specs := billingSetting.ImageSpecPrice[model]
	if len(specs) == 0 {
		return nil
	}
	copied := make(map[string]float64, len(specs))
	for key, price := range specs {
		copied[key] = price
	}
	return copied
}

// LookupImageSpecPrice resolves an absolute per-image USD price.
// Lookup order, after lowercasing and trimming: {resolution}/{quality}, {resolution}, {quality}.
func LookupImageSpecPrice(model, resolution, quality string) (float64, bool) {
	specs := billingSetting.ImageSpecPrice[model]
	if len(specs) == 0 {
		return 0, false
	}
	resolution = strings.ToLower(strings.TrimSpace(resolution))
	quality = strings.ToLower(strings.TrimSpace(quality))
	keys := make([]string, 0, 3)
	if resolution != "" && quality != "" {
		keys = append(keys, resolution+"/"+quality)
	}
	if resolution != "" {
		keys = append(keys, resolution)
	}
	if quality != "" {
		keys = append(keys, quality)
	}
	for _, key := range keys {
		if price, ok := specs[key]; ok {
			return price, true
		}
	}
	return 0, false
}

// ValidateImageSpecPriceJSON rejects negative, NaN, Inf, empty, or mixed-case spec keys.
func ValidateImageSpecPriceJSON(raw string) error {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parsed := make(map[string]map[string]float64)
	if err := common.UnmarshalJsonStr(raw, &parsed); err != nil {
		return fmt.Errorf("image spec price must be a JSON object of model to spec prices: %w", err)
	}
	for model, specs := range parsed {
		if strings.TrimSpace(model) == "" {
			return fmt.Errorf("image spec price model name must not be empty")
		}
		if specs == nil {
			return fmt.Errorf("image spec price for model %s must be an object", model)
		}
		for spec, price := range specs {
			normalized := strings.ToLower(strings.TrimSpace(spec))
			if normalized == "" {
				return fmt.Errorf("image spec price key for model %s must not be empty", model)
			}
			if spec != normalized {
				return fmt.Errorf("image spec price key %q for model %s must be lowercase", spec, model)
			}
			if math.IsNaN(price) || math.IsInf(price, 0) || price < 0 {
				return fmt.Errorf("image spec price %q for model %s must be finite and non-negative", spec, model)
			}
		}
	}
	return nil
}
