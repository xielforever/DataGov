import React, { useState, useEffect, useRef } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';
import { 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown,
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

  // Directory tree state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // ── 方案B：延迟关闭 timer refs ──────────────────────────────
  const newMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNewMenu = () => {
    if (newMenuTimer.current) clearTimeout(newMenuTimer.current);
    setShowNewMenu(true);
  };
  const closeNewMenu = () => {
    newMenuTimer.current = setTimeout(() => setShowNewMenu(false), 120);
  };
  // ────────────────────────────────────────────────────────────

  useEffect(() => {
    loadScripts();
    loadDataSources();
  }, []);

  // 组件卸载时清理 timer，防止内存泄漏
  useEffect(() => {
    return () => {
      if (newMenuTimer.current) clearTimeout(newMenuTimer.current);
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
    };
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
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '数据开发' }, { label: '脚本开发' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">脚本开发</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700">运行历史</button>
          <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90">环境变量</button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-12rem)] gap-4 text-slate-300">
        {/* 左侧边栏 */}
        <div className="w-64 border border-slate-800 rounded-xl shadow-xl flex flex-col shrink-0 bg-slate-900/50 overflow-hidden">
          <div className="p-3 border-b border-slate-800 font-medium text-slate-200 flex justify-between items-center bg-slate-900/80">
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-500" />
              脚本目录
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors" title="新建文件夹">
                <Folder className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors" title="新建脚本" onClick={openNewMenu}>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
            {scripts.filter(s => s.type === 'folder').map(folder => {
              const isExpanded = expandedFolders.has(folder.id);
              const children = scripts.filter(s => s.parentId === folder.id);
              return (
                <div key={folder.id} className="mb-1">
                  {/* Folder Header */}
                  <div 
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-slate-300 hover:bg-slate-800/80 cursor-pointer group transition-colors"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <span className="text-slate-500 group-hover:text-slate-400 transition-colors">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-cyan-500/80 group-hover:text-cyan-400 transition-colors">
                      {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                    </span>
                    <span className="text-sm font-medium select-none truncate flex-1">{folder.name}</span>
                    <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{children.length}</span>
                  </div>
                  
                  {/* Folder Contents */}
                  {isExpanded && (
                    <div className="ml-4 pl-3 mt-1 space-y-0.5 border-l border-slate-700/50">
                      {children.map(script => (
                        <div 
                          key={script.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 group
                            ${activeScript?.id === script.id 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
                          onClick={() => handleScriptClick(script)}
                        >
                          <span className={`transition-transform duration-200 ${activeScript?.id === script.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {getIcon(script.type)}
                          </span>
                          <span className="text-sm truncate select-none" title={script.name}>{script.name}</span>
                          {script.status === 'approving' && (
                            <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">审批中</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Root Level Scripts */}
            {scripts.filter(s => s.type !== 'folder' && !s.parentId).length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-0.5">
                {scripts.filter(s => s.type !== 'folder' && !s.parentId).map(script => (
                  <div 
                    key={script.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 group
                      ${activeScript?.id === script.id 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
                    onClick={() => handleScriptClick(script)}
                  >
                    <span className={`transition-transform duration-200 ${activeScript?.id === script.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {getIcon(script.type)}
                    </span>
                    <span className="text-sm truncate select-none" title={script.name}>{script.name}</span>
                    {script.status === 'approving' && (
                      <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">审批中</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 主编辑区 */}
        <div className="flex-1 border border-slate-800 rounded-xl shadow-xl flex flex-col min-w-0 relative bg-slate-950 overflow-hidden">
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
          
          {/* 新建标签按钮及下拉菜单 —— 方案B：延迟关闭 */}
          <div className="relative ml-2 mb-1">
            <div 
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-800 cursor-pointer text-gray-400"
              onMouseEnter={openNewMenu}
              onMouseLeave={closeNewMenu}
            >
              <Plus className="w-4 h-4" />
            </div>
            
            {showNewMenu && (
              <div 
                className="absolute left-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1"
                onMouseEnter={openNewMenu}
                onMouseLeave={closeNewMenu}
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
          <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-950">
            <div className="text-center">
              <Terminal className="w-12 h-12 mx-auto mb-4 opacity-20 text-slate-400" />
              <p className="text-slate-400">请在左侧选择一个脚本开始编辑，或点击上方 "+" 新建脚本</p>
            </div>
          </div>
        ) : (
          <>
            {/* 顶部工具栏 */}
            <div className="h-10 border-b border-slate-800 bg-slate-900/80 flex items-center px-4 justify-between shrink-0 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-200">
                  <input 
                    type="text" 
                    value={activeScript.name} 
                    onChange={(e) => setActiveScript({...activeScript, name: e.target.value})}
                    className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1 min-w-[200px]"
                  />
                </span>

                {/* 动态数据源选择 */}
                <div className="flex items-center gap-3 ml-6 border-l border-slate-700 pl-4">
                  <select 
                    value={activeScript.dataSourceId || ''} 
                    onChange={handleDataSourceChange}
                    className="bg-slate-950 border border-slate-700 rounded text-xs px-2 py-1 text-slate-300 outline-none focus:border-cyan-500"
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
                      className="bg-slate-950 border border-slate-700 rounded text-xs px-2 py-1 text-slate-300 outline-none focus:border-cyan-500"
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
                <button onClick={handleSave} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors" title="保存"><Save className="w-4 h-4" /></button>
                <button onClick={handleRun} className="p-1 hover:bg-slate-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors" title="运行"><Play className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-slate-800 rounded text-rose-400 hover:text-rose-300 transition-colors" title="停止"><Square className="w-4 h-4" /></button>
                <button onClick={handlePublish} className="p-1 hover:bg-slate-800 rounded text-blue-400 hover:text-blue-300 transition-colors" title="发布"><Send className="w-4 h-4" /></button>
                <button onClick={loadVersions} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors" title="历史版本"><History className="w-4 h-4" /></button>
                
                {/* 主题设置 —— 方案B：延迟关闭 */}
                <div className="relative ml-2 border-l border-slate-700 pl-2">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors" 
                    title="编辑器设置"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  {showSettings && (
                    <div 
                      className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-1.5 text-xs text-slate-400 font-medium border-b border-slate-700/50 mb-1">主题风格</div>
                      <div 
                        className={`px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm flex items-center justify-between transition-colors ${editorTheme === 'vs-dark' ? 'text-cyan-400 bg-slate-700/30' : 'text-slate-300'}`}
                        onClick={(e) => { e.stopPropagation(); setEditorTheme('vs-dark'); setShowSettings(false); }}
                      >
                        深色 (Dark) {editorTheme === 'vs-dark' && '✓'}
                      </div>
                      <div 
                        className={`px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm flex items-center justify-between transition-colors ${editorTheme === 'light' ? 'text-cyan-400 bg-slate-700/30' : 'text-slate-300'}`}
                        onClick={(e) => { e.stopPropagation(); setEditorTheme('light'); setShowSettings(false); }}
                      >
                        浅色 (Light) {editorTheme === 'light' && '✓'}
                      </div>
                      <div 
                        className={`px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm flex items-center justify-between transition-colors ${editorTheme === 'hc-black' ? 'text-cyan-400 bg-slate-700/30' : 'text-slate-300'}`}
                        onClick={(e) => { e.stopPropagation(); setEditorTheme('hc-black'); setShowSettings(false); }}
                      >
                        高对比度 {editorTheme === 'hc-black' && '✓'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 编辑器 */}
            <div className="flex-1 min-h-0 relative bg-slate-950">
              {activeScript.content === '' && activeScript.name.startsWith('新建') && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center text-slate-500 opacity-60 bg-slate-950">
                  <div className="mb-4 text-center">
                    <p className="text-xl font-bold mb-4 text-slate-300">开始编写代码</p>
                    <div className="text-sm space-y-2 bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg">
                      <p className="flex justify-between gap-8">
                        <span className="text-slate-400">当前脚本:</span> 
                        <span className="text-cyan-400 font-mono">{activeScript.name}</span>
                      </p>
                      <p className="flex justify-between gap-8">
                        <span className="text-slate-400">脚本类型:</span> 
                        <span className="text-emerald-400 font-mono uppercase">{activeScript.type}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-12 mt-8 text-xs font-mono">
                    <div className="flex flex-col items-center gap-3">
                      <div className="px-3 py-1.5 bg-slate-800/80 rounded-md border border-slate-700 shadow-sm text-slate-300">Ctrl + S</div>
                      <span className="text-slate-400">保存脚本</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="px-3 py-1.5 bg-slate-800/80 rounded-md border border-slate-700 shadow-sm text-slate-300">Ctrl + Enter</div>
                      <span className="text-slate-400">运行脚本</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="px-3 py-1.5 bg-slate-800/80 rounded-md border border-slate-700 shadow-sm text-slate-300">Alt + Shift + F</div>
                      <span className="text-slate-400">格式化代码</span>
                    </div>
                  </div>
                </div>
              )}
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
            <div className="h-48 border-t border-slate-800 bg-slate-950 flex flex-col shrink-0">
              <div className="px-3 py-1 border-b border-slate-800/60 bg-slate-900/50 text-xs font-medium text-slate-400 flex items-center">
                控制台输出
              </div>
              <div className="flex-1 p-2 overflow-y-auto font-mono text-xs text-slate-300">
                {consoleLogs.length === 0 ? (
                  <span className="text-slate-600">No output yet...</span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-950 rounded-xl p-6 w-[600px] shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">历史版本 - {activeScript?.name}</h3>
              <button onClick={() => setShowVersions(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/30">
              {versions.length === 0 ? (
                <div className="text-center text-slate-500 py-12">暂无历史版本</div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {versions.map(v => (
                    <div key={v.id} className="flex justify-between p-4 hover:bg-slate-800/50 transition-colors">
                      <div>
                        <div className="text-sm text-cyan-400 font-medium">版本 V{v.version}</div>
                        <div className="text-sm text-slate-300 mt-1">{v.comment || '无备注'}</div>
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-white">{v.creator.charAt(0)}</span>
                          {v.creator}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-col items-end justify-between">
                        <span>{v.createTime}</span>
                        <button className="text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">查看代码</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowVersions(false)} 
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-white rounded-lg text-sm shadow-lg"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
