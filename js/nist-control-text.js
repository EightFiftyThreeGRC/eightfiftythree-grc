// NIST SP 800-53 Rev 5 — Authoritative Control Statements
// Source: NIST SP 800-53 Rev. 5, "Security and Privacy Controls for Information Systems and Organizations"
// Published: September 2020 (updated December 2020). Public domain — no copyright restriction.
// Each entry contains the verbatim control statement text from the published standard.
// Assignment/selection parameters shown as [Assignment: ...] or [Selection: ...] per the standard.

const NIST_CONTROL_TEXT = {

  // ============================================================
  // AC — ACCESS CONTROL
  // ============================================================
  'AC-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] access control policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the access control policy and the associated access controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the access control policy and procedures; and\nc. Review and update the current access control:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'AC-2': 'a. Define and document the types of accounts allowed and specifically prohibited for use within the system;\nb. Assign account managers;\nc. Require [Assignment: organization-defined prerequisites and criteria] for group and role membership;\nd. Specify:\n1. Authorized users of the system;\n2. Group and role membership; and\n3. Access authorizations (i.e., privileges) and [Assignment: organization-defined attributes (as required)] for each account;\ne. Require approvals by [Assignment: organization-defined personnel or roles] for requests to create accounts;\nf. Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria];\ng. Monitor the use of accounts;\nh. Notify account managers and [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period] when accounts are no longer required;\ni. Authorize access to the system based on:\n1. A valid access authorization;\n2. Intended system usage; and\n3. [Assignment: organization-defined attributes (as required)];\nj. Review accounts for compliance with account management requirements [Assignment: organization-defined frequency];\nk. Establish and implement a process for changing shared or group account authenticators (if deployed) when individuals are removed from the group; and\nl. Align account management processes with personnel termination and transfer processes.',

  'AC-3': 'Enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.',

  'AC-4': 'Enforce approved authorizations for controlling the flow of information within the system and between connected systems based on [Assignment: organization-defined information flow control policies].',

  'AC-5': 'a. Identify and document [Assignment: organization-defined duties of individuals requiring separation]; and\nb. Define system access authorizations to support separation of duties.',

  'AC-6': 'Employ the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) that are necessary to accomplish assigned organizational tasks.',

  'AC-7': 'a. Enforce a limit of [Assignment: organization-defined number] consecutive invalid logon attempts by a user during a [Assignment: organization-defined time period]; and\nb. Automatically [Selection (one or more): lock the account or node for an [Assignment: organization-defined time period]; lock the account or node until released by an administrator; delay next logon prompt per [Assignment: organization-defined delay algorithm]; notify system administrator; take other [Assignment: organization-defined action]] when the maximum number of unsuccessful attempts is exceeded.',

  'AC-8': 'a. Display [Assignment: organization-defined system use notification message or banner] to users before granting access to the system that provides privacy and security notices consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines and state that:\n1. Users are accessing a U.S. Government information system;\n2. System usage may be monitored, recorded, and subject to audit;\n3. Unauthorized use of the system is prohibited and subject to criminal and civil penalties; and\n4. Use of the system indicates consent to monitoring and recording;\nb. Retain the notification message or banner on the screen until users take explicit actions to log on to or further access the system; and\nc. For publicly accessible systems:\n1. Display system use information [Assignment: organization-defined conditions], before granting further access to the publicly accessible system;\n2. Display references, if any, to monitoring, recording, or auditing that are consistent with privacy accommodations for such systems that generally prohibit those activities; and\n3. Include a description of the authorized uses of the system.',

  'AC-9': 'Notify the user, upon successful logon to the system, of the date and time of the last logon.',

  'AC-10': 'Limit the number of concurrent sessions for each [Assignment: organization-defined account and/or account type] to [Assignment: organization-defined number].',

  'AC-11': 'a. Prevent further access to the system by [Selection (one or more): initiating a device lock after [Assignment: organization-defined time period] of inactivity; requiring the user to initiate a device lock before leaving the system unattended]; and\nb. Retain the device lock until the user reestablishes access using established identification and authentication procedures.',

  'AC-12': 'Automatically terminate a user session after [Assignment: organization-defined conditions or trigger events requiring session disconnect].',

  'AC-14': 'a. Identify [Assignment: organization-defined user actions] that can be performed on the system without identification or authentication consistent with organizational mission and business functions; and\nb. Document and provide supporting rationale in the security plan for the system, user actions not requiring identification or authentication.',

  'AC-16': 'a. Support and maintain security and privacy attributes associated with [Assignment: organization-defined objects] using [Assignment: organization-defined security and privacy attribute types];\nb. Ensure that the attribute associations are made and retained with the objects;\nc. Establish the following permitted security and privacy attributes from the attributes defined in AC-16a for [Assignment: organization-defined systems]: [Assignment: organization-defined security and privacy attributes];\nd. Determine the following permitted values or ranges for each of the established attributes: [Assignment: organization-defined attribute values or ranges for established attributes];\ne. Audit changes to attributes; and\nf. Review [Assignment: organization-defined security and privacy attributes] for applicability [Assignment: organization-defined frequency].',

  'AC-17': 'a. Establish and document usage restrictions, configuration/connection requirements, and implementation guidance for each type of remote access allowed; and\nb. Authorize each type of remote access to the system prior to allowing such connections.',

  'AC-18': 'a. Establish usage restrictions, configuration requirements, connection requirements, and implementation guidance for each type of wireless access; and\nb. Authorize each type of wireless access to the system prior to allowing such connections.',

  'AC-19': 'a. Establish usage restrictions, configuration requirements, connection requirements, and implementation guidance for:\n1. Organization-controlled mobile devices; and\n2. User-provided mobile devices;\nb. Authorize the connection of mobile devices meeting organizational usage restrictions and implementation guidance to organizational systems; and\nc. Monitor for unauthorized connections of mobile devices to organizational systems.',

  'AC-20': 'a. [Selection (one or more): Establish [Assignment: organization-defined terms and conditions]; Identify [Assignment: organization-defined controls asserted to be implemented on external systems]], consistent with the trust relationships established with other organizations owning, operating, and/or maintaining external systems, allowing authorized individuals to:\n1. Access the system from external systems; and\n2. Process, store, or transmit organization-controlled information using external systems; or\nb. Prohibit the use of [Assignment: organization-defined types of external systems].',

  'AC-21': 'a. Enable authorized users to determine whether access authorizations assigned to a sharing partner match the information\'s access and use restrictions for [Assignment: organization-defined information sharing circumstances where user discretion is required]; and\nb. Employ [Assignment: organization-defined automated mechanisms or manual processes] to assist users in making information sharing and collaboration decisions.',

  'AC-22': 'a. Designate individuals authorized to make information publicly accessible;\nb. Train authorized individuals to ensure that publicly accessible information does not contain nonpublic information;\nc. Review the proposed content of information prior to posting onto the publicly accessible system to ensure that nonpublic information is not included; and\nd. Review the content on the publicly accessible system for nonpublic information [Assignment: organization-defined frequency] and remove such information, if discovered.',

  'AC-23': 'Employ [Assignment: organization-defined data mining prevention and detection techniques] for [Assignment: organization-defined data storage objects] to detect and protect against unauthorized data mining.',

  'AC-24': 'Enforce [Assignment: organization-defined access control decisions] using [Assignment: organization-defined access enforcement mechanisms] as the following: [Assignment: organization-defined circumstances].',

  'AC-25': 'Enforce [Assignment: organization-defined reference monitor policy] as part of controlling access to all objects including user-owned objects.',

  // ============================================================
  // AT — AWARENESS AND TRAINING
  // ============================================================
  'AT-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] awareness and training policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the awareness and training policy and the associated awareness and training controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the awareness and training policy and procedures; and\nc. Review and update the current awareness and training:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'AT-2': 'a. Provide security and privacy literacy training to system users (including managers, senior executives, and contractors):\n1. As part of initial training for new users and [Assignment: organization-defined frequency] thereafter; and\n2. When required by system changes or following [Assignment: organization-defined events];\nb. Employ the following techniques to increase the security and privacy awareness of system users [Assignment: organization-defined awareness techniques];\nc. Update literacy training and awareness content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\nd. Incorporate lessons learned from internal or external security incidents or breaches into literacy training and awareness techniques.',

  'AT-3': 'a. Provide role-based security and privacy training to personnel with the following roles and responsibilities: [Assignment: organization-defined roles and responsibilities]:\n1. Before authorizing access to the system, information, or performing assigned duties, and [Assignment: organization-defined frequency] thereafter; and\n2. When required by system changes;\nb. Update role-based training content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\nc. Incorporate lessons learned from internal or external security incidents or breaches into role-based training.',

  'AT-4': 'a. Document and monitor information security and privacy training activities, including security and privacy awareness training and specific role-based security and privacy training; and\nb. Retain individual training records for [Assignment: organization-defined time period].',

  'AT-6': 'Provide [Assignment: organization-defined personnel or roles] with initial and [Assignment: organization-defined frequency] training in the employment and operation of personally identifiable information processing and transparency controls.',

  // ============================================================
  // AU — AUDIT AND ACCOUNTABILITY
  // ============================================================
  'AU-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] audit and accountability policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the audit and accountability policy and the associated audit and accountability controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the audit and accountability policy and procedures; and\nc. Review and update the current audit and accountability:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'AU-2': 'a. Identify the types of events that the system is capable of logging in support of the audit function; and\nb. Coordinate the event logging function with other organizations requiring audit-related information to guide and inform the selection criteria for events to be logged;\nc. Specify the following event types for logging within the system: [Assignment: organization-defined event types (subset of the event types defined in AU-2a) along with the frequency of (or situation requiring) logging for each identified event type];\nd. Provide a rationale for why the event types selected for logging are deemed to be adequate to support after-the-fact investigations of security and privacy incidents; and\ne. Review and update the event types selected for logging [Assignment: organization-defined frequency].',

  'AU-3': 'Ensure that audit records contain information that establishes the following:\na. What type of event occurred;\nb. When the event occurred;\nc. Where the event occurred;\nd. Source of the event;\ne. Outcome of the event; and\nf. Identity of any individuals, subjects, or objects/entities associated with the event.',

  'AU-4': 'Allocate audit log storage capacity to accommodate [Assignment: organization-defined audit log retention requirements].',

  'AU-5': 'a. Alert [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period] in the event of an audit logging process failure; and\nb. Take the following additional actions: [Assignment: organization-defined additional actions].',

  'AU-6': 'a. Review and analyze system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity] and the potential impact of the inappropriate or unusual activity;\nb. Report findings to [Assignment: organization-defined personnel or roles]; and\nc. Adjust the level of audit record review, analysis, and reporting within the system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.',

  'AU-7': 'Provide and implement an audit record reduction and report generation capability that:\na. Supports on-demand audit record review, analysis, and reporting requirements and after-the-fact investigations of security and privacy incidents; and\nb. Does not alter the original content or time ordering of audit records.',

  'AU-8': 'a. Use internal system clocks to generate time stamps for audit records; and\nb. Record time stamps for audit records that meet [Assignment: organization-defined granularity of time measurement] and that use Coordinated Universal Time, have offset from Coordinated Universal Time, or use another time reference standard as approved by the authorizing official.',

  'AU-9': 'a. Protect audit information and audit logging tools from unauthorized access, modification, and deletion; and\nb. Alert [Assignment: organization-defined personnel or roles] upon detection of unauthorized access, modification, or deletion of audit information.',

  'AU-10': 'Provide irrefutable evidence that an individual (or process acting on behalf of an individual) has performed [Assignment: organization-defined actions to be covered by non-repudiation].',

  'AU-11': 'Retain audit records for [Assignment: organization-defined time period] to provide support for after-the-fact investigations of security and privacy incidents and to meet regulatory and organizational information retention requirements.',

  'AU-12': 'a. Provide audit record generation capability for the event types the system is capable of auditing as defined in AU-2a on [Assignment: organization-defined system components];\nb. Allow [Assignment: organization-defined personnel or roles] to select the event types that are to be logged by specific components of the system; and\nc. Generate audit records for the event types defined in AU-2c that include the audit record content defined in AU-3.',

  'AU-13': 'a. Monitor [Assignment: organization-defined open-source information and/or information sites] [Assignment: organization-defined frequency] to determine if information about the organization that could potentially compromise privacy or organizational operational security is publicly available; and\nb. If information is discovered:\n1. Notify [Assignment: organization-defined personnel or roles]; and\n2. Use the following techniques to remove the information from the open-source domain or to restrict its further dissemination: [Assignment: organization-defined techniques].',

  'AU-14': 'Provide and implement the capability for [Assignment: organization-defined users or roles] to [Selection (one or more): record; view; hear; log] the content of a user session under [Assignment: organization-defined circumstances].',

  'AU-16': 'Employ [Assignment: organization-defined methods] for coordinating [Assignment: organization-defined audit information] among external organizations when audit information is transmitted across organizational boundaries.',

  // ============================================================
  // CA — ASSESSMENT, AUTHORIZATION, AND MONITORING
  // ============================================================
  'CA-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] assessment, authorization, and monitoring policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the assessment, authorization, and monitoring policy and the associated assessment, authorization, and monitoring controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the assessment, authorization, and monitoring policy and procedures; and\nc. Review and update the current assessment, authorization, and monitoring:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'CA-2': 'a. Select the appropriate assessor or assessment team for the type of assessment to be conducted;\nb. Develop a control assessment plan that describes the scope of the assessment including:\n1. Controls and control enhancements under assessment;\n2. Assessment procedures to be used to determine control effectiveness; and\n3. Assessment environment, assessment team, and assessment roles and responsibilities;\nc. Ensure the control assessment plan is reviewed and approved by the authorizing official or designated representative prior to conducting the assessment;\nd. Assess the controls in the system and its environment of operation [Assignment: organization-defined frequency] to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting established security and privacy requirements;\ne. Produce a security and privacy assessment report that document the results of the assessment; and\nf. Provide the results of the control assessment to [Assignment: organization-defined individuals or roles].',

  'CA-3': 'a. Approve and manage the exchange of information between the system and other systems using [Selection (one or more): interconnection security agreements; information exchange security agreements; memoranda of understanding or agreement; service level agreements; user agreements; nondisclosure agreements; [Assignment: organization-defined type of agreement]];\nb. Document, as part of each exchange agreement, the interface characteristics, security and privacy requirements, controls, and responsibilities for each system, and the impact level of the information communicated; and\nc. Review and update the agreements [Assignment: organization-defined frequency].',

  'CA-5': 'a. Develop a plan of action and milestones for the system to document the planned remediation actions of the organization to correct weaknesses or deficiencies noted during the assessment of the controls and to reduce or eliminate known vulnerabilities in the system; and\nb. Update existing plan of action and milestones [Assignment: organization-defined frequency] based on the findings from control assessments, independent audits or reviews, and continuous monitoring activities.',

  'CA-6': 'a. Assign a senior official as the authorizing official for the system;\nb. Assign a senior official as the authorizing official for common controls available for inheritance by organizational systems;\nc. Ensure that the authorizing official for the system, before commencing operations:\n1. Accepts the use of common controls inherited by the system; and\n2. Authorizes the system to operate;\nd. Ensure that the authorizing official for the system carries out continuous monitoring responsibilities as described in CA-7; and\ne. Update the authorization [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'CA-7': 'Develop and implement a system-level continuous monitoring strategy that includes:\na. Establishing the following system-level metrics to be monitored: [Assignment: organization-defined system-level metrics];\nb. Establishing [Assignment: organization-defined frequencies] for monitoring and [Assignment: organization-defined frequencies] for assessment of control effectiveness;\nc. Ongoing control assessments in accordance with the continuous monitoring strategy;\nd. Ongoing monitoring of system and organization-defined metrics in accordance with the continuous monitoring strategy;\ne. Correlation and analysis of information generated by control assessments and monitoring;\nf. Response actions to address results of the analysis of control assessment and monitoring information; and\ng. Reporting the security and privacy status of the system to [Assignment: organization-defined personnel or roles] [Assignment: organization-defined frequency].',

  'CA-8': 'Conduct penetration testing [Assignment: organization-defined frequency] on [Assignment: organization-defined systems or system components].',

  'CA-9': 'a. Authorize internal connections of [Assignment: organization-defined system components or classes of components] to the system;\nb. Document, for each internal connection, the interface characteristics, security and privacy requirements, and the nature of the information communicated;\nc. Terminate internal system connections after [Assignment: organization-defined conditions]; and\nd. Review [Assignment: organization-defined frequency] the continued need for each internal connection.',

  // ============================================================
  // CM — CONFIGURATION MANAGEMENT
  // ============================================================
  'CM-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] configuration management policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the configuration management policy and the associated configuration management controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the configuration management policy and procedures; and\nc. Review and update the current configuration management:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'CM-2': 'a. Develop, document, and maintain under configuration control, a current baseline configuration of the system; and\nb. Review and update the baseline configuration of the system:\n1. [Assignment: organization-defined frequency];\n2. When required due to [Assignment: organization-defined circumstances]; and\n3. When system components are installed or upgraded.',

  'CM-3': 'a. Determine and document the types of changes to the system that are configuration-controlled;\nb. Review proposed configuration-controlled changes to the system and approve or disapprove such changes with explicit consideration for security and privacy impact analyses;\nc. Document configuration change decisions associated with the system;\nd. Implement approved configuration-controlled changes to the system;\ne. Retain records of configuration-controlled changes to the system for [Assignment: organization-defined time period];\nf. Monitor and review activities associated with configuration-controlled changes to the system; and\ng. Coordinate and provide oversight for configuration change control activities through [Assignment: organization-defined configuration change control element] that convenes [Selection (one or more): [Assignment: organization-defined frequency]; when [Assignment: organization-defined configuration change conditions]].',

  'CM-4': 'Analyze changes to the system to determine potential security and privacy impacts prior to change implementation.',

  'CM-5': 'Define, document, approve, and enforce physical and logical access restrictions associated with changes to the system.',

  'CM-6': 'a. Establish and document configuration settings for components employed within the system that reflect the most restrictive mode consistent with operational requirements using [Assignment: organization-defined common secure configurations];\nb. Implement the configuration settings;\nc. Identify, document, and approve any deviations from established configuration settings for [Assignment: organization-defined system components] based on [Assignment: organization-defined operational requirements]; and\nd. Monitor and control changes to the configuration settings in accordance with organizational policies and procedures.',

  'CM-7': 'a. Configure the system to provide only [Assignment: organization-defined mission essential capabilities]; and\nb. Prohibit or restrict the use of the following functions, ports, protocols, software, and services: [Assignment: organization-defined prohibited or restricted functions, system ports, protocols, software, and services].',

  'CM-8': 'a. Develop and document an inventory of system components that:\n1. Accurately reflects the system;\n2. Includes all components within the system;\n3. Does not include duplicate accounting of components or components assigned to any other system;\n4. Is at the level of granularity deemed necessary for tracking and reporting; and\n5. Includes the following information to achieve system component accountability: [Assignment: organization-defined information deemed necessary to achieve effective system component accountability]; and\nb. Review and update the system component inventory [Assignment: organization-defined frequency].',

  'CM-9': 'Develop, document, and implement a configuration management plan for the system that:\na. Addresses roles, responsibilities, and configuration management processes and procedures;\nb. Establishes a process for identifying configuration items throughout the system development life cycle and managing the configuration of the configuration items;\nc. Defines the configuration items for the system and places the configuration items under configuration management;\nd. Is reviewed and approved by [Assignment: organization-defined personnel or roles]; and\ne. Protects the configuration management plan from unauthorized disclosure and modification.',

  'CM-10': 'a. Use software and associated documentation in accordance with contract agreements and copyright laws;\nb. Track the use of software protected by quantity licenses to control copying and distribution; and\nc. Control and document the use of peer-to-peer file sharing technology to ensure that this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',

  'CM-11': 'a. Establish [Assignment: organization-defined policies] governing the installation of software by users;\nb. Enforce software installation policies through the following methods: [Assignment: organization-defined methods]; and\nc. Monitor policy compliance [Assignment: organization-defined frequency].',

  'CM-12': 'a. Create and maintain [Selection (one or more): [Assignment: organization-defined data action]; inventory] of [Assignment: organization-defined personally identifiable information] collected, used, maintained, shared, disseminated, or disposed of by the system; and\nb. Review and update the [Selection (one or more): [Assignment: organization-defined data action]; inventory] [Assignment: organization-defined frequency].',

  'CM-13': 'Employ the following controls to protect the system from data exfiltration: [Assignment: organization-defined controls].',

  'CM-14': 'Prohibit the use of unsanctioned software and document exceptions with a supporting mission or operational need, duration, and authorization by [Assignment: organization-defined personnel or roles].',

  // ============================================================
  // CP — CONTINGENCY PLANNING
  // ============================================================
  'CP-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] contingency planning policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the contingency planning policy and the associated contingency planning controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the contingency planning policy and procedures; and\nc. Review and update the current contingency planning:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'CP-2': 'a. Develop a contingency plan for the system that:\n1. Identifies essential mission and business functions and associated contingency requirements;\n2. Provides recovery objectives, restoration priorities, and metrics;\n3. Addresses contingency roles, responsibilities, assigned individuals with contact information;\n4. Addresses maintaining essential mission and business functions despite a system disruption, compromise, or failure;\n5. Addresses eventual, full system restoration without deterioration of the controls originally planned and implemented;\n6. Addresses the sharing of contingency information; and\n7. Is reviewed and approved by [Assignment: organization-defined personnel or roles];\nb. Distribute copies of the contingency plan to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements];\nc. Coordinate contingency planning activities with incident handling activities;\nd. Review the contingency plan for the system [Assignment: organization-defined frequency];\ne. Update the contingency plan to address changes to the organization, system, or environment of operation and problems encountered during contingency plan implementation, execution, or testing;\nf. Communicate contingency plan changes to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements];\ng. Incorporate lessons learned from contingency plan testing, training, or actual contingency activities into contingency testing and training; and\nh. Protect the contingency plan from unauthorized disclosure and modification.',

  'CP-3': 'a. Provide contingency training to system users consistent with assigned roles and responsibilities:\n1. Within [Assignment: organization-defined time period] of assuming a contingency role or responsibility;\n2. When required by system changes; and\n3. [Assignment: organization-defined frequency] thereafter; and\nb. Review and update contingency training content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'CP-4': 'a. Test the contingency plan for the system [Assignment: organization-defined frequency] using the following tests to determine the effectiveness of the plan and the readiness to execute the plan: [Assignment: organization-defined tests];\nb. Review the contingency plan test results; and\nc. Initiate corrective actions, if needed.',

  'CP-6': 'a. Establish an alternate storage site, including necessary agreements to permit the storage and retrieval of system backup information; and\nb. Ensure that the alternate storage site provides controls equivalent to that of the primary site.',

  'CP-7': 'a. Establish an alternate processing site, including necessary agreements to permit the transfer and resumption of [Assignment: organization-defined system operations] for essential mission and business functions within [Assignment: organization-defined time period consistent with recovery time and recovery point objectives] when the primary processing capabilities are unavailable;\nb. Make available at the alternate processing site, the equipment and supplies required to transfer and resume operations or put contracts in place to support delivery to the site within the organization-defined time period for transfer and resumption; and\nc. Ensure that the alternate processing site provides controls equivalent to that of the primary site.',

  'CP-8': 'a. Establish alternate telecommunications services, including necessary agreements to permit the resumption of [Assignment: organization-defined system operations] for essential mission and business functions within [Assignment: organization-defined time period] when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites; and\nb. Ensure that the alternate telecommunications services:\n1. Have a level of redundancy deemed acceptable by the organization;\n2. Are available and negotiated at the time of the need; and\n3. Address the residual risk of relying on an alternate telecommunications service.',

  'CP-9': 'a. Conduct backups of user-level information contained in [Assignment: organization-defined system components] [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives];\nb. Conduct backups of system-level information contained in the system [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives];\nc. Conduct backups of system documentation, including security- and privacy-related documentation [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives]; and\nd. Protect the confidentiality, integrity, and availability of backup information.',

  'CP-10': 'Provide for the recovery and reconstitution of the system to a known state within [Assignment: organization-defined time period consistent with recovery time and recovery point objectives] after a disruption, compromise, or failure.',

  'CP-11': 'Employ [Assignment: organization-defined alternative or supplemental communications protocols] in the event that the primary communications protocol is compromised or unavailable.',

  'CP-12': 'Provide [Assignment: organization-defined alternative power supply] that is activated under the following conditions: [Assignment: organization-defined conditions for activation].',

  'CP-13': 'Employ [Assignment: organization-defined alternative or supplemental security mechanisms] for satisfying [Assignment: organization-defined security functions] when the primary means of implementing the security function is unavailable or compromised.',

  // ============================================================
  // IA — IDENTIFICATION AND AUTHENTICATION
  // ============================================================
  'IA-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] identification and authentication policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the identification and authentication policy and the associated identification and authentication controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the identification and authentication policy and procedures; and\nc. Review and update the current identification and authentication:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'IA-2': 'Uniquely identify and authenticate organizational users and associate that unique identification with processes acting on behalf of those users.',

  'IA-3': 'Uniquely identify and authenticate [Assignment: organization-defined devices and/or types of devices] before establishing a [Selection (one or more): local; remote; network] connection.',

  'IA-4': 'Manage system identifiers by:\na. Receiving authorization from [Assignment: organization-defined personnel or roles] to assign an identifier;\nb. Selecting an identifier that identifies an individual, group, role, service, or device;\nc. Assigning the identifier to the intended individual, group, role, service, or device; and\nd. Preventing reuse of identifiers for [Assignment: organization-defined time period].',

  'IA-5': 'Manage system authenticators by:\na. Verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, service, or device receiving the authenticator;\nb. Establishing initial authenticator content for any authenticators issued by the organization;\nc. Ensuring that authenticators have sufficient strength of mechanism for their intended use;\nd. Establishing and implementing administrative procedures for initial authenticator distribution, for lost, compromised, or damaged authenticators, and for revoking authenticators;\ne. Changing default authenticators prior to first use;\nf. Changing or refreshing authenticators [Assignment: organization-defined time period by authenticator type] or when [Assignment: organization-defined events] occur;\ng. Protecting authenticator content from unauthorized disclosure and modification;\nh. Requiring individuals to take, and having devices implement, specific controls to protect authenticators; and\ni. Changing authenticators for group or role accounts when membership to those accounts changes.',

  'IA-6': 'Obscure feedback of authentication information during the authentication process to protect the information from possible exploitation and use by unauthorized individuals.',

  'IA-7': 'Implement mechanisms for authentication to a cryptographic module that meet the requirements of applicable laws, executive orders, directives, policies, regulations, standards, and guidelines for such authentication.',

  'IA-8': 'Uniquely identify and authenticate non-organizational users or processes acting on behalf of non-organizational users.',

  'IA-9': 'Uniquely identify and authenticate [Assignment: organization-defined system services and applications] before establishing communications with devices, users, or other services or applications.',

  'IA-10': 'Require individuals accessing the system to employ [Assignment: organization-defined supplemental authentication controls] under specific [Assignment: organization-defined circumstances or situations].',

  'IA-11': 'Require users to reauthenticate when [Assignment: organization-defined circumstances or situations requiring reauthentication].',

  'IA-12': 'a. Identity proof users that require accounts for logical access to systems based on appropriate identity assurance level requirements as specified in applicable standards and guidelines;\nb. Resolve user identities to a unique individual; and\nc. Collect, validate, and verify identity evidence.',

  // ============================================================
  // IR — INCIDENT RESPONSE
  // ============================================================
  'IR-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] incident response policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the incident response policy and the associated incident response controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the incident response policy and procedures; and\nc. Review and update the current incident response:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'IR-2': 'a. Provide incident response training to system users consistent with assigned roles and responsibilities:\n1. Within [Assignment: organization-defined time period] of assuming an incident response role or responsibility;\n2. When required by system changes; and\n3. [Assignment: organization-defined frequency] thereafter; and\nb. Review and update incident response training content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'IR-3': 'a. Test the incident response capability for the system [Assignment: organization-defined frequency] using the following tests: [Assignment: organization-defined tests]; and\nb. Review and update incident response testing content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'IR-4': 'a. Implement an incident handling capability for incidents that includes preparation, detection and analysis, containment, eradication, and recovery;\nb. Coordinate incident handling activities with contingency planning activities;\nc. Incorporate lessons learned from ongoing incident handling activities into incident response procedures, training, and testing, and implement the resulting changes accordingly; and\nd. Ensure the rigor, intensity, scope, and results of incident handling activities are comparable and predictable across the organization.',

  'IR-5': 'Track and document incidents.',

  'IR-6': 'a. Require personnel to report suspected incidents to the organizational incident response capability within [Assignment: organization-defined time period]; and\nb. Report incident information to [Assignment: organization-defined authorities].',

  'IR-7': 'Provide an incident response support resource, integral to the organizational incident response capability, that offers advice and assistance to users of the system for the handling and reporting of incidents.',

  'IR-8': 'a. Develop an incident response plan that:\n1. Provides the organization with a roadmap for implementing its incident response capability;\n2. Describes the structure and organization of the incident response capability;\n3. Provides a high-level approach for how the incident response capability fits into the overall organization;\n4. Meets the unique requirements of the organization, which relate to mission, size, structure, and functions;\n5. Defines reportable incidents;\n6. Provides metrics for measuring the incident response capability within the organization;\n7. Defines the resources and management support needed to effectively maintain and mature an incident response capability;\n8. Addresses the sharing of incident information;\n9. Is reviewed and approved by [Assignment: organization-defined personnel or roles] [Assignment: organization-defined frequency]; and\n10. Explicitly designates responsibility for incident response to [Assignment: organization-defined entities, personnel, or roles];\nb. Distribute copies of the incident response plan to [Assignment: organization-defined incident response personnel (identified by name and/or by role) and organizational elements];\nc. Update the incident response plan to address system and organizational changes or problems encountered during plan implementation, execution, or testing;\nd. Protect the incident response plan from unauthorized disclosure and modification; and\ne. Communicate incident response plan changes to [Assignment: organization-defined incident response personnel (identified by name and/or by role) and organizational elements].',

  'IR-9': 'a. Respond to information spills by:\n1. Assigning [Assignment: organization-defined personnel or roles] with responsibility for responding to information spills;\n2. Identifying the specific information involved in the system contamination;\n3. Alerting [Assignment: organization-defined personnel or roles] of the information spill using a method of communication not associated with the spill;\n4. Isolating the contaminated system or system component;\n5. Eradicating the information from the contaminated system or component;\n6. Identifying other systems or system components that may have been subsequently contaminated; and\n7. Performing the following additional actions: [Assignment: organization-defined actions].',

  // ============================================================
  // MA — MAINTENANCE
  // ============================================================
  'MA-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] maintenance policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the maintenance policy and the associated maintenance controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the maintenance policy and procedures; and\nc. Review and update the current maintenance:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'MA-2': 'a. Schedule, document, and review records of maintenance, repair, and replacement on system components in accordance with manufacturer or vendor specifications and/or organizational requirements;\nb. Approve and monitor all maintenance activities, whether performed on site or remotely and whether the system or system components are serviced on site or removed to another location;\nc. Require that [Assignment: organization-defined personnel or roles] explicitly approve the removal of the system or system components from organizational facilities for off-site maintenance, repair, or replacement;\nd. Sanitize equipment to remove the following information from associated media prior to removal from organizational facilities for off-site maintenance, repair, or replacement: [Assignment: organization-defined information];\ne. Check all potentially impacted controls to verify that the controls are still functioning properly following maintenance, repair, or replacement actions; and\nf. Include the following information in organizational maintenance records: [Assignment: organization-defined information].',

  'MA-3': 'a. Approve, control, and monitor the use of system maintenance tools; and\nb. Review previously approved system maintenance tools [Assignment: organization-defined frequency].',

  'MA-4': 'a. Approve and monitor nonlocal maintenance and diagnostic activities;\nb. Allow the use of nonlocal maintenance and diagnostic tools only as consistent with organizational policy and documented in the security plan for the system;\nc. Employ strong authentication in the establishment of nonlocal maintenance and diagnostic sessions;\nd. Maintain records for nonlocal maintenance and diagnostic activities; and\ne. Terminate session and network connections when nonlocal maintenance is completed.',

  'MA-5': 'a. Establish a process for maintenance personnel authorization and maintain a list of authorized maintenance organizations or personnel;\nb. Verify that non-escorted personnel performing maintenance on the system have required access authorizations; and\nc. Designate organizational personnel with required access authorizations and technical competence to supervise the maintenance activities of personnel who do not possess the required access authorizations.',

  'MA-6': 'Obtain maintenance support and/or spare parts for [Assignment: organization-defined system components] within [Assignment: organization-defined time period] of failure.',

  'MA-7': 'Perform maintenance on [Assignment: organization-defined system components] in a manner that prevents leakage of information outside of established authorization boundaries.',

  // ============================================================
  // MP — MEDIA PROTECTION
  // ============================================================
  'MP-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] media protection policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the media protection policy and the associated media protection controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the media protection policy and procedures; and\nc. Review and update the current media protection:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'MP-2': 'Restrict access to [Assignment: organization-defined types of digital and/or non-digital media] to [Assignment: organization-defined personnel or roles].',

  'MP-3': 'a. Mark system media indicating the distribution limitations, handling caveats, and applicable security markings (if any) of the information; and\nb. Exempt [Assignment: organization-defined types of system media] from marking if the media remain within [Assignment: organization-defined controlled areas].',

  'MP-4': 'a. Physically control and securely store [Assignment: organization-defined types of digital and/or non-digital media] within [Assignment: organization-defined controlled areas]; and\nb. Protect system media types defined in MP-4a until the media are destroyed or sanitized using approved equipment, techniques, and procedures.',

  'MP-5': 'a. Protect and control [Assignment: organization-defined types of system media] during transport outside of controlled areas using [Assignment: organization-defined controls];\nb. Maintain accountability for system media during transport outside of controlled areas;\nc. Document activities associated with the transport of system media; and\nd. Restrict the activities associated with the transport of system media to authorized personnel.',

  'MP-6': 'a. Sanitize [Assignment: organization-defined system media] prior to disposal, release out of organizational control, or release for reuse using [Assignment: organization-defined sanitization techniques and procedures]; and\nb. Employ sanitization mechanisms with the strength and integrity commensurate with the security category or classification of the information.',

  'MP-7': 'a. [Selection: Restrict; Prohibit] the use of [Assignment: organization-defined types of system media] on [Assignment: organization-defined systems or system components] using [Assignment: organization-defined controls]; and\nb. Prohibit the use of portable storage devices in organizational systems when such devices have no identifiable owner.',

  'MP-8': 'Downgrade system media containing [Assignment: organization-defined information] prior to media downgrade using [Assignment: organization-defined downgrade procedures] and verify downgrade of the media using [Assignment: organization-defined verification methods].',

  // ============================================================
  // PE — PHYSICAL AND ENVIRONMENTAL PROTECTION
  // ============================================================
  'PE-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] physical and environmental protection policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the physical and environmental protection policy and the associated physical and environmental protection controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the physical and environmental protection policy and procedures; and\nc. Review and update the current physical and environmental protection:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'PE-2': 'a. Develop, approve, and maintain a list of individuals with authorized access to the facility where the system resides;\nb. Issue authorization credentials for facility access;\nc. Review the access list detailing authorized facility access by individuals [Assignment: organization-defined frequency]; and\nd. Remove individuals from the facility access list when access is no longer required.',

  'PE-3': 'a. Enforce physical access authorizations at [Assignment: organization-defined entry and exit points to the facility where the system resides] by;\n1. Verifying individual access authorizations before granting access to the facility; and\n2. Controlling ingress and egress to the facility using [Selection (one or more): [Assignment: organization-defined physical access control systems or devices]; guards];\nb. Maintain physical access audit logs for [Assignment: organization-defined entry or exit points];\nc. Control access to areas within the facility designated as publicly accessible by implementing the following controls: [Assignment: organization-defined physical access controls for publicly accessible areas];\nd. Escort visitors and control visitor activity [Assignment: organization-defined circumstances requiring visitor escorts and control of visitor activity];\ne. Secure keys, combinations, and other physical access devices;\nf. Inventory [Assignment: organization-defined physical access devices] every [Assignment: organization-defined frequency]; and\ng. Change combinations and keys [Assignment: organization-defined frequency] and/or when keys are lost, combinations are compromised, or when individuals possessing the keys or combinations are transferred or terminated.',

  'PE-4': 'Control physical access to [Assignment: organization-defined system distribution and transmission lines] within organizational facilities using [Assignment: organization-defined security controls].',

  'PE-5': 'Control physical access to output from [Assignment: organization-defined output devices] to prevent unauthorized individuals from obtaining the output.',

  'PE-6': 'a. Monitor physical access to the facility where the system resides to detect and respond to physical security incidents;\nb. Review physical access logs [Assignment: organization-defined frequency] and upon occurrence of [Assignment: organization-defined events]; and\nc. Coordinate results of reviews and investigations with the organizational incident response capability.',

  'PE-8': 'a. Maintain visitor access records to the facility where the system resides for [Assignment: organization-defined time period];\nb. Review visitor access records [Assignment: organization-defined frequency]; and\nc. Report anomalies in visitor access records to [Assignment: organization-defined personnel].',

  'PE-9': 'Protect the system from damage resulting from potential problems with electrical power by:\na. Providing short-term uninterruptible power supply to facilitate [Selection (one or more): an orderly shutdown of the system; transition of the system to long-term alternate power] in the event of a primary power source loss;\nb. Providing long-term alternate power supply for the system that is capable of maintaining minimally required operational capability in the event of an extended loss of the primary power source; and\nc. Providing a short-term uninterruptible power supply to facilitate an orderly shutdown of the system in the event of a primary power source loss.',

  'PE-10': 'Provide the capability of shutting off power to [Assignment: organization-defined system components] in emergency situations.',

  'PE-11': 'Provide an uninterruptible power supply to facilitate [Selection (one or more): an orderly shutdown of the system; transition of the system to long-term alternate power] in the event of a primary power source loss.',

  'PE-12': 'Employ and maintain automatic emergency lighting for the system that activates in the event of a power outage or disruption and that covers emergency exits and evacuation routes within the facility.',

  'PE-13': 'Employ and maintain fire suppression and detection systems/devices for the system and the facility.',

  'PE-14': 'a. Maintain [Selection (one or more): temperature; humidity] levels within the facility where the system resides at [Assignment: organization-defined acceptable levels]; and\nb. Monitor temperature and humidity levels [Assignment: organization-defined frequency].',

  'PE-15': 'Protect the system from damage resulting from water leakage by providing master shutoff or isolation valves that are accessible, working properly, and known to key personnel.',

  'PE-16': 'a. Authorize and control [Assignment: organization-defined types of system components] entering and exiting the facility; and\nb. Maintain records of the system components.',

  'PE-17': 'a. Employ [Assignment: organization-defined security controls] at alternate work sites;\nb. Assess as feasible, the effectiveness of controls at alternate work sites; and\nc. Provide a means for employees to communicate with information security and privacy personnel in case of incidents.',

  'PE-18': 'Position system components within the facility to minimize potential damage from [Assignment: organization-defined physical and environmental hazards] and to minimize the opportunity for unauthorized access.',

  'PE-19': 'Protect the system from information leakage due to electromagnetic signals emanations.',

  'PE-20': 'a. Track and monitor the location and movement of [Assignment: organization-defined assets] using [Assignment: organization-defined asset location technologies]; and\nb. Ensure that asset location technologies are employed in accordance with applicable federal laws, executive orders, directives, regulations, policies, standards, and guidelines.',

  'PE-21': 'Employ electromagnetic pulse protection for [Assignment: organization-defined systems and system components] using [Assignment: organization-defined electromagnetic pulse protection measures].',

  'PE-22': 'Protect [Assignment: organization-defined system components] from component or system failure caused by an electromagnetic disturbance due to a natural or man-made electromagnetic pulse.',

  'PE-23': 'a. Conduct an organizational assessment of risk, in accordance with applicable federal laws, executive orders, directives, policies, standards, guidelines, and regulations, before the provisioning and implementation of the following types of facilities used for processing, storing, or transmitting federal information: [Assignment: organization-defined types of facilities]; and\nb. Address the identified risks in the facility protection plans.',

  // ============================================================
  // PL — PLANNING
  // ============================================================
  'PL-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] planning policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the planning policy and the associated planning controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the planning policy and procedures; and\nc. Review and update the current planning:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'PL-2': 'a. Develop security and privacy plans for the system that:\n1. Are consistent with the organization\'s enterprise architecture;\n2. Explicitly define the constituent system components;\n3. Describe the operational context of the system in terms of mission and business processes;\n4. Identify the individuals that fulfill system roles and responsibilities;\n5. Identify the information types processed, stored, and transmitted by the system;\n6. Provide the security categorization of the system, including supporting rationale;\n7. Describe any specific threats to the system that are of concern to the organization;\n8. Provide an overview of the security and privacy requirements for the system;\n9. Identify any relevant overlays, if applicable;\n10. Describe the controls in place or planned for meeting the security and privacy requirements, including a rationale for the tailoring decisions;\n11. Are reviewed and approved by the authorizing official or designated representative prior to plan implementation;\nb. Distribute copies of the plans and communicate subsequent changes to the plans to [Assignment: organization-defined personnel or roles];\nc. Review the plans [Assignment: organization-defined frequency];\nd. Update the plans to address changes to the system and environment of operation or problems identified during plan implementation or control assessments; and\ne. Protect the plans from unauthorized disclosure and modification.',

  'PL-4': 'a. Establish and make readily available to individuals requiring access to the system, the rules that describe their responsibilities and expected behavior for information and system usage, security, and privacy;\nb. Receive a documented acknowledgment from such individuals, indicating that they have read, understand, and agree to abide by the rules of behavior, before authorizing access to information and the system;\nc. Review and update the rules of behavior [Assignment: organization-defined frequency]; and\nd. Require individuals who have acknowledged a previous version of the rules of behavior to read and re-acknowledge [Selection (one or more): [Assignment: organization-defined frequency]; when the rules are revised or updated].',

  'PL-7': 'Develop a security concept of operations for the system describing how the organization intends to operate the system from a security perspective and from a privacy perspective.',

  'PL-8': 'a. Develop security and privacy architectures for the system that:\n1. Describe the requirements and approach to be taken for protecting the confidentiality, integrity, and availability of organizational information;\n2. Describe the requirements and approach to be taken for processing personally identifiable information to minimize privacy risk to individuals;\n3. Describe how the architectures are integrated into and support the enterprise architecture; and\n4. Describe any assumptions about, and dependencies on, external systems and services;\nb. Review and update the architectures [Assignment: organization-defined frequency] to reflect changes in the enterprise architecture; and\nc. Reflect planned architecture changes in security and privacy plans, Concept of Operations (CONOPS), criticality analyses, and other system development documents, as appropriate.',

  'PL-9': 'Centrally manage [Assignment: organization-defined controls and related processes].',

  'PL-10': 'Select a control baseline for the system.',

  'PL-11': 'Select, tailor, and document the controls needed to protect the system and the information it processes, stores, and transmits from the control baseline selected in PL-10, employing a [Assignment: organization-defined tailoring process].',

  // ============================================================
  // PM — PROGRAM MANAGEMENT
  // ============================================================
  'PM-1': 'a. Develop and disseminate an organization-wide information security program plan that:\n1. Provides an overview of the requirements for the security program and a description of the security program controls and control enhancements in place or planned for meeting those requirements;\n2. Includes the identification and assignment of roles, responsibilities, management commitment, coordination among organizational entities, and compliance;\n3. Reflects the coordination among organizational entities responsible for information security; and\n4. Is approved by a senior official with responsibility and accountability for the risk being incurred to organizational operations (including mission, functions, image, and reputation), organizational assets, individuals, other organizations, and the Nation;\nb. Review the organization-wide information security program plan [Assignment: organization-defined frequency];\nc. Update the plan to address organizational changes and problems identified during plan implementation or control assessments; and\nd. Protect the information security program plan from unauthorized disclosure and modification.',

  'PM-2': 'Appoint a senior agency information security officer with the mission and resources to coordinate, develop, implement, and maintain an organization-wide information security program.',

  'PM-3': 'a. Ensure that all capital planning and investment requests include the resources needed to implement the information security and privacy programs and document all exceptions to this requirement;\nb. Employ a business case/Exhibit 300/Exhibit 53 to record the resources required; and\nc. Ensure that information security and privacy resources are available for expenditure as planned.',

  'PM-4': 'a. Implement a process to ensure that plans of action and milestones for the security and privacy programs and the associated organizational systems:\n1. Are developed and maintained;\n2. Document the remedial information security and privacy actions to adequately respond to risk to organizational operations and assets, individuals, other organizations, and the Nation; and\n3. Are reported in accordance with OMB FISMA reporting requirements;\nb. Review plans of action and milestones for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',

  'PM-5': 'a. Develop and update [Assignment: organization-defined frequency] an inventory of organizational systems;\nb. Assign systems to specific system owners; and\nc. Ensure that organizations owning, operating, or using a system are represented.',

  'PM-6': 'Develop, monitor, and report on the results of information security and privacy measures of performance.',

  'PM-7': 'Develop and maintain an enterprise architecture, with consideration for information security, privacy, and the resulting risk to organizational operations and assets, individuals, other organizations, and the Nation.',

  'PM-8': 'Address information security and privacy issues in the development, documentation, and updating of a critical infrastructure and key resources protection plan.',

  'PM-9': 'a. Develop an organization-wide risk management strategy that includes an expression of the risk tolerance for the organization;\nb. Include in the risk management strategy, eight components including how risk will be framed, assessed, responded to, monitored, and how risk management decisions are made;\nc. Implement the risk management strategy consistently across the organization; and\nd. Review and update the risk management strategy [Assignment: organization-defined frequency] or as required, to address organizational changes.',

  'PM-10': 'a. Manage (i.e., document, protect, and update) the security state of organizational systems and the environments in which those systems operate through security authorization processes;\nb. Designate individuals to fulfill specific roles and responsibilities within the organizational risk management process; and\nc. Fully integrate the security authorization processes into an organization-wide risk management program.',

  'PM-11': 'a. Define organizational mission and business processes with consideration for information security and privacy and the resulting risk to organizational operations, organizational assets, individuals, other organizations, and the Nation; and\nb. Determine information protection and personally identifiable information processing needs arising from the defined mission and business processes; and\nc. Review and revise the mission and business processes [Assignment: organization-defined frequency].',

  'PM-12': 'Implement an insider threat program that includes a cross-discipline insider threat incident handling team.',

  'PM-13': 'Establish an information security workforce development and improvement program.',

  'PM-14': 'a. Implement a process for ensuring that remediation plans developed during the security and privacy assessment and authorization process and as a result of continuous monitoring activities are implemented and updated as needed; and\nb. Remediate vulnerabilities in accordance with organizational risk tolerance.',

  'PM-15': 'a. Establish contact with selected groups and associations within the security and privacy communities:\n1. To facilitate ongoing security and privacy education and training for organizational personnel;\n2. To maintain currency with recommended security and privacy practices, techniques, and technologies; and\n3. To share current security and privacy-related information including threats, vulnerabilities, and incidents;\nb. Record and report the security and privacy contacts; and\nc. Review the contacts [Assignment: organization-defined frequency].',

  'PM-16': 'Implement a threat awareness program that includes a cross-organization information-sharing capability for threat intelligence.',

  'PM-17': 'a. Establish a policy and process to ensure that personally identifiable information processed to support identified organizational missions or business operations are identified and documented; and\nb. Provide a mechanism for individuals to provide consent for the processing of their personally identifiable information prior to its collection that is consistent with applicable laws, executive orders, directives, regulations, policies, guidelines, and standards.',

  'PM-18': 'Develop and maintain a comprehensive inventory of all information types that are collected, used, maintained, shared, disseminated, or disposed of by programs and systems owned or controlled by the organization.',

  'PM-19': 'Designate a senior agency official for privacy with the authority, mission, accountability, and resources to coordinate, develop, and implement, applicable privacy requirements and manage privacy risks through the organization-wide privacy program.',

  'PM-20': 'a. Identify and document all common controls that are available for inheritance by organizational systems;\nb. Authorize [Assignment: organization-defined personnel or roles] to select common controls for organizational systems; and\nc. Ensure that common controls are documented in a security plan for the organizational system where the controls are implemented.',

  'PM-21': 'a. Ensure that systems are designed and used to process personally identifiable information;\nb. Maintain, use, and share records of individuals accurately, relevant, timely, and complete; and\nc. Develop processes to check and correct inaccurate personally identifiable information across the information life cycle.',

  'PM-22': 'a. Identify [Assignment: organization-defined processing conditions] for which an assessment of the impact on individual privacy is warranted;\nb. Conduct privacy impact assessments for systems, programs, or other activities that pose a privacy risk in accordance with applicable law, OMB policy, or any existing organizational policies and procedures; and\nc. Follow a review process to ensure that privacy impact assessments are thorough, accurate, and comply with applicable requirements.',

  'PM-23': 'Implement a data governance body consisting of [Assignment: organization-defined roles] with [Assignment: organization-defined responsibilities] for achieving the following [Assignment: organization-defined objectives].',

  'PM-24': 'a. Establish and maintain a Data Integrity Board to:\n1. Review and approve all computer matching programs and agreements prior to execution; and\n2. Ensure that each matching program is accompanied by a matching agreement specifying the purpose, legal authority, relevant records systems, the agency responsible for verifying the accuracy of matching results, the computational procedures and technical specifications used in the matching program, applicable notice requirements, disposition and return or destruction of the personally identifiable information matched, the cost and benefits of the program, the time period for which the matching agreement is effective, and privacy impact statement.\nb. Provide oversight of each matching program for compliance with the terms of the matching agreement throughout its duration.',

  'PM-25': 'a. Maintain the use of personally identifiable information in all systems of records notifications and privacy impact assessments;\nb. Define the purpose and need of the personally identifiable information collected, and specify the information systems that collect the data; and\nc. Establish a data use limitation policy for personally identifiable information that:\n1. Is consistent with the principle of data minimization;\n2. Limits the use of the personally identifiable information to the purposes and functions for which it was collected or for compatible purposes;\n3. Addresses whether personally identifiable information will be published or disclosed; and\n4. Addresses whether the personally identifiable information can be used to make decisions about individuals.',

  'PM-26': 'a. Implement a process for receiving and responding to complaints, concerns, or questions from individuals about the organizational privacy practices;\nb. Direct individuals to the privacy complaint process; and\nc. Use the information gathered from complaints to identify any privacy concerns, improve privacy practices, and assess organizational adherence to applicable privacy requirements.',

  'PM-27': 'a. Develop privacy reports;\nb. Submit privacy reports to [Assignment: organization-defined oversight bodies]; and\nc. Disseminate privacy reports to [Assignment: organization-defined personnel or roles].',

  'PM-28': 'a. Identify the [Assignment: organization-defined risk factors] associated with [Assignment: organization-defined types of systems, programs, or other activities] in order to meet applicable privacy requirements, manage privacy risks, and protect individual privacy;\nb. Use the identified risk factors to prioritize and focus privacy risk assessments and privacy risk management activities; and\nc. Review and update the privacy risk factors [Assignment: organization-defined frequency].',

  'PM-29': 'a. Identify the requirements for privacy risk management;\nb. Review and revise [Assignment: organization-defined frequency] all:\n1. Privacy policies;\n2. Privacy procedures; and\n3. Privacy controls; and\nc. Coordinate with the senior agency official for privacy when changes to privacy program documents and controls are required.',

  'PM-30': 'a. Develop an organization-wide supply chain risk management strategy that addresses the following:\n1. How supply chain risk management decisions will be made;\n2. How the supply chain risk management strategy will be updated and communicated to relevant stakeholders;\n3. How supply chain risk management will be integrated into the risk management framework;\n4. How supply chain risk management will be addressed in the organization\'s enterprise risk management program; and\n5. How the organization-defined critical suppliers will be identified and managed;\nb. Facilitate the sharing of open-source supply chain risk information with appropriate stakeholders within the organization;\nc. Document the supply chain risk management strategy; and\nd. Review and update the supply chain risk management strategy [Assignment: organization-defined frequency].',

  'PM-31': 'Implement a continuous monitoring program to assess organizational risk and the effectiveness of the privacy controls in supporting privacy risk management objectives.',

  'PM-32': 'a. Purposefully design and implement a privacy program that addresses applicable privacy requirements and manages privacy risks;\nb. Identify potential problems that may inhibit privacy program effectiveness; and\nc. Ensure that privacy program activities are aligned with the organizational risk management strategy.',

  // ============================================================
  // PS — PERSONNEL SECURITY
  // ============================================================
  'PS-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] personnel security policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the personnel security policy and the associated personnel security controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the personnel security policy and procedures; and\nc. Review and update the current personnel security:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'PS-2': 'a. Assign a risk designation to all organizational positions;\nb. Establish screening criteria for individuals filling those positions; and\nc. Review and revise position risk designations [Assignment: organization-defined frequency].',

  'PS-3': 'a. Screen individuals prior to authorizing access to the system; and\nb. Rescreen individuals in accordance with [Assignment: organization-defined conditions requiring rescreening and, where rescreening is so indicated, the frequency of rescreening].',

  'PS-4': 'Upon termination of individual employment:\na. Disable system access within [Assignment: organization-defined time period];\nb. Terminate or revoke any authenticators and credentials associated with the individual;\nc. Conduct exit interviews that include a discussion of [Assignment: organization-defined information security topics];\nd. Retrieve all security-related organizational system-related property;\ne. Retain access to organizational information and systems formerly controlled by terminated individual; and\nf. Notify [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period].',

  'PS-5': 'a. Review and confirm ongoing operational need for current logical and physical access authorizations to systems and facilities when individuals are reassigned or transferred to other positions within the organization;\nb. Initiate [Assignment: organization-defined transfer or reassignment actions] within [Assignment: organization-defined time period following the formal transfer action];\nc. Modify access authorization as needed to correspond with any changes in operational need due to reassignment or transfer; and\nd. Notify [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period].',

  'PS-6': 'a. Develop and document access agreements for organizational systems;\nb. Review and update the access agreements [Assignment: organization-defined frequency]; and\nc. Verify that individuals requiring access to organizational information and systems:\n1. Sign appropriate access agreements prior to being granted access; and\n2. Re-sign access agreements to maintain access to organizational systems when access agreements have been updated or [Assignment: organization-defined frequency].',

  'PS-7': 'a. Establish personnel security requirements including security roles and responsibilities for external providers;\nb. Require external providers to comply with personnel security policies and procedures established by the organization;\nc. Document personnel security requirements;\nd. Require external providers to notify [Assignment: organization-defined personnel or roles] of any personnel transfers or terminations of external personnel who possess organizational credentials and/or badges, or who have system privileges within [Assignment: organization-defined time period]; and\ne. Monitor provider compliance with personnel security requirements.',

  'PS-8': 'Employ a formal sanctions process for individuals failing to comply with established information security and privacy policies and procedures.',

  'PS-9': 'Employ formal transfer procedures for individuals transferred to positions within the organization.',

  // ============================================================
  // RA — RISK ASSESSMENT
  // ============================================================
  'RA-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] risk assessment policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the risk assessment policy and the associated risk assessment controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the risk assessment policy and procedures; and\nc. Review and update the current risk assessment:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'RA-2': 'a. Categorize the system and information it processes, stores, and transmits;\nb. Document the security categorization results, including supporting rationale, in the security plan for the system; and\nc. Verify that the authorizing official or designated representative reviews and approves the security categorization decision.',

  'RA-3': 'a. Conduct a risk assessment, including:\n1. Identifying threats to and vulnerabilities in the system;\n2. Determining the likelihood and magnitude of harm from unauthorized access, use, disclosure, disruption, modification, or destruction of the system, the information it processes, stores, or transmits, and any related information; and\n3. Determining the likelihood and impact of adverse effects on individuals arising from the processing of personally identifiable information;\nb. Integrate risk assessment results and risk management decisions from other organizations and government entities;\nc. Document risk assessment results in [Selection: security and privacy plans; risk assessment report; [Assignment: organization-defined document]];\nd. Review risk assessment results [Assignment: organization-defined frequency];\ne. Disseminate risk assessment results to [Assignment: organization-defined personnel or roles]; and\nf. Update the risk assessment [Assignment: organization-defined frequency] or when there are significant changes to the system, its environment of operation, or other conditions that may impact the security or privacy state of the system.',

  'RA-5': 'a. Monitor and scan for vulnerabilities in the system and hosted applications [Assignment: organization-defined frequency and/or randomly in accordance with organization-defined process] and when new vulnerabilities potentially affecting the system are identified and reported;\nb. Employ vulnerability monitoring tools and techniques that facilitate interoperability among tools and automate parts of the vulnerability management process by using standards for:\n1. Enumerating platforms, software flaws, and improper configurations;\n2. Formatting checklists and test procedures; and\n3. Measuring vulnerability impact;\nc. Analyze vulnerability scan reports and results from vulnerability monitoring;\nd. Remediate legitimate vulnerabilities [Assignment: organization-defined response times] in accordance with an organizational assessment of risk;\ne. Share information obtained from the vulnerability monitoring process and control assessments with [Assignment: organization-defined personnel or roles] to help eliminate similar vulnerabilities in other systems; and\nf. Employ vulnerability monitoring tools that include the capability to readily update the vulnerabilities to be scanned.',

  'RA-6': 'Employ [Assignment: organization-defined technical surveillance countermeasures] or have technical surveillance countermeasures surveys performed on [Assignment: organization-defined locations] [Assignment: organization-defined frequency] or when [Assignment: organization-defined events] occur.',

  'RA-7': 'Integrate risk response actions into the risk management strategy:\na. Implement risk response actions for identified risks based on organizational priorities;\nb. Document, track, and monitor risk response actions; and\nc. Communicate risk response actions to applicable stakeholders.',

  'RA-8': 'a. Develop and document a privacy impact assessment process;\nb. Perform privacy impact assessments for systems, programs, or other activities that pose a privacy risk in accordance with applicable law, OMB policy, or any existing organizational policies and procedures; and\nc. Review the privacy impact assessments.',

  'RA-9': 'Identify and prioritize [Assignment: organization-defined critical systems, system components, and system services] based on the risk and the organization\'s critical mission and business functions.',

  'RA-10': 'a. Gather threat intelligence information;\nb. Analyze threat intelligence information; and\nc. Proactively share threat intelligence information with [Assignment: organization-defined personnel or roles].',

  // ============================================================
  // SA — SYSTEM AND SERVICES ACQUISITION
  // ============================================================
  'SA-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] system and services acquisition policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the system and services acquisition policy and the associated system and services acquisition controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and services acquisition policy and procedures; and\nc. Review and update the current system and services acquisition:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'SA-2': 'a. Determine the high-level information security and privacy requirements for the system or system service in mission and business process planning;\nb. Determine, document, and allocate the resources required to protect the system or system service as part of the organizational capital planning and investment control process; and\nc. Establish a discrete line item for information security and privacy in organizational programming and budgeting documentation.',

  'SA-3': 'a. Acquire, develop, and manage the system using [Assignment: organization-defined system development life cycle] that incorporates information security and privacy considerations;\nb. Define and document information security and privacy roles and responsibilities throughout the system development life cycle;\nc. Identify individuals having information security and privacy roles and responsibilities; and\nd. Integrate the organizational information security and privacy risk management process into system development life cycle activities.',

  'SA-4': 'a. Include the following requirements, descriptions, and criteria, explicitly or by reference, using [Selection (one or more): standardized contract language; [Assignment: organization-defined contract language]] in the acquisition contract for the system, system component, or system service:\n1. Security and privacy functional requirements;\n2. Strength of mechanism requirements;\n3. Security and privacy assurance requirements;\n4. Controls needed to satisfy the security and privacy requirements;\n5. Security and privacy documentation requirements;\n6. Requirements for protecting security and privacy documentation;\n7. Description of the system development environment and environment in which the system is intended to operate;\n8. Allocation of responsibility or identification of parties responsible for information security and privacy;\n9. Acceptance criteria; and\nb. Document the following in the acquisition contract: [Assignment: organization-defined requirements, descriptions, and criteria].',

  'SA-5': 'a. Obtain or develop administrator documentation for the system, system component, or system service that describes:\n1. Secure configuration, installation, and operation of the system, component, or service;\n2. Effective use and maintenance of security and privacy functions and mechanisms; and\n3. Known vulnerabilities regarding configuration and use of administrative or privileged functions;\nb. Obtain or develop user documentation for the system, system component, or system service that describes:\n1. User-accessible security and privacy functions and mechanisms and how to effectively use those functions and mechanisms;\n2. Methods for user interaction, which enables individuals to use the system, component, or service in a more secure manner and protect individual privacy; and\n3. User responsibilities in maintaining the security of the system, component, or service and privacy of individuals;\nc. Document attempts to obtain system, system component, or system service documentation when such documentation is either unavailable or nonexistent and take [Assignment: organization-defined actions] in response; and\nd. Distribute documentation to [Assignment: organization-defined personnel or roles].',

  'SA-8': 'Apply the following systems security and privacy engineering principles in the specification, design, development, implementation, and modification of the system and system components: [Assignment: organization-defined systems security and privacy engineering principles].',

  'SA-9': 'a. Require that providers of external system services comply with organizational security and privacy requirements and employ the following controls: [Assignment: organization-defined controls];\nb. Define and document organizational oversight and user roles and responsibilities with regard to external system services; and\nc. Employ the following processes, methods, and techniques to monitor control compliance by external service providers on an ongoing basis: [Assignment: organization-defined processes, methods, and techniques].',

  'SA-10': 'Require the developer of the system, system component, or system service to:\na. Perform configuration management during system, component, or service [Selection (one or more): design; development; implementation; operation; disposal];\nb. Document, manage, and control the integrity of changes to [Assignment: organization-defined configuration items under configuration management];\nc. Implement only organization-approved changes to the system, component, or service;\nd. Document approved changes to the system, component, or service and the potential security and privacy impacts of such changes; and\ne. Track security flaws and flaw resolution within the system, component, or service and report findings to [Assignment: organization-defined personnel].',

  'SA-11': 'Require the developer of the system, system component, or system service, at all post-design stages of the system development life cycle, to:\na. Develop and implement a plan for ongoing security and privacy control assessments;\nb. Perform [Selection (one or more): unit; integration; system; regression] testing/evaluation [Assignment: organization-defined frequency] at [Assignment: organization-defined depth and coverage];\nc. Produce evidence of the execution of the assessment plan and the results of the testing and evaluation;\nd. Implement a verifiable flaw remediation process; and\ne. Correct flaws identified during testing and evaluation.',

  'SA-15': 'a. Require the developer of the system, system component, or system service to follow a documented development process that:\n1. Explicitly addresses security and privacy requirements;\n2. Identifies the standards and tools used in the development process;\n3. Documents the specific tool options and tool configurations used in the development process; and\n4. Documents, manages, and ensures the integrity of changes to the process and/or tools used in development; and\nb. Review the development process, standards, tools, tool options, and tool configurations [Assignment: organization-defined frequency] to determine if the process, standards, tools, tool options and tool configurations selected and employed can satisfy the following security and privacy requirements: [Assignment: organization-defined security and privacy requirements].',

  'SA-16': 'Require the developer of the system, system component, or system service to provide [Assignment: organization-defined training] on the correct use and operation of the implemented security and privacy functions, controls, and/or mechanisms.',

  'SA-17': 'Require the developer of the system, system component, or system service to produce a design specification and security and privacy architecture that:\na. Is consistent with the organization\'s security and privacy architecture that is an integral part of and consistent with the organization\'s enterprise architecture;\nb. Accurately and completely describes the required security and privacy functionality, and the allocation of controls among physical and logical components; and\nc. Expresses how individual security and privacy functions, mechanisms, and services work together to provide required security and privacy capabilities and a unified approach to protection.',

  'SA-20': 'Reimplement or custom develop the following system components: [Assignment: organization-defined critical system components].',

  'SA-21': 'Require that [Assignment: organization-defined developers, systems integrators, and manufacturers] satisfy [Assignment: organization-defined vetting requirements] prior to working with the system or system components.',

  'SA-22': 'a. Replace system components when support for the components is no longer available from the developer, vendor, or manufacturer; and\nb. Provide justification and document approval for the continued use of unsupported system components required to satisfy mission or operational needs.',

  'SA-23': 'Employ [Assignment: organization-defined resiliency and survivability techniques and approaches] with regard to position, function, and time for [Assignment: organization-defined systems and system components].',

  // ============================================================
  // SC — SYSTEM AND COMMUNICATIONS PROTECTION
  // ============================================================
  'SC-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] system and communications protection policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the system and communications protection policy and the associated system and communications protection controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and communications protection policy and procedures; and\nc. Review and update the current system and communications protection:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'SC-2': 'a. Separate user functionality, including user interface services, from system management functionality; and\nb. Implement separation of system management functionality from user functionality, including system management interfaces from user interfaces.',

  'SC-3': 'Isolate security functions from nonsecurity functions.',

  'SC-4': 'Prevent unauthorized and unintended information transfer via shared system resources.',

  'SC-5': 'a. [Selection: Protect against; Limit] the effects of the following types of denial-of-service events: [Assignment: organization-defined types of denial-of-service events]; and\nb. Employ the following controls to achieve the denial-of-service objective: [Assignment: organization-defined controls by type of denial-of-service event].',

  'SC-6': 'Protect the availability of resources by allocating [Assignment: organization-defined resources] by [Selection (one or more): priority; quota; [Assignment: organization-defined controls]].',

  'SC-7': 'a. Monitor and control communications at the external managed interfaces to the system and at key internal managed interfaces within the system;\nb. Implement subnetworks for publicly accessible system components that are [Selection (one or more): physically; logically] separated from internal organizational networks; and\nc. Connect to external networks or systems only through managed interfaces consisting of boundary protection devices arranged in accordance with an organizational security and privacy architecture.',

  'SC-8': 'Implement cryptographic mechanisms to [Selection (one or more): prevent unauthorized disclosure of information; detect changes to information] during transmission unless otherwise protected by [Assignment: organization-defined alternative physical controls].',

  'SC-10': 'Terminate the network connection associated with a communications session at the end of the session or after [Assignment: organization-defined time period] of inactivity.',

  'SC-11': 'Establish a trusted communications path between the user and the following security functions of the system: [Assignment: organization-defined security functions].',

  'SC-12': 'Establish and manage cryptographic keys when cryptography is employed within the system in accordance with the following key management requirements: [Assignment: organization-defined requirements for key generation, distribution, storage, access, and destruction].',

  'SC-13': 'a. Determine the [Assignment: organization-defined cryptographic uses]; and\nb. Implement the following types of cryptography required for each specified cryptographic use: [Assignment: organization-defined types of cryptography for each specified cryptographic use].',

  'SC-15': 'a. Prohibit remote activation of collaborative computing devices and applications with the following exceptions: [Assignment: organization-defined exceptions where remote activation is to be allowed]; and\nb. Provide an explicit indication of use to users physically present at the devices.',

  'SC-16': 'Associate [Assignment: organization-defined security and privacy attributes] with information exchanged between systems and between system components.',

  'SC-17': 'Issue public key certificates under an [Assignment: organization-defined certificate policy] or obtain public key certificates from an approved service provider.',

  'SC-18': 'a. Define acceptable and unacceptable mobile code and mobile code technologies; and\nb. Authorize, monitor, and control the use of mobile code within the system.',

  'SC-19': 'a. Define acceptable and unacceptable uses of Voice over Internet Protocol (VoIP) technologies; and\nb. Authorize, monitor, and control the use of VoIP within the system.',

  'SC-20': 'a. Provide additional data origin authentication and integrity verification artifacts along with the authoritative name resolution data the system returns in response to external name/address resolution queries; and\nb. Provide the means to indicate the security status of child zones and (if the child supports secure resolution services) to enable verification of a chain of trust among parent and child domains, when operating as part of a distributed, hierarchical namespace.',

  'SC-21': 'Request and perform data origin authentication and data integrity verification on the name/address resolution responses the system receives from authoritative sources.',

  'SC-22': 'Ensure the systems that collectively provide name/address resolution service for an organization are fault-tolerant and implement role separation.',

  'SC-23': 'Protect the authenticity of communications sessions.',

  'SC-24': 'Fail to a [Assignment: organization-defined known system state] for the following types of failures on the indicated system components while preserving [Assignment: organization-defined system state information] in failure: [Assignment: organization-defined types of system failures on organization-defined system components].',

  'SC-25': 'Hide or randomize the allocation of [Assignment: organization-defined information resources] to prevent the discovery of [Assignment: organization-defined data or information] through randomization of',

  'SC-26': 'Include components specifically designed to be the target of malicious attacks for the purpose of detecting, deflecting, and analyzing such attacks.',

  'SC-27': 'Include operating system-independent applications.',

  'SC-28': 'Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of the following information at rest on [Assignment: organization-defined system components or media]: [Assignment: organization-defined information].',

  'SC-29': 'Maintain [Assignment: organization-defined diversity] in the implementation of the system.',

  'SC-30': 'Employ the following deception techniques to mislead potential adversaries: [Assignment: organization-defined deception techniques].',

  'SC-31': 'Perform a covert channel analysis to identify those aspects of communications within the system that are potential avenues for covert [Selection (one or more): storage; timing] channels.',

  'SC-32': 'a. Partition the system into [Assignment: organization-defined system components] residing in separate physical domains or environments based on [Assignment: organization-defined circumstances for physical separation of components]; and\nb. Document the partitioning of the system into separate physical domains or environments.',

  'SC-34': 'For [Assignment: organization-defined system components], load and execute the operating environment from hardware-enforced, read-only media.',

  'SC-35': 'Include [Assignment: organization-defined honeyclients] in [Assignment: organization-defined systems and system components].',

  'SC-36': 'Distribute the following processing and storage components across multiple [Selection (one or more): physical locations; logical domains]: [Assignment: organization-defined processing and storage components].',

  'SC-37': 'Employ [Assignment: organization-defined out-of-band channels] for the physical delivery or electronic transmission of [Assignment: organization-defined information, system components, or devices] to [Assignment: organization-defined individuals or systems].',

  'SC-38': 'Employ the following operations security controls to protect key organizational information throughout the system development life cycle: [Assignment: organization-defined operations security controls].',

  'SC-39': 'Maintain a separate execution domain for each executing process.',

  'SC-40': 'Protect the [Assignment: organization-defined wireless links] from the following signal parameter attacks: [Assignment: organization-defined types of signal parameter attacks or references to sources for such attacks].',

  'SC-41': 'a. Disable or remove [Assignment: organization-defined connection ports or input/output devices] on the following systems or system components: [Assignment: organization-defined systems or system components]; and\nb. Provide [Assignment: organization-defined connection ports or input/output devices] only to those users that have a physical or logical need to use the connection port or input/output device.',

  'SC-42': 'a. Prohibit the use of devices possessing environmental sensing capabilities in [Assignment: organization-defined facilities, areas, or systems] where the organization deems it appropriate; and\nb. Employ the following measures: [Selection (one or more): disabling or removing the sensor capability from devices; employing detection methods to identify prohibited devices] in [Assignment: organization-defined facilities, areas, or systems].',

  'SC-43': 'a. Employ [Assignment: organization-defined usage restrictions and implementation guidance] for [Assignment: organization-defined network access protocols]; and\nb. Prohibit the use of the following network access protocols: [Assignment: organization-defined prohibited or restricted network access protocols].',

  'SC-44': 'Provide a detonation chamber capability within [Assignment: organization-defined systems, system components, or locations].',

  'SC-45': 'a. Use an internal hardware clock in the system that is synchronized with [Assignment: organization-defined authoritative time source]; and\nb. Synchronize the internal system clocks to the authoritative time source [Assignment: organization-defined frequency].',

  'SC-46': 'Bind security attributes to information in storage to facilitate attribute retention across information life cycle changes.',

  'SC-47': 'Implement [Assignment: organization-defined alternate communications paths] for system management information.',

  'SC-48': 'Provide [Assignment: organization-defined controls] to support the collection of [Assignment: organization-defined data] to support supply chain risk management.',

  'SC-49': 'Implement [Assignment: organization-defined hardware or software] to detect and prevent communications with [Assignment: organization-defined attack signature patterns].',

  'SC-50': 'Define and enforce [Assignment: organization-defined software usage restrictions].',

  'SC-51': 'Apply hardware-based memory protection for code that is immutable in the memory locations where it resides or for other uses to protect important data.',

  // ============================================================
  // SI — SYSTEM AND INFORMATION INTEGRITY
  // ============================================================
  'SI-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] system and information integrity policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the system and information integrity policy and the associated system and information integrity controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and information integrity policy and procedures; and\nc. Review and update the current system and information integrity:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'SI-2': 'a. Identify, report, and correct system flaws;\nb. Test software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation;\nc. Install security-relevant software updates within [Assignment: organization-defined time period] of the release of the updates; and\nd. Incorporate flaw remediation into the organizational configuration management process.',

  'SI-3': 'a. Implement [Assignment: organization-defined malicious code protection mechanisms] at system entry and exit points to detect and eradicate malicious code;\nb. Automatically update malicious code protection mechanisms as new releases are available in accordance with organizational configuration management policy and procedures;\nc. Configure malicious code protection mechanisms to:\n1. Perform periodic scans of the system [Assignment: organization-defined frequency] and real-time scans of files from external sources at [Selection (one or more): endpoint; network entry and exit points] as the files are downloaded, opened, or executed in accordance with organizational policy; and\n2. [Selection (one or more): block malicious code; quarantine malicious code; take [Assignment: organization-defined action]]; and send alert to [Assignment: organization-defined personnel or roles] in response to malicious code detection; and\nd. Address the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the system.',

  'SI-4': 'a. Monitor the system to detect:\n1. Attacks and indicators of potential attacks in accordance with the following monitoring objectives: [Assignment: organization-defined monitoring objectives]; and\n2. Unauthorized local, network, and remote connections;\nb. Identify unauthorized use of the system through the following techniques and methods: [Assignment: organization-defined techniques and methods];\nc. Invoke internal monitoring capabilities or deploy monitoring devices:\n1. Strategically within the system to collect organization-determined essential information; and\n2. At ad hoc locations within the system to track specific types of transactions of interest to the organization;\nd. Analyze detected events and anomalies;\ne. Adjust the level of system monitoring activity when there is a change in risk to organizational operations and assets, individuals, other organizations, or the Nation;\nf. Obtain legal opinion regarding system monitoring activities; and\ng. Provide [Assignment: organization-defined system monitoring information] to [Assignment: organization-defined personnel or roles] [Selection (one or more): as needed; [Assignment: organization-defined frequency]].',

  'SI-5': 'a. Receive system security alerts, advisories, and directives from [Assignment: organization-defined external organizations] on an ongoing basis;\nb. Generate internal security alerts, advisories, and directives as deemed necessary;\nc. Disseminate security alerts, advisories, and directives to: [Selection (one or more): [Assignment: organization-defined personnel or roles]; [Assignment: organization-defined elements within the organization]; [Assignment: organization-defined external organizations]]; and\nd. Implement security directives in accordance with established time frames, or notify the issuing organization of the degree of noncompliance.',

  'SI-6': 'a. Verify the correct operation of [Assignment: organization-defined security and privacy functions];\nb. Perform the verification of the functions specified in SI-6a [Selection (one or more): [Assignment: organization-defined system transitional states]; upon command by user with appropriate privilege; [Assignment: organization-defined frequency]];\nc. Alert [Assignment: organization-defined personnel or roles] to failed security and privacy verification tests; and\nd. [Selection (one or more): Shut the system down; Restart the system; [Assignment: organization-defined alternative action(s)]] when anomalies are discovered.',

  'SI-7': 'a. Employ integrity verification tools to detect unauthorized changes to the following software, firmware, and information: [Assignment: organization-defined software, firmware, and information]; and\nb. Take the following actions when unauthorized changes to the software, firmware, and information are detected: [Assignment: organization-defined actions].',

  'SI-8': 'a. Employ spam protection mechanisms at system entry and exit points to detect and act on unsolicited messages; and\nb. Update spam protection mechanisms when new releases are available in accordance with organizational configuration management policy and procedures.',

  'SI-10': 'Check the validity of the following information inputs: [Assignment: organization-defined information inputs to the system].',

  'SI-11': 'a. Generate error messages that provide information necessary for corrective actions without revealing information that could be exploited; and\nb. Reveal error messages only to [Assignment: organization-defined personnel or roles].',

  'SI-12': 'Manage and retain information within the system and information output from the system in accordance with applicable laws, executive orders, directives, regulations, policies, standards, guidelines and operational requirements.',

  'SI-13': 'a. Determine mean time to failure for the following system components in specific environments of operation: [Assignment: organization-defined system components]; and\nb. Provide substitute system components and a means to exchange active and standby components in accordance with the following criteria: [Assignment: organization-defined mean time to failure substitution criteria].',

  'SI-14': 'Implement the following non-persistent components and services: [Assignment: organization-defined non-persistent components and services] that are initiated in a known state and terminated [Selection (one or more): upon end of session of use; periodically at [Assignment: organization-defined frequency]].',

  'SI-15': 'Validate information output from the following software programs and/or applications to ensure that the information is consistent with the expected content: [Assignment: organization-defined software programs and/or applications].',

  'SI-16': 'Implement the following controls to protect the system memory from unauthorized code execution: [Assignment: organization-defined controls].',

  'SI-17': 'Implement [Assignment: organization-defined fail-safe procedures] when the following conditions are detected: [Assignment: organization-defined conditions].',

  'SI-18': 'a. Apply [Assignment: organization-defined de-identification techniques and methods] to personally identifiable information to reduce the linkability of the information with the data subject and to the direct identifiability of the individual; and\nb. Evaluate the effectiveness of de-identification to determine if the de-identified information is likely to be re-identified under reasonably anticipated circumstances.',

  'SI-19': 'a. Identify the minimum personally identifiable information elements that are relevant and necessary to accomplish the legally authorized purpose of collection;\nb. Limit the collection and retention of personally identifiable information to the minimum elements identified for the purposes described in the notice; and\nc. Train organizational personnel on the requirements for collecting information only to the minimum necessary to accomplish the legally authorized purpose.',

  'SI-20': 'Implement [Assignment: organization-defined controls] to protect the trustworthiness of the data or information collected from external sources.',

  'SI-21': 'Implement [Assignment: organization-defined controls] to protect the trustworthiness of the data or information disseminated to external parties.',

  'SI-22': 'a. Identify information that is no longer necessary to support the organizational mission or business function and generate an accurate and current list of such information;\nb. Retain and dispose of system output in accordance with applicable laws, executive orders, directives, regulations, policies, standards, guidelines, and operational requirements; and\nc. Protect information from unauthorized access or disclosure during retention and disposal.',

  'SI-23': 'Verify the source of the following information prior to inputting the information into the system: [Assignment: organization-defined information that the system inputs from external sources].',

  // ============================================================
  // SR — SUPPLY CHAIN RISK MANAGEMENT
  // ============================================================
  'SR-1': 'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection (one or more): Organization-level; Mission/business process-level; System-level] supply chain risk management policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the supply chain risk management policy and the associated supply chain risk management controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the supply chain risk management policy and procedures; and\nc. Review and update the current supply chain risk management:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',

  'SR-2': 'a. Develop a plan for managing supply chain risks associated with the research and development, design, manufacturing, acquisition, delivery, integration, operations and maintenance, and disposal of the following systems, system components or system services: [Assignment: organization-defined systems, system components, or system services];\nb. Review and update the supply chain risk management plan [Assignment: organization-defined frequency] or as required, to address threat, organizational or environmental changes; and\nc. Protect the supply chain risk management plan from unauthorized disclosure and modification.',

  'SR-3': 'a. Establish a process or processes to identify and address weaknesses or deficiencies in the supply chain elements and processes of [Assignment: organization-defined system or system component] in coordination with [Assignment: organization-defined supply chain personnel]; and\nb. Employ the following supply chain controls to protect against supply chain risks to the system, system component, or system service and to limit the harm or consequences of supply chain-related events: [Assignment: organization-defined supply chain controls].',

  'SR-4': 'Document and maintain in [Selection (one or more): system security plans; a supply chain risk management plan; a software bill of materials; [Assignment: organization-defined document]] the provenance of the following systems and system components: [Assignment: organization-defined systems and system components].',

  'SR-5': 'a. Employ the following acquisition strategies, contract tools, and procurement methods to protect against, identify, and mitigate supply chain risks: [Assignment: organization-defined acquisition strategies, contract tools, and procurement methods]; and\nb. Employ the acquisition strategies, contract tools, and procurement methods in contracts with entities involved in the supply chain for the system, system component, or system service.',

  'SR-6': 'Include the following SCRM requirements in contracts with suppliers and third-party providers and in other agreements established to support the supply chain for the system, system component, or system service: [Assignment: organization-defined supply chain risk management requirements].',

  'SR-7': 'Employ the following Operations Security (OPSEC) controls to protect supply chain-related information for the system, system component, or system service: [Assignment: organization-defined Operations Security (OPSEC) controls].',

  'SR-8': 'Establish agreements and procedures with entities involved in the supply chain for the system, system component, or system service for:\na. Notifying the organization of supply chain compromises; and\nb. Providing remediation actions for compromised supply chain items.',

  'SR-9': 'a. Employ [Assignment: organization-defined anti-tamper technologies and techniques] during [Selection (one or more): design; development; manufacturing; acquisition; delivery; integration; operations and maintenance; disposal] of [Assignment: organization-defined system or system components]; and\nb. Develop and implement an anti-tamper plan.',

  'SR-10': 'Inspect [Assignment: organization-defined systems or system components] [Selection (one or more): at random; at [Assignment: organization-defined frequency], upon [Assignment: organization-defined indications of need for inspection]] to detect tampering.',

  'SR-11': 'a. Employ [Assignment: organization-defined tools and techniques] to detect counterfeit components before delivery;\nb. Hold counterfeit system components in quarantine until disposed of in accordance with organizational procedures; and\nc. Report detection of counterfeit system components to [Selection (one or more): source of counterfeit component; [Assignment: organization-defined external reporting organizations]; [Assignment: organization-defined personnel or roles]].',

  'SR-12': 'Maintain disposition or destruction records for [Assignment: organization-defined system components].',

  // ============================================================
  // CONTROL ENHANCEMENTS — HIGH (and MOD) BASELINE
  // Source: NIST SP 800-53 Rev 5, verbatim enhancement text
  // ============================================================

  // AC-2 enhancements
  'AC-2(1)': 'Support the management of system accounts using [Assignment: organization-defined automated mechanisms].',
  'AC-2(2)': 'a. Automatically [Selection: remove; disable] temporary and emergency accounts after [Assignment: organization-defined time period for each type of account]; and\nb. Automatically disable accounts that have been inactive for [Assignment: organization-defined time period].',
  'AC-2(3)': 'Disable accounts within [Assignment: organization-defined time period] when the accounts:\na. Have expired;\nb. Are no longer associated with a user or individual;\nc. Are in violation of organizational policy; or\nd. Have been inactive for [Assignment: organization-defined time period].',
  'AC-2(4)': 'Automatically audit account creation, modification, enabling, disabling, and removal actions.',
  'AC-2(5)': 'Require that users log out when [Assignment: organization-defined time period of expected inactivity or description of when to log out].',
  'AC-2(11)': 'Enforce [Assignment: organization-defined circumstances and/or usage conditions] for [Assignment: organization-defined system accounts].',
  'AC-2(12)': 'a. Monitor system accounts for [Assignment: organization-defined atypical usage]; and\nb. Report atypical usage of system accounts to [Assignment: organization-defined personnel or roles].',
  'AC-2(13)': 'Disable accounts of users within [Assignment: organization-defined time period] of discovery of [Assignment: organization-defined significant risks].',

  // AC-4 enhancements
  'AC-4(4)': 'Prevent encrypted information from bypassing [Assignment: organization-defined information flow control mechanisms] by [Selection (one or more): decrypting the information; blocking the flow of the encrypted information; terminating communications sessions attempting to pass encrypted information; [Assignment: organization-defined procedure or method]].',

  // AC-6 enhancements
  'AC-6(1)': 'Authorize access to [Assignment: organization-defined security functions (deployed in hardware, software, and firmware)] and security-relevant information only to [Assignment: organization-defined personnel or roles].',
  'AC-6(2)': 'Require that users of system accounts (or roles) with access to [Assignment: organization-defined security functions or security-relevant information] use non-privileged accounts or roles, when accessing non-security functions.',
  'AC-6(3)': 'Authorize network access to [Assignment: organization-defined privileged commands] only for [Assignment: organization-defined compelling operational needs] and document the rationale for such access in the security plan for the system.',
  'AC-6(5)': 'Restrict privileged accounts on the system to [Assignment: organization-defined personnel or roles].',
  'AC-6(7)': 'a. Review [Assignment: organization-defined frequency] the privileges assigned to [Assignment: organization-defined roles or classes of users] to validate the need for such privileges; and\nb. Reassign or remove privileges, if necessary, to correctly reflect organizational mission and business needs.',
  'AC-6(9)': 'Log the execution of privileged functions.',
  'AC-6(10)': 'Prevent non-privileged users from executing privileged functions.',

  // AC-11 enhancements
  'AC-11(1)': 'Conceal, via the device lock, information previously visible on the display with a publicly viewable image.',

  // AC-17 enhancements
  'AC-17(1)': 'Employ automated mechanisms to monitor and control remote access methods.',
  'AC-17(2)': 'Implement cryptographic mechanisms to protect the confidentiality and integrity of remote access sessions.',
  'AC-17(3)': 'Route remote accesses via [Assignment: organization-defined number] managed network access control points.',
  'AC-17(4)': 'a. Authorize the execution of privileged commands and access to security-relevant information via remote access only in operational needs documented in the security plan for the system; and\nb. Document the rationale for remote execution of privileged commands and remote access to security-relevant information in the security plan for the system.',

  // AC-18 enhancements
  'AC-18(1)': 'Implement authentication and encryption for wireless access.',
  'AC-18(3)': 'Identify and explicitly authorize users allowed to independently configure wireless networking capabilities.',
  'AC-18(4)': 'Identify and explicitly authorize users allowed to configure wireless networking capabilities.',
  'AC-18(5)': 'Confine wireless communications to organization-controlled boundaries.',

  // AC-19 enhancements
  'AC-19(5)': 'Employ [Selection: full-device encryption; container encryption] to protect the confidentiality and integrity of information on [Assignment: organization-defined mobile devices].',

  // AC-20 enhancements
  'AC-20(1)': '[Selection: Prohibit; Restrict] the use of [Assignment: organization-defined types of system] components or [Assignment: organization-defined type of component] when processing, storing, or transmitting [Assignment: organization-defined information] using external systems.',
  'AC-20(2)': '[Selection: Prohibit; Restrict] the use of portable storage devices by authorized individuals on external systems.',

  // AT-2 enhancements
  'AT-2(2)': 'Provide literacy training on recognizing and reporting potential threats to the organization.',
  'AT-2(3)': 'Provide literacy training on advanced persistent threats.',

  // AU-3 enhancements
  'AU-3(1)': 'Generate audit records containing the following additional information: [Assignment: organization-defined additional information].',

  // AU-5 enhancements
  'AU-5(1)': 'Provide a warning to [Assignment: organization-defined personnel, roles, and/or locations] within [Assignment: organization-defined time period] when allocated audit log storage volume reaches [Assignment: organization-defined percentage] of maximum audit log storage capacity.',
  'AU-5(2)': 'Provide an alert within [Assignment: organization-defined real-time period] to [Assignment: organization-defined personnel, roles, and/or locations] when the following audit failure events occur: [Assignment: organization-defined audit logging failure events requiring real-time alerts].',

  // AU-6 enhancements
  'AU-6(1)': 'Integrate audit record review, analysis, and reporting processes using [Assignment: organization-defined automated mechanisms].',
  'AU-6(3)': 'Analyze and correlate audit records across different repositories to gain organization-wide situational awareness.',
  'AU-6(5)': 'Integrate analysis of audit records with analysis of [Selection (one or more): vulnerability scanning information; performance data; system monitoring information; [Assignment: organization-defined data/information collected from other sources]] to further enhance the ability to identify inappropriate or unusual activity.',
  'AU-6(6)': 'Correlate information from audit records with information obtained from monitoring physical access to further enhance the ability to identify suspicious, inappropriate, unusual, or malevolent activity.',

  // AU-7 enhancements
  'AU-7(1)': 'Provide and implement the capability to process, sort, and search audit records for events of interest based on the following content: [Assignment: organization-defined fields within audit records].',

  // AU-9 enhancements
  'AU-9(2)': 'Store audit records [Assignment: organization-defined frequency] in a repository that is part of a physically different system or system component than the system or component being audited.',
  'AU-9(3)': 'Implement cryptographic mechanisms to protect the integrity of audit information and audit tools.',
  'AU-9(4)': 'Authorize access to management of audit logging to only [Assignment: organization-defined subset of privileged users or roles].',

  // AU-12 enhancements
  'AU-12(1)': 'Compile audit records from [Assignment: organization-defined system components] into a system-wide (logical or physical) audit trail that is time-correlated to within [Assignment: organization-defined level of tolerance for the relationship between time stamps of individual records in the audit trail].',
  'AU-12(3)': 'Provide and implement the capability for [Assignment: organization-defined individuals or roles] to change the logging to be performed on [Assignment: organization-defined system components] based on [Assignment: organization-defined selectable event criteria] within [Assignment: organization-defined time thresholds].',

  // CA-2 enhancements
  'CA-2(1)': 'Employ assessors or assessment teams with [Assignment: organization-defined level of independence] to conduct control assessments.',
  'CA-2(2)': 'Include as part of control assessments, [Assignment: organization-defined frequency], [Selection: announced; unannounced], [Selection (one or more): in-depth monitoring; security instrumentation; automated security test cases; vulnerability scanning; malicious user testing; insider threat assessment; performance and load testing; data leakage or data loss detection; [Assignment: organization-defined other forms of assessment]].',

  // CA-3 enhancements
  'CA-3(6)': 'Prohibit the direct connection of [Assignment: organization-defined unclassified national security system] to an external network without the use of [Assignment: organization-defined boundary protection device].',

  // CA-7 enhancements
  'CA-7(1)': 'Employ assessors or assessment teams with [Assignment: organization-defined level of independence] to monitor the controls in the system on an ongoing basis.',
  'CA-7(4)': 'a. Review the effectiveness of the security and privacy continuous monitoring program [Assignment: organization-defined frequency]; and\nb. Update the program based on findings.',

  // CA-8 enhancements
  'CA-8(1)': 'Employ an independent penetration agent or penetration team to perform penetration testing on the system or system components.',

  // CM-2 enhancements
  'CM-2(2)': 'Maintain the currency, completeness, accuracy, and availability of the baseline configuration of the system using [Assignment: organization-defined automated mechanisms].',
  'CM-2(3)': 'Retain [Assignment: organization-defined number] of previous versions of baseline configurations of the system to support rollback.',
  'CM-2(7)': 'a. Issue [Assignment: organization-defined systems, system components, or devices] with [Assignment: organization-defined configurations] to individuals traveling to locations that the organization deems to be of significant risk; and\nb. Apply the following controls to the devices when the individuals return from travel: [Assignment: organization-defined controls].',

  // CM-3 enhancements
  'CM-3(1)': 'Use automated mechanisms to:\na. Propose changes to the system;\nb. Notify [Assignment: organization-defined approval authorities] of proposed changes to the system and request change approval;\nc. Highlight proposed changes to the system that have not been approved or disapproved within [Assignment: organization-defined time period];\nd. Prohibit changes to the system until designated approvals are received;\ne. Document all changes to the system; and\nf. Notify [Assignment: organization-defined personnel] when approved changes to the system are completed.',
  'CM-3(2)': 'Test, validate, and document changes to the system before finalizing the implementation of the changes.',
  'CM-3(4)': 'Require an information security representative to be a member of the [Assignment: organization-defined configuration change control element].',
  'CM-3(6)': 'Implement cryptographic mechanisms to detect unauthorized disclosure of information, and take [Assignment: organization-defined actions] if unauthorized disclosure is detected.',

  // CM-4 enhancements
  'CM-4(1)': 'Analyze changes to the system in a separate test environment before implementation in an operational environment, looking for security impacts due to flaws, weaknesses, incompatibility, or intentional malice.',
  'CM-4(2)': 'After the system is changed, check the security functions to verify that the functions are implemented correctly, operating as intended, and producing the desired outcome with regard to meeting the security requirements for the system.',

  // CM-5 enhancements
  'CM-5(1)': 'a. Enforce access restrictions;\nb. Review system changes; and\nc. Verify the integrity of information technology products.',

  // CM-6 enhancements
  'CM-6(1)': 'Manage and apply configuration settings for [Assignment: organization-defined system components] using [Assignment: organization-defined automated mechanisms].',
  'CM-6(2)': 'Monitor changes to the configuration settings in accordance with organizational policies and procedures.',

  // CM-7 enhancements
  'CM-7(1)': 'a. Review the system [Assignment: organization-defined frequency] to identify unnecessary and/or nonsecure functions, ports, protocols, software, and services; and\nb. Disable or remove [Assignment: organization-defined functions, ports, protocols, software, and services within the system deemed to be unnecessary and/or nonsecure].',
  'CM-7(2)': 'Prevent program execution in accordance with [Selection (one or more): [Assignment: organization-defined policies regarding software program usage and restrictions]; rules authorizing the terms and conditions of software program usage].',
  'CM-7(5)': 'a. Identify [Assignment: organization-defined software programs authorized to execute on the system];\nb. Employ a deny-all, permit-by-exception policy to allow the execution of authorized software programs on the system; and\nc. Review and update the list of authorized software programs [Assignment: organization-defined frequency].',

  // CM-8 enhancements
  'CM-8(1)': 'Update the inventory of system components as an integral part of component installations, removals, and system updates.',
  'CM-8(2)': 'Employ automated mechanisms to help maintain an up-to-date, complete, accurate, and readily available inventory of system components.',
  'CM-8(3)': 'a. Detect the presence of unauthorized hardware, software, and firmware components within the system using [Assignment: organization-defined automated mechanisms] [Assignment: organization-defined frequency]; and\nb. Take the following actions when unauthorized components are detected: [Selection (one or more): disable network access by such components; isolate the components; notify [Assignment: organization-defined personnel or roles]].',
  'CM-8(4)': 'Include in the system component inventory information, a means for identifying by [Selection (one or more): name; position; role], individuals responsible and accountable for administering those components.',

  // CM-12 enhancements
  'CM-12(1)': 'Use automated tools to help maintain an inventory of personally identifiable information and for detecting and documenting changes to the inventory.',

  // CP-2 enhancements
  'CP-2(1)': 'Coordinate contingency plan development with organizational elements responsible for related plans.',
  'CP-2(2)': 'Conduct capacity planning so that necessary capacity for information processing, telecommunications, and environmental support exists during contingency operations.',
  'CP-2(3)': 'Plan for the resumption of [Selection: all; essential] mission and business functions within [Assignment: organization-defined time period] of contingency plan activation.',
  'CP-2(5)': 'Plan for the continuance of [Selection: all; essential] mission and business functions with little or no loss of operational continuity and sustains that continuity until full system restoration at primary processing and/or storage sites.',
  'CP-2(8)': 'Identify critical system assets supporting [Assignment: organization-defined mission and business functions].',

  // CP-3 enhancements
  'CP-3(1)': 'Incorporate simulated events into contingency training to facilitate effective response by personnel in crisis situations.',

  // CP-4 enhancements
  'CP-4(1)': 'Test the contingency plan at the alternate processing site to familiarize contingency personnel with the facility and available resources and to evaluate the capabilities of the alternate processing site to support contingency operations.',
  'CP-4(2)': 'Test the contingency plan at the alternate processing site:\na. Using automated mechanisms; or\nb. In coordination with [Assignment: organization-defined required element to test].',

  // CP-6 enhancements
  'CP-6(1)': 'Identify an alternate storage site that is separated from the primary storage site to reduce susceptibility to the same threats.',
  'CP-6(2)': 'Configure the alternate storage site to facilitate recovery operations in accordance with recovery time and recovery point objectives.',
  'CP-6(3)': 'Identify potential accessibility problems to the alternate storage site in the event of an area-wide disruption or disaster and outline explicit mitigation actions.',

  // CP-7 enhancements
  'CP-7(1)': 'Identify an alternate processing site that is separated from the primary processing site to reduce susceptibility to the same threats.',
  'CP-7(2)': 'Identify potential accessibility problems to alternate processing sites in the event of an area-wide disruption or disaster and outline explicit mitigation actions.',
  'CP-7(3)': 'Develop alternate processing site agreements that contain priority-of-service provisions in accordance with availability requirements (including recovery time objectives).',
  'CP-7(4)': 'Prepare the alternate processing site so that the site can serve as the operational site supporting essential mission and business functions.',

  // CP-8 enhancements
  'CP-8(1)': 'a. Develop primary and alternate telecommunications service agreements that contain priority-of-service provisions in accordance with availability requirements (including recovery time objectives); and\nb. Request telecommunications priority service in the event that the primary and/or alternate telecommunications services are provided by a common carrier.',
  'CP-8(2)': 'Obtain alternate telecommunications services to reduce the likelihood of sharing a single point of failure with primary telecommunications services.',
  'CP-8(3)': 'Obtain alternate telecommunications services from providers that are separated from primary service providers to reduce susceptibility to the same threats.',
  'CP-8(4)': 'Require primary and alternate telecommunications service providers to have contingency plans.',

  // CP-9 enhancements
  'CP-9(1)': 'Test backup information [Assignment: organization-defined frequency] to verify media reliability and information integrity.',
  'CP-9(2)': 'Use sampling-based testing to verify the integrity of backup information.',
  'CP-9(3)': 'Store backup copies of [Assignment: organization-defined critical system software and other security-related information] in a separate facility or in a fire-rated container that is not collocated with the operational system.',
  'CP-9(5)': 'Transfer system backup information to the alternate storage site [Assignment: organization-defined time period and transfer rate consistent with the recovery time and recovery point objectives].',
  'CP-9(8)': 'Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of [Assignment: organization-defined backup information].',

  // CP-10 enhancements
  'CP-10(2)': 'Implement transaction recovery for systems that are transaction-based.',
  'CP-10(4)': 'Provide the capability to employ [Assignment: organization-defined restore configuration settings] to restore system components after [Assignment: organization-defined circumstances].',

  // IA-2 enhancements
  'IA-2(1)': 'Implement multi-factor authentication for access to privileged accounts.',
  'IA-2(2)': 'Implement multi-factor authentication for access to non-privileged accounts.',
  'IA-2(5)': 'When shared accounts or authenticators are employed, require individuals to be authenticated with an individual authenticator prior to using a shared authenticator.',
  'IA-2(8)': 'Implement replay-resistant authentication mechanisms for access to [Selection (one or more): privileged accounts; non-privileged accounts].',
  'IA-2(12)': 'Accept and electronically verify Personal Identity Verification-compliant credentials.',

  // IA-4 enhancements
  'IA-4(4)': 'Manage individual identifiers by uniquely identifying each individual as [Assignment: organization-defined characteristic identifying individual status].',

  // IA-5 enhancements
  'IA-5(1)': 'For password-based authentication:\na. Maintain a list of commonly-used, expected, or compromised passwords and update the list [Assignment: organization-defined frequency] and when organizational passwords are suspected to have been compromised directly or indirectly;\nb. Verify, when users create or update passwords, that the passwords are not found on the list of commonly-used, expected, or compromised passwords in IA-5(1)(a);\nc. Transmit passwords only over cryptographically-protected channels;\nd. Store passwords using an approved salted key derivation function, preferably using a keyed hash;\ne. Require immediate selection of a new password upon account recovery;\nf. Allow user selection of long passwords and passphrases, including spaces and all printable characters;\ng. Employ automated tools to assist the user in selecting strong password authenticators; and\nh. Enforce the following composition and complexity rules: [Assignment: organization-defined composition and complexity rules].',
  'IA-5(2)': 'For PKI-based authentication:\na. Validate certificates by constructing and verifying a certification path to an accepted trust anchor, including checking certificate status information;\nb. Enforce authorized access to the corresponding private key;\nc. Map the authenticated identity to the account of the individual or group; and\nd. Implement a local cache of revocation data to support path discovery and validation.',
  'IA-5(6)': 'Protect authenticators commensurate with the security category of the information to which use of the authenticator permits access.',

  // IA-8 enhancements
  'IA-8(1)': 'Accept and electronically verify Personal Identity Verification-compliant credentials from other federal agencies.',
  'IA-8(2)': 'Accept only external authenticators that are NIST-compliant and document and maintain a list of accepted external authenticators.',
  'IA-8(4)': 'Employ the use of [Assignment: organization-defined identity federation standards] to accept third-party credentials.',

  // IA-12 enhancements
  'IA-12(2)': 'a. Require individuals to present two or more pieces of evidence of identity to validate information presented in support of claimed identity; and\nb. For in-person enrollment, confirm a claimed individual identity using [Selection: supervisor or sponsor attestation; or prior enrollment database records].',
  'IA-12(3)': 'Require that the registration process to receive an account for logical access uses the following forms of identity proofing with in-person or supervised-remote identity proofing: [Assignment: organization-defined identity proofing requirements].',
  'IA-12(4)': 'Accept externally-proofed identities at [Assignment: organization-defined identity assurance level].',
  'IA-12(5)': 'Require that the following measures are taken for the following types of accounts: [Assignment: organization-defined types of accounts with corresponding measures].',

  // IR-2 enhancements
  'IR-2(1)': 'Incorporate simulated events into incident response training to facilitate effective response by personnel in crisis situations.',
  'IR-2(2)': 'Employ automated mechanisms to provide a more thorough and realistic incident response training environment.',

  // IR-3 enhancements
  'IR-3(2)': 'Coordinate incident response testing with organizational elements responsible for related plans.',

  // IR-4 enhancements
  'IR-4(1)': 'Employ automated mechanisms to support the incident handling process.',
  'IR-4(4)': 'Correlate incident information and individual incident responses to achieve an organization-wide perspective on incident awareness and response.',
  'IR-4(11)': 'Establish and maintain an integrated incident response team that can be deployed to any location identified by the organization in [Assignment: organization-defined time period].',

  // IR-5 enhancements
  'IR-5(1)': 'Track incidents through the resolution process.',

  // IR-6 enhancements
  'IR-6(1)': 'Employ automated mechanisms to assist in the reporting of security incidents.',
  'IR-6(3)': 'Provide incident information to the provider of the product or service and other organizations involved in the supply chain for systems or system components related to the incident.',

  // IR-7 enhancements
  'IR-7(1)': 'Increase the availability of incident response information and support using [Assignment: organization-defined automated mechanisms].',

  // MA-2 enhancements
  'MA-2(2)': 'a. Require that [Assignment: organization-defined personnel or roles] explicitly approve the use of [Assignment: organization-defined maintenance activities and maintenance tools associated with the use of automated mechanisms]; and\nb. Employ automated mechanisms to help ensure that maintenance is done correctly.',

  // MA-3 enhancements
  'MA-3(1)': 'Inspect the tools used by maintenance personnel for improper or unauthorized modifications.',
  'MA-3(2)': 'Check media containing diagnostic and test programs for malicious code before the media are used in the system.',
  'MA-3(3)': 'Prevent the unauthorized removal of maintenance equipment by verifying that the equipment contains no organizational information.',

  // MA-4 enhancements
  'MA-4(3)': 'a. Require that nonlocal maintenance and diagnostic services be performed from a system that implements a security capability comparable to the capability implemented on the system being serviced; or\nb. Remove the component to be serviced from the system prior to nonlocal maintenance or diagnostic services; sanitize the component (with regard to organizational information) before removal from organizational facilities; and after the service is performed, inspect and sanitize the component (with regard to potentially malicious software) before reconnecting the component to the system.',

  // MA-5 enhancements
  'MA-5(1)': 'a. Implement procedures for the use of maintenance personnel that lack appropriate security clearances, including the following requirements:\n1. Maintenance personnel who do not have needed access authorizations, clearances, or formal access approvals are escorted and supervised during the performance of maintenance and diagnostic activities on the system by approved organizational personnel who are fully cleared, have appropriate access authorizations, and are technically qualified;\n2. Prior to initiating maintenance or diagnostic activities by personnel who do not have needed access authorizations, clearances, or formal access approvals, all volatile information storage components within the system are sanitized and all nonvolatile storage media are removed or physically disconnected from the system and secured; and\nb. Develop and implement alternate controls in the event a system component cannot be sanitized, removed, or disconnected from the system.',

  // MP-6 enhancements
  'MP-6(1)': 'Review, approve, track, document, and verify media sanitization and disposal actions.',
  'MP-6(2)': 'Test sanitization equipment and procedures [Assignment: organization-defined frequency] to ensure that the intended sanitization is being achieved.',
  'MP-6(3)': 'Sanitize the following portable, removable storage devices prior to connecting such devices to the system when the devices come from unknown provenance: [Assignment: organization-defined portable, removable storage devices].',

  // PE-3 enhancements
  'PE-3(1)': 'Enforce physical access authorizations to the system in addition to the physical access controls for the facility at [Assignment: organization-defined physical spaces containing one or more components of the system].',

  // PE-6 enhancements
  'PE-6(1)': 'Monitor physical access to the facility where the system resides using physical intrusion alarms and surveillance equipment.',
  'PE-6(4)': 'Monitor physical access to the system in addition to the physical access monitoring of the facility at [Assignment: organization-defined physical spaces containing one or more components of the system].',

  // PE-8 enhancements
  'PE-8(1)': 'Automate the visitor access records using [Assignment: organization-defined automated mechanisms].',

  // PE-11 enhancements
  'PE-11(1)': 'Provide a long-term alternate power supply for the system that is capable of maintaining minimally required operational capability in the event of an extended loss of the primary power source.',

  // PE-13 enhancements
  'PE-13(1)': 'Employ fire detection systems that activate automatically and notify [Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders] in the event of a fire.',
  'PE-13(2)': 'Employ fire suppression systems that activate automatically and notify [Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders] in the event of a fire.',

  // PE-15 enhancements
  'PE-15(1)': 'Employ [Assignment: organization-defined mechanisms] to protect against [Assignment: organization-defined types of water damage] resulting from potential water leakage from plumbing systems and sensors deployed throughout the facility.',

  // PL-4 enhancements
  'PL-4(1)': 'Include in the rules of behavior, explicit restrictions on the use of social media, social networking sites, and other external sites/applications.',

  // PM enhancements
  'PM-5(1)': 'Develop and maintain an inventory of systems that process, store, or transmit personally identifiable information.',
  'PM-7(1)': 'Establish and maintain an enterprise architecture, with consideration for information security and privacy, that describes the structure and behavior of the enterprise.',
  'PM-16(1)': 'Correlate and analyze threat intelligence information from [Assignment: organization-defined sources] that focuses on impact to the organization.',
  'PM-20(1)': 'Publish [Assignment: organization-defined frequency] information about privacy policies and practices in a centrally accessible location and share the privacy information with [Assignment: organization-defined external stakeholders].',
  'PM-30(1)': 'Monitor for counterfeit and damaged products throughout the supply chain.',

  // PS enhancements
  'PS-4(2)': 'Notify individuals of applicable, legally binding post-employment requirements for the protection of organizational information.',

  // RA enhancements
  'RA-3(1)': 'Assess supply chain risks associated with [Assignment: organization-defined systems, system components, and system services] using [Assignment: organization-defined risk assessment approach].',
  'RA-5(2)': 'Update the system vulnerabilities to be scanned [Selection (one or more): [Assignment: organization-defined frequency]; prior to a new scan; when new vulnerabilities are identified and reported].',
  'RA-5(4)': 'Determine what information about the system is discoverable by adversaries and subsequently take [Assignment: organization-defined corrective actions].',
  'RA-5(5)': 'Implement privileged access authorization to [Assignment: organization-defined system components] for [Assignment: organization-defined vulnerability scanning activities].',
  'RA-5(11)': 'Establish a public reporting channel for receiving reports of vulnerabilities in organizational systems and system components.',

  // SA enhancements
  'SA-4(1)': 'Require the developer of the system, system component, or system service to demonstrate the use of a system development life cycle process that includes [Assignment: organization-defined state-of-the-practice system, security, and privacy engineering methods, software development methods, testing, evaluation, assessment, verification, and validation methods, and quality control processes].',
  'SA-4(2)': 'Require the developer of the system, system component, or system service to provide a description of the design and implementation of the controls to be used in the system, system component, or system service.',
  'SA-4(5)': 'Require the developer of the system, system component, or system service to:\na. Deliver the system, component, or service with [Assignment: organization-defined security and privacy configurations] implemented; and\nb. Use the configurations as the default for any subsequent system, component, or service reinstallation or upgrade.',
  'SA-4(9)': 'Require the developer of the system, system component, or system service to identify early in the system development life cycle, the functions, ports, protocols, and services intended for organizational use.',
  'SA-4(10)': 'Require the developer of the system, system component, or system service to employ only government-approved components in the [Assignment: organization-defined system, system component, or system service].',
  'SA-9(2)': 'Require providers of [Assignment: organization-defined external system services] to identify the functions, ports, protocols, and other services required for the use of such services.',
  'SA-15(3)': 'Require the developer of the system, system component, or system service to perform threat modeling and vulnerability analyses during development and the subsequent testing of the analyses as part of an overall risk management process.',

  // SC enhancements
  'SC-7(3)': 'Limit the number of external network connections to the system.',
  'SC-7(4)': 'Implement [Assignment: organization-defined controls] for external telecommunications services:\na. Implement a managed interface for each external telecommunication service;\nb. Establish a traffic flow policy for each managed interface;\nc. Protect the confidentiality and integrity of the information being transmitted across each interface;\nd. Document each exception to the traffic flow policy with a supporting mission or business need and duration of that need;\ne. Review exceptions to the traffic flow policy [Assignment: organization-defined frequency] and remove exceptions that are no longer supported by an explicit mission or business need.',
  'SC-7(5)': 'Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception).',
  'SC-7(7)': 'Prevent remote devices from simultaneously establishing connections with the system and other resources (i.e., split tunneling) unless the split tunnel connections meet [Assignment: organization-defined requirements].',
  'SC-7(8)': 'Route [Assignment: organization-defined internal communications traffic] to [Assignment: organization-defined external networks] through authenticated proxy servers at managed interfaces.',
  'SC-7(18)': 'Fail securely in the event of an operational failure of a boundary protection device.',
  'SC-7(21)': 'Restrict inbound and outbound communications to and from [Assignment: organization-defined source and destination addresses] based on [Selection (one or more): the reputation of the source address; the reputation of the destination address; [Assignment: organization-defined conditions]].',
  'SC-8(1)': 'Implement cryptographic mechanisms to [Selection (one or more): prevent unauthorized disclosure of information; detect changes to information] during transmission.',
  'SC-12(1)': 'Maintain availability of information in the event of the loss of cryptographic keys by users.',
  'SC-28(1)': 'Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of the following information at rest on [Assignment: organization-defined system components or media]: [Assignment: organization-defined information].',

  // SI enhancements
  'SI-2(2)': 'Monitor the system to discover and report vulnerabilities in installed software components [Assignment: organization-defined frequency].',
  'SI-4(2)': 'Employ automated tools and mechanisms to support near real-time analysis of events.',
  'SI-4(4)': 'Monitor inbound and outbound communications traffic [Assignment: organization-defined frequency] to detect unusual or unauthorized activities or conditions.',
  'SI-4(5)': 'Alert [Assignment: organization-defined personnel or roles] when the following system-generated indications of compromise or potential compromise occur: [Assignment: organization-defined compromise indicators].',
  'SI-4(10)': 'Make provisions so that [Assignment: organization-defined encrypted communications traffic] is visible to [Assignment: organization-defined system monitoring tools and mechanisms].',
  'SI-4(12)': 'Employ automated mechanisms to alert security personnel of the following inappropriate or unusual activities with privacy implications: [Assignment: organization-defined activities that trigger alerts].',
  'SI-4(14)': 'Employ a wireless intrusion detection system to identify rogue wireless devices and to detect attack attempts and potential compromises or breaches to the system.',
  'SI-4(20)': 'Implement [Assignment: organization-defined additional monitoring] of individuals who have been identified by [Assignment: organization-defined sources] as posing an increased level of risk.',
  'SI-4(22)': 'Monitor [Assignment: organization-defined individuals or groups] for unusual activity patterns indicative of insider threat activity.',
  'SI-5(1)': 'Automate the process of making security directives available organization-wide.',
  'SI-7(1)': 'Perform an integrity check of [Assignment: organization-defined software, firmware, and information] [Selection (one or more): at startup; at [Assignment: organization-defined transitional states or security-relevant events]; [Assignment: organization-defined frequency]].',
  'SI-7(2)': 'Employ automated tools and mechanisms that provide notification to [Assignment: organization-defined personnel or roles] upon discovering discrepancies during integrity verification.',
  'SI-7(5)': 'Automatically [Selection (one or more): shut the system down; restart the system; implement [Assignment: organization-defined controls]] when integrity violations are discovered.',
  'SI-7(7)': 'Incorporate the detection of the following unauthorized changes to [Assignment: organization-defined security-relevant changes to the system] into the organizational incident response capability.',
  'SI-7(15)': 'Restrict the capability to input information to the system to authorized individuals.',
  'SI-8(2)': 'Automatically update spam protection mechanisms.',

  // ============================================================
  // PRIVACY BASELINE ENHANCEMENTS (P-only controls)
  // ============================================================

  // AC-3 privacy enhancements
  'AC-3(14)': 'Provide mechanisms to enable individuals to have access to their personally identifiable information.',

  // AT-3 privacy enhancements
  'AT-3(5)': 'Provide [Assignment: organization-defined personnel or roles] with initial and [Assignment: organization-defined frequency] training in the employment and operation of personally identifiable information processing controls.',

  // AU-3 privacy enhancements
  'AU-3(3)': 'a. Identify the [Assignment: organization-defined elements] deemed necessary to support notification of individuals upon the occurrence of privacy incidents; and\nb. Limit personally identifiable information in audit records to those elements deemed necessary.',

  // IR-2 privacy enhancements
  'IR-2(3)': 'Include breach response training in incident response training.',

  // IR-8 privacy enhancements
  'IR-8(1)': 'Coordinate the incident response plan with [Assignment: organization-defined entities] to include the breach response plan.',

  // PE-8 privacy enhancements
  'PE-8(3)': 'Limit personally identifiable information contained in visitor access records to the following elements identified in the privacy risk assessment: [Assignment: organization-defined elements].',

  // SA-8 privacy enhancements
  'SA-8(33)': 'Apply the following systems security and privacy engineering principles to reduce the volume of personally identifiable information processed and retained: [Assignment: organization-defined systems security and privacy engineering principles].',

  // SC-7 privacy enhancements
  'SC-7(24)': 'For systems that process personally identifiable information, implement the following boundary protections to separate personally identifiable information from other data and information: [Assignment: organization-defined boundary protections].',

  // SI-12 privacy enhancements
  'SI-12(1)': 'Limit personally identifiable information being processed in the information life cycle to the following elements identified in the privacy risk assessment: [Assignment: organization-defined elements of personally identifiable information].',
  'SI-12(2)': 'Use the following techniques to minimize the use of personally identifiable information for research, testing, and training: [Assignment: organization-defined techniques].',
  'SI-12(3)': 'a. Use [Assignment: organization-defined techniques] to dispose of, destroy, or erase information following the retention period; and\nb. Dispose of, destroy, or erase the information using organizational mechanisms.',

  // SI-18 privacy enhancements
  'SI-18(4)': 'Comply with legally mandated time periods for access, correction, and deletion of personally identifiable information or create a record of the request and the reasons why the action taken is lawful.',

  // SR enhancements
  'SR-2(1)': 'Establish and maintain a process or processes for vetting supply chain information or for ensuring the integrity of supply chain information for the system, system component, or system service.',
  'SR-9(1)': 'Inspect the following systems or system components [Selection (one or more): at random; at [Assignment: organization-defined frequency], upon [Assignment: organization-defined indications of need for inspection]] to detect tampering: [Assignment: organization-defined systems or system components].',
  'SR-11(1)': 'Employ anti-counterfeiting measures and/or methods as part of the incoming inspection process for [Assignment: organization-defined systems or system components].',
  'SR-11(2)': 'Report counterfeit system components to [Selection (one or more): source of counterfeit component; [Assignment: organization-defined external reporting organizations]; [Assignment: organization-defined personnel or roles]].',

};
