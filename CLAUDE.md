# EightFiftyThree GRC — Project Context

## What This Is

A free, browser-based GRC program management tool built around **NIST CSF 2.0, NIST RMF (SP 800-37), and NIST SP 800-53 Rev. 5**. The program layer (ISP + domain policies) is organized by CSF 2.0 Functions and outcomes; 800-53 controls are the implementation layer beneath them, and Low/Moderate/High categorization happens per information system downstream in Assets & SSP — never estate-wide. Built by Jacob Larsen as a personal portfolio project. Published open-source on GitHub Pages under MIT license. No monetization — this is a skill showcase.

Live URL: `https://eightfiftythreegrc.github.io/eightfiftythree-grc/` (org repo **EightFiftyThreeGRC/eightfiftythree-grc**; Pages deploys via classic "Deploy from branch" `main` / `/` ONLY — the redundant `deploy-pages.yml` Actions workflow was removed 2026-07-04 because it raced the branch deployer and caused failure emails. Do not re-add a Pages deploy workflow.)

## Branding Rules

- The public name of the tool is **EightFiftyThree GRC**
- NEVER reference KPMG, Jacob's employer, or any employer anywhere in the tool, docs, or comments
- No prior branding (Larsen Cyber GRC Wizard, Hawthorn, or any earlier working name) should appear in any new code, docs, or comments. The only permitted mentions are inside the one-time localStorage migration shim, where the literal legacy key strings are required to read the old data.
- The About section says "experienced cyber GRC advisor" — keep it generic
- The demo company is **XMPL Co.** (previously "Acme")
- Public contact address on the site: `nistcsftool@gmail.com`

## Program Model (the important part)

This is the conceptual spine; do not "fix" the app back toward an 800-53-first shape.

- **Govern (GV) is the ISP.** All six GV categories are covered as consolidated ISP requirements (`infoSecPolicy.requirements[]`, each row carrying `csf: [...]` outcome tags and mapped PM / XX-1 controls). There is no sixth "Govern" domain-policy card.
- **Identify, Protect, Detect, Respond, Recover are the five domain-policy packages.** `NIST_CSF_FAMILY_POLICY_FN` partitions the 19 non-PM 800-53 families into those Functions; `NIST_CSF_FUNCTION_POLICY_MASTER` names the master family per package (ID→RA, PR→AC, DE→AU, RS→IR, RC→CP). This is organizational packaging, not a claim about control-level crosswalks.
- **Domain-policy requirements are drafted from CSF 2.0 subcategory outcomes** — one requirement row per CSF category, subcategory-ID chips, 800-53 controls nested under CSF headings (`buildDomainPolicyRequirementsFromCsf` in `js/policies.js`).
- **800-53 stays as the implementation layer.** Program setup fixes the **SP 800-53B Low baseline as the inherited common-control floor** (149 controls). Explicit copy tells the operator they are NOT categorizing the organization: each system picks L/M/H later in Assets & SSP (`fismaMode` / 800-60 information types for federal-style programs; `assetCategorization`, `baseline-elevation.js` pulls additional controls without flipping the floor). This matches SP 800-37 Prepare P-4.
- **Control-level CSF crosswalk** lives in `NIST_CSF_MAP` (`js/nist-csf-map.js`): a deliberate product rule of **one primary CSF 2.0 subcategory per 800-53 base control** (enhancements inherit the parent; all XX-1 policy-and-procedure controls → GV.PO-01). This is intentionally NOT the many-to-many official OLIR table — one primary keeps rollups and "Unmapped vs tagged" honest. As of 2026-08-27 every base control in the catalog carries a primary tag; judgment calls stay category-level tokens (e.g. `'DE.CM'`).
- **CSF Organizational Profile is derived, not surveyed** (`js/csf-profile.js`, rendered at the top of the Framework alignment tab): Target Profile = outcomes committed to in the ISP and Function policies (`state.csfSelectedSubcats`; a Function whose outcomes were never curated falls back to "any outcome with in-scope mapped controls"); Current Profile = live implementation status of the controls mapped to each outcome. `exportCsfProfileCsv()` exports the 106-row profile.

## Architecture

Zero-dependency, no-build static web application. UI and logic run client-side and the program lives only in this browser's `localStorage` (key `eightfiftythree-grc-v1`). There is no backend and no login: you work in Admin mode or impersonate a rostered person via the sidebar role picker. (An earlier Supabase-backed cloud mode was removed; `isCloudSessionActive()` is hardcoded false and several `*Cloud*` helper names in `js/session.js` survive only because ~200 call sites use them.) Primary dev is in Cursor; this file is written so Claude (or any LLM) can make targeted edits when called on.

### File Structure

Globals only — no modules, no bundler, no transpilation. Actual `<script>` load order in `app.html` (source of truth — check the tags, not this list): nist-control-text → core → nist-csf-map → csf-profile → policies → control-scope-defaults → controls → assets → baseline-elevation → authorization → frameworks → risk → hub → reports → admin → session → program → policy-board → app → policy-map. Script/CSS tags carry `?v=YYYYMMDD` cache-busters — bump them for any file you edit.

```
index.html                  — public landing page (links to app.html)
app.html                    — UI shell, sidebar, tab containers, role picker overlay
css/landing.css             — landing page styles
css/app.css                 — all app styles (multiple media-query blocks: 900px primary,
                              plus 768/600/480/1024px and @media print)
js/nist-control-text.js     — verbatim NIST 800-53 control requirement text lookup
js/core.js                  — STATE shape, STATE_DEFAULTS, ROLE_TABS, FAMILIES/CONTROLS
                              catalog, persistence (saveToStorage / loadFromStorage /
                              markDirty / importProgramFromFile / validateProgramShape /
                              applyLoadedState / addAuditEntry / logFieldChange)
js/nist-csf-map.js          — CSF 2.0 Functions/Categories/Subcategories reference data,
                              NIST_CSF_MAP (1-1 control→subcategory primaries),
                              Function policy packaging, selection state helpers
                              (csfSelectedSubcats), coverage rollups, orientation UI
js/csf-profile.js           — derived CSF 2.0 Organizational Profile (Target from policy
                              commitments, Current from control status) + CSV export;
                              rendered inside the Framework alignment tab
js/policies.js              — Domain Policies wizard + policy library; drafts requirements
                              from CSF category/subcategory outcomes
js/policy-board.js          — shared CSF Function / 800-53 family grouping board
                              (state.policyMerges + state.policyFamilyHome)
js/policy-map.js            — retired Path B (catalog existing policies) helpers; the
                              setup fork was collapsed into one wizard, this file keeps
                              migration + catalog helpers (getResolvedProgramPath)
js/control-scope-defaults.js— per-control default asset-type scoping data
js/controls.js              — Control Implementation wizard (4 steps) + control library
js/assets.js                — Assets & SSP wizard (4 steps) + asset/asset-type libraries;
                              per-system categorization; SSP submission (NOT formal
                              authorization)
js/baseline-elevation.js    — Baseline elevation triggers and review flow
js/testing.js               — INTENTIONALLY EMPTY stub (Control Assessment workspace
                              removed 2026-04-27; kept so legacy snapshot/export
                              references don't 404; NOT loaded by app.html)
js/authorization.js         — AO decision data + helpers + openAtoDecisionModal launched
                              from the Reports dashboard (atoEnsureState, atoCanDecide,
                              submitAtoDecisionFromModal,
                              renderAuthorizationStatusPanelHtml)
js/frameworks.js            — Framework alignment tab: CSF Profile panel, ISO 27001 /
                              SOC 2 / HIPAA / PCI DSS and named-US-obligation crosswalks,
                              custom-regulation requirement library
js/hub.js                   — Command Center (post-setup home dashboard, 'home' tab);
                              program phase roadmap bar (renderProgramPhaseBar)
js/risk.js                  — Risks & Issues tab (`risk`): triage queue, risk register,
                              POA&M-compatible issues, sidebar inventories, SoD flows
js/reports.js               — Reports & Dashboard, audit/change-log views, review queues,
                              Authorization status panel
js/admin.js                 — Users & roles tab, role picker / impersonation
js/session.js               — acting identity + permission helpers (getActingUser,
                              isCloudOwnerSession = Admin mode, canSessionApprove*,
                              separation-of-duties validation)
js/program.js               — Program setup wizard (7 steps, CISO_STEP_LABELS);
                              seedDomainOwnersFromProgramOwner; sidebar badges
js/app.js                   — App shell: TAB_IDS, currentStep, showTab, goToStep,
                              snapshot modal, beforeunload handler, bootLocalMode,
                              reapplySessionRoleView, DOMContentLoaded
scripts/check-all.js        — syntax check across all JS modules (npm run check:js)
tests/e2e/smoke.spec.js     — Playwright smoke tests (npm run test:e2e)
tests/agents/               — Agent QA checklists 00–06 + LAST_RUN.md scorecard
.github/workflows/          — validate.yml only (JS syntax check on push/PR). Pages
                              publishes straight from `main`; do not add a deploy workflow.
README.md                   — public GitHub README + operator smoke-test runbook
CONTROL_OWNER_SPEC.md       — compliance + UX spec for the Control Owner flow
PHASE2_RISKS_ISSUES_SPEC.md — design spec for Risks & Issues
AGENT_QA_PLAN.md            — multi-agent QA regime
```

Housekeeping 2026-08-27: legacy one-off artifacts (`missing-controls.js`, `nist-controls-audit.xlsx`, `acme_grc_state.json`, `repair.js`, `fix_encoding.js`) and scratch files were removed from the repo; `tmp_*.js` and `tools/_*` are gitignored. `tools/` keeps only the documented 2026-04 refactor helpers.

When adding a function, place it in the file that owns the corresponding domain. Cross-file calls happen via globals; call sites should defensively `typeof fn === 'function'` when calling helpers from a downstream module.

### Deployment

GitHub Pages serves `index.html` (landing) + `app.html` (app shell) + `css/*.css` + every `js/*.js`. No build step. Push to `main` and the built-in "pages build and deployment" workflow redeploys automatically. Note: the repo's committed blobs are LF; Windows working trees are CRLF — normalize on add (`git -c core.autocrlf=input add …`) when committing from a Linux mount, or the diff churns every line.

### Vanilla JS Conventions

- Plain `function` declarations at top level, attached to the global scope. No modules, no classes, no frameworks.
- DOM rendering is `innerHTML = ...` into static containers declared in `app.html`. Tabs are `.tab-panel` divs with `id="tab-<name>"`; wizard steps are `.wizard-step` divs with `id="<tab>-step-<n>"` and body containers with `id="<tab>-step-<n>-body"`.
- Event wiring is inline `onclick="foo()"` in generated HTML. Any string argument you embed in an `onclick` MUST escape quotes (use the existing `escKey`/`escapeHTML` helpers) — one unescaped quote has historically broken all JavaScript parsing.
- When an event handler triggers a re-render, wrap it in `setTimeout(fn, 0)` so the browser doesn't destroy the element mid-event.

## State Management

All application state lives in a single `state` object in `js/core.js` (~line 1101). Its shape is the source of truth; `STATE_DEFAULTS` (a deep clone captured immediately after declaration) drives `resetStateToDefaults()` and import normalization. **New state keys must be added to the `state` literal** so STATE_DEFAULTS captures a sane default.

### Key state property groups (current)

Program identity & structure
- `baseline` ('L'/'M'/'H' — the inherited common-control floor, normally 'L'), `privacyOverlay`, `fismaMode`, `programInfoTypes`
- `baselineOverride`, `baselineOverrideRationale`, `baselineRecommendation`, `baselineDecision`
- `orgName`, `programOwner`, `programOwnerTitle`, `programOwnerEmail`; org profile fields (`orgSizeBand`, `orgDataTypes`, `orgImpactProfile`, `orgNonUsFootprint`, `orgSoc2Demand`, `orgOwnership`, `orgGovLevel`, `orgSector`)
- `cisoIsISSM` — legacy key name for "this person also owns domain policies" (read via `programOwnerOwnsDomainPolicies()`); `domainOwnerDefaultApplied`
- `pmControls`, `cisoComplete`, `cisoSetupStep`, `programPath` (legacy fork id, resolved to the one unified wizard), `homeJourney`

CSF 2.0
- `csfSelectedSubcats` — `{ 'GV.OC-01': true, ... }` selected outcomes across ALL Functions (seeded per Function on first visit; drives the Target Profile)
- `csfAutoPmControls`, `csfFunctionGroupingApplied`, `_csfProfileDetail`, `_pmShowCsfMappedOnly`

Reg mapping / frameworks
- `regMappingRecommendation`, `regMappingDecision`, `activeFrameworks`, `activeComplianceLaws`, `customRegFrameworks`, `_regMappingInitialized`

Policies
- `infoSecPolicy` (ISP: sections + `requirements[]` rows with `csf` tags and `controls`), `policyReviewCycle`, `infoSecPolicySuggestions`, `infoSecPolicyReviewDraft`
- `domainOwners`, `policyStatus`, `policyPriorities`, `policyDeadlines`, `domainDeadlines`
- `policyMerges`, `policyFamilyHome` (sparse Function/standalone override), `domainCustomNames`
- `policySelectedControls`, `domainPolicies` (per family: content + CSF-derived `requirements[]`)
- `policyCustodians`, `policyVersions`, `policyAcknowledgments`
- `policyCatalog`, `policyMapConfirmed`, `policyMap*` — retired Path B catalog remnants

Controls
- `controlOwners`, `controlStatus` (`{ status: 'Not Started'|'In Progress'|'Designed'|'Design Submitted'|'Implemented'|'Inherited'|'Returned to Policy Owner', ... }`), `controlDeadlines`, `controlWorkflowState`, `controlReviewQueue`, `controlEvidence`, `controlTestResults`, `testAdequacy`, `controlDesignSubmission`, `controlOwnerAttested`

Assets / SSP / Authorization
- `assets`, `processes`, `assetCategorization`, `baselineElevationRecommendations`
- `sspAttestations`, `sspSignoffs`, `sspInterconnections`; custom asset/process type registries + label overrides; `assetTypeRequests`; `assetMappings`
- `authBoundaries`, `assessmentPlans`, `atoDecisions`

Risks & Issues
- `risks[]`, `issues[]` (POA&M-compatible, CA-5), `riskTriageDismissals{}`; legacy `poamItems[]` migrates via `migratePoamItemsToIssues()`
- PM-4 selected → issues sub-view labeled **Issues (POA&M)** + CSV export

Users / acting identity
- `users`, `currentUserId` (`null` = Admin mode), `_currentPersonIds`, `customProgramRoles[]`, `roleLabelOverrides`
- `ROLE_TABS` (js/core.js ~line 1075): `ciso` → home,ciso,policy,asset,frameworks,risk,reports · `issm` → home,policy,asset,frameworks,risk,reports · `control-owner` → home,control,frameworks,risk,reports · `asset-owner` → home,asset,risk,reports · `custodian` → home,policy,reports · `assessor` → home,risk,reports · `ao` → home,asset,risk,reports,users · `approver` → home,reports. Tab visibility is enforced in `showTab()` (redirects out-of-role tab ids), not just hidden nav.

Accountability
- `auditTrail` — semantic event log via `addAuditEntry(cat, refId, msg)`, capped at 800
- `changeLog` — field-level log via `logFieldChange(path, oldVal, newVal)`, capped at 2000. Wire into `oninput`/`onchange` wherever a free-text or selection edit should be auditable.

Plus ~40 transient `_`-prefixed UI flags (filters, library modes, selections) — all declared in the state literal.

### Persistence Helpers

`markDirty()` and `_updateSaveIndicator(saved)` live in `js/core.js`. Auto-save is debounced (~400ms); the `beforeunload` handler in `js/app.js` flushes pending saves and warns if `window.isDirty` is still true. Earlier versions broke when these helpers were missing — 79+ callers ReferenceError-ed silently. **Keep them defined.**

### localStorage Keys

- `eightfiftythree-grc-v1` — main application state
- `eightfiftythree-grc-snapshots` — saved program snapshots
- `eightfiftythree-grc-v1-ts` — last-saved timestamp

A one-time migration shim (`migrateLegacyStorageKeys()`, just below `STORAGE_KEY`) copies `larsen-grc*` / `hawthorn-grc*` state into the `eightfiftythree-*` keys and removes the originals. Leave in place for at least one release cycle.

### Built-in Demo Snapshots

Defined near the bottom of `js/core.js` (restore/load flow in `js/app.js`): `XMPL_SNAPSHOT` (program setup level) and `XMPL_DOMAIN_SNAPSHOT` (domain policies complete). When rebuilding snapshots, every key in the live `state` object should have a corresponding entry — missing keys cause silent failures.

## App Workflow

### Sidebar Navigation (from `app.html`)

Tabs (`TAB_IDS` in js/app.js): `home, ciso, policy, control, asset, frameworks, risk, reports, users`. Command Center (`home`) is the post-setup dashboard; the program phase roadmap bar (Phase 1 governance · Phase 2 risks/issues · Phase 3 continuous monitoring [coming soon]) renders via `renderProgramPhaseBar()` in `js/hub.js`. Top-right toolbar: Save indicator, Save now, Export JSON, Import JSON, Snapshots, Reset. Sidebar top: profile button → role picker overlay (any rostered person, plus Admin mode).

### Program Setup Wizard (7 steps — `CISO_STEP_LABELS` in `js/program.js`)

Labels → renderers are looked up **by label** (`cisoStepIndexByLabel`) so renumbering warns instead of painting the wrong step. Current sequence:

1. **Organization** (`renderCISOStep1`) — org name + program-owner identity; "this person also owns domain policies" toggle
2. **Program** (`renderCISOStep2Baseline`) — program structure teaching card (GV=ISP, five Functions=domain policies), 800-53B Low floor framing, FISMA/CUI mode, privacy overlay
3. **Reg mapping** (`renderCISOStep3Integrations`) — voluntary standards (ISO 27001, SOC 2), compliance laws (HIPAA, PCI DSS, named US obligations), custom regulations; recommendations pre-seeded from profile answers
4. **PM Controls** (`renderCISOStep2`) — PM control selection + GV subcategory curation (selectable outcome list)
5. **InfoSec Policy** (`renderCISOStep3`) — build the org-level ISP; requirements carry CSF tags; GV coverage consolidated; approval routes through a named reviewer (self-approval blocked)
6. **Policy set** (`renderCISOStep4a`) — the five Function policy packages; merge/move families via the shared policy board
7. **Assign Owners** (`renderCISOStep4b`) — assign owners per policy package/domain; the only finalize guard is in `cisoFinish` (every unmerged domain needs a valid owner email)

### Role-Based Workspaces

- **Domain Policies** (Policy Owner) — review & custodian → CSF-outcome-driven policy content → control owners → submit for approval (named reviewer allowed without email)
- **Control Implementation** (Control Owner) — 4 steps: My Controls → Design Controls → Asset Requirements → Review & Submit
- **Assets & SSP** (Asset Owner) — 4 steps: inventory → attestations → interconnections → review & sign-off; per-system categorization + baseline elevation; SSP submission records an "SSP Reviewer" (NOT the formal AO decision); per-control comments + **Raise issue** (→ `openRaiseIssueFromSspReview`)
- **Risks & Issues** — triage queue (H1–H5 computed from Phase-1 signals) · risk register · issues. SoD: risk acceptance (program owner/AO), issue verification (≠ assignee)
- **Authorization (AO Decision)** — AO Decision modal (`openAtoDecisionModal(boundaryId)`) from the Authorization status panel on the Reports dashboard; gated by `atoCanDecide`
- **Framework alignment** — CSF 2.0 Organizational Profile (derived; CSV export) + framework/law coverage cards + control crosswalk table
- **Reports & Dashboard** — program health, per-user dashboards, audit trail, review queues, Authorization status panel
- **Users & roles** — registry, role assignment, custom role slugs (`customProgramRoles[]` via `getRoleTabs()`)

## Known Patterns & Gotchas

- **DOM re-rendering:** wrap event-handler re-renders in `setTimeout(..., 0)`.
- **Unescaped quotes in onclick handlers** break all JS parsing — escape with `escapeHTML`/`escKey`, validate with `node --check`.
- **Policy merges:** merged family content carries an `XX:` prefix; merge target's owner manages both. `policyFamilyHome` overrides a family's Function home.
- **Privacy overlay:** auto-injects tiered privacy ISP requirements and PM-18+ selections with PRIVACY badges.
- **Reset:** `resetApp()` → `resetStateToDefaults()` copies `STATE_DEFAULTS`; keys must exist in the literal.
- **Snapshot restore:** routes through `openSnapshotRestoreConfirm` (auto-backup + counts diff + explicit acknowledgement).
- **Import validation:** `importProgramFromFile` → `validateProgramShape(saved)`; auto-snapshots before applying.
- **OneDrive mount staleness:** bash mounts of this folder have historically served stale copies; if syntax errors look impossible, re-check from the Windows side or wait for sync.

## Validation Before Shipping

1. `node --check js/<each file>.js` (or `npm run check:js`)
2. Parse all `XMPL_*_SNAPSHOT.data` fields as valid JSON
3. Confirm localStorage keys are `eightfiftythree-grc-*` and the legacy-key migration runs once, cleaning up both `larsen-grc-*` and `hawthorn-grc-*`
4. Snapshots modal → load each XMPL snapshot, then Reset and confirm no ghost state
5. Sidebar badges and counts update after state changes
6. Role-picker: impersonate each role; visible tabs must equal `ROLE_TABS` (assessor: home+risk+reports; AO: home+asset+risk+reports+users with the Authorization status panel on the dashboard); switch back to Admin mode
7. Owner gating: clear a domain owner's email → the Finalise button disables and its label names how many domains still need an owner (calling cisoFinish() directly also toasts the count)
8. CSF Profile panel (Framework alignment tab) renders, toggles outcome detail, and exports CSV

## Work Style

- Execute autonomously — don't ask permission for fixes, just do them
- One clear recommendation, at most one alternative
- No KPMG references anywhere, ever
- Primary dev is happening in Cursor; Claude is called for targeted edits and research

## Agent QA Regime ("QA the app")

When the user asks to **"QA the app"** (or run tests / run the QA regime / test everything), act as the orchestrator defined in `AGENT_QA_PLAN.md`:

1. Spawn one subagent per checklist in `tests/agents/` (00–05), passing the checklist file contents as the agent's prompt. Model per checklist header: haiku for 00, opus for 03, sonnet for the rest. Run 00/03/05 in parallel; run 01/02/04 serialized (they own the browser/local server).
2. Agents report findings only — the orchestrator makes all code edits, then re-runs the affected agent.
3. Finish with a fresh Agent 6 (`tests/agents/06-verifier.md`) reviewing the run's full diff. Green = all agents PASS + verifier approves.
4. Write the scorecard to `tests/agents/LAST_RUN.md` (overwrite each run; per-agent PASS/FAIL + open findings).
5. Hard rules: always test against a local server so the live site's browser storage is untouched; nothing destructive without a snapshot/backup first; "quick QA" = Agent 0 only.

## Reference Documents

- `AGENT_QA_PLAN.md` — multi-agent QA regime; per-agent checklists in `tests/agents/`
- `CONTROL_OWNER_SPEC.md` — compliance + UX spec for the Control Owner wizard
- `PHASE2_RISKS_ISSUES_SPEC.md` — design spec for the Risks & Issues dimension
- `README.md` — public project overview and operator smoke-test runbook
