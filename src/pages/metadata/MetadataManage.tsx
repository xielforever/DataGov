import { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchMetadataMaintainData } from '../../services/api';
import { StatsSkeleton, CardSkeleton } from '../../components/common/Skeleton';
import ErrorFallback from '../../components/common/ErrorFallback';

type MaintainStatus = 'pending' | 'in-progress' | 'review' | 'completed';
type WorkOrderStatus = 'todo' | 'processing' | 'review' | 'done';

type MaintainField = {
  name: string;
  type: string;
  nullable: boolean;
  comment: string;
  standard: string;
  status: 'complete' | 'missing';
};

type MaintainTimeline = {
  time: string;
  action: string;
  operator: string;
  detail: string;
};

type MaintainAsset = {
  id: string;
  name: string;
  cnName: string;
  layer: string;
  domain: string;
  owner: string;
  department: string;
  status: MaintainStatus;
  completeness: number;
  updateTime: string;
  issueCount: number;
  database: string;
  description: string;
  tags: string[];
  issues: string[];
  fields: MaintainField[];
  timeline: MaintainTimeline[];
};

type WorkOrder = {
  id: string;
  title: string;
  assetName: string;
  assignee: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: WorkOrderStatus;
  dueDate: string;
  source: string;
  progress: number;
};

type Snapshot = {
  id: string;
  assetName: string;
  version: string;
  changedFields: number;
  changedBy: string;
  createdAt: string;
  summary: string;
  type: 'manual' | 'workflow' | 'review' | 'auto';
};

type StatItem = {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: string;
  color: string;
  icon: string;
};

const statusMeta: Record<MaintainStatus, { label: string; className: string }> = {
  pending: { label: '待维', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  'in-progress': { label: '维护', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
  review: { label: '待审', className: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  completed: { label: '已完', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
};

const orderStatusMeta: Record<WorkOrderStatus, { label: string; className: string }> = {
  todo: { label: '待处', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  processing: { label: '处理', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
  review: { label: '待审', className: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  done: { label: '已完', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
};

const priorityMeta: Record<WorkOrder['priority'], string> = {
  P0: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  P1: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  P2: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  P3: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

const layerMeta: Record<string, string> = {
  ODS: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  DWD: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  DWS: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  ADS: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  DIM: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

function scoreClass(score: number) {
  if (score >= 95) return 'text-emerald-300';
  if (score >= 90) return 'text-cyan-300';
  if (score >= 80) return 'text-amber-300';
  return 'text-rose-300';
}

export default function MetadataManage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'assets' | 'orders' | 'snapshots'>('assets');
  const [stats, setStats] = useState<StatItem[]>([]);
  const [assets, setAssets] = useState<MaintainAsset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MaintainStatus>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'fields' | 'timeline'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    owner: '',
    department: '',
    tagsText: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchMetadataMaintainData();
      setStats((data.stats || []) as StatItem[]);
      setAssets((data.assets || []) as MaintainAsset[]);
      setWorkOrders((data.workOrders || []) as WorkOrder[]);
      setSnapshots((data.snapshots || []) as Snapshot[]);
      if (data.assets && data.assets.length > 0) {
        setSelectedAssetId(data.assets[0].id);
        setEditForm({
          description: data.assets[0].description,
          owner: data.assets[0].owner,
          department: data.assets[0].department,
          tagsText: data.assets[0].tags.join(''),
        });
      }
      setLoading(false);
    };

    load();
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const hitKeyword = !keyword || [
        asset.name,
        asset.cnName,
        asset.owner,
        asset.domain,
        asset.description,
      ].some((value) => value.toLowerCase().includes(keyword.toLowerCase()));
      const hitStatus = statusFilter === 'all' || asset.status === statusFilter;
      return hitKeyword && hitStatus;
    });
  }, [assets, keyword, statusFilter]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) || null,
    [assets, selectedAssetId],
  );

  useEffect(() => {
    if (!selectedAsset && assets.length > 0) {
      setSelectedAssetId(assets[0].id);
      return;
    }
    if (selectedAsset) {
      setEditForm({
        description: selectedAsset.description,
        owner: selectedAsset.owner,
        department: selectedAsset.department,
        tagsText: selectedAsset.tags.join(''),
      });
    }
  }, [selectedAsset, assets]);

  const missingFieldCount = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.fields.filter((field) => field.status === 'missing').length, 0),
    [assets],
  );

  const dueTodayCount = useMemo(
    () => workOrders.filter((item) => item.dueDate.includes('今天')).length,
    [workOrders],
  );

  const domainSummary = useMemo(() => {
    const result = new Map<string, { count: number; pending: number }>();
    assets.forEach((asset) => {
      const current = result.get(asset.domain) || { count: 0, pending: 0 };
      current.count += 1;
      if (asset.status !== 'completed') current.pending += 1;
      result.set(asset.domain, current);
    });
    return Array.from(result.entries()).map(([name, value]) => ({ name, ...value }));
  }, [assets]);

  const saveAsset = async () => {
    if (!selectedAsset) return;
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const nextTags = editForm.tagsText
      .split(/['，]/)
      .map((item) => item.trim())
      .filter(Boolean);
    setAssets((prev) => prev.map((asset) => asset.id === selectedAsset.id
      ? {
          ...asset,
          description: editForm.description,
          owner: editForm.owner,
          department: editForm.department,
          tags: nextTags,
          updateTime: '刚刚',
        }
      : asset,
    ));
    setSaving(false);
    setEditMode(false);
  };

  const completeIssue = (fieldName: string) => {
    if (!selectedAsset) return;
    setAssets((prev) => prev.map((asset) => {
      if (asset.id !== selectedAsset.id) return asset;
      const nextFields = asset.fields.map((field) => field.name === fieldName
        ? { ...field, comment: field.comment || '已补充业务注', status: 'complete' as const }
        : field,
      );
      const nextIssueCount = Math.max(0, nextFields.filter((field) => field.status === 'missing').length + Math.max(0, asset.issues.length - 1));
      return {
        ...asset,
        fields: nextFields,
        completeness: Math.min(100, asset.completeness + 4),
        issueCount: nextIssueCount,
        updateTime: '刚刚',
      };
    }));
  };

  const openAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setDrawerOpen(true);
    setDetailTab('overview');
    setEditMode(false);
  };

  // 移除了全屏loading，改用内容区域skeleton/placeholder
  const renderStatsSkeleton = () => <StatsSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: '元数据管' }, { label: '元数据维' }]} />
          <h1 className="text-2xl font-bold text-white">元数据维</h1>
          <p className="mt-1 text-sm text-slate-400">围绕表描述、字段注释、负责人、标准映射与版本快照，完成元数据的持续维护和闭环治理'</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">
            导出维护报告
          </button>
          <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90">
            发起维护工单
          </button>
        </div>
      </div>


      {loading && stats.length === 0 ? (
        renderStatsSkeleton()
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {stats.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg">{item.icon}</span>
                <span className={`bg-gradient-to-r ${item.color} bg-clip-text text-xs font-medium text-transparent`}>{item.change}</span>
              </div>
              <div className={`bg-gradient-to-r ${item.color} bg-clip-text text-2xl font-bold text-transparent`}>
                {item.value}
                <span className="ml-1 text-sm">{item.unit}</span>
              </div>
              <div className="mt-1 text-sm text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-800/60 p-1">
        {([
          { key: 'assets', label: '待维护资', icon: '🧩' },
          { key: 'orders', label: '维护工单', icon: '📮' },
          { key: 'snapshots', label: '版本快照', icon: '🕘' },
        ] as const).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition ${
              tab === item.key
                ? 'border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <div className="grid gap-6 xl:grid-cols-[1.65fr_0.95fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
              <div className="relative min-w-[240px] flex-1">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索表名、中文名、负责人、业务域"
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'all', label: '全部' },
                  { key: 'pending', label: '待维' },
                  { key: 'in-progress', label: '维护' },
                  { key: 'review', label: '待审' },
                  { key: 'completed', label: '已完' },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                      statusFilter === item.key
                        ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                        : 'border-slate-700/60 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {loading && assets.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              ) : filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => openAsset(asset.id)}
                  className="group cursor-pointer rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-slate-800/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${layerMeta[asset.layer] || 'border-slate-600 bg-slate-700/50 text-slate-300'}`}>{asset.layer}</span>
                        <h3 className="text-base font-semibold text-white group-hover:text-cyan-300">{asset.name}</h3>
                        <span className="text-sm text-slate-400">{asset.cnName}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{asset.description}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${statusMeta[asset.status].className}`}>{statusMeta[asset.status].label}</span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div>
                        <div className="text-xs text-slate-500">业务域 / 负责人</div>
                        <div className="mt-1 text-sm text-slate-200">{asset.domain} · {asset.owner}</div>
                      </div>
                    <div>
                      <div className="text-xs text-slate-500">库表位置</div>
                      <div className="mt-1 text-sm text-slate-200">{asset.database}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">待维护项</div>
                      <div className="mt-1 text-sm text-amber-300">{asset.issueCount} '</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">完整'</div>
                      <div className={`mt-1 text-sm font-semibold ${scoreClass(asset.completeness)}`}>{asset.completeness}%</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>维护进度</span>
                      <span>{asset.completeness}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900/70">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${asset.completeness}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/50 pt-3 text-xs text-slate-500">
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-slate-300">{tag}</span>
                      ))}
                    </div>
                    <span>最近更新：{asset.updateTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">维护看板</h3>
                <span className="text-xs text-cyan-300">实时汇'</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <div className="text-xs text-slate-500">缺失字段注释</div>
                  <div className="mt-2 text-2xl font-bold text-amber-300">{missingFieldCount}</div>
                  <div className="mt-1 text-xs text-slate-500">优先处理核心资产与敏感字'</div>
                </div>
                <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <div className="text-xs text-slate-500">今日到期工单</div>
                  <div className="mt-2 text-2xl font-bold text-cyan-300">{dueTodayCount}</div>
                  <div className="mt-1 text-xs text-slate-500">建议'P0 / P1 优先级推'</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">业务域维护分</h3>
                <span className="text-xs text-slate-500">按待维护资产统计</span>
              </div>
              <div className="space-y-3">
                {domainSummary.map((item) => (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{item.name}</span>
                      <span>{item.pending}/{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900/70">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${(item.pending / item.count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
              <h3 className="mb-4 text-sm font-semibold text-white">维护建议</h3>
              <div className="space-y-3 text-sm text-slate-300">
                {[
                    '优先补齐核心资产字段注释，避免目录检索可读性下降。',
                    '高敏感资产建议同步维护安全分级与保留策略。',
                    '采集变更后 24 小时内完成元数据工单闭环。',
                  ].map((tip) => (
                  <div key={tip} className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2.5 text-slate-400">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {workOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">{order.id}</div>
                  <h3 className="mt-1 text-base font-semibold text-white">{order.title}</h3>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs ${orderStatusMeta[order.status].className}`}>{orderStatusMeta[order.status].label}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-1 text-xs ${priorityMeta[order.priority]}`}>{order.priority}</span>
                <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-300">{order.source}</span>
                <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-300">{order.assetName}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">处理'</div>
                  <div className="mt-1 text-slate-200">{order.assignee}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">到期时间</div>
                  <div className="mt-1 text-slate-200">{order.dueDate}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>处理进度</span>
                  <span>{order.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900/70">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${order.progress}%` }} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-4">
                <button className="text-sm text-cyan-300 transition hover:text-cyan-200">查看详情</button>
                <button className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">继续处理</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'snapshots' && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.5fr_0.7fr_0.8fr_0.8fr] gap-4 border-b border-slate-700/50 bg-slate-900/40 px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
            <span>资产 / 摘要</span>
            <span>快照版本</span>
            <span>变更字段</span>
            <span>类型</span>
            <span>维护'</span>
            <span>时间</span>
          </div>
          <div className="divide-y divide-slate-700/40">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="grid grid-cols-[1.2fr_0.8fr_0.5fr_0.7fr_0.8fr_0.8fr] gap-4 px-5 py-4 text-sm">
                <div>
                  <div className="font-medium text-white">{snapshot.assetName}</div>
                  <div className="mt-1 text-xs text-slate-400">{snapshot.summary}</div>
                </div>
                <div className="text-slate-300">{snapshot.version}<div className="mt-1 text-xs text-slate-500">{snapshot.id}</div></div>
                <div className="text-slate-300">{snapshot.changedFields} '</div>
                <div>
                  <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-300">{snapshot.type}</span>
                </div>
                <div className="text-slate-300">{snapshot.changedBy}</div>
                <div className="text-slate-400">{snapshot.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`fixed inset-y-0 right-0 z-40 w-full max-w-2xl transform border-l border-slate-700/50 bg-slate-950/96 backdrop-blur-xl transition duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedAsset && (
          <>
            <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${layerMeta[selectedAsset.layer] || 'border-slate-600 bg-slate-700/50 text-slate-300'}`}>{selectedAsset.layer}</span>
                  <h2 className="text-xl font-semibold text-white">{selectedAsset.name}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-400">{selectedAsset.cnName} · {selectedAsset.domain} · 最近更'{selectedAsset.updateTime}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white">
                '              </button>
            </div>

            <div className="border-b border-slate-800 px-6 py-3">
              <div className="flex items-center gap-1 rounded-lg bg-slate-900/70 p-1">
                {([
                  { key: 'overview', label: '概览维护' },
                  { key: 'fields', label: '字段维护' },
                  { key: 'timeline', label: '变更时间' },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setDetailTab(item.key)}
                    className={`rounded-md px-3 py-2 text-sm transition ${detailTab === item.key ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[calc(100vh-145px)] overflow-y-auto px-6 py-5">
              {detailTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="text-xs text-slate-500">元数据完整率</div>
                      <div className={`mt-2 text-2xl font-bold ${scoreClass(selectedAsset.completeness)}`}>{selectedAsset.completeness}%</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="text-xs text-slate-500">待维护项</div>
                      <div className="mt-2 text-2xl font-bold text-amber-300">{selectedAsset.issueCount}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <div className="text-xs text-slate-500">字段总数</div>
                      <div className="mt-2 text-2xl font-bold text-cyan-300">{selectedAsset.fields.length}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">基础元数</h3>
                      {editMode ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditMode(false)} className="rounded-lg border border-slate-700/60 px-3 py-1.5 text-sm text-slate-300">取消</button>
                          <button onClick={saveAsset} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-sm font-medium text-white">
                            {saving ? '保存中' : '保存维护'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setEditMode(true)} className="rounded-lg border border-slate-700/60 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-600">
                          编辑
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 text-xs text-slate-500">表描'</div>
                        {editMode ? (
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full rounded-lg border border-slate-700/60 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                          />
                        ) : (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300">{selectedAsset.description}</div>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="mb-1 text-xs text-slate-500">负责人'</div>
                          {editMode ? (
                            <input
                              value={editForm.owner}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, owner: e.target.value }))}
                              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                            />
                          ) : (
                            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300">{selectedAsset.owner}</div>
                          )}
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-slate-500">所属部门'</div>
                          {editMode ? (
                            <input
                              value={editForm.department}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                            />
                          ) : (
                            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300">{selectedAsset.department}</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">资产标签</div>
                        {editMode ? (
                          <input
                            value={editForm.tagsText}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                            className="w-full rounded-lg border border-slate-700/60 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                            {selectedAsset.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-xs text-slate-300">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <h3 className="mb-4 text-sm font-semibold text-white">待维护问</h3>
                    <div className="space-y-2">
                      {selectedAsset.issues.length > 0 ? selectedAsset.issues.map((issue) => (
                        <div key={issue} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300">
                          <span>{issue}</span>
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">待处'</span>
                        </div>
                      )) : (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-300">当前资产暂无待维护问题'</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'fields' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                    这里聚焦字段级维护。点击“补齐注释”可快速完成缺失字段说明，后续可进一步接入批量维护与标准映射流程'                  </div>
                  <div className="space-y-3">
                    {selectedAsset.fields.map((field) => (
                      <div key={field.name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-cyan-300">{field.name}</span>
                              <span className="rounded-md border border-slate-700/60 bg-slate-950/80 px-2 py-0.5 text-xs text-slate-300">{field.type}</span>
                              {!field.nullable && <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">NOT NULL</span>}
                            </div>
                            <div className="mt-2 text-sm text-slate-400">注释：{field.comment || '暂未维护'}</div>
                            <div className="mt-1 text-xs text-slate-500">标准映射：{field.standard || '未关联标'}</div>
                          </div>
                          {field.status === 'missing' ? (
                            <button
                              onClick={() => completeIssue(field.name)}
                              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-500/15"
                            >
                              补齐注释
                            </button>
                          ) : (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">已维'</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === 'timeline' && (
                <div className="space-y-4">
                  {selectedAsset.timeline.map((item, index) => (
                    <div key={`${item.time}-${index}`} className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 pl-6">
                      <div className="absolute left-3 top-6 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>{item.time}</span>
                        <span>{item.operator}</span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-white">{item.action}</div>
                      <div className="mt-1 text-sm text-slate-400">{item.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {drawerOpen && <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setDrawerOpen(false)} />}
    </div>
  );
}
