package operation_setting

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGiftQuotaExpirationPolicyExpiresAt(t *testing.T) {
	grantedAt := time.Date(2026, time.January, 31, 10, 20, 30, 0, time.UTC)
	tests := []struct {
		name   string
		policy GiftQuotaExpirationPolicy
		want   int64
	}{
		{
			name:   "permanent",
			policy: GiftQuotaExpirationPolicy{Mode: GiftQuotaExpirationModePermanent},
			want:   0,
		},
		{
			name:   "seven days",
			policy: GiftQuotaExpirationPolicy{Mode: GiftQuotaExpirationModeDuration, Unit: GiftQuotaExpirationUnitDay, Value: 7},
			want:   grantedAt.AddDate(0, 0, 7).Unix(),
		},
		{
			name:   "one calendar month clamps month end",
			policy: GiftQuotaExpirationPolicy{Mode: GiftQuotaExpirationModeDuration, Unit: GiftQuotaExpirationUnitMonth, Value: 1},
			want:   time.Date(2026, time.February, 28, 10, 20, 30, 0, time.UTC).Unix(),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			require.NoError(t, test.policy.Validate())
			assert.Equal(t, test.want, test.policy.ExpiresAt(grantedAt))
		})
	}
}

func TestValidateGiftQuotaExpirationOption(t *testing.T) {
	require.NoError(t, ValidateGiftQuotaExpirationOption(
		GiftQuotaCheckinExpirationOption,
		`{"mode":"duration","unit":"day","value":7}`,
	))
	require.Error(t, ValidateGiftQuotaExpirationOption(
		GiftQuotaTopupBonusExpirationOption,
		`{"mode":"duration","unit":"month","value":0}`,
	))
}
