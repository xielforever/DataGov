package server

import (
	"errors"
	"net/http"

	"datagov/backend/internal/modules/iam"
	"datagov/backend/internal/platform/httpx"
)

func (server *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var request iam.LoginRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid login request")
		return
	}

	response, err := server.iam.Login(r.Context(), request, iam.RequestMeta{
		IPAddress: httpx.ClientIP(r),
		UserAgent: r.UserAgent(),
	})
	if err != nil {
		server.writeAuthError(w, err)
		return
	}
	httpx.Success(w, response)
}

func (server *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	profile, err := server.iam.CurrentUser(r.Context(), httpx.BearerToken(r))
	if err != nil {
		server.writeAuthError(w, err)
		return
	}
	httpx.Success(w, profile)
}

func (server *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if err := server.iam.Logout(r.Context(), httpx.BearerToken(r)); err != nil {
		server.writeAuthError(w, err)
		return
	}
	httpx.Success(w, map[string]bool{"success": true})
}

func (server *Server) requireAuth(w http.ResponseWriter, r *http.Request) bool {
	_, ok := server.currentUser(w, r)
	return ok
}

func (server *Server) requirePermission(w http.ResponseWriter, r *http.Request, permission string) (iam.UserProfile, bool) {
	profile, ok := server.currentUser(w, r)
	if !ok {
		return iam.UserProfile{}, false
	}
	if iam.HasPermission(profile, permission) {
		return profile, true
	}

	meta := iam.RequestMeta{
		IPAddress: httpx.ClientIP(r),
		UserAgent: r.UserAgent(),
	}
	if err := server.iam.RecordAccessDenied(r.Context(), profile, permission, meta, "api", r.URL.Path); err != nil {
		server.deps.Logger.Warn("record access denied event failed", "error", err, "permission", permission)
	}

	httpx.Error(w, http.StatusForbidden, 403, "无权访问当前能力")
	return iam.UserProfile{}, false
}

func (server *Server) currentUser(w http.ResponseWriter, r *http.Request) (iam.UserProfile, bool) {
	profile, err := server.iam.CurrentUser(r.Context(), httpx.BearerToken(r))
	if err != nil {
		server.writeAuthError(w, err)
		return iam.UserProfile{}, false
	}
	return profile, true
}

func (server *Server) writeAuthError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, iam.ErrInvalidCredentials):
		httpx.Error(w, http.StatusUnauthorized, 401, "账号或密码错误")
	case errors.Is(err, iam.ErrInactiveUser):
		httpx.Error(w, http.StatusForbidden, 403, "用户状态不可用")
	case errors.Is(err, iam.ErrUnauthorized):
		httpx.Error(w, http.StatusUnauthorized, 401, "未登录或会话已过期")
	default:
		server.deps.Logger.Error("auth request failed", "error", err)
		httpx.Error(w, http.StatusInternalServerError, 500, "认证服务异常")
	}
}
