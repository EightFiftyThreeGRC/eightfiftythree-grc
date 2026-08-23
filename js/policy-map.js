// js/policy-map.js — Path B: catalog existing policies and map them to NIST 800-53.
// Globals only. Load after program.js and app.js so hooks can wrap the CISO wizard.
// Path A (build-from-scratch) stays in js/program.js unchanged.

var POLICY_MAP_STEPS = 7;
var POLICY_MAP_STEP_LABELS = ['Organization', 'Profile', 'Program', 'Catalog', 'Map', 'Policy set', 'Assign owners'];
var POLICY_MAP_DOC_TYPES = [
  { id: 'policy', label: 'Policy', hint: 'Intent \u2014 what must be true' },
  { id: 'standard', label: 'Standard', hint: 'Measurable requirement' },
  { id: 'procedure', label: 'Procedure', hint: 'How the work is done' }
];
var POLICY_MAP_CSF_FUNCTIONS = ['GV', 'ID', 'PR', 'DE', 'RS', 'RC'];

function getResolvedProgramPath() {
  if (typeof migrateUnifiedSetupPath === 'function') migrateUnifiedSetupPath();
  var p = state && state.programPath;
  if (p === 'map') return 'build';
  if (p === 'build' || p === 'unified') return 'build';
  if (state && state.cisoComplete) return 'build';
  var started = !!(String((state && state.orgName) || '').trim()
    || String((state && state.programOwner) || '').trim()
    || (state && state.baseline));
  if (started) return 'build';
  return '';
}

/**
 * Mid-wizard Path B programs join the one setup sequence. Catalog, merges,
 * Function homes, and confirmation flags stay on state; only the fork is retired.
 */
function migrateUnifiedSetupPath() {
  if (!state || state.programPath !== 'map') return;
  var s = parseInt(state.policyMapStep, 10) || 1;
  var dest = 1;
  if (s <= 1) dest = 1;
  else if (s === 2) dest = 2;
  else if (s === 3) dest = 3;
  else if (s === 4 || s === 5) dest = 6;
  else if (s === 6) dest = 7;
  else dest = 8;
  state.cisoSetupStep = dest;
  if (typeof currentStep !== 'undefined') currentStep.ciso = dest;
  if (s >= 5 && typeof applyPolicyCatalogToProgram === 'function') {
    try { applyPolicyCatalogToProgram(); } catch (e) { /* keep going */ }
  }
  state.programPath = 'build';
  state.policyMapWizardRev = Math.max(parseInt(state.policyMapWizardRev, 10) || 0, 3);
  if (typeof markDirty === 'function') markDirty();
}

function shouldRenderPolicyMapSetup() {
  return false;
}

function getPolicyMapProgressSummary() {
  migratePolicyMapWizardRev();
  var step = parseInt(state.policyMapStep, 10) || 1;
  if (step < 1) step = 1;
  if (step > POLICY_MAP_STEPS) step = POLICY_MAP_STEPS;
  return {
    step: step,
    total: POLICY_MAP_STEPS,
    pct: Math.round((step / POLICY_MAP_STEPS) * 100),
    label: POLICY_MAP_STEP_LABELS[step - 1] || 'Organization'
  };
}

/**
 * v1 Path B was 6 steps (org, baseline, catalog, map, coverage, owners).
 * v2 inserts Profile as step 2, shifting catalog+ by +1. Run once per saved program.
 */
function migratePolicyMapWizardRev() {
  var rev = parseInt(state.policyMapWizardRev, 10) || 0;
  if (rev >= 2) return;
  var s = parseInt(state.policyMapStep, 10) || 1;
  if (s >= 3 && s <= 6) {
    state.policyMapStep = Math.min(s + 1, POLICY_MAP_STEPS);
  }
  state.policyMapWizardRev = 2;
  if (typeof markDirty === 'function') markDirty();
}

function ensurePolicyCatalog() {
  if (!Array.isArray(state.policyCatalog)) state.policyCatalog = [];
  state.policyCatalog.forEach(function(d) {
    if (!d || typeof d !== 'object') return;
    if (!Array.isArray(d.csfFunctions)) d.csfFunctions = [];
    if (!Array.isArray(d.familyCodes)) d.familyCodes = [];
    if (!Array.isArray(d.controlIds)) d.controlIds = [];
  });
}

function policyMapCsfFunctionIds() {
  if (typeof CSF_FUNCTIONS !== 'undefined' && CSF_FUNCTIONS) {
    return POLICY_MAP_CSF_FUNCTIONS.filter(function(fn) { return !!CSF_FUNCTIONS[fn]; });
  }
  return POLICY_MAP_CSF_FUNCTIONS.slice();
}

function policyMapNormalizeCsfFunctions(raw) {
  var allowed = {};
  policyMapCsfFunctionIds().forEach(function(fn) { allowed[fn] = true; });
  var seen = {};
  var out = [];
  (Array.isArray(raw) ? raw : []).forEach(function(fn) {
    var id = String(fn || '').toUpperCase();
    if (!allowed[id] || seen[id]) return;
    seen[id] = true;
    out.push(id);
  });
  return out;
}

function policyMapCsfFunctionName(fn) {
  if (typeof CSF_FUNCTIONS !== 'undefined' && CSF_FUNCTIONS[fn]) return CSF_FUNCTIONS[fn].name;
  var fallback = { GV: 'Govern', ID: 'Identify', PR: 'Protect', DE: 'Detect', RS: 'Respond', RC: 'Recover' };
  return fallback[fn] || fn;
}

/** Govern / ISP is covered by a Function claim, the ISP checkbox, or a PM family map. */
function policyMapDocCoversGovern(d) {
  if (!d) return false;
  if (d.isProgramPolicy) return true;
  if ((d.csfFunctions || []).indexOf('GV') !== -1) return true;
  if ((d.familyCodes || []).indexOf('PM') !== -1) return true;
  return false;
}

function policyMapFamilyCsfFunction(fam) {
  if (fam === 'PM') return 'GV';
  if (typeof getCsfFamilyPolicyFunction === 'function') return getCsfFamilyPolicyFunction(fam) || '';
  return '';
}

function policyMapMergeRoot(fam) {
  var merges = (state && state.policyMerges) || {};
  var seen = {};
  var cur = fam;
  while (cur && merges[cur] && !seen[cur]) {
    seen[cur] = true;
    cur = merges[cur];
  }
  return cur;
}

function policyMapNewId() {
  return 'pcat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

function policyMapEscId(id) {
  return String(id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getPolicyCatalogDoc(id) {
  ensurePolicyCatalog();
  for (var i = 0; i < state.policyCatalog.length; i++) {
    if (state.policyCatalog[i] && state.policyCatalog[i].id === id) return state.policyCatalog[i];
  }
  return null;
}

function policyMapDocTypeLabel(type) {
  for (var i = 0; i < POLICY_MAP_DOC_TYPES.length; i++) {
    if (POLICY_MAP_DOC_TYPES[i].id === type) return POLICY_MAP_DOC_TYPES[i].label;
  }
  return 'Policy';
}

function policyMapNormalizeDoc(raw) {
  var d = raw || {};
  return {
    id: d.id || policyMapNewId(),
    title: String(d.title || '').trim(),
    type: (d.type === 'standard' || d.type === 'procedure') ? d.type : 'policy',
    ownerName: String(d.ownerName || '').trim(),
    ownerEmail: String(d.ownerEmail || '').trim(),
    ownerRole: String(d.ownerRole || '').trim(),
    sourceNote: String(d.sourceNote || '').trim(),
    familyCodes: Array.isArray(d.familyCodes) ? d.familyCodes.filter(Boolean) : [],
    controlIds: Array.isArray(d.controlIds) ? d.controlIds.filter(Boolean) : [],
    csfFunctions: policyMapNormalizeCsfFunctions(d.csfFunctions),
    coverageNote: String(d.coverageNote || '').trim(),
    isProgramPolicy: !!d.isProgramPolicy
  };
}

/**
 * Every in-scope 800-53 family, including PM (always) and PT when the privacy overlay is on.
 * Do not hide PM because the ISP / Govern layer also covers program management.
 */
function policyMapInScopeFamilies() {
  var fams = typeof getActiveFamilies === 'function' ? getActiveFamilies() : Object.keys(FAMILIES || {});
  if (!Array.isArray(fams)) fams = [];
  var seen = {};
  var out = [];
  function add(f) {
    if (!f || seen[f] || !(FAMILIES && FAMILIES[f])) return;
    seen[f] = true;
    out.push(f);
  }
  fams.forEach(add);
  add('PM');
  if (state && state.privacyOverlay) add('PT');
  return out.sort();
}

function policyMapInScopeControlsForFamily(fam) {
  var all = typeof getActiveControls === 'function' ? getActiveControls() : [];
  var inFam = all.filter(function(c) { return c && c.f === fam; });
  if (fam === 'PM') {
    policyMapEnsurePmDefaults();
    var selected = inFam.filter(function(c) { return state.pmControls && state.pmControls[c.id]; });
    if (selected.length) return selected;
  }
  return inFam;
}

function policyMapControlFamily(cid) {
  var all = typeof CONTROLS !== 'undefined' ? CONTROLS : [];
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === cid) return all[i].f;
  }
  var m = String(cid || '').match(/^([A-Z]{2})-/);
  return m ? m[1] : '';
}

/** Families this document claims, via family chips and/or control-level picks. */
function policyMapDocFamilies(doc) {
  var seen = {};
  var out = [];
  function add(f) {
    if (!f || seen[f]) return;
    seen[f] = true;
    out.push(f);
  }
  (doc.familyCodes || []).forEach(add);
  (doc.controlIds || []).forEach(function(cid) { add(policyMapControlFamily(cid)); });
  return out;
}

/**
 * Coverage for one family.
 *  - family-level map (chips, no control refinement in that family) = full 'mapped'
 *  - control-level refinement = 'mapped' if every in-scope control is named, else 'partial'
 *  - nothing = 'gap'
 */
function policyMapFamilyCoverageStatus(fam, docs, inScopeIds) {
  var familyLevel = false;
  var named = {};
  (docs || []).forEach(function(doc) {
    var famChip = (doc.familyCodes || []).indexOf(fam) !== -1;
    var ctrlInFam = (doc.controlIds || []).filter(function(cid) { return policyMapControlFamily(cid) === fam; });
    if (famChip && !ctrlInFam.length) familyLevel = true;
    ctrlInFam.forEach(function(cid) { named[cid] = true; });
  });
  if (familyLevel) return 'mapped';
  var namedCount = 0;
  inScopeIds.forEach(function(id) { if (named[id]) namedCount++; });
  if (!namedCount) return 'gap';
  if (namedCount >= inScopeIds.length) return 'mapped';
  return 'partial';
}

function getPolicyMapCoverage() {
  ensurePolicyCatalog();
  var docs = state.policyCatalog.map(policyMapNormalizeDoc);
  var families = policyMapInScopeFamilies();
  var ispMapped = docs.some(policyMapDocCoversGovern);
  var claimedFns = {};
  docs.forEach(function(d) {
    policyMapNormalizeCsfFunctions(d.csfFunctions).forEach(function(fn) { claimedFns[fn] = true; });
    if (d.isProgramPolicy) claimedFns.GV = true;
  });
  var csfRows = policyMapCsfFunctionIds().map(function(fn) {
    var hits = docs.filter(function(d) {
      if (fn === 'GV') return policyMapDocCoversGovern(d);
      return (d.csfFunctions || []).indexOf(fn) !== -1;
    });
    return {
      fn: fn,
      name: policyMapCsfFunctionName(fn),
      mapped: hits.length > 0,
      docs: hits
    };
  });
  var rows = families.map(function(fam) {
    var ctrls = policyMapInScopeControlsForFamily(fam);
    var inScopeIds = ctrls.map(function(c) { return c.id; });
    var famFn = policyMapFamilyCsfFunction(fam);
    var fnClaimed = !!(famFn && claimedFns[famFn]) || (fam === 'PM' && ispMapped);
    var hits = docs.filter(function(d) {
      if (policyMapDocFamilies(d).indexOf(fam) !== -1) return true;
      if (fam === 'PM' && policyMapDocCoversGovern(d)) return true;
      return !!(famFn && ((d.csfFunctions || []).indexOf(famFn) !== -1 || (famFn === 'GV' && policyMapDocCoversGovern(d))));
    });
    var status = policyMapFamilyCoverageStatus(fam, hits, inScopeIds);
    var coveredIds = [];
    var familyLevel = fnClaimed || hits.some(function(d) {
      return (d.familyCodes || []).indexOf(fam) !== -1
        && !(d.controlIds || []).some(function(cid) { return policyMapControlFamily(cid) === fam; });
    });
    if (fnClaimed && status === 'gap') status = 'mapped';
    if (familyLevel) {
      coveredIds = inScopeIds.slice();
      if (status === 'gap') status = 'mapped';
    } else {
      var named = {};
      hits.forEach(function(d) {
        (d.controlIds || []).forEach(function(cid) {
          if (policyMapControlFamily(cid) === fam) named[cid] = true;
        });
      });
      coveredIds = inScopeIds.filter(function(id) { return named[id]; });
    }
    return {
      fam: fam,
      name: (FAMILIES && FAMILIES[fam]) || fam,
      status: status,
      docs: hits,
      inScope: inScopeIds.length,
      covered: coveredIds.length,
      coveredIds: coveredIds
    };
  });
  var mapped = rows.filter(function(r) { return r.status === 'mapped'; }).length;
  var partial = rows.filter(function(r) { return r.status === 'partial'; }).length;
  var gap = rows.filter(function(r) { return r.status === 'gap'; }).length;
  return {
    ispMapped: ispMapped,
    ispDocs: docs.filter(policyMapDocCoversGovern),
    csfRows: csfRows,
    csfMapped: csfRows.filter(function(r) { return r.mapped; }).length,
    rows: rows,
    mapped: mapped,
    partial: partial,
    gap: gap,
    total: rows.length
  };
}

function policyMapCoveredControlIds(fam, cov) {
  var row = null;
  (cov.rows || []).forEach(function(r) { if (r.fam === fam) row = r; });
  return row ? (row.coveredIds || []) : [];
}

function policyMapEnsurePmDefaults() {
  if (!state.pmControls) state.pmControls = {};
  var base = ['PM-1', 'PM-2', 'PM-9'];
  var extra = (state.privacyOverlay && typeof getPrivacyPMDefaults === 'function') ? getPrivacyPMDefaults() : [];
  base.concat(extra).forEach(function(id) {
    if (state.pmControls[id] === undefined) state.pmControls[id] = true;
  });
}

function policyMapProtectedStatus(st) {
  return st === 'Approved' || st === 'Under Review' || st === 'Returned' || st === 'Draft';
}

/**
 * Write mapped catalog rows onto domainPolicies / policyStatus / policySelectedControls
 * so control implementation, SSP, and reports treat those families as "policy exists".
 * Does not clobber in-app drafts that are already in a workflow status.
 */
function applyPolicyCatalogToProgram() {
  ensurePolicyCatalog();
  policyMapEnsurePmDefaults();
  var cov = getPolicyMapCoverage();
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.domainPolicies) state.domainPolicies = {};
  if (!state.policySelectedControls) state.policySelectedControls = {};
  if (!state.domainOwners) state.domainOwners = {};

  var today = new Date().toISOString().slice(0, 10);
  var locale = new Date().toLocaleDateString();

  if (cov.ispMapped) {
    var ispDocs = cov.ispDocs;
    var ispTitle = (ispDocs[0] && ispDocs[0].title) || 'Information Security Policy';
    if (!state.infoSecPolicy) state.infoSecPolicy = {};
    if (!state.infoSecPolicy.title) state.infoSecPolicy.title = ispTitle;
    var ispPrev = state.policyStatus.ISP || {};
    if (!policyMapProtectedStatus(ispPrev.status)) {
      state.policyStatus.ISP = {
        status: 'Mapped',
        source: 'existing',
        version: ispPrev.version || '1.0',
        lastUpdated: locale,
        mappedAt: today,
        catalogIds: ispDocs.map(function(d) { return d.id; }),
        notes: ispPrev.notes || ''
      };
    }
  }

  cov.rows.forEach(function(row) {
    if (row.status === 'gap') return;
    var fam = row.fam;
    var prev = state.policyStatus[fam] || {};
    if (policyMapProtectedStatus(prev.status) && prev.status !== 'Mapped') return;

    var ids = row.coveredIds.slice();
    if (!ids.length) return;
    state.policySelectedControls[fam] = ids;

    var titles = row.docs.map(function(d) { return d.title || 'Untitled'; });
    var title = titles.length === 1
      ? titles[0]
      : ((typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(fam) : fam) + ' (mapped)');
    var noteParts = row.docs.map(function(d) {
      var line = (d.title || 'Untitled') + ' (' + policyMapDocTypeLabel(d.type) + ')';
      if (d.sourceNote) line += ' \u2014 ' + d.sourceNote;
      if (d.coverageNote) line += '. ' + d.coverageNote;
      return line;
    });

    var existing = state.domainPolicies[fam];
    if (!existing || existing.source === 'mapped') {
      state.domainPolicies[fam] = {
        title: title,
        version: (existing && existing.version) || '1.0',
        effectiveDate: (existing && existing.effectiveDate) || today,
        reviewCycle: (existing && existing.reviewCycle) || 'Annual',
        status: 'Mapped',
        source: 'mapped',
        purpose: 'This family is satisfied by existing organizational documents catalogued during program setup (Path B \u2014 map what you have). Mapped documents: ' + noteParts.join('; ') + '.',
        scope: 'Controls in the ' + ((FAMILIES && FAMILIES[fam]) || fam) + ' family that are in the common-control floor and listed on the mapped documents.',
        sections: [
          { type: 'purpose', title: 'Purpose' },
          { type: 'scope', title: 'Scope' },
          { type: 'requirements', title: 'Mapped controls' },
          { type: 'references', title: 'Source documents' }
        ],
        roles: existing && existing.roles ? existing.roles : [],
        requirements: ids.map(function(cid, i) {
          var ctrl = (typeof CONTROLS !== 'undefined' ? CONTROLS : []).filter(function(c) { return c.id === cid; })[0];
          return {
            id: fam + '-MAP-' + (i + 1),
            controls: [cid],
            text: 'Existing documentation addresses ' + cid + (ctrl ? ' (' + ctrl.n + ')' : '') + '.'
          };
        }),
        references: row.docs.map(function(d) {
          return { title: d.title || 'Untitled', description: policyMapDocTypeLabel(d.type) + (d.coverageNote ? ' \u2014 ' + d.coverageNote : ''), url: d.sourceNote || '', internal: true };
        }),
        revisionHistory: (existing && existing.revisionHistory) || [],
        mappedCatalogIds: row.docs.map(function(d) { return d.id; }),
        lastUpdated: locale
      };
    }

    state.policyStatus[fam] = {
      status: 'Mapped',
      source: 'existing',
      version: (state.domainPolicies[fam] && state.domainPolicies[fam].version) || '1.0',
      lastUpdated: locale,
      mappedAt: today,
      catalogIds: row.docs.map(function(d) { return d.id; }),
      notes: prev.notes || ''
    };

    var owner = state.domainOwners[fam];
    if (!owner || !owner.email) {
      var src = row.docs.filter(function(d) { return d.ownerEmail || d.ownerName; })[0];
      if (src) {
        state.domainOwners[fam] = {
          name: src.ownerName || '',
          email: src.ownerEmail || '',
          role: src.ownerRole || ''
        };
      }
    }
    if (typeof autoPopulateControlOwnersFromDomain === 'function') {
      try { autoPopulateControlOwnersFromDomain(fam); } catch (e) { /* ignore */ }
    }
  });

  state.policyMapConfirmed = true;
  markDirty();
}

function chooseProgramPath(path) {
  // Legacy alias: both former paths now enter the one wizard.
  state.programPath = 'build';
  if (!state.cisoSetupStep) state.cisoSetupStep = 1;
  try {
    addAuditEntry('program', null, 'Program setup started');
  } catch (e) { /* ignore */ }
  markDirty();
  if (typeof startProgramSetup === 'function') startProgramSetup();
  else if (typeof showTab === 'function') showTab('ciso');
}

function promptSwitchProgramPath() {
  if (typeof startProgramSetup === 'function') startProgramSetup();
}

function continuePolicyMapSetup() {
  if (state.programPath !== 'map') state.programPath = 'map';
  migratePolicyMapWizardRev();
  var step = parseInt(state.policyMapStep, 10) || 1;
  policyMapGoTo(step);
}

function policyMapGoTo(step) {
  migratePolicyMapWizardRev();
  step = parseInt(step, 10) || 1;
  if (step < 1) step = 1;
  if (step > POLICY_MAP_STEPS) step = POLICY_MAP_STEPS;
  if (step > 1 && typeof toastCisoIdentityIncomplete === 'function' && toastCisoIdentityIncomplete()) {
    step = 1;
  } else if (step > 1 && (!(state.orgName || '').trim())) {
    if (typeof showToast === 'function') showToast('Please enter your Organization / Agency Name before continuing.', true);
    step = 1;
  }
  if (step > 2) {
    var profileMsg = typeof getOrgProfileIncompleteMessage === 'function' ? getOrgProfileIncompleteMessage() : '';
    if (profileMsg) {
      if (typeof showToast === 'function') showToast(profileMsg, true);
      step = 2;
    }
  }
  if (step > 3) {
    if (typeof ensureCommonControlFloor === 'function') ensureCommonControlFloor();
  }
  state.policyMapStep = step;
  markDirty();
  if (typeof showTab === 'function') showTab('ciso');
  else renderPolicyMapCisoTab();
}

function policyMapValidateUpTo(fromStep) {
  if (fromStep >= 1) {
    if (typeof toastCisoIdentityIncomplete === 'function') {
      if (toastCisoIdentityIncomplete()) return false;
    } else {
      if (!(state.orgName || '').trim()) { showToast('Please enter your Organization / Agency Name before continuing.', true); return false; }
      if (!(state.programOwner || '').trim()) { showToast('Please enter the Security Program Owner name before continuing.', true); return false; }
      if (!(state.programOwnerTitle || '').trim()) { showToast('Please enter the Program Owner title before continuing.', true); return false; }
      if (typeof isValidOwnerEmail === 'function' && !isValidOwnerEmail(state.programOwnerEmail)) {
        showToast('Please enter the program owner email before continuing.', true);
        return false;
      }
    }
  }
  if (fromStep >= 2) {
    if (typeof toastCisoProfileIncomplete === 'function') {
      if (toastCisoProfileIncomplete()) return false;
    } else if (typeof getOrgProfileIncompleteMessage === 'function') {
      var msg = getOrgProfileIncompleteMessage();
      if (msg) { showToast(msg, true); return false; }
    }
  }
  if (fromStep >= 3) {
    if (typeof ensureCommonControlFloor === 'function') ensureCommonControlFloor();
  }
  if (fromStep >= 4) {
    ensurePolicyCatalog();
    var named = state.policyCatalog.filter(function(d) { return d && String(d.title || '').trim(); });
    if (!named.length) {
      showToast('Add at least one existing document (title required) before mapping.', true);
      return false;
    }
  }
  if (fromStep >= 5) {
    var anyMapped = state.policyCatalog.some(function(d) {
      return d && ((d.familyCodes && d.familyCodes.length) || (d.controlIds && d.controlIds.length)
        || (d.csfFunctions && d.csfFunctions.length) || d.isProgramPolicy);
    });
    if (!anyMapped) {
      showToast('Map at least one document to a CSF Function or 800-53 family (or mark it as the organization ISP) before reviewing coverage.', true);
      return false;
    }
  }
  return true;
}

function policyMapNext(fromStep) {
  if (!policyMapValidateUpTo(fromStep)) return;
  if (fromStep === 3) policyMapEnsurePmDefaults();
  policyMapGoTo(fromStep + 1);
}

function getCisoPathAWizard() {
  return document.querySelector('#tab-ciso .wizard-container > .wizard-content');
}

function policyMapSetChrome(mode) {
  var pathA = getCisoPathAWizard();
  var pmap = document.getElementById('pmap-root');
  if (pathA) pathA.style.display = (mode === 'pmap') ? 'none' : '';
  if (pmap) {
    if (mode === 'pmap') {
      pmap.hidden = false;
      pmap.style.display = '';
    } else {
      pmap.hidden = true;
      pmap.style.display = 'none';
    }
  }
}

function policyMapSyncStepNav() {
  var step = parseInt(state.policyMapStep, 10) || 1;
  for (var i = 1; i <= 8; i++) {
    var item = document.getElementById('ciso-step-item-' + i);
    var conn = document.getElementById('ciso-conn-' + i);
    if (i === 8) {
      if (item) item.style.display = 'none';
      if (conn) conn.style.display = 'none';
      var conn7 = document.getElementById('ciso-conn-7');
      if (conn7) conn7.style.display = 'none';
      continue;
    }
    if (item) {
      item.style.display = '';
      item.setAttribute('onclick', 'policyMapGoTo(' + i + ')');
      var nameEl = item.querySelector('.step-name');
      var numEl = item.querySelector('.step-num');
      if (nameEl) nameEl.textContent = POLICY_MAP_STEP_LABELS[i - 1] || '';
      if (numEl) numEl.textContent = 'Step ' + i;
    }
    if (conn) conn.style.display = (i < 7) ? '' : 'none';
  }
  for (var c = 1; c <= 7; c++) {
    var circle = document.getElementById('ciso-circle-' + c);
    var navItem = document.getElementById('ciso-step-item-' + c);
    if (!circle || !navItem) continue;
    if (c === step) {
      circle.className = 'step-circle active';
      navItem.classList.add('active');
    } else if (c < step) {
      circle.className = 'step-circle completed';
      navItem.classList.remove('active');
    } else {
      circle.className = 'step-circle pending';
      navItem.classList.remove('active');
    }
  }
}

function restorePathAStepNav() {
  var labels = (typeof CISO_STEP_LABELS !== 'undefined') ? CISO_STEP_LABELS
    : ['Organization', 'Profile', 'Program', 'Reg mapping', 'PM Controls', 'InfoSec Policy', 'Policy set', 'Assign Owners'];
  for (var i = 1; i <= 8; i++) {
    var item = document.getElementById('ciso-step-item-' + i);
    var conn = document.getElementById('ciso-conn-' + i);
    if (item) {
      item.style.display = '';
      item.setAttribute('onclick', "goToStep('ciso'," + i + ")");
      var nameEl = item.querySelector('.step-name');
      var numEl = item.querySelector('.step-num');
      if (nameEl) nameEl.textContent = labels[i - 1] || '';
      if (numEl) numEl.textContent = 'Step ' + i;
    }
    if (conn) conn.style.display = '';
  }
  restorePathAFooters();
}

function policyMapUpdateProgress(step) {
  var fill = document.getElementById('ciso-setup-progress-fill');
  var label = document.getElementById('ciso-setup-progress-label');
  var desc = document.getElementById('ciso-setup-header-desc');
  var s = step || (parseInt(state.policyMapStep, 10) || 1);
  if (fill) fill.style.width = Math.round((s / POLICY_MAP_STEPS) * 100) + '%';
  var name = POLICY_MAP_STEP_LABELS[s - 1] || '';
  if (label) label.textContent = 'Step ' + s + ' of ' + POLICY_MAP_STEPS + ' \u00b7 ' + name;
  if (desc) desc.textContent = 'Map existing policies \u2014 step ' + s + ' of ' + POLICY_MAP_STEPS + ' \u2014 ' + name + '.';
  policyMapSyncStepNav();
}

/**
 * Path B steps that reuse a Path A wizard panel, addressed by the Path A step's name
 * rather than a bare integer. Path B steps between `program` and `assignOwners` render
 * in #pmap-root and deliberately have no Path A panel.
 */
var POLICY_MAP_PATH_A_PANELS = [
  { key: 'organization', pathBStep: 1, pathAStep: 1, pathALabel: 'Organization' },
  { key: 'profile', pathBStep: 2, pathAStep: 2, pathALabel: 'Profile' },
  { key: 'program', pathBStep: 3, pathAStep: 3, pathALabel: 'Program' },
  { key: 'assignOwners', pathBStep: POLICY_MAP_STEPS, pathAStep: 8, pathALabel: 'Assign Owners' }
];
/** First Path B step with its own renderer — where Path-A-only steps land. */
var POLICY_MAP_FIRST_OWN_STEP = 4;

/**
 * Resolve one mapping against the live CISO_STEP_LABELS. If Path A was re-numbered the
 * label no longer matches the recorded index, so relocate by name and warn instead of
 * silently painting whatever step now sits at the stale index.
 */
function policyMapResolvePathAStep(entry) {
  var labels = (typeof CISO_STEP_LABELS !== 'undefined' && CISO_STEP_LABELS) ? CISO_STEP_LABELS : [];
  if (!labels.length) return entry.pathAStep;
  if (labels[entry.pathAStep - 1] === entry.pathALabel) return entry.pathAStep;
  var moved = labels.indexOf(entry.pathALabel);
  console.warn('policy-map: Path A step ' + entry.pathAStep + ' is "' + labels[entry.pathAStep - 1]
    + '", expected "' + entry.pathALabel + '". Update POLICY_MAP_PATH_A_PANELS.');
  return moved === -1 ? entry.pathAStep : moved + 1;
}

/** Path A panel step for a Path B step, or 0 when Path B owns the renderer. */
function policyMapPathAStep(pathBStep) {
  for (var i = 0; i < POLICY_MAP_PATH_A_PANELS.length; i++) {
    if (POLICY_MAP_PATH_A_PANELS[i].pathBStep === pathBStep) {
      return policyMapResolvePathAStep(POLICY_MAP_PATH_A_PANELS[i]);
    }
  }
  return 0;
}

/** Path B step that owns a Path A step — Path-A-only steps land on the first Path B step. */
function policyMapStepForPathAStep(pathAStep) {
  for (var i = 0; i < POLICY_MAP_PATH_A_PANELS.length; i++) {
    if (policyMapResolvePathAStep(POLICY_MAP_PATH_A_PANELS[i]) === pathAStep) {
      return POLICY_MAP_PATH_A_PANELS[i].pathBStep;
    }
  }
  return POLICY_MAP_FIRST_OWN_STEP;
}

/** Activate one Path A wizard panel and deactivate the rest. */
function policyMapActivatePathAPanel(pathAStep) {
  var max = (typeof CISO_WIZARD_STEPS === 'number') ? CISO_WIZARD_STEPS : 8;
  for (var i = 1; i <= max; i++) {
    var panel = document.getElementById('ciso-step-' + i);
    if (panel) panel.classList.toggle('active', i === pathAStep);
  }
}

/**
 * Show a Path A wizard panel from Path B. Routes through the unwrapped goToStep so the
 * panel is activated, the nav syncs, and the body renders — rendering the body alone
 * leaves whichever panel was last active on screen showing the wrong step.
 */
function policyMapShowPathAStep(pathAStep, pathBStep) {
  policyMapSetChrome('pathA');
  if (typeof currentStep !== 'undefined') currentStep.ciso = pathAStep;
  if (typeof window._policyMapOrigGoToStep === 'function') {
    window._policyMapInsideGoToStep = true;
    try { window._policyMapOrigGoToStep('ciso', pathAStep); }
    finally { window._policyMapInsideGoToStep = false; }
  } else if (typeof renderCISOStep === 'function') {
    renderCISOStep(pathAStep);
  }
  policyMapActivatePathAPanel(pathAStep);
  if (typeof updateCISOFinishBtn === 'function') updateCISOFinishBtn();
  policyMapPatchPathAFooters(pathBStep);
  policyMapUpdateProgress(pathBStep);
}

/** Path A footers that Path B rewrites, with their app.html defaults for restoration. */
var POLICY_MAP_PATH_A_FOOTERS = [
  { panel: 3, sel: '.btn-primary', text: 'Next: Reg mapping \u2192', onclick: 'cisoNext(3)' },
  { panel: 8, sel: '.btn-secondary', text: '\u2190 Back', onclick: "goToStep('ciso',7)" }
];

function policyMapFooterButton(panel, sel) {
  return document.querySelector('#ciso-step-' + panel + ' .wizard-step-footer ' + sel);
}

/**
 * Point the reused Path A footers at Path B. The final Path B step keeps Path A's
 * finalize button (#ciso-finalise-btn) as its primary action, so no "Next" is shown.
 */
function policyMapPatchPathAFooters(step) {
  if (!shouldRenderPolicyMapSetup()) {
    restorePathAFooters();
    return;
  }
  var btn3 = policyMapFooterButton(3, '.btn-primary');
  if (btn3) {
    btn3.textContent = 'Next: Catalog documents \u2192';
    btn3.setAttribute('onclick', 'policyMapNext(3)');
  }
  if (step === POLICY_MAP_STEPS) {
    var back = policyMapFooterButton(8, '.btn-secondary');
    if (back) {
      back.setAttribute('onclick', 'policyMapGoTo(' + (POLICY_MAP_STEPS - 1) + ')');
      back.textContent = '\u2190 Back to ' + (POLICY_MAP_STEP_LABELS[POLICY_MAP_STEPS - 2] || 'previous step').toLowerCase();
    }
  }
}

/** Put the footers Path B rewrites back to their Path A defaults. */
function restorePathAFooters() {
  POLICY_MAP_PATH_A_FOOTERS.forEach(function(f) {
    var btn = policyMapFooterButton(f.panel, f.sel);
    if (!btn) return;
    btn.textContent = f.text;
    btn.setAttribute('onclick', f.onclick);
  });
}

function renderPolicyMapCisoTab() {
  migratePolicyMapWizardRev();
  var tabCiso = document.getElementById('tab-ciso');
  if (tabCiso) {
    var ph = tabCiso.querySelector('.page-header');
    if (ph) ph.querySelectorAll('.role-badge').forEach(function(el) { el.remove(); });
  }
  var step = parseInt(state.policyMapStep, 10) || 1;
  policyMapUpdateProgress(step);

  var pathAStep = policyMapPathAStep(step);
  if (pathAStep) {
    policyMapShowPathAStep(pathAStep, step);
    return;
  }

  policyMapSetChrome('pmap');
  renderPolicyMapWizardBody(step);
}

function renderPolicyMapWizardBody(step) {
  var root = document.getElementById('pmap-root');
  if (!root) return;
  var inner = '';
  if (step === 4) inner = renderPolicyMapCatalogHtml();
  else if (step === 5) inner = renderPolicyMapAlignHtml();
  else inner = renderPolicyMapCoverageHtml();

  var backStep = step - 1;
  var nextLabel = step === 4 ? 'Next: Map to NIST \u2192' : step === 5 ? 'Next: Policy set \u2192' : 'Next: Assign owners \u2192';
  var nextFn = step === 6 ? 'policyMapConfirmCoverage()' : 'policyMapNext(' + step + ')';

  root.innerHTML = ''
    + '<div class="wizard-step active pmap-step">'
    + '<div class="wizard-step-body pmap-step-body">' + inner + '</div>'
    + '<div class="wizard-step-footer">'
    + '<button type="button" class="btn btn-secondary" onclick="policyMapGoTo(' + backStep + ')">\u2190 Back</button>'
    + '<button type="button" class="btn btn-primary" onclick="' + nextFn + '">' + nextLabel + '</button>'
    + '</div></div>';
}

function policyMapRerender() {
  setTimeout(function() {
    var step = parseInt(state.policyMapStep, 10) || 1;
    if (step === 4 || step === 5 || step === 6) renderPolicyMapWizardBody(step);
  }, 0);
}

function policyMapAddDocument() {
  ensurePolicyCatalog();
  var doc = policyMapNormalizeDoc({
    id: policyMapNewId(),
    title: '',
    type: 'policy',
    ownerName: state.programOwner || '',
    ownerEmail: state.programOwnerEmail || '',
    ownerRole: state.programOwnerTitle || ''
  });
  state.policyCatalog.push(doc);
  state._policyMapEditId = doc.id;
  markDirty();
  policyMapRerender();
}

function policyMapRemoveDocument(id) {
  ensurePolicyCatalog();
  if (!window.confirm('Remove this document from the catalog? Mapping on this row is discarded; other documents are kept.')) return;
  state.policyCatalog = state.policyCatalog.filter(function(d) { return d && d.id !== id; });
  if (state._policyMapEditId === id) state._policyMapEditId = '';
  markDirty();
  policyMapRerender();
}

function policyMapStartEdit(id) {
  state._policyMapEditId = id;
  policyMapRerender();
}

function policyMapSaveEdit(id) {
  var doc = getPolicyCatalogDoc(id);
  if (!doc) return;
  var titleEl = document.getElementById('pmap-edit-title');
  var typeEl = document.getElementById('pmap-edit-type');
  var nameEl = document.getElementById('pmap-edit-owner');
  var emailEl = document.getElementById('pmap-edit-email');
  var roleEl = document.getElementById('pmap-edit-role');
  var srcEl = document.getElementById('pmap-edit-source');
  if (titleEl) doc.title = titleEl.value;
  if (typeEl) doc.type = typeEl.value;
  if (nameEl) doc.ownerName = nameEl.value;
  if (emailEl) doc.ownerEmail = emailEl.value;
  if (roleEl) doc.ownerRole = roleEl.value;
  if (srcEl) doc.sourceNote = srcEl.value;
  if (!String(doc.title || '').trim()) {
    showToast('Give the document a title before saving.', true);
    return;
  }
  state._policyMapEditId = '';
  markDirty();
  policyMapRerender();
}

function renderPolicyMapCatalogHtml() {
  ensurePolicyCatalog();
  var rows = state.policyCatalog;
  var cards = '';
  if (!rows.length) {
    cards = '<div class="pmap-empty">No documents yet. Add the policies, standards, or procedures you already have \u2014 a title, type, and owner is enough for v1. You will map them to NIST families on the next step.</div>';
  }
  rows.forEach(function(raw) {
    var d = policyMapNormalizeDoc(raw);
    var editing = state._policyMapEditId === d.id;
    var fams = policyMapDocFamilies(d);
    var fns = policyMapNormalizeCsfFunctions(d.csfFunctions);
    if (d.isProgramPolicy && fns.indexOf('GV') === -1) fns = ['GV'].concat(fns);
    var famBits = '';
    if (fns.length) {
      famBits += fns.map(function(fn) {
        return '<span class="pmap-chip pmap-chip-quiet pmap-chip-fn csf-fn-' + fn.toLowerCase() + '"><span class="pmap-chip-code">' + escapeHTML(fn) + '</span>' + escapeHTML(policyMapCsfFunctionName(fn)) + '</span>';
      }).join('');
    }
    if (fams.length) {
      famBits += fams.map(function(f) { return '<span class="pmap-chip pmap-chip-quiet">' + escapeHTML(f) + '</span>'; }).join('');
    }
    if (d.isProgramPolicy) famBits += '<span class="pmap-chip pmap-chip-quiet">ISP</span>';
    if (!famBits) famBits = '<span class="pmap-muted">Not mapped yet</span>';
    if (editing) {
      cards += ''
        + '<div class="pmap-card pmap-card-edit">'
        + '<div class="pmap-grid">'
        + '<label class="pmap-field"><span>Title</span><input id="pmap-edit-title" class="form-input" value="' + escapeHTML(d.title) + '" placeholder="e.g. Access Control Policy"></label>'
        + '<label class="pmap-field"><span>Type</span><select id="pmap-edit-type" class="form-select">'
        + POLICY_MAP_DOC_TYPES.map(function(t) {
          return '<option value="' + t.id + '"' + (d.type === t.id ? ' selected' : '') + '>' + escapeHTML(t.label) + ' \u2014 ' + escapeHTML(t.hint) + '</option>';
        }).join('')
        + '</select></label>'
        + '<label class="pmap-field"><span>Owner name</span><input id="pmap-edit-owner" class="form-input" value="' + escapeHTML(d.ownerName) + '"></label>'
        + '<label class="pmap-field"><span>Owner email</span><input id="pmap-edit-email" class="form-input" type="email" value="' + escapeHTML(d.ownerEmail) + '"></label>'
        + '<label class="pmap-field"><span>Owner role</span><input id="pmap-edit-role" class="form-input" value="' + escapeHTML(d.ownerRole) + '"></label>'
        + '<label class="pmap-field pmap-field-wide"><span>URL or filename note</span><input id="pmap-edit-source" class="form-input" value="' + escapeHTML(d.sourceNote) + '" placeholder="SharePoint link, file name, or location \u2014 not uploaded"></label>'
        + '</div>'
        + '<div class="pmap-card-actions">'
        + '<button type="button" class="btn btn-primary btn-sm" onclick="policyMapSaveEdit(\'' + policyMapEscId(d.id) + '\')">Save document</button>'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="state._policyMapEditId=\'\';policyMapRerender()">Cancel</button>'
        + '</div></div>';
      return;
    }
    cards += ''
      + '<div class="pmap-card">'
      + '<div class="pmap-card-head">'
      + '<div><div class="pmap-card-title">' + escapeHTML(d.title || 'Untitled document') + '</div>'
      + '<div class="pmap-card-meta">' + escapeHTML(policyMapDocTypeLabel(d.type))
      + (d.ownerName ? ' \u00b7 ' + escapeHTML(d.ownerName) : '')
      + (d.sourceNote ? ' \u00b7 ' + escapeHTML(d.sourceNote) : '')
      + (d.isProgramPolicy ? ' \u00b7 Organization ISP' : '')
      + '</div></div>'
      + '<div class="pmap-card-actions">'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="policyMapStartEdit(\'' + policyMapEscId(d.id) + '\')">Edit</button>'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="policyMapRemoveDocument(\'' + policyMapEscId(d.id) + '\')">Remove</button>'
      + '</div></div>'
      + '<div class="pmap-chip-row">' + famBits + '</div>'
      + '</div>';
  });

  return ''
    + '<div class="section-title">Catalog existing documents</div>'
    + '<div class="section-subtitle">Policies, standards, and procedures you already have. This is a structured catalog \u2014 not a file upload. Mapping to CSF Functions and 800-53 families happens on the next step.</div>'
    + '<div class="pmap-toolbar"><button type="button" class="btn btn-primary" onclick="policyMapAddDocument()">Add document</button>'
    + '<span class="pmap-muted">' + rows.length + ' in catalog</span></div>'
    + '<div class="pmap-list">' + cards + '</div>';
}

function policyMapToggleFamily(id, fam) {
  var doc = getPolicyCatalogDoc(id);
  if (!doc) return;
  if (!Array.isArray(doc.familyCodes)) doc.familyCodes = [];
  var i = doc.familyCodes.indexOf(fam);
  if (i === -1) doc.familyCodes.push(fam);
  else {
    doc.familyCodes.splice(i, 1);
    if (Array.isArray(doc.controlIds)) {
      doc.controlIds = doc.controlIds.filter(function(cid) { return policyMapControlFamily(cid) !== fam; });
    }
  }
  markDirty();
  policyMapRerender();
}

function policyMapToggleProgramPolicy(id, on) {
  var doc = getPolicyCatalogDoc(id);
  if (!doc) return;
  doc.isProgramPolicy = !!on;
  if (!Array.isArray(doc.csfFunctions)) doc.csfFunctions = [];
  var gi = doc.csfFunctions.indexOf('GV');
  if (on && gi === -1) doc.csfFunctions.push('GV');
  if (!on && gi !== -1) doc.csfFunctions.splice(gi, 1);
  markDirty();
  policyMapRerender();
}

function policyMapToggleCsfFunction(id, fn) {
  var doc = getPolicyCatalogDoc(id);
  if (!doc) return;
  fn = String(fn || '').toUpperCase();
  if (policyMapCsfFunctionIds().indexOf(fn) === -1) return;
  if (!Array.isArray(doc.csfFunctions)) doc.csfFunctions = [];
  var i = doc.csfFunctions.indexOf(fn);
  if (i === -1) doc.csfFunctions.push(fn);
  else {
    doc.csfFunctions.splice(i, 1);
    if (fn === 'GV') doc.isProgramPolicy = false;
  }
  markDirty();
  policyMapRerender();
}

function policyMapToggleControl(id, cid) {
  var doc = getPolicyCatalogDoc(id);
  if (!doc) return;
  if (!Array.isArray(doc.controlIds)) doc.controlIds = [];
  var i = doc.controlIds.indexOf(cid);
  if (i === -1) {
    doc.controlIds.push(cid);
    var fam = policyMapControlFamily(cid);
    if (fam && (!doc.familyCodes || doc.familyCodes.indexOf(fam) === -1)) {
      if (!doc.familyCodes) doc.familyCodes = [];
      doc.familyCodes.push(fam);
    }
  } else {
    doc.controlIds.splice(i, 1);
  }
  markDirty();
  policyMapRerender();
}

function policyMapSetCoverageNote(id, val) {
  var doc = getPolicyCatalogDoc(id);
  if (!doc) return;
  doc.coverageNote = val;
  markDirty();
}

function policyMapToggleExpand(id) {
  state._policyMapExpandedDocId = state._policyMapExpandedDocId === id ? '' : id;
  policyMapRerender();
}

function renderPolicyMapAlignHtml() {
  ensurePolicyCatalog();
  var named = state.policyCatalog.filter(function(d) { return d && String(d.title || '').trim(); });
  if (!named.length) {
    return '<div class="section-title">Map documents to CSF 2.0 and NIST 800-53</div>'
      + '<div class="pmap-empty">Add titled documents on the catalog step first, then map them here.</div>';
  }
  var fams = policyMapInScopeFamilies();
  var fnIds = policyMapCsfFunctionIds();
  var cards = named.map(function(raw) {
    var d = policyMapNormalizeDoc(raw);
    var expanded = state._policyMapExpandedDocId === d.id;
    var fnChips = fnIds.map(function(fn) {
      var on = (d.csfFunctions || []).indexOf(fn) !== -1 || (fn === 'GV' && d.isProgramPolicy);
      return '<button type="button" class="pmap-chip pmap-chip-fn csf-fn-' + fn.toLowerCase() + (on ? ' on' : '')
        + '" onclick="policyMapToggleCsfFunction(\'' + policyMapEscId(d.id) + '\',\'' + fn + '\')">'
        + '<span class="pmap-chip-code">' + escapeHTML(fn) + '</span>' + escapeHTML(policyMapCsfFunctionName(fn)) + '</button>';
    }).join('');
    var famChips = fams.map(function(f) {
      var on = (d.familyCodes || []).indexOf(f) !== -1;
      return '<button type="button" class="pmap-chip' + (on ? ' on' : '') + '" title="' + escapeHTML((FAMILIES && FAMILIES[f]) || f)
        + '" onclick="policyMapToggleFamily(\'' + policyMapEscId(d.id) + '\',\'' + f + '\')">' + escapeHTML(f) + '</button>';
    }).join('');
    var refine = '';
    if (expanded) {
      var selectedFams = policyMapDocFamilies(d);
      if (!selectedFams.length) {
        refine = '<p class="pmap-muted">Pick one or more families above, then optionally narrow to individual controls. Family-only mapping covers every in-scope control in that family.</p>';
      } else {
        refine = selectedFams.map(function(f) {
          var ctrls = policyMapInScopeControlsForFamily(f);
          var boxes = ctrls.map(function(c) {
            var checked = (d.controlIds || []).indexOf(c.id) !== -1;
            return '<label class="pmap-ctrl"><input type="checkbox"' + (checked ? ' checked' : '')
              + ' onchange="policyMapToggleControl(\'' + policyMapEscId(d.id) + '\',\'' + escapeHTML(c.id) + '\')">'
              + '<span class="control-id">' + escapeHTML(c.id) + '</span> ' + escapeHTML(c.n) + '</label>';
          }).join('');
          return '<div class="pmap-refine-fam"><div class="pmap-refine-label">' + escapeHTML(f) + ' \u2014 ' + escapeHTML((FAMILIES && FAMILIES[f]) || f)
            + '</div><p class="pmap-muted">Leave unchecked for a family-level map (all ' + ctrls.length + ' in-scope controls). Check specific controls to record partial coverage.</p>'
            + '<div class="pmap-ctrl-list">' + boxes + '</div></div>';
        }).join('');
      }
    }
    return ''
      + '<div class="pmap-card">'
      + '<div class="pmap-card-head"><div><div class="pmap-card-title">' + escapeHTML(d.title) + '</div>'
      + '<div class="pmap-card-meta">' + escapeHTML(policyMapDocTypeLabel(d.type)) + (d.ownerName ? ' \u00b7 ' + escapeHTML(d.ownerName) : '') + '</div></div></div>'
      + '<label class="pmap-check"><input type="checkbox"' + (d.isProgramPolicy ? ' checked' : '')
      + ' onchange="policyMapToggleProgramPolicy(\'' + policyMapEscId(d.id) + '\', this.checked)">'
      + ' This is the organization information security policy (Tier 1 / ISP) \u2014 same Govern outcome as claiming <span class="control-id">GV</span></label>'
      + '<div class="pmap-label">CSF 2.0 Functions <span class="pmap-muted pmap-layer-hint">outcome layer \u2014 your claim, not extracted from a file</span></div>'
      + '<div class="pmap-chip-row">' + fnChips + '</div>'
      + '<div class="pmap-label">800-53 families <span class="pmap-muted pmap-layer-hint">catalog layer \u2014 including Program Management (PM)</span></div>'
      + '<div class="pmap-chip-row">' + famChips + '</div>'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="policyMapToggleExpand(\'' + policyMapEscId(d.id) + '\')">'
      + (expanded ? 'Hide control refinement' : 'Refine controls (optional)') + '</button>'
      + (expanded ? '<div class="pmap-refine">' + refine + '</div>' : '')
      + '<label class="pmap-field pmap-field-wide" style="margin-top:12px;"><span>Coverage note (optional)</span>'
      + '<textarea class="form-input" rows="2" oninput="policyMapSetCoverageNote(\'' + policyMapEscId(d.id) + '\', this.value)" placeholder="e.g. Covers account provisioning; privileged access is in a separate standard">'
      + escapeHTML(d.coverageNote) + '</textarea></label>'
      + '</div>';
  }).join('');

  return ''
    + '<div class="section-title">Map documents to CSF 2.0 and NIST 800-53</div>'
    + '<div class="section-subtitle">Claim CSF Functions (Govern, Identify, Protect, Detect, Respond, Recover) as the outcome layer, then map 800-53 families and optionally individual controls as the catalog layer. Many-to-many. This is your assertion \u2014 nothing is extracted from a file. Family-only mapping covers every in-scope control in that family. PM is a mappable family; claiming Govern or marking the ISP checkbox both cover Govern / ISP readiness.</div>'
    + '<div class="pmap-list">' + cards + '</div>';
}

function policyMapFunctionDocuments() {
  if (typeof getPolicyBoardDocuments === 'function') {
    return getPolicyBoardDocuments().docs.filter(function(d) {
      return d && !d.empty && !d.standalone && d.master;
    }).map(function(d) {
      return {
        master: d.master,
        fnIds: (d.fnIds && d.fnIds.length) ? d.fnIds.slice() : (d.fn ? [d.fn] : []),
        families: (d.families || []).slice(),
        title: d.title,
        combined: !!d.combined
      };
    });
  }
  if (typeof ensureCsfFunctionGrouping === 'function') ensureCsfFunctionGrouping();
  var groups = (typeof getCsfResolvedPolicyGroups === 'function') ? getCsfResolvedPolicyGroups() : [];
  var byRoot = {};
  var order = [];
  groups.forEach(function(g) {
    if (!g || !g.master || g.fn === 'GV') return;
    var root = policyMapMergeRoot(g.master);
    if (!byRoot[root]) {
      byRoot[root] = { master: root, fnIds: [], titles: [], families: [] };
      order.push(root);
    }
    var bucket = byRoot[root];
    if (bucket.fnIds.indexOf(g.fn) === -1) {
      bucket.fnIds.push(g.fn);
      bucket.titles.push(g.title);
    }
    (g.families || []).forEach(function(f) {
      if (bucket.families.indexOf(f) === -1) bucket.families.push(f);
    });
  });
  return order.map(function(root) {
    var b = byRoot[root];
    var custom = (state.domainCustomNames && state.domainCustomNames[root]) || '';
    var title = custom || (b.titles.length > 1 ? b.titles.join(' & ') : (b.titles[0] || root));
    return {
      master: root,
      fnIds: b.fnIds,
      families: b.families,
      title: title,
      combined: b.fnIds.length > 1
    };
  });
}

function policyMapFunctionDocStatus(doc, cov) {
  var titles = [];
  var seen = {};
  function addTitle(t) {
    var name = String(t || '').trim();
    if (!name || seen[name]) return;
    seen[name] = true;
    titles.push(name);
  }
  (cov.csfRows || []).forEach(function(r) {
    if (doc.fnIds.indexOf(r.fn) === -1 || !r.mapped) return;
    (r.docs || []).forEach(function(d) { addTitle(d.title); });
  });
  (cov.rows || []).forEach(function(r) {
    if (doc.families.indexOf(r.fam) === -1 || r.status === 'gap') return;
    (r.docs || []).forEach(function(d) { addTitle(d.title); });
  });
  return { mapped: titles.length > 0, titles: titles };
}

function policyMapDocIsOmitted(doc) {
  if (!state.policyMapOmitFns) return false;
  return doc.fnIds.every(function(fn) { return !!state.policyMapOmitFns[fn]; });
}

function policyMapToggleMaintain(fnListCsv, on) {
  if (!state.policyMapOmitFns || typeof state.policyMapOmitFns !== 'object') state.policyMapOmitFns = {};
  String(fnListCsv || '').split(',').forEach(function(fn) {
    fn = String(fn || '').trim().toUpperCase();
    if (!fn) return;
    if (on) delete state.policyMapOmitFns[fn];
    else state.policyMapOmitFns[fn] = true;
  });
  markDirty();
  policyMapRerender();
}

function policyMapCombineFunctions(keepFn, absorbFn) {
  keepFn = String(keepFn || '').toUpperCase();
  absorbFn = String(absorbFn || '').toUpperCase();
  if (!keepFn || !absorbFn || keepFn === absorbFn || keepFn === 'GV' || absorbFn === 'GV') return;
  var model = (typeof getPolicyBoardDocuments === 'function') ? getPolicyBoardDocuments() : { docs: [] };
  var keep = null;
  var absorb = null;
  model.docs.forEach(function(d) {
    if (d.fnIds && d.fnIds.indexOf(keepFn) !== -1) keep = d;
    if (d.fnIds && d.fnIds.indexOf(absorbFn) !== -1) absorb = d;
  });
  if (!keep || !absorb || keep.master === absorb.master) return;
  if (typeof policyBoardMergeDocs === 'function') {
    policyBoardMergeDocs(absorb.master, keep.master);
    if (typeof policyBoardRerender === 'function') policyBoardRerender();
    return;
  }
}

function policyMapUncombineFunction(fn) {
  fn = String(fn || '').toUpperCase();
  if (!fn || fn === 'GV') return;
  var model = (typeof getPolicyBoardDocuments === 'function') ? getPolicyBoardDocuments() : { docs: [] };
  var host = null;
  model.docs.forEach(function(d) {
    if (d.fnIds && d.fnIds.indexOf(fn) !== -1) host = d;
  });
  if (host && typeof policyBoardSplitFn === 'function') {
    policyBoardSplitFn(host.master, fn);
    if (typeof policyBoardRerender === 'function') policyBoardRerender();
  }
}

function policyMapLeftoverFamilies(fnDocs) {
  var fams = (typeof getActiveFamilies === 'function' ? getActiveFamilies() : []).filter(function(f) { return f !== 'PM'; });
  var inDoc = {};
  (fnDocs || []).forEach(function(d) {
    (d.families || []).forEach(function(f) { inDoc[f] = true; });
  });
  var merges = state.policyMerges || {};
  return fams.filter(function(f) { return !inDoc[f] && !merges[f]; });
}

function policyMapConfirmCoverage() {
  if (!policyMapValidateUpTo(5)) return;
  if (typeof ensureCsfFunctionGrouping === 'function') ensureCsfFunctionGrouping();
  applyPolicyCatalogToProgram();
  if (!state.policyPriorities) state.policyPriorities = {};
  if (!state.domainCustomNames) state.domainCustomNames = {};
  var cov = getPolicyMapCoverage();
  policyMapFunctionDocuments().forEach(function(d) {
    var omitted = policyMapDocIsOmitted(d);
    var st = policyMapFunctionDocStatus(d, cov);
    if (omitted) state.policyPriorities[d.master] = 'later';
    else if (!st.mapped) state.policyPriorities[d.master] = 'now';
    if (d.combined) state.domainCustomNames[d.master] = d.title;
  });
  try {
    addAuditEntry('program', null, 'Policy set confirmed (' + (state.policyCatalog || []).length + ' catalog documents)');
  } catch (e) { /* ignore */ }
  showToast('Policy set saved. Mapped documents count as coverage; remaining Function policies can be drafted after owners are assigned.');
  policyMapGoTo(7);
}

function policyMapDraftMissing(fam) {
  var docs = policyMapFunctionDocuments();
  var allowed = {};
  docs.forEach(function(d) { allowed[d.master] = true; });
  policyMapLeftoverFamilies(docs).forEach(function(f) { allowed[f] = true; });
  if (!allowed[fam]) {
    showToast('Choose the Function policy document first. Family drafts come after the policy set is decided.', true);
    return;
  }
  applyPolicyCatalogToProgram();
  if (typeof enterPolicyWizard === 'function') {
    showTab('policy');
    setTimeout(function() { enterPolicyWizard(fam); }, 0);
  } else {
    showToast('Open Domain Policies after setup to draft that Function policy.', true);
  }
}

function policyMapAddAnother() {
  state.policyMapStep = 4;
  policyMapAddDocument();
}

function renderPolicyMapCoverageHtml() {
  if (typeof policyBoardEnsureDelegates === 'function') policyBoardEnsureDelegates();
  if (typeof ensureCsfFunctionGrouping === 'function') ensureCsfFunctionGrouping();
  var cov = getPolicyMapCoverage();
  var model = (typeof getPolicyBoardDocuments === 'function')
    ? getPolicyBoardDocuments()
    : { docs: [], emptyFns: [] };
  var ispChip = cov.ispMapped
    ? '<span class="pmap-status mapped">Mapped</span>'
    : '<span class="pmap-status gap">Needs a catalog map</span>';
  var ispDocs = cov.ispDocs.map(function(d) { return escapeHTML(d.title); }).join(', ') || 'None';
  var ispMeta = cov.ispMapped
    ? 'PM lives in the ISP. Mapped from: ' + ispDocs
    : 'PM lives in the ISP. Map a catalog document to Govern, or mark one as the ISP.';

  function isMappedDoc(d) {
    if (!d || d.empty || d.standalone) return false;
    if (typeof policyMapDocIsOmitted === 'function' && policyMapDocIsOmitted(d)) return false;
    var st = policyMapFunctionDocStatus(d, cov);
    return !!st.mapped;
  }

  var mappedDocs = model.docs.filter(isMappedDoc);
  var neededDocs = model.docs.filter(function(d) { return !isMappedDoc(d) && !d.standalone; });
  var standalones = model.docs.filter(function(d) { return d.standalone; });
  var cardOpts = { canMoveChip: true };

  function extrasFor(d, inNeeded) {
    if (!d || d.empty) return '';
    var omitted = typeof policyMapDocIsOmitted === 'function' && policyMapDocIsOmitted(d);
    var st = policyMapFunctionDocStatus(d, cov);
    var bits = '';
    if (inNeeded && !d.standalone) {
      var fnCsv = (d.fnIds && d.fnIds.length) ? d.fnIds.join(',') : d.fn;
      if (fnCsv) {
        bits += '<label class="pmap-check pmap-doc-keep"><input type="checkbox"' + (omitted ? '' : ' checked')
          + ' onchange="policyMapToggleMaintain(\'' + fnCsv + '\', this.checked)">'
          + '<span>Include in the program</span></label>';
      }
    }
    if (inNeeded && omitted) {
      bits += '<span class="pmap-status gap">Not in the policy set</span>';
    } else if (inNeeded && !d.standalone && !st.mapped) {
      bits += '<span class="pmap-status partial">Draft after setup</span>';
      bits += '<div class="pmap-card-actions" style="margin-top:8px;">'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="policyMapDraftMissing(\'' + d.master + '\')">Draft this Function policy</button></div>';
    } else if (!inNeeded && st.mapped) {
      bits += '<p class="pmap-muted">Mapped from: ' + st.titles.map(escapeHTML).join(', ') + '</p>';
    }
    return bits;
  }

  var mappedCards = mappedDocs.map(function(d) {
    return renderPolicyBoardCardHtml(d, Object.assign({}, cardOpts, {
      mapped: true,
      statusHtml: '<span class="pmap-status mapped">Mapped</span>',
      cardExtra: function(doc) { return extrasFor(doc, false); }
    }));
  }).join('');

  var neededCards = neededDocs.concat(model.emptyFns || []).map(function(d) {
    return renderPolicyBoardCardHtml(d, Object.assign({}, cardOpts, {
      cardExtra: function(doc) { return extrasFor(doc, true); }
    }));
  }).join('');

  return ''
    + '<div class="section-title">Policy set</div>'
    + '<div class="pmap-lead-q">Besides the ISP, which documents will you maintain?</div>'
    + '<p class="pmap-help">Mapped documents already count. Drag a family onto another document to move it, or use Move and Merge.</p>'
    + '<div class="pgb-actions" style="margin-bottom:16px;"><button type="button" class="btn btn-secondary btn-sm" data-pgb-reset>Reset to CSF defaults</button></div>'
    + '<div class="pmap-cov-section">'
    + '<div class="pmap-cov-heading">Already mapped</div>'
    + '<div class="pgb-board pmap-doc-list">'
    + '<div class="pgb-card pgb-card-isp pmap-isp-card"><div class="pgb-card-head"><div><div class="pgb-card-title">Govern \u2014 organization ISP</div>'
    + '<div class="pmap-card-meta">' + ispMeta + '</div></div>' + ispChip + '</div>'
    + (cov.ispMapped ? '' : '<div class="pmap-card-actions" style="margin-top:10px;"><button type="button" class="btn btn-secondary btn-sm" onclick="state.policyMapStep=5;policyMapRerender()">Claim Govern or mark a document as the ISP</button></div>')
    + '</div>'
    + mappedCards
    + '</div></div>'
    + '<hr class="pmap-cov-divider">'
    + '<div class="pmap-cov-section">'
    + '<div class="pmap-cov-heading">Still needed</div>'
    + '<p class="pmap-muted pmap-cov-intro">No catalog document covers these Functions yet. After you assign owners, draft each as one Function policy.</p>'
    + '<div class="pgb-board pmap-doc-list">' + (neededCards || '<p class="pmap-muted">Every Function is covered by a mapped catalog document.</p>') + '</div>'
    + '<div class="pgb-well" data-pgb-slot="standalone">'
    + '<div class="pgb-well-label">Standalone documents</div>'
    + '<p class="pgb-well-hint">Drop a family here to give it its own document.</p>'
    + standalones.map(function(d) { return renderPolicyBoardCardHtml(d, cardOpts); }).join('')
    + '</div></div>';
}

function installPolicyMapHooks() {
  if (window._policyMapHooksInstalled) return;
  window._policyMapHooksInstalled = true;

  if (typeof goToStep === 'function') {
    window._policyMapOrigGoToStep = goToStep;
    goToStep = function(tabId, step) {
      if (tabId === 'ciso' && shouldRenderPolicyMapSetup()) {
        state.policyMapStep = policyMapStepForPathAStep(step);
        renderPolicyMapCisoTab();
        return;
      }
      return window._policyMapOrigGoToStep.apply(this, arguments);
    };
  }

  if (typeof renderCISOTab === 'function') {
    var _renderCISOTab = renderCISOTab;
    renderCISOTab = function() {
      if (shouldRenderPolicyMapSetup()) {
        renderPolicyMapCisoTab();
        return;
      }
      policyMapSetChrome('pathA');
      return _renderCISOTab.apply(this, arguments);
    };
  }

  if (typeof cisoNext === 'function') {
    var _cisoNext = cisoNext;
    cisoNext = function(fromStep) {
      if (shouldRenderPolicyMapSetup()) {
        policyMapNext(fromStep);
        return;
      }
      return _cisoNext.apply(this, arguments);
    };
  }

  if (typeof cisoFinish === 'function') {
    var _cisoFinish = cisoFinish;
    cisoFinish = function() {
      if ((state.policyCatalog || []).length && typeof applyPolicyCatalogToProgram === 'function') {
        applyPolicyCatalogToProgram();
      }
      return _cisoFinish.apply(this, arguments);
    };
  }

  if (typeof updateCisoSetupProgress === 'function') {
    var _upd = updateCisoSetupProgress;
    updateCisoSetupProgress = function(step) {
      if (shouldRenderPolicyMapSetup()) {
        policyMapUpdateProgress(state.policyMapStep || step);
        return;
      }
      return _upd.apply(this, arguments);
    };
  }
}

installPolicyMapHooks();
