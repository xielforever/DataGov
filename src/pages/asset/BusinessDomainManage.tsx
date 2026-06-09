import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Boxes,
  ClipboardCheck,
  Database,
  Edit3,
  Filter,
  Gauge,
  GitBranch,
  KeyRound,
  Layers3,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  createBusinessDomain,
  fetchBusinessDomains,
  updateBusinessDomain,
  updateBusinessDomainStatus,
} from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';

type DomainStatus = "active" | "paused" | "retired";

interface BusinessDomain {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  level: number;
  status: DomainStatus;
  owner: string;
  ownerUsername: string;
  org: string;
  assetCount: number;
  qualityScore: number;
  standardCoverage: number;
  sensitiveAssets: number;
  defaultSecurityLevel: string;
  qualityGate: string;
  standardRequired: boolean;
  colorClass: string;
  growth: string;
  updatedAt: string;
  description: string;
  childDomains: string[];
  references: {
    assets: number;
    standards: number;
    qualityRules: number;
    models: number;
    permissions: number;
  };
}

type DomainDraft = Pick<
  BusinessDomain,
  | "id"
  | "code"
  | "name"
  | "parentId"
  | "status"
  | "owner"
  | "ownerUsername"
  | "org"
  | "defaultSecurityLevel"
  | "qualityGate"
  | "standardRequired"
  | "description"
>;

const ROOT_KEY = "__root__";
const MAX_DOMAIN_LEVEL = 5;

const emptyDraft: DomainDraft = {
  id: "",
  code: "",
  name: "",
  parentId: null,
  status: "active",
  owner: "",
  ownerUsername: "",
  org: "",
  defaultSecurityLevel: "L2 内部",
  qualityGate: "",
  standardRequired: true,
  description: "",
};

const statusConfig: Record<DomainStatus, { label: string; tone: string; dot: string; action: string }> = {
  active: {
    label: "生效中",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
    action: "暂停准入",
  },
  paused: {
    label: "暂停准入",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
    action: "恢复生效",
  },
  retired: {
    label: "已退役",
    tone: "border-slate-600 bg-slate-700/30 text-slate-300",
    dot: "bg-slate-400",
    action: "恢复生效",
  },
};

const statusFilters: Array<{ value: "all" | DomainStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "生效中" },
  { value: "paused", label: "暂停准入" },
  { value: "retired", label: "已退役" },
];

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export default function BusinessDomainManage() {
  const [domains, setDomains] = useState<BusinessDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DomainStatus>("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [securityFilter, setSecurityFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [rootFilter, setRootFilter] = useState("all");
  const [standardFilter, setStandardFilter] = useState("all");
  const [detailId, setDetailId] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<DomainDraft>(emptyDraft);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const data = await fetchBusinessDomains();
      setDomains(data);
    } catch (error) {
      setError(true);
      toast.error("业务域加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const domainById = useMemo(() => new Map(domains.map((domain) => [domain.id, domain])), [domains]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, BusinessDomain[]>();
    domains.forEach((domain) => {
      const key = domain.parentId || ROOT_KEY;
      const list = map.get(key) || [];
      list.push(domain);
      map.set(key, list);
    });
    return map;
  }, [domains]);

  const rootDomains = childrenByParent.get(ROOT_KEY) || [];
  const getChildren = (domainId: string) => childrenByParent.get(domainId) || [];
  const getParentName = (parentId: string | null) => (parentId ? domainById.get(parentId)?.name || "未找到上级域" : "一级业务域");

  const domainPath = (domain: BusinessDomain) => {
    const path = [domain.name];
    let current = domain;
    const guard = new Set<string>([domain.id]);
    while (current.parentId) {
      const parent = domainById.get(current.parentId);
      if (!parent || guard.has(parent.id)) break;
      path.unshift(parent.name);
      guard.add(parent.id);
      current = parent;
    }
    return path.join(" / ");
  };

  const rootIdOf = (domain: BusinessDomain) => {
    let current = domain;
    const guard = new Set<string>([domain.id]);
    while (current.parentId) {
      const parent = domainById.get(current.parentId);
      if (!parent || guard.has(parent.id)) break;
      current = parent;
      guard.add(parent.id);
    }
    return current.id;
  };

  const orderedDomains = useMemo(() => {
    const result: BusinessDomain[] = [];
    const visit = (domain: BusinessDomain) => {
      result.push(domain);
      (childrenByParent.get(domain.id) || []).forEach(visit);
    };
    rootDomains.forEach(visit);
    return result;
  }, [childrenByParent, rootDomains]);

  const ownerOptions = useMemo(() => Array.from(new Set(domains.map((domain) => domain.owner).filter(Boolean))).sort(), [domains]);
  const securityOptions = useMemo(() => Array.from(new Set(domains.map((domain) => domain.defaultSecurityLevel).filter(Boolean))).sort(), [domains]);

  const parentOptions = useMemo(() => {
    return orderedDomains.filter((domain) => domain.status !== "retired" && domain.level < MAX_DOMAIN_LEVEL && domain.id !== draft.id);
  }, [orderedDomains, draft.id]);

  const filteredDomains = useMemo(() => {
    return orderedDomains.filter((domain) => {
      if (statusFilter !== "all" && domain.status !== statusFilter) return false;
      if (ownerFilter !== "all" && domain.owner !== ownerFilter) return false;
      if (securityFilter !== "all" && domain.defaultSecurityLevel !== securityFilter) return false;
      if (levelFilter !== "all" && domain.level !== Number(levelFilter)) return false;
      if (rootFilter !== "all" && rootIdOf(domain) !== rootFilter) return false;
      if (standardFilter === "required" && !domain.standardRequired) return false;
      if (standardFilter === "optional" && domain.standardRequired) return false;
      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const text = `${domain.name} ${domain.code} ${domain.owner} ${domain.ownerUsername} ${domain.org} ${domain.description} ${domainPath(domain)}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [orderedDomains, keyword, statusFilter, ownerFilter, securityFilter, levelFilter, rootFilter, standardFilter, domainById]);

  const detailDomain = detailId ? domainById.get(detailId) || null : null;
  const draftHasChildren = modalMode === "edit" && draft.id ? getChildren(draft.id).length > 0 : false;

  const stats = useMemo(() => {
    const visibleDomains = domains.filter((domain) => domain.status !== "retired");
    const activeDomains = domains.filter((domain) => domain.status === "active");
    const pausedDomains = domains.filter((domain) => domain.status === "paused");
    const retiredDomains = domains.filter((domain) => domain.status === "retired");
    const maxLevel = visibleDomains.reduce((max, domain) => Math.max(max, domain.level), 1);
    const missingOwner = visibleDomains.filter((domain) => !domain.owner || domain.owner === "待分配").length;
    const missingGate = visibleDomains.filter((domain) => !domain.qualityGate?.trim()).length;
    return {
      total: domains.length,
      active: activeDomains.length,
      paused: pausedDomains.length,
      retired: retiredDomains.length,
      rootCount: visibleDomains.filter((domain) => !domain.parentId).length,
      maxLevel,
      missingOwner,
      missingGate,
    };
  }, [domains]);

  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("all");
    setOwnerFilter("all");
    setSecurityFilter("all");
    setLevelFilter("all");
    setRootFilter("all");
    setStandardFilter("all");
  };

  const openCreate = () => {
    setModalMode("create");
    setDraft({
      ...emptyDraft,
      parentId: rootFilter === "all" ? null : rootFilter,
      code: `BD_${Date.now().toString().slice(-4)}`,
      qualityGate: "发布前完成标准映射、质量校验和安全分级确认",
    });
    setFormOpen(true);
  };

  const openEdit = (domain: BusinessDomain) => {
    setModalMode("edit");
    setDraft({
      id: domain.id,
      code: domain.code,
      name: domain.name,
      parentId: domain.parentId,
      status: domain.status,
      owner: domain.owner,
      ownerUsername: domain.ownerUsername,
      org: domain.org,
      defaultSecurityLevel: domain.defaultSecurityLevel,
      qualityGate: domain.qualityGate,
      standardRequired: domain.standardRequired,
      description: domain.description,
    });
    setFormOpen(true);
  };

  const saveDomain = async () => {
    const parent = draft.parentId ? domainById.get(draft.parentId) : null;
    if (parent && parent.level >= MAX_DOMAIN_LEVEL) {
      toast.error(`业务域最多支持 ${MAX_DOMAIN_LEVEL} 级`);
      return;
    }

    const payload = {
      ...draft,
      name: draft.name.trim() || "未命名业务域",
      code: draft.code.trim() || `BD_${Date.now()}`,
      owner: draft.owner.trim() || "待分配",
      org: draft.org.trim() || "未分配组织",
      ownerUsername: draft.ownerUsername.trim(),
      parentId: draft.parentId || null,
      qualityGate: draft.qualityGate.trim() || "发布前完成标准映射、质量校验和安全分级确认",
      description: draft.description.trim() || "业务域说明待补充。",
    };

    try {
      if (modalMode === "create") {
        const created = await createBusinessDomain(payload);
        setDomains((prev) => [created, ...prev]);
        toast.success("业务域已创建");
      } else {
        const updated = await updateBusinessDomain(draft.id, payload);
        setDomains((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast.success("业务域已更新");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error("业务域保存失败");
    }
  };

  const changeStatus = async (domain: BusinessDomain, nextStatus: DomainStatus) => {
    try {
      const updated = await updateBusinessDomainStatus(domain.id, nextStatus);
      setDomains((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("业务域状态已更新");
    } catch (error) {
      toast.error("状态更新失败");
    }
  };

  // navigateTo imported from utils/navigation

  if (error) {
    return <ErrorFallback onRetry={loadDomains} />;
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据资产" }, { label: "业务域管理" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            业务域管理
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              最高 L{stats.maxLevel} / 最多 L{MAX_DOMAIN_LEVEL}
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            左侧提供搜索、过滤和范围筛选工具，右侧展示联动后的全部业务域；点击业务域查看完整信息。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadDomains}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
          >
            <Plus className="h-4 w-4" />
            新建业务域
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {[
          { label: "业务域总数", value: stats.total, desc: `${stats.rootCount} 个一级域`, icon: Boxes, tone: "text-cyan-300" },
          { label: "最高层级", value: `L${stats.maxLevel}`, desc: `上限 L${MAX_DOMAIN_LEVEL}`, icon: GitBranch, tone: "text-blue-300" },
          { label: "生效节点", value: stats.active, desc: `${stats.paused} 个暂停，${stats.retired} 个退役`, icon: Power, tone: "text-amber-300" },
          { label: "缺责任人", value: stats.missingOwner, desc: "需补齐责任边界", icon: UserRound, tone: "text-rose-300" },
          { label: "缺治理门禁", value: stats.missingGate, desc: "需补齐准入规则", icon: KeyRound, tone: "text-violet-300" },
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

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Filter className="h-4 w-4 text-cyan-300" />
                  搜索与过滤
                </div>
                <div className="mt-1 text-xs text-slate-500">过滤条件会实时联动右侧业务域列表</div>
              </div>
              <button onClick={clearFilters} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300">
                重置
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <Field label="关键字">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="名称、编码、负责人、描述"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>
            </Field>

            <Field label="生命周期状态">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | DomainStatus)} className={inputClass}>
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
            </Field>

            <Field label="所属一级域">
              <select value={rootFilter} onChange={(event) => setRootFilter(event.target.value)} className={inputClass}>
                <option value="all">全部一级域</option>
                {rootDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="层级">
                <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className={inputClass}>
                  <option value="all">全部</option>
                  {Array.from({ length: MAX_DOMAIN_LEVEL }, (_, index) => index + 1).map((level) => (
                    <option key={level} value={level}>L{level}</option>
                  ))}
                </select>
              </Field>
              <Field label="标准绑定">
                <select value={standardFilter} onChange={(event) => setStandardFilter(event.target.value)} className={inputClass}>
                  <option value="all">全部</option>
                  <option value="required">必填</option>
                  <option value="optional">可选</option>
                </select>
              </Field>
            </div>

            <Field label="负责人">
              <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className={inputClass}>
                <option value="all">全部负责人</option>
                {ownerOptions.map((owner) => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </Field>

            <Field label="默认安全级">
              <select value={securityFilter} onChange={(event) => setSecurityFilter(event.target.value)} className={inputClass}>
                <option value="all">全部安全级</option>
                {securityOptions.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </Field>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500">当前结果</div>
              <div className="mt-2 text-2xl font-semibold text-white">{filteredDomains.length}</div>
              <div className="mt-1 text-xs text-slate-500">右侧列表实时联动</div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Layers3 className="h-4 w-4 text-cyan-300" />
                全部业务域
                <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs font-normal text-slate-400">
                  根据左侧条件联动
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                点击业务域行查看详情；列表只维护主数据与治理策略，覆盖资产、质量分等指标由其他模块计算。
              </div>
            </div>
            <div className="text-xs text-slate-500">显示 {filteredDomains.length} / {domains.length} 个业务域</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-left text-xs text-slate-500">
                  <th className="w-[34%] px-4 py-3 font-medium">业务域</th>
                  <th className="w-[25%] px-3 py-3 font-medium">层级路径</th>
                  <th className="w-20 px-3 py-3 font-medium">层级</th>
                  <th className="w-24 whitespace-nowrap px-3 py-3 font-medium">状态</th>
                  <th className="w-32 px-3 py-3 font-medium">负责人</th>
                  <th className="hidden w-28 px-3 py-3 font-medium 2xl:table-cell">安全级</th>
                  <th className="w-20 px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDomains.map((domain) => {
                  const conf = statusConfig[domain.status];
                  const children = getChildren(domain.id);
                  return (
                    <tr
                      key={domain.id}
                      onClick={() => setDetailId(domain.id)}
                      className="cursor-pointer border-b border-slate-800/70 transition hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3" style={{ paddingLeft: Math.max(0, domain.level - 1) * 16 }}>
                          {domain.parentId && <span className="h-5 w-4 flex-none rounded-bl border-b border-l border-slate-700" />}
                          <span className={`h-9 w-1.5 flex-none rounded-full ${domain.colorClass}`} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-white">{domain.name}</div>
                            <div className="mt-0.5 truncate text-xs text-slate-500">{domain.code} · {domain.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="truncate text-sm text-slate-300">{domainPath(domain)}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{children.length ? `${children.length} 个下级` : "无下级"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300">L{domain.level}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs ${conf.tone}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="truncate text-sm text-slate-200">{domain.owner}</div>
                        <div className="truncate text-xs text-slate-500">{domain.org}</div>
                      </td>
                      <td className="hidden px-3 py-3 text-sm text-slate-300 2xl:table-cell">{domain.defaultSecurityLevel}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEdit(domain);
                            }}
                            className="whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
                          >
                            编辑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredDomains.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">当前筛选条件下没有业务域数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {detailDomain && (
        <DetailModal
          domain={detailDomain}
          path={domainPath(detailDomain)}
          parentName={getParentName(detailDomain.parentId)}
          children={getChildren(detailDomain.id)}
          statusConfig={statusConfig}
          onClose={() => setDetailId("")}
          onEdit={() => {
            setDetailId("");
            openEdit(detailDomain);
          }}
          onStatusChange={(nextStatus) => changeStatus(detailDomain, nextStatus)}
          onNavigate={navigateTo}
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-white">{modalMode === "create" ? "新建业务域" : "编辑业务域"}</div>
                <div className="mt-1 text-xs text-slate-500">业务域最多支持 5 级；这里只配置层级、责任人与治理门禁，运行指标由关联模块自动汇总。</div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="业务域名称">
                  <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={inputClass} placeholder="例如：订单子域" />
                </Field>
                <Field label="业务域编码">
                  <input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} className={inputClass} placeholder="例如：TRADE_ORDER" />
                </Field>
                <Field label="上级业务域">
                  <select
                    value={draft.parentId || ""}
                    onChange={(event) => setDraft({ ...draft, parentId: event.target.value || null })}
                    className={inputClass}
                    disabled={draftHasChildren}
                  >
                    <option value="">无，上级为一级业务域</option>
                    {parentOptions.map((domain) => (
                      <option key={domain.id} value={domain.id}>{domainPath(domain)}（L{domain.level}）</option>
                    ))}
                  </select>
                  {draftHasChildren && <div className="mt-1 text-xs text-amber-300">已有下级业务域的节点不允许直接调整上级。</div>}
                </Field>
                <Field label="状态">
                  <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as DomainStatus })} className={inputClass}>
                    <option value="active">生效中</option>
                    <option value="paused">暂停准入</option>
                    <option value="retired">已退役</option>
                  </select>
                </Field>
                <Field label="负责人">
                  <input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} className={inputClass} placeholder="负责人姓名" />
                </Field>
                <Field label="负责人账号">
                  <input value={draft.ownerUsername} onChange={(event) => setDraft({ ...draft, ownerUsername: event.target.value })} className={inputClass} placeholder="owner.username" />
                </Field>
                <Field label="归属组织">
                  <input value={draft.org} onChange={(event) => setDraft({ ...draft, org: event.target.value })} className={inputClass} placeholder="数据治理组织" />
                </Field>
                <Field label="默认安全级">
                  <select value={draft.defaultSecurityLevel} onChange={(event) => setDraft({ ...draft, defaultSecurityLevel: event.target.value })} className={inputClass}>
                    <option>L1 公开</option>
                    <option>L2 内部</option>
                    <option>L3 敏感</option>
                    <option>L4 机密</option>
                  </select>
                </Field>
                <Field label="标准绑定">
                  <label className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={draft.standardRequired}
                      onChange={(event) => setDraft({ ...draft, standardRequired: event.target.checked })}
                      className="h-4 w-4 accent-cyan-500"
                    />
                    注册资产必须绑定标准
                  </label>
                </Field>
                <Field label="业务域说明" className="md:col-span-2">
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    className={`${inputClass} min-h-20 resize-none`}
                    placeholder="说明该业务域覆盖的数据边界"
                  />
                </Field>
                <Field label="治理门禁" className="md:col-span-2">
                  <textarea
                    value={draft.qualityGate}
                    onChange={(event) => setDraft({ ...draft, qualityGate: event.target.value })}
                    className={`${inputClass} min-h-20 resize-none`}
                    placeholder="说明该业务域资产发布前必须满足的治理要求"
                  />
                </Field>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-5 py-4">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                取消
              </button>
              <button
                onClick={saveDomain}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
              >
                保存业务域
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailModal({
  domain,
  path,
  parentName,
  children,
  statusConfig,
  onClose,
  onEdit,
  onStatusChange,
  onNavigate,
}: {
  domain: BusinessDomain;
  path: string;
  parentName: string;
  children: BusinessDomain[];
  statusConfig: Record<DomainStatus, { label: string; tone: string; dot: string; action: string }>;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: DomainStatus) => void;
  onNavigate: (view: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-3 w-3 flex-none rounded-full ${domain.colorClass}`} />
              <div className="truncate text-lg font-semibold text-white">{domain.name}</div>
              <span className={`flex-none rounded-md border px-2 py-1 text-xs ${statusConfig[domain.status].tone}`}>
                {statusConfig[domain.status].label}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{domain.code} · {path} · 更新于 {domain.updatedAt}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <p className="text-sm leading-6 text-slate-300">{domain.description}</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <DetailPanel title="层级关系" icon={<GitBranch className="h-4 w-4 text-cyan-300" />}>
              <InfoRow label="业务域路径" value={path} />
              <InfoRow label="上级业务域" value={parentName} />
              <InfoRow label="当前层级" value={`L${domain.level}`} />
              <InfoRow label="下级数量" value={`${children.length} 个`} />
            </DetailPanel>

            <DetailPanel title="责任策略" icon={<UserRound className="h-4 w-4 text-cyan-300" />}>
              <InfoRow label="负责人账号" value={`${domain.owner} / ${domain.ownerUsername || "未配置账号"}`} />
              <InfoRow label="归属组织" value={domain.org} />
              <InfoRow label="默认安全级" value={domain.defaultSecurityLevel} />
              <InfoRow label="标准绑定" value={domain.standardRequired ? "注册资产必须绑定标准" : "允许不绑定标准"} />
            </DetailPanel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <div className="space-y-4">
              <DetailPanel title="治理门禁" icon={<KeyRound className="h-4 w-4 text-cyan-300" />}>
                <div className="text-sm leading-6 text-slate-300">{domain.qualityGate}</div>
              </DetailPanel>

              <DetailPanel title="下级业务域" icon={<GitBranch className="h-4 w-4 text-cyan-300" />}>
                {children.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {children.map((child) => (
                      <div key={child.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${child.colorClass}`} />
                          <span className="truncate text-sm text-slate-200">{child.name}</span>
                          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">L{child.level}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{child.code} · {child.assetCount.toLocaleString()} 项资产</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">当前业务域没有下级域。</div>
                )}
              </DetailPanel>
            </div>

            <div className="space-y-4">
              <DetailPanel
                title="运营指标"
                icon={<Gauge className="h-4 w-4 text-cyan-300" />}
                extra={<span className="text-xs font-normal text-slate-500">系统计算，只读展示</span>}
              >
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "覆盖资产", value: domain.assetCount.toLocaleString(), source: "来自资产注册/目录", icon: Database },
                    { label: "敏感资产", value: domain.sensitiveAssets.toLocaleString(), source: "来自安全分级/识别", icon: ShieldCheck },
                    { label: "质量分", value: domain.qualityScore, source: "来自质量核查报告", icon: Gauge },
                    { label: "标准覆盖", value: `${domain.standardCoverage}%`, source: "来自标准映射评估", icon: ClipboardCheck },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Icon className="h-3.5 w-3.5 text-cyan-300" />
                          {item.label}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                        <div className="mt-1 text-[11px] text-slate-600">{item.source}</div>
                      </div>
                    );
                  })}
                </div>
              </DetailPanel>

              <DetailPanel title="关联对象" icon={<BookOpen className="h-4 w-4 text-cyan-300" />}>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "标准", value: domain.references.standards, view: "standard-def" },
                    { label: "质量规则", value: domain.references.qualityRules, view: "quality-rules" },
                    { label: "开发模型", value: domain.references.models, view: "data-modeling" },
                    { label: "授权项", value: domain.references.permissions, view: "access-control" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => onNavigate(item.view)}
                      className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-left hover:border-cyan-500/40 hover:bg-cyan-500/10"
                    >
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="mt-1 flex items-center justify-between text-sm text-slate-200">
                        <span>{item.value}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </DetailPanel>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300">
            <Edit3 className="h-3.5 w-3.5" />
            编辑
          </button>
          <button
            onClick={() => onStatusChange(domain.status === "active" ? "paused" : "active")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-amber-500/50 hover:text-amber-300"
          >
            <Power className="h-3.5 w-3.5" />
            {statusConfig[domain.status].action}
          </button>
          {domain.status !== "retired" && (
            <button
              onClick={() => onStatusChange("retired")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:border-rose-500/50 hover:text-rose-300"
            >
              <Archive className="h-3.5 w-3.5" />
              退役
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right text-slate-300">{value}</span>
    </div>
  );
}

function DetailPanel({ title, icon, extra, children }: { title: string; icon: ReactNode; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          {icon}
          {title}
        </div>
        {extra}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}
