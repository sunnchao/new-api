package oauth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

func newRedirectTestContext(target string) *gin.Context {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, target, nil)
	return ctx
}

func TestNormalizeRedirectURIForRequestRequiresSameOriginOAuthCallback(t *testing.T) {
	ctx := newRedirectTestContext("https://api-eo.wochirou.com/api/oauth/state")

	redirectURI, ok := NormalizeRedirectURIForRequest(ctx, "https://api-eo.wochirou.com/oauth/google")
	if !ok {
		t.Fatalf("expected same-origin OAuth callback redirect_uri to be accepted")
	}
	if redirectURI != "https://api-eo.wochirou.com/oauth/google" {
		t.Fatalf("unexpected normalized redirect_uri: %s", redirectURI)
	}

	if _, ok := NormalizeRedirectURIForRequest(ctx, "https://evil.example/oauth/google"); ok {
		t.Fatalf("expected cross-origin redirect_uri to be rejected")
	}

	if _, ok := NormalizeRedirectURIForRequest(ctx, "https://api-eo.wochirou.com/not-oauth/google"); ok {
		t.Fatalf("expected non-OAuth callback path to be rejected")
	}
}

func TestRedirectURIForProviderUsesSessionRedirectWhenProviderMatches(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(sessions.Sessions("session", cookie.NewStore([]byte("secret"))))
	router.GET("/api/oauth/google", func(ctx *gin.Context) {
		session := sessions.Default(ctx)
		session.Set(RedirectURISessionKey, "https://api-eo.wochirou.com/oauth/google")

		redirectURI := RedirectURIForProvider(ctx, "google")
		if redirectURI != "https://api-eo.wochirou.com/oauth/google" {
			t.Fatalf("unexpected redirect_uri: %s", redirectURI)
		}
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "https://api-eo.wochirou.com/api/oauth/google", nil)
	router.ServeHTTP(recorder, request)
}

func TestRedirectURIForProviderFallsBackWhenSessionRedirectProviderDiffers(t *testing.T) {
	originalServerAddress := system_setting.ServerAddress
	system_setting.ServerAddress = "https://wochirou.com"
	t.Cleanup(func() { system_setting.ServerAddress = originalServerAddress })

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(sessions.Sessions("session", cookie.NewStore([]byte("secret"))))
	router.GET("/api/oauth/google", func(ctx *gin.Context) {
		session := sessions.Default(ctx)
		session.Set(RedirectURISessionKey, "https://api-eo.wochirou.com/oauth/discord")

		redirectURI := RedirectURIForProvider(ctx, "google")
		if redirectURI != "https://wochirou.com/oauth/google" {
			t.Fatalf("unexpected fallback redirect_uri: %s", redirectURI)
		}
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "https://api-eo.wochirou.com/api/oauth/google", nil)
	router.ServeHTTP(recorder, request)
}

func TestRedirectURIForProviderFallsBackWithoutSessionMiddleware(t *testing.T) {
	originalServerAddress := system_setting.ServerAddress
	system_setting.ServerAddress = "https://wochirou.com"
	t.Cleanup(func() { system_setting.ServerAddress = originalServerAddress })

	ctx := newRedirectTestContext("https://api-eo.wochirou.com/api/oauth/google")
	redirectURI := RedirectURIForProvider(ctx, "google")
	if redirectURI != "https://wochirou.com/oauth/google" {
		t.Fatalf("unexpected fallback redirect_uri: %s", redirectURI)
	}
}
