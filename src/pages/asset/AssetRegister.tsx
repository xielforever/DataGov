import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle, ClipboardList, Database, Link, Lock, Pencil, Plug, Shield, Table2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchAssetRegisterOptions, registerAssetTables } from '../../services/api';

interface DataSource {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: 'online' | 'offline' | 'error';
  host: string;
  databases: number;
  tables: number;
}

interface Database {
  id: string;
  name: string;
  tableCount: number;
  size: string;
  lastSync: string;
  dataSourceId: string;
}

interface Table {
  id: string;
  name: string;
  database: string;
  dataSourceId: string;
  rowCount: number;
  size: string;
  lastUpdate: string;
  selected: boolean;
}

const SOURCE_TYPE_ICONS: Record<string, LucideIcon> = {
  MySQL: Database,
  PostgreSQL: Database,
  Hive: Table2,
  Kafka: Link,
  ClickHouse: Table2,
  MongoDB: Database,
  Doris: Table2,
};

const AssetRegister: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [registerProgress, setRegisterProgress] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerComplete, setRegisterComplete] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);

  // 表单数据
  const [formData, setFormData] = useState({
    assetName: '',
    businessDomain: '',
    dataLayer: 'dwd',
    owner: '',
    department: '',
    description: '',
    sensitivity: 'normal',
    tags: [] as string[],
  });

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [businessDomains, setBusinessDomains] = useState<string[]>([]);
  const [dataLayers, setDataLayers] = useState<Array<{ value: string; label: string; color: string }>>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingOptions(true);
    fetchAssetRegisterOptions()
      .then((data) => {
        const options = data as {
          dataSources: DataSource[];
          databases: Database[];
          tables: Table[];
          businessDomains: string[];
          dataLayers: Array<{ value: string; label: string; color: string }>;
          availableTags: string[];
        };
        if (!mounted) return;
        setDataSources(options.dataSources);
        setDatabases(options.databases);
        setTables(options.tables);
        setBusinessDomains(options.businessDomains);
        setDataLayers(options.dataLayers);
        setAvailableTags(options.availableTags);
      })
      .catch(() => {
        if (mounted) toast.error('资产注册选项加载失败');
      })
      .finally(() => {
        if (mounted) setLoadingOptions(false);
      });
    return () => { mounted = false; };
  }, []);

  const visibleDatabases = useMemo(() => (
    selectedDataSource ? databases.filter(db => db.dataSourceId === selectedDataSource) : databases
  ), [databases, selectedDataSource]);

  const selectedDatabaseName = visibleDatabases.find(db => db.id === selectedDatabase)?.name;

  const filteredTables = useMemo(() => tables.filter(t => {
    if (selectedDataSource && t.dataSourceId !== selectedDataSource) return false;
    if (selectedDatabaseName && t.database !== selectedDatabaseName) return false;
    const q = searchTerm.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.database.toLowerCase().includes(q);
  }), [tables, selectedDataSource, selectedDatabaseName, searchTerm]);

  const toggleTableSelection = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAllTables = () => {
    if (selectedTables.length === filteredTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredTables.map(t => t.id));
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    setRegisterProgress(0);

    const interval = window.setInterval(() => {
      setRegisterProgress(prev => Math.min(92, prev + 12));
    }, 180);

    try {
      await new Promise(resolve => window.setTimeout(resolve, 900));
      const registered = await registerAssetTables({
        dataSourceId: selectedDataSource,
        databaseId: selectedDatabase,
        tableIds: selectedTables,
        ...formData,
      }) as unknown[];
      window.clearInterval(interval);
      setRegisterProgress(100);
      setRegisteredCount(registered.length);
      setTimeout(() => {
        setRegisterComplete(true);
        setIsRegistering(false);
      }, 300);
    } catch {
      window.clearInterval(interval);
      setIsRegistering(false);
      toast.error('资产注册失败，请检查数据源和表选择');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
      online: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
      offline: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-500' },
      error: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
    };
    const config = statusConfig[status] || statusConfig.offline;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'online' ? 'animate-pulse' : ''}`} />
        {status === 'online' ? '在线' : status === 'offline' ? '离线' : '异常'}
      </span>
    );
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { step: 1, label: '选择数据源', Icon: Plug },
        { step: 2, label: '选择数据库', Icon: Database },
        { step: 3, label: '填写信息', Icon: Pencil },
        { step: 4, label: '确认提交', Icon: CheckCircle },
      ].map((item, index) => (
        <React.Fragment key={item.step}>
          <div className="flex items-center">
            <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
              currentStep >= item.step 
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30' 
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              <item.Icon className="h-5 w-5" />
              {currentStep > item.step && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-3 hidden sm:block">
              <p className={`text-sm font-medium ${currentStep >= item.step ? 'text-white' : 'text-slate-500'}`}>
                {item.label}
              </p>
              <p className="text-xs text-slate-500">步骤 {item.step}</p>
            </div>
          </div>
          {index < 3 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 sm:mx-4 rounded-full transition-all duration-500 ${
              currentStep > item.step ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-800'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // 步骤1：选择数据源
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">选择数据源</h3>
          <p className="text-sm text-slate-400 mt-1">选择要注册资产的数据源，系统将自动扫描可用的数据库和数据表</p>
        </div>
        <button onClick={() => { window.history.replaceState(null, "", "?view=data-source"); window.dispatchEvent(new PopStateEvent("popstate")); }} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors border border-slate-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新建数据源
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map(ds => {
          const SourceIcon = SOURCE_TYPE_ICONS[ds.type] ?? Database;
          return (
          <div
            key={ds.id}
            onClick={() => {
              setSelectedDataSource(ds.id);
              setSelectedDatabase(null);
              setSelectedTables([]);
            }}
            className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
              selectedDataSource === ds.id
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            {selectedDataSource === ds.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                <SourceIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white truncate">{ds.name}</h4>
                  {getStatusBadge(ds.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">{ds.host}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>{ds.databases} 个库</span>
                  <span>{ds.tables} 张表</span>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          onClick={() => selectedDataSource && setCurrentStep(2)}
          disabled={!selectedDataSource}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
            selectedDataSource
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          下一步：选择数据库
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  // 步骤2：选择数据
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">选择数据库</h3>
          <p className="text-sm text-slate-400 mt-1">从选中的数据源中选择要注册的数据库</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索表名或数据库..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 pl-10 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 数据库选择 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDatabase(null)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            selectedDatabase === null
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
          }`}
        >
          全部数据库
        </button>
        {visibleDatabases.map(db => (
          <button
            key={db.id}
            onClick={() => setSelectedDatabase(db.id)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              selectedDatabase === db.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            {db.name} ({db.tableCount})
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedTables.length === filteredTables.length && filteredTables.length > 0}
              onChange={selectAllTables}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">
              已选择 <span className="text-cyan-400 font-medium">{selectedTables.length}</span> 张表
            </span>
          </div>
          <span className="text-xs text-slate-500">共 {filteredTables.length} 张表</span>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 sticky top-0">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-2 w-10"></th>
                <th className="px-4 py-2">表名</th>
                <th className="px-4 py-2">数据源</th>
                <th className="px-4 py-2 text-right">行数</th>
                <th className="px-4 py-2 text-right">大小</th>
                <th className="px-4 py-2">最后更新</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTables.map(table => (
                <tr
                  key={table.id}
                  onClick={() => toggleTableSelection(table.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedTables.includes(table.id) ? 'bg-cyan-500/5' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleTableSelection(table.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white font-medium">{table.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{table.database}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-slate-300">{(table.rowCount / 1000000).toFixed(1)}M</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-slate-300">{table.size}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500">{table.lastUpdate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-2.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        上一步
        </button>
        <button
          onClick={() => selectedTables.length > 0 && setCurrentStep(3)}
          disabled={selectedTables.length === 0}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
            selectedTables.length > 0
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          下一步：填写信息
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  // 步骤3：填写信息
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">填写资产信息</h3>
        <p className="text-sm text-slate-400 mt-1">为选中的 {selectedTables.length} 张表填写资产信息</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：基本信息 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
            基本信息
          </h4>
          
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">业务域 <span className="text-red-400">*</span></label>
              <select
                value={formData.businessDomain}
                onChange={(e) => setFormData({ ...formData, businessDomain: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">请选择业务域</option>
                {businessDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">数据分层 <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-5 gap-2">
                {dataLayers.map(layer => (
                  <button
                    key={layer.value}
                    onClick={() => setFormData({ ...formData, dataLayer: layer.value })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      formData.dataLayer === layer.value
                        ? `bg-gradient-to-r ${layer.color} text-white shadow-lg`
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {layer.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">资产负责人 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="输入负责人姓名或工号"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">所属部门</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="输入所属部门"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">资产描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入资产描述信息..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 右侧：分类与标签 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            分类与标签
          </h4>

          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">敏感级别</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'public', label: '公开', color: 'from-slate-500 to-slate-600' },
                  { value: 'normal', label: '内部', color: 'from-blue-500 to-blue-600' },
                  { value: 'sensitive', label: '敏感', color: 'from-orange-500 to-orange-600' },
                  { value: 'confidential', label: '机密', color: 'from-red-500 to-red-600' },
                ].map(level => (
                  <button
                    key={level.value}
                    onClick={() => setFormData({ ...formData, sensitivity: level.value })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      formData.sensitivity === level.value
                        ? `bg-gradient-to-r ${level.color} text-white shadow-lg`
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
              <div className="text-sm font-medium text-cyan-200">质量评估自动生成</div>
              <div className="mt-1 text-xs leading-5 text-cyan-100/70">
                质量分、标准覆盖率、敏感识别结果由注册后的采集和评估任务产出，不在人工注册时录入。
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">资产标签</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter(t => t !== tag)
                          : [...prev.tags, tag]
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.tags.includes(tag)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 已选表预览 */}
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2 pt-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
            已选数据表 ({selectedTables.length})
          </h4>
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {selectedTables.map(tableId => {
                const table = tables.find(t => t.id === tableId);
                if (!table) return null;
                return (
                  <div key={tableId} className="flex items-center justify-between py-1.5 px-3 bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-white">{table.name}</span>
                    <span className="text-xs text-slate-500">{table.database}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-2.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        上一步
        </button>
        <button
          onClick={() => formData.businessDomain && formData.owner && setCurrentStep(4)}
          disabled={!formData.businessDomain || !formData.owner}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
            formData.businessDomain && formData.owner
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          下一步：确认提交
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  // 步骤4：确认提交
  const renderStep4 = () => {
    if (registerComplete) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-6 animate-bounce">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">资产注册成功</h3>
          <p className="text-slate-400 mb-6">
            已成功注册 {registeredCount || selectedTables.length} 张数据表到数据资产目录
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setCurrentStep(1);
                setSelectedDataSource(null);
                setSelectedDatabase(null);
                setSelectedTables([]);
                setFormData({
                  assetName: '',
                  businessDomain: '',
                  dataLayer: 'dwd',
                  owner: '',
                  department: '',
                  description: '',
                  sensitivity: 'normal',
                  tags: [],
                });
                setRegisterComplete(false);
                setRegisterProgress(0);
                setIsRegistering(false);
                setRegisteredCount(0);
              }}
              className="px-6 py-2.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              继续注册
            </button>
            <button
              onClick={() => { window.history.replaceState(null, "", "?view=data-catalog"); window.dispatchEvent(new PopStateEvent("popstate")); }}
              className="px-6 py-2.5 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              查看资产目录
            </button>
          </div>
        </div>
      );
    }

    if (isRegistering) {
      return (
        <div className="text-center py-12">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-800"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-cyan-500 transition-all duration-300"
                strokeDasharray={352}
                strokeDashoffset={352 - (352 * Math.min(registerProgress, 100)) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{Math.round(Math.min(registerProgress, 100))}%</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">正在注册资产...</h3>
          <p className="text-slate-400 mb-4">系统正在处理您的资产注册请求</p>
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="text-cyan-400 font-medium">{selectedTables.length}</p>
              <p className="text-slate-500">数据表</p>
            </div>
            <div className="text-center">
              <p className="text-emerald-400 font-medium">采集</p>
              <p className="text-slate-500">元数据</p>
            </div>
            <div className="text-center">
              <p className="text-purple-400 font-medium">生成</p>
              <p className="text-slate-500">血缘关系</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">确认提交</h3>
          <p className="text-sm text-slate-400 mt-1">请确认以下资产注册信息</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 注册摘要 */}
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
            <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
              注册摘要
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">数据源</span>
                <span className="text-sm text-white">{dataSources.find(ds => ds.id === selectedDataSource)?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">注册表数</span>
                <span className="text-sm text-cyan-400 font-medium">{selectedTables.length} 张</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">业务域</span>
                <span className="text-sm text-white">{formData.businessDomain}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">数据分层</span>
                <span className="text-sm text-white">{dataLayers.find(l => l.value === formData.dataLayer)?.label}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">资产负责人</span>
                <span className="text-sm text-white">{formData.owner}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">所属部门</span>
                <span className="text-sm text-white">{formData.department || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">敏感级别</span>
                <span className={`text-sm font-medium ${
                  formData.sensitivity === 'confidential' ? 'text-red-400' :
                  formData.sensitivity === 'sensitive' ? 'text-orange-400' :
                  formData.sensitivity === 'normal' ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  {formData.sensitivity === 'public' ? '公开' :
                   formData.sensitivity === 'normal' ? '内部' :
                   formData.sensitivity === 'sensitive' ? '敏感' : '机密'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-400">资产标签</span>
                <div className="flex gap-1.5">
                  {formData.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                  {formData.tags.length > 3 && (
                    <span className="text-xs text-slate-500">+{formData.tags.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 注册后操作 */}
          <div className="space-y-4">
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                注册后自动执行
              </h4>
              <div className="space-y-3">
                {[
                  { Icon: ClipboardList, title: '元数据采集', desc: '自动采集表结构和字段信息' },
                  { Icon: Link, title: '血缘解析', desc: '自动解析数据来源与去向' },
                  { Icon: Shield, title: '质量评估', desc: '自动执行基础质量检查' },
                  { Icon: Lock, title: '敏感识别', desc: '自动识别敏感数据字段' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                    <item.Icon className="mt-0.5 h-4 w-4 text-cyan-300" />
                    <div>
                      <p className="text-sm text-white font-medium">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-emerald-400 ml-auto mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm text-amber-200 font-medium">注册提示</p>
                  <p className="text-xs text-amber-300/70 mt-1">
                    资产注册后将自动触发元数据采集和血缘解析流程，预计耗时 2-5 分钟。注册完成后可在资产目录中查看详情。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentStep(3)}
            className="px-6 py-2.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          上一步
          </button>
          <button
            onClick={handleRegister}
            className="px-8 py-2.5 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            确认注册
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <Breadcrumb items={[{ label: '数据资产' }, { label: '资产注册' }]} />
        <h1 className="text-2xl font-bold text-white">资产注册</h1>
        <p className="text-sm text-slate-400 mt-1">将数据源中的表注册到数据资产目录，完成资产化管理</p>
      </div>

      {loadingOptions && (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">正在加载可注册资产范围...</div>
      )}

      {/* 步骤指示 */}
      {renderStepIndicator()}

      {/* 步骤内容 */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default AssetRegister;
