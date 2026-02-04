package common

import "strings"

const (
	MjModelFast  = "fast"
	MjModelRelax = "relax"
	MjModelTurbo = "turbo"
)

// NormalizeMjModel normalizes Midjourney drawing mode values.
// It accepts both "fast"/"relax"/"turbo" and prefixed "mj-fast"/"mj-relax"/"mj-turbo".
// Empty string is considered valid and means "not set".
func NormalizeMjModel(model string) (string, bool) {
	s := strings.TrimSpace(strings.ToLower(model))
	if s == "" {
		return "", true
	}
	s = strings.TrimPrefix(s, "mj-")
	switch s {
	case MjModelFast, MjModelRelax, MjModelTurbo:
		return s, true
	default:
		return "", false
	}
}
