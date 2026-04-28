/**
 * One-shot Step 3: build js/policies.js from a line range of js/app.js and strip it.
 * Run from repo root: node tools/step3-extract-policies.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const appPath = path.join(root, 'js', 'app.js');
const outPath = path.join(root, 'js', 'policies.js');

const lines = fs.readFileSync(appPath, 'utf8').split('\n');

/** Inclusive 1-based [start, end] — policy workspace through submit-for-approval */
const policiesRange = [731, 4233];

function sliceInclusive(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const header =
  '// js/policies.js — domain policy library, wizards, ISP policy editor, submit flow. Split from app.js (Step 3).\n' +
  '// Globals only; load after js/core.js, js/program.js, and before js/app.js.\n\n';

const [a, b] = policiesRange;
const body = sliceInclusive(a, b);
fs.writeFileSync(outPath, header + body + '\n', 'utf8');

const removed = new Set();
for (let i = a; i <= b; i++) removed.add(i);

const newApp = lines
  .map((line, idx) => (removed.has(idx + 1) ? null : line))
  .filter((x) => x !== null)
  .join('\n');

fs.writeFileSync(appPath, newApp, 'utf8');

console.log('Wrote', outPath);
console.log('Updated', appPath, 'removed', removed.size, 'lines; new length', newApp.split('\n').length);
