# 系统管理 (System) 页面映射

### 9.1 用户与权限管理
- **所在菜单**: `系统管理 -> 用户管理` / `角色权限`
- **对应组件**: `src/pages/system/UserManage.tsx` (规划中)
- **依赖接口**:
  - `GET /api/v1/system/users`: 获取用户列表。
  - `POST /api/v1/system/users`: 新增用户。
  - `PUT /api/v1/system/users/:id`: 更新用户信息。
  - `DELETE /api/v1/system/users/:id`: 删除或禁用用户。
  - `GET /api/v1/system/roles`: 获取角色及权限配置。
  - `POST /api/v1/system/roles`: 新增角色。
  - `PUT /api/v1/system/roles/:id`: 更新角色权限。
  - `DELETE /api/v1/system/roles/:id`: 删除角色。

### 9.2 系统日志与配置
- **所在菜单**: `系统管理 -> 操作日志` / `系统配置`
- **对应组件**: `src/pages/system/SysLogs.tsx` (规划中)
- **依赖接口**:
  - `GET /api/v1/system/logs`: 获取系统操作审计日志。
  - `GET /api/v1/system/dicts`: 获取全局数据字典。