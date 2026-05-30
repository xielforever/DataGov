import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  FileCheck2,
  Filter,
  GitBranch,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import { createQualityRule, fetchQualityRuleTemplates, fetchQualityRules, updateQualityRuleStatus, fetchQualityDomains } from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useTableSelection } from '../../hooks/useTableSelection';
import { useTableSort } from '../../hooks/useTableSort';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import InlineEdit from '../../components/common/InlineEdit';

type RuleCategory = "完整性" | "唯一性" | "准确性" | "一致性" | "及时性" | "有效性";
type RuleSeverity = "高" | "中" | "低";
type RuleStatus = "enabled" | "disabled" | "draft";

interface QualityRule {
  id: string;
  code: string;
  name: string;
  category: RuleCategory;
  severity: RuleSeverity;
  status: RuleStatus;
  owner: string;
  domain: string;
  dataSource: string;
  tableName: string;
  fieldName: string;
  checkExpression: string;
  threshold: string;
  schedule: string;
  lastRun: string;
  passRate: number;
  issueCount: number;
  boundObjects: number;
  description: string;
}

interface RuleTemplate {
  category: RuleCategory;
  name: string;
  expression: string;
}

const emptyRule: QualityRule = {
  id: "",
  code: "",
  name: "",
  category: "完整性",
  severity: "中",
  status: "draft",
  owner: "张三丰",
  domain: "交易域",
  dataSource: "mysql-prod",
  tableName: "",
  fieldName: "",
  checkExpression: "",
  threshold: "错误数 = 0",
  schedule: "每日 02:00",
  lastRun: "-",
  passRate: 0,
  issueCount: 0,
  boundObjects: 0,
  description: "",
};

const categoryConfig: Record<RuleCategory, { color: string; bg: string; border: string }> = {
  完整性: { color: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  唯一性: { color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  准确性: { color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  一致性: { color: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  及时性: { color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  有效性: { color: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/30" },
};

const severityConfig: Record<RuleSeverity, { color: string; bg: string }> = {
  高: { color: "text-red-300", bg: "bg-red-500/15" },
  中: { color: "text-amber-300", bg: "bg-amber-500/15" },
  低: { color: "text-slate-300", bg: "bg-slate-500/15" },
};

const statusConfig: Record<RuleStatus, { label: string; color: string; bg: string; dot: string }> = {
  enabled: { label: "已启用", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  disabled: { label: "已停用", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
  draft: { label: "草稿", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
};

const categories: Array<"全部" | RuleCategory> = ["全部", "完整性", "唯一性", "准确性", "一致性", "及时性", "有效性"];
const [domains, setDomains] = useState<string[]>(["全部"]);

export default function QualityRules() {
  const [rules, setRules] = useState<QualityRule[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<"全部" | RuleCategory>("全部");
  const [selectedDomain, setSelectedDomain] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState<"all" | RuleStatus>("all");
  const [keyword, setKeyword] = useState("");
  useKeyboardShortcut({
    'ctrl+n': () => { setModalOpen(true); setDraftRule(emptyRule); },
    'escape': () => { setDrawerOpen(false); setModalOpen(false); },
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus(); },
  });

  const debouncedKeyword = useDebounce(keyword, 300);
  const [selectedRule, setSelectedRule] = useState<QualityRule>(emptyRule);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftRule, setDraftRule] = useState<QualityRule>(emptyRule);


  useEffect(() => {
    fetchQualityDomains().then((res) => setDomains(["全部", ...(res as string[])])).catch(() => {});
  }, []);
  useEffect(() => {
    Promise.all([fetchQualityRules(), fetchQualityRuleTemplates()])
      .then(([ruleData, templateData]) => {
        setRules(ruleData);
        setTemplates(templateData);
        setSelectedRule(ruleData[0] ?? emptyRule);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (selectedCategory !== "全部" && rule.category !== selectedCategory) return false;
      if (selectedDomain !== "全部" && rule.domain !== selectedDomain) return false;
      if (selectedStatus !== "all" && rule.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${rule.name} ${rule.code} ${rule.tableName} ${rule.fieldName}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, rules, selectedCategory, selectedDomain, selectedStatus]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [keyword, selectedCategory, selectedDomain, selectedStatus]);

  const paginatedRules = useMemo(() => {
    return filteredRules.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRules, currentPage, pageSize]);

  const selection = useTableSelection(paginatedRules);
  const { sortedItems, handleSort, getSortIcon } = useTableSort(paginatedRules, { defaultField: 'name', defaultDirection: 'asc' });

  const stats = useMemo(() => {
    const enabled = rules.filter((rule) => rule.status === "enabled").length;
    const highRiskIssues = rules.filter((rule) => rule.severity === "高").reduce((sum, rule) => sum + rule.issueCount, 0);
    const executedRules = rules.filter((rule) => rule.passRate > 0);
    const avgPassRate = executedRules.length ? executedRules.reduce((sum, rule) => sum + rule.passRate, 0) / executedRules.length : 0;
    return {
      total: rules.length,
      enabled,
      boundObjects: rules.reduce((sum, rule) => sum + rule.boundObjects, 0),
      highRiskIssues,
      avgPassRate,
    };
  }, [rules]);

  const openCreateModal = (template?: RuleTemplate) => {
    const category = template?.category ?? "完整性";
    setDraftRule({
      ...emptyRule,
      id: `qr-${Date.now()}`,
      name: template?.name ?? "",
      category,
      checkExpression: template?.expression ?? "",
      threshold: category === "准确性" ? "通过率 >= 99%" : "错误数 = 0",
    });
    setModalOpen(true);
  };

  const saveDraft = async () => {
    const payload = {
      ...draftRule,
      code: draftRule.code || `QR_${draftRule.name || "NEW_RULE"}`,
      name: draftRule.name || "未命名质量规则",
    };
    const created = await createQualityRule(payload);
    setRules((prev) => [created, ...prev]);
    setSelectedRule(created);
    setModalOpen(false);
  };

  const toggleStatus = async (rule: QualityRule) => {
    const nextStatus: RuleStatus = rule.status === "enabled" ? "disabled" : "enabled";
    const updated = await updateQualityRuleStatus(rule.id, nextStatus);
    setRules((prev) => prev.map((item) => (item.id === rule.id ? updated : item)));
    if (selectedRule.id === rule.id) setSelectedRule(updated);
  };

  const openDrawer = (rule: QualityRule) => {
    setSelectedRule(rule);
    setDrawerOpen(true);
  };

  if (error) {
    return <ErrorFallback onRetry={() => window.location.reload()} />;
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据质量" }, { label: "质量规则" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            质量规则
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {stats.total} 条规则
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            统一定义完整性、唯一性、准确性、及时性等质量校验规则，绑定数据对象后驱动核查、告警和质量报告。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <Copy className="h-4 w-4" />
            批量导入
          </button>
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
          >
            <Plus className="h-4 w-4" />
            新建规则
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "规则总数", value: stats.total, desc: `${stats.enabled} 条已启用`, icon: FileCheck2, tone: "text-cyan-300" },
          { label: "绑定对象", value: stats.boundObjects, desc: "覆盖表与字段", icon: Database, tone: "text-blue-300" },
          { label: "平均通过率", value: `${stats.avgPassRate.toFixed(2)}%`, desc: "已运行规则", icon: CheckCircle2, tone: "text-emerald-300" },
          { label: "高风险问题", value: stats.highRiskIssues, desc: "待整改记录", icon: AlertTriangle, tone: "text-rose-300" },
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

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Filter className="h-4 w-4 text-cyan-300" />
                规则分类
              </div>
            </div>
            <div className="space-y-1 p-2">
              {categories.map((category) => {
                const count = category === "全部" ? rules.length : rules.filter((rule) => rule.category === category).length;
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                      active ? "bg-cyan-500/15 text-cyan-300" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{category}</span>
                    <span className="text-xs text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
                规则模板
              </div>
            </div>
            <div className="space-y-2 p-3">
              {templates.map((template) => {
                const config = categoryConfig[template.category];
                return (
                  <button
                    key={template.name}
                    onClick={() => openCreateModal(template)}
                    className="w-full rounded-md border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-cyan-500/40 hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-200">{template.name}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] ${config.border} ${config.bg} ${config.color}`}>
                        {template.category}
                      </span>
                    </div>
                    <div className="mt-2 truncate font-mono text-[11px] text-slate-500">{template.expression}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索规则名称、编码、表名或字段"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`rounded-md px-3 py-1.5 text-xs transition ${
                      selectedDomain === domain
                        ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                        : "border border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as "all" | RuleStatus)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已停用</option>
                <option value="draft">草稿</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
            <table className="min-w-[790px] w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-left text-xs text-slate-400">
                  <th className="px-2 py-3 font-medium w-[36px]">
                    <input type="checkbox" checked={selection.isAllSelected} ref={(el) => { if (el) el.indeterminate = selection.isPartialSelected; }} onChange={selection.toggleAll} className="accent-cyan-500" />
                  </th>
                  <th className="px-4 py-3 font-medium w-[200px] cursor-pointer hover:text-slate-200" onClick={() => handleSort("name")}>规则名称 / 编码 {getSortIcon("name")}</th>
                  <th className="px-4 py-3 font-medium w-[90px] cursor-pointer hover:text-slate-200" onClick={() => handleSort("category")}>分类 {getSortIcon("category")}</th>
                  <th className="px-4 py-3 font-medium w-[140px]">数据对象</th>
                  <th className="px-4 py-3 font-medium w-[80px]">阈值</th>
                  <th className="px-4 py-3 font-medium w-[100px] cursor-pointer hover:text-slate-200" onClick={() => handleSort("passRate")}>最近通过率 {getSortIcon("passRate")}</th>
                  <th className="px-4 py-3 font-medium w-[80px]">状态</th>
                  <th className="px-4 py-3 font-medium w-[100px] text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((rule) => {
                  const category = categoryConfig[rule.category];
                  const severity = severityConfig[rule.severity];
                  const status = statusConfig[rule.status];
                  return (
                    <tr key={rule.id} className={`border-b border-slate-800/60 transition hover:bg-slate-800/40 ${selection.isSelected(rule.id) ? 'bg-cyan-500/5' : ''}`}>
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selection.isSelected(rule.id)} onChange={() => selection.toggle(rule.id)} className="accent-cyan-500" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                        <InlineEdit
                          value={rule.name}
                          onSave={(val) => { rule.name = val; toast.success('规则名称已更新'); }}
                          displayClassName="font-medium text-white hover:text-cyan-300"
                          showIcon={false}
                        />
                        <div className="font-mono text-xs text-slate-500">{rule.code}</div>
                      </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 text-xs ${category.border} ${category.bg} ${category.color}`}>
                            {rule.category}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] ${severity.bg} ${severity.color}`}>
                            {rule.severity}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-300">{rule.tableName}</div>
                        <div className="mt-0.5 font-mono text-xs text-slate-500">{rule.fieldName}</div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <InlineEdit
                          value={rule.threshold}
                          onSave={(val) => { rule.threshold = val; toast.success('阈值已更新'); }}
                          displayClassName="text-xs text-slate-400"
                          showIcon={false}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                rule.passRate >= 99 ? "bg-emerald-400" : rule.passRate >= 98 ? "bg-amber-400" : "bg-rose-400"
                              }`}
                              style={{ width: `${Math.min(rule.passRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-300">{rule.passRate ? `${rule.passRate}%` : "-"}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">问题 {rule.issueCount}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(rule)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                            title={rule.status === "enabled" ? "停用" : "启用"}
                          >
                            {rule.status === "enabled" ? <ToggleRight className="h-4 w-4 text-emerald-300" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button onClick={() => openDrawer(rule)} className="rounded-md px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/10">
                            详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedRules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      没有匹配的质量规则
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {selection.selectedCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/20 text-sm">
                <span className="text-cyan-300">已选 {selection.selectedCount} 项</span>
                <button onClick={() => { toast.success(`批量启用 ${selection.selectedCount} 条规则`); selection.clear(); }} className="px-3 py-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs">批量启用</button>
                <button onClick={() => { toast.success(`批量停用 ${selection.selectedCount} 条规则`); selection.clear(); }} className="px-3 py-1 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs">批量停用</button>
                <button onClick={() => { toast.error(`批量删除 ${selection.selectedCount} 条规则`); selection.clear(); }} className="px-3 py-1 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 text-xs">批量删除</button>
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredRules.length / pageSize)}
              pageSize={pageSize}
              total={filteredRules.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        </section>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button className="flex-1 bg-black/60 backdrop-blur-sm" aria-label="关闭详情" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-cyan-300" />
                    <h2 className="text-lg font-semibold text-white">{selectedRule.name}</h2>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">{selectedRule.code}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="mb-3 text-sm font-medium text-white">规则定义</h3>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <Info label="规则分类" value={selectedRule.category} />
                  <Info label="严重级别" value={selectedRule.severity} />
                  <Info label="负责人" value={selectedRule.owner} />
                  <Info label="业务域" value={selectedRule.domain} />
                  <Info label="调度周期" value={selectedRule.schedule} />
                  <Info label="最近运行" value={selectedRule.lastRun} />
                </div>
                <div className="mt-4">
                  <div className="mb-1 text-xs text-slate-500">规则描述</div>
                  <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-300">{selectedRule.description}</div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <GitBranch className="h-4 w-4 text-cyan-300" />
                  数据对象与校验表达式
                </h3>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <Info label="数据源" value={selectedRule.dataSource} />
                  <Info label="绑定对象" value={`${selectedRule.tableName}.${selectedRule.fieldName}`} />
                </div>
                <div className="mt-4 rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-6 text-cyan-100">
                  {selectedRule.checkExpression}
                </div>
                <div className="mt-3 text-xs text-slate-400">阈值策略：{selectedRule.threshold}</div>
              </section>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">新建质量规则</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid max-h-[calc(90vh-132px)] gap-4 overflow-y-auto p-5 md:grid-cols-2">
              <Field label="规则名称">
                <input value={draftRule.name} onChange={(e) => setDraftRule({ ...draftRule, name: e.target.value })} className={inputClass} />
              </Field>
              <Field label="规则编码">
                <input value={draftRule.code} onChange={(e) => setDraftRule({ ...draftRule, code: e.target.value })} placeholder="如 QR_ORDER_ID_NOT_NULL" className={inputClass} />
              </Field>
              <Field label="规则分类">
                <select value={draftRule.category} onChange={(e) => setDraftRule({ ...draftRule, category: e.target.value as RuleCategory })} className={inputClass}>
                  {categories.filter((item) => item !== "全部").map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="严重级别">
                <select value={draftRule.severity} onChange={(e) => setDraftRule({ ...draftRule, severity: e.target.value as RuleSeverity })} className={inputClass}>
                  {(["高", "中", "低"] as RuleSeverity[]).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="业务域">
                <select value={draftRule.domain} onChange={(e) => setDraftRule({ ...draftRule, domain: e.target.value })} className={inputClass}>
                  {domains.filter((item) => item !== "全部").map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="数据源">
                <select value={draftRule.dataSource} onChange={(e) => setDraftRule({ ...draftRule, dataSource: e.target.value })} className={inputClass}>
                  {["mysql-prod", "pg-cdp", "hive-warehouse", "clickhouse-bi"].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="表名">
                <input value={draftRule.tableName} onChange={(e) => setDraftRule({ ...draftRule, tableName: e.target.value })} placeholder="如 dwd.dwd_order_detail" className={inputClass} />
              </Field>
              <Field label="字段名">
                <input value={draftRule.fieldName} onChange={(e) => setDraftRule({ ...draftRule, fieldName: e.target.value })} placeholder="如 order_id" className={inputClass} />
              </Field>
              <Field label="阈值策略">
                <input value={draftRule.threshold} onChange={(e) => setDraftRule({ ...draftRule, threshold: e.target.value })} className={inputClass} />
              </Field>
              <Field label="调度周期">
                <input value={draftRule.schedule} onChange={(e) => setDraftRule({ ...draftRule, schedule: e.target.value })} className={inputClass} />
              </Field>
              <div className="md:col-span-2">
                <Field label="校验表达式">
                  <textarea
                    value={draftRule.checkExpression}
                    onChange={(e) => setDraftRule({ ...draftRule, checkExpression: e.target.value })}
                    rows={3}
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="规则说明">
                  <textarea
                    value={draftRule.description}
                    onChange={(e) => setDraftRule({ ...draftRule, description: e.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={saveDraft} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white">
                保存草稿
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-slate-500">{label}</div>
      <div className="text-slate-300">{value}</div>
    </div>
  );
}
