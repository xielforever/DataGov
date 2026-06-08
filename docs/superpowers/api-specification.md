# DataGov API Specification Draft (v1)

> 历史归档：本文档是早期单文件草案，可能包含过期接口。当前后端联调请以 `docs/api-docs/specification/README.md` 为准。

本文档基于前端 v2.0 Mock 数据重构产出，作为与后端开发对接的契约草案。
所有的接口都应该遵循以下的全局规范。

## 1. 全局规范

**Base URL**: `/api/v1`

**通用返回结构 (JSON)**:
```json
{
  "code": 0,           // 0 表示成功，非 0 表示业务错误
  "message": "success",// 错误信息或成功提示
  "data": {}           // 具体的业务数据负载
}
```

---

## 2. 仪表盘 (Dashboard) 接口

### 2.1 获取仪表盘核心统计指标
- **Endpoint**: `GET /api/v1/dashboard/stats`
- **Description**: 获取数据表总数、元数据条目、数据质量得分、待处理任务等核心指标。
- **Response `data` Schema**:
  ```json
  [
    {
      "label": "string (如：数据表总数)",
      "value": "string (如：12,847)",
      "change": "string (如：+12%)",
      "trend": "enum ('up' | 'down')",
      "icon": "string",
      "detail": "string",
      "color": "string (前端 Tailwind 渐变类名，后端可不传，由前端映射)"
    }
  ]
  ```

### 2.2 获取最近更新的表
- **Endpoint**: `GET /api/v1/dashboard/recent-tables`
- **Response `data` Schema**:
  ```json
  [
    {
      "name": "string (如：dwd_user_behavior_log)",
      "db": "string (如：ods_db)",
      "layer": "string (如：dwd)",
      "owner": "string (如：张三)",
      "updated": "string (如：2 分钟)",
      "quality": "number (如：98)"
    }
  ]
  ```

### 2.3 获取质量趋势数据
- **Endpoint**: `GET /api/v1/dashboard/quality-trends`
- **Response `data` Schema**:
  ```json
  [
    {
      "month": "string (如：7 )",
      "score": "number (如：86.2)",
      "tables": "number",
      "alerts": "number"
    }
  ]
  ```

### 2.4 获取待处理任务
- **Endpoint**: `GET /api/v1/dashboard/tasks`
- **Response `data` Schema**:
  ```json
  [
    {
      "name": "string (如：每日数据质量巡检)",
      "status": "enum ('running' | 'success' | 'warning' | 'pending')",
      "progress": "number (0-100)",
      "nextRun": "string",
      "duration": "string"
    }
  ]
  ```

---

## 3. 资产总览 (Asset Overview) 接口

### 3.1 获取资产核心指标
- **Endpoint**: `GET /api/v1/assets/core-metrics`
- **Response `data` Schema**:
  ```json
  [
    {
      "label": "string (如：数据资产总数)",
      "value": "string",
      "unit": "string (如：TB 或 空字符串)",
      "change": "string",
      "changeRate": "string",
      "trend": "enum ('up' | 'down')",
      "iconType": "enum ('database' | 'server' | 'link' | 'shield')",
      "gradient": "string (可选)",
      "bgGradient": "string (可选)"
    }
  ]
  ```

### 3.2 获取资产分层分布
- **Endpoint**: `GET /api/v1/assets/layer-distribution`
- **Response `data` Schema**:
  ```json
  [
    {
      "name": "string (如：ODS)",
      "label": "string (如：原始数据源)",
      "count": "number",
      "percent": "number"
    }
  ]
  ```

### 3.3 获取业务域分布
- **Endpoint**: `GET /api/v1/assets/business-domains`
- **Response `data` Schema**:
  ```json
  [
    {
      "name": "string (如：交易域)",
      "count": "number",
      "percent": "number",
      "growth": "string (如：+7.6%)"
    }
  ]
  ```

### 3.4 获取数据源类型分布
- **Endpoint**: `GET /api/v1/assets/data-sources`
- **Response `data` Schema**:
  ```json
  [
    {
      "name": "string (如：MySQL)",
      "type": "string (如：关系型数据库)",
      "count": "number",
      "tables": "number",
      "status": "enum ('healthy' | 'warning' | 'error')",
      "icon": "string (emoji)"
    }
  ]
  ```

### 3.5 获取资产增长趋势
- **Endpoint**: `GET /api/v1/assets/growth-trend`
- **Response `data` Schema**:
  ```json
  [
    {
      "month": "string (如：1)",
      "value": "number"
    }
  ]
  ```

### 3.6 获取资产健康度
- **Endpoint**: `GET /api/v1/assets/health-metrics`
- **Response `data` Schema**:
  ```json
  [
    {
      "label": "string (如：元数据完整度)",
      "value": "number (如：96.8)"
    }
  ]
  ```

### 3.7 获取热门资产 Top 10
- **Endpoint**: `GET /api/v1/assets/hot-assets`
- **Response `data` Schema**:
  ```json
  [
    {
      "rank": "number",
      "name": "string",
      "layer": "string",
      "domain": "string",
      "visits": "number",
      "owner": "string"
    }
  ]
  ```

### 3.8 获取待处理事项
- **Endpoint**: `GET /api/v1/assets/pending-items`
- **Response `data` Schema**:
  ```json
  [
    {
      "type": "string (如：待审)",
      "count": "number",
      "icon": "string (emoji)"
    }
  ]
  ```

### 3.9 获取数据血缘关系
- **Endpoint**: `GET /api/v1/assets/lineage`
- **Query Parameters**:
  - `center` (可选): 指定要作为中心节点的表名，如 `dwd_order_detail`。
- **Description**: 获取以 `center` 为中心的上下游血缘节点与连线数据。
- **Response `data` Schema**:
  ```json
  {
    "center": "string (中心节点ID)",
    "nodes": [
      {
        "id": "string",
        "name": "string",
        "cnName": "string",
        "layer": "enum ('ODS' | 'DWD' | 'DWS' | 'ADS' | 'DIM')",
        "domain": "string",
        "owner": "string",
        "rows": "string",
        "qualityScore": "number",
        "updateTime": "string",
        "level": "number (0=当前, 负数=上游, 正数=下游)"
      }
    ],
    "edges": [
      {
        "from": "string",
        "to": "string",
        "type": "enum ('direct' | 'transform' | 'aggregate')",
        "fields": "number"
      }
    ],
    "fields": [
      {
        "from": "string",
        "to": "string",
        "transform": "string"
      }
    ]
  }
  ```

---

## 4. 数据地图 (Data Map) 接口

### 4.1 获取数据地图全量数据
- **Endpoint**: `GET /api/v1/assets/map`
- **Response `data` Schema**:
  ```json
  {
    "domains": [
      { "id": "string", "name": "string", "color": "string", "assetCount": "number", "hotCount": "number" }
    ],
    "layers": [
      { "id": "string", "name": "string", "color": "string", "count": "number" }
    ],
    "assets": [
      { "id": "string", "name": "string", "cnName": "string", "domain": "string", "layer": "string", "rowCount": "number", "qualityScore": "number", "hot": "boolean" }
    ],
    "datacenters": [
      { "id": "string", "name": "string", "label": "string", "assets": "number", "status": "enum ('healthy' | 'warning' | 'error')" }
    ]
  }
  ```

---

## 5. 元数据 (Metadata) 接口

### 5.1 获取数据源列表
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

### 5.2 获取元数据查询数据
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

### 5.3 获取元数据维护看板数据
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

---

## 6. 数据标准 (Standard) 接口

### 6.1 标准定义
- **Endpoint**: `GET /api/v1/standard/definitions`
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "type": "enum ('base' | 'indicator' | 'dict')",
      "status": "enum ('draft' | 'reviewing' | 'published' | 'offline')",
      "creator": "string",
      "updateTime": "string",
      "description": "string",
      "rules": ["string"],
      "relatedTables": "number",
      "complianceRate": "number"
    }
  ]
  ```

### 6.2 标准映射
- **Endpoint**: `GET /api/v1/standard/mappings`
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "standardId": "string",
      "standardName": "string",
      "standardCode": "string",
      "tableId": "string",
      "tableName": "string",
      "fieldName": "string",
      "matchScore": "number (0-100)",
      "status": "enum ('pending' | 'confirmed' | 'ignored')",
      "suggestedType": "string",
      "updateTime": "string"
    }
  ]
  ```

### 6.3 标准评估
- **Endpoint**: `GET /api/v1/standard/evaluations`
- **Response `data` Schema**:
  ```json
  {
    "stats": {
      "overallScore": "number",
      "totalTables": "number",
      "coveredTables": "number",
      "issueCount": "number"
    },
    "trends": [
      {
        "date": "string",
        "score": "number",
        "issues": "number"
      }
    ],
    "issues": [
      {
        "id": "string",
        "tableName": "string",
        "fieldName": "string",
        "standardName": "string",
        "issueType": "string",
        "description": "string",
        "detectTime": "string"
      }
    ]
  }
  ```

### 6.4 数据字典
- **Endpoint**: `GET /api/v1/standard/dictionaries/categories`
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string",
      "itemCount": "number",
      "updateTime": "string"
    }
  ]
  ```

- **Endpoint**: `GET /api/v1/standard/dictionaries/:code/items`
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "dictCode": "string",
      "itemValue": "string",
      "itemLabel": "string",
      "sortOrder": "number",
      "status": "enum ('active' | 'inactive')",
      "remark": "string"
    }
  ]
  ```

### 6.5 码值管理
- **Endpoint**: `GET /api/v1/standard/codes`
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "source": "string",
      "type": "enum ('national' | 'industry' | 'enterprise')",
      "status": "enum ('draft' | 'reviewing' | 'published')",
      "itemCount": "number",
      "updateTime": "string",
      "creator": "string",
      "isBuiltIn": "boolean"
    }
  ]
  ```

- **Endpoint**: `GET /api/v1/standard/codes/:code/values`
- **Response `data` Schema**:
  ```json
  [
    {
      "id": "string",
      "value": "string",
      "label": "string",
      "remark": "string"
    }
  ]
  ```

---

## 7. 后续扩展

本草案目前包含了 `Dashboard`、`Asset`（含血缘与地图）、`Metadata`（含数据源、查询与维护）和 `Standard`（数据标准系列）的接口规范。后续数据质量、数据服务等模块将在重构过程中逐步添加到本规范中。

> **注**: 完整的“页面与接口映射关系表”已剥离为独立文档，请查阅 `docs/superpowers/api-page-mapping.md`。
