package server

import (
	"errors"
	"net/http"

	"datagov/backend/internal/modules/approvals"
	"datagov/backend/internal/platform/httpx"
)

func (server *Server) handleListApprovals(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "approvals:requests:read"); !ok {
		return
	}

	items, err := server.approvals.List(r.Context())
	if err != nil {
		server.writeApprovalError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleProcessApproval(w http.ResponseWriter, r *http.Request) {
	profile, ok := server.requirePermission(w, r, "approvals:requests:process")
	if !ok {
		return
	}

	var request approvals.ProcessRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid approval process request")
		return
	}

	item, err := server.approvals.Process(r.Context(), r.PathValue("id"), request, profile)
	if err != nil {
		server.writeApprovalError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) writeApprovalError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, approvals.ErrApprovalNotFound):
		httpx.Error(w, http.StatusNotFound, 404, "审批单不存在")
	case errors.Is(err, approvals.ErrApprovalAlreadyProcessed):
		httpx.Error(w, http.StatusConflict, 409, "审批单已处理")
	case errors.Is(err, approvals.ErrInvalidAction):
		httpx.Error(w, http.StatusBadRequest, 400, "审批动作无效")
	default:
		server.deps.Logger.Error("approval request failed", "error", err)
		httpx.Error(w, http.StatusInternalServerError, 500, "审批服务异常")
	}
}
