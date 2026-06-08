package server

import (
	"context"
	"log/slog"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"datagov/backend/internal/modules/ai"
	"datagov/backend/internal/modules/development"
	"datagov/backend/internal/modules/iam"
	"datagov/backend/internal/modules/metadata"
	"datagov/backend/internal/platform/config"
	"datagov/backend/internal/platform/httpx"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Dependencies struct {
	Config config.Config
	DB     *pgxpool.Pool
	Redis  *redis.Client
	Logger *slog.Logger
}

type Server struct {
	deps        Dependencies
	mux         *http.ServeMux
	iam         *iam.Service
	metadata    *metadata.Service
	development *development.Service
	ai          *ai.Service
}

func New(deps Dependencies) *Server {
	if deps.Logger == nil {
		deps.Logger = slog.Default()
	}

	server := &Server{
		deps:        deps,
		mux:         http.NewServeMux(),
		iam:         iam.NewService(deps.DB, deps.Config.Auth, deps.Logger),
		metadata:    metadata.NewService(deps.DB, deps.Config.Sample, deps.Logger),
		development: development.NewService(deps.DB, deps.Logger),
		ai:          ai.NewService(deps.DB, deps.Config.AI, deps.Logger),
	}
	server.routes()
	return server
}

func (server *Server) Handler() http.Handler {
	return server.recover(server.cors(server.requestLog(server.mux)))
}

func (server *Server) routes() {
	server.mux.HandleFunc("GET /api/v1/health", server.handleHealth)
	server.mux.HandleFunc("GET /api/v1/ready", server.handleReady)
	server.mux.HandleFunc("POST /api/v1/auth/login", server.handleLogin)
	server.mux.HandleFunc("GET /api/v1/auth/me", server.handleMe)
	server.mux.HandleFunc("POST /api/v1/auth/logout", server.handleLogout)
	server.mux.HandleFunc("GET /api/v1/metadata/data-sources", server.handleListDataSources)
	server.mux.HandleFunc("POST /api/v1/metadata/data-sources", server.handleCreateDataSource)
	server.mux.HandleFunc("POST /api/v1/metadata/data-sources/{id}/test", server.handleTestDataSource)
	server.mux.HandleFunc("POST /api/v1/metadata/data-sources/{id}/sync", server.handleSyncDataSource)
	server.mux.HandleFunc("POST /api/v1/metadata/data-sources/{id}/status", server.handleUpdateDataSourceStatus)
	server.mux.HandleFunc("GET /api/v1/development/scripts", server.handleListScripts)
	server.mux.HandleFunc("POST /api/v1/development/scripts", server.handleCreateScript)
	server.mux.HandleFunc("PUT /api/v1/development/scripts/{id}", server.handleUpdateScript)
	server.mux.HandleFunc("POST /api/v1/development/scripts/{id}/run", server.handleRunScript)
	server.mux.HandleFunc("POST /api/v1/development/scripts/{id}/publish", server.handlePublishScript)
	server.mux.HandleFunc("GET /api/v1/development/scripts/{id}/versions", server.handleListScriptVersions)
	server.mux.HandleFunc("GET /api/v1/ai/capabilities", server.handleListAiCapabilities)
	server.mux.HandleFunc("POST /api/v1/ai/assistant/messages", server.handleAskAiAssistant)
	server.mux.HandleFunc("GET /api/v1/ai/conversations", server.handleListAiConversations)
	server.mux.HandleFunc("POST /api/v1/ai/conversations", server.handleCreateAiConversation)
	server.mux.HandleFunc("GET /api/v1/ai/conversations/{id}", server.handleGetAiConversation)
	server.mux.HandleFunc("PATCH /api/v1/ai/conversations/{id}", server.handleUpdateAiConversation)
	server.mux.HandleFunc("POST /api/v1/ai/conversations/{id}/messages", server.handleSendAiConversationMessage)
	server.mux.HandleFunc("POST /api/v1/ai/messages/{id}/regenerate", server.handleRegenerateAiMessage)
	server.mux.HandleFunc("POST /api/v1/ai/messages/{id}/feedback", server.handleFeedbackAiMessage)
	server.mux.HandleFunc("POST /api/v1/ai/behavior-events", server.handleRecordAiBehaviorEvent)
	server.mux.HandleFunc("GET /api/v1/ai/preferences", server.handleGetAiPreferences)
	server.mux.HandleFunc("PUT /api/v1/ai/preferences", server.handleUpdateAiPreferences)
	server.mux.HandleFunc("POST /api/v1/ai/context/preview", server.handlePreviewAiContext)
	server.mux.HandleFunc("GET /api/v1/ai/token-usage", server.handleAiTokenUsage)
	server.mux.HandleFunc("GET /api/v1/ai/tools", server.handleListAiTools)
	server.mux.HandleFunc("/", server.handleNotFound)
}

func (server *Server) handleNotFound(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	httpx.Error(w, http.StatusNotFound, 404, "API route not found")
}

func (server *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (strings.HasPrefix(origin, "http://127.0.0.1:") || strings.HasPrefix(origin, "http://localhost:")) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (server *Server) requestLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startedAt := time.Now()
		next.ServeHTTP(w, r)
		server.deps.Logger.Info("http request",
			"method", r.Method,
			"path", r.URL.Path,
			"duration_ms", time.Since(startedAt).Milliseconds(),
		)
	})
}

func (server *Server) recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				server.deps.Logger.Error("panic recovered", "error", err, "stack", string(debug.Stack()))
				httpx.Error(w, http.StatusInternalServerError, 500, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func checkWithTimeout(parent context.Context, timeout time.Duration, check func(context.Context) error) (string, int64, string) {
	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	startedAt := time.Now()
	err := check(ctx)
	latencyMs := time.Since(startedAt).Milliseconds()
	if err != nil {
		return "error", latencyMs, err.Error()
	}
	return "ok", latencyMs, ""
}
