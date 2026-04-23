# Control Owner Wizard — Compliance & UX Specification

> This file combines the former CONTROL_OWNER_WIZARD_SPECIFICATION.md (NIST SP 800-53 Rev. 5 compliance spec) and CONTROL_OWNER_UX_SPEC.md (UX design spec) into a single reference.

---

# Part 1 — Compliance Specification


**Document Status:** Specification (Pre-Development)
**Baseline:** NIST SP 800-53 Rev. 5 & SP 800-53A Assessment Methodology
**Target Audience:** GRC Development Team

---

## Executive Summary

This specification defines what the **Control Owner Wizard** in the Larsen Cyber GRC Wizard must capture, display, and report to satisfy NIST SP 800-53 Rev. 5 compliance requirements. The Control Owner role is responsible for documenting **control implementation status, evidence, and attestation** in preparation for control assessments.

The wizard must balance two goals:
1. **Compliance Accuracy:** Align with NIST SP 800-53A Assessment Methodology
2. **Operator Clarity:** Help non-experts understand what is required and why

---

## Part 1: Implementation Status Taxonomy

### NIST-Aligned Status Definitions

Each control must have exactly one **implementation status** at any given time:

| Status | NIST Meaning | When to Use | Required Fields |
|--------|--------------|------------|-----------------|
| **Not Started** | The control design has not yet commenced; no resources allocated. | Initial state; awaiting implementation plan approval. | — |
| **Planned** | Implementation is scheduled with a defined target date; resources identified. | Remediation plan approved; timeline established. | `targetDate` (required) |
| **In Progress** | Implementation underway; partial functionality achieved; assessment expected within defined window. | Control activities initiated; staff assigned; testing in progress. | `description`, `targetDate` |
| **Implemented** | Control is fully operational and producing observable, measurable effects; evidence exists. | Functional acceptance achieved; operational for ≥30 days (per NIST); evidence collected. | `description`, `implementationDate`, `evidenceSummary`, `evidenceUrls` |
| **Not Applicable** | Control is determined by organization to be inapplicable to this system after formal justification. | Exception approved by CISO/Risk Officer; risk accepted in writing. | `naJustification` (required, ≥100 words) |
| **Inherited** | Functionality satisfied by parent system, service provider, or compensating control. | Control delegated; supplier attestation obtained. | `inheritedFrom`, `inheritanceEvidence` |

### Status Transitions (State Machine)

Valid transitions:
- `Not Started` → `Planned`, `Not Applicable`, `Inherited`
- `Planned` → `In Progress`, `Not Applicable`, `Inherited`
- `In Progress` → `Implemented`, `Not Applicable`, `Inherited`
- `Implemented` → (terminal; no reverse transitions without audit trail)
- `Not Applicable` → (terminal; requires exception review to reverse)
- `Inherited` → (terminal; requires re-assessment to revoke)

**Audit Trail:** Every status change must record:
- Previous status
- New status
- Changed by (user email)
- Changed at (ISO 8601 timestamp)
- Reason (brief text field)

---

## Part 2: What Must Be Captured Per Control

### Minimum Required Data Structure

```json
{
  "controlId": "AC-2",
  "controlName": "Account Management",
  "controlFamily": "AC",
  "controlBaselines": ["L", "M", "H"],

  // ─── CONTROL STATUS ───
  "status": "Implemented",
  "statusHistory": [
    { "from": "Not Started", "to": "Planned", "by": "jane.smith@company.com", "at": "2026-01-15T09:30:00Z", "reason": "Approved by CISO" }
  ],

  // ─── IMPLEMENTATION NARRATIVE ───
  "implementationDescription": "The organization implements account management controls through Active Directory, including...",
  "implementationApproach": "Preventive: AD-based access lifecycle mgmt",
  "implementationDate": "2025-06-01",
  "targetDate": "2026-03-31",

  // ─── CONTROL OWNERSHIP ───
  "controlOwner": {
    "name": "John Doe",
    "title": "Identity & Access Manager",
    "email": "john.doe@company.com",
    "phone": "555-0123",
    "department": "IT Operations"
  },

  // ─── EVIDENCE ───
  "evidence": [
    {
      "id": "ev-001",
      "type": "Policy",
      "title": "Account Management Procedure v2.1",
      "reference": "POL-IM-001",
      "location": "\\shared\policies\account-management.docx",
      "uploadedAt": "2026-01-20T14:00:00Z",
      "description": "Defines lifecycle, access provisioning, review processes"
    },
    {
      "id": "ev-002",
      "type": "Log",
      "title": "Access Review Report Jan 2026",
      "reference": "JIRA-ITSEC-4521",
      "location": "https://jira.company.com/ITSEC-4521",
      "uploadedAt": "2026-02-10T11:22:00Z",
      "description": "Quarterly user access review with 847 records reviewed, 23 exceptions approved"
    },
    {
      "id": "ev-003",
      "type": "Screenshot",
      "title": "AD Group Membership Audit",
      "reference": "screenshot_ad_audit_2026-02.png",
      "location": "file://storage/evidence/ac-2/screenshot_ad_audit_2026-02.png",
      "uploadedAt": "2026-02-15T09:15:00Z",
      "description": "Screenshot showing quarterly group membership audit report"
    }
  ],
  "evidenceSummary": "7 evidence artifacts collected; all support full implementation",

  // ─── EXCEPTION HANDLING ───
  "naJustification": null,
  "inheritedFrom": null,
  "inheritanceEvidence": null,

  // ─── CONTROL LINKAGE ───
  "linkedAssets": ["SYS-001", "SYS-002"],
  "linkedPolicies": ["POL-IM-001"],
  "linkedTests": ["TST-AC-2-001"],

  // ─── ATTESTATION ───
  "attestation": {
    "status": "Attested",
    "attestedBy": "john.doe@company.com",
    "attestedAt": "2026-02-20T13:45:00Z",
    "statement": "I attest that the above control implementation description is accurate and complete as of 2026-02-20..."
  },

  // ─── AUDIT TRAIL ───
  "lastUpdated": "2026-02-20T13:45:00Z",
  "lastUpdatedBy": "john.doe@company.com",
  "createdAt": "2026-01-10T08:00:00Z",
  "createdBy": "jane.smith@company.com",

  // ─── METADATA ───
  "internalNotes": "Gaps identified in contractor account deprovisioning—remediation planned for Q2",
  "reviewStatus": "Approved by CISO",
  "riskRating": "Low"
}
```

---

## Part 3: NIST-Aligned Implementation Guidance Per Control Type

### Control Categories (from NIST SP 800-53)

Controls fall into five operational categories:

#### 1. **Access & Identity Controls** (AC, IA, PS)
**Plain English:** Controls that manage *who* can access *what* and verify their identity.

**Implementation Guidance to Show:**
> "Access controls limit system access to authorized users. Provide evidence of:
> - User access requests/approvals
> - Multi-factor authentication configuration (if applicable)
> - Recent user access reviews (within 90 days)
> - Deprovisioning logs for terminated users"

**Evidence Types Most Relevant:**
- Policy documents
- Access request logs/tickets
- MFA enrollment lists
- IAM system screenshots
- Quarterly access review reports
- Deprovisioning procedure documentation

---

#### 2. **Configuration & Change Controls** (CM, SC)
**Plain English:** Controls that ensure systems are set up securely and changes are approved before deployment.

**Implementation Guidance to Show:**
> "Configuration controls ensure systems are built to a secure baseline and remain in that state. Provide evidence of:
> - Baseline configuration documentation
> - Change control approval records
> - Configuration compliance scanning results
> - System hardening checklists"

**Evidence Types Most Relevant:**
- Configuration baseline documents
- Change request approvals
- Scanning/compliance reports (e.g., Nessus, CIS CAT)
- System hardening scripts
- Before/after configuration comparisons

---

#### 3. **Monitoring & Detection Controls** (AU, SI, CA)
**Plain English:** Controls that watch for problems, log what happens, and report suspicious activity.

**Implementation Guidance to Show:**
> "Monitoring controls detect and record security events. Provide evidence of:
> - Log collection/centralization configuration
> - Monitoring rules or SIEM queries in use
> - Alert/incident logs showing detection
> - Log retention policies and storage
> - Audit log analysis/review samples"

**Evidence Types Most Relevant:**
- SIEM/logging configuration documents
- Alerting rule definitions
- Sample log analysis reports
- Incident detection examples
- Log retention policies
- Centralized logging architecture diagram

---

#### 4. **Planning & Assessment Controls** (PL, RA, CA)
**Plain English:** Controls that involve planning, assessing risk, and authorizing systems.

**Implementation Guidance to Show:**
> "Planning controls ensure security decisions are made proactively. Provide evidence of:
> - System security plans
> - Risk assessment reports
> - Authorization documentation (ATO letter)
> - Security architecture diagrams
> - Continuous monitoring plans"

**Evidence Types Most Relevant:**
- Security plans (SSP, PIA)
> Risk assessment reports
- System security categorization
- Authorization decision memos
- Architecture documentation
- Continuous monitoring schedules

---

#### 5. **Personnel & Awareness Controls** (AT, PS, IR)
**Plain English:** Controls that train people and establish processes for handling security incidents.

**Implementation Guidance to Show:**
> "Personnel controls ensure staff understand their security role. Provide evidence of:
> - Annual training completion records
> - Incident reporting procedures
> - Training content (curriculum)
> - Training attendance rosters
> - Incident response drills/tests"

**Evidence Types Most Relevant:**
- Training completion records (roster)
- Training materials/curriculum
- Certificates or sign-off sheets
- Incident response playbooks
- Drill/exercise reports
- Personnel clearance documentation

---

#### 6. **Contingency & Continuity Controls** (CP, MA)
**Plain English:** Controls that prepare for disruptions and ensure systems continue operating.

**Implementation Guidance to Show:**
> "Contingency controls ensure you can recover from failures. Provide evidence of:
> - Backup and recovery procedures
> - Backup verification/restoration tests
> - Alternate site documentation
> - Disaster recovery plan
> - Maintenance windows/logs"

**Evidence Types Most Relevant:**
- Backup policies
- Backup test results
- Recovery time objectives (RTO/RPO) documentation
- Alternate processing site agreements
- Disaster recovery plan documents
- Maintenance logs

---

#### 7. **Supplier & External Controls** (SA, SR)
**Plain English:** Controls on third-party vendors and supply chain security.

**Implementation Guidance to Show:**
> "Supplier controls manage risk from external providers. Provide evidence of:
> - Vendor security assessments
> - Service level agreements (SLAs) with security clauses
> - Supplier audit reports
> - Contract security requirements
> - Supplier attestations/certifications"

**Evidence Types Most Relevant:**
- Vendor security questionnaires (completed)
- Service agreements with security clauses
- Supplier audit reports (SOC 2, ISO 27001)
- Security requirements in RFQs
- Vendor attestation letters
- Third-party penetration test results

---

#### 8. **Physical Protection Controls** (PE, MP)
**Plain English:** Controls that protect buildings, equipment, and physical media.

**Implementation Guidance to Show:**
> "Physical controls protect facilities and media. Provide evidence of:
> - Facility access logs
> - Badge/key control procedures
> - Environmental monitoring (temp, humidity)
> - Media destruction certificates
> - Visitor access logs"

**Evidence Types Most Relevant:**
- Physical access control policy
- Badge/key audit logs
- Facility floor plans with security zones
- Environmental monitoring logs
- Media sanitization certificates
- Visitor sign-in procedures

---

### Control Family Mapping → Implementation Guidance

| Family | NIST Name | Primary Operational Category | Typical Control Type |
|--------|-----------|----------------------------|----------------------|
| AC | Access Control | Access & Identity | Preventive / Technical |
| AT | Awareness & Training | Personnel & Awareness | Administrative |
| AU | Audit & Accountability | Monitoring & Detection | Detective / Technical |
| CA | Assessment, Authorization & Monitoring | Planning & Assessment | Detective / Preventive |
| CM | Configuration Management | Configuration & Change | Preventive / Technical |
| CP | Contingency Planning | Contingency & Continuity | Corrective |
| IA | Identification & Authentication | Access & Identity | Preventive / Technical |
| IR | Incident Response | Personnel & Awareness | Corrective / Detective |
| MA | Maintenance | Contingency & Continuity | Preventive / Detective |
| MP | Media Protection | Physical Protection | Preventive / Technical |
| PE | Physical & Environmental Protection | Physical Protection | Preventive / Detective |
| PL | Planning | Planning & Assessment | Preventive / Administrative |
| PM | Program Management | Planning & Assessment | Administrative |
| PS | Personnel Security | Personnel & Awareness | Preventive / Administrative |
| PT | PII Processing & Transparency | Personnel & Awareness | Preventive / Administrative |
| RA | Risk Assessment | Planning & Assessment | Preventive / Corrective |
| SA | System & Services Acquisition | Supplier & External | Preventive / Administrative |
| SC | System & Communications Protection | Configuration & Change | Preventive / Technical |
| SI | System & Information Integrity | Monitoring & Detection | Detective / Corrective |
| SR | Supply Chain Risk Management | Supplier & External | Preventive / Administrative |

---

## Part 4: Evidence Types Per Control Family

### Acceptable Evidence Types by Family

All families accept these **universal evidence types:**
- Policy or procedure documents
- Process flowcharts
- Configuration documentation
- Screenshots (dated, labeled)
- Test results / reports
- Audit logs
- Interview notes
- Meeting minutes
- Email communications

#### **AC — Access Control**
**Primary:** Access request logs, IAM system exports, access review reports, role matrices
**Secondary:** Badge logs, network access lists, firewall rules, VPN logs

#### **AT — Awareness & Training**
**Primary:** Training completion certificates, attendance rosters, course materials, quiz/assessment results
**Secondary:** Training calendar, training needs assessment, knowledge check results

#### **AU — Audit & Accountability**
**Primary:** Audit log samples, SIEM configuration, log retention documentation, log review reports
**Secondary:** System event logs, application logs, centralized logging setup documentation

#### **CA — Assessment, Authorization & Monitoring**
**Primary:** Assessment reports, scan results, system security plans, ATO letters, continuous monitoring schedules
**Secondary:** Control assessment worksheets, vulnerability reports, remediation tracking

#### **CM — Configuration Management**
**Primary:** Baseline configuration documents, change request approvals, configuration compliance reports, CM procedures
**Secondary:** Hardening scripts, configuration checklist checklists, CM tool exports

#### **CP — Contingency Planning**
**Primary:** Contingency plan document, backup verification test results, recovery procedures, DRP document
**Secondary:** Backup logs, alternate site agreements, RTO/RPO calculations

#### **IA — Identification & Authentication**
**Primary:** Identity management policy, authentication configuration, credential management procedures, MFA enrollment list
**Secondary:** Password policy, authentication logs, identity audit reports

#### **IR — Incident Response**
**Primary:** Incident response plan, incident logs, response drill reports, incident handling procedures
**Secondary:** Incident metrics, SIRT charter, escalation procedures

#### **MA — Maintenance**
**Primary:** Maintenance procedures, maintenance logs, maintenance scheduling documents, tool control inventory
**Secondary:** Maintenance agreements, access control for maintenance activities, maintenance personnel credentialing

#### **MP — Media Protection**
**Primary:** Media handling procedures, media inventory, sanitization certificates, media marking standards
**Secondary:** Storage location audit, media tracking logs, disposal records

#### **PE — Physical & Environmental Protection**
**Primary:** Physical security policy, facility floor plan, access control logs, environmental monitoring logs
**Secondary:** Video surveillance records, visitor logs, key/badge audit, perimeter inspection reports

#### **PL — Planning**
**Primary:** System security plan, security architecture diagram, rules of behavior, baseline documentation
**Secondary:** Planning process documentation, stakeholder sign-off, plan update logs

#### **PM — Program Management**
**Primary:** Information security program plan, budget allocation, org chart, metrics dashboard
**Secondary:** Program status reports, resource allocation justifications, strategic planning documents

#### **PS — Personnel Security**
**Primary:** Position risk designations, screening procedures, background check records, termination checklist, access agreements
**Secondary:** Personnel security training records, sanctions policy

#### **PT — PII Processing & Transparency**
**Primary:** Privacy notice samples, consent forms, data processing agreements, PII handling procedures
**Secondary:** Data inventory, data flow diagrams, retention schedules

#### **RA — Risk Assessment**
**Primary:** Risk assessment report, threat/vulnerability analysis, risk register, risk remediation plan
**Secondary:** Categorization documentation, risk scoring methodology, vulnerability scan results

#### **SA — System & Services Acquisition**
**Primary:** Acquisition plan, RFQ/RFP with security requirements, vendor security assessment, contract security clauses
**Secondary:** SLA/SLO documents, vendor attestations, security requirements checklist

#### **SC — System & Communications Protection**
**Primary:** Cryptographic key management procedures, boundary protection architecture, encryption configuration
**Secondary:** Encryption implementation logs, key rotation records, network segmentation diagrams

#### **SI — System & Information Integrity**
**Primary:** Patch management policy, antivirus configuration, integrity monitoring setup, flaw remediation logs
**Secondary:** Patch deployment records, vulnerability tracking, malware incident logs

#### **SR — Supply Chain Risk Management**
**Primary:** Supply chain risk assessment, vendor management procedures, supplier monitoring plan, supplier audit results
**Secondary:** Supplier risk register, component authenticity verification, procurement rules of engagement

---

## Part 5: Plain English Control Explanations for Non-Experts

### Per-Control Descriptions (Sample Set)

Each control in the wizard should display both the NIST title and a **non-expert explanation**. Example:

#### AC-2: Account Management
**NIST Title:** Account Management
**What It Is (Plain English):**
> "Your organization needs to create user accounts in a controlled way, regularly review who has access, and remove accounts when people leave. This control ensures that only the right people can access systems."

**Why It Matters:**
> "Without proper account management, terminated employees might still have system access, or unauthorized users could gain access to sensitive data. This is one of the most common security gaps."

**What You Need to Show:**
> - How accounts are requested and approved (policy or form)
> - A recent audit showing who has access and why
> - Evidence that accounts are removed when employees leave
> - A list of all active user accounts

---

#### AU-6: Audit Record Review, Analysis, and Reporting
**NIST Title:** Audit Record Review, Analysis, and Reporting
**What It Is (Plain English):**
> "Someone in your organization needs to regularly look at system logs (audit records) to find suspicious activity. This isn't a one-time activity—it's ongoing."

**Why It Matters:**
> "Logs are only useful if someone reads them. Without regular review, security incidents can hide in plain sight. This control ensures someone is actually watching for problems."

**What You Need to Show:**
> - A person's job description that includes log review responsibilities
> - A sample log analysis report showing what was found
> - Evidence of a regular schedule (e.g., daily SIEM alerting, weekly report)
> - Screenshots of your monitoring tools or dashboards

---

#### CP-2: Contingency Plan
**NIST Title:** Contingency Plan
**What It Is (Plain English):**
> "Your organization needs a documented plan for what to do if something goes wrong—systems fail, disasters strike, or security is breached. This plan should be tested regularly."

**Why It Matters:**
> "When crisis hits, there's no time to figure things out. A written plan ensures everyone knows their role and can recover quickly, minimizing downtime and data loss."

**What You Need to Show:**
> - A written contingency plan (or disaster recovery plan)
> - Evidence that the plan has been tested (e.g., test results from a drill)
> - Recovery time objectives (RTOs) and how they're met
> - Recent backup verification showing data can be restored

---

#### SI-2: Flaw Remediation
**NIST Title:** Flaw Remediation
**What It Is (Plain English):**
> "Software has bugs. Some bugs are security flaws. Your organization needs a process to find these flaws (via patches, scans, or reports) and fix them quickly."

**Why It Matters:**
> "Attackers scan for known vulnerabilities every day. The faster you patch, the smaller your exposure window. This control ensures patches are prioritized and deployed on a schedule."

**What You Need to Show:**
> - Your patch management policy
> - A log of recent patches deployed
> - Evidence of vulnerability scanning (e.g., Nessus reports)
> - SLAs showing how quickly critical vs. non-critical flaws are fixed
> - A list of exceptions (if any) with justifications

---

---

## Part 6: Control Owner Attestation

### NIST-Compliant Attestation Statement

Every control submission must include an **attestation signature** from the Control Owner. The attestation statement should read:

```
═══════════════════════════════════════════════════════════════

CONTROL OWNER ATTESTATION

I, [Name], in my role as [Title], hereby attest that:

1. The implementation description above accurately reflects how
   control [CONTROL-ID: Control Name] is currently implemented
   in the organization's information systems.

2. The evidence artifacts referenced are authentic, current, and
   demonstrate that the control is operating as described.

3. I am aware that this attestation may be used in security
   assessments, audit proceedings, and regulatory submissions.

4. To the best of my knowledge, the above statements are true
   and complete as of [DATE].

5. I understand that making false statements in this attestation
   may result in disciplinary action.

Attested by:  [Signature or Digital Signature]
Name:         [Full Name]
Title:        [Job Title]
Organization: [Company Name]
Date:         [ISO 8601 Date]
Email:        [Email Address]

═══════════════════════════════════════════════════════════════
```

### Attestation Workflow

1. **Draft Phase:** Control Owner documents implementation without attestation.
2. **Ready for Review:** Control Owner marks control as complete (all required fields filled).
3. **Review Phase:** CISO or designated reviewer examines documentation.
4. **Approved for Attestation:** System sends notification to Control Owner.
5. **Attestation Phase:** Control Owner reviews submission one final time, then digitally signs attestation.
6. **Final State:** Attestation is locked; no further edits allowed without explicit audit trail.

### Digital Signature Requirements

- **Method:** Email-based digital signature with timestamp (e.g., DocuSign, Adobe Sign)
  - OR browser-based e-signature with HMAC-SHA256 commitment
  - OR PKI-based signature (if available)
- **Non-Repudiation:** System must maintain tamper-evident audit trail showing:
  - Who attested
  - When attestation occurred (ISO 8601)
  - Hash of attested document
  - IP address and user agent (optional but recommended)

---

## Part 7: Data Model Schema Recommendation

### `state.controlStatus[controlId]` Schema

```javascript
{
  // ─── PRIMARY IMPLEMENTATION STATE ───
  status: 'Implemented',  // enum: 'Not Started' | 'Planned' | 'In Progress' | 'Implemented' | 'Not Applicable' | 'Inherited'

  // ─── DESCRIPTION & NARRATIVE ───
  implementationDescription: 'The organization implements AC-2 through...',  // free text, ≥100 words for Implemented
  implementationApproach: 'Preventive: AD-based access lifecycle...',  // short summary
  narrative: 'Auditor-ready narrative...',  // formal statement, ≥200 words for Implemented
  internalNotes: 'Gaps identified in contractor deprovisioning...',  // internal only, not in reports

  // ─── DATES ───
  implementationDate: '2025-06-01',  // ISO 8601; when control became Implemented
  targetDate: '2026-03-31',  // ISO 8601; required if status='Planned' or 'In Progress'
  lastUpdated: '2026-02-20T13:45:00Z',  // ISO 8601; automatically set on every change
  lastUpdatedBy: 'john.doe@company.com',  // email of user who last updated
  createdAt: '2026-01-10T08:00:00Z',  // ISO 8601; never changes
  createdBy: 'jane.smith@company.com',  // email of user who created

  // ─── EVIDENCE ───
  evidence: [
    {
      id: 'ev-001',  // unique identifier (UUID or auto-incremented)
      type: 'Policy',  // enum: 'Policy' | 'Procedure' | 'Screenshot' | 'Log' | 'Ticket' | 'Interview' | 'Certification' | 'Other'
      title: 'Account Management Procedure v2.1',  // human-readable title
      reference: 'POL-IM-001',  // internal reference code
      location: 'https://storage.company.com/policies/ac-2-procedure.pdf',  // URL or file path
      uploadedAt: '2026-01-20T14:00:00Z',  // ISO 8601
      uploadedBy: 'john.doe@company.com',  // email of uploader
      description: 'Defines lifecycle, access provisioning, review processes...',  // ≥20 words; explains relevance to control
      expiryDate: null,  // ISO 8601; for certifications/attestations that expire
      tags: ['access-control', 'identity-management'],  // searchable tags
    }
    // ... more evidence objects
  ],
  evidenceSummary: '7 evidence artifacts collected covering policy, procedures, logs, and access review reports.',  // auto-generated summary

  // ─── EXCEPTION HANDLING ───
  naJustification: null,  // required if status='Not Applicable'; ≥100 words explaining why control doesn't apply
  inheritedFrom: null,  // required if status='Inherited'; reference to parent system or service provider
  inheritanceEvidence: null,  // URL/reference to supplier attestation or parent system documentation

  // ─── CONTROL OWNERSHIP ───
  // NOTE: This lives in state.controlOwners[controlId], not state.controlStatus[controlId]
  // See below for controlOwners schema

  // ─── TESTING LINKAGE ───
  linkedTests: [
    {
      testId: 'TST-AC-2-001',
      testName: 'Access Review Audit',
      testerEmail: 'tester@company.com',
      testDate: '2026-02-10T10:00:00Z',
      testResult: 'Pass',  // enum: 'Pass' | 'Fail' | 'Partial' | 'Not Tested'
      testFindings: 'No exceptions found in Q1 access review.',
    }
  ],
  linkedAssets: ['SYS-001', 'SYS-002'],  // system identifiers this control protects
  linkedPolicies: ['POL-IM-001', 'POL-IM-002'],  // policy family references

  // ─── ATTESTATION ───
  attestation: {
    status: 'Attested',  // enum: 'Not Attested' | 'Pending' | 'Attested' | 'Revoked'
    attestedBy: 'john.doe@company.com',  // email of attester
    attestedAt: '2026-02-20T13:45:00Z',  // ISO 8601
    attestationStatement: 'I hereby attest that the above implementation description is accurate...',  // full statement text
    signatureMethod: 'email-hash',  // enum: 'email-hash' | 'pkcs7' | 'browser-hmac' | 'docusign'
    signatureHash: 'sha256:abc123...',  // cryptographic hash of document at attestation time
    signatureTimestamp: '2026-02-20T13:45:00Z',  // server timestamp of signature
    signatureIpAddress: '192.168.1.100',  // optional; IP of signer
    revokedAt: null,  // ISO 8601; set if attestation is revoked (requires audit trail)
    revokedBy: null,  // email of person who revoked
    revocationReason: null,  // free text reason for revocation
  },

  // ─── AUDIT TRAIL ───
  statusHistory: [
    {
      from: 'Not Started',
      to: 'Planned',
      by: 'jane.smith@company.com',
      at: '2026-01-15T09:30:00Z',
      reason: 'Approved by CISO for implementation',
    },
    {
      from: 'Planned',
      to: 'In Progress',
      by: 'john.doe@company.com',
      at: '2026-01-20T08:00:00Z',
      reason: 'Development commenced',
    },
    // ... more transitions
  ],

  // ─── RISK & REVIEW ───
  riskRating: 'Low',  // enum: 'Critical' | 'High' | 'Medium' | 'Low' | 'N/A'
  reviewStatus: 'Approved by CISO',  // free text or enum: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected'
  reviewedBy: 'ciso@company.com',  // email of reviewer
  reviewedAt: '2026-02-20T12:00:00Z',  // ISO 8601
  reviewComments: 'Implementation is solid. Monitor contractor account deprovisioning.',  // free text feedback
}
```

### `state.controlOwners[controlId]` Schema

```javascript
{
  controlId: 'AC-2',  // matches control ID

  // ─── OWNER IDENTITY ───
  name: 'John Doe',  // full name (required)
  title: 'Identity & Access Manager',  // job title
  email: 'john.doe@company.com',  // corporate email (required)
  phone: '555-0123',  // optional
  department: 'IT Operations',  // organizational unit
  reportingTo: 'IT Director',  // optional; chain of command

  // ─── RESPONSIBILITY PERIOD ───
  startDate: '2025-06-01',  // ISO 8601; when this person took responsibility
  endDate: null,  // ISO 8601; null if currently assigned
  successor: null,  // email of person taking over after this owner leaves

  // ─── DEADLINES ───
  dueDate: '2026-03-31',  // ISO 8601; when implementation must be complete
  reminderDates: [
    '2026-02-28',  // 30 days before
    '2026-03-24',  // 7 days before
  ],

  // ─── NOTIFICATIONS ───
  notifyAtStatuses: ['Implemented'],  // notify owner when these statuses are reached
  notificationMethod: 'email',  // enum: 'email' | 'teams' | 'slack' | 'both'

  // ─── AUDIT TRAIL ───
  assignedAt: '2026-01-10T08:00:00Z',  // ISO 8601; when this assignment was made
  assignedBy: 'jane.smith@company.com',  // email of person who assigned
  changedAt: '2026-02-15T10:00:00Z',  // ISO 8601; last change to this assignment
  changedBy: 'jane.smith@company.com',  // email of person who made change
}
```

### Complete State Object Addendum

The application's root `state` object should include:

```javascript
const state = {
  // ─── Existing fields ───
  baseline: null,  // 'L', 'M', 'H', or 'P'
  privacyOverlay: false,
  // ... (all existing fields remain)

  // ─── Control Owner Enhancement ───
  controlStatus: {},  // { 'AC-1': { status, narrative, evidence[], ... } } per schema above
  controlOwners: {},  // { 'AC-1': { name, email, dueDate, ... } } per schema above

  // ─── Testing Integration ───
  controlTestResults: {},  // { 'AC-1': { testId, result, findings, testDate } }

  // ─── Attestation Management ───
  controlAttestations: {},  // { 'AC-1': { status, attestedBy, attestedAt, ... } }
  attestationBatch: null,  // timestamp of last batch attestation cycle

  // ─── Reports & Analytics ───
  complianceMetrics: {
    totalControls: 0,
    implemented: 0,
    inProgress: 0,
    planned: 0,
    notApplicable: 0,
    notStarted: 0,
    withEvidence: 0,
    attested: 0,
    percentComplete: 0,
  },
};
```

---

## Part 8: Control Categorization & Grouping

### Display Groupings (Instead of Just "By Family")

**Option A: By Operational Category** (Recommended for Control Owners)

Group controls by what they *do* rather than NIST family code:

1. **Access & Identity** (AC, IA, PS)
   - User access controls
   - Authentication & credential management
   - Personnel security
   - Easy for IT Ops to understand

2. **Configuration & Hardening** (CM, SC)
   - System baselines
   - Change control
   - Cryptography
   - Relevant to sysadmins & security engineers

3. **Detection & Monitoring** (AU, SI, CA)
   - Logging & audit
   - System monitoring
   - Vulnerability management
   - Relevant to SOC & security analysts

4. **Planning & Risk Management** (PL, RA, PM)
   - Security plans
   - Risk assessments
   - Program oversight
   - Relevant to CISO & senior management

5. **Personnel, Training & Incident Response** (AT, IR, PS)
   - Security awareness
   - Incident response
   - Personnel screening
   - Relevant to HR & security ops

6. **Contingency, Maintenance & Physical** (CP, MA, PE, MP)
   - Disaster recovery
   - Maintenance controls
   - Physical security
   - Relevant to facilities & ops

7. **Supplier & Acquisition** (SA, SR)
   - Vendor management
   - Procurement security
   - Supply chain risk
   - Relevant to procurement & third-party risk

8. **Privacy** (PT, PM-18+)
   - PII handling
   - Privacy notice & consent
   - Privacy controls
   - Relevant if Privacy baseline selected

### Tab/Card Design Per Control in Control Owner Wizard

Each control card in the selection UI should show:

```
╔════════════════════════════════════════════════════════════╗
║  AC-2  Access Control › Account Management              ✓  ║
├────────────────────────────────────────────────────────────┤
║  OPERATIONAL CATEGORY: Access & Identity                    ║
║  BASELINE(S): Low, Moderate, High                           ║
║                                                              ║
║  PLAIN ENGLISH:                                              ║
║  Your organization controls who has access to systems and   ║
║  regularly reviews user accounts to ensure proper access.   ║
║                                                              ║
║  RELATED POLICIES: POL-IM-001 (Identity Management)         ║
║  DEPENDS ON: AC-1 (Access Control Policy)                   ║
║  LINKED ASSETS: SYS-001, SYS-002, SYS-003                   ║
║                                                              ║
║  CONTROL OWNER: John Doe (IT Operations)                    ║
║  DUE DATE: 2026-03-31  [⚠ 40 days remaining]                ║
║  STATUS: In Progress                                        ║
║                                                              ║
║  IMPLEMENTATION GUIDANCE:                                    ║
║  ✓ Provide user access request & approval documentation     ║
║  ✓ Show recent access review (< 90 days)                    ║
║  ✓ Document deprovisioning process & examples               ║
║  ✓ Submit screenshots of IAM system or AD groups            ║
║                                                              ║
║  ACCEPTABLE EVIDENCE TYPES:                                  ║
║  • Policy documents  • Access logs  • Audit reports         ║
║  • Screenshots  • Test results  • Review documents          ║
║                                                              ║
║                         [DETAIL VIEW] [EVIDENCE] [HISTORY]  ║
╚════════════════════════════════════════════════════════════╝
```

---

## Part 9: Risk Rating & Review Status

### Risk Rating Taxonomy

When displaying or tracking controls, assign a risk rating based on:

| Risk Rating | Meaning | Trigger | Action |
|------------|---------|---------|--------|
| **Critical** | Control completely missing; high-impact asset exposed. | Status='Not Started' + Due < 30 days | CISO escalation required |
| **High** | Control severely deficient; significant gaps. | Status='Not Applicable' without full justification, OR Status='Planned' + Due < 30 days | Remediation plan required |
| **Medium** | Control partially implemented; minor gaps. | Status='In Progress' + Due < 7 days, OR weaknesses in evidence | Monitoring; risk accepted |
| **Low** | Control fully implemented; evidence strong. | Status='Implemented' + evidence present | Routine re-assessment |
| **N/A** | Control not applicable; justified. | Status='Not Applicable' + full justification | N/A (no action) |

### Review Status Workflow

```
Draft → Pending Review → Approved → Attested
  ↓                          ↓          ↓
(Control Owner editing)  (CISO review) (Locked)
                              ↓
                          Rejected
                          (return to Draft)
```

---

## Part 10: Messaging & Help Text Examples

### In-Line Help for Each Field

**Implementation Description field:**
> "Describe how this control operates in your environment. What systems, processes, or tools are involved? Who is responsible? This should be detailed enough that an auditor could verify it. Minimum 100 words for 'Implemented' status."

**Evidence field:**
> "Attach or link files that prove the control is working. Acceptable types include policies, procedures, access logs, screenshots, audit reports, tickets, test results, or interview notes. For each piece of evidence, briefly explain how it supports the control (e.g., 'Access review report shows 847 users reviewed, 23 exceptions')."

**Not Applicable Justification:**
> "If this control doesn't apply to your organization, explain why with full business or technical justification. For example: 'AC-8 (System Use Notification) does not apply because our organization has no interactive users—all systems are automated backend services.' Minimum 100 words required."

**Inherited From:**
> "If another system or service provider handles this control on your behalf, document the source. Include the name of the parent system or vendor, the service level agreement reference, and a link to their attestation (if available)."

**Due Date:**
> "When should the Control Owner have this control implemented or reviewed? This date is used for priority tracking and due-soon warnings."

### Toast / Alert Messages

**On Status Transition:**
- Status changed to `Implemented`: "✅ Control marked as Implemented. Review and attest to complete submission."
- Status changed to `Not Applicable`: "⚠️ Control marked Not Applicable. Justification required (≥100 words) for audit trail."
- Status changed to `Inherited`: "📋 Control marked Inherited. Supply parent system or service provider attestation reference."

**On Evidence Upload:**
- "✅ Evidence added: POL-IM-001. Consider adding test results or audit logs for stronger proof."

**On Attestation:**
- "✅ Attestation successful. Control locked. Any future changes will require re-attestation."
- "⚠️ Attestation revoked by CISO. Updated implementation description. Please re-attest."

**On Due Date Approaching:**
- **30 days before:** "📅 Due date is in 30 days. Time to finalize implementation."
- **7 days before:** "🚨 Due date is in 7 days. Accelerate evidence collection if needed."
- **Overdue:** "❌ OVERDUE: This control was due [date]. Please update status or request extension."

---

## Part 11: Tester Role Integration

### How Control Status Feeds Assessment

The **Tester** (independent assessor) role must be able to:

1. **View Control Owner's Documentation:**
   - Implementation narrative
   - Evidence artifacts
   - Current status

2. **Access Test Planning Tools:**
   - Link control to test case
   - Schedule test execution
   - Define test procedures

3. **Record Test Results:**
   - Pass / Fail / Partial
   - Findings & observations
   - Test evidence (logs, screenshots)
   - Recommendations

4. **Provide Feedback:**
   - "Evidence is clear and sufficient for Implemented status"
   - "Control description doesn't match operational reality—recommend In Progress"
   - "Missing critical evidence: access revocation logs"

### Data Model Linkage

```
state.controlTestResults[controlId] = {
  testId: 'TST-AC-2-001',
  controlId: 'AC-2',
  testerEmail: 'tester@company.com',
  testDate: '2026-02-10T10:00:00Z',
  testResult: 'Pass',  // 'Pass' | 'Fail' | 'Partial' | 'Not Yet Tested'
  testProcedure: 'Reviewed IAM system, sampled 50 active users, verified access justification',
  findings: 'No exceptions found. Access review process operating as documented.',
  evidence: [
    { type: 'Log', reference: 'IAM_audit_2026-02-10.csv', description: 'User access audit export' },
    { type: 'Screenshot', reference: 'screenshot_ad_groups.png', description: 'AD group membership verification' }
  ],
  recommendations: 'Continue current practices. Consider expanding access review to include contractor accounts.',
  linkedEvidence: ['ev-001', 'ev-002'],  // links back to Control Owner's evidence
  assessmentStatus: 'Assessed',
  assessmentDate: '2026-02-10T14:30:00Z',
};
```

---

## Part 12: Summary of Implementation Checklist for Developers

### UI/UX Requirements

- [ ] Control detail view shows NIST title + plain English explanation
- [ ] Status dropdown restricted to valid state transitions (prevent Invalid → Implemented)
- [ ] "Not Applicable" status requires ≥100-word justification before save
- [ ] "Inherited" status requires parent system reference + evidence URL
- [ ] Implementation date auto-filled when status changes to Implemented (optional: allow override)
- [ ] Target date required for Planned / In Progress status
- [ ] Evidence upload supports file picker + drag-drop
- [ ] Evidence type selector shows contextual help (e.g., "For AC-2, Policy + Access logs are most relevant")
- [ ] Evidence description required (≥20 words); validated before save
- [ ] Narrative field requires ≥200 words for Implemented status
- [ ] "Implementation Approach" field offers dropdown suggestions per control type (Preventive, Detective, etc.)
- [ ] Control Owner assignment shows lookup with email verification
- [ ] Due date selector with date picker; warnings for dates < 30 days
- [ ] Attestation button only active when all required fields complete
- [ ] Attestation workflow captures digital signature + timestamp + IP
- [ ] Status history visible in sidebar or collapsible section
- [ ] Audit trail (who changed what, when) always visible
- [ ] "Linked Tests" section shows tester results and feedback
- [ ] Risk rating automatically calculated and displayed
- [ ] Overdue controls flagged with red badge in list view
- [ ] Toast notifications for status changes, due date warnings, evidence issues
- [ ] Export option generates audit-ready PDF with attestation

### Data Persistence

- [ ] All fields persisted to backend database (or LocalStorage with sync on blur)
- [ ] Status transitions logged with timestamp, user email, reason
- [ ] Evidence artifacts stored with metadata (upload time, uploader, hash)
- [ ] Attestation stored with cryptographic signature (hash + timestamp)
- [ ] Audit trail immutable; no deletion of history
- [ ] Control submission includes complete snapshot (for audit trail)

### Reporting

- [ ] Summary dashboard shows completion % by family, by status, by owner
- [ ] Control inventory table sortable/filterable by family, status, owner, due date
- [ ] Evidence summary report listing all artifacts per control
- [ ] Attestation report listing all attested controls + signature dates
- [ ] Risk report highlighting Critical/High-risk controls
- [ ] Test results report linking tester findings to control status
- [ ] Compliance scorecard for CISO dashboard (% Implemented, % Attested, etc.)

---

## Part 13: Example Control Owner Workflow

### Scenario: Control Owner (John Doe) Implementing AC-2

**Step 1: Receive Assignment Notification**
- Email: "You have been assigned AC-2 (Account Management) to implement by 2026-03-31"
- John clicks link → logs into Control Owner tab
- Sees AC-2 card with status "Not Started"

**Step 2: Review Guidance**
- Reads plain English explanation: "Your organization controls who has access to systems..."
- Reads implementation guidance: "Provide user access request & approval documentation, recent access review, deprovisioning process..."
- Reviews evidence types: Policy, procedures, screenshots, logs, tickets

**Step 3: Draft Implementation**
- Clicks "Detail View" → opens control form
- Fills in "Implementation Approach": "Preventive: Active Directory lifecycle management with quarterly access reviews"
- Changes status from "Not Started" → "In Progress"
- Sets targetDate: "2026-03-31"

**Step 4: Collect Evidence**
- Uploads POL-IM-001 (Identity Management Policy) → Evidence type: Policy
- Uploads Access_Review_Q1_2026.xlsx → Evidence type: Log
- Takes screenshot of AD groups → Evidence type: Screenshot
- For each, adds description: "Defines lifecycle processes," "Quarterly user access review," "Current AD group memberships"

**Step 5: Write Narrative**
- Drafts implementation narrative:
  > "The organization implements account management controls through Active Directory. User accounts are requested via ticketing system (JIRA), approved by line manager and IT, then provisioned by IT Operations. Access rights are documented in our Identity Management Policy (POL-IM-001). Quarterly access reviews occur in all departments, comparing current AD group membership against current employee roster. Exceptions are escalated to department heads. Upon employee termination, accounts are disabled within 24 hours per our deprovisioning procedure. This control has been in effect since June 2025."

**Step 6: Add Internal Notes**
- Notes: "Gaps: contractor account deprovisioning needs tightening. Action item for Q2."

**Step 7: Submit for Review**
- Clicks "Mark Ready for Review"
- System validates all required fields are complete
- Email sent to CISO: "John Doe submitted AC-2 for review"

**Step 8: CISO Review**
- CISO reviews narrative, evidence, risk rating
- CISO approves with comment: "Strong implementation. Monitor contractor gaps."
- Email sent to John: "AC-2 approved. Ready for attestation."

**Step 9: Attestation**
- John reads attestation statement
- Clicks "Attest" → signs with email-based OTP verification
- System records attestation with timestamp, signature hash, John's email
- Control locked; status → "Attested"
- Tester role now has access to review for assessment

**Step 10: Tester Assessment**
- Tester (separate role) reviews John's documentation
- Schedules on-site test: review IAM system, sample 50 user accounts, verify deprovisioning
- Executes test, records findings: "No exceptions found. Control operating as documented."
- Links test result to control
- Tester status: "Assessed" ✓

---

## Part 14: Compliance Validation Rules

### Validation Rules for Control Owner Input

**For Status = "Implemented":**
- [ ] `implementationDescription` must be ≥100 words
- [ ] `narrative` must be ≥200 words
- [ ] At least 2 evidence artifacts required
- [ ] `implementationDate` must be set (cannot be in future)
- [ ] `attestation.status` must be 'Attested'

**For Status = "In Progress":**
- [ ] `targetDate` must be set and ≥1 day in future
- [ ] `implementationDescription` must be ≥50 words
- [ ] At least 1 evidence artifact required

**For Status = "Planned":**
- [ ] `targetDate` must be set and ≥14 days in future
- [ ] `implementationDescription` must be ≥30 words

**For Status = "Not Applicable":**
- [ ] `naJustification` must be ≥100 words
- [ ] Justification must include business, technical, or regulatory reason
- [ ] CISO approval required (flag for review)

**For Status = "Inherited":**
- [ ] `inheritedFrom` must be filled with parent system or vendor name
- [ ] `inheritanceEvidence` must link to attestation/documentation
- [ ] Evidence must be accessible (URL must return 200 OK)

**For All Statuses:**
- [ ] `controlOwner` email must match an active corporate directory entry
- [ ] Evidence `description` for each artifact must be ≥20 words
- [ ] Evidence `location` (URL) must be accessible or flagged as "Attachment"
- [ ] All dates must be valid ISO 8601 format

### Pre-Submission Checklist

```
AC-2 Account Management — Implementation Checklist
═══════════════════════════════════════════════════

□ Status set to "Implemented"
□ Implementation description: [100+ words] (232/100 ✓)
□ Implementation approach: [dropdown selected] (Preventive ✓)
□ Narrative: [200+ words] (487/200 ✓)
□ Implementation date: [set] (2025-06-01 ✓)
□ Evidence artifacts: [2+ required] (3 artifacts ✓)
  □ POL-IM-001 (Policy) ✓
  □ Access_Review_Q1_2026 (Log) ✓
  □ screenshot_ad_groups.png (Screenshot) ✓
□ Control Owner assigned: [name + email] (John Doe ✓)
□ Due date: [set] (2026-03-31 ✓)
□ Risk rating: [auto-calculated] (Low ✓)
□ Attestation: [Attest button enabled]

All checks passed. Ready to attest.
```

---

## Part 15: Recommended Development Sequence

**Phase 1: Core Data Model (Week 1-2)**
- Implement `state.controlStatus[id]` schema
- Implement `state.controlOwners[id]` schema
- Add validation rules
- Implement status transition logic

**Phase 2: Control Detail Form (Week 2-3)**
- Build form layout (narrative, evidence, dates, owner)
- Add inline help text & guidance per control type
- Implement evidence upload (file picker + drag-drop)
- Add evidence type selector with context

**Phase 3: Status Management (Week 3-4)**
- Implement status dropdown with transition rules
- Add "Not Applicable" justification modal
- Add "Inherited" parent system lookup
- Add risk rating calculation

**Phase 4: Attestation Workflow (Week 4-5)**
- Build attestation modal/wizard
- Implement digital signature capture (email OTP + HMAC)
- Lock control after attestation
- Audit trail logging

**Phase 5: List View & Navigation (Week 5-6)**
- Build control inventory table (list view)
- Add filters (family, status, owner, baseline)
- Add sorting (due date, status, progress)
- Add bulk operations (assign to owner, mark ready for review)

**Phase 6: Tester Integration (Week 6-7)**
- Link test results to controls
- Display tester feedback in control detail
- Add test scheduling

**Phase 7: Reports & Export (Week 7-8)**
- Build control status dashboard
- Build evidence summary report
- Build attestation report
- Add PDF export for audits

---

## Part 16: Related Documentation & References

### NIST Framework References
- NIST SP 800-53 Rev. 5: Security and Privacy Controls for Information Systems and Organizations
- NIST SP 800-53A Rev. 1: Assessing Security and Privacy Controls (Assessment methodology)
- NIST SP 800-39: Managing Information Security Risk
- NIST SP 800-37 Rev. 2: Risk Management Framework (RMF) Process

### Sample Control Assessments (NIST)
- AC-2 Assessment Examples (NIST SP 800-53A)
- AU-2 Assessment Examples (NIST SP 800-53A)
- CA-2 Control Assessment (NIST SP 800-53A)

### Industry Standards
- ISO/IEC 27001:2022 — Controls mapping to NIST
- CIS Controls v8 — Control overlap & prioritization
- COBIT 2019 — Governance framework alignment

---

## Appendix A: Control Type Classification Matrix

| Control ID | Family | Category | Type(s) | Baseline(s) |
|-----------|--------|----------|---------|------------|
| AC-1 | AC | Access & Identity | Administrative | L, M, H |
| AC-2 | AC | Access & Identity | Preventive, Technical | L, M, H |
| AC-3 | AC | Access & Identity | Preventive, Technical | L, M, H |
| AU-1 | AU | Monitoring & Detection | Administrative | L, M, H |
| AU-2 | AU | Monitoring & Detection | Detective, Technical | L, M, H |
| AU-6 | AU | Monitoring & Detection | Detective, Technical | L, M, H |
| CA-2 | CA | Planning & Assessment | Preventive, Administrative | L, M, H |
| CM-2 | CM | Configuration & Change | Preventive, Technical | L, M, H |
| CM-3 | CM | Configuration & Change | Preventive, Technical | M, H |
| CP-2 | CP | Contingency & Continuity | Preventive, Corrective | L, M, H |
| SI-2 | SI | Monitoring & Detection | Corrective, Technical | L, M, H |
| ... | ... | ... | ... | ... |

---

## Appendix B: Evidence Quality Checklist

**For EVERY evidence artifact, validate:**

- [ ] **Authenticity:** Document is genuine (signed/dated by organization)
- [ ] **Currency:** Document is recent (≤90 days old unless policy/procedure)
- [ ] **Relevance:** Evidence clearly supports the control claim
- [ ] **Completeness:** Evidence is not redacted or incomplete
- [ ] **Accessibility:** URL/file is accessible to auditors (or properly redacted for confidentiality)
- [ ] **Context:** Control Owner's description explains *how* evidence supports control
- [ ] **Metadata:** Evidence includes source, date, preparer information

**Example Good Evidence:**
> "Access_Review_Q1_2026.xlsx — Quarterly access review report signed by IT Director (2026-02-10). Shows 847 active users reviewed, 23 exceptions (with approvals), deprovisioning of 12 terminated employees. Proves AC-2 control is operating."

**Example Weak Evidence:**
> "ad_groups_screenshot.png — [No description]. [No date]. [No context]."

---

## Appendix C: Suggested Plain English Control Descriptions (All 20 Families)

### AC — Access Control
> "Access controls limit who can use your systems and what they can do. The organization creates accounts carefully, reviews who has access regularly, and removes access when people leave."

### AT — Awareness & Training
> "Security awareness ensures everyone understands their role in protecting information. The organization provides annual training and tracks completion."

### AU — Audit & Accountability
> "Audit logs record what happens in systems. Someone regularly reads these logs to find suspicious activity and prove that controls are working."

### CA — Assessment, Authorization & Monitoring
> "Assessments check whether controls are working. Authorization documents (ATOs) formally approve systems for operation. Monitoring checks control effectiveness continuously."

### CM — Configuration Management
> "Configuration management establishes a 'secure baseline' for systems. All changes must be approved and tested before deployment."

### CP — Contingency Planning
> "Contingency planning prepares for disasters. The organization has a documented plan to back up data and recover systems quickly."

### IA — Identification & Authentication
> "Identification & authentication verify that users are who they claim to be. The organization requires passwords, multi-factor authentication, or other proof of identity."

### IR — Incident Response
> "Incident response defines how the organization detects, reports, and recovers from security incidents. Personnel are trained and tested regularly."

### MA — Maintenance
> "Maintenance controls ensure that when systems are serviced, security isn't compromised. Maintenance personnel are vetted and tracked."

### MP — Media Protection
> "Media protection controls how data is stored, transported, and destroyed. Hard drives, USB drives, and paper documents are protected or securely destroyed."

### PE — Physical & Environmental Protection
> "Physical security protects facilities housing computer systems. Locked doors, badge access, surveillance, and environmental controls (temperature, humidity) prevent theft and damage."

### PL — Planning
> "Security plans document what controls are in place and why. Plans are kept current and reviewed annually."

### PM — Program Management
> "Program management oversees the entire information security program across the organization. Resources, budget, and leadership accountability are defined."

### PS — Personnel Security
> "Personnel security ensures that employees are vetted before hiring and that access is removed promptly when they leave."

### PT — PII Processing & Transparency
> "PII (Personally Identifiable Information) handling ensures the organization respects privacy. Privacy notices, consent, and data minimization are documented."

### RA — Risk Assessment
> "Risk assessments identify threats and vulnerabilities. The organization periodically assesses risk and updates its remediation plans."

### SA — System & Services Acquisition
> "Acquisition controls ensure that security requirements are included in contracts before systems or software are purchased. Vendors are vetted."

### SC — System & Communications Protection
> "System and communications protection controls ensure data is encrypted in transit and at rest. Network boundaries are protected, and systems are isolated."

### SI — System & Information Integrity
> "System integrity controls prevent malicious changes. Patches are applied promptly, malware protection is active, and logs detect unauthorized changes."

### SR — Supply Chain Risk Management
> "Supply chain risk management ensures that vendors and suppliers don't introduce security vulnerabilities. Suppliers are audited and monitored."

---

**End of Specification**

**Next Steps:**
1. Review this specification with GRC development team
2. Validate control taxonomy against NIST SP 800-53 Rev. 5 & SP 800-53A
3. Prototype Phase 1 data model
4. Conduct usability testing with non-expert Control Owners
5. Integrate with Tester role workflow
6. Deploy and collect feedback

---

# Part 2 — UX Design Specification


## Overview

The Control Owner wizard guides individuals assigned to implement NIST 800-53 controls through a structured 4-step process. Control Owners receive assignments from Policy Owners (who work in the Policy tab) and use this wizard to document implementation approach, link evidence, and attest to completion. This flow should mirror the Policy Owner's workflow pattern while being tailored to control-level operational work.

**User Journey:**
- Policy Owner assigns AC-1, AC-2, etc. (specific controls) to individual Control Owners
- Control Owner opens the Control tab and runs the 4-step wizard
- For each control: read requirement → document implementation → upload evidence → attest
- Submit all documentation to CISO for audit review

---

## Wizard Architecture

### Step Names & Subtitles

| Step | Name | Subtitle | Icon |
|------|------|----------|------|
| 1 | My Controls Dashboard | Your assigned controls grouped by family and status | 📋 |
| 2 | Implement Controls | Document how each control is implemented in your environment | 📝 |
| 3 | Evidence & Documentation | Link evidence artifacts for auditor review | 📎 |
| 4 | Attestation & Submit | Final review and digital signature of completion | ✓ |

### Wizard Chrome

- **Header Bar:** Displays current step (e.g., "Step 2 of 4: Implement Controls")
- **Progress Indicator:** Visual bar showing % complete (25%, 50%, 75%, 100%)
- **Left Sidebar:** Shows step list with checkmarks; clickable for navigation
- **Footer Buttons:**
  - **Previous:** Returns to prior step (grayed if on Step 1)
  - **Next:** Advances to next step (disabled if validation fails)
  - **Save Draft:** Always available (saves state.controlStatus and state.controlOwners to localStorage)
  - **Exit:** Closes wizard and returns to Control Owner landing page

---

## Step 1 — My Controls Dashboard

### Purpose
Give the Control Owner an at-a-glance view of all assigned controls, grouped by family/domain. Show implementation status and quick-start actions.

### Layout Description

**Top Section (Header)**
```
┌─────────────────────────────────────────────────────────────────┐
│ My Controls Dashboard                                            │
│ {controls.length} controls assigned across {families.length}     │
│ families · {baseline} baseline {+ privacy overlay}               │
└─────────────────────────────────────────────────────────────────┘
```

**Status Cards (4-column grid)**
- **Implemented:** Count + "✅" icon, green accent
- **In Progress / Planned:** Count + "🔄" icon, amber accent
- **Not Started:** Count + "⏳" icon, slate accent
- **Not Applicable:** Count + "—" icon, gray accent

Each card shows:
```
IMPLEMENTED
25
of {total} controls
```

**Progress Bar**
- Shows % of controls marked Implemented
- Visual bar (teal fill) with percentage label
- Completion scale below: "Implemented · In Progress/Planned · Not Started"

**Implementation Status Alert (conditional)**
- If > 0 controls due within 30 days: Show amber banner
- Text: "⚠️ {N} control{s} due within 30 days. Head to Step 2 to document these first."

**Filter Bar**
```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Search by ID or name…  │ [All Families ▼] │ [All Statuses ▼] │
└──────────────────────────────────────────────────────────┘
```

**Control Inventory Table**
- **Columns:**
  - Control ID (monospace, e.g., AC-1)
  - Name (full control name)
  - Family (badge with color, e.g., AC)
  - Baselines (pills: Low, Mod, High, Privacy)
  - Owner (Control Owner name, or "Unassigned" in gray italics)
  - Due Date (e.g., "Jun 15, 26" or "—", bold + warning icon if due within 30 days)
  - Status (colored chip: Not Started / Planned / In Progress / Implemented / Not Applicable)

- **Sorting:** Sortable by Due Date (ascending), Status (by severity)
- **Interaction:** Click any row → open Step 2 with that control selected in detail panel
- **Keyboard:** Tab through rows; Enter to select; arrow keys to navigate

### Key UI Components

**Status Pill Styles**
```
Implemented:      background: #dcfce7, color: #166534, border: #86efac
In Progress:      background: #fef3c7, color: #92400e, border: #fcd34d
Planned:          background: #dbeafe, color: #1d4ed8, border: #93c5fd
Not Applicable:   background: #f1f5f9, color: #64748b, border: #cbd5e1
Not Started:      background: #eff6ff, color: #1e3a5f, border: #bfdbfe (default)
```

**Family Badges**
- Background: Semi-transparent teal (AC, AP, AT, AU, CA, CM, IA, SA, SC, etc.)
- Text: Navy or contrasting dark color
- Border: Light teal outline
- Size: 14px font, 6px padding vertical, 8px horizontal

### Data Read

- `state.baseline` — determines which controls appear
- `state.privacyOverlay` — adds P controls if true
- `state.controlStatus` — status for each control ID
- `state.controlOwners` — owner assignment details (name, email, dueDate)
- `getActiveControls()` — all controls in baseline + privacy overlay
- `getActiveFamilies()` — unique family codes

### Data Written

- `state._selectedCtrl` — which control detail to show in Step 2

### Empty State

If no baseline selected:
```
┌─────────────────────────────────────────────────────────┐
│                        🏛️                               │
│                  CISO Setup Required                     │
│                                                         │
│ The CISO must complete program setup to select baseline │
│ and assign controls. Once complete, you can document    │
│ control implementation here.                            │
│                                                         │
│              [ Go to CISO Setup → ]                      │
└─────────────────────────────────────────────────────────┘
```

### Validation Rules

- **Step 1 → Step 2:** No validation required. User can advance even if 0 controls documented.
- **Recommended check (warning only):** If user has 0 controls assigned, show: "ℹ️ No controls assigned to you yet. Check with your Policy Owner."

### Footer Buttons

| Button | Label | State | Action |
|--------|-------|-------|--------|
| Left | Previous | Disabled | Return to Control tab home (exit wizard) |
| Center-Left | Save Draft | Enabled | Save state.controlStatus + state.controlOwners |
| Center-Right | Next | Enabled | Advance to Step 2 |
| Right | Exit | Enabled | Close wizard, return to tab landing |

---

## Step 2 — Implement Controls

### Purpose
Let Control Owner document their implementation approach for each control, one control at a time. Show the control requirement, accept implementation description, set status, and link initial evidence.

### Layout Description

**Horizontal Split (60/40)**

**Left Panel (Control List)** — ~260px width
```
┌──────────────────────────────────────┐
│ 🔍 Filter controls…                  │
├──────────────────────────────────────┤
│ AC-1 Access Control Policy       ● ✓ │ ← selected (teal left border)
├──────────────────────────────────────┤
│ AC-2 Account Management          ● ⏳ │ ← dot color = status
├──────────────────────────────────────┤
│ AC-3 Access Control Enforcement  ●   │
├──────────────────────────────────────┤
│ AC-4 Information Flow Enforcement● ✕ │
└──────────────────────────────────────┘
```

- **Row Items:** Show control ID (monospace, bold), name (truncated), and status dot in right corner
- **Color coding:**
  - Implemented = #166534 (green)
  - In Progress = #92400e (orange)
  - Planned = #d97706 (amber)
  - Not Applicable = #64748b (slate)
  - Not Started = #94a3b8 (gray) — default
- **Interaction:** Click to select; keyboard arrow navigation supported
- **Filter:** Real-time search by ID or name; hidden rows return when search clears

**Right Panel (Implementation Form)** — Flex fill, scrollable

#### Control Header Section (Navy Background)
```
┌──────────────────────────────────────────────────────────┐
│ AC-1  [AC]                                          Status │
│ Access Control Policy                                   │
│ [Low] [Mod] [High]                            [Implemented] │
└──────────────────────────────────────────────────────────┘
```

- **Control ID:** Monospace, 18px, bold
- **Family Badge:** Small teal badge next to ID
- **Control Name:** 15px, semi-bold
- **Baselines:** Pills (Low, Mod, High, Privacy as applicable)
- **Status Chip:** Right-aligned, shows current status

#### Control Assignment Info Section
```
┌──────────────────────────────────────────────────────────┐
│ CONTROL OWNER ASSIGNMENT                    (Info box)   │
├──────────────────────────────────────────────────────────┤
│ [Owner Name]     [Role/Title]     [Email]     [Due Date] │
│ (readonly display of assigned owner from Policy tab)     │
│                                                          │
│ ℹ️ This control was assigned by {Policy Owner Name}      │
│    Due: {due date} · Owner: {owner name}                │
└──────────────────────────────────────────────────────────┘
```

**Read-only display** — shows assignment from Policy Owner's Step 4. If not yet assigned:
```
⚠️ Not Yet Assigned — Your Policy Owner will assign this control
   and notify you via email. Check back soon.
```

#### Implementation Status
```
IMPLEMENTATION STATUS

[Not Started ▼]
 • Not Started
 • Planned
 • In Progress
 • Implemented
 • Not Applicable
```

**Tooltip:** "Set the current implementation state of this control in your environment."

#### Implementation Approach
```
IMPLEMENTATION APPROACH

Describe how this control is or will be implemented in your
environment. Include specific systems, processes, or policies.

[Textarea, 3 rows, resizable]
Placeholder: "e.g. Access is managed through Active Directory
groups with quarterly access reviews. Multi-factor authentication
is required for all remote access..."

(Optional) ℹ️ Tip: Be specific — auditors will use this to
understand your approach.
```

#### Explanation in Plain English (Reference Section)
```
WHAT THIS CONTROL MEANS

(Collapsed accordion — click to expand)
"Organization is responsible for developing, documenting,
and maintaining a comprehensive access control policy that
addresses purpose, scope, roles & responsibilities,
management commitment, coordination, and review cycles."

—NIST SP 800-53 Rev. 5

Typical Implementation Evidence:
 • Policy document (PDF)
 • Approval memo from management
 • Training records
 • Annual review documentation
```

**Expanded view:** Show friendly explanation of what the control requires + typical evidence types (3-4 bullet points)

#### Evidence References
```
EVIDENCE REFERENCES

Add documentation (policies, tickets, screenshots) that
demonstrate this control is in place.

[Policy        ] [AC-POL-001.pdf                           ] [✕]
[Screenshot    ] [Screenshot_access_review_Q1_2026         ] [✕]
[Ticket        ] [JIRA-4521: MFA implementation complete  ] [✕]

+ Add Evidence

ℹ️ You'll refine these in Step 3. For now, just capture
what you have.
```

**Row for each evidence item:**
- **Type dropdown:** Policy, Procedure, Screenshot, Log, Ticket, Interview, Other
- **Reference field:** Text input; placeholder suggests format (e.g., filename, ticket ID, URL)
- **Delete button:** Red X; confirmation on hover: "Remove this evidence reference"

#### Implementation Narrative (Optional in Step 2, Required in Step 4)
```
IMPLEMENTATION NARRATIVE (Optional)

Write an auditor-ready narrative explaining how this control
satisfies the NIST requirement. This will be included in
compliance reports.

[Textarea, 4 rows, resizable]
Placeholder: "The organization implements AC-1 through…"

ℹ️ Leave blank for now; you'll complete in Step 3 if needed.
```

#### Internal Notes
```
INTERNAL NOTES (Not included in reports)

[Textarea, 2 rows, resizable]
Placeholder: "Gaps, remediation plans, open questions…"
```

#### Prev/Next Navigation
```
[ ← Prev Control ]                    [ Next Control → ]
```

- **Prev disabled** if on first control (AC-1)
- **Next disabled** if on last control
- Tab through controls quickly without returning to list

### Key UI Components

**Control List Item**
- **Dimensions:** Full-width row, 44px height
- **Padding:** 10px 14px
- **Hover:** Light teal background, cursor pointer
- **Selected:** Teal left border (3px), light teal background, teal text for ID
- **Status Dot:** 7px diameter circle, right margin 6px, color by status

**Form Labels**
- **Style:** 10-11px, ALL CAPS, 0.5px letter-spacing, text-muted gray
- **Bottom margin:** 6px
- **Example:** "IMPLEMENTATION APPROACH"

**Form Input/Textarea**
- **Border:** 1px solid --border color
- **Background:** White
- **Padding:** 10px 12px
- **Font:** 13px system font
- **Focus:** 2px teal border, no shadow

**Accordion (What This Control Means)**
- **Header clickable:** "WHAT THIS CONTROL MEANS" + disclosure triangle (▶ or ▼)
- **Expanded:** Shows 2-3 paragraphs of friendly explanation
- **Styling:** Light blue background on expand, monospace quote from NIST standard

### Data Read

- `state.baseline`, `state.privacyOverlay`
- `state.controlStatus[ctrlId]` — { status, approach, narrative, evidence[], notes }
- `state.controlOwners[ctrlId]` — { name, role, email, dueDate }
- `state._selectedCtrl` — which control to show
- `CONTROLS` — array of control objects with { id, n, f, bl, ... }
- `state.domainPolicies[fam]` — policy document (for reference in accordion)

### Data Written

- `state.controlStatus[ctrlId].status` — selected from dropdown
- `state.controlStatus[ctrlId].approach` — textarea input
- `state.controlStatus[ctrlId].narrative` — textarea input (optional)
- `state.controlStatus[ctrlId].evidence[]` — array of { type, ref }
- `state.controlStatus[ctrlId].notes` — textarea input
- `state._selectedCtrl` — on list item click

### Empty State (Within Step 2)

If no controls assigned:
```
┌─────────────────────────────────────┐
│         Select a Control            │
│                                     │
│  Click on a control in the list     │
│  on the left to view details and    │
│  begin documenting implementation.  │
└─────────────────────────────────────┘
```

### Validation Rules

**Step 2 → Step 3 Advancement:**
- No hard blocking; user can advance with blank controls
- **Optional warning (toast):** "ℹ️ {N} controls have no status set. You can still advance."
- **Recommended check:** At least 50% of controls should have status != "Not Started" (warning only)

**Per-Control Validation:**
- **Status:** Required to be non-null; default to "Not Started"
- **Approach:** Optional; but if Status = "Implemented", show tooltip: "💡 Consider adding implementation details to strengthen audit readiness"
- **Evidence:** Optional; warning if Status = "Implemented" and evidence is empty

### Helper Text & Tooltips

| Field | Helper Text |
|-------|-------------|
| Implementation Status | "Set the current implementation state of this control in your environment." |
| Implementation Approach | "Be specific — auditors will use this to understand how you've built this control." |
| What This Control Means | "Click to expand for NIST guidance and typical implementation approaches." |
| Evidence References | "You'll refine these in Step 3. For now, just capture what you have." |
| Implementation Narrative | "Leave blank for now; you'll complete in Step 3 if needed." |
| Internal Notes | "Not visible to auditors — use for gaps, remediations, open questions." |

### Keyboard Support

- **Tab:** Next field
- **Shift+Tab:** Previous field
- **Arrow Up/Down:** Navigate control list (when focused on list)
- **Enter:** Select control (when navigating list)
- **Ctrl+S / Cmd+S:** Save Draft (global shortcut)

### Footer Buttons

| Button | Label | State | Action |
|--------|-------|-------|--------|
| Left | Previous | Enabled | Go to Step 1 |
| Center-Left | Save Draft | Enabled | Save state.controlStatus |
| Center-Right | Next | Enabled | Advance to Step 3 |
| Right | Exit | Enabled | Close wizard, return to tab landing |

---

## Step 3 — Evidence & Documentation

### Purpose
Aggregate view of all controls requiring evidence. Control Owner refines evidence URLs, adds compliance narratives, and confirms documentation is audit-ready.

### Layout Description

**Top Section**
```
┌──────────────────────────────────────────────────────────┐
│ Evidence & Documentation                                 │
│                                                          │
│ Attach evidence and finalize compliance narratives for   │
│ auditor review. {X} of {Y} controls have evidence linked.│
└──────────────────────────────────────────────────────────┘
```

**Completion Checklist Card**
```
┌──────────────────────────────────────────────────────────┐
│ COMPLETION CHECKLIST                                     │
├──────────────────────────────────────────────────────────┤
│ ☑ {X} of {Y} controls have evidence linked               │
│ ☑ {X} of {Y} controls have narratives                    │
│ ☐ {X} of {Y} controls marked "Implemented"              │
│ ☑ All assigned controls reviewed                         │
│                                                          │
│ Progress: ████████████░░░░░ 75%                          │
│                                                          │
│ ℹ️ You can submit even if items are incomplete. Unchecked│
│    items will be flagged for follow-up.                  │
└──────────────────────────────────────────────────────────┘
```

**Segregated Views (Tabs or Accordions)**

### Tab 1: Controls Without Evidence
```
┌──────────────────────────────────────────────────────────┐
│ [Without Evidence (5)  ]  [Missing Narratives (2)  ]    │
│ [All Controls        ]                                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ AC-3 Access Control Enforcement                          │
│ Status: Implemented · Owner: Jane Smith                  │
│                                                          │
│ Evidence:                                                │
│ ➕ [ Add Evidence Link ]                                 │
│                                                          │
│ Narrative:                                               │
│ [Textarea]                                               │
│ [ Save ]                                                 │
├──────────────────────────────────────────────────────────┤
│ AU-1 Audit and Accountability Policy                     │
│ Status: In Progress · Owner: Bob Chen                    │
│                                                          │
│ Evidence:                                                │
│ ✓ Policy Document: SEC-AU-001.pdf                        │
│ [Edit] [Remove]                                          │
│ ➕ [ Add Evidence Link ]                                 │
│                                                          │
│ Narrative:                                               │
│ [Textarea]                                               │
│ [ Save ]                                                 │
└──────────────────────────────────────────────────────────┘
```

**Per-Control Evidence Block:**
- **Control ID + Name**
- **Status + Owner** (read-only, from Step 2)
- **Evidence Section:**
  - List of existing evidence: Icon + Type + URL/Description
  - Edit/Remove buttons per item
  - "+ Add Evidence Link" button (opens modal or inline form)
- **Narrative Section:**
  - Textarea (pre-filled from Step 2 if provided)
  - [ Save ] button

### Evidence Add Modal / Inline
```
┌────────────────────────────────────────┐
│ Add Evidence Reference                 │
├────────────────────────────────────────┤
│ Type:                                  │
│ [Policy            ▼]                  │
│                                        │
│ Reference (URL or Description):        │
│ [https://wiki/AC-POL-001              ] │
│                                        │
│ Access Location:                       │
│ ( ) SharePoint  ( ) Confluence         │
│ ( ) Google Drive ( ) URL / Link        │
│ ( ) File Upload  (✓) Text Description │
│                                        │
│ ℹ️ Keep links current. Auditors may    │
│    verify live artifacts.              │
│                                        │
│          [ Cancel ]  [ Save Evidence ] │
└────────────────────────────────────────┘
```

**Evidence Field Types:**
- **Type:** Dropdown (Policy, Procedure, Screenshot, Log, Ticket, Interview, Other)
- **Reference:** Text input
  - If "URL/Link" selected: show URL field
  - If "File Upload" selected: show file chooser
  - If "Text" selected: show textarea for description
- **Access Location:** Radio buttons (SharePoint, Confluence, Google Drive, External URL, Uploaded File, Other)

### Tab 2: Missing Narratives
```
[Shows only controls with no Implementation Narrative]
Same layout as above, but focusing on Narrative field.
```

### Tab 3: All Controls
```
[Shows all controls with evidence + narrative summary]

AC-1 Access Control Policy
✓ Evidence: 2 items · Narrative: ✓
├─ Policy Document: AC-POL-001.pdf
├─ Approval Memo: AC-APPROVAL-2026.docx

AC-2 Account Management
✓ Evidence: 1 item · Narrative: ✓
├─ Procedure: AC-PROC-002.pdf

AC-3 Access Control Enforcement
✗ Evidence: 0 items · Narrative: ✗ (missing)
├─ ➕ Add Evidence
```

**Summary View** — Compact table showing:
- Control ID + Name
- Evidence indicator: ✓ / ✗ + count
- Narrative indicator: ✓ / ✗
- Expand to edit (click row)

### Data Read

- `state.controlStatus[ctrlId]` — { status, evidence[], narrative }
- `state.controlOwners[ctrlId]`
- `getActiveControls()`

### Data Written

- `state.controlStatus[ctrlId].evidence[].ref` — refined evidence URLs/descriptions
- `state.controlStatus[ctrlId].narrative` — compliance narrative
- `state.controlStatus[ctrlId].evidence[].location` — where evidence is stored (optional metadata)

### Empty State

If all controls have evidence and narratives:
```
┌──────────────────────────────────────────────────────────┐
│                     ✅ Complete                           │
│                                                          │
│ All controls have evidence attached and narratives       │
│ documented. You're ready to submit.                      │
│                                                          │
│              [ Proceed to Step 4 → ]                     │
└──────────────────────────────────────────────────────────┘
```

### Validation Rules

**Step 3 → Step 4 Advancement:**
- No blocking validation
- **Warning if:**
  - Any control marked "Implemented" has 0 evidence items
  - Any control has 0 narrative text
  - More than 20% of controls have missing evidence
- **Toast message:** "⚠️ {N} controls are missing evidence/narratives. You can still proceed; they'll be flagged in submission."

### Helper Text

| Section | Text |
|---------|------|
| Completion Checklist | "You can submit even if items are incomplete. Unchecked items will be flagged for follow-up." |
| Evidence Add | "Keep links current. Auditors may verify live artifacts during review." |
| Narrative Field | "Explain how this control satisfies the NIST requirement. Use clear, specific language." |

### Footer Buttons

| Button | Label | State | Action |
|--------|-------|-------|--------|
| Left | Previous | Enabled | Go to Step 2 |
| Center-Left | Save Draft | Enabled | Save state.controlStatus |
| Center-Right | Next | Enabled | Advance to Step 4 |
| Right | Exit | Enabled | Close wizard, return to tab landing |

---

## Step 4 — Attestation & Submit

### Purpose
Final review + digital attestation. Control Owner confirms implementation and submits to CISO.

### Layout Description

**Header Summary Section**
```
┌──────────────────────────────────────────────────────────┐
│ SUBMISSION SUMMARY                                       │
├──────────────────────────────────────────────────────────┤
│ Total Controls: {N}                                      │
│ Implemented: {N} (█████████░░░ {X}%) · In Progress: {N} │
│ Not Started: {N} · Not Applicable: {N}                  │
│                                                          │
│ Evidence Linked: {N} of {total} controls                 │
│ Narratives Completed: {N} of {total} controls           │
└──────────────────────────────────────────────────────────┘
```

**Per-Family Summary (Collapsible)**
```
╔══════════════════════════════════════════════════════════╗
║ AC — Access Control                       ██████████░ 80%║ ← Click to expand
╟──────────────────────────────────────────────────────────╢
║ 10 controls · 8 Implemented · 1 In Progress · 1 Not Start║
║                                                          ║
║ AC-1 Access Control Policy           ✓ Implemented       ║
║ AC-2 Account Management              ✓ Implemented       ║
║ AC-3 Access Control Enforcement      ✓ Implemented       ║
║ AC-4 Information Flow Enforcement    ◐ In Progress       ║
║ AC-5 Separation of Duties            ✓ Implemented       ║
║ ...                                                      ║
╚══════════════════════════════════════════════════════════╝
```

**Completion Checklist Card**
```
┌──────────────────────────────────────────────────────────┐
│ BEFORE YOU SUBMIT                                        │
├──────────────────────────────────────────────────────────┤
│ ☑ Reviewed all assigned controls in Steps 1–3            │
│ ☑ Set status for each control                           │
│ ☑ Provided implementation approach or narrative         │
│ ☑ Linked at least one evidence item per "Implemented"   │
│ ☑ Read and accept the attestation statement below        │
│                                                          │
│ ℹ️ This submission will be sent to your CISO for audit   │
│    review. You can update status and evidence after      │
│    submission if needed.                                 │
└──────────────────────────────────────────────────────────┘
```

**Attestation Section**
```
┌──────────────────────────────────────────────────────────┐
│ DIGITAL ATTESTATION                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ I confirm that:                                          │
│                                                          │
│ 1. The above control implementation status is accurate   │
│    and complete to the best of my knowledge.             │
│                                                          │
│ 2. The evidence and documentation provided are           │
│    authentic, current, and accessible to auditors.       │
│                                                          │
│ 3. I am the responsible owner or authorized              │
│    representative for these controls.                    │
│                                                          │
│ ☐ I agree to this attestation and authorize submission. │
│                                                          │
│ Attestation Date: {today's date}                         │
│ Attested by: {current user name}                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Checkbox** — Must be checked before Submit button is enabled
- **Unchecked:** Button disabled + message "Check the box to proceed"
- **Checked:** Button enabled

**Action Buttons**
```
┌──────────────────────────────────────────────────────────┐
│ [ Cancel Submission ]     [ ✓ Submit to CISO ]           │
└──────────────────────────────────────────────────────────┘
```

### Success State (Post-Submit Modal)
```
┌────────────────────────────────────────────────────────┐
│                        ✅                              │
│                                                        │
│  Submitted Successfully                                │
│                                                        │
│  Your control implementation documentation has been   │
│  submitted to {CISO name} for audit review.            │
│                                                        │
│  Summary:                                              │
│  • 23 of 30 controls implemented (77%)                 │
│  • All assigned controls reviewed                      │
│  • Evidence and narratives attached                    │
│                                                        │
│  What happens next:                                    │
│  1. CISO reviews your submission (typically 1-2 weeks) │
│  2. Audit team may request clarifications or evidence  │
│  3. You'll receive notification of review status       │
│  4. Final audit report will be shared                  │
│                                                        │
│          [ Return to Control Tab ]                     │
└────────────────────────────────────────────────────────┘
```

After close:
- Redirect to Step 1 (My Controls Dashboard)
- Show toast: "✅ Submitted to CISO — 23 of 30 controls (77%) implemented."
- Update table to show submission status (optional: show "Submitted" date column)

### Data Read

- `state.controlStatus` — all controls with implementation status
- `getActiveControls()` — for summary counts
- `state.baseline`, baseline counts
- Current user name / email (from session or form input)
- Current date

### Data Written

- `state.controlSubmissionDate` — new Date().toLocaleDateString()
- `state.controlAttestationDate` — new Date().toLocaleDateString()
- `state.attestedBy` — current user name
- Optionally flag `state.controlStatus.submitted = true` per control

### Empty State

(Should not occur — user gets here from Step 3 which has content)

### Validation Rules

**Attestation Checkbox Required**
- If unchecked: Submit button disabled, show hint "☐ Check the box above to enable submission"
- If checked: Submit button enabled

**Before Advancing from Step 3 to Step 4:**
- No hard blocks, but **strongly recommend:**
  - All controls have status != "Not Started" (warning toast)
  - All "Implemented" controls have ≥1 evidence item (warning toast)

**On Submit Click:**
- Validate checkbox is checked
- If not: shake button, show inline error "Please confirm the attestation statement"
- If valid: Show success modal, save submission metadata, redirect to Step 1

### Helper Text & Tooltips

| Section | Text |
|---------|------|
| Before You Submit | "This submission will be sent to your CISO for audit review. You can update status and evidence after submission if needed." |
| Digital Attestation | "Your attestation confirms accuracy and responsibility. This is a formal declaration for audit purposes." |
| What Happens Next | "The CISO will review within 1-2 weeks and may request additional evidence or clarification." |

### Footer Buttons

| Button | Label | State | Action |
|--------|-------|-------|--------|
| Left | Previous | Enabled | Go to Step 3 |
| Center-Left | Save Draft | Enabled | Save state (no submission) |
| Center-Right | Submit to CISO | Conditional (enabled if attestation checked) | Trigger submit flow |
| Right | Exit | Enabled | Close wizard, return to tab landing (unsaved changes warning) |

---

## State Object: New Fields Required

Add to `const state = { }` in app code:

```javascript
// ─── Control Owner Implementation Data ───
controlStatus: {},              // { 'AC-1': { status, approach, narrative, evidence[], notes, submitted? } }
controlOwners: {},              // { 'AC-1': { name, role, email, dueDate } }
// (Already exists from Policy Owner assignment flow)

// ─── Control Owner Wizard Navigation ───
_controlWizardMode: false,      // true = wizard open, false = list view
_selectedCtrl: null,            // currently selected control ID in Step 2
_controlOwnerFilter: '',        // optional: filter by assigned owner name

// ─── Control Owner Submission State ───
controlSubmissionDate: '',      // when controls were submitted (YYYY-MM-DD)
controlAttestationDate: '',     // when attestation was signed (YYYY-MM-DD)
attestedBy: '',                 // name/email of person who attested
controlSubmissionStatus: {},    // { 'AC-1': 'Submitted' | 'In Review' | 'Returned' }
```

---

## Helper Functions to Implement

```javascript
// Navigation
function enterControlWizard()
  // Set _controlWizardMode = true, show Step 1, render wizard chrome

function exitControlWizard()
  // Set _controlWizardMode = false, return to Control tab landing

function goToControlStep(stepNumber)
  // Set currentStep.control = stepNumber, re-render entire Step

// Step 2: Implementation
function selectControlDetail(ctrlId)
  // Set state._selectedCtrl = ctrlId, re-render form on right

function setCtrlStatus(ctrlId, status)
  // state.controlStatus[ctrlId].status = status

function setCtrlField(ctrlId, field, value)
  // state.controlStatus[ctrlId][field] = value

function addCtrlEvidence(ctrlId)
  // Push new empty evidence object to state.controlStatus[ctrlId].evidence[]

function removeCtrlEvidence(ctrlId, index)
  // Remove evidence item at index

function setEvidenceField(ctrlId, idx, field, value)
  // state.controlStatus[ctrlId].evidence[idx][field] = value

// Step 3: Evidence refinement
function getControlsWithoutEvidence()
  // Filter controls where evidence.length === 0 and status !== 'Not Applicable'

function getControlsWithoutNarrative()
  // Filter controls where narrative.trim().length === 0

// Step 4: Submission
function submitControlImplementation()
  // Validate attestation checkbox, save submission date, show success modal

function downloadControlReport()
  // Generate PDF or CSV of all controls + status + evidence refs
```

---

## Domain Grouping Logic

**Scenario:** A Control Owner (e.g., "IAM Director") is assigned controls from multiple families (AC + IA merged under CISO Step 4's merge feature).

**Handling in Step 1 Dashboard:**

Option A: **Group by Family** (Recommended)
```
┌─────────────────────────────────────────────────────┐
│ AC — Access Control (8 controls)                    │
│ ✓ Start Implementing AC Controls                    │
├─────────────────────────────────────────────────────┤
│ IA — Identification & Authentication (6 controls)  │
│ ✓ Start Implementing IA Controls                    │
└─────────────────────────────────────────────────────┘
```

- Show family-level cards with control counts and quick-start buttons
- Each family group shows:
  - Family code + full name
  - Count of controls in family
  - Count by status (X Implemented, Y In Progress, Z Not Started)
  - Collapsible table of controls within family
  - "Start Implementing {Family}" button → opens Step 2 filtered to that family

Option B: **All Controls in One List** (Simpler)
- Single table with all controls from all families
- Family column shows which domain each belongs to
- Filter dropdown lets user isolate to one family

**Recommended:** Option A (family cards) — mirrors Policy Owner's natural workflow of thinking in families, makes dashboard easier to scan for users with 20+ controls across multiple families.

**In Step 2 List:** Show only controls assigned to this Control Owner. If multiple families, show family badge on each item.

---

## Keyboard Shortcuts & Accessibility

| Shortcut | Action | Context |
|----------|--------|---------|
| Tab | Next field / row | All |
| Shift+Tab | Previous field / row | All |
| Arrow Up / Down | Navigate control list | Step 2 list |
| Enter | Select control | Step 2 list |
| Ctrl+S / Cmd+S | Save Draft | All |
| Escape | Close modals | Evidence add modal |

**ARIA Labels:**
- All form inputs have `aria-label` or explicit labels
- Status dropdowns announce selected value
- Evidence list announces: "Evidence item 1 of 3"
- Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Attestation checkbox has role="checkbox" and aria-checked state

---

## Validation Summary

| Step | Field | Rule | Blocking | Feedback |
|------|-------|------|----------|----------|
| 1 | — | No validation | No | Optional: warn if 0 controls assigned |
| 2 | Status | Default to "Not Started" | No | Optional: suggest if Status="Implemented" and Approach empty |
| 2 | Approach | Optional | No | Tooltip: "Consider adding for audit readiness" |
| 2 | Evidence | Optional | No | Soft warn if Status="Implemented" and 0 evidence |
| 3 | Evidence | Optional | No | Warn toast: "{N} controls missing evidence" |
| 3 | Narrative | Optional | No | Warn toast: "{N} controls missing narrative" |
| 4 | Attestation Checkbox | **Required** | **Yes** | "Check the box to proceed" if unchecked |

---

## Comparison to Policy Owner Wizard

| Aspect | Policy Owner | Control Owner |
|--------|--------------|---------------|
| **Step 1** | Review & Custodian (metadata) | My Controls Dashboard (status overview) |
| **Step 2** | Control Selection (which controls) | Implement Controls (how to implement) |
| **Step 3** | Document Policy (write policy doc) | Evidence & Documentation (attach proof) |
| **Step 4** | Assign Control Owners (to individuals) | Attestation & Submit (final sign-off) |
| **Duration** | 30-45 min | 60-90 min (1 control per 5-10 min) |
| **Frequency** | Once per domain per year | Rolling (as controls are assigned) |
| **Output** | Domain policy document | Control implementation proof (evidence) |

---

## Empty States Summary

| Step | Trigger | Message | CTA |
|------|---------|---------|-----|
| 1 | No baseline selected | "CISO Setup Required" | Go to CISO Setup |
| 1 | Baseline selected, 0 controls assigned | "No Controls Assigned" | "Check with your Policy Owner" |
| 2 | Control list open, no control selected | "Select a control from the list" | Click list item |
| 3 | All controls have evidence + narratives | "✅ Complete — ready to submit" | Proceed to Step 4 |
| 4 | (Should not occur) | N/A | N/A |

---

## File References

- **State object location:** Line ~1938 in js/app.js
- **Existing control steps:** Lines 4049–4537 (renderControlStep1/2/3)
- **Policy Owner pattern (reference):** Lines 3321–3867 (renderPolicyStep1/2/3/4)
- **CISO Step 4 (domain merging logic):** Lines 2886–3070 (renderCISOStep4)

---

## Implementation Notes for Developer

1. **Reuse existing CSS classes:** .form-label, .form-input, .form-select, .btn, .chip, .family-badge, .control-id, .table-scroll, .empty-state
2. **Color palette:** Consistent with Policy/CISO tabs (--teal, --navy, --red, --green, --amber, --gray)
3. **Progress tracking:** Show % on header and in Step 1 dashboard (match CISO Step 4 and Policy Step 4 patterns)
4. **Save Draft:** Throttle to once per 30 seconds to avoid excessive localStorage writes
5. **Responsive:** Wizard should work on 1366px+ width; collapse left panels on smaller screens
6. **Undo/Recovery:** localStorage auto-save allows recovery if page accidentally closed during wizard (show "Resume wizard?" prompt on tab open)

