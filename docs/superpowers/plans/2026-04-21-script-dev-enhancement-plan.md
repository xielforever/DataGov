# Script Dev Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Script Development interface with resizable panels, context menus, SQL formatting, autocomplete, data result panel, and state persistence.

**Architecture:** We will modify the existing `src/pages/development/ScriptDev.tsx` component. We will introduce `react-resizable-panels` for the layout, `sql-formatter` for code formatting, and Monaco Editor's native API for autocompletion. We will also implement a custom context menu using standard React state and fixed positioning, and use `localStorage` for state persistence.

**Tech Stack:** React, Tailwind CSS, `react-resizable-panels`, `sql-formatter`, `@monaco-editor/react`, `lucide-react`.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install required packages**

```bash
npm install react-resizable-panels sql-formatter
```

- [ ] **Step 2: Verify installation**

Run: `cat package.json | grep react-resizable-panels`
Expected: Output showing the dependency is added.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-resizable-panels and sql-formatter dependencies"
```

---

### Task 2: Implement Resizable Panels Layout

**Files:**
- Modify: `src/pages/development/ScriptDev.tsx`

- [ ] **Step 1: Import Resizable Panel components**

```typescript
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
```

- [ ] **Step 2: Replace hardcoded flex layout with PanelGroup**
Wrap the main content area (currently `<div className="flex h-[calc(100vh-12rem)] gap-4 text-slate-300">`) with a horizontal `PanelGroup`.
Inside the horizontal `PanelGroup`, the left panel will be the Sidebar (default size 20, min size 15).
The right panel will contain a vertical `PanelGroup` for the Editor (default size 70) and the Bottom Console (default size 30).

- [ ] **Step 3: Run the app and verify layout**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/development/ScriptDev.tsx
git commit -m "feat: implement resizable panels layout in ScriptDev"
```

---

### Task 3: Implement Editor Features (SQL Formatting & Autocomplete)

**Files:**
- Modify: `src/pages/development/ScriptDev.tsx`

- [ ] **Step 1: Import sql-formatter and monaco types**

```typescript
import { format } from 'sql-formatter';
import { useMonaco } from '@monaco-editor/react';
```

- [ ] **Step 2: Add Format functionality**
Update the "Alt + Shift + F" / "格式化代码" logic (which is currently just a mock UI hint) to actually format the active script if it's SQL.
Add a `handleFormat` function:
```typescript
const handleFormat = () => {
  if (!activeScript || activeScript.type !== 'sql') {
    toast.error('当前仅支持 SQL 格式化');
    return;
  }
  try {
    const formatted = format(activeScript.content, { language: 'sql' });
    setActiveScript({ ...activeScript, content: formatted });
    toast.success('格式化成功');
  } catch (e) {
    toast.error('格式化失败，请检查 SQL 语法');
  }
};
```
Bind this function to the "格式化代码" button/shortcut.

- [ ] **Step 3: Add Monaco Autocomplete**
Use the `useMonaco` hook to register a completion provider when the component mounts or monaco instance is ready.
```typescript
const monaco = useMonaco();
useEffect(() => {
  if (monaco) {
    const disposable = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const suggestions = [
          { label: 'users', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'users' },
          { label: 'orders', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'orders' },
          { label: 'user_id', kind: monaco.languages.CompletionItemKind.Field, insertText: 'user_id' },
          { label: 'created_at', kind: monaco.languages.CompletionItemKind.Field, insertText: 'created_at' },
        ];
        return { suggestions };
      }
    });
    return () => disposable.dispose();
  }
}, [monaco]);
```

- [ ] **Step 4: Build and Verify**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/development/ScriptDev.tsx
git commit -m "feat: add sql formatting and monaco autocomplete"
```

---

### Task 4: Implement Data Result Panel

**Files:**
- Modify: `src/pages/development/ScriptDev.tsx`

- [ ] **Step 1: Add active bottom tab state**

```typescript
const [bottomTab, setBottomTab] = useState<'logs' | 'results'>('logs');
// Mock result data
const [queryResults, setQueryResults] = useState<any[] | null>(null);
```

- [ ] **Step 2: Update Bottom Console UI**
Replace the bottom console header with Tabs:
```tsx
<div className="flex px-3 border-b border-slate-800/60 bg-slate-900/50 text-xs font-medium">
  <button 
    className={`py-2 px-4 border-b-2 transition-colors ${bottomTab === 'logs' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
    onClick={() => setBottomTab('logs')}
  >
    运行日志
  </button>
  <button 
    className={`py-2 px-4 border-b-2 transition-colors ${bottomTab === 'results' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
    onClick={() => setBottomTab('results')}
  >
    查询结果
  </button>
</div>
```

- [ ] **Step 3: Implement Results Table rendering**
When `bottomTab === 'results'`, render a responsive table. If `queryResults` is null, show "暂无查询结果".
```tsx
<div className="flex-1 p-2 overflow-auto bg-slate-950">
  {bottomTab === 'logs' && (
    <div className="font-mono text-xs text-slate-300">
      {consoleLogs.length === 0 ? <span className="text-slate-600">No output yet...</span> : consoleLogs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
    </div>
  )}
  {bottomTab === 'results' && (
    <div className="text-xs text-slate-300">
      {!queryResults ? <span className="text-slate-600">暂无查询结果...</span> : (
        <table className="min-w-full border-collapse border border-slate-800">
          <thead className="bg-slate-900 sticky top-0">
            <tr>
              {Object.keys(queryResults[0]).map(k => (
                <th key={k} className="border border-slate-800 px-3 py-1.5 text-left font-medium text-slate-400">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queryResults.map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/50">
                {Object.values(row).map((val: any, j) => (
                  <td key={j} className="border border-slate-800 px-3 py-1.5">{String(val)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 4: Mock Data on Run**
Update `handleRun` to mock `queryResults` when executing SQL.
```typescript
if (activeScript.type === 'sql') {
  setQueryResults([
    { id: 1, name: 'Alice', role: 'Admin', created_at: '2026-04-20' },
    { id: 2, name: 'Bob', role: 'User', created_at: '2026-04-21' }
  ]);
  setBottomTab('results');
} else {
  setQueryResults(null);
  setBottomTab('logs');
}
```

- [ ] **Step 5: Build and Verify**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/development/ScriptDev.tsx
git commit -m "feat: add query results panel to bottom console"
```

---

### Task 5: Implement State Persistence

**Files:**
- Modify: `src/pages/development/ScriptDev.tsx`

- [ ] **Step 1: Implement loadState on mount**
Update the main `useEffect` to load state from `localStorage`.
```typescript
const STORAGE_KEY = 'datagov_script_dev_state';

useEffect(() => {
  const init = async () => {
    await loadScripts();
    await loadDataSources();
    
    // Load persisted state
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { savedOpenTabs, savedActiveScriptId, savedExpandedFolders } = JSON.parse(saved);
        if (savedOpenTabs) setOpenTabs(savedOpenTabs);
        if (savedExpandedFolders) setExpandedFolders(new Set(savedExpandedFolders));
        // We can't set activeScript directly if we need its full content, but openTabs has it, or we fetch it.
        // For simplicity, we just use the tab object if available.
        if (savedActiveScriptId && savedOpenTabs) {
          const active = savedOpenTabs.find((t: any) => t.id === savedActiveScriptId);
          if (active) setActiveScript(active);
        }
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
  };
  init();
}, []);
```

- [ ] **Step 2: Implement saveState effect**
Add an effect that saves state whenever `openTabs`, `activeScript`, or `expandedFolders` changes.
```typescript
useEffect(() => {
  // Only save if scripts have been loaded to avoid overwriting with empty initial state
  if (scripts.length > 0) {
    const stateToSave = {
      savedOpenTabs: openTabs,
      savedActiveScriptId: activeScript?.id || null,
      savedExpandedFolders: Array.from(expandedFolders)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }
}, [openTabs, activeScript, expandedFolders, scripts]);
```

- [ ] **Step 3: Build and Verify**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/development/ScriptDev.tsx
git commit -m "feat: persist script dev state in localStorage"
```

---

### Task 6: Implement Context Menus

**Files:**
- Modify: `src/pages/development/ScriptDev.tsx`

- [ ] **Step 1: Add Context Menu State**
```typescript
const [contextMenu, setContextMenu] = useState<{ type: 'tree' | 'tab', x: number, y: number, targetId: string } | null>(null);

// Close menu on click outside
useEffect(() => {
  const handleClick = () => setContextMenu(null);
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []);
```

- [ ] **Step 2: Add Handlers**
```typescript
const handleTreeContextMenu = (e: React.MouseEvent, id: string) => {
  e.preventDefault();
  setContextMenu({ type: 'tree', x: e.clientX, y: e.clientY, targetId: id });
};

const handleTabContextMenu = (e: React.MouseEvent, id: string) => {
  e.preventDefault();
  setContextMenu({ type: 'tab', x: e.clientX, y: e.clientY, targetId: id });
};

const handleRename = () => {
  toast.success('重命名功能 (Mock)');
  setContextMenu(null);
};

const handleDelete = () => {
  toast.success('删除功能 (Mock)');
  setContextMenu(null);
};

const handleCloseOtherTabs = () => {
  if (contextMenu?.targetId) {
    const tabToKeep = openTabs.find(t => t.id === contextMenu.targetId);
    if (tabToKeep) {
      setOpenTabs([tabToKeep]);
      setActiveScript(tabToKeep);
    }
  }
  setContextMenu(null);
};

const handleCloseAllTabs = () => {
  setOpenTabs([]);
  setActiveScript(null);
  setContextMenu(null);
};
```

- [ ] **Step 3: Attach events to UI and Render Menu**
Attach `onContextMenu={(e) => handleTreeContextMenu(e, item.id)}` to tree items.
Attach `onContextMenu={(e) => handleTabContextMenu(e, tab.id)}` to tabs.
Render the absolute positioned menu at the end of the component:
```tsx
{contextMenu && (
  <div 
    className="fixed z-50 bg-slate-800 border border-slate-700 shadow-xl rounded-md py-1 min-w-[120px] text-sm text-slate-300"
    style={{ top: contextMenu.y, left: contextMenu.x }}
  >
    {contextMenu.type === 'tree' ? (
      <>
        <button className="w-full text-left px-4 py-1.5 hover:bg-slate-700 hover:text-white" onClick={handleRename}>重命名</button>
        <button className="w-full text-left px-4 py-1.5 hover:bg-slate-700 text-red-400 hover:bg-red-500/20" onClick={handleDelete}>删除</button>
      </>
    ) : (
      <>
        <button className="w-full text-left px-4 py-1.5 hover:bg-slate-700 hover:text-white" onClick={handleCloseOtherTabs}>关闭其他</button>
        <button className="w-full text-left px-4 py-1.5 hover:bg-slate-700 hover:text-white" onClick={handleCloseAllTabs}>关闭全部</button>
      </>
    )}
  </div>
)}
```

- [ ] **Step 4: Build and Verify**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/development/ScriptDev.tsx
git commit -m "feat: add context menus for tree and tabs"
```
