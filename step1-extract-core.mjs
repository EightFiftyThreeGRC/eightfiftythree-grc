/**
 * One-shot Step 1: build js/core.js from line ranges of js/app.js and strip them from app.js.
 * Run from repo root: node tools/step1-extract-core.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const appPath = path.join(root, 'js', 'app.js');
const corePath = path.join(root, 'js', 'core.js');

const lines = fs.readFileSync(appPath, 'utf8').split('\n');

/** Inclusive 1-based [start, end] */
const coreRangesOrdered = [
  [5, 1027],
  [1633, 1639],
  [3815, 3831],
  [13089, 13097],
  [1029, 1130],
  [1132, 1336],
  [3753, 3757],
  [1441, 1611],
  [1616, 1629],
  [13699, 13704], // getSavedSnapshots (must load before prune uses it at runtime)
  [1338, 1352], // pruneAutoRestoreSnapshots
  [13671, 13683], // XMPL_SNAPSHOT + XMPL_DOMAIN_SNAPSHOT
];

function sliceInclusive(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const header =
  '// js/core.js — foundation (load first). Split from app.js (Step 1).\n' +
  '// Globals only; no IIFE. Depends on nothing; other scripts depend on this file.\n\n';

const body = coreRangesOrdered.map(([a, b]) => sliceInclusive(a, b)).join('\n\n');
fs.writeFileSync(corePath, header + body + '\n', 'utf8');

const removed = new Set();
for (const [a, b] of coreRangesOrdered) {
  for (let i = a; i <= b; i++) removed.add(i);
}

const newApp = lines
  .map((line, idx) => (removed.has(idx + 1) ? null : line))
  .filter((x) => x !== null)
  .join('\n');

fs.writeFileSync(appPath, newApp, 'utf8');

console.log('Wrote', corePath);
console.log('Updated', appPath, 'removed', removed.size, 'lines; new length', newApp.split('\n').length);
