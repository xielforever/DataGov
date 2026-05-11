import { useState, useEffect } from "react";
import { fetchModels, updateModel, deleteModel, updateModelStatus, applyModelSync, fetchMetadataDataSources, fetchModelSyncLogs } from "../../services/api";
import Breadcrumb from "../../components/common/Breadcrumb";
import DataModelingWizard from "./DataModelingWizard";
import { Database, ChevronLeft, ChevronRight, FolderTree, Plus, FileText, X, AlertTriangle } from "lucide-react";
import toast from 'react-hot-toast';

interface Field {
  name: string;
  type: string;
  description: string;
  isPrimary: boolean;
  isNullable: boolean;
  standardId: string;
}

interface Model {
  id: string;
  name: string;
  cnName: string;
  layer: "ODS" | "DWD" | "DWS" | "ADS" | "DIM";
  domain: string;
  status: "draft" | "published" | "offline";
  owner: string;
  updateTime: string;
  dataSourceId: string;
  partitionType: string;
  lifecycle: number;
  description: string;
  syncStatus?: "unsynced" | "synced" | "failed" | "sync_approving";
  fields: Field[];
}

const LAYER_INFO: Record<string, { desc: string, color: string, bg: string, border: string }> = {
  ODS: { desc: "贴源层：存放未经处理的原始数据，结构上与源系统保持一致", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  DWD: { desc: "明细层：进行数据清洗、脱敏、规范化，构建标准明细事实表", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  DIM: { desc: "维度层：建立一致性维度表，保证统计口径一致性", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  DWS: { desc: "汇总层：按主题或业务过程进行轻度汇总，生成通用汇总指标", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  ADS: { desc: "应用层：面向前端应用直接提供数据，高度定制化结果表", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" }
};

const LAYER_COLORS: Record<string, string> = {
  ODS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DWD: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  DWS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ADS: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  DIM: "bg-amber-500/20 text-amber-400 border-amber-500/30"
};

const STATUS_MAP: Record<string, { label: string, color: string, dot: string }> = {
  draft: { label: "草稿", color: "text-slate-400", dot: "bg-slate-400" },
  published: { label: "已发布", color: "text-emerald-400", dot: "bg-emerald-400" },
  offline: { label: "已下线", color: "text-rose-400", dot: "bg-rose-400" }
};

export default function DataModeling() {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [models, setModels] = useState<Model[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedLayerTab, setSelectedLayerTab] = useState<string>("ODS");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDomain, selectedLayerTab]);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<Partial<Model> | null>(null);

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<Field>>({});
  const [fieldEditIndex, setFieldEditIndex] = useState<number>(-1);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logModelName, setLogModelName] = useState("");

  const [syncConfirmModel, setSyncConfirmModel] = useState<Model | null>(null);
  const [syncReason, setSyncReason] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modelsRes, dsRes] = await Promise.all([
        fetchModels(),
        fetchMetadataDataSources()
      ]);
      setModels(modelsRes);
      setDataSources(dsRes);
    } catch (error) {
      console.error(error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (window.confirm("确定要删除该数据模型吗？")) {
      try {
        await deleteModel(id);
        toast.success("模型已删除");
        loadData();
      } catch (error) {
        toast.error("删除失败");
      }
    }
  };

  const handleStatusChange = async (id: string, status: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      await updateModelStatus(id, status);
      toast.success(`模型已${status === "published" ? "发布" : "下线"}`);
      loadData();
    } catch (error) {
      toast.error("状态更新失败");
    }
  };

  const handleSyncToDb = (model: Model, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSyncConfirmModel(model);
    setSyncReason("");
  };

  const confirmSync = async () => {
    if (!syncConfirmModel) return;
    if (!syncReason.trim()) {
      toast.error("请填写申请原因");
      return;
    }
    setIsSyncing(true);
    try {
      await applyModelSync(syncConfirmModel.id, syncReason);
      toast.success("同步申请已提交，请等待审批");
      setSyncConfirmModel(null);
      setSyncReason("");
      loadData();
    } catch (error) {
      toast.error("申请提交失败");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleViewLogs = async (model: Model, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLogModelName(model.name);
    setIsLogModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await fetchModelSyncLogs(model.id);
      setSyncLogs(res.data || res);
    } catch (error) {
      toast.error("获取同步日志失败");
    } finally {
      setLoadingLogs(false);
    }
  };

  const getDataSourceName = (id: string) => {
    const ds = dataSources.find(d => d.id === id);
    return ds ? ds.name : id;
  };

  const handleSaveField = async () => {
    if (!currentModel) return;
    const newFields = [...(currentModel.fields || [])];
    
    if (fieldEditIndex > -1) {
      newFields[fieldEditIndex] = currentField as Field;
    } else {
      newFields.push(currentField as Field);
    }
    
    const updatedModel = { ...currentModel, fields: newFields };
    setCurrentModel(updatedModel);
    
    if (updatedModel.id) {
      await updateModel(updatedModel.id, updatedModel);
      loadData();
    }
    
    setIsFieldModalOpen(false);
  };

  const handleDeleteField = async (index: number) => {
    if (!currentModel || !window.confirm("确定要删除该字段吗？")) return;
    
    const newFields = [...(currentModel.fields || [])];
    newFields.splice(index, 1);
    
    const updatedModel = { ...currentModel, fields: newFields };
    setCurrentModel(updatedModel);
    
    if (updatedModel.id) {
      await updateModel(updatedModel.id, updatedModel);
      loadData();
    }
  };

  const domains = Array.from(new Set((models || []).map(m => m.domain || "未分类"))).sort();

  const filteredModels = (models || []).filter(m => {
    const matchDomain = selectedDomain === "all" || (m.domain || "未分类") === selectedDomain;
    const matchLayer = m.layer === selectedLayerTab;
    return matchDomain && matchLayer;
  });

  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);

  if (viewMode !== 'list') {
    return (
      <div className="h-full">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <span>数据开发</span>
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => setViewMode('list')} className="hover:text-white transition-colors">数据建模</button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-200">{viewMode === 'create' ? '新建模型' : '编辑模型'}</span>
        </div>
        <div className="h-[calc(100vh-160px)]">
          <DataModelingWizard 
            mode={viewMode}
            initialData={currentModel}
            defaultDomain={selectedDomain !== "all" ? selectedDomain : undefined}
            defaultLayer={selectedLayerTab}
            onBack={() => {
              setViewMode('list');
              setCurrentModel(null);
              loadData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据开发" }, { label: "数据建模" }]} />
          <h1 className="mt-2 text-2xl font-semibold text-white">数据建模</h1>
          <p className="mt-1 text-sm text-slate-400">构建和管理数仓各层级的逻辑模型与物理模型。</p>
        </div>
      </div>

      {/* Main Content: Left Tree + Right Tabs */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-12rem)] bg-slate-900 text-slate-300 overflow-hidden rounded-lg shadow-xl border border-slate-800">
          {/* Left Sidebar - Domains */}
          <div className="w-64 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900/50">
            <div className="p-3 border-b border-slate-800 font-medium text-slate-200 flex items-center gap-2 bg-slate-900/80">
              <FolderTree className="h-4 w-4 text-cyan-500" />
              <span className="text-sm">业务域</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
              <button
                onClick={() => setSelectedDomain("all")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors mb-1 ${
                  selectedDomain === "all" ? "bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent"
                }`}
              >
                <span className="truncate">全部业务域</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedDomain === "all" ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500"}`}>
                  {(models || []).length}
                </span>
              </button>
              
              <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-0.5">
                {domains.map(domain => {
                  const count = (models || []).filter(m => (m.domain || "未分类") === domain).length;
                  return (
                    <button
                      key={domain}
                      onClick={() => setSelectedDomain(domain)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors group ${
                        selectedDomain === domain ? "bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      <span className="truncate">{domain}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${selectedDomain === domain ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500 group-hover:text-slate-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col min-w-0 relative bg-slate-950">
            {/* Tabs */}
            <div className="flex items-center px-4 pt-2 border-b border-slate-800 bg-slate-900/60 gap-6">
              {["ODS", "DWD", "DIM", "DWS", "ADS"].map(layer => {
                const count = (models || []).filter(m => m.layer === layer && (selectedDomain === "all" || (m.domain || "未分类") === selectedDomain)).length;
                return (
                  <button
                    key={layer}
                    onClick={() => setSelectedLayerTab(layer)}
                    className={`pb-3 pt-2 px-2 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedLayerTab === layer 
                        ? "border-blue-500 text-blue-400" 
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {layer}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedLayerTab === layer ? "bg-blue-500/20" : "bg-slate-800"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Layer Info Banner */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${LAYER_INFO[selectedLayerTab]?.bg || 'bg-slate-800/50'} ${LAYER_INFO[selectedLayerTab]?.color || 'text-slate-400'}`}>
                   <Database className="h-5 w-5" />
                 </div>
                 <div>
                   <h3 className={`font-medium ${LAYER_INFO[selectedLayerTab]?.color || 'text-white'}`}>{selectedLayerTab}</h3>
                   <p className="text-xs text-slate-400 mt-0.5">{LAYER_INFO[selectedLayerTab]?.desc}</p>
                 </div>
               </div>
               
               <button 
                  onClick={() => {
                    setCurrentModel({ 
                      layer: selectedLayerTab as any, 
                      domain: selectedDomain === "all" ? undefined : selectedDomain,
                      fields: [] 
                    });
                    setViewMode('create');
                  }}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border shadow-sm
                   ${LAYER_INFO[selectedLayerTab]?.bg || 'bg-slate-800/50'}
                   ${LAYER_INFO[selectedLayerTab]?.color || 'text-slate-300'}
                   ${LAYER_INFO[selectedLayerTab]?.border || 'border-slate-700'}
                   hover:brightness-110
                 `}
               >
                 <Plus className="h-4 w-4" />
                 新建模型
               </button>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-5">
              {filteredModels.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                  在该业务域和分层下暂无数据模型
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                  <table className="min-w-[1120px] w-full table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[20%]" />
                      <col className="w-[18%]" />
                      <col className="w-[16%]" />
                      <col className="w-[13%]" />
                      <col className="w-[10%]" />
                      <col className="w-[12%]" />
                      <col className="w-[11%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead className="bg-slate-900/60 text-xs text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-medium">模型名称</th>
                        <th className="px-5 py-3 font-medium">中文名</th>
                        <th className="px-5 py-3 font-medium">数据源</th>
                        <th className="px-5 py-3 font-medium">负责人</th>
                        <th className="px-5 py-3 font-medium">状态</th>
                        <th className="px-5 py-3 font-medium">同步状态</th>
                        <th className="px-5 py-3 font-medium">更新时间</th>
                        <th className="px-5 py-3 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {paginatedModels.map(model => (
                        <tr key={model.id} className="hover:bg-slate-800/30 group">
                          <td className="px-5 py-3">
                            <div 
                              className="font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentModel(model);
                                setIsDetailDrawerOpen(true);
                              }}
                            >
                              {model.name}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-300 whitespace-nowrap truncate">{model.cnName}</td>
                          <td className="px-5 py-3 text-slate-400">
                            <div className="flex items-center gap-1.5 truncate whitespace-nowrap">
                            <Database className="h-3 w-3" />
                            <span className="truncate">{getDataSourceName(model.dataSourceId)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 truncate">
                              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[9px] text-white">
                                {model.owner.charAt(0)}
                              </div>
                              <span className="truncate">{model.owner}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_MAP[model.status].dot}`}></span>
                              <span className={`text-xs ${STATUS_MAP[model.status].color}`}>{STATUS_MAP[model.status].label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {model.syncStatus === 'synced' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">已同步</span>
                            ) : model.syncStatus === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">同步失败</span>
                            ) : model.syncStatus === 'sync_approving' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">审批中</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">未同步</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{model.updateTime}</td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                              {model.status === 'draft' && (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentModel(model); setViewMode('edit'); }}
                                    className="text-xs text-cyan-400 hover:text-cyan-300">编辑</button>
                                  <button 
                                    onClick={(e) => handleStatusChange(model.id, 'published', e)}
                                    className="text-xs text-emerald-400 hover:text-emerald-300">发布</button>
                                  <button 
                                    onClick={(e) => handleDelete(model.id, e)}
                                    className="text-xs text-rose-400 hover:text-rose-300">删除</button>
                                </>
                              )}
                              {model.status === 'published' && (
                                <>
                                  {model.syncStatus === 'sync_approving' ? (
                                    <span className="text-xs text-amber-500 cursor-not-allowed">审批中</span>
                                  ) : (
                                    <button 
                                      onClick={(e) => handleSyncToDb(model, e)}
                                      className="text-xs text-blue-400 hover:text-blue-300">申请同步</button>
                                  )}
                                  <button 
                                    onClick={(e) => handleStatusChange(model.id, 'offline', e)}
                                    className="text-xs text-amber-400 hover:text-amber-300">下线</button>
                                </>
                              )}
                              {model.status === 'offline' && (
                                <>
                                  <button 
                                    onClick={(e) => handleStatusChange(model.id, 'draft', e)}
                                    className="text-xs text-cyan-400 hover:text-cyan-300">转草稿</button>
                                  <button 
                                    onClick={(e) => handleDelete(model.id, e)}
                                    className="text-xs text-rose-400 hover:text-rose-300">删除</button>
                                </>
                              )}
                              {model.syncStatus !== 'unsynced' && (
                                <button 
                                  onClick={(e) => handleViewLogs(model, e)}
                                  className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> 日志
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
                <span className="text-xs text-slate-500">
                  显示第 {(currentPage - 1) * ITEMS_PER_PAGE + 1} 到 {Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length)} 条，共 {filteredModels.length} 条
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-slate-300 font-mono px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
        {isDetailDrawerOpen && currentModel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailDrawerOpen(false)} />
          <div className="w-[800px] bg-slate-950 border-l border-slate-800 overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-3">
                    {currentModel.cnName}
                    <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium ${LAYER_COLORS[currentModel.layer!]}`}>
                      {currentModel.layer}
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 font-mono text-sm">
                    <span className="text-cyan-400">{currentModel.name}</span>
                    {currentModel.dataSourceId && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5" />
                          {getDataSourceName(currentModel.dataSourceId)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsDetailDrawerOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">模型字段定义</h3>
                {currentModel.status === 'draft' && (
                  <button 
                    onClick={() => {
                      setCurrentField({ isPrimary: false, isNullable: true });
                      setFieldEditIndex(-1);
                      setIsFieldModalOpen(true);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加字段
                  </button>
                )}
              </div>
              
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                <table className="min-w-[860px] w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[16%]" />
                    <col className="w-[32%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="bg-slate-900/60 text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">字段名称</th>
                      <th className="px-4 py-3 font-medium">数据类型</th>
                      <th className="px-4 py-3 font-medium">字段说明</th>
                      <th className="px-4 py-3 font-medium text-center">主键</th>
                      <th className="px-4 py-3 font-medium text-center">非空</th>
                      <th className="px-4 py-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {currentModel.fields?.map((field, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 group">
                        <td className="px-4 py-3 font-mono text-cyan-400 whitespace-nowrap truncate">{field.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-mono">{field.type}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 truncate">{field.description}</td>
                        <td className="px-4 py-3 text-center">
                          {field.isPrimary ? <span className="text-amber-400">🔑</span> : "-"}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400">
                          {field.isNullable ? "Y" : "N"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {currentModel.status === 'draft' && (
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                              <button 
                                onClick={() => {
                                  setCurrentField(field);
                                  setFieldEditIndex(idx);
                                  setIsFieldModalOpen(true);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300">编辑</button>
                              <button 
                                onClick={() => handleDeleteField(idx)}
                                className="text-xs text-rose-400 hover:text-rose-300">删除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!currentModel.fields || currentModel.fields.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">暂无字段定义</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Field Edit Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{fieldEditIndex > -1 ? "编辑字段" : "添加字段"}</h3>
              <button onClick={() => setIsFieldModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">字段名称 <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={currentField.name || ""}
                  onChange={(e) => setCurrentField({ ...currentField, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
                  placeholder="如: user_id"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">字段说明 <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={currentField.description || ""}
                  onChange={(e) => setCurrentField({ ...currentField, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="如: 用户唯一标识"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">数据类型 <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={currentField.type || ""}
                  onChange={(e) => setCurrentField({ ...currentField, type: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
                  placeholder="如: BIGINT"
                />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentField.isPrimary || false}
                    onChange={(e) => setCurrentField({ ...currentField, isPrimary: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                  />
                  <span className="text-sm text-slate-300">设为主键</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentField.isNullable || false}
                    onChange={(e) => setCurrentField({ ...currentField, isNullable: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                  />
                  <span className="text-sm text-slate-300">允许为空</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setIsFieldModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleSaveField} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                保存字段
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Removed old custom toast rendering */}
      {/* Sync Confirm Modal */}
      {syncConfirmModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-rose-500/30 bg-slate-900 shadow-2xl overflow-hidden flex flex-col transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 mb-4 mx-auto">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">高危操作确认</h3>
              <div className="text-sm text-slate-300 text-center mb-6 space-y-2">
                <p>
                  您正在尝试同步数据模型 <span className="font-mono text-cyan-400 font-semibold">{syncConfirmModel.name}</span> 至底层数据源。
                </p>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 mt-4 text-left">
                  <p className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> 警告：此操作不可逆！</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>系统将会执行 <code className="bg-rose-500/20 px-1 rounded">DROP TABLE IF EXISTS</code> 删除现有的物理源表。</li>
                    <li>目标表中的所有存量数据将被彻底清空。</li>
                    <li>将会根据当前最新的模型设计结构重新创建物理表。</li>
                  </ul>
                </div>
                <p className="text-slate-400 mt-4">
                  请确保该表当前没有正在运行的生产任务依赖，或者您已做好了充分的数据备份。
                </p>
                <div className="mt-6 text-left">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    申请原因 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[80px] resize-none"
                    placeholder="请详细描述同步原因（必填）..."
                    value={syncReason}
                    onChange={(e) => setSyncReason(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-4 flex items-center justify-end gap-3">
              <button 
                disabled={isSyncing}
                onClick={() => setSyncConfirmModel(null)}
                className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                取消
              </button>
              <button 
                disabled={isSyncing}
                onClick={confirmSync}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    正在提交...
                  </>
                ) : (
                  "提交同步申请"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/80">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                模型同步日志
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono ml-2">
                  {logModelName}
                </span>
              </h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-slate-950/50">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400 mb-4" />
                  <p className="text-sm text-slate-500">正在加载日志数据...</p>
                </div>
              ) : syncLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                  暂无同步日志记录
                </div>
              ) : (
                <div className="space-y-4">
                  {syncLogs.map(log => (
                    <div key={log.id} className={`rounded-lg border p-4 ${log.status === 'success' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            log.status === 'success' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {log.status === 'success' ? '同步成功' : '同步失败'}
                          </span>
                          <span className="text-sm text-slate-300 font-mono">{log.syncTime}</span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <div className="h-4 w-4 rounded-full bg-slate-800 text-[9px] flex items-center justify-center text-white">
                            {log.operator.charAt(0)}
                          </div>
                          {log.operator}
                        </span>
                      </div>
                      <div className="mt-2 rounded bg-slate-950 p-3 text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap border border-slate-800/50 shadow-inner">
                        {log.details}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-4 flex justify-end">
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
