# 数据建模高危操作审批流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现数据建模“同步物理表”高危操作的集中式审批流程，包含提交申请、独立审批中心页面及审批通过后的后台同步执行逻辑。

**Architecture:** 
1. **Mock 数据层**：扩展模型状态 (`sync_approving`)，新增工单审批表 (`mockApprovals`)，新增提交工单和处理工单的 MSW 接口。
2. **数据开发层**：修改 `DataModeling.tsx`，将原有的直接同步按钮改为“申请同步”，点击后弹出申请工单填写框。
3. **全局路由层**：在 `App.tsx` 和全局导航中增加 `/approvals` 一级菜单路由。
4. **审批中心层**：新增 `ApprovalCenter.tsx` 页面，实现按状态筛选工单列表，支持侧边抽屉查看工单详情并进行通过/驳回操作。

**Tech Stack:** React, Tailwind CSS, Lucide React, MSW (Mock Service Worker), React Router DOM

---

### Task 1: 扩展 Mock 数据与接口 (后端模拟)

**Files:**
- Modify: `src/mock/data.ts`
- Modify: `src/mock/handlers.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: 在 `data.ts` 中新增 `mockApprovals` 和相关接口**
在 `src/mock/data.ts` 底部新增工单数据：
```typescript
export interface Approval {
  id: string;
  type: string; // e.g., 'sync_model'
  modelId: string;
  modelName: string;
  applicant: string;
  applyTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  processTime?: string;
  processor?: string;
}

export const mockApprovals: Approval[] = [
  {
    id: "app-001",
    type: "sync_model",
    modelId: "mod-1",
    modelName: "ods_user_info_di",
    applicant: "张无忌",
    applyTime: "2026-04-19 10:00:00",
    reason: "新增了两个字段，需要同步物理表",
    status: "pending"
  }
];
```

- [ ] **Step 2: 修改 `handlers.ts` 中的同步接口为提交申请**
修改 `http.post('/api/v1/development/models/:id/sync', ...)` 接口逻辑：
不再执行 DDL，而是将模型的 `syncStatus` 改为 `sync_approving`，并向 `mockApprovals` push 一条新记录。

- [ ] **Step 3: 在 `handlers.ts` 中新增审批查询与处理接口**
```typescript
  // Approvals endpoints
  http.get('/api/v1/approvals', () => {
    return HttpResponse.json({ code: 0, data: mockApprovals });
  }),
  http.post('/api/v1/approvals/:id/process', async ({ request, params }) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { action } = await request.json() as any; // 'approve' | 'reject'
    const index = mockApprovals.findIndex(a => a.id === id);
    
    if (index > -1) {
      const approval = mockApprovals[index];
      approval.status = action === 'approve' ? 'approved' : 'rejected';
      approval.processTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      approval.processor = '管理员';

      // 如果是审批通过，则执行原本的建表逻辑，并写日志
      const modelIndex = mockDevelopmentModels.findIndex(m => m.id === approval.modelId);
      if (modelIndex > -1) {
        if (action === 'approve') {
          mockDevelopmentModels[modelIndex].syncStatus = 'synced';
          mockDevelopmentModels[modelIndex].updateTime = approval.processTime;
          mockModelSyncLogs.push({
            id: `log-${Date.now()}`,
            modelId: approval.modelId,
            syncTime: approval.processTime,
            status: 'success',
            operator: '管理员 (审批执行)',
            details: `CREATE TABLE IF NOT EXISTS \`${approval.modelName}\` (...);\n-- 审批通过并同步成功`
          });
        } else {
          mockDevelopmentModels[modelIndex].syncStatus = 'unsynced';
        }
      }
      return HttpResponse.json({ code: 0, data: approval });
    }
    return HttpResponse.json({ code: 404, message: "审批单不存在" });
  }),
```
（确保导入了 `mockApprovals` 和相应的依赖）

- [ ] **Step 4: 在 `api.ts` 暴露新接口**
```typescript
export const fetchApprovals = () => fetchJson('/approvals');
export const processApproval = (id: string, action: 'approve' | 'reject') => fetchJson(`/approvals/${id}/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action })
});
// 修改 syncModelToDb 接收 reason 参数
export const applyModelSync = (id: string, reason: string) => fetchJson(`/development/models/${id}/sync`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reason })
});
```

---

### Task 2: 改造数据建模页面的同步申请流程

**Files:**
- Modify: `src/pages/development/DataModeling.tsx`

- [ ] **Step 1: 修改 `syncStatus` 类型定义和 UI 渲染**
在 `Model` 接口中扩展 `syncStatus` 类型：`'unsynced' | 'synced' | 'failed' | 'sync_approving'`。
在表格渲染中增加 `sync_approving` 的标签显示（例如黄色或橙色的“审批中”）。

- [ ] **Step 2: 替换直接同步的按钮和逻辑**
将 `confirmSync` 函数和 `handleSyncToDb` 按钮逻辑，从“直接执行高危确认”改为“弹出申请工单填写框”。
当模型状态为 `sync_approving` 时，禁用“申请同步”按钮，或者隐藏。

- [ ] **Step 3: 更新弹窗为“提交同步申请”**
在弹窗中增加一个 `textarea` 用于填写 `reason` (申请原因)。
点击确认时调用 `applyModelSync(syncConfirmModel.id, reason)`。

---

### Task 3: 增加一级菜单和路由

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: 配置 `App.tsx` 路由**
导入并配置 `/approvals` 路由，指向新的 `<ApprovalCenter />` 组件（组件在下一步创建）。

- [ ] **Step 2: 更新 `Sidebar.tsx`**
在侧边栏主导航数组中，新增一个与“数据资产”、“数据开发”平级的项：
```typescript
{ name: '审批中心', icon: FileCheck, path: '/approvals' }
```
（需引入相应的 lucide-react 图标，如 `FileCheck` 或 `ClipboardCheck`）

---

### Task 4: 实现独立的【审批中心】页面

**Files:**
- Create: `src/pages/approvals/ApprovalCenter.tsx`

- [ ] **Step 1: 创建页面结构和状态**
实现一个包含 Tabs（待审批、已处理）和表格的页面。
获取并展示 `fetchApprovals()` 的数据。

- [ ] **Step 2: 实现列表展示**
表格列包括：工单编号、申请类型、关联模型名、申请人、申请时间、状态、操作。

- [ ] **Step 3: 实现审批抽屉 (Drawer) 和通过/驳回逻辑**
点击“处理”按钮时，滑出右侧 Drawer，展示工单详细信息（申请原因等）。
提供两个按钮：`驳回 (Reject)` 和 `同意并执行同步 (Approve)`。
调用 `processApproval(id, action)` 接口，成功后使用 `toast.success` 提示并刷新列表。
