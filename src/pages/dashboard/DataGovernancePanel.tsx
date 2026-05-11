import { useEffect, useState } from "react";
import { Database, FileCheck, Layers, Code, ShieldCheck, Share2 } from "lucide-react";

export default function DataGovernancePanel() {
  const [activeStep, setActiveStep] = useState(0);

  const workflowSteps = [
    {
      id: "integration",
      title: "数据集成",
      desc: "接入多源异构数据，实时/离线同步至数据湖或数仓",
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      color: "from-cyan-500/20 to-transparent border-cyan-500/30",
      activeColor: "bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    },
    {
      id: "standard",
      title: "数据标准",
      desc: "定义国标/行标/企标字典，统一数据口径与码值规范",
      icon: <FileCheck className="w-5 h-5 text-emerald-400" />,
      color: "from-emerald-500/20 to-transparent border-emerald-500/30",
      activeColor: "bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    },
    {
      id: "modeling",
      title: "数据建模",
      desc: "ODS/DWD/DIM/DWS/ADS 规范化分层，沉淀公共数据模型",
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      color: "from-blue-500/20 to-transparent border-blue-500/30",
      activeColor: "bg-blue-500/10 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    },
    {
      id: "development",
      title: "数据开发",
      desc: "SQL/Python/Shell 在线脚本编写与工作流任务调度",
      icon: <Code className="w-5 h-5 text-violet-400" />,
      color: "from-violet-500/20 to-transparent border-violet-500/30",
      activeColor: "bg-violet-500/10 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]",
    },
    {
      id: "quality",
      title: "数据质量",
      desc: "配置校验规则，实时监控异常数据并触发告警拦截",
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      color: "from-amber-500/20 to-transparent border-amber-500/30",
      activeColor: "bg-amber-500/10 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    },
    {
      id: "service",
      title: "数据服务",
      desc: "构建资产目录，生成 API 接口，实现数据共享与应用",
      icon: <Share2 className="w-5 h-5 text-rose-400" />,
      color: "from-rose-500/20 to-transparent border-rose-500/30",
      activeColor: "bg-rose-500/10 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,114,0.3)]",
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [workflowSteps.length]);

  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative h-full w-full max-w-2xl text-white mx-auto">
      {/* 顶部企业标志和标识的描述 */}
      <div className="z-10 flex items-center justify-start gap-3 pl-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-violet-600 shadow-xl shadow-cyan-500/30">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
        <div className="flex items-center">
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
            DGP-Studio
          </span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            企业版v3.2
          </span>
        </div>
      </div>

      {/* 中间核心业务流程图展示 */}
      <div className="z-10 relative flex-1 flex flex-col justify-center my-8">
        <div className="mb-8 text-left pl-8">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">端到端数据开发与治理流程</h2>
          <p className="text-sm text-slate-400">将零散数据转化为高质量企业资产的全生命周期管理</p>
        </div>
        
        <div className="relative w-full max-w-xl mx-auto">
          {/* 连接底层路径的动态线条 */}
          <div className="absolute left-[38px] top-8 bottom-8 w-[2px] bg-slate-800 rounded-full z-0 overflow-hidden">
            <div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent h-24 animate-pulse"
              style={{
                top: `${(activeStep / (workflowSteps.length - 1)) * 100}%`,
                transform: 'translateY(-50%)',
                transition: 'top 0.5s ease-in-out'
              }}
            />
          </div>

          <div className="flex flex-col gap-4 relative z-10">
            {workflowSteps.map((step, idx) => {
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-6 cursor-pointer group transition-all duration-300 ${isActive ? 'scale-105 transform origin-left' : 'opacity-60 hover:opacity-100'}`}
                  onClick={() => setActiveStep(idx)}
                >
                  {/* 左侧节点图标 */}
                  <div className={`w-20 flex justify-end shrink-0 transition-all duration-300 ${isActive ? 'pr-0' : 'pr-2'}`}>
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-500 relative bg-slate-900 ${isActive ? step.activeColor : isPast ? 'border-slate-600 text-slate-400' : 'border-slate-800 text-slate-600'}`}>
                      {step.icon}
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-current opacity-20 animate-ping" />
                      )}
                    </div>
                  </div>

                  {/* 右侧内容卡片 */}
                  <div className={`flex-1 p-4 rounded-xl border bg-gradient-to-r transition-all duration-500 ${isActive ? `${step.color} bg-slate-900/80 backdrop-blur-md` : 'border-slate-800/50 bg-slate-900/30'}`}>
                    <h3 className={`text-base font-bold mb-1 transition-colors ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      0{idx + 1}. {step.title}
                    </h3>
                    <p className={`text-xs leading-relaxed transition-colors ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部信息 (保持原样风格，或者替换为一句话) */}
      <div className="z-10 bg-slate-900/30 border border-white/5 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center justify-between text-sm text-slate-400">
        <span>构建可信、可视、可用、可管的数据资产体系</span>
        <div className="flex gap-2">
          {workflowSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeStep === idx ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
