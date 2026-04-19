# 数据开发 (Development) 接口规范

**Base URL**: `/api/v1`

> **说明**: 本模块接口规范定义仍在设计和重构中，后续将逐步补充完整。

### 6.1 数据同步
- **Endpoint**: `GET /api/v1/development/sync-tasks`
- **Description**: 获取离线/实时数据同步任务配置。

### 6.2 脚本开发
- **Endpoint**: `GET /api/v1/development/scripts`
- **Description**: 获取 SQL/Python 等脚本文件树。

### 6.3 实时计算
- **Endpoint**: `GET /api/v1/development/realtime-jobs`
- **Description**: 获取 Flink/Spark 实时流计算任务状态。

### 6.4 任务编排
- **Endpoint**: `GET /api/v1/development/workflows`
- **Description**: 获取 DAG 工作流依赖配置和调度信息。