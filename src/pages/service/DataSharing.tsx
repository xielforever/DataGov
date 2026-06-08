import { useState, useEffect, useCallback } from 'react';
import { Share2, Download, Eye, Star, Search, Plus, Database, Globe2, Lock, ShieldAlert, ArrowUpDown, ExternalLink, Tag, Clock, User, HardDrive, FileText, Columns } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchDataSharingOverview, fetchServiceShares, applyShareAsset } from '../../services/api';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import ErrorFallback from '../../components/common/ErrorFallback';

/* ── UI constants ────────────────────────────────────────────────────────── */

const levelConfig: Record<string, { color: string; bg: string; label: string; Icon: typeof Globe2 }> = {
  public:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '公开',   Icon: Globe2 },
  internal:  { color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: '内部',   Icon: Lock },
  sensitive: { color: 'text-red-400',     bg: 'bg-red-500/10',     label: '敏感',   Icon: ShieldAlert },
};

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  dataset: { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   label: '数据集' },
  api:     { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'API' },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '已上架' },
  pending:  { color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: '审核中' },
  applied:  { color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    label: '已申请' },
};

/* ── Component ───────────────────────────────────────────────────────── */

export default function DataSharing() {
  const [overview, setOverview] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  useKeyboardShortcut({
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedSearch = useDebounce(search, 300);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [sortField, setSortField] = useState<'downloads' | 'visits' | 'rating'>('visits');
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, items] = await Promise.all([
        fetchDataSharingOverview(),
        fetchServiceShares({
          keyword: debouncedSearch || undefined,
          level: filterLevel !== 'all' ? filterLevel : undefined,
          type: filterType !== 'all' ? filterType : undefined,
        }),
      ]);
      setOverview(ov);
      setAssets(items);
      setError(false);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [debouncedSearch, filterLevel, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (id: string) => {
    await applyShareAsset(id);
    load();
  };

  const toggleSort = (field: 'downloads' | 'visits' | 'rating') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...assets].sort((a, b) => {
    const v = (a[sortField] || 0) - (b[sortField] || 0);
    return sortAsc ? v : -v;
  });
  const filteredAssets = sorted;
  const paginatedFilteredAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    return (
      <span className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < full ? 'fill-amber-400' : 'fill-transparent'}`} />
        ))}
        <span className="text-slate-400 text-xs ml-1">{rating}</span>
      </span>
    );
  };

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: '数据服务' }, { label: '数据共享' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">数据共享</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
            <FileText className="w-4 h-4" /> 我的申请
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> 发布数据
          </button>
        </div>
      </div>

      {/* ── 概览卡片 ──────────────────────────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '共享资产', value: overview.totalAssets, sub: `已上架 ${overview.approvedAssets}`, Icon: Share2, color: 'from-cyan-500 to-blue-500' },
            { label: '本月申请', value: overview.appliedThisMonth, sub: `待审 ${overview.pendingAssets}`, Icon: Download, color: 'from-emerald-500 to-green-500' },
            { label: '本周访问', value: `${(overview.weeklyVisits / 1000).toFixed(1)}K`, sub: `下载 ${overview.totalDownloads}`, Icon: Eye, color: 'from-purple-500 to-violet-500' },
            { label: '平均评分', value: overview.avgRating.toFixed(1), sub: `热门域: ${overview.topCategory}`, Icon: Star, color: 'from-amber-500 to-orange-500' },
          ].map((s, i) => (
            <div key={i} className="relative overflow-hidden bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${s.color} opacity-10 rounded-bl-full`} />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color} bg-opacity-20`}>
                  <s.Icon className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                  {s.sub && <div className="text-[10px] text-slate-500">{s.sub}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 筛选栏 ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索数据资产名称 / 描述"
            className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-72 focus:outline-none focus:border-cyan-500/50" />
        </div>
        <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
          {['all', 'public', 'internal', 'sensitive'].map(l => (
            <button key={l} onClick={() => setFilterLevel(l)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterLevel === l ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              {l === 'all' ? '全部级别' : levelConfig[l].label}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
          {['all', 'dataset', 'api'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterType === t ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
              {t === 'all' ? '全部类型' : typeConfig[t].label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-slate-500">共 {assets.length} 个资产</div>
      </div>

      {/* ── 主体：列表 + 详情 ──────────────────────────────────────── */}
      <div className="flex gap-0 min-h-[520px]">
        {/* 资产列表 */}
        <div className={`${selected ? 'w-[60%]' : 'w-full'} transition-all`}>
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-l-xl overflow-x-auto">
              <table className="min-w-[800px] w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                    <th className="text-left px-4 py-3 font-medium w-[220px]">资产名称</th>
                    <th className="text-left px-3 py-3 font-medium w-[65px]">类型</th>
                    <th className="text-left px-3 py-3 font-medium w-[55px]">级别</th>
                    <th className="text-left px-3 py-3 font-medium w-[60px]">状态</th>
                    <th className="text-left px-3 py-3 font-medium w-[70px]">业务域</th>
                    <th className="text-left px-3 py-3 font-medium w-[60px] cursor-pointer select-none" onClick={() => toggleSort('downloads')}>
                      <span className="flex items-center gap-0.5">下载 <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-[60px] cursor-pointer select-none" onClick={() => toggleSort('visits')}>
                      <span className="flex items-center gap-0.5">访问 <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-[90px] cursor-pointer select-none" onClick={() => toggleSort('rating')}>
                      <span className="flex items-center gap-0.5">评分 <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-[90px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFilteredAssets.map(a => {
                    const lc = levelConfig[a.level] || levelConfig.internal;
                    const tc = typeConfig[a.type] || typeConfig.dataset;
                    const sc = statusConfig[a.status] || statusConfig.approved;
                    return (
                      <tr key={a.id} onClick={() => setSelected(a)}
                        className={`border-b border-slate-700/30 cursor-pointer transition-colors ${selected?.id === a.id ? 'bg-slate-700/30' : 'hover:bg-slate-800/50'}`}>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium text-xs truncate">{a.bizName || a.name}</div>
                          {a.bizName && <div className="text-[10px] text-slate-500 font-mono truncate">{a.name}</div>}
                        </td>
                        <td className="px-3 py-3"><span className={`px-2 py-0.5 text-xs rounded ${tc.bg} ${tc.color}`}>{tc.label}</span></td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${lc.bg} ${lc.color}`}>
                            <lc.Icon className="w-3 h-3" />{lc.label}
                          </span>
                        </td>
                        <td className="px-3 py-3"><span className={`px-2 py-0.5 text-xs rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                        <td className="px-3 py-3 text-slate-300 text-xs">{a.category}</td>
                        <td className="px-3 py-3 text-white text-xs font-medium">{a.downloads}</td>
                        <td className="px-3 py-3 text-slate-300 text-xs">{a.visits.toLocaleString()}</td>
                        <td className="px-3 py-3">{renderStars(a.rating)}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            {a.status === 'approved' && (
                              <button onClick={e => { e.stopPropagation(); handleApply(a.id); }} className="text-cyan-400 hover:text-cyan-300 text-xs">申请使用</button>
                            )}
                            {a.status !== 'approved' && (
                              <button onClick={e => { e.stopPropagation(); setSelected(a); }} className="text-slate-400 hover:text-white text-xs">查看</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAssets.length === 0 && (
                    <tr><td colSpan={9} className="text-center text-slate-500 py-12">暂无符合条件的共享资产</td></tr>
                  )}
                </tbody>
              </table>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredAssets.length / pageSize)}
              pageSize={pageSize}
              total={filteredAssets.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selected && (
          <div className="w-[40%] bg-slate-800/60 border border-slate-700/30 border-l-0 rounded-r-xl overflow-y-auto max-h-[600px]">
            <div className="sticky top-0 bg-slate-800/90 backdrop-blur border-b border-slate-700/30 px-5 py-3 flex items-center justify-between">
              <span className="font-medium text-white text-sm">{selected.bizName || selected.name}</span>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xs">关闭</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {/* 名称 + 标签 */}
              <div className="space-y-2">
                {selected.bizName && <div className="text-xs text-slate-500 font-mono">{selected.name}</div>}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => { const lc = levelConfig[selected.level]; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${lc.bg} ${lc.color}`}><lc.Icon className="w-3 h-3" />{lc.label}</span>; })()}
                  {(() => { const tc = typeConfig[selected.type]; return <span className={`px-2 py-0.5 text-xs rounded ${tc.bg} ${tc.color}`}>{tc.label}</span>; })()}
                  {(() => { const sc = statusConfig[selected.status]; return <span className={`px-2 py-0.5 text-xs rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>; })()}
                </div>
              </div>

              {/* 描述 */}
              <div className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-3 leading-relaxed">{selected.description}</div>

              {/* 运行数据 */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { Icon: Download, label: '下载次数', val: selected.downloads },
                  { Icon: Eye, label: '访问次数', val: selected.visits.toLocaleString() },
                  { Icon: Columns, label: '字段数', val: selected.schema || '-' },
                  { Icon: HardDrive, label: '数据量', val: selected.size },
                  { Icon: Clock, label: '更新频率', val: selected.updateFreq },
                  { Icon: Tag, label: '业务域', val: selected.category },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/40 rounded-lg p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5"><item.Icon className="w-3 h-3" />{item.label}</div>
                    <div className="text-xs text-white font-medium">{item.val}</div>
                  </div>
                ))}
              </div>

              {/* 评分 */}
              <div className="bg-slate-900/40 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">用户评分</span>
                {renderStars(selected.rating)}
              </div>

              {/* 提供方 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3" />提供人</span>
                  <span className="text-slate-300">{selected.provider}（{selected.providerDept}）</span>
                </div>
              </div>

              {/* 标签 */}
              {selected.tags?.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">标签</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((t: string) => <span key={t} className="px-2 py-0.5 text-xs bg-cyan-500/10 text-cyan-400 rounded">{t}</span>)}
                  </div>
                </div>
              )}

              {/* 操作 */}
              <div className="pt-3 border-t border-slate-700/30 flex gap-2">
                {selected.status === 'approved' && (
                  <button onClick={() => handleApply(selected.id)}
                    className="flex items-center gap-1 px-4 py-2 text-xs rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5" /> 申请使用
                  </button>
                )}
                <button className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                  <Database className="w-3.5 h-3.5" /> 预览数据
                </button>
              </div>

              {/* 时间 */}
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                最近更新: {selected.updatedAt}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
