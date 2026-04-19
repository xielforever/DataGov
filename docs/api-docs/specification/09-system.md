# 系统管理 (System) 接口规范

**Base URL**: `/api/v1`

> **说明**: 本模块接口规范定义仍在设计和重构中，后续将逐步补充完整。

### 9.1 用户与权限管理
- **Endpoint**: `GET /api/v1/system/users`
- **Description**: 获取用户列表。
- **Endpoint**: `GET /api/v1/system/roles`
- **Description**: 获取角色及权限配置。

### 9.2 系统日志与配置
- **Endpoint**: `GET /api/v1/system/logs`
- **Description**: 获取系统操作审计日志。
- **Endpoint**: `GET /api/v1/system/dicts`
- **Description**: 获取全局数据字典。