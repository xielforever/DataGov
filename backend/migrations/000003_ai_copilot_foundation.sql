ALTER TABLE ai_sessions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS source_view_id text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS source_url text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS last_message_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS ai_user_preferences (
  user_id text PRIMARY KEY,
  answer_style text NOT NULL DEFAULT '专业简洁',
  sql_dialect text NOT NULL DEFAULT 'PostgreSQL',
  language text NOT NULL DEFAULT 'zh-CN',
  show_token_preview boolean NOT NULL DEFAULT true,
  memory_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_message_feedback (
  id text PRIMARY KEY,
  message_id text NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  user_id text NOT NULL DEFAULT '',
  rating text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_behavior_events (
  id text PRIMARY KEY,
  user_id text NOT NULL DEFAULT '',
  conversation_id text NOT NULL DEFAULT '',
  message_id text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_token_usage (
  id text PRIMARY KEY,
  message_id text NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  user_id text NOT NULL DEFAULT '',
  conversation_id text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_context_snapshots (
  id text PRIMARY KEY,
  conversation_id text NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  message_id text REFERENCES ai_messages(id) ON DELETE SET NULL,
  user_id text NOT NULL DEFAULT '',
  view_id text NOT NULL DEFAULT '',
  context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  token_estimate integer NOT NULL DEFAULT 0,
  redaction_hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_conversation_summaries (
  id text PRIMARY KEY,
  conversation_id text NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  covered_message_count integer NOT NULL DEFAULT 0,
  token_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_tool_calls (
  id text PRIMARY KEY,
  message_id text REFERENCES ai_messages(id) ON DELETE SET NULL,
  user_id text NOT NULL DEFAULT '',
  tool_name text NOT NULL,
  args_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'succeeded',
  latency_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_last ON ai_sessions(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_status ON ai_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_message_feedback_message ON ai_message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_behavior_events_user_created ON ai_behavior_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_created ON ai_token_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_context_snapshots_conversation ON ai_context_snapshots(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_message ON ai_tool_calls(message_id);
