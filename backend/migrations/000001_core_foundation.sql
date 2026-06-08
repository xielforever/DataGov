CREATE TABLE IF NOT EXISTS iam_users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  real_name text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam_roles (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam_permissions (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam_user_roles (
  user_id text NOT NULL REFERENCES iam_users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES iam_roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS iam_role_permissions (
  role_id text NOT NULL REFERENCES iam_roles(id) ON DELETE CASCADE,
  permission_id text NOT NULL REFERENCES iam_permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES iam_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_events (
  id text PRIMARY KEY,
  username text NOT NULL,
  user_id text,
  status text NOT NULL,
  ip_address text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  actor_id text NOT NULL DEFAULT '',
  actor_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'offline',
  host text NOT NULL,
  port integer NOT NULL,
  database_name text NOT NULL DEFAULT '',
  version text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  env text NOT NULL DEFAULT '开发',
  table_count integer NOT NULL DEFAULT 0,
  storage_gb numeric(18, 2) NOT NULL DEFAULT 0,
  qps numeric(18, 2) NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  last_sync_time timestamptz,
  description text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_source_credentials (
  data_source_id text PRIMARY KEY REFERENCES data_sources(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  password_ciphertext text NOT NULL DEFAULT '',
  secret_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS connector_health_checks (
  id text PRIMARY KEY,
  data_source_id text NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  status text NOT NULL,
  latency_ms integer NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  sample jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metadata_sync_runs (
  id text PRIMARY KEY,
  data_source_id text NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text NOT NULL DEFAULT '',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS scripts (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  script_type text NOT NULL DEFAULT '',
  editor_language text NOT NULL DEFAULT '',
  dialect text NOT NULL DEFAULT '',
  parent_id text REFERENCES scripts(id) ON DELETE SET NULL,
  data_source_id text REFERENCES data_sources(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS script_versions (
  id text PRIMARY KEY,
  script_id text NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content text NOT NULL DEFAULT '',
  creator text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (script_id, version)
);

CREATE TABLE IF NOT EXISTS script_runs (
  id text PRIMARY KEY,
  script_id text NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  status text NOT NULL,
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_preview jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS ai_capabilities (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  prompt text NOT NULL,
  icon text NOT NULL DEFAULT '',
  accent text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id text PRIMARY KEY,
  session_id text REFERENCES ai_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL DEFAULT '',
  capability_id text NOT NULL DEFAULT '',
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  references_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(5, 4) NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT '',
  latency_ms integer NOT NULL DEFAULT 0,
  redaction_hits integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'succeeded',
  error_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scripts_parent_id ON scripts(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scripts_data_source_id ON scripts(data_source_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_script_versions_script_id ON script_versions(script_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id ON ai_messages(session_id);

INSERT INTO iam_roles (id, code, name, description)
VALUES ('role-admin', 'admin', '系统管理员', '首期默认管理员角色')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_capabilities (id, title, description, prompt, icon, accent, sort_order)
VALUES
  ('write-sql', '写 SQL', '按业务口径生成 MySQL、PostgreSQL、Hive、ClickHouse 查询或建表脚本。', '帮我写一段 SQL：统计近 7 天每日订单金额、订单数和下单用户数，按日期升序输出。', 'sql', 'cyan', 10),
  ('review-sql', '分析 SQL', '检查性能风险、口径歧义、字段标准、分区过滤和可维护性。', '帮我分析这段 SQL 的性能风险、口径风险和治理建议：\nselect * from dwd_order_detail where dt >= current_date - 7;', 'review', 'emerald', 20),
  ('lineage-impact', '分析血缘', '梳理上游来源、下游影响、变更风险和发布前检查清单。', '帮我分析订单明细表 dwd_order_detail 的上下游血缘影响，以及字段变更发布前需要检查什么。', 'lineage', 'blue', 30),
  ('knowledge-explain', '知识讲解', '解释数据治理、元数据、数据标准、质量规则和安全分级知识。', '用平台实施视角讲解元数据、数据血缘、数据标准和质量规则之间的关系。', 'book', 'violet', 40),
  ('quality-rule', '质量规则', '把业务口径转成可执行的完整性、唯一性、及时性或一致性规则。', '帮我为订单事实表设计 3 条质量规则，覆盖主键唯一、金额非负和分区及时性。', 'quality', 'amber', 50),
  ('ops-diagnosis', '任务诊断', '分析同步、调度、实时计算任务的失败线索和排查路径。', '帮我诊断一个 Hive 离线任务延迟 40 分钟的可能原因，并给出排查步骤。', 'ops', 'rose', 60)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  prompt = EXCLUDED.prompt,
  icon = EXCLUDED.icon,
  accent = EXCLUDED.accent,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
