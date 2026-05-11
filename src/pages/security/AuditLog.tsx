import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  FileClock,
  FileSearch,
  Filter,
  KeyRound,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  createAuditLogExport,
  fetchAuditLogEvents,
  fetchAuditLogExports,
  fetchAuditLogOverview,
  fetchAuditLogRetentionPolicies,
  fetchAuditLogRisks,
  updateAuditLogRiskStatus,
} from "../../services/api";

type AuditResult = "allowed" | "blocked" | "reviewing";
type RiskLevel = "high" | "medium" | "low";
type RiskStatus = "open" | "reviewing" | "closed";
type ExportStatus = "ready" | "running" | "failed";
type RetentionStatus = "enabled" | "disabled";

interface AuditOverview {
  todayEvents: number;
  riskEvents: number;
  exportEvents: number;
  retainedDays: number;
  traceCoverage: number;
  abnormalRate: number;
}

interface AuditEvent {
  id: string;
  time: string;
  actor: string;
  department: string;
  action: string;
  objectName: string;
  objectType: string;
  source: string;
  level: "L2" | "L3" | "L4";
  result: AuditResult;
  risk: RiskLevel;
  ip: string;
  detail: string;
  traceId: string;
}

interface AuditRisk {
  id: string;
  eventId: string;
  title: string;
  severity: RiskLevel;
  owner: string;
  status: RiskStatus;
  detectedAt: string;
  evidence: string;
}

interface AuditExport {
  id: string;
  name: string;
  scope: string;
  requester: string;
  format: string;
  status: ExportStatus;
  createdAt: string;
  expiresAt: string;
}

interface RetentionPolicy {
  id: string;
  name: string;
  scope: string;
  retentionDays: number;
  storage: string;
  owner: string;
  status: RetentionStatus;
}

const resultConfig: Record<AuditResult, { label: string; color: string; bg: string; dot: string }> = {
  allowed: { label: "已放行", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  blocked: { label: "已阻断", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  reviewing: { label: "复核中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高风险", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中风险", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低风险", color: "text-slate-300", bg: "bg-slate-500/15", border: "border-slate-500/30" },
};

const riskStatusConfig: Record<RiskStatus, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: "待处理", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  reviewing: { label: "处置中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  closed: { label: "已关闭", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
};

const exportStatusConfig: Record<ExportStatus, { label: string; color: string; bg: string; dot: string }> = {
  ready: { label: "可下载", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  running: { label: "生成中", color: "text-cyan-300", bg: "bg-cyan-500/15", dot: "bg-cyan-400" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
};

const levelConfig: Record<AuditEvent["level"], { color: string; bg: string; border: string }> = {
  L2: { color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  L3: { color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  L4: { color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
};

export default function AuditLog() {
  const [overview, setOverview] = useState<AuditOverview | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [risks, setRisks] = useState<AuditRisk[]>([]);
  const [exports, setExports] = useState<AuditExport[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedResult, setSelectedResult] = useState<"all" | AuditResult>("all");
  const [selectedRisk, setSelectedRisk] = useState<"all" | RiskLevel>("all");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, eventData, riskData, exportData, policyData] = await Promise.all([
        fetchAuditLogOverview(),
        fetchAuditLogEvents({
          keyword,
          result: selectedResult,
          risk: selectedRisk,
        }),
        fetchAuditLogRisks(),
        fetchAuditLogExports(),
        fetchAuditLogRetentionPolicies(),
      ]);
      setOverview(overviewData);
      setEvents(eventData);
      setRisks(riskData);
      setExports(exportData);
      setRetentionPolicies(policyData);
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
      if (selectedResult !== "all" && event.result !== selectedResult) return false;
      if (selectedRisk !== "all" && event.risk !== selectedRisk) return false;
      if (keyword) {
        const text = `${event.actor} ${event.department} ${event.action} ${event.objectName} ${event.source} ${event.traceId}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, keyword, selectedResult, selectedRisk]);

  const actionSummary = useMemo(() => {
    const map = new Map<string, number>();
    filteredEvents.forEach((event) => map.set(event.action, (map.get(event.action) ?? 0) + 1));
    return Array.from(map.entries()).map(([action, count]) => ({ action, count }));
  }, [filteredEvents]);

  const maxActionCount = Math.max(...actionSummary.map((item) => item.count), 1);

  const searchEvents = async () => {
    const eventData = await fetchAuditLogEvents({
      keyword,
      result: selectedResult,
      risk: selectedRisk,
    });
    setEvents(eventData);
  };

  const updateRiskStatus = async (risk: AuditRisk, status: RiskStatus) => {
    const updated = await updateAuditLogRiskStatus(risk.id, status);
    setRisks((prev) => prev.map((item) => (item.id === risk.id ? updated : item)));
  };

  const createExport = async () => {
    const created = await createAuditLogExport({
      name: keyword ? `审计检索导出 - ${keyword}` : "审计日志检索导出",
      scope: selectedRisk === "all" ? "当前审计检索条件" : `${riskConfig[selectedRisk].label}事件`,
      requester: "安全合规组",
      format: "CSV",
    });
    setExports((prev) => [created, ...prev]);
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载审计日志...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据安全" }, { label: "审计日志" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            审计日志
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              追踪覆盖 {overview.traceCoverage}%
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            汇聚数据访问、授权、导出和策略变更行为，提供可检索、可追踪、可导出的安全审计证据链。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={createExport} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/15">
            <Download className="h-4 w-4" />
            生成导出
          </button>
          <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="今日事件" value={overview.todayEvents.toLocaleString()} desc={`异常率 ${overview.abnormalRate}%`} icon={FileClock} tone="text-cyan-300" />
        <KpiCard label="风险事件" value={overview.riskEvents} desc="需要安全复核" icon={ShieldAlert} tone="text-red-300" />
        <KpiCard label="导出事件" value={overview.exportEvents} desc="含审计报表导出" icon={Download} tone="text-amber-300" />
        <KpiCard label="保留周期" value={`${overview.retainedDays} 天`} desc="核心敏感访问日志" icon={Archive} tone="text-blue-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <FileSearch className="h-4 w-4 text-cyan-300" />
                审计事件检索
              </h2>
              <p className="mt-1 text-xs text-slate-500">按账号、对象、动作、风险等级和处理结果检索数据行为。</p>
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
                  placeholder="搜索账号、对象、链路 ID"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedResult} onChange={(event) => setSelectedResult(event.target.value as "all" | AuditResult)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部结果</option>
                <option value="allowed">已放行</option>
                <option value="blocked">已阻断</option>
                <option value="reviewing">复核中</option>
              </select>
              <select value={selectedRisk} onChange={(event) => setSelectedRisk(event.target.value as "all" | RiskLevel)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部风险</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
              <button onClick={searchEvents} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                <Filter className="h-4 w-4" />
                筛选
              </button>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {filteredEvents.map((event) => {
              const result = resultConfig[event.result];
              const risk = riskConfig[event.risk];
              const level = levelConfig[event.level];
              return (
                <article key={event.id} className={`rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${level.border}`}>
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{event.level}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${result.bg} ${result.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${result.dot}`} />
                          {result.label}
                        </span>
                        <span className={`rounded px-2 py-1 text-xs ${risk.bg} ${risk.color}`}>{risk.label}</span>
                        <h3 className="text-sm font-medium text-white">{event.action}</h3>
                      </div>
                      <div className="mt-2 break-all font-mono text-xs text-cyan-100">{event.objectName}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {event.actor} · {event.department} · {event.source} · {event.ip}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 xl:text-right">
                      <div>{event.time}</div>
                      <div className="mt-1 font-mono text-slate-400">{event.traceId}</div>
                    </div>
                  </div>
                  <p className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">{event.detail}</p>
                </article>
              );
            })}
            {filteredEvents.length === 0 && <div className="py-10 text-center text-sm text-slate-500">当前条件下没有审计事件</div>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              风险处置
            </h2>
            <p className="mt-1 text-xs text-slate-500">将异常访问、越权导出和高频敏感查询纳入闭环。</p>
          </div>
          <div className="space-y-3 p-4">
            {risks.map((risk) => {
              const severity = riskConfig[risk.severity];
              const status = riskStatusConfig[risk.status];
              return (
                <article key={risk.id} className={`rounded-lg border bg-slate-950/60 p-3 ${severity.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${severity.bg} ${severity.color}`}>{severity.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{risk.title}</h3>
                      <div className="mt-1 text-xs text-slate-500">{risk.owner} · {risk.detectedAt}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{risk.evidence}</p>
                  {risk.status !== "closed" && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => updateRiskStatus(risk, "reviewing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">处置中</button>
                      <button onClick={() => updateRiskStatus(risk, "closed")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        关闭
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Download className="h-4 w-4 text-cyan-300" />
              审计导出任务
            </h2>
            <p className="mt-1 text-xs text-slate-500">管理面向合规、内控和问题追踪的审计证据包。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {exports.map((item) => {
              const status = exportStatusConfig[item.status];
              return (
                <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <h3 className="mt-2 text-sm font-medium text-white">{item.name}</h3>
                      <div className="mt-1 text-xs text-slate-500">{item.requester} · {item.format}</div>
                    </div>
                    <button disabled={item.status !== "ready"} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                      {item.status === "ready" ? <Download className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{item.scope}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="创建时间" value={item.createdAt} />
                    <Metric label="过期时间" value={item.expiresAt} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Archive className="h-4 w-4 text-blue-300" />
              留存策略
            </h2>
            <p className="mt-1 text-xs text-slate-500">按日志类型配置热存储、归档和留存周期。</p>
          </div>
          <div className="space-y-3 p-4">
            {retentionPolicies.map((policy) => (
              <article key={policy.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                        {policy.status === "enabled" ? "已启用" : "已停用"}
                      </span>
                      <h3 className="text-sm font-medium text-white">{policy.name}</h3>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{policy.owner} · {policy.storage}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">{policy.retentionDays}</div>
                    <div className="text-[11px] text-slate-500">天</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{policy.scope}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <KeyRound className="h-4 w-4 text-cyan-300" />
            动作分布
          </h2>
          <p className="mt-1 text-xs text-slate-500">基于当前检索结果统计关键数据行为类型。</p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          {actionSummary.map((item) => (
            <div key={item.action} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-200">{item.action}</span>
                <span className="font-semibold text-white">{item.count}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxActionCount) * 100}%` }} />
              </div>
            </div>
          ))}
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
