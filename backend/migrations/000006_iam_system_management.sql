ALTER TABLE iam_roles
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'enabled',
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT '平台角色',
ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT '平台管理部',
ADD COLUMN IF NOT EXISTS data_scope text NOT NULL DEFAULT '按角色授权的数据范围';

CREATE TABLE IF NOT EXISTS iam_organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  parent_id text REFERENCES iam_organizations(id) ON DELETE SET NULL,
  level integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  owner text NOT NULL DEFAULT '',
  deputy text NOT NULL DEFAULT '',
  member_count integer NOT NULL DEFAULT 0,
  asset_count integer NOT NULL DEFAULT 0,
  domain_count integer NOT NULL DEFAULT 0,
  data_responsibility text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam_user_risk_accounts (
  id text PRIMARY KEY,
  user_id text REFERENCES iam_users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  risk_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  evidence text NOT NULL DEFAULT '',
  detected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam_role_risks (
  id text PRIMARY KEY,
  role_id text REFERENCES iam_roles(id) ON DELETE CASCADE,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  evidence text NOT NULL DEFAULT '',
  detected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam_org_changes (
  id text PRIMARY KEY,
  org_id text REFERENCES iam_organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'review',
  status text NOT NULL DEFAULT 'pending',
  applicant text NOT NULL DEFAULT '',
  impact text NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iam_roles_status ON iam_roles(status);
CREATE INDEX IF NOT EXISTS idx_iam_organizations_status ON iam_organizations(status);
CREATE INDEX IF NOT EXISTS idx_iam_user_risk_accounts_status ON iam_user_risk_accounts(status);
CREATE INDEX IF NOT EXISTS idx_iam_role_risks_status ON iam_role_risks(status);
CREATE INDEX IF NOT EXISTS idx_iam_org_changes_status ON iam_org_changes(status);

UPDATE iam_roles
SET status = 'enabled',
    type = '内置角色',
    level = 'high',
    owner = '平台管理部',
    data_scope = '全平台数据与系统配置'
WHERE id = 'role-admin';

INSERT INTO iam_roles (id, code, name, description, status, type, level, owner, data_scope)
VALUES
  ('role-data-developer', 'data_developer', '数据开发工程师', '管理脚本开发、运行与发布申请。', 'enabled', '业务角色', 'medium', '数据开发组', '开发域脚本与任务数据'),
  ('role-data-steward', 'data_steward', '数据治理专员', '维护数据源、标准、质量规则与审批协同。', 'enabled', '治理角色', 'medium', '数据治理部', '治理域资产与标准数据')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  type = EXCLUDED.type,
  level = EXCLUDED.level,
  owner = EXCLUDED.owner,
  data_scope = EXCLUDED.data_scope,
  updated_at = now();

INSERT INTO iam_organizations (id, name, code, parent_id, level, status, owner, deputy, member_count, asset_count, domain_count, data_responsibility)
VALUES
  ('org-platform', '平台管理部', 'PLATFORM_ADMIN', NULL, 1, 'active', '系统管理员', '安全管理员', 3, 12, 2, '负责平台账号、角色、审计、系统配置和 AI 运营治理。'),
  ('org-governance', '数据治理部', 'DATA_GOVERNANCE', NULL, 1, 'active', '治理负责人', '标准负责人', 8, 186, 6, '负责数据资产、元数据、标准、质量、安全策略和审批协同。'),
  ('org-development', '数据开发组', 'DATA_DEVELOPMENT', 'org-governance', 2, 'active', '开发负责人', '调度负责人', 12, 94, 4, '负责脚本开发、任务编排、数据同步、实时计算和任务运维。')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  parent_id = EXCLUDED.parent_id,
  level = EXCLUDED.level,
  status = EXCLUDED.status,
  owner = EXCLUDED.owner,
  deputy = EXCLUDED.deputy,
  member_count = EXCLUDED.member_count,
  asset_count = EXCLUDED.asset_count,
  domain_count = EXCLUDED.domain_count,
  data_responsibility = EXCLUDED.data_responsibility,
  updated_at = now();

INSERT INTO iam_role_risks (id, role_id, title, severity, status, evidence)
VALUES
  ('role-risk-admin-review', 'role-admin', '高权限角色需要周期复核', 'high', 'open', 'platform:* 覆盖全平台接口，应纳入月度复核。'),
  ('role-risk-dev-publish', 'role-data-developer', '开发发布权限需审批约束', 'medium', 'reviewing', '脚本发布必须经过审批中心流转。')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  evidence = EXCLUDED.evidence,
  updated_at = now();

INSERT INTO iam_org_changes (id, org_id, title, type, status, applicant, impact)
VALUES
  ('org-change-governance-review', 'org-governance', '治理责任边界季度复核', 'review', 'pending', '系统管理员', '确认资产、标准、质量规则责任归属是否仍有效。')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  impact = EXCLUDED.impact,
  updated_at = now();
