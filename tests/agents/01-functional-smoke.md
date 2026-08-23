# Agent 1 — Functional Smoke (model: sonnet, bash + browser/Playwright)

Goal: core flows work on a locally served copy. Use a local server so the live site's browser storage is untouched.

## Setup
- Serve the repo: `npx serve` or `python3 -m http.server` from repo root (in sandbox, copy repo to /tmp first if the OneDrive mount misbehaves).
- Run existing suite: `npm run test:e2e` (Playwright, `tests/e2e/smoke.spec.js`). Record pass/fail per spec.

## Extended checklist (Playwright or scripted browser)
1. Landing `index.html` loads; "Launch app" navigates to `app.html`; no console errors.
2. `app.html` loads; all `js/*.js` return 200; no console errors at idle.
3. CISO wizard: complete all 8 steps (Organization → Profile → Baseline → Reg mapping → PM Controls → InfoSec Policy → Consolidate → Assign Owners) with minimal valid inputs; `cisoComplete` becomes true; Command Center appears.
4. Finalize gating: clear a domain owner's email, attempt finish → must be blocked with a toast naming the unassigned domain count.
5. Snapshots: load each XMPL snapshot, then Reset → no ghost state (sidebar badges/counts reset).
6. Export JSON → Import same JSON → state round-trips. Import malformed JSON / wrong baseline value → rejected by `validateProgramShape` with a clear error.
7. Reports tab renders with 0 console errors both pre-setup (empty state) and post-setup (dashboard incl. Team workload panel).

## Output
Table: Step | Result (pass/fail) | Evidence (console error text / screenshot ref). End with PASS/FAIL.
