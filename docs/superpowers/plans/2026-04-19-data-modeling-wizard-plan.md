# 数据建模多步向导 (Data Modeling Wizard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有的简单弹窗式新建模型重构为全屏沉浸式的四步向导，支持数据源绑定、字段设计、分区物理属性配置及数据标准关联。

**Architecture:** 
1. 采用 React Router 添加 `/development/modeling/create` 等新路由。
2. 创建 `DataModelingWizard.tsx` 页面组件作为向导容器。
3. 拆分四个子组件（Step1Basic, Step2Schema, Step3Physical, Step4Standard）进行按步渲染。
4. 在顶层维护统一的 `ModelDraft` state。
5. 更新现有的 `DataModeling.tsx` 卡片以支持跳转。

**Tech Stack:** React, Tailwind CSS, React Router DOM, 现有的 Mock API。

---

### Task 1: 扩展模型及 API 定义

**Files:**
- Modify: `src/services/api.ts`
- Modify: `src/mock/data.ts`
- Modify: `src/mock/handlers.ts`

- [ ] **Step 1: 扩展 API 接口引入**
在 `src/services/api.ts` 中确保我们能引入用于 Step 1 和 Step 4 的外部接口。
增加 `fetchMetadataDataSources` 和 `fetchStandardDefinitions` 的导出，如果缺失则补充。
(目前 `api.ts` 可能已存在这些方法，确保它们可以在 `DataModelingWizard` 中被调用)

- [ ] **Step 2: 扩展 Mock 数据结构**
修改 `src/mock/data.ts` 中的 `mockDevelopmentModels`，给现有数据添加新的属性占位，如 `dataSourceId`, `partitionType`, `lifecycle` 等。

- [ ] **Step 3: 更新 Mock Handlers**
修改 `src/mock/handlers.ts` 中 `POST /api/v1/development/models` 和 `PUT` 接口，使其接收并保存新增加的字段（dataSourceId, partitionType 等）。

---

### Task 2: 路由与基础向导容器搭建

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/development/DataModelingWizard.tsx`

- [ ] **Step 1: 创建基础容器框架**
创建 `DataModelingWizard.tsx`，包含状态定义 `currentStep` (0-3) 和 `modelDraft` 状态对象。
搭建页面顶部导航栏（包含返回按钮和进度指示器），底部固定操作栏（上一步、下一步、保存、取消）。

- [ ] **Step 2: 注册新路由**
在 `src/App.tsx` 中导入 `DataModelingWizard` 并将其添加到路由分发中。由于当前系统是基于 `activeMenu` 的假路由或基于 React Router，需要适配当前的导航机制。如果当前应用没有接入 `react-router-dom`，则通过在 `DataModeling.tsx` 中条件渲染全屏组件来实现路由跳转（如 `activeView === 'list' | 'wizard'`）。

*(注：鉴于现有代码似乎是基于状态条件渲染页面，推荐在 `DataModeling.tsx` 中直接控制视图切换，或在 App 层进行判断。这里假定我们在 `DataModeling` 中使用局部视图状态。)*

---

### Task 3: 改造 DataModeling 主页面视图切换

**Files:**
- Modify: `src/pages/development/DataModeling.tsx`

- [ ] **Step 1: 引入视图状态**
在 `DataModeling.tsx` 中添加状态 `const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');`。
保留现有的 `currentModel` 用于传递给编辑向导。

- [ ] **Step 2: 替换“新建/编辑”行为**
移除原来的 Modal 弹窗和 Drawer JSX。
修改新建按钮的 `onClick`：`() => setViewMode('create')`。
修改卡片编辑按钮的 `onClick`：`() => { setCurrentModel(model); setViewMode('edit'); }`。

- [ ] **Step 3: 渲染向导组件**
在 return 中做条件判断：
```tsx
if (viewMode !== 'list') {
  return <DataModelingWizard mode={viewMode} initialData={currentModel} onBack={() => { setViewMode('list'); loadData(); }} />;
}
```

---

### Task 4: 实现向导 Step 1 - 基本信息

**Files:**
- Modify: `src/pages/development/DataModelingWizard.tsx`

- [ ] **Step 1: 获取数据源**
在 `DataModelingWizard` 组件挂载时调用 `fetchMetadataDataSources()`，并将结果存入 state。

- [ ] **Step 2: 构建表单 UI**
渲染第一步的表单：数据源（下拉选择）、表名（输入框）、中文名（输入框）、分层（下拉）、业务域（下拉）、负责人（输入框）、描述（文本域）。
将表单绑定到 `modelDraft` 对象上。

---

### Task 5: 实现向导 Step 2 - 字段设计与 DDL 解析

**Files:**
- Modify: `src/pages/development/DataModelingWizard.tsx`

- [ ] **Step 1: 渲染内联表格**
当 `currentStep === 1` 时，渲染一个表格，展示 `modelDraft.fields`。
支持在表格末尾“添加一行”。每行的单元格为 `input` 或 `select`，直接修改当前行的属性。

- [ ] **Step 2: DDL 解析功能**
提供一个文本框供用户粘贴 DDL。
编写一个简单的解析函数（正则匹配 `字段名 字段类型 COMMENT '注释'`），点击解析后将结果追加到 `modelDraft.fields` 中。

---

### Task 6: 实现向导 Step 3 & Step 4 - 物理属性与标准关联

**Files:**
- Modify: `src/pages/development/DataModelingWizard.tsx`

- [ ] **Step 1: 第三步物理属性**
当 `currentStep === 2` 时，渲染分区类型选择（单选按钮组：不分区、时间分区、哈希分区）、生命周期天数（数字输入）、存储格式（下拉：Parquet/ORC/CSV）。

- [ ] **Step 2: 第四步关联数据标准**
当 `currentStep === 3` 时，调用 `fetchStandardDefinitions()` 获取所有标准。
渲染一个表格展示当前定义的 fields，并在每行提供一个下拉框，允许用户从获取到的标准中选择一个进行关联（模拟智能映射与人工确认）。

- [ ] **Step 3: 完善保存与提交流程**
在底部按钮的“保存”逻辑中，调用 `createModel` 或 `updateModel` 提交完整的 `modelDraft`，并在成功后调用 `onBack` 返回列表。