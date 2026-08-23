// Walks Path A (8 steps) and Path B (7 steps) through the real UI and asserts that
// the visible wizard panel matches the outer progress label on every step.
// Local server only: http://127.0.0.1:8899
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://127.0.0.1:8899/app.html';
const OUT = 'tools/_walk_out';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.state !== 'undefined');

function probeFn() {
  function txt(el) { return el ? (el.innerText || '').trim() : ''; }
  var pathAWrap = document.querySelector('#tab-ciso .wizard-container > .wizard-content');
  var pmap = document.getElementById('pmap-root');
  var pathAVisible = !!pathAWrap && pathAWrap.style.display !== 'none';
  var pmapVisible = !!pmap && !pmap.hidden && pmap.style.display !== 'none';
  var activePanel = pathAVisible
    ? document.querySelector('#tab-ciso .wizard-content > .wizard-step.active')
    : (pmap ? pmap.querySelector('.wizard-step') : null);
  var innerLabelEl = activePanel ? activePanel.querySelector('.ciso-step-progress') : null;
  var footerPrimary = activePanel ? activePanel.querySelector('.wizard-step-footer .btn-primary, .wizard-step-footer .btn-navy') : null;
  var footerBack = activePanel ? activePanel.querySelector('.wizard-step-footer .btn-secondary') : null;
  var navActive = document.querySelector('#tab-ciso .step-item.active .step-name');
  return {
    outerLabel: txt(document.getElementById('ciso-setup-progress-label')),
    outerDesc: txt(document.getElementById('ciso-setup-header-desc')),
    activePanelId: activePanel ? activePanel.id : null,
    innerLabel: txt(innerLabelEl),
    bodyHead: activePanel ? txt(activePanel).slice(0, 160).replace(/\s+/g, ' ') : '',
    footerPrimary: txt(footerPrimary),
    footerPrimaryDisabled: footerPrimary ? !!footerPrimary.disabled : null,
    footerBack: txt(footerBack),
    navActive: txt(navActive),
    pathAVisible: pathAVisible,
    pmapVisible: pmapVisible,
    policyMapStep: state.policyMapStep,
    currentCiso: (typeof currentStep !== 'undefined') ? currentStep.ciso : null
  };
}

const probe = () => page.evaluate(probeFn);
const labels = await page.evaluate(() => ({
  pathA: (typeof CISO_STEP_LABELS !== 'undefined') ? CISO_STEP_LABELS : [],
  pathB: (typeof POLICY_MAP_STEP_LABELS !== 'undefined') ? POLICY_MAP_STEP_LABELS : []
}));

async function seedIdentityAndProfile(path) {
  await page.evaluate((p) => {
    if (typeof resetApp === 'function') resetApp();
    if (typeof chooseProgramPath === 'function') chooseProgramPath(p);
  }, path);
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    state.orgName = 'XMPL Co.';
    state.programOwner = 'Mike McDonald';
    state.programOwnerTitle = 'Chief Information Security Officer';
    state.programOwnerEmail = 'mike.mcdonald@xmpl.co';
    if (typeof setOrgClassification === 'function') {
      setOrgClassification('orgOwnership', 'private');
      setOrgClassification('orgSector', 'commercial');
    }
    if (typeof setOrgProfileField === 'function') {
      setOrgProfileField('orgSizeBand', '50_250');
      setOrgProfileField('orgImpactProfile', 'limited');
      setOrgProfileField('orgNonUsFootprint', 'no');
      setOrgProfileField('orgSoc2Demand', 'no');
    }
    if (!(state.orgDataTypes || []).length && typeof toggleOrgDataType === 'function') toggleOrgDataType('none');
  });
}

async function clickActivePrimary() {
  await page.evaluate(() => {
    var pathAWrap = document.querySelector('#tab-ciso .wizard-container > .wizard-content');
    var pmap = document.getElementById('pmap-root');
    var pathAVisible = !!pathAWrap && pathAWrap.style.display !== 'none';
    var panel = pathAVisible
      ? document.querySelector('#tab-ciso .wizard-content > .wizard-step.active')
      : (pmap ? pmap.querySelector('.wizard-step') : null);
    var btn = panel && panel.querySelector('.wizard-step-footer .btn-primary, .wizard-step-footer .btn-navy');
    if (btn) btn.click();
  });
  await page.waitForTimeout(350);
}

// ---------------- PATH B ----------------
const bRows = [];
await seedIdentityAndProfile('map');
await page.evaluate(() => { if (typeof policyMapGoTo === 'function') policyMapGoTo(1); });
await page.waitForTimeout(250);

for (let s = 1; s <= 3; s++) {
  bRows.push({ step: s, ...(await probe()) });
  await page.screenshot({ path: `${OUT}/idx-pathB-0${s}.png` });
  await clickActivePrimary();
}

// step 4 — catalog: add three documents through the UI
bRows.push({ step: 4, ...(await probe()) });
const docs = ['Information Security Policy', 'Access Control Standard', 'Incident Response Procedure'];
for (const title of docs) {
  await page.evaluate(() => {
    var b = Array.prototype.find.call(document.querySelectorAll('#pmap-root button'), (el) => /Add document/i.test(el.textContent || ''));
    if (b) b.click();
  });
  await page.waitForTimeout(200);
  await page.fill('#pmap-edit-title', title);
  await page.evaluate(() => {
    var b = Array.prototype.find.call(document.querySelectorAll('#pmap-root button'), (el) => /Save document/i.test(el.textContent || ''));
    if (b) b.click();
  });
  await page.waitForTimeout(200);
}
await page.screenshot({ path: `${OUT}/idx-pathB-04.png` });
await clickActivePrimary();

// step 5 — map: claim Govern on doc 1, families on docs 2 and 3
bRows.push({ step: 5, ...(await probe()) });
await page.evaluate(() => {
  var cards = document.querySelectorAll('#pmap-root .pmap-card');
  function chip(card, re) {
    return Array.prototype.find.call(card.querySelectorAll('.pmap-chip'), (el) => re.test((el.textContent || '').trim()));
  }
  if (cards[0]) { var g = chip(cards[0], /Govern/i); if (g) g.click(); }
  if (cards[1]) { var ac = chip(cards[1], /^AC$/); if (ac) ac.click(); }
  if (cards[2]) { var ir = chip(cards[2], /^IR$/); if (ir) ir.click(); }
});
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/idx-pathB-05.png` });
await clickActivePrimary();

// step 6 — further policies
bRows.push({ step: 6, ...(await probe()) });
await page.screenshot({ path: `${OUT}/idx-pathB-06.png` });
await clickActivePrimary();

// step 7 — assign owners
const b7 = await probe();
bRows.push({ step: 7, ...b7 });
await page.screenshot({ path: `${OUT}/idx-pathB-07-before-assign.png`, fullPage: true });
const b7detail = await page.evaluate(() => {
  var panel = document.querySelector('#tab-ciso .wizard-content > .wizard-step.active');
  var t = panel ? (panel.innerText || '') : '';
  return {
    rosterRows: document.querySelectorAll('#ciso-step-8-body .owner-step-row').length,
    chips: document.querySelectorAll('#ciso-step-8-body .owner-step-chip-name').length,
    hasAssignAll: /Assign all domains/i.test(t),
    hasAssignOwnersTitle: /Assign owners/i.test(t),
    firstChipName: (document.querySelector('#ciso-step-8-body .owner-step-chip-name') || {}).innerText || '',
    nameInputs: document.querySelectorAll('#ciso-step-8-body .owner-step-name').length
  };
});

// click "Assign all domains", then finish
await page.evaluate(() => {
  var b = Array.prototype.find.call(document.querySelectorAll('#ciso-step-8-body button'), (el) => /Assign all domains/i.test(el.textContent || ''));
  if (b) b.click();
});
await page.waitForTimeout(400);
const b7after = await probe();
const b7chips = await page.evaluate(() => ({
  chips: document.querySelectorAll('#ciso-step-8-body .owner-step-chip-name').length,
  names: Array.prototype.slice.call(document.querySelectorAll('#ciso-step-8-body .owner-step-chip-name'), 0, 3).map((e) => e.innerText),
  emails: Array.prototype.slice.call(document.querySelectorAll('#ciso-step-8-body .owner-step-chip-email'), 0, 3).map((e) => e.innerText)
}));
await page.screenshot({ path: `${OUT}/idx-pathB-07-populated.png`, fullPage: true });

await clickActivePrimary();
await page.waitForTimeout(600);
const bFinish = await page.evaluate(() => ({
  cisoComplete: !!state.cisoComplete,
  activeTab: (document.querySelector('.tab-panel.active') || {}).id || '',
  heading: (document.querySelector('.tab-panel.active .page-title, .tab-panel.active h1, .tab-panel.active .section-title') || {}).innerText || ''
}));
await page.screenshot({ path: `${OUT}/idx-pathB-08-post-finish.png`, fullPage: true });

// ---------------- PATH A ----------------
const aRows = [];
await seedIdentityAndProfile('build');
await page.evaluate(() => { if (typeof goToStep === 'function') goToStep('ciso', 1); });
await page.waitForTimeout(250);
for (let s = 1; s <= 8; s++) {
  aRows.push({ step: s, ...(await probe()) });
  await page.screenshot({ path: `${OUT}/idx-pathA-0${s}.png` });
  if (s === 6) {
    await page.evaluate(() => {
      if (!state.policyReviewCycle) state.policyReviewCycle = {};
      state.policyReviewCycle.ISP = {
        _customApprover: true, approvedBy: 'Morgan Chen',
        approverEmail: 'morgan.chen@xmpl.co', approverRole: 'CIO'
      };
    });
  }
  if (s < 8) await clickActivePrimary();
}
const a8detail = await page.evaluate(() => {
  var b = Array.prototype.find.call(document.querySelectorAll('#ciso-step-8-body button'), (el) => /Assign all domains/i.test(el.textContent || ''));
  if (b) b.click();
  return { rosterRows: document.querySelectorAll('#ciso-step-8-body .owner-step-row').length };
});
await page.waitForTimeout(400);
const a8 = await probe();
await page.screenshot({ path: `${OUT}/idx-pathA-08-populated.png`, fullPage: true });
await clickActivePrimary();
await page.waitForTimeout(600);
const aFinish = await page.evaluate(() => ({
  cisoComplete: !!state.cisoComplete,
  activeTab: (document.querySelector('.tab-panel.active') || {}).id || ''
}));

await browser.close();

// ---------------- assertions ----------------
const problems = [];
function checkRows(label, rows, expectLabels) {
  rows.forEach((r) => {
    const want = expectLabels[r.step - 1];
    if (!r.outerLabel.includes(want)) problems.push(`${label} step ${r.step}: outer label "${r.outerLabel}" missing "${want}"`);
    if (r.innerLabel) {
      const outerNum = (r.outerLabel.match(/Step (\d+) of (\d+)/) || []).slice(1).join('/');
      const innerNum = (r.innerLabel.match(/Step (\d+) of (\d+)/) || []).slice(1).join('/');
      if (outerNum !== innerNum) problems.push(`${label} step ${r.step}: inner "${r.innerLabel}" != outer "${r.outerLabel}"`);
      const innerName = (r.innerLabel.split('\u00b7')[1] || '').trim();
      if (innerName && !r.outerLabel.includes(innerName)) problems.push(`${label} step ${r.step}: inner name "${innerName}" not in outer "${r.outerLabel}"`);
    }
    if (/^Next/i.test(r.footerPrimary) && r.step === expectLabels.length) {
      problems.push(`${label} final step ${r.step}: footer still says "${r.footerPrimary}"`);
    }
  });
}
checkRows('PathB', bRows, labels.pathB);
checkRows('PathA', aRows, labels.pathA);
if (b7.activePanelId !== 'ciso-step-8') problems.push(`PathB step 7 visible panel is ${b7.activePanelId}, expected ciso-step-8`);
if (!b7detail.rosterRows) problems.push('PathB step 7 roster did not render');
if (!b7detail.hasAssignAll) problems.push('PathB step 7 missing "Assign all domains"');
if (!b7chips.chips) problems.push('PathB step 7 owner name chips missing after assign-all');
if (!bFinish.cisoComplete) problems.push('PathB finish did not complete setup');
if (bFinish.activeTab !== 'tab-home') problems.push(`PathB finish landed on ${bFinish.activeTab}`);
if (!aFinish.cisoComplete) problems.push('PathA finish did not complete setup');
if (aFinish.activeTab !== 'tab-home') problems.push(`PathA finish landed on ${aFinish.activeTab}`);
if (errors.length) problems.push('page errors: ' + errors.join(' | '));

console.log(JSON.stringify({
  pathB: bRows, pathB7detail: b7detail, pathB7after: b7after, pathB7chips: b7chips, pathBFinish: bFinish,
  pathA: aRows, pathA8detail: a8detail, pathA8: a8, pathAFinish: aFinish,
  problems
}, null, 2));
process.exit(problems.length ? 1 : 0);
