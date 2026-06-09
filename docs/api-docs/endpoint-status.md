# Endpoint Status Matrix

本文档跟踪前端 `/api/v1/*` 接口从 MSW 到真实后端的迁移状态。状态必须随接口迁移同步更新，避免 Mock 与真实后端分叉。

## 状态定义

| 状态 | 含义 |
| --- | --- |
| `Real` | 前端正式调用 Go 后端，MSW 不覆盖 |
| `Passthrough` | MSW 捕获后默认放行到 Go 后端，可通过环境变量降级 |
| `Mock-only` | 后端未实现，仍由 MSW 返回模拟结果 |
| `Deprecated` | 前端不应再调用，等待删除 |

## 核心模块

| Endpoint | 状态 | 开关 | 说明 |
| --- | --- | --- | --- |
| `GET /api/v1/health` | `Real` | 无 | Go 后端健康检查，包含 PostgreSQL、Redis、migrations |
| `POST /api/v1/auth/login` | `Real` | 无 | 账号密码登录 |
| `GET /api/v1/auth/me` | `Real` | 无 | 当前用户与权限 |
| `POST /api/v1/auth/logout` | `Real` | 无 | 注销当前 session |
| `GET /api/v1/metadata/data-sources` | `Passthrough` | `VITE_REAL_METADATA_DATA_SOURCES` | 数据源列表，默认真实后端 |
| `POST /api/v1/metadata/data-sources` | `Passthrough` | `VITE_REAL_METADATA_DATA_SOURCES` | 创建数据源，默认真实后端 |
| `POST /api/v1/metadata/data-sources/{id}/test` | `Passthrough` | `VITE_REAL_METADATA_DATA_SOURCES` | 连接测试，默认真实后端 |
| `POST /api/v1/metadata/data-sources/{id}/sync` | `Passthrough` | `VITE_REAL_METADATA_DATA_SOURCES` | 同步占位，默认真实后端 |
| `POST /api/v1/metadata/data-sources/{id}/status` | `Passthrough` | `VITE_REAL_METADATA_DATA_SOURCES` | 状态变更，默认真实后端 |
| `GET /api/v1/development/scripts` | `Passthrough` | `VITE_REAL_DEVELOPMENT_SCRIPTS` | 脚本树，默认真实后端 |
| `POST /api/v1/development/scripts` | `Passthrough` | `VITE_REAL_DEVELOPMENT_SCRIPTS` | 新建脚本，默认真实后端 |
| `PUT /api/v1/development/scripts/{id}` | `Passthrough` | `VITE_REAL_DEVELOPMENT_SCRIPTS` | 保存脚本，默认真实后端 |
| `POST /api/v1/development/scripts/{id}/run` | `Passthrough` | `VITE_REAL_DEVELOPMENT_SCRIPTS` | 运行记录占位，默认真实后端 |
| `POST /api/v1/development/scripts/{id}/publish` | `Passthrough` | `VITE_REAL_DEVELOPMENT_SCRIPTS` | 发布占位，默认真实后端 |
| `GET /api/v1/development/scripts/{id}/versions` | `Passthrough` | `VITE_REAL_DEVELOPMENT_SCRIPTS` | 版本列表，默认真实后端 |
| `/api/v1/ai/*` | `Passthrough` | `VITE_REAL_AI_ASSISTANT` | AI 助手主链路，包含能力、会话、消息、偏好、Token、工具和观测接口 |
| `GET /api/v1/approvals` | `Passthrough` | `VITE_REAL_APPROVALS` | 审批列表，默认真实后端 |
| `POST /api/v1/approvals/{id}/process` | `Passthrough` | `VITE_REAL_APPROVALS` | 审批处理，默认真实后端 |

## 仍为 Mock-only 的大类

- Dashboard 非关键统计
- 数据资产目录、地图、血缘展示
- 元数据采集、元数据模型、元数据查询
- 数据标准、质量、安全、服务、系统管理多数页面
- 数据同步、实时计算、任务编排、任务调度、任务运维

这些接口后续按业务优先级逐步迁移，迁移时必须同步补齐后端权限点、状态矩阵和 smoke/E2E 验收。
