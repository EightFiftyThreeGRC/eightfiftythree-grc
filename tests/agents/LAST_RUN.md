# Agent QA — Last Run Scorecard

## Round 2 — 2026-08-28 (recommendation follow-through)

Shipped as commit `ee6d764`. **The agent regime could NOT run this round** — agents 2, 3
and 4 all terminated with HTTP 429 (org monthly spend limit). The orchestrator ran their
highest-value checks directly instead; anything below marked *(self-run)* was verified by
script in headless Chromium, not by an independent agent. A full agent pass — especially
Agent 3 on the new mappings and Agent 6 on the diff — is still owed for this round.

| Area | Result | Evidence |
|---|---|---|
| Syntax (all 21 modules) | PASS | `npm run check:js` |
| Playwright suite | PASS | 9/9 specs |
| Role & access matrix *(self-run)* | PASS | 8/8 roles match ROLE_TABS incl. new `csfprofile`; out-of-role `showTab('csfprofile')` redirects for asset-owner / custodian / approver |
| Setup gate *(self-run)* | PASS | Control/Policy/Asset all hide step nav pre-setup; all restore after setup; `.step-nav` only exists on the setup wizard and stays visible there |
| AO decision set *(self-run)* | PASS | 4 options (ATO / ATO-Conditions / IATT / Denial); conditions-required copy present; expiries 1095 / 364 / 89 days |
| CSF Profile tab *(self-run)* | PASS | Renders standalone with all six Functions, detail toggle, CSV export; Framework alignment shows strip + link, no duplicate table |
| Law crosswalks *(self-run)* | PASS | CM-2 → "ITGC: Program Changes"; AC-2 → §314.4(c)(1); per-control overrides correctly inherit the family row |
| Console errors | PASS | none across every surface exercised |

### Known gap carried into round 2
Agent 3's compliance judgement on the 18 enhancement-level CSF tags and the new SOX/GLBA
crosswalks has **not** been obtained. They were built from Rev 5 enhancement titles and
16 CFR §314.4 subsections and are internally consistent (every token resolves, no
duplicate keys, all 298 base controls still mapped, reach 88/106), but an independent
compliance review is the missing check.

## Round 1 — 2026-08-27 (full regime, commit 63e5001)

| # | Agent | Model | Result |
|---|-------|-------|--------|
| 0 | Static integrity | haiku | PASS |
| 1 | Functional smoke | sonnet | PASS — caught the missing Export/Import/Snapshots toolbar |
| 2 | Role & access | sonnet | PASS |
| 3 | Compliance content | opus | PASS (avg 4.0; crosswalks 3 → 5 after fixes) |
| 4 | UX, copy & a11y | sonnet | PASS after 3 fix rounds |
| 5 | Data integrity | sonnet | PASS after fixes — 4 real persistence bugs |
| 6 | Independent verifier | sonnet (fresh) | GREEN |

## Open / accepted
- Respond/Recover remain thin at the **Low** floor by design: the enhancement tags are
  Moderate/High controls, so they enter a profile through baseline elevation
  (RS 4→8→11, RC 1→4→5 across L/M/H). Not a defect.
- 18 of 106 CSF outcomes are still unreached — GV strategy outcomes, GV.PO-02 (lives in
  ISP review text), ID.IM-03, DE.CM-06/AE-04/AE-08, RS.AN-08, RC.RP-06, RC.CO-03/04.
  800-53 does not cleanly express these; the UI shows them honestly.
- FERPA / FISMA / PCI stay tracking-only lenses with no control-level crosswalk.
- Legacy hawthorn-prefix data is superseded unread when both legacy prefixes exist
  (documented as deliberate precedence).
