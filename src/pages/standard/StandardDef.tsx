import { useState, useEffect, useMemo } from "react";
import { fetchStandardDefinitions, createStandardDefinition, updateStandardDefinition, offlineStandardDefinition, importStandardDefinitions, fetchStandardDomains } from "../../services/api";
import Breadcrumb from "../../components/common/Breadcrumb";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useTableSort } from '../../hooks/useTableSort';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import InlineEdit from '../../components/common/InlineEdit';
import { useTableSelection } from '../../hooks/useTableSelection';

type StandardStatus = "draft" | "reviewing" | "published" | "offline";

interface StandardDefData {
  id: string;
  code: string;
  name: string;
  domain: string;
  type: string;
  length: number | string;
  status: StandardStatus;
  owner: string;
  updateTime: string;
  description: string;
}

const STATUS_CONFIG = {
  draft: { label: "草稿中", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30", dot: "bg-slate-400" },
  reviewing: { label: "审核中", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30", dot: "bg-amber-400" },
  published: { label: "已发布", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  offline: { label: "已下线", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30", dot: "bg-red-400" },
};

export default function StandardDef() {
  const [data, setData] = useState<StandardDefData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");
  useKeyboardShortcut({
    'ctrl+n': () => { setIsModalOpen(true); setModalMode('add'); setCurrentStandard({}); },
    'escape': () => { setIsModalOpen(false); setIsDetailDrawerOpen(false); },
  });

  const debouncedSearchKeyword = useDebounce(searchKeyword, 300);
  const [DOMAINS, setDOMAINS] = useState<string[]>(["全部"]);
  const [selectedDomain, setSelectedDomain] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState<"all" | StandardStatus>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "detail">("add");
  const [currentStandard, setCurrentStandard] = useState<Partial<StandardDefData>>({});
  const [isConfirmOfflineOpen, setIsConfirmOfflineOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const loadData = () => {
    setLoading(true);
    fetchStandardDefinitions().then((res) => {
      setData(res);
      setLoading(false);
    });
  };


  useEffect(() => {
    fetchStandardDomains().then((res) => setDOMAINS(["全部", ...(res as string[])])).catch(() => {});
  }, []);
  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (modalMode === "add") {
      await createStandardDefinition({ ...currentStandard, status: "draft", updateTime: new Date().toISOString().split("T")[0] });
    } else if (modalMode === "edit" && currentStandard.id) {
      await updateStandardDefinition(currentStandard.id, currentStandard);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleOffline = async () => {
    if (currentStandard.id) {
      await offlineStandardDefinition(currentStandard.id);
      setIsConfirmOfflineOpen(false);
      loadData();
    }
  };

  const handleImport = async () => {
    if (importFile) {
      await importStandardDefinitions(importFile);
      setIsImportOpen(false);
      setImportFile(null);
      loadData();
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedDomain !== "全部" && item.domain !== selectedDomain) return false;
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
      if (searchKeyword && !item.name.toLowerCase().includes(searchKeyword.toLowerCase()) && !item.code.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data, searchKeyword, selectedDomain, selectedStatus]);

  const stats = useMemo(() => ({
    total: data.length,
    published: data.filter((d) => d.status === "published").length,
    draft: data.filter((d) => d.status === "draft").length,
    reviewing: data.filter((d) => d.status === "reviewing").length,
  }), [data]);

  if (error) {
    return <ErrorFallback onRetry={loadData} />;
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
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据标准" }, { label: "标准定义" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            标准定义
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {stats.total} 项标准
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">统一管理企业级数据标准，规范数据命名、类型与取值</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            批量导入
          </button>
          <button 
            onClick={() => {
              setModalMode("add");
              setCurrentStandard({ type: "STRING", domain: "用户域" });
              setIsModalOpen(true);
            }}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            新建标准
          </button>
        </div>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "标准总数", value: stats.total, icon: "📋", color: "from-cyan-500/20 to-blue-500/5", text: "text-cyan-400" },
          { label: "已发布", value: stats.published, icon: "✅", color: "from-emerald-500/20 to-green-500/5", text: "text-emerald-400" },
          { label: "审核中", value: stats.reviewing, icon: "⏳", color: "from-amber-500/20 to-orange-500/5", text: "text-amber-400" },
          { label: "草稿中", value: stats.draft, icon: "📝", color: "from-slate-500/20 to-slate-400/5", text: "text-slate-400" },
        ].map((stat) => (
          <div key={stat.label} className={`relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br ${stat.color} p-5 backdrop-blur-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-400">{stat.label}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${stat.text}`}>{stat.value}</span>
                  <span className="text-sm text-slate-400">项</span>
                </div>
              </div>
              <div className="text-3xl opacity-80">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选与搜索 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索标准名称或编码..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/30 p-1">
            {[{ id: "all", label: "全部状态" }, ...Object.entries(STATUS_CONFIG).map(([id, conf]) => ({ id, label: conf.label }))].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id as any)}
                className={`rounded-md px-3 py-1 text-xs transition ${
                  selectedStatus === s.id ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">业务域</span>
            <div className="flex flex-wrap gap-1.5">
              {DOMAINS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedDomain(c)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    selectedDomain === c
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                      : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据表 */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <table className="min-w-[970px] w-full table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs text-slate-400">
              <th className="px-2 py-3 font-medium w-[36px]">
                    <input type="checkbox" checked={selection.isAllSelected} ref={(el) => { if (el) el.indeterminate = selection.isPartialSelected; }} onChange={selection.toggleAll} className="accent-cyan-500" />
                  </th>
                  <th className="px-4 py-3 font-medium w-[200px]">标准名称 / 编码</th>
              <th className="px-4 py-3 font-medium w-[100px]">业务域</th>
              <th className="px-4 py-3 font-medium w-[90px]">数据类型</th>
              <th className="px-4 py-3 font-medium w-[200px]">描述</th>
              <th className="px-4 py-3 font-medium w-[80px]">状态</th>
              <th className="px-4 py-3 font-medium w-[90px]">负责人</th>
              <th className="px-4 py-3 font-medium w-[110px]"><span className="cursor-pointer hover:text-slate-200" onClick={() => handleSort('updateTime')}>更新时间 {getSortIcon('updateTime')}</span></th>
              <th className="px-4 py-3 font-medium w-[100px] text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFilteredData.map((item) => {
              const status = STATUS_CONFIG[item.status];
              return (
                <tr
                  key={item.id}
                  onClick={() => {
                    setCurrentStandard(item);
                    setIsDetailDrawerOpen(true);
                  }}
                  className="group border-b border-slate-800/50 text-sm transition hover:bg-slate-800/30 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="font-mono text-xs text-slate-500">{item.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{item.domain}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300">{item.type}</div>
                    <div className="text-xs text-slate-500">长度: {item.length}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    <div className="max-w-[200px] truncate" title={item.description}>{item.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-md border ${status.border} ${status.bg} px-2 py-0.5 text-[10px] ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-semibold text-white">
                        {item.owner.charAt(0)}
                      </div>
                      {item.owner}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{item.updateTime}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 transition group-hover:opacity-100">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalMode("edit");
                          setCurrentStandard(item);
                          setIsModalOpen(true);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 text-xs">编辑</button>
                      {item.status === 'published' && <button onClick={(e) => { e.stopPropagation(); setCurrentStandard(item); setIsConfirmOfflineOpen(true); }} className="text-red-400 hover:text-red-300 text-xs">下线</button>}
                      {item.status === 'draft' && <button onClick={(e) => e.stopPropagation()} className="text-amber-400 hover:text-amber-300 text-xs">提交</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedFilteredData.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                  没有找到匹配的标准定义
                </td>
              </tr>
            )}
          </tbody>
        </table>
            {selection.selectedCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/20 text-sm">
                <span className="text-cyan-300">已选 {selection.selectedCount} 项</span>
                <button onClick={() => { toast.success(`批量发布 ${selection.selectedCount} 条`); selection.clear(); }} className="px-3 py-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs">批量操作</button>
                <button onClick={() => { toast.error(`批量删除 ${selection.selectedCount} 条`); selection.clear(); }} className="px-3 py-1 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 text-xs">批量删除</button>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredData.length / pageSize)}
              pageSize={pageSize}
              total={filteredData.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
      </div>

      {/* 标准表单/详情模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[600px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">
                {modalMode === "add" ? "新建数据标准" : modalMode === "edit" ? "编辑数据标准" : "数据标准详情"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">标准编码 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      disabled={modalMode === "detail"}
                      value={currentStandard.code || ""}
                      onChange={(e) => setCurrentStandard({ ...currentStandard, code: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      placeholder="如: STD_USER_ID"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">标准名称 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      disabled={modalMode === "detail"}
                      value={currentStandard.name || ""}
                      onChange={(e) => setCurrentStandard({ ...currentStandard, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      placeholder="如: 用户唯一标识"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">业务域 <span className="text-red-400">*</span></label>
                    <select
                      disabled={modalMode === "detail"}
                      value={currentStandard.domain || "用户域"}
                      onChange={(e) => setCurrentStandard({ ...currentStandard, domain: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    >
                      {DOMAINS.filter(d => d !== "全部").map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">负责人 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      disabled={modalMode === "detail"}
                      value={currentStandard.owner || ""}
                      onChange={(e) => setCurrentStandard({ ...currentStandard, owner: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      placeholder="输入负责人姓名"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">数据类型</label>
                    <select
                      disabled={modalMode === "detail"}
                      value={currentStandard.type || "STRING"}
                      onChange={(e) => setCurrentStandard({ ...currentStandard, type: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    >
                      {["STRING", "INT", "BIGINT", "DECIMAL", "DATE", "TIMESTAMP", "BOOLEAN"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">长度/精度</label>
                    <input
                      type="text"
                      disabled={modalMode === "detail"}
                      value={currentStandard.length || ""}
                      onChange={(e) => setCurrentStandard({ ...currentStandard, length: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      placeholder="如: 32 或 18,4"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">标准描述</label>
                  <textarea
                    disabled={modalMode === "detail"}
                    value={currentStandard.description || ""}
                    onChange={(e) => setCurrentStandard({ ...currentStandard, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    placeholder="输入该标准的详细定义规则和业务含义..."
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                {modalMode === "detail" ? "关闭" : "取消"}
              </button>
              {modalMode !== "detail" && (
                <button onClick={handleSave} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                  保存
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 下线确认弹窗 */}
      {isConfirmOfflineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-96 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">确认下线该标准？</h3>
            <p className="mb-6 text-sm text-slate-400">下线后，关联该标准的数据模型和质量规则可能会受到影响。确定要下线 <strong>{currentStandard.name}</strong> 吗？</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsConfirmOfflineOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleOffline} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                确认下线
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">批量导入标准</h3>
              <button onClick={() => { setIsImportOpen(false); setImportFile(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-400">请下载 <a href="#" className="text-cyan-400 hover:underline">标准导入模板.xlsx</a>，按照模板格式填写后上传。</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 hover:border-cyan-500/50 hover:bg-slate-900 transition relative">
                <svg className="mb-3 h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                {importFile ? (
                  <div className="text-sm text-cyan-400 z-10 pointer-events-none">{importFile.name}</div>
                ) : (
                  <div className="z-10 pointer-events-none text-center">
                    <p className="text-sm font-medium text-slate-300">点击或拖拽文件到此处</p>
                    <p className="mt-1 text-xs text-slate-500">支持 .xlsx, .xls 文件</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => { setIsImportOpen(false); setImportFile(null); }} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button 
                onClick={handleImport} 
                disabled={!importFile}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed">
                开始导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标准详情侧边抽屉 */}
      {isDetailDrawerOpen && currentStandard.id && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailDrawerOpen(false)} />
          <div className="w-[640px] bg-slate-950 border-l border-slate-800 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 border border-cyan-500/30 text-2xl">
                      📋
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{currentStandard.name}</h2>
                        <span className={`px-2 py-0.5 text-[10px] rounded border ${STATUS_CONFIG[currentStandard.status as StandardStatus].border} ${STATUS_CONFIG[currentStandard.status as StandardStatus].bg} ${STATUS_CONFIG[currentStandard.status as StandardStatus].color}`}>
                          {STATUS_CONFIG[currentStandard.status as StandardStatus].label}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-slate-400 mt-0.5">{currentStandard.code}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5">{currentStandard.domain}</span>
                        <span>·</span>
                        <span>{currentStandard.type}</span>
                        {currentStandard.length && <span>({currentStandard.length})</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsDetailDrawerOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      setModalMode("edit");
                      setIsModalOpen(true);
                    }}
                    className="flex-1 px-4 py-2 text-xs rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition">
                    编辑标准
                  </button>
                  {currentStandard.status === 'published' && (
                    <button 
                      onClick={() => {
                        setIsDetailDrawerOpen(false);
                        setIsConfirmOfflineOpen(true);
                      }}
                      className="px-4 py-2 text-xs rounded-lg bg-slate-800/50 border border-slate-700 text-red-400 hover:bg-slate-800 transition">
                      下线标准
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 px-6 border-t border-slate-800">
                <button className="px-4 py-3 text-xs font-medium border-b-2 text-cyan-300 border-cyan-500">基础信息</button>
                <button className="px-4 py-3 text-xs font-medium border-b-2 text-slate-400 border-transparent hover:text-white transition">关联模型</button>
                <button className="px-4 py-3 text-xs font-medium border-b-2 text-slate-400 border-transparent hover:text-white transition">质量规则</button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">基本属性</h4>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500 mb-1">标准名称</div>
                      <div className="text-slate-300">{currentStandard.name}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">标准编码</div>
                      <div className="text-slate-300 font-mono">{currentStandard.code}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">业务域</div>
                      <div className="text-slate-300">{currentStandard.domain}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">数据类型</div>
                      <div className="text-slate-300">{currentStandard.type}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">长度/精度</div>
                      <div className="text-slate-300">{currentStandard.length || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">负责人</div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-semibold text-white">
                          {currentStandard.owner?.charAt(0)}
                        </div>
                        {currentStandard.owner}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-500 mb-1">标准描述</div>
                      <div className="text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs leading-relaxed">
                        {currentStandard.description || '暂无描述'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">生命周期</h4>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="relative pl-4 border-l border-slate-700 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-500 border-2 border-slate-900"></div>
                      <div className="text-sm text-white font-medium">当前状态: {STATUS_CONFIG[currentStandard.status as StandardStatus].label}</div>
                      <div className="text-xs text-slate-500 mt-1">{currentStandard.updateTime} 更新</div>
                    </div>
                    <div className="relative opacity-60">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-500 border-2 border-slate-900"></div>
                      <div className="text-sm text-slate-300 font-medium">创建草稿</div>
                      <div className="text-xs text-slate-500 mt-1">由 {currentStandard.owner} 创建</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
