package oauth

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

const RedirectURISessionKey = "oauth_redirect_uri"

func fallbackRedirectURI(provider string) string {
	return fmt.Sprintf("%s/oauth/%s", strings.TrimRight(system_setting.ServerAddress, "/"), provider)
}

func firstForwardedValue(value string) string {
	parts := strings.Split(value, ",")
	return strings.TrimSpace(parts[0])
}

func requestOrigin(c *gin.Context) string {
	if c == nil || c.Request == nil {
		return ""
	}

	scheme := c.Request.URL.Scheme
	if scheme == "" {
		scheme = firstForwardedValue(c.GetHeader("X-Forwarded-Proto"))
	}
	if scheme == "" && c.Request.TLS != nil {
		scheme = "https"
	}
	if scheme == "" {
		scheme = "http"
	}

	host := c.Request.Host
	if host == "" {
		host = firstForwardedValue(c.GetHeader("X-Forwarded-Host"))
	}
	if host == "" {
		return ""
	}

	return scheme + "://" + host
}

// NormalizeRedirectURIForRequest accepts only same-origin /oauth/{provider}
// callbacks so the token exchange cannot be redirected to an arbitrary host.
func NormalizeRedirectURIForRequest(c *gin.Context, rawRedirectURI string) (string, bool) {
	redirectURI := strings.TrimSpace(rawRedirectURI)
	if redirectURI == "" {
		return "", false
	}

	parsed, err := url.Parse(redirectURI)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", false
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", false
	}

	requestOrigin := requestOrigin(c)
	if requestOrigin == "" || parsed.Scheme+"://"+parsed.Host != requestOrigin {
		return "", false
	}

	pathParts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(pathParts) != 2 || pathParts[0] != "oauth" || pathParts[1] == "" {
		return "", false
	}

	parsed.RawQuery = ""
	parsed.Fragment = ""
	return parsed.String(), true
}

func redirectURIProvider(redirectURI string) string {
	parsed, err := url.Parse(redirectURI)
	if err != nil {
		return ""
	}

	pathParts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(pathParts) != 2 || pathParts[0] != "oauth" {
		return ""
	}
	return pathParts[1]
}

func sessionRedirectURI(c *gin.Context) (redirectURI string) {
	defer func() {
		if recover() != nil {
			redirectURI = ""
		}
	}()
	redirectURI, _ = sessions.Default(c).Get(RedirectURISessionKey).(string)
	return redirectURI
}

// RedirectURIForProvider returns the redirect URI bound to the OAuth state.
// It falls back to ServerAddress for older flows that do not store one.
func RedirectURIForProvider(c *gin.Context, provider string) string {
	if c != nil {
		if redirectURI := sessionRedirectURI(c); redirectURI != "" {
			if redirectURIProvider(redirectURI) == provider {
				return redirectURI
			}
		}
	}

	return fallbackRedirectURI(provider)
}
