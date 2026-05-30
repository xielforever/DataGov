import React, { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowRight, ClipboardList, Clock3, Database, FileText, KeyRound, Link2, MessageSquare, Search, Server, Table2, TrendingUp, User, Zap, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';
import { navigateTo } from '../../utils/navigation';
interface CoreMetric { label: string; value: string; change: string; icon: string; }
interface LayerDist { layer: string; count: number; color: string; }
interface BusinessDomain { name: string; count: number; color: string; }
interface DataSource { name: string; type: string; count: number; }
interface GrowthPoint { date: string; tables: number; fields: number; }
interface HealthMetric { label: string; value: number; color: string; }
interface HotAsset { name: string; domain: string; visits: number; quality: number; }
interface PendingItem { type: string; title: string; count: number; view: string; }

import {
  fetchAssetCoreMetrics,
  fetchAssetLayerDistribution,
  fetchAssetBusinessDomains,
  fetchAssetDataSources,
  fetchAssetGrowthTrend,
  fetchAssetHealthMetrics,
  fetchAssetHotAssets,
  fetchAssetPendingItems
} from '../../services/api';
import ErrorFallback from '../../components/common/ErrorFallback';
import { StatsSkeleton } from '../../components/common/Skeleton';

const AssetOverview: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const [coreMetrics, setCoreMetrics] = useState<CoreMetric[]>([]);
  const [layerDistribution, setLayerDistribution] = useState<LayerDist[]>([]);
  const [businessDomains, setBusinessDomains] = useState<BusinessDomain[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [growthTrend, setGrowthTrend] = useState<GrowthPoint[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [hotAssets, setHotAssets] = useState<HotAsset[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const timeRangeOptions = [
    { key: '7d', label: '7天' },
    { key: '30d', label: '30天' },
    { key: '90d', label: '90天' },
    { key: '1y', label: '1年' },
  ];

  const sourceIconMap: Record<string, LucideIcon> = {
    MySQL: Database,
    Hive: Server,
    PostgreSQL: Database,
    Kafka: MessageSquare,
    ClickHouse: Table2,
    MongoDB: Database,
    Redis: Zap,
    Oracle: Database,
    Elasticsearch: Search,
    Doris: Table2,
  };

  const pendingIconMap: Record<string, LucideIcon> = {
    amber: ClipboardList,
    cyan: KeyRound,
    rose: FileText,
    purple: User,
  };

  const metricIconMap: Record<string, LucideIcon> = {
    database: Database,
    server: Server,
    link: Link2,
    shield: Shield,
  };

  const topBusinessDomains = businessDomains.slice(0, 5);

  const avgHealth = healthMetrics.length
    ? Math.round(healthMetrics.reduce((sum, metric) => sum + metric.value, 0) / healthMetrics.length)
    : 0;

  const sourceHealthSummary = dataSources.reduce(
    (acc, source) => {
      if (source.status === 'healthy') acc.healthy += 1;
      else acc.warning += 1;
      return acc;
    },
    { healthy: 0, warning: 0 },
  );

  const unhealthyDataSources = dataSources.filter((source) => source.status !== 'healthy');

  const overviewInsights = [
    {
      Icon: TrendingUp,
      title: '资产覆盖保持增长',
      desc: `${coreMetrics[0]?.change || '较上周期持续增长'}，核心资产继续向治理平台集中。`,
      accent: 'from-cyan-500/20 to-blue-500/5',
    },
    {
      Icon: AlertTriangle,
      title: '接入风险需要跟进',
      desc: `当前有 ${sourceHealthSummary.warning} 个数据源存在告警或异常，优先处理高频链路。`,
      accent: 'from-amber-500/20 to-orange-500/5',
    },
    {
      Icon: Clock3,
      title: '待办任务仍然偏多',
      desc: `共 ${pendingItems.reduce((sum, item) => sum + item.count, 0)} 项待处理事项，建议按优先级收敛。`,
      accent: 'from-rose-500/20 to-pink-500/5',
    },
  ];

  // navigateTo imported from utils/navigation

  const navigateToAsset = (view: string, assetName: string) => {
    const param = view === 'data-lineage' ? 'center' : 'asset';
    navigateTo(view, { [param]: assetName });
  };

  const handlePendingClick = (type: string) => {
    const targetMap: Record<string, string> = {
      待审: 'approvals-todos',
      待认: 'data-catalog',
      待补充元数据: 'metadata-manage',
      待分配负责人: 'business-domain',
    };
    navigateTo(targetMap[type] || 'data-catalog');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          metrics, layer, domains, sources,
          growth, health, hot, pending
        ] = await Promise.all([
          fetchAssetCoreMetrics(),
          fetchAssetLayerDistribution(),
          fetchAssetBusinessDomains(),
          fetchAssetDataSources(),
          fetchAssetGrowthTrend(),
          fetchAssetHealthMetrics(),
          fetchAssetHotAssets(),
          fetchAssetPendingItems()
        ]);
        setCoreMetrics(metrics);
        setLayerDistribution(layer);
        setBusinessDomains(domains);
        setDataSources(sources);
        setGrowthTrend(growth);
        setHealthMetrics(health);
        setHotAssets(hot);
        setPendingItems(pending);
      } catch (error) {
        setError(true);
        console.error('Failed to load asset overview data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const layerColorMap: Record<string, string> = {
    ODS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    DWD: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    DWS: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ADS: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    DIM: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  const maxGrowth = growthTrend.length > 0 ? Math.max(...growthTrend.map(g => g.value)) : 10000;
  const trendPoints = growthTrend.map((item, index) => {
    const x = growthTrend.length > 1 ? (index / (growthTrend.length - 1)) * 100 : 50;
    const y = 100 - (item.value / maxGrowth) * 100;
    return { x, y };
  });
  const trendPointString = trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const trendAreaPoints = trendPoints.length ? `0,100 ${trendPointString} 100,100` : '';

  if (error) {
    return <ErrorFallback onRetry={loadData} />;
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题'*/}
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <Breadcrumb items={[{ label: '数据资产' }, { label: '资产总览' }]} />
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-white sm:gap-3">
            资产总览
            <span className="whitespace-nowrap px-2 py-0.5 text-xs font-normal bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
              实时更新
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">全方位掌握企业数据资产分布、健康度与使用情况</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/60 rounded-lg">
            {timeRangeOptions.map((item) => (
              <button
                key={item.key}
                onClick={() => setTimeRange(item.key)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  timeRange === item.key
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => toast.success('资产总览报表导出任务已提交')}
            className="flex min-w-0 items-center gap-2 px-3 py-2 text-sm text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="whitespace-nowrap">导出报表</span>
          </button>
          <button
            onClick={() => navigateTo('asset-register')}
            className="flex min-w-0 items-center gap-2 px-3 py-2 text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg transition-all shadow-lg shadow-cyan-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="whitespace-nowrap">注册资产</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {overviewInsights.map((insight) => (
          <div
            key={insight.title}
            className={`rounded-xl border border-white/10 bg-gradient-to-br ${insight.accent} p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-cyan-300">
                <insight.Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{insight.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-300">{insight.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {coreMetrics.map((metric, index) => (
          <div
            key={index}
            className={`relative overflow-hidden p-5 rounded-xl bg-gradient-to-br ${metric.bgGradient} border border-slate-700/50 hover:border-slate-600 transition-all hover:scale-[1.02] group`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full blur-2xl"
                 style={{ background: 'radial-gradient(circle, white, transparent)' }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${metric.gradient} text-white shadow-lg`}>
                  {(() => {
                    const MetricIcon = metricIconMap[metric.iconType] ?? Database;
                    return <MetricIcon className="w-6 h-6" />;
                  })()}
                </div>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  metric.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={metric.trend === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                  </svg>
                  {metric.changeRate}
                </span>
              </div>
              <div className="text-sm text-slate-400 mb-1">{metric.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">{metric.value}</span>
                <span className="text-sm text-slate-400">{metric.unit}</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">较上周期 <span className="text-slate-300">{metric.change}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* 资产分层分布 + 资产增长趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 资产分层分布 */}
        <div className="lg:col-span-1 p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded" />
              <h3 className="text-base font-semibold text-white">数据分层分布</h3>
            </div>
            <span className="text-xs text-slate-500">数仓架构</span>
          </div>

          {/* 圆环'(使用 SVG) */}
          <div className="relative flex items-center justify-center mb-5">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              {(() => {
                let cumulative = 0;
                const radius = 40;
                const circumference = 2 * Math.PI * radius;
                return layerDistribution.map((layer, i) => {
                  const dash = (layer.percent / 100) * circumference;
                  const offset = -cumulative;
                  cumulative += dash;
                  const colors = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#f43f5e'];
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={colors[i]}
                      strokeWidth="14"
                      strokeDasharray={`${dash} ${circumference}`}
                      strokeDashoffset={offset}
                      className="transition-all hover:opacity-80"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">12,684</div>
              <div className="text-xs text-slate-400 mt-1">总资产数</div>
            </div>
          </div>

          {/* 图例列表 */}
          <div className="space-y-2.5">
            {layerDistribution.map((layer) => (
              <div key={layer.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${layer.color}`} />
                  <span className={`text-xs font-mono font-bold ${layer.textColor}`}>{layer.name}</span>
                  <span className="text-xs text-slate-400">{layer.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{layer.count.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 w-10 text-right">{layer.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 资产增长趋势 */}
        <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl flex flex-col overflow-hidden relative">
          <div className="pointer-events-none absolute inset-x-8 top-16 h-28 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-400 to-pink-600 rounded" />
              <h3 className="text-base font-semibold text-white">资产增长趋势</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 rounded bg-gradient-to-r from-cyan-500 to-blue-500" />
                资产数量
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 bg-purple-400" />
                趋势
              </span>
            </div>
          </div>

          <div className="relative min-h-[280px] flex-1 rounded-xl border border-slate-700/40 bg-slate-950/30 p-4">
            {/* Y轴参考线 */}
            <div className="absolute inset-x-4 top-4 bottom-9 flex flex-col justify-between text-xs text-slate-600">
              {[100, 75, 50, 25, 0].map(p => (
                <div key={p} className="flex items-center gap-2">
                  <span className="w-10 text-right tabular-nums">{Math.round((maxGrowth * p) / 100 / 1000)}k</span>
                  <div className="flex-1 border-t border-slate-700/25 border-dashed" />
                </div>
              ))}
            </div>

                            {/* 柱状态 */}
            <div className="absolute inset-x-4 top-4 bottom-4 pl-12 flex items-end justify-between gap-3">
              {growthTrend.map((item, i) => {
                const height = (item.value / maxGrowth) * 100;
                const isLatest = i === growthTrend.length - 1;
                return (
                  <div key={i} className="flex-1 h-full flex flex-col items-center gap-2 group/bar">
                    <div className="w-full max-w-12 relative flex-1 rounded-t-full bg-slate-800/25">
                      <div
                        className={`absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-full border border-cyan-300/20 bg-gradient-to-t shadow-lg transition-all duration-300 cursor-pointer ${
                          isLatest
                            ? 'from-cyan-500 via-blue-400 to-sky-200 shadow-cyan-500/30'
                            : 'from-cyan-700/80 via-blue-500/80 to-sky-300/80 shadow-cyan-700/10 group-hover/bar:from-cyan-500 group-hover/bar:to-sky-200'
                        }`}
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute inset-x-1 top-0 h-1/3 rounded-full bg-white/20 blur-sm" />
                        <div className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-950/30 to-transparent" />
                      </div>
                      <div className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 rounded-md border border-cyan-400/20 bg-slate-950/95 px-2 py-1 text-xs text-cyan-100 opacity-0 shadow-xl shadow-cyan-950/40 transition-opacity group-hover/bar:opacity-100 whitespace-nowrap">
                        {item.value.toLocaleString()}
                      </div>
                    </div>
                    <span className={`text-xs tabular-nums ${isLatest ? 'text-cyan-300' : 'text-slate-500'}`}>{item.month}</span>
                  </div>
                );
              })}
            </div>

            {/* 趋势'(SVG overlay) */}
            <svg
              className="absolute left-16 right-4 top-4 pointer-events-none"
              style={{ height: 'calc(100% - 52px)', width: 'calc(100% - 80px)' }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {trendAreaPoints && (
                <polygon
                  points={trendAreaPoints}
                  fill="url(#trendAreaGradient)"
                  opacity="0.55"
                />
              )}
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.12"
                points={trendPointString}
              />
              <polyline
                fill="none"
                stroke="url(#trendGradient)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trendPointString}
              />
              {trendPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={index === trendPoints.length - 1 ? 2.2 : 1.4}
                  fill={index === trendPoints.length - 1 ? '#67e8f9' : '#c084fc'}
                  stroke="#020617"
                  strokeWidth="0.9"
                />
              ))}
              <defs>
                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="45%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="trendAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* 业务域分'+ 健康度雷'*/}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 业务域分'*/}
        <div className="p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-teal-600 rounded" />
              <div>
                <h3 className="text-base font-semibold text-white">业务域分布</h3>
                <p className="text-xs text-slate-500 mt-0.5">展示 Top 5 业务域概览</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">Top 5</span>
          </div>

          <div className="space-y-3">
            {topBusinessDomains.map((domain, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{domain.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">{domain.growth}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-white font-medium">{domain.count.toLocaleString()}</span>
                    <span className="text-slate-500 w-12 text-right">{domain.percent}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${domain.color} rounded-full transition-all duration-1000 group-hover:opacity-80 relative overflow-hidden`}
                    style={{ width: `${domain.percent * 3}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 资产健康'*/}
        <div className="p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-600 rounded" />
              <h3 className="text-base font-semibold text-white">资产健康</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">综合评分</span>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{avgHealth || 90.5}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {healthMetrics.map((metric, i) => {
              const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
                cyan: { bg: 'from-cyan-500 to-blue-500', text: 'text-cyan-400', ring: 'stroke-cyan-500' },
                emerald: { bg: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', ring: 'stroke-emerald-500' },
                purple: { bg: 'from-purple-500 to-pink-500', text: 'text-purple-400', ring: 'stroke-purple-500' },
                amber: { bg: 'from-amber-500 to-orange-500', text: 'text-amber-400', ring: 'stroke-amber-500' },
                rose: { bg: 'from-rose-500 to-red-500', text: 'text-rose-400', ring: 'stroke-rose-500' },
                blue: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-400', ring: 'stroke-blue-500' },
              };
              const c = colorClasses[metric.color];
              const circumference = 2 * Math.PI * 28;
              const offset = circumference - (metric.value / 100) * circumference;
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 hover:bg-slate-800/60 rounded-lg transition-colors">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgb(51 65 85)" strokeWidth="4" />
                      <circle
                        cx="32" cy="32" r="28" fill="none"
                        className={c.ring}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${c.text}`}>
                      {metric.value}%
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{metric.label}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {metric.value >= 90 ? '优秀' : metric.value >= 80 ? '良好' : '待改'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 数据源接入情'+ 待处理事'*/}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
        {/* 数据源接'*/}
        <div className="p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-indigo-600 rounded" />
              <h3 className="text-base font-semibold text-white">数据源接入情况</h3>
              <span className="text-xs text-slate-500">{dataSources.length} 个</span>
            </div>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              管理数据源
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {Object.values(
              dataSources.reduce((acc: Record<string, { name: string; count: number; tables: number; status: string; Icon: LucideIcon }>, source) => {
                const existing = acc[source.type] ?? { name: source.type, count: 0, tables: 0, status: 'healthy', Icon: sourceIconMap[source.name] ?? Database };
                acc[source.type] = {
                  name: source.type,
                  count: existing.count + 1,
                  tables: existing.tables + source.tables,
                  status: existing.status === 'warning' || source.status !== 'healthy' ? 'warning' : 'healthy',
                  Icon: existing.Icon,
                };
                return acc;
              }, {}),
            ).slice(0, 4).map((type) => (
              <div key={type.name} className="rounded-lg border border-white/10 bg-slate-800/30 p-3">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-slate-950/50 p-2 text-cyan-300 border border-white/10">
                    <type.Icon className="h-4 w-4" />
                  </div>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                    type.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {type.status === 'healthy' ? '正常' : '告警'}
                  </span>
                </div>
                <div className="mt-3 text-sm font-medium text-white">{type.name}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{type.count} 个</span>
                  <span>{type.tables.toLocaleString()} 表</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {unhealthyDataSources.slice(0, 4).map((source, index) => (
              <div key={index} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{source.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{source.type}</div>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">告警</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>实例 {source.count}</span>
                  <span>表 {source.tables.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {unhealthyDataSources.length === 0 && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
                当前没有异常数据源
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 待处理事'*/}
          <div className="p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-rose-400 to-pink-600 rounded" />
                <h3 className="text-base font-semibold text-white">待处理事项</h3>
              </div>
              <span className="px-2 py-0.5 text-xs bg-rose-500/10 text-rose-400 rounded-full">
                {pendingItems.reduce((sum, i) => sum + i.count, 0)} 项
              </span>
            </div>

            <div className="space-y-3">
              {pendingItems.map((item, i) => {
                const colorClasses: Record<string, string> = {
                  amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40',
                  cyan: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20 hover:border-cyan-500/40',
                  rose: 'from-rose-500/20 to-pink-500/10 border-rose-500/20 hover:border-rose-500/40',
                  purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40',
                };
                const textColor: Record<string, string> = {
                  amber: 'text-amber-400',
                  cyan: 'text-cyan-400',
                  rose: 'text-rose-400',
                  purple: 'text-purple-400',
                };
                const PendingIcon = pendingIconMap[item.color] ?? ClipboardList;
                return (
                  <div
                    key={i}
                    onClick={() => handlePendingClick(item.type)}
                    className={`flex items-center justify-between p-4 bg-gradient-to-r ${colorClasses[item.color]} border rounded-lg transition-all cursor-pointer group`}
                  >
                    <div className="flex items-center gap-3">
                      <PendingIcon className={`h-5 w-5 ${textColor[item.color]}`} />
                      <div>
                        <div className="text-sm text-white">{item.type}</div>
                        <div className="text-xs text-slate-400 mt-0.5">点击查看详情</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${textColor[item.color]}`}>{item.count}</span>
                      <ArrowRight className="h-4 w-4 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-cyan-300">接入治理结论</div>
                <div className="mt-1 text-xs text-slate-400">
                  当前 {sourceHealthSummary.warning} 个异常接入源影响资产同步，优先关注 {unhealthyDataSources.slice(0, 2).map((source) => source.name).join('、') || '核心接入源'}。
                </div>
              </div>
              <button onClick={() => navigateTo('data-source')} className="shrink-0 rounded-lg border border-cyan-500/20 bg-slate-950/40 px-3 py-2 text-xs text-cyan-300 hover:border-cyan-400/40 hover:text-cyan-200 transition-colors">
                查看接入源
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 热门资产排行 */}
      <div className="p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-yellow-400 to-orange-600 rounded" />
            <h3 className="text-base font-semibold text-white">热门资产排行</h3>
            <span className="text-xs text-slate-500">最近 30 天访问量</span>
          </div>
          <button onClick={() => navigateTo('data-catalog')} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            查看完整排行
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full table-fixed">
            <thead>
              <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                <th className="text-left py-3 px-2 font-medium w-16">排名</th>
                <th className="text-left py-3 px-2 font-medium w-[180px]">资产名称</th>
                <th className="text-left py-3 px-2 font-medium w-[80px]">分层</th>
                <th className="text-left py-3 px-2 font-medium w-[100px]">业务域</th>
                <th className="text-left py-3 px-2 font-medium w-[90px]">负责人</th>
                <th className="text-right py-3 px-2 font-medium w-[80px]">访问次数</th>
                <th className="text-right py-3 px-2 font-medium w-[100px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {hotAssets.slice(0, 5).map((asset) => (
                <tr key={asset.rank} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3 px-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      asset.rank === 1 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30' :
                      asset.rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-lg' :
                      asset.rank === 3 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-lg' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {asset.rank}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      <span className="text-sm text-white font-mono">{asset.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold border rounded ${layerColorMap[asset.layer]}`}>
                      {asset.layer}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-slate-300">{asset.domain}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs text-white font-bold">
                        {asset.owner[0]}
                      </div>
                      <span className="text-sm text-slate-300">{asset.owner}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-white font-medium">{asset.visits.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigateToAsset('data-catalog', asset.name)} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors" title="查看详情">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => navigateToAsset('data-lineage', asset.name)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded transition-colors" title="血缘分析">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                      <button onClick={() => toast.success('已加入资产收藏')} className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-700/50 rounded transition-colors" title="收藏">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetOverview;
