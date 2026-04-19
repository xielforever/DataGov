# 仪表盘 (Dashboard) 接口规范

**Base URL**: `/api/v1`

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