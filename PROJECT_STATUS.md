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
