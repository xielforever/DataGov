import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, ChevronRight, Check, Plus, Trash2, Code, Link as LinkIcon } from 'lucide-react';
import { fetchMetadataDataSources, fetchStandardDefinitions, createModel, updateModel } from '../../services/api';
import toast from 'react-hot-toast';

export interface ModelField {
  name: string;
  type: string;
  description: string;
  isPrimary: boolean;
  isNullable: boolean;
  standardId: string;
}

export interface ModelDraft {
  id?: string;
  name: string;
  cnName: string;
  layer: string;
  domain: string;
  owner: string;
  dataSourceId: string;
  partitionType: string;
  lifecycle: number;
  description: string;
  fields: ModelField[];
}

interface DataModelingWizardProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onBack: () => void;
  defaultDomain?: string;
  defaultLayer?: string;
}

const STEPS = ['基本信息', '字段设计', '物理属性', '标准映射'];

export default function DataModelingWizard({ mode, initialData, onBack, defaultDomain, defaultLayer }: DataModelingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [ddlInput, setDdlInput] = useState('');
  const [showDdlParser, setShowDdlParser] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    cnName: initialData?.cnName || '',
    layer: initialData?.layer || defaultLayer || 'ODS',
    domain: initialData?.domain || defaultDomain || '',
    owner: initialData?.owner || '',
    dataSourceId: initialData?.dataSourceId || '',
    partitionType: initialData?.partitionType || 'day',
    lifecycle: initialData?.lifecycle || 365,
    description: initialData?.description || '',
    fields: initialData?.fields || []
  });

  useEffect(() => {
    fetchMetadataDataSources().then(res => {
      setDataSources(res);
      if (!formData.dataSourceId && res.length > 0) {
        setFormData(curr => ({ ...curr, dataSourceId: res[0].id }));
      }
    });
    fetchStandardDefinitions().then(res => {
      setStandards(res);
    });
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleParseDDL = () => {
    if (!ddlInput.trim()) return;
    
    const lines = ddlInput.split('\n');
    const parsedFields: ModelField[] = [];
    
    // 简单的正则匹配: field_name type [NOT NULL] [COMMENT '...']
    const regex = /`?([a-zA-Z0-9_]+)`?\s+([a-zA-Z0-9_()]+)([^']*COMMENT\s+'([^']*)')?/i;
    
    lines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        const name = match[1];
        // 忽略主键声明行或其他关键字
        if (['PRIMARY', 'KEY', 'UNIQUE', 'INDEX', 'CONSTRAINT'].includes(name.toUpperCase())) return;
        
        const type = match[2];
        const comment = match[4] || '';
        const isNullable = !line.toUpperCase().includes('NOT NULL');
        
        parsedFields.push({
          name,
          type: type.toUpperCase(),
          description: comment,
          isPrimary: false,
          isNullable,
          standardId: ''
        });
      }
    });

    if (parsedFields.length > 0) {
      setFormData(curr => ({
        ...curr,
        fields: [...curr.fields, ...parsedFields]
      }));
      setDdlInput('');
      setShowDdlParser(false);
      toast.success(`成功解析 ${parsedFields.length} 个字段`);
    } else {
      toast.error('未能解析出有效字段，请检查 DDL 语法');
    }
  };

  const handleAddField = () => {
    setFormData(curr => ({
      ...curr,
      fields: [
        ...curr.fields,
        { name: '', type: 'VARCHAR(50)', description: '', isPrimary: false, isNullable: true, standardId: '' }
      ]
    }));
  };

  const handleUpdateField = (index: number, key: keyof ModelField, value: any) => {
    setFormData(curr => {
      const newFields = [...curr.fields];
      newFields[index] = { ...newFields[index], [key]: value };
      return { ...curr, fields: newFields };
    });
  };

  const handleRemoveField = (index: number) => {
    setFormData(curr => {
      const newFields = [...curr.fields];
      newFields.splice(index, 1);
      return { ...curr, fields: newFields };
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createModel({
          id: `mod-${Date.now()}`,
          name: formData.name,
          cnName: formData.cnName,
          layer: formData.layer,
          domain: formData.domain,
          owner: formData.owner,
          dataSourceId: formData.dataSourceId,
          partitionType: formData.partitionType,
          lifecycle: formData.lifecycle,
          description: formData.description,
          status: "draft",
          updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          fields: formData.fields,
          syncStatus: "unsynced"
        });
      } else if (initialData?.id) {
        await updateModel(initialData.id, {
          ...initialData,
          ...formData,
          updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
      
      // 恢复 react-hot-toast 调用
      toast.success(mode === 'create' ? "模型创建成功" : "模型更新成功");
      onBack();
    } catch (error) {
      toast.error(mode === 'create' ? "模型创建失败" : "模型更新失败");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-800" />
          <h1 className="text-lg font-medium text-slate-100">
            {mode === 'create' ? '新建数据模型' : '编辑数据模型'}
          </h1>
        </div>

        {/* 进度指示器 */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                currentStep === index 
                  ? 'bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30'
                  : currentStep > index
                    ? 'text-slate-300'
                    : 'text-slate-500'
              }`}>
                {currentStep > index ? (
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    currentStep === index ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                )}
                {step}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-px ${currentStep > index ? 'bg-blue-500/50' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="w-[120px]" /> {/* 占位以居中进度条 */}
      </div>

      {/* 主体内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 min-h-[500px]">
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">基础信息配置</h2>
                <div className="grid grid-cols-2 gap-6">
                  {/* 数据源选择 */}
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">物理数据源绑定 <span className="text-rose-400">*</span></label>
                    <select
                      value={formData.dataSourceId}
                      onChange={(e) => setFormData({ ...formData, dataSourceId: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="" disabled>请选择目标数据源</option>
                      {dataSources.map(ds => (
                        <option key={ds.id} value={ds.id}>
                          {ds.name} ({ds.type} - {ds.env})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-slate-500">模型必须绑定到一个真实的物理数据源环境。</p>
                  </div>

                  {/* 表名 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">模型英文名 (表名) <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                      placeholder="如: dwd_trade_order_detail_di"
                    />
                  </div>

                  {/* 中文名 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">模型中文名 <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={formData.cnName}
                      onChange={(e) => setFormData({ ...formData, cnName: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                      placeholder="如: 交易订单明细表"
                    />
                  </div>

                  {/* 分层 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">数仓分层</label>
                    <select
                      value={formData.layer}
                      onChange={(e) => setFormData({ ...formData, layer: e.target.value })}
                      disabled={!!defaultLayer}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="ODS">ODS (贴源层)</option>
                      <option value="DWD">DWD (明细层)</option>
                      <option value="DWS">DWS (汇总层)</option>
                      <option value="ADS">ADS (应用层)</option>
                      <option value="DIM">DIM (维度层)</option>
                    </select>
                  </div>

                  {/* 业务域 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">业务域</label>
                    <select
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      disabled={!!defaultDomain}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">请选择业务域</option>
                      <option value="交易域">交易域</option>
                      <option value="用户域">用户域</option>
                      <option value="商品域">商品域</option>
                      <option value="营销域">营销域</option>
                      <option value="通用域">通用域</option>
                    </select>
                  </div>

                  {/* 负责人 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">负责人</label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* 描述 */}
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">业务描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="详细描述该模型的业务用途..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">字段设计</h2>
                  <p className="text-sm text-slate-400 mt-1">手动添加字段或通过 DDL 语句快速解析生成表结构。</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDdlParser(!showDdlParser)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    DDL 解析
                  </button>
                  <button 
                    onClick={handleAddField}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加字段
                  </button>
                </div>
              </div>

              {/* DDL Parser Section */}
              {showDdlParser && (
                <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">粘贴建表 DDL 语句</label>
                    <button 
                      onClick={() => setShowDdlParser(false)}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      关闭
                    </button>
                  </div>
                  <textarea 
                    value={ddlInput}
                    onChange={(e) => setDdlInput(e.target.value)}
                    placeholder="CREATE TABLE IF NOT EXISTS my_table (\n  `id` BIGINT NOT NULL COMMENT '主键ID',\n  `name` VARCHAR(50) COMMENT '名称'\n);"
                    className="w-full h-32 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-cyan-400 font-mono focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleParseDDL}
                      disabled={!ddlInput.trim()}
                      className="px-4 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      解析并追加字段
                    </button>
                  </div>
                </div>
              )}

              {/* Fields Table */}
              <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900/30">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-xs text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-medium w-[25%]">字段名称 <span className="text-rose-400">*</span></th>
                      <th className="px-4 py-3 font-medium w-[20%]">数据类型 <span className="text-rose-400">*</span></th>
                      <th className="px-4 py-3 font-medium w-[30%]">字段说明</th>
                      <th className="px-4 py-3 font-medium text-center w-[10%]">主键</th>
                      <th className="px-4 py-3 font-medium text-center w-[10%]">非空</th>
                      <th className="px-4 py-3 font-medium text-center w-[5%]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {formData.fields.map((field: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-4 py-2">
                          <input 
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                            placeholder="field_name"
                            className="w-full bg-transparent border-b border-transparent focus:border-cyan-500 text-cyan-400 font-mono outline-none py-1 transition-colors"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text"
                            value={field.type}
                            onChange={(e) => handleUpdateField(idx, 'type', e.target.value.toUpperCase())}
                            placeholder="VARCHAR(50)"
                            className="w-full bg-transparent border-b border-transparent focus:border-blue-500 text-slate-200 font-mono outline-none py-1 transition-colors uppercase"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text"
                            value={field.description}
                            onChange={(e) => handleUpdateField(idx, 'description', e.target.value)}
                            placeholder="说明..."
                            className="w-full bg-transparent border-b border-transparent focus:border-blue-500 text-slate-300 outline-none py-1 transition-colors"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input 
                            type="checkbox"
                            checked={field.isPrimary}
                            onChange={(e) => handleUpdateField(idx, 'isPrimary', e.target.checked)}
                            className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input 
                            type="checkbox"
                            checked={!field.isNullable}
                            onChange={(e) => handleUpdateField(idx, 'isNullable', !e.target.checked)}
                            className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button 
                            onClick={() => handleRemoveField(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="删除字段"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.fields.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          暂无字段，请手动添加或通过 DDL 解析生成。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">物理属性配置</h2>
                <div className="grid grid-cols-2 gap-8">
                  {/* 分区设置 */}
                  <div className="col-span-2">
                    <label className="mb-3 block text-sm font-medium text-slate-400">表分区类型</label>
                    <div className="flex gap-4">
                      {[
                        { value: 'none', label: '不分区 (全量表)' },
                        { value: 'time', label: '时间分区 (按日/月/年)' },
                        { value: 'hash', label: '哈希分区' }
                      ].map(pt => (
                        <label 
                          key={pt.value} 
                          className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${
                            formData.partitionType === pt.value 
                              ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="partitionType" 
                            value={pt.value}
                            checked={formData.partitionType === pt.value}
                            onChange={(e) => setFormData({ ...formData, partitionType: e.target.value })}
                            className="hidden"
                          />
                          <span className="text-sm font-medium">{pt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 生命周期 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">生命周期 (天) <span className="text-rose-400">*</span></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.lifecycle}
                        onChange={(e) => setFormData({ ...formData, lifecycle: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-sm text-slate-500">天</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">-1 表示永久保存，不自动清理。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">数据标准映射</h2>
                  <p className="text-sm text-slate-400 mt-1">为字段关联已发布的数据标准，以便后续进行质量稽核与合规检查。</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900/30">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-xs text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-medium w-[25%]">字段名称</th>
                      <th className="px-4 py-3 font-medium w-[25%]">数据类型</th>
                      <th className="px-4 py-3 font-medium w-[50%]">映射标准 (可选)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {formData.fields.map((field: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-cyan-400">{field.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{field.type}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-slate-500" />
                            <select
                              value={field.standardId || ''}
                              onChange={(e) => handleUpdateField(idx, 'standardId', e.target.value)}
                              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">未关联标准</option>
                              {standards.filter(s => s.status === 'published').map(std => (
                                <option key={std.id} value={std.id}>
                                  {std.name} ({std.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {formData.fields.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">
                          没有可映射的字段，请返回上一步添加。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="h-16 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          取消
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentStep === 0 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            上一步
          </button>
          
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? '保存中...' : '保存模型'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
