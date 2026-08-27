# Agent QA — Last Run Scorecard

Run date: 2026-08-27 (orchestrator: Claude, Cowork session)
Scope: full regime (Agents 0–6) ahead of the CSF-map expansion / CSF Profile / housekeeping push.

## Results

| # | Agent | Model | Result | Notes |
|---|-------|-------|--------|-------|
| 0 | Static integrity | haiku | PASS | Clean on first run — syntax, branding, storage keys, onclick escaping |
| 1 | Functional smoke | sonnet | PASS | 9/9 Playwright specs + 7 extended checks. Caught the missing Export/Import/Snapshots toolbar (removed with the Supabase era, never restored) — restored this run |
| 2 | Role & access | sonnet | PASS | Full ROLE_TABS matrix + SoD (issue verify, risk accept, atoCanDecide) clean; showTab redirect enforced |
| 3 | Compliance content | opus | PASS (avg 4.0 → crosswalks now 5) | Baselines exact vs 800-53B; CA-7 verbatim restore; 20 CSF-map remaps to official informative refs; ISO/SOC2/HIPAA crosswalk corrections; SOX honesty fixes — all applied + re-verified |
| 4 | UX, copy & a11y | sonnet | PASS (after 3 fix rounds) | Toolbar/phase-bar overlap, role-picker keyboard access, Tomás mojibake, step-line dedupe, profileSetupOverlay esc, chip contrast, print hides, responsive report grids — fixed + re-verified at 1280/900/380 |
| 5 | Data integrity | sonnet | PASS (after fixes) | poamItems migration dead-path, import reset-before-apply, 3 ghost state keys, XMPL_DOMAIN_SNAPSHOT coherence — fixed + harness re-verified |
| 6 | Independent verifier | sonnet (fresh) | GREEN | All files APPROVE / APPROVE-WITH-NITS; nits (esc-handler open-state guard, agent-00 stale exception, map comment) applied post-review |

## Open (accepted / roadmap)
- Respond/Recover outcome coverage is thin under the 1-1 primary rule (RS 5 / RC 1 base controls + 4 new enhancement tags). Broader enhancement-level tagging is the roadmap fix.
- AO decision set is ATO / IATT / Denial; consider "ATO with conditions" + 90-day IATT default (SP 800-37 R-4 alignment).
- Control tab pre-setup: step-nav buttons still advance through the setup-required empty state.
- Some filter/rename inputs lack accessible names (Low).
- Legacy hawthorn-prefix data is superseded unread when both legacy prefixes exist (documented as deliberate precedence).
