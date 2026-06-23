// js/frameworks.js — NIST crosswalk to voluntary standards (ISO, SOC 2) and compliance laws

var FRAMEWORK_META = {
  iso27001: { id: 'iso27001', label: 'ISO 27001', subtitle: 'Annex A (2022)', color: '#5856D6', bg: '#f5f3ff' },
  soc2:     { id: 'soc2',     label: 'SOC 2',     subtitle: 'Trust Services Criteria', color: '#FF9500', bg: '#fff7ed' }
};

var COMPLIANCE_LAW_META = {
  hipaa:         { id: 'hipaa',         label: 'HIPAA',              subtitle: 'Security & Privacy Rule', color: '#34C759', bg: '#f0fdf4' },
  glba:          { id: 'glba',          label: 'GLBA',               subtitle: 'Safeguards Rule', color: '#0d9488', bg: '#f0fdfa' },
  ferpa:         { id: 'ferpa',         label: 'FERPA',              subtitle: 'Student records', color: '#6366f1', bg: '#eef2ff' },
  sox:           { id: 'sox',           label: 'SOX',                subtitle: 'IT general controls', color: '#b45309', bg: '#fffbeb' },
  fisma:         { id: 'fisma',         label: 'FISMA',              subtitle: 'Federal systems', color: '#7c3aed', bg: '#f5f3ff' },
  state_privacy: { id: 'state_privacy', label: 'State privacy laws', subtitle: 'CCPA / CPRA / similar', color: '#64748b', bg: '#f8fafc' }
};

var ORG_OWNERSHIP_OPTIONS = [
  { id: '', label: 'Select organization type…' },
  { id: 'government', label: 'Government' },
  { id: 'private', label: 'Private sector' }
];

var ORG_GOV_LEVEL_OPTIONS = [
  { id: '', label: 'Select level…' },
  { id: 'federal', label: 'Federal' },
  { id: 'slg', label: 'State & local (SLG)' }
];

var PRIVATE_SECTOR_OPTIONS = [
  { id: '', label: 'Select sector…' },
  { id: 'commercial', label: 'Commercial / general business' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'financial', label: 'Financial services' },
  { id: 'education', label: 'Education' },
  { id: 'critical_infra', label: 'Critical infrastructure' }
];

var FEDERAL_SECTOR_OPTIONS = [
  { id: '', label: 'Select sector…' },
  { id: 'defense', label: 'Defense / national security' },
  { id: 'civilian', label: 'Civilian agency' },
  { id: 'intelligence', label: 'Intelligence community' },
  { id: 'law_enforcement', label: 'Law enforcement / justice' }
];

var SLG_SECTOR_OPTIONS = [
  { id: '', label: 'Select sector…' },
  { id: 'general', label: 'General / multi-purpose' },
  { id: 'healthcare', label: 'Healthcare (non-Medicare)' },
  { id: 'medicare_integrator', label: 'Medicare / CMS integrator' },
  { id: 'education', label: 'Education / K-12 / higher ed' },
  { id: 'justice_public_safety', label: 'Justice / public safety' }
];

// Keys: private:<sector> | government:<federal|slg>:<sector>
var REG_SUGGESTION_MAP = {
  'private:commercial':         { frameworks: ['iso27001', 'soc2'], laws: ['state_privacy'] },
  'private:healthcare':         { frameworks: ['iso27001', 'soc2'], laws: ['hipaa'] },
  'private:financial':          { frameworks: ['iso27001', 'soc2'], laws: ['glba', 'sox'] },
  'private:education':          { frameworks: ['iso27001', 'soc2'], laws: ['ferpa'] },
  'private:critical_infra':     { frameworks: ['iso27001', 'soc2'], laws: [] },
  'government:federal:defense':           { frameworks: ['iso27001'], laws: ['fisma'] },
  'government:federal:civilian':          { frameworks: ['iso27001'], laws: ['fisma'] },
  'government:federal:intelligence':      { frameworks: ['iso27001'], laws: ['fisma'] },
  'government:federal:law_enforcement':   { frameworks: ['iso27001'], laws: ['fisma'] },
  'government:slg:general':               { frameworks: ['iso27001', 'soc2'], laws: ['fisma', 'state_privacy'] },
  'government:slg:healthcare':            { frameworks: ['iso27001', 'soc2'], laws: ['hipaa', 'fisma'] },
  'government:slg:medicare_integrator':   { frameworks: ['iso27001', 'soc2'], laws: ['hipaa', 'fisma'] },
  'government:slg:education':             { frameworks: ['iso27001', 'soc2'], laws: ['ferpa', 'fisma'] },
  'government:slg:justice_public_safety': { frameworks: ['iso27001', 'soc2'], laws: ['fisma'] }
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
    delete row.hipaa;
  });
  Object.keys(CONTROL_FRAMEWORK_OVERRIDES).forEach(function(ctrlId) {
    var row = CONTROL_FRAMEWORK_OVERRIDES[ctrlId] || {};
    CONTROL_LAW_OVERRIDES[ctrlId] = { hipaa: (row.hipaa || []).slice() };
    Object.keys(COMPLIANCE_LAW_META).forEach(function(lawId) {
      if (lawId === 'hipaa') return;
      if (GENERIC_LAW_REF[lawId]) CONTROL_LAW_OVERRIDES[ctrlId][lawId] = [GENERIC_LAW_REF[lawId]];
    });
    delete row.hipaa;
  });
})();

function getOrgRegProfileKey() {
  if (!state.orgOwnership) return '';
  if (state.orgOwnership === 'private') {
    return state.orgSector ? ('private:' + state.orgSector) : '';
  }
  if (state.orgOwnership === 'government') {
    if (!state.orgGovLevel || !state.orgSector) return '';
    return 'government:' + state.orgGovLevel + ':' + state.orgSector;
  }
  return '';
}

function getOrgSectorOptionsForContext() {
  if (state.orgOwnership === 'private') return PRIVATE_SECTOR_OPTIONS;
  if (state.orgOwnership === 'government') {
    if (state.orgGovLevel === 'federal') return FEDERAL_SECTOR_OPTIONS;
    if (state.orgGovLevel === 'slg') return SLG_SECTOR_OPTIONS;
    return [{ id: '', label: 'Select federal or SLG first…' }];
  }
  return [{ id: '', label: 'Select organization type first…' }];
}

function labelFromOptions(options, id) {
  var match = (options || []).find(function(o) { return o.id === id; });
  return match ? match.label : id || '';
}

function getOrgClassificationSummary() {
  if (!state.orgOwnership) return '';
  if (state.orgOwnership === 'private') {
    if (!state.orgSector) return 'Private sector';
    return 'Private · ' + labelFromOptions(PRIVATE_SECTOR_OPTIONS, state.orgSector);
  }
  var level = labelFromOptions(ORG_GOV_LEVEL_OPTIONS, state.orgGovLevel);
  var sector = labelFromOptions(getOrgSectorOptionsForContext(), state.orgSector);
  if (!state.orgGovLevel) return 'Government';
  if (!state.orgSector) return 'Government · ' + level;
  return 'Government · ' + level + ' · ' + sector;
}

function getRegSuggestionsForProfile(key) {
  return REG_SUGGESTION_MAP[key] || { frameworks: ['iso27001', 'soc2'], laws: [] };
}

function isOrgClassificationComplete() {
  if (!state.orgOwnership) return false;
  if (state.orgOwnership === 'private') return !!state.orgSector;
  return !!(state.orgGovLevel && state.orgSector);
}

function setOrgClassification(field, value) {
  var prev = state[field] || '';
  state[field] = value;
  if (field === 'orgOwnership') {
    if (value !== 'government') state.orgGovLevel = '';
    if (!value) {
      state.orgGovLevel = '';
      state.orgSector = '';
    } else if (value === 'government') {
      var privateIds = PRIVATE_SECTOR_OPTIONS.map(function(o) { return o.id; });
      if (privateIds.indexOf(state.orgSector) >= 0) state.orgSector = '';
    } else if (value === 'private') {
      var govIds = FEDERAL_SECTOR_OPTIONS.concat(SLG_SECTOR_OPTIONS).map(function(o) { return o.id; });
      if (govIds.indexOf(state.orgSector) >= 0 || state.orgSector === 'federal' || state.orgSector === 'state_local') state.orgSector = '';
      state.orgGovLevel = '';
    }
  }
  if (field === 'orgGovLevel') {
    var valid = getOrgSectorOptionsForContext().map(function(o) { return o.id; });
    if (valid.indexOf(state.orgSector) < 0) state.orgSector = '';
  }
  if (prev !== value) state._regMappingInitialized = false;
  logFieldChange(field, prev, value);
  markDirty();
  if (typeof renderCISOStep1 === 'function') renderCISOStep1();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
}

function renderOrgClassificationFieldsHtml() {
  var showGov = state.orgOwnership === 'government';
  var showSector = state.orgOwnership === 'private' || (showGov && !!state.orgGovLevel);
  var sectorOptions = getOrgSectorOptionsForContext();
  return ''
    + '<div class="form-group" style="margin-bottom:0;">'
    + '<label class="form-label">Organization type <span class="required">*</span></label>'
    + '<select class="form-select" onchange="setOrgClassification(\'orgOwnership\', this.value)">'
    + ORG_OWNERSHIP_OPTIONS.map(function(opt) {
      return '<option value="' + escapeHTML(opt.id) + '"' + ((state.orgOwnership || '') === opt.id ? ' selected' : '') + '>' + escapeHTML(opt.label) + '</option>';
    }).join('')
    + '</select>'
    + '<div class="form-hint">Government programs use a different mapping path than private sector.</div>'
    + '</div>'
    + (showGov
      ? '<div class="form-group" style="margin-bottom:0;">'
        + '<label class="form-label">Government level <span class="required">*</span></label>'
        + '<select class="form-select" onchange="setOrgClassification(\'orgGovLevel\', this.value)">'
        + ORG_GOV_LEVEL_OPTIONS.map(function(opt) {
          return '<option value="' + escapeHTML(opt.id) + '"' + ((state.orgGovLevel || '') === opt.id ? ' selected' : '') + '>' + escapeHTML(opt.label) + '</option>';
        }).join('')
        + '</select>'
        + '<div class="form-hint">Federal vs state &amp; local (SLG).</div>'
        + '</div>'
      : '')
    + (showSector
      ? '<div class="form-group" style="margin-bottom:0;">'
        + '<label class="form-label">Sector <span class="required">*</span></label>'
        + '<select class="form-select" onchange="setOrgClassification(\'orgSector\', this.value)">'
        + sectorOptions.map(function(opt) {
          return '<option value="' + escapeHTML(opt.id) + '"' + ((state.orgSector || '') === opt.id ? ' selected' : '') + '>' + escapeHTML(opt.label) + '</option>';
        }).join('')
        + '</select>'
        + '<div class="form-hint">Drives tailored suggestions in Step 3.</div>'
        + '</div>'
      : '');
}

function buildDefaultISPComplianceNotes() {
  var orgName = ((state && state.orgName) || 'the organization').trim() || 'the organization';
  var lines = [
    'Legal, regulatory, and contractual compliance requirements applicable to this information security program include:',
    '',
    '• NIST SP 800-53 Rev. 5 — catalog of security and privacy controls selected for this program.',
    '• NIST SP 800-37 Rev. 2 (RMF) — risk management lifecycle for authorizing systems.'
  ];
  if (state && state.orgOwnership === 'government') {
    lines.push('• Federal Information Security Modernization Act (FISMA) — federal information security program requirements.');
    if (state.orgGovLevel === 'federal') {
      lines.push('• OMB Circular A-130 — management of federal information resources.');
    }
    if (state.orgGovLevel === 'slg') {
      lines.push('• State and local government security and privacy requirements applicable to the jurisdiction.');
    }
  } else if (state && state.orgOwnership === 'private') {
    lines.push('• Applicable federal, state, and industry regulations based on the organization\'s sector and contracts.');
  }
  if (state && state.fismaMode) {
    lines.push('• FISMA / FedRAMP / DoD RMF — authorization and continuous monitoring requirements for federal systems.');
  }
  if (state && state.privacyOverlay) {
    lines.push('• Privacy Act of 1974 / E-Government Act of 2002 — collection, use, and protection of personally identifiable information (PII).');
  }
  var lawIds = typeof getActiveComplianceLawIds === 'function' ? getActiveComplianceLawIds() : [];
  lawIds.forEach(function(lawId) {
    var meta = typeof resolveLawMeta === 'function' ? resolveLawMeta(lawId) : null;
    if (meta) lines.push('• ' + meta.label + ' — ' + meta.subtitle + '.');
  });
  if (typeof getOrgClassificationSummary === 'function') {
    var profile = getOrgClassificationSummary();
    if (profile) {
      lines.push('');
      lines.push('Organization profile: ' + profile + '.');
    }
  }
  lines.push('');
  lines.push('All personnel must comply with the above requirements as implemented through this policy and its subordinate domain policies.');
  return lines.join('\n');
}

function getCustomRegFrameworks(kind) {
  return (state.customRegFrameworks || []).filter(function(c) { return c.kind === kind; });
}

function getCustomRegMeta(entry) {
  return {
    id: entry.id,
    label: entry.label,
    subtitle: entry.subtitle || 'Custom',
    color: entry.color || '#64748b',
    bg: '#f8fafc',
    custom: true
  };
}

function applySectorRegMappingSuggestions(force) {
  if (!force) return false;
  var key = getOrgRegProfileKey();
  if (!key) return false;
  var sug = getRegSuggestionsForProfile(key);
  if (!state.activeFrameworks) state.activeFrameworks = {};
  if (!state.activeComplianceLaws) state.activeComplianceLaws = {};
  Object.keys(FRAMEWORK_META).forEach(function(id) {
    state.activeFrameworks[id] = sug.frameworks.indexOf(id) >= 0;
  });
  Object.keys(COMPLIANCE_LAW_META).forEach(function(id) {
    state.activeComplianceLaws[id] = sug.laws.indexOf(id) >= 0;
  });
  (state.customRegFrameworks || []).forEach(function(c) { c.active = false; });
  state._regMappingInitialized = true;
  markDirty();
  return true;
}

function addCustomRegFramework(label, kind, subtitle) {
  var name = String(label || '').trim();
  if (!name) {
    if (typeof showToast === 'function') showToast('Enter a name for the custom framework.', true);
    return false;
  }
  if (kind !== 'standard' && kind !== 'law') kind = 'law';
  if (!state.customRegFrameworks) state.customRegFrameworks = [];
  var id = 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
  state.customRegFrameworks.push({
    id: id,
    label: name,
    subtitle: String(subtitle || 'Custom').trim() || 'Custom',
    kind: kind,
    color: '#64748b',
    active: true
  });
  state._regMappingInitialized = true;
  markDirty();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
  else if (typeof renderCISOStep3Integrations === 'function') renderCISOStep3Integrations();
  if (typeof renderFrameworksTab === 'function') renderFrameworksTab();
  return true;
}

function submitCustomRegFramework(kind) {
  var labelEl = document.getElementById('customRegLabel');
  var subEl = document.getElementById('customRegSubtitle');
  var label = labelEl ? labelEl.value : '';
  var subtitle = subEl ? subEl.value : '';
  if (!addCustomRegFramework(label, kind, subtitle)) return;
  if (labelEl) labelEl.value = '';
  if (subEl) subEl.value = '';
}

function removeCustomRegFramework(id) {
  if (!state.customRegFrameworks) return;
  state.customRegFrameworks = state.customRegFrameworks.filter(function(c) { return c.id !== id; });
  markDirty();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
  if (typeof renderFrameworksTab === 'function') renderFrameworksTab();
}

function toggleCustomRegFramework(id) {
  var entry = (state.customRegFrameworks || []).find(function(c) { return c.id === id; });
  if (!entry) return;
  entry.active = !entry.active;
  state._regMappingInitialized = true;
  markDirty();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
  if (typeof renderFrameworksTab === 'function') renderFrameworksTab();
}

function renderCustomRegAddFormHtml() {
  return '<div class="custom-reg-add" style="margin-top:16px;padding:14px;border:1px dashed #d8dee9;border-radius:12px;background:#fafbfc;">'
    + '<div class="section-subtitle" style="margin-bottom:10px;">Add a custom framework or regulation (e.g., NIS2, EU AI Act, contract-specific CSF).</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">'
    + '<input class="form-input" id="customRegLabel" placeholder="Name (required)" onkeydown="if(event.key===\'Enter\')submitCustomRegFramework(\'law\')">'
    + '<input class="form-input" id="customRegSubtitle" placeholder="Short description (optional)">'
    + '</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="submitCustomRegFramework(\'standard\')">+ Add voluntary standard</button>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="submitCustomRegFramework(\'law\')">+ Add law / regulation</button>'
    + '</div></div>';
}

function getActiveFrameworkIds() {
  var af = state && state.activeFrameworks;
  var ids = Object.keys(FRAMEWORK_META).filter(function(k) {
    return af && typeof af === 'object' ? !!af[k] : false;
  });
  getCustomRegFrameworks('standard').forEach(function(c) {
    if (c.active) ids.push(c.id);
  });
  return ids;
}

function getActiveComplianceLawIds() {
  var laws = state && state.activeComplianceLaws;
  var ids = Object.keys(COMPLIANCE_LAW_META).filter(function(k) {
    return laws && typeof laws === 'object' ? !!laws[k] : false;
  });
  getCustomRegFrameworks('law').forEach(function(c) {
    if (c.active) ids.push(c.id);
  });
  return ids;
}

function resolveFrameworkMeta(fwId) {
  if (FRAMEWORK_META[fwId]) return FRAMEWORK_META[fwId];
  var custom = (state.customRegFrameworks || []).find(function(c) { return c.id === fwId && c.kind === 'standard'; });
  return custom ? getCustomRegMeta(custom) : null;
}

function resolveLawMeta(lawId) {
  if (COMPLIANCE_LAW_META[lawId]) return COMPLIANCE_LAW_META[lawId];
  var custom = (state.customRegFrameworks || []).find(function(c) { return c.id === lawId && c.kind === 'law'; });
  return custom ? getCustomRegMeta(custom) : null;
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
  getCustomRegFrameworks('standard').forEach(function(c) {
    if (c.active) out[c.id] = [c.label];
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
  getCustomRegFrameworks('law').forEach(function(c) {
    if (c.active) out[c.id] = [c.label];
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
    var meta = resolveFrameworkMeta(fw);
    if (!meta) return;
    var label = compact ? meta.label.split(' ')[0] : (list[0] + (list.length > 1 ? ' +' + (list.length - 1) : ''));
    parts.push('<span class="fw-badge" style="background:' + meta.bg + ';color:' + meta.color + ';border:1px solid ' + meta.color + '33;" title="' + escapeHTML(meta.label + ': ' + list.join(', ')) + '">' + escapeHTML(label) + '</span>');
  });
  return parts.join('');
}

function toggleActiveFramework(fwId) {
  if (String(fwId).indexOf('custom-') === 0) {
    toggleCustomRegFramework(fwId);
    return;
  }
  if (!state.activeFrameworks) state.activeFrameworks = {};
  var current = !!state.activeFrameworks[fwId];
  state.activeFrameworks[fwId] = !current;
  state._regMappingInitialized = true;
  markDirty();
  renderFrameworksTab();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
  else if (typeof renderCISOStep3Integrations === 'function' && document.getElementById('ciso-step-3-body')) renderCISOStep3Integrations();
}

function toggleActiveComplianceLaw(lawId) {
  if (String(lawId).indexOf('custom-') === 0) {
    toggleCustomRegFramework(lawId);
    return;
  }
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

  var cards = Object.keys(FRAMEWORK_META).map(function(fw) {
    var meta = FRAMEWORK_META[fw];
    if (!meta) return '';
    var on = !!(state.activeFrameworks || {})[fw];
    var cov = computeFrameworkCoverage(fw);
    var customNote = meta.custom ? '<div class="fw-coverage-stats" style="opacity:0.75;">Custom — tracked in your program; add control crosswalks as needed.</div>' : '';
    return '<div class="fw-coverage-card' + (on ? '' : ' fw-coverage-card-off') + '" style="--fw-color:' + meta.color + ';">'
      + '<div class="fw-coverage-head">'
      + '<div><div class="fw-coverage-title">' + escapeHTML(meta.label) + '</div>'
      + '<div class="fw-coverage-sub">' + escapeHTML(meta.subtitle) + '</div></div>'
      + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="toggleActiveFramework(\'' + fw + '\')"><span class="fw-toggle-track"></span></label>'
      + '</div>'
      + (on && !meta.custom
        ? '<div class="fw-coverage-bar-wrap"><div class="fw-coverage-bar" style="width:' + cov.pct + '%;"></div></div>'
          + '<div class="fw-coverage-stats">'
          + '<span><strong>' + cov.pct + '%</strong> implemented</span>'
          + '<span>' + cov.implemented + ' / ' + cov.mapped + ' mapped controls</span>'
          + '</div>'
          + '<button type="button" class="btn btn-secondary btn-sm" onclick="state._frameworkFilter=\'' + fw + '\';renderFrameworksTab();">View mapping →</button>'
        : (on ? customNote : '<div class="fw-coverage-stats" style="opacity:0.6;">Tracking off — enable to include in posture</div>'))
      + '</div>';
  }).join('');
  cards += getCustomRegFrameworks('standard').map(function(c) {
    var meta = getCustomRegMeta(c);
    var on = !!c.active;
    var cov = computeFrameworkCoverage(c.id);
    var customNote = '<div class="fw-coverage-stats" style="opacity:0.75;">Custom — tracked in your program; add control crosswalks as needed.</div>';
    return '<div class="fw-coverage-card' + (on ? '' : ' fw-coverage-card-off') + '" style="--fw-color:' + meta.color + ';">'
      + '<div class="fw-coverage-head">'
      + '<div><div class="fw-coverage-title">' + escapeHTML(meta.label) + '</div>'
      + '<div class="fw-coverage-sub">' + escapeHTML(meta.subtitle) + '</div></div>'
      + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="toggleActiveFramework(\'' + c.id + '\')"><span class="fw-toggle-track"></span></label>'
      + '</div>'
      + (on ? customNote : '<div class="fw-coverage-stats" style="opacity:0.6;">Tracking off — enable to include in posture</div>')
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="removeCustomRegFramework(\'' + c.id + '\')">Remove</button>'
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
      var meta = resolveFrameworkMeta(fw);
      if (!meta) return '';
      return '<td style="font-size:11px;color:' + meta.color + ';font-weight:600;">' + (list.length ? escapeHTML(list.join(', ')) : '<span style="color:var(--text-muted);font-weight:400;">—</span>') + '</td>';
    }).join('');
    var lawCells = activeLaws.map(function(lawId) {
      var list = lawRefs[lawId] || [];
      var meta = resolveLawMeta(lawId);
      if (!meta) return '';
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
    var meta = resolveFrameworkMeta(fw);
    return meta ? '<th style="font-size:11px;color:' + meta.color + ';">' + escapeHTML(meta.label) + '</th>' : '';
  }).join('') + activeLaws.map(function(lawId) {
    var meta = resolveLawMeta(lawId);
    return meta ? '<th style="font-size:11px;color:' + meta.color + ';">' + escapeHTML(meta.label) + '</th>' : '';
  }).join('');

  body.innerHTML = ''
    + '<div class="fw-intro">'
    + '<p>EightFiftyThree maps your NIST 800-53 program to voluntary standards (<strong>ISO 27001</strong>, <strong>SOC 2</strong>) and, separately, to <strong>laws &amp; regulations</strong> you enable. Coverage updates as control owners mark implementation.</p>'
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
    var meta = resolveFrameworkMeta(fw);
    if (!meta) return '';
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
  var profileKey = getOrgRegProfileKey();
  var sug = profileKey ? getRegSuggestionsForProfile(profileKey) : null;
  var rows = Object.keys(FRAMEWORK_META).map(function(fwId) {
    var meta = FRAMEWORK_META[fwId];
    var on = !!af[fwId];
    var suggested = sug && sug.frameworks.indexOf(fwId) >= 0;
    return renderRegSetupRow(meta, on, suggested, 'toggleActiveFramework(\'' + fwId + '\')', null);
  }).join('');
  rows += getCustomRegFrameworks('standard').map(function(c) {
    var meta = getCustomRegMeta(c);
    return renderRegSetupRow(meta, !!c.active, false, 'toggleActiveFramework(\'' + c.id + '\')', 'removeCustomRegFramework(\'' + c.id + '\')');
  }).join('');
  var sectorHint = isOrgClassificationComplete()
    ? '<div class="form-hint" style="margin-bottom:12px;"><strong>' + escapeHTML(getOrgClassificationSummary()) + '</strong> — use the switches to enable lenses; <span class="fw-setup-suggested-inline">Suggested</span> items fit your profile.</div>'
    : '<div class="form-hint" style="margin-bottom:12px;">Complete organization type, level, and sector in Step 1 to see tailored suggestions.</div>';
  return '<div class="fw-setup-section">'
    + '<div class="section-title" style="margin-bottom:4px;">Voluntary standards &amp; frameworks</div>'
    + '<div class="section-subtitle" style="margin-bottom:8px;">NIST 800-53 is your anchor — enable other lenses to see crosswalks on every control.</div>'
    + sectorHint
    + '<div class="fw-setup-list">' + rows + '</div>'
    + '</div>';
}

function renderRegSetupRow(meta, on, suggested, toggleFn, removeFn) {
  return '<div class="fw-setup-row' + (on ? ' fw-setup-row-on' : '') + (suggested ? ' fw-setup-row-suggested' : '') + (meta.custom ? ' fw-setup-row-custom' : '') + '" style="--fw-color:' + meta.color + ';">'
    + '<div class="fw-setup-row-info">'
    + '<div class="fw-setup-row-label">' + escapeHTML(meta.label) + '</div>'
    + (meta.subtitle ? '<div class="fw-setup-row-sub">' + escapeHTML(meta.subtitle) + '</div>' : '')
    + (suggested ? '<span class="fw-setup-suggested-tag">Suggested</span>' : '')
    + '</div>'
    + '<div class="fw-setup-row-actions">'
    + (removeFn ? '<button type="button" class="btn btn-secondary btn-sm fw-setup-row-remove" onclick="' + removeFn + '">Remove</button>' : '')
    + '<label class="fw-toggle fw-setup-toggle" title="' + (on ? 'Enabled' : 'Off') + '">'
    + '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="' + toggleFn + '">'
    + '<span class="fw-toggle-track"></span></label>'
    + '</div></div>';
}

function renderComplianceLawSetupSectionHtml() {
  var laws = state.activeComplianceLaws || {};
  var profileKey = getOrgRegProfileKey();
  var sug = profileKey ? getRegSuggestionsForProfile(profileKey) : null;
  var rows = Object.keys(COMPLIANCE_LAW_META).map(function(lawId) {
    var meta = COMPLIANCE_LAW_META[lawId];
    var on = !!laws[lawId];
    var suggested = sug && sug.laws.indexOf(lawId) >= 0;
    return renderRegSetupRow(meta, on, suggested, 'toggleActiveComplianceLaw(\'' + lawId + '\')', null);
  }).join('');
  rows += getCustomRegFrameworks('law').map(function(c) {
    var meta = getCustomRegMeta(c);
    return renderRegSetupRow(meta, !!c.active, false, 'toggleActiveComplianceLaw(\'' + c.id + '\')', 'removeCustomRegFramework(\'' + c.id + '\')');
  }).join('');
  return '<div class="fw-setup-section" style="margin-top:24px;">'
    + '<div class="section-title" style="margin-bottom:4px;">Compliance frameworks (laws &amp; regulations)</div>'
    + '<div class="section-subtitle" style="margin-bottom:12px;">Separate from voluntary standards — track statutory and regulatory obligations.</div>'
    + '<div class="fw-setup-list">' + rows + '</div>'
    + '</div>';
}

function renderComplianceLawCoverageCardsHtml() {
  var cards = Object.keys(COMPLIANCE_LAW_META).map(function(lawId) {
    var meta = COMPLIANCE_LAW_META[lawId];
    var on = !!(state.activeComplianceLaws || {})[lawId];
    return renderLawCoverageCard(meta, on, 'toggleActiveComplianceLaw(\'' + lawId + '\')');
  }).join('');
  cards += getCustomRegFrameworks('law').map(function(c) {
    return renderLawCoverageCard(getCustomRegMeta(c), !!c.active, 'toggleActiveComplianceLaw(\'' + c.id + '\')', 'removeCustomRegFramework(\'' + c.id + '\')');
  }).join('');
  return '<div class="fw-setup-section" style="margin-top:8px;"><div class="section-title" style="margin-bottom:10px;">Laws &amp; regulations</div><div class="fw-coverage-grid">' + cards + '</div></div>';
}

function renderLawCoverageCard(meta, on, toggleAttr, removeAttr) {
  return '<div class="fw-coverage-card' + (on ? '' : ' fw-coverage-card-off') + '" style="--fw-color:' + meta.color + ';">'
    + '<div class="fw-coverage-head">'
    + '<div><div class="fw-coverage-title">' + escapeHTML(meta.label) + '</div>'
    + '<div class="fw-coverage-sub">' + escapeHTML(meta.subtitle) + '</div></div>'
    + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="' + toggleAttr + '"><span class="fw-toggle-track"></span></label>'
    + '</div>'
    + (on
      ? '<div class="fw-coverage-stats">' + (meta.custom ? 'Custom regulation tracked in your program.' : 'Tracking on — citations appear in the mapping table when enabled.') + '</div>'
      + (removeAttr ? '<button type="button" class="btn btn-secondary btn-sm" onclick="' + removeAttr + '">Remove</button>' : '')
      : '<div class="fw-coverage-stats" style="opacity:0.6;">Tracking off</div>')
    + '</div>';
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
