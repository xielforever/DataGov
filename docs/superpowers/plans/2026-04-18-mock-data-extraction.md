# DataGov Mock Data & API Service Implementation Plan (v2.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提取各页面硬编码数据，建立标准的 API 请求层，并引入 MSW (Mock Service Worker) 在网络层拦截请求返回 Mock 数据。实现前端异步逻辑闭环，为后续对接真实后端实现零代码修改。最后输出 OpenAPI 风格的前后端对接需求文档。

**Architecture:** 
1. **Mock 层**：
   - 建立 `src/mock/data/` 存放原子化的业务实体数据（不再按页面划分）。
   - 建立 `src/mock/handlers.ts` 定义 RESTful API 路由拦截。
   - 建立 `src/mock/browser.ts` 初始化 MSW worker。
2. **API 服务层**：
   - 在 `src/services/api.ts` 中封装所有与后端的真实异步交互逻辑（使用原生 `fetch`）。
3. **页面层改造**：
   - 移除 `asset`, `dashboard`, `metadata` 下页面的静态数据定义。
   - 引入 `useEffect` 和状态管理，调用 `services/api.ts` 中的方法获取数据并渲染，处理 Loading 状态。
4. **常量提取**：
   - 将页面中的枚举选项、状态字典提取到 `src/constants/` 目录下。

**Tech Stack:** React, TypeScript, MSW (Mock Service Worker)

---

### Task 1: 初始化 MSW 及常量目录

**Files:**
- Create: `src/constants/index.ts`
- Create: `src/mock/browser.ts`, `src/mock/handlers.ts`, `src/mock/data.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: 确保已安装 MSW**

Run: `npm list msw` 检查是否已安装。如果未安装，运行 `npm install msw --save-dev` 并执行 `npx msw init public/ --save`。

- [ ] **Step 2: 提取通用常量到 constants/index.ts**

将如 `STATUS_FILTERS`, `CATEGORIES` 等纯前端字典提取出来：
```typescript
// src/constants/index.ts
export const DATA_SOURCE_CATEGORIES = ["全部", "关系型", "大数据", "消息队列", "NoSQL", "搜索引擎", "OLAP"];
export const BUSINESS_DOMAINS = ["交易域", "用户域", "商品域", "营销域", "财务域", "风控域"];
// ...
```

- [ ] **Step 3: 初始化 MSW 基础文件**

```typescript
// src/mock/handlers.ts
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok' }))
];

// src/mock/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
```

- [ ] **Step 4: 在入口文件接入 MSW**

修改 `src/main.tsx`，在非生产环境下启动 worker：
```typescript
async function enableMocking() {
  if (import.meta.env.PROD) return;
  const { worker } = await import('./mock/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
```

- [ ] **Step 5: Commit**

```bash
git add src/constants/ src/mock/ src/main.tsx package.json package-lock.json public/mockServiceWorker.js
git commit -m "chore: setup msw and constants directory"
```

---

### Task 2: 建立领域 Mock 数据与 Handlers

**Files:**
- Modify: `src/mock/data.ts`
- Modify: `src/mock/handlers.ts`

- [ ] **Step 1: 在 data.ts 中定义原子数据**

将散落在 `DataSource.tsx`, `AssetRegister.tsx`, `Dashboard.tsx`, `MetadataCollect.tsx` 等文件中的数据收集到 `data.ts` 中。
按实体分类：`dataSources`, `assets`, `models`, `tasks` 等。导出 TypeScript 接口。

- [ ] **Step 2: 在 handlers.ts 中配置 REST API 路由**

根据前端需求，设计以下路由并使用 `data.ts` 中的数据返回：
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/assets`
- `GET /api/v1/data-sources`
- `GET /api/v1/metadata/models`
- `GET /api/v1/metadata/tasks`

```typescript
http.get('/api/v1/data-sources', () => {
  return HttpResponse.json({ code: 0, data: mockDataSources });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/mock/
git commit -m "feat: define domain mock data and api handlers"
```

---

### Task 3: 构建前端 API Service 层

**Files:**
- Create: `src/services/api.ts`

- [ ] **Step 1: 编写 API 请求方法**

基于原生 `fetch` 封装通用的请求逻辑，并为各个实体定义获取方法。
```typescript
const BASE_URL = '/api/v1';

export async function fetchDataSources() {
  const res = await fetch(`${BASE_URL}/data-sources`);
  const json = await res.json();
  return json.data;
}
// ... 为其他实体如 assets, dashboard stats 等编写对应方法
```

- [ ] **Step 2: Commit**

```bash
git add src/services/
git commit -m "feat: create frontend api service layer"
```

---

### Task 4: 页面组件接入真实 API 改造

**Files:**
- Modify: `src/pages/dashboard/Dashboard.tsx`
- Modify: `src/pages/asset/AssetOverview.tsx` (及其它有硬编码数据的页面)

- [ ] **Step 1: 替换硬编码并引入异步加载**

以 `Dashboard.tsx` 为例，删除原有硬编码，改写为：
```typescript
import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  // ... render stats
}
```

- [ ] **Step 2: 验证页面正常渲染**

Run: `npm run dev`
打开浏览器，确认 MSW 成功拦截请求，且各个页面能够正常通过异步请求获取数据并渲染，没有控制台错误。

- [ ] **Step 3: Commit**

```bash
git add src/pages/
git commit -m "refactor: integrate pages with async api service and remove hardcoded data"
```

---

### Task 5: 产出《前端 API 需求对接草案》

**Files:**
- Create: `docs/api-specification.md`

- [ ] **Step 1: 编写 OpenAPI 风格文档**

基于 `src/mock/handlers.ts` 和 `src/mock/data.ts` 的结构，出具 Markdown 格式的接口文档，包含：
1. **全局规范**：`/api/v1` 前缀，标准返回体格式 `{ code: 0, data: any, message: string }`。
2. **接口列表**：针对 `/api/v1/data-sources`、`/api/v1/assets` 等，列出 HTTP Method、查询参数、返回值 JSON Schema。
此文档将作为后续与后端工程师对接的契约草案。

- [ ] **Step 2: Commit**

```bash
git add docs/api-specification.md
git commit -m "docs: generate api specification draft based on mock implementation"
```