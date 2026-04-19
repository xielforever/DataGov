# 脚本开发 (Script Development) 实施计划

> **给智能代理的提示：** 必须使用的子技能：使用 `superpowers:subagent-driven-development` (推荐) 或 `superpowers:executing-plans` 逐个任务执行此计划。步骤使用复选框 (`- [ ]`) 语法进行跟踪。

**目标：** 实现包含 Monaco Editor、基于树形结构的文件管理、动态数据源配置、版本管理以及审批流集成的脚本开发页面。

**架构：** 我们将在 `ScriptDev.tsx` 中构建一个响应式的类 IDE 布局。状态将管理当前激活的标签页（当前编辑的脚本）、文件树和控制台。Mock API 将更新以处理带有 `version`、`dataSourceId` 的 `ScriptNode`，并支持版本管理和提交至审批流的新接口。

**技术栈：** React, Tailwind CSS, `@monaco-editor/react`, `lucide-react`, MSW。

---

### 任务 1: 设置 Mock 数据和 API 接口

**涉及文件：**
- 修改: `src/mock/data.ts`
- 修改: `src/mock/handlers.ts`
- 修改: `src/services/api.ts`

- [ ] **步骤 1: 在 `data.ts` 中添加 mock 数据结构**

更新现有的 `mockMetadataDataSources` 或确保其存在。
在 `data.ts` 中添加 `mockScripts` 和 `mockScriptVersions`。

```typescript
// in src/mock/data.ts
export const mockScripts = [
  {
    id: 'folder-1',
    name: '数据清洗',
    type: 'folder',
    parentId: null,
    updateTime: '2026-04-19 10:00:00',
  },
  {
    id: 'script-1',
    name: 'user_data_clean', // 不带后缀
    type: 'sql',
    parentId: 'folder-1',
    content: 'SELECT * FROM users;',
    status: 'draft',
    version: 1,
    dataSourceId: 'ds-1',
    dataSourceConfig: { queue: 'default' },
    updateTime: '2026-04-19 10:05:00',
  }
];

export const mockScriptVersions = [
  {
    id: 'v-1',
    scriptId: 'script-1',
    version: 1,
    content: 'SELECT * FROM users;',
    createTime: '2026-04-19 10:05:00',
    creator: 'Admin',
    comment: 'Initial version',
  }
];
```

- [ ] **步骤 2: 在 `handlers.ts` 中添加 API 处理程序**

添加脚本相关的 REST 接口。

```typescript
// in src/mock/handlers.ts
import { mockScripts, mockScriptVersions } from './data';

// Add to handlers array:
  http.get('/api/v1/development/scripts', () => {
    return HttpResponse.json(mockScripts);
  }),
  http.post('/api/v1/development/scripts', async ({ request }) => {
    const data = await request.json() as any;
    const newScript = {
      ...data,
      id: `script-${Date.now()}`,
      status: 'draft',
      version: 1,
      updateTime: new Date().toISOString()
    };
    mockScripts.push(newScript);
    if (newScript.type !== 'folder') {
      mockScriptVersions.push({
        id: `v-${Date.now()}`,
        scriptId: newScript.id,
        version: 1,
        content: newScript.content || '',
        createTime: newScript.updateTime,
        creator: 'Admin',
        comment: 'Initial version',
      });
    }
    return HttpResponse.json(newScript);
  }),
  http.put('/api/v1/development/scripts/:id', async ({ request, params }) => {
    const { id } = params;
    const data = await request.json() as any;
    const index = mockScripts.findIndex(s => s.id === id);
    if (index !== -1) {
      mockScripts[index] = { ...mockScripts[index], ...data, updateTime: new Date().toISOString() };
      return HttpResponse.json(mockScripts[index]);
    }
    return new HttpResponse(null, { status: 404 });
  }),
  http.post('/api/v1/development/scripts/:id/run', async () => {
    return HttpResponse.json({
      logs: ['Job started...', 'Running query...', 'Success in 2.3s'],
      data: [{ id: 1, name: 'Test Result' }]
    });
  }),
  http.post('/api/v1/development/scripts/:id/publish', async ({ params }) => {
    const { id } = params;
    const index = mockScripts.findIndex(s => s.id === id);
    if (index !== -1) {
      mockScripts[index].status = 'approving';
      // Auto-create approval flow item (mock)
      return HttpResponse.json({ success: true, message: 'Submitted to approval flow' });
    }
    return new HttpResponse(null, { status: 404 });
  }),
  http.get('/api/v1/development/scripts/:id/versions', ({ params }) => {
    const { id } = params;
    const versions = mockScriptVersions.filter(v => v.scriptId === id);
    return HttpResponse.json(versions);
  }),
```

- [ ] **步骤 3: 在 `api.ts` 中导出服务**

```typescript
// in src/services/api.ts
export const fetchScripts = () => apiCall('/development/scripts');
export const createScript = (data: any) => apiCall('/development/scripts', { method: 'POST', body: JSON.stringify(data) });
export const updateScript = (id: string, data: any) => apiCall(`/development/scripts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const runScript = (id: string) => apiCall(`/development/scripts/${id}/run`, { method: 'POST' });
export const publishScript = (id: string) => apiCall(`/development/scripts/${id}/publish`, { method: 'POST' });
export const fetchScriptVersions = (id: string) => apiCall(`/development/scripts/${id}/versions`);
```

### 任务 2: 构建核心 IDE 布局和左侧边栏

**涉及文件：**
- 创建/修改: `src/pages/development/ScriptDev.tsx`

- [ ] **步骤 1: 在 `ScriptDev.tsx` 中创建基础 IDE 布局**

```tsx
import React, { useState, useEffect } from 'react';
import { Folder, FileCode, Play, Square, Save, Send, History, Database, FileText, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchScripts } from '../../services/api';

export default function ScriptDev() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [activeScript, setActiveScript] = useState<any>(null);

  useEffect(() => {
    fetchScripts().then(setScripts).catch(() => toast.error('获取脚本失败'));
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'sql': return <Database className="w-4 h-4 text-blue-400" />;
      case 'python': return <FileCode className="w-4 h-4 text-yellow-400" />;
      case 'shell': return <Terminal className="w-4 h-4 text-green-400" />;
      default: return <Folder className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900 text-gray-300">
      {/* 左侧边栏 */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 font-medium text-gray-100 flex justify-between items-center">
          <span>脚本列表</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {scripts.map(script => (
            <div 
              key={script.id}
              className={`flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded cursor-pointer ${activeScript?.id === script.id ? 'bg-gray-800' : ''}`}
              onClick={() => script.type !== 'folder' && setActiveScript(script)}
            >
              {getIcon(script.type)}
              <span className="text-sm">{script.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col">
        {activeScript ? (
          <div className="flex-1 flex items-center justify-center">
             为 {activeScript.name} 预留的编辑器位置
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            请选择一个脚本开始编辑
          </div>
        )}
      </div>
    </div>
  );
}
```

### 任务 3: 集成 Monaco Editor 和顶部工具栏

**涉及文件：**
- 修改: `src/pages/development/ScriptDev.tsx`
- 运行: `npm install @monaco-editor/react`

- [ ] **步骤 1: 安装 `@monaco-editor/react`**

```bash
npm install @monaco-editor/react
```

- [ ] **步骤 2: 添加工具栏和 Monaco Editor**

```tsx
// 在 ScriptDev.tsx 中添加导入
import Editor from '@monaco-editor/react';

// 更新 ScriptDev.tsx 中的主编辑区
      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col">
        {activeScript ? (
          <>
            {/* 顶部工具栏 */}
            <div className="h-10 border-b border-gray-700 bg-gray-800 flex items-center px-4 justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-200">{activeScript.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-700 rounded text-gray-400" title="保存"><Save className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-gray-700 rounded text-green-400" title="运行"><Play className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-gray-700 rounded text-red-400" title="停止"><Square className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-gray-700 rounded text-blue-400" title="发布"><Send className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-gray-700 rounded text-gray-400" title="历史版本"><History className="w-4 h-4" /></button>
              </div>
            </div>
            
            {/* 编辑器 */}
            <div className="flex-1">
              <Editor
                height="100%"
                theme="vs-dark"
                language={activeScript.type === 'python' ? 'python' : activeScript.type === 'shell' ? 'shell' : 'sql'}
                value={activeScript.content}
                onChange={(val) => setActiveScript({...activeScript, content: val})}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            </div>
            
            {/* 底部控制台 */}
            <div className="h-48 border-t border-gray-700 bg-gray-900 p-2">
               <div className="text-xs text-gray-500 font-mono">控制台输出...</div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            请选择一个脚本开始编辑
          </div>
        )}
      </div>
```

### 任务 4: 实现动态数据源选择与版本管理

**涉及文件：**
- 修改: `src/pages/development/ScriptDev.tsx`

- [ ] **步骤 1: 在工具栏实现动态数据源选择**

```tsx
// 在 ScriptDev.tsx 组件内部
const [dataSources, setDataSources] = useState<any[]>([]);

useEffect(() => {
  // 获取数据源，假设 api.ts 中有 fetchMetadataDataSources
  import('../../services/api').then(({ fetchMetadataDataSources }) => {
    fetchMetadataDataSources().then(res => setDataSources(res.data || res));
  });
}, []);

const handleDataSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setActiveScript({ ...activeScript, dataSourceId: e.target.value, dataSourceConfig: {} });
};

const handleConfigChange = (key: string, value: string) => {
  setActiveScript({
    ...activeScript,
    dataSourceConfig: { ...activeScript.dataSourceConfig, [key]: value }
  });
};

const activeDataSource = dataSources.find(ds => ds.id === activeScript?.dataSourceId);

### 任务 5: 实现标签页(Tabs)管理与快速新建菜单

**涉及文件：**
- 修改: `src/pages/development/ScriptDev.tsx`

- [ ] **步骤 1: 实现多标签页状态管理**

更新状态以支持多个打开的标签页。

```tsx
// 在 ScriptDev.tsx 内部
const [openTabs, setOpenTabs] = useState<any[]>([]); // 存储已打开的脚本

// 修改文件树点击事件，支持将脚本加入打开列表
const handleScriptClick = (script: any) => {
  if (script.type === 'folder') return;
  if (!openTabs.find(t => t.id === script.id)) {
    setOpenTabs([...openTabs, script]);
  }
  setActiveScript(script);
};

// 替换左侧树的 onClick 事件
onClick={() => handleScriptClick(script)}
```

- [ ] **步骤 2: 实现带有新建菜单的标签页栏 (Tab Bar)**

在主编辑区的顶部工具栏上方，添加一个标签页栏，并实现带有下拉菜单的 `+` 按钮。

```tsx
// 导入额外图标
import { Plus, X, ChevronDown } from 'lucide-react';

// 添加新建菜单状态
const [showNewMenu, setShowNewMenu] = useState(false);

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
    const scriptsList = await fetchScripts();
    setScripts(scriptsList);
    setOpenTabs([...openTabs, res]);
    setActiveScript(res);
  } catch (e) {
    toast.error('创建脚本失败');
  }
};

// 更新主编辑区布局，插入标签页栏
      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* 标签页栏 (Tab Bar) */}
        <div className="flex items-end bg-gray-900 pt-2 px-2 border-b border-gray-700">
          {openTabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveScript(tab)}
              className={`group flex items-center gap-2 px-3 py-2 border-t border-x rounded-t-md cursor-pointer text-sm
                ${activeScript?.id === tab.id 
                  ? 'bg-gray-800 border-gray-700 text-gray-200' 
                  : 'bg-gray-900 border-transparent text-gray-500 hover:bg-gray-800'}`}
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
              <div className="absolute left-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 py-1">
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
        
        {activeScript ? (
          <>
            {/* 现有的 Toolbar 和 Editor 代码保持不变，放置在标签栏下方 */}
            {/* ... */}

<div className="flex items-center gap-3 ml-6 border-l border-gray-700 pl-4">
  <select 
    value={activeScript.dataSourceId || ''} 
    onChange={handleDataSourceChange}
    className="bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1 text-gray-300"
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
      className="bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1 text-gray-300"
    >
      <option value="">选择队列...</option>
      <option value="default">default</option>
      <option value="high_priority">high_priority</option>
      <option value="etl">etl</option>
    </select>
  )}
</div>
```

- [ ] **步骤 2: 将工具栏操作连接到 API**

```tsx
// 在 ScriptDev.tsx 中添加处理函数
import { updateScript, publishScript, runScript } from '../../services/api';

const handleSave = async () => {
  if (!activeScript) return;
  try {
    await updateScript(activeScript.id, activeScript);
    toast.success('保存成功');
    // 刷新脚本列表
    const res = await fetchScripts();
    setScripts(res);
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
  } catch (e) {
    toast.error('发布失败');
  }
};

const handleRun = async () => {
  if (!activeScript) return;
  try {
    toast.success('正在运行脚本...');
    const res = await runScript(activeScript.id);
    console.log(res); // 稍后在底部面板处理日志输出
  } catch (e) {
    toast.error('运行失败');
  }
};

// 更新工具栏按钮，添加 onClick 事件
<button onClick={handleSave} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="保存"><Save className="w-4 h-4" /></button>
<button onClick={handleRun} className="p-1 hover:bg-gray-700 rounded text-green-400" title="运行"><Play className="w-4 h-4" /></button>
<button onClick={handlePublish} className="p-1 hover:bg-gray-700 rounded text-blue-400" title="发布"><Send className="w-4 h-4" /></button>
```

- [ ] **步骤 3: 添加版本管理弹窗**

```tsx
// 在 ScriptDev.tsx 内部
const [showVersions, setShowVersions] = useState(false);
const [versions, setVersions] = useState<any[]>([]);

const loadVersions = async () => {
  if (!activeScript) return;
  import('../../services/api').then(({ fetchScriptVersions }) => {
    fetchScriptVersions(activeScript.id).then(res => {
      setVersions(res);
      setShowVersions(true);
    });
  });
};

// 更新历史版本按钮
<button onClick={loadVersions} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="历史版本"><History className="w-4 h-4" /></button>

// 在组件底部添加弹窗
{showVersions && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-800 rounded-lg p-6 w-[500px]">
      <h3 className="text-lg font-medium text-white mb-4">历史版本</h3>
      <div className="max-h-60 overflow-y-auto">
        {versions.map(v => (
          <div key={v.id} className="flex justify-between border-b border-gray-700 p-2">
            <div>
              <div className="text-sm text-gray-200">版本 {v.version}</div>
              <div className="text-xs text-gray-400">{v.comment}</div>
            </div>
            <div className="text-xs text-gray-500">{new Date(v.createTime).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={() => setShowVersions(false)} className="px-4 py-2 bg-gray-700 text-white rounded">关闭</button>
      </div>
    </div>
  </div>
)}
```