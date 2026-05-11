import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  FileLock2,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchAccessControlApplications,
  fetchAccessControlGrants,
  fetchAccessControlOverview,
  fetchAccessControlPolicies,
  fetchAccessControlRisks,
  processAccessApplication,
  revokeAccessGrant,
} from "../../services/api";

type ApplicationStatus = "pending" | "approved" | "rejected";
type RiskLevel = "high" | "medium" | "low";
type GrantStatus = "active" | "expiring" | "revoked";

interface AccessOverview {
  activeGrants: number;
  pendingApplications: number;
  highRiskBlocks: number;
  expiringGrants: number;
  sensitiveGrantRate: number;
  policyCoverage: number;
}

interface AccessPolicy {
  id: string;
  name: string;
  level: "L2" | "L3" | "L4";
  scope: string;
  approvalMode: string;
  grantDuration: string;
  owner: string;
  hitCount: number;
  description: string;
}

interface AccessApplication {
  id: string;
  applicant: string;
  department: string;
  assetName: string;
  level: "L2" | "L3" | "L4";
  purpose: string;
  duration: string;
  applyTime: string;
  status: ApplicationStatus;
  riskNote: string;
}

interface AccessGrant {
  id: string;
  subject: string;
  assetName: string;
  level: "L2" | "L3" | "L4";
  permission: string;
  expireAt: string;
  status: GrantStatus;
  owner: string;
  lastAccess: string;
}

interface AccessRisk {
  id: string;
  subject: string;
  assetName: string;
  action: string;
  level: RiskLevel;
  blockedAt: string;
  reason: string;
}

const levelConfig: Record<"L2" | "L3" | "L4", { label: string; color: string; bg: string; border: string }> = {
  L2: { label: "内部敏感", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  L3: { label: "敏感", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  L4: { label: "核心敏感", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
};

const applicationStatusConfig: Record<ApplicationStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "待审批", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  approved: { label: "已通过", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  rejected: { label: "已拒绝", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
};

const grantStatusConfig: Record<GrantStatus, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "生效中", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  expiring: { label: "即将到期", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  revoked: { label: "已回收", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高风险", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中风险", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低风险", color: "text-slate-300", bg: "bg-slate-500/15", border: "border-slate-500/30" },
};

export default function AccessControl() {
  const [overview, setOverview] = useState<AccessOverview | null>(null);
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [applications, setApplications] = useState<AccessApplication[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [risks, setRisks] = useState<AccessRisk[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<"all" | ApplicationStatus>("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, policyData, applicationData, grantData, riskData] = await Promise.all([
        fetchAccessControlOverview(),
        fetchAccessControlPolicies(),
        fetchAccessControlApplications(),
        fetchAccessControlGrants(),
        fetchAccessControlRisks(),
      ]);
      setOverview(overviewData);
      setPolicies(policyData);
      setApplications(applicationData);
      setGrants(grantData);
      setRisks(riskData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      if (selectedStatus !== "all" && application.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${application.applicant} ${application.assetName} ${application.department} ${application.purpose}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [applications, keyword, selectedStatus]);

  const activeGrants = useMemo(() => grants.filter((grant) => grant.status !== "revoked"), [grants]);

  const decideApplication = async (application: AccessApplication, action: "approve" | "reject") => {
    const updated = await processAccessApplication(application.id, action);
    setApplications((prev) => prev.map((item) => (item.id === application.id ? updated : item)));
  };

  const revokeGrant = async (grant: AccessGrant) => {
    const updated = await revokeAccessGrant(grant.id);
    setGrants((prev) => prev.map((item) => (item.id === grant.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载访问控制...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据安全" }, { label: "访问控制" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            访问控制
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {overview.activeGrants} 个授权生效
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            管理敏感数据访问申请、授权策略、权限回收和越权拦截，确保权限按最小授权和时效边界运行。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="生效授权" value={overview.activeGrants} desc={`敏感授权占比 ${overview.sensitiveGrantRate}%`} icon={KeyRound} tone="text-cyan-300" />
        <KpiCard label="待审批" value={overview.pendingApplications} desc="访问申请待处理" icon={FileLock2} tone="text-amber-300" />
        <KpiCard label="高风险拦截" value={overview.highRiskBlocks} desc="今日越权阻断" icon={LockKeyhole} tone="text-red-300" />
        <KpiCard label="即将到期" value={overview.expiringGrants} desc={`策略覆盖 ${overview.policyCoverage}%`} icon={Clock3} tone="text-blue-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <UserCheck className="h-4 w-4 text-cyan-300" />
                访问申请
              </h2>
              <p className="mt-1 text-xs text-slate-500">审批敏感资产访问申请，记录用途、时长和风险说明。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索申请人、资产、用途"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | ApplicationStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="pending">待审批</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {filteredApplications.map((application) => {
              const level = levelConfig[application.level];
              const status = applicationStatusConfig[application.status];
              return (
                <article key={application.id} className={`rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${level.border}`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{application.level} · {level.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <h3 className="text-sm font-medium text-white">{application.assetName}</h3>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{application.applicant} · {application.department} · {application.applyTime}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs lg:w-56">
                      <Metric label="期限" value={application.duration} />
                      <Metric label="用途" value={application.purpose} />
                    </div>
                  </div>
                  <div className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">{application.riskNote}</div>
                  {application.status === "pending" && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => decideApplication(application, "reject")} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">
                        <XCircle className="h-3.5 w-3.5" />
                        拒绝
                      </button>
                      <button onClick={() => decideApplication(application, "approve")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        通过
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            {filteredApplications.length === 0 && <div className="py-10 text-center text-sm text-slate-500">当前筛选条件下没有访问申请</div>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              授权策略
            </h2>
            <p className="mt-1 text-xs text-slate-500">按敏感等级定义审批模式和授权时长。</p>
          </div>
          <div className="max-h-[560px] space-y-3 overflow-y-auto p-4">
            {policies.map((policy) => {
              const level = levelConfig[policy.level];
              return (
                <article key={policy.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{policy.level}</span>
                        <h3 className="text-sm font-medium text-white">{policy.name}</h3>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{policy.scope} · {policy.owner}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{policy.hitCount}</div>
                      <div className="text-[11px] text-slate-500">命中</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="审批模式" value={policy.approvalMode} />
                    <Metric label="授权时长" value={policy.grantDuration} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{policy.description}</p>
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
              <Database className="h-4 w-4 text-cyan-300" />
              当前授权
            </h2>
            <p className="mt-1 text-xs text-slate-500">跟踪生效授权、到期边界和回收动作。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {activeGrants.map((grant) => {
              const level = levelConfig[grant.level];
              const status = grantStatusConfig[grant.status];
              return (
                <article key={grant.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{grant.level}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{grant.assetName}</h3>
                      <div className="mt-1 text-xs text-slate-500">{grant.subject} · {grant.owner}</div>
                    </div>
                    <button onClick={() => revokeGrant(grant)} className="rounded-md px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">回收</button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="权限" value={grant.permission} />
                    <Metric label="到期" value={grant.expireAt} />
                  </div>
                  <div className="mt-3 text-xs text-slate-500">最近访问 {grant.lastAccess}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              风险拦截
            </h2>
            <p className="mt-1 text-xs text-slate-500">记录越权访问、异常导出和策略阻断。</p>
          </div>
          <div className="space-y-3 p-4">
            {risks.map((risk) => {
              const riskTone = riskConfig[risk.level];
              return (
                <article key={risk.id} className={`rounded-lg border bg-slate-950/60 p-3 ${riskTone.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`rounded px-2 py-1 text-xs ${riskTone.bg} ${riskTone.color}`}>{riskTone.label}</span>
                      <h3 className="mt-2 text-sm font-medium text-white">{risk.action}</h3>
                      <div className="mt-1 break-all font-mono text-xs text-cyan-100">{risk.assetName}</div>
                    </div>
                    <div className="text-xs text-slate-500">{risk.blockedAt}</div>
                  </div>
                  <div className="mt-3 text-xs text-slate-400">{risk.subject}</div>
                  <div className="mt-2 rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">{risk.reason}</div>
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
  icon: typeof KeyRound;
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
