# DataGov Project Status

Last updated: 2026-05-29

## Purpose

This file tracks project direction, completed work, pending work, known gaps, and open decisions for the DataGov frontend. It is intended for both humans and Codex so future sessions can recover project context without re-reading the full chat history.

## Current Product Direction

DataGov should present a complete commercial data governance platform skeleton with real workbench-style pages. The UI should feel like an enterprise data governance and data development console: dark, dense, structured, operational, and role-oriented.

Do not remove architecture-level menu items only because implementation is incomplete. Unimplemented capabilities should use a clear capability placeholder only as a fallback for unknown or future route ids, not as a separate registry layer.

## Architecture Decisions

- Use `AGENTS.md` for stable Codex project guidance.
- Use `PROJECT_STATUS.md` for changing project progress and current decisions.
- Keep a complete commercial data governance menu skeleton.
- Remove `task-develop` from the menu because it overlaps with script development, data sync, real-time compute, and orchestration.
- Remove `resource-manage` from the data development menu unless a clear execution-resource module is introduced later.
- Preserve normal Chinese UI copy. Do not introduce mojibake.
- Use `src/pages/development/DataModeling.tsx` as the reference layout for integrated left-right development workspaces.
- Keep `CapabilityPlaceholder` as the App-level fallback for unknown route ids only; do not maintain a separate placeholder registry.
- App shell supports `?view=<menu-id>` deep links for opening a specific workbench during development and browser review.
- Menu metadata and route components are centralized in `src/navigation/registry.tsx`; `App.tsx` and `Sidebar.tsx` must consume that registry instead of maintaining duplicate route/menu lists.
- Business domains are managed as shared master data under Data assets. Asset registration, asset catalog filters, standard definition filters, quality rule filters, and modeling entry forms should consume the business-domain mock API instead of hardcoded option lists.
- Data asset pages should avoid dead operational CTAs. Cross-page actions use `?view=<menu-id>` deep links with context parameters such as `asset` or `center` where useful.

## Current Implementation Snapshot

Build status:

- `npx.cmd vite build --emptyOutDir=false` passes as of 2026-05-16.

Core files:

- App shell and menu routing: `src/App.tsx`
- Sidebar menu: `src/components/layout/Sidebar.tsx`
- Unified menu/route registry: `src/navigation/registry.tsx`
- Shared capability placeholder: `src/components/common/CapabilityPlaceholder.tsx`
- Stable Codex guidance: `AGENTS.md`
- Progress tracking: `PROJECT_STATUS.md`

Implemented page groups currently routed from `App.tsx`:

- Dashboard: `dashboard`
- Data assets: `asset-overview`, `business-domain`, `asset-register`, `data-catalog`, `data-map`, `data-lineage`, `data-source`
- Metadata: `metadata-model`, `metadata-collect`, `metadata-manage`, `metadata-query`
- Data standards: `standard-def`, `standard-map`, `standard-eval`, `data-dict`, `code-manage`
- Data development: `data-modeling`, `script-dev`, `task-orchestration`, `realtime-compute`, `data-sync`
- Data services: `metric-manage`, `data-service-api`, `data-sharing`
- Data quality: `quality-rules`, `quality-check`, `quality-monitor`, `quality-report`
- Operations quality page: `ops-monitor`
- Approval center: `approvals-todos`, `approvals-applies`, `approvals-processed`

Route coverage:

- All current sidebar leaf menu items are registered in `src/navigation/registry.tsx`.
- No current sidebar leaf item depends on a separate placeholder registry.
- `CapabilityPlaceholder` remains only as the App-level fallback for unknown or future route ids.

## Completed

- Removed 15+ root-level temporary fix scripts (`fix-*.cjs`, etc.) to clean up the repository.
- Removed local development artifacts (`dev-server.log`, `.playwright-cli/`).
- Added root `AGENTS.md` with project instructions for Codex.
- Added `PROJECT_STATUS.md` for project progress tracking.
- Completed P0/P1/P2 table layout optimization across 12 pages:
  - P0 (6 pages): DataSource, StandardDef, DataSync, CodeManage, QualityRules, ApprovalCenter - fixed overflow-hidden clipping + added table-fixed + min-w + th column widths
  - P1 (4 pages): MetricManage, DataServiceApi, DataSharing, DataCatalog - added table-fixed + min-w to already-widthed tables
  - P2 (2 pages): StandardEval, AssetOverview - added table-fixed for stability
  - Fixed 3 mojibake instances in DataSync.tsx (状态'、记录'、最近同')
  - All tables now use consistent pattern: overflow-x-auto wrapper + table-fixed + min-w-[calculated] + explicit th widths
- Added shared `CapabilityPlaceholder` as the App-level fallback for unknown route ids.
- Replaced the long `activeMenu` ternary chain in `App.tsx` with a route/view registry.
- Wired every current sidebar leaf menu item to a real page or the App-level fallback.
- Extracted shared menu metadata and route components into `src/navigation/registry.tsx`, and updated `App.tsx` and `Sidebar.tsx` to consume the same registry.
- Cleaned Chinese mojibake in the global sidebar menu.
- Implemented the `quality-rules` page as a rule management workbench with categories, templates, filters, rule list, status toggles, detail drawer, and create-rule modal.
- Moved `quality-rules` simulation data into MSW mock APIs instead of hardcoding rows/templates in the page component.
- Implemented the `quality-check` page with mock-backed check batches, issue details, status filters, issue handling, and manual check-run creation.
- Implemented the `quality-monitor` page as a monitoring console with mock-backed quality overview, trends, active alerts, alert status handling, domain heat, and rule health cards.
- Implemented the `quality-report` page as a report workbench with mock-backed overview metrics, score trends, domain scoring, issue distribution, remediation effects, report generation, and export actions.
- Implemented the `security-level` page as a security classification workbench with mock-backed overview metrics, L1-L4 distribution, classification rules, classified assets, and review approval actions.
- Implemented the `sensitive-scan` page as a sensitive data discovery workbench with mock-backed scan overview, scan tasks, rule library, findings, review actions, and category heat.
- Implemented the `data-mask` page as a masking policy workbench with mock-backed overview metrics, policy toggles, field masking rules, algorithm distribution, and validation records.
- Implemented the `access-control` page as an authorization workbench with mock-backed overview metrics, access policies, access applications, grant revocation, and risk blocks.
- Implemented the `audit-log` page as an audit workbench with mock-backed overview metrics, event search, risk handling, export jobs, retention policies, and action distribution.
- Implemented the `task-schedule` page as a scheduling workbench with mock-backed overview metrics, schedule filtering, pause/resume, manual run, dependency windows, calendars, and backfill tracking.
- Implemented the `task-ops` page as an operations workbench with mock-backed instance monitoring, rerun/stop actions, runtime logs, recovery plans, alert subscriptions, resource queues, and status distribution.
- Implemented the `user-manage` page as a user administration workbench with mock-backed overview metrics, user search, lock/unlock actions, login policies, organization bindings, and risk account handling.
- Implemented the `role-manage` page as a role authorization workbench with mock-backed overview metrics, role search, enable/disable actions, function permissions, data scopes, member bindings, and permission risk handling.
- Implemented the `org-manage` page as an organization governance workbench with mock-backed overview metrics, org tree search, enable/disable actions, responsibility boundaries, data stewards, and org change processing.
- Implemented the `notification` page as a message notification workbench with mock-backed overview metrics, template search, template enable/disable actions, subscription rules, channel health, and message resend/archive handling.
- Implemented the `operation-log` page as an audit workbench with mock-backed overview metrics, operation search, risk handling, object tracing, diff comparison, and audit export jobs.
- Implemented the `system-config` page as a configuration workbench with mock-backed overview metrics, parameter search, parameter enable/disable actions, integration health, runtime switches, environment policies, and config change approval.
- Persisted login state in `localStorage` so refresh no longer forces re-login.
- Removed inactive SSO and DingTalk login buttons from the login page; login now presents only the supported account/password path.
- Reworked registration verification so mock captcha generation, displayed demo code, captcha matching, countdown expiry, and timer cleanup are handled inside `RegisterForm`.
- Removed `task-develop` and `resource-manage` from the data development sidebar menu.
- Completed a full sidebar browser巡检 after the route registry refactor with no fallback pages, console errors, or route misses.
- Deep-linked workbench pages now auto-expand the active sidebar group.
- Dashboard entry no longer expands the data assets sidebar group by default.
- Added an independent `home` route as the default post-login entry, showing a data governance lifecycle architecture page while keeping `dashboard` as the separate workbench.
- Expanded the `home` lifecycle architecture with management standards for each component, including owner role, entry conditions, artifacts, gates, and cross-component collaboration rules.
- Embedded lifecycle management rules directly into the `home` architecture diagram nodes and central governance hub, so entry conditions, artifacts, gates, and cross-component controls are visible in the diagram itself.
- Reworked the `home` architecture diagram into a stable architecture canvas: central governance hub, lifecycle component grid, flow/feedback lines, embedded node rules, and foundation layers now render together without overlap at the default desktop viewport.
- Upgraded the `home` architecture canvas to a React Three Fiber 3D lifecycle scene while keeping readable lifecycle cards, central governance controls, foundation layers, and the detailed management standards table in HTML.
- Simplified the `home` 3D architecture page by removing redundant KPI cards, reducing repeated node cards into a compact lifecycle list, and replacing the heavy standards/detail area with a lean governance control matrix and concise collaboration rules.
- Further simplified the `home` page by removing the lower governance matrix and collaboration rules entirely, leaving one primary 3D architecture canvas plus the lifecycle node navigation. The 3D scene now uses a governance control tower, lifecycle stations, light columns, orbit rings, and animated data particles instead of plain geometric blocks.
- Retuned the `home` 3D scene to match the enterprise dark UI: reduced saturated module colors, replaced playful station geometry with slate/cyan governance modules, aligned right-side node icons to the cyan control-console style, and cleaned remaining mojibake in the page source.
- Added readable governance module names to the `home` architecture canvas and aligned the right-side module list with platform terminology: 数据源、元数据、数据资产、数据标准、数据质量、数据安全、数据开发、数据服务.
- Refactored the `home` 3D architecture implementation from React Three Fiber to native Three.js. React now owns the page layout and module navigation, while Three.js directly manages the scene, camera, renderer, resize handling, animation loop, object disposal, governance core, module blocks, orbit lines, and data particles.
- Reworked the `home` architecture area from a standalone 3D scene into a dark-console governance topology: module nodes, lifecycle flow lines, central control hub, gate labels, metrics, and right-side navigation now share one dense workbench surface.
- Revised the `home` architecture diagram to explicitly express the data lifecycle: access collection, metadata identification, asset cataloging, standard binding, quality validation, security classification, development processing, service consumption, and feedback into governance rules.
- Refactored the `home` page information architecture to reduce empty space and duplicate lifecycle lists: the main area now owns a single lifecycle chain, while the right side shows governance controls, risk items, and lifecycle health instead of repeating the same stages.
- Upgraded the `home` page from a generic governance lifecycle into a big-data development delivery pipeline aligned with the current menu: demand approval, data source registration, batch/stream sync, metadata lineage, asset cataloging, standard mapping, modeling/script development, orchestration/scheduling, quality/security gates, release approval, data service consumption, and operations feedback. Quality, security, standards, approval, and lineage now appear as cross-pipeline controls rather than isolated one-off stages.
- Reframed the `home` page again from a development-delivery pipeline into a full data lifecycle governance overview. The main map now covers planning/intake, source registration, ingestion, metadata lineage, asset cataloging, standards, quality/security, modeling, scheduling, service sharing, consumption operations, and archive/retirement. Development is treated as one lifecycle segment rather than the whole story.
- Cleaned up the `home` lifecycle layout after review: restored maintainable Chinese source text, normalized the lifecycle map to four domains with three stages each, moved the cross-cutting governance controls into a visible control strip inside the main map, and kept the detailed governance panel as a wide-screen companion rather than the only source of control context.
- Removed duplicated right-side lifecycle/governance panels from the `home` page. The homepage now uses one main lifecycle map for `规划准入 -> 治理资产 -> 加工供给 -> 运营闭环`, while the right side focuses on待治理事项、生命周期风险信号和处置建议.
- Moved `home` lifecycle, control, risk signal, and work item data behind an MSW-backed home overview API, and delayed the wide-screen companion panel breakpoint so the lifecycle map keeps readable flow/gate text on 1600px desktop viewports.
- Tuned the `data-modeling` table layout so narrow columns no longer force Chinese headers and dates into vertical wrapping at the default desktop viewport.
- Reworked the script development page into a more IDE-like workspace.
- Changed script creation from coarse `sql/python/shell` to a capability/template model:
  - MySQL SQL
  - PostgreSQL SQL
  - Hive SQL
  - ClickHouse SQL
  - Kafka Consumer
  - Redis Command
  - Elasticsearch DSL
  - Python Task
  - Shell Task
- Made script data source filtering depend on script capability.
- Added explicit `scriptType`, `editorLanguage`, and `dialect` fields for scripts.
- Fixed script tab overflow so active/new tabs scroll into view.
- Added directory tree context menu actions.
- Removed left tree toolbar create buttons; creation now happens through right-click context menus.
- Synced script name edits across editor header, tabs, and left directory tree.
- Adjusted script development left-right layout to match data modeling page more closely.
- Cleaned Chinese mojibake in the script development page.
- Confirmed current project build passes.
- Completed the first data assets remediation pass:
  - Moved `data-catalog` asset rows into MSW via `/api/v1/assets/catalog`.
  - Moved `asset-register` data source, database, table, domain, layer, and tag options into MSW via `/api/v1/assets/register-options`.
  - Fixed visible quote/copy defects in `data-source`.
  - Added feedback or route actions for key data asset export, register, refresh, sync, and detail buttons.
  - Browser-verified `data-source`, `data-catalog`, and `asset-register` with no console errors.
- Continued the data assets visual remediation pass:
  - Replaced remaining visible emoji-style markers in the reviewed data asset pages with Lucide icons where practical.
  - Fixed a `data-catalog` runtime blank screen caused by mixing the old string `icon` prop with the new Lucide `Icon` prop.
  - Fixed a `data-map` cluster label clipping issue by constraining top-domain label placement inside the SVG viewport.
  - Browser-verified `asset-overview`, `asset-register`, `data-catalog`, `data-map`, `data-lineage`, and `data-source` at `1440x1200`.
- Reworked the `asset-overview` page into a clearer governance overview:
  - Added top-level governance insight cards.
  - Clarified time range labels.
  - Replaced hand-written metric SVGs with Lucide icons.
  - Clarified business-domain filter scope.
  - Balanced the lower data-source area with an abnormal-source summary.
  - Removed duplicated abnormal-source presentation and kept one access-governance conclusion.
  - Fixed the growth trend chart spacing by keeping the row visually aligned while letting the chart fill the stretched card height.
  - Polished the growth trend chart with a framed plot area, refined bars, highlighted latest month, trend glow, area fill, and data nodes.
- Added `business-domain` under Data assets as the shared business-domain configuration page:
  - Added MSW-backed business-domain master data APIs for list, options, create, update, and status changes.
  - Made asset overview business-domain distribution derive from the shared business-domain registry.
  - Rewired asset catalog, asset registration options, quality rule filters, standard definition filters, and modeling entry forms to consume the shared business-domain options.
  - Refined the business-domain form so users only maintain master-data fields and governance policies; asset counts, sensitive counts, quality scores, and standard coverage are read-only metrics derived from other modules.
  - Reduced redundancy in the business-domain workbench: the left pane is now only for quick location, the center table is the master-data ledger, lifecycle actions are concentrated in the detail pane, and top summary cards now report configuration health instead of repeating operational metrics.
  - Reworked business-domain hierarchy management into a two-column workbench: the left pane now combines an expandable parent-child domain tree with status, owner, and security-level filters, while the right pane shows the scoped domain ledger and selected-domain governance details. Business-domain child nodes are now represented as real mock master-data records with `parentId` instead of display-only strings.
  - Adjusted the business-domain workbench to the final interaction model: the left pane is now search/filter tooling only, the right pane shows all matching business domains, row click opens a read-only domain detail modal, and create/update parent selection enforces a maximum 5-level hierarchy.
  - Tightened the data-catalog workbench after review: the left filter panel now hides empty business domains and zero-count sources by default, uses denser spacing, and collapses lower-frequency filters; asset search now includes business domain, tags, database, source, layer, and sensitivity; asset detail schema, lineage, and quality tabs now load from MSW-backed asset detail data instead of component-local hardcoded rows.
- Repaired the data asset workbench flow after a full review: data source management now has clean Chinese copy plus mock-backed create/sync/offline actions; asset registration writes registered tables into the mock asset catalog; data lineage field/impact views follow the selected center table; asset map/detail and asset overview CTAs now navigate to catalog, lineage, data source, approval, metadata, or business-domain pages instead of acting as dead buttons.
- Upgraded the data service module from skeleton cards to full MSW-backed workbenches:
  - `metric-manage`: overview cards with domain distribution bar, metric table with type/category/status filters, column sorting, inline publish/deprecate status actions, and a right-side detail panel showing definition, formula, dimensions, tags, usage count, and version.
  - `data-service-api`: overview cards (QPS, SLA, latency, calls), API table with method/status/QPS/latency/error-rate columns, column sorting, online/offline status actions, and a detail panel with runtime metrics grid and operation buttons.
  - `data-sharing`: overview cards (assets, downloads, visits, rating), share asset table with level/type filters, star ratings, column sorting, apply-to-use action, and a detail panel with schema size, update frequency, tags, and star rating display.
  - All three pages' business mock data moved from component-local arrays to `src/mock/data.ts` with MSW handlers in `src/mock/handlers.ts` and service functions in `src/services/api.ts`.
  - Fixed all Chinese mojibake in the previous data-service-api and data-sharing pages (错误'→错误率, 调用'→调用方, 负责人'→负责人, 审核'→审核中, 已申'→已申请, 提供'→提供人, 业务'→业务域, 被引'→引用, 个应'→个应用).
  - Replaced emoji icons with Lucide icons across all three pages.

## Pending

Highest priority:

- Completed: All dense workbench tables now have fixed-column treatment matching `data-modeling` pattern.

Data quality:

- Core quality workbench pages are now implemented: `quality-rules`, `quality-check`, `quality-monitor`, and `quality-report`.
- Decide whether `ops-monitor` should remain under system management or become the concrete implementation of quality monitoring.

Data security:

- Core data security workbench pages are now implemented: `security-level`, `sensitive-scan`, `data-mask`, `access-control`, and `audit-log`.
- Review whether these pages should share a common security module shell or remain independently routed workbenches.

Data development operations:

- Core data development operations pages are now implemented: `task-schedule` and `task-ops`.
- Decide whether task scheduling and task operations should share one implementation with tabs or remain separate pages.

Data services:

- Core data service workbench pages are now implemented: `metric-manage`, `data-service-api`, and `data-sharing`.
- All three use MSW-backed mock data through the standard mock API layer.

System management:

- Core system management workbench pages are now implemented: `user-manage`, `role-manage`, `org-manage`, `notification`, `operation-log`, and `system-config`.

General cleanup:

- Decide whether `src/pages/development/ScriptDev-2.tsx` is a backup to delete or a reference to keep.
- Avoid committing generated `dist/index.html` unless project policy requires it.
- Continue replacing mojibake in untouched files, especially global shell, sidebar, and high-traffic pages.
- Continue replacing remaining emoji-style visual markers outside the reviewed data asset pages with the project's icon system where practical.

## Known Risks

- Many source files still contain mojibake from earlier encoding issues.
- Menu and route definitions are now centralized, but future menu changes must update `src/navigation/registry.tsx` only.
- Placeholder pages prevent silent dashboard fallback, but they are not substitutes for real module workflows.
- The git worktree contains many pre-existing modified files. Do not revert unrelated changes.
- Mock API shape is flexible but not strongly typed, so UI changes can silently diverge from expected contracts.

## Open Decisions

- Should `src/navigation/registry.tsx` also own richer page metadata such as breadcrumbs, module ownership, and placeholder copy for future incomplete pages?
- Should data security start as an aggregate page before splitting into all subpages?
- Should quality rules/check/monitor/report share one module shell with tabs?
- Should task scheduling and task operations share one module shell with tabs?
- Should root-level temporary fix scripts be removed after confirming they are no longer needed?

## Validation Rules

After frontend changes, run:

```powershell
npx.cmd vite build --emptyOutDir=false
```

When layout or interaction changes are made, also verify in the browser at:

```text
http://127.0.0.1:5174/
```

Check for:

- Console errors
- Horizontal overflow
- Broken Chinese copy
- Menus falling back to dashboard unintentionally

## Update Protocol

Codex should update this file when:

- A feature area is completed or materially changed.
- A product or architecture decision is made.
- A menu item is added, removed, renamed, or remapped.
- A known issue is discovered or resolved.

Keep updates concise. Do not turn this file into a detailed changelog; use it as a high-signal project memory.
