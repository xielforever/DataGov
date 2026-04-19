# 通用审批中心重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有的审批中心重构为一个通用的审批平台，支持按模块筛选（如数据建模、数据标准），并将其移动至左侧菜单的倒数第二项。

**Architecture:** 
1. **Mock 接口扩展**：重构 `Approval` 数据结构，加入 `moduleType`、`title` 和 `payload`，以适应不同业务的审批需求。
2. **菜单与路由重构**：修改 `Sidebar.tsx`，将审批中心移至“数据服务”和“系统管理”之间，并添加三个二级菜单：待我审批、我发起的、已处理。
3. **通用审批列表页**：重写 `ApprovalCenter.tsx`，支持顶部模块下拉筛选，表格展示通用字段。
4. **动态详情组件**：在详情抽屉中，根据不同的 `moduleType` 渲染差异化的内容块。

**Tech Stack:** React, Tailwind CSS, Lucide React, MSW

---

### Task 1: 扩展 Mock 数据结构与接口

**Files:**
- Modify: `src/mock/data.ts`
- Modify: `src/mock/handlers.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: 重构 `data.ts` 中的 `Approval` 接口及 Mock 数据**
将 `Approval` 接口修改为泛型结构，并更新现有的 mock 数据。
```typescript
export interface Approval {
  id: string;
  moduleType: 'data_model' | 'data_standard' | 'code_value';
  title: string;
  applicant: string;
  applyTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processTime?: string;
  processor?: string;
  payload: any;
}

// 覆盖原有的 mockApprovals
export const mockApprovals: Approval[] = [
  {
    id: "app-001",
    moduleType: "data_model",
    title: "申请同步物理表: ods_user_info_di",
    applicant: "张无忌",
    applyTime: "2026-04-19 10:00:00",
    reason: "新增了两个字段，需要同步物理表",
    status: "pending",
    payload: {
      modelId: "mod-1",
      modelName: "ods_user_info_di",
      ddl: "CREATE TABLE IF NOT EXISTS `ods_user_info_di` (...);"
    }
  },
  {
    id: "app-002",
    moduleType: "data_standard",
    title: "申请发布数据标准: 性别代码",
    applicant: "赵敏",
    applyTime: "2026-04-19 11:30:00",
    reason: "业务补充了未知性别的定义",
    status: "pending",
    payload: {
      standardId: "std-001",
      diff: "新增码值: [0-未知]"
    }
  }
];
```

- [ ] **Step 2: 修改 `handlers.ts` 中的审批接口**
1. 修改模型同步接口 `/api/v1/development/models/:id/sync`，在 push 新审批时，使用新的数据结构：
```typescript
mockApprovals.push({
  id: `app-${Date.now()}`,
  moduleType: 'data_model',
  title: `申请同步物理表: ${mockDevelopmentModels[index].name}`,
  applicant: '当前用户',
  applyTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
  reason: reason || "无",
  status: 'pending',
  payload: {
    modelId: id,
    modelName: mockDevelopmentModels[index].name
  }
});
```
2. 修改 `GET /api/v1/approvals` 接口，支持按视角 (`viewType`) 获取不同状态的数据（在前端过滤也可，这里后端直接返回所有数据供前端过滤）。
3. 修改 `POST /api/v1/approvals/:id/process`，更新处理逻辑，确保审批通过时，只有 `moduleType === 'data_model'` 才会去更新 `mockDevelopmentModels`。

- [ ] **Step 3: 修改 `api.ts` 的接口调用**
```typescript
export const fetchApprovals = () => fetchJson('/approvals');
```

---

### Task 2: 重构菜单结构 (Sidebar.tsx)

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: 修改菜单数组顺序及结构**
找到 `menuItems` 数组，将 `id: 'approvals'` 移动到 `id: 'data-service'` 之后，`id: 'system-manage'` 之前。

- [ ] **Step 2: 添加审批中心二级菜单**
```typescript
    {
      id: 'approvals',
      label: '审批中心',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      children: [
        { id: 'approvals-todos', label: '待我审批', icon: null },
        { id: 'approvals-applies', label: '我发起的', icon: null },
        { id: 'approvals-processed', label: '已处理', icon: null },
      ],
    },
```

---

### Task 3: 重构通用审批中心页面 (ApprovalCenter.tsx)

**Files:**
- Modify: `src/pages/approvals/ApprovalCenter.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 增加路由匹配支持**
在 `App.tsx` 中，确保路由能匹配 `/approvals/:viewType`，或者在 `ApprovalCenter.tsx` 中通过内部状态 `viewType` 控制，由于我们用了 Sidebar 菜单跳转，建议 `ApprovalCenter` 接受一个 `viewType` prop 或者根据 URL 路径决定当前显示的视角 (`todos` | `applies` | `processed`)。为简单起见，本实现中 `ApprovalCenter` 内部通过状态 `activeTab` 响应不同的 URL（或者直接在 `App.tsx` 统配）。
修改 `App.tsx` 路由：
```tsx
<Route path="/approvals/:viewType" element={<ApprovalCenter />} />
<Route path="/approvals" element={<Navigate to="/approvals/todos" replace />} />
```

- [ ] **Step 2: 在 `ApprovalCenter.tsx` 实现通用列表与筛选**
引入 `useParams` 获取 `viewType`。
新增下拉框，用于选择 `moduleType`（全部、数据建模、数据标准、码值管理）。
```tsx
const MODULE_TYPES = {
  all: '全部模块',
  data_model: '数据建模',
  data_standard: '数据标准',
  code_value: '码值管理'
};
```
过滤逻辑：
- `todos`: `status === 'pending'`
- `applies`: `applicant === '当前用户'` (这里可假定为固定值或不强求，因为 mock 数据限制，可以粗略定义)
- `processed`: `status !== 'pending'`

- [ ] **Step 3: 实现动态详情抽屉**
在抽屉中：
```tsx
{selectedApproval.moduleType === 'data_model' && (
  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
    <p className="text-cyan-400 mb-2">模型ID: {selectedApproval.payload.modelId}</p>
    <p>目标动作: CREATE TABLE</p>
  </div>
)}
{selectedApproval.moduleType === 'data_standard' && (
  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-300">
    <p className="text-emerald-400 mb-2">标准差异:</p>
    <p>{selectedApproval.payload.diff}</p>
  </div>
)}
```