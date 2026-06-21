// js/frameworks.js — NIST crosswalk to voluntary standards (ISO, SOC 2, CIS) and compliance laws

var FRAMEWORK_META = {
  iso27001: { id: 'iso27001', label: 'ISO 27001', subtitle: 'Annex A (2022)', color: '#5856D6', bg: '#f5f3ff' },
  soc2:     { id: 'soc2',     label: 'SOC 2',     subtitle: 'Trust Services Criteria', color: '#FF9500', bg: '#fff7ed' },
  cis:      { id: 'cis',      label: 'CIS Controls', subtitle: 'IG1 (v8)', color: '#007AFF', bg: '#eff6ff' }
};

var COMPLIANCE_LAW_META = {
  hipaa:         { id: 'hipaa',         label: 'HIPAA',              subtitle: 'Security & Privacy Rule', color: '#34C759', bg: '#f0fdf4' },
  glba:          { id: 'glba',          label: 'GLBA',               subtitle: 'Safeguards Rule', color: '#0d9488', bg: '#f0fdfa' },
  ferpa:         { id: 'ferpa',         label: 'FERPA',              subtitle: 'Student records', color: '#6366f1', bg: '#eef2ff' },
  sox:           { id: 'sox',           label: 'SOX',                subtitle: 'IT general controls', color: '#b45309', bg: '#fffbeb' },
  fisma:         { id: 'fisma',         label: 'FISMA',              subtitle: 'Federal systems', color: '#7c3aed', bg: '#f5f3ff' },
  state_privacy: { id: 'state_privacy', label: 'State privacy laws', subtitle: 'CCPA / CPRA / similar', color: '#64748b', bg: '#f8fafc' }
};

var ORG_SECTOR_OPTIONS = [
  { id: '', label: 'Select sector…' },
  { id: 'commercial', label: 'Commercial / private sector' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'financial', label: 'Financial services' },
  { id: 'education', label: 'Education' },
  { id: 'federal', label: 'Federal government' },
  { id: 'state_local', label: 'State & local government' },
  { id: 'critical_infra', label: 'Critical infrastructure' }
];

var SECTOR_REG_SUGGESTIONS = {
  commercial:    { frameworks: ['iso27001', 'soc2', 'cis'], laws: ['state_privacy'] },
  healthcare:    { frameworks: ['iso27001', 'soc2', 'cis'], laws: ['hipaa'] },
  financial:     { frameworks: ['iso27001', 'soc2', 'cis'], laws: ['glba', 'sox'] },
  education:     { frameworks: ['iso27001', 'soc2', 'cis'], laws: ['ferpa'] },
  federal:       { frameworks: ['iso27001', 'cis'], laws: ['fisma'] },
  state_local:   { frameworks: ['iso27001', 'soc2', 'cis'], laws: ['fisma'] },
  critical_infra:{ frameworks: ['iso27001', 'soc2', 'cis'], laws: [] }
};

var CIS_BY_FAMILY = {
  AC: ['5.1','6.1','6.2','6.3','6.8'], AT: ['14.1','14.2'], AU: ['8.1','8.2','8.3'],
  CA: ['1.1','7.1'], CM: ['2.1','4.1','4.2'], CP: ['11.1','11.2'], IA: ['5.1','6.3'],
  IR: ['17.1','17.2'], MA: ['1.1','7.1'], MP: ['3.1','3.3'], PE: ['4.1','4.2'],
  PL: ['5.1','14.1'], PM: ['5.1','14.1'], PS: ['14.1','14.2'], PT: ['1.1','3.1'],
  RA: ['7.1','7.2'], SA: ['15.1','15.2'], SC: ['4.1','12.1','13.1'], SI: ['7.1','7.4'], SR: ['15.1','15.3']
};

var GENERIC_LAW_REF = {
  glba: 'Safeguards Rule §314.4',
  ferpa: 'FERPA §99.31',
  sox: 'SOX ITGC',
  fisma: 'FISMA / NIST RMF',
  state_privacy: 'State privacy statute'
};

var FAMILY_LAW_REFS = {};
var CONTROL_LAW_OVERRIDES = {};

// Family-level crosswalk defaults — applied to every control in the family unless overridden.
var FAMILY_FRAMEWORK_REFS = {
  AC: { iso27001: ['A.5.15','A.5.16','A.5.17','A.5.18','A.8.2','A.8.3','A.8.5'], soc2: ['CC6.1','CC6.2','CC6.3','CC6.6'], hipaa: ['§164.308(a)(3)','§164.308(a)(4)','§164.312(a)(1)'] },
  AT: { iso27001: ['A.6.3','A.6.4'], soc2: ['CC1.4','CC2.2'], hipaa: ['§164.308(a)(5)'] },
  AU: { iso27001: ['A.8.15','A.8.16'], soc2: ['CC7.2','CC7.3'], hipaa: ['§164.312(b)'] },
  CA: { iso27001: ['A.8.8','A.8.9'], soc2: ['CC8.1'], hipaa: ['§164.308(a)(8)'] },
  CM: { iso27001: ['A.8.9','A.8.19','A.8.32'], soc2: ['CC8.1'], hipaa: ['§164.310(d)(1)'] },
  CP: { iso27001: ['A.5.29','A.5.30','A.8.13','A.8.14'], soc2: ['A1.2','A1.3'], hipaa: ['§164.308(a)(7)'] },
  IA: { iso27001: ['A.5.16','A.5.17','A.8.5'], soc2: ['CC6.1','CC6.6'], hipaa: ['§164.312(d)'] },
  IR: { iso27001: ['A.5.24','A.5.25','A.5.26','A.5.27'], soc2: ['CC7.4','CC7.5'], hipaa: ['§164.308(a)(6)'] },
  MA: { iso27001: ['A.7.13','A.8.1'], soc2: ['CC8.1'], hipaa: ['§164.310(a)(2)'] },
  MP: { iso27001: ['A.5.10','A.5.11','A.5.12','A.7.10'], soc2: ['CC6.7'], hipaa: ['§164.310(c)'] },
  PE: { iso27001: ['A.7.1','A.7.2','A.7.3','A.7.4'], soc2: ['CC6.4'], hipaa: ['§164.310(a)(1)','§164.310(b)'] },
  PL: { iso27001: ['A.5.1','A.5.2','A.5.4'], soc2: ['CC1.1','CC2.1'], hipaa: ['§164.308(a)(1)'] },
  PM: { iso27001: ['A.5.1','A.5.2','A.5.4','A.5.35'], soc2: ['CC1.1','CC1.2'], hipaa: ['§164.308(a)(1)','§164.316'] },
  PS: { iso27001: ['A.6.1','A.6.2','A.6.4'], soc2: ['CC1.4'], hipaa: ['§164.308(a)(3)(ii)(A)'] },
  PT: { iso27001: ['A.5.33','A.5.34','A.8.10','A.8.11'], soc2: ['P1.1','P2.1'], hipaa: ['§164.308(a)(1)','§164.502'] },
  RA: { iso27001: ['A.5.7','A.5.8','A.8.8'], soc2: ['CC3.1','CC3.2'], hipaa: ['§164.308(a)(1)(ii)(A)'] },
  SA: { iso27001: ['A.5.19','A.5.20','A.5.21','A.5.23'], soc2: ['CC9.2'], hipaa: ['§164.308(b)'] },
  SC: { iso27001: ['A.5.14','A.8.20','A.8.21','A.8.22'], soc2: ['CC6.6','CC6.7'], hipaa: ['§164.312(e)(1)'] },
  SI: { iso27001: ['A.8.7','A.8.8'], soc2: ['CC7.1'], hipaa: ['§164.308(a)(5)(ii)(B)'] },
  SR: { iso27001: ['A.5.19','A.5.20','A.5.21','A.5.22'], soc2: ['CC9.2'], hipaa: ['§164.308(b)(1)'] }
};

// Control-specific refinements for high-traffic controls.
var CONTROL_FRAMEWORK_OVERRIDES = {
  'AC-1':  { iso27001: ['A.5.1','A.5.37'], soc2: ['CC1.1','CC2.2'], hipaa: ['§164.308(a)(1)'] },
  'AC-2':  { iso27001: ['A.5.16','A.5.18','A.8.2'], soc2: ['CC6.1','CC6.2'], hipaa: ['§164.312(a)(1)','§164.312(a)(2)(i)'] },
  'AC-3':  { iso27001: ['A.8.3'], soc2: ['CC6.1'], hipaa: ['§164.312(a)(1)'] },
  'AU-2':  { iso27001: ['A.8.15'], soc2: ['CC7.2'], hipaa: ['§164.312(b)'] },
  'CM-2':  { iso27001: ['A.8.9'], soc2: ['CC8.1'], hipaa: ['§164.310(d)(1)'] },
  'CP-1':  { iso27001: ['A.5.29'], soc2: ['A1.2'], hipaa: ['§164.308(a)(7)'] },
  'IA-2':  { iso27001: ['A.8.5'], soc2: ['CC6.1'], hipaa: ['§164.312(d)'] },
  'IR-1':  { iso27001: ['A.5.24'], soc2: ['CC7.4'], hipaa: ['§164.308(a)(6)'] },
  'PL-1':  { iso27001: ['A.5.1'], soc2: ['CC1.1'], hipaa: ['§164.308(a)(1)'] },
  'PM-1':  { iso27001: ['A.5.1'], soc2: ['CC1.1'], hipaa: ['§164.308(a)(1)'] },
  'RA-1':  { iso27001: ['A.5.7'], soc2: ['CC3.1'], hipaa: ['§164.308(a)(1)(ii)(A)'] },
  'SC-7':  { iso27001: ['A.8.20'], soc2: ['CC6.6'], hipaa: ['§164.312(e)(1)'] },
  'SI-2':  { iso27001: ['A.8.8'], soc2: ['CC7.1'], hipaa: ['§164.308(a)(5)(ii)(B)'] }
};

(function initFrameworkLawCrosswalks() {
  Object.keys(FAMILY_FRAMEWORK_REFS).forEach(function(fam) {
    var row = FAMILY_FRAMEWORK_REFS[fam] || {};
    FAMILY_LAW_REFS[fam] = { hipaa: (row.hipaa || []).slice() };
    Object.keys(COMPLIANCE_LAW_META).forEach(function(lawId) {
      if (lawId === 'hipaa') return;
      if (GENERIC_LAW_REF[lawId]) FAMILY_LAW_REFS[fam][lawId] = [GENERIC_LAW_REF[lawId]];
    });
    row.cis = (CIS_BY_FAMILY[fam] || ['1.1']).slice();
    delete row.hipaa;
  });
  Object.keys(CONTROL_FRAMEWORK_OVERRIDES).forEach(function(ctrlId) {
    var row = CONTROL_FRAMEWORK_OVERRIDES[ctrlId] || {};
    CONTROL_LAW_OVERRIDES[ctrlId] = { hipaa: (row.hipaa || []).slice() };
    Object.keys(COMPLIANCE_LAW_META).forEach(function(lawId) {
      if (lawId === 'hipaa') return;
      if (GENERIC_LAW_REF[lawId]) CONTROL_LAW_OVERRIDES[ctrlId][lawId] = [GENERIC_LAW_REF[lawId]];
    });
    row.cis = (CIS_BY_FAMILY[(ctrlId || '').split('-')[0]] || ['1.1']).slice(0, 2);
    delete row.hipaa;
  });
})();

function getOrgSectorLabel(sectorId) {
  var match = ORG_SECTOR_OPTIONS.find(function(o) { return o.id === sectorId; });
  return match ? match.label : '';
}

function getSectorRegSuggestions(sectorId) {
  return SECTOR_REG_SUGGESTIONS[sectorId] || { frameworks: ['iso27001', 'soc2', 'cis'], laws: [] };
}

function applySectorRegMappingSuggestions(force) {
  if (!state.orgSector) return false;
  if (state._regMappingInitialized && !force) return false;
  var sug = getSectorRegSuggestions(state.orgSector);
  if (!state.activeFrameworks) state.activeFrameworks = {};
  if (!state.activeComplianceLaws) state.activeComplianceLaws = {};
  Object.keys(FRAMEWORK_META).forEach(function(id) {
    state.activeFrameworks[id] = sug.frameworks.indexOf(id) >= 0;
  });
  Object.keys(COMPLIANCE_LAW_META).forEach(function(id) {
    state.activeComplianceLaws[id] = sug.laws.indexOf(id) >= 0;
  });
  state._regMappingInitialized = true;
  markDirty();
  return true;
}

function setOrgSector(sectorId) {
  var prev = state.orgSector || '';
  state.orgSector = sectorId;
  if (prev !== sectorId) state._regMappingInitialized = false;
  logFieldChange('orgSector', prev, sectorId);
  markDirty();
  if (typeof renderCISOStep1 === 'function') renderCISOStep1();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
}

function getActiveFrameworkIds() {
  var af = state && state.activeFrameworks;
  if (!af || typeof af !== 'object') return ['iso27001', 'soc2', 'cis'];
  return Object.keys(FRAMEWORK_META).filter(function(k) { return !!af[k]; });
}

function getActiveComplianceLawIds() {
  var laws = state && state.activeComplianceLaws;
  if (!laws || typeof laws !== 'object') return [];
  return Object.keys(COMPLIANCE_LAW_META).filter(function(k) { return !!laws[k]; });
}

function getFrameworkRefsForControl(ctrlId) {
  var fam = (ctrlId || '').split('-')[0];
  var base = FAMILY_FRAMEWORK_REFS[fam] || {};
  var over = CONTROL_FRAMEWORK_OVERRIDES[ctrlId] || {};
  var out = {};
  Object.keys(FRAMEWORK_META).forEach(function(fw) {
    var refs = over[fw] || base[fw] || [];
    if (refs.length) out[fw] = refs.slice();
  });
  return out;
}

function getLawRefsForControl(ctrlId) {
  var fam = (ctrlId || '').split('-')[0];
  var base = FAMILY_LAW_REFS[fam] || {};
  var over = CONTROL_LAW_OVERRIDES[ctrlId] || {};
  var out = {};
  Object.keys(COMPLIANCE_LAW_META).forEach(function(lawId) {
    var refs = over[lawId] || base[lawId] || [];
    if (refs.length) out[lawId] = refs.slice();
  });
  return out;
}

function renderFrameworkBadgesHtml(ctrlId, compact) {
  var active = getActiveFrameworkIds();
  var refs = getFrameworkRefsForControl(ctrlId);
  var parts = [];
  active.forEach(function(fw) {
    var list = refs[fw];
    if (!list || !list.length) return;
    var meta = FRAMEWORK_META[fw];
    var label = compact ? meta.label.split(' ')[0] : (list[0] + (list.length > 1 ? ' +' + (list.length - 1) : ''));
    parts.push('<span class="fw-badge" style="background:' + meta.bg + ';color:' + meta.color + ';border:1px solid ' + meta.color + '33;" title="' + escapeHTML(meta.label + ': ' + list.join(', ')) + '">' + escapeHTML(label) + '</span>');
  });
  return parts.join('');
}

function toggleActiveFramework(fwId) {
  if (!state.activeFrameworks) state.activeFrameworks = { iso27001: true, soc2: true, cis: true };
  var current = state.activeFrameworks[fwId] !== false;
  state.activeFrameworks[fwId] = !current;
  state._regMappingInitialized = true;
  markDirty();
  renderFrameworksTab();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
  else if (typeof renderCISOStep3Integrations === 'function' && document.getElementById('ciso-step-3-body')) renderCISOStep3Integrations();
}

function toggleActiveComplianceLaw(lawId) {
  if (!state.activeComplianceLaws) state.activeComplianceLaws = {};
  var current = !!state.activeComplianceLaws[lawId];
  state.activeComplianceLaws[lawId] = !current;
  state._regMappingInitialized = true;
  markDirty();
  renderFrameworksTab();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
  else if (typeof renderCISOStep3Integrations === 'function' && document.getElementById('ciso-step-3-body')) renderCISOStep3Integrations();
}

function computeFrameworkCoverage(fwId) {
  if (!state.baseline || typeof getActiveControls !== 'function') return { total: 0, mapped: 0, implemented: 0, pct: 0 };
  var controls = getActiveControls();
  var mapped = 0;
  var implemented = 0;
  controls.forEach(function(c) {
    var refs = getFrameworkRefsForControl(c.id);
    if (!refs[fwId] || !refs[fwId].length) return;
    mapped++;
    var st = (state.controlStatus || {})[c.id];
    if (st && (st.status === 'Implemented' || st.status === 'Inherited')) implemented++;
  });
  return {
    total: controls.length,
    mapped: mapped,
    implemented: implemented,
    pct: mapped ? Math.round((implemented / mapped) * 100) : 0
  };
}

function renderFrameworksTab() {
  var body = document.getElementById('frameworks-body');
  if (!body) return;
  var active = getActiveFrameworkIds();
  var activeLaws = getActiveComplianceLawIds();
  var filterFw = state._frameworkFilter || '';
  var search = (state._frameworkSearch || '').toLowerCase();

  var cards = Object.keys(FRAMEWORK_META).map(function(fwId) {
    var meta = FRAMEWORK_META[fwId];
    var on = !!(state.activeFrameworks || {})[fwId];
    var cov = computeFrameworkCoverage(fwId);
    return '<div class="fw-coverage-card' + (on ? '' : ' fw-coverage-card-off') + '" style="--fw-color:' + meta.color + ';">'
      + '<div class="fw-coverage-head">'
      + '<div><div class="fw-coverage-title">' + escapeHTML(meta.label) + '</div>'
      + '<div class="fw-coverage-sub">' + escapeHTML(meta.subtitle) + '</div></div>'
      + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="toggleActiveFramework(\'' + fwId + '\')"><span class="fw-toggle-track"></span></label>'
      + '</div>'
      + (on
        ? '<div class="fw-coverage-bar-wrap"><div class="fw-coverage-bar" style="width:' + cov.pct + '%;"></div></div>'
          + '<div class="fw-coverage-stats">'
          + '<span><strong>' + cov.pct + '%</strong> implemented</span>'
          + '<span>' + cov.implemented + ' / ' + cov.mapped + ' mapped controls</span>'
          + '</div>'
          + '<button type="button" class="btn btn-secondary btn-sm" onclick="state._frameworkFilter=\'' + fwId + '\';renderFrameworksTab();">View mapping →</button>'
        : '<div class="fw-coverage-stats" style="opacity:0.6;">Tracking off — enable to see crosswalk</div>')
      + '</div>';
  }).join('');

  var controls = (typeof getActiveControls === 'function' ? getActiveControls() : (typeof CONTROLS !== 'undefined' ? CONTROLS : []))
    .filter(function(c) {
      if (!filterFw) return true;
      var refs = getFrameworkRefsForControl(c.id);
      return refs[filterFw] && refs[filterFw].length;
    })
    .filter(function(c) {
      if (!search) return true;
      return c.id.toLowerCase().indexOf(search) !== -1 || (c.n || '').toLowerCase().indexOf(search) !== -1;
    });

  var rows = controls.slice(0, 200).map(function(c) {
    var refs = getFrameworkRefsForControl(c.id);
    var lawRefs = getLawRefsForControl(c.id);
    var st = (state.controlStatus || {})[c.id] || {};
    var status = st.status || 'Not Started';
    var refCells = active.map(function(fw) {
      var list = refs[fw] || [];
      var meta = FRAMEWORK_META[fw];
      return '<td style="font-size:11px;color:' + meta.color + ';font-weight:600;">' + (list.length ? escapeHTML(list.join(', ')) : '<span style="color:var(--text-muted);font-weight:400;">—</span>') + '</td>';
    }).join('');
    var lawCells = activeLaws.map(function(lawId) {
      var list = lawRefs[lawId] || [];
      var meta = COMPLIANCE_LAW_META[lawId];
      return '<td style="font-size:11px;color:' + meta.color + ';font-weight:600;">' + (list.length ? escapeHTML(list.join(', ')) : '<span style="color:var(--text-muted);font-weight:400;">—</span>') + '</td>';
    }).join('');
    return '<tr class="fw-map-row" onclick="goToControlFromFramework(\'' + c.id.replace(/'/g, "\\'") + '\')" style="cursor:pointer;">'
      + '<td style="font-weight:700;color:var(--accent);">' + escapeHTML(c.id) + '</td>'
      + '<td style="font-size:12px;">' + escapeHTML(c.n || '') + '</td>'
      + '<td><span class="status-pill status-' + status.replace(/\s+/g, '-').toLowerCase() + '">' + escapeHTML(status) + '</span></td>'
      + refCells + lawCells
      + '</tr>';
  }).join('');

  var headCols = active.map(function(fw) {
    return '<th style="font-size:11px;color:' + FRAMEWORK_META[fw].color + ';">' + escapeHTML(FRAMEWORK_META[fw].label) + '</th>';
  }).join('') + activeLaws.map(function(lawId) {
    return '<th style="font-size:11px;color:' + COMPLIANCE_LAW_META[lawId].color + ';">' + escapeHTML(COMPLIANCE_LAW_META[lawId].label) + '</th>';
  }).join('');

  body.innerHTML = ''
    + '<div class="fw-intro">'
    + '<p>EightFiftyThree maps your NIST 800-53 program to voluntary standards (<strong>ISO 27001</strong>, <strong>SOC 2</strong>, <strong>CIS Controls</strong>) and, separately, to <strong>laws &amp; regulations</strong> you enable. Coverage updates as control owners mark implementation.</p>'
    + '</div>'
    + '<div class="fw-coverage-grid">' + cards + '</div>'
    + (typeof renderComplianceLawCoverageCardsHtml === 'function' ? renderComplianceLawCoverageCardsHtml() : '')
    + '<div class="fw-map-panel">'
    + '<div class="fw-map-toolbar">'
    + '<input class="form-input" placeholder="Search controls…" value="' + escapeHTML(state._frameworkSearch || '') + '" oninput="state._frameworkSearch=this.value;renderFrameworksTab();" style="max-width:280px;">'
    + '<select class="form-select" style="max-width:200px;" onchange="state._frameworkFilter=this.value;renderFrameworksTab();">'
    + '<option value="">All active frameworks</option>'
    + Object.keys(FRAMEWORK_META).map(function(fw) {
      return '<option value="' + fw + '"' + (filterFw === fw ? ' selected' : '') + '>' + escapeHTML(FRAMEWORK_META[fw].label) + ' only</option>';
    }).join('')
    + '</select>'
    + (filterFw ? '<button type="button" class="btn btn-secondary btn-sm" onclick="state._frameworkFilter=\'\';renderFrameworksTab();">Clear filter</button>' : '')
    + '<span style="font-size:12px;color:var(--text-muted);margin-left:auto;">' + controls.length + ' control' + (controls.length === 1 ? '' : 's') + '</span>'
    + '</div>'
    + '<div style="overflow-x:auto;">'
    + '<table class="control-table fw-map-table"><thead><tr>'
    + '<th>Control</th><th>Name</th><th>Status</th>' + headCols
    + '</tr></thead><tbody>'
    + (rows || '<tr><td colspan="' + (3 + active.length + activeLaws.length) + '" style="padding:24px;text-align:center;color:var(--text-muted);">No controls match — set a baseline in Program setup first.</td></tr>')
    + '</tbody></table>'
    + (controls.length > 200 ? '<div style="font-size:12px;color:var(--text-muted);padding:12px;">Showing first 200 of ' + controls.length + ' controls. Refine search to narrow.</div>' : '')
    + '</div></div>';
}

function goToControlFromFramework(ctrlId) {
  state._selectedCtrl = ctrlId;
  state._controlLibraryMode = false;
  showTab('control');
  if (typeof goToStep === 'function') goToStep('control', 2);
}

function renderFrameworkDashboardStripHtml() {
  if (!state.baseline || typeof getActiveFrameworkIds !== 'function') return '';
  var active = getActiveFrameworkIds();
  if (!active.length) return '';
  var cards = active.map(function(fw) {
    var meta = FRAMEWORK_META[fw];
    var cov = computeFrameworkCoverage(fw);
    return '<button type="button" class="fw-dash-chip" style="--fw-color:' + meta.color + ';" onclick="showTab(\'frameworks\')">'
      + '<span class="fw-dash-chip-label">' + escapeHTML(meta.label) + '</span>'
      + '<span class="fw-dash-chip-pct">' + cov.pct + '%</span>'
      + '<span class="fw-dash-chip-sub">implemented</span>'
      + '</button>';
  }).join('');
  return '<div class="fw-dash-strip">'
    + '<div class="fw-dash-strip-head"><span>Multi-framework posture</span>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="showTab(\'frameworks\')">View alignment →</button></div>'
    + '<div class="fw-dash-chips">' + cards + '</div></div>';
}

function renderFrameworkSetupSectionHtml() {
  var af = state.activeFrameworks || {};
  var sug = state.orgSector ? getSectorRegSuggestions(state.orgSector) : null;
  var chips = Object.keys(FRAMEWORK_META).map(function(fwId) {
    var meta = FRAMEWORK_META[fwId];
    var on = af[fwId] !== false;
    var suggested = sug && sug.frameworks.indexOf(fwId) >= 0;
    return '<button type="button" class="fw-setup-chip' + (on ? ' fw-setup-chip-on' : '') + (suggested ? ' fw-setup-chip-suggested' : '') + '" style="--fw-color:' + meta.color + ';" onclick="toggleActiveFramework(\'' + fwId + '\')">'
      + '<span class="fw-setup-chip-dot"></span>'
      + escapeHTML(meta.label)
      + '</button>';
  }).join('');
  var sectorHint = state.orgSector
    ? '<div class="form-hint" style="margin-bottom:12px;">Sector: <strong>' + escapeHTML(getOrgSectorLabel(state.orgSector)) + '</strong> — highlighted chips are typical for your sector.</div>'
    : '<div class="form-hint" style="margin-bottom:12px;">Pick a sector in Step 1 to see tailored suggestions.</div>';
  return '<div class="fw-setup-section">'
    + '<div class="section-title" style="margin-bottom:4px;">Voluntary standards &amp; frameworks</div>'
    + '<div class="section-subtitle" style="margin-bottom:8px;">NIST 800-53 is your anchor — enable other lenses to see crosswalks on every control.</div>'
    + sectorHint
    + '<div class="fw-setup-chips">' + chips + '</div>'
    + '</div>';
}

function renderComplianceLawSetupSectionHtml() {
  var laws = state.activeComplianceLaws || {};
  var sug = state.orgSector ? getSectorRegSuggestions(state.orgSector) : null;
  var chips = Object.keys(COMPLIANCE_LAW_META).map(function(lawId) {
    var meta = COMPLIANCE_LAW_META[lawId];
    var on = !!laws[lawId];
    var suggested = sug && sug.laws.indexOf(lawId) >= 0;
    return '<button type="button" class="fw-setup-chip' + (on ? ' fw-setup-chip-on' : '') + (suggested ? ' fw-setup-chip-suggested' : '') + '" style="--fw-color:' + meta.color + ';" onclick="toggleActiveComplianceLaw(\'' + lawId + '\')">'
      + '<span class="fw-setup-chip-dot"></span>'
      + escapeHTML(meta.label)
      + '</button>';
  }).join('');
  var applyBtn = state.orgSector
    ? '<button type="button" class="btn btn-secondary btn-sm" style="margin-top:10px;" onclick="applySectorRegMappingSuggestions(true);if(typeof refreshCurrentCisoStep===\'function\')refreshCurrentCisoStep();">Apply suggestions for ' + escapeHTML(getOrgSectorLabel(state.orgSector)) + '</button>'
    : '';
  return '<div class="fw-setup-section" style="margin-top:24px;">'
    + '<div class="section-title" style="margin-bottom:4px;">Compliance frameworks (laws &amp; regulations)</div>'
    + '<div class="section-subtitle" style="margin-bottom:12px;">Separate from voluntary standards — track statutory and regulatory obligations that apply to your sector.</div>'
    + '<div class="fw-setup-chips">' + chips + '</div>'
    + applyBtn
    + '</div>';
}

function renderComplianceLawCoverageCardsHtml() {
  var cards = Object.keys(COMPLIANCE_LAW_META).map(function(lawId) {
    var meta = COMPLIANCE_LAW_META[lawId];
    var on = !!(state.activeComplianceLaws || {})[lawId];
    return '<div class="fw-coverage-card' + (on ? '' : ' fw-coverage-card-off') + '" style="--fw-color:' + meta.color + ';">'
      + '<div class="fw-coverage-head">'
      + '<div><div class="fw-coverage-title">' + escapeHTML(meta.label) + '</div>'
      + '<div class="fw-coverage-sub">' + escapeHTML(meta.subtitle) + '</div></div>'
      + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="toggleActiveComplianceLaw(\'' + lawId + '\')"><span class="fw-toggle-track"></span></label>'
      + '</div>'
      + (on
        ? '<div class="fw-coverage-stats">Tracking on — citations appear in the Framework alignment mapping table when enabled.</div>'
        : '<div class="fw-coverage-stats" style="opacity:0.6;">Tracking off</div>')
      + '</div>';
  }).join('');
  return '<div class="fw-setup-section" style="margin-top:8px;"><div class="section-title" style="margin-bottom:10px;">Laws &amp; regulations</div><div class="fw-coverage-grid">' + cards + '</div></div>';
}

// ─── SharePoint evidence helpers ───────────────────────────────────────────

function getSharePointConfig() {
  var cfg = state.sharePointConfig || {};
  return {
    enabled: !!cfg.enabled,
    siteUrl: String(cfg.siteUrl || '').replace(/\/+$/, ''),
    libraryName: String(cfg.libraryName || 'Evidence').trim() || 'Evidence',
    defaultFolder: String(cfg.defaultFolder || 'GRC/Evidence').replace(/^\/+|\/+$/g, '')
  };
}

function isSharePointUrl(url) {
  return /sharepoint\.com/i.test(String(url || '')) || /sharepoint\.us/i.test(String(url || ''));
}

function buildSharePointEvidenceUrl(relativePath) {
  var cfg = getSharePointConfig();
  if (!cfg.siteUrl) return '';
  var path = String(relativePath || '').replace(/^\/+/, '');
  if (!path) return cfg.siteUrl;
  if (isSharePointUrl(path)) return path;
  var lib = encodeURIComponent(cfg.libraryName).replace(/%20/g, '%20');
  var folder = cfg.defaultFolder ? '/' + cfg.defaultFolder.split('/').map(encodeURIComponent).join('/') : '';
  return cfg.siteUrl + '/' + lib + '/Forms/AllItems.aspx?id=' + encodeURIComponent(cfg.siteUrl + '/' + cfg.libraryName + folder + '/' + path);
}

function openSharePointSite() {
  var cfg = getSharePointConfig();
  if (!cfg.siteUrl) {
    showToast('Set your SharePoint site URL in Program setup first.', true);
    return;
  }
  window.open(cfg.siteUrl, '_blank', 'noopener,noreferrer');
}

function openSharePointEvidenceFolder() {
  var cfg = getSharePointConfig();
  if (!cfg.siteUrl) {
    showToast('Set your SharePoint site URL in Program setup first.', true);
    return;
  }
  var url = cfg.siteUrl + '/' + encodeURIComponent(cfg.libraryName) + '/Forms/AllItems.aspx'
    + (cfg.defaultFolder ? '?id=' + encodeURIComponent(cfg.siteUrl + '/' + cfg.libraryName + '/' + cfg.defaultFolder) : '');
  window.open(url, '_blank', 'noopener,noreferrer');
}

function setSharePointConfigField(field, value) {
  if (!state.sharePointConfig) state.sharePointConfig = { enabled: false, siteUrl: '', libraryName: 'Evidence', defaultFolder: 'GRC/Evidence' };
  var prev = state.sharePointConfig[field];
  state.sharePointConfig[field] = value;
  if (field === 'enabled') state.sharePointConfig.enabled = !!value;
  logFieldChange('sharePointConfig.' + field, prev, value);
  markDirty();
}

function renderSharePointSetupCardHtml() {
  var cfg = getSharePointConfig();
  return '<div class="sp-setup-card">'
    + '<div class="sp-setup-head">'
    + '<div><div class="sp-setup-title">Evidence in SharePoint</div>'
    + '<div class="sp-setup-sub">Store artifacts in SharePoint — this tool keeps links and context, not file copies.</div></div>'
    + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (cfg.enabled ? ' checked' : '') + ' onchange="setSharePointConfigField(\'enabled\',this.checked);if(typeof refreshCurrentCisoStep===\'function\')refreshCurrentCisoStep();"><span class="fw-toggle-track"></span></label>'
    + '</div>'
    + (cfg.enabled
      ? '<div class="sp-setup-fields">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">SharePoint site URL</label>'
        + '<input class="form-input" placeholder="https://contoso.sharepoint.com/sites/compliance" value="' + escapeHTML(state.sharePointConfig.siteUrl || '') + '" oninput="setSharePointConfigField(\'siteUrl\',this.value);">'
        + '<div class="form-hint">Your organization\'s compliance or GRC site.</div></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Document library</label>'
        + '<input class="form-input" placeholder="Evidence" value="' + escapeHTML(state.sharePointConfig.libraryName || 'Evidence') + '" oninput="setSharePointConfigField(\'libraryName\',this.value);"></div>'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Default folder path</label>'
        + '<input class="form-input" placeholder="GRC/Evidence" value="' + escapeHTML(state.sharePointConfig.defaultFolder || '') + '" oninput="setSharePointConfigField(\'defaultFolder\',this.value);"></div>'
        + '</div>'
        + '<div class="sp-setup-actions">'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="openSharePointSite()">Open site</button>'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="openSharePointEvidenceFolder()">Open evidence folder</button>'
        + '</div></div>'
      : '<div class="sp-setup-off">Enable to link control evidence directly to SharePoint documents.</div>')
    + '</div>';
}

function addSharePointEvidence(ctrlId) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = { status: 'Not Started', evidence: [] };
  if (!state.controlStatus[ctrlId].evidence) state.controlStatus[ctrlId].evidence = [];
  state.controlStatus[ctrlId].evidence.push({
    kind: 'sharepoint',
    type: 'Document',
    title: '',
    description: '',
    url: '',
    spPath: ''
  });
  markDirty();
  renderControlStep2();
}

function applySharePointPathToEvidence(ctrlId, idx, path) {
  if (!state.controlStatus[ctrlId] || !state.controlStatus[ctrlId].evidence[idx]) return;
  var row = state.controlStatus[ctrlId].evidence[idx];
  row.spPath = path;
  if (!row.url || !isSharePointUrl(row.url)) {
    row.url = buildSharePointEvidenceUrl(path);
    row.ref = row.url;
  }
  markDirty();
  renderControlStep2();
}
