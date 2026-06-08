# DataGov Project Status

Last updated: 2026-05-30

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

## 2026-06-08

- 修复脚本开发页：清理页面与脚本 Mock 数据乱码，默认打开首个脚本，补充控制台日志/结果集切换，并修复 Tab 关闭可访问性。
- 修复全局路由阻断：移除 MetadataQuery、QualityRules、StandardDef、StandardMap 中的组件外 Hook 调用，避免脚本开发页被无关页面白屏错误阻断。
- 验证：`npx.cmd vite build --emptyOutDir=false` 通过；桌面与移动视口访问 `http://127.0.0.1:5174/?view=script-dev` 无控制台错误，脚本页无中文乱码。
