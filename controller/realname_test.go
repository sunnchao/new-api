package controller

import (
	"net/http"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	realnamesvc "github.com/QuantumNous/new-api/service/realname"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestCreateRealNameSessionEndpoint(t *testing.T) {
	setupInvoiceControllerTestDB(t)

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/session", gin.H{
		"verify_type": model.VerifyTypePersonal,
		"provider":    "mock",
	}, 7, "alice", common.RoleCommonUser)
	CreateRealNameSession(ctx)

	var payload realNameSessionResponse
	response := decodeInvoiceAPIResponse(t, recorder, &payload)
	require.True(t, response.Success)
	require.NotEmpty(t, payload.Session.ProviderRequestID)

	status, err := model.GetUserRealNameStatus(7)
	require.NoError(t, err)
	require.NotNil(t, status[model.VerifyTypePersonal])
}

func TestCreateRealNameSessionFallsBackToSingleAvailableProvider(t *testing.T) {
	setupInvoiceControllerTestDB(t)

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/session", gin.H{
		"verify_type": model.VerifyTypePersonal,
		"provider":    "unsupported-provider",
	}, 7, "alice", common.RoleCommonUser)
	CreateRealNameSession(ctx)

	var payload realNameSessionResponse
	response := decodeInvoiceAPIResponse(t, recorder, &payload)
	require.True(t, response.Success)
	require.Equal(t, "mock", payload.Session.Provider)
	require.Equal(t, "mock", payload.Verification.Provider)
}

func TestCreateRealNameSessionRejectsMockOutsideTestMode(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	previousDebug := common.DebugEnabled
	common.DebugEnabled = false
	t.Cleanup(func() {
		common.DebugEnabled = previousDebug
	})
	t.Setenv("REALNAME_MOCK_PROVIDER_ENABLED", "false")
	gin.SetMode(gin.ReleaseMode)
	t.Cleanup(func() {
		gin.SetMode(gin.TestMode)
	})

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/session", gin.H{
		"verify_type": model.VerifyTypePersonal,
		"provider":    "mock",
	}, 7, "alice", common.RoleCommonUser)
	CreateRealNameSession(ctx)

	response := decodeInvoiceAPIResponse(t, recorder, nil)
	require.False(t, response.Success)
	require.Contains(t, response.Message, "unsupported")
}

func TestGetRealNameStatusContainsAvailableProviders(t *testing.T) {
	setupInvoiceControllerTestDB(t)

	ctx, recorder := newInvoiceContext(t, http.MethodGet, "/api/realname/status", nil, 7, "alice", common.RoleCommonUser)
	GetRealNameStatus(ctx)

	var payload map[string]interface{}
	response := decodeInvoiceAPIResponse(t, recorder, &payload)
	require.True(t, response.Success)
	require.Equal(t, "mock", payload["realname_provider"])
	providers, ok := payload["realname_providers"].([]interface{})
	require.True(t, ok)
	require.Contains(t, providers, "mock")
}

func TestGetRealNameStatusReturnsEmptyProvidersWhenMockDisabled(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	previousDebug := common.DebugEnabled
	common.DebugEnabled = false
	t.Cleanup(func() {
		common.DebugEnabled = previousDebug
	})
	t.Setenv("REALNAME_MOCK_PROVIDER_ENABLED", "false")
	gin.SetMode(gin.ReleaseMode)
	t.Cleanup(func() {
		gin.SetMode(gin.TestMode)
	})

	ctx, recorder := newInvoiceContext(t, http.MethodGet, "/api/realname/status", nil, 7, "alice", common.RoleCommonUser)
	GetRealNameStatus(ctx)

	var payload map[string]interface{}
	response := decodeInvoiceAPIResponse(t, recorder, &payload)
	require.True(t, response.Success)
	_, hasProvider := payload["realname_provider"]
	require.False(t, hasProvider)
	providers, ok := payload["realname_providers"].([]interface{})
	require.True(t, ok)
	require.Empty(t, providers)
}

func TestGetStatusContainsAvailableRealNameProviders(t *testing.T) {
	setupInvoiceControllerTestDB(t)

	ctx, recorder := newInvoiceContext(t, http.MethodGet, "/api/status", nil, 0, "", common.RoleGuestUser)
	GetStatus(ctx)

	var payload map[string]interface{}
	response := decodeInvoiceAPIResponse(t, recorder, &payload)
	require.True(t, response.Success)
	require.Equal(t, "mock", payload["realname_provider"])
	providers, ok := payload["realname_providers"].([]interface{})
	require.True(t, ok)
	require.Contains(t, providers, "mock")
}

func TestGetStatusRealNameProvidersEmptyWhenMockDisabled(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	previousDebug := common.DebugEnabled
	common.DebugEnabled = false
	t.Cleanup(func() {
		common.DebugEnabled = previousDebug
	})
	t.Setenv("REALNAME_MOCK_PROVIDER_ENABLED", "false")
	gin.SetMode(gin.ReleaseMode)
	t.Cleanup(func() {
		gin.SetMode(gin.TestMode)
	})

	ctx, recorder := newInvoiceContext(t, http.MethodGet, "/api/status", nil, 0, "", common.RoleGuestUser)
	GetStatus(ctx)

	var payload map[string]interface{}
	response := decodeInvoiceAPIResponse(t, recorder, &payload)
	require.True(t, response.Success)
	_, hasProvider := payload["realname_provider"]
	require.False(t, hasProvider)
	providers, ok := payload["realname_providers"].([]interface{})
	require.True(t, ok)
	require.Empty(t, providers)
}

func TestRealNameCallbackUpdatesProfile(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	verification, err := model.CreateRealNameVerificationSession(7, model.VerifyTypeCompany, "mock", "mock-company-2")
	require.NoError(t, err)

	creditCode := "91310000MA1K00000X"
	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/callback/mock", gin.H{
		"provider_request_id": verification.ProviderRequestId,
		"status":              model.RealNameStatusVerified,
		"company_name":        "Example Ltd",
		"credit_code":         creditCode,
	}, 0, "", common.RoleGuestUser)
	ctx.Request.Header.Set("X-RealName-Signature", realnamesvc.MockCallbackSignature)
	ctx.Params = gin.Params{{Key: "provider", Value: "mock"}}
	RealNameCallback(ctx)

	response := decodeInvoiceAPIResponse(t, recorder, nil)
	require.True(t, response.Success)

	profiles, err := model.GetUserInvoiceProfiles(7)
	require.NoError(t, err)
	require.NotNil(t, profiles.Company)
	require.Equal(t, "Example Ltd", profiles.Company.Title)

	updated, err := model.GetRealNameVerificationByProviderRequest("mock", verification.ProviderRequestId)
	require.NoError(t, err)
	require.NotContains(t, updated.RawPayloadEncrypted, creditCode)
	require.Contains(t, updated.RawPayloadEncrypted, common.GenerateHMAC(creditCode))
}

func TestRealNameCallbackRejectsOversizedBody(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	_, err := model.CreateRealNameVerificationSession(7, model.VerifyTypePersonal, "mock", "mock-oversized")
	require.NoError(t, err)

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/callback/mock", strings.Repeat("x", 2<<20), 0, "", common.RoleGuestUser)
	ctx.Request.Header.Set("X-RealName-Signature", realnamesvc.MockCallbackSignature)
	ctx.Params = gin.Params{{Key: "provider", Value: "mock"}}
	RealNameCallback(ctx)

	response := decodeInvoiceAPIResponse(t, recorder, nil)
	require.False(t, response.Success)
	require.Contains(t, response.Message, "request body too large")
}

func TestRealNameCallbackRejectsMockOutsideTestMode(t *testing.T) {
	setupInvoiceControllerTestDB(t)
	previousDebug := common.DebugEnabled
	common.DebugEnabled = false
	t.Cleanup(func() {
		common.DebugEnabled = previousDebug
	})
	t.Setenv("REALNAME_MOCK_PROVIDER_ENABLED", "false")
	gin.SetMode(gin.ReleaseMode)
	t.Cleanup(func() {
		gin.SetMode(gin.TestMode)
	})

	ctx, recorder := newInvoiceContext(t, http.MethodPost, "/api/realname/callback/mock", gin.H{
		"provider_request_id": "mock-company-2",
		"status":              model.RealNameStatusVerified,
	}, 0, "", common.RoleGuestUser)
	ctx.Request.Header.Set("X-RealName-Signature", realnamesvc.MockCallbackSignature)
	ctx.Params = gin.Params{{Key: "provider", Value: "mock"}}
	RealNameCallback(ctx)

	response := decodeInvoiceAPIResponse(t, recorder, nil)
	require.False(t, response.Success)
	require.Contains(t, response.Message, "unsupported")
}
