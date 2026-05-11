import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  Diff,
  Download,
  FileSearch,
  Filter,
  GitCompare,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRoundCog,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  createOperationLogExport,
  fetchOperationLogDiffs,
  fetchOperationLogEvents,
  fetchOperationLogExports,
  fetchOperationLogObjects,
  fetchOperationLogOverview,
  updateOperationLogEventStatus,
} from "../../services/api";

type EventResult = "success" | "failed" | "blocked";
type RiskLevel = "high" | "medium" | "normal";
type EventStatus = "open" | "reviewing" | "closed";
type ExportStatus = "running" | "finished" | "failed";

interface OperationOverview {
  totalEvents: number;
  riskyEvents: number;
  failedEvents: number;
  exportedJobs: number;
  activeOperators: number;
  retentionDays: number;
}

interface OperationEvent {
  id: string;
  operator: string;
  account: string;
  module: string;
  action: string;
  objectName: string;
  objectType: string;
  result: EventResult;
  risk: RiskLevel;
  status: EventStatus;
  ip: string;
  occurredAt: string;
  detail: string;
}

interface OperationObject {
  id: string;
  objectName: string;
  objectType: string;
  owner: string;
  eventCount: number;
  lastAction: string;
  lastOperator: string;
  lastOccurredAt: string;
  riskLevel: RiskLevel;
}

interface OperationDiff {
  id: string;
  eventId: string;
  field: string;
  before: string;
  after: string;
  impact: string;
  reviewer: string;
  status: "pending" | "approved";
}

interface OperationExport {
  id: string;
  name: string;
  scope: string;
  status: ExportStatus;
  format: string;
  createdBy: string;
  createdAt: string;
  rows: number;
}

const resultConfig: Record<EventResult, { label: string; color: string; bg: string; dot: string; border: string }> = {
  success: { label: "成功", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400", border: "border-red-500/30" },
  blocked: { label: "已拦截", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高风险", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中风险", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  normal: { label: "常规", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
};

const statusConfig: Record<EventStatus, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: "待处置", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  reviewing: { label: "复核中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  closed: { label: "已关闭", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
};

const exportStatusConfig: Record<ExportStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  running: { label: "生成中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
  finished: { label: "已完成", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400", border: "border-red-500/30" },
};

export default function OperationLog() {
  const [overview, setOverview] = useState<OperationOverview | null>(null);
  const [events, setEvents] = useState<OperationEvent[]>([]);
  const [objects, setObjects] = useState<OperationObject[]>([]);
  const [diffs, setDiffs] = useState<OperationDiff[]>([]);
  const [exports, setExports] = useState<OperationExport[]>([]);
  const [keyword, setKeyword] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [resultFilter, setResultFilter] = useState<"all" | EventResult>("all");
  const [selectedEvent, setSelectedEvent] = useState<OperationEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, eventData, objectData, diffData, exportData] = await Promise.all([
        fetchOperationLogOverview(),
        fetchOperationLogEvents({ keyword, risk: riskFilter, result: resultFilter }),
        fetchOperationLogObjects(),
        fetchOperationLogDiffs(),
        fetchOperationLogExports(),
      ]);
      setOverview(overviewData);
      setEvents(eventData);
      setObjects(objectData);
      setDiffs(diffData);
      setExports(exportData);
      setSelectedEvent((current) => current ?? eventData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (riskFilter !== "all" && event.risk !== riskFilter) return false;
      if (resultFilter !== "all" && event.result !== resultFilter) return false;
      if (keyword) {
        const text = `${event.operator} ${event.account} ${event.module} ${event.action} ${event.objectName} ${event.objectType} ${event.detail}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, keyword, resultFilter, riskFilter]);

  const selectedDiffs = useMemo(
    () => diffs.filter((diff) => diff.eventId === selectedEvent?.id),
    [diffs, selectedEvent],
  );

  const riskSummary = useMemo(() => {
    const map = new Map<RiskLevel, number>();
    events.forEach((event) => map.set(event.risk, (map.get(event.risk) ?? 0) + 1));
    return Array.from(map.entries()).map(([risk, count]) => ({ risk, count }));
  }, [events]);

  const maxRiskCount = Math.max(...riskSummary.map((item) => item.count), 1);

  const searchEvents = async () => {
    const data = await fetchOperationLogEvents({ keyword, risk: riskFilter, result: resultFilter });
    setEvents(data);
    setSelectedEvent(data[0] ?? null);
  };

  const changeEventStatus = async (event: OperationEvent, status: EventStatus) => {
    const updated = await updateOperationLogEventStatus(event.id, status);
    setEvents((prev) => prev.map((item) => (item.id === event.id ? updated : item)));
    setSelectedEvent((current) => (current?.id === event.id ? updated : current));
  };

  const createExportJob = async () => {
    const created = await createOperationLogExport({
      name: "当前筛选操作日志导出",
      scope: `${riskFilter === "all" ? "全部风险" : riskConfig[riskFilter].label} / ${resultFilter === "all" ? "全部结果" : resultConfig[resultFilter].label}`,
      format: "CSV",
      createdBy: "当前用户",
    });
    setExports((prev) => [created, ...prev]);
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载操作日志...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "系统管理" }, { label: "操作日志" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            操作日志
            <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
              风险事件 {overview.riskyEvents}
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            记录关键配置、权限、数据操作和平台管理行为，支持对象追踪、变更差异比对和审计导出。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={createExportJob} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/15">
            <Download className="h-4 w-4" />
            导出当前筛选
          </button>
          <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="日志总量" value={overview.totalEvents.toLocaleString()} desc={`保留 ${overview.retentionDays} 天`} icon={FileSearch} tone="text-cyan-300" />
        <KpiCard label="风险事件" value={overview.riskyEvents} desc="高风险与中风险待复核" icon={ShieldAlert} tone="text-red-300" />
        <KpiCard label="失败操作" value={overview.failedEvents} desc="失败、拦截和异常请求" icon={AlertTriangle} tone="text-amber-300" />
        <KpiCard label="活跃账号" value={overview.activeOperators} desc={`${overview.exportedJobs} 个导出任务`} icon={UserRoundCog} tone="text-blue-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <FileSearch className="h-4 w-4 text-cyan-300" />
                操作记录
              </h2>
              <p className="mt-1 text-xs text-slate-500">按账号、模块、对象和操作内容检索审计日志。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchEvents();
                  }}
                  placeholder="搜索账号、对象、操作"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as "all" | RiskLevel)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部风险</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="normal">常规</option>
              </select>
              <select value={resultFilter} onChange={(event) => setResultFilter(event.target.value as "all" | EventResult)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部结果</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
                <option value="blocked">已拦截</option>
              </select>
              <button onClick={searchEvents} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                <Filter className="h-4 w-4" />
                筛选
              </button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {filteredEvents.map((event) => {
              const result = resultConfig[event.result];
              const risk = riskConfig[event.risk];
              const selected = selectedEvent?.id === event.id;
              return (
                <article
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : risk.border}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${result.bg} ${result.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${result.dot}`} />
                      {result.label}
                    </span>
                    <span className={`rounded px-2 py-1 text-xs ${risk.bg} ${risk.color}`}>{risk.label}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${statusConfig[event.status].bg} ${statusConfig[event.status].color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[event.status].dot}`} />
                      {statusConfig[event.status].label}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-white">{event.action}</h3>
                  <div className="mt-1 text-xs text-slate-500">{event.module} · {event.objectType}</div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{event.detail}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="操作人" value={`${event.operator} / ${event.account}`} />
                    <Metric label="对象" value={event.objectName} />
                    <Metric label="来源 IP" value={event.ip} />
                    <Metric label="时间" value={event.occurredAt} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <GitCompare className="h-4 w-4 text-cyan-300" />
              当前事件
            </h2>
            <p className="mt-1 text-xs text-slate-500">查看选中事件的处置状态、风险结构和变更证据。</p>
          </div>
          {selectedEvent ? (
            <div className="space-y-4 p-4">
              <div className={`rounded-lg border bg-slate-950/60 p-4 ${riskConfig[selectedEvent.risk].border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{selectedEvent.objectName}</h3>
                    <div className="mt-1 text-xs text-slate-500">{selectedEvent.operator} · {selectedEvent.occurredAt}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs ${riskConfig[selectedEvent.risk].bg} ${riskConfig[selectedEvent.risk].color}`}>
                    {riskConfig[selectedEvent.risk].label}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{selectedEvent.detail}</p>
                {selectedEvent.status !== "closed" && (
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => changeEventStatus(selectedEvent, "reviewing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">复核中</button>
                    <button onClick={() => changeEventStatus(selectedEvent, "closed")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      关闭
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <ShieldAlert className="h-4 w-4 text-blue-300" />
                  风险分布
                </h3>
                <div className="mt-4 space-y-3">
                  {riskSummary.map((item) => {
                    const config = riskConfig[item.risk];
                    return (
                      <div key={item.risk}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={config.color}>{config.label}</span>
                          <span className="font-semibold text-white">{item.count}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxRiskCount) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">请选择一条操作日志</div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Archive className="h-4 w-4 text-cyan-300" />
              对象追踪
            </h2>
            <p className="mt-1 text-xs text-slate-500">按对象聚合最近操作、责任团队和风险等级。</p>
          </div>
          <div className="space-y-3 p-4">
            {objects.map((object) => {
              const risk = riskConfig[object.riskLevel];
              return (
                <article key={object.id} className={`rounded-lg border bg-slate-950/60 p-4 ${risk.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{object.objectName}</h3>
                      <div className="mt-1 text-xs text-slate-500">{object.objectType} · {object.owner}</div>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs ${risk.bg} ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="事件数" value={object.eventCount} />
                    <Metric label="最近操作" value={object.lastAction} />
                    <Metric label="操作人" value={object.lastOperator} />
                    <Metric label="时间" value={object.lastOccurredAt} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Diff className="h-4 w-4 text-blue-300" />
              差异对比
            </h2>
            <p className="mt-1 text-xs text-slate-500">展示选中事件关联的字段级变更差异和影响说明。</p>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {selectedDiffs.length > 0 ? selectedDiffs.map((diff) => (
              <article key={diff.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-mono text-sm font-medium text-white">{diff.field}</h3>
                    <div className="mt-1 text-xs text-slate-500">{diff.reviewer}</div>
                  </div>
                  <span className={diff.status === "approved" ? "rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300" : "rounded bg-amber-500/15 px-2 py-1 text-xs text-amber-300"}>
                    {diff.status === "approved" ? "已确认" : "待确认"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs">
                  <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-red-100">
                    <div className="mb-1 text-[10px] text-red-300">变更前</div>
                    {diff.before}
                  </div>
                  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-100">
                    <div className="mb-1 text-[10px] text-emerald-300">变更后</div>
                    {diff.after}
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{diff.impact}</p>
              </article>
            )) : (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500 lg:col-span-2">
                当前事件暂无字段级差异
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <Download className="h-4 w-4 text-cyan-300" />
            审计导出
          </h2>
          <p className="mt-1 text-xs text-slate-500">管理操作日志导出任务，用于审计留存、合规提交和问题追溯。</p>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {exports.map((item) => {
            const status = exportStatusConfig[item.status];
            return (
              <article key={item.id} className={`rounded-lg border bg-slate-950/60 p-4 ${status.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{item.name}</h3>
                    <div className="mt-1 text-xs text-slate-500">{item.createdBy} · {item.createdAt}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{item.scope}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="格式" value={item.format} />
                  <Metric label="行数" value={item.rows.toLocaleString()} />
                </div>
                {item.status === "finished" && (
                  <div className="mt-3 flex justify-end">
                    <button className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20">
                      <Download className="h-3.5 w-3.5" />
                      下载
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  desc,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  desc: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{desc}</div>
        </div>
        <div className={`rounded-lg border border-slate-700 bg-slate-950 p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-slate-200">{value}</div>
    </div>
  );
}
