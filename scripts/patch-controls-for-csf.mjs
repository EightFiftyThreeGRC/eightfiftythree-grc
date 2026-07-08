import { readFileSync, writeFileSync } from 'fs';
let s = readFileSync('js/controls.js', 'utf8');
s = s.replace(/if \(!state\.baseline\)/g, 'if (!getProgramScopeReady())');
s = s.replace(
  /state\.baseline === 'L' \? 'Low' : state\.baseline === 'M' \? 'Moderate' : 'High'/g,
  "getProgramBaselineLabel()"
);
s = s.replace(
  /return c\.bl && \(c\.bl\.indexOf\(state\.baseline\) !== -1 \|\| \(state\.privacyOverlay && c\.bl\.indexOf\('P'\) !== -1\)\);/g,
  'return true;'
);
s = s.replace(
  /const deselBaseline = cs\.deselectDecision === 'Approved' && c\.bl && \(c\.bl\.includes\(state\.baseline\) \|\| \(state\.privacyOverlay && c\.bl\.includes\('P'\)\)\);/g,
  'const deselBaseline = false;'
);
s = s.replace(
  /if \(!state\.baseline \|\| typeof getActiveControls/g,
  'if (!getProgramScopeReady() || typeof getActiveControls'
);
s = s.replace(
  /if \(!state\.baseline\) return false;\s*if \(ctrl\.bl\.indexOf\(state\.baseline\) !== -1\) return true;[\s\S]*?return false;/,
  'return true;'
);
writeFileSync('js/controls.js', s);
console.log('patched controls.js');
