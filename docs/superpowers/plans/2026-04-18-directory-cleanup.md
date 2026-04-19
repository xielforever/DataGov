# DataGov 项目根目录清理与重构计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清理根目录下为修复问题而产生的遗留脚本文件，统一归档或删除，保持根目录结构的整洁与规范。

**Architecture:** 
1. 梳理当前项目根目录中的所有 `.js` 和 `.cjs` 临时脚本文件。
2. 将确实有归档保留价值的脚本移动至 `scripts` 目录。
3. 删除无保留价值的废弃或冗余修复脚本。
4. 确认前端项目的配置文件与源码目录保持纯净（如 `src`, `dist`, `package.json`, `vite.config.ts` 等）。

**Tech Stack:** Bash, Node.js (脚本归档)

---

### Task 1: 创建脚本归档目录并移动有用脚本

**Files:**
- Create: `scripts/` (Directory)
- Modify: Move valid fix scripts to `scripts/`

- [ ] **Step 1: 创建归档目录**

```bash
mkdir -p scripts/fixes
```

- [ ] **Step 2: 整理并移动主要修复脚本**
（可选保留几个主要的作为参考，如 `fix-garbled-all.cjs`，其余准备在下一步删除）

```bash
mv fix-garbled-all.cjs scripts/fixes/
```

- [ ] **Step 3: 验证移动是否成功**

Run: `ls -la scripts/fixes/`
Expected: 能够看到 `fix-garbled-all.cjs` 文件。

- [ ] **Step 4: Commit**

```bash
git add scripts/
git commit -m "chore: archive main fix script to scripts/fixes"
```

---

### Task 2: 清理根目录废弃临时脚本

**Files:**
- Delete: `direct-fix.cjs`, `final-fix.cjs`, `fix-all-query.js`, `fix-all.cjs`, `fix-collect.cjs`, `fix-collect2.cjs`, `fix-collect3.cjs`, `fix-collect4.cjs`, `fix-collect5.cjs`, `fix-garbled.cjs`, `fix-garbled.js`, `fix-model.cjs`, `fix-query.cjs`, `fix-quotes.cjs`, `fix-remaining.cjs`, `fix-swallowed.cjs`, `fix-tags.cjs`, `inspect.cjs`, `replace-replacement.cjs`

- [ ] **Step 1: 执行删除命令**

```bash
rm -f direct-fix.cjs final-fix.cjs fix-all-query.js fix-all.cjs fix-collect.cjs fix-collect2.cjs fix-collect3.cjs fix-collect4.cjs fix-collect5.cjs fix-garbled.cjs fix-garbled.js fix-model.cjs fix-query.cjs fix-quotes.cjs fix-remaining.cjs fix-swallowed.cjs fix-tags.cjs inspect.cjs replace-replacement.cjs
```

- [ ] **Step 2: 验证根目录结构**

Run: `ls -la`
Expected: 根目录下不再有上述临时 `.cjs` 和 `.js` 修复脚本，只保留项目核心文件和 `scripts` 目录。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: clean up temporary fix scripts from root directory"
```
