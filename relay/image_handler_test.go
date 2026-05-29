package relay

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func setupImageHelperBillingTestDB(t *testing.T) {
	t.Helper()

	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false
	common.BatchUpdateEnabled = false
	common.LogConsumeEnabled = true
	constant.StreamingTimeout = 30
	service.InitHttpClient()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	model.DB = db
	model.LOG_DB = db

	require.NoError(t, db.AutoMigrate(&model.User{}, &model.Token{}, &model.Log{}, &model.Channel{}))
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
}

func TestImageHelperStreamingBillsOnceAfterFinalUsage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupImageHelperBillingTestDB(t)

	require.NoError(t, model.DB.Create(&model.User{Id: 7001, Username: "image_stream_user", Quota: 100000, Group: "default", Status: common.UserStatusEnabled}).Error)
	require.NoError(t, model.DB.Create(&model.Token{Id: 7101, UserId: 7001, Key: "image-stream-token", RemainQuota: 100000, Status: common.TokenStatusEnabled, Name: "image stream token"}).Error)
	require.NoError(t, model.DB.Create(&model.Channel{Id: 7201, Type: constant.ChannelTypeOpenAI, Name: "openai", Key: "test-key", Status: common.ChannelStatusEnabled, BaseURL: common.GetPointer("https://api.openai.test")}).Error)

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/v1/images/generations", r.URL.Path)
		w.Header().Set("Content-Type", "text/event-stream")
		_, _ = w.Write([]byte(strings.Join([]string{
			`data: {"type":"image_generation.partial_image","partial_image_index":0,"b64_json":"partial-0"}`,
			`data: {"type":"image_generation.partial_image","partial_image_index":1,"b64_json":"partial-1"}`,
			`data: {"type":"image_generation.completed","b64_json":"final","usage":{"input_tokens":12,"output_tokens":7,"total_tokens":19,"input_tokens_details":{"text_tokens":5,"image_tokens":7}}}`,
			`data: [DONE]`,
			``,
		}, "\n")))
	}))
	t.Cleanup(upstream.Close)

	body := `{"model":"gpt-image-1","prompt":"draw a city","n":3,"stream":true,"partial_images":2}`
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set(string(constant.ContextKeyChannelType), constant.ChannelTypeOpenAI)
	c.Set(string(constant.ContextKeyChannelId), 7201)
	c.Set(string(constant.ContextKeyChannelBaseUrl), upstream.URL)
	c.Set(string(constant.ContextKeyChannelKey), "test-key")
	c.Set(string(constant.ContextKeyOriginalModel), "gpt-image-1")
	c.Set(string(constant.ContextKeyUserId), 7001)
	c.Set(string(constant.ContextKeyTokenId), 7101)
	c.Set(string(constant.ContextKeyTokenKey), "image-stream-token")
	c.Set("token_name", "image stream token")

	req := &dto.ImageRequest{
		Model:  "gpt-image-1",
		Prompt: "draw a city",
		N:      common.GetPointer(uint(3)),
		Stream: common.GetPointer(true),
	}
	info := &relaycommon.RelayInfo{
		Request:         req,
		IsStream:        true,
		RelayMode:       relayconstant.RelayModeImagesGenerations,
		RelayFormat:     types.RelayFormatOpenAIImage,
		RequestURLPath:  "/v1/images/generations",
		OriginModelName: "gpt-image-1",
		UserId:          7001,
		TokenId:         7101,
		TokenKey:        "image-stream-token",
		StartTime:       time.Now(),
		PriceData: types.PriceData{
			ModelRatio:      1,
			CompletionRatio: 1,
			ImageRatio:      1,
			GroupRatioInfo:  types.GroupRatioInfo{GroupRatio: 1},
		},
	}

	err := ImageHelper(c, info)
	require.Nil(t, err)

	var user model.User
	require.NoError(t, model.DB.First(&user, 7001).Error)
	require.Equal(t, 99981, user.Quota)

	var token model.Token
	require.NoError(t, model.DB.First(&token, 7101).Error)
	require.Equal(t, 99981, token.RemainQuota)
	require.Equal(t, 19, token.UsedQuota)

	var logs []model.Log
	require.NoError(t, model.DB.Find(&logs).Error)
	require.Len(t, logs, 1)
	require.Equal(t, 19, logs[0].Quota)
	require.Contains(t, logs[0].Content, "生成数量 3")

	responseBody, errRead := io.ReadAll(recorder.Result().Body)
	require.NoError(t, errRead)
	require.Contains(t, string(responseBody), "image_generation.partial_image")
	require.Contains(t, string(responseBody), "image_generation.completed")
	require.Contains(t, string(responseBody), "[DONE]")
}

func TestImageRequestStreamTrueSetsRelayInfoStream(t *testing.T) {
	gin.SetMode(gin.TestMode)

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", strings.NewReader(`{"model":"gpt-image-1","prompt":"draw","stream":true}`))
	c.Request.Header.Set("Content-Type", "application/json")

	request, err := helper.GetAndValidateRequest(c, types.RelayFormatOpenAIImage)
	require.NoError(t, err)

	info, err := relaycommon.GenRelayInfo(c, types.RelayFormatOpenAIImage, request, nil)
	require.NoError(t, err)
	require.True(t, info.IsStream)
}
