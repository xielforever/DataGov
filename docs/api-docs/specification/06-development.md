# 数据开发 (Development) 接口规范

**Base URL**: `/api/v1`

> 首期真实后端优先覆盖脚本开发。数据同步、实时计算、任务编排可以继续由 MSW 提供 Mock，待任务中心和 Worker 就绪后再接真实后端。

### 6.1 数据同步
- **Endpoint**: `GET /api/v1/development/sync-tasks`
- **Description**: 获取离线/实时数据同步任务配置。

### 6.2 获取脚本树
- **Endpoint**: `GET /api/v1/development/scripts`
- **Description**: 获取脚本与文件夹列表，前端按 `parentId` 组装左侧树。
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "type": "enum ('folder' | 'sql' | 'python' | 'shell' | 'stream' | 'nosql')",
      "scriptType": "enum ('mysql-sql' | 'postgresql-sql' | 'hive-sql' | 'clickhouse-sql' | 'kafka-consumer' | 'redis-command' | 'elasticsearch-dsl' | 'python-task' | 'shell-task')",
      "editorLanguage": "string",
      "dialect": "string",
      "parentId": "string|null",
      "dataSourceId": "string",
      "content": "string",
      "status": "enum ('draft' | 'published' | 'approving' | 'offline')",
      "version": "number",
      "updateTime": "string(datetime)"
    }
  ]
  ```

### 6.3 新建脚本或文件夹
- **Endpoint**: `POST /api/v1/development/scripts`
- **Request `body` Schema**:
  ```json
  {
    "name": "string",
    "type": "enum ('folder' | 'sql' | 'python' | 'shell' | 'stream' | 'nosql')",
    "scriptType": "string(optional)",
    "editorLanguage": "string(optional)",
    "dialect": "string(optional)",
    "parentId": "string|null",
    "dataSourceId": "string(optional)",
    "content": "string(optional)"
  }
  ```
- **Response `data` Schema**: 返回新建后的脚本对象，结构同 6.2 单项。

### 6.4 保存脚本
- **Endpoint**: `PUT /api/v1/development/scripts/:id`
- **Request `body` Schema**:
  ```json
  {
    "name": "string(optional)",
    "parentId": "string|null(optional)",
    "dataSourceId": "string(optional)",
    "content": "string(optional)",
    "scriptType": "string(optional)",
    "editorLanguage": "string(optional)",
    "dialect": "string(optional)",
    "comment": "string(optional)"
  }
  ```
- **Response `data` Schema**: 返回更新后的脚本对象，保存内容时应生成或更新版本记录。

### 6.5 运行脚本
- **Endpoint**: `POST /api/v1/development/scripts/:id/run`
- **Description**: 首期不直接执行危险脚本；SQL 可先做连接校验、语法检查或生成 run record。
- **Response `data` Schema**:
  ```json
  {
    "runId": "string",
    "status": "enum ('queued' | 'running' | 'succeeded' | 'failed')",
    "logs": ["string"],
    "data": [
      {
        "id": "number|string",
        "name": "string",
        "rows": "number",
        "status": "string"
      }
    ]
  }
  ```

### 6.6 发布脚本
- **Endpoint**: `POST /api/v1/development/scripts/:id/publish`
- **Description**: 提交发布审批，首期可生成审批占位记录。
- **Response `data` Schema**:
  ```json
  {
    "success": true,
    "approvalId": "string",
    "message": "string"
  }
  ```

### 6.7 获取脚本版本
- **Endpoint**: `GET /api/v1/development/scripts/:id/versions`
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "scriptId": "string",
      "version": "number",
      "content": "string",
      "createTime": "string(datetime)",
      "creator": "string",
      "comment": "string"
    }
  ]
  ```

### 6.8 删除脚本或文件夹
- **Endpoint**: `DELETE /api/v1/development/scripts/:id`
- **Description**: 首期建议软删除；删除文件夹前需校验子节点或级联标记。
- **Response `data` Schema**:
  ```json
  {
    "success": true
  }
  ```

### 6.9 实时计算
- **Endpoint**: `GET /api/v1/development/realtime-jobs`
- **Description**: 获取 Flink/Spark 实时流计算任务状态。

### 6.10 任务编排
- **Endpoint**: `GET /api/v1/development/workflows`
- **Description**: 获取 DAG 工作流依赖配置和调度信息。
