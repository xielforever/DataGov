CREATE TABLE IF NOT EXISTS approval_requests (
  id text PRIMARY KEY,
  module_type text NOT NULL,
  title text NOT NULL,
  applicant_id text NOT NULL DEFAULT '',
  applicant_name text NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  apply_time timestamptz NOT NULL DEFAULT now(),
  process_time timestamptz,
  processor_id text NOT NULL DEFAULT '',
  processor_name text NOT NULL DEFAULT '',
  process_comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_applicant ON approval_requests(applicant_id);

INSERT INTO approval_requests (id, module_type, title, applicant_id, applicant_name, reason, status, payload, apply_time)
VALUES
  (
    'approval-script-publish-001',
    'data_model',
    '发布订单明细脚本到开发环境',
    'user-admin',
    '张无忌',
    '脚本已完成自测，需要发布到开发环境用于数据服务联调。',
    'pending',
    '{"modelId":"sample_order_detail_query","modelName":"sample_order_detail_query","ddl":"-- script publish placeholder"}'::jsonb,
    now() - interval '2 hours'
  ),
  (
    'approval-standard-001',
    'data_standard',
    '新增客户手机号脱敏标准',
    'user-admin',
    '当前用户',
    '补充客户手机号在开发与测试环境的展示规则。',
    'approved',
    '{"diff":"+ 手机号展示规则：前三后四，中间脱敏"}'::jsonb,
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;
