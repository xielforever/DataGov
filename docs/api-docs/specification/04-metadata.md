# 元数据 (Metadata) 接口规范

**Base URL**: `/api/v1`

### 4.1 获取数据源列表
- **Endpoint**: `GET /api/v1/metadata/data-sources`
- **Phase 1**: 真实后端优先实现。
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "category": "string",
      "status": "enum ('online' | 'offline' | 'warning' | 'syncing' | 'error')",
      "host": "string",
      "port": "number",
      "database": "string",
      "version": "string",
      "owner": "string",
      "department": "string",
      "env": "string",
      "tableCount": "number",
      "storageGB": "number",
      "qps": "number",
      "latencyMs": "number",
      "lastSyncTime": "string",
      "createTime": "string",
      "description": "string",
      "tags": ["string"],
      "credentialConfigured": "boolean"
    }
  ]
  ```

> 安全要求：响应体不得回传 `password`、连接串明文、token 或密钥。

### 4.2 新建数据源
- **Endpoint**: `POST /api/v1/metadata/data-sources`
- **Request `body` Schema**:
  ```json
  {
    "name": "string",
    "type": "enum ('MySQL' | 'PostgreSQL' | 'Hive' | 'ClickHouse' | 'Kafka' | 'Redis' | 'Elasticsearch')",
    "host": "string",
    "port": "number",
    "database": "string",
    "username": "string",
    "password": "string",
    "env": "string",
    "description": "string(optional)",
    "tags": ["string(optional)"]
  }
  ```
- **Response `data` Schema**: 返回脱敏后的数据源对象，结构同 4.1 单项。

### 4.3 更新数据源
- **Endpoint**: `PUT /api/v1/metadata/data-sources/:id`
- **Request `body` Schema**:
  ```json
  {
    "name": "string(optional)",
    "host": "string(optional)",
    "port": "number(optional)",
    "database": "string(optional)",
    "username": "string(optional)",
    "password": "string(optional)",
    "env": "string(optional)",
    "description": "string(optional)",
    "tags": ["string(optional)"]
  }
  ```
- **Response `data` Schema**: 返回脱敏后的数据源对象，结构同 4.1 单项。

### 4.4 删除数据源
- **Endpoint**: `DELETE /api/v1/metadata/data-sources/:id`
- **Description**: 首期建议软删除或标记为 `offline`，避免误删关联元数据。
- **Response `data` Schema**:
  ```json
  {
    "success": true
  }
  ```

### 4.5 测试数据源连接
- **Endpoint**: `POST /api/v1/metadata/data-sources/:id/test`
- **Description**: 首期优先支持 PostgreSQL，建议使用远程样例库验证。
- **Response `data` Schema**:
  ```json
  {
    "status": "enum ('success' | 'failed')",
    "latencyMs": "number",
    "message": "string",
    "checkedAt": "string(datetime)",
    "sample": {
      "schemas": ["string"],
      "tableCount": "number"
    }
  }
  ```

### 4.6 同步数据源元数据
- **Endpoint**: `POST /api/v1/metadata/data-sources/:id/sync`
- **Description**: 首期可先创建同步记录或任务占位，后续接 Python Worker 执行采集。
- **Response `data` Schema**:
  ```json
  {
    "id": "string",
    "dataSourceId": "string",
    "status": "enum ('queued' | 'running' | 'succeeded' | 'failed')",
    "startedAt": "string(datetime)",
    "message": "string"
  }
  ```

### 4.7 更新数据源状态
- **Endpoint**: `POST /api/v1/metadata/data-sources/:id/status`
- **Request `body` Schema**:
  ```json
  {
    "status": "enum ('online' | 'offline' | 'warning' | 'syncing' | 'error')"
  }
  ```
- **Response `data` Schema**: 返回更新后的数据源对象，结构同 4.1 单项。

### 4.8 获取元数据查询数据
- **Endpoint**: `GET /api/v1/metadata/query`
- **Description**: 获取元数据检索引擎的数据，包括检索统计、收藏查询、热搜词以及查询结果列表。
- **Response `data` Schema**:
  ```json
  {
    "stats": [
      { "id": "string", "label": "string", "value": "string", "detail": "string", "color": "string", "icon": "string" }
    ],
    "savedQueries": [
      { "id": "string", "name": "string", "keyword": "string", "description": "string", "count": "number" }
    ],
    "hotKeywords": [
      { "id": "string", "keyword": "string", "heat": "number" }
    ],
    "results": [
      {
        "id": "string",
        "type": "enum ('table' | 'field' | 'source' | 'model' | 'metric')",
        "name": "string",
        "cnName": "string",
        "description": "string",
        "domain": "string",
        "layer": "string",
        "source": "string",
        "sourceType": "string",
        "owner": "string",
        "department": "string",
        "qualityScore": "number",
        "certified": "boolean",
        "updateTime": "string",
        "tags": ["string"],
        "heat": "number",
        "path": "string",
        "fields": ["string"],
        "standards": ["string"],
        "relations": ["string"]
      }
    ]
  }
  ```

### 4.9 获取元数据维护看板数据
- **Endpoint**: `GET /api/v1/metadata/maintain`
- **Description**: 获取元数据治理与维护看板的数据，包含维护指标、待维护资产列表、工单和版本快照。
- **Response `data` Schema**:
  ```json
  {
    "stats": [
      { "id": "string", "label": "string", "value": "number", "unit": "string", "change": "string", "color": "string", "icon": "string" }
    ],
    "assets": [
      {
        "id": "string",
        "name": "string",
        "cnName": "string",
        "layer": "string",
        "domain": "string",
        "owner": "string",
        "department": "string",
        "status": "enum ('pending' | 'in-progress' | 'review' | 'completed')",
        "completeness": "number",
        "updateTime": "string",
        "issueCount": "number",
        "database": "string",
        "description": "string",
        "tags": ["string"],
        "issues": ["string"],
        "fields": [
          { "name": "string", "type": "string", "nullable": "boolean", "comment": "string", "standard": "string", "status": "enum ('complete' | 'missing')" }
        ],
        "timeline": [
          { "time": "string", "action": "string", "operator": "string", "detail": "string" }
        ]
      }
    ],
    "workOrders": [
      {
        "id": "string",
        "title": "string",
        "assetName": "string",
        "assignee": "string",
        "priority": "enum ('P0' | 'P1' | 'P2' | 'P3')",
        "status": "enum ('todo' | 'processing' | 'review' | 'done')",
        "dueDate": "string",
        "source": "string",
        "progress": "number"
      }
    ],
    "snapshots": [
      {
        "id": "string",
        "assetName": "string",
        "version": "string",
        "changedFields": "number",
        "changedBy": "string",
        "createdAt": "string",
        "summary": "string",
        "type": "enum ('manual' | 'workflow' | 'review' | 'auto')"
      }
    ]
  }
  ```
