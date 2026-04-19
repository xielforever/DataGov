# 元数据 (Metadata) 接口规范

**Base URL**: `/api/v1`

### 4.1 获取数据源列表
- **Endpoint**: `GET /api/v1/metadata/data-sources`
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
      "tags": ["string"]
    }
  ]
  ```

### 4.2 获取元数据查询数据
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

### 4.3 获取元数据维护看板数据
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