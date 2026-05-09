package realname

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const MockCallbackSignature = "mock-valid-signature"

var (
	ErrUnsupportedProvider = errors.New("unsupported real-name provider")
	ErrInvalidSignature    = errors.New("invalid real-name callback signature")
)

type CreateSessionRequest struct {
	UserID     int
	VerifyType string
}

type Session struct {
	Provider          string                 `json:"provider"`
	ProviderRequestID string                 `json:"provider_request_id"`
	RedirectURL       string                 `json:"redirect_url"`
	QRCodeURL         string                 `json:"qr_code_url"`
	Metadata          map[string]interface{} `json:"metadata"`
}

type CallbackRequest struct {
	ProviderRequestID string
	Status            string
	VerifiedName      string
	CompanyName       string
	IdNo              string
	CreditCode        string
	LegalPersonName   string
	ResultCode        string
	ResultMessage     string
	RawPayload        string
	Signature         string
}

type CallbackResult struct {
	ProviderRequestID string
	Status            string
	VerifiedName      string
	CompanyName       string
	IdNo              string
	CreditCode        string
	LegalPersonName   string
	ResultCode        string
	ResultMessage     string
	RawPayload        string
}

type Provider interface {
	ProviderName() string
	CreateSession(ctx context.Context, request CreateSessionRequest) (Session, error)
	VerifyCallback(ctx context.Context, request CallbackRequest) (CallbackResult, error)
}

var (
	providersMu sync.RWMutex
	providers   = map[string]Provider{}
)

func RegisterProvider(provider Provider) {
	if provider == nil {
		return
	}
	name := strings.TrimSpace(provider.ProviderName())
	if name == "" {
		return
	}
	providersMu.Lock()
	defer providersMu.Unlock()
	if _, ok := providers[name]; ok {
		return
	}
	providers[name] = provider
}

func GetProvider(name string) (Provider, bool) {
	providersMu.RLock()
	defer providersMu.RUnlock()
	provider, ok := providers[strings.TrimSpace(name)]
	return provider, ok
}

type MockProvider struct{}

func (MockProvider) ProviderName() string {
	return "mock"
}

func (p MockProvider) CreateSession(ctx context.Context, request CreateSessionRequest) (Session, error) {
	if !model.IsValidVerifyType(request.VerifyType) {
		return Session{}, model.ErrRealNameVerifyTypeInvalid
	}
	providerRequestID := "mock-" + common.GetUUID()
	return Session{
		Provider:          p.ProviderName(),
		ProviderRequestID: providerRequestID,
		RedirectURL:       fmt.Sprintf("/realname/mock/%s", providerRequestID),
		QRCodeURL:         "",
		Metadata: map[string]interface{}{
			"verify_type": request.VerifyType,
		},
	}, nil
}

func (p MockProvider) VerifyCallback(ctx context.Context, request CallbackRequest) (CallbackResult, error) {
	if request.Signature != MockCallbackSignature {
		return CallbackResult{}, ErrInvalidSignature
	}
	return CallbackResult{
		ProviderRequestID: request.ProviderRequestID,
		Status:            request.Status,
		VerifiedName:      request.VerifiedName,
		CompanyName:       request.CompanyName,
		IdNo:              request.IdNo,
		CreditCode:        request.CreditCode,
		LegalPersonName:   request.LegalPersonName,
		ResultCode:        request.ResultCode,
		ResultMessage:     request.ResultMessage,
		RawPayload:        request.RawPayload,
	}, nil
}

func init() {
	RegisterProvider(MockProvider{})
}
