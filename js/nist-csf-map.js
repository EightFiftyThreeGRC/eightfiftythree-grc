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

// Product 1-1 rule (not official CSF informative refs): each 800-53 control maps
// to exactly one CSF 2.0 subcategory. Official OLIR / CSWP 29 rows often list
// several; this program keeps a single primary so Unmapped vs tagged stays honest.
//   1. XX-1 Policy and Procedures (including PM-1, PT-1, SR-1) \u2192 GV.PO-01.
//      GV.PO-02 (review / update) lives in ISP requirement / review-cycle text,
//      not a second tag on the same control.
//   2. Else the first subcategory token already in the map (historically treated
//      as primary). For PM / ISP-tier controls, prefer the first Govern (GV.*) token.
//   3. Category-only official rows stay category-level (no invented subcategory).
//   4. As of 2026-08-27 every base control in the catalog carries a primary tag
//      (enhancements inherit the parent). Where the official informative
//      references are category-only or ambiguous, the tag stays category-level.
// Tokens: "PR.AA" or "PR.AA:PR.AA-01". Enhancements inherit the parent.
var NIST_CSF_PO_TOKEN = 'GV.PO:GV.PO-01';
var NIST_CSF_MAP = {
  'AC-1': NIST_CSF_PO_TOKEN, 'AC-2': 'PR.AA:PR.AA-01', 'AC-3': 'PR.AA:PR.AA-05',
  'AC-5': 'PR.AA:PR.AA-05', 'AC-6': 'PR.AA:PR.AA-05', 'AC-7': 'PR.AA:PR.AA-03',
  'AC-17': 'PR.AA:PR.AA-05', 'AC-18': 'PR.IR',
  'AT-1': NIST_CSF_PO_TOKEN, 'AT-2': 'PR.AT:PR.AT-01', 'AT-3': 'PR.AT:PR.AT-02',
  'AU-1': NIST_CSF_PO_TOKEN, 'AU-2': 'DE.CM:DE.CM-03', 'AU-6': 'DE.AE:DE.AE-02',
  'AU-12': 'PR.PS:PR.PS-04',
  'CA-1': NIST_CSF_PO_TOKEN, 'CA-2': 'ID.IM', 'CA-3': 'ID.AM', 'CA-5': 'ID.RA:ID.RA-06',
  'CA-6': 'GV.OV', 'CA-7': 'DE.CM:DE.CM-01', 'CA-8': 'ID.IM:ID.IM-02',
  'CM-1': NIST_CSF_PO_TOKEN, 'CM-2': 'PR.PS:PR.PS-01', 'CM-6': 'PR.PS:PR.PS-01',
  'CM-7': 'PR.PS:PR.PS-05', 'CM-8': 'ID.AM:ID.AM-01',
  'CP-1': NIST_CSF_PO_TOKEN, 'CP-2': 'ID.IM:ID.IM-04', 'CP-9': 'PR.DS:PR.DS-11',
  'CP-10': 'RC.RP:RC.RP-01',
  'IA-1': NIST_CSF_PO_TOKEN, 'IA-2': 'PR.AA:PR.AA-03', 'IA-4': 'PR.AA:PR.AA-01',
  'IA-5': 'PR.AA:PR.AA-01', 'IA-8': 'PR.AA:PR.AA-03', 'IA-12': 'PR.AA:PR.AA-02',
  'IR-1': NIST_CSF_PO_TOKEN, 'IR-4': 'RS.MA:RS.MA-01', 'IR-6': 'RS.CO:RS.CO-02',
  'IR-8': 'ID.IM:ID.IM-04',
  'MA-1': NIST_CSF_PO_TOKEN,
  'MP-1': NIST_CSF_PO_TOKEN,
  'PE-1': NIST_CSF_PO_TOKEN, 'PE-3': 'PR.AA:PR.AA-06', 'PE-6': 'DE.CM:DE.CM-02',
  'PL-1': NIST_CSF_PO_TOKEN, 'PL-2': 'ID.IM:ID.IM-04',
  'PM-1': NIST_CSF_PO_TOKEN, 'PM-2': 'GV.RR:GV.RR-01',
  'PM-5': 'ID.AM:ID.AM-02',
  'PM-6': 'GV.OV:GV.OV-01',
  'PM-9': 'GV.RM:GV.RM-01',
  'PM-11': 'GV.OC:GV.OC-01',
  'PM-30': 'GV.SC:GV.SC-01',
  'PM-30(1)': 'GV.SC:GV.SC-04',
  'PS-1': NIST_CSF_PO_TOKEN,
  'PT-1': NIST_CSF_PO_TOKEN,
  'RA-1': NIST_CSF_PO_TOKEN, 'RA-3': 'ID.RA:ID.RA-05', 'RA-5': 'ID.RA:ID.RA-01',
  'SA-1': NIST_CSF_PO_TOKEN, 'SA-3': 'PR.PS:PR.PS-06',
  'SC-1': NIST_CSF_PO_TOKEN, 'SC-7': 'PR.IR:PR.IR-01', 'SC-8': 'PR.DS:PR.DS-02', 'SC-28': 'PR.DS:PR.DS-01',
  'SI-1': NIST_CSF_PO_TOKEN, 'SI-2': 'PR.PS:PR.PS-02', 'SI-4': 'DE.CM:DE.CM-09',
  'SR-1': NIST_CSF_PO_TOKEN,
  // --- 2026-08-27 expansion: full catalog coverage (one primary per base control).
  // Primaries follow the CSF 2.0 informative-reference lineage (CSWP 29 / OLIR,
  // CSF 1.1 category migration); judgment calls stay category-level.
  'AC-4': 'PR.IR:PR.IR-01', 'AC-8': 'PR.AA', 'AC-9': 'DE.CM:DE.CM-03',
  'AC-10': 'PR.AA:PR.AA-05', 'AC-11': 'PR.AA:PR.AA-05', 'AC-12': 'PR.AA:PR.AA-05',
  'AC-14': 'PR.AA:PR.AA-03', 'AC-16': 'ID.AM:ID.AM-07', 'AC-19': 'PR.AA:PR.AA-05',
  'AC-20': 'PR.AA:PR.AA-05', 'AC-21': 'PR.AA:PR.AA-05', 'AC-22': 'PR.DS:PR.DS-01',
  'AC-23': 'PR.DS:PR.DS-01', 'AC-24': 'PR.AA:PR.AA-05', 'AC-25': 'PR.AA:PR.AA-05',
  'AT-4': 'PR.AT:PR.AT-01', 'AT-6': 'PR.AT:PR.AT-01',
  'AU-3': 'PR.PS:PR.PS-04', 'AU-4': 'PR.PS:PR.PS-04', 'AU-5': 'PR.PS:PR.PS-04',
  'AU-7': 'DE.AE:DE.AE-02', 'AU-8': 'PR.PS:PR.PS-04', 'AU-9': 'PR.PS:PR.PS-04',
  'AU-10': 'PR.AA:PR.AA-04', 'AU-11': 'PR.PS:PR.PS-04', 'AU-13': 'DE.CM',
  'AU-14': 'PR.PS:PR.PS-04', 'AU-16': 'PR.PS:PR.PS-04',
  'CA-9': 'ID.AM:ID.AM-03',
  'CM-3': 'ID.RA:ID.RA-07', 'CM-4': 'ID.RA:ID.RA-07', 'CM-5': 'PR.AA:PR.AA-05',
  'CM-9': 'PR.PS:PR.PS-01', 'CM-10': 'GV.OC:GV.OC-03', 'CM-11': 'PR.PS:PR.PS-05',
  'CM-12': 'ID.AM:ID.AM-07', 'CM-13': 'ID.AM:ID.AM-03', 'CM-14': 'ID.RA:ID.RA-09',
  'CP-3': 'PR.AT:PR.AT-02', 'CP-4': 'ID.IM:ID.IM-02', 'CP-6': 'PR.IR:PR.IR-03',
  'CP-7': 'PR.IR:PR.IR-03', 'CP-8': 'PR.IR:PR.IR-03', 'CP-11': 'PR.IR:PR.IR-03',
  'CP-12': 'PR.IR:PR.IR-03', 'CP-13': 'PR.IR:PR.IR-03',
  'IA-3': 'PR.AA:PR.AA-03', 'IA-6': 'PR.AA:PR.AA-03', 'IA-7': 'PR.AA:PR.AA-03',
  'IA-9': 'PR.AA:PR.AA-03', 'IA-10': 'PR.AA:PR.AA-03', 'IA-11': 'PR.AA:PR.AA-03',
  'IR-2': 'PR.AT:PR.AT-02', 'IR-3': 'ID.IM:ID.IM-02', 'IR-5': 'RS.AN:RS.AN-07',
  'IR-7': 'RS.MA:RS.MA-01', 'IR-9': 'RS.MI:RS.MI-01',
  'MA-2': 'PR.PS:PR.PS-03', 'MA-3': 'PR.PS:PR.PS-03', 'MA-4': 'PR.AA:PR.AA-05',
  'MA-5': 'PR.AA:PR.AA-05', 'MA-6': 'PR.PS:PR.PS-03', 'MA-7': 'PR.PS:PR.PS-03',
  'MP-2': 'PR.DS:PR.DS-01', 'MP-3': 'PR.DS:PR.DS-01', 'MP-4': 'PR.DS:PR.DS-01',
  'MP-5': 'PR.DS:PR.DS-01', 'MP-6': 'ID.AM:ID.AM-08', 'MP-7': 'PR.DS:PR.DS-01',
  'MP-8': 'ID.AM:ID.AM-08',
  'PE-2': 'PR.AA:PR.AA-06', 'PE-4': 'PR.AA:PR.AA-06', 'PE-5': 'PR.AA:PR.AA-06',
  'PE-8': 'PR.AA:PR.AA-06', 'PE-9': 'PR.IR:PR.IR-02', 'PE-10': 'PR.IR:PR.IR-02',
  'PE-11': 'PR.IR:PR.IR-02', 'PE-12': 'PR.IR:PR.IR-02', 'PE-13': 'PR.IR:PR.IR-02',
  'PE-14': 'PR.IR:PR.IR-02', 'PE-15': 'PR.IR:PR.IR-02', 'PE-16': 'ID.AM:ID.AM-08',
  'PE-17': 'PR.AA:PR.AA-06', 'PE-18': 'PR.IR:PR.IR-02', 'PE-19': 'PR.DS:PR.DS-02',
  'PE-20': 'DE.CM:DE.CM-02', 'PE-21': 'PR.IR:PR.IR-02', 'PE-22': 'ID.AM:ID.AM-05',
  'PE-23': 'PR.IR:PR.IR-02',
  'PL-4': 'GV.RR:GV.RR-02', 'PL-7': 'GV.PO:GV.PO-01', 'PL-8': 'PR.PS:PR.PS-06',
  'PL-9': 'GV.PO:GV.PO-01', 'PL-10': 'GV.PO:GV.PO-01', 'PL-11': 'GV.PO:GV.PO-01',
  'PM-3': 'GV.RR:GV.RR-03', 'PM-4': 'ID.IM:ID.IM-01', 'PM-7': 'GV.OC:GV.OC-01',
  'PM-8': 'GV.OC:GV.OC-04', 'PM-10': 'GV.OV', 'PM-12': 'DE.CM:DE.CM-03',
  'PM-13': 'PR.AT:PR.AT-02', 'PM-14': 'ID.IM:ID.IM-02', 'PM-15': 'ID.RA:ID.RA-02',
  'PM-16': 'ID.RA:ID.RA-03', 'PM-17': 'GV.SC:GV.SC-05', 'PM-18': 'GV.PO:GV.PO-01',
  'PM-19': 'GV.RR:GV.RR-02', 'PM-20': 'GV.OC:GV.OC-03', 'PM-21': 'GV.OC:GV.OC-03',
  'PM-22': 'GV.OC:GV.OC-03', 'PM-23': 'GV.RR:GV.RR-02', 'PM-24': 'GV.RR:GV.RR-02',
  'PM-25': 'GV.OC:GV.OC-03', 'PM-26': 'GV.OC:GV.OC-02', 'PM-27': 'GV.OC:GV.OC-03',
  'PM-28': 'GV.RM:GV.RM-02', 'PM-29': 'GV.RR:GV.RR-02', 'PM-31': 'DE.CM',
  'PM-32': 'GV.OC:GV.OC-01',
  'PS-2': 'GV.RR:GV.RR-04', 'PS-3': 'GV.RR:GV.RR-04', 'PS-4': 'GV.RR:GV.RR-04',
  'PS-5': 'GV.RR:GV.RR-04', 'PS-6': 'GV.RR:GV.RR-04', 'PS-7': 'GV.SC:GV.SC-02',
  'PS-8': 'GV.RR:GV.RR-04', 'PS-9': 'GV.RR:GV.RR-02',
  'PT-2': 'GV.OC:GV.OC-03', 'PT-3': 'GV.OC:GV.OC-03', 'PT-4': 'GV.OC:GV.OC-03',
  'PT-5': 'GV.OC:GV.OC-03', 'PT-6': 'GV.OC:GV.OC-03', 'PT-7': 'GV.OC:GV.OC-03',
  'PT-8': 'GV.OC:GV.OC-03',
  'RA-2': 'ID.AM:ID.AM-05', 'RA-6': 'DE.CM:DE.CM-02', 'RA-7': 'ID.RA:ID.RA-06',
  'RA-8': 'ID.RA:ID.RA-04', 'RA-9': 'ID.AM:ID.AM-05', 'RA-10': 'DE.AE:DE.AE-02',
  'SA-2': 'GV.RR:GV.RR-03', 'SA-4': 'GV.SC:GV.SC-05', 'SA-5': 'ID.AM:ID.AM-08',
  'SA-8': 'PR.PS:PR.PS-06', 'SA-9': 'ID.AM:ID.AM-04', 'SA-10': 'PR.PS:PR.PS-06',
  'SA-11': 'PR.PS:PR.PS-06', 'SA-15': 'PR.PS:PR.PS-06', 'SA-16': 'PR.AT:PR.AT-02',
  'SA-17': 'PR.PS:PR.PS-06', 'SA-20': 'PR.PS:PR.PS-06', 'SA-21': 'GV.SC:GV.SC-06',
  'SA-22': 'PR.PS:PR.PS-02', 'SA-23': 'PR.PS:PR.PS-06',
  'SC-2': 'PR.PS:PR.PS-01', 'SC-3': 'PR.PS:PR.PS-01', 'SC-4': 'PR.DS:PR.DS-10',
  'SC-5': 'PR.IR:PR.IR-04', 'SC-6': 'PR.IR:PR.IR-04', 'SC-10': 'PR.IR:PR.IR-01',
  'SC-11': 'PR.AA:PR.AA-03', 'SC-12': 'PR.AA:PR.AA-01', 'SC-13': 'PR.DS',
  'SC-15': 'PR.PS:PR.PS-01', 'SC-16': 'PR.DS:PR.DS-02', 'SC-17': 'PR.AA:PR.AA-01',
  'SC-18': 'PR.PS:PR.PS-05', 'SC-20': 'PR.IR:PR.IR-01', 'SC-21': 'PR.IR:PR.IR-01',
  'SC-22': 'PR.IR:PR.IR-01', 'SC-23': 'PR.DS:PR.DS-02', 'SC-24': 'PR.IR:PR.IR-03',
  'SC-25': 'PR.PS:PR.PS-01', 'SC-26': 'DE.CM:DE.CM-01', 'SC-27': 'PR.PS:PR.PS-01',
  'SC-29': 'PR.IR:PR.IR-03', 'SC-30': 'PR.IR:PR.IR-03', 'SC-31': 'ID.RA:ID.RA-01',
  'SC-32': 'PR.IR:PR.IR-01', 'SC-34': 'PR.PS:PR.PS-01', 'SC-35': 'DE.CM:DE.CM-01',
  'SC-36': 'PR.IR:PR.IR-03', 'SC-37': 'PR.DS:PR.DS-02', 'SC-38': 'ID.RA:ID.RA-03',
  'SC-39': 'PR.PS:PR.PS-01', 'SC-40': 'PR.IR:PR.IR-01', 'SC-41': 'PR.PS:PR.PS-01',
  'SC-42': 'PR.PS:PR.PS-01', 'SC-43': 'PR.PS:PR.PS-01', 'SC-44': 'DE.AE:DE.AE-02',
  'SC-45': 'PR.PS:PR.PS-04', 'SC-46': 'PR.IR:PR.IR-01', 'SC-47': 'PR.IR:PR.IR-03',
  'SC-48': 'DE.CM:DE.CM-01', 'SC-49': 'PR.PS:PR.PS-01', 'SC-50': 'PR.PS:PR.PS-01',
  'SC-51': 'PR.PS:PR.PS-01',
  'SI-3': 'DE.CM:DE.CM-09', 'SI-5': 'ID.RA:ID.RA-02', 'SI-6': 'DE.CM:DE.CM-09',
  'SI-7': 'DE.CM:DE.CM-09', 'SI-8': 'DE.CM:DE.CM-09', 'SI-10': 'PR.PS:PR.PS-06',
  'SI-11': 'PR.PS:PR.PS-06', 'SI-12': 'ID.AM:ID.AM-08', 'SI-13': 'PR.IR:PR.IR-03',
  'SI-14': 'PR.IR:PR.IR-03', 'SI-15': 'PR.PS:PR.PS-06', 'SI-16': 'PR.PS:PR.PS-01',
  'SI-17': 'PR.IR:PR.IR-03', 'SI-18': 'GV.OC:GV.OC-03', 'SI-19': 'PR.DS:PR.DS-01',
  'SI-20': 'DE.CM:DE.CM-01', 'SI-21': 'ID.AM:ID.AM-08', 'SI-22': 'PR.IR:PR.IR-03',
  'SI-23': 'PR.DS:PR.DS-01',
  // Enhancement-level tags. An enhancement normally inherits its parent's primary;
  // these override that so CSF outcomes the parent cannot express on its own become
  // reachable. The one-primary-per-BASE-control rule is untouched. Almost all sit in
  // the same CSF category as their parent -- this is added granularity, not a new
  // cross-Function claim. Most are Moderate/High controls, so they reach a program's
  // profile through baseline elevation rather than the Low common-control floor.
  // Respond -- IR-4 is RS.MA-01, IR-5 is RS.AN-07, IR-6 is RS.CO-02, IR-9 is RS.MI-01.
  'IR-4(1)': 'RS.MA:RS.MA-02',   // Automated Incident Handling -> triage and validation
  'IR-4(3)': 'RS.MA:RS.MA-05',   // Continuity of Operations -> recovery-initiation criteria
  'IR-4(4)': 'RS.MA:RS.MA-03',   // Information Correlation -> categorize and prioritize
  'IR-4(11)': 'RS.MA:RS.MA-04',  // Integrated IR Team -> escalation and elevation
  'IR-4(12)': 'RS.AN:RS.AN-03',  // Forensic Analysis -> what happened and root cause
  'IR-5(1)': 'RS.AN:RS.AN-06',   // Automated Tracking -> investigation record integrity
  'IR-6(3)': 'RS.CO:RS.CO-03',   // Supply Chain Coordination -> sharing with stakeholders
  'IR-9(3)': 'RS.MI:RS.MI-02',   // Post-spill Operations -> eradication
  // Recover -- CP-10 is RC.RP-01; CP-2 and CP-9 sit elsewhere, but their recovery
  // enhancements are genuinely Recover outcomes.
  'CP-2(3)': 'RC.RP:RC.RP-04',   // Resume Mission Functions -> post-incident norms
  'CP-9(1)': 'RC.RP:RC.RP-03',   // Backup Testing -> restoration-asset integrity verified
  'CP-10(2)': 'RC.RP:RC.RP-05',  // Transaction Recovery -> restored-asset integrity
  'CP-10(4)': 'RC.RP:RC.RP-02',  // Restore Within Time Period -> recovery actions performed
  // Detect -- AU-6 is DE.AE-02, SI-4 is DE.CM-09, PM-16 is ID.RA-03.
  'AU-6(3)': 'DE.AE:DE.AE-03',   // Correlate Audit Repositories -> multi-source correlation
  'SI-4(5)': 'DE.AE:DE.AE-06',   // System-generated Alerts -> event info to authorized staff
  'PM-16(1)': 'DE.AE:DE.AE-07',  // Automated Threat-intel Sharing -> CTI in analysis
  // Identify -- RA-5 is ID.RA-01, SR-6 is GV.SC-07.
  'RA-5(11)': 'ID.RA:ID.RA-08',  // Public Disclosure Program -> vulnerability disclosure
  'SR-6(1)': 'ID.RA:ID.RA-10',   // Supplier Testing/Analysis -> pre-acquisition assessment
  // (base-control entries resume)
  'SR-2': 'GV.SC:GV.SC-01', 'SR-3': 'GV.SC:GV.SC-03', 'SR-4': 'ID.RA:ID.RA-09',
  'SR-5': 'GV.SC:GV.SC-05', 'SR-6': 'GV.SC:GV.SC-07', 'SR-7': 'GV.SC:GV.SC-09',
  'SR-8': 'GV.SC:GV.SC-08', 'SR-9': 'ID.RA:ID.RA-09', 'SR-10': 'ID.RA:ID.RA-09',
  'SR-11': 'ID.RA:ID.RA-09', 'SR-12': 'ID.AM:ID.AM-08',
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
  var maps = getCsfExplicitMappingsForControl(ctrlId);
  if (maps.length) return maps[0];
  maps = getCsfMappingsForControl(ctrlId);
  return maps.length ? maps[0] : null;
}

/** Explicit-map subcategory only \u2014 empty string if Unmapped or category-level. */
function getCsfPrimarySubcategory(ctrlId) {
  var maps = getCsfExplicitMappingsForControl(ctrlId);
  if (!maps.length) return '';
  return maps[0].sub || '';
}

function getCsfPrimaryGroupKey(ctrlId) {
  var maps = getCsfExplicitMappingsForControl(ctrlId);
  if (!maps.length) return '';
  return maps[0].sub || maps[0].cat || '';
}

function getCsfCategoryIdFromSub(subOrCat) {
  var s = String(subOrCat || '').trim();
  if (!s) return '';
  if (CSF_CATEGORIES[s]) return s;
  var i = s.lastIndexOf('-');
  if (i < 0) return s;
  var cat = s.slice(0, i);
  return CSF_CATEGORIES[cat] ? cat : s;
}

function groupControlIdsByCsfSubcategory(ctrlIds) {
  var groups = {};
  var unmapped = [];
  (ctrlIds || []).forEach(function(id) {
    var key = getCsfPrimaryGroupKey(id);
    if (!key) {
      unmapped.push(id);
      return;
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(id);
  });
  var order = Object.keys(groups).sort();
  return { order: order, groups: groups, unmapped: unmapped };
}

/** Domain-policy grouping: explicit subcategory, else a selected (or first) subcategory in the mapped category. */
function getCsfPolicyReqKeyForControl(ctrlId, preferredSubs) {
  var m = getCsfPrimaryMapping(ctrlId);
  if (!m) return '';
  if (m.sub) return m.sub;
  var cat = m.cat || '';
  if (!cat) return '';
  var ids = getCsfSubcategoryIdsForCategory(cat);
  var i;
  if (preferredSubs) {
    for (i = 0; i < ids.length; i++) {
      if (preferredSubs[ids[i]]) return ids[i];
    }
  }
  return ids[0] || cat;
}

function groupControlIdsForDomainCsfReqs(ctrlIds, preferredSubs) {
  var groups = {};
  var unmapped = [];
  (ctrlIds || []).forEach(function(id) {
    var key = getCsfPolicyReqKeyForControl(id, preferredSubs);
    if (!key) {
      unmapped.push(id);
      return;
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(id);
  });
  return { order: Object.keys(groups).sort(), groups: groups, unmapped: unmapped };
}

/** Place a control on a category that belongs to this Function (not a cross-Function leak). */
function getCsfDomainReqCategoryForControl(ctrlId, fnId) {
  var m = getCsfPrimaryMapping(ctrlId);
  if (m && m.fn === fnId && m.cat) return m.cat;
  var fam = String(ctrlId || '').split('-')[0];
  var raw = NIST_CSF_FAMILY_DEFAULT[fam];
  var def = raw ? parseCsfMapToken(raw) : null;
  if (def && def.fn === fnId && def.cat) return def.cat;
  return '';
}

function findDomainReqForCsfCategory(requirements, catId) {
  var want = String(catId || '');
  if (!want) return null;
  var i;
  for (i = 0; i < (requirements || []).length; i++) {
    var req = requirements[i];
    if (!req) continue;
    if (req.purpose === ('csf-cat-' + want)) return req;
    var csf = req.csf || [];
    if (!csf.length) continue;
    var allThis = csf.every(function(id) { return getCsfCategoryIdFromSub(id) === want; });
    if (allThis) return req;
  }
  return null;
}

function groupCsfSubIdsByCategory(subIds) {
  var groups = {};
  (subIds || []).forEach(function(id) {
    var cat = getCsfCategoryIdFromSub(id);
    if (!cat) return;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(id);
  });
  var order = Object.keys(groups).sort();
  order.forEach(function(cat) {
    groups[cat].sort();
  });
  return { order: order, groups: groups };
}

function getCsfSubcategoryDisplayName(subOrCat) {
  var id = String(subOrCat || '');
  if (!id) return '';
  if (typeof CSF_SUBCATEGORIES !== 'undefined' && CSF_SUBCATEGORIES[id]) return CSF_SUBCATEGORIES[id];
  return getCsfCategoryLabel(id) || '';
}

function renderCsfSubcategoryHeadingHtml(subOrCat, opts) {
  if (typeof escapeHTML !== 'function') return '';
  var id = String(subOrCat || '');
  if (!id) return '';
  opts = opts || {};
  var fn = id.split('.')[0] || '';
  var includeName = opts.includeName !== false;
  var name = includeName ? getCsfSubcategoryDisplayName(id) : '';
  return '<div class="csf-nest-head">'
    + '<span class="csf-tag csf-fn-' + escapeHTML(fn.toLowerCase()) + '">' + escapeHTML(id) + '</span>'
    + (name ? '<span class="csf-nest-head-name">' + escapeHTML(name) + '</span>' : '')
    + '</div>';
}

function renderCsfSubcategoryNameHtml(subOrCat) {
  if (typeof escapeHTML !== 'function') return '';
  var name = getCsfSubcategoryDisplayName(subOrCat);
  if (!name) return '';
  return '<div class="csf-nest-head-name">' + escapeHTML(name) + '</div>';
}

/** Purple subcategory pill + 800-53 chips on one row. Outcome sentences live in the requirement body. */
function renderCsfNestedControlGroupHtml(key, chipsHtml) {
  var heading = renderCsfSubcategoryHeadingHtml(key, { includeName: false })
    || '<div class="csf-nest-head">' + (typeof escapeHTML === 'function' ? escapeHTML(key) : String(key || '')) + '</div>';
  return '<div class="csf-nest-block">'
    + '<div class="csf-nest-chips">'
    + heading
    + (chipsHtml || '')
    + '</div>'
    + '</div>';
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
  return out.slice(0, 1);
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

var CSF_CORE_PM_IDS = ['PM-1', 'PM-2', 'PM-9'];

function isCsfCorePm(id) {
  return CSF_CORE_PM_IDS.indexOf(id) !== -1;
}

function getCsfSubcategoryIdsForFunction(fnId) {
  var out = [];
  getCsfCategoriesForFunction(fnId).forEach(function(cat) {
    getCsfSubcategoryIdsForCategory(cat.id).forEach(function(id) { out.push(id); });
  });
  return out;
}

function getCsfExplicitPmControlsForSubcategory(subId) {
  var sid = String(subId || '');
  if (!sid) return [];
  var out = [];
  var seen = {};
  Object.keys(NIST_CSF_MAP).forEach(function(id) {
    if (id.indexOf('PM-') !== 0) return;
    getCsfExplicitMappingsForControl(id).forEach(function(m) {
      if (m.sub === sid && !seen[id]) {
        seen[id] = true;
        out.push(id);
      }
    });
  });
  out.sort();
  return out;
}

function isCsfStateMap(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function ensureCsfSelectedSubcatsState() {
  if (typeof state === 'undefined' || !state) return false;
  if (!isCsfStateMap(state.csfSelectedSubcats)) state.csfSelectedSubcats = {};
  if (!isCsfStateMap(state.csfAutoPmControls)) state.csfAutoPmControls = {};
  if (!isCsfStateMap(state.pmControls)) state.pmControls = {};
  return true;
}

function isCsfSubcatSelected(subId) {
  if (!ensureCsfSelectedSubcatsState()) return false;
  return !!state.csfSelectedSubcats[subId];
}

function ensureCsfSubcatsSeeded(fnId) {
  if (!ensureCsfSelectedSubcatsState()) return false;
  var ids = getCsfSubcategoryIdsForFunction(fnId);
  if (!ids.length) return false;
  var anySet = ids.some(function(id) { return state.csfSelectedSubcats[id] !== undefined; });
  if (anySet) return false;
  ids.forEach(function(id) { state.csfSelectedSubcats[id] = true; });
  ids.forEach(function(id) { applyCsfPmCascadeFromSub(id, true); });
  if (typeof markDirty === 'function') markDirty();
  return true;
}

function getCsfSelectedSubIds() {
  if (!ensureCsfSelectedSubcatsState()) return [];
  return Object.keys(CSF_SUBCATEGORIES).filter(function(id) {
    return !!state.csfSelectedSubcats[id];
  });
}

function getCsfSelectedSubIdsForFunction(fnId) {
  ensureCsfSubcatsSeeded(fnId);
  return getCsfSubcategoryIdsForFunction(fnId).filter(function(id) {
    return isCsfSubcatSelected(id);
  });
}

var CSF_CAT_ISP_PURPOSE = {
  'GV.PO': 'isp-domain-policy',
  'GV.OC': 'gv-oc',
  'GV.OV': 'gv-ov',
  'GV.SC': 'gv-sc',
  'GV.RR': 'isp-roles',
  'GV.RM': 'isp-risk'
};

function getCoveredCsfSubIdsFromRequirements(requirements, opts) {
  opts = opts || {};
  var set = {};
  (requirements || []).forEach(function(req) {
    if (!req) return;
    (req.controls || []).forEach(function(cid) {
      var sub = getCsfPrimarySubcategory(cid);
      if (sub) set[sub] = true;
    });
    (req.csf || []).forEach(function(id) {
      var s = String(id || '').trim();
      if (s && CSF_SUBCATEGORIES[s]) set[s] = true;
    });
    if (req.purpose === 'isp-domain-policy') set['GV.PO-02'] = true;
  });
  if (opts.extra) {
    Object.keys(opts.extra).forEach(function(id) {
      if (opts.extra[id]) set[id] = true;
    });
  }
  return set;
}

function getMissingCsfSubIdsForFunction(fnId, requirements, opts) {
  var covered = getCoveredCsfSubIdsFromRequirements(requirements, opts);
  return getCsfSelectedSubIdsForFunction(fnId).filter(function(id) {
    return !covered[id];
  });
}

function getDefaultCsfGapReqText(orgNameVal, catId, subIds) {
  var org = orgNameVal || 'the organization';
  var cat = CSF_CATEGORIES[catId];
  var catName = cat ? cat.name : catId;
  var fnName = cat ? getCsfFunctionLabel(cat.fn) : '';
  var listed = (subIds || []).join(', ');
  var lead = fnName ? (fnName + ' / ' + catName) : catName;
  return org + ' shall implement the selected CSF 2.0 ' + lead
    + ' outcomes (' + listed + '). Implementation shall be documented, reviewed on the policy cycle, and updated when requirements, threats, technology, or mission change. [NIST CSF 2.0: ' + listed + ']';
}

function getDefaultCsfCategoryReqText(orgNameVal, catId, subIds, cids) {
  var org = orgNameVal || 'the organization';
  var cat = CSF_CATEGORIES[catId];
  var catName = cat ? cat.name : catId;
  var subs = (subIds || []).slice().filter(Boolean);
  var outcomes = [];
  subs.forEach(function(id) {
    var s = getCsfSubcategoryDisplayName(id) || '';
    s = String(s).replace(/^The organization\s+/i, '').replace(/\s+$/, '');
    if (!s) return;
    s = s.charAt(0).toLowerCase() + s.slice(1);
    s = s.replace(/[.!?]$/, '');
    outcomes.push(s);
  });
  var body = org + ' shall implement CSF 2.0 ' + catName + ' (' + catId + ').';
  if (outcomes.length === 1) {
    body += ' In particular, ' + outcomes[0] + '.';
  } else if (outcomes.length) {
    body += ' Selected subcategory outcomes: ' + outcomes.join('; ') + '.';
  }
  var sorted = (cids || []).slice().filter(Boolean);
  if (typeof compareNistControlIds === 'function') sorted.sort(compareNistControlIds);
  else sorted.sort();
  if (sorted.length) {
    body += ' Mapped NIST SP 800-53 controls (' + sorted.join(', ')
      + ') implement these outcomes; detailed control text is operationalized in the control design wizard.';
  } else {
    body += ' Implementation shall be documented, reviewed on the policy cycle, and updated when requirements, threats, technology, or mission change.';
  }
  return body + ' [NIST CSF 2.0: ' + (subs.join(', ') || catId) + ']';
}

/** Policy-language shall-statement for one CSF 2.0 subcategory (domain policies). */
function getDefaultCsfSubReqText(orgNameVal, subId, cids) {
  var org = orgNameVal || 'the organization';
  var outcome = (typeof getCsfSubcategoryDisplayName === 'function'
    ? getCsfSubcategoryDisplayName(subId) : '') || String(subId || '');
  outcome = String(outcome).replace(/^The organization\s+/i, '').replace(/\s+$/, '');
  if (outcome) outcome = outcome.charAt(0).toLowerCase() + outcome.slice(1);
  if (outcome && !/[.!?]$/.test(outcome)) outcome += '.';
  var sorted = (cids || []).slice().filter(Boolean);
  if (typeof compareNistControlIds === 'function') sorted.sort(compareNistControlIds);
  else sorted.sort();
  var body = org + ' shall ensure ' + (outcome || (String(subId || 'this outcome') + ' is achieved.'));
  if (sorted.length) {
    body += ' Mapped NIST SP 800-53 controls (' + sorted.join(', ')
      + ') implement this outcome; detailed control text is operationalized in the control design wizard.';
  } else {
    body += ' Implementation shall be documented, reviewed on the policy cycle, and updated when requirements, threats, technology, or mission change.';
  }
  return body + ' [NIST CSF 2.0: ' + subId + ']';
}

function findReqForCsfSub(requirements, subId) {
  var want = String(subId || '');
  if (!want) return null;
  var i;
  for (i = 0; i < (requirements || []).length; i++) {
    var req = requirements[i];
    if (req && (req.csf || []).indexOf(want) !== -1) return req;
  }
  return null;
}

function findReqForCsfCategory(requirements, catId) {
  var purpose = CSF_CAT_ISP_PURPOSE[catId] || ('csf-gap-' + catId);
  var i;
  for (i = 0; i < (requirements || []).length; i++) {
    if (requirements[i] && requirements[i].purpose === purpose) return requirements[i];
  }
  for (i = 0; i < (requirements || []).length; i++) {
    if (requirements[i] && requirements[i].purpose === ('csf-gap-' + catId)) return requirements[i];
  }
  var hits = [];
  (requirements || []).forEach(function(req) {
    var csf = req && req.csf || [];
    if (!csf.length) return;
    var allThisCat = csf.every(function(id) { return getCsfCategoryIdFromSub(id) === catId; });
    if (allThisCat) hits.push(req);
  });
  return hits.length === 1 ? hits[0] : null;
}

var CSF_GAP_SKIP_CTRL = { 'PM-1': true, 'PM-6': true, 'PM-11': true, 'PM-30': true, 'PM-30(1)': true };

function collectRequirementControlIds(requirements) {
  var set = {};
  (requirements || []).forEach(function(req) {
    (req && req.controls || []).forEach(function(id) { if (id) set[id] = true; });
  });
  return set;
}

function getOfficialControlsForCsfSubs(subIds) {
  var want = {};
  (subIds || []).forEach(function(id) { want[id] = true; });
  var out = [];
  Object.keys(NIST_CSF_MAP).forEach(function(cid) {
    var sub = getCsfPrimarySubcategory(cid);
    if (sub && want[sub]) out.push(cid);
  });
  out.sort();
  return out;
}

/**
 * One new row per missing CSF subcategory. Used by domain policies.
 * Pass allowedControls to attach only that policy's selected 800-53 IDs.
 */
function draftUnmappedCsfRequirementsBySub(requirements, missing, opts) {
  var listed = collectRequirementControlIds(requirements);
  var orgNameVal = opts.orgName || (typeof state !== 'undefined' && state && state.orgName) || 'the organization';
  var idPrefix = opts.idPrefix || 'IS-REQ-';
  var restrict = Object.prototype.hasOwnProperty.call(opts, 'allowedControls');
  var allowSet = null;
  if (restrict) {
    allowSet = {};
    (opts.allowedControls || []).forEach(function(id) { if (id) allowSet[id] = true; });
  }
  var created = 0;
  missing.forEach(function(subId) {
    if (findReqForCsfSub(requirements, subId)) return;
    var controls = getOfficialControlsForCsfSubs([subId]).filter(function(cid) {
      if (listed[cid]) return false;
      if (allowSet && !allowSet[cid]) return false;
      return true;
    });
    controls.forEach(function(cid) { listed[cid] = true; });
    var n = requirements.length + 1;
    requirements.push({
      id: idPrefix + n,
      text: getDefaultCsfSubReqText(orgNameVal, subId, controls),
      controls: controls,
      csf: [subId]
    });
    created++;
  });
  return created;
}

/**
 * Draft requirements for selected CSF subs that no requirement covers.
 * Default (ISP): one row per Category.
 * opts.domainCategory (domain policies): one row per Category, subcategory outcomes in the text.
 * opts.perSubcategory: one row per subcategory (legacy).
 */
function draftUnmappedCsfRequirements(fnId, requirements, opts) {
  opts = opts || {};
  if (!Array.isArray(requirements)) return 0;
  var missing = getMissingCsfSubIdsForFunction(fnId, requirements, opts);
  if (!missing.length) return 0;
  if (opts.perSubcategory) return draftUnmappedCsfRequirementsBySub(requirements, missing, opts);
  var grouped = groupCsfSubIdsByCategory(missing);
  var listed = collectRequirementControlIds(requirements);
  var orgNameVal = opts.orgName || (typeof state !== 'undefined' && state && state.orgName) || 'the organization';
  var idPrefix = opts.idPrefix || 'IS-REQ-';
  var restrict = Object.prototype.hasOwnProperty.call(opts, 'allowedControls');
  var allowSet = null;
  if (restrict) {
    allowSet = {};
    (opts.allowedControls || []).forEach(function(id) { if (id) allowSet[id] = true; });
  }
  var domainCat = !!opts.domainCategory;
  var created = 0;
  grouped.order.forEach(function(catId) {
    var subs = grouped.groups[catId] || [];
    if (!subs.length) return;
    var existing = domainCat
      ? findDomainReqForCsfCategory(requirements, catId)
      : findReqForCsfCategory(requirements, catId);
    if (existing) {
      if (!existing.csf) existing.csf = [];
      var seen = {};
      existing.csf.forEach(function(id) { seen[id] = true; });
      var added = false;
      subs.forEach(function(id) {
        if (seen[id]) return;
        existing.csf.push(id);
        seen[id] = true;
        added = true;
      });
      if (added) created++;
      return;
    }
    var controls = getOfficialControlsForCsfSubs(subs).filter(function(cid) {
      if (listed[cid]) return false;
      if (allowSet && !allowSet[cid]) return false;
      return true;
    });
    controls.forEach(function(cid) { listed[cid] = true; });
    var n = requirements.length + 1;
    requirements.push({
      id: idPrefix + n,
      purpose: domainCat ? ('csf-cat-' + catId) : (CSF_CAT_ISP_PURPOSE[catId] || ('csf-gap-' + catId)),
      text: domainCat
        ? getDefaultCsfCategoryReqText(orgNameVal, catId, subs, controls)
        : getDefaultCsfGapReqText(orgNameVal, catId, subs),
      controls: controls,
      csf: subs.slice()
    });
    created++;
  });
  return created;
}

function getCsfPmIdsForSelectedSubs() {
  var set = {};
  getCsfSelectedSubIds().forEach(function(sub) {
    getCsfExplicitPmControlsForSubcategory(sub).forEach(function(pm) { set[pm] = true; });
  });
  return set;
}

function getCsfSelectedSubsForPm(pmId) {
  if (!ensureCsfSelectedSubcatsState()) return [];
  return getCsfExplicitMappingsForControl(pmId).filter(function(m) {
    return m.sub && !!state.csfSelectedSubcats[m.sub];
  }).map(function(m) { return m.sub; });
}

function applyCsfPmCascadeFromSub(subId, nowSelected) {
  if (!ensureCsfSelectedSubcatsState()) return;
  var pms = getCsfExplicitPmControlsForSubcategory(subId);
  if (!pms.length) return;
  if (nowSelected) {
    pms.forEach(function(id) {
      if (!state.pmControls[id]) {
        state.pmControls[id] = true;
        state.csfAutoPmControls[id] = true;
      }
    });
    return;
  }
  pms.forEach(function(id) {
    if (isCsfCorePm(id)) return;
    if (!state.csfAutoPmControls[id]) return;
    var stillNeeded = getCsfExplicitMappingsForControl(id).some(function(m) {
      return m.sub && !!state.csfSelectedSubcats[m.sub];
    });
    if (stillNeeded) return;
    state.pmControls[id] = false;
    state.csfAutoPmControls[id] = false;
  });
}

function toggleCsfSubcat(subId, checked) {
  if (!ensureCsfSelectedSubcatsState()) return;
  var sid = String(subId || '');
  if (!CSF_SUBCATEGORIES[sid]) return;
  state.csfSelectedSubcats[sid] = !!checked;
  applyCsfPmCascadeFromSub(sid, !!checked);
  if (typeof markDirty === 'function') markDirty();
  setTimeout(function() { refreshCsfSelectionUi(); }, 0);
}

function setCsfCategorySubcats(catId, selected) {
  if (!ensureCsfSelectedSubcatsState()) return;
  selected = !!selected;
  var ids = getCsfSubcategoryIdsForCategory(catId);
  ids.forEach(function(id) {
    var was = !!state.csfSelectedSubcats[id];
    if (was === selected) return;
    state.csfSelectedSubcats[id] = selected;
    applyCsfPmCascadeFromSub(id, selected);
  });
  if (typeof markDirty === 'function') markDirty();
  setTimeout(function() { refreshCsfSelectionUi(); }, 0);
}

function refreshCsfSelectionUi() {
  var cisoTab = document.getElementById('tab-ciso');
  var policyTab = document.getElementById('tab-policy');
  var cisoOn = cisoTab && cisoTab.classList.contains('active');
  var policyOn = policyTab && policyTab.classList.contains('active');
  var step = (typeof currentStep !== 'undefined') ? currentStep : {};
  if (cisoOn && typeof cisoStepIndexByLabel === 'function' && step.ciso === cisoStepIndexByLabel('PM Controls', 4) && typeof renderCISOStep2 === 'function') {
    renderCISOStep2();
    return;
  }
  if (policyOn && state && state._ispRevisionView && typeof renderCISOStep3 === 'function') {
    renderCISOStep3();
    return;
  }
  if (policyOn && typeof renderPolicyStep === 'function') {
    renderPolicyStep(step.policy || 1);
  }
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
  ensureCsfSubcatsSeeded(fn);
  var compact = !!opts.compact;
  var showMappedPm = fn === 'GV' && !!opts.showMappedPm;
  var cats = getCsfCategoriesForFunction(fn);
  var allIds = getCsfSubcategoryIdsForFunction(fn);
  var selectedCount = allIds.filter(function(id) { return isCsfSubcatSelected(id); }).length;
  var leads = {
    GV: 'Select the Govern outcomes this program will implement. All GV subcategories start selected (Govern is the ISP floor). PM controls below are the 800-53 implementations \u2014 checking an outcome selects mapped PMs.',
    ID: 'Select the Identify outcomes this Function policy will implement. Subcategories start selected; deselect any that are out of scope. 800-53 controls in this policy implement the checked outcomes.',
    PR: 'Select the Protect outcomes this Function policy will implement. Subcategories start selected; deselect any that are out of scope. 800-53 controls in this policy implement the checked outcomes.',
    DE: 'Select the Detect outcomes this Function policy will implement. Subcategories start selected; deselect any that are out of scope. 800-53 controls in this policy implement the checked outcomes.',
    RS: 'Select the Respond outcomes this Function policy will implement. Subcategories start selected; deselect any that are out of scope. 800-53 controls in this policy implement the checked outcomes.',
    RC: 'Select the Recover outcomes this Function policy will implement. Subcategories start selected; deselect any that are out of scope. 800-53 controls in this policy implement the checked outcomes.'
  };
  var lead = opts.lead || leads[fn] || ('Select ' + meta.name + ' outcomes. Subcategories start selected.');
  function escAttr(id) {
    return String(id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }
  var colCount = showMappedPm ? 4 : 3;
  var rows = cats.map(function(cat) {
    var hid = 'csf-fn-' + String(cat.id || '').replace(/\./g, '-');
    var subs = getCsfSubcategoryIdsForCategory(cat.id);
    var catEsc = escAttr(cat.id);
    var head = '<tr class="csf-sub-catrow">'
      + '<td colspan="' + colCount + '">'
      + '<div class="csf-sub-cathead">'
      + '<h3 class="csf-gv-cat-head" id="' + hid + '">'
      + '<span class="csf-fn-code">' + escapeHTML(cat.id) + '</span> '
      + '<span class="csf-gv-cat-name">' + escapeHTML(cat.name) + '</span></h3>'
      + '<span class="csf-sub-catactions">'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="setCsfCategorySubcats(\'' + catEsc + '\', true)">All</button>'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="setCsfCategorySubcats(\'' + catEsc + '\', false)">None</button>'
      + '</span></div></td></tr>';
    var body = subs.map(function(sid) {
      var checked = isCsfSubcatSelected(sid) ? ' checked' : '';
      var sidEsc = escAttr(sid);
      var mappedHtml = '';
      if (showMappedPm) {
        var pms = getCsfExplicitPmControlsForSubcategory(sid);
        mappedHtml = '<td class="csf-sub-maps">'
          + (pms.length
            ? pms.map(function(id) {
                return '<span class="csf-tag csf-fn-gv csf-map-chip" title="Official 800-53 map (read-only)">' + escapeHTML(id) + '</span>';
              }).join('')
            : '<span class="csf-sub-maps-empty">\u2014</span>')
          + '</td>';
      }
      return '<tr class="csf-sub-row' + (checked ? ' is-selected' : '') + '">'
        + '<td><label class="cb-label"><input type="checkbox"' + checked
        + ' onchange="toggleCsfSubcat(\'' + sidEsc + '\', this.checked)"'
        + ' style="accent-color:var(--teal);" aria-label="' + escapeHTML(sid) + '"></label></td>'
        + '<td><span class="csf-gv-sub-id">' + escapeHTML(sid) + '</span></td>'
        + '<td class="csf-sub-name">' + escapeHTML(CSF_SUBCATEGORIES[sid] || '') + '</td>'
        + mappedHtml
        + '</tr>';
    }).join('');
    return head + body;
  }).join('');
  var cls = 'csf-fn-orient csf-fn-' + fn.toLowerCase() + (fn === 'GV' ? ' csf-gv-orient' : '') + (compact ? ' csf-fn-orient--compact' : '');
  return '<div class="' + cls + '" role="region" aria-label="NIST CSF 2.0 ' + escapeHTML(meta.name) + ' outcomes">'
    + '<div class="csf-gv-orient-kicker">NIST CSF 2.0 \u00b7 ' + escapeHTML(meta.name) + ' (' + fn + ')</div>'
    + '<p class="csf-gv-orient-lead">' + escapeHTML(lead) + '</p>'
    + '<div class="csf-sub-toolbar"><span class="csf-sub-count">' + selectedCount + ' of ' + allIds.length + ' selected</span></div>'
    + '<div class="table-scroll">'
    + '<table class="control-table csf-sub-table">'
    + '<thead><tr>'
    + '<th style="width:44px;"></th>'
    + '<th style="width:110px;">ID</th>'
    + '<th>Outcome</th>'
    + (showMappedPm ? '<th style="width:96px;">Maps to</th>' : '')
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table></div>'
    + '</div>';
}

function renderCsfGovernOrientationHtml(opts) {
  return renderCsfFunctionOrientationHtml('GV', opts);
}

/** Compact Step 6 breadcrumb \u2014 counts only, no selection UI and no MAPS TO. */
function renderCsfGovernIspReminderHtml() {
  if (typeof escapeHTML !== 'function') return '';
  ensureCsfSubcatsSeeded('GV');
  var allIds = getCsfSubcategoryIdsForFunction('GV');
  var selectedCount = allIds.filter(function(id) { return isCsfSubcatSelected(id); }).length;
  return '<p class="csf-isp-crumb" role="note">'
    + 'Govern outcomes: ' + selectedCount + ' of ' + allIds.length + ' selected \u2014 '
    + '<button type="button" class="csf-isp-crumb-link" onclick="goToStep(\'ciso\', 5)">change on PM Controls</button>'
    + '</p>';
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
