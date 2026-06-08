import { useState, useEffect, useMemo } from "react";
import { fetchCodeSets, fetchCodeValues, createCodeSet, updateCodeSet, deleteCodeSet, cloneCodeSet, importCodeSets, createCodeValue, updateCodeValue, deleteCodeValue } from "../../services/api";
import Breadcrumb from "../../components/common/Breadcrumb";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface CodeSet {
  id: string;
  code: string;
  name: string;
  source: string;
  type: "national" | "industry" | "enterprise";
  status: "draft" | "reviewing" | "published";
  itemCount: number;
  updateTime: string;
  creator: string;
  isBuiltIn?: boolean;
}

interface CodeValue {
  id: string;
  value: string;
  label: string;
  remark: string;
}

const TYPE_MAP: Record<string, string> = {
  national: "国家标准",
  industry: "行业标准",
  enterprise: "企业标准"
};

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, border: string, dot: string }> = {
  draft: { label: "草稿中", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30", dot: "bg-slate-400" },
  reviewing: { label: "审核中", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30", dot: "bg-amber-400" },
  published: { label: "已发布", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", dot: "bg-emerald-400" }
};

export default function CodeManage() {
  const [codeSets, setCodeSets] = useState<CodeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");
  useKeyboardShortcut({
    'ctrl+n': () => setIsCodeSetModalOpen(true),
    'escape': () => setIsCodeSetModalOpen(false),
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedSearchKeyword = useDebounce(searchKeyword, 300);
  const [selectedType, setSelectedType] = useState<"all" | "national" | "industry" | "enterprise">("all");

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [currentCodeSet, setCurrentCodeSet] = useState<CodeSet | null>(null);
  const [codeValues, setCodeValues] = useState<CodeValue[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);

  const [isCodeSetModalOpen, setIsCodeSetModalOpen] = useState(false);
  const [codeSetForm, setCodeSetForm] = useState<Partial<CodeSet>>({});

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [isCodeValueModalOpen, setIsCodeValueModalOpen] = useState(false);
  const [codeValueMode, setCodeValueMode] = useState<"add" | "edit">("add");
  const [codeValueForm, setCodeValueForm] = useState<Partial<CodeValue>>({});

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [codeValueToDelete, setCodeValueToDelete] = useState<CodeValue | null>(null);

  const [isCodeSetDeleteConfirmOpen, setIsCodeSetDeleteConfirmOpen] = useState(false);
  const [codeSetToDelete, setCodeSetToDelete] = useState<CodeSet | null>(null);

  const loadData = () => {
    setLoading(true);
    fetchCodeSets().then((res) => {
      setCodeSets(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetail = async (cs: CodeSet) => {
    setCurrentCodeSet(cs);
    setIsDetailDrawerOpen(true);
    await loadCodeValues(cs.code);
  };

  const loadCodeValues = async (code: string) => {
    setLoadingValues(true);
    try {
      const values = await fetchCodeValues(code);
      setCodeValues(values);
    } finally {
      setLoadingValues(false);
    }
  };

  const handleSaveCodeSet = async () => {
    if (codeSetForm.id) {
      await updateCodeSet(codeSetForm.id, codeSetForm);
    } else {
      await createCodeSet(codeSetForm);
    }
    setIsCodeSetModalOpen(false);
    setCodeSetForm({});
    loadData();
  };

  const handleDeleteCodeSet = async () => {
    if (!codeSetToDelete) return;
    await deleteCodeSet(codeSetToDelete.id);
    setIsCodeSetDeleteConfirmOpen(false);
    setCodeSetToDelete(null);
    loadData();
  };

  const handleCloneCodeSet = async (cs: CodeSet) => {
    await cloneCodeSet(cs.id);
    loadData();
  };

  const handleImport = async () => {
    if (importFile) {
      await importCodeSets(importFile);
      setIsImportOpen(false);
      setImportFile(null);
      loadData();
    }
  };

  const handleSaveCodeValue = async () => {
    if (!currentCodeSet) return;
    if (codeValueMode === "add") {
      await createCodeValue(currentCodeSet.code, codeValueForm);
    } else if (codeValueForm.id) {
      await updateCodeValue(currentCodeSet.code, codeValueForm.id, codeValueForm);
    }
    setIsCodeValueModalOpen(false);
    setCodeValueForm({});
    loadCodeValues(currentCodeSet.code);
  };

  const handleDeleteCodeValue = async () => {
    if (!currentCodeSet || !codeValueToDelete) return;
    await deleteCodeValue(currentCodeSet.code, codeValueToDelete.id);
    setIsDeleteConfirmOpen(false);
    setCodeValueToDelete(null);
    loadCodeValues(currentCodeSet.code);
  };

  const filteredCodeSets = useMemo(() => {
    return codeSets.filter(cs => {
      if (selectedType !== "all" && cs.type !== selectedType) return false;
      if (searchKeyword && 
          !cs.name.toLowerCase().includes(searchKeyword.toLowerCase()) && 
          !cs.code.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [codeSets, searchKeyword, selectedType]);

  if (error) {
    return <ErrorFallback onRetry={loadData} />;
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据标准" }, { label: "码值管理" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            码值管理
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {codeSets.length} 套标准代码
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">管理国家、行业及企业内部的规范化标准代码表（Code Table）</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            导入码表
          </button>
          <button 
            onClick={() => {
              setCodeSetForm({ type: "national" });
              setIsCodeSetModalOpen(true);
            }}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            新建码表
          </button>
        </div>
      </div>

      {/* 筛选区 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索码表名称、编码..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/30 p-1">
            <button onClick={() => setSelectedType("all")} className={`rounded-md px-3 py-1 text-xs transition ${selectedType === "all" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>全部来源</button>
            <button onClick={() => setSelectedType("national")} className={`rounded-md px-3 py-1 text-xs transition ${selectedType === "national" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>国家标准</button>
            <button onClick={() => setSelectedType("industry")} className={`rounded-md px-3 py-1 text-xs transition ${selectedType === "industry" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>行业标准</button>
            <button onClick={() => setSelectedType("enterprise")} className={`rounded-md px-3 py-1 text-xs transition ${selectedType === "enterprise" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>企业内部</button>
          </div>
        </div>
      </div>

      {/* 数据表 */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <table className="min-w-[780px] w-full table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-xs text-slate-400">
              <th className="px-5 py-3 font-medium w-[200px]">码表名称 / 编码</th>
              <th className="px-5 py-3 font-medium w-[100px]">来源类型</th>
              <th className="px-5 py-3 font-medium w-[120px]">参考依据</th>
              <th className="px-5 py-3 font-medium w-[80px] text-center">码值数量</th>
              <th className="px-5 py-3 font-medium w-[80px]">状态</th>
              <th className="px-5 py-3 font-medium w-[90px]">维护人</th>
              <th className="px-5 py-3 font-medium w-[110px]">更新时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredCodeSets.map(cs => {
              const status = STATUS_CONFIG[cs.status];
              return (
                <tr 
                  key={cs.id} 
                  className="group hover:bg-slate-800/30 transition cursor-pointer"
                >
                  <td className="px-5 py-3" onClick={() => openDetail(cs)}>
                    <div className="font-medium text-white group-hover:text-cyan-400 transition">{cs.name}</div>
                    <div className="font-mono text-xs text-slate-500 mt-0.5">{cs.code}</div>
                  </td>
                  <td className="px-5 py-3" onClick={() => openDetail(cs)}>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{TYPE_MAP[cs.type]}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs" onClick={() => openDetail(cs)}>{cs.source}</td>
                  <td className="px-5 py-3 text-center" onClick={() => openDetail(cs)}>
                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-slate-800 px-2 text-xs font-medium text-slate-300 border border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition">
                      {cs.itemCount}
                    </span>
                  </td>
                  <td className="px-5 py-3" onClick={() => openDetail(cs)}>
                    <span className={`inline-flex items-center gap-1 rounded-md border ${status.border} ${status.bg} px-2 py-0.5 text-[10px] ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3" onClick={() => openDetail(cs)}>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white">
                        {cs.creator.charAt(0)}
                      </div>
                      {cs.creator}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400" onClick={() => openDetail(cs)}>{cs.updateTime}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneCodeSet(cs);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        克隆
                      </button>
                      {!cs.isBuiltIn && cs.status === 'draft' && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCodeSetForm(cs);
                              setIsCodeSetModalOpen(true);
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-300"
                          >
                            编辑
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCodeSetToDelete(cs);
                              setIsCodeSetDeleteConfirmOpen(true);
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredCodeSets.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">没有找到匹配的码表记录</td>
              </tr>
            )}
          </tbody>
        </table>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCodeSets.length / pageSize)}
              pageSize={pageSize}
              total={filteredCodeSets.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
      </div>

      {/* 码值明细抽屉 */}
      {isDetailDrawerOpen && currentCodeSet && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailDrawerOpen(false)} />
          <div className="w-[640px] bg-slate-950 border-l border-slate-800 overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{currentCodeSet.name}</h2>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{currentCodeSet.code}</span>
                    <span className="text-slate-500">{TYPE_MAP[currentCodeSet.type]}</span>
                  </div>
                </div>
                <button onClick={() => setIsDetailDrawerOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                <div><span className="text-slate-500 block mb-1 text-xs">参考依据</span><span className="text-slate-300">{currentCodeSet.source}</span></div>
                <div><span className="text-slate-500 block mb-1 text-xs">维护责任人</span><span className="text-slate-300">{currentCodeSet.creator}</span></div>
              </div>
            </div>
            
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">码值列表</h3>
                {!currentCodeSet.isBuiltIn && currentCodeSet.status === 'draft' && (
                  <button 
                    onClick={() => {
                      setCodeValueMode("add");
                      setCodeValueForm({});
                      setIsCodeValueModalOpen(true);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加码值
                  </button>
                )}
              </div>
              
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/60 text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">代码 (Value)</th>
                      <th className="px-4 py-3 font-medium">含义 (Label)</th>
                      <th className="px-4 py-3 font-medium">说明备注</th>
                      <th className="px-4 py-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingValues ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
                        </td>
                      </tr>
                    ) : codeValues.length > 0 ? (
                      codeValues.map(cv => (
                        <tr key={cv.id} className="hover:bg-slate-800/30 group">
                          <td className="px-4 py-3 font-mono text-cyan-400">{cv.value}</td>
                          <td className="px-4 py-3 text-white">{cv.label}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{cv.remark || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            {!currentCodeSet.isBuiltIn && currentCodeSet.status === 'draft' && (
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                                <button 
                                  onClick={() => {
                                    setCodeValueMode("edit");
                                    setCodeValueForm(cv);
                                    setIsCodeValueModalOpen(true);
                                  }}
                                  className="text-xs text-cyan-400 hover:text-cyan-300">编辑</button>
                                <button 
                                  onClick={() => {
                                    setCodeValueToDelete(cv);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  className="text-xs text-red-400 hover:text-red-300">删除</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">暂无码值数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建码表弹窗 */}
      {isCodeSetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">新建标准码表</h3>
              <button onClick={() => setIsCodeSetModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">码表名称 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={codeSetForm.name || ""}
                    onChange={(e) => setCodeSetForm({ ...codeSetForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="如: 人的性别代码"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">码表编码 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={codeSetForm.code || ""}
                    onChange={(e) => setCodeSetForm({ ...codeSetForm, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                    placeholder="如: GB_T_2261_1"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">来源类型</label>
                  <select
                    value={codeSetForm.type || "national"}
                    onChange={(e) => setCodeSetForm({ ...codeSetForm, type: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="national">国家标准</option>
                    <option value="industry">行业标准</option>
                    <option value="enterprise">企业内部</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">参考依据</label>
                  <input
                    type="text"
                    value={codeSetForm.source || ""}
                    onChange={(e) => setCodeSetForm({ ...codeSetForm, source: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="如: 国标(GB/T 2261.1-2003)"
                  />
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setIsCodeSetModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleSaveCodeSet} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {isImportOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">导入码表</h3>
              <button onClick={() => { setIsImportOpen(false); setImportFile(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-400">请下载 <a href="#" className="text-cyan-400 hover:underline">码表导入模板.xlsx</a>，按照模板格式填写后上传。</p>
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

      {/* 码值表单弹窗 */}
      {isCodeValueModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">
                {codeValueMode === "add" ? "新增码值" : "编辑码值"}
              </h3>
              <button onClick={() => setIsCodeValueModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">代码 (Value) <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={codeValueForm.value || ""}
                    onChange={(e) => setCodeValueForm({ ...codeValueForm, value: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                    placeholder="如: 1 或 M"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">含义 (Label) <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={codeValueForm.label || ""}
                    onChange={(e) => setCodeValueForm({ ...codeValueForm, label: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="如: 男性"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">说明备注</label>
                  <textarea
                    value={codeValueForm.remark || ""}
                    onChange={(e) => setCodeValueForm({ ...codeValueForm, remark: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="选填"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setIsCodeValueModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleSaveCodeValue} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 码表删除确认弹窗 */}
      {isCodeSetDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-96 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">确认删除该码表？</h3>
            <p className="mb-6 text-sm text-slate-400">将删除码表 <strong>{codeSetToDelete?.name} ({codeSetToDelete?.code})</strong>，该操作不可恢复。</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsCodeSetDeleteConfirmOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleDeleteCodeSet} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 码值删除确认弹窗 */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-96 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">确认删除该码值？</h3>
            <p className="mb-6 text-sm text-slate-400">将删除码值 <strong>{codeValueToDelete?.label} ({codeValueToDelete?.value})</strong>，该操作不可恢复。</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleDeleteCodeValue} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
