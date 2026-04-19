# 页面与接口映射关系

为便于前后端联调与功能验证，本文档列出了数据治理系统（DataGov）中所有页面及其所依赖的 API 接口，并说明了这些接口对应的页面功能。

---

## 1. 认证鉴权 (Auth)

### 1.1 登录页面
- **状态/页面**: `登录状态`
- **对应组件**: `src/pages/auth/LoginForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/login`: 用户账号密码登录，成功后返回 token 和用户基础信息。

### 1.2 注册页面
- **状态/页面**: `注册状态`
- **对应组件**: `src/pages/auth/RegisterForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/register`: 提交新用户注册信息。

### 1.3 找回密码页面
- **状态/页面**: `忘记密码状态`
- **对应组件**: `src/pages/auth/ForgotPasswordForm.tsx`
- **依赖接口**:
  - `POST /api/v1/auth/reset-password`: 请求密码重置邮件或验证码。

---

## 2. 工作台 (Dashboard)

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

---

## 3. 数据资产 (Asset)

### 3.1 资产总览
- **所在菜单**: `数据资产 -> 资产总览`
- **对应组件**: `src/pages/asset/AssetOverview.tsx`
- **依赖接口**:
  - `GET /api/v1/assets/core-metrics`: 渲染页面顶部核心数据资产指标（总量、存储量等）。
  - `GET /api/v1/assets/layer-distribution`: 渲染“数据分层分布”饼图。
  - `GET /api/v1/assets/business-domains`: 渲染“业务域分布”柱状图/列表。
  - `GET /api/v1/assets/data-sources`: 渲染“数据源类型分布”模块。
  - `GET /api/v1/assets/growth-trend`: 渲染“资产增长趋势”折线图。
  - `GET /api/v1/assets/health-metrics`: 渲染“资产健康度”环形图指标。
  - `GET /api/v1/assets/hot-assets`: 渲染“热门资产 Top 10”排行列表。
  - `GET /api/v1/assets/pending-items`: 渲染“待处理事项”卡片列表。

### 3.2 资产注册
- **所在菜单**: `数据资产 -> 资产注册`
- **对应组件**: `src/pages/asset/AssetRegister.tsx`
- **依赖接口**:
  - `POST /api/v1/assets/register`: 提交新资产注册或导入的表单数据。
  - `PUT /api/v1/assets/:id`: 更新已注册的资产信息。
  - `DELETE /api/v1/assets/:id`: 删除或下线资产。

### 3.3 数据目录 (Data Catalog)
- **所在菜单**: `数据资产 -> 数据目录`
- **对应组件**: `src/pages/asset/DataCatalog.tsx`
- **依赖接口**:
  - `GET /api/v1/assets/catalog`: 渲染资产编目树状结构和列表，支持按业务域、数据分层进行筛选和查看。

### 3.4 数据地图
- **所在菜单**: `数据资产 -> 数据地图`
- **对应组件**: `src/pages/asset/DataMap.tsx`
- **依赖接口**:
  - `GET /api/v1/assets/map`: 聚合接口，返回数据用于渲染数据地图页面的四大核心板块：
    1. **业务域图谱**: 根据 `domains` 数据渲染业务模块聚类。
    2. **数据分层架构**: 根据 `layers` 渲染 ODS/DWD/DWS 等架构图。
    3. **资产热力分布**: 根据 `assets` 渲染资产热力图卡片。
    4. **物理节点分布**: 根据 `datacenters` 渲染机房节点监控。

### 3.5 数据血缘
- **所在菜单**: `数据资产 -> 数据血缘`
- **对应组件**: `src/pages/asset/DataLineage.tsx`
- **依赖接口**:
  - `GET /api/v1/assets/lineage`: 
    - 渲染血缘关系拓扑图（SVG）、字段血缘映射关系以及影响分析。
    - 当前端附带 `?center=节点ID` 时，后端需动态计算并返回以该节点为核心（`level=0`）的层级偏移数据。

### 3.6 数据源管理
- **所在菜单**: `数据资产 -> 数据源管理`
- **对应组件**: `src/pages/metadata/DataSource.tsx`
- **依赖接口**:
  - `GET /api/v1/metadata/data-sources`: 渲染数据源管理列表，包含连接状态、类型、存储量、所属部门及标签等。
  - `POST /api/v1/metadata/data-sources`: 新建数据源。
  - `PUT /api/v1/metadata/data-sources/:id`: 更新数据源配置。
  - `DELETE /api/v1/metadata/data-sources/:id`: 解除数据源接入。
  - `POST /api/v1/metadata/data-sources/:id/test`: 测试数据源连接状态。
  - `POST /api/v1/metadata/data-sources/:id/sync`: 手动触发一次元数据同步。

---

## 4. 元数据管理 (Metadata)

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

---

## 5. 数据标准 (Standard)

### 5.1 标准定义
- **所在菜单**: `数据标准 -> 标准定义`
- **对应组件**: `src/pages/standard/StandardDef.tsx`
- **依赖接口**:
  - `GET /api/v1/standard/definitions`: 获取标准定义列表（表格展示及右侧抽屉详情）。
  - `POST /api/v1/standard/definitions`: 新建标准定义。
  - `PUT /api/v1/standard/definitions/:id`: 更新标准定义信息。
  - `POST /api/v1/standard/definitions/:id/offline`: 下线某个标准定义。
  - `POST /api/v1/standard/definitions/import`: 批量导入标准定义。

### 5.2 标准映射
- **所在菜单**: `数据标准 -> 标准映射`
- **对应组件**: `src/pages/standard/StandardMap.tsx`
- **依赖接口**:
  - `GET /api/v1/standard/mappings`: 获取标准映射关系列表（包含匹配度）。
  - `POST /api/v1/standard/mappings`: 创建手动映射。
  - `POST /api/v1/standard/mappings/:id/status`: 更新映射状态（如确认或忽略）。
  - `POST /api/v1/standard/mappings/rescan`: 触发重新扫描智能映射。

### 5.3 标准评估
- **所在菜单**: `数据标准 -> 标准评估`
- **对应组件**: `src/pages/standard/StandardEval.tsx`
- **依赖接口**:
  - `GET /api/v1/standard/evaluations`: 获取评估概览卡片、图表趋势数据以及不合规问题列表。
  - `POST /api/v1/standard/evaluations/run`: 触发开始一轮新的评估。
  - `POST /api/v1/standard/evaluations/export`: 导出评估报告文件。

### 5.4 数据字典
- **所在菜单**: `数据标准 -> 数据字典`
- **对应组件**: `src/pages/standard/DataDict.tsx`
- **依赖接口**:
  - `GET /api/v1/standard/dictionaries/categories`: 获取左侧字典分类树结构。
  - `POST /api/v1/standard/dictionaries/categories`: 新增字典分类。
  - `GET /api/v1/standard/dictionaries/:code/items`: 获取某个字典分类下的字典项明细列表。
  - `POST /api/v1/standard/dictionaries/:code/items`: 新增字典项。
  - `PUT /api/v1/standard/dictionaries/:code/items/:itemId`: 更新字典项。
  - `DELETE /api/v1/standard/dictionaries/:code/items/:itemId`: 删除字典项。

### 5.5 码值管理
- **所在菜单**: `数据标准 -> 码值管理`
- **对应组件**: `src/pages/standard/CodeManage.tsx`
- **依赖接口**:
  - `GET /api/v1/standard/codes`: 获取主列表的码表集合。
  - `POST /api/v1/standard/codes`: 新建码表。
  - `PUT /api/v1/standard/codes/:id`: 更新码表信息。
  - `DELETE /api/v1/standard/codes/:id`: 删除码表。
  - `POST /api/v1/standard/codes/:id/clone`: 克隆码表。
  - `POST /api/v1/standard/codes/import`: 导入码表文件。
  - `GET /api/v1/standard/codes/:code/values`: 获取右侧抽屉内具体码表下的码值明细。
  - `POST /api/v1/standard/codes/:code/values`: 在当前码表下新增码值。
  - `PUT /api/v1/standard/codes/:code/values/:id`: 更新码值。
  - `DELETE /api/v1/standard/codes/:code/values/:id`: 删除码值。

---

## 6. 数据开发 (Development)

### 6.1 数据同步
- **所在菜单**: `数据开发 -> 数据同步`
- **对应组件**: `src/pages/development/DataSync.tsx`
- **依赖接口**:
  - `GET /api/v1/development/sync-tasks`: 获取离线/实时数据同步任务配置。

### 5.2 脚本开发
- **所在菜单**: `数据开发 -> 脚本开发`
- **对应组件**: `src/pages/development/ScriptDev.tsx`
- **依赖接口**:
  - `GET /api/v1/development/scripts`: 获取 SQL/Python 等脚本文件树。
  - `POST /api/v1/development/scripts`: 新建并保存脚本。
  - `PUT /api/v1/development/scripts/:id`: 更新脚本内容。
  - `DELETE /api/v1/development/scripts/:id`: 删除脚本。
  - `POST /api/v1/development/execute`: 提交脚本执行并返回运行日志。

### 5.3 实时计算
- **所在菜单**: `数据开发 -> 实时计算`
- **对应组件**: `src/pages/development/RealtimeCompute.tsx`
- **依赖接口**:
  - `GET /api/v1/development/realtime-jobs`: 获取 Flink/Spark 实时流计算任务状态。

### 5.4 任务编排
- **所在菜单**: `数据开发 -> 任务编排`
- **对应组件**: `src/pages/development/TaskOrchestration.tsx`
- **依赖接口**:
  - `GET /api/v1/development/workflows`: 获取 DAG 工作流依赖配置和调度信息。

---

## 6. 数据质量与监控 (Quality)

### 6.1 指标管理
- **所在菜单**: `数据质量 -> 指标管理`
- **对应组件**: `src/pages/quality/MetricManage.tsx`
- **依赖接口**:
  - `GET /api/v1/quality/metrics`: 获取业务指标、技术指标定义及校验规则。
  - `POST /api/v1/quality/metrics`: 新增数据质量指标或规则。
  - `PUT /api/v1/quality/metrics/:id`: 更新指标规则配置。
  - `DELETE /api/v1/quality/metrics/:id`: 删除指标。

### 6.2 运维监控
- **所在菜单**: `数据质量 -> 运维监控`
- **对应组件**: `src/pages/quality/OperationsMonitor.tsx`
- **依赖接口**:
  - `GET /api/v1/quality/alerts`: 获取当前系统的告警信息、延迟监控和 SLA 达标率。

---

## 7. 数据服务 (Service)

### 7.1 API 服务管理
- **所在菜单**: `数据服务 -> API服务`
- **对应组件**: `src/pages/service/DataServiceApi.tsx`
- **依赖接口**:
  - `GET /api/v1/service/apis`: 获取已发布的数据 API 列表、调用量及 QPS 统计。
  - `POST /api/v1/service/apis`: 注册/新建数据 API。
  - `PUT /api/v1/service/apis/:id`: 修改数据 API 配置。
  - `DELETE /api/v1/service/apis/:id`: 删除数据 API。
  - `POST /api/v1/service/apis/:id/publish`: 发布 API。
  - `POST /api/v1/service/apis/:id/offline`: 下线 API。

### 7.2 数据共享
- **所在菜单**: `数据服务 -> 数据共享`
- **对应组件**: `src/pages/service/DataSharing.tsx`
- **依赖接口**:
  - `GET /api/v1/service/shares`: 获取跨部门/跨系统的数据共享申请、授权及使用流水。
  - `POST /api/v1/service/shares/apply`: 提交数据共享申请。
  - `POST /api/v1/service/shares/:id/approve`: 审批数据共享申请。

---

## 8. 系统管理 (System)

### 8.1 用户与权限管理
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

### 8.2 系统日志与配置
- **所在菜单**: `系统管理 -> 操作日志` / `系统配置`
- **对应组件**: `src/pages/system/SysLogs.tsx` (规划中)
- **依赖接口**:
  - `GET /api/v1/system/logs`: 获取系统操作审计日志。
  - `GET /api/v1/system/dicts`: 获取全局数据字典。
