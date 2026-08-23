// Path B walk with the step 1 "this person also owns domain policies" answer on and off.
// Asserts step 7 arrives pre-filled (on) or empty (off), that a row override survives a
// reload, and that finalize completes. Local server only.
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

/** Drive Path B to the catalog step, answering step 1 through the real checkbox. */
async function toCatalog(ownsPolicies) {
  await page.evaluate(() => {
    if (typeof resetApp === 'function') resetApp();
    if (typeof chooseProgramPath === 'function') chooseProgramPath('map');
  });
  await page.waitForTimeout(250);
  await page.fill('#orgNameInput', 'Apex Cloud');
  await page.fill('#programOwnerInput', 'Alex Mercer');
  await page.fill('#programOwnerTitleInput', 'Chief Information Security Officer');
  await page.fill('#programOwnerEmailInput', 'amercer@apexcloud.io');
  await page.evaluate((on) => {
    ['orgNameInput', 'programOwnerInput', 'programOwnerTitleInput', 'programOwnerEmailInput'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    var box = document.querySelector('#ciso-step-1-body .ciso-identity-opt input[type=checkbox]');
    if (box && box.checked !== on) box.click();
  }, ownsPolicies);
  await page.waitForTimeout(250);
  const flag = await page.evaluate(() => ({
    cisoIsISSM: !!state.cisoIsISSM,
    defaultApplied: !!state.domainOwnerDefaultApplied,
    label: (document.querySelector('#ciso-step-1-body .ciso-identity-opt span') || {}).innerText || ''
  }));

  await page.evaluate(() => {
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
    if (typeof policyMapGoTo === 'function') policyMapGoTo(4);
  });
  await page.waitForTimeout(300);
  return flag;
}

/** Catalog two documents, map them, confirm the policy set, land on step 7. */
async function toAssignOwners() {
  for (const title of ['Information Security Policy', 'Access Control Standard']) {
    await page.evaluate(() => {
      var b = Array.prototype.find.call(document.querySelectorAll('#pmap-root button'), (el) => /Add document/i.test(el.textContent || ''));
      if (b) b.click();
    });
    await page.waitForTimeout(180);
    await page.fill('#pmap-edit-title', title);
    await page.evaluate(() => {
      var b = Array.prototype.find.call(document.querySelectorAll('#pmap-root button'), (el) => /Save document/i.test(el.textContent || ''));
      if (b) b.click();
    });
    await page.waitForTimeout(180);
  }
  await page.evaluate(() => { if (typeof policyMapGoTo === 'function') policyMapGoTo(5); });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    var cards = document.querySelectorAll('#pmap-root .pmap-card');
    function chip(card, re) {
      return Array.prototype.find.call(card.querySelectorAll('.pmap-chip'), (el) => re.test((el.textContent || '').trim()));
    }
    if (cards[0]) { var g = chip(cards[0], /Govern/i); if (g) g.click(); }
    if (cards[1]) { var ac = chip(cards[1], /^AC$/); if (ac) ac.click(); }
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (typeof policyMapGoTo === 'function') policyMapGoTo(6); });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    var b = Array.prototype.find.call(document.querySelectorAll('#pmap-root .wizard-step-footer button'), (el) => /Assign owners/i.test(el.textContent || ''));
    if (b) b.click();
  });
  await page.waitForTimeout(500);
}

function step7ProbeFn() {
  var panel = document.querySelector('#tab-ciso .wizard-content > .wizard-step.active');
  var body = document.getElementById('ciso-step-8-body');
  var btn = document.getElementById('ciso-finalise-btn');
  var rows = Array.prototype.map.call(body.querySelectorAll('.owner-step-row'), function(r) {
    var chipName = r.querySelector('.owner-step-chip-name');
    var chipMail = r.querySelector('.owner-step-chip-email');
    var nameInput = r.querySelector('.owner-step-name');
    var mailInput = r.querySelector('.owner-step-email');
    return {
      fam: (r.querySelector('.family-badge') || {}).innerText || '',
      title: (r.querySelector('.owner-step-row-title') || {}).innerText || '',
      name: chipName ? chipName.innerText : (nameInput ? nameInput.value : ''),
      email: chipMail ? chipMail.innerText : (mailInput ? mailInput.value : ''),
      asChip: !!chipName
    };
  });
  return {
    activePanelId: panel ? panel.id : '',
    outerLabel: (document.getElementById('ciso-setup-progress-label') || {}).innerText || '',
    counter: (body.querySelector('.owner-step-hero-stat-num') || {}).innerText || '',
    heroAction: (body.querySelector('.owner-step-hero-actions') || {}).innerText || '',
    finalizeText: btn ? btn.innerText : '',
    finalizeDisabled: btn ? !!btn.disabled : null,
    rows: rows,
    defaultApplied: !!state.domainOwnerDefaultApplied
  };
}

// ---------- run A: answer checked ----------
const flagOn = await toCatalog(true);
await toAssignOwners();
const onArrival = await page.evaluate(step7ProbeFn);
await page.screenshot({ path: `${OUT}/owner-default-on-step7.png`, fullPage: true });

// override one row to a different person, then reload and confirm it stuck
const overrideFam = onArrival.rows[1] ? onArrival.rows[1].fam : onArrival.rows[0].fam;
await page.evaluate((fam) => {
  if (typeof beginCisoOwnerRowEdit === 'function') beginCisoOwnerRowEdit(fam);
}, overrideFam);
await page.waitForTimeout(250);
await page.evaluate((fam) => {
  setDomainOwnerGroup(fam, 'name', 'Priya Raman');
  setDomainOwnerGroup(fam, 'email', 'priya.raman@apexcloud.io');
  if (typeof commitCisoOwnerEmail === 'function') commitCisoOwnerEmail(fam);
  if (typeof saveToStorage === 'function') saveToStorage();
}, overrideFam);
await page.waitForTimeout(400);
const afterOverride = await page.evaluate(step7ProbeFn);

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.state !== 'undefined');
await page.waitForTimeout(400);
await page.evaluate(() => { if (typeof continuePolicyMapSetup === 'function') continuePolicyMapSetup(); });
await page.waitForTimeout(600);
const afterReload = await page.evaluate(step7ProbeFn);

// finalize
await page.evaluate(() => {
  var btn = document.getElementById('ciso-finalise-btn');
  if (btn && !btn.disabled) btn.click();
});
await page.waitForTimeout(700);
const finished = await page.evaluate(() => ({
  cisoComplete: !!state.cisoComplete,
  activeTab: (document.querySelector('.tab-panel.active') || {}).id || ''
}));
await page.screenshot({ path: `${OUT}/owner-default-on-post-finish.png`, fullPage: true });

// ---------- run B: answer unchecked ----------
const flagOff = await toCatalog(false);
await toAssignOwners();
const offArrival = await page.evaluate(step7ProbeFn);
await page.screenshot({ path: `${OUT}/owner-default-off-step7.png`, fullPage: true });
// the shortcut must still work when the answer is off
await page.evaluate(() => {
  var b = Array.prototype.find.call(document.querySelectorAll('#ciso-step-8-body button'), (el) => /Assign all domains/i.test(el.textContent || ''));
  if (b) b.click();
});
await page.waitForTimeout(500);
const offAfterShortcut = await page.evaluate(step7ProbeFn);

await browser.close();

const problems = [];
const filledOn = onArrival.rows.filter((r) => r.name === 'Alex Mercer' && r.email === 'amercer@apexcloud.io').length;
if (!flagOn.cisoIsISSM) problems.push('checkbox did not set cisoIsISSM');
if (!/owns domain policies/i.test(flagOn.label)) problems.push('step 1 checkbox label changed: ' + flagOn.label);
if (onArrival.activePanelId !== 'ciso-step-8') problems.push('step 7 panel is ' + onArrival.activePanelId);
if (filledOn !== onArrival.rows.length) problems.push(`only ${filledOn}/${onArrival.rows.length} rows pre-filled on arrival`);
if (onArrival.counter.replace(/\s/g, '') !== `${onArrival.rows.length}/${onArrival.rows.length}`) problems.push('counter reads ' + onArrival.counter);
if (onArrival.finalizeDisabled) problems.push('finalize disabled on arrival: ' + onArrival.finalizeText);
if (/Assign all domains/i.test(onArrival.heroAction)) problems.push('hero still offers "Assign all domains" when already assigned');
if (onArrival.demoNames.length) problems.push('auto-assigned owners tagged as demo placeholders: ' + onArrival.demoNames.join(', '));
const ov = afterReload.rows.find((r) => r.fam === overrideFam);
if (!ov || ov.name !== 'Priya Raman') problems.push('row override did not survive reload: ' + JSON.stringify(ov));
if (afterReload.rows.filter((r) => r.name === 'Alex Mercer').length !== afterReload.rows.length - 1) {
  problems.push('non-overridden rows lost the program owner after reload');
}
if (!finished.cisoComplete) problems.push('finalize did not complete');
if (finished.activeTab !== 'tab-home') problems.push('finalize landed on ' + finished.activeTab);
if (flagOff.cisoIsISSM) problems.push('unchecked run still has cisoIsISSM set');
// With the answer unchecked nothing is auto-assigned. Path B may still inherit an owner
// from a catalog document (applyPolicyCatalogToProgram), so require empty rows + a
// blocked finalize rather than zero owners.
if (offArrival.defaultApplied) problems.push('default marked applied with the answer unchecked');
if (!offArrival.rows.some((r) => !r.name && !r.email)) problems.push('no empty rows with the answer unchecked');
if (!offArrival.finalizeDisabled) problems.push('finalize enabled with the answer unchecked');
if (!/Assign all domains/i.test(offArrival.heroAction)) problems.push('shortcut missing with the answer unchecked');
if (offAfterShortcut.rows.some((r) => r.name !== 'Alex Mercer')) problems.push('"Assign all domains" shortcut did not fill every row');
if (errors.length) problems.push('page errors: ' + errors.join(' | '));

console.log(JSON.stringify({ flagOn, onArrival, afterOverride, afterReload, finished, flagOff, offArrival, offAfterShortcut, problems }, null, 2));
process.exit(problems.length ? 1 : 0);
