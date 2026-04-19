# 数据建模(Data Modeling) - 多步向导功能重构设计文档

## 1. 背景与目标
当前“数据建模”页面的新建模型功能采用简单的弹窗（Modal）实现，仅支持单级表单的属性填写。但在真实的数据开发场景中：
1. **模型与数据源关系**：数据模型需**强绑定**到特定的物理数据源（如 MySQL、Hive、ClickHouse 等），这决定了字段的可用数据类型和执行 DDL 的目标。
2. **多阶段配置诉求**：新建一个完整的物理模型通常包含大量字段、复杂的分区策略以及与数据标准的关联。将其全部放在一个弹窗中会导致信息过载，用户体验不佳。

**目标**：采用**全屏沉浸式多步向导（Wizard）页面**，替换原有的弹窗形式，重构“新建模型”与“编辑模型”的交互流程，实现专业级的数据建模体验。

## 2. 架构设计

### 2.1 路由与页面组件
新增独立路由：
- **路径**: `/development/modeling/create` (新建) 和 `/development/modeling/edit/:id` (编辑)
- **页面组件**: `src/pages/development/DataModelingWizard.tsx`
  - 该组件作为全屏容器，顶部包含返回按钮和进度步骤条（Steps）。
  - 底部包含固定悬浮的操作按钮栏（上一步、下一步、保存草稿、发布）。

### 2.2 数据状态管理
为支持跨步表单状态保留，将引入本地 `useState` 统一管理一个大的 `ModelDraft` 对象，包含：
```typescript
interface ModelDraft {
  // Step 1: 基本信息
  dataSourceId: string;
  name: string;
  cnName: string;
  layer: "ODS" | "DWD" | "DWS" | "ADS" | "DIM";
  domain: string;
  owner: string;
  description: string;
  
  // Step 2: 字段结构设计
  fields: FieldDraft[];
  
  // Step 3: 物理与高级属性
  partitionType: "none" | "time" | "hash" | "list";
  partitionFields: string[]; // 关联的字段名
  lifecycle: number; // 生命周期（天）
  storageFormat: "Parquet" | "ORC" | "CSV" | "JSON";
  
  // Step 4: 关联数据标准
  standardMappings: StandardMappingDraft[];
}
```

## 3. 多步向导流程拆解

### 第一步：基本信息配置 (Basic Info)
- **目标数据源 (Data Source)**：必填。从 `fetchMetadataDataSources` API 获取系统已注册的数据源列表，支持下拉搜索。选择后，后续步骤的数据类型将根据该数据源的引擎类型进行适配。
- **表名 (Table Name)**：必填，需符合目标数据源的命名规范（如仅小写字母和下划线）。
- **中文名 (Display Name)**：必填。
- **数仓分层 (Layer) & 业务域 (Domain)**：从预设列表或字典中选择。
- **负责人 (Owner)** 与 **描述 (Description)**。

### 第二步：字段结构设计 (Schema Design)
- **交互形式**：提供类似 Excel 的内联可编辑表格（Inline Editable Table）。
- **字段属性**：字段名、中文别名、数据类型（提供自动补全的下拉列表）、主键（PK）、非空（NN）、默认值。
- **快捷操作**：
  - 支持快捷添加、删除行。
  - 支持通过 **DDL 解析** 快速生成字段（输入 `CREATE TABLE ...` 语句自动提取字段）。

### 第三步：物理属性与分区设置 (Physical & Partition)
- **分区配置**：
  - 选择是否分区。
  - 若分区，选择分区类型（如时间分区、哈希分区）。
  - 选择用作分区的字段（从第二步定义的字段中选择，通常是 `dt` 或 `ds`）。
- **生命周期管理**：配置表数据的保留策略（如 365 天或永久）。
- **存储属性**：如果是大数据存储（如 Hive），可配置文件格式（Parquet/ORC 等）。

### 第四步：关联数据标准 (Standard Mapping)
- **智能映射**：系统根据字段名和中文别名，尝试自动匹配现有的数据标准（Standard Definitions）或数据字典（Data Dictionaries）。
- **人工干预**：用户可在此页面审核自动匹配的结果，或手动为字段指派标准。这一步是为了在建表前就保证数据质量和规范性。

## 4. 接口 (API) 适配要求
1. **获取数据源列表**：复用现有的 `GET /api/v1/metadata/data-sources`。
2. **获取数据标准**：复用现有的 `GET /api/v1/standard/definitions`。
3. **模型提交**：`POST /api/v1/development/models` 和 `PUT /api/v1/development/models/:id` 需要扩展 Payload Schema，支持接收 `dataSourceId`、`partitionType`、`lifecycle` 等新增属性。

## 5. 迁移与回退策略
1. 保留原有的主列表页面 `DataModeling.tsx`，但将其“新建”和“编辑”按钮的 `onClick` 事件改为 React Router 的 `navigate('/development/modeling/create')` 跳转。
2. 移除原有的简易 Modal 和 Drawer 字段编辑逻辑，因为向导页面已经完全覆盖这些能力。
3. 主列表的卡片展示将增加对“所属数据源”的显示。