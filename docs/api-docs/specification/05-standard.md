# 数据标准 (Standard) 接口规范

**Base URL**: `/api/v1`

### 5.1 标准定义
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
- **Endpoint**: `POST /api/v1/standard/definitions`
- **Description**: 新建标准定义。
- **Endpoint**: `PUT /api/v1/standard/definitions/:id`
- **Description**: 更新标准定义信息。
- **Endpoint**: `POST /api/v1/standard/definitions/:id/offline`
- **Description**: 下线某个标准定义。
- **Endpoint**: `POST /api/v1/standard/definitions/import`
- **Description**: 批量导入标准定义。

### 5.2 标准映射
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
- **Endpoint**: `POST /api/v1/standard/mappings`
- **Description**: 创建手动映射。
- **Endpoint**: `POST /api/v1/standard/mappings/:id/status`
- **Description**: 更新映射状态（如确认或忽略）。
- **Endpoint**: `POST /api/v1/standard/mappings/rescan`
- **Description**: 触发重新扫描智能映射。

### 5.3 标准评估
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
- **Endpoint**: `POST /api/v1/standard/evaluations/run`
- **Description**: 触发开始一轮新的评估。
- **Endpoint**: `POST /api/v1/standard/evaluations/export`
- **Description**: 导出评估报告文件。

### 5.4 数据字典
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
- **Endpoint**: `POST /api/v1/standard/dictionaries/categories`
- **Description**: 新增字典分类。

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
- **Endpoint**: `POST /api/v1/standard/dictionaries/:code/items`
- **Description**: 新增字典项。
- **Endpoint**: `PUT /api/v1/standard/dictionaries/:code/items/:itemId`
- **Description**: 更新字典项。
- **Endpoint**: `DELETE /api/v1/standard/dictionaries/:code/items/:itemId`
- **Description**: 删除字典项。

### 5.5 码值管理
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
- **Endpoint**: `POST /api/v1/standard/codes`
- **Description**: 新建码表。
- **Endpoint**: `PUT /api/v1/standard/codes/:id`
- **Description**: 更新码表信息。
- **Endpoint**: `DELETE /api/v1/standard/codes/:id`
- **Description**: 删除码表。
- **Endpoint**: `POST /api/v1/standard/codes/:id/clone`
- **Description**: 克隆码表。
- **Endpoint**: `POST /api/v1/standard/codes/import`
- **Description**: 导入码表文件。

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
- **Endpoint**: `POST /api/v1/standard/codes/:code/values`
- **Description**: 在当前码表下新增码值。
- **Endpoint**: `PUT /api/v1/standard/codes/:code/values/:id`
- **Description**: 更新码值。
- **Endpoint**: `DELETE /api/v1/standard/codes/:code/values/:id`
- **Description**: 删除码值。