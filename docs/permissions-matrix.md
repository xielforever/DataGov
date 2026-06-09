# DataGov 权限矩阵

本文档定义 Sprint 2 的首批 RBAC 权限点。后端是最终权限边界，前端菜单和按钮可见性只用于体验优化。默认管理员角色拥有 `platform:*`，可匹配所有权限。

## 1. 匹配规则

| 权限写法 | 含义 |
| --- | --- |
| `platform:*` | 平台全部权限，默认管理员拥有 |
| `metadata:data_sources:*` | 数据源管理全部权限 |
| `development:scripts:*` | 脚本开发全部权限 |
| 精确权限点 | 只允许对应操作 |

后端与前端均使用同一类匹配策略：精确匹配优先，`:*` 后缀匹配同一资源域下的操作。

## 2. 核心权限点

| 模块 | 权限点 | 用途 | 当前接入 |
| --- | --- | --- | --- |
| Auth | `auth:me` | 查看当前用户信息 | 后端登录态校验 |
| 数据源管理 | `metadata:data_sources:read` | 查看数据源列表 | 后端接口 + 前端菜单 |
| 数据源管理 | `metadata:data_sources:create` | 创建数据源 | 后端接口 |
| 数据源管理 | `metadata:data_sources:test` | 测试数据源连接 | 后端接口 |
| 数据源管理 | `metadata:data_sources:sync` | 触发同步占位 | 后端接口 |
| 数据源管理 | `metadata:data_sources:status` | 启停或标记状态 | 后端接口 |
| 脚本开发 | `development:scripts:read` | 查看脚本树、内容、版本 | 后端接口 + 前端菜单 |
| 脚本开发 | `development:scripts:write` | 新建、保存脚本 | 后端接口 |
| 脚本开发 | `development:scripts:run` | 创建运行记录 | 后端接口 |
| 脚本开发 | `development:scripts:publish` | 提交发布申请或占位 | 后端接口 |
| AI 助手 | `ai:assistant:use` | 使用全局 AI 助手 | 后端接口 + 前端入口 |
| AI 工具 | `ai:tools:read` | 查看 AI 工具状态 | 后端接口 |
| AI 观测 | `ai:observability:read` | 查看 Token、限流、模型调用与工具调用概览 | 后端接口 |
| 数据标准 | `standards:read` | 读取数据标准定义和映射摘要 | AI 只读工具复用 |
| 质量规则 | `quality:rules:read` | 读取质量规则和检查结果摘要 | AI 只读工具复用 |
| 数据血缘 | `metadata:lineage:read` | 读取血缘影响摘要 | AI 只读工具复用 |
| 审批中心 | `approvals:requests:read` | 查看审批列表 | 后端接口 + 前端菜单 |
| 审批中心 | `approvals:requests:process` | 处理审批 | 后端接口 |
| 系统管理 | `system:manage` | 用户、角色、组织、系统配置 | 前端菜单，后端待接入 |

## 3. 接入原则

- 所有新增真实后端接口必须先确定权限点。
- 后端无权限返回 `403`，未登录或会话过期返回 `401`。
- 后端记录 `permission.denied` 审计事件，包含用户、接口路径和缺失权限点。
- 前端隐藏无权限菜单，但用户直达 URL 时必须显示 403 状态，不得跳回 dashboard。
- 角色管理页面后续应读取同一权限矩阵或后端权限接口，避免前后端权限点分叉。

## 4. 待补充

- `GET /api/v1/iam/permissions`
- `GET /api/v1/iam/roles/{id}/permissions`
- `PUT /api/v1/iam/roles/{id}/permissions`
- 系统管理真实后端接口权限接入
