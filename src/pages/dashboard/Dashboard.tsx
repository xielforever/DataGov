import { useState, useEffect } from 'react';
import {
  fetchDashboardStats,
  fetchDashboardRecentTables,
  fetchDashboardQualityTrends,
  fetchDashboardTasks
} from '../../services/api';
import { StatsSkeleton, CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';
import ErrorFallback from '../../components/common/ErrorFallback';

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  
  const [stats, setStats] = useState<Array<Record<string, unknown>>>([]);
  const [recentTables, setRecentTables] = useState<Array<Record<string, unknown>>>([]);
  const [qualityTrends, setQualityTrends] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, tablesData, trendsData, tasksData] = await Promise.all([
          fetchDashboardStats(),
          fetchDashboardRecentTables(),
          fetchDashboardQualityTrends(),
          fetchDashboardTasks()
        ]);
        setStats(statsData);
        setRecentTables(tablesData);
        setQualityTrends(trendsData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const layerColors: Record<string, { bg: string; text: string; border: string }> = {
    ods: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    dwd: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    dws: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    ads: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    dim: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'running':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // 质量趋势的最大最小值用于图表计算
  const maxScore = qualityTrends.length > 0 ? Math.max(...qualityTrends.map(t => t.score)) : 100;
  const minScore = qualityTrends.length > 0 ? Math.min(...qualityTrends.map(t => t.score)) : 0;
  const chartMin = Math.floor(minScore - 2);
  const chartMax = Math.ceil(maxScore + 2);
  const chartRange = chartMax - chartMin;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <StatsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">工作</h1>
            <span className="px-2.5 py-1 text-xs bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 rounded-full border border-cyan-500/20 font-medium">
              数据治理开发平台
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1.5">欢迎回来，张三丰 · 数据治理负责人 · 上次登录 2025-01-15 09:30</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出报告
          </button>
          <button className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建任务
          </button>
        </div>
      </div>

      {/* ========== 快捷操作（移到最上面'========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: '数据表注册', icon: 'M12 4v16m8-8H4', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/8' },
          { label: '质量规则配置', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/8' },
          { label: '血缘关系分析', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/8' },
          { label: '元数据采集', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/8' },
          { label: '数据标准管理', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/8' },
          { label: '敏感数据扫描', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'from-rose-500 to-red-500', bg: 'bg-rose-500/8' },
          { label: '调度任务管理', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'from-teal-500 to-cyan-500', bg: 'bg-teal-500/8' },
          { label: '数据地图', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0020 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/8' },
        ].map((action, index) => (
          <button
            key={index}
            className={`group relative flex flex-col items-center gap-2.5 p-3 sm:p-4 ${action.bg} rounded-xl hover:bg-slate-700/40 transition-all text-center border border-slate-700/40 hover:border-slate-600/60 overflow-hidden`}
          >
            {/* hover 微光 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-[0.06] transition-opacity`} />
            <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
            </div>
            <span className="relative min-h-8 text-slate-300 text-xs font-medium leading-4 group-hover:text-white transition-colors">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl p-5 hover:border-slate-600 transition-all cursor-pointer overflow-hidden"
          >
            <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${stat.color} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity blur-2xl`} />
            <div className="relative flex items-center justify-between">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} opacity-20 absolute inset-0`} />
                <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {stat.icon === 'table' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />}
                  {stat.icon === 'metadata' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  {stat.icon === 'quality' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {stat.icon === 'task' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                {stat.trend === 'up' ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                )}
                {stat.change}
              </span>
            </div>
            <p className="relative text-2xl font-bold text-white mt-4">{stat.value}</p>
            <p className="relative text-slate-400 text-sm mt-1">{stat.label}</p>
            <p className="relative text-slate-500 text-xs mt-2">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* ========== 数据质量趋势（独占一行，全宽增强版） ========== */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl p-6 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/[0.04] via-transparent to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
              数据质量趋势
            </h3>
            <p className="text-slate-500 text-xs mt-1">全平台数据表质量评分变化趋势 · 覆盖 {stats[0]?.value || 0} 张数据表</p>
          </div>
          <div className="flex items-center gap-4">
            {/* 摘要指标 */}
            <div className="hidden lg:flex items-center gap-6 mr-4">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{qualityTrends[qualityTrends.length - 1]?.score || 0}</p>
                <p className="text-[11px] text-slate-500">当前评分</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">+8.4</p>
                <p className="text-[11px] text-slate-500">半年提升</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <p className="text-lg font-bold text-cyan-400">12</p>
                <p className="text-[11px] text-slate-500">待处理告警</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
              {[
                { key: '6months', label: '6个月' },
                { key: '12months', label: '12个月' },
                { key: 'year', label: '本年' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setTimeRange(item.key)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    timeRange === item.key
                      ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 图表区域 - 全宽展示 */}
        <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主图'- 柱状态'+ 折线'*/}
          <div className="lg:col-span-3">
            <div className="relative h-64">
              {/* Y 轴网格线 */}
              {Array.from({ length: 6 }, (_, i) => {
                const val = chartMin + (chartRange / 5) * i;
                return (
                  <div key={i} className="absolute left-10 right-0 border-t border-slate-700/30" style={{ bottom: `${(i / 5) * 100}%` }}>
                    <span className="absolute -left-10 -top-2 text-[10px] text-slate-500 w-8 text-right tabular-nums">{val.toFixed(0)}</span>
                  </div>
                );
              })}

              {/* 折线 + 柱状图叠'*/}
              <div className="absolute left-12 right-4 bottom-0 top-0 flex items-end justify-around gap-3">
                {qualityTrends.map((item, index) => {
                  const prevScore = index > 0 ? qualityTrends[index - 1].score : item.score;
                  const isUp = item.score >= prevScore;
                  const barHeight = ((item.score - chartMin) / chartRange) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative">
                      {/* 悬浮数据卡片 */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-700/95 backdrop-blur px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 whitespace-nowrap border border-slate-600/50">
                        <div className="text-white text-xs font-bold">{item.score} 分</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">表总量: {item.tables.toLocaleString()}</div>
                        <div className="text-slate-400 text-[10px]">告警: {item.alerts} 个</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-700/95 rotate-45 border-r border-b border-slate-600/50" />
                      </div>

                      <div className="w-full relative flex justify-center">
                        {/* 分数标签 */}
                        <div className="absolute -top-5 text-[11px] font-bold text-white tabular-nums">{item.score}</div>
                        <div
                          className={`w-full max-w-[48px] rounded-t-lg transition-all duration-700 relative overflow-hidden ${
                            isUp
                              ? 'bg-gradient-to-t from-cyan-600/80 to-cyan-400/80'
                              : 'bg-gradient-to-t from-amber-600/80 to-amber-400/80'
                          }`}
                          style={{ height: `${barHeight}%`, minHeight: '12px' }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {/* 渐变底部装饰 */}
                          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isUp ? 'bg-cyan-300/40' : 'bg-amber-300/40'}`} />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 pt-2 border-t border-slate-700/40 w-full">
                        <span className="text-slate-400 text-xs">{item.month}</span>
                        {index > 0 && (
                          <span className={`text-[10px] font-medium ${isUp ? 'text-green-400' : 'text-amber-400'}`}>
                            {isUp ? '' : ''}{Math.abs(+(item.score - prevScore).toFixed(1))}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 折线图叠加层 (SVG) */}
              <svg className="absolute left-12 right-4 top-0 bottom-0 pointer-events-none" preserveAspectRatio="none" viewBox={`0 0 ${Math.max(qualityTrends.length, 1) * 100} 100`}>
                <defs>
                  <linearGradient id="lineGradTrend" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#lineGradTrend)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                  points={qualityTrends.map((item, index) => {
                    const x = index * 100 + 50;
                    const y = 100 - ((item.score - chartMin) / chartRange) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                {qualityTrends.map((item, index) => {
                  const x = index * 100 + 50;
                  const y = 100 - ((item.score - chartMin) / chartRange) * 100;
                  return (
                    <circle key={index} cx={x} cy={y} r="3" fill="#0e1726" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />
                  );
                })}
              </svg>
            </div>

            {/* 图例 */}
            <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-slate-700/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-cyan-600 to-cyan-400" />
                <span className="text-xs text-slate-400">质量得分提升</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-amber-600 to-amber-400" />
                <span className="text-xs text-slate-400">质量得分下降</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded" />
                <span className="text-xs text-slate-400">趋势</span>
              </div>
            </div>
          </div>

          {/* 右侧质量维度面板 */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-sm text-slate-400 font-medium mb-2">质量维度分布</h4>
            {[
              { label: '完整', score: 96.8, color: 'bg-cyan-500' },
              { label: '一致', score: 94.2, color: 'bg-blue-500' },
              { label: '及时', score: 97.1, color: 'bg-emerald-500' },
              { label: '准确', score: 91.5, color: 'bg-purple-500' },
              { label: '唯一', score: 98.3, color: 'bg-amber-500' },
              { label: '有效', score: 89.6, color: 'bg-pink-500' },
            ].map((dim, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">{dim.label}</span>
                  <span className="text-xs text-white font-semibold tabular-nums">{dim.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dim.color} transition-all duration-500`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-700/40">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">综合评分</span>
                <span className="text-base font-bold text-white">{(qualityTrends[qualityTrends.length - 1]?.score || 0).toFixed(1)}<span className="text-xs text-slate-500 ml-1">/ 100</span></span>
              </div>
              <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
                  style={{ width: `${qualityTrends[qualityTrends.length - 1]?.score || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 定时任务（独占一行） ========== */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full" />
              定时任务
              <span className="ml-1 text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-medium border border-blue-500/20">
                {tasks?.length || 0} 个调度中
              </span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">实时跟踪平台所有定时调度任务的执行状态</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 状态筛选'*/}
            <div className="hidden md:flex items-center gap-1 p-1 bg-slate-900/40 rounded-lg border border-slate-700/40">
              {['全部', '运行', '完成', '警告'].map((label, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    i === 0 ? 'bg-slate-700/80 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="px-3 py-1.5 text-xs bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 hover:bg-cyan-500/15 transition-all font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建任务
            </button>
            <button className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1 font-medium px-2">
              查看全部
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 任务统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: '运行', value: tasks.filter(t => t.status === 'running').length, color: 'text-blue-400', bg: 'bg-blue-500/8', border: 'border-blue-500/20', dot: 'bg-blue-400' },
            { label: '完成', value: tasks.filter(t => t.status === 'success').length, color: 'text-green-400', bg: 'bg-green-500/8', border: 'border-green-500/20', dot: 'bg-green-400' },
            { label: '警告', value: tasks.filter(t => t.status === 'warning').length, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/20', dot: 'bg-amber-400' },
            { label: '待执行', value: tasks.filter(t => t.status === 'pending').length, color: 'text-slate-400', bg: 'bg-slate-500/8', border: 'border-slate-500/20', dot: 'bg-slate-400' },
          ].map((stat, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 ${stat.bg} border ${stat.border} rounded-lg`}>
              <div className="relative">
                <span className={`block w-2.5 h-2.5 rounded-full ${stat.dot}`} />
                {stat.label === '运行' && (
                  <span className={`absolute inset-0 rounded-full ${stat.dot} animate-ping opacity-75`} />
                )}
              </div>
              <div>
                <div className={`text-xl font-bold ${stat.color} leading-none`}>{stat.value}</div>
                <div className="text-[11px] text-slate-500 mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 任务列表 - 多列网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="group p-4 bg-slate-700/20 rounded-lg hover:bg-slate-700/40 transition-all cursor-pointer border border-slate-700/40 hover:border-slate-600/60 relative overflow-hidden"
            >
              {/* hover 微光 */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                task.status === 'success' ? 'bg-gradient-to-br from-green-500/5 to-transparent'
                  : task.status === 'running' ? 'bg-gradient-to-br from-blue-500/5 to-transparent'
                  : task.status === 'warning' ? 'bg-gradient-to-br from-amber-500/5 to-transparent'
                  : 'bg-gradient-to-br from-slate-500/5 to-transparent'
              }`} />

              <div className="relative flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    task.status === 'success' ? 'bg-green-500/15 text-green-400'
                      : task.status === 'running' ? 'bg-blue-500/15 text-blue-400'
                      : task.status === 'warning' ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-slate-500/15 text-slate-400'
                  }`}>
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate group-hover:text-cyan-300 transition-colors">{task.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        task.status === 'success' ? 'text-green-400 bg-green-500/10'
                          : task.status === 'running' ? 'text-blue-400 bg-blue-500/10'
                          : task.status === 'warning' ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-400 bg-slate-500/10'
                      }`}>
                        {task.status === 'success' ? '完成' : task.status === 'running' ? '运行' : task.status === 'warning' ? '警告' : '待执'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {task.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {task.nextRun}
                      </span>
                    </div>
                  </div>
                </div>
                {/* 操作按钮 - 默认隐藏 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 rounded-md bg-slate-600/30 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-all" title="重新运行">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button className="w-7 h-7 rounded-md bg-slate-600/30 hover:bg-slate-500/40 text-slate-400 hover:text-white flex items-center justify-center transition-all" title="查看日志">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 进度'*/}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-500">执行进度</span>
                  <span className="text-[11px] font-medium text-slate-400">{task.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-600/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 relative ${
                      task.status === 'success' ? 'bg-green-500'
                        : task.status === 'running' ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : task.status === 'warning' ? 'bg-amber-500'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  >
                    {task.status === 'running' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 py-2.5 text-sm text-slate-500 hover:text-cyan-400 border border-dashed border-slate-700 hover:border-cyan-500/30 rounded-lg transition-all hover:bg-cyan-500/5 flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加新的定时任务
        </button>
      </div>

      {/* ========== 数据血缘概念图（独占一行） ========== */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(6,182,212,0.5) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/5 via-purple-500/5 to-transparent rounded-bl-full" />

        <div className="relative flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
              数据血缘分析
            </h3>
            <p className="text-slate-500 text-xs mt-1">全链路数据流向追踪与影响分析</p>
          </div>
          <button className="px-4 py-2 text-xs bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 hover:bg-cyan-500/15 transition-all font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            进入血缘分析
          </button>
        </div>

        <div className="relative rounded-lg bg-slate-900/40 border border-slate-700/40 p-4">
          <svg viewBox="0 0 680 260" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="lineGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="odsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="dwdGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="dwsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="adsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 层标签背'*/}
            <rect x="10" y="8" width="140" height="244" rx="8" fill="url(#odsGrad)" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="1" />
            <rect x="180" y="8" width="150" height="244" rx="8" fill="url(#dwdGrad)" stroke="#a855f7" strokeOpacity="0.15" strokeWidth="1" />
            <rect x="360" y="8" width="140" height="244" rx="8" fill="url(#dwsGrad)" stroke="#f59e0b" strokeOpacity="0.15" strokeWidth="1" />
            <rect x="530" y="8" width="140" height="244" rx="8" fill="url(#adsGrad)" stroke="#10b981" strokeOpacity="0.15" strokeWidth="1" />

            {/* 层标'*/}
            <text x="80" y="30" textAnchor="middle" fill="#06b6d4" fontSize="11" fontWeight="600" opacity="0.8">ODS 原始层</text>
            <text x="255" y="30" textAnchor="middle" fill="#a855f7" fontSize="11" fontWeight="600" opacity="0.8">DWD 明细层</text>
            <text x="430" y="30" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="600" opacity="0.8">DWS 汇总层</text>
            <text x="600" y="30" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="600" opacity="0.8">ADS 应用层</text>

            {/* 连接'*/}
            <path d="M 140 75 C 160 75, 170 65, 190 65" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M 140 75 C 160 75, 170 110, 190 110" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.5s" repeatCount="indefinite" />
            </path>
            <path d="M 140 130 C 160 130, 170 110, 190 110" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.2s" repeatCount="indefinite" />
            </path>
            <path d="M 140 130 C 160 130, 170 155, 190 155" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.8s" repeatCount="indefinite" />
            </path>
            <path d="M 140 185 C 160 185, 170 155, 190 155" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.3s" repeatCount="indefinite" />
            </path>
            <path d="M 140 185 C 160 185, 170 200, 190 200" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="3s" repeatCount="indefinite" />
            </path>

            <path d="M 320 65 C 340 65, 350 80, 370 80" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.1s" repeatCount="indefinite" />
            </path>
            <path d="M 320 110 C 340 110, 350 80, 370 80" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.6s" repeatCount="indefinite" />
            </path>
            <path d="M 320 155 C 340 155, 350 145, 370 145" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.4s" repeatCount="indefinite" />
            </path>
            <path d="M 320 200 C 340 200, 350 145, 370 145" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.9s" repeatCount="indefinite" />
            </path>
            <path d="M 320 200 C 340 200, 350 210, 370 210" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.7s" repeatCount="indefinite" />
            </path>

            <path d="M 490 80 C 510 80, 520 75, 540 75" fill="none" stroke="url(#lineGrad3)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M 490 145 C 510 145, 520 140, 540 140" fill="none" stroke="url(#lineGrad3)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.3s" repeatCount="indefinite" />
            </path>
            <path d="M 490 210 C 510 210, 520 205, 540 205" fill="none" stroke="url(#lineGrad3)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="2.5s" repeatCount="indefinite" />
            </path>
            <path d="M 490 80 C 510 80, 520 140, 540 140" fill="none" stroke="url(#lineGrad3)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3">
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="3.2s" repeatCount="indefinite" />
            </path>

            {/* 流动粒子 */}
            <circle r="2.5" fill="#06b6d4" filter="url(#glow)">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 140 75 C 160 75, 170 65, 190 65" />
            </circle>
            <circle r="2" fill="#a855f7" filter="url(#glow)">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 140 130 C 160 130, 170 110, 190 110" begin="0.8s" />
            </circle>
            <circle r="2" fill="#06b6d4" filter="url(#glow)">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 140 185 C 160 185, 170 155, 190 155" begin="1.2s" />
            </circle>
            <circle r="2.5" fill="#a855f7" filter="url(#glow)">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 320 65 C 340 65, 350 80, 370 80" begin="0.5s" />
            </circle>
            <circle r="2" fill="#f59e0b" filter="url(#glow)">
              <animateMotion dur="3.2s" repeatCount="indefinite" path="M 320 155 C 340 155, 350 145, 370 145" begin="1s" />
            </circle>
            <circle r="2" fill="#a855f7" filter="url(#glow)">
              <animateMotion dur="3.8s" repeatCount="indefinite" path="M 320 200 C 340 200, 350 210, 370 210" begin="0.3s" />
            </circle>
            <circle r="2.5" fill="#f59e0b" filter="url(#glow)">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 490 80 C 510 80, 520 75, 540 75" begin="0.2s" />
            </circle>
            <circle r="2" fill="#10b981" filter="url(#glow)">
              <animateMotion dur="3.3s" repeatCount="indefinite" path="M 490 145 C 510 145, 520 140, 540 140" begin="0.7s" />
            </circle>
            <circle r="2" fill="#f59e0b" filter="url(#glow)">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 490 210 C 510 210, 520 205, 540 205" begin="1.5s" />
            </circle>

            {/* ODS 节点 */}
            <g className="cursor-pointer">
              <rect x="28" y="55" width="112" height="38" rx="6" fill="#0e1726" stroke="#06b6d4" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="42" cy="74" r="3" fill="#06b6d4" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x="52" y="71" fill="#94a3b8" fontSize="8" fontFamily="monospace">ods_order</text>
              <text x="52" y="83" fill="#475569" fontSize="7">日增 2.3M</text>
            </g>
            <g className="cursor-pointer">
              <rect x="28" y="110" width="112" height="38" rx="6" fill="#0e1726" stroke="#06b6d4" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="42" cy="129" r="3" fill="#06b6d4" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <text x="52" y="126" fill="#94a3b8" fontSize="8" fontFamily="monospace">ods_user</text>
              <text x="52" y="138" fill="#475569" fontSize="7">全量 15M</text>
            </g>
            <g className="cursor-pointer">
              <rect x="28" y="165" width="112" height="38" rx="6" fill="#0e1726" stroke="#06b6d4" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="42" cy="184" r="3" fill="#06b6d4" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <text x="52" y="181" fill="#94a3b8" fontSize="8" fontFamily="monospace">ods_product</text>
              <text x="52" y="193" fill="#475569" fontSize="7">全量 50K</text>
            </g>

            {/* DWD 节点 */}
            <g className="cursor-pointer">
              <rect x="195" y="45" width="125" height="38" rx="6" fill="#0e1726" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="209" cy="64" r="3" fill="#a855f7" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <text x="219" y="61" fill="#94a3b8" fontSize="8" fontFamily="monospace">dwd_order_detail</text>
              <text x="219" y="73" fill="#475569" fontSize="7">分区 365</text>
            </g>
            <g className="cursor-pointer">
              <rect x="195" y="90" width="125" height="38" rx="6" fill="#0e1726" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="209" cy="109" r="3" fill="#a855f7" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.1s" repeatCount="indefinite" />
              </circle>
              <text x="219" y="106" fill="#94a3b8" fontSize="8" fontFamily="monospace">dwd_user_order</text>
              <text x="219" y="118" fill="#475569" fontSize="7">日增 1.2M</text>
            </g>
            <g className="cursor-pointer">
              <rect x="195" y="135" width="125" height="38" rx="6" fill="#0e1726" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="209" cy="154" r="3" fill="#a855f7" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <text x="219" y="151" fill="#94a3b8" fontSize="8" fontFamily="monospace">dwd_traffic_log</text>
              <text x="219" y="163" fill="#475569" fontSize="7">日增 8.5M</text>
            </g>
            <g className="cursor-pointer">
              <rect x="195" y="180" width="125" height="38" rx="6" fill="#0e1726" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="209" cy="199" r="3" fill="#a855f7" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.9s" repeatCount="indefinite" />
              </circle>
              <text x="219" y="196" fill="#94a3b8" fontSize="8" fontFamily="monospace">dwd_payment</text>
              <text x="219" y="208" fill="#475569" fontSize="7">日增 800K</text>
            </g>

            {/* DWS 节点 */}
            <g className="cursor-pointer">
              <rect x="375" y="60" width="115" height="38" rx="6" fill="#0e1726" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="389" cy="79" r="3" fill="#f59e0b" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x="399" y="76" fill="#94a3b8" fontSize="8" fontFamily="monospace">dws_order_daily</text>
              <text x="399" y="88" fill="#475569" fontSize="7">存储 45GB</text>
            </g>
            <g className="cursor-pointer">
              <rect x="375" y="125" width="115" height="38" rx="6" fill="#0e1726" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="389" cy="144" r="3" fill="#f59e0b" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.3s" repeatCount="indefinite" />
              </circle>
              <text x="399" y="141" fill="#94a3b8" fontSize="8" fontFamily="monospace">dws_user_stats</text>
              <text x="399" y="153" fill="#475569" fontSize="7">存储 23GB</text>
            </g>
            <g className="cursor-pointer">
              <rect x="375" y="190" width="115" height="38" rx="6" fill="#0e1726" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="389" cy="209" r="3" fill="#f59e0b" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.6s" repeatCount="indefinite" />
              </circle>
              <text x="399" y="206" fill="#94a3b8" fontSize="8" fontFamily="monospace">dws_gmv_region</text>
              <text x="399" y="218" fill="#475569" fontSize="7">存储 12GB</text>
            </g>

            {/* ADS 节点 */}
            <g className="cursor-pointer">
              <rect x="545" y="55" width="115" height="38" rx="6" fill="#0e1726" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="559" cy="74" r="3" fill="#10b981" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.1s" repeatCount="indefinite" />
              </circle>
              <text x="569" y="71" fill="#94a3b8" fontSize="8" fontFamily="monospace">ads_sales_report</text>
              <text x="569" y="83" fill="#475569" fontSize="7">报表 12 个</text>
            </g>
            <g className="cursor-pointer">
              <rect x="545" y="120" width="115" height="38" rx="6" fill="#0e1726" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="559" cy="139" r="3" fill="#10b981" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <text x="569" y="136" fill="#94a3b8" fontSize="8" fontFamily="monospace">ads_user_portrait</text>
              <text x="569" y="148" fill="#475569" fontSize="7">标签 156 个</text>
            </g>
            <g className="cursor-pointer">
              <rect x="545" y="185" width="115" height="38" rx="6" fill="#0e1726" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" />
              <circle cx="559" cy="204" r="3" fill="#10b981" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.7s" repeatCount="indefinite" />
              </circle>
              <text x="569" y="201" fill="#94a3b8" fontSize="8" fontFamily="monospace">ads_ops_kpi</text>
              <text x="569" y="213" fill="#475569" fontSize="7">看板 8 个</text>
            </g>
          </svg>

          {/* 底部统计 */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/40">
            <div className="flex items-center gap-5">
              {[
                { color: 'bg-cyan-500', label: 'ODS' },
                { color: 'bg-purple-500', label: 'DWD' },
                { color: 'bg-amber-500', label: 'DWS' },
                { color: 'bg-emerald-500', label: 'ADS' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[11px] text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>13 个数据表</span>
              <span>·</span>
              <span>14 条血缘链路</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                实时更新
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tables */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-blue-400 to-violet-500 rounded-full" />
              最近访问的数据源
            </h3>
            <p className="text-slate-500 text-xs mt-1">今日共访问 23 张数据表</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索表名..."
                className="pl-9 pr-4 py-2 bg-slate-700/40 border border-slate-600/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-48 transition-colors"
              />
              <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1 font-medium">
              查看全部
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500 text-xs border-b border-slate-700/60">
                <th className="pb-3 font-medium">表名</th>
                <th className="pb-3 font-medium">分层</th>
                <th className="pb-3 font-medium">数据源</th>
                <th className="pb-3 font-medium">负责人</th>
                <th className="pb-3 font-medium">更新时间</th>
                <th className="pb-3 font-medium">质量得分</th>
                <th className="pb-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {recentTables.map((table, index) => {
                const colors = layerColors[table.layer];
                return (
                  <tr key={index} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors group cursor-pointer">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white text-sm font-mono group-hover:text-cyan-400 transition-colors">{table.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border} uppercase font-semibold`}>
                        {table.layer}
                      </span>
                    </td>
                    <td className="py-3.5"><span className="text-slate-400 text-sm">{table.db}</span></td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center text-white text-[10px] font-medium">
                          {table.owner.charAt(0)}
                        </div>
                        <span className="text-slate-300 text-sm">{table.owner}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="text-slate-400 text-sm flex items-center gap-1">
                        <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {table.updated}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              table.quality >= 95 ? 'bg-green-500'
                                : table.quality >= 90 ? 'bg-blue-500'
                                : table.quality >= 85 ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${table.quality}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium tabular-nums ${
                          table.quality >= 95 ? 'text-green-400'
                            : table.quality >= 90 ? 'text-blue-400'
                            : table.quality >= 85 ? 'text-amber-400'
                            : 'text-red-400'
                        }`}>
                          {table.quality}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors" title="查看">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors" title="血">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors" title="分享">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
