package server

import (
	"errors"
	"net/http"

	"datagov/backend/internal/modules/development"
	"datagov/backend/internal/platform/httpx"
)

func (server *Server) handleListScripts(w http.ResponseWriter, r *http.Request) {
	if !server.requireAuth(w, r) {
		return
	}
	items, err := server.development.ListScripts(r.Context())
	if err != nil {
		server.writeDevelopmentError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleCreateScript(w http.ResponseWriter, r *http.Request) {
	if !server.requireAuth(w, r) {
		return
	}

	var request development.ScriptRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid script request")
		return
	}

	item, err := server.development.CreateScript(r.Context(), request)
	if err != nil {
		server.writeDevelopmentError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleUpdateScript(w http.ResponseWriter, r *http.Request) {
	if !server.requireAuth(w, r) {
		return
	}

	var request development.ScriptRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid script request")
		return
	}

	item, err := server.development.UpdateScript(r.Context(), r.PathValue("id"), request)
	if err != nil {
		server.writeDevelopmentError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleRunScript(w http.ResponseWriter, r *http.Request) {
	if !server.requireAuth(w, r) {
		return
	}

	result, err := server.development.RunScript(r.Context(), r.PathValue("id"))
	if err != nil {
		server.writeDevelopmentError(w, err)
		return
	}
	httpx.Success(w, result)
}

func (server *Server) handlePublishScript(w http.ResponseWriter, r *http.Request) {
	if !server.requireAuth(w, r) {
		return
	}

	result, err := server.development.PublishScript(r.Context(), r.PathValue("id"))
	if err != nil {
		server.writeDevelopmentError(w, err)
		return
	}
	httpx.Success(w, result)
}

func (server *Server) handleListScriptVersions(w http.ResponseWriter, r *http.Request) {
	if !server.requireAuth(w, r) {
		return
	}

	items, err := server.development.ListVersions(r.Context(), r.PathValue("id"))
	if err != nil {
		server.writeDevelopmentError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) writeDevelopmentError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, development.ErrScriptNotFound):
		httpx.Error(w, http.StatusNotFound, 404, "脚本不存在")
	default:
		server.deps.Logger.Error("development request failed", "error", err)
		httpx.Error(w, http.StatusInternalServerError, 500, "脚本服务异常")
	}
}
