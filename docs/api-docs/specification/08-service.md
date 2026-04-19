# 数据服务 (Service) 接口规范

**Base URL**: `/api/v1`

> **说明**: 本模块接口规范定义仍在设计和重构中，后续将逐步补充完整。

### 8.1 API 服务管理
- **Endpoint**: `GET /api/v1/service/apis`
- **Description**: 获取已发布的数据 API 列表、调用量及 QPS 统计。

### 8.2 数据共享
- **Endpoint**: `GET /api/v1/service/shares`
- **Description**: 获取跨部门/跨系统的数据共享申请、授权及使用流水。