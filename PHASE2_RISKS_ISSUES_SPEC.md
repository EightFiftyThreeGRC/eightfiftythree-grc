# Phase 2 — Risks & Issues

**Status: shipped (2026-07-04)** · Module: `js/risk.js` · Tab id: `risk`

Replaces legacy `poamItems` / `js/poam.js` / Findings & POA&M tab.

## Taxonomy

| | **Risk** | **Issue** |
|---|---|---|
| Nature | Potential adverse event | Actual deficiency |
| Scored by | Likelihood × Impact | Severity |
| Resolved by | Accept / Mitigate / Transfer / Avoid | Remediate → verify → close |

## State keys (`js/core.js`)

- `risks[]` — risk register
- `issues[]` — POA&M-compatible issues (CA-5)
- `riskTriageDismissals{}` — dismissed suggestion keys with `{ by, at }`
- Legacy `poamItems[]` → `issues[]` via `migratePoamItemsToIssues()` on load
- UI: `_riskView`, `_riskFilter`, `_issueFilter`, `_sidebarRiskExpanded`, `_phase2SidebarFirstLive`, `_selectedRiskId`, `_selectedIssueId`

## PM-4 / POA&M labeling

When `state.pmControls['PM-4']` is selected in CISO wizard, the issues sub-view uses **Issues (POA&M)** labeling and CSV export.

## Triage hooks (computed, not auto-created)

| Hook | Signal | Suggested record |
|------|--------|------------------|
| H1 | SSP `Does Not Comply` | Issue |
| H2 | SSP `Partially Complies` | Issue |
| H3 | Control past deadline, not implemented | Issue |
| H4 | Control test `Fail` | Issue |
| H5 | ATO condition | Issue |
| H7 | SSP review **Raise issue** button | Issue (manual) |

H6 (policy exception → risk) not yet wired.

## Separation of duties

- Risk acceptance: program owner or boundary AO; not the risk owner
- Issue verification: verifier ≠ assignee
- Triage promote/dismiss: program owner, CISO, ISSM

## UI (shipped)

- **Top phase roadmap** — `renderProgramPhaseBar()` in `js/hub.js` (Phase 1 / 2 / 3 lifecycle; Phase 3 placeholder)
- **Sidebar** — `#sidebar-phase2-section` appears after `cisoComplete`; expandable **Risk inventory** + **Issue inventory** via `renderSidebarRiskInventory()`
- **Tab** — Triage | Risk register | Issues (no "Phase 2" prefix in workspace labels)
- **Command Center** — open risks & issues KPI, next actions, summary strip
- **Reports** — Risk & issue posture panel

## Backlog (Phase 2 polish / Phase 3)

1. **Phase 3 — Continuous monitoring** — in-prod control testing, process audits, high-risk area internal audit workflows (top roadmap slot reserved)
2. H6 — policy exception → suggested risk
3. `Risk Accepted` issue workflow with linked risk acceptance record
4. XMPL demo snapshot seed data for risks/issues
5. Dismissed triage archive view (audit-only record exists today)
6. Auto re-surface triage when signal worsens after dismiss

## Validation

```bash
npm run check:js
npm run test:e2e
```

Deploy: push to `main` → `.github/workflows/deploy-pages.yml` → GitHub Pages.
