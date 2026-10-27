package oauth

import (
	"context"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGitHubRegistrationEligibilityMinimumAccountAge(t *testing.T) {
	previous := common.GitHubMinimumAccountAgeDays
	t.Cleanup(func() { common.GitHubMinimumAccountAgeDays = previous })

	formatAge := func(days int) string {
		return time.Now().Add(-time.Duration(days) * 24 * time.Hour).UTC().Format(time.RFC3339)
	}

	tests := []struct {
		name         string
		minDays      int
		createdAt    string
		wantRejected bool
	}{
		{name: "disabled", minDays: 0, createdAt: formatAge(0)},
		{name: "too new", minDays: 7, createdAt: formatAge(2), wantRejected: true},
		{name: "old enough", minDays: 7, createdAt: formatAge(30)},
		{name: "missing creation time", minDays: 7, wantRejected: true},
		{name: "invalid creation time", minDays: 7, createdAt: "not-a-time", wantRejected: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			common.GitHubMinimumAccountAgeDays = test.minDays
			provider := &GitHubProvider{}
			err := provider.CheckRegistrationEligibility(context.Background(), &OAuthUser{
				ProviderUserID: "1",
				Extra:          map[string]any{"github_created_at": test.createdAt},
			})
			if !test.wantRejected {
				require.NoError(t, err)
				return
			}
			var ageErr *AccountAgeError
			require.ErrorAs(t, err, &ageErr)
			assert.Equal(t, test.minDays, ageErr.RequiredDays)
		})
	}
}
