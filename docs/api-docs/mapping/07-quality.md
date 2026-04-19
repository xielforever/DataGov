# 数据质量与监控 (Quality) 页面映射

### 7.1 指标管理
- **所在菜单**: `数据质量 -> 指标管理`
- **对应组件**: `src/pages/quality/MetricManage.tsx`
- **依赖接口**:
  - `GET /api/v1/quality/metrics`: 获取业务指标、技术指标定义及校验规则。
  - `POST /api/v1/quality/metrics`: 新增数据质量指标或规则。
  - `PUT /api/v1/quality/metrics/:id`: 更新指标规则配置。
  - `DELETE /api/v1/quality/metrics/:id`: 删除指标。

### 7.2 运维监控
- **所在菜单**: `数据质量 -> 运维监控`
- **对应组件**: `src/pages/quality/OperationsMonitor.tsx`
- **依赖接口**:
  - `GET /api/v1/quality/alerts`: 获取当前系统的告警信息、延迟监控和 SLA 达标率。