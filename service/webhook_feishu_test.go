package service

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/stretchr/testify/require"
)

func TestBuildFeishuWebhookPayloadUsesTextMessageForFeishuBot(t *testing.T) {
	payload, err := buildFeishuWebhookPayload("", dto.NewNotify(
		dto.NotifyTypeChannelTest,
		"Webhook 测试",
		"这是一条来自 #{{value}} 的测试通知",
		[]interface{}{"new-api"},
	))

	require.NoError(t, err)

	var body map[string]interface{}
	require.NoError(t, common.Unmarshal(payload, &body))
	require.Equal(t, "text", body["msg_type"])

	content, ok := body["content"].(map[string]interface{})
	require.True(t, ok)
	require.Equal(t, "Webhook 测试\n这是一条来自 #new-api 的测试通知", content["text"])
	require.NotContains(t, body, "type")
}

func TestBuildFeishuWebhookPayloadAddsSignatureWhenSecretSet(t *testing.T) {
	payload, err := buildFeishuWebhookPayload("feishu-secret", dto.NewNotify(
		dto.NotifyTypeChannelTest,
		"Webhook 测试",
		"签名测试",
		nil,
	))

	require.NoError(t, err)

	var body map[string]interface{}
	require.NoError(t, common.Unmarshal(payload, &body))
	require.Equal(t, "text", body["msg_type"])
	require.NotEmpty(t, body["timestamp"])
	require.NotEmpty(t, body["sign"])
	require.NotContains(t, body, "X-Webhook-Signature")
}

func TestIsFeishuWebhookURL(t *testing.T) {
	cases := []struct {
		name string
		raw  string
		want bool
	}{
		{name: "feishu open api", raw: "https://open.feishu.cn/open-apis/bot/v2/hook/token", want: true},
		{name: "larksuite open api", raw: "https://open.larksuite.com/open-apis/bot/v2/hook/token", want: true},
		{name: "other webhook", raw: "https://example.com/open-apis/bot/v2/hook/token", want: false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.want, isFeishuWebhookURL(tc.raw))
		})
	}
}
