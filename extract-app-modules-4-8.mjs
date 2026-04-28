/**
 * One-shot: split js/app.js into controls, assets, testing, reports, admin
 * and remove those ranges (keeps line 1–731, then 6402–EOF).
 * Run: node tools/extract-app-modules-4-8.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const appPath = path.join(root, 'js', 'app.js');

const lines = fs.readFileSync(appPath, 'utf8').split('\n');

/** [fileBaseName, [start, end] inclusive 1-based] */
const extractions = [
  [
    'controls',
    [732, 2822],
    '// js/controls.js — control implementation workspace & library. Split from app.js (Step 4).\n' +
      '// Load after policies.js; globals only.\n\n',
  ],
  [
    'assets',
    [2824, 4310],
    '// js/assets.js — assets, SSP, process SSP, type catalog & libraries. Split from app.js (Step 5).\n' +
      '// Globals only; load after controls.js.\n\n',
  ],
  [
    'testing',
    [4312, 4615],
    '// js/testing.js — control tester tab, test adequacy. Split from app.js (Step 6).\n' +
      '// Globals only; load after assets.js.\n\n',
  ],
  [
    'reports',
    [4617, 5819],
    '// js/reports.js — dashboard, reports tab, CISO/ISP modals, audit & review queue. Split from app.js (Step 7).\n' +
      '// Globals only; load after testing.js.\n\n',
  ],
  [
    'admin',
    [5821, 6401],
    '// js/admin.js — users & roles, role picker, profile sync. Split from app.js (Step 8).\n' +
      '// Globals only; load after reports.js (snapshots in app.js call applyRoleView from here).\n\n',
  ],
];

function sliceInclusive(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const removed = new Set();
for (const [, range] of extractions) {
  const [a, b] = range;
  for (let i = a; i <= b; i++) removed.add(i);
}

for (const [name, [a, b], header] of extractions) {
  const out = path.join(root, 'js', name + '.js');
  fs.writeFileSync(out, header + sliceInclusive(a, b) + '\n', 'utf8');
  console.log('Wrote', out, '(' + (b - a + 1) + ' lines)');
}

const newApp = lines
  .map((line, idx) => (removed.has(idx + 1) ? null : line))
  .filter((x) => x !== null)
  .join('\n');

const shellHeader =
  '// js/app.js — shared UI helpers, audit/change log, tab shell, snapshots, page init. Load last.\n' +
  '// Preceding scripts: core → program → policies → controls → assets → testing → reports → admin → this file.\n\n';
const rest = newApp.replace(/^\/\/ js\/app\.js[^\n]*\n+/, '');

fs.writeFileSync(appPath, shellHeader + rest, 'utf8');

console.log('Updated', appPath, 'removed', removed.size, 'lines; new line count', newApp.split('\n').length);
