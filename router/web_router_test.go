package router

import (
	"bytes"
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

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

func TestThemeNextServingSmokeProxiesStandaloneNext(t *testing.T) {
	if os.Getenv("THEME_NEXT_SERVING_SMOKE") != "1" {
		t.Skip("set THEME_NEXT_SERVING_SMOKE=1 to run the Next standalone proxy smoke")
	}

	gin.SetMode(gin.TestMode)

	repoRoot := findRepoRoot(t)
	const nextStandaloneServerRelativePath = "web/next/.next/standalone/next/server.js"
	standaloneServer := filepath.Join(
		repoRoot,
		filepath.FromSlash(nextStandaloneServerRelativePath),
	)
	if _, err := os.Stat(standaloneServer); err != nil {
		t.Fatalf("Next standalone server is missing at %s; run `cd web/next && bun run build` first", standaloneServer)
	}

	nodePath, err := exec.LookPath("node")
	if err != nil {
		t.Fatalf("node is required to run the Next standalone smoke: %v", err)
	}

	nextPort := freeLocalPort(t)
	nextBaseURL := "http://127.0.0.1:" + strconv.Itoa(nextPort)
	nextProcessOutput, stopNext := startNextStandalone(t, repoRoot, nodePath, nextPort)
	t.Cleanup(stopNext)
	waitForNextStandalone(t, nextBaseURL, nextProcessOutput)

	previousTheme := common.GetTheme()
	common.SetTheme("next")
	t.Cleanup(func() {
		common.SetTheme(previousTheme)
	})
	t.Setenv("NEXT_FRONTEND_BASE_URL", nextBaseURL)
	t.Setenv("FRONTEND_NEXT_BASE_URL", "")

	router := gin.New()
	router.Use(proxyNextFrontendWhenSelected())
	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusTeapot, "embedded fallback")
	})

	goServer := httptest.NewServer(router)
	t.Cleanup(goServer.Close)

	resp, err := http.Get(goServer.URL + "/?theme-next-serving-smoke=1")
	if err != nil {
		t.Fatalf("failed to request Go web router: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read proxied response body: %v", err)
	}
	bodyText := string(body)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected Go proxy to return Next standalone 200, got %d body=%s", resp.StatusCode, bodyText)
	}
	if !strings.Contains(resp.Header.Get("Content-Type"), "text/html") {
		t.Fatalf("expected proxied Next HTML content type, got %q", resp.Header.Get("Content-Type"))
	}
	if strings.Contains(bodyText, "embedded fallback") {
		t.Fatalf("expected request to abort after Next proxy, got embedded fallback body")
	}
	if !strings.Contains(bodyText, "/_next/") && !strings.Contains(bodyText, "self.__next") {
		t.Fatalf("expected proxied body to look like a Next standalone page, got %q", truncateSmokeOutput(bodyText))
	}
}

type lockedBuffer struct {
	mu     sync.Mutex
	buffer bytes.Buffer
}

func (b *lockedBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buffer.Write(p)
}

func (b *lockedBuffer) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buffer.String()
}

func findRepoRoot(t *testing.T) string {
	t.Helper()

	dir, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working directory: %v", err)
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			t.Fatalf("failed to locate repo root from %s", dir)
		}
		dir = parent
	}
}

func freeLocalPort(t *testing.T) int {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to allocate local port: %v", err)
	}
	defer listener.Close()

	addr, ok := listener.Addr().(*net.TCPAddr)
	if !ok {
		t.Fatalf("expected TCP listener address, got %T", listener.Addr())
	}
	return addr.Port
}

func startNextStandalone(t *testing.T, repoRoot string, nodePath string, port int) (*lockedBuffer, func()) {
	t.Helper()

	output := &lockedBuffer{}
	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(
		ctx,
		nodePath,
		"scripts/start-standalone.mjs",
		"--hostname",
		"127.0.0.1",
		"--port",
		strconv.Itoa(port),
	)
	cmd.Dir = filepath.Join(repoRoot, "web", "next")
	cmd.Env = append(
		os.Environ(),
		"NODE_ENV=production",
		"NEXT_PUBLIC_API_BASE=http://127.0.0.1:9",
	)
	cmd.Stdout = output
	cmd.Stderr = output

	if err := cmd.Start(); err != nil {
		cancel()
		t.Fatalf("failed to start Next standalone server: %v", err)
	}

	var waitErr error
	var waitErrMu sync.Mutex
	exited := make(chan struct{})
	go func() {
		err := cmd.Wait()
		waitErrMu.Lock()
		waitErr = err
		waitErrMu.Unlock()
		close(exited)
	}()

	stop := func() {
		if cmd.Process != nil {
			_ = cmd.Process.Signal(os.Interrupt)
		}

		select {
		case <-exited:
		case <-time.After(5 * time.Second):
			cancel()
			if cmd.Process != nil {
				_ = cmd.Process.Kill()
			}
			<-exited
		}
	}

	t.Cleanup(func() {
		select {
		case <-exited:
			waitErrMu.Lock()
			err := waitErr
			waitErrMu.Unlock()
			if err != nil &&
				!strings.Contains(err.Error(), "signal: interrupt") &&
				!strings.Contains(err.Error(), "exit status 130") {
				t.Logf("Next standalone exited before cleanup: %v\n%s", err, truncateSmokeOutput(output.String()))
			}
		default:
		}
	})

	return output, stop
}

func waitForNextStandalone(t *testing.T, baseURL string, output *lockedBuffer) {
	t.Helper()

	client := http.Client{Timeout: 2 * time.Second}
	deadline := time.Now().Add(90 * time.Second)

	for time.Now().Before(deadline) {
		resp, err := client.Get(baseURL + "/")
		if err == nil {
			_, _ = io.Copy(io.Discard, resp.Body)
			_ = resp.Body.Close()
			if resp.StatusCode < http.StatusInternalServerError {
				return
			}
		}
		time.Sleep(500 * time.Millisecond)
	}

	t.Fatalf("timed out waiting for Next standalone server at %s\n%s", baseURL, truncateSmokeOutput(output.String()))
}

func truncateSmokeOutput(text string) string {
	const limit = 8000
	if len(text) <= limit {
		return text
	}
	return text[len(text)-limit:]
}
