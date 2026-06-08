import { useState, useEffect, useCallback } from 'react';
import { Globe, Zap, Clock, AlertTriangle, Search, Plus, Shield, Users, Activity, ExternalLink, FileText, Bug, Settings2, ArrowUpDown } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchServiceApiOverview, fetchServiceApis, updateServiceApiStatus } from '../../services/api';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useTableSort } from '../../hooks/useTableSort';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useTableSelection } from '../../hooks/useTableSelection';
import ErrorFallback from '../../components/common/ErrorFallback';

/* ── UI constants ────────────────────────────────────────────────────────── */

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusConfig: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  online:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '在线', dot: 'bg-emerald-400' },
  offline:     { color: 'text-slate-400',   bg: 'bg-slate-500/10',   label: '离线', dot: 'bg-slate-500' },
  maintaining: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: '维护中', dot: 'bg-amber-400' },
};

/* ── Component ───────────────────────────────────────────────────────── */

export default function DataServiceApi() {
  const [overview, setOverview] = useState<any>(null);
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  useKeyboardShortcut({
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [sortField, setSortField] = useState<'qps' | 'callerCount'>('qps');
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, items] = await Promise.all([
        fetchServiceApiOverview(),
        fetchServiceApis({
          keyword: debouncedSearch || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        }),
      ]);
      setOverview(ov);
      setApis(items);
      setError(false);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [debouncedSearch, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateServiceApiStatus(id, status);
    load();
  };

  const toggleSort = (field: 'qps' | 'callerCount') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...apis].sort((a, b) => {
    const v = (a[sortField] || 0) - (b[sortField] || 0);
    return sortAsc ? v : -v;
  });
  const filteredApis = sorted;
  const paginatedFilteredApis = filteredApis.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selection = useTableSelection(paginatedFilteredApis);

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: '数据服务' }, { label: '服务 API' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">服务 API 管理</h1>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> 创建 API
        </button>
      </div>

      {/* ── 概览卡片 ──────────────────────────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'API 总数', value: overview.totalApis, sub: `在线 ${overview.onlineApis}`, Icon: Globe, color: 'from-cyan-500 to-blue-500' },
            { label: '总 QPS', value: overview.totalQps.toLocaleString(), sub: '', Icon: Zap, color: 'from-amber-500 to-orange-500' },
            { label: '今日调用', value: overview.totalCallsToday, sub: '', Icon: Activity, color: 'from-purple-500 to-violet-500' },
            { label: '平均延迟', value: `${overview.avgLatencyMs}ms`, sub: `P99 ${overview.p99LatencyMs}ms`, Icon: Clock, color: 'from-emerald-500 to-green-500' },
            { label: 'SLA 达标', value: `${overview.slaCompliance}%`, sub: `错误率 ${overview.avgErrorRate}%`, Icon: Shield, color: 'from-rose-500 to-pink-500' },
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
      <div className="flex items-center gap-3 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 API 名称 / 路径 / 英文名"
            className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 w-72 focus:outline-none focus:border-cyan-500/50" />
        </div>
        <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
          {['all', 'online', 'offline', 'maintaining'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${filterStatus === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              {s === 'all' ? '全部' : statusConfig[s].label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-slate-500">共 {apis.length} 个 API</div>
      </div>

      {/* ── 主体：列表 + 详情 ──────────────────────────────────────── */}
      <div className="flex gap-0 min-h-[520px]">
        {/* API 列表 */}
        <div className={`${selected ? 'w-[60%]' : 'w-full'} transition-all`}>
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-l-xl overflow-x-auto">
              <table className="min-w-[920px] w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                    <th className="text-left px-4 py-3 font-medium w-[220px]">API</th>
                    <th className="text-left px-3 py-3 font-medium w-[70px]">方法</th>
                    <th className="text-left px-3 py-3 font-medium w-[70px]">状态</th>
                    <th className="text-left px-3 py-3 font-medium w-[80px] cursor-pointer select-none" onClick={() => toggleSort('qps')}>
                      <span className="flex items-center gap-0.5">QPS <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-[60px]">延迟</th>
                    <th className="text-left px-3 py-3 font-medium w-[60px]">错误率</th>
                    <th className="text-left px-3 py-3 font-medium w-[60px] cursor-pointer select-none" onClick={() => toggleSort('callerCount')}>
                      <span className="flex items-center gap-0.5">调用方 <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-[70px]">版本</th>
                    <th className="text-left px-3 py-3 font-medium w-[100px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFilteredApis.map(api => {
                    const sc = statusConfig[api.status] || statusConfig.offline;
                    return (
                      <tr key={api.id} onClick={() => setSelected(api)}
                        className={`border-b border-slate-700/30 cursor-pointer transition-colors ${selected?.id === api.id ? 'bg-slate-700/30' : 'hover:bg-slate-800/50'}`}>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium text-xs truncate">{api.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{api.path}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded font-mono border ${methodColors[api.method] || methodColors.GET}`}>{api.method}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded ${sc.bg} ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${api.status === 'online' ? 'animate-pulse' : ''}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-cyan-400 font-medium text-xs font-mono">{api.qps > 0 ? api.qps.toLocaleString() : '-'}</td>
                        <td className="px-3 py-3 text-slate-300 text-xs">{api.avgLatency}</td>
                        <td className="px-3 py-3 text-xs">
                          <span className={parseFloat(api.errorRate) > 0.04 ? 'text-amber-400' : 'text-emerald-400'}>
                            {api.errorRate}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-300">{api.callerCount}</td>
                        <td className="px-3 py-3 text-xs text-slate-400">{api.version}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={e => { e.stopPropagation(); setSelected(api); }} className="text-cyan-400 hover:text-cyan-300 text-xs">详情</button>
                            {api.status === 'offline' && (
                              <button onClick={e => { e.stopPropagation(); handleStatusChange(api.id, 'online'); }} className="text-emerald-400 hover:text-emerald-300 text-xs">上线</button>
                            )}
                            {api.status === 'online' && (
                              <button onClick={e => { e.stopPropagation(); handleStatusChange(api.id, 'offline'); }} className="text-red-400 hover:text-red-300 text-xs">下线</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredApis.length === 0 && (
                    <tr><td colSpan={9} className="text-center text-slate-500 py-12">暂无符合条件的 API</td></tr>
                  )}
                </tbody>
              </table>
            {selection.selectedCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/20 text-sm">
                <span className="text-cyan-300">已选 {selection.selectedCount} 项</span>
                <button onClick={() => { toast.success(`批量上线 ${selection.selectedCount} 条`); selection.clear(); }} className="px-3 py-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs">批量操作</button>
                <button onClick={() => { toast.error(`批量删除 ${selection.selectedCount} 条`); selection.clear(); }} className="px-3 py-1 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 text-xs">批量删除</button>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredApis.length / pageSize)}
              pageSize={pageSize}
              total={filteredApis.length}
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
              <span className="font-medium text-white text-sm">{selected.name}</span>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xs">关闭</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {/* 路径 + 方法 */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded font-mono border ${methodColors[selected.method]}`}>{selected.method}</span>
                <span className="text-xs text-slate-300 font-mono">{selected.path}</span>
              </div>

              {/* 描述 */}
              <div className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-3">{selected.description}</div>

              {/* 运行指标 */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { Icon: Zap, label: 'QPS', val: selected.qps > 0 ? selected.qps.toLocaleString() : '-' },
                  { Icon: Clock, label: '平均延迟', val: selected.avgLatency },
                  { Icon: Clock, label: 'P99 延迟', val: selected.p99Latency },
                  { Icon: AlertTriangle, label: '错误率', val: selected.errorRate },
                  { Icon: Activity, label: '总调用量', val: selected.totalCalls },
                  { Icon: Users, label: '调用方数', val: selected.callerCount },
                  { Icon: Shield, label: '认证方式', val: selected.authType },
                  { Icon: Shield, label: 'SLA', val: selected.sla },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/40 rounded-lg p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5"><item.Icon className="w-3 h-3" />{item.label}</div>
                    <div className="text-xs text-white font-medium">{item.val}</div>
                  </div>
                ))}
              </div>

              {/* 元信息 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">服务分类</span><span className="text-slate-300">{selected.category}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">负责人</span><span className="text-slate-300">{selected.owner}（{selected.department}）</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">版本</span><span className="text-slate-300">{selected.version}</span>
                </div>
              </div>

              {/* 操作栏 */}
              <div className="pt-3 border-t border-slate-700/30 flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"><FileText className="w-3 h-3" />文档</button>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"><Bug className="w-3 h-3" />调试</button>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"><Activity className="w-3 h-3" />监控</button>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"><Settings2 className="w-3 h-3" />编辑</button>
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
