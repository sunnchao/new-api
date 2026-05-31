package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/setting/system_setting"
)

type feishuWebhookPayload struct {
	Timestamp string                 `json:"timestamp,omitempty"`
	Sign      string                 `json:"sign,omitempty"`
	MsgType   string                 `json:"msg_type"`
	Content   map[string]interface{} `json:"content"`
}

func isFeishuWebhookURL(webhookURL string) bool {
	parsedURL, err := url.Parse(webhookURL)
	if err != nil {
		return false
	}
	host := strings.ToLower(parsedURL.Hostname())
	return (host == "open.feishu.cn" || host == "open.larksuite.com") &&
		strings.HasPrefix(parsedURL.EscapedPath(), "/open-apis/bot/v2/hook/")
}

func buildFeishuWebhookPayload(secret string, data dto.Notify) ([]byte, error) {
	content := renderWebhookNotifyContent(data)
	payload := feishuWebhookPayload{
		MsgType: "text",
		Content: map[string]interface{}{
			"text": strings.TrimSpace(data.Title + "\n" + content),
		},
	}
	if secret != "" {
		timestamp := fmt.Sprintf("%d", time.Now().Unix())
		payload.Timestamp = timestamp
		payload.Sign = generateFeishuSignature(timestamp, secret)
	}
	payloadBytes, err := common.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal feishu webhook payload: %v", err)
	}
	return payloadBytes, nil
}

func generateFeishuSignature(timestamp string, secret string) string {
	stringToSign := timestamp + "\n" + secret
	h := hmac.New(sha256.New, []byte(stringToSign))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

// SendFeishuWebhookNotify 发送飞书自定义机器人 webhook 通知
func SendFeishuWebhookNotify(webhookURL string, secret string, data dto.Notify) error {
	payloadBytes, err := buildFeishuWebhookPayload(secret, data)
	if err != nil {
		return err
	}

	var resp *http.Response
	if system_setting.EnableWorker() {
		workerReq := &WorkerRequest{
			URL:    webhookURL,
			Key:    system_setting.WorkerValidKey,
			Method: http.MethodPost,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: payloadBytes,
		}
		resp, err = DoWorkerRequest(workerReq)
		if err != nil {
			return fmt.Errorf("failed to send webhook request through worker: %v", err)
		}
		defer resp.Body.Close()
	} else {
		fetchSetting := system_setting.GetFetchSetting()
		if err := common.ValidateURLWithFetchSetting(webhookURL, fetchSetting.EnableSSRFProtection, fetchSetting.AllowPrivateIp, fetchSetting.DomainFilterMode, fetchSetting.IpFilterMode, fetchSetting.DomainList, fetchSetting.IpList, fetchSetting.AllowedPorts, fetchSetting.ApplyIPFilterForDomain); err != nil {
			return fmt.Errorf("request reject: %v", err)
		}

		req, err := http.NewRequest(http.MethodPost, webhookURL, bytes.NewBuffer(payloadBytes))
		if err != nil {
			return fmt.Errorf("failed to create webhook request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")

		client := GetHttpClient()
		resp, err = client.Do(req)
		if err != nil {
			return fmt.Errorf("failed to send webhook request: %v", err)
		}
		defer resp.Body.Close()
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook request failed with status code: %d", resp.StatusCode)
	}
	return nil
}
