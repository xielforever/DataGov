# 脚本开发 (Script Development) 页面设计方案

## 1. 需求背景与目标
“脚本开发”是数据治理平台中数据开发（Data Development）的核心模块，主要提供类似 Web IDE 的环境供数据工程师编写、调试、保存 SQL/Python/Shell 等脚本任务，并在验证无误后提交或发布到任务编排和调度系统。

本设计基于用户选择的 **“方案A：专业代码编辑器 + 经典 IDE 布局”**。

## 2. 技术选型
* **核心编辑器**：`@monaco-editor/react` (提供媲美 VS Code 的语法高亮、代码提示、自动缩进和括号匹配体验)。
* **布局实现**：React + Tailwind CSS 构建类似于 `vscode-web` 的响应式左右/上下分栏布局。
* **图标库**：`lucide-react` (用于目录树文件图标、播放/停止等操作图标)。

## 3. 页面布局设计
页面将采用经典的四大区域 IDE 布局：

### 3.1 左侧边栏 (Sidebar - 目录树)
* 展示项目或用户的脚本目录树（支持多级文件夹）。
* 节点包含 `文件夹 (Folder)` 和 `脚本文件 (Script)`。
* 脚本类型通过**图标**区分（如 SQL、Python、Shell 专属图标），文件名称**不需要后缀**。
* 提供顶部操作栏：新建文件、新建文件夹、刷新。

### 3.2 顶部操作栏 (Toolbar)
* 显示当前激活的脚签（Tab）名称及其未保存状态（`*`）。
* **数据源选择 (Data Source Selector)**：
  * 选择脚本执行的数据源环境（如 Hive, MySQL, PostgreSQL 等）。
  * **动态配置项**：针对不同类型的数据源展示不同的配置项。例如，选择 Hive 时，会出现“队列 (Queue)”选择框。
* 核心操作按钮：
  * **保存 (Save)**：保存当前草稿。
  * **格式化 (Format)**：格式化代码（主要针对 SQL）。
  * **运行 (Run)**：执行当前选中的脚本片段或全部代码。
  * **停止 (Stop)**：终止当前运行的任务。
  * **提交发布 (Publish)**：直接将当前脚本提交至**审批流 (Approval Flow)**。
  * **版本管理 (Versions)**：查看和切换脚本的历史版本。

### 3.3 中间主编辑区 (Editor Area)
* 引入 `<MonacoEditor />`。
* 默认采用深色主题 (`vs-dark`) 与平台色调融合。
* 支持多标签页（Tabs），允许用户同时打开并切换多个脚本。
* **新建脚本入口**：在标签页栏 (Tab bar) 提供一个 `+` 号空标签页，鼠标悬停时展示下拉菜单（如“新建 MySQL”、“新建 Hive SQL”、“新建 Python”等），点击即可快速创建对应类型的空白脚本并在编辑器中打开。

### 3.4 底部控制台/结果面板 (Bottom Panel)
分为两个子 Tab：
* **运行日志 (Logs)**：展示代码执行的标准输出（stdout/stderr），如 "Job started...", "Running query...", "Success in 2.3s"。
* **结果预览 (Result)**：如果执行的是 SQL 且有返回结果集，使用一个表格（Table）展示部分查询数据。

### 3.5 右侧辅助面板 (可选/后期扩展)
* 预留一个可折叠的辅助抽屉，用于查看：
  * 函数参考 (UDF docs)。
  * 表结构 (Metadata/Schema Viewer) 以便边写边查字段名。

## 4. 核心状态与数据模型 (Mock)

**1. 脚本文件节点 (ScriptNode)**
```typescript
interface ScriptNode {
  id: string;
  name: string; // 不带后缀
  type: 'folder' | 'sql' | 'python' | 'shell';
  parentId: string | null;
  content?: string;
  status?: 'draft' | 'published' | 'approving'; // 审批状态
  version?: number; // 当前版本号
  dataSourceId?: string; // 关联数据源
  dataSourceConfig?: any; // 动态配置项（如 { queue: 'default' }）
  updateTime: string;
}

interface ScriptVersion {
  id: string;
  scriptId: string;
  version: number;
  content: string;
  createTime: string;
  creator: string;
  comment: string;
}
```

**2. API 设计**
* `GET /api/v1/development/scripts`: 获取左侧目录树数据。
* `GET /api/v1/development/scripts/:id`: 获取具体脚本内容。
* `POST /api/v1/development/scripts`: 新建脚本或文件夹。
* `PUT /api/v1/development/scripts/:id`: 保存脚本内容。
* `POST /api/v1/development/scripts/:id/run`: 模拟执行脚本。
* `POST /api/v1/development/scripts/:id/publish`: 提交至审批流。
* `GET /api/v1/development/scripts/:id/versions`: 获取脚本历史版本。
* `GET /api/v1/metadata/data-sources`: 获取数据源列表（用于数据源下拉选择）。

## 5. 阶段实施计划
1. **第一阶段**：通过 npm 安装 `@monaco-editor/react`。
2. **第二阶段**：在 `data.ts` 和 `handlers.ts` 中补充 `ScriptNode` 相关的树形数据和 CRUD/Run 接口。
3. **第三阶段**：开发 `ScriptDev.tsx`，搭建经典的 IDE 骨架（左侧树 + 右侧编辑器 + 底部面板）。
4. **第四阶段**：接入 Monaco Editor，实现文件点击切换、代码保存和模拟运行展示日志的功能。