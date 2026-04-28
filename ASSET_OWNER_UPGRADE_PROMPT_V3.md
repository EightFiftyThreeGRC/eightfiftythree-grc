# Cursor Prompt — Baseline Elevation Recommendation Workflow (V3)

## Context

V1 (asset-owner wizard → 5 steps with FIPS 199, interconnections, inheritance, auto-POA&M) and V2 (no-cascade + passive amber banner on categorization mismatch) are already implemented.

V3 replaces the **passive banner behavior** with an **active CISO-approval workflow**. The banner still fires, but it now triggers an automatic recommendation to the CISO to create a new elevated-baseline asset subtype in the asset type catalog. The CISO decides; the tool never auto-acts on `state.baseline`.

This is NIST-correct: it's "tailoring with additions" at the system-class level, with the AO/CISO as the decision-maker — per 800-53B and the RMF Prepare step's org-level tailoring guidance.

Relevant files:
- `js/assets.js` — `renderAssetSSPStep2_SystemProfile()` and the V2 banner logic.
- `js/app.js` — `state` declaration, `addAuditEntry`, `markDirty`, `controlReviewQueue`, `customAssetTypes`, `customAssetTypeGroups`.
- `CLAUDE.md` — architecture reference.

## What's net new vs. V2

V2 shows an amber banner warning when an asset categorizes above the program baseline, then stops. V3 keeps the banner **and**:

1. Auto-generates a **baseline elevation recommendation** targeting the CISO.
2. Surfaces it on the CISO approvals dashboard.
3. On approve: creates a new custom asset type (subtype) under the original type's header group, adds the full control delta to the program, leaves those controls unassigned pending domain-policy-owner handling.
4. On reject: records the decision; banner persists on the triggering asset noting the declined elevation.
5. Deduplicates future recommendations based on the highest previously-decided elevation for that base asset type.

Everything from V1/V2 stays. `state.baseline` is still never mutated by this workflow.

## State additions (add to `state` literal in `js/app.js` so `STATE_DEFAULTS` picks up)

```js
baselineElevationRecommendations: [
  // {
  //   id: 'be-<timestamp>',
  //   baseAssetTypeKey: 'infra_cloud_iaas',       // the built-in or custom type the asset was originally on
  //   baseAssetTypeName: 'Cloud IaaS',             // display name
  //   headerGroup: 'Infrastructure',               // for placement in the catalog on approval
  //   elevatedSubtypeName: 'Cloud IaaS — Elevated (Moderate)',
  //   targetBaseline: 'M',                         // 'M' or 'H'
  //   programBaselineAtTimeOfRec: 'L',
  //   deltaControlIds: ['AC-2(1)', 'AC-2(2)', ...],// full delta L→target for this type (see rules below)
  //   triggerAssetId: 'asset-123',
  //   submittedDate: '2026-04-23',
  //   status: 'Pending' | 'Approved' | 'Rejected',
  //   decisionDate: '',
  //   decisionBy: '',
  //   decisionRationale: '',
  //   policyOwnerNotifications: []                 // per-family notification records created on approval
  // }
]
```

No separate dedupe cache — derive "highest previously decided baseline for this asset type" on the fly.

## Workflow

### 1. Trigger (in `renderAssetSSPStep2_SystemProfile()`)

After the live high-water-mark computation, when `assetImpact > state.baseline`:

1. Still render the V2 amber banner.
2. Check for an existing recommendation that already covers this case (see dedupe rules below).
3. If no existing decision covers it, call `createBaselineElevationRecommendation(asset, assetImpact)`. This is idempotent per asset: if the asset already has a Pending recommendation, don't duplicate.
4. Update the banner copy:
   - If a new/pending recommendation was created: *"A recommendation has been sent to the CISO to create a '{elevatedSubtypeName}' asset type for high-risk systems like this. Status: Pending review."*
   - If a prior Approve covers this: *"The CISO has approved an elevated subtype for this asset type. This asset has been associated with '{elevatedSubtypeName}'."* (and actually migrate the asset to that subtype — see step 5).
   - If a prior Reject covers this: *"The CISO previously declined elevation of this asset type to {baseline} on {date}. Rationale: {rationale}. This asset remains on the program baseline."*

### 2. Dedupe rules (per user spec)

For each `baseAssetTypeKey`, find the highest `targetBaseline` across all existing recommendations (Pending, Approved, or Rejected).

- If the new asset's `assetImpact` ≤ that highest decided baseline: **no new recommendation**.
  - If the highest was Approved: auto-associate the asset with the approved subtype (see step 5).
  - If the highest was Rejected: leave asset on base type, show persistent rejection banner.
  - If the highest is Pending: show pending banner, link to the existing recommendation.
- If the new asset's `assetImpact` > that highest decided baseline: **create a new recommendation** for the new (higher) target.

Example: program baseline = L. Asset A (Cloud IaaS) at M → rec created, CISO rejects. Asset B (Cloud IaaS) at M → no re-ask. Asset C (Cloud IaaS) at H → re-ask at H.

### 3. Delta computation

`deltaControlIds` = all controls in `CONTROLS` where:
- The control's family is one of the 20 in scope for the program, AND
- `control.bl` includes `targetBaseline`, AND
- `control.bl` does NOT include `state.baseline` at recommendation time (i.e., it wasn't already in scope).

This means L→H pulls in both L→M and M→H additions; M→H pulls in only M→H additions. The rule is "every control in the target baseline that isn't in the program baseline," regardless of tier.

**Double-add guard:** If a lower elevation already exists for this asset type (e.g., an M subtype was approved previously and we're now approving H), skip adding any control that is already present in `state.controlOwners`. Do NOT overwrite existing owner assignments, attestations, or evidence from the earlier elevation. The new H subtype inherits those controls as-already-owned; only the newly-needed H-specific controls (M→H delta) get created as `unassigned`. Record the skipped count in the audit entry.

Include ALL applicable delta controls across all families. Do not pre-filter by "controls that look physical / irrelevant for cloud" — that's the control owner's decision later (they'll de-select inapplicable ones during implementation). Include a note in the recommendation detail view explaining this.

### 4. CISO dashboard surface

Extend the existing CISO approvals / review queue (`controlReviewQueue` or whichever queue the CISO currently reviews in the Reports tab) with a new card type `type: 'baseline-elevation'`.

Card contents:
- Header: "Baseline Elevation Recommendation"
- "Elevate {baseAssetTypeName} to {targetBaseline} baseline"
- Triggered by asset: {assetName} — view link
- Program baseline: {L} · Proposed subtype: {elevatedSubtypeName}
- Delta controls: {count} (expandable list grouped by family)
- Rationale textarea (required on both Approve and Reject)
- Action buttons: Approve / Reject

Only users with the `ciso` role (or admin) see these cards and can act on them.

### 5. On Approve

All side effects happen in `approveBaselineElevation(recId)`:

1. Add `elevatedSubtypeName` to `state.customAssetTypes`.
2. Set `state.customAssetTypeGroups[elevatedSubtypeName] = headerGroup` so it appears under the same group as the base type in the Asset Type Library.
3. Migrate the triggering asset: set `asset.type = elevatedSubtypeName`.
4. Scan all other assets on the base type. For each where computed `assetImpact ≤ targetBaseline` AND `assetImpact > state.baseline`, migrate to the new subtype as well. (Assets at program baseline stay on base type.)
5. For each delta control, add an entry to `state.controlOwners[ctrlId]` with `{assignee: null, status: 'unassigned', subtypeScope: elevatedSubtypeName}` if not already owned. Do not overwrite existing owners.
6. Create a **policy update notification** for each affected domain owner (one per family appearing in `deltaControlIds`). Store in `recommendation.policyOwnerNotifications`. Each record: `{family, ownerName, ownerEmail, message: "New elevated-baseline controls in scope for <subtype>. Update the <family> policy with an 'Additional Measures for Elevated-Baseline Assets' section covering: <delta ctrl list>", acknowledged: false}`.
7. Surface these notifications on the relevant domain policy owner's dashboard (Domain Policies tab) as a blocking task — "Policy update required before control owners can be assigned."
8. Recommendation: `status = 'Approved'`, record `decisionDate`, `decisionBy`, `decisionRationale`.
9. `addAuditEntry('baseline', recId, 'Approved elevation of <baseType> to <target>; subtype <elevatedSubtype> created; <N> delta controls added')`.
10. `markDirty()`. Toast success. Re-render.

### 6. On Reject

1. Recommendation: `status = 'Rejected'`, record `decisionDate`, `decisionBy`, `decisionRationale`.
2. No subtype created, no controls added.
3. `addAuditEntry('baseline', recId, 'Rejected elevation of <baseType> to <target>; rationale: <...>')`.
4. The triggering asset's System Profile banner flips to the persistent "declined" state from step 1.
5. `markDirty()`. Toast. Re-render.

### 7. Naming convention

`{baseAssetTypeName} — Elevated ({Low|Moderate|High})`.

Examples:
- `Cloud IaaS — Elevated (Moderate)`
- `SaaS — Elevated (High)`
- `On-Prem Server — Elevated (Moderate)`

Keep "Elevated" as the consistent token so the elevated subtypes are easy to identify in the Asset Type Library and in asset-type dropdowns.

### 8. Banner + Asset Type Library surface

In the Asset Type Library (the view shown in the screenshot), elevated subtypes should render with a visual marker — e.g., a small red/amber "ELEVATED · {baseline}" chip next to the type name — so they're visibly distinct from regular custom types. SOURCE column can read "ELEVATED" instead of "CUSTOM" or "DEFAULT".

On the Reports dashboard, surface:
- "Baseline Elevation Recommendations" panel: Pending count (linked to review queue), Approved subtypes list, Rejected recommendations list.

## Policy owner notification (scope for this PR)

Scope is: **generate the notification records and surface them on the domain policy owner's dashboard as a blocking-status badge**. Do not build the in-policy "Additional Measures for Elevated-Baseline Assets" section editor in this PR — that's a follow-up. The owner can acknowledge the task by clicking "Acknowledge — policy updated" which marks the notification `acknowledged: true` and frees control owners to be assigned.

## Validation

1. `node --check js/app.js && node --check js/assets.js` pass.
2. Snapshot with `state.baseline = 'L'`. Create an asset, categorize to M. Verify: banner appears, recommendation appears in CISO review queue, Reports panel count increments.
3. As CISO, approve with rationale. Verify: new subtype `... — Elevated (Moderate)` appears in Asset Type Library under the correct header group with ELEVATED marker; triggering asset is now on that subtype; delta controls exist in state unassigned; domain policy owner sees a blocking task.
4. Create a second Cloud IaaS asset, categorize at M. Verify: no new recommendation; asset is auto-placed on the existing elevated subtype.
5. Create a third Cloud IaaS asset, categorize at H. Verify: new recommendation generated for H elevation.
6. Fresh snapshot. Asset at M → CISO rejects. Second asset at M → no re-ask; persistent rejection banner. Third asset at H → new recommendation.
7. Audit trail contains one entry per decision, not per render.
8. Rejection rationale is mandatory (blocked save if empty). Approval rationale is mandatory.
9. Reports dashboard "Baseline Elevation Recommendations" panel counts match the state.
10. Non-CISO users cannot approve/reject — action buttons are hidden or disabled.

## Non-goals for this PR

- The in-policy "Additional Measures for Elevated-Baseline Assets" section editor (notification only in V3).
- Automatic control-owner assignment for delta controls (stays unassigned until policy owner acknowledges).
- Retroactive migration sweep beyond same-base-type assets already in the inventory.
- De-selection tooling for control owners to mark delta controls inapplicable (that goes on the Control Owner tab in a later PR).

Execute autonomously. One focused PR. No KPMG references.
