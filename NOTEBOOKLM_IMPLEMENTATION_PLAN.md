# NotebookLM Review — Implementation Plan for Cursor

This plan operationalizes the feedback from the NotebookLM podcast review of the Larsen Cyber GRC Wizard (transcript: `GRC transcript.docx`, uploaded 2026-04-22). Each task is a self-contained prompt you can paste into Cursor. Tasks are ordered by a mix of **compliance risk** (auditability first) and **user impact** (data-loss protection before UX polish).

All line numbers below are anchors for the state of `js/app.js` as of 2026-04-22 and will drift — use `grep` / Cursor's symbol search to locate the actual site before editing.

---

## Priority 0 — Compliance integrity (do first)

### Task 1. Remove phantom placeholder owners from any path that can be saved or exported

**Why:** The podcast's sharpest critique. `prefillFakeOwners()` (line ~4070) and `prefillFakeControlOwners()` (line ~4100) inject fake identities ("Alex Rivera", "Jordan Patel", etc.) into `state.domainOwners` and `state.controlOwners`. If a user finalizes a program with those values in place, the system produces attestations signed by non-existent people, which violates non-repudiation and invalidates the audit chain.

**Cursor prompt:**

> In `js/app.js`, refactor the fake-owner prefill paths to be clearly marked as demo-only and to never leak into a finalized program.
>
> 1. Rename `prefillFakeOwners` → `prefillDemoOwners` and `prefillFakeControlOwners` → `prefillDemoControlOwners`. Update all call sites and UI labels.
> 2. When demo owners are written to `state.domainOwners` or `state.controlOwners`, tag each record with `isDemoPlaceholder: true`.
> 3. In `cisoFinish()` (line ~2297), `confirmSubmitDomainPolicy()` (line ~7493), `submitControlDesign()` (line ~9324), `submitSSP()` (line ~10541), and any other finalization path, iterate over all owner records and **block submission** if any record has `isDemoPlaceholder: true`. Show a toast: "Demo placeholder owners detected. Replace `<list of placeholder names>` with real people before submitting." Keep users on the current step.
> 4. In `exportProgramJson()` (line ~1236), surface a modal warning before allowing export if demo placeholders exist: "This program contains demo placeholder owners. Export anyway for testing, or cancel to replace them first."
> 5. In the ownership rendering in Step 5 (`renderCISOStep4b`, ~line 3743) and the control-owner card (`step4CardFill`, ~7377), add an amber "DEMO" badge next to any `isDemoPlaceholder: true` record, and remove the badge the moment the user edits the name/email.
>
> Do not delete the demo prefill entry points — they are useful for portfolio walkthroughs. Just make sure demo data is visually flagged and cannot silently finalize.

---

### Task 2. Add a field-level change log (not just semantic audit trail)

**Why:** The podcast called the missing audit trail "the single biggest missing feature." The semantic `auditTrail` at `addAuditEntry()` (line ~1173) covers state transitions (submit, approve, return, merge) but not field-level edits. For 800-53 auditability we need: **fieldName, oldValue, newValue, userId, timestamp**.

**Cursor prompt:**

> In `js/app.js`, add a lightweight field-level change log alongside the existing semantic `auditTrail`.
>
> 1. Add a new state key `changeLog: []` in the `state` declaration at line ~1032. Each entry shape: `{ t: ISO timestamp, u: userId||'admin', p: 'state.path.to.field', o: oldValue, n: newValue }`. Cap the array at 2000 entries (shift-truncate FIFO).
> 2. Add a helper `logFieldChange(path, oldVal, newVal)` near `addAuditEntry`. It should no-op when `oldVal === newVal` (deep-equal for objects), capture `state.currentUserId || 'admin'`, and push to `state.changeLog`.
> 3. Wire it into the highest-signal setters: `setDomainOwner` (~4026), `setCtrlOwner` (~7435), `setCtrlStatus` (~8745), `setCtrlField` (~8753), `setCtrlOwnerField` (~8759), `setEvidenceField` (~8778), `setSSPAttestation` (~10532), `setPolicyCustodian` (~5552), `setDomainCustomName` (~5291), `setDomainDeadline` (~3553), `setPolicyPriority` (~3540), `setAssetOwnerReq` (~9082). For each, read the current value, call the mutation, then call `logFieldChange(...)` with both values.
> 4. Do NOT instrument every keystroke on textareas (roles, requirements, policy content). Instead, add a `blur` listener pattern: on `onblur`, if the new value differs from the pre-focus snapshot, log a single entry. Implement this by storing `data-prev` on the element at focus and comparing at blur.
> 5. Add a new section in `renderAuditTrailPanel` (line ~12256) that toggles between "Events" (existing `auditTrail`) and "Field changes" (new `changeLog`), with a simple table: Time, User, Field, From, To. Make it filterable by user and by date range.
> 6. Update `resetStateToDefaults()` path via the existing `STATE_DEFAULTS` clone — no extra code needed if step 1 is done correctly.

---

### Task 3. JSON import schema validation

**Why:** `importProgramFromFile` (line ~1253) accepts any JSON object. A missing bracket or mis-typed field corrupts running memory immediately.

**Cursor prompt:**

> Harden `importProgramFromFile` at line ~1253 in `js/app.js` with strict schema validation before touching `state`.
>
> 1. Add a helper `validateProgramShape(parsed)` that returns `{ ok: true }` or `{ ok: false, errors: [...] }`. It should check:
>    - All required scalar fields exist and are the right primitive type: `baseline` in `['L','M','H', null]`, `privacyOverlay` boolean, `orgName` string, etc.
>    - All required container fields are the right shape: `users` is an Array, `domainOwners` is a plain object, `assets` is an Array, `auditTrail` is an Array, etc.
>    - Unknown top-level keys produce a WARNING (log to console, allow import) but unknown types (e.g. `users: "not an array"`) are a hard error.
>    - Drive the check from `STATE_ALLOWED_KEYS` + `STATE_DEFAULTS` — for each key, confirm the imported value's type matches the default's type.
> 2. Update `importProgramFromFile` to call `validateProgramShape`. On failure, show a modal (not a toast) listing the first 5 errors, and do NOT mutate `state`.
> 3. Before calling `applyLoadedState(saved)`, snapshot the current state as an auto-save named `Pre-import backup <ISO timestamp>` using the existing `saveCurrentSnapshot()` helper (line ~13005). Surface a toast: "Current program saved as auto-backup snapshot before import."

---

## Priority 1 — Data-loss protection

### Task 4. `beforeunload` warning + flush pending debounced save

**Why:** 3-second debounce means a tab close after 20 minutes of typing can lose the last sentence. The browser's native "Leave site?" dialog is the standard guardrail.

**Cursor prompt:**

> Add a `beforeunload` guard to `js/app.js`.
>
> 1. At app-init time (the same place other `window.addEventListener` calls live), register: `window.addEventListener('beforeunload', function(e) { ... })`. Inside: if `window.isDirty === true`, call `saveToStorage()` synchronously to flush the pending debounced write, then set `e.preventDefault(); e.returnValue = '';` so the browser shows its native leave-site dialog.
> 2. Do NOT show the dialog when `isDirty` is false — that annoys users.
> 3. After `saveToStorage()` succeeds, leave `isDirty = false` so if the user cancels the unload they don't get re-prompted immediately.

---

### Task 5. Pre-restore backup snapshot + confirmation modal

**Why:** `loadSnapshotByIndex` / `loadSnapshotByData` replace state wholesale with no warning. Demo-load misclick destroys work.

**Cursor prompt:**

> In `js/app.js` (`renderSnapshotsModal` ~13057, `loadSnapshotByIndex` ~13047, `loadSnapshotByData` ~13031, `loadDemoSnapshot` ~13053), add restore safety.
>
> 1. Before ANY snapshot load replaces `state`, auto-save the current state as a snapshot named `Auto-backup before restore <ISO>`. Reuse `saveCurrentSnapshot(name)`.
> 2. Replace the current silent load with a confirmation modal. The modal shows: snapshot name, saved timestamp, org, and a small diff summary (count of controls, policies, users in the snapshot vs. current). Implement diff by comparing top-level arrays/object key counts only — don't do a full JSON diff.
> 3. Provide two buttons: "Restore and replace current program" (primary) and "Cancel". Disable the primary button until the user checks a "I understand this will replace my current program" checkbox.
> 4. Auto-restore backups should appear at the top of the snapshot list with a 🛟 icon and be pruned to the last 5 to avoid bloating localStorage.

---

### Task 6. Base64 evidence image uploads (≤100 KB, PNG/JPG)

**Why:** Control owners cannot attach visual proof. Full files would blow past localStorage quota, but small compressed screenshots encoded as base64 fit inside the existing `controlEvidence` structure.

**Cursor prompt:**

> Add base64-encoded small-image evidence uploads to the Control Owner wizard in `js/app.js`.
>
> 1. In `renderControlDetailForm` (line ~8448) where the evidence list renders (look for `addCtrlEvidence` at 8766 and the list around there), add an `<input type="file" accept="image/png,image/jpeg" onchange="handleEvidenceImageUpload('${ctrlId}', event)">` button labeled "Attach screenshot (≤100 KB)".
> 2. Implement `handleEvidenceImageUpload(ctrlId, ev)` near the other evidence helpers. It should:
>    - Reject files > 100 * 1024 bytes with a toast.
>    - Reject non-image MIME types.
>    - Use `FileReader.readAsDataURL`, then push onto the control's evidence array an entry like `{ kind:'image', name: file.name, dataUrl: reader.result, addedAt: ISO }`. Normalize existing evidence entries to have a `kind:'ref'|'url'|'image'` discriminator.
>    - Call `markDirty()`, re-render.
> 3. In the evidence render, detect `kind: 'image'` and render an inline `<img>` at max-width 240px with a remove button. Clicking the image opens it full-size in a modal.
> 4. In `buildPersistedPayload()` (line ~1204), confirm evidence arrays serialize correctly with their data URLs. Add a guard at save time: if the total string length of all dataUrls exceeds 3 MB (rough localStorage budget), show a warning toast but still save.
> 5. Log the upload via the new `logFieldChange` helper (from Task 2) with `{ p: 'controlEvidence.<ctrlId>.added', o: null, n: '<filename> (<bytes>)' }`.

---

## Priority 2 — UX polish

### Task 7. Make deselected / unimplemented controls visually loud, not quiet

**Why:** Current CSS fades deselected controls with low opacity, which hides risk from reviewers. Auditors skim past them.

**Cursor prompt:**

> In `css/app.css` and `js/app.js`, change the visual treatment of deselected and unimplemented baseline-required controls.
>
> 1. In `css/app.css`, replace any `.deselected` / `.control-deselected` rule that sets `opacity: 0.4` (or similar) with a clear **warning** treatment: thin red left-border (`border-left: 3px solid #dc2626;`), light red tint (`background: #fef2f2;`), and a "DESELECTED" pill label. Keep the text fully legible (no opacity drop).
> 2. In the control library filter (`renderControlLibraryView`, ~line 7587) and reports dashboard (`renderProgramDashboard`, ~11324), add a red "⚠ N baseline-required controls deselected" callout at the top when `state.controlStatus` contains any entry with `deselectDecision === 'Approved'` that is in the current baseline.
> 3. Add a filter chip `Deselected only` to the Control Library's existing status filter (state key `_controlLibraryStatusFilter`) so auditors can pull them up directly.

---

### Task 8. Bulk assignment for control owners

**Why:** 17+ controls per family. Current UI forces one-at-a-time clicks.

**Cursor prompt:**

> `batchAssignControlOwners(fam, overwrite)` already exists at line ~7447, but the UI is limited. Expand it.
>
> 1. In Policy Step 4 (`renderPolicyStep4`, ~7231) and the CISO wizard Step 5 owner cards, add a "Bulk assign" button that opens a modal listing all controls in the selected family with checkboxes, an owner dropdown populated from `state.users` filtered by `role === 'control-owner'`, and Apply / Cancel buttons.
> 2. On Apply, iterate the selected control IDs and call `setCtrlOwner(ctrlId, 'name'|'email'|'role', value)` for each. Use `requestAnimationFrame` to yield to the browser every 10 assignments to avoid freezing the tab — this addresses the podcast's concern about long synchronous loops.
> 3. Emit a single consolidated audit entry at the end: `addAuditEntry('control', fam, 'Bulk-assigned N controls to <owner name>')`.
> 4. Log each individual assignment via `logFieldChange` (from Task 2) so the field-level trail remains complete.

---

### Task 9. Tablet / mobile responsive layout (768 px breakpoint)

**Why:** Executives review from tablets. Current CSS only has a `max-width: 900px` @media block — insufficient for tablet workflows.

**Cursor prompt:**

> In `css/app.css`, add a tablet-first breakpoint at 768 px.
>
> 1. At 768px and below:
>    - Collapse the sidebar to a top hamburger menu. The existing `nav.sidebar` should slide in from the left when the hamburger is tapped, backed by a scrim overlay.
>    - Stack the top-right toolbar (Save / Export / Import / Snapshots / Reset) below the main content header instead of floating over it.
>    - Make wizard step-nav rails (`.step-nav`) collapse into a horizontal scrollable pill bar above the wizard content instead of a left rail.
>    - Bump touch target sizes for buttons to min 44x44 CSS pixels.
> 2. Add a small JS helper `setupMobileNav()` called from app init that toggles a body class when the hamburger is tapped. No framework — plain `classList.toggle`.
> 3. Test that the 5 wizards (CISO, Policy, Control, Asset, Tester) remain usable at 768px × 1024px (iPad portrait).

---

## Priority 3 — Nice-to-have / stretch

### Task 10. Undo for structural actions (merge, delete section, deselect control)

**Why:** Full-state undo is memory-prohibitive. But structural actions are few and scoped; they can be undone via targeted inverse operations.

**Cursor prompt:**

> Add a scoped undo for high-risk structural actions. Do NOT attempt full-state history.
>
> 1. Add `state._undoStack: []` (max 20 entries). Each entry: `{ type: 'merge'|'unmerge'|'deleteSection'|'deselectControl', payload: {...}, invertedAt: ISO }`.
> 2. In `mergePolicy` (~3942), `unmergePolicy` (~3957), `removeSection` (~3175), `removeDomainSection` (~7201), and the control deselect confirm path (~8086), before applying the mutation, push an inverse record onto `_undoStack`.
> 3. Add a small floating "Undo last action" toast that appears for 10 seconds after any of those actions and fires the inverse.
> 4. Clear `_undoStack` on reset and on program finalization.

---

## Validation before you push any of these

1. `node --check js/app.js` — no syntax errors
2. Load XMPL demo snapshot → walk the CISO wizard → finalize → confirm demo owners block finalization (Task 1) and unblock after you edit the names
3. Export JSON → edit the export in a text editor to remove a bracket → re-import → confirm validation error modal (Task 3)
4. Type in ISP step 3 for 5 seconds, close the tab → confirm beforeunload fires (Task 4)
5. Open Snapshots → load demo → confirm pre-restore auto-backup appears at top (Task 5)
6. Attach a 50 KB PNG as control evidence → refresh the tab → confirm it reloads from localStorage (Task 6)
7. Reports → Audit Trail panel → toggle to Field Changes → confirm entries appear from your edits (Task 2)

---

## Suggested sprint shape

- **Sprint 1 (compliance):** Task 1, Task 2, Task 3 — nothing else should ship before these.
- **Sprint 2 (data loss):** Task 4, Task 5, Task 6.
- **Sprint 3 (UX):** Task 7, Task 8, Task 9.
- **Sprint 4 (stretch):** Task 10.
