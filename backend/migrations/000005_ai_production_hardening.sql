CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id text PRIMARY KEY,
  code text NOT NULL,
  capability_id text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  template text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  updated_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, version)
);

CREATE TABLE IF NOT EXISTS ai_quota_policies (
  id text PRIMARY KEY,
  scope text NOT NULL,
  subject text NOT NULL DEFAULT '',
  daily_token_quota integer NOT NULL,
  user_rate_limit_per_minute integer NOT NULL,
  global_rate_limit_per_minute integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, subject)
);

CREATE TABLE IF NOT EXISTS ai_rate_limit_events (
  id text PRIMARY KEY,
  user_id text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  limit_key text NOT NULL,
  limit_value integer NOT NULL DEFAULT 0,
  current_value integer NOT NULL DEFAULT 0,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_capability ON ai_prompt_templates(capability_id, status);
ALTER TABLE ai_prompt_templates DROP CONSTRAINT IF EXISTS ai_prompt_templates_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_prompt_templates_code_version ON ai_prompt_templates(code, version);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_events_user_created ON ai_rate_limit_events(user_id, created_at DESC);

INSERT INTO ai_quota_policies (
  id, scope, subject, daily_token_quota, user_rate_limit_per_minute, global_rate_limit_per_minute
)
VALUES ('ai-quota-default', 'global', '', 200000, 20, 120)
ON CONFLICT (scope, subject) DO UPDATE SET
  daily_token_quota = EXCLUDED.daily_token_quota,
  user_rate_limit_per_minute = EXCLUDED.user_rate_limit_per_minute,
  global_rate_limit_per_minute = EXCLUDED.global_rate_limit_per_minute,
  updated_at = now();
