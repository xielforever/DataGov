// src/constants/index.ts

// DataSource Constants
export const DATA_SOURCE_CATEGORIES = ["全部", "关系型", "大数据", "消息队列", "NoSQL", "搜索引擎", "OLAP"] as const;
export const DATA_SOURCE_STATUS = [
  { key: "all", label: "全部", color: "text-slate-400" },
  { key: "active", label: "已启用", color: "text-emerald-400 bg-emerald-400/10" },
  { key: "testing", label: "测试中", color: "text-amber-400 bg-amber-400/10" },
  { key: "error", label: "连接异常", color: "text-red-400 bg-red-400/10" },
  { key: "disabled", label: "已停用", color: "text-slate-400 bg-slate-400/10" },
] as const;
export const ENV_FILTERS = ["全部", "生产", "预发", "测试", "开发"] as const;

// Common Constants
export const BUSINESS_DOMAINS = ['交易域', '用户域', '商品域', '营销域', '财务域', '风控域', '物流', '其他'];
export const DATA_LAYERS = ['ODS', 'DWD', 'DWS', 'ADS', 'DIM'];
export const SENSITIVITIES = ['公开', '内部', '敏感', '机密'];
export const DB_TYPES = ['MySQL', 'Hive', 'Kafka', 'ClickHouse', 'PostgreSQL', 'MongoDB', 'Oracle', 'Redis', 'Elasticsearch', 'Doris'];
export const TAG_OPTIONS = ['核心资产', '高价值', '高频访问', '敏感数据', '机密数据', '已认证', '外部接入', '已脱敏', '维表', '待治理', '归档'];

// Metadata Collect Constants
export const COLLECT_TASK_STATUS = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '运行中' },
  { key: 'success', label: '成功' },
  { key: 'failed', label: '失败' },
  { key: 'paused', label: '已暂停' },
  { key: 'waiting', label: '等待' },
];

// Query Constants
export const SOURCE_TYPE_OPTIONS = ['全部', 'Hive', 'ClickHouse', 'Field', 'Model', 'Metric', 'PostgreSQL', 'Kafka'];
export type UpdatedRange = 'all' | 'today' | 'week' | 'month';
export const UPDATED_OPTIONS: Array<{ key: UpdatedRange; label: string }> = [
  { key: 'all', label: '不限时间' },
  { key: 'today', label: '24小时内' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
];