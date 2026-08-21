# Agent 2 — Role & Access Matrix (model: sonnet, browser on LOCAL server only)

Goal: every role sees exactly its tabs; separation-of-duties rules hold.

## Checklist
1. Build a program (or load an XMPL snapshot), seed one user per role: ciso, issm, control-owner, asset-owner, custodian, assessor, ao, approver.
2. For each role, impersonate via the sidebar role picker and assert visible tabs match `ROLE_TABS` in `js/core.js` (read the current mapping first — it is the source of truth, not this file).
   - Spot expectations as of 2026-07: assessor → risk + reports; ao → asset + risk + reports + users, with an "Authorization status" panel + Record decision button on the Reports dashboard; no dedicated tester/ato tabs exist.
3. AO decision: `openAtoDecisionModal` only actionable when `atoCanDecide(boundary)` is true; non-AO roles never see Record decision.
4. SoD: issue verification must be blocked when verifier == assignee; risk acceptance only available to program owner / AO.
5. Demo-placeholder gating fires on every entry point: cisoFinish, policy submit, submitControlDesign, submitSSP, submitAtoDecision.
6. Admin mode (`currentUserId = null`) sees everything; a user with no assignments gets the scoped empty-state on Reports, not a blank page.

## Output
Matrix: Role | Expected tabs | Observed tabs | Match? — plus a findings table for SoD/gating checks. End with PASS/FAIL.
