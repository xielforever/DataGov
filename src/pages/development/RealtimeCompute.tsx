import { useState, useEffect, useCallback } from 'react';
import { fetchFlinkOverview, fetchFlinkTasks, updateFlinkTaskStatus } from '../../services/api';
import Breadcrumb from '../../components/common/Breadcrumb';
import ErrorFallback from '../../components/common/ErrorFallback';
import { CardSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { Search, Plus, Play, Square, RotateCcw, X, Activity, Cpu, Timer, Gauge, TrendingUp, Server, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

interface FlinkTask {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'failed' | 'deploying';
  parallelism: number;
  cpu: string;
  memory: string;
  recordsIn: string;
  recordsOut: string;
  delay: string;
  backpressure: 'ok' | 'warn' | 'high';
  checkpoint: string;
  checkpointCount: number;
  failoverCount: number;
  startTime: string;
  uptime: string;
  owner: string;
  department: string;
  jar: string;
  entryClass: string;
  kafkaTopics: string[];
  sinkTargets: string[];
  errorMsg?: string;
}

interface FlinkOverview {
  totalJobs: number;
  runningJobs: number;
  totalParallelism: number;
  totalCpu: string;
  totalMemory: string;
  avgDelay: string;
  weeklyCheckpointSuccess: number;
  totalRecordsIn: string;
}

const statusMap: Record<string, { color: string; bg: string; label: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '运行中' },
  stopped: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: '已停止' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', label: '已失败' },
  deploying: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '部署中' },
};

const bpMap: Record<string, { color: string; label: string; barColor: string }> = {
  ok: { color: 'text-emerald-400', label: '正常', barColor: 'bg-emerald-400' },
  warn: { color: 'text-amber-400', label: '轻微反压', barColor: 'bg-amber-400' },
  high: { color: 'text-red-400', label: '严重反压', barColor: 'bg-red-400' },
};

export default function RealtimeCompute() {
  const [overview, setOverview] = useState<FlinkOverview | null>(null);
  const [tasks, setTasks] = useState<FlinkTask[]>([]);
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
  const [selectedTask, setSelectedTask] = useState<FlinkTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ov, list] = await Promise.all([
        fetchFlinkOverview(),
        fetchFlinkTasks({ keyword: debouncedSearch || undefined, status: filterStatus !== 'all' ? filterStatus : undefined }),
      ]);
      setOverview(ov as FlinkOverview);
      setTasks(list as FlinkTask[]);
    } catch { setError(true); }
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const openDrawer = (task: FlinkTask) => { setSelectedTask(task); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setSelectedTask(null); };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateFlinkTaskStatus(id, newStatus);
      loadData();
      if (selectedTask?.id === id) setSelectedTask(prev => prev ? { ...prev, status: newStatus as FlinkTask['status'] } : null);
    } catch { setError(true); }
  };

  const statsItems = overview ? [
    { label: '总任务数', value: overview.totalJobs, icon: <Activity size={16} />, color: 'from-cyan-500 to-blue-500' },
    { label: '运行中', value: overview.runningJobs, icon: <Play size={16} />, color: 'from-emerald-500 to-green-500' },
    { label: '总并行度', value: overview.totalParallelism, icon: <Server size={16} />, color: 'from-purple-500 to-violet-500' },
    { label: '总 CPU', value: overview.totalCpu, icon: <Cpu size={16} />, color: 'from-amber-500 to-orange-500' },
    { label: '总内存', value: overview.totalMemory, icon: <Gauge size={16} />, color: 'from-teal-500 to-cyan-500' },
    { label: '平均延迟', value: overview.avgDelay, icon: <Timer size={16} />, color: 'from-indigo-500 to-blue-500' },
    { label: 'Checkpoint 成功率', value: `${overview.weeklyCheckpointSuccess}%`, icon: <CheckCircle size={16} />, color: 'from-pink-500 to-rose-500' },
    { label: '总吞吐', value: overview.totalRecordsIn, icon: <TrendingUp size={16} />, color: 'from-lime-500 to-green-500' },
  ] : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-4 pb-3 space-y-4 flex-shrink-0">
        <Breadcrumb items={[{ label: '数据开发' }, { label: '实时计算' }]} />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">实时计算</h1>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">
            <Plus size={14} /> 新建 Flink 任务
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索任务名称..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
            {['all', 'running', 'stopped', 'failed', 'deploying'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterStatus === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                {s === 'all' ? '全部' : statusMap[s]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {error && <ErrorFallback onRetry={loadData} />}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tasks.map(task => {
              const sm = statusMap[task.status];
              const bp = bpMap[task.backpressure];
              return (
                <div key={task.id} className="group bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
                  onClick={() => openDrawer(task)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">{task.name}</span>
                        <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${sm.bg} ${sm.color} ${task.status === 'running' ? 'animate-pulse' : ''}`}>
                          {sm.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{task.description}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">并行度</div>
                      <div className="text-sm font-semibold text-white">{task.parallelism}</div>
                    </div>
                    <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">CPU</div>
                      <div className="text-sm font-semibold text-white">{task.cpu}</div>
                    </div>
                    <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">延迟</div>
                      <div className={`text-sm font-semibold ${task.delay === '-' ? 'text-slate-600' : 'text-cyan-400'}`}>{task.delay}</div>
                    </div>
                    <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">反压</div>
                      <div className={`text-sm font-semibold ${bp.color}`}>{bp.label}</div>
                    </div>
                  </div>

                  {/* Backpressure bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-500 w-10">反压</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bp.barColor}`}
                        style={{ width: task.backpressure === 'ok' ? '20%' : task.backpressure === 'warn' ? '55%' : '90%' }} />
                    </div>
                  </div>

                  {/* Throughput (running only) */}
                  {task.status === 'running' && (
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 bg-slate-900/30 rounded-lg p-2.5">
                      <span>输入 <span className="text-cyan-400 font-medium">{task.recordsIn}</span></span>
                      <span>输出 <span className="text-emerald-400 font-medium">{task.recordsOut}</span></span>
                      <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-400" /> <span className="text-slate-300">{task.checkpoint}</span></span>
                    </div>
                  )}

                  {/* Error */}
                  {task.errorMsg && (
                    <div className="mb-3 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-start gap-2">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                      <span className="truncate">{task.errorMsg}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>启动: {task.startTime}{task.uptime !== '-' ? ` / 运行 ${task.uptime}` : ''}</span>
                    <span>{task.owner} / {task.department}</span>
                  </div>

                  {/* Hover actions */}
                  <div className="mt-3 pt-3 border-t border-slate-700/30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => openDrawer(task)} className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">详情</button>
                    <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center gap-1"><BarChart3 size={10} /> Metrics</button>
                    <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">日志</button>
                    {task.status === 'running' && (
                      <button onClick={() => handleStatusChange(task.id, 'stopped')}
                        className="px-3 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1">
                        <Square size={10} /> 停止
                      </button>
                    )}
                    {(task.status === 'stopped' || task.status === 'failed') && (
                      <button onClick={() => handleStatusChange(task.id, 'running')}
                        className="px-3 py-1 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1">
                        <Play size={10} /> 启动
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
                <div className="text-xs text-slate-500 mt-0.5">{selectedTask.entryClass}</div>
              </div>
              <button onClick={closeDrawer} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status + actions */}
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs rounded-full ${statusMap[selectedTask.status].bg} ${statusMap[selectedTask.status].color}`}>
                  {statusMap[selectedTask.status].label}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded ${bpMap[selectedTask.backpressure].color} bg-slate-800`}>
                  反压: {bpMap[selectedTask.backpressure].label}
                </span>
                <div className="flex gap-2 ml-auto">
                  {selectedTask.status === 'running' && (
                    <button onClick={() => handleStatusChange(selectedTask.id, 'stopped')}
                      className="px-3 py-1.5 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1">
                      <Square size={10} /> 停止
                    </button>
                  )}
                  {(selectedTask.status === 'stopped' || selectedTask.status === 'failed') && (
                    <button onClick={() => handleStatusChange(selectedTask.id, 'running')}
                      className="px-3 py-1.5 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1">
                      <Play size={10} /> 启动
                    </button>
                  )}
                  <button className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1">
                    <RotateCcw size={10} /> 重启
                  </button>
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

              {/* Resources */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '并行度', value: selectedTask.parallelism },
                  { label: 'CPU', value: selectedTask.cpu },
                  { label: '内存', value: selectedTask.memory },
                  { label: '延迟', value: selectedTask.delay },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                    <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                    <div className="text-sm font-semibold text-white">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Throughput */}
              {selectedTask.status === 'running' && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">吞吐量</div>
                  <div className="bg-slate-800/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-16">输入</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: '75%' }} />
                      </div>
                      <span className="text-xs text-cyan-400 w-20 text-right">{selectedTask.recordsIn}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-16">输出</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <span className="text-xs text-emerald-400 w-20 text-right">{selectedTask.recordsOut}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkpoint */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">Checkpoint</div>
                <div className="bg-slate-800/60 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">状态</span><span className="text-slate-300">{selectedTask.checkpoint}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">累计次数</span><span className="text-slate-300">{selectedTask.checkpointCount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Failover</span><span className={selectedTask.failoverCount > 0 ? 'text-amber-400' : 'text-slate-300'}>{selectedTask.failoverCount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">反压</span><span className={bpMap[selectedTask.backpressure].color}>{bpMap[selectedTask.backpressure].label}</span></div>
                </div>
              </div>

              {/* Jar + Entry */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">作业配置</div>
                <div className="bg-slate-800/60 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">JAR 包</span><span className="text-slate-300 font-mono truncate ml-4">{selectedTask.jar}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">入口类</span><span className="text-slate-300 font-mono truncate ml-4">{selectedTask.entryClass}</span></div>
                </div>
              </div>

              {/* Topics + Sinks */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">数据源与目标</div>
                <div className="bg-slate-800/60 rounded-lg p-3 space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">Kafka Topics</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTask.kafkaTopics.map(t => (
                        <span key={t} className="px-2 py-0.5 text-xs rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">Sink 目标</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTask.sinkTargets.map(t => (
                        <span key={t} className="px-2 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">负责人</span><span className="text-slate-300">{selectedTask.owner}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">部门</span><span className="text-slate-300">{selectedTask.department}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">启动时间</span><span className="text-slate-300">{selectedTask.startTime}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">运行时长</span><span className="text-slate-300">{selectedTask.uptime}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
