// js/nist-csf-map.js -- NIST SP 800-53 Rev. 5 to CSF 2.0 alignment (Feb 2024).
// Loaded after core.js. Static reference data + derived coverage / packaging helpers.
// Alignment aid for RMF Prepare (SP 800-37 Rev. 2) -- not a CSF Profile builder.

var CSF_VERSION = '2.0';

var CSF_FUNCTIONS = {
  GV: { id: 'GV', name: 'Govern', short: 'Govern the cybersecurity program' },
  ID: { id: 'ID', name: 'Identify', short: 'Understand assets and risk' },
  PR: { id: 'PR', name: 'Protect', short: 'Safeguard assets and access' },
  DE: { id: 'DE', name: 'Detect', short: 'Find cybersecurity events' },
  RS: { id: 'RS', name: 'Respond', short: 'Take action on incidents' },
  RC: { id: 'RC', name: 'Recover', short: 'Restore operations' }
};

var CSF_CATEGORIES = {
  'GV.OC': { id: 'GV.OC', fn: 'GV', name: 'Organizational Context' },
  'GV.RM': { id: 'GV.RM', fn: 'GV', name: 'Risk Management Strategy' },
  'GV.RR': { id: 'GV.RR', fn: 'GV', name: 'Roles, Responsibilities, and Authorities' },
  'GV.PO': { id: 'GV.PO', fn: 'GV', name: 'Policy' },
  'GV.OV': { id: 'GV.OV', fn: 'GV', name: 'Oversight' },
  'GV.SC': { id: 'GV.SC', fn: 'GV', name: 'Cybersecurity Supply Chain Risk Management' },
  'ID.AM': { id: 'ID.AM', fn: 'ID', name: 'Asset Management' },
  'ID.RA': { id: 'ID.RA', fn: 'ID', name: 'Risk Assessment' },
  'ID.IM': { id: 'ID.IM', fn: 'ID', name: 'Improvement' },
  'PR.AA': { id: 'PR.AA', fn: 'PR', name: 'Identity Management, Authentication, and Access Control' },
  'PR.AT': { id: 'PR.AT', fn: 'PR', name: 'Awareness and Training' },
  'PR.DS': { id: 'PR.DS', fn: 'PR', name: 'Data Security' },
  'PR.PS': { id: 'PR.PS', fn: 'PR', name: 'Platform Security' },
  'PR.IR': { id: 'PR.IR', fn: 'PR', name: 'Technology Infrastructure Resilience' },
  'DE.CM': { id: 'DE.CM', fn: 'DE', name: 'Continuous Monitoring' },
  'DE.AE': { id: 'DE.AE', fn: 'DE', name: 'Adverse Event Analysis' },
  'RS.MA': { id: 'RS.MA', fn: 'RS', name: 'Incident Management' },
  'RS.AN': { id: 'RS.AN', fn: 'RS', name: 'Incident Analysis' },
  'RS.CO': { id: 'RS.CO', fn: 'RS', name: 'Incident Response Reporting and Communication' },
  'RS.MI': { id: 'RS.MI', fn: 'RS', name: 'Incident Mitigation' },
  'RC.RP': { id: 'RC.RP', fn: 'RC', name: 'Incident Recovery Plan Execution' },
  'RC.CO': { id: 'RC.CO', fn: 'RC', name: 'Incident Recovery Communication' }
};

var CSF_SUBCATEGORIES = {
  'GV.PO-01': 'Policy is established, communicated, and enforced',
  'GV.RM-01': 'Risk management objectives are established and agreed to by organizational stakeholders',
  'PR.AA-01': 'Identities and credentials for authorized users, services, and hardware are managed',
  'PR.AA-02': 'Identities are proofed and bound to credentials based on the context of interaction',
  'PR.AA-03': 'Users, services, and hardware are authenticated',
  'PR.AA-05': 'Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed',
  'PR.AA-06': 'Physical access to assets is managed, monitored, and enforced commensurate with risk',
  'PR.AT-01': 'Personnel are provided with awareness and training so they possess the knowledge and skills to perform general cybersecurity-related tasks',
  'PR.AT-02': 'Individuals in specialized roles are provided with awareness and training so they possess the knowledge and skills to perform relevant cybersecurity-related tasks',
  'PR.DS-01': 'The confidentiality, integrity, and availability of data-at-rest are protected',
  'PR.DS-02': 'The confidentiality, integrity, and availability of data-in-transit are protected',
  'PR.DS-11': 'Backups of data are created, protected, maintained, and tested',
  'PR.PS-01': 'Configuration management practices are established and applied',
  'PR.PS-02': 'Software is maintained, replaced, and removed commensurate with risk',
  'PR.PS-04': 'Log records are generated and made available for continuous monitoring',
  'PR.PS-05': 'Installation and execution of unauthorized software are prevented',
  'PR.PS-06': 'Secure software development practices are integrated throughout the software development life cycle',
  'PR.IR-01': 'Networks and environments are protected from unauthorized logical access and usage',
  'PR.IR-03': 'Mechanisms are implemented to achieve resilience requirements in normal and adverse situations',
  'ID.AM-01': 'Inventories of hardware managed by the organization are maintained',
  'ID.AM-02': 'Inventories of software, services, and systems managed by the organization are maintained',
  'ID.RA-01': 'Vulnerabilities in assets are identified, validated, and recorded',
  'ID.RA-05': 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response',
  'DE.CM-01': 'Networks and network services are monitored to find potentially adverse events',
  'DE.CM-02': 'The physical environment is monitored to find potentially adverse events',
  'DE.CM-03': 'Personnel activity and technology usage are monitored to find potentially adverse events',
  'DE.CM-09': 'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events',
  'DE.AE-02': 'Potentially adverse events are analyzed to better understand associated activities',
  'DE.AE-03': 'Information is correlated from multiple sources',
  'RS.MA-01': 'The incident response plan is executed in coordination with relevant third parties once an incident is declared',
  'RS.MI-01': 'Incidents are contained',
  'RS.MI-02': 'Incidents are eradicated',
  'RS.CO-02': 'Internal and external stakeholders are notified of incidents',
  'RC.RP-01': 'The recovery portion of the incident response plan is executed once initiated from the incident response process',
  'RC.RP-04': 'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms'
};

// Control-level Function+Category default when a parent ID is not in NIST_CSF_MAP.
var NIST_CSF_FAMILY_DEFAULT = {
  AC: 'PR.AA', AT: 'PR.AT', AU: 'DE.CM', CA: 'DE.CM', CM: 'PR.PS',
  CP: 'RC.RP', IA: 'PR.AA', IR: 'RS.MA', MA: 'PR.PS', MP: 'PR.DS',
  PE: 'PR.IR', PL: 'GV.PO', PM: 'GV.RM', PS: 'GV.RR', PT: 'PR.DS',
  RA: 'ID.RA', SA: 'PR.PS', SC: 'PR.IR', SI: 'PR.PS', SR: 'GV.SC'
};

// Parent-control tokens: "PR.AA" or "PR.AA:PR.AA-01". Enhancements inherit the parent.
var NIST_CSF_MAP = {
  'AC-1': ['GV.PO:GV.PO-01'], 'AC-2': ['PR.AA:PR.AA-01', 'PR.AA:PR.AA-05'], 'AC-3': ['PR.AA:PR.AA-05'],
  'AC-5': ['PR.AA:PR.AA-05'], 'AC-6': ['PR.AA:PR.AA-05'], 'AC-7': ['PR.AA:PR.AA-03'],
  'AC-17': ['PR.AA:PR.AA-05', 'PR.IR:PR.IR-01'], 'AC-18': ['PR.IR', 'PR.AA'],
  'AT-1': ['GV.PO:GV.PO-01'], 'AT-2': ['PR.AT:PR.AT-01'], 'AT-3': ['PR.AT:PR.AT-02'],
  'AU-1': ['GV.PO:GV.PO-01'], 'AU-2': ['DE.CM:DE.CM-03', 'PR.PS:PR.PS-04'], 'AU-6': ['DE.AE:DE.AE-02', 'DE.AE:DE.AE-03'],
  'AU-12': ['PR.PS:PR.PS-04'],
  'CA-1': ['GV.PO:GV.PO-01'], 'CA-2': ['ID.IM'], 'CA-3': ['ID.AM'], 'CA-5': ['ID.IM'],
  'CA-6': ['GV.OV', 'GV.RR'], 'CA-7': ['DE.CM:DE.CM-01'], 'CA-8': ['ID.IM'],
  'CM-1': ['GV.PO:GV.PO-01'], 'CM-2': ['PR.PS:PR.PS-01'], 'CM-6': ['PR.PS:PR.PS-01'],
  'CM-7': ['PR.PS:PR.PS-05'], 'CM-8': ['ID.AM:ID.AM-01', 'ID.AM:ID.AM-02'],
  'CP-1': ['GV.PO:GV.PO-01'], 'CP-2': ['RC.RP:RC.RP-01', 'PR.IR:PR.IR-03'], 'CP-9': ['PR.DS:PR.DS-11', 'RC.RP'],
  'CP-10': ['RC.RP:RC.RP-04'],
  'IA-1': ['GV.PO:GV.PO-01'], 'IA-2': ['PR.AA:PR.AA-03'], 'IA-4': ['PR.AA:PR.AA-01'],
  'IA-5': ['PR.AA:PR.AA-01'], 'IA-8': ['PR.AA:PR.AA-03'], 'IA-12': ['PR.AA:PR.AA-02'],
  'IR-1': ['GV.PO:GV.PO-01'], 'IR-4': ['RS.MI:RS.MI-01', 'RS.MI:RS.MI-02'], 'IR-6': ['RS.CO:RS.CO-02'],
  'IR-8': ['RS.MA:RS.MA-01'],
  'PE-3': ['PR.AA:PR.AA-06'], 'PE-6': ['DE.CM:DE.CM-02'],
  'PL-1': ['GV.PO:GV.PO-01'], 'PL-2': ['GV.PO:GV.PO-01'],
  'PM-1': ['GV.PO:GV.PO-01'], 'PM-5': ['ID.AM:ID.AM-01'], 'PM-9': ['GV.RM:GV.RM-01', 'ID.RA'],
  'RA-3': ['ID.RA:ID.RA-05'], 'RA-5': ['ID.RA:ID.RA-01'],
  'SA-3': ['PR.PS:PR.PS-06'],
  'SC-7': ['PR.IR:PR.IR-01'], 'SC-8': ['PR.DS:PR.DS-02'], 'SC-28': ['PR.DS:PR.DS-01'],
  'SI-2': ['PR.PS:PR.PS-02'], 'SI-4': ['DE.CM:DE.CM-09']
};

// ---------------------------------------------------------------------------
// Organizational packaging default (domain POLICY documents by CSF Function).
// This is a partition of 800-53 families into policy binders for a lean team.
// It is NOT a claim that every control in the family maps only to that Function
// (AC-1 is GV.PO-like; SI-2 is Protect/platform; CA-6 is oversight/Govern).
// Control-level tags (NIST_CSF_MAP) remain the objective-layer crosswalk.
//
// Govern (GV) is the ISP -- PM (and XX-1 policy-and-procedures controls) live
// there. There is no sixth "Govern" domain-policy card.
//
// Identify: knowing the estate and risk. RA is the risk-assessment core;
// SR/SA are supply-chain and acquisition risk (owner direction); PL is system
// planning / SSP / architecture (estate knowledge). Org-governance PL-1 is
// ISP-tier like other XX-1s.
// Protect: preventive access, people, media, physical, platform, comms.
// PT (privacy overlay) is Protect -- PII processing is data-protection work,
// not a second ISP. Detect: logging, integrity monitoring, CA continuous
// monitoring (CA-2/CA-5/CA-8 also Identify -- primary is Detect).
// Respond: IR. Recover: CP.
// ---------------------------------------------------------------------------
var NIST_CSF_FAMILY_POLICY_FN = {
  PM: 'GV',
  RA: 'ID', PL: 'ID', SA: 'ID', SR: 'ID',
  AC: 'PR', IA: 'PR', AT: 'PR', PS: 'PR', MP: 'PR', PE: 'PR', SC: 'PR', CM: 'PR', MA: 'PR', PT: 'PR',
  AU: 'DE', SI: 'DE', CA: 'DE',
  IR: 'RS',
  CP: 'RC'
};

var NIST_CSF_FUNCTION_POLICY_MASTER = {
  ID: 'RA',
  PR: 'AC',
  DE: 'AU',
  RS: 'IR',
  RC: 'CP'
};

var NIST_CSF_FUNCTION_POLICY_REASON = {
  ID: 'Risk, planning, acquisition, and supply chain \u2014 knowing the estate.',
  PR: 'Access, people, media, physical, configuration, and communications protection.',
  DE: 'Logging, integrity monitoring, and continuous assessment.',
  RS: 'Incident response.',
  RC: 'Contingency planning and recovery.'
};

function getCsfFunctionPolicyGroups() {
  var order = ['ID', 'PR', 'DE', 'RS', 'RC'];
  return order.map(function(fn) {
    var families = [];
    Object.keys(NIST_CSF_FAMILY_POLICY_FN).forEach(function(fam) {
      if (NIST_CSF_FAMILY_POLICY_FN[fam] === fn) families.push(fam);
    });
    families.sort();
    var master = NIST_CSF_FUNCTION_POLICY_MASTER[fn];
    var meta = CSF_FUNCTIONS[fn] || { name: fn };
    return {
      fn: fn,
      title: meta.name,
      code: fn,
      master: master,
      families: families,
      reason: NIST_CSF_FUNCTION_POLICY_REASON[fn] || ''
    };
  });
}

function getCsfFamilyPolicyFunction(fam) {
  return NIST_CSF_FAMILY_POLICY_FN[fam] || '';
}

function getCsfFunctionPolicyTitle(fn) {
  var meta = CSF_FUNCTIONS[fn];
  return meta ? meta.name : fn;
}

function getCsfFunctionPolicyTitleForMaster(masterFam) {
  var fn = getCsfFamilyPolicyFunction(masterFam);
  if (!fn || fn === 'GV') return '';
  if (NIST_CSF_FUNCTION_POLICY_MASTER[fn] !== masterFam) return '';
  return getCsfFunctionPolicyTitle(fn);
}

function getCsfParentControlId(ctrlId) {
  return String(ctrlId || '').replace(/\([^)]+\)$/, '');
}

function parseCsfMapToken(token) {
  var raw = String(token || '');
  var parts = raw.split(':');
  var cat = parts[0] || '';
  var sub = parts[1] || '';
  var fn = cat.split('.')[0] || '';
  if (!fn || !CSF_FUNCTIONS[fn] || !CSF_CATEGORIES[cat]) return null;
  if (sub && !CSF_SUBCATEGORIES[sub]) sub = '';
  return { fn: fn, cat: cat, sub: sub };
}

function getCsfMappingsForControl(ctrlId) {
  var id = String(ctrlId || '').trim();
  if (!id) return [];
  var raw = NIST_CSF_MAP[id];
  if (!raw) {
    var parent = getCsfParentControlId(id);
    if (parent !== id) raw = NIST_CSF_MAP[parent];
  }
  if (!raw) {
    var fam = id.split('-')[0];
    var def = NIST_CSF_FAMILY_DEFAULT[fam];
    if (!def) return [];
    var parsed = parseCsfMapToken(def);
    return parsed ? [parsed] : [];
  }
  var out = [];
  var seenCat = {};
  var seenSub = {};
  (Array.isArray(raw) ? raw : [raw]).forEach(function(token) {
    var m = parseCsfMapToken(token);
    if (!m) return;
    if (m.sub) {
      if (seenSub[m.sub]) return;
      seenSub[m.sub] = true;
      seenCat[m.cat] = true;
      out.push(m);
      return;
    }
    if (seenCat[m.cat]) return;
    seenCat[m.cat] = true;
    out.push(m);
  });
  return out;
}

function getCsfPrimaryMapping(ctrlId) {
  var maps = getCsfMappingsForControl(ctrlId);
  return maps.length ? maps[0] : null;
}

function getCsfCategoryLabel(catId) {
  var cat = CSF_CATEGORIES[catId];
  return cat ? cat.name : String(catId || '');
}

function getCsfFunctionLabel(fnId) {
  var fn = CSF_FUNCTIONS[fnId];
  return fn ? fn.name : String(fnId || '');
}

function renderCsfTagsHtml(ctrlId, opts) {
  opts = opts || {};
  if (typeof escapeHTML !== 'function') return '';
  var maps = getCsfMappingsForControl(ctrlId);
  if (!maps.length) return '';
  var chips = maps.map(function(m) {
    var label = m.sub || m.cat;
    var fnName = getCsfFunctionLabel(m.fn);
    var catName = getCsfCategoryLabel(m.cat);
    var title = fnName + ' / ' + catName + (m.sub && CSF_SUBCATEGORIES[m.sub] ? ' \u2014 ' + CSF_SUBCATEGORIES[m.sub] : '');
    return '<span class="csf-tag csf-fn-' + m.fn.toLowerCase() + '" title="' + escapeHTML(title) + '">' + escapeHTML(label) + '</span>';
  }).join('');
  if (opts.compact) return '<span class="csf-tag-group">' + chips + '</span>';
  var primary = maps[0];
  var detail = getCsfFunctionLabel(primary.fn) + ' / ' + getCsfCategoryLabel(primary.cat);
  return '<span class="csf-meta"><span class="csf-tag-group">' + chips + '</span><span class="csf-meta-detail">' + escapeHTML(detail) + '</span></span>';
}

function getCsfCoverageControlIds() {
  var ids = {};
  var hasSelection = false;
  var selected = (typeof state !== 'undefined' && state.policySelectedControls) ? state.policySelectedControls : null;
  if (selected) {
    Object.keys(selected).forEach(function(fam) {
      (selected[fam] || []).forEach(function(id) {
        if (id) { ids[id] = true; hasSelection = true; }
      });
    });
  }
  if (!hasSelection && typeof getActiveControls === 'function') {
    getActiveControls().forEach(function(c) {
      if (c && c.id) ids[c.id] = true;
    });
  }
  if (typeof state !== 'undefined') {
    Object.keys(state.pmControls || {}).forEach(function(id) {
      if (state.pmControls[id]) ids[id] = true;
    });
    (state.policyCatalog || []).forEach(function(doc) {
      (doc && doc.controlIds || []).forEach(function(id) {
        if (id) ids[id] = true;
      });
    });
  }
  return Object.keys(ids);
}

function isCsfControlImplemented(ctrlId) {
  if (typeof state === 'undefined') return false;
  var st = (state.controlStatus || {})[ctrlId];
  return !!(st && (st.status === 'Implemented' || st.status === 'Inherited'));
}

function isCsfControlDesigned(ctrlId) {
  if (typeof isControlDesigned === 'function') {
    try { return !!isControlDesigned(ctrlId); } catch (e) { /* fall through */ }
  }
  return isCsfControlImplemented(ctrlId);
}

function computeCsfFunctionCoverage() {
  var ids = getCsfCoverageControlIds();
  var byFn = {};
  Object.keys(CSF_FUNCTIONS).forEach(function(fn) {
    byFn[fn] = { fn: fn, total: 0, designed: 0, implemented: 0, pctDesigned: 0, pctImplemented: 0 };
  });
  ids.forEach(function(id) {
    var maps = getCsfMappingsForControl(id);
    var seenFn = {};
    maps.forEach(function(m) {
      if (!byFn[m.fn] || seenFn[m.fn]) return;
      seenFn[m.fn] = true;
      byFn[m.fn].total++;
      if (isCsfControlDesigned(id)) byFn[m.fn].designed++;
      if (isCsfControlImplemented(id)) byFn[m.fn].implemented++;
    });
  });
  Object.keys(byFn).forEach(function(fn) {
    var row = byFn[fn];
    row.pctDesigned = row.total ? Math.round((row.designed / row.total) * 100) : 0;
    row.pctImplemented = row.total ? Math.round((row.implemented / row.total) * 100) : 0;
  });
  return {
    version: CSF_VERSION,
    inScope: ids.length,
    functions: ['GV', 'ID', 'PR', 'DE', 'RS', 'RC'].map(function(fn) { return byFn[fn]; })
  };
}

function renderCsfDisclaimerHtml() {
  return '<p class="csf-disclaimer">Aligned to CSF 2.0. This is an alignment aid for communicating 800-53 outcomes \u2014 not a certified CSF Profile and not a second control catalog.</p>';
}

function renderCsfPrepareNoteHtml() {
  return '<div class="csf-prepare-note" role="note">'
    + '<div class="csf-prepare-note-kicker">RMF Prepare \u00b7 CSF 2.0</div>'
    + '<p>NIST SP 800-37 Rev. 2 Prepare is where the organization establishes its control baseline and is expected to express that baseline as cybersecurity outcomes. CSF 2.0 is NIST\u2019s recommended communication model for those outcomes. Policy control objectives stay written against 800-53; CSF tags on each objective are the outcome label. Domain policies default-group by Function; Govern is the ISP.</p>'
    + '</div>';
}

function renderCsfCoverageStripHtml(variant) {
  variant = variant || 'panel';
  var cov = computeCsfFunctionCoverage();
  var cards = cov.functions.map(function(row) {
    var meta = CSF_FUNCTIONS[row.fn] || { name: row.fn };
    var pct = row.pctImplemented || row.pctDesigned;
    var barPct = row.total ? row.pctImplemented : 0;
    return '<div class="csf-fn-card csf-fn-' + row.fn.toLowerCase() + '">'
      + '<div class="csf-fn-card-head"><span class="csf-fn-code">' + row.fn + '</span>'
      + '<span class="csf-fn-name">' + escapeHTML(meta.name) + '</span></div>'
      + '<div class="csf-fn-pct">' + (row.total ? pct + '%' : '\u2014') + '</div>'
      + '<div class="csf-coverage-bar-wrap"><div class="csf-coverage-bar" style="width:' + barPct + '%;"></div></div>'
      + '<div class="csf-fn-sub">' + row.implemented + ' implemented \u00b7 ' + row.designed + ' designed \u00b7 ' + row.total + ' in scope</div>'
      + '</div>';
  }).join('');

  if (variant === 'strip') {
    return '<div class="csf-dash-strip">'
      + '<div class="csf-dash-strip-head"><span>CSF 2.0 outcomes</span>'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="showTab(\'frameworks\')">View alignment \u2192</button></div>'
      + '<div class="csf-fn-grid csf-fn-grid-compact">' + cards + '</div>'
      + renderCsfDisclaimerHtml()
      + '</div>';
  }

  if (variant === 'embed') {
    return '<div class="csf-embed">'
      + '<div class="csf-embed-head">CSF 2.0 Function coverage of mapped 800-53 controls</div>'
      + '<div class="csf-fn-grid csf-fn-grid-compact">' + cards + '</div>'
      + renderCsfDisclaimerHtml()
      + '</div>';
  }

  return '<div class="csf-panel">'
    + '<div class="csf-panel-head">'
    + '<div><div class="csf-panel-title">NIST CSF 2.0 \u2014 inherent outcome view</div>'
    + '<div class="csf-panel-sub">Always on. 800-53 remains the control catalog; CSF 2.0 labels how the baseline supports cybersecurity outcomes (RMF Prepare). Optional overlays (ISO, SOC 2, HIPAA, and others) stay optional below.</div></div>'
    + '</div>'
    + '<div class="csf-fn-grid">' + cards + '</div>'
    + renderCsfDisclaimerHtml()
    + '</div>';
}
