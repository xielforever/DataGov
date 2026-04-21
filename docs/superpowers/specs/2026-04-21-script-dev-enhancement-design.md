# 脚本开发 (Script Development) 界面完善设计方案

## 1. 需求背景与目标
用户希望进一步完善“数据开发 -> 脚本开发”界面（对应组件 `src/pages/development/ScriptDev.tsx`）。
基于用户确认，本次优化集中在四个主要方向：**UI/UX与布局（面板拖拽与右键菜单）**、**编辑器高级功能（格式化与补全）**、**数据结果面板展示**，以及**编辑器状态持久化**。

## 2. 核心优化模块

### 2.1 UI/UX 与响应式布局 (Layout & Interactions)
*   **拖拽调整面板大小**：引入 `react-resizable-panels`，将现有的硬编码高度/宽度（如 `w-64`, `h-48`）替换为可拖拽调整的 `PanelGroup`。
    *   左侧目录树面板与中间主编辑区支持左右拖拽。
    *   主编辑区与底部控制台支持上下拖拽。
*   **右键上下文菜单 (Context Menu)**：
    *   **目录树菜单**：在文件或文件夹上右键时，弹出“重命名”、“删除”操作菜单（当前只做UI和调用Mock API，不涉及真实后端删除）。
    *   **Tab 标签页菜单**：在 Tab 上右键时，弹出“关闭其他”、“关闭全部”等操作选项。

### 2.2 编辑器高级功能 (Editor Features)
*   **代码格式化 (Formatting)**：引入 `sql-formatter` 库，在用户点击工具栏的“格式化代码”或按下 `Alt + Shift + F` 时，对当前 SQL 内容进行专业格式化，并写回编辑器。
*   **自动补全 (Autocomplete)**：使用 Monaco Editor 的 `monaco.languages.registerCompletionItemProvider`，为 SQL 语言注入表名和常见字段的智能提示（Mock 数据如 `users`, `orders`, `user_id`, `created_at` 等）。

### 2.3 底部结果面板 (Data Result Panel)
*   底部控制台重构为带选项卡的双面板组件：
    *   **Tab 1：运行日志 (Logs)** - 保持现有功能，展示标准输出。
    *   **Tab 2：查询结果 (Results)** - 当用户执行 SQL 脚本并返回结果时，展示一个带有粘性表头（Sticky Header）的响应式 HTML 表格。提供简单的行号和字段展示。

### 2.4 状态持久化 (State Persistence)
*   利用 `localStorage`（如 key 为 `datagov_script_dev_state`），在组件的 `useEffect` 中读取和保存以下状态：
    *   当前打开的 Tab 列表（`openTabs` 的基本信息：id, type, name）。
    *   当前选中的脚本 ID（`activeScript` 的 id）。
    *   左侧目录树的展开状态（`expandedFolders`）。
*   当用户刷新页面或重新进入该页面时，能自动恢复之前的布局和打开的文件，避免重新寻找脚本。

## 3. 技术选型补充
*   `react-resizable-panels`：用于处理无缝的拖拽布局。
*   `sql-formatter`：用于实现复杂的 SQL 格式化。
*   Monaco Editor 原生 API：用于补全和快捷键绑定。

## 4. 实施顺序（见后续 Plan）
1.  安装依赖。
2.  重构布局，替换为 Resizable Panels。
3.  增加底部 Results 面板及相关状态。
4.  集成 Monaco 自动补全与 SQL 格式化。
5.  实现右键菜单和 Tab 的增强操作。
6.  添加 `localStorage` 持久化逻辑。
