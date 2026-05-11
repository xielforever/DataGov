import React, { useEffect, useMemo, useRef, useState } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';
import {
  ChevronDown,
  ChevronRight,
  Database,
  FileCode,
  Folder,
  FolderOpen,
  History,
  Maximize2,
  Minimize2,
  PanelBottomClose,
  PanelBottomOpen,
  Pencil,
  Play,
  Plus,
  Save,
  Send,
  FolderInput,
  Settings,
  Square,
  Terminal,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import {
  createScript,
  fetchMetadataDataSources,
  fetchScripts,
  fetchScriptVersions,
  publishScript,
  runScript,
  updateScript,
} from '../../services/api';

type ScriptItem = {
  id: string;
  name: string;
  type: 'folder' | 'sql' | 'python' | 'shell' | string;
  scriptType?: string;
  editorLanguage?: string;
  dialect?: string;
  parentId?: string | null;
  content?: string;
  status?: string;
  version?: number;
  dataSourceId?: string;
  dataSourceConfig?: Record<string, string>;
  updateTime?: string;
};

type DataSource = {
  id: string;
  name: string;
  type: string;
};

type ScriptVersion = {
  id: string;
  version: number;
  content: string;
  createTime: string;
  creator: string;
  comment?: string;
};

type ScriptTemplate = {
  scriptType: string;
  label: string;
  shortLabel: string;
  dataSourceTypes: string[];
  editorLanguage: 'sql' | 'python' | 'shell' | 'json' | 'plaintext';
  dialect?: string;
  defaultContent: string;
  icon: typeof Database;
  color: string;
};

const scriptTemplates: ScriptTemplate[] = [
  { scriptType: 'mysql-sql', label: '新建 MySQL SQL', shortLabel: 'MySQL SQL', dataSourceTypes: ['MySQL'], editorLanguage: 'sql', dialect: 'mysql', defaultContent: 'SELECT * FROM your_table LIMIT 100;', icon: Database, color: 'text-blue-400' },
  { scriptType: 'postgresql-sql', label: '新建 PostgreSQL SQL', shortLabel: 'PostgreSQL SQL', dataSourceTypes: ['PostgreSQL'], editorLanguage: 'sql', dialect: 'postgresql', defaultContent: 'SELECT * FROM public.your_table LIMIT 100;', icon: Database, color: 'text-indigo-400' },
  { scriptType: 'hive-sql', label: '新建 Hive SQL', shortLabel: 'Hive SQL', dataSourceTypes: ['Hive'], editorLanguage: 'sql', dialect: 'hive', defaultContent: 'SELECT * FROM your_table LIMIT 100;', icon: Database, color: 'text-amber-400' },
  { scriptType: 'clickhouse-sql', label: '新建 ClickHouse SQL', shortLabel: 'ClickHouse SQL', dataSourceTypes: ['ClickHouse'], editorLanguage: 'sql', dialect: 'clickhouse', defaultContent: 'SELECT * FROM your_table LIMIT 100;', icon: Database, color: 'text-yellow-400' },
  {
    scriptType: 'kafka-consumer',
    label: '新建 Kafka Consumer',
    shortLabel: 'Kafka Consumer',
    dataSourceTypes: ['Kafka'],
    editorLanguage: 'python',
    dialect: 'kafka',
    defaultContent: ['from kafka import KafkaConsumer', '', 'consumer = KafkaConsumer("topic_name", bootstrap_servers=["localhost:9092"])', 'for message in consumer:', '    print(message.value)'].join('\n'),
    icon: FileCode,
    color: 'text-slate-300',
  },
  { scriptType: 'redis-command', label: '新建 Redis Command', shortLabel: 'Redis Command', dataSourceTypes: ['Redis'], editorLanguage: 'plaintext', dialect: 'redis', defaultContent: 'GET key_name', icon: Terminal, color: 'text-rose-400' },
  { scriptType: 'elasticsearch-dsl', label: '新建 Elasticsearch DSL', shortLabel: 'Elasticsearch DSL', dataSourceTypes: ['Elasticsearch'], editorLanguage: 'json', dialect: 'elasticsearch', defaultContent: '{\n  "query": {\n    "match_all": {}\n  }\n}', icon: FileCode, color: 'text-teal-400' },
  { scriptType: 'python-task', label: '新建 Python Task', shortLabel: 'Python Task', dataSourceTypes: ['MySQL', 'PostgreSQL', 'Hive', 'ClickHouse', 'Kafka', 'Redis', 'Elasticsearch'], editorLanguage: 'python', defaultContent: '# Python task\n', icon: FileCode, color: 'text-yellow-400' },
  { scriptType: 'shell-task', label: '新建 Shell Task', shortLabel: 'Shell Task', dataSourceTypes: [], editorLanguage: 'shell', defaultContent: '#!/usr/bin/env bash\n', icon: Terminal, color: 'text-emerald-400' },
];

const getTemplateByType = (scriptType?: string) => scriptTemplates.find(template => template.scriptType === scriptType);

const getLegacyTemplate = (script: ScriptItem | null | undefined, dataSources: DataSource[]) => {
  if (!script || script.type === 'folder') return undefined;
  const dataSourceType = dataSources.find(ds => ds.id === script.dataSourceId)?.type;
  if (script.type === 'sql') {
    if (dataSourceType === 'MySQL') return getTemplateByType('mysql-sql');
    if (dataSourceType === 'PostgreSQL') return getTemplateByType('postgresql-sql');
    if (dataSourceType === 'Hive') return getTemplateByType('hive-sql');
    if (dataSourceType === 'ClickHouse') return getTemplateByType('clickhouse-sql');
    return getTemplateByType('mysql-sql');
  }
  if (script.type === 'python') return getTemplateByType('python-task');
  if (script.type === 'shell') return getTemplateByType('shell-task');
  return undefined;
};

export default function ScriptDev() {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [activeScript, setActiveScript] = useState<ScriptItem | null>(null);
  const [openTabs, setOpenTabs] = useState<ScriptItem[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [newMenuAnchor, setNewMenuAnchor] = useState<'tree' | 'tab' | null>(null);
  const [newMenuPosition, setNewMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [newScriptParentId, setNewScriptParentId] = useState<string | null | undefined>(undefined);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light' | 'hc-black'>('vs-dark');
  const [showSettings, setShowSettings] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [mobilePanel, setMobilePanel] = useState<'files' | 'editor' | 'console'>('files');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [consoleHeight, setConsoleHeight] = useState(190);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [treeContextMenu, setTreeContextMenu] = useState<{ script?: ScriptItem; parentId?: string | null; left: number; top: number } | null>(null);

  const editorRef = useRef<any>(null);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const tabNewMenuRef = useRef<HTMLDivElement | null>(null);
  const floatingNewMenuRef = useRef<HTMLDivElement | null>(null);
  const treeContextMenuRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const folders = useMemo(() => scripts.filter(script => script.type === 'folder'), [scripts]);
  const rootScripts = useMemo(() => scripts.filter(script => script.type !== 'folder' && !script.parentId), [scripts]);
  const activeTemplate = useMemo(() => getTemplateByType(activeScript?.scriptType) || getLegacyTemplate(activeScript, dataSources), [activeScript, dataSources]);
  const filteredDataSources = useMemo(() => {
    if (!activeTemplate) return [];
    return dataSources.filter(ds => activeTemplate.dataSourceTypes.includes(ds.type));
  }, [activeTemplate, dataSources]);
  const activeDataSource = filteredDataSources.find(ds => ds.id === activeScript?.dataSourceId);
  const editorLanguage = activeScript?.editorLanguage || activeTemplate?.editorLanguage || (activeScript?.type === 'python' ? 'python' : activeScript?.type === 'shell' ? 'shell' : 'sql');

  useEffect(() => {
    loadScripts();
    loadDataSources();
  }, []);

  useEffect(() => {
    if (!activeScript?.dataSourceId) return;
    if (filteredDataSources.some(ds => ds.id === activeScript.dataSourceId)) return;
    updateActiveDraft(script => ({ ...script, dataSourceId: '', dataSourceConfig: {} }));
  }, [activeScript?.id, activeScript?.type, activeScript?.scriptType, activeScript?.dataSourceId, filteredDataSources]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (isDraggingSidebar) {
        setSidebarWidth(Math.min(420, Math.max(240, event.clientX - 255)));
      }

      if (isDraggingConsole) {
        const viewportBottom = window.innerHeight - 24;
        setConsoleHeight(Math.min(360, Math.max(120, viewportBottom - event.clientY)));
      }
    };

    const stopDragging = () => {
      setIsDraggingSidebar(false);
      setIsDraggingConsole(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, [isDraggingConsole, isDraggingSidebar]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedNewMenu =
        tabNewMenuRef.current?.contains(target) ||
        floatingNewMenuRef.current?.contains(target);
      if (!clickedNewMenu) closeNewScriptMenu();
      if (treeContextMenuRef.current && !treeContextMenuRef.current.contains(target)) {
        setTreeContextMenu(null);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeNewScriptMenu();
        setTreeContextMenu(null);
        setShowSettings(false);
        setShowVersions(false);
      }

      const key = event.key.toLowerCase();
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && key === 's';
      const isRunShortcut = (event.ctrlKey || event.metaKey) && event.key === 'Enter';
      const isFormatShortcut = event.altKey && event.shiftKey && key === 'f';

      if (isSaveShortcut) {
        event.preventDefault();
        handleSave();
      }
      if (isRunShortcut) {
        event.preventDefault();
        handleRun();
      }
      if (isFormatShortcut) {
        event.preventDefault();
        editorRef.current?.getAction?.('editor.action.formatDocument')?.run?.();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeScript, newMenuAnchor, showSettings]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
  }, [activeScript?.id, openTabs.length]);

  const loadScripts = async () => {
    try {
      const res = await fetchScripts();
      setScripts(res);
      const initialFolders = new Set(res.filter((script: ScriptItem) => script.type === 'folder').map((script: ScriptItem) => script.id));
      setExpandedFolders(prev => (prev.size > 0 ? prev : initialFolders));
    } catch (e) {
      toast.error('获取脚本失败');
    }
  };

  const loadDataSources = async () => {
    try {
      const res = await fetchMetadataDataSources();
      setDataSources(res);
    } catch (e) {
      toast.error('获取数据源失败');
    }
  };

  const getIcon = (type: string, scriptType?: string) => {
    const template = getTemplateByType(scriptType);
    if (template) {
      const Icon = template.icon;
      return <Icon className={`h-4 w-4 ${template.color}`} />;
    }

    switch (type) {
      case 'sql':
        return <Database className="h-4 w-4 text-blue-400" />;
      case 'python':
        return <FileCode className="h-4 w-4 text-yellow-400" />;
      case 'shell':
        return <Terminal className="h-4 w-4 text-emerald-400" />;
      default:
        return <Folder className="h-4 w-4 text-slate-400" />;
    }
  };

  const updateActiveDraft = (updater: (script: ScriptItem) => ScriptItem) => {
    setActiveScript(current => {
      if (!current) return current;
      const next = updater(current);
      setOpenTabs(tabs => tabs.map(tab => (tab.id === next.id ? next : tab)));
      setScripts(items => items.map(item => (item.id === next.id ? next : item)));
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleScriptClick = (script: ScriptItem) => {
    if (script.type === 'folder') return;
    const existingTab = openTabs.find(tab => tab.id === script.id);
    if (!existingTab) {
      setOpenTabs(tabs => [...tabs, script]);
    }
    setActiveScript(existingTab || script);
    setMobilePanel('editor');
  };

  const handleCloseTab = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const nextTabs = openTabs.filter(tab => tab.id !== id);
    setOpenTabs(nextTabs);
    if (activeScript?.id === id) {
      setActiveScript(nextTabs.length > 0 ? nextTabs[0] : null);
      if (nextTabs.length === 0) setMobilePanel('files');
    }
  };

  const handleCreateFolder = async () => {
    setTreeContextMenu(null);
    const name = window.prompt('请输入目录名称', '新建目录')?.trim();
    if (!name) return;

    try {
      const folder = await createScript({
        name,
        type: 'folder',
        parentId: null,
      });
      await loadScripts();
      setExpandedFolders(prev => new Set(prev).add(folder.id));
      toast.success('目录创建成功');
    } catch (e) {
      toast.error('目录创建失败');
    }
  };

  const openTreeContextMenu = (event: React.MouseEvent, options: { script?: ScriptItem; parentId?: string | null } = {}) => {
    event.preventDefault();
    event.stopPropagation();
    const width = 224;
    const gutter = 12;
    setTreeContextMenu({
      ...options,
      left: Math.min(Math.max(gutter, event.clientX), window.innerWidth - width - gutter),
      top: Math.min(Math.max(gutter, event.clientY), window.innerHeight - gutter),
    });
  };

  const handleCreateScriptFromTree = (parentId: string | null = null) => {
    setTreeContextMenu(null);
    const fallbackLeft = window.innerWidth > 320 ? 300 : 12;
    const fallbackTop = 180;
    setNewMenuAnchor('tree');
    setNewScriptParentId(parentId);
    setNewMenuPosition({
      left: Math.min(fallbackLeft, window.innerWidth - 268),
      top: Math.min(fallbackTop, window.innerHeight - 80),
    });
  };

  const patchScriptEverywhere = (updatedScript: ScriptItem) => {
    setScripts(items => items.map(item => (item.id === updatedScript.id ? updatedScript : item)));
    setOpenTabs(tabs => tabs.map(tab => (tab.id === updatedScript.id ? updatedScript : tab)));
    setActiveScript(current => (current?.id === updatedScript.id ? updatedScript : current));
  };

  const handleRenameScript = async (script: ScriptItem) => {
    setTreeContextMenu(null);
    const name = window.prompt('请输入脚本名称', script.name)?.trim();
    if (!name || name === script.name) return;

    try {
      const updatedScript = await updateScript(script.id, { ...script, name });
      patchScriptEverywhere(updatedScript);
      toast.success('脚本已重命名');
    } catch (e) {
      toast.error('重命名失败');
    }
  };

  const handleMoveScript = async (script: ScriptItem, parentId: string | null) => {
    setTreeContextMenu(null);
    if ((script.parentId || null) === parentId) return;

    try {
      const updatedScript = await updateScript(script.id, { ...script, parentId });
      patchScriptEverywhere(updatedScript);
      if (parentId) {
        setExpandedFolders(prev => new Set(prev).add(parentId));
      }
      toast.success('脚本已移动');
    } catch (e) {
      toast.error('移动失败');
    }
  };

  const handleCreateScript = async (template: ScriptTemplate) => {
    closeNewScriptMenu();
    const targetFolderId = newScriptParentId !== undefined ? newScriptParentId : activeScript?.parentId || folders[0]?.id || null;
    const preferredDataSource = dataSources.find(ds => template.dataSourceTypes.includes(ds.type));
    const type = template.editorLanguage === 'sql' ? 'sql' : template.editorLanguage;
    const dsType = template.shortLabel;
    const newScriptData = {
      name: `新建${dsType}脚本`,
      type,
      scriptType: template.scriptType,
      editorLanguage: template.editorLanguage,
      dialect: template.dialect,
      parentId: targetFolderId,
      content: template.defaultContent,
      dataSourceId: preferredDataSource?.id || '',
      dataSourceConfig: {},
    };

    try {
      const res = await createScript(newScriptData);
      await loadScripts();
      if (targetFolderId) {
        setExpandedFolders(prev => new Set(prev).add(targetFolderId));
      }
      setOpenTabs(tabs => [...tabs, res]);
      setActiveScript(res);
      setMobilePanel('editor');
    } catch (e) {
      toast.error('创建脚本失败');
    }
  };

  const handleDataSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeScript) return;
    updateActiveDraft(script => ({ ...script, dataSourceId: event.target.value, dataSourceConfig: {} }));
  };

  const handleConfigChange = (key: string, value: string) => {
    if (!activeScript) return;
    updateActiveDraft(script => ({
      ...script,
      dataSourceConfig: { ...script.dataSourceConfig, [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!activeScript) {
      toast('请先选择脚本');
      return;
    }

    try {
      const savedScript = await updateScript(activeScript.id, activeScript);
      toast.success('保存成功');
      setActiveScript(savedScript);
      setOpenTabs(tabs => tabs.map(tab => (tab.id === savedScript.id ? savedScript : tab)));
      await loadScripts();
    } catch (e) {
      toast.error('保存失败');
    }
  };

  const handlePublish = async () => {
    if (!activeScript) {
      toast('请先选择脚本');
      return;
    }

    try {
      await publishScript(activeScript.id);
      toast.success('已提交审批');
      const approvingScript = { ...activeScript, status: 'approving' };
      setActiveScript(approvingScript);
      setOpenTabs(tabs => tabs.map(tab => (tab.id === activeScript.id ? approvingScript : tab)));
      await loadScripts();
    } catch (e) {
      toast.error('发布失败');
    }
  };

  const handleRun = async () => {
    if (!activeScript) {
      toast('请先选择脚本');
      return;
    }

    try {
      setConsoleCollapsed(false);
      setMobilePanel('console');
      toast.success('正在运行脚本...');
      setIsRunning(true);
      setConsoleLogs(['Job started...', 'Executing...']);
      const res = await runScript(activeScript.id);
      setConsoleLogs(res?.logs || ['Success.']);
    } catch (e) {
      toast.error('运行失败');
      setConsoleLogs(['Error: Execution failed.']);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (!isRunning) {
      toast('当前没有运行中的任务');
      return;
    }

    setIsRunning(false);
    setConsoleLogs(logs => [...logs, 'Job stopped by user.']);
    toast.success('已停止运行');
  };

  const loadVersions = async () => {
    if (!activeScript) {
      toast('请先选择脚本');
      return;
    }

    try {
      const res = await fetchScriptVersions(activeScript.id);
      setVersions(res);
      setShowVersions(true);
    } catch (e) {
      toast.error('获取版本失败');
    }
  };

  const handleViewVersion = (version: ScriptVersion) => {
    updateActiveDraft(script => ({ ...script, content: version.content }));
    setShowVersions(false);
    toast.success(`已载入 V${version.version} 版本内容`);
  };

  const renderScriptRow = (script: ScriptItem) => (
    <button
      key={script.id}
      type="button"
      onClick={() => handleScriptClick(script)}
      onContextMenu={event => openTreeContextMenu(event, { script, parentId: script.parentId ?? null })}
      className={`group flex w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition ${
        activeScript?.id === script.id
          ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
          : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200'
      }`}
      title={script.name}
    >
      <span className="shrink-0">{getIcon(script.type, script.scriptType)}</span>
      <span className="min-w-0 flex-1 truncate">{script.name}</span>
      {script.status === 'approving' && (
        <span className="shrink-0 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
          审批中
        </span>
      )}
    </button>
  );

  const renderTreeContextMenu = () => {
    if (!treeContextMenu) return null;

    const { script, parentId } = treeContextMenu;
    const moveTargets = script ? folders.filter(folder => folder.id !== script.parentId) : [];
    const canMoveToRoot = Boolean(script?.parentId);

    return (
      <div
        ref={treeContextMenuRef}
        className="fixed z-[90] w-56 overflow-hidden rounded-lg border border-white/10 bg-slate-900 py-1 shadow-2xl"
        style={{ left: treeContextMenu.left, top: treeContextMenu.top }}
      >
        <button
          type="button"
          onClick={handleCreateFolder}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <Folder className="h-4 w-4 text-cyan-300" />
          新建目录
        </button>
        <button
          type="button"
          onClick={() => handleCreateScriptFromTree(parentId ?? null)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-4 w-4 text-cyan-300" />
          新建脚本
        </button>
        {script && <div className="my-1 border-t border-white/10" />}
        {script && (
        <button
          type="button"
          onClick={() => handleRenameScript(script)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <Pencil className="h-4 w-4 text-cyan-300" />
          重命名
        </button>
        )}
        {script && (
        <div className="mt-1 border-t border-white/10 pt-1">
          <div className="px-3 py-1 text-[11px] text-slate-500">移动到</div>
          {canMoveToRoot && (
            <button
              type="button"
              onClick={() => handleMoveScript(script, null)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <FolderInput className="h-4 w-4 text-slate-400" />
              根目录
            </button>
          )}
          {moveTargets.map(folder => (
            <button
              key={folder.id}
              type="button"
              onClick={() => handleMoveScript(script, folder.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <FolderInput className="h-4 w-4 text-cyan-300" />
              <span className="min-w-0 flex-1 truncate">{folder.name}</span>
            </button>
          ))}
          {!canMoveToRoot && moveTargets.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">暂无可移动目录</div>}
        </div>
        )}
      </div>
    );
  };

  const openNewScriptMenu = (anchor: 'tree' | 'tab', event: React.MouseEvent<HTMLButtonElement>) => {
    if (newMenuAnchor === anchor) {
      closeNewScriptMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const width = 256;
    const gutter = 12;
    const preferredLeft = anchor === 'tree' ? rect.right - width : rect.left;
    const left = Math.min(Math.max(gutter, preferredLeft), window.innerWidth - width - gutter);
    const top = Math.min(rect.bottom + 8, window.innerHeight - gutter);

    setNewMenuAnchor(anchor);
    setNewScriptParentId(undefined);
    setNewMenuPosition({ left, top });
  };

  const closeNewScriptMenu = () => {
    setNewMenuAnchor(null);
    setNewMenuPosition(null);
    setNewScriptParentId(undefined);
  };

  const renderNewScriptMenu = () => (
    <div
      ref={floatingNewMenuRef}
      className="fixed z-[80] max-h-[min(520px,calc(100vh-80px))] w-64 overflow-y-auto rounded-lg border border-white/10 bg-slate-900 shadow-2xl"
      style={{ left: newMenuPosition?.left ?? 0, top: newMenuPosition?.top ?? 0 }}
    >
      {scriptTemplates.map(option => {
        const Icon = option.icon;
        return (
          <button
            key={option.scriptType}
            type="button"
            onClick={() => handleCreateScript(option)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <Icon className={`h-4 w-4 ${option.color}`} />
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const renderScriptTree = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <FolderOpen className="h-4 w-4 text-cyan-400" />
          脚本目录
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-2 py-3" onContextMenu={event => openTreeContextMenu(event, { parentId: null })}>
        {folders.map(folder => {
          const children = scripts.filter(script => script.parentId === folder.id);
          const isExpanded = expandedFolders.has(folder.id);

          return (
            <div key={folder.id} className="mb-2">
              <button
                type="button"
                onClick={() => toggleFolder(folder.id)}
                onContextMenu={event => openTreeContextMenu(event, { parentId: folder.id })}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800/80"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                {isExpanded ? <FolderOpen className="h-4 w-4 text-cyan-400" /> : <Folder className="h-4 w-4 text-cyan-400" />}
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">{children.length}</span>
              </button>
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-3">
                  {children.map(renderScriptRow)}
                  {children.length === 0 && <div className="px-2 py-3 text-xs text-slate-500">暂无脚本</div>}
                </div>
              )}
            </div>
          );
        })}

        {rootScripts.length > 0 && (
          <div className="space-y-1">
            {rootScripts.map(renderScriptRow)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Breadcrumb items={[{ label: '数据开发' }, { label: '脚本开发' }]} />
          <h1 className="mt-2 text-2xl font-bold text-white">脚本开发</h1>
          <p className="mt-1 text-sm text-slate-400">在线编写、调试和发布多数据源脚本，统一管理 SQL、任务脚本与执行配置。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="rounded-lg border border-white/10 bg-slate-800/70 px-4 py-2 text-sm text-slate-500"
            title="能力规划中"
          >
            运行历史
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg border border-white/10 bg-slate-800/70 px-4 py-2 text-sm text-slate-500"
            title="能力规划中"
          >
            环境变量
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 rounded-xl border border-white/10 bg-slate-900/50 p-1 lg:hidden">
        {[
          { id: 'files', label: '目录' },
          { id: 'editor', label: '编辑器' },
          { id: 'console', label: '控制台' },
        ].map(panel => (
          <button
            key={panel.id}
            type="button"
            onClick={() => setMobilePanel(panel.id as typeof mobilePanel)}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              mobilePanel === panel.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            {panel.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-[560px] flex-col gap-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 text-slate-300 shadow-xl lg:h-[calc(100vh-12rem)] lg:min-h-0 lg:flex-row lg:gap-0">
        <aside
          className={`${mobilePanel === 'files' ? 'flex' : 'hidden'} min-h-[520px] w-full flex-col overflow-hidden bg-slate-900/50 lg:flex lg:min-h-0 lg:w-[var(--sidebar-width)] lg:shrink-0`}
          style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        >
          {renderScriptTree()}
        </aside>

        <div
          role="separator"
          aria-label="调整脚本目录宽度"
          className="hidden w-1 cursor-col-resize border-r border-slate-800 bg-slate-900/70 transition hover:bg-cyan-500/30 lg:block"
          onPointerDown={() => setIsDraggingSidebar(true)}
        />

        <section className={`${mobilePanel === 'files' ? 'hidden' : 'flex'} min-w-0 flex-1 flex-col overflow-hidden bg-slate-950 lg:flex`}>
          <div className={`${mobilePanel === 'console' ? 'hidden' : 'flex'} min-h-0 flex-1 flex-col lg:flex`}>
            <div ref={tabListRef} className="custom-scrollbar flex shrink-0 items-end gap-2 overflow-x-auto border-b border-slate-800 bg-slate-900/60 px-2 pt-2">
              {openTabs.map(tab => (
                <button
                  key={tab.id}
                  ref={activeScript?.id === tab.id ? activeTabRef : null}
                  type="button"
                  onClick={() => {
                    setActiveScript(tab);
                    setMobilePanel('editor');
                  }}
                  className={`group flex max-w-[220px] shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2 text-sm transition ${
                    activeScript?.id === tab.id
                      ? 'border-white/10 bg-slate-950 text-slate-100'
                      : 'border-transparent bg-transparent text-slate-500 hover:bg-white/5 hover:text-slate-200'
                  }`}
                  title={tab.name}
                >
                  {getIcon(tab.type, tab.scriptType)}
                  <span className="truncate">{tab.name}</span>
                  <X
                    className="h-3.5 w-3.5 text-slate-500 opacity-80 transition hover:text-rose-300"
                    onClick={event => handleCloseTab(tab.id, event)}
                  />
                </button>
              ))}
              <div ref={tabNewMenuRef} className="sticky right-0 mb-1 bg-slate-900/90 pl-1">
                <button
                  type="button"
                  onClick={event => openNewScriptMenu('tab', event)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-cyan-300"
                  aria-label="新建脚本"
                  title="新建脚本"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!activeScript ? (
              <div className="flex min-h-[420px] flex-1 items-center justify-center bg-slate-950 px-6 text-center text-slate-500">
                <div>
                  <Terminal className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                  <p className="max-w-md text-sm text-slate-400">请在脚本目录中选择一个脚本开始编辑，或点击“新建脚本”创建脚本。</p>
                </div>
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-white/10 bg-slate-900/60 px-3 py-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center">
                      <input
                        type="text"
                        value={activeScript.name}
                        onChange={event => updateActiveDraft(script => ({ ...script, name: event.target.value }))}
                        className="min-w-0 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 md:w-64"
                        aria-label="脚本名称"
                      />
                      {activeTemplate && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-medium text-cyan-200">
                          {activeTemplate.shortLabel}
                          {activeTemplate.dialect && <span className="text-cyan-400/70">/{activeTemplate.dialect}</span>}
                        </span>
                      )}
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                        {activeTemplate?.dataSourceTypes.length === 0 ? (
                          <span className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-500">无需数据源</span>
                        ) : (
                        <select
                          value={activeDataSource ? activeScript.dataSourceId : ''}
                          onChange={handleDataSourceChange}
                          className="min-w-0 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-cyan-500/60 sm:w-56"
                          aria-label="选择数据源"
                        >
                          <option value="">选择数据源...</option>
                          {filteredDataSources.map(ds => (
                            <option key={ds.id} value={ds.id}>
                              {ds.name} ({ds.type})
                            </option>
                          ))}
                        </select>
                        )}

                        {activeDataSource?.type === 'Hive' && (
                          <select
                            value={activeScript.dataSourceConfig?.queue || ''}
                            onChange={event => handleConfigChange('queue', event.target.value)}
                            className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-cyan-500/60 sm:w-40"
                            aria-label="选择执行队列"
                          >
                            <option value="">选择队列...</option>
                            <option value="default">default</option>
                            <option value="high_priority">high_priority</option>
                            <option value="etl">etl</option>
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-nowrap items-center gap-2">
                      <button type="button" onClick={handleSave} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-300" aria-label="保存脚本" title="保存">
                        <Save className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={handleRun} className="rounded-lg p-2 text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300" aria-label="运行脚本" title="运行">
                        <Play className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={handleStop} className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300" aria-label="停止运行" title="停止">
                        <Square className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={handlePublish} className="rounded-lg p-2 text-blue-400 transition hover:bg-blue-500/10 hover:text-blue-300" aria-label="发布脚本" title="发布">
                        <Send className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={loadVersions} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-200" aria-label="历史版本" title="历史版本">
                        <History className="h-4 w-4" />
                      </button>
                      <div ref={settingsRef} className="relative border-l border-white/10 pl-2">
                        <button
                          type="button"
                          onClick={() => setShowSettings(open => !open)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
                          aria-label="编辑器设置"
                          title="编辑器设置"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        {showSettings && (
                          <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-2xl">
                            <div className="border-b border-white/10 px-3 py-2 text-xs text-slate-500">涓婚椋庢牸</div>
                            {[
                              { value: 'vs-dark', label: '娣辫壊' },
                              { value: 'light', label: '娴呰壊' },
                              { value: 'hc-black', label: '高对比度' },
                            ].map(theme => (
                              <button
                                key={theme.value}
                                type="button"
                                onClick={() => {
                                  setEditorTheme(theme.value as typeof editorTheme);
                                  setShowSettings(false);
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-white/10 ${
                                  editorTheme === theme.value ? 'text-cyan-300' : 'text-slate-300'
                                }`}
                              >
                                {theme.label}
                                {editorTheme === theme.value && <span>✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div id="monaco-editor-container" className="relative min-h-[420px] flex-1 bg-slate-950 lg:min-h-0">
                  {activeScript.content === '' && activeScript.name.startsWith('新建') && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-950/90 px-4 text-center">
                      <div className="rounded-xl border border-white/10 bg-slate-900/80 p-5 shadow-xl">
                        <p className="text-base font-semibold text-slate-200">开始编写代码</p>
                        <p className="mt-2 text-sm text-slate-400">保存 Ctrl+S · 运行 Ctrl+Enter · 格式化 Alt+Shift+F</p>
                      </div>
                    </div>
                  )}
                  <Editor
                    height="100%"
                    theme={editorTheme}
                    language={editorLanguage}
                    value={activeScript.content || ''}
                    onMount={editor => {
                      editorRef.current = editor;
                    }}
                    onChange={value => updateActiveDraft(script => ({ ...script, content: value || '' }))}
                    options={{
                      automaticLayout: true,
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div
            role="separator"
            aria-label="调整控制台高度"
            className={`${activeScript && !consoleCollapsed ? 'hidden lg:block' : 'hidden'} h-1 cursor-row-resize bg-white/5 transition hover:bg-cyan-500/40`}
            onPointerDown={() => setIsDraggingConsole(true)}
          />

          <div
            className={`${mobilePanel === 'console' ? 'flex' : 'hidden'} shrink-0 flex-col border-t border-white/10 bg-slate-950 lg:flex ${
              consoleCollapsed ? 'lg:h-10' : 'h-[520px] lg:h-[var(--console-height)]'
            }`}
            style={{ '--console-height': `${consoleHeight}px` } as React.CSSProperties}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Terminal className="h-4 w-4 text-cyan-400" />
                控制台输出
                {isRunning && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">运行中</span>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConsoleLogs([])}
                  className="rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
                >
                  清空
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleCollapsed(collapsed => !collapsed)}
                  className="hidden rounded p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-300 lg:block"
                  aria-label={consoleCollapsed ? '展开控制台' : '折叠控制台'}
                  title={consoleCollapsed ? '展开控制台' : '折叠控制台'}
                >
                  {consoleCollapsed ? <PanelBottomOpen className="h-4 w-4" /> : <PanelBottomClose className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleHeight(height => (height < 300 ? 340 : 190))}
                  className="hidden rounded p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-300 lg:block"
                  aria-label="切换控制台高度"
                  title="切换控制台高度"
                >
                  {consoleHeight < 300 ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {!consoleCollapsed && (
              <div className="custom-scrollbar flex-1 overflow-y-auto p-3 font-mono text-xs text-slate-300">
                {consoleLogs.length === 0 ? (
                  <span className="text-slate-600">No output yet...</span>
                ) : (
                  consoleLogs.map((log, index) => (
                    <div key={`${log}-${index}`} className="mb-1 whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {newMenuAnchor && newMenuPosition && renderNewScriptMenu()}
      {renderTreeContextMenu()}

      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[640px] overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="min-w-0 truncate text-lg font-semibold text-white">历史版本 - {activeScript?.name}</h3>
              <button
                type="button"
                onClick={() => setShowVersions(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="关闭历史版本"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto">
              {versions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">暂无历史版本</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {versions.map(version => (
                    <div key={version.id} className="flex flex-col gap-3 p-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-cyan-300">版本 V{version.version}</div>
                        <div className="mt-1 text-sm text-slate-300">{version.comment || '无备注'}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          {version.creator} · {version.createTime}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewVersion(version)}
                        className="self-start rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-300 transition hover:bg-cyan-500/20 sm:self-center"
                      >
                        查看代码
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowVersions(false)}
                className="rounded-lg border border-white/10 bg-slate-800 px-5 py-2 text-sm text-white transition hover:bg-slate-700"
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
