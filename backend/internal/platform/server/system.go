package server

import (
	"errors"
	"net/http"

	"datagov/backend/internal/modules/iam"
	"datagov/backend/internal/platform/httpx"

	"github.com/jackc/pgx/v5"
)

type statusUpdateRequest struct {
	Status string `json:"status"`
}

func (server *Server) handleListPermissions(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.ListPermissions(r.Context())
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleGetRolePermissions(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.ListRolePermissions(r.Context(), r.PathValue("id"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUpdateRolePermissions(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	var request iam.RolePermissionUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid role permission request")
		return
	}
	items, err := server.iam.UpdateRolePermissions(r.Context(), r.PathValue("id"), request)
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleSystemUserOverview(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	overview, err := server.iam.UserManageOverview(r.Context())
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, overview)
}

func (server *Server) handleListSystemUsers(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.ListSystemUsers(r.Context(), iam.ListQuery{
		Keyword: r.URL.Query().Get("keyword"),
		Status:  r.URL.Query().Get("status"),
	})
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUpdateSystemUserStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	var request statusUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid user status request")
		return
	}
	item, err := server.iam.UpdateSystemUserStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleUserLoginPolicies(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.UserLoginPolicies(r.Context())
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUserOrgBindings(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.UserOrgBindings(r.Context())
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUserRiskAccounts(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.ListUserRiskAccounts(r.Context())
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUpdateUserRiskAccountStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	var request statusUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid user risk status request")
		return
	}
	item, err := server.iam.UpdateUserRiskAccountStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleSystemRoleOverview(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	overview, err := server.iam.RoleManageOverview(r.Context())
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, overview)
}

func (server *Server) handleListSystemRoles(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.ListSystemRoles(r.Context(), iam.ListQuery{
		Keyword: r.URL.Query().Get("keyword"),
		Status:  r.URL.Query().Get("status"),
	})
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUpdateSystemRoleStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	var request statusUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid role status request")
		return
	}
	item, err := server.iam.UpdateSystemRoleStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleRolePermissionGroups(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.RolePermissionGroups(r.Context(), r.URL.Query().Get("roleId"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleRoleDataScopes(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.RoleDataScopes(r.Context(), r.URL.Query().Get("roleId"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleRoleMembers(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.RoleMembers(r.Context(), r.URL.Query().Get("roleId"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleRoleRisks(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.RoleRisks(r.Context(), r.URL.Query().Get("roleId"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUpdateRoleRiskStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	var request statusUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid role risk status request")
		return
	}
	item, err := server.iam.UpdateRoleRiskStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleSystemOrgOverview(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	overview, err := server.iam.OrgManageOverview(r.Context())
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, overview)
}

func (server *Server) handleListSystemOrgs(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.ListSystemOrgs(r.Context(), iam.ListQuery{
		Keyword: r.URL.Query().Get("keyword"),
		Status:  r.URL.Query().Get("status"),
	})
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUpdateSystemOrgStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	var request statusUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid org status request")
		return
	}
	item, err := server.iam.UpdateSystemOrgStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleOrgResponsibilities(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.OrgResponsibilities(r.Context(), r.URL.Query().Get("orgId"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleOrgStewards(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.OrgStewards(r.Context(), r.URL.Query().Get("orgId"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleOrgChanges(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	items, err := server.iam.OrgChanges(r.Context(), r.URL.Query().Get("orgId"))
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleUpdateOrgChangeStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "system:manage"); !ok {
		return
	}
	var request statusUpdateRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid org change status request")
		return
	}
	item, err := server.iam.UpdateOrgChangeStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeSystemError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) writeSystemError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		httpx.Error(w, http.StatusNotFound, 404, "系统管理对象不存在")
	case errors.Is(err, iam.ErrProtectedRole):
		httpx.Error(w, http.StatusBadRequest, 400, "内置管理员角色受保护，不能停用或移除核心权限")
	default:
		server.deps.Logger.Error("system management request failed", "error", err)
		httpx.Error(w, http.StatusInternalServerError, 500, "系统管理服务异常")
	}
}
