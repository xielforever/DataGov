import { useEffect, useMemo, useRef, useState } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchMetadataQueryData, fetchSourceTypes } from '../../services/api';
import { Skeleton, StatsSkeleton } from '../../components/common/Skeleton';
import ErrorFallback from '../../components/common/ErrorFallback';

type QueryResultType = 'table' | 'field' | 'source' | 'model' | 'metric';
type SortKey = 'relevance' | 'updated' | 'quality' | 'name';
type DetailTab = 'overview' | 'fields' | 'relations';

type QueryStat = {
  id: string;
  label: string;
  value: string;
  detail: string;
  color: string;
  icon: string;
};

type SavedQuery = {
  id: string;
  name: string;
  keyword: string;
  description: string;
  count: number;
};

type HotKeyword = {
  id: string;
  keyword: string;
  heat: number;
};

type QueryResult = {
  id: string;
  type: QueryResultType;
  name: string;
  cnName: string;
  description: string;
  domain: string;
  layer: string;
  source: string;
  sourceType: string;
  owner: string;
  department: string;
  qualityScore: number;
  certified: boolean;
  updateTime: string;
  tags: string[];
  heat: number;
  path: string;
  fields: string[];
  standards: string[];
  relations: string[];
};

type Filters = {
  type: 'all' | QueryResultType;
  domain: string;
  layer: string;
  sourceType: string;
  updatedRange: 'all' | '24h' | '7d' | '30d';
  certifiedOnly: boolean;
};

const defaultFilters: Filters = {
  type: 'all',
  domain: '全部',
  layer: '全部',
  sourceType: '全部',
  updatedRange: 'all',
  certifiedOnly: false,
};

const typeMeta: Record<QueryResultType, { label: string; className: string; icon: string }> = {
  table: { label: '数据源', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', icon: '🗂' },
  field: { label: '字段', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', icon: '🧬' },
  source: { label: '数据源', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300', icon: '🔌' },
  model: { label: '模型', className: 'border-violet-500/30 bg-violet-500/10 text-violet-300', icon: '🧩' },
  metric: { label: '指标', className: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300', icon: '📏' },
};

const layerMeta: Record<string, string> = {
  ODS: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  DWD: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  DWS: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  ADS: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
  DIM: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  MODEL: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  SOURCE: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

const updatedOptions: Array<{ key: Filters['updatedRange']; label: string }> = [
  { key: 'all', label: '全部时间' },
  { key: '24h', label: '24小时' },
  { key: '7d', label: '7天内' },
  { key: '30d', label: '30天内' },
];

function getQualityClass(score: number) {
  if (score >= 96) return 'text-emerald-300';
  if (score >= 92) return 'text-cyan-300';
  if (score >= 88) return 'text-amber-300';
  return 'text-rose-300';
}

function getFreshnessScore(text: string) {
  if (text.includes('实时')) return 100;
  if (text.includes('刚刚')) return 99;
  if (text.includes('分钟')) return 96;
  if (text.includes('小时')) return 90;
  if (text.includes('今天')) return 88;
  if (text.includes('昨天')) return 72;
  return 50;
}

function inUpdatedRange(text: string, range: Filters['updatedRange']) {
  if (range === 'all') return true;
  const freshness = getFreshnessScore(text);
  if (range === '24h') return freshness >= 88;
  if (range === '7d') return freshness >= 72;
  if (range === '30d') return freshness >= 50;
  return true;
}

function highlightText(text: string, keyword: string) {
  const query = keyword.trim();
  if (!query) return text;
  const lower = text.toLowerCase();
  const keywordLower = query.toLowerCase();
  const index = lower.indexOf(keywordLower);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="rounded bg-amber-400/25 px-0.5 text-amber-200">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MetadataQuery() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceTypeOptions, setSourceTypeOptions] = useState<string[]>(["全部"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState<QueryStat[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [hotKeywords, setHotKeywords] = useState<HotKeyword[]>([]);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [toast, setToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);


  useEffect(() => {
    fetchSourceTypes().then((res) => setSourceTypeOptions(["全部", ...(res as string[])])).catch(() => {});
  }, []);
  useEffect(() => {
    const stored = window.localStorage.getItem('metadata-query-history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('metadata-query-history', JSON.stringify(history.slice(0, 8)));
  }, [history]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchMetadataQueryData();
      setStats(data.stats as QueryStat[]);
      setSavedQueries(data.savedQueries as SavedQuery[]);
      setHotKeywords(data.hotKeywords as HotKeyword[]);
      setResults(data.results as QueryResult[]);
      setSelectedId((data.results[0] as QueryResult | undefined)?.id || '');
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const domainOptions = useMemo(() => ['全部', ...Array.from(new Set(results.map((item) => item.domain)))], [results]);
  const layerOptions = useMemo(() => ['全部', ...Array.from(new Set(results.map((item) => item.layer)))], [results]);

  const filteredResults = useMemo(() => {
    const keyword = activeKeyword.trim().toLowerCase();
    const list = results.filter((item) => {
      const keywordMatch = !keyword || [
        item.name,
        item.cnName,
        item.description,
        item.domain,
        item.layer,
        item.source,
        item.owner,
        item.department,
        ...item.tags,
        ...item.fields,
        ...item.standards,
        ...item.relations,
      ].some((value) => value.toLowerCase().includes(keyword));

      const typeMatch = filters.type === 'all' || item.type === filters.type;
      const domainMatch = filters.domain === '全部' || item.domain === filters.domain;
      const layerMatch = filters.layer === '全部' || item.layer === filters.layer;
      const sourceTypeMatch = filters.sourceType === '全部' || item.sourceType === filters.sourceType;
      const updatedMatch = inUpdatedRange(item.updateTime, filters.updatedRange);
      const certifiedMatch = !filters.certifiedOnly || item.certified;

      return keywordMatch && typeMatch && domainMatch && layerMatch && sourceTypeMatch && updatedMatch && certifiedMatch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'quality') return b.qualityScore - a.qualityScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'updated') return getFreshnessScore(b.updateTime) - getFreshnessScore(a.updateTime);
      return b.heat - a.heat;
    });
  }, [results, activeKeyword, filters, sortBy]);

  const selectedResult = useMemo(
    () => filteredResults.find((item) => item.id === selectedId) || results.find((item) => item.id === selectedId) || null,
    [filteredResults, results, selectedId],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count += 1;
    if (filters.domain !== '全部') count += 1;
    if (filters.layer !== '全部') count += 1;
    if (filters.sourceType !== '全部') count += 1;
    if (filters.updatedRange !== 'all') count += 1;
    if (filters.certifiedOnly) count += 1;
    return count;
  }, [filters]);

  const addHistory = (keyword: string) => {
    const value = keyword.trim();
    if (!value) return;
    setHistory((prev) => [value, ...prev.filter((item) => item !== value)].slice(0, 8));
  };

  const handleSearch = async (keyword = searchInput) => {
    const value = keyword.trim();
    setSearching(true);
    setActiveKeyword(value);
    if (value) addHistory(value);
    await new Promise((resolve) => setTimeout(resolve, 280));
    setSearching(false);
  };

  const handleApplyKeyword = async (keyword: string) => {
    setSearchInput(keyword);
    await handleSearch(keyword);
  };

  const handleCopyName = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast({ type: 'success', message: `已复制：${value}` });
    } catch {
      setToast({ type: 'info', message: '当前环境不支持剪贴板复制' });
    }
  };

  const handleExport = () => {
    const lines = [
      ['类型', '英文', '中文', '业务域', '分层', '数据源', '负责人', '质量', '更新时间'].join(','),
      ...filteredResults.map((item) => [
        typeMeta[item.type].label,
        item.name,
        item.cnName,
        item.domain,
        item.layer,
        item.source,
        item.owner,
        String(item.qualityScore),
        item.updateTime,
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'metadata-query-results.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: `已导'${filteredResults.length} 条查询结果` });
  };

  const openResult = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
    setDetailTab('overview');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Breadcrumb items={[{ label: '元数据管' }, { label: '元数据查' }]} />
          <h1 className="text-2xl font-bold text-white mb-2">元数据查</h1>
          <p className="text-sm text-slate-400">
            面向表、字段、数据源、模型和指标的一站式元数据检索中心，支持全文搜索、筛选、收藏与导出'          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFilters(defaultFilters)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            重置筛'          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
          >
            导出结果
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? <StatsSkeleton count={4} />
          : stats.map((stat) => (
              <div key={stat.id} className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-400">检索能'</span>
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{stat.value}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{stat.detail}</div>
              </div>
            ))}
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              ref={searchInputRef}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch();
              }}
              placeholder="搜索表名、中文名、字段名、描述、负责人或标'.."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-4 pl-12 pr-28 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-slate-500 transition hover:text-slate-300"
              >
                清除
              </button>
            )}
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-500">
              Ctrl/'+ K
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
          >
              {searching ? '查询中...' : '查询元数据'}
            </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            {showAdvanced ? '收起高级筛' : '展开高级筛'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {['订单', '用户画像', 'ads_sales_report', '高价值资', '敏感字段', '交易域'].map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => handleApplyKeyword(keyword)}
              className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:text-white"
            >
              {keyword}
            </button>
          ))}
        </div>

        {showAdvanced && (
          <div className="mt-5 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-5 lg:grid-cols-6">
            <label className="space-y-2 text-xs text-slate-400">
              资源类型
              <select
                value={filters.type}
                onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value as Filters['type'] }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/60"
              >
                <option value="all">全部类型</option>
                <option value="table">数据源'</option>
                <option value="field">字段</option>
                <option value="source">数据源'</option>
                <option value="model">模型</option>
                <option value="metric">指标</option>
              </select>
            </label>

            <label className="space-y-2 text-xs text-slate-400">
              业务域'              <select
                value={filters.domain}
                onChange={(event) => setFilters((prev) => ({ ...prev, domain: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/60"
              >
                {domainOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs text-slate-400">
              数据分层
              <select
                value={filters.layer}
                onChange={(event) => setFilters((prev) => ({ ...prev, layer: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/60"
              >
                {layerOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs text-slate-400">
              数据源类型'              <select
                value={filters.sourceType}
                onChange={(event) => setFilters((prev) => ({ ...prev, sourceType: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/60"
              >
                {sourceTypeOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <div className="space-y-2 text-xs text-slate-400 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span>更新时间</span>
                <span className="text-[11px] text-slate-500">已'{activeFilterCount} '</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {updatedOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, updatedRange: option.key }))}
                    className={`rounded-xl px-3 py-2 text-sm transition ${
                      filters.updatedRange === option.key
                        ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                        : 'bg-slate-900 text-slate-300 ring-1 ring-slate-700 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, certifiedOnly: !prev.certifiedOnly }))}
                  className={`rounded-xl px-3 py-2 text-sm transition ${
                    filters.certifiedOnly
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900 text-slate-300 ring-1 ring-slate-700 hover:text-white'
                  }`}
                >
                  仅看已认证'                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">查询历史</h3>
                <p className="mt-1 text-xs text-slate-500">保留最'8 条检索记'</p>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-500 transition hover:text-slate-300"
                >
                  清空
                </button>
              )}
            </div>
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-5 text-center text-xs text-slate-500">
                  暂无历史查询，试试搜索订单表或敏感字'                </div>
              ) : history.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  onClick={() => handleApplyKeyword(item)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-3 text-left transition hover:border-cyan-500/30 hover:bg-slate-950"
                >
                  <div>
                    <div className="text-sm text-slate-200">{item}</div>
                    <div className="mt-1 text-[11px] text-slate-500">点击复用该检索条'</div>
                  </div>
                  <span className="text-slate-600">'</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">收藏查询</h3>
              <p className="mt-1 text-xs text-slate-500">沉淀团队常用查询模板</p>
            </div>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)
                : savedQueries.map((query) => (
                    <button
                      key={query.id}
                      type="button"
                      onClick={() => handleApplyKeyword(query.keyword)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-left transition hover:border-violet-500/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-white">{query.name}</span>
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-300">{query.count}</span>
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-500">{query.description}</div>
                    </button>
                  ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">热门搜索</h3>
              <p className="mt-1 text-xs text-slate-500">近期团队搜索热词</p>
            </div>
            <div className="space-y-2">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-10 rounded-xl" />)
                : hotKeywords.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleApplyKeyword(item.keyword)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2.5 transition hover:border-amber-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">#{index + 1}</span>
                        <span className="text-sm text-slate-200">{item.keyword}</span>
                      </div>
                      <span className="text-xs text-amber-300">{item.heat}</span>
                    </button>
                  ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  共找'<span className="text-cyan-300">{filteredResults.length}</span> 条结'                  <span className="ml-2 text-xs text-slate-500">{searching ? '检索中...' : '耗时 0.23s'}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {activeKeyword ? `当前关键词：${activeKeyword}` : '支持模糊搜索名称、描述、字段、标准与标签'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-500">排序方式</label>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortKey)}
                  className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
                >
                  <option value="relevance">相关'</option>
                  <option value="updated">更新时间</option>
                  <option value="quality">质量评分</option>
                  <option value="name">名称</option>
                </select>
              </div>
            </div>
          </div>

          {loading || searching ? (
            <ResultsSkeleton />
          ) : filteredResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center">
              <div className="text-4xl">🔍</div>
              <h3 className="mt-4 text-lg font-semibold text-white">未找到匹配结</h3>
              <p className="mt-2 text-sm text-slate-500">请尝试更换关键词，或者清空筛选条件后重新查询'</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {['dwd_order_detail', '用户画像', 'gmv', '敏感字段'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleApplyKeyword(item)}
                    className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/30 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((item) => (
                <article
                  key={item.id}
                  className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-cyan-500/30 hover:shadow-[0_24px_80px_-48px_rgba(34,211,238,0.4)]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] ${typeMeta[item.type].className}`}>
                          {typeMeta[item.type].icon} {typeMeta[item.type].label}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] ${layerMeta[item.layer] || 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                          {item.layer}
                        </span>
                        {item.certified && (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                            已认证'                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{highlightText(item.name, activeKeyword)}</h3>
                        <span className="text-sm text-slate-500">{highlightText(item.cnName, activeKeyword)}</span>
                        <span className={`text-sm font-medium ${getQualityClass(item.qualityScore)}`}>质量 {item.qualityScore}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                        {highlightText(item.description, activeKeyword)}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
                          <div className="text-[11px] text-slate-500">来源 / 归属</div>
                          <div className="mt-1 text-sm text-slate-200">{item.source}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
                            <div className="text-[11px] text-slate-500">业务域 / 负责人</div>
                            <div className="mt-1 text-sm text-slate-200">{item.domain} · {item.owner}</div>
                          </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
                          <div className="text-[11px] text-slate-500">更新时间</div>
                          <div className="mt-1 text-sm text-slate-200">{item.updateTime}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
                          <div className="text-[11px] text-slate-500">热度 / 路径</div>
                          <div className="mt-1 text-sm text-slate-200">{item.heat} · {item.path.split(' / ').at(-1)}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 xl:w-44 xl:flex-col">
                      <button
                        type="button"
                        onClick={() => openResult(item.id)}
                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:scale-[1.02]"
                      >
                        查看详情
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyName(item.name)}
                        className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
                      >
                        复制名称
                      </button>
                      <button
                        type="button"
                        onClick={() => setToast({ type: 'success', message: `已定位到'{item.path}` })}
                        className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
                      >
                        打开位置
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {drawerOpen && selectedResult && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          <button type="button" className="flex-1" onClick={() => setDrawerOpen(false)} aria-label="关闭详情抽屉" />
          <aside className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl shadow-cyan-500/10">
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${typeMeta[selectedResult.type].className}`}>
                      {typeMeta[selectedResult.type].label}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${layerMeta[selectedResult.layer] || 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                      {selectedResult.layer}
                    </span>
                    {selectedResult.certified && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">已认证'</span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">{selectedResult.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedResult.cnName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400 transition hover:text-white"
                >
                  关闭
                </button>
              </div>

              <div className="mt-5 flex gap-2">
                {[
                  { key: 'overview', label: '概览' },
                  { key: 'fields', label: '字段/标准' },
                  { key: 'relations', label: '关联关系' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDetailTab(tab.key as DetailTab)}
                    className={`rounded-xl px-4 py-2 text-sm transition ${
                      detailTab === tab.key
                        ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 ring-1 ring-slate-700 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 p-6">
              {detailTab === 'overview' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <div className="text-xs text-slate-500">质量评分</div>
                      <div className={`mt-2 text-3xl font-semibold ${getQualityClass(selectedResult.qualityScore)}`}>{selectedResult.qualityScore}</div>
                      <div className="mt-2 text-xs text-slate-500">综合规则校验 + 元数据完整度评分</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <div className="text-xs text-slate-500">搜索热度</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{selectedResult.heat}</div>
                      <div className="mt-2 text-xs text-slate-500">近7日团队搜索热度指数</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                    <h3 className="text-sm font-semibold text-white">对象说明</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{selectedResult.description}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ['业务域', selectedResult.domain],
                      ['来源', selectedResult.source],
                      ['来源类型', selectedResult.sourceType],
                      ['负责人', selectedResult.owner],
                      ['所属部门', selectedResult.department],
                      ['更新时间', selectedResult.updateTime],
                      ['归档路径', selectedResult.path],
                      ['认证状态', selectedResult.certified ? '已认证' : '待认证'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="mt-2 text-sm text-slate-200">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                    <h3 className="text-sm font-semibold text-white">标签</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedResult.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {detailTab === 'fields' && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                    <h3 className="text-sm font-semibold text-white">字段 / 关键要素</h3>
                    <div className="mt-4 space-y-2">
                      {selectedResult.fields.map((field) => (
                        <div key={field} className="rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3 text-sm text-slate-200">
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                    <h3 className="text-sm font-semibold text-white">标准与规范</h3>
                    <div className="mt-4 space-y-2">
                      {selectedResult.standards.map((item) => (
                        <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3 text-sm text-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'relations' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <h3 className="text-sm font-semibold text-white">关联关系 / 影响范围</h3>
                  <div className="mt-4 space-y-3">
                    {selectedResult.relations.map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4 text-sm text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-4 py-4 text-sm leading-6 text-slate-500">
                    如需深入查看上下游链路、字段级映射或影响分析，可前往「数据资产」进行完整分析。
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? '' : 'ℹ️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
