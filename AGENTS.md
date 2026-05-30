# DataGov Agent Guide

## Project Context

DataGov is a React + Vite + Tailwind single page application for a commercial-style data governance and data development platform.

Primary stack:

- React 19
- Vite 7
- Tailwind CSS 4
- MSW mock APIs
- Monaco editor via `@monaco-editor/react`
- Lucide icons

The product should feel like an enterprise data governance workbench: dense, structured, dark themed, and operational. Avoid marketing-page layouts, decorative hero sections, and generic empty cards.

## Commands

Use these commands from the repository root:

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
npx.cmd vite build --emptyOutDir=false
```

Prefer `npx.cmd vite build --emptyOutDir=false` for validation. `npm run build` may fail on Windows when `dist/index.html` is locked.

The local development URL is usually:

```text
http://127.0.0.1:5174/
```

## Editing Rules

- Do not revert user changes or unrelated dirty worktree files.
- Keep changes scoped to the requested page or module.
- Use existing project patterns before introducing new abstractions.
- Use `apply_patch` for manual edits.
- Do not use destructive git commands.
- Keep UI text in normal Chinese. Do not introduce mojibake or garbled Chinese.
- If editing files that already contain garbled Chinese, fix only the affected nearby strings unless the task asks for broader cleanup.

## UI Direction

Follow the existing enterprise dark UI:

- Use compact, work-focused layouts.
- Prefer full workbench surfaces over floating card-heavy composition.
- Use restrained borders, slate backgrounds, cyan accents, and clear density.
- Keep page sections aligned with existing data governance pages.
- Avoid nested cards unless they represent repeated items, modals, or framed tools.
- Do not add decorative gradient blobs or marketing-style hero areas.
- Ensure text does not overflow buttons, tabs, cards, or sidebars.

For data development pages, use `src/pages/development/DataModeling.tsx` as a layout reference where applicable:

- One integrated work area container.
- Left and right panes visually connected.
- Left pane and right pane may use different background colors.
- Avoid unnecessary gaps between navigation/tree panes and main work areas.

## Menu Architecture

The app should expose a complete commercial data governance skeleton, even when some capabilities are not fully implemented.

Current agreed structure:

- Keep a complete governance platform menu.
- Remove `task-develop` as a separate menu item because it overlaps with script development, data sync, real-time compute, and orchestration.
- Remove `resource-manage` from the data development menu unless a clear execution-resource module is introduced later.
- Do not let unimplemented menu items silently fall back to the dashboard. Use a clear capability placeholder if wiring skeleton pages.

Core modules expected in the platform:

- Dashboard
- Data assets
- Metadata management
- Data standards
- Data development
- Data quality
- Data security
- Data services
- Approval center
- System management

## Script Development Page

Main file:

```text
src/pages/development/ScriptDev.tsx
```

Important behavior:

- Script type must be capability-based, not only `sql/python/shell`.
- SQL dialects should be distinguished at the business-model level: MySQL SQL, PostgreSQL SQL, Hive SQL, ClickHouse SQL.
- Monaco language may still be generic `sql` for SQL dialects, but `scriptType`, `editorLanguage`, and `dialect` should remain explicit.
- Data source filtering must come from the selected script template/capability.
- Shell task normally does not require a data source.
- New scripts should be created inside the current folder or requested parent folder, not as a disconnected separate tree.
- Left tree and editor should look like one integrated IDE surface.
- Tab overflow should keep the active/new tab visible.
- Tree actions should use right-click context menus where agreed.

## Validation

After frontend changes:

1. Run `npx.cmd vite build --emptyOutDir=false`.
2. When the change affects UI behavior, verify in browser at `http://127.0.0.1:5174/`.
3. Check for console errors when practical.
4. Check for horizontal overflow on changed pages when layout is touched.

## Progress Tracking

Project progress is tracked in:

```text
PROJECT_STATUS.md
```

Update this file when a feature area is completed, a product or architecture decision is made, a menu item changes, or a known issue is discovered or resolved. Keep updates concise and high-signal.

## Mock Data

Mock data lives mainly in:

```text
src/mock/data.ts
src/mock/handlers.ts
```

MSW handlers are used for local API behavior. Keep mock shape compatible with existing UI unless the task explicitly changes API contracts.

Pages must not hardcode business mock rows, templates, or option datasets inside React components. Put simulated business data in `src/mock/data.ts`, expose it through MSW handlers in `src/mock/handlers.ts`, and access it from pages through functions in `src/services/api.ts`.

Acceptable component-local constants are limited to UI-only configuration such as colors, labels, tab definitions, status display metadata, and empty form defaults. If the data represents platform objects such as quality rules, standards, assets, scripts, users, roles, tasks, or templates, route it through the mock API layer.

When adding a new feature page backed by mock data:

1. Add mock records or templates in `src/mock/data.ts`.
2. Add MSW endpoints in `src/mock/handlers.ts`.
3. Add service functions in `src/services/api.ts`.
4. Load data in the page through the service functions.
5. Keep create/update/status interactions going through the same mock API path, even if MSW only mutates in-memory arrays.
