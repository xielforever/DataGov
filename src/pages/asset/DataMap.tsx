import { useState, useEffect, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Building2, CreditCard, Download, Flame, Folder, Globe2, Layers, Map, Megaphone, Package, RefreshCw, Shield, Truck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMapData } from '../../services/api';
import Breadcrumb from '../../components/common/Breadcrumb';

type AssetNode = {
  id: string;
  name: string;
  cnName: string;
  domain: string;
  layer: 'ODS' | 'DWD' | 'DWS' | 'ADS' | 'DIM';
  size: number;
  quality: number;
  hot: boolean;
};

type DomainItem = { id: string; name: string; color: string; Icon: LucideIcon };
type LayerItem = { id: string; name: string; desc: string; color: string };
type DatacenterItem = { id: string; name: string; label: string; assets: number; count: number; status: string; x: number; y: number; primary: boolean };

// 图标映射（不需要从后端返回）
const DOMAIN_ICONS: Record<string, LucideIcon> = {
  trade: BarChart3,
  user: User,
  product: Package,
  marketing: Megaphone,
  finance: CreditCard,
  risk: Shield,
  logistics: Truck,
  other: Folder,
};

// 分层描述（不需要从后端返回）
const LAYER_DESC: Record<string, string> = {
  ODS: '原始数据层', DWD: '明细数据层', DWS: '汇总数据层',
  ADS: '应用数据层', DIM: '维度数据层',
};

export default function DataMap() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetNode | null>(null);
  const [viewMode, setViewMode] = useState<'cluster' | 'heatmap' | 'geo'>('cluster');
  const [hoverDc, setHoverDc] = useState<string | null>(null);

  // ---- Mock API 数据加载 ----
  const [domains, setDomains] = useState<(DomainItem & { assetCount: number; hotCount: number })[]>([]);
  const [layers, setLayers] = useState<(LayerItem & { count: number })[]>([]);
  const [assets, setAssets] = useState<AssetNode[]>([]);
  const [datacenters, setDatacenters] = useState<DatacenterItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    setLoadingData(true);
    fetchMapData().then((data) => {
      const raw = data as {
        domains: Array<Record<string, unknown>>;
        layers: Array<Record<string, unknown>>;
        assets: Array<Record<string, unknown>>;
        datacenters: Array<Record<string, unknown>>;
      };

      setDomains(raw.domains.map(d => ({
        id: d.id as string,
        name: d.name as string,
        color: d.color as string,
        Icon: DOMAIN_ICONS[d.id as string] ?? Folder,
        assetCount: d.assetCount as number,
        hotCount: d.hotCount as number,
      })));

      setLayers(raw.layers.map(l => ({
        id: l.id as string,
        name: l.name as string,
        desc: LAYER_DESC[l.id as string] ?? '',
        color: l.color as string,
        count: l.count as number,
      })));

      setAssets(raw.assets.map(a => ({
        id: a.id as string,
        name: a.name as string,
        cnName: a.cnName as string,
        domain: a.domain as string,
        layer: a.layer as AssetNode['layer'],
        size: Math.min(5, Math.max(1, Math.ceil(Math.log10((a.rowCount as number) + 1)))),
        quality: a.qualityScore as number,
        hot: a.hot as boolean,
      })));

      setDatacenters(raw.datacenters.map((dc, i) => ({
        id: dc.id as string,
        name: dc.name as string,
        label: dc.label as string,
        assets: dc.assets as number,
        count: dc.assets as number,
        status: dc.status as string,
        primary: i === 0,
        // 转换为百分比坐标
        x: [75, 70, 72, 50, 65][i] ?? 50,
        y: [55, 30, 78, 55, 90][i] ?? 50,
      })));

      setLoadingData(false);
    });
  }, []);

  // 根据筛选过滤资产
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (selectedDomain && a.domain !== selectedDomain) return false;
      if (selectedLayer && a.layer !== selectedLayer) return false;
      return true;
    });
  }, [assets, selectedDomain, selectedLayer]);

  // 计算每个域的资产数量
  const domainStats = useMemo(() => {
    return domains.map(d => ({
      ...d,
      count: d.assetCount,
      hotCount: d.hotCount,
    }));
  }, [domains]);

  // 计算每个分层的资产数据
  const layerStats = useMemo(() => {
    return layers.map(l => ({
      ...l,
      count: l.count,
    }));
  }, [layers]);

  // 热力图矩阵数据
  const heatmapData = useMemo(() => {
    return domains.map(d => ({
      domain: d,
      cells: layers.map(l => ({
        layer: l,
        count: assets.filter(a => a.domain === d.id && a.layer === l.id).length,
        avgQuality: (() => {
          const arr = assets.filter(a => a.domain === d.id && a.layer === l.id);
          if (!arr.length) return 0;
          return Math.round(arr.reduce((sum, a) => sum + a.quality, 0) / arr.length);
        })(),
      })),
    }));
  }, [domains, layers, assets]);

  // 集群视图节点位置（按域分组到圆形布局）
  const clusterNodes = useMemo(() => {
    const result: (AssetNode & { x: number; y: number; r: number; domainColor: string })[] = [];
    const containerW = 800;
    const containerH = 500;
    const centerX = containerW / 2;
    const centerY = containerH / 2;

    domains.forEach((dom, domIdx) => {
      const domAssets = filteredAssets.filter(a => a.domain === dom.id);
      if (!domAssets.length) return;

      // 域中心位置（放射状分布）
      const angle = (domIdx / domains.length) * Math.PI * 2 - Math.PI / 2;
      const domCenterX = centerX + Math.cos(angle) * 200;
      const domCenterY = centerY + Math.sin(angle) * 160;

      // 域内节点圆形排列
      domAssets.forEach((asset, idx) => {
        const innerAngle = (idx / domAssets.length) * Math.PI * 2;
        const innerR = domAssets.length > 1 ? 50 + domAssets.length * 3 : 0;
        const x = domCenterX + Math.cos(innerAngle) * innerR;
        const y = domCenterY + Math.sin(innerAngle) * innerR;
        result.push({
          ...asset,
          x,
          y,
          r: 8 + asset.size * 2,
          domainColor: dom.color,
        });
      });
    });

    return result;
  }, [filteredAssets]);

  if (loadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载数据地图...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题与统'*/}
      <div>
        <Breadcrumb items={[{ label: '数据资产' }, { label: '数据地图' }]} />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              数据地图
              <span className="px-2 py-0.5 text-xs rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                可视化探索
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              通过可视化方式探索全域数据资产的分布、聚合与流向
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success('地图导出任务已提交')}
              className="px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 text-slate-300 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> 导出地图
            </button>
            <button
              onClick={() => toast.success('数据地图已刷新')}
              className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> 刷新
            </button>
          </div>
        </div>
      </div>

      {/* 顶部统计'*/}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '资产总数', value: assets.length, sub: '已纳入地图', color: 'from-cyan-500/20 to-blue-500/10', Icon: BarChart3 },
          { label: '业务域', value: domains.length, sub: '覆盖核心业务', color: 'from-purple-500/20 to-pink-500/10', Icon: Building2 },
          { label: '数据分层', value: layers.length, sub: 'ODS→ADS全链', color: 'from-emerald-500/20 to-teal-500/10', Icon: Layers },
          { label: '数据中心', value: datacenters.length, sub: '多区域部署', color: 'from-amber-500/20 to-orange-500/10', Icon: Globe2 },
          { label: '热门资产', value: assets.filter(a => a.hot).length, sub: '高频访问', color: 'from-rose-500/20 to-red-500/10', Icon: Flame },
        ].map(stat => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-xl p-4 backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">{stat.label}</span>
              <stat.Icon className="h-5 w-5 text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* 视图切换 */}
      <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-xl p-1.5 w-fit">
        {[
          { id: 'cluster', label: '资产集群', Icon: Globe2 },
          { id: 'heatmap', label: '域层热力', Icon: Flame },
          { id: 'geo', label: '地理分布', Icon: Map },
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as 'cluster' | 'heatmap' | 'geo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === mode.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
              <mode.Icon className="h-4 w-4" />
            {mode.label}
          </button>
        ))}
      </div>

      {/* 主体内容'*/}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧筛'*/}
        <div className="lg:col-span-1 space-y-4">
          {/* 业务域筛'*/}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                <h3 className="text-sm font-semibold text-white">业务</h3>
              </div>
              {selectedDomain && (
                <button
                  onClick={() => setSelectedDomain(null)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  清空
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {domainStats.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDomain(selectedDomain === d.id ? null : d.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center justify-between group ${
                    selectedDomain === d.id
                      ? 'bg-white/10 border border-white/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}` }}
                    />
                    <span className="text-sm text-slate-200">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {d.hotCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-300">
                        <Flame className="h-3 w-3" />{d.hotCount}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{d.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 数据分层筛'*/}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
                <h3 className="text-sm font-semibold text-white">数据分层</h3>
              </div>
              {selectedLayer && (
                <button
                  onClick={() => setSelectedLayer(null)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  清空
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {layerStats.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLayer(selectedLayer === l.id ? null : l.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center justify-between ${
                    selectedLayer === l.id
                      ? 'bg-white/10 border border-white/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${l.color}30`, color: l.color, border: `1px solid ${l.color}60` }}
                    >
                      {l.name}
                    </span>
                    <span className="text-xs text-slate-400">{l.desc}</span>
                  </div>
                  <span className="text-xs text-slate-400">{l.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 节点说明 */}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
              <h3 className="text-sm font-semibold text-white">图例说明</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <div className="w-4 h-4 rounded-full bg-cyan-400" />
                </div>
                <span>圆点大小代表数据量级</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                <span>热门资产标识</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40" />
                <span>悬停高亮</span>
              </div>
            </div>
          </div>
        </div>

        {/* 主可视化'*/}
        <div className="lg:col-span-3 bg-slate-900/40 border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden">
          {/* 集群'*/}
          {viewMode === 'cluster' && (
            <div className="relative">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">资产集群分布</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    显示 {clusterNodes.length} 个资产节点，按业务域聚合
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>实时</span>
                  </div>
                </div>
              </div>
              <div className="relative" style={{ height: 540 }}>
                <svg viewBox="0 0 800 500" className="w-full h-full">
                  <defs>
                    {domains.map(d => (
                      <radialGradient key={d.id} id={`grad-${d.id}`}>
                        <stop offset="0%" stopColor={d.color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={d.color} stopOpacity="0" />
                      </radialGradient>
                    ))}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* 网格背景 */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  </pattern>
                  <rect width="800" height="500" fill="url(#grid)" />

                  {/* 域光晕背'*/}
                  {domains.map((dom, domIdx) => {
                    const angle = (domIdx / domains.length) * Math.PI * 2 - Math.PI / 2;
                    const domCenterX = 400 + Math.cos(angle) * 200;
                    const domCenterY = 250 + Math.sin(angle) * 160;
                    const domAssets = filteredAssets.filter(a => a.domain === dom.id);
                    if (!domAssets.length) return null;
                    const labelY = Math.max(30, domCenterY - 80 - domAssets.length * 4 - 8);
                    return (
                      <g key={dom.id}>
                        <circle
                          cx={domCenterX}
                          cy={domCenterY}
                          r={80 + domAssets.length * 4}
                          fill={`url(#grad-${dom.id})`}
                        />
                        <text
                          x={domCenterX}
                          y={labelY}
                          textAnchor="middle"
                          fill={dom.color}
                          fontSize="13"
                          fontWeight="bold"
                          opacity="0.9"
                        >
                          {dom.name}
                        </text>
                        <text
                          x={domCenterX}
                          y={labelY + 16}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.4)"
                          fontSize="10"
                        >
                          {domAssets.length} 个资产
                        </text>
                      </g>
                    );
                  })}

                  {/* 中心枢纽 */}
                  <circle cx="400" cy="250" r="30" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                  <circle cx="400" cy="250" r="20" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.6)" strokeWidth="1.5" />
                  <text x="400" y="246" textAnchor="middle" fill="#67e8f9" fontSize="10" fontWeight="bold">
                    数据
                  </text>
                  <text x="400" y="258" textAnchor="middle" fill="#67e8f9" fontSize="10" fontWeight="bold">
                    中枢
                  </text>

                  {/* 中心到各域中心的连线 */}
                  {domains.map((dom, domIdx) => {
                    const angle = (domIdx / domains.length) * Math.PI * 2 - Math.PI / 2;
                    const domCenterX = 400 + Math.cos(angle) * 200;
                    const domCenterY = 250 + Math.sin(angle) * 160;
                    const domAssets = filteredAssets.filter(a => a.domain === dom.id);
                    if (!domAssets.length) return null;
                    return (
                      <line
                        key={`line-${dom.id}`}
                        x1="400"
                        y1="250"
                        x2={domCenterX}
                        y2={domCenterY}
                        stroke={dom.color}
                        strokeOpacity="0.25"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* 资产节点 */}
                  {clusterNodes.map(node => (
                    <g
                      key={node.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedAsset(node)}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget.querySelector('circle.node-circle') as SVGCircleElement;
                        if (target) target.setAttribute('r', String(node.r + 3));
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget.querySelector('circle.node-circle') as SVGCircleElement;
                        if (target) target.setAttribute('r', String(node.r));
                      }}
                    >
                      {/* 热门光环 */}
                      {node.hot && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.r + 4}
                          fill="none"
                          stroke="#f43f5e"
                          strokeOpacity="0.5"
                          strokeWidth="1"
                        >
                          <animate attributeName="r" from={node.r + 2} to={node.r + 8} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        className="node-circle"
                        cx={node.x}
                        cy={node.y}
                        r={node.r}
                        fill={node.domainColor}
                        fillOpacity={selectedAsset?.id === node.id ? 1 : 0.7}
                        stroke={selectedAsset?.id === node.id ? '#fff' : node.domainColor}
                        strokeWidth={selectedAsset?.id === node.id ? 2 : 1}
                        filter="url(#glow)"
                        style={{ transition: 'all 0.2s' }}
                      />
                      {/* 中心层标'*/}
                      <text
                        x={node.x}
                        y={node.y + 3}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="7"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {node.layer}
                      </text>
                    </g>
                  ))}

                  {/* 选中节点的标'*/}
                  {selectedAsset && clusterNodes.find(n => n.id === selectedAsset.id) && (() => {
                    const n = clusterNodes.find(nn => nn.id === selectedAsset.id)!;
                    return (
                      <g pointerEvents="none">
                        <rect
                          x={n.x - 60}
                          y={n.y - n.r - 32}
                          width="120"
                          height="22"
                          rx="4"
                          fill="rgba(15,23,42,0.95)"
                          stroke={n.domainColor}
                          strokeOpacity="0.6"
                        />
                        <text
                          x={n.x}
                          y={n.y - n.r - 17}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {n.cnName}
                        </text>
                      </g>
                    );
                  })()}
                </svg>

                {/* 浮动统计 */}
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-slate-400">显示</span>
                      <span className="text-cyan-300 font-semibold ml-1">{clusterNodes.length}</span>
                      <span className="text-slate-500"> / {assets.length}</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div>
                      <span className="text-slate-400">高亮</span>
                      <span className="text-cyan-300 font-semibold ml-1">
                        {selectedDomain ? domainStats.find(d => d.id === selectedDomain)?.name : '全部'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 热力'*/}
          {viewMode === 'heatmap' && (
            <div>
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white">业务域 × 数据分层热力</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  颜色深浅表示资产数量，悬停查看详情
                </p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs text-slate-400 font-normal pb-3 pr-4">业务域 / 分层</th>
                        {layers.map(l => (
                          <th key={l.id} className="text-center pb-3 px-1">
                            <div
                              className="text-xs font-bold inline-block px-2 py-1 rounded"
                              style={{ backgroundColor: `${l.color}25`, color: l.color, border: `1px solid ${l.color}60` }}
                            >
                              {l.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">{l.desc}</div>
                          </th>
                        ))}
                        <th className="text-center pb-3 pl-4 text-xs text-slate-400 font-normal">合计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.map(row => {
                        const rowTotal = row.cells.reduce((s, c) => s + c.count, 0);
                        return (
                          <tr key={row.domain.id} className="group">
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-1.5 h-6 rounded-full"
                                  style={{ backgroundColor: row.domain.color }}
                                />
                                <span className="text-sm text-white">{row.domain.name}</span>
                              </div>
                            </td>
                            {row.cells.map(cell => {
                              const intensity = cell.count === 0 ? 0 : Math.min(cell.count / 6, 1);
                              return (
                                <td key={cell.layer.id} className="py-2 px-1">
                                  <div
                                    className="relative aspect-square rounded-lg cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-white/40 flex flex-col items-center justify-center group/cell"
                                    style={{
                                      backgroundColor: cell.count
                                        ? `${cell.layer.color}${Math.round(20 + intensity * 70).toString(16)}`
                                        : 'rgba(30,41,59,0.4)',
                                      border: cell.count
                                        ? `1px solid ${cell.layer.color}80`
                                        : '1px solid rgba(255,255,255,0.05)',
                                      minHeight: 56,
                                    }}
                                  >
                                    {cell.count > 0 ? (
                                      <>
                                        <div className="text-base font-bold text-white">{cell.count}</div>
                                        <div className="text-[9px] text-white/70">质量{cell.avgQuality}</div>
                                      </>
                                    ) : (
                                      <div className="text-xs text-slate-600">-</div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-2 pl-4 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-base font-bold text-cyan-300">{rowTotal}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td className="pt-3 pr-4 text-xs text-slate-400">合计</td>
                        {layers.map(l => {
                          const total = assets.filter(a => a.layer === l.id).length;
                          return (
                            <td key={l.id} className="pt-3 px-1 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-10 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-base font-bold" style={{ color: l.color }}>{total}</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="pt-3 pl-4 text-center">
                          <div className="inline-flex items-center justify-center w-12 h-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-400/40">
                            <span className="text-base font-bold text-white">{assets.length}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 强度图例 */}
                <div className="mt-6 flex items-center justify-end gap-2 text-xs text-slate-400">
                  <span>资产密度</span>
                  <span>低</span>
                  <div className="flex gap-0.5">
                    {[0.2, 0.4, 0.6, 0.8, 1].map(o => (
                      <div
                        key={o}
                        className="w-6 h-3 rounded"
                        style={{ backgroundColor: `rgba(6,182,212,${o})` }}
                      />
                    ))}
                  </div>
                  <span>高</span>
                </div>
              </div>
            </div>
          )}

          {/* 地理分布 */}
          {viewMode === 'geo' && (
            <div>
              <div className="px-5 py-3 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white">数据中心地理分布</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  全球 {datacenters.length} 个数据中心节点，覆盖 {datacenters.reduce((s, d) => s + d.count, 0).toLocaleString()} 个数据资产
                </p>
              </div>
              <div className="relative" style={{ height: 540 }}>
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <radialGradient id="dcGlow">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(15,23,42,0.4)" />
                      <stop offset="100%" stopColor="rgba(15,23,42,0.1)" />
                    </linearGradient>
                  </defs>

                  {/* 抽象大陆轮廓（中国地图风格化'*/}
                  <path
                    d="M 30 25 Q 40 20 50 22 Q 60 24 68 28 Q 75 30 82 35 Q 85 42 84 50 Q 86 58 82 65 Q 78 72 70 78 Q 60 82 50 80 Q 40 78 32 72 Q 25 65 24 55 Q 22 45 26 35 Q 28 30 30 25 Z"
                    fill="url(#mapBg)"
                    stroke="rgba(6,182,212,0.2)"
                    strokeWidth="0.3"
                  />
                  {/* 海岸线装'*/}
                  <path
                    d="M 30 25 Q 40 20 50 22 Q 60 24 68 28 Q 75 30 82 35"
                    fill="none"
                    stroke="rgba(6,182,212,0.4)"
                    strokeWidth="0.2"
                    strokeDasharray="0.5 0.5"
                  />

                  {/* 节点之间的连接线（数据同步路径） */}
                  {datacenters.filter(d => d.primary).map(primary =>
                    datacenters.filter(d => !d.primary).map(other => (
                      <g key={`${primary.id}-${other.id}`}>
                        <line
                          x1={primary.x}
                          y1={primary.y}
                          x2={other.x}
                          y2={other.y}
                          stroke="rgba(6,182,212,0.25)"
                          strokeWidth="0.15"
                          strokeDasharray="0.8 0.4"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="0"
                            to="-5"
                            dur="3s"
                            repeatCount="indefinite"
                          />
                        </line>
                      </g>
                    ))
                  )}

                  {/* 数据中心节点 */}
                  {datacenters.map(dc => (
                    <g
                      key={dc.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoverDc(dc.id)}
                      onMouseLeave={() => setHoverDc(null)}
                    >
                      {/* 外光'*/}
                      <circle
                        cx={dc.x}
                        cy={dc.y}
                        r={dc.primary ? 6 : 4}
                        fill="url(#dcGlow)"
                      />
                      {/* 脉冲圆环 */}
                      <circle
                        cx={dc.x}
                        cy={dc.y}
                        r="1.5"
                        fill="none"
                        stroke={dc.status === 'warning' ? '#f59e0b' : '#06b6d4'}
                        strokeWidth="0.2"
                      >
                        <animate attributeName="r" from="1.5" to="4" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                      {/* 中心'*/}
                      <circle
                        cx={dc.x}
                        cy={dc.y}
                        r={dc.primary ? 1.4 : 1}
                        fill={dc.status === 'warning' ? '#f59e0b' : '#06b6d4'}
                        stroke="#fff"
                        strokeWidth="0.3"
                      />
                      {/* 主中心标'*/}
                      {dc.primary && (
                        <circle
                          cx={dc.x}
                          cy={dc.y}
                          r="0.5"
                          fill="#fff"
                        />
                      )}
                    </g>
                  ))}
                </svg>

                {/* 数据中心列表（悬浮在地图上） */}
                <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-xl p-3 w-72 max-h-[calc(100%-2rem)] overflow-y-auto">
                  <div className="text-xs text-slate-400 mb-2 px-1">数据中心列表</div>
                  <div className="space-y-1.5">
                    {datacenters.map(dc => (
                      <div
                        key={dc.id}
                        onMouseEnter={() => setHoverDc(dc.id)}
                        onMouseLeave={() => setHoverDc(null)}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${
                          hoverDc === dc.id
                            ? 'bg-cyan-500/15 border border-cyan-500/40'
                            : 'bg-white/5 border border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                dc.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                              } animate-pulse`}
                            />
                            <span className="text-xs font-medium text-white">{dc.name}</span>
                            {dc.primary && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                主中心
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">资产</span>
                          <span className="text-cyan-300 font-semibold">{dc.count.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 悬停提示 */}
                {hoverDc && (() => {
                  const dc = datacenters.find(d => d.id === hoverDc)!;
                  return (
                    <div
                      className="absolute pointer-events-none bg-slate-950/95 border border-cyan-500/40 rounded-lg px-3 py-2 text-xs shadow-lg shadow-cyan-500/20"
                      style={{
                        left: `${dc.x}%`,
                        top: `${dc.y}%`,
                        transform: 'translate(-50%, -130%)',
                      }}
                    >
                      <div className="font-semibold text-white mb-0.5">{dc.name}</div>
                      <div className="text-cyan-300">{dc.count.toLocaleString()} 个资产</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 选中节点详情 */}
      {selectedAsset && (
        <div className="bg-slate-900/40 border border-cyan-500/30 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                style={{
                  background: `linear-gradient(135deg, ${domains.find(d => d.id === selectedAsset.domain)?.color}, ${domains.find(d => d.id === selectedAsset.domain)?.color}80)`,
                }}
              >
                {selectedAsset.layer}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedAsset.cnName}</h3>
                  {selectedAsset.hot && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />热门</span>
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-400 font-mono">{selectedAsset.name}</div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">业务域：</span>
                    <span className="inline-flex items-center gap-1.5 text-white">
                      {(() => {
                        const DomainIcon = domains.find(d => d.id === selectedAsset.domain)?.Icon ?? Folder;
                        return <DomainIcon className="h-3.5 w-3.5" />;
                      })()}
                      {domains.find(d => d.id === selectedAsset.domain)?.name}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">分层</span>
                    <span
                      className="px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        backgroundColor: `${layers.find(l => l.id === selectedAsset.layer)?.color}25`,
                        color: layers.find(l => l.id === selectedAsset.layer)?.color,
                      }}
                    >
                      {selectedAsset.layer}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">质量分：</span>
                    <span className={`font-semibold ${
                      selectedAsset.quality >= 95 ? 'text-emerald-400' :
                      selectedAsset.quality >= 90 ? 'text-cyan-400' :
                      selectedAsset.quality >= 85 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {selectedAsset.quality}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">数据量级</span>
                    <span className="text-white">
                      {''.repeat(selectedAsset.size)}
                      <span className="text-slate-600">{''.repeat(5 - selectedAsset.size)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs">
                查看血缘
              </button>
              <button className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-medium">
                查看详情
              </button>
              <button
                onClick={() => setSelectedAsset(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
              >
                '              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
