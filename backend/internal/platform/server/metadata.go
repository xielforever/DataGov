package server

import (
	"errors"
	"net/http"

	"datagov/backend/internal/modules/metadata"
	"datagov/backend/internal/platform/httpx"
)

func (server *Server) handleListDataSources(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "metadata:data_sources:read"); !ok {
		return
	}
	items, err := server.metadata.ListDataSources(r.Context())
	if err != nil {
		server.writeMetadataError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleCreateDataSource(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "metadata:data_sources:create"); !ok {
		return
	}

	var request metadata.CreateDataSourceRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid data source request")
		return
	}

	item, err := server.metadata.CreateDataSource(r.Context(), request)
	if err != nil {
		server.writeMetadataError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleTestDataSource(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "metadata:data_sources:test"); !ok {
		return
	}

	result, err := server.metadata.TestConnection(r.Context(), r.PathValue("id"))
	if err != nil {
		server.writeMetadataError(w, err)
		return
	}
	httpx.Success(w, result)
}

func (server *Server) handleSyncDataSource(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "metadata:data_sources:sync"); !ok {
		return
	}

	run, err := server.metadata.SyncDataSource(r.Context(), r.PathValue("id"))
	if err != nil {
		server.writeMetadataError(w, err)
		return
	}
	httpx.Success(w, run)
}

func (server *Server) handleUpdateDataSourceStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "metadata:data_sources:status"); !ok {
		return
	}

	var request metadata.StatusRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid data source status request")
		return
	}

	item, err := server.metadata.UpdateStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeMetadataError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) writeMetadataError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, metadata.ErrDataSourceNotFound):
		httpx.Error(w, http.StatusNotFound, 404, "数据源不存在")
	default:
		server.deps.Logger.Error("metadata request failed", "error", err)
		httpx.Error(w, http.StatusInternalServerError, 500, "数据源服务异常")
	}
}
