package controller

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type adminTokenPageResponse struct {
	Total int                      `json:"total"`
	Items []adminTokenResponseItem `json:"items"`
}

type adminTokenResponseItem struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Key      string `json:"key"`
	UserID   int    `json:"user_id"`
	UserName string `json:"user_name"`
}

func setupAdminTokenControllerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	require.NoError(t, i18n.Init())
	db := setupTokenControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.User{}))
	return db
}

func seedAdminTokenUser(t *testing.T, db *gorm.DB, userID int, username string) *model.User {
	t.Helper()

	user := &model.User{
		Id:       userID,
		Username: username,
		Password: "password123",
		AffCode:  username + "-aff",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
	}
	require.NoError(t, db.Create(user).Error)
	return user
}

func countAdminTokens(t *testing.T, db *gorm.DB) int64 {
	t.Helper()

	var count int64
	require.NoError(t, db.Model(&model.Token{}).Count(&count).Error)
	return count
}

func getPersistedAdminTokenByID(t *testing.T, id int) *model.Token {
	t.Helper()

	token, err := model.GetTokenById(id)
	require.NoError(t, err)
	return token
}

func TestNormalizeAdminTokenCreateUserID_RequiresOwner(t *testing.T) {
	_, err := normalizeAdminTokenCreateUserID(&dto.AdminTokenCreateRequest{})
	require.ErrorIs(t, err, errAdminTokenOwnerRequired)
}

func TestEnsureAdminTokenOwnerImmutable_RejectsOwnerChange(t *testing.T) {
	existing := &model.Token{UserId: 7}
	userID := 8

	err := ensureAdminTokenOwnerImmutable(existing, &dto.AdminTokenUpdateRequest{
		UserID: &userID,
	})
	require.ErrorIs(t, err, errAdminTokenOwnerImmutable)
}

func TestEnsureAdminTokenOwnerImmutable_AllowsSameOwner(t *testing.T) {
	existing := &model.Token{UserId: 7}
	userID := 7

	err := ensureAdminTokenOwnerImmutable(existing, &dto.AdminTokenUpdateRequest{
		UserID: &userID,
	})
	require.NoError(t, err)
}

func TestAdminAddToken_RejectsMissingUserID(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)

	body := map[string]any{
		"name":            "admin-token",
		"expired_time":    -1,
		"remain_quota":    100,
		"unlimited_quota": true,
		"group":           "default",
	}

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/admin/token", body, 99)
	AdminAddToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.False(t, response.Success)
	require.Equal(t, i18n.T(ctx, i18n.MsgTokenAdminOwnerRequired), response.Message)
	require.Zero(t, countAdminTokens(t, db))
}

func TestAdminAddToken_RejectsNonexistentUser(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)

	body := map[string]any{
		"user_id":         999,
		"name":            "admin-token",
		"expired_time":    -1,
		"remain_quota":    100,
		"unlimited_quota": true,
		"group":           "default",
	}

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/admin/token", body, 99)
	AdminAddToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.False(t, response.Success)
	require.Equal(t, i18n.T(ctx, i18n.MsgTokenAdminOwnerNotFound), response.Message)
	require.Zero(t, countAdminTokens(t, db))
}

func TestAdminUpdateToken_RejectsOwnerChange(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	seedAdminTokenUser(t, db, 1, "owner")
	seedAdminTokenUser(t, db, 2, "other-owner")
	token := seedToken(t, db, 1, "managed-token", "admin1234token5678")

	body := map[string]any{
		"id":                   token.Id,
		"user_id":              2,
		"name":                 token.Name,
		"expired_time":         token.ExpiredTime,
		"remain_quota":         token.RemainQuota,
		"unlimited_quota":      token.UnlimitedQuota,
		"model_limits_enabled": token.ModelLimitsEnabled,
		"model_limits":         token.ModelLimits,
		"mj_model":             token.MjModel,
		"group":                token.Group,
		"cross_group_retry":    token.CrossGroupRetry,
	}

	ctx, recorder := newAuthenticatedContext(t, http.MethodPut, "/api/admin/token", body, 99)
	AdminUpdateToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.False(t, response.Success)
	require.Equal(t, i18n.T(ctx, i18n.MsgTokenAdminOwnerImmutable), response.Message)

	persisted, err := model.GetTokenById(token.Id)
	require.NoError(t, err)
	require.Equal(t, 1, persisted.UserId)
}

func TestAdminAddToken_Success(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	owner := seedAdminTokenUser(t, db, 7, "selected-owner")
	allowIPs := "127.0.0.1\n10.0.0.1"

	body := map[string]any{
		"user_id":              owner.Id,
		"name":                 "admin-created-token",
		"expired_time":         3600,
		"remain_quota":         123,
		"unlimited_quota":      false,
		"model_limits_enabled": true,
		"model_limits":         "gpt-4o,claude-3-5-sonnet",
		"mj_model":             "fast",
		"allow_ips":            allowIPs,
		"group":                "vip",
		"cross_group_retry":    true,
		"backup_group":         "backup",
	}

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/admin/token", body, 99)
	AdminAddToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)
	require.Equal(t, int64(1), countAdminTokens(t, db))

	var item adminTokenResponseItem
	require.NoError(t, common.Unmarshal(response.Data, &item))
	require.Equal(t, owner.Id, item.UserID)
	require.Equal(t, owner.Username, item.UserName)
	require.Equal(t, body["name"], item.Name)

	var persisted model.Token
	require.NoError(t, db.Where("user_id = ?", owner.Id).First(&persisted).Error)
	require.Equal(t, owner.Id, persisted.UserId)
	require.Equal(t, body["name"], persisted.Name)
	require.Equal(t, int64(3600), persisted.ExpiredTime)
	require.Equal(t, 123, persisted.RemainQuota)
	require.False(t, persisted.UnlimitedQuota)
	require.True(t, persisted.ModelLimitsEnabled)
	require.Equal(t, "gpt-4o,claude-3-5-sonnet", persisted.ModelLimits)
	require.Equal(t, "fast", persisted.MjModel)
	require.NotNil(t, persisted.AllowIps)
	require.Equal(t, allowIPs, *persisted.AllowIps)
	require.Equal(t, "vip", persisted.Group)
	require.True(t, persisted.CrossGroupRetry)
	require.Equal(t, "backup", persisted.BackupGroup)
	require.Equal(t, common.TokenStatusEnabled, persisted.Status)
	require.NotEmpty(t, persisted.Key)

	require.Equal(t, persisted.Id, item.ID)
	require.Equal(t, persisted.GetMaskedKey(), item.Key)
	require.NotEqual(t, persisted.Key, item.Key)
	require.NotContains(t, recorder.Body.String(), persisted.Key)
}

func TestAdminUpdateToken_Success(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	owner := seedAdminTokenUser(t, db, 1, "owner")
	initialAllowIPs := "127.0.0.1"
	token := &model.Token{
		UserId:             owner.Id,
		Name:               "before-update",
		Key:                "adminbefore123456",
		Status:             common.TokenStatusEnabled,
		CreatedTime:        1,
		AccessedTime:       1,
		ExpiredTime:        -1,
		RemainQuota:        50,
		UnlimitedQuota:     false,
		ModelLimitsEnabled: false,
		ModelLimits:        "",
		MjModel:            "",
		AllowIps:           &initialAllowIPs,
		Group:              "default",
		CrossGroupRetry:    false,
		BackupGroup:        "",
	}
	require.NoError(t, db.Create(token).Error)

	updatedAllowIPs := "192.168.1.1"
	body := map[string]any{
		"id":                   token.Id,
		"name":                 "after-update",
		"expired_time":         7200,
		"remain_quota":         999,
		"unlimited_quota":      true,
		"model_limits_enabled": true,
		"model_limits":         "gpt-4o-mini",
		"mj_model":             "turbo",
		"allow_ips":            updatedAllowIPs,
		"group":                "updated-group",
		"cross_group_retry":    true,
		"backup_group":         "backup-group",
	}

	ctx, recorder := newAuthenticatedContext(t, http.MethodPut, "/api/admin/token", body, 99)
	AdminUpdateToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var item adminTokenResponseItem
	require.NoError(t, common.Unmarshal(response.Data, &item))
	require.Equal(t, token.Id, item.ID)
	require.Equal(t, owner.Id, item.UserID)
	require.Equal(t, owner.Username, item.UserName)

	persisted := getPersistedAdminTokenByID(t, token.Id)
	require.Equal(t, owner.Id, persisted.UserId)
	require.Equal(t, "after-update", persisted.Name)
	require.Equal(t, int64(7200), persisted.ExpiredTime)
	require.Equal(t, 999, persisted.RemainQuota)
	require.True(t, persisted.UnlimitedQuota)
	require.True(t, persisted.ModelLimitsEnabled)
	require.Equal(t, "gpt-4o-mini", persisted.ModelLimits)
	require.Equal(t, "turbo", persisted.MjModel)
	require.NotNil(t, persisted.AllowIps)
	require.Equal(t, updatedAllowIPs, *persisted.AllowIps)
	require.Equal(t, "updated-group", persisted.Group)
	require.True(t, persisted.CrossGroupRetry)
	require.Equal(t, "backup-group", persisted.BackupGroup)

	require.Equal(t, persisted.GetMaskedKey(), item.Key)
	require.NotEqual(t, persisted.Key, item.Key)
	require.NotContains(t, recorder.Body.String(), persisted.Key)
}

func TestAdminUpdateToken_StatusOnlySuccess(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	owner := seedAdminTokenUser(t, db, 3, "owner-status")
	allowIPs := "10.10.0.1"
	token := &model.Token{
		UserId:             owner.Id,
		Name:               "status-only-token",
		Key:                "statusonly12345678",
		Status:             common.TokenStatusEnabled,
		CreatedTime:        1,
		AccessedTime:       1,
		ExpiredTime:        8888,
		RemainQuota:        321,
		UnlimitedQuota:     false,
		ModelLimitsEnabled: true,
		ModelLimits:        "gpt-4o",
		MjModel:            "fast",
		AllowIps:           &allowIPs,
		Group:              "status-group",
		CrossGroupRetry:    true,
		BackupGroup:        "status-backup",
	}
	require.NoError(t, db.Create(token).Error)

	body := map[string]any{
		"id":     token.Id,
		"status": common.TokenStatusDisabled,
	}

	ctx, recorder := newAuthenticatedContext(t, http.MethodPut, "/api/admin/token?status_only=true", body, 99)
	AdminUpdateToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var item adminTokenResponseItem
	require.NoError(t, common.Unmarshal(response.Data, &item))
	require.Equal(t, token.Id, item.ID)
	require.Equal(t, owner.Username, item.UserName)

	persisted := getPersistedAdminTokenByID(t, token.Id)
	require.Equal(t, owner.Id, persisted.UserId)
	require.Equal(t, common.TokenStatusDisabled, persisted.Status)
	require.Equal(t, "status-only-token", persisted.Name)
	require.Equal(t, int64(8888), persisted.ExpiredTime)
	require.Equal(t, 321, persisted.RemainQuota)
	require.False(t, persisted.UnlimitedQuota)
	require.True(t, persisted.ModelLimitsEnabled)
	require.Equal(t, "gpt-4o", persisted.ModelLimits)
	require.Equal(t, "fast", persisted.MjModel)
	require.NotNil(t, persisted.AllowIps)
	require.Equal(t, allowIPs, *persisted.AllowIps)
	require.Equal(t, "status-group", persisted.Group)
	require.True(t, persisted.CrossGroupRetry)
	require.Equal(t, "status-backup", persisted.BackupGroup)

	require.Equal(t, persisted.GetMaskedKey(), item.Key)
	require.NotEqual(t, persisted.Key, item.Key)
	require.NotContains(t, recorder.Body.String(), persisted.Key)
}

func TestAdminDeleteToken_Success(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	owner := seedAdminTokenUser(t, db, 5, "owner-delete")
	token := seedToken(t, db, owner.Id, "delete-me", "deleteadmin123456")

	ctx, recorder := newAuthenticatedContext(t, http.MethodDelete, "/api/admin/token/"+strconv.Itoa(token.Id), nil, 99)
	ctx.Params = gin.Params{{Key: "id", Value: strconv.Itoa(token.Id)}}
	AdminDeleteToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)
	require.Zero(t, countAdminTokens(t, db))

	_, err := model.GetTokenById(token.Id)
	require.Error(t, err)
	require.True(t, errors.Is(err, gorm.ErrRecordNotFound))
}

func TestAdminDeleteTokenBatch_Success(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	ownerA := seedAdminTokenUser(t, db, 10, "owner-a")
	ownerB := seedAdminTokenUser(t, db, 11, "owner-b")
	tokenA := seedToken(t, db, ownerA.Id, "batch-a", "batchadminaaa1111")
	tokenB := seedToken(t, db, ownerB.Id, "batch-b", "batchadminbbb2222")
	remaining := seedToken(t, db, ownerA.Id, "remain", "batchadminccc3333")

	body := map[string]any{
		"ids": []int{tokenA.Id, tokenB.Id},
	}

	ctx, recorder := newAuthenticatedContext(t, http.MethodPost, "/api/admin/token/batch", body, 99)
	AdminDeleteTokenBatch(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var deletedCount int
	require.NoError(t, common.Unmarshal(response.Data, &deletedCount))
	require.Equal(t, 2, deletedCount)
	require.Equal(t, int64(1), countAdminTokens(t, db))

	_, err := model.GetTokenById(tokenA.Id)
	require.Error(t, err)
	require.True(t, errors.Is(err, gorm.ErrRecordNotFound))
	_, err = model.GetTokenById(tokenB.Id)
	require.Error(t, err)
	require.True(t, errors.Is(err, gorm.ErrRecordNotFound))

	persistedRemaining := getPersistedAdminTokenByID(t, remaining.Id)
	require.Equal(t, remaining.Id, persistedRemaining.Id)
	require.Equal(t, remaining.UserId, persistedRemaining.UserId)
}

func TestAdminGetAllTokens_ReturnsMaskedKeysAndUserNames(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	ownerA := seedAdminTokenUser(t, db, 1, "owner-a")
	ownerB := seedAdminTokenUser(t, db, 2, "owner-b")
	tokenA := seedToken(t, db, ownerA.Id, "token-a", "adminaaaa1111bbbb")
	tokenB := seedToken(t, db, ownerB.Id, "token-b", "admincccc2222dddd")

	ctx, recorder := newAuthenticatedContext(t, http.MethodGet, "/api/admin/token/list?p=1&size=10", nil, 99)
	AdminGetAllTokens(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var page adminTokenPageResponse
	require.NoError(t, common.Unmarshal(response.Data, &page))
	require.Equal(t, 2, page.Total)
	require.Len(t, page.Items, 2)

	itemsByID := make(map[int]adminTokenResponseItem, len(page.Items))
	for _, item := range page.Items {
		itemsByID[item.ID] = item
	}
	require.Equal(t, tokenA.GetMaskedKey(), itemsByID[tokenA.Id].Key)
	require.Equal(t, ownerA.Username, itemsByID[tokenA.Id].UserName)
	require.Equal(t, tokenA.UserId, itemsByID[tokenA.Id].UserID)
	require.Equal(t, tokenB.GetMaskedKey(), itemsByID[tokenB.Id].Key)
	require.Equal(t, ownerB.Username, itemsByID[tokenB.Id].UserName)
	require.Equal(t, tokenB.UserId, itemsByID[tokenB.Id].UserID)
	require.NotContains(t, recorder.Body.String(), tokenA.Key)
	require.NotContains(t, recorder.Body.String(), tokenB.Key)
}

func TestAdminSearchTokens_ReturnsMaskedKeysAndUserNames(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	seedAdminTokenUser(t, db, 1, "alpha-owner")
	ownerB := seedAdminTokenUser(t, db, 2, "beta-owner")
	seedToken(t, db, 1, "token-a", "adminaaaa1111bbbb")
	tokenB := seedToken(t, db, ownerB.Id, "token-b", "admincccc2222dddd")

	ctx, recorder := newAuthenticatedContext(t, http.MethodGet, "/api/admin/token/search?keyword=beta-owner&p=1&size=10", nil, 99)
	AdminSearchTokens(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var page adminTokenPageResponse
	require.NoError(t, common.Unmarshal(response.Data, &page))
	require.Equal(t, 1, page.Total)
	require.Len(t, page.Items, 1)
	require.Equal(t, tokenB.Id, page.Items[0].ID)
	require.Equal(t, tokenB.GetMaskedKey(), page.Items[0].Key)
	require.Equal(t, ownerB.Username, page.Items[0].UserName)
	require.NotContains(t, recorder.Body.String(), tokenB.Key)
}

func TestAdminGetToken_ReturnsMaskedKeyAndUserName(t *testing.T) {
	db := setupAdminTokenControllerTestDB(t)
	owner := seedAdminTokenUser(t, db, 1, "owner-a")
	token := seedToken(t, db, owner.Id, "token-a", "adminaaaa1111bbbb")

	ctx, recorder := newAuthenticatedContext(t, http.MethodGet, "/api/admin/token/"+strconv.Itoa(token.Id), nil, 99)
	ctx.Params = gin.Params{{Key: "id", Value: strconv.Itoa(token.Id)}}
	AdminGetToken(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success)

	var item adminTokenResponseItem
	require.NoError(t, common.Unmarshal(response.Data, &item))
	require.Equal(t, token.Id, item.ID)
	require.Equal(t, token.GetMaskedKey(), item.Key)
	require.Equal(t, owner.Username, item.UserName)
	require.NotContains(t, recorder.Body.String(), token.Key)
}

func TestBuildMaskedAdminTokenResponse_MasksKeyAndPreservesFields(t *testing.T) {
	rawKey := "admin1234secret5678"
	masked := buildMaskedAdminTokenResponse(&model.AdminToken{
		Token: model.Token{
			Id:   1,
			Name: "managed-token",
			Key:  rawKey,
		},
		UserName: "owner",
	})

	require.NotNil(t, masked)
	require.Equal(t, 1, masked.Id)
	require.Equal(t, "managed-token", masked.Name)
	require.Equal(t, "owner", masked.UserName)
	require.Equal(t, model.MaskTokenKey(rawKey), masked.Key)
	require.NotEqual(t, rawKey, masked.Key)

	payload, err := common.Marshal(masked)
	require.NoError(t, err)
	require.False(t, strings.Contains(string(payload), rawKey))
}
