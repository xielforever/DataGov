import { useState, useEffect } from "react";
import { fetchStandardEvaluations, triggerStandardEvaluation, exportStandardEvalReport } from "../../services/api";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

interface EvalData {
  overview: {
    overallScore: number;
    totalStandards: number;
    mappedStandards: number;
    compliantTables: number;
    totalTables: number;
  };
  domainScores: Array<{ name: string; score: number }>;
  trendData: Array<{ date: string; score: number; compliance: number }>;
  issueList: Array<{
    id: string;
    type: string;
    standardName: string;
    tableName: string;
    columnName: string;
    issueDesc: string;
    severity: string;
    owner: string;
    status: string;
  }>;
}

const ISSUE_TYPE_MAP: Record<string, string> = {
  type_mismatch: "类型不符",
  length_overflow: "长度超限",
  not_mapped: "未映射",
  naming_violation: "命名不规范"
};

const SEVERITY_CONFIG: Record<string, { label: string, bg: string, text: string }> = {
  high: { label: "高", bg: "bg-red-500/20", text: "text-red-400" },
  medium: { label: "中", bg: "bg-amber-500/20", text: "text-amber-400" },
  low: { label: "低", bg: "bg-blue-500/20", text: "text-blue-400" }
};

const STATUS_CONFIG: Record<string, { label: string, color: string }> = {
  pending: { label: "待处理", color: "text-red-400" },
  processing: { label: "整改中", color: "text-amber-400" },
  ignored: { label: "已忽略", color: "text-slate-400" }
};

export default function StandardEval() {
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "processing">("all");
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info', msg: string } | null>(null);

  useEffect(() => {
    fetchStandardEvaluations().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">正在评估数据标准落标情况...</p>
        </div>
      </div>
    );
  }

  const filteredIssues = data.issueList.filter(iss => activeTab === "all" || iss.status === activeTab);

  const handleStartEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await triggerStandardEvaluation();
      setToastMsg({ type: 'success', msg: `评估完成，发现了 ${res.newIssues} 个新的落标异常。` });
      
      // 重新拉取最新数据
      const newData = await fetchStandardEvaluations();
      setData(newData);
    } catch (err) {
      setToastMsg({ type: 'info', msg: '评估失败，请重试' });
    } finally {
      setIsEvaluating(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await exportStandardEvalReport();
      setToastMsg({ type: 'success', msg: '导出成功！评估报告将开始下载。' });
    } catch (err) {
      setToastMsg({ type: 'info', msg: '导出失败' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-10 relative">
      {/* 吐司提示 */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg transition-all ${
          toastMsg.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
        }`}>
          {toastMsg.type === 'success' ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span className="text-sm font-medium">{toastMsg.msg}</span>
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据标准" }, { label: "标准评估" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            落标评估
          </h1>
          <p className="mt-1 text-sm text-slate-400">多维度评估企业数据标准在物理模型的落地执行情况</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            {isExporting ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            )}
            {isExporting ? '导出中...' : '导出报告'}
          </button>
          <button 
            onClick={handleStartEvaluation}
            disabled={isEvaluating}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            {isEvaluating ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {isEvaluating ? '评估中...' : '开始评估'}
          </button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">落标总得分</div>
            <div className="rounded-full bg-cyan-500/20 p-1.5 text-cyan-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{data.overview.overallScore}</span>
            <span className="text-sm text-emerald-400 flex items-center">
              <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              0.5
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">标准覆盖率</div>
            <div className="rounded-full bg-blue-500/20 p-1.5 text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{Math.round((data.overview.mappedStandards / data.overview.totalStandards) * 100)}%</span>
            <span className="text-sm text-slate-500">{data.overview.mappedStandards} / {data.overview.totalStandards}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">表级达标率</div>
            <div className="rounded-full bg-emerald-500/20 p-1.5 text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{Math.round((data.overview.compliantTables / data.overview.totalTables) * 100)}%</span>
            <span className="text-sm text-slate-500">{data.overview.compliantTables} / {data.overview.totalTables}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">待整改问题</div>
            <div className="rounded-full bg-red-500/20 p-1.5 text-red-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{data.issueList.filter(i => i.status === 'pending').length}</span>
            <span className="text-sm text-slate-500">项未闭环</span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 趋势图 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-white">落标得分趋势 (近7天)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Area type="monotone" dataKey="score" name="评估得分" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 各业务域得分 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold text-white">各业务域落标得分</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.domainScores} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                />
                <Bar dataKey="score" name="得分" radius={[0, 4, 4, 0]} barSize={16}>
                  {data.domainScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 90 ? '#10b981' : entry.score >= 80 ? '#0ea5e9' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 不达标问题清单 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-white">落标异常问题清单</h3>
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 text-xs rounded-md transition ${activeTab === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              全部
            </button>
            <button 
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1 text-xs rounded-md transition ${activeTab === 'pending' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              待处理
            </button>
            <button 
              onClick={() => setActiveTab("processing")}
              className={`px-3 py-1 text-xs rounded-md transition ${activeTab === 'processing' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              整改中
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">问题描述</th>
                <th className="px-4 py-3 font-medium">异常类型</th>
                <th className="px-4 py-3 font-medium">涉及表 / 字段</th>
                <th className="px-4 py-3 font-medium">严重级</th>
                <th className="px-4 py-3 font-medium">责任人</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredIssues.map((issue) => {
                const severity = SEVERITY_CONFIG[issue.severity];
                const status = STATUS_CONFIG[issue.status];
                
                return (
                  <tr key={issue.id} className="hover:bg-slate-800/30 transition group">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{issue.issueDesc}</div>
                      <div className="text-xs text-slate-500 mt-0.5">关联标准: {issue.standardName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 bg-slate-800 px-2 py-1 rounded text-xs">
                        {ISSUE_TYPE_MAP[issue.type] || issue.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="text-cyan-400">{issue.tableName}</div>
                      <div className="text-slate-500">{issue.columnName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${severity.bg} ${severity.text}`}>
                        {severity.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white">
                          {issue.owner.charAt(0)}
                        </div>
                        {issue.owner}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button className="text-xs text-cyan-400 hover:text-cyan-300">派发工单</button>
                        <button className="text-xs text-slate-400 hover:text-white">忽略</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    暂无相关问题记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}