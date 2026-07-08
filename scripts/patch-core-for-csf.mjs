#!/usr/bin/env node
/** Strip 800-53 catalog from core.js — catalog lives in csf-catalog.js */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'js', 'core.js');
let src = readFileSync(path, 'utf8');

// Remove FAMILIES through DOMAIN_SUGGESTED_ROLES block (keep ROLE_TABS onward)
const startMarker = 'const FAMILIES = {';
const endMarker = 'const ROLE_TABS = {';
const si = src.indexOf(startMarker);
const ei = src.indexOf(endMarker);
if (si === -1 || ei === -1) throw new Error('Could not find catalog block markers');
src = src.slice(0, si) +
  '// NIST CSF 2.0 catalog: js/csf-catalog.js (FUNCTIONS, CATEGORIES, SUBCATEGORIES)\n\n' +
  src.slice(ei);

// Storage keys
src = src.replace(
  "const STORAGE_KEY = 'eightfiftythree-grc-v1';",
  "const STORAGE_KEY = 'eightfiftythree-csf-v1';"
);
src = src.replace(
  "const SNAPSHOTS_KEY = 'eightfiftythree-grc-snapshots';",
  "const SNAPSHOTS_KEY = 'eightfiftythree-csf-snapshots';"
);

// State block — replace baseline/privacy/fisma/pm with CSF keys
src = src.replace(
  `  baseline: null,           // 'L', 'M', or 'H' — the *effective* baseline applied to the program (after any FISMA tailoring)
  privacyOverlay: false,    // true = include P controls
  fismaMode: false,         // true = program is FISMA / CUI / federal — baseline is derived from program info types instead of user-picked
  programInfoTypes: [],     // [info-type id, ...] — 800-60 types selected by CISO when fismaMode is on; drives derived baseline
  baselineOverride: null,   // 'L'|'M'|'H'|null — FISMA-mode tailoring override (NIST 800-37 / 800-60 allows raising or lowering the derived baseline with justification)
  baselineOverrideRationale: '', // free-text justification for the tailoring decision (required if override differs from derived)
  orgName: '',              // organization / agency name
  orgOwnership: '',         // 'government' | 'private' — step 1 org classification (level 1)
  orgGovLevel: '',          // 'federal' | 'slg' — step 1 when orgOwnership is government (level 2)
  orgSector: '',            // sector id — context-specific options (level 2 private, level 3 gov)
  customRegFrameworks: [],  // [{ id, label, subtitle, kind:'standard'|'law', color, active }]
  programOwner: '',         // program owner full name (CISO / SAISO)
  programOwnerTitle: 'Chief Information Security Officer',  // title/role
  programOwnerEmail: '',    // program owner email
  cisoIsISSM: false,        // true = CISO wears both hats (common in small teams)
  pmControls: {},           // { 'PM-1': true, ... }`,
  `  selectedCategories: null,  // { 'GV.OC': true, ... } — null until CISO step 2 seeds all categories
  policyStructure: 'category', // 'function' | 'category' — Tier 2 policy granularity
  gvSubcategories: {},         // { 'GV.PO-01': true, ... } — Tier 1 Govern outcomes in scope
  categoryMerges: {},          // { 'PR.AT': 'PR.AA' } — category policy mode only
  orgName: '',              // organization name
  orgOwnership: '',         // 'government' | 'private' | 'nonprofit'
  orgSector: '',            // sector id for reg-mapping suggestions
  customRegFrameworks: [],
  programOwner: '',
  programOwnerTitle: 'Chief Information Security Officer',
  programOwnerEmail: '',
  cisoIsISSM: false,`
);

// policyMerges alias comment
src = src.replace(
  `  policyMerges: {},              // { 'IA': 'AC' } = IA is merged under AC's owner card`,
  `  policyMerges: {},              // alias: category merges when policyStructure === 'category'`
);

// Default title helpers
src = src.replace(
  `// Default program-owner title (CISO wizard Step 1). Privacy overlay implies combined security + privacy leadership.
const DEFAULT_PROGRAM_OWNER_TITLE = 'Chief Information Security Officer';
const DEFAULT_PROGRAM_OWNER_TITLE_WITH_PRIVACY = 'Chief Information Security Officer / Chief Privacy Officer';

function getDefaultProgramOwnerTitle() {
  return (state && state.privacyOverlay) ? DEFAULT_PROGRAM_OWNER_TITLE_WITH_PRIVACY : DEFAULT_PROGRAM_OWNER_TITLE;
}`,
  `const DEFAULT_PROGRAM_OWNER_TITLE = 'Chief Information Security Officer';

function getDefaultProgramOwnerTitle() {
  return DEFAULT_PROGRAM_OWNER_TITLE;
}`
);

// normalizeStateShape migration
src = src.replace('  ensurePmControlsAssignedToCiso();', '  ensureGvSubcategoriesAssignedToCiso();\n  syncCategoryMergesToPolicyMerges();');

// Replace ensurePmControlsAssignedToCiso function
src = src.replace(
  /function ensurePmControlsAssignedToCiso\(\)[\s\S]*?^}/m,
  `function ensureGvSubcategoriesAssignedToCiso() {
  if (!state.gvSubcategories) return;
  var ownerName = (state.programOwner || '').trim();
  var ownerEmail = (state.programOwnerEmail || '').trim();
  var ownerRole = (state.programOwnerTitle || '').trim();
  if (!ownerName && !ownerEmail) return;
  if (!state.controlOwners) state.controlOwners = {};
  Object.keys(state.gvSubcategories).forEach(function(subId) {
    if (!state.gvSubcategories[subId]) return;
    if (!state.controlOwners[subId] || !isValidOwnerEmail((state.controlOwners[subId] || {}).email)) {
      state.controlOwners[subId] = { name: ownerName, email: ownerEmail, role: ownerRole };
    }
  });
}

function syncCategoryMergesToPolicyMerges() {
  if (state.policyStructure === 'category') {
    state.policyMerges = Object.assign({}, state.categoryMerges || {});
  } else {
    state.policyMerges = {};
  }
}

function syncPolicyMergesToCategoryMerges() {
  if (state.policyStructure === 'category') {
    state.categoryMerges = Object.assign({}, state.policyMerges || {});
  }
}`
);

// isPolicyAndProceduresControl — CSF has no XX-1 split; GV.PO covers policy outcomes
src = src.replace(
  `function isPolicyAndProceduresControl(ctrlId) {
  return /^[A-Z]{2}-1$/.test(String(ctrlId || '').trim());
}`,
  `function isPolicyAndProceduresControl(ctrlId) {
  return false;
}

function isGovernSubcategory(subId) {
  return String(subId || '').indexOf('GV.') === 0;
}`
);

// getMasterPolicyFamilies
src = src.replace(
  `function getMasterPolicyFamilies() {
  var families = typeof getActiveFamilies === 'function'
    ? getActiveFamilies().filter(function(f) { return f !== 'PM'; })
    : [];
  var merges = state.policyMerges || {};
  return families.filter(function(f) { return !merges[f]; });
}`,
  `function getMasterPolicyFamilies() {
  return getMasterPolicyUnits();
}

function getMasterPolicyUnits() {
  var units = typeof getActivePolicyUnits === 'function' ? getActivePolicyUnits() : [];
  var merges = state.policyMerges || {};
  return units.filter(function(u) { return !merges[u]; });
}

function getActivePolicyUnits() {
  if (state.policyStructure === 'function') {
    return typeof getActiveFunctions === 'function' ? getActiveFunctions() : [];
  }
  return typeof getActiveCategories === 'function' ? getActiveCategories() : [];
}

function getPolicyUnitLabel(unit) {
  if (state.policyStructure === 'function') {
    return (FUNCTIONS && FUNCTIONS[unit]) || unit;
  }
  var cat = typeof getCategoryById === 'function' ? getCategoryById(unit) : null;
  return cat ? cat.id + ' — ' + cat.name : unit;
}

function getSuggestedRoleForPolicyUnit(unit) {
  if (state.policyStructure === 'function') {
    return (FUNCTION_SUGGESTED_ROLES && FUNCTION_SUGGESTED_ROLES[unit]) || 'Policy Owner';
  }
  return (CATEGORY_SUGGESTED_ROLES && CATEGORY_SUGGESTED_ROLES[unit]) || 'Policy Owner';
}`
);

// validateProgramShape baseline check
src = src.replace(
  `  if ('baseline' in parsed && parsed.baseline != null && ['L', 'M', 'H'].indexOf(parsed.baseline) === -1) {
    errors.push('baseline must be null, "L", "M", or "H"');
  }`,
  `  if ('baseline' in parsed && parsed.baseline != null) {
    errors.push('This file appears to be an NIST 800-53 program export — import a CSF program instead');
  }
  if ('policyStructure' in parsed && parsed.policyStructure != null && ['function', 'category'].indexOf(parsed.policyStructure) === -1) {
    errors.push('policyStructure must be "function" or "category"');
  }`
);

// Active scope helpers
src = src.replace(
  `function getActiveControls() {
  if (!state.baseline) return [];
  return CONTROLS.filter(c => {
    const inBaseline = c.bl.includes(state.baseline);
    const inPrivacy = state.privacyOverlay && c.bl.includes('P');
    return inBaseline || inPrivacy;
  });
}

function getActiveFamilies() {
  const active = getActiveControls();
  const families = [...new Set(active.map(c => c.f))];
  return families.sort();
}

/**
 * Catalog controls that enter program scope only when Privacy overlay is on:
 * Privacy (P) baseline designation without the selected L/M/H security baseline letter.
 * (Use for UI counts; PM tiering remains separate in the wizard.)
 */
function getPrivacyOnlyCatalogControlCount() {
  if (!state || !state.baseline) return 0;
  const b = state.baseline;
  return CONTROLS.filter(function(c) {
    return c.bl && c.bl.indexOf('P') !== -1 && c.bl.indexOf(b) === -1;
  }).length;
}

/** Canonical control id if \`input\` matches an entry in CONTROLS (trim + case-insensitive), else null. */
function resolveCatalogControlId(input) {
  if (input == null || typeof input !== 'string') return null;
  var t = input.trim();
  if (!t) return null;
  var u = t.toUpperCase();
  for (var i = 0; i < CONTROLS.length; i++) {
    var id = CONTROLS[i].id;
    if (id === t || id.toUpperCase() === u) return id;
  }
  return null;
}`,
  `function isCategoryInScope(catId) {
  if (!state.selectedCategories) return true;
  return !!state.selectedCategories[catId];
}

function getActiveCategories() {
  if (!CATEGORIES) return [];
  return CATEGORIES.filter(function(c) { return isCategoryInScope(c.id); }).map(function(c) { return c.id; });
}

function getActiveSubcategories() {
  if (!SUBCATEGORIES) return [];
  return SUBCATEGORIES.filter(function(s) { return isCategoryInScope(s.cat); });
}

function getActiveControls() {
  return getActiveSubcategories().map(function(s) {
    return { id: s.id, f: s.fn, cat: s.cat, n: s.n };
  });
}

function getActiveFunctions() {
  var fns = {};
  getActiveSubcategories().forEach(function(s) { fns[s.fn] = true; });
  return Object.keys(fns).sort();
}

function getActiveFamilies() {
  return getActiveFunctions();
}

function getPrivacyOnlyCatalogControlCount() {
  return 0;
}

function getProgramScopeReady() {
  return !!(state.selectedCategories && Object.keys(state.selectedCategories).some(function(k) { return state.selectedCategories[k]; }));
}

function resolveCatalogControlId(input) {
  return typeof resolveCatalogSubcategoryId === 'function' ? resolveCatalogSubcategoryId(input) : null;
}

function resolveCatalogSubcategoryId(input) {
  if (input == null || typeof input !== 'string') return null;
  var t = input.trim();
  if (!t) return null;
  for (var i = 0; i < SUBCATEGORIES.length; i++) {
    var id = SUBCATEGORIES[i].id;
    if (id === t || id.toUpperCase() === t.toUpperCase()) return id;
  }
  return null;
}

function getSubcategoriesForPolicyUnit(unit) {
  if (state.policyStructure === 'function') {
    return getActiveSubcategories().filter(function(s) { return s.fn === unit; });
  }
  var allUnits = typeof getPolicyAllUnits === 'function' ? getPolicyAllUnits(unit) : [unit];
  return getActiveSubcategories().filter(function(s) { return allUnits.indexOf(s.cat) !== -1; });
}

function getPolicyAllUnits(unit) {
  var merges = state.policyMerges || {};
  var slaves = Object.keys(merges).filter(function(k) { return merges[k] === unit; });
  return [unit].concat(slaves);
}

function getPolicyAllFamilies(fam) {
  return getPolicyAllUnits(fam);
}`
);

writeFileSync(path, src);
console.log('Patched core.js');
