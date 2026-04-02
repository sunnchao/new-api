package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var (
	errAdminTokenOwnerRequired  = errors.New("admin token owner is required")
	errAdminTokenOwnerNotFound  = errors.New("admin token owner not found")
	errAdminTokenOwnerImmutable = errors.New("admin token owner is immutable")
)

type adminTokenEditableFields struct {
	Name               string
	ExpiredTime        int64
	RemainQuota        int
	UnlimitedQuota     bool
	ModelLimitsEnabled bool
	ModelLimits        string
	MjModel            string
	AllowIps           *string
	Group              string
	CrossGroupRetry    bool
	BackupGroup        string
}

// 这些辅助函数用于隔离管理员创建/更新令牌时的 owner 规则，避免与用户自助令牌逻辑混在一起。
func normalizeAdminTokenCreateUserID(req *dto.AdminTokenCreateRequest) (int, error) {
	if req == nil || req.UserID == nil || *req.UserID <= 0 {
		return 0, errAdminTokenOwnerRequired
	}
	return *req.UserID, nil
}

func ensureAdminTokenOwnerImmutable(existing *model.Token, req *dto.AdminTokenUpdateRequest) error {
	if req == nil || req.UserID == nil {
		return nil
	}
	if existing == nil || *req.UserID != existing.UserId {
		return errAdminTokenOwnerImmutable
	}
	return nil
}

func adminTokenEditableFieldsFromCreate(req *dto.AdminTokenCreateRequest) adminTokenEditableFields {
	return adminTokenEditableFields{
		Name:               req.Name,
		ExpiredTime:        req.ExpiredTime,
		RemainQuota:        req.RemainQuota,
		UnlimitedQuota:     req.UnlimitedQuota,
		ModelLimitsEnabled: req.ModelLimitsEnabled,
		ModelLimits:        req.ModelLimits,
		MjModel:            req.MjModel,
		AllowIps:           req.AllowIps,
		Group:              req.Group,
		CrossGroupRetry:    req.CrossGroupRetry,
		BackupGroup:        req.BackupGroup,
	}
}

func adminTokenEditableFieldsFromUpdate(req *dto.AdminTokenUpdateRequest) adminTokenEditableFields {
	return adminTokenEditableFields{
		Name:               req.Name,
		ExpiredTime:        req.ExpiredTime,
		RemainQuota:        req.RemainQuota,
		UnlimitedQuota:     req.UnlimitedQuota,
		ModelLimitsEnabled: req.ModelLimitsEnabled,
		ModelLimits:        req.ModelLimits,
		MjModel:            req.MjModel,
		AllowIps:           req.AllowIps,
		Group:              req.Group,
		CrossGroupRetry:    req.CrossGroupRetry,
		BackupGroup:        req.BackupGroup,
	}
}

// 管理员令牌接口不能复用用户自助 token handler：这里需要跨用户查询、校验 owner 规则，并补充 user_name。

func ensureAdminTokenOwnerExists(userID int) (*model.User, error) {
	user, err := model.GetUserById(userID, false)
	if err == nil {
		return user, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errAdminTokenOwnerNotFound
	}
	return nil, err
}

func validateAdminTokenCommonFields(c *gin.Context, name string, unlimitedQuota bool, remainQuota int) bool {
	if len(name) > 50 {
		common.ApiErrorI18n(c, i18n.MsgTokenNameTooLong)
		return false
	}
	if !unlimitedQuota {
		if remainQuota < 0 {
			common.ApiErrorI18n(c, i18n.MsgTokenQuotaNegative)
			return false
		}
		maxQuotaValue := int((1000000000 * common.QuotaPerUnit))
		if remainQuota > maxQuotaValue {
			common.ApiErrorI18n(c, i18n.MsgTokenQuotaExceedMax, map[string]any{"Max": maxQuotaValue})
			return false
		}
	}
	return true
}

func normalizeAdminTokenEditableFields(c *gin.Context, fields adminTokenEditableFields) (adminTokenEditableFields, bool) {
	if !validateAdminTokenCommonFields(c, fields.Name, fields.UnlimitedQuota, fields.RemainQuota) {
		return adminTokenEditableFields{}, false
	}
	var ok bool
	fields.MjModel, ok = normalizeAdminTokenMjModel(c, fields.MjModel)
	if !ok {
		return adminTokenEditableFields{}, false
	}
	return fields, true
}

func applyAdminTokenEditableFields(token *model.Token, fields adminTokenEditableFields) {
	token.Name = fields.Name
	token.ExpiredTime = fields.ExpiredTime
	token.RemainQuota = fields.RemainQuota
	token.UnlimitedQuota = fields.UnlimitedQuota
	token.ModelLimitsEnabled = fields.ModelLimitsEnabled
	token.ModelLimits = fields.ModelLimits
	token.MjModel = fields.MjModel
	token.AllowIps = fields.AllowIps
	token.Group = fields.Group
	token.CrossGroupRetry = fields.CrossGroupRetry
	token.BackupGroup = fields.BackupGroup
}

func writeAdminTokenRuleError(c *gin.Context, err error) bool {
	switch {
	case errors.Is(err, errAdminTokenOwnerRequired):
		common.ApiErrorI18n(c, i18n.MsgTokenAdminOwnerRequired)
	case errors.Is(err, errAdminTokenOwnerNotFound):
		common.ApiErrorI18n(c, i18n.MsgTokenAdminOwnerNotFound)
	case errors.Is(err, errAdminTokenOwnerImmutable):
		common.ApiErrorI18n(c, i18n.MsgTokenAdminOwnerImmutable)
	default:
		return false
	}
	return true
}

func normalizeAdminTokenMjModel(c *gin.Context, mjModel string) (string, bool) {
	normalized, ok := common.NormalizeMjModel(mjModel)
	if !ok {
		writeInvalidTokenMjModelError(c)
		return "", false
	}
	return normalized, true
}

func enforceAdminTokenCreateLimit(c *gin.Context, userID int) bool {
	maxTokens := operation_setting.GetMaxUserTokens()
	count, err := model.CountUserTokens(userID)
	if err != nil {
		common.ApiError(c, err)
		return false
	}
	if int(count) >= maxTokens {
		writeTokenLimitReachedError(c, maxTokens)
		return false
	}
	return true
}

func buildMaskedAdminTokenResponse(token *model.AdminToken) *model.AdminToken {
	if token == nil {
		return nil
	}
	maskedToken := *token
	maskedToken.Key = token.GetMaskedKey()
	return &maskedToken
}

func buildMaskedAdminTokenResponses(tokens []*model.AdminToken) []*model.AdminToken {
	maskedTokens := make([]*model.AdminToken, 0, len(tokens))
	for _, token := range tokens {
		maskedTokens = append(maskedTokens, buildMaskedAdminTokenResponse(token))
	}
	return maskedTokens
}

func AdminGetAllTokens(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	tokens, total, err := model.GetAllAdminTokens(pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(buildMaskedAdminTokenResponses(tokens))
	common.ApiSuccess(c, pageInfo)
}

func AdminSearchTokens(c *gin.Context) {
	keyword := c.Query("keyword")
	tokenKey := c.Query("token")
	pageInfo := common.GetPageQuery(c)

	tokens, total, err := model.SearchAdminTokens(keyword, tokenKey, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(buildMaskedAdminTokenResponses(tokens))
	common.ApiSuccess(c, pageInfo)
}

func AdminGetToken(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}

	token, err := model.GetAdminTokenById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, buildMaskedAdminTokenResponse(token))
}

func AdminAddToken(c *gin.Context) {
	req := dto.AdminTokenCreateRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	editableFields, ok := normalizeAdminTokenEditableFields(c, adminTokenEditableFieldsFromCreate(&req))
	if !ok {
		return
	}

	ownerUserID, err := normalizeAdminTokenCreateUserID(&req)
	if err != nil {
		if !writeAdminTokenRuleError(c, err) {
			common.ApiError(c, err)
		}
		return
	}
	owner, err := ensureAdminTokenOwnerExists(ownerUserID)
	if err != nil {
		if !writeAdminTokenRuleError(c, err) {
			common.ApiError(c, err)
		}
		return
	}
	if !enforceAdminTokenCreateLimit(c, owner.Id) {
		return
	}

	key, err := common.GenerateKey()
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgTokenGenerateFailed)
		common.SysLog("failed to generate token key: " + err.Error())
		return
	}

	cleanToken := model.Token{
		UserId:       owner.Id,
		Key:          key,
		Status:       common.TokenStatusEnabled,
		CreatedTime:  common.GetTimestamp(),
		AccessedTime: common.GetTimestamp(),
	}
	applyAdminTokenEditableFields(&cleanToken, editableFields)
	if err = cleanToken.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, buildMaskedAdminTokenResponse(&model.AdminToken{
		Token:    cleanToken,
		UserName: owner.Username,
	}))
}

func AdminUpdateToken(c *gin.Context) {
	statusOnly := c.Query("status_only")
	req := dto.AdminTokenUpdateRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	editableFields, ok := normalizeAdminTokenEditableFields(c, adminTokenEditableFieldsFromUpdate(&req))
	if !ok {
		return
	}

	cleanToken, err := model.GetTokenById(req.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err = ensureAdminTokenOwnerImmutable(cleanToken, &req); err != nil {
		if !writeAdminTokenRuleError(c, err) {
			common.ApiError(c, err)
		}
		return
	}
	if req.Status == common.TokenStatusEnabled {
		if cleanToken.Status == common.TokenStatusExpired && cleanToken.ExpiredTime <= common.GetTimestamp() && cleanToken.ExpiredTime != -1 {
			common.ApiErrorI18n(c, i18n.MsgTokenExpiredCannotEnable)
			return
		}
		if cleanToken.Status == common.TokenStatusExhausted && cleanToken.RemainQuota <= 0 && !cleanToken.UnlimitedQuota {
			common.ApiErrorI18n(c, i18n.MsgTokenExhaustedCannotEable)
			return
		}
	}

	if statusOnly != "" {
		cleanToken.Status = req.Status
	} else {
		applyAdminTokenEditableFields(cleanToken, editableFields)
	}

	if err = cleanToken.Update(); err != nil {
		common.ApiError(c, err)
		return
	}

	adminToken, err := model.GetAdminTokenById(cleanToken.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, buildMaskedAdminTokenResponse(adminToken))
}

func AdminDeleteToken(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err = model.DeleteAdminTokenById(id); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

func AdminDeleteTokenBatch(c *gin.Context) {
	tokenBatch := TokenBatch{}
	if err := c.ShouldBindJSON(&tokenBatch); err != nil || len(tokenBatch.Ids) == 0 {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}

	count, err := model.BatchDeleteAdminTokens(tokenBatch.Ids)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, count)
}
