import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  EyeOff,
  FileCheck2,
  KeyRound,
  Lock,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchDataMaskOverview,
  fetchDataMaskPolicies,
  fetchDataMaskRules,
  fetchDataMaskValidations,
  updateDataMaskPolicyStatus,
} from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type MaskMode = "static" | "dynamic";
type PolicyStatus = "enabled" | "disabled" | "draft";
type ValidationStatus = "passed" | "warning" | "failed";

interface MaskOverview {
  policies: number;
  enabledPolicies: number;
  protectedFields: number;
  dynamicRequests: number;
  validationPassRate: number;
  pendingPolicies: number;
}

interface MaskPolicy {
  id: string;
  name: string;
  mode: MaskMode;
  status: PolicyStatus;
  level: "L2" | "L3" | "L4";
  scope: string;
  protectedFields: number;
  owner: string;
  updateTime: string;
  description: string;
}

interface MaskRule {
  id: string;
  fieldPattern: string;
  category: string;
  level: "L2" | "L3" | "L4";
  algorithm: string;
  sampleBefore: string;
  sampleAfter: string;
  policyName: string;
}

interface MaskValidation {
  id: string;
  policyName: string;
  scene: string;
  status: ValidationStatus;
  passRate: number;
  testedFields: number;
  lastRun: string;
  result: string;
}

const modeLabel: Record<MaskMode, string> = {
  static: "静态脱敏",
  dynamic: "动态脱敏",
};

const statusConfig: Record<PolicyStatus, { label: string; color: string; bg: string; dot: string }> = {
  enabled: { label: "已启用", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  disabled: { label: "已停用", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
  draft: { label: "草稿", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
};

const validationConfig: Record<ValidationStatus, { label: string; color: string; bg: string; dot: string }> = {
  passed: { label: "通过", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  warning: { label: "有风险", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
};

const levelConfig: Record<MaskPolicy["level"], { label: string; color: string; bg: string; border: string }> = {
  L2: { label: "内部敏感", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  L3: { label: "敏感", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  L4: { label: "核心敏感", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
};

export default function DataMask() {
  const [overview, setOverview] = useState<MaskOverview | null>(null);
  const [policies, setPolicies] = useState<MaskPolicy[]>([]);
  const [rules, setRules] = useState<MaskRule[]>([]);
  const [validations, setValidations] = useState<MaskValidation[]>([]);
  const [selectedMode, setSelectedMode] = useState<"all" | MaskMode>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | PolicyStatus>("all");
  const [keyword, setKeyword] = useState("");
  useKeyboardShortcut({
    'ctrl+n': () => setIsModalOpen(true),
    'escape': () => setIsModalOpen(false),
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedkeyword = useDebounce(keyword, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, policyData, ruleData, validationData] = await Promise.all([
        fetchDataMaskOverview(),
        fetchDataMaskPolicies(),
        fetchDataMaskRules(),
        fetchDataMaskValidations(),
      ]);
      setOverview(overviewData);
      setPolicies(policyData);
      setRules(ruleData);
      setValidations(validationData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      if (selectedMode !== "all" && policy.mode !== selectedMode) return false;
      if (selectedStatus !== "all" && policy.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${policy.name} ${policy.scope} ${policy.owner} ${policy.description}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, policies, selectedMode, selectedStatus]);

  const algorithmSummary = useMemo(() => {
    const map = new Map<string, number>();
    rules.forEach((rule) => map.set(rule.algorithm, (map.get(rule.algorithm) ?? 0) + 1));
    return Array.from(map.entries()).map(([algorithm, count]) => ({ algorithm, count }));
  }, [rules]);

  const maxAlgorithmCount = Math.max(...algorithmSummary.map((item) => item.count), 1);

  const togglePolicyStatus = async (policy: MaskPolicy) => {
    const nextStatus: PolicyStatus = policy.status === "enabled" ? "disabled" : "enabled";
    const updated = await updateDataMaskPolicyStatus(policy.id, nextStatus);
    setPolicies((prev) => prev.map((item) => (item.id === policy.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载数据脱敏...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据安全" }, { label: "数据脱敏" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            数据脱敏
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {overview.enabledPolicies} 个策略生效
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            统一管理静态脱敏、动态脱敏、字段规则和验证结果，确保敏感数据在开发、分析和服务场景中按策略展示。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="脱敏策略" value={overview.policies} desc={`${overview.pendingPolicies} 个待完善`} icon={ShieldCheck} tone="text-cyan-300" />
        <KpiCard label="保护字段" value={overview.protectedFields} desc="已绑定敏感字段" icon={Database} tone="text-amber-300" />
        <KpiCard label="动态请求" value={overview.dynamicRequests} desc="今日策略命中" icon={EyeOff} tone="text-blue-300" />
        <KpiCard label="验证通过率" value={`${overview.validationPassRate}%`} desc="最近一次验证" icon={CheckCircle2} tone="text-emerald-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <Lock className="h-4 w-4 text-cyan-300" />
                脱敏策略
              </h2>
              <p className="mt-1 text-xs text-slate-500">按模式、状态和生效范围管理脱敏策略。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索策略、范围、负责人"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedMode} onChange={(event) => setSelectedMode(event.target.value as "all" | MaskMode)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部模式</option>
                <option value="static">静态脱敏</option>
                <option value="dynamic">动态脱敏</option>
              </select>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | PolicyStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已停用</option>
                <option value="draft">草稿</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {filteredPolicies.map((policy) => {
              const level = levelConfig[policy.level];
              const status = statusConfig[policy.status];
              return (
                <article key={policy.id} className={`rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${level.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{policy.level} · {level.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{policy.name}</h3>
                      <div className="mt-1 text-xs text-slate-500">{modeLabel[policy.mode]} · {policy.owner}</div>
                    </div>
                    <button onClick={() => togglePolicyStatus(policy)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                      {policy.status === "enabled" ? <ToggleRight className="h-5 w-5 text-emerald-300" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="生效范围" value={policy.scope} />
                    <Metric label="字段数" value={policy.protectedFields} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{policy.description}</p>
                  <div className="mt-3 text-xs text-slate-500">更新于 {policy.updateTime}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
              算法分布
            </h2>
            <p className="mt-1 text-xs text-slate-500">字段规则使用的脱敏算法。</p>
          </div>
          <div className="space-y-3 p-4">
            {algorithmSummary.map((item) => (
              <div key={item.algorithm} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200">{item.algorithm}</span>
                  <span className="font-semibold text-white">{item.count}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxAlgorithmCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <KeyRound className="h-4 w-4 text-amber-300" />
            字段规则
          </h2>
          <p className="mt-1 text-xs text-slate-500">展示字段匹配、敏感级别、脱敏算法和样例效果。</p>
        </div>
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {rules.map((rule) => {
            const level = levelConfig[rule.level];
            return (
              <article key={rule.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{rule.level}</span>
                  <span className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{rule.category}</span>
                  <h3 className="text-sm font-medium text-white">{rule.fieldPattern}</h3>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-md border border-slate-800 bg-slate-900 p-2">
                    <div className="text-[10px] text-slate-500">脱敏前</div>
                    <div className="mt-1 break-all font-mono text-xs text-red-100">{rule.sampleBefore}</div>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-900 p-2">
                    <div className="text-[10px] text-slate-500">脱敏后 · {rule.algorithm}</div>
                    <div className="mt-1 break-all font-mono text-xs text-emerald-100">{rule.sampleAfter}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">策略：{rule.policyName}</div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <PlayCircle className="h-4 w-4 text-cyan-300" />
            脱敏验证
          </h2>
          <p className="mt-1 text-xs text-slate-500">验证不同访问场景下的脱敏策略是否按预期生效。</p>
        </div>
        <div className="space-y-3 p-4">
          {validations.map((item) => {
            const status = validationConfig[item.status];
            return (
              <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <h3 className="text-sm font-medium text-white">{item.policyName}</h3>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{item.scene} · {item.lastRun}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs lg:w-56">
                    <Metric label="字段数" value={item.testedFields} />
                    <Metric label="通过率" value={`${item.passRate}%`} />
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={item.passRate >= 99 ? "h-full rounded-full bg-emerald-400" : item.passRate >= 95 ? "h-full rounded-full bg-amber-400" : "h-full rounded-full bg-red-400"} style={{ width: `${item.passRate}%` }} />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{item.result}</p>
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
  icon: typeof ShieldCheck;
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
