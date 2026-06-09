# DataGov Project Status

Last updated: 2026-06-09

## Purpose

跟踪项目方向、已完成工作、待办事项和已知问题。供人类和 Codex 在新会话中快速恢复上下文。

## Current Product Direction

DataGov 是一个商业化数据治理与数据开发平台的纯前端原型，风格为深色、密集、结构化的企业工作台。不因实现不完整而移除架构级菜单项，未实现的能力使用 CapabilityPlaceholder 作为兜底。

## Architecture Decisions

- `AGENTS.md` 管理稳定的 Codex 项目指导；`PROJECT_STATUS.md` 跟踪变化的进度和决策。
- 保持完整商业数据治理菜单骨架。
- 移除 `task-develop`（与脚本开发、数据同步、实时计算、任务编排重叠）。
- 移除 `resource-manage`（无明确执行资源模块）。
- UI 文本使用正常中文，禁止乱码。
- 数据开发页面以 `DataModeling.tsx` 为左右一体布局参考。
- 菜单/路由集中注册在 `src/navigation/registry.tsx`。
- 业务领域作为共享主数据，筛选选项消费业务域 Mock API 而非硬编码。
- 跨页面导航统一使用 `navigateTo` 工具函数（`src/utils/navigation.ts`）。
- Mock 数据放在 `src/mock/data.ts`，通过 MSW handlers 暴露，页面通过 `src/services/api.ts` 调用。

## Core Files

| 类别 | 文件 |
|------|------|
| App Shell | `src/App.tsx` |
| 侧边栏 | `src/components/layout/Sidebar.tsx` |
| 路由注册 | `src/navigation/registry.tsx` |
| 能力占位 | `src/components/common/CapabilityPlaceholder.tsx` |
| 导航工具 | `src/utils/navigation.ts` |
| 类名合并 | `src/utils/cn.ts` |
| 项目指导 | `AGENTS.md` |
| 进度跟踪 | `PROJECT_STATUS.md` |

## Shared Infrastructure

### Hooks (4)

| Hook | 文件 | 用途 |
|------|------|------|
| `useDebounce` | `src/hooks/useDebounce.ts` | 搜索输入防抖（默认 300ms） |
| `useKeyboardShortcut` | `src/hooks/useKeyboardShortcut.ts` | 全局键盘快捷键（Ctrl+N/Escape/F） |
| `useTableSelection` | `src/hooks/useTableSelection.ts` | 表格行多选（全选/半选/切换/清除） |
| `useTableSort` | `src/hooks/useTableSort.ts` | 表格列排序（三态切换：升序/降序/无） |

### Common Components (6)

| 组件 | 文件 | 用途 |
|------|------|------|
| `Breadcrumb` | `src/components/common/Breadcrumb.tsx` | 面包屑导航 |
| `CapabilityPlaceholder` | `src/components/common/CapabilityPlaceholder.tsx` | 未实现功能占位 |
| `ErrorFallback` | `src/components/common/ErrorFallback.tsx` | API 错误兜底 + 重试 |
| `InlineEdit` | `src/components/common/InlineEdit.tsx` | 表格单元格行内编辑 |
| `Pagination` | `src/components/common/Pagination.tsx` | 分页（页码/每页条数/范围显示） |
| `Skeleton` | `src/components/common/Skeleton.tsx` | 加载占位（Table/Card/Stats） |

### Types (1)

| 文件 | 用途 |
|------|------|
| `src/types/api.ts` | 30 个 API 请求接口定义，零 `any` 参数 |

## Completed Phases

### Pre-D Phases

- **清理** — 移除 15+ 临时脚本和开发产物
- **P0/P1/P2** — 12 个页面表格布局优化（overflow + table-fixed + min-w + th 宽度）
- **A** — MetadataCollect + OperationsMonitor Mock 数据迁移
- **B** — MetadataModel Mock 数据迁移
- **C** — 全局交互增强：Toast 统一（react-hot-toast）、ErrorFallback、Skeleton 组件创建

### D Phases (2026-05-30)

| 阶段 | 内容 | 覆盖 | 构建 |
|------|------|------|------|
| D1 | Skeleton + ErrorFallback 全量集成 | 43 页 | 53s |
| D2 | 筛选选项 API 化（domains/layers/sensitivities/sources） | 5 页 + 8 API | 43s |
| D3 | 导航工具函数统一（navigateTo） | 6 页 | 41s |
| D4 | 分页组件集成 | 28 页 | 42s |
| D5 | 批量选择 Hook + 表格多选 | 6 页 | 42s |
| D6 | 表格排序 Hook + 列排序 | 6 页 | 42s |
| D7 | 搜索防抖 Hook | 28 页 | 42s |
| D8 | API 层类型安全（30 个接口替换 data: any） | 1 文件 | 41s |
| D9 | 页面层类型安全（替换 any[] 和 res: any） | 6 页 | 43s |
| D10 | 键盘快捷键 Hook + 3 页集成 | 3 页 | 43s |
| D11 | 键盘快捷键全量覆盖 | 28 页 | 43s |
| D12 | 行内编辑组件 + 3 页集成 | 3 页 | 55s |

## Project Scale

- 76 个源文件，42,468 行代码
- 14 个共享文件（hooks/components/utils/types）
- 最新构建通过：2695 modules，~55s

## Route Coverage

所有侧边栏叶子菜单项均注册在 `src/navigation/registry.tsx`，无遗漏。`CapabilityPlaceholder` 仅作为未知 route id 的兜底。

## Known Gaps

- 5 个页面保留 `as any` 类型断言（枚举字符串选择场景），Mock 前端可接受。
- `as any` 所在页面：DataModeling、MetadataModel、CodeManage、StandardDef、StandardMap。

## 2026-06-09

- 新增生产化加固与核心模块 Mock 退出 Goal 文档：明确运行发布基线、权限体系、核心真实后端闭环、AI 生产加固、测试与 CI 的下一阶段目标，详见 `docs/production-hardening-mock-exit-goal.md`。
- 启动生产化加固 Goal 编码并完成 Sprint 1 运行基线：新增本地开发文档、后端 `.env.example`、migration 状态健康检查、`--migrate-only`/`--check-migrations` 启动参数和 `scripts/smoke-api.ps1` 核心 API smoke；已验证 Go 测试、migration 校验、前端构建和后端 smoke。
- 完成 Sprint 2 权限闭环地基：新增权限矩阵文档、后端通配权限匹配与 403 审计，数据源/脚本/AI 核心接口接入权限点；前端基于当前用户权限过滤菜单、限制 AI 入口，并为直达无权限路由展示 403 状态。
- 完成 Sprint 3 核心 Mock 退出推进：新增 endpoint 状态矩阵，审批中心接入真实 Go 后端、`approval_requests` migration、审批列表/处理接口和 MSW passthrough；核心 smoke 已覆盖审批列表。
- 完成 Sprint 4 AI 生产加固：新增 AI Prompt 模板版本表、配额策略、限流事件、Redis 用户/全局/模型分钟级限流、日 Token 配额、工具权限过滤、AI 观测接口和 MiniMax E2E 脚本；真实 MiniMax E2E 已通过且不打印模型正文。
- 完成 Sprint 5 交付门禁基础：新增 Playwright 核心路径 `npm run e2e:core`、GitHub Actions CI（前端构建 + Go test）、扩展 API smoke 覆盖 AI Token/工具/观测与审批；本地已通过 Go test、Vite build、API smoke、MiniMax E2E 和 Playwright 核心路径。
- 启动下一阶段真实后端扩展：新增 `docs/next-stage-real-backend-expansion-plan.md`，明确数据代理层本阶段非必做，仅保留 Connector Gateway 契约和 TODO；优先推进 IAM 管理运营闭环。
- 完成 IAM 管理闭环首批编码：新增 `000006_iam_system_management` 迁移、权限/角色权限 API、用户/角色/组织管理真实后端接口，系统管理三页默认 passthrough 到 Go 后端；扩展 smoke 和 Playwright 核心路径覆盖用户、角色、组织页。
- 补齐角色权限运营体验：角色管理页接入真实 `GET/PUT /api/v1/iam/roles/{id}/permissions`，按模块展示可编辑权限矩阵；后端保护内置管理员角色，避免停用或移除 `platform:*` 导致锁定。
- 完成资产与元数据真实后端首批编码：新增 `000007_asset_foundation` 迁移、`assets` Go 模块、业务域/资产总览/资产目录/注册选项/数据地图/血缘摘要接口，前端 `/api/v1/assets*` 与 `/api/v1/business-domains*` 默认 passthrough 到 Go 后端。
- 收口资产目录运营体验：`/api/v1/assets/catalog` 支持后端关键词、业务域、分层、敏感级别、来源、标签、认证状态、排序与分页；数据目录页改为后端分页渲染，资产详情抽屉真实读取字段、血缘和质量快照。
- 明确 Connector Gateway 边界：新增 `docs/connector-gateway-contract.md`，DataGov 只保存注册、采集任务、资产/字段/血缘快照和审计结果，外部源连接测试、采集和解析由独立数据代理项目承载。
- 扩展验收门禁：API smoke 覆盖业务域、资产目录、资产详情和血缘摘要；Playwright 核心路径覆盖资产总览、数据目录和数据血缘；本轮已通过 Go test、Vite build、migration check、API smoke 和 Playwright core。
- 新增生产级 AI Copilot Goal 文档：明确会话管理、Token 优化、用户偏好/行为学习、页面上下文、只读工具、安全审计、配额限流与 MSW fallback 的分阶段开发目标，详见 `docs/ai-assistant-production-goal.md`。
- 补充 AI Copilot 最终验收策略：优先使用真实 MiniMax Anthropic-compatible `MiniMax-M3` 完成功能 E2E，真实 token 仅允许作为本地 secret 使用；供应商、网络或额度异常时记录原因并降级 MSW 兜底测试。
- 完成 AI Copilot 生产级主链路编码：新增会话历史、搜索、收藏/归档、上下文预览、Token 用量、用户偏好、反馈、行为事件、只读工具审计和 MSW fallback；后端扩展 AI 持久化表与 `/api/v1/ai/conversations/*` 等接口。

## 2026-06-08

- 修复脚本开发页：清理页面与脚本 Mock 数据乱码，默认打开首个脚本，补充控制台日志/结果集切换，并修复 Tab 关闭可访问性。
- 修复全局路由阻断：移除 MetadataQuery、QualityRules、StandardDef、StandardMap 中的组件外 Hook 调用，避免脚本开发页被无关页面白屏错误阻断。
- 验证：`npx.cmd vite build --emptyOutDir=false` 通过；桌面与移动视口访问 `http://127.0.0.1:5174/?view=script-dev` 无控制台错误，脚本页无中文乱码。
- 接入全局 AI 助手 UI：登录后任意页面右下角可唤起 AI Copilot，支持写 SQL、分析 SQL、分析血缘、知识讲解、质量规则和任务诊断；前端通过 `/api/v1/ai/*` 统一访问后端 AI Gateway。
- 修复 AI 助手 UI P1/P2：普通浮窗不再被隐藏栅格挤窄，SQL 回复以代码块展示，展开态避开左侧导航，移动端默认面板高度收敛。
- 制定后端接入规划：确定 Go 平台控制面 + Python 数据/AI 执行面路线，采用模块化单体起步、异步 Worker 演进、按边界拆服务；详见 `docs/backend-architecture-plan.md`。
- 完成后端前置准备：远程 PostgreSQL 初始化 `datagov`、`datagov_sample`、专用账号和样例数据；Redis DB 6 可用；MiniMax Anthropic 接口验证通过；本地 `.env.local` 已生成且被 Git 忽略。
- 优化后端文档：将首期目标锁定为账号密码登录、数据源管理、脚本开发、AI 助手四个真实后端闭环，并补齐 Auth、Metadata、Development、AI 的 API mapping/spec。
- 启动后端编码：新增 `backend/` Go API 骨架、配置加载、PostgreSQL/Redis 健康检查、SQL migration 基础表；`go test ./backend/...` 通过，`GET /api/v1/health` 已验证远程 PG/Redis 均为 `ok`。
- 完成 Auth 后端最小闭环：实现 `/api/v1/auth/login`、`/api/v1/auth/me`、`/api/v1/auth/logout`、session token、登录审计和默认管理员初始化；端到端验证登录成功、当前用户读取成功、登出后 token 返回 401。
- 完成前端 Auth 联调基础：登录页改为调用真实 `/api/v1/auth/login`，前端保存 token/user 并用 `/auth/me` 校验登录态，Vite 只代理 `/api/v1/auth` 和 `/api/v1/health` 到 Go API，其他模块继续由 MSW Mock；临时端口浏览器验证真实登录成功。
- 完成数据源管理后端基础：实现 `/api/v1/metadata/data-sources` 列表/创建、连接测试、同步占位、状态变更，启动时种入 `datagov_sample_postgresql` 样例数据源；MSW 对数据源接口默认 passthrough 到 Go API，临时端口浏览器验证数据源页读取真实后端成功。
- 完成脚本开发后端基础：实现 `/api/v1/development/scripts` 列表/创建/保存/运行/发布/版本接口，启动时种入样例目录和 `sample_order_detail_query`；API 验证脚本创建、保存生成版本、运行记录和发布占位均成功。
- 完成 AI 助手真实后端接入：新增 Go AI Gateway、能力卡片种子、MiniMax Anthropic-compatible 模型调用、会话/消息审计记录；MSW 对 `/api/v1/ai/*` 默认 passthrough，浏览器验证 AI 浮层返回 `MiniMax-M3` 回复且无控制台错误。
- 完成全功能页白屏审查与修复：47 个 route view 全量 Playwright 审计通过，修复分页切片变量、标准定义排序 hook、元数据模型初始空状态和 MSW 过滤项漏导入；`output/page-audit-report.json` 记录结果为 47/47 通过、0 个问题页。
- 架构决策：除平台后台库外，其他源数据连接长期通过独立 Connector Gateway / CDM 类数据代理项目承载；当前 DataGov 不内置实现数据代理，只保留数据源注册、编排、审计和后续接口集成 TODO。
