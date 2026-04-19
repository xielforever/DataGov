# 数据资产 (Asset) 页面映射

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