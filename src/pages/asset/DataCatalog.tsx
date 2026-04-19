import { useState, useMemo } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

type ViewMode = 'card' | 'table';
type SortField = 'name' | 'updateTime' | 'visitCount' | 'qualityScore';

interface Asset {
  id: string;
  name: string;
  cnName: string;
  description: string;
  database: string;
  source: string;
  sourceType: string;
  layer: 'ODS' | 'DWD' | 'DWS' | 'ADS' | 'DIM';
  domain: string;
  owner: string;
  ownerAvatar: string;
  department: string;
  sensitivity: '公开' | '内部' | '敏感' | '机密';
  qualityScore: number;
  rowCount: number;
  size: string;
  fieldCount: number;
  visitCount: number;
  updateTime: string;
  tags: string[];
  certified: boolean;
  favorite: boolean;
}

export default function DataCatalog() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [selectedSensitivities, setSelectedSensitivities] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCertifiedOnly, setShowCertifiedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('updateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const allAssets: Asset[] = [
    {
      id: 'a1', name: 'dwd_order_detail', cnName: '订单明细宽表',
      description: '交易主链路核心明细表，汇聚订单、支付、用户行为与物流关键字段',
      database: 'dwd_trade', source: 'prod-hive-warehouse', sourceType: 'hive',
      layer: 'DWD', domain: '交易域', owner: '王大', ownerAvatar: '',
      department: '交易数据源', sensitivity: '内部', qualityScore: 97.2,
      rowCount: 850000000, size: '62.4 GB', fieldCount: 68, visitCount: 16234,
      updateTime: '2026-04-17 10:20', tags: ['核心资产', '高频访问', '已认证'],
      certified: true, favorite: true,
    },
    {
      id: 'a2', name: 'ads_sales_report', cnName: '销售分析报',
      description: '经营分析核心应用表，支撑大盘、部门日报与高管周报',
      database: 'ads_app', source: 'prod-clickhouse-olap', sourceType: 'clickhouse',
      layer: 'ADS', domain: '交易域', owner: '赵敏', ownerAvatar: '',
      department: 'BI 分析', sensitivity: '内部', qualityScore: 98.4,
      rowCount: 1200000, size: '320 MB', fieldCount: 36, visitCount: 12486,
      updateTime: '2026-04-17 08:20', tags: ['核心资产', '高价', '已认证'],
      certified: true, favorite: true,
    },
    {
      id: 'a3', name: 'ods_user', cnName: '用户原始',
      description: '来自用户中心主库的贴源数据，覆盖注册、认证、渠道等信息',
      database: 'ods_trade', source: 'prod-pg-user', sourceType: 'postgresql',
      layer: 'ODS', domain: '用户域', owner: '李秀', ownerAvatar: '',
      department: '用户中心', sensitivity: '敏感', qualityScore: 93.8,
      rowCount: 120000000, size: '9.8 GB', fieldCount: 44, visitCount: 9780,
      updateTime: '2026-04-17 10:33', tags: ['敏感数据', '核心资产', '已脱'],
      certified: true, favorite: false,
    },
    {
      id: 'a4', name: 'dws_user_profile', cnName: '用户画像汇总表',
      description: '用户标签与价值分层的汇总表，服务精准营销和用户运营',
      database: 'dws_trade', source: 'prod-hive-warehouse', sourceType: 'hive',
      layer: 'DWS', domain: '用户域', owner: '李秀', ownerAvatar: '',
      department: '用户增长', sensitivity: '敏感', qualityScore: 95.6,
      rowCount: 85000000, size: '6.8 GB', fieldCount: 96, visitCount: 10258,
      updateTime: '2026-04-17 09:38', tags: ['高价', '已认证'],
      certified: true, favorite: true,
    },
    {
      id: 'a5', name: 'dim_product_category', cnName: '商品类目维度',
      description: '商品分析基础维表，提供类目层级、归属与业务映射能力',
      database: 'dim_common', source: 'prod-hive-warehouse', sourceType: 'hive',
      layer: 'DIM', domain: '商品牌', owner: '陈伟', ownerAvatar: '',
      department: '商品运营', sensitivity: '公开', qualityScore: 99.2,
      rowCount: 8500, size: '2 MB', fieldCount: 18, visitCount: 8536,
      updateTime: '2026-04-16 23:50', tags: ['维表', '高频访问', '已认证'],
      certified: true, favorite: false,
    },
    {
      id: 'a6', name: 'ods_payment', cnName: '支付原始流水',
      description: '支付系统流水贴源明细，包含支付渠道、状态、优惠与分账信息',
      database: 'ods_trade', source: 'prod-kafka-event', sourceType: 'kafka',
      layer: 'ODS', domain: '财务域', owner: '刘畅', ownerAvatar: '',
      department: '财务系统', sensitivity: '机密', qualityScore: 92.1,
      rowCount: 356000000, size: '26.9 GB', fieldCount: 52, visitCount: 7240,
      updateTime: '2026-04-17 10:34', tags: ['机密数据', '核心资产'],
      certified: true, favorite: false,
    },
    {
      id: 'a7', name: 'dwd_campaign', cnName: '营销活动明细',
      description: '活动参与、触达、转化全过程明细，支持效果复盘与归因分析',
      database: 'dwd_trade', source: 'prod-hive-warehouse', sourceType: 'hive',
      layer: 'DWD', domain: '营销域', owner: '孙立', ownerAvatar: '',
      department: '营销中心', sensitivity: '内部', qualityScore: 90.4,
      rowCount: 98000000, size: '11.3 GB', fieldCount: 46, visitCount: 7245,
      updateTime: '2026-04-17 10:14', tags: ['待治理'],
      certified: false, favorite: false,
    },
    {
      id: 'a8', name: 'ads_user_value', cnName: '用户价值评估应用表',
      description: '用户生命周期价值模型输出表，供营销策略引擎调用',
      database: 'ads_app', source: 'prod-clickhouse-olap', sourceType: 'clickhouse',
      layer: 'ADS', domain: '用户域', owner: '李秀', ownerAvatar: '',
      department: '用户增长', sensitivity: '敏感', qualityScore: 96.1,
      rowCount: 85000000, size: '3.6 GB', fieldCount: 64, visitCount: 9652,
      updateTime: '2026-04-17 08:10', tags: ['核心资产', '高价', '已认证'],
      certified: true, favorite: true,
    },
    {
      id: 'a9', name: 'ods_shipment', cnName: '物流原始',
      description: '物流履约过程原始明细，覆盖揽收、干线、派送与签收状态轨迹',
      database: 'ods_trade', source: 'prod-mysql-trade', sourceType: 'mysql',
      layer: 'ODS', domain: '物流', owner: '周涛', ownerAvatar: '',
      department: '供应链部', sensitivity: '敏感', qualityScore: 89.8,
      rowCount: 68000000, size: '6.4 GB', fieldCount: 40, visitCount: 5412,
      updateTime: '2026-04-17 10:30', tags: ['敏感数据'],
      certified: false, favorite: false,
    },
    {
      id: 'a10', name: 'dws_order_user_1d', cnName: '用户订单日汇',
      description: '按用户维度聚合的订单日汇总表，支撑经营与用户运营分析',
      database: 'dws_trade', source: 'prod-hive-warehouse', sourceType: 'hive',
      layer: 'DWS', domain: '交易域', owner: '王大', ownerAvatar: '',
      department: '交易数据源', sensitivity: '内部', qualityScore: 95.2,
      rowCount: 58000000, size: '4.5 GB', fieldCount: 32, visitCount: 8840,
      updateTime: '2026-04-17 09:45', tags: ['高价', '已认证'],
      certified: true, favorite: false,
    },
    {
      id: 'a11', name: 'dim_region', cnName: '地区维度',
      description: '全国行政区域标准维表，提供多级区域编码映射与地理属性',
      database: 'dim_common', source: 'prod-oracle-finance', sourceType: 'oracle',
      layer: 'DIM', domain: '其他', owner: '陈静', ownerAvatar: '',
      department: '数据治理', sensitivity: '公开', qualityScore: 99.7,
      rowCount: 3500, size: '1 MB', fieldCount: 18, visitCount: 7826,
      updateTime: '2026-04-16 23:40', tags: ['维表', '高频访问', '已认证'],
      certified: true, favorite: false,
    },
    {
      id: 'a12', name: 'ads_risk_score', cnName: '风控评分应用',
      description: '风险评分结果表，服务实时风控拦截和人工复核策略',
      database: 'risk_model', source: 'prod-doris-realtime', sourceType: 'doris',
      layer: 'ADS', domain: '风控域', owner: '黄琦', ownerAvatar: '',
      department: '风控域', sensitivity: '机密', qualityScore: 97.5,
      rowCount: 5200000, size: '1.2 GB', fieldCount: 28, visitCount: 6982,
      updateTime: '2026-04-17 08:06', tags: ['机密数据', '核心资产', '已认证'],
      certified: true, favorite: false,
    },
    {
      id: 'a13', name: 'dwd_fraud_event', cnName: '欺诈事件明细',
      description: '融合行为特征与设备特征的欺诈事件识别明细',
      database: 'risk_model', source: 'prod-doris-realtime', sourceType: 'doris',
      layer: 'DWD', domain: '风控域', owner: '黄琦', ownerAvatar: '',
      department: '风控域', sensitivity: '机密', qualityScore: 91.2,
      rowCount: 126000000, size: '9.6 GB', fieldCount: 58, visitCount: 5220,
      updateTime: '2026-04-17 09:55', tags: ['机密数据', '高价'],
      certified: true, favorite: false,
    },
    {
      id: 'a14', name: 'dws_order_item_1d', cnName: '商品订单日汇',
      description: '按商品维度聚合订单指标，服务选品与经营分析',
      database: 'dws_trade', source: 'prod-hive-warehouse', sourceType: 'hive',
      layer: 'DWS', domain: '商品牌', owner: '陈伟', ownerAvatar: '',
      department: '商品运营', sensitivity: '内部', qualityScore: 94.7,
      rowCount: 24000000, size: '2.1 GB', fieldCount: 34, visitCount: 6105,
      updateTime: '2026-04-17 09:42', tags: ['已认证'],
      certified: true, favorite: false,
    },
    {
      id: 'a15', name: 'ods_order', cnName: '订单原始',
      description: '交易系统订单主数据贴源表，作为核心血缘起点之一',
      database: 'ods_trade', source: 'prod-mysql-trade', sourceType: 'mysql',
      layer: 'ODS', domain: '交易域', owner: '王大', ownerAvatar: '',
      department: '交易研发', sensitivity: '内部', qualityScore: 96.3,
      rowCount: 820000000, size: '48.2 GB', fieldCount: 58, visitCount: 11248,
      updateTime: '2026-04-17 10:35', tags: ['核心资产', '已认证'],
      certified: true, favorite: true,
    },
    {
      id: 'a16', name: 'dwd_delivery', cnName: '配送明细表',
      description: '物流履约明细数据，包含时效、签收与异常配送信息',
      database: 'dwd_trade', source: 'prod-hive-warehouse', sourceType: 'hive',
      layer: 'DWD', domain: '物流', owner: '周涛', ownerAvatar: '',
      department: '供应链部', sensitivity: '内部', qualityScore: 92.6,
      rowCount: 126000000, size: '14.8 GB', fieldCount: 48, visitCount: 6124,
      updateTime: '2026-04-17 10:16', tags: ['已认证'],
      certified: true, favorite: false,
    },
    {
      id: 'a17', name: 'ods_content_post', cnName: '内容帖子原始',
      description: '内容系统帖子与评论原始数据，支撑内容生态分析',
      database: 'content_db', source: 'prod-mongo-content', sourceType: 'mongodb',
      layer: 'ODS', domain: '营销域', owner: '孙立', ownerAvatar: '',
      department: '内容研发', sensitivity: '内部', qualityScore: 88.9,
      rowCount: 35600000, size: '18.6 GB', fieldCount: 22, visitCount: 4068,
      updateTime: '2026-04-17 09:22', tags: ['待治理'],
      certified: false, favorite: false,
    },
    {
      id: 'a18', name: 'ads_search_ctr', cnName: '搜索点击率分析表',
      description: '搜索曝光点击转化分析结果，供搜索策略优化和A/B评估',
      database: 'ads_app', source: 'prod-es-search', sourceType: 'elasticsearch',
      layer: 'ADS', domain: '商品牌', owner: '钱亮', ownerAvatar: '',
      department: '搜索研发', sensitivity: '内部', qualityScore: 93.6,
      rowCount: 2680000, size: '860 MB', fieldCount: 30, visitCount: 4880,
      updateTime: '2026-04-17 07:48', tags: ['高价'],
      certified: true, favorite: false,
    },
  ];

  const domains = ['交易域', '用户域', '商品牌', '营销域', '财务域', '风控域', '物流', '其他'];
  const layers = ['ODS', 'DWD', 'DWS', 'ADS', 'DIM'];
  const sensitivities = ['公开', '内部', '敏感', '机密'];
  const sources = ['MySQL', 'Hive', 'Kafka', 'ClickHouse', 'PostgreSQL', 'MongoDB', 'Oracle', 'Redis', 'Elasticsearch', 'Doris'];
  const tagOptions = ['核心资产', '高价', '高频访问', '敏感数据', '机密数据', '已认证', '已脱', '维表', '待治理'];

  const layerColors: Record<string, string> = {
    ODS: 'from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30',
    DWD: 'from-cyan-500/20 to-cyan-600/20 text-cyan-300 border-cyan-500/30',
    DWS: 'from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-500/30',
    ADS: 'from-pink-500/20 to-pink-600/20 text-pink-300 border-pink-500/30',
    DIM: 'from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-500/30',
  };

  const sensitivityColors: Record<string, string> = {
    公开: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    内部: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    敏感: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    机密: 'bg-red-500/15 text-red-300 border-red-500/30',
  };

  const sourceIcons: Record<string, string> = {
    mysql: '🐬', hive: '🐝', kafka: '📨', clickhouse: '', postgresql: '🐘', mongodb: '🍃',
    oracle: '🟥', redis: '🔴', elasticsearch: '🔍', doris: '🌟',
  };

  const toggleFilter = (filter: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(filter)) {
      setter(list.filter((f) => f !== filter));
    } else {
      setter([...list, filter]);
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedDomains([]);
    setSelectedLayers([]);
    setSelectedSensitivities([]);
    setSelectedSources([]);
    setSelectedTags([]);
    setShowCertifiedOnly(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredAssets = useMemo(() => {
    let result = allAssets.filter((asset) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !asset.name.toLowerCase().includes(q) &&
          !asset.cnName.toLowerCase().includes(q) &&
          !asset.description.toLowerCase().includes(q) &&
          !asset.owner.toLowerCase().includes(q)
        ) return false;
      }
      if (selectedDomains.length && !selectedDomains.includes(asset.domain)) return false;
      if (selectedLayers.length && !selectedLayers.includes(asset.layer)) return false;
      if (selectedSensitivities.length && !selectedSensitivities.includes(asset.sensitivity)) return false;
      if (selectedSources.length && !selectedSources.some((s) => asset.sourceType === s.toLowerCase())) return false;
      if (selectedTags.length && !selectedTags.some((t) => asset.tags.includes(t))) return false;
      if (showCertifiedOnly && !asset.certified) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'updateTime') cmp = a.updateTime.localeCompare(b.updateTime);
      else if (sortField === 'visitCount') cmp = a.visitCount - b.visitCount;
      else if (sortField === 'qualityScore') cmp = a.qualityScore - b.qualityScore;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [searchQuery, selectedDomains, selectedLayers, selectedSensitivities, selectedSources, selectedTags, showCertifiedOnly, sortField, sortOrder]);

  const paginatedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredAssets.length / pageSize);

  const activeFilterCount = selectedDomains.length + selectedLayers.length + selectedSensitivities.length + selectedSources.length + selectedTags.length + (showCertifiedOnly ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: '数据资产' }, { label: '数据目录' }]} />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">数据目录</h1>
            <span className="px-2.5 py-1 text-xs rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              '{allAssets.length} 个资'            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">浏览、搜索和发现平台所有数据资'</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition flex items-center gap-2">
            <span>📥</span>
            <span>导出目录</span>
          </button>
          <button className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition flex items-center gap-2">
            <span>+</span>
            <span>注册资产</span>
          </button>
        </div>
      </div>

      {/* 顶部搜索'*/}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="搜索资产名称、中文名、描述、负责人..."
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <kbd className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 border border-white/10">⌘K</kbd>
            </div>
          </div>
          <button
            onClick={() => setShowCertifiedOnly(!showCertifiedOnly)}
            className={`px-4 py-3 text-sm rounded-xl border transition flex items-center gap-2 ${
              showCertifiedOnly
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>'</span>
            <span>仅看已认证'</span>
          </button>
        </div>

        {/* 热门搜索 */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">热门搜索'</span>
          {['用户订单', '用户画像', '销售报', '商品维度', '风控评分'].map((tag) => (
            <button
              key={tag}
              onClick={() => { setSearchQuery(tag); setCurrentPage(1); }}
              className="px-2.5 py-1 text-xs rounded-md bg-white/5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 主区域：左侧筛'+ 右侧列表 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左侧筛选面'*/}
        <div className="col-span-3">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">筛选条</h3>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-300">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-slate-400 hover:text-cyan-300 transition">
                  清空
                </button>
              )}
            </div>

            <div className="space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
              {/* 业务'*/}
              <FilterSection title="业务" icon="🏢">
                <div className="space-y-1.5">
                  {domains.map((d) => (
                    <FilterCheckbox
                      key={d} label={d}
                      checked={selectedDomains.includes(d)}
                      onChange={() => toggleFilter(d, selectedDomains, setSelectedDomains)}
                      count={allAssets.filter(a => a.domain === d).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 数据分层 */}
              <FilterSection title="数据分层" icon="📊">
                <div className="space-y-1.5">
                  {layers.map((l) => (
                    <FilterCheckbox
                      key={l} label={l}
                      checked={selectedLayers.includes(l)}
                      onChange={() => toggleFilter(l, selectedLayers, setSelectedLayers)}
                      count={allAssets.filter(a => a.layer === l).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 敏感级别 */}
              <FilterSection title="敏感级别" icon="🔒">
                <div className="space-y-1.5">
                  {sensitivities.map((s) => (
                    <FilterCheckbox
                      key={s} label={s}
                      checked={selectedSensitivities.includes(s)}
                      onChange={() => toggleFilter(s, selectedSensitivities, setSelectedSensitivities)}
                      count={allAssets.filter(a => a.sensitivity === s).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 数据源'*/}
              <FilterSection title="数据源" icon="🔌">
                <div className="space-y-1.5">
                  {sources.map((s) => (
                    <FilterCheckbox
                      key={s} label={s}
                      checked={selectedSources.includes(s)}
                      onChange={() => toggleFilter(s, selectedSources, setSelectedSources)}
                      count={allAssets.filter(a => a.sourceType === s.toLowerCase()).length}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 标签 */}
              <FilterSection title="资产标签" icon="🏷">
                <div className="flex flex-wrap gap-1.5">
                  {tagOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleFilter(t, selectedTags, setSelectedTags)}
                      className={`px-2 py-1 text-[11px] rounded border transition ${
                        selectedTags.includes(t)
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>
        </div>

        {/* 右侧资产列表 */}
        <div className="col-span-9 space-y-4">
          {/* 工具'*/}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              共找'<span className="text-white font-semibold">{filteredAssets.length}</span> 个资'              {activeFilterCount > 0 && (
                <span className="ml-2 text-xs text-cyan-400">（已应用 {activeFilterCount} 个筛选条件）</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* 排序 */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">排序'</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="updateTime">更新时间</option>
                  <option value="visitCount">访问次数</option>
                  <option value="qualityScore">质量评分</option>
                  <option value="name">资产名称</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title={sortOrder === 'asc' ? '升序' : '降序'}
                >
                  {sortOrder === 'asc' ? '' : ''}
                </button>
              </div>

              {/* 视图切换 */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 text-xs rounded transition ${
                    viewMode === 'card' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  '卡片
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs rounded transition ${
                    viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  '列表
                </button>
              </div>
            </div>
          </div>

          {/* 资产列表 - 卡片视图 */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-2 gap-4">
              {paginatedAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="group rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5"
                >
                  {/* 头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br ${layerColors[asset.layer]} border text-base font-bold flex-shrink-0`}>
                        {asset.layer}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition">
                            {asset.name}
                          </h3>
                          {asset.certified && (
                            <span className="text-emerald-400 text-xs flex-shrink-0" title="已认证">✅</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{asset.cnName}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-500 hover:text-amber-400 transition opacity-0 group-hover:opacity-100"
                    >
                      {asset.favorite ? '' : ''}
                    </button>
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">{asset.description}</p>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`px-2 py-0.5 text-[10px] rounded border ${sensitivityColors[asset.sensitivity]}`}>
                      {asset.sensitivity}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-white/5 text-slate-400 border border-white/10">
                      {asset.domain}
                    </span>
                    {asset.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* 元数'*/}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div>
                      <div className="text-[10px] text-slate-500">数据源'</div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">{(asset.rowCount / 10000).toFixed(0)}'</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">字段'</div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">{asset.fieldCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">质量'</div>
                      <div className={`text-xs font-medium mt-0.5 ${
                        asset.qualityScore >= 95 ? 'text-emerald-400' :
                        asset.qualityScore >= 90 ? 'text-cyan-400' :
                        asset.qualityScore >= 85 ? 'text-amber-400' : 'text-red-400'
                      }`}>{asset.qualityScore}</div>
                    </div>
                  </div>

                  {/* 底部 */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                        {asset.ownerAvatar}
                      </div>
                      <span className="text-xs text-slate-400">{asset.owner}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>👁 {asset.visitCount.toLocaleString()}</span>
                      <span>{sourceIcons[asset.sourceType]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 资产列表 - 表格视图 */}
          {viewMode === 'table' && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">资产名称</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">分层</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">业务'</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">敏感'</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">负责人'</th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">数据源'</th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">质量'</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">更新时间</th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{sourceIcons[asset.sourceType]}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-white font-medium group-hover:text-cyan-300 transition">{asset.name}</span>
                              {asset.certified && <span className="text-emerald-400 text-xs">'</span>}
                            </div>
                            <div className="text-xs text-slate-500">{asset.cnName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded border bg-gradient-to-br ${layerColors[asset.layer]}`}>
                          {asset.layer}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{asset.domain}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded border ${sensitivityColors[asset.sensitivity]}`}>
                          {asset.sensitivity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                            {asset.ownerAvatar}
                          </div>
                          <span className="text-xs text-slate-300">{asset.owner}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-300">{(asset.rowCount / 10000).toFixed(0)}'</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold ${
                          asset.qualityScore >= 95 ? 'text-emerald-400' :
                          asset.qualityScore >= 90 ? 'text-cyan-400' :
                          asset.qualityScore >= 85 ? 'text-amber-400' : 'text-red-400'
                        }`}>{asset.qualityScore}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{asset.updateTime}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={(e) => e.stopPropagation()} className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10">详情</button>
                          <button onClick={(e) => e.stopPropagation()} className="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10">血'</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 空状态'*/}
          {filteredAssets.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 backdrop-blur-xl p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg text-white font-semibold mb-2">未找到匹配的资产</h3>
              <p className="text-sm text-slate-400 mb-4">尝试调整筛选条件或搜索关键'</p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition"
              >
                清空所有筛'              </button>
            </div>
          )}

          {/* 分页 */}
          {filteredAssets.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-400">
                '{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAssets.length)} 条，'{filteredAssets.length} '              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  上一步'                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`min-w-[32px] px-2 py-1.5 text-xs rounded-lg border transition ${
                      currentPage === i + 1
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  下一步'                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 资产详情侧边抽屉 */}
      {selectedAsset && (
        <AssetDetailDrawer
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          layerColors={layerColors}
          sensitivityColors={sensitivityColors}
          sourceIcons={sourceIcons}
        />
      )}
    </div>
  );
}

function FilterSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-white/5 pb-4 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-xs font-medium text-slate-300 mb-2.5 hover:text-white transition">
        <span className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span>{title}</span>
        </span>
        <span className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>'</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count: number }) {
  return (
    <label className="flex items-center justify-between py-1 px-2 rounded hover:bg-white/5 cursor-pointer transition group">
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
          checked ? 'bg-cyan-500 border-cyan-500' : 'border-white/20 group-hover:border-white/40'
        }`}>
          {checked && <span className="text-[10px] text-white">'</span>}
        </div>
        <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
        <span className={`text-xs transition ${checked ? 'text-cyan-300' : 'text-slate-400 group-hover:text-white'}`}>{label}</span>
      </div>
      <span className="text-[10px] text-slate-500">{count}</span>
    </label>
  );
}

function AssetDetailDrawer({
  asset, onClose, layerColors, sensitivityColors, sourceIcons,
}: {
  asset: Asset;
  onClose: () => void;
  layerColors: Record<string, string>;
  sensitivityColors: Record<string, string>;
  sourceIcons: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'lineage' | 'quality'>('overview');

  const fields = [
    { name: 'order_id', type: 'BIGINT', comment: '订单ID', isPrimary: true, isSensitive: false },
    { name: 'user_id', type: 'BIGINT', comment: '用户ID', isPrimary: false, isSensitive: true },
    { name: 'product_id', type: 'BIGINT', comment: '商品ID', isPrimary: false, isSensitive: false },
    { name: 'order_amount', type: 'DECIMAL(10,2)', comment: '订单金额', isPrimary: false, isSensitive: false },
    { name: 'pay_status', type: 'VARCHAR(20)', comment: '支付状态', isPrimary: false, isSensitive: false },
    { name: 'phone', type: 'VARCHAR(20)', comment: '手机', isPrimary: false, isSensitive: true },
    { name: 'address', type: 'VARCHAR(500)', comment: '收货地址', isPrimary: false, isSensitive: true },
    { name: 'create_time', type: 'TIMESTAMP', comment: '创建时间', isPrimary: false, isSensitive: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 背景遮罩 */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 抽屉主体 */}
      <div className="w-[640px] bg-slate-950 border-l border-white/10 overflow-y-auto custom-scrollbar shadow-2xl">
        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${layerColors[asset.layer]} border text-base font-bold`}>
                  {asset.layer}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{asset.name}</h2>
                    {asset.certified && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        '已认证'                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{asset.cnName}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                    <span>{sourceIcons[asset.sourceType]}</span>
                    <span>{asset.source}</span>
                    <span>·</span>
                    <span>{asset.database}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0">
                '              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 px-4 py-2 text-xs rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition">
                申请权限
              </button>
              <button className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition">
                '收藏
              </button>
              <button className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition">
                📋 复制
              </button>
              <button className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition">
                '              </button>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="flex items-center gap-1 px-6 border-t border-white/5">
            {[
              { id: 'overview', label: '概览' },
              { id: 'schema', label: '字段信息' },
              { id: 'lineage', label: '血缘关' },
              { id: 'quality', label: '质量监控' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-xs font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'text-cyan-300 border-cyan-500'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容'*/}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* 描述 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">资产描述</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{asset.description}</p>
              </div>

              {/* 关键指标 */}
              <div className="grid grid-cols-4 gap-3">
                <MetricCard label="数据量" value={`${(asset.rowCount / 10000).toFixed(0)}万`} sub="条" color="cyan" />
                <MetricCard label="存储大小" value={asset.size} sub="" color="blue" />
                <MetricCard label="字段数" value={asset.fieldCount.toString()} sub="个" color="purple" />
                <MetricCard label="质量分" value={asset.qualityScore.toString()} sub="/100" color="emerald" />
              </div>

              {/* 基本信息 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-3">基本信息</h4>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/5">
                  <InfoRow label="业务" value={asset.domain} />
                  <InfoRow label="数据分层">
                    <span className={`px-2 py-0.5 text-[10px] rounded border bg-gradient-to-br ${layerColors[asset.layer]}`}>{asset.layer}</span>
                  </InfoRow>
                  <InfoRow label="敏感级别">
                    <span className={`px-2 py-0.5 text-[10px] rounded border ${sensitivityColors[asset.sensitivity]}`}>{asset.sensitivity}</span>
                  </InfoRow>
                  <InfoRow label="负责人">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">{asset.ownerAvatar}</div>
                      <span>{asset.owner}</span>
                    </div>
                  </InfoRow>
                  <InfoRow label="所属部门" value={asset.department} />
                  <InfoRow label="访问次数" value={asset.visitCount.toLocaleString()} />
                  <InfoRow label="更新时间" value={asset.updateTime} />
                </div>
              </div>

              {/* 标签 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">资产标签</h4>
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 text-xs rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-300">字段信息（共 {fields.length} 个）</h4>
                <button className="text-xs text-cyan-400 hover:text-cyan-300">导出 DDL</button>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.03]">
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">字段'</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">类型</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">注释</th>
                      <th className="text-left text-slate-400 font-medium px-3 py-2.5">标识</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => (
                      <tr key={f.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition">
                        <td className="px-3 py-2.5 text-white font-mono text-xs">{f.name}</td>
                        <td className="px-3 py-2.5 text-cyan-400 font-mono text-xs">{f.type}</td>
                        <td className="px-3 py-2.5 text-slate-400">{f.comment}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {f.isPrimary && <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">主键</span>}
                            {f.isSensitive && <span className="px-1.5 py-0.5 text-[9px] rounded bg-red-500/15 text-red-300 border border-red-500/30">敏感</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lineage' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300">血缘关</h4>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-6">
                {/* 简化的血缘示意图 */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* 上游 */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">上游 (3)</div>
                    {['ods_user_info', 'ods_order_raw', 'dim_product'].map((u) => (
                      <div key={u} className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-mono">
                        {u}
                      </div>
                    ))}
                  </div>

                  {/* 当前 */}
                  <div className="flex justify-center">
                    <div className="px-3 py-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/40 text-xs text-cyan-300 font-mono text-center">
                      <div className="text-[9px] text-cyan-400 mb-1">当前</div>
                      {asset.name}
                    </div>
                  </div>

                  {/* 下游 */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase mb-2">下游 (2)</div>
                    {['dws_user_daily', 'ads_sales_report'].map((d) => (
                      <div key={d} className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono">
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full mt-6 px-4 py-2 text-xs rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition">
                  查看完整血缘图 '                </button>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300">质量监控</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: '完整', score: 98, color: 'emerald' },
                  { name: '准确', score: 96, color: 'cyan' },
                  { name: '一致', score: 94, color: 'blue' },
                  { name: '及时', score: 99, color: 'purple' },
                  { name: '唯一', score: 100, color: 'pink' },
                  { name: '有效', score: 92, color: 'amber' },
                ].map((q) => (
                  <div key={q.name} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">{q.name}</span>
                      <span className={`text-sm font-bold text-${q.color}-400`}>{q.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r from-${q.color}-500 to-${q.color}-400`} style={{ width: `${q.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400">'</span>
                  <span className="text-sm font-semibold text-white">最近质量检查通过</span>
                </div>
                <div className="text-xs text-slate-400">最后检查时间：2024-01-15 06:30:00</div>
                <div className="text-xs text-slate-400 mt-1">已配'12 条质量规则，运行正常</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/15 to-cyan-600/5 border-cyan-500/20 text-cyan-300',
    blue: 'from-blue-500/15 to-blue-600/5 border-blue-500/20 text-blue-300',
    purple: 'from-purple-500/15 to-purple-600/5 border-purple-500/20 text-purple-300',
    emerald: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/20 text-emerald-300',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorMap[color]} border p-3`}>
      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold">{value}</span>
        {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200">{children || value}</span>
    </div>
  );
}
