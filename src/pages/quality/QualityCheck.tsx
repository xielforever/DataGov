import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileWarning,
  ListChecks,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  Timer,
  X,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import { createQualityCheckBatch, fetchQualityCheckBatches, fetchQualityCheckIssues, fetchQualityRules, updateQualityIssueStatus } from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type BatchStatus = "success" | "running" | "warning" | "failed";
type IssueStatus = "pending" | "processing" | "resolved" | "ignored";
type Severity = "高" | "中" | "低";

interface QualityCheckBatch {
  id: string;
  name: string;
  scope: string;
  triggerType: string;
  status: BatchStatus;
  ruleCount: number;
  tableCount: number;
  issueCount: number;
  owner: string;
  startTime: string;
  endTime: string;
  duration: string;
  passRate: number;
  description: string;
}

interface QualityIssue {
  id: string;
  batchId: string;
  ruleCode: string;
  ruleName: string;
  severity: Severity;
  status: IssueStatus;
  domain: string;
  tableName: string;
  fieldName: string;
  issueCount: number;
  sampleValue: string;
  owner: string;
  discoveredAt: string;
  suggestion: string;
}

interface QualityRuleOption {
  id: string;
  code: string;
  name: string;
  status: string;
  domain: string;
  severity?: string;
}

const batchStatusConfig: Record<BatchStatus, { label: string; color: string; bg: string; dot: string }> = {
  success: { label: "成功", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  running: { label: "运行中", color: "text-cyan-300", bg: "bg-cyan-500/15", dot: "bg-cyan-400" },
  warning: { label: "有异常", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
};

const issueStatusConfig: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "待处理", color: "text-red-300", bg: "bg-red-500/15" },
  processing: { label: "处理中", color: "text-amber-300", bg: "bg-amber-500/15" },
  resolved: { label: "已解决", color: "text-emerald-300", bg: "bg-emerald-500/15" },
  ignored: { label: "已忽略", color: "text-slate-300", bg: "bg-slate-500/15" },
};

const severityConfig: Record<Severity, { color: string; bg: string }> = {
  高: { color: "text-red-300", bg: "bg-red-500/15" },
  中: { color: "text-amber-300", bg: "bg-amber-500/15" },
  低: { color: "text-slate-300", bg: "bg-slate-500/15" },
};

export default function QualityCheck() {
  const [batches, setBatches] = useState<QualityCheckBatch[]>([]);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [rules, setRules] = useState<QualityRuleOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | BatchStatus>("all");
  const [selectedIssueStatus, setSelectedIssueStatus] = useState<"all" | IssueStatus>("all");
  const [selectedScope, setSelectedScope] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runDraft, setRunDraft] = useState({
    name: "",
    scope: "交易域",
    owner: "张三丰",
    ruleMode: "enabled",
    description: "",
  });

  useEffect(() => {
    Promise.all([fetchQualityCheckBatches(), fetchQualityCheckIssues(), fetchQualityRules()])
      .then(([batchData, issueData, ruleData]) => {
        setBatches(batchData);
        setIssues(issueData);
        setRules(ruleData);
        setSelectedBatchId(batchData[0]?.id ?? "");
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const scopes = useMemo(() => ["全部", ...Array.from(new Set(batches.map((batch) => batch.scope)))], [batches]);
  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? batches[0];

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (selectedStatus !== "all" && batch.status !== selectedStatus) return false;
      if (selectedScope !== "全部" && batch.scope !== selectedScope) return false;
      if (keyword) {
        const text = `${batch.name} ${batch.id} ${batch.scope} ${batch.owner}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [batches, keyword, selectedScope, selectedStatus]);

  const currentIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedBatch?.id && issue.batchId !== selectedBatch.id) return false;
      if (selectedIssueStatus !== "all" && issue.status !== selectedIssueStatus) return false;
      return true;
    });
  }, [issues, selectedBatch?.id, selectedIssueStatus]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedSeverity]);


  const stats = useMemo(() => {
    const running = batches.filter((batch) => batch.status === "running").length;
    const failed = batches.filter((batch) => batch.status === "failed").length;
    const unresolved = issues.filter((issue) => issue.status === "pending" || issue.status === "processing").length;
    const highIssues = issues.filter((issue) => issue.severity === "高" && issue.status !== "resolved").reduce((sum, issue) => sum + issue.issueCount, 0);
    const finished = batches.filter((batch) => batch.status !== "running");
    const avgPassRate = finished.length ? finished.reduce((sum, batch) => sum + batch.passRate, 0) / finished.length : 0;
    return { total: batches.length, running, failed, unresolved, highIssues, avgPassRate };
  }, [batches, issues]);

  const openRunModal = () => {
    setRunDraft({
      name: `${selectedScope === "全部" ? "数据质量" : selectedScope}质量核查`,
      scope: selectedScope === "全部" ? "交易域" : selectedScope,
      owner: "张三丰",
      ruleMode: "enabled",
      description: "",
    });
    setRunModalOpen(true);
  };

  const startCheck = async () => {
    const matchedRules = rules.filter((rule) => {
      if (rule.status !== "enabled") return false;
      if (runDraft.scope !== "全部" && rule.domain !== runDraft.scope) return false;
      if (runDraft.ruleMode === "high" && rule.severity !== "高") return false;
      return true;
    });
    const enabledRuleCount = matchedRules.length;
    const created = await createQualityCheckBatch({
      ...runDraft,
      ruleCount: enabledRuleCount || rules.filter((rule) => rule.status === "enabled").length,
      tableCount: Math.max(1, Math.ceil(enabledRuleCount / 2)),
    });
    setBatches((prev) => [created, ...prev]);
    setSelectedBatchId(created.id);
    setRunModalOpen(false);
  };

  const updateIssueStatus = async (issue: QualityIssue, status: IssueStatus) => {
    const updated = await updateQualityIssueStatus(issue.id, status);
    setIssues((prev) => prev.map((item) => (item.id === issue.id ? updated : item)));
  };

  if (error) {
    return <ErrorFallback onRetry={() => window.location.reload()} />;
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据质量" }, { label: "质量核查" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            质量核查
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {stats.total} 个批次
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            按规则集发起质量核查，跟踪批次运行、规则命中、问题样本和整改状态，形成从规则到问题闭环的执行层。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
          <button
            onClick={openRunModal}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
          >
            <Play className="h-4 w-4" />
            发起核查
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "运行中批次", value: stats.running, desc: `${stats.failed} 个失败批次`, icon: Timer, tone: "text-cyan-300" },
          { label: "平均通过率", value: `${stats.avgPassRate.toFixed(2)}%`, desc: "已完成批次", icon: CheckCircle2, tone: "text-emerald-300" },
          { label: "待处理问题", value: stats.unresolved, desc: "待处理/处理中", icon: FileWarning, tone: "text-amber-300" },
          { label: "高风险命中", value: stats.highIssues, desc: "未解决记录数", icon: ShieldAlert, tone: "text-rose-300" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{stat.desc}</div>
                </div>
                <div className={`rounded-lg border border-slate-700 bg-slate-950 p-2 ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <ListChecks className="h-4 w-4 text-cyan-300" />
                核查批次
              </div>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as "all" | BatchStatus)}
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">全部状态</option>
                <option value="running">运行中</option>
                <option value="success">成功</option>
                <option value="warning">有异常</option>
                <option value="failed">失败</option>
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索批次、编号、负责人"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {scopes.map((scope) => (
                <button
                  key={scope}
                  onClick={() => setSelectedScope(scope)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    selectedScope === scope
                      ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                      : "border border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
            {paginatedFilteredBatches.map((batch) => {
              const status = batchStatusConfig[batch.status];
              const active = selectedBatch?.id === batch.id;
              return (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    active ? "border-cyan-500/50 bg-cyan-500/10" : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{batch.name}</div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">{batch.id}</div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <Metric label="规则" value={batch.ruleCount} />
                    <Metric label="问题" value={batch.issueCount} />
                    <Metric label="通过率" value={`${batch.passRate}%`} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{batch.scope}</span>
                    <span>{batch.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="min-w-0 space-y-4">
          {selectedBatch && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{selectedBatch.name}</h2>
                    <span className={`rounded-md px-2 py-1 text-xs ${batchStatusConfig[selectedBatch.status].bg} ${batchStatusConfig[selectedBatch.status].color}`}>
                      {batchStatusConfig[selectedBatch.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{selectedBatch.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 sm:grid-cols-4">
                  <Info label="触发方式" value={selectedBatch.triggerType} />
                  <Info label="负责人" value={selectedBatch.owner} />
                  <Info label="开始时间" value={selectedBatch.startTime} />
                  <Info label="结束时间" value={selectedBatch.endTime} />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">问题明细</h3>
                <p className="mt-1 text-xs text-slate-500">展示当前批次命中的规则问题、样本值、责任人和处理状态。</p>
              </div>
              <select
                value={selectedIssueStatus}
                onChange={(event) => setSelectedIssueStatus(event.target.value as "all" | IssueStatus)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">全部问题</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
                <option value="ignored">已忽略</option>
              </select>
            </div>
            <div className="space-y-3 p-4">
              {currentIssues.map((issue) => {
                const severity = severityConfig[issue.severity];
                const status = issueStatusConfig[issue.status];
                return (
                  <article key={issue.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] ${severity.bg} ${severity.color}`}>{issue.severity}</span>
                          <span className={`rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>{status.label}</span>
                          <h4 className="text-sm font-medium text-white">{issue.ruleName}</h4>
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-500">{issue.ruleCode}</div>
                        <div className="mt-2 text-xs text-slate-400">{issue.tableName}.{issue.fieldName}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs lg:w-56">
                        <Metric label="命中数" value={issue.issueCount} />
                        <Metric label="责任人" value={issue.owner} />
                        <Metric label="发现时间" value={issue.discoveredAt.slice(5, 16)} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
                      <div>
                        <div className="mb-1 text-xs text-slate-500">问题样本</div>
                        <div className="break-all rounded-md border border-slate-800 bg-slate-900 p-2 font-mono text-xs leading-5 text-cyan-100">
                          {issue.sampleValue}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-slate-500">处理建议</div>
                        <div className="rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">
                          {issue.suggestion}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      {issue.status !== "resolved" && (
                        <button onClick={() => updateIssueStatus(issue, "resolved")} className="rounded-md px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10">
                          标记解决
                        </button>
                      )}
                      {issue.status === "pending" && (
                        <button onClick={() => updateIssueStatus(issue, "processing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">
                          接手
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
              {currentIssues.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-500">
                  当前筛选下没有质量问题
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {runModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">发起质量核查</h3>
              <button onClick={() => setRunModalOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Field label="核查名称">
                <input value={runDraft.name} onChange={(event) => setRunDraft({ ...runDraft, name: event.target.value })} className={inputClass} />
              </Field>
              <Field label="核查范围">
                <select value={runDraft.scope} onChange={(event) => setRunDraft({ ...runDraft, scope: event.target.value })} className={inputClass}>
                  {scopes.filter((scope) => scope !== "全部").map((scope) => (
                    <option key={scope} value={scope}>{scope}</option>
                  ))}
                </select>
              </Field>
              <Field label="规则集">
                <select value={runDraft.ruleMode} onChange={(event) => setRunDraft({ ...runDraft, ruleMode: event.target.value })} className={inputClass}>
                  <option value="enabled">全部已启用规则</option>
                  <option value="high">高风险规则</option>
                  <option value="manual">手动选择规则</option>
                </select>
              </Field>
              <Field label="负责人">
                <input value={runDraft.owner} onChange={(event) => setRunDraft({ ...runDraft, owner: event.target.value })} className={inputClass} />
              </Field>
              <div className="md:col-span-2">
                <Field label="说明">
                  <textarea
                    value={runDraft.description}
                    onChange={(event) => setRunDraft({ ...runDraft, description: event.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                  预计执行
                </div>
                <div className="mt-2 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                  <Info label="候选规则" value={`${rules.filter((rule) => rule.status === "enabled").length} 条`} />
                  <Info label="触发方式" value="手动触发" />
                  <Info label="运行策略" value="立即执行" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
              <button onClick={() => setRunModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={startCheck} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white">
                开始核查
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-200">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-slate-300">{value}</div>
    </div>
  );
}
