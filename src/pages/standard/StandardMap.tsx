import { useState, useEffect, useMemo } from "react";
import { fetchStandardMappings, updateStandardMappingStatus, rescanStandardMappings, createManualMapping, fetchStandardDatabases } from "../../services/api";
import Breadcrumb from "../../components/common/Breadcrumb";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type MappingStatus = "mapped" | "suggested" | "rejected";

interface StandardMappingData {
  id: string;
  standardCode: string;
  standardName: string;
  standardType: string;
  standardLength: string | number;
  database: string;
  tableName: string;
  columnName: string;
  columnType: string;
  columnLength: string | number;
  matchScore: number;
  status: MappingStatus;
  creator: string;
  updateTime: string;
}

const STATUS_CONFIG = {
  mapped: { label: "已映射", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  suggested: { label: "系统推荐", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30", dot: "bg-cyan-400" },
  rejected: { label: "已忽略", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30", dot: "bg-slate-400" },
};

export default function StandardMap() {
  const [data, setData] = useState<StandardMappingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");
  useKeyboardShortcut({
    'ctrl+n': () => setIsModalOpen(true),
    'escape': () => setIsModalOpen(false),
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedsearchKeyword = useDebounce(searchKeyword, 300);
  const [DATABASES, setDATABASES] = useState<string[]>(["全部"]);
  const [selectedDb, setSelectedDb] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState<"all" | MappingStatus>("all");
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ scannedTables: number; newMappings: number } | null>(null);
  
  const [isManualMapOpen, setIsManualMapOpen] = useState(false);
  const [manualMapForm, setManualMapForm] = useState<Partial<StandardMappingData>>({});

  const loadData = () => {
    setLoading(true);
    fetchStandardMappings().then((res) => {
      setData(res);
      setLoading(false);
    });
  };


  useEffect(() => {
    fetchStandardDatabases().then((res) => setDATABASES(["全部", ...(res as string[])])).catch(() => {});
  }, []);
  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateStandardMappingStatus(id, newStatus);
    loadData();
  };

  const handleRescan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await rescanStandardMappings();
      setScanResult(res);
      loadData();
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualMapSubmit = async () => {
    await createManualMapping(manualMapForm);
    setIsManualMapOpen(false);
    setManualMapForm({});
    loadData();
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedDb !== "全部" && item.database !== selectedDb) return false;
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
      if (
        searchKeyword && 
        !item.standardName.toLowerCase().includes(searchKeyword.toLowerCase()) && 
        !item.tableName.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !item.columnName.toLowerCase().includes(searchKeyword.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [data, searchKeyword, selectedDb, selectedStatus]);

  const stats = useMemo(() => ({
    total: data.length,
    mapped: data.filter((d) => d.status === "mapped").length,
    suggested: data.filter((d) => d.status === "suggested").length,
    rejected: data.filter((d) => d.status === "rejected").length,
  }), [data]);

  if (error) {
    return <ErrorFallback onRetry={loadData} />;
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据标准" }, { label: "标准映射" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            标准映射
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {stats.total} 条映射记录
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">管理数据标准与物理数据模型（表/字段）之间的映射关系</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRescan}
            disabled={isScanning}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            {isScanning ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
            {isScanning ? '扫描中...' : '重新扫描'}
          </button>
          <button 
            onClick={() => setIsManualMapOpen(true)}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 flex items-center">
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            手动映射
          </button>
        </div>
      </div>
      
      {/* 扫描结果提示 */}
      {scanResult && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400">扫描完成</p>
              <p className="text-xs text-slate-400">共扫描 {scanResult.scannedTables} 张表，发现了 {scanResult.newMappings} 个新的推荐映射。</p>
            </div>
          </div>
          <button onClick={() => setScanResult(null)} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "映射总数", value: stats.total, icon: "🔗", color: "from-blue-500/20 to-indigo-500/5", text: "text-blue-400" },
          { label: "已映射", value: stats.mapped, icon: "✅", color: "from-emerald-500/20 to-green-500/5", text: "text-emerald-400" },
          { label: "系统推荐", value: stats.suggested, icon: "✨", color: "from-cyan-500/20 to-teal-500/5", text: "text-cyan-400" },
          { label: "已忽略", value: stats.rejected, icon: "🚫", color: "from-slate-500/20 to-slate-400/5", text: "text-slate-400" },
        ].map((stat) => (
          <div key={stat.label} className={`relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br ${stat.color} p-5 backdrop-blur-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-400">{stat.label}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${stat.text}`}>{stat.value}</span>
                  <span className="text-sm text-slate-400">项</span>
                </div>
              </div>
              <div className="text-3xl opacity-80">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选与搜索 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索标准名称、表名或字段名..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/30 p-1">
            {[{ id: "all", label: "全部状态" }, ...Object.entries(STATUS_CONFIG).map(([id, conf]) => ({ id, label: conf.label }))].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id as any)}
                className={`rounded-md px-3 py-1 text-xs transition ${
                  selectedStatus === s.id ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">数据库</span>
            <div className="flex flex-wrap gap-1.5">
              {DATABASES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedDb(c)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    selectedDb === c
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                      : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据表 */}
<div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
<table className="min-w-[800px] w-full table-fixed">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs text-slate-400">
              <th className="px-4 py-3 font-medium w-[200px]">数据标准 (定义)</th>
              <th className="px-4 py-3 font-medium w-[100px] text-center">映射匹配度</th>
              <th className="px-4 py-3 font-medium w-[200px]">物理字段 (实际)</th>
              <th className="px-4 py-3 font-medium w-[80px]">状态</th>
              <th className="px-4 py-3 font-medium w-[120px]">更新时间</th>
              <th className="px-4 py-3 font-medium w-[100px] text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => {
              const status = STATUS_CONFIG[item.status];
              const isTypeMatch = item.standardType.toLowerCase() === item.columnType.toLowerCase();
              return (
                <tr
                  key={item.id}
                  className="group border-b border-slate-800/50 text-sm transition hover:bg-slate-800/30"
                >
                  <td className="px-4 py-4 w-[30%]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded bg-blue-500/20 p-1.5 text-blue-400 border border-blue-500/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <div className="font-medium text-white">{item.standardName}</div>
                        <div className="font-mono text-xs text-slate-500">{item.standardCode}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.standardType}({item.standardLength})
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 w-[15%]">
                    <div className="flex flex-col items-center justify-center relative">
                      <div className="w-full h-0.5 bg-slate-800 absolute top-1/2 -translate-y-1/2 -z-10"></div>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.matchScore >= 90 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        item.matchScore >= 70 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {item.matchScore}%
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                        <span className={isTypeMatch ? "text-emerald-500" : "text-red-400"}>类型{isTypeMatch ? "匹配" : "不符"}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 w-[30%]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded bg-cyan-500/20 p-1.5 text-cyan-400 border border-cyan-500/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                      </div>
                      <div>
                        <div className="font-medium text-white">{item.columnName}</div>
                        <div className="text-xs text-slate-500">{item.database}.{item.tableName}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.columnType}({item.columnLength})
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-md border ${status.border} ${status.bg} px-2 py-0.5 text-[10px] ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                      {status.label}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="text-xs text-slate-400">{item.updateTime}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">操作人: {item.creator}</div>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 transition group-hover:opacity-100">
                      {item.status === 'suggested' && (
                        <>
                          <button onClick={() => handleStatusChange(item.id, "mapped")} className="text-emerald-400 hover:text-emerald-300 text-xs">采纳</button>
                          <button onClick={() => handleStatusChange(item.id, "rejected")} className="text-slate-400 hover:text-slate-300 text-xs">忽略</button>
                        </>
                      )}
                      {item.status === 'mapped' && (
                        <button onClick={() => handleStatusChange(item.id, "rejected")} className="text-red-400 hover:text-red-300 text-xs">解除映射</button>
                      )}
                      {item.status === 'rejected' && (
                        <button onClick={() => handleStatusChange(item.id, "mapped")} className="text-cyan-400 hover:text-cyan-300 text-xs">重新映射</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 mb-3">
                    <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2-2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-sm text-slate-400">没有找到匹配的标准映射数据</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / pageSize)}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
      </div>

      {/* 手动映射弹窗 */}
      {isManualMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[600px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">手动添加标准映射</h3>
              <button onClick={() => setIsManualMapOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-5">
                {/* 步骤一：选择标准 */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">1</div>
                    <label className="text-sm font-medium text-white">选择数据标准</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">标准编码/名称 <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={manualMapForm.standardName || ""}
                        onChange={(e) => setManualMapForm({ ...manualMapForm, standardName: e.target.value, standardCode: "STD_" + e.target.value.toUpperCase() })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        placeholder="例如: 手机号码"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">标准类型</label>
                      <select
                        value={manualMapForm.standardType || "STRING"}
                        onChange={(e) => setManualMapForm({ ...manualMapForm, standardType: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        {["STRING", "INT", "DECIMAL", "DATE"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 分隔线 */}
                <div className="ml-7 flex items-center justify-center">
                  <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>

                {/* 步骤二：选择物理字段 */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">2</div>
                    <label className="text-sm font-medium text-white">选择物理字段</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">数据库 <span className="text-red-400">*</span></label>
                      <select
                        value={manualMapForm.database || "ecommerce_user"}
                        onChange={(e) => setManualMapForm({ ...manualMapForm, database: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        {DATABASES.filter(d => d !== "全部").map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">数据表 <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={manualMapForm.tableName || ""}
                        onChange={(e) => setManualMapForm({ ...manualMapForm, tableName: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        placeholder="例如: dwd_user_info"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">字段名 <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={manualMapForm.columnName || ""}
                        onChange={(e) => setManualMapForm({ ...manualMapForm, columnName: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        placeholder="例如: mobile_no"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">字段类型</label>
                      <input
                        type="text"
                        value={manualMapForm.columnType || ""}
                        onChange={(e) => setManualMapForm({ ...manualMapForm, columnType: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        placeholder="例如: varchar"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setIsManualMapOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleManualMapSubmit} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                确认映射
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
