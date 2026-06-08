import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  GitBranch,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserRoundCheck,
  Users,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchOrgChanges,
  fetchOrgManageOverview,
  fetchOrgResponsibilities,
  fetchOrgStewards,
  fetchSystemOrgs,
  updateOrgChangeStatus,
  updateSystemOrgStatus,
} from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type OrgStatus = "active" | "inactive";
type ChangeStatus = "pending" | "reviewing" | "approved" | "rejected";

interface OrgOverview {
  totalOrgs: number;
  activeOrgs: number;
  dataOwners: number;
  pendingChanges: number;
  responsibilityDomains: number;
  orphanAssets: number;
}

interface SystemOrg {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  level: number;
  status: OrgStatus;
  owner: string;
  deputy: string;
  memberCount: number;
  assetCount: number;
  domainCount: number;
  dataResponsibility: string;
  updatedAt: string;
}

interface OrgResponsibility {
  id: string;
  orgId: string;
  domain: string;
  scope: string;
  owner: string;
  assetCount: number;
  coverage: number;
  boundary: string;
}

interface OrgSteward {
  id: string;
  orgId: string;
  name: string;
  role: string;
  username: string;
  coverage: string;
  phone: string;
}

interface OrgChange {
  id: string;
  orgId: string;
  title: string;
  type: string;
  status: ChangeStatus;
  applicant: string;
  submittedAt: string;
  impact: string;
}

const orgStatusConfig: Record<OrgStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  active: { label: "运行中", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  inactive: { label: "已停用", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

const changeStatusConfig: Record<ChangeStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  pending: { label: "待审批", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400", border: "border-red-500/30" },
  reviewing: { label: "复核中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
  approved: { label: "已通过", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  rejected: { label: "已驳回", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

const changeTypeLabels: Record<string, string> = {
  responsibility: "责任范围",
  status: "状态变更",
  owner: "负责人调整",
  review: "边界复核",
};

export default function OrgManage() {
  const [overview, setOverview] = useState<OrgOverview | null>(null);
  const [orgs, setOrgs] = useState<SystemOrg[]>([]);
  const [responsibilities, setResponsibilities] = useState<OrgResponsibility[]>([]);
  const [stewards, setStewards] = useState<OrgSteward[]>([]);
  const [changes, setChanges] = useState<OrgChange[]>([]);
  const [keyword, setKeyword] = useState("");
  useKeyboardShortcut({
    'ctrl+n': () => setIsModalOpen(true),
    'escape': () => setIsModalOpen(false),
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedKeyword = useDebounce(keyword, 300);
  const [selectedStatus, setSelectedStatus] = useState<"all" | OrgStatus>("all");
  const [selectedOrg, setSelectedOrg] = useState<SystemOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, orgData, responsibilityData, stewardData, changeData] = await Promise.all([
        fetchOrgManageOverview(),
        fetchSystemOrgs({ keyword, status: selectedStatus }),
        fetchOrgResponsibilities(),
        fetchOrgStewards(),
        fetchOrgChanges(),
      ]);
      setOverview(overviewData);
      setOrgs(orgData);
      setResponsibilities(responsibilityData);
      setStewards(stewardData);
      setChanges(changeData);
      setSelectedOrg((current) => current ?? orgData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrgs = useMemo(() => {
    return orgs.filter((org) => {
      if (selectedStatus !== "all" && org.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${org.name} ${org.code} ${org.owner} ${org.deputy} ${org.dataResponsibility}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, orgs, selectedStatus]);

  const paginatedFilteredOrgs = useMemo(() => {
    return filteredOrgs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [currentPage, filteredOrgs, pageSize]);

  const selectedResponsibilities = useMemo(
    () => responsibilities.filter((item) => item.orgId === selectedOrg?.id),
    [responsibilities, selectedOrg],
  );
  const selectedStewards = useMemo(
    () => stewards.filter((item) => item.orgId === selectedOrg?.id),
    [stewards, selectedOrg],
  );
  const selectedChanges = useMemo(
    () => changes.filter((item) => item.orgId === selectedOrg?.id),
    [changes, selectedOrg],
  );

  const childOrgs = useMemo(
    () => orgs.filter((org) => org.parentId === selectedOrg?.id),
    [orgs, selectedOrg],
  );

  const statusSummary = useMemo(() => {
    const map = new Map<OrgStatus, number>();
    orgs.forEach((org) => map.set(org.status, (map.get(org.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [orgs]);

  const maxStatusCount = Math.max(...statusSummary.map((item) => item.count), 1);

  const searchOrgs = async () => {
    const data = await fetchSystemOrgs({ keyword, status: selectedStatus });
    setOrgs(data);
    setSelectedOrg(data[0] ?? null);
  };

  const toggleOrg = async (org: SystemOrg) => {
    const nextStatus: OrgStatus = org.status === "active" ? "inactive" : "active";
    const updated = await updateSystemOrgStatus(org.id, nextStatus);
    setOrgs((prev) => prev.map((item) => (item.id === org.id ? updated : item)));
    setSelectedOrg((current) => (current?.id === org.id ? updated : current));
  };

  const changeOrgRecordStatus = async (change: OrgChange, status: ChangeStatus) => {
    const updated = await updateOrgChangeStatus(change.id, status);
    setChanges((prev) => prev.map((item) => (item.id === change.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载组织管理...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "系统管理" }, { label: "组织管理" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            组织管理
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
              待变更 {overview.pendingChanges}
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            维护组织架构、部门负责人、数据责任边界和组织变更记录，让资产归属、授权审批和治理责任可追踪。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="组织节点" value={overview.totalOrgs} desc={`${overview.activeOrgs} 个运行中`} icon={Building2} tone="text-cyan-300" />
        <KpiCard label="数据责任人" value={overview.dataOwners} desc="已配置负责人或代理人" icon={UserRoundCheck} tone="text-emerald-300" />
        <KpiCard label="责任域" value={overview.responsibilityDomains} desc="覆盖业务域与治理域" icon={ShieldCheck} tone="text-blue-300" />
        <KpiCard label="待归属资产" value={overview.orphanAssets} desc="需要补齐组织责任边界" icon={AlertTriangle} tone="text-amber-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <GitBranch className="h-4 w-4 text-cyan-300" />
                组织树
              </h2>
              <p className="mt-1 text-xs text-slate-500">按组织编码、负责人和数据责任范围检索组织节点。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchOrgs();
                  }}
                  placeholder="搜索组织、编码、负责人"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | OrgStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="active">运行中</option>
                <option value="inactive">已停用</option>
              </select>
              <button onClick={searchOrgs} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">筛选</button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {paginatedFilteredOrgs.map((org) => {
              const status = orgStatusConfig[org.status];
              const selected = selectedOrg?.id === org.id;
              return (
                <article
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : status.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className="rounded bg-blue-500/15 px-2 py-1 text-xs text-blue-300">L{org.level}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{org.name}</h3>
                      <div className="mt-1 truncate font-mono text-xs text-cyan-100">{org.code}</div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{org.dataResponsibility}</p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleOrg(org);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title={org.status === "active" ? "停用组织" : "启用组织"}
                    >
                      {org.status === "active" ? <ToggleRight className="h-5 w-5 text-emerald-300" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="负责人" value={org.owner} />
                    <Metric label="代理人" value={org.deputy} />
                    <Metric label="成员数" value={org.memberCount} />
                    <Metric label="资产数" value={org.assetCount} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Layers3 className="h-4 w-4 text-cyan-300" />
              当前组织
            </h2>
            <p className="mt-1 text-xs text-slate-500">查看选中组织的责任归属、下级组织和状态分布。</p>
          </div>
          {selectedOrg ? (
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{selectedOrg.name}</h3>
                    <div className="mt-1 font-mono text-xs text-cyan-100">{selectedOrg.code}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs ${orgStatusConfig[selectedOrg.status].bg} ${orgStatusConfig[selectedOrg.status].color}`}>
                    {orgStatusConfig[selectedOrg.status].label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="数据域" value={selectedOrg.domainCount} />
                  <Metric label="下级组织" value={childOrgs.length} />
                  <Metric label="责任边界" value={selectedResponsibilities.length} />
                  <Metric label="组织变更" value={selectedChanges.length} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Building2 className="h-4 w-4 text-blue-300" />
                  状态分布
                </h3>
                <div className="mt-4 space-y-3">
                  {statusSummary.map((item) => {
                    const config = orgStatusConfig[item.status];
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
            <div className="p-8 text-center text-sm text-slate-500">请选择一个组织</div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              责任边界
            </h2>
            <p className="mt-1 text-xs text-slate-500">按数据域展示组织负责的资产范围、覆盖率和边界约束。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {selectedResponsibilities.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{item.domain}</h3>
                    <div className="mt-1 text-xs text-slate-500">{item.scope}</div>
                  </div>
                  <span className="rounded bg-cyan-500/15 px-2 py-1 text-xs text-cyan-300">{item.coverage}%</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.coverage}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="负责人" value={item.owner} />
                  <Metric label="资产数" value={item.assetCount} />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{item.boundary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Users className="h-4 w-4 text-blue-300" />
              部门负责人
            </h2>
            <p className="mt-1 text-xs text-slate-500">维护数据责任人、职责覆盖范围和联系方式。</p>
          </div>
          <div className="space-y-3 p-4">
            {selectedStewards.map((steward) => (
              <article key={steward.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{steward.name}</h3>
                    <div className="mt-1 font-mono text-xs text-cyan-100">{steward.username}</div>
                  </div>
                  <span className="rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">{steward.role}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{steward.coverage}</p>
                <div className="mt-2 text-xs text-slate-500">{steward.phone}</div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            组织变更
          </h2>
          <p className="mt-1 text-xs text-slate-500">跟踪组织负责人调整、状态变更和责任边界复核。</p>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {selectedChanges.length > 0 ? selectedChanges.map((change) => {
            const status = changeStatusConfig[change.status];
            return (
              <article key={change.id} className={`rounded-lg border bg-slate-950/60 p-4 ${status.border}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <span className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300">
                    {changeTypeLabels[change.type] ?? change.type}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-medium text-white">{change.title}</h3>
                <p className="mt-3 text-xs leading-5 text-slate-400">{change.impact}</p>
                <div className="mt-3 text-xs text-slate-500">{change.applicant} · {change.submittedAt}</div>
                {(change.status === "pending" || change.status === "reviewing") && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={() => changeOrgRecordStatus(change, "reviewing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">复核中</button>
                    <button onClick={() => changeOrgRecordStatus(change, "approved")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      通过
                    </button>
                  </div>
                )}
              </article>
            );
          }) : (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500 lg:col-span-2">
              当前组织暂无待处理变更
            </div>
          )}
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
