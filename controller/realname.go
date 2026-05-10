package controller

import (
	"io"
	"net/http"
	"slices"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	realnamesvc "github.com/QuantumNous/new-api/service/realname"
	"github.com/gin-gonic/gin"
)

const realNameCallbackMaxBodyBytes = 1 << 20

type realNameSessionRequest struct {
	VerifyType string `json:"verify_type"`
	Provider   string `json:"provider"`
}

type realNameSessionResponse struct {
	Verification *model.UserRealNameVerification `json:"verification"`
	Session      realnamesvc.Session             `json:"session"`
}

type realNameCallbackRequest struct {
	ProviderRequestID string `json:"provider_request_id"`
	Status            string `json:"status"`
	VerifiedName      string `json:"verified_name"`
	CompanyName       string `json:"company_name"`
	IdNo              string `json:"id_no"`
	CreditCode        string `json:"credit_code"`
	LegalPersonName   string `json:"legal_person_name"`
	ResultCode        string `json:"result_code"`
	ResultMessage     string `json:"result_message"`
}

func GetRealNameStatus(c *gin.Context) {
	status, err := model.GetUserRealNameStatus(c.GetInt("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	providers := getAvailableRealNameProviderNames()
	data := map[string]interface{}{
		model.VerifyTypePersonal: status[model.VerifyTypePersonal],
		model.VerifyTypeCompany:  status[model.VerifyTypeCompany],
		"realname_providers":     providers,
	}
	if len(providers) > 0 {
		data["realname_provider"] = providers[0]
	}
	common.ApiSuccess(c, data)
}

func isMockRealNameProviderAllowed() bool {
	return gin.Mode() == gin.TestMode || common.DebugEnabled || common.GetEnvOrDefaultBool("REALNAME_MOCK_PROVIDER_ENABLED", false)
}

func isRealNameProviderAllowed(name string) bool {
	name = strings.ToLower(strings.TrimSpace(name))
	if name == "" {
		return false
	}
	if name == "mock" {
		return isMockRealNameProviderAllowed()
	}
	return true
}

func getAvailableRealNameProviderNames() []string {
	names := realnamesvc.ListProviderNames()
	available := make([]string, 0, len(names))
	for _, name := range names {
		if isRealNameProviderAllowed(name) {
			available = append(available, name)
		}
	}
	slices.Sort(available)
	return available
}

func resolveRealNameProvider(name string) (realnamesvc.Provider, bool) {
	name = strings.ToLower(strings.TrimSpace(name))
	if name == "" {
		return nil, false
	}
	if !isRealNameProviderAllowed(name) {
		return nil, false
	}
	return realnamesvc.GetProvider(name)
}

func resolveCreateSessionRealNameProvider(name string) (realnamesvc.Provider, bool) {
	if provider, ok := resolveRealNameProvider(name); ok {
		return provider, true
	}
	available := getAvailableRealNameProviderNames()
	if len(available) != 1 {
		return nil, false
	}
	return realnamesvc.GetProvider(available[0])
}

func CreateRealNameSession(c *gin.Context) {
	var req realNameSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	provider, ok := resolveCreateSessionRealNameProvider(req.Provider)
	if !ok {
		common.ApiError(c, realnamesvc.ErrUnsupportedProvider)
		return
	}
	session, err := provider.CreateSession(c.Request.Context(), realnamesvc.CreateSessionRequest{
		UserID:     c.GetInt("id"),
		VerifyType: req.VerifyType,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	verification, err := model.CreateRealNameVerificationSession(c.GetInt("id"), req.VerifyType, provider.ProviderName(), session.ProviderRequestID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, realNameSessionResponse{Verification: verification, Session: session})
}

func RealNameCallback(c *gin.Context) {
	provider, ok := resolveRealNameProvider(c.Param("provider"))
	if !ok {
		common.ApiError(c, realnamesvc.ErrUnsupportedProvider)
		return
	}
	bodyBytes, err := readRealNameCallbackBody(c)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req realNameCallbackRequest
	if err := common.Unmarshal(bodyBytes, &req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	signature := c.GetHeader("X-RealName-Signature")
	if signature == "" {
		signature = c.GetHeader("X-Signature")
	}
	result, err := provider.VerifyCallback(c.Request.Context(), realnamesvc.CallbackRequest{
		ProviderRequestID: req.ProviderRequestID,
		Status:            req.Status,
		VerifiedName:      req.VerifiedName,
		CompanyName:       req.CompanyName,
		IdNo:              req.IdNo,
		CreditCode:        req.CreditCode,
		LegalPersonName:   req.LegalPersonName,
		ResultCode:        req.ResultCode,
		ResultMessage:     req.ResultMessage,
		RawPayload:        string(bodyBytes),
		Signature:         signature,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.ApplyRealNameVerificationResult(model.RealNameVerificationResultInput{
		Provider:              provider.ProviderName(),
		ProviderRequestId:     result.ProviderRequestID,
		Status:                result.Status,
		VerifiedName:          result.VerifiedName,
		CompanyName:           result.CompanyName,
		IdNo:                  result.IdNo,
		CreditCode:            result.CreditCode,
		LegalPersonName:       result.LegalPersonName,
		ProviderResultCode:    result.ResultCode,
		ProviderResultMessage: result.ResultMessage,
		SafeAuditPayload:      result.SafeAuditPayload,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func readRealNameCallbackBody(c *gin.Context) ([]byte, error) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, realNameCallbackMaxBodyBytes)
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if common.IsRequestBodyTooLargeError(err) {
		return nil, common.ErrRequestBodyTooLarge
	}
	return bodyBytes, err
}
