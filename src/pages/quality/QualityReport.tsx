import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Gauge,
  Layers3,
  PieChart,
  Plus,
  RefreshCw,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  createQualityReport,
  exportQualityReport,
  fetchQualityReportDomains,
  fetchQualityReportIssues,
  fetchQualityReportOverview,
  fetchQualityReportRemediation,
  fetchQualityReportReports,
  fetchQualityReportTrends,
} from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type ReportStatus = "generated" | "generating" | "failed";
type PeriodType = "day" | "week" | "month";

interface ReportOverview {
  score: number;
  scoreChange: number;
  totalIssues: number;
  resolvedIssues: number;
  newIssues: number;
  reportCount: number;
  coverageRate: number;
  avgResolveHours: number;
}

interface ReportTrend {
  period: string;
  score: number;
  issues: number;
  resolved: number;
}

interface DomainScore {
  domain: string;
  score: number;
  issueCount: number;
  resolvedRate: number;
  owner: string;
}

interface IssueDistribution {
  category: string;
  count: number;
  ratio: number;
  severity: "高" | "中" | "低";
}

interface RemediationItem {
  name: string;
  value: number;
  target: number;
  unit: string;
}

interface QualityReportItem {
  id: string;
  name: string;
  periodType: PeriodType;
  period: string;
  scope: string;
  score: number;
  issueCount: number;
  resolvedRate: number;
  creator: string;
  createdAt: string;
  status: ReportStatus;
}

const periodOptions: Array<{ label: string; value: "all" | PeriodType }> = [
  { label: "全部周期", value: "all" },
  { label: "日报", value: "day" },
  { label: "周报", value: "week" },
  { label: "月报", value: "month" },
];

const periodLabel: Record<PeriodType, string> = {
  day: "日报",
  week: "周报",
  month: "月报",
};

const statusConfig: Record<ReportStatus, { label: string; color: string; bg: string; dot: string }> = {
  generated: { label: "已生成", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  generating: { label: "生成中", color: "text-cyan-300", bg: "bg-cyan-500/15", dot: "bg-cyan-400" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
};

const severityConfig: Record<IssueDistribution["severity"], { color: string; bg: string }> = {
  高: { color: "text-red-300", bg: "bg-red-500/15" },
  中: { color: "text-amber-300", bg: "bg-amber-500/15" },
  低: { color: "text-slate-300", bg: "bg-slate-500/15" },
};

export default function QualityReport() {
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [trends, setTrends] = useState<ReportTrend[]>([]);
  const [domains, setDomains] = useState<DomainScore[]>([]);
  const [issues, setIssues] = useState<IssueDistribution[]>([]);
  const [remediation, setRemediation] = useState<RemediationItem[]>([]);
  const [reports, setReports] = useState<QualityReportItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | PeriodType>("all");
  const [selectedScope, setSelectedScope] = useState("全部");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, trendData, domainData, issueData, remediationData, reportData] = await Promise.all([
        fetchQualityReportOverview(),
        fetchQualityReportTrends(),
        fetchQualityReportDomains(),
        fetchQualityReportIssues(),
        fetchQualityReportRemediation(),
        fetchQualityReportReports(),
      ]);
      setOverview(overviewData);
      setTrends(trendData);
      setDomains(domainData);
      setIssues(issueData);
      setRemediation(remediationData);
      setReports(reportData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const scopes = useMemo(() => ["全部", ...Array.from(new Set(reports.map((report) => report.scope)))], [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (selectedPeriod !== "all" && report.periodType !== selectedPeriod) return false;
      if (selectedScope !== "全部" && report.scope !== selectedScope) return false;
      return true;
    });
  }, [reports, selectedPeriod, selectedScope]);

  const maxTrendIssues = Math.max(...trends.map((item) => item.issues), 1);
  const maxDomainIssues = Math.max(...domains.map((item) => item.issueCount), 1);

  const generateReport = async () => {
    const created = await createQualityReport({
      periodType: selectedPeriod === "all" ? "week" : selectedPeriod,
      scope: selectedScope === "全部" ? "全域" : selectedScope,
    });
    setReports((prev) => [created, ...prev]);
  };

  const exportReport = async (report: QualityReportItem) => {
    await exportQualityReport(report.id);
  };

  if (error) {
    return <ErrorFallback onRetry={loadData} />;
  }
  if (loading || !overview) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据质量" }, { label: "质量报告" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            质量报告
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {overview.reportCount} 份报告
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            汇总周期质量评分、问题分布、业务域健康度和治理成效，为质量复盘、管理汇报和整改跟踪提供依据。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
          <button onClick={generateReport} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
            <Plus className="h-4 w-4" />
            生成报告
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="综合质量分" value={overview.score.toFixed(1)} desc={`较上期 ${overview.scoreChange >= 0 ? "+" : ""}${overview.scoreChange}`} icon={Gauge} tone="text-cyan-300" />
        <KpiCard label="问题总数" value={overview.totalIssues} desc={`新增 ${overview.newIssues} 项`} icon={PieChart} tone="text-amber-300" />
        <KpiCard label="已治理问题" value={overview.resolvedIssues} desc={`覆盖率 ${overview.coverageRate}%`} icon={CheckCircle2} tone="text-emerald-300" />
        <KpiCard label="平均解决时长" value={`${overview.avgResolveHours}h`} desc="从发现到关闭" icon={TimerReset} tone="text-blue-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <BarChart3 className="h-4 w-4 text-cyan-300" />
              周期评分趋势
            </h2>
            <p className="mt-1 text-xs text-slate-500">展示近 8 个报告周期的质量分、问题量和治理关闭量。</p>
          </div>
          <div className="p-4">
            <div className="flex h-72 items-end gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              {trends.map((item) => (
                <div key={item.period} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-48 w-full items-end justify-center gap-1.5">
                    <div className="w-3 rounded-t bg-cyan-400/80" style={{ height: `${Math.max(18, item.score)}%` }} title={`质量分 ${item.score}`} />
                    <div className="w-3 rounded-t bg-amber-400/80" style={{ height: `${Math.max(8, (item.issues / maxTrendIssues) * 100)}%` }} title={`问题 ${item.issues}`} />
                    <div className="w-3 rounded-t bg-emerald-400/80" style={{ height: `${Math.max(8, (item.resolved / maxTrendIssues) * 100)}%` }} title={`关闭 ${item.resolved}`} />
                  </div>
                  <div className="truncate text-[11px] text-slate-500">{item.period}</div>
                  <div className="text-[11px] text-slate-300">{item.score}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <Legend color="bg-cyan-400" label="质量分" />
              <Legend color="bg-amber-400" label="问题量" />
              <Legend color="bg-emerald-400" label="已关闭" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <PieChart className="h-4 w-4 text-amber-300" />
              问题分布
            </h2>
            <p className="mt-1 text-xs text-slate-500">按质量维度聚合当前周期问题。</p>
          </div>
          <div className="space-y-3 p-4">
            {issues.map((issue) => {
              const severity = severityConfig[issue.severity];
              return (
                <div key={issue.category} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${severity.bg} ${severity.color}`}>{issue.severity}</span>
                        <span className="text-sm font-medium text-white">{issue.category}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">占比 {issue.ratio}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{issue.count}</div>
                      <div className="text-[11px] text-slate-500">项</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${issue.ratio}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Layers3 className="h-4 w-4 text-cyan-300" />
              业务域评分
            </h2>
            <p className="mt-1 text-xs text-slate-500">对比各业务域质量分、问题量和整改关闭率。</p>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {domains.map((domain) => (
              <article key={domain.domain} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{domain.domain}</h3>
                    <div className="mt-1 text-xs text-slate-500">{domain.owner}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold text-white">{domain.score}</div>
                    <div className="text-[11px] text-slate-500">质量分</div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={domain.score >= 99 ? "h-full rounded-full bg-emerald-400" : domain.score >= 98 ? "h-full rounded-full bg-amber-400" : "h-full rounded-full bg-rose-400"} style={{ width: `${Math.min(domain.score, 100)}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="问题数" value={domain.issueCount} />
                  <Metric label="关闭率" value={`${domain.resolvedRate}%`} />
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(domain.issueCount / maxDomainIssues) * 100}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
              治理成效
            </h2>
            <p className="mt-1 text-xs text-slate-500">跟踪质量治理关键成效指标。</p>
          </div>
          <div className="space-y-4 p-4">
            {remediation.map((item) => {
              const percent = Math.min((item.value / item.target) * 100, 100);
              return (
                <div key={item.name} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-200">{item.name}</span>
                    <span className="text-sm font-semibold text-white">{item.value}{item.unit}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className={percent >= 100 ? "h-full rounded-full bg-emerald-400" : "h-full rounded-full bg-cyan-400"} style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">目标 {item.target}{item.unit}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <FileText className="h-4 w-4 text-cyan-300" />
              报告列表
            </h2>
            <p className="mt-1 text-xs text-slate-500">管理周期报告生成状态、覆盖范围和导出动作。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`rounded-md px-2.5 py-1 text-xs transition ${
                  selectedPeriod === option.value
                    ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "border border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
            <select value={selectedScope} onChange={(event) => setSelectedScope(event.target.value)} className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none">
              {scopes.map((scope) => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {filteredReports.map((report) => {
            const status = statusConfig[report.status];
            return (
              <article key={report.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <span className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{periodLabel[report.periodType]}</span>
                      <h3 className="text-sm font-medium text-white">{report.name}</h3>
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">{report.id} · {report.period} · {report.scope}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs lg:w-72">
                    <Metric label="质量分" value={report.score} />
                    <Metric label="问题数" value={report.issueCount} />
                    <Metric label="关闭率" value={`${report.resolvedRate}%`} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{report.creator} · {report.createdAt}</span>
                  <button
                    disabled={report.status !== "generated"}
                    onClick={() => exportReport(report)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:text-slate-600"
                  >
                    <Download className="h-3.5 w-3.5" />
                    导出
                  </button>
                </div>
              </article>
            );
          })}
          {filteredReports.length === 0 && <div className="py-10 text-center text-sm text-slate-500">当前筛选条件下没有报告</div>}
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
