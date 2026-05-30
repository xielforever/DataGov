import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileCode, 
  Play, 
  Square, 
  Save, 
  Send, 
  History, 
  Database, 
  Terminal,
  Plus,
  X,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { 
  fetchScripts, 
  createScript, 
  updateScript, 
  runScript, 
  publishScript, 
  fetchScriptVersions,
  fetchMetadataDataSources
} from '../../services/api';
import ErrorFallback from '../../components/common/ErrorFallback';

export default function ScriptDev() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [activeScript, setActiveScript] = useState<any>(null);
  const [openTabs, setOpenTabs] = useState<any[]>([]);
  
  // Dynamic data source selection
  const [dataSources, setDataSources] = useState<any[]>([]);
  
  // Versions modal
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  
  // New Menu & Editor settings
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light' | 'hc-black'>('vs-dark');
  const [showSettings, setShowSettings] = useState(false);
  
  // Console logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  useEffect(() => {
    loadScripts();
    loadDataSources();
  }, []);

  const loadScripts = async () => {
    try {
      const res = await fetchScripts();
      setScripts(res);
    } catch (e) {
      toast.error('获取脚本失败');
    }
  };

  const loadDataSources = async () => {
    try {
      const res = await fetchMetadataDataSources();
      setDataSources(res);
    } catch (e) {
      console.error('Failed to load data sources');
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'sql': return <Database className="w-4 h-4 text-blue-400" />;
      case 'python': return <FileCode className="w-4 h-4 text-yellow-400" />;
      case 'shell': return <Terminal className="w-4 h-4 text-green-400" />;
      default: return <Folder className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleScriptClick = (script: any) => {
    if (script.type === 'folder') return;
    if (!openTabs.find(t => t.id === script.id)) {
      setOpenTabs([...openTabs, script]);
    }
    setActiveScript(script);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.id !== id);
    setOpenTabs(newTabs);
    if (activeScript?.id === id) {
      setActiveScript(newTabs.length > 0 ? newTabs[0] : null);
    }
  };

  const handleCreateScript = async (type: string, dsType: string) => {
    setShowNewMenu(false);
    const newScriptData = {
      name: `新建${dsType}脚本`,
      type: type,
      content: '',
      dataSourceConfig: {},
    };
    try {
      const res = await createScript(newScriptData);
      await loadScripts();
      setOpenTabs([...openTabs, res]);
      setActiveScript(res);
    } catch (e) {
      toast.error('创建脚本失败');
    }
  };

  const handleDataSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeScript) return;
    setActiveScript({ ...activeScript, dataSourceId: e.target.value, dataSourceConfig: {} });
  };

  const handleConfigChange = (key: string, value: string) => {
    if (!activeScript) return;
    setActiveScript({
      ...activeScript,
      dataSourceConfig: { ...activeScript.dataSourceConfig, [key]: value }
    });
  };

  const activeDataSource = dataSources.find(ds => ds.id === activeScript?.dataSourceId);

  const handleSave = async () => {
    if (!activeScript) return;
    try {
      await updateScript(activeScript.id, activeScript);
      toast.success('保存成功');
      
      // Update in openTabs
      setOpenTabs(tabs => tabs.map(t => t.id === activeScript.id ? activeScript : t));
      await loadScripts();
    } catch (e) {
      toast.error('保存失败');
    }
  };

  const handlePublish = async () => {
    if (!activeScript) return;
    try {
      await publishScript(activeScript.id);
      toast.success('已提交至审批流');
      setActiveScript({ ...activeScript, status: 'approving' });
      setOpenTabs(tabs => tabs.map(t => t.id === activeScript.id ? { ...t, status: 'approving' } : t));
      await loadScripts();
    } catch (e) {
      toast.error('发布失败');
    }
  };

  const handleRun = async () => {
    if (!activeScript) return;
    try {
      toast.success('正在运行脚本...');
      setConsoleLogs(['Job started...', 'Executing...']);
      const res = await runScript(activeScript.id);
      if (res && res.logs) {
        setConsoleLogs(res.logs);
      }
    } catch (e) {
      toast.error('运行失败');
      setConsoleLogs(['Error: Execution failed.']);
    }
  };

  const loadVersions = async () => {
    if (!activeScript) return;
    try {
      const res = await fetchScriptVersions(activeScript.id);
      setVersions(res);
      setShowVersions(true);
    } catch (e) {
      toast.error('获取版本失败');
    }
  };

  const editorLanguage = activeScript?.type === 'python' ? 'python' : activeScript?.type === 'shell' ? 'shell' : 'sql';

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-gray-900 text-gray-300 overflow-hidden rounded-lg shadow-xl border border-gray-800">
      {/* 左侧边栏 */}
      <div className="w-64 border-r border-gray-700 flex flex-col shrink-0 bg-[#1e1e1e]">
        <div className="p-3 border-b border-gray-700 font-medium text-gray-100 flex justify-between items-center bg-gray-800">
          <span>脚本列表</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {scripts.filter(s => s.type === 'folder').map(folder => (
            <div key={folder.id} className="mb-2">
              {/* Folder Header */}
              <div className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:bg-gray-800 cursor-pointer group">
                <Folder className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-sm font-medium">{folder.name}</span>
              </div>
              
              {/* Folder Contents */}
              <div className="ml-6 border-l border-gray-700/50 pl-2 mt-1">
                {scripts.filter(s => s.parentId === folder.id).map(script => (
                  <div 
                    key={script.id}
                    className={`flex items-center gap-2 p-1.5 mb-0.5 rounded cursor-pointer transition-colors ${activeScript?.id === script.id ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    onClick={() => handleScriptClick(script)}
                  >
                    {getIcon(script.type)}
                    <span className="text-sm truncate" title={script.name}>{script.name}</span>
                    {script.status === 'approving' && (
                      <span className="ml-auto text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">审批中</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Root Level Scripts */}
          <div className="mt-4 border-t border-gray-700/50 pt-2">
            {scripts.filter(s => s.type !== 'folder' && !s.parentId).map(script => (
              <div 
                key={script.id}
                className={`flex items-center gap-2 p-1.5 mx-2 mb-0.5 rounded cursor-pointer transition-colors ${activeScript?.id === script.id ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                onClick={() => handleScriptClick(script)}
              >
                {getIcon(script.type)}
                <span className="text-sm truncate" title={script.name}>{script.name}</span>
                {script.status === 'approving' && (
                  <span className="ml-auto text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">审批中</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* 标签页栏 (Tab Bar) */}
        <div className="flex items-end bg-[#1e1e1e] pt-2 px-2 border-b border-gray-700 overflow-visible shrink-0 relative z-40">
          {openTabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveScript(tab)}
              className={`group flex items-center gap-2 px-3 py-2 border-t border-x rounded-t-md cursor-pointer text-sm shrink-0
                ${activeScript?.id === tab.id 
                  ? 'bg-gray-800 border-gray-700 text-gray-200' 
                  : 'bg-[#1e1e1e] border-transparent text-gray-500 hover:bg-gray-800'}`}
            >
              {getIcon(tab.type)}
              <span>{tab.name}</span>
              <X 
                className={`w-3 h-3 hover:text-red-400 ${activeScript?.id === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                onClick={(e) => handleCloseTab(tab.id, e)} 
              />
            </div>
          ))}
          
          {/* 新建标签按钮及下拉菜单 */}
          <div className="relative ml-2 mb-1" onMouseLeave={() => setShowNewMenu(false)}>
            <div 
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-800 cursor-pointer text-gray-400"
              onMouseEnter={() => setShowNewMenu(true)}
            >
              <Plus className="w-4 h-4" />
            </div>
            
            {showNewMenu && (
              <div 
                className="absolute left-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1" 
                style={{ position: 'absolute', top: '100%', zIndex: 50 }}
                onMouseEnter={() => setShowNewMenu(true)}
                onMouseLeave={() => setShowNewMenu(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm text-gray-300"
                  onClick={() => handleCreateScript('sql', 'MySQL')}
                >
                  <Database className="w-4 h-4 text-blue-400" /> 新建 MySQL 脚本
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm text-gray-300"
                  onClick={() => handleCreateScript('sql', 'Hive')}
                >
                  <Database className="w-4 h-4 text-yellow-400" /> 新建 Hive SQL 脚本
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm text-gray-300"
                  onClick={() => handleCreateScript('python', 'Python')}
                >
                  <FileCode className="w-4 h-4 text-yellow-400" /> 新建 Python 脚本
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-sm text-gray-300"
                  onClick={() => handleCreateScript('shell', 'Shell')}
                >
                  <Terminal className="w-4 h-4 text-green-400" /> 新建 Shell 脚本
                </div>
              </div>
            )}
          </div>
        </div>

        {!activeScript ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#1e1e1e]">
            <div className="text-center">
              <Terminal className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>请在左侧选择一个脚本开始编辑，或点击上方 "+" 新建脚本</p>
            </div>
          </div>
        ) : (
          <>
            {/* 顶部工具栏 */}
            <div className="h-10 border-b border-gray-700 bg-gray-800 flex items-center px-4 justify-between shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-200">
                  <input 
                    type="text" 
                    value={activeScript.name} 
                    onChange={(e) => setActiveScript({...activeScript, name: e.target.value})}
                    className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                  />
                </span>

                {/* 动态数据源选择 */}
                <div className="flex items-center gap-3 ml-6 border-l border-gray-700 pl-4">
                  <select 
                    value={activeScript.dataSourceId || ''} 
                    onChange={handleDataSourceChange}
                    className="bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1 text-gray-300 outline-none"
                  >
                    <option value="">选择数据源...</option>
                    {dataSources.map(ds => (
                      <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>
                    ))}
                  </select>
                  
                  {activeDataSource?.type === 'Hive' && (
                    <select 
                      value={activeScript.dataSourceConfig?.queue || ''}
                      onChange={(e) => handleConfigChange('queue', e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1 text-gray-300 outline-none"
                    >
                      <option value="">选择队列...</option>
                      <option value="default">default</option>
                      <option value="high_priority">high_priority</option>
                      <option value="etl">etl</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSave} className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors" title="保存"><Save className="w-4 h-4" /></button>
                <button onClick={handleRun} className="p-1 hover:bg-gray-700 rounded text-green-400 transition-colors" title="运行"><Play className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-gray-700 rounded text-red-400 transition-colors" title="停止"><Square className="w-4 h-4" /></button>
                <button onClick={handlePublish} className="p-1 hover:bg-gray-700 rounded text-blue-400 transition-colors" title="发布"><Send className="w-4 h-4" /></button>
                <button onClick={loadVersions} className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors" title="历史版本"><History className="w-4 h-4" /></button>
                
                {/* 主题设置 */}
                <div className="relative ml-2 border-l border-gray-700 pl-2" onMouseLeave={() => setShowSettings(false)}>
                  <button 
                    onMouseEnter={() => setShowSettings(true)}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 transition-colors" 
                    title="编辑器设置"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  {showSettings && (
                    <div 
                      className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1"
                      onMouseEnter={() => setShowSettings(true)}
                      onMouseLeave={() => setShowSettings(false)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-1.5 text-xs text-gray-500 font-medium border-b border-gray-700">主题风格</div>
                      <div 
                        className={`px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm flex items-center justify-between ${editorTheme === 'vs-dark' ? 'text-blue-400' : 'text-gray-300'}`}
                        onClick={() => { setEditorTheme('vs-dark'); setShowSettings(false); }}
                      >
                        深色 (Dark) {editorTheme === 'vs-dark' && '✓'}
                      </div>
                      <div 
                        className={`px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm flex items-center justify-between ${editorTheme === 'light' ? 'text-blue-400' : 'text-gray-300'}`}
                        onClick={() => { setEditorTheme('light'); setShowSettings(false); }}
                      >
                        浅色 (Light) {editorTheme === 'light' && '✓'}
                      </div>
                      <div 
                        className={`px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm flex items-center justify-between ${editorTheme === 'hc-black' ? 'text-blue-400' : 'text-gray-300'}`}
                        onClick={() => { setEditorTheme('hc-black'); setShowSettings(false); }}
                      >
                        高对比度 (High Contrast) {editorTheme === 'hc-black' && '✓'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 编辑器 */}
            <div className="flex-1 min-h-0 relative">
              <Editor
                height="100%"
                theme={editorTheme}
                language={editorLanguage}
                value={activeScript.content}
                onChange={(val) => setActiveScript({...activeScript, content: val})}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
            
            {/* 底部控制台 */}
            <div className="h-48 border-t border-gray-700 bg-[#1e1e1e] flex flex-col shrink-0">
              <div className="px-3 py-1 border-b border-gray-700 text-xs font-medium text-gray-400 flex items-center">
                控制台输出
              </div>
              <div className="flex-1 p-2 overflow-y-auto font-mono text-xs text-gray-300">
                {consoleLogs.length === 0 ? (
                  <span className="text-gray-600">No output yet...</span>
                ) : (
                  consoleLogs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 版本管理弹窗 */}
      {showVersions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[600px] shadow-2xl border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">历史版本 - {activeScript?.name}</h3>
            <div className="max-h-[400px] overflow-y-auto">
              {versions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">暂无历史版本</div>
              ) : (
                versions.map(v => (
                  <div key={v.id} className="flex justify-between border-b border-gray-700 p-3 hover:bg-gray-750">
                    <div>
                      <div className="text-sm text-blue-400 font-medium">版本 V{v.version}</div>
                      <div className="text-sm text-gray-300 mt-1">{v.comment || '无备注'}</div>
                      <div className="text-xs text-gray-500 mt-1">提交人: {v.creator}</div>
                    </div>
                    <div className="text-xs text-gray-400 flex flex-col items-end justify-between">
                      <span>{v.createTime}</span>
                      <button className="text-blue-400 hover:text-blue-300 transition-colors">查看代码</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowVersions(false)} 
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 transition-colors text-white rounded text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
