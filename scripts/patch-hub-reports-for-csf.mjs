import { readFileSync, writeFileSync } from 'fs';

for (const file of ['js/hub.js', 'js/reports.js']) {
  let s = readFileSync(file, 'utf8');
  s = s.replace(/if \(!state\.baseline\)/g, 'if (!getProgramScopeReady())');
  s = s.replace(/state\.baseline \? \(state\.baseline === 'L' \? 'Low' : state\.baseline === 'M' \? 'Moderate' : 'High'\) : '—'/g, "getProgramScopeReady() ? getProgramBaselineLabel() : '—'");
  s = s.replace(/state\.baseline==='L'\?'Low':state\.baseline==='M'\?'Moderate':'High'/g, 'getProgramBaselineLabel()');
  s = s.replace(/\$\{state\.baseline==='L'\?'Low':state\.baseline==='M'\?'Moderate':'High'\}\$\{state\.privacyOverlay\?'\\+Privacy':''\} Baseline/g, '${getProgramBaselineLabel()}');
  s = s.replace(/state\.baseline \|\|/g, 'getProgramScopeReady() ||');
  s = s.replace(/Seven short steps to stand up NIST 800-53/g, 'Seven short steps to stand up NIST CSF 2.0');
  s = s.replace(/NIST 800-53\.<br>Without the spreadsheet/g, 'NIST CSF 2.0.<br>Without the spreadsheet');
  s = s.replace(/baseline selection, PM controls, security policy/g, 'category scope, Govern outcomes, governance policy');
  writeFileSync(file, s);
  console.log('patched', file);
}
