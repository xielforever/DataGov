import { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

interface DagTask {
  id: string;
  name: string;
  type: 'sync' | 'compute' | 'quality' | 'service';
  status: 'success' | 'running' | 'failed' | 'waiting';
  upstream: string[];
  downstream: string[];
  cron: string;
  avgDuration: string;
  lastRun: string;
  owner: string;
}

const DAG_TASKS: DagTask[] = [
  { id: 'd1', name: 'MySQL→ODS 数据同步', type: 'sync', status: 'success', upstream: [], downstream: ['d2', 'd3'], cron: '0 2 * * *', avgDuration: '45min', lastRun: '2024-01-15 02:45:12', owner: '张明' },
  { id: 'd2', name: 'ODS→DWD 订单清洗', type: 'compute', status: 'success', upstream: ['d1'], downstream: ['d4'], cron: '0 4 * * *', avgDuration: '30min', lastRun: '2024-01-15 04:30:08', owner: '张明' },
  { id: 'd3', name: 'ODS→DWD 用户清洗', type: 'compute', status: 'success', upstream: ['d1'], downstream: ['d4'], cron: '0 4 * * *', avgDuration: '25min', lastRun: '2024-01-15 04:25:15', owner: '赵敏' },
  { id: 'd4', name: 'DWD→DWS 用户汇', type: 'compute', status: 'success', upstream: ['d2', 'd3'], downstream: ['d5', 'd6'], cron: '0 6 * * *', avgDuration: '20min', lastRun: '2024-01-15 06:20:33', owner: '李雪' },
  { id: 'd5', name: 'DWS→ADS 销售报', type: 'compute', status: 'success', upstream: ['d4'], downstream: ['d7'], cron: '0 7 * * *', avgDuration: '10min', lastRun: '2024-01-15 07:10:45', owner: '陈静' },
  { id: 'd6', name: '数据质量巡检', type: 'quality', status: 'running', upstream: ['d4'], downstream: ['d8'], cron: '0 8 * * *', avgDuration: '15min', lastRun: '2024-01-15 08:05:22', owner: '李雪' },
  { id: 'd7', name: '报表数据推', type: 'service', status: 'waiting', upstream: ['d5'], downstream: [], cron: '0 8 * * *', avgDuration: '5min', lastRun: '2024-01-14 08:05:00', owner: '陈静' },
  { id: 'd8', name: '质量报告生成', type: 'quality', status: 'waiting', upstream: ['d6'], downstream: [], cron: '0 9 * * *', avgDuration: '8min', lastRun: '2024-01-14 09:08:10', owner: '李雪' },
];

const typeConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  sync: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: '数据同步', icon: '🔄' },
  compute: { color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', label: '计算任务', icon: '⚙️' },
  quality: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', label: '质量检', icon: '' },
  service: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: '数据服务', icon: '📡' },
};

const statusDot: Record<string, string> = {
  success: 'bg-emerald-400', running: 'bg-cyan-400 animate-pulse', failed: 'bg-red-400', waiting: 'bg-slate-500',
};

export default function TaskOrchestration() {
  const [tasks, setTasks] = useState<DagTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<DagTask | null>(null);

  useEffect(() => {
    setTimeout(() => { setTasks(DAG_TASKS); setLoading(false); }, 300);
  }, []);

  const positions: Record<string, { x: number; y: number }> = {
    d1: { x: 50, y: 50 },
    d2: { x: 250, y: 20 },
    d3: { x: 250, y: 80 },
    d4: { x: 450, y: 50 },
    d5: { x: 650, y: 20 },
    d6: { x: 650, y: 80 },
    d7: { x: 850, y: 20 },
    d8: { x: 850, y: 80 },
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '数据开' }, { label: '任务编排' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">任务编排</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">运行历史</button>
          <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">+ 新建编排</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 bg-slate-800/30 rounded-xl px-4 py-3 border border-slate-700/30">
        <span className="text-xs text-slate-400">任务类型'</span>
        {Object.entries(typeConfig).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs">
            <span>{v.icon}</span>
            <span className={v.color}>{v.label}</span>
          </span>
        ))}
        <span className="text-xs text-slate-400 ml-4">状态：</span>
        <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 成功</span>
        <span className="flex items-center gap-1 text-xs text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> 运行'</span>
        <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-500" /> 等待</span>
      </div>

      {loading ? (
        <div className="bg-slate-800/40 rounded-xl p-5 animate-pulse h-64" />
      ) : (
        <div className="flex gap-4">
          {/* DAG Canvas */}
          <div className="flex-1 bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-700/30 bg-slate-800/60 flex items-center justify-between">
              <span className="text-sm text-slate-400">每日数仓 ETL 编排</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">'触发执行</button>
                <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">编辑</button>
              </div>
            </div>
            <svg width="100%" height="220" viewBox="0 0 950 130" className="bg-slate-900/30">
              {/* Connections */}
              {tasks.map(task => task.downstream.map(target => {
                const from = positions[task.id];
                const to = positions[target];
                if (!from || !to) return null;
                const tc = typeConfig[task.type];
                return (
                  <g key={`${task.id}-${target}`}>
                    <line x1={from.x + 80} y1={from.y + 20} x2={to.x} y2={to.y + 20}
                      stroke={task.status === 'success' && tasks.find(t => t.id === target)?.status !== 'waiting' ? tc.color.replace('text-', '') : '#475569'}
                      strokeWidth={selectedTask?.id === task.id ? 2.5 : 1.5}
                      strokeDasharray={tasks.find(t => t.id === target)?.status === 'waiting' ? '6 3' : 'none'}
                      opacity={0.5}
                    />
                    <polygon points={`${to.x},${to.y + 16} ${to.x},${to.y + 24} ${to.x + 6},${to.y + 20}`}
                      fill={task.status === 'success' ? tc.color.replace('text-', '') : '#475569'} opacity={0.6} />
                  </g>
                );
              }))}

              {/* Nodes */}
              {tasks.map(task => {
                const pos = positions[task.id];
                if (!pos) return null;
                const tc = typeConfig[task.type];
                const isSelected = selectedTask?.id === task.id;
                return (
                  <g key={task.id} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                    <rect x={pos.x} y={pos.y} width={160} height={40} rx={8}
                      fill={isSelected ? 'rgba(6,182,212,0.15)' : 'rgba(30,41,59,0.8)'}
                      stroke={isSelected ? '#06b6d4' : 'rgba(71,85,105,0.5)'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <circle cx={pos.x + 16} cy={pos.y + 20} r={4} className={statusDot[task.status]} />
                    <text x={pos.x + 28} y={pos.y + 24} fill="white" fontSize="11" fontFamily="system-ui">{task.name.length > 12 ? task.name.slice(0, 12) + '...' : task.name}</text>
                    <text x={pos.x + 140} y={pos.y + 24} textAnchor="end" fontSize="9" fill={tc.color.replace('text-', '')}>{tc.icon}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detail Panel */}
          {selectedTask && (
            <div className="w-80 bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden flex-shrink-0">
              <div className="px-4 py-3 border-b border-slate-700/30 bg-slate-800/60 flex items-center justify-between">
                <span className="text-sm text-white font-medium">{selectedTask.name}</span>
                <button onClick={() => setSelectedTask(null)} className="text-slate-500 hover:text-white text-xs">'</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded border ${typeConfig[selectedTask.type].bg} ${typeConfig[selectedTask.type].color}`}>
                    {typeConfig[selectedTask.type].label}
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${selectedTask.status === 'success' ? 'text-emerald-400' : selectedTask.status === 'running' ? 'text-cyan-400' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[selectedTask.status]}`} />
                    {selectedTask.status === 'success' ? '执行成功' : selectedTask.status === 'running' ? '运行' : selectedTask.status === 'failed' ? '已失' : '等待执行'}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    ['调度周期', selectedTask.cron],
                    ['平均耗时', selectedTask.avgDuration],
                    ['最近执', selectedTask.lastRun],
                    ['负责人', selectedTask.owner],
                    ['上游依赖', selectedTask.upstream.length ? selectedTask.upstream.map(u => tasks.find(t => t.id === u)?.name).join(', ') : ''],
                    ['下游任务', selectedTask.downstream.length ? selectedTask.downstream.map(d => tasks.find(t => t.id === d)?.name).join(', ') : ''],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-300 text-right max-w-[180px] truncate">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-3 py-1.5 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-center">'运行</button>
                  <button className="flex-1 px-3 py-1.5 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 text-center">编辑</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
