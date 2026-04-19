import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';
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

const AssetOverview: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [domainFilter, setDomainFilter] = useState('all');

  const [coreMetrics, setCoreMetrics] = useState<any[]>([]);
  const [layerDistribution, setLayerDistribution] = useState<any[]>([]);
  const [businessDomains, setBusinessDomains] = useState<any[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [growthTrend, setGrowthTrend] = useState<any[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);
  const [hotAssets, setHotAssets] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-slate-400 p-8 flex items-center justify-center">Loading asset overview data...</div>;
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'database':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        );
      case 'server':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12H3l9-9 9 9h-2M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7M9 21V12h6v9" />
          </svg>
        );
      case 'link':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        );
      case 'shield':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题'*/}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: '数据资产' }, { label: '资产总览' }]} />
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            资产总览
            <span className="px-2 py-0.5 text-xs font-normal bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
              实时更新
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">全方位掌握企业数据资产分布、健康度与使用情'</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/60 rounded-lg">
            {[
              { key: '7d', label: '7' },
              { key: '30d', label: '30' },
              { key: '90d', label: '90' },
              { key: '1y', label: '1' },
            ].map(item => (
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
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出报表
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg transition-all shadow-lg shadow-cyan-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            注册资产
          </button>
        </div>
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
                  {renderIcon(metric.iconType)}
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
        <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
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
                趋势'              </span>
            </div>
          </div>

          <div className="relative h-64">
            {/* Y轴参考线 */}
            <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-600">
              {[100, 75, 50, 25, 0].map(p => (
                <div key={p} className="flex items-center gap-2">
                  <span className="w-10 text-right">{Math.round((maxGrowth * p) / 100 / 1000)}k</span>
                  <div className="flex-1 border-t border-slate-700/30 border-dashed" />
                </div>
              ))}
            </div>

            {/* 柱状态'*/}
            <div className="absolute inset-0 pl-12 flex items-end justify-between gap-2">
              {growthTrend.map((item, i) => {
                const height = (item.value / maxGrowth) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                    <div className="w-full relative" style={{ height: '220px' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600/80 to-blue-400/80 rounded-t hover:from-cyan-500 hover:to-blue-300 transition-all cursor-pointer"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                          {item.value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{item.month}</span>
                  </div>
                );
              })}
            </div>

            {/* 趋势'(SVG overlay) */}
            <svg className="absolute inset-0 pl-12 pointer-events-none" style={{ height: '220px' }}>
              <polyline
                fill="none"
                stroke="url(#trendGradient)"
                strokeWidth="2"
                strokeDasharray="4 4"
                points={growthTrend.map((item, i) => {
                  const x = (i / (growthTrend.length - 1)) * 100;
                  const y = 100 - (item.value / maxGrowth) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
              />
              <defs>
                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
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
              <h3 className="text-base font-semibold text-white">业务域分</h3>
            </div>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="px-3 py-1 text-xs text-slate-300 bg-slate-800/60 border border-slate-700/60 rounded focus:outline-none focus:border-emerald-500"
            >
              <option value="all">全部'</option>
              <option value="active">活跃'</option>
            </select>
          </div>

          <div className="space-y-3">
            {businessDomains.map((domain, i) => (
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
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">90.5</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 数据源接'*/}
        <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-indigo-600 rounded" />
              <h3 className="text-base font-semibold text-white">数据源接入情</h3>
              <span className="text-xs text-slate-500">'{dataSources.length} '</span>
            </div>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              管理数据源'              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dataSources.map((source, i) => (
              <div key={i} className="relative p-4 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600 rounded-lg transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${source.color} flex items-center justify-center text-lg shadow-lg`}>
                    {source.icon}
                  </div>
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded ${
                    source.status === 'healthy'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      source.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                    } animate-pulse`} />
                    {source.status === 'healthy' ? '正常' : '告警'}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">{source.name}</div>
                <div className="text-xs text-slate-500 mb-3">{source.type}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">实例 <span className="text-white font-medium">{source.count}</span></span>
                  <span className="text-slate-400">'<span className="text-white font-medium">{source.tables.toLocaleString()}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 待处理事'*/}
        <div className="p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-rose-400 to-pink-600 rounded" />
              <h3 className="text-base font-semibold text-white">待处理事</h3>
            </div>
            <span className="px-2 py-0.5 text-xs bg-rose-500/10 text-rose-400 rounded-full">
              {pendingItems.reduce((sum, i) => sum + i.count, 0)} '            </span>
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
              return (
                <div key={i} className={`flex items-center justify-between p-4 bg-gradient-to-r ${colorClasses[item.color]} border rounded-lg transition-all cursor-pointer group`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-sm text-white">{item.type}</div>
                      <div className="text-xs text-slate-400 mt-0.5">点击查看详情</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${textColor[item.color]}`}>{item.count}</span>
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 热门资产排行 */}
      <div className="p-6 bg-slate-900/40 border border-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-yellow-400 to-orange-600 rounded" />
            <h3 className="text-base font-semibold text-white">热门资产排行</h3>
            <span className="text-xs text-slate-500">最'30 天访问量</span>
          </div>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            查看完整排行
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                <th className="text-left py-3 px-2 font-medium w-16">排名</th>
                <th className="text-left py-3 px-2 font-medium">资产名称</th>
                <th className="text-left py-3 px-2 font-medium">分层</th>
                <th className="text-left py-3 px-2 font-medium">业务'</th>
                <th className="text-left py-3 px-2 font-medium">负责人'</th>
                <th className="text-right py-3 px-2 font-medium">访问次数</th>
                <th className="text-right py-3 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {hotAssets.map((asset) => (
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
                      <button className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors" title="查看详情">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded transition-colors" title="血缘分">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-700/50 rounded transition-colors" title="收藏">
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
