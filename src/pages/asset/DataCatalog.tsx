import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Building2, CircleDot, Copy, Database, Eye, HardDrive, Lock, MessageSquare, Plug, Search, Server, Table2, Tag, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchAssetCatalog, fetchBusinessDomainOptions, fetchDataLayers, fetchSensitivities, fetchTagOptions, fetchAssetDataSources } from '../../services/api';
import { navigateTo } from '../../utils/navigation';
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';

type ViewMode = 'card' | 'table';
type SortField = 'name' | 'updateTime' | 'visitCount' | 'qualityScore';

interface Asset {
  id: string;
  name: string;
  cnName: string;
  description: string;
  database: string;
  source: string;
  sourceType: string;
  layer: 'ODS' | 'DWD' | 'DWS' | 'ADS' | 'DIM';
  domain: string;
  owner: string;
  ownerAvatar: string;
  department: string;
  sensitivity: '公开' | '内部' | '敏感' | '机密';
  qualityScore: number;
  rowCount: number;
  size: string;
  fieldCount: number;
  visitCount: number;
  updateTime: string;
  tags: string[];
  certified: boolean;
  favorite: boolean;
}

export default function DataCatalog() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [selectedSensitivities, setSelectedSensitivities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCertifiedOnly, setShowCertifiedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('updateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  useEffect(() => {
    Promise.all([
      fetchBusinessDomainOptions().then((res) => setDomains((res as Array<{name: string}>).map(d => d.name))),
      fetchDataLayers().then((res) => setLayers(res as string[])),
      fetchSensitivities().then((res) => setSensitivities(res as string[])),
      fetchTagOptions().then((res) => setTagOptions(res as string[])),
      fetchAssetDataSources().then((res) => setSources((res as Array<{name: string}>).map(d => d.name))),
    ]).catch(() => {});
  }, []);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAssetCatalog()
      .then((data) => {
        if (mounted) setAllAssets(data as Asset[]);
      })
      .catch(() => {
        if (mounted) toast.error('资产目录加载失败');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

const [domains, setDomains] = useState<string[]>([]);
const [layers, setLayers] = useState<string[]>([]);
const [sensitivities, setSensitivities] = useState<string[]>([]);
const [sources, setSources] = useState<string[]>([]);
const [tagOptions, setTagOptions] = useState<string[]>([]);

  const layerColors: Record<string, string> = {
    ODS: 'from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30',
    DWD: 'from-cyan-500/20 to-cyan-600/20 text-cyan-300 border-cyan-500/30',
    DWS: 'from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-500/30',
    ADS: 'from-pink-500/20 to-pink-600/20 text-pink-300 border-pink-500/30',
    DIM: 'from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-500/30',
  };

  const sensitivityColors: Record<string, string> = {
    公开: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    内部: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    敏感: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    机密: 'bg-red-500/15 text-red-300 border-red-500/30',
  };

  const sourceIcons: Record<string, LucideIcon> = {
    mysql: Database,
    hive: HardDrive,
    kafka: MessageSquare,
    clickhouse: BarChart3,
    postgresql: Server,
    mongodb: CircleDot,
    oracle: Database,
    redis: Zap,
    elasticsearch: Search,
    doris: Table2,
  };

  const toggleFilter = (filter: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(filter)) {
      setter(list.filter((f) => f !== filter));
    } else {
      setter([...list, filter]);
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedDomains([]);
    setSelectedLayers([]);
    setSelectedSensitivities([]);
    setSelectedSources([]);
    setSelectedTags([]);
    setShowCertifiedOnly(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredAssets = useMemo(() => {
    let result = allAssets.filter((asset) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !asset.name.toLowerCase().includes(q) &&
          !asset.cnName.toLowerCase().includes(q) &&
          !asset.description.toLowerCase().includes(q) &&
          !asset.owner.toLowerCase().includes(q)
        ) return false;
      }
      if (selectedDomains.length && !selectedDomains.includes(asset.domain)) return false;
      if (selectedLayers.length && !selectedLayers.includes(asset.layer)) return false;
      if (selectedSensitivities.length && !selectedSensitivities.includes(asset.sensitivity)) return false;
      if (selectedSources.length && !selectedSources.some((s) => asset.sourceType === s.toLowerCase())) return false;
      if (selectedTags.length && !selectedTags.some((t) => asset.tags.includes(t))) return false;
      if (showCertifiedOnly && !asset.certified) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'updateTime') cmp = a.updateTime.localeCompare(b.updateTime);
      else if (sortField === 'visitCount') cmp = a.visitCount - b.visitCount;
      else if (sortField === 'qualityScore') cmp = a.qualityScore - b.qualityScore;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allAssets, searchQuery, selectedDomains, selectedLayers, selectedSensitivities, selectedSources, selectedTags, showCertifiedOnly, sortField, sortOrder]);

  const paginatedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredAssets.length / pageSize);

  const activeFilterCount = selectedDomains.length + selectedLayers.length + selectedSensitivities.length + selectedSources.length + selectedTags.length + (showCertifiedOnly ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Breadcrumb items={[{ label: '数据资产' }, { label: '数据目录' }]} />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">数据目录</h1>
            <span className="px-2.5 py-1 text-xs rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {allAssets.length} 个资产
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">浏览、搜索和发现平台所有数据资产</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => toast.success('目录导出任务已提交')}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition flex items-center gap-2"
          >
            <span>导出目录</span>
          </button>
          <button
            onClick={() => { navigateTo("asset-register"); }}
            className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition flex items-center gap-2"
          >
            <span>注册资产</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">正在加载资产目录...</div>
      )}

      {/* 顶部搜索'*/}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="搜索资产名称、中文名、描述、负责人..."
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5">
              <kbd className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 border border-white/10">⌘K</kbd>
            </div>
          </div>
          <button
            onClick={() => setShowCertifiedOnly(!showCertifiedOnly)}
            className={`w-full sm:w-auto px-4 py-3 text-sm rounded-xl border transition flex items-center justify-center gap-2 ${
              showCertifiedOnly
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>✓</span>
            <span>仅看已认证</span>
          </button>
        </div>

        {/* 热门搜索 */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">热门搜索</span>
          {['用户订单', '用户画像', '销售报表', '商品维度', '风控评分'].map((tag) => (
            <button
              key={tag}
              onClick={() => { setSearchQuery(tag); setCurrentPage(1); }}
              className="px-2.5 py-1 text-xs rounded-md bg-white/5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 主区域：左侧筛'+ 右侧列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧筛选面'*/}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">筛选条</h3>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-300">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-slate-400 hover:text-cyan-300 transition">
                  清空
                </button>
              )}
            </div>

            <div className="space-y-5 lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
              {/* 业务'*/}
              <FilterSection title="业务" Icon={Building2}>
                <div className="space-y-1.5">
                  {domains.map((d) => (
                    <FilterCheckbox
                      key={d} label={d}
                      checked={selectedDomains.includes(d)}
                      onChange={() => toggleFilter(d, selectedDomains, setSelectedDomains)}
                      count={allAssets.filter(a => a.domain === d).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 数据分层 */}
              <FilterSection title="数据分层" Icon={BarChart3}>
                <div className="space-y-1.5">
                  {layers.map((l) => (
                    <FilterCheckbox
                      key={l} label={l}
                      checked={selectedLayers.includes(l)}
                      onChange={() => toggleFilter(l, selectedLayers, setSelectedLayers)}
                      count={allAssets.filter(a => a.layer === l).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 敏感级别 */}
              <FilterSection title="敏感级别" Icon={Lock}>
                <div className="space-y-1.5">
                  {sensitivities.map((s) => (
                    <FilterCheckbox
                      key={s} label={s}
                      checked={selectedSensitivities.includes(s)}
                      onChange={() => toggleFilter(s, selectedSensitivities, setSelectedSensitivities)}
                      count={allAssets.filter(a => a.sensitivity === s).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 数据源'*/}
              <FilterSection title="数据源" Icon={Plug}>
                <div className="space-y-1.5">
                  {sources.map((s) => (
                    <FilterCheckbox
                      key={s} label={s}
                      checked={selectedSources.includes(s)}
                      onChange={() => toggleFilter(s, selectedSources, setSelectedSources)}
                      count={allAssets.filter(a => a.sourceType === s.toLowerCase()).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 标签 */}
              <FilterSection title="资产标签" Icon={Tag}>
                <div className="flex flex-wrap gap-1.5">
                  {tagOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleFilter(t, selectedTags, setSelectedTags)}
                      className={`px-2 py-1 text-[11px] rounded border transition ${
                        selectedTags.includes(t)
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>
        </div>

        {/* 右侧资产列表 */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {/* 工具'*/}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-400">
              共找到 <span className="text-white font-semibold">{filteredAssets.length}</span> 个资产
              {activeFilterCount > 0 && (
                <span className="ml-2 text-xs text-cyan-400">（已应用 {activeFilterCount} 个筛选条件）</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* 排序 */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">排序</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="updateTime">更新时间</option>
                  <option value="visitCount">访问次数</option>
                  <option value="qualityScore">质量评分</option>
                  <option value="name">资产名称</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title={sortOrder === 'asc' ? '升序' : '降序'}
                >
                  {sortOrder === 'asc' ? '' : ''}
                </button>
              </div>

              {/* 视图切换 */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 text-xs rounded transition ${
                    viewMode === 'card' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  卡片
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs rounded transition ${
                    viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  列表
                </button>
              </div>
            </div>
          </div>

          {/* 资产列表 - 卡片视图 */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {paginatedAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="group rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5"
                >
                  {/* 头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br ${layerColors[asset.layer]} border text-base font-bold flex-shrink-0`}>
                        {asset.layer}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition">
                            {asset.name}
                          </h3>
                          {asset.certified && (
                            <span className="text-emerald-400 text-xs flex-shrink-0" title="已认证">✅</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{asset.cnName}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-500 hover:text-amber-400 transition opacity-0 group-hover:opacity-100"
                    >
                      {asset.favorite ? '' : ''}
                    </button>
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">{asset.description}</p>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`px-2 py-0.5 text-[10px] rounded border ${sensitivityColors[asset.sensitivity]}`}>
                      {asset.sensitivity}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-white/5 text-slate-400 border border-white/10">
                      {asset.domain}
                    </span>
                    {asset.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* 元数'*/}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div>
                      <div className="text-[10px] text-slate-500">数据量</div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">{(asset.rowCount / 10000).toFixed(0)} 万</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">字段</div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">{asset.fieldCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">质量</div>
                      <div className={`text-xs font-medium mt-0.5 ${
                        asset.qualityScore >= 95 ? 'text-emerald-400' :
                        asset.qualityScore >= 90 ? 'text-cyan-400' :
                        asset.qualityScore >= 85 ? 'text-amber-400' : 'text-red-400'
                      }`}>{asset.qualityScore}</div>
                    </div>
                  </div>

                  {/* 底部 */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                        {asset.ownerAvatar}
                      </div>
                      <span className="text-xs text-slate-400">{asset.owner}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{asset.visitCount.toLocaleString()}</span>
                      {(() => {
                        const SourceIcon = sourceIcons[asset.sourceType] ?? Database;
                        return <SourceIcon className="h-3.5 w-3.5 text-slate-500" />;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 资产列表 - 表格视图 */}
          {viewMode === 'table' && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl overflow-x-auto">
              <table className="min-w-[920px] w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-[200px]">资产名称</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-[80px]">分层</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-[100px]">业务域</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-[80px]">敏感级别</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-[80px]">负责人</th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3 w-[80px]">数据量</th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3 w-[60px]">质量</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 w-[120px]">更新时间</th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3 w-[80px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const SourceIcon = sourceIcons[asset.sourceType] ?? Database;
                            return <SourceIcon className="h-4 w-4 text-slate-400" />;
                          })()}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-white font-medium group-hover:text-cyan-300 transition">{asset.name}</span>
                              {asset.certified && <span className="text-emerald-400 text-xs">✓</span>}
                            </div>
                            <div className="text-xs text-slate-500">{asset.cnName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded border bg-gradient-to-br ${layerColors[asset.layer]}`}>
                          {asset.layer}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{asset.domain}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded border ${sensitivityColors[asset.sensitivity]}`}>
                          {asset.sensitivity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                            {asset.ownerAvatar}
                          </div>
                          <span className="text-xs text-slate-300">{asset.owner}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-300">{(asset.rowCount / 10000).toFixed(0)} 万</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold ${
                          asset.qualityScore >= 95 ? 'text-emerald-400' :
                          asset.qualityScore >= 90 ? 'text-cyan-400' :
                          asset.qualityScore >= 85 ? 'text-amber-400' : 'text-red-400'
                        }`}>{asset.qualityScore}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{asset.updateTime}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={(e) => e.stopPropagation()} className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10">详情</button>
                          <button onClick={(e) => e.stopPropagation()} className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10">血缘</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 空状态'*/}
          {filteredAssets.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl p-16 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-slate-600" />
              <h3 className="text-lg text-white font-semibold mb-2">未找到匹配的资产</h3>
              <p className="text-sm text-slate-400 mb-4">尝试调整筛选条件或搜索关键词</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition"
              >
                清空所有筛选
              </button>
            </div>
          )}

          {/* 分页 */}
          {filteredAssets.length > 0 && totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <div className="text-xs text-slate-400">
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAssets.length)} 条，共 {filteredAssets.length} 条
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  上一步
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`min-w-[32px] px-2 py-1.5 text-xs rounded-lg border transition ${
                      currentPage === i + 1
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  下一步
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 资产详情侧边抽屉 */}
      {selectedAsset && (
        <AssetDetailDrawer
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          layerColors={layerColors}
          sensitivityColors={sensitivityColors}
          sourceIcons={sourceIcons}
        />
      )}
    </div>
  );
}

function FilterSection({ title, Icon, children }: { title: string; Icon: LucideIcon; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-white/5 pb-4 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-xs font-medium text-slate-300 mb-2.5 hover:text-white transition">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          <span>{title}</span>
        </span>
        <span className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count: number }) {
  return (
    <label className="flex items-center justify-between py-1 px-2 rounded hover:bg-white/5 cursor-pointer transition group">
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
          checked ? 'bg-cyan-500 border-cyan-500' : 'border-white/20 group-hover:border-white/40'
        }`}>
          {checked && <span className="text-[10px] text-white">✓</span>}
        </div>
        <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
        <span className={`text-xs transition ${checked ? 'text-cyan-300' : 'text-slate-400 group-hover:text-white'}`}>{label}</span>
      </div>
      <span className="text-[10px] text-slate-500">{count}</span>
    </label>
  );
}

function AssetDetailDrawer({
  asset, onClose, layerColors, sensitivityColors, sourceIcons,
}: {
  asset: Asset;
  onClose: () => void;
  layerColors: Record<string, string>;
  sensitivityColors: Record<string, string>;
  sourceIcons: Record<string, LucideIcon>;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'lineage' | 'quality'>('overview');

  const fields = [
    { name: 'order_id', type: 'BIGINT', comment: '订单ID', isPrimary: true, isSensitive: false },
    { name: 'user_id', type: 'BIGINT', comment: '用户ID', isPrimary: false, isSensitive: true },
    { name: 'product_id', type: 'BIGINT', comment: '商品ID', isPrimary: false, isSensitive: false },
    { name: 'order_amount', type: 'DECIMAL(10,2)', comment: '订单金额', isPrimary: false, isSensitive: false },
    { name: 'pay_status', type: 'VARCHAR(20)', comment: '支付状态', isPrimary: false, isSensitive: false },
    { name: 'phone', type: 'VARCHAR(20)', comment: '手机', isPrimary: false, isSensitive: true },
    { name: 'address', type: 'VARCHAR(500)', comment: '收货地址', isPrimary: false, isSensitive: true },
    { name: 'create_time', type: 'TIMESTAMP', comment: '创建时间', isPrimary: false, isSensitive: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 背景遮罩 */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 抽屉主体 */}
      <div className="w-full max-w-[640px] bg-slate-950 border-l border-white/10 overflow-y-auto custom-scrollbar shadow-2xl">
        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${layerColors[asset.layer]} border text-base font-bold`}>
                  {asset.layer}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{asset.name}</h2>
                    {asset.certified && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        已认证
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{asset.cnName}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                    {(() => {
                      const SourceIcon = sourceIcons[asset.sourceType] ?? Database;
                      return <SourceIcon className="h-3.5 w-3.5" />;
                    })()}
                    <span>{asset.source}</span>
                    <span>·</span>
                    <span>{asset.database}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0" aria-label="关闭详情">
                ×
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className="flex-1 px-4 py-2 text-xs rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition">
                申请权限
              </button>
              <button className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition">
                收藏
              </button>
              <button className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition">
                <span className="inline-flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" />复制</span>
              </button>
              <button className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition">
                分享
              </button>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="flex items-center gap-1 px-6 border-t border-white/5">
            {[
              { id: 'overview', label: '概览' },
              { id: 'schema', label: '字段信息' },
              { id: 'lineage', label: '血缘关系' },
              { id: 'quality', label: '质量监控' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-xs font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'text-cyan-300 border-cyan-500'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容'*/}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* 描述 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">资产描述</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{asset.description}</p>
              </div>

              {/* 关键指标 */}
              <div className="grid grid-cols-4 gap-3">
                <MetricCard label="数据量" value={`${(asset.rowCount / 10000).toFixed(0)}万`} sub="条" color="cyan" />
                <MetricCard label="存储大小" value={asset.size} sub="" color="blue" />
                <MetricCard label="字段数" value={asset.fieldCount.toString()} sub="个" color="purple" />
                <MetricCard label="质量分" value={asset.qualityScore.toString()} sub="/100" color="emerald" />
              </div>

              {/* 基本信息 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-3">基本信息</h4>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/5">
                  <InfoRow label="业务" value={asset.domain} />
                  <InfoRow label="数据分层">
                    <span className={`px-2 py-0.5 text-[10px] rounded border bg-gradient-to-br ${layerColors[asset.layer]}`}>{asset.layer}</span>
                  </InfoRow>
                  <InfoRow label="敏感级别">
                    <span className={`px-2 py-0.5 text-[10px] rounded border ${sensitivityColors[asset.sensitivity]}`}>{asset.sensitivity}</span>
                  </InfoRow>
                  <InfoRow label="负责人">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">{asset.ownerAvatar}</div>
                      <span>{asset.owner}</span>
                    </div>
                  </InfoRow>
                  <InfoRow label="所属部门" value={asset.department} />
                  <InfoRow label="访问次数" value={asset.visitCount.toLocaleString()} />
                  <InfoRow label="更新时间" value={asset.updateTime} />
                </div>
              </div>

              {/* 标签 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">资产标签</h4>
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 text-xs rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-300">字段信息（共 {fields.length} 个）</h4>
                <button className="text-xs text-cyan-400 hover:text-cyan-300">导出 DDL</button>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.03]">
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">字段</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">类型</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">注释</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">标识</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => (
                      <tr key={f.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition">
                        <td className="px-3 py-2.5 text-white font-mono text-xs">{f.name}</td>
                        <td className="px-3 py-2.5 text-cyan-400 font-mono text-xs">{f.type}</td>
                        <td className="px-3 py-2.5 text-slate-400">{f.comment}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {f.isPrimary && <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">主键</span>}
                            {f.isSensitive && <span className="px-1.5 py-0.5 text-[9px] rounded bg-red-500/15 text-red-300 border border-red-500/30">敏感</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lineage' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300">血缘关系</h4>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-6">
                {/* 简化的血缘示意图 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* 上游 */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">上游 (3)</div>
                    {['ods_user_info', 'ods_order_raw', 'dim_product'].map((u) => (
                      <div key={u} className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-mono">
                        {u}
                      </div>
                    ))}
                  </div>

                  {/* 当前 */}
                  <div className="flex justify-center">
                    <div className="px-3 py-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/40 text-xs text-cyan-300 font-mono text-center">
                      <div className="text-[9px] text-cyan-400 mb-1">当前</div>
                      {asset.name}
                    </div>
                  </div>

                  {/* 下游 */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">下游 (2)</div>
                    {['dws_user_daily', 'ads_sales_report'].map((d) => (
                      <div key={d} className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono">
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full mt-6 px-4 py-2 text-xs rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition">
                  查看完整血缘图
                </button>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300">质量监控</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: '完整', score: 98, color: 'emerald' },
                  { name: '准确', score: 96, color: 'cyan' },
                  { name: '一致', score: 94, color: 'blue' },
                  { name: '及时', score: 99, color: 'purple' },
                  { name: '唯一', score: 100, color: 'pink' },
                  { name: '有效', score: 92, color: 'amber' },
                ].map((q) => (
                  <div key={q.name} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">{q.name}</span>
                      <span className={`text-sm font-bold text-${q.color}-400`}>{q.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r from-${q.color}-500 to-${q.color}-400`} style={{ width: `${q.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-sm font-semibold text-white">最近质量检查通过</span>
                </div>
                <div className="text-xs text-slate-400">最后检查时间：2024-01-15 06:30:00</div>
                <div className="text-xs text-slate-400 mt-1">已配置 12 条质量规则，运行正常</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/15 to-cyan-600/5 border-cyan-500/20 text-cyan-300',
    blue: 'from-blue-500/15 to-blue-600/5 border-blue-500/20 text-blue-300',
    purple: 'from-purple-500/15 to-purple-600/5 border-purple-500/20 text-purple-300',
    emerald: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/20 text-emerald-300',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorMap[color]} border p-3`}>
      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold">{value}</span>
        {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200">{children || value}</span>
    </div>
  );
}
