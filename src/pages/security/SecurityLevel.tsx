import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCheck2,
  Filter,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchSecurityLevelAssets,
  fetchSecurityLevelDistribution,
  fetchSecurityLevelOverview,
  fetchSecurityLevelReviews,
  fetchSecurityLevelRules,
  updateSecurityLevelReviewStatus,
} from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type SecurityLevelCode = "L1" | "L2" | "L3" | "L4";
type ReviewStatus = "pending" | "approved" | "rejected";

interface SecurityOverview {
  totalAssets: number;
  classifiedAssets: number;
  sensitiveAssets: number;
  pendingReviews: number;
  autoClassifiedRate: number;
  highRiskAssets: number;
}

interface LevelDistribution {
  level: SecurityLevelCode;
  label: string;
  count: number;
  ratio: number;
}

interface SecurityRule {
  id: string;
  name: string;
  level: SecurityLevelCode;
  category: string;
  matchPattern: string;
  hitCount: number;
  owner: string;
  status: "enabled" | "disabled";
}

interface SecurityAsset {
  id: string;
  name: string;
  cnName: string;
  type: string;
  domain: string;
  owner: string;
  level: SecurityLevelCode;
  tags: string[];
  evidence: string;
  updateTime: string;
  reviewStatus: ReviewStatus;
}

interface SecurityReview {
  id: string;
  assetName: string;
  currentLevel: SecurityLevelCode;
  suggestedLevel: SecurityLevelCode;
  reason: string;
  applicant: string;
  applyTime: string;
  status: ReviewStatus;
}

const levelConfig: Record<SecurityLevelCode, { label: string; color: string; bg: string; border: string; bar: string }> = {
  L1: { label: "公开", color: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30", bar: "bg-emerald-400" },
  L2: { label: "内部", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30", bar: "bg-cyan-400" },
  L3: { label: "敏感", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30", bar: "bg-amber-400" },
  L4: { label: "核心敏感", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30", bar: "bg-red-400" },
};

const reviewStatusConfig: Record<ReviewStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "待复核", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  approved: { label: "已确认", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  rejected: { label: "已驳回", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
};

export default function SecurityLevel() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [distribution, setDistribution] = useState<LevelDistribution[]>([]);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [assets, setAssets] = useState<SecurityAsset[]>([]);
  const [reviews, setReviews] = useState<SecurityReview[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<"all" | SecurityLevelCode>("all");
  const [selectedDomain, setSelectedDomain] = useState("全部");
  const [keyword, setKeyword] = useState("");
  useKeyboardShortcut({
    'f': () => { document.querySelector<HTMLInputElement>('input[type=text]')?.focus() }
  });

  const debouncedkeyword = useDebounce(keyword, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, distributionData, ruleData, assetData, reviewData] = await Promise.all([
        fetchSecurityLevelOverview(),
        fetchSecurityLevelDistribution(),
        fetchSecurityLevelRules(),
        fetchSecurityLevelAssets(),
        fetchSecurityLevelReviews(),
      ]);
      setOverview(overviewData);
      setDistribution(distributionData);
      setRules(ruleData);
      setAssets(assetData);
      setReviews(reviewData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const domains = useMemo(() => ["全部", ...Array.from(new Set(assets.map((asset) => asset.domain)))], [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (selectedLevel !== "all" && asset.level !== selectedLevel) return false;
      if (selectedDomain !== "全部" && asset.domain !== selectedDomain) return false;
      if (keyword) {
        const text = `${asset.name} ${asset.cnName} ${asset.owner} ${asset.tags.join(" ")}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [assets, keyword, selectedDomain, selectedLevel]);

  const pendingReviews = useMemo(() => reviews.filter((review) => review.status === "pending"), [reviews]);

  const changeReviewStatus = async (review: SecurityReview, status: ReviewStatus) => {
    const updated = await updateSecurityLevelReviewStatus(review.id, status);
    setReviews((prev) => prev.map((item) => (item.id === review.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载安全分级...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据安全" }, { label: "安全分级" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            安全分级
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {overview.classifiedAssets} 已分级
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            基于数据内容、业务影响和合规要求识别资产安全等级，统一驱动敏感识别、脱敏策略、访问控制和审计范围。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="资产总数" value={overview.totalAssets} desc={`自动分级率 ${overview.autoClassifiedRate}%`} icon={Database} tone="text-cyan-300" />
        <KpiCard label="敏感资产" value={overview.sensitiveAssets} desc="L3/L4 资产合计" icon={ShieldAlert} tone="text-amber-300" />
        <KpiCard label="待复核" value={overview.pendingReviews} desc="分级变更与人工确认" icon={FileCheck2} tone="text-blue-300" />
        <KpiCard label="高风险资产" value={overview.highRiskAssets} desc="核心敏感且访问频繁" icon={LockKeyhole} tone="text-red-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              分级分布
            </h2>
            <p className="mt-1 text-xs text-slate-500">按 L1-L4 展示当前资产安全等级覆盖情况。</p>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {distribution.map((item) => {
              const config = levelConfig[item.level];
              return (
                <button
                  key={item.level}
                  onClick={() => setSelectedLevel(item.level)}
                  className={`rounded-lg border p-4 text-left transition hover:border-cyan-500/40 ${
                    selectedLevel === item.level ? "border-cyan-500/50 bg-cyan-500/10" : `bg-slate-950/60 ${config.border}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`rounded px-2 py-1 text-xs ${config.bg} ${config.color}`}>{item.level} · {config.label}</span>
                      <div className="mt-3 text-2xl font-semibold text-white">{item.count}</div>
                    </div>
                    <div className="text-right text-sm text-slate-400">{item.ratio}%</div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full rounded-full ${config.bar}`} style={{ width: `${item.ratio}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Filter className="h-4 w-4 text-cyan-300" />
              分级规则
            </h2>
            <p className="mt-1 text-xs text-slate-500">自动识别规则与命中资产数量。</p>
          </div>
          <div className="max-h-[430px] space-y-3 overflow-y-auto p-4">
            {rules.map((rule) => {
              const config = levelConfig[rule.level];
              return (
                <article key={rule.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${config.bg} ${config.color}`}>{rule.level}</span>
                        <h3 className="text-sm font-medium text-white">{rule.name}</h3>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{rule.category} · {rule.owner}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{rule.hitCount}</div>
                      <div className="text-[11px] text-slate-500">命中</div>
                    </div>
                  </div>
                  <div className="mt-3 break-all rounded-md border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-cyan-100">
                    {rule.matchPattern}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Tag className="h-4 w-4 text-cyan-300" />
              分级资产
            </h2>
            <p className="mt-1 text-xs text-slate-500">资产级别、命中证据、责任人和复核状态。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索资产、标签、负责人"
                className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <select value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
              {domains.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
            </select>
            <select value={selectedLevel} onChange={(event) => setSelectedLevel(event.target.value as "all" | SecurityLevelCode)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
              <option value="all">全部等级</option>
              <option value="L1">L1 公开</option>
              <option value="L2">L2 内部</option>
              <option value="L3">L3 敏感</option>
              <option value="L4">L4 核心敏感</option>
            </select>
          </div>
        </div>
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {paginatedFilteredAssets.map((asset) => {
            const level = levelConfig[asset.level];
            const review = reviewStatusConfig[asset.reviewStatus];
            return (
              <article key={asset.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-xs ${level.bg} ${level.color}`}>{asset.level} · {level.label}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${review.bg} ${review.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${review.dot}`} />
                        {review.label}
                      </span>
                      <h3 className="text-sm font-medium text-white">{asset.cnName}</h3>
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">{asset.name}</div>
                  </div>
                  <div className="text-xs text-slate-500">{asset.updateTime}</div>
                </div>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <Metric label="类型" value={asset.type} />
                  <Metric label="业务域" value={asset.domain} />
                  <Metric label="责任人" value={asset.owner} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {asset.tags.map((tag) => (
                    <span key={tag} className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{tag}</span>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">
                  {asset.evidence}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            待复核队列
          </h2>
          <p className="mt-1 text-xs text-slate-500">人工确认自动分级建议，避免误判影响授权和脱敏策略。</p>
        </div>
        <div className="space-y-3 p-4">
          {pendingReviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs ${levelConfig[review.currentLevel].bg} ${levelConfig[review.currentLevel].color}`}>当前 {review.currentLevel}</span>
                    <span className={`rounded px-2 py-1 text-xs ${levelConfig[review.suggestedLevel].bg} ${levelConfig[review.suggestedLevel].color}`}>建议 {review.suggestedLevel}</span>
                    <h3 className="text-sm font-medium text-white">{review.assetName}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{review.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => changeReviewStatus(review, "rejected")} className="rounded-md px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">驳回</button>
                  <button onClick={() => changeReviewStatus(review, "approved")} className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20">确认</button>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">{review.applicant} · {review.applyTime}</div>
            </article>
          ))}
          {pendingReviews.length === 0 && <div className="py-10 text-center text-sm text-slate-500">当前没有待复核分级</div>}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  desc,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  desc: string;
  icon: typeof Database;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{desc}</div>
        </div>
        <div className={`rounded-lg border border-slate-700 bg-slate-950 p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-200">{value}</div>
    </div>
  );
}
