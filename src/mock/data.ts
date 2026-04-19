export const mockDashboardStats = [
  { label: '数据表总数', value: '12,847', change: '+12%', trend: 'up', icon: 'table', detail: '较上月增加 1,380 项', color: 'from-cyan-500 to-blue-500' },
  { label: '元数据条目', value: '256,392', change: '+8.5%', trend: 'up', icon: 'metadata', detail: '较上月增加 20,113 项', color: 'from-purple-500 to-fuchsia-500' },
  { label: '数据质量得分', value: '94.6', change: '+2.1', trend: 'up', icon: 'quality', detail: '超过目标 4.6 分', color: 'from-emerald-500 to-teal-500' },
  { label: '待处理任务', value: '23', change: '-5', trend: 'down', icon: 'task', detail: '较昨日减少 5 项', color: 'from-amber-500 to-orange-500' },
];

export const mockMetadataQueryData = {
  stats: [
    { id: '1', label: '收录数据源表', value: '12,847', detail: '每日凌晨2点自动增量更新', color: 'from-cyan-500 to-blue-500', icon: '🗂' },
    { id: '2', label: '收录业务字段', value: '256,392', detail: '已建立字段级血缘关系', color: 'from-emerald-500 to-teal-500', icon: '🧬' },
    { id: '3', label: '数据模型总数', value: '1,280', detail: '覆盖 8 大业务域核心模型', color: 'from-purple-500 to-fuchsia-500', icon: '🧩' },
    { id: '4', label: '派生指标数量', value: '4,562', detail: '关联规范定义与维度信息', color: 'from-amber-500 to-orange-500', icon: '📏' },
  ],
  savedQueries: [
    { id: 'q1', name: '全量交易核心模型', keyword: '交易域 核心模型', description: '用于查看交易域所有被认证的 DWS 和 ADS 核心业务模型', count: 124 },
    { id: 'q2', name: '风控敏感字段梳理', keyword: '风控 敏感字段', description: '筛查风控域中包含身份证、手机号等敏感级别为 L3 及以上的字段', count: 86 },
    { id: 'q3', name: '近7日新增 ODS 宽表', keyword: 'ODS 宽表', description: '监控近期新接入大宽表质量情况', count: 52 },
  ],
  hotKeywords: [
    { id: 'h1', keyword: 'dwd_order_detail', heat: 9860 },
    { id: 'h2', keyword: '用户画像', heat: 8520 },
    { id: 'h3', keyword: 'gmv_daily', heat: 7410 },
    { id: 'h4', keyword: '敏感字段', heat: 6350 },
    { id: 'h5', keyword: 'ads_sales_report', heat: 5240 },
    { id: 'h6', keyword: '高价值资产', heat: 4120 },
  ],
  results: [
    {
      id: 'res1', type: 'table', name: 'dwd_order_detail', cnName: '订单交易明细表',
      description: '记录电商平台所有正向交易和逆向退款的明细流水，包含订单级属性、优惠分摊和支付状态等核心业务信息。',
      domain: '交易域', layer: 'DWD', source: 'Hive 集群', sourceType: 'Hive', owner: '张无忌', department: '交易研发组',
      qualityScore: 98, certified: true, updateTime: '今天 08:30', tags: ['核心资产', '高价值', '高频访问'], heat: 9860,
      path: '交易域 / 订单子域 / dwd_order_detail',
      fields: ['order_id', 'buyer_id', 'pay_amount', 'order_status', 'create_time'],
      standards: ['交易订单状态字典', '金额计算规范(分)'],
      relations: ['上游：ods_order_info', '下游：dws_order_daily_summary']
    },
    {
      id: 'res2', type: 'model', name: 'user_profile_model', cnName: '全域用户画像模型',
      description: '整合业务库、埋点日志等数据，构建涵盖用户基础属性、行为偏好、价值分层的全方位画像特征体系。',
      domain: '用户域', layer: 'MODEL', source: 'ClickHouse', sourceType: 'Model', owner: '周芷若', department: '用户增长组',
      qualityScore: 95, certified: true, updateTime: '昨天 23:00', tags: ['标签体系', '用户特征'], heat: 8520,
      path: '用户域 / 画像子域 / user_profile_model',
      fields: ['user_id', 'age_group', 'gender', 'vip_level', 'risk_score'],
      standards: ['用户等级分类标准', '敏感信息脱敏规范'],
      relations: ['上游：dws_user_behavior', '应用：精准营销系统']
    },
    {
      id: 'res3', type: 'field', name: 'id_card_no', cnName: '身份证号码',
      description: '用户实名认证核心信息，属于最高机密数据，任何存储与查询必须经过 KMS 脱敏处理。',
      domain: '用户域', layer: 'ODS', source: 'MySQL', sourceType: 'Field', owner: '赵敏', department: '安全合规组',
      qualityScore: 100, certified: true, updateTime: '刚刚', tags: ['L4敏感', '不可明文'], heat: 6350,
      path: '用户域 / 认证子域 / ods_user_cert / id_card_no',
      fields: [], standards: ['国家密码局加密规范', 'L4 敏感数据防泄漏标准'],
      relations: ['所在表：ods_user_cert']
    },
    {
      id: 'res4', type: 'metric', name: 'daily_active_user', cnName: '日活跃用户数(DAU)',
      description: '当日至少发生一次有效点击或页面访问的去重设备/用户数，是衡量平台用户粘性的核心指标。',
      domain: '流量域', layer: 'ADS', source: 'Kylin', sourceType: 'Metric', owner: '小昭', department: '数据分析组',
      qualityScore: 92, certified: false, updateTime: '2 小时前', tags: ['核心指标', '高管看板'], heat: 5200,
      path: '流量域 / 活跃指标树 / daily_active_user',
      fields: ['log_date', 'platform', 'dau_count'], standards: ['DAU 统计口径 v2.1'],
      relations: ['来源模型：dws_traffic_session_1d']
    }
  ]
};

export const mockMetadataMaintainData = {
  stats: [
    { id: '1', label: '待维护资产', value: 342, unit: '项', change: '-12', color: 'from-amber-500 to-orange-500', icon: '📝' },
    { id: '2', label: '处理中工单', value: 58, unit: '个', change: '+3', color: 'from-cyan-500 to-blue-500', icon: '🔄' },
    { id: '3', label: '本周已解决', value: 126, unit: '项', change: '+24', color: 'from-emerald-500 to-teal-500', icon: '✅' },
    { id: '4', label: '逾期未处理', value: 12, unit: '项', change: '-2', color: 'from-rose-500 to-red-500', icon: '⚠️' },
    { id: '5', label: '平均处理时长', value: 1.4, unit: '天', change: '-0.2天', color: 'from-purple-500 to-fuchsia-500', icon: '⚡' }
  ],
  assets: [
    {
      id: 'a1', name: 'ods_crm_customer', cnName: 'CRM客户原始表', layer: 'ODS', domain: '用户域', owner: '张三', department: 'CRM研发组',
      status: 'pending', completeness: 65, updateTime: '2天前', issueCount: 5, database: 'ods_db',
      description: '同步自 Salesforce 系统的客户全量档案数据。',
      tags: ['原始数据', '客户信息'],
      issues: ['缺少表级业务描述', '4 个字段无中文注释', '未配置数据保留策略'],
      fields: [
        { name: 'cust_id', type: 'varchar', nullable: false, comment: '客户唯一标识', standard: '全局主键', status: 'complete' },
        { name: 'phone_num', type: 'varchar', nullable: true, comment: '', standard: '', status: 'missing' },
        { name: 'address', type: 'varchar', nullable: true, comment: '', standard: '', status: 'missing' }
      ],
      timeline: [
        { time: '2026-04-16 10:00', action: '元数据扫描发现异常', operator: 'System', detail: '新增 2 个缺失注释字段' }
      ]
    },
    {
      id: 'a2', name: 'dim_product_category', cnName: '商品类目维度表', layer: 'DIM', domain: '商品域', owner: '李四', department: '商品架构组',
      status: 'in-progress', completeness: 88, updateTime: '今天 09:30', issueCount: 2, database: 'dim_db',
      description: '全平台标准的三级商品类目树。',
      tags: ['维度表', '核心资产'],
      issues: ['类目状态字段枚举值未定义规范'],
      fields: [
        { name: 'category_id', type: 'bigint', nullable: false, comment: '类目ID', standard: '类目主键', status: 'complete' },
        { name: 'category_name', type: 'varchar', nullable: false, comment: '类目名称', standard: '', status: 'complete' },
        { name: 'status', type: 'tinyint', nullable: false, comment: '', standard: '', status: 'missing' }
      ],
      timeline: [
        { time: '2026-04-18 09:30', action: '接手工单', operator: '李四', detail: '开始补充状态枚举值' },
        { time: '2026-04-15 14:00', action: '创建维护工单', operator: '王五', detail: '下游反馈状态字段难以理解' }
      ]
    }
  ],
  workOrders: [
    { id: 'WO-20260418-001', title: '补充 dwd_order 核心字段注释', assetName: 'dwd_order_detail', assignee: '张无忌', priority: 'P0', status: 'processing', dueDate: '今天 18:00', source: '质量扫描', progress: 60 },
    { id: 'WO-20260417-042', title: '废弃字段下线确认', assetName: 'ods_old_log', assignee: '周芷若', priority: 'P2', status: 'todo', dueDate: '明天 12:00', source: '人工提交', progress: 0 },
    { id: 'WO-20260416-088', title: '新增敏感字段脱敏策略配置', assetName: 'dim_user_info', assignee: '赵敏', priority: 'P1', status: 'review', dueDate: '今天 20:00', source: '安全合规', progress: 95 }
  ],
  snapshots: [
    { id: 'SNAP-240418-A', assetName: 'dws_traffic_daily', version: 'v2.4.1', changedFields: 3, changedBy: '小昭', createdAt: '2026-04-18 10:15', summary: '新增停留时长、跳出率汇总指标字段', type: 'manual' },
    { id: 'SNAP-240417-B', assetName: 'dim_product', version: 'v1.8.0', changedFields: 1, changedBy: 'System', createdAt: '2026-04-17 02:00', summary: '自动感知表结构变更：删除备用字段1', type: 'auto' },
    { id: 'SNAP-240416-C', assetName: 'ads_sales_report', version: 'v3.0.0', changedFields: 12, changedBy: '王五', createdAt: '2026-04-16 15:30', summary: '重大版本升级，重构利润核算口径字段', type: 'workflow' }
  ]
};

export const mockDashboardRecentTables = [
  { name: 'dwd_user_behavior_log', db: 'ods_db', layer: 'dwd', owner: '张三', updated: '2 分钟', quality: 98 },
  { name: 'dim_product_category', db: 'dim_db', layer: 'dim', owner: '李四', updated: '15 分钟', quality: 95 },
  { name: 'dws_order_daily_stat', db: 'dws_db', layer: 'dws', owner: '王五', updated: '1 小时', quality: 92 },
  { name: 'ads_sales_report_2024', db: 'ads_db', layer: 'ads', owner: '赵六', updated: '3 小时', quality: 89 },
  { name: 'ods_crm_customer_info', db: 'ods_db', layer: 'ods', owner: '张三', updated: '5 小时', quality: 96 },
];

export const mockDashboardQualityTrends = [
  { month: '7 ', score: 86.2, tables: 11200, alerts: 45 },
  { month: '8 ', score: 88.0, tables: 11580, alerts: 38 },
  { month: '9 ', score: 90.1, tables: 11900, alerts: 31 },
  { month: '10 ', score: 89.3, tables: 12100, alerts: 35 },
  { month: '11 ', score: 92.4, tables: 12480, alerts: 22 },
  { month: '12 ', score: 93.1, tables: 12650, alerts: 18 },
  { month: '1 ', score: 94.6, tables: 12847, alerts: 12 },
];

export const mockDashboardTasks = [
  { name: '每日数据质量巡检', status: 'running', progress: 75, nextRun: '进行', duration: '12分钟' },
  { name: '元数据自动采', status: 'success', progress: 100, nextRun: '今日 02:00', duration: '已完' },
  { name: '数据血缘分', status: 'warning', progress: 45, nextRun: '今日 03:00', duration: '进行' },
  { name: '敏感数据扫描', status: 'pending', progress: 0, nextRun: '今日 04:00', duration: '等待' },
];

export const mockAssetCoreMetrics = [
  {
    label: '数据资产总数',
    value: '12,684',
    unit: '',
    change: '+236',
    changeRate: '+1.90%',
    trend: 'up',
    iconType: 'database',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-500/10 to-blue-600/10',
  },
  {
    label: '数据存储总量',
    value: '313.4',
    unit: 'TB',
    change: '+9.8 TB',
    changeRate: '+3.23%',
    trend: 'up',
    iconType: 'server',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-500/10 to-pink-600/10',
  },
  {
    label: '已接入数据源',
    value: '12',
    unit: '',
    change: '+1',
    changeRate: '+9.09%',
    trend: 'up',
    iconType: 'link',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-500/10 to-teal-600/10',
  },
  {
    label: '资产覆盖',
    value: '89.1',
    unit: '%',
    change: '+2.8%',
    changeRate: '+3.24%',
    trend: 'up',
    iconType: 'shield',
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-500/10 to-orange-600/10',
  },
];

export const mockAssetLayerDistribution = [
  { name: 'ODS', label: '原始数据源', count: 4028, percent: 31.8, color: 'from-blue-500 to-cyan-500', textColor: 'text-cyan-400' },
  { name: 'DWD', label: '明细数据源', count: 3812, percent: 30.1, color: 'from-purple-500 to-pink-500', textColor: 'text-purple-400' },
  { name: 'DWS', label: '汇总数据层', count: 2536, percent: 20.0, color: 'from-emerald-500 to-teal-500', textColor: 'text-emerald-400' },
  { name: 'ADS', label: '应用数据源', count: 1764, percent: 13.9, color: 'from-amber-500 to-orange-500', textColor: 'text-amber-400' },
  { name: 'DIM', label: '维度数据源', count: 544, percent: 4.3, color: 'from-rose-500 to-red-500', textColor: 'text-rose-400' },
];

export const mockAssetBusinessDomains = [
  { name: '交易域', count: 3028, percent: 23.9, growth: '+7.6%', color: 'bg-cyan-500' },
  { name: '用户域', count: 2684, percent: 21.2, growth: '+6.4%', color: 'bg-purple-500' },
  { name: '商品牌', count: 2068, percent: 16.3, growth: '+4.1%', color: 'bg-emerald-500' },
  { name: '营销域', count: 1586, percent: 12.5, growth: '+9.8%', color: 'bg-amber-500' },
  { name: '财务域', count: 1240, percent: 9.8, growth: '+3.2%', color: 'bg-rose-500' },
  { name: '风控域', count: 986, percent: 7.8, growth: '+11.6%', color: 'bg-blue-500' },
  { name: '物流', count: 704, percent: 5.5, growth: '+5.1%', color: 'bg-indigo-500' },
  { name: '其他', count: 388, percent: 3.1, growth: '+1.8%', color: 'bg-slate-500' },
];

export const mockAssetDataSources = [
  { name: 'MySQL', type: '关系型数据库', count: 2, tables: 372, status: 'healthy', icon: '🐬', color: 'from-blue-500 to-cyan-500' },
  { name: 'Hive', type: '数据仓库', count: 1, tables: 4256, status: 'healthy', icon: '🐝', color: 'from-amber-500 to-orange-500' },
  { name: 'PostgreSQL', type: '关系型数据库', count: 2, tables: 188, status: 'warning', icon: '🐘', color: 'from-indigo-500 to-blue-500' },
  { name: 'Kafka', type: '消息队列', count: 1, tables: 128, status: 'healthy', icon: '📨', color: 'from-slate-500 to-slate-700' },
  { name: 'ClickHouse', type: 'OLAP', count: 1, tables: 89, status: 'healthy', icon: '', color: 'from-yellow-500 to-amber-500' },
  { name: 'MongoDB', type: '文档数据源', count: 1, tables: 42, status: 'healthy', icon: '🍃', color: 'from-emerald-500 to-green-500' },
  { name: 'Redis', type: '缓存', count: 1, tables: 0, status: 'healthy', icon: '🔴', color: 'from-rose-500 to-red-500' },
  { name: 'Oracle', type: '关系型数据库', count: 1, tables: 528, status: 'healthy', icon: '🟥', color: 'from-red-500 to-rose-500' },
  { name: 'Elasticsearch', type: '搜索引擎', count: 1, tables: 68, status: 'healthy', icon: '🔍', color: 'from-teal-500 to-cyan-500' },
  { name: 'Doris', type: 'OLAP', count: 1, tables: 36, status: 'warning', icon: '🌟', color: 'from-fuchsia-500 to-purple-500' },
];

export const mockAssetGrowthTrend = [
  { month: '1', value: 9730 },
  { month: '2', value: 9982 },
  { month: '3', value: 10248 },
  { month: '4', value: 10516 },
  { month: '5', value: 10822 },
  { month: '6', value: 11104 },
  { month: '7', value: 11458 },
  { month: '8', value: 11726 },
  { month: '9', value: 12012 },
  { month: '10', value: 12304 },
  { month: '11', value: 12448 },
  { month: '12', value: 12684 },
];

export const mockAssetHealthMetrics = [
  { label: '元数据完整度', value: 96.8, color: 'cyan' },
  { label: '负责人覆盖率', value: 92.4, color: 'emerald' },
  { label: '数据标准符合', value: 88.6, color: 'purple' },
  { label: '质量监控覆盖', value: 84.2, color: 'amber' },
  { label: '安全分级完成', value: 91.5, color: 'rose' },
  { label: '血缘解析率', value: 89.7, color: 'blue' },
];

export const mockAssetHotAssets = [
  { rank: 1, name: 'dwd_order_detail', layer: 'DWD', domain: '交易域', visits: 16234, owner: '王大' },
  { rank: 2, name: 'ads_sales_report', layer: 'ADS', domain: '交易域', visits: 12486, owner: '赵敏' },
  { rank: 3, name: 'dws_user_profile', layer: 'DWS', domain: '用户域', visits: 10258, owner: '李秀' },
  { rank: 4, name: 'ods_order', layer: 'ODS', domain: '交易域', visits: 9642, owner: '王大' },
  { rank: 5, name: 'dim_product_category', layer: 'DIM', domain: '商品牌', visits: 8536, owner: '陈伟' },
  { rank: 6, name: 'dwd_campaign', layer: 'DWD', domain: '营销域', visits: 7245, owner: '孙立' },
  { rank: 7, name: 'ads_risk_score', layer: 'ADS', domain: '风控域', visits: 6982, owner: '周涛' },
  { rank: 8, name: 'dwd_delivery', layer: 'DWD', domain: '物流', visits: 6124, owner: '刘畅' },
];

export const mockAssetPendingItems = [
  { type: '待审', count: 18, color: 'amber', icon: '📋' },
  { type: '待认', count: 32, color: 'cyan', icon: '🔐' },
  { type: '待补充元数据', count: 247, color: 'rose', icon: '📝' },
  { type: '待分配负责人', count: 89, color: 'purple', icon: '👤' },
];

export const mockLineageData = {
  center: 'dwd_order_detail',
  nodes: [
    // Upstream (Level -2)
    { id: 'ods_order', name: 'ods_order', cnName: '订单原始表', layer: 'ODS', level: -2, owner: '张无忌', rows: '1.2B', qualityScore: 92 },
    { id: 'ods_user', name: 'ods_user', cnName: '用户原始表', layer: 'ODS', level: -2, owner: '周芷若', rows: '50M', qualityScore: 95 },
    { id: 'ods_product', name: 'ods_product', cnName: '商品原始表', layer: 'ODS', level: -2, owner: '赵敏', rows: '2M', qualityScore: 98 },
    { id: 'ods_logistics', name: 'ods_logistics', cnName: '物流原始表', layer: 'ODS', level: -2, owner: '小昭', rows: '800M', qualityScore: 88 },

    // Upstream (Level -1)
    { id: 'dwd_user_event', name: 'dwd_user_event', cnName: '用户行为明细', layer: 'DWD', level: -1, owner: '周芷若', rows: '5.5B', qualityScore: 94 },
    { id: 'dim_user', name: 'dim_user', cnName: '用户维度表', layer: 'DIM', level: -1, owner: '周芷若', rows: '48M', qualityScore: 99 },
    { id: 'dim_product', name: 'dim_product', cnName: '商品维度表', layer: 'DIM', level: -1, owner: '赵敏', rows: '1.8M', qualityScore: 99 },

    // Center (Level 0)
    { id: 'dwd_order_detail', name: 'dwd_order_detail', cnName: '订单交易明细', layer: 'DWD', level: 0, owner: '张无忌', rows: '1.1B', qualityScore: 96 },

    // Downstream (Level 1)
    { id: 'dws_order_user_1d', name: 'dws_order_user_1d', cnName: '用户订单日汇总', layer: 'DWS', level: 1, owner: '宋青书', rows: '15M', qualityScore: 97 },
    { id: 'dws_order_shop_1d', name: 'dws_order_shop_1d', cnName: '店铺订单日汇总', layer: 'DWS', level: 1, owner: '成昆', rows: '1.2M', qualityScore: 95 },
    { id: 'dws_product_sales_1d', name: 'dws_product_sales_1d', cnName: '商品销量日汇总', layer: 'DWS', level: 1, owner: '殷离', rows: '8.5M', qualityScore: 94 },

    // Downstream (Level 2)
    { id: 'ads_sales_report', name: 'ads_sales_report', cnName: '销售经营大盘', layer: 'ADS', level: 2, owner: '灭绝师太', rows: '12K', qualityScore: 100 },
    { id: 'ads_user_profile', name: 'ads_user_profile', cnName: '用户画像宽表', layer: 'ADS', level: 2, owner: '宋青书', rows: '45M', qualityScore: 98 },
  ],
  edges: [
    { from: 'ods_order', to: 'dwd_order_detail', type: 'direct' },
    { from: 'ods_user', to: 'dim_user', type: 'transform' },
    { from: 'ods_product', to: 'dim_product', type: 'transform' },
    { from: 'dim_user', to: 'dwd_order_detail', type: 'direct' },
    { from: 'dim_product', to: 'dwd_order_detail', type: 'direct' },
    { from: 'dwd_user_event', to: 'dwd_order_detail', type: 'transform' },
    { from: 'ods_logistics', to: 'dwd_order_detail', type: 'transform' },

    { from: 'dwd_order_detail', to: 'dws_order_user_1d', type: 'aggregate' },
    { from: 'dwd_order_detail', to: 'dws_order_shop_1d', type: 'aggregate' },
    { from: 'dwd_order_detail', to: 'dws_product_sales_1d', type: 'aggregate' },

    { from: 'dws_order_user_1d', to: 'ads_user_profile', type: 'transform' },
    { from: 'dws_order_user_1d', to: 'ads_sales_report', type: 'aggregate' },
    { from: 'dws_order_shop_1d', to: 'ads_sales_report', type: 'aggregate' },
    { from: 'dws_product_sales_1d', to: 'ads_sales_report', type: 'aggregate' },
  ],
  fields: [
    { from: 'ods_order.order_id', to: 'dwd_order_detail.order_id', logic: '直接映射', status: 'normal' },
    { from: 'ods_order.amount', to: 'dwd_order_detail.pay_amount', logic: 'COALESCE(amount, 0)', status: 'warning' },
    { from: 'ods_user.user_name', to: 'dwd_order_detail.buyer_name', logic: '关联获取', status: 'normal' },
    { from: 'ods_product.price', to: 'dwd_order_detail.unit_price', logic: '关联获取', status: 'normal' },
    { from: 'dwd_user_event.last_visit', to: 'dwd_order_detail.last_active_time', logic: 'MAX(visit_time)', status: 'normal' },
  ]
};

export const mockMapData = {
  domains: [
    { id: 'trade', name: '交易域', color: '#06b6d4', assetCount: 3028, hotCount: 15 },
    { id: 'user', name: '用户域', color: '#a855f7', assetCount: 2684, hotCount: 12 },
    { id: 'product', name: '商品域', color: '#10b981', assetCount: 2068, hotCount: 8 },
    { id: 'marketing', name: '营销域', color: '#f59e0b', assetCount: 1586, hotCount: 6 },
    { id: 'finance', name: '财务域', color: '#f43f5e', assetCount: 1240, hotCount: 4 },
  ],
  layers: [
    { id: 'ODS', name: 'ODS', color: '#3b82f6', count: 4028 },
    { id: 'DWD', name: 'DWD', color: '#06b6d4', count: 3812 },
    { id: 'DWS', name: 'DWS', color: '#a855f7', count: 2536 },
    { id: 'ADS', name: 'ADS', color: '#ec4899', count: 1764 },
    { id: 'DIM', name: 'DIM', color: '#f59e0b', count: 544 },
  ],
  assets: [
    { id: 'ods_order', name: 'ods_order', cnName: '订单原始表', domain: 'trade', layer: 'ODS', rowCount: 1200000000, qualityScore: 92, hot: true },
    { id: 'ods_user', name: 'ods_user', cnName: '用户原始表', domain: 'user', layer: 'ODS', rowCount: 50000000, qualityScore: 95, hot: true },
    { id: 'dwd_order_detail', name: 'dwd_order_detail', cnName: '订单交易明细', domain: 'trade', layer: 'DWD', rowCount: 1100000000, qualityScore: 96, hot: true },
    { id: 'dws_user_profile', name: 'dws_user_profile', cnName: '用户画像', domain: 'user', layer: 'DWS', rowCount: 45000000, qualityScore: 98, hot: true },
    { id: 'dim_product', name: 'dim_product', cnName: '商品维度', domain: 'product', layer: 'DIM', rowCount: 1800000, qualityScore: 99, hot: false },
    { id: 'ads_sales_report', name: 'ads_sales_report', cnName: '销售报表', domain: 'finance', layer: 'ADS', rowCount: 12000, qualityScore: 100, hot: true },
    { id: 'dwd_campaign', name: 'dwd_campaign', cnName: '活动明细', domain: 'marketing', layer: 'DWD', rowCount: 5000000, qualityScore: 88, hot: false },
  ],
  datacenters: [
    { id: 'dc-bj', name: '北京中心', label: '华北核心', assets: 5600, status: 'healthy' },
    { id: 'dc-sh', name: '上海中心', label: '华东骨干', assets: 3200, status: 'healthy' },
    { id: 'dc-sz', name: '深圳中心', label: '华南灾备', assets: 2100, status: 'warning' },
    { id: 'dc-cd', name: '成都节点', label: '边缘计算', assets: 850, status: 'healthy' },
    { id: 'dc-hz', name: '杭州节点', label: '西部中心', assets: 934, status: 'healthy' },
  ]
};

export const mockAllDataSources = [
  {
    id: "ds-001", name: "prod_order_db", type: "MySQL", category: "关系型", status: "online",
    host: "10.0.1.10", port: 3306, database: "ecommerce_order", version: "8.0.32",
    owner: "张无忌", department: "交易研发组", env: "生产",
    tableCount: 128, storageGB: 1536, qps: 12500, latencyMs: 2,
    lastSyncTime: "2026-04-18 10:00:00", createTime: "2024-01-15 09:30:00",
    description: "核心交易库，包含订单、支付、履约等核心业务数据",
    tags: ["核心资产", "高频访问"],
  },
  {
    id: "ds-002", name: "prod_user_db", type: "PostgreSQL", category: "关系型", status: "online",
    host: "10.0.1.12", port: 5432, database: "user_center", version: "15.3",
    owner: "周芷若", department: "用户中心", env: "生产",
    tableCount: 86, storageGB: 850, qps: 8500, latencyMs: 3,
    lastSyncTime: "2026-04-18 09:30:00", createTime: "2024-02-20 14:15:00",
    description: "用户中心主库，存储用户基础信息、鉴权、等级数据",
    tags: ["核心资产", "敏感数据"],
  },
  {
    id: "ds-003", name: "dw_hive_cluster", type: "Hive", category: "大数据", status: "syncing",
    host: "10.0.5.100", port: 10000, database: "default", version: "3.1.3",
    owner: "赵敏", department: "数据平台组", env: "生产",
    tableCount: 12580, storageGB: 256000, qps: 150, latencyMs: 1200,
    lastSyncTime: "2026-04-18 08:00:00", createTime: "2023-11-05 10:00:00",
    description: "离线数仓集群，承载全量离线计算和存储",
    tags: ["离线计算", "海量存储"],
  },
  {
    id: "ds-004", name: "realtime_clickhouse", type: "ClickHouse", category: "OLAP", status: "online",
    host: "10.0.6.20", port: 8123, database: "analytics", version: "23.8",
    owner: "小昭", department: "数据分析组", env: "生产",
    tableCount: 45, storageGB: 12500, qps: 3200, latencyMs: 15,
    lastSyncTime: "2026-04-18 10:15:00", createTime: "2024-05-10 11:20:00",
    description: "实时多维分析集群，提供秒级大表查询能力",
    tags: ["实时分析", "高性能"],
  },
  {
    id: "ds-005", name: "log_kafka_cluster", type: "Kafka", category: "消息队列", status: "online",
    host: "10.0.4.50", port: 9092, database: "N/A", version: "3.5.0",
    owner: "殷离", department: "基础架构组", env: "生产",
    tableCount: 0, storageGB: 5200, qps: 85000, latencyMs: 1,
    lastSyncTime: "2026-04-18 10:20:00", createTime: "2024-01-08 16:45:00",
    description: "统一日志流处理集群，承接业务埋点和系统日志",
    tags: ["高吞吐", "实时流"],
  },
  {
    id: "ds-006", name: "risk_redis_cluster", type: "Redis", category: "NoSQL", status: "warning",
    host: "10.0.7.15", port: 6379, database: "0", version: "7.0",
    owner: "灭绝师太", department: "风控中心", env: "生产",
    tableCount: 0, storageGB: 128, qps: 150000, latencyMs: 0.5,
    lastSyncTime: "2026-04-18 10:25:00", createTime: "2024-03-12 09:10:00",
    description: "风控特征实时缓存集群，当前内存使用率告警",
    tags: ["低延迟", "风控特征"],
  },
  {
    id: "ds-007", name: "dev_order_db", type: "MySQL", category: "关系型", status: "offline",
    host: "172.16.1.10", port: 3306, database: "ecommerce_order", version: "8.0.32",
    owner: "宋青书", department: "交易研发组", env: "开发",
    tableCount: 125, storageGB: 50, qps: 0, latencyMs: 0,
    lastSyncTime: "2026-04-15 18:00:00", createTime: "2024-01-20 10:00:00",
    description: "交易库开发环境，已暂停使用",
    tags: ["测试环境"],
  },
  {
    id: "ds-008", name: "search_es_cluster", type: "Elasticsearch", category: "搜索引擎", status: "online",
    host: "10.0.8.30", port: 9200, database: "N/A", version: "8.9.0",
    owner: "成昆", department: "搜索推荐组", env: "生产",
    tableCount: 12, storageGB: 3500, qps: 18000, latencyMs: 12,
    lastSyncTime: "2026-04-18 10:28:00", createTime: "2024-06-01 14:30:00",
    description: "商品搜索与日志检索聚合集群",
    tags: ["全文检索", "倒排索引"],
  },
];

export const mockStandardDefinitions = [
  { id: "std-001", code: "STD_USER_ID", name: "用户唯一标识", domain: "用户域", type: "STRING", length: 32, status: "published", owner: "张无忌", updateTime: "2026-04-10", description: "全系统唯一的用户ID，采用UUID格式" },
  { id: "std-002", code: "STD_PHONE_NUM", name: "手机号码", domain: "用户域", type: "STRING", length: 11, status: "published", owner: "周芷若", updateTime: "2026-04-12", description: "中国大陆11位手机号码，需加密存储" },
  { id: "std-003", code: "STD_ORDER_ID", name: "订单流水号", domain: "交易域", type: "STRING", length: 64, status: "draft", owner: "赵敏", updateTime: "2026-04-17", description: "订单全局唯一单号，按时间戳+雪花算法生成" },
  { id: "std-004", code: "STD_AMT_CNY", name: "人民币金额", domain: "财务域", type: "DECIMAL", length: "18,4", status: "published", owner: "谢逊", updateTime: "2026-03-25", description: "标准金额格式，保留4位小数，单位元" },
  { id: "std-005", code: "STD_GENDER", name: "性别代码", domain: "用户域", type: "TINYINT", length: 1, status: "published", owner: "张三丰", updateTime: "2026-02-10", description: "0-未知, 1-男, 2-女，遵循GB/T 2261.1-2003" },
  { id: "std-006", code: "STD_PROD_CAT", name: "商品类目", domain: "商品域", type: "INT", length: 11, status: "reviewing", owner: "灭绝师太", updateTime: "2026-04-18", description: "商品四级类目树ID" },
  { id: "std-007", code: "STD_IP_ADDR", name: "IP地址", domain: "安全域", type: "STRING", length: 64, status: "offline", owner: "韦一笑", updateTime: "2025-12-01", description: "废弃，使用新的IPv4/IPv6兼容标准" }
];

export const mockStandardMappings = [
  { id: "map-001", standardCode: "STD_USER_ID", standardName: "用户唯一标识", standardType: "STRING", standardLength: 32, database: "ecommerce_user", tableName: "dwd_user_info_df", columnName: "user_id", columnType: "varchar", columnLength: 32, matchScore: 100, status: "mapped", creator: "张无忌", updateTime: "2026-04-18" },
  { id: "map-002", standardCode: "STD_PHONE_NUM", standardName: "手机号码", standardType: "STRING", standardLength: 11, database: "ecommerce_user", tableName: "dwd_user_info_df", columnName: "mobile", columnType: "varchar", columnLength: 20, matchScore: 85, status: "suggested", creator: "系统推荐", updateTime: "2026-04-18" },
  { id: "map-003", standardCode: "STD_ORDER_ID", standardName: "订单流水号", standardType: "STRING", standardLength: 64, database: "ecommerce_order", tableName: "dwd_trade_order_df", columnName: "order_no", columnType: "varchar", columnLength: 64, matchScore: 95, status: "mapped", creator: "赵敏", updateTime: "2026-04-17" },
  { id: "map-004", standardCode: "STD_AMT_CNY", standardName: "人民币金额", standardType: "DECIMAL", standardLength: "18,4", database: "ecommerce_order", tableName: "dwd_trade_order_df", columnName: "total_amount", columnType: "decimal", columnLength: "18,4", matchScore: 100, status: "mapped", creator: "谢逊", updateTime: "2026-03-25" },
  { id: "map-005", standardCode: "STD_GENDER", standardName: "性别代码", standardType: "TINYINT", standardLength: 1, database: "ecommerce_user", tableName: "dwd_user_info_df", columnName: "gender_code", columnType: "int", columnLength: 11, matchScore: 70, status: "suggested", creator: "系统推荐", updateTime: "2026-04-18" },
  { id: "map-006", standardCode: "STD_PROD_CAT", standardName: "商品类目", standardType: "INT", standardLength: 11, database: "ecommerce_product", tableName: "dim_category_info", columnName: "cat_id", columnType: "bigint", columnLength: 20, matchScore: 60, status: "rejected", creator: "灭绝师太", updateTime: "2026-04-18" }
];

export const mockStandardEvalData = {
  overview: {
    overallScore: 86.5,
    totalStandards: 1250,
    mappedStandards: 980,
    compliantTables: 450,
    totalTables: 800,
  },
  domainScores: [
    { name: "用户域", score: 92 },
    { name: "交易域", score: 88 },
    { name: "商品域", score: 85 },
    { name: "财务域", score: 95 },
    { name: "供应链域", score: 78 },
    { name: "营销域", score: 72 },
  ],
  trendData: [
    { date: "04-12", score: 82.1, compliance: 55 },
    { date: "04-13", score: 83.5, compliance: 58 },
    { date: "04-14", score: 84.2, compliance: 61 },
    { date: "04-15", score: 84.8, compliance: 63 },
    { date: "04-16", score: 85.5, compliance: 65 },
    { date: "04-17", score: 86.0, compliance: 68 },
    { date: "04-18", score: 86.5, compliance: 71 },
  ],
  issueList: [
    { id: "iss-1", type: "type_mismatch", standardName: "手机号码", tableName: "dwd_user_info", columnName: "mobile", issueDesc: "数据类型不符，标准为VARCHAR(11)，实际为BIGINT", severity: "high", owner: "张无忌", status: "pending" },
    { id: "iss-2", type: "length_overflow", standardName: "商品名称", tableName: "dim_product", columnName: "prod_name", issueDesc: "字段长度不符，标准为VARCHAR(100)，实际为VARCHAR(50)", severity: "medium", owner: "灭绝师太", status: "processing" },
    { id: "iss-3", type: "not_mapped", standardName: "订单状态", tableName: "dwd_trade_order", columnName: "order_status", issueDesc: "核心业务表未关联标准定义", severity: "high", owner: "赵敏", status: "pending" },
    { id: "iss-4", type: "naming_violation", standardName: "创建时间", tableName: "dws_user_act_daily", columnName: "createTime", issueDesc: "命名不规范，标准推荐使用 create_time", severity: "low", owner: "周芷若", status: "ignored" },
    { id: "iss-5", type: "type_mismatch", standardName: "支付金额", tableName: "dwd_pay_record", columnName: "pay_amt", issueDesc: "数据类型精度不符，标准为DECIMAL(18,4)，实际为DOUBLE", severity: "high", owner: "谢逊", status: "pending" }
  ]
};

export const mockDataDictCategories = [
  { id: "cat-1", name: "用户与账户", code: "USER_DOMAIN", parentId: null },
  { id: "cat-1-1", name: "证件类型", code: "DICT_ID_TYPE", parentId: "cat-1" },
  { id: "cat-1-2", name: "用户性别", code: "DICT_GENDER", parentId: "cat-1" },
  { id: "cat-1-3", name: "账户状态", code: "DICT_ACCT_STATUS", parentId: "cat-1" },
  { id: "cat-2", name: "商品与类目", code: "PROD_DOMAIN", parentId: null },
  { id: "cat-2-1", name: "商品状态", code: "DICT_PROD_STATUS", parentId: "cat-2" },
  { id: "cat-2-2", name: "品牌产地", code: "DICT_BRAND_ORIGIN", parentId: "cat-2" },
  { id: "cat-3", name: "交易与订单", code: "TRADE_DOMAIN", parentId: null },
  { id: "cat-3-1", name: "订单状态", code: "DICT_ORDER_STATUS", parentId: "cat-3" },
  { id: "cat-3-2", name: "支付方式", code: "DICT_PAY_METHOD", parentId: "cat-3" },
  { id: "cat-4", name: "通用基础", code: "COMMON_DOMAIN", parentId: null },
  { id: "cat-4-1", name: "是否标识", code: "DICT_YES_NO", parentId: "cat-4" },
];

export const mockDataDictItems: Record<string, any[]> = {
  "DICT_GENDER": [
    { id: "itm-1", dictCode: "DICT_GENDER", itemValue: "0", itemLabel: "未知", sortOrder: 1, status: "active", remark: "用户未填写或无法推断" },
    { id: "itm-2", dictCode: "DICT_GENDER", itemValue: "1", itemLabel: "男", sortOrder: 2, status: "active", remark: "男性" },
    { id: "itm-3", dictCode: "DICT_GENDER", itemValue: "2", itemLabel: "女", sortOrder: 3, status: "active", remark: "女性" },
  ],
  "DICT_ORDER_STATUS": [
    { id: "itm-4", dictCode: "DICT_ORDER_STATUS", itemValue: "10", itemLabel: "待付款", sortOrder: 1, status: "active", remark: "订单已创建，等待用户支付" },
    { id: "itm-5", dictCode: "DICT_ORDER_STATUS", itemValue: "20", itemLabel: "已付款", sortOrder: 2, status: "active", remark: "用户支付成功，等待发货" },
    { id: "itm-6", dictCode: "DICT_ORDER_STATUS", itemValue: "30", itemLabel: "已发货", sortOrder: 3, status: "active", remark: "商品已发出" },
    { id: "itm-7", dictCode: "DICT_ORDER_STATUS", itemValue: "40", itemLabel: "已完成", sortOrder: 4, status: "active", remark: "用户确认收货或系统自动确认" },
    { id: "itm-8", dictCode: "DICT_ORDER_STATUS", itemValue: "90", itemLabel: "已取消", sortOrder: 5, status: "active", remark: "用户主动取消或超时未支付取消" },
    { id: "itm-9", dictCode: "DICT_ORDER_STATUS", itemValue: "99", itemLabel: "售后退款", sortOrder: 6, status: "inactive", remark: "历史状态，现已拆分至售后状态机" },
  ],
  "DICT_YES_NO": [
    { id: "itm-10", dictCode: "DICT_YES_NO", itemValue: "Y", itemLabel: "是", sortOrder: 1, status: "active", remark: "表示肯定、启用、有效等" },
    { id: "itm-11", dictCode: "DICT_YES_NO", itemValue: "N", itemLabel: "否", sortOrder: 2, status: "active", remark: "表示否定、停用、无效等" },
  ],
  "DICT_PAY_METHOD": [
    { id: "itm-12", dictCode: "DICT_PAY_METHOD", itemValue: "wxpay", itemLabel: "微信支付", sortOrder: 1, status: "active", remark: "" },
    { id: "itm-13", dictCode: "DICT_PAY_METHOD", itemValue: "alipay", itemLabel: "支付宝", sortOrder: 2, status: "active", remark: "" },
    { id: "itm-14", dictCode: "DICT_PAY_METHOD", itemValue: "unionpay", itemLabel: "云闪付", sortOrder: 3, status: "active", remark: "" },
    { id: "itm-15", dictCode: "DICT_PAY_METHOD", itemValue: "applepay", itemLabel: "Apple Pay", sortOrder: 4, status: "active", remark: "" },
    { id: "itm-16", dictCode: "DICT_PAY_METHOD", itemValue: "balance", itemLabel: "余额支付", sortOrder: 5, status: "active", remark: "" },
  ]
};

export const mockCodeSets = [
  { id: "cs-001", code: "GB_T_2261_1", name: "人的性别代码", source: "国标(GB/T 2261.1-2003)", type: "national", status: "published", itemCount: 4, updateTime: "2026-01-10", creator: "系统内置", isBuiltIn: true },
  { id: "cs-002", code: "GB_T_3304", name: "中国各民族名称的罗马字母拼写法和代码", source: "国标(GB/T 3304-1991)", type: "national", status: "published", itemCount: 5, updateTime: "2026-01-10", creator: "系统内置", isBuiltIn: true },
  { id: "cs-003", code: "JR_T_0002", name: "银行行业标准_货币代码", source: "行标(JR/T 0002)", type: "industry", status: "published", itemCount: 15, updateTime: "2026-02-15", creator: "张无忌", isBuiltIn: false },
  { id: "cs-004", code: "ENT_DEPT", name: "企业内部部门代码", source: "内部自建", type: "enterprise", status: "draft", itemCount: 3, updateTime: "2026-04-18", creator: "赵敏", isBuiltIn: false },
  { id: "cs-005", code: "GB_T_2260", name: "中华人民共和国行政区划代码", source: "国标(GB/T 2260)", type: "national", status: "published", itemCount: 4, updateTime: "2026-03-01", creator: "系统内置", isBuiltIn: true }
];

export const mockCodeValues: Record<string, any[]> = {
  "GB_T_2261_1": [
    { id: "cv-1", value: "0", label: "未知的性别", remark: "未说明的性别" },
    { id: "cv-2", value: "1", label: "男性", remark: "" },
    { id: "cv-3", value: "2", label: "女性", remark: "" },
    { id: "cv-4", value: "9", label: "未说明的性别", remark: "" }
  ],
  "GB_T_3304": [
    { id: "cv-51", value: "01", label: "汉族", remark: "Han" },
    { id: "cv-52", value: "02", label: "蒙古族", remark: "Mongol" },
    { id: "cv-53", value: "03", label: "回族", remark: "Hui" },
    { id: "cv-54", value: "04", label: "藏族", remark: "Zang" },
    { id: "cv-55", value: "05", label: "维吾尔族", remark: "Uyghur" }
  ],
  "JR_T_0002": [
    { id: "cv-5", value: "CNY", label: "人民币", remark: "中国法定货币" },
    { id: "cv-6", value: "USD", label: "美元", remark: "美国法定货币" },
    { id: "cv-7", value: "EUR", label: "欧元", remark: "欧元区法定货币" },
    { id: "cv-8", value: "HKD", label: "港元", remark: "中国香港法定货币" },
    { id: "cv-9", value: "GBP", label: "英镑", remark: "英国法定货币" }
  ],
  "ENT_DEPT": [
    { id: "cv-61", value: "D001", label: "总裁办", remark: "公司最高管理部门" },
    { id: "cv-62", value: "D002", label: "研发中心", remark: "负责产品研发" },
    { id: "cv-63", value: "D003", label: "市场部", remark: "负责市场营销与推广" }
  ],
  "GB_T_2260": [
    { id: "cv-71", value: "110000", label: "北京市", remark: "直辖市" },
    { id: "cv-72", value: "310000", label: "上海市", remark: "直辖市" },
    { id: "cv-73", value: "440000", label: "广东省", remark: "省级行政区" },
    { id: "cv-74", value: "330000", label: "浙江省", remark: "省级行政区" }
  ]
};

export const mockModelSyncLogs = [
  {
    id: "log-1",
    modelId: "mod-1",
    syncTime: "2026-04-18 10:05:00",
    status: "success",
    operator: "张无忌",
    details: "CREATE TABLE IF NOT EXISTS `ods_user_info_di` (\n  `id` VARCHAR(64) NOT NULL COMMENT '用户ID',\n  `name` VARCHAR(100) NOT NULL COMMENT '姓名',\n  `age` INT COMMENT '年龄'\n) COMMENT='用户基础信息同步表';"
  },
  {
    id: "log-2",
    modelId: "mod-5",
    syncTime: "2026-04-18 09:30:00",
    status: "failed",
    operator: "张三丰",
    details: "Error: Connection timeout to data source ds-003.\nCaused by: Socket read timeout (30000ms)."
  },
  {
    id: "log-3",
    modelId: "mod-5",
    syncTime: "2026-04-18 10:10:00",
    status: "success",
    operator: "张三丰",
    details: "CREATE TABLE IF NOT EXISTS `dim_date_info` (\n  `date_id` VARCHAR(10) NOT NULL COMMENT '日期ID',\n  `date_name` VARCHAR(20) NOT NULL COMMENT '日期名称',\n  `is_weekend` TINYINT NOT NULL COMMENT '是否周末',\n  `is_holiday` TINYINT NOT NULL COMMENT '是否节假日'\n) COMMENT='全局通用的日期维度表';"
  }
];

export const mockDevelopmentModels = [
  {
    id: "mod-1",
    name: "ods_user_info_di",
    cnName: "用户基础信息同步表",
    layer: "ODS",
    domain: "用户域",
    status: "published",
    owner: "张无忌",
    updateTime: "2026-04-18 10:00:00",
    dataSourceId: "ds-001",
    partitionType: "time",
    lifecycle: 365,
    syncStatus: "synced",
    description: "从业务库同步的用户基础信息全量数据",
    fields: [
      { name: "user_id", type: "BIGINT", description: "用户唯一标识", isPrimary: true, isNullable: false, standardId: "std-001" },
      { name: "user_name", type: "VARCHAR(50)", description: "用户名", isPrimary: false, isNullable: false, standardId: "" },
      { name: "gender", type: "TINYINT", description: "性别", isPrimary: false, isNullable: true, standardId: "std-005" },
      { name: "create_time", type: "DATETIME", description: "创建时间", isPrimary: false, isNullable: false, standardId: "" }
    ]
  },
  {
    id: "mod-2",
    name: "dwd_trade_order_detail_di",
    cnName: "交易订单明细表",
    layer: "DWD",
    domain: "交易域",
    status: "published",
    owner: "赵敏",
    updateTime: "2026-04-19 14:30:00",
    dataSourceId: "ds-003",
    partitionType: "time",
    lifecycle: 1095,
    syncStatus: "unsynced",
    description: "订单明细宽表",
    fields: [
      { name: "order_id", type: "BIGINT", description: "订单ID", isPrimary: true, isNullable: false, standardId: "std-003" },
      { name: "buyer_id", type: "BIGINT", description: "买家ID", isPrimary: false, isNullable: false, standardId: "std-001" },
      { name: "total_amount", type: "DECIMAL(10,2)", description: "订单总金额", isPrimary: false, isNullable: false, standardId: "std-004" },
      { name: "order_status", type: "TINYINT", description: "订单状态", isPrimary: false, isNullable: false, standardId: "" }
    ]
  },
  {
    id: "mod-3",
    name: "dws_user_trade_1d",
    cnName: "用户交易日汇总",
    layer: "DWS",
    domain: "交易域",
    status: "draft",
    owner: "周芷若",
    updateTime: "2026-04-19 15:45:00",
    dataSourceId: "ds-003",
    partitionType: "time",
    lifecycle: 3650,
    description: "用户交易每日汇总指标",
    fields: [
      { name: "user_id", type: "BIGINT", description: "用户ID", isPrimary: true, isNullable: false, standardId: "std-001" },
      { name: "dt", type: "VARCHAR(10)", description: "业务日期", isPrimary: true, isNullable: false, standardId: "" },
      { name: "order_count_1d", type: "INT", description: "近1日下单次数", isPrimary: false, isNullable: true, standardId: "" },
      { name: "order_amount_1d", type: "DECIMAL(12,2)", description: "近1日下单金额", isPrimary: false, isNullable: true, standardId: "std-004" }
    ]
  },
  {
    id: "mod-4",
    name: "ads_sales_dashboard",
    cnName: "销售经营大盘",
    layer: "ADS",
    domain: "财务域",
    status: "published",
    owner: "灭绝师太",
    updateTime: "2026-04-10 09:15:00",
    dataSourceId: "ds-004",
    partitionType: "none",
    lifecycle: -1,
    description: "高管看板核心销售数据",
    fields: [
      { name: "dt", type: "VARCHAR(10)", description: "业务日期", isPrimary: true, isNullable: false, standardId: "" },
      { name: "gmv", type: "DECIMAL(15,2)", description: "总交易额", isPrimary: false, isNullable: false, standardId: "std-004" },
      { name: "active_buyers", type: "INT", description: "活跃买家数", isPrimary: false, isNullable: false, standardId: "" }
    ]
  },
  {
    id: "mod-5",
    name: "dim_date_info",
    cnName: "日期维度表",
    layer: "DIM",
    domain: "通用域",
    status: "published",
    owner: "张三丰",
    updateTime: "2026-04-18 10:00:00",
    dataSourceId: "ds-003",
    partitionType: "none",
    lifecycle: -1,
    syncStatus: "synced",
    description: "全局通用的日期维度表，包含节假日、工作日等日历信息",
    fields: [
      { name: "date_id", type: "VARCHAR(10)", description: "日期ID", isPrimary: true, isNullable: false, standardId: "" },
      { name: "date_name", type: "VARCHAR(20)", description: "日期名称", isPrimary: false, isNullable: false, standardId: "" },
      { name: "is_weekend", type: "TINYINT", description: "是否周末", isPrimary: false, isNullable: false, standardId: "" },
      { name: "is_holiday", type: "TINYINT", description: "是否节假日", isPrimary: false, isNullable: false, standardId: "" }
    ]
  }
];

export interface Approval {
  id: string;
  moduleType: 'data_model' | 'data_standard' | 'code_value' | 'script';
  title: string;
  applicant: string;
  applyTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processTime?: string;
  processor?: string;
  payload: any;
}

export const mockApprovals: Approval[] = [
  {
    id: "app-001",
    moduleType: "data_model",
    title: "申请同步物理表: ods_user_info_di",
    applicant: "张无忌",
    applyTime: "2026-04-19 10:00:00",
    reason: "新增了两个字段，需要同步物理表",
    status: "pending",
    payload: {
      modelId: "mod-1",
      modelName: "ods_user_info_di",
      ddl: "CREATE TABLE IF NOT EXISTS `ods_user_info_di` (...);"
    }
  },
  {
    id: "app-002",
    moduleType: "data_standard",
    title: "申请发布数据标准: 性别代码",
    applicant: "赵敏",
    applyTime: "2026-04-19 11:30:00",
    reason: "业务补充了未知性别的定义",
    status: "pending",
    payload: {
      standardId: "std-001",
      diff: "新增码值: [0-未知]"
    }
  },
  {
    id: "app-003",
    moduleType: "code_value",
    title: "申请发布码值字典: 中国各民族名称",
    applicant: "周芷若",
    applyTime: "2026-04-19 14:20:00",
    reason: "校对国标新增两项",
    status: "approved",
    processTime: "2026-04-19 15:00:00",
    processor: "管理员",
    payload: {
      codeSetId: "cs-002",
      diff: "更新项: +2"
    }
  }
];

export const mockScripts = [
  {
    id: 'folder-1',
    name: '数据清洗',
    type: 'folder',
    parentId: null,
    updateTime: '2026-04-19 10:00:00',
  },
  {
    id: 'script-1',
    name: 'user_data_clean', // 不带后缀
    type: 'sql',
    parentId: 'folder-1',
    content: 'SELECT * FROM users;',
    status: 'draft',
    version: 1,
    dataSourceId: 'ds-1',
    dataSourceConfig: { queue: 'default' },
    updateTime: '2026-04-19 10:05:00',
  }
];

export const mockScriptVersions = [
  {
    id: 'v-1',
    scriptId: 'script-1',
    version: 1,
    content: 'SELECT * FROM users;',
    createTime: '2026-04-19 10:05:00',
    creator: 'Admin',
    comment: 'Initial version',
  }
];
