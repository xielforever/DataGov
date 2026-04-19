import { useEffect, useState } from "react";

export default function DataGovernancePanel() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "全链路数据血",
      desc: "自动化解析SQL，构建从源端到报表端的端到端资产拓扑血缘",
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      title: "元数据与质量管理",
      desc: "自动化资产盘点，智能探测质量隐患，保障企业级数据权威、合规与标准",
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "一站式敏捷开发",
      desc: "低代码/高代码融合调度平台，提供秒级监控告警，高效加速资产沉淀",
      icon: (
        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative h-full w-full max-w-2xl text-white">
      {/* 顶部企业标志和标识的描述 */}
      <div className="z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-violet-600 shadow-xl shadow-cyan-500/30">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
        <div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
            DGP-Studio
          </span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            企业版v3.2
          </span>
        </div>
      </div>

      {/* 中间酷炫的血缘动态网SVG */}
      <div className="z-10 relative flex-1 flex items-center justify-center my-8">
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          {/* 血缘网络流动图 */}
          <svg width="420" height="280" viewBox="0 0 420 280" className="text-slate-500 select-none">
            {/* 连线与动画效果 */}
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Paths */}
            <path d="M 40,80 Q 140,40 210,140" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />
            <path d="M 40,200 Q 140,240 210,140" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />
            <path d="M 210,140 L 340,60" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />
            <path d="M 210,140 L 340,220" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />

            {/* 流动的数据包粒子 */}
            <circle r="4" fill="#22d3ee" filter="url(#glow)">
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path="M 40,80 Q 140,40 210,140"
              />
            </circle>
            <circle r="4" fill="#34d399" filter="url(#glow)">
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path="M 40,200 Q 140,240 210,140"
              />
            </circle>
            <circle r="4" fill="#a78bfa" filter="url(#glow)">
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                path="M 210,140 L 340,60"
              />
            </circle>

            {/* 节点 A: 业务源库 */}
            <g transform="translate(40, 80)">
              <rect x="-30" y="-15" width="60" height="30" rx="6" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" className="animate-pulse" />
              <text y="5" textAnchor="middle" fill="#e2e8f0" fontSize="10">源数据库</text>
            </g>

            {/* 节点 B: 埋点源端 */}
            <g transform="translate(40, 200)">
              <rect x="-30" y="-15" width="60" height="30" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
              <text y="5" textAnchor="middle" fill="#e2e8f0" fontSize="10">埋点日志</text>
            </g>

            {/* 节点 C: 数据治理中心 (ODS -> DWD -> DWS) */}
            <g transform="translate(210, 140)">
              <circle r="32" fill="#0f172a" stroke="#8b5cf6" strokeWidth="3" filter="url(#glow)" className="animate-spin-slow" style={{ animationDuration: '10s' }} />
              <text y="4" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold">DW汇聚</text>
            </g>

            {/* 节点 D: 财务报表看板 */}
            <g transform="translate(340, 60)">
              <rect x="-30" y="-15" width="60" height="30" rx="6" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
              <text y="5" textAnchor="middle" fill="#cbd5e1" fontSize="10">BI报表</text>
            </g>

            {/* 节点 E: 开放服务API */}
            <g transform="translate(340, 220)">
              <rect x="-30" y="-15" width="60" height="30" rx="6" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
              <text y="5" textAnchor="middle" fill="#cbd5e1" fontSize="10">API资产</text>
            </g>
          </svg>
        </div>

        {/* 动态数字统计浮'*/}
        <div className="absolute top-10 right-20 bg-slate-900/40 border border-slate-700/50 backdrop-blur-md px-4 py-2 rounded-xl animate-float1">
          <div className="text-xs text-slate-400">元数据资'</div>
          <div className="text-xl font-bold text-cyan-400 tracking-wider">12,482 <span className="text-xs text-slate-500 font-normal">个</span></div>
        </div>
        <div className="absolute bottom-10 left-20 bg-slate-900/40 border border-slate-700/50 backdrop-blur-md px-4 py-2 rounded-xl animate-float3">
          <div className="text-xs text-slate-400">运行健康'</div>
          <div className="text-xl font-bold text-emerald-400 tracking-wider">99.85%</div>
        </div>
      </div>

      {/* 底部产品亮点轮播 */}
      <div className="z-10 bg-slate-900/30 border border-white/5 backdrop-blur-md p-6 rounded-2xl">
        <div className="flex gap-4">
          {features.map((feat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFeature(idx)}
              className={`flex-1 text-left p-3 rounded-xl transition-all duration-300 border ${
                activeFeature === idx
                  ? "bg-white/5 border-white/10 shadow-lg"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <div className="mb-2">{feat.icon}</div>
              <h3 className="text-sm font-semibold mb-1">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {feat.desc}
              </p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-1.5">
          {features.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeFeature === idx ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
