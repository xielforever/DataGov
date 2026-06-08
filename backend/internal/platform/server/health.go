package server

import (
	"context"
	"net/http"
	"time"

	"datagov/backend/internal/platform/httpx"
)

type healthDependency struct {
	Status    string `json:"status"`
	LatencyMs int64  `json:"latencyMs"`
	Message   string `json:"message,omitempty"`
}

type healthResponse struct {
	Service     string                      `json:"service"`
	Env         string                      `json:"env"`
	Status      string                      `json:"status"`
	GeneratedAt string                      `json:"generatedAt"`
	Checks      map[string]healthDependency `json:"checks"`
}

func (server *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	response := server.health(r)
	if response.Status != "ok" {
		httpx.JSON(w, http.StatusServiceUnavailable, 1001, "dependency check failed", response)
		return
	}
	httpx.Success(w, response)
}

func (server *Server) handleReady(w http.ResponseWriter, r *http.Request) {
	server.handleHealth(w, r)
}

func (server *Server) health(r *http.Request) healthResponse {
	pgStatus, pgLatency, pgMessage := checkWithTimeout(r.Context(), 3*time.Second, server.deps.DB.Ping)
	redisStatus, redisLatency, redisMessage := checkWithTimeout(r.Context(), 3*time.Second, func(ctx context.Context) error {
		return server.deps.Redis.Ping(ctx).Err()
	})

	status := "ok"
	if pgStatus != "ok" || redisStatus != "ok" {
		status = "degraded"
	}

	return healthResponse{
		Service:     "datagov-api",
		Env:         server.deps.Config.Environment,
		Status:      status,
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Checks: map[string]healthDependency{
			"postgres": {
				Status:    pgStatus,
				LatencyMs: pgLatency,
				Message:   pgMessage,
			},
			"redis": {
				Status:    redisStatus,
				LatencyMs: redisLatency,
				Message:   redisMessage,
			},
		},
	}
}
