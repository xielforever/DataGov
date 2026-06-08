package server

import (
	"errors"
	"net/http"
	"strconv"

	"datagov/backend/internal/modules/ai"
	"datagov/backend/internal/platform/httpx"
)

func (server *Server) handleListAiCapabilities(w http.ResponseWriter, r *http.Request) {
	if !server.requireAuth(w, r) {
		return
	}

	items, err := server.ai.ListCapabilities(r.Context())
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleAskAiAssistant(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.AssistantRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai assistant request")
		return
	}

	response, err := server.ai.Ask(r.Context(), profile.ID, request)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, response)
}

func (server *Server) handleListAiConversations(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	items, err := server.ai.ListConversations(r.Context(), profile.ID, ai.ConversationListQuery{
		Search:          r.URL.Query().Get("search"),
		IncludeArchived: r.URL.Query().Get("includeArchived") == "true",
		Limit:           limit,
	})
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleCreateAiConversation(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.ConversationCreateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai conversation request")
		return
	}
	conversation, err := server.ai.CreateConversation(r.Context(), profile.ID, request)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, conversation)
}

func (server *Server) handleGetAiConversation(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	detail, err := server.ai.GetConversationDetail(r.Context(), profile.ID, r.PathValue("id"))
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, detail)
}

func (server *Server) handleUpdateAiConversation(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.ConversationUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai conversation update request")
		return
	}
	conversation, err := server.ai.UpdateConversation(r.Context(), profile.ID, r.PathValue("id"), request)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, conversation)
}

func (server *Server) handleSendAiConversationMessage(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.AssistantRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai message request")
		return
	}
	response, err := server.ai.SendMessage(r.Context(), profile.ID, r.PathValue("id"), request)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, response)
}

func (server *Server) handleRegenerateAiMessage(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	response, err := server.ai.RegenerateMessage(r.Context(), profile.ID, r.PathValue("id"))
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, response)
}

func (server *Server) handleFeedbackAiMessage(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.FeedbackRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai feedback request")
		return
	}
	if err := server.ai.RecordFeedback(r.Context(), profile.ID, r.PathValue("id"), request); err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, map[string]bool{"success": true})
}

func (server *Server) handleRecordAiBehaviorEvent(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.BehaviorEventRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai behavior event request")
		return
	}
	if err := server.ai.RecordBehaviorEvent(r.Context(), profile.ID, request); err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, map[string]bool{"success": true})
}

func (server *Server) handleGetAiPreferences(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	preference, err := server.ai.GetPreferences(r.Context(), profile.ID)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, preference)
}

func (server *Server) handleUpdateAiPreferences(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.Preference
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai preference request")
		return
	}
	preference, err := server.ai.UpdatePreferences(r.Context(), profile.ID, request)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, preference)
}

func (server *Server) handlePreviewAiContext(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	var request ai.ContextPreviewRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid ai context preview request")
		return
	}
	preview, err := server.ai.PreviewContext(r.Context(), profile.ID, request)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, preview)
}

func (server *Server) handleAiTokenUsage(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	overview, err := server.ai.TokenUsageOverview(r.Context(), profile.ID)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, overview)
}

func (server *Server) handleListAiTools(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return
	}

	tools, err := server.ai.ListTools(r.Context(), profile.ID)
	if err != nil {
		server.writeAiError(w, err)
		return
	}
	httpx.Success(w, tools)
}

func (server *Server) writeAiError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ai.ErrQuestionRequired):
		httpx.Error(w, http.StatusBadRequest, 400, "AI 问题不能为空")
	case errors.Is(err, ai.ErrCapabilityNotFound):
		httpx.Error(w, http.StatusBadRequest, 400, "AI 能力不存在")
	case errors.Is(err, ai.ErrConversationNotFound):
		httpx.Error(w, http.StatusNotFound, 404, "AI 会话不存在")
	case errors.Is(err, ai.ErrProviderNotConfigured):
		httpx.Error(w, http.StatusServiceUnavailable, 503, "AI 模型服务未配置")
	case errors.Is(err, ai.ErrProviderUnavailable):
		server.deps.Logger.Warn("ai provider unavailable", "error", err)
		httpx.Error(w, http.StatusBadGateway, 502, "AI 模型服务暂不可用")
	default:
		server.deps.Logger.Error("ai request failed", "error", err)
		httpx.Error(w, http.StatusInternalServerError, 500, "AI 服务异常")
	}
}
