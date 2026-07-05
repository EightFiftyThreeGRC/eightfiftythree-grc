# QA Run Scorecard — 2026-07-04 (run 2: follow-up fix pass)

Baseline commit: `e1045c8` (nothing committed between runs — the working tree carries both rounds). Verdict: **GREEN** — round-1 agent findings addressed, all changes approved by a fresh independent verifier.

## Round 1 (same day, earlier): full agent regime

| # | Agent | Model | Result | Notes |
|---|-------|-------|--------|-------|
| 0 | Static integrity | haiku | **PASS** | All js pass `node --check`; branding + storage keys clean. |
| 1 | Functional smoke | sonnet | **PASS** (coverage gaps) | No browser installable in sandbox; static verification only for UI flows. |
| 2 | Role & access matrix | sonnet | **PASS** | ROLE_TABS enforced in showTab; SoD + AO gating re-validated in submit handlers; all demo-placeholder gates wired. |
| 3 | Compliance content | opus | **PASS** (5.0/5) | Baseline counts match 800-53B exactly; 22 control texts verbatim; ISO/SOC 2/HIPAA crosswalks defensible. |
| 4 | UX, copy & a11y | sonnet | FAIL → **PASS** on re-run | Print clipping + stale copy fixed round 1. |
| 5 | Data integrity | sonnet | FAIL → **PASS** on re-run | 4 ghost-state keys + snapshot bleed-through fixed round 1. |
| 6 | Independent verifier | sonnet (fresh) | **APPROVE** | All round-1 diffs approved (one false REJECT from mount truncation, re-verified). |

Round-1 fixes: 4 missing state keys (`controlDesignSubmission`, `sspInterconnections`, `removedBuiltInAssetTypeKeys/Groups`); `resetStateToDefaults()` before snapshot restore; "4 steps"→"7 steps" copy (x4); `@media print` un-clip + page-break rules.

## Round 2: open-findings fix pass (8 files + CLAUDE.md)

All items verified by a fresh independent verifier — **APPROVE on all 8 files**, zero regressions found, all removed symbols grepped to zero references, all contrast ratios independently recomputed.

1. **js/core.js** — 20 transient `_`-prefixed UI keys added to the `state` literal (type-matched defaults, before STATE_DEFAULTS capture) so Reset and persistence cover them; new `exceedsMaxDepth` guard (max 24) rejects absurdly nested JSON in `validateProgramShape` (deepest legitimate nesting is ~7).
2. **js/app.js** — orphaned walkthrough-video modal code deleted; replaced with a generic Escape-to-close handler for all dynamic modals (AO decision, risk/issue modals, snapshot, restore-confirm, reset) that routes through each modal's own close function; `enhanceKeyboardAccessibility` selector list extended (`.baseline-card`, `.privacy-toggle-card`, `.control-substep-item`, `.sidebar-sub-item`) via a shared const and now re-runs after wizard step re-renders.
3. **js/controls.js** — `aria-label` on all 10 bulk-select/row checkboxes; Control Design steps 2–4 empty states upgraded to the step-1 pattern (copy + CTA).
4. **js/authorization.js** — phantom `isAdminSession` ternary simplified to `!state.currentUserId` (behaviorally identical).
5. **js/admin.js** — unreachable `defaultTab='tester'` fallback removed.
6. **css/app.css** — wizard-video CSS removed; WCAG AA contrast fixes: chip text tones darkened (green 4.6:1, amber 6.4:1, red 5.3:1, blue 5.5:1, gray 6.9:1), `--text-muted` #86868b→#6e6e73 (5.1:1), `.sp-evidence-badge` 6.4:1.
7. **app.html** — wizardVideoOverlay markup removed; `?v=` cache-busters bumped to `20260704d` for all files edited across both rounds.
8. **index.html** — framework-lens paragraph now distinguishes per-control crosswalks (ISO 27001/SOC 2/HIPAA) from statutory obligation tracking (GLBA/FERPA/SOX/FISMA/state privacy) — removes the coverage overclaim.
9. **CLAUDE.md** — doc drift corrected: actual script load order + cache-buster convention documented; breakpoint count; snapshots live in js/core.js; demo-gate call-site list updated (`finalizeSarAndHandoff` doesn't exist); role tab lists include `home`; `customProgramRoles` extensibility and showTab enforcement noted.

## Remaining open findings (deliberately deferred)

- **Medium**: no `<label for>` associations codebase-wide (~163 visual-only labels) — retrofit highest-traffic wizard steps first; modals still lack a focus trap / initial-focus placement (Esc-to-close now exists).
- **Low**: XMPL snapshots stale vs current schema (harmless since restore resets first; regenerate when convenient); reports.js section headings are styled divs rather than `<h2>` (screen-reader heading navigation).
- **Coverage gap**: no browser in the QA sandbox — Playwright suite and click-through checks still need a browser-capable run (or the README operator runbook) before the next push to `main`.

## Environment notes

- OneDrive/sandbox mount artifact (both runs): after Windows-side edits, the bash mount serves files truncated at their pre-edit byte length. Never syntax-check or diff edited files from the mount without re-verifying via the Windows-side Read tool; reconstruct from `git show HEAD:` + exact edits in /tmp when needed. Never commit from the mount.
- app.html and index.html use CRLF line endings (git-tracked that way); use `diff --strip-trailing-cr` when comparing reconstructions.
