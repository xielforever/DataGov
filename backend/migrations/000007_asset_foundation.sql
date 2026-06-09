CREATE TABLE IF NOT EXISTS business_domains (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_id text REFERENCES business_domains(id) ON DELETE SET NULL,
  level integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  owner text NOT NULL DEFAULT '',
  owner_username text NOT NULL DEFAULT '',
  org text NOT NULL DEFAULT '',
  asset_count integer NOT NULL DEFAULT 0,
  quality_score numeric(5, 2) NOT NULL DEFAULT 0,
  standard_coverage numeric(5, 2) NOT NULL DEFAULT 0,
  sensitive_assets integer NOT NULL DEFAULT 0,
  default_security_level text NOT NULL DEFAULT 'L2 内部',
  quality_gate text NOT NULL DEFAULT '',
  standard_required boolean NOT NULL DEFAULT true,
  color_class text NOT NULL DEFAULT 'bg-cyan-500',
  growth text NOT NULL DEFAULT '+0.0%',
  description text NOT NULL DEFAULT '',
  references_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asset_tables (
  id text PRIMARY KEY,
  name text NOT NULL,
  cn_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  database_name text NOT NULL DEFAULT '',
  schema_name text NOT NULL DEFAULT '',
  source_name text NOT NULL DEFAULT '',
  source_type text NOT NULL DEFAULT '',
  layer text NOT NULL DEFAULT 'DWD',
  business_domain_id text REFERENCES business_domains(id) ON DELETE SET NULL,
  domain_name text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  owner_avatar text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  sensitivity text NOT NULL DEFAULT '内部',
  quality_score numeric(5, 2) NOT NULL DEFAULT 0,
  row_count bigint NOT NULL DEFAULT 0,
  size_label text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  field_count integer NOT NULL DEFAULT 0,
  visit_count integer NOT NULL DEFAULT 0,
  certified boolean NOT NULL DEFAULT false,
  favorite boolean NOT NULL DEFAULT false,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_name, database_name, name)
);

CREATE TABLE IF NOT EXISTS asset_columns (
  id text PRIMARY KEY,
  asset_id text NOT NULL REFERENCES asset_tables(id) ON DELETE CASCADE,
  name text NOT NULL,
  data_type text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  ordinal_position integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  is_sensitive boolean NOT NULL DEFAULT false,
  standard_code text NOT NULL DEFAULT '',
  quality_score numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, name)
);

CREATE TABLE IF NOT EXISTS asset_tags (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT '业务标签',
  color text NOT NULL DEFAULT 'cyan',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lineage_edges (
  id text PRIMARY KEY,
  source_asset_id text NOT NULL REFERENCES asset_tables(id) ON DELETE CASCADE,
  target_asset_id text NOT NULL REFERENCES asset_tables(id) ON DELETE CASCADE,
  edge_type text NOT NULL DEFAULT 'direct',
  field_count integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_asset_id, target_asset_id)
);

CREATE INDEX IF NOT EXISTS idx_business_domains_status ON business_domains(status);
CREATE INDEX IF NOT EXISTS idx_business_domains_parent_id ON business_domains(parent_id);
CREATE INDEX IF NOT EXISTS idx_asset_tables_name ON asset_tables(name);
CREATE INDEX IF NOT EXISTS idx_asset_tables_domain ON asset_tables(business_domain_id);
CREATE INDEX IF NOT EXISTS idx_asset_tables_layer ON asset_tables(layer);
CREATE INDEX IF NOT EXISTS idx_asset_tables_status ON asset_tables(status);
CREATE INDEX IF NOT EXISTS idx_asset_columns_asset_id ON asset_columns(asset_id);
CREATE INDEX IF NOT EXISTS idx_lineage_edges_source ON lineage_edges(source_asset_id);
CREATE INDEX IF NOT EXISTS idx_lineage_edges_target ON lineage_edges(target_asset_id);

INSERT INTO iam_permissions (id, code, name, description)
VALUES
  ('perm-assets-catalog-read', 'assets:catalog:read', '查看资产目录', '读取资产总览、数据目录、地图和血缘摘要'),
  ('perm-assets-catalog-write', 'assets:catalog:write', '维护资产目录', '注册资产、维护资产目录和字段快照'),
  ('perm-assets-domains-read', 'assets:domains:read', '查看业务域', '读取业务域树和业务域选项'),
  ('perm-assets-domains-write', 'assets:domains:write', '维护业务域', '创建、编辑和启停业务域')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO iam_role_permissions (role_id, permission_id)
SELECT 'role-admin', id FROM iam_permissions
WHERE code IN ('assets:catalog:read', 'assets:catalog:write', 'assets:domains:read', 'assets:domains:write')
ON CONFLICT DO NOTHING;

INSERT INTO iam_role_permissions (role_id, permission_id)
SELECT 'role-data-steward', id FROM iam_permissions
WHERE code IN ('assets:catalog:read', 'assets:catalog:write', 'assets:domains:read', 'assets:domains:write')
ON CONFLICT DO NOTHING;

INSERT INTO iam_role_permissions (role_id, permission_id)
SELECT 'role-data-developer', id FROM iam_permissions
WHERE code IN ('assets:catalog:read', 'assets:domains:read')
ON CONFLICT DO NOTHING;

INSERT INTO business_domains (
  id, code, name, parent_id, level, status, owner, owner_username, org,
  asset_count, quality_score, standard_coverage, sensitive_assets,
  default_security_level, quality_gate, standard_required, color_class, growth,
  description, references_json
)
VALUES
  ('bd-trade', 'TRADE', '交易域', NULL, 1, 'active', '王大', 'wang.da', '交易数据组', 5, 97.4, 94.0, 1, 'L2 内部', '核心交易表发布前必须通过唯一性、金额准确性和账期完整性校验', true, 'bg-cyan-500', '+7.6%', '覆盖订单、支付、履约、退款等交易主链路数据资产。', '{"assets":5,"standards":142,"qualityRules":38,"models":84,"permissions":19}'::jsonb),
  ('bd-user', 'USER', '用户域', NULL, 1, 'active', '李秀', 'li.xiu', '用户数据组', 3, 96.1, 91.0, 3, 'L3 敏感', '用户标识、手机号、实名信息必须完成标准映射和敏感识别', true, 'bg-purple-500', '+6.4%', '覆盖用户主数据、画像、会员、触达和行为明细。', '{"assets":3,"standards":168,"qualityRules":45,"models":72,"permissions":27}'::jsonb),
  ('bd-product', 'PRODUCT', '商品域', NULL, 1, 'active', '陈伟', 'chen.wei', '商品运营', 1, 99.2, 90.0, 0, 'L2 内部', '商品类目和品牌维表必须绑定统一编码体系', true, 'bg-emerald-500', '+4.1%', '覆盖商品、类目、品牌、库存等商品经营数据资产。', '{"assets":1,"standards":96,"qualityRules":24,"models":38,"permissions":12}'::jsonb),
  ('bd-finance', 'FINANCE', '财务域', NULL, 1, 'active', '刘畅', 'liu.chang', '财务数据组', 1, 92.1, 88.0, 1, 'L4 机密', '支付、分账和收入类资产必须完成高敏识别与访问审批', true, 'bg-rose-500', '+3.8%', '覆盖支付流水、收入核算、分账和财务报表数据。', '{"assets":1,"standards":84,"qualityRules":31,"models":22,"permissions":18}'::jsonb),
  ('bd-logistics', 'LOGISTICS', '物流域', NULL, 1, 'active', '周涛', 'zhou.tao', '供应链部', 1, 89.8, 82.0, 1, 'L3 敏感', '履约轨迹数据需完成时效性和敏感字段识别', false, 'bg-amber-500', '+2.9%', '覆盖揽收、干线、派送、签收等物流履约过程数据。', '{"assets":1,"standards":52,"qualityRules":14,"models":18,"permissions":9}'::jsonb),
  ('bd-common', 'COMMON', '公共域', NULL, 1, 'active', '陈静', 'chen.jing', '数据治理部', 1, 99.7, 96.0, 0, 'L1 公开', '公共维表发布前需完成编码标准复核', true, 'bg-slate-500', '+1.2%', '覆盖行政区域、日期、组织等公共维度数据。', '{"assets":1,"standards":124,"qualityRules":18,"models":16,"permissions":8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  level = EXCLUDED.level,
  status = EXCLUDED.status,
  owner = EXCLUDED.owner,
  owner_username = EXCLUDED.owner_username,
  org = EXCLUDED.org,
  asset_count = EXCLUDED.asset_count,
  quality_score = EXCLUDED.quality_score,
  standard_coverage = EXCLUDED.standard_coverage,
  sensitive_assets = EXCLUDED.sensitive_assets,
  default_security_level = EXCLUDED.default_security_level,
  quality_gate = EXCLUDED.quality_gate,
  standard_required = EXCLUDED.standard_required,
  color_class = EXCLUDED.color_class,
  growth = EXCLUDED.growth,
  description = EXCLUDED.description,
  references_json = EXCLUDED.references_json,
  updated_at = now();

INSERT INTO asset_tables (
  id, name, cn_name, description, database_name, source_name, source_type, layer,
  business_domain_id, domain_name, owner, owner_avatar, department, sensitivity,
  quality_score, row_count, size_label, size_bytes, field_count, visit_count,
  certified, favorite, tags, updated_at
)
VALUES
  ('asset-dwd-order-detail', 'dwd_order_detail', '订单明细宽表', '交易主链路核心明细表，汇聚订单、支付、用户行为与物流关键字段', 'dwd_trade', 'prod-hive-warehouse', 'hive', 'DWD', 'bd-trade', '交易域', '王大', '', '交易数据组', '内部', 97.2, 850000000, '62.4 GB', 67001489818, 68, 16234, true, true, '["核心资产","高频访问","已认证"]'::jsonb, '2026-04-17 10:20:00+00'),
  ('asset-ads-sales-report', 'ads_sales_report', '销售分析报表', '经营分析核心应用表，支撑大盘、部门日报与高管周报', 'ads_app', 'prod-clickhouse-olap', 'clickhouse', 'ADS', 'bd-trade', '交易域', '赵敏', '', 'BI 分析', '内部', 98.4, 1200000, '320 MB', 335544320, 36, 12486, true, true, '["核心资产","高价值","已认证"]'::jsonb, '2026-04-17 08:20:00+00'),
  ('asset-ods-user', 'ods_user', '用户原始表', '来自用户中心主库的贴源数据，覆盖注册、认证、渠道等信息', 'user_center', 'prod-pg-user', 'postgresql', 'ODS', 'bd-user', '用户域', '李秀', '', '用户中心', '敏感', 93.8, 120000000, '9.8 GB', 10522669875, 44, 9780, true, false, '["敏感数据","核心资产","已脱敏"]'::jsonb, '2026-04-17 10:33:00+00'),
  ('asset-dws-user-profile', 'dws_user_profile', '用户画像汇总表', '用户标签与价值分层的汇总表，服务精准营销和用户运营', 'dws_trade', 'prod-hive-warehouse', 'hive', 'DWS', 'bd-user', '用户域', '李秀', '', '用户增长', '敏感', 95.6, 85000000, '6.8 GB', 7301444403, 96, 10258, true, true, '["高价值","已认证"]'::jsonb, '2026-04-17 09:38:00+00'),
  ('asset-dim-product-category', 'dim_product_category', '商品类目维度', '商品分析基础维表，提供类目层级、归属与业务映射能力', 'dim_common', 'prod-hive-warehouse', 'hive', 'DIM', 'bd-product', '商品域', '陈伟', '', '商品运营', '公开', 99.2, 8500, '2 MB', 2097152, 18, 8536, true, false, '["维表","高频访问","已认证"]'::jsonb, '2026-04-16 23:50:00+00'),
  ('asset-ods-payment', 'ods_payment', '支付原始流水', '支付系统流水贴源明细，包含支付渠道、状态、优惠与分账信息', 'payment_topic', 'prod-kafka-event', 'kafka', 'ODS', 'bd-finance', '财务域', '刘畅', '', '财务系统', '机密', 92.1, 356000000, '26.9 GB', 28883609190, 52, 7240, true, false, '["机密数据","核心资产"]'::jsonb, '2026-04-17 10:34:00+00'),
  ('asset-dwd-campaign', 'dwd_campaign', '营销活动明细', '活动参与、触达、转化全过程明细，支持效果复盘与归因分析', 'dwd_trade', 'prod-hive-warehouse', 'hive', 'DWD', 'bd-user', '用户域', '孙立', '', '营销中心', '内部', 90.4, 98000000, '11.3 GB', 12133282611, 46, 7245, false, false, '["待治理"]'::jsonb, '2026-04-17 10:14:00+00'),
  ('asset-ads-user-value', 'ads_user_value', '用户价值评估应用表', '用户生命周期价值模型输出表，供营销策略引擎调用', 'ads_app', 'prod-clickhouse-olap', 'clickhouse', 'ADS', 'bd-user', '用户域', '李秀', '', '用户增长', '敏感', 96.1, 85000000, '3.6 GB', 3865470566, 64, 9652, true, true, '["核心资产","高价值","已认证"]'::jsonb, '2026-04-17 08:10:00+00'),
  ('asset-ods-shipment', 'ods_shipment', '物流原始表', '物流履约过程原始明细，覆盖揽收、干线、派送与签收状态轨迹', 'ods_trade', 'prod-mysql-trade', 'mysql', 'ODS', 'bd-logistics', '物流域', '周涛', '', '供应链部', '敏感', 89.8, 68000000, '6.4 GB', 6871947674, 40, 5412, false, false, '["敏感数据"]'::jsonb, '2026-04-17 10:30:00+00'),
  ('asset-dws-order-user-1d', 'dws_order_user_1d', '用户订单日汇总', '按用户维度聚合的订单日汇总表，支撑经营与用户运营分析', 'dws_trade', 'prod-hive-warehouse', 'hive', 'DWS', 'bd-trade', '交易域', '王大', '', '交易数据组', '内部', 95.2, 58000000, '4.5 GB', 4831838208, 32, 8840, true, false, '["高价值","已认证"]'::jsonb, '2026-04-17 09:45:00+00'),
  ('asset-dim-region', 'dim_region', '地区维度', '全国行政区域标准维表，提供多级区域编码映射与地理属性', 'dim_common', 'prod-oracle-finance', 'oracle', 'DIM', 'bd-common', '公共域', '陈静', '', '数据治理部', '公开', 99.7, 3500, '1 MB', 1048576, 18, 7826, true, false, '["维表","公共数据","已认证"]'::jsonb, '2026-04-16 23:40:00+00')
ON CONFLICT (id) DO UPDATE SET
  cn_name = EXCLUDED.cn_name,
  description = EXCLUDED.description,
  database_name = EXCLUDED.database_name,
  source_name = EXCLUDED.source_name,
  source_type = EXCLUDED.source_type,
  layer = EXCLUDED.layer,
  business_domain_id = EXCLUDED.business_domain_id,
  domain_name = EXCLUDED.domain_name,
  owner = EXCLUDED.owner,
  department = EXCLUDED.department,
  sensitivity = EXCLUDED.sensitivity,
  quality_score = EXCLUDED.quality_score,
  row_count = EXCLUDED.row_count,
  size_label = EXCLUDED.size_label,
  size_bytes = EXCLUDED.size_bytes,
  field_count = EXCLUDED.field_count,
  visit_count = EXCLUDED.visit_count,
  certified = EXCLUDED.certified,
  favorite = EXCLUDED.favorite,
  tags = EXCLUDED.tags,
  updated_at = EXCLUDED.updated_at;

INSERT INTO asset_columns (id, asset_id, name, data_type, comment, ordinal_position, is_primary, is_sensitive, standard_code, quality_score)
VALUES
  ('col-order-id', 'asset-dwd-order-detail', 'order_id', 'bigint', '订单 ID', 1, true, false, 'STD_ORDER_ID', 99.0),
  ('col-order-user-id', 'asset-dwd-order-detail', 'user_id', 'bigint', '买家用户 ID', 2, false, true, 'STD_USER_ID', 98.0),
  ('col-order-pay-amount', 'asset-dwd-order-detail', 'pay_amount', 'decimal(18,2)', '实付金额', 3, false, false, 'STD_AMOUNT', 97.0),
  ('col-order-pay-time', 'asset-dwd-order-detail', 'pay_time', 'timestamp', '支付时间', 4, false, false, 'STD_TIME', 96.0),
  ('col-order-dt', 'asset-dwd-order-detail', 'dt', 'date', '业务分区日期', 5, false, false, 'STD_BIZ_DATE', 99.0),
  ('col-sales-dt', 'asset-ads-sales-report', 'dt', 'date', '统计日期', 1, true, false, 'STD_BIZ_DATE', 99.0),
  ('col-sales-amount', 'asset-ads-sales-report', 'gmv', 'decimal(18,2)', '销售金额', 2, false, false, 'STD_AMOUNT', 98.0),
  ('col-user-id', 'asset-ods-user', 'user_id', 'bigint', '用户 ID', 1, true, true, 'STD_USER_ID', 96.0),
  ('col-user-phone', 'asset-ods-user', 'phone_mask', 'varchar(64)', '脱敏手机号', 2, false, true, 'STD_PHONE', 94.0),
  ('col-profile-user-id', 'asset-dws-user-profile', 'user_id', 'bigint', '用户 ID', 1, true, true, 'STD_USER_ID', 98.0),
  ('col-product-category-id', 'asset-dim-product-category', 'category_id', 'bigint', '类目 ID', 1, true, false, 'STD_CATEGORY_ID', 99.0)
ON CONFLICT (id) DO UPDATE SET
  data_type = EXCLUDED.data_type,
  comment = EXCLUDED.comment,
  ordinal_position = EXCLUDED.ordinal_position,
  is_primary = EXCLUDED.is_primary,
  is_sensitive = EXCLUDED.is_sensitive,
  standard_code = EXCLUDED.standard_code,
  quality_score = EXCLUDED.quality_score,
  updated_at = now();

INSERT INTO asset_tags (id, name, category, color)
VALUES
  ('tag-core', '核心资产', '治理标签', 'cyan'),
  ('tag-high-value', '高价值', '业务标签', 'purple'),
  ('tag-hot', '高频访问', '运营标签', 'amber'),
  ('tag-sensitive', '敏感数据', '安全标签', 'rose'),
  ('tag-certified', '已认证', '治理标签', 'emerald'),
  ('tag-todo', '待治理', '治理标签', 'slate')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  color = EXCLUDED.color;

INSERT INTO lineage_edges (id, source_asset_id, target_asset_id, edge_type, field_count, description)
VALUES
  ('lineage-ods-user-profile', 'asset-ods-user', 'asset-dws-user-profile', 'transform', 18, '用户主数据汇总为画像基础属性'),
  ('lineage-order-user', 'asset-dwd-order-detail', 'asset-dws-order-user-1d', 'aggregate', 16, '订单明细按用户和日期聚合'),
  ('lineage-order-sales', 'asset-dwd-order-detail', 'asset-ads-sales-report', 'aggregate', 12, '交易明细汇总到经营分析报表'),
  ('lineage-user-value', 'asset-dws-user-profile', 'asset-ads-user-value', 'transform', 24, '用户画像输入价值评估模型'),
  ('lineage-sales-dim', 'asset-dim-product-category', 'asset-ads-sales-report', 'direct', 6, '商品类目维度补充销售报表维度')
ON CONFLICT (id) DO UPDATE SET
  edge_type = EXCLUDED.edge_type,
  field_count = EXCLUDED.field_count,
  description = EXCLUDED.description;
