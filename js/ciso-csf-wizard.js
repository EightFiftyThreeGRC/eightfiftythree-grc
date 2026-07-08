// js/ciso-csf-wizard.js — CSF 2.0 CISO wizard step overrides (loads after program.js)

var CISO_STEP_LABELS = ['Organization', 'Category scope', 'Reg mapping', 'Govern outcomes', 'Governance Policy', 'Consolidate', 'Assign Owners'];

function ensureSelectedCategoriesSeeded() {
  if (!state.selectedCategories) {
    state.selectedCategories = typeof getDefaultSelectedCategories === 'function'
      ? getDefaultSelectedCategories() : {};
  }
}

function toggleCategoryScope(catId) {
  ensureSelectedCategoriesSeeded();
  state.selectedCategories[catId] = !state.selectedCategories[catId];
  markDirty();
  renderCISOStep2CategoryScope();
  renderSidebarBadges();
}

function selectAllCategories(val) {
  ensureSelectedCategoriesSeeded();
  CATEGORIES.forEach(function(c) { state.selectedCategories[c.id] = !!val; });
  markDirty();
  renderCISOStep2CategoryScope();
  renderSidebarBadges();
}

function renderCISOStep2CategoryScope() {
  var body = document.getElementById('ciso-step-2-body');
  if (!body) return;
  ensureSelectedCategoriesSeeded();
  var activeCount = getActiveCategories().length;
  var subCount = getActiveSubcategories().length;
  var fnOrder = ['GV', 'ID', 'PR', 'DE', 'RS', 'RC'];
  var blocks = fnOrder.map(function(fn) {
    var cats = getCategoriesForFunction(fn);
    var rows = cats.map(function(c) {
      var on = !!state.selectedCategories[c.id];
      var subs = getSubcategoriesForCategory(c.id).length;
      return '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid ' + (on ? 'var(--teal)' : 'var(--border)') + ';border-radius:8px;background:' + (on ? '#ecfdf5' : '#fff') + ';cursor:pointer;">'
        + '<input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="toggleCategoryScope(\'' + escapeHTML(c.id).replace(/'/g, "\\'") + '\')" style="margin-top:2px;">'
        + '<div><div style="font-weight:700;font-size:13px;">' + escapeHTML(c.id) + ' — ' + escapeHTML(c.name) + '</div>'
        + '<div style="font-size:12px;color:var(--text-muted);">' + subs + ' subcategor' + (subs === 1 ? 'y' : 'ies') + '</div></div></label>';
    }).join('');
    return '<div style="margin-bottom:16px;"><div style="font-weight:800;font-size:14px;color:var(--navy);margin-bottom:8px;">'
      + escapeHTML(fn) + ' — ' + escapeHTML(FUNCTIONS[fn] || fn) + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px;">' + rows + '</div></div>';
  }).join('');

  body.innerHTML = cisoStepProgressHtml(2, 'Category scope')
    + '<div class="section-title">Select CSF categories in scope</div>'
    + '<div class="section-subtitle">Tag or untag NIST CSF 2.0 categories for your program. All categories are selected by default — remove any that do not apply.</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:14px;">'
    + '<button class="btn btn-secondary btn-sm" type="button" onclick="selectAllCategories(true)">Select all</button>'
    + '<button class="btn btn-secondary btn-sm" type="button" onclick="selectAllCategories(false)">Clear all</button>'
    + '</div>'
    + blocks
    + '<div class="summary-box" style="margin-top:16px;"><h3>Program scope</h3>'
    + '<div class="summary-kv"><span class="sk">Categories in scope:</span><span class="sv">' + activeCount + ' of ' + CATEGORIES.length + '</span></div>'
    + '<div class="summary-kv"><span class="sk">Subcategories in scope:</span><span class="sv">' + subCount + '</span></div></div>';
}

function renderCISOStep2Baseline() {
  renderCISOStep2CategoryScope();
}

function ensureGvSubcategoriesSeeded() {
  if (!state.gvSubcategories || !Object.keys(state.gvSubcategories).length) {
    state.gvSubcategories = typeof getDefaultGvSubcategories === 'function'
      ? getDefaultGvSubcategories() : {};
  }
}

function toggleGvSubcategory(subId) {
  ensureGvSubcategoriesSeeded();
  state.gvSubcategories[subId] = !state.gvSubcategories[subId];
  markDirty();
  renderCISOStep4Govern();
}

function selectAllGvSubcategories(val) {
  ensureGvSubcategoriesSeeded();
  SUBCATEGORIES.filter(function(s) { return s.fn === 'GV'; }).forEach(function(s) {
    state.gvSubcategories[s.id] = !!val;
  });
  markDirty();
  renderCISOStep4Govern();
}

function renderCISOStep4Govern() {
  var body = document.getElementById('ciso-step-4-body');
  if (!body) return;
  ensureGvSubcategoriesSeeded();
  var gvSubs = SUBCATEGORIES.filter(function(s) { return s.fn === 'GV'; });
  GV_CORE_SUBCATEGORIES.forEach(function(id) {
    if (state.gvSubcategories[id] === undefined) state.gvSubcategories[id] = true;
  });
  var rows = gvSubs.map(function(s) {
    var isCore = GV_CORE_SUBCATEGORIES.indexOf(s.id) !== -1;
    var text = (CSF_SUBCATEGORY_TEXT && CSF_SUBCATEGORY_TEXT[s.id]) || s.n;
    return '<tr' + (isCore ? ' style="background:rgba(13,148,136,0.04);"' : '') + '><td style="vertical-align:top;padding-top:12px;">'
      + '<label class="cb-label"><input type="checkbox" ' + (state.gvSubcategories[s.id] ? 'checked' : '')
      + ' onchange="state.gvSubcategories[\'' + escapeHTML(s.id).replace(/'/g, "\\'") + '\']=this.checked;markDirty();renderCISOStep4Govern();" style="accent-color:var(--teal);">'
      + '<span class="control-id">' + escapeHTML(s.id) + '</span>'
      + (isCore ? ' <span style="font-size:10px;background:var(--teal);color:white;padding:1px 5px;border-radius:8px;font-weight:700;">CORE</span>' : '')
      + '</label></td><td><div style="font-weight:600;font-size:13px;">' + escapeHTML(s.n) + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;line-height:1.4;">' + escapeHTML(text) + '</div></td></tr>';
  }).join('');
  var sel = Object.keys(state.gvSubcategories).filter(function(k) { return state.gvSubcategories[k]; }).length;
  body.innerHTML = '<div class="section-title">Select Govern (GV) outcomes</div>'
    + '<div class="section-subtitle">These outcomes drive your Tier 1 Governance Policy. Core GV subcategories are pre-selected.</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
    + '<button class="btn btn-secondary btn-sm" type="button" onclick="selectAllGvSubcategories(true)">Select all GV</button>'
    + '<button class="btn btn-secondary btn-sm" type="button" onclick="selectAllGvSubcategories(false)">Clear all</button></div>'
    + '<div class="table-scroll"><table class="control-table"><thead><tr><th style="width:140px;">Subcategory</th><th>Outcome</th></tr></thead><tbody>'
    + rows + '</tbody></table></div>'
    + '<div class="summary-box" style="margin-top:16px;"><h3>Govern summary</h3>'
    + '<div class="summary-kv"><span class="sk">GV subcategories selected:</span><span class="sv">' + sel + ' of ' + gvSubs.length + '</span></div></div>';
}

function renderCISOStep2() {
  renderCISOStep4Govern();
}

function getDefaultISPTitle() {
  return 'Cybersecurity Governance Policy';
}

function setPolicyStructure(mode) {
  if (mode !== 'function' && mode !== 'category') return;
  if (state.policyStructure === mode) return;
  if (state.domainOwners && Object.keys(state.domainOwners).some(function(k) {
    var o = state.domainOwners[k];
    return o && (o.email || o.name);
  })) {
    if (!confirm('Changing policy architecture will reset domain owner assignments and merge settings. Continue?')) return;
    state.domainOwners = {};
    state.policyMerges = {};
    state.categoryMerges = {};
    state.domainPolicies = null;
    state.policySelectedControls = null;
  }
  state.policyStructure = mode;
  syncCategoryMergesToPolicyMerges();
  markDirty();
  if (typeof renderCISOStep3 === 'function') renderCISOStep3();
}

function renderPolicyArchitectureCard() {
  var ps = state.policyStructure || 'category';
  return '<div class="summary-box" style="margin:16px 0;border:2px solid var(--teal);">'
    + '<h3>Policy architecture</h3>'
    + '<div class="section-subtitle" style="margin-bottom:12px;">Choose how Tier 2 policies are organized for the rest of the program.</div>'
    + '<label style="display:block;margin-bottom:8px;cursor:pointer;"><input type="radio" name="policyStructure" value="function" '
    + (ps === 'function' ? 'checked' : '') + ' onchange="setPolicyStructure(\'function\')" style="margin-right:8px;">'
    + '<strong>One policy per function</strong> — up to 6 policies (GV, ID, PR, DE, RS, RC)</label>'
    + '<label style="display:block;cursor:pointer;"><input type="radio" name="policyStructure" value="category" '
    + (ps === 'category' ? 'checked' : '') + ' onchange="setPolicyStructure(\'category\')" style="margin-right:8px;">'
    + '<strong>One policy per category</strong> — up to 22 policies (e.g. GV.OC, PR.AA)</label></div>';
}

var _origRenderCISOStep3 = typeof renderCISOStep3 === 'function' ? renderCISOStep3 : null;

function draftUnmappedGvRequirements(rerender) {
  var isp = state.infoSecPolicy;
  if (!isp || !isp.requirements) return 0;
  ensureGvSubcategoriesSeeded();
  var allActive = Object.keys(state.gvSubcategories).filter(function(id) { return state.gvSubcategories[id]; });
  var mapped = isp.requirements.flatMap(function(r) { return r.controls || r.subcategories || []; });
  var unmapped = allActive.filter(function(id) { return mapped.indexOf(id) < 0; });
  if (!unmapped.length) return 0;
  unmapped.forEach(function(subId) {
    var n = isp.requirements.length + 1;
    var text = (CSF_SUBCATEGORY_TEXT && CSF_SUBCATEGORY_TEXT[subId]) || subId;
    isp.requirements.push({ id: 'GV-REQ-' + n, text: text, subcategories: [subId], controls: [subId] });
  });
  if (typeof renumberReqs === 'function') renumberReqs();
  markDirty();
  if (rerender !== false && typeof renderCISOStep3 === 'function') renderCISOStep3();
  return unmapped.length;
}

function buildDefaultISPRoles(ownerTitle) {
  return [
    { name: 'Executive Leadership', responsibilities: ['Approve cybersecurity governance policy', 'Allocate resources for the cybersecurity program', 'Accept enterprise-level cyber risk within delegated authority'] },
    { name: ownerTitle, responsibilities: ['Establish and maintain Tier 1 governance policy aligned to CSF Govern outcomes', 'Lead cybersecurity risk management strategy and oversight', 'Report program effectiveness to executive leadership'] },
    { name: 'Policy Owners', responsibilities: ['Develop and maintain Tier 2 function or category policies', 'Assign subcategory implementation owners', 'Submit policies for review and approval'] },
    { name: 'All Personnel', responsibilities: ['Comply with cybersecurity policies applicable to their role', 'Complete security awareness training', 'Report suspected incidents and policy violations'] }
  ];
}

function togglePrivacy() {}
function selectBaseline() {}
function toggleProgramFismaMode() {}
function resetPrivacyPMDefaults() {}
function getPrivacyPMDefaults() { return []; }

function selectAllPM(val) {
  ensureGvSubcategoriesSeeded();
  SUBCATEGORIES.filter(function(s) { return s.fn === 'GV'; }).forEach(function(s) {
    state.gvSubcategories[s.id] = !!val;
  });
  renderCISOStep4Govern();
}

// Patch cisoNext step 2 validation
(function patchCisoNext() {
  var orig = cisoNext;
  cisoNext = function(fromStep) {
    if (fromStep === 2) {
      ensureSelectedCategoriesSeeded();
      if (!getActiveCategories().length) {
        showToast('Select at least one CSF category before continuing.', true);
        return;
      }
    }
    if (fromStep === 4) {
      ensureGvSubcategoriesSeeded();
      var gvSel = Object.keys(state.gvSubcategories).filter(function(k) { return state.gvSubcategories[k]; }).length;
      if (!gvSel) {
        showToast('Select at least one Govern (GV) subcategory before continuing.', true);
        return;
      }
    }
    return orig(fromStep);
  };
})();

// Wrap renderCISOStep3 to inject policy architecture card
(function patchRenderCISOStep3() {
  if (!_origRenderCISOStep3) return;
  renderCISOStep3 = function() {
    _origRenderCISOStep3();
    var body = document.getElementById('ciso-step-5-body');
    if (!body) return;
    var card = document.getElementById('csf-policy-architecture-card');
    if (!card) {
      var wrap = document.createElement('div');
      wrap.id = 'csf-policy-architecture-card';
      wrap.innerHTML = renderPolicyArchitectureCard();
      var first = body.querySelector('.section-title');
      if (first && first.parentNode) first.parentNode.insertBefore(wrap, first.nextSibling);
      else body.insertAdjacentHTML('afterbegin', renderPolicyArchitectureCard());
    } else {
      card.innerHTML = renderPolicyArchitectureCard();
    }
  };
})();

function renderCISOStep3Integrations() {
  var body = document.getElementById('ciso-step-3-body');
  if (!body) return;
  body.innerHTML = cisoStepProgressHtml(3, 'Reg mapping')
    + '<div class="section-title">Regulatory &amp; framework mapping</div>'
    + '<div class="section-subtitle">NIST CSF 2.0 is your anchor. Choose voluntary standards and applicable laws — suggestions follow your organization profile from Step 1.</div>'
    + (typeof renderFrameworkSetupSectionHtml === 'function' ? renderFrameworkSetupSectionHtml() : '')
    + (typeof renderComplianceLawSetupSectionHtml === 'function' ? renderComplianceLawSetupSectionHtml() : '')
    + (typeof renderCustomRegAddFormHtml === 'function' ? renderCustomRegAddFormHtml() : '');
}
