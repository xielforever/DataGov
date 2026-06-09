package iam

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	"datagov/backend/internal/platform/config"
	"datagov/backend/internal/platform/idutil"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrInactiveUser       = errors.New("inactive user")
	ErrProtectedRole      = errors.New("protected role cannot be modified")
)

const PermissionPlatformAll = "platform:*"

type Service struct {
	db     *pgxpool.Pool
	cfg    config.AuthConfig
	logger *slog.Logger
}

type RequestMeta struct {
	IPAddress string
	UserAgent string
}

type LoginRequest struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	RememberMe bool   `json:"rememberMe"`
}

type LoginResponse struct {
	Token     string      `json:"token"`
	ExpiresAt string      `json:"expiresAt"`
	User      UserProfile `json:"user"`
}

type UserProfile struct {
	ID          string   `json:"id"`
	Username    string   `json:"username"`
	RealName    string   `json:"realName"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
	Avatar      string   `json:"avatar"`
	Department  string   `json:"department"`
	LastLoginAt string   `json:"lastLoginAt,omitempty"`
}

type dbUser struct {
	ID           string
	Username     string
	PasswordHash string
	RealName     string
	Avatar       string
	Department   string
	Status       string
}

func NewService(db *pgxpool.Pool, cfg config.AuthConfig, logger *slog.Logger) *Service {
	if logger == nil {
		logger = slog.Default()
	}
	return &Service{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

func (service *Service) Bootstrap(ctx context.Context) error {
	permissions := []struct {
		ID          string
		Code        string
		Name        string
		Description string
	}{
		{"perm-platform-all", PermissionPlatformAll, "平台全部权限", "首期管理员通配权限"},
		{"perm-auth-me", "auth:me", "查看当前用户", "读取当前登录用户信息"},
		{"perm-metadata-ds", "metadata:data_sources:*", "数据源管理", "管理数据源接入和同步"},
		{"perm-metadata-ds-read", "metadata:data_sources:read", "查看数据源", "查看数据源列表和详情"},
		{"perm-metadata-ds-create", "metadata:data_sources:create", "创建数据源", "新增数据源注册信息"},
		{"perm-metadata-ds-test", "metadata:data_sources:test", "测试数据源", "执行数据源连通性测试"},
		{"perm-metadata-ds-sync", "metadata:data_sources:sync", "同步数据源", "触发数据源元数据同步"},
		{"perm-metadata-ds-status", "metadata:data_sources:status", "变更数据源状态", "启停或标记数据源状态"},
		{"perm-assets-catalog-read", "assets:catalog:read", "查看资产目录", "读取资产总览、数据目录、地图和血缘摘要"},
		{"perm-assets-catalog-write", "assets:catalog:write", "维护资产目录", "注册资产、维护资产目录和字段快照"},
		{"perm-assets-domains-read", "assets:domains:read", "查看业务域", "读取业务域树和业务域选项"},
		{"perm-assets-domains-write", "assets:domains:write", "维护业务域", "创建、编辑和启停业务域"},
		{"perm-dev-scripts", "development:scripts:*", "脚本开发", "管理脚本目录、版本和运行"},
		{"perm-dev-scripts-read", "development:scripts:read", "查看脚本", "查看脚本树、脚本内容和版本"},
		{"perm-dev-scripts-write", "development:scripts:write", "编辑脚本", "创建和保存脚本"},
		{"perm-dev-scripts-run", "development:scripts:run", "运行脚本", "创建脚本运行记录"},
		{"perm-dev-scripts-publish", "development:scripts:publish", "发布脚本", "提交脚本发布申请或占位流程"},
		{"perm-ai-use", "ai:assistant:use", "AI 助手", "使用全局 AI 助手"},
		{"perm-ai-tools-read", "ai:tools:read", "查看 AI 工具", "查看 AI 可用工具和权限状态"},
		{"perm-ai-observability-read", "ai:observability:read", "查看 AI 观测", "查看 AI 模型调用、Token、限流和工具调用概览"},
		{"perm-standards-read", "standards:read", "查看数据标准", "读取数据标准定义和映射摘要"},
		{"perm-quality-rules-read", "quality:rules:read", "查看质量规则", "读取质量规则和检查结果摘要"},
		{"perm-metadata-lineage-read", "metadata:lineage:read", "查看数据血缘", "读取血缘影响摘要"},
		{"perm-approvals-read", "approvals:requests:read", "查看审批", "查看审批中心列表"},
		{"perm-approvals-process", "approvals:requests:process", "处理审批", "通过、驳回或处理审批实例"},
		{"perm-system-manage", "system:manage", "系统管理", "管理用户、角色、组织和系统配置"},
	}

	for _, permission := range permissions {
		if _, err := service.db.Exec(ctx, `
			INSERT INTO iam_permissions (id, code, name, description)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (id) DO UPDATE SET
				code = EXCLUDED.code,
				name = EXCLUDED.name,
				description = EXCLUDED.description
		`, permission.ID, permission.Code, permission.Name, permission.Description); err != nil {
			return err
		}

		if _, err := service.db.Exec(ctx, `
			INSERT INTO iam_role_permissions (role_id, permission_id)
			VALUES ('role-admin', $1)
			ON CONFLICT DO NOTHING
		`, permission.ID); err != nil {
			return err
		}
	}

	defaultRolePermissions := map[string][]string{
		"role-data-developer": {
			"auth:me",
			"development:scripts:read",
			"development:scripts:write",
			"development:scripts:run",
			"development:scripts:publish",
			"metadata:data_sources:read",
			"assets:catalog:read",
			"assets:domains:read",
			"ai:assistant:use",
			"ai:tools:read",
			"approvals:requests:read",
		},
		"role-data-steward": {
			"auth:me",
			"metadata:data_sources:read",
			"metadata:data_sources:test",
			"metadata:data_sources:sync",
			"metadata:lineage:read",
			"assets:catalog:read",
			"assets:catalog:write",
			"assets:domains:read",
			"assets:domains:write",
			"standards:read",
			"quality:rules:read",
			"ai:assistant:use",
			"ai:tools:read",
			"approvals:requests:read",
			"approvals:requests:process",
		},
	}
	for roleID, permissionCodes := range defaultRolePermissions {
		for _, permissionCode := range permissionCodes {
			if _, err := service.db.Exec(ctx, `
				INSERT INTO iam_role_permissions (role_id, permission_id)
				SELECT $1, id FROM iam_permissions WHERE code = $2
				ON CONFLICT DO NOTHING
			`, roleID, permissionCode); err != nil {
				return err
			}
		}
	}

	if strings.TrimSpace(service.cfg.BootstrapAdminPassword) == "" {
		service.logger.Warn("bootstrap admin password is empty; skip default user")
		return nil
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(service.cfg.BootstrapAdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	username := strings.TrimSpace(service.cfg.BootstrapAdminUsername)
	if username == "" {
		username = "admin"
	}

	var userID string
	err = service.db.QueryRow(ctx, `SELECT id FROM iam_users WHERE username = $1`, username).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		userID = "user-admin"
		if _, err := service.db.Exec(ctx, `
			INSERT INTO iam_users (id, username, password_hash, real_name, avatar, department, status)
			VALUES ($1, $2, $3, $4, '', '平台管理部', 'active')
		`, userID, username, string(passwordHash), service.cfg.BootstrapAdminRealName); err != nil {
			return err
		}
		service.logger.Warn("created development bootstrap admin; rotate password before non-local use", "username", username)
	} else if err != nil {
		return err
	}

	_, err = service.db.Exec(ctx, `
		INSERT INTO iam_user_roles (user_id, role_id)
		VALUES ($1, 'role-admin')
		ON CONFLICT DO NOTHING
	`, userID)
	return err
}

func (service *Service) Login(ctx context.Context, request LoginRequest, meta RequestMeta) (LoginResponse, error) {
	username := strings.TrimSpace(request.Username)
	if username == "" || request.Password == "" {
		return LoginResponse{}, ErrInvalidCredentials
	}

	user, err := service.findUserByUsername(ctx, username)
	if err != nil {
		_ = service.recordLoginEvent(ctx, username, "", "failed", meta, "账号或密码错误")
		return LoginResponse{}, err
	}
	if user.Status != "active" {
		_ = service.recordLoginEvent(ctx, username, user.ID, "failed", meta, "用户状态不可用")
		return LoginResponse{}, ErrInactiveUser
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password)); err != nil {
		_ = service.recordLoginEvent(ctx, username, user.ID, "failed", meta, "账号或密码错误")
		return LoginResponse{}, ErrInvalidCredentials
	}

	now := time.Now().UTC()
	expiresAt := now.Add(time.Duration(service.cfg.TokenTTLHours) * time.Hour)
	if request.RememberMe {
		expiresAt = now.Add(time.Duration(service.cfg.RememberTokenTTLHours) * time.Hour)
	}

	token := idutil.Token()
	tokenHash := hashToken(token)

	tx, err := service.db.Begin(ctx)
	if err != nil {
		return LoginResponse{}, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	if _, err = tx.Exec(ctx, `
		INSERT INTO sessions (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)
	`, idutil.New("sess"), user.ID, tokenHash, expiresAt); err != nil {
		return LoginResponse{}, err
	}
	if _, err = tx.Exec(ctx, `UPDATE iam_users SET last_login_at = now(), updated_at = now() WHERE id = $1`, user.ID); err != nil {
		return LoginResponse{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return LoginResponse{}, err
	}

	_ = service.recordLoginEvent(ctx, username, user.ID, "success", meta, "登录成功")

	profile, err := service.profileByUserID(ctx, user.ID)
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt.Format(time.RFC3339),
		User:      profile,
	}, nil
}

func (service *Service) CurrentUser(ctx context.Context, token string) (UserProfile, error) {
	userID, err := service.userIDByToken(ctx, token)
	if err != nil {
		return UserProfile{}, err
	}
	return service.profileByUserID(ctx, userID)
}

func (service *Service) Logout(ctx context.Context, token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return ErrUnauthorized
	}
	commandTag, err := service.db.Exec(ctx, `
		UPDATE sessions SET revoked_at = now()
		WHERE token_hash = $1 AND revoked_at IS NULL
	`, hashToken(token))
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return ErrUnauthorized
	}
	return nil
}

func (service *Service) findUserByUsername(ctx context.Context, username string) (dbUser, error) {
	var user dbUser
	err := service.db.QueryRow(ctx, `
		SELECT id, username, password_hash, real_name, avatar, department, status
		FROM iam_users
		WHERE username = $1
	`, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.RealName, &user.Avatar, &user.Department, &user.Status)
	if errors.Is(err, pgx.ErrNoRows) {
		return dbUser{}, ErrInvalidCredentials
	}
	return user, err
}

func (service *Service) userIDByToken(ctx context.Context, token string) (string, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return "", ErrUnauthorized
	}
	var userID string
	err := service.db.QueryRow(ctx, `
		SELECT s.user_id
		FROM sessions s
		JOIN iam_users u ON u.id = s.user_id
		WHERE s.token_hash = $1
		  AND s.revoked_at IS NULL
		  AND s.expires_at > now()
		  AND u.status = 'active'
	`, hashToken(token)).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrUnauthorized
	}
	return userID, err
}

func (service *Service) profileByUserID(ctx context.Context, userID string) (UserProfile, error) {
	var profile UserProfile
	var lastLoginAt *time.Time
	err := service.db.QueryRow(ctx, `
		SELECT id, username, real_name, avatar, department, last_login_at
		FROM iam_users
		WHERE id = $1
	`, userID).Scan(&profile.ID, &profile.Username, &profile.RealName, &profile.Avatar, &profile.Department, &lastLoginAt)
	if err != nil {
		return UserProfile{}, err
	}

	if lastLoginAt != nil {
		profile.LastLoginAt = lastLoginAt.UTC().Format(time.RFC3339)
	}

	roles, err := service.listStrings(ctx, `
		SELECT r.code
		FROM iam_roles r
		JOIN iam_user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = $1
			AND r.status = 'enabled'
		ORDER BY r.code
	`, userID)
	if err != nil {
		return UserProfile{}, err
	}
	profile.Roles = roles

	permissions, err := service.listStrings(ctx, `
		SELECT DISTINCT p.code
		FROM iam_permissions p
		JOIN iam_role_permissions rp ON rp.permission_id = p.id
		JOIN iam_user_roles ur ON ur.role_id = rp.role_id
		JOIN iam_roles r ON r.id = ur.role_id
		WHERE ur.user_id = $1
			AND r.status = 'enabled'
		ORDER BY p.code
	`, userID)
	if err != nil {
		return UserProfile{}, err
	}
	profile.Permissions = permissions

	return profile, nil
}

func (service *Service) listStrings(ctx context.Context, sql string, args ...any) ([]string, error) {
	rows, err := service.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	values := make([]string, 0)
	for rows.Next() {
		var value string
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		values = append(values, value)
	}
	return values, rows.Err()
}

func (service *Service) recordLoginEvent(ctx context.Context, username string, userID string, status string, meta RequestMeta, message string) error {
	_, err := service.db.Exec(ctx, `
		INSERT INTO login_events (id, username, user_id, status, ip_address, user_agent, message)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, idutil.New("login"), username, userID, status, meta.IPAddress, meta.UserAgent, message)
	return err
}

func HasPermission(profile UserProfile, required string) bool {
	required = strings.TrimSpace(required)
	if required == "" {
		return true
	}
	for _, granted := range profile.Permissions {
		if permissionMatches(granted, required) {
			return true
		}
	}
	return false
}

func (service *Service) RecordAccessDenied(ctx context.Context, profile UserProfile, requiredPermission string, meta RequestMeta, resourceType string, resourceID string) error {
	details, err := json.Marshal(map[string]string{
		"requiredPermission": requiredPermission,
		"path":               resourceID,
	})
	if err != nil {
		return err
	}

	_, err = service.db.Exec(ctx, `
		INSERT INTO audit_events (id, actor_id, actor_name, action, resource_type, resource_id, details, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
	`, idutil.New("audit"), profile.ID, profile.Username, "permission.denied", resourceType, resourceID, string(details), meta.IPAddress)
	return err
}

func permissionMatches(granted string, required string) bool {
	granted = strings.TrimSpace(granted)
	if granted == "" {
		return false
	}
	if granted == required || granted == PermissionPlatformAll {
		return true
	}
	if strings.HasSuffix(granted, ":*") {
		prefix := strings.TrimSuffix(granted, "*")
		return strings.HasPrefix(required, prefix)
	}
	return false
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
