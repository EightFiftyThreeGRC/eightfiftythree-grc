/**
 * One-shot Step 2: build js/program.js from line ranges of js/app.js and strip them from app.js.
 * Run from repo root: node tools/step2-extract-program.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const appPath = path.join(root, 'js', 'app.js');
const programPath = path.join(root, 'js', 'program.js');

const lines = fs.readFileSync(appPath, 'utf8').split('\n');

/** Inclusive 1-based [start, end]; order is concatenation order for program.js */
const programRangesOrdered = [
  [663, 772],
  [792, 826],
  [828, 896],
  [944, 2916],
];

function sliceInclusive(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const header =
  '// js/program.js — CISO program setup, ISP workflow, merge/prefill helpers. Split from app.js (Step 2).\n' +
  '// Globals only; load after js/core.js and before js/app.js.\n\n';

const body = programRangesOrdered.map(([a, b]) => sliceInclusive(a, b)).join('\n\n');
fs.writeFileSync(programPath, header + body + '\n', 'utf8');

const removed = new Set();
for (const [a, b] of programRangesOrdered) {
  for (let i = a; i <= b; i++) removed.add(i);
}

const newApp = lines
  .map((line, idx) => (removed.has(idx + 1) ? null : line))
  .filter((x) => x !== null)
  .join('\n');

fs.writeFileSync(appPath, newApp, 'utf8');

console.log('Wrote', programPath);
console.log('Updated', appPath, 'removed', removed.size, 'lines; new length', newApp.split('\n').length);
