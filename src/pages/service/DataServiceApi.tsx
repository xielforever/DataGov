import { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST';
  category: string;
  description: string;
  status: 'online' | 'offline' | 'maintaining';
  version: string;
  qps: number;
  avgLatency: string;
  errorRate: string;
  totalCalls: string;
  callerCount: number;
  owner: string;
  createdAt: string;
}

const APIS: ApiEndpoint[] = [
  { id: 'a1', name: '订单查询', path: '/api/v1/orders', method: 'GET', category: '交易服务', description: '根据订单号或条件查询订单详情', status: 'online', version: 'v2.1', qps: 12500, avgLatency: '12ms', errorRate: '0.01%', totalCalls: '1.2', callerCount: 8, owner: '张明', createdAt: '2023-06-15' },
  { id: 'a2', name: '用户画像', path: '/api/v1/user/profile', method: 'GET', category: '用户服务', description: '获取用户基础信息、标签、RFM 分', status: 'online', version: 'v1.8', qps: 8500, avgLatency: '18ms', errorRate: '0.03%', totalCalls: '8,500', callerCount: 12, owner: '赵敏', createdAt: '2023-07-20' },
  { id: 'a3', name: '商品推荐', path: '/api/v1/recommend', method: 'POST', category: '推荐服务', description: '基于用户画像实时推荐商品列表', status: 'online', version: 'v3.0', qps: 22000, avgLatency: '35ms', errorRate: '0.05%', totalCalls: '2.5', callerCount: 5, owner: '林峰', createdAt: '2023-08-10' },
  { id: 'a4', name: '库存查询', path: '/api/v1/inventory', method: 'GET', category: '商品服务', description: '实时查询 SKU 库存余量', status: 'online', version: 'v1.5', qps: 15000, avgLatency: '8ms', errorRate: '0.02%', totalCalls: '1.8', callerCount: 6, owner: '孙立', createdAt: '2023-09-01' },
  { id: 'a5', name: 'GMV 实时指标', path: '/api/v1/metrics/gmv', method: 'GET', category: '指标服务', description: '获取实时 GMV、订单量、客单价等核心指', status: 'online', version: 'v2.0', qps: 3500, avgLatency: '22ms', errorRate: '0.01%', totalCalls: '3,200', callerCount: 4, owner: '陈静', createdAt: '2023-10-15' },
  { id: 'a6', name: '风控评分', path: '/api/v1/risk/score', method: 'POST', category: '风控服务', description: '对交易进行实时风控评', status: 'online', version: 'v1.3', qps: 9800, avgLatency: '15ms', errorRate: '0.04%', totalCalls: '9,800', callerCount: 3, owner: '郑伟', createdAt: '2023-11-05' },
  { id: 'a7', name: '数据导出', path: '/api/v1/export', method: 'POST', category: '数据服务', description: '异步导出数据为 CSV/Excel', status: 'maintaining', version: 'v1.0', qps: 0, avgLatency: '-', errorRate: '-', totalCalls: '56万', callerCount: 15, owner: '李雪', createdAt: '2023-12-01' },
  { id: 'a8', name: '数据血缘查', path: '/api/v1/lineage', method: 'GET', category: '元数据服', description: '查询表级/字段级血缘关', status: 'offline', version: 'v0.9', qps: 0, avgLatency: '-', errorRate: '-', totalCalls: '12', callerCount: 2, owner: '王浩', createdAt: '2024-01-10' },
];

const methodColors: Record<string, string> = { GET: 'bg-emerald-500/10 text-emerald-400', POST: 'bg-blue-500/10 text-blue-400' };
const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  online: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '在线' },
  offline: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: '离线' },
  maintaining: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '维护' },
};

export default function DataServiceApi() {
  const [apis, setApis] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setTimeout(() => { setApis(APIS); setLoading(false); }, 300);
  }, []);

  const filtered = apis.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (search && !a.name.includes(search) && !a.path.includes(search)) return false;
    return true;
  });

  const totalQps = apis.reduce((s, a) => s + a.qps, 0);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '数据服务' }, { label: '数据服务' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">数据服务</h1>
        <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">+ 创建 API</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
            { label: 'API 总数', value: apis.length, icon: '🔌', color: 'from-cyan-500 to-blue-500' },
            { label: '在线 API', value: apis.filter(a => a.status === 'online').length, icon: '🟢', color: 'from-emerald-500 to-green-500' },
            { label: '总QPS', value: totalQps.toLocaleString(), icon: '⚡', color: 'from-purple-500 to-violet-500' },
            { label: '总调用量', value: '7.8亿', icon: '📡', color: 'from-amber-500 to-orange-500' },
          ].map((s, i) => (
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 API 名称 / 路径..."
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-64 focus:outline-none focus:border-cyan-500/50" />
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {['all', 'online', 'offline', 'maintaining'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterStatus === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              {s === 'all' ? '全部' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* API Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-slate-800/40 rounded-xl p-5 animate-pulse"><div className="h-5 bg-slate-700 rounded w-2/3 mb-4" /><div className="h-4 bg-slate-700 rounded w-full mb-3" /><div className="h-4 bg-slate-700 rounded w-1/2" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(api => {
            const sc = statusConfig[api.status];
            return (
              <div key={api.id} className="group bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs rounded font-mono ${methodColors[api.method]}`}>{api.method}</span>
                    <div>
                      <div className="font-medium text-white text-sm">{api.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{api.path}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${sc.bg} ${sc.color} ${api.status === 'online' ? 'animate-pulse' : ''}`}>{sc.label}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{api.description}</p>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500">QPS</div>
                    <div className="text-sm font-semibold text-cyan-400">{api.qps.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500">延迟</div>
                    <div className="text-sm font-semibold text-white">{api.avgLatency}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500">错误'</div>
                    <div className="text-sm font-semibold text-emerald-400">{api.errorRate}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500">调用'</div>
                    <div className="text-sm font-semibold text-white">{api.callerCount}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{api.category} · {api.version}</span>
                  <span>负责人' {api.owner}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">文档</button>
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">调试</button>
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">监控</button>
                  <button className="px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600">编辑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
