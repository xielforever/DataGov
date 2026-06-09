package iam

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"datagov/backend/internal/platform/idutil"

	"github.com/jackc/pgx/v5"
)

type Permission struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Module      string `json:"module"`
}

type RolePermissionUpdateRequest struct {
	Permissions []string `json:"permissions"`
}

type UserManageOverview struct {
	TotalUsers    int `json:"totalUsers"`
	ActiveUsers   int `json:"activeUsers"`
	LockedUsers   int `json:"lockedUsers"`
	PendingUsers  int `json:"pendingUsers"`
	MFACoverage   int `json:"mfaCoverage"`
	StaleAccounts int `json:"staleAccounts"`
}

type SystemUser struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Username    string `json:"username"`
	Department  string `json:"department"`
	Role        string `json:"role"`
	Status      string `json:"status"`
	AuthType    string `json:"authType"`
	MFAEnabled  bool   `json:"mfaEnabled"`
	LastLogin   string `json:"lastLogin"`
	OwnerDomain string `json:"ownerDomain"`
	DataScope   string `json:"dataScope"`
}

type LoginPolicy struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Scope    string `json:"scope"`
	Rule     string `json:"rule"`
	Status   string `json:"status"`
	HitUsers int    `json:"hitUsers"`
	Owner    string `json:"owner"`
}

type OrgBinding struct {
	ID                 string `json:"id"`
	OrgName            string `json:"orgName"`
	UserCount          int    `json:"userCount"`
	Owner              string `json:"owner"`
	PrimaryRole        string `json:"primaryRole"`
	DataResponsibility string `json:"dataResponsibility"`
}

type RiskAccount struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	RiskType   string `json:"riskType"`
	Severity   string `json:"severity"`
	Status     string `json:"status"`
	DetectedAt string `json:"detectedAt"`
	Evidence   string `json:"evidence"`
}

type RoleManageOverview struct {
	TotalRoles       int `json:"totalRoles"`
	EnabledRoles     int `json:"enabledRoles"`
	PrivilegedRoles  int `json:"privilegedRoles"`
	PendingReviews   int `json:"pendingReviews"`
	PermissionGroups int `json:"permissionGroups"`
	DataScopes       int `json:"dataScopes"`
}

type SystemRole struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Code            string `json:"code"`
	Type            string `json:"type"`
	Status          string `json:"status"`
	Level           string `json:"level"`
	Owner           string `json:"owner"`
	MemberCount     int    `json:"memberCount"`
	PermissionCount int    `json:"permissionCount"`
	DataScope       string `json:"dataScope"`
	UpdatedAt       string `json:"updatedAt"`
	Description     string `json:"description"`
}

type PermissionGroup struct {
	ID       string   `json:"id"`
	RoleID   string   `json:"roleId"`
	Module   string   `json:"module"`
	Granted  int      `json:"granted"`
	Total    int      `json:"total"`
	Critical bool     `json:"critical"`
	Actions  []string `json:"actions"`
}

type DataScope struct {
	ID          string `json:"id"`
	RoleID      string `json:"roleId"`
	ScopeName   string `json:"scopeName"`
	Domain      string `json:"domain"`
	Sensitivity string `json:"sensitivity"`
	Mode        string `json:"mode"`
	Boundary    string `json:"boundary"`
}

type RoleMember struct {
	ID         string `json:"id"`
	RoleID     string `json:"roleId"`
	Name       string `json:"name"`
	Username   string `json:"username"`
	Department string `json:"department"`
	BoundAt    string `json:"boundAt"`
	Source     string `json:"source"`
}

type RoleRisk struct {
	ID         string `json:"id"`
	RoleID     string `json:"roleId"`
	Title      string `json:"title"`
	Severity   string `json:"severity"`
	Status     string `json:"status"`
	DetectedAt string `json:"detectedAt"`
	Evidence   string `json:"evidence"`
}

type OrgManageOverview struct {
	TotalOrgs             int `json:"totalOrgs"`
	ActiveOrgs            int `json:"activeOrgs"`
	DataOwners            int `json:"dataOwners"`
	PendingChanges        int `json:"pendingChanges"`
	ResponsibilityDomains int `json:"responsibilityDomains"`
	OrphanAssets          int `json:"orphanAssets"`
}

type SystemOrg struct {
	ID                 string  `json:"id"`
	Name               string  `json:"name"`
	Code               string  `json:"code"`
	ParentID           *string `json:"parentId"`
	Level              int     `json:"level"`
	Status             string  `json:"status"`
	Owner              string  `json:"owner"`
	Deputy             string  `json:"deputy"`
	MemberCount        int     `json:"memberCount"`
	AssetCount         int     `json:"assetCount"`
	DomainCount        int     `json:"domainCount"`
	DataResponsibility string  `json:"dataResponsibility"`
	UpdatedAt          string  `json:"updatedAt"`
}

type OrgResponsibility struct {
	ID         string `json:"id"`
	OrgID      string `json:"orgId"`
	Domain     string `json:"domain"`
	Scope      string `json:"scope"`
	Owner      string `json:"owner"`
	AssetCount int    `json:"assetCount"`
	Coverage   int    `json:"coverage"`
	Boundary   string `json:"boundary"`
}

type OrgSteward struct {
	ID       string `json:"id"`
	OrgID    string `json:"orgId"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Username string `json:"username"`
	Coverage string `json:"coverage"`
	Phone    string `json:"phone"`
}

type OrgChange struct {
	ID          string `json:"id"`
	OrgID       string `json:"orgId"`
	Title       string `json:"title"`
	Type        string `json:"type"`
	Status      string `json:"status"`
	Applicant   string `json:"applicant"`
	SubmittedAt string `json:"submittedAt"`
	Impact      string `json:"impact"`
}

type ListQuery struct {
	Keyword string
	Status  string
}

func (service *Service) ListPermissions(ctx context.Context) ([]Permission, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, code, name, description
		FROM iam_permissions
		ORDER BY code
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Permission, 0)
	for rows.Next() {
		var item Permission
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.Description); err != nil {
			return nil, err
		}
		item.Module = permissionModule(item.Code)
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) ListRolePermissions(ctx context.Context, roleID string) ([]string, error) {
	return service.listStrings(ctx, `
		SELECT p.code
		FROM iam_permissions p
		JOIN iam_role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id = $1
		ORDER BY p.code
	`, roleID)
}

func (service *Service) UpdateRolePermissions(ctx context.Context, roleID string, request RolePermissionUpdateRequest) ([]string, error) {
	normalized := make([]string, 0, len(request.Permissions))
	seen := map[string]bool{}
	for _, permission := range request.Permissions {
		permission = strings.TrimSpace(permission)
		if permission == "" || seen[permission] {
			continue
		}
		seen[permission] = true
		normalized = append(normalized, permission)
	}
	if roleID == "role-admin" && !seen[PermissionPlatformAll] {
		normalized = append(normalized, PermissionPlatformAll)
		seen[PermissionPlatformAll] = true
	}

	tx, err := service.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	if _, err = tx.Exec(ctx, `DELETE FROM iam_role_permissions WHERE role_id = $1`, roleID); err != nil {
		return nil, err
	}
	for _, permission := range normalized {
		commandTag, execErr := tx.Exec(ctx, `
			INSERT INTO iam_role_permissions (role_id, permission_id)
			SELECT $1, id FROM iam_permissions WHERE code = $2
			ON CONFLICT DO NOTHING
		`, roleID, permission)
		if execErr != nil {
			err = execErr
			return nil, err
		}
		if commandTag.RowsAffected() == 0 {
			service.logger.Warn("skip unknown permission when updating role", "role", roleID, "permission", permission)
		}
	}
	if _, err = tx.Exec(ctx, `UPDATE iam_roles SET updated_at = now() WHERE id = $1`, roleID); err != nil {
		return nil, err
	}
	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}
	return service.ListRolePermissions(ctx, roleID)
}

func (service *Service) UserManageOverview(ctx context.Context) (UserManageOverview, error) {
	users, err := service.ListSystemUsers(ctx, ListQuery{})
	if err != nil {
		return UserManageOverview{}, err
	}
	overview := UserManageOverview{TotalUsers: len(users), MFACoverage: 100}
	for _, user := range users {
		switch user.Status {
		case "active":
			overview.ActiveUsers++
		case "pending":
			overview.PendingUsers++
		default:
			overview.LockedUsers++
		}
		if user.LastLogin == "从未登录" {
			overview.StaleAccounts++
		}
	}
	return overview, nil
}

func (service *Service) ListSystemUsers(ctx context.Context, query ListQuery) ([]SystemUser, error) {
	rows, err := service.db.Query(ctx, `
		SELECT
			u.id,
			u.username,
			u.real_name,
			u.department,
			u.status,
			COALESCE(to_char(u.last_login_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'), ''),
			COALESCE(string_agg(DISTINCT r.name, '、'), ''),
			COALESCE(string_agg(DISTINCT r.data_scope, '；'), '')
		FROM iam_users u
		LEFT JOIN iam_user_roles ur ON ur.user_id = u.id
		LEFT JOIN iam_roles r ON r.id = ur.role_id
		GROUP BY u.id
		ORDER BY u.updated_at DESC, u.username
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	keyword := strings.ToLower(strings.TrimSpace(query.Keyword))
	status := strings.TrimSpace(query.Status)
	items := make([]SystemUser, 0)
	for rows.Next() {
		var item SystemUser
		var rawStatus, lastLogin string
		if err := rows.Scan(&item.ID, &item.Username, &item.Name, &item.Department, &rawStatus, &lastLogin, &item.Role, &item.DataScope); err != nil {
			return nil, err
		}
		item.Status = normalizeUserStatus(rawStatus)
		item.AuthType = "账号密码"
		item.MFAEnabled = true
		item.LastLogin = firstNonEmpty(lastLogin, "从未登录")
		item.OwnerDomain = firstNonEmpty(item.Department, "平台管理")
		item.Role = firstNonEmpty(item.Role, "未绑定角色")
		item.DataScope = firstNonEmpty(item.DataScope, "按角色授权")
		if status != "" && status != "all" && item.Status != status {
			continue
		}
		searchText := strings.ToLower(strings.Join([]string{item.Name, item.Username, item.Department, item.Role, item.OwnerDomain}, " "))
		if keyword != "" && !strings.Contains(searchText, keyword) {
			continue
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) UpdateSystemUserStatus(ctx context.Context, id string, status string) (SystemUser, error) {
	status = normalizeUserStatus(status)
	commandTag, err := service.db.Exec(ctx, `
		UPDATE iam_users
		SET status = $1, updated_at = now()
		WHERE id = $2
	`, status, id)
	if err != nil {
		return SystemUser{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return SystemUser{}, pgx.ErrNoRows
	}
	if status != "active" {
		_, _ = service.db.Exec(ctx, `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, id)
	}
	users, err := service.ListSystemUsers(ctx, ListQuery{})
	if err != nil {
		return SystemUser{}, err
	}
	for _, user := range users {
		if user.ID == id {
			return user, nil
		}
	}
	return SystemUser{}, pgx.ErrNoRows
}

func (service *Service) UserLoginPolicies(ctx context.Context) ([]LoginPolicy, error) {
	overview, err := service.UserManageOverview(ctx)
	if err != nil {
		return nil, err
	}
	return []LoginPolicy{
		{ID: "policy-password", Name: "账号密码登录", Scope: "全平台", Rule: "本地开发使用账号密码；生产环境需接入企业认证或强密码策略。", Status: "enabled", HitUsers: overview.TotalUsers, Owner: "平台管理部"},
		{ID: "policy-inactive", Name: "非活跃账号拦截", Scope: "已锁定/待激活账号", Rule: "用户状态不是 active 时后端拒绝登录并撤销会话。", Status: "enabled", HitUsers: overview.LockedUsers + overview.PendingUsers, Owner: "安全管理员"},
	}, nil
}

func (service *Service) UserOrgBindings(ctx context.Context) ([]OrgBinding, error) {
	orgs, err := service.ListSystemOrgs(ctx, ListQuery{})
	if err != nil {
		return nil, err
	}
	items := make([]OrgBinding, 0, len(orgs))
	for _, org := range orgs {
		items = append(items, OrgBinding{
			ID:                 "binding-" + org.ID,
			OrgName:            org.Name,
			UserCount:          org.MemberCount,
			Owner:              org.Owner,
			PrimaryRole:        "数据责任组织",
			DataResponsibility: org.DataResponsibility,
		})
	}
	return items, nil
}

func (service *Service) ListUserRiskAccounts(ctx context.Context) ([]RiskAccount, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, username, risk_type, severity, status, to_char(detected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'), evidence
		FROM iam_user_risk_accounts
		ORDER BY detected_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]RiskAccount, 0)
	for rows.Next() {
		var item RiskAccount
		if err := rows.Scan(&item.ID, &item.Username, &item.RiskType, &item.Severity, &item.Status, &item.DetectedAt, &item.Evidence); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) UpdateUserRiskAccountStatus(ctx context.Context, id string, status string) (RiskAccount, error) {
	status = normalizeRiskStatus(status)
	commandTag, err := service.db.Exec(ctx, `
		UPDATE iam_user_risk_accounts
		SET status = $1, updated_at = now()
		WHERE id = $2
	`, status, id)
	if err != nil {
		return RiskAccount{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return RiskAccount{}, pgx.ErrNoRows
	}
	items, err := service.ListUserRiskAccounts(ctx)
	if err != nil {
		return RiskAccount{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return RiskAccount{}, pgx.ErrNoRows
}

func (service *Service) RoleManageOverview(ctx context.Context) (RoleManageOverview, error) {
	roles, err := service.ListSystemRoles(ctx, ListQuery{})
	if err != nil {
		return RoleManageOverview{}, err
	}
	groups, err := service.RolePermissionGroups(ctx, "")
	if err != nil {
		return RoleManageOverview{}, err
	}
	risks, err := service.RoleRisks(ctx, "")
	if err != nil {
		return RoleManageOverview{}, err
	}
	overview := RoleManageOverview{TotalRoles: len(roles), PermissionGroups: len(groups), DataScopes: len(roles)}
	for _, role := range roles {
		if role.Status == "enabled" {
			overview.EnabledRoles++
		}
		if role.Level == "high" {
			overview.PrivilegedRoles++
		}
	}
	for _, risk := range risks {
		if risk.Status != "closed" {
			overview.PendingReviews++
		}
	}
	return overview, nil
}

func (service *Service) ListSystemRoles(ctx context.Context, query ListQuery) ([]SystemRole, error) {
	rows, err := service.db.Query(ctx, `
		SELECT
			r.id,
			r.name,
			r.code,
			r.type,
			r.status,
			r.level,
			r.owner,
			r.data_scope,
			r.description,
			to_char(r.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
			COUNT(DISTINCT ur.user_id)::int,
			COUNT(DISTINCT rp.permission_id)::int
		FROM iam_roles r
		LEFT JOIN iam_user_roles ur ON ur.role_id = r.id
		LEFT JOIN iam_role_permissions rp ON rp.role_id = r.id
		GROUP BY r.id
		ORDER BY CASE WHEN r.id = 'role-admin' THEN 0 ELSE 1 END, r.updated_at DESC, r.code
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	keyword := strings.ToLower(strings.TrimSpace(query.Keyword))
	status := strings.TrimSpace(query.Status)
	items := make([]SystemRole, 0)
	for rows.Next() {
		var item SystemRole
		if err := rows.Scan(&item.ID, &item.Name, &item.Code, &item.Type, &item.Status, &item.Level, &item.Owner, &item.DataScope, &item.Description, &item.UpdatedAt, &item.MemberCount, &item.PermissionCount); err != nil {
			return nil, err
		}
		item.Status = normalizeRoleStatus(item.Status)
		item.Level = normalizeRoleLevel(item.Level)
		if status != "" && status != "all" && item.Status != status {
			continue
		}
		searchText := strings.ToLower(strings.Join([]string{item.Name, item.Code, item.Owner, item.DataScope, item.Type}, " "))
		if keyword != "" && !strings.Contains(searchText, keyword) {
			continue
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) UpdateSystemRoleStatus(ctx context.Context, id string, status string) (SystemRole, error) {
	status = normalizeRoleStatus(status)
	if id == "role-admin" && status == "disabled" {
		return SystemRole{}, ErrProtectedRole
	}
	commandTag, err := service.db.Exec(ctx, `
		UPDATE iam_roles
		SET status = $1, updated_at = now()
		WHERE id = $2
	`, status, id)
	if err != nil {
		return SystemRole{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return SystemRole{}, pgx.ErrNoRows
	}
	roles, err := service.ListSystemRoles(ctx, ListQuery{})
	if err != nil {
		return SystemRole{}, err
	}
	for _, role := range roles {
		if role.ID == id {
			return role, nil
		}
	}
	return SystemRole{}, pgx.ErrNoRows
}

func (service *Service) RolePermissionGroups(ctx context.Context, roleID string) ([]PermissionGroup, error) {
	roles, err := service.ListSystemRoles(ctx, ListQuery{})
	if err != nil {
		return nil, err
	}
	permissions, err := service.ListPermissions(ctx)
	if err != nil {
		return nil, err
	}
	totalByModule := map[string]int{}
	for _, permission := range permissions {
		totalByModule[permission.Module]++
	}

	items := make([]PermissionGroup, 0)
	for _, role := range roles {
		if roleID != "" && role.ID != roleID {
			continue
		}
		grantedPermissions, err := service.ListRolePermissions(ctx, role.ID)
		if err != nil {
			return nil, err
		}
		actionsByModule := map[string][]string{}
		for _, permission := range grantedPermissions {
			module := permissionModule(permission)
			actionsByModule[module] = append(actionsByModule[module], permission)
		}
		modules := make([]string, 0, len(actionsByModule))
		for module := range actionsByModule {
			modules = append(modules, module)
		}
		sort.Strings(modules)
		for _, module := range modules {
			actions := actionsByModule[module]
			items = append(items, PermissionGroup{
				ID:       role.ID + "-" + strings.ReplaceAll(module, ":", "-"),
				RoleID:   role.ID,
				Module:   moduleLabel(module),
				Granted:  len(actions),
				Total:    maxInt(totalByModule[module], len(actions)),
				Critical: module == "platform" || module == "system" || module == "ai",
				Actions:  actions,
			})
		}
	}
	return items, nil
}

func (service *Service) RoleDataScopes(ctx context.Context, roleID string) ([]DataScope, error) {
	roles, err := service.ListSystemRoles(ctx, ListQuery{})
	if err != nil {
		return nil, err
	}
	items := make([]DataScope, 0, len(roles))
	for _, role := range roles {
		if roleID != "" && role.ID != roleID {
			continue
		}
		items = append(items, DataScope{
			ID:          "scope-" + role.ID,
			RoleID:      role.ID,
			ScopeName:   role.DataScope,
			Domain:      firstNonEmpty(role.Owner, "平台管理"),
			Sensitivity: "内部",
			Mode:        "按角色授权",
			Boundary:    "由 IAM 权限和后续资产域规则共同限制",
		})
	}
	return items, nil
}

func (service *Service) RoleMembers(ctx context.Context, roleID string) ([]RoleMember, error) {
	rows, err := service.db.Query(ctx, `
		SELECT ur.role_id, u.id, u.real_name, u.username, u.department, to_char(ur.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
		FROM iam_user_roles ur
		JOIN iam_users u ON u.id = ur.user_id
		WHERE ($1 = '' OR ur.role_id = $1)
		ORDER BY ur.created_at DESC, u.username
	`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]RoleMember, 0)
	for rows.Next() {
		var item RoleMember
		if err := rows.Scan(&item.RoleID, &item.ID, &item.Name, &item.Username, &item.Department, &item.BoundAt); err != nil {
			return nil, err
		}
		item.Source = "IAM 角色绑定"
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) RoleRisks(ctx context.Context, roleID string) ([]RoleRisk, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, role_id, title, severity, status, to_char(detected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'), evidence
		FROM iam_role_risks
		WHERE ($1 = '' OR role_id = $1)
		ORDER BY detected_at DESC
	`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]RoleRisk, 0)
	for rows.Next() {
		var item RoleRisk
		if err := rows.Scan(&item.ID, &item.RoleID, &item.Title, &item.Severity, &item.Status, &item.DetectedAt, &item.Evidence); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) UpdateRoleRiskStatus(ctx context.Context, id string, status string) (RoleRisk, error) {
	status = normalizeRiskStatus(status)
	commandTag, err := service.db.Exec(ctx, `
		UPDATE iam_role_risks
		SET status = $1, updated_at = now()
		WHERE id = $2
	`, status, id)
	if err != nil {
		return RoleRisk{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return RoleRisk{}, pgx.ErrNoRows
	}
	items, err := service.RoleRisks(ctx, "")
	if err != nil {
		return RoleRisk{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return RoleRisk{}, pgx.ErrNoRows
}

func (service *Service) OrgManageOverview(ctx context.Context) (OrgManageOverview, error) {
	orgs, err := service.ListSystemOrgs(ctx, ListQuery{})
	if err != nil {
		return OrgManageOverview{}, err
	}
	changes, err := service.OrgChanges(ctx, "")
	if err != nil {
		return OrgManageOverview{}, err
	}
	overview := OrgManageOverview{TotalOrgs: len(orgs)}
	for _, org := range orgs {
		if org.Status == "active" {
			overview.ActiveOrgs++
		}
		if org.Owner != "" {
			overview.DataOwners++
		}
		overview.ResponsibilityDomains += maxInt(org.DomainCount, 1)
	}
	for _, change := range changes {
		if change.Status == "pending" || change.Status == "reviewing" {
			overview.PendingChanges++
		}
	}
	return overview, nil
}

func (service *Service) ListSystemOrgs(ctx context.Context, query ListQuery) ([]SystemOrg, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, name, code, parent_id, level, status, owner, deputy, member_count, asset_count, domain_count, data_responsibility, to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
		FROM iam_organizations
		ORDER BY level ASC, code ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	keyword := strings.ToLower(strings.TrimSpace(query.Keyword))
	status := strings.TrimSpace(query.Status)
	items := make([]SystemOrg, 0)
	for rows.Next() {
		var item SystemOrg
		if err := rows.Scan(&item.ID, &item.Name, &item.Code, &item.ParentID, &item.Level, &item.Status, &item.Owner, &item.Deputy, &item.MemberCount, &item.AssetCount, &item.DomainCount, &item.DataResponsibility, &item.UpdatedAt); err != nil {
			return nil, err
		}
		item.Status = normalizeOrgStatus(item.Status)
		if status != "" && status != "all" && item.Status != status {
			continue
		}
		searchText := strings.ToLower(strings.Join([]string{item.Name, item.Code, item.Owner, item.Deputy, item.DataResponsibility}, " "))
		if keyword != "" && !strings.Contains(searchText, keyword) {
			continue
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) UpdateSystemOrgStatus(ctx context.Context, id string, status string) (SystemOrg, error) {
	status = normalizeOrgStatus(status)
	commandTag, err := service.db.Exec(ctx, `
		UPDATE iam_organizations
		SET status = $1, updated_at = now()
		WHERE id = $2
	`, status, id)
	if err != nil {
		return SystemOrg{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return SystemOrg{}, pgx.ErrNoRows
	}
	orgs, err := service.ListSystemOrgs(ctx, ListQuery{})
	if err != nil {
		return SystemOrg{}, err
	}
	for _, org := range orgs {
		if org.ID == id {
			return org, nil
		}
	}
	return SystemOrg{}, pgx.ErrNoRows
}

func (service *Service) OrgResponsibilities(ctx context.Context, orgID string) ([]OrgResponsibility, error) {
	orgs, err := service.ListSystemOrgs(ctx, ListQuery{})
	if err != nil {
		return nil, err
	}
	items := make([]OrgResponsibility, 0, len(orgs))
	for _, org := range orgs {
		if orgID != "" && org.ID != orgID {
			continue
		}
		items = append(items, OrgResponsibility{
			ID:         "resp-" + org.ID,
			OrgID:      org.ID,
			Domain:     org.Name,
			Scope:      org.DataResponsibility,
			Owner:      org.Owner,
			AssetCount: org.AssetCount,
			Coverage:   92,
			Boundary:   "以组织责任边界、资产归属和角色权限共同约束",
		})
	}
	return items, nil
}

func (service *Service) OrgStewards(ctx context.Context, orgID string) ([]OrgSteward, error) {
	orgs, err := service.ListSystemOrgs(ctx, ListQuery{})
	if err != nil {
		return nil, err
	}
	items := make([]OrgSteward, 0, len(orgs)*2)
	for _, org := range orgs {
		if orgID != "" && org.ID != orgID {
			continue
		}
		items = append(items, OrgSteward{
			ID:       "steward-owner-" + org.ID,
			OrgID:    org.ID,
			Name:     org.Owner,
			Role:     "数据 Owner",
			Username: stewardUsername(org.Owner),
			Coverage: org.DataResponsibility,
			Phone:    "-",
		})
		if org.Deputy != "" {
			items = append(items, OrgSteward{
				ID:       "steward-deputy-" + org.ID,
				OrgID:    org.ID,
				Name:     org.Deputy,
				Role:     "代理负责人",
				Username: stewardUsername(org.Deputy),
				Coverage: "组织治理协同与审批代理",
				Phone:    "-",
			})
		}
	}
	return items, nil
}

func (service *Service) OrgChanges(ctx context.Context, orgID string) ([]OrgChange, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, org_id, title, type, status, applicant, to_char(submitted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'), impact
		FROM iam_org_changes
		WHERE ($1 = '' OR org_id = $1)
		ORDER BY submitted_at DESC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]OrgChange, 0)
	for rows.Next() {
		var item OrgChange
		if err := rows.Scan(&item.ID, &item.OrgID, &item.Title, &item.Type, &item.Status, &item.Applicant, &item.SubmittedAt, &item.Impact); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) UpdateOrgChangeStatus(ctx context.Context, id string, status string) (OrgChange, error) {
	status = normalizeOrgChangeStatus(status)
	commandTag, err := service.db.Exec(ctx, `
		UPDATE iam_org_changes
		SET status = $1, updated_at = now()
		WHERE id = $2
	`, status, id)
	if err != nil {
		return OrgChange{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return OrgChange{}, pgx.ErrNoRows
	}
	items, err := service.OrgChanges(ctx, "")
	if err != nil {
		return OrgChange{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return OrgChange{}, pgx.ErrNoRows
}

func normalizeUserStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "active":
		return "active"
	case "pending":
		return "pending"
	default:
		return "locked"
	}
}

func normalizeRoleStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "disabled", "inactive":
		return "disabled"
	default:
		return "enabled"
	}
}

func normalizeRoleLevel(level string) string {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "high", "low":
		return strings.ToLower(strings.TrimSpace(level))
	default:
		return "medium"
	}
}

func normalizeOrgStatus(status string) string {
	if strings.EqualFold(strings.TrimSpace(status), "inactive") {
		return "inactive"
	}
	return "active"
}

func normalizeRiskStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "reviewing", "closed":
		return strings.ToLower(strings.TrimSpace(status))
	default:
		return "open"
	}
}

func normalizeOrgChangeStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "reviewing", "approved", "rejected":
		return strings.ToLower(strings.TrimSpace(status))
	default:
		return "pending"
	}
}

func permissionModule(permission string) string {
	permission = strings.TrimSpace(permission)
	if permission == PermissionPlatformAll {
		return "platform"
	}
	module, _, ok := strings.Cut(permission, ":")
	if !ok || module == "" {
		return "platform"
	}
	return module
}

func moduleLabel(module string) string {
	labels := map[string]string{
		"platform":    "平台全部权限",
		"auth":        "认证与会话",
		"assets":      "数据资产",
		"metadata":    "元数据管理",
		"development": "数据开发",
		"ai":          "AI 助手",
		"standards":   "数据标准",
		"quality":     "数据质量",
		"approvals":   "审批中心",
		"system":      "系统管理",
	}
	if label, ok := labels[module]; ok {
		return label
	}
	return module
}

func stewardUsername(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "unassigned"
	}
	return strings.ToLower(strings.ReplaceAll(name, " ", "."))
}

func maxInt(left int, right int) int {
	if left > right {
		return left
	}
	return right
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func timestampNow() string {
	return time.Now().UTC().Format("2006-01-02 15:04:05")
}

func notFoundOrErr(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return pgx.ErrNoRows
	}
	return err
}

func newRiskID(prefix string) string {
	return idutil.New(prefix)
}
