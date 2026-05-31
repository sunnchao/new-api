package dto

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

// TestImageRequestStreamJSON verifies that image requests preserve stream=true.
func TestImageRequestStreamJSON(t *testing.T) {
	var req ImageRequest
	require.NoError(t, req.UnmarshalJSON([]byte(`{"model":"gpt-image-1","prompt":"draw a cat","stream":true}`)))

	require.True(t, req.Stream != nil && *req.Stream)
	require.True(t, req.IsStream(nil))
}

func TestImageRequestPreserveExplicitStreamFalse(t *testing.T) {
	raw := []byte(`{
		"model":"gpt-image-1",
		"prompt":"draw a quiet city",
		"stream":false,
		"partial_images":2
	}`)

	var req ImageRequest
	err := common.Unmarshal(raw, &req)
	require.NoError(t, err)

	encoded, err := common.Marshal(req)
	require.NoError(t, err)

	require.True(t, gjson.GetBytes(encoded, "stream").Exists())
	require.False(t, gjson.GetBytes(encoded, "stream").Bool())
	require.True(t, gjson.GetBytes(encoded, "partial_images").Exists())
}
