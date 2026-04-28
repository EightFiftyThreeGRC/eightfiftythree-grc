# Cursor Prompt — Asset Owner Wizard Follow-Up (No-Cascade FIPS 199)

## Context

The prior prompt (`ASSET_OWNER_UPGRADE_PROMPT.md`) has already been implemented. The 5-step Asset Owner wizard now captures per-asset FIPS 199 categorization in Step 2 (System Profile), along with authorization boundary, interconnections, inheritance provider, auto-POA&M, and re-attestation.

One NIST-correctness issue was missed in that first pass and needs a targeted fix: **per-asset FIPS 199 must never cascade into changes to the program baseline or to other assets' control scope.**

Relevant files:
- `js/assets.js` — `renderAssetSSPStep2_SystemProfile()` and any helper that computes the high-water mark or reacts to it.
- `js/app.js` — `state.baseline` (program-wide). Must remain the single source of truth for the program's in-scope control set.
- `CLAUDE.md` — architecture reference.

## What changed (net new vs. the prior prompt)

In real NIST RMF, each system gets its own FIPS 199 categorization and its own tailored baseline; the high-water mark rule applies **within a single system's information types only**, never across systems in an organization. EightFiftyThree GRC models one `state.baseline` per program, so per-asset categorization must be treated as documentation + a governance signal — not an action trigger.

## Required changes

### 1. No mutation of `state.baseline` from per-asset data

Grep `js/assets.js` and any new helpers for writes to `state.baseline` introduced by the FIPS 199 step. Remove them. The only place `state.baseline` should be mutated is the existing CISO Step 1 wizard in `js/app.js`.

### 2. Mismatch warnings — non-blocking, non-actionable

In `renderAssetSSPStep2_SystemProfile()`, after computing the asset's overall impact (high-water mark across that one asset's info types):

- If `assetImpact > state.baseline` (ordering: L=1, M=2, H=3), render an **amber non-blocking warning** on the step:

  > "This system is categorized higher than the program baseline. In a real ATO, it would need its own Moderate/High baseline. Options: (a) raise the program baseline in CISO setup, (b) split this system into its own program, or (c) document compensating controls and accept the risk."

  Do not block save or submission. Do not auto-raise anything.

- If `assetImpact < state.baseline`, render an **informational note**:

  > "This system is categorized below the program baseline. You may mark controls that do not apply to this system's categorization as 'Not Applicable — outside system categorization' in Step 4."

  Do not auto-scope anything.

- If `assetImpact === state.baseline`, render a neutral confirmation.

### 3. Control scope stays driven by control-owner mappings

Step 4 (Control Attestations) must continue to show controls based on what control owners mapped to the asset's type and/or explicit asset ID. Do not filter or re-filter the control list based on the asset's FIPS 199 result. If this was changed in the first pass, revert it.

### 4. Reports tab: surface the mismatch as a program-health signal

Add a small "Categorization Mismatches" tile or row to the Reports dashboard showing:

- Count of assets categorized **above** `state.baseline`
- Count of assets categorized **below** `state.baseline`

Clickable to a filtered asset list. This is visibility only — no enforcement, no auto-action.

### 5. Audit trail

When an asset's computed overall impact is first saved and differs from `state.baseline`, write one `addAuditEntry('asset', assetId, 'Categorization mismatch: asset=<X>, program baseline=<Y>')` entry. Do not spam on every edit — only on transitions between matched/above/below states.

### 6. Snapshots

In `XMPL_SNAPSHOT` and `XMPL_DOMAIN_SNAPSHOT` (`js/app.js` ~line 12970), set at least one asset's `assetCategorization` to a value that **exceeds** the snapshot's `state.baseline` so the amber mismatch warning is demoable. Do not raise the snapshot's `state.baseline` to compensate.

## Validation

1. `node --check js/app.js && node --check js/assets.js` pass.
2. Load a demo snapshot with `state.baseline = 'L'`. Open an asset whose info-type selection produces Moderate. Confirm: (a) amber warning appears, (b) `state.baseline` is unchanged, (c) the control list in Step 4 is unchanged.
3. Lower the same asset's info types so overall impact is Low again. Confirm the warning disappears and no residual state was left behind.
4. Raise an asset above baseline, then check the Reports dashboard — the "above baseline" count should reflect it.
5. Confirm the audit trail records the mismatch transition exactly once, not on every keystroke.

## Non-goals

- Per-system independent baselines / multi-ATO-scope modeling (separate, much larger PR).
- Automatic compensating-control suggestion (separate PR).

Execute autonomously. One focused PR. No KPMG references.
