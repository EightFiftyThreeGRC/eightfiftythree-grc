// js/policy-map.js — Path B: catalog existing policies and map them to NIST 800-53.
// Globals only. Load after program.js and app.js so hooks can wrap the CISO wizard.
// Path A (build-from-scratch) stays in js/program.js unchanged.

var POLICY_MAP_STEPS = 7;
var POLICY_MAP_STEP_LABELS = ['Organization', 'Profile', 'Program', 'Catalog', 'Map', 'Coverage', 'Assign owners'];
var POLICY_MAP_DOC_TYPES = [
  { id: 'policy', label: 'Policy', hint: 'Intent \u2014 what must be true' },
  { id: 'standard', label: 'Standard', hint: 'Measurable requirement' },
  { id: 'procedure', label: 'Procedure', hint: 'How the work is done' }
];

function getResolvedProgramPath() {
  var p = state && state.programPath;
  if (p === 'build' || p === 'map') return p;
  if (state && state.cisoComplete) return 'build';
  var started = !!(String((state && state.orgName) || '').trim()
    || String((state && state.programOwner) || '').trim()
    || (state && state.baseline));
  if (started) return 'build';
  return '';
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

function shouldRenderPolicyMapSetup() {
  return getResolvedProgramPath() === 'map' && !state.cisoComplete;
}

function ensurePolicyCatalog() {
  if (!Array.isArray(state.policyCatalog)) state.policyCatalog = [];
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
    coverageNote: String(d.coverageNote || '').trim(),
    isProgramPolicy: !!d.isProgramPolicy
  };
}

function policyMapInScopeFamilies() {
  var fams = typeof getActiveFamilies === 'function' ? getActiveFamilies() : Object.keys(FAMILIES || {});
  return fams.filter(function(f) { return f !== 'PM'; });
}

function policyMapInScopeControlsForFamily(fam) {
  var all = typeof getActiveControls === 'function' ? getActiveControls() : [];
  return all.filter(function(c) { return c && c.f === fam; });
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
    if (!f || seen[f] || f === 'PM') return;
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
  var ispMapped = docs.some(function(d) { return d.isProgramPolicy || (d.familyCodes || []).indexOf('PM') !== -1; });
  var rows = families.map(function(fam) {
    var ctrls = policyMapInScopeControlsForFamily(fam);
    var inScopeIds = ctrls.map(function(c) { return c.id; });
    var hits = docs.filter(function(d) { return policyMapDocFamilies(d).indexOf(fam) !== -1; });
    var status = policyMapFamilyCoverageStatus(fam, hits, inScopeIds);
    var coveredIds = [];
    var familyLevel = hits.some(function(d) {
      return (d.familyCodes || []).indexOf(fam) !== -1
        && !(d.controlIds || []).some(function(cid) { return policyMapControlFamily(cid) === fam; });
    });
    if (familyLevel) {
      coveredIds = inScopeIds.slice();
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
    ispDocs: docs.filter(function(d) { return d.isProgramPolicy || (d.familyCodes || []).indexOf('PM') !== -1; }),
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
        scope: 'Controls in the ' + ((FAMILIES && FAMILIES[fam]) || fam) + ' family that are in the program baseline and listed on the mapped documents.',
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
  if (path !== 'build' && path !== 'map') return;
  var prev = state.programPath;
  if (prev && prev !== path) {
    if (!window.confirm('Switch program path?\n\nMapping work is kept. Drafted ISP and domain policies are kept. Command Center and setup will follow the path you pick now.')) {
      return;
    }
  }
  state.programPath = path;
  if (path === 'map') {
    if (!state.policyMapStep) state.policyMapStep = 1;
    policyMapEnsurePmDefaults();
  }
  try {
    addAuditEntry('program', null, path === 'map'
      ? 'Program path chosen: Map what you have (catalog existing policies to NIST 800-53)'
      : 'Program path chosen: Build from scratch (draft ISP and domain policies)');
  } catch (e) { /* ignore */ }
  markDirty();
  if (path === 'map') continuePolicyMapSetup();
  else startProgramSetup();
}

function promptSwitchProgramPath() {
  var next = getResolvedProgramPath() === 'map' ? 'build' : 'map';
  chooseProgramPath(next);
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
      return d && ((d.familyCodes && d.familyCodes.length) || (d.controlIds && d.controlIds.length) || d.isProgramPolicy);
    });
    if (!anyMapped) {
      showToast('Map at least one document to a control family (or mark it as the organization ISP) before reviewing coverage.', true);
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
    : ['Organization', 'Profile', 'Program', 'Reg mapping', 'PM Controls', 'InfoSec Policy', 'Consolidate', 'Assign Owners'];
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

function policyMapPatchPathAFooters(step) {
  var btn3 = document.querySelector('#ciso-step-3 .wizard-step-footer .btn-primary');
  if (btn3) {
    btn3.textContent = 'Next: Catalog documents \u2192';
    btn3.setAttribute('onclick', 'policyMapNext(3)');
  }
  if (step === 7) {
    var back = document.querySelector('#ciso-step-8 .wizard-step-footer .btn-secondary');
    if (back) {
      back.setAttribute('onclick', 'policyMapGoTo(6)');
      back.textContent = '\u2190 Back to coverage';
    }
  }
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

  if (step <= 3) {
    policyMapSetChrome('pathA');
    if (typeof currentStep !== 'undefined') currentStep.ciso = step;
    if (typeof window._policyMapOrigGoToStep === 'function') {
      window._policyMapInsideGoToStep = true;
      try { window._policyMapOrigGoToStep('ciso', step); }
      finally { window._policyMapInsideGoToStep = false; }
    } else if (typeof renderCISOStep === 'function') {
      renderCISOStep(step);
    }
    policyMapPatchPathAFooters(step);
    policyMapUpdateProgress(step);
    return;
  }

  if (step === 7) {
    policyMapSetChrome('pathA');
    if (typeof currentStep !== 'undefined') currentStep.ciso = 8;
    if (typeof renderCISOStep === 'function') renderCISOStep(8);
    if (typeof updateCISOFinishBtn === 'function') updateCISOFinishBtn();
    policyMapPatchPathAFooters(7);
    policyMapUpdateProgress(7);
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
  var nextLabel = step === 4 ? 'Next: Map to NIST \u2192' : step === 5 ? 'Next: Coverage review \u2192' : 'Confirm mapping \u2192';
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
    var famBits = fams.length
      ? fams.map(function(f) { return '<span class="pmap-chip pmap-chip-quiet">' + escapeHTML(f) + '</span>'; }).join('')
      : (d.isProgramPolicy ? '<span class="pmap-chip pmap-chip-quiet">ISP</span>' : '<span class="pmap-muted">Not mapped yet</span>');
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
    + '<div class="section-subtitle">Policies, standards, and procedures you already have. This is a structured catalog \u2014 not a file upload. Mapping to NIST families happens on the next step.</div>'
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
    return '<div class="section-title">Map documents to NIST 800-53</div>'
      + '<div class="pmap-empty">Add titled documents on the catalog step first, then map them here.</div>';
  }
  var fams = policyMapInScopeFamilies();
  var cards = named.map(function(raw) {
    var d = policyMapNormalizeDoc(raw);
    var expanded = state._policyMapExpandedDocId === d.id;
    var famChips = fams.map(function(f) {
      var on = (d.familyCodes || []).indexOf(f) !== -1;
      return '<button type="button" class="pmap-chip' + (on ? ' on' : '') + '" onclick="policyMapToggleFamily(\'' + policyMapEscId(d.id) + '\',\'' + f + '\')">' + escapeHTML(f) + '</button>';
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
      + ' This is the organization information security policy (Tier 1 / ISP)</label>'
      + '<div class="pmap-label">Quick map by family</div>'
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
    + '<div class="section-title">Map documents to NIST 800-53</div>'
    + '<div class="section-subtitle">A document implements or directs one or more controls \u2014 mapping is many-to-many. Quick-map by family, then optionally name individual controls. Family-only means every in-scope control in that family is covered.</div>'
    + '<div class="pmap-list">' + cards + '</div>';
}

function policyMapConfirmCoverage() {
  if (!policyMapValidateUpTo(4)) return;
  applyPolicyCatalogToProgram();
  try {
    addAuditEntry('program', null, 'Existing-policy mapping confirmed (' + (state.policyCatalog || []).length + ' documents)');
  } catch (e) { /* ignore */ }
  showToast('Mapped documents now count as policy coverage for those families.');
  policyMapGoTo(7);
}

function policyMapDraftMissing(fam) {
  applyPolicyCatalogToProgram();
  if (typeof enterPolicyWizard === 'function') {
    showTab('policy');
    setTimeout(function() { enterPolicyWizard(fam); }, 0);
  } else {
    showToast('Open Domain Policies after setup to draft ' + fam + '.', true);
  }
}

function policyMapAddAnother() {
  state.policyMapStep = 4;
  policyMapAddDocument();
}

function renderPolicyMapCoverageHtml() {
  if (typeof ensureCsfFunctionGrouping === 'function') ensureCsfFunctionGrouping();
  var cov = getPolicyMapCoverage();
  var ispChip = cov.ispMapped
    ? '<span class="pmap-status mapped">Mapped</span>'
    : '<span class="pmap-status gap">Gap</span>';
  var ispDocs = cov.ispDocs.map(function(d) { return escapeHTML(d.title); }).join(', ') || 'None';

  var rows = cov.rows.map(function(r) {
    var stClass = r.status === 'mapped' ? 'mapped' : r.status === 'partial' ? 'partial' : 'gap';
    var stLabel = r.status === 'mapped' ? 'Mapped' : r.status === 'partial' ? 'Partial' : 'Gap';
    var docs = r.docs.map(function(d) { return escapeHTML(d.title || 'Untitled'); }).join(', ') || '\u2014';
    var actions = '';
    if (r.status === 'gap') {
      actions = '<button type="button" class="btn btn-secondary btn-sm" onclick="policyMapAddAnother()">Map another doc</button>'
        + ' <button type="button" class="btn btn-secondary btn-sm" onclick="policyMapDraftMissing(\'' + r.fam + '\')">Draft missing policy</button>';
    } else if (r.status === 'partial') {
      actions = '<button type="button" class="btn btn-secondary btn-sm" onclick="state.policyMapStep=5;policyMapRerender()">Refine mapping</button>'
        + ' <button type="button" class="btn btn-secondary btn-sm" onclick="policyMapAddAnother()">Map another doc</button>';
    } else {
      actions = '<span class="pmap-muted">Existing documents cover this family</span>';
    }
    return '<tr>'
      + '<td><span class="control-id">' + escapeHTML(r.fam) + '</span><div class="pmap-fam-name">' + escapeHTML(r.name) + '</div></td>'
      + '<td><span class="pmap-status ' + stClass + '">' + stLabel + '</span></td>'
      + '<td>' + r.covered + ' / ' + r.inScope + '</td>'
      + '<td>' + docs + '</td>'
      + '<td>' + actions + '</td>'
      + '</tr>';
  }).join('');

  return ''
    + '<div class="section-title">Coverage review</div>'
    + '<div class="section-subtitle">Families with mapped documents will count as policy coverage for control implementation. Gaps stay available to map another existing document or draft in-app. Mapped 800-53 controls are also shown as CSF 2.0 outcomes below \u2014 aligned to CSF 2.0, not a CSF Profile.</div>'
    + (typeof renderCsfCoverageStripHtml === 'function' ? renderCsfCoverageStripHtml('embed') : '')
    + '<div class="pmap-kpi">'
    + '<div class="pmap-kpi-card"><div class="pmap-kpi-val">' + cov.mapped + '</div><div class="pmap-kpi-label">Mapped families</div></div>'
    + '<div class="pmap-kpi-card"><div class="pmap-kpi-val">' + cov.partial + '</div><div class="pmap-kpi-label">Partial</div></div>'
    + '<div class="pmap-kpi-card"><div class="pmap-kpi-val">' + cov.gap + '</div><div class="pmap-kpi-label">Gaps</div></div>'
    + '</div>'
    + '<div class="pmap-card"><div class="pmap-card-head"><div><div class="pmap-card-title">Organization ISP (Tier 1)</div>'
    + '<div class="pmap-card-meta">Govern (GV) is this ISP \u2014 XX-1 policy-and-procedures controls and selected PM controls. Mapped from: ' + ispDocs + '</div></div>'
    + ispChip + '</div>'
    + (cov.ispMapped ? '' : '<div class="pmap-card-actions" style="margin-top:10px;"><button type="button" class="btn btn-secondary btn-sm" onclick="state.policyMapStep=5;policyMapRerender()">Mark a document as the ISP</button></div>')
    + '</div>'
    + (typeof renderCsfFunctionGroupingHtml === 'function'
      ? '<div class="csf-merge-pathb-note">Domain policies default-group by CSF Function (Identify / Protect / Detect / Respond / Recover). Family coverage in the table still stands; a mapped Function policy covers every family in that group.</div>'
        + renderCsfFunctionGroupingHtml(
          (typeof getActiveFamilies === 'function' ? getActiveFamilies() : []).filter(function(f){ return f !== 'PM'; }),
          (typeof state !== 'undefined' && state.policyMerges) ? state.policyMerges : {}
        )
      : '')
    + '<div class="table-scroll"><table class="control-table pmap-table"><thead><tr>'
    + '<th>Family</th><th>Coverage</th><th>Controls</th><th>Documents</th><th>Action</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
    + (cov.gap ? '<p class="pmap-note">You can confirm with gaps. Unmapped families stay Not Started until you map another document or draft them in Domain Policies.</p>' : '')
    + '<p class="pmap-note">Confirm writes <span class="control-id">Mapped (existing)</span> policy records so control owners are not blocked on families you have covered.</p>';
}

function installPolicyMapHooks() {
  if (window._policyMapHooksInstalled) return;
  window._policyMapHooksInstalled = true;

  if (typeof goToStep === 'function') {
    window._policyMapOrigGoToStep = goToStep;
    goToStep = function(tabId, step) {
      if (tabId === 'ciso' && shouldRenderPolicyMapSetup()) {
        if (step <= 3) {
        state.policyMapStep = step;
        window._policyMapInsideGoToStep = true;
        try {
          var ret = window._policyMapOrigGoToStep('ciso', step);
          policyMapSetChrome('pathA');
          policyMapPatchPathAFooters(step);
          policyMapUpdateProgress(step);
          return ret;
        } finally { window._policyMapInsideGoToStep = false; }
        }
        if (step >= 4 && step <= 7) {
          state.policyMapStep = 4;
          renderPolicyMapCisoTab();
          return;
        }
        if (step === 8) {
          state.policyMapStep = 7;
          renderPolicyMapCisoTab();
          return;
        }
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
      if (getResolvedProgramPath() === 'map') applyPolicyCatalogToProgram();
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
