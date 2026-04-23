# Larsen Cyber GRC Wizard

Browser-based NIST SP 800-53 Rev. 5 program management tool. No backend, no account, and no external data transfer during normal use.

**[Launch the tool](https://jacobolstadlarsen.github.io/larsen-cyber-grc-wizard/)**

## What It Covers

The application guides teams through a full governance workflow:

- CISO setup wizard (baseline, privacy overlay, PM controls, ISP, policy ownership)
- Domain policy ownership and lifecycle tracking
- Control owner assignment and control implementation status
- Asset and process mapping for SSP-style attestations
- Control testing workflow and assessment summary views
- Dashboard/reporting views, users/roles, snapshots, and JSON import/export

## Current Architecture

This repository uses a split static architecture:

- `index.html` — UI shell and tab containers
- `css/app.css` — application styling
- `js/app.js` — core logic, state management, rendering, persistence
- `js/nist-control-text.js` — NIST control requirement text lookup

Technical characteristics:

- no framework, no build pipeline, no external runtime dependencies
- program state stored in `localStorage` under `larsen-grc-v1`
- saved snapshots stored in `localStorage` under `larsen-grc-snapshots`
- existing users with data under the legacy `hawthorn-grc-v1` / `hawthorn-grc-snapshots` keys are automatically migrated on first load

## Local Development

1. Serve the repository root from any static file server, for example `python -m http.server 8765` or `npx serve .`.
2. Open the served URL in a modern browser (the app needs `localStorage`).
3. Use the Snapshots modal to load a built-in demo program, or start a fresh one.

### Smoke test before shipping

1. `node --check js/app.js` — syntax validation.
2. Walk the CISO wizard end to end (Step 1 → Step 5, including the "different approver" path on Step 3).
3. Load each built-in XMPL snapshot, then Reset, and confirm no ghost state remains.
4. Export JSON, re-import it, and confirm the program round-trips cleanly.

## Documentation

- `README.md` — project overview (this file)
- `CLAUDE.md` — architecture summary and conventions for AI-assisted edits
- `CONTROL_OWNER_SPEC.md` — combined compliance + UX specification for the Control Owner wizard
- `NOTEBOOKLM_IMPLEMENTATION_PLAN.md` — prioritized task list from the 2026-04 NotebookLM review

## License

MIT
