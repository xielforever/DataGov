import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudCog,
  DatabaseZap,
  FileSliders,
  Gauge,
  GitPullRequest,
  LockKeyhole,
  RefreshCw,
  Search,
  ServerCog,
  Settings2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchSystemConfigChanges,
  fetchSystemConfigIntegrations,
  fetchSystemConfigOverview,
  fetchSystemConfigParams,
  fetchSystemEnvironmentPolicies,
  fetchSystemRuntimeSwitches,
  updateSystemConfigChangeStatus,
  updateSystemConfigParamStatus,
  updateSystemRuntimeSwitchStatus,
} from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type ConfigStatus = "active" | "inactive";
type IntegrationStatus = "connected" | "degraded";
type SwitchStatus = "enabled" | "disabled";
type RiskLevel = "high" | "medium" | "low";
type EnvironmentStatus = "active" | "locked";
type ChangeStatus = "pending" | "reviewing" | "approved" | "rejected";

interface ConfigOverview {
  totalConfigs: number;
  enabledSwitches: number;
  integrations: number;
  environments: number;
  pendingChanges: number;
  lastBackupAt: string;
}

interface ConfigParam {
  id: string;
  key: string;
  name: string;
  category: string;
  value: string;
  unit: string;
  status: ConfigStatus;
  owner: string;
  updatedAt: string;
  description: string;
}

interface ConfigIntegration {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  status: IntegrationStatus;
  health: number;
  owner: string;
  lastCheckedAt: string;
  description: string;
}

interface RuntimeSwitch {
  id: string;
  name: string;
  key: string;
  status: SwitchStatus;
  scope: string;
  risk: RiskLevel;
  owner: string;
  effect: string;
}

interface EnvironmentPolicy {
  id: string;
  environment: string;
  deployWindow: string;
  approvalRequired: boolean;
  dataMasking: string;
  backupPolicy: string;
  status: EnvironmentStatus;
}

interface ConfigChange {
  id: string;
  title: string;
  target: string;
  type: string;
  status: ChangeStatus;
  applicant: string;
  submittedAt: string;
  impact: string;
}

const configStatusConfig: Record<ConfigStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  active: { label: "生效中", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  inactive: { label: "已停用", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

const integrationStatusConfig: Record<IntegrationStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  connected: { label: "已连接", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  degraded: { label: "降级", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
};

const switchStatusConfig: Record<SwitchStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  enabled: { label: "已开启", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  disabled: { label: "已关闭", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高影响", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中影响", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低影响", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
};

const changeStatusConfig: Record<ChangeStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  pending: { label: "待审批", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400", border: "border-red-500/30" },
  reviewing: { label: "复核中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
  approved: { label: "已通过", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  rejected: { label: "已驳回", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

export default function SystemConfig() {
  const [overview, setOverview] = useState<ConfigOverview | null>(null);
  const [params, setParams] = useState<ConfigParam[]>([]);
  const [integrations, setIntegrations] = useState<ConfigIntegration[]>([]);
  const [switches, setSwitches] = useState<RuntimeSwitch[]>([]);
  const [policies, setPolicies] = useState<EnvironmentPolicy[]>([]);
  const [changes, setChanges] = useState<ConfigChange[]>([]);
  const [keyword, setKeyword] = useState("");
  useKeyboardShortcut({
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedkeyword = useDebounce(keyword, 300);
  const [selectedStatus, setSelectedStatus] = useState<"all" | ConfigStatus>("all");
  const [selectedParam, setSelectedParam] = useState<ConfigParam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, paramData, integrationData, switchData, policyData, changeData] = await Promise.all([
        fetchSystemConfigOverview(),
        fetchSystemConfigParams({ keyword, status: selectedStatus }),
        fetchSystemConfigIntegrations(),
        fetchSystemRuntimeSwitches(),
        fetchSystemEnvironmentPolicies(),
        fetchSystemConfigChanges(),
      ]);
      setOverview(overviewData);
      setParams(paramData);
      setIntegrations(integrationData);
      setSwitches(switchData);
      setPolicies(policyData);
      setChanges(changeData);
      setSelectedParam((current) => current ?? paramData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredParams = useMemo(() => {
    return params.filter((item) => {
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${item.key} ${item.name} ${item.category} ${item.owner} ${item.description}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, params, selectedStatus]);

  const switchSummary = useMemo(() => {
    const map = new Map<SwitchStatus, number>();
    switches.forEach((item) => map.set(item.status, (map.get(item.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [switches]);

  const maxSwitchCount = Math.max(...switchSummary.map((item) => item.count), 1);

  const searchParams = async () => {
    const data = await fetchSystemConfigParams({ keyword, status: selectedStatus });
    setParams(data);
    setSelectedParam(data[0] ?? null);
  };

  const toggleParam = async (item: ConfigParam) => {
    const nextStatus: ConfigStatus = item.status === "active" ? "inactive" : "active";
    const updated = await updateSystemConfigParamStatus(item.id, nextStatus);
    setParams((prev) => prev.map((param) => (param.id === item.id ? updated : param)));
    setSelectedParam((current) => (current?.id === item.id ? updated : current));
  };

  const toggleSwitch = async (item: RuntimeSwitch) => {
    const nextStatus: SwitchStatus = item.status === "enabled" ? "disabled" : "enabled";
    const updated = await updateSystemRuntimeSwitchStatus(item.id, nextStatus);
    setSwitches((prev) => prev.map((runtimeSwitch) => (runtimeSwitch.id === item.id ? updated : runtimeSwitch)));
  };

  const changeConfigStatus = async (item: ConfigChange, status: ChangeStatus) => {
    const updated = await updateSystemConfigChangeStatus(item.id, status);
    setChanges((prev) => prev.map((change) => (change.id === item.id ? updated : change)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载系统配置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "系统管理" }, { label: "系统配置" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            系统配置
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
              待变更 {overview.pendingChanges}
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            集中维护平台基础参数、集成配置、运行开关和环境策略，保障治理平台运行边界清晰可控。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="配置项" value={overview.totalConfigs} desc="基础参数与策略配置" icon={FileSliders} tone="text-cyan-300" />
        <KpiCard label="运行开关" value={overview.enabledSwitches} desc="当前开启的运行控制" icon={ToggleRight} tone="text-emerald-300" />
        <KpiCard label="集成配置" value={overview.integrations} desc="认证、通知、血缘、归档" icon={CloudCog} tone="text-blue-300" />
        <KpiCard label="备份时间" value={overview.environments} desc={`最近备份 ${overview.lastBackupAt}`} icon={DatabaseZap} tone="text-amber-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <Settings2 className="h-4 w-4 text-cyan-300" />
                基础参数
              </h2>
              <p className="mt-1 text-xs text-slate-500">按参数键、分类、负责人和说明检索平台配置项。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchParams();
                  }}
                  placeholder="搜索参数、分类、负责人"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | ConfigStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="active">生效中</option>
                <option value="inactive">已停用</option>
              </select>
              <button onClick={searchParams} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">筛选</button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {filteredParams.map((item) => {
              const status = configStatusConfig[item.status];
              const selected = selectedParam?.id === item.id;
              return (
                <article
                  key={item.id}
                  onClick={() => setSelectedParam(item)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : status.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className="rounded bg-blue-500/15 px-2 py-1 text-xs text-blue-300">{item.category}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{item.name}</h3>
                      <div className="mt-1 truncate font-mono text-xs text-cyan-100">{item.key}</div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.description}</p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleParam(item);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title={item.status === "active" ? "停用参数" : "启用参数"}
                    >
                      {item.status === "active" ? <ToggleRight className="h-5 w-5 text-emerald-300" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="当前值" value={`${item.value} ${item.unit}`} />
                    <Metric label="负责人" value={item.owner} />
                    <Metric label="分类" value={item.category} />
                    <Metric label="更新时间" value={item.updatedAt} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <ServerCog className="h-4 w-4 text-cyan-300" />
              当前参数
            </h2>
            <p className="mt-1 text-xs text-slate-500">查看参数值、影响范围和运行开关结构。</p>
          </div>
          {selectedParam ? (
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-sm font-medium text-white">{selectedParam.name}</h3>
                <div className="mt-1 font-mono text-xs text-cyan-100">{selectedParam.key}</div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{selectedParam.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="当前值" value={`${selectedParam.value} ${selectedParam.unit}`} />
                  <Metric label="负责人" value={selectedParam.owner} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Gauge className="h-4 w-4 text-blue-300" />
                  开关分布
                </h3>
                <div className="mt-4 space-y-3">
                  {switchSummary.map((item) => {
                    const config = switchStatusConfig[item.status];
                    return (
                      <div key={item.status}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={config.color}>{config.label}</span>
                          <span className="font-semibold text-white">{item.count}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxSwitchCount) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">请选择一个配置参数</div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <CloudCog className="h-4 w-4 text-cyan-300" />
              集成配置
            </h2>
            <p className="mt-1 text-xs text-slate-500">监控认证、通知、血缘、归档等外部集成健康状态。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {integrations.map((item) => {
              const status = integrationStatusConfig[item.status];
              return (
                <article key={item.id} className={`rounded-lg border bg-slate-950/60 p-4 ${status.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{item.name}</h3>
                      <div className="mt-1 text-xs text-slate-500">{item.type} · {item.owner}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 truncate font-mono text-xs text-cyan-100">{item.endpoint}</div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{item.description}</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.health}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">健康度 {item.health}% · {item.lastCheckedAt}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-blue-300" />
              运行开关
            </h2>
            <p className="mt-1 text-xs text-slate-500">控制高影响能力是否在指定范围内生效。</p>
          </div>
          <div className="space-y-3 p-4">
            {switches.map((item) => {
              const status = switchStatusConfig[item.status];
              const risk = riskConfig[item.risk];
              return (
                <article key={item.id} className={`rounded-lg border bg-slate-950/60 p-4 ${risk.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${risk.bg} ${risk.color}`}>{risk.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-medium text-white">{item.name}</h3>
                      <div className="mt-1 font-mono text-xs text-cyan-100">{item.key}</div>
                    </div>
                    <button onClick={() => toggleSwitch(item)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                      {item.status === "enabled" ? <ToggleRight className="h-5 w-5 text-emerald-300" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{item.effect}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="范围" value={item.scope} />
                    <Metric label="负责人" value={item.owner} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <LockKeyhole className="h-4 w-4 text-cyan-300" />
              环境策略
            </h2>
            <p className="mt-1 text-xs text-slate-500">维护各环境发布窗口、审批要求、脱敏与备份策略。</p>
          </div>
          <div className="space-y-3 p-4">
            {policies.map((item) => (
              <article key={item.id} className={`rounded-lg border bg-slate-950/60 p-4 ${item.status === "locked" ? "border-red-500/30" : "border-slate-800"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{item.environment}</h3>
                    <div className="mt-1 text-xs text-slate-500">{item.deployWindow}</div>
                  </div>
                  <span className={item.status === "locked" ? "rounded bg-red-500/15 px-2 py-1 text-xs text-red-300" : "rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300"}>
                    {item.status === "locked" ? "受控" : "可用"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="审批" value={item.approvalRequired ? "需要" : "不需要"} />
                  <Metric label="脱敏" value={item.dataMasking} />
                  <Metric label="备份" value={item.backupPolicy} />
                  <Metric label="状态" value={item.status === "locked" ? "受控" : "可用"} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <GitPullRequest className="h-4 w-4 text-amber-300" />
              配置变更
            </h2>
            <p className="mt-1 text-xs text-slate-500">跟踪参数、集成和运行开关的变更审批与影响说明。</p>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {changes.map((item) => {
              const status = changeStatusConfig[item.status];
              return (
                <article key={item.id} className={`rounded-lg border bg-slate-950/60 p-4 ${status.border}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <span className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300">{item.type}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-white">{item.title}</h3>
                  <div className="mt-1 font-mono text-xs text-cyan-100">{item.target}</div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{item.impact}</p>
                  <div className="mt-3 text-xs text-slate-500">{item.applicant} · {item.submittedAt}</div>
                  {(item.status === "pending" || item.status === "reviewing") && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => changeConfigStatus(item, "reviewing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">复核中</button>
                      <button onClick={() => changeConfigStatus(item, "approved")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        通过
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
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
