# EightFiftyThree GRC — Project Context

## What This Is

A free, browser-based GRC program management tool built on NIST SP 800-53 Rev. 5. Built by Jacob Larsen as a personal portfolio project. Published open-source on GitHub Pages under MIT license. No monetization — this is a skill showcase.

Live URL: `https://eightfiftythreegrc.github.io/eightfiftythree-grc/` (org repo **EightFiftyThreeGRC/eightfiftythree-grc**; Pages must use **GitHub Actions** with `.github/workflows/deploy-pages.yml`, or classic “Deploy from branch” `main` / `/`).

Repository source: this workspace/repo is the primary source intended for public GitHub upload.

## Branding Rules

- The public name of the tool is **EightFiftyThree GRC**
- NEVER reference KPMG, Jacob's employer, or any employer anywhere in the tool, docs, or comments
- No prior branding (Larsen Cyber GRC Wizard, Hawthorn, or any earlier working name) should appear in any new code, docs, or comments. The only permitted mentions are inside the one-time localStorage migration shim, where the literal legacy key strings are required to read the old data.
- The About section says "experienced cyber GRC advisor" — keep it generic
- The demo company is **XMPL Co.** (previously "Acme")
- As of 2026-04-27, `index.html` has been rebranded to EightFiftyThree GRC: `<title>`, `<meta description>`, the sidebar `.brand` ("EightFiftyThree"), and the footer "© EightFiftyThree GRC" are all clean.

## Architecture

Zero-dependency, no-build static web application. UI and logic run client-side; the canonical program lives in Supabase (`programs.state` JSONB). Each signed-in browser mirrors state to `localStorage` as an offline cache. Primary dev is in Cursor; this file is written so Claude (or any LLM) can make targeted edits when called on.

### File Structure

The original monolithic `js/app.js` was refactored in commit `c08deff` (2026-04-23) into per-domain modules. They are loaded in dependency order from `index.html`. Globals only — no modules, no bundler, no transpilation.

```
app.html                    — UI shell, sidebar, tab containers, cloud sign-in gate
js/cloud-config.js          — Supabase connection settings
js/cloud-auth.js            — Sign-in, program load/sync, account menu
css/app.css                 — all styles (one @media (max-width:900px) breakpoint)
js/nist-control-text.js     — verbatim NIST 800-53 control requirement text lookup
js/core.js                  — STATE shape, STATE_DEFAULTS, ROLE_TABS, persistence
                              (saveToStorage / loadFromStorage / markDirty /
                              importProgramFromFile / validateProgramShape /
                              applyLoadedState / addAuditEntry / logFieldChange /
                              getDemoPlaceholderNames / blockActionIfDemoPlaceholders)
js/program.js               — CISO setup wizard (5 steps); prefillDemoOwners;
                              prefillDemoControlOwners; sidebar badges
js/policies.js              — Domain Policies wizard (4 steps) + policy library
js/controls.js              — Control Implementation wizard (4 steps) + control library
js/assets.js                — Assets & SSP wizard (4 steps) + asset/asset-type libraries;
                              SSP submission (NOT formal authorization)
js/baseline-elevation.js    — Baseline elevation triggers and review flow
js/testing.js               — INTENTIONALLY EMPTY (Control Assessment workspace
                              was removed 2026-04-27; the file is kept as a stub
                              so legacy snapshot/export references don't 404)
js/authorization.js         — AO decision data + helpers + the openAtoDecisionModal
                              modal launched from the Reports dashboard. Owns
                              atoEnsureState, atoCanDecide, submitAtoDecisionFromModal,
                              renderAuthorizationStatusPanelHtml.
js/reports.js               — Reports & Dashboard, audit/change-log views, review queues
                              (composes renderAuthorizationStatusPanelHtml into the
                              dashboard so AOs can record decisions inline)
js/admin.js                 — Users & roles tab, profile / account menu (openProfileMenu,
                              applyRoleView for cloud identity mapping)
js/app.js                   — App shell only: TAB_IDS, currentStep, showTab, goToStep,
                              snapshot modal, beforeunload handler, DOMContentLoaded
README.md                   — public GitHub README + operator smoke-test runbook
CONTROL_OWNER_SPEC.md       — compliance + UX spec for the Control Owner flow
NOTEBOOKLM_IMPLEMENTATION_PLAN.md — prioritized backlog from the 2026-04 review
```

When adding a function, place it in the file that owns the corresponding domain. Cross-file calls happen via globals; call sites should defensively `typeof fn === 'function'` when calling helpers from a downstream module.

### Deployment

GitHub Pages serves `index.html` + `css/app.css` + every `js/*.js`. No build step. Push to `main` and Pages redeploys.

### Vanilla JS Conventions

- Plain `function` declarations at top level, attached to the global scope. No modules, no classes, no React/Angular/Vue.
- DOM rendering is `innerHTML = ...` into static containers declared in `index.html`. Tabs are `.tab-panel` divs with `id="tab-<name>"`; wizard steps are `.wizard-step` divs with `id="<tab>-step-<n>"` and body containers with `id="<tab>-step-<n>-body"`.
- Event wiring is inline `onclick="foo()"` in generated HTML. Any string argument you embed in an `onclick` MUST escape quotes (use the existing `escKey`/`escapeHTML` helpers) — one unescaped quote has historically broken all JavaScript parsing.
- When an event handler triggers a re-render, wrap it in `setTimeout(fn, 0)` so the browser doesn't destroy the element mid-event.

## State Management

All application state lives in a single `state` object in `js/core.js` (around line ~1100). Its shape is the source of truth; `STATE_DEFAULTS` (a deep clone captured immediately after declaration) drives `resetStateToDefaults()` and import normalization.

### Key state properties (current)

Program/CISO identity
- `baseline` — `'L'`, `'M'`, or `'H'` (Low/Moderate/High NIST baseline)
- `privacyOverlay` — boolean, includes Privacy (P) controls when true
- `orgName`, `programOwner`, `programOwnerTitle`, `programOwnerEmail`
- `cisoIsISSM` — CISO also wears ISSM hat (common in small orgs)
- `pmControls`, `cisoComplete`, `infoSecPolicy`

Policies
- `domainOwners` — `{ 'AC': { name, email, role, isDemoPlaceholder? }, ... }`
- `policyDeadlines`, `policyStatus`, `policyPriorities`, `domainDeadlines`
- `policyMerges` — `{ 'IA': 'AC' }` means IA is merged under AC's owner card
- `domainCustomNames` — display names for merged domains
- `policySelectedControls` — `{ 'AC': ['AC-1', ...] }`
- `domainPolicies` — full policy content per family
- `policyCustodians`, `policyVersions`, `policyAcknowledgments`, `policyReviewCycle`
- `infoSecPolicySuggestions`, `infoSecPolicyReviewDraft` — annual review workflow

Controls
- `controlOwners`, `controlStatus`, `controlDeadlines`, `controlWorkflowState`
- `controlReviewQueue`, `controlEvidence`, `controlTestResults`, `testAdequacy`
- `controlDesignSubmission` — last submission record `{ submittedAt, submitterName, designedCount, totalCount, notes }`
- `_ctrlEvidenceFilter` — UI filter on evidence panel

Assets / SSP
- `assets`, `processes`
- `sspAttestations`, `sspSignoffs`, `sspInterconnections` — keyed by scope id (asset or process)
- `customAssetTypes`, `customAssetTypeGroups`, `customAssetTypeHeaders`, `assetTypeRequests`
- `removedBuiltInAssetTypeKeys`, `removedBuiltInAssetTypeGroups` — built-ins the user has removed (persisted)
- `assetMappings` — `{ 'AC-1': ['asset-1', ...] }`

Assessment & Authorization
- `authBoundaries` — `[{ id, name, assetIds[], assetTypes[], processIds[], aoUserId, atoStatus, ... }]`
- `assessmentPlans` — `{ [boundaryId]: { inScopeControlIds[], controlPlans, sarFinalizedAt? } }`
- `atoDecisions` — `{ [boundaryId]: { decision, conditions[], expiresAt, residualRiskNarrative, signature, ... } }`
- `_atoLibraryFilter` — UI filter object for the AO/authorization library views

Users / auth
- `users` — `[{ id, name, email, role, families[], controls[], note, isDemoPlaceholder? }]`
- `currentUserId` — `null` = admin mode; string id = signed-in user
- Role → tabs mapping: `ROLE_TABS` in `js/core.js` (~line 1075). Roles: `ciso`, `issm`, `control-owner`, `asset-owner`, `custodian`, `assessor`, `ao`, `approver`. As of 2026-04-27 the dedicated Control Assessment (`tester`) and Authorization (`ato`) tabs were removed. `ao` now sees `asset` + `reports` + `users`; `assessor` sees only `reports`. AO decisions are recorded via `openAtoDecisionModal()` which is launched from the Authorization status panel on the Reports dashboard.

POA&M / accountability
- `poamItems` — findings tracker
- `auditTrail` — `[{ t, cat, ref, msg }]`, semantic event log. Capped at 800 entries. Written via `addAuditEntry(cat, refId, msg)`.
- `changeLog` — `[{ t, u, p, o, n }]` field-level change log written by `logFieldChange(path, oldVal, newVal)`. Capped at 2000 entries. Use this when typing into ISP fields, renaming roles, editing attestation text — anything where the audit trail's coarse "submitted/approved" categories are insufficient.

UI-only flags (transient)
- `_policyDomain`, `_policyWizardMode`, `_policyDocView`, `_policyLibraryMode`, `_policyOwnerFilter`
- `_controlLibraryMode`, `_controlLibrary{Family,Status,AssetType,Search}Filter`, `_controlLibraryColFilters`
- `_assetLibraryMode`, `_assetTypeLibraryMode`, `_sspReviewerReadOnly`, `_sspReadOnlyExitTab`
- `_atoLibraryFilter`
- `_selectedAssetId`, `_selectedProcessId`, `_selectedCtrl` — wizard selections
- `_auditTrailUiMode`, `_auditTrailEventCatFilter`, `_changeLogUserFilter`, `_changeLogDateFilter`
- `_reportsProgramReadinessHidden`, `_reportsMySummaryHidden`, `_reportsPhase1BannerHidden`, `_reportsMyView`

### Persistence Helpers

`markDirty()` and `_updateSaveIndicator(saved)` live in `js/core.js`. Auto-save is debounced (~400ms) and a `beforeunload` handler in `js/app.js` flushes any pending save and warns if `window.isDirty` is still true. Earlier versions broke when these helpers were missing — 79+ callers ReferenceError-ed silently. **Keep them defined.**

### localStorage Keys

Current keys (as of 2026-04-27):

- `eightfiftythree-grc-v1` — main application state
- `eightfiftythree-grc-snapshots` — saved program snapshots
- `eightfiftythree-grc-v1-ts` — last-saved timestamp

A one-time migration shim runs at script parse time (see `migrateLegacyStorageKeys()` just below the `STORAGE_KEY` declaration). It iterates two legacy prefixes — `larsen-grc` (interim brand) and `hawthorn-grc` (original brand) — and for each, copies any prior state/timestamp/snapshots into the `eightfiftythree-*` keys and removes the originals. Leave the migration in place for at least one release cycle, then it can be deleted.

### Built-in Demo Snapshots

Defined near the bottom of `js/program.js`. XMPL Inc. snapshots at increasing maturity:

1. `XMPL_SNAPSHOT` — Program setup level (baseline, CISO, PM controls, ISP drafted, users roster seeded)
2. `XMPL_DOMAIN_SNAPSHOT` — Domain policies complete (owners, merges, control assignments)

When rebuilding snapshots, every key in the live `state` object should have a corresponding entry — missing keys cause silent failures.

## App Workflow

### Sidebar Navigation (from `index.html`)

- **Program overview** → Program setup (CISO wizard)
- **Workspaces** → Domain policies · Control implementation · Assets & SSP
- **Libraries** → Policy library · Control library · Asset library · Asset type library
- **Reporting** → Reports & Dashboard (also hosts the Authorization status panel + AO decision modal)
- **Administration** → Users & roles

Top-right toolbar provides: Save indicator, Save now, Export JSON, Import JSON, Snapshots, Reset.
Top-left of sidebar has the account button (`openProfileMenu()` → cloud sign-in gate or account menu with sign-out).

### CISO Setup Wizard (5 steps)

1. **Select Baseline** — org name, CISO info, NIST baseline (L/M/H), privacy overlay toggle
2. **PM Controls** — select which Program Management controls apply (PM-18–PM-27 auto-selected when privacy overlay is on)
3. **InfoSec Policy** — build the org-level ISP: sections, requirements, review cycle, approver
4. **Consolidate** — review and prioritize domain policies, suggest merges (e.g., PS+AT, CP+IR, MP+PE, SR+SA)
5. **Assign Owners** — assign the 20 NIST control families to domain policy owners, set priorities and deadlines

**Phantom-owner safety net:** `prefillDemoOwners()` and `prefillDemoControlOwners(fam)` (in `js/program.js`) inject synthetic identities ("Alex Rivera", "Jordan Patel", etc.) for demos. Each entry point is now confirmation-gated, every demo record is tagged with `isDemoPlaceholder: true`, and `blockActionIfDemoPlaceholders()` (called from `cisoFinish`, `submitSSP`, `submitControlDesign`, policy submit, `submitAtoDecision`, `finalizeSarAndHandoff`) refuses to advance until placeholders are replaced. The legacy `prefillFakeOwners` / `prefillFakeControlOwners` names remain as `@deprecated` thin wrappers — do not call them in new code.

### Role-Based Workspaces

- **Domain Policies** (Policy Owner) — 4 steps: Review & Custodian → Control Selection → Policy Content → Control Owners → submit for CISO approval
- **Control Implementation** (Control Owner) — 4 steps: My Controls → Design Controls → Asset Requirements → Review & Submit
- **Assets & SSP** (Asset Owner) — 4 steps: Asset Inventory → Attestations → Interconnections → Review & Sign-Off. Submitting the SSP records an "SSP Reviewer" (NOT the formal AO decision).
- **Authorization (AO Decision)** — no longer a workspace. AOs open the AO Decision modal (`openAtoDecisionModal(boundaryId)`) from the **Authorization status** panel on the Reports dashboard. Modal collects decision (ATO / IATT / Denial), conditions, expiry, residual-risk narrative, and digital signature; persists to `state.atoDecisions[boundaryId]`. Gated by `atoCanDecide(boundary)`. The earlier 4-step Control Assessment wizard and the dedicated Authorization tab were removed 2026-04-27 — the underlying state (`authBoundaries`, `assessmentPlans`, `atoDecisions`) is preserved so existing programs keep their data.
- **Reports & Dashboard** — program health, compliance posture, per-user dashboards, audit trail panel, review queue panel, **Authorization status** panel (per-boundary ATO state + Record decision button)
- **Users & roles** — user registry and role assignment

### Library Views

Each library is a read-mostly catalog rendered inside an existing tab panel. They're toggled by a `_xxxLibraryMode` flag on state. `goToPolicyLibrary()`, `goToControlLibrary()`, `goToAssetLibrary()`, `goToAssetTypeLibrary()` are the entry points. Asset type changes can be submitted as requests and reviewed (`assetTypeRequests`).

## NIST 800-53 Data

- `FAMILIES` (top of `js/core.js`): 20 family codes → full names
- `CONTROLS` (top of `js/core.js`): array of controls with `id`, `f` (family), `n` (name), `bl` (baselines — subset of `['L','M','H','P']`)
- `BASELINE_COUNTS` (in `js/core.js`): expected control counts per baseline for validation
- `DOMAIN_SUGGESTED_ROLES` (in `js/core.js`): per-family suggested job title (IAM Lead, GRC Lead, etc.)
- `js/nist-control-text.js`: verbatim NIST requirement text for all baselined controls; missing controls fall back to the short name

## Known Patterns & Gotchas

### DOM Re-rendering
Rendering uses `innerHTML` replacement. When an event handler triggers a re-render (checkbox `onchange` → `renderCISOStep3()`), wrap the re-render in `setTimeout(..., 0)` so the browser doesn't destroy the element mid-event.

### Unescaped Quotes in onclick Handlers
Any `onclick` that embeds string arguments must escape quotes. A single unescaped quote once broke ALL JavaScript parsing. Use `escapeHTML()` / the `escKey` pattern and validate with `node --check js/<file>.js` before shipping.

### Policy Merges
When families are merged (e.g., PS merged under AT), the merged family's description should include both families' content with an `XX:` prefix. The merge target's domain owner manages both.

### Privacy Overlay
When `privacyOverlay` is true, the ISP auto-injects tiered privacy requirements (IS-REQ-5 through IS-REQ-10) and Step 2 auto-selects appropriate PM controls with purple PRIVACY badges.

### Reset Function
`resetApp()` calls `resetStateToDefaults()`, which copies `STATE_DEFAULTS` back into `state` for every allowed key. **New state keys added to the `state` literal are automatically picked up.** But you must add the new key to the initial `state` declaration in `js/core.js` so `STATE_DEFAULTS` captures a sane default.

### Audit Trail vs. Change Log
- `addAuditEntry(category, refId, message)` writes a coarse semantic event (policy submitted, control approved, AO decision recorded). Capped at 800.
- `logFieldChange(path, oldValue, newValue)` writes a fine-grained field-level row. Capped at 2000. Wire this into `oninput` / `onchange` handlers wherever a user can edit a free-text or selection field that should be auditable (ISP body, role rename, attestation text, etc.).

### Save Debounce
`markDirty()` schedules `saveToStorage()` after a short debounce (currently ~400ms). The `beforeunload` handler in `js/app.js` flushes any pending save and warns if state is still dirty.

### Snapshot Restore
`loadSnapshotByIndex` / `loadSnapshotByData` route through `openSnapshotRestoreConfirm`, which auto-snapshots the current program as `Auto-backup before restore <ts>` (kept by `pruneAutoRestoreSnapshots`), shows a counts diff, and requires an explicit acknowledgement checkbox before applying.

### Import JSON Validation
`importProgramFromFile` (in `js/core.js`) calls `validateProgramShape(saved)` first — rejects unknown root types, type-mismatched fields, and bad `baseline` values. On success it auto-snapshots before applying.

## Validation Before Shipping

1. `node --check js/<each file>.js` — syntax validation. Note: this repo lives on OneDrive; bash mounts may serve a stale copy, so re-check from the Windows side or wait for sync if syntax errors appear suspicious.
2. Parse all `XMPL_*_SNAPSHOT.data` fields as valid JSON
3. Confirm `localStorage` keys are `eightfiftythree-grc-v1` and `eightfiftythree-grc-snapshots`, and that the legacy-key migration runs once and cleans up both `larsen-grc-*` and `hawthorn-grc-*` prefixes
4. "Snapshots" modal → load each XMPL snapshot, then Reset and confirm no ghost state
5. Sidebar badges and counts update correctly after state changes
6. Role-picker: sign in as each role, confirm only the intended tabs are visible (assessor sees `reports` only; AO sees `asset` + `reports` + `users`; the AO sees an "Authorization status" panel on the dashboard with a Record decision button per boundary)
7. Demo placeholder gating: prefill demo owners, then attempt to finalize → must be blocked with a toast naming the demo identities

## Work Style

- Execute autonomously — don't ask permission for fixes, just do them
- One clear recommendation, at most one alternative
- No KPMG references anywhere, ever
- Primary dev is happening in Cursor; Claude is called for targeted edits and research

## Public Upload Hygiene

- Keep root docs concise and public-facing (`README.md`, `CLAUDE.md`, `CONTROL_OWNER_SPEC.md`)
- Avoid committing one-off prompt files or stale planning artifacts in repo root
- Before publish, run syntax checks and a naming pass for branding consistency

## Reference Documents

- `CONTROL_OWNER_SPEC.md` — combined compliance + UX specification for the Control Owner wizard (NIST SP 800-53A alignment, status taxonomy, data schema, attestation workflow, and UX patterns)
- `README.md` — public project overview and operator smoke-test runbook

Legacy audit artifacts (`missing-controls.js`, `nist-controls-audit.xlsx`, `acme_grc_state.json`) and one-off repair scripts (`repair.js`, `fix_encoding.js`) remain in the tree for historical reference only.

Local helper scripts used during the 2026-04 monolith-to-module refactor are kept under `tools/` (`extract-app-modules-4-8.mjs`, `step1-extract-core.mjs`, etc.). They are not part of the runtime and are not loaded by `index.html`.
