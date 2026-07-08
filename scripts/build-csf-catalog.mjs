#!/usr/bin/env node
/**
 * Generates js/csf-catalog.js and js/csf-subcategory-text.js from CSF 2.0 Core (NIST.CSWP.29).
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const FUNCTIONS = {
  GV: 'Govern',
  ID: 'Identify',
  PR: 'Protect',
  DE: 'Detect',
  RS: 'Respond',
  RC: 'Recover',
};

const CATEGORIES = [
  { id: 'GV.OC', fn: 'GV', name: 'Organizational Context' },
  { id: 'GV.RM', fn: 'GV', name: 'Risk Management Strategy' },
  { id: 'GV.RR', fn: 'GV', name: 'Roles, Responsibilities, and Authorities' },
  { id: 'GV.PO', fn: 'GV', name: 'Policy' },
  { id: 'GV.OV', fn: 'GV', name: 'Oversight' },
  { id: 'GV.SC', fn: 'GV', name: 'Cybersecurity Supply Chain Risk Management' },
  { id: 'ID.AM', fn: 'ID', name: 'Asset Management' },
  { id: 'ID.RA', fn: 'ID', name: 'Risk Assessment' },
  { id: 'ID.IM', fn: 'ID', name: 'Improvement' },
  { id: 'PR.AA', fn: 'PR', name: 'Identity Management, Authentication, and Access Control' },
  { id: 'PR.AT', fn: 'PR', name: 'Awareness and Training' },
  { id: 'PR.DS', fn: 'PR', name: 'Data Security' },
  { id: 'PR.PS', fn: 'PR', name: 'Platform Security' },
  { id: 'PR.IR', fn: 'PR', name: 'Technology Infrastructure Resilience' },
  { id: 'DE.CM', fn: 'DE', name: 'Continuous Monitoring' },
  { id: 'DE.AE', fn: 'DE', name: 'Adverse Event Analysis' },
  { id: 'RS.MA', fn: 'RS', name: 'Incident Management' },
  { id: 'RS.AN', fn: 'RS', name: 'Incident Analysis' },
  { id: 'RS.CO', fn: 'RS', name: 'Incident Response Reporting and Communication' },
  { id: 'RS.MI', fn: 'RS', name: 'Incident Mitigation' },
  { id: 'RC.RP', fn: 'RC', name: 'Incident Recovery Plan Execution' },
  { id: 'RC.CO', fn: 'RC', name: 'Incident Recovery Communication' },
];

/** [id, shortTitle, fullOutcomeText] — verbatim from NIST CSWP 29 Appendix A */
const SUB_RAW = [
  ['GV.OC-01', 'Mission informs risk management', 'The organizational mission is understood and informs cybersecurity risk management'],
  ['GV.OC-02', 'Stakeholder expectations', 'Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood and considered'],
  ['GV.OC-03', 'Legal and regulatory requirements', 'Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties obligations — are understood and managed'],
  ['GV.OC-04', 'Critical dependencies communicated', 'Critical objectives, capabilities, and services that external stakeholders depend on or expect from the organization are understood and communicated'],
  ['GV.OC-05', 'Organizational dependencies understood', 'Outcomes, capabilities, and services that the organization depends on are understood and communicated'],
  ['GV.RM-01', 'Risk management objectives', 'Risk management objectives are established and agreed to by organizational stakeholders'],
  ['GV.RM-02', 'Risk appetite and tolerance', 'Risk appetite and risk tolerance statements are established, communicated, and maintained'],
  ['GV.RM-03', 'Enterprise risk integration', 'Cybersecurity risk management activities and outcomes are included in enterprise risk management processes'],
  ['GV.RM-04', 'Risk response options', 'Strategic direction that describes appropriate risk response options is established and communicated'],
  ['GV.RM-05', 'Risk communication lines', 'Lines of communication across the organization are established for cybersecurity risks, including risks from suppliers and other third parties'],
  ['GV.RM-06', 'Standardized risk method', 'A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated'],
  ['GV.RM-07', 'Positive risks characterized', 'Strategic opportunities (i.e., positive risks) are characterized and are included in organizational cybersecurity risk discussions'],
  ['GV.RR-01', 'Leadership accountability', 'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving'],
  ['GV.RR-02', 'Roles and authorities established', 'Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced'],
  ['GV.RR-03', 'Adequate resources', 'Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies'],
  ['GV.RR-04', 'Cybersecurity in HR practices', 'Cybersecurity is included in human resources practices'],
  ['GV.PO-01', 'Cybersecurity policy established', 'Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced'],
  ['GV.PO-02', 'Policy reviewed and updated', 'Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission'],
  ['GV.OV-01', 'Strategy outcomes reviewed', 'Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction'],
  ['GV.OV-02', 'Strategy coverage reviewed', 'The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks'],
  ['GV.OV-03', 'Performance evaluated', 'Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed'],
  ['GV.SC-01', 'Supply chain program established', 'A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders'],
  ['GV.SC-02', 'Supplier roles coordinated', 'Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally'],
  ['GV.SC-03', 'Supply chain risk integrated', 'Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes'],
  ['GV.SC-04', 'Suppliers prioritized', 'Suppliers are known and prioritized by criticality'],
  ['GV.SC-05', 'Supply chain requirements in contracts', 'Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other types of agreements with suppliers and other relevant third parties'],
  ['GV.SC-06', 'Due diligence before relationships', 'Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships'],
  ['GV.SC-07', 'Supplier risks managed', 'The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship'],
  ['GV.SC-08', 'Suppliers in incident planning', 'Relevant suppliers and other third parties are included in incident planning, response, and recovery activities'],
  ['GV.SC-09', 'Supply chain practices monitored', 'Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology product and service life cycle'],
  ['GV.SC-10', 'Post-agreement provisions', 'Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement'],
  ['ID.AM-01', 'Hardware inventories', 'Inventories of hardware managed by the organization are maintained'],
  ['ID.AM-02', 'Software inventories', 'Inventories of software, services, and systems managed by the organization are maintained'],
  ['ID.AM-03', 'Network data flows', 'Representations of the organization\'s authorized network communication and internal and external network data flows are maintained'],
  ['ID.AM-04', 'Supplier service inventories', 'Inventories of services provided by suppliers are maintained'],
  ['ID.AM-05', 'Asset prioritization', 'Assets are prioritized based on classification, criticality, resources, and impact on the mission'],
  ['ID.AM-07', 'Data inventories', 'Inventories of data and corresponding metadata for designated data types are maintained'],
  ['ID.AM-08', 'Asset life cycles', 'Systems, hardware, software, services, and data are managed throughout their life cycles'],
  ['ID.RA-01', 'Vulnerabilities identified', 'Vulnerabilities in assets are identified, validated, and recorded'],
  ['ID.RA-02', 'Threat intelligence received', 'Cyber threat intelligence is received from information sharing forums and sources'],
  ['ID.RA-03', 'Threats identified', 'Internal and external threats to the organization are identified and recorded'],
  ['ID.RA-04', 'Impacts and likelihoods', 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded'],
  ['ID.RA-05', 'Inherent risk understood', 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization'],
  ['ID.RA-06', 'Risk responses planned', 'Risk responses are chosen, prioritized, planned, tracked, and communicated'],
  ['ID.RA-07', 'Changes and exceptions managed', 'Changes and exceptions are managed, assessed for risk impact, recorded, and tracked'],
  ['ID.RA-08', 'Vulnerability disclosure processes', 'Processes for receiving, analyzing, and responding to vulnerability disclosures are established'],
  ['ID.RA-09', 'Hardware and software integrity', 'The authenticity and integrity of hardware and software are assessed prior to acquisition and use'],
  ['ID.RA-10', 'Critical supplier assessment', 'Critical suppliers are assessed prior to acquisition'],
  ['ID.IM-01', 'Improvements from evaluations', 'Improvements are identified from evaluations'],
  ['ID.IM-02', 'Improvements from tests', 'Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties'],
  ['ID.IM-03', 'Improvements from operations', 'Improvements are identified from execution of operational processes, procedures, and activities'],
  ['ID.IM-04', 'Plans maintained and improved', 'Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved'],
  ['PR.AA-01', 'Identities managed', 'Identities and credentials for authorized users, services, and hardware are managed by the organization'],
  ['PR.AA-02', 'Identities proofed', 'Identities are proofed and bound to credentials based on the context of interactions'],
  ['PR.AA-03', 'Authentication', 'Users, services, and hardware are authenticated'],
  ['PR.AA-04', 'Identity assertions protected', 'Identity assertions are protected, conveyed, and verified'],
  ['PR.AA-05', 'Access permissions managed', 'Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties'],
  ['PR.AA-06', 'Physical access managed', 'Physical access to assets is managed, monitored, and enforced commensurate with risk'],
  ['PR.AT-01', 'General awareness and training', 'Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind'],
  ['PR.AT-02', 'Specialized role training', 'Individuals in specialized roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind'],
  ['PR.DS-01', 'Data-at-rest protected', 'The confidentiality, integrity, and availability of data-at-rest are protected'],
  ['PR.DS-02', 'Data-in-transit protected', 'The confidentiality, integrity, and availability of data-in-transit are protected'],
  ['PR.DS-10', 'Data-in-use protected', 'The confidentiality, integrity, and availability of data-in-use are protected'],
  ['PR.DS-11', 'Backups protected and tested', 'Backups of data are created, protected, maintained, and tested'],
  ['PR.PS-01', 'Configuration management', 'Configuration management practices are established and applied'],
  ['PR.PS-02', 'Software maintained', 'Software is maintained, replaced, and removed commensurate with risk'],
  ['PR.PS-03', 'Hardware maintained', 'Hardware is maintained, replaced, and removed commensurate with risk'],
  ['PR.PS-04', 'Logs for monitoring', 'Log records are generated and made available for continuous monitoring'],
  ['PR.PS-05', 'Unauthorized software prevented', 'Installation and execution of unauthorized software are prevented'],
  ['PR.PS-06', 'Secure software development', 'Secure software development practices are integrated, and their performance is monitored throughout the software development life cycle'],
  ['PR.IR-01', 'Networks protected', 'Networks and environments are protected from unauthorized logical access and usage'],
  ['PR.IR-02', 'Environmental threats', 'The organization\'s technology assets are protected from environmental threats'],
  ['PR.IR-03', 'Resilience mechanisms', 'Mechanisms are implemented to achieve resilience requirements in normal and adverse situations'],
  ['PR.IR-04', 'Resource capacity', 'Adequate resource capacity to ensure availability is maintained'],
  ['DE.CM-01', 'Network monitoring', 'Networks and network services are monitored to find potentially adverse events'],
  ['DE.CM-02', 'Physical environment monitoring', 'The physical environment is monitored to find potentially adverse events'],
  ['DE.CM-03', 'Personnel and usage monitoring', 'Personnel activity and technology usage are monitored to find potentially adverse events'],
  ['DE.CM-06', 'Supplier activity monitoring', 'External service provider activities and services are monitored to find potentially adverse events'],
  ['DE.CM-09', 'Computing environment monitoring', 'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events'],
  ['DE.AE-02', 'Adverse events analyzed', 'Potentially adverse events are analyzed to better understand associated activities'],
  ['DE.AE-03', 'Information correlated', 'Information is correlated from multiple sources'],
  ['DE.AE-04', 'Impact and scope understood', 'The estimated impact and scope of adverse events are understood'],
  ['DE.AE-06', 'Information provided to staff', 'Information on adverse events is provided to authorized staff and tools'],
  ['DE.AE-07', 'Threat intelligence integrated', 'Cyber threat intelligence and other contextual information are integrated into the analysis'],
  ['DE.AE-08', 'Incidents declared', 'Incidents are declared when adverse events meet the defined incident criteria'],
  ['RS.MA-01', 'Response plan executed', 'The incident response plan is executed in coordination with relevant third parties once an incident is declared'],
  ['RS.MA-02', 'Reports triaged', 'Incident reports are triaged and validated'],
  ['RS.MA-03', 'Incidents categorized', 'Incidents are categorized and prioritized'],
  ['RS.MA-04', 'Incidents escalated', 'Incidents are escalated or elevated as needed'],
  ['RS.MA-05', 'Recovery criteria applied', 'The criteria for initiating incident recovery are applied'],
  ['RS.AN-03', 'Root cause analysis', 'Analysis is performed to establish what has taken place during an incident and the root cause of the incident'],
  ['RS.AN-06', 'Investigation records preserved', 'Actions performed during an investigation are recorded, and the records\' integrity and provenance are preserved'],
  ['RS.AN-07', 'Incident data collected', 'Incident data and metadata are collected, and their integrity and provenance are preserved'],
  ['RS.AN-08', 'Incident magnitude estimated', 'An incident\'s magnitude is estimated and validated'],
  ['RS.CO-02', 'Stakeholders notified', 'Internal and external stakeholders are notified of incidents'],
  ['RS.CO-03', 'Information shared', 'Information is shared with designated internal and external stakeholders'],
  ['RS.MI-01', 'Incidents contained', 'Incidents are contained'],
  ['RS.MI-02', 'Incidents eradicated', 'Incidents are eradicated'],
  ['RC.RP-01', 'Recovery plan executed', 'The recovery portion of the incident response plan is executed once initiated from the incident response process'],
  ['RC.RP-02', 'Recovery actions performed', 'Recovery actions are selected, scoped, prioritized, and performed'],
  ['RC.RP-03', 'Backup integrity verified', 'The integrity of backups and other restoration assets is verified before using them for restoration'],
  ['RC.RP-04', 'Post-incident norms established', 'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms'],
  ['RC.RP-05', 'Assets restored and verified', 'The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed'],
  ['RC.RP-06', 'Recovery declared complete', 'The end of incident recovery is declared based on criteria, and incident-related documentation is completed'],
  ['RC.CO-03', 'Recovery progress communicated', 'Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders'],
  ['RC.CO-04', 'Public recovery updates', 'Public updates on incident recovery are shared using approved methods and messaging'],
];

const SUBCATEGORIES = SUB_RAW.map(([id, n, _text]) => {
  const cat = id.replace(/-\d+$/, '');
  const fn = cat.split('.')[0];
  return { id, cat, fn, n };
});

// Attach subCount to categories
for (const c of CATEGORIES) {
  c.subCount = SUBCATEGORIES.filter(s => s.cat === c.id).length;
}

const GV_CORE_SUBCATEGORIES = [
  'GV.PO-01', 'GV.PO-02', 'GV.RR-01', 'GV.RR-02', 'GV.RR-03',
  'GV.RM-01', 'GV.RM-02', 'GV.RM-06', 'GV.OC-01', 'GV.OV-01',
];

const CATEGORY_SUGGESTED_ROLES = {
  'GV.OC': 'Program Leadership', 'GV.RM': 'GRC Lead', 'GV.RR': 'Program Leadership',
  'GV.PO': 'GRC Lead', 'GV.OV': 'Program Leadership', 'GV.SC': 'Vendor Risk Lead',
  'ID.AM': 'IT Operations Lead', 'ID.RA': 'GRC Lead', 'ID.IM': 'GRC Lead',
  'PR.AA': 'IAM Lead', 'PR.AT': 'People Lead', 'PR.DS': 'Data Protection Lead',
  'PR.PS': 'Security Engineering Lead', 'PR.IR': 'Infrastructure Lead',
  'DE.CM': 'Security Operations Lead', 'DE.AE': 'Security Operations Lead',
  'RS.MA': 'Incident Response Lead', 'RS.AN': 'Incident Response Lead',
  'RS.CO': 'Communications Lead', 'RS.MI': 'Incident Response Lead',
  'RC.RP': 'Business Continuity Lead', 'RC.CO': 'Communications Lead',
};

const FUNCTION_SUGGESTED_ROLES = {
  GV: 'Program Leadership', ID: 'GRC Lead', PR: 'Security Engineering Lead',
  DE: 'Security Operations Lead', RS: 'Incident Response Lead', RC: 'Business Continuity Lead',
};

const FUNCTION_DESC = {
  GV: 'Cybersecurity risk management strategy, expectations, and policy are established, communicated, and monitored.',
  ID: 'The organization\'s current cybersecurity risks are understood through asset and risk assessment.',
  PR: 'Safeguards to manage the organization\'s cybersecurity risks are used.',
  DE: 'Possible cybersecurity attacks and compromises are found and analyzed.',
  RS: 'Actions regarding a detected cybersecurity incident are taken.',
  RC: 'Assets and operations affected by a cybersecurity incident are restored.',
};

const CATEGORY_DESC = Object.fromEntries(CATEGORIES.map(c => [c.id, c.name]));

const COMMON_CATEGORY_MERGES = [
  { slaves: ['PR.AT'], master: 'PR.AA', label: 'People & Access (PR.AA+PR.AT)' },
  { slaves: ['DE.AE'], master: 'DE.CM', label: 'Detection Operations (DE.CM+DE.AE)' },
  { slaves: ['RS.MI', 'RS.CO'], master: 'RS.MA', label: 'Incident Response (RS.MA+RS.AN+RS.CO+RS.MI)' },
  { slaves: ['RS.AN', 'RS.CO', 'RS.MI'], master: 'RS.MA', label: 'Incident Response (RS.MA bundle)' },
  { slaves: ['RC.CO'], master: 'RC.RP', label: 'Recovery (RC.RP+RC.CO)' },
  { slaves: ['GV.OV'], master: 'GV.RM', label: 'Governance & Oversight (GV.RM+GV.OV)' },
  { slaves: ['ID.IM'], master: 'ID.RA', label: 'Risk & Improvement (ID.RA+ID.IM)' },
];

const catalogJs = `// js/csf-catalog.js — NIST CSF 2.0 Core catalog (generated by scripts/build-csf-catalog.mjs)
// Source: NIST.CSWP.29 Appendix A. Do not edit by hand — regenerate via npm run build:csf-catalog

const FUNCTIONS = ${JSON.stringify(FUNCTIONS, null, 2)};

const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

const SUBCATEGORIES = ${JSON.stringify(SUBCATEGORIES, null, 2)};

const GV_CORE_SUBCATEGORIES = ${JSON.stringify(GV_CORE_SUBCATEGORIES, null, 2)};

const CATEGORY_SUGGESTED_ROLES = ${JSON.stringify(CATEGORY_SUGGESTED_ROLES, null, 2)};

const FUNCTION_SUGGESTED_ROLES = ${JSON.stringify(FUNCTION_SUGGESTED_ROLES, null, 2)};

const FUNCTION_DESC = ${JSON.stringify(FUNCTION_DESC, null, 2)};

const CATEGORY_DESC = ${JSON.stringify(CATEGORY_DESC, null, 2)};

/** Preset category merges for CISO consolidate step (category policy mode only). */
const COMMON_CATEGORY_MERGES = ${JSON.stringify(COMMON_CATEGORY_MERGES, null, 2)};

/** Legacy aliases — map old 800-53 helper names to CSF catalog during migration. */
const FAMILIES = FUNCTIONS;
const CONTROLS = SUBCATEGORIES.map(function(s) {
  return { id: s.id, f: s.fn, cat: s.cat, n: s.n };
});

const DOMAIN_SUGGESTED_ROLES = CATEGORY_SUGGESTED_ROLES;

function getCategoryById(catId) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].id === catId) return CATEGORIES[i];
  }
  return null;
}

function getSubcategoryById(subId) {
  for (var i = 0; i < SUBCATEGORIES.length; i++) {
    if (SUBCATEGORIES[i].id === subId) return SUBCATEGORIES[i];
  }
  return null;
}

function getCategoriesForFunction(fn) {
  return CATEGORIES.filter(function(c) { return c.fn === fn; });
}

function getSubcategoriesForCategory(catId) {
  return SUBCATEGORIES.filter(function(s) { return s.cat === catId; });
}

function getDefaultSelectedCategories() {
  var out = {};
  CATEGORIES.forEach(function(c) { out[c.id] = true; });
  return out;
}

function getDefaultGvSubcategories() {
  var out = {};
  GV_CORE_SUBCATEGORIES.forEach(function(id) { out[id] = true; });
  SUBCATEGORIES.filter(function(s) { return s.fn === 'GV'; }).forEach(function(s) {
    out[s.id] = true;
  });
  return out;
}
`;

const textMap = Object.fromEntries(SUB_RAW.map(([id, , text]) => [id, text]));
const textJs = `// js/csf-subcategory-text.js — verbatim CSF 2.0 outcome statements (NIST.CSWP.29)
// Generated by scripts/build-csf-catalog.mjs — do not edit by hand

const CSF_SUBCATEGORY_TEXT = ${JSON.stringify(textMap, null, 2)};

/** Legacy alias */
const NIST_CONTROL_TEXT = CSF_SUBCATEGORY_TEXT;
`;

writeFileSync(join(root, 'js', 'csf-catalog.js'), catalogJs);
writeFileSync(join(root, 'js', 'csf-subcategory-text.js'), textJs);

console.log('Generated csf-catalog.js: ' + CATEGORIES.length + ' categories, ' + SUBCATEGORIES.length + ' subcategories');
console.log('Generated csf-subcategory-text.js: ' + Object.keys(textMap).length + ' outcome texts');
