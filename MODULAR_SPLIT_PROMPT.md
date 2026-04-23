# Cursor Prompt — Split `js/app.js` into modular files

Paste everything below the `---` into Cursor's agent chat. Read `CLAUDE.md` first yourself so you have context on what the tool is.

---

# Task: Refactor `js/app.js` into 8 smaller files

## Context

Read `CLAUDE.md` in full before doing anything else. It describes the architecture, conventions, state shape, and validation requirements for this project.

Short version: this is a zero-dependency, no-build, vanilla-JS GRC tool deployed on GitHub Pages. All application logic currently lives in a single ~13,100-line `js/app.js` with ~386 top-level functions. I want to split it into smaller files while preserving every behavior exactly.

## Goal

Break `js/app.js` into the files listed below. Load them in order via plain `<script>` tags in `index.html`. All functions remain on the global scope (no ES modules, no bundler, no transpilation). Every existing inline `onclick="foo()"` handler must continue to work unchanged.

## Non-goals

- No behavior changes. No refactoring of logic. No renames. No "while I'm here" cleanups.
- No switch to ES modules, classes, React, build tooling, or IndexedDB.
- No changes to `localStorage` keys, state shape, or `STATE_DEFAULTS`.
- No touching `js/nist-control-text.js`.

## Target file layout

```
js/
  core.js              — foundation (load first)
  program.js           — CISO setup wizard + ISP
  policies.js          — domain policies + policy library
  controls.js          — control implementation + control library
  assets.js            — asset inventory, SSP, asset & asset-type libraries
  testing.js           — control testing + POA&M
  reports.js           — dashboard, audit trail panel, review queue panel
  admin.js             — users & roles, role picker, snapshots UI
  nist-control-text.js — UNCHANGED
```

### What goes in each file

**`core.js` (load first, everything else depends on it)**
- Constants: `FAMILIES`, `CONTROLS`, `BASELINE_COUNTS`, `DOMAIN_SUGGESTED_ROLES`, `ROLE_TABS`
- The `state` literal declaration, `STATE_DEFAULTS` capture, `resetStateToDefaults`, `resetApp`
- Persistence: `STORAGE_KEY`, `migrateLegacyStorageKeys`, `saveToStorage`, `loadFromStorage`, `markDirty`, `_updateSaveIndicator`, `exportProgramToFile`, `importProgramFromFile`
- Audit: `addAuditEntry`
- Utilities used across workspaces: `escapeHTML`, `escKey`, any other string/DOM helpers, date formatters, ID generators
- Snapshot plumbing used by multiple workspaces (not the snapshots modal UI itself — that's `admin.js`)
- The built-in demo snapshots: `XMPL_SNAPSHOT`, `XMPL_DOMAIN_SNAPSHOT` (and any third one currently defined)

**`program.js`**
- CISO setup wizard steps 1–5 (`renderCISOStep1` … `renderCISOStep5` and helpers)
- InfoSec Policy builder and annual review workflow (`infoSecPolicyReviewDraft`, suggestions handling)
- `prefillFakeOwners`, `prefillFakeControlOwners` (keep as-is — flagged in CLAUDE.md but out of scope for this refactor)

**`policies.js`**
- Domain policy workspace (4-step owner flow: Review & Custodian → Control Selection → Policy Content → Control Owners → submit)
- Policy library view and `goToPolicyLibrary`
- Policy merges, custom names, versions, acknowledgments, review cycles

**`controls.js`**
- Control implementation workspace (4 steps: My Controls → Design → Asset Requirements → Review & Submit)
- Control library view and `goToControlLibrary`
- Control workflow state, evidence, `_ctrlEvidenceFilter`

**`assets.js`**
- Asset & SSP workspace (3 steps: Inventory → Mapping → Attestation)
- Asset library and asset-type library, `goToAssetLibrary`, `goToAssetTypeLibrary`
- `customAssetTypes`, `customAssetTypeGroups`, `customAssetTypeHeaders`, `assetTypeRequests` handling
- `assetMappings`, `sspAttestations`, `sspSignoffs`

**`testing.js`**
- Control testing workspace (4 steps: Scope → Procedures → Results → Findings)
- `controlTestResults`, `testAdequacy`
- POA&M (`poamItems`) view and edit flows

**`reports.js`**
- Reports & Dashboard tab
- Audit trail rendering, review queue panel, per-user dashboards, program-health views

**`admin.js`**
- Users & Roles tab (`users` CRUD, role assignment)
- Role picker modal (`showRolePicker`) and all role-switching UI
- Snapshots modal UI (load / save / delete snapshots)

### Placement rules (for ambiguous cases)

1. **Called from 2+ workspaces → `core.js`.** Grep for call sites before placing.
2. **Renders into a specific tab panel → that workspace's file.**
3. **Pure data transform with no DOM → prefer `core.js`.**
4. **If unsure, ask me before placing.** Do not guess.

## Execution protocol — one step per commit

Follow exactly. Do not skip steps. Do not combine them.

**Step 0 — baseline**
- `node --check js/app.js` must pass
- `git status` must be clean
- Create a tag: `git tag pre-split`

**Step 1 — create `core.js`**
1. Create `js/core.js`.
2. Move (cut, not copy) the foundation items listed above from `js/app.js` to `js/core.js`.
3. In `index.html`, add `<script src="js/core.js"></script>` **before** `<script src="js/app.js"></script>`.
4. Validate: `node --check js/core.js && node --check js/app.js`.
5. Open the page locally; confirm it boots, the sidebar renders, and no `ReferenceError` appears in the console.
6. Load each XMPL snapshot from the Snapshots modal; confirm each loads without errors.
7. Commit: `git commit -m "refactor: extract core.js from app.js"`.

**Steps 2–8 — one workspace at a time, in this order**

`program.js` → `policies.js` → `controls.js` → `assets.js` → `testing.js` → `reports.js` → `admin.js`

For each:
1. Create the new file.
2. Cut the in-scope functions and any file-scoped constants used only by this workspace.
3. Add a `<script>` tag to `index.html` **after** `core.js` and **before** `app.js` (order among the workspace files doesn't matter because they don't call each other directly — everything shared is in `core.js`).
4. `node --check` every `js/*.js` file.
5. Manual smoke test:
   - Load page, confirm no console errors
   - Load both XMPL snapshots
   - Sign in as each role via the role picker; confirm that role's tabs render
   - Exercise the workspace you just extracted (click through its steps)
6. Commit with message `refactor: extract <name>.js from app.js`.

**Step 9 — final verification**
- `js/app.js` should now be empty or contain only a tiny stub. Delete it and remove its `<script>` tag from `index.html`.
- Run the full smoke test from `CLAUDE.md`:
  1. `node --check` on every file under `js/`
  2. Parse all `XMPL_*_SNAPSHOT.data` fields as valid JSON
  3. Confirm `localStorage` keys are `larsen-grc-v1` and `larsen-grc-snapshots`, and that the legacy-key migration still runs
  4. Load each XMPL snapshot, reset, confirm no ghost state
  5. Confirm sidebar badges update correctly
  6. Role-picker: sign in as each of `ciso`, `issm`, `control-owner`, `asset-owner`, `custodian`, `approver` and confirm only the intended tabs are visible
- Commit: `git commit -m "refactor: remove now-empty app.js after modular split"`.

## Constraints to respect

- **Do not wrap anything in IIFEs or closures.** Functions must remain attached to the global scope so inline `onclick` handlers keep working.
- **Do not change function signatures or names.**
- **Do not modify `index.html` beyond adding/removing `<script>` tags.**
- **Preserve comment blocks and section headers** when moving code.
- **Keep the legacy-storage migration shim (`migrateLegacyStorageKeys`) intact** in `core.js` — per CLAUDE.md it must stay for at least one release cycle.
- **If any function cannot be cleanly placed, leave it in `core.js` and flag it in the commit message** rather than inventing a new file or splitting further.

## Reporting

After each step's commit, post a short summary:
- File created, approximate line count
- Number of functions moved
- Any placement decisions you weren't sure about (with the rule you applied)
- Smoke-test result

Begin with Step 0.
