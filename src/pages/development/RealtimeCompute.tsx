import { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

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
  startTime: string;
  owner: string;
}

const FLINK_TASKS: FlinkTask[] = [
  { id: 'f1', name: '实时订单流处理', description: '消费 Kafka 订单事件，实时计算 GMV、订单量等指标', status: 'running', parallelism: 16, cpu: '8 Core', memory: '32 GB', recordsIn: '45,200/s', recordsOut: '12,800/s', delay: '230ms', backpressure: 'ok', checkpoint: '正常 (间隔60s)', startTime: '2024-01-10 08:00', owner: '黄琦' },
  { id: 'f2', name: '用户行为实时分析', description: '实时分析用户点击、浏览、搜索行为，输出用户画像标签', status: 'running', parallelism: 8, cpu: '4 Core', memory: '16 GB', recordsIn: '28,500/s', recordsOut: '8,200/s', delay: '180ms', backpressure: 'ok', checkpoint: '正常 (间隔30s)', startTime: '2024-01-12 10:30', owner: '赵敏' },
  { id: 'f3', name: '实时风控预警', description: '实时检测异常交易、欺诈行为，触发风控规则引擎', status: 'running', parallelism: 12, cpu: '6 Core', memory: '24 GB', recordsIn: '35,000/s', recordsOut: '150/s', delay: '50ms', backpressure: 'warn', checkpoint: '正常 (间隔15s)', startTime: '2024-01-08 14:00', owner: '郑伟' },
  { id: 'f4', name: '实时推荐特征计算', description: '基于用户实时行为计算推荐特征向量', status: 'failed', parallelism: 24, cpu: '12 Core', memory: '48 GB', recordsIn: '-', recordsOut: '-', delay: '-', backpressure: 'high', checkpoint: '失败 (超时)', startTime: '2024-01-15 09:00', owner: '林峰' },
  { id: 'f5', name: '实时库存同步', description: '监听库存变更事件，实时同步到各端缓存', status: 'stopped', parallelism: 4, cpu: '2 Core', memory: '8 GB', recordsIn: '-', recordsOut: '-', delay: '-', backpressure: 'ok', checkpoint: '-', startTime: '2024-01-05 16:00', owner: '孙立' },
  { id: 'f6', name: '实时数据质量检', description: '对数据流进行实时质量规则校验，异常数据告', status: 'deploying', parallelism: 8, cpu: '4 Core', memory: '16 GB', recordsIn: '-', recordsOut: '-', delay: '-', backpressure: 'ok', checkpoint: '-', startTime: '-', owner: '李雪' },
];

const statusMap: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '运行', dot: 'bg-emerald-400' },
  stopped: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: '已停', dot: 'bg-slate-400' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', label: '已失', dot: 'bg-red-400' },
  deploying: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '部署', dot: 'bg-amber-400' },
};

const bpMap: Record<string, { color: string; label: string }> = {
  ok: { color: 'text-emerald-400', label: '正常' },
  warn: { color: 'text-amber-400', label: '轻微' },
  high: { color: 'text-red-400', label: '严重' },
};

export default function RealtimeCompute() {
  const [tasks, setTasks] = useState<FlinkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setTimeout(() => { setTasks(FLINK_TASKS); setLoading(false); }, 300);
  }, []);

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search && !t.name.includes(search) && !t.description.includes(search)) return false;
    return true;
  });

  const stats = [
      { label: '总任务数', value: tasks.length, icon: '📊', color: 'from-cyan-500 to-blue-500' },
      { label: '运行中', value: tasks.filter(t => t.status === 'running').length, icon: '▶️', color: 'from-emerald-500 to-green-500' },
      { label: '总并行度', value: tasks.reduce((a, t) => a + t.parallelism, 0), icon: '🔧', color: 'from-purple-500 to-violet-500' },
      { label: '总CPU', value: `${tasks.reduce((a, t) => a + parseInt(t.cpu), 0)} Core`, icon: '💻', color: 'from-amber-500 to-orange-500' }
    ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '数据开' }, { label: '实时计算' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">实时计算</h1>
        <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">+ 新建 Flink 任务</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="relative overflow-hidden bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} opacity-10 rounded-bl-full`} />
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索任务'.."
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-64 focus:outline-none focus:border-cyan-500/50" />
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {['all', 'running', 'stopped', 'failed', 'deploying'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterStatus === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              {s === 'all' ? '全部' : statusMap[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-slate-800/40 rounded-xl p-5 animate-pulse"><div className="h-5 bg-slate-700 rounded w-2/3 mb-4" /><div className="h-4 bg-slate-700 rounded w-full mb-3" /><div className="h-4 bg-slate-700 rounded w-1/2" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(task => {
            const sm = statusMap[task.status];
            const bp = bpMap[task.backpressure];
            return (
              <div key={task.id} className="group bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 hover:border-cyan-500/30 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{task.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${sm.bg} ${sm.color} ${task.status === 'running' ? 'animate-pulse' : ''}`}>{sm.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">并行'</div>
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

                {task.status === 'running' && (
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 bg-slate-900/30 rounded-lg p-2.5">
                    <span>📥 输入 <span className="text-cyan-400 font-medium">{task.recordsIn}</span></span>
                    <span>📤 输出 <span className="text-emerald-400 font-medium">{task.recordsOut}</span></span>
                    <span>💾 Checkpoint <span className="text-slate-300">{task.checkpoint}</span></span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>启动时间: {task.startTime}</span>
                  <span>负责人' {task.owner}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">详情</button>
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">Metrics</button>
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">日志</button>
                  {task.status === 'running' && <button className="px-3 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">停止</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
