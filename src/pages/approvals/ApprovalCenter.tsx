import { useState, useEffect } from "react";
import { fetchApprovals, processApproval } from "../../services/api";
import Breadcrumb from "../../components/common/Breadcrumb";
import { CheckCircle, XCircle, Clock, Search, X, Filter } from "lucide-react";
import toast from 'react-hot-toast';
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface Approval {
  id: string;
  moduleType: 'data_model' | 'data_standard' | 'code_value';
  title: string;
  applicant: string;
  applyTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processTime?: string;
  processor?: string;
  payload: any;
}

const MODULE_TYPES = {
  all: '全部模块',
  data_model: '数据建模',
  data_standard: '数据标准',
  code_value: '码值管理'
};

interface ApprovalCenterProps {
  viewType: 'todos' | 'applies' | 'processed';
}

export default function ApprovalCenter({ viewType }: ApprovalCenterProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  useKeyboardShortcut({
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedsearchQuery = useDebounce(searchQuery, 300);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApprovals();
      setApprovals(res.data || res);
    } catch (error) {
      setError(true);
      toast.error("获取审批列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setSelectedApproval(null);
  }, [viewType]);

  const handleProcess = async (action: 'approve' | 'reject') => {
    if (!selectedApproval) return;
    setIsProcessing(true);
    try {
      await processApproval(selectedApproval.id, action);
      toast.success(`审批已${action === 'approve' ? '通过' : '驳回'}`);
      setSelectedApproval(null);
      loadData();
    } catch (error) {
      toast.error("审批处理失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApprovals = approvals.filter(a => {
    // 1. View Type Filter
    let matchView = false;
    if (viewType === 'todos') {
      matchView = a.status === 'pending';
    } else if (viewType === 'applies') {
      // In a real app, match applicant === currentUser. Using a simplified check here.
      matchView = a.applicant === '当前用户' || a.applicant === '张无忌'; 
    } else if (viewType === 'processed') {
      matchView = a.status !== 'pending';
    }

    // 2. Module Filter
    const matchModule = selectedModule === 'all' || a.moduleType === selectedModule;

    // 3. Search Filter
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        a.applicant.toLowerCase().includes(searchQuery.toLowerCase());
                        
    return matchView && matchModule && matchSearch;
  });

  const getPageTitle = () => {
    if (viewType === 'todos') return '待我审批';
    if (viewType === 'applies') return '我发起的';
    if (viewType === 'processed') return '已处理';
    return '审批中心';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "审批中心" }, { label: getPageTitle() }]} />
          <h1 className="mt-2 text-2xl font-semibold text-white">{getPageTitle()}</h1>
          <p className="mt-1 text-sm text-slate-400">集中处理高危操作（如物理表同步、数据标准发布等）的申请审批</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-sm text-white py-2 pl-3 pr-8 focus:outline-none focus:border-cyan-500"
            >
              {Object.entries(MODULE_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text"
              placeholder="搜索申请事项或申请人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
              暂无匹配的工单
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 overflow-x-auto">
              <table className="min-w-[780px] w-full table-fixed text-left text-sm">
                <thead className="bg-slate-900/60 text-xs text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium w-[120px]">工单编号</th>
                    <th className="px-4 py-3 font-medium w-[100px]">所属模块</th>
                    <th className="px-4 py-3 font-medium w-[180px]">申请事项</th>
                    <th className="px-4 py-3 font-medium w-[90px]">申请人</th>
                    <th className="px-4 py-3 font-medium w-[110px]">申请时间</th>
                    <th className="px-4 py-3 font-medium w-[80px]">状态</th>
                    <th className="px-4 py-3 font-medium w-[100px] text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {paginatedFilteredApprovals.map(approval => (
                    <tr key={approval.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{approval.id}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {MODULE_TYPES[approval.moduleType as keyof typeof MODULE_TYPES]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{approval.title}</td>
                      <td className="px-4 py-3 text-slate-300">{approval.applicant}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{approval.applyTime}</td>
                      <td className="px-4 py-3">
                        {approval.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            <Clock className="h-3 w-3" /> 待审批
                          </span>
                        )}
                        {approval.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                            <CheckCircle className="h-3 w-3" /> 已通过
                          </span>
                        )}
                        {approval.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">
                            <XCircle className="h-3 w-3" /> 已驳回
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setSelectedApproval(approval)}
                          className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                        >
                          {viewType === 'todos' ? '处理' : '查看'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredApprovals.length / pageSize)}
              pageSize={pageSize}
              total={filteredApprovals.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedApproval(null)} />
          <div className="w-[500px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">工单详情</h2>
              <button onClick={() => setSelectedApproval(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">基本信息</h3>
                <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4 space-y-3 text-sm">
                  <div className="flex">
                    <span className="w-24 text-slate-400">工单编号：</span>
                    <span className="text-slate-200 font-mono">{selectedApproval.id}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400">所属模块：</span>
                    <span className="text-slate-200">{MODULE_TYPES[selectedApproval.moduleType as keyof typeof MODULE_TYPES]}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400">申请事项：</span>
                    <span className="text-cyan-400 font-medium">{selectedApproval.title}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400">申请人：</span>
                    <span className="text-slate-200">{selectedApproval.applicant}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400">申请时间：</span>
                    <span className="text-slate-200">{selectedApproval.applyTime}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-400">状态：</span>
                    <span>
                      {selectedApproval.status === 'pending' && <span className="text-amber-400">待审批</span>}
                      {selectedApproval.status === 'approved' && <span className="text-emerald-400">已通过</span>}
                      {selectedApproval.status === 'rejected' && <span className="text-rose-400">已驳回</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">申请原因</h3>
                <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4 text-sm text-slate-300 min-h-[100px] whitespace-pre-wrap">
                  {selectedApproval.reason}
                </div>
              </div>

              {/* Dynamic Payload Detail Component based on moduleType */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">业务详情</h3>
                {selectedApproval.moduleType === 'data_model' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                    <p className="text-cyan-400">模型名称: {selectedApproval.payload?.modelName}</p>
                    <p>目标动作: <span className="text-emerald-400">CREATE/REPLACE TABLE</span></p>
                    <p className="text-slate-500 mt-2">-- DDL Preview --</p>
                    <div className="text-slate-400 bg-slate-900/50 p-2 rounded whitespace-pre-wrap">
                      {selectedApproval.payload?.ddl || "CREATE TABLE ..."}
                    </div>
                  </div>
                )}
                {selectedApproval.moduleType === 'data_standard' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-300">
                    <p className="text-emerald-400 mb-2">标准差异:</p>
                    <p className="font-mono text-xs bg-slate-900/50 p-2 rounded">{selectedApproval.payload?.diff}</p>
                  </div>
                )}
                {selectedApproval.moduleType === 'code_value' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-300">
                    <p className="text-amber-400 mb-2">字典更新详情:</p>
                    <p className="font-mono text-xs bg-slate-900/50 p-2 rounded">{selectedApproval.payload?.diff}</p>
                  </div>
                )}
              </div>

              {selectedApproval.status !== 'pending' && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">处理信息</h3>
                  <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4 space-y-3 text-sm">
                    <div className="flex">
                      <span className="w-24 text-slate-400">处理人：</span>
                      <span className="text-slate-200">{selectedApproval.processor}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-400">处理时间：</span>
                      <span className="text-slate-200">{selectedApproval.processTime}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedApproval.status === 'pending' && viewType === 'todos' && (
              <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => handleProcess('reject')}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
                >
                  驳回
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleProcess('approve')}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    "同意" + (selectedApproval.moduleType === 'data_model' ? "并执行同步" : "发布")
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
