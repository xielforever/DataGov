import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchQualityMonitorAlerts,
  fetchQualityMonitorOverview,
  fetchQualityMonitorRuleHealth,
  fetchQualityMonitorTrends,
  updateQualityMonitorAlertStatus,
} from "../../services/api";

type AlertSeverity = "critical" | "high" | "medium" | "low";
type AlertStatus = "open" | "acknowledged" | "resolved";
type RuleHealthStatus = "healthy" | "warning" | "risk";
type TrendDirection = "up" | "down" | "flat";

interface MonitorOverview {
  qualityScore: number;
  scoreChange: number;
  activeAlerts: number;
  affectedTables: number;
  slaRate: number;
  successRate: number;
  monitoredTables: number;
  runningChecks: number;
}

interface MonitorTrend {
  time: string;
  score: number;
  alerts: number;
  issueCount: number;
}

interface MonitorAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  domain: string;
  affectedObject: string;
  owner: string;
  firstSeen: string;
  lastSeen: string;
  issueCount: number;
  suggestion: string;
}

interface RuleHealth {
  id: string;
  code: string;
  name: string;
  domain: string;
  owner: string;
  passRate: number;
  issueTrend: TrendDirection;
  issueCount: number;
  lastRun: string;
  status: RuleHealthStatus;
}

const severityConfig: Record<AlertSeverity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "严重", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  high: { label: "高", color: "text-orange-300", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  medium: { label: "中", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低", color: "text-slate-300", bg: "bg-slate-500/15", border: "border-slate-500/30" },
};

const alertStatusConfig: Record<AlertStatus, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: "待确认", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  acknowledged: { label: "处理中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  resolved: { label: "已解决", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
};

const healthConfig: Record<RuleHealthStatus, { label: string; color: string; bg: string; dot: string }> = {
  healthy: { label: "健康", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  warning: { label: "波动", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  risk: { label: "风险", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
};

const trendLabel: Record<TrendDirection, string> = {
  up: "上升",
  down: "下降",
  flat: "持平",
};

export default function QualityMonitor() {
  const [overview, setOverview] = useState<MonitorOverview | null>(null);
  const [trends, setTrends] = useState<MonitorTrend[]>([]);
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [ruleHealth, setRuleHealth] = useState<RuleHealth[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("全部");
  const [selectedAlertStatus, setSelectedAlertStatus] = useState<"all" | AlertStatus>("all");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, trendData, alertData, healthData] = await Promise.all([
        fetchQualityMonitorOverview(),
        fetchQualityMonitorTrends(),
        fetchQualityMonitorAlerts(),
        fetchQualityMonitorRuleHealth(),
      ]);
      setOverview(overviewData);
      setTrends(trendData);
      setAlerts(alertData);
      setRuleHealth(healthData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const domains = useMemo(
    () => ["全部", ...Array.from(new Set([...alerts.map((item) => item.domain), ...ruleHealth.map((item) => item.domain)]))],
    [alerts, ruleHealth],
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedDomain !== "全部" && alert.domain !== selectedDomain) return false;
      if (selectedAlertStatus !== "all" && alert.status !== selectedAlertStatus) return false;
      return true;
    });
  }, [alerts, selectedAlertStatus, selectedDomain]);

  const filteredRuleHealth = useMemo(() => {
    return ruleHealth.filter((rule) => selectedDomain === "全部" || rule.domain === selectedDomain);
  }, [ruleHealth, selectedDomain]);

  const domainSummary = useMemo(() => {
    return domains
      .filter((domain) => domain !== "全部")
      .map((domain) => {
        const domainRules = ruleHealth.filter((rule) => rule.domain === domain);
        const domainAlerts = alerts.filter((alert) => alert.domain === domain && alert.status !== "resolved");
        const avgPassRate = domainRules.length ? domainRules.reduce((sum, rule) => sum + rule.passRate, 0) / domainRules.length : 0;
        return { domain, avgPassRate, activeAlerts: domainAlerts.length };
      });
  }, [alerts, domains, ruleHealth]);

  const maxIssues = Math.max(...trends.map((item) => item.issueCount), 1);

  const changeAlertStatus = async (alert: MonitorAlert, status: AlertStatus) => {
    const updated = await updateQualityMonitorAlertStatus(alert.id, status);
    setAlerts((prev) => prev.map((item) => (item.id === alert.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载质量监控...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据质量" }, { label: "质量监控" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            质量监控
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {overview.runningChecks} 个运行中
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            汇总质量规则运行健康度、数据集告警、质量趋势和 SLA 达成情况，支撑值班巡检、异常确认和问题闭环。
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          刷新监控
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="当前质量分" value={overview.qualityScore.toFixed(1)} desc={`较昨日 ${overview.scoreChange >= 0 ? "+" : ""}${overview.scoreChange}`} icon={Gauge} tone="text-cyan-300" />
        <KpiCard label="活跃告警" value={overview.activeAlerts} desc="待确认与处理中" icon={BellRing} tone="text-rose-300" />
        <KpiCard label="影响数据表" value={overview.affectedTables} desc={`${overview.monitoredTables} 张表纳入监控`} icon={Database} tone="text-amber-300" />
        <KpiCard label="SLA 达成率" value={`${overview.slaRate}%`} desc={`运行成功率 ${overview.successRate}%`} icon={ShieldCheck} tone="text-emerald-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <Activity className="h-4 w-4 text-cyan-300" />
                质量趋势
              </h2>
              <p className="mt-1 text-xs text-slate-500">按最近 8 个监控窗口展示质量分、告警数和问题量变化。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    selectedDomain === domain
                      ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                      : "border border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <div className="flex h-72 items-end gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                {trends.map((item) => (
                  <div key={item.time} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-48 w-full items-end justify-center gap-1">
                      <div className="w-3 rounded-t bg-cyan-400/80" style={{ height: `${Math.max(18, item.score)}%` }} title={`质量分 ${item.score}`} />
                      <div className="w-3 rounded-t bg-rose-400/80" style={{ height: `${Math.max(8, (item.issueCount / maxIssues) * 100)}%` }} title={`问题量 ${item.issueCount}`} />
                    </div>
                    <div className="truncate text-[11px] text-slate-500">{item.time}</div>
                    <div className="text-[11px] text-slate-300">{item.score}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" />质量分</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />问题量</span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">业务域热度</h3>
              {domainSummary.map((item) => (
                <div key={item.domain} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{item.domain}</span>
                    <span className={item.activeAlerts > 0 ? "text-amber-300" : "text-emerald-300"}>{item.activeAlerts} 告警</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${item.avgPassRate >= 99 ? "bg-emerald-400" : item.avgPassRate >= 98 ? "bg-amber-400" : "bg-rose-400"}`}
                      style={{ width: `${Math.min(item.avgPassRate, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">平均通过率 {item.avgPassRate.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                活跃告警
              </h2>
              <p className="mt-1 text-xs text-slate-500">按严重级别和发现时间排序。</p>
            </div>
            <select
              value={selectedAlertStatus}
              onChange={(event) => setSelectedAlertStatus(event.target.value as "all" | AlertStatus)}
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">全部状态</option>
              <option value="open">待确认</option>
              <option value="acknowledged">处理中</option>
              <option value="resolved">已解决</option>
            </select>
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-3">
            {filteredAlerts.map((alert) => {
              const severity = severityConfig[alert.severity];
              const status = alertStatusConfig[alert.status];
              return (
                <article key={alert.id} className={`rounded-lg border bg-slate-950/60 p-3 ${severity.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${severity.bg} ${severity.color}`}>{severity.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium leading-5 text-white">{alert.title}</h3>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-semibold text-white">{alert.issueCount}</div>
                      <div className="text-[11px] text-slate-500">问题</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <div className="break-all font-mono text-cyan-100">{alert.affectedObject}</div>
                    <div>{alert.domain} · {alert.owner} · {alert.lastSeen}</div>
                    <div className="rounded-md border border-slate-800 bg-slate-900 p-2 leading-5 text-slate-400">{alert.suggestion}</div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    {alert.status === "open" && (
                      <button onClick={() => changeAlertStatus(alert, "acknowledged")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">
                        确认
                      </button>
                    )}
                    {alert.status !== "resolved" && (
                      <button onClick={() => changeAlertStatus(alert, "resolved")} className="rounded-md px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10">
                        解决
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {filteredAlerts.length === 0 && <div className="py-10 text-center text-sm text-slate-500">当前筛选条件下没有告警</div>}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            规则健康度
          </h2>
          <p className="mt-1 text-xs text-slate-500">监控核心质量规则的最近运行结果、问题趋势和责任归属。</p>
        </div>
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {filteredRuleHealth.map((rule) => {
            const health = healthConfig[rule.status];
            return (
              <article key={rule.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${health.bg} ${health.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${health.dot}`} />
                        {health.label}
                      </span>
                      <h3 className="text-sm font-medium text-white">{rule.name}</h3>
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">{rule.code}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs md:w-64">
                    <Metric label="通过率" value={`${rule.passRate}%`} />
                    <Metric label="问题数" value={rule.issueCount} />
                    <Metric label="趋势" value={trendLabel[rule.issueTrend]} />
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${rule.passRate >= 99 ? "bg-emerald-400" : rule.passRate >= 98 ? "bg-amber-400" : "bg-rose-400"}`}
                    style={{ width: `${Math.min(rule.passRate, 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{rule.domain} · {rule.owner}</span>
                  <span className="inline-flex items-center gap-1">
                    <TrendIcon direction={rule.issueTrend} />
                    最近运行 {rule.lastRun}
                  </span>
                </div>
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
  icon: typeof Gauge;
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
      <div className="mt-1 font-semibold text-slate-200">{value}</div>
    </div>
  );
}

function TrendIcon({ direction }: { direction: TrendDirection }) {
  if (direction === "up") return <TrendingUp className="h-3.5 w-3.5 text-rose-300" />;
  if (direction === "down") return <TrendingDown className="h-3.5 w-3.5 text-emerald-300" />;
  return <Clock3 className="h-3.5 w-3.5 text-slate-400" />;
}
