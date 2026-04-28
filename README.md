# EightFiftyThree GRC

Browser-based NIST SP 800-53 Rev. 5 program management tool. No backend, no account, and no external data transfer during normal use.

**[Launch the tool](https://jacobolstadlarsen.github.io/eightfiftythree-grc/)**

## Repository Status

This repository is the canonical source for the public **EightFiftyThree GRC** release.

- Intended for public GitHub upload and GitHub Pages deployment
- Root documentation is intentionally scoped to operator and contributor essentials
- Long-form internal planning prompts are kept out of root docs for cleaner public presentation

## What It Covers

The application guides teams through a full governance workflow:

- CISO setup wizard (baseline, privacy overlay, PM controls, ISP, policy ownership)
- Domain policy ownership and lifecycle tracking
- Control owner assignment and control implementation status
- Asset and process mapping for SSP-style attestations
- Authorizing-Official decision capture (ATO / IATT / Denial) with conditions, expiry, residual-risk narrative, and digital signature
- Dashboard/reporting views, users/roles, snapshots, and JSON import/export

## Architecture

Zero-dependency, no-build, no-server static web app. All logic runs client-side and state lives in `localStorage`.

```
index.html                  UI shell, sidebar, tab containers, role picker
css/app.css                 all styles (single mobile breakpoint)
js/nist-control-text.js     verbatim NIST 800-53 control text lookup
js/core.js                  STATE shape, defaults, persistence, audit/change log
js/program.js               CISO setup wizard + demo snapshots
js/policies.js              Domain Policies wizard + policy library
js/controls.js              Control Implementation wizard + control library
js/assets.js                Assets & SSP wizard + asset libraries
js/baseline-elevation.js    Baseline elevation triggers and review flow
js/authorization.js         AO decision data + decision modal
js/reports.js               Reports & Dashboard, audit/change-log, review queues
js/admin.js                 Users & roles, role picker, profile
js/app.js                   App shell: tabs, snapshot modal, beforeunload
```

`js/testing.js` exists as a stub for legacy snapshot/export references but is **not** loaded by `index.html`.

Technical characteristics:

- no framework, no build pipeline, no external runtime dependencies
- program state stored in `localStorage` under `eightfiftythree-grc-v1`
- saved snapshots stored in `localStorage` under `eightfiftythree-grc-snapshots`
- existing users with data under the legacy `larsen-grc-*` or `hawthorn-grc-*` keys are automatically migrated on first load

## Local Development

1. Serve the repository root from any static file server, for example `python -m http.server 8765` or `npx serve .`.
2. Open the served URL in a modern browser (the app needs `localStorage`).
3. Use the Snapshots modal to load a built-in demo program, or start a fresh one.

### Smoke test before shipping

1. `node --check js/<each file>.js` — syntax validation across all modules.
2. Walk the CISO wizard end to end (Step 1 → Step 5, including the "different approver" path on Step 3).
3. Load each built-in XMPL snapshot, then Reset, and confirm no ghost state remains.
4. Export JSON, re-import it, and confirm the program round-trips cleanly.
5. Sign in as each role (CISO, ISSM, Control Owner, Asset Owner, Custodian, Assessor, AO, Approver) and confirm the visible tabs match `ROLE_TABS`.

## Documentation

- `README.md` — project overview (this file)
- `CLAUDE.md` — architecture summary and conventions for AI-assisted edits
- `CONTROL_OWNER_SPEC.md` — combined compliance + UX specification for the Control Owner wizard

## License

This project is licensed under the [MIT License](LICENSE).
