# Cursor Prompt — Asset Owner Wizard Upgrade (Toward a Defensible Minimal SSP)

## Context

The Asset Owner wizard in `js/assets.js` currently has 3 steps: Asset Profile → Control Attestations → Review & Sign-Off. A NIST 800-53 Rev 5 review identified that this produces an attestation log, not an SSP, and would be flagged by a 3PAO. We are upgrading it to capture the minimum data required for a defensible system-level SSP.

Relevant files:
- `js/assets.js` — Asset Owner tab logic; the 3 step renderers are `renderAssetSSPStep1/2/3` (lines ~870, 907, 1011), `submitSSP` (line ~1138).
- `index.html` ~line 407–455 — Asset Owner panel markup (step-nav + step bodies).
- `js/app.js` — `state` object (line ~1032), `STATE_DEFAULTS`, `addAuditEntry`, `markDirty`, POA&M helpers.
- `CLAUDE.md` — full architecture, state shape, gotchas. Read it first.

Any new state keys MUST be added to the initial `state` literal in `js/app.js` so `STATE_DEFAULTS` picks them up (per CLAUDE.md).

## Goal

Convert the Asset Owner wizard from 3 steps to 5 steps by inserting "System Profile" and "Interconnections" steps, and upgrade Attestation + Sign-Off to close five NIST gaps:

1. Per-asset FIPS 199 categorization (not just the program baseline).
2. Authorization boundary, technology stack, and user-population capture.
3. Interconnections / external service inventory with direction, sensitivity, ISA reference.
4. Inheritance provider + customer-responsibility note whenever "Inherited" is attested.
5. Auto-POA&M creation whenever a control is attested as "Partially Complies" or "Does Not Comply".

Also add: multi-item evidence per control, annual re-attestation validity window, and a "significant change since last attestation" prompt at sign-off.

## Deliverables

### 1. Extend `state` (in `js/app.js` initial literal, line ~1032)

Add these keys with empty/default values so `STATE_DEFAULTS` captures them:

- `assetCategorization` — `{ [assetId]: { confidentiality: 'L'|'M'|'H', integrity: 'L'|'M'|'H', availability: 'L'|'M'|'H', infoTypes: [ { id, label, cia: {c,i,a} } ], rationale: '' } }`
- `assetBoundary` — `{ [assetId]: { purpose: '', boundaryDescription: '', hosting: '', techStack: '', userTypes: { privileged: 0, nonPrivileged: 0, external: 0 }, planRefs: { cp: '', irp: '', cmp: '', pia: '' } } }`
- `assetInterconnections` — `{ [assetId]: [ { id, name, direction: 'inbound'|'outbound'|'bidirectional', dataSensitivity: 'L'|'M'|'H', provider: '', isaRef: '', notes: '' } ] }`
- `assetInheritance` — `{ [assetId]: { [controlId]: { provider: '', leveragedAto: '', customerResponsibility: '' } } }`
- `assetOdvOverrides` — `{ [assetId]: { [controlId]: { [paramKey]: value } } }`
- `assetReattestation` — `{ [assetId]: { validityMonths: 12, lastAttestedDate: '', nextDueDate: '', significantChanges: '' } }`

Per-control evidence shape in `sspAttestations[assetId][controlId]` changes from a single `evidenceLocation` string to `evidenceRefs: [ { label: '', url: '', kind: 'doc'|'screenshot'|'log'|'ticket'|'other' } ]`. Write a one-time migration that converts any existing `evidenceLocation` string into a single `evidenceRefs` entry with `kind:'other'` and preserves the original. Do not delete the old field in the same release — keep it read-alongside for one cycle.

### 2. Update wizard markup (`index.html` ~line 407–455)

Change step-nav to 5 items: Asset Inventory · System Profile · Interconnections · Control Attestations · Review & Sign-Off. Update step-circle IDs, connectors, and wizard-step bodies to match. Rewire footer Next/Back buttons.

### 3. Implement new step renderers in `js/assets.js`

- `renderAssetSSPStep2_SystemProfile()` — FIPS 199 picker (C/I/A dropdowns L/M/H), info-type list (use 800-60 Vol 2 top-level categories as a seed — document in a constant `INFO_TYPES_800_60` near `ASSET_TYPES`), overall impact = high-water mark computed live (across that one asset's info types only), system purpose, authorization boundary description, hosting, tech stack, user-type counts, plan reference inputs.

  **IMPORTANT — no cascading baseline changes.** Per-asset FIPS 199 is documentation + a mismatch flag. It must NOT mutate `state.baseline` or change the set of controls applied to other assets. Specifically:
  - If the asset's computed overall impact **exceeds** `state.baseline` (e.g., asset is Moderate but program is Low), render a non-blocking amber warning on the System Profile step: "This system is categorized higher than the program baseline. In a real ATO, it would need its own Moderate/High baseline. Options: (a) raise the program baseline, (b) split this system into its own program, or (c) document compensating controls." Do not auto-raise anything.
  - If the asset's computed overall impact is **below** `state.baseline`, show an informational note offering the user the option to mark non-applicable controls as "Not Applicable — outside system categorization" in Step 4 (legitimate tailoring). Do not auto-scope controls.
  - `state.baseline` remains the single source of truth for which controls the program has in scope. Per-asset categorization is captured purely for SSP Section 1 accuracy and governance visibility.
  - Surface the mismatch count on the Reports tab as a program-health signal ("N assets categorized above program baseline"), but never auto-act on it.
- `renderAssetSSPStep3_Interconnections()` — add/remove table, fields per row as in state shape above. Include an empty-state with a "Skip — no external connections" explicit button that sets an `_interconnectionsAck` flag rather than leaving the list silently empty.
- Renumber existing `renderAssetSSPStep2` → `renderAssetSSPStep4_Attestations` and `renderAssetSSPStep3` → `renderAssetSSPStep5_SignOff`. Update `renderAssetStep()` dispatcher.

### 4. Upgrade Attestations (new Step 4)

- When user selects status = "Inherited," inline-reveal two required fields: provider (e.g., "AWS FedRAMP Moderate") and customer-responsibility note. Block saving the attestation until both are filled. Persist to `state.assetInheritance`.
- Add an ODV column: if the control has parameterized assignments (detect by scanning control text for `[Assignment: organization-defined …]`), show an "Org-defined value" input row per occurrence. Persist to `state.assetOdvOverrides`.
- Replace single `evidenceLocation` input with a small evidence-refs list component (add-row button, each row: label, URL, kind dropdown).
- When status = "Partially Complies" or "Does Not Comply" and no existing POA&M entry references this asset+control, auto-create one in `state.poamItems` at attestation time with: title = "[assetId] {control} {status}", source = 'Asset attestation', status = 'Open', severity = derived from status (Partial → Medium, Does Not Comply → High), linked to assetId + controlId. If the user later flips status back to Complies/NA/Inherited, mark the auto-created POA&M as 'Closed — resolved via re-attestation' rather than deleting. Call `addAuditEntry('poam', ...)`.

### 5. Upgrade Sign-Off (new Step 5)

- Show a "System Profile Snapshot" panel summarizing FIPS 199 categorization, boundary, user counts, interconnections count — pulled from the new steps. Flag any missing required fields and block submit until resolved.
- Add "Significant changes since last attestation" textarea (persist to `assetReattestation[assetId].significantChanges`). Required if `lastAttestedDate` exists.
- Add "Attestation validity" dropdown (6 / 12 / 24 months, default 12). On submit, compute and store `nextDueDate`.
- Generate a mini-SSP preview (collapsible) that renders Sections 1–3 (System ID, Overview, Environment) + a summary of controls grouped by status. Pure HTML; no export for now.
- On submit, in addition to existing behavior: set `lastAttestedDate` and `nextDueDate` in `assetReattestation`, log an audit entry, and ensure all auto-POA&Ms for this asset have been reconciled.

### 6. Keep existing gotchas in mind (from CLAUDE.md)

- All new `onclick=` handlers that embed string arguments MUST escape quotes via `escKey`/`escapeHTML`.
- Event handlers that trigger re-renders MUST wrap the re-render in `setTimeout(..., 0)`.
- Every state mutation calls `markDirty()`.
- Do not break the phantom-owner flag; do not introduce new fake identities.
- `node --check js/app.js` and `node --check js/assets.js` must pass.

### 7. Update snapshots

In `js/app.js` (~line ~12970) both `XMPL_SNAPSHOT` and `XMPL_DOMAIN_SNAPSHOT` need the new state keys populated for at least one demo asset so the new wizard steps show realistic data when loaded. Do not introduce any reference to KPMG or the legacy Hawthorn name.

### 8. Validation checklist before opening the PR

1. `node --check js/app.js && node --check js/assets.js` pass.
2. Reset → run through all 5 steps as Asset Owner → submit. Verify attestation, POA&M auto-creation, re-attestation date, audit trail entries.
3. Load XMPL snapshot → confirm new fields populate without error.
4. Mark a control "Inherited" without provider → verify save is blocked.
5. Mark a control "Does Not Comply" → verify a POA&M row appears in Reports tab POA&M panel.
6. Flip that same control back to "Complies" → verify the POA&M auto-closes (not deletes).
7. Confirm the legacy `evidenceLocation` value on a pre-existing attestation is migrated into `evidenceRefs` on first load.
8. Sign off an asset, wait, come back — "Significant changes since last attestation" is required for re-submission.

## Non-goals for this PR

- Full PIA workflow (separate PR).
- Network-diagram upload (separate PR).
- Automated control-inheritance from a provider CRM file (separate PR).
- Penetration test / annual-assessment workflow (separate PR).

Execute autonomously. One focused PR. No KPMG references.
