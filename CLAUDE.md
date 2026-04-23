# Larsen Cyber GRC Wizard — Project Context

## What This Is

A free, browser-based GRC program management tool built on NIST SP 800-53 Rev. 5. Built by Jacob Larsen as a personal portfolio project. Published open-source on GitHub Pages under MIT license. No monetization — this is a skill showcase.

Live URL: `https://jacobolstadlarsen.github.io/larsen-cyber-grc-wizard/`

## Branding Rules

- The public name of the tool is **Larsen Cyber GRC Wizard**
- NEVER reference KPMG, Jacob's employer, or any employer anywhere in the tool, docs, or comments
- No prior branding (including the earlier working name) should appear in any new code, docs, or comments. The only permitted mentions are inside the one-time localStorage migration shim, where the literal legacy key strings are required to read the old data.
- The About section says "experienced cyber GRC advisor" — keep it generic
- The demo company is **XMPL Co.** (previously "Acme")
- As of 2026-04-22, `index.html` has been rebranded: `<title>`, `<meta description>`, the sidebar `.brand` ("LARSEN"), and the footer "© Larsen Cyber GRC Wizard" are all clean. The earlier NULL-byte padding on `index.html` has also been stripped (real file is ~30 KB, 573 lines).

## Architecture

Zero-dependency, no-build, no-server web application. All logic runs client-side; data lives in `localStorage`. Primary dev is now happening in Cursor; this file is written so Claude (or any LLM) can make targeted edits when called on.

### File Structure

```
index.html                — UI shell, sidebar, and tab containers (~573 lines)
css/app.css               — all styles (~1,325 lines; one @media (max-width:900px) breakpoint, nothing for tablets yet)
js/app.js                 — ALL application logic (~13,100 lines, ~386 top-level functions)
js/nist-control-text.js   — verbatim NIST 800-53 control requirement text lookup (~1,006 lines)
README.md                 — public GitHub README (also covers the operator smoke-test runbook)
CONTROL_OWNER_SPEC.md     — combined compliance + UX specification for the Control Owner flow
NOTEBOOKLM_IMPLEMENTATION_PLAN.md — prioritized backlog from the 2026-04 NotebookLM review
```

### Deployment

GitHub Pages serves `index.html` + `css/app.css` + `js/app.js` + `js/nist-control-text.js`. No build step. Push to `main` and Pages redeploys. No bundler, no transpilation — everything that ships is what's in the repo.

### Vanilla JS Conventions

- Plain `function` declarations at top level, attached to the global scope. No modules, no classes, no React/Angular/Vue.
- DOM rendering is `innerHTML = ...` into static containers declared in `index.html`. Tabs are `.tab-panel` divs with `id="tab-<name>"`; wizard steps are `.wizard-step` divs with `id="<tab>-step-<n>"` and body containers with `id="<tab>-step-<n>-body"`.
- Event wiring is inline `onclick="foo()"` in generated HTML. Any string argument you embed in an `onclick` MUST escape quotes (use the existing `escKey`/`escapeHTML` helpers) — one unescaped quote has historically broken all JavaScript parsing.
- When an event handler triggers a re-render, wrap it in `setTimeout(fn, 0)` so the browser doesn't destroy the element mid-event.

## State Management

All application state lives in a single `state` object at `js/app.js` line ~1032. Its shape is the source of truth; `STATE_DEFAULTS` (a deep clone captured immediately after declaration) drives `resetStateToDefaults()` and import normalization.

### Key state properties (current)

Program/CISO identity
- `baseline` — `'L'`, `'M'`, or `'H'` (Low/Moderate/High NIST baseline)
- `privacyOverlay` — boolean, includes Privacy (P) controls when true
- `orgName`, `programOwner`, `programOwnerTitle`, `programOwnerEmail`
- `cisoIsISSM` — CISO also wears ISSM hat (common in small orgs)
- `pmControls`, `cisoComplete`, `infoSecPolicy`

Policies
- `domainOwners` — `{ 'AC': { name, email, role }, ... }`
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
- `_ctrlEvidenceFilter` — UI filter on evidence panel

Assets / SSP
- `assets`, `processes`
- `sspAttestations`, `sspSignoffs`
- `customAssetTypes`, `customAssetTypeGroups`, `customAssetTypeHeaders`, `assetTypeRequests`
- `assetMappings` — `{ 'AC-1': ['asset-1', ...] }`

Users / auth
- `users` — `[{ id, name, email, role, families[], controls[], note }]`
- `currentUserId` — `null` = admin mode; string id = signed-in user
- Role → tabs mapping: `ROLE_TABS` at line ~12388. Roles: `ciso`, `issm`, `control-owner`, `asset-owner`, `custodian`, `approver`.

POA&M / accountability
- `poamItems` — findings tracker
- `auditTrail` — `[{ t, cat, ref, msg }]`, semantic event log (NOT field-level change log). Capped at 800 entries. Written via `addAuditEntry(cat, refId, msg)` — currently called from ~25 sites.

UI-only flags (transient)
- `_policyDomain`, `_policyWizardMode`, `_policyDocView`, `_policyLibraryMode`, `_policyOwnerFilter`
- `_controlLibraryMode`, `_controlLibrary{Family,Status,AssetType,Search}Filter`
- `_assetLibraryMode`, `_assetTypeLibraryMode`

### Persistence Helpers

`markDirty()` and `_updateSaveIndicator(saved)` live at `js/app.js` lines ~1295–1320. Auto-save is 3-second debounced: every edit calls `markDirty()` which schedules `saveToStorage()`. Earlier versions broke when these helpers were missing — 79+ callers ReferenceError-ed silently. **Keep them defined.**

### localStorage Keys

Current keys (as of 2026-04-23):

- `larsen-grc-v1` — main application state
- `larsen-grc-snapshots` — saved program snapshots
- `larsen-grc-v1-ts` — last-saved timestamp

A one-time migration shim runs at script parse time (see `migrateLegacyStorageKeys()` just below the `STORAGE_KEY` declaration). If a user still has data under the legacy `hawthorn-grc-v1` / `hawthorn-grc-snapshots` / `hawthorn-grc-v1-ts` keys, the shim copies it to the `larsen-*` keys and removes the originals. Leave the migration in place for at least one release cycle, then it can be deleted.

### Built-in Demo Snapshots

Defined near `js/app.js` line ~12970. Two XMPL Inc. snapshots at increasing maturity:

1. `XMPL_SNAPSHOT` — Program setup level (baseline, CISO, PM controls, ISP drafted, users roster seeded)
2. `XMPL_DOMAIN_SNAPSHOT` — Domain policies complete (owners, merges, control assignments)

When rebuilding snapshots, every key in the live `state` object should have a corresponding entry — missing keys cause silent failures.

## App Workflow

### Sidebar Navigation (from `index.html`)

- **Program overview** → Program setup (CISO wizard)
- **Workspaces** → Domain policies · Control implementation · Assets & SSP · Control testing
- **Libraries** → Policy library · Control library · Asset library · Asset type library
- **Reporting** → Reports & Dashboard
- **Administration** → Users & roles

Top-right toolbar provides: Save indicator, Save now, Export JSON, Import JSON, Snapshots, Reset.
Top-left of sidebar has the profile/role picker (`🔑 Admin` button → `showRolePicker()`).

### CISO Setup Wizard (5 steps)

1. **Select Baseline** — org name, CISO info, NIST baseline (L/M/H), privacy overlay toggle
2. **PM Controls** — select which Program Management controls apply (PM-18–PM-27 auto-selected when privacy overlay is on)
3. **InfoSec Policy** — build the org-level ISP: sections, requirements, review cycle, approver
4. **Consolidate** — review and prioritize domain policies, suggest merges (e.g., PS+AT, CP+IR, MP+PE, SR+SA)
5. **Assign Owners** — assign the 20 NIST control families to domain policy owners, set priorities and deadlines

**Phantom-owner behavior (flagged as a compliance risk):** `prefillFakeOwners()` at ~line 4070 and `prefillFakeControlOwners(fam)` at ~line 4100 inject fake identities ("Alex Rivera", "Jordan Patel", etc.) to unblock wizard progression. These bypass validation and produce non-repudiation-violating attestations. Demo-only path; do not allow fake identities to leak into a finalized program.

### Role-Based Workspaces

- **Domain Policies** (Policy Owner) — 4 steps: Review & Custodian → Control Selection → Policy Content → Control Owners → submit for CISO approval
- **Control Implementation** (Control Owner) — 4 steps: My Controls → Design Controls → Asset Requirements → Review & Submit
- **Assets & SSP** (Asset Owner) — 3 steps: Asset Inventory → Control Mapping → Attestation
- **Control Testing** (Tester) — 4 steps: Testing Scope → Test Procedures → Test Results → Findings
- **Reports & Dashboard** — program health, compliance posture, per-user dashboards, audit trail panel, review queue panel
- **Users & roles** — user registry and role assignment

### Library Views

Each library is a read-mostly catalog rendered inside an existing tab panel. They're toggled by a `_xxxLibraryMode` flag on state. `goToPolicyLibrary()`, `goToControlLibrary()`, `goToAssetLibrary()`, `goToAssetTypeLibrary()` are the entry points. Asset type changes can be submitted as requests and reviewed (`assetTypeRequests`).

## NIST 800-53 Data

- `FAMILIES` (line ~5): 20 family codes → full names
- `CONTROLS` (line ~21): array of controls with `id`, `f` (family), `n` (name), `bl` (baselines — subset of `['L','M','H','P']`)
- `BASELINE_COUNTS` (line ~1342): expected control counts per baseline for validation
- `DOMAIN_SUGGESTED_ROLES` (line ~3509): per-family suggested job title (IAM Lead, GRC Lead, etc.)
- `js/nist-control-text.js`: verbatim NIST requirement text for all baselined controls; missing controls fall back to the short name

## Known Patterns & Gotchas

### DOM Re-rendering
Rendering uses `innerHTML` replacement. When an event handler triggers a re-render (checkbox `onchange` → `renderCISOStep3()`), wrap the re-render in `setTimeout(..., 0)` so the browser doesn't destroy the element mid-event. This was a real bug that broke the ISP custom approver checkbox.

### Unescaped Quotes in onclick Handlers
Any `onclick` that embeds string arguments must escape quotes. A single unescaped quote once broke ALL JavaScript parsing. Use `escapeHTML()` / the `escKey` pattern and validate with `node --check js/app.js` before shipping.

### Policy Merges
When families are merged (e.g., PS merged under AT), the merged family's description should include both families' content with an `XX:` prefix. The merge target's domain owner manages both.

### Privacy Overlay
When `privacyOverlay` is true, the ISP auto-injects tiered privacy requirements (IS-REQ-5 through IS-REQ-10) and Step 2 auto-selects appropriate PM controls with purple PRIVACY badges.

### Reset Function
`resetApp()` (line ~1787) calls `resetStateToDefaults()`, which copies `STATE_DEFAULTS` back into `state` for every allowed key. **New state keys added to the `state` literal are automatically picked up** — you do not need to modify `resetApp`. But you must add the new key to the initial `state` declaration at line ~1032 so `STATE_DEFAULTS` captures a sane default.

### Audit Trail (semantic, not field-level)
`addAuditEntry(category, refId, message)` at line ~1173 pushes `{t, cat, ref, msg}` onto `state.auditTrail`. It is called at policy/control state transitions, merges, submissions, returns, asset-type changes, etc. The NotebookLM review called out a need for a richer *field-level* change log (fieldName, oldValue, newValue, userId, timestamp); the existing audit trail does not cover field-level edits like typing into the ISP or renaming a role.

### Save Debounce & Tab-Close Risk
`markDirty()` schedules `saveToStorage()` 3 seconds after the last edit. If the tab closes inside that 3-second window, work is lost. There is no `beforeunload` handler — this is a known gap.

### Snapshot Restore
`loadSnapshotByIndex` / `loadSnapshotByData` replace `state` wholesale with no diff preview and no pre-restore backup. Safe only if the user has an in-hand export.

### Import JSON Validation
`importProgramFromFile` (line ~1253) parses JSON and checks only `typeof === 'object'`. It does not validate the schema. Malformed imports that parse as objects but have the wrong shape will corrupt running state.

## Validation Before Shipping

1. `node --check js/app.js` — syntax validation
2. Parse all `XMPL_*_SNAPSHOT.data` fields as valid JSON
3. Confirm `localStorage` keys are `larsen-grc-v1` and `larsen-grc-snapshots`, and that the legacy-key migration runs once and cleans up
4. "Snapshots" modal → load each XMPL snapshot, then Reset and confirm no ghost state
5. Sidebar badges and counts update correctly after state changes
6. Role-picker: sign in as each role, confirm only the intended tabs are visible

## Work Style

- Execute autonomously — don't ask permission for fixes, just do them
- One clear recommendation, at most one alternative
- No KPMG references anywhere, ever
- Primary dev is happening in Cursor; Claude is called for targeted edits and research

## Reference Documents

- `CONTROL_OWNER_SPEC.md` — combined compliance + UX specification for the Control Owner wizard (NIST SP 800-53A alignment, status taxonomy, data schema, attestation workflow, and UX patterns)
- `NOTEBOOKLM_IMPLEMENTATION_PLAN.md` — prioritized task list from the 2026-04 NotebookLM review (phantom owners, field-level change log, snapshot safety, etc.)
- `README.md` — public project overview and operator smoke-test runbook

Legacy audit artifacts (`missing-controls.js`, `nist-controls-audit.xlsx`, `acme_grc_state.json`) and one-off repair scripts (`repair.js`, `fix_encoding.js`) remain in the tree for historical reference only.
