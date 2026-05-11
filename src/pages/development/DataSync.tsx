import { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

interface SyncTask {
  id: string;
  name: string;
  sourceType: string;
  sourceName: string;
  targetType: string;
  targetName: string;
  syncType: 'realtime' | 'batch';
  status: 'running' | 'stopped' | 'failed' | 'waiting';
  progress?: number;
  tables: number;
  records: string;
  delay?: string;
  qps?: string;
  lastSync: string;
  nextSync?: string;
  owner: string;
}

const SYNC_TASKS: SyncTask[] = [
  { id: 's1', name: 'MySQL→Hive 实时同步', sourceType: 'MySQL', sourceName: 'prod-mysql-trade', targetType: 'Hive', targetName: 'prod-hive-warehouse', syncType: 'realtime', status: 'running', progress: 78, tables: 45, records: '2.3', delay: '1.2s', qps: '12,450', lastSync: '2024-01-15 14:32:08', owner: '张明' },
  { id: 's2', name: 'Kafka→ClickHouse 流式同步', sourceType: 'Kafka', sourceName: 'prod-kafka-event', targetType: 'ClickHouse', targetName: 'prod-ck-olap', syncType: 'realtime', status: 'running', progress: 92, tables: 12, records: '8,560', delay: '0.8s', qps: '45,200', lastSync: '2024-01-15 14:32:05', owner: '黄琦' },
  { id: 's3', name: 'Oracle→Hive 财务同步', sourceType: 'Oracle', sourceName: 'prod-oracle-finance', targetType: 'Hive', targetName: 'prod-hive-warehouse', syncType: 'batch', status: 'waiting', tables: 28, records: '1,250', lastSync: '2024-01-15 06:00:00', nextSync: '2024-01-16 06:00:00', owner: '刘畅' },
  { id: 's4', name: 'PG→MySQL 用户数据同步', sourceType: 'PostgreSQL', sourceName: 'prod-pg-user', targetType: 'MySQL', targetName: 'prod-mysql-trade', syncType: 'batch', status: 'stopped', tables: 15, records: '3,200', lastSync: '2024-01-14 22:00:00', nextSync: '2024-01-15 22:00:00', owner: '赵敏' },
  { id: 's5', name: 'MongoDB→Hive 内容同步', sourceType: 'MongoDB', sourceName: 'prod-mongo-content', targetType: 'Hive', targetName: 'prod-hive-warehouse', syncType: 'batch', status: 'running', progress: 45, tables: 8, records: '5,600', lastSync: '2024-01-15 13:00:00', owner: '孙立' },
  { id: 's6', name: 'MySQL Binlog→Kafka CDC', sourceType: 'MySQL', sourceName: 'prod-mysql-trade', targetType: 'Kafka', targetName: 'prod-kafka-event', syncType: 'realtime', status: 'failed', tables: 120, records: '15.6', delay: '-', qps: '-', lastSync: '2024-01-15 12:45:30', owner: '张明' },
  { id: 's7', name: 'Hive→Doris 实时同步', sourceType: 'Hive', sourceName: 'prod-hive-warehouse', targetType: 'Doris', targetName: 'prod-doris-realtime', syncType: 'realtime', status: 'running', progress: 88, tables: 35, records: '4,800', delay: '2.5s', qps: '8,900', lastSync: '2024-01-15 14:31:55', owner: '黄琦' },
  { id: 's8', name: 'Redis→MySQL 缓存回写', sourceType: 'Redis', sourceName: 'prod-redis-cache', targetType: 'MySQL', targetName: 'prod-mysql-trade', syncType: 'batch', status: 'waiting', tables: 5, records: '120', lastSync: '2024-01-15 12:00:00', nextSync: '2024-01-15 18:00:00', owner: '冯磊' },
];

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '运行' },
  stopped: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: '已停' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', label: '已失' },
  waiting: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '等待' },
};

const sourceIcons: Record<string, string> = {
  MySQL: '🐬', Hive: '🐝', Kafka: '📨', PostgreSQL: '🐘', ClickHouse: '',
  MongoDB: '🍃', Oracle: '🔴', Redis: '🟥', Doris: '🌟',
};

export default function DataSync() {
  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    setTimeout(() => { setTasks(SYNC_TASKS); setLoading(false); }, 300);
  }, []);

  const filtered = tasks.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.sourceName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.syncType !== filterType) return false;
    return true;
  });

  const stats = [
    { label: '同步任务', value: tasks.length, icon: '🔄', color: 'from-cyan-500 to-blue-500' },
    { label: '运行', value: tasks.filter(t => t.status === 'running').length, icon: '▶️', color: 'from-emerald-500 to-green-500' },
    { label: '实时同步', value: tasks.filter(t => t.syncType === 'realtime').length, icon: '', color: 'from-purple-500 to-violet-500' },
    { label: '失败任务', value: tasks.filter(t => t.status === 'failed').length, icon: '', color: 'from-red-500 to-rose-500' },
  ];

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-slate-800/40 rounded-xl p-5 animate-pulse">
          <div className="h-5 bg-slate-700 rounded w-2/3 mb-4" />
          <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
          <div className="h-4 bg-slate-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '数据开' }, { label: '数据同步' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">数据同步</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">同步历史</button>
          <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">+ 新建同步</button>
        </div>
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
      <div className="flex flex-wrap items-center gap-3 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索任务</ 数据源'.."
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-64 focus:outline-none focus:border-cyan-500/50" />
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
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterType === t ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
              {t === 'all' ? '全部类型' : t === 'realtime' ? '实时' : '批量'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1 bg-slate-900 rounded-lg p-1">
          <button onClick={() => setViewMode('card')} className={`px-2 py-1 text-xs rounded ${viewMode === 'card' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>卡片</button>
          <button onClick={() => setViewMode('table')} className={`px-2 py-1 text-xs rounded ${viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>表格</button>
        </div>
      </div>

      {/* Content */}
      {loading ? renderSkeleton() : viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(task => {
            const sc = statusConfig[task.status];
            return (
              <div key={task.id} className="group bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 hover:border-cyan-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{sourceIcons[task.sourceType] || '💾'}</span>
                    <div>
                      <div className="font-medium text-white text-sm">{task.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{task.sourceName} '{task.targetName}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${sc.bg} ${sc.color} ${task.status === 'running' ? 'animate-pulse' : ''}`}>{sc.label}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                  <span className={`px-1.5 py-0.5 rounded ${task.syncType === 'realtime' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {task.syncType === 'realtime' ? '实时同步' : '批量同步'}
                  </span>
                  <span>{task.tables} 张表</span>
                  <span>{task.records} '</span>
                  {task.delay && <span>延迟 {task.delay}</span>}
                  {task.qps && <span>QPS {task.qps}</span>}
                </div>

                {task.status === 'running' && task.progress != null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">同步进度</span>
                      <span className="text-cyan-400">{task.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>最近同' {task.lastSync}</span>
                  <span>负责人' {task.owner}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">编辑</button>
                  {task.status === 'stopped' && <button className="px-3 py-1 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">启动</button>}
                  {task.status === 'running' && <button className="px-3 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">停止</button>}
                  {task.status === 'failed' && <button className="px-3 py-1 text-xs rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">重试</button>}
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">查看日志</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                <th className="text-left px-4 py-3 font-medium">任务名称</th>
                <th className="text-left px-4 py-3 font-medium">源→目标</th>
                <th className="text-left px-4 py-3 font-medium">类型</th>
                <th className="text-left px-4 py-3 font-medium">状态'</th>
                <th className="text-left px-4 py-3 font-medium">表数</th>
                <th className="text-left px-4 py-3 font-medium">记录'</th>
                <th className="text-left px-4 py-3 font-medium">最近同'</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const sc = statusConfig[task.status];
                return (
                  <tr key={task.id} className="border-b border-slate-700/30 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white">{task.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{sourceIcons[task.sourceType]} {task.sourceType} '{sourceIcons[task.targetType]} {task.targetType}</td>
                    <td className="px-4 py-3"><span className={`px-1.5 py-0.5 rounded text-xs ${task.syncType === 'realtime' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>{task.syncType === 'realtime' ? '实时' : '批量'}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs ${sc.color}`}>{sc.label}</span></td>
                    <td className="px-4 py-3 text-slate-300">{task.tables}</td>
                    <td className="px-4 py-3 text-slate-300">{task.records}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{task.lastSync}</td>
                    <td className="px-4 py-3"><button className="text-cyan-400 hover:text-cyan-300 text-xs">详情</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
