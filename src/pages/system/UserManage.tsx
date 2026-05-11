import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchSystemUsers,
  fetchUserLoginPolicies,
  fetchUserManageOverview,
  fetchUserOrgBindings,
  fetchUserRiskAccounts,
  updateSystemUserStatus,
  updateUserRiskAccountStatus,
} from "../../services/api";

type UserStatus = "active" | "locked" | "pending";
type RiskStatus = "open" | "reviewing" | "closed";
type Severity = "high" | "medium" | "low";

interface UserOverview {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  pendingUsers: number;
  mfaCoverage: number;
  staleAccounts: number;
}

interface SystemUser {
  id: string;
  name: string;
  username: string;
  department: string;
  role: string;
  status: UserStatus;
  authType: string;
  mfaEnabled: boolean;
  lastLogin: string;
  ownerDomain: string;
  dataScope: string;
}

interface LoginPolicy {
  id: string;
  name: string;
  scope: string;
  rule: string;
  status: "enabled" | "paused";
  hitUsers: number;
  owner: string;
}

interface OrgBinding {
  id: string;
  orgName: string;
  userCount: number;
  owner: string;
  primaryRole: string;
  dataResponsibility: string;
}

interface RiskAccount {
  id: string;
  username: string;
  riskType: string;
  severity: Severity;
  status: RiskStatus;
  detectedAt: string;
  evidence: string;
}

const userStatusConfig: Record<UserStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  active: { label: "正常", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  locked: { label: "已锁定", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400", border: "border-red-500/30" },
  pending: { label: "待激活", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
};

const severityConfig: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高风险", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中风险", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低风险", color: "text-slate-300", bg: "bg-slate-500/15", border: "border-slate-500/30" },
};

const riskStatusConfig: Record<RiskStatus, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: "待处理", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  reviewing: { label: "处理中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  closed: { label: "已关闭", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
};

export default function UserManage() {
  const [overview, setOverview] = useState<UserOverview | null>(null);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [policies, setPolicies] = useState<LoginPolicy[]>([]);
  const [orgBindings, setOrgBindings] = useState<OrgBinding[]>([]);
  const [riskAccounts, setRiskAccounts] = useState<RiskAccount[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | UserStatus>("all");
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, userData, policyData, orgData, riskData] = await Promise.all([
        fetchUserManageOverview(),
        fetchSystemUsers({ keyword, status: selectedStatus }),
        fetchUserLoginPolicies(),
        fetchUserOrgBindings(),
        fetchUserRiskAccounts(),
      ]);
      setOverview(overviewData);
      setUsers(userData);
      setPolicies(policyData);
      setOrgBindings(orgData);
      setRiskAccounts(riskData);
      setSelectedUser((current) => current ?? userData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (selectedStatus !== "all" && user.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${user.name} ${user.username} ${user.department} ${user.role} ${user.ownerDomain}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, selectedStatus, users]);

  const statusSummary = useMemo(() => {
    const map = new Map<UserStatus, number>();
    users.forEach((user) => map.set(user.status, (map.get(user.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [users]);

  const maxStatusCount = Math.max(...statusSummary.map((item) => item.count), 1);

  const searchUsers = async () => {
    const data = await fetchSystemUsers({ keyword, status: selectedStatus });
    setUsers(data);
    setSelectedUser(data[0] ?? null);
  };

  const toggleUser = async (user: SystemUser) => {
    const nextStatus: UserStatus = user.status === "locked" ? "active" : "locked";
    const updated = await updateSystemUserStatus(user.id, nextStatus);
    setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
    setSelectedUser((current) => (current?.id === user.id ? updated : current));
  };

  const closeRisk = async (risk: RiskAccount, status: RiskStatus) => {
    const updated = await updateUserRiskAccountStatus(risk.id, status);
    setRiskAccounts((prev) => prev.map((item) => (item.id === risk.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载用户管理...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "系统管理" }, { label: "用户管理" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            用户管理
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              MFA 覆盖 {overview.mfaCoverage}%
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            统一维护平台用户、账号状态、认证策略、组织归属和风险账号，支撑数据权限与治理责任落地。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="平台用户" value={overview.totalUsers} desc={`${overview.activeUsers} 个正常账号`} icon={Users} tone="text-cyan-300" />
        <KpiCard label="锁定账号" value={overview.lockedUsers} desc="安全策略自动锁定" icon={LockKeyhole} tone="text-red-300" />
        <KpiCard label="待激活" value={overview.pendingUsers} desc="等待首次登录或审批" icon={UserCheck} tone="text-amber-300" />
        <KpiCard label="闲置账号" value={overview.staleAccounts} desc="超过 60 天未登录" icon={AlertTriangle} tone="text-blue-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <UserCog className="h-4 w-4 text-cyan-300" />
                用户档案
              </h2>
              <p className="mt-1 text-xs text-slate-500">按账号、部门、角色和数据域检索平台用户。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchUsers();
                  }}
                  placeholder="搜索用户、账号、部门"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | UserStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="active">正常</option>
                <option value="locked">已锁定</option>
                <option value="pending">待激活</option>
              </select>
              <button onClick={searchUsers} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">筛选</button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {filteredUsers.map((user) => {
              const status = userStatusConfig[user.status];
              const selected = selectedUser?.id === user.id;
              return (
                <article
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : status.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className={user.mfaEnabled ? "rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300" : "rounded bg-amber-500/15 px-2 py-1 text-xs text-amber-300"}>
                          {user.mfaEnabled ? "MFA" : "未开启 MFA"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{user.name}</h3>
                      <div className="mt-1 font-mono text-xs text-cyan-100">{user.username}</div>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{user.department} · {user.role}</p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleUser(user);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title={user.status === "locked" ? "解锁" : "锁定"}
                    >
                      {user.status === "locked" ? <ToggleLeft className="h-5 w-5" /> : <ToggleRight className="h-5 w-5 text-emerald-300" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="认证方式" value={user.authType} />
                    <Metric label="最近登录" value={user.lastLogin} />
                    <Metric label="数据域" value={user.ownerDomain} />
                    <Metric label="数据范围" value={user.dataScope} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              当前用户
            </h2>
            <p className="mt-1 text-xs text-slate-500">查看选中用户的权限边界和账号状态。</p>
          </div>
          {selectedUser ? (
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-sm font-medium text-white">{selectedUser.name}</h3>
                <div className="mt-1 font-mono text-xs text-cyan-100">{selectedUser.username}</div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="部门" value={selectedUser.department} />
                  <Metric label="角色" value={selectedUser.role} />
                  <Metric label="认证" value={selectedUser.authType} />
                  <Metric label="MFA" value={selectedUser.mfaEnabled ? "已开启" : "未开启"} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Users className="h-4 w-4 text-blue-300" />
                  状态分布
                </h3>
                <div className="mt-4 space-y-3">
                  {statusSummary.map((item) => {
                    const config = userStatusConfig[item.status];
                    return (
                      <div key={item.status}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={config.color}>{config.label}</span>
                          <span className="font-semibold text-white">{item.count}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxStatusCount) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">请选择一个用户</div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <KeyRound className="h-4 w-4 text-cyan-300" />
              登录策略
            </h2>
            <p className="mt-1 text-xs text-slate-500">管理 SSO、MFA、弱口令和临时账号安全策略。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-3">
            {policies.map((policy) => (
              <article key={policy.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                      {policy.status === "enabled" ? "已启用" : "已暂停"}
                    </span>
                    <h3 className="mt-2 text-sm font-medium text-white">{policy.name}</h3>
                    <div className="mt-1 text-xs text-slate-500">{policy.owner} · 命中 {policy.hitUsers} 人</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{policy.scope}</p>
                <p className="mt-2 rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">{policy.rule}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Building2 className="h-4 w-4 text-blue-300" />
              组织归属
            </h2>
            <p className="mt-1 text-xs text-slate-500">按组织维护负责人、主要角色和数据责任边界。</p>
          </div>
          <div className="space-y-3 p-4">
            {orgBindings.map((org) => (
              <article key={org.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{org.orgName}</h3>
                    <div className="mt-1 text-xs text-slate-500">{org.owner} · {org.primaryRole}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">{org.userCount}</div>
                    <div className="text-[11px] text-slate-500">用户</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{org.dataResponsibility}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            风险账号
          </h2>
          <p className="mt-1 text-xs text-slate-500">跟踪临时账号、未开启 MFA、长期未登录等账号风险。</p>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {riskAccounts.map((risk) => {
            const severity = severityConfig[risk.severity];
            const status = riskStatusConfig[risk.status];
            return (
              <article key={risk.id} className={`rounded-lg border bg-slate-950/60 p-4 ${severity.border}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-1 text-xs ${severity.bg} ${severity.color}`}>{severity.label}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-medium text-white">{risk.riskType}</h3>
                <div className="mt-1 font-mono text-xs text-cyan-100">{risk.username}</div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{risk.evidence}</p>
                <div className="mt-3 text-xs text-slate-500">{risk.detectedAt}</div>
                {risk.status !== "closed" && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={() => closeRisk(risk, "reviewing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">处理中</button>
                    <button onClick={() => closeRisk(risk, "closed")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
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
