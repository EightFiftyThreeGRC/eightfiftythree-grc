# Agent 0 — Static Integrity (model: haiku, read-only + bash)

Goal: mechanical repo health. Report findings; do NOT edit files.

## Checklist
1. `node --check` every file in `js/` (or `npm run check:js`). Any syntax error = Critical.
   - OneDrive caveat: if a file appears truncated mid-line at EOF, the bash mount may be stale — re-verify via the Read tool before reporting.
2. Branding scan: grep case-insensitive for `KPMG`, `Larsen`, `Hawthorn` across all files. Any hit = Critical, EXCEPT the literal legacy key strings inside `migrateLegacyStorageKeys()` in `js/core.js`. `Acme` anywhere = High (demo company is XMPL Co.).
3. localStorage keys: confirm the only storage keys written are `eightfiftythree-grc-v1`, `eightfiftythree-grc-snapshots`, `eightfiftythree-grc-v1-ts`.
4. onclick escaping: grep generated `onclick="...('` patterns in js/ that interpolate variables without `escKey`/`escapeHTML`; flag each as High (one unescaped quote historically broke all JS parsing).
5. Cross-module calls: spot-check that functions invoked via `typeof fn === 'function'` guards exist somewhere in js/; unguarded calls to functions defined in later-loaded modules = Medium (load order in app.html).
6. Confirm `markDirty` and `_updateSaveIndicator` are defined in `js/core.js`.

## Output
Markdown table: Severity (Critical/High/Medium/Low) | File:line | Evidence (exact text) | Suggested fix. End with PASS/FAIL (FAIL if any Critical/High).
