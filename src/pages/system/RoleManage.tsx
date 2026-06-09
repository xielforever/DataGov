import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  KeyRound,
  Layers3,
  LockKeyhole,
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
  fetchIamPermissions,
  fetchIamRolePermissions,
  fetchRoleDataScopes,
  fetchRoleManageOverview,
  fetchRoleMembers,
  fetchRolePermissionGroups,
  fetchRoleRisks,
  fetchSystemRoles,
  updateIamRolePermissions,
  updateRoleRiskStatus,
  updateSystemRoleStatus,
} from "../../services/api";
import type { IamPermission } from "../../types/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type RoleStatus = "enabled" | "disabled";
type RoleLevel = "high" | "medium" | "low";
type RiskStatus = "open" | "reviewing" | "closed";
type Severity = "high" | "medium" | "low";

interface RoleOverview {
  totalRoles: number;
  enabledRoles: number;
  privilegedRoles: number;
  pendingReviews: number;
  permissionGroups: number;
  dataScopes: number;
}

interface SystemRole {
  id: string;
  name: string;
  code: string;
  type: string;
  status: RoleStatus;
  level: RoleLevel;
  owner: string;
  memberCount: number;
  permissionCount: number;
  dataScope: string;
  updatedAt: string;
  description: string;
}

interface PermissionGroup {
  id: string;
  roleId: string;
  module: string;
  granted: number;
  total: number;
  critical: boolean;
  actions: string[];
}

interface DataScope {
  id: string;
  roleId: string;
  scopeName: string;
  domain: string;
  sensitivity: string;
  mode: string;
  boundary: string;
}

interface RoleMember {
  id: string;
  roleId: string;
  name: string;
  username: string;
  department: string;
  boundAt: string;
  source: string;
}

interface RoleRisk {
  id: string;
  roleId: string;
  title: string;
  severity: Severity;
  status: RiskStatus;
  detectedAt: string;
  evidence: string;
}

const statusConfig: Record<RoleStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  enabled: { label: "已启用", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  disabled: { label: "已停用", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

const levelConfig: Record<RoleLevel, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高权限", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "业务权限", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "只读权限", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
};

const riskStatusConfig: Record<RiskStatus, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: "待处理", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  reviewing: { label: "复核中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  closed: { label: "已关闭", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
};

const severityConfig: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高风险", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中风险", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低风险", color: "text-slate-300", bg: "bg-slate-500/15", border: "border-slate-700" },
};

export default function RoleManage() {
  const [overview, setOverview] = useState<RoleOverview | null>(null);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [allPermissions, setAllPermissions] = useState<IamPermission[]>([]);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [dataScopes, setDataScopes] = useState<DataScope[]>([]);
  const [members, setMembers] = useState<RoleMember[]>([]);
  const [risks, setRisks] = useState<RoleRisk[]>([]);
  const [keyword, setKeyword] = useState("");
  useKeyboardShortcut({
    'ctrl+n': () => setIsModalOpen(true),
    'escape': () => setIsModalOpen(false),
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedKeyword = useDebounce(keyword, 300);
  const [selectedStatus, setSelectedStatus] = useState<"all" | RoleStatus>("all");
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, roleData, permissionData, scopeData, memberData, riskData, permissionCatalog] = await Promise.all([
        fetchRoleManageOverview(),
        fetchSystemRoles({ keyword, status: selectedStatus }),
        fetchRolePermissionGroups(),
        fetchRoleDataScopes(),
        fetchRoleMembers(),
        fetchRoleRisks(),
        fetchIamPermissions(),
      ]);
      setOverview(overviewData);
      setRoles(roleData);
      setPermissionGroups(permissionData);
      setAllPermissions(permissionCatalog);
      setDataScopes(scopeData);
      setMembers(memberData);
      setRisks(riskData);
      setSelectedRole((current) => current ?? roleData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setSelectedRolePermissions([]);
      setPermissionDraft([]);
      return;
    }
    let cancelled = false;
    setPermissionMessage("");
    fetchIamRolePermissions(selectedRole.id)
      .then((permissions) => {
        if (cancelled) return;
        setSelectedRolePermissions(permissions);
        setPermissionDraft(permissions);
      })
      .catch((error) => {
        if (cancelled) return;
        setPermissionMessage(error instanceof Error ? error.message : "角色权限加载失败");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRole]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      if (selectedStatus !== "all" && role.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${role.name} ${role.code} ${role.owner} ${role.dataScope} ${role.type}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, roles, selectedStatus]);

  const paginatedFilteredRoles = useMemo(() => {
    return filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [currentPage, filteredRoles, pageSize]);

  const selectedPermissionGroups = useMemo(
    () => permissionGroups.filter((group) => group.roleId === selectedRole?.id),
    [permissionGroups, selectedRole],
  );
  const selectedDataScopes = useMemo(
    () => dataScopes.filter((scope) => scope.roleId === selectedRole?.id),
    [dataScopes, selectedRole],
  );
  const selectedMembers = useMemo(
    () => members.filter((member) => member.roleId === selectedRole?.id),
    [members, selectedRole],
  );
  const selectedRisks = useMemo(
    () => risks.filter((risk) => risk.roleId === selectedRole?.id),
    [risks, selectedRole],
  );
  const permissionModules = useMemo(() => groupPermissionsByModule(allPermissions), [allPermissions]);
  const permissionDraftSet = useMemo(() => new Set(permissionDraft), [permissionDraft]);
  const permissionsDirty = useMemo(
    () => !sameStringSet(selectedRolePermissions, permissionDraft),
    [permissionDraft, selectedRolePermissions],
  );

  const roleLevelSummary = useMemo(() => {
    const map = new Map<RoleLevel, number>();
    roles.forEach((role) => map.set(role.level, (map.get(role.level) ?? 0) + 1));
    return Array.from(map.entries()).map(([level, count]) => ({ level, count }));
  }, [roles]);

  const maxLevelCount = Math.max(...roleLevelSummary.map((item) => item.count), 1);

  const searchRoles = async () => {
    const data = await fetchSystemRoles({ keyword, status: selectedStatus });
    setRoles(data);
    setSelectedRole(data[0] ?? null);
  };

  const toggleRole = async (role: SystemRole) => {
    const nextStatus: RoleStatus = role.status === "enabled" ? "disabled" : "enabled";
    try {
      const updated = await updateSystemRoleStatus(role.id, nextStatus);
      setRoles((prev) => prev.map((item) => (item.id === role.id ? updated : item)));
      setSelectedRole((current) => (current?.id === role.id ? updated : current));
      setPermissionMessage("");
    } catch (error) {
      setPermissionMessage(error instanceof Error ? error.message : "角色状态更新失败");
    }
  };

  const changeRiskStatus = async (risk: RoleRisk, status: RiskStatus) => {
    const updated = await updateRoleRiskStatus(risk.id, status);
    setRisks((prev) => prev.map((item) => (item.id === risk.id ? updated : item)));
  };

  const togglePermission = (permission: string) => {
    if (!selectedRole) return;
    if (selectedRole.id === "role-admin" && permission === "platform:*") return;
    setPermissionMessage("");
    setPermissionDraft((current) => (
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission].sort()
    ));
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    setPermissionSaving(true);
    setPermissionMessage("");
    try {
      const saved = await updateIamRolePermissions(selectedRole.id, permissionDraft);
      const [permissionData, roleData, overviewData] = await Promise.all([
        fetchRolePermissionGroups(),
        fetchSystemRoles({ keyword, status: selectedStatus }),
        fetchRoleManageOverview(),
      ]);
      setSelectedRolePermissions(saved);
      setPermissionDraft(saved);
      setPermissionGroups(permissionData);
      setRoles(roleData);
      setOverview(overviewData);
      setSelectedRole(roleData.find((item) => item.id === selectedRole.id) ?? selectedRole);
      setPermissionMessage("权限已保存并立即生效");
    } catch (error) {
      setPermissionMessage(error instanceof Error ? error.message : "权限保存失败");
    } finally {
      setPermissionSaving(false);
    }
  };

  const resetRolePermissions = () => {
    setPermissionDraft(selectedRolePermissions);
    setPermissionMessage("");
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载角色管理...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "系统管理" }, { label: "角色管理" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            角色管理
            <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
              高权限角色 {overview.privilegedRoles}
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            统一维护平台角色、功能权限、数据授权范围和成员绑定关系，支撑最小授权、职责分离与周期性权限复核。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="平台角色" value={overview.totalRoles} desc={`${overview.enabledRoles} 个启用中`} icon={Users} tone="text-cyan-300" />
        <KpiCard label="高权限角色" value={overview.privilegedRoles} desc="需要周期复核与职责隔离" icon={LockKeyhole} tone="text-red-300" />
        <KpiCard label="待复核授权" value={overview.pendingReviews} desc="权限边界或成员绑定待确认" icon={AlertTriangle} tone="text-amber-300" />
        <KpiCard label="权限矩阵" value={`${overview.permissionGroups}/${overview.dataScopes}`} desc="功能权限组 / 数据范围" icon={KeyRound} tone="text-blue-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                角色定义
              </h2>
              <p className="mt-1 text-xs text-slate-500">按角色名称、编码、归属团队和授权范围检索平台角色。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchRoles();
                  }}
                  placeholder="搜索角色、编码、团队"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | RoleStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已停用</option>
              </select>
              <button onClick={searchRoles} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">筛选</button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {paginatedFilteredRoles.map((role) => {
              const status = statusConfig[role.status];
              const level = levelConfig[role.level];
              const selected = selectedRole?.id === role.id;
              return (
                <article
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : status.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{level.label}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{role.name}</h3>
                      <div className="mt-1 truncate font-mono text-xs text-cyan-100">{role.code}</div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{role.description}</p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleRole(role);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title={role.status === "enabled" ? "停用角色" : "启用角色"}
                    >
                      {role.status === "enabled" ? <ToggleRight className="h-5 w-5 text-emerald-300" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="成员数" value={role.memberCount} />
                    <Metric label="权限点" value={role.permissionCount} />
                    <Metric label="归属团队" value={role.owner} />
                    <Metric label="更新时间" value={role.updatedAt} />
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
              当前角色
            </h2>
            <p className="mt-1 text-xs text-slate-500">查看选中角色的权限等级、数据边界和风险结构。</p>
          </div>
          {selectedRole ? (
            <div className="space-y-4 p-4">
              <div className={`rounded-lg border bg-slate-950/60 p-4 ${levelConfig[selectedRole.level].border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{selectedRole.name}</h3>
                    <div className="mt-1 font-mono text-xs text-cyan-100">{selectedRole.code}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs ${levelConfig[selectedRole.level].bg} ${levelConfig[selectedRole.level].color}`}>
                    {levelConfig[selectedRole.level].label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="归属团队" value={selectedRole.owner} />
                  <Metric label="授权范围" value={selectedRole.dataScope} />
                  <Metric label="成员绑定" value={selectedMembers.length} />
                  <Metric label="权限风险" value={selectedRisks.filter((risk) => risk.status !== "closed").length} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <ShieldCheck className="h-4 w-4 text-blue-300" />
                  权限等级分布
                </h3>
                <div className="mt-4 space-y-3">
                  {roleLevelSummary.map((item) => {
                    const config = levelConfig[item.level];
                    return (
                      <div key={item.level}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={config.color}>{config.label}</span>
                          <span className="font-semibold text-white">{item.count}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxLevelCount) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">请选择一个角色</div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <KeyRound className="h-4 w-4 text-cyan-300" />
                功能权限矩阵
              </h2>
              <p className="mt-1 text-xs text-slate-500">按真实 IAM 权限点编辑角色授权，保存后后端鉴权立即生效。</p>
              {permissionMessage && (
                <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${permissionMessage.includes("失败") || permissionMessage.includes("不能") ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>
                  {permissionMessage}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetRolePermissions}
                disabled={!permissionsDirty || permissionSaving}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                撤销修改
              </button>
              <button
                type="button"
                onClick={saveRolePermissions}
                disabled={!selectedRole || !permissionsDirty || permissionSaving}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {permissionSaving ? "保存中..." : "保存权限"}
              </button>
            </div>
          </div>
          <div className="space-y-4 p-4">
            {selectedRole && selectedPermissionGroups.length > 0 && (
              <div className="grid gap-3 xl:grid-cols-2">
                {selectedPermissionGroups.map((group) => {
                  const percent = Math.round((group.granted / group.total) * 100);
                  return (
                    <article key={group.id} className={`rounded-lg border bg-slate-950/60 p-3 ${group.critical ? "border-red-500/30" : "border-slate-800"}`}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-white">{group.module}</span>
                        <span className={group.critical ? "text-red-300" : "text-slate-400"}>{group.granted}/{group.total}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${percent}%` }} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
              {permissionModules.map((module) => (
                <article key={module.module} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{module.label}</h3>
                      <div className="mt-1 text-xs text-slate-500">
                        已选 {module.permissions.filter((permission) => permissionDraftSet.has(permission.code)).length}/{module.permissions.length}
                      </div>
                    </div>
                    {module.critical && <span className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-300">关键模块</span>}
                  </div>
                  <div className="mt-4 space-y-2">
                    {module.permissions.map((permission) => {
                      const checked = permissionDraftSet.has(permission.code);
                      const locked = selectedRole?.id === "role-admin" && permission.code === "platform:*";
                      return (
                        <label
                          key={permission.code}
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 transition ${
                            checked ? "border-cyan-500/30 bg-cyan-500/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                          } ${locked ? "cursor-not-allowed opacity-80" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!selectedRole || locked}
                            onChange={() => togglePermission(permission.code)}
                            className="mt-1 rounded border-slate-600 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="min-w-0">
                            <span className="block font-mono text-xs text-cyan-100">{permission.code}</span>
                            <span className="mt-1 block text-xs text-slate-400">{permission.name} · {permission.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Database className="h-4 w-4 text-blue-300" />
              数据权限
            </h2>
            <p className="mt-1 text-xs text-slate-500">描述角色可访问的数据域、敏感等级和边界约束。</p>
          </div>
          <div className="space-y-3 p-4">
            {selectedDataScopes.map((scope) => (
              <article key={scope.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{scope.scopeName}</h3>
                    <div className="mt-1 text-xs text-slate-500">{scope.domain} · {scope.sensitivity}</div>
                  </div>
                  <span className="rounded bg-blue-500/15 px-2 py-1 text-xs text-blue-300">{scope.mode}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{scope.boundary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <UserRoundCheck className="h-4 w-4 text-cyan-300" />
              成员绑定
            </h2>
            <p className="mt-1 text-xs text-slate-500">展示角色成员来源、所属部门和授权日期。</p>
          </div>
          <div className="space-y-3 p-4">
            {selectedMembers.map((member) => (
              <article key={member.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{member.name}</h3>
                    <div className="mt-1 font-mono text-xs text-cyan-100">{member.username}</div>
                    <div className="mt-2 text-xs text-slate-500">{member.department} · {member.boundAt}</div>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">{member.source}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              权限风险
            </h2>
            <p className="mt-1 text-xs text-slate-500">跟踪高权限、职责冲突、停用角色残留成员等授权风险。</p>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {selectedRisks.length > 0 ? selectedRisks.map((risk) => {
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
                  <h3 className="mt-3 text-sm font-medium text-white">{risk.title}</h3>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{risk.evidence}</p>
                  <div className="mt-3 text-xs text-slate-500">{risk.detectedAt}</div>
                  {risk.status !== "closed" && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => changeRiskStatus(risk, "reviewing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">复核中</button>
                      <button onClick={() => changeRiskStatus(risk, "closed")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        关闭
                      </button>
                    </div>
                  )}
                </article>
              );
            }) : (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500 lg:col-span-2">
                当前角色暂无未归档权限风险
              </div>
            )}
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

function groupPermissionsByModule(permissions: IamPermission[]) {
  const labelMap: Record<string, string> = {
    platform: "平台全部权限",
    auth: "认证与会话",
    metadata: "元数据管理",
    development: "数据开发",
    ai: "AI 助手",
    standards: "数据标准",
    quality: "数据质量",
    approvals: "审批中心",
    system: "系统管理",
  };
  const criticalModules = new Set(["platform", "system", "ai"]);
  const groups = new Map<string, IamPermission[]>();
  permissions.forEach((permission) => {
    const moduleName = permission.module || permission.code.split(":")[0] || "platform";
    groups.set(moduleName, [...(groups.get(moduleName) ?? []), permission]);
  });
  return Array.from(groups.entries())
    .map(([module, items]) => ({
      module,
      label: labelMap[module] || module,
      critical: criticalModules.has(module),
      permissions: items.sort((left, right) => left.code.localeCompare(right.code)),
    }))
    .sort((left, right) => Number(right.critical) - Number(left.critical) || left.label.localeCompare(right.label));
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left);
  return right.every((item) => leftSet.has(item));
}
