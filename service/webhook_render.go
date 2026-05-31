package service

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/dto"
)

func renderWebhookNotifyContent(data dto.Notify) string {
	content := data.Content
	for _, value := range data.Values {
		content = strings.Replace(content, dto.ContentValueParam, fmt.Sprintf("%v", value), 1)
	}
	return content
}
