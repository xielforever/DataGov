# DataGov Src 目录扁平化重构计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `src/pages` 目录下过于扁平化的页面组件，按照业务领域或功能模块进行合理的目录划分，同时更新关联的导入路径。

**Architecture:** 
1. **模块划分**：
   - `auth`: 认证相关（目前已有，保持不变）
   - `dashboard`: 首页与工作台（`Dashboard.tsx`, `DataGovernancePanel.tsx` 等）
   - `asset`: 数据资产管理（`AssetOverview.tsx`, `AssetRegister.tsx`, `DataCatalog.tsx`, `DataMap.tsx`, `DataLineage.tsx`）
   - `metadata`: 元数据管理（`MetadataModel.tsx`, `MetadataCollect.tsx`, `MetadataManage.tsx`, `MetadataQuery.tsx`, `DataSource.tsx`）
   - `development`: 数据开发（`DataSync.tsx`, `RealtimeCompute.tsx`, `ScriptDev.tsx`, `TaskOrchestration.tsx`）
   - `service`: 数据服务（`DataServiceApi.tsx`, `DataSharing.tsx`）
   - `quality`: 数据质量与监控（`MetricManage.tsx`, `OperationsMonitor.tsx`）
2. **迁移文件**：将对应的 `.tsx` 文件移动到各自模块的子文件夹中。
3. **更新路由/引用**：更新 `src/App.tsx` 中的所有页面组件引入路径。
4. **编译校验**：确保重构后项目能够成功 `npm run build`。

**Tech Stack:** React, Vite, TypeScript

---

### Task 1: 创建按业务划分的子目录

**Files:**
- Create: `src/pages/dashboard`, `src/pages/asset`, `src/pages/metadata`, `src/pages/development`, `src/pages/service`, `src/pages/quality`

- [ ] **Step 1: 执行创建目录命令**

```bash
mkdir -p src/pages/dashboard src/pages/asset src/pages/metadata src/pages/development src/pages/service src/pages/quality
```

- [ ] **Step 2: 验证目录创建**

Run: `ls -la src/pages`
Expected: 能看到 `dashboard`, `asset`, `metadata`, `development`, `service`, `quality` 目录。

- [ ] **Step 3: Commit**

```bash
git add src/pages/
git commit -m "chore(pages): create modular directories for page components"
```

---

### Task 2: 将页面组件移动到对应模块目录

**Files:**
- Modify: Move `.tsx` files to respective directories.

- [ ] **Step 1: 移动 Dashboard 模块**

```bash
mv src/pages/Dashboard.tsx src/pages/dashboard/
mv src/pages/DataGovernancePanel.tsx src/pages/dashboard/
```

- [ ] **Step 2: 移动 Asset 模块**

```bash
mv src/pages/AssetOverview.tsx src/pages/asset/
mv src/pages/AssetRegister.tsx src/pages/asset/
mv src/pages/DataCatalog.tsx src/pages/asset/
mv src/pages/DataMap.tsx src/pages/asset/
mv src/pages/DataLineage.tsx src/pages/asset/
```

- [ ] **Step 3: 移动 Metadata 模块**

```bash
mv src/pages/MetadataModel.tsx src/pages/metadata/
mv src/pages/MetadataCollect.tsx src/pages/metadata/
mv src/pages/MetadataManage.tsx src/pages/metadata/
mv src/pages/MetadataQuery.tsx src/pages/metadata/
mv src/pages/DataSource.tsx src/pages/metadata/
```

- [ ] **Step 4: 移动 Development 模块**

```bash
mv src/pages/DataSync.tsx src/pages/development/
mv src/pages/RealtimeCompute.tsx src/pages/development/
mv src/pages/ScriptDev.tsx src/pages/development/
mv src/pages/TaskOrchestration.tsx src/pages/development/
```

- [ ] **Step 5: 移动 Service 模块**

```bash
mv src/pages/DataServiceApi.tsx src/pages/service/
mv src/pages/DataSharing.tsx src/pages/service/
```

- [ ] **Step 6: 移动 Quality 模块**

```bash
mv src/pages/MetricManage.tsx src/pages/quality/
mv src/pages/OperationsMonitor.tsx src/pages/quality/
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(pages): move page components into modular directories"
```

---

### Task 3: 更新 App.tsx 中的导入路径

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 修改导入语句**

使用代码编辑工具将 `src/App.tsx` 中的组件引入路径更新为对应的子目录路径。例如：
`import Dashboard from "./pages/Dashboard";` -> `import Dashboard from "./pages/dashboard/Dashboard";`
`import DataGovernancePanel from "./pages/DataGovernancePanel";` -> `import DataGovernancePanel from "./pages/dashboard/DataGovernancePanel";`
以此类推。

- [ ] **Step 2: 运行编译检查是否报错**

Run: `npm run build`
Expected: 编译通过。如果存在组件内部互相引用导致的路径错误（例如 Breadcrumb 路径 `../components/common/Breadcrumb` 因为目录层级变深需要改为 `../../components/common/Breadcrumb`，或 `api` 引用路径改变），记录并在下一步修复。

---

### Task 4: 修复页面内部的相对路径引用（如果有）

**Files:**
- Modify: 各个被移动的 `.tsx` 页面文件内部的组件和 api 引用。

- [ ] **Step 1: 批量修复组件与服务路径**
由于页面文件向下移动了一层，原本引用 `../components/...` 的需要改为 `../../components/...`，原本引用 `../services/...` 的需要改为 `../../services/...`。

- [ ] **Step 2: 运行编译验证修复**

Run: `npm run build`
Expected: `✓ built in xxx`，无报错。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix(pages): update relative import paths after directory restructuring"
```
