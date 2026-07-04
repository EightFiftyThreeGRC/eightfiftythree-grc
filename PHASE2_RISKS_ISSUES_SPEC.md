# Phase 2 — Risks & Issues

Implemented in `js/risk.js` (tab id `risk`). Replaces legacy `poamItems` / Findings & POA&M tab.

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
- Legacy `poamItems[]` migrates to `issues[]` on load

## PM-4 / POA&M labeling

When `state.pmControls['PM-4']` is selected in program setup, the issues sub-view uses **Issues (POA&M)** labeling and CSV export. Otherwise **Issues** only.

## Triage hooks (computed, not auto-created)

H1–H5: failed/partial SSP attestations, missed control deadlines, test failures, ATO conditions. CISO/ISSM/program owner promotes or dismisses.

H7: **Raise issue** on SSP review per-control comment row.

## Separation of duties

- Risk acceptance: program owner or boundary AO; not the risk owner
- Issue verification: verifier ≠ assignee
- Triage: program owner, CISO, ISSM

## UI

Sidebar **Risks & Issues** → Triage | Risk register | Issues. Command Center KPI + next actions. Reports posture panel.
