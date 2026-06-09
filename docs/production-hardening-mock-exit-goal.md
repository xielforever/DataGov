# Goal: DataGov 生产化加固与核心模块 Mock 退出

**生成日期**：2026-06-09  
**复杂度**：High  
**目标仓库**：`D:\devops\DataGov`  
**适用范围**：React/Vite 前端、Go 后端、MSW Mock、PostgreSQL、Redis、AI Gateway、MiniMax E2E、权限与审计  
**执行原则**：真实后端优先，MSW 只作为明确兜底；每个阶段必须可运行、可演示、可回滚。

## 1. 可直接用于 Goal 的目标语句

在 `D:\devops\DataGov` 中完成 DataGov 生产化加固与核心模块 Mock 退出：以登录权限、数据源管理、脚本开发、AI 助手、审批中心为首批真实后端闭环，补齐启动文档、环境配置样例、迁移校验、配置安全、后端权限校验、前端权限可见性、MSW 退出开关、API smoke test、Playwright 核心路径和 CI 构建检查。所有真实接口优先接入 Go 后端；业务细节未确认时允许使用 `src/mock/data.ts`、`src/mock/handlers.ts`、`src/services/api.ts` 形成 MSW 兜底，但必须标注 endpoint 状态，不允许静默伪装成生产结果。AI 功能最终验收优先使用 MiniMax Anthropic-compatible `MiniMax-M3` 完成 E2E；如供应商、网络、额度或本地服务不可恢复，再降级到 MSW，并记录原因。

## 2. 当前基线

- 前端是 React 19 + Vite 7 + Tailwind CSS 4 的企业数据治理工作台。
- Go 后端已存在，并已接入远程 PostgreSQL、Redis、登录、数据源管理、脚本开发和 AI Gateway 的基础链路。
- AI Copilot 生产化主链路已完成一轮：会话、消息、偏好、行为事件、Token 用量、上下文预览、反馈、只读工具审计和 MSW fallback 已有实现基础。
- 远程 PostgreSQL/Redis 可用于本地开发；真实密钥、数据库密码、SSH 密码不得写入仓库。
- 数据代理 / Connector Gateway 已明确作为独立项目推进，DataGov 当前只保留接口集成 TODO，不在本阶段内置实现。
- 仍有大量非核心页面依赖 MSW；下一阶段不追求一次性移除所有 Mock，而是先把核心业务闭环做稳。

## 3. 范围与非目标

### 必须完成

- 建立可重复启动、可验证、可交接的本地开发运行基线。
- 登录权限从“能登录”升级为后端强校验 + 前端可见性控制 + 403 体验。
- 数据源管理、脚本开发、AI 助手继续保持真实后端优先，并补齐 smoke test 和降级边界。
- 审批中心进入首批真实后端闭环，支撑脚本发布等流程的占位或真实审批实例。
- 建立 MSW endpoint 状态矩阵，明确 Real / Passthrough / Mock-only / Deprecated。
- 建立 API smoke、核心 Playwright E2E、前后端构建测试和 CI 检查。

### 本阶段不做

- 不引入 Java 后端技术栈。
- 不在 DataGov 内实现独立数据代理、CDM、Connector Gateway 或外部源数据执行代理。
- 不一次性移除所有 MSW mock。
- 不把真实 token、数据库密码、SSH 密码、连接串写入文档、代码、测试报告、截图或 Mock 数据。
- 不做破坏性数据库迁移；优先新增表、新增列和前向兼容。
- 不让 AI 自动执行删除数据、发布脚本、修改权限、绕过审批等危险动作。

## 4. 生产化原则

- **真实接口优先**：核心模块优先走 Go 后端；MSW 只作为未完成能力的显式兜底。
- **权限默认拒绝**：后端是最终权限边界，前端隐藏按钮只是体验优化。
- **迁移优先**：所有数据库结构变化必须进入 `backend/migrations`，并可重复校验。
- **配置不入库**：`.env.local` 存本地真实配置，`.env.example` 只保留占位符。
- **核心路径可测**：登录、数据源、脚本、AI、审批必须有 smoke 或 E2E 验收路径。
- **失败可降级**：模型、网络、后端局部失败时 UI 不白屏，错误状态可恢复。
- **Mock 不撒谎**：页面或调试信息应能区分真实接口与模拟数据。

## 5. 优先级总览

| 优先级 | 主题 | 目标 |
| --- | --- | --- |
| P0 | 运行与发布基线 | 统一启动、配置、迁移、健康检查、文档和临时产物清理 |
| P1 | RBAC 与权限闭环 | 后端权限中间件、角色权限 API、前端路由/按钮可见性、403 UX |
| P2 | 核心 Mock 退出 | 数据源、脚本、AI、审批中心形成真实后端主链路 |
| P3 | AI 生产加固 | 配额限流、Prompt 模板、工具权限、审计观测、MiniMax E2E |
| P4 | 测试与 CI | API smoke、Playwright 核心路径、Go/前端构建、GitHub Actions |

## 6. Sprint 1：运行与发布基线

**目标**：任何后续执行者都能稳定启动项目，确认依赖状态，并安全地运行迁移和核心 smoke。

### 任务

1. 补齐本地启动文档。
   - **建议位置**：`docs/local-development.md`、`README.md`
   - **内容**：前端启动、后端启动、远程 PostgreSQL/Redis 配置、MiniMax 配置占位符、常见端口、故障排查。
2. 补齐配置样例。
   - **建议位置**：`.env.example`、`backend/.env.example`
   - **要求**：只写占位符，不写真实 token、密码、IP 之外的敏感内容。
3. 增强健康检查。
   - **建议位置**：`backend/internal/platform/server`、`backend/internal/platform/db`
   - **要求**：`/api/v1/health` 区分 API、PostgreSQL、Redis、migration 状态。
4. 增加 migration 校验入口。
   - **建议位置**：`backend/migrations`、`backend/cmd/datagov-api`
   - **要求**：支持本地重复执行、启动前校验和失败时明确报错。
5. 清理并忽略临时产物。
   - **建议位置**：`.gitignore`、`output/`、测试报告目录
   - **要求**：不提交 token、日志、截图、临时 smoke 输出。

### 验收

- `npm run dev -- --host 127.0.0.1 --port 5174` 可启动前端。
- 后端可本地启动并连接远程 PostgreSQL/Redis。
- `GET /api/v1/health` 返回结构化依赖状态。
- `npx.cmd vite build --emptyOutDir=false` 通过。
- 在 `backend` 目录执行 `go test ./...` 通过，或明确记录非本阶段阻塞原因。

## 7. Sprint 2：权限体系生产闭环

**目标**：账号密码登录不再只是入口能力，而是贯穿 API、菜单、路由、按钮和审计的基础权限体系。

### 任务

1. 梳理权限点清单。
   - **建议位置**：`docs/permissions-matrix.md`
   - **覆盖**：数据源、脚本开发、AI 助手、审批中心、系统管理。
2. 后端增加权限中间件。
   - **建议位置**：`backend/internal/modules/iam`、`backend/internal/platform/server`
   - **要求**：未登录返回 401，无权限返回 403，错误结构兼容前端。
3. 增加角色权限接口。
   - **建议接口**：`GET /api/v1/iam/permissions`、`GET/PUT /api/v1/iam/roles/{id}/permissions`
   - **要求**：默认管理员拥有全部权限，普通角色按权限点授权。
4. 前端接入权限可见性。
   - **建议位置**：`src/navigation/registry.tsx`、`src/components/layout/Sidebar.tsx`、相关页面按钮区
   - **要求**：路由、菜单、按钮根据权限控制显示，禁止仅依赖前端。
5. 增加 403 体验。
   - **建议位置**：`src/components/common/CapabilityPlaceholder.tsx` 或新增 `ForbiddenState`
   - **要求**：无权限页面不白屏、不跳 dashboard，提示缺失权限和申请路径。

### 验收

- 管理员可访问全部核心功能。
- 非管理员缺少权限时，后端返回 403，前端显示清晰无权限状态。
- 数据源创建、脚本保存/发布、AI 使用、审批处理均经过后端权限校验。
- 审计日志可记录关键权限失败事件。

## 8. Sprint 3：核心模块 Mock 退出

**目标**：核心模块形成“真实后端主链路 + MSW 明确兜底”的稳定架构，不再依赖隐式 mock。

### 任务

1. 建立 endpoint 状态矩阵。
   - **建议位置**：`docs/api-docs/endpoint-status.md`
   - **状态**：`Real`、`Passthrough`、`Mock-only`、`Deprecated`。
2. 数据源管理真实链路加固。
   - **建议位置**：`backend/internal/modules/metadata`、`src/services/api.ts`、`src/mock/handlers.ts`
   - **要求**：列表、新建、状态变更、连接测试、同步占位均默认走后端；密码不回传。
3. 脚本开发真实链路加固。
   - **建议位置**：`backend/internal/modules/development`、`src/pages/development/ScriptDev.tsx`
   - **要求**：目录、脚本、保存、版本、运行记录、发布申请均有真实 API 或明确占位。
4. AI 助手真实链路加固。
   - **建议位置**：`backend/internal/modules/ai`、`src/components/ai/*`
   - **要求**：会话、消息、偏好、反馈、Token 用量、上下文预览、工具审计默认走后端。
5. 审批中心接入真实后端。
   - **建议位置**：`backend/internal/modules/approvals`、`src/pages/approval/*`
   - **要求**：支持审批实例、步骤、评论、通过、驳回、撤回或占位状态流转。
6. MSW handler 明确分流。
   - **建议位置**：`src/mock/handlers.ts`
   - **要求**：真实 API 可用时 passthrough；mock-only endpoint 在状态矩阵中登记。

### 验收

- 关闭核心模块 mock 后，登录、数据源、脚本、AI、审批核心路径仍可运行。
- 未退出 mock 的页面有清晰登记，不影响主链路。
- 不存在未实现菜单项静默 fallback 到 dashboard 的行为。
- MSW 模拟业务数据仍遵守 `src/mock/data.ts` → `src/mock/handlers.ts` → `src/services/api.ts` 路径。

## 9. Sprint 4：AI 助手生产加固

**目标**：AI 助手从“可用”提升到“可控、可审计、可限额、可回放、可安全扩展”。

### 任务

1. Redis 配额与限流。
   - **建议位置**：`backend/internal/modules/ai`、`backend/internal/platform/cache`
   - **要求**：按用户、全局、模型调用维度控制频率和日配额。
2. Prompt 模板版本化。
   - **建议位置**：`backend/internal/modules/ai`、`backend/migrations`
   - **要求**：SQL 生成、SQL 分析、血缘分析、知识讲解、质量规则等模板可版本化。
3. 工具调用权限校验。
   - **建议位置**：`backend/internal/modules/ai/tools`
   - **要求**：AI 工具复用当前用户权限，只读优先，不绕过业务 service。
4. AI 可观测能力。
   - **建议位置**：`backend/internal/modules/ai`、可选前端管理页
   - **要求**：记录模型、延迟、错误码、Token、工具耗时、脱敏结果、降级原因。
5. MiniMax 真实 E2E。
   - **建议位置**：`docs/testing/ai-e2e.md`、Playwright 或 smoke 脚本
   - **要求**：通过后端环境变量读取 MiniMax 配置，不在仓库保存真实 token。

### 验收

- 超配额用户不会继续调用模型，并收到可理解错误。
- AI 请求、上下文、Token、工具调用、反馈均可追踪。
- AI 对数据源凭证、token、连接串等敏感信息不入 prompt、不入日志、不入截图。
- MiniMax `MiniMax-M3` 至少完成一次真实功能 E2E；如降级 MSW，必须记录原因和待补测场景。

## 10. Sprint 5：测试、CI 与交付门禁

**目标**：把“能跑”变成“每次提交前可验证”，降低后续自动开发和人工接手风险。

### 任务

1. API smoke 脚本。
   - **建议位置**：`scripts/smoke-api.ps1` 或 `backend/scripts`
   - **覆盖**：health、login、me、data sources、scripts、AI capabilities、approval list。
2. Playwright 核心路径。
   - **建议位置**：`tests/e2e` 或现有测试目录
   - **覆盖**：登录、数据源创建/测试、脚本创建/保存、AI 唤起/提问、审批处理。
3. 前端构建门禁。
   - **命令**：`npx.cmd vite build --emptyOutDir=false`
   - **要求**：Windows 下避免 `dist/index.html` 锁定导致误判。
4. 后端测试门禁。
   - **命令**：在 `backend` 目录执行 `go test ./...`
   - **要求**：权限、repository、handler、AI 限流至少有基础覆盖。
5. GitHub Actions。
   - **建议位置**：`.github/workflows/ci.yml`
   - **要求**：前端构建、Go test、基础 lint 或格式检查；密钥只通过 GitHub Secrets 注入。

### 验收

- 本地可以一键执行核心 smoke 并得到清晰通过/失败报告。
- CI 对前端构建和后端测试形成基础门禁。
- Playwright 至少覆盖一条完整业务路径，不要求一次性覆盖所有页面。
- 失败日志中不出现真实 MiniMax token、数据库密码、SSH 密码或完整连接串。

## 11. 建议数据模型补充

### 审批中心

| 表 | 用途 |
| --- | --- |
| `approval_requests` | 审批实例主表，关联脚本发布、数据源变更等业务对象 |
| `approval_steps` | 审批步骤、处理人、状态、处理时间 |
| `approval_comments` | 审批意见、驳回原因、补充说明 |
| `approval_audit_events` | 审批流转审计，可复用全局审计表 |

### 权限体系

| 表 | 用途 |
| --- | --- |
| `permissions` | 权限点定义 |
| `role_permissions` | 角色权限绑定 |
| `user_roles` | 用户角色绑定 |
| `access_events` | 访问审计和权限失败记录 |

### AI 加固

| 表 | 用途 |
| --- | --- |
| `ai_prompt_templates` | Prompt 模板版本 |
| `ai_quota_policies` | 用户或角色配额策略 |
| `ai_rate_limit_events` | 限流命中记录 |
| `ai_tool_permissions` | 工具与权限点映射，可先用配置替代 |

## 12. MSW 退出策略

### Endpoint 状态定义

| 状态 | 含义 |
| --- | --- |
| `Real` | 前端正式调用 Go 后端，MSW 不覆盖 |
| `Passthrough` | MSW 捕获后放行到真实后端 |
| `Mock-only` | 后端未实现，仍由 MSW 返回模拟结果 |
| `Deprecated` | 前端不应再调用，等待删除 |

### 规则

- 每新增或迁移一个 endpoint，必须同步更新状态矩阵。
- mock-only endpoint 必须能说明所属模块、退出条件和负责人。
- 前端页面不得直接硬编码业务 mock 行、任务、模板、用户、角色、脚本、数据源或审批记录。
- 核心模块如果后端异常，可以降级到 MSW，但 UI 或日志必须能说明当前是 fallback。

## 13. 验证清单

### 必跑命令

```powershell
npx.cmd vite build --emptyOutDir=false
```

```powershell
cd backend
go test ./...
```

### 建议 smoke

```powershell
curl http://127.0.0.1:8080/api/v1/health
```

```powershell
curl -X POST http://127.0.0.1:8080/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"admin\",\"password\":\"<LOCAL_ADMIN_PASSWORD>\"}"
```

### 浏览器检查

- 访问 `http://127.0.0.1:5174/`。
- 登录后检查 dashboard、数据源管理、脚本开发、AI 助手、审批中心。
- 检查控制台无白屏错误。
- 检查改动页面无横向溢出。
- AI 面板在普通浮窗、展开态、移动视口下均不遮挡关键操作。

## 14. 最终验收标准

- 本地开发环境文档完整，后续执行者无需重新询问基础启动方式。
- 登录权限、数据源管理、脚本开发、AI 助手、审批中心都有真实后端主链路。
- 后端对核心 API 执行认证与授权，前端根据权限控制菜单、路由和按钮可见性。
- MSW endpoint 状态矩阵完整，核心模块不再依赖隐式 mock。
- AI 助手具备配额、限流、Prompt 模板、工具权限、Token 记录、审计和 MiniMax E2E 验收路径。
- 前端构建、后端测试、API smoke、核心 Playwright 路径至少各有一个可执行入口。
- 所有新增文档、代码、测试和日志均不包含真实密钥。
- 完成后更新 `PROJECT_STATUS.md`，提交并推送到远程仓库。

## 15. 风险与规避

- **远程依赖不稳定**：健康检查要区分 PostgreSQL、Redis、MiniMax、API 自身，避免笼统失败。
- **权限只做前端隐藏**：后端必须强制校验；前端只是减少误点。
- **Mock 与真实接口漂移**：通过 endpoint 状态矩阵、服务函数和 smoke test 约束。
- **AI 成本不可控**：默认开启限流、Token 预算、上下文裁剪和错误降级。
- **敏感信息泄露**：任何 `sk-`、密码、连接串、SSH 凭证出现在日志或提交中都视为泄露，需立即清理并轮换。
- **审批流过度设计**：第一阶段只实现脚本发布等核心占位流，不追求复杂 BPMN。
- **一次性改造过大**：每个 Sprint 都要能独立提交、独立验证、独立回滚。

## 16. 建议执行顺序

1. 先完成 Sprint 1，确保所有后续开发都有稳定运行基线。
2. 再完成 Sprint 2，把权限作为真实后端的安全地基。
3. 接着完成 Sprint 3，让核心模块退出隐式 Mock。
4. 然后完成 Sprint 4，把 AI 助手补到生产级可控状态。
5. 最后完成 Sprint 5，用测试和 CI 固化交付门禁。

执行期间不要因为单个业务字段不确定而停工；能用合理默认值和 MSW 兜底的，先形成可运行闭环，再在后续迭代中替换为真实实现。
