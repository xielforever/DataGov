import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, BarChart3, MessageSquare, Search, Trophy, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchLineageData } from '../../services/api';
import Breadcrumb from '../../components/common/Breadcrumb';

// 血缘节点数据
interface LineageNode {
  id: string;
  name: string;
  cnName: string;
  layer: 'ODS' | 'DWD' | 'DWS' | 'ADS' | 'DIM';
  domain: string;
  owner: string;
  rows: string;
  qualityScore: number;
  updateTime: string;
  level: number; // 0=当前, -N=上游, +N=下游
  position?: { x: number; y: number };
}

interface LineageEdge {
  from: string;
  to: string;
  type: 'direct' | 'transform' | 'aggregate';
  fields?: number;
}

// UI 渲染配置（非业务数据）
const layerColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  ODS: { bg: 'bg-blue-500/15', border: 'border-blue-500/50', text: 'text-blue-400', gradient: 'from-blue-500 to-blue-600' },
  DWD: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/50', text: 'text-cyan-400', gradient: 'from-cyan-500 to-cyan-600' },
  DWS: { bg: 'bg-purple-500/15', border: 'border-purple-500/50', text: 'text-purple-400', gradient: 'from-purple-500 to-purple-600' },
  ADS: { bg: 'bg-pink-500/15', border: 'border-pink-500/50', text: 'text-pink-400', gradient: 'from-pink-500 to-pink-600' },
  DIM: { bg: 'bg-amber-500/15', border: 'border-amber-500/50', text: 'text-amber-400', gradient: 'from-amber-500 to-amber-600' },
};

export default function DataLineage() {
  const [searchQuery, setSearchQuery] = useState('dwd_order_detail');
  const [centerNodeId, setCenterNodeId] = useState('dwd_order_detail');
  const [upstreamDepth, setUpstreamDepth] = useState(2);
  const [downstreamDepth, setDownstreamDepth] = useState(2);
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [allNodes, setAllNodes] = useState<LineageNode[]>([]);
  const [allEdges, setAllEdges] = useState<LineageEdge[]>([]);
  const [fieldLineage, setFieldLineage] = useState<{ from: string; to: string; transform: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'graph' | 'field' | 'impact'>('graph');
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [searchFeedback, setSearchFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 从 Mock API 加载血缘数据
  const loadLineageData = async (center: string, up: number, down: number, selectedId?: string | null) => {
    setLoading(true);
    try {
      const result = await fetchLineageData(center);
      const nodes = result.nodes as LineageNode[];
      const edges = result.edges as LineageEdge[];
      const nextCenterNode = nodes.find(node => node.id === result.center) ?? nodes[0] ?? null;
      const nextSelectedNode = selectedId
        ? nodes.find(node => node.id === selectedId) ?? nextCenterNode
        : nextCenterNode;

      setAllNodes(nodes);
      setAllEdges(edges);
      setFieldLineage(result.fields);
      setCenterNodeId(result.center);
      setSelectedNode(nextSelectedNode);

      return { centerId: result.center, centerNode: nextCenterNode };
    } catch {
      setSearchFeedback({ type: 'error', text: `未找到表“${center || '未输入'}”的血缘样本，请尝试输入 mock 中已有表名。` });
      setTimeout(() => setSearchFeedback(null), 3000);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLineageData('dwd_order_detail', 2, 2);
  }, []);

  const centerNode = allNodes.find(node => node.id === centerNodeId) ?? allNodes[0] ?? { name: '', layer: 'ODS', cnName: '', rows: 0, owner: '', qualityScore: 0 };

  const handleSearchLineage = async () => {
    const keyword = searchQuery.trim();
    if (!keyword) {
      setSearchFeedback({ type: 'error', text: '请输入表名后再查询血缘。' });
      setTimeout(() => setSearchFeedback(null), 3000);
      return;
    }

    const result = await loadLineageData(keyword, upstreamDepth, downstreamDepth);
    if (!result?.centerNode) return;

    setSearchQuery(result.centerNode.name);
    setViewMode('graph');
    setSearchFeedback({ type: 'success', text: `已加载 ${result.centerNode.name} 的血缘视图。` });
    setTimeout(() => setSearchFeedback(null), 3000);
  };

  const handleCenterNodeChange = async (nodeId: string, nextSelectedId?: string | null) => {
    const result = await loadLineageData(nodeId, upstreamDepth, downstreamDepth, nextSelectedId ?? nodeId);
    if (!result?.centerNode) return;
    setSearchQuery(result.centerNode.name);
    setViewMode('graph');
  };

  const handleReparseCurrent = () => {
    setSearchFeedback({ type: 'info', text: `已触发 ${centerNode?.name || '未知节点'} 的重新解析任务，用于刷新最新血缘关系。` });
    setTimeout(() => setSearchFeedback(null), 3000);
  };

  // 加载中状态，改为浮层模式，不销毁底层图表 DOM
  const renderLoadingOverlay = () => {
    if (!loading) return null;
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-xl transition-all duration-300">
        <div className="text-center bg-slate-900/80 px-6 py-4 rounded-xl border border-white/10 shadow-2xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
          <p className="mt-3 text-sm text-cyan-400 font-medium">解析血缘链路中...</p>
        </div>
      </div>
    );
  };

  // 数据为空的兜底
  if (!loading && allNodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-400">暂无血缘数据</p>
        </div>
      </div>
    );
  }

  // 计算节点位置（按 level 分层）- 动态去空列
  const visibleNodes = allNodes.filter(n => {
    if (n.level === 0) return true;
    if (n.level < 0) return Math.abs(n.level) <= upstreamDepth;
    return n.level <= downstreamDepth;
  });

  const levelGroups: Record<number, LineageNode[]> = {};
  visibleNodes.forEach(n => {
    if (!levelGroups[n.level]) levelGroups[n.level] = [];
    levelGroups[n.level].push(n);
  });

  // 动态计算列：只为实际存在的 level 分配列，去掉空层
  const levels = Object.keys(levelGroups).map(l => parseInt(l)).sort((a, b) => a - b);
  const levelToIndex = new Map<number, number>();
  levels.forEach((lvl, idx) => levelToIndex.set(lvl, idx));

  const SVG_HEIGHT = 600;
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 90;
  const COL_GAP = 280;
  const SVG_WIDTH = Math.max(900, 120 + levels.length * COL_GAP);

  // 为每个节点计算位置
  const nodesWithPos = visibleNodes.map(node => {
    const colIndex = levelToIndex.get(node.level) ?? 0;
    const colNodes = levelGroups[node.level];
    const rowIndex = colNodes.findIndex(n => n.id === node.id);
    const totalRows = colNodes.length;
    const colX = 60 + colIndex * COL_GAP;
    const rowSpacing = SVG_HEIGHT / (totalRows + 1);
    const rowY = rowSpacing * (rowIndex + 1) - NODE_HEIGHT / 2;
    return { ...node, position: { x: colX, y: rowY } };
  });

  const getNode = (id: string) => nodesWithPos.find(n => n.id === id);

  const visibleEdges = allEdges.filter(e => getNode(e.from) && getNode(e.to));

  // 影响分析数据
  const impactNodes = nodesWithPos.filter(n => n.level > 0);
  const dependsOnNodes = nodesWithPos.filter(n => n.level < 0);

  return (
    <div className="space-y-6">
      {/* 页面顶部 */}
      <div>
        <Breadcrumb items={[{ label: '数据资产' }, { label: '数据血缘' }]} />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span>数据血缘分析</span>
              <span className="px-2 py-0.5 text-xs rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-normal">Lineage</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">追溯数据来源与去向，助力影响分析、问题定位与合规审计</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success('血缘图导出任务已提交')}
              className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              导出血缘图
            </button>
            <button
              onClick={handleReparseCurrent}
              className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              重新解析当前表
            </button>
          </div>
        </div>
      </div>

      {/* 搜索 + 控制面板 */}
      <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4 backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[320px] flex items-center gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchLineage();
                }}
                placeholder="输入数据表名后查询血缘（如 dwd_order_detail）"
                className="w-full bg-slate-950/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <button
              onClick={handleSearchLineage}
              className="px-4 py-2.5 text-sm bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l4.5-4.5L8 7M13 16h3" /></svg>
              查询血缘
            </button>
          </div>

          {/* 上下游层级 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">上游</span>
            <div className="flex items-center bg-slate-950/50 border border-white/10 rounded-lg p-1">
              {[{v:1,l:'1层'},{v:2,l:'2层'},{v:3,l:'3层'},{v:99,l:'全部'}].map(d => (
                <button
                  key={d.v}
                  onClick={async () => {
                    setUpstreamDepth(d.v);
                    await loadLineageData(centerNodeId, d.v, downstreamDepth, selectedNode?.id ?? centerNodeId);
                  }}
                  className={`px-3 py-1 text-xs rounded transition-colors ${upstreamDepth === d.v ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {d.l}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-400 ml-2">下游</span>
            <div className="flex items-center bg-slate-950/50 border border-white/10 rounded-lg p-1">
              {[{v:1,l:'1层'},{v:2,l:'2层'},{v:3,l:'3层'},{v:99,l:'全部'}].map(d => (
                <button
                  key={d.v}
                  onClick={async () => {
                    setDownstreamDepth(d.v);
                    await loadLineageData(centerNodeId, upstreamDepth, d.v, selectedNode?.id ?? centerNodeId);
                  }}
                  className={`px-3 py-1 text-xs rounded transition-colors ${downstreamDepth === d.v ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          {/* 视图切换 */}
          <div className="flex items-center bg-slate-950/50 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${viewMode === 'graph' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              表级血缘
            </button>
            <button
              onClick={() => setViewMode('field')}
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${viewMode === 'field' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              字段血缘
            </button>
            <button
              onClick={() => setViewMode('impact')}
              className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${viewMode === 'impact' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              影响分析
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap text-xs min-h-[30px] relative">
          <div className="text-slate-400">
            输入表名后点击 <span className="text-cyan-300 font-medium">查询血缘</span> 用于加载该表已解析的血缘关系；右上角 <span className="text-white font-medium">重新解析当前表</span> 用于刷新元数据与 SQL 依赖结果。
          </div>
          {searchFeedback && (
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border ${searchFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : searchFeedback.type === 'error' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'} animate-fadeIn`}>
              {searchFeedback.text}
            </div>
          )}
        </div>
      </div>

      {/* 当前节点信息条 */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{centerNode.name}</h3>
                <span className={`px-2 py-0.5 text-xs rounded ${layerColors[centerNode.layer].bg} ${layerColors[centerNode.layer].text} border ${layerColors[centerNode.layer].border}`}>{centerNode.layer}</span>
                <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                  已认证
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{centerNode.cnName} · {centerNode.rows} · 负责人：{centerNode.owner}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{dependsOnNodes.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">上游表数</div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{impactNodes.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">下游影响</div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{visibleEdges.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">血缘链路</div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${centerNode.qualityScore >= 95 ? 'text-emerald-400' : centerNode.qualityScore >= 90 ? 'text-cyan-400' : 'text-amber-400'}`}>{centerNode.qualityScore}</div>
              <div className="text-xs text-slate-400 mt-0.5">质量评分</div>
            </div>
          </div>
        </div>
      </div>

      {/* === 视图1：表级血缘图 === */}
      {viewMode === 'graph' && (
        <div className="relative bg-slate-900/40 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden">
          {renderLoadingOverlay()}
          {/* 工具栏 */}
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-400">
                共 <span className="text-white font-medium">{visibleNodes.length}</span> 个节点 · <span className="text-white font-medium">{visibleEdges.length}</span> 条血缘
              </div>
              <div className="flex items-center gap-3 ml-4">
                {Object.entries(layerColors).map(([layer, color]) => (
                  <div key={layer} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-sm bg-gradient-to-br ${color.gradient}`}></div>
                    <span className="text-xs text-slate-400">{layer}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`px-2.5 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${showLabels ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                字段数标签
              </button>
              <div className="flex items-center bg-slate-950/50 border border-white/10 rounded-lg">
                <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="px-2 py-1.5 text-slate-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <span className="px-2 text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="px-2 py-1.5 text-slate-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              <button onClick={() => setZoom(1)} className="px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded transition-colors">
                重置
              </button>
            </div>
          </div>

          {/* SVG 血缘图 */}
          <div className="relative bg-gradient-to-br from-slate-950 to-slate-900 overflow-auto" style={{ height: '640px' }}>
            <svg
              ref={svgRef}
              width={SVG_WIDTH * zoom}
              height={SVG_HEIGHT * zoom}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="block"
            >
              <defs>
                {/* 网格 */}
                <pattern id="lineageGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
                {/* 箭头 */}
                <marker id="arrowCyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                </marker>
                <marker id="arrowPurple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                </marker>
                <marker id="arrowAmber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
                {/* 高亮箭头 */}
                <marker id="arrowHighlight" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                </marker>
                {/* 节点光晕 */}
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#lineageGrid)" />

              {/* 列分组背景 - 动态去空列 */}
              {levels.map((lv) => {
                const nodes = levelGroups[lv];
                const colIndex = levelToIndex.get(lv) ?? 0;
                const colX = 60 + colIndex * COL_GAP;
                const isCenter = lv === 0;
                return (
                  <g key={lv}>
                    <rect
                      x={colX - 20}
                      y={20}
                      width={NODE_WIDTH + 40}
                      height={SVG_HEIGHT - 40}
                      fill={isCenter ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.015)'}
                      stroke={isCenter ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.05)'}
                      strokeWidth="1"
                      strokeDasharray={isCenter ? '0' : '4 4'}
                      rx="8"
                    />
                    <text
                      x={colX + NODE_WIDTH / 2}
                      y={40}
                      textAnchor="middle"
                      className="text-xs font-medium"
                      fill={isCenter ? '#06b6d4' : '#64748b'}
                    >
                      {lv === 0 ? '★ 当前节点' : lv < 0 ? `上游 L${Math.abs(lv)}` : `下游 L${lv}`}
                      <tspan dx="8" fill="#475569">({nodes.length})</tspan>
                    </text>
                  </g>
                );
              })}

              {/* 边（血缘连接） */}
              {visibleEdges.map((edge, idx) => {
                const fromNode = getNode(edge.from);
                const toNode = getNode(edge.to);
                if (!fromNode || !toNode || !fromNode.position || !toNode.position) return null;

                const x1 = fromNode.position.x + NODE_WIDTH;
                const y1 = fromNode.position.y + NODE_HEIGHT / 2;
                const x2 = toNode.position.x;
                const y2 = toNode.position.y + NODE_HEIGHT / 2;
                const cx1 = x1 + (x2 - x1) / 2;
                const cx2 = x2 - (x2 - x1) / 2;
                const path = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
                const edgeId = `${edge.from}-${edge.to}`;
                const isHovered = hoveredEdge === edgeId;
                const isHighlighted = selectedNode && (selectedNode.id === edge.from || selectedNode.id === edge.to);
                const isCenterEdge = edge.from === centerNodeId || edge.to === centerNodeId;

                const colorMap = {
                  direct: { stroke: '#06b6d4', marker: 'arrowCyan' },
                  transform: { stroke: '#a855f7', marker: 'arrowPurple' },
                  aggregate: { stroke: '#f59e0b', marker: 'arrowAmber' },
                };
                const c = colorMap[edge.type];
                const finalColor = isHovered || isHighlighted ? '#fbbf24' : c.stroke;
                const finalMarker = isHovered || isHighlighted ? 'arrowHighlight' : c.marker;

                return (
                  <g key={idx} onMouseEnter={() => setHoveredEdge(edgeId)} onMouseLeave={() => setHoveredEdge(null)}>
                    {/* 透明粗线增大点击区 */}
                    <path d={path} fill="none" stroke="transparent" strokeWidth="14" className="cursor-pointer" />
                    {/* 实际线 */}
                    <path
                      d={path}
                      fill="none"
                      stroke={finalColor}
                      strokeWidth={isHovered || isHighlighted ? 2.5 : isCenterEdge ? 2 : 1.5}
                      strokeOpacity={isHovered || isHighlighted ? 1 : 0.7}
                      markerEnd={`url(#${finalMarker})`}
                      className="transition-all"
                    />
                    {/* 流动粒子 */}
                    <circle r="3" fill={finalColor} opacity="0.9">
                      <animateMotion dur="3s" repeatCount="indefinite" path={path} />
                      <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                    {/* 字段数标签 */}
                    {showLabels && edge.fields && (
                      <g>
                        <rect
                          x={(x1 + x2) / 2 - 22}
                          y={(y1 + y2) / 2 - 10}
                          width="44"
                          height="20"
                          rx="10"
                          fill="rgba(15, 23, 42, 0.9)"
                          stroke={finalColor}
                          strokeOpacity="0.5"
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 + 4}
                          textAnchor="middle"
                          className="text-[10px] font-medium"
                          fill={finalColor}
                        >
                          {edge.fields} 字段
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 节点 */}
              {nodesWithPos.map(node => {
                const isCenter = node.id === centerNodeId;
                const isSelected = selectedNode?.id === node.id;
                const isRelated = selectedNode && visibleEdges.some(e =>
                  (e.from === node.id && e.to === selectedNode.id) ||
                  (e.to === node.id && e.from === selectedNode.id)
                );
                const fillColor = isCenter ? 'rgba(6, 182, 212, 0.18)' : isSelected ? 'rgba(251, 191, 36, 0.18)' : 'rgba(15, 23, 42, 0.85)';
                const strokeColor = isCenter ? '#06b6d4' : isSelected ? '#fbbf24' : isRelated ? '#94a3b8' : 'rgba(255,255,255,0.15)';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.position!.x}, ${node.position!.y})`}
                    className="cursor-pointer"
                    onClick={async () => {
                      await handleCenterNodeChange(node.id, node.id);
                    }}
                  >
                    {/* 节点底色 */}
                    <rect
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      rx="8"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isCenter || isSelected ? 2 : 1}
                      filter={isCenter ? 'url(#nodeGlow)' : undefined}
                      className="transition-all"
                    />
                    {/* 左侧 layer 色条 */}
                    <rect width="4" height={NODE_HEIGHT} rx="2" fill={`url(#layerGrad-${node.layer})`} />
                    <defs>
                      <linearGradient id={`layerGrad-${node.layer}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={node.layer === 'ODS' ? '#3b82f6' : node.layer === 'DWD' ? '#06b6d4' : node.layer === 'DWS' ? '#a855f7' : node.layer === 'ADS' ? '#ec4899' : '#f59e0b'} />
                        <stop offset="100%" stopColor={node.layer === 'ODS' ? '#1d4ed8' : node.layer === 'DWD' ? '#0891b2' : node.layer === 'DWS' ? '#7e22ce' : node.layer === 'ADS' ? '#be185d' : '#d97706'} />
                      </linearGradient>
                    </defs>

                    {/* layer 标签 */}
                    <rect x="14" y="10" width="34" height="16" rx="3" fill={`rgba(${node.layer === 'ODS' ? '59, 130, 246' : node.layer === 'DWD' ? '6, 182, 212' : node.layer === 'DWS' ? '168, 85, 247' : node.layer === 'ADS' ? '236, 72, 153' : '245, 158, 11'}, 0.2)`} />
                    <text x="31" y="22" textAnchor="middle" className="text-[10px] font-bold" fill={node.layer === 'ODS' ? '#60a5fa' : node.layer === 'DWD' ? '#22d3ee' : node.layer === 'DWS' ? '#c084fc' : node.layer === 'ADS' ? '#f472b6' : '#fbbf24'}>
                      {node.layer}
                    </text>

                    {/* 中心节点徽章 */}
                    {isCenter && (
                      <g transform={`translate(${NODE_WIDTH - 30}, 6)`}>
                        <circle r="10" fill="#06b6d4" />
                        <text textAnchor="middle" y="4" className="text-[12px]" fill="white">★</text>
                      </g>
                    )}

                    {/* 节点名 */}
                    <text x="56" y="22" className="text-[12px] font-semibold" fill="white">
                      {node.name.length > 18 ? node.name.slice(0, 17) + '...' : node.name}
                    </text>

                    {/* 中文名 */}
                    <text x="14" y="46" className="text-[11px]" fill="#cbd5e1">
                      {node.cnName}
                    </text>

                    {/* 元数据 */}
                    <text x="14" y="68" className="text-[10px]" fill="#64748b">
                      {node.rows} · {node.owner}
                    </text>

                    {/* 质量分 */}
                    <g transform={`translate(${NODE_WIDTH - 50}, 56)`}>
                      <rect width="36" height="20" rx="3" fill={node.qualityScore >= 95 ? 'rgba(16, 185, 129, 0.2)' : node.qualityScore >= 90 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)'} />
                      <text x="18" y="14" textAnchor="middle" className="text-[11px] font-bold" fill={node.qualityScore >= 95 ? '#34d399' : node.qualityScore >= 90 ? '#22d3ee' : '#fbbf24'}>
                        {node.qualityScore}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 底部：边类型图例 */}
          <div className="flex items-center justify-center gap-6 p-3 border-t border-white/10 bg-slate-950/30">
            <div className="flex items-center gap-2">
              <svg width="40" height="6"><line x1="0" y1="3" x2="40" y2="3" stroke="#06b6d4" strokeWidth="2" /></svg>
              <span className="text-xs text-slate-400">直接映射</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="40" height="6"><line x1="0" y1="3" x2="40" y2="3" stroke="#a855f7" strokeWidth="2" /></svg>
              <span className="text-xs text-slate-400">数据转换</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="40" height="6"><line x1="0" y1="3" x2="40" y2="3" stroke="#f59e0b" strokeWidth="2" /></svg>
              <span className="text-xs text-slate-400">聚合计算</span>
            </div>
            <div className="text-xs text-slate-500 ml-4">💡 点击节点查看详情，hover 边线查看血缘信息</div>
          </div>
        </div>
      )}

      {/* === 视图2：字段血缘 === */}
      {viewMode === 'field' && (
        <div className="relative bg-slate-900/40 border border-white/10 rounded-xl backdrop-blur-sm p-6">
          {renderLoadingOverlay()}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">字段级血缘追溯</h3>
              <p className="text-sm text-slate-400 mt-1">追踪每个字段的来源与转换逻辑，支持精确的影响分析</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="bg-slate-950/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500/50">
                <option>dwd_order_detail</option>
                <option>dws_order_user_1d</option>
                <option>ads_sales_report</option>
              </select>
              <button onClick={() => toast.success('字段血缘视图已切换')} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors">
                导出 SQL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* 上游字段 */}
            <div className="col-span-4">
              <div className="text-xs font-medium text-blue-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                上游字段
              </div>
              <div className="space-y-2">
                {[
                  { table: 'ods_order', fields: ['order_id', 'user_id', 'amount', 'create_time'], color: 'blue' },
                  { table: 'ods_user', fields: ['user_name', 'user_level'], color: 'blue' },
                  { table: 'dwd_user_event', fields: ['last_visit'], color: 'cyan' },
                ].map(t => (
                  <div key={t.table} className="bg-slate-950/50 border border-white/10 rounded-lg p-3">
                    <div className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                      {t.table}
                    </div>
                    <div className="space-y-1">
                      {t.fields.map(f => (
                        <div key={f} className="text-xs font-mono text-slate-400 hover:text-cyan-400 hover:bg-white/5 px-2 py-1 rounded cursor-pointer transition-colors">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 中间转换 */}
            <div className="col-span-4">
              <div className="text-xs font-medium text-amber-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                字段映射关系
              </div>
              <div className="space-y-2">
                {fieldLineage.map((map, i) => (
                  <div key={i} className="bg-gradient-to-r from-slate-950/50 to-slate-900/30 border border-white/10 rounded-lg p-2.5 hover:border-amber-500/30 transition-colors group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[11px] font-mono text-blue-300 truncate flex-1">{map.from}</div>
                    </div>
                    <div className="flex items-center justify-center gap-1 my-1">
                      <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      <span className="text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {map.transform}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-mono text-cyan-300 truncate flex-1">{map.to}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 下游字段 */}
            <div className="col-span-4">
              <div className="text-xs font-medium text-purple-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                当前表字段（dwd_order_detail）
              </div>
              <div className="bg-slate-950/50 border border-cyan-500/30 rounded-lg p-3">
                <div className="text-xs font-medium text-cyan-300 mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  共 32 个字段（显示主要字段）
                </div>
                <div className="space-y-1">
                  {[
                    { name: 'order_id', type: 'BIGINT', tag: '主键' },
                    { name: 'user_id', type: 'BIGINT', tag: '索引' },
                    { name: 'order_amount', type: 'DECIMAL(18,2)' },
                    { name: 'order_time', type: 'TIMESTAMP' },
                    { name: 'user_name', type: 'VARCHAR(50)' },
                    { name: 'user_level', type: 'TINYINT' },
                    { name: 'last_active', type: 'TIMESTAMP' },
                  ].map(f => (
                    <div key={f.name} className="flex items-center justify-between text-xs px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">{f.name}</span>
                        {f.tag && <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/15 text-amber-400">{f.tag}</span>}
                      </div>
                      <span className="font-mono text-cyan-400 text-[10px]">{f.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SQL 转换逻辑预览 */}
          <div className="mt-6 bg-slate-950/70 border border-white/10 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span className="text-sm font-medium text-white">字段转换逻辑（SQL）</span>
              </div>
              <button className="text-xs text-slate-400 hover:text-white">复制</button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
{`INSERT INTO dwd_order_detail
SELECT
  o.order_id,                               -- 直接映射 ods_order.order_id
  o.user_id,                                -- 直接映射 ods_order.user_id
  CAST(o.amount AS DECIMAL(18,2)) AS order_amount,  -- 类型转换
  CONVERT_TZ(o.create_time, '+00:00', '+08:00') AS order_time,  -- 时区转换
  u.user_name,                              -- JOIN ods_user
  u.user_level,                             -- JOIN ods_user
  MAX(e.last_visit) AS last_active          -- MAX 聚合 dwd_user_event
FROM ods_order o
LEFT JOIN ods_user u ON o.user_id = u.user_id
LEFT JOIN dwd_user_event e ON o.user_id = e.user_id
GROUP BY o.order_id, o.user_id, o.amount, o.create_time, u.user_name, u.user_level;`}
            </pre>
          </div>
        </div>
      )}

      {/* === 视图3：影响分析 === */}
      {viewMode === 'impact' && (
        <div className="relative space-y-6">
          {renderLoadingOverlay()}
          {/* 警告条 */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-300 mb-1">变更影响评估</div>
              <div className="text-xs text-amber-200/70">
                若对 <span className="font-mono font-semibold text-amber-100">dwd_order_detail</span> 进行结构变更或下线，将影响 <span className="font-bold text-amber-100">{impactNodes.length}</span> 个下游表、<span className="font-bold text-amber-100">3</span> 个核心报表、<span className="font-bold text-amber-100">12</span> 个数据应用。
                请仔细评估后再操作，建议提前通知相关负责人。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 下游影响 */}
            <div className="bg-slate-900/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">下游影响节点</div>
                    <div className="text-xs text-slate-400">变更将影响以下数据资产</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-xs rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">{impactNodes.length} 个</span>
              </div>
              <div className="space-y-2">
                {impactNodes.map(n => (
                  <div key={n.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-lg hover:border-purple-500/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-10 rounded-full bg-gradient-to-b ${layerColors[n.layer].gradient}`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-white">{n.name}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded ${layerColors[n.layer].bg} ${layerColors[n.layer].text} border ${layerColors[n.layer].border}`}>{n.layer}</span>
                          {n.level === 1 && <span className="px-1.5 py-0.5 text-[10px] rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">直接影响</span>}
                          {n.level === 2 && <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">间接影响</span>}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{n.cnName} · {n.owner} · {n.rows}</div>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded">
                      通知负责人
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 上游依赖 */}
            <div className="bg-slate-900/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">上游依赖节点</div>
                    <div className="text-xs text-slate-400">当前节点的数据来源</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-xs rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">{dependsOnNodes.length} 个</span>
              </div>
              <div className="space-y-2">
                {dependsOnNodes.map(n => (
                  <div key={n.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-lg hover:border-blue-500/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-10 rounded-full bg-gradient-to-b ${layerColors[n.layer].gradient}`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-white">{n.name}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded ${layerColors[n.layer].bg} ${layerColors[n.layer].text} border ${layerColors[n.layer].border}`}>{n.layer}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded ${n.qualityScore >= 95 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                            质量 {n.qualityScore}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{n.cnName} · {n.owner} · 更新于 {n.updateTime}</div>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded">
                      查看详情
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 影响应用列表 */}
          <div className="bg-slate-900/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">下游应用与报表</div>
                  <div className="text-xs text-slate-400">基于此表构建的业务应用</div>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">15 个应用</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: '销售实时大屏', type: 'BI 报表', user: '运营部', priority: 'P0', Icon: BarChart3 },
                { name: 'GMV 日报推送', type: '定时任务', user: '财务部', priority: 'P0', Icon: MessageSquare },
                { name: '订单异常监控', type: '告警规则', user: '风控部', priority: 'P0', Icon: AlertTriangle },
                { name: '用户行为分析', type: '数据应用', user: '产品部', priority: 'P1', Icon: Search },
                { name: '商品销售排行', type: 'BI 报表', user: '商品部', priority: 'P1', Icon: Trophy },
                { name: '客户画像系统', type: '数据应用', user: '营销部', priority: 'P1', Icon: User },
              ].map(app => (
                <div key={app.name} className="p-3 bg-slate-950/50 border border-white/5 rounded-lg hover:border-rose-500/30 hover:bg-rose-500/5 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <app.Icon className="h-5 w-5 text-rose-300" />
                    <span className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${app.priority === 'P0' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {app.priority}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{app.name}</div>
                  <div className="text-xs text-slate-400">{app.type} · {app.user}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部：节点详情卡片（点击节点后显示） */}
      {selectedNode && viewMode === 'graph' && (
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-cyan-500/30 rounded-xl p-5 backdrop-blur-sm animate-fadeIn">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${layerColors[selectedNode.layer].gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                {selectedNode.layer}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedNode.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded ${layerColors[selectedNode.layer].bg} ${layerColors[selectedNode.layer].text} border ${layerColors[selectedNode.layer].border}`}>{selectedNode.layer}</span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">{selectedNode.cnName}</p>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">业务域</div>
              <div className="text-sm font-medium text-white">{selectedNode.domain}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">数据量</div>
              <div className="text-sm font-medium text-white">{selectedNode.rows}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">负责人</div>
              <div className="text-sm font-medium text-white">{selectedNode.owner}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">质量分</div>
              <div className={`text-sm font-bold ${selectedNode.qualityScore >= 95 ? 'text-emerald-400' : selectedNode.qualityScore >= 90 ? 'text-cyan-400' : 'text-amber-400'}`}>{selectedNode.qualityScore}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">更新时间</div>
              <div className="text-sm font-medium text-white">{selectedNode.updateTime}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => handleCenterNodeChange(selectedNode.id, selectedNode.id)}
              className="px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors"
            >
              设为中心节点
            </button>
              <button onClick={() => toast.success('影响分析视图已切换')} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors">
              查看字段血缘
            </button>
              <button onClick={() => toast('资产详情将在目录详情中打开')} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors">
              影响分析
            </button>
            <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors">
              查看详情
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
