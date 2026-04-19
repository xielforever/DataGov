# 数据建模(Data Modeling) - 架构看板式布局重构设计文档

## 1. 背景与目标
目前“数据建模”页面采用的是传统的扁平网格卡片布局，将所有的模型平铺在一起。根据真实数据开发的业务诉求，需要将页面的宏观展示进行重构，以符合**数仓分层架构**的思维模型：
- **第一层**：以数仓分层（ODS / DWD / DWS / ADS / DIM）为外层宏观大卡片（区块）。
- **第二层**：在大卡片内部，聚合展示该分层下的各个**数据源**小卡片（显示数据源名称及模型数量）。
- **第三层**：点击数据源小卡片后，在当前大卡片内部采用**手风琴式向下展开**，展示该数据源下的具体数据模型列表。

**关键要求**：
- 采用**方案A**的水平铺开的看板式架构。
- 展开的模型列表需要支持**分页展示**。
- 模型列表默认按照**表名 (name)** 排序。

## 2. 架构与布局设计

### 2.1 页面整体结构 (Kanban View)
页面将放弃平铺的所有模型卡片，改为渲染 5 个主要的区块（Layers）。由于屏幕宽度的限制，这 5 个区块可以采用 Grid 布局（如 `grid-cols-1 xl:grid-cols-2`，根据内容自适应换行，ODS等排在前面）。

每个区块（Layer Block）包含：
- **Header**: 带有该分层专属颜色和图标的标题（如 `ODS 贴源层`）。
- **Body**: 包含一组“数据源小卡片”。
- **手风琴展开区**: 如果该分层内某个数据源被点击选中，Body 的下方将平滑展开一个面板，展示该数据源下的模型表格。

### 2.2 数据源小卡片 (Data Source Card)
- **展示内容**：数据源名称、图标、该数据源下包含的**模型数量**。
- **交互**：点击卡片可切换选中状态。选中时高亮，并在下方展开模型列表。再次点击可收起。

### 2.3 手风琴展开面板与模型列表 (Accordion & Model List)
展开的面板将占据整行宽度，内部包含一个数据表格。
- **表格列**：模型名称 (表名)、中文名、业务域、负责人、状态、更新时间、操作（编辑、发布、同步、下线、删除等）。
- **排序逻辑**：获取到的模型列表数据在渲染前，必须先执行 `sort((a, b) => a.name.localeCompare(b.name))` 按表名进行字母顺序排序。
- **分页逻辑**：
  - 在面板底部引入简单的分页器（Pagination）。
  - 维护局部状态 `currentPage`，默认每页展示 5 或 10 条数据（视高度而定）。
  - 对排序后的数据进行 `slice` 截取渲染。

## 3. 状态管理设计 (State Management)
在 `DataModeling.tsx` 中，除了现有的 `models` 和 `dataSources` 外，需要引入用于控制看板展开状态的变量：

```typescript
// 记录当前展开的是哪个分层下的哪个数据源
// key 为 layer 名称（如 'ODS'），value 为 dataSourceId
const [expandedSource, setExpandedSource] = useState<Record<string, string | null>>({});

// 记录各个展开面板的分页状态
// key 为 dataSourceId，value 为 currentPage
const [pageState, setPageState] = useState<Record<string, number>>({});
```

## 4. 数据预处理逻辑 (Data Transformation)
为了方便渲染，我们需要对原始的扁平 `models` 数组进行两次分组（GroupBy）：
1. 按 `layer` 分组。
2. 在每个 `layer` 内，按 `dataSourceId` 分组。

**预处理函数签名示例**：
```typescript
type GroupedData = Record<string, Record<string, Model[]>>;
// 结果格式: { 'ODS': { 'ds-1': [ModelA, ModelB], 'ds-2': [ModelC] }, 'DWD': { ... } }
```
未绑定数据源的模型（`dataSourceId` 为空或 undefined），将被归类到一个虚拟的“未绑定数据源”组中。

## 5. 迁移与回退策略
- 原有的新建向导（DataModelingWizard）流程保持不变，它作为一个独立的视图存在（通过 `viewMode === 'create'` 切换）。
- 原有的 `handleDelete`, `handleStatusChange`, `handleSyncToDb` 操作逻辑保持不变，只需将其绑定到新表格中的对应按钮上即可。
- 原有的 `isDetailDrawerOpen` 模型详情抽屉功能保留，用户可以在展开的表格中点击“模型名称”或专门的“查看详情”按钮来唤出右侧抽屉，查看字段定义。