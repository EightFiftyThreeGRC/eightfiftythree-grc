#!/usr/bin/env node
/** Add build:csf-catalog to package.json scripts if present */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
if (!existsSync(pkgPath)) process.exit(0);
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['build:csf-catalog'] = 'node scripts/build-csf-catalog.mjs';
pkg.scripts['build:csf-snapshots'] = 'node scripts/build-csf-snapshots.mjs';
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json scripts');
