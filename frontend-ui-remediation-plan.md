# Plan: Frontend UI Remediation

**Generated**: 2026-05-09
**Estimated Complexity**: Medium

## Overview
This plan addresses the UI issues found during the local browser review of the Vite React frontend at `http://127.0.0.1:5174/`. The priority is to make the application usable across desktop and mobile, remove runtime rendering errors, restore text correctness, and add repeatable UI validation so regressions are caught before delivery.

The work should be done in small, committable slices. Each sprint ends with a runnable browser check against `npm.cmd run dev -- --host 127.0.0.1 --port 5174`.

## Prerequisites
- Keep current uncommitted user changes intact; do not revert unrelated changes.
- Confirm whether the app must support true mobile use or only tablet/desktop. Until confirmed, target usable layouts for `390x844`, `768x1024`, `1440x900`.
- Use the existing React, Tailwind, MSW, Recharts/SVG patterns already present in the project.
- Use Playwright CLI or equivalent browser automation for screenshot and console validation.

## Sprint 1: Stabilize Shell Layout
**Goal**: Fix the primary mobile usability blocker and make the app shell responsive.
**Demo/Validation**:
- Login and open dashboard on `390x844`, `768x1024`, `1440x900`.
- Verify `document.documentElement.scrollWidth <= window.innerWidth` on mobile.
- Verify sidebar no longer consumes permanent width on mobile.

### Task 1.1: Add responsive app-shell state
- **Location**: `D:\devops\DataGov\src\App.tsx`
- **Description**: Add a mobile-aware shell state for sidebar open/closed behavior. On `lg` and wider screens keep the current collapsible sidebar behavior. Below `lg`, render the sidebar as an overlay drawer and remove the fixed `ml-64/ml-16` content offset.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Desktop keeps current sidebar collapse behavior.
  - Mobile content uses full viewport width when drawer is closed.
  - Opening the drawer overlays content instead of squeezing it.
- **Validation**:
  - Browser resize to `390x844`; check no horizontal page overflow.
  - Click menu open/close and verify content remains readable.

### Task 1.2: Refactor Sidebar for drawer mode
- **Location**: `D:\devops\DataGov\src\components\layout\Sidebar.tsx`
- **Description**: Add props for `isMobile`, `mobileOpen`, and `onClose`. Use `translate-x` transitions for mobile, add a backdrop, and close the drawer after selecting a menu item.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Mobile sidebar is hidden by default after login.
  - Backdrop click closes sidebar.
  - Menu selection closes sidebar on mobile.
  - Desktop behavior is unchanged.
- **Validation**:
  - Playwright click through a menu item on mobile and confirm drawer closes.

### Task 1.3: Refactor Header for mobile width
- **Location**: `D:\devops\DataGov\src\components\layout\Header.tsx`
- **Description**: Add a mobile menu button, reduce or hide the global search on small screens, and prevent notification/user menus from overflowing the viewport.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Header spans full width on mobile.
  - Search input does not force horizontal scrolling.
  - Dropdown panels use `max-w-[calc(100vw-...)]` or equivalent constraints.
- **Validation**:
  - Mobile screenshot shows usable header controls and no clipped search field.

## Sprint 2: Fix Runtime Errors And Graph Rendering
**Goal**: Remove browser console errors that affect UI correctness.
**Demo/Validation**:
- Navigate dashboard and asset overview.
- Console should have no application errors; favicon 404 should be gone.

### Task 2.1: Fix favicon resource
- **Location**: `D:\devops\DataGov\index.html`, `D:\devops\DataGov\public\`
- **Description**: Add a favicon asset or remove/update the missing favicon reference so `/favicon.ico` does not 404.
- **Dependencies**: None
- **Acceptance Criteria**:
  - `GET /favicon.ico` returns 200 or no favicon request is emitted.
- **Validation**:
  - Browser console contains no favicon 404.

### Task 2.2: Fix invalid SVG polyline points
- **Location**: likely `D:\devops\DataGov\src\pages\asset\AssetOverview.tsx`
- **Description**: Find the SVG polyline generation that emits percentage-based coordinate strings such as `0%,23.289...`. Convert all `points` values to numeric SVG coordinate pairs, or replace the handmade SVG line with the existing chart library pattern.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Asset overview chart renders without `<polyline> attribute points` error.
  - Trend line appears visually aligned with bars/axis.
- **Validation**:
  - Open asset overview and run console check; no polyline errors.

### Task 2.3: Add lightweight console-error smoke check
- **Location**: `D:\devops\DataGov\package.json`, optional `D:\devops\DataGov\scripts\`
- **Description**: Add a scripted browser smoke flow for login, dashboard, and asset overview that fails on console `error` entries except explicitly ignored development-only messages.
- **Dependencies**: Tasks 2.1, 2.2
- **Acceptance Criteria**:
  - Command documents how to run the smoke check.
  - Fails if future pages emit runtime UI errors.
- **Validation**:
  - Run the smoke check locally after starting Vite.

## Sprint 3: Text, Encoding, And Content Integrity
**Goal**: Remove garbled source text and visible stray punctuation from the UI.
**Demo/Validation**:
- Core screens display correct Chinese labels.
- No visible mojibake or stray `'` from source strings.

### Task 3.1: Audit and repair garbled strings
- **Location**:
  - `D:\devops\DataGov\src\App.tsx`
  - `D:\devops\DataGov\src\components\layout\Sidebar.tsx`
  - `D:\devops\DataGov\src\components\layout\Header.tsx`
  - `D:\devops\DataGov\src\pages\auth\*.tsx`
  - `D:\devops\DataGov\src\mock\handlers.ts`
- **Description**: Replace mojibake source strings with valid UTF-8 Chinese. Prioritize labels visible in the main shell, auth forms, notifications, user menu, and mock mutation responses.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Source files are valid UTF-8.
  - Sidebar, header, auth pages, and dashboard show correct labels.
  - No visible `�`, mojibake, or unexpected trailing quotes in primary UI.
- **Validation**:
  - `rg` search for common mojibake fragments such as `鐧`, `鏁`, `鍙`, `绠`, `璧`, `鎴`.
  - Browser snapshot of login, dashboard, and asset overview.

### Task 3.2: Normalize truncation rules
- **Location**: dashboard and page components under `D:\devops\DataGov\src\pages\`
- **Description**: Replace accidental hard truncation in labels with CSS-based truncation only where space is constrained. For important headings and button labels, allow wrapping or responsive stacking instead of clipping meaningful text.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Buttons like "数据表注册", "血缘关系分析", "元数据采集" show complete text on desktop.
  - Mobile uses readable wrapping/stacking instead of vertical one-character columns.
- **Validation**:
  - Desktop and mobile screenshots of dashboard quick actions.

## Sprint 4: Page-Level Responsive Pass
**Goal**: Make the highest-traffic pages usable across target breakpoints.
**Demo/Validation**:
- Dashboard and asset overview remain readable at `390`, `768`, and `1440` widths.
- Data-heavy tables and charts degrade gracefully.

### Task 4.1: Dashboard responsive layout
- **Location**: `D:\devops\DataGov\src\pages\dashboard\Dashboard.tsx`
- **Description**: Convert fixed multi-column sections to responsive grids. Ensure cards, quick actions, charts, lineage visualization, task list, and recent-source table each have defined mobile behavior.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Metric cards stack cleanly on mobile.
  - Chart panels fit viewport width.
  - Wide tables have an internal horizontal scroll container rather than causing page-level overflow.
- **Validation**:
  - `scrollWidth <= innerWidth` at page level.
  - Screenshots at all target widths.

### Task 4.2: Asset overview responsive layout
- **Location**: `D:\devops\DataGov\src\pages\asset\AssetOverview.tsx`
- **Description**: Apply responsive grids to KPI cards, charts, business domain list, health panel, data source cards, pending items, and hot assets table.
- **Dependencies**: Sprint 2
- **Acceptance Criteria**:
  - Header action buttons wrap or stack cleanly.
  - KPI cards and charts do not overflow on mobile.
  - Tables use internal scroll with visible affordance.
- **Validation**:
  - Browser check on `390x844`, `768x1024`, `1440x900`.

### Task 4.3: Shared table and panel constraints
- **Location**: shared component files if present, otherwise affected page files under `D:\devops\DataGov\src\pages\`
- **Description**: Standardize `min-w-0`, `overflow-hidden`, `overflow-x-auto`, and responsive padding patterns for dense dashboards.
- **Dependencies**: Tasks 4.1, 4.2
- **Acceptance Criteria**:
  - Page shell has no horizontal overflow.
  - Only intentional data tables scroll horizontally inside their own container.
- **Validation**:
  - Scripted page-level overflow check across visited pages.

## Sprint 5: Interaction And Accessibility Polish
**Goal**: Improve usability without changing product scope.
**Demo/Validation**:
- Keyboard and screen-reader basics work for navigation, forms, menus, and icon buttons.

### Task 5.1: Auth form semantics
- **Location**: `D:\devops\DataGov\src\pages\auth\LoginForm.tsx`
- **Description**: Add `autoComplete="username"` to account input and `autoComplete="current-password"` to password input. Add accessible labels or `aria-label` where placeholders are currently used as names.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Chrome no longer reports password autocomplete hint.
  - Form remains visually unchanged.
- **Validation**:
  - Browser console and accessibility snapshot.

### Task 5.2: Icon-only button labels
- **Location**:
  - `D:\devops\DataGov\src\components\layout\Header.tsx`
  - dashboard and asset page table action buttons
- **Description**: Add `aria-label`/title attributes for icon-only controls such as notification, help, rerun, log, view, lineage, share, favorite.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Accessibility snapshot exposes clear names for icon-only controls.
- **Validation**:
  - Playwright snapshot shows named buttons instead of unnamed button refs.

### Task 5.3: Dropdown and drawer focus handling
- **Location**: `D:\devops\DataGov\src\components\layout\Header.tsx`, `D:\devops\DataGov\src\components\layout\Sidebar.tsx`
- **Description**: Close dropdowns/drawer on Escape, close on outside click where appropriate, and keep focus behavior predictable.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Escape closes open menus.
  - Mobile drawer does not trap users visually or by keyboard.
- **Validation**:
  - Manual keyboard pass and browser automation for Escape behavior.

## Testing Strategy
- Run `npm.cmd run build` after each sprint to catch TypeScript/build regressions.
- Run Vite locally and perform browser checks at:
  - `390x844`
  - `768x1024`
  - `1440x900`
- For each checked page, collect:
  - console errors
  - `document.documentElement.scrollWidth`
  - screenshot
  - accessibility snapshot for unnamed controls
- Minimum smoke path:
  - login page
  - login with any non-empty credentials
  - dashboard
  - asset overview
  - one submenu page with a table

## Potential Risks & Gotchas
- Several source files already contain garbled strings. Manual repair is safer than running broad replacement scripts because some files may include intentionally encoded test data or generated fragments.
- Mobile support scope is ambiguous. If mobile is not a supported production target, Sprint 1 can be reduced to tablet responsiveness plus a minimum-width guard, but the current `390px` experience is visibly broken.
- Some chart code may be handmade SVG while other pages use chart libraries. Prefer one consistent chart approach to avoid fixing the same coordinate bugs repeatedly.
- The repo has a dirty worktree. Changes should be grouped carefully and reviewed before commit.
- The current login is a mocked delay with no route change. UI smoke tests should not assume real auth semantics.

## Rollback Plan
- Keep each sprint in separate commits.
- If the responsive shell creates regressions, revert Sprint 1 only and keep independent fixes from Sprint 2 and Sprint 3.
- If chart refactor is risky, first patch numeric SVG coordinates, then separately migrate to a chart abstraction.
- If encoding repair is too broad, land only visible shell/auth text first and defer mock response strings.
