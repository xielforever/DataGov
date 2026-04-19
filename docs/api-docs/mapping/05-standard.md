# 数据标准 (Standard) 页面映射

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