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
  - `GET /api/v1/development/scripts`: 获取脚本/文件夹树，包含 `parentId`、`scriptType`、`editorLanguage`、`dialect`、`dataSourceId`。
  - `POST /api/v1/development/scripts`: 在指定 `parentId` 下新建文件夹或脚本。
  - `PUT /api/v1/development/scripts/:id`: 保存脚本内容、目录归属、数据源绑定和脚本元信息。
  - `POST /api/v1/development/scripts/:id/run`: 提交脚本运行，首期生成运行记录并返回日志/结果占位。
  - `POST /api/v1/development/scripts/:id/publish`: 提交脚本发布审批，首期生成审批占位记录。
  - `GET /api/v1/development/scripts/:id/versions`: 获取脚本历史版本。
  - `GET /api/v1/metadata/data-sources`: 获取可绑定数据源，按脚本能力过滤。
  - `DELETE /api/v1/development/scripts/:id`: 删除脚本或文件夹，首期建议软删除。

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
