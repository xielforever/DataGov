import { useState, useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, CircleDot, Database, Gauge, HardDrive, MessageSquare, Search, Server, Table2, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { fetchMetadataDataSources } from '../../services/api';
import Breadcrumb from '../../components/common/Breadcrumb';
import ErrorFallback from '../../components/common/ErrorFallback';
import { CardSkeleton } from '../../components/common/Skeleton';

type DataSourceType =
  | "MySQL"
  | "PostgreSQL"
  | "Hive"
  | "Kafka"
  | "ClickHouse"
  | "MongoDB"
  | "Oracle"
  | "Redis"
  | "Elasticsearch"
  | "Doris";

type ConnectionStatus = "online" | "offline" | "warning" | "syncing";

interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  category: "关系型" | "大数据" | "消息队列" | "NoSQL" | "搜索引擎" | "OLAP";
  status: ConnectionStatus;
  host: string;
  port: number;
  database: string;
  version: string;
  owner: string;
  department: string;
  env: "生产" | "预发" | "测试" | "开";
  tableCount: number;
  storageGB: number;
  qps: number;
  latencyMs: number;
  lastSyncTime: string;
  createTime: string;
  description: string;
  tags: string[];
}

// 数据已全部迁移至 src/mock/data.ts mockAllDataSources，通过 fetchMetadataDataSources() 加载

const TYPE_ICONS: Record<DataSourceType, { Icon: LucideIcon; color: string; bg: string }> = {
  MySQL: { Icon: Database, color: "from-blue-400 to-cyan-500", bg: "from-blue-500/20 to-cyan-500/10" },
  PostgreSQL: { Icon: Server, color: "from-indigo-400 to-blue-500", bg: "from-indigo-500/20 to-blue-500/10" },
  Hive: { Icon: HardDrive, color: "from-amber-400 to-yellow-500", bg: "from-amber-500/20 to-yellow-500/10" },
  Kafka: { Icon: MessageSquare, color: "from-slate-400 to-slate-600", bg: "from-slate-500/20 to-slate-600/10" },
  ClickHouse: { Icon: BarChart3, color: "from-yellow-400 to-orange-500", bg: "from-yellow-500/20 to-orange-500/10" },
  MongoDB: { Icon: CircleDot, color: "from-green-400 to-emerald-500", bg: "from-green-500/20 to-emerald-500/10" },
  Oracle: { Icon: Database, color: "from-red-400 to-rose-500", bg: "from-red-500/20 to-rose-500/10" },
  Redis: { Icon: Zap, color: "from-red-500 to-pink-600", bg: "from-red-500/20 to-pink-600/10" },
  Elasticsearch: { Icon: Search, color: "from-teal-400 to-cyan-500", bg: "from-teal-500/20 to-cyan-500/10" },
  Doris: { Icon: Activity, color: "from-purple-400 to-fuchsia-500", bg: "from-purple-500/20 to-fuchsia-500/10" },
};

const CATEGORIES = ["全部", "关系型", "大数据", "消息队列", "NoSQL", "搜索引擎", "OLAP"] as const;
const STATUS_FILTERS = [
  { id: "all", label: "全部状态" },
  { id: "online", label: "在线" },
  { id: "offline", label: "离线" },
  { id: "warning", label: "异常" },
  { id: "syncing", label: "同步" },
] as const;
const ENV_FILTERS = ["全部", "生产", "预发", "测试", "开"] as const;

const STATUS_CONFIG = {
  online: { label: "在线", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  offline: { label: "离线", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30", dot: "bg-slate-500" },
  warning: { label: "异常", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30", dot: "bg-amber-400" },
  syncing: { label: "同步", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30", dot: "bg-cyan-400" },
};

export default function DataSource() {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEnv, setSelectedEnv] = useState<string>("全部");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // ---- Mock API 数据加载 ----
  const [allSources, setAllSources] = useState<DataSource[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    fetchMetadataDataSources().then((data) => {
      // API 返回的数据结构映射到组件所需 DataSource 类型
      const mapped: DataSource[] = (data as Array<Record<string, unknown>>).map((d) => ({
        id: d.id as string,
        name: d.name as string,
        type: d.type as DataSourceType,
        category: (() => {
          const t = d.type as string;
          if (['MySQL','PostgreSQL','Oracle'].includes(t)) return '关系型';
          if (['Hive'].includes(t)) return '大数据';
          if (['Kafka'].includes(t)) return '消息队列';
          if (['MongoDB','Redis'].includes(t)) return 'NoSQL';
          if (['Elasticsearch'].includes(t)) return '搜索引擎';
          return 'OLAP';
        })() as DataSource['category'],
        status: d.status as ConnectionStatus,
        host: d.host as string,
        port: d.port as number,
        database: d.database as string,
        version: d.version as string,
        owner: d.owner as string,
        department: ((d.tags as string[])?.[0] ?? '') + '',
        env: d.env as DataSource['env'],
        tableCount: typeof d.tableCount === 'number' ? d.tableCount : (d.tables as number) || 0,
        storageGB: typeof d.storageGB === 'number' ? d.storageGB : typeof d.storage === 'number' ? d.storage : parseFloat(((d.storage as string) || "0").replace(/[^0-9.]/g, '')) * (((d.storage as string) || "").includes('TB') ? 1024 : 1),
        qps: d.qps as number,
        latencyMs: d.latency as number,
        lastSyncTime: d.lastSync as string,
        createTime: d.createTime as string,
        description: d.description as string,
        tags: d.tags as string[],
      }));
      setAllSources(mapped);
      setLoadingData(false);
    });
  }, []);

  // 筛选数据源
  const filteredSources = useMemo(() => allSources.filter((ds) => {
    if (selectedCategory !== "全部" && ds.category !== selectedCategory) return false;
    if (selectedStatus !== "all" && ds.status !== selectedStatus) return false;
    if (selectedEnv !== "全部" && ds.env !== selectedEnv) return false;
    if (searchKeyword && !ds.name.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !ds.description.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    return true;
  }), [allSources, selectedCategory, selectedStatus, selectedEnv, searchKeyword]);

  // 统计数据
  const stats = useMemo(() => ({
    total: allSources.length,
    online: allSources.filter((d) => d.status === "online").length,
    warning: allSources.filter((d) => d.status === "warning").length,
    offline: allSources.filter((d) => d.status === "offline").length,
    totalTables: allSources.reduce((sum, d) => sum + d.tableCount, 0),
    totalStorage: allSources.reduce((sum, d) => sum + d.storageGB, 0),
    totalQps: allSources.reduce((sum, d) => sum + d.qps, 0),
  }), [allSources]);

  // 按类型分组统计
  const typeStats = useMemo(() => (Object.keys(TYPE_ICONS) as DataSourceType[]).map((type) => ({
    type,
    count: allSources.filter((d) => d.type === type).length,
    online: allSources.filter((d) => d.type === type && d.status === "online").length,
  })).filter((t) => t.count > 0), [allSources]);

  const handleTest = (id: string) => {
    setTestingId(id);
    setTimeout(() => setTestingId(null), 1500);
  };

  if (error) {
    return <ErrorFallback onRetry={loadData} />;
  }
  if (loadingData) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: '数据资产' }, { label: '数据源管理' }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            数据源管理
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {stats.total} 个数据源
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">统一管理平台所有数据源接入，支持连接测试、元数据采集、性能监控</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success("数据源列表导出任务已提交")}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            导出列表
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
          >
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            新建数据源
          </button>
        </div>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "数据源总数", value: stats.total, unit: "个", Icon: Database, color: "from-cyan-500/20 to-blue-500/5", text: "text-cyan-400", trend: "+3 本月新增" },
          { label: "在线数据源", value: stats.online, unit: `/ ${stats.total}`, Icon: Activity, color: "from-emerald-500/20 to-green-500/5", text: "text-emerald-400", trend: `健康度 ${((stats.online / stats.total) * 100).toFixed(1)}%` },
          { label: "数据表总量", value: (stats.totalTables / 1000).toFixed(1), unit: "K 张", Icon: Table2, color: "from-purple-500/20 to-fuchsia-500/5", text: "text-purple-400", trend: "+285 本周" },
          { label: "实时 QPS", value: (stats.totalQps / 10000).toFixed(1), unit: "万/s", Icon: Gauge, color: "from-amber-500/20 to-orange-500/5", text: "text-amber-400", trend: "峰值 156 万" },
        ].map((stat) => (
          <div key={stat.label} className={`relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br ${stat.color} p-5 backdrop-blur-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-400">{stat.label}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${stat.text}`}>{stat.value}</span>
                  <span className="text-sm text-slate-400">{stat.unit}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">{stat.trend}</div>
              </div>
              <stat.Icon className={`h-7 w-7 opacity-80 ${stat.text}`} />
            </div>
          </div>
        ))}
      </div>

      {/* 数据源类型分布'*/}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
            <h3 className="text-sm font-semibold text-white">数据源类型分布</h3>
          </div>
          <span className="text-xs text-slate-500">点击类型快速筛选</span>
        </div>
        <div className="grid grid-cols-10 gap-3">
          {typeStats.map((t) => {
            const config = TYPE_ICONS[t.type];
            const TypeIcon = config.Icon;
            return (
              <button
                key={t.type}
                onClick={() => {
                  // 找到该类型对应的 category 并筛选
                  const ds = allSources.find((d) => d.type === t.type);
                    if (ds) setSelectedCategory(ds.category);
                }}
                className={`group flex flex-col items-center rounded-lg border border-slate-800 bg-gradient-to-br ${config.bg} p-3 transition hover:border-slate-600 hover:scale-105`}
              >
                <TypeIcon className="h-6 w-6 text-slate-100" />
                <div className="mt-1 text-xs font-medium text-white">{t.type}</div>
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  <span className="text-slate-400">{t.count} 个</span>
                  <span className="h-1 w-1 rounded-full bg-emerald-400"></span>
                  <span className="text-emerald-400">{t.online}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 筛选与搜索'*/}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* 搜索'*/}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索数据源名称、描述、负责人..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* 状态筛选'*/}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/30 p-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`rounded-md px-3 py-1 text-xs transition ${
                  selectedStatus === s.id ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* 视图切换 */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/30 p-1">
            <button
              onClick={() => setViewMode("card")}
              className={`rounded p-1.5 transition ${viewMode === "card" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}
              title="卡片视图"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded p-1.5 transition ${viewMode === "table" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}
              title="表格视图"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* 二级筛选行 */}
        <div className="mt-3 flex items-center gap-4 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">类型分类</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    selectedCategory === c
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                      : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">环境</span>
            <div className="flex gap-1.5">
              {ENV_FILTERS.map((e) => (
                <button
                  key={e}
                  onClick={() => setSelectedEnv(e)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    selectedEnv === e
                      ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40"
                      : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据源列表'*/}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          找到 <span className="font-semibold text-white">{filteredSources.length}</span> 个数据源
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button className="rounded p-1 hover:bg-slate-800 hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
          <span>排序：更新时间''</span>
        </div>
      </div>

      {/* 卡片视图 */}
      {viewMode === "card" && (
        <div className="grid grid-cols-3 gap-4">
          {filteredSources.map((ds) => {
            const config = TYPE_ICONS[ds.type];
            const TypeIcon = config.Icon;
            const status = STATUS_CONFIG[ds.status];
            return (
              <div
                key={ds.id}
                onClick={() => setSelectedSource(ds)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                {/* 微光背景 */}
                <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${config.bg} opacity-50 blur-2xl`}></div>

                {/* 头部 */}
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}>
                      <TypeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-white">{ds.name}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span>{ds.type}</span>
                        <span>·</span>
                        <span>{ds.version}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 rounded-md border ${status.border} ${status.bg} px-2 py-0.5`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${ds.status === "online" || ds.status === "syncing" ? "animate-pulse" : ""}`}></span>
                    <span className={`text-[10px] font-medium ${status.color}`}>{status.label}</span>
                  </div>
                </div>

                {/* 描述 */}
                <p className="relative mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{ds.description}</p>

                {/* 连接信息 */}
                <div className="relative mt-4 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-slate-300">{ds.host}:{ds.port}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>DB:</span>
                    <span className="text-slate-400">{ds.database}</span>
                  </div>
                </div>

                {/* 关键指标 */}
                <div className="relative mt-4 grid grid-cols-3 gap-2 border-t border-slate-800 pt-4">
                  <div>
                    <div className="text-[10px] text-slate-500">数据源'</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{ds.tableCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">存储</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{ds.storageGB > 1000 ? `${(ds.storageGB / 1024).toFixed(1)} TB` : `${ds.storageGB} GB`}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">QPS</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{ds.qps > 10000 ? `${(ds.qps / 10000).toFixed(1)} 万` : ds.qps.toLocaleString()}</div>
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="relative mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-semibold text-white">
                      {ds.owner.charAt(0)}
                    </div>
                    <span>{ds.owner}</span>
                  </div>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{ds.env}</span>
                </div>

                {/* 悬浮操作 */}
                <div className="relative mt-3 flex items-center gap-2 border-t border-slate-800 pt-3 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTest(ds.id); }}
                    className="flex-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20"
                  >
                    {testingId === ds.id ? (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        测试中
                      </span>
                    ) : "测试连接"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toast.success("元数据同步任务已提交"); }} className="rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                    同步
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toast("更多操作将在后续接入"); }} className="rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                    更多
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 表格视图 */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <table className="min-w-[1060px] w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">数据源'</th>
                <th className="px-4 py-3 font-medium w-[90px]">类型</th>
                <th className="px-4 py-3 font-medium w-[180px]">主机地址</th>
                <th className="px-4 py-3 font-medium w-[80px]">环境</th>
                <th className="px-4 py-3 font-medium w-[70px]">表数</th>
                <th className="px-4 py-3 font-medium w-[70px]">存储</th>
                <th className="px-4 py-3 font-medium w-[70px]">QPS</th>
                <th className="px-4 py-3 font-medium w-[70px]">延迟</th>
                <th className="px-4 py-3 font-medium">状态'</th>
                <th className="px-4 py-3 font-medium">负责人'</th>
                <th className="px-4 py-3 font-medium w-[100px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((ds) => {
                const config = TYPE_ICONS[ds.type];
                const TypeIcon = config.Icon;
                const status = STATUS_CONFIG[ds.status];
                return (
                  <tr
                    key={ds.id}
                    onClick={() => setSelectedSource(ds)}
                    className="group cursor-pointer border-b border-slate-800/50 text-sm transition hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-5 w-5 text-slate-300" />
                        <div>
                          <div className="font-mono font-medium text-white">{ds.name}</div>
                          <div className="text-xs text-slate-500">{ds.description.slice(0, 28)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{ds.type}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{ds.host}:{ds.port}</td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-400">{ds.env}</span></td>
                    <td className="px-4 py-3 text-slate-300">{ds.tableCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300">{ds.storageGB > 1000 ? `${(ds.storageGB / 1024).toFixed(1)} TB` : `${ds.storageGB} GB`}</td>
                    <td className="px-4 py-3 text-slate-300">{ds.qps > 10000 ? `${(ds.qps / 10000).toFixed(1)}万` : ds.qps.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${ds.latencyMs > 100 ? "text-amber-400" : ds.latencyMs > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                        {ds.latencyMs > 0 ? `${ds.latencyMs} ms` : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md border ${status.border} ${status.bg} px-2 py-0.5 text-[10px] ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-semibold text-white">{ds.owner.charAt(0)}</div>
                        {ds.owner}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-60 transition group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); handleTest(ds.id); }} className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20">测试</button>
                        <button onClick={(e) => e.stopPropagation()} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">同步</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 数据源详情侧边抽'*/}
      {selectedSource && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSource(null)} />
          <div className="fixed right-0 top-0 z-50 h-screen w-[640px] overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl">
            {/* 抽屉头部 */}
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
              <div className="flex items-start justify-between p-5">
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${TYPE_ICONS[selectedSource.type].color} shadow-lg`}>
                    {(() => {
                      const SourceIcon = TYPE_ICONS[selectedSource.type].Icon;
                      return <SourceIcon className="h-6 w-6 text-white" />;
                    })()}
                  </div>
                  <div>
                    <div className="font-mono text-lg font-semibold text-white">{selectedSource.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 rounded-md border ${STATUS_CONFIG[selectedSource.status].border} ${STATUS_CONFIG[selectedSource.status].bg} px-2 py-0.5 ${STATUS_CONFIG[selectedSource.status].color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedSource.status].dot} animate-pulse`}></span>
                        {STATUS_CONFIG[selectedSource.status].label}
                      </span>
                      <span className="text-slate-500">{selectedSource.type} · {selectedSource.version}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">{selectedSource.env}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedSource(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex gap-2 border-t border-slate-800 px-5 py-3">
                <button onClick={() => toast("数据浏览能力将在目录详情中接入")} className="flex-1 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 py-2 text-xs font-medium text-white">浏览数据</button>
                <button onClick={() => handleTest(selectedSource.id)} className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-300 hover:bg-cyan-500/20">
                  {testingId === selectedSource.id ? "测试中..." : "测试连接"}
                </button>
                <button onClick={() => toast.success("元数据同步任务已提交")} className="rounded-md border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">立即同步</button>
                <button onClick={() => toast("更多操作将在后续接入")} className="rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">更多</button>
              </div>
            </div>

            {/* 内容'*/}
            <div className="space-y-5 p-5">
              {/* 基本信息 */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="h-3 w-1 rounded-full bg-cyan-500"></span>基本信息
                </h4>
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                  <p className="mb-3 text-sm text-slate-300">{selectedSource.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">数据源类型'</span>
                      <span className="text-slate-300">{selectedSource.type}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">分类</span>
                      <span className="text-slate-300">{selectedSource.category}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">版本</span>
                      <span className="text-slate-300">{selectedSource.version}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">运行环境</span>
                      <span className="text-slate-300">{selectedSource.env}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">负责人'</span>
                      <span className="text-slate-300">{selectedSource.owner}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">所属部门'</span>
                      <span className="text-slate-300">{selectedSource.department}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">创建时间</span>
                      <span className="text-slate-300">{selectedSource.createTime}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">最后同步'</span>
                      <span className="text-emerald-400">{selectedSource.lastSyncTime}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedSource.tags.map((tag) => (
                      <span key={tag} className="rounded bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 连接配置 */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="h-3 w-1 rounded-full bg-blue-500"></span>连接配置
                </h4>
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="w-24 text-slate-500">Host</span>
                      <span className="text-slate-300">{selectedSource.host}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Port</span>
                      <span className="text-slate-300">{selectedSource.port}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Database</span>
                      <span className="text-slate-300">{selectedSource.database}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Username</span>
                      <span className="text-slate-300">data_governance_***</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">Password</span>
                      <span className="text-slate-300">•••••••••'</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-500">SSL</span>
                      <span className="text-emerald-400">已启用'</span>
                    </div>
                  </div>
                  <button className="mt-3 w-full rounded border border-slate-700 bg-slate-800/50 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                    编辑连接信息
                  </button>
                </div>
              </div>

              {/* 性能监控 */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="h-3 w-1 rounded-full bg-purple-500"></span>性能监控
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-xs text-slate-500">实时 QPS</div>
                    <div className="mt-1 text-xl font-bold text-cyan-400">{selectedSource.qps.toLocaleString()}</div>
                    <div className="mt-2 h-8 flex items-end gap-0.5">
                      {[40, 60, 35, 70, 55, 80, 65, 90, 75, 85, 60, 70].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/40 to-cyan-400/80" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-xs text-slate-500">平均延迟</div>
                    <div className="mt-1 text-xl font-bold text-emerald-400">{selectedSource.latencyMs} <span className="text-sm">ms</span></div>
                    <div className="mt-2 h-8 flex items-end gap-0.5">
                      {[50, 45, 60, 35, 40, 55, 30, 45, 50, 40, 35, 45].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-400/80" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-xs text-slate-500">数据表数'</div>
                    <div className="mt-1 text-xl font-bold text-purple-400">{selectedSource.tableCount.toLocaleString()}</div>
                    <div className="mt-2 text-[10px] text-slate-500">较上周'+12 '</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-xs text-slate-500">存储占用</div>
                    <div className="mt-1 text-xl font-bold text-amber-400">{selectedSource.storageGB > 1000 ? `${(selectedSource.storageGB / 1024).toFixed(1)} TB` : `${selectedSource.storageGB} GB`}</div>
                    <div className="mt-2 text-[10px] text-slate-500">较上周'+5.2%</div>
                  </div>
                </div>
              </div>

              {/* 同步任务 */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="h-3 w-1 rounded-full bg-emerald-500"></span>元数据采集任务'                </h4>
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                  <div className="space-y-3">
                    {[
                        { name: "全量元数据采集", cron: "每天 02:00", status: "成功", lastRun: "今天 02:15", next: "明天 02:00" },
                        { name: "增量元数据采集", cron: "每小时", status: "运行中", lastRun: "1 小时前", next: "30 分钟后" },
                        { name: "数据质量巡检", cron: "每天 06:00", status: "成功", lastRun: "今天 06:08", next: "明天 06:00" },
                      ].map((task) => (
                      <div key={task.name} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/50 p-3">
                        <div>
                          <div className="text-sm text-white">{task.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{task.cron} · 上次：{task.lastRun}</div>
                        </div>
                        <div className="text-right">
                          <span className={`rounded px-2 py-0.5 text-[10px] ${task.status === "运行中" ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                            {task.status}
                          </span>
                          <div className="mt-1 text-[10px] text-slate-500">下次：{task.next}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 危险操作 */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-red-400">
                  <span className="h-3 w-1 rounded-full bg-red-500"></span>危险操作
                </h4>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">解除数据源接入'</div>
                      <div className="mt-1 text-xs text-slate-400">删除后该数据源关联的所有元数据、血缘关系、质量规则均失效</div>
                    </div>
                    <button className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20">
                      解除接入
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 新建数据源弹'*/}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">新建数据源</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 text-sm text-slate-400">选择要接入的数据源类型</div>
              <div className="grid grid-cols-5 gap-3">
                {(Object.keys(TYPE_ICONS) as DataSourceType[]).map((type) => {
                  const config = TYPE_ICONS[type];
                  const TypeIcon = config.Icon;
                  return (
                    <button
                      key={type}
                      className={`group flex flex-col items-center rounded-xl border border-slate-800 bg-gradient-to-br ${config.bg} p-4 transition hover:border-cyan-500/50 hover:scale-105`}
                    >
                      <TypeIcon className="h-7 w-7 text-slate-100" />
                      <div className="mt-2 text-sm font-medium text-white">{type}</div>
                      <div className="mt-1 text-[10px] text-slate-500">点击接入</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="text-xs text-slate-400">
                    <div className="text-slate-300">接入说明</div>
                    <div className="mt-1">数据源接入后，平台会自动开启元数据采集、血缘解析、质量评估、敏感数据识别等任务</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setShowAddModal(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white">
                继续配置
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
