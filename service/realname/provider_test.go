package realname

import (
	"context"
	"testing"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/require"
)

func TestMockProviderCreatesSession(t *testing.T) {
	provider := MockProvider{}
	session, err := provider.CreateSession(context.Background(), CreateSessionRequest{
		UserID:     7,
		VerifyType: model.VerifyTypePersonal,
	})
	require.NoError(t, err)
	require.Equal(t, "mock", provider.ProviderName())
	require.NotEmpty(t, session.ProviderRequestID)
	require.Contains(t, session.RedirectURL, "/realname/mock/")
}

func TestProviderRegistry(t *testing.T) {
	RegisterProvider(MockProvider{})
	provider, ok := GetProvider("mock")
	require.True(t, ok)
	require.Equal(t, "mock", provider.ProviderName())
}

func TestListProviderNames(t *testing.T) {
	RegisterProvider(MockProvider{})
	names := ListProviderNames()
	require.Contains(t, names, "mock")
}

func TestMockProviderRejectsInvalidSignature(t *testing.T) {
	provider := MockProvider{}
	_, err := provider.VerifyCallback(context.Background(), CallbackRequest{
		ProviderRequestID: "mock-1",
		Status:            model.RealNameStatusVerified,
		Signature:         "bad-signature",
	})
	require.ErrorIs(t, err, ErrInvalidSignature)
}
