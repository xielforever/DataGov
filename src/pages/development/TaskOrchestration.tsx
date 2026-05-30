import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchOrchestrations, fetchDagNodes, fetchDagRunHistory, updateOrchestrationStatus, runOrchestration } from '../../services/api';
import Breadcrumb from '../../components/common/Breadcrumb';
import ErrorFallback from '../../components/common/ErrorFallback';
import { Skeleton } from '../../components/common/Skeleton';
import { Plus, Play, Pause, Settings, X, Clock, ChevronRight, History, ArrowRight, Loader } from 'lucide-react';

interface Orchestration {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused';
  taskCount: number;
  cron: string;
  avgDuration: string;
  lastRun: string;
  lastStatus: string;
  owner: string;
  department: string;
  createdAt: string;
}

interface DagNode {
  id: string;
  orchestrationId: string;
  name: string;
  type: 'sync' | 'compute' | 'quality' | 'service';
  scriptId: string | null;
  status: 'success' | 'running' | 'failed' | 'waiting';
  upstream: string[];
  downstream: string[];
  cron: string;
  avgDuration: string;
  lastRun: string;
  owner: string;
}

interface DagRun {
  id: string;
  orchestrationId: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'success' | 'failed';
  triggerType: string;
  tasksTotal: number;
  tasksSuccess: number;
  tasksFailed: number;
}

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  sync: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: '数据同步' },
  compute: { color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', label: '计算任务' },
  quality: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', label: '质量检测' },
  service: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: '数据服务' },
};

const statusDotClass: Record<string, string> = {
  success: 'bg-emerald-400',
  running: 'bg-cyan-400 animate-pulse',
  failed: 'bg-red-400',
  waiting: 'bg-slate-500',
};

const statusLabel: Record<string, { color: string; label: string }> = {
  success: { color: 'text-emerald-400', label: '执行成功' },
  running: { color: 'text-cyan-400', label: '运行中' },
  failed: { color: 'text-red-400', label: '已失败' },
  waiting: { color: 'text-slate-400', label: '等待执行' },
};

// Topological sort for DAG layout
function layoutDag(nodes: DagNode[]): (DagNode & { x: number; y: number; layer: number })[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const depthMap = new Map<string, number>();

  function getDepth(id: string, visited = new Set<string>()): number {
    if (depthMap.has(id)) return depthMap.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    const node = nodeMap.get(id);
    if (!node || node.upstream.length === 0) { depthMap.set(id, 0); return 0; }
    const d = Math.max(...node.upstream.map(u => getDepth(u, visited))) + 1;
    depthMap.set(id, d);
    return d;
  }

  nodes.forEach(n => getDepth(n.id));

  // Group by layer
  const layers = new Map<number, DagNode[]>();
  nodes.forEach(n => {
    const d = depthMap.get(n.id) ?? 0;
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d)!.push(n);
  });

  const result: (DagNode & { x: number; y: number; layer: number })[] = [];
  const layerSpacing = 220;
  const nodeSpacing = 70;
  const canvasPadX = 40;
  const canvasPadY = 30;

  layers.forEach((layerNodes, layerIdx) => {
    const totalHeight = (layerNodes.length - 1) * nodeSpacing;
    const startY = canvasPadY + Math.max(0, (200 - totalHeight) / 2);
    layerNodes.forEach((node, idx) => {
      result.push({
        ...node,
        x: canvasPadX + layerIdx * layerSpacing,
        y: startY + idx * nodeSpacing,
        layer: layerIdx,
      });
    });
  });

  return result;
}

export default function TaskOrchestration() {
  const [orchestrations, setOrchestrations] = useState<Orchestration[]>([]);
  const [selectedOrch, setSelectedOrch] = useState<Orchestration | null>(null);
  const [dagNodes, setDagNodes] = useState<DagNode[]>([]);
  const [runHistory, setRunHistory] = useState<DagRun[]>([]);
  const [selectedNode, setSelectedNode] = useState<DagNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bottomTab, setBottomTab] = useState<'history' | 'info'>('history');
  const [bottomOpen, setBottomOpen] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const loadOrchestrations = useCallback(async () => {
    try {
      const data = await fetchOrchestrations();
      setOrchestrations(data as Orchestration[]);
      if (!selectedOrch && (data as Orchestration[]).length > 0) {
        setSelectedOrch((data as Orchestration[])[0]);
      }
    } catch { setError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { loadOrchestrations(); }, [loadOrchestrations]);

  const loadDagData = useCallback(async (orchId: string) => {
    try {
      const [nodes, history] = await Promise.all([
        fetchDagNodes(orchId),
        fetchDagRunHistory(orchId),
      ]);
      setDagNodes(nodes as DagNode[]);
      setRunHistory(history as DagRun[]);
    } catch { setError(true); }
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    if (selectedOrch) loadDagData(selectedOrch.id);
  }, [selectedOrch, loadDagData]);

  const handleOrchStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await updateOrchestrationStatus(id, status);
      await loadOrchestrations();
    } catch { setError(true); }
    setActionLoading('');
  };

  const handleRun = async (id: string) => {
    setActionLoading(id);
    try {
      await runOrchestration(id);
      if (selectedOrch?.id === id) loadDagData(id);
    } catch { setError(true); }
    setActionLoading('');
  };

  const layoutedNodes = useMemo(() => layoutDag(dagNodes), [dagNodes]);

  // Canvas dimensions
  const canvasW = useMemo(() => {
    if (layoutedNodes.length === 0) return 600;
    return Math.max(600, Math.max(...layoutedNodes.map(n => n.x)) + 220);
  }, [layoutedNodes]);

  const canvasH = useMemo(() => {
    if (layoutedNodes.length === 0) return 200;
    return Math.max(200, Math.max(...layoutedNodes.map(n => n.y)) + 80);
  }, [layoutedNodes]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-4 pb-3 flex-shrink-0">
        <Breadcrumb items={[{ label: '数据开发' }, { label: '任务编排' }]} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Orchestration list */}
        <div className="w-64 flex-shrink-0 border-r border-slate-700/30 flex flex-col bg-slate-900/30">
          <div className="px-3 py-3 border-b border-slate-700/30 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">编排列表</span>
            <button className="p-1 text-slate-400 hover:text-cyan-400 rounded"><Plus size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : orchestrations.map(orch => {
              const isSelected = selectedOrch?.id === orch.id;
              return (
                <div key={orch.id}
                  className={`px-3 py-3 border-b border-slate-700/20 cursor-pointer transition-colors ${isSelected ? 'bg-cyan-500/5 border-l-2 border-l-cyan-400' : 'hover:bg-slate-800/40 border-l-2 border-l-transparent'}`}
                  onClick={() => setSelectedOrch(orch)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-white truncate flex-1">{orch.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${orch.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{orch.taskCount} 个节点</span>
                    <span className="text-slate-700">|</span>
                    <span className="flex items-center gap-0.5"><Clock size={10} /> {orch.cron}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className={orch.lastStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                      {orch.lastStatus === 'success' ? '成功' : '失败'}
                    </span>
                    <span className="text-slate-600">{orch.lastRun}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: DAG + bottom panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          {selectedOrch && (
            <div className="px-4 py-2.5 border-b border-slate-700/30 flex items-center gap-3 bg-slate-900/20">
              <span className="text-sm font-medium text-white">{selectedOrch.name}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${selectedOrch.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                {selectedOrch.status === 'active' ? '运行中' : '已暂停'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1"><History size={12} /> {runHistory.length} 次运行</span>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => handleRun(selectedOrch.id)} disabled={actionLoading === selectedOrch.id}
                  className="px-3 py-1.5 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 disabled:opacity-50">
                  {actionLoading === selectedOrch.id ? <Loader size={10} className="animate-spin" /> : <Play size={10} />} 运行
                </button>
                <button onClick={() => handleOrchStatus(selectedOrch.id, selectedOrch.status === 'active' ? 'paused' : 'active')}
                  disabled={actionLoading === selectedOrch.id}
                  className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1 disabled:opacity-50">
                  {selectedOrch.status === 'active' ? <><Pause size={10} /> 暂停</> : <><Play size={10} /> 恢复</>}
                </button>
                <button className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1">
                  <Settings size={10} /> 编辑
                </button>
              </div>
            </div>
          )}

          {error && <div className="flex-1"><ErrorFallback onRetry={loadOrchestrations} /></div>}
          {/* DAG Canvas + Node detail */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-slate-950/30">
              {!selectedOrch ? (
                <div className="flex items-center justify-center h-full text-slate-600 text-sm">选择左侧编排查看 DAG</div>
              ) : layoutedNodes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-600 text-sm">暂无节点</div>
              ) : (
                <div className="p-4">
                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <span className="text-slate-500">节点类型:</span>
                    {Object.entries(typeConfig).map(([k, v]) => (
                      <span key={k} className={`flex items-center gap-1 ${v.color}`}>{v.label}</span>
                    ))}
                    <span className="text-slate-500 ml-4">状态:</span>
                    <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 成功</span>
                    <span className="flex items-center gap-1 text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> 运行中</span>
                    <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400" /> 失败</span>
                    <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-500" /> 等待</span>
                  </div>

                  <svg width={canvasW} height={canvasH} className="bg-slate-900/40 rounded-xl border border-slate-700/30">
                    <defs>
                      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#475569" opacity="0.6" />
                      </marker>
                      <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#06b6d4" opacity="0.8" />
                      </marker>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>

                    {/* Edges */}
                    {layoutedNodes.map(node =>
                      node.downstream.map(targetId => {
                        const target = layoutedNodes.find(n => n.id === targetId);
                        if (!target) return null;
                        const isActive = selectedNode?.id === node.id || selectedNode?.id === targetId;
                        const x1 = node.x + 160;
                        const y1 = node.y + 22;
                        const x2 = target.x;
                        const y2 = target.y + 22;
                        const cx1 = x1 + (x2 - x1) * 0.4;
                        const cx2 = x2 - (x2 - x1) * 0.4;
                        return (
                          <g key={`${node.id}-${targetId}`}>
                            <path d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                              fill="none" stroke={isActive ? '#06b6d4' : '#334155'} strokeWidth={isActive ? 2 : 1.5}
                              markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                              opacity={isActive ? 0.8 : 0.5} />
                          </g>
                        );
                      })
                    )}

                    {/* Nodes */}
                    {layoutedNodes.map(node => {
                      const tc = typeConfig[node.type];
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                          <rect x={node.x} y={node.y} width={160} height={44} rx={8}
                            fill={isSelected ? 'rgba(6,182,212,0.12)' : 'rgba(15,23,42,0.9)'}
                            stroke={isSelected ? '#06b6d4' : 'rgba(71,85,105,0.4)'}
                            strokeWidth={isSelected ? 2 : 1}
                            filter={isSelected ? 'url(#glow)' : undefined} />
                          <circle cx={node.x + 16} cy={node.y + 22} r={4} className={statusDotClass[node.status]} />
                          <text x={node.x + 28} y={node.y + 18} fill="white" fontSize="11" fontFamily="system-ui">
                            {node.name.length > 14 ? node.name.slice(0, 14) + '...' : node.name}
                          </text>
                          <text x={node.x + 28} y={node.y + 34} fontSize="9" fill={tc.color.replace('text-', '')} className={tc.color}>
                            {tc.label}
                          </text>
                          <text x={node.x + 145} y={node.y + 26} textAnchor="end" fontSize="9" fill="#64748b">
                            {node.avgDuration}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Node detail panel */}
            {selectedNode && (
              <div className="w-72 flex-shrink-0 border-l border-slate-700/30 bg-slate-900/50 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
                  <span className="text-sm text-white font-medium truncate">{selectedNode.name}</span>
                  <button onClick={() => setSelectedNode(null)} className="p-1 text-slate-500 hover:text-white"><X size={14} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded border ${typeConfig[selectedNode.type].bg} ${typeConfig[selectedNode.type].color}`}>
                      {typeConfig[selectedNode.type].label}
                    </span>
                    <span className={`flex items-center gap-1 text-xs ${statusLabel[selectedNode.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass[selectedNode.status]}`} />
                      {statusLabel[selectedNode.status].label}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      ['调度周期', selectedNode.cron],
                      ['平均耗时', selectedNode.avgDuration],
                      ['最近执行', selectedNode.lastRun],
                      ['负责人', selectedNode.owner],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-slate-300 text-right max-w-[160px] truncate">{value}</span>
                      </div>
                    ))}
                  </div>

                  {selectedNode.scriptId && (
                    <div className="text-xs">
                      <span className="text-slate-500">关联脚本: </span>
                      <span className="text-cyan-400 cursor-pointer hover:underline">{selectedNode.scriptId}</span>
                    </div>
                  )}

                  {/* Upstream */}
                  {selectedNode.upstream.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-500">上游依赖</div>
                      {selectedNode.upstream.map(uid => {
                        const un = dagNodes.find(n => n.id === uid);
                        return un ? (
                          <div key={uid} className="flex items-center gap-2 text-xs bg-slate-800/60 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-800"
                            onClick={() => setSelectedNode(un)}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass[un.status]}`} />
                            <span className="text-slate-300 truncate">{un.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Downstream */}
                  {selectedNode.downstream.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-500">下游任务</div>
                      {selectedNode.downstream.map(did => {
                        const dn = dagNodes.find(n => n.id === did);
                        return dn ? (
                          <div key={did} className="flex items-center gap-2 text-xs bg-slate-800/60 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-800"
                            onClick={() => setSelectedNode(dn)}>
                            <ArrowRight size={10} className="text-slate-600" />
                            <span className="text-slate-300 truncate">{dn.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 px-3 py-1.5 text-xs rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-center flex items-center justify-center gap-1">
                      <Play size={10} /> 运行
                    </button>
                    <button className="flex-1 px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-center">编辑</button>
                    <button className="flex-1 px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-center">日志</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom panel */}
          {selectedOrch && (
            <div className={`flex-shrink-0 border-t border-slate-700/30 bg-slate-900/40 flex flex-col ${bottomOpen ? 'h-48' : 'h-10'}`}>
              <div className="flex items-center px-4 py-2 border-b border-slate-700/20 gap-4">
                <button onClick={() => setBottomOpen(!bottomOpen)} className="text-slate-400 hover:text-white">
                  <ChevronRight size={14} className={`transition-transform ${bottomOpen ? 'rotate-90' : ''}`} />
                </button>
                <button onClick={() => setBottomTab('history')}
                  className={`text-xs pb-1 border-b-2 ${bottomTab === 'history' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
                  运行历史
                </button>
                <button onClick={() => setBottomTab('info')}
                  className={`text-xs pb-1 border-b-2 ${bottomTab === 'info' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
                  编排信息
                </button>
              </div>
              {bottomOpen && (
                <div className="flex-1 overflow-y-auto">
                  {bottomTab === 'history' ? (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-700/30">
                          <th className="px-4 py-2 font-medium w-[160px]">开始时间</th>
                          <th className="px-4 py-2 font-medium w-[160px]">结束时间</th>
                          <th className="px-4 py-2 font-medium w-[120px]">耗时</th>
                          <th className="px-4 py-2 font-medium w-[80px]">状态</th>
                          <th className="px-4 py-2 font-medium w-[80px]">触发方式</th>
                          <th className="px-4 py-2 font-medium w-[120px]">任务结果</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runHistory.map(run => (
                          <tr key={run.id} className="border-b border-slate-700/20 hover:bg-slate-800/30">
                            <td className="px-4 py-2 text-slate-300">{run.startTime}</td>
                            <td className="px-4 py-2 text-slate-400">{run.endTime}</td>
                            <td className="px-4 py-2 text-slate-400">{run.duration}</td>
                            <td className="px-4 py-2">
                              <span className={run.status === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                                {run.status === 'success' ? '成功' : '失败'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-400">{run.triggerType === 'scheduled' ? '定时' : '手动'}</td>
                            <td className="px-4 py-2">
                              <span className="text-emerald-400">{run.tasksSuccess}</span>
                              <span className="text-slate-600"> / </span>
                              <span className={run.tasksFailed > 0 ? 'text-red-400' : 'text-slate-400'}>{run.tasksFailed}</span>
                              <span className="text-slate-600"> / {run.tasksTotal}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                      {[
                        ['名称', selectedOrch.name],
                        ['描述', selectedOrch.description],
                        ['调度周期', selectedOrch.cron],
                        ['平均耗时', selectedOrch.avgDuration],
                        ['最近运行', selectedOrch.lastRun],
                        ['节点数', `${selectedOrch.taskCount} 个`],
                        ['负责人', selectedOrch.owner],
                        ['部门', selectedOrch.department],
                        ['创建时间', selectedOrch.createdAt],
                        ['状态', selectedOrch.status === 'active' ? '运行中' : '已暂停'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex gap-3">
                          <span className="text-slate-500 w-16 flex-shrink-0">{label}</span>
                          <span className="text-slate-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
