# 数据开发 (Development) 页面映射

### 6.1 数据同步
- **所在菜单**: `数据开发 -> 数据同步`
- **对应组件**: `src/pages/development/DataSync.tsx`
- **依赖接口**:
  - `GET /api/v1/development/sync-tasks`: 获取离线/实时数据同步任务配置。

### 6.2 脚本开发
- **所在菜单**: `数据开发 -> 脚本开发`
- **对应组件**: `src/pages/development/ScriptDev.tsx`
- **依赖接口**:
  - `GET /api/v1/development/scripts`: 获取 SQL/Python 等脚本文件树。
  - `POST /api/v1/development/scripts`: 新建并保存脚本。
  - `PUT /api/v1/development/scripts/:id`: 更新脚本内容。
  - `DELETE /api/v1/development/scripts/:id`: 删除脚本。
  - `POST /api/v1/development/execute`: 提交脚本执行并返回运行日志。

### 6.3 实时计算
- **所在菜单**: `数据开发 -> 实时计算`
- **对应组件**: `src/pages/development/RealtimeCompute.tsx`
- **依赖接口**:
  - `GET /api/v1/development/realtime-jobs`: 获取 Flink/Spark 实时流计算任务状态。

### 6.4 任务编排
- **所在菜单**: `数据开发 -> 任务编排`
- **对应组件**: `src/pages/development/TaskOrchestration.tsx`
- **依赖接口**:
  - `GET /api/v1/development/workflows`: 获取 DAG 工作流依赖配置和调度信息。