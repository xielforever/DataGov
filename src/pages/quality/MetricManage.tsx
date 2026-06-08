import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Atom, GitBranch, Layers, BadgeCheck, Search, Plus, ChevronDown, ChevronRight, ExternalLink, Star, TrendingUp, Clock, User, Tag, Info, FileCode2, ArrowUpDown } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchMetricOverview, fetchMetrics, fetchMetricCategories, updateMetricStatus } from '../../services/api';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import ErrorFallback from '../../components/common/ErrorFallback';

/* ── UI constants ────────────────────────────────────────────────────────── */

const typeConfig: Record<string, { color: string; bg: string; label: string; Icon: typeof Atom }> = {
  atomic:    { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   label: '原子指标', Icon: Atom },
  derived:   { color: 'text-purple-400', bg: 'bg-purple-500/10', label: '派生指标', Icon: GitBranch },
  composite: { color: 'text-amber-400',  bg: 'bg-amber-500/10',  label: '复合指标', Icon: Layers },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  published:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '已发布' },
  draft:      { color: 'text-slate-400',   bg: 'bg-slate-500/10',   label: '草稿' },
  deprecated: { color: 'text-red-400',     bg: 'bg-red-500/10',     label: '已废弃' },
  reviewing:  { color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: '审核中' },
};

/* ── Component ───────────────────────────────────────────────────────── */

export default function MetricManage() {
  const [overview, setOverview] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [search, setSearch] = useState('');
  useKeyboardShortcut({
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [sortField, setSortField] = useState<'usedBy' | 'updatedAt'>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, ms, cats] = await Promise.all([
        fetchMetricOverview(),
        fetchMetrics({ keyword: debouncedSearch || undefined, type: filterType !== 'all' ? filterType : undefined, category: filterCategory !== 'all' ? filterCategory : undefined, status: filterStatus !== 'all' ? filterStatus : undefined }),
        fetchMetricCategories(),
      ]);
      setOverview(ov);
      setMetrics(ms);
      setCategories(cats);
      setError(false);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [debouncedSearch, filterType, filterCategory, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateMetricStatus(id, status);
    load();
  };

  const toggleSort = (field: 'usedBy' | 'updatedAt') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...metrics].sort((a, b) => {
    const v = sortField === 'usedBy'
      ? a.usedBy - b.usedBy
      : a.updatedAt.localeCompare(b.updatedAt);
    return sortAsc ? v : -v;
  });
  const filteredMetrics = sorted;
  const paginatedFilteredMetrics = filteredMetrics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: '数据服务' }, { label: '指标管理' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">指标管理</h1>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> 新建指标
        </button>
      </div>

      {/* ── 概览卡片 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3">
        {overview && [
          { label: '指标总数',   value: overview.totalMetrics,     Icon: BarChart3, color: 'from-cyan-500 to-blue-500' },
          { label: '原子指标',   value: overview.atomicCount,      Icon: Atom,      color: 'from-emerald-500 to-green-500' },
          { label: '派生指标',   value: overview.derivedCount,     Icon: GitBranch, color: 'from-purple-500 to-violet-500' },
          { label: '复合指标',   value: overview.compositeCount,   Icon: Layers,    color: 'from-amber-500 to-orange-500' },
          { label: '认证覆盖率', value: `${overview.certifiedRate}%`, Icon: BadgeCheck, color: 'from-rose-500 to-pink-500' },
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 业务域分布条 ─────────────────────────────────────────────── */}
      {overview?.coverageByDomain && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">业务域指标分布</div>
          <div className="flex gap-1 h-5 rounded overflow-hidden">
            {overview.coverageByDomain.map((d: any, i: number) => {
              const w = (d.count / overview.totalMetrics) * 100;
              const colors = ['bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-blue-500'];
              return (
                <div key={i} className={`${colors[i % colors.length]} transition-all hover:opacity-80 relative group`} style={{ width: `${w}%` }} title={`${d.domain}: ${d.count} 个`}>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                    {d.domain} {d.count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 flex-wrap">
            {overview.coverageByDomain.map((d: any, i: number) => {
              const colors = ['text-cyan-400', 'text-purple-400', 'text-amber-400', 'text-emerald-400', 'text-rose-400', 'text-blue-400'];
              return (
                <span key={i} className={`text-xs ${colors[i % colors.length]}`}>● {d.domain} {d.count}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 筛选栏 ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索指标名称 / 英文名 / 定义"
            className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-72 focus:outline-none focus:border-cyan-500/50" />
        </div>
        <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
          {['all', 'atomic', 'derived', 'composite'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterType === t ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              {t === 'all' ? '全部类型' : typeConfig[t].label}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
          {['all', ...categories.map(c => c.name)].map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${filterCategory === c ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}>
              {c === 'all' ? '全部域' : c.replace('域', '')}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
          {['all', 'published', 'draft', 'deprecated'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${filterStatus === s ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
              {s === 'all' ? '全部状态' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* ── 主体：列表 + 详情 ──────────────────────────────────────── */}
      <div className="flex gap-0 min-h-[520px]">
        {/* 指标列表 */}
        <div className={`${selected ? 'w-[62%]' : 'w-full'} transition-all`}>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-l-xl overflow-x-auto">
              <table className="min-w-[920px] w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                    <th className="text-left px-4 py-3 font-medium w-[200px]">指标名称</th>
                    <th className="text-left px-3 py-3 font-medium w-[80px]">类型</th>
                    <th className="text-left px-3 py-3 font-medium w-[70px]">业务域</th>
                    <th className="text-left px-3 py-3 font-medium w-[70px]">状态</th>
                    <th className="text-left px-3 py-3 font-medium w-[170px]">计算逻辑</th>
                    <th className="text-left px-3 py-3 font-medium w-[100px]">维度</th>
                    <th className="text-left px-3 py-3 font-medium w-[50px] cursor-pointer select-none" onClick={() => toggleSort('usedBy')}>
                      <span className="flex items-center gap-0.5">引用 <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-[90px] cursor-pointer select-none" onClick={() => toggleSort('updatedAt')}>
                      <span className="flex items-center gap-0.5">更新 <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-[90px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFilteredMetrics.map(m => {
                    const tc = typeConfig[m.type] || typeConfig.atomic;
                    const sc = statusConfig[m.status] || statusConfig.draft;
                    return (
                      <tr key={m.id} onClick={() => setSelected(m)}
                        className={`border-b border-slate-700/30 cursor-pointer transition-colors ${selected?.id === m.id ? 'bg-slate-700/30' : 'hover:bg-slate-800/50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {m.certified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            <div className="min-w-0">
                              <div className="text-white font-medium truncate">{m.bizName}</div>
                              <div className="text-xs text-slate-500 font-mono truncate">{m.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${tc.bg} ${tc.color}`}>
                            <tc.Icon className="w-3 h-3" />{tc.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-300 text-xs">{m.category.replace('域', '')}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-400 text-xs font-mono max-w-[170px] truncate" title={m.formula}>{m.formula}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-0.5">
                            {m.dimensions.slice(0, 2).map((d: string) => <span key={d} className="px-1 py-0.5 text-[10px] bg-slate-700 text-slate-400 rounded">{d}</span>)}
                            {m.dimensions.length > 2 && <span className="text-[10px] text-slate-500">+{m.dimensions.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3"><span className="text-cyan-400 font-medium text-xs">{m.usedBy}</span></td>
                        <td className="px-3 py-3 text-slate-500 text-xs">{m.updatedAt}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={e => { e.stopPropagation(); setSelected(m); }} className="text-cyan-400 hover:text-cyan-300 text-xs">详情</button>
                            {m.status === 'draft' && (
                              <button onClick={e => { e.stopPropagation(); handleStatusChange(m.id, 'published'); }} className="text-emerald-400 hover:text-emerald-300 text-xs">发布</button>
                            )}
                            {m.status === 'published' && (
                              <button onClick={e => { e.stopPropagation(); handleStatusChange(m.id, 'deprecated'); }} className="text-red-400 hover:text-red-300 text-xs">废弃</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMetrics.length === 0 && (
                    <tr><td colSpan={9} className="text-center text-slate-500 py-12">暂无符合条件的指标</td></tr>
                  )}
                </tbody>
              </table>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredMetrics.length / pageSize)}
              pageSize={pageSize}
              total={filteredMetrics.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
            </div>
          )}
        </div>

        {/* 指标详情面板 */}
        {selected && (
          <div className="w-[38%] bg-slate-800/60 border border-slate-700/30 border-l-0 rounded-r-xl overflow-y-auto max-h-[600px]">
            <div className="sticky top-0 bg-slate-800/90 backdrop-blur border-b border-slate-700/30 px-5 py-3 flex items-center justify-between">
              <span className="font-medium text-white text-sm">{selected.bizName}</span>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xs">关闭</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {/* 基本信息 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">{selected.name}</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${typeConfig[selected.type]?.bg} ${typeConfig[selected.type]?.color}`}>
                    {typeConfig[selected.type]?.label}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${statusConfig[selected.status]?.bg} ${statusConfig[selected.status]?.color}`}>
                    {statusConfig[selected.status]?.label}
                  </span>
                  {selected.certified && <BadgeCheck className="w-4 h-4 text-emerald-400" />}
                </div>
              </div>

              {/* 定义 */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Info className="w-3.5 h-3.5" />业务定义</div>
                <div className="text-slate-300 text-xs bg-slate-900/50 rounded-lg p-3">{selected.definition}</div>
              </div>

              {/* 计算逻辑 */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><FileCode2 className="w-3.5 h-3.5" />计算逻辑</div>
                <div className="text-cyan-300 text-xs font-mono bg-slate-900/50 rounded-lg p-3 break-all">{selected.formula}</div>
              </div>

              {/* 元信息网格 */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Star, label: '业务域', val: selected.category },
                  { icon: TrendingUp, label: '更新频率', val: selected.updateFreq },
                  { icon: ExternalLink, label: '来源表', val: selected.sourceTable },
                  { icon: Clock, label: '版本', val: selected.version },
                  { icon: User, label: '负责人', val: `${selected.owner}（${selected.department}）` },
                  { icon: Tag, label: '单位', val: selected.unit || '-' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/40 rounded-lg p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5"><item.icon className="w-3 h-3" />{item.label}</div>
                    <div className="text-xs text-slate-300 truncate" title={item.val}>{item.val}</div>
                  </div>
                ))}
              </div>

              {/* 维度 */}
              <div>
                <div className="text-xs text-slate-400 mb-1">分析维度</div>
                <div className="flex flex-wrap gap-1">
                  {selected.dimensions.map((d: string) => <span key={d} className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">{d}</span>)}
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

              {/* 引用 */}
              <div className="bg-slate-900/40 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">被引用数</span>
                <span className="text-lg font-bold text-cyan-400">{selected.usedBy}<span className="text-xs text-slate-500 ml-1">个应用</span></span>
              </div>

              {/* 时间 */}
              <div className="text-xs text-slate-500 flex justify-between pt-2 border-t border-slate-700/30">
                <span>创建: {selected.createdAt}</span>
                <span>更新: {selected.updatedAt}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
