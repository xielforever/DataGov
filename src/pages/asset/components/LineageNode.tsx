import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// 这里存放之前 SVG 中的具体节点渲染逻辑，被包装成 React Flow 的自定义 Node
export default function LineageNode({ data, isConnectable }: NodeProps) {
  const { isCenter, layer, name, cnName, rows, owner, qualityScore } = data;

  const getLayerColors = (layer: string) => {
    switch (layer) {
      case 'ODS': return { bg: 'bg-blue-500/15', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-blue-500/30' };
      case 'DWD': return { bg: 'bg-cyan-500/15', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' };
      case 'DWS': return { bg: 'bg-purple-500/15', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/30' };
      case 'ADS': return { bg: 'bg-pink-500/15', border: 'border-pink-500/50', text: 'text-pink-400', glow: 'shadow-pink-500/30' };
      default: return { bg: 'bg-amber-500/15', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-amber-500/30' };
    }
  };

  const colors = getLayerColors(layer);
  const qScoreColor = qualityScore >= 95 ? 'text-emerald-400 bg-emerald-400/10' : qualityScore >= 90 ? 'text-cyan-400 bg-cyan-400/10' : 'text-amber-400 bg-amber-400/10';

  return (
    <div 
      className={`relative w-[220px] rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-3 transition-all hover:scale-105 ${isCenter ? `shadow-lg ${colors.glow} ring-1 ring-${colors.text.split('-')[1]}-400` : ''}`}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 !bg-slate-500 border-none" />
      
      <div className="flex items-center justify-between mb-2">
        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.text} bg-black/20 uppercase`}>
          {layer}
        </div>
        {isCenter && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        )}
      </div>

      <div className="font-semibold text-white text-sm truncate" title={name}>
        {name}
      </div>
      <div className="text-xs text-slate-400 truncate mt-0.5" title={cnName}>
        {cnName || '未命名表'}
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
        <div className="text-[10px] text-slate-500 flex flex-col">
          <span>{rows} 行</span>
          <span>{owner}</span>
        </div>
        <div className={`px-2 py-1 rounded text-[11px] font-bold ${qScoreColor}`}>
          {qualityScore}
        </div>
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 !bg-slate-500 border-none" />
    </div>
  );
}