# 工作台 (Dashboard) 页面映射

### 2.1 综合仪表盘
- **所在菜单**: `主控制台 -> 综合仪表盘`
- **对应组件**: `src/pages/dashboard/Dashboard.tsx`
- **依赖接口**:
  - `GET /api/v1/dashboard/stats`: 渲染页面顶部“核心统计指标”卡片（数据表总数、质量得分等）。
  - `GET /api/v1/dashboard/recent-tables`: 渲染“最近更新表”列表卡片。
  - `GET /api/v1/dashboard/quality-trends`: 渲染“数据质量趋势”折线图表（Recharts）。
  - `GET /api/v1/dashboard/tasks`: 渲染“待处理任务”进度条列表。

### 2.2 数据治理看板
- **所在菜单**: `主控制台 -> 数据治理看板`
- **对应组件**: `src/pages/dashboard/DataGovernancePanel.tsx`
- **依赖接口**:
  - `GET /api/v1/dashboard/governance-metrics`: 获取治理相关的宏观大盘数据（如规范覆盖率、安全合规率等）。