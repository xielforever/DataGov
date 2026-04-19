import { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

interface ShareAsset {
  id: string;
  name: string;
  bizName: string;
  category: string;
  type: string;
  provider: string;
  providerDept: string;
  description: string;
  level: 'public' | 'internal' | 'sensitive';
  downloads: number;
  visits: number;
  rating: number;
  tags: string[];
  updatedAt: string;
  status: 'approved' | 'pending' | 'applied';
}

const SHARE_ASSETS: ShareAsset[] = [
  { id: 'sh1', name: 'dwd_order_detail', bizName: '订单明细宽表', category: '交易', type: '数据源', provider: '张明', providerDept: '数据平台', description: '包含订单、用户、商品关联信息的事实宽表，日更新', level: 'internal', downloads: 128, visits: 2450, rating: 4.8, tags: ['核心', 'DWD', '日更'], updatedAt: '2024-01-15', status: 'approved' },
  { id: 'sh2', name: 'dim_user_portrait', bizName: '用户画像维度', category: '用户', type: '数据源', provider: '赵敏', providerDept: '用户中心', description: 'RFM 分群、兴趣标签、消费能力分', level: 'sensitive', downloads: 56, visits: 1890, rating: 4.6, tags: ['画像', 'DIM', '周更'], updatedAt: '2024-01-14', status: 'approved' },
  { id: 'sh3', name: 'ads_sales_daily', bizName: '日销售汇总报', category: '交易', type: '数据源', provider: '陈静', providerDept: 'BI 团队', description: '按日汇总的 GMV、订单量、客单价指标', level: 'public', downloads: 230, visits: 5200, rating: 4.9, tags: ['报表', 'ADS', '日更'], updatedAt: '2024-01-15', status: 'approved' },
  { id: 'sh4', name: '用户行为分析 API', bizName: '', category: '用户', type: 'API', provider: '林峰', providerDept: '数据平台', description: '查询用户行为路径、漏斗、留存等分析结果', level: 'internal', downloads: 45, visits: 890, rating: 4.5, tags: ['API', '分析', '实时'], updatedAt: '2024-01-13', status: 'approved' },
  { id: 'sh5', name: '商品主数据', bizName: '', category: '商品', type: '数据源', provider: '孙立', providerDept: '商品中心', description: '商品 SPU/SKU 基础信息、分类、品牌', level: 'public', downloads: 180, visits: 3200, rating: 4.7, tags: ['主数', 'DIM'], updatedAt: '2024-01-14', status: 'approved' },
  { id: 'sh6', name: '实时风控评分服务', bizName: '', category: '风控', type: 'API', provider: '郑伟', providerDept: '风控域', description: '对交易实时风控评分，返回风险等级和建议操', level: 'sensitive', downloads: 12, visits: 340, rating: 4.3, tags: ['风控', 'API', '实时'], updatedAt: '2024-01-12', status: 'pending' },
  { id: 'sh7', name: 'dws_user_behavior_agg', bizName: '用户行为汇', category: '用户', type: '数据源', provider: '赵敏', providerDept: '用户中心', description: '按天汇总的用户行为指标（PV/UV/停留时长', level: 'internal', downloads: 89, visits: 1560, rating: 4.4, tags: ['DWS', '用户', '日更'], updatedAt: '2024-01-15', status: 'applied' },
  { id: 'sh8', name: '营销活动效果数据源', bizName: '', category: '营销', type: '数据源', provider: '吴静', providerDept: '营销域', description: '活动参与、转化、ROI 等效果指', level: 'internal', downloads: 34, visits: 670, rating: 4.2, tags: ['营销', '活动'], updatedAt: '2024-01-11', status: 'approved' },
];

const levelConfig: Record<string, { color: string; bg: string; label: string }> = {
  public: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '公开' },
  internal: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: '内部' },
  sensitive: { color: 'text-red-400', bg: 'bg-red-500/10', label: '敏感' },
};

export default function DataSharing() {
  const [assets, setAssets] = useState<ShareAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    setTimeout(() => { setAssets(SHARE_ASSETS); setLoading(false); }, 300);
  }, []);

  const filtered = assets.filter(a => {
    if (filterLevel !== 'all' && a.level !== filterLevel) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (search && !a.name.includes(search) && !a.description.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '数据服务' }, { label: '数据共享' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">数据共享</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">我的申请</button>
          <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">+ 发布数据</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '共享资产', value: assets.length, icon: '🌐', color: 'from-cyan-500 to-blue-500' },
          { label: '本周下载', value: assets.reduce((s, a) => s + a.downloads, 0), icon: '📥', color: 'from-emerald-500 to-green-500' },
          { label: '本周访问', value: `${(assets.reduce((s, a) => s + a.visits, 0) / 1000).toFixed(1)}K`, icon: '👁', color: 'from-purple-500 to-violet-500' },
          { label: '平均评分', value: (assets.reduce((s, a) => s + a.rating, 0) / assets.length).toFixed(1), icon: '', color: 'from-amber-500 to-orange-500' },
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索数据资产..."
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-64 focus:outline-none focus:border-cyan-500/50" />
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {['all', 'public', 'internal', 'sensitive'].map(l => (
            <button key={l} onClick={() => setFilterLevel(l)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterLevel === l ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              {l === 'all' ? '全部级别' : levelConfig[l].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {['all', '数据源', 'API'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterType === t ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
              {t === 'all' ? '全部类型' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-slate-800/40 rounded-xl p-5 animate-pulse"><div className="h-5 bg-slate-700 rounded w-2/3 mb-4" /><div className="h-4 bg-slate-700 rounded w-full mb-3" /><div className="h-4 bg-slate-700 rounded w-1/2" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(asset => {
            const lc = levelConfig[asset.level];
            return (
              <div key={asset.id} className="group bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{asset.bizName || asset.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${lc.bg} ${lc.color}`}>{lc.label}</span>
                      {asset.status === 'pending' && <span className="px-2 py-0.5 text-xs rounded bg-amber-500/10 text-amber-400">审核'</span>}
                      {asset.status === 'applied' && <span className="px-2 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-400">已申'</span>}
                    </div>
                    {asset.bizName && <div className="text-xs text-slate-500 font-mono">{asset.name}</div>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    {''.repeat(Math.floor(asset.rating))}{''.repeat(5 - Math.floor(asset.rating))}
                    <span className="text-slate-400 ml-1">{asset.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{asset.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {asset.tags.map(t => <span key={t} className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">{t}</span>)}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                  <div className="p-1.5 bg-slate-900/50 rounded"><div className="text-slate-500">类型</div><div className="text-slate-300">{asset.type}</div></div>
                  <div className="p-1.5 bg-slate-900/50 rounded"><div className="text-slate-500">下载</div><div className="text-white">{asset.downloads}</div></div>
                  <div className="p-1.5 bg-slate-900/50 rounded"><div className="text-slate-500">访问</div><div className="text-white">{asset.visits}</div></div>
                  <div className="p-1.5 bg-slate-900/50 rounded"><div className="text-slate-500">提供'</div><div className="text-slate-300">{asset.provider}</div></div>
                </div>
                <div className="pt-3 border-t border-slate-700/30 flex justify-between items-center">
                  <span className="text-xs text-slate-500">{asset.providerDept} · {asset.updatedAt}</span>
                  <button className="px-3 py-1.5 text-xs rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 font-medium">
                    {asset.status === 'approved' ? '申请使用' : '查看详情'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
