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
	// SafeAuditPayload must not contain raw callback payloads or unmasked PII.
	SafeAuditPayload string
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
		SafeAuditPayload:  BuildSafeAuditPayload(request),
	}, nil
}

func BuildSafeAuditPayload(request CallbackRequest) string {
	audit := map[string]string{
		"provider_request_id": request.ProviderRequestID,
		"status":              request.Status,
		"result_code":         request.ResultCode,
		"raw_payload_hmac":    common.GenerateHMAC(request.RawPayload),
	}
	if strings.TrimSpace(request.ResultMessage) != "" {
		audit["result_message_hmac"] = common.GenerateHMAC(request.ResultMessage)
	}
	if strings.TrimSpace(request.IdNo) != "" {
		audit["id_no_hmac"] = common.GenerateHMAC(request.IdNo)
	}
	if strings.TrimSpace(request.CreditCode) != "" {
		audit["credit_code_hmac"] = common.GenerateHMAC(request.CreditCode)
	}
	if strings.TrimSpace(request.VerifiedName) != "" {
		audit["verified_name_hmac"] = common.GenerateHMAC(request.VerifiedName)
	}
	if strings.TrimSpace(request.CompanyName) != "" {
		audit["company_name_hmac"] = common.GenerateHMAC(request.CompanyName)
	}
	if strings.TrimSpace(request.LegalPersonName) != "" {
		audit["legal_person_name_hmac"] = common.GenerateHMAC(request.LegalPersonName)
	}
	payload, err := common.Marshal(audit)
	if err != nil {
		return ""
	}
	return string(payload)
}

func init() {
	RegisterProvider(MockProvider{})
}
