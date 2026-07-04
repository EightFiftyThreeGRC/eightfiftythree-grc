# EightFiftyThree GRC — Agent QA Regime

Orchestrated multi-agent testing for the app. The orchestrator (Claude Fable, in Cowork) owns the master checklist, spawns specialist agents, gates fixes, and produces a scorecard. Pattern follows current multi-agent best practice: one narrow job per agent, tools scoped to that job, workers proven standalone before orchestration, tiered models for cost, and an independent verifier that never reviews its own work.

## Orchestration model

- **Orchestrator: Fable (this session).** Holds the manifest below, launches agents (parallel where independent, serialized for anything driving a browser), reviews each agent's findings, applies or rejects fixes, and re-runs the affected agent after any fix. Never lets an agent self-certify.
- **Checklists live in the repo** (`tests/agents/*.md`, one per agent) so runs are repeatable and diffs reviewable. Each checklist is the agent's prompt: goal, exact steps, pass/fail criteria, output format (structured findings table: severity / location / evidence / suggested fix).
- **Gate rule:** agents report; only the orchestrator edits code. Fix → re-run that agent → independent verifier reviews the diff.
- **Cadence:** Tier-0 every session; full regime before any push to `main` (Pages deploys straight from it).

## Agent roster

| # | Agent | Model | Why this model | Scope / checklist highlights |
|---|-------|-------|----------------|------------------------------|
| 0 | Static integrity | **Haiku** | Deterministic, mechanical | `node --check` all js; `npm run check:js`; branding scan (KPMG/Larsen/Hawthorn/Acme = fail, except migration shim); localStorage key names; unescaped quotes in generated `onclick`s; orphaned function references across modules |
| 1 | Functional smoke | **Sonnet** | Tool-driven, procedural | Serve repo locally in sandbox; run `npm run test:e2e` (Playwright); extend: 7-step CISO wizard happy path, snapshot save/load/reset (no ghost state), export→import JSON round-trip, malformed-import rejection |
| 2 | Role & access matrix | **Sonnet** | Procedural with judgment | Sign in as each role; assert visible tabs == `ROLE_TABS`; demo-placeholder gating blocks finalize/submit; SoD: issue verifier ≠ assignee, risk acceptance limited to program owner/AO; AO decision modal gating (`atoCanDecide`) |
| 3 | Compliance content | **Opus** | Domain judgment, highest error cost | Baseline counts vs 800-53B (`BASELINE_COUNTS`); spot-check 20 controls' text vs official catalog; RMF/SSP/POA&M terminology correctness; ISO 27001 / SOC 2 / HIPAA crosswalk sanity (use nist-rmf-advisor + iso-27001-advisor skills) |
| 4 | UX, copy & a11y | **Sonnet** | Pattern-based review | Heading hierarchy, empty states, error copy, contrast, keyboard focus in modals, the single 900px breakpoint, landing-page claims vs actual app features |
| 5 | Data integrity | **Sonnet** | Careful but mechanical | Every `state` key present in `STATE_DEFAULTS`; XMPL snapshots parse and contain all live-state keys; legacy-key migration runs once and cleans up; caps on auditTrail (800) / changeLog (2000) |
| 6 | Independent verifier | **Sonnet** (fresh spawn) | No writer's assumptions | Reviews every diff the orchestrator produced this run: regression risk, convention violations (globals only, setTimeout-0 re-renders, escKey/escapeHTML), CLAUDE.md rules |

Notes on tiering: Opus only where wrong answers are expensive (compliance content); Sonnet for all hands-on-tools work; Haiku for anything a script could almost do. Tiered teams run ~40% cheaper than all-Opus with little capability loss on worker tasks.

## Execution flow per full run

1. Fable snapshots current state (git status + program export) — nothing destructive without a restore path.
2. Launch agents 0, 3, 5 in parallel (no browser contention). Agents 1, 2, 4 run serialized (each owns the browser/sandbox server while active).
3. Collect findings tables → merge into `tests/agents/LAST_RUN.md` scorecard (pass/fail per checklist item, severity-ranked findings).
4. Fable fixes Critical/High items, re-runs the affected agent only.
5. Agent 6 reviews the final diff. Only then is the run green.

## Standing rules for every agent prompt

- One goal, explicit inputs, explicit output format. No "also look around."
- Read-only unless the checklist says otherwise; report, don't fix.
- Cite file:line or screenshot for every finding — no unevidenced claims.
- Non-deterministic checks (copy quality, compliance judgment) use a rubric score (1–5 + rationale), not pass/fail.
- Never touch the live Supabase program: UI agents run against a local server with a seeded XMPL snapshot, or a throwaway browser profile.
