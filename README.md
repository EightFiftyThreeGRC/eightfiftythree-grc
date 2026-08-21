# EightFiftyThree GRC

Browser-based NIST SP 800-53 Rev. 5 program management tool. No account, no backend — your program lives in your browser, and you switch between program roles to see each person's workspace.

**[Launch the tool](https://eightfiftythreegrc.github.io/eightfiftythree-grc/)** (repo: [EightFiftyThreeGRC/eightfiftythree-grc](https://github.com/EightFiftyThreeGRC/eightfiftythree-grc))

If the link shows “404 / There isn’t a GitHub Pages site here,” open the repo on GitHub → **Settings → Pages** → set **Source** to **GitHub Actions**, then push to `main` (or run the **Deploy GitHub Pages** workflow manually).

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
- Risks & Issues workspace (triage queue, risk register, POA&M-compatible issues when PM-4 is selected)
- Authorizing-Official decision capture (ATO / IATT / Denial) with conditions, expiry, residual-risk narrative, and digital signature
- Dashboard/reporting views, users/roles, snapshots, and JSON import/export

## Architecture

Zero-dependency, no-build static web app. UI and logic run client-side and the program is stored only in this browser's `localStorage`. There is no login: you work in Admin mode or impersonate a rostered person from the sidebar role picker.

```
index.html                  public landing page (links to app.html)
app.html                    UI shell, sidebar, tab containers, role picker overlay
css/landing.css             landing page styles
css/app.css                 all app styles (single mobile breakpoint)
js/session.js               acting identity + permission / separation-of-duties helpers
js/nist-control-text.js     verbatim NIST 800-53 control text lookup
js/core.js                  STATE shape, defaults, persistence, audit/change log
js/program.js               CISO setup wizard + demo snapshots
js/policies.js              Domain Policies wizard + policy library
js/controls.js              Control Implementation wizard + control library
js/assets.js                Assets & SSP wizard + asset libraries
js/baseline-elevation.js    Baseline elevation triggers and review flow
js/authorization.js         AO decision data + decision modal
js/frameworks.js            Framework alignment tab (ISO 27001 / SOC 2 / HIPAA crosswalks)
js/hub.js                   Command Center home tab
js/reports.js               Reports & Dashboard, audit/change-log, review queues
js/admin.js                 Users & roles, profile / account menu
js/app.js                   App shell: tabs, snapshot modal, beforeunload
scripts/check-all.js        syntax check across all JS modules (npm run check:js)
tests/e2e/                  Playwright smoke tests (npm run test:e2e)
```

`js/testing.js` exists as a stub for legacy snapshot/export references but is **not** loaded by `app.html`.

Technical characteristics:

- no framework, no build pipeline
- program state stored in `localStorage` under `eightfiftythree-grc-v1`
- saved snapshots stored in `localStorage` under `eightfiftythree-grc-snapshots`
- existing users with data under the legacy `larsen-grc-*` or `hawthorn-grc-*` keys are automatically migrated on first load

## Design Constraints (What This Deliberately Is Not)

These are intentional trade-offs, not gaps:

- **Client-side trust boundary.** All application logic runs in the browser and there is no backend — your program never leaves the machine you typed it on. Nothing is transmitted anywhere.
- **Roles are a modelling tool, not enforced access control.** Anyone with the browser can switch into any role, so role separation exists to design and rehearse a program's accountability structure, not to keep one colleague out of another's workspace. Treat it as a program-management workspace, not a vault for secrets.
- **Zero dependencies, no build.** No framework, bundler, or npm supply chain. The source that ships is the source that runs — the whole app is auditable in an afternoon and loads instantly.
- **Portable by default.** The top toolbar's **Export JSON** writes your entire program to a file you control; **Import JSON** restores it. Your program can leave this app at any time.
- **Not** a 3PAO, a substitute for an assessor's judgment, a system-of-record you would run without your own backups, or multi-tenant SaaS.

### Self-Hosting

Nothing ties the app to a hosted instance — it is static files with no server component. Serve the repo root from any static file server, or fork it and deploy your own GitHub Pages. Combined with first-class JSON export, a cautious adopter always has an out: keep local backups of the exported JSON.

## Roadmap

EightFiftyThree GRC is a single free tool — there is no paid tier, and no feature is held back for one. Candidate directions, if they prove worth building, land in this app:

- **OSCAL export** — emit SSP / component-definition content as NIST OSCAL for interoperability with federal tooling.
- **CMMC / NIST SP 800-171 crosswalk** — extend the framework-alignment tab so defense-industrial-base SMBs get a zero-install on-ramp to 800-171 / CMMC Level 2.

These are candidates, not commitments — prioritized by whether they make the tool a more convincing, useful program-management workspace.

## Local Development

1. Serve the repository root from any static file server, for example `python -m http.server 8765` or `npx serve .`.
2. Open `app.html` in a modern browser — it loads straight into Admin mode.
3. Complete program setup, or import an existing program JSON export.

### Smoke test before shipping

1. `node --check js/<each file>.js` — syntax validation across all modules.
2. Walk the CISO wizard end to end (Step 1 → Step 5, including the "different approver" path on Step 3).
3. Reset the program and confirm it returns to a fresh state.
4. Add roster users, then use the sidebar profile button to act as each one and confirm they see only the intended tabs.

## Documentation

- `README.md` — project overview (this file)
- `CLAUDE.md` — architecture summary and conventions for AI-assisted edits
- `CONTROL_OWNER_SPEC.md` — combined compliance + UX specification for the Control Owner wizard

## License

This project is licensed under the [MIT License](LICENSE).
