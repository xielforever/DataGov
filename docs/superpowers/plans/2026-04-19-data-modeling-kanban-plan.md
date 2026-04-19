# 数据建模看板重构 (Data Modeling Kanban) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构数据建模列表页，采用分层->数据源->模型列表的三级手风琴看板式布局，并实现模型列表的按名称排序和分页功能。

**Architecture:** 
- 在 `DataModeling.tsx` 中引入 `expandedSource` 和 `pageState` 状态来管理手风琴和分页。
- 编写数据预处理逻辑将 `models` 分组为 `{ Layer: { DataSourceId: Model[] } }` 格式。
- 将原有的平铺卡片渲染替换为外层 Layer 区块，中层 Data Source 卡片，内层 Table 的结构。

**Tech Stack:** React, Tailwind CSS, Lucide React (Icons).

---

### Task 1: 状态管理与数据预处理逻辑

**Files:**
- Modify: `src/pages/development/DataModeling.tsx`

- [ ] **Step 1: 添加新的状态变量**
在 `DataModeling` 组件中新增手风琴和分页的状态：
```tsx
const [expandedSource, setExpandedSource] = useState<Record<string, string | null>>({});
const [pageState, setPageState] = useState<Record<string, number>>({});
const PAGE_SIZE = 5;
```

- [ ] **Step 2: 编写数据分组逻辑**
在组件渲染前，对 `filteredModels` 进行预处理。
```tsx
type GroupedData = Record<string, Record<string, Model[]>>;
const groupedModels: GroupedData = {
  ODS: {}, DWD: {}, DWS: {}, ADS: {}, DIM: {}
};

filteredModels.forEach(model => {
  const layer = model.layer || "DWD";
  const sourceId = model.dataSourceId || "unbound";
  
  if (!groupedModels[layer]) groupedModels[layer] = {};
  if (!groupedModels[layer][sourceId]) groupedModels[layer][sourceId] = [];
  
  groupedModels[layer][sourceId].push(model);
});
```

---

### Task 3: 渲染外层分层区块与中层数据源卡片

**Files:**
- Modify: `src/pages/development/DataModeling.tsx`

- [ ] **Step 1: 替换原有 Grid 布局为 Layer Blocks**
将原来的 `<div className="grid grid-cols-1 ..."> {filteredModels.map...} </div>` 删除。
替换为遍历 `['ODS', 'DWD', 'DWS', 'ADS', 'DIM']` 数组来渲染大区块（如果该分层下没有数据，可以显示为空或者灰色占位）。
由于区块可能较大，外层容器可以使用垂直的 `flex flex-col space-y-6` 或者 `grid grid-cols-1 xl:grid-cols-2 gap-6`。

- [ ] **Step 2: 渲染 Header 和 Data Source Cards**
在每个 Layer Block 内部：
- 渲染 Header（分层名称及颜色标识）。
- 渲染 Body，使用 `flex flex-wrap gap-4`，遍历 `groupedModels[layer]` 的 `sourceId`。
- 每个 Data Source 渲染一个小卡片（包含图标、数据源名称、模型数量）。
- 绑定点击事件，调用 `setExpandedSource(prev => ({ ...prev, [layer]: prev[layer] === sourceId ? null : sourceId }))`。

---

### Task 4: 渲染手风琴展开表格及分页

**Files:**
- Modify: `src/pages/development/DataModeling.tsx`

- [ ] **Step 1: 渲染展开面板和表格**
在每个 Layer Block 的 Body 下方，判断 `expandedSource[layer]` 是否存在。如果存在，则渲染一个横跨整行的灰色背景面板。
在面板内渲染一个标准的 HTML `<table>`，表头包括：模型名称、中文名、业务域、负责人、状态、更新时间、操作。

- [ ] **Step 2: 实现排序与分页截取**
获取当前选中的模型列表：`const sourceModels = groupedModels[layer][expandedSource[layer]] || [];`
按表名排序：`const sortedModels = [...sourceModels].sort((a, b) => a.name.localeCompare(b.name));`
计算当前页数据：
```tsx
const currentPage = pageState[expandedSource[layer]] || 1;
const totalPages = Math.ceil(sortedModels.length / PAGE_SIZE);
const paginatedModels = sortedModels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
```
遍历 `paginatedModels` 渲染表格行 `<tr>`。复用原有的按钮（编辑、发布、同步、下线、删除等），并将 onClick 绑定好（注意传递 `e` 以 `stopPropagation()`）。
点击表格行的表名时，调用 `setCurrentModel(model); setIsDetailDrawerOpen(true);` 唤出右侧抽屉。

- [ ] **Step 3: 渲染分页器 (Pagination)**
在表格下方渲染简单的分页控件：上一页按钮、页码指示器 (如 `1 / 3`)、下一页按钮。
点击时更新 `pageState`。