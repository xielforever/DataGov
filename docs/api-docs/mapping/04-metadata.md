# 元数据管理 (Metadata) 页面映射

### 4.1 元数据采集
- **所在菜单**: `元数据管理 -> 元数据采集`
- **对应组件**: `src/pages/metadata/MetadataCollect.tsx`
- **依赖接口**:
  - `GET /api/v1/metadata/collect-tasks`: 获取元数据抽取与同步任务列表及运行状态。
  - `POST /api/v1/metadata/collect-tasks`: 新建采集任务。
  - `PUT /api/v1/metadata/collect-tasks/:id`: 更新采集任务配置。
  - `DELETE /api/v1/metadata/collect-tasks/:id`: 删除采集任务。
  - `POST /api/v1/metadata/collect-tasks/:id/run`: 手动触发一次采集任务。

### 4.2 元数据查询
- **所在菜单**: `元数据管理 -> 元数据查询`
- **对应组件**: `src/pages/metadata/MetadataQuery.tsx`
- **依赖接口**:
  - `GET /api/v1/metadata/query`: 聚合接口，渲染元数据搜索引擎页面：
    1. **检索能力统计**: 根据 `stats` 渲染顶部 4 个统计卡片。
    2. **查询历史与收藏**: 根据 `savedQueries` 和 `hotKeywords` 渲染左侧的搜索历史等。
    3. **检索结果列表**: 根据 `results` 渲染主搜索结果列表。

### 4.3 元数据维护
- **所在菜单**: `元数据管理 -> 元数据维护`
- **对应组件**: `src/pages/metadata/MetadataManage.tsx`
- **依赖接口**:
  - `GET /api/v1/metadata/maintain`: 聚合接口，渲染元数据治理与维护看板页面：
    1. **维护看板**: 根据 `stats` 渲染核心维护指标。
    2. **待维护资产**: 根据 `assets` 渲染待补充字段注释等问题的资产列表。
    3. **维护工单**: 根据 `workOrders` 渲染当前流转中的审批工单。
    4. **版本快照**: 根据 `snapshots` 渲染表结构变更和历史快照。

### 4.4 元数据模型
- **所在菜单**: `元数据管理 -> 元数据模型`
- **对应组件**: `src/pages/metadata/MetadataModel.tsx`
- **依赖接口**:
  - `GET /api/v1/metadata/models`: 获取逻辑模型、物理模型的定义列表。