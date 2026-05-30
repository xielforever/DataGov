import { useState, useEffect, useCallback } from 'react';
import { fetchSyncOverview, fetchSyncTasks, updateSyncTaskStatus, fetchSyncLogs } from '../../services/api';
import Breadcrumb from '../../components/common/Breadcrumb';
import { Search, Plus, LayoutGrid, List, Play, Square, RotateCcw, X, ArrowRight, Zap, AlertTriangle, CheckCircle, Activity, HardDrive, Timer, TrendingUp, Database } from 'lucide-react';
import ErrorFallback from '../../components/common/ErrorFallback';
import { CardSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useTableSort } from '../../hooks/useTableSort';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useTableSelection } from '../../hooks/useTableSelection';

interface SyncTask {
  id: string;
  name: string;
  description: string;
  sourceType: string;
  sourceName: string;
  sourceHost: string;
  targetType: string;
  targetName: string;
  targetHost: string;
  syncType: 'realtime' | 'batch';
  mode: string;
  status: 'running' | 'stopped' | 'failed' | 'waiting';
  progress?: number;
  tables: number;
  records: string;
  delay?: string;
  qps?: string;
  lastSync: string;
  nextSync?: string;
  owner: string;
  department: string;
  createdAt: string;
  config: { concurrency: number; batchSize: number; retryCount: number; retryInterval: string };
  fieldMapping: { total: number; mapped: number; ignored: number };
  errorMsg?: string;
}

interface SyncLog {
  id: string;
  taskId: string;
  time: string;
  level: string;
  message: string;
}

interface SyncOverview {
  totalTasks: number;
  runningTasks: number;
  realtimeTasks: number;
  failedTasks: number;
  totalRecords: string;
  avgDelay: string;
  weeklySuccessRate: number;
  topSource: string;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '运行中' },
  stopped: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: '已停止' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', label: '已失败' },
  waiting: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '等待中' },
};

const sourceColors: Record<string, string> = {
  MySQL: 'bg-blue-500', PostgreSQL: 'bg-indigo-500', Hive: 'bg-amber-500', ClickHouse: 'bg-yellow-500',
  Kafka: 'bg-orange-500', MongoDB: 'bg-green-500', Oracle: 'bg-red-500', Redis: 'bg-rose-500',
  Doris: 'bg-cyan-500', Elasticsearch: 'bg-purple-500', API: 'bg-teal-500',
};

const logLevelConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  info: { color: 'text-slate-400', icon: <CheckCircle size={12} /> },
  warn: { color: 'text-amber-400', icon: <AlertTriangle size={12} /> },
  error: { color: 'text-red-400', icon: <AlertTriangle size={12} /> },
};

export default function DataSync() {
  const [overview, setOverview] = useState<SyncOverview | null>(null);
  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  useKeyboardShortcut({
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedsearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedTask, setSelectedTask] = useState<SyncTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [ov, list] = await Promise.all([
        fetchSyncOverview(),
        fetchSyncTasks({ keyword: debouncedSearch || undefined, status: filterStatus !== 'all' ? filterStatus : undefined, syncType: filterType !== 'all' ? filterType : undefined }),
      ]);
      setOverview(ov as SyncOverview);
      setTasks(list as SyncTask[]);
    } catch { setError(true); }
    setLoading(false);
  }, [search, filterStatus, filterType]);

  useEffect(() => { loadData(); }, [loadData]);

  const openDrawer = async (task: SyncTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
    try {
      const logData = await fetchSyncLogs(task.id);
      setLogs(logData as SyncLog[]);
    } catch { setLogs([]); }
  };

  const closeDrawer = () => { setDrawerOpen(false); setSelectedTask(null); setLogs([]); };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateSyncTaskStatus(id, newStatus);
      loadData();
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus as SyncTask['status'] } : null);
      }
    } catch { setError(true); }
  };

  const statsItems = overview ? [
    { label: '同步任务', value: overview.totalTasks, icon: <Activity size={16} />, color: 'from-cyan-500 to-blue-500' },
    { label: '运行中', value: overview.runningTasks, icon: <Play size={16} />, color: 'from-emerald-500 to-green-500' },
    { label: '实时同步', value: overview.realtimeTasks, icon: <Zap size={16} />, color: 'from-purple-500 to-violet-500' },
    { label: '失败任务', value: overview.failedTasks, icon: <AlertTriangle size={16} />, color: 'from-red-500 to-rose-500' },
    { label: '总记录数', value: overview.totalRecords, icon: <HardDrive size={16} />, color: 'from-amber-500 to-orange-500' },
    { label: '平均延迟', value: overview.avgDelay, icon: <Timer size={16} />, color: 'from-teal-500 to-cyan-500' },
    { label: '周成功率', value: `${overview.weeklySuccessRate}%`, icon: <TrendingUp size={16} />, color: 'from-indigo-500 to-blue-500' },
    { label: '主要来源', value: overview.topSource, icon: <Database size={16} />, color: 'from-pink-500 to-rose-500' },
  ] : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-4 pb-3 space-y-4 flex-shrink-0">
        <Breadcrumb items={[{ label: '数据开发' }, { label: '数据同步' }]} />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">数据同步</h1>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">
            <Plus size={14} /> 新建同步任务
          </button>
        </div>

        {/* Stats */}
        {overview && (
          <div className="grid grid-cols-8 gap-3">
            {statsItems.map(s => (
              <div key={s.label} className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1 rounded bg-gradient-to-br ${s.color} text-white`}>{s.icon}</div>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
                <div className="text-lg font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索任务名称或数据源..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
            {['all', 'running', 'stopped', 'failed', 'waiting'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterStatus === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                {s === 'all' ? '全部' : statusConfig[s]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
            {['all', 'realtime', 'batch'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterType === t ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                {t === 'all' ? '全部类型' : t === 'realtime' ? '实时' : '批量'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto bg-slate-900 rounded-lg p-1">
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {error && <ErrorFallback onRetry={loadData} />}
        {loading ? (
          <div className={viewMode === 'card' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tasks.map(task => {
              const sc = statusConfig[task.status];
              return (
                <div key={task.id} className="group bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
                  onClick={() => openDrawer(task)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">{task.name}</span>
                        <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${sc.bg} ${sc.color} ${task.status === 'running' ? 'animate-pulse' : ''}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{task.description}</p>
                    </div>
                  </div>

                  {/* Source → Target */}
                  <div className="flex items-center gap-2 text-xs mb-3 bg-slate-900/40 rounded-lg px-3 py-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sourceColors[task.sourceType] || 'bg-slate-500'}`} />
                    <span className="text-slate-300">{task.sourceType}</span>
                    <span className="text-slate-600">{task.sourceName}</span>
                    <ArrowRight size={12} className="text-slate-600 flex-shrink-0" />
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sourceColors[task.targetType] || 'bg-slate-500'}`} />
                    <span className="text-slate-300">{task.targetType}</span>
                    <span className="text-slate-600">{task.targetName}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className={`px-1.5 py-0.5 rounded ${task.syncType === 'realtime' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {task.syncType === 'realtime' ? '实时' : '批量'} / {task.mode}
                    </span>
                    <span>{task.tables} 张表</span>
                    <span>{task.records} 条</span>
                    {task.delay && task.delay !== '-' && <span className="text-cyan-400">延迟 {task.delay}</span>}
                    {task.qps && task.qps !== '-' && <span>QPS {task.qps}</span>}
                  </div>

                  {/* Progress */}
                  {task.status === 'running' && task.progress != null && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">同步进度</span>
                        <span className="text-cyan-400">{task.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Field mapping + config */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span>字段映射: <span className="text-slate-300">{task.fieldMapping.mapped}/{task.fieldMapping.total}</span></span>
                    <span>并发: <span className="text-slate-300">{task.config.concurrency}</span></span>
                    <span>批次: <span className="text-slate-300">{task.config.batchSize}</span></span>
                  </div>

                  {/* Error */}
                  {task.errorMsg && (
                    <div className="mb-3 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-start gap-2">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                      <span className="truncate">{task.errorMsg}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>最近同步 {task.lastSync}</span>
                    <span>{task.owner} / {task.department}</span>
                  </div>

                  {/* Hover actions */}
                  <div className="mt-3 pt-3 border-t border-slate-700/30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}>
                    <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">编辑</button>
                    {task.status === 'stopped' && (
                      <button onClick={() => handleStatusChange(task.id, 'running')}
                        className="px-3 py-1 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1">
                        <Play size={10} /> 启动
                      </button>
                    )}
                    {task.status === 'running' && (
                      <button onClick={() => handleStatusChange(task.id, 'stopped')}
                        className="px-3 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1">
                        <Square size={10} /> 停止
                      </button>
                    )}
                    {task.status === 'failed' && (
                      <button onClick={() => handleStatusChange(task.id, 'running')}
                        className="px-3 py-1 text-xs rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1">
                        <RotateCcw size={10} /> 重试
                      </button>
                    )}
                    <button onClick={() => openDrawer(task)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">日志</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-x-auto">
            <table className="min-w-[1100px] w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                  <th className="px-2 py-3 font-medium w-[36px]">
                    <input type="checkbox" checked={selection.isAllSelected} ref={(el) => { if (el) el.indeterminate = selection.isPartialSelected; }} onChange={selection.toggleAll} className="accent-cyan-500" />
                  </th>
                  <th className="px-4 py-3 font-medium w-[200px]"><span className="cursor-pointer hover:text-slate-200" onClick={() => handleSort('name')}>任务名称 {getSortIcon('name')}</span></th>
                  <th className="px-4 py-3 font-medium w-[240px]">源 → 目标</th>
                  <th className="px-4 py-3 font-medium w-[80px]">类型</th>
                  <th className="px-4 py-3 font-medium w-[70px]">模式</th>
                  <th className="px-4 py-3 font-medium w-[70px]">状态</th>
                  <th className="px-4 py-3 font-medium w-[60px]">表数</th>
                  <th className="px-4 py-3 font-medium w-[80px]">记录数</th>
                  <th className="px-4 py-3 font-medium w-[70px]">延迟</th>
                  <th className="px-4 py-3 font-medium w-[80px]">QPS</th>
                  <th className="px-4 py-3 font-medium w-[150px]">最近同步</th>
                  <th className="px-4 py-3 font-medium w-[80px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const sc = statusConfig[task.status];
                  return (
                    <tr key={task.id} className="border-b border-slate-700/30 hover:bg-slate-800/50 cursor-pointer" onClick={() => openDrawer(task)}>
                      <td className="px-4 py-3 text-white truncate">{task.name}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sourceColors[task.sourceType] || 'bg-slate-500'}`} />
                          <span className="text-slate-300">{task.sourceType}</span>
                          <ArrowRight size={10} className="text-slate-600 flex-shrink-0" />
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sourceColors[task.targetType] || 'bg-slate-500'}`} />
                          <span className="text-slate-300">{task.targetType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${task.syncType === 'realtime' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {task.syncType === 'realtime' ? '实时' : '批量'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{task.mode}</td>
                      <td className="px-4 py-3"><span className={`text-xs ${sc.color}`}>{sc.label}</span></td>
                      <td className="px-4 py-3 text-slate-300">{task.tables}</td>
                      <td className="px-4 py-3 text-slate-300">{task.records}</td>
                      <td className="px-4 py-3 text-xs text-cyan-400">{task.delay || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{task.qps || '-'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{task.lastSync}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {task.status === 'stopped' && <button onClick={() => handleStatusChange(task.id, 'running')} className="text-emerald-400 hover:text-emerald-300 text-xs">启动</button>}
                          {task.status === 'running' && <button onClick={() => handleStatusChange(task.id, 'stopped')} className="text-red-400 hover:text-red-300 text-xs">停止</button>}
                          {task.status === 'failed' && <button onClick={() => handleStatusChange(task.id, 'running')} className="text-amber-400 hover:text-amber-300 text-xs">重试</button>}
                          <button onClick={() => openDrawer(task)} className="text-cyan-400 hover:text-cyan-300 text-xs ml-1">详情</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {selection.selectedCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/20 text-sm">
                <span className="text-cyan-300">已选 {selection.selectedCount} 项</span>
                <button onClick={() => { toast.success(`批量启动 ${selection.selectedCount} 条`); selection.clear(); }} className="px-3 py-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs">批量操作</button>
                <button onClick={() => { toast.error(`批量删除 ${selection.selectedCount} 条`); selection.clear(); }} className="px-3 py-1 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 text-xs">批量删除</button>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredTasks.length / pageSize)}
              pageSize={pageSize}
              total={filteredTasks.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {drawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
          <div className="relative w-[420px] bg-slate-900 border-l border-slate-700/50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{selectedTask.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedTask.syncType === 'realtime' ? '实时' : '批量'}同步 / {selectedTask.mode}</div>
              </div>
              <button onClick={closeDrawer} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status + actions */}
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs rounded-full ${statusConfig[selectedTask.status].bg} ${statusConfig[selectedTask.status].color}`}>
                  {statusConfig[selectedTask.status].label}
                </span>
                <span className="text-xs text-slate-500">{selectedTask.department}</span>
                <div className="flex gap-2 ml-auto">
                  {selectedTask.status === 'stopped' && (
                    <button onClick={() => handleStatusChange(selectedTask.id, 'running')}
                      className="px-3 py-1.5 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1">
                      <Play size={10} /> 启动
                    </button>
                  )}
                  {selectedTask.status === 'running' && (
                    <button onClick={() => handleStatusChange(selectedTask.id, 'stopped')}
                      className="px-3 py-1.5 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1">
                      <Square size={10} /> 停止
                    </button>
                  )}
                  {selectedTask.status === 'failed' && (
                    <button onClick={() => handleStatusChange(selectedTask.id, 'running')}
                      className="px-3 py-1.5 text-xs rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1">
                      <RotateCcw size={10} /> 重试
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400">{selectedTask.description}</p>

              {/* Error */}
              {selectedTask.errorMsg && (
                <div className="px-3 py-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-start gap-2">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  <span>{selectedTask.errorMsg}</span>
                </div>
              )}

              {/* Source / Target */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-slate-300">数据源配置</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 rounded-lg p-3 space-y-1.5">
                    <div className="text-xs text-slate-500">源端</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${sourceColors[selectedTask.sourceType] || 'bg-slate-500'}`} />
                      <span className="text-sm text-white">{selectedTask.sourceType}</span>
                    </div>
                    <div className="text-xs text-slate-400">{selectedTask.sourceName}</div>
                    <div className="text-xs text-slate-600 font-mono">{selectedTask.sourceHost}</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3 space-y-1.5">
                    <div className="text-xs text-slate-500">目标端</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${sourceColors[selectedTask.targetType] || 'bg-slate-500'}`} />
                      <span className="text-sm text-white">{selectedTask.targetType}</span>
                    </div>
                    <div className="text-xs text-slate-400">{selectedTask.targetName}</div>
                    <div className="text-xs text-slate-600 font-mono">{selectedTask.targetHost}</div>
                  </div>
                </div>
              </div>

              {/* Sync stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '表数', value: selectedTask.tables },
                  { label: '记录数', value: selectedTask.records },
                  { label: '延迟', value: selectedTask.delay || '-' },
                  { label: 'QPS', value: selectedTask.qps || '-' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                    <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                    <div className="text-sm font-semibold text-white">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Config */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">同步配置</div>
                <div className="bg-slate-800/60 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">并发数</span><span className="text-slate-300">{selectedTask.config.concurrency}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">批次大小</span><span className="text-slate-300">{selectedTask.config.batchSize}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">重试次数</span><span className="text-slate-300">{selectedTask.config.retryCount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">重试间隔</span><span className="text-slate-300">{selectedTask.config.retryInterval}</span></div>
                </div>
              </div>

              {/* Field mapping */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">字段映射</div>
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${(selectedTask.fieldMapping.mapped / selectedTask.fieldMapping.total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{selectedTask.fieldMapping.mapped}/{selectedTask.fieldMapping.total}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>已映射: <span className="text-emerald-400">{selectedTask.fieldMapping.mapped}</span></span>
                    <span>已忽略: <span className="text-slate-400">{selectedTask.fieldMapping.ignored}</span></span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">负责人</span><span className="text-slate-300">{selectedTask.owner}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">创建时间</span><span className="text-slate-300">{selectedTask.createdAt}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">最近同步</span><span className="text-slate-300">{selectedTask.lastSync}</span></div>
                {selectedTask.nextSync && selectedTask.nextSync !== '-' && (
                  <div className="flex justify-between"><span className="text-slate-500">下次同步</span><span className="text-slate-300">{selectedTask.nextSync}</span></div>
                )}
              </div>

              {/* Logs */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">同步日志</div>
                <div className="bg-slate-800/60 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-xs text-slate-600 text-center py-4">暂无日志</div>
                  ) : logs.map(log => {
                    const lc = logLevelConfig[log.level] || logLevelConfig.info;
                    return (
                      <div key={log.id} className="flex items-start gap-2 text-xs">
                        <span className={`flex-shrink-0 mt-0.5 ${lc.color}`}>{lc.icon}</span>
                        <span className="text-slate-600 flex-shrink-0 w-[130px]">{log.time}</span>
                        <span className="text-slate-400">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
