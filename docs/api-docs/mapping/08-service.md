# 数据服务 (Service) 页面映射

### 8.1 API 服务管理
- **所在菜单**: `数据服务 -> API服务`
- **对应组件**: `src/pages/service/DataServiceApi.tsx`
- **依赖接口**:
  - `GET /api/v1/service/apis`: 获取已发布的数据 API 列表、调用量及 QPS 统计。
  - `POST /api/v1/service/apis`: 注册/新建数据 API。
  - `PUT /api/v1/service/apis/:id`: 修改数据 API 配置。
  - `DELETE /api/v1/service/apis/:id`: 删除数据 API。
  - `POST /api/v1/service/apis/:id/publish`: 发布 API。
  - `POST /api/v1/service/apis/:id/offline`: 下线 API。

### 8.2 数据共享
- **所在菜单**: `数据服务 -> 数据共享`
- **对应组件**: `src/pages/service/DataSharing.tsx`
- **依赖接口**:
  - `GET /api/v1/service/shares`: 获取跨部门/跨系统的数据共享申请、授权及使用流水。
  - `POST /api/v1/service/shares/apply`: 提交数据共享申请。
  - `POST /api/v1/service/shares/:id/approve`: 审批数据共享申请。