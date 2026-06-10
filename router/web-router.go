package router

import (
	"embed"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// ThemeAssets holds the embedded frontend assets for both themes.
type ThemeAssets struct {
	DefaultBuildFS   embed.FS
	DefaultIndexPage []byte
	ClassicBuildFS   embed.FS
	ClassicIndexPage []byte
}

func SetWebRouter(router *gin.Engine, assets ThemeAssets) {
	defaultFS := common.EmbedFolder(assets.DefaultBuildFS, "web/default/dist")
	classicFS := common.EmbedFolder(assets.ClassicBuildFS, "web/classic/dist")
	themeFS := common.NewThemeAwareFS(defaultFS, classicFS)

	router.Use(middleware.GlobalWebRateLimit())
	router.Use(proxyNextFrontendWhenSelected())
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.Cache())
	router.Static("/uploads/tickets", "./uploads/tickets")
	router.Use(static.Serve("/", themeFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		if common.GetTheme() == "classic" {
			c.Data(http.StatusOK, "text/html; charset=utf-8", assets.ClassicIndexPage)
		} else {
			c.Data(http.StatusOK, "text/html; charset=utf-8", assets.DefaultIndexPage)
		}
	})
}

func proxyNextFrontendWhenSelected() gin.HandlerFunc {
	return func(c *gin.Context) {
		if common.GetTheme() != "next" || isBackendWebRoute(c.Request.URL.Path) {
			c.Next()
			return
		}

		targetBaseURL := common.GetNextFrontendBaseURL()
		if targetBaseURL == "" {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"message": "NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL is required when theme.frontend is next",
			})
			return
		}

		target, err := url.Parse(targetBaseURL)
		if err != nil || target.Scheme == "" || target.Host == "" {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"message": "NEXT_FRONTEND_BASE_URL or FRONTEND_NEXT_BASE_URL is invalid",
			})
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(target)
		proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
			http.Error(rw, http.StatusText(http.StatusBadGateway), http.StatusBadGateway)
		}
		proxy.ServeHTTP(c.Writer, c.Request)
		c.Abort()
	}
}

func isBackendWebRoute(path string) bool {
	return strings.HasPrefix(path, "/api") ||
		strings.HasPrefix(path, "/v1") ||
		strings.HasPrefix(path, "/assets") ||
		strings.HasPrefix(path, "/uploads/tickets")
}
