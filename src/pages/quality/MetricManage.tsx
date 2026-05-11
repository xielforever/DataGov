import { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

interface Metric {
  id: string;
  name: string;
  bizName: string;
  type: 'atomic' | 'derived' | 'composite';
  category: string;
  definition: string;
  formula: string;
  sourceTable: string;
  dimensions: string[];
  unit: string;
  updateFreq: string;
  owner: string;
  status: 'published' | 'draft' | 'deprecated';
  usedBy: number;
}

const METRICS: Metric[] = [
  { id: 'm1', name: 'gmv', bizName: '成交总额', type: 'atomic', category: '交易', definition: '统计周期内所有已完成订单的支付金额之', formula: 'SUM(order_amount) WHERE order_status = "completed"', sourceTable: 'dwd.dwd_order_detail', dimensions: ['日期', '类目', '渠道', '地域'], unit: '', updateFreq: '每日', owner: '张明', status: 'published', usedBy: 12 },
  { id: 'm2', name: 'order_cnt', bizName: '订单', type: 'atomic', category: '交易', definition: '统计周期内所有已完成订单的数', formula: 'COUNT(order_id) WHERE order_status = "completed"', sourceTable: 'dwd.dwd_order_detail', dimensions: ['日期', '类目', '渠道'], unit: '', updateFreq: '每日', owner: '张明', status: 'published', usedBy: 8 },
  { id: 'm3', name: 'avg_order_amount', bizName: '客单', type: 'derived', category: '交易', definition: '成交总额 / 订单', formula: 'gmv / order_cnt', sourceTable: '-', dimensions: ['日期', '类目', '渠道'], unit: '元', updateFreq: '每日', owner: '张明', status: 'published', usedBy: 5 },
  { id: 'm4', name: 'dau', bizName: '日活跃用户数', type: 'atomic', category: '用户', definition: '当日至少产生一次有效行为的独立用户域', formula: 'COUNT(DISTINCT user_id) WHERE event_date = TODAY()', sourceTable: 'dwd.dwd_user_event', dimensions: ['日期', '平台', '渠道'], unit: '', updateFreq: '每日', owner: '赵敏', status: 'published', usedBy: 15 },
  { id: 'm5', name: 'retention_7d', bizName: '7日留存率', type: 'derived', category: '用户', definition: '7 天前注册用户中，今日仍活跃的占比', formula: 'COUNT(DISTINCT active_users_7d) / COUNT(DISTINCT new_users_7d_ago)', sourceTable: '-', dimensions: ['日期', '渠道'], unit: '%', updateFreq: '每日', owner: '赵敏', status: 'published', usedBy: 6 },
  { id: 'm6', name: 'conversion_rate', bizName: '转化', type: 'composite', category: '交易', definition: '从浏览到下单的完整转化率', formula: 'order_cnt / page_view_cnt * 100', sourceTable: '-', dimensions: ['日期', '类目', '渠道'], unit: '%', updateFreq: '实时', owner: '林峰', status: 'published', usedBy: 4 },
  { id: 'm7', name: 'inventory_turnover', bizName: '库存周转天数', type: 'derived', category: '商品', definition: '平均库存 / 日均销售量', formula: 'avg_inventory / daily_sales', sourceTable: '-', dimensions: ['日期', '仓库', '类目'], unit: '', updateFreq: '每周', owner: '孙立', status: 'draft', usedBy: 2 },
  { id: 'm8', name: 'roi', bizName: '投资回报率', type: 'composite', category: '营销', definition: '营销活动带来的 GMV / 营销投入', formula: 'campaign_gmv / campaign_cost * 100', sourceTable: '-', dimensions: ['日期', '活动', '渠道'], unit: '%', updateFreq: '每日', owner: '陈静', status: 'reviewing', usedBy: 3 },
];

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  atomic: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: '原子指标' },
  derived: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: '派生指标' },
  composite: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '复合指标' },
};

export default function MetricManage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    setTimeout(() => { setMetrics(METRICS); setLoading(false); }, 300);
  }, []);

  const filtered = metrics.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    if (search && !m.name.includes(search) && !m.bizName.includes(search)) return false;
    return true;
  });

  const categories = [...new Set(metrics.map(m => m.category))];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '数据服务' }, { label: '指标管理' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">指标管理</h1>
        <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">+ 新建指标</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '指标总数', value: metrics.length, icon: '📊', color: 'from-cyan-500 to-blue-500' },
          { label: '原子指标', value: metrics.filter(m => m.type === 'atomic').length, icon: '⚛️', color: 'from-emerald-500 to-green-500' },
          { label: '派生指标', value: metrics.filter(m => m.type === 'derived').length, icon: '🔗', color: 'from-purple-500 to-violet-500' },
          { label: '复合指标', value: metrics.filter(m => m.type === 'composite').length, icon: '🧬', color: 'from-amber-500 to-orange-500' },
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索指标名称或指标描述"
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-64 focus:outline-none focus:border-cyan-500/50" />
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {['all', 'atomic', 'derived', 'composite'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterType === t ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              {t === 'all' ? '全部类型' : typeConfig[t].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterCategory === c ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
              {c === 'all' ? '全部业务' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-slate-800/40 rounded-xl p-5 animate-pulse h-64" />
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                <th className="text-left px-4 py-3 font-medium">指标名称</th>
                <th className="text-left px-4 py-3 font-medium">类型</th>
                <th className="text-left px-4 py-3 font-medium">业务'</th>
                <th className="text-left px-4 py-3 font-medium">计算逻辑</th>
                <th className="text-left px-4 py-3 font-medium">维度</th>
                <th className="text-left px-4 py-3 font-medium">更新频率</th>
                <th className="text-left px-4 py-3 font-medium">被引'</th>
                <th className="text-left px-4 py-3 font-medium">负责人'</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const tc = typeConfig[m.type];
                return (
                  <tr key={m.id} className="border-b border-slate-700/30 hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{m.bizName}</div>
                      <div className="text-xs text-slate-500 font-mono">{m.name}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded ${tc.bg} ${tc.color}`}>{tc.label}</span></td>
                    <td className="px-4 py-3 text-slate-300">{m.category}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono max-w-[200px] truncate" title={m.formula}>{m.formula}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.dimensions.slice(0, 2).map(d => <span key={d} className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">{d}</span>)}
                        {m.dimensions.length > 2 && <span className="text-xs text-slate-500">+{m.dimensions.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{m.updateFreq}</td>
                    <td className="px-4 py-3"><span className="text-cyan-400 font-medium">{m.usedBy}</span><span className="text-slate-500 text-xs ml-1">个应'</span></td>
                    <td className="px-4 py-3 text-slate-400">{m.owner}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="text-cyan-400 hover:text-cyan-300 text-xs">详情</button>
                      <button className="text-slate-400 hover:text-white text-xs">编辑</button>
                    </td>
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
