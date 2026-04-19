# 资产总览 (Asset Overview) 接口规范

**Base URL**: `/api/v1`

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
  ```# 数据地图 (Data Map) 接口规范

**Base URL**: `/api/v1`

### 3.10 获取数据地图全量数据
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