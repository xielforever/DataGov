# Plan: 下一阶段真实后端扩展与运营化

**Generated**: 2026-06-09  
**Estimated Complexity**: High  
**Recommended Goal**: 完成 DataGov 第二批核心模块真实后端化与运营管理闭环：以 IAM 管理、资产/元数据、标准/质量、AI 运营台、MSW 退出治理为主线，把当前“可运行的生产化底座”推进成“可管理、可扩展、可持续退出 Mock”的平台。

## Overview

上一阶段已经完成登录权限、数据源、脚本开发、AI 助手、审批中心的首批真实后端闭环，并建立 smoke、Playwright、CI 与 MiniMax E2E。下一阶段不建议继续优先做新 UI，而应优先补齐“运营管理能力”和“真实治理对象数据模型”，让平台从 demo/workbench 进入可持续迭代状态。

推荐顺序：

1. 先补 IAM 管理闭环，解决用户、角色、权限不可运营的问题。
2. 再扩资产/元数据真实后端，让治理对象不再只是页面 Mock。
3. 接着做数据标准与质量规则真实闭环，让治理动作有落地点。
4. 然后补 AI 运营台，把已有后端生产化能力可视化、可配置。
5. 最后扩大测试、CI、endpoint 状态矩阵，系统性退出 MSW。

## Prerequisites

- 远程 PostgreSQL、Redis、本地 `.env.local` 已可用。
- 已完成并推送 `production-hardening-mock-exit-goal`。
- 数据代理 / Connector Gateway 仍作为独立项目，不在 DataGov 内实现外部源数据直连执行。
- 真实密钥、数据库密码、MiniMax token 不写入仓库。
- 所有新业务 Mock 必须继续遵守 `src/mock/data.ts` → `src/mock/handlers.ts` → `src/services/api.ts`。

## Sprint 1: IAM 管理运营闭环

**Goal**: 让管理员可以通过真实后端管理用户、角色、权限和组织，不再只靠默认管理员与静态权限点。

**Demo/Validation**:

- 管理员登录后进入系统管理，查看用户、角色、组织。
- 创建/禁用用户、调整角色权限后，后端权限立即生效。
- 普通用户缺权限访问核心接口返回 403，前端显示无权限状态。

### Task 1.1: 权限与角色 API

- **Location**: `backend/internal/modules/iam`, `backend/internal/platform/server`, `backend/migrations`
- **Description**: 增加 `GET /api/v1/iam/permissions`、`GET/PUT /api/v1/iam/roles/{id}/permissions`、角色列表/详情接口。
- **Dependencies**: 当前 IAM 表结构与 `iam.HasPermission`
- **Acceptance Criteria**:
  - 管理员可读取全部权限点。
  - 修改角色权限后无需重启即可生效。
  - 非管理员调用返回 403。
- **Validation**: `go test ./...`、API smoke 增加 permissions/role permissions。

### Task 1.2: 用户与组织真实 API

- **Location**: `backend/internal/modules/iam`, `backend/migrations`, `src/pages/system/UserManage.tsx`, `src/pages/system/OrgManage.tsx`
- **Description**: 增加用户 CRUD、启停、重置初始密码占位、组织树 API；前端系统管理页接入真实服务函数。
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - 用户列表、组织树来自后端。
  - 密码永不回传。
  - 用户禁用后旧 session 失效或下一次鉴权失败。
- **Validation**: API smoke + Playwright 管理员路径。

### Task 1.3: 前端权限运营体验

- **Location**: `src/pages/system/RoleManage.tsx`, `src/services/api.ts`, `src/types/api.ts`
- **Description**: 角色详情页展示权限矩阵，支持勾选保存；按钮按 `system:manage` 控制。
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - 权限保存后刷新仍一致。
  - 缺权限用户不可见编辑入口。
- **Validation**: `npx.cmd vite build --emptyOutDir=false`、浏览器检查无横向溢出。

## Sprint 2: 资产与元数据真实后端

**Goal**: 把数据资产、业务域、数据目录、元数据查询从 Mock-only 推进到真实后端主链路。

**Demo/Validation**:

- 数据资产总览、业务域、数据目录读取真实后端数据。
- 数据源同步可生成或刷新资产/字段元数据快照。
- Endpoint 状态矩阵中资产/元数据核心接口从 Mock-only 迁移为 Passthrough/Real。

### Task 2.1: 资产元数据模型迁移

- **Location**: `backend/migrations`, `backend/internal/modules/assets`
- **Description**: 新增 `asset_tables`、`asset_columns`、`business_domains`、`asset_tags`、`lineage_edges` 等基础表。
- **Dependencies**: Sprint 1 可并行，但权限点需同步补齐。
- **Acceptance Criteria**:
  - 表结构可重复迁移。
  - 有最小样例资产数据 seed。
- **Validation**: `go run ./backend/cmd/datagov-api --migrate-only`、`--check-migrations`。

### Task 2.2: Connector Gateway 契约占位

- **Location**: `docs/connector-gateway-contract.md`, `backend/internal/modules/metadata`
- **Description**: 定义 DataGov 与独立数据代理项目的 HTTP 契约；DataGov 只保存连接注册、同步任务、审计结果，不直连任意外部源执行查询。
- **Dependencies**: 无
- **Acceptance Criteria**:
  - 文档明确连接测试、元数据采集、血缘采集、任务状态回调契约。
  - 后端保留 client interface；无 gateway 配置时使用样例快照或 MSW 兜底。
- **Validation**: 文档评审 + smoke 不依赖 gateway。

### Task 2.3: 资产目录 API 与页面接入

- **Location**: `backend/internal/modules/assets`, `src/pages/asset/*`, `src/services/api.ts`
- **Description**: 实现资产总览、目录查询、表详情、字段列表、业务域树接口，并改造页面从服务函数读取。
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - 页面不再硬编码业务资产行。
  - 查询、筛选、分页由后端返回。
  - MSW handler 只作为显式 fallback。
- **Validation**: API smoke 增加资产目录；Playwright 覆盖资产目录打开与筛选。

### Task 2.4: 血缘只读摘要

- **Location**: `backend/internal/modules/assets`, `src/pages/asset/DataLineage.tsx`
- **Description**: 基于 `lineage_edges` 提供只读血缘摘要和影响范围；暂不做外部源实时探查。
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - 血缘页不白屏，能展示样例上下游。
  - AI `lineage.getImpactSummary` 可读取真实后端摘要。
- **Validation**: MiniMax E2E 增加血缘分析问题。

## Sprint 3: 数据标准与质量规则闭环

**Goal**: 让数据标准、码值、字典、质量规则成为真实治理对象，并为 AI 工具提供真实只读上下文。

**Demo/Validation**:

- 标准定义、标准映射、数据字典、码值管理可从后端读写。
- 质量规则支持创建、启停、基础检查批次占位。
- AI 质量规则/标准搜索工具不再只依赖 Mock。

### Task 3.1: 标准与字典数据模型

- **Location**: `backend/migrations`, `backend/internal/modules/standards`
- **Description**: 新增标准定义、标准映射、数据字典、码值表，保留版本与状态字段。
- **Dependencies**: Sprint 1 权限点
- **Acceptance Criteria**:
  - 标准定义支持创建、编辑、停用。
  - 标准映射能关联资产字段。
- **Validation**: Go handler/repository 基础测试。

### Task 3.2: 标准页面真实接入

- **Location**: `src/pages/standard/*`, `src/services/api.ts`, `src/mock/handlers.ts`
- **Description**: 将标准定义、映射、字典、码值页面改为真实 API 优先。
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - 页面数据来自服务函数。
  - Mock-only endpoint 在状态矩阵中更新退出条件。
- **Validation**: Vite build + Playwright 标准定义路径。

### Task 3.3: 质量规则数据模型与 API

- **Location**: `backend/migrations`, `backend/internal/modules/quality`
- **Description**: 新增质量规则、规则模板、检查批次、检查问题表；首期不执行真实源数据校验，只保存规则和占位执行结果。
- **Dependencies**: Sprint 2 资产字段模型
- **Acceptance Criteria**:
  - 质量规则可创建、启停、关联资产字段。
  - 规则运行生成可审计占位批次。
- **Validation**: API smoke 增加质量规则列表和创建。

### Task 3.4: AI 工具切换真实服务

- **Location**: `backend/internal/modules/ai`, `backend/internal/modules/standards`, `backend/internal/modules/quality`
- **Description**: AI 只读工具 `standard.searchStandards`、`quality.searchRules` 改为查询真实 service 摘要。
- **Dependencies**: Task 3.1, Task 3.3
- **Acceptance Criteria**:
  - 工具结果按当前用户权限过滤。
  - 不返回敏感样本值或凭证。
- **Validation**: MiniMax E2E 增加标准/质量问题。

## Sprint 4: AI 运营台与可配置治理

**Goal**: 把已完成的 AI 后端生产化能力暴露给管理员，让 Prompt、配额、观测、反馈和行为数据可运营。

**Demo/Validation**:

- 管理员可查看 AI 请求、Token、限流、工具调用趋势。
- 管理员可调整 Prompt 模板状态和配额策略。
- 用户反馈与行为事件能用于后续优化。

### Task 4.1: AI 运营 API

- **Location**: `backend/internal/modules/ai`, `backend/internal/platform/server/ai.go`
- **Description**: 增加 Prompt 模板列表/启停、配额策略列表/编辑、限流事件列表、反馈列表接口。
- **Dependencies**: 已有 `ai_prompt_templates`、`ai_quota_policies`、`ai_rate_limit_events`
- **Acceptance Criteria**:
  - 所有接口需要 `ai:observability:read` 或新增管理权限。
  - 修改配额后下一次请求生效。
- **Validation**: Go test + API smoke。

### Task 4.2: AI 运营前端页面

- **Location**: `src/pages/system` 或新增 `src/pages/ai`
- **Description**: 增加 AI 运营视图：Token 趋势、限流事件、工具调用、Prompt 模板、配额策略。
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - 无权限用户不可见入口。
  - 错误状态不白屏。
  - 不展示真实 token 或完整 prompt 中的敏感内容。
- **Validation**: Vite build + 浏览器检查无横向溢出。

### Task 4.3: AI 成本与上下文优化

- **Location**: `backend/internal/modules/ai`
- **Description**: 增加上下文裁剪策略配置、历史摘要复用、重复问题短期缓存、Token 预算预估误差记录。
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - 长上下文请求可被稳定裁剪。
  - Token 用量趋势可下降或可解释。
- **Validation**: MiniMax E2E + 构造长上下文 smoke。

## Sprint 5: MSW 退出治理与测试扩展

**Goal**: 把“真实后端优先”制度化，逐步收缩 Mock-only 范围，并扩大自动验收覆盖面。

**Demo/Validation**:

- Endpoint 状态矩阵覆盖第二批迁移接口。
- API smoke 覆盖 IAM、资产、标准、质量、AI 运营。
- Playwright 覆盖至少 5 条核心业务路径。

### Task 5.1: Endpoint 状态矩阵自动巡检

- **Location**: `scripts`, `docs/api-docs/endpoint-status.md`
- **Description**: 增加脚本扫描 `src/services/api.ts` 和 MSW handlers，输出未登记 endpoint。
- **Dependencies**: 无
- **Acceptance Criteria**:
  - 新 endpoint 未登记时脚本失败。
  - CI 可运行该脚本。
- **Validation**: 本地脚本 + GitHub Actions。

### Task 5.2: API smoke 扩展

- **Location**: `scripts/smoke-api.ps1`
- **Description**: 覆盖 IAM、资产目录、标准定义、质量规则、AI 运营接口。
- **Dependencies**: Sprint 1-4
- **Acceptance Criteria**:
  - 输出不打印 token、密码、连接串。
  - 单个模块失败有清晰名称。
- **Validation**: 本地运行 smoke。

### Task 5.3: Playwright 核心路径扩展

- **Location**: `tests/e2e`
- **Description**: 增加登录、数据源、脚本、资产目录、标准定义、质量规则、AI 助手、审批处理路径。
- **Dependencies**: Sprint 2-4
- **Acceptance Criteria**:
  - 至少 5 条路径可稳定运行。
  - 失败截图进入 ignored 输出目录。
- **Validation**: `npm run e2e:core` 或拆分 `npm run e2e:smoke`。

## Testing Strategy

- **每个 Sprint 必跑**:
  - `go test ./...`
  - `npx.cmd vite build --emptyOutDir=false`
  - `go run ./backend/cmd/datagov-api --check-migrations`
- **真实接口变更必跑**:
  - `.\scripts\smoke-api.ps1`
- **AI 相关变更必跑**:
  - `.\scripts\smoke-ai-minimax.ps1`
- **UI 行为变更必跑**:
  - `npm run e2e:core`
  - 浏览器检查 `http://127.0.0.1:5174/` 控制台错误与横向溢出。

## Potential Risks & Gotchas

- **范围过大**：资产、标准、质量、系统管理都很大，必须按 Sprint 拆分提交，避免一次性大爆炸。
- **数据代理边界漂移**：DataGov 只做注册、编排、审计、快照读取；外部源执行必须留给独立 Connector Gateway。
- **权限模型反噬 UI**：权限点增加后必须同步 IAM seed、权限矩阵、前端菜单、按钮和 smoke。
- **Mock 与真实接口漂移**：每迁移一个 endpoint 都更新 `docs/api-docs/endpoint-status.md`，并尽量加 smoke。
- **AI 工具越权**：AI 工具只能复用当前用户权限和只读 service，不允许绕过业务 service 直接查表返回敏感数据。
- **CI 密钥问题**：GitHub Actions 不应跑真实 PG/Redis/MiniMax；真实 E2E 保留本地或受控环境执行。

## Rollback Plan

- 每个 Sprint 单独提交，必要时按 commit 回滚。
- 数据库迁移只做新增表/列/索引，不删除旧字段。
- 前端真实接口保留 MSW fallback 开关，遇到真实 API 阻塞可临时切回 mock。
- 新菜单入口先用权限控制隐藏，确认稳定后再默认开放。

## Suggested Goal Statement

在 `D:\devops\DataGov` 中完成 DataGov 下一阶段真实后端扩展与运营化：优先补齐 IAM 管理闭环，再将资产/元数据、数据标准、质量规则迁移到真实 Go 后端主链路，并增加 AI 运营台、Connector Gateway 契约占位、endpoint 状态巡检、扩展 smoke 和 Playwright 验收。DataGov 不内置外部源数据执行代理；外部源测试、采集、血缘等通过独立 Connector Gateway 契约集成或暂用 MSW/样例快照兜底。所有新增能力必须经过权限校验、迁移管理、文档登记和构建测试，不允许真实密钥进入仓库。
