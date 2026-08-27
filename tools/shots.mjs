// Local-only visual capture harness for the design refresh. Not part of the runtime.
// Usage: node tools/shots.mjs <outDir>  (expects a static server on :8899)
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT = process.argv[2] || 'C:/Users/jacob/AppData/Local/Temp/grc-shots/x';
const BASE = 'http://localhost:8899';
fs.mkdirSync(OUT, { recursive: true });

const errors = [];

async function shot(page, name, opts = {}) {
  await page.waitForTimeout(opts.wait || 350);
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: !!opts.full });
  process.stdout.write('  shot ' + name + '\n');
}

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));

  // ---- landing
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await shot(page, '01-landing', { full: true });

  // ---- app, first run (empty program)
  await page.goto(BASE + '/app.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const o = document.getElementById('welcomeIntroOverlay'); if (o) o.classList.remove('is-visible');
    const r = document.getElementById('rolePickerOverlay'); if (r) r.style.display = 'none';
  });
  await shot(page, '02-home-firstrun', { full: true });

  // ---- CISO wizard, empty program
  await page.evaluate(() => showTab('ciso'));
  for (let s = 1; s <= 7; s++) {
    await page.evaluate(n => goToStep('ciso', n), s);
    await shot(page, '03-ciso-step' + s, { full: true });
  }

  // ---- load populated demo program
  await page.evaluate(() => applySnapshotFromDataString(XMPL_DOMAIN_SNAPSHOT.data));
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    // The demo snapshot stops short of finalizing setup; force it so the
    // post-setup dashboard (not the resume screen) is what we review.
    state.cisoComplete = true;
    document.body.classList.remove('setup-focus-mode');
    const t = document.querySelector('.toast, #toast'); if (t) t.remove();
    const o = document.getElementById('welcomeIntroOverlay'); if (o) o.classList.remove('is-visible');
    const r = document.getElementById('rolePickerOverlay'); if (r) r.style.display = 'none';
    showTab('home');
  });
  await shot(page, '04-home-dashboard', { full: true });

  const tabs = [
    ['05-policy', () => showTab('policy')],
    ['06-control', () => showTab('control')],
    ['07-asset', () => showTab('asset')],
    ['08-risk', () => showTab('risk')],
    ['09-reports', () => showTab('reports')],
    ['10-frameworks', () => showTab('frameworks')],
    ['11-users', () => showTab('users')],
  ];
  for (const [name, fn] of tabs) {
    await page.evaluate(fn);
    await shot(page, name, { full: true });
  }

  // ---- dense data surfaces
  await page.evaluate(() => { showTab('control'); if (typeof goToControlLibrary === 'function') goToControlLibrary(); });
  await shot(page, '12-control-library-dense', { full: false, wait: 700 });

  await page.evaluate(() => { if (typeof goToReportsLibrary === 'function') goToReportsLibrary('controls'); });
  await shot(page, '13-reports-library-dense', { full: false, wait: 700 });

  // ---- CISO wizard, populated
  await page.evaluate(() => showTab('ciso'));
  for (const s of [2, 6, 7]) {
    await page.evaluate(n => goToStep('ciso', n), s);
    await shot(page, '14-ciso-populated-step' + s, { full: true });
  }

  // ---- role picker overlay
  await page.evaluate(() => showRolePicker());
  await shot(page, '15-role-picker', { full: false, wait: 500 });
  await page.evaluate(() => { document.getElementById('rolePickerOverlay').style.display = 'none'; });

  // ---- responsive
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.evaluate(() => showTab('home'));
  await shot(page, '16-responsive-820', { full: true });
  await page.setViewportSize({ width: 420, height: 900 });
  await shot(page, '17-responsive-420', { full: true });
  await page.setViewportSize({ width: 1440, height: 950 });

  // ---- print stylesheet
  await page.evaluate(() => showTab('reports'));
  await page.emulateMedia({ media: 'print' });
  await shot(page, '18-print-reports', { full: true, wait: 600 });
  await page.emulateMedia({ media: 'screen' });

  await browser.close();
  fs.writeFileSync(path.join(OUT, '_console-errors.txt'), errors.length ? errors.join('\n') : 'NONE');
  console.log('\nConsole errors: ' + (errors.length ? errors.length : 'NONE'));
  if (errors.length) console.log(errors.slice(0, 25).join('\n'));
};

run().catch(e => { console.error(e); process.exit(1); });
