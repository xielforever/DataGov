import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Eye,
  FileSearch,
  Fingerprint,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Timer,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  createSensitiveScanTask,
  fetchSensitiveScanFindings,
  fetchSensitiveScanOverview,
  fetchSensitiveScanRules,
  fetchSensitiveScanTasks,
  updateSensitiveFindingStatus,
} from "../../services/api";

type ScanStatus = "running" | "success" | "failed" | "pending";
type FindingStatus = "pending" | "confirmed" | "ignored";
type SensitiveLevel = "L2" | "L3" | "L4";

interface ScanOverview {
  scannedAssets: number;
  sensitiveFields: number;
  pendingFindings: number;
  highRiskFindings: number;
  ruleCount: number;
  scanCoverage: number;
}

interface ScanTask {
  id: string;
  name: string;
  scope: string;
  status: ScanStatus;
  progress: number;
  assetCount: number;
  findingCount: number;
  owner: string;
  startTime: string;
  duration: string;
}

interface ScanRule {
  id: string;
  name: string;
  category: string;
  level: SensitiveLevel;
  pattern: string;
  hitCount: number;
  enabled: boolean;
}

interface SensitiveFinding {
  id: string;
  assetName: string;
  fieldName: string;
  category: string;
  level: SensitiveLevel;
  confidence: number;
  sample: string;
  domain: string;
  owner: string;
  status: FindingStatus;
  discoveredAt: string;
  evidence: string;
}

const statusConfig: Record<ScanStatus, { label: string; color: string; bg: string; dot: string }> = {
  running: { label: "扫描中", color: "text-cyan-300", bg: "bg-cyan-500/15", dot: "bg-cyan-400" },
  success: { label: "完成", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  pending: { label: "待执行", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
};

const findingStatusConfig: Record<FindingStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "待复核", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  confirmed: { label: "已确认", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  ignored: { label: "已忽略", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
};

const levelConfig: Record<SensitiveLevel, { label: string; color: string; bg: string; border: string; bar: string }> = {
  L2: { label: "内部敏感", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30", bar: "bg-cyan-400" },
  L3: { label: "敏感", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30", bar: "bg-amber-400" },
  L4: { label: "核心敏感", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30", bar: "bg-red-400" },
};

export default function SensitiveScan() {
  const [overview, setOverview] = useState<ScanOverview | null>(null);
  const [tasks, setTasks] = useState<ScanTask[]>([]);
  const [rules, setRules] = useState<ScanRule[]>([]);
  const [findings, setFindings] = useState<SensitiveFinding[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<"all" | SensitiveLevel>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | FindingStatus>("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, taskData, ruleData, findingData] = await Promise.all([
        fetchSensitiveScanOverview(),
        fetchSensitiveScanTasks(),
        fetchSensitiveScanRules(),
        fetchSensitiveScanFindings(),
      ]);
      setOverview(overviewData);
      setTasks(taskData);
      setRules(ruleData);
      setFindings(findingData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      if (selectedLevel !== "all" && finding.level !== selectedLevel) return false;
      if (selectedStatus !== "all" && finding.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${finding.assetName} ${finding.fieldName} ${finding.category} ${finding.owner}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [findings, keyword, selectedLevel, selectedStatus]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    findings.forEach((finding) => map.set(finding.category, (map.get(finding.category) ?? 0) + 1));
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }, [findings]);

  const maxCategoryCount = Math.max(...categorySummary.map((item) => item.count), 1);

  const startScan = async () => {
    const created = await createSensitiveScanTask({ scope: "全域资产", owner: "当前用户" });
    setTasks((prev) => [created, ...prev]);
  };

  const changeFindingStatus = async (finding: SensitiveFinding, status: FindingStatus) => {
    const updated = await updateSensitiveFindingStatus(finding.id, status);
    setFindings((prev) => prev.map((item) => (item.id === finding.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载敏感数据识别...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据安全" }, { label: "敏感数据识别" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            敏感数据识别
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {overview.scanCoverage}% 覆盖
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            通过规则与样本特征扫描识别身份证、手机号、金融账号等敏感数据，输出证据并进入复核闭环。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
          <button onClick={startScan} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
            <Play className="h-4 w-4" />
            发起扫描
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="已扫描资产" value={overview.scannedAssets} desc={`${overview.scanCoverage}% 覆盖率`} icon={Database} tone="text-cyan-300" />
        <KpiCard label="敏感字段" value={overview.sensitiveFields} desc={`${overview.ruleCount} 条识别规则`} icon={Fingerprint} tone="text-amber-300" />
        <KpiCard label="待复核命中" value={overview.pendingFindings} desc="需要人工确认" icon={FileSearch} tone="text-blue-300" />
        <KpiCard label="高风险命中" value={overview.highRiskFindings} desc="L4 核心敏感" icon={ShieldAlert} tone="text-red-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Timer className="h-4 w-4 text-cyan-300" />
              扫描任务
            </h2>
            <p className="mt-1 text-xs text-slate-500">跟踪扫描范围、进度和命中数量。</p>
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-3">
            {tasks.map((task) => {
              const status = statusConfig[task.status];
              return (
                <article key={task.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{task.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{task.scope} · {task.owner}</div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${task.progress}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <Metric label="资产" value={task.assetCount} />
                    <Metric label="命中" value={task.findingCount} />
                    <Metric label="耗时" value={task.duration} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                命中样本
              </h2>
              <p className="mt-1 text-xs text-slate-500">展示敏感字段、识别证据、置信度和复核状态。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索资产、字段、分类"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedLevel} onChange={(event) => setSelectedLevel(event.target.value as "all" | SensitiveLevel)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部级别</option>
                <option value="L2">L2 内部敏感</option>
                <option value="L3">L3 敏感</option>
                <option value="L4">L4 核心敏感</option>
              </select>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | FindingStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="pending">待复核</option>
                <option value="confirmed">已确认</option>
                <option value="ignored">已忽略</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {filteredFindings.map((finding) => {
              const level = levelConfig[finding.level];
              const status = findingStatusConfig[finding.status];
              return (
                <article key={finding.id} className={`rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${level.border}`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{finding.level} · {level.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <h3 className="text-sm font-medium text-white">{finding.assetName}.{finding.fieldName}</h3>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{finding.domain} · {finding.owner} · {finding.discoveredAt}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs lg:w-44">
                      <Metric label="分类" value={finding.category} />
                      <Metric label="置信度" value={`${finding.confidence}%`} />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
                    <div className="rounded-md border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-cyan-100">{finding.sample}</div>
                    <div className="rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">{finding.evidence}</div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    {finding.status === "pending" && (
                      <>
                        <button onClick={() => changeFindingStatus(finding, "ignored")} className="rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">忽略</button>
                        <button onClick={() => changeFindingStatus(finding, "confirmed")} className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">确认敏感</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
            {filteredFindings.length === 0 && <div className="py-10 text-center text-sm text-slate-500">当前筛选条件下没有命中样本</div>}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              识别规则库
            </h2>
            <p className="mt-1 text-xs text-slate-500">规则来源、敏感等级、模式和命中量。</p>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {rules.map((rule) => {
              const level = levelConfig[rule.level];
              return (
                <article key={rule.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{rule.level}</span>
                        <h3 className="text-sm font-medium text-white">{rule.name}</h3>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{rule.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{rule.hitCount}</div>
                      <div className="text-[11px] text-slate-500">命中</div>
                    </div>
                  </div>
                  <div className="mt-3 break-all rounded-md border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-cyan-100">{rule.pattern}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Eye className="h-4 w-4 text-cyan-300" />
              分类热度
            </h2>
            <p className="mt-1 text-xs text-slate-500">当前命中样本按分类聚合。</p>
          </div>
          <div className="space-y-3 p-4">
            {categorySummary.map((item) => (
              <div key={item.category} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200">{item.category}</span>
                  <span className="text-white">{item.count}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxCategoryCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
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
  icon: typeof Database;
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
