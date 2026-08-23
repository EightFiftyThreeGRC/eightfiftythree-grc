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
  'GV.OC-01': 'The organizational mission is understood and informs cybersecurity risk management',
  'GV.OC-02': 'Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood and considered',
  'GV.OC-03': 'Legal, regulatory, and contractual requirements regarding cybersecurity \u2014 including privacy and civil liberties obligations \u2014 are understood and managed',
  'GV.OC-04': 'Critical objectives, capabilities, and services that external stakeholders depend on or expect from the organization are understood and communicated',
  'GV.OC-05': 'Outcomes, capabilities, and services that the organization depends on are understood and communicated',
  'GV.RM-01': 'Risk management objectives are established and agreed to by organizational stakeholders',
  'GV.RM-02': 'Risk appetite and risk tolerance statements are established, communicated, and maintained',
  'GV.RM-03': 'Cybersecurity risk management activities and outcomes are included in enterprise risk management processes',
  'GV.RM-04': 'Strategic direction that describes appropriate risk response options is established and communicated',
  'GV.RM-05': 'Lines of communication across the organization are established for cybersecurity risks, including risks from suppliers and other third parties',
  'GV.RM-06': 'A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated',
  'GV.RM-07': 'Strategic opportunities (i.e., positive risks) are characterized and are included in organizational cybersecurity risk discussions',
  'GV.RR-01': 'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving',
  'GV.RR-02': 'Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced',
  'GV.RR-03': 'Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies',
  'GV.RR-04': 'Cybersecurity is included in human resources practices',
  'GV.PO-01': 'Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced',
  'GV.PO-02': 'Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission',
  'GV.OV-01': 'Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction',
  'GV.OV-02': 'The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks',
  'GV.OV-03': 'Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed',
  'GV.SC-01': 'A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders',
  'GV.SC-02': 'Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally',
  'GV.SC-03': 'Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes',
  'GV.SC-04': 'Suppliers are known and prioritized by criticality',
  'GV.SC-05': 'Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other types of agreements with suppliers and other relevant third parties',
  'GV.SC-06': 'Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships',
  'GV.SC-07': 'The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship',
  'GV.SC-08': 'Relevant suppliers and other third parties are included in incident planning, response, and recovery activities',
  'GV.SC-09': 'Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology product and service life cycle',
  'GV.SC-10': 'Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement',
  'ID.AM-01': 'Inventories of hardware managed by the organization are maintained',
  'ID.AM-02': 'Inventories of software, services, and systems managed by the organization are maintained',
  'ID.AM-03': 'Representations of the organization\u2019s authorized network communication and internal and external network data flows are maintained',
  'ID.AM-04': 'Inventories of services provided by suppliers are maintained',
  'ID.AM-05': 'Assets are prioritized based on classification, criticality, resources, and impact on the mission',
  'ID.AM-07': 'Inventories of data and corresponding metadata for designated data types are maintained',
  'ID.AM-08': 'Systems, hardware, software, services, and data are managed throughout their life cycles',
  'ID.RA-01': 'Vulnerabilities in assets are identified, validated, and recorded',
  'ID.RA-02': 'Cyber threat intelligence is received from information sharing forums and sources',
  'ID.RA-03': 'Internal and external threats to the organization are identified and recorded',
  'ID.RA-04': 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded',
  'ID.RA-05': 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization',
  'ID.RA-06': 'Risk responses are chosen, prioritized, planned, tracked, and communicated',
  'ID.RA-07': 'Changes and exceptions are managed, assessed for risk impact, recorded, and tracked',
  'ID.RA-08': 'Processes for receiving, analyzing, and responding to vulnerability disclosures are established',
  'ID.RA-09': 'The authenticity and integrity of hardware and software are assessed prior to acquisition and use',
  'ID.RA-10': 'Critical suppliers are assessed prior to acquisition',
  'ID.IM-01': 'Improvements are identified from evaluations',
  'ID.IM-02': 'Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties',
  'ID.IM-03': 'Improvements are identified from execution of operational processes, procedures, and activities',
  'ID.IM-04': 'Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved',
  'PR.AA-01': 'Identities and credentials for authorized users, services, and hardware are managed by the organization',
  'PR.AA-02': 'Identities are proofed and bound to credentials based on the context of interactions',
  'PR.AA-03': 'Users, services, and hardware are authenticated',
  'PR.AA-04': 'Identity assertions are protected, conveyed, and verified',
  'PR.AA-05': 'Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties',
  'PR.AA-06': 'Physical access to assets is managed, monitored, and enforced commensurate with risk',
  'PR.AT-01': 'Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind',
  'PR.AT-02': 'Individuals in specialized roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind',
  'PR.DS-01': 'The confidentiality, integrity, and availability of data-at-rest are protected',
  'PR.DS-02': 'The confidentiality, integrity, and availability of data-in-transit are protected',
  'PR.DS-10': 'The confidentiality, integrity, and availability of data-in-use are protected',
  'PR.DS-11': 'Backups of data are created, protected, maintained, and tested',
  'PR.PS-01': 'Configuration management practices are established and applied',
  'PR.PS-02': 'Software is maintained, replaced, and removed commensurate with risk',
  'PR.PS-03': 'Hardware is maintained, replaced, and removed commensurate with risk',
  'PR.PS-04': 'Log records are generated and made available for continuous monitoring',
  'PR.PS-05': 'Installation and execution of unauthorized software are prevented',
  'PR.PS-06': 'Secure software development practices are integrated, and their performance is monitored throughout the software development life cycle',
  'PR.IR-01': 'Networks and environments are protected from unauthorized logical access and usage',
  'PR.IR-02': 'The organization\u2019s technology assets are protected from environmental threats',
  'PR.IR-03': 'Mechanisms are implemented to achieve resilience requirements in normal and adverse situations',
  'PR.IR-04': 'Adequate resource capacity to ensure availability is maintained',
  'DE.CM-01': 'Networks and network services are monitored to find potentially adverse events',
  'DE.CM-02': 'The physical environment is monitored to find potentially adverse events',
  'DE.CM-03': 'Personnel activity and technology usage are monitored to find potentially adverse events',
  'DE.CM-06': 'External service provider activities and services are monitored to find potentially adverse events',
  'DE.CM-09': 'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events',
  'DE.AE-02': 'Potentially adverse events are analyzed to better understand associated activities',
  'DE.AE-03': 'Information is correlated from multiple sources',
  'DE.AE-04': 'The estimated impact and scope of adverse events are understood',
  'DE.AE-06': 'Information on adverse events is provided to authorized staff and tools',
  'DE.AE-07': 'Cyber threat intelligence and other contextual information are integrated into the analysis',
  'DE.AE-08': 'Incidents are declared when adverse events meet the defined incident criteria',
  'RS.MA-01': 'The incident response plan is executed in coordination with relevant third parties once an incident is declared',
  'RS.MA-02': 'Incident reports are triaged and validated',
  'RS.MA-03': 'Incidents are categorized and prioritized',
  'RS.MA-04': 'Incidents are escalated or elevated as needed',
  'RS.MA-05': 'The criteria for initiating incident recovery are applied',
  'RS.AN-03': 'Analysis is performed to establish what has taken place during an incident and the root cause of the incident',
  'RS.AN-06': 'Actions performed during an investigation are recorded, and the records\u2019 integrity and provenance are preserved',
  'RS.AN-07': 'Incident data and metadata are collected, and their integrity and provenance are preserved',
  'RS.AN-08': 'An incident\u2019s magnitude is estimated and validated',
  'RS.CO-02': 'Internal and external stakeholders are notified of incidents',
  'RS.CO-03': 'Information is shared with designated internal and external stakeholders',
  'RS.MI-01': 'Incidents are contained',
  'RS.MI-02': 'Incidents are eradicated',
  'RC.RP-01': 'The recovery portion of the incident response plan is executed once initiated from the incident response process',
  'RC.RP-02': 'Recovery actions are selected, scoped, prioritized, and performed',
  'RC.RP-03': 'The integrity of backups and other restoration assets is verified before using them for restoration',
  'RC.RP-04': 'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms',
  'RC.RP-05': 'The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed',
  'RC.RP-06': 'The end of incident recovery is declared based on criteria, and incident related documentation is completed',
  'RC.CO-03': 'Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders',
  'RC.CO-04': 'Public updates on incident recovery are shared using approved methods and messaging'
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

function getCsfPolicyFunctionForFamily(fam) {
  if (fam === 'ISP' || fam === 'PM') return 'GV';
  return getCsfFamilyPolicyFunction(fam) || '';
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

function getCsfCategoriesForFunction(fnId) {
  var fn = String(fnId || '');
  var out = [];
  Object.keys(CSF_CATEGORIES).forEach(function(id) {
    if (CSF_CATEGORIES[id] && CSF_CATEGORIES[id].fn === fn) out.push(CSF_CATEGORIES[id]);
  });
  return out;
}

function getCsfSubcategoryIdsForCategory(catId) {
  var prefix = String(catId || '') + '-';
  return Object.keys(CSF_SUBCATEGORIES).filter(function(id) {
    return id.indexOf(prefix) === 0;
  }).sort(function(a, b) {
    var na = parseInt(a.slice(prefix.length), 10) || 0;
    var nb = parseInt(b.slice(prefix.length), 10) || 0;
    return na - nb;
  });
}

/** Explicit NIST_CSF_MAP rows only \u2014 no family-default fallback. */
function getCsfExplicitMappingsForControl(ctrlId) {
  var id = String(ctrlId || '').trim();
  if (!id) return [];
  var raw = NIST_CSF_MAP[id];
  if (!raw) {
    var parent = getCsfParentControlId(id);
    if (parent !== id) raw = NIST_CSF_MAP[parent];
  }
  if (!raw) return [];
  var out = [];
  var seen = {};
  (Array.isArray(raw) ? raw : [raw]).forEach(function(token) {
    var m = parseCsfMapToken(token);
    if (!m) return;
    var key = m.sub || m.cat;
    if (seen[key]) return;
    seen[key] = true;
    out.push(m);
  });
  return out;
}

function getCsfExplicitPmControlsForCategory(catId) {
  var out = [];
  var seen = {};
  Object.keys(NIST_CSF_MAP).forEach(function(id) {
    if (id.indexOf('PM-') !== 0) return;
    getCsfExplicitMappingsForControl(id).forEach(function(m) {
      if (m.cat === catId && !seen[id]) {
        seen[id] = true;
        out.push(id);
      }
    });
  });
  out.sort();
  return out;
}

function renderCsfExplicitTagsHtml(ctrlId) {
  if (typeof escapeHTML !== 'function') return '';
  var maps = getCsfExplicitMappingsForControl(ctrlId);
  if (!maps.length) return '';
  var chips = maps.map(function(m) {
    var label = m.sub || m.cat;
    var fnName = getCsfFunctionLabel(m.fn);
    var catName = getCsfCategoryLabel(m.cat);
    var title = fnName + ' / ' + catName + (m.sub && CSF_SUBCATEGORIES[m.sub] ? ' \u2014 ' + CSF_SUBCATEGORIES[m.sub] : '');
    return '<span class="csf-tag csf-fn-' + m.fn.toLowerCase() + '" title="' + escapeHTML(title) + '">' + escapeHTML(label) + '</span>';
  }).join('');
  return '<span class="csf-tag-group">' + chips + '</span>';
}

function renderCsfFunctionOrientationHtml(fnId, opts) {
  opts = opts || {};
  if (typeof escapeHTML !== 'function') return '';
  var fn = String(fnId || '').toUpperCase();
  var meta = CSF_FUNCTIONS[fn];
  if (!meta) return '';
  var compact = !!opts.compact;
  var cats = getCsfCategoriesForFunction(fn);
  var leads = {
    GV: 'Official GV categories and subcategories. The Information Security Policy is the Govern policy; PM controls implement these outcomes.',
    ID: 'Official Identify categories and subcategories. 800-53 controls in this Function policy implement these outcomes.',
    PR: 'Official Protect categories and subcategories. 800-53 controls in this Function policy implement these outcomes.',
    DE: 'Official Detect categories and subcategories. 800-53 controls in this Function policy implement these outcomes.',
    RS: 'Official Respond categories and subcategories. 800-53 controls in this Function policy implement these outcomes.',
    RC: 'Official Recover categories and subcategories. 800-53 controls in this Function policy implement these outcomes.'
  };
  var lead = opts.lead || leads[fn] || ('Official ' + meta.name + ' categories and subcategories.');
  var cards = cats.map(function(cat) {
    var hid = 'csf-fn-' + String(cat.id || '').replace(/\./g, '-');
    var subs = getCsfSubcategoryIdsForCategory(cat.id);
    var subHtml = compact
      ? '<div class="csf-gv-subids">' + subs.map(function(sid) {
          return '<span class="csf-gv-sub-id">' + escapeHTML(sid) + '</span>';
        }).join('') + '</div>'
      : '<ul class="csf-gv-subs">' + subs.map(function(sid) {
          return '<li class="csf-gv-sub"><span class="csf-gv-sub-id">' + escapeHTML(sid) + '</span>'
            + '<span class="csf-gv-sub-name">' + escapeHTML(CSF_SUBCATEGORIES[sid] || '') + '</span></li>';
        }).join('') + '</ul>';
    var relatedHtml = '';
    if (fn === 'GV' && opts.showMappedPm !== false) {
      var related = getCsfExplicitPmControlsForCategory(cat.id);
      if (related.length) {
        relatedHtml = '<div class="csf-gv-related">Mapped PM '
          + related.map(function(id) {
            return '<span class="csf-tag csf-fn-gv">' + escapeHTML(id) + '</span>';
          }).join('')
          + '</div>';
      }
    }
    return '<section class="csf-gv-cat" aria-labelledby="' + hid + '">'
      + '<h3 class="csf-gv-cat-head" id="' + hid + '">'
      + '<span class="csf-fn-code">' + escapeHTML(cat.id) + '</span>'
      + '<span class="csf-gv-cat-name">' + escapeHTML(cat.name) + '</span></h3>'
      + subHtml
      + relatedHtml
      + '</section>';
  }).join('');
  var cls = 'csf-fn-orient csf-fn-' + fn.toLowerCase() + (fn === 'GV' ? ' csf-gv-orient' : '') + (compact ? ' csf-fn-orient--compact' : '');
  return '<div class="' + cls + '" role="region" aria-label="NIST CSF 2.0 ' + escapeHTML(meta.name) + ' categories">'
    + '<div class="csf-gv-orient-kicker">NIST CSF 2.0 \u00b7 ' + escapeHTML(meta.name) + ' (' + fn + ')</div>'
    + '<p class="csf-gv-orient-lead">' + escapeHTML(lead) + '</p>'
    + '<div class="csf-gv-grid">' + cards + '</div>'
    + '</div>';
}

function renderCsfGovernOrientationHtml(opts) {
  return renderCsfFunctionOrientationHtml('GV', opts);
}

function renderCsfPolicyOrientationHtml(fam, opts) {
  var fn = getCsfPolicyFunctionForFamily(fam);
  if (!fn) return '';
  return renderCsfFunctionOrientationHtml(fn, opts || {});
}

function renderCsfUnmappedTagHtml() {
  if (typeof escapeHTML !== 'function') return '';
  return '<span class="csf-tag csf-unmapped" title="No official 800-53 to CSF 2.0 map entry in this program">Unmapped</span>';
}

function renderCsfTagsHtml(ctrlId, opts) {
  opts = opts || {};
  if (typeof escapeHTML !== 'function') return '';
  var maps = getCsfExplicitMappingsForControl(ctrlId);
  if (!maps.length) return opts.hideUnmapped ? '' : renderCsfUnmappedTagHtml();
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

function renderCsfControlMapHtml(ctrlId) {
  if (typeof escapeHTML !== 'function') return '';
  var maps = getCsfExplicitMappingsForControl(ctrlId);
  if (!maps.length) {
    return '<div class="csf-ctrl-map csf-ctrl-map--empty" role="note">'
      + '<div class="csf-ctrl-map-kicker">NIST CSF 2.0</div>'
      + '<p>Unmapped \u2014 no official 800-53 \u2192 CSF 2.0 entry in this program\u2019s alignment table. Family defaults are not shown as a map.</p>'
      + '</div>';
  }
  var rows = maps.map(function(m) {
    var subName = (m.sub && CSF_SUBCATEGORIES[m.sub]) ? CSF_SUBCATEGORIES[m.sub] : '';
    return '<li class="csf-ctrl-map-row">'
      + '<span class="csf-tag csf-fn-' + m.fn.toLowerCase() + '">' + escapeHTML(m.fn) + '</span>'
      + '<span class="csf-ctrl-map-cat">' + escapeHTML(m.cat) + ' ' + escapeHTML(getCsfCategoryLabel(m.cat)) + '</span>'
      + (m.sub
        ? '<span class="csf-ctrl-map-sub"><span class="csf-gv-sub-id">' + escapeHTML(m.sub) + '</span> '
          + escapeHTML(subName) + '</span>'
        : '<span class="csf-ctrl-map-sub csf-ctrl-map-sub--cat">Category-level map (no subcategory token)</span>')
      + '</li>';
  }).join('');
  return '<div class="csf-ctrl-map" role="region" aria-label="CSF 2.0 mapping">'
    + '<div class="csf-ctrl-map-kicker">NIST CSF 2.0 \u2014 mapped outcomes</div>'
    + '<p class="csf-ctrl-map-lead">800-53 implements these official Function / Category / Subcategory outcomes. Alignment aid only \u2014 not a CSF Profile.</p>'
    + '<ul class="csf-ctrl-map-list">' + rows + '</ul>'
    + '</div>';
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
    + '<p>RMF Prepare (SP 800-37 P-4) is organizationally-tailored control baselines and common controls \u2014 a tailoring and inheritance job, not an estate-wide Low / Moderate / High pick. CSF 2.0 is the program structure.</p>'
    + '</div>';
}

function renderCsfCoverageStripHtml(variant) {
  variant = variant || 'panel';
  var cov = computeCsfFunctionCoverage();
  var cards = cov.functions.map(function(row) {
    var meta = CSF_FUNCTIONS[row.fn] || { name: row.fn };
    var pct = row.pctImplemented || row.pctDesigned;
    var barPct = row.total ? row.pctImplemented : 0;
    var catIds = getCsfCategoriesForFunction(row.fn).map(function(c) { return c.id; }).join(' \u00b7 ');
    return '<div class="csf-fn-card csf-fn-' + row.fn.toLowerCase() + '">'
      + '<div class="csf-fn-card-head"><span class="csf-fn-code">' + row.fn + '</span>'
      + '<span class="csf-fn-name">' + escapeHTML(meta.name) + '</span></div>'
      + '<div class="csf-fn-pct">' + (row.total ? pct + '%' : '\u2014') + '</div>'
      + '<div class="csf-coverage-bar-wrap"><div class="csf-coverage-bar" style="width:' + barPct + '%;"></div></div>'
      + '<div class="csf-fn-sub">' + row.implemented + ' implemented \u00b7 ' + row.designed + ' designed \u00b7 ' + row.total + ' in scope</div>'
      + (catIds ? '<div class="csf-fn-sub">' + escapeHTML(catIds) + '</div>' : '')
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
