// js/core.js — foundation (load first). Split from app.js (Step 1).
// Globals only; no IIFE. Depends on nothing; other scripts depend on this file.

const FAMILIES = {
  AC:'Access Control', AT:'Awareness and Training', AU:'Audit and Accountability',
  CA:'Assessment, Authorization, and Monitoring', CM:'Configuration Management',
  CP:'Contingency Planning', IA:'Identification and Authentication',
  IR:'Incident Response', MA:'Maintenance', MP:'Media Protection',
  PE:'Physical and Environmental Protection', PL:'Planning',
  PM:'Program Management', PS:'Personnel Security',
  PT:'PII Processing and Transparency', RA:'Risk Assessment',
  SA:'System and Services Acquisition', SC:'System and Communications Protection',
  SI:'System and Information Integrity', SR:'Supply Chain Risk Management'
};

// ============================================================
// NIST 800-53 Rev. 5 CONTROLS (Representative set)
// bl = baselines: L=Low, M=Moderate, H=High, P=Privacy
// ============================================================
const CONTROLS = [
  // AC — Access Control
  {id:'AC-1', f:'AC', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'AC-2', f:'AC', n:'Account Management', bl:['L','M','H']},
  {id:'AC-2(1)', f:'AC', n:'Automated System Account Management', bl:['M','H']},
  {id:'AC-2(2)', f:'AC', n:'Automated Temporary and Emergency Account Management', bl:['M','H']},
  {id:'AC-2(3)', f:'AC', n:'Disable Accounts', bl:['M','H']},
  {id:'AC-2(4)', f:'AC', n:'Automated Audit Actions', bl:['M','H']},
  {id:'AC-2(5)', f:'AC', n:'Inactivity Logout', bl:['M','H']},
  {id:'AC-2(6)', f:'AC', n:'Dynamic Privilege Management', bl:[]},
  {id:'AC-2(7)', f:'AC', n:'Privileged User Accounts', bl:[]},
  {id:'AC-2(8)', f:'AC', n:'Dynamic Account Management', bl:[]},
  {id:'AC-2(9)', f:'AC', n:'Restrictions on Use of Shared and Group Accounts', bl:[]},
  {id:'AC-2(11)', f:'AC', n:'Usage Conditions', bl:['H']},
  {id:'AC-2(12)', f:'AC', n:'Account Monitoring for Atypical Usage', bl:['H']},
  {id:'AC-2(13)', f:'AC', n:'Disable Accounts for High-risk Individuals', bl:['M','H']},
  {id:'AC-3', f:'AC', n:'Access Enforcement', bl:['L','M','H']},
  {id:'AC-3(2)', f:'AC', n:'Dual Authorization', bl:[]},
  {id:'AC-3(3)', f:'AC', n:'Mandatory Access Control', bl:[]},
  {id:'AC-3(4)', f:'AC', n:'Discretionary Access Control', bl:[]},
  {id:'AC-3(5)', f:'AC', n:'Security-relevant Information', bl:[]},
  {id:'AC-3(7)', f:'AC', n:'Role-based Access Control', bl:[]},
  {id:'AC-3(8)', f:'AC', n:'Revocation of Access Authorizations', bl:[]},
  {id:'AC-3(9)', f:'AC', n:'Controlled Release', bl:[]},
  {id:'AC-3(10)', f:'AC', n:'Audited Override of Access Control Mechanisms', bl:[]},
  {id:'AC-3(11)', f:'AC', n:'Restrict Access to Specific Information Types', bl:[]},
  {id:'AC-3(12)', f:'AC', n:'Assert and Enforce Application Access', bl:[]},
  {id:'AC-3(13)', f:'AC', n:'Attribute-based Access Control', bl:[]},
  {id:'AC-3(14)', f:'AC', n:'Individual Access', bl:['P']},
  {id:'AC-3(15)', f:'AC', n:'Discretionary and Mandatory Access Control', bl:[]},
  {id:'AC-4', f:'AC', n:'Information Flow Enforcement', bl:['M','H']},
  {id:'AC-4(1)', f:'AC', n:'Object Security and Privacy Attributes', bl:[]},
  {id:'AC-4(2)', f:'AC', n:'Processing Domains', bl:[]},
  {id:'AC-4(3)', f:'AC', n:'Dynamic Information Flow Control', bl:[]},
  {id:'AC-4(4)', f:'AC', n:'Flow Control of Encrypted Information', bl:['H']},
  {id:'AC-4(5)', f:'AC', n:'Embedded Data Types', bl:[]},
  {id:'AC-4(6)', f:'AC', n:'Metadata', bl:[]},
  {id:'AC-4(7)', f:'AC', n:'One-way Flow Mechanisms', bl:[]},
  {id:'AC-4(8)', f:'AC', n:'Security and Privacy Policy Filters', bl:[]},
  {id:'AC-4(9)', f:'AC', n:'Human Reviews', bl:[]},
  {id:'AC-4(10)', f:'AC', n:'Enable and Disable Security or Privacy Policy Filters', bl:[]},
  {id:'AC-4(11)', f:'AC', n:'Configuration of Security or Privacy Policy Filters', bl:[]},
  {id:'AC-4(12)', f:'AC', n:'Data Type Identifiers', bl:[]},
  {id:'AC-4(13)', f:'AC', n:'Decomposition into Policy-relevant Subcomponents', bl:[]},
  {id:'AC-4(14)', f:'AC', n:'Security or Privacy Policy Filter Constraints', bl:[]},
  {id:'AC-4(15)', f:'AC', n:'Detection of Unsanctioned Information', bl:[]},
  {id:'AC-4(17)', f:'AC', n:'Domain Authentication', bl:[]},
  {id:'AC-4(19)', f:'AC', n:'Validation of Metadata', bl:[]},
  {id:'AC-4(20)', f:'AC', n:'Approved Solutions', bl:[]},
  {id:'AC-4(21)', f:'AC', n:'Physical or Logical Separation of Information Flows', bl:[]},
  {id:'AC-4(22)', f:'AC', n:'Access Only', bl:[]},
  {id:'AC-4(23)', f:'AC', n:'Modify Non-releasable Information', bl:[]},
  {id:'AC-4(24)', f:'AC', n:'Internal Normalized Format', bl:[]},
  {id:'AC-4(25)', f:'AC', n:'Data Sanitization', bl:[]},
  {id:'AC-4(26)', f:'AC', n:'Audit Filtering Actions', bl:[]},
  {id:'AC-4(27)', f:'AC', n:'Redundant/independent Filtering Mechanisms', bl:[]},
  {id:'AC-4(28)', f:'AC', n:'Linear Filter Pipelines', bl:[]},
  {id:'AC-4(29)', f:'AC', n:'Filter Orchestration Engines', bl:[]},
  {id:'AC-4(30)', f:'AC', n:'Filter Mechanisms Using Multiple Processes', bl:[]},
  {id:'AC-4(31)', f:'AC', n:'Failed Content Transfer Prevention', bl:[]},
  {id:'AC-4(32)', f:'AC', n:'Process Requirements for Information Transfer', bl:[]},
  {id:'AC-5', f:'AC', n:'Separation of Duties', bl:['M','H']},
  {id:'AC-6', f:'AC', n:'Least Privilege', bl:['M','H']},
  {id:'AC-6(1)', f:'AC', n:'Authorize Access to Security Functions', bl:['M','H']},
  {id:'AC-6(2)', f:'AC', n:'Non-privileged Access for Nonsecurity Functions', bl:['M','H']},
  {id:'AC-6(3)', f:'AC', n:'Network Access to Privileged Commands', bl:['H']},
  {id:'AC-6(4)', f:'AC', n:'Separate Processing Domains', bl:[]},
  {id:'AC-6(5)', f:'AC', n:'Privileged Accounts', bl:['M','H']},
  {id:'AC-6(6)', f:'AC', n:'Privileged Access by Non-organizational Users', bl:[]},
  {id:'AC-6(7)', f:'AC', n:'Review of User Privileges', bl:['M','H']},
  {id:'AC-6(8)', f:'AC', n:'Privilege Levels for Code Execution', bl:[]},
  {id:'AC-6(9)', f:'AC', n:'Log Use of Privileged Functions', bl:['M','H']},
  {id:'AC-6(10)', f:'AC', n:'Prohibit Non-privileged Users from Executing Privileged Functions', bl:['M','H']},
  {id:'AC-7', f:'AC', n:'Unsuccessful Logon Attempts', bl:['L','M','H']},
  {id:'AC-7(2)', f:'AC', n:'Purge or Wipe Mobile Device', bl:[]},
  {id:'AC-7(3)', f:'AC', n:'Biometric Attempt Limiting', bl:[]},
  {id:'AC-7(4)', f:'AC', n:'Use of Alternate Authentication Factor', bl:[]},
  {id:'AC-8', f:'AC', n:'System Use Notification', bl:['L','M','H']},
  {id:'AC-9', f:'AC', n:'Previous Logon Notification', bl:[]},
  {id:'AC-9(1)', f:'AC', n:'Unsuccessful Logons', bl:[]},
  {id:'AC-9(2)', f:'AC', n:'Successful and Unsuccessful Logons', bl:[]},
  {id:'AC-9(3)', f:'AC', n:'Notification of Account Changes', bl:[]},
  {id:'AC-9(4)', f:'AC', n:'Additional Logon Information', bl:[]},
  {id:'AC-10', f:'AC', n:'Concurrent Session Control', bl:['H']},
  {id:'AC-11', f:'AC', n:'Device Lock', bl:['M','H']},
  {id:'AC-11(1)', f:'AC', n:'Pattern-hiding Displays', bl:['M','H']},
  {id:'AC-12', f:'AC', n:'Session Termination', bl:['M','H']},
  {id:'AC-12(1)', f:'AC', n:'User-initiated Logouts', bl:[]},
  {id:'AC-12(2)', f:'AC', n:'Termination Message', bl:[]},
  {id:'AC-12(3)', f:'AC', n:'Timeout Warning Message', bl:[]},
  {id:'AC-14', f:'AC', n:'Permitted Actions Without Identification or Authentication', bl:['L','M','H']},
  {id:'AC-16', f:'AC', n:'Security and Privacy Attributes', bl:[]},
  {id:'AC-16(1)', f:'AC', n:'Dynamic Attribute Association', bl:[]},
  {id:'AC-16(2)', f:'AC', n:'Attribute Value Changes by Authorized Individuals', bl:[]},
  {id:'AC-16(3)', f:'AC', n:'Maintenance of Attribute Associations by System', bl:[]},
  {id:'AC-16(4)', f:'AC', n:'Association of Attributes by Authorized Individuals', bl:[]},
  {id:'AC-16(5)', f:'AC', n:'Attribute Displays on Objects to Be Output', bl:[]},
  {id:'AC-16(6)', f:'AC', n:'Maintenance of Attribute Association', bl:[]},
  {id:'AC-16(7)', f:'AC', n:'Consistent Attribute Interpretation', bl:[]},
  {id:'AC-16(8)', f:'AC', n:'Association Techniques and Technologies', bl:[]},
  {id:'AC-16(9)', f:'AC', n:'Attribute Reassignment — Regrading Mechanisms', bl:[]},
  {id:'AC-16(10)', f:'AC', n:'Attribute Configuration by Authorized Individuals', bl:[]},
  {id:'AC-17', f:'AC', n:'Remote Access', bl:['L','M','H']},
  {id:'AC-17(1)', f:'AC', n:'Monitoring and Control', bl:['M','H']},
  {id:'AC-17(2)', f:'AC', n:'Protection of Confidentiality and Integrity Using Encryption', bl:['M','H']},
  {id:'AC-17(3)', f:'AC', n:'Managed Access Control Points', bl:['M','H']},
  {id:'AC-17(4)', f:'AC', n:'Privileged Commands and Access', bl:['M','H']},
  {id:'AC-17(6)', f:'AC', n:'Protection of Mechanism Information', bl:[]},
  {id:'AC-17(9)', f:'AC', n:'Disconnect or Disable Access', bl:[]},
  {id:'AC-17(10)', f:'AC', n:'Authenticate Remote Commands', bl:[]},
  {id:'AC-18', f:'AC', n:'Wireless Access', bl:['L','M','H']},
  {id:'AC-18(1)', f:'AC', n:'Authentication and Encryption', bl:['M','H']},
  {id:'AC-18(3)', f:'AC', n:'Disable Wireless Networking', bl:['M','H']},
  {id:'AC-18(4)', f:'AC', n:'Restrict Configurations by Users', bl:['H']},
  {id:'AC-18(5)', f:'AC', n:'Antennas and Transmission Power Levels', bl:['H']},
  {id:'AC-19', f:'AC', n:'Access Control for Mobile Devices', bl:['L','M','H']},
  {id:'AC-19(4)', f:'AC', n:'Restrictions for Classified Information', bl:[]},
  {id:'AC-19(5)', f:'AC', n:'Full Device or Container-based Encryption', bl:['M','H']},
  {id:'AC-20', f:'AC', n:'Use of External Systems', bl:['L','M','H']},
  {id:'AC-20(1)', f:'AC', n:'Limits on Authorized Use', bl:['M','H']},
  {id:'AC-20(2)', f:'AC', n:'Portable Storage Devices — Restricted Use', bl:['M','H']},
  {id:'AC-20(3)', f:'AC', n:'Non-organizationally Owned Systems  — Restricted Use', bl:[]},
  {id:'AC-20(4)', f:'AC', n:'Network Accessible Storage Devices — Prohibited Use', bl:[]},
  {id:'AC-20(5)', f:'AC', n:'Portable Storage Devices — Prohibited Use', bl:[]},
  {id:'AC-21', f:'AC', n:'Information Sharing', bl:['M','H']},
  {id:'AC-21(1)', f:'AC', n:'Automated Decision Support', bl:[]},
  {id:'AC-21(2)', f:'AC', n:'Information Search and Retrieval', bl:[]},
  {id:'AC-22', f:'AC', n:'Publicly Accessible Content', bl:['L','M','H']},
  {id:'AC-23', f:'AC', n:'Data Mining Protection', bl:[]},
  {id:'AC-24', f:'AC', n:'Access Control Decisions', bl:[]},
  {id:'AC-24(1)', f:'AC', n:'Transmit Access Authorization Information', bl:[]},
  {id:'AC-24(2)', f:'AC', n:'No User or Process Identity', bl:[]},
  {id:'AC-25', f:'AC', n:'Reference Monitor', bl:[]},
  // AT — Awareness and Training
  {id:'AT-1', f:'AT', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'AT-2', f:'AT', n:'Literacy Training and Awareness', bl:['L','M','H','P']},
  {id:'AT-2(1)', f:'AT', n:'Practical Exercises', bl:[]},
  {id:'AT-2(2)', f:'AT', n:'Insider Threat', bl:['L','M','H']},
  {id:'AT-2(3)', f:'AT', n:'Social Engineering and Mining', bl:['M','H']},
  {id:'AT-2(4)', f:'AT', n:'Suspicious Communications and Anomalous System Behavior', bl:[]},
  {id:'AT-2(5)', f:'AT', n:'Advanced Persistent Threat', bl:[]},
  {id:'AT-2(6)', f:'AT', n:'Cyber Threat Environment', bl:[]},
  {id:'AT-3', f:'AT', n:'Role-based Training', bl:['L','M','H','P']},
  {id:'AT-3(1)', f:'AT', n:'Environmental Controls', bl:[]},
  {id:'AT-3(2)', f:'AT', n:'Physical Security Controls', bl:[]},
  {id:'AT-3(3)', f:'AT', n:'Practical Exercises', bl:[]},
  {id:'AT-3(5)', f:'AT', n:'Processing Personally Identifiable Information', bl:['P']},
  {id:'AT-4', f:'AT', n:'Training Records', bl:['L','M','H','P']},
  {id:'AT-6', f:'AT', n:'Training Feedback', bl:[]},
  // AU — Audit and Accountability
  {id:'AU-1', f:'AU', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'AU-2', f:'AU', n:'Event Logging', bl:['L','M','H','P']},
  {id:'AU-3', f:'AU', n:'Content of Audit Records', bl:['L','M','H']},
  {id:'AU-3(1)', f:'AU', n:'Additional Audit Information', bl:['M','H']},
  {id:'AU-3(3)', f:'AU', n:'Limit Personally Identifiable Information Elements', bl:['P']},
  {id:'AU-4', f:'AU', n:'Audit Log Storage Capacity', bl:['L','M','H']},
  {id:'AU-4(1)', f:'AU', n:'Transfer to Alternate Storage', bl:[]},
  {id:'AU-5', f:'AU', n:'Response to Audit Logging Process Failures', bl:['L','M','H']},
  {id:'AU-5(1)', f:'AU', n:'Storage Capacity Warning', bl:['H']},
  {id:'AU-5(2)', f:'AU', n:'Real-time Alerts', bl:['H']},
  {id:'AU-5(3)', f:'AU', n:'Configurable Traffic Volume Thresholds', bl:[]},
  {id:'AU-5(4)', f:'AU', n:'Shutdown on Failure', bl:[]},
  {id:'AU-5(5)', f:'AU', n:'Alternate Audit Logging Capability', bl:[]},
  {id:'AU-6', f:'AU', n:'Audit Record Review, Analysis, and Reporting', bl:['L','M','H']},
  {id:'AU-6(1)', f:'AU', n:'Automated Process Integration', bl:['M','H']},
  {id:'AU-6(3)', f:'AU', n:'Correlate Audit Record Repositories', bl:['M','H']},
  {id:'AU-6(4)', f:'AU', n:'Central Review and Analysis', bl:[]},
  {id:'AU-6(5)', f:'AU', n:'Integrated Analysis of Audit Records', bl:['H']},
  {id:'AU-6(6)', f:'AU', n:'Correlation with Physical Monitoring', bl:['H']},
  {id:'AU-6(7)', f:'AU', n:'Permitted Actions', bl:[]},
  {id:'AU-6(8)', f:'AU', n:'Full Text Analysis of Privileged Commands', bl:[]},
  {id:'AU-6(9)', f:'AU', n:'Correlation with Information from Nontechnical Sources', bl:[]},
  {id:'AU-7', f:'AU', n:'Audit Record Reduction and Report Generation', bl:['M','H']},
  {id:'AU-7(1)', f:'AU', n:'Automatic Processing', bl:['M','H']},
  {id:'AU-8', f:'AU', n:'Time Stamps', bl:['L','M','H']},
  {id:'AU-9', f:'AU', n:'Protection of Audit Information', bl:['L','M','H']},
  {id:'AU-9(1)', f:'AU', n:'Hardware Write-once Media', bl:[]},
  {id:'AU-9(2)', f:'AU', n:'Store on Separate Physical Systems or Components', bl:['H']},
  {id:'AU-9(3)', f:'AU', n:'Cryptographic Protection', bl:['H']},
  {id:'AU-9(4)', f:'AU', n:'Access by Subset of Privileged Users', bl:['M','H']},
  {id:'AU-9(5)', f:'AU', n:'Dual Authorization', bl:[]},
  {id:'AU-9(6)', f:'AU', n:'Read-only Access', bl:[]},
  {id:'AU-9(7)', f:'AU', n:'Store on Component with Different Operating System', bl:[]},
  {id:'AU-10', f:'AU', n:'Non-repudiation', bl:['H']},
  {id:'AU-10(1)', f:'AU', n:'Association of Identities', bl:[]},
  {id:'AU-10(2)', f:'AU', n:'Validate Binding of Information Producer Identity', bl:[]},
  {id:'AU-10(3)', f:'AU', n:'Chain of Custody', bl:[]},
  {id:'AU-10(4)', f:'AU', n:'Validate Binding of Information Reviewer Identity', bl:[]},
  {id:'AU-11', f:'AU', n:'Audit Record Retention', bl:['L','M','H','P']},
  {id:'AU-11(1)', f:'AU', n:'Long-term Retrieval Capability', bl:[]},
  {id:'AU-12', f:'AU', n:'Audit Record Generation', bl:['L','M','H']},
  {id:'AU-12(1)', f:'AU', n:'System-wide and Time-correlated Audit Trail', bl:['H']},
  {id:'AU-12(2)', f:'AU', n:'Standardized Formats', bl:[]},
  {id:'AU-12(3)', f:'AU', n:'Changes by Authorized Individuals', bl:['H']},
  {id:'AU-12(4)', f:'AU', n:'Query Parameter Audits of Personally Identifiable Information', bl:[]},
  {id:'AU-13', f:'AU', n:'Monitoring for Information Disclosure', bl:[]},
  {id:'AU-13(1)', f:'AU', n:'Use of Automated Tools', bl:[]},
  {id:'AU-13(2)', f:'AU', n:'Review of Monitored Sites', bl:[]},
  {id:'AU-13(3)', f:'AU', n:'Unauthorized Replication of Information', bl:[]},
  {id:'AU-14', f:'AU', n:'Session Audit', bl:[]},
  {id:'AU-14(1)', f:'AU', n:'System Start-up', bl:[]},
  {id:'AU-14(3)', f:'AU', n:'Remote Viewing and Listening', bl:[]},
  {id:'AU-16', f:'AU', n:'Cross-organizational Audit Logging', bl:[]},
  {id:'AU-16(1)', f:'AU', n:'Identity Preservation', bl:[]},
  {id:'AU-16(2)', f:'AU', n:'Sharing of Audit Information', bl:[]},
  {id:'AU-16(3)', f:'AU', n:'Disassociability', bl:[]},
  // CA — Assessment, Authorization and Monitoring
  {id:'CA-1', f:'CA', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'CA-2', f:'CA', n:'Control Assessments', bl:['L','M','H','P']},
  {id:'CA-2(1)', f:'CA', n:'Independent Assessors', bl:['M','H']},
  {id:'CA-2(2)', f:'CA', n:'Specialized Assessments', bl:['H']},
  {id:'CA-2(3)', f:'CA', n:'Leveraging Results from External Organizations', bl:[]},
  {id:'CA-3', f:'CA', n:'Information Exchange', bl:['L','M','H']},
  {id:'CA-3(6)', f:'CA', n:'Transfer Authorizations', bl:['H']},
  {id:'CA-3(7)', f:'CA', n:'Transitive Information Exchanges', bl:[]},
  {id:'CA-5', f:'CA', n:'Plan of Action and Milestones', bl:['L','M','H','P']},
  {id:'CA-5(1)', f:'CA', n:'Automation Support for Accuracy and Currency', bl:[]},
  {id:'CA-6', f:'CA', n:'Authorization', bl:['L','M','H','P']},
  {id:'CA-6(1)', f:'CA', n:'Joint Authorization — Intra-organization', bl:[]},
  {id:'CA-6(2)', f:'CA', n:'Joint Authorization — Inter-organization', bl:[]},
  {id:'CA-7', f:'CA', n:'Continuous Monitoring', bl:['L','M','H','P']},
  {id:'CA-7(1)', f:'CA', n:'Independent Assessment', bl:['M','H']},
  {id:'CA-7(3)', f:'CA', n:'Trend Analyses', bl:[]},
  {id:'CA-7(4)', f:'CA', n:'Risk Monitoring', bl:['L','M','H','P']},
  {id:'CA-7(5)', f:'CA', n:'Consistency Analysis', bl:[]},
  {id:'CA-7(6)', f:'CA', n:'Automation Support for Monitoring', bl:[]},
  {id:'CA-8', f:'CA', n:'Penetration Testing', bl:['H']},
  {id:'CA-8(1)', f:'CA', n:'Independent Penetration Testing Agent or Team', bl:['H']},
  {id:'CA-8(2)', f:'CA', n:'Red Team Exercises', bl:[]},
  {id:'CA-8(3)', f:'CA', n:'Facility Penetration Testing', bl:[]},
  {id:'CA-9', f:'CA', n:'Internal System Connections', bl:['L','M','H']},
  {id:'CA-9(1)', f:'CA', n:'Compliance Checks', bl:[]},
  // CM — Configuration Management
  {id:'CM-1', f:'CM', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'CM-2', f:'CM', n:'Baseline Configuration', bl:['L','M','H']},
  {id:'CM-2(2)', f:'CM', n:'Automation Support for Accuracy and Currency', bl:['M','H']},
  {id:'CM-2(3)', f:'CM', n:'Retention of Previous Configurations', bl:['M','H']},
  {id:'CM-2(6)', f:'CM', n:'Development and Test Environments', bl:[]},
  {id:'CM-2(7)', f:'CM', n:'Configure Systems and Components for High-risk Areas', bl:['M','H']},
  {id:'CM-3', f:'CM', n:'Configuration Change Control', bl:['M','H']},
  {id:'CM-3(1)', f:'CM', n:'Automated Documentation, Notification, and Prohibition of Changes', bl:['H']},
  {id:'CM-3(2)', f:'CM', n:'Testing, Validation, and Documentation of Changes', bl:['M','H']},
  {id:'CM-3(3)', f:'CM', n:'Automated Change Implementation', bl:[]},
  {id:'CM-3(4)', f:'CM', n:'Security and Privacy Representatives', bl:['M','H']},
  {id:'CM-3(5)', f:'CM', n:'Automated Security Response', bl:[]},
  {id:'CM-3(6)', f:'CM', n:'Cryptography Management', bl:['H']},
  {id:'CM-3(7)', f:'CM', n:'Review System Changes', bl:[]},
  {id:'CM-3(8)', f:'CM', n:'Prevent or Restrict Configuration Changes', bl:[]},
  {id:'CM-4', f:'CM', n:'Impact Analyses', bl:['L','M','H','P']},
  {id:'CM-4(1)', f:'CM', n:'Separate Test Environments', bl:['H']},
  {id:'CM-4(2)', f:'CM', n:'Verification of Controls', bl:['M','H']},
  {id:'CM-5', f:'CM', n:'Access Restrictions for Change', bl:['L','M','H']},
  {id:'CM-5(1)', f:'CM', n:'Automated Access Enforcement and Audit Records', bl:['H']},
  {id:'CM-5(4)', f:'CM', n:'Dual Authorization', bl:[]},
  {id:'CM-5(5)', f:'CM', n:'Privilege Limitation for Production and Operation', bl:[]},
  {id:'CM-5(6)', f:'CM', n:'Limit Library Privileges', bl:[]},
  {id:'CM-6', f:'CM', n:'Configuration Settings', bl:['L','M','H']},
  {id:'CM-6(1)', f:'CM', n:'Automated Management, Application, and Verification', bl:['H']},
  {id:'CM-6(2)', f:'CM', n:'Respond to Unauthorized Changes', bl:['H']},
  {id:'CM-7', f:'CM', n:'Least Functionality', bl:['L','M','H']},
  {id:'CM-7(1)', f:'CM', n:'Periodic Review', bl:['M','H']},
  {id:'CM-7(2)', f:'CM', n:'Prevent Program Execution', bl:['M','H']},
  {id:'CM-7(3)', f:'CM', n:'Registration Compliance', bl:[]},
  {id:'CM-7(4)', f:'CM', n:'Unauthorized Software', bl:[]},
  {id:'CM-7(5)', f:'CM', n:'Authorized Software', bl:['M','H']},
  {id:'CM-7(6)', f:'CM', n:'Confined Environments with Limited Privileges', bl:[]},
  {id:'CM-7(7)', f:'CM', n:'Code Execution in Protected Environments', bl:[]},
  {id:'CM-7(8)', f:'CM', n:'Binary or Machine Executable Code', bl:[]},
  {id:'CM-7(9)', f:'CM', n:'Prohibiting The Use of Unauthorized Hardware', bl:[]},
  {id:'CM-8', f:'CM', n:'System Component Inventory', bl:['L','M','H']},
  {id:'CM-8(1)', f:'CM', n:'Updates During Installation and Removal', bl:['M','H']},
  {id:'CM-8(2)', f:'CM', n:'Automated Maintenance', bl:['H']},
  {id:'CM-8(3)', f:'CM', n:'Automated Unauthorized Component Detection', bl:['M','H']},
  {id:'CM-8(4)', f:'CM', n:'Accountability Information', bl:['H']},
  {id:'CM-8(6)', f:'CM', n:'Assessed Configurations and Approved Deviations', bl:[]},
  {id:'CM-8(7)', f:'CM', n:'Centralized Repository', bl:[]},
  {id:'CM-8(8)', f:'CM', n:'Automated Location Tracking', bl:[]},
  {id:'CM-8(9)', f:'CM', n:'Assignment of Components to Systems', bl:[]},
  {id:'CM-9', f:'CM', n:'Configuration Management Plan', bl:['M','H']},
  {id:'CM-9(1)', f:'CM', n:'Assignment of Responsibility', bl:[]},
  {id:'CM-10', f:'CM', n:'Software Usage Restrictions', bl:['L','M','H']},
  {id:'CM-10(1)', f:'CM', n:'Open-source Software', bl:[]},
  {id:'CM-11', f:'CM', n:'User-installed Software', bl:['L','M','H']},
  {id:'CM-11(2)', f:'CM', n:'Software Installation with Privileged Status', bl:[]},
  {id:'CM-11(3)', f:'CM', n:'Automated Enforcement and Monitoring', bl:[]},
  {id:'CM-12', f:'CM', n:'Information Location', bl:['M','H']},
  {id:'CM-12(1)', f:'CM', n:'Automated Tools to Support Information Location', bl:['M','H']},
  {id:'CM-13', f:'CM', n:'Data Action Mapping', bl:[]},
  {id:'CM-14', f:'CM', n:'Signed Components', bl:[]},
  // CP — Contingency Planning
  {id:'CP-1', f:'CP', n:'Policy and Procedures', bl:['L','M','H']},
  {id:'CP-2', f:'CP', n:'Contingency Plan', bl:['L','M','H']},
  {id:'CP-2(1)', f:'CP', n:'Coordinate with Related Plans', bl:['M','H']},
  {id:'CP-2(2)', f:'CP', n:'Capacity Planning', bl:['H']},
  {id:'CP-2(3)', f:'CP', n:'Resume Mission and Business Functions', bl:['M','H']},
  {id:'CP-2(5)', f:'CP', n:'Continue Mission and Business Functions', bl:['H']},
  {id:'CP-2(6)', f:'CP', n:'Alternate Processing and Storage Sites', bl:[]},
  {id:'CP-2(7)', f:'CP', n:'Coordinate with External Service Providers', bl:[]},
  {id:'CP-2(8)', f:'CP', n:'Identify Critical Assets', bl:['M','H']},
  {id:'CP-3', f:'CP', n:'Contingency Training', bl:['L','M','H']},
  {id:'CP-3(1)', f:'CP', n:'Simulated Events', bl:['H']},
  {id:'CP-3(2)', f:'CP', n:'Mechanisms Used in Training Environments', bl:[]},
  {id:'CP-4', f:'CP', n:'Contingency Plan Testing', bl:['L','M','H']},
  {id:'CP-4(1)', f:'CP', n:'Coordinate with Related Plans', bl:['M','H']},
  {id:'CP-4(2)', f:'CP', n:'Alternate Processing Site', bl:['H']},
  {id:'CP-4(3)', f:'CP', n:'Automated Testing', bl:[]},
  {id:'CP-4(4)', f:'CP', n:'Full Recovery and Reconstitution', bl:[]},
  {id:'CP-4(5)', f:'CP', n:'Self-challenge', bl:[]},
  {id:'CP-6', f:'CP', n:'Alternate Storage Site', bl:['M','H']},
  {id:'CP-6(1)', f:'CP', n:'Separation from Primary Site', bl:['M','H']},
  {id:'CP-6(2)', f:'CP', n:'Recovery Time and Recovery Point Objectives', bl:['H']},
  {id:'CP-6(3)', f:'CP', n:'Accessibility', bl:['M','H']},
  {id:'CP-7', f:'CP', n:'Alternate Processing Site', bl:['M','H']},
  {id:'CP-7(1)', f:'CP', n:'Separation from Primary Site', bl:['M','H']},
  {id:'CP-7(2)', f:'CP', n:'Accessibility', bl:['M','H']},
  {id:'CP-7(3)', f:'CP', n:'Priority of Service', bl:['M','H']},
  {id:'CP-7(4)', f:'CP', n:'Preparation for Use', bl:['H']},
  {id:'CP-7(6)', f:'CP', n:'Inability to Return to Primary Site', bl:[]},
  {id:'CP-8', f:'CP', n:'Telecommunications Services', bl:['M','H']},
  {id:'CP-8(1)', f:'CP', n:'Priority of Service Provisions', bl:['M','H']},
  {id:'CP-8(2)', f:'CP', n:'Single Points of Failure', bl:['M','H']},
  {id:'CP-8(3)', f:'CP', n:'Separation of Primary and Alternate Providers', bl:['H']},
  {id:'CP-8(4)', f:'CP', n:'Provider Contingency Plan', bl:['H']},
  {id:'CP-8(5)', f:'CP', n:'Alternate Telecommunication Service Testing', bl:[]},
  {id:'CP-9', f:'CP', n:'System Backup', bl:['L','M','H']},
  {id:'CP-9(1)', f:'CP', n:'Testing for Reliability and Integrity', bl:['M','H']},
  {id:'CP-9(2)', f:'CP', n:'Test Restoration Using Sampling', bl:['H']},
  {id:'CP-9(3)', f:'CP', n:'Separate Storage for Critical Information', bl:['H']},
  {id:'CP-9(5)', f:'CP', n:'Transfer to Alternate Storage Site', bl:['H']},
  {id:'CP-9(6)', f:'CP', n:'Redundant Secondary System', bl:[]},
  {id:'CP-9(7)', f:'CP', n:'Dual Authorization', bl:[]},
  {id:'CP-9(8)', f:'CP', n:'Cryptographic Protection', bl:['M','H']},
  {id:'CP-10', f:'CP', n:'System Recovery and Reconstitution', bl:['L','M','H']},
  {id:'CP-10(2)', f:'CP', n:'Transaction Recovery', bl:['M','H']},
  {id:'CP-10(4)', f:'CP', n:'Restore Within Time Period', bl:['H']},
  {id:'CP-10(6)', f:'CP', n:'Component Protection', bl:[]},
  {id:'CP-11', f:'CP', n:'Alternate Communications Protocols', bl:[]},
  {id:'CP-12', f:'CP', n:'Safe Mode', bl:[]},
  {id:'CP-13', f:'CP', n:'Alternative Security Mechanisms', bl:[]},
  // IA — Identification and Authentication
  {id:'IA-1', f:'IA', n:'Policy and Procedures', bl:['L','M','H']},
  {id:'IA-2', f:'IA', n:'Identification and Authentication (organizational Users)', bl:['L','M','H']},
  {id:'IA-2(1)', f:'IA', n:'Multi-factor Authentication to Privileged Accounts', bl:['L','M','H']},
  {id:'IA-2(2)', f:'IA', n:'Multi-factor Authentication to Non-privileged Accounts', bl:['L','M','H']},
  {id:'IA-2(5)', f:'IA', n:'Individual Authentication with Group Authentication', bl:['H']},
  {id:'IA-2(6)', f:'IA', n:'Access to Accounts — Separate Device', bl:[]},
  {id:'IA-2(8)', f:'IA', n:'Access to Accounts — Replay Resistant', bl:['L','M','H']},
  {id:'IA-2(10)', f:'IA', n:'Single Sign-on', bl:[]},
  {id:'IA-2(12)', f:'IA', n:'Acceptance of PIV Credentials', bl:['L','M','H']},
  {id:'IA-2(13)', f:'IA', n:'Out-of-band Authentication', bl:[]},
  {id:'IA-3', f:'IA', n:'Device Identification and Authentication', bl:['M','H']},
  {id:'IA-3(1)', f:'IA', n:'Cryptographic Bidirectional Authentication', bl:[]},
  {id:'IA-3(3)', f:'IA', n:'Dynamic Address Allocation', bl:[]},
  {id:'IA-3(4)', f:'IA', n:'Device Attestation', bl:[]},
  {id:'IA-4', f:'IA', n:'Identifier Management', bl:['L','M','H']},
  {id:'IA-4(1)', f:'IA', n:'Prohibit Account Identifiers as Public Identifiers', bl:[]},
  {id:'IA-4(4)', f:'IA', n:'Identify User Status', bl:['M','H']},
  {id:'IA-4(5)', f:'IA', n:'Dynamic Management', bl:[]},
  {id:'IA-4(6)', f:'IA', n:'Cross-organization Management', bl:[]},
  {id:'IA-4(8)', f:'IA', n:'Pairwise Pseudonymous Identifiers', bl:[]},
  {id:'IA-4(9)', f:'IA', n:'Attribute Maintenance and Protection', bl:[]},
  {id:'IA-5', f:'IA', n:'Authenticator Management', bl:['L','M','H']},
  {id:'IA-5(1)', f:'IA', n:'Password-based Authentication', bl:['L','M','H']},
  {id:'IA-5(2)', f:'IA', n:'Public Key-based Authentication', bl:['M','H']},
  {id:'IA-5(5)', f:'IA', n:'Change Authenticators Prior to Delivery', bl:[]},
  {id:'IA-5(6)', f:'IA', n:'Protection of Authenticators', bl:['M','H']},
  {id:'IA-5(7)', f:'IA', n:'No Embedded Unencrypted Static Authenticators', bl:[]},
  {id:'IA-5(8)', f:'IA', n:'Multiple System Accounts', bl:[]},
  {id:'IA-5(9)', f:'IA', n:'Federated Credential Management', bl:[]},
  {id:'IA-5(10)', f:'IA', n:'Dynamic Credential Binding', bl:[]},
  {id:'IA-5(12)', f:'IA', n:'Biometric Authentication Performance', bl:[]},
  {id:'IA-5(13)', f:'IA', n:'Expiration of Cached Authenticators', bl:[]},
  {id:'IA-5(14)', f:'IA', n:'Managing Content of PKI Trust Stores', bl:[]},
  {id:'IA-5(15)', f:'IA', n:'GSA-approved Products and Services', bl:[]},
  {id:'IA-5(16)', f:'IA', n:'In-person or Trusted External Party Authenticator Issuance', bl:[]},
  {id:'IA-5(17)', f:'IA', n:'Presentation Attack Detection for Biometric Authenticators', bl:[]},
  {id:'IA-5(18)', f:'IA', n:'Password Managers', bl:[]},
  {id:'IA-6', f:'IA', n:'Authentication Feedback', bl:['L','M','H']},
  {id:'IA-7', f:'IA', n:'Cryptographic Module Authentication', bl:['L','M','H']},
  {id:'IA-8', f:'IA', n:'Identification and Authentication (non-organizational Users)', bl:['L','M','H']},
  {id:'IA-8(1)', f:'IA', n:'Acceptance of PIV Credentials from Other Agencies', bl:['L','M','H']},
  {id:'IA-8(2)', f:'IA', n:'Acceptance of External Authenticators', bl:['L','M','H']},
  {id:'IA-8(4)', f:'IA', n:'Use of Defined Profiles', bl:['L','M','H']},
  {id:'IA-8(5)', f:'IA', n:'Acceptance of PIV-I Credentials', bl:[]},
  {id:'IA-8(6)', f:'IA', n:'Disassociability', bl:[]},
  {id:'IA-9', f:'IA', n:'Service Identification and Authentication', bl:[]},
  {id:'IA-10', f:'IA', n:'Adaptive Authentication', bl:[]},
  {id:'IA-11', f:'IA', n:'Re-authentication', bl:['L','M','H']},
  {id:'IA-12', f:'IA', n:'Identity Proofing', bl:['M','H']},
  {id:'IA-12(1)', f:'IA', n:'Supervisor Authorization', bl:[]},
  {id:'IA-12(2)', f:'IA', n:'Identity Evidence', bl:['M','H']},
  {id:'IA-12(3)', f:'IA', n:'Identity Evidence Validation and Verification', bl:['M','H']},
  {id:'IA-12(4)', f:'IA', n:'In-person Validation and Verification', bl:['H']},
  {id:'IA-12(5)', f:'IA', n:'Address Confirmation', bl:['M','H']},
  {id:'IA-12(6)', f:'IA', n:'Accept Externally-proofed Identities', bl:[]},
  // IR — Incident Response
  {id:'IR-1', f:'IR', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'IR-2', f:'IR', n:'Incident Response Training', bl:['L','M','H','P']},
  {id:'IR-2(1)', f:'IR', n:'Simulated Events', bl:['H']},
  {id:'IR-2(2)', f:'IR', n:'Automated Training Environments', bl:['H']},
  {id:'IR-2(3)', f:'IR', n:'Breach', bl:['P']},
  {id:'IR-3', f:'IR', n:'Incident Response Testing', bl:['M','H','P']},
  {id:'IR-3(1)', f:'IR', n:'Automated Testing', bl:[]},
  {id:'IR-3(2)', f:'IR', n:'Coordination with Related Plans', bl:['M','H']},
  {id:'IR-3(3)', f:'IR', n:'Continuous Improvement', bl:[]},
  {id:'IR-4', f:'IR', n:'Incident Handling', bl:['L','M','H','P']},
  {id:'IR-4(1)', f:'IR', n:'Automated Incident Handling Processes', bl:['M','H']},
  {id:'IR-4(2)', f:'IR', n:'Dynamic Reconfiguration', bl:[]},
  {id:'IR-4(3)', f:'IR', n:'Continuity of Operations', bl:[]},
  {id:'IR-4(4)', f:'IR', n:'Information Correlation', bl:['H']},
  {id:'IR-4(5)', f:'IR', n:'Automatic Disabling of System', bl:[]},
  {id:'IR-4(6)', f:'IR', n:'Insider Threats', bl:[]},
  {id:'IR-4(7)', f:'IR', n:'Insider Threats — Intra-organization Coordination', bl:[]},
  {id:'IR-4(8)', f:'IR', n:'Correlation with External Organizations', bl:[]},
  {id:'IR-4(9)', f:'IR', n:'Dynamic Response Capability', bl:[]},
  {id:'IR-4(10)', f:'IR', n:'Supply Chain Coordination', bl:[]},
  {id:'IR-4(11)', f:'IR', n:'Integrated Incident Response Team', bl:['H']},
  {id:'IR-4(12)', f:'IR', n:'Malicious Code and Forensic Analysis', bl:[]},
  {id:'IR-4(13)', f:'IR', n:'Behavior Analysis', bl:[]},
  {id:'IR-4(14)', f:'IR', n:'Security Operations Center', bl:[]},
  {id:'IR-4(15)', f:'IR', n:'Public Relations and Reputation Repair', bl:[]},
  {id:'IR-5', f:'IR', n:'Incident Monitoring', bl:['L','M','H','P']},
  {id:'IR-5(1)', f:'IR', n:'Automated Tracking, Data Collection, and Analysis', bl:['H']},
  {id:'IR-6', f:'IR', n:'Incident Reporting', bl:['L','M','H','P']},
  {id:'IR-6(1)', f:'IR', n:'Automated Reporting', bl:['M','H']},
  {id:'IR-6(2)', f:'IR', n:'Vulnerabilities Related to Incidents', bl:[]},
  {id:'IR-6(3)', f:'IR', n:'Supply Chain Coordination', bl:['M','H']},
  {id:'IR-7', f:'IR', n:'Incident Response Assistance', bl:['L','M','H','P']},
  {id:'IR-7(1)', f:'IR', n:'Automation Support for Availability of Information and Support', bl:['M','H']},
  {id:'IR-7(2)', f:'IR', n:'Coordination with External Providers', bl:[]},
  {id:'IR-8', f:'IR', n:'Incident Response Plan', bl:['L','M','H','P']},
  {id:'IR-8(1)', f:'IR', n:'Breaches', bl:['P']},
  {id:'IR-9', f:'IR', n:'Information Spillage Response', bl:[]},
  {id:'IR-9(2)', f:'IR', n:'Training', bl:[]},
  {id:'IR-9(3)', f:'IR', n:'Post-spill Operations', bl:[]},
  {id:'IR-9(4)', f:'IR', n:'Exposure to Unauthorized Personnel', bl:[]},
  // MA — Maintenance
  {id:'MA-1', f:'MA', n:'Policy and Procedures', bl:['L','M','H']},
  {id:'MA-2', f:'MA', n:'Controlled Maintenance', bl:['L','M','H']},
  {id:'MA-2(2)', f:'MA', n:'Automated Maintenance Activities', bl:['H']},
  {id:'MA-3', f:'MA', n:'Maintenance Tools', bl:['M','H']},
  {id:'MA-3(1)', f:'MA', n:'Inspect Tools', bl:['M','H']},
  {id:'MA-3(2)', f:'MA', n:'Inspect Media', bl:['M','H']},
  {id:'MA-3(3)', f:'MA', n:'Prevent Unauthorized Removal', bl:['M','H']},
  {id:'MA-3(4)', f:'MA', n:'Restricted Tool Use', bl:[]},
  {id:'MA-3(5)', f:'MA', n:'Execution with Privilege', bl:[]},
  {id:'MA-3(6)', f:'MA', n:'Software Updates and Patches', bl:[]},
  {id:'MA-4', f:'MA', n:'Nonlocal Maintenance', bl:['L','M','H']},
  {id:'MA-4(1)', f:'MA', n:'Logging and Review', bl:[]},
  {id:'MA-4(3)', f:'MA', n:'Comparable Security and Sanitization', bl:['H']},
  {id:'MA-4(4)', f:'MA', n:'Authentication and Separation of Maintenance Sessions', bl:[]},
  {id:'MA-4(5)', f:'MA', n:'Approvals and Notifications', bl:[]},
  {id:'MA-4(6)', f:'MA', n:'Cryptographic Protection', bl:[]},
  {id:'MA-4(7)', f:'MA', n:'Disconnect Verification', bl:[]},
  {id:'MA-5', f:'MA', n:'Maintenance Personnel', bl:['L','M','H']},
  {id:'MA-5(1)', f:'MA', n:'Individuals Without Appropriate Access', bl:['H']},
  {id:'MA-5(2)', f:'MA', n:'Security Clearances for Classified Systems', bl:[]},
  {id:'MA-5(3)', f:'MA', n:'Citizenship Requirements for Classified Systems', bl:[]},
  {id:'MA-5(4)', f:'MA', n:'Foreign Nationals', bl:[]},
  {id:'MA-5(5)', f:'MA', n:'Non-system Maintenance', bl:[]},
  {id:'MA-6', f:'MA', n:'Timely Maintenance', bl:['M','H']},
  {id:'MA-6(1)', f:'MA', n:'Preventive Maintenance', bl:[]},
  {id:'MA-6(2)', f:'MA', n:'Predictive Maintenance', bl:[]},
  {id:'MA-6(3)', f:'MA', n:'Automated Support for Predictive Maintenance', bl:[]},
  {id:'MA-7', f:'MA', n:'Field Maintenance', bl:[]},
  // MP — Media Protection
  {id:'MP-1', f:'MP', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'MP-2', f:'MP', n:'Media Access', bl:['L','M','H']},
  {id:'MP-3', f:'MP', n:'Media Marking', bl:['M','H']},
  {id:'MP-4', f:'MP', n:'Media Storage', bl:['M','H']},
  {id:'MP-4(2)', f:'MP', n:'Automated Restricted Access', bl:[]},
  {id:'MP-5', f:'MP', n:'Media Transport', bl:['M','H']},
  {id:'MP-5(3)', f:'MP', n:'Custodians', bl:[]},
  {id:'MP-6', f:'MP', n:'Media Sanitization', bl:['L','M','H','P']},
  {id:'MP-6(1)', f:'MP', n:'Review, Approve, Track, Document, and Verify', bl:['H']},
  {id:'MP-6(2)', f:'MP', n:'Equipment Testing', bl:['H']},
  {id:'MP-6(3)', f:'MP', n:'Nondestructive Techniques', bl:['H']},
  {id:'MP-6(7)', f:'MP', n:'Dual Authorization', bl:[]},
  {id:'MP-6(8)', f:'MP', n:'Remote Purging or Wiping of Information', bl:[]},
  {id:'MP-7', f:'MP', n:'Media Use', bl:['L','M','H']},
  {id:'MP-7(2)', f:'MP', n:'Prohibit Use of Sanitization-resistant Media', bl:[]},
  {id:'MP-8', f:'MP', n:'Media Downgrading', bl:[]},
  {id:'MP-8(1)', f:'MP', n:'Documentation of Process', bl:[]},
  {id:'MP-8(2)', f:'MP', n:'Equipment Testing', bl:[]},
  {id:'MP-8(3)', f:'MP', n:'Controlled Unclassified Information', bl:[]},
  {id:'MP-8(4)', f:'MP', n:'Classified Information', bl:[]},
  // PE — Physical and Environmental Protection
  {id:'PE-1', f:'PE', n:'Policy and Procedures', bl:['L','M','H']},
  {id:'PE-2', f:'PE', n:'Physical Access Authorizations', bl:['L','M','H']},
  {id:'PE-2(1)', f:'PE', n:'Access by Position or Role', bl:[]},
  {id:'PE-2(2)', f:'PE', n:'Two Forms of Identification', bl:[]},
  {id:'PE-2(3)', f:'PE', n:'Restrict Unescorted Access', bl:[]},
  {id:'PE-3', f:'PE', n:'Physical Access Control', bl:['L','M','H']},
  {id:'PE-3(1)', f:'PE', n:'System Access', bl:['H']},
  {id:'PE-3(2)', f:'PE', n:'Facility and Systems', bl:[]},
  {id:'PE-3(3)', f:'PE', n:'Continuous Guards', bl:[]},
  {id:'PE-3(4)', f:'PE', n:'Lockable Casings', bl:[]},
  {id:'PE-3(5)', f:'PE', n:'Tamper Protection', bl:[]},
  {id:'PE-3(7)', f:'PE', n:'Physical Barriers', bl:[]},
  {id:'PE-3(8)', f:'PE', n:'Access Control Vestibules', bl:[]},
  {id:'PE-4', f:'PE', n:'Access Control for Transmission', bl:['M','H']},
  {id:'PE-5', f:'PE', n:'Access Control for Output Devices', bl:['M','H']},
  {id:'PE-5(2)', f:'PE', n:'Link to Individual Identity', bl:[]},
  {id:'PE-6', f:'PE', n:'Monitoring Physical Access', bl:['L','M','H']},
  {id:'PE-6(1)', f:'PE', n:'Intrusion Alarms and Surveillance Equipment', bl:['M','H']},
  {id:'PE-6(2)', f:'PE', n:'Automated Intrusion Recognition and Responses', bl:[]},
  {id:'PE-6(3)', f:'PE', n:'Video Surveillance', bl:[]},
  {id:'PE-6(4)', f:'PE', n:'Monitoring Physical Access to Systems', bl:['H']},
  {id:'PE-8', f:'PE', n:'Visitor Access Records', bl:['L','M','H']},
  {id:'PE-8(1)', f:'PE', n:'Automated Records Maintenance and Review', bl:['H']},
  {id:'PE-8(3)', f:'PE', n:'Limit Personally Identifiable Information Elements', bl:['P']},
  {id:'PE-9', f:'PE', n:'Power Equipment and Cabling', bl:['M','H']},
  {id:'PE-9(1)', f:'PE', n:'Redundant Cabling', bl:[]},
  {id:'PE-9(2)', f:'PE', n:'Automatic Voltage Controls', bl:[]},
  {id:'PE-10', f:'PE', n:'Emergency Shutoff', bl:['M','H']},
  {id:'PE-11', f:'PE', n:'Emergency Power', bl:['M','H']},
  {id:'PE-11(1)', f:'PE', n:'Alternate Power Supply — Minimal Operational Capability', bl:['H']},
  {id:'PE-11(2)', f:'PE', n:'Alternate Power Supply — Self-contained', bl:[]},
  {id:'PE-12', f:'PE', n:'Emergency Lighting', bl:['L','M','H']},
  {id:'PE-12(1)', f:'PE', n:'Essential Mission and Business Functions', bl:[]},
  {id:'PE-13', f:'PE', n:'Fire Protection', bl:['L','M','H']},
  {id:'PE-13(1)', f:'PE', n:'Detection Systems – Automatic Activation and Notification', bl:['M','H']},
  {id:'PE-13(2)', f:'PE', n:'Suppression Systems – Automatic Activation and Notification', bl:['H']},
  {id:'PE-13(4)', f:'PE', n:'Inspections', bl:[]},
  {id:'PE-14', f:'PE', n:'Environmental Controls', bl:['L','M','H']},
  {id:'PE-14(1)', f:'PE', n:'Automatic Controls', bl:[]},
  {id:'PE-14(2)', f:'PE', n:'Monitoring with Alarms and Notifications', bl:[]},
  {id:'PE-15', f:'PE', n:'Water Damage Protection', bl:['L','M','H']},
  {id:'PE-15(1)', f:'PE', n:'Automation Support', bl:['H']},
  {id:'PE-16', f:'PE', n:'Delivery and Removal', bl:['L','M','H']},
  {id:'PE-17', f:'PE', n:'Alternate Work Site', bl:['M','H']},
  {id:'PE-18', f:'PE', n:'Location of System Components', bl:['H']},
  {id:'PE-19', f:'PE', n:'Information Leakage', bl:[]},
  {id:'PE-19(1)', f:'PE', n:'National Emissions and Tempest Policies and Procedures', bl:[]},
  {id:'PE-20', f:'PE', n:'Asset Monitoring and Tracking', bl:[]},
  {id:'PE-21', f:'PE', n:'Electromagnetic Pulse Protection', bl:[]},
  {id:'PE-22', f:'PE', n:'Component Marking', bl:[]},
  {id:'PE-23', f:'PE', n:'Facility Location', bl:[]},
  // PL — Planning
  {id:'PL-1', f:'PL', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'PL-2', f:'PL', n:'System Security and Privacy Plans', bl:['L','M','H','P']},
  {id:'PL-4', f:'PL', n:'Rules of Behavior', bl:['L','M','H','P']},
  {id:'PL-4(1)', f:'PL', n:'Social Media and External Site/application Usage Restrictions', bl:['L','M','H','P']},
  {id:'PL-7', f:'PL', n:'Concept of Operations', bl:[]},
  {id:'PL-8', f:'PL', n:'Security and Privacy Architectures', bl:['M','H','P']},
  {id:'PL-8(1)', f:'PL', n:'Defense in Depth', bl:[]},
  {id:'PL-8(2)', f:'PL', n:'Supplier Diversity', bl:[]},
  {id:'PL-9', f:'PL', n:'Central Management', bl:['P']},
  {id:'PL-10', f:'PL', n:'Baseline Selection', bl:['L','M','H']},
  {id:'PL-11', f:'PL', n:'Baseline Tailoring', bl:['L','M','H']},
  // PM — Program Management
  {id:'PM-1', f:'PM', n:'Information Security Program Plan', bl:['L','M','H']},
  {id:'PM-2', f:'PM', n:'Information Security Program Leadership Role', bl:['L','M','H']},
  {id:'PM-3', f:'PM', n:'Information Security and Privacy Resources', bl:['L','M','H','P']},
  {id:'PM-4', f:'PM', n:'Plan of Action and Milestones Process', bl:['L','M','H','P']},
  {id:'PM-5', f:'PM', n:'System Inventory', bl:['L','M','H']},
  {id:'PM-5(1)', f:'PM', n:'Inventory of Personally Identifiable Information', bl:['L','M','H','P']},
  {id:'PM-6', f:'PM', n:'Measures of Performance', bl:['L','M','H','P']},
  {id:'PM-7', f:'PM', n:'Enterprise Architecture', bl:['L','M','H','P']},
  {id:'PM-7(1)', f:'PM', n:'Offloading', bl:['L','M','H']},
  {id:'PM-8', f:'PM', n:'Critical Infrastructure Plan', bl:['L','M','H','P']},
  {id:'PM-9', f:'PM', n:'Risk Management Strategy', bl:['L','M','H','P']},
  {id:'PM-10', f:'PM', n:'Authorization Process', bl:['L','M','H','P']},
  {id:'PM-11', f:'PM', n:'Mission and Business Process Definition', bl:['L','M','H','P']},
  {id:'PM-12', f:'PM', n:'Insider Threat Program', bl:['L','M','H']},
  {id:'PM-13', f:'PM', n:'Security and Privacy Workforce', bl:['L','M','H','P']},
  {id:'PM-14', f:'PM', n:'Testing, Training, and Monitoring', bl:['L','M','H','P']},
  {id:'PM-15', f:'PM', n:'Security and Privacy Groups and Associations', bl:['L','M','H']},
  {id:'PM-16', f:'PM', n:'Threat Awareness Program', bl:['L','M','H']},
  {id:'PM-16(1)', f:'PM', n:'Automated Means for Sharing Threat Intelligence', bl:['L','M','H']},
  {id:'PM-17', f:'PM', n:'Protecting Controlled Unclassified Information on External Systems', bl:['L','M','H','P']},
  {id:'PM-18', f:'PM', n:'Privacy Program Plan', bl:['L','M','H','P']},
  {id:'PM-19', f:'PM', n:'Privacy Program Leadership Role', bl:['L','M','H','P']},
  {id:'PM-20', f:'PM', n:'Dissemination of Privacy Program Information', bl:['L','M','H','P']},
  {id:'PM-20(1)', f:'PM', n:'Privacy Policies on Websites, Applications, and Digital Services', bl:['L','M','H','P']},
  {id:'PM-21', f:'PM', n:'Accounting of Disclosures', bl:['L','M','H','P']},
  {id:'PM-22', f:'PM', n:'Personally Identifiable Information Quality Management', bl:['L','M','H','P']},
  {id:'PM-23', f:'PM', n:'Data Governance Body', bl:['L','M','H']},
  {id:'PM-24', f:'PM', n:'Data Integrity Board', bl:['L','M','H','P']},
  {id:'PM-25', f:'PM', n:'Minimization of Personally Identifiable Information Used in Testing, Training, and Research', bl:['L','M','H','P']},
  {id:'PM-26', f:'PM', n:'Complaint Management', bl:['L','M','H','P']},
  {id:'PM-27', f:'PM', n:'Privacy Reporting', bl:['L','M','H','P']},
  {id:'PM-28', f:'PM', n:'Risk Framing', bl:['L','M','H','P']},
  {id:'PM-29', f:'PM', n:'Risk Management Program Leadership Roles', bl:['L','M','H']},
  {id:'PM-30', f:'PM', n:'Supply Chain Risk Management Strategy', bl:['L','M','H']},
  {id:'PM-30(1)', f:'PM', n:'Suppliers of Critical or Mission-essential Items', bl:['L','M','H']},
  {id:'PM-31', f:'PM', n:'Continuous Monitoring Strategy', bl:['L','M','H','P']},
  {id:'PM-32', f:'PM', n:'Purposing', bl:['L','M','H']},
  // PS — Personnel Security
  {id:'PS-1', f:'PS', n:'Policy and Procedures', bl:['L','M','H']},
  {id:'PS-2', f:'PS', n:'Position Risk Designation', bl:['L','M','H']},
  {id:'PS-3', f:'PS', n:'Personnel Screening', bl:['L','M','H']},
  {id:'PS-3(1)', f:'PS', n:'Classified Information', bl:[]},
  {id:'PS-3(2)', f:'PS', n:'Formal Indoctrination', bl:[]},
  {id:'PS-3(3)', f:'PS', n:'Information with Special Protective Measures', bl:[]},
  {id:'PS-3(4)', f:'PS', n:'Citizenship Requirements', bl:[]},
  {id:'PS-4', f:'PS', n:'Personnel Termination', bl:['L','M','H']},
  {id:'PS-4(1)', f:'PS', n:'Post-employment Requirements', bl:[]},
  {id:'PS-4(2)', f:'PS', n:'Automated Actions', bl:['H']},
  {id:'PS-5', f:'PS', n:'Personnel Transfer', bl:['L','M','H']},
  {id:'PS-6', f:'PS', n:'Access Agreements', bl:['L','M','H','P']},
  {id:'PS-6(2)', f:'PS', n:'Classified Information Requiring Special Protection', bl:[]},
  {id:'PS-6(3)', f:'PS', n:'Post-employment Requirements', bl:[]},
  {id:'PS-7', f:'PS', n:'External Personnel Security', bl:['L','M','H']},
  {id:'PS-8', f:'PS', n:'Personnel Sanctions', bl:['L','M','H']},
  {id:'PS-9', f:'PS', n:'Position Descriptions', bl:['L','M','H']},
  // RA — Risk Assessment
  {id:'RA-1', f:'RA', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'RA-2', f:'RA', n:'Security Categorization', bl:['L','M','H']},
  {id:'RA-2(1)', f:'RA', n:'Impact-level Prioritization', bl:[]},
  {id:'RA-3', f:'RA', n:'Risk Assessment', bl:['L','M','H','P']},
  {id:'RA-3(1)', f:'RA', n:'Supply Chain Risk Assessment', bl:['L','M','H']},
  {id:'RA-3(2)', f:'RA', n:'Use of All-source Intelligence', bl:[]},
  {id:'RA-3(3)', f:'RA', n:'Dynamic Threat Awareness', bl:[]},
  {id:'RA-3(4)', f:'RA', n:'Predictive Cyber Analytics', bl:[]},
  {id:'RA-5', f:'RA', n:'Vulnerability Monitoring and Scanning', bl:['L','M','H']},
  {id:'RA-5(2)', f:'RA', n:'Update Vulnerabilities to Be Scanned', bl:['L','M','H']},
  {id:'RA-5(3)', f:'RA', n:'Breadth and Depth of Coverage', bl:[]},
  {id:'RA-5(4)', f:'RA', n:'Discoverable Information', bl:['H']},
  {id:'RA-5(5)', f:'RA', n:'Privileged Access', bl:['M','H']},
  {id:'RA-5(6)', f:'RA', n:'Automated Trend Analyses', bl:[]},
  {id:'RA-5(8)', f:'RA', n:'Review Historic Audit Logs', bl:[]},
  {id:'RA-5(10)', f:'RA', n:'Correlate Scanning Information', bl:[]},
  {id:'RA-5(11)', f:'RA', n:'Public Disclosure Program', bl:['L','M','H']},
  {id:'RA-6', f:'RA', n:'Technical Surveillance Countermeasures Survey', bl:[]},
  {id:'RA-7', f:'RA', n:'Risk Response', bl:['L','M','H','P']},
  {id:'RA-8', f:'RA', n:'Privacy Impact Assessments', bl:['P']},
  {id:'RA-9', f:'RA', n:'Criticality Analysis', bl:['M','H']},
  {id:'RA-10', f:'RA', n:'Threat Hunting', bl:[]},
  // SA — System and Services Acquisition
  {id:'SA-1', f:'SA', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'SA-2', f:'SA', n:'Allocation of Resources', bl:['L','M','H','P']},
  {id:'SA-3', f:'SA', n:'System Development Life Cycle', bl:['L','M','H','P']},
  {id:'SA-3(1)', f:'SA', n:'Manage Preproduction Environment', bl:[]},
  {id:'SA-3(2)', f:'SA', n:'Use of Live or Operational Data', bl:[]},
  {id:'SA-3(3)', f:'SA', n:'Technology Refresh', bl:[]},
  {id:'SA-4', f:'SA', n:'Acquisition Process', bl:['L','M','H','P']},
  {id:'SA-4(1)', f:'SA', n:'Functional Properties of Controls', bl:['M','H']},
  {id:'SA-4(2)', f:'SA', n:'Design and Implementation Information for Controls', bl:['M','H']},
  {id:'SA-4(3)', f:'SA', n:'Development Methods, Techniques, and Practices', bl:[]},
  {id:'SA-4(5)', f:'SA', n:'System, Component, and Service Configurations', bl:['H']},
  {id:'SA-4(6)', f:'SA', n:'Use of Information Assurance Products', bl:[]},
  {id:'SA-4(7)', f:'SA', n:'NIAP-approved Protection Profiles', bl:[]},
  {id:'SA-4(8)', f:'SA', n:'Continuous Monitoring Plan for Controls', bl:[]},
  {id:'SA-4(9)', f:'SA', n:'Functions, Ports, Protocols, and Services in Use', bl:['M','H']},
  {id:'SA-4(10)', f:'SA', n:'Use of Approved PIV Products', bl:['L','M','H']},
  {id:'SA-4(11)', f:'SA', n:'System of Records', bl:[]},
  {id:'SA-4(12)', f:'SA', n:'Data Ownership', bl:[]},
  {id:'SA-5', f:'SA', n:'System Documentation', bl:['L','M','H']},
  {id:'SA-8', f:'SA', n:'Security and Privacy Engineering Principles', bl:['L','M','H']},
  {id:'SA-8(1)', f:'SA', n:'Clear Abstractions', bl:[]},
  {id:'SA-8(2)', f:'SA', n:'Least Common Mechanism', bl:[]},
  {id:'SA-8(3)', f:'SA', n:'Modularity and Layering', bl:[]},
  {id:'SA-8(4)', f:'SA', n:'Partially Ordered Dependencies', bl:[]},
  {id:'SA-8(5)', f:'SA', n:'Efficiently Mediated Access', bl:[]},
  {id:'SA-8(6)', f:'SA', n:'Minimized Sharing', bl:[]},
  {id:'SA-8(7)', f:'SA', n:'Reduced Complexity', bl:[]},
  {id:'SA-8(8)', f:'SA', n:'Secure Evolvability', bl:[]},
  {id:'SA-8(9)', f:'SA', n:'Trusted Components', bl:[]},
  {id:'SA-8(10)', f:'SA', n:'Hierarchical Trust', bl:[]},
  {id:'SA-8(11)', f:'SA', n:'Inverse Modification Threshold', bl:[]},
  {id:'SA-8(12)', f:'SA', n:'Hierarchical Protection', bl:[]},
  {id:'SA-8(13)', f:'SA', n:'Minimized Security Elements', bl:[]},
  {id:'SA-8(14)', f:'SA', n:'Least Privilege', bl:[]},
  {id:'SA-8(15)', f:'SA', n:'Predicate Permission', bl:[]},
  {id:'SA-8(16)', f:'SA', n:'Self-reliant Trustworthiness', bl:[]},
  {id:'SA-8(17)', f:'SA', n:'Secure Distributed Composition', bl:[]},
  {id:'SA-8(18)', f:'SA', n:'Trusted Communications Channels', bl:[]},
  {id:'SA-8(19)', f:'SA', n:'Continuous Protection', bl:[]},
  {id:'SA-8(20)', f:'SA', n:'Secure Metadata Management', bl:[]},
  {id:'SA-8(21)', f:'SA', n:'Self-analysis', bl:[]},
  {id:'SA-8(22)', f:'SA', n:'Accountability and Traceability', bl:[]},
  {id:'SA-8(23)', f:'SA', n:'Secure Defaults', bl:[]},
  {id:'SA-8(24)', f:'SA', n:'Secure Failure and Recovery', bl:[]},
  {id:'SA-8(25)', f:'SA', n:'Economic Security', bl:[]},
  {id:'SA-8(26)', f:'SA', n:'Performance Security', bl:[]},
  {id:'SA-8(27)', f:'SA', n:'Human Factored Security', bl:[]},
  {id:'SA-8(28)', f:'SA', n:'Acceptable Security', bl:[]},
  {id:'SA-8(29)', f:'SA', n:'Repeatable and Documented Procedures', bl:[]},
  {id:'SA-8(30)', f:'SA', n:'Procedural Rigor', bl:[]},
  {id:'SA-8(31)', f:'SA', n:'Secure System Modification', bl:[]},
  {id:'SA-8(32)', f:'SA', n:'Sufficient Documentation', bl:[]},
  {id:'SA-8(33)', f:'SA', n:'Minimization', bl:['P']},
  {id:'SA-9', f:'SA', n:'External System Services', bl:['L','M','H','P']},
  {id:'SA-9(1)', f:'SA', n:'Risk Assessments and Organizational Approvals', bl:[]},
  {id:'SA-9(2)', f:'SA', n:'Identification of Functions, Ports, Protocols, and Services', bl:['M','H']},
  {id:'SA-9(3)', f:'SA', n:'Establish and Maintain Trust Relationship with Providers', bl:[]},
  {id:'SA-9(4)', f:'SA', n:'Consistent Interests of Consumers and Providers', bl:[]},
  {id:'SA-9(5)', f:'SA', n:'Processing, Storage, and Service Location', bl:[]},
  {id:'SA-9(6)', f:'SA', n:'Organization-controlled Cryptographic Keys', bl:[]},
  {id:'SA-9(7)', f:'SA', n:'Organization-controlled Integrity Checking', bl:[]},
  {id:'SA-9(8)', f:'SA', n:'Processing and Storage Location — U.S. Jurisdiction', bl:[]},
  {id:'SA-10', f:'SA', n:'Developer Configuration Management', bl:['M','H']},
  {id:'SA-10(1)', f:'SA', n:'Software and Firmware Integrity Verification', bl:[]},
  {id:'SA-10(2)', f:'SA', n:'Alternative Configuration Management', bl:[]},
  {id:'SA-10(3)', f:'SA', n:'Hardware Integrity Verification', bl:[]},
  {id:'SA-10(4)', f:'SA', n:'Trusted Generation', bl:[]},
  {id:'SA-10(5)', f:'SA', n:'Mapping Integrity for Version Control', bl:[]},
  {id:'SA-10(6)', f:'SA', n:'Trusted Distribution', bl:[]},
  {id:'SA-10(7)', f:'SA', n:'Security and Privacy Representatives', bl:[]},
  {id:'SA-11', f:'SA', n:'Developer Testing and Evaluation', bl:['M','H','P']},
  {id:'SA-11(1)', f:'SA', n:'Static Code Analysis', bl:[]},
  {id:'SA-11(2)', f:'SA', n:'Threat Modeling and Vulnerability Analyses', bl:[]},
  {id:'SA-11(3)', f:'SA', n:'Independent Verification of Assessment Plans and Evidence', bl:[]},
  {id:'SA-11(4)', f:'SA', n:'Manual Code Reviews', bl:[]},
  {id:'SA-11(5)', f:'SA', n:'Penetration Testing', bl:[]},
  {id:'SA-11(6)', f:'SA', n:'Attack Surface Reviews', bl:[]},
  {id:'SA-11(7)', f:'SA', n:'Verify Scope of Testing and Evaluation', bl:[]},
  {id:'SA-11(8)', f:'SA', n:'Dynamic Code Analysis', bl:[]},
  {id:'SA-11(9)', f:'SA', n:'Interactive Application Security Testing', bl:[]},
  {id:'SA-15', f:'SA', n:'Development Process, Standards, and Tools', bl:['M','H']},
  {id:'SA-15(1)', f:'SA', n:'Quality Metrics', bl:[]},
  {id:'SA-15(2)', f:'SA', n:'Security and Privacy Tracking Tools', bl:[]},
  {id:'SA-15(3)', f:'SA', n:'Criticality Analysis', bl:['M','H']},
  {id:'SA-15(5)', f:'SA', n:'Attack Surface Reduction', bl:[]},
  {id:'SA-15(6)', f:'SA', n:'Continuous Improvement', bl:[]},
  {id:'SA-15(7)', f:'SA', n:'Automated Vulnerability Analysis', bl:[]},
  {id:'SA-15(8)', f:'SA', n:'Reuse of Threat and Vulnerability Information', bl:[]},
  {id:'SA-15(10)', f:'SA', n:'Incident Response Plan', bl:[]},
  {id:'SA-15(11)', f:'SA', n:'Archive System or Component', bl:[]},
  {id:'SA-15(12)', f:'SA', n:'Minimize Personally Identifiable Information', bl:[]},
  {id:'SA-16', f:'SA', n:'Developer-provided Training', bl:['H']},
  {id:'SA-17', f:'SA', n:'Developer Security and Privacy Architecture and Design', bl:['H']},
  {id:'SA-17(1)', f:'SA', n:'Formal Policy Model', bl:[]},
  {id:'SA-17(2)', f:'SA', n:'Security-relevant Components', bl:[]},
  {id:'SA-17(3)', f:'SA', n:'Formal Correspondence', bl:[]},
  {id:'SA-17(4)', f:'SA', n:'Informal Correspondence', bl:[]},
  {id:'SA-17(5)', f:'SA', n:'Conceptually Simple Design', bl:[]},
  {id:'SA-17(6)', f:'SA', n:'Structure for Testing', bl:[]},
  {id:'SA-17(7)', f:'SA', n:'Structure for Least Privilege', bl:[]},
  {id:'SA-17(8)', f:'SA', n:'Orchestration', bl:[]},
  {id:'SA-17(9)', f:'SA', n:'Design Diversity', bl:[]},
  {id:'SA-20', f:'SA', n:'Customized Development of Critical Components', bl:[]},
  {id:'SA-21', f:'SA', n:'Developer Screening', bl:['H']},
  {id:'SA-22', f:'SA', n:'Unsupported System Components', bl:['L','M','H']},
  {id:'SA-23', f:'SA', n:'Specialization', bl:[]},
  // SC — System and Communications Protection
  {id:'SC-1', f:'SC', n:'Policy and Procedures', bl:['L','M','H']},
  {id:'SC-2', f:'SC', n:'Separation of System and User Functionality', bl:['M','H']},
  {id:'SC-2(1)', f:'SC', n:'Interfaces for Non-privileged Users', bl:[]},
  {id:'SC-2(2)', f:'SC', n:'Disassociability', bl:[]},
  {id:'SC-3', f:'SC', n:'Security Function Isolation', bl:['H']},
  {id:'SC-3(1)', f:'SC', n:'Hardware Separation', bl:[]},
  {id:'SC-3(2)', f:'SC', n:'Access and Flow Control Functions', bl:[]},
  {id:'SC-3(3)', f:'SC', n:'Minimize Nonsecurity Functionality', bl:[]},
  {id:'SC-3(4)', f:'SC', n:'Module Coupling and Cohesiveness', bl:[]},
  {id:'SC-3(5)', f:'SC', n:'Layered Structures', bl:[]},
  {id:'SC-4', f:'SC', n:'Information in Shared System Resources', bl:['M','H']},
  {id:'SC-4(2)', f:'SC', n:'Multilevel or Periods Processing', bl:[]},
  {id:'SC-5', f:'SC', n:'Denial-of-service Protection', bl:['L','M','H']},
  {id:'SC-5(1)', f:'SC', n:'Restrict Ability to Attack Other Systems', bl:[]},
  {id:'SC-5(2)', f:'SC', n:'Capacity, Bandwidth, and Redundancy', bl:[]},
  {id:'SC-5(3)', f:'SC', n:'Detection and Monitoring', bl:[]},
  {id:'SC-6', f:'SC', n:'Resource Availability', bl:[]},
  {id:'SC-7', f:'SC', n:'Boundary Protection', bl:['L','M','H']},
  {id:'SC-7(3)', f:'SC', n:'Access Points', bl:['M','H']},
  {id:'SC-7(4)', f:'SC', n:'External Telecommunications Services', bl:['M','H']},
  {id:'SC-7(5)', f:'SC', n:'Deny by Default — Allow by Exception', bl:['M','H']},
  {id:'SC-7(7)', f:'SC', n:'Split Tunneling for Remote Devices', bl:['M','H']},
  {id:'SC-7(8)', f:'SC', n:'Route Traffic to Authenticated Proxy Servers', bl:['M','H']},
  {id:'SC-7(9)', f:'SC', n:'Restrict Threatening Outgoing Communications Traffic', bl:[]},
  {id:'SC-7(10)', f:'SC', n:'Prevent Exfiltration', bl:[]},
  {id:'SC-7(11)', f:'SC', n:'Restrict Incoming Communications Traffic', bl:[]},
  {id:'SC-7(12)', f:'SC', n:'Host-based Protection', bl:[]},
  {id:'SC-7(13)', f:'SC', n:'Isolation of Security Tools, Mechanisms, and Support Components', bl:[]},
  {id:'SC-7(14)', f:'SC', n:'Protect Against Unauthorized Physical Connections', bl:[]},
  {id:'SC-7(15)', f:'SC', n:'Networked Privileged Accesses', bl:[]},
  {id:'SC-7(16)', f:'SC', n:'Prevent Discovery of System Components', bl:[]},
  {id:'SC-7(17)', f:'SC', n:'Automated Enforcement of Protocol Formats', bl:[]},
  {id:'SC-7(18)', f:'SC', n:'Fail Secure', bl:['H']},
  {id:'SC-7(19)', f:'SC', n:'Block Communication from Non-organizationally Configured Hosts', bl:[]},
  {id:'SC-7(20)', f:'SC', n:'Dynamic Isolation and Segregation', bl:[]},
  {id:'SC-7(21)', f:'SC', n:'Isolation of System Components', bl:['H']},
  {id:'SC-7(22)', f:'SC', n:'Separate Subnets for Connecting to Different Security Domains', bl:[]},
  {id:'SC-7(23)', f:'SC', n:'Disable Sender Feedback on Protocol Validation Failure', bl:[]},
  {id:'SC-7(24)', f:'SC', n:'Personally Identifiable Information', bl:['P']},
  {id:'SC-7(25)', f:'SC', n:'Unclassified National Security System Connections', bl:[]},
  {id:'SC-7(26)', f:'SC', n:'Classified National Security System Connections', bl:[]},
  {id:'SC-7(27)', f:'SC', n:'Unclassified Non-national Security System Connections', bl:[]},
  {id:'SC-7(28)', f:'SC', n:'Connections to Public Networks', bl:[]},
  {id:'SC-7(29)', f:'SC', n:'Separate Subnets to Isolate Functions', bl:[]},
  {id:'SC-8', f:'SC', n:'Transmission Confidentiality and Integrity', bl:['M','H']},
  {id:'SC-8(1)', f:'SC', n:'Cryptographic Protection', bl:['M','H']},
  {id:'SC-8(2)', f:'SC', n:'Pre- and Post-transmission Handling', bl:[]},
  {id:'SC-8(3)', f:'SC', n:'Cryptographic Protection for Message Externals', bl:[]},
  {id:'SC-8(4)', f:'SC', n:'Conceal or Randomize Communications', bl:[]},
  {id:'SC-8(5)', f:'SC', n:'Protected Distribution System', bl:[]},
  {id:'SC-10', f:'SC', n:'Network Disconnect', bl:['M','H']},
  {id:'SC-11', f:'SC', n:'Trusted Path', bl:[]},
  {id:'SC-11(1)', f:'SC', n:'Irrefutable Communications Path', bl:[]},
  {id:'SC-12', f:'SC', n:'Cryptographic Key Establishment and Management', bl:['L','M','H']},
  {id:'SC-12(1)', f:'SC', n:'Availability', bl:['H']},
  {id:'SC-12(2)', f:'SC', n:'Symmetric Keys', bl:[]},
  {id:'SC-12(3)', f:'SC', n:'Asymmetric Keys', bl:[]},
  {id:'SC-12(6)', f:'SC', n:'Physical Control of Keys', bl:[]},
  {id:'SC-13', f:'SC', n:'Cryptographic Protection', bl:['L','M','H']},
  {id:'SC-15', f:'SC', n:'Collaborative Computing Devices and Applications', bl:['L','M','H']},
  {id:'SC-15(1)', f:'SC', n:'Physical or Logical Disconnect', bl:[]},
  {id:'SC-15(3)', f:'SC', n:'Disabling and Removal in Secure Work Areas', bl:[]},
  {id:'SC-15(4)', f:'SC', n:'Explicitly Indicate Current Participants', bl:[]},
  {id:'SC-16', f:'SC', n:'Transmission of Security and Privacy Attributes', bl:[]},
  {id:'SC-16(1)', f:'SC', n:'Integrity Verification', bl:[]},
  {id:'SC-16(2)', f:'SC', n:'Anti-spoofing Mechanisms', bl:[]},
  {id:'SC-16(3)', f:'SC', n:'Cryptographic Binding', bl:[]},
  {id:'SC-17', f:'SC', n:'Public Key Infrastructure Certificates', bl:['M','H']},
  {id:'SC-18', f:'SC', n:'Mobile Code', bl:['M','H']},
  {id:'SC-18(1)', f:'SC', n:'Identify Unacceptable Code and Take Corrective Actions', bl:[]},
  {id:'SC-18(2)', f:'SC', n:'Acquisition, Development, and Use', bl:[]},
  {id:'SC-18(3)', f:'SC', n:'Prevent Downloading and Execution', bl:[]},
  {id:'SC-18(4)', f:'SC', n:'Prevent Automatic Execution', bl:[]},
  {id:'SC-18(5)', f:'SC', n:'Allow Execution Only in Confined Environments', bl:[]},
  {id:'SC-20', f:'SC', n:'Secure Name/address Resolution Service (authoritative Source)', bl:['L','M','H']},
  {id:'SC-20(2)', f:'SC', n:'Data Origin and Integrity', bl:[]},
  {id:'SC-21', f:'SC', n:'Secure Name/address Resolution Service (recursive or Caching Resolver)', bl:['L','M','H']},
  {id:'SC-22', f:'SC', n:'Architecture and Provisioning for Name/address Resolution Service', bl:['L','M','H']},
  {id:'SC-23', f:'SC', n:'Session Authenticity', bl:['M','H']},
  {id:'SC-23(1)', f:'SC', n:'Invalidate Session Identifiers at Logout', bl:[]},
  {id:'SC-23(3)', f:'SC', n:'Unique System-generated Session Identifiers', bl:[]},
  {id:'SC-23(5)', f:'SC', n:'Allowed Certificate Authorities', bl:[]},
  {id:'SC-24', f:'SC', n:'Fail in Known State', bl:['H']},
  {id:'SC-25', f:'SC', n:'Thin Nodes', bl:[]},
  {id:'SC-26', f:'SC', n:'Decoys', bl:[]},
  {id:'SC-27', f:'SC', n:'Platform-independent Applications', bl:[]},
  {id:'SC-28', f:'SC', n:'Protection of Information at Rest', bl:['M','H']},
  {id:'SC-28(1)', f:'SC', n:'Cryptographic Protection', bl:['M','H']},
  {id:'SC-28(2)', f:'SC', n:'Offline Storage', bl:[]},
  {id:'SC-28(3)', f:'SC', n:'Cryptographic Keys', bl:[]},
  {id:'SC-29', f:'SC', n:'Heterogeneity', bl:[]},
  {id:'SC-29(1)', f:'SC', n:'Virtualization Techniques', bl:[]},
  {id:'SC-30', f:'SC', n:'Concealment and Misdirection', bl:[]},
  {id:'SC-30(2)', f:'SC', n:'Randomness', bl:[]},
  {id:'SC-30(3)', f:'SC', n:'Change Processing and Storage Locations', bl:[]},
  {id:'SC-30(4)', f:'SC', n:'Misleading Information', bl:[]},
  {id:'SC-30(5)', f:'SC', n:'Concealment of System Components', bl:[]},
  {id:'SC-31', f:'SC', n:'Covert Channel Analysis', bl:[]},
  {id:'SC-31(1)', f:'SC', n:'Test Covert Channels for Exploitability', bl:[]},
  {id:'SC-31(2)', f:'SC', n:'Maximum Bandwidth', bl:[]},
  {id:'SC-31(3)', f:'SC', n:'Measure Bandwidth in Operational Environments', bl:[]},
  {id:'SC-32', f:'SC', n:'System Partitioning', bl:[]},
  {id:'SC-32(1)', f:'SC', n:'Separate Physical Domains for Privileged Functions', bl:[]},
  {id:'SC-34', f:'SC', n:'Non-modifiable Executable Programs', bl:[]},
  {id:'SC-34(1)', f:'SC', n:'No Writable Storage', bl:[]},
  {id:'SC-34(2)', f:'SC', n:'Integrity Protection on Read-only Media', bl:[]},
  {id:'SC-35', f:'SC', n:'External Malicious Code Identification', bl:[]},
  {id:'SC-36', f:'SC', n:'Distributed Processing and Storage', bl:[]},
  {id:'SC-36(1)', f:'SC', n:'Polling Techniques', bl:[]},
  {id:'SC-36(2)', f:'SC', n:'Synchronization', bl:[]},
  {id:'SC-37', f:'SC', n:'Out-of-band Channels', bl:[]},
  {id:'SC-37(1)', f:'SC', n:'Ensure Delivery and Transmission', bl:[]},
  {id:'SC-38', f:'SC', n:'Operations Security', bl:[]},
  {id:'SC-39', f:'SC', n:'Process Isolation', bl:['L','M','H']},
  {id:'SC-39(1)', f:'SC', n:'Hardware Separation', bl:[]},
  {id:'SC-39(2)', f:'SC', n:'Separate Execution Domain Per Thread', bl:[]},
  {id:'SC-40', f:'SC', n:'Wireless Link Protection', bl:[]},
  {id:'SC-40(1)', f:'SC', n:'Electromagnetic Interference', bl:[]},
  {id:'SC-40(2)', f:'SC', n:'Reduce Detection Potential', bl:[]},
  {id:'SC-40(3)', f:'SC', n:'Imitative or Manipulative Communications Deception', bl:[]},
  {id:'SC-40(4)', f:'SC', n:'Signal Parameter Identification', bl:[]},
  {id:'SC-41', f:'SC', n:'Port and I/O Device Access', bl:[]},
  {id:'SC-42', f:'SC', n:'Sensor Capability and Data', bl:[]},
  {id:'SC-42(1)', f:'SC', n:'Reporting to Authorized Individuals or Roles', bl:[]},
  {id:'SC-42(2)', f:'SC', n:'Authorized Use', bl:[]},
  {id:'SC-42(4)', f:'SC', n:'Notice of Collection', bl:[]},
  {id:'SC-42(5)', f:'SC', n:'Collection Minimization', bl:[]},
  {id:'SC-43', f:'SC', n:'Usage Restrictions', bl:[]},
  {id:'SC-44', f:'SC', n:'Detonation Chambers', bl:[]},
  {id:'SC-45', f:'SC', n:'System Time Synchronization', bl:[]},
  {id:'SC-45(1)', f:'SC', n:'Synchronization with Authoritative Time Source', bl:[]},
  {id:'SC-45(2)', f:'SC', n:'Secondary Authoritative Time Source', bl:[]},
  {id:'SC-46', f:'SC', n:'Cross Domain Policy Enforcement', bl:[]},
  {id:'SC-47', f:'SC', n:'Alternate Communications Paths', bl:[]},
  {id:'SC-48', f:'SC', n:'Sensor Relocation', bl:[]},
  {id:'SC-48(1)', f:'SC', n:'Dynamic Relocation of Sensors or Monitoring Capabilities', bl:[]},
  {id:'SC-49', f:'SC', n:'Hardware-enforced Separation and Policy Enforcement', bl:[]},
  {id:'SC-50', f:'SC', n:'Software-enforced Separation and Policy Enforcement', bl:[]},
  {id:'SC-51', f:'SC', n:'Hardware-based Protection', bl:[]},
  // SI — System and Information Integrity
  {id:'SI-1', f:'SI', n:'Policy and Procedures', bl:['L','M','H','P']},
  {id:'SI-2', f:'SI', n:'Flaw Remediation', bl:['L','M','H']},
  {id:'SI-2(2)', f:'SI', n:'Automated Flaw Remediation Status', bl:['M','H']},
  {id:'SI-2(3)', f:'SI', n:'Time to Remediate Flaws and Benchmarks for Corrective Actions', bl:[]},
  {id:'SI-2(4)', f:'SI', n:'Automated Patch Management Tools', bl:[]},
  {id:'SI-2(5)', f:'SI', n:'Automatic Software and Firmware Updates', bl:[]},
  {id:'SI-2(6)', f:'SI', n:'Removal of Previous Versions of Software and Firmware', bl:[]},
  {id:'SI-3', f:'SI', n:'Malicious Code Protection', bl:['L','M','H']},
  {id:'SI-3(4)', f:'SI', n:'Updates Only by Privileged Users', bl:[]},
  {id:'SI-3(6)', f:'SI', n:'Testing and Verification', bl:[]},
  {id:'SI-3(8)', f:'SI', n:'Detect Unauthorized Commands', bl:[]},
  {id:'SI-3(10)', f:'SI', n:'Malicious Code Analysis', bl:[]},
  {id:'SI-4', f:'SI', n:'System Monitoring', bl:['L','M','H']},
  {id:'SI-4(1)', f:'SI', n:'System-wide Intrusion Detection System', bl:[]},
  {id:'SI-4(2)', f:'SI', n:'Automated Tools and Mechanisms for Real-time Analysis', bl:['M','H']},
  {id:'SI-4(3)', f:'SI', n:'Automated Tool and Mechanism Integration', bl:[]},
  {id:'SI-4(4)', f:'SI', n:'Inbound and Outbound Communications Traffic', bl:['M','H']},
  {id:'SI-4(5)', f:'SI', n:'System-generated Alerts', bl:['M','H']},
  {id:'SI-4(7)', f:'SI', n:'Automated Response to Suspicious Events', bl:[]},
  {id:'SI-4(9)', f:'SI', n:'Testing of Monitoring Tools and Mechanisms', bl:[]},
  {id:'SI-4(10)', f:'SI', n:'Visibility of Encrypted Communications', bl:['H']},
  {id:'SI-4(11)', f:'SI', n:'Analyze Communications Traffic Anomalies', bl:[]},
  {id:'SI-4(12)', f:'SI', n:'Automated Organization-generated Alerts', bl:['H']},
  {id:'SI-4(13)', f:'SI', n:'Analyze Traffic and Event Patterns', bl:[]},
  {id:'SI-4(14)', f:'SI', n:'Wireless Intrusion Detection', bl:['H']},
  {id:'SI-4(15)', f:'SI', n:'Wireless to Wireline Communications', bl:[]},
  {id:'SI-4(16)', f:'SI', n:'Correlate Monitoring Information', bl:[]},
  {id:'SI-4(17)', f:'SI', n:'Integrated Situational Awareness', bl:[]},
  {id:'SI-4(18)', f:'SI', n:'Analyze Traffic and Covert Exfiltration', bl:[]},
  {id:'SI-4(19)', f:'SI', n:'Risk for Individuals', bl:[]},
  {id:'SI-4(20)', f:'SI', n:'Privileged Users', bl:['H']},
  {id:'SI-4(21)', f:'SI', n:'Probationary Periods', bl:[]},
  {id:'SI-4(22)', f:'SI', n:'Unauthorized Network Services', bl:['H']},
  {id:'SI-4(23)', f:'SI', n:'Host-based Devices', bl:[]},
  {id:'SI-4(24)', f:'SI', n:'Indicators of Compromise', bl:[]},
  {id:'SI-4(25)', f:'SI', n:'Optimize Network Traffic Analysis', bl:[]},
  {id:'SI-5', f:'SI', n:'Security Alerts, Advisories, and Directives', bl:['L','M','H']},
  {id:'SI-5(1)', f:'SI', n:'Automated Alerts and Advisories', bl:['H']},
  {id:'SI-6', f:'SI', n:'Security and Privacy Function Verification', bl:['H']},
  {id:'SI-6(2)', f:'SI', n:'Automation Support for Distributed Testing', bl:[]},
  {id:'SI-6(3)', f:'SI', n:'Report Verification Results', bl:[]},
  {id:'SI-7', f:'SI', n:'Software, Firmware, and Information Integrity', bl:['M','H']},
  {id:'SI-7(1)', f:'SI', n:'Integrity Checks', bl:['M','H']},
  {id:'SI-7(2)', f:'SI', n:'Automated Notifications of Integrity Violations', bl:['H']},
  {id:'SI-7(3)', f:'SI', n:'Centrally Managed Integrity Tools', bl:[]},
  {id:'SI-7(5)', f:'SI', n:'Automated Response to Integrity Violations', bl:['H']},
  {id:'SI-7(6)', f:'SI', n:'Cryptographic Protection', bl:[]},
  {id:'SI-7(7)', f:'SI', n:'Integration of Detection and Response', bl:['M','H']},
  {id:'SI-7(8)', f:'SI', n:'Auditing Capability for Significant Events', bl:[]},
  {id:'SI-7(9)', f:'SI', n:'Verify Boot Process', bl:[]},
  {id:'SI-7(10)', f:'SI', n:'Protection of Boot Firmware', bl:[]},
  {id:'SI-7(12)', f:'SI', n:'Integrity Verification', bl:[]},
  {id:'SI-7(15)', f:'SI', n:'Code Authentication', bl:['H']},
  {id:'SI-7(16)', f:'SI', n:'Time Limit on Process Execution Without Supervision', bl:[]},
  {id:'SI-7(17)', f:'SI', n:'Runtime Application Self-protection', bl:[]},
  {id:'SI-8', f:'SI', n:'Spam Protection', bl:['M','H']},
  {id:'SI-8(2)', f:'SI', n:'Automatic Updates', bl:['M','H']},
  {id:'SI-8(3)', f:'SI', n:'Continuous Learning Capability', bl:[]},
  {id:'SI-10', f:'SI', n:'Information Input Validation', bl:['M','H']},
  {id:'SI-10(1)', f:'SI', n:'Manual Override Capability', bl:[]},
  {id:'SI-10(2)', f:'SI', n:'Review and Resolve Errors', bl:[]},
  {id:'SI-10(3)', f:'SI', n:'Predictable Behavior', bl:[]},
  {id:'SI-10(4)', f:'SI', n:'Timing Interactions', bl:[]},
  {id:'SI-10(5)', f:'SI', n:'Restrict Inputs to Trusted Sources and Approved Formats', bl:[]},
  {id:'SI-10(6)', f:'SI', n:'Injection Prevention', bl:[]},
  {id:'SI-11', f:'SI', n:'Error Handling', bl:['M','H']},
  {id:'SI-12', f:'SI', n:'Information Management and Retention', bl:['L','M','H','P']},
  {id:'SI-12(1)', f:'SI', n:'Limit Personally Identifiable Information Elements', bl:['P']},
  {id:'SI-12(2)', f:'SI', n:'Minimize Personally Identifiable Information in Testing, Training, and Research', bl:['P']},
  {id:'SI-12(3)', f:'SI', n:'Information Disposal', bl:['P']},
  {id:'SI-13', f:'SI', n:'Predictable Failure Prevention', bl:[]},
  {id:'SI-13(1)', f:'SI', n:'Transferring Component Responsibilities', bl:[]},
  {id:'SI-13(3)', f:'SI', n:'Manual Transfer Between Components', bl:[]},
  {id:'SI-13(4)', f:'SI', n:'Standby Component Installation and Notification', bl:[]},
  {id:'SI-13(5)', f:'SI', n:'Failover Capability', bl:[]},
  {id:'SI-14', f:'SI', n:'Non-persistence', bl:[]},
  {id:'SI-14(1)', f:'SI', n:'Refresh from Trusted Sources', bl:[]},
  {id:'SI-14(2)', f:'SI', n:'Non-persistent Information', bl:[]},
  {id:'SI-14(3)', f:'SI', n:'Non-persistent Connectivity', bl:[]},
  {id:'SI-15', f:'SI', n:'Information Output Filtering', bl:[]},
  {id:'SI-16', f:'SI', n:'Memory Protection', bl:['M','H']},
  {id:'SI-17', f:'SI', n:'Fail-safe Procedures', bl:[]},
  {id:'SI-18', f:'SI', n:'Personally Identifiable Information Quality Operations', bl:['P']},
  {id:'SI-18(1)', f:'SI', n:'Automation Support', bl:[]},
  {id:'SI-18(2)', f:'SI', n:'Data Tags', bl:[]},
  {id:'SI-18(3)', f:'SI', n:'Collection', bl:[]},
  {id:'SI-18(4)', f:'SI', n:'Individual Requests', bl:['P']},
  {id:'SI-18(5)', f:'SI', n:'Notice of Correction or Deletion', bl:[]},
  {id:'SI-19', f:'SI', n:'De-identification', bl:['P']},
  {id:'SI-19(1)', f:'SI', n:'Collection', bl:[]},
  {id:'SI-19(2)', f:'SI', n:'Archiving', bl:[]},
  {id:'SI-19(3)', f:'SI', n:'Release', bl:[]},
  {id:'SI-19(4)', f:'SI', n:'Removal, Masking, Encryption, Hashing, or Replacement of Direct Identifiers', bl:[]},
  {id:'SI-19(5)', f:'SI', n:'Statistical Disclosure Control', bl:[]},
  {id:'SI-19(6)', f:'SI', n:'Differential Privacy', bl:[]},
  {id:'SI-19(7)', f:'SI', n:'Validated Algorithms and Software', bl:[]},
  {id:'SI-19(8)', f:'SI', n:'Motivated Intruder', bl:[]},
  {id:'SI-20', f:'SI', n:'Tainting', bl:[]},
  {id:'SI-21', f:'SI', n:'Information Refresh', bl:[]},
  {id:'SI-22', f:'SI', n:'Information Diversity', bl:[]},
  {id:'SI-23', f:'SI', n:'Information Fragmentation', bl:[]},
  // SR — Supply Chain Risk Management
  {id:'SR-1', f:'SR', n:'Policy and Procedures', bl:['L','M','H']},
  {id:'SR-2', f:'SR', n:'Supply Chain Risk Management Plan', bl:['L','M','H']},
  {id:'SR-2(1)', f:'SR', n:'Establish SCRM Team', bl:['L','M','H']},
  {id:'SR-3', f:'SR', n:'Supply Chain Controls and Processes', bl:['L','M','H']},
  {id:'SR-3(1)', f:'SR', n:'Diverse Supply Base', bl:[]},
  {id:'SR-3(2)', f:'SR', n:'Limitation of Harm', bl:[]},
  {id:'SR-3(3)', f:'SR', n:'Sub-tier Flow Down', bl:[]},
  {id:'SR-4', f:'SR', n:'Provenance', bl:[]},
  {id:'SR-4(1)', f:'SR', n:'Identity', bl:[]},
  {id:'SR-4(2)', f:'SR', n:'Track and Trace', bl:[]},
  {id:'SR-4(3)', f:'SR', n:'Validate as Genuine and Not Altered', bl:[]},
  {id:'SR-4(4)', f:'SR', n:'Supply Chain Integrity — Pedigree', bl:[]},
  {id:'SR-5', f:'SR', n:'Acquisition Strategies, Tools, and Methods', bl:['L','M','H']},
  {id:'SR-5(1)', f:'SR', n:'Adequate Supply', bl:[]},
  {id:'SR-5(2)', f:'SR', n:'Assessments Prior to Selection, Acceptance, Modification, or Update', bl:[]},
  {id:'SR-6', f:'SR', n:'Supplier Assessments and Reviews', bl:['M','H']},
  {id:'SR-6(1)', f:'SR', n:'Testing and Analysis', bl:[]},
  {id:'SR-7', f:'SR', n:'Supply Chain Operations Security', bl:[]},
  {id:'SR-8', f:'SR', n:'Notification Agreements', bl:['L','M','H']},
  {id:'SR-9', f:'SR', n:'Tamper Resistance and Detection', bl:['H']},
  {id:'SR-9(1)', f:'SR', n:'Multiple Stages of System Development Life Cycle', bl:['H']},
  {id:'SR-10', f:'SR', n:'Inspection of Systems or Components', bl:['L','M','H']},
  {id:'SR-11', f:'SR', n:'Component Authenticity', bl:['L','M','H']},
  {id:'SR-11(1)', f:'SR', n:'Anti-counterfeit Training', bl:['L','M','H']},
  {id:'SR-11(2)', f:'SR', n:'Configuration Control for Component Service and Repair', bl:['L','M','H']},
  {id:'SR-11(3)', f:'SR', n:'Anti-counterfeit Scanning', bl:[]},
  {id:'SR-12', f:'SR', n:'Component Disposal', bl:['L','M','H']},
  // PT — PII Processing and Transparency (NIST SP 800-53 Rev 5; privacy baseline per SP 800-53B)
  {id:'PT-1', f:'PT', n:'Policy and Procedures', bl:['P']},
  {id:'PT-2', f:'PT', n:'Authority To Collect, Use, Maintain, And Disseminate Personally Identifiable Information', bl:['P']},
  {id:'PT-2(1)', f:'PT', n:'Social Security Numbers', bl:[]},
  {id:'PT-2(2)', f:'PT', n:'First Amendment Information', bl:[]},
  {id:'PT-3', f:'PT', n:'Personally Identifiable Information Processing Purposes', bl:['P']},
  {id:'PT-3(1)', f:'PT', n:'Data Tags', bl:[]},
  {id:'PT-3(2)', f:'PT', n:'Update And Data Tagging', bl:[]},
  {id:'PT-4', f:'PT', n:'Consent', bl:['P']},
  {id:'PT-4(1)', f:'PT', n:'Neighboring Organization User Consent', bl:[]},
  {id:'PT-4(2)', f:'PT', n:'Privacy Of Information Requiring Special Protection', bl:[]},
  {id:'PT-4(3)', f:'PT', n:'Revocation', bl:[]},
  {id:'PT-5', f:'PT', n:'Privacy Notice', bl:['P']},
  {id:'PT-5(1)', f:'PT', n:'First Amendment Information', bl:[]},
  {id:'PT-5(2)', f:'PT', n:'Privacy Act Statements', bl:['P']},
  {id:'PT-6', f:'PT', n:'System Of Records Notice', bl:['P']},
  {id:'PT-6(1)', f:'PT', n:'Routine Uses', bl:['P']},
  {id:'PT-6(2)', f:'PT', n:'Exemption Rules', bl:['P']},
  {id:'PT-7', f:'PT', n:'Specific Categories Of Personally Identifiable Information', bl:['P']},
  {id:'PT-7(1)', f:'PT', n:'Social Security Numbers', bl:['P']},
  {id:'PT-7(2)', f:'PT', n:'First Amendment Information', bl:['P']},
  {id:'PT-8', f:'PT', n:'Computer Matching Requirements', bl:['P']},
];

const BASELINE_COUNTS = {
  L: 149,   // Low-impact baseline
  M: 287,   // Moderate-impact baseline
  H: 370,   // High-impact baseline
  PM: 37,   // Program Management — counted separately
};

const DOMAIN_SUGGESTED_ROLES = {
  // IAM/Access Lead
  AC:'IAM/Access Lead', IA:'IAM/Access Lead',
  // GRC/Risk Lead (includes privacy)
  AU:'GRC/Risk Lead', CA:'GRC/Risk Lead', PL:'GRC/Risk Lead', RA:'GRC/Risk Lead', PT:'GRC/Risk Lead',
  // Security Engineering Lead (includes media protection)
  CM:'Security Engineering Lead', MP:'Security Engineering Lead', SA:'Security Engineering Lead',
  SC:'Security Engineering Lead', SI:'Security Engineering Lead',
  // Ops/Continuity Lead
  CP:'Ops/Continuity Lead', MA:'Ops/Continuity Lead', PE:'Ops/Continuity Lead',
  // People Lead
  AT:'People Lead', PS:'People Lead',
  // Supply Chain/Vendor Lead
  SR:'Supply Chain/Vendor Lead',
  // CISO-owned
  IR:'CISO', PM:'CISO',
};

const ROLE_TABS = {
  // The Control Assessment + Authorization workspaces were removed (2026-04-27).
  // AOs still record decisions through openAtoDecisionModal() launched from the
  // Reports dashboard. Asssessors no longer have a dedicated workspace —
  // assessment data persists in state but is not edited via UI.
  'ciso':          ['home','ciso','policy','asset','frameworks','poam','reports'],
  'issm':          ['home','policy','asset','frameworks','poam','reports'],
  'control-owner': ['home','control','frameworks','poam','reports'],
  'asset-owner':   ['home','asset','poam','reports'],
  'custodian':     ['home','policy','reports'],
  'assessor':      ['home','poam','reports'],
  'ao':            ['home','asset','poam','reports','users'],
  'approver':      ['home','control','asset','reports'],
};

// Default program-owner title (CISO wizard Step 1). Privacy overlay implies combined security + privacy leadership.
const DEFAULT_PROGRAM_OWNER_TITLE = 'Chief Information Security Officer';
const DEFAULT_PROGRAM_OWNER_TITLE_WITH_PRIVACY = 'Chief Information Security Officer / Chief Privacy Officer';

function getDefaultProgramOwnerTitle() {
  return (state && state.privacyOverlay) ? DEFAULT_PROGRAM_OWNER_TITLE_WITH_PRIVACY : DEFAULT_PROGRAM_OWNER_TITLE;
}

// ============================================================
// APP STATE
// ============================================================
const state = {
  baseline: null,           // 'L', 'M', or 'H' — the *effective* baseline applied to the program (after any FISMA tailoring)
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
  pmControls: {},           // { 'PM-1': true, ... }
  domainOwners: {},         // { 'AC': { name, email, role }, ... }
  policyDeadlines: {},      // { 'AC': '2026-06-01', ... }
  policyStatus: {},         // { 'AC': { status, version, notes, lastUpdated } }
  controlStatus: {},        // { 'AC-1': { status, evidence, narrative, owner } }
  controlOwnerAttested: false,   // true = control owner has checked attestation
  _ctrlEvidenceFilter: 'all',    // 'all' | 'missing' | 'has'
  controlTestResults: {},   // { 'AC-1': { result, date, tester, findings } }
  authBoundaries: [],       // [{ id, name, description, assetTypes, assetIds, processIds, aoUserId, assessorUserIds, atoStatus, atoGrantedDate, atoExpiresDate, conditions }]
  /** User-defined roles (slug on user.role); tabsTemplate: 'assessor' | 'reports-only' */
  customProgramRoles: [],
  assessmentPlans: {},      // { [boundaryId]: { scopeMode, inScopeControlIds[], controlPlans{} } }
  atoDecisions: {},         // { [boundaryId]: { boundaryId, decision, decidedByUserId, decidedAt, conditions[], expiresAt, residualRiskNarrative, signature } }
  _atoLibraryFilter: { families: [], assetTypes: [], assetIds: [], statuses: [], search: '' },
  assets: [],               // [{ id, name, type, description, owner, ownerId }]
  assetCategorization: {},  // { [assetId]: { confidentiality:'L'|'M'|'H', integrity, availability, rationale } } — FIPS 199 high-water for SSP / V3 elevation
  baselineElevationRecommendations: [], // V3 CISO workflow: elevated-baseline subtype proposals (never mutates state.baseline)
  processes: [],            // [{ id, name, category, description, owner }]
  attestations: {},         // legacy — superseded by sspAttestations
  sspAttestations: {},      // { assetId|procId: { controlId: { status, explanation, date } } }
  sspSignoffs: {},          // { assetId|procId: { signedBy, signedDate, status, reviewerUserId, reviewerName, reviewerEmail, reviewerRole } }
  customAssetTypes: [],     // user-defined asset types added by control owners
  customAssetTypeGroups: {}, // { 'OT Device':'Infrastructure', ... }
  customAssetTypeHeaders: [], // user-defined group headers shown in asset coverage
  cisoComplete: false,
  infoSecPolicy: null,
  policySelectedControls: null,  // { 'AC': ['AC-1', 'AC-2', ...] }
  domainPolicies: null,          // { 'AC': { title, purpose, scope, roles, requirements, ... } }
  controlOwners: null,           // { 'AC-1': { name, role, email, dueDate } }
  policyMerges: {},              // { 'IA': 'AC' } = IA is merged under AC's owner card
  policyPriorities: {},          // { 'AC': 'now'|'soon'|'later' }
  domainDeadlines: {},           // { 'AC': 'YYYY-MM-DD' } per-domain deadline overrides
  domainCustomNames: {},         // { 'AC': 'Custom Policy Name' } user-defined policy titles
  _policyDomain: null,           // currently active domain in Policy tab
  _policyWizardMode: false,      // true = wizard open, false = domain list
  _policyDocView: false,         // true = show read-only policy document viewer
  _ispReviewView: false,         // true = read-only Tier 1 ISP viewer (approvers without policy tab)
  _policyLibraryMode: false,     // true = show global policy library, false = policy workspace/home
  _policyOwnerFilter: '',        // selected owner name on landing page
  _controlLibraryMode: false,    // true = show global control library, false = control-owner workspace
  _controlLibraryFamilyFilter: '',
  _controlLibraryStatusFilter: '',
  _controlLibraryAssetTypeFilter: '',
  _controlLibrarySearch: '',
  _controlLibraryColFilters: {},  // { control:'', name:'', owner:'', impl:'', asset:'', compliance:'', lifecycle:'' }
  _assetLibraryMode: false,    // true = show global asset library, false = asset workspace
  _assetTypeLibraryMode: false, // true = show asset type library, false = asset workspace
  _sspReviewerReadOnly: false,  // true = AO/ISSM viewing submitted SSP in read-only package view (not owner wizard)
  _sspReadOnlyExitTab: null,     // 'reports' | 'library' — where Back returns after read-only SSP view
  assetTypeRequests: [],        // [{id, action, typeName, reason, requestedBy, requestedAt, status, reviewedBy, reviewedAt, reviewReason}]
  policyCustodians: {},          // { 'AC': { name, role, email } }
  users: [],                     // [{ id, name, email, role, families[], controls[], note }]
  currentUserId: null,           // null = admin mode; string id = logged-in user

  // NEW FEATURES: Deadlines, Versioning, Workflow, Asset Mapping
  controlDeadlines: {},          // { 'AC-1': 'YYYY-MM-DD' } implementation deadline per control
  controlWorkflowState: {},      // { 'AC-1': 'draft'|'in-progress'|'awaiting-review'|'approved' }
  controlReviewQueue: [],        // [{ controlId, owner, status, submittedAt }] pending reviews
  assetMappings: {},             // { 'AC-1': ['asset-1', 'asset-2'] } which assets a control affects
  policyVersions: {},            // { 'AC': [{ version:'1.0', approvedAt:'2026-02-01', approved:true }, ...] }
  policyAcknowledgments: {},     // { 'AC': { 'user-1': '2026-03-15', 'user-2': null } }
  testAdequacy: {},              // { 'AC-1': { frequency:'Monthly', completedTests:3, requiredTests:6, lastTest:'2026-03-15', nextTestDue:'2026-04-15' } }
  // Policy review cycle tracking (NIST annual review requirement)
  policyReviewCycle: {},         // { 'ISP': { lastReviewed, nextReviewDue, approvedBy, approvalDate }, 'AC': {...}, ... }
  infoSecPolicySuggestions: [],  // [{ id, createdAt, suggestedBy, summary, status: Proposed|Approved|Rejected|Promoted }]
  infoSecPolicyReviewDraft: null, // { version, createdAt, updatedAt, content, promotedSuggestionIds } — annual review working draft seeded from approved suggestions

  // POA&M / Findings tracking
  poamItems: [],                 // [{ id, controlId, finding, severity, status, dueDate, assignee, createdDate, closedDate, mitigationPlan, evidenceRef }]
  controlEvidence: {},           // { 'AC-1': { url, hash, attestationDate, type, description } }
  auditTrail: [],                // [{ t, cat, ref, msg }] activity log for reports / accountability
  changeLog: [],                 // field-level edits: { t, u, p, o, n } — capped FIFO
  _auditTrailUiMode: 'events',   // 'events' | 'fields' — reports audit panel toggle
  _auditTrailEventCatFilter: 'all', // category chip for events tab
  _changeLogUserFilter: '',      // field-change tab filter (substring on user id)
  _changeLogDateFilter: '',      // field-change tab filter (substring on ISO date)
  _undoStack: [],                // scoped structural undo (max 20)
  _reportsProgramReadinessHidden: false, // true = collapse Program Readiness panel in Reports
  _reportsMySummaryHidden: false, // true = collapse "My dashboard" summary card in Reports
  _reportsPhase1BannerHidden: false, // true = collapse Phase 1 completion banner in Reports
  activeFrameworks: {}, // voluntary standards crosswalk lenses (off until user enables)
  activeComplianceLaws: {}, // laws & regulations (HIPAA, GLBA, …) tracked separately
  _regMappingInitialized: false,
  sharePointConfig: { enabled: false, siteUrl: '', libraryName: 'Evidence', defaultFolder: 'GRC/Evidence' },
  entraConfig: { enabled: false, clientId: '', tenantId: 'organizations', redirectUri: '' },
  entraSession: null, // { email, name, oid, matchedUserId, signedInAt } when signed in via Entra
  _frameworkFilter: '',
  _frameworkSearch: '',
  _poamFilter: 'open',
  _poamSearch: '',
};
const STATE_DEFAULTS = JSON.parse(JSON.stringify(state));
const STATE_ALLOWED_KEYS = Object.keys(STATE_DEFAULTS);
const STORAGE_KEY = 'eightfiftythree-grc-v1';
// Mirror onto window so Playwright / external scripts can access state directly.
try { window.state = state; window.STATE_DEFAULTS = STATE_DEFAULTS; } catch (e) {}
const SNAPSHOTS_KEY = 'eightfiftythree-grc-snapshots';
// One-time migration from legacy storage keys. Runs at script parse time and
// only copies forward if the new keys are empty. Legacy keys are removed after
// copy so they never reappear on subsequent loads. Two prior brand names are
// covered: the original "hawthorn-*" prefix and the interim "larsen-*" prefix.
(function migrateLegacyStorageKeys() {
  try {
    var LEGACY_PREFIXES = ['larsen-grc', 'hawthorn-grc'];
    for (var i = 0; i < LEGACY_PREFIXES.length; i++) {
      var pfx = LEGACY_PREFIXES[i];
      var LEGACY_STATE = pfx + '-v1';
      var LEGACY_TS = pfx + '-v1-ts';
      var LEGACY_SNAPS = pfx + '-snapshots';
      if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STATE)) {
        localStorage.setItem(STORAGE_KEY, localStorage.getItem(LEGACY_STATE));
        var ts = localStorage.getItem(LEGACY_TS);
        if (ts) localStorage.setItem(STORAGE_KEY + '-ts', ts);
      }
      if (!localStorage.getItem(SNAPSHOTS_KEY) && localStorage.getItem(LEGACY_SNAPS)) {
        localStorage.setItem(SNAPSHOTS_KEY, localStorage.getItem(LEGACY_SNAPS));
      }
      localStorage.removeItem(LEGACY_STATE);
      localStorage.removeItem(LEGACY_TS);
      localStorage.removeItem(LEGACY_SNAPS);
    }
  } catch (e) { /* storage unavailable (private mode) — safe to ignore */ }
})();

function cloneStateValue(v) {
  return JSON.parse(JSON.stringify(v));
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function normalizeStateShape() {
  STATE_ALLOWED_KEYS.forEach(function(k) {
    if (state[k] === undefined || state[k] === null) {
      state[k] = cloneStateValue(STATE_DEFAULTS[k]);
      return;
    }
    if (Array.isArray(STATE_DEFAULTS[k]) && !Array.isArray(state[k])) {
      state[k] = cloneStateValue(STATE_DEFAULTS[k]);
      return;
    }
    if (isPlainObject(STATE_DEFAULTS[k]) && !isPlainObject(state[k])) {
      state[k] = cloneStateValue(STATE_DEFAULTS[k]);
    }
  });
  migrateRegMappingStateShape();
}

function migrateRegMappingStateShape() {
  if (!state.activeComplianceLaws || typeof state.activeComplianceLaws !== 'object') {
    state.activeComplianceLaws = {};
  }
  if (!state.activeFrameworks || typeof state.activeFrameworks !== 'object') {
    state.activeFrameworks = cloneStateValue(STATE_DEFAULTS.activeFrameworks);
  }
  if (state.activeFrameworks.hipaa) {
    if (state.activeComplianceLaws.hipaa !== false) state.activeComplianceLaws.hipaa = true;
    delete state.activeFrameworks.hipaa;
  }
  if (state.activeFrameworks.cis) delete state.activeFrameworks.cis;
  if (state.activeComplianceLaws.mar_e) delete state.activeComplianceLaws.mar_e;
  if (state._regMappingInitialized === undefined) state._regMappingInitialized = false;
  if (!Array.isArray(state.customRegFrameworks)) state.customRegFrameworks = [];
  // Legacy flat orgSector → hierarchical orgOwnership / orgGovLevel / orgSector
  if (!state.orgOwnership && state.orgSector) {
    var legacySector = state.orgSector;
    if (legacySector === 'federal') {
      state.orgOwnership = 'government';
      state.orgGovLevel = 'federal';
      state.orgSector = 'civilian';
    } else if (legacySector === 'state_local') {
      state.orgOwnership = 'government';
      state.orgGovLevel = 'slg';
      state.orgSector = 'general';
    } else if (['commercial', 'healthcare', 'financial', 'education', 'critical_infra'].indexOf(legacySector) >= 0) {
      state.orgOwnership = 'private';
    }
  }
}

function resetStateToDefaults() {
  STATE_ALLOWED_KEYS.forEach(function(k) {
    state[k] = cloneStateValue(STATE_DEFAULTS[k]);
  });
}

/** Legacy saved states may use string custodian entries; normalize when needed. */
function migrateCustodianFormats() {
  var pc = state.policyCustodians;
  if (!pc || typeof pc !== 'object') return;
  Object.keys(pc).forEach(function(fam) {
    var v = pc[fam];
    if (typeof v === 'string' && v.trim()) {
      pc[fam] = { name: v.trim(), role: '', email: '' };
    }
  });
}

var _SUGGESTED_ROLE_BUCKET_LABELS = null;
function getSuggestedRoleBucketLabelSet() {
  if (!_SUGGESTED_ROLE_BUCKET_LABELS) {
    _SUGGESTED_ROLE_BUCKET_LABELS = {};
    Object.keys(DOMAIN_SUGGESTED_ROLES).forEach(function(fam) {
      var label = DOMAIN_SUGGESTED_ROLES[fam];
      if (label) _SUGGESTED_ROLE_BUCKET_LABELS[label] = true;
    });
  }
  return _SUGGESTED_ROLE_BUCKET_LABELS;
}

function isSuggestedRoleBucketLabel(name) {
  if (!name) return false;
  return !!getSuggestedRoleBucketLabelSet()[String(name).trim()];
}

/** Legacy placeholder owner names (single letters) were never valid ISSM names. */
function migrateLegacySingleLetterOwnerNames() {
  var owners = state.domainOwners;
  if (!owners || typeof owners !== 'object') return;
  Object.keys(owners).forEach(function(fam) {
    var o = owners[fam];
    if (!o || !o.name) return;
    if (o.name.length === 1 && DOMAIN_SUGGESTED_ROLES[fam]) {
      if (!o.role) o.role = DOMAIN_SUGGESTED_ROLES[fam];
      delete o.name;
    }
  });
}

/** Older builds stored suggested role bucket labels (e.g. "GRC/Risk Lead") as owner names. */
function migrateLegacyRoleBucketOwnerNames() {
  var changed = false;
  var owners = state.domainOwners;
  if (owners && typeof owners === 'object') {
    Object.keys(owners).forEach(function(fam) {
      var o = owners[fam];
      if (!o) return;
      var name = (o.name || '').trim();
      if (!name || !isSuggestedRoleBucketLabel(name)) return;
      if (isValidOwnerEmail(o.email)) return;
      if (!o.role) o.role = name;
      delete o.name;
      changed = true;
      if (!o.email && !o.role && !o.name) delete owners[fam];
    });
  }
  var ctrlOwners = state.controlOwners;
  if (ctrlOwners && typeof ctrlOwners === 'object') {
    Object.keys(ctrlOwners).forEach(function(cid) {
      var o = ctrlOwners[cid];
      if (!o) return;
      var name = (o.name || '').trim();
      if (!name || !isSuggestedRoleBucketLabel(name)) return;
      if (isValidOwnerEmail(o.email)) return;
      delete ctrlOwners[cid];
      changed = true;
    });
  }
  if (changed && typeof markDirty === 'function') markDirty();
}

function migrateAtoStateShape() {
  if (!Array.isArray(state.authBoundaries)) state.authBoundaries = [];
  if (!state.assessmentPlans || typeof state.assessmentPlans !== 'object' || Array.isArray(state.assessmentPlans)) {
    state.assessmentPlans = {};
  }
  if (!state.atoDecisions || typeof state.atoDecisions !== 'object' || Array.isArray(state.atoDecisions)) {
    state.atoDecisions = {};
  }
  if (!state._atoLibraryFilter || typeof state._atoLibraryFilter !== 'object' || Array.isArray(state._atoLibraryFilter)) {
    state._atoLibraryFilter = { families: [], assetTypes: [], assetIds: [], statuses: [], search: '' };
  }
  if (!Array.isArray(state._atoLibraryFilter.families)) state._atoLibraryFilter.families = [];
  if (!Array.isArray(state._atoLibraryFilter.assetTypes)) state._atoLibraryFilter.assetTypes = [];
  if (!Array.isArray(state._atoLibraryFilter.assetIds)) state._atoLibraryFilter.assetIds = [];
  if (!Array.isArray(state._atoLibraryFilter.statuses)) state._atoLibraryFilter.statuses = [];
  if (state._atoLibraryFilter.search == null) state._atoLibraryFilter.search = '';

  state.authBoundaries = state.authBoundaries.map(function(b) {
    if (!b || typeof b !== 'object') return null;
    if (!Array.isArray(b.assetTypes)) b.assetTypes = [];
    if (!Array.isArray(b.assetIds)) b.assetIds = [];
    if (!Array.isArray(b.processIds)) b.processIds = [];
    if (!Array.isArray(b.assessorUserIds)) b.assessorUserIds = [];
    if (!Array.isArray(b.conditions)) b.conditions = [];
    if (!b.atoStatus) b.atoStatus = 'not-started';
    if (b.atoGrantedDate == null) b.atoGrantedDate = '';
    if (b.atoExpiresDate == null) b.atoExpiresDate = '';
    return b;
  }).filter(Boolean);
  migrateCustomProgramRoles();
}

function migrateCustomProgramRoles() {
  if (!Array.isArray(state.customProgramRoles)) state.customProgramRoles = [];
  state.customProgramRoles = state.customProgramRoles.filter(function(x) {
    return x && typeof x === 'object' && String(x.slug || '').trim() && String(x.label || '').trim();
  }).map(function(x) {
    var tpl = String(x.tabsTemplate || 'assessor').toLowerCase();
    if (tpl !== 'reports-only') tpl = 'assessor';
    return { slug: String(x.slug).trim(), label: String(x.label).trim(), tabsTemplate: tpl };
  });
}

function seedXmplAtoDemoDataIfMissing() {
  var org = String(state.orgName || '').toLowerCase();
  if (org.indexOf('xmpl') === -1) return;
  if ((state.authBoundaries || []).length) return;
  var firstAsset = (state.assets || [])[0] || null;
  var firstAo = (state.users || []).find(function(u) { return u.role === 'ao' || u.role === 'approver'; });
  var firstAssessor = null;
  if (typeof atoPickDemoAssessorUserId === 'function') firstAssessor = atoPickDemoAssessorUserId(firstAsset);
  if (!firstAssessor) firstAssessor = (state.users || []).find(function(u) { return u.role === 'assessor' || u.role === 'issm'; });
  var boundaryId = 'ato-b-xmpl-demo';
  state.authBoundaries.push({
    id: boundaryId,
    name: 'XMPL Core Collaboration Boundary',
    description: 'Demo boundary for RMF Assess + Authorize walkthrough.',
    assetTypes: firstAsset ? [firstAsset.type] : [],
    assetIds: firstAsset ? [firstAsset.id] : [],
    processIds: [],
    aoUserId: firstAo ? firstAo.id : '',
    assessorUserIds: firstAssessor ? [firstAssessor.id] : [],
    atoStatus: 'in-assessment',
    atoGrantedDate: '',
    atoExpiresDate: '',
    conditions: []
  });
  if (!state.assessmentPlans) state.assessmentPlans = {};
  state.assessmentPlans[boundaryId] = {
    boundaryId: boundaryId,
    scopeMode: 'boundary',
    inScopeControlIds: [],
    controlPlans: {}
  };
}

function applyLoadedState(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return false;
  STATE_ALLOWED_KEYS.forEach(function(k) {
    if (k in saved) state[k] = saved[k];
  });
  normalizeStateShape();
  // Migrate legacy custodian string formats to object format
  migrateCustodianFormats();
  migrateLegacySingleLetterOwnerNames();
  migrateLegacyRoleBucketOwnerNames();
  migrateAtoStateShape();
  seedXmplAtoDemoDataIfMissing();
  return true;
}

/** Append one row to the activity trail (used by merges, approvals, imports, etc.). */
function addAuditEntry(category, refId, message) {
  if (!state.auditTrail) state.auditTrail = [];
  state.auditTrail.push({
    t: new Date().toISOString(),
    cat: category || 'program',
    ref: refId != null ? refId : '',
    msg: (message || '').toString()
  });
  if (state.auditTrail.length > 800) state.auditTrail = state.auditTrail.slice(-800);
}

// ── Field-level change log (NotebookLM Task 2) ─────────────────────────────
function valuesEqualForChangeLog(a, b) {
  if (a === b) return true;
  try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
}

function logFieldChange(path, oldVal, newVal) {
  if (valuesEqualForChangeLog(oldVal, newVal)) return;
  if (!state.changeLog) state.changeLog = [];
  var uid = state.currentUserId || (state.entraSession && state.entraSession.email) || 'admin';
  state.changeLog.push({
    t: new Date().toISOString(),
    u: uid,
    p: String(path || ''),
    o: oldVal,
    n: newVal
  });
  if (state.changeLog.length > 2000) state.changeLog = state.changeLog.slice(-2000);
  markDirty();
}

function normalizeOwnerEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidOwnerEmail(email) {
  var em = normalizeOwnerEmail(email);
  return em.length > 3 && em.indexOf('@') > 0 && em.indexOf('@') < em.length - 1;
}

function getOwnerDisplayName(owner) {
  if (!owner) return '—';
  var name = (owner.name || '').trim();
  if (name && !isSuggestedRoleBucketLabel(name)) return name;
  var email = (owner.email || '').trim();
  if (email) return email;
  return '—';
}

/** Policy domain owner for tables — name, else email, else em dash. */
function getDomainOwnerLabel(fam) {
  var owner = (state.domainOwners || {})[fam];
  return getOwnerDisplayName(owner);
}

function getDomainOwnerLabelOr(fam, fallback) {
  var label = getDomainOwnerLabel(fam);
  return label === '—' ? (fallback || '—') : label;
}

function hasRealControlOwner(co) {
  if (!co) return false;
  var name = (co.name || '').trim();
  if (name && !isSuggestedRoleBucketLabel(name)) return true;
  return isValidOwnerEmail(co.email);
}

function getControlOwnerDisplayName(co) {
  var label = getOwnerDisplayName(co);
  return label === '—' ? 'Unassigned' : label;
}

function userNeedsProfileSetup(user) {
  if (!user || user.isDemoPlaceholder) return false;
  if (user.profileComplete === true) return false;
  if (user.profileComplete === false) return true;
  var email = normalizeOwnerEmail(user.email);
  if (!email) return false;
  var name = (user.name || '').trim();
  if (!name) return true;
  if (name.toLowerCase() === email.split('@')[0]) return true;
  return name === 'Pending user';
}

function getMasterPolicyFamilies() {
  var families = typeof getActiveFamilies === 'function'
    ? getActiveFamilies().filter(function(f) { return f !== 'PM'; })
    : [];
  var merges = state.policyMerges || {};
  return families.filter(function(f) { return !merges[f]; });
}

function countAssignedPolicyDomains() {
  return getMasterPolicyFamilies().filter(function(fam) {
    return isValidOwnerEmail((state.domainOwners[fam] || {}).email);
  }).length;
}

function countUniquePolicyOwnerEmails() {
  var seen = {};
  getMasterPolicyFamilies().forEach(function(fam) {
    var em = normalizeOwnerEmail((state.domainOwners[fam] || {}).email);
    if (isValidOwnerEmail(em)) seen[em] = true;
  });
  return Object.keys(seen).length;
}

function getDemoPlaceholderNames() {
  var names = [];
  var seen = {};
  function add(n) {
    n = (n || '').trim();
    if (!n || seen[n]) return;
    seen[n] = true;
    names.push(n);
  }
  Object.keys(state.domainOwners || {}).forEach(function(fam) {
    var o = state.domainOwners[fam];
    if (o && o.isDemoPlaceholder) add(o.name);
  });
  Object.keys(state.controlOwners || {}).forEach(function(cid) {
    var o = state.controlOwners[cid];
    if (o && o.isDemoPlaceholder) add(o.name);
  });
  // Demo placeholder users (tagged when the prefill helpers seed state.users).
  (state.users || []).forEach(function(u) {
    if (u && u.isDemoPlaceholder) add(u.name);
  });
  return names;
}

function hasDemoPlaceholderOwners() {
  return getDemoPlaceholderNames().length > 0;
}

function blockActionIfDemoPlaceholders() {
  var names = getDemoPlaceholderNames();
  if (!names.length) return false;
  showToast('Demo placeholder owners detected. Replace ' + names.join(', ') + ' with real people before submitting.', true);
  return true;
}

function clearScopedUndoStack(reason) {
  state._undoStack = [];
}

var __undoToastTimer = null;
function pushScopedUndo(entry) {
  if (!state._undoStack) state._undoStack = [];
  state._undoStack.push(entry);
  if (state._undoStack.length > 20) state._undoStack = state._undoStack.slice(-20);
  showUndoActionToast(entry.label || 'Action recorded');
}

function showUndoActionToast(msg) {
  var existing = document.getElementById('__undo_toast__');
  if (existing) existing.remove();
  if (__undoToastTimer) clearTimeout(__undoToastTimer);
  var t = document.createElement('div');
  t.id = '__undo_toast__';
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:10040;background:#1e293b;color:white;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.25);display:flex;align-items:center;gap:12px;max-width:360px;';
  t.innerHTML = '<span>' + escapeHTML(msg) + '</span><button type="button" id="__undo_btn" style="background:#334155;color:white;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer;">Undo</button>';
  document.body.appendChild(t);
  document.getElementById('__undo_btn').onclick = function() {
    var last = state._undoStack && state._undoStack.pop();
    if (last && typeof last.undo === 'function') {
      try { last.undo(); } catch (e) { console.warn('undo failed', e); }
      markDirty();
      showToast('Last action undone');
      try { renderActiveCisoSetupStep(); } catch (e1) {}
      try { renderPolicyStep3(); } catch (e2) {}
      try { renderCISOStep3(); } catch (e3) {}
      try { renderControlStep1(); } catch (e4) {}
      try { renderControlStep2(); } catch (e5) {}
      try { renderPolicyStep2(); } catch (e6) {}
    }
    t.remove();
  };
  __undoToastTimer = setTimeout(function() {
    var el = document.getElementById('__undo_toast__');
    if (el) el.remove();
  }, 10000);
}

function validateProgramShape(parsed) {
  var errors = [];
  var warnings = [];
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, errors: ['Root must be a plain object'], warnings: [] };
  }
  Object.keys(parsed).forEach(function(k) {
    if (STATE_ALLOWED_KEYS.indexOf(k) === -1) {
      warnings.push('Unknown top-level key: ' + k);
      try { console.warn('[import]', warnings[warnings.length - 1]); } catch (e) {}
    }
  });
  function valType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (isPlainObject(v)) return 'object';
    return typeof v;
  }
  STATE_ALLOWED_KEYS.forEach(function(k) {
    if (!(k in parsed)) return;
    var exp = valType(STATE_DEFAULTS[k]);
    var got = valType(parsed[k]);
    if (exp !== got) {
      errors.push('Field "' + k + '" must be ' + exp + ', got ' + got);
    }
  });
  if ('baseline' in parsed && parsed.baseline != null && ['L', 'M', 'H'].indexOf(parsed.baseline) === -1) {
    errors.push('baseline must be null, "L", "M", or "H"');
  }
  if (errors.length > 5) errors = errors.slice(0, 5);
  return { ok: errors.length === 0, errors: errors, warnings: warnings };
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const _esc = escapeHTML;

function buildPersistedPayload() {
  var payload = {};
  STATE_ALLOWED_KEYS.forEach(function(k) {
    payload[k] = state[k];
  });
  return payload;
}

function totalEvidenceImageDataUrlChars() {
  var total = 0;
  Object.keys(state.controlStatus || {}).forEach(function(ctrlId) {
    var ev = (state.controlStatus[ctrlId] || {}).evidence;
    if (!Array.isArray(ev)) return;
    ev.forEach(function(row) {
      if (row && row.kind === 'image' && row.dataUrl) total += String(row.dataUrl).length;
    });
  });
  return total;
}

function saveToStorage() {
  try {
    var imgChars = totalEvidenceImageDataUrlChars();
    if (imgChars > 3 * 1024 * 1024) {
      showToast('Warning: evidence images total ~' + (imgChars / 1024 / 1024).toFixed(1) + ' MB encoded — may hit browser storage limits.', true);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedPayload()));
    localStorage.setItem(STORAGE_KEY + '-ts', new Date().toISOString());
    _updateSaveIndicator(true);
    window.isDirty = false;
    // In multi-user (cloud) mode, also push the program to the shared backend.
    if (typeof cloudPushDebounced === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
      cloudPushDebounced();
    }
  } catch (e) {
    console.warn('saveToStorage', e);
    showToast('Could not save to browser storage (quota or private mode). Use Export JSON for a file backup.', true);
  }
}

function loadFromStorage() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var saved = JSON.parse(raw);
    return applyLoadedState(saved);
  } catch (e) {
    console.warn('loadFromStorage', e);
    return false;
  }
}

function exportProgramJson() {
  function doExport() {
    try {
      var blob = new Blob([JSON.stringify(buildPersistedPayload(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      var base = ((state.orgName || '') + '').replace(/[^\w\-.]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'grc-program';
      a.href = URL.createObjectURL(blob);
      a.download = base + '-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      showToast('JSON export downloaded — keep it as a backup outside the browser.');
    } catch (e) {
      showToast('Export failed.', true);
    }
  }
  if (!hasDemoPlaceholderOwners()) {
    doExport();
    return;
  }
  var overlay = document.createElement('div');
  overlay.id = 'exportDemoWarnOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = '<div style="background:white;border-radius:14px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:8px;">Demo placeholder owners</div>'
    + '<p style="font-size:13px;color:var(--text-muted);line-height:1.55;margin:0 0 16px 0;">This program contains demo placeholder owners. Export anyway for testing, or cancel to replace them first.</p>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" type="button" id="exportDemoCancel">Cancel</button>'
    + '<button class="btn btn-primary" type="button" id="exportDemoAnyway">Export anyway</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  document.getElementById('exportDemoCancel').onclick = function() { overlay.remove(); };
  document.getElementById('exportDemoAnyway').onclick = function() { overlay.remove(); doExport(); };
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

function importProgramFromFile(ev) {
  var input = ev && ev.target;
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function() {
    try {
      var saved = JSON.parse(reader.result);
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('invalid');
      var vr = validateProgramShape(saved);
      if (!vr.ok) {
        var msg = (vr.errors || []).slice(0, 5).map(function(e) { return escapeHTML(e); }).join('<br>');
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;';
        overlay.innerHTML = '<div style="background:white;border-radius:14px;max-width:520px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
          + '<div style="font-size:17px;font-weight:800;color:#b91c1c;margin-bottom:10px;">Import validation failed</div>'
          + '<div style="font-size:13px;color:#334155;line-height:1.5;margin-bottom:16px;">' + (msg || 'Unknown validation error') + '</div>'
          + '<button class="btn btn-primary" type="button" id="importErrClose">OK</button></div>';
        document.body.appendChild(overlay);
        document.getElementById('importErrClose').onclick = function() { overlay.remove(); };
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
        if (input) input.value = '';
        return;
      }
      var backupName = 'Pre-import backup ' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveCurrentSnapshot(backupName, true);
      showToast('Current program saved as auto-backup snapshot before import.');
      if (!applyLoadedState(saved)) throw new Error('apply');
      Object.keys(currentStep).forEach(function(k) { currentStep[k] = 1; });
      applyRoleView('admin');
      showTab('ciso');
      goToStep('ciso', 1);
      saveToStorage();
      showToast('Program imported from file. Data saved to this browser.');
    } catch (err) {
      console.warn('importProgramFromFile', err);
      showToast('Could not import that file. Choose a valid program JSON export.', true);
    }
    if (input) input.value = '';
  };
  reader.onerror = function() {
    showToast('Could not read the file.', true);
    if (input) input.value = '';
  };
  reader.readAsText(file);
}

window.saveToStorage = saveToStorage;
window.loadFromStorage = loadFromStorage;
window.exportProgramJson = exportProgramJson;
window.importProgramFromFile = importProgramFromFile;

// ============================================================
// STATE PERSISTENCE HELPERS
// ============================================================
// markDirty() is called from 70+ places in the codebase whenever state mutates
// (oninput handlers, delete actions, wizard advancement, approval actions). It
// flags the state as dirty and schedules a debounced save to localStorage.
// Missing this function caused bare `markDirty()` calls to throw ReferenceError
// and silently abort their caller — for example, the ISP approve/return buttons.
var _saveDebounceTimer = null;
function markDirty() {
  window.isDirty = true;
  try { _updateSaveIndicator(false); } catch (e) { /* indicator DOM may not exist yet */ }
  if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(function() {
    _saveDebounceTimer = null;
    try { if (typeof saveToStorage === 'function') saveToStorage(); } catch (e) { console.warn('saveToStorage failed:', e); }
  }, 400);
}
window.markDirty = markDirty;

// _updateSaveIndicator(saved) toggles the small "Saved / Saving…" pill in the
// top-right. It's defensive — if the element isn't in the DOM (e.g. during
// early initialization or in printable views) it no-ops.
function _updateSaveIndicator(saved) {
  var el = document.getElementById('saveIndicator');
  if (!el) return;
  if (saved) {
    el.textContent = '✓ Saved';
    el.style.color = 'var(--teal)';
  } else {
    el.textContent = '… Saving';
    el.style.color = 'var(--text-muted)';
  }
}

function getActiveControls() {
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

/** Canonical control id if `input` matches an entry in CONTROLS (trim + case-insensitive), else null. */
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
}

function getSavedSnapshots() {
  try {
    var raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function pruneAutoRestoreSnapshots() {
  var snaps = getSavedSnapshots();
  var auto = [];
  var rest = [];
  snaps.forEach(function(s) {
    if (s && s.name && String(s.name).indexOf('Auto-backup before restore') === 0) auto.push(s);
    else rest.push(s);
  });
  auto.sort(function(a, b) { return String(b.saved).localeCompare(String(a.saved)); });
  var keep = auto.slice(0, 5);
  var merged = keep.concat(rest);
  if (merged.length !== snaps.length) {
    try { localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(merged)); } catch (e) {}
  }
}

const XMPL_SNAPSHOT = {
  name: 'XMPL Info Sec Policy',
  saved: "2026-04-21T00:00:00.000Z",
  org: 'Xmpl Inc',
  data: '{"baseline":"L","privacyOverlay":false,"orgName":"Xmpl Inc","programOwner":"Dana Reyes","programOwnerTitle":"Chief Information Security Officer","programOwnerEmail":"dana.reyes@xmpl.io","cisoIsISSM":true,"pmControls":{"PM-1":true,"PM-2":true,"PM-3":true,"PM-4":true,"PM-5":true,"PM-5(1)":true,"PM-6":true,"PM-7":true,"PM-7(1)":true,"PM-8":true,"PM-9":true,"PM-10":true,"PM-11":true,"PM-12":true,"PM-13":true,"PM-14":true,"PM-15":true,"PM-16":true,"PM-16(1)":true,"PM-17":true,"PM-18":true,"PM-19":true,"PM-20":true,"PM-20(1)":true,"PM-21":true,"PM-22":true,"PM-23":true,"PM-24":true,"PM-25":true,"PM-26":true},"domainOwners":{"AC":{"name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"Security Engineer"},"IA":{"name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"Security Engineer"},"AU":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"CM":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"IR":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"AT":{"name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"GRC Analyst"},"PS":{"name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"GRC Analyst"},"CP":{"name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"GRC Analyst"},"CA":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"PE":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"MP":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"MA":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"SA":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"SR":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"}},"policyDeadlines":{"AC":"2026-05-01","IA":"2026-05-01","AU":"2026-05-01","IR":"2026-05-01","CM":"2026-06-01","CP":"2026-06-01","AT":"2026-06-01","PS":"2026-06-01","CA":"2026-07-15","PE":"2026-07-15","MP":"2026-07-15","MA":"2026-07-15","SA":"2026-07-15","SR":"2026-07-15"},"policyStatus":{"AC":{"status":"Draft","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"IA":{"status":"Draft","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"AU":{"status":"Draft","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"IR":{"status":"Draft","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"CM":{"status":"Planned","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"CP":{"status":"Planned","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"AT":{"status":"Planned","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"PS":{"status":"Planned","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"CA":{"status":"Planned","version":"1.0","notes":"Scheduled for Phase 2","lastUpdated":"2026-04-03"},"PE":{"status":"Planned","version":"1.0","notes":"Scheduled for Phase 2","lastUpdated":"2026-04-03"},"MP":{"status":"Planned","version":"1.0","notes":"Scheduled for Phase 2","lastUpdated":"2026-04-03"},"MA":{"status":"Planned","version":"1.0","notes":"Scheduled for Phase 2","lastUpdated":"2026-04-03"},"SA":{"status":"Planned","version":"1.0","notes":"Scheduled for Phase 2","lastUpdated":"2026-04-03"},"SR":{"status":"Planned","version":"1.0","notes":"Scheduled for Phase 2","lastUpdated":"2026-04-03"}},"controlStatus":{},"controlOwnerAttested":false,"controlTestResults":{},"customProgramRoles":[],"assets":[],"attestations":{},"sspAttestations":{},"sspSignoffs":{},"customAssetTypes":[],"cisoComplete":false,"infoSecPolicy":{"orgName":"Xmpl Inc","ciso":"Dana Reyes","cisoEmail":"dana.reyes@xmpl.io","approvalStatus":"Draft","requirements":[{"id":"IS-REQ-1","controlFamily":"PM-1","title":"Information Security Program Plan","requirement":"Xmpl Inc shall develop, document, disseminate, review (annually), and update an organization-wide information security program plan. The plan shall describe the structure of the security program, identify key roles, reference all domain-level policies, and align security objectives to business risk tolerance.","nistRef":"[NIST 800-53: PM-1]"},{"id":"IS-REQ-2","controlFamily":"PM-2","title":"CISO Designation and Authority","requirement":"Xmpl Inc shall designate the CISO as the senior agency information security officer responsible for coordinating, developing, implementing, and maintaining the organization-wide information security program. The CISO shall report directly to the CEO and maintain authority over security budget, staffing, and risk acceptance decisions.","nistRef":"[NIST 800-53: PM-2]"},{"id":"IS-REQ-3","controlFamily":"PM-9","title":"Risk Management Strategy","requirement":"Xmpl Inc shall establish and maintain a risk management strategy that defines risk tolerance thresholds, assessment methodology, and risk response options (accept, mitigate, transfer, avoid). Risk management shall be integrated into the system development lifecycle and business planning processes.","nistRef":"[NIST 800-53: PM-9]"},{"id":"IS-REQ-4","controlFamily":"All -1 Controls","title":"Domain-Level Security Policies","requirement":"Xmpl Inc shall develop, approve, and maintain domain-level security policies and implementing procedures for each NIST 800-53 control family in scope. Policies shall state requirements (\'what must be done\') and procedures shall describe implementation methods (\'how to do it\'). All policies shall be reviewed annually and approved by the CISO.","nistRef":"[NIST 800-53: all -1 controls]"},{"id":"IS-REQ-5","controlFamily":"PM-3","title":"Information Security Resource Requirements","requirement":"Xmpl Inc shall define, resource, and track information security resource requirements as part of capital planning and investment control. Security spending shall be justified by risk reduction and aligned to the organization\'s strategic plan.","nistRef":"[NIST 800-53: PM-3]"},{"id":"IS-REQ-6","controlFamily":"PM-10","title":"Testing, Training, and Monitoring Process","requirement":"Xmpl Inc shall establish and institutionalize a process for ensuring that organizational plans for conducting security and privacy testing, training, and monitoring are developed and maintained.","nistRef":"[NIST 800-53: PM-10]"}]},"policySelectedControls":null,"domainPolicies":null,"controlOwners":{},"policyMerges":{"PS":"AT","MP":"PE","SR":"SA"},"policyPriorities":{},"domainDeadlines":{},"domainCustomNames":{"PS":"People Security (AT+PS)","MP":"Physical & Media Security (PE+MP)","SR":"Supply Chain & Acquisition (SA+SR)"},"cisoStep4Sub":1,"policyCustodians":{},"users":[{"id":"user-1","name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"ciso","families":["PM","AC","IA","AU","IR","CM","CP","AT","PS","CA","PE","MP","MA","SA","SR"],"controls":[],"note":"Chief Information Security Officer"},{"id":"user-2","name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"issm","families":["AC","IA"],"controls":[],"note":"Security Engineer"},{"id":"user-3","name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"issm","families":["AT","PS","CP"],"controls":[],"note":"GRC Analyst"},{"id":"user-4","name":"Liam Park","email":"liam.park@xmpl.io","role":"control-owner","families":["AC","IA"],"controls":["AC-1","AC-2","AC-3","AC-7","AC-8","AC-14","AC-17","AC-18","AC-19","AC-20"],"note":"DevOps Engineer"},{"id":"user-5","name":"Sofia Hernandez","email":"sofia.hernandez@xmpl.io","role":"control-owner","families":["AU","IR"],"controls":["AU-1","AU-2","AU-3","AU-4","AU-5","AU-6","AU-8","AU-9","AU-11","AU-12","IR-1","IR-2","IR-3","IR-4","IR-5"],"note":"Security Operations Analyst"},{"id":"user-6","name":"Noah Williams","email":"noah.williams@xmpl.io","role":"control-owner","families":["CM","CP"],"controls":["CM-1","CM-2","CM-3","CM-4","CM-5","CP-1","CP-2","CP-3"],"note":"Platform Engineer"}],"currentUserId":null,"controlDeadlines":{},"controlWorkflowState":{},"controlReviewQueue":[],"assetMappings":{},"policyVersions":{},"policyAcknowledgments":{},"testAdequacy":{}}'
};

const XMPL_DOMAIN_SNAPSHOT = {
  name: 'XMPL - Domain Policies',
  saved: "2026-04-21T00:00:00.000Z",
  org: 'Xmpl Inc',
  data: '{"baseline":"L","privacyOverlay":false,"orgName":"Xmpl Inc","programOwner":"Dana Reyes","programOwnerTitle":"Chief Information Security Officer","programOwnerEmail":"dana.reyes@xmpl.io","cisoIsISSM":true,"pmControls":{"PM-1":true,"PM-2":true,"PM-3":true,"PM-4":true,"PM-5":true,"PM-5(1)":true,"PM-6":true,"PM-7":true,"PM-7(1)":true,"PM-8":true,"PM-9":true,"PM-10":true,"PM-11":true,"PM-12":true,"PM-13":true,"PM-14":true,"PM-15":true,"PM-16":true,"PM-16(1)":true,"PM-17":true,"PM-18":true,"PM-19":true,"PM-20":true,"PM-20(1)":true,"PM-21":true,"PM-22":true,"PM-23":true,"PM-24":true,"PM-25":true,"PM-26":true},"policyMerges":{"PS":"AT","MP":"PE","SR":"SA","IR":"AU","MA":"CM","SI":"SC","PL":"CA","RA":"CA"},"domainCustomNames":{"AT":"People Security (AT+PS)","PS":"People Security (AT+PS)","PE":"Physical & Media Security (PE+MP)","MP":"Physical & Media Security (PE+MP)","SA":"Supply Chain & Acquisition (SA+SR)","SR":"Supply Chain & Acquisition (SA+SR)","AU":"Security Operations (AU+IR)","IR":"Security Operations (AU+IR)","CM":"Configuration & Maintenance (CM+MA)","MA":"Configuration & Maintenance (CM+MA)","SC":"System Security (SC+SI)","SI":"System Security (SC+SI)","CA":"Governance & Assessment (CA+PL+RA)","PL":"Governance & Assessment (CA+PL+RA)","RA":"Governance & Assessment (CA+PL+RA)"},"domainOwners":{"AC":{"name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"Security Engineer"},"IA":{"name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"Security Engineer"},"SC":{"name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"Security Engineer"},"SI":{"name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"Security Engineer"},"AU":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"IR":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"CM":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"MA":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"CA":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"PL":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"RA":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"PE":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"MP":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"SA":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"SR":{"name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"Chief Information Security Officer"},"AT":{"name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"GRC Analyst"},"PS":{"name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"GRC Analyst"},"CP":{"name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"GRC Analyst"}},"policyDeadlines":{"AC":"2026-05-01","IA":"2026-05-01","SC":"2026-05-01","SI":"2026-05-01","AU":"2026-05-01","IR":"2026-05-01","CM":"2026-06-01","MA":"2026-06-01","AT":"2026-06-01","PS":"2026-06-01","CP":"2026-06-01","CA":"2026-07-15","PL":"2026-07-15","RA":"2026-07-15","PE":"2026-07-15","MP":"2026-07-15","SA":"2026-07-15","SR":"2026-07-15"},"policyStatus":{"AC":{"status":"In Progress","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"IA":{"status":"In Progress","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"SC":{"status":"In Progress","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"SI":{"status":"In Progress","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"AU":{"status":"In Progress","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"IR":{"status":"In Progress","version":"1.0","notes":"Initial draft pending domain owner review","lastUpdated":"2026-04-03"},"CM":{"status":"In Progress","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"MA":{"status":"In Progress","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"AT":{"status":"In Progress","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"PS":{"status":"In Progress","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"CP":{"status":"In Progress","version":"1.0","notes":"Scheduled for development","lastUpdated":"2026-04-03"},"CA":{"status":"In Progress","version":"1.0","notes":"Scheduled for Phase 3","lastUpdated":"2026-04-03"},"PL":{"status":"In Progress","version":"1.0","notes":"Scheduled for Phase 3","lastUpdated":"2026-04-03"},"RA":{"status":"In Progress","version":"1.0","notes":"Scheduled for Phase 3","lastUpdated":"2026-04-03"},"PE":{"status":"In Progress","version":"1.0","notes":"Scheduled for Phase 3","lastUpdated":"2026-04-03"},"MP":{"status":"In Progress","version":"1.0","notes":"Scheduled for Phase 3","lastUpdated":"2026-04-03"},"SA":{"status":"In Progress","version":"1.0","notes":"Scheduled for Phase 3","lastUpdated":"2026-04-03"},"SR":{"status":"In Progress","version":"1.0","notes":"Scheduled for Phase 3","lastUpdated":"2026-04-03"}},"policySelectedControls":{"AC":["AC-1","AC-2","AC-3","AC-7","AC-8","AC-14","AC-17","AC-18","AC-19","AC-20","AC-22"],"IA":["IA-1","IA-2","IA-2(1)","IA-2(2)","IA-2(8)","IA-2(12)","IA-4","IA-5","IA-5(1)","IA-6","IA-7","IA-8","IA-8(1)","IA-8(2)","IA-8(4)","IA-11"],"AU":["AU-1","AU-2","AU-3","AU-4","AU-5","AU-6","AU-8","AU-9","AU-11","AU-12"],"IR":["IR-1","IR-2","IR-4","IR-5","IR-6","IR-7","IR-8"],"CM":["CM-1","CM-2","CM-4","CM-5","CM-6","CM-7","CM-8","CM-10","CM-11"],"MA":["MA-1","MA-2","MA-4","MA-5"],"AT":["AT-1","AT-2","AT-2(2)","AT-3","AT-4"],"PS":["PS-1","PS-2","PS-3","PS-4","PS-5","PS-6","PS-7","PS-8","PS-9"],"CP":["CP-1","CP-2","CP-3","CP-4","CP-9","CP-10"],"CA":["CA-1","CA-2","CA-3","CA-5","CA-6","CA-7","CA-7(4)","CA-9"],"PL":["PL-1","PL-2","PL-4","PL-4(1)","PL-10","PL-11"],"RA":["RA-1","RA-2","RA-3","RA-3(1)","RA-5","RA-5(2)","RA-5(11)","RA-7"],"PE":["PE-1","PE-2","PE-3","PE-6","PE-8","PE-12","PE-13","PE-14","PE-15","PE-16"],"MP":["MP-1","MP-2","MP-6","MP-7"],"SC":["SC-1","SC-5","SC-7","SC-12","SC-13","SC-15","SC-20","SC-21","SC-22","SC-39"],"SI":["SI-1","SI-2","SI-3","SI-4","SI-5","SI-12"],"SA":["SA-1","SA-2","SA-3","SA-4","SA-4(10)","SA-5","SA-8","SA-9","SA-22"],"SR":["SR-1","SR-2","SR-2(1)","SR-3","SR-5","SR-8","SR-10","SR-11","SR-11(1)","SR-11(2)","SR-12"]},"policyCustodians":{"AC":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"IA":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AU":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"CM":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"MA":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"AT":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"CP":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CA":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PL":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PE":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"MP":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"SC":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SI":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SA":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"}},"controlOwners":{"AC-1":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-2":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-3":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-7":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-8":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-14":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-17":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-18":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-19":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-20":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AC-22":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"IA-1":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"IA-2":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"IA-2(1)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-2(2)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-2(8)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-2(12)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-4":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-5":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-5(1)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-6":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-7":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-8":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-8(1)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-8(2)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-8(4)":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"IA-11":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"CM-2":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"CM-4":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"CM-5":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"CM-6":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"CM-7":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"CM-8":{"name":"Liam Park","role":"DevOps Engineer","email":"liam.park@xmpl.io"},"AU-1":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-2":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-3":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-4":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-5":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-6":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-8":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-9":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-11":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"AU-12":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR-1":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR-2":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR-4":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR-5":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR-6":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR-7":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"IR-8":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"SI-2":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"SI-3":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"SI-4":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"SI-5":{"name":"Sofia Hernandez","role":"Security Operations Analyst","email":"sofia.hernandez@xmpl.io"},"CM-1":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CM-10":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CM-11":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CP-1":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CP-2":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CP-3":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CP-4":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CP-9":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"CP-10":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"SC-5":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"SC-7":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"SC-39":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"MA-1":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"MA-2":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"MA-4":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"MA-5":{"name":"Noah Williams","role":"Platform Engineer","email":"noah.williams@xmpl.io"},"SC-1":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SC-12":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SC-13":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SC-15":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SC-20":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SC-21":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SC-22":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SI-1":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"SI-12":{"name":"Kai Nakamura","role":"Security Engineer","email":"kai.nakamura@xmpl.io"},"PE-1":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-2":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-3":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-6":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-8":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-12":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-13":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-14":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-15":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"PE-16":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"MP-1":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"MP-2":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"MP-6":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"MP-7":{"name":"Aisha Patel","role":"IT Manager","email":"aisha.patel@xmpl.io"},"AT-1":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"AT-2":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"AT-2(2)":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"AT-3":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"AT-4":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-1":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-2":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-3":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-4":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-5":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-6":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-7":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-8":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"PS-9":{"name":"Tomás Rivera","role":"HR Manager","email":"tomas.rivera@xmpl.io"},"SA-1":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-2":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-3":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-4":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-4(10)":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-5":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-8":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-9":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SA-22":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-1":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-2":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-2(1)":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-3":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-5":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-8":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-10":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-11":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-11(1)":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-11(2)":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"SR-12":{"name":"Jing Chen","role":"Procurement Lead","email":"jing.chen@xmpl.io"},"CA-1":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"CA-2":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"CA-3":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"CA-5":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"CA-6":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"CA-7":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"CA-7(4)":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"CA-9":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PL-1":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PL-2":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PL-4":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PL-4(1)":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PL-10":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"PL-11":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-1":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-2":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-3":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-3(1)":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-5":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-5(2)":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-5(11)":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"},"RA-7":{"name":"Mira Okonkwo","role":"GRC Analyst","email":"mira.okonkwo@xmpl.io"}},"users":[{"id":"user-1","name":"Dana Reyes","email":"dana.reyes@xmpl.io","role":"ciso","families":["PM","AC","IA","AU","IR","CM","MA","CP","AT","PS","CA","PL","RA","PE","MP","SC","SI","SA","SR"],"controls":[],"note":"Chief Information Security Officer"},{"id":"user-2","name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"issm","families":["AC","IA","SC","SI"],"controls":[],"note":"Security Engineer"},{"id":"user-3","name":"Mira Okonkwo","email":"mira.okonkwo@xmpl.io","role":"issm","families":["AT","PS","CP","CA","PL","RA"],"controls":[],"note":"GRC Analyst"},{"id":"user-4","name":"Liam Park","email":"liam.park@xmpl.io","role":"control-owner","families":["AC","IA","CM"],"controls":["AC-1","AC-2","AC-3","AC-7","AC-8","AC-14","AC-17","AC-18","AC-19","AC-20","AC-22","IA-1","IA-2","IA-2(1)","IA-2(2)","IA-2(8)","IA-2(12)","IA-4","IA-5","IA-5(1)","IA-6","IA-7","IA-8","IA-8(1)","IA-8(2)","IA-8(4)","IA-11","CM-2","CM-4","CM-5","CM-6","CM-7","CM-8"],"note":"DevOps Engineer"},{"id":"user-5","name":"Sofia Hernandez","email":"sofia.hernandez@xmpl.io","role":"control-owner","families":["AU","IR","SI"],"controls":["AU-1","AU-2","AU-3","AU-4","AU-5","AU-6","AU-8","AU-9","AU-11","AU-12","IR-1","IR-2","IR-4","IR-5","IR-6","IR-7","IR-8","SI-2","SI-3","SI-4","SI-5"],"note":"Security Operations Analyst"},{"id":"user-6","name":"Noah Williams","email":"noah.williams@xmpl.io","role":"control-owner","families":["CM","CP","SC","MA"],"controls":["CM-1","CM-10","CM-11","CP-1","CP-2","CP-3","CP-4","CP-9","CP-10","SC-5","SC-7","SC-39","MA-1","MA-2","MA-4","MA-5"],"note":"Platform Engineer"},{"id":"user-7","name":"Aisha Patel","email":"aisha.patel@xmpl.io","role":"control-owner","families":["PE","MP"],"controls":["PE-1","PE-2","PE-3","PE-6","PE-8","PE-12","PE-13","PE-14","PE-15","PE-16","MP-1","MP-2","MP-6","MP-7"],"note":"IT Manager"},{"id":"user-8","name":"Tomás Rivera","email":"tomas.rivera@xmpl.io","role":"control-owner","families":["AT","PS"],"controls":["AT-1","AT-2","AT-2(2)","AT-3","AT-4","PS-1","PS-2","PS-3","PS-4","PS-5","PS-6","PS-7","PS-8","PS-9"],"note":"HR Manager"},{"id":"user-9","name":"Jing Chen","email":"jing.chen@xmpl.io","role":"control-owner","families":["SA","SR"],"controls":["SA-1","SA-2","SA-3","SA-4","SA-4(10)","SA-5","SA-8","SA-9","SA-22","SR-1","SR-2","SR-2(1)","SR-3","SR-5","SR-8","SR-10","SR-11","SR-11(1)","SR-11(2)","SR-12"],"note":"Procurement Lead"},{"id":"user-10","name":"Kai Nakamura","email":"kai.nakamura@xmpl.io","role":"control-owner","families":["SC","SI","IA"],"controls":["SC-1","SC-12","SC-13","SC-15","SC-20","SC-21","SC-22","SI-1","SI-12","IA-2(1)","IA-2(2)","IA-2(8)","IA-2(12)","IA-4","IA-5","IA-5(1)","IA-6","IA-7","IA-8","IA-8(1)","IA-8(2)","IA-8(4)"],"note":"Security Engineer (Control Owner)"}],"domainPolicies":{"AC":{"title":"Access Control Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Access Control Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to AC controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"AC-REQ-1","controls":["AC-1"],"text":"Xmpl Inc shall develop, document, and disseminate an access control policy and associated procedures, reviewing and updating them at least annually."},{"id":"AC-REQ-2","controls":["AC-2"],"text":"Xmpl Inc shall manage information system accounts throughout their lifecycle, including provisioning, review, modification, and deprovisioning, with documented approval workflows."},{"id":"AC-REQ-3","controls":["AC-3"],"text":"Xmpl Inc shall enforce least privilege access by limiting user access to information and systems to the minimum required to perform assigned job functions."},{"id":"AC-REQ-4","controls":["AC-7"],"text":"Xmpl Inc shall implement login attempt restrictions and account lockout mechanisms to prevent unauthorized access through password-guessing attacks."},{"id":"AC-REQ-5","controls":["AC-8"],"text":"Xmpl Inc shall display system use notification and consent messages to users before granting access to organizational systems."},{"id":"AC-REQ-6","controls":["AC-14"],"text":"Xmpl Inc shall grant access to organizational systems only after verified identity authentication and explicit authorization."},{"id":"AC-REQ-7","controls":["AC-17"],"text":"Xmpl Inc shall restrict remote access to authorized locations, devices, and users using secure protocols and multi-factor authentication."},{"id":"AC-REQ-8","controls":["AC-18"],"text":"Xmpl Inc shall ensure that wireless access points are configured with strong encryption and access controls, with periodic testing for rogue devices."},{"id":"AC-REQ-9","controls":["AC-19"],"text":"Xmpl Inc shall identify and classify all types of mobile devices used for work and enforce security requirements, usage policies, and configuration standards."},{"id":"AC-REQ-10","controls":["AC-20"],"text":"Xmpl Inc shall define and enforce security requirements for external systems that process, store, or transmit organizational information."},{"id":"AC-REQ-11","controls":["AC-22"],"text":"Xmpl Inc shall regularly review and update access authorizations based on changes in job responsibilities and organizational needs."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"IA":{"title":"Identification & Authentication Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Identification & Authentication Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to IA controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"IA-REQ-1","controls":["IA-1"],"text":"Xmpl Inc shall develop, document, and maintain an identification and authentication policy consistent with organizational security objectives."},{"id":"IA-REQ-2","controls":["IA-2","IA-2(1)","IA-2(2)","IA-2(8)","IA-2(12)"],"text":"Xmpl Inc shall implement multi-factor authentication for all users accessing organizational systems, with at least two factors such as something you know, something you have, or something you are."},{"id":"IA-REQ-4","controls":["IA-4"],"text":"Xmpl Inc shall manage user identifiers uniquely, ensuring they are issued, maintained, and retired in accordance with organizational policy."},{"id":"IA-REQ-5","controls":["IA-5","IA-5(1)"],"text":"Xmpl Inc shall enforce authenticator management including generation, change, and protection of passwords and other authentication credentials with minimum complexity and length requirements."},{"id":"IA-REQ-6","controls":["IA-6"],"text":"Xmpl Inc shall obscure feedback of authentication information during user authentication processes to prevent disclosure to unauthorized individuals."},{"id":"IA-REQ-7","controls":["IA-7"],"text":"Xmpl Inc shall use cryptographically secure protocols for authentication information transmission and storage."},{"id":"IA-REQ-8","controls":["IA-8","IA-8(1)","IA-8(2)","IA-8(4)"],"text":"Xmpl Inc shall use trusted and approved identification and authentication protocols and mechanisms, including PKIX, Kerberos, or approved cryptographic methods."},{"id":"IA-REQ-11","controls":["IA-11"],"text":"Xmpl Inc shall ensure that organizational systems automatically lock user sessions after a defined period of inactivity and require re-authentication to resume operations."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"AU":{"title":"Audit & Accountability Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Audit & Accountability Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to AU controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"AU-REQ-1","controls":["AU-1"],"text":"Xmpl Inc shall develop, document, and maintain an audit and accountability policy that defines audit objectives, scope, and responsibilities."},{"id":"AU-REQ-2","controls":["AU-2"],"text":"Xmpl Inc shall determine which events within organizational systems must be audited, including security-relevant actions, administrative activity, and policy violations."},{"id":"AU-REQ-3","controls":["AU-3"],"text":"Xmpl Inc shall configure systems to generate audit records that include user identity, event type, date/time, success/failure, and other relevant details needed for investigation."},{"id":"AU-REQ-4","controls":["AU-4"],"text":"Xmpl Inc shall allocate sufficient audit log storage capacity to accommodate expected volumes without losing records, implementing log rotation and archival procedures."},{"id":"AU-REQ-5","controls":["AU-5"],"text":"Xmpl Inc shall implement alerting mechanisms to notify security personnel of audit logging failures or suspected log tampering within defined timeframes."},{"id":"AU-REQ-6","controls":["AU-6"],"text":"Xmpl Inc shall regularly review and analyze audit records to identify security-relevant events, anomalies, and potential violations."},{"id":"AU-REQ-8","controls":["AU-8"],"text":"Xmpl Inc shall synchronize system clocks to an authoritative time source to ensure accurate and consistent audit log timestamps."},{"id":"AU-REQ-9","controls":["AU-9"],"text":"Xmpl Inc shall protect audit information and tools from unauthorized access, modification, and deletion through access controls and integrity checks."},{"id":"AU-REQ-11","controls":["AU-11"],"text":"Xmpl Inc shall retain audit records for a minimum of one year, with at least three months held online for immediate access."},{"id":"AU-REQ-12","controls":["AU-12"],"text":"Xmpl Inc shall provide audit record generation and review capabilities to support organizational investigations and compliance requirements."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"IR":{"title":"Incident Response Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Incident Response Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to IR controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"IR-REQ-1","controls":["IR-1"],"text":"Xmpl Inc shall develop, document, and maintain an incident response policy that defines roles, responsibilities, and procedures for detecting and responding to security incidents."},{"id":"IR-REQ-2","controls":["IR-2"],"text":"Xmpl Inc shall establish an incident response team with designated roles including incident commander, technical analysis, forensics, and communications personnel."},{"id":"IR-REQ-4","controls":["IR-4"],"text":"Xmpl Inc shall implement incident handling capabilities to investigate and respond to confirmed or suspected security incidents within documented timeframes."},{"id":"IR-REQ-5","controls":["IR-5"],"text":"Xmpl Inc shall document all security incidents, including event details, response actions taken, lessons learned, and evidence preservation methods."},{"id":"IR-REQ-6","controls":["IR-6"],"text":"Xmpl Inc shall establish procedures for reporting security incidents to appropriate internal and external parties, including legal, law enforcement, and affected individuals."},{"id":"IR-REQ-7","controls":["IR-7"],"text":"Xmpl Inc shall deploy incident response support tools and resources to enable rapid detection, analysis, containment, and recovery from security incidents."},{"id":"IR-REQ-8","controls":["IR-8"],"text":"Xmpl Inc shall conduct post-incident reviews to analyze response effectiveness, identify gaps, and implement improvements to prevent recurrence."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"CM":{"title":"Configuration Management Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Configuration Management Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to CM controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"CM-REQ-1","controls":["CM-1"],"text":"Xmpl Inc shall develop, document, and maintain a configuration management policy that defines procedures for baseline creation, change management, and compliance verification."},{"id":"CM-REQ-2","controls":["CM-2"],"text":"Xmpl Inc shall establish and maintain security baseline configurations for all information systems, documenting deviations and maintaining historical versions."},{"id":"CM-REQ-4","controls":["CM-4"],"text":"Xmpl Inc shall implement change management procedures requiring review, approval, testing, and documentation before deploying changes to systems or configurations."},{"id":"CM-REQ-5","controls":["CM-5"],"text":"Xmpl Inc shall restrict access to configuration management tools and baseline definitions to authorized personnel and implement audit logging of all configuration changes."},{"id":"CM-REQ-6","controls":["CM-6"],"text":"Xmpl Inc shall track and implement required security configuration settings and identify systems that deviate from approved baselines."},{"id":"CM-REQ-7","controls":["CM-7"],"text":"Xmpl Inc shall minimize system functionality by removing or disabling unnecessary services, functions, ports, and protocols based on least functionality principles."},{"id":"CM-REQ-8","controls":["CM-8"],"text":"Xmpl Inc shall maintain an accurate inventory of all information system components, including hardware, software, and firmware, with periodic verification."},{"id":"CM-REQ-10","controls":["CM-10"],"text":"Xmpl Inc shall implement procedures to protect information and system software from unauthorized access, modification, and theft."},{"id":"CM-REQ-11","controls":["CM-11"],"text":"Xmpl Inc shall manage user-installed software through policies that restrict or prohibit installation of unauthorized applications."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"MA":{"title":"System Maintenance Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the System Maintenance Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to MA controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"MA-REQ-1","controls":["MA-1"],"text":"Xmpl Inc shall develop, document, and maintain a system maintenance policy that defines procedures for hardware and software maintenance activities."},{"id":"MA-REQ-2","controls":["MA-2"],"text":"Xmpl Inc shall ensure that maintenance activities are performed by authorized personnel with appropriate background checks and security training."},{"id":"MA-REQ-4","controls":["MA-4"],"text":"Xmpl Inc shall document all maintenance and repair activities, including what was performed, who performed it, when it occurred, and systems affected."},{"id":"MA-REQ-5","controls":["MA-5"],"text":"Xmpl Inc shall implement procedures to prevent the inadvertent installation of nonsecurity patches, components, and firmware on systems."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"AT":{"title":"Awareness & Training Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Awareness & Training Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to AT controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"AT-REQ-1","controls":["AT-1"],"text":"Xmpl Inc shall develop, document, and maintain an awareness and training policy that defines requirements for security training and awareness programs."},{"id":"AT-REQ-2","controls":["AT-2","AT-2(2)"],"text":"Xmpl Inc shall provide initial security training to all new personnel and role-based training for personnel with specific security responsibilities, with documented attendance."},{"id":"AT-REQ-3","controls":["AT-3"],"text":"Xmpl Inc shall conduct regular security awareness campaigns to keep personnel informed of threats, security requirements, and responsibilities."},{"id":"AT-REQ-4","controls":["AT-4"],"text":"Xmpl Inc shall provide security training to personnel in their role-specific context, with updates when organizational security requirements change."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"PS":{"title":"Personnel Security Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Personnel Security Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to PS controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"PS-REQ-1","controls":["PS-1"],"text":"Xmpl Inc shall develop, document, and maintain a personnel security policy covering pre-employment, employment, and post-employment security measures."},{"id":"PS-REQ-2","controls":["PS-2"],"text":"Xmpl Inc shall conduct background investigations and security clearance procedures appropriate to the role and level of access granted."},{"id":"PS-REQ-3","controls":["PS-3"],"text":"Xmpl Inc shall establish exit procedures for personnel leaving the organization, including credential revocation, equipment return, and knowledge transition."},{"id":"PS-REQ-4","controls":["PS-4"],"text":"Xmpl Inc shall establish duties and responsibilities for personnel with security roles through job descriptions, performance evaluations, and role-based assignments."},{"id":"PS-REQ-5","controls":["PS-5"],"text":"Xmpl Inc shall establish sanctions and disciplinary procedures for personnel who violate security policies, with progressive corrective actions."},{"id":"PS-REQ-6","controls":["PS-6"],"text":"Xmpl Inc shall implement security procedures for individuals accessing organizational information and systems, including facility access controls and non-disclosure agreements."},{"id":"PS-REQ-7","controls":["PS-7"],"text":"Xmpl Inc shall establish security requirements for third-party service providers, contractors, and partners with access to organizational systems or data."},{"id":"PS-REQ-8","controls":["PS-8"],"text":"Xmpl Inc shall establish post-employment security procedures for individuals, including credential revocation, equipment return, and information transfer."},{"id":"PS-REQ-9","controls":["PS-9"],"text":"Xmpl Inc shall implement position risk designations based on job responsibility and access level, with appropriate vetting and training for high-risk positions."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"CP":{"title":"Contingency Planning Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Contingency Planning Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to CP controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"CP-REQ-1","controls":["CP-1"],"text":"Xmpl Inc shall develop, document, and maintain a contingency planning policy that defines procedures for business continuity, disaster recovery, and emergency operations."},{"id":"CP-REQ-2","controls":["CP-2"],"text":"Xmpl Inc shall develop contingency plans for critical systems and processes, including recovery objectives, alternative operations, and continuity procedures."},{"id":"CP-REQ-3","controls":["CP-3"],"text":"Xmpl Inc shall ensure contingency training is provided to personnel responsible for executing contingency plans with documented completion."},{"id":"CP-REQ-4","controls":["CP-4"],"text":"Xmpl Inc shall test contingency plans through exercises and simulations at least annually to verify effectiveness and identify improvement areas."},{"id":"CP-REQ-9","controls":["CP-9"],"text":"Xmpl Inc shall conduct information and system backups in accordance with defined recovery objectives, with off-site storage and periodic restoration testing."},{"id":"CP-REQ-10","controls":["CP-10"],"text":"Xmpl Inc shall establish information system recovery procedures including alternate processing sites, backup systems, and recovery time objectives."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"CA":{"title":"Security Assessment & Authorization Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Security Assessment & Authorization Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to CA controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"CA-REQ-1","controls":["CA-1"],"text":"Xmpl Inc shall develop, document, and maintain a security assessment and authorization policy that defines assessment methodology, frequency, and authorization procedures."},{"id":"CA-REQ-2","controls":["CA-2"],"text":"Xmpl Inc shall conduct security control assessments using appropriate techniques and procedures to determine whether controls are implemented and effective."},{"id":"CA-REQ-3","controls":["CA-3"],"text":"Xmpl Inc shall document system interconnections and information exchange agreements, including security requirements and approved usage restrictions."},{"id":"CA-REQ-5","controls":["CA-5"],"text":"Xmpl Inc shall develop and maintain a plan of action and milestones (POA&M) documenting remediation activities, responsibility assignments, and target completion dates."},{"id":"CA-REQ-6","controls":["CA-6"],"text":"Xmpl Inc shall obtain formal authorization from designated officials before operating systems and implementing significant changes."},{"id":"CA-REQ-7","controls":["CA-7","CA-7(4)"],"text":"Xmpl Inc shall conduct continuous monitoring of security controls to verify ongoing compliance with security requirements and organizational policies."},{"id":"CA-REQ-9","controls":["CA-9"],"text":"Xmpl Inc shall establish procedures for internal system connections and management of interconnection agreements with appropriate security testing."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"PL":{"title":"Governance & Planning Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Governance & Planning Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to PL controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"PL-REQ-1","controls":["PL-1"],"text":"Xmpl Inc shall develop, document, and maintain a governance and planning policy that defines roles, responsibilities, and procedures for security planning."},{"id":"PL-REQ-2","controls":["PL-2"],"text":"Xmpl Inc shall develop and maintain a system security plan that describes the system, its operational environment, and how security controls are implemented."},{"id":"PL-REQ-4","controls":["PL-4","PL-4(1)"],"text":"Xmpl Inc shall establish information security rules of behavior for system users, including acceptable use, security responsibilities, and violation consequences."},{"id":"PL-REQ-10","controls":["PL-10"],"text":"Xmpl Inc shall establish and maintain roles and responsibilities for information security, documented in position descriptions and organizational structures."},{"id":"PL-REQ-11","controls":["PL-11"],"text":"Xmpl Inc shall establish information security-related accountability requirements in internal agreements with organizational units and ensure compliance."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"RA":{"title":"Risk Assessment Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Risk Assessment Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to RA controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"RA-REQ-1","controls":["RA-1"],"text":"Xmpl Inc shall develop, document, and maintain a risk assessment policy that defines risk assessment methodology, frequency, and documentation requirements."},{"id":"RA-REQ-2","controls":["RA-2"],"text":"Xmpl Inc shall conduct risk assessments to identify threats, vulnerabilities, and the likelihood and impact of unauthorized access or use of organizational assets."},{"id":"RA-REQ-3","controls":["RA-3","RA-3(1)"],"text":"Xmpl Inc shall conduct risk assessments for all systems including information and communication technology systems, documenting findings and recommendations."},{"id":"RA-REQ-5","controls":["RA-5","RA-5(2)","RA-5(11)"],"text":"Xmpl Inc shall perform vulnerability scans, including coordinated scanning with system owners and service providers, to identify potential weaknesses."},{"id":"RA-REQ-7","controls":["RA-7"],"text":"Xmpl Inc shall conduct risk assessments for organizational information systems and consider results in security planning and system development."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"PE":{"title":"Physical & Environmental Controls Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Physical & Environmental Controls Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to PE controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"PE-REQ-1","controls":["PE-1"],"text":"Xmpl Inc shall develop, document, and maintain a physical and environmental protection policy that defines facility access controls and environmental safeguards."},{"id":"PE-REQ-2","controls":["PE-2"],"text":"Xmpl Inc shall establish facility access controls limiting unauthorized entry through controlled access points, visitor management, and facility monitoring."},{"id":"PE-REQ-3","controls":["PE-3"],"text":"Xmpl Inc shall implement physical entry monitoring systems including badge access, surveillance, and logging of all facility access events."},{"id":"PE-REQ-6","controls":["PE-6"],"text":"Xmpl Inc shall ensure monitoring and detection systems are in place to detect and respond to physical security incidents in real-time."},{"id":"PE-REQ-8","controls":["PE-8"],"text":"Xmpl Inc shall implement procedures for escorting and managing visitors to facilities, including identification verification and access restrictions."},{"id":"PE-REQ-12","controls":["PE-12"],"text":"Xmpl Inc shall implement emergency procedures for safe evacuation of personnel and protection of sensitive information during facility emergencies."},{"id":"PE-REQ-13","controls":["PE-13"],"text":"Xmpl Inc shall implement emergency lighting and power systems to support continuity of critical security and safety functions."},{"id":"PE-REQ-14","controls":["PE-14"],"text":"Xmpl Inc shall provide fire protection systems and procedures to detect and suppress fires in facilities housing critical information systems."},{"id":"PE-REQ-15","controls":["PE-15"],"text":"Xmpl Inc shall implement environmental controls including temperature, humidity, and power management to protect system equipment."},{"id":"PE-REQ-16","controls":["PE-16"],"text":"Xmpl Inc shall implement delivery and removal procedures for information system components and materials with documented authorization."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"MP":{"title":"Physical & Media Security Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the Physical & Media Security Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to MP controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"MP-REQ-1","controls":["MP-1"],"text":"Xmpl Inc shall develop, document, and maintain a physical and media protection policy that defines procedures for protecting information system media."},{"id":"MP-REQ-2","controls":["MP-2"],"text":"Xmpl Inc shall control access to information system media including storage, handling, and distribution through documented procedures and access restrictions."},{"id":"MP-REQ-6","controls":["MP-6"],"text":"Xmpl Inc shall securely sanitize information system media before disposal or reuse using approved methods to prevent unauthorized data recovery."},{"id":"MP-REQ-7","controls":["MP-7"],"text":"Xmpl Inc shall prohibit the use of portable and removable media without organizational approval and implement encryption controls for portable media containing sensitive data."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"SC":{"title":"System & Communications Protection Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the System & Communications Protection Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to SC controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"SC-REQ-1","controls":["SC-1"],"text":"Xmpl Inc shall develop, document, and maintain a system and communications protection policy that defines secure design, implementation, and transmission requirements."},{"id":"SC-REQ-5","controls":["SC-5"],"text":"Xmpl Inc shall implement denial of service protections including ingress and egress filtering, rate limiting, and traffic management capabilities."},{"id":"SC-REQ-7","controls":["SC-7"],"text":"Xmpl Inc shall implement boundary protection mechanisms including firewalls, demilitarized zones, and monitored access points to control information flow."},{"id":"SC-REQ-12","controls":["SC-12"],"text":"Xmpl Inc shall establish cryptographic key management procedures for generation, storage, distribution, and retirement of cryptographic keys."},{"id":"SC-REQ-13","controls":["SC-13"],"text":"Xmpl Inc shall implement appropriate cryptographic mechanisms to protect information confidentiality and integrity in transit and at rest."},{"id":"SC-REQ-15","controls":["SC-15"],"text":"Xmpl Inc shall disable session-based communications mechanisms by default and enable them only as needed for authorized users."},{"id":"SC-REQ-20","controls":["SC-20"],"text":"Xmpl Inc shall implement secure name resolution services and procedures to prevent DNS hijacking and spoofing attacks."},{"id":"SC-REQ-21","controls":["SC-21"],"text":"Xmpl Inc shall establish procedures for secure DNS server configuration and monitoring to detect unauthorized DNS changes."},{"id":"SC-REQ-22","controls":["SC-22"],"text":"Xmpl Inc shall employ architecture and design principles to prevent unauthorized information disclosure and maintain information integrity."},{"id":"SC-REQ-39","controls":["SC-39"],"text":"Xmpl Inc shall isolate security functionality from non-security functionality to prevent interference with security control implementation."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"},"SI":{"title":"System & Information Integrity Policy","version":"1.0","effectiveDate":"2026-04-03","reviewCycle":"Annual","status":"Draft","sections":[{"type":"purpose","title":"Purpose"},{"type":"scope","title":"Scope"},{"type":"roles","title":"Roles & Responsibilities"},{"type":"requirements","title":"Policy Requirements"},{"type":"exceptions","title":"Exceptions & Enforcement"},{"type":"references","title":"Related Standards & References"},{"type":"revision-history","title":"Revision History"}],"purpose":"Xmpl Inc is committed to implementing the System & Information Integrity Policy to protect its information assets and organizational operations.","scope":"This policy applies to all Xmpl Inc employees, contractors, and third parties with access to organizational systems and information related to SI controls.","roles":[{"name":"ISSM / Domain Policy Owner","title":"Domain Policy Owner","responsibilities":["Draft, own, and maintain this Tier 2 domain policy","Assign control owners and enforce accountability","Review and update this policy at least annually","Submit this policy to the CISO for formal approval","Report policy exceptions and open POA&M items to the CISO"]},{"name":"Program Owner","title":"Chief Information Security Officer","responsibilities":["Provides program-level oversight and governance","Formally approves this policy and all amendments","Accepts residual risk on behalf of the organization"]},{"name":"ISSO","title":"Information System Security Officer","responsibilities":["Coordinates control owner activities and implementation","Reviews control implementation narratives and evidence","Tracks open findings and remediation progress","Notifies the ISSM of significant changes or risks"]},{"name":"Control Owners","title":"Control Owner","responsibilities":["Implement assigned controls in accordance with requirements","Document control implementation narratives and procedures","Attest annually to control implementation and effectiveness","Report exceptions and control deviations"]},{"name":"System Owners","title":"System Owner","responsibilities":["Ensure systems operate in compliance with this policy","Coordinate with the ISSO on security implementations","Accept responsibility for residual risks in their systems"]},{"name":"All Personnel","title":"Employee or Contractor","responsibilities":["Comply with this policy in daily operations","Complete required training and security awareness programs","Report suspected violations to the ISSM"]}],"requirements":[{"id":"SI-REQ-1","controls":["SI-1"],"text":"Xmpl Inc shall develop, document, and maintain a system and information integrity policy that defines procedures for malware protection and flaw remediation."},{"id":"SI-REQ-2","controls":["SI-2"],"text":"Xmpl Inc shall identify, test, and install security-relevant patches and updates to systems and software within defined timeframes based on criticality."},{"id":"SI-REQ-3","controls":["SI-3"],"text":"Xmpl Inc shall implement malware protection mechanisms including antivirus and anti-malware tools configured to detect and prevent execution of malicious code."},{"id":"SI-REQ-4","controls":["SI-4"],"text":"Xmpl Inc shall implement monitoring tools and procedures to detect suspicious activity, unauthorized use, and intrusions into organizational systems."},{"id":"SI-REQ-5","controls":["SI-5"],"text":"Xmpl Inc shall implement automated security alert and advisory mechanisms to inform personnel of threats and vulnerabilities."},{"id":"SI-REQ-12","controls":["SI-12"],"text":"Xmpl Inc shall handle and retain information system output appropriately based on sensitivity level to prevent unauthorized disclosure."}],"exceptions":"Exceptions to this policy must be submitted in writing to the ISSM with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.","enforcement":"Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the ISSM. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.","references":[{"title":"NIST SP 800-53 Rev. 5","description":"Security and Privacy Controls for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53r5","internal":false},{"title":"NIST SP 800-53B","description":"Control Baselines for Information Systems and Organizations","url":"https://doi.org/10.6028/NIST.SP.800-53Br5","internal":false},{"title":"Organizational Information Security Policy","description":"Master information security policy governing all domain policies","url":"","internal":true}],"revisionHistory":[{"version":"1.0","date":"2026-04-03","author":"ISSM","changes":"Initial draft."}],"lastUpdated":"4/3/2026"}},"controlStatus":{},"assets":[],"processes":[],"sspAttestations":{},"policyReviewCycle":{},"poamItems":[],"currentUserId":null,"controlDeadlines":{},"controlWorkflowState":{},"controlReviewQueue":[],"assetMappings":{},"policyVersions":{},"policyAcknowledgments":{},"testAdequacy":{},"controlReturns":{},"controlDeselects":{}}'
};
