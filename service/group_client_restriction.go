package service

import (
	"regexp"
	"strings"

	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
)

var codexUserAgentPrefixes = []string{
	"codex_cli_rs/",
	"codex_vscode/",
	"codex_app/",
	"codex_chatgpt_desktop/",
	"codex_atlas/",
	"codex_exec/",
	"codex_sdk_ts/",
	"codex ",
}

var codexOriginatorPrefixes = []string{
	"codex_",
	"codex ",
}

var claudeCodeCLIUserAgentPattern = regexp.MustCompile(`^claude-cli/\d+\.\d+\.\d+`)

func RequestMatchesClient(c *gin.Context, client string) bool {
	switch client {
	case setting.ClientClaudeCode:
		return requestMatchesClaudeCode(c)
	case setting.ClientCodex:
		return requestMatchesCodex(c)
	default:
		return false
	}
}

func IsRequestAllowedForGroup(c *gin.Context, group string) bool {
	allowedClients := setting.GetGroupAllowedClients(group)
	if len(allowedClients) == 0 {
		return true
	}
	for _, client := range allowedClients {
		if RequestMatchesClient(c, client) {
			return true
		}
	}
	return false
}

func FilterGroupsByClientRestriction(c *gin.Context, groups []string) []string {
	if len(groups) == 0 {
		return groups
	}

	filtered := make([]string, 0, len(groups))
	for _, group := range groups {
		if IsRequestAllowedForGroup(c, group) {
			filtered = append(filtered, group)
		}
	}
	return filtered
}

func requestMatchesCodex(c *gin.Context) bool {
	userAgent := normalizedHeader(c, "User-Agent")
	if hasAnyPrefix(userAgent, codexUserAgentPrefixes) {
		return true
	}

	originator := normalizedHeader(c, "OpenAI-Originator")
	return originator == "codex" || hasAnyPrefix(originator, codexOriginatorPrefixes)
}

func requestMatchesClaudeCode(c *gin.Context) bool {
	userAgent := normalizedHeader(c, "User-Agent")
	if claudeCodeCLIUserAgentPattern.MatchString(userAgent) {
		return true
	}

	// Claude Code's Codex plugin identifies itself with both headers.
	originator := strings.TrimSpace(c.GetHeader("OpenAI-Originator"))
	return strings.EqualFold(originator, "Claude Code") && strings.Contains(userAgent, "claude code/")
}

func normalizedHeader(c *gin.Context, name string) string {
	return strings.ToLower(strings.TrimSpace(c.GetHeader(name)))
}

func hasAnyPrefix(value string, prefixes []string) bool {
	for _, prefix := range prefixes {
		if strings.HasPrefix(value, prefix) {
			return true
		}
	}
	return false
}
