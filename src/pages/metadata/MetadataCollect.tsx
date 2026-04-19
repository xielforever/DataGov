import { useState, useEffect, useRef } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CollectTask {
  id: string;
  name: string;
  dataSource: string;
  dsType: 'MySQL' | 'Hive' | 'Kafka' | 'ClickHouse' | 'PostgreSQL' | 'MongoDB' | 'Elasticsearch' | 'Doris';
  scope: string;           // 采集范围：全库 / 指定表 / 指定库 */
  scopeDetail: string;
  collectType: 'full' | 'incremental';
  schedule: string;        // cron 描述
  status: 'running' | 'success' | 'failed' | 'waiting' | 'paused';
  lastRun: string;
  nextRun: string;
  duration: string;
  tableCount: number;
  fieldCount: number;
  progress?: number;       // 0-100，仅运行中任务
  owner: string;
  createdAt: string;
  tags: string[];
}

interface CollectRecord {
  id: string;
  taskId: string;
  taskName: string;
  dataSource: string;
  dsType: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'success' | 'failed' | 'running';
  tableCount: number;
  fieldCount: number;
  newTables: number;
  updatedTables: number;
  errorMsg?: string;
  triggerType: 'schedule' | 'manual';
}

interface CollectRule {
  id: string;
  name: string;
  type: 'include' | 'exclude';
  pattern: string;
  scope: 'table' | 'field' | 'database';
  enabled: boolean;
  description: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_TASKS: CollectTask[] = [
  {
    id: 't1', name: '交易库全量元数据采集集', dataSource: 'prod-mysql-trade',
    dsType: 'MySQL', scope: '全库', scopeDetail: 'trade_db (42 张表)',
    collectType: 'full', schedule: '每天 02:00', status: 'running',
    lastRun: '今天 02:00', nextRun: '明天 02:00', duration: '12分34秒',
    tableCount: 42, fieldCount: 386, progress: 68,
    owner: '张三', createdAt: '2024-03-01', tags: ['核心', '生产'],
  },
  {
      id: 't2', name: '数仓增量元数据采集集', dataSource: 'prod-hive-warehouse',
      dsType: 'Hive', scope: '指定表', scopeDetail: 'ods_db / dwd_db / dws_db',
      collectType: 'incremental', schedule: '每小时', status: 'success',
    lastRun: '1小时前', nextRun: '30分钟前', duration: '3分2秒',
    tableCount: 285, fieldCount: 2847, owner: '赵敏',
    createdAt: '2024-02-15', tags: ['核心', '增量'],
  },
  {
      id: 't3', name: 'OLAP引擎元数据采集集', dataSource: 'prod-clickhouse-olap',
      dsType: 'ClickHouse', scope: '全库', scopeDetail: 'analytics_db (18 张表)',
    collectType: 'full', schedule: '每天 04:00', status: 'success',
    lastRun: '今天 04:08', nextRun: '明天 04:00', duration: '1分5秒',
    tableCount: 18, fieldCount: 214, owner: '林峰',
    createdAt: '2024-03-10', tags: ['OLAP'],
  },
  {
    id: 't4', name: '用户中心元数据采集集', dataSource: 'prod-pg-user',
    dsType: 'PostgreSQL', scope: '指定表', scopeDetail: 'user_*, member_* (28 张表)',
    collectType: 'incremental', schedule: '每小时', status: 'failed',
    lastRun: '2小时前', nextRun: '30分钟前', duration: '0分3秒',
    tableCount: 28, fieldCount: 312, owner: '张三丰',
    createdAt: '2024-01-20', tags: ['用户域'],
  },
  {
    id: 't5', name: '内容存储元数据采集集', dataSource: 'prod-mongo-content',
    dsType: 'MongoDB', scope: '全库', scopeDetail: 'content_db (11 个集合)',
    collectType: 'full', schedule: '每天 03:30', status: 'paused',
    lastRun: '昨天 03:45', nextRun: '暂停中', duration: '2分钟',
    tableCount: 11, fieldCount: 98, owner: '王芳',
    createdAt: '2024-04-01', tags: ['内容域'],
  },
  {
    id: 't6', name: '搜索引擎索引采集', dataSource: 'prod-es-search',
    dsType: 'Elasticsearch', scope: '全库', scopeDetail: 'search_* (15 个索引)',
    collectType: 'full', schedule: '每天 05:00', status: 'waiting',
    lastRun: '昨天 05:02', nextRun: '今天 05:00', duration: '4分0秒',
    tableCount: 15, fieldCount: 187, owner: '陈晓',
    createdAt: '2024-04-05', tags: ['搜索'],
  },
  {
    id: 't7', name: '实时数仓元数据采集集', dataSource: 'prod-doris-realtime',
    dsType: 'Doris', scope: '指定表', scopeDetail: 'realtime_db (22 张表)',
    collectType: 'incremental', schedule: '每30分钟', status: 'success',
    lastRun: '25分钟前', nextRun: '5分钟前', duration: '0分8秒',
    tableCount: 22, fieldCount: 268, owner: '林峰',
    createdAt: '2024-04-10', tags: ['实时', '核心'],
  },
  {
      id: 't8', name: '财务系统元数据采集集', dataSource: 'prod-oracle-finance',
      dsType: 'MySQL', scope: '指定表', scopeDetail: 'finance_db (34 张表)',
      collectType: 'full', schedule: '每天 01:00', status: 'success',
    lastRun: '今天 01:12', nextRun: '明天 01:00', duration: '5分2秒',
    tableCount: 34, fieldCount: 421, owner: '王芳',
    createdAt: '2024-02-01', tags: ['财务域', '核心'],
  },
];

const MOCK_RECORDS: CollectRecord[] = [
  { id: 'r1', taskId: 't1', taskName: '交易库全量元数据采集集', dataSource: 'prod-mysql-trade', dsType: 'MySQL', startTime: '今天 02:00:00', endTime: '-', duration: '进行中', status: 'running', tableCount: 28, fieldCount: 256, newTables: 2, updatedTables: 12, triggerType: 'schedule' },
  { id: 'r2', taskId: 't2', taskName: '数仓增量元数据采集集', dataSource: 'prod-hive-warehouse', dsType: 'Hive', startTime: '今天 10:00:00', endTime: '今天 10:03:12', duration: '3分2秒', status: 'success', tableCount: 285, fieldCount: 2847, newTables: 0, updatedTables: 8, triggerType: 'schedule' },
  { id: 'r3', taskId: 't4', taskName: '用户中心元数据采集集', dataSource: 'prod-pg-user', dsType: 'PostgreSQL', startTime: '今天 08:00:00', endTime: '今天 08:00:23', duration: '23秒', status: 'failed', tableCount: 0, fieldCount: 0, newTables: 0, updatedTables: 0, errorMsg: 'Connection timeout: 无法连接到数据源...，请检查网络配置', triggerType: 'schedule' },
  { id: 'r4', taskId: 't3', taskName: 'OLAP引擎元数据采集集', dataSource: 'prod-clickhouse-olap', dsType: 'ClickHouse', startTime: '今天 04:00:00', endTime: '今天 04:01:45', duration: '1分5秒', status: 'success', tableCount: 18, fieldCount: 214, newTables: 1, updatedTables: 3, triggerType: 'schedule' },
  { id: 'r5', taskId: 't7', taskName: '实时数仓元数据采集集', dataSource: 'prod-doris-realtime', dsType: 'Doris', startTime: '今天 09:30:00', endTime: '今天 09:30:48', duration: '48秒', status: 'success', tableCount: 22, fieldCount: 268, newTables: 0, updatedTables: 2, triggerType: 'schedule' },
  { id: 'r6', taskId: 't8', taskName: '财务系统元数据采集集', dataSource: 'prod-oracle-finance', dsType: 'MySQL', startTime: '今天 01:00:00', endTime: '今天 01:05:22', duration: '5分2秒', status: 'success', tableCount: 34, fieldCount: 421, newTables: 0, updatedTables: 5, triggerType: 'schedule' },
  { id: 'r7', taskId: 't2', taskName: '数仓增量元数据采集集', dataSource: 'prod-hive-warehouse', dsType: 'Hive', startTime: '今天 09:00:00', endTime: '今天 09:03:05', duration: '3分5秒', status: 'success', tableCount: 285, fieldCount: 2847, newTables: 0, updatedTables: 5, triggerType: 'schedule' },
  { id: 'r8', taskId: 't1', taskName: '交易库全量元数据采集集', dataSource: 'prod-mysql-trade', dsType: 'MySQL', startTime: '昨天 02:00:00', endTime: '昨天 02:11:22', duration: '3分5秒', status: 'success', tableCount: 42, fieldCount: 386, newTables: 0, updatedTables: 14, triggerType: 'schedule' },
  { id: 'r9', taskId: 't4', taskName: '用户中心元数据采集集', dataSource: 'prod-pg-user', dsType: 'PostgreSQL', startTime: '昨天 08:00:00', endTime: '昨天 08:00:19', duration: '3分5秒', status: 'failed', tableCount: 0, fieldCount: 0, newTables: 0, updatedTables: 0, errorMsg: 'Connection timeout: 无法连接到数据源...', triggerType: 'manual' },
  { id: 'r10', taskId: 't6', taskName: '搜索引擎索引采集', dataSource: 'prod-es-search', dsType: 'Elasticsearch', startTime: '昨天 05:00:00', endTime: '昨天 05:04:30', duration: '3分5秒', status: 'success', tableCount: 15, fieldCount: 187, newTables: 2, updatedTables: 4, triggerType: 'schedule' },
];

const MOCK_RULES: CollectRule[] = [
  { id: 'rule1', name: '排除临时表', type: 'exclude', pattern: '^tmp_|^temp_|_bak$', scope: 'table', enabled: true, description: '排除临时表或备份表' },
  { id: 'rule2', name: '排除系统库', type: 'exclude', pattern: '^sys_|^information_schema', scope: 'database', enabled: true, description: '排除系统库和sys_开头的系统管理表' },
  { id: 'rule3', name: '核心表优先采集', type: 'include', pattern: '^ods_|^dwd_|^dws_|^ads_', scope: 'table', enabled: true, description: '优先采集数仓各层核心业务表' },
  { id: 'rule4', name: '排除敏感字段', type: 'exclude', pattern: 'password|secret|token|private_key', scope: 'field', enabled: true, description: '跳过密码、密钥等敏感字段的值采集（仅采集元信息）' },
  { id: 'rule5', name: '排除测试库', type: 'exclude', pattern: '^test_|_dev$|_sandbox$', scope: 'database', enabled: false, description: '排除测试和开发用途的数据库（已停用，改用环境隔离）' },
  { id: 'rule6', name: '包含维度表', type: 'include', pattern: '^dim_', scope: 'table', enabled: true, description: '确保维度表始终纳入采集范围' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DS_ICON: Record<string, { icon: string; color: string }> = {
  MySQL: { icon: '🐬', color: 'text-orange-400' },
  Hive: { icon: '🐝', color: 'text-yellow-400' },
  Kafka: { icon: '📨', color: 'text-purple-400' },
  ClickHouse: { icon: '🔥', color: 'text-yellow-300' },
  PostgreSQL: { icon: '🐘', color: 'text-blue-400' },
  MongoDB: { icon: '🍃', color: 'text-emerald-400' },
  Elasticsearch: { icon: '🔍', color: 'text-amber-400' },
  Doris: { icon: '🌟', color: 'text-cyan-400' },
};

const STATUS_CFG = {
  running:     { label: '运行中', dot: 'bg-cyan-400 animate-pulse',    badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' },
  success:     { label: '已完成成', dot: 'bg-emerald-400',               badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
  failed:      { label: '失败',   dot: 'bg-red-400',                   badge: 'bg-red-500/10 text-red-400 border border-red-500/30' },
  waiting:     { label: '等待中', dot: 'bg-slate-400',                 badge: 'bg-slate-500/10 text-slate-400 border border-slate-500/30' },
  paused:      { label: '已暂停', dot: 'bg-amber-400',                 badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

// 实时日志滚动组件
function LiveLogPanel({ taskId }: { taskId: string }) {
  const logsRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<{ time: string; level: 'info' | 'warn' | 'error' | 'success'; msg: string }[]>([
    { time: '02:00:00', level: 'info', msg: `[任务启动] 开始采集 prod-mysql-trade 全库元数据` },
    { time: '02:00:01', level: 'info', msg: `[连接成功] 已建立数据库连接，版本 MySQL 8.0.32` },
    { time: '02:00:02', level: 'info', msg: `[扫描库] 发现 1 个数据库: trade_db` },
    { time: '02:00:03', level: 'info', msg: `[扫描表] trade_db 42 张表，开始逐表采集` },
    { time: '02:00:05', level: 'success', msg: `[采集完成] ods_order (32 字段数', 主键: order_id)` },
    { time: '02:00:07', level: 'success', msg: `[采集完成] ods_order_item (18 字段数', 主键: item_id)` },
    { time: '02:00:09', level: 'success', msg: `[采集完成] ods_user (24 字段数', 主键: user_id)` },
    { time: '02:00:11', level: 'success', msg: `[采集完成] ods_product (41 字段数', 主键: product_id)` },
    { time: '02:00:14', level: 'warn',    msg: `[警告] dwd_order_detail 缺少字段注释 (12/28 已注释)` },
    { time: '02:00:16', level: 'success', msg: `[采集完成] dwd_order_detail (28 字段)` },
    { time: '02:00:19', level: 'success', msg: `[采集完成] dwd_order_pay (15 字段)` },
    { time: '02:00:22', level: 'success', msg: `[采集完成] dim_user_tag (8 字段)` },
    { time: '02:00:25', level: 'info',    msg: `[进度] 已完成成 28/42 张表 (66.7%)，已采集 256 个字段` },
  ]);

  useEffect(() => {
    if (!taskId) return;
    const msgs = [
      { level: 'success' as const, msg: `[采集完成] dws_trade_1d (22 字段)` },
      { level: 'success' as const, msg: `[采集完成] ads_sales_report (16 字段)` },
      { level: 'warn'    as const, msg: `[警告] ads_risk_score 发现新字段 risk_v3_score，已自动注册` },
      { level: 'success' as const, msg: `[采集完成] ads_risk_score (31 字段)` },
      { level: 'info'    as const, msg: `[进度] 已完成成 32/42 张表 (76.2%)` },
      { level: 'success' as const, msg: `[采集完成] dim_product_category (12 字段)` },
      { level: 'success' as const, msg: `[采集完成] ods_payment (19 字段)` },
      { level: 'info'    as const, msg: `[进度] 已完成成 42/42 张表 (100%)，开始生成元数据摘要` },
      { level: 'success' as const, msg: `[任务完成] 本次共采集 42 张表, 386 个字段数', 耗时 124秒` },
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i >= msgs.length) { clearInterval(timer); return; }
      const now = new Date();
      const t = `${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}:${String(now.getMilliseconds()).slice(0,2)}`;
      setLogs(prev => [...prev, { time: t, level: msgs[i].level, msg: msgs[i].msg }]);
      i++;
    }, 1400);
    return () => clearInterval(timer);
  }, [taskId]);

  useEffect(() => {
    logsRef.current?.scrollTo({ top: logsRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  const levelColor = { info: 'text-slate-400', warn: 'text-amber-400', error: 'text-red-400', success: 'text-emerald-400' };

  return (
    <div ref={logsRef} className="h-56 overflow-y-auto rounded-lg bg-slate-950 p-3 font-mono text-xs space-y-0.5 border border-slate-700/50">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-slate-600 shrink-0">{log.time}</span>
          <span className={levelColor[log.level]}>{log.msg}</span>
        </div>
      ))}
      <div className="flex gap-2">
        <span className="text-slate-600 shrink-0">--:--:--</span>
        <span className="text-slate-500 animate-pulse"></span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MetadataCollect() {
  const [tab, setTab] = useState<'tasks' | 'history' | 'rules'>('tasks');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dsTypeFilter, setDsTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<CollectTask | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'log' | 'config'>('overview');
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set(['t1']));
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Create wizard
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    name: '', dataSource: '', collectType: 'full', scope: 'all',
    scopeDetail: '', scheduleType: 'daily', scheduleTime: '02:00',
    scheduleInterval: '1', description: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleManualRun = (task: CollectTask) => {
    if (runningIds.has(task.id)) return;
    setRunningIds(prev => new Set([...prev, task.id]));
    showToast(`已手动触发「{task.name}」，任务运行中…`, 'info');
    setTimeout(() => {
      setRunningIds(prev => { const n = new Set(prev); n.delete(task.id); return n; });
      showToast(`「{task.name}」采集完成`, 'success');
    }, 6000);
  };

  const tasks = MOCK_TASKS.map(t => ({
    ...t,
    status: runningIds.has(t.id) ? 'running' as const : t.status,
    progress: runningIds.has(t.id) ? t.progress ?? 50 : t.progress,
  }));

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (dsTypeFilter !== 'all' && t.dsType !== dsTypeFilter) return false;
    if (search && !t.name.includes(search) && !t.dataSource.includes(search)) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    success: tasks.filter(t => t.status === 'success').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    paused: tasks.filter(t => t.status === 'paused').length,
  };

  const todaySuccess = MOCK_RECORDS.filter(r => r.status === 'success').length;
  const todayFailed = MOCK_RECORDS.filter(r => r.status === 'failed').length;
  const totalFields = tasks.reduce((s, t) => s + t.fieldCount, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: '元数据管理' }, { label: '元数据采集集' }]} />

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">元数据采集</h1>
          <p className="text-sm text-slate-400">管理各数据源...据自动采集任务，支持全量和增量两种模式</p>
        </div>
        <button
          onClick={() => { setShowCreateDialog(true); setWizardStep(1); }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建采集任务
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: '采集任务', value: stats.total, sub: '个任务', color: 'from-cyan-500 to-blue-500', icon: '📋' },
          { label: '运行中', value: stats.running, sub: '个任务', color: 'from-cyan-400 to-cyan-600', icon: '⚡' },
          { label: '已完成成', value: stats.success, sub: '今日成功', color: 'from-emerald-500 to-green-500', icon: '⚡' },
          { label: '失败', value: stats.failed, sub: '需处理', color: 'from-red-500 to-rose-500', icon: '⚡' },
          { label: '已暂停', value: stats.paused, sub: '个任务', color: 'from-amber-500 to-orange-500', icon: '⚡' },
          { label: '今日执行', value: todaySuccess + todayFailed, sub: `成功 ${todaySuccess} / 失败 ${todayFailed}`, color: 'from-purple-500 to-violet-500', icon: '📅' },
          { label: '字段总量', value: totalFields.toLocaleString(), sub: '已采集字段', color: 'from-blue-500 to-indigo-500', icon: '🔢' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded bg-gradient-to-r ${s.color} bg-opacity-10 text-white/80`} />
            </div>
            <div className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            <div className="text-xs text-slate-500">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-800/60 p-1">
        {([
          { key: 'tasks', label: '采集任务', icon: '📋' },
          { key: 'history', label: '采集历史', icon: '📜' },
          { key: 'rules', label: '采集规则', icon: '⚙️' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: 采集任务 ─────────────────────────────────────────────────── */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
                placeholder="搜索任务名称或数据源..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Status filter */}
            <div className="flex gap-1">
              {[
                { key: 'all', label: '全部' },
                { key: 'running', label: '运行中' },
                { key: 'success', label: '成功' },
                { key: 'failed', label: '失败' },
                { key: 'paused', label: '已暂停' },
                { key: 'waiting', label: '等待' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
                    statusFilter === f.key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'border border-slate-700/50 text-slate-400 hover:text-slate-300 bg-slate-800/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* DS Type filter */}
            <select
              className="rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              value={dsTypeFilter}
              onChange={e => setDsTypeFilter(e.target.value)}
            >
              <option value="all">所有数据源类型</option>
              {['MySQL','Hive','ClickHouse','PostgreSQL','MongoDB','Elasticsearch','Doris'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Task Cards Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredTasks.map(task => {
              const sc = STATUS_CFG[task.status];
              const ds = DS_ICON[task.dsType] ?? { icon: '🗄', color: 'text-slate-400' };
              return (
                <div
                  key={task.id}
                  className="group relative rounded-xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 cursor-pointer"
                  onClick={() => { setSelectedTask(task); setShowDetailDrawer(true); setDetailTab('overview'); }}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/60 text-xl">
                        {ds.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-white">{task.name}</div>
                        <div className={`text-xs ${ds.color}`}>{task.dataSource}</div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${sc.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </div>
                  </div>

                  {/* Progress Bar (running only) */}
                  {task.status === 'running' && task.progress !== undefined && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">采集进度</span>
                        <span className="text-cyan-400 font-medium">{task.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-700/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 relative overflow-hidden transition-all duration-500"
                          style={{ width: `${task.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                    <div>
                      <div className="text-slate-500 mb-0.5">采集类型</div>
                      <div className="text-slate-300">{task.collectType === 'full' ? '🔵 全量' : '🟢 增量'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">调度周期</div>
                      <div className="text-slate-300">{task.schedule}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">采集范围</div>
                      <div className="text-slate-300 truncate">{task.scope}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">数据表数</div>
                      <div className="text-slate-300 font-medium">{task.tableCount}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">字段</div>
                      <div className="text-slate-300 font-medium">{task.fieldCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">耗时</div>
                      <div className="text-slate-300">{task.status === 'running' ? '进行中' : task.duration}</div>
                    </div>
                  </div>

                  {/* Time Row */}
                  <div className="flex items-center justify-between border-t border-slate-700/40 pt-3 text-xs text-slate-500">
                    <span>上次：{task.lastRun}</span>
                    <span>下次：{task.nextRun}</span>
                    <span className="text-slate-600">负责人：{task.owner || '未指定'}</span>
                  </div>

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {task.tags.map(tag => (
                        <span key={tag} className="rounded px-1.5 py-0.5 text-xs bg-slate-700/60 text-slate-400">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons (hover) */}
                  <div className="absolute right-4 top-4 hidden group-hover:flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleManualRun(task)}
                      disabled={task.status === 'running'}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        task.status === 'running'
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                      }`}
                    >
                      {task.status === 'running' ? '运行中' : '立即运行'}
                    </button>
                    <button className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50">
                      编辑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: 采集历史 ─────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '今日执行次数', value: MOCK_RECORDS.length, color: 'text-cyan-400' },
              { label: '成功次数', value: todaySuccess, color: 'text-emerald-400' },
              { label: '失败次数', value: todayFailed, color: 'text-red-400' },
              { label: '成功率', value: `${Math.round(todaySuccess / MOCK_RECORDS.length * 100)}%`, color: 'text-blue-400' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* History Table */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">执行记录</h3>
              <span className="text-xs text-slate-500">最近 {MOCK_RECORDS.length} 条</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-xs text-slate-500">
                    {['任务名称','数据源...触发方式','开始时间','耗时','表数/字段数','新增/更新','状态',].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {MOCK_RECORDS.map(r => {
                    const sc = STATUS_CFG[r.status];
                    const ds = DS_ICON[r.dsType] ?? { icon: '🗄', color: 'text-slate-400' };
                    return (
                      <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-200 font-medium">{r.taskName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${ds.color}`}>{ds.icon} {r.dataSource}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded px-1.5 py-0.5 text-xs ${r.triggerType === 'schedule' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {r.triggerType === 'schedule' ? '定时' : '手动'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{r.startTime}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{r.duration}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">
                          {r.status === 'failed' ? '-' : `${r.tableCount} / ${r.fieldCount.toLocaleString()}`}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {r.status === 'failed' ? (
                            <span className="text-slate-500">-</span>
                          ) : (
                            <span>
                              <span className="text-emerald-400">+{r.newTables}</span>
                              <span className="text-slate-500 mx-1">/</span>
                              <span className="text-blue-400">~{r.updatedTables}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs w-fit ${sc.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                            {r.errorMsg && (
                              <span className="text-xs text-red-400/80 max-w-48 truncate" title={r.errorMsg}>
                                {r.errorMsg}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: 采集规则 ─────────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">通过规则控制采集范围，支持正则表达式，规则按优先级顺序执行</p>
            <button className="flex items-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/10 transition">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增规则
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_RULES.map((rule, idx) => (
              <div key={rule.id} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 flex items-start gap-4 group hover:border-slate-600/60 transition-all">
                {/* Priority */}
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700/60 text-xs font-bold text-slate-400 shrink-0">
                  {idx + 1}
                </div>
                {/* Type Badge */}
                <div className={`shrink-0 mt-0.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                  rule.type === 'include' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {rule.type === 'include' ? '包含' : '排除'}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-200">{rule.name}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      rule.scope === 'table' ? 'bg-blue-500/10 text-blue-400' :
                      rule.scope === 'database' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      作用于{rule.scope === 'table' ? '表' : rule.scope === 'database' ? '数据库' : '字段'}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-cyan-400 bg-slate-900/60 rounded px-2 py-1 mb-1.5 inline-block">{rule.pattern}</div>
                  <div className="text-xs text-slate-400">{rule.description}</div>
                </div>
                {/* Toggle */}
                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${rule.enabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
                  >
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <div className="hidden group-hover:flex gap-1">
                    <button className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50">编辑</button>
                    <button className="rounded-lg px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-slate-700/50">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rule hint */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-300/80">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-base shrink-0">💡</span>
              <div>
                <div className="font-medium text-blue-300 mb-1">规则说明</div>
                <ul className="space-y-0.5 text-blue-300/70">
                  <li>规则按列表顺序执行行，可拖拽调整优先级</li>
                  <li>排除规则优先级高于包含规则（即同时匹配时以排除为准）</li>
                  <li>正则表达式语法参Python <code className="text-blue-400">re</code> 模块，默认不区分大小写</li>
                  <li>禁用的规则不会参与采集过滤，但保留配置</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ───────────────────────────────────────────────────── */}
      {showDetailDrawer && selectedTask && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailDrawer(false)} />
          <div className="w-[680px] bg-slate-900 border-l border-slate-700/60 flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                  {DS_ICON[selectedTask.dsType]?.icon ?? '🗄'}
                </div>
                <div>
                  <h2 className="font-semibold text-white">{selectedTask.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${DS_ICON[selectedTask.dsType]?.color}`}>{selectedTask.dataSource}</span>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${STATUS_CFG[selectedTask.status].badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CFG[selectedTask.status].dot}`} />
                      {STATUS_CFG[selectedTask.status].label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleManualRun(selectedTask)}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:opacity-90 transition"
                >
                  立即运行
                </button>
                <button onClick={() => setShowDetailDrawer(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              {([
                { key: 'overview', label: '概览' },
                { key: 'log', label: '实时日志' },
                { key: 'config', label: '配置详情' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setDetailTab(t.key)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                    detailTab === t.key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Overview Tab */}
              {detailTab === 'overview' && (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '数据表数', value: selectedTask.tableCount, color: 'text-cyan-400' },
                      { label: '字段数', value: selectedTask.fieldCount.toLocaleString(), color: 'text-blue-400' },
                      { label: '本次耗时', value: selectedTask.status === 'running' ? '进行中' : selectedTask.duration, color: 'text-purple-400' },
                    ].map((m, i) => (
                      <div key={i} className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3 text-center">
                        <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress (running only) */}
                  {selectedTask.status === 'running' && selectedTask.progress !== undefined && (
                    <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-300">采集进度</span>
                        <span className="text-cyan-400 font-semibold">{selectedTask.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 relative overflow-hidden" style={{ width: `${selectedTask.progress}%` }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{Math.round(selectedTask.tableCount * selectedTask.progress / 100)} / {selectedTask.tableCount} 张表已完成</div>
                    </div>
                  )}

                  {/* Task Info */}
                  <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">任务信息</h4>
                    {[
                      { label: '数据源配置'},
                      { label: '数据源配置'},
                      { label: '采集类型', value: selectedTask.collectType === 'full' ? '全量采集' : '增量采集' },
                      { label: '采集范围', value: selectedTask.scope },
                      { label: '范围详情', value: selectedTask.scopeDetail },
                      { label: '调度周期', value: selectedTask.schedule },
                      { label: '上一步'},
                      { label: '下次运行', value: selectedTask.nextRun },
                      { label: '负责人', value: selectedTask.owner },
                      { label: '创建时间', value: selectedTask.createdAt },
                    ].map(row => (
                      <div key={row.label} className="flex items-start justify-between text-sm">
                        <span className="text-slate-500 shrink-0 w-24">{row.label}</span>
                        <span className="text-slate-300 text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recent runs */}
                  <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">最近执行记</h4>
                    <div className="space-y-2">
                      {MOCK_RECORDS.filter(r => r.taskId === selectedTask.id).slice(0, 4).map(r => {
                        const sc = STATUS_CFG[r.status];
                        return (
                          <div key={r.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{r.startTime}</span>
                            <span className="text-slate-500">{r.duration}</span>
                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${sc.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </div>
                        );
                      })}
                      {MOCK_RECORDS.filter(r => r.taskId === selectedTask.id).length === 0 && (
                        <div className="text-xs text-slate-500 text-center py-2">暂无执行记录</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Log Tab */}
              {detailTab === 'log' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>实时采集日志（最500 条）</span>
                    <button className="text-cyan-400 hover:text-cyan-300">下载完整日志</button>
                  </div>
                  <LiveLogPanel taskId={selectedTask.id} />
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/80">
                    日志为模拟数据，实际生产中将连接采集引擎实时推                  </div>
                </div>
              )}

              {/* Config Tab */}
              {detailTab === 'config' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">调度配置</h4>
                    {[
                      { label: '调度类型', value: selectedTask.collectType === 'full' ? '全量' : '增量' },
                      { label: '调度表达式', value: selectedTask.schedule === '每天 02:00' ? '0 2 * * *' : selectedTask.schedule === '每小时' ? '0 * * * *' : '*/30 * * * *' },
                      { label: '调度描述', value: selectedTask.schedule },
                      { label: '超时时间', value: '30分钟' },
                      { label: '重试次数', value: '3分钟' },
                      { label: '重试间隔', value: '5分钟' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="text-slate-300 font-mono text-xs">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">采集选项</h4>
                    {[
                      { label: '采集表注释', value: '是' },
                      { label: '采集字段注释', value: '是' },
                      { label: '采集分区信息', value: selectedTask.dsType === 'Hive' ? '是' : '否' },
                      { label: '采集统计信息', value: '是（行数、大小）' },
                      { label: '自动识别主键', value: '是' },
                      { label: '敏感字段识别', value: '开' },
                      { label: '血缘解析联', value: '开' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{row.label}</span>
                        <span className={`text-xs ${row.value.startsWith('是') || row.value === '开' ? 'text-emerald-400' : row.value === '否' ? 'text-slate-500' : 'text-slate-300'}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Task Dialog (3-step wizard) ──────────────────────────────── */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateDialog(false)} />
          <div className="relative w-[640px] max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl flex flex-col overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50 shrink-0">
              <div>
                <h2 className="font-semibold text-white">新建采集任务</h2>
                <p className="text-xs text-slate-400 mt-0.5">步骤 {wizardStep} / 3</p>
              </div>
              <button onClick={() => setShowCreateDialog(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0 px-6 py-4 shrink-0">
              {[
                { step: 1, label: '数据源配置'},
                { step: 2, label: '采集范围' },
                { step: 3, label: '调度设置' },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      wizardStep > s.step ? 'bg-emerald-500 text-white' :
                      wizardStep === s.step ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {wizardStep > s.step ? '✅' : s.step}
                    </div>
                    <span className={`text-xs ${wizardStep === s.step ? 'text-cyan-400 font-medium' : 'text-slate-500'}`}>{s.label}</span>
                  </div>
                  {i < 2 && <div className={`flex-1 mx-3 h-px ${wizardStep > s.step ? 'bg-emerald-500/50' : 'bg-slate-700/60'}`} />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {/* Step 1: 数据源配置*/}
              {wizardStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">任务名称 <span className="text-red-400">*</span></label>
                    <input
                      className="w-full rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
                      placeholder="如：交易库全量元数据采集集"
                      value={wizardForm.name}
                      onChange={e => setWizardForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">选择数据<span className="text-red-400">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {MOCK_TASKS.slice(0, 6).map(t => (
                        <button
                          key={t.dataSource}
                          onClick={() => setWizardForm(f => ({ ...f, dataSource: t.dataSource }))}
                          className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                            wizardForm.dataSource === t.dataSource
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                              : 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-base">{DS_ICON[t.dsType]?.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{t.dataSource}</div>
                            <div className="text-xs text-slate-500">{t.dsType}</div>
                          </div>
                          {wizardForm.dataSource === t.dataSource && (
                            <span className="ml-auto text-cyan-400 text-base"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">采集类型</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'full', label: '全量采集', desc: '每次采集所有元数据，数据完整但耗时较长', icon: '🔵' },
                        { key: 'incremental', label: '增量采集', desc: '仅采集变更的元数据，速度快、资源消耗小', icon: '🟢' },
                      ].map(ct => (
                        <button
                          key={ct.key}
                          onClick={() => setWizardForm(f => ({ ...f, collectType: ct.key }))}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            wizardForm.collectType === ct.key
                              ? 'border-cyan-500/50 bg-cyan-500/10'
                              : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span>{ct.icon}</span>
                            <span className={`text-sm font-medium ${wizardForm.collectType === ct.key ? 'text-cyan-300' : 'text-slate-300'}`}>{ct.label}</span>
                          </div>
                          <p className="text-xs text-slate-500">{ct.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: 采集范围 */}
              {wizardStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">采集范围</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'all', label: '全库', desc: '采集所有数据库' },
                        { key: 'database', label: '指定数据库', desc: '选择特定数据库'},
                        { key: 'table', label: '指定表', desc: '精确到表级别' }
                      ].map(s => (
                        <button
                          key={s.key}
                          onClick={() => setWizardForm(f => ({ ...f, scope: s.key }))}
                          className={`rounded-lg border p-3 text-center text-sm transition-all ${
                            wizardForm.scope === s.key
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                              : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="font-medium">{s.label}</div>
                          <div className="text-xs mt-0.5 opacity-70">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {wizardForm.scope !== 'all' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        {wizardForm.scope === 'database' ? '数据库名称（多个用逗号分隔）' : '表名/通配符（支持 * 通配）'}
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none resize-none"
                        rows={3}
                        placeholder={wizardForm.scope === 'database' ? 'ods_db, dwd_db, dws_db' : 'ods_*, dwd_order_*, dim_*'}
                        value={wizardForm.scopeDetail}
                        onChange={e => setWizardForm(f => ({ ...f, scopeDetail: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-700/40 bg-slate-800/40 p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-slate-400 mb-2">高级选项</div>
                    {[
                      { label: '采集字段注释', checked: true },
                      { label: '采集统计信息（行数、大小）', checked: true },
                      { label: '自动识别主键/外键', checked: true },
                      { label: '开启敏感数据识别', checked: true },
                      { label: '完成后触发血缘解析', checked: false },
                    ].map(opt => (
                      <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" defaultChecked={opt.checked} className="rounded border-slate-600 bg-slate-700 text-cyan-500" />
                        <span className="text-sm text-slate-300">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3: 调度设置 */}
              {wizardStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">调度方式</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'daily', label: '每天', icon: '📅' },
                        { key: 'hourly', label: '每小时', icon: '⚡' },
                        { key: 'interval', label: '间隔执行', icon: '🔄' },
                        { key: 'manual', label: '仅手动', icon: '👆' },
                      ].map(s => (
                        <button
                          key={s.key}
                          onClick={() => setWizardForm(f => ({ ...f, scheduleType: s.key }))}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                            wizardForm.scheduleType === s.key
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                              : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span>{s.icon}</span><span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {wizardForm.scheduleType === 'daily' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">执行时间</label>
                      <input
                        type="time"
                        className="rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                        value={wizardForm.scheduleTime}
                        onChange={e => setWizardForm(f => ({ ...f, scheduleTime: e.target.value }))}
                      />
                    </div>
                  )}
                  {wizardForm.scheduleType === 'interval' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">间隔时间（分钟）</label>
                      <input
                        type="number"
                        min={5}
                        className="w-32 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                        value={wizardForm.scheduleInterval}
                        onChange={e => setWizardForm(f => ({ ...f, scheduleInterval: e.target.value }))}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">任务描述（选填）</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none resize-none"
                      rows={3}
                      placeholder="描述该采集任务的用途和背景..."
                      value={wizardForm.description}
                      onChange={e => setWizardForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  {/* Summary preview */}
                  <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-4 space-y-2 text-sm">
                    <div className="text-xs font-semibold text-slate-400 mb-3">配置摘要</div>
                    {[
                      { label: '任务名称', value: wizardForm.name || '（未填写）' },
                      { label: '数据源', value: wizardForm.dataSource || '（未选择）' },
                      { label: '采集类型', value: wizardForm.collectType === 'full' ? '全量采集' : '增量采集' },
                      { label: '采集范围', value: wizardForm.scope === 'all' ? '全库' : wizardForm.scope === 'database' ? '指定数据库' : '指定表' },
                      { label: '调度方式', value: { daily: `每天 ${wizardForm.scheduleTime}`, hourly: '每小时', interval: `${wizardForm.scheduleInterval} 分钟`, manual: '仅手动触发' }[wizardForm.scheduleType] ?? '-' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="text-slate-300">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-700/50 shrink-0">
              <button
                onClick={() => wizardStep > 1 ? setWizardStep(w => w - 1) : setShowCreateDialog(false)}
                className="rounded-lg border border-slate-700/50 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition"
              >
                {wizardStep === 1 ? '取消' : '上一步'}
              </button>
              <button
                onClick={() => {
                  if (wizardStep < 3) {
                    if (wizardStep === 1 && !wizardForm.name) { showToast('请填写任务名称', 'error'); return; }
                    if (wizardStep === 1 && !wizardForm.dataSource) { showToast('请选择数据源...', 'error'); return; }
                    setWizardStep(w => w + 1);
                  } else {
                    setShowCreateDialog(false);
                    setWizardStep(1);
                    showToast(`采集任务「${wizardForm.name}」」已创建`, 'success');
                  }
                }}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
              >
                {wizardStep === 3 ? '立即创建' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-2xl backdrop-blur border ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
          'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          <span className="text-base">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
