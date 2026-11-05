// Package httpapi собирает HTTP-роутер api. Модули регистрируют свои маршруты здесь.
package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Pinger — то, что умеет проверить доступность базы (pgxpool.Pool подходит).
type Pinger interface {
	Ping(ctx context.Context) error
}

// NewRouter возвращает роутер с общими middleware и служебными маршрутами.
func NewRouter(log *slog.Logger, db Pinger) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), requestLogger(log))

	r.GET("/health", healthHandler(db))

	return r
}

// healthHandler отвечает 200, если сервис жив и база доступна, иначе 503.
func healthHandler(db Pinger) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if err := db.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "fail", "db": "unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok", "db": "ok"})
	}
}

// requestLogger пишет по строке в журнал на каждый запрос.
func requestLogger(log *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info("http",
			"method", c.Request.Method,
			"path", c.FullPath(),
			"status", c.Writer.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
		)
	}
}
