package router

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

func TestProxyNextFrontendWhenSelectedProxiesWebRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previousTheme := common.GetTheme()
	common.SetTheme("next")
	t.Cleanup(func() {
		common.SetTheme(previousTheme)
	})

	nextServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/dashboard" {
			t.Fatalf("expected proxied path /dashboard, got %q", r.URL.Path)
		}
		if r.URL.RawQuery != "section=overview" {
			t.Fatalf("expected query to be preserved, got %q", r.URL.RawQuery)
		}
		w.Header().Set("X-Next-Frontend", "hit")
		_, _ = w.Write([]byte("next dashboard"))
	}))
	t.Cleanup(nextServer.Close)
	t.Setenv("NEXT_FRONTEND_BASE_URL", nextServer.URL)
	t.Setenv("FRONTEND_NEXT_BASE_URL", "")

	router := gin.New()
	router.Use(proxyNextFrontendWhenSelected())
	router.GET("/dashboard", func(c *gin.Context) {
		c.String(http.StatusTeapot, "embedded fallback")
	})

	goServer := httptest.NewServer(router)
	t.Cleanup(goServer.Close)

	resp, err := http.Get(goServer.URL + "/dashboard?section=overview")
	if err != nil {
		t.Fatalf("failed to request Go web router: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected proxied 200 response, got %d", resp.StatusCode)
	}
	if resp.Header.Get("X-Next-Frontend") != "hit" {
		t.Fatalf("expected response from Next frontend proxy")
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read proxied response body: %v", err)
	}
	if string(body) != "next dashboard" {
		t.Fatalf("expected proxied body, got %q", string(body))
	}
}

func TestProxyNextFrontendWhenSelectedLeavesBackendRoutesOnGoRouter(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previousTheme := common.GetTheme()
	common.SetTheme("next")
	t.Cleanup(func() {
		common.SetTheme(previousTheme)
	})
	t.Setenv("NEXT_FRONTEND_BASE_URL", "http://127.0.0.1:1")
	t.Setenv("FRONTEND_NEXT_BASE_URL", "")

	router := gin.New()
	router.Use(proxyNextFrontendWhenSelected())
	router.GET("/api/status", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/status", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected backend route to bypass Next proxy, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if recorder.Body.String() != `{"success":true}` {
		t.Fatalf("expected backend handler response, got %q", recorder.Body.String())
	}
}

func TestProxyNextFrontendWhenSelectedFailsVisiblyWithoutBaseURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previousTheme := common.GetTheme()
	common.SetTheme("next")
	t.Cleanup(func() {
		common.SetTheme(previousTheme)
	})
	t.Setenv("NEXT_FRONTEND_BASE_URL", "")
	t.Setenv("FRONTEND_NEXT_BASE_URL", "")

	router := gin.New()
	router.Use(proxyNextFrontendWhenSelected())
	router.GET("/wallet", func(c *gin.Context) {
		c.String(http.StatusOK, "embedded fallback")
	})

	req := httptest.NewRequest(http.MethodGet, "/wallet", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when next theme lacks base URL, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if recorder.Body.String() == "embedded fallback" {
		t.Fatalf("expected missing Next base URL to abort before embedded fallback")
	}
}
