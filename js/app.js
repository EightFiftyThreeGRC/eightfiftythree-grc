// js/app.js — application logic (load after js/core.js).

/** Render HTML list for the audit trail panel; filterCat null = all categories. */
function renderAuditTrail(filterCat) {
  var entries = (state.auditTrail || []).slice().reverse();
  if (filterCat) {
    entries = entries.filter(function(e) { return (e.cat || e.category) === filterCat; });
  }
  if (!entries.length) {
    return '<div style="font-size:12px;color:var(--text-muted);padding:12px;">No activity logged yet.</div>';
  }
  return entries.slice(0, 200).map(function(e) {
    var cat = escapeHTML(e.cat || e.category || 'program');
    var msg = escapeHTML(e.msg || e.message || '');
    var t = (e.t || e.at || '').toString().slice(0, 19).replace('T', ' ');
    return '<div style="font-size:12px;border-bottom:1px solid #f1f5f9;padding:8px 0;">'
      + '<span style="color:var(--text-muted);font-size:11px;">' + escapeHTML(t) + '</span> '
      + '<span style="font-weight:600;color:var(--navy);">' + cat + '</span> '
      + '<span style="color:var(--text);">' + msg + '</span></div>';
  }).join('');
}

function trimDisplay(val, max) {
  max = max || 120;
  var s;
  try { s = typeof val === 'string' ? val : JSON.stringify(val); } catch (e2) { s = String(val); }
  if (s.length > max) return s.slice(0, max) + '…';
  return s;
}

function renderChangeLogTableHtml() {
  var userQ = (state._changeLogUserFilter || '').toLowerCase();
  var dateQ = (state._changeLogDateFilter || '').trim();
  var rows = (state.changeLog || []).slice().reverse().filter(function(e) {
    if (userQ && String(e.u || '').toLowerCase().indexOf(userQ) === -1) return false;
    if (dateQ && String(e.t || '').indexOf(dateQ) === -1) return false;
    return true;
  }).slice(0, 500);
  if (!rows.length) {
    return '<div style="font-size:12px;color:var(--text-muted);padding:12px;">No field-level changes match these filters (or none logged yet).</div>';
  }
  var head = '<table class="control-table" style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:#f8fafc;">'
    + '<th style="padding:8px;text-align:left;width:150px;">Time</th>'
    + '<th style="padding:8px;text-align:left;width:120px;">User</th>'
    + '<th style="padding:8px;text-align:left;">Path</th>'
    + '<th style="padding:8px;text-align:left;width:28%;">Before</th>'
    + '<th style="padding:8px;text-align:left;width:28%;">After</th>'
    + '</tr></thead><tbody>';
  var body = rows.map(function(e) {
    var t = (e.t || '').toString().slice(0, 19).replace('T', ' ');
    var o = trimDisplay(e.o, 80);
    var n = trimDisplay(e.n, 80);
    return '<tr style="border-bottom:1px solid #f1f5f9;">'
      + '<td style="padding:8px;vertical-align:top;color:var(--text-muted);">' + escapeHTML(t) + '</td>'
      + '<td style="padding:8px;vertical-align:top;font-weight:600;">' + escapeHTML(String(e.u || '')) + '</td>'
      + '<td style="padding:8px;vertical-align:top;font-family:monospace;font-size:10px;word-break:break-all;">' + escapeHTML(String(e.p || '')) + '</td>'
      + '<td style="padding:8px;vertical-align:top;color:#991b1b;word-break:break-word;" title="' + escapeHTML(trimDisplay(e.o, 400)) + '">' + escapeHTML(o) + '</td>'
      + '<td style="padding:8px;vertical-align:top;color:#166534;word-break:break-word;" title="' + escapeHTML(trimDisplay(e.n, 400)) + '">' + escapeHTML(n) + '</td>'
      + '</tr>';
  }).join('');
  return head + body + '</tbody></table>';
}

function syncAuditTrailPanelContent() {
  var el = document.getElementById('auditTrailContent');
  if (!el) return;
  if (state._auditTrailUiMode === 'fields') {
    el.innerHTML = renderChangeLogTableHtml();
  } else {
    var cat = state._auditTrailEventCatFilter === 'all' ? null : state._auditTrailEventCatFilter;
    el.innerHTML = renderAuditTrail(cat);
  }
}

function setAuditTrailUiMode(mode) {
  state._auditTrailUiMode = mode === 'fields' ? 'fields' : 'events';
  renderAuditTrailPanel();
}

function setChangeLogUserFilter(val) {
  state._changeLogUserFilter = val;
  syncAuditTrailPanelContent();
}

function setChangeLogDateFilter(val) {
  state._changeLogDateFilter = val;
  syncAuditTrailPanelContent();
}


// ============================================================
// HELPERS
// ============================================================

// NIST SP 800-53B Rev. 5 authoritative baseline counts (verified against official Excel)
// Source: sp800-53b-control-baselines.xlsx  |  PT family excluded from this tool's scope

// Evidence guidance per control family (for Control Owner step 2 help panel)
const CTRL_STATEMENTS = {
  'AC-1': 'Develop, document, and disseminate access control policies and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination, and compliance.',
  'AC-2': 'Manage information system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts; and notifying account managers of changes.',
  'AC-3': 'Enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.',
  'AC-17': 'Establish usage restrictions, configuration/connection requirements, and implementation guidance for remote access; and authorize remote access prior to allowing connections.',
  'AU-2': 'Determine the types of events that the system is capable of logging in support of the audit function and coordinate the event logging function with other organizations.',
  'AU-11': 'Retain audit records for a defined period to provide support for after-the-fact investigations of security incidents.',
  'CA-7': 'Develop a system-level continuous monitoring strategy and implement a continuous monitoring program.',
  'CM-2': 'Develop, document, and maintain a current baseline configuration of the information system.',
  'CM-6': 'Establish and document configuration settings for information technology products that reflect the most restrictive mode consistent with operational requirements.',
  'CM-7': 'Configure the system to provide only essential capabilities; prohibit or restrict the use of functions, ports, protocols, and services not required.',
  'CP-9': 'Conduct backups of user-level and system-level information contained in the information system and protect the confidentiality, integrity, and availability of backup information.',
  'IA-2': 'Uniquely identify and authenticate organizational users and associate that unique identification with processes acting on behalf of those users.',
  'IA-5': 'Manage information system authenticators (e.g., passwords, tokens, biometrics) by verifying identity of individuals prior to distribution, establishing initial authenticator content, and protecting content from unauthorized disclosure.',
  'IR-4': 'Implement an incident handling capability for security incidents including preparation, detection, analysis, containment, eradication, and recovery.',
  'MP-6': 'Sanitize information system media, both digital and non-digital, prior to disposal, release out of organizational control, or release for reuse.',
  'PE-2': 'Develop, approve, and maintain a list of individuals with authorized access to the facility where the information system resides.',
  'PL-2': 'Develop a security plan for the information system that describes the security requirements for the system and the security controls in place or planned for meeting those requirements.',
  'PS-3': 'Screen individuals prior to authorizing access to organizational information and information systems.',
  'RA-3': 'Conduct assessments of the risk to organizational operations, assets, individuals, and other organizations, resulting from the operation of information systems.',
  'RA-5': 'Scan for vulnerabilities in the information system and hosted applications periodically and when new vulnerabilities potentially affecting the system are identified.',
  'SA-9': 'Require external information system service providers to comply with organizational information security requirements and employ security controls in accordance with applicable laws, directives, regulations, standards, guidelines, and organizational mission/business requirements.',
  'SC-28': 'Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of information at rest on digital media.',
  'SC-8': 'Implement cryptographic mechanisms to prevent unauthorized disclosure of information during transmission unless otherwise protected by alternative physical safeguards.',
  'SI-2': 'Identify, report, and correct information system flaws; test software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation.',
  'SI-3': 'Employ malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code.',
};
const FAMILY_EVIDENCE_GUIDANCE = {
  AC: { label:'Access Control', type:'Preventive / Administrative', evidence:['Policy Document: Access control policy & procedures','Configuration: IAM system screenshots (AD, Okta, Azure AD)','Report: Quarterly user access review records','Configuration: Role/permission matrix','Log: Privileged access audit log excerpts'] },
  AT: { label:'Awareness & Training', type:'Preventive / Administrative', evidence:['Report: Security awareness training completion records','Policy Document: Training curriculum & acceptable use policy','Report: Phishing simulation results with metrics','Log: LMS training completion attestations','Interview notes: Evidence of training delivery & assessment'] },
  AU: { label:'Audit & Accountability', type:'Detective / Technical', evidence:['Configuration: SIEM configuration screenshots','Log: Audit log samples (anonymized)','Policy Document: Log retention & protection policy','Configuration: Alerting rules & monitoring thresholds','Report: Log integrity check results'] },
  CA: { label:'Assessment, Authorization & Monitoring', type:'Detective / Administrative', evidence:['Policy Document: System Security Plan (SSP)','Report: Authorization to Operate (ATO) letter','Policy Document: Continuous monitoring strategy','Report: Vulnerability assessment reports (within 12 months)','Report: POA&M tracking & remediation status'] },
  CM: { label:'Configuration Management', type:'Preventive / Technical', evidence:['Policy Document: Configuration management policy & baseline standards','Configuration: Baseline configuration documentation','Report: Change management ticket samples (last 90 days)','Configuration: CMDB / asset inventory snapshot','Report: Configuration compliance scan results'] },
  CP: { label:'Contingency Planning', type:'Corrective / Administrative', evidence:['Policy Document: Business Continuity & Disaster Recovery plans','Report: DR/BC test results with after-action review','Log: Backup verification & integrity check logs','Policy Document: RTO/RPO requirements & SLA documentation','Interview notes: Evidence of plan maintenance & stakeholder testing'] },
  IA: { label:'Identification & Authentication', type:'Preventive / Technical', evidence:['Configuration: MFA enrollment & settings screenshot','Policy Document: Password & authentication policy','Configuration: Identity provider (LDAP/SAML) configuration','Report: Privileged account inventory & periodic attestation','Log: Authentication log samples'] },
  IR: { label:'Incident Response', type:'Corrective / Administrative', evidence:['Policy Document: Incident Response Plan & procedures','Report: Incident handling records (redacted, last 12 months)','Report: IR tabletop exercise or simulation results','Policy Document: Escalation procedures & contact list','Interview notes: Evidence of IR team training & drills'] },
  MA: { label:'Maintenance', type:'Preventive / Administrative', evidence:['Policy Document: System maintenance & vendor management policy','Log: Maintenance work orders & activity logs','Policy Document: Remote access authorization & monitoring controls','Report: Approved vendor list & security assessments','Configuration: Maintenance window scheduling & change control records'] },
  MP: { label:'Media Protection', type:'Preventive / Physical', evidence:['Policy Document: Media handling, classification & sanitization policy','Report: Certificates of Destruction (CoD) or sanitization records','Configuration: Encryption configuration for data at rest','Procedure: Media destruction procedures & vendor contracts','Interview notes: Evidence of media labeling & tracking'] },
  PE: { label:'Physical & Environmental Protection', type:'Preventive / Physical', evidence:['Log: Facility access log excerpts (last 90 days)','Configuration: Badge reader configuration & access list','Log: Visitor log samples','Configuration: CCTV / environmental monitoring records','Policy Document: Physical security policy & procedures'] },
  PL: { label:'Planning', type:'Administrative', evidence:['Policy Document: System Security Plan (SSP)','Report: Privacy Impact Assessment (if applicable)','Policy Document: Rules of Behavior (signed acknowledgments)','Procedure: Security architecture & data flow diagrams','Report: System boundary documentation'] },
  PM: { label:'Program Management', type:'Administrative', evidence:['Policy Document: Information security program charter & policy framework','Report: Risk management strategy & annual risk assessment','Report: Enterprise architecture & security program roadmap','Report: Security program status reports (quarterly or annual)','Interview notes: Steering committee meeting minutes & governance records'] },
  PS: { label:'Personnel Security', type:'Preventive / Administrative', evidence:['Policy Document: Background check & personnel security policy','Report: Background check authorization records','Procedure: Termination/separation security procedures','Policy Document: NDA & acceptable use agreements (signed samples)','Report: Annual personnel security training completion records'] },
  PT: { label:'PII Processing & Transparency', type:'Preventive / Administrative', evidence:['Policy Document: Privacy notice, policy & PII handling procedures','Report: Consent management records (if applicable)','Report: PII inventory & data map documentation','Report: Privacy Threshold Analysis (PTA) or equivalent','Log: Individual rights request log (redacted samples)'] },
  RA: { label:'Risk Assessment', type:'Detective / Administrative', evidence:['Report: Current risk assessment report (annual or per-system)','Report: Vulnerability scan reports with remediation tracking','Report: Threat modeling documentation or results','Report: Risk register with identified risks & mitigation plans','Report: Risk acceptance memos for residual risks'] },
  SA: { label:'System & Services Acquisition', type:'Preventive / Administrative', evidence:['Policy Document: Software acquisition & vendor selection policy','Report: Vendor security assessments or compliance checks','Report: Secure SDLC documentation (if software developed in-house)','Report: License management & compliance audit records','Policy Document: Third-party contract security clauses & SLAs'] },
  SC: { label:'System & Communications Protection', type:'Preventive / Technical', evidence:['Procedure: Network architecture & segmentation diagram','Configuration: Firewall rule review & validation records','Configuration: Encryption-in-transit configuration (TLS/IPSec)','Report: TLS certificate inventory & validation status','Report: Network/port scan results (validated configuration)'] },
  SI: { label:'System & Information Integrity', type:'Detective / Technical', evidence:['Report: Patch management policy & monthly patch deployment reports','Configuration: Anti-malware deployment & threat definition status','Log: File Integrity Monitoring (FIM) log samples & alerts','Report: Vulnerability management metrics & remediation records','Configuration: Intrusion Detection/Prevention system configuration & alerts'] },
  SR: { label:'Supply Chain Risk Management', type:'Preventive / Administrative', evidence:['Report: Vendor risk assessment records & periodic reviews','Policy Document: Supply chain risk management policy & procedures','Report: Approved supplier/vendor list with security ratings','Report: Software Bill of Materials (SBOM) for acquired software','Report: Third-party audit reports (SOC 2, ISO 27001, FedRAMP)'] },
};

function baselineCount(bl) {
  return BASELINE_COUNTS[bl] || 0;
}

function pillsHTML(bl) {
  return bl.map(b => {
    const cls = b==='L'?'pill-l':b==='M'?'pill-m':b==='H'?'pill-h':'pill-p';
    const lbl = b==='L'?'Low':b==='M'?'Mod':b==='H'?'High':'Privacy';
    return `<span class="baseline-pill ${cls}">${lbl}</span>`;
  }).join('');
}

// Returns a single pill for the minimum baseline where a control is first required.
// bl=[] = catalog control, not assigned to any baseline.
function minBaselinePill(bl) {
  if (!bl || bl.length === 0) return '<span class="baseline-pill" style="background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;" title="NIST 800-53 catalog — not assigned to any baseline">CATALOG</span>';
  if (bl.includes('L')) return '<span class="baseline-pill pill-l" title="Required in Low, Moderate, and High baselines">LOW+</span>';
  if (bl.includes('M')) return '<span class="baseline-pill pill-m" title="Required in Moderate and High baselines">MOD+</span>';
  if (bl.includes('H')) return '<span class="baseline-pill pill-h" title="Required in High baseline only">HIGH</span>';
  if (bl.includes('P')) return '<span class="baseline-pill pill-p" title="Privacy baseline">PRIVACY</span>';
  return '<span class="baseline-pill" style="background:#f1f5f9;color:#64748b;">CATALOG</span>';
}

function chipHTML(status) {
  const map = {
    'Implemented': 'chip-green', 'Planned': 'chip-amber',
    'Not Started': 'chip-red', 'Not Applicable': 'chip-gray',
    'In Progress': 'chip-blue', 'In Review': 'chip-blue', 'Live': 'chip-green',
    'Pass': 'chip-green', 'Fail': 'chip-red', 'Partial': 'chip-amber',
    'Draft': 'chip-blue', 'Approved': 'chip-green', 'Under Review': 'chip-amber',
    'Attested': 'chip-green', 'Pending': 'chip-amber',
    'Returned': 'chip-red'
  };
  return `<span class="chip ${map[status]||'chip-gray'}">${status||'—'}</span>`;
}

// ============================================================
// POLICY REVIEW CYCLE TRACKING
// ============================================================
// Returns { status:'current'|'approaching'|'overdue'|'unset', color, bg, border, label, daysUntil }
function getReviewStatus(policyKey) {
  var rc = (state.policyReviewCycle || {})[policyKey];
  if (!rc || !rc.nextReviewDue) return { status:'unset', color:'#64748b', bg:'rgba(100,116,139,0.06)', border:'rgba(100,116,139,0.2)', label:'No review date set', daysUntil: null };
  var today = new Date(); today.setHours(0,0,0,0);
  var due = new Date(rc.nextReviewDue + 'T00:00:00');
  var diff = Math.ceil((due - today) / 86400000);
  if (diff < 0) return { status:'overdue', color:'#dc2626', bg:'rgba(220,38,38,0.06)', border:'rgba(220,38,38,0.3)', label:'Overdue by ' + Math.abs(diff) + ' day' + (Math.abs(diff)===1?'':'s'), daysUntil: diff };
  if (diff <= 60) return { status:'approaching', color:'#d97706', bg:'rgba(217,119,6,0.06)', border:'rgba(217,119,6,0.3)', label:'Due in ' + diff + ' day' + (diff===1?'':'s'), daysUntil: diff };
  return { status:'current', color:'#16a34a', bg:'rgba(22,163,74,0.06)', border:'rgba(22,163,74,0.3)', label:'Current — due in ' + diff + ' days', daysUntil: diff };
}

function reviewStatusDot(policyKey) {
  var rs = getReviewStatus(policyKey);
  var dotColor = rs.status === 'current' ? '#16a34a' : rs.status === 'approaching' ? '#d97706' : rs.status === 'overdue' ? '#dc2626' : '#94a3b8';
  return '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + dotColor + ';margin-right:6px;" title="' + rs.label + '"></span>';
}

// Toggle custom approver visibility — no innerHTML swap, just show/hide a pre-rendered div.
// This avoids ALL onchange/DOM timing issues: the custom fields are always in the DOM,
// the checkbox just controls their display:none/block.
function toggleCustomApprover(policyKey, checkbox) {
  if (!state.policyReviewCycle) state.policyReviewCycle = {};
  if (!state.policyReviewCycle[policyKey]) state.policyReviewCycle[policyKey] = {};
  var rc = state.policyReviewCycle[policyKey];
  var isCustom = checkbox.checked;
  rc._customApprover = isCustom;
  if (!isCustom) {
    // Domain policies are drafted by the ISSM but formally approved by the program owner (CISO) unless "Different approver" is used.
    rc.approvedBy = (state.programOwner || '').trim();
  } else {
    if (!rc.approvedBy) rc.approvedBy = '';
  }
  var customDiv = document.getElementById('custom-approver-' + policyKey);
  if (customDiv) customDiv.style.display = isCustom ? 'block' : 'none';
  window.markDirty && window.markDirty();
}

function renderReviewCycleCard(policyKey, label) {
  if (!state.policyReviewCycle) state.policyReviewCycle = {};
  if (!state.policyReviewCycle[policyKey]) state.policyReviewCycle[policyKey] = {};
  var rc = state.policyReviewCycle[policyKey];

  // Auto-populate sensible defaults the first time this card is rendered
  var today = new Date().toISOString().slice(0, 10);
  if (!rc.lastReviewed)   { rc.lastReviewed  = today; }
  if (!rc.nextReviewDue)  { var d = new Date(rc.lastReviewed + 'T00:00:00'); d.setFullYear(d.getFullYear() + 1); rc.nextReviewDue = d.toISOString().slice(0, 10); }
  if (!rc.approvalDate)   { rc.approvalDate  = today; }

  // Initialize default approver if not set (always program owner unless "Different approver")
  if (!rc.approvedBy && !rc._customApprover) {
    rc.approvedBy = (state.programOwner || '').trim();
  }

  // Legacy: domain cards used ISSM name as "Approved By" while the badge said Program Owner — realign to program owner when still the old mistaken value.
  if (policyKey !== 'ISP' && !rc._customApprover) {
    var domOwnNm = ((state.domainOwners || {})[policyKey] || {}).name;
    domOwnNm = domOwnNm ? String(domOwnNm).trim() : '';
    var poNm = (state.programOwner || '').trim();
    if (domOwnNm && poNm && (rc.approvedBy || '').trim() === domOwnNm && (rc.approvedBy || '').trim() !== poNm) {
      rc.approvedBy = poNm;
    }
  }

  // Default approver name shown in the badge (same as ISP: program owner / CISO)
  var defaultApproverName = (state.programOwner || '').trim();

  var rs = getReviewStatus(policyKey);
  var escKey = policyKey.replace(/'/g, "\\'");

  // Always render both the default badge and the custom fields — the checkbox
  // toggles display:none/block on the custom div. No innerHTML swap needed.
  var isCustom = !!rc._customApprover;
  var approverHTML = '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.2);border-radius:8px;font-size:12px;font-weight:600;color:var(--navy);">'
    + escapeHTML(defaultApproverName || 'CISO') + ' <span style="font-size:10px;color:#6366f1;font-weight:400;">(Program Owner)</span>'
    + '</div>'
    + '<label style="display:inline-flex;align-items:center;gap:6px;margin-top:6px;cursor:pointer;font-size:11px;color:var(--text-muted);">'
    + '<input type="checkbox" ' + (isCustom ? 'checked' : '') + ' style="accent-color:#6366f1;cursor:pointer;" onclick="toggleCustomApprover(\'' + escKey + '\', this)"> Different approver</label>'
    + '<div id="custom-approver-' + policyKey + '" style="display:' + (isCustom ? 'block' : 'none') + ';margin-top:8px;">'
    + '<div style="display:flex;gap:4px;">'
    + '<input class="form-input" style="font-size:12px;width:33%;" placeholder="Approver name" autocomplete="off" value="' + escapeHTML(rc.approvedBy||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].approvedBy=this.value; window.markDirty();">'
    + '<input class="form-input" style="font-size:12px;width:33%;" placeholder="Role (e.g. CIO)" autocomplete="off" value="' + escapeHTML(rc.approverRole||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].approverRole=this.value; window.markDirty();">'
    + '<input class="form-input" style="font-size:12px;width:33%;" placeholder="Email" autocomplete="off" value="' + escapeHTML(rc.approverEmail||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].approverEmail=this.value; window.markDirty();"></div>'
    + '</div>';

  return '<div style="border:1px solid ' + rs.border + ';border-radius:10px;padding:16px 18px;margin-bottom:16px;background:' + rs.bg + ';">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);display:flex;align-items:center;">' + reviewStatusDot(policyKey) + ' Policy Review Status — ' + label + '</div>'
    + '<span style="font-size:11px;font-weight:600;color:' + rs.color + ';background:white;border:1px solid ' + rs.border + ';padding:2px 10px;border-radius:12px;">' + rs.label + '</span>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    + '<div class="form-group" style="margin-bottom:0;">'
    + '<label class="form-label" style="font-size:11px;">Last Reviewed</label>'
    + '<input class="form-input" type="date" style="font-size:12px;" value="' + (rc.lastReviewed||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].lastReviewed=this.value; autoSetNextReview(\'' + escKey + '\');; window.markDirty();">'
    + '</div>'
    + '<div class="form-group" style="margin-bottom:0;">'
    + '<label class="form-label" style="font-size:11px;">Next Review Due</label>'
    + '<input class="form-input" type="date" style="font-size:12px;border-color:' + rs.color + ';" value="' + (rc.nextReviewDue||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].nextReviewDue=this.value;; window.markDirty();">'
    + '</div>'
    + '<div class="form-group" style="margin-bottom:0;">'
    + '<label class="form-label" style="font-size:11px;">Approved By</label>'
    + approverHTML
    + '</div>'
    + '<div class="form-group" style="margin-bottom:0;">'
    + '<label class="form-label" style="font-size:11px;">Approval Date</label>'
    + '<input class="form-input" type="date" style="font-size:12px;" value="' + (rc.approvalDate||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].approvalDate=this.value;; window.markDirty();">'
    + '</div>'
    + '</div>'
    + '<div style="font-size:10px;color:var(--text-muted);margin-top:10px;">NIST 800-53 requires policies be reviewed at least annually. Auditors will ask: &ldquo;When was this last reviewed and by whom?&rdquo;</div>'
    + '</div>';
}

function autoSetNextReview(policyKey) {
  var rc = state.policyReviewCycle[policyKey];
  if (rc && rc.lastReviewed && !rc.nextReviewDue) {
    // Default: 1 year from last review
    var d = new Date(rc.lastReviewed + 'T00:00:00');
    d.setFullYear(d.getFullYear() + 1);
    rc.nextReviewDue = d.toISOString().slice(0, 10);
  }
}

// ============================================================
// NEW FEATURE HELPERS: Deadlines, Versioning, Workflow, etc
// ============================================================

// Role-based view filtering
function getRoleView(userId) {
  if (!userId || userId === 'admin') return { role: 'admin', scope: 'all' };
  const user = state.users && state.users.find(u => u.id === userId);
  if (!user) return { role: 'admin', scope: 'all' };
  return { role: user.role, scope: { families: user.families || [], controls: user.controls || [], assets: user.assets || [] } };
}

function getMyControls(userId) {
  if (!userId || userId === 'admin') return getActiveControls();
  const user = state.users && state.users.find(u => u.id === userId);
  if (!user || !user.controls) return [];
  return getActiveControls().filter(c => user.controls.includes(c.id));
}

// Returns the right control list for the current session:
// - Control owners see only their assigned controls
// - Admins and CISOs see all controls
function getScopedControls() {
  if (!state.currentUserId) return getActiveControls();
  // Collect all records for this person (handles dual roles)
  var primaryUser = (state.users||[]).find(u => u.id === state.currentUserId);
  if (!primaryUser) return getActiveControls();
  var nameKey = (primaryUser.name || '').trim().toLowerCase();
  var allRecords = (state.users||[]).filter(function(u){ return u.name && u.name.trim().toLowerCase() === nameKey; });

  // Aggregate roles and families/controls across all records.
  // Include rec.roles[] (merged array from upsertUser) in addition to rec.role (primary).
  var roles = [];
  var allFamilies = [];
  var allControls = [];
  allRecords.forEach(function(u){
    var recRoles = (u.roles && u.roles.length) ? u.roles : [u.role];
    recRoles.forEach(function(r){ if (!roles.includes(r)) roles.push(r); });
    (u.families||[]).forEach(function(f){ if (!allFamilies.includes(f)) allFamilies.push(f); });
    (u.controls||[]).forEach(function(c){ if (!allControls.includes(c)) allControls.push(c); });
  });

  if (roles.includes('control-owner')) {
    // Control owner: filter by assigned controls list
    var byList = allControls.length
      ? getActiveControls().filter(c => allControls.includes(c.id))
      : [];
    if (byList.length) return byList;
    // Secondary match: controls where this user is named as owner
    return getActiveControls().filter(c => (state.controlOwners||{})[c.id]?.name === primaryUser.name);
  }
  if (roles.includes('issm') || roles.includes('custodian')) {
    // ISSM/custodian: filter by assigned families
    if (allFamilies.length) return getActiveControls().filter(c => allFamilies.includes(c.f));
  }
  return getActiveControls();
}

function getMyAssets(userId) {
  if (!userId || userId === 'admin') return state.assets || [];
  const user = state.users && state.users.find(u => u.id === userId);
  if (!user || !user.assets) return [];
  return (state.assets || []).filter(a => user.assets.includes(a.id));
}

function getCurrentPersonAssetIds() {
  if (!state.currentUserId) return null; // admin/full view
  var currentUser = (state.users || []).find(function(u){ return u.id === state.currentUserId; });
  if (!currentUser) return [];
  var personIds = (state._currentPersonIds && state._currentPersonIds.length) ? state._currentPersonIds : [currentUser.id];
  var isAssetOwner = false;
  var ids = [];
  personIds.forEach(function(pid) {
    var rec = (state.users || []).find(function(u){ return u.id === pid; });
    if (!rec) return;
    var roles = (rec.roles && rec.roles.length) ? rec.roles : [rec.role];
    if (roles.indexOf('asset-owner') !== -1) {
      isAssetOwner = true;
      (rec.assets || []).forEach(function(aid) {
        var sid = String(aid);
        if (ids.indexOf(sid) === -1) ids.push(sid);
      });
    }
  });
  return isAssetOwner ? ids : null;
}

// Get controls that affect a specific asset
function getControlsForAsset(assetId) {
  if (!state.assetMappings) return [];
  const controlIds = Object.keys(state.assetMappings).filter(cid =>
    (state.assetMappings[cid] || []).includes(assetId)
  );
  return getActiveControls().filter(c => controlIds.includes(c.id));
}

// Deadline tracking
function daysOverdue(deadline) {
  if (!deadline) return 0;
  const due = new Date(deadline);
  const now = new Date();
  const days = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function getOverdueControls() {
  const overdueCtrl = [];
  getActiveControls().forEach(c => {
    const deadline = state.controlDeadlines && state.controlDeadlines[c.id];
    if (deadline && daysOverdue(deadline) > 0) {
      overdueCtrl.push({ ...c, daysOverdue: daysOverdue(deadline) });
    }
  });
  return overdueCtrl.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// Workflow state
function transitionControlWorkflow(controlId, newState) {
  if (!state.controlWorkflowState) state.controlWorkflowState = {};
  const validStates = ['draft', 'in-progress', 'awaiting-review', 'approved'];
  if (!validStates.includes(newState)) return false;
  state.controlWorkflowState[controlId] = newState;
  if (newState === 'awaiting-review') {
    if (!state.controlReviewQueue) state.controlReviewQueue = [];
    if (!state.controlReviewQueue.find(r => r.controlId === controlId)) {
      state.controlReviewQueue.push({ controlId, submittedAt: new Date().toISOString() });
    }
  }
  markDirty();
  return true;
}

function approveControl(controlId) {
  transitionControlWorkflow(controlId, 'approved');
  if (state.controlReviewQueue) {
    state.controlReviewQueue = state.controlReviewQueue.filter(r => r.controlId !== controlId);
  }
  markDirty();
}

// Policy versioning
function incrementPolicyVersion(family) {
  if (!state.policyVersions) state.policyVersions = {};
  if (!state.policyVersions[family]) {
    state.policyVersions[family] = [{ version: '1.0', approvedAt: new Date().toISOString(), approved: true }];
  } else {
    const current = state.policyVersions[family];
    const lastVer = current[current.length - 1];
    const parts = lastVer.version.split('.').map(p => parseInt(p, 10));
    parts[1] = (parts[1] || 0) + 1;
    const nextVer = parts.join('.');
    current.push({ version: nextVer, approvedAt: new Date().toISOString(), approved: false });
  }
  markDirty();
}

function getPolicyVersion(family) {
  if (!state.policyVersions || !state.policyVersions[family]) return '1.0';
  const versions = state.policyVersions[family];
  return versions[versions.length - 1].version;
}

// Program health statistics
function getProgramHealth() {
  const allControls = getActiveControls();
  const implemented = allControls.filter(c => {
    const status = state.controlStatus && state.controlStatus[c.id];
    return status && status.status === 'Implemented';
  }).length;
  const inProgress = allControls.filter(c => {
    const status = state.controlStatus && state.controlStatus[c.id];
    return status && status.status === 'In Progress';
  }).length;
  const planned = allControls.filter(c => {
    const status = state.controlStatus && state.controlStatus[c.id];
    return status && status.status === 'Planned';
  }).length;
  const notStarted = allControls.length - implemented - inProgress - planned;

  const allPolicies = getActiveFamilies().length;
  const completedPolicies = getActiveFamilies().filter(f => {
    const status = state.policyStatus && state.policyStatus[f];
    return status && status.status === 'Approved';
  }).length;

  const overdue = getOverdueControls().length;
  const inReview = (state.controlReviewQueue || []).length;

  return {
    totalControls: allControls.length,
    implemented,
    inProgress,
    planned,
    notStarted,
    implementedPercent: Math.round((implemented / (allControls.length || 1)) * 100),
    totalPolicies: allPolicies,
    completedPolicies,
    totalAssets: (state.assets || []).length,
    overdue,
    inReview,
  };
}

// ============================================================
// NAVIGATION
// ============================================================
// RESET
// ============================================================
function confirmReset() {
  const overlay = document.createElement('div');
  overlay.id = 'resetModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="background:white;border-radius:16px;padding:32px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="font-size:22px;margin-bottom:8px;">↺</div>'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:8px;">Reset Program?</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:24px;line-height:1.6;">This will clear all data — baseline selection, domain owners, policies, control assignments, and test results. The app will return to its initial state.</div>'
    + '<div style="display:flex;gap:12px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'resetModalOverlay\').remove()">Cancel</button>'
    + '<button class="btn" style="background:var(--red);color:white;border:none;" onclick="resetApp()">Reset Everything</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function resetApp() {
  document.getElementById('resetModalOverlay')?.remove();
  clearScopedUndoStack('reset');
  // Reset all persisted state keys from a single default schema source.
  // This avoids stale fields when new keys are added over time.
  resetStateToDefaults();
  delete state._cisoAutoOwnerName;
  // Reset step counters
  Object.keys(currentStep).forEach(function(k){ currentStep[k] = 1; });
  // Return to admin view and update profile button
  applyRoleView('admin');
  // Re-lock role tabs
  renderSidebarBadges();
  // Navigate to CISO tab step 1
  showTab('ciso');
  goToStep('ciso', 1);
  // Clear localStorage so users/roles don't reload on next page load
  try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_KEY + '-ts'); } catch(e) {}
  showToast('\u21BA Program reset. Starting fresh.');
}

// ============================================================
// TAB ROUTING & APP SHELL
// Tab IDs, showTab, role-view routing, CISO wizard shell
// (step dispatch, toast, cisoFinish, sidebar badges).
// ============================================================
const TAB_IDS = ['ciso','policy','control','asset','tester','reports','users'];


function showProgramOverviewTab() {
  if (!state.cisoComplete || !state.currentUserId) {
    showTab('ciso');
    return;
  }
  showTab('reports');
}

/** Merged nav tab IDs for a logged-in person (all records with same name). Omits CISO setup tab after program setup is complete. */
function getPersonVisibleTabIds(user) {
  if (!user) return TAB_IDS.slice();
  var nameKey = (user.name || '').trim().toLowerCase();
  var allRecords = (state.users || []).filter(function(u) {
    return u.name && u.name.trim().toLowerCase() === nameKey;
  });
  var visible = [];
  allRecords.forEach(function(rec) {
    var recRoles = (rec.roles && rec.roles.length) ? rec.roles : [rec.role];
    recRoles.forEach(function(r) {
      var tabs = ROLE_TABS[r] || ['reports'];
      tabs.forEach(function(t) {
        if (visible.indexOf(t) === -1) visible.push(t);
      });
    });
  });
  if (!visible.length) {
    var roles = (user.roles && user.roles.length) ? user.roles : [user.role];
    roles.forEach(function(r) {
      var tabs = ROLE_TABS[r] || ['reports'];
      tabs.forEach(function(t) {
        if (visible.indexOf(t) === -1) visible.push(t);
      });
    });
  }
  if (state.cisoComplete) {
    visible = visible.filter(function(t) { return t !== 'ciso'; });
  }
  return visible.length ? visible : ['reports'];
}

function goToProgramSetupOrDashboard() {
  if (state.cisoComplete) showTab('reports');
  else showTab('ciso');
}

/** From dashboard: open domain-owner step in CISO wizard (admin), or explain when PO no longer has that workspace. */
function goToDomainOwnersFromDashboard() {
  if (!state.currentUserId) {
    showTab('ciso');
    goToStep('ciso', 5);
    return;
  }
  if (state.cisoComplete) {
    showToast('Domain owners are edited in Program Setup. Sign out and open Admin (🔑), or ask your administrator.', true);
    return;
  }
  showTab('ciso');
  goToStep('ciso', 5);
}

function showTab(tabId) {
  if (state.currentUserId && state.users) {
    var cu = state.users.find(function(u) { return u.id === state.currentUserId; });
    if (cu) {
      var vis = getPersonVisibleTabIds(cu);
      var allowLibraryTab =
        (tabId === 'policy' && state._policyLibraryMode) ||
        (tabId === 'control' && state._controlLibraryMode) ||
        (tabId === 'asset' && (state._assetTypeLibraryMode || state._assetLibraryMode));
      if (vis.length && vis.indexOf(tabId) === -1 && !allowLibraryTab) {
        tabId = vis.indexOf('reports') !== -1 ? 'reports' : vis[0];
      }
    }
  }
  TAB_IDS.forEach(function(id) {
    var tabEl = document.getElementById('tab-' + id);
    var navEl = document.getElementById('nav-' + id);
    if (tabEl) tabEl.classList.remove('active');
    if (navEl) navEl.classList.remove('active');
  });
  ['nav-policy-library','nav-control-library','nav-asset-library','nav-asset-type-library'].forEach(function(id) {
    var navEl = document.getElementById(id);
    if (navEl) navEl.classList.remove('active');
  });
  var targetTab = document.getElementById('tab-' + tabId);
  var targetNav = document.getElementById('nav-' + tabId);
  if (targetTab) targetTab.classList.add('active');
  if (targetNav) targetNav.classList.add('active');
  if (tabId === 'ciso')     renderCISOTab();
  if (tabId === 'policy')   renderPolicyTab();
  if (tabId === 'control')  renderControlTab();
  if (tabId === 'asset')    renderAssetTab();
  if (tabId === 'tester')     renderTesterTab();
  if (tabId === 'reports')    renderReports();
  if (tabId === 'users')    renderUsersTab();
  updateNotificationBadges();
  enhanceKeyboardAccessibility();
}

function openISPSuggestionModal() {
  var overlay = document.createElement('div');
  overlay.id = 'ispSuggestionOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  var currentUser = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var suggBy = currentUser ? currentUser.name : (state.programOwner || '');
  overlay.innerHTML = '<div style="background:white;border-radius:12px;max-width:760px;width:100%;padding:20px;border:1px solid var(--border);box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
    + '<div style="font-size:16px;font-weight:800;color:var(--navy);">Propose ISP Change</div>'
    + '<button class="btn btn-secondary btn-sm" onclick="document.getElementById(\'ispSuggestionOverlay\').remove()">Close</button>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Published policy remains unchanged until the next formal review/approval cycle. Use this to track proposed updates.</div>'
    + '<div class="form-group" style="margin-bottom:10px;">'
    + '<label class="form-label" style="font-size:11px;">Suggested By</label>'
    + '<input id="isp-sugg-by" class="form-input" style="font-size:13px;" value="' + escapeHTML(suggBy) + '" placeholder="Name">'
    + '</div>'
    + '<div class="form-group" style="margin-bottom:12px;">'
    + '<label class="form-label" style="font-size:11px;">Suggested Change Summary</label>'
    + '<textarea id="isp-sugg-summary" class="form-input" rows="7" style="font-size:13px;line-height:1.6;resize:vertical;" placeholder="Describe what should change in the next annual review draft (sections, rationale, impact)."></textarea>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;">'
    + '<button class="btn btn-secondary btn-sm" onclick="document.getElementById(\'ispSuggestionOverlay\').remove()">Cancel</button>'
    + '<button class="btn btn-primary btn-sm" onclick="saveISPSuggestion()">Save Suggested Change</button>'
    + '</div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function saveISPSuggestion() {
  var by = (document.getElementById('isp-sugg-by') || {}).value || '';
  var summary = (document.getElementById('isp-sugg-summary') || {}).value || '';
  by = by.trim();
  summary = summary.trim();
  if (!summary) { showToast('Please enter a suggested change summary.', true); return; }
  if (!state.infoSecPolicySuggestions) state.infoSecPolicySuggestions = [];
  state.infoSecPolicySuggestions.push({
    id: 'isp_sugg_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    createdAt: new Date().toISOString().slice(0,10),
    suggestedBy: by || (state.programOwner || 'Policy contributor'),
    summary: summary,
    status: 'Proposed'
  });
  markDirty();
  try { addAuditEntry('policy', 'ISP', 'ISP suggested change logged by ' + (by || 'Policy contributor')); } catch (e) {}
  document.getElementById('ispSuggestionOverlay')?.remove();
  showToast('📝 Suggested ISP change saved.');
  goToCISOPolicyEditor();
}

function approveISPSuggestion(suggestionId) {
  if (!state.infoSecPolicySuggestions) return;
  var s = state.infoSecPolicySuggestions.find(function(x){ return x.id === suggestionId; });
  if (!s) { showToast('Suggestion not found.', true); return; }
  if (s.status === 'Promoted') { showToast('This suggestion was already promoted into a review draft.', true); return; }
  s.status = 'Approved';
  markDirty();
  try { addAuditEntry('policy', 'ISP', 'ISP suggestion approved for promotion: ' + (s.summary||'').slice(0,80)); } catch (e) {}
  showToast('✓ Suggestion marked approved — you can promote it into the annual review draft.');
  goToCISOPolicyEditor();
}

function rejectISPSuggestion(suggestionId) {
  if (!state.infoSecPolicySuggestions) return;
  var s = state.infoSecPolicySuggestions.find(function(x){ return x.id === suggestionId; });
  if (!s) { showToast('Suggestion not found.', true); return; }
  if (s.status === 'Promoted') return;
  s.status = 'Rejected';
  markDirty();
  try { addAuditEntry('policy', 'ISP', 'ISP suggestion rejected'); } catch (e) {}
  showToast('Suggestion marked rejected.');
  goToCISOPolicyEditor();
}

// Annual review kickoff: merge all Approved suggestions into the working review draft and mark them Promoted.
function promoteApprovedISPSuggestionsToReviewDraft() {
  if (!state.infoSecPolicySuggestions) state.infoSecPolicySuggestions = [];
  var approved = state.infoSecPolicySuggestions.filter(function(s){ return s.status === 'Approved'; });
  if (!approved.length) {
    showToast('No approved suggestions to promote. Approve one or more suggestions in the table first.', true);
    return;
  }
  if (!confirm('Promote ' + approved.length + ' approved suggestion(s) into the annual review working draft?\n\nThey will be marked Promoted and appended to the draft for editing before the next formal approval.')) return;
  var lines = approved.map(function(s, i) {
    return (i + 1) + '. [' + (s.createdAt || '—') + '] ' + (s.suggestedBy || '—') + '\n   ' + (s.summary || '').replace(/\n/g, '\n   ');
  });
  var block = '── Seeded ' + new Date().toISOString().slice(0, 10) + ' ──\n' + lines.join('\n\n');
  var prev = state.infoSecPolicyReviewDraft;
  var nextVer = 1;
  if (prev && prev.version != null) {
    var n = parseInt(String(prev.version), 10);
    nextVer = (isNaN(n) ? 0 : n) + 1;
  }
  var createdAt = (prev && prev.createdAt) ? prev.createdAt : new Date().toISOString().slice(0, 10);
  var priorContent = (prev && prev.content) ? prev.content : '';
  var newContent = priorContent ? (priorContent + '\n\n' + block) : block;
  var priorIds = (prev && prev.promotedSuggestionIds) ? prev.promotedSuggestionIds.slice() : [];
  approved.forEach(function(s) { s.status = 'Promoted'; });
  state.infoSecPolicyReviewDraft = {
    version: nextVer,
    createdAt: createdAt,
    updatedAt: new Date().toISOString().slice(0, 10),
    content: newContent,
    promotedSuggestionIds: priorIds.concat(approved.map(function(s){ return s.id; }))
  };
  markDirty();
  try { addAuditEntry('policy', 'ISP', 'ISP annual review draft v' + nextVer + ' seeded from ' + approved.length + ' approved suggestion(s)'); } catch (e) {}
  showToast('📋 Review draft v' + nextVer + ' updated with ' + approved.length + ' approved suggestion(s).');
  goToCISOPolicyEditor();
}

function enhanceKeyboardAccessibility() {
  document.querySelectorAll('.sidebar-item, .step-item').forEach(function(el) {
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  });
  if (window._keyboardA11yBound) return;
  document.addEventListener('keydown', function(ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var t = ev.target;
    if (!t || !t.matches || !t.matches('.sidebar-item, .step-item')) return;
    ev.preventDefault();
    t.click();
  });
  window._keyboardA11yBound = true;
}

function renderCISOTab() {
  // Shell HTML may still include a static "CISO View" role-badge; remove it so the header stays clean.
  var tabCiso = document.getElementById('tab-ciso');
  if (tabCiso) {
    var ph = tabCiso.querySelector('.page-header');
    if (ph) ph.querySelectorAll('.role-badge').forEach(function(el) { el.remove(); });
  }

  // If setup is already complete, show a banner but still allow editing
  if (state.cisoComplete) {
    var banner = document.getElementById('ciso-complete-banner');
    if (!banner) {
      // Insert banner above wizard steps
      var container = document.getElementById('ciso-wizard') || document.querySelector('.wizard-content');
      if (container) {
        banner = document.createElement('div');
        banner.id = 'ciso-complete-banner';
        banner.style.cssText = 'background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin:0 32px 16px;display:flex;align-items:center;justify-content:space-between;';
        banner.innerHTML = '<div style="display:flex;align-items:center;gap:10px;">'
          + '<span style="font-size:20px;">\u2705</span>'
          + '<div><div style="font-size:14px;font-weight:700;color:#166534;">Program Setup Complete</div>'
          + '<div style="font-size:12px;color:#15803d;">All changes are auto-saved. You can edit any step below.</div></div></div>'
          + '<button class="btn btn-sm" style="background:#166534;color:white;border:none;white-space:nowrap;" onclick="showTab(\'reports\')">Go to Dashboard \u2192</button>';
        container.parentNode.insertBefore(banner, container);
      }
    }
    if (banner) banner.style.display = 'flex';
  } else {
    var banner = document.getElementById('ciso-complete-banner');
    if (banner) banner.style.display = 'none';
  }
  // Always render the current step — never redirect
  renderCISOStep(currentStep.ciso);
  updateCISOFinishBtn();
}

function allOwnersAssigned() {
  if (!state.baseline) return false;
  const families = getActiveFamilies().filter(f => f !== 'PM');
  const merges = state.policyMerges || {};
  const masters = families.filter(f => !merges[f]);
  return masters.every(fam => {
    const o = state.domainOwners[fam] || {};
    const sugg = DOMAIN_SUGGESTED_ROLES[fam] || '';
    return o.name && o.name.trim() && o.name !== sugg;
  });
}

function updateCISOFinishBtn() {
  var demoNames = getDemoPlaceholderNames();
  if (demoNames.length && document.getElementById('ciso-finalise-btn')) {
    const btn = document.getElementById('ciso-finalise-btn');
    btn.disabled = true;
    btn.innerHTML = '⚠️ Replace demo placeholder owners';
    btn.style.opacity = '0.5';
    if (!document.getElementById('fake-review-panel')) {
      btn.insertAdjacentHTML('beforebegin', '<div id="fake-review-panel" style="padding:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:16px;"><h4 style="color:#92400e;margin:0 0 8px 0;">Demo placeholder owners</h4><p style="font-size:12px;color:#78350f;margin:0 0 8px 0;">The following names are flagged as portfolio demo data and cannot be used for real attestations: <strong>' + escapeHTML(demoNames.join(', ')) + '</strong>. Edit each owner name or email in Step 5 to clear the DEMO badge, then finalize.</p></div>');
    }
    return;
  }
  var fr = document.getElementById('fake-review-panel');
  if (fr) fr.remove();

  const btn = document.getElementById('ciso-finalise-btn');
  if (!btn) return;

  // If setup already complete — always show the dashboard shortcut
  if (state.cisoComplete) {
    btn.style.display = '';
    btn.disabled = false;
    btn.innerHTML = '✓ Setup Complete &nbsp;·&nbsp; View Dashboard →';
    btn.onclick = function(){ showTab('reports'); };
    btn.style.background = 'var(--teal)';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    return;
  }

  // Step 4 (consolidate): hide finalize — use Next in footer to reach step 5
  if (currentStep.ciso === 4) {
    btn.style.display = 'none';
    return;
  }
  // Step 5 (owners): show finalize when all owners assigned
  if (currentStep.ciso === 5) {
    btn.style.display = '';
    const ready = allOwnersAssigned();
    btn.innerHTML = ready ? '✓ Finalise Program Setup' : '✓ Finalise Program Setup — assign all owners first';
    btn.onclick = ready ? cisoFinish : null;
    btn.disabled = !ready;
    btn.style.background = ready ? '' : '#94a3b8';
    btn.style.opacity = ready ? '1' : '0.6';
    btn.style.cursor = ready ? 'pointer' : 'not-allowed';
    return;
  }

  // All other steps — show normally (not yet clickable but visible for orientation)
  btn.style.display = '';
  btn.disabled = false;
  btn.innerHTML = '✓ Finalise Program Setup';
  btn.onclick = cisoFinish;
  btn.style.background = '';
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';
}

const currentStep = { ciso:1, policy:1, control:1, asset:1, tester:1 };

function goToStep(tabId, step) {
  const maxSteps = { ciso:5, policy:4, control:4, asset:3, tester:4 };
  const max = maxSteps[tabId] || 4;
  if (step < 1 || step > max) return;
  if (tabId === 'asset') {
    var hasAsset = !!(state._selectedAssetId && (state.assets || []).find(function(a){ return String(a.id) === String(state._selectedAssetId); }));
    var hasProc = !!(state._selectedProcessId && (state.processes || []).find(function(p){ return String(p.id) === String(state._selectedProcessId); }));
    if (!hasAsset && !hasProc) step = 1;
  }
  // Validate CISO step progression
  if (tabId === 'ciso' && step > 1) {
    if (!state.baseline) { showToast('Please select a baseline impact level first.', true); return; }
    if (!state.orgName || !state.orgName.trim()) { showToast('Please enter your Organization / Agency Name before continuing.', true); document.getElementById('orgNameInput')?.focus(); return; }
    if (!state.programOwner || !state.programOwner.trim()) { showToast('Please enter the Security Program Owner name before continuing.', true); document.getElementById('programOwnerInput')?.focus(); return; }
    if (!state.programOwnerTitle || !state.programOwnerTitle.trim()) { showToast('Please enter the Program Owner title before continuing.', true); document.getElementById('programOwnerTitleInput')?.focus(); return; }
  }
  // Hide all steps
  for (let i = 1; i <= max; i++) {
    const s = document.getElementById(`${tabId}-step-${i}`);
    if (s) s.classList.remove('active');
  }
  // Show target
  const target = document.getElementById(`${tabId}-step-${step}`);
  if (target) target.classList.add('active');
  currentStep[tabId] = step;
  // Update step nav circles
  for (let i = 1; i <= max; i++) {
    const circle = document.getElementById(`${tabId}-circle-${i}`);
    const item = document.getElementById(`${tabId}-step-item-${i}`);
    const conn = document.getElementById(`${tabId}-conn-${i}`);
    if (!circle) continue;
    circle.className = 'step-circle ' + (i < step ? 'done' : i === step ? 'active' : 'pending');
    circle.textContent = i < step ? '✓' : i;
    if (item) { item.classList.toggle('active', i===step); }
    if (conn) { conn.classList.toggle('done', i < step); }
  }
  // Re-render step bodies when navigating
  if (tabId==='ciso') renderCISOStep(step);
  if (tabId==='policy') { renderPolicyWizardChrome(step); renderPolicyStep(step); }
  if (tabId==='control') renderControlStep(step);
  if (tabId==='asset') { renderAssetWizardChrome(); renderAssetStep(step); }
  if (tabId==='tester') renderTesterStep(step);
}

// ============================================================
// CISO WIZARD — STEP DISPATCH & SHARED HELPERS
// renderCISOStep router, cisoNext, allOwnersAssigned,
// updateCISOFinishBtn, goToStep, prefillFakeOwners, etc.
// ============================================================
function renderCISOStep(step) {
  if (step===1) renderCISOStep1();
  if (step===2) renderCISOStep2();
  if (step===3) renderCISOStep3();
  if (step===4) renderCISOStep4a();
  if (step===5) renderCISOStep4b();
}

/** After merge/unmerge while on setup steps 4 or 5, refresh the visible panel only. */
function renderActiveCisoSetupStep() {
  if (currentStep.ciso === 5) renderCISOStep4b();
  else if (currentStep.ciso === 4) renderCISOStep4a();
}

function cisoNext(fromStep) {
  if (fromStep >= 5) return;
  if (fromStep===1) {
    if (!state.baseline) { showToast('Please select a baseline impact level before continuing.', true); return; }
    if (!state.orgName || !state.orgName.trim()) { showToast('Please enter your Organization / Agency Name before continuing.', true); document.getElementById('orgNameInput')?.focus(); return; }
    if (!state.programOwner || !state.programOwner.trim()) { showToast('Please enter the Security Program Owner name before continuing.', true); document.getElementById('programOwnerInput')?.focus(); return; }
  }
  if (fromStep===3) {
    // Finalize the ISP and submit to the selected approver for review.
    // Wrapped so a submission failure can never block the wizard from advancing.
    try { submitISPForApproval(/*silent=*/false); } catch (e) { console.warn('submitISPForApproval failed:', e); }
  }
  goToStep('ciso', fromStep+1);
}

// Auto-submits the ISP to the assigned approver when the CISO advances past Step 3.
// Moves the ISP from Draft/Not Started → Under Review, registers the approver as a user,
// logs an audit entry, and shows a toast. Idempotent — safe to call on re-entry.
function submitISPForApproval(silent) {
  if (!state.infoSecPolicy) return;
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.policyReviewCycle) state.policyReviewCycle = {};
  var rc = state.policyReviewCycle.ISP || (state.policyReviewCycle.ISP = {});

  // Determine approver. If the checkbox "Different approver" is on, use that; otherwise default to CISO/program owner.
  var defaultApproverName = (state.programOwner || '').trim();
  var isCustom = !!rc._customApprover;
  var approverName = isCustom
    ? (rc.approvedBy || '').trim()
    : defaultApproverName;
  var approverRole  = isCustom ? (rc.approverRole  || '').trim() : (state.programOwnerTitle || 'CISO');
  var approverEmail = isCustom ? (rc.approverEmail || '').trim() : (state.programOwnerEmail || '');

  if (!approverName) {
    if (!silent) showToast('Tip: assign an ISP approver in the Policy Review card to route it for sign-off.', true);
    return;
  }

  // Persist the approver on the review cycle so Peter's view can render the correct "Approver" label.
  rc.approvedBy    = approverName;
  rc.approverRole  = approverRole;
  rc.approverEmail = approverEmail;

  // Mark the ISP as finalized by setting a title. Other views (sidebar badge, approver queue,
  // policy status fallbacks) use `state.infoSecPolicy.title` as the "ISP exists / is done" flag.
  // Only set it if not already set so users can override the title themselves later.
  if (!state.infoSecPolicy.title) {
    state.infoSecPolicy.title = 'Information Security Policy';
  }

  // Only (re)submit if the ISP isn't already approved. Approved policies shouldn't regress on re-edit.
  var current = (state.policyStatus.ISP || {}).status;
  if (current !== 'Approved') {
    state.policyStatus.ISP = {
      status: 'Under Review',
      submittedTo: approverName,
      submittedToRole: approverRole,
      submittedToEmail: approverEmail,
      submittedAt: new Date().toISOString().slice(0,10),
      lastUpdated: new Date().toLocaleDateString(),
      version: (state.infoSecPolicy && state.infoSecPolicy.version) || '1.0'
    };
    try { addAuditEntry('policy', 'ISP', 'ISP submitted for approval — routed to ' + approverName + (approverRole ? ' (' + approverRole + ')' : '')); } catch (e) { console.warn('audit log failed:', e); }
    if (!silent) showToast('📨 ISP submitted to ' + approverName + ' for review.');
  }

  // Make sure the approver shows up as a user so they can log in and see the queue.
  // These are best-effort — never let them block the wizard from advancing.
  try { if (typeof syncUsersFromState === 'function') syncUsersFromState(); } catch (e) { console.warn('syncUsersFromState failed:', e); }
  try { markDirty(); } catch (e) { console.warn('markDirty failed:', e); }
  try { renderSidebarBadges(); } catch (e) { console.warn('renderSidebarBadges failed:', e); }
}

function showToast(msg, isError=false) {
  const existing = document.getElementById('__toast__');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = '__toast__';
  t.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${isError?'#991b1b':'#166534'};color:white;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.25);z-index:9999;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
  // Any successful action marks state as dirty and triggers a debounced save
  if (!isError) markDirty();
}

function cisoFinish() {
  if (blockActionIfDemoPlaceholders()) return;
  // Check if any domain owners are unassigned — do not auto-inject demo identities
  const families = getActiveFamilies().filter(f => f !== 'PM');
  const merges = state.policyMerges || {};
  const masters = families.filter(f => !merges[f]);
  const unassigned = masters.filter(f => !(state.domainOwners[f] || {}).name);

  if (unassigned.length > 0) {
    showToast('Assign an owner for all ' + unassigned.length + ' domain(s) before finalizing, or use "Prefill demo data" in Step 5 and then replace placeholder names with real people.', true);
    return;
  }
  clearScopedUndoStack('program finalization');
  state.cisoComplete = true;
  addAuditEntry('program', null, 'Program setup completed by CISO');
  renderSidebarBadges();
  updateCISOFinishBtn();
  showTab('reports');
  showToast('✅ Program setup complete! All role tabs are now active.');
}

function renderSidebarBadges() {
  const families = getActiveFamilies();
  const merges = state.policyMerges || {};
  const allFams = families.filter(f => f !== 'PM');
  const masterFams = allFams.filter(f => !merges[f]);
  const slavesOf = {};
  allFams.forEach(f => { if (merges[f]) { if (!slavesOf[merges[f]]) slavesOf[merges[f]] = []; slavesOf[merges[f]].push(f); } });

  // Current user context for role-aware rendering
  const user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  const userRole = user ? user.role : 'admin';
  const userFamilies = user && user.families ? user.families : [];
  // Merged role flags (same name / _currentPersonIds) — Tier-1-only approver vs ISSM/custodian/CISO
  var hasApprover = false, hasIssm = false, hasCisoR = false, hasCust = false;
  if (user) {
    (state._currentPersonIds || [user.id]).forEach(function(pid) {
      var rec = (state.users || []).find(function(u) { return u.id === pid; });
      if (!rec) return;
      (rec.roles && rec.roles.length ? rec.roles : [rec.role]).forEach(function(r) {
        if (r === 'approver') hasApprover = true;
        if (r === 'issm') hasIssm = true;
        if (r === 'ciso') hasCisoR = true;
        if (r === 'custodian') hasCust = true;
      });
    });
  }
  var isTier1OnlyApprover = hasApprover && !hasIssm && !hasCisoR && !hasCust;
  // Build combined visible tabs across all roles this person holds (handles dual-role users).
  // Check both rec.role and rec.roles[] since upsertUser merges multi-role onto one record.
  const visibleTabs = user ? getPersonVisibleTabIds(user) : TAB_IDS;

  // Helper: does this user own this master family (directly or via merge)?
  function userOwnsFam(masterFam) {
    if (!user) return true; // admin owns all
    var famGroup = [masterFam].concat(slavesOf[masterFam] || []);
    return famGroup.some(function(f){ return userFamilies.includes(f); });
  }

  // Populate Policies sidebar
  const pList = document.getElementById('sidebar-policies-list');
  const pSection = document.getElementById('sidebar-policies-section');
  if (pList) {
    // Show collapsible "Policies" list for: admin, policy tab, CISO tab, or Tier 1 ISP approver (ISP link only — not the Domain policies workspace)
    var showPolicySidebar = !user || visibleTabs.includes('policy') || visibleTabs.includes('ciso') || hasApprover;
    if (pSection) {
      pSection.style.display = showPolicySidebar ? '' : 'none';
    }

    const ispDone = !!(state.infoSecPolicy && state.infoSecPolicy.title);
    const showISP = !user || userRole === 'ciso' || hasApprover;
    const ispEntry = showISP ? `<div class="sidebar-item" style="padding-left:28px;font-size:12px;cursor:pointer;" onclick="goToCISOPolicyEditor()">
      <span style="font-size:12px;margin-right:5px;">\uD83D\uDCCB</span>
      <span style="font-weight:600;color:${ispDone?'#4ade80':'rgba(255,255,255,0.55)'};">Information Security Policy (Tier 1)</span>
    </div>` : '';

    // Pure Tier-1 ISP approver: no Tier-2 domain shortcuts in the sidebar (ISSM/CUST/CISO see domains)
    var policyEntries = isTier1OnlyApprover ? '' : masterFams.map(fam => {
      const o = state.domainOwners[fam] || {};
      const done = !!o.name;
      const slaves = slavesOf[fam] || [];
      const mergedTitle = getPolicyMergedTitle(fam);
      const famGroup = [fam, ...slaves];
      const isOwned = userOwnsFam(fam);

      // For ISSM/custodian: hide policies they don't own (show only theirs)
      if ((userRole === 'issm' || userRole === 'custodian') && !isOwned) return '';

      const ownerMarker = (userRole === 'issm' || userRole === 'custodian') && isOwned
        ? '<span style="margin-left:4px;font-size:9px;color:#4ade80;" title="Your policy">\u2605</span>' : '';

      return `<div class="sidebar-item" style="padding-left:28px;font-size:12px;" onclick="openPolicyDoc('${fam}')">
        <span style="font-family:monospace;font-weight:700;color:${done?'#4ade80':'rgba(255,255,255,0.5)'};">${famGroup.join('+')}</span>
        <span style="margin-left:6px;color:rgba(255,255,255,0.7);">${mergedTitle}</span>${ownerMarker}
      </div>`;
    }).join('');

    pList.innerHTML = ispEntry + policyEntries;
  }

  // Populate Controls sidebar — role-aware count (always visible, non-collapsible)
  const cList = document.getElementById('sidebar-controls-list');
  const cSection = document.getElementById('sidebar-controls-section');
  if (cList) {
    cList.style.display = ''; // always expanded
    if (cSection) cSection.style.display = '';

    const scopedControls = getScopedControls();
    const isScoped = user && userRole === 'control-owner';
    const label = isScoped ? 'My Controls' : 'All Controls';
    const count = scopedControls.length;
    cList.innerHTML = `<div class="sidebar-item" style="padding-left:28px;font-size:12px;" onclick="showTab('control');goToStep('control',1);">
      <span style="font-weight:600;color:rgba(255,255,255,0.85);">${label}</span>
      ${count ? `<span style="margin-left:6px;color:rgba(255,255,255,0.45);font-size:11px;">(${count} in scope)</span>` : ''}
    </div>`;
  }

  // Update notification badges and asset sidebar whenever sidebar is rendered
  if(state.tasks) {
       var cu = state.users && state.users.find(function(u){return u.id===state.currentUserId});
       var myName = cu ? cu.name : state.currentUserId;
       var pending = state.tasks.filter(function(t){return t.assigneeName === myName && t.status === 'Pending';}).length;
       var b = document.getElementById('tasks-badge');
       if(b) {
           b.style.display = pending > 0 ? 'inline-block' : 'none';
           b.innerText = pending;
       }
    }
  setTimeout(updateNotificationBadges, 50);
  setTimeout(renderSidebarAssets, 60);
}

function updateNotificationBadges() {
  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var role = user ? user.role : 'admin';

  // Helper to set badge
  function setBadge(id, count) {
    var el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
      el.textContent = count > 99 ? '99+' : count;
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }

  // Policy badge: returned policies for ISSM, or policies needing attention
  var policyCount = 0;
  if (role === 'issm' && user && user.families) {
    var merges = state.policyMerges || {};
    var pStatus = state.policyStatus || {};
    user.families.forEach(function(f) {
      var master = merges[f] || f;
      var ps = (pStatus[master]||{}).status || '';
      if (ps === 'Returned') policyCount++;
    });
  }
  setBadge('badge-policy', policyCount);

  // Control badge: controls with review feedback or needing attestation for control-owners
  var controlCount = 0;
  if (role === 'control-owner') {
    var myControls = getScopedControls();
    myControls.forEach(function(c) {
      var ws = (state.controlWorkflowState||{})[c.id] || {};
      if (ws.status === 'returned' || ws.status === 'needs-evidence') controlCount++;
    });
  }
  setBadge('badge-control', controlCount);

  // Reports badge: pending review queue items for ISSM/CISO
  var reviewCount = 0;
  if (role === 'issm' || role === 'ciso' || !user) {
    var queue = state.controlReviewQueue || [];
    if (role === 'issm' && user.families) {
      reviewCount = queue.filter(function(r) {
        var fam = (r.controlId||'').replace(/-.*/, '');
        return user.families.includes(fam);
      }).length;
    } else {
      reviewCount = queue.length;
    }
  }
  setBadge('badge-reports', reviewCount);

  // Asset badge: incomplete SSPs (assets with no signoff and at least one mapped control)
  var assetCount = 0;
  if (role === 'custodian' || !user) {
    // Not an asset owner role — no badge
  } else {
    (state.assets || []).forEach(function(a) {
      var signoff = (state.sspSignoffs || {})[a.id] || {};
      if (signoff.status === 'Submitted' || signoff.status === 'Approved') return;
      var controls = getAssetSSPControls(a);
      if (!controls.length) return;
      var attests = (state.sspAttestations || {})[a.id] || {};
      var unanswered = controls.filter(function(c){ return !(attests[c.id]||{}).status; }).length;
      if (unanswered > 0) assetCount++;
    });
  }
  setBadge('badge-asset', assetCount);
}

function renderSidebarAssets() {
  var list = document.getElementById('sidebar-assets-list');
  var section = document.getElementById('sidebar-assets-section');
  if (!list) return;

  var assets = state.assets || [];

  // Optionally hide for roles that don't use asset tab
  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var role = user ? user.role : 'admin';
  var visibleTabs = ROLE_TABS[role] || TAB_IDS;
  if (section && !visibleTabs.includes('asset') && role !== 'admin') {
    section.style.display = 'none';
    return;
  } else if (section) {
    section.style.display = '';
  }

  var scopedIds = getCurrentPersonAssetIds();
  if (scopedIds) {
    assets = assets.filter(function(a){ return scopedIds.indexOf(String(a.id)) !== -1; });
  }

  if (!assets.length) {
    list.innerHTML = '<div class="sidebar-item" style="padding-left:28px;font-size:12px;cursor:pointer;" onclick="showTab(\'asset\')">'
      + '<span style="color:rgba(255,255,255,0.45);font-style:italic;">No assigned assets yet</span>'
      + '</div>';
    return;
  }

  list.innerHTML = assets.map(function(a) {
    var signoff = (state.sspSignoffs||{})[a.id] || {};
    var attests = (state.sspAttestations||{})[a.id] || {};
    var controls = getAssetSSPControls(a);
    var done = controls.filter(function(c){ return (attests[c.id]||{}).status; }).length;
    var statusDot = signoff.status === 'Approved'  ? '#4ade80'
                  : signoff.status === 'Submitted' ? '#60a5fa'
                  : done > 0                       ? '#fbbf24'
                  :                                  'rgba(255,255,255,0.3)';
    return '<div class="sidebar-item" style="padding-left:28px;font-size:12px;cursor:pointer;" onclick="openAssetWizardFromLibrary(\'' + a.id + '\')">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:' + statusDot + ';display:inline-block;margin-right:6px;flex-shrink:0;"></span>'
      + '<span style="color:rgba(255,255,255,0.8);font-weight:500;">' + _esc(a.name) + '</span>'
      + '<span style="margin-left:4px;color:rgba(255,255,255,0.35);font-size:10px;">' + _esc(a.type||'') + '</span>'
      + '</div>';
  }).join('')
    + '<div class="sidebar-item" style="padding-left:28px;font-size:12px;cursor:pointer;" onclick="showTab(\'asset\');openAddAssetModal()">'
    + '<span style="color:var(--teal);font-weight:600;">+ Add Asset</span>'
    + '</div>';
}

/** Policy tab landing: library / role workspace — not doc viewer or domain wizard. */
function goToPoliciesHome() {
  state._policyLibraryMode = false;
  state._policyDocView = false;
  state._policyWizardMode = false;
  state._policyDomain = null;
  showTab('policy');
}

function goToPolicyLibrary() {
  state._policyLibraryMode = true;
  state._policyDocView = false;
  state._policyWizardMode = false;
  state._policyDomain = null;
  showTab('policy');
}

function goToControlWorkspace() {
  state._controlLibraryMode = false;
  showTab('control');
}

function goToControlLibrary() {
  state._controlLibraryMode = true;
  showTab('control');
}

function goToAssetWorkspace() {
  state._assetLibraryMode = false;
  state._assetTypeLibraryMode = false;
  showTab('asset');
}

function goToAssetLibrary() {
  state._assetLibraryMode = true;
  state._assetTypeLibraryMode = false;
  showTab('asset');
}

function goToAssetTypeLibrary() {
  state._assetLibraryMode = false;
  state._assetTypeLibraryMode = true;
  showTab('asset');
}

function userCanAccessAssetWorkspace() {
  if (!state.currentUserId) return true; // admin mode
  var user = (state.users || []).find(function(u){ return u.id === state.currentUserId; });
  if (!user) return false;
  var visibleTabs = getPersonVisibleTabIds(user) || [];
  return visibleTabs.indexOf('asset') !== -1;
}

function openAssetWizardFromLibrary(assetId) {
  if (!userCanAccessAssetWorkspace()) {
    showToast('Access restricted: only Asset Owners can open the asset SSP wizard.', true);
    return;
  }
  goToAssetWorkspace();
  enterAssetSSP(assetId);
}

// ============================================================
// CISO STEP 1 — BASELINE SELECTION
// Low / Moderate / High + Privacy Overlay toggle.
// ============================================================
function renderCISOStep1() {
  const body = document.getElementById('ciso-step-1-body');
  if (!body) return;
  const lCount = baselineCount('L');
  const mCount = baselineCount('M');
  const hCount = baselineCount('H');
  const privCount = BASELINE_COUNTS.P;

  body.innerHTML = `
    <div style="margin-bottom:8px;">
      <div class="section-title" style="margin-bottom:2px;">Select Your NIST 800-53 Baseline</div>
      <div class="section-subtitle">Choose the impact level for your information system. This determines which controls apply to your program.</div>
    </div>

    <div class="baseline-grid">
      <div class="baseline-card bc-low ${state.baseline==='L'?'selected':''}" onclick="selectBaseline('L')">
        <div class="bc-label">LOW IMPACT</div>
        <div class="bc-name">Low Baseline</div>
        <div class="bc-desc">For systems where compromise would have limited adverse effects on operations, assets, or individuals.</div>
        <div class="bc-count">${lCount} controls incl. enhancements (NIST 800-53B)</div>
      </div>
      <div class="baseline-card bc-mod ${state.baseline==='M'?'selected':''}" onclick="selectBaseline('M')">
        <div class="bc-label">MODERATE IMPACT <span style="background:#0d9488;color:white;font-size:10px;padding:2px 6px;border-radius:10px;margin-left:4px;font-weight:700;">RECOMMENDED</span></div>
        <div class="bc-name">Moderate Baseline</div>
        <div class="bc-desc">For systems where compromise would have serious adverse effects. The most commonly used baseline for federal systems.</div>
        <div class="bc-count">${mCount} controls incl. enhancements (NIST 800-53B)</div>
      </div>
      <div class="baseline-card bc-high ${state.baseline==='H'?'selected':''}" onclick="selectBaseline('H')">
        <div class="bc-label">HIGH IMPACT</div>
        <div class="bc-name">High Baseline</div>
        <div class="bc-desc">For systems where compromise would have severe or catastrophic effects. Used for national security and critical infrastructure.</div>
        <div class="bc-count">${hCount} controls incl. enhancements (NIST 800-53B)</div>
      </div>
    </div>

    <div class="privacy-toggle-card ${state.privacyOverlay?'selected':''}" onclick="togglePrivacy()" style="margin-top:8px;">
      <div class="pt-icon">🔒</div>
      <div class="pt-info">
        <div class="pt-name">Add Privacy Overlay (PT + PM-18 through PM-28)</div>
        <div class="pt-desc">Adds ${privCount} privacy-specific controls from the PT (Privacy) family. Required if your system processes Personally Identifiable Information (PII).</div>
      </div>
      <div class="toggle-switch ${state.privacyOverlay?'on':''}"></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;margin-top:20px;">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Organization / Agency Name <span class="required">*</span></label>
        <input class="form-input" id="orgNameInput" placeholder="e.g., Acme Corp, Department of Defense — Agency X" value="${escapeHTML(state.orgName)}" oninput="state.orgName=this.value; window.markDirty();">
        <div class="form-hint">Full legal name of the organization this information security program governs.</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Security Program Owner — Full Name <span class="required">*</span></label>
          <input class="form-input" id="programOwnerInput" placeholder="e.g., Jane Smith" value="${escapeHTML(state.programOwner)}" oninput="state.programOwner=this.value;applyCisoIsISSM();; window.markDirty();">
          <div class="form-hint">Senior official responsible for the security program (CISO, SAISO, or equivalent).</div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Title / Role <span class="required">*</span></label>
          <input class="form-input" id="programOwnerTitleInput" placeholder="e.g., Chief Information Security Officer" value="${escapeHTML(state.programOwnerTitle)}" oninput="state.programOwnerTitle=this.value;applyCisoIsISSM();; window.markDirty();">
          <div class="form-hint">Official title — flows into policy documents as the accountable role.</div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Email Address</label>
          <input class="form-input" id="programOwnerEmailInput" type="email" placeholder="e.g., jsmith@agency.gov" value="${escapeHTML(state.programOwnerEmail)}" oninput="state.programOwnerEmail=this.value;applyCisoIsISSM();; window.markDirty();">
          <div class="form-hint">Used to populate the Users &amp; Roles inventory automatically.</div>
        </div>
      </div>
      <label style="display:inline-flex;align-items:center;gap:10px;margin-top:14px;padding:10px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;cursor:pointer;user-select:none;">
        <input type="checkbox" ${state.cisoIsISSM ? 'checked' : ''} onchange="state.cisoIsISSM=this.checked;applyCisoIsISSM();renderCISOStep1();" style="width:16px;height:16px;accent-color:#0369a1;cursor:pointer;">
        <div>
          <span style="font-size:13px;color:#0369a1;font-weight:600;">Program Owner also owns domain policies</span>
          <span style="font-size:12px;color:#64748b;"> — they own domain-level policies directly. Common in teams under ~100 people.</span>
        </div>
      </label>
    </div>

    ${state.baseline ? `
    <div class="summary-box">
      <h3>📊 Selected Program Scope</h3>
      <div class="summary-kv"><span class="sk">Baseline:</span><span class="sv">${state.baseline==='L'?'Low Impact':state.baseline==='M'?'Moderate Impact':'High Impact'}</span></div>
      <div class="summary-kv"><span class="sk">Privacy Overlay:</span><span class="sv">${state.privacyOverlay?'Yes — PT (Privacy) family included':'No'}</span></div>
      <div class="summary-kv"><span class="sk">Total Controls in Scope:</span><span class="sv">${BASELINE_COUNTS[state.baseline] || 0} controls across ${getActiveFamilies().filter(f=>f!=='PM').length} families${Object.values(state.pmControls||{}).filter(Boolean).length ? ' + ' + Object.values(state.pmControls||{}).filter(Boolean).length + ' PM controls' : ''}</span></div>
      <div class="summary-kv"><span class="sk">Organization:</span><span class="sv">${state.orgName||'Not yet set'}</span></div>
      <div class="summary-kv"><span class="sk">Program Owner:</span><span class="sv">${state.programOwner ? state.programOwner + ' — ' + (state.programOwnerTitle||'') + (state.programOwnerEmail ? ' &lt;' + state.programOwnerEmail + '&gt;' : '') : 'Not yet assigned'}</span></div>
    </div>` : ''}
  `;
}

// When "Program Owner also owns domain policies" is toggled, auto-populate domain owners
// with the CISO's info for any unassigned domains. Domains that already
// have a *different* person assigned are left alone so the user can keep
// a mixed assignment.  All fields remain editable in Step 5.
function applyCisoIsISSM() {
  if (!state.cisoIsISSM) return;           // only act when checking the box
  var cisoName  = (state.programOwner || '').trim();
  var cisoEmail = (state.programOwnerEmail || '').trim();
  var cisoTitle = (state.programOwnerTitle || '').trim();
  if (!cisoName) return;                   // nothing to fill if no name yet
  // Track the last CISO name auto-applied so typing can safely update
  // previously auto-filled owners (without clobbering manual overrides).
  var prevAutoName = (state._cisoAutoOwnerName || '').trim();
  var families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  var merges   = state.policyMerges || {};
  var masters  = families.filter(function(f){ return !merges[f]; });
  masters.forEach(function(fam) {
    var o = state.domainOwners[fam] || {};
    // Only auto-fill if unassigned or still showing the suggested-role placeholder
    var sugg = DOMAIN_SUGGESTED_ROLES ? (DOMAIN_SUGGESTED_ROLES[fam] || '') : '';
    var oName = (o.name || '').trim();
    if (!oName || oName === sugg || (prevAutoName && oName === prevAutoName)) {
      state.domainOwners[fam] = { name: cisoName, email: cisoEmail, role: cisoTitle };
    }
    // Also propagate to any merged slave families
    families.filter(function(mf){ return merges[mf] === fam; }).forEach(function(mf) {
      var mo = state.domainOwners[mf] || {};
      var moName = (mo.name || '').trim();
      var slaveSugg = DOMAIN_SUGGESTED_ROLES ? (DOMAIN_SUGGESTED_ROLES[mf] || '') : '';
      if (!moName || moName === slaveSugg || (prevAutoName && moName === prevAutoName)) {
        state.domainOwners[mf] = { name: cisoName, email: cisoEmail, role: cisoTitle };
      }
    });
  });
  state._cisoAutoOwnerName = cisoName;
  markDirty();
}

function selectBaseline(bl) {
  state.baseline = bl;
  // Reset privacy PM controls so they re-apply correctly when Step 2 is next rendered
  resetPrivacyPMDefaults();
  renderCISOStep1();
  renderSidebarBadges();
}

function togglePrivacy() {
  state.privacyOverlay = !state.privacyOverlay;
  // Reset privacy PM controls so renderCISOStep2 re-applies the right tier
  resetPrivacyPMDefaults();
  renderCISOStep1();
}

const PM_PRIVACY_LOW_DEFAULTS = ['PM-18', 'PM-19', 'PM-20', 'PM-20(1)'];
const PM_PRIVACY_MOD_DEFAULTS = ['PM-21', 'PM-22', 'PM-25'];
const PM_PRIVACY_HIGH_DEFAULTS = ['PM-23', 'PM-24', 'PM-26', 'PM-27', 'PM-28'];

function getPrivacyPMDefaults() {
  if (!state.privacyOverlay) return [];
  if (state.baseline === 'H') return PM_PRIVACY_LOW_DEFAULTS.concat(PM_PRIVACY_MOD_DEFAULTS, PM_PRIVACY_HIGH_DEFAULTS);
  if (state.baseline === 'M') return PM_PRIVACY_LOW_DEFAULTS.concat(PM_PRIVACY_MOD_DEFAULTS);
  return PM_PRIVACY_LOW_DEFAULTS.slice();
}

// Mark privacy-specific PM controls as undefined so renderCISOStep2's auto-select
// logic re-evaluates them fresh against the current baseline + overlay state.
function resetPrivacyPMDefaults() {
  if (!state || !state.pmControls) return;
  var privacyPMIds = PM_PRIVACY_LOW_DEFAULTS.concat(PM_PRIVACY_MOD_DEFAULTS, PM_PRIVACY_HIGH_DEFAULTS);
  privacyPMIds.forEach(function(id) {
    state.pmControls[id] = undefined;
  });
}


// PM control statements (abbreviated from NIST 800-53 Rev. 5)
const PM_STATEMENTS = {
  'PM-1':  'Develop and disseminate an organization-wide information security program plan.',
  'PM-2':  'Appoint a senior information security official with mission and resources to coordinate the program.',
  'PM-3':  'Include information security and privacy resources in capital planning and investment requests.',
  'PM-4':  'Implement a process to ensure plans of action and milestones are developed and maintained.',
  'PM-5':  'Develop and maintain an inventory of organizational systems.',
  'PM-6':  'Implement a process to develop, monitor, and report information security measures of performance.',
  'PM-7':  'Develop an enterprise architecture with consideration for information security and privacy risk.',
  'PM-7(1)': 'Offload non-essential functions or services to external providers, and document the security considerations for doing so.',
  'PM-8':  'Address information security in the development of a critical infrastructure protection plan.',
  'PM-9':  'Develop, document, and implement an organization-wide risk management strategy for information security and privacy.',
  'PM-10': 'Manage the security and privacy state of organizational systems through authorization processes.',
  'PM-11': 'Define mission and business processes with consideration for information security and privacy risk.',
  'PM-12': 'Implement an insider threat program including a cross-discipline incident handling team.',
  'PM-13': 'Establish an information security workforce development and improvement program.',
  'PM-14': 'Implement a process for ongoing organizational testing, training, and monitoring activities.',
  'PM-15': 'Establish contacts with security community groups to facilitate ongoing information exchange.',
  'PM-16': 'Implement a threat awareness program including cross-organization information-sharing capability.',
  'PM-17': 'Establish a process for protecting CUI on external systems used by the organization.',
  'PM-18': 'Develop and disseminate an organization-wide privacy program plan.',
  'PM-19': 'Appoint a senior agency official for privacy with mission and resources to coordinate the privacy program.',
  'PM-20': 'Establish mechanisms to make privacy program information available to the public.',
  'PM-21': 'Develop and maintain an accurate accounting of disclosures of PII.',
  'PM-22': 'Establish policies and procedures to ensure PII quality and accuracy.',
  'PM-23': 'Establish a data governance body to coordinate data governance activities organization-wide.',
  'PM-24': 'Ensure that the data integrity board reviews and approves computer matching agreements.',
  'PM-25': 'Minimize the use of PII in testing, training, and research activities.',
  'PM-26': 'Implement a process for receiving and responding to privacy complaints.',
  'PM-27': 'Develop privacy reports and submit to oversight bodies as required.',
  'PM-28': 'Identify and address privacy risk framing to ensure coverage across the organization.',
  'PM-29': 'Appoint a Senior Accountable Official for Risk Management (SAORM) and establish risk management leadership roles.',
  'PM-30': 'Develop an organization-wide supply chain risk management strategy and implementation plan.',
  'PM-30(1)': 'Identify, prioritize, and assess suppliers of critical or mission-essential items.',
  'PM-31': 'Develop an organization-wide continuous monitoring strategy and maintain monitoring programs.',
  'PM-32': 'Analyze organizational systems to identify and address single points of failure and ensure the purposing of each system is clearly defined.',
  'PM-5(1)': 'Establish, maintain, and update an inventory of all organizational systems that create, collect, use, process, store, maintain, disseminate, disclose, or dispose of PII.',
  'PM-16(1)': 'Employ automated mechanisms to maximize the effectiveness of sharing threat intelligence information.',
  'PM-20(1)': 'Develop and maintain privacy policies for organizational websites, mobile applications, and other digital services and make them available to individuals.',
};

// ============================================================
// CISO STEP 2 — PM CONTROLS
// Program Management controls toggle + auto-draft statements.
// ============================================================
function renderCISOStep2() {
  const body = document.getElementById('ciso-step-2-body');
  if (!body) return;
  const pmControls = CONTROLS.filter(c => c.f==='PM');
  const coreControls = pmControls.filter(c => c.bl.some(b=>['L','M','H'].includes(b)));
  const privControls = pmControls.filter(c => c.bl.includes('P') && !c.bl.some(b=>['L','M','H'].includes(b)));

  // Base PM defaults apply at all impact levels.
  // Privacy overlay adds additional controls, tiered by impact level.
  const PM_BASE = ['PM-1', 'PM-2', 'PM-9'];
  const PM_REQUIRED = PM_BASE.concat(getPrivacyPMDefaults());

  // Pre-select defaults only on first load (undefined = not yet set by user)
  pmControls.forEach(c => {
    if (state.pmControls[c.id] === undefined) state.pmControls[c.id] = PM_REQUIRED.includes(c.id);
  });
  // When privacy overlay is newly enabled, auto-select the appropriate privacy PM controls
  // (only if they haven't been explicitly touched by the user, i.e. still false/undefined)
  if (state.privacyOverlay) {
    getPrivacyPMDefaults().forEach(id => {
      if (!state.pmControls[id]) state.pmControls[id] = true;
    });
  }
  const renderRow = (c) => {
    const isRequired = PM_BASE.includes(c.id);
    const isPrivacyDefault = getPrivacyPMDefaults().includes(c.id);
    const rowBg = isRequired ? 'background:rgba(13,148,136,0.04);' : isPrivacyDefault ? 'background:rgba(99,102,241,0.04);' : '';
    return `
    <tr style="${rowBg}">
      <td style="vertical-align:top; padding-top:12px;">
        <label class="cb-label">
          <input type="checkbox" ${state.pmControls[c.id]?'checked':''}
            onchange="state.pmControls['${c.id}']=this.checked"
            style="accent-color:var(--teal);">
          <span class="control-id">${c.id}</span>
          ${isRequired ? '<span style="font-size:10px;background:var(--teal);color:white;padding:1px 5px;border-radius:8px;margin-left:4px;font-weight:700;">CORE</span>' : ''}
          ${isPrivacyDefault ? '<span style="font-size:10px;background:#6366f1;color:white;padding:1px 5px;border-radius:8px;margin-left:4px;font-weight:700;">PRIVACY</span>' : ''}
        </label>
      </td>
      <td>
        <div style="font-weight:600;font-size:13px;">${c.n}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;line-height:1.4;">${PM_STATEMENTS[c.id]||''}</div>
      </td>
    </tr>`;
  };

  body.innerHTML = `
    <div class="section-title">Select Program Management (PM) Controls</div>
    <div class="section-subtitle">PM controls are organization-wide and apply regardless of impact level. Review and select which controls your program will adopt.</div>

    <div class="info-alert">
      <div class="ia-icon">ℹ️</div>
      <div class="ia-text"><strong>PM-1, PM-2, and PM-9 are pre-selected</strong> as they form the foundation of any security program. All other PM controls are optional — select those applicable to your organization. PM controls are organization-wide and apply regardless of impact level.${state.privacyOverlay ? ` <strong style="color:#6366f1;">Privacy overlay is active:</strong> PM-18 through PM-${state.baseline==='H'?'28':state.baseline==='M'?'25':'20(1)'} are also pre-selected — these support the privacy program plan, leadership, disclosures, and PII governance requirements appropriate for your ${state.baseline==='H'?'High':state.baseline==='M'?'Moderate':'Low'} baseline. Policy requirements for these controls are automatically added to your Information Security Policy in Step 3.` : ''}</div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <strong style="font-size:14px;">Core PM Controls (All Baselines)</strong>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="selectAllPM(true)">Select All</button>
        <button class="btn btn-secondary btn-sm" onclick="selectAllPM(false)" style="margin-left:6px;">Deselect All</button>
      </div>
    </div>
    <div class="table-scroll" style="margin-bottom:20px;">
      <table class="control-table">
        <thead><tr><th style="width:120px;">Control ID</th><th>Control Name</th></tr></thead>
        <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">${coreControls.map(renderRow).join('')}</tbody>
      </table>
    </div>

    ${state.privacyOverlay ? `
    <strong style="font-size:14px; display:block; margin-bottom:12px;">Privacy PM Controls (Privacy Overlay)</strong>
    <div class="table-scroll">
      <table class="control-table">
        <thead><tr><th style="width:120px;">Control ID</th><th>Control Name</th></tr></thead>
        <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">${privControls.map(renderRow).join('')}</tbody>
      </table>
    </div>` : ''}

    <div class="summary-box" style="margin-top:20px;">
      <h3>Program Management Summary</h3>
      <div class="summary-kv"><span class="sk">PM Controls Selected:</span><span class="sv">${Object.values(state.pmControls).filter(Boolean).length} of ${pmControls.length}</span></div>
    </div>
  `;
}

function selectAllPM(val) {
  CONTROLS.filter(c=>c.f==='PM').forEach(c => state.pmControls[c.id]=val);
  renderCISOStep2();
}

// ============================================================
// CISO STEP 3 — INFORMATION SECURITY POLICY BUILDER
// Org-wide ISP editor: purpose, scope, roles, requirements,
// documents, revision history. Drag-and-drop sections.
// ============================================================
function renderCISOStep3() {
  const body = document.getElementById('ciso-step-3-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">No Baseline Selected</div><p>Return to Step 1 to choose an impact level (Low, Moderate, or High) that matches your system\'s risk profile.</p></div>';
    return;
  }
  // Init policy state
  if (!state.infoSecPolicy) {
    const minus1 = getActiveControls().filter(c=>c.id.endsWith('-1')).map(c=>c.id);
    const ownerName  = state.programOwner || 'Program Owner';
    const ownerTitle = state.programOwnerTitle || 'Chief Information Security Officer';
    const orgNameVal = state.orgName || 'the organization';
    state.infoSecPolicy = {
      custodian: { name: '', role: '', email: '' },
      sections: [
        { type:'purpose', title:'Purpose', content:`This policy establishes ${orgNameVal}'s commitment to information security and provides the overarching framework for all subordinate security policies. It defines the strategic direction, governance structure, and accountability for the protection of information assets. This policy is built on the NIST Risk Management Framework (SP 800-37 Rev. 2), which provides the lifecycle for managing security risk, and implements the security${state.privacyOverlay ? ' and privacy' : ''} controls cataloged in NIST SP 800-53 Rev. 5.` },
        { type:'scope', title:'Scope', content:`This policy applies to all employees, contractors, third-party service providers, and any individual or system that accesses ${orgNameVal}'s information assets. It encompasses all information systems, business processes, and data regardless of form, format, or location, including cloud-hosted systems, mobile devices, and remote access connections.` },
        { type:'roles', title:'Roles & Responsibilities' },
        { type:'requirements', title:'Policy Requirements' },
        { type:'documents', title:'Related Documents & Standards' },
        { type:'revision-history', title:'Revision History' },
        { type:'controls', title:'Related Controls' },
      ],
      roles: [
        { name:'Executive Leadership', responsibilities:['Approve and endorse the organization information security policy at the highest organizational level','Allocate resources (budget, personnel, technology) sufficient to execute the information security program','Accept enterprise-level risk on behalf of the organization and communicate risk tolerance to the CISO','Champion a security-aware culture across the organization'] },
        { name: ownerTitle || 'Chief Information Security Officer (CISO)', responsibilities:['Draft, approve, and maintain this Tier 1 organizational information security policy','Report to executive leadership on security posture and program effectiveness','Oversee the information security program, including risk management, compliance, and continuous monitoring','Accept and formally document cyber risk decisions within delegated authority','Coordinate incident response at the program level and ensure lessons learned are integrated into policy'] },
        { name:'Information System Security Managers (ISSMs)', responsibilities:['Draft, approve, and maintain Tier 2 domain-level policies for assigned NIST 800-53 control families','Provide program-level oversight of ISSOs and ensure consistent application of this policy across the system portfolio','Review and approve SSPs, POA&Ms, and significant change requests before escalation to the AO','Coordinate common control identification and inheritance documentation across managed systems'] },
        { name:'All Personnel', responsibilities:['Comply with this policy and all subordinate domain policies applicable to their role','Complete security awareness training within required timeframes','Report suspected security incidents, policy violations, or vulnerabilities to the designated reporting channel'] },
      ],
      requirements: [
        { id:'IS-REQ-1', text:`${orgNameVal} shall develop, document, disseminate, review, and update an organization-wide information security program plan that provides an overview of the security requirements for the organization and a description of the security program controls and common controls in place or planned. The plan shall be reviewed and updated at least annually. [NIST 800-53: PM-1]`, controls:['PM-1'] },
        { id:'IS-REQ-2', text:`${orgNameVal} shall designate a senior official with the authority, mission, and resources to coordinate, develop, implement, and maintain an organization-wide information security program. Clear ownership shall be established at the program level, domain level, control level, and asset level. [NIST 800-53: PM-2]`, controls:['PM-2'] },
        { id:'IS-REQ-3', text:`${orgNameVal} shall establish, document, implement, and maintain an information security risk management strategy aligned to organizational risk tolerance and the strategic priorities established by executive leadership. Risk management activities shall be integrated into the system development life cycle and mission/business processes. [NIST 800-53: PM-9]`, controls:['PM-9'] },
        { id:'IS-REQ-4', text:`${orgNameVal} shall develop, document, disseminate, and annually review and update policies and procedures for applicable NIST 800-53 control family domains. Related domains may be combined into a single policy document where appropriate. Each domain policy shall state requirements ('what must be done'), and be supported by implementing procedures ('how to do it'). Policies shall be approved by the CISO and posted in the organization's policy repository. [NIST 800-53: all -1 controls]`, controls: minus1 },
        // Privacy overlay requirements — injected automatically when privacy baseline is selected
        ...(state.privacyOverlay ? [
          { id:'IS-REQ-5', text:`${orgNameVal} shall develop, document, disseminate, review, and update an organization-wide privacy program plan that provides an overview of the privacy requirements for the organization and describes the privacy program controls in place or planned. The plan shall be reviewed and updated at least annually and shall designate a Senior Agency Official for Privacy (SAOP) or equivalent. [NIST 800-53: PM-18, PM-19]`, controls:['PM-18','PM-19'] },
          { id:'IS-REQ-6', text:`${orgNameVal} shall establish mechanisms to make privacy program information available to the public and shall develop and maintain privacy policies for organizational websites, mobile applications, and other digital services. Privacy notices shall be accessible, written in plain language, and updated whenever PII processing activities change. [NIST 800-53: PM-20, PM-20(1)]`, controls:['PM-20','PM-20(1)'] },
          ...((['M','H'].includes(state.baseline)) ? [
            { id:'IS-REQ-7', text:`${orgNameVal} shall maintain an accurate accounting of all disclosures of Personally Identifiable Information (PII) and make that accounting available to individuals upon request. The organization shall also establish and enforce policies and procedures to ensure PII collected or maintained by the organization is accurate, relevant, timely, and complete. [NIST 800-53: PM-21, PM-22]`, controls:['PM-21','PM-22'] },
            { id:'IS-REQ-8', text:`${orgNameVal} shall minimize the use of PII in testing, training, and research activities. Where PII must be used, it shall be authorized, documented, and subjected to the same safeguards as production data. De-identification or synthetic data alternatives shall be used whenever feasible. [NIST 800-53: PM-25]`, controls:['PM-25'] },
          ] : []),
          ...(state.baseline === 'H' ? [
            { id:'IS-REQ-9', text:`${orgNameVal} shall establish a data governance body with authority to coordinate data governance activities organization-wide, including oversight of PII processing, data classification, and information lifecycle management. The organization shall also implement a process for receiving, tracking, and responding to privacy complaints and inquiries from individuals. [NIST 800-53: PM-23, PM-26]`, controls:['PM-23','PM-26'] },
            { id:'IS-REQ-10', text:`${orgNameVal} shall ensure that a Data Integrity Board (or equivalent oversight body) reviews and approves computer matching programs and agreements involving PII before execution. The organization shall submit privacy reports to applicable oversight bodies as required by law, regulation, or organizational policy. [NIST 800-53: PM-24, PM-27]`, controls:['PM-24','PM-27'] },
          ] : []),
        ] : []),
      ],
      documents: [
        { title:'NIST SP 800-53B', desc:'Control Baselines for Information Systems and Organizations — defines Low, Moderate, and High security control baselines.', url:'https://csrc.nist.gov/publications/detail/sp/800-53b/final' },
        { title:'NIST SP 800-53 Rev. 5', desc:'Security and Privacy Controls for Information Systems and Organizations.', url:'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final' },
        { title:'NIST SP 800-37 Rev. 2 (RMF)', desc:'Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach.', url:'https://csrc.nist.gov/publications/detail/sp/800-37/rev-2/final' },
      ],
    };
  }

  // Migration: if old format (no sections array), convert
  if (!state.infoSecPolicy.sections) {
    const old = state.infoSecPolicy;
    state.infoSecPolicy.sections = [
      { type:'purpose', title:'Purpose', content: old.purpose || '' },
      { type:'scope', title:'Scope', content: old.scope || '' },
      { type:'roles', title:'Roles & Responsibilities' },
      { type:'requirements', title:'Policy Requirements' },
      { type:'documents', title:'Related Documents & Standards' },
      { type:'revision-history', title:'Revision History' },
      { type:'controls', title:'Related Controls' },
    ];
    if (!state.infoSecPolicy.documents) {
      state.infoSecPolicy.documents = [
        { title:'NIST SP 800-53B', desc:'Control Baselines for Information Systems and Organizations.' },
        { title:'NIST SP 800-53 Rev. 5', desc:'Security and Privacy Controls for Information Systems and Organizations.' },
        { title:'NIST SP 800-37 Rev. 2 (RMF)', desc:'Risk Management Framework.' },
      ];
    }
  }

  // Ensure custodian object exists (migration for old saves)
  if (!state.infoSecPolicy.custodian) state.infoSecPolicy.custodian = { name: '', role: '', email: '' };

  // Keep CISO role name in sync with Step 1 title
  var cisoTitle = state.programOwnerTitle || 'Chief Information Security Officer';
  if (state.infoSecPolicy.roles && state.infoSecPolicy.roles.length >= 2) {
    state.infoSecPolicy.roles[1].name = cisoTitle;
  }

  const isp = state.infoSecPolicy;
  const activeControls = getActiveControls();
  const allActivePM = Object.keys(state.pmControls).filter(id => state.pmControls[id]);
  const mappedControls = isp.requirements.flatMap(r => r.controls);
  const unmappedPM = allActivePM.filter(id => !mappedControls.includes(id));

  // Build sections HTML
  const sectionsHTML = isp.sections.map((sec, si) => {
    const dragAttr = `draggable="true" ondragstart="ispDragStart(event,'section',${si})" ondragover="ispDragOver(event)" ondrop="ispDrop(event,'section',${si})" ondragend="ispDragEnd(event)"`;
    const hdr = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:2px solid var(--border);padding-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="cursor:grab;color:var(--text-muted);font-size:16px;" title="Drag to reorder">⠿</span>
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);">${si+1}. ${escapeHTML(sec.title)}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          ${renderSectionActions(sec, si)}
        </div>
      </div>`;

    let content = '';
    if (sec.type === 'purpose' || sec.type === 'scope') {
      const hint = sec.type === 'purpose'
        ? 'Define the strategic intent and rationale for this information security policy.'
        : 'Define who and what this policy covers — people, systems, data, and organizational boundaries.';
      content = `
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">${hint}</div>
        <textarea class="form-input" rows="6" style="font-size:13px;line-height:1.8;padding:16px 18px;border-radius:8px;background:white;border:1px solid var(--border);resize:vertical;min-height:120px;" oninput="state.infoSecPolicy.sections[${si}].content=this.value; window.markDirty();">${escapeHTML(sec.content||'')}</textarea>`;
    } else if (sec.type === 'roles') {
      content = renderRolesSection();
    } else if (sec.type === 'requirements') {
      content = renderRequirementsSection(unmappedPM);
    } else if (sec.type === 'documents') {
      content = renderDocumentsSection();
    } else if (sec.type === 'controls') {
      content = renderControlsSection(activeControls, mappedControls, allActivePM);
    } else if (sec.type === 'custom') {
      content = `
        <div style="margin-bottom:8px;">
          <input class="form-input" style="font-size:14px;font-weight:600;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:4px 0;background:transparent;" value="${escapeHTML(sec.title)}" oninput="state.infoSecPolicy.sections[${si}].title=this.value;renderCISOStep3();; window.markDirty();" placeholder="Section title">
        </div>
        <textarea class="form-input" rows="6" style="font-size:13px;line-height:1.8;padding:16px 18px;border-radius:8px;background:white;border:1px solid var(--border);resize:vertical;min-height:100px;" oninput="state.infoSecPolicy.sections[${si}].content=this.value; window.markDirty();" placeholder="Enter section content…">${escapeHTML(sec.content||'')}</textarea>`;
    }

    return `<div class="isp-section" data-section-idx="${si}" ${dragAttr} style="margin-bottom:28px;padding:4px;border-radius:6px;transition:background 0.15s;">${hdr}${content}</div>`;
  }).join('');

  body.innerHTML = `
    <div class="section-title">Information Security Policy</div>
    <div class="section-subtitle">Review and customise your organization's top-level Information Security Policy. This policy governs all domain-specific subordinate policies.</div>

    <!-- ISP Custodian -->
    <div style="border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:20px;background:white;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:4px;">Policy Custodian <span style="font-weight:400;text-transform:none;">(optional)</span></div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Manages day-to-day maintenance, annual reviews, and version control for the ISP.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <input class="form-input" style="flex:2;min-width:160px;font-size:13px;font-weight:600;" placeholder="Full name — e.g. Jordan Patel" value="${escapeHTML(isp.custodian.name||'')}" oninput="setISPCustodian('name',this.value)">
        <input class="form-input" style="flex:2;min-width:160px;font-size:12px;" placeholder="Title / Role — e.g. GRC Analyst" value="${escapeHTML(isp.custodian.role||'')}" oninput="setISPCustodian('role',this.value)">
        <input class="form-input" type="email" style="flex:2;min-width:160px;font-size:12px;" placeholder="email@company.com" value="${escapeHTML(isp.custodian.email||'')}" oninput="setISPCustodian('email',this.value)">
      </div>
    </div>

    <!-- Policy Review Cycle Tracking (ISP) -->
    ${renderReviewCycleCard('ISP', 'Information Security Policy')}

    ${unmappedPM.length > 0 ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;display:flex;gap:10px;align-items:center;margin-bottom:20px;font-size:13px;">
      <span>⚠️</span>
      <div style="flex:1;color:#b91c1c;">
        <strong>Warning:</strong> ${unmappedPM.length} active PM control${unmappedPM.length>1?'s have':' has'} no control objective mapped: <strong>${unmappedPM.join(', ')}</strong>.
      </div>
      <button class="btn btn-sm" onclick="autoDraftUnmappedPM()" style="background:#b91c1c;color:white;border:none;white-space:nowrap;flex-shrink:0;">Auto-Draft Requirements</button>
    </div>` : `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;display:flex;gap:10px;margin-bottom:20px;font-size:13px;">
      <span>✅</span>
      <div style="color:#166534;"><strong>All active PM controls are mapped to policy requirements.</strong></div>
    </div>`}

    <div style="display:flex;gap:10px;margin-bottom:20px;justify-content:space-between;align-items:center;">
      <button class="btn btn-secondary btn-sm" onclick="addCustomSection()" style="display:flex;align-items:center;gap:5px;">+ Add Custom Section</button>
      <div></div>
    </div>

    <div id="isp-sections-container">
      ${sectionsHTML}
    </div>
  `;
  autoExpandTextareas(body);
}

function addPolicyRole() {
  state.infoSecPolicy.roles.push({ name: 'New Role', responsibilities: [''] });
  renderCISOStep3();
}
function removePolicyRole(i) {
  state.infoSecPolicy.roles.splice(i, 1);
  renderCISOStep3();
}
function addResp(roleIdx) {
  state.infoSecPolicy.roles[roleIdx].responsibilities.push('');
  renderCISOStep3();
}
function removeResp(roleIdx, respIdx) {
  state.infoSecPolicy.roles[roleIdx].responsibilities.splice(respIdx, 1);
  renderCISOStep3();
}
function addPolicyReq() {
  const n = state.infoSecPolicy.requirements.length + 1;
  state.infoSecPolicy.requirements.push({ id: `IS-REQ-${n}`, text: '', controls: [] });
  renderCISOStep3();
}
function removeReqControl(reqIdx, controlId) {
  state.infoSecPolicy.requirements[reqIdx].controls = state.infoSecPolicy.requirements[reqIdx].controls.filter(c=>c!==controlId);
  renderCISOStep3();
}
function removeReqAtIndex(idx) {
  if (!state.infoSecPolicy || !state.infoSecPolicy.requirements) return;
  const reqs = state.infoSecPolicy.requirements;
  if (idx < 0 || idx >= reqs.length) return;
  reqs.splice(idx, 1);
  renumberReqs();
  try { markDirty(); } catch (e) {}
  renderCISOStep3();
}
function addReqControl(reqIdx) {
  const cid = prompt('Enter control ID to map (e.g. PM-3, AC-1):');
  if (!cid) return;
  const trimmed = cid.trim().toUpperCase();
  if (!state.infoSecPolicy.requirements[reqIdx].controls.includes(trimmed)) {
    state.infoSecPolicy.requirements[reqIdx].controls.push(trimmed);
  }
  renderCISOStep3();
}

function setISPCustodian(field, value) {
  if (!state.infoSecPolicy) return;
  if (!state.infoSecPolicy.custodian) state.infoSecPolicy.custodian = { name:'', role:'', email:'' };
  state.infoSecPolicy.custodian[field] = value;
  markDirty();
}

// ── Policy helper functions ──────────────────────────────────────────────────

// Drag-and-drop system
let _ispDragType = null, _ispDragIdx = null;
function ispDragStart(e, type, idx) {
  _ispDragType = type; _ispDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.5';
}
function ispDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function ispDragEnd(e) { e.target.style.opacity = '1'; _ispDragType = null; _ispDragIdx = null; }
function ispDrop(e, targetType, targetIdx) {
  e.preventDefault();
  if (_ispDragType !== targetType || _ispDragIdx === null || _ispDragIdx === targetIdx) return;
  const arr = _ispDragType === 'section' ? state.infoSecPolicy.sections
            : _ispDragType === 'role' ? state.infoSecPolicy.roles
            : _ispDragType === 'req' ? state.infoSecPolicy.requirements : null;
  if (!arr) return;
  const item = arr.splice(_ispDragIdx, 1)[0];
  arr.splice(targetIdx, 0, item);
  if (_ispDragType === 'req') renumberReqs();
  _ispDragType = null; _ispDragIdx = null;
  renderCISOStep3();
}

// Move helpers (for arrow buttons)
function moveSectionUp(i) { if (i>0) { const s=state.infoSecPolicy.sections; [s[i-1],s[i]]=[s[i],s[i-1]]; renderCISOStep3(); } }
function moveSectionDown(i) { const s=state.infoSecPolicy.sections; if (i<s.length-1) { [s[i],s[i+1]]=[s[i+1],s[i]]; renderCISOStep3(); } }
function removeSection(i) {
  var section = state.infoSecPolicy.sections[i];
  var title = section ? (section.title || 'Untitled') : '';
  var hasContent = section && section.content && section.content.trim().length > 0;
  var msg = 'Delete section "' + title + '"?';
  if (hasContent) msg += '\n\nThis section contains content that will be permanently lost.';
  if (!confirm(msg)) return;
  var removed = cloneStateValue(section);
  pushScopedUndo({
    label: 'Removed ISP section: ' + title,
    undo: function() {
      if (!state.infoSecPolicy.sections) state.infoSecPolicy.sections = [];
      state.infoSecPolicy.sections.splice(i, 0, removed);
      try { renderCISOStep3(); } catch (eR) {}
    }
  });
  state.infoSecPolicy.sections.splice(i, 1);
  addAuditEntry('isp', null, 'Deleted ISP section: ' + title);
  renderCISOStep3();
}
function addCustomSection() { state.infoSecPolicy.sections.push({ type:'custom', title:'New Section', content:'' }); renderCISOStep3(); }

function moveRole(i,dir) { const r=state.infoSecPolicy.roles; const j=i+dir; if(j>=0&&j<r.length){[r[i],r[j]]=[r[j],r[i]]; renderCISOStep3();} }
function moveReq(i,dir) { const r=state.infoSecPolicy.requirements; const j=i+dir; if(j>=0&&j<r.length){[r[i],r[j]]=[r[j],r[i]]; renumberReqs(); renderCISOStep3();} }
function renumberReqs() { state.infoSecPolicy.requirements.forEach((r,i)=>{ r.id=`IS-REQ-${i+1}`; }); }

// Documents
function addPolicyDoc() {
  if (!state.infoSecPolicy.documents) state.infoSecPolicy.documents = [];
  state.infoSecPolicy.documents.push({ title:'New Document', desc:'Description…' });
  renderCISOStep3();
}
function removePolicyDoc(i) { if(!confirm('Are you sure you want to delete this document reference? This cannot be undone.')) return; state.infoSecPolicy.documents.splice(i,1); renderCISOStep3(); }

// Render section helpers
function renderSectionActions(sec, si) {
  const total = state.infoSecPolicy.sections.length;
  const canDelete = sec.type === 'custom';
  return `
    ${si > 0 ? `<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveSectionUp(${si})" title="Move up">▲</button>` : ''}
    ${si < total-1 ? `<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveSectionDown(${si})" title="Move down">▼</button>` : ''}
    ${canDelete ? `<button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:2px 6px;opacity:0.6;" onclick="removeSection(${si})" title="Remove section">🗑</button>` : ''}
  `;
}

function renderRolesSection() {
  const isp = state.infoSecPolicy;
  // When Program Owner also owns domain policies, collapse the standalone ISSM row
  // and surface a badge on the CISO entry instead.
  const isIssmRow = (role) => /issm|information system security manager/i.test(role.name);
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      ${state.cisoIsISSM
        ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:5px 10px;">
            🔗 CISO is also serving as ISSM — ISSM row hidden. Change in Step 1.
           </div>`
        : '<div></div>'}
      <button class="btn btn-secondary btn-sm" onclick="addPolicyRole()">+ Add Role</button>
    </div>
    <div id="policy-roles-list">
      ${isp.roles.map((role, ri) => {
        // Hide standalone ISSM row when flag is set
        if (state.cisoIsISSM && isIssmRow(role)) return '';
        // Badge on the CISO row
        const isCisoRow = /ciso|chief information security/i.test(role.name);
        const cisoBadge = (state.cisoIsISSM && isCisoRow)
          ? `<span style="font-size:10px;font-weight:600;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:20px;margin-left:6px;">+ ISSM</span>`
          : '';
        return `
      <div draggable="true" ondragstart="ispDragStart(event,'role',${ri})" ondragover="ispDragOver(event)" ondrop="ispDrop(event,'role',${ri})" ondragend="ispDragEnd(event)"
        style="border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:10px;background:#fafbfc;transition:background 0.15s;" data-role-idx="${ri}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="cursor:grab;color:var(--text-muted);font-size:14px;" title="Drag to reorder">⠿</span>
            <input class="form-input" style="font-weight:700;font-size:14px;color:var(--navy);border:none;border-bottom:1px solid var(--border);border-radius:0;padding:2px 4px;background:transparent;width:300px;max-width:100%;" value="${escapeHTML(role.name)}" oninput="state.infoSecPolicy.roles[${ri}].name=this.value; window.markDirty();">
            ${cisoBadge}
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            ${ri > 0 ? `<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveRole(${ri},-1)" title="Move up">▲</button>` : ''}
            ${ri < isp.roles.length-1 ? `<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveRole(${ri},1)" title="Move down">▼</button>` : ''}
            <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:2px 6px;opacity:0.6;" onclick="removePolicyRole(${ri})" title="Remove role">🗑</button>
          </div>
        </div>
        <div>
          ${role.responsibilities.map((resp, rsi) => `
          <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:5px;">
            <span style="color:var(--text-muted);font-size:14px;margin-top:8px;">·</span>
            <textarea class="form-input" rows="1" style="font-size:13px;flex:1;background:white;resize:none;overflow:hidden;line-height:1.5;" oninput="state.infoSecPolicy.roles[${ri}].responsibilities[${rsi}]=this.value;this.style.height='auto';this.style.height=this.scrollHeight+'px';; window.markDirty();" placeholder="Responsibility…" onfocus="this.style.height='auto';this.style.height=this.scrollHeight+'px';">${escapeHTML(resp)}</textarea>
            <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:12px;opacity:0.5;margin-top:6px;" onclick="removeResp(${ri},${rsi})">✕</button>
          </div>`).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top:8px;font-size:11px;" onclick="addResp(${ri})">+ Add responsibility</button>
      </div>`;
      }).join('')}
    </div>`;
}

function renderRequirementsSection(unmappedPM) {
  const isp = state.infoSecPolicy;
  // Active control IDs (baseline + optional PM). Rows whose mappings are all inactive
  // were previously hidden, which made them impossible to delete — always list all rows.
  const allActivePM = Object.keys(state.pmControls || {}).filter(id => state.pmControls[id]);
  const activeControlIds = new Set([...getActiveControls().map(c => c.id), ...allActivePM]);
  const reqsRows = isp.requirements.map((req, oi) => {
    const stale = req.controls.length > 0 && !req.controls.some(cid => activeControlIds.has(cid));
    const borderColor = stale ? '#fca5a5' : (unmappedPM.length > 0 && oi === isp.requirements.length - 1 ? '#fca5a5' : 'var(--border)');
    const staleBanner = stale
      ? '<div style="font-size:11px;color:#b45309;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:8px 10px;margin-bottom:10px;">None of the mapped controls are currently active in your baseline or PM selection. Remove this row or update control mappings.</div>'
      : '';
    const upBtn = oi > 0 ? `<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveReq(${oi},-1)">▲</button>` : '';
    const downBtn = oi < isp.requirements.length - 1 ? `<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveReq(${oi},1)">▼</button>` : '';
    return `
      <div draggable="true" ondragstart="ispDragStart(event,'req',${oi})" ondragover="ispDragOver(event)" ondrop="ispDrop(event,'req',${oi})" ondragend="ispDragEnd(event)"
        style="border:1px solid ${borderColor};border-radius:10px;padding:18px 20px;margin-bottom:14px;background:#fafbfc;transition:background 0.15s;" data-req-idx="${oi}">
        ${staleBanner}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="cursor:grab;color:var(--text-muted);font-size:14px;" title="Drag to reorder">⠿</span>
            <span style="font-size:12px;font-weight:800;color:var(--teal);background:rgba(13,148,136,0.1);padding:4px 12px;border-radius:12px;letter-spacing:0.3px;">${req.id}</span>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${req.controls.map(cid => `<span style="display:inline-flex;align-items:center;gap:3px;background:white;border:1px solid rgba(13,148,136,0.3);border-radius:14px;padding:2px 8px;font-size:11px;font-weight:600;color:var(--teal);font-family:monospace;">${cid}<span style="cursor:pointer;color:var(--red);margin-left:1px;font-family:sans-serif;" onclick="removeReqControl(${oi},'${cid}')">✕</span></span>`).join('')}
              <button onclick="addReqControl(${oi})" style="background:none;border:1px dashed var(--border);border-radius:14px;padding:2px 8px;font-size:11px;color:var(--text-muted);cursor:pointer;">+ control</button>
            </div>
          </div>
          <div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">
            ${upBtn}
            ${downBtn}
            <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:2px 6px;opacity:0.6;" onclick="removeReqAtIndex(${oi})" title="Remove requirement">🗑</button>
          </div>
        </div>
        <textarea class="form-input" rows="4" style="font-size:13px;line-height:1.7;padding:14px 16px;border-radius:8px;background:white;border:1px solid var(--border);resize:vertical;min-height:80px;" oninput="state.infoSecPolicy.requirements[${oi}].text=this.value; window.markDirty();">${escapeHTML(req.text)}</textarea>
      </div>`;
  }).join('');
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:11px;color:var(--text-muted);">Each requirement is a control objective mapped to specific NIST 800-53 controls.</div>
      <button class="btn btn-secondary btn-sm" onclick="addPolicyReq()">+ Add Requirement</button>
    </div>
    <div id="policy-reqs-list">
      ${reqsRows}
    </div>`;
}

function renderDocumentsSection() {
  const docs = state.infoSecPolicy.documents || [];
  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn btn-secondary btn-sm" onclick="addPolicyDoc()">+ Add Document</button>
    </div>
    ${docs.map((d,i) => `
    <div style="display:flex;gap:10px;align-items:flex-start;padding:14px 16px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;background:#fafbfc;">
      <span style="font-size:18px;margin-top:2px;">📄</span>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
        <input class="form-input" style="font-weight:600;font-size:13px;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:2px 0;background:transparent;" value="${escapeHTML(d.title)}" oninput="state.infoSecPolicy.documents[${i}].title=this.value; window.markDirty();" placeholder="Document title">
        <textarea class="form-input" rows="1" style="font-size:12px;color:var(--text-muted);border:none;border-bottom:1px solid #e9ecef;border-radius:0;padding:2px 0;background:transparent;resize:none;overflow:hidden;line-height:1.5;width:100%;" oninput="state.infoSecPolicy.documents[${i}].desc=this.value;this.style.height='auto';this.style.height=this.scrollHeight+'px';; window.markDirty();" onfocus="this.style.height='auto';this.style.height=this.scrollHeight+'px';" placeholder="Short description…">${escapeHTML(d.desc)}</textarea>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;padding:6px 8px;background:#fff;border:1px solid #e0eaff;border-radius:6px;">
          <span style="font-size:13px;flex-shrink:0;">🔗</span>
          <span style="font-size:11px;font-weight:600;color:#6b7280;white-space:nowrap;flex-shrink:0;">Link</span>
          <input class="form-input" style="font-size:12px;color:#3b82f6;border:none;border-radius:0;padding:0;background:transparent;flex:1;min-width:0;" value="${escapeHTML(d.url||'')}" oninput="state.infoSecPolicy.documents[${i}].url=this.value;renderCISOStep3();; window.markDirty();" placeholder="Paste any URL — SharePoint, Confluence, external site…">
          ${d.url ? `<a href="${escapeHTML(d.url)}" target="_blank" style="font-size:11px;color:var(--teal);white-space:nowrap;text-decoration:none;font-weight:600;flex-shrink:0;">↗ Open</a>` : ''}
        </div>
      </div>
      <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:4px;opacity:0.6;flex-shrink:0;" onclick="removePolicyDoc(${i})">🗑</button>
    </div>`).join('')}`;
}

function renderComplianceSection(si) {
  const isp = state.infoSecPolicy;
  if (!isp.complianceNotes) isp.complianceNotes = '';
  const defaultCompliance = `Legal, regulatory, and contractual compliance requirements applicable to this information security program include:\n\n` +
    `• Federal Information Security Modernization Act (FISMA) — requires agencies to implement information security programs consistent with NIST standards.\n` +
    `• OMB Circular A-130 — establishes policy for the management of Federal information resources.\n` +
    `• NIST SP 800-53 Rev. 5 — provides the catalog of security and privacy controls selected as part of this program.\n` +
    `• NIST SP 800-37 Rev. 2 (RMF) — governs the lifecycle process for authorizing systems to operate.\n` +
    (state.privacyOverlay ? `• Privacy Act of 1974 / E-Government Act of 2002 — governs the collection, maintenance, use, and dissemination of personally identifiable information (PII).\n` : '') +
    `\nAll personnel must comply with the above requirements as implemented through this policy and its subordinate domain policies.`;
  return `
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">Enumerate the laws, regulations, standards, and contractual obligations this program must satisfy.</div>
    <textarea class="form-input" rows="10" style="font-size:13px;line-height:1.8;padding:16px 18px;border-radius:8px;background:white;border:1px solid var(--border);resize:vertical;min-height:180px;" oninput="state.infoSecPolicy.complianceNotes=this.value; window.markDirty();" placeholder="List applicable laws, regulations, and standards…">${escapeHTML(isp.complianceNotes || defaultCompliance)}</textarea>`;
}

function renderRevisionHistorySection(si) {
  const isp = state.infoSecPolicy;
  if (!isp.revisionHistory) isp.revisionHistory = [
    { version:'1.0', date:new Date().toISOString().slice(0,10), author:state.programOwner||'Program Owner', changes:'Initial policy draft.' }
  ];
  const rows = isp.revisionHistory.map((r,ri)=>`
    <tr>
      <td style="padding:8px 12px;"><input class="form-input" style="font-size:12px;width:60px;padding:4px 6px;" value="${escapeHTML(r.version||'')}" oninput="state.infoSecPolicy.revisionHistory[${ri}].version=this.value; window.markDirty();" placeholder="1.0"></td>
      <td style="padding:8px 12px;"><input class="form-input" type="date" style="font-size:12px;width:140px;padding:4px 6px;" value="${escapeHTML(r.date||'')}" oninput="state.infoSecPolicy.revisionHistory[${ri}].date=this.value; window.markDirty();"></td>
      <td style="padding:8px 12px;"><input class="form-input" style="font-size:12px;width:160px;padding:4px 6px;" value="${escapeHTML(r.author||'')}" oninput="state.infoSecPolicy.revisionHistory[${ri}].author=this.value; window.markDirty();" placeholder="Author name"></td>
      <td style="padding:8px 12px;"><input class="form-input" style="font-size:12px;flex:1;padding:4px 6px;" value="${escapeHTML(r.changes||'')}" oninput="state.infoSecPolicy.revisionHistory[${ri}].changes=this.value; window.markDirty();" placeholder="Summary of changes…"></td>
      <td style="padding:8px 12px;text-align:center;"><button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;opacity:0.6;" onclick="removeRevisionEntry(${ri})">✕</button></td>
    </tr>`).join('');
  return `
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">Track all significant changes to this policy. This log is required for version-controlled policy governance and audit traceability.</div>
    <div class="table-scroll" style="margin-bottom:10px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid var(--border);">
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);white-space:nowrap;">Version</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Date</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Author</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Changes</th>
            <th style="padding:8px 12px;width:32px;"></th>
          </tr>
        </thead>
        <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">${rows}</tbody>
      </table>
    </div>
    <button class="btn btn-secondary btn-sm" style="border-style:dashed;" onclick="addRevisionEntry()">+ Add Entry</button>`;
}

function addRevisionEntry() {
  if (!state.infoSecPolicy.revisionHistory) state.infoSecPolicy.revisionHistory = [];
  const ver = state.infoSecPolicy.revisionHistory.length;
  state.infoSecPolicy.revisionHistory.push({ version:`1.${ver}`, date:new Date().toISOString().slice(0,10), author:state.programOwner||'', changes:'' });
  renderCISOStep3();
}
function removeRevisionEntry(i) { if(!confirm('Are you sure you want to delete this revision history entry? This cannot be undone.')) return; state.infoSecPolicy.revisionHistory.splice(i,1); renderCISOStep3(); }

function renderControlsSection(activeControls, mappedControls, allActivePM) {
  // Show ALL controls that appear in any requirement mapping, plus active PM controls
  const allMappedSet = new Set(mappedControls);
  allActivePM.forEach(id => allMappedSet.add(id));
  const relatedControls = activeControls.filter(c => allMappedSet.has(c.id));

  return `
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">All controls referenced in policy requirements and active PM controls are listed below (${relatedControls.length} controls).</div>
    <div class="table-scroll" style="max-height:320px;">
      <table class="control-table">
        <thead><tr><th style="width:80px;">Control ID</th><th>Control Name</th><th style="width:100px;">Family</th><th>Control Owner</th></tr></thead>
        <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">
          ${relatedControls.map(c => `
          <tr>
            <td><span class="control-id">${c.id}</span></td>
            <td style="font-size:12px;">${c.n}</td>
            <td><span class="family-badge">${c.f}</span></td>
            <td style="font-size:12px;color:var(--text-muted);">
              <span style="display:inline-flex;align-items:center;gap:4px;">👤 ${(state.domainOwners[c.f]||{}).name || (state.controlOwners||{})[c.id]?.name || 'Unassigned'}</span>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// Auto-draft unmapped PM controls
function autoDraftUnmappedPM() {
  const isp = state.infoSecPolicy;
  const allActivePM = Object.keys(state.pmControls).filter(id => state.pmControls[id]);
  const mapped = isp.requirements.flatMap(r => r.controls);
  const unmapped = allActivePM.filter(id => !mapped.includes(id));
  if (unmapped.length === 0) return;
  const stmts = {
    'PM-1':'The organization shall develop, document, and disseminate an organization-wide information security program plan.',
    'PM-2':'The organization shall appoint a senior information security official with the mission and resources to coordinate the program.',
    'PM-3':'The organization shall include information security and privacy resources in capital planning and investment requests.',
    'PM-4':'The organization shall implement a process to ensure plans of action and milestones are developed and maintained.',
    'PM-5':'The organization shall develop and maintain an inventory of organizational information systems.',
    'PM-6':'The organization shall develop, monitor, and report on information security measures of performance.',
    'PM-7':'The organization shall develop an enterprise architecture with consideration for information security.',
    'PM-8':'The organization shall develop and implement a Critical Infrastructure Protection plan.',
    'PM-9':'The organization shall develop an enterprise-wide risk management strategy for information security.',
    'PM-10':'The organization shall ensure an adequate security authorisation process is established for information systems.',
    'PM-11':'The organization shall define mission and business processes with consideration for information security and privacy.',
    'PM-12':'The organization shall implement an insider threat program.',
    'PM-13':'The organization shall establish an information security workforce development program.',
    'PM-14':'The organization shall periodically test plans of action and milestones.',
    'PM-15':'The organization shall establish contacts with security groups and associations.',
    'PM-16':'The organization shall implement a threat awareness program with cross-organization sharing.',
    'PM-17':'The organization shall authenticate information before taking protective action on security reports.',
  };
  unmapped.forEach(pmId => {
    const n = isp.requirements.length + 1;
    isp.requirements.push({ id:`IS-REQ-${n}`, text: stmts[pmId]||`The organization shall implement ${pmId} per NIST 800-53 Rev. 5.`, controls:[pmId] });
  });
  renderCISOStep3();
}



// Auto-expand all resize:none textareas to fit their content.
// Call after any innerHTML set that may contain them.
function autoExpandTextareas(root) {
  const el = root || document;
  el.querySelectorAll('textarea').forEach(function(ta) {
    if (ta.style.resize === 'none' || ta.style.overflow === 'hidden') {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  });
}

// ============================================================
// DOMAIN POLICY — CONFIG & CONSTANTS
// FAMILY_DESC (one-liners), COMMON_MERGES (lean-team merge
// suggestions), DOMAIN_SUGGESTED_ROLES (who owns what),
// priority tiers and deadline helpers.
// ============================================================
const FAMILY_DESC = {
  AC: 'Who can access what, and under what conditions. Covers user accounts, least privilege, and remote access.',
  AT: 'Security awareness training for all staff, plus role-based training for people with elevated access.',
  AU: 'What events get logged, how long logs are kept, and how they\'re protected from tampering.',
  CA: 'How you assess, authorize, and continuously monitor your systems. Includes security assessments and POA&Ms.',
  CM: 'Rules for how systems are configured, patched, and changed. Covers baselines and change control.',
  CP: 'What happens when systems go down. Covers backups, recovery plans, and continuity testing.',
  IA: 'How users and devices prove who they are. Covers passwords, MFA, and authenticator management.',
  IR: 'How the organization detects, responds to, and recovers from security incidents.',
  MA: 'How systems are maintained, who can do it, and how remote maintenance is controlled.',
  MP: 'How sensitive data is handled on physical media — storage, transport, sanitization, and disposal.',
  PE: 'Physical access to facilities and equipment. Covers badges, visitor logs, and equipment protection.',
  PL: 'Security planning — system security plans, rules of behavior, and concept of operations.',
  PS: 'Security requirements for people: screening, access agreements, termination, and transfers.',
  PT: 'Privacy requirements for collecting, using, and protecting Personally Identifiable Information (PII).',
  RA: 'How the organization identifies and assesses risk — risk assessments, vuln scanning, and threat modeling.',
  SA: 'Security requirements for acquiring and maintaining systems and services, including third-party software.',
  SC: 'Technical controls protecting data in transit and at rest — encryption, segmentation, boundary protection.',
  SI: 'Detecting and fixing flaws and malicious code — patching, malware protection, and security alerts.',
  SR: 'Managing supply chain risk — vendor vetting, component integrity, and third-party service oversight.',
};


const COMMON_MERGES = [
  { label:'Identity & Access',           families:['AC','IA'],       reason:'Access rules and authentication are always one conversation.' },
  { label:'Monitoring & Integrity',      families:['AU','SI'],       reason:'Log collection and system integrity monitoring are the same function.' },
  { label:'Security Operations',         families:['AU','IR'],       reason:'Audit logging and incident response are both core SOC functions.' },
  { label:'Assessment & Planning',       families:['CA','PL'],       reason:'Security assessments and planning belong to the same owner.' },
  { label:'Governance & Assessment',     families:['CA','PL','RA'],  reason:'Risk assessment, security planning, and authorization are all governance functions.' },
  { label:'Resilience',                  families:['CP','IR'],       reason:'Business continuity and incident response are two sides of the same coin.' },
  { label:'Configuration & Maintenance', families:['CM','MA'],       reason:'Configuration baselines and system maintenance are tightly coupled operations.' },
  { label:'Physical & Media Security',   families:['MP','PE'],       reason:'Physical security and media handling are both about stuff you can touch.' },
  { label:'People Security',             families:['AT','PS'],       reason:'Training and HR security are both about your workforce.' },
  { label:'System Security',             families:['SC','SI'],       reason:'System/communications protection and system integrity are both technical controls.' },
  { label:'Systems & Communications',    families:['SA','SC'],       reason:'Acquisition security and communications protection are both engineering concerns.' },
  { label:'Supply Chain & Acquisition',  families:['SA','SR'],       reason:'System acquisition and supply chain risk management share the same vendor oversight process.' },
];


// --- Priority tier helpers ---
const PRIORITY_TIERS = { now: 45, soon: 90, later: 150 };
const PRIORITY_DEFAULTS = { IR:'now', AC:'now', IA:'now', CP:'now', AT:'later', PE:'later' };
const PRIORITY_META = {
  now:   { label:'Now',   bg:'#fee2e2', fg:'#991b1b', bar:'#dc2626', hint:'30–60 days' },
  soon:  { label:'Soon',  bg:'#fef3c7', fg:'#92400e', bar:'#f59e0b', hint:'60–120 days' },
  later: { label:'Later', bg:'#f0fdf4', fg:'#166534', bar:'#22c55e', hint:'120–180 days' },
};

function getPriority(fam) {
  return state.policyPriorities[fam] || PRIORITY_DEFAULTS[fam] || 'soon';
}

function setPolicyPriority(fam, tier) {
  var prev = state.policyPriorities[fam];
  state.policyPriorities[fam] = tier;
  logFieldChange('policyPriorities.' + fam, prev, tier);
  // Reset custom deadline so it recalculates from new tier
  delete state.domainDeadlines[fam];
  renderCISOStep4a();
}

function deadlineFromPriority(fam) {
  if (state.domainDeadlines[fam]) return state.domainDeadlines[fam];
  const days = PRIORITY_TIERS[getPriority(fam)] || 90;
  return new Date(Date.now() + days * 86400000).toISOString().slice(0,10);
}

function setDomainDeadline(fam, date) {
  var prev = state.domainDeadlines[fam];
  state.domainDeadlines[fam] = date;
  logFieldChange('domainDeadlines.' + fam, prev, date);
  markDirty();
}

// --- Owner summary HTML (shared by step 5) ---
function ownerSummaryHTML(masters, families, merges) {
  const groups = {};
  masters.forEach(fam => {
    const o = state.domainOwners[fam] || {};
    const displayName = o.name || '';
    if (!displayName) return;
    const key = displayName.toLowerCase();
    if (!groups[key]) groups[key] = { name: displayName, role: o.role || '', email: o.email || '', families: [] };
    groups[key].families.push(fam);
    families.filter(f => merges[f] === fam).forEach(mf => groups[key].families.push(mf));
  });
  const entries = Object.values(groups);
  if (!entries.length) return '';
  const BUCKET_COLORS = {
    'IAM/Access Lead':          '#dbeafe:#1e40af',
    'GRC/Risk Lead':            '#d1fae5:#065f46',
    'Security Engineering Lead':'#fef3c7:#92400e',
    'Ops/Continuity Lead':      '#ede9fe:#5b21b6',
    'People Lead':              '#fce7f3:#9d174d',
    'Supply Chain/Vendor Lead': '#f0fdf4:#14532d',
    'CISO':                     '#e0e7ff:#3730a3',
  };
  const cardColor = (role) => {
    const found = Object.keys(BUCKET_COLORS).find(k => role && role.toLowerCase().includes(k.toLowerCase()));
    const pair = found ? BUCKET_COLORS[found] : '#f1f5f9:#334155';
    return pair.split(':');
  };
  return `
  <div style="margin-top:24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'grid':'none';this.querySelector('.summary-chev').textContent=this.nextElementSibling.style.display==='none'?'▶':'▼';">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Owner Summary <span style="font-weight:400;color:var(--text-muted);text-transform:none;letter-spacing:0;">(${entries.length} ${entries.length===1?'person':'people'})</span></div>
      <span class="summary-chev" style="font-size:11px;color:var(--text-muted);">▼</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;">
      ${entries.map(e => {
        const [bg, fg] = cardColor(e.role);
        return `<div style="background:${bg};border-radius:10px;padding:12px 14px;">
          <div style="font-size:13px;font-weight:700;color:${fg};margin-bottom:2px;">${escapeHTML(e.name)}</div>
          ${e.role ? `<div style="font-size:11px;color:${fg};opacity:0.8;margin-bottom:6px;">${escapeHTML(e.role)}</div>` : ''}
          ${e.email ? `<div style="font-size:11px;color:${fg};opacity:0.7;margin-bottom:8px;">✉ ${escapeHTML(e.email)}</div>` : ''}
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${e.families.map(f => `<span style="font-family:monospace;font-size:10px;font-weight:700;background:rgba(255,255,255,0.55);color:${fg};border-radius:4px;padding:2px 6px;">${f}</span>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ============================================================
// CISO STEP 4 — Consolidate & Prioritize (merge families, priorities)
// CISO STEP 5 — Assign owners & deadlines
// ============================================================

// --- Step 4: Consolidate & Prioritize ---
function renderCISOStep4a() {
  const body = document.getElementById('ciso-step-4-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">No Baseline Selected</div><p>Complete Step 1 first.</p></div>';
    return;
  }
  const families = getActiveFamilies().filter(f => f !== 'PM');
  const merges = state.policyMerges || {};
  const masters = families.filter(f => !merges[f]);
  const controls = getActiveControls();

  const priorityCounts = { now: 0, soon: 0, later: 0 };
  masters.forEach(f => priorityCounts[getPriority(f)]++);

  body.innerHTML = `
    <div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:16px;">
      <span style="opacity:0.55;margin-right:8px;">Step 4 of 5</span> Consolidate &amp; Prioritize
    </div>

    <div class="section-title">Consolidate &amp; Prioritize Policies</div>
    <div class="section-subtitle">First, merge any domains that belong in a single policy document. Then set the urgency for each — this drives the draft deadlines in the next step.</div>

    <!-- Priority summary pills -->
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
      ${Object.entries(PRIORITY_META).map(([tier,m]) => `
      <div style="background:${m.bg};border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${m.bar};"></div>
        <span style="font-size:12px;font-weight:700;color:${m.fg};">${m.label}</span>
        <span style="font-size:12px;color:${m.fg};opacity:0.8;">${priorityCounts[tier]} domain${priorityCounts[tier]!==1?'s':''} · ${m.hint}</span>
      </div>`).join('')}
    </div>

    <!-- Common merges callout -->
    <div style="border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:#1e40af;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
      <span>💡 Common merges for lean teams</span>
      <button type="button" class="btn btn-primary" style="padding:4px 10px;font-size:11px;" data-ciso-apply-all-merges>Apply All Non-Conflicting</button>
</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${COMMON_MERGES.filter(mg => mg.families.every(f => families.includes(f))).map(mg => {
          const alreadyMerged = mg.families.slice(1).every(f => merges[f] === mg.families[0]);
          const masterFam = mg.families[0];
          const slaveFams = mg.families.slice(1);
          return `<div style="display:flex;align-items:center;gap:10px;background:white;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;">
            <div style="display:flex;gap:4px;flex-shrink:0;">
              ${mg.families.map(f => `<span class="family-badge" style="font-size:11px;">${f}</span>`).join('<span style="font-size:11px;color:#93c5fd;font-weight:700;">+</span>')}
            </div>
            <div style="flex:1;">
              <span style="font-size:12px;font-weight:700;color:#1e40af;">${mg.label}</span>
              <span style="font-size:11px;color:#3b82f6;margin-left:6px;">${mg.reason}</span>
            </div>
            ${alreadyMerged
              ? `<span style="font-size:11px;font-weight:700;color:#166534;background:#dcfce7;border-radius:6px;padding:3px 10px;">✓ Merged</span>`
              : `<button type="button" data-ciso-merge-apply data-master="${masterFam}" data-slaves="${slaveFams.join(',')}" style="font-size:11px;font-weight:700;color:#1e40af;background:#dbeafe;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;white-space:nowrap;">Apply merge</button>`}
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Consolidate + Prioritize table -->
    <div class="table-scroll">
      <table class="control-table" style="table-layout:auto;width:100%;">
        <colgroup>
          <col style="width:38%;">
          <col style="width:40%;">
          <col style="width:22%;">
        </colgroup>
        <thead>
          <tr>
            <th>Policy Domain</th>
            <th>Priority</th>
            <th>Merge Into</th>
          </tr>
        </thead>
        <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">
          ${masters.map(fam => {
            const ctrl = controls.filter(c => c.f === fam);
            const merged = families.filter(f => merges[f] === fam);
            const mergeOptions = families.filter(f => f !== fam && merges[f] !== fam && !merges[f]);
            const tier = getPriority(fam);
            const m = PRIORITY_META[tier];
            const isDefault = !!(PRIORITY_DEFAULTS[fam]);
            return `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
                  <span class="family-badge">${fam}</span>
                  ${merged.map(mf => `<span class="family-badge" style="font-size:11px;background:#e0f2f1;color:var(--teal);border-color:rgba(13,148,136,0.3);">+${mf} <span role="button" tabindex="0" style="cursor:pointer;" data-ciso-unmerge="${mf}">✕</span></span>`).join('')}
                </div>
                <input class="form-input" style="font-size:12px;font-weight:600;margin-bottom:3px;${state.domainCustomNames[fam]?'border-color:#6366f1;background:rgba(99,102,241,0.04);':''}" placeholder="${escapeHTML(getPolicyMergedTitle(fam))}" value="${escapeHTML(state.domainCustomNames[fam]||'')}" oninput="setDomainCustomName('${fam}',this.value);this.style.borderColor=this.value?'#6366f1':'';this.style.background=this.value?'rgba(99,102,241,0.04)':'';">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">${ctrl.length + merged.reduce((s,mf)=>s+controls.filter(c=>c.f===mf).length,0)} controls${state.domainCustomNames[fam] ? ' · <span style="color:#6366f1;">✏ custom name</span>' : ''}</div>
                ${FAMILY_DESC[fam] ? `<div style="font-size:11px;color:#64748b;line-height:1.4;">${[fam, ...merged].map(f => '<strong style="color:#475569;">' + f + ':</strong> ' + (FAMILY_DESC[f]||'')).filter(d => !d.endsWith(' ')).join(' ')}</div>` : ''}
              </td>
              <td>
                <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                  ${Object.entries(PRIORITY_META).map(([t,pm]) => `
                  <button onclick="setPolicyPriority('${fam}','${t}')" style="padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;border:2px solid ${tier===t?pm.bar:'#e2e8f0'};background:${tier===t?pm.bg:'white'};color:${tier===t?pm.fg:'#94a3b8'};transition:all 0.15s;">${pm.label}</button>`).join('')}
                  ${isDefault ? `<span style="font-size:10px;color:var(--text-muted);margin-left:2px;">suggested</span>` : ''}
                </div>
              </td>
              <td>
                ${mergeOptions.length > 0 ? `
                <div class="ciso-merge-dropdown-wrap" style="display:flex;flex-direction:column;gap:6px;align-items:stretch;max-width:220px;">
                  <select class="form-select" style="font-size:11px;padding:4px 6px;" data-ciso-merge-master="${fam}" aria-label="Merge another domain into ${fam}">
                    <option value="">+ Merge…</option>
                    ${mergeOptions.map(f => `<option value="${f}">${f} — ${FAMILIES[f]||f}</option>`).join('')}
                  </select>
                  <button type="button" data-ciso-merge-dropdown-apply data-master="${fam}" style="display:none;font-size:11px;font-weight:700;padding:5px 10px;border-radius:6px;border:1px solid #1e40af;background:#dbeafe;color:#1e40af;cursor:pointer;white-space:nowrap;">
                    Apply merge
                  </button>
                </div>` : '<span style="font-size:11px;color:var(--text-muted);">—</span>'}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="info-alert" style="margin-top:16px;">
      <div class="ia-icon">💡</div>
      <div class="ia-text"><strong>Now</strong> = audit-critical or high-risk (IR, AC, IA, CP). <strong>Soon</strong> = important but not blocking. <strong>Later</strong> = real but low-urgency. These drive the default deadlines in the next step — you can still override per domain.</div>
    </div>

  `;
  updateCISOFinishBtn();
}

// --- Step 5: Assign Owners & Deadlines ---
function renderCISOStep4b() {
  const body = document.getElementById('ciso-step-5-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">No Baseline Selected</div><p>Complete Step 1 first.</p></div>';
    return;
  }
  const families = getActiveFamilies().filter(f => f !== 'PM');
  const merges = state.policyMerges || {};
  const masters = families.filter(f => !merges[f]);
  const controls = getActiveControls();

  const assigned = masters.filter(f => {
    const o = state.domainOwners[f] || {};
    const sugg = DOMAIN_SUGGESTED_ROLES[f] || '';
    return o.name && o.name !== sugg;
  }).length;
  const pct = Math.round(assigned / masters.length * 100);

  const returnedFams = families.filter(f => (state.policyStatus[f]||{}).status === 'Returned');

  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="font-size:12px;font-weight:700;color:var(--navy);">
        <span style="opacity:0.55;margin-right:8px;">Step 5 of 5</span> Assign Owners &amp; Deadlines
      </div>
      ${!state.currentUserId ? `<button type="button" onclick="prefillDemoOwners()" style="font-size:11px;font-weight:700;color:#a5b4fc;background:rgba(165,180,252,0.1);border:1px solid rgba(165,180,252,0.3);border-radius:6px;padding:4px 10px;cursor:pointer;white-space:nowrap;">🧪 Prefill demo data</button>` : ''}
    </div>

    <div class="section-title">Assign Owners &amp; Deadlines</div>
    <div class="section-subtitle">Name the ISSM responsible for each policy domain. Deadlines are pre-filled from your priority settings — override any individually.</div>

    ${returnedFams.length ? `
    <div style="border:1px solid rgba(220,38,38,0.3);border-radius:10px;background:rgba(254,242,242,0.8);padding:14px 18px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:16px;">↩</span>
        <span style="font-size:13px;font-weight:700;color:#991b1b;">Returned for Reassignment (${returnedFams.length})</span>
      </div>
      <div style="font-size:12px;color:#7f1d1d;margin-bottom:10px;">The following policies were returned by their owners. Reassign a new owner below.</div>
      ${returnedFams.map(f => `
      <div style="display:flex;align-items:center;gap:10px;background:white;border:1px solid rgba(220,38,38,0.2);border-radius:8px;padding:10px 14px;margin-bottom:8px;">
        <span class="family-badge" style="background:#fee2e2;color:#991b1b;border-color:rgba(220,38,38,0.3);">${f}</span>
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:700;color:var(--navy);">${getPolicyMergedTitle(f)}</div>
          <div style="font-size:11px;color:#b91c1c;">Returned ${(state.policyStatus[f]||{}).returnedAt||''}</div>
        </div>
        <input class="form-input" id="reassign-input-${f}" style="width:200px;font-size:12px;font-weight:600;" placeholder="New owner name…" value="">
        <button class="btn btn-sm" style="background:#991b1b;color:white;border:none;white-space:nowrap;" onclick="reassignReturnedPolicy('${f}')">Save Reassignment</button>
      </div>`).join('')}
    </div>` : ''}

    <!-- Progress bar -->
    <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Assignment Progress</div>
        <div style="font-size:12px;font-weight:700;color:${pct===100?'#166534':'var(--navy)'};">${assigned} / ${masters.length} domains assigned</div>
      </div>
      <div style="background:#e2e8f0;border-radius:99px;height:6px;overflow:hidden;">
        <div style="background:var(--teal);height:100%;width:${pct}%;border-radius:99px;transition:width 0.3s;"></div>
      </div>
    </div>

    <!-- Owner + deadline table -->
    <div class="table-scroll">
      <table class="control-table" style="table-layout:auto;width:100%;">
        <colgroup>
          <col style="width:26%;">
          <col style="width:26%;">
          <col style="width:28%;">
          <col style="width:20%;">
        </colgroup>
        <thead>
          <tr>
            <th>Policy Domain</th>
            <th>Policy Name</th>
            <th>Owner (ISSM) *</th>
            <th>Draft Deadline</th>
          </tr>
        </thead>
        <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">
          ${masters.map(fam => {
            const o = state.domainOwners[fam] || {};
            const ctrl = controls.filter(c => c.f === fam);
            const merged = families.filter(f => merges[f] === fam);
            const suggRole = DOMAIN_SUGGESTED_ROLES[fam] || 'Security Manager';
            const isReturned = (state.policyStatus[fam]||{}).status === 'Returned';
            const tier = getPriority(fam);
            const pm = PRIORITY_META[tier];
            const deadline = deadlineFromPriority(fam);
            const isCustomDeadline = !!state.domainDeadlines[fam];
            const hasOwner = o.name && o.name !== suggRole;
            return `
            <tr style="${isReturned ? 'background:rgba(254,242,242,0.6);' : hasOwner ? 'background:rgba(13,148,136,0.03);' : ''}">
              <td>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
                  <span class="family-badge" style="${isReturned ? 'background:#fee2e2;color:#991b1b;border-color:rgba(220,38,38,0.3);' : ''}">${fam}</span>
                  <span style="font-size:10px;font-weight:700;background:${pm.bg};color:${pm.fg};border-radius:4px;padding:1px 6px;">${pm.label}</span>
                  ${isReturned ? '<span style="font-size:10px;font-weight:700;color:#b91c1c;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.2);border-radius:4px;padding:1px 6px;">↩ Reassign</span>' : ''}
                  ${merged.map(mf => `<span class="family-badge" style="font-size:11px;background:#e0f2f1;color:var(--teal);border-color:rgba(13,148,136,0.3);">+${mf}</span>`).join('')}
                </div>
                <div style="font-size:11px;color:var(--text-muted);">${ctrl.length + merged.reduce((s,mf)=>s+controls.filter(c=>c.f===mf).length,0)} controls</div>
              </td>
              <td>
                <input class="form-input" style="font-size:12px;font-weight:600;${state.domainCustomNames[fam]?'border-color:#6366f1;background:rgba(99,102,241,0.04);':''}" placeholder="${escapeHTML(getPolicyMergedTitle(fam))}" value="${escapeHTML(state.domainCustomNames[fam]||'')}"
                  oninput="setDomainCustomName('${fam}',this.value)">
                <div style="font-size:10px;color:var(--text-muted);margin-top:3px;">${state.domainCustomNames[fam] ? '✏ Custom name' : 'Leave blank for default'}</div>
              </td>
              <td>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <input class="form-input" style="font-size:12px;font-weight:600;" placeholder="${suggRole} — full name" value="${escapeHTML(hasOwner ? o.name : '')}"
                    oninput="setDomainOwner('${fam}','name',this.value);${merged.map(mf=>`setDomainOwner('${mf}','name',this.value);`).join('')}">
                  <input class="form-input" style="font-size:11px;" placeholder="Title / Role (e.g. ${suggRole})" value="${escapeHTML(o.role && o.role !== o.name ? o.role : '')}"
                    oninput="setDomainOwner('${fam}','role',this.value);${merged.map(mf=>`setDomainOwner('${mf}','role',this.value);`).join('')}">
                  <input class="form-input" type="email" style="font-size:11px;" placeholder="email@company.com" value="${escapeHTML(o.email||'')}"
                    oninput="setDomainOwner('${fam}','email',this.value);${merged.map(mf=>`setDomainOwner('${mf}','email',this.value);`).join('')}">
                  ${o.isDemoPlaceholder ? '<div class="demo-placeholder-badge" style="margin-top:6px;">Demo placeholder — replace before finalize</div>' : ''}
                </div>
              </td>
              <td>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <input type="date" style="border:1px solid ${isCustomDeadline?'#f59e0b':'var(--border)'};border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;color:${isCustomDeadline?'#92400e':'var(--navy)'};background:${isCustomDeadline?'#fffbeb':'white'};width:100%;"
                    value="${deadline}" onchange="setDomainDeadline('${fam}',this.value)">
                  ${isCustomDeadline
                    ? `<span style="font-size:10px;color:#92400e;">✏ Custom date</span>`
                    : `<span style="font-size:10px;color:var(--text-muted);">From priority · ${pm.hint}</span>`}
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="info-alert" style="margin-top:16px;">
      <div class="ia-icon">ℹ️</div>
      <div class="ia-text"><strong>PM controls</strong> are organization-wide and owned by the program owner: <strong>${escapeHTML((state.programOwner||'—') + (state.programOwnerTitle ? ' ('+state.programOwnerTitle+')' : ''))}</strong>.</div>
    </div>

    ${ownerSummaryHTML(masters, families, merges)}
  `;
  updateCISOFinishBtn();
}

function reassignReturnedPolicy(fam) {
  const input = document.getElementById('reassign-input-' + fam);
  const newOwner = (input ? input.value : '').trim();
  if (!newOwner) { showToast('Please enter a new owner name.', true); return; }
  if (!state.domainOwners) state.domainOwners = {};
  state.domainOwners[fam] = { name: newOwner, role: newOwner };
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.policyStatus[fam]) state.policyStatus[fam] = {};
  state.policyStatus[fam].status = 'Not Started';
  delete state.policyStatus[fam].returnedAt;
  showToast('✅ ' + fam + ' reassigned to ' + newOwner + '.');
  renderActiveCisoSetupStep();
}

// Apply all COMMON_MERGES that don't conflict with each other (first-entry-wins).
// Clears any pre-existing conflicting slave entries first so manual merges
// done out-of-order can't permanently block the button.
window.applyAllMerges = function() {
  var families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  if (!state.policyMerges) state.policyMerges = {};

  // Pass 1: clear any slave entries belonging to in-scope COMMON_MERGES so we
  // always start from a clean slate (makes the button idempotent).
  COMMON_MERGES.forEach(function(mg) {
    if (!mg.families.every(function(f){ return families.includes(f); })) return;
    mg.families.slice(1).forEach(function(sf){ delete state.policyMerges[sf]; });
  });

  // Pass 2: apply non-conflicting merges (within COMMON_MERGES, first entry wins
  // when two groups share a slave family, e.g. AU+SI takes SI before SC+SI).
  var applied = 0;
  COMMON_MERGES.forEach(function(mg) {
    if (!mg.families.every(function(f){ return families.includes(f); })) return;
    var masterFam = mg.families[0];
    var slaveFams = mg.families.slice(1);
    var conflict = slaveFams.some(function(sf){
      return state.policyMerges[sf] && state.policyMerges[sf] !== masterFam;
    });
    if (conflict) return;
    slaveFams.forEach(function(sf){
      if (!state.policyMerges[sf]) {
        state.policyMerges[sf] = masterFam;
        var masterOwner = state.domainOwners[masterFam];
        var masterName = masterOwner ? masterOwner.name : (DOMAIN_SUGGESTED_ROLES[masterFam] || '');
        state.domainOwners[sf] = Object.assign({}, masterOwner || {}, { name: masterName });
        if (!state.domainOwners[masterFam]) state.domainOwners[masterFam] = { name: masterName };
        addAuditEntry('program', null, 'Merged ' + sf + ' into ' + masterFam);
        applied++;
      }
    });
  });

  window.markDirty && window.markDirty();
  showToast(applied > 0 ? ('✅ Applied ' + applied + ' recommended merge(s).') : 'Recommended merges already applied.');
  renderActiveCisoSetupStep();
};

function mergePolicy(slaveFam, masterFam) {
  var prevMerge = state.policyMerges ? state.policyMerges[slaveFam] : undefined;
  var prevSlaveOwner = cloneStateValue(state.domainOwners[slaveFam] || {});
  pushScopedUndo({
    label: 'Merged ' + slaveFam + ' into ' + masterFam,
    undo: function() {
      if (!state.policyMerges) state.policyMerges = {};
      if (prevMerge === undefined) delete state.policyMerges[slaveFam];
      else state.policyMerges[slaveFam] = prevMerge;
      state.domainOwners[slaveFam] = prevSlaveOwner;
      try { renderActiveCisoSetupStep(); } catch (eR) {}
    }
  });
  if (!state.policyMerges) state.policyMerges = {};
  state.policyMerges[slaveFam] = masterFam;
  // Copy owner from master, falling back to the suggested role if not yet set
  const masterOwner = state.domainOwners[masterFam];
  const masterName = (masterOwner && masterOwner.name) || DOMAIN_SUGGESTED_ROLES[masterFam] || '';
  state.domainOwners[slaveFam] = Object.assign({}, masterOwner || {}, { name: masterName });
  if (!state.domainOwners[masterFam]) {
    state.domainOwners[masterFam] = { name: masterName };
  }
  addAuditEntry('program', null, 'Merged ' + slaveFam + ' into ' + masterFam);
  try { window.markDirty && window.markDirty(); } catch (e) {}
  renderActiveCisoSetupStep();
}

function unmergePolicy(fam) {
  var prevMaster = state.policyMerges ? state.policyMerges[fam] : undefined;
  pushScopedUndo({
    label: 'Unmerged ' + fam,
    undo: function() {
      if (!state.policyMerges) state.policyMerges = {};
      if (prevMaster) state.policyMerges[fam] = prevMaster;
      else delete state.policyMerges[fam];
      try { renderActiveCisoSetupStep(); } catch (eR) {}
    }
  });
  if (state.policyMerges) delete state.policyMerges[fam];
  addAuditEntry('program', null, 'Unmerged ' + fam + ' from its master policy');
  try { window.markDirty && window.markDirty(); } catch (e) {}
  renderActiveCisoSetupStep();
}

window.mergePolicy = mergePolicy;
window.unmergePolicy = unmergePolicy;

/** Clicks for merge UI use data-* attributes (works when inline handlers are blocked). */
(function initCisoMergeClickDelegation() {
  if (window.__cisoMergeClickDelegationBound) return;
  window.__cisoMergeClickDelegationBound = true;
  document.addEventListener('click', function(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest('[data-ciso-apply-all-merges]')) {
      ev.preventDefault();
      if (typeof window.applyAllMerges === 'function') window.applyAllMerges();
      return;
    }
    var mergeBtn = t.closest('[data-ciso-merge-apply]');
    if (mergeBtn) {
      ev.preventDefault();
      var master = mergeBtn.getAttribute('data-master');
      var slaves = (mergeBtn.getAttribute('data-slaves') || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      if (master && slaves.length && typeof window.mergePolicy === 'function') {
        slaves.forEach(function(sf) { window.mergePolicy(sf, master); });
      }
      return;
    }
    var unmergeEl = t.closest('[data-ciso-unmerge]');
    if (unmergeEl) {
      ev.preventDefault();
      var fam = unmergeEl.getAttribute('data-ciso-unmerge');
      if (fam && typeof window.unmergePolicy === 'function') window.unmergePolicy(fam);
      return;
    }
    var applyDrop = t.closest('[data-ciso-merge-dropdown-apply]');
    if (applyDrop) {
      ev.preventDefault();
      var masterFam = applyDrop.getAttribute('data-master');
      var wrap = applyDrop.parentElement;
      var selEl = wrap && wrap.querySelector('select[data-ciso-merge-master]');
      if (!masterFam || !selEl) return;
      var slaveFam = (selEl.value || '').trim();
      if (!slaveFam) {
        showToast('Choose a domain in the list first, then click Apply merge.', true);
        return;
      }
      if (typeof window.mergePolicy === 'function') window.mergePolicy(slaveFam, masterFam);
      selEl.value = '';
      applyDrop.style.display = 'none';
      return;
    }
  });
  document.addEventListener('change', function(ev) {
    var sel = ev.target;
    if (!sel || sel.tagName !== 'SELECT') return;
    var master = sel.getAttribute('data-ciso-merge-master');
    if (!master) return;
    var wrap = sel.parentElement;
    var btn = wrap && wrap.querySelector('[data-ciso-merge-dropdown-apply]');
    if (btn) btn.style.display = sel.value ? '' : 'none';
  });
})();


function setDomainOwner(fam, field, value) {
  if (!state.domainOwners[fam]) state.domainOwners[fam] = {};
  var path = 'domainOwners.' + fam + '.' + field;
  var prev = state.domainOwners[fam][field];
  state.domainOwners[fam][field] = value;
  if (field === 'name' || field === 'email') {
    delete state.domainOwners[fam].isDemoPlaceholder;
  }
  logFieldChange(path, prev, value);
  if (field === 'name') {
    updateCISOFinishBtn();
    // Auto-populate control owners from domain owner (opt-out model)
    autoPopulateControlOwnersFromDomain(fam);
  }
}

// When a domain owner is assigned, auto-fill all controls in that family
// with the domain owner as the default control owner (unless already assigned to someone else).
function autoPopulateControlOwnersFromDomain(fam) {
  var owner = state.domainOwners[fam];
  if (!owner || !owner.name || !owner.name.trim()) return;
  if (!state.controlOwners) state.controlOwners = {};
  // Get all selected controls for this family (from policy wizard step 2)
  var selected = (state.policySelectedControls || {})[fam] || [];
  // If no controls selected yet, try the baseline controls for this family
  if (!selected.length) {
    selected = getActiveControls().filter(function(c) { return c.f === fam; }).map(function(c) { return c.id; });
  }
  // Also handle merged families
  var merges = state.policyMerges || {};
  var slaveFams = getActiveFamilies().filter(function(f) { return merges[f] === fam; });
  slaveFams.forEach(function(sf) {
    var sfSelected = (state.policySelectedControls || {})[sf] || [];
    if (!sfSelected.length) {
      sfSelected = getActiveControls().filter(function(c) { return c.f === sf; }).map(function(c) { return c.id; });
    }
    selected = selected.concat(sfSelected);
  });
  selected.forEach(function(cid) {
    if (!state.controlOwners[cid] || !state.controlOwners[cid].name) {
      state.controlOwners[cid] = {
        name: owner.name,
        role: owner.role || '',
        email: owner.email || '',
        dueDate: state.policyDeadlines[fam] || ''
      };
      if (owner.isDemoPlaceholder) state.controlOwners[cid].isDemoPlaceholder = true;
      else delete state.controlOwners[cid].isDemoPlaceholder;
    }
  });
}

function prefillDemoOwners() {
  setTimeout(updateCISOFinishBtn, 100);

  // Fake people mapped to each consolidated bucket
  const FAKE_PEOPLE = {
    'IAM/Access Lead':          { name:'Alex Rivera',      role:'IAM/Access Lead',          email:'alex.rivera@example.com' },
    'GRC/Risk Lead':            { name:'Jordan Patel',     role:'GRC/Risk Lead',            email:'jordan.patel@example.com' },
    'Security Engineering Lead':{ name:'Sam Chen',         role:'Security Engineering Lead', email:'sam.chen@example.com' },
    'Ops/Continuity Lead':      { name:'Morgan Williams',  role:'Ops/Continuity Lead',       email:'morgan.williams@example.com' },
    'People Lead':              { name:'Taylor Brooks',    role:'People Lead',               email:'taylor.brooks@example.com' },
    'Supply Chain/Vendor Lead': { name:'Casey Thompson',   role:'Supply Chain/Vendor Lead',  email:'casey.thompson@example.com' },
    'CISO':                     { name: state.programOwner || 'Chris Morgan', role:'CISO',  email: state.programOwnerEmail || 'ciso@example.com' },
  };
  const families = getActiveFamilies().filter(f => f !== 'PM');
  const merges = state.policyMerges || {};
  const masters = families.filter(f => !merges[f]);
  masters.forEach(fam => {
    const bucket = DOMAIN_SUGGESTED_ROLES[fam] || 'GRC/Risk Lead';
    const person = FAKE_PEOPLE[bucket] || FAKE_PEOPLE['GRC/Risk Lead'];
    state.domainOwners[fam] = Object.assign({}, person, { isDemoPlaceholder: true });
    // propagate to merged-in families
    families.filter(f => merges[f] === fam).forEach(mf => { state.domainOwners[mf] = Object.assign({}, person, { isDemoPlaceholder: true }); });
    // Auto-populate control owners from domain owner
    autoPopulateControlOwnersFromDomain(fam);
  });
  showToast('🧪 Demo data prefilled — replace names with real owners before finalizing.');
  renderActiveCisoSetupStep();
}

/** @deprecated */ function prefillFakeOwners() { return prefillDemoOwners(); }

function prefillDemoControlOwners(fam) {
  const title = getPolicyMergedTitle(fam);
  const selected = (state.policySelectedControls || {})[fam] || [];
  if (!state.controlOwners) state.controlOwners = {};
  if (!state.users) state.users = [];

  // Distinct control owner roster — different names from policy owners
  const FAKE_CO_ROSTER = [
    { name: 'Priya Nair',      role: 'control-owner', note: 'Systems Security Engineer',  email: 'priya.nair@example.com' },
    { name: 'Daniel Osei',     role: 'control-owner', note: 'IT Security Analyst',        email: 'daniel.osei@example.com' },
    { name: 'Rachel Kim',      role: 'control-owner', note: 'Compliance Engineer',        email: 'rachel.kim@example.com' },
    { name: 'Marcus Torres',   role: 'control-owner', note: 'Infrastructure Lead',        email: 'marcus.torres@example.com' },
  ];

  // Ensure each person exists in state.users so they can log in
  FAKE_CO_ROSTER.forEach(function(p) {
    const existing = state.users.find(function(u) { return u.name === p.name; });
    if (!existing) {
      state.users.push({
        id: 'u_co_' + p.name.replace(/\s+/g,'_').toLowerCase(),
        name: p.name, role: p.role, note: p.note, email: p.email,
        families: [], controls: []
      });
    }
  });

  // Distribute controls round-robin across the roster
  selected.forEach(function(cid, idx) {
    const p = FAKE_CO_ROSTER[idx % FAKE_CO_ROSTER.length];
    state.controlOwners[cid] = { name: p.name, role: p.note, email: p.email, isDemoPlaceholder: true };
    // Also track in the user's controls list
    const u = state.users.find(function(u) { return u.name === p.name; });
    if (u && !u.controls.includes(cid)) u.controls.push(cid);
  });

  showToast('🧪 Demo data prefilled — control owners assigned for ' + title + '. Replace with real owners before policy submit.');
  renderPolicyStep4();
}

/** @deprecated */ function prefillFakeControlOwners(fam) { return prefillDemoControlOwners(fam); }

function updateOwnerRowStatus(input) {
  const row = input.closest('tr');
  if (row && input.value.trim()) row.style.background = 'rgba(13,148,136,0.03)';
}





// ============================================================
// ============================================================
// DOMAIN POLICY DEFAULTS (pre-populated content per family)
// ============================================================
const DOMAIN_DEFAULTS = {
  AC: { title:'Access Control Policy', abbr:'AC',
    purpose:'This policy establishes requirements for controlling access to organizational information systems, applications, and data. Access shall be granted only to authorized users and devices in accordance with the principle of least privilege and the organization\'s risk tolerance.',
    scope:'All information systems, applications, databases, and network resources owned or operated by the organization. Applies to all employees, contractors, service accounts, and third-party users who access organizational systems.' },
  AT: { title:'Awareness and Training Policy', abbr:'AT',
    purpose:'This policy establishes requirements for an organization-wide security and privacy awareness and training program, ensuring that personnel understand their information security responsibilities and possess the knowledge and skills to fulfill them.',
    scope:'All organizational personnel with access to information systems, including full-time employees, part-time staff, contractors, and temporary workers. Role-based training requirements apply to personnel with elevated privileges or specialized security responsibilities.' },
  AU: { title:'Audit and Accountability Policy', abbr:'AU',
    purpose:'This policy establishes requirements for creating, protecting, retaining, and reviewing audit records for organizational information systems. Audit logs provide the foundation for detecting unauthorized activity, supporting incident response, and demonstrating compliance.',
    scope:'All organizational information systems that process, store, or transmit sensitive information. Includes servers, network devices, applications, cloud services, and end-user computing environments.' },
  CA: { title:'Assessment, Authorization, and Monitoring Policy', abbr:'CA',
    purpose:'This policy establishes requirements for conducting security assessments, authorizing information systems for operation, and continuously monitoring security controls to maintain an acceptable level of risk.',
    scope:'All organizational information systems and environments of operation, including on-premises, cloud-hosted, and hybrid systems. Applies to systems at all impact levels within the organization\'s authorization boundary.' },
  CM: { title:'Configuration Management Policy', abbr:'CM',
    purpose:'This policy establishes requirements for establishing and maintaining baseline configurations for organizational information systems and for controlling changes to those systems throughout their lifecycle.',
    scope:'All hardware, software, firmware, and documentation comprising organizational information systems. Includes servers, workstations, network infrastructure, cloud resources, and embedded devices.' },
  CP: { title:'Contingency Planning Policy', abbr:'CP',
    purpose:'This policy establishes requirements for developing, implementing, and maintaining contingency plans that enable the organization to recover information systems and operations in the event of a disruption, compromise, or failure.',
    scope:'All mission-critical and high-value information systems. Includes backup systems, alternate processing sites, telecommunications services, and personnel with contingency planning responsibilities.' },
  IA: { title:'Identification and Authentication Policy', abbr:'IA',
    purpose:'This policy establishes requirements for uniquely identifying and authenticating organizational users, devices, and processes accessing information systems, ensuring that only legitimate principals are permitted access.',
    scope:'All organizational information systems and network access points. Applies to human users (employees, contractors, administrators), system accounts, device credentials, and inter-system communications.' },
  IR: { title:'Incident Response Policy', abbr:'IR',
    purpose:'This policy establishes requirements for detecting, reporting, analyzing, containing, eradicating, and recovering from information security incidents. A structured incident response capability minimizes harm and enables continuous improvement.',
    scope:'All information systems, networks, and data assets owned or managed by the organization. Applies to all personnel with responsibilities for detecting or responding to security incidents, and to service providers with incident reporting obligations.' },
  MA: { title:'Maintenance Policy', abbr:'MA',
    purpose:'This policy establishes requirements for performing maintenance on organizational information systems, including controls over maintenance personnel, tools, and activities to prevent unauthorized access or system compromise during maintenance operations.',
    scope:'All organizational information systems and system components requiring periodic or corrective maintenance. Includes on-site maintenance, remote (nonlocal) maintenance, and maintenance performed by third-party providers.' },
  MP: { title:'Media Protection Policy', abbr:'MP',
    purpose:'This policy establishes requirements for protecting information system media — both digital and non-digital — throughout its lifecycle, including access control, marking, storage, transport, sanitization, and disposal.',
    scope:'All digital media (hard drives, USB drives, optical media, flash memory) and non-digital media (paper, microfilm) containing organizational information. Applies to media in use, in storage, and during transport.' },
  PE: { title:'Physical and Environmental Protection Policy', abbr:'PE',
    purpose:'This policy establishes requirements for protecting organizational facilities, equipment, and information systems from physical threats and environmental hazards that could compromise the availability, integrity, or confidentiality of information.',
    scope:'All facilities housing organizational information systems and personnel, including primary data centers, alternate processing sites, and office locations with access to sensitive information systems.' },
  PL: { title:'Planning Policy', abbr:'PL',
    purpose:'This policy establishes requirements for developing, documenting, updating, and disseminating security and privacy plans for organizational information systems, and for establishing rules of behavior for system users.',
    scope:'All organizational information systems subject to the NIST Risk Management Framework. Includes system security plans, privacy plans, rules of behavior, and security architecture documentation.' },
  PM: { title:'Program Management Policy', abbr:'PM',
    purpose:'This policy establishes organization-wide requirements for the information security and privacy program, including program leadership, resource allocation, risk management strategy, and measures of performance.',
    scope:'The entire organization and all information systems, personnel, processes, and technologies within the organization\'s risk management purview. PM controls apply at the organizational level, not to individual systems.' },
  PS: { title:'Personnel Security Policy', abbr:'PS',
    purpose:'This policy establishes requirements for screening personnel prior to granting access to organizational information systems, for managing personnel throughout their tenure, and for revoking access upon departure or role change.',
    scope:'All personnel (employees, contractors, volunteers) who are granted access to organizational information systems or sensitive information, regardless of employment type or duration.' },
  PT: { title:'PII Processing and Transparency Policy', abbr:'PT',
    purpose:'This policy establishes requirements for the transparent processing of Personally Identifiable Information (PII), including lawful authority to collect PII, notice to individuals, consent requirements, and limitations on PII processing.',
    scope:'All systems, processes, and personnel involved in the collection, use, maintenance, sharing, or disposal of PII. Applies to both digital and physical records containing PII.' },
  RA: { title:'Risk Assessment Policy', abbr:'RA',
    purpose:'This policy establishes requirements for periodically assessing the risk to organizational operations, assets, and individuals resulting from the operation of information systems and the processing, storage, or transmission of organizational information.',
    scope:'All organizational information systems and business processes. Risk assessments encompass threats, vulnerabilities, likelihoods, impacts, and compensating controls across the organization\'s risk landscape.' },
  SA: { title:'System and Services Acquisition Policy', abbr:'SA',
    purpose:'This policy establishes requirements for incorporating security and privacy considerations into the acquisition of information systems, system components, and information technology services throughout the system development lifecycle.',
    scope:'All organizational acquisitions of information technology products and services, including commercial-off-the-shelf (COTS) software, cloud services, outsourced development, and managed services.' },
  SC: { title:'System and Communications Protection Policy', abbr:'SC',
    purpose:'This policy establishes requirements for protecting organizational information systems and communications at the system and network level, including boundary protection, cryptographic controls, and protection of information at rest and in transit.',
    scope:'All information systems, network infrastructure, and communication channels used to transmit, process, or store organizational information. Includes on-premises, cloud, and hybrid environments.' },
  SI: { title:'System and Information Integrity Policy', abbr:'SI',
    purpose:'This policy establishes requirements for protecting organizational information systems and data from malicious code, unauthorized modification, and loss of integrity through monitoring, flaw remediation, and protective mechanisms.',
    scope:'All organizational information systems and the data they process, store, or transmit. Applies to all system components including operating systems, applications, databases, and network firmware.' },
  SR: { title:'Supply Chain Risk Management Policy', abbr:'SR',
    purpose:'This policy establishes requirements for managing risks associated with the supply chain for organizational information systems, including hardware, software, and services provided by external suppliers and third-party service providers.',
    scope:'All suppliers, vendors, and service providers that develop, produce, or deliver information technology products or services to the organization, and all organizational personnel engaged in supply chain activities.' },
};

const DOMAIN_DEFAULT_GENERIC = {
  title:'Information Security Policy',
  purpose:'This policy establishes security requirements for the organization\'s information systems and personnel in accordance with applicable laws, regulations, and organizational risk tolerance.',
  scope:'All organizational information systems, personnel, and processes within scope of the information security program.',
};

function getISPStatus() {
  var s = ((state.policyStatus || {}).ISP || {});
  var explicit = (s.status || '').trim();
  if (explicit) return explicit;
  if (s.approvedDate || s.approvedAt) return 'Approved';
  if (s.returnedDate) return 'Returned';
  if (s.submittedAt || s.submittedTo) return 'Under Review';
  if (state.infoSecPolicy && state.infoSecPolicy.title) return 'Under Review';
  return 'Not Started';
}

// Who a policy is routed to while status is "Under Review" (plain text — escape at HTML boundaries).
function getPolicyPendingReviewerDisplay(policyKey) {
  if (!policyKey) return '';
  var s = ((state.policyStatus || {})[policyKey] || {});
  var nm = (s.submittedTo || '').trim();
  var role = (s.submittedToRole || '').trim();
  if (nm) return role ? nm + ' — ' + role : nm;
  var rc = (state.policyReviewCycle || {})[policyKey] || {};
  if (rc._customApprover && (rc.approvedBy || '').trim()) {
    var ap = (rc.approvedBy || '').trim();
    var ar = (rc.approverRole || '').trim();
    return ar ? ap + ' — ' + ar : ap;
  }
  var po = (state.programOwner || '').trim();
  var pt = (state.programOwnerTitle || 'CISO').trim();
  if (po) return pt ? po + ' — ' + pt : po;
  return policyKey === 'ISP' ? 'Program owner / CISO' : 'Program owner (CISO)';
}

// ============================================================
// POLICY OWNER TAB
// ============================================================
function renderPolicyTab() {
  var policyNav = document.getElementById('nav-policy');
  var policyLibNav = document.getElementById('nav-policy-library');
  if (policyNav) policyNav.classList.toggle('active', !state._policyLibraryMode);
  if (policyLibNav) policyLibNav.classList.toggle('active', !!state._policyLibraryMode);
  if (state._policyLibraryMode) {
    renderPolicyLibraryCatalog();
    return;
  }
  // Doc viewer takes priority — show read-only policy document
  if (state._policyDocView && state._policyDomain && !state._policyWizardMode) {
    renderPolicyDocViewer(state._policyDomain);
    return;
  }
  // Custodian & ISSM get purpose-built workspaces
  // Check all roles this person holds (handles multi-role login)
  if (state.currentUserId && state.users) {
    var cu = state.users.find(function(u){ return u.id === state.currentUserId; });
    var personRoles = [];
    if (cu) {
      var personIds = state._currentPersonIds || [state.currentUserId];
      personIds.forEach(function(pid) {
        var rec = state.users.find(function(u){ return u.id === pid; });
        if (rec && personRoles.indexOf(rec.role) === -1) personRoles.push(rec.role);
      });
    }
    var hasIssmRole = personRoles.indexOf('issm') !== -1;
    var hasCustodianRole = personRoles.indexOf('custodian') !== -1;
    var hasCisoIsISSM = personRoles.indexOf('ciso') !== -1 && state.cisoIsISSM;
    if (cu && (hasIssmRole || hasCustodianRole || hasCisoIsISSM)) {
      // Allow drill-into-wizard, but default to role-specific home
      if (state._policyWizardMode && state._policyDomain) {
        renderPolicyWizardChrome(currentStep.policy);
        renderPolicyStep(currentStep.policy);
      } else if (hasCustodianRole && !hasIssmRole) {
        renderCustodianWorkspace(cu);
      } else {
        renderISSMWorkspace(cu);
      }
      return;
    }
  }
  const fam = state._policyDomain;
  if (state._policyWizardMode && fam) {
    renderPolicyWizardChrome(currentStep.policy);
    renderPolicyStep(currentStep.policy);
  } else {
    renderPolicyList();
  }
}

// ============================================================
// CUSTODIAN WORKSPACE — dedicated view for Policy Custodians
// ============================================================
function renderCustodianWorkspace(user) {
  // Ensure fresh family assignments
  syncUsersFromState();
  if (state.users) {
    var freshUser = state.users.find(function(u){ return u.id === user.id; });
    if (freshUser) user = freshUser;
  }

  var listPanel = document.getElementById('policy-list-panel');
  var wizPanel = document.getElementById('policy-wizard-panel');
  if (listPanel) listPanel.style.display = '';
  if (wizPanel) wizPanel.style.display = 'none';
  var body = document.getElementById('policy-list-body');
  if (!body) return;

  // Update page header for custodian context
  var hdr = listPanel ? listPanel.querySelector('.page-header') : null;
  if (hdr) hdr.innerHTML = '<div class="role-badge">📂 Custodian</div>'
    + '<h1>My Policy Library</h1>'
    + '<p>Policies assigned to you for maintenance and annual review. Only approved policies appear here.</p>';

  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🏗️</div><div class="es-title">Program Not Ready Yet</div><p>The CISO is still setting up the security program. You\'ll see your assigned policies here once setup is complete.</p></div>';
    return;
  }

  // Check if this custodian manages the ISP (Tier 1)
  var isISPCustodian = (user.families && user.families.includes('ISP'))
    || (state.infoSecPolicy && state.infoSecPolicy.custodian && user.name
        && (state.infoSecPolicy.custodian.name||'').toLowerCase() === user.name.toLowerCase());

  // Resolve which domain families this custodian is responsible for
  var merges = state.policyMerges || {};
  var masterFams = getActiveFamilies().filter(function(f){ return f !== 'PM' && !merges[f]; });
  var assignedFams = [];
  // 1) From user.families (excluding synthetic 'ISP' key)
  if (user.families && user.families.length) {
    masterFams.forEach(function(mf) {
      var slavesOf = getActiveFamilies().filter(function(f){ return (state.policyMerges||{})[f] === mf; });
      var group = [mf].concat(slavesOf);
      if (group.some(function(f){ return user.families.includes(f); })) assignedFams.push(mf);
    });
  }
  // 2) Fallback: name match in policyCustodians
  if (!assignedFams.length) {
    masterFams.forEach(function(fam) {
      var c = getCustodian(fam);
      if (c.name && user.name && c.name.toLowerCase() === user.name.toLowerCase()) assignedFams.push(fam);
    });
  }

  var today = new Date().toISOString().slice(0,10);
  var slavesOf = {};
  getActiveFamilies().forEach(function(f){ if ((state.policyMerges||{})[f]) { var m=(state.policyMerges||{})[f]; if (!slavesOf[m]) slavesOf[m]=[]; slavesOf[m].push(f); } });

  // Split assigned fams into approved (visible in library) vs pending (not yet approved)
  var approvedFams = assignedFams.filter(function(f){ return ((state.policyStatus[f]||{}).status||'') === 'Approved'; });
  var pendingFams  = assignedFams.filter(function(f){ return ((state.policyStatus[f]||{}).status||'') !== 'Approved'; });

  // Build an approved policy card
  function buildCustCard(fam) {
    var slaves = slavesOf[fam] || [];
    var allBadges = [fam].concat(slaves).map(function(f){ return '<span class="family-badge" style="font-size:11px;padding:2px 6px;">' + f + '</span>'; }).join(' ');
    var status = (state.policyStatus[fam]||{}).status || 'Not Started';
    var deadline = state.policyDeadlines[fam] || '';
    var dp = (state.domainPolicies||{})[fam];
    var version = dp ? (dp.version || '1.0') : '—';
    var reviewCycle = dp ? (dp.reviewCycle || 'Annual') : 'Annual';
    var owner = (state.domainOwners[fam]||{}).name || 'Unassigned';
    var isOverdue = deadline && deadline < today;
    var isDueSoon = deadline && !isOverdue && deadline <= new Date(Date.now() + 14*86400000).toISOString().slice(0,10);
    var title = getPolicyMergedTitle(fam);
    var deadlineHTML = deadline
      ? (isOverdue ? '<span style="color:#ef4444;font-weight:700;">⚠ Overdue — was due ' + new Date(deadline+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) + '</span>'
         : isDueSoon ? '<span style="color:#f59e0b;font-weight:600;">Due soon: ' + new Date(deadline+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) + '</span>'
         : '<span style="color:var(--text-muted);">Next review: ' + new Date(deadline+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) + '</span>')
      : '<span style="color:var(--text-muted);">No review date set</span>';
    var borderColor = isOverdue ? '#ef4444' : 'rgba(13,148,136,0.3)';
    var bgColor     = isOverdue ? '#fef2f2' : 'rgba(13,148,136,0.02)';
    return '<div style="background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:12px;padding:18px 20px;cursor:pointer;transition:box-shadow 0.15s,border-color 0.15s;"'
      + ' onclick="enterPolicyWizard(\'' + fam + '\')"'
      + ' onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,0.08)\';this.style.borderColor=\'var(--teal)\';"'
      + ' onmouseleave="this.style.boxShadow=\'\';this.style.borderColor=\'' + borderColor + '\';">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '<div style="display:flex;align-items:center;gap:6px;">' + allBadges + '</div>'
      + chipHTML(status)
      + '</div>'
      + '<div style="font-weight:700;font-size:15px;color:var(--navy);margin-bottom:4px;">' + _esc(title) + '</div>'
      + '<div style="font-size:12px;margin-bottom:10px;">' + deadlineHTML + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);">v' + _esc(version) + ' · ' + _esc(reviewCycle) + ' review · Owner: ' + _esc(owner) + '</div>'
      + '</div>';
  }

  var html = '<div style="max-width:780px;">';

  // ISP custodian card
  if (isISPCustodian) {
    var isp = state.infoSecPolicy;
    var ispSt = getISPStatus();
    var ispBg = (ispSt === 'Approved' || ispSt === 'Published') ? 'rgba(13,148,136,0.02)' : 'var(--bg-muted)';
    var ispBorder = (ispSt === 'Approved' || ispSt === 'Published') ? 'rgba(13,148,136,0.3)' : 'var(--border)';
    html += '<div style="margin-bottom:20px;">'
      + '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:10px;">Tier 1 — Organization Policy</div>'
      + '<div style="background:' + ispBg + ';border:1px solid ' + ispBorder + ';border-radius:12px;padding:18px 20px;cursor:pointer;transition:box-shadow 0.15s;" onclick="goToCISOPolicyEditor()" onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,0.08)\'" onmouseleave="this.style.boxShadow=\'\'">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '<span style="background:#e0f2fe;color:#0369a1;font-family:monospace;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;">ISP</span>'
      + chipHTML(ispSt)
      + '</div>'
      + '<div style="font-weight:700;font-size:15px;color:var(--navy);margin-bottom:4px;">Information Security Policy</div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Tier 1 · Owned by ' + _esc(state.programOwner||'CISO') + '</div>'
      + '<button class="btn btn-primary btn-sm" style="width:100%;" onclick="event.stopPropagation();goToCISOPolicyEditor()">View Policy →</button>'
      + '</div></div>';
  }

  // No approved policies yet (for domain policies)
  if (!approvedFams.length && !assignedFams.length && !isISPCustodian) {
    html += '<div style="text-align:center;padding:60px 24px;">'
      + '<div style="font-size:40px;margin-bottom:16px;">📋</div>'
      + '<div style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:8px;">No policies assigned yet</div>'
      + '<div style="font-size:13px;color:var(--text-muted);">Your ISSM or CISO will assign policies to you once they\'re ready for custodian handoff.</div>'
      + '</div>';
    html += '</div>';
    body.innerHTML = html;
    return;
  }

  if (assignedFams.length) {
    // Stats strip
    var approvedCount = approvedFams.length;
    var pendingCount  = pendingFams.length;
    html += '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:10px;">Domain Policies</div>';
    html += '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
    if (approvedCount) html += '<div style="background:rgba(13,148,136,0.06);border:1px solid rgba(13,148,136,0.2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:var(--teal);">✓ ' + approvedCount + ' approved</div>';
    if (pendingCount)  html += '<div style="background:var(--bg-muted);border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:var(--text-muted);">🕐 ' + pendingCount + ' pending approval</div>';
    html += '</div>';
  }

  var approvedCount = approvedFams.length;
  var pendingCount  = pendingFams.length;

  // Approved policies grid
  if (approvedFams.length) {
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px;margin-bottom:28px;">';
    approvedFams.forEach(function(f){ html += buildCustCard(f); });
    html += '</div>';
  } else if (assignedFams.length) {
    html += '<div style="padding:40px 24px;text-align:center;border:1px dashed var(--border);border-radius:12px;margin-bottom:24px;">'
      + '<div style="font-size:28px;margin-bottom:10px;">🕐</div>'
      + '<div style="font-size:14px;font-weight:600;color:var(--navy);margin-bottom:6px;">No approved policies yet</div>'
      + '<div style="font-size:13px;color:var(--text-muted);">' + pendingCount + ' ' + (pendingCount === 1 ? 'policy is' : 'policies are') + ' being drafted by your ISSM. They\'ll appear here once approved by the CISO.</div>'
      + '</div>';
  }

  // Pending policies — quiet list, not clickable
  if (pendingFams.length) {
    html += '<div style="margin-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Pending Approval</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:24px;">';
    pendingFams.forEach(function(f) {
      var status = (state.policyStatus[f]||{}).status || 'Not Started';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:white;">'
        + '<span class="family-badge" style="font-size:11px;">' + f + '</span>'
        + '<span style="flex:1;font-size:13px;font-weight:600;color:var(--text-muted);">' + _esc(getPolicyMergedTitle(f)) + '</span>'
        + chipHTML(status)
        + '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  body.innerHTML = html;
}

// ============================================================
// ISSM WORKSPACE — dedicated view for Domain Policy Owners
// ============================================================
function renderISSMWorkspace(user) {
  // Ensure the user record has fresh family assignments from current state
  syncUsersFromState();
  if (state.users) {
    var freshUser = state.users.find(function(u){ return u.id === user.id; });
    if (freshUser) user = freshUser;
  }
  // Merge families from all sibling records (same person, different roles)
  if (state._currentPersonIds && state._currentPersonIds.length > 1) {
    var mergedFamilies = (user.families || []).slice();
    state._currentPersonIds.forEach(function(pid) {
      var sib = (state.users || []).find(function(u){ return u.id === pid; });
      if (sib && sib.families) {
        sib.families.forEach(function(f){ if (mergedFamilies.indexOf(f) === -1) mergedFamilies.push(f); });
      }
    });
    // Create a shallow copy so we don't mutate the real record
    user = Object.assign({}, user, { families: mergedFamilies });
  }

  var listPanel = document.getElementById('policy-list-panel');
  var wizPanel = document.getElementById('policy-wizard-panel');
  if (listPanel) listPanel.style.display = '';
  if (wizPanel) wizPanel.style.display = 'none';
  var body = document.getElementById('policy-list-body');
  if (!body) return;

  // Update page header for ISSM context
  var hdr = listPanel ? listPanel.querySelector('.page-header') : null;
  if (hdr) hdr.innerHTML = '<div class="role-badge">🛡️ ISSM</div>'
    + '<h1>Your Policy Domains</h1>'
    + '<p>Build and manage the domain-level security policies assigned to you.</p>';

  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🏗️</div><div class="es-title">Program Not Ready Yet</div><p>The CISO is still setting up the security program. You\'ll see your assigned policy domains here once setup is complete.</p></div>';
    return;
  }

  // Resolve families: prefer user.families (populated by syncUsersFromState), then match by name in domainOwners
  var merges = state.policyMerges || {};
  var allFamilies = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  var masterFams = allFamilies.filter(function(f){ return !merges[f]; });
  var slavesOf = {};
  allFamilies.forEach(function(f){ if (merges[f]) { if (!slavesOf[merges[f]]) slavesOf[merges[f]] = []; slavesOf[merges[f]].push(f); } });

  var assignedFams = [];
  // 1) Use families array from user record (set by syncUsersFromState from domainOwners)
  if (user.families && user.families.length) {
    // Expand to master families (in case user.families has slave fams)
    masterFams.forEach(function(mf) {
      var group = [mf].concat(slavesOf[mf] || []);
      if (group.some(function(f){ return user.families.includes(f); })) assignedFams.push(mf);
    });
  }
  // 2) Fallback: match by name in domainOwners
  if (!assignedFams.length) {
    masterFams.forEach(function(mf) {
      var o = state.domainOwners[mf] || {};
      if (o.name && user.name && o.name.toLowerCase() === user.name.toLowerCase()) assignedFams.push(mf);
    });
  }

  if (!assignedFams.length) {
    body.innerHTML = '<div style="max-width:600px;margin:0 auto;text-align:center;padding:60px 24px;">'
      + '<div style="font-size:40px;margin-bottom:16px;">📋</div>'
      + '<div style="font-size:18px;font-weight:700;color:var(--navy);margin-bottom:8px;">Welcome, ' + _esc(user.name.split(' ')[0]) + '</div>'
      + '<div style="font-size:14px;color:var(--text-muted);line-height:1.6;">No policy domains have been assigned to you yet. Your CISO will assign domains during program setup.</div>'
      + '</div>';
    return;
  }

  var today = new Date().toISOString().slice(0,10);
  var allControls = getActiveControls();

  // Tally stats
  var totalControls = 0;
  var submittedCount = 0;
  var draftCount = 0;
  var needsWork = [];
  var ready = [];

  var cards = '';
  assignedFams.forEach(function(fam) {
    var dd = DOMAIN_DEFAULTS[fam] || DOMAIN_DEFAULT_GENERIC;
    var slaves = slavesOf[fam] || [];
    var allBadges = [fam].concat(slaves).map(function(f){ return '<span class="family-badge" style="font-size:11px;padding:2px 6px;">' + f + '</span>'; }).join(' ');
    var status = (state.policyStatus[fam]||{}).status || 'Not Started';
    var deadline = state.policyDeadlines[fam] || '';
    var dp = (state.domainPolicies||{})[fam];
    var selected = (state.policySelectedControls||{})[fam] || [];
    var ctrlCount = allControls.filter(function(c){ return c.f === fam || slaves.includes(c.f); }).length;
    totalControls += ctrlCount;

    // Count assigned control owners for this domain
    var assignedOwners = selected.filter(function(cid){ return state.controlOwners[cid] && state.controlOwners[cid].name; }).length;
    var ownerPct = selected.length ? Math.round(assignedOwners / selected.length * 100) : 0;

    var isOverdue = deadline && deadline < today;
    var isDueSoon = deadline && !isOverdue && deadline <= new Date(Date.now() + 14*86400000).toISOString().slice(0,10);

    if (status === 'Approved' || status === 'Under Review') submittedCount++;
    else draftCount++;
    // Approved policies never go to needsWork even if the deadline has passed
    if (status !== 'Approved' && (isOverdue || status === 'Returned' || status === 'Not Started')) needsWork.push(fam);
    else ready.push(fam);

    var borderColor = isOverdue ? '#ef4444' : status === 'Returned' ? '#f59e0b' : status === 'Approved' ? 'rgba(13,148,136,0.3)' : status === 'Under Review' ? 'rgba(99,102,241,0.3)' : 'var(--border)';
    var bgColor = isOverdue ? '#fef2f2' : status === 'Returned' ? '#fffbeb' : status === 'Approved' ? 'rgba(13,148,136,0.02)' : 'white';

    var deadlineHTML = '';
    if (deadline) {
      var d = new Date(deadline + 'T00:00:00');
      var dlabel = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
      if (isOverdue) deadlineHTML = '<span style="color:#ef4444;font-weight:700;">⚠ Overdue — was due ' + dlabel + '</span>';
      else if (isDueSoon) deadlineHTML = '<span style="color:#f59e0b;font-weight:600;">Due soon: ' + dlabel + '</span>';
      else deadlineHTML = '<span style="color:var(--text-muted);">Due: ' + dlabel + '</span>';
    } else {
      deadlineHTML = '<span style="color:var(--text-muted);">No deadline set</span>';
    }

    var title = getPolicyMergedTitle(fam);
    var btnLabel = status === 'Not Started' ? 'Start Policy →' : status === 'Approved' ? 'View Policy →' : 'Continue Editing →';

    // Owner assignment progress bar
    var ownerBar = '<div style="margin-top:8px;margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:3px;">'
      + '<span>Control owners assigned</span><span>' + assignedOwners + '/' + selected.length + '</span></div>'
      + '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">'
      + '<div style="height:100%;width:' + ownerPct + '%;background:' + (ownerPct === 100 ? 'var(--teal)' : ownerPct > 0 ? '#f59e0b' : '#ef4444') + ';border-radius:2px;transition:width 0.3s;"></div>'
      + '</div></div>';

    cards += '<div style="background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:12px;padding:18px 20px;transition:box-shadow 0.15s;"'
      + ' onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,0.06)\'" onmouseleave="this.style.boxShadow=\'\'">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '<div style="display:flex;align-items:center;gap:6px;">' + allBadges + '</div>'
      + chipHTML(status)
      + '</div>'
      + (status === 'Under Review'
        ? '<div style="font-size:11px;color:#6366f1;margin:-2px 0 8px 0;line-height:1.45;">Awaiting review by <strong>' + _esc(getPolicyPendingReviewerDisplay(fam)) + '</strong>'
        + (((state.policyStatus[fam]||{}).submittedAt) ? '<span style="color:var(--text-muted);font-weight:500;"> · submitted ' + _esc((state.policyStatus[fam]||{}).submittedAt) + '</span>' : '')
        + '</div>'
        : '')
      + '<div style="font-weight:700;font-size:15px;color:var(--navy);margin-bottom:4px;">' + _esc(title) + '</div>'
      + '<div style="font-size:12px;margin-bottom:4px;line-height:1.5;">' + deadlineHTML + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">' + selected.length + ' controls selected · ' + ctrlCount + ' in baseline</div>'
      + '<div style="font-size:11px;display:flex;align-items:center;">' + reviewStatusDot(fam) + '<span style="color:' + getReviewStatus(fam).color + ';">' + getReviewStatus(fam).label + '</span></div>'
      + ownerBar
      + '<button class="btn btn-primary btn-sm" style="width:100%;" onclick="enterPolicyWizard(\'' + fam + '\')">' + btnLabel + '</button>'
      + '</div>';
  });

  // Header
  var html = '<div style="max-width:780px;">';
  html += '<div style="margin-bottom:24px;">'
    + '<div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:4px;">Your Policy Domains</div>'
    + '<div style="font-size:13px;color:var(--text-muted);line-height:1.5;">You own ' + assignedFams.length + ' domain ' + (assignedFams.length === 1 ? 'policy' : 'policies') + '. Select controls, draft your policy, assign control owners, then submit to the CISO for approval.</div>'
    + '</div>';

  // Stats
  html += '<div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">';
  html += '<div style="background:var(--bg-muted);border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:var(--navy);">' + assignedFams.length + ' ' + (assignedFams.length === 1 ? 'policy' : 'policies') + '</div>';
  if (submittedCount) html += '<div style="background:rgba(13,148,136,0.06);border:1px solid rgba(13,148,136,0.2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:var(--teal);">' + submittedCount + ' submitted</div>';
  if (draftCount) html += '<div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;color:#6366f1;">' + draftCount + ' in progress</div>';
  html += '</div>';

  // Needs work section
  if (needsWork.length) {
    html += '<div style="margin-bottom:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#ef4444;">Needs Work</div>';
  }

  // All cards in a grid
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px;margin-bottom:32px;">'
    + cards + '</div>';

  // ── Program-wide Policy Library (all policies + status) ──
  html += '<div style="margin-bottom:8px;">'
    + '<div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:4px;">Program Policy Library</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">All organizational policies and their current status.</div>'
    + '</div>';

  // ISP row — prefer explicit policyStatus.ISP (Under Review / Approved / Returned) before falling back to title-based derivation.
  var ispStatus = getISPStatus();
  function issmStatusChip(st, policyKey) {
    if (st === 'Approved' || st === 'Published') return '<span style="background:rgba(13,148,136,0.08);border:1px solid rgba(13,148,136,0.25);color:var(--teal);padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + st + '</span>';
    if (st === 'Under Review') {
      var chip = '<span style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);color:#6366f1;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + st + '</span>';
      if (policyKey) {
        var who = getPolicyPendingReviewerDisplay(policyKey);
        if (who) chip += '<div style="font-size:10px;color:#64748b;margin-top:4px;line-height:1.35;">' + _esc(who) + '</div>';
      }
      return chip;
    }
    if (st === 'In Progress' || st === 'Draft') return '<span style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);color:#d97706;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + st + '</span>';
    return '<span style="background:rgba(100,116,139,0.06);border:1px solid rgba(100,116,139,0.2);color:#64748b;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + st + '</span>';
  }

  var libRows = '<tr onclick="goToCISOPolicyEditor()" style="cursor:pointer;" onmouseover="this.style.background=\'rgba(13,148,136,0.03)\'" onmouseout="this.style.background=\'\'">'
    + '<td style="padding:10px 14px;"><span style="font-family:monospace;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:4px;">ISP</span></td>'
    + '<td style="padding:10px 14px;font-weight:600;font-size:13px;color:var(--primary);">Information Security Policy</td>'
    + '<td style="padding:10px 14px;font-size:12px;color:var(--text-muted);">' + _esc(state.programOwner||'CISO') + '</td>'
    + '<td style="padding:10px 14px;">' + issmStatusChip(ispStatus, 'ISP') + '</td>'
    + '</tr>';

  masterFams.forEach(function(mf) {
    var domainSlaves = slavesOf[mf] || [];
    var st = (state.policyStatus[mf]||{}).status || 'Not Started';
    var ownerName = (state.domainOwners[mf]||{}).name || '—';
    var title = getPolicyMergedTitle(mf);
    var isMyDomain = assignedFams.includes(mf);
    var badgeStr = [mf].concat(domainSlaves).map(function(f){ return '<span style="font-family:monospace;font-size:10px;font-weight:700;background:rgba(30,58,95,0.08);color:var(--navy);padding:1px 5px;border-radius:3px;">' + f + '</span>'; }).join(' ');
    var canEdit = isMyDomain && (st !== 'Approved');
    var notStarted = 'Not Started';
    var rowClick = 'onclick="' + (canEdit ? 'enterPolicyWizard(\'' + mf + '\')' : (st !== notStarted ? 'enterPolicyWizard(\'' + mf + '\')' : '')) + '"';
    var canLink = canEdit || st !== notStarted;
    libRows += '<tr ' + (canLink ? rowClick : '') + ' style="cursor:' + (canLink ? 'pointer' : 'default') + (isMyDomain ? ';background:rgba(99,102,241,0.02)' : '') + ';" onmouseover="this.style.background=\'rgba(13,148,136,0.03)\'" onmouseout="this.style.background=\'' + (isMyDomain ? 'rgba(99,102,241,0.02)' : '') + '\';">'
      + '<td style="padding:10px 14px;">' + badgeStr + (isMyDomain ? ' <span style="font-size:10px;color:#6366f1;font-weight:600;">★ yours</span>' : '') + '</td>'
      + '<td style="padding:10px 14px;font-weight:600;font-size:13px;color:' + (isMyDomain ? 'var(--primary)' : 'var(--navy)') + ';">' + _esc(title) + '</td>'
      + '<td style="padding:10px 14px;font-size:12px;color:var(--text-muted);">' + _esc(ownerName) + '</td>'
      + '<td style="padding:10px 14px;">' + issmStatusChip(st, mf) + '</td>'
      + '</tr>';
  });

  html += '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<thead><tr style="background:var(--bg-muted);">'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Family</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Policy</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Owner</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Status</th>'
    + '</tr></thead>'
    + '<tbody id="tbod-${Math.random().toString(36).slice(2,8)}">' + libRows + '</tbody></table></div>';

  html += '</div>';
  body.innerHTML = html;
}

function renderPolicyLibraryCatalog() {
  const listPanel = document.getElementById('policy-list-panel');
  const wizPanel = document.getElementById('policy-wizard-panel');
  if (listPanel) listPanel.style.display = '';
  if (wizPanel) wizPanel.style.display = 'none';
  const body = document.getElementById('policy-list-body');
  if (!body) return;
  var hdr = listPanel ? listPanel.querySelector('.page-header') : null;
  if (hdr) {
    hdr.innerHTML = '<h1>Policy Library</h1>'
      + '<p>Global policy catalog with governance ownership and status tracking.</p>';
  }
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div><p>Complete program setup to initialize policy library content.</p></div>';
    return;
  }
  const families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  const merges = state.policyMerges || {};
  const masterFams = families.filter(function(f){ return !merges[f]; });
  const slavesOf = {};
  families.forEach(function(f){ if (merges[f]) { if (!slavesOf[merges[f]]) slavesOf[merges[f]] = []; slavesOf[merges[f]].push(f); } });

  function statusStyle(st) {
    if (st === 'Approved' || st === 'Published') return {bg:'rgba(13,148,136,0.06)',border:'rgba(13,148,136,0.25)',text:'var(--teal)'};
    if (st === 'Under Review') return {bg:'rgba(99,102,241,0.06)',border:'rgba(99,102,241,0.25)',text:'#6366f1'};
    if (st === 'In Progress' || st === 'Draft') return {bg:'rgba(245,158,11,0.06)',border:'rgba(245,158,11,0.25)',text:'#d97706'};
    return {bg:'rgba(100,116,139,0.06)',border:'rgba(100,116,139,0.2)',text:'#64748b'};
  }
  function getApprover(policyKey) {
    var rc = (state.policyReviewCycle || {})[policyKey] || {};
    if (rc._customApprover && (rc.approvedBy || '').trim()) return rc.approvedBy.trim();
    return (state.programOwner || '').trim() || 'CISO';
  }

  var ispStatus = getISPStatus();
  var ispStyle = statusStyle(ispStatus);
  var rows = '<tr onclick="goToCISOPolicyEditor()" style="cursor:pointer;" onmouseover="this.style.background=\'rgba(13,148,136,0.03)\'" onmouseout="this.style.background=\'\'">'
    + '<td><span style="font-family:monospace;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:4px;">ISP</span></td>'
    + '<td style="font-weight:600;font-size:13px;color:var(--navy);">Information Security Policy</td>'
    + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(state.programOwner || '—') + '</td>'
    + '<td style="font-size:12px;color:var(--text-muted);">' + _esc((state.infoSecPolicy && state.infoSecPolicy.custodian && state.infoSecPolicy.custodian.name) || '—') + '</td>'
    + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(getApprover('ISP')) + '</td>'
    + '<td><span style="background:' + ispStyle.bg + ';border:1px solid ' + ispStyle.border + ';color:' + ispStyle.text + ';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + ispStatus + '</span></td>'
    + '</tr>';

  masterFams.forEach(function(fam) {
    var status = (state.policyStatus[fam] || {}).status || 'Not Started';
    var ss = statusStyle(status);
    var slaves = slavesOf[fam] || [];
    var badgeStr = [fam].concat(slaves).map(function(f) {
      return '<span style="font-family:monospace;font-size:10px;font-weight:700;background:rgba(30,58,95,0.08);color:var(--navy);padding:1px 5px;border-radius:3px;">' + f + '</span>';
    }).join(' ');
    var statusCell = '<span style="background:' + ss.bg + ';border:1px solid ' + ss.border + ';color:' + ss.text + ';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + status + '</span>';
    if (status === 'Under Review') {
      var reviewer = getPolicyPendingReviewerDisplay(fam);
      if (reviewer) statusCell += '<div style="font-size:10px;color:#64748b;margin-top:3px;line-height:1.35;">' + _esc(reviewer) + '</div>';
    }
    rows += '<tr onclick="openPolicyDoc(\'' + fam + '\')" style="cursor:pointer;" onmouseover="this.style.background=\'rgba(13,148,136,0.03)\'" onmouseout="this.style.background=\'\'">'
      + '<td>' + badgeStr + '</td>'
      + '<td style="font-weight:600;font-size:13px;color:var(--navy);">' + _esc(getPolicyMergedTitle(fam)) + '</td>'
      + '<td style="font-size:12px;color:var(--text-muted);">' + _esc((state.domainOwners[fam] || {}).name || '—') + '</td>'
      + '<td style="font-size:12px;color:var(--text-muted);">' + _esc((getCustodian(fam) || {}).name || '—') + '</td>'
      + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(getApprover(fam)) + '</td>'
      + '<td>' + statusCell + '</td>'
      + '</tr>';
  });

  body.innerHTML = '<div style="max-width:1000px;">'
    + '<div style="margin-bottom:14px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--text-muted);">Policy library always shows all policies across the program. Use workspace pages to draft or update policy content.</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<thead><tr style="background:var(--bg-muted);">'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Family</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Policy Name</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Owner</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Custodian</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Approver</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Status</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<div style="margin-top:12px;"><button class="btn btn-secondary btn-sm" onclick="goToPoliciesHome()">Open Domain Policy Workspace →</button></div>'
    + '</div>';
}

function renderPolicyList() {
  const listPanel = document.getElementById('policy-list-panel');
  const wizPanel = document.getElementById('policy-wizard-panel');
  if (listPanel) listPanel.style.display = '';
  if (wizPanel) wizPanel.style.display = 'none';
  const body = document.getElementById('policy-list-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">\uD83C\uDFDB\uFE0F</div><div class="es-title">CISO Setup Required</div><p>The CISO must complete all 4 steps of program setup before policy owners can begin. Ask your CISO to finish baseline selection, PM controls, security policy, and role assignments.</p></div>';
    return;
  }

  const families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  const merges = state.policyMerges || {};
  const allControls = getActiveControls();

  // Masters = families not merged into another; each carries its merged slaves
  const masterFams = families.filter(function(f){ return !merges[f]; });
  const slavesOf = {};
  families.forEach(function(f){ if (merges[f]) { if (!slavesOf[merges[f]]) slavesOf[merges[f]] = []; slavesOf[merges[f]].push(f); } });

  // Helper: look up COMMON_MERGES label for a set of families
  function mergeLabel(masterFam, slaves) {
    if (!slaves || !slaves.length) return null;
    const allFams = [masterFam].concat(slaves).sort().join(',');
    for (var i = 0; i < COMMON_MERGES.length; i++) {
      const cm = COMMON_MERGES[i];
      if (cm.families.slice().sort().join(',') === allFams) return cm.label;
    }
    return null;
  }

  // Build owner name → [masterFam, ...] map (using master families only)
  const ownerMap = {};
  masterFams.forEach(function(fam) {
    const name = (state.domainOwners[fam]||{}).name || 'Unassigned';
    if (!ownerMap[name]) ownerMap[name] = [];
    ownerMap[name].push(fam);
  });
  const ownerNames = Object.keys(ownerMap).sort();

  // Auto-select current user's role if logged in
  let sel = state._policyOwnerFilter || '';
  let userForcedFams = null; // used when logged-in user has families assigned but no ownerMap match
  if (state.currentUserId && state.users) {
    const currentUser = state.users.find(function(u){ return u.id === state.currentUserId; });
    if (currentUser) {
      if (!sel && currentUser.name && ownerMap[currentUser.name]) {
        sel = currentUser.name;
        state._policyOwnerFilter = sel;
      } else if (!sel) {
        // No ownerMap match — derive from user's explicit families array or from DOMAIN_SUGGESTED_ROLES by role
        var userFams = (currentUser.families && currentUser.families.length) ? currentUser.families : [];
        // Also try matching by user's role name against DOMAIN_SUGGESTED_ROLES values
        if (!userFams.length && currentUser.role) {
          var roleLabel = currentUser.role; // e.g. 'issm', 'GRC/Risk Lead', etc.
          // Check domainOwners for any entry whose role matches
          var matchedByRole = [];
          masterFams.forEach(function(mf) {
            var o = state.domainOwners[mf] || {};
            if (o.name && o.name === (currentUser.name || '')) matchedByRole.push(mf);
          });
          if (matchedByRole.length) {
            userForcedFams = matchedByRole;
          } else {
            // Fall back: find which DOMAIN_SUGGESTED_ROLES bucket fits this user's name
            var bucketFams = [];
            Object.keys(DOMAIN_SUGGESTED_ROLES).forEach(function(fam) {
              // Check if this user is the domain owner for this fam
              var o = state.domainOwners[fam] || {};
              if (o.name && currentUser.name && o.name.toLowerCase() === currentUser.name.toLowerCase()) {
                if (!merges[fam]) bucketFams.push(fam); // only masters
              }
            });
            if (bucketFams.length) userForcedFams = bucketFams;
          }
        } else if (userFams.length) {
          // Expand to master families that cover the user's assigned families
          userForcedFams = masterFams.filter(function(mf) {
            var allFamsForMaster = [mf].concat(slavesOf[mf] || []);
            return allFamsForMaster.some(function(f) { return userFams.includes(f); });
          });
        }
      }
    }
  }

  // ── Dropdown ──
  let opts = '<option value="">Select your role\u2026</option>';
  ownerNames.forEach(function(name) {
    const n = ownerMap[name].length;
    opts += '<option value="' + name + '"' + (name === sel ? ' selected' : '') + '>'
      + name + ' (' + n + ' ' + (n === 1 ? 'policy' : 'policies') + ')</option>';
  });

  // Resolve the list of master families to render cards for
  var famsToShow = [];
  if (sel && ownerMap[sel]) {
    famsToShow = ownerMap[sel];
  } else if (userForcedFams && userForcedFams.length) {
    famsToShow = userForcedFams;
  }

  // ── Domain cards for selected owner ──
  let cards = '';
  if (famsToShow.length) {
    famsToShow.forEach(function(masterFam) {
      const slaves = slavesOf[masterFam] || [];
      const status = (state.policyStatus[masterFam]||{}).status || 'Not Started';
      // combined control count across master + all merged slaves
      const ctrlCount = allControls.filter(function(c){
        return c.f === masterFam || slaves.includes(c.f);
      }).length;
      const custodian = getCustodian(masterFam).name;
      const dd = DOMAIN_DEFAULTS[masterFam] || DOMAIN_DEFAULT_GENERIC;
      const btnLabel = status === 'Not Started' ? 'Not Yet Drafted' : status === 'Approved' ? 'View Policy \u2192' : 'View Draft \u2192';
      // title: use merge label if known, else default title
      const mergedTitle = getPolicyMergedTitle(masterFam);
      // family badges: master + slaves
      const allBadges = [masterFam].concat(slaves).map(function(f){
        return '<span class="family-badge" style="font-size:12px;padding:3px 7px;">' + f + '</span>';
      }).join('');

      var cardDisabled = status === 'Not Started';
      var cardCursor = cardDisabled ? 'default' : 'pointer';
      var cardClick = cardDisabled ? '' : ' onclick="openPolicyDoc(\'' + masterFam + '\')"';
      cards += '<div style="background:white; border:1px solid var(--border); border-radius:12px; padding:20px; cursor:' + cardCursor + '; transition:box-shadow 0.2s, border-color 0.2s;"'
        + (cardDisabled ? '' : ' onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,0.08)\'; this.style.borderColor=\'var(--teal)\';"')
        + (cardDisabled ? '' : ' onmouseleave="this.style.boxShadow=\'\'; this.style.borderColor=\'var(--border)\';"')
        + cardClick + '>'
        + '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">'
        + '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' + allBadges + '</div>'
        + chipHTML(status)
        + '</div>'
        + (status === 'Under Review'
          ? '<div style="font-size:11px;color:#6366f1;margin:-4px 0 8px 0;line-height:1.4;">Awaiting review by <strong>' + escapeHTML(getPolicyPendingReviewerDisplay(masterFam)) + '</strong>'
          + (((state.policyStatus[masterFam]||{}).submittedAt) ? '<span style="color:var(--text-muted);font-weight:500;"> · submitted ' + escapeHTML((state.policyStatus[masterFam]||{}).submittedAt) + '</span>' : '')
          + '</div>'
          : '')
        + '<div style="font-weight:700; font-size:14px; color:var(--navy); margin-bottom:2px;">' + mergedTitle + '</div>'
        + '<div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">' + ctrlCount + ' controls in baseline'
        + (custodian ? ' \u00B7 Custodian: ' + custodian : '') + '</div>'
        + (cardDisabled
            ? '<button class="btn btn-secondary btn-sm" style="width:100%;opacity:0.45;" disabled>' + btnLabel + '</button>'
            : '<button class="btn btn-primary btn-sm" style="width:100%;" onclick="event.stopPropagation(); openPolicyDoc(\'' + masterFam + '\')">' + btnLabel + '</button>')
        + '</div>';
    });
  }

  const isAdmin = !state.currentUserId;
  let cardsSection;
  if (famsToShow.length) {
    cardsSection = cards
      ? '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:14px; margin-top:20px;">' + cards + '</div>'
      : '<div style="text-align:center; padding:40px; color:var(--text-muted);">No domains assigned to this role.</div>';
  } else if (!isAdmin) {
    // Logged-in user but no domains found
    cardsSection = '<div style="text-align:center; padding:48px 32px;">'
      + '<div style="font-size:32px; margin-bottom:12px;">📭</div>'
      + '<div style="font-size:15px; font-weight:600; color:var(--navy); margin-bottom:6px;">No policy domains assigned yet</div>'
      + '<div style="font-size:13px; color:var(--text-muted);">Your CISO hasn\'t assigned any policy domains to your account yet. Contact your CISO or program administrator to get started.</div>'
      + '</div>';
  } else {
    cardsSection = '<div style="text-align:center; padding:48px 32px;">'
      + '<div style="font-size:32px; margin-bottom:12px;">\uD83D\uDCCB</div>'
      + '<div style="font-size:15px; font-weight:600; color:var(--navy); margin-bottom:6px;">Select your role above</div>'
      + '<div style="font-size:13px; color:var(--text-muted);">Choose your role from the dropdown to see the policy domains assigned to you.</div>'
      + '</div>';
  }

  // ── Full Policy Library — show ALL policies with status ──
  function statusStyle(st) {
    if (st === 'Approved' || st === 'Published') return {bg:'rgba(13,148,136,0.06)',border:'rgba(13,148,136,0.25)',text:'var(--teal)'};
    if (st === 'Under Review') return {bg:'rgba(99,102,241,0.06)',border:'rgba(99,102,241,0.25)',text:'#6366f1'};
    if (st === 'In Progress' || st === 'Draft') return {bg:'rgba(245,158,11,0.06)',border:'rgba(245,158,11,0.25)',text:'#d97706'};
    return {bg:'rgba(100,116,139,0.06)',border:'rgba(100,116,139,0.2)',text:'#64748b'};
  }
  var ispStatus = getISPStatus();
  var ispStyle = statusStyle(ispStatus);

  var libRows = '<tr onclick="goToCISOPolicyEditor()" style="cursor:pointer;" onmouseover="this.style.background=\'rgba(13,148,136,0.03)\'" onmouseout="this.style.background=\'\'">'
    + '<td><span style="font-family:monospace;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:4px;">ISP</span></td>'
    + '<td style="font-weight:600;font-size:13px;color:var(--navy);">Information Security Policy</td>'
    + '<td style="font-size:12px;color:var(--text-muted);">Tier 1 — Organization</td>'
    + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(state.programOwner||'—') + '</td>'
    + '<td><span style="background:' + ispStyle.bg + ';border:1px solid ' + ispStyle.border + ';color:' + ispStyle.text + ';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + ispStatus + '</span></td>'
    + '</tr>';

  masterFams.forEach(function(fam) {
    var slaves = slavesOf[fam] || [];
    var status = (state.policyStatus[fam]||{}).status || 'Not Started';
    var ss = statusStyle(status);
    var owner = (state.domainOwners[fam]||{}).name || '—';
    var mergedTitle = getPolicyMergedTitle(fam);
    var badgeStr = [fam].concat(slaves).map(function(f){ return '<span style="font-family:monospace;font-size:10px;font-weight:700;background:rgba(30,58,95,0.08);color:var(--navy);padding:1px 5px;border-radius:3px;">' + f + '</span>'; }).join(' ');
    var canOpen = status !== 'Not Started';
    var rowClick = canOpen ? 'onclick="openPolicyDoc(\'' + fam + '\')"' : '';
    var statusCell = '<span style="background:' + ss.bg + ';border:1px solid ' + ss.border + ';color:' + ss.text + ';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + status + '</span>';
    if (status === 'Under Review') {
      var w = getPolicyPendingReviewerDisplay(fam);
      if (w) statusCell += '<div style="font-size:10px;color:#64748b;margin-top:3px;line-height:1.35;">' + _esc(w) + '</div>';
    }
    libRows += '<tr ' + rowClick + ' style="cursor:' + (canOpen ? 'pointer' : 'default') + ';" onmouseover="this.style.background=\'rgba(13,148,136,0.03)\'" onmouseout="this.style.background=\'\'">'
      + '<td>' + badgeStr + '</td>'
      + '<td style="font-weight:600;font-size:13px;color:var(--navy);">' + _esc(mergedTitle) + '</td>'
      + '<td style="font-size:12px;color:var(--text-muted);">Tier 2 — Domain</td>'
      + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(owner) + '</td>'
      + '<td>' + statusCell + '</td>'
      + '</tr>';
  });

  var librarySection = '<div style="margin-bottom:28px;">'
    + '<div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:4px;">Policy Library</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">All organizational policies and their current status.</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<thead><tr style="background:var(--bg-muted);">'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Family</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Policy Name</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Tier</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Owner</th>'
    + '<th style="padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);text-align:left;">Status</th>'
    + '</tr></thead>'
    + '<tbody id="tbod-${Math.random().toString(36).slice(2,8)}">' + libRows + '</tbody>'
    + '</table>'
    + '</div>'
    + '</div>';

  // Only show role dropdown for admin (no currentUserId = admin mode)
  const rolePickerHTML = isAdmin
    ? '<div style="margin-bottom:16px;">'
        + '<div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:4px;">Build / Edit Policies</div>'
        + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Filter by policy owner to work on a specific domain.</div>'
        + '<label style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); display:block; margin-bottom:8px;">Policy Owner</label>'
        + '<select class="form-select" style="font-size:14px; max-width:420px;" onchange="state._policyOwnerFilter=this.value; renderPolicyList();">' + opts + '</select>'
        + '</div>'
    : '';

  body.innerHTML = '<div style="max-width:900px;">'
    + librarySection
    + (isAdmin ? rolePickerHTML + cardsSection : '')
    + '</div>';
}


// ─── POLICY DOCUMENT VIEWER ───────────────────────────────────────────────────
// Opens a read-only policy document view from sidebar. Editors get an Edit button.
function openPolicyDoc(fam) {
  state._policyLibraryMode = false;
  state._policyDomain    = fam;
  state._policyWizardMode = false;
  state._policyDocView   = true;
  showTab('policy');
}

function getRequirementControlIds(req) {
  var mapped = [];
  if (!req) return mapped;
  if (Array.isArray(req.controls)) mapped = req.controls.slice();
  else if (typeof req.controls === 'string' && req.controls.trim()) mapped = [req.controls.trim()];
  else if (typeof req.controlId === 'string' && req.controlId.trim()) mapped = [req.controlId.trim()];
  var seen = {};
  return mapped.map(function(cid){ return String(cid || '').trim(); }).filter(function(cid) {
    if (!cid) return false;
    var key = cid.toUpperCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function stripRequirementNistRef(text) {
  var raw = String(text || '');
  return raw.replace(/\s*\[NIST\s*800-53:[^\]]+\]\s*$/i, '').trim();
}

function buildRequirementControlBadgeHtml(controlIds, maxVisible) {
  var ids = controlIds || [];
  if (!ids.length) return '';
  var lim = maxVisible || 8;
  var shown = ids.slice(0, lim).map(function(cid) {
    return '<span style="font-size:10px;font-family:monospace;background:#e0f2fe;border:1px solid #bae6fd;border-radius:4px;padding:1px 6px;color:#0f172a;">' + escapeHTML(cid) + '</span>';
  }).join(' ');
  if (ids.length > lim) shown += ' <span style="font-size:10px;color:var(--text-muted);">+' + (ids.length - lim) + ' more</span>';
  return shown;
}

function renderPolicyDocViewer(fam) {
  var listPanel = document.getElementById('policy-list-panel');
  var wizPanel  = document.getElementById('policy-wizard-panel');
  if (listPanel) listPanel.style.display = '';
  if (wizPanel)  wizPanel.style.display  = 'none';
  var body = document.getElementById('policy-list-body');
  if (!body) return;

  var dp      = (state.domainPolicies || {})[fam];
  var pSt     = (state.policyStatus   || {})[fam] || {};
  var status  = pSt.status || (dp ? 'Draft' : 'Not Started');
  var slaves  = (function(){ var s=[]; Object.keys(state.policyMerges||{}).forEach(function(f){ if(state.policyMerges[f]===fam) s.push(f); }); return s; })();
  var title   = dp ? (dp.title || getPolicyMergedTitle(fam)) : getPolicyMergedTitle(fam);
  var famBadges = [fam].concat(slaves).map(function(f){ return '<span class="family-badge" style="font-size:11px;padding:2px 7px;">'+f+'</span>'; }).join(' ');

  // Determine if current user can edit
  var cu = state.currentUserId ? (state.users||[]).find(function(u){ return u.id===state.currentUserId; }) : null;
  var canEdit = !cu || cu.role === 'ciso' || cu.role === 'issm' || cu.role === 'custodian';

  var statusCol = status==='Approved' ? 'var(--green)' : status==='Under Review' ? 'var(--blue)' : status==='Returned' ? 'var(--red)' : 'var(--amber)';
  var statusIcon = status==='Approved' ? '✅' : status==='Under Review' ? '👁' : status==='Returned' ? '↩' : '📝';

  // ── Header ────────────────────────────────────────────────────────────────
  var html = '<div style="max-width:860px;margin:0 auto;padding-bottom:48px;">';

  // Breadcrumb + actions bar
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">'
    + '<button onclick="state._policyDocView=false;renderPolicyList();" style="background:none;border:none;color:var(--teal);font-size:13px;font-weight:600;cursor:pointer;padding:0;">← Policy Library</button>'
    + '<div style="display:flex;gap:8px;align-items:center;">'
    + (canEdit ? '<button class="btn btn-secondary btn-sm" onclick="state._policyDocView=false;enterPolicyWizard(\''+fam+'\');">✏️ Edit Policy</button>' : '')
    + '</div>'
    + '</div>';

  if (!dp) {
    // Policy not yet drafted
    html += '<div class="empty-state"><div class="es-icon">📄</div>'
      + '<div class="es-title">' + escapeHTML(title) + '</div>'
      + '<p>This policy has not been drafted yet.</p>'
      + (canEdit ? '<button class="btn btn-primary" onclick="state._policyDocView=false;enterPolicyWizard(\''+fam+'\');">Start Drafting →</button>' : '')
      + '</div>';
    html += '</div>';
    body.innerHTML = html;
    return;
  }

  // Document header card
  html += '<div style="background:white;border:1px solid var(--border);border-radius:12px;padding:28px 32px;margin-bottom:2px;">'
    // Status + version strip
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'
    +   '<div style="display:flex;align-items:center;gap:8px;">'
    +     famBadges
    +     '<span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+statusCol+'22;color:'+statusCol+';">'
    +       statusIcon + ' ' + escapeHTML(status)
    +     '</span>'
    +   '</div>'
    +   '<div style="font-size:12px;color:var(--text-muted);">v' + escapeHTML(dp.version||'1.0') + ' &nbsp;·&nbsp; Effective: ' + escapeHTML(dp.effectiveDate||'—') + ' &nbsp;·&nbsp; Review: ' + escapeHTML(dp.reviewCycle||'Annual') + '</div>'
    + '</div>'
    // Title
    + '<h1 style="font-size:22px;font-weight:800;color:var(--navy);margin:0 0 6px;">' + escapeHTML(title) + '</h1>'
    + '<div style="font-size:13px;color:var(--text-muted);">'
    +   'Owner: <strong>' + escapeHTML((state.domainOwners[fam]||{}).name || 'Unassigned') + '</strong>'
    +   (pSt.approvedAt ? ' &nbsp;·&nbsp; Approved: ' + escapeHTML(pSt.approvedAt) : '')
    +   (pSt.submittedAt ? ' &nbsp;·&nbsp; Submitted: ' + escapeHTML(pSt.submittedAt) : '')
    +   (status === 'Under Review' ? ' &nbsp;·&nbsp; Routed to: <strong>' + escapeHTML(getPolicyPendingReviewerDisplay(fam)) + '</strong>' : '')
    + '</div>'
    + '</div>';

  if (status === 'Under Review') {
    var whoBr = getPolicyPendingReviewerDisplay(fam);
    html += '<div role="status" style="position:sticky;top:0;z-index:5;margin:0 0 2px 0;padding:14px 32px;background:linear-gradient(90deg,rgba(99,102,241,0.14),rgba(129,140,248,0.08));border:1px solid rgba(99,102,241,0.38);border-radius:0 0 12px 12px;box-shadow:0 6px 18px rgba(67,56,202,0.08);">'
      + '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#4338ca;">Under review</div>'
      + '<div style="font-size:14px;color:var(--navy);margin-top:5px;line-height:1.5;">This policy is waiting on <strong style="color:#3730a3;">' + escapeHTML(whoBr) + '</strong>'
      + (pSt.submittedAt ? '<span style="color:var(--text-muted);font-weight:500;"> — submitted ' + escapeHTML(pSt.submittedAt) + '</span>' : '')
      + '. Sign in as that reviewer and open <strong>Reports</strong> (awaiting approval) or use <strong>Review →</strong> from the dashboard to act on it.</div>'
      + '</div>';
  } else if (status === 'Returned') {
    html += '<div role="status" style="position:sticky;top:0;z-index:5;margin:0 0 2px 0;padding:14px 32px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.45);border-radius:0 0 12px 12px;">'
      + '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#b45309;">Returned for revision</div>'
      + '<div style="font-size:14px;color:var(--navy);margin-top:5px;line-height:1.5;">' + escapeHTML(pSt.notes || 'Update the policy in the wizard and resubmit when ready.') + '</div>'
      + '</div>';
  }

  // ── Document body sections ────────────────────────────────────────────────
  function section(icon, title, content) {
    if (!content) return '';
    return '<div style="background:white;border:1px solid var(--border);border-top:none;padding:24px 32px;">'
      + '<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-muted);margin-bottom:10px;">' + icon + ' &nbsp;' + title + '</div>'
      + content
      + '</div>';
  }

  function prose(text) {
    if (!text) return '';
    return '<p style="font-size:14px;line-height:1.7;color:#374151;margin:0;">' + escapeHTML(text).replace(/\n/g,'<br>') + '</p>';
  }

  // Purpose
  html += section('📌', 'Purpose', prose(dp.purpose));

  // Scope
  html += section('🔭', 'Scope', prose(dp.scope));

  // Roles & Responsibilities
  if ((dp.roles||[]).length) {
    var rolesHtml = '<div style="display:flex;flex-direction:column;gap:12px;">';
    (dp.roles||[]).forEach(function(r) {
      if (!r.name) return;
      rolesHtml += '<div style="border:1px solid var(--border);border-radius:8px;padding:14px 16px;">'
        + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:2px;">' + escapeHTML(r.name) + (r.title ? ' <span style="font-weight:400;color:var(--text-muted);font-size:12px;">— ' + escapeHTML(r.title) + '</span>' : '') + '</div>'
        + '<ul style="margin:8px 0 0 16px;padding:0;font-size:13px;color:#374151;line-height:1.6;">'
        + (r.responsibilities||[]).map(function(res){ return '<li>' + escapeHTML(res) + '</li>'; }).join('')
        + '</ul></div>';
    });
    rolesHtml += '</div>';
    html += section('👥', 'Roles & Responsibilities', rolesHtml);
  }

  // Policy Requirements
  if ((dp.requirements||[]).length) {
    var reqHtml = '<div style="display:flex;flex-direction:column;gap:10px;">';
    (dp.requirements||[]).forEach(function(r) {
      var mappedControls = getRequirementControlIds(r);
      var ctrlBadges = buildRequirementControlBadgeHtml(mappedControls, 8);
      var reqText = stripRequirementNistRef(r.text || r.requirement || '');
      reqHtml += '<div style="border-left:3px solid var(--teal);padding:10px 14px;background:#f8fafc;border-radius:0 6px 6px 0;">'
        + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">'
        +   '<div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:4px;">' + escapeHTML(r.id||'') + (r.title ? ' — ' + escapeHTML(r.title) : '') + '</div>'
        +   (ctrlBadges ? '<div style="display:flex;flex-wrap:wrap;gap:3px;flex-shrink:0;">'+ctrlBadges+'</div>' : '')
        + '</div>'
        + (reqText ? '<div style="font-size:13px;color:#374151;line-height:1.6;margin-top:4px;">'+escapeHTML(reqText)+'</div>' : '')
        + '</div>';
    });
    reqHtml += '</div>';
    html += section('📋', 'Policy Requirements', reqHtml);
  }

  // Exceptions & Enforcement
  var excEnf = (dp.exceptions||'') + (dp.enforcement ? '\n\n' + dp.enforcement : '');
  if (excEnf.trim()) html += section('⚖️', 'Exceptions & Enforcement', prose(excEnf.trim()));

  // References
  if ((dp.references||[]).length) {
    var refHtml = '<div style="display:flex;flex-direction:column;gap:8px;">';
    (dp.references||[]).forEach(function(r) {
      if (!r.title) return;
      refHtml += '<div style="display:flex;align-items:flex-start;gap:10px;font-size:13px;">'
        + '<span style="color:var(--teal);font-size:14px;margin-top:1px;">' + (r.internal ? '🔒' : '🔗') + '</span>'
        + '<div>'
        + (r.url ? '<a href="'+escapeHTML(r.url)+'" target="_blank" style="font-weight:600;color:var(--teal);text-decoration:none;" onmouseenter="this.style.textDecoration=\'underline\'" onmouseleave="this.style.textDecoration=\'none\'">'+escapeHTML(r.title)+'</a>' : '<span style="font-weight:600;color:var(--navy);">'+escapeHTML(r.title)+'</span>')
        + (r.description ? '<div style="color:var(--text-muted);font-size:12px;margin-top:1px;">'+escapeHTML(r.description)+'</div>' : '')
        + '</div></div>';
    });
    refHtml += '</div>';
    html += section('📚', 'References', refHtml);
  }

  // Revision History (read-only table — same structure as ISP in Policy Library)
  if ((dp.revisionHistory||[]).length) {
    html += section('🕑', 'Revision History', buildDomainRevisionHistoryReadOnlyHtml(dp));
  }

  html += section('✅', 'Review & Approval Log', buildDomainPolicyReviewApprovalLogHtml(fam));

  // Close rounded bottom
  html += '<div style="height:12px;background:white;border:1px solid var(--border);border-top:none;border-radius:0 0 12px 12px;"></div>';
  html += '</div>'; // max-width wrapper
  body.innerHTML = html;
}

function enterPolicyWizard(fam) {
  state._policyLibraryMode = false;
  state._policyDomain = fam;
  state._policyWizardMode = true;
  const listPanel = document.getElementById('policy-list-panel');
  const wizPanel = document.getElementById('policy-wizard-panel');
  if (listPanel) listPanel.style.display = 'none';
  if (wizPanel) wizPanel.style.display = 'flex';
  goToStep('policy', 1);
}

function exitPolicyWizard() {
  state._policyWizardMode = false;
  state._policyDocView = false;
  renderPolicyList();
}

function getPolicyMergedTitle(fam) {
  // Custom name takes priority
  if (state.domainCustomNames && state.domainCustomNames[fam]) return state.domainCustomNames[fam];
  var merges = state.policyMerges || {};
  var families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  var slaves = families.filter(function(f){ return merges[f] === fam; });
  if (slaves.length) {
    var allFamsStr = [fam].concat(slaves).sort().join(',');
    for (var i = 0; i < COMMON_MERGES.length; i++) {
      if (COMMON_MERGES[i].families.slice().sort().join(',') === allFamsStr) return COMMON_MERGES[i].label;
    }
  }
  var dd = DOMAIN_DEFAULTS[fam] || DOMAIN_DEFAULT_GENERIC;
  return dd.title || (FAMILIES[fam] + ' Policy');
}

function setDomainCustomName(fam, val) {
  if (!state.domainCustomNames) state.domainCustomNames = {};
  val = (val || '').trim();
  var prev = state.domainCustomNames[fam];
  if (val) state.domainCustomNames[fam] = val;
  else delete state.domainCustomNames[fam];
  logFieldChange('domainCustomNames.' + fam, prev, val || null);
  // Also update the domain policy title if it exists
  if (state.domainPolicies && state.domainPolicies[fam]) {
    state.domainPolicies[fam].title = val || getPolicyMergedTitle(fam);
  }
  markDirty();
}

function getPolicyAllFamilies(fam) {
  var merges = state.policyMerges || {};
  var families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  var slaves = families.filter(function(f){ return merges[f] === fam; });
  return [fam].concat(slaves);
}

function renderPolicyWizardChrome(step) {
  const el = document.getElementById('policy-wizard-header');
  if (!el) return;
  const fam = state._policyDomain;
  const mergedTitle = escapeHTML(getPolicyMergedTitle(fam));
  const allFams = getPolicyAllFamilies(fam);
  const badgesHtml = allFams.map(function(f){
    return '<span class="family-badge" style="font-size:12px;">' + escapeHTML(f) + '</span>';
  }).join('');
  el.innerHTML = '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="exitPolicyWizard()">\u2190 All Domains</button>'
    + '<span style="font-size:15px; font-weight:700; color:var(--navy);">' + mergedTitle + '</span>'
    + '<span style="display:inline-flex; flex-wrap:wrap; gap:6px; align-items:center;">' + badgesHtml + '</span>'
    + '</div>';
}

function renderPolicyStep(step) {
  if (step === 1) renderPolicyStep1();
  if (step === 2) renderPolicyStep2();
  if (step === 3) renderPolicyStep3();
  if (step === 4) renderPolicyStep4();
  // Apply read-only overlay for custodians and non-owning ISSMs
  applyPolicyReadOnly(step);
}

function applyPolicyReadOnly(step) {
  var fam = state._policyDomain;
  if (!fam) return;
  var readOnly = isReadOnlyPolicyView(fam);
  // Remove any existing read-only banner
  var existingBanner = document.getElementById('policy-readonly-banner');
  if (existingBanner) existingBanner.remove();

  if (!readOnly) return;

  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var roleName = user ? (user.role === 'custodian' ? 'Custodian' : 'ISSM') : '';
  var reason = user && user.role === 'custodian'
    ? 'Custodians have read-only access to policy documents.'
    : 'This policy belongs to a different ISSM. You can view but not edit.';

  // Insert read-only banner
  var bodyId = 'policy-step-' + step + '-body';
  var body = document.getElementById(bodyId);
  if (body) {
    var banner = document.createElement('div');
    banner.id = 'policy-readonly-banner';
    banner.style.cssText = 'background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;';
    banner.innerHTML = '<span style="font-size:16px;">\uD83D\uDD12</span>'
      + '<div><div style="font-size:13px;font-weight:700;color:#1e40af;">Read-Only View</div>'
      + '<div style="font-size:12px;color:#2563eb;">' + reason + '</div></div>';
    body.insertBefore(banner, body.firstChild);
    // Disable all inputs, selects, textareas, buttons within the body
    body.querySelectorAll('input, select, textarea').forEach(function(el) {
      el.disabled = true;
      el.style.opacity = '0.6';
    });
    body.querySelectorAll('button').forEach(function(btn) {
      if (!btn.textContent.includes('Back') && !btn.textContent.includes('Previous')) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
      }
    });
  }
}

function policyNext(fromStep) {
  const fam = state._policyDomain;
  if (fromStep === 1) {
    const custodian = getCustodian(fam).name.trim();
    if (!custodian) {
      // Warn — no custodian assigned
      const overlay = document.createElement('div');
      overlay.id = 'noCustodianOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML =
        '<div style="background:white;border-radius:16px;padding:32px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
        + '<div style="font-size:22px;margin-bottom:10px;">\u26A0\uFE0F</div>'
        + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:8px;">No Policy Custodian Assigned</div>'
        + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:24px;line-height:1.6;">A Policy Custodian manages day-to-day maintenance, annual reviews, and exception tracking. Without one, this policy may not be properly maintained after approval.<br><br>We recommend assigning a custodian before continuing.</div>'
        + '<div style="display:flex;gap:12px;justify-content:flex-end;">'
        + '<button class="btn btn-secondary" onclick="document.getElementById(\'noCustodianOverlay\').remove(); document.getElementById(\'custodianInput\')?.focus();">Assign Custodian</button>'
        + '<button class="btn btn-primary" onclick="document.getElementById(\'noCustodianOverlay\').remove(); goToStep(\'policy\', 2);">Continue Anyway</button>'
        + '</div></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
      return;
    }
  }
  if (fromStep === 2) {
    const sel = (state.policySelectedControls||{})[fam]||[];
    if (!sel.length) { showToast('Please select at least one control before continuing.', true); return; }
    initDomainPolicy(fam);
  }
  goToStep('policy', fromStep + 1);
}

// ============================================================
// POLICY STEP 1: REVIEW & CUSTODIAN
// ============================================================
function renderPolicyStep1() {
  const fam = state._policyDomain;
  const helpEl = document.getElementById('policy-step-1-help');
  const body = document.getElementById('policy-step-1-body');
  if (!fam || !state.baseline) {
    if (body) body.innerHTML = '<div class="empty-state"><div class="es-icon">\uD83C\uDFDB\uFE0F</div><div class="es-title">CISO Setup Required</div><p>The CISO must complete all 4 steps of program setup before policy owners can begin. Ask your CISO to finish baseline selection, PM controls, security policy, and role assignments.</p></div>';
    return;
  }
  const owner = state.domainOwners[fam] || {};
  const custodian = getCustodian(fam);
  const deadline = state.policyDeadlines[fam] || '';
  const status = (state.policyStatus[fam]||{}).status || 'Not Started';
  const mergedTitle = getPolicyMergedTitle(fam);
  // Auto-fill custodian fields with logged-in custodian's info if empty
  const currentUser = state.currentUserId && state.users ? state.users.find(function(u){ return u.id === state.currentUserId; }) : null;
  const isCustodianRole = currentUser && currentUser.role === 'custodian';
  if (isCustodianRole && !custodian.name && currentUser.name) {
    if (!state.policyCustodians) state.policyCustodians = {};
    state.policyCustodians[fam] = { name: currentUser.name, role: currentUser.note || 'Policy Custodian', email: currentUser.email || '' };
    Object.assign(custodian, state.policyCustodians[fam]);
  }
  const allFams = getPolicyAllFamilies(fam);
  const dd = DOMAIN_DEFAULTS[fam] || DOMAIN_DEFAULT_GENERIC;
  // Count controls across all merged families
  const ctrls = getActiveControls().filter(function(c){ return allFams.includes(c.f); }).length;
  const allBadgesHtml = allFams.map(function(f){
    return '<span class="family-badge" style="font-size:11px;padding:2px 6px;">' + f + '</span>';
  }).join(' ');

  if (helpEl) helpEl.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px;">Step 1 of 4</div>
      <div style="font-size:15px; font-weight:700; color:var(--navy);">Policy Owner</div>
    </div>
    <div style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.25); border-radius:8px; padding:12px; margin-bottom:16px;">
      <div style="font-size:12px; font-weight:700; color:#2563eb; margin-bottom:6px;">\u2139\uFE0F About this step</div>
      <div style="font-size:12px; color:#1d4ed8; line-height:1.6;">Confirm the Policy Owner assignment from the CISO and optionally assign a Policy Custodian who manages day-to-day policy maintenance.</div>
    </div>
    <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px;">Domain</div>
    <div style="background:rgba(13,148,136,0.05); border:1px solid rgba(13,148,136,0.2); border-radius:8px; padding:12px; margin-bottom:16px;">
      <div style="font-size:13px; font-weight:700; color:var(--navy); margin-bottom:4px;">${mergedTitle}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;">${allBadgesHtml}</div>
      <div style="font-size:12px; color:var(--text-muted);">${ctrls} controls &middot; ${state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High'} baseline</div>
      <div style="margin-top:8px;">${chipHTML(status)}</div>
    </div>
    <div style="font-size:11px; color:var(--text-muted); line-height:1.6;">The Policy Custodian is responsible for ongoing maintenance and annual review of this policy document.</div>
  `;

  if (body) body.innerHTML = `
    <div style="max-width:620px;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">${allBadgesHtml}</div>
      <div style="font-size:20px; font-weight:800; color:var(--navy); margin-bottom:6px;">${mergedTitle}</div>
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:28px;">${dd.purpose ? dd.purpose.slice(0,120) + '\u2026' : 'Domain-specific security policy'}</div>
      <!-- Policy Owner -->
      <div style="border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:20px; background:white;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:${owner.name ? '8' : '12'}px;">
          <div>
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:4px;">Domain policy owner</div>
            ${isCustodianRole && !owner.name ? `
              <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">No owner assigned yet. Suggest one for the CISO to approve:</div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <input class="form-input" style="font-size:13px; font-weight:600;" placeholder="Suggested owner name" value="${escapeHTML((state._suggestedOwner||{})[fam]||'')}"
                  oninput="if(!state._suggestedOwner)state._suggestedOwner={};state._suggestedOwner['${fam}']=this.value;; window.markDirty();">
                <div style="font-size:11px; color:var(--text-muted);">This suggestion will be visible to the CISO on the dashboard.</div>
              </div>
            ` : `
              <div style="font-size:15px; font-weight:700; color:var(--navy);">${owner.name || '\u2014'}</div>
              ${owner.role ? `<div style="font-size:13px; color:var(--text-muted);">${owner.role}</div>` : ''}
              ${owner.email ? `<div style="font-size:12px; color:var(--teal); margin-top:4px;">${owner.email}</div>` : ''}
            `}
          </div>
          ${owner.name
            ? `<span class="chip chip-green">\u2713 Assigned by CISO</span>`
            : `<span class="chip chip-amber">\u26A0 Not Yet Assigned</span>`}
        </div>
        ${!isCustodianRole && !owner.name ? `<div style="font-size:12px; color:var(--amber); margin-bottom:4px;">The CISO has not yet assigned a Policy Owner for this domain. You may still proceed.</div>` : ''}
        ${deadline ? `<div style="font-size:12px; color:var(--text-muted); padding-top:8px; border-top:1px solid var(--border);">\uD83D\uDCC5 Policy due: <strong>${deadline}</strong></div>` : ''}
      </div>

      <!-- Policy Custodian -->
      <div style="border:1px solid ${isCustodianRole ? 'rgba(13,148,136,0.3)' : 'var(--border)'}; border-radius:12px; padding:20px; margin-bottom:20px; background:${isCustodianRole ? 'rgba(13,148,136,0.02)' : 'white'};">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted);">Policy Custodian ${isCustodianRole ? '' : '<span style="font-size:11px; font-weight:400;">(optional)</span>'}</div>
          ${isCustodianRole && custodian.name ? `<span class="chip chip-green" style="font-size:10px;">\u2713 You</span>` : ''}
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">${isCustodianRole ? 'You are the custodian for this policy. Verify your details are correct.' : 'Manages day-to-day maintenance, annual reviews, and exception tracking.'}</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <input class="form-input" id="custodianInput" style="font-size:13px; font-weight:600;" placeholder="Full name — e.g. Jane Smith" value="${escapeHTML(custodian.name||'')}" oninput="setPolicyCustodian('${fam}', 'name', this.value)">
          <input class="form-input" style="font-size:12px;" placeholder="Title / Role — e.g. GRC Analyst" value="${escapeHTML(custodian.role||'')}" oninput="setPolicyCustodian('${fam}', 'role', this.value)">
          <input class="form-input" type="email" style="font-size:12px;" placeholder="email@company.com" value="${escapeHTML(custodian.email||'')}" oninput="setPolicyCustodian('${fam}', 'email', this.value)">
        </div>
      </div>

      <!-- Policy Review Cycle Tracking (Domain Policy) -->
      ${renderReviewCycleCard(fam, mergedTitle)}

      <!-- Return to CISO (only for ISSM / owner role, not custodians) -->
      ${!isCustodianRole ? `
      <div style="border:1px solid rgba(239,68,68,0.2); border-radius:12px; padding:16px; background:rgba(239,68,68,0.02);">
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="font-size:20px; flex-shrink:0; margin-top:2px;">&#x21A9;</div>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:700; color:var(--red); margin-bottom:4px;">Not your policy?</div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px; line-height:1.6;">If this domain was assigned to you in error, or you are not the correct Policy Owner, you can return it to the Program Owner for reassignment.</div>
            <button class="btn btn-sm" style="background:white; border:1px solid rgba(239,68,68,0.4); color:var(--red); font-weight:600;"
              onclick="returnPolicyToCISO('${fam}')">&#x21A9; Return to ${escapeHTML(state.programOwnerTitle||'Program Owner')} for Reassignment</button>
          </div>
        </div>
      </div>` : ''}
    </div>
  `;
}

// Returns true if the current user should have read-only access to the policy view
function isReadOnlyPolicyView(fam) {
  if (!state.currentUserId) return false; // admin can edit everything
  var user = (state.users||[]).find(function(u){ return u.id === state.currentUserId; });
  if (!user) return false;
  // Collect all roles this person holds
  var personIds = state._currentPersonIds || [state.currentUserId];
  var personRoles = [];
  var personFamilies = [];
  personIds.forEach(function(pid) {
    var rec = (state.users||[]).find(function(u){ return u.id === pid; });
    if (rec) {
      if (personRoles.indexOf(rec.role) === -1) personRoles.push(rec.role);
      (rec.families || []).forEach(function(f){ if (personFamilies.indexOf(f) === -1) personFamilies.push(f); });
    }
  });
  // CISO can edit everything
  if (personRoles.indexOf('ciso') !== -1) return false;
  // If person is an ISSM (even if logged in via another role), check family ownership
  if (personRoles.indexOf('issm') !== -1) {
    var allFams = getPolicyAllFamilies(fam);
    var hasOwnership = personFamilies.some(function(f){ return allFams.includes(f); });
    return !hasOwnership;
  }
  // Custodians (without ISSM role) are always read-only
  if (personRoles.indexOf('custodian') !== -1) return true;
  return false;
}

function setPolicyCustodian(fam, field, value) {
  if (!state.policyCustodians) state.policyCustodians = {};
  if (!state.policyCustodians[fam] || typeof state.policyCustodians[fam] === 'string') {
    // migrate old string format
    const old = typeof state.policyCustodians[fam] === 'string' ? state.policyCustodians[fam] : '';
    state.policyCustodians[fam] = { name: old, role: '', email: '' };
  }
  var prev = state.policyCustodians[fam][field];
  state.policyCustodians[fam][field] = value;
  logFieldChange('policyCustodians.' + fam + '.' + field, prev, value);
}

function getCustodian(fam) {
  const c = (state.policyCustodians || {})[fam];
  if (!c) return { name: '', role: '', email: '' };
  if (typeof c === 'string') return { name: c, role: '', email: '' }; // migrate old format
  return c;
}

function returnPolicyToCISO(fam) {
  // Show confirmation before removing ownership
  const overlay = document.createElement('div');
  overlay.id = 'returnCISOOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
  const famName = FAMILIES[fam] || fam;
  var ownerTitle = escapeHTML(state.programOwnerTitle || 'Program Owner');
  overlay.innerHTML =
    '<div style="background:white;border-radius:16px;padding:32px;width:440px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:22px;margin-bottom:10px;">\u21A9</div>'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:8px;">Return to ' + ownerTitle + '?</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;line-height:1.6;">You are about to return the <strong>' + famName + ' Policy</strong> to the ' + ownerTitle + ' for reassignment.</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:24px;line-height:1.6;">This will clear your ownership of this domain and flag it as unassigned. Any progress on this policy will be preserved.</div>'
    + '<div style="display:flex;gap:12px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'returnCISOOverlay\').remove()">Cancel</button>'
    + '<button class="btn" style="background:var(--red);color:white;border:none;" onclick="confirmReturnToCISO(\'' + fam + '\')">Return to ' + ownerTitle + '</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function confirmReturnToCISO(fam) {
  document.getElementById('returnCISOOverlay')?.remove();
  var previousOwner = (state.domainOwners[fam] || {}).name || 'Unknown';
  // Clear ownership and reset status
  if (state.domainOwners[fam]) delete state.domainOwners[fam];
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.policyStatus[fam]) state.policyStatus[fam] = {};
  state.policyStatus[fam].status = 'Returned';
  state.policyStatus[fam].returnedAt = new Date().toLocaleDateString();
  state.policyStatus[fam].returnedBy = previousOwner;
  // If this owner had a filter set, clear it since their assignment is gone
  if (state._policyOwnerFilter) {
    // Re-check if the owner still has other domains; if not, clear filter
    const stillAssigned = getActiveFamilies().filter(function(f){
      return f !== 'PM' && (state.domainOwners[f]||{}).name === state._policyOwnerFilter;
    });
    if (!stillAssigned.length) state._policyOwnerFilter = '';
  }
  var ownerTitle = state.programOwnerTitle || 'Program Owner';
  addAuditEntry('policy', fam, 'Policy returned to ' + ownerTitle + ' by ' + previousOwner);
  showToast('\u21A9 Policy returned to ' + ownerTitle + '. Switch to Admin view \u2192 Program Setup Step 5 to reassign.');
  exitPolicyWizard();
}

// ============================================================
// POLICY STEP 2: SELECT CONTROLS (was Step 1)
// ============================================================
function renderPolicyStep2() {
  const helpEl = document.getElementById('policy-step-2-help');
  const body = document.getElementById('policy-step-2-body');
  if (!state.baseline) {
    if (body) body.innerHTML = '<div class="empty-state"><div class="es-icon">\uD83C\uDFDB\uFE0F</div><div class="es-title">CISO Setup Required</div><p>The CISO must complete all 4 setup steps first, including baseline selection and control assignment.</p></div>';
    return;
  }
  const families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  if (!state._policyDomain) state._policyDomain = families[0] || null;
  const fam = state._policyDomain;
  if (!state.policySelectedControls) state.policySelectedControls = {};

  // Include all merged family controls (master + slaves)
  const allFams = getPolicyAllFamilies(fam);
  const mergedTitle = getPolicyMergedTitle(fam);

  // ALL controls across all merged families
  const allFamControls = CONTROLS.filter(function(c){ return allFams.includes(c.f); });
  // Controls required by the program's baseline (pre-selected by default)
  const baselineControls = allFamControls.filter(function(c){
    return c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P'));
  });

  // Seed selection with ALL baseline controls across all merged families,
  // EXCLUDING XX-1 "Policy and Procedures" controls — those belong only in the ISP (Tier 1).
  // Re-seed if: (a) never set, or (b) empty AND the domain policy hasn't been
  // formally started yet (i.e. no domainPolicies entry for this fam). Once a
  // user has moved to step 3+, we preserve whatever they explicitly selected.
  const policyStarted = !!(state.domainPolicies && state.domainPolicies[fam]);
  if (!state.policySelectedControls[fam] || (!state.policySelectedControls[fam].length && !policyStarted)) {
    state.policySelectedControls[fam] = baselineControls
      .filter(function(c){ return !c.id.endsWith('-1'); })
      .map(function(c){ return c.id; });
    // Auto-populate control owners from domain owner if one is set (opt-out model)
    autoPopulateControlOwnersFromDomain(fam);
  }
  const selected = state.policySelectedControls[fam];
  const deSelectQueue = allFamControls.filter(function(c) {
    const cs = state.controlStatus[c.id] || {};
    return cs.recommendedDeselect || cs.deselectDecision;
  });

  const footerCount = document.getElementById('policy-step-2-count');
  if (footerCount) footerCount.textContent = selected.length + ' selected (' + baselineControls.length + ' required by baseline)';

  if (helpEl) helpEl.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px;">Step 2 of 4</div>
      <div style="font-size:15px; font-weight:700; color:var(--navy);">Control Selection</div>
    </div>
    <div style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.25); border-radius:8px; padding:12px; margin-bottom:16px;">
      <div style="font-size:12px; font-weight:700; color:#2563eb; margin-bottom:6px;">\u2139\uFE0F About this step</div>
      <div style="font-size:12px; color:#1d4ed8; line-height:1.6;">Baseline controls are pre-selected. Deselect any that don't apply. You can also add controls from higher baselines if your risk profile or strategic priorities require them.</div>
    </div>
    <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px;">Quick Select</div>
    <button class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:6px;" onclick="selectAllDomainControls('${fam}','baseline')">\u21A9 Reset to ${state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High'} Baseline</button>
    <button class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:6px;" onclick="selectAllDomainControls('${fam}','none')">\u2610 Clear All</button>
    <div style="border-top:1px solid var(--border); padding-top:12px;">
      <div style="font-size:13px; font-weight:700; color:var(--navy);" id="policy-step-2-count-side">${selected.length} <span style="font-weight:400; font-size:12px; color:var(--text-muted);">selected</span></div>
      <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${baselineControls.length} required by ${state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High'} baseline</div>
    </div>
  `;

  const allBadgesHtml2 = allFams.map(function(f){
    return '<span class="family-badge" style="font-size:11px;padding:2px 6px;">' + f + '</span>';
  }).join(' ');
  if (body) body.innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">${allBadgesHtml2}</div>
      <div style="font-size:16px; font-weight:700; color:var(--navy);">${mergedTitle} — Controls</div>
      <div style="font-size:13px; color:var(--text-muted);">${baselineControls.length} required by your ${state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High'} baseline${state.privacyOverlay?' + Privacy':''}. ${allFamControls.length - baselineControls.length > 0 ? (allFamControls.length - baselineControls.length) + ' additional controls available.' : ''}</div>
    </div>
    <div class="filter-bar" style="margin-bottom:12px;">
      <input type="text" id="ctrlFilter1" placeholder="Search controls\u2026" style="flex:1;" oninput="filterDomainControls()">
      <select id="ctrlBaselineFilter" onchange="filterDomainControls()">
        <option value="all" selected>All Controls</option>
        <option value="required">Baseline Required</option>
        <option value="optional">Optional / Enhanced</option>
      </select>
    </div>
    <div class="table-scroll">
      <table class="control-table" id="domainCtrlTable">
        <thead>
          <tr>
            <th style="width:44px;"><input type="checkbox" id="selectAllCb" style="accent-color:var(--teal);"
              onchange="selectAllDomainControls('${fam}', this.checked ? 'all' : 'none');"
              ${selected.length===allFamControls.length?'checked':''}></th>
            <th style="width:90px;">Control ID</th>
            <th>Name</th>
            <th style="width:110px;">Baseline</th>
          </tr>
        </thead>
        <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">
          ${allFamControls.map(c=>{
            const inProgramBaseline = c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P'));
            return `
          <tr data-id="${c.id}" data-required="${inProgramBaseline?'required':'optional'}" style="${!inProgramBaseline?'background:rgba(248,250,252,0.8);':''}">
            <td><input type="checkbox" class="domain-cb" data-id="${c.id}" ${selected.includes(c.id)?'checked':''}
              style="accent-color:var(--teal);"
              onchange="toggleDomainControl('${fam}','${c.id}',this.checked);"></td>
            <td>
              <span class="control-id">${c.id}</span>
              ${!inProgramBaseline?'<div style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:0.4px;margin-top:2px;">OPTIONAL</div>':''}
            </td>
            <td style="font-size:13px;color:${inProgramBaseline?'var(--navy)':'var(--text-muted)'};">
              ${c.n}
              <div style="font-size:11px;color:var(--text-muted);font-weight:400;margin-top:2px;line-height:1.35;">${ctrlShortDesc(c)}</div>
            </td>
            <td>${minBaselinePill(c.bl)}</td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    ${deSelectQueue.length ? `
    <div style="margin-top:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;">
      <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:8px;">De-select Recommendations Requiring Policy Owner Decision (${deSelectQueue.length})</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${deSelectQueue.map(c => {
          const cs = state.controlStatus[c.id] || {};
          const decision = cs.deselectDecision || '';
          const status = decision || (cs.recommendedDeselect ? 'Proposed' : 'Not Proposed');
          const statusColor = status === 'Approved' ? '#166534' : status === 'Rejected' ? '#b45309' : '#92400e';
          const cid = c.id.replace(/'/g,"\\'");
          return `<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 10px;background:white;border:1px solid #fde68a;border-radius:8px;">
            <span class="control-id">${c.id}</span>
            <div style="flex:1;">
              <div style="font-size:12px;color:var(--navy);font-weight:600;">${escapeHTML(c.n)}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Proposed by ${escapeHTML(cs.deselectProposedBy || 'Control Owner')} on ${escapeHTML(cs.deselectProposedAt || '—')}</div>
              <div style="font-size:11px;color:#92400e;margin-top:4px;line-height:1.45;"><strong>Proposal reason:</strong> ${escapeHTML(cs.deselectReason || '—')}</div>
              ${cs.deselectDecisionReason ? `<div style="font-size:11px;color:#334155;margin-top:4px;line-height:1.45;"><strong>Decision rationale:</strong> ${escapeHTML(cs.deselectDecisionReason)}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:185px;">
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${statusColor};">${status}</span>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-sm" style="font-size:10px;padding:4px 7px;background:#166534;border:none;color:white;" onclick="policyOwnerDecideDeselect('${cid}','Approved')">Approve De-select</button>
                <button class="btn btn-sm" style="font-size:10px;padding:4px 7px;background:#b45309;border:none;color:white;" onclick="policyOwnerDecideDeselect('${cid}','Rejected')">Reject</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
  `;
  setTimeout(filterDomainControls, 0);
}

function switchPolicyDomain(fam) {
  state._policyDomain = fam;
  if (!state.policySelectedControls) state.policySelectedControls = {};
  // Delegate entirely to renderPolicyStep2 which handles seeding correctly
  // (including all merged slave families and the policyStarted guard).
  renderPolicyStep2();
}

function toggleDomainControl(fam, ctrlId, checked) {
  if (!state.policySelectedControls) state.policySelectedControls = {};
  if (!state.policySelectedControls[fam]) state.policySelectedControls[fam] = [];
  if (checked && !state.policySelectedControls[fam].includes(ctrlId)) state.policySelectedControls[fam].push(ctrlId);
  if (!checked) state.policySelectedControls[fam] = state.policySelectedControls[fam].filter(function(id){ return id !== ctrlId; });
  const sel = state.policySelectedControls[fam];
  const baselineCount = CONTROLS.filter(function(c){
    return c.f === fam && (c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P')));
  }).length;
  const fc  = document.getElementById('policy-step-2-count');
  const fcs = document.getElementById('policy-step-2-count-side');
  if (fc)  fc.textContent = sel.length + ' selected (' + baselineCount + ' required by baseline)';
  if (fcs) fcs.innerHTML  = sel.length + ' <span style="font-weight:400;font-size:12px;color:var(--text-muted);">selected</span>';
}

function selectAllDomainControls(fam, mode) {
  // mode: 'all' | 'baseline' | 'none' | true (legacy=all) | false (legacy=none)
  if (mode === true)  mode = 'all';
  if (mode === false) mode = 'none';
  // Include all merged slave families so merged domains (e.g. AC+IA) get full coverage
  const allFams     = getPolicyAllFamilies(fam);
  const allFam      = CONTROLS.filter(function(c){ return allFams.includes(c.f); });
  const baselineFam = allFam.filter(function(c){
    return c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P'));
  });
  if (!state.policySelectedControls) state.policySelectedControls = {};
  if (mode === 'all')      state.policySelectedControls[fam] = allFam.map(function(c){ return c.id; });
  else if (mode==='baseline') state.policySelectedControls[fam] = baselineFam.map(function(c){ return c.id; });
  else                     state.policySelectedControls[fam] = [];
  // Auto-populate control owners from domain owner for newly selected controls
  if (mode !== 'none') autoPopulateControlOwnersFromDomain(fam);
  const sel = state.policySelectedControls[fam];
  document.querySelectorAll('.domain-cb').forEach(function(cb){
    cb.checked = sel.includes(cb.dataset.id||'');
  });
  const selectAllCb = document.getElementById('selectAllCb');
  if (selectAllCb) selectAllCb.checked = mode === 'all';
  const fc = document.getElementById('policy-step-2-count');
  const fcs = document.getElementById('policy-step-2-count-side');
  if (fc)  fc.textContent = sel.length + ' selected (' + baselineFam.length + ' required by baseline)';
  if (fcs) fcs.innerHTML  = sel.length + ' <span style="font-weight:400;font-size:12px;color:var(--text-muted);">selected</span>';
}

function selectPolicyProcControls(fam) {
  const allFams = getPolicyAllFamilies(fam);
  const p1 = CONTROLS.filter(function(c){ return allFams.includes(c.f) && c.id.match(/-1$/); }).map(function(c){ return c.id; });
  if (!state.policySelectedControls) state.policySelectedControls = {};
  state.policySelectedControls[fam] = p1;
  renderPolicyStep2();
}

function filterDomainControls() {
  const q   = (document.getElementById('ctrlFilter1')?.value||'').toLowerCase();
  const blf = document.getElementById('ctrlBaselineFilter')?.value||'all';
  var visibleCount = 0;
  var checkedCount = 0;
  document.querySelectorAll('#domainCtrlTable tbody tr').forEach(function(row){
    const id       = (row.dataset.id||'').toLowerCase();
    const required = row.dataset.required||'required';
    const name     = row.cells[2]?.textContent.toLowerCase()||'';
    const matchQ   = !q || id.includes(q) || name.includes(q);
    const matchBL  = blf==='all' || blf===required;
    const visible  = matchQ && matchBL;
    row.style.display = visible ? '' : 'none';
    if (visible) {
      visibleCount++;
      var cb = row.querySelector('.domain-cb');
      if (cb && cb.checked) checkedCount++;
    }
  });
  // Reset select-all checkbox to reflect visible rows only
  const selectAllCb = document.getElementById('selectAllCb');
  if (selectAllCb) selectAllCb.checked = visibleCount > 0 && checkedCount === visibleCount;
  // Show "no results" when filter matches nothing
  var noResults = document.getElementById('domainCtrlNoResults');
  if (!noResults) {
    var table = document.getElementById('domainCtrlTable');
    if (table) {
      noResults = document.createElement('div');
      noResults.id = 'domainCtrlNoResults';
      noResults.style.cssText = 'text-align:center;padding:24px;color:var(--text-muted);font-size:13px;display:none;';
      noResults.textContent = 'No controls match your filter.';
      table.parentNode.insertBefore(noResults, table.nextSibling);
    }
  }
  if (noResults) noResults.style.display = visibleCount === 0 ? '' : 'none';
}

// ============================================================
// POLICY STEP 3: BUILD DOMAIN POLICY (was Step 2)
// ============================================================
// DOMAIN POLICY INIT — sections-based structure (mirrors InfoSec editor)
// ============================================================
function initDomainPolicy(fam) {
  if (!state.domainPolicies) state.domainPolicies = {};
  if (state.domainPolicies[fam]) { _migrateDomainPolicy(fam); return; }
  const dd = DOMAIN_DEFAULTS[fam] || DOMAIN_DEFAULT_GENERIC;
  const owner = state.domainOwners[fam];
  const selected = (state.policySelectedControls||{})[fam]||[];

  // Group controls by their base control number so enhancements share one requirement.
  // E.g. AC-2, AC-2(1), AC-2(2) → one requirement; IA-8, IA-8(1), IA-8(4) → one requirement.
  function getBaseCtrlId(cid) {
    const m = cid.match(/^([A-Z]{2}-\d+)/);
    return m ? m[1] : cid;
  }
  const groups = {};
  const groupOrder = [];
  selected.forEach(function(cid) {
    const base = getBaseCtrlId(cid);
    if (!groups[base]) { groups[base] = []; groupOrder.push(base); }
    groups[base].push(cid);
  });
  const requirements = groupOrder.map(function(base, i) {
    const cids = groups[base];
    // One policy objective per base control number; cids includes the base and any selected enhancements.
    return { id: fam+'-REQ-'+(i+1), controls: cids, text: generateDomainPolicyObjective(fam, cids) };
  });
  state.domainPolicies[fam] = {
    title: getPolicyMergedTitle(fam), version: '1.0',
    effectiveDate: new Date().toISOString().slice(0,10),
    reviewCycle: 'Annual', status: 'Draft',
    sections: [
      { type:'purpose',          title:'Purpose' },
      { type:'scope',            title:'Scope' },
      { type:'roles',            title:'Roles & Responsibilities' },
      { type:'requirements',     title:'Policy Requirements' },
      { type:'exceptions',       title:'Exceptions & Enforcement' },
      { type:'references',       title:'Related Standards & References' },
      { type:'revision-history', title:'Revision History' },
    ],
    purpose: dd.purpose, scope: dd.scope,
    roles: [
      { name: 'Domain Policy Owner', title: '', responsibilities: ['Own, draft, and maintain this Tier 2 domain policy; ensure Tier 3 procedures or implementation guides exist where needed for assigned controls', 'Serve as the security point of contact for in-scope systems whose controls map to this domain (combining ISSM and ISSO expectations for this family)', 'Assign control owners within this domain and monitor implementation, evidence collection, and attestation status', 'Coordinate with control owners on implementation, assessment support, and evidence that is complete and assessment-ready', 'Track findings, corrective actions, and POA&M items for in-scope systems and report status to the CISO or program leadership as appropriate', 'Review and update this policy at least annually or when risk, technology, or compliance drivers materially change', 'Route this policy through the organizational approval workflow (for example, the CISO or designated authorizing official) prior to publication', 'Escalate policy exceptions, significant control deficiencies, and material risks to organizational leadership as defined in the information security program', 'Notify the CISO or designated security leadership of significant system, architecture, or environmental changes that affect security or privacy posture for controls in this domain'] },
      { name: 'Control Owners', title: '', responsibilities: ['Implement assigned controls in accordance with this policy and associated Tier 3 procedures', 'Document implementation narratives, evidence, and parameter values sufficient for independent assessment', 'Attest annually (or upon significant change) that control implementation remains current and accurate', 'Report exceptions and remediation plans to the domain policy owner within the timeframes defined in this policy'] },
      { name: 'System Owners', title: '', responsibilities: ['Ensure systems under their stewardship operate in compliance with this policy', 'Coordinate with the domain policy owner to assess the security impact of significant changes before implementation', 'Accept responsibility for residual risks specific to their systems within this domain'] },
      { name: 'All Personnel', title: '', responsibilities: ['Comply with this policy and associated procedures applicable to their role', 'Complete required training related to ' + (FAMILIES[fam]||fam) + ' controls on schedule', 'Report suspected policy violations to the domain policy owner or Information Security team'] },
    ],
    requirements,
    exceptions: 'Exceptions to this policy must be submitted in writing to the domain policy owner with a description of the affected control(s), the business justification, the risk accepted, and a proposed remediation timeline. The CISO must formally approve all exceptions. Approved exceptions shall be documented in the program Plan of Action and Milestones (POA&M) and reviewed quarterly.',
    enforcement: 'Violations of this policy may result in disciplinary action up to and including termination of employment or contract, and referral for civil or criminal proceedings where applicable. Suspected violations shall be reported immediately to the Information Security team and the domain policy owner. The CISO shall determine the appropriate response in coordination with Human Resources and Legal.',
    references: [
      { title:'NIST SP 800-53 Rev. 5', description:'Security and Privacy Controls for Information Systems and Organizations', url:'https://doi.org/10.6028/NIST.SP.800-53r5', internal:false },
      { title:'NIST SP 800-53B', description:'Control Baselines for Information Systems and Organizations', url:'https://doi.org/10.6028/NIST.SP.800-53Br5', internal:false },
      { title:'Organizational Information Security Policy', description:'Master information security policy — governs all domain policies', url:'', internal:true },
    ],
    revisionHistory: [],
    lastUpdated: new Date().toLocaleDateString(),
  };
}

// Migrate old flat format to sections array + sync newly selected controls into requirements
function _migrateDomainPolicy(fam) {
  const dp = state.domainPolicies[fam];
  if (!dp) return;
  if (!dp.sections) {
    dp.sections = [
      { type:'purpose',      title:'Purpose' },
      { type:'scope',        title:'Scope' },
      { type:'roles',        title:'Roles & Responsibilities' },
      { type:'requirements', title:'Policy Requirements' },
      { type:'exceptions',   title:'Exceptions & Enforcement' },
      { type:'references',   title:'Related Standards & References' },
    ];
    // If purpose/scope were stored flat, keep them (already in dp.purpose / dp.scope)
  }
  // Upgrade old single-controlId format → controls[] array
  if (dp.requirements && dp.requirements.length && dp.requirements[0].controlId !== undefined) {
    dp.requirements = dp.requirements.map(function(r, i) {
      return { id: r.id||(fam+'-REQ-'+(i+1)), controls: r.controlId ? [r.controlId] : [], text: r.text||'' };
    });
  }
  if (!dp.requirements) dp.requirements = [];

  // Consolidate single-control requirements that share the same base control number.
  // This repairs policies initialised before the grouping fix was applied.
  // Only merge requirements that haven't been manually edited (still contain boilerplate text).
  function getBaseCtrlId2(cid) { const m = cid.match(/^([A-Z]{2}-\d+)/); return m ? m[1] : cid; }
  (function consolidateReqs() {
    // Build a map: base → [reqIndexes] for requirements with exactly one control
    var singleMap = {};
    dp.requirements.forEach(function(r, idx) {
      if ((r.controls||[]).length === 1) {
        var base = getBaseCtrlId2(r.controls[0]);
        if (!singleMap[base]) singleMap[base] = [];
        singleMap[base].push(idx);
      }
    });
    // Merge groups of 2+ single-control requirements sharing the same base
    var toRemove = [];
    Object.keys(singleMap).forEach(function(base) {
      var idxs = singleMap[base];
      if (idxs.length < 2) return;
      var first = dp.requirements[idxs[0]];
      idxs.slice(1).forEach(function(idx) {
        first.controls = first.controls.concat(dp.requirements[idx].controls);
        toRemove.push(idx);
      });
    });
    if (toRemove.length) {
      var removeSet = new Set(toRemove);
      dp.requirements = dp.requirements.filter(function(_, idx) { return !removeSet.has(idx); });
    }
  })();

  renumberDomainReqs(fam);
  // Migrate references — add default set if missing
  if (!dp.references) {
    dp.references = [
      { title:'NIST SP 800-53 Rev. 5', description:'Security and Privacy Controls for Information Systems and Organizations', url:'https://doi.org/10.6028/NIST.SP.800-53r5', internal:false },
      { title:'NIST SP 800-53B', description:'Control Baselines for Information Systems and Organizations', url:'https://doi.org/10.6028/NIST.SP.800-53Br5', internal:false },
      { title:'Organizational Information Security Policy', description:'Master information security policy — governs all domain policies', url:'', internal:true },
    ];
  }
  // Add revision-history section if missing
  if (!dp.sections.find(function(s){return s.type==='revision-history';})) {
    dp.sections.push({ type:'revision-history', title:'Revision History' });
  }
  if (!dp.revisionHistory) dp.revisionHistory = [];
  // Tier 2 domain R&R: remove legacy "Program Owner" row (org/CISO approval is outside this list).
  if (dp.roles && dp.roles.length) {
    dp.roles = dp.roles.filter(function(r) {
      return !(r && r.name && /^program\s*owner$/i.test(String(r.name).trim()));
    });
    dp.roles.forEach(function(r) {
      if (r.name === 'ISSM / Domain Policy Owner' || r.name === 'ISSM (Domain Policy Owner)') {
        r.name = 'Domain Policy Owner';
      }
    });
  }
  // Fix: role entries should use generic titles, never personal names.
  // Older policies stored owner.name (e.g. "Taylor Brooks") as the first role name — replace with generic title.
  if (dp.roles && dp.roles.length) {
    var firstRole = dp.roles[0];
    var genericNames = ['ISSM','ISSO','CISO','Control Owners','System Owners','All Personnel','ISSM / Domain Policy Owner','ISSM (Domain Policy Owner)','Domain Policy Owner','Information System Security Manager','Information System Security Officer'];
    if (firstRole.name && !genericNames.some(function(g){ return firstRole.name.indexOf(g) >= 0; })) {
      firstRole.name = 'Domain Policy Owner';
    }
  }
  // Merge legacy separate ISSM + ISSO rows into a single Domain Policy Owner (new templates ship one row).
  (function mergeIssmIssoIntoDomainPolicyOwner() {
    if (!dp.roles || !dp.roles.length) return;
    function isIssoLike(r) {
      if (!r || !r.name) return false;
      var n = String(r.name).trim();
      return /^ISSO$/i.test(n) || /^Information System Security Officer$/i.test(n);
    }
    function isIssmOrDomainOwnerLike(r) {
      if (!r || !r.name) return false;
      var n = String(r.name).trim();
      if (/^Domain Policy Owner$/i.test(n)) return true;
      return /ISSM|Information System Security Manager.*Domain Policy Owner/i.test(r.name);
    }
    var iIsso = -1;
    for (var i = 0; i < dp.roles.length; i++) {
      if (isIssoLike(dp.roles[i])) { iIsso = i; break; }
    }
    if (iIsso < 0) return;
    var iOwner = -1;
    for (var j = 0; j < dp.roles.length; j++) {
      if (j !== iIsso && isIssmOrDomainOwnerLike(dp.roles[j])) { iOwner = j; break; }
    }
    if (iOwner < 0) {
      dp.roles[iIsso].name = 'Domain Policy Owner';
      dp.roles[iIsso].title = '';
      return;
    }
    var owner = dp.roles[iOwner];
    var isso = dp.roles[iIsso];
    var merged = (owner.responsibilities || []).concat(isso.responsibilities || []);
    var seen = {};
    var uniq = [];
    merged.forEach(function(line) {
      var k = (line || '').trim();
      if (!k || seen[k]) return;
      seen[k] = true;
      uniq.push(line);
    });
    owner.name = 'Domain Policy Owner';
    owner.title = '';
    owner.responsibilities = uniq.length ? uniq : owner.responsibilities;
    dp.roles.splice(iIsso, 1);
  })();
  // Long-form / legacy names → Domain Policy Owner; clear mistaken app-role slugs in subtitle field.
  if (dp.roles && dp.roles.length) {
    dp.roles.forEach(function(r) {
      if (!r) return;
      var n = String(r.name || '').trim();
      var t = String(r.title || '').trim();
      if (/Information System Security Manager \(Domain Policy Owner\)/i.test(r.name)) {
        r.name = 'Domain Policy Owner';
      }
      if (n === 'ISSM (Domain Policy Owner)' || n === 'ISSM / Domain Policy Owner' || (n === 'ISSM' && !t)) {
        r.name = 'Domain Policy Owner';
      }
      if (/^ISSO$/i.test(n) || /^Information System Security Officer$/i.test(n)) {
        r.name = 'Domain Policy Owner';
        r.title = '';
      }
      if (t && /^(ciso|issm|isso|custodian|admin)$/i.test(t)) r.title = '';
    });
  }
  // Replace old boilerplate that pasted verbatim NIST legal text into domain requirements.
  function domainReqLooksLikeVerbatimNIST(t) {
    if (!t || typeof t !== 'string') return false;
    if (/\[Assignment:|\[Selection:|\[FedRAMP Assignment:|\[Withdrawn:/i.test(t)) return true;
    if (/^\s*a\.\s/.test(t) && t.indexOf('\n') > 0 && t.length > 120) return true;
    return false;
  }
  if (dp.requirements && dp.requirements.length) {
    dp.requirements.forEach(function(r) {
      if (!r.controls || !r.controls.length) return;
      if (domainReqLooksLikeVerbatimNIST(r.text)) {
        r.text = generateDomainPolicyObjective(fam, r.controls);
      }
    });
  }
}

function renumberDomainReqs(fam) {
  (state.domainPolicies[fam].requirements||[]).forEach(function(r, i){ r.id = fam+'-REQ-'+(i+1); });
}

/** Append requirement rows for selected controls not yet mapped — call when selection changes, not on every policy render (otherwise deletes are undone by migrate). */
function syncDomainPolicyRequirementsFromSelection(fam) {
  if (!state.domainPolicies || !state.domainPolicies[fam]) return;
  const dp = state.domainPolicies[fam];
  function getBaseCtrlId2(cid) { const m = cid.match(/^([A-Z]{2}-\d+)/); return m ? m[1] : cid; }
  const selected = (state.policySelectedControls||{})[fam]||[];
  const mapped = (dp.requirements||[]).reduce(function(acc, r){ return acc.concat(r.controls||[]); }, []);
  const newCtls = selected.filter(function(cid){ return !mapped.includes(cid); });
  if (!newCtls.length) return;
  var groups2 = {}, order2 = [];
  newCtls.forEach(function(cid) {
    var base = getBaseCtrlId2(cid);
    if (!groups2[base]) { groups2[base] = []; order2.push(base); }
    groups2[base].push(cid);
  });
  if (!dp.requirements) dp.requirements = [];
  var n = dp.requirements.length;
  order2.forEach(function(base, i) {
    var cids = groups2[base];
    dp.requirements.push({ id: fam+'-REQ-'+(n+i+1), controls: cids, text: generateDomainPolicyObjective(fam, cids) });
  });
  renumberDomainReqs(fam);
}

// ── Domain references helpers ──────────────────────────────────────────────
function _renderDomainReferences(fam, dp) {
  const esc_fam = fam.replace(/'/g,"\\'");
  if (!dp.references) dp.references = [
    { title:'NIST SP 800-53 Rev. 5', description:'Security and Privacy Controls for Information Systems and Organizations', url:'https://doi.org/10.6028/NIST.SP.800-53r5', internal:false },
    { title:'NIST SP 800-53B', description:'Control Baselines for Information Systems and Organizations', url:'https://doi.org/10.6028/NIST.SP.800-53Br5', internal:false },
    { title:'Organizational Information Security Policy', description:'Master information security policy — governs all domain policies', url:'', internal:true },
  ];
  const cards = dp.references.map(function(ref, ri) {
    const urlPart = ref.internal ? '' :
      '<div style="margin-top:6px;display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:11px;color:var(--text-muted);white-space:nowrap;">URL:</span>' +
        '<input class="form-input" style="font-size:12px;padding:3px 8px;flex:1;" placeholder="https://…" value="'+escapeHTML(ref.url||'')+'" oninput="state.domainPolicies[\''+esc_fam+'\'].references['+ri+'].url=this.value;renderPolicyStep3();; window.markDirty();">' +
        (ref.url ? '<a href="'+escapeHTML(ref.url)+'" target="_blank" style="font-size:11px;color:var(--primary);text-decoration:none;white-space:nowrap;padding:3px 8px;border:1px solid var(--primary);border-radius:4px;">🔗 Open</a>' : '') +
      '</div>';
    const internalBtn = ref.internal ?
      '<div style="margin-top:8px;"><button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 12px;" onclick="goToCISOPolicyEditor()">📋 View InfoSec Policy</button></div>' : '';
    return '<div style="background:var(--bg-alt);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;display:flex;gap:10px;align-items:flex-start;">' +
      '<span style="font-size:18px;padding-top:2px;">📄</span>' +
      '<div style="flex:1;min-width:0;">' +
        '<input class="form-input" style="font-size:13px;font-weight:600;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:2px 0 5px;background:transparent;width:100%;" value="'+escapeHTML(ref.title||'')+'" oninput="state.domainPolicies[\''+esc_fam+'\'].references['+ri+'].title=this.value;; window.markDirty();" placeholder="Reference title">' +
        '<textarea class="form-input" rows="1" style="font-size:12px;color:var(--text-muted);border:none;border-radius:0;padding:3px 0;background:transparent;width:100%;margin-top:3px;resize:none;overflow:hidden;line-height:1.5;" oninput="state.domainPolicies[\''+esc_fam+'\'].references['+ri+'].description=this.value;this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\';; window.markDirty();" onfocus="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\';" placeholder="Description">'+escapeHTML(ref.description||'')+'</textarea>' +
        urlPart + internalBtn +
      '</div>' +
      '<button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;line-height:1;padding:0;opacity:0.5;" onclick="removeDomainRef(\''+esc_fam+'\','+ri+')" title="Remove">×</button>' +
    '</div>';
  }).join('');
  return cards +
    '<button class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px;border-style:dashed;" onclick="addDomainRef(\''+esc_fam+'\')">+ Add Reference</button>';
}

function addDomainRef(fam) {
  if (!state.domainPolicies[fam].references) state.domainPolicies[fam].references = [];
  state.domainPolicies[fam].references.push({ title:'', description:'', url:'', internal:false });
  renderPolicyStep3();
}

function removeDomainRef(fam, i) {
  if(confirm('Delete this reference?')) state.domainPolicies[fam].references.splice(i, 1);
  renderPolicyStep3();
}

// ── Domain revision history (read-only — same model as ISP: rows from workflow / governance, not typed into the draft) ──
function buildDomainRevisionHistoryReadOnlyHtml(dp) {
  const rev = (dp && dp.revisionHistory) ? dp.revisionHistory : [];
  if (!rev.length) {
    return '<p style="font-size:13px;color:var(--text-muted);font-style:italic;margin:0;line-height:1.55;">No revision rows yet. Entries are recorded when the CISO approves or returns this policy (and appear here and in Policy Library), matching the Tier 1 ISP.</p>';
  }
  var bodyRows = '';
  rev.slice().reverse().forEach(function(r) {
    bodyRows += '<tr style="border-bottom:1px solid var(--border);">'
      + '<td style="padding:7px 10px;font-family:monospace;font-weight:700;color:var(--teal);">v' + escapeHTML(r.version || '') + '</td>'
      + '<td style="padding:7px 10px;color:var(--text-muted);">' + escapeHTML(r.date || '') + '</td>'
      + '<td style="padding:7px 10px;">' + escapeHTML(r.author || '') + '</td>'
      + '<td style="padding:7px 10px;color:#374151;">' + escapeHTML(r.changes || '') + '</td>'
      + '</tr>';
  });
  return '<div class="table-scroll" style="margin-bottom:4px;">'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:2px solid var(--border);">'
    + '<th style="text-align:left;padding:5px 10px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Version</th>'
    + '<th style="text-align:left;padding:5px 10px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Date</th>'
    + '<th style="text-align:left;padding:5px 10px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Author</th>'
    + '<th style="text-align:left;padding:5px 10px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Changes</th>'
    + '</tr></thead><tbody>' + bodyRows + '</tbody></table></div>';
}

// Review / approval timeline for a domain family (same columns as ISP library viewer).
function buildDomainPolicyReviewApprovalLogHtml(fam) {
  var st = (state.policyStatus || {})[fam] || {};
  var rc = (state.policyReviewCycle || {})[fam] || {};
  var logRows = [];
  if (st.submittedAt || st.submittedTo) {
    var routed = (st.submittedTo || '').trim();
    if (st.submittedToRole) routed = routed ? routed + ' — ' + String(st.submittedToRole).trim() : String(st.submittedToRole).trim();
    logRows.push({
      event: 'Submitted for approval',
      date: st.submittedAt || '',
      actor: routed || getPolicyPendingReviewerDisplay(fam),
      notes: ''
    });
  }
  if (st.status === 'Approved') {
    logRows.push({
      event: 'Approved',
      date: st.approvedDate || st.approvedAt || rc.approvalDate || '',
      actor: st.approvedBy || rc.approvedBy || 'Approver',
      notes: st.notes || ''
    });
  } else if (st.status === 'Returned') {
    logRows.push({
      event: 'Returned for revision',
      date: st.returnedDate || st.returnedAt || '',
      actor: (st.returnedBy || st.approvedBy || state.programOwner || state.programOwnerTitle || 'CISO') + '',
      notes: st.notes || ''
    });
  }
  if (rc.lastReviewed || rc.nextReviewDue) {
    logRows.push({
      event: 'Review cycle updated',
      date: rc.lastReviewed || '',
      actor: rc.approvedBy || (state.domainOwners[fam] || {}).name || 'Policy owner',
      notes: rc.nextReviewDue ? ('Next review due: ' + rc.nextReviewDue) : ''
    });
  }
  if (!logRows.length) {
    return '<p style="font-size:13px;color:var(--text-muted);font-style:italic;margin:0;line-height:1.55;">No review or approval activity has been recorded for this policy yet. When you submit it for CISO review, approve it, or return it, entries appear here — matching the Tier 1 ISP.</p>';
  }
  var body = '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:2px solid var(--border);">'
    + '<th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Event</th>'
    + '<th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Date</th>'
    + '<th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">By / With</th>'
    + '<th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Notes</th>'
    + '</tr></thead><tbody>';
  logRows.forEach(function(r) {
    body += '<tr style="border-bottom:1px solid var(--border);">'
      + '<td style="padding:6px 8px;font-weight:600;color:var(--navy);">' + escapeHTML(r.event) + '</td>'
      + '<td style="padding:6px 8px;color:var(--text-muted);">' + escapeHTML(r.date || '—') + '</td>'
      + '<td style="padding:6px 8px;">' + escapeHTML(r.actor || '—') + '</td>'
      + '<td style="padding:6px 8px;color:#374151;">' + escapeHTML(r.notes || '—') + '</td>'
      + '</tr>';
  });
  return body + '</tbody></table>';
}

function openDomainPolicyInLibrary(fam) {
  var f = fam || state._policyDomain;
  if (!f) return;
  state._policyDomain = f;
  state._policyWizardMode = false;
  state._policyDocView = true;
  showTab('policy');
  renderPolicyTab();
}

function _renderDomainRevisionHistory(fam, dp) {
  const esc_fam = fam.replace(/'/g,"\\'");
  return '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;line-height:1.55;">'
    + 'Track all significant changes to this policy. This log supports version-controlled policy governance and audit traceability — the same approach as the organizational Information Security Policy (ISP): revision rows are <strong>not</strong> edited inside the draft body; they are appended when policies move through review (for example, CISO approval or return) and are always visible in <strong>Policy Library</strong>.'
    + '</div>'
    + buildDomainRevisionHistoryReadOnlyHtml(dp)
    + '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="openDomainPolicyInLibrary(\''+esc_fam+'\')">📋 Open in Policy Library</button>'
    + '<span style="font-size:12px;color:var(--text-muted);">Use the library view for the full document next to status and approval context.</span>'
    + '</div>'
    + '<div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border);">'
    + '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:10px;">✅ Review & Approval Log</div>'
    + buildDomainPolicyReviewApprovalLogHtml(fam)
    + '</div>';
}

// Navigate to ISP — always shows document viewer (admin gets Edit button inside)
function goToCISOPolicyEditor() {
    state._policyLibraryMode = false;
    state._policyDocView = false;
    showTab('policy');
    var listPanel = document.getElementById('policy-list-panel');
    var hdr = listPanel ? listPanel.querySelector('.page-header') : null;
    if (hdr) hdr.innerHTML = '<div class="role-badge">📋 Policy</div>'
      + '<h1>Information Security Policy</h1>'
      + '<p>Tier 1 organizational policy — approved and owned by the CISO.</p>';
    var body = document.getElementById('policy-list-body');
    if (!body) return;
    var isp = state.infoSecPolicy;
    if (!isp || !isp.title) {
      var editBtn = !state.currentUserId ? '<button class="btn btn-primary btn-sm" style="margin-top:16px;" onclick="showTab(\'ciso\');goToStep(\'ciso\',3);">✏️ Edit in Setup Wizard</button>' : '';
      body.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">Not Yet Published</div><p>The Information Security Policy has not been finalized yet.</p>' + editBtn + '</div>';
      return;
    }
    var ispHTML = '<div style="max-width:780px;">';
    // Clickable card header
    ispHTML += '<div id="isp-doc-card" onclick="document.getElementById(\'isp-doc-body\').style.display=document.getElementById(\'isp-doc-body\').style.display===\'none\'?\'\':\'none\';document.getElementById(\'isp-doc-chevron\').textContent=document.getElementById(\'isp-doc-body\').style.display===\'none\'?\'▼ View policy\':\'▲ Hide policy\';" style="display:flex;align-items:center;gap:10px;margin-bottom:0;padding:14px 18px;background:rgba(13,148,136,0.04);border:1px solid rgba(13,148,136,0.2);border-radius:10px 10px 0 0;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'rgba(13,148,136,0.09)\'" onmouseout="this.style.background=\'rgba(13,148,136,0.04)\'">'
      + '<span style="font-size:22px;">📋</span>'
      + '<div style="flex:1;"><div style="font-size:15px;font-weight:700;color:var(--navy);">Information Security Policy</div>'
      + '<div style="font-size:12px;color:var(--text-muted);">Tier 1 · Owned by ' + _esc(state.programOwner||'CISO') + '</div></div>'
      + '<span class="chip chip-green" style="margin-right:10px;">Published</span>'
      + '<span id="isp-doc-chevron" style="font-size:12px;color:var(--primary);font-weight:600;">▼ View policy</span>'
      + '</div>';
    // Expandable document body
    ispHTML += '<div id="isp-doc-body" style="display:none;border:1px solid rgba(13,148,136,0.2);border-top:none;border-radius:0 0 10px 10px;padding:20px 20px;margin-bottom:20px;background:white;">';
    // Render sections — handle both type-keyed content and sections with their own content field
    var hasSections = false;
    (isp.sections||[]).forEach(function(sec) {
      var content = '';
      if (sec.type === 'purpose')    content = isp.purpose||sec.content||'';
      else if (sec.type === 'scope')      content = isp.scope||sec.content||'';
      else if (sec.type === 'policy')     content = isp.policy||sec.content||'';
      else if (sec.type === 'compliance') content = isp.compliance||sec.content||'';
      else content = sec.content||'';
      if (!content) return;
      hasSections = true;
      ispHTML += '<div style="margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">' + _esc(sec.title||sec.type) + '</div>'
        + '<div style="font-size:13px;color:var(--navy);line-height:1.7;white-space:pre-wrap;">' + _esc(content) + '</div>'
        + '</div>';
    });
    // Fallback: if no sections rendered, show top-level fields directly
    if (!hasSections) {
      [['Purpose', isp.purpose||''], ['Scope', isp.scope||''], ['Policy Statement', isp.policy||''], ['Compliance', isp.compliance||'']].forEach(function(pair) {
        if (!pair[1]) return;
        ispHTML += '<div style="margin-bottom:20px;">'
          + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">' + pair[0] + '</div>'
          + '<div style="font-size:13px;color:var(--navy);line-height:1.7;white-space:pre-wrap;">' + _esc(pair[1]) + '</div>'
          + '</div>';
        hasSections = true;
      });
    }
    if (!hasSections) {
      ispHTML += '<div style="color:var(--text-muted);font-style:italic;font-size:13px;">No content has been added to this policy yet.</div>';
    }
    // Roles & Responsibilities
    if ((isp.roles||[]).length) {
      ispHTML += '<div style="margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">👥 Roles & Responsibilities</div>';
      (isp.roles||[]).forEach(function(r) {
        if (!r.name) return;
        ispHTML += '<div style="border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:8px;">'
          + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:4px;">' + _esc(r.name) + '</div>'
          + '<ul style="margin:4px 0 0 16px;padding:0;font-size:13px;color:#374151;line-height:1.6;">'
          + (r.responsibilities||[]).map(function(res){ return '<li>' + _esc(res) + '</li>'; }).join('')
          + '</ul></div>';
      });
      ispHTML += '</div>';
    }
    // Policy Requirements
    if ((isp.requirements||[]).length) {
      ispHTML += '<div style="margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">📋 Policy Requirements</div>';
      (isp.requirements||[]).forEach(function(r) {
        var mappedControls = getRequirementControlIds(r);
        var ctrlBadges = buildRequirementControlBadgeHtml(mappedControls, 8);
        var reqText = stripRequirementNistRef(r.requirement||r.text);
        ispHTML += '<div style="border-left:3px solid var(--teal);padding:10px 14px;background:#f8fafc;border-radius:0 6px 6px 0;margin-bottom:8px;">'
          + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">'
          + '<div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:4px;">' + _esc(r.id||'') + (r.title ? ' — ' + _esc(r.title) : '') + '</div>'
          + (ctrlBadges ? '<div style="display:flex;flex-wrap:wrap;gap:3px;flex-shrink:0;">'+ctrlBadges+'</div>' : '')
          + '</div>'
          + (reqText ? '<div style="font-size:13px;color:#374151;line-height:1.6;">' + _esc(reqText) + '</div>' : '')
          + (r.nistRef ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">' + _esc(r.nistRef) + '</div>' : '')
          + '</div>';
      });
      ispHTML += '</div>';
    }
    // Referenced Documents
    if ((isp.documents||[]).length) {
      ispHTML += '<div style="margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">📚 Referenced Documents</div>';
      (isp.documents||[]).forEach(function(d) {
        if (!d.title) return;
        ispHTML += '<div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;margin-bottom:6px;">'
          + '<span style="color:var(--teal);">🔗</span>'
          + '<div><span style="font-weight:600;color:var(--navy);">' + _esc(d.title) + '</span>'
          + (d.desc ? '<div style="color:var(--text-muted);font-size:12px;">' + _esc(d.desc) + '</div>' : '')
          + (d.url ? '<div style="font-size:12px;"><a href="' + _esc(d.url) + '" target="_blank" style="color:var(--teal);">' + _esc(d.url) + '</a></div>' : '')
          + '</div></div>';
      });
      ispHTML += '</div>';
    }
    // Revision History
    if ((isp.revisionHistory||[]).length) {
      ispHTML += '<div style="margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">🕑 Revision History</div>'
        + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
        + '<thead><tr style="border-bottom:2px solid var(--border);"><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Version</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Date</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Author</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Changes</th></tr></thead><tbody id="tbod-${Math.random().toString(36).slice(2,8)}">';
      (isp.revisionHistory||[]).slice().reverse().forEach(function(r) {
        ispHTML += '<tr style="border-bottom:1px solid var(--border);">'
          + '<td style="padding:6px 8px;font-family:monospace;font-weight:700;color:var(--teal);">v' + _esc(r.version||'') + '</td>'
          + '<td style="padding:6px 8px;color:var(--text-muted);">' + _esc(r.date||'') + '</td>'
          + '<td style="padding:6px 8px;">' + _esc(r.author||'') + '</td>'
          + '<td style="padding:6px 8px;color:#374151;">' + _esc(r.changes||'') + '</td>'
          + '</tr>';
      });
      ispHTML += '</tbody></table></div>';
    }
    // Review & Approval Log
    var ispStatusLog = ((state.policyStatus||{}).ISP || {});
    var ispRcLog = ((state.policyReviewCycle||{}).ISP || {});
    var logRows = [];
    if (ispStatusLog.submittedAt || ispStatusLog.submittedTo || ispRcLog.approvedBy) {
      logRows.push({
        event: 'Submitted for approval',
        date: ispStatusLog.submittedAt || '',
        actor: ispStatusLog.submittedTo || ispRcLog.approvedBy || 'Program Owner',
        notes: ''
      });
    }
    if (ispStatusLog.status === 'Approved') {
      logRows.push({
        event: 'Approved',
        date: ispStatusLog.approvedDate || ispStatusLog.approvedAt || ispRcLog.approvalDate || '',
        actor: ispStatusLog.approvedBy || ispRcLog.approvedBy || 'Approver',
        notes: ispStatusLog.notes || ''
      });
    } else if (ispStatusLog.status === 'Returned') {
      logRows.push({
        event: 'Returned for revision',
        date: ispStatusLog.returnedDate || '',
        actor: ispRcLog.approvedBy || 'Approver',
        notes: ispStatusLog.notes || ''
      });
    }
    if (ispRcLog.lastReviewed || ispRcLog.nextReviewDue) {
      logRows.push({
        event: 'Review cycle updated',
        date: ispRcLog.lastReviewed || '',
        actor: ispRcLog.approvedBy || 'Policy custodian',
        notes: (ispRcLog.nextReviewDue ? ('Next review due: ' + ispRcLog.nextReviewDue) : '')
      });
    }
    ispHTML += '<div style="margin-bottom:20px;">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">✅ Review & Approval Log</div>';
    if (logRows.length) {
      ispHTML += '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
        + '<thead><tr style="border-bottom:2px solid var(--border);"><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Event</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Date</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">By</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Notes</th></tr></thead><tbody id="tbod-${Math.random().toString(36).slice(2,8)}">';
      logRows.forEach(function(r) {
        ispHTML += '<tr style="border-bottom:1px solid var(--border);">'
          + '<td style="padding:6px 8px;font-weight:600;color:var(--navy);">' + _esc(r.event) + '</td>'
          + '<td style="padding:6px 8px;color:var(--text-muted);">' + _esc(r.date || '—') + '</td>'
          + '<td style="padding:6px 8px;">' + _esc(r.actor || '—') + '</td>'
          + '<td style="padding:6px 8px;color:#374151;">' + _esc(r.notes || '—') + '</td>'
          + '</tr>';
      });
      ispHTML += '</tbody></table>';
    } else {
      ispHTML += '<div style="color:var(--text-muted);font-size:13px;font-style:italic;">No review/approval activity has been recorded yet.</div>';
    }
    ispHTML += '</div>';
    ispHTML += '</div>';
    var viewerUser = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
    var ispSt2 = ((state.policyStatus||{}).ISP || {}).status || 'Under Review';
    var viewerCanApproveISP = false;
    if (ispSt2 === 'Under Review') {
      if (!state.currentUserId) {
        viewerCanApproveISP = true;
      } else if (viewerUser) {
        var ur = viewerUser.role;
        if (ur === 'ciso' || ur === 'admin') viewerCanApproveISP = true;
        else if (ur === 'approver' && (viewerUser.families||[]).indexOf('ISP') !== -1) viewerCanApproveISP = true;
        else {
          var subTo = (((state.policyStatus || {}).ISP) || {}).submittedTo || '';
          if (subTo && viewerUser.name && String(subTo).trim().toLowerCase() === String(viewerUser.name).trim().toLowerCase()) viewerCanApproveISP = true;
        }
      }
    }
    ispHTML += '<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;align-items:flex-start;">';
    ispHTML += '<button class="btn btn-secondary btn-sm" onclick="renderPolicyTab()">← Back to Policies</button>';
    if (!state.currentUserId) {
      ispHTML += '<button class="btn btn-primary btn-sm" onclick="openISPSuggestionModal()">📝 Propose Change</button>';
    }
    if (viewerCanApproveISP) {
      ispHTML += '</div><div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">'
        + '<div style="font-size:12px;font-weight:600;color:var(--navy);margin-bottom:6px;">Review Notes (required to return, optional to approve)</div>'
        + '<textarea id="isp-approver-notes" class="form-input" rows="3" style="font-size:13px;resize:vertical;margin-bottom:10px;" placeholder="Add any notes or conditions for approval…"></textarea>'
        + '<div style="display:flex;gap:10px;">'
        + '<button class="btn btn-sm" style="background:white;border:1px solid rgba(239,68,68,0.4);color:#dc2626;font-weight:600;" onclick="returnISPToEditor()">↩ Return with Comments</button>'
        + '<button class="btn btn-primary btn-sm" onclick="approveISP()">✅ Approve Policy</button>'
        + '</div>';
    }
    // Annual review working draft (kickoff — promoted from approved suggestions)
    var ispDraft = state.infoSecPolicyReviewDraft;
    if (ispDraft && ispDraft.content) {
      ispHTML += '<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">📋 Annual Review Working Draft</div>'
        + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Draft <strong>v' + _esc(String(ispDraft.version != null ? ispDraft.version : '1')) + '</strong>'
        + ' · Started ' + _esc(ispDraft.createdAt || '—') + ' · Updated ' + _esc(ispDraft.updatedAt || '—') + '</div>'
        + '<div style="font-size:13px;color:var(--navy);line-height:1.7;white-space:pre-wrap;border:1px solid var(--border);border-radius:8px;padding:14px;background:#f8fafc;">' + _esc(ispDraft.content) + '</div>'
        + '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">Use this consolidated text when you open the next formal review in the CISO wizard (copy into sections or attach as change notes).</div>'
        + '</div>';
    }
    // Suggested changes log (post-publication draft queue)
    if (!state.infoSecPolicySuggestions) state.infoSecPolicySuggestions = [];
    var hasApprovedSug = state.infoSecPolicySuggestions.some(function(s){ return s.status === 'Approved'; });
    ispHTML += '<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">📝 Suggested Changes (Next Review Draft)</div>';
    if (state.infoSecPolicySuggestions.length) {
      ispHTML += '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
        + '<thead><tr style="border-bottom:2px solid var(--border);"><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Date</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Suggested By</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Summary</th><th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Status</th>'
        + (!state.currentUserId ? '<th style="text-align:left;padding:5px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Actions</th>' : '')
        + '</tr></thead><tbody id="tbod-${Math.random().toString(36).slice(2,8)}">';
      state.infoSecPolicySuggestions.slice().reverse().forEach(function(s) {
        var sid = String(s.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        var act = '';
        if (!state.currentUserId) {
          if ((s.status || 'Proposed') === 'Proposed') {
            act = '<button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:11px;margin-right:4px;" onclick="approveISPSuggestion(\'' + sid + '\')">Approve</button>'
              + '<button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:11px;" onclick="rejectISPSuggestion(\'' + sid + '\')">Reject</button>';
          } else if (s.status === 'Approved') {
            act = '<span style="font-size:11px;color:var(--teal);font-weight:600;">Ready to promote</span>';
          } else {
            act = '<span style="font-size:11px;color:var(--text-muted);">—</span>';
          }
        }
        ispHTML += '<tr style="border-bottom:1px solid var(--border);">'
          + '<td style="padding:6px 8px;color:var(--text-muted);">' + _esc(s.createdAt || '—') + '</td>'
          + '<td style="padding:6px 8px;">' + _esc(s.suggestedBy || '—') + '</td>'
          + '<td style="padding:6px 8px;color:#374151;">' + _esc(s.summary || '') + '</td>'
          + '<td style="padding:6px 8px;"><span style="font-size:11px;padding:2px 8px;border-radius:12px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);color:#6366f1;">' + _esc(s.status || 'Proposed') + '</span></td>'
          + (!state.currentUserId ? '<td style="padding:6px 8px;vertical-align:middle;">' + act + '</td>' : '')
          + '</tr>';
      });
      ispHTML += '</tbody></table>';
      if (!state.currentUserId && hasApprovedSug) {
        ispHTML += '<div style="margin-top:12px;">'
          + '<button type="button" class="btn btn-primary btn-sm" onclick="promoteApprovedISPSuggestionsToReviewDraft()">📋 Promote approved suggestions into review draft</button>'
          + '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Creates or bumps the annual review working draft and marks promoted rows as <em>Promoted</em>.</div>'
          + '</div>';
      }
    } else {
      ispHTML += '<div style="color:var(--text-muted);font-size:13px;font-style:italic;">No suggested changes have been logged yet.</div>';
    }
    ispHTML += '</div>';
    ispHTML += '</div>';
    ispHTML += '</div>';
    body.innerHTML = ispHTML;
}

// Returns a concise one-line description for display in control-selection tables.
// Uses verbatim NIST SP 800-53 Rev 5 text (first sentence) when available.
function ctrlShortDesc(ctrl) {
  if (!ctrl) return '';
  // Use real NIST text — extract first sentence for short display
  if (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrl.id]) {
    const full = NIST_CONTROL_TEXT[ctrl.id];
    // Take the first line (up to first \n or 130 chars), stripping leading 'a. '
    let first = full.split('\n')[0].replace(/^a\.\s*/, '');
    if (first.length > 130) first = first.slice(0, 127) + '…';
    return first;
  }
  // Short overrides for important controls where the auto-text isn't descriptive enough
  const overrides = {
    // AC
    'AC-1':  'Establish and maintain an access control policy and implementing procedures.',
    'AC-2':  'Manage user accounts — provisioning, review, modification, and removal.',
    'AC-3':  'Enforce approved authorizations for logical access to systems and data.',
    'AC-4':  'Control information flows between systems and between interconnected networks.',
    'AC-5':  'Separate duties to prevent any single individual from performing sensitive actions alone.',
    'AC-6':  'Apply least privilege — grant only the access rights needed for assigned functions.',
    'AC-7':  'Enforce limits on failed login attempts and take action after threshold is reached.',
    'AC-8':  'Display a system use notification banner before granting access.',
    'AC-11': 'Lock the session after a defined period of inactivity.',
    'AC-12': 'Terminate sessions automatically after conditions defined by policy.',
    'AC-14': 'Identify actions permitted without authentication and document justification.',
    'AC-17': 'Establish controls for remote access including encryption and monitoring.',
    'AC-18': 'Establish controls for wireless access — authentication, authorization, and monitoring.',
    'AC-19': 'Establish controls for mobile devices — access, configuration, and enforcement.',
    'AC-20': 'Define terms and conditions for the use of external systems.',
    'AC-21': 'Control sharing of protected information with authorized users.',
    'AC-22': 'Designate individuals to post publicly accessible information and review content.',
    // AT
    'AT-1':  'Establish and maintain an awareness and training policy and implementing procedures.',
    'AT-2':  'Provide security and privacy awareness training to all personnel.',
    'AT-3':  'Provide role-based security and privacy training to personnel with security responsibilities.',
    'AT-4':  'Document and monitor individual security and privacy training activities.',
    // AU
    'AU-1':  'Establish and maintain an audit and accountability policy and implementing procedures.',
    'AU-2':  'Identify the types of events that require auditing across the system.',
    'AU-3':  'Capture sufficient detail in each audit record to support forensic investigation.',
    'AU-4':  'Allocate adequate audit log storage capacity and manage capacity thresholds.',
    'AU-5':  'Alert and respond when audit logging processes fail or reach capacity.',
    'AU-6':  'Review and analyze audit logs for indications of inappropriate activity.',
    'AU-7':  'Provide audit log reduction and report generation for analysis and review.',
    'AU-8':  'Use system clocks to generate timestamps for audit records.',
    'AU-9':  'Protect audit logs and tools from unauthorized access, modification, and deletion.',
    'AU-11': 'Retain audit logs for a defined period to support after-the-fact investigations.',
    'AU-12': 'Provide audit record generation capability on the information system.',
    // CA
    'CA-1':  'Establish and maintain an assessment, authorization, and monitoring policy.',
    'CA-2':  'Conduct security and privacy assessments of systems and controls.',
    'CA-3':  'Authorize and manage connections between the system and external systems.',
    'CA-5':  'Develop and maintain a Plan of Action and Milestones (POA&M) for known weaknesses.',
    'CA-6':  'Authorize the system for operation and manage the authorization decision.',
    'CA-7':  'Implement continuous monitoring of controls and system security posture.',
    'CA-9':  'Authorize and document internal connections between systems.',
    // CM
    'CM-1':  'Establish and maintain a configuration management policy and implementing procedures.',
    'CM-2':  'Develop, document, and maintain a baseline configuration for the system.',
    'CM-3':  'Control changes to the system through a formal change control process.',
    'CM-4':  'Analyze proposed changes for security and privacy impact before implementation.',
    'CM-5':  'Define and enforce access restrictions associated with system changes.',
    'CM-6':  'Establish and document configuration settings that reflect the most restrictive mode.',
    'CM-7':  'Configure the system to provide only essential capabilities; prohibit unused functions.',
    'CM-8':  'Maintain an inventory of system components and keep it current.',
    'CM-9':  'Develop and implement a configuration management plan for the system.',
    'CM-10': 'Comply with software licensing agreements and track software usage.',
    'CM-11': 'Establish policies for user-installed software and enforce restrictions.',
    // CP
    'CP-1':  'Establish and maintain a contingency planning policy and implementing procedures.',
    'CP-2':  'Develop, document, and maintain a contingency plan for the system.',
    'CP-3':  'Train personnel on their contingency roles and responsibilities.',
    'CP-4':  'Test the contingency plan to determine effectiveness and readiness.',
    'CP-6':  'Establish an alternate storage site for backup information.',
    'CP-7':  'Establish an alternate processing site for system recovery.',
    'CP-8':  'Establish alternate telecommunications services for mission-critical functions.',
    'CP-9':  'Back up system-level and user-level information on a defined schedule.',
    'CP-10': 'Provide for recovery and reconstitution of the system after disruption.',
    // IA
    'IA-1':  'Establish and maintain an identification and authentication policy and procedures.',
    'IA-2':  'Uniquely identify and authenticate all users of the system.',
    'IA-3':  'Identify and authenticate devices before establishing connections.',
    'IA-4':  'Manage system identifiers — issue, maintain, and revoke as needed.',
    'IA-5':  'Manage authenticators — issue, change, revoke, and verify as required.',
    'IA-6':  'Obscure feedback of authentication information to prevent unauthorized observation.',
    'IA-7':  'Use cryptographic mechanisms that comply with applicable laws and standards.',
    'IA-8':  'Identify and authenticate non-organizational users of the system.',
    'IA-11': 'Re-authenticate users and devices under defined conditions.',
    'IA-12': 'Implement identity proofing processes for users requiring accounts.',
    // IR
    'IR-1':  'Establish and maintain an incident response policy and implementing procedures.',
    'IR-2':  'Provide incident response training to personnel with assigned IR responsibilities.',
    'IR-3':  'Test the incident response capability to assess effectiveness.',
    'IR-4':  'Implement an incident handling capability — containment, eradication, and recovery.',
    'IR-5':  'Track and document system security incidents.',
    'IR-6':  'Report incidents to designated authorities within required timeframes.',
    'IR-7':  'Provide an incident response support resource or help desk for users.',
    'IR-8':  'Develop and implement an incident response plan.',
    // MA
    'MA-1':  'Establish and maintain a maintenance policy and implementing procedures.',
    'MA-2':  'Schedule, perform, document, and review maintenance on organizational systems.',
    'MA-3':  'Control, monitor, and approve the use of maintenance tools.',
    'MA-4':  'Approve and control nonlocal maintenance and diagnostic activities.',
    'MA-5':  'Establish a process for authorizing maintenance personnel.',
    'MA-6':  'Obtain maintenance support and spare parts within defined time periods.',
    // MP
    'MP-1':  'Establish and maintain a media protection policy and implementing procedures.',
    'MP-2':  'Restrict access to system media to authorized users.',
    'MP-3':  'Mark media with applicable security classifications and handling caveats.',
    'MP-4':  'Physically control and securely store system media.',
    'MP-5':  'Control the transport of system media and maintain accountability during transport.',
    'MP-6':  'Sanitize or destroy system media before disposal or reuse.',
    'MP-7':  'Restrict the use of types of system media on system components.',
    // PE
    'PE-1':  'Establish and maintain a physical and environmental protection policy.',
    'PE-2':  'Authorize and control physical access to organizational facilities.',
    'PE-3':  'Enforce physical access controls at entry and exit points.',
    'PE-4':  'Control physical access to transmission and distribution lines.',
    'PE-5':  'Control physical access to output devices to prevent unauthorized access.',
    'PE-6':  'Monitor physical access to facilities and detect physical security incidents.',
    'PE-8':  'Maintain visitor access records for defined periods.',
    'PE-9':  'Protect power equipment and power cabling from damage and destruction.',
    'PE-10': 'Provide emergency shutoff capability for the system.',
    'PE-11': 'Provide emergency power to maintain availability during disruptions.',
    'PE-12': 'Employ emergency lighting for facilities and key system areas.',
    'PE-13': 'Employ fire suppression and detection capabilities for facilities.',
    'PE-14': 'Maintain temperature and humidity levels within acceptable ranges.',
    'PE-15': 'Protect the system from water damage from leaks or flooding.',
    'PE-16': 'Control the delivery and removal of system components to and from facilities.',
    'PE-17': 'Employ security controls for alternate work sites.',
    // PL
    'PL-1':  'Establish and maintain a security and privacy planning policy and procedures.',
    'PL-2':  'Develop and maintain a security and privacy plan for the system.',
    'PL-4':  'Establish and communicate rules of behavior for system users.',
    'PL-8':  'Develop and maintain a security and privacy architecture for the organization.',
    'PL-10': 'Employ security and privacy engineering principles in the development of the system.',
    'PL-11': 'Develop a baseline security and privacy architecture tailored to the system.',
    // PM
    'PM-1':  'Develop and maintain an organization-wide information security program plan.',
    'PM-2':  'Designate a senior official with authority to coordinate the security program.',
    'PM-4':  'Implement processes to manage and track plan of action and milestones (POA&M).',
    'PM-5':  'Maintain an inventory of all organizational information systems.',
    'PM-6':  'Track and report key security measures and performance indicators.',
    'PM-7':  'Integrate enterprise architecture principles into the security program.',
    'PM-8':  'Identify and address critical information infrastructure and key resources.',
    'PM-9':  'Develop and implement a risk management strategy aligned to organizational risk tolerance.',
    'PM-10': 'Manage and control security authorizations for all organizational systems.',
    'PM-11': 'Define mission and business processes, categorize information, and allocate resources.',
    'PM-12': 'Implement insider threat programs to detect and prevent insider threat incidents.',
    'PM-13': 'Establish a security workforce development and improvement program.',
    'PM-14': 'Implement processes to test, train, and monitor security program effectiveness.',
    'PM-15': 'Maintain contacts with security groups and associations.',
    'PM-16': 'Implement a threat awareness program using information from threat intelligence sources.',
    // PS
    'PS-1':  'Establish and maintain a personnel security policy and implementing procedures.',
    'PS-2':  'Assign risk designations to organizational positions and establish screening criteria.',
    'PS-3':  'Screen individuals prior to authorizing access to organizational systems.',
    'PS-4':  'Protect organizational systems upon termination of individual employment.',
    'PS-5':  'Review access authorizations when individuals are transferred to different positions.',
    'PS-6':  'Establish and maintain access agreements for individuals requiring access to systems.',
    'PS-7':  'Establish personnel security requirements for third-party providers.',
    'PS-8':  'Employ formal sanctions for personnel who fail to comply with security policies.',
    'PS-9':  'Implement processes to protect organizational systems during and after adverse weather or other catastrophic events.',
    // PT
    'PT-1':  'Establish and maintain a PII processing and transparency policy and procedures.',
    'PT-2':  'Document the legal authority that permits the processing of PII.',
    'PT-3':  'Identify the purpose for which PII is collected and maintain that documentation.',
    'PT-4':  'Provide notice to individuals about the collection and use of their PII.',
    'PT-5':  'Provide mechanisms for individuals to access their PII and request corrections.',
    'PT-6':  'Maintain an accurate accounting of disclosures of PII.',
    'PT-7':  'Minimize the collection of PII to what is necessary for the authorized purpose.',
    'PT-8':  'Apply de-identification techniques to reduce privacy risk where appropriate.',
    // RA
    'RA-1':  'Establish and maintain a risk assessment policy and implementing procedures.',
    'RA-2':  'Categorize the system and the information it processes, stores, and transmits.',
    'RA-3':  'Conduct risk assessments and document results.',
    'RA-5':  'Scan for vulnerabilities in the system and remediate findings.',
    'RA-7':  'Respond to findings from security assessments and vulnerability scans.',
    'RA-9':  'Identify critical system components and prioritize protection accordingly.',
    // SA
    'SA-1':  'Establish and maintain a system and services acquisition policy and procedures.',
    'SA-2':  'Allocate sufficient resources to protect the system throughout its lifecycle.',
    'SA-3':  'Manage the system using a system development life cycle (SDLC) process.',
    'SA-4':  'Include security and privacy requirements in acquisition contracts.',
    'SA-5':  'Obtain and protect documentation for systems, components, and services.',
    'SA-8':  'Apply security and privacy engineering principles to the design of the system.',
    'SA-9':  'Require external service providers to comply with organizational security requirements.',
    'SA-10': 'Require developers to manage a configuration management process during development.',
    'SA-11': 'Require developers to create and implement security and privacy assessment plans.',
    'SA-15': 'Require developers to use approved development processes and tools.',
    'SA-16': 'Require developers to provide training on correct use of implemented security functions.',
    'SA-17': 'Require developers to produce a design specification and security architecture.',
    // SC
    'SC-1':  'Establish and maintain a system and communications protection policy and procedures.',
    'SC-2':  'Separate user functionality from system management functionality.',
    'SC-3':  'Isolate security functions from nonsecurity functions.',
    'SC-4':  'Prevent unauthorized information transfer via shared resources.',
    'SC-5':  'Protect against or limit the effects of denial-of-service attacks.',
    'SC-7':  'Monitor and control communications at external boundaries and key internal boundaries.',
    'SC-8':  'Implement cryptographic or physical protections for data in transit.',
    'SC-10': 'Terminate network connections after a defined inactivity period.',
    'SC-12': 'Establish and manage cryptographic keys for the system.',
    'SC-13': 'Implement NIST-approved cryptographic protections appropriate to the classification level.',
    'SC-15': 'Prohibit remote activation of collaborative computing devices without indication.',
    'SC-17': 'Issue public key infrastructure certificates from an approved certificate authority.',
    'SC-18': 'Define and enforce acceptable use of mobile code technologies.',
    'SC-19': 'Define and enforce acceptable use of VoIP technologies.',
    'SC-20': 'Provide secure name/address resolution for external queries.',
    'SC-21': 'Request and perform data origin and integrity verification on name/address resolution.',
    'SC-22': 'Implement authoritative name/address resolution services.',
    'SC-23': 'Protect the authenticity of communications sessions.',
    'SC-24': 'Maintain system state information in a defined fail state.',
    'SC-28': 'Protect the confidentiality and integrity of information at rest.',
    'SC-39': 'Maintain a separate execution domain for each executing process.',
    // SI
    'SI-1':  'Establish and maintain a system and information integrity policy and procedures.',
    'SI-2':  'Identify, report, and correct information system flaws; install security patches.',
    'SI-3':  'Implement malicious code protection at system entry and exit points.',
    'SI-4':  'Monitor the system to detect attacks and indicators of potential attacks.',
    'SI-5':  'Receive and disseminate security alerts, advisories, and directives.',
    'SI-6':  'Verify the correct operation of security functions.',
    'SI-7':  'Detect unauthorized changes to software, firmware, and information.',
    'SI-8':  'Implement spam protection mechanisms at system entry and exit points.',
    'SI-10': 'Check the validity of information inputs to the system.',
    'SI-11': 'Generate error messages that do not reveal sensitive information.',
    'SI-12': 'Manage and retain system output in accordance with applicable requirements.',
    'SI-16': 'Implement memory protection mechanisms to prevent unauthorized code execution.',
    // SR
    'SR-1':  'Establish and maintain a supply chain risk management policy and procedures.',
    'SR-2':  'Develop a plan for managing supply chain risks related to the system.',
    'SR-3':  'Establish supply chain controls and processes for the organization.',
    'SR-5':  'Employ acquisition strategies to reduce supply chain risk.',
    'SR-6':  'Include supply chain risk management requirements in supplier agreements.',
    'SR-8':  'Develop and implement a notification process for supply chain events.',
    'SR-9':  'Counter-tamper techniques to detect counterfeit or compromised system components.',
    'SR-10': 'Inspect system components for evidence of tampering or modification.',
    'SR-11': 'Use analysis tools to identify malicious code in supply chain products.',
    'SR-12': 'Maintain the provenance of system components and track disposition.',
  };
  if (overrides[ctrl.id]) return overrides[ctrl.id];
  // For enhancements (e.g. AC-2(1)), derive from base description or generate
  const base = ctrl.id.replace(/\(\d+\).*$/, '').trim();
  if (base !== ctrl.id && overrides[base]) {
    return 'Enhancement: ' + ctrl.n + ' — extends ' + base + ' with additional requirements.';
  }
  // Fallback: trim the policy statement to a concise description
  const stmt = generatePolicyStatement(ctrl);
  let desc = stmt.replace(/^The organization shall /, '');
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  // Truncate at sentence boundary or 110 chars
  const dot = desc.indexOf('. ');
  if (dot > 0 && dot < 110) desc = desc.slice(0, dot + 1);
  else if (desc.length > 110) desc = desc.slice(0, 107) + '…';
  return desc;
}

// Sort control IDs within a family (AC-2 before AC-10; enhancements after base).
function compareNistControlIds(a, b) {
  function parts(id) {
    var m = String(id).match(/^([A-Z]{2})-(\d+)(?:\((\d+)\))?/);
    if (!m) return { fam: String(id), num: 0, enh: -1, raw: String(id) };
    return { fam: m[1], num: parseInt(m[2], 10), enh: m[3] != null ? parseInt(m[3], 10) : -1, raw: String(id) };
  }
  var pa = parts(a), pb = parts(b);
  if (pa.fam !== pb.fam) return pa.fam.localeCompare(pb.fam);
  if (pa.num !== pb.num) return pa.num - pb.num;
  if (pa.enh !== pb.enh) return pa.enh - pb.enh;
  return pa.raw.localeCompare(pb.raw);
}

// One plain-language sentence per control for domain policy objectives (never paste full NIST legal text).
function ctrlObjectivePlainSentence(ctrl) {
  if (!ctrl) return '';
  var line = ctrlShortDesc(ctrl);
  var looksLegalistic = !line
    || /\[Assignment:|\[Selection:|\[FedRAMP Assignment:|\[Withdrawn:|ORGANIZATION DEFINED/i.test(line)
    || /The organization shall\b/i.test(line)
    || (/^The organization /i.test(line) && line.length > 95)
    || (line.length > 160 && /\bshall\b|\bdefined by\b/i.test(line));
  if (looksLegalistic) {
    return 'Carry out ' + ctrl.n + ' (' + ctrl.id + ') with clear ownership, documented choices on parameters and scope, and evidence an assessor can trace.';
  }
  var out = line.charAt(0).toUpperCase() + line.slice(1).replace(/\s+$/, '');
  if (!/[.!?]$/.test(out)) out += '.';
  return out;
}

// Human-readable policy requirement = control objective for one or more mapped controls (same family).
function generateDomainPolicyObjective(fam, cids) {
  var famLabel = FAMILIES[fam] || fam;
  var sorted = (cids || []).slice().filter(Boolean);
  sorted.sort(compareNistControlIds);
  if (!sorted.length) {
    return 'Write a short policy-level control objective in plain language. Map one or more controls from this family using the tags above. Control owners then operationalize literal NIST statements (parts a–e, enhancements, parameters) in the control design wizard so implementation meets both this objective and the official control text.';
  }
  var ctrls = sorted.map(function(cid) { return CONTROLS.find(function(c) { return c.id === cid; }); }).filter(Boolean);
  var idList = sorted.join(', ');
  var primary = ctrls[0];
  var primarySent = ctrlObjectivePlainSentence(primary);
  var enh = ctrls.slice(1);
  var tail = '';
  if (enh.length) {
    tail = ' Related mapped items ' + enh.map(function(c) { return c.id; }).join(', ') + ' extend or sharpen this expectation; each is documented and tested in its own control design record.';
  }
  return 'Control objective (' + famLabel + ') for ' + idList + ': ' + primarySent + tail + ' Detailed NIST wording and enhancement-specific measures are captured per control ID in the control design wizard and must still be satisfied.';
}

function generatePolicyStatement(ctrl) {
  if (!ctrl) return 'The organization shall implement and maintain this control in accordance with its risk management strategy.';
  // Use verbatim NIST SP 800-53 Rev 5 text if available
  if (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrl.id]) {
    return NIST_CONTROL_TEXT[ctrl.id];
  }
  const n = ctrl.n.toLowerCase();
  const cid = ctrl.id;
  // Fallback: auditor-ready policy requirement statements
  const stmts = {
    'policy and procedures': `The organization shall develop, document, disseminate, and annually review ${FAMILIES[ctrl.f]||ctrl.f} policy and associated implementing procedures. Policies shall define the scope, roles, responsibilities, management commitment, and coordination among organizational entities. Procedures shall address all applicable ${ctrl.f} controls. (${cid})`,
    'account management': 'All user accounts must be uniquely assigned and authenticated prior to system access. The organization shall manage information system accounts through their full lifecycle — creation, activation, modification, periodic review (at least quarterly), disabling of inactive accounts after [30] days, and removal upon termination. Shared or group accounts shall require documented justification and ISSM approval. (AC-2)',
    'access enforcement': 'The organization shall enforce approved authorizations for logical access to systems and data using role-based access controls (RBAC) or attribute-based access controls (ABAC) in accordance with the principle of least privilege. Access enforcement mechanisms shall be tested annually. (AC-3)',
    'information flow enforcement': 'The organization shall enforce approved authorizations for controlling the flow of information within the system and between interconnected systems using boundary protection devices. Information flow policies shall prevent unauthorized data exfiltration and enforce data classification rules. (AC-4)',
    'separation of duties': 'The organization shall enforce separation of duties through assigned information system access authorizations. No single individual shall have the ability to both authorize and execute critical actions without independent review. Separation of duty policies shall be documented and reviewed annually. (AC-5)',
    'least privilege': 'The organization shall employ the principle of least privilege, allowing only authorized accesses for users and processes which are necessary to accomplish assigned tasks. Privileged accounts shall be restricted to authorized administrators and reviewed quarterly. (AC-6)',
    'remote access': 'The organization shall authorize, monitor, and control all remote access to the information system. Remote access sessions shall use encrypted communications (FIPS 140-validated), multi-factor authentication, and shall be terminated after [30] minutes of inactivity. (AC-17)',
    'access control for mobile': 'The organization shall establish usage restrictions, configuration requirements, and connection requirements for mobile devices accessing organizational systems. (AC-19)',
    'security awareness training': 'All personnel shall complete initial security awareness training before being granted system access and annually thereafter. Role-based security training shall be provided to personnel with significant security responsibilities within [30] days of role assignment. Training completion records shall be maintained. (AT-2, AT-3)',
    'audit events': 'The organization shall determine that the information system generates audit records containing sufficient detail to establish what type of event occurred, when and where the event occurred, the source and outcome of the event, and the identity of any individuals or subjects associated with the event. Audit logs shall be retained for a minimum of [one year]. (AU-2, AU-3)',
    'audit review': 'The organization shall review and analyze audit records at least [weekly] for indications of inappropriate or unusual activity and report findings to designated organizational officials. Automated mechanisms shall be used to integrate audit review, analysis, and reporting. (AU-6)',
    'audit storage': 'The organization shall allocate sufficient audit record storage capacity and configure audit log storage to prevent capacity-related audit failures. Audit records shall be protected from unauthorized access, modification, and deletion. (AU-4, AU-9)',
    'security assessment': 'The organization shall conduct security control assessments at least annually to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome. Assessment results shall be documented in a Security Assessment Report (SAR). (CA-2)',
    'system interconnection': 'The organization shall authorize all connections from the system to other information systems through the use of Interconnection Security Agreements (ISAs) and shall monitor system interconnections on an ongoing basis. (CA-3)',
    'plan of action': 'The organization shall develop and maintain a plan of action and milestones (POA&M) for the information system to document planned remedial actions to correct weaknesses or deficiencies noted during assessments. POA&Ms shall be reviewed at least [quarterly]. (CA-5)',
    'continuous monitoring': 'The organization shall develop a continuous monitoring strategy and program that includes establishment of metrics, ongoing assessments, and reporting of the security state of the system. (CA-7)',
    'baseline configuration': 'The organization shall develop, document, and maintain a current baseline configuration of the information system under configuration control. Deviations from the approved baseline shall require documented change requests and ISSM approval. (CM-2)',
    'configuration change': 'The organization shall analyze changes to the information system to determine potential security impacts prior to change implementation. All configuration changes shall follow a formal change management process with testing, approval, and rollback procedures. (CM-3, CM-4)',
    'access restrictions for change': 'The organization shall define, document, approve, and enforce physical and logical access restrictions associated with changes to the information system. Only authorized personnel shall make configuration changes. (CM-5)',
    'least functionality': 'The organization shall configure the information system to provide only essential capabilities and prohibit or restrict the use of unnecessary functions, ports, protocols, and services. (CM-7)',
    'contingency plan': 'The organization shall develop, maintain, and test a contingency plan for the information system that addresses recovery objectives (RTO/RPO), roles and responsibilities, and coordination with related plans. Contingency plans shall be tested at least annually and updated based on test results. (CP-2)',
    'system backup': 'The organization shall conduct backups of user-level and system-level information at a frequency consistent with the organization\'s recovery time and recovery point objectives. Backup integrity shall be verified and restoration procedures tested at least annually. (CP-9)',
    'system recovery': 'The organization shall provide for the recovery and reconstitution of the information system to a known state after a disruption, compromise, or failure. Recovery procedures shall be tested as part of contingency plan testing. (CP-10)',
    'identification and authentication': 'The organization shall uniquely identify and authenticate organizational users (or processes acting on behalf of organizational users). Multi-factor authentication shall be required for all privileged accounts and remote access. Authenticator management shall include initial distribution, lost/compromised procedures, and periodic refresh. (IA-2, IA-5)',
    'incident handling': 'The organization shall implement an incident handling capability that includes preparation, detection and analysis, containment, eradication, recovery, and post-incident activity. Security incidents shall be reported within [1 hour] of detection and tracked through resolution. Lessons learned shall be incorporated into incident response procedures. (IR-4)',
    'incident reporting': 'The organization shall require personnel to report suspected security incidents to the incident response team within [1 hour] of discovery and shall report incidents to [US-CERT/CISA] within required timeframes. (IR-6)',
    'incident response plan': 'The organization shall develop, distribute, and maintain an incident response plan that provides the organization with a roadmap for implementing its incident response capability. The plan shall be reviewed and updated at least annually. (IR-8)',
    'system maintenance': 'The organization shall schedule, perform, document, and review maintenance and repairs on information system components in accordance with manufacturer specifications and organizational requirements. Maintenance activities shall be authorized and logged. (MA-2)',
    'maintenance personnel': 'The organization shall establish a process for authorizing maintenance personnel and verify that they possess required access authorizations before performing maintenance activities. Maintenance activities by non-cleared personnel shall be supervised. (MA-5)',
    'media protection': 'The organization shall protect, control, and restrict physical access to information system media (both digital and non-digital). Media containing sensitive information shall be sanitized or destroyed prior to disposal using NIST SP 800-88 guidelines. (MP-2, MP-6)',
    'physical access': 'The organization shall enforce physical access authorizations at all access points to the facility and maintain physical access audit logs. Visitors shall be escorted and their activities monitored. Physical access authorizations shall be reviewed at least [quarterly]. (PE-2, PE-3)',
    'physical environment': 'The organization shall protect the information system from environmental hazards (temperature, humidity, fire, flood, power disruption) and employ environmental controls, monitoring, and alarms to detect conditions that may be harmful to personnel or equipment. (PE-9 through PE-15)',
    'personnel screening': 'The organization shall screen individuals prior to authorizing access to organizational systems. Screening shall be consistent with position risk designations and shall be re-verified at a frequency defined by the organization. (PS-3)',
    'personnel termination': 'Upon termination of employment, the organization shall disable system access within [same business day], retrieve all security-related property, and conduct an exit interview that includes reminding the individual of confidentiality obligations. (PS-4)',
    'risk assessment': 'The organization shall conduct risk assessments that identify threats and vulnerabilities, determine the likelihood and magnitude of harm, and document results in a risk assessment report. Risk assessments shall be updated at least annually or upon significant system changes. (RA-3)',
    'vulnerability scanning': 'The organization shall scan for vulnerabilities in the information system at least [monthly] and upon discovery of new vulnerabilities. Identified vulnerabilities shall be remediated within timeframes defined by severity: critical within [15] days, high within [30] days, moderate within [90] days. (RA-5)',
    'system development': 'The organization shall manage the information system using a defined system development life cycle (SDLC) that includes security considerations at each phase. Security engineering principles shall be applied to the design, development, implementation, and modification of the system. (SA-3, SA-8)',
    'acquisition process': 'The organization shall include security and privacy functional requirements, strength requirements, and security documentation requirements in the acquisition contract for the information system. (SA-4)',
    'boundary protection': 'The organization shall monitor and control communications at external and key internal boundaries of the system. Boundary protection devices shall deny network traffic by default and allow by exception. Network architecture shall employ physically or logically separated subnets for publicly accessible system components. (SC-7)',
    'transmission': 'The organization shall implement cryptographic mechanisms using FIPS 140-validated modules to protect the confidentiality and integrity of information during transmission. TLS 1.2 or higher shall be required for all data in transit. (SC-8, SC-13)',
    'cryptographic': 'The organization shall establish and manage cryptographic keys using NIST-approved key management technology and processes. Cryptographic protection shall use FIPS 140-validated modules. (SC-12, SC-13)',
    'flaw remediation': 'The organization shall identify, report, and correct information system flaws. Security-relevant software and firmware updates shall be tested and installed within timeframes defined by severity: critical within [48 hours], high within [7 days]. (SI-2)',
    'malicious code': 'The organization shall implement malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code. Protection mechanisms shall be updated whenever new releases are available and shall perform real-time scanning during file download, open, and execution. (SI-3)',
    'information system monitoring': 'The organization shall monitor the information system to detect attacks, indicators of potential attacks, unauthorized local/network/remote connections, and other anomalous activity. Monitoring information shall be provided to [ISSM, CISO, SOC] as appropriate. (SI-4)',
    'supply chain risk': 'The organization shall develop and implement a supply chain risk management plan that identifies, assesses, and mitigates supply chain risks. Acquisition decisions shall include supply chain risk considerations. (SR-1, SR-2)',
  };
  const key = Object.keys(stmts).find(k=>n.includes(k));
  if (key) return stmts[key];
  return `The organization shall ${n.startsWith('identification')||n.startsWith('incident')||n.startsWith('information') ? 'establish and maintain' : 'implement and maintain'} ${ctrl.n.toLowerCase()} capabilities in accordance with NIST SP 800-53 Rev. 5 requirements. Implementation shall be documented, tested at least annually, and updated upon significant system or organizational change. (${cid})`;
}

function renderPolicyStep3() {
  const body = document.getElementById('policy-step-3-body');
  if (!body) return;
  const fam = state._policyDomain || getActiveFamilies().filter(function(f){ return f!=='PM'; })[0];
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">Setup Required</div><p>Complete the CISO program setup (baseline, PM controls, policy, and owner assignments) and then select your controls before you can view details here.</p></div>';
    return;
  }
  initDomainPolicy(fam);
  const dp = state.domainPolicies[fam];
  const selected = (state.policySelectedControls||{})[fam]||[];
  // Auto-append rows only when the control selection changes — not on every render,
  // otherwise _migrateDomainPolicy + render would immediately re-create deleted requirements.
  if (!state._domainPolicyReqSyncSigByFam) state._domainPolicyReqSyncSigByFam = {};
  var selSigNow = selected.slice().sort().join('\u0001');
  if (state._domainPolicyReqSyncSigByFam[fam] !== selSigNow) {
    syncDomainPolicyRequirementsFromSelection(fam);
    state._domainPolicyReqSyncSigByFam[fam] = selSigNow;
  }

  // Build sections HTML
  const sectionsHTML = dp.sections.map(function(sec, si) {
    const total = dp.sections.length;
    const esc_fam = fam.replace(/'/g,"\\'");
    const dragAttr = 'draggable="true" ondragstart="dpDragStart(event,\''+esc_fam+'\','+si+')" ondragover="dpDragOver(event)" ondrop="dpDrop(event,\''+esc_fam+'\','+si+')" ondragend="dpDragEnd(event)"';
    const upBtn   = si>0       ? '<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveDomainSection(\''+esc_fam+'\','+si+',-1)" title="Move up">▲</button>' : '';
    const downBtn = si<total-1 ? '<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveDomainSection(\''+esc_fam+'\','+si+',1)" title="Move down">▼</button>' : '';
    const delBtn  = sec.type==='custom' ? '<button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:2px 6px;opacity:0.7;" onclick="removeDomainSection(\''+esc_fam+'\','+si+')" title="Remove section">🗑</button>' : '';

    const hdr = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:2px solid var(--border);padding-bottom:6px;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="cursor:grab;color:var(--text-muted);font-size:16px;" title="Drag to reorder">⠿</span>' +
        '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--navy);">'+(si+1)+'. '+escapeHTML(sec.title)+'</div>' +
      '</div>' +
      '<div style="display:flex;gap:4px;align-items:center;">'+upBtn+downBtn+delBtn+'</div>' +
    '</div>';

    let content = '';
    if (sec.type === 'purpose') {
      content = '<textarea class="form-input" rows="4" style="font-size:13px;line-height:1.7;resize:vertical;" oninput="state.domainPolicies[\''+esc_fam+'\'].purpose=this.value; window.markDirty();">'+escapeHTML(dp.purpose||'')+'</textarea>';
    } else if (sec.type === 'scope') {
      content = '<textarea class="form-input" rows="3" style="font-size:13px;line-height:1.7;resize:vertical;" oninput="state.domainPolicies[\''+esc_fam+'\'].scope=this.value; window.markDirty();">'+escapeHTML(dp.scope||'')+'</textarea>';
    } else if (sec.type === 'roles') {
      content = _renderDomainRoles(fam, dp);
    } else if (sec.type === 'requirements') {
      content = _renderDomainRequirements(fam, dp, selected);
    } else if (sec.type === 'exceptions') {
      content = '<div style="display:flex;flex-direction:column;gap:16px;">' +
        '<div><label class="form-label" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Exceptions</label>' +
        '<textarea class="form-input" rows="4" style="font-size:12px;line-height:1.6;resize:vertical;" oninput="state.domainPolicies[\''+esc_fam+'\'].exceptions=this.value; window.markDirty();">'+escapeHTML(dp.exceptions||'')+'</textarea></div>' +
        '<div><label class="form-label" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Enforcement</label>' +
        '<textarea class="form-input" rows="4" style="font-size:12px;line-height:1.6;resize:vertical;" oninput="state.domainPolicies[\''+esc_fam+'\'].enforcement=this.value; window.markDirty();">'+escapeHTML(dp.enforcement||'')+'</textarea></div>' +
        '</div>';
    } else if (sec.type === 'references') {
      content = _renderDomainReferences(fam, dp);
    } else if (sec.type === 'revision-history') {
      content = _renderDomainRevisionHistory(fam, dp);
    } else if (sec.type === 'custom') {
      content = '<div style="margin-bottom:8px;"><input class="form-input" style="font-size:14px;font-weight:600;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:4px 0;background:transparent;" value="'+escapeHTML(sec.title)+'" oninput="state.domainPolicies[\''+esc_fam+'\'].sections['+si+'].title=this.value;renderPolicyStep3();; window.markDirty();" placeholder="Section title"></div>' +
        '<textarea class="form-input" rows="5" style="font-size:13px;line-height:1.7;resize:vertical;" oninput="state.domainPolicies[\''+esc_fam+'\'].sections['+si+'].content=this.value; window.markDirty();" placeholder="Enter section content…">'+(sec.content||'')+'</textarea>';
    }
    return '<div class="isp-section" data-section-idx="'+si+'" '+dragAttr+' style="margin-bottom:28px;padding:4px 4px 4px 4px;border-radius:6px;transition:background 0.15s;">'+hdr+content+'</div>';
  }).join('');

  body.innerHTML =
    '<div style="display:flex;gap:0;height:100%;">' +

    // ── LEFT PANEL ─────────────────────────────────────────────
    '<div style="width:196px;flex-shrink:0;border-right:1px solid var(--border);padding:20px 14px;background:#fafbfc;display:flex;flex-direction:column;gap:12px;overflow-y:auto;">' +
      '<div>' +
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Domain</div>' +
        '<span class="family-badge" style="font-size:13px;">'+fam+'</span>' +
        '<div style="font-size:13px;font-weight:600;margin-top:6px;">'+(FAMILIES[fam]||fam)+'</div>' +
      '</div>' +
      '<div style="border-top:1px solid var(--border);padding-top:12px;">' +
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Controls in Policy</div>' +
        '<div style="font-size:22px;font-weight:800;color:var(--navy);">'+selected.length+'</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">selected controls</div>' +
        '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;max-height:120px;overflow-y:auto;">' +
          selected.map(function(cid){ return '<span style="font-family:monospace;font-size:10px;font-weight:700;background:rgba(13,148,136,0.1);color:var(--teal);padding:2px 5px;border-radius:3px;">'+cid+'</span>'; }).join('') +
        '</div>' +
      '</div>' +
      '<div style="border-top:1px solid var(--border);padding-top:12px;">' +
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">Version</div>' +
        '<input class="form-input" style="font-size:13px;" value="'+escapeHTML(dp.version)+'" oninput="state.domainPolicies[\''+fam+'\'].version=this.value; window.markDirty();">' +
      '</div>' +
      '<div>' +
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">Effective Date</div>' +
        '<input class="form-input" type="date" style="font-size:12px;" value="'+dp.effectiveDate+'" oninput="state.domainPolicies[\''+fam+'\'].effectiveDate=this.value; window.markDirty();">' +
      '</div>' +
      '<div>' +
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">Review Cycle</div>' +
        '<select class="form-select" style="font-size:12px;" onchange="state.domainPolicies[\''+fam+'\'].reviewCycle=this.value">' +
          '<option'+(dp.reviewCycle==='Annual'?' selected':'')+'>Annual</option>' +
          '<option'+(dp.reviewCycle==='Semi-Annual'?' selected':'')+'>Semi-Annual</option>' +
          '<option'+(dp.reviewCycle==='Quarterly'?' selected':'')+'>Quarterly</option>' +
        '</select>' +
      '</div>' +
      '<div style="border-top:1px solid var(--border);padding-top:12px;margin-top:auto;">' +
        '<div style="font-size:11px;color:var(--text-muted);line-height:1.5;">ℹ️ Domain policy for '+selected.length+' selected control'+(selected.length!==1?'s':'')+'. Governs implementation within the '+fam+' family.</div>' +
      '</div>' +
    '</div>' +

    // ── RIGHT: POLICY DOCUMENT ──────────────────────────────────
    '<div style="flex:1;overflow-y:auto;padding:24px 28px;">' +

      // Title bar
      '<div style="margin-bottom:20px;">' +
        '<input style="font-size:22px;font-weight:800;color:var(--navy);border:none;border-bottom:2px solid var(--border);width:100%;padding:4px 0;background:transparent;outline:none;" value="'+escapeHTML(dp.title)+'" oninput="state.domainPolicies[\''+fam+'\'].title=this.value; window.markDirty();" placeholder="Policy Title">' +
        '<div style="display:flex;gap:12px;margin-top:8px;align-items:center;">' +
          '<span class="chip chip-blue">Draft</span>' +
          '<span style="font-size:12px;color:var(--text-muted);">v'+escapeHTML(dp.version)+' · Effective '+dp.effectiveDate+' · '+dp.reviewCycle+' review</span>' +
        '</div>' +
      '</div>' +

      // Toolbar
      '<div style="display:flex;gap:10px;margin-bottom:20px;justify-content:space-between;align-items:center;">' +
        '<button class="btn btn-secondary btn-sm" onclick="addDomainCustomSection(\''+fam+'\')" style="display:flex;align-items:center;gap:5px;">+ Add Custom Section</button>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-secondary btn-sm" onclick="exportDomainPolicyPDF(\''+fam+'\')" style="display:flex;align-items:center;gap:5px;">📄 Export PDF</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="exportDomainPolicyWord(\''+fam+'\')" style="display:flex;align-items:center;gap:5px;">📝 Export Word</button>' +
        '</div>' +
      '</div>' +

      // Sections
      '<div id="dp-sections-container-'+fam+'">' + sectionsHTML + '</div>' +

    '</div>' +
    '</div>';
  autoExpandTextareas(body);
}

// ── Domain policy section sub-renderers ──────────────────────────────────────

function _renderDomainRoles(fam, dp) {
  const esc_fam = fam.replace(/'/g,"\\'");
  const nRoles = (dp.roles||[]).length;
  let html = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">' +
    '<button class="btn btn-secondary btn-sm" onclick="addDomainRole(\''+esc_fam+'\')">+ Add Role</button>' +
    '</div><div>';
  (dp.roles||[]).forEach(function(role, ri) {
    const upBtn = (nRoles > 1 && ri > 0) ? '<button type="button" class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveDomainRole(\''+esc_fam+'\','+ri+',-1)" title="Move up">▲</button>' : '';
    const downBtn = (nRoles > 1 && ri < nRoles - 1) ? '<button type="button" class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveDomainRole(\''+esc_fam+'\','+ri+',1)" title="Move down">▼</button>' : '';
    const delBtn = (nRoles > 1) ? '<button type="button" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:2px 6px;opacity:0.7;" onclick="removeDomainRole(\''+esc_fam+'\','+ri+')" title="Remove role">✕</button>' : '';
    const reorderBtns = (nRoles > 1) ? '<div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">' + upBtn + downBtn + delBtn + '</div>' : '';
    html += '<div style="border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px;background:#fafbfc;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:flex-start;gap:8px;flex:1;min-width:0;">' +
          '<span style="color:var(--text-muted);font-size:16px;line-height:1.4;margin-top:4px;user-select:none;" title="Reorder with arrows">⠿</span>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;">' +
            '<input class="form-input" style="font-weight:600;font-size:14px;" value="'+escapeHTML(role.name)+'" placeholder="Role or office title (full name)" oninput="state.domainPolicies[\''+esc_fam+'\'].roles['+ri+'].name=this.value; window.markDirty();">' +
            '<input class="form-input" style="font-size:13px;" value="'+escapeHTML(role.title)+'" placeholder="Optional — team, org unit, or context" oninput="state.domainPolicies[\''+esc_fam+'\'].roles['+ri+'].title=this.value; window.markDirty();">' +
          '</div>' +
        '</div>' +
        reorderBtns +
      '</div>';
    (role.responsibilities||[]).forEach(function(r, rsi) {
      html += '<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">' +
        '<span style="color:var(--text-muted);font-size:16px;line-height:1;margin-top:7px;">·</span>' +
        '<textarea class="form-input" rows="1" style="font-size:12px;flex:1;resize:none;overflow:hidden;line-height:1.5;" placeholder="Responsibility…" oninput="state.domainPolicies[\''+esc_fam+'\'].roles['+ri+'].responsibilities['+rsi+']=this.value;this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\';; window.markDirty();" onfocus="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\';">'+escapeHTML(r)+'</textarea>' +
        '<button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:12px;margin-top:6px;" onclick="removeDomainResp(\''+esc_fam+'\','+ri+','+rsi+')">✕</button>' +
      '</div>';
    });
    html += '<button class="btn btn-secondary btn-sm" style="margin-top:6px;font-size:11px;" onclick="addDomainResp(\''+esc_fam+'\','+ri+')">+ Responsibility</button>' +
    '</div>';
  });
  return html + '</div>';
}

function _renderDomainRequirements(fam, dp, selected) {
  const esc_fam = fam.replace(/'/g,"\\'");
  // Controls already mapped to at least one requirement
  const allMapped = (dp.requirements||[]).reduce(function(acc,r){ return acc.concat(r.controls||[]); }, []);
  // Controls available to add to a new requirement (in selected but not yet in any req)
  const unmapped = selected.filter(function(cid){ return !allMapped.includes(cid); });

  let html = '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;line-height:1.55;">Each row is a <strong>policy-level control objective</strong> in plain language. Map <strong>one or more</strong> controls from this family (including enhancements) to the same objective where that makes sense. The control design wizard is where owners operationalize literal NIST text (parts a–e, enhancements, parameters) so implementation meets both this objective and the official control statement.</div>';

  (dp.requirements||[]).forEach(function(req, qi) {
    const ctrlTags = (req.controls||[]).map(function(cid) {
      const ctrl = CONTROLS.find(function(c){ return c.id===cid; });
      return '<span style="display:inline-flex;align-items:center;gap:3px;font-family:monospace;font-size:11px;font-weight:700;background:rgba(13,148,136,0.12);color:var(--teal);padding:2px 6px;border-radius:10px;margin-right:4px;">' +
        cid + (ctrl?'<span style="font-family:sans-serif;font-size:10px;font-weight:400;color:var(--text-muted);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"> '+ctrl.n+'</span>':'') +
        '<button style="background:none;border:none;color:var(--teal);cursor:pointer;font-size:11px;padding:0 0 0 2px;line-height:1;" onclick="removeDomainReqCtrl(\''+esc_fam+'\','+qi+',\''+cid+'\')">×</button>' +
      '</span>';
    }).join('');

    // Build the "add control" picker: select from controls that are in selected[] and not already in THIS requirement
    const availableForReq = selected.filter(function(cid){ return !(req.controls||[]).includes(cid); });
    const addCtrlPicker = availableForReq.length > 0
      ? '<span style="display:inline-flex;align-items:center;gap:4px;">' +
          '<select id="dp-ctrl-pick-'+fam+'-'+qi+'" style="font-size:11px;padding:2px 4px;border:1px solid var(--border);border-radius:6px;background:white;max-width:130px;">' +
            availableForReq.map(function(cid){ const ctrl=CONTROLS.find(function(c){return c.id===cid;}); return '<option value="'+cid+'">'+cid+(ctrl?' — '+ctrl.n.substring(0,20):'')+'</option>'; }).join('') +
          '</select>' +
          '<button class="btn btn-secondary btn-sm" style="font-size:11px;padding:2px 8px;" onclick="addDomainReqCtrl(\''+esc_fam+'\','+qi+')">+ Add</button>' +
        '</span>'
      : '';

    html += '<div style="border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:10px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
        '<div>' +
          '<span style="font-size:11px;font-weight:700;color:var(--teal);background:rgba(13,148,136,0.1);padding:2px 8px;border-radius:10px;white-space:nowrap;margin-right:8px;">'+req.id+'</span>' +
          '<div style="display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:6px;">'+ctrlTags+addCtrlPicker+'</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px;flex-shrink:0;">' +
          (qi>0?'<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveDomainReq(\''+esc_fam+'\','+qi+',-1)" title="Move up">▲</button>':'') +
          (qi<(dp.requirements.length-1)?'<button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="moveDomainReq(\''+esc_fam+'\','+qi+',1)" title="Move down">▼</button>':'') +
          '<button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:12px;padding:2px 6px;" onclick="removeDomainReq(\''+esc_fam+'\','+qi+')" title="Remove requirement">✕</button>' +
        '</div>' +
      '</div>' +
      '<textarea class="form-input" rows="4" style="font-size:12px;line-height:1.6;resize:vertical;" oninput="state.domainPolicies[\''+esc_fam+'\'].requirements['+qi+'].text=this.value; window.markDirty();">'+escapeHTML(req.text||'')+'</textarea>' +
    '</div>';
  });

  // New blank requirement button + unmapped controls hint
  html += '<div style="display:flex;align-items:center;gap:10px;margin-top:4px;">' +
    '<button class="btn btn-secondary btn-sm" onclick="addDomainReq(\''+esc_fam+'\')">+ Add Requirement</button>' +
    (unmapped.length>0 ? '<span style="font-size:11px;color:var(--amber);">⚠ '+unmapped.length+' selected control'+(unmapped.length>1?'s':'')+' not yet in any requirement: '+unmapped.join(', ')+'</span>' : '<span style="font-size:11px;color:var(--green);">✓ All selected controls are mapped.</span>') +
  '</div>';

  return html;
}

// ── Domain policy helper functions ──────────────────────────────────────────

function addDomainRole(fam) {
  state.domainPolicies[fam].roles.push({name:'New Role', title:'', responsibilities:['']});
  renderPolicyStep3();
}
function removeDomainRole(fam, i) {
  const roles = state.domainPolicies[fam].roles;
  if (!roles || roles.length <= 1) return;
  roles.splice(i,1);
  try { window.markDirty(); } catch (e) {}
  renderPolicyStep3();
}
function moveDomainRole(fam, i, dir) {
  const roles = state.domainPolicies[fam].roles;
  if (!roles || roles.length < 2) return;
  const j = i + dir;
  if (j < 0 || j >= roles.length) return;
  const tmp = roles[i];
  roles[i] = roles[j];
  roles[j] = tmp;
  try { window.markDirty(); } catch (e) {}
  renderPolicyStep3();
}
function addDomainResp(fam, ri) {
  state.domainPolicies[fam].roles[ri].responsibilities.push('');
  renderPolicyStep3();
}
function removeDomainResp(fam, ri, rsi) {
  state.domainPolicies[fam].roles[ri].responsibilities.splice(rsi,1);
  renderPolicyStep3();
}
function addDomainReq(fam) {
  const dp = state.domainPolicies[fam];
  const n = (dp.requirements||[]).length;
  if (!dp.requirements) dp.requirements = [];
  dp.requirements.push({ id: fam+'-REQ-'+(n+1), controls: [], text: '' });
  renderPolicyStep3();
}
function removeDomainReq(fam, qi) {
  if (!state.domainPolicies || !state.domainPolicies[fam] || !state.domainPolicies[fam].requirements) return;
  const reqs = state.domainPolicies[fam].requirements;
  if (qi < 0 || qi >= reqs.length) return;
  reqs.splice(qi, 1);
  renumberDomainReqs(fam);
  try { markDirty(); } catch (e) {}
  renderPolicyStep3();
}
function addDomainReqCtrl(fam, qi) {
  const sel = document.getElementById('dp-ctrl-pick-'+fam+'-'+qi);
  if (!sel) return;
  const cid = sel.value;
  if (!cid) return;
  const req = state.domainPolicies[fam].requirements[qi];
  if (!req.controls) req.controls = [];
  if (!req.controls.includes(cid)) req.controls.push(cid);
  renderPolicyStep3();
}
function removeDomainReqCtrl(fam, qi, cid) {
  const req = state.domainPolicies[fam].requirements[qi];
  req.controls = (req.controls||[]).filter(function(c){ return c!==cid; });
  renderPolicyStep3();
}
function moveDomainReq(fam, i, dir) {
  const reqs = state.domainPolicies[fam].requirements;
  const j = i+dir;
  if (j>=0 && j<reqs.length) { const tmp=reqs[i]; reqs[i]=reqs[j]; reqs[j]=tmp; renumberDomainReqs(fam); renderPolicyStep3(); }
}
function moveDomainSection(fam, i, dir) {
  const secs = state.domainPolicies[fam].sections;
  const j = i+dir;
  if (j>=0 && j<secs.length) { const tmp=secs[i]; secs[i]=secs[j]; secs[j]=tmp; renderPolicyStep3(); }
}
function removeDomainSection(fam, i) {
  var sec = state.domainPolicies[fam].sections[i];
  var removed = cloneStateValue(sec);
  pushScopedUndo({
    label: 'Removed domain policy section (' + fam + ')',
    undo: function() {
      if (!state.domainPolicies[fam]) state.domainPolicies[fam] = { sections: [] };
      if (!state.domainPolicies[fam].sections) state.domainPolicies[fam].sections = [];
      state.domainPolicies[fam].sections.splice(i, 0, removed);
      try { renderPolicyStep3(); } catch (eR) {}
    }
  });
  state.domainPolicies[fam].sections.splice(i,1);
  renderPolicyStep3();
}
function addDomainCustomSection(fam) {
  state.domainPolicies[fam].sections.push({ type:'custom', title:'New Section', content:'' });
  renderPolicyStep3();
}

// Drag-and-drop for domain policy sections
let _dpDragFam = null, _dpDragIdx = null;
function dpDragStart(e, fam, idx) { _dpDragFam=fam; _dpDragIdx=idx; e.dataTransfer.effectAllowed='move'; e.target.style.opacity='0.5'; }
function dpDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect='move'; }
function dpDragEnd(e) { e.target.style.opacity='1'; _dpDragFam=null; _dpDragIdx=null; }
function dpDrop(e, fam, targetIdx) {
  e.preventDefault();
  if (_dpDragFam!==fam || _dpDragIdx===null || _dpDragIdx===targetIdx) return;
  const secs = state.domainPolicies[fam].sections;
  const item = secs.splice(_dpDragIdx,1)[0];
  secs.splice(targetIdx,0,item);
  _dpDragFam=null; _dpDragIdx=null;
  renderPolicyStep3();
}

function exportDomainPolicyPDF(fam) { showToast('PDF export coming soon.'); }
function exportDomainPolicyWord(fam) { showToast('Word export coming soon.'); }

// ============================================================
// POLICY STEP 4: ASSIGN CONTROL OWNERS (was Step 3)
// ============================================================
function renderPolicyStep4() {
  const body = document.getElementById('policy-step-4-body');
  if (!body) return;
  const fam = state._policyDomain || getActiveFamilies().filter(f=>f!=='PM')[0];
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">Setup Required</div><p>The CISO must complete all program setup steps first, including baseline selection, PM controls, and policy creation.</p></div>`;
    return;
  }
  const selected = (state.policySelectedControls||{})[fam]||[];
  if (!state.controlOwners) state.controlOwners = {};
  const dp = state.domainPolicies?.[fam];
  const assignedCount = selected.filter(cid=>state.controlOwners[cid]?.name).length;

  body.innerHTML = `
    <div style="display:flex; gap:0; height:100%;">

      <!-- LEFT PANEL -->
      <div style="width:200px; flex-shrink:0; border-right:1px solid var(--border); padding:20px 16px; background:#fafbfc; display:flex; flex-direction:column; gap:12px;">
        <div>
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:6px;">Assignment Progress</div>
          <div style="font-size:22px; font-weight:800; color:var(--navy);">${assignedCount}<span style="font-size:13px; font-weight:400; color:var(--text-muted);"> / ${selected.length}</span></div>
          <div class="progress-bar-wrap" style="margin-top:6px;"><div class="progress-bar-fill" style="width:${selected.length?Math.round(assignedCount/selected.length*100):0}%"></div></div>
        </div>

        <div style="border-top:1px solid var(--border); padding-top:12px;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px;">Batch Assign</div>

          <!-- Quick-fill from known people (stored in window._s4People to avoid JSON-in-attribute bug) -->
          ${(()=>{
            const people = [];
            // Users from state.users (control-owner and issm roles)
            (state.users||[]).forEach(function(u) {
              if (!u.name) return;
              const m = ROLE_META[u.role] || {};
              if (!people.find(function(p){ return p.name===u.name; }))
                people.push({ name: u.name, role: m.label||u.role||'', email: u.email||'' });
            });
            // Domain owner if not already included
            const dOwner = state.domainOwners[fam];
            if (dOwner && dOwner.name && !people.find(function(p){ return p.name===dOwner.name; }))
              people.push({ name: dOwner.name, role: dOwner.role||'', email: dOwner.email||'' });
            window._s4People = people;
            if (!people.length) return '';
            const opts = people.map(function(p,i){ return '<option value="' + i + '">' + escapeHTML(p.name) + (p.role?' — '+escapeHTML(p.role):'') + '</option>'; }).join('');
            return '<div class="form-group" style="margin-bottom:8px;">'
              + '<label class="form-label" style="font-size:11px;">Quick-fill from</label>'
              + '<select class="form-select" style="font-size:11px;" onchange="step4QuickFill(this.value);this.value=\'\'"><option value="">— pick a person…</option>' + opts + '</select>'
              + '</div>';
          })()}

          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label" style="font-size:11px;">Name</label>
            <input class="form-input" id="batchOwnerName" style="font-size:12px;" placeholder="Owner name…">
          </div>
          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label" style="font-size:11px;">Role / Title</label>
            <input class="form-input" id="batchOwnerRole" style="font-size:12px;" placeholder="e.g. IT Security Manager">
          </div>
          <div class="form-group" style="margin-bottom:8px;">
            <label class="form-label" style="font-size:11px;">Email</label>
            <input class="form-input" id="batchOwnerEmail" type="email" style="font-size:12px;" placeholder="email@org.com">
          </div>
          <button class="btn btn-primary btn-sm" style="width:100%; margin-bottom:6px;" onclick="batchAssignControlOwners('${fam}', false)">Apply to Unassigned</button>
          <button class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:6px;" onclick="batchAssignControlOwners('${fam}', true)">Overwrite All</button>
          <button type="button" class="btn btn-secondary btn-sm" style="width:100%;" onclick="openBulkAssignControlModal('${fam}')">Bulk assign (picker)…</button>
        </div>

        ${!state.currentUserId ? `<div style="border-top:1px solid var(--border); padding-top:12px;">
          <button onclick="prefillDemoControlOwners('${fam}')" style="width:100%;font-size:11px;font-weight:700;color:#a5b4fc;background:rgba(165,180,252,0.1);border:1px solid rgba(165,180,252,0.3);border-radius:6px;padding:6px 10px;cursor:pointer;">🧪 Prefill demo data</button>
        </div>` : ''}

        <div style="margin-top:auto; border-top:1px solid var(--border); padding-top:12px;">
          <div style="font-size:11px; color:var(--text-muted); line-height:1.5;">Control owners will be notified via the Control Owner tab to begin implementation and evidence collection.</div>
        </div>
      </div>

      <!-- RIGHT: CONTROL OWNER TABLE -->
      <div style="flex:1; overflow-y:auto; padding:20px 24px;">
        <div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:4px;">
          <div class="section-title" style="font-size:16px; margin-bottom:0;">Assign Control Owners</div>
          <div style="font-size:12px; color:var(--text-muted);">${assignedCount} of ${selected.length} assigned</div>
        </div>
        <div class="section-subtitle" style="margin-bottom:16px;">${selected.length} controls in scope for <strong>${FAMILIES[fam]||fam}</strong>. Pick someone from the list or type a name below.</div>

        <table class="control-table" style="width:100%; table-layout:fixed;">
          <colgroup>
            <col style="width:90px;">
            <col style="width:auto;">
            <col style="width:280px;">
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>Control</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody id="control-owner-list">
          ${(()=>{
            const cardUsers = (state.users||[]).filter(function(u){ return u.name; });
            const cardDOwner = state.domainOwners[fam];
            if (cardDOwner && cardDOwner.name && !cardUsers.find(function(u){ return u.name===cardDOwner.name; }))
              cardUsers.unshift({ id:'_downer', name: cardDOwner.name, role: cardDOwner.role||'', email: cardDOwner.email||'' });
            window._s4People = cardUsers.map(function(u){ const m=ROLE_META[u.role]||{}; return { name:u.name, role:m.label||u.role||'', email:u.email||'' }; });
            return selected.map(function(cid) {
              const ctrl = CONTROLS.find(function(c){ return c.id===cid; });
              const co = state.controlOwners[cid]||{};
              const isAssigned = !!co.name;
              const cidSafe = cid.replace(/[()]/g,'_');
              // Find index of currently assigned person in roster
              const assignedIdx = co.name ? cardUsers.findIndex(function(u){ return u.name===co.name; }) : -1;
              const customSel = assignedIdx < 0 && (co.name || '').trim() ? ' selected' : '';
              const selectOpts = '<option value="">— assign owner…</option>'
                + cardUsers.map(function(u,i){ return '<option value="' + i + '"' + (i===assignedIdx?' selected':'') + '>' + escapeHTML(u.name) + (u.role?' — '+escapeHTML((ROLE_META[u.role]||{}).label||u.role):'') + '</option>'; }).join('')
                + '<option value="__custom__"' + customSel + '>+ Type a different name…</option>';
              return '<tr id="cocard-' + cidSafe + '" style="background:' + (isAssigned?'rgba(13,148,136,0.02)':'') + ';">'
                + '<td><span class="control-id" style="font-size:12px;">' + cid + '</span></td>'
                + '<td><div style="font-weight:600;font-size:13px;line-height:1.3;">' + escapeHTML(ctrl&&ctrl.n||cid) + '</div>'
                + (ctrl&&ctrl.d ? '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;white-space:normal;">' + escapeHTML(ctrl.d) + '</div>' : '') + '</td>'
                + '<td style="vertical-align:top;">'
                + (cardUsers.length
                  ? '<select class="form-select" style="font-size:12px;margin-bottom:4px;" onchange="step4CardFill(\'' + cid + '\',this.value)">' + selectOpts + '</select>'
                  : '')
                + '<input class="form-input co-name" data-cid="' + cid + '" style="font-size:12px;width:100%;box-sizing:border-box;" placeholder="Owner name (optional if you picked someone above)" value="' + escapeHTML(co.name||'') + '" oninput="setCtrlOwner(\'' + cid + '\',\'name\',this.value);step4RosterSync(\'' + cid + '\');_coCardUpdate(\'' + cid + '\',this.value);">'
                + (co.isDemoPlaceholder ? '<div class="demo-placeholder-badge" style="margin-top:6px;">Demo placeholder — replace before submit</div>' : '')
                + (isAssigned ? '<div style="font-size:10px;color:var(--teal);margin-top:2px;">✓ Assigned</div>' : '')
                + '</td>'
                + '</tr>';
            }).join('');
          })()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Fill batch-assign fields from a user picked in the left-panel quick-fill dropdown
function step4QuickFill(idx) {
  if (idx === '') return;
  const p = (window._s4People || [])[+idx];
  if (!p) return;
  const n = document.getElementById('batchOwnerName'); if (n) n.value = p.name||'';
  const r = document.getElementById('batchOwnerRole'); if (r) r.value = p.role||'';
  const e = document.getElementById('batchOwnerEmail'); if (e) e.value = p.email||'';
}

// Fill a single control-owner row from a user chosen in that row's dropdown
function step4CardFill(cid, idx) {
  const cidSafe = cid.replace(/[()]/g,'_');
  const row = document.getElementById('cocard-' + cidSafe);
  const nameInput = row ? row.querySelector('.co-name') : null;
  if (idx === '__custom__') {
    if (nameInput) nameInput.focus();
    return;
  }
  if (idx === '') {
    setCtrlOwner(cid, 'name', '');
    setCtrlOwner(cid, 'role', '');
    setCtrlOwner(cid, 'email', '');
    if (nameInput) { nameInput.value = ''; nameInput.focus(); }
    _coCardUpdate(cid, '');
    return;
  }
  const p = (window._s4People || [])[+idx];
  if (!p) return;
  setCtrlOwner(cid, 'name',  p.name||'');
  setCtrlOwner(cid, 'role',  p.role||'');
  setCtrlOwner(cid, 'email', p.email||'');
  if (nameInput) nameInput.value = p.name||'';
  _coCardUpdate(cid, p.name||'');
}

// Keep row dropdown in sync when the name field is edited manually
function step4RosterSync(cid) {
  const cidSafe = cid.replace(/[()]/g,'_');
  const row = document.getElementById('cocard-' + cidSafe);
  const sel = row && row.querySelector('td select.form-select');
  const nameInput = row && row.querySelector('.co-name');
  if (!sel || !nameInput) return;
  const n = (nameInput.value || '').trim();
  const people = window._s4People || [];
  const rosterIdx = people.findIndex(function(p) { return (p.name || '').trim() === n; });
  if (rosterIdx >= 0) sel.value = String(rosterIdx);
  else if (n) sel.value = '__custom__';
  else sel.value = '';
}

// Update card border/background to reflect assigned state
function _coCardUpdate(cid, name) {
  const cidSafe = cid.replace(/[()]/g,'_');
  const card = document.getElementById('cocard-' + cidSafe);
  if (!card) return;
  const assigned = !!(name && name.trim());
  card.style.borderColor = assigned ? 'rgba(13,148,136,0.3)' : 'var(--border)';
  card.style.background  = assigned ? 'rgba(13,148,136,0.02)' : 'white';
  const chip = card.querySelector('.chip');
  if (chip) { chip.className = assigned ? 'chip chip-green' : 'chip chip-gray'; chip.textContent = assigned ? '✓ Assigned' : 'Unassigned'; }
  // Update progress bar
  const fam = state._policyDomain;
  const selected = (state.policySelectedControls||{})[fam]||[];
  const assignedCount = selected.filter(function(c){ return state.controlOwners[c]&&state.controlOwners[c].name; }).length;
  const bar = document.querySelector('#policy-step-4-body .progress-bar-fill');
  if (bar) bar.style.width = (selected.length ? Math.round(assignedCount/selected.length*100) : 0) + '%';
}

function setCtrlOwner(ctrlId, field, value) {
  if (!state.controlOwners) state.controlOwners = {};
  if (!state.controlOwners[ctrlId]) state.controlOwners[ctrlId] = {};
  var path = 'controlOwners.' + ctrlId + '.' + field;
  var prev = state.controlOwners[ctrlId][field];
  state.controlOwners[ctrlId][field] = value;
  if (field === 'name' || field === 'email') {
    delete state.controlOwners[ctrlId].isDemoPlaceholder;
  }
  logFieldChange(path, prev, value);
  // Refresh assignment count in left panel
  const fam = state._policyDomain;
  const selected = (state.policySelectedControls||{})[fam]||[];
  const assignedCount = selected.filter(cid=>state.controlOwners[cid]?.name).length;
  const el = document.querySelector('#policy-step-4-body .progress-bar-fill');
  if (el) el.style.width = `${selected.length?Math.round(assignedCount/selected.length*100):0}%`;
}

function runBulkControlOwnerAssign(fam, cidList, person, overwrite, onDone) {
  if (!state.controlOwners) state.controlOwners = {};
  var i = 0;
  var count = 0;
  function chunk() {
    var end = Math.min(i + 10, cidList.length);
    for (; i < end; i++) {
      var cid = cidList[i];
      if (!overwrite && state.controlOwners[cid] && state.controlOwners[cid].name) continue;
      var prevName = (state.controlOwners[cid] || {}).name;
      state.controlOwners[cid] = { name: person.name, role: person.role, email: person.email };
      logFieldChange('controlOwners.' + cid + '.name', prevName, person.name);
      count++;
    }
    if (i < cidList.length) requestAnimationFrame(chunk);
    else {
      if (count) addAuditEntry('program', null, 'Bulk assigned ' + count + ' control owner(s) in ' + fam + ' to ' + person.name + '.');
      if (onDone) onDone(count);
    }
  }
  requestAnimationFrame(chunk);
}

function batchAssignControlOwners(fam, overwrite) {
  const name = document.getElementById('batchOwnerName')?.value.trim()||'';
  const role = document.getElementById('batchOwnerRole')?.value.trim()||'';
  const email = document.getElementById('batchOwnerEmail')?.value.trim()||'';
  if (!name) { showToast('Please enter an owner name first.', true); return; }
  const selected = (state.policySelectedControls||{})[fam]||[];
  const cidList = selected.filter(function(cid) { return overwrite || !state.controlOwners[cid]?.name; });
  if (!cidList.length) { showToast('No matching controls to update.', true); return; }
  runBulkControlOwnerAssign(fam, cidList, { name: name, role: role, email: email }, overwrite, function(count) {
    showToast('✅ ' + count + ' control' + (count !== 1 ? 's' : '') + ' assigned to ' + name + '.');
    renderPolicyStep4();
  });
}

function openBulkAssignControlModal(fam) {
  const selected = (state.policySelectedControls||{})[fam]||[];
  if (!selected.length) { showToast('No controls in this policy to assign.', true); return; }
  document.getElementById('bulkAssignModalOverlay')?.remove();
  const cardUsers = (state.users||[]).filter(function(u){ return u.name; });
  const cardDOwner = state.domainOwners[fam];
  if (cardDOwner && cardDOwner.name && !cardUsers.find(function(u){ return u.name===cardDOwner.name; }))
    cardUsers.unshift({ id:'_downer', name: cardDOwner.name, role: cardDOwner.role||'', email: cardDOwner.email||'' });
  window._bulkModalPeople = cardUsers.map(function(u){ const m=ROLE_META[u.role]||{}; return { name:u.name, role:m.label||u.role||'', email:u.email||'' }; });
  const rows = selected.map(function(cid) {
    const ctrl = CONTROLS.find(function(c){ return c.id===cid; });
    const co = (state.controlOwners||{})[cid]||{};
    const attrCid = cid.replace(/"/g, '');
    return '<tr style="border-bottom:1px solid #f1f5f9;">'
      + '<td style="padding:6px 8px;"><input type="checkbox" class="bulk-assign-cb" data-cid="' + attrCid + '" checked></td>'
      + '<td style="padding:6px 8px;font-family:monospace;font-size:11px;font-weight:700;">' + escapeHTML(cid) + '</td>'
      + '<td style="padding:6px 8px;font-size:12px;">' + escapeHTML((ctrl && ctrl.n) || cid) + '</td>'
      + '<td style="padding:6px 8px;font-size:11px;color:var(--text-muted);">' + escapeHTML(co.name || '—') + '</td>'
      + '</tr>';
  }).join('');
  const personOpts = '<option value="">— Quick-fill from roster —</option>'
    + (window._bulkModalPeople||[]).map(function(p, i) {
      return '<option value="' + i + '">' + escapeHTML(p.name) + '</option>';
    }).join('');
  const overlay = document.createElement('div');
  overlay.id = 'bulkAssignModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10060;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = '<div style="background:white;border-radius:14px;max-width:720px;width:100%;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="padding:18px 20px;border-bottom:1px solid var(--border);">'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);">Bulk assign control owners</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + escapeHTML(FAMILIES[fam]||fam) + ' · select controls, then apply an owner in batches.</div></div>'
    + '<div style="padding:12px 20px;display:flex;flex-wrap:wrap;gap:10px;border-bottom:1px solid #f1f5f9;">'
    + '<select class="form-select" style="font-size:12px;min-width:220px;" id="bulkModalQuick" onchange="bulkModalQuickFill(this.value);this.value=\'\'">' + personOpts + '</select>'
    + '<label style="font-size:11px;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="bulkModalOverwrite"> Overwrite existing owners</label>'
    + '</div>'
    + '<div style="padding:10px 20px;display:flex;flex-wrap:wrap;gap:10px;">'
    + '<div style="flex:1;min-width:140px;"><label class="form-label" style="font-size:10px;">Name *</label><input class="form-input" id="bulkModalName" style="font-size:12px;"></div>'
    + '<div style="flex:1;min-width:120px;"><label class="form-label" style="font-size:10px;">Role</label><input class="form-input" id="bulkModalRole" style="font-size:12px;"></div>'
    + '<div style="flex:1;min-width:160px;"><label class="form-label" style="font-size:10px;">Email</label><input class="form-input" id="bulkModalEmail" type="email" style="font-size:12px;"></div>'
    + '</div>'
    + '<div style="flex:1;overflow:auto;padding:0 20px 12px;">'
    + '<table class="control-table" style="width:100%;font-size:12px;"><thead><tr><th style="width:36px;"><input type="checkbox" id="bulkModalSelectAll" checked title="Select all"></th><th style="width:100px;">ID</th><th>Control</th><th style="width:140px;">Current</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;">'
    + '<button type="button" class="btn btn-secondary" id="bulkModalCancel">Cancel</button>'
    + '<button type="button" class="btn btn-primary" id="bulkModalApply">Apply to selected</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  document.getElementById('bulkModalCancel').onclick = function() { overlay.remove(); };
  document.getElementById('bulkModalApply').onclick = function() { applyBulkAssignFromModal(fam); };
  var allBox = document.getElementById('bulkModalSelectAll');
  allBox.addEventListener('change', function() {
    document.querySelectorAll('#bulkAssignModalOverlay .bulk-assign-cb').forEach(function(cb) { cb.checked = allBox.checked; });
  });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

function bulkModalQuickFill(idx) {
  if (idx === '') return;
  var p = (window._bulkModalPeople || [])[+idx];
  if (!p) return;
  var n = document.getElementById('bulkModalName'); if (n) n.value = p.name||'';
  var r = document.getElementById('bulkModalRole'); if (r) r.value = p.role||'';
  var e = document.getElementById('bulkModalEmail'); if (e) e.value = p.email||'';
}

function applyBulkAssignFromModal(fam) {
  var name = (document.getElementById('bulkModalName')||{}).value.trim();
  if (!name) { showToast('Owner name is required.', true); return; }
  var role = (document.getElementById('bulkModalRole')||{}).value.trim();
  var email = (document.getElementById('bulkModalEmail')||{}).value.trim();
  var overwrite = !!(document.getElementById('bulkModalOverwrite')||{}).checked;
  var cids = [];
  document.querySelectorAll('#bulkAssignModalOverlay .bulk-assign-cb').forEach(function(cb) {
    if (cb.checked && cb.getAttribute('data-cid')) cids.push(cb.getAttribute('data-cid'));
  });
  if (!cids.length) { showToast('Select at least one control.', true); return; }
  document.getElementById('bulkAssignModalOverlay')?.remove();
  runBulkControlOwnerAssign(fam, cids, { name: name, role: role, email: email }, overwrite, function(count) {
    if (!count) showToast('No assignments applied — selected rows may already have owners (enable overwrite).', true);
    else showToast('✅ Assigned ' + count + ' control(s) to ' + name + '.');
    renderPolicyStep4();
  });
}

function showSubmitModal() {
  const fam = state._policyDomain;
  const selected = (state.policySelectedControls||{})[fam]||[];
  const assigned = selected.filter(cid=>state.controlOwners?.[cid]?.name).length;
  const dp = state.domainPolicies?.[fam];
  const overlay = document.createElement('div');
  overlay.id = 'submitModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="background:white;border-radius:16px;padding:32px;width:480px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:8px;">Submit Policy for CISO Approval</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:24px;">Review the summary below, then submit your domain policy for CISO review and approval.</div>'
    + '<div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px;">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    + '<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Domain</div><div style="font-size:14px;font-weight:700;color:var(--navy);">' + (FAMILIES[fam]||fam) + '</div></div>'
    + '<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Policy Title</div><div style="font-size:13px;font-weight:600;color:var(--navy);">' + (dp&&dp.title||'Untitled') + '</div></div>'
    + '<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Controls</div><div style="font-size:14px;font-weight:700;color:var(--navy);">' + selected.length + ' in policy</div></div>'
    + '<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Owners Assigned</div><div style="font-size:14px;font-weight:700;color:' + (assigned===selected.length?'var(--teal)':'var(--amber)') + ';">' + assigned + ' / ' + selected.length + '</div></div>'
    + '</div></div>'
    + (assigned < selected.length ? '<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:12px;margin-bottom:20px;font-size:12px;color:var(--amber);">\u26A0\uFE0F ' + (selected.length - assigned) + ' control(s) have no owner assigned. You can still submit, but consider assigning owners first.</div>' : '')
    + '<div style="display:flex;gap:12px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'submitModalOverlay\').remove()">Cancel</button>'
    + '<button class="btn btn-navy" onclick="confirmSubmitDomainPolicy()">\u2713 Submit for Approval</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function confirmSubmitDomainPolicy() {
  if (blockActionIfDemoPlaceholders()) return;
  clearScopedUndoStack('policy submit');
  const fam = state._policyDomain || getActiveFamilies().filter(f=>f!=='PM')[0];
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.policyStatus[fam]) state.policyStatus[fam] = {};
  var rc = (state.policyReviewCycle || {})[fam] || {};
  var useCustom = rc._customApprover && (rc.approvedBy || '').trim();
  var reviewerName = useCustom ? rc.approvedBy.trim() : (state.programOwner || '').trim();
  var reviewerRole = useCustom ? (rc.approverRole || '').trim() : (state.programOwnerTitle || 'CISO').trim();
  var reviewerEmail = useCustom ? (rc.approverEmail || '').trim() : (state.programOwnerEmail || '').trim();
  state.policyStatus[fam].submittedTo = reviewerName || (state.programOwner || 'CISO');
  state.policyStatus[fam].submittedToRole = reviewerRole;
  state.policyStatus[fam].submittedToEmail = reviewerEmail;
  state.policyStatus[fam].submittedAt = new Date().toISOString().slice(0, 10);
  state.policyStatus[fam].status = 'Under Review';
  state.policyStatus[fam].lastUpdated = new Date().toLocaleDateString();
  state.policyStatus[fam].version = state.domainPolicies?.[fam]?.version||'1.0';
  document.getElementById('submitModalOverlay')?.remove();
  showToast('\u2705 Policy submitted for CISO review — routed to ' + (reviewerName || 'program owner') + '.');
  markDirty();
  exitPolicyWizard();
}

// ============================================================
// CONTROL OWNER TAB
// ============================================================
function renderControlTab() {
  var workspace = document.getElementById('control-workspace-panel');
  var library = document.getElementById('control-library-panel');
  var controlNav = document.getElementById('nav-control');
  var controlLibNav = document.getElementById('nav-control-library');
  if (controlNav) controlNav.classList.toggle('active', !state._controlLibraryMode);
  if (controlLibNav) controlLibNav.classList.toggle('active', !!state._controlLibraryMode);
  if (state._controlLibraryMode) {
    if (workspace) workspace.style.display = 'none';
    if (library) library.style.display = '';
    renderControlLibraryView();
    return;
  }
  if (library) library.style.display = 'none';
  if (workspace) workspace.style.display = '';
  renderControlStep(currentStep.control);
}

function getControlComplianceSummary(controlId) {
  var totalTargets = 0;
  var answered = 0;
  var complies = 0;
  var statuses = {};
  (state.assets || []).forEach(function(a) {
    var controls = getAssetSSPControls(a) || [];
    if (!controls.some(function(c) { return c.id === controlId; })) return;
    totalTargets++;
    var att = ((state.sspAttestations || {})[a.id] || {})[controlId] || {};
    if (att.status) {
      answered++;
      statuses[att.status] = (statuses[att.status] || 0) + 1;
      if (att.status === 'Complies') complies++;
    }
  });
  (state.processes || []).forEach(function(p) {
    var controls = getProcessSSPControls(p) || [];
    if (!controls.some(function(c) { return c.id === controlId; })) return;
    totalTargets++;
    var att = ((state.sspAttestations || {})[p.id] || {})[controlId] || {};
    if (att.status) {
      answered++;
      statuses[att.status] = (statuses[att.status] || 0) + 1;
      if (att.status === 'Complies') complies++;
    }
  });
  var pct = answered ? Math.round((complies / answered) * 100) : null;
  return { totalTargets: totalTargets, answered: answered, complies: complies, pct: pct, statuses: statuses };
}

function getControlDeselectLifecycle(ctrlId) {
  var cs = state.controlStatus[ctrlId] || {};
  var proposed = !!cs.recommendedDeselect;
  var decision = cs.deselectDecision || '';
  var status = 'Not Proposed';
  if (proposed && !decision) status = 'Proposed';
  if (decision === 'Approved') status = 'Approved';
  if (decision === 'Rejected') status = 'Rejected';
  return {
    status: status,
    proposed: proposed,
    reason: cs.deselectReason || '',
    proposedAt: cs.deselectProposedAt || '',
    proposedBy: cs.deselectProposedBy || '',
    decidedAt: cs.deselectDecidedAt || '',
    decidedBy: cs.deselectDecidedBy || '',
    decisionReason: cs.deselectDecisionReason || ''
  };
}

function renderControlLibraryView() {
  var body = document.getElementById('control-library-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div><p>Complete baseline selection to generate the control catalog.</p></div>';
    return;
  }
  var controls = getActiveControls();
  var families = Array.from(new Set(controls.map(function(c) { return c.f; }))).sort();
  var allTypeLabels = [];
  ASSET_TYPES.forEach(function(cat) { cat.types.forEach(function(t) { allTypeLabels.push(t.label); }); });
  (state.customAssetTypes || []).forEach(function(t) { if (t && !allTypeLabels.includes(t)) allTypeLabels.push(t); });
  var familyFilter = state._controlLibraryFamilyFilter || '';
  var statusFilter = state._controlLibraryStatusFilter || '';
  var assetTypeFilter = state._controlLibraryAssetTypeFilter || '';
  var q = (state._controlLibrarySearch || '').toLowerCase();
  function inActiveBaseline(c) {
    return c.bl && (c.bl.indexOf(state.baseline) !== -1 || (state.privacyOverlay && c.bl.indexOf('P') !== -1));
  }
  var deselectBaselineCount = controls.filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    return cs.deselectDecision === 'Approved' && inActiveBaseline(c);
  }).length;
  var rows = controls.filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    var status = cs.status || 'Not Started';
    var cov = getCtrlCoveredAssetTypes(c.id).map(function(t) { return t.label; });
    var typeMatch = !assetTypeFilter || cov.includes(assetTypeFilter);
    var qMatch = !q || c.id.toLowerCase().includes(q) || c.n.toLowerCase().includes(q);
    var deselBaseline = cs.deselectDecision === 'Approved' && inActiveBaseline(c);
    if (statusFilter === '__deselected__' && !deselBaseline) return false;
    return (!familyFilter || c.f === familyFilter) && (!statusFilter || statusFilter === '__deselected__' || status === statusFilter) && typeMatch && qMatch;
  });
  var selectedTypeCount = rows.filter(function(c) { return getCtrlCoveredAssetTypes(c.id).length > 0; }).length;
  var designedCount = rows.filter(function(c) { return isControlDesigned(c.id); }).length;
  body.innerHTML = (deselectBaselineCount ? '<div class="callout-deselected-baseline" style="border:1px solid #f59e0b;background:#fffbeb;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:12px;color:#92400e;"><strong>Baseline de-selections:</strong> ' + deselectBaselineCount + ' control(s) are formally de-selected from the active baseline but remain visible here for traceability. Use the status filter <em>De-selected (baseline)</em> to list them.</div>' : '')
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">'
    + '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">Controls</div><div style="font-size:24px;font-weight:800;color:#1d4ed8;">' + rows.length + '</div></div>'
    + '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;">Designed</div><div style="font-size:24px;font-weight:800;color:#166534;">' + designedCount + '</div></div>'
    + '<div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#6366f1;text-transform:uppercase;">With Asset Applicability</div><div style="font-size:24px;font-weight:800;color:#6366f1;">' + selectedTypeCount + '</div></div>'
    + '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;">De-select Proposed</div><div style="font-size:24px;font-weight:800;color:#92400e;">' + rows.filter(function(c){ return (state.controlStatus[c.id]||{}).recommendedDeselect; }).length + '</div></div>'
    + '</div>'
    + '<div class="filter-bar" style="margin-bottom:12px;">'
    + '<input class="form-input" value="' + escapeHTML(state._controlLibrarySearch || '') + '" placeholder="Search control ID or name..." oninput="state._controlLibrarySearch=this.value;renderControlLibraryView()">'
    + '<select class="form-select" onchange="state._controlLibraryFamilyFilter=this.value;renderControlLibraryView()"><option value="">All families</option>'
    + families.map(function(f){ return '<option value="' + f + '"' + (familyFilter===f?' selected':'') + '>' + f + ' — ' + (FAMILIES[f]||f) + '</option>'; }).join('')
    + '</select>'
    + '<select class="form-select" onchange="state._controlLibraryStatusFilter=this.value;renderControlLibraryView()"><option value="">All statuses</option>'
    + ['Not Started','Planned','In Progress','Implemented','Not Applicable','Inherited'].map(function(s){ return '<option' + (statusFilter===s?' selected':'') + '>' + s + '</option>'; }).join('')
    + '<option value="__deselected__"' + (statusFilter==='__deselected__'?' selected':'') + '>De-selected (baseline)</option>'
    + '</select>'
    + '<select class="form-select" onchange="state._controlLibraryAssetTypeFilter=this.value;renderControlLibraryView()"><option value="">All asset types</option>'
    + allTypeLabels.map(function(t){ return '<option value="' + escapeHTML(t) + '"' + (assetTypeFilter===t?' selected':'') + '>' + escapeHTML(t) + '</option>'; }).join('')
    + '</select>'
    + '</div>'
    + '<div class="table-scroll"><table class="control-table"><thead><tr><th style="width:92px;">Control</th><th>Name</th><th style="width:150px;">Owner</th><th style="width:120px;">Implementation</th><th style="width:220px;">Asset Applicability</th><th style="width:90px;">Req Targets</th><th style="width:110px;">Compliance</th><th style="width:140px;">De-select Lifecycle</th></tr></thead><tbody>'
    + rows.map(function(c) {
      var cs = state.controlStatus[c.id] || {};
      var owner = (state.controlOwners || {})[c.id] || {};
      var cov = getCtrlCoveredAssetTypes(c.id).map(function(t) { return t.label; });
      var linksCount = (cs.linkedAssets || []).length + (cs.linkedProcesses || []).length;
      var compliance = getControlComplianceSummary(c.id);
      var lifecycle = getControlDeselectLifecycle(c.id);
      var lcColor = lifecycle.status === 'Approved' ? '#166534' : lifecycle.status === 'Rejected' ? '#b45309' : lifecycle.status === 'Proposed' ? '#92400e' : '#64748b';
      var deselBaseline = cs.deselectDecision === 'Approved' && inActiveBaseline(c);
      return '<tr class="' + (deselBaseline ? 'tr-deselected-baseline ' : '') + 'control-lib-row" style="cursor:pointer;" onclick="openControlFromLibrary(\'' + c.id.replace(/'/g,"\\'") + '\')">'
        + '<td><span class="control-id">' + c.id + '</span></td>'
        + '<td style="font-size:12px;color:var(--navy);">' + escapeHTML(c.n) + '</td>'
        + '<td style="font-size:12px;color:var(--text-muted);">' + escapeHTML(owner.name || 'Unassigned') + '</td>'
        + '<td>' + chipHTML(cs.status || 'Not Started') + '</td>'
        + '<td style="font-size:11px;color:var(--text-muted);">' + (cov.length ? escapeHTML(cov.slice(0, 2).join(' · ')) + (cov.length > 2 ? ' +' + (cov.length - 2) : '') : 'Not scoped') + '</td>'
        + '<td style="font-size:12px;color:var(--navy);">' + linksCount + '</td>'
        + '<td style="font-size:11px;color:var(--text-muted);">' + (compliance.pct === null ? 'Pending' : compliance.pct + '%') + (compliance.totalTargets ? '<div style="font-size:10px;">' + compliance.answered + '/' + compliance.totalTargets + ' attested</div>' : '<div style="font-size:10px;">No targets yet</div>') + '</td>'
        + '<td style="font-size:11px;color:' + lcColor + ';font-weight:700;">' + lifecycle.status + (lifecycle.reason ? '<div style="font-size:10px;color:var(--text-muted);font-weight:400;">' + escapeHTML(lifecycle.reason.slice(0, 56)) + (lifecycle.reason.length > 56 ? '…' : '') + '</div>' : '') + '</td>'
        + '</tr>';
    }).join('')
    + '</tbody></table></div>';
}

function renderControlStep(step) {
  if (step===1) renderControlStep1();
  if (step===2) renderControlStep2();
  if (step===3) renderControlStep3();
  if (step===4) renderControlStep4();
}

// ── STEP 1: MY CONTROLS ──────────────────────────────────────────────────────
function renderControlStep1() {
  const body = document.getElementById('control-step-1-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div><p>The CISO must complete program setup to select controls and assign owners.</p><button class="btn btn-primary" onclick="goToProgramSetupOrDashboard()" style="margin-top:16px;">${state.cisoComplete ? 'Go to Dashboard →' : 'Go to CISO Setup →'}</button></div>`;
    return;
  }
  const allControls = getScopedControls();
  const controls    = allControls.filter(c => !(state.controlStatus[c.id]||{}).returnedToPolicyOwner && !(state.controlStatus[c.id]||{}).recommendedDeselect);
  const returnedControls = allControls.filter(c => (state.controlStatus[c.id]||{}).returnedToPolicyOwner);
  const deselectControls = allControls.filter(c => (state.controlStatus[c.id]||{}).recommendedDeselect);
  const families = [...new Set(controls.map(c => c.f).filter(Boolean))];

  if (allControls.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Assigned</div><p>The CISO must assign controls to you before you can document implementation.</p><button class="btn btn-primary" onclick="goToProgramSetupOrDashboard()" style="margin-top:16px;">${state.cisoComplete ? 'Go to Dashboard →' : 'View CISO Setup →'}</button></div>`;
    return;
  }
  const now  = new Date();
  const soon = new Date(now.getTime() + 30*24*60*60*1000);

  const totalDesigned = controls.filter(c => {
    const cs = state.controlStatus[c.id]||{};
    return cs.designSource || (cs.approach && cs.approach.trim()) || (cs.designParts && Object.values(cs.designParts).some(v => v && v.trim()));
  }).length;
  const totalInProg = controls.filter(c => ['In Progress','Planned'].includes((state.controlStatus[c.id]||{}).status)).length;
  const totalNA     = controls.filter(c => (state.controlStatus[c.id]||{}).status === 'Not Applicable').length;
  const pctDesigned = controls.length ? Math.round((totalDesigned / controls.length) * 100) : 0;

  const dueSoon = controls.filter(c => {
    const dd = (state.controlOwners||{})[c.id]?.dueDate;
    if (!dd) return false;
    const d = new Date(dd);
    return d >= now && d <= soon && (state.controlStatus[c.id]||{}).status !== 'Implemented';
  }).length;

  body.innerHTML = `
    <div class="section-title">${state.currentUserId ? 'My Controls' : 'Control Library'}</div>
    <div class="section-subtitle">${controls.length} controls in your design queue — ${state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High'} baseline${state.privacyOverlay?' + Privacy Overlay':''}</div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
      ${[
        ['Designed',    totalDesigned,                                          '#166534','#dcfce7','✅'],
        ['In Progress', totalInProg,                                            '#92400e','#fef3c7','🔄'],
        ['Not Started', controls.length - totalDesigned - totalInProg - totalNA,'#1e3a5f','#eff6ff','⏳'],
        ['N / A',       totalNA,                                                '#64748b','#f1f5f9','—'],
      ].map(([label,count,color,bg,icon]) => `
        <div style="background:${bg};border:1px solid ${color}22;border-radius:10px;padding:14px 16px;border-left:3px solid ${color};">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${color};">${label}</div>
            <div style="font-size:18px;">${icon}</div>
          </div>
          <div style="font-size:28px;font-weight:800;color:${color};line-height:1.1;margin-top:4px;">${count}</div>
          <div style="font-size:10px;color:${color};opacity:0.7;margin-top:2px;">of ${controls.length} controls</div>
        </div>`).join('')}
    </div>

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;color:var(--navy);">Design Progress</div>
        <div style="font-size:13px;font-weight:700;color:var(--teal);">${pctDesigned}% designed</div>
      </div>
      <div style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;">
        <div style="background:var(--teal);height:100%;width:${pctDesigned}%;border-radius:99px;transition:width 0.3s;"></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">A control is "designed" when you've documented the implementation approach in Step 2.</div>
    </div>

    ${dueSoon > 0 ? `<div class="info-alert" style="border-color:#f59e0b;background:#fffbeb;margin-bottom:16px;">
      <div class="ia-icon">⚠️</div>
      <div class="ia-text"><strong>${dueSoon} control${dueSoon>1?'s have':' has'} a due date within 30 days</strong> and ${dueSoon>1?'are':'is'} not yet designed. Head to Step 2 to document these first.</div>
    </div>` : ''}

    <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#1e40af;">
      <strong>💡 Tip:</strong> Use <strong>↩ Return</strong> if a control was assigned to you in error. Use <strong>✗ Propose De-select</strong> if you believe a control should not be in scope — both go back to the policy owner for action.
    </div>

    <div class="filter-bar">
      <input type="text" id="ctrlSearch" placeholder="🔍  Search by ID or name…" oninput="filterControlList()">
      <select id="ctrlFamilyFilter" onchange="filterControlList()">
        <option value="">All Families</option>
        ${families.map(f=>`<option value="${f}">${f} — ${FAMILIES[f]||f}</option>`).join('')}
      </select>
      <select id="ctrlStatusFilter" onchange="filterControlList()">
        <option value="">All Statuses</option>
        <option>Not Started</option><option>Planned</option><option>In Progress</option><option>Implemented</option><option>Not Applicable</option>
      </select>
      <select id="ctrlDeselectFilter" onchange="filterControlList()" title="Filter by baseline de-selection status">
        <option value="">All scope states</option>
        <option value="deselected">De-selected (baseline) only</option>
      </select>
    </div>

    <div class="table-scroll">
      <table class="control-table" id="controlInventoryTable">
        <thead>
          <tr>
            <th style="width:80px;">Control</th>
            <th>Name</th>
            <th style="width:70px;">Family</th>
            <th style="width:90px;">Baselines</th>
            <th style="width:90px;">Policy Req.</th>
            <th style="width:140px;">Owner</th>
            <th style="width:95px;">Due Date</th>
            <th style="width:120px;">Status</th>
            <th style="width:150px;">Actions</th>
          </tr>
        </thead>
        <tbody id="ctrlMainTbody">
          ${controls.map(c => {
            const cs  = state.controlStatus[c.id] || {};
            const co  = (state.controlOwners||{})[c.id] || {};
            const st  = cs.status || 'Not Started';
            const dd  = co.dueDate;
            const isDueSoon = dd && new Date(dd)>=now && new Date(dd)<=soon && st!=='Implemented';
            const ddStr = dd ? new Date(dd).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'}) : '—';
            const pReqs = getControlPolicyReqs(c.id);
            const pReqCell = pReqs.length
              ? `<span title="${pReqs.map(r=>r.reqId).join(', ')}" style="font-family:monospace;font-size:10px;font-weight:700;background:rgba(99,102,241,0.1);color:#6366f1;padding:2px 6px;border-radius:4px;cursor:default;">${pReqs.length} req${pReqs.length>1?'s':''}</span>`
              : `<span style="font-size:11px;color:var(--text-muted);font-style:italic;">—</span>`;
            const cid = c.id.replace(/'/g,"\\'");
            const deselBaseline = cs.deselectDecision === 'Approved' && c.bl && (c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P')));
            return `<tr data-id="${c.id}" data-family="${c.f}" data-status="${st}" data-deselected="${deselBaseline?'1':'0'}" class="${deselBaseline?'tr-deselected-baseline':''}" style="cursor:pointer;" onmouseover="this.style.background='rgba(13,148,136,0.04)'" onmouseout="this.style.background=''" onclick="goToControlDetail('${cid}')">
              <td><span class="control-id">${c.id}</span></td>
              <td style="font-size:13px;">${c.n}</td>
              <td><span class="family-badge">${c.f}</span></td>
              <td>${pillsHTML(c.bl)}</td>
              <td>${pReqCell}</td>
              <td style="font-size:12px;color:${co.name?'var(--navy)':'var(--text-muted)'};font-style:${co.name?'normal':'italic'};">${co.name||'Unassigned'}</td>
              <td style="font-size:12px;font-weight:${isDueSoon?'700':'400'};color:${isDueSoon?'#d97706':'var(--text-muted)'};">${ddStr}${isDueSoon?' ⚠️':''}</td>
              <td>${chipHTML(st)}</td>
              <td onclick="event.stopPropagation();" style="white-space:nowrap;">
                <button class="btn btn-sm" style="font-size:10px;padding:3px 7px;background:white;border:1px solid rgba(220,38,38,0.35);color:#dc2626;margin-right:3px;" onclick="returnControlToPolicyOwner('${cid}')" title="Return to policy owner — assigned in error">↩ Return</button>
                <button class="btn btn-sm" style="font-size:10px;padding:3px 7px;background:white;border:1px solid rgba(245,158,11,0.4);color:#d97706;" onclick="recommendControlDeselect('${cid}')" title="Propose this control be removed from scope">✗ De-select?</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    ${returnedControls.length > 0 ? `
    <div style="margin-top:20px;">
      <div style="font-size:12px;font-weight:700;color:#991b1b;padding:6px 0;border-bottom:1px solid #fca5a5;margin-bottom:8px;">↩ Returned to Policy Owner (${returnedControls.length})</div>
      ${returnedControls.map(c => {
        const cs  = state.controlStatus[c.id]||{};
        const cid = c.id.replace(/'/g,"\\'");
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;margin-bottom:6px;">
          <span class="control-id" style="opacity:0.7;">${c.id}</span>
          <span style="font-size:12px;color:var(--text-muted);">${c.n}</span>
          ${cs.returnReason ? `<span style="font-size:11px;color:#b91c1c;font-style:italic;">Reason: ${escapeHTML(cs.returnReason)}</span>` : ''}
          <button class="btn btn-sm" style="font-size:10px;padding:2px 7px;background:white;border:1px solid var(--border);color:var(--navy);margin-left:auto;" onclick="unreturnControl('${cid}')">Undo Return</button>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${deselectControls.length > 0 ? `
    <div style="margin-top:20px;">
      <div style="font-size:12px;font-weight:700;color:#92400e;padding:6px 0;border-bottom:1px solid #fcd34d;margin-bottom:6px;">✗ Proposed for De-selection (${deselectControls.length})</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">These controls are flagged as "Recommended for De-selection" and will appear in the policy owner's queue for decision.</div>
      ${deselectControls.map(c => {
        const cs  = state.controlStatus[c.id]||{};
        const cid = c.id.replace(/'/g,"\\'");
        const decision = cs.deselectDecision || 'Proposed';
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;margin-bottom:6px;">
          <span class="control-id" style="opacity:0.7;">${c.id}</span>
          <span style="font-size:12px;color:var(--text-muted);">${c.n}</span>
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${decision==='Approved'?'#166534':decision==='Rejected'?'#b45309':'#92400e'};">${decision}</span>
          ${cs.deselectReason ? `<span style="font-size:11px;color:#92400e;font-style:italic;">Reason: ${escapeHTML(cs.deselectReason)}</span>` : ''}
          ${cs.deselectDecisionReason ? `<span style="font-size:11px;color:#334155;font-style:italic;">Decision: ${escapeHTML(cs.deselectDecisionReason)}</span>` : ''}
          <button class="btn btn-sm" style="font-size:10px;padding:2px 7px;background:white;border:1px solid var(--border);color:var(--navy);margin-left:auto;" onclick="unrecommendControlDeselect('${cid}')">Undo</button>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${(function() {
      const outsideQueue = [];
      if (state.policySelectedControls) {
        Object.keys(state.policySelectedControls).forEach(fam => {
          const sel = state.policySelectedControls[fam];
          const famControls = CONTROLS.filter(c => c.f === fam && (c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P'))));
          famControls.forEach(c => {
            if (sel.includes(c.id)) return;
            const owner = (state.controlOwners || {})[c.id] || {};
            const domainOwner = (state.domainOwners || {})[fam] || {};
            let reason = 'Not selected in ' + fam + ' policy control set';
            if (owner.name && domainOwner.name && owner.name.trim().toLowerCase() === domainOwner.name.trim().toLowerCase()) {
              reason = 'Retained by domain policy owner';
            } else if (owner.name) {
              reason = 'Owned outside your queue — ' + owner.name;
            }
            outsideQueue.push({ ...c, deselFam: fam, queueReason: reason });
          });
        });
      }
      if (!outsideQueue.length) return '';
      return `<details style="margin-top:16px;"><summary style="cursor:pointer;font-size:12px;font-weight:700;color:var(--text-muted);padding:8px 0;user-select:none;">▶ ${outsideQueue.length} controls outside your control-owner queue</summary>
        <div style="font-size:11px;color:var(--text-muted);margin:4px 0 8px 0;">These controls are managed at the domain-policy level or routed to another owner; they are not removed from the overall program unless the domain policy owner formally de-selects them.</div>
        <div class="table-scroll" style="margin-top:8px;">
          <table class="control-table"><thead><tr><th style="width:80px;">Control</th><th>Name</th><th style="width:70px;">Family</th><th style="width:220px;">Reason</th></tr></thead>
          <tbody>${outsideQueue.map(c => `<tr style="opacity:0.62;"><td><span class="control-id" style="opacity:0.8;">${c.id}</span></td><td style="font-size:13px;color:var(--text-muted);">${c.n}</td><td><span class="family-badge" style="opacity:0.65;">${c.f}</span></td><td style="font-size:11px;color:#334155;font-weight:600;">${escapeHTML(c.queueReason)}</td></tr>`).join('')}</tbody>
          </table></div></details>`;
    })()}`;
}

function filterControlList() {
  const q   = (document.getElementById('ctrlSearch')?.value||'').toLowerCase();
  const fam = document.getElementById('ctrlFamilyFilter')?.value||'';
  const st  = document.getElementById('ctrlStatusFilter')?.value||'';
  const des = document.getElementById('ctrlDeselectFilter')?.value||'';
  document.querySelectorAll('#controlInventoryTable tbody tr').forEach(row => {
    const matchQ = !q   || (row.dataset.id||'').toLowerCase().includes(q) || (row.cells[1]?.textContent||'').toLowerCase().includes(q);
    const matchF = !fam || row.dataset.family===fam;
    const matchS = !st  || row.dataset.status===st;
    const matchD = !des || (des === 'deselected' && row.dataset.deselected === '1');
    row.style.display = (matchQ && matchF && matchS && matchD) ? '' : 'none';
  });
}

function goToControlDetail(ctrlId) {
  state._controlLibraryMode = false;
  state._selectedCtrl = ctrlId;
  showTab('control');
  goToStep('control', 2);
}

function userCanAccessControlWorkspace() {
  if (!state.currentUserId) return true; // admin mode
  var user = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  if (!user) return false;
  var visibleTabs = getPersonVisibleTabIds(user) || [];
  return visibleTabs.indexOf('control') !== -1;
}

function openControlFromLibrary(ctrlId) {
  if (userCanAccessControlWorkspace()) {
    goToControlDetail(ctrlId);
    return;
  }
  openControlLibraryReadOnly(ctrlId);
}

function openControlLibraryReadOnly(ctrlId) {
  var ctrl = (getActiveControls() || []).find(function(c) { return c.id === ctrlId; });
  if (!ctrl) { showToast('Control not found.', true); return; }
  normalizeControlDesignState(ctrlId);
  var cs = state.controlStatus[ctrlId] || {};
  var owner = (state.controlOwners || {})[ctrlId] || {};
  var reqs = cs.assetOwnerRequirements || [];
  var covered = getCtrlCoveredAssetTypes(ctrlId);
  var policyReqs = getControlPolicyReqs(ctrlId);
  var nistParts = parseControlParts(ctrlId) || {};
  var designSource = cs.designSource || (cs.externalDocRef ? 'external' : 'inline');
  var linkedAssetNames = (cs.linkedAssets || []).map(function(aid) {
    var a = (state.assets || []).find(function(x) { return String(x.id) === String(aid); });
    return a ? a.name : String(aid);
  });
  var linkedProcessNames = (cs.linkedProcesses || []).map(function(pid) {
    var p = (state.processes || []).find(function(x) { return String(x.id) === String(pid); });
    return p ? p.name : String(pid);
  });
  var nistRequirementText = (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrlId])
    ? NIST_CONTROL_TEXT[ctrlId]
    : ctrlShortDesc(ctrl);
  var policyObjectivesHtml = policyReqs.length
    ? '<div style="display:flex;flex-direction:column;gap:8px;">' + policyReqs.map(function(r) {
        return '<div style="border:1px solid #c7d2fe;background:#eef2ff;border-radius:6px;padding:8px 10px;">'
          + '<div style="font-size:11px;font-weight:700;color:#4338ca;margin-bottom:3px;">' + escapeHTML((r.reqId || 'Policy objective') + ' · ' + (r.policyTitle || r.fam || 'Policy')) + '</div>'
          + '<div style="font-size:12px;color:#1f2937;line-height:1.5;">' + escapeHTML(r.reqText || 'No objective text captured.') + '</div>'
          + '</div>';
      }).join('') + '</div>'
    : '<div style="font-size:12px;color:var(--text-muted);">No policy objectives linked.</div>';

  var designHtml = '';
  if (designSource === 'external') {
    designHtml = '<div style="display:grid;grid-template-columns:1fr;gap:8px;">'
      + '<div><strong>External reference:</strong> ' + escapeHTML(cs.externalDocTitle || '—') + '</div>'
      + '<div><strong>Location:</strong> ' + escapeHTML(cs.externalDocRef || '—') + '</div>'
      + '<div><strong>Coverage summary:</strong> ' + escapeHTML(cs.externalDocSummary || '—') + '</div>'
      + '</div>';
  } else {
    var partKeys = Object.keys(nistParts);
    if (partKeys.length) {
      designHtml = '<div style="display:flex;flex-direction:column;gap:8px;">'
        + partKeys.map(function(letter) {
            var partText = ((cs.designParts || {})[letter] || '').trim();
            return '<div style="border:1px solid var(--border);border-radius:6px;padding:8px 10px;">'
              + '<div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:3px;">Part ' + letter + '</div>'
              + '<div style="font-size:12px;color:#374151;line-height:1.5;">' + escapeHTML(partText || 'Not documented') + '</div>'
              + '</div>';
          }).join('')
        + '</div>';
    } else {
      designHtml = '<div style="font-size:12px;color:#374151;line-height:1.6;">' + escapeHTML((cs.approach || cs.narrative || '').trim() || 'No design narrative documented.') + '</div>';
    }
  }

  var reqTable = reqs.length
    ? '<div class="table-scroll"><table class="control-table"><thead><tr><th style="width:140px;">Asset Type</th><th>Required Actions</th><th>Required Evidence</th><th>Acceptance Criteria</th></tr></thead><tbody>'
      + reqs.map(function(r) {
          return '<tr><td style="font-size:11px;font-weight:700;color:#334155;">' + escapeHTML(r.assetType || 'General') + '</td>'
            + '<td style="font-size:12px;color:#374151;">' + escapeHTML(r.requirement || '—') + '</td>'
            + '<td style="font-size:12px;color:#374151;">' + escapeHTML(r.evidenceNeeded || '—') + '</td>'
            + '<td style="font-size:12px;color:#374151;">' + escapeHTML(r.acceptanceCriteria || '—') + '</td></tr>';
        }).join('')
      + '</tbody></table></div>'
    : '<div style="font-size:12px;color:var(--text-muted);">No asset-owner requirements documented yet.</div>';

  var overlay = document.createElement('div');
  overlay.id = 'controlLibraryReadOnlyOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.58);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = '<div style="background:white;width:min(980px,96vw);max-height:92vh;overflow:auto;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,0.3);">'
    + '<div style="position:sticky;top:0;background:white;border-bottom:1px solid var(--border);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;z-index:2;">'
    + '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Control Library · Read-only</div>'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-top:2px;">' + escapeHTML(ctrl.id) + ' — ' + escapeHTML(ctrl.n) + '</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-top:3px;">Owner: ' + escapeHTML(owner.name || 'Unassigned') + ' · Status: ' + escapeHTML(cs.status || 'Not Started') + '</div></div>'
    + '<button onclick="document.getElementById(\'controlLibraryReadOnlyOverlay\').remove()" style="border:none;background:#f8fafc;color:#334155;font-size:16px;font-weight:700;border-radius:8px;padding:6px 10px;cursor:pointer;">✕</button></div>'
    + '<div style="padding:18px;">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Policy Objectives</div>'
    + policyObjectivesHtml
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Asset Scope</div>'
    + '<div style="font-size:12px;color:#374151;">' + (covered.length ? covered.map(function(t){ return escapeHTML(t.label); }).join(' · ') : 'No asset types selected') + '</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:5px;">Linked assets: ' + escapeHTML(linkedAssetNames.length ? linkedAssetNames.join(', ') : 'None') + '</div>'
    + '<div style="font-size:11px;color:var(--text-muted);">Linked processes: ' + escapeHTML(linkedProcessNames.length ? linkedProcessNames.join(', ') : 'None') + '</div>'
    + '</div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">'
    + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">NIST Requirements</div>'
    + '<div style="font-size:12px;color:#374151;line-height:1.65;white-space:pre-line;">' + escapeHTML(nistRequirementText || 'No NIST requirement text available.') + '</div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">'
    + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Control Design</div>'
    + designHtml
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;">'
    + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Asset-Type Requirements & Required Evidence</div>'
    + reqTable
    + '</div>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

// ── RETURN & PROPOSE DE-SELECT ────────────────────────────────────────────────
function returnControlToPolicyOwner(ctrlId) {
  const ctrl   = CONTROLS.find(c => c.id === ctrlId);
  const cName  = ctrl ? ctrl.n : ctrlId;
  const pOwner = ctrl ? ((state.domainOwners[ctrl.f]||{}).name || state.programOwnerTitle || 'Policy Owner') : 'Policy Owner';
  const cid    = ctrlId.replace(/'/g,"\\'");
  const overlay = document.createElement('div');
  overlay.id = 'returnCtrlOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px;width:460px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:22px;margin-bottom:8px;">↩</div>'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:6px;">Return to Policy Owner?</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">You are about to return <strong>' + escapeHTML(ctrlId) + ' — ' + escapeHTML(cName) + '</strong> to <strong>' + escapeHTML(pOwner) + '</strong>. It will be excluded from your design queue. Your progress is preserved.</div>'
    + '<div style="margin-bottom:16px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);display:block;margin-bottom:6px;">Reason (optional)</label>'
    + '<textarea id="returnCtrlReason" rows="2" class="form-input" style="font-size:12px;resize:vertical;" placeholder="e.g. This control belongs to the IAM team, not my remit…"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="closeReturnCtrlModal()">Cancel</button>'
    + '<button class="btn" style="background:#dc2626;color:white;border:none;" onclick="confirmReturnControl(\'' + cid + '\')">↩ Return to Policy Owner</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function confirmReturnControl(ctrlId) {
  const reason = document.getElementById('returnCtrlReason')?.value.trim() || '';
  closeReturnCtrlModal();
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  state.controlStatus[ctrlId].returnedToPolicyOwner = true;
  state.controlStatus[ctrlId].returnReason  = reason;
  state.controlStatus[ctrlId].returnedAt    = new Date().toLocaleDateString();
  markDirty();
  addAuditEntry('control', ctrlId, 'Control returned to policy owner' + (reason ? ': ' + reason : ''));
  showToast('↩ ' + ctrlId + ' returned to policy owner.');
  renderControlStep1();
}

function closeReturnCtrlModal() { document.getElementById('returnCtrlOverlay')?.remove(); }

function unreturnControl(ctrlId) {
  if (!state.controlStatus[ctrlId]) return;
  state.controlStatus[ctrlId].returnedToPolicyOwner = false;
  state.controlStatus[ctrlId].returnReason = '';
  markDirty();
  showToast('Control ' + ctrlId + ' restored to your queue.');
  renderControlStep1();
}

function recommendControlDeselect(ctrlId) {
  const ctrl   = CONTROLS.find(c => c.id === ctrlId);
  const cName  = ctrl ? ctrl.n : ctrlId;
  const pOwner = ctrl ? ((state.domainOwners[ctrl.f]||{}).name || state.programOwnerTitle || 'Policy Owner') : 'Policy Owner';
  const cid    = ctrlId.replace(/'/g,"\\'");
  const overlay = document.createElement('div');
  overlay.id = 'deselectCtrlOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px;width:480px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:22px;margin-bottom:8px;">✗</div>'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:6px;">Propose De-selection?</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;line-height:1.6;">You are proposing that <strong>' + escapeHTML(ctrlId) + ' — ' + escapeHTML(cName) + '</strong> be removed from scope.</div>'
    + '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#92400e;">This flags the control as "Recommended for De-selection" in the library for <strong>' + escapeHTML(pOwner) + '</strong> to decide on. It does not remove the control immediately.</div>'
    + '<div style="margin-bottom:16px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);display:block;margin-bottom:6px;">Reason <span style="color:var(--red);">*</span></label>'
    + '<textarea id="deselectCtrlReason" rows="3" class="form-input" style="font-size:12px;resize:vertical;" placeholder="Explain why this control should not be in scope (e.g. technical environment does not support this, another system handles this, risk formally accepted at CISO level…)"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="closeDeselectCtrlModal()">Cancel</button>'
    + '<button class="btn" style="background:#d97706;color:white;border:none;" onclick="confirmRecommendDeselect(\'' + cid + '\')">✗ Propose De-selection</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function getCurrentActorName() {
  if (!state.currentUserId) return state.programOwner || 'Admin';
  var user = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  return (user && user.name) ? user.name : (state.programOwner || 'User');
}

function appendDeselectHistory(ctrlId, action, reason) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].deselectHistory) state.controlStatus[ctrlId].deselectHistory = [];
  state.controlStatus[ctrlId].deselectHistory.push({
    action: action,
    reason: reason || '',
    by: getCurrentActorName(),
    at: new Date().toISOString()
  });
}

function confirmRecommendDeselect(ctrlId) {
  const reason = document.getElementById('deselectCtrlReason')?.value.trim() || '';
  if (!reason) { showToast('Please provide a reason for the de-selection proposal.', true); return; }
  closeDeselectCtrlModal();
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  state.controlStatus[ctrlId].recommendedDeselect     = true;
  state.controlStatus[ctrlId].deselectReason          = reason;
  state.controlStatus[ctrlId].deselectProposedAt      = new Date().toLocaleDateString();
  state.controlStatus[ctrlId].deselectProposedBy      = getCurrentActorName();
  state.controlStatus[ctrlId].deselectDecision        = '';
  state.controlStatus[ctrlId].deselectDecisionReason  = '';
  state.controlStatus[ctrlId].deselectDecidedAt       = '';
  state.controlStatus[ctrlId].deselectDecidedBy       = '';
  appendDeselectHistory(ctrlId, 'Proposed', reason);
  markDirty();
  addAuditEntry('control', ctrlId, 'De-selection proposed by ' + state.controlStatus[ctrlId].deselectProposedBy + ': ' + reason);
  showToast('✗ ' + ctrlId + ' proposed for de-selection — policy owner will review.');
  renderControlStep1();
}

function closeDeselectCtrlModal() { document.getElementById('deselectCtrlOverlay')?.remove(); }

function unrecommendControlDeselect(ctrlId) {
  if (!state.controlStatus[ctrlId]) return;
  state.controlStatus[ctrlId].recommendedDeselect = false;
  state.controlStatus[ctrlId].deselectDecision = 'Withdrawn';
  state.controlStatus[ctrlId].deselectDecisionReason = 'Proposal withdrawn by submitter';
  state.controlStatus[ctrlId].deselectDecidedAt = new Date().toLocaleDateString();
  state.controlStatus[ctrlId].deselectDecidedBy = getCurrentActorName();
  appendDeselectHistory(ctrlId, 'Withdrawn', 'Proposal withdrawn by submitter');
  markDirty();
  addAuditEntry('control', ctrlId, 'De-selection proposal withdrawn by ' + getCurrentActorName());
  showToast('De-selection proposal withdrawn for ' + ctrlId + '.');
  renderControlStep1();
}

function policyOwnerDecideDeselect(ctrlId, decision) {
  const ctrl = CONTROLS.find(c => c.id === ctrlId);
  const overlay = document.createElement('div');
  overlay.id = 'deselectDecisionOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px;width:500px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:6px;">' + (decision === 'Approved' ? 'Approve' : 'Reject') + ' De-selection</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">Control: <strong>' + escapeHTML(ctrlId + ' — ' + ((ctrl && ctrl.n) || '')) + '</strong></div>'
    + '<div style="margin-bottom:16px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);display:block;margin-bottom:6px;">Decision rationale <span style="color:var(--red);">*</span></label>'
    + '<textarea id="deselectDecisionReason" rows="3" class="form-input" style="font-size:12px;resize:vertical;" placeholder="Document the reasoning for this decision for audit traceability..."></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'deselectDecisionOverlay\')?.remove()">Cancel</button>'
    + '<button class="btn" style="background:' + (decision === 'Approved' ? '#166534' : '#b45309') + ';color:white;border:none;" onclick="confirmPolicyOwnerDeselectDecision(\'' + ctrlId.replace(/'/g,"\\'") + '\',\'' + decision + '\')">Confirm ' + (decision === 'Approved' ? 'Approval' : 'Rejection') + '</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function confirmPolicyOwnerDeselectDecision(ctrlId, decision) {
  var reason = (document.getElementById('deselectDecisionReason') || {}).value || '';
  reason = reason.trim();
  if (!reason) { showToast('Decision rationale is required for audit purposes.', true); return; }
  document.getElementById('deselectDecisionOverlay')?.remove();
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var cs = state.controlStatus[ctrlId];
  if (decision === 'Approved') {
    var snap = {
      recommendedDeselect: cs.recommendedDeselect,
      deselectDecision: cs.deselectDecision,
      deselectDecisionReason: cs.deselectDecisionReason,
      deselectDecidedAt: cs.deselectDecidedAt,
      deselectDecidedBy: cs.deselectDecidedBy
    };
    pushScopedUndo({
      label: 'De-selection approved: ' + ctrlId,
      undo: function() {
        var c = state.controlStatus[ctrlId];
        if (!c) return;
        c.recommendedDeselect = snap.recommendedDeselect;
        c.deselectDecision = snap.deselectDecision;
        c.deselectDecisionReason = snap.deselectDecisionReason;
        c.deselectDecidedAt = snap.deselectDecidedAt;
        c.deselectDecidedBy = snap.deselectDecidedBy;
        try { renderPolicyStep2(); } catch (eR) {}
      }
    });
  }
  cs.deselectDecision = decision;
  cs.deselectDecisionReason = reason;
  cs.deselectDecidedAt = new Date().toLocaleDateString();
  cs.deselectDecidedBy = getCurrentActorName();
  cs.recommendedDeselect = decision === 'Approved';
  appendDeselectHistory(ctrlId, decision, reason);
  markDirty();
  addAuditEntry('control', ctrlId, 'De-selection ' + decision.toLowerCase() + ' by ' + cs.deselectDecidedBy + ': ' + reason);
  showToast('De-selection ' + (decision === 'Approved' ? 'approved' : 'rejected') + ' for ' + ctrlId + '.');
  renderPolicyStep2();
}

// ── STEP 2: DESIGN THE CONTROL ────────────────────────────────────────────────
function renderControlStep2() {
  const body = document.getElementById('control-step-2-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div></div>`;
    return;
  }
  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  controls.forEach(c => {
    if (!state.controlStatus[c.id]) state.controlStatus[c.id] = { status:'Not Started', approach:'', narrative:'', evidence:[], notes:'' };
    if (!state.controlStatus[c.id].evidence) state.controlStatus[c.id].evidence = [];
  });
  if (!state._selectedCtrl || !controls.find(c=>c.id===state._selectedCtrl)) {
    state._selectedCtrl = controls[0]?.id || null;
  }
  const sel = controls.find(c=>c.id===state._selectedCtrl);

  body.innerHTML = `
    <div style="display:flex;min-height:500px;height:calc(100vh - 320px);overflow:hidden;margin:-4px;">
      <!-- LEFT: control list -->
      <div style="width:260px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;background:#fafbfc;">
        <div style="padding:12px 14px;border-bottom:1px solid var(--border);">
          <input type="text" class="form-input" style="font-size:12px;" placeholder="🔍  Filter controls…" id="ctrlDetailSearch" oninput="filterCtrlDetailList()">
        </div>
        <div style="overflow-y:auto;flex:1;" id="ctrlDetailList">
          ${controls.map(c => {
            const cs  = state.controlStatus[c.id]||{};
            const designed = !!(cs.designSource || (cs.approach&&cs.approach.trim()) || (cs.designParts&&Object.values(cs.designParts).some(v=>v&&v.trim())));
            const st  = cs.status||'Not Started';
            const isSel = c.id===state._selectedCtrl;
            const dot = designed ? '#166534' : st==='In Progress' ? '#92400e' : st==='Planned' ? '#d97706' : '#94a3b8';
            const cid = c.id.replace(/'/g,"\\'");
            return `<div onclick="selectCtrlDetail('${cid}')" data-ctrl-id="${c.id}" data-ctrl-name="${c.n.toLowerCase()}"
              style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;background:${isSel?'rgba(13,148,136,0.07)':'transparent'};border-left:3px solid ${isSel?'var(--teal)':'transparent'};transition:all 0.15s;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="font-family:monospace;font-size:11px;font-weight:700;color:${isSel?'var(--teal)':'var(--navy)'};">${c.id}</span>
                <div style="width:7px;height:7px;border-radius:50%;background:${dot};margin-left:auto;flex-shrink:0;" title="${designed?'Design documented':'Not yet designed'}"></div>
              </div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.n}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <!-- RIGHT: detail form -->
      <div style="flex:1;overflow-y:auto;padding:20px 24px;" id="ctrlDetailForm">
        ${sel ? renderControlDetailForm(sel) : '<div class="empty-state"><div class="es-title">Select a control from the list</div></div>'}
      </div>
    </div>`;
}

function filterCtrlDetailList() {
  const q = (document.getElementById('ctrlDetailSearch')?.value||'').toLowerCase();
  document.querySelectorAll('#ctrlDetailList [data-ctrl-id]').forEach(el => {
    const id   = (el.dataset.ctrlId||'').toLowerCase();
    const name = (el.dataset.ctrlName||'').toLowerCase();
    el.style.display = (!q || id.includes(q) || name.includes(q)) ? '' : 'none';
  });
}

function selectCtrlDetail(ctrlId) {
  state._selectedCtrl = ctrlId;
  renderControlStep2();
}

// Return list of {reqId, reqText, policyTitle, fam} for all requirements that cite ctrlId
function getControlPolicyReqs(ctrlId) {
  var hits = [];
  if (!state.domainPolicies) return hits;
  Object.keys(state.domainPolicies).forEach(function(fam) {
    var dp = state.domainPolicies[fam];
    if (!dp || !dp.requirements) return;
    dp.requirements.forEach(function(req) {
      if (req.controls && req.controls.includes(ctrlId)) {
        hits.push({ reqId: req.id||'', reqText: req.text||'', policyTitle: dp.title || getPolicyMergedTitle(fam), fam: fam });
      }
    });
  });
  return hits;
}

function isControlDesigned(ctrlId) {
  const cs = state.controlStatus[ctrlId] || {};
  if (cs.designSource === 'external') {
    return !!((cs.externalDocTitle || '').trim() && (cs.externalDocRef || '').trim());
  }
  if (cs.designParts && Object.values(cs.designParts).some(function(v) { return v && String(v).trim(); })) return true;
  return !!((cs.approach && cs.approach.trim()) || (cs.narrative && cs.narrative.trim()));
}

function normalizeControlDesignState(ctrlId) {
  if (!state.controlStatus) state.controlStatus = {};
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var cs = state.controlStatus[ctrlId];
  if (!cs.assetOwnerRequirements) cs.assetOwnerRequirements = [];
  cs.assetOwnerRequirements = cs.assetOwnerRequirements.map(function(r) {
    return {
      assetType: r.assetType || 'General',
      requirement: r.requirement || '',
      evidenceNeeded: r.evidenceNeeded || '',
      acceptanceCriteria: r.acceptanceCriteria || ''
    };
  });
  // Backward compatibility: older snapshots used one free-text assetGuidance field.
  if ((cs.assetGuidance || '').trim() && !cs.assetOwnerRequirements.some(function(r) { return (r.requirement || '').trim(); })) {
    cs.assetOwnerRequirements.push({
      assetType: 'General',
      requirement: cs.assetGuidance,
      evidenceNeeded: '',
      acceptanceCriteria: ''
    });
  }
  if (!Array.isArray(cs.evidence)) cs.evidence = [];
  cs.evidence = cs.evidence.map(function(ev) {
    var e = Object.assign({}, ev);
    if (e.dataUrl && String(e.dataUrl).indexOf('data:image') === 0) {
      e.kind = 'image';
    }
    if (e.kind === 'image') {
      e.caption = e.caption != null ? String(e.caption) : (e.ref != null ? String(e.ref) : '');
      if (e.mime !== 'image/png' && e.mime !== 'image/jpeg') {
        e.mime = String(e.dataUrl || '').indexOf('image/png') !== -1 ? 'image/png' : 'image/jpeg';
      }
      delete e.type;
      delete e.ref;
    } else {
      e.kind = 'ref';
      e.type = e.type || 'Policy';
      e.ref = e.ref != null ? String(e.ref) : '';
      delete e.dataUrl;
      delete e.mime;
      delete e.caption;
    }
    return e;
  });
}

function getDesignChecklist(ctrl) {
  var cs = state.controlStatus[ctrl.id] || {};
  var designSource = cs.designSource || 'inline';
  var nistParts = parseControlParts(ctrl.id);
  var coveredTypes = getCtrlCoveredAssetTypes(ctrl.id);
  var linkedCount = (cs.linkedAssets || []).length + (cs.linkedProcesses || []).length;
  var coverageReady = coveredTypes.length > 0 || linkedCount > 0;
  var policyReqs = getControlPolicyReqs(ctrl.id);
  var sourceReady = true;
  var sourceDetail = '';
  if (designSource === 'external') {
    var hasTitle = !!(cs.externalDocTitle || '').trim();
    var hasRef = !!(cs.externalDocRef || '').trim();
    var hasSummary = !!(cs.externalDocSummary || '').trim();
    sourceReady = hasTitle && hasRef && hasSummary;
    sourceDetail = sourceReady ? 'Reference captured with coverage summary' : 'Provide title, location, and coverage summary';
  } else if (nistParts) {
    var letters = Object.keys(nistParts);
    var answered = letters.filter(function(letter) { return (cs.designParts || {})[letter] && String((cs.designParts || {})[letter]).trim(); }).length;
    sourceReady = answered === letters.length;
    sourceDetail = answered + ' of ' + letters.length + ' NIST letter parts addressed';
  } else {
    sourceReady = !!(cs.approach || '').trim();
    sourceDetail = sourceReady ? 'Design narrative documented' : 'Add a design description';
  }
  return {
    sourceReady: sourceReady,
    sourceDetail: sourceDetail,
    coverageReady: coverageReady,
    coverageDetail: coverageReady ? 'Assets/processes identified' : 'Identify asset type or inventory scope',
    policyReady: policyReqs.length > 0 ? true : !!sourceReady,
    policyDetail: policyReqs.length ? (policyReqs.length + ' linked policy requirement(s)') : 'No explicit policy requirement link; NIST coverage required'
  };
}

function getControlRequirementCoverage(ctrl) {
  normalizeControlDesignState(ctrl.id);
  var cs = state.controlStatus[ctrl.id] || {};
  var reqs = cs.assetOwnerRequirements || [];
  var coveredTypes = getCtrlCoveredAssetTypes(ctrl.id).map(function(t) { return t.label; });
  var targets = coveredTypes.length ? coveredTypes : ['General'];
  var satisfied = targets.filter(function(typeLabel) {
    var entry = reqs.find(function(r) { return r.assetType === typeLabel; }) || reqs.find(function(r) { return r.assetType === 'General'; });
    return !!(entry && ((entry.requirement || '').trim() || (entry.evidenceNeeded || '').trim()));
  });
  var hasCriteria = targets.filter(function(typeLabel) {
    var entry = reqs.find(function(r) { return r.assetType === typeLabel; }) || reqs.find(function(r) { return r.assetType === 'General'; });
    return !!(entry && (entry.acceptanceCriteria || '').trim());
  }).length;
  return {
    targetCount: targets.length,
    satisfiedCount: satisfied.length,
    criteriaCount: hasCriteria
  };
}

// Parse a NIST 800-53 control statement into top-level letter parts (a, b, c, …)
// Returns null when control has no meaningful sub-parts
function parseControlParts(ctrlId) {
  var text = (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrlId]) ? NIST_CONTROL_TEXT[ctrlId] : '';
  if (!text) return null;
  var positions = [];
  var re = /(?:^|\n)([a-z])\.\s/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    positions.push({ letter: m[1], start: m.index + (m[0].charAt(0) === '\n' ? 1 : 0) });
  }
  if (positions.length < 2) return null;
  var parts = {};
  for (var i = 0; i < positions.length; i++) {
    var end = i < positions.length - 1 ? positions[i+1].start : text.length;
    var raw = text.substring(positions[i].start, end).trim().replace(/^[a-z]\.\s*/, '');
    parts[positions[i].letter] = raw.trim();
  }
  return Object.keys(parts).length >= 2 ? parts : null;
}

function extractNistAssignments(text) {
  var src = String(text || '');
  if (!src) return [];
  var out = [];
  var seen = {};
  var re = /\[Assignment:\s*([^\]]+)\]/gi;
  var m;
  while ((m = re.exec(src)) !== null) {
    var raw = (m[1] || '').trim();
    if (!raw) continue;
    var key = raw.toLowerCase();
    if (seen[key]) continue;
    seen[key] = true;
    out.push(raw);
  }
  return out;
}

function setCtrlDesignSource(ctrlId, source) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  state.controlStatus[ctrlId].designSource = source;
  if (source && (!state.controlStatus[ctrlId].status || state.controlStatus[ctrlId].status === 'Not Started')) {
    state.controlStatus[ctrlId].status = 'Planned';
  }
  markDirty();
  setTimeout(function(){ renderControlStep2(); }, 0);
}

function setCtrlDesignPart(ctrlId, letter, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].designParts) state.controlStatus[ctrlId].designParts = {};
  state.controlStatus[ctrlId].designParts[letter] = value;
  markDirty();
}

function setCtrlPartAssignment(ctrlId, letter, assignmentLabel, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].designPartParams) state.controlStatus[ctrlId].designPartParams = {};
  if (!state.controlStatus[ctrlId].designPartParams[letter]) state.controlStatus[ctrlId].designPartParams[letter] = {};
  state.controlStatus[ctrlId].designPartParams[letter][assignmentLabel] = value;
  markDirty();
}

function setCtrlAssignment(ctrlId, assignmentLabel, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].designParams) state.controlStatus[ctrlId].designParams = {};
  state.controlStatus[ctrlId].designParams[assignmentLabel] = value;
  markDirty();
}

function setCtrlAssetTypeStatus(ctrlId, typeKey, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].assetTypeStatus) state.controlStatus[ctrlId].assetTypeStatus = {};
  state.controlStatus[ctrlId].assetTypeStatus[typeKey] = value;
  markDirty();
}

function getCtrlCoveredAssetTypes(ctrlId) {
  var cs = state.controlStatus[ctrlId] || {};
  var coverage = cs.assetCoverage || {};
  var result = [];
  ASSET_TYPES.forEach(function(cat) {
    cat.types.forEach(function(t) { if (coverage[t.key]) result.push({ key: t.key, label: t.label }); });
  });
  (state.customAssetTypes||[]).forEach(function(at) {
    if (coverage['custom_' + at]) result.push({ key: 'custom_' + at, label: at });
  });
  return result;
}

function toggleCtrlAssetLink(ctrlId, assetId, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].linkedAssets) state.controlStatus[ctrlId].linkedAssets = [];
  if (checked) {
    if (!state.controlStatus[ctrlId].linkedAssets.includes(assetId)) state.controlStatus[ctrlId].linkedAssets.push(assetId);
  } else {
    state.controlStatus[ctrlId].linkedAssets = state.controlStatus[ctrlId].linkedAssets.filter(a => a !== assetId);
  }
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

function toggleCtrlProcessLink(ctrlId, processId, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].linkedProcesses) state.controlStatus[ctrlId].linkedProcesses = [];
  if (checked) {
    if (!state.controlStatus[ctrlId].linkedProcesses.includes(processId)) state.controlStatus[ctrlId].linkedProcesses.push(processId);
  } else {
    state.controlStatus[ctrlId].linkedProcesses = state.controlStatus[ctrlId].linkedProcesses.filter(p => p !== processId);
  }
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

var __EVIDENCE_IMAGE_MAX_BYTES = 100 * 1024;

function buildEvidenceArtifactSectionHTML(ctrl) {
  normalizeControlDesignState(ctrl.id);
  var cs = state.controlStatus[ctrl.id] || {};
  var cid = ctrl.id.replace(/'/g, "\\'");
  var ev = cs.evidence || [];
  var g = FAMILY_EVIDENCE_GUIDANCE[ctrl.f];
  var hint = g && g.evidence ? '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;line-height:1.5;"><strong>Examples for ' + escapeHTML(g.label || ctrl.f) + ':</strong> ' + escapeHTML(g.evidence.slice(0, 3).join(' · ')) + '</div>' : '';
  var rows = ev.map(function(evRow, idx) {
    var kind = evRow.kind === 'image' ? 'image' : 'ref';
    var refPart = kind === 'ref'
      ? '<div style="display:grid;grid-template-columns:130px 1fr;gap:8px;margin-top:8px;">'
        + '<select class="form-select" style="font-size:11px;" onchange="setEvidenceField(\'' + cid + '\',' + idx + ',\'type\',this.value)">'
        + ['Policy', 'Procedure', 'Screenshot', 'Log excerpt', 'Report', 'Ticket', 'Other'].map(function(tp) {
          return '<option' + ((evRow.type || '') === tp ? ' selected' : '') + '>' + tp + '</option>';
        }).join('')
        + '</select>'
        + '<input class="form-input" style="font-size:12px;" placeholder="URL, path, or reference ID" value="' + escapeHTML(evRow.ref || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'ref\',this.value)">'
        + '</div>'
      : '<div style="margin-top:8px;">'
        + '<input class="form-input" style="font-size:11px;margin-bottom:6px;" placeholder="Caption / context" value="' + escapeHTML(evRow.caption || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'caption\',this.value)">'
        + '<input type="file" accept="image/png,image/jpeg" style="font-size:11px;margin-bottom:6px;" onchange="handleEvidenceImageUpload(\'' + cid + '\',' + idx + ',this)">'
        + (evRow.dataUrl
          ? '<div style="display:flex;align-items:center;gap:10px;"><img src="' + evRow.dataUrl + '" alt="" style="max-height:72px;border-radius:6px;border:1px solid var(--border);cursor:zoom-in;" onclick="openEvidenceImageViewerAt(\'' + cid + '\',' + idx + ')"><span style="font-size:10px;color:var(--text-muted);">Click preview for full size</span></div>'
          : '<div style="font-size:10px;color:var(--text-muted);">No image yet — choose PNG/JPEG up to 100 KB.</div>')
        + '</div>';
    return '<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:#fafbff;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">'
      + '<div style="font-size:10px;font-weight:700;color:var(--navy);text-transform:uppercase;">Evidence row ' + (idx + 1) + '</div>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      + '<select class="form-select" style="font-size:11px;padding:3px 8px;" onchange="setEvidenceKind(\'' + cid + '\',' + idx + ',this.value)">'
      + '<option value="ref"' + (kind === 'ref' ? ' selected' : '') + '>Document / reference</option>'
      + '<option value="image"' + (kind === 'image' ? ' selected' : '') + '>Screenshot (PNG/JPEG)</option>'
      + '</select>'
      + '<button type="button" class="btn btn-sm" style="font-size:10px;padding:2px 8px;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;" onclick="removeCtrlEvidence(\'' + cid + '\',' + idx + ')">Remove</button>'
      + '</div></div>'
      + refPart
      + '</div>';
  }).join('');
  return '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">'
    + '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Evidence artifacts</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;line-height:1.55;">Attach references or small screenshots (assessment aids). Images are stored in-browser only — keep each file at or under 100 KB.</div>'
    + hint
    + (rows || '<div style="font-size:11px;color:var(--text-muted);">No evidence rows yet.</div>')
    + '<button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;font-size:11px;" onclick="addCtrlEvidence(\'' + cid + '\')">+ Add evidence row</button>'
    + '</div>';
}

function setEvidenceKind(ctrlId, idx, kind) {
  if (!state.controlStatus[ctrlId] || !state.controlStatus[ctrlId].evidence || !state.controlStatus[ctrlId].evidence[idx]) return;
  var row = state.controlStatus[ctrlId].evidence[idx];
  if (kind === 'image') {
    row.kind = 'image';
    row.mime = row.mime || 'image/png';
    row.caption = row.caption != null ? row.caption : '';
    row.dataUrl = row.dataUrl || '';
    delete row.type;
    delete row.ref;
  } else {
    row.kind = 'ref';
    row.type = row.type || 'Policy';
    row.ref = row.ref != null ? row.ref : (row.caption || '');
    delete row.dataUrl;
    delete row.mime;
    delete row.caption;
  }
  markDirty();
  renderControlStep2();
}

function handleEvidenceImageUpload(ctrlId, idx, input) {
  var f = input.files && input.files[0];
  if (!f) return;
  if (f.type !== 'image/png' && f.type !== 'image/jpeg') {
    showToast('Only PNG or JPEG images are allowed for evidence screenshots.', true);
    input.value = '';
    return;
  }
  if (f.size > __EVIDENCE_IMAGE_MAX_BYTES) {
    showToast('Image too large — max ' + Math.round(__EVIDENCE_IMAGE_MAX_BYTES / 1024) + ' KB per screenshot.', true);
    input.value = '';
    return;
  }
  var reader = new FileReader();
  reader.onload = function() {
    if (!state.controlStatus[ctrlId] || !state.controlStatus[ctrlId].evidence || !state.controlStatus[ctrlId].evidence[idx]) return;
    var url = reader.result;
    var prev = state.controlStatus[ctrlId].evidence[idx].dataUrl;
    state.controlStatus[ctrlId].evidence[idx].kind = 'image';
    state.controlStatus[ctrlId].evidence[idx].dataUrl = url;
    state.controlStatus[ctrlId].evidence[idx].mime = f.type;
    logFieldChange('controlStatus.' + ctrlId + '.evidence[' + idx + '].image', prev ? '(replaced)' : '(none)', '(binary)');
    markDirty();
    renderControlStep2();
    showToast('Image attached — use Save now to persist.');
  };
  reader.onerror = function() { showToast('Could not read image file.', true); };
  reader.readAsDataURL(f);
  input.value = '';
}

function openEvidenceImageViewerAt(ctrlId, idx) {
  var row = ((state.controlStatus[ctrlId] || {}).evidence || [])[idx];
  if (!row || !row.dataUrl) return;
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:10100;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = '<div style="position:relative;max-width:96vw;max-height:96vh;">'
    + '<button type="button" id="evFullClose" style="position:absolute;top:-44px;right:0;background:white;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;">Close</button>'
    + '<img alt="Evidence" style="max-width:92vw;max-height:88vh;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.5);">'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('img').src = row.dataUrl;
  document.getElementById('evFullClose').onclick = function() { overlay.remove(); };
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

// ── CONTROL DETAIL FORM (Step 2 right panel) ──────────────────────────────────
function renderControlDetailForm(ctrl) {
  normalizeControlDesignState(ctrl.id);
  const cs  = state.controlStatus[ctrl.id] || {};
  const co  = (state.controlOwners||{})[ctrl.id] || {};
  const st  = cs.status || 'Not Started';
  const pn  = (() => {
    const ctrls = getScopedControls().filter(c =>
      !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
      !(state.controlStatus[c.id]||{}).recommendedDeselect);
    const idx = ctrls.findIndex(c=>c.id===ctrl.id);
    return { prev: idx>0?ctrls[idx-1].id:null, next: idx<ctrls.length-1?ctrls[idx+1].id:null };
  })();
  const designSource    = cs.designSource || '';
  const designParts     = cs.designParts  || {};
  const nistParts       = parseControlParts(ctrl.id);
  const nistFullText    = (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrl.id]) ? NIST_CONTROL_TEXT[ctrl.id] : '';
  const controlAssignments = extractNistAssignments(nistFullText);
  const designParams    = cs.designParams || {};
  const coveredTypes    = getCtrlCoveredAssetTypes(ctrl.id);
  const assetTypeStatus = cs.assetTypeStatus || {};
  const policyReqs      = getControlPolicyReqs(ctrl.id);
  const designChecklist = getDesignChecklist(ctrl);
  const cid = ctrl.id.replace(/'/g,"\\'");

  return `
    <!-- ① Control header -->
    <div style="background:var(--navy);color:white;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-family:monospace;font-size:18px;font-weight:800;">${ctrl.id}</span>
            <span class="family-badge" style="background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.2);">${ctrl.f}</span>
          </div>
          <div style="font-size:15px;font-weight:600;margin-bottom:8px;">${ctrl.n}</div>
          <div>${pillsHTML(ctrl.bl)}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.7;margin-bottom:4px;">Status</div>
          ${chipHTML(st)}
        </div>
      </div>
    </div>

    <!-- ② Design Requirements Context -->
    <div style="background:#fafbff;border:2px solid var(--navy);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:16px;">📋</span>
        <div>
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;color:var(--navy);">Requirements Your Design Must Satisfy</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Your control design must demonstrate how it addresses ALL of the following.</div>
        </div>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin-bottom:${policyReqs.length ? '12px' : '0'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1d4ed8;">① NIST SP 800-53 Rev. 5 — Control Requirement</div>
          <a href="https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_1_1/home?element=${ctrl.id}" target="_blank" rel="noopener" style="font-size:11px;color:#1d4ed8;text-decoration:none;font-weight:600;border:1px solid #bfdbfe;padding:2px 8px;border-radius:4px;white-space:nowrap;">🔗 NIST Catalog</a>
        </div>
        <div style="font-size:12px;color:#1e3a5f;line-height:1.7;white-space:pre-line;">${(typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrl.id]) ? escapeHTML(NIST_CONTROL_TEXT[ctrl.id]) : escapeHTML(ctrlShortDesc(ctrl))}</div>
      </div>

      ${policyReqs.length ? `
      <div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6366f1;margin-bottom:10px;">② Policy Requirements Linked to this Control (${policyReqs.length})</div>
        ${policyReqs.map(r =>
          '<div style="border-left:3px solid #6366f1;padding:8px 12px;margin-bottom:8px;background:rgba(99,102,241,0.03);border-radius:0 6px 6px 0;">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
          + '<span style="font-family:monospace;font-size:11px;font-weight:700;background:rgba(99,102,241,0.1);color:#6366f1;padding:1px 6px;border-radius:4px;">' + escapeHTML(r.reqId) + '</span>'
          + '<span style="font-size:11px;color:var(--text-muted);">' + escapeHTML(r.policyTitle) + '</span>'
          + '</div>'
          + '<div style="font-size:12px;color:var(--navy);line-height:1.6;">' + escapeHTML(r.reqText) + '</div>'
          + '</div>'
        ).join('')}
      </div>` : `
      <div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.15);border-radius:8px;padding:10px 14px;font-size:11px;color:#6366f1;">
        ② No policy requirements explicitly link to this control yet — your design still needs to satisfy the NIST requirement above.
      </div>`}
    </div>

    <!-- ③ Asset & Process Scope -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Asset &amp; Process Scope</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">
        Identify which asset types and processes this control applies to. Your design must address how it works for <strong>each type you check</strong>. Assessors will validate coverage by asset type.
      </div>

      ${((state.assets||[]).length > 0 || (state.processes||[]).length > 0) ? `
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:var(--navy);margin-bottom:8px;">Link Specific Assets &amp; Processes from Inventory</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:100px;overflow-y:auto;padding:4px;">
          ${(state.assets||[]).map(a => {
            const linked = (cs.linkedAssets||[]).includes(a.id||a.name);
            const aid = (a.id||a.name||'').replace(/'/g,"\\'");
            return `<label style="display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 8px;background:${linked?'rgba(13,148,136,0.08)':'#f8fafc'};border:1px solid ${linked?'var(--teal)':'var(--border)'};border-radius:6px;cursor:pointer;white-space:nowrap;"><input type="checkbox" ${linked?'checked':''} style="accent-color:var(--teal);" onchange="toggleCtrlAssetLink('${cid}','${aid}',this.checked)">${escapeHTML(a.name||a.id)}</label>`;
          }).join('')}
          ${(state.processes||[]).map(p => {
            const linked = (cs.linkedProcesses||[]).includes(p.id||p.name);
            const pid = (p.id||p.name||'').replace(/'/g,"\\'");
            return `<label style="display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 8px;background:${linked?'rgba(99,102,241,0.08)':'#f8fafc'};border:1px solid ${linked?'rgba(99,102,241,0.4)':'var(--border)'};border-radius:6px;cursor:pointer;white-space:nowrap;"><input type="checkbox" ${linked?'checked':''} style="accent-color:#6366f1;" onchange="toggleCtrlProcessLink('${cid}','${pid}',this.checked)">⚙️ ${escapeHTML(p.name||p.id)}</label>`;
          }).join('')}
        </div>
      </div>` : `
      <div style="background:#f8fafc;border:1px dashed var(--border);border-radius:6px;padding:8px 12px;font-size:11px;color:var(--text-muted);margin-bottom:14px;">
        No assets or processes in inventory yet — add them in the Assets &amp; SSP tab. Asset type coverage below still applies.
      </div>`}

      <div style="font-size:11px;font-weight:700;color:var(--navy);margin-bottom:8px;">Asset Type Coverage <span style="font-weight:400;color:var(--text-muted);">(check all that apply)</span></div>
      ${buildAssetCoverageHTML(ctrl.id)}
    </div>

    <!-- ④ Control Design -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Control Design</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">Document how this control is designed and implemented. This must address all parts of the NIST requirement above. Assessors use this to verify your implementation covers all sub-requirements.</div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        ${[
          ['Design Source Complete', designChecklist.sourceReady, designChecklist.sourceDetail],
          ['Asset/Process Scope Set', designChecklist.coverageReady, designChecklist.coverageDetail],
          ['Policy/NIST Alignment', designChecklist.policyReady, designChecklist.policyDetail]
        ].map(([label, ok, detail]) => `
          <div style="background:${ok?'#f0fdf4':'#fff7ed'};border:1px solid ${ok?'#86efac':'#fdba74'};border-radius:8px;padding:8px 10px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${ok?'#166534':'#b45309'};">${ok?'✓':'⚠'} ${label}</div>
            <div style="font-size:10px;color:${ok?'#166534':'#92400e'};margin-top:3px;line-height:1.45;">${detail}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <label style="display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border:2px solid ${!designSource||designSource==='inline'?'var(--teal)':'var(--border)'};border-radius:8px;cursor:pointer;flex:1;background:${!designSource||designSource==='inline'?'rgba(13,148,136,0.04)':'white'};">
          <input type="radio" name="ctrlDesignSrc_${ctrl.id}" value="inline" ${!designSource||designSource==='inline'?'checked':''} onchange="setCtrlDesignSource('${cid}','inline')" style="margin-top:2px;accent-color:var(--teal);">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--navy);">Document the design here</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Write the control design directly. Recommended when no existing procedure covers this control.</div>
          </div>
        </label>
        <label style="display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border:2px solid ${designSource==='external'?'var(--teal)':'var(--border)'};border-radius:8px;cursor:pointer;flex:1;background:${designSource==='external'?'rgba(13,148,136,0.04)':'white'};">
          <input type="radio" name="ctrlDesignSrc_${ctrl.id}" value="external" ${designSource==='external'?'checked':''} onchange="setCtrlDesignSource('${cid}','external')" style="margin-top:2px;accent-color:var(--teal);">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--navy);">Point to an existing procedure or standard</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Reference a procedure, standard, or policy that already captures this control design.</div>
          </div>
        </label>
      </div>

      ${designSource === 'external' ? `
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px;">
        <div style="display:grid;grid-template-columns:1fr 160px;gap:10px;margin-bottom:10px;">
          <div>
            <label class="form-label" style="font-size:10px;">Document Title</label>
            <input class="form-input" style="font-size:12px;" value="${escapeHTML(cs.externalDocTitle||'')}" placeholder="e.g. Account Management Procedure v2.1" oninput="setCtrlField('${cid}','externalDocTitle',this.value)">
          </div>
          <div>
            <label class="form-label" style="font-size:10px;">Document Type</label>
            <select class="form-select" style="font-size:12px;" onchange="setCtrlField('${cid}','externalDocType',this.value)">
              ${['','Procedure','Standard','Policy','SOP','Framework Control','Work Instruction','Other'].map(t=>`<option ${(cs.externalDocType||'')=== t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <label class="form-label" style="font-size:10px;">Reference / Location (URL, file path, or document ID)</label>
          <input class="form-input" style="font-size:12px;" value="${escapeHTML(cs.externalDocRef||'')}" placeholder="e.g. https://wiki.company.com/procedures/ac-2  or  ISMS-PROC-AC-002" oninput="setCtrlField('${cid}','externalDocRef',this.value)">
        </div>
        <div>
          <label class="form-label" style="font-size:10px;">Coverage Summary <span style="font-weight:400;">(briefly explain how the document addresses each NIST sub-requirement)</span></label>
          <textarea class="form-input" rows="3" style="font-size:12px;resize:vertical;" placeholder="e.g. Section 3.1 addresses sub-req (a–d): account types and approval. Section 4 covers (g): monitoring. Section 5 covers (h–l): lifecycle notifications." oninput="setCtrlField('${cid}','externalDocSummary',this.value)">${escapeHTML(cs.externalDocSummary||'')}</textarea>
        </div>
      </div>
      ` : nistParts ? `
      <div style="font-size:11px;color:#166534;margin-bottom:12px;padding:8px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;">
        ✅ NIST ${ctrl.id} has ${Object.keys(nistParts).length} sub-requirements (${Object.keys(nistParts)[0].toUpperCase()}–${Object.keys(nistParts).slice(-1)[0].toUpperCase()}). Document how your design addresses each one below.
      </div>
      ${Object.keys(nistParts).map(letter => {
        const partText = nistParts[letter];
        const savedVal = designParts[letter] || '';
        const assignments = extractNistAssignments(partText);
        const partParams = ((cs.designPartParams || {})[letter]) || {};
        return `<div style="border:1px solid var(--border);border-radius:8px;margin-bottom:12px;overflow:hidden;">
          <div style="background:#f8fafc;padding:10px 14px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:flex-start;">
            <span style="font-family:monospace;font-size:14px;font-weight:800;color:var(--navy);background:rgba(30,58,95,0.08);padding:2px 8px;border-radius:4px;flex-shrink:0;">${letter.toUpperCase()}</span>
            <div style="font-size:11px;color:var(--text-muted);line-height:1.6;">${escapeHTML(partText.length > 220 ? partText.substring(0,220)+'…' : partText)}</div>
          </div>
          <div style="padding:10px 14px;">
            <label class="form-label" style="font-size:10px;">How does your design address sub-requirement ${letter.toUpperCase()}?</label>
            <textarea class="form-input" rows="3" style="font-size:12px;line-height:1.6;resize:vertical;" placeholder="Describe the specific process, system, or mechanism that satisfies this sub-requirement…" oninput="setCtrlDesignPart('${cid}','${letter}',this.value)">${escapeHTML(savedVal)}</textarea>
            ${assignments.length ? `<div style="margin-top:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 12px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#1d4ed8;margin-bottom:6px;">Tailoring Required for This Sub-Requirement</div>
              <div style="font-size:11px;color:#1e3a8a;margin-bottom:8px;">Fill organization-defined values referenced in this specific subcomponent.</div>
              ${assignments.map(a => {
                const safeA = a.replace(/'/g,"\\'");
                const savedA = partParams[a] || '';
                return `<label class="form-label" style="font-size:10px;margin-top:6px;">${escapeHTML(a)}</label>
                <input class="form-input" style="font-size:12px;" value="${escapeHTML(savedA)}" placeholder="Define value for: ${escapeHTML(a)}" oninput="setCtrlPartAssignment('${cid}','${letter}','${safeA}',this.value)">`;
              }).join('')}
            </div>` : ''}
          </div>
        </div>`;
      }).join('')}
      ` : `
      <div>
        <label class="form-label">Control Design Description</label>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">Describe how this control is designed and implemented. Be specific about systems, processes, configurations, and responsible roles. Assessors use this to verify your implementation.</div>
        <textarea class="form-input" rows="5" style="font-size:12px;line-height:1.6;resize:vertical;" placeholder="Describe how this control operates in your environment…" oninput="setCtrlField('${cid}','approach',this.value)">${escapeHTML(cs.approach||'')}</textarea>
        ${controlAssignments.length ? `<div style="margin-top:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 12px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#1d4ed8;margin-bottom:6px;">Tailoring Required</div>
          <div style="font-size:11px;color:#1e3a8a;margin-bottom:8px;">This control statement includes organization-defined values. Define them here as part of the design.</div>
          ${controlAssignments.map(a => {
            const safeA = a.replace(/'/g,"\\'");
            const savedA = designParams[a] || '';
            return `<label class="form-label" style="font-size:10px;margin-top:6px;">${escapeHTML(a)}</label>
            <input class="form-input" style="font-size:12px;" value="${escapeHTML(savedA)}" placeholder="Define value for: ${escapeHTML(a)}" oninput="setCtrlAssignment('${cid}','${safeA}',this.value)">`;
          }).join('')}
        </div>` : ''}
      </div>
      `}

      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
        <label class="form-label">Auditor-Ready Narrative <span style="font-weight:400;font-size:11px;color:var(--text-muted);">(optional — integrates all sub-reqs into one statement)</span></label>
        <textarea class="form-input" rows="3" style="font-size:12px;line-height:1.6;resize:vertical;" placeholder="The organization implements ${ctrl.id} through…" oninput="setCtrlField('${cid}','narrative',this.value)">${escapeHTML(cs.narrative||'')}</textarea>
      </div>
    </div>

    ${buildEvidenceArtifactSectionHTML(ctrl)}

    <!-- ⑤ Implementation Status -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Implementation Status</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">Set the overall status. If asset types are in scope, you can also track status per asset type to reflect partial rollout.</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:${coveredTypes.length>0?'14px':'0'};">
        <div>
          <label class="form-label" style="font-size:10px;">Overall Status</label>
          <select class="form-select" onchange="setCtrlStatus('${cid}',this.value)">
            ${['Not Started','Planned','In Progress','Implemented','Not Applicable','Inherited'].map(s=>`<option ${st===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        ${st==='Planned'||st==='In Progress' ? `
        <div>
          <label class="form-label" style="font-size:10px;">Target Completion Date</label>
          <input class="form-input" type="date" style="font-size:12px;" value="${escapeHTML(co.dueDate||'')}" oninput="setCtrlOwnerField('${cid}','dueDate',this.value)">
        </div>` : ''}
      </div>

      ${coveredTypes.length > 0 ? `
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:12px 14px;">
        <div style="font-size:11px;font-weight:700;color:var(--navy);margin-bottom:10px;">Status by Asset Type</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${coveredTypes.map(t => {
            const tStatus = assetTypeStatus[t.key] || '';
            const tkey = t.key.replace(/'/g,"\\'");
            return `<div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:11px;color:var(--navy);min-width:220px;">${escapeHTML(t.label)}</span>
              <select class="form-select" style="flex:1;font-size:11px;padding:5px 8px;" onchange="setCtrlAssetTypeStatus('${cid}','${tkey}',this.value)">
                ${['','Not Started','Planned','In Progress','Implemented','Not Applicable','Inherited'].map(s=>`<option ${tStatus===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      ${st === 'Not Applicable' ? `
      <div style="margin-top:14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:14px;">
        <label class="form-label" style="color:#c2410c;font-size:10px;">⚠️ Not Applicable — Justification Required <span class="required">*</span></label>
        <textarea class="form-input" rows="3" style="font-size:12px;resize:vertical;" placeholder="Explain why this control does not apply…" oninput="setCtrlField('${cid}','naJustification',this.value)">${escapeHTML(cs.naJustification||'')}</textarea>
      </div>` : ''}
      ${st === 'Inherited' ? `
      <div style="margin-top:14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:14px;">
        <label class="form-label" style="color:#1d4ed8;font-size:10px;">🔗 Inherited From — Source Required</label>
        <input class="form-input" style="font-size:12px;" placeholder="e.g. AWS GovCloud (FedRAMP High), or Corporate AD managed by IT Ops…" value="${escapeHTML(cs.inheritedFrom||'')}" oninput="setCtrlField('${cid}','inheritedFrom',this.value)">
      </div>` : ''}
    </div>

    <!-- ⑥ Internal Notes -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Internal Notes <span style="font-weight:400;font-size:11px;color:var(--text-muted);">(not included in reports)</span></div>
      <textarea class="form-input" rows="2" style="font-size:12px;resize:vertical;" placeholder="Gaps, remediation plans, open questions, implementation blockers…" oninput="setCtrlField('${cid}','notes',this.value)">${escapeHTML(cs.notes||'')}</textarea>
    </div>

    <!-- ⑦ Return / De-select -->
    <div style="border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 16px;background:rgba(239,68,68,0.02);margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:2px;">Not your control?</div>
          <div style="font-size:11px;color:var(--text-muted);">Return it to the policy owner for reassignment, or propose that it be removed from scope.</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;margin-left:auto;">
          <button class="btn btn-sm" style="background:white;border:1px solid rgba(220,38,38,0.4);color:#dc2626;font-weight:600;white-space:nowrap;" onclick="returnControlToPolicyOwner('${cid}')">↩ Return to Policy Owner</button>
          <button class="btn btn-sm" style="background:white;border:1px solid rgba(245,158,11,0.4);color:#d97706;font-weight:600;white-space:nowrap;" onclick="recommendControlDeselect('${cid}')">✗ Propose De-selection</button>
        </div>
      </div>
    </div>

    <!-- Prev / Next -->
    <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);">
      <button class="btn btn-secondary btn-sm" onclick="${pn.prev?`selectCtrlDetail('${pn.prev.replace(/'/g,"\\'")}')`:''}" ${!pn.prev?'disabled style="opacity:0.5;cursor:not-allowed;"':''}>← Prev Control</button>
      <button class="btn btn-secondary btn-sm" onclick="${pn.next?`selectCtrlDetail('${pn.next.replace(/'/g,"\\'")}')`:''}" ${!pn.next?'disabled style="opacity:0.5;cursor:not-allowed;"':''}>Next Control →</button>
    </div>`;
}

function setCtrlStatus(ctrlId, status) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var oldStatus = state.controlStatus[ctrlId].status || 'Not Started';
  state.controlStatus[ctrlId].status = status;
  logFieldChange('controlStatus.' + ctrlId + '.status', oldStatus, status);
  if (oldStatus !== status) addAuditEntry('control', ctrlId, 'Status changed: ' + oldStatus + ' → ' + status);
  renderControlStep2();
}

var __CTRL_FIELD_LOG_SKIP = { approach: 1, narrative: 1, notes: 1, naJustification: 1, externalDocSummary: 1 };
function setCtrlField(ctrlId, field, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var prev = state.controlStatus[ctrlId][field];
  state.controlStatus[ctrlId][field] = value;
  if (!__CTRL_FIELD_LOG_SKIP[field]) logFieldChange('controlStatus.' + ctrlId + '.' + field, prev, value);
  markDirty();
}

function setCtrlOwnerField(ctrlId, field, value) {
  if (!state.controlOwners) state.controlOwners = {};
  if (!state.controlOwners[ctrlId]) state.controlOwners[ctrlId] = {};
  var prev = state.controlOwners[ctrlId][field];
  state.controlOwners[ctrlId][field] = value;
  if (field === 'name' || field === 'email') delete state.controlOwners[ctrlId].isDemoPlaceholder;
  logFieldChange('controlOwners.' + ctrlId + '.' + field, prev, value);
  markDirty();
}

function addCtrlEvidence(ctrlId) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].evidence) state.controlStatus[ctrlId].evidence = [];
  state.controlStatus[ctrlId].evidence.push({ kind: 'ref', type: 'Policy', ref: '' });
  markDirty();
  renderControlStep2();
}

function removeCtrlEvidence(ctrlId, idx) {
  state.controlStatus[ctrlId].evidence.splice(idx, 1);
  markDirty();
  renderControlStep2();
}

function setEvidenceField(ctrlId, idx, field, value) {
  if (state.controlStatus[ctrlId]?.evidence?.[idx]) {
    var prev = state.controlStatus[ctrlId].evidence[idx][field];
    state.controlStatus[ctrlId].evidence[idx][field] = value;
    logFieldChange('controlStatus.' + ctrlId + '.evidence[' + idx + '].' + field, prev, value);
    markDirty();
  }
}

function setAssetCoverage(ctrlId, typeKey, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].assetCoverage) state.controlStatus[ctrlId].assetCoverage = {};
  state.controlStatus[ctrlId].assetCoverage[typeKey] = checked;
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

function getAllAssetTypes() {
  ensureAssetTypeMetadata();
  var custom = (state.customAssetTypes || []).filter(function(t){ return t && t.trim(); });
  var standard = [];
  getActiveAssetTypeCatalog().forEach(function(cat){ cat.types.forEach(function(t){ standard.push(t.label); }); });
  return standard.concat(custom).concat(['Other']);
}

function getAssetTypeKey(label) {
  var catalog = getActiveAssetTypeCatalog();
  for (var i = 0; i < catalog.length; i++) {
    for (var j = 0; j < catalog[i].types.length; j++) {
      if (catalog[i].types[j].label === label) return catalog[i].types[j].key;
    }
  }
  return null;
}

function buildAssetTypeOptions(selectedLabel) {
  var html = '<option value="">— Select type —</option>';
  var activeLabels = [];
  getActiveAssetTypeCatalog().forEach(function(cat) {
    html += '<optgroup label="' + cat.category + '">';
    cat.types.forEach(function(t) {
      activeLabels.push(t.label);
      html += '<option value="' + t.label + '"' + (selectedLabel === t.label ? ' selected' : '') + '>' + t.label + '</option>';
    });
    html += '</optgroup>';
  });
  var custom = (state.customAssetTypes || []).filter(function(t){ return t && t.trim(); });
  if (custom.length) {
    html += '<optgroup label="Custom">';
    custom.forEach(function(t) {
      html += '<option value="' + t + '"' + (selectedLabel === t ? ' selected' : '') + '>' + t + '</option>';
    });
    html += '</optgroup>';
  }
  if (selectedLabel && selectedLabel !== 'Other' && activeLabels.indexOf(selectedLabel) === -1 && custom.indexOf(selectedLabel) === -1) {
    html += '<optgroup label="Retired / Unlisted"><option value="' + _esc(selectedLabel) + '" selected>' + _esc(selectedLabel) + '</option></optgroup>';
  }
  html += '<option value="Other"' + (selectedLabel === 'Other' ? ' selected' : '') + '>Other</option>';
  return html;
}

function setCustomAssetCoverage(ctrlId, typeName, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].assetCoverage) state.controlStatus[ctrlId].assetCoverage = {};
  state.controlStatus[ctrlId].assetCoverage['custom_' + typeName] = checked;
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

function addCustomAssetType(ctrlId) {
  var input = document.getElementById('_newAssetTypeName');
  var groupInput = document.getElementById('_newAssetTypeCategory');
  if (!input) return;
  var name = input.value.trim();
  var groupName = (groupInput && groupInput.value ? groupInput.value : 'Custom').trim() || 'Custom';
  if (!name) { showToast('Please enter a type name.', true); input.focus(); return; }
  var allExisting = getAllAssetTypes().map(function(t){ return t.toLowerCase(); });
  if (allExisting.includes(name.toLowerCase())) {
    showToast('"' + name + '" already exists.', true); input.select(); return;
  }
  input.value = '';
  if (userCanApproveAssetTypeRequests()) {
    applyAssetTypeAdd(name, groupName);
    addAuditEntry('program', 'asset-types', 'Asset type added directly by ' + getCurrentActorName() + ': "' + name + '" in group "' + groupName + '"');
    markDirty();
    showToast('✅ Added asset type "' + name + '"');
    setCustomAssetCoverage(ctrlId, name, true);
    var coverageDiv = document.getElementById('asset-coverage-' + ctrlId);
    if (coverageDiv) coverageDiv.outerHTML = buildAssetCoverageHTML(ctrlId);
    return;
  }
  if (groupInput) groupInput.value = groupName;
  submitAssetTypeRequest('add', name, 'Requested from control design coverage editor', groupName);
  showToast('Asset type add request submitted to program owner.');
}

function removeCustomAssetType(typeName) {
  if (!confirm('Request deletion of asset type "' + typeName + '"?\n\nIf approved, this will uncheck it from all controls.')) return;
  if (userCanApproveAssetTypeRequests()) {
    var removed = applyAssetTypeDelete(typeName);
    if (!removed) { showToast('Type not found or already removed.', true); return; }
    addAuditEntry('program', 'asset-types', 'Asset type removed directly by ' + getCurrentActorName() + ': "' + typeName + '"');
    markDirty();
    showToast('Removed asset type "' + typeName + '"');
    renderControlStep2();
    return;
  }
  submitAssetTypeRequest('delete', typeName, 'Requested from control design coverage editor');
  renderControlStep2();
}

function buildAssetCoverageHTML(ctrlId) {
  ensureAssetTypeMetadata();
  var cs = state.controlStatus[ctrlId] || {};
  var customTypes = state.customAssetTypes || [];

  var standardHTML = getActiveAssetTypeCatalog().map(function(cat) {
    var groupHTML = '<div style="grid-column:1/-1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-top:8px;margin-bottom:2px;">' + cat.category + '</div>';
    cat.types.forEach(function(t) {
      var chk = (cs.assetCoverage||{})[t.key];
      groupHTML += '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--navy);cursor:pointer;padding:3px 0;">'
        + '<input type="checkbox"' + (chk?' checked':'') + ' style="accent-color:var(--teal);" onchange="setAssetCoverage(\'' + ctrlId + '\',\'' + t.key + '\',this.checked)">'
        + t.label + '</label>';
    });
    return groupHTML;
  }).join('');

  var groupedCustom = {};
  customTypes.forEach(function(at) {
    var grp = (state.customAssetTypeGroups || {})[at] || 'Custom';
    if (!groupedCustom[grp]) groupedCustom[grp] = [];
    groupedCustom[grp].push(at);
  });
  var customHTML = Object.keys(groupedCustom).sort().map(function(groupName) {
    var groupHeader = '<div style="grid-column:1/-1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#0f766e;margin-top:8px;margin-bottom:2px;">' + _esc(groupName) + '</div>';
    var rows = groupedCustom[groupName].map(function(at) {
      var chk = (cs.assetCoverage||{})['custom_' + at];
      var safeAt = at.replace(/'/g, "\\'");
      return '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--navy);cursor:pointer;padding:3px 0;">'
        + '<input type="checkbox"' + (chk?' checked':'') + ' style="accent-color:var(--teal);" onchange="setCustomAssetCoverage(\'' + ctrlId + '\',\'' + safeAt + '\',this.checked)">'
        + _esc(at)
        + '<span onclick="removeCustomAssetType(\'' + safeAt + '\')" title="Request delete for this type" style="margin-left:4px;color:var(--red);cursor:pointer;font-size:10px;opacity:0.6;" onmouseenter="this.style.opacity=\'1\'" onmouseleave="this.style.opacity=\'0.6\'">✕</span>'
        + '</label>';
    }).join('');
    return groupHeader + rows;
  }).join('');

  var groupOpts = getAllAssetTypeGroups().map(function(g){ return '<option value="' + _esc(g) + '">' + _esc(g) + '</option>'; }).join('');
  var addRowHTML = '<div style="grid-column:1/-1;display:grid;grid-template-columns:1fr 190px auto;align-items:center;gap:6px;margin-top:6px;padding-top:8px;border-top:1px dashed var(--border);">'
    + '<input id="_newAssetTypeName" class="form-input" style="font-size:12px;padding:5px 8px;" placeholder="Add custom type (e.g. IoT Device, Mainframe…)"'
    + ' onkeydown="if(event.key===\'Enter\')addCustomAssetType(\'' + ctrlId + '\')">'
    + '<select id="_newAssetTypeCategory" class="form-select" style="font-size:12px;padding:5px 8px;">' + groupOpts + '</select>'
    + '<button class="btn btn-secondary btn-sm" onclick="addCustomAssetType(\'' + ctrlId + '\')">+ Add</button>'
    + '</div>';

  return '<div id="asset-coverage-' + ctrlId + '" style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;margin-bottom:8px;">'
    + standardHTML + customHTML + addRowHTML
    + '</div>';
}

function toggleAssetMapping(controlId, assetId, checked) {
  if (!state.assetMappings) state.assetMappings = {};
  if (!state.assetMappings[controlId]) state.assetMappings[controlId] = [];
  if (checked) {
    if (!state.assetMappings[controlId].includes(assetId)) state.assetMappings[controlId].push(assetId);
  } else {
    state.assetMappings[controlId] = state.assetMappings[controlId].filter(a => a !== assetId);
  }
  markDirty();
  renderControlStep2();
}

// ── STEP 3: ASSET OWNER REQUIREMENTS ─────────────────────────────────────────
function renderControlStep3() {
  const body = document.getElementById('control-step-3-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div></div>`;
    return;
  }
  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  const designedControls = controls.filter(function(c) {
    const cs = state.controlStatus[c.id] || {};
    return cs.designSource || (cs.approach && cs.approach.trim()) ||
           (cs.designParts && Object.values(cs.designParts).some(v => v && v.trim()));
  });

  if (designedControls.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Designed Yet</div><p>Go to Step 2 to design at least one control. Once you've documented the design, you'll define what asset owners need to do to comply.</p><button class="btn btn-primary" onclick="goToStep('control',2)" style="margin-top:16px;">Go to Step 2 →</button></div>`;
    return;
  }

  const filter     = state._ctrlStep3Filter || 'all';
  const allFams    = [...new Set(designedControls.map(c=>c.f))];
  const shown      = filter === 'all' ? designedControls : designedControls.filter(c => c.f === filter);
  const withReqs   = designedControls.filter(function(c) {
    normalizeControlDesignState(c.id);
    return ((state.controlStatus[c.id]||{}).assetOwnerRequirements||[]).some(r =>
      (r.requirement && r.requirement.trim()) || (r.evidenceNeeded && r.evidenceNeeded.trim())
    );
  }).length;
  const uniqueTypes = [...new Set(designedControls.flatMap(c => getCtrlCoveredAssetTypes(c.id).map(t => t.label)))].length;

  body.innerHTML = `
    <div class="section-title">Asset-Type Requirements &amp; Required Evidence</div>
    <div class="section-subtitle">For each designed control, define downstream obligations by asset type: what asset/process owners must do, what evidence they must provide, and how reviewers should judge sufficiency. These definitions flow into the Assets &amp; SSP attestation workflow.</div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px;border-left:3px solid #166534;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#166534;">Controls Designed</div>
        <div style="font-size:26px;font-weight:800;color:#166534;">${designedControls.length}</div>
        <div style="font-size:10px;color:#166534;opacity:0.7;">of ${controls.length} assigned</div>
      </div>
      <div style="background:${withReqs>0?'#f0fdf4':'#f8fafc'};border:1px solid ${withReqs>0?'#86efac':'var(--border)'};border-radius:10px;padding:14px 16px;border-left:3px solid ${withReqs>0?'#166534':'#94a3b8'};">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${withReqs>0?'#166534':'#64748b'};">Requirements Defined</div>
        <div style="font-size:26px;font-weight:800;color:${withReqs>0?'#166534':'#64748b'};">${withReqs}</div>
        <div style="font-size:10px;color:${withReqs>0?'#166534':'#64748b'};opacity:0.7;">controls with asset owner reqs</div>
      </div>
      <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;border-left:3px solid #1d4ed8;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1d4ed8;">Asset Types in Scope</div>
        <div style="font-size:26px;font-weight:800;color:#1d4ed8;">${uniqueTypes}</div>
        <div style="font-size:10px;color:#1d4ed8;opacity:0.7;">unique types across all controls</div>
      </div>
    </div>

      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#92400e;">
      <strong>💡 Design intent:</strong> You are defining implementation obligations, not attesting compliance. Asset owners will later attest in their own workspace using the requirements/evidence expectations you define here.
    </div>

    <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:16px;flex-wrap:wrap;width:fit-content;">
      ${[['all','All Controls',designedControls.length]].concat(allFams.map(f => [f, f + ' — ' + (FAMILIES[f]||f), designedControls.filter(c=>c.f===f).length])).map(([val,label,count]) =>
        `<button onclick="state._ctrlStep3Filter='${val}';renderControlStep3();" style="padding:7px 14px;font-size:11px;font-weight:600;border:none;cursor:pointer;background:${filter===val?'var(--navy)':'white'};color:${filter===val?'white':'var(--text-muted)'};border-right:1px solid var(--border);">${label} <span style="background:${filter===val?'rgba(255,255,255,0.2)':'#e2e8f0'};border-radius:99px;padding:1px 7px;font-size:10px;margin-left:4px;">${count}</span></button>`
      ).join('')}
    </div>

    <div id="ctrlStep3List">
      ${shown.map(c => {
        normalizeControlDesignState(c.id);
        const cs       = state.controlStatus[c.id] || {};
        const covTypes = getCtrlCoveredAssetTypes(c.id);
        const pReqs    = getControlPolicyReqs(c.id);
        const existing = cs.assetOwnerRequirements || [];
        const cid      = c.id.replace(/'/g,"\\'");

        const typeBlocks = covTypes.length > 0 ? covTypes.map(t => {
          const req   = existing.find(r => r.assetType === t.label) || { assetType: t.label, requirement: '', evidenceNeeded: '', acceptanceCriteria: '' };
          const tlabel = escapeHTML(t.label).replace(/'/g,"\\'");
          return `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px;">
            <div style="background:#f8fafc;padding:8px 12px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--navy);">📦 ${escapeHTML(t.label)}</div>
            <div style="padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="form-label" style="font-size:10px;">Required implementation actions <span class="required">*</span></label>
                <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. Review all service accounts quarterly, revoke stale accounts, and document manager approval before reactivation." oninput="setAssetOwnerReq('${cid}','${tlabel}','requirement',this.value)">${escapeHTML(req.requirement||'')}</textarea>
              </div>
              <div>
                <label class="form-label" style="font-size:10px;">Required evidence artifacts</label>
                <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. Signed review report, identity export with timestamps, workflow ticket showing approver and closure." oninput="setAssetOwnerReq('${cid}','${tlabel}','evidenceNeeded',this.value)">${escapeHTML(req.evidenceNeeded||'')}</textarea>
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label" style="font-size:10px;">Evidence acceptance criteria</label>
                <textarea class="form-input" rows="2" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. Must be from current quarter, include asset owner + approver names, and show closure of all exceptions." oninput="setAssetOwnerReq('${cid}','${tlabel}','acceptanceCriteria',this.value)">${escapeHTML(req.acceptanceCriteria||'')}</textarea>
              </div>
            </div>
          </div>`;
        }).join('') : `
        <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;">
          <div style="background:#f8fafc;padding:8px 12px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--navy);">General Compliance Requirements <span style="font-size:10px;font-weight:400;color:#d97706;">(no asset types identified — go to Step 2 to set asset coverage)</span></div>
          <div style="padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label class="form-label" style="font-size:10px;">Required implementation actions</label>
              <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="Describe compliance requirements for all asset owners…" oninput="setAssetOwnerReq('${cid}','General','requirement',this.value)">${escapeHTML((existing.find(r=>r.assetType==='General')||{}).requirement||'')}</textarea>
            </div>
            <div>
              <label class="form-label" style="font-size:10px;">Required evidence artifacts</label>
              <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="What evidence or documentation is needed to prove compliance…" oninput="setAssetOwnerReq('${cid}','General','evidenceNeeded',this.value)">${escapeHTML((existing.find(r=>r.assetType==='General')||{}).evidenceNeeded||'')}</textarea>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label" style="font-size:10px;">Evidence acceptance criteria</label>
              <textarea class="form-input" rows="2" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="Define what makes evidence acceptable for review." oninput="setAssetOwnerReq('${cid}','General','acceptanceCriteria',this.value)">${escapeHTML((existing.find(r=>r.assetType==='General')||{}).acceptanceCriteria||'')}</textarea>
            </div>
          </div>
        </div>`;

        return `<div style="background:white;border:1px solid var(--border);border-radius:10px;margin-bottom:18px;overflow:hidden;">
          <div style="background:#fafbfc;padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
            <span class="control-id">${c.id}</span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;color:var(--navy);">${escapeHTML(c.n)}</div>
              ${covTypes.length > 0
                ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${covTypes.map(t=>escapeHTML(t.label)).join(' · ')}</div>`
                : `<div style="font-size:11px;color:#d97706;margin-top:2px;">⚠ No asset types identified — set coverage in Step 2</div>`}
            </div>
            ${chipHTML(cs.status||'Not Started')}
          </div>
          <div style="padding:16px 18px;">
            ${pReqs.length > 0 ? `<div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.2);border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:11px;color:#6366f1;"><strong>Policy reqs:</strong> ${pReqs.map(r=>escapeHTML(r.reqId)).join(', ')} — ${escapeHTML(pReqs[0].policyTitle)}</div>` : ''}
            ${typeBlocks}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function setAssetOwnerReq(ctrlId, assetTypeLabel, field, value) {
  normalizeControlDesignState(ctrlId);
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  const reqs = state.controlStatus[ctrlId].assetOwnerRequirements;
  let existing = reqs.find(r => r.assetType === assetTypeLabel);
  var prev = existing ? existing[field] : undefined;
  if (existing) {
    existing[field] = value;
  } else {
    const newReq = { assetType: assetTypeLabel, requirement: '', evidenceNeeded: '', acceptanceCriteria: '' };
    newReq[field] = value;
    reqs.push(newReq);
  }
  logFieldChange('controlStatus.' + ctrlId + '.assetOwnerReq:' + assetTypeLabel + ':' + field, prev, value);
  markDirty();
}

function getControlOwnerGuidanceForScope(ctrlId, scopeLabel) {
  normalizeControlDesignState(ctrlId);
  var cs = state.controlStatus[ctrlId] || {};
  var reqs = cs.assetOwnerRequirements || [];
  var exact = reqs.find(function(r) { return r.assetType === scopeLabel; });
  var general = reqs.find(function(r) { return r.assetType === 'General'; });
  var selected = exact || general || reqs[0] || null;
  if (!selected) {
    return {
      actions: (cs.assetGuidance || '').trim(),
      evidence: '',
      criteria: ''
    };
  }
  return {
    actions: selected.requirement || '',
    evidence: selected.evidenceNeeded || '',
    criteria: selected.acceptanceCriteria || ''
  };
}

function buildGuidanceFromControlOwner(ctrlId, scopeLabel) {
  var g = getControlOwnerGuidanceForScope(ctrlId, scopeLabel);
  var hasAny = (g.actions || '').trim() || (g.evidence || '').trim() || (g.criteria || '').trim();
  if (!hasAny) {
    return '<em style="color:#86efac;">No requirements defined yet by control owner in Control Wizard Step 3.</em>';
  }
  var html = '';
  if ((g.actions || '').trim()) {
    html += '<div style="margin-bottom:6px;"><strong>Required actions:</strong> ' + _esc(g.actions) + '</div>';
  }
  if ((g.evidence || '').trim()) {
    html += '<div style="margin-bottom:6px;"><strong>Required evidence:</strong> ' + _esc(g.evidence) + '</div>';
  }
  if ((g.criteria || '').trim()) {
    html += '<div><strong>Acceptance criteria:</strong> ' + _esc(g.criteria) + '</div>';
  }
  return html;
}

// ── STEP 4: REVIEW & SUBMIT DESIGN ───────────────────────────────────────────
function renderControlStep4() {
  const body = document.getElementById('control-step-4-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div></div>`;
    return;
  }
  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  if (!state._controlSubmitSelection) state._controlSubmitSelection = {};
  controls.forEach(function(c) {
    if (state._controlSubmitSelection[c.id] === undefined) {
      const st = (state.controlStatus[c.id] || {}).status || 'Not Started';
      state._controlSubmitSelection[c.id] = st !== 'Not Started';
    }
  });
  const submitEligibleControls = controls.filter(c => ((state.controlStatus[c.id]||{}).status || 'Not Started') !== 'Not Started');
  const selectedForSubmit = submitEligibleControls.filter(c => !!state._controlSubmitSelection[c.id]);
  const notStartedCount = controls.length - submitEligibleControls.length;
  const families = [...new Set(controls.map(c=>c.f))];

  const isDesigned = c => isControlDesigned(c.id);
  const designedControls = controls.filter(isDesigned);
  const withReqs   = controls.filter(c => getControlRequirementCoverage(c).satisfiedCount > 0);
  const fullyMappedReqs = controls.filter(c => {
    const cov = getControlRequirementCoverage(c);
    return cov.targetCount > 0 && cov.satisfiedCount >= cov.targetCount;
  });
  const withCriteria = controls.filter(c => getControlRequirementCoverage(c).criteriaCount > 0);
  const withStatus = controls.filter(c => { const st=(state.controlStatus[c.id]||{}).status; return st && st!=='Not Started'; });
  const cnt = {
    Implemented:      controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Implemented').length,
    'In Progress':    controls.filter(c=>(state.controlStatus[c.id]||{}).status==='In Progress').length,
    Planned:          controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Planned').length,
    'Not Applicable': controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Not Applicable').length,
    'Not Started':    controls.filter(c=>!(state.controlStatus[c.id]||{}).status||(state.controlStatus[c.id]||{}).status==='Not Started').length,
  };
  const returnedCount  = getScopedControls().filter(c=>(state.controlStatus[c.id]||{}).returnedToPolicyOwner).length;
  const deselectCount  = getScopedControls().filter(c=>(state.controlStatus[c.id]||{}).recommendedDeselect).length;
  const pctDesigned    = controls.length ? Math.round((designedControls.length/controls.length)*100) : 0;

  body.innerHTML = `
    <div class="section-title">Review &amp; Submit Design</div>
    <div class="section-subtitle">Review your control design documentation before submitting to the policy owner for review. This is a <em>design submission</em> — not a compliance attestation. Asset owners submit compliance evidence separately in the Assets &amp; SSP workspace.</div>

    <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#1e40af;">
      <strong>📌 What you're submitting:</strong> A design-only package: policy/NIST-aligned control design, scoped assets/processes, and required implementation/evidence expectations for asset and process owners.
    </div>

    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px;">
      ${[
        ['In Queue',       controls.length,          'var(--navy)', '#eff6ff'],
        ['Design Done',    designedControls.length,  '#166534',     '#f0fdf4'],
        ['Reqs Defined',   withReqs.length,           '#6366f1',     '#faf5ff'],
        ['Req Mapping',    fullyMappedReqs.length,    '#0f766e',     '#f0fdfa'],
        ['Status Set',     withStatus.length,         '#d97706',     '#fffbeb'],
      ].map(([label,count,color,bg]) => `
        <div style="background:${bg};border:1px solid ${color}22;border-radius:10px;padding:14px 16px;border-left:3px solid ${color};">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${color};">${label}</div>
          <div style="font-size:28px;font-weight:800;color:${color};line-height:1.1;margin-top:4px;">${count}</div>
          <div style="font-size:10px;color:${color};opacity:0.7;margin-top:2px;">of ${controls.length} controls</div>
        </div>`).join('')}
    </div>

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;color:var(--navy);">Design Completion</div>
        <div style="font-size:13px;font-weight:700;color:var(--teal);">${pctDesigned}%</div>
      </div>
      <div style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;margin-bottom:10px;">
        <div style="background:${pctDesigned===100?'#166534':'var(--teal)'};height:100%;width:${pctDesigned}%;border-radius:99px;transition:width 0.3s;"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:var(--text-muted);">
        <div>✅ <strong>${designedControls.length}</strong> controls with design documented</div>
        <div>📝 <strong>${withReqs.length}</strong> controls with downstream requirements</div>
        <div>🔗 <strong>${fullyMappedReqs.length}</strong> controls mapped across scoped asset types</div>
        <div>🧪 <strong>${withCriteria.length}</strong> controls with evidence acceptance criteria</div>
        ${returnedCount > 0 ? `<div>↩ <strong>${returnedCount}</strong> returned to policy owner</div>` : ''}
        ${deselectCount > 0 ? `<div>✗ <strong>${deselectCount}</strong> proposed for de-selection</div>` : ''}
      </div>
    </div>

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:14px;">Before You Submit</div>
      ${[
        [designedControls.length > 0,         'At least one control has a design documented',         'Go to Step 2 to document control designs'],
        [designedControls.length===controls.length, 'All controls have design documentation',          designedControls.length + ' of ' + controls.length + ' documented — ' + (controls.length-designedControls.length) + ' still need design in Step 2'],
        [withStatus.length===controls.length,  'All controls have implementation status set',      withStatus.length + ' of ' + controls.length + ' have status set'],
        [withReqs.length > 0,                  'Downstream requirements/evidence are defined',          'Go to Step 3 to define required actions and evidence'],
        [fullyMappedReqs.length===controls.length, 'Requirements are mapped for each scoped asset type/process', fullyMappedReqs.length + ' of ' + controls.length + ' fully mapped'],
      ].map(([ok,label,hint]) =>
        `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:16px;flex-shrink:0;margin-top:1px;">${ok?'✅':'⚠️'}</div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;color:var(--navy);">${label}</div>
            ${!ok ? `<div style="font-size:11px;color:#d97706;margin-top:2px;">${hint}</div>` : ''}
          </div>
        </div>`
      ).join('')}
      <div style="font-size:11px;color:var(--text-muted);padding-top:8px;">You can submit with incomplete items; policy owner and CISO reviewers will see QA gaps in this summary.</div>
    </div>

    <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid var(--border);">Design Summary by Family</div>
    ${families.map(fam => {
      const fc   = controls.filter(c=>c.f===fam);
      const fd   = fc.filter(isDesigned);
      const fpct = fc.length ? Math.round(fd.length/fc.length*100) : 0;
      return `<div style="border:1px solid var(--border);border-radius:8px;margin-bottom:8px;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fafbfc;cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <span class="family-badge">${fam}</span>
          <div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--navy);">${FAMILIES[fam]||fam}</div><div style="font-size:11px;color:var(--text-muted);">${fc.length} controls · ${fd.length} designed</div></div>
          <div style="display:flex;align-items:center;gap:8px;"><div style="width:80px;background:#e2e8f0;border-radius:99px;height:5px;overflow:hidden;"><div style="background:${fpct===100?'#166534':'var(--teal)'};height:100%;width:${fpct}%;border-radius:99px;"></div></div><div style="font-size:12px;font-weight:700;color:${fpct===100?'#166534':'var(--navy)'};width:36px;text-align:right;">${fpct}%</div></div>
          <span style="font-size:14px;flex-shrink:0;">▼</span>
        </div>
        <div style="display:none;padding:0 16px 12px;">
          <table class="control-table" style="margin-top:8px;">
            <thead><tr><th style="width:80px;">Control</th><th>Name</th><th style="width:130px;">Status</th><th style="width:80px;">Design</th><th style="width:80px;">Reqs</th><th style="width:80px;">Criteria</th></tr></thead>
            <tbody>${fc.map(c => {
              const cs = state.controlStatus[c.id]||{};
              const hd = isDesigned(c);
              const cov = getControlRequirementCoverage(c);
              const hr = cov.targetCount > 0 && cov.satisfiedCount >= cov.targetCount;
              const hc = cov.criteriaCount > 0;
              return `<tr><td><span class="control-id">${c.id}</span></td><td style="font-size:12px;">${escapeHTML(c.n)}</td><td>${chipHTML(cs.status||'Not Started')}</td><td style="text-align:center;">${hd?'<span style="color:#166534;font-size:15px;">✓</span>':'<span style="color:#d97706;font-size:11px;">—</span>'}</td><td style="text-align:center;">${hr?'<span style="color:#166534;font-size:15px;">✓</span>':'<span style="color:var(--text-muted);font-size:11px;">—</span>'}</td><td style="text-align:center;">${hc?'<span style="color:#0f766e;font-size:15px;">✓</span>':'<span style="color:var(--text-muted);font-size:11px;">—</span>'}</td></tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>`;
    }).join('')}

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:var(--navy);">Select Controls to Submit for Review</div>
        <div style="font-size:11px;color:var(--text-muted);">${selectedForSubmit.length} selected of ${submitEligibleControls.length} eligible</div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">Controls with status <strong>Not Started</strong> are excluded from submission by default and cannot be submitted.</div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="btn btn-secondary btn-sm" onclick="setAllControlSubmitSelections(true)">Select all eligible</button>
        <button class="btn btn-secondary btn-sm" onclick="setAllControlSubmitSelections(false)">Clear selection</button>
      </div>
      <div class="table-scroll">
        <table class="control-table">
          <thead><tr><th style="width:42px;"></th><th style="width:90px;">Control</th><th>Name</th><th style="width:130px;">Status</th><th style="width:90px;">Design</th></tr></thead>
          <tbody>
            ${controls.map(c => {
              const st = (state.controlStatus[c.id] || {}).status || 'Not Started';
              const canSubmit = st !== 'Not Started';
              const checked = canSubmit && !!state._controlSubmitSelection[c.id];
              return `<tr>
                <td><input type="checkbox" ${checked ? 'checked' : ''} ${canSubmit ? '' : 'disabled'} onchange="setControlSubmitSelection('${c.id.replace(/'/g,"\\'")}',this.checked)" style="accent-color:var(--teal);"></td>
                <td><span class="control-id">${c.id}</span></td>
                <td style="font-size:12px;color:var(--navy);">${escapeHTML(c.n)}</td>
                <td>${chipHTML(st)}</td>
                <td style="font-size:11px;color:${isDesigned(c)?'#166534':'#d97706'};font-weight:700;">${isDesigned(c)?'Ready':'Missing'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${notStartedCount ? `<div style="font-size:11px;color:#b45309;margin-top:8px;">${notStartedCount} control${notStartedCount===1?'':'s'} are Not Started and excluded.</div>` : ''}
    </div>

    <div style="background:white;border:2px solid var(--navy);border-radius:12px;padding:24px;margin-top:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:20px;">📤</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--navy);">Submit Design for Policy Owner Review</div>
          <div style="font-size:12px;color:var(--text-muted);">Your design package is routed for review. Asset-owner attestation remains separate in Assets &amp; SSP.</div>
        </div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:11px;color:var(--text-muted);">
        Submitter is captured from your active user profile: <strong>${escapeHTML(((state.users||[]).find(u=>u.id===state.currentUserId)||{}).name || 'Current user')}</strong>.
      </div>
      <div style="margin-bottom:14px;">
        <label class="form-label" style="font-size:11px;">Notes for Policy Owner (optional)</label>
        <textarea class="form-input" id="designSubmitNotes" rows="2" style="font-size:12px;resize:vertical;" placeholder="Any context, caveats, or open items the policy owner should be aware of…">${escapeHTML(state.controlDesignSubmission?.notes||'')}</textarea>
      </div>
      ${state.controlDesignSubmission?.submittedAt ? `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#166534;">
        ✅ Last submitted: ${state.controlDesignSubmission.submittedAt} by ${escapeHTML(state.controlDesignSubmission.submitterName||'—')} — ${state.controlDesignSubmission.designedCount} of ${state.controlDesignSubmission.totalCount} controls designed.
      </div>` : ''}
    </div>`;
}

function submitControlDesign() {
  if (blockActionIfDemoPlaceholders()) return;
  clearScopedUndoStack('control design submit');
  const currentUser = state.currentUserId ? (state.users||[]).find(u=>u.id===state.currentUserId) : null;
  const name = (currentUser && currentUser.name) ? currentUser.name : 'Control Owner';
  const title = (currentUser && currentUser.title) ? currentUser.title : '';
  const notes = document.getElementById('designSubmitNotes')?.value.trim() || '';

  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  const submitEligibleControls = controls.filter(c => ((state.controlStatus[c.id]||{}).status || 'Not Started') !== 'Not Started');
  const selectedControls = submitEligibleControls.filter(c => !!(state._controlSubmitSelection || {})[c.id]);
  if (!selectedControls.length) {
    showToast('Select at least one eligible control to submit. Not Started controls are excluded.', true);
    return;
  }
  const designedControls = controls.filter(c => isControlDesigned(c.id));
  const fullyMappedReqs = controls.filter(c => {
    const cov = getControlRequirementCoverage(c);
    return cov.targetCount > 0 && cov.satisfiedCount >= cov.targetCount;
  });

  const myControls  = currentUser ? selectedControls.filter(c=>(state.controlOwners[c.id]||{}).name===currentUser.name) : selectedControls;
  const famsInvolved = [...new Set(myControls.map(c=>c.f).filter(Boolean))];
  const policyOwnerNames = [...new Set(famsInvolved.map(fam=>(state.domainOwners[fam]||{}).name).filter(Boolean))];
  const recipientLabel = policyOwnerNames.length ? policyOwnerNames.join(', ') : 'Policy Owner';

  state.controlDesignSubmission = {
    submitterName: name, submitterTitle: title, notes: notes,
    submittedAt: new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
    designedCount: designedControls.length, totalCount: controls.length,
    fullyMappedReqCount: fullyMappedReqs.length, submittedControlCount: selectedControls.length,
    timestamp: Date.now(), routedTo: policyOwnerNames,
  };

  if (!state.controlReviewQueue) state.controlReviewQueue = [];
  myControls.forEach(function(c) {
    const ex = state.controlReviewQueue.find(r=>r.controlId===c.id);
    if (ex) { ex.status='Design Submitted'; ex.submittedAt=new Date().toISOString(); ex.submittedBy=name; }
    else state.controlReviewQueue.push({ controlId:c.id, family:c.f, policyOwner:(state.domainOwners[c.f]||{}).name||'', submittedBy:name, submittedAt:new Date().toISOString(), status:'Design Submitted' });
  });

  addAuditEntry('control', null, 'Control design submitted by ' + name + ': ' + selectedControls.length + ' selected for review (' + designedControls.length + '/' + controls.length + ' designed, ' + fullyMappedReqs.length + '/' + controls.length + ' fully mapped), routed to ' + recipientLabel);
  showToast('✅ Submitted ' + selectedControls.length + ' selected control' + (selectedControls.length===1?'':'s') + ' to ' + recipientLabel + '.');
  markDirty();
  renderControlStep4();
}

function setControlSubmitSelection(ctrlId, checked) {
  if (!state._controlSubmitSelection) state._controlSubmitSelection = {};
  const st = (state.controlStatus[ctrlId] || {}).status || 'Not Started';
  if (st === 'Not Started') {
    state._controlSubmitSelection[ctrlId] = false;
    showToast('Not Started controls cannot be submitted.', true);
  } else {
    state._controlSubmitSelection[ctrlId] = !!checked;
  }
  markDirty();
  renderControlStep4();
}

function setAllControlSubmitSelections(checked) {
  if (!state._controlSubmitSelection) state._controlSubmitSelection = {};
  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  controls.forEach(function(c) {
    const st = (state.controlStatus[c.id] || {}).status || 'Not Started';
    state._controlSubmitSelection[c.id] = st === 'Not Started' ? false : !!checked;
  });
  markDirty();
  renderControlStep4();
}

// Stub retained for backward compatibility (referenced by old snapshots)
function submitControlImplementation() { submitControlDesign(); }
function updateCtrlSubmitBtn() {}
function saveAttestDraft() {}

function setControlField(id, field, value) {
  if (!state.controlStatus[id]) state.controlStatus[id] = {};
  state.controlStatus[id][field] = value;
}

// ============================================================
// ASSET OWNER TAB
// ============================================================
// ─── ASSET TYPES ─────────────────────────────────────────────────────────────
// 2-tier hierarchy. Coverage stored as named keys (e.g. 'app_saas', 'infra_cloud_iaas').
const ASSET_TYPES = [
  { category: 'Application', types: [
    { key: 'app_internal_ext',   label: 'Internally Developed (Internet-Facing)' },
    { key: 'app_internal_int',   label: 'Internally Developed (Internal/Intranet)' },
    { key: 'app_cots_ext',       label: 'COTS (Internet-Facing)' },
    { key: 'app_cots_int',       label: 'COTS (Internal/Intranet)' },
    { key: 'app_saas',           label: 'SaaS' },
  ]},
  { category: 'Infrastructure', types: [
    { key: 'infra_onprem',       label: 'On-Prem Server' },
    { key: 'infra_network',      label: 'Network Device' },
    { key: 'infra_cloud_iaas',   label: 'Cloud IaaS' },
    { key: 'infra_cloud_paas',   label: 'Cloud PaaS' },
    { key: 'infra_storage',      label: 'Storage / Data Store' },
  ]},
  { category: 'Endpoint', types: [
    { key: 'endpoint_windows',   label: 'Workstation (Windows)' },
    { key: 'endpoint_mac_linux', label: 'Workstation (macOS/Linux)' },
    { key: 'endpoint_mobile',    label: 'Mobile Device' },
    { key: 'endpoint_vdi',       label: 'Virtual Desktop (VDI)' },
  ]},
  { category: 'Identity & Credential', types: [
    { key: 'iam_idp',            label: 'Identity Provider / SSO' },
    { key: 'iam_service_acct',   label: 'Service Account / Non-human Identity' },
  ]},
  { category: 'Development & Operations', types: [
    { key: 'devops_cicd',        label: 'CI/CD Pipeline' },
    { key: 'devops_repo',        label: 'Code Repository' },
    { key: 'devops_container',   label: 'Container Orchestration (Kubernetes)' },
  ]},
];
const SSP_STATUSES = ['Complies','Partially Complies','Does Not Comply','Not Applicable','Inherited'];
const SSP_STATUS_COLORS = {'Complies':'var(--green)','Partially Complies':'var(--amber)','Does Not Comply':'var(--red)','Not Applicable':'var(--slate)','Inherited':'var(--blue)'};

// Process categories — each maps to a set of control families for SSP coverage
const PROCESS_CATEGORIES = [
  { id:'risk-mgmt',     label:'Risk Management',                    families:['RA','CA','PL'] },
  { id:'vuln-mgmt',     label:'Vulnerability Management',           families:['RA','SI','CA'] },
  { id:'iam',           label:'Identity & Access Management',       families:['AC','IA','PS'] },
  { id:'config-change', label:'Configuration & Change Management',  families:['CM','SA','MA'] },
  { id:'supply-chain',  label:'Third-Party / Supply Chain Mgmt',    families:['SA','SR','CA'] },
  { id:'incident-resp', label:'Incident Response',                  families:['IR','AU','SI'] },
  { id:'bcp',           label:'Business Continuity & Contingency',  families:['CP','MA','PE'] },
  { id:'awareness',     label:'Security Awareness & Training',      families:['AT','PS','PL'] },
];

function userCanApproveAssetTypeRequests() {
  if (!state.currentUserId) return true; // admin mode
  var user = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  if (!user) return false;
  var personIds = state._currentPersonIds || [user.id];
  var roleSet = [];
  personIds.forEach(function(pid) {
    var rec = (state.users || []).find(function(u) { return u.id === pid; });
    if (!rec) return;
    var recRoles = (rec.roles && rec.roles.length) ? rec.roles : [rec.role];
    recRoles.forEach(function(r) { if (r && roleSet.indexOf(r) === -1) roleSet.push(r); });
  });
  if (roleSet.indexOf('ciso') !== -1) return true;
  return (user.name || '').trim().toLowerCase() === (state.programOwner || '').trim().toLowerCase();
}

function ensureAssetTypeMetadata() {
  if (!state.customAssetTypeGroups) state.customAssetTypeGroups = {};
  if (!state.customAssetTypeHeaders) state.customAssetTypeHeaders = [];
  if (!state.removedBuiltInAssetTypeKeys) state.removedBuiltInAssetTypeKeys = [];
  if (!state.removedBuiltInAssetTypeGroups) state.removedBuiltInAssetTypeGroups = [];
  (state.customAssetTypes || []).forEach(function(t) {
    if (!state.customAssetTypeGroups[t]) state.customAssetTypeGroups[t] = 'Custom';
  });
  Object.keys(state.customAssetTypeGroups).forEach(function(t) {
    if (!(state.customAssetTypes || []).includes(t)) delete state.customAssetTypeGroups[t];
  });
  var builtInKeys = [];
  ASSET_TYPES.forEach(function(cat) {
    cat.types.forEach(function(t) { builtInKeys.push(t.key); });
  });
  state.removedBuiltInAssetTypeKeys = (state.removedBuiltInAssetTypeKeys || []).filter(function(k) {
    return builtInKeys.indexOf(k) !== -1;
  });
  var builtInGroups = ASSET_TYPES.map(function(cat) { return cat.category; });
  state.removedBuiltInAssetTypeGroups = (state.removedBuiltInAssetTypeGroups || []).filter(function(g) {
    return builtInGroups.indexOf(g) !== -1;
  });
}

function findBuiltInAssetType(typeName) {
  var name = String(typeName || '').trim().toLowerCase();
  if (!name) return null;
  for (var i = 0; i < ASSET_TYPES.length; i++) {
    for (var j = 0; j < ASSET_TYPES[i].types.length; j++) {
      var t = ASSET_TYPES[i].types[j];
      if (String(t.label || '').trim().toLowerCase() === name) {
        return { category: ASSET_TYPES[i].category, key: t.key, label: t.label };
      }
    }
  }
  return null;
}

function getActiveAssetTypeCatalog() {
  ensureAssetTypeMetadata();
  var removed = state.removedBuiltInAssetTypeKeys || [];
  return ASSET_TYPES.map(function(cat) {
    return {
      category: cat.category,
      types: cat.types.filter(function(t) { return removed.indexOf(t.key) === -1; })
    };
  }).filter(function(cat) { return cat.types.length > 0; });
}

function getAllAssetTypeGroups() {
  ensureAssetTypeMetadata();
  var removedBuiltInGroups = state.removedBuiltInAssetTypeGroups || [];
  var standard = ASSET_TYPES.map(function(cat) { return cat.category; }).filter(function(g) {
    return removedBuiltInGroups.indexOf(g) === -1;
  });
  var customHeaders = (state.customAssetTypeHeaders || []).filter(function(h){ return h && h.trim(); });
  var fromTypes = Object.values(state.customAssetTypeGroups || {}).filter(function(h){ return h && h.trim(); });
  var all = standard.concat(customHeaders).concat(fromTypes).concat(['Custom']);
  return all.filter(function(v, i, arr){ return arr.indexOf(v) === i; });
}

function applyAssetTypeAdd(typeName, groupName) {
  var name = (typeName || '').trim();
  if (!name) return false;
  ensureAssetTypeMetadata();
  var builtIn = findBuiltInAssetType(name);
  if (builtIn) {
    var removedIdx = (state.removedBuiltInAssetTypeKeys || []).indexOf(builtIn.key);
    if (removedIdx === -1) return false;
    state.removedBuiltInAssetTypeKeys.splice(removedIdx, 1);
    state.removedBuiltInAssetTypeGroups = (state.removedBuiltInAssetTypeGroups || []).filter(function(g) {
      return g !== builtIn.category;
    });
    return true;
  }
  var all = getAllAssetTypes().map(function(t){ return String(t).toLowerCase(); });
  if (all.indexOf(name.toLowerCase()) !== -1) return false;
  if (!state.customAssetTypes) state.customAssetTypes = [];
  state.customAssetTypes.push(name);
  state.customAssetTypeGroups[name] = (groupName || 'Custom').trim() || 'Custom';
  return true;
}

function applyAssetTypeDelete(typeName) {
  var name = (typeName || '').trim();
  if (!name) return false;
  ensureAssetTypeMetadata();
  var wasRemoved = false;
  var customIdx = (state.customAssetTypes || []).indexOf(name);
  if (customIdx !== -1) {
    state.customAssetTypes = (state.customAssetTypes || []).filter(function(t){ return t !== name; });
    delete state.customAssetTypeGroups[name];
    wasRemoved = true;
  } else {
    var builtIn = findBuiltInAssetType(name);
    if (!builtIn) return false;
    if ((state.removedBuiltInAssetTypeKeys || []).indexOf(builtIn.key) !== -1) return false;
    state.removedBuiltInAssetTypeKeys.push(builtIn.key);
    wasRemoved = true;
    Object.keys(state.controlStatus || {}).forEach(function(cid) {
      if (state.controlStatus[cid] && state.controlStatus[cid].assetCoverage) {
        delete state.controlStatus[cid].assetCoverage[builtIn.key];
      }
    });
  }
  Object.keys(state.controlStatus || {}).forEach(function(cid) {
    if (state.controlStatus[cid] && state.controlStatus[cid].assetCoverage) {
      delete state.controlStatus[cid].assetCoverage['custom_' + name];
    }
  });
  return wasRemoved;
}

function applyAssetTypeChangeDirect(action, typeName, reason, groupName) {
  if (!userCanApproveAssetTypeRequests()) { showToast('Only admin/program owner can edit asset types directly.', true); return; }
  var cleanType = (typeName || '').trim();
  var cleanReason = (reason || '').trim();
  var normalizedAction = action === 'delete' ? 'delete' : 'add';
  if (!cleanType) { showToast('Asset type name is required.', true); return; }
  if (!cleanReason) { showToast('Please provide rationale for audit traceability.', true); return; }
  var changed = normalizedAction === 'add' ? applyAssetTypeAdd(cleanType, groupName) : applyAssetTypeDelete(cleanType);
  if (!changed) { showToast('No change applied (already exists or already removed).', true); return; }
  addAuditEntry('program', 'asset-types', 'Asset type ' + normalizedAction + ' approved directly by ' + getCurrentActorName() + ' for "' + cleanType + '": ' + cleanReason);
  markDirty();
  showToast('Asset type ' + (normalizedAction === 'add' ? 'added' : 'removed') + '.');
  renderAssetTypeLibrary();
}

function removeAssetTypeHeader(headerName) {
  var clean = (headerName || '').trim();
  if (!clean) return;
  if (clean === 'Custom') { showToast('The "Custom" header cannot be removed.', true); return; }
  ensureAssetTypeMetadata();
  var hasAssignedCustomTypes = Object.keys(state.customAssetTypeGroups || {}).some(function(k) {
    return (state.customAssetTypes || []).indexOf(k) !== -1 && state.customAssetTypeGroups[k] === clean;
  });
  var hasAssignedBuiltInTypes = getActiveAssetTypeCatalog().some(function(cat) {
    return cat.category === clean && cat.types.length > 0;
  });
  if (hasAssignedCustomTypes || hasAssignedBuiltInTypes) {
    showToast('Cannot delete this header while asset types are assigned to it. Reassign or remove those types first.', true);
    return;
  }
  var isBuiltInGroup = ASSET_TYPES.some(function(cat){ return cat.category === clean; });
  if (isBuiltInGroup) {
    if ((state.removedBuiltInAssetTypeGroups || []).indexOf(clean) === -1) {
      state.removedBuiltInAssetTypeGroups.push(clean);
    }
  } else {
    state.customAssetTypeHeaders = (state.customAssetTypeHeaders || []).filter(function(h){ return h !== clean; });
  }
  markDirty();
  renderAssetTypeLibrary();
}

function submitAssetTypeRequest(action, typeName, reason, groupName) {
  var normalizedAction = action === 'delete' ? 'delete' : 'add';
  var cleanType = (typeName || '').trim();
  var cleanReason = (reason || '').trim();
  var groupNameInput = groupName || (document.getElementById('assetTypeReqGroup') || {}).value || 'Custom';
  var cleanGroup = (groupNameInput || 'Custom').trim() || 'Custom';
  if (!cleanType) { showToast('Asset type name is required.', true); return; }
  if (!cleanReason) { showToast('Please provide a rationale for audit purposes.', true); return; }
  if (!state.assetTypeRequests) state.assetTypeRequests = [];
  var actor = getCurrentActorName();
  var request = {
    id: 'atr_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
    action: normalizedAction,
    typeName: cleanType,
    groupName: cleanGroup,
    reason: cleanReason,
    requestedBy: actor,
    requestedAt: new Date().toISOString(),
    status: 'Pending',
    reviewedBy: '',
    reviewedAt: '',
    reviewReason: ''
  };
  state.assetTypeRequests.push(request);
  addAuditEntry('program', 'asset-types', 'Asset type ' + normalizedAction + ' requested by ' + actor + ' for "' + cleanType + '"' + (normalizedAction === 'add' ? ' in group "' + cleanGroup + '"' : '') + ': ' + cleanReason);
  markDirty();
  showToast('Asset type ' + normalizedAction + ' request submitted for program owner approval.');
  renderAssetTypeLibrary();
}

function requestOrApplyAssetTypeChange(action, typeName, defaultGroupName) {
  var cleanType = (typeName || '').trim();
  if (!cleanType) { showToast('Asset type name is required.', true); return; }
  var reasonPrompt = action === 'delete'
    ? 'Deletion rationale (required for audit trail):'
    : 'Rationale for adding/restoring this type (required):';
  var reason = window.prompt(reasonPrompt, '');
  if (!reason || !reason.trim()) {
    showToast('Rationale is required.', true);
    return;
  }
  if (userCanApproveAssetTypeRequests()) applyAssetTypeChangeDirect(action, cleanType, reason.trim(), defaultGroupName || 'Custom');
  else submitAssetTypeRequest(action, cleanType, reason.trim(), defaultGroupName || 'Custom');
}

function reviewAssetTypeRequest(requestId, decision) {
  if (!userCanApproveAssetTypeRequests()) { showToast('Only the program owner can approve these requests.', true); return; }
  var req = (state.assetTypeRequests || []).find(function(r){ return r.id === requestId; });
  if (!req) return;
  var reason = window.prompt((decision === 'Approved' ? 'Approval' : 'Rejection') + ' rationale (required for audit trail):', '');
  if (!reason || !reason.trim()) { showToast('Decision rationale is required.', true); return; }
  req.status = decision;
  req.reviewReason = reason.trim();
  req.reviewedBy = getCurrentActorName();
  req.reviewedAt = new Date().toISOString();
  if (decision === 'Approved') {
    var applied = req.action === 'add' ? applyAssetTypeAdd(req.typeName, req.groupName || 'Custom') : applyAssetTypeDelete(req.typeName);
    if (!applied) {
      req.status = 'Rejected';
      req.reviewReason = 'Auto-rejected: requested change could not be applied (already exists/removed). ' + req.reviewReason;
      addAuditEntry('program', 'asset-types', 'Asset type request auto-rejected during apply: ' + req.action + ' "' + req.typeName + '"');
      showToast('Request could not be applied and was auto-rejected.', true);
    }
  }
  addAuditEntry('program', 'asset-types', 'Asset type request ' + req.id + ' marked ' + req.status + ' by ' + req.reviewedBy + ': ' + req.reviewReason);
  markDirty();
  renderAssetTypeLibrary();
}

function renderAssetTypeLibrary() {
  var body = document.getElementById('asset-type-library-body');
  if (!body) return;
  ensureAssetTypeMetadata();
  var canApprove = userCanApproveAssetTypeRequests();
  var custom = (state.customAssetTypes || []).slice().sort();
  var activeCatalog = getActiveAssetTypeCatalog();
  var activeBuiltInRows = [];
  activeCatalog.forEach(function(cat) {
    cat.types.forEach(function(t) {
      activeBuiltInRows.push({ label: t.label, group: cat.category, source: 'Default', isCustom: false });
    });
  });
  var activeTypeRows = activeBuiltInRows.concat(custom.map(function(t) {
    return { label: t, group: (state.customAssetTypeGroups || {})[t] || 'Custom', source: 'Custom', isCustom: true };
  }));
  var retiredBuiltIns = [];
  (state.removedBuiltInAssetTypeKeys || []).forEach(function(key) {
    ASSET_TYPES.forEach(function(cat) {
      cat.types.forEach(function(t) {
        if (t.key === key) retiredBuiltIns.push({ label: t.label, group: cat.category });
      });
    });
  });
  var groups = getAllAssetTypeGroups();
  var requests = (state.assetTypeRequests || []).slice().sort(function(a, b) {
    return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
  });
  var pendingCount = requests.filter(function(r){ return r.status === 'Pending'; }).length;

  body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">'
    + '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">Default types (active)</div><div style="font-size:24px;font-weight:800;color:#1d4ed8;">' + activeBuiltInRows.length + '</div></div>'
    + '<div style="background:#f0f9ff;border:1px solid #7dd3fc;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#0369a1;text-transform:uppercase;">Custom types</div><div style="font-size:24px;font-weight:800;color:#0369a1;">' + custom.length + '</div></div>'
    + '<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#c2410c;text-transform:uppercase;">Retired default types</div><div style="font-size:24px;font-weight:800;color:#c2410c;">' + retiredBuiltIns.length + '</div></div>'
    + '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;">Pending requests</div><div style="font-size:24px;font-weight:800;color:#92400e;">' + pendingCount + '</div></div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;">'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:14px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Request Asset Type Change</div>'
    + '<div style="display:grid;grid-template-columns:120px 1fr 180px;gap:8px;margin-bottom:8px;">'
    + '<select id="assetTypeReqAction" class="form-select" style="font-size:12px;"><option value="add">Add type</option><option value="delete">Delete type</option></select>'
    + '<input id="assetTypeReqName" class="form-input" style="font-size:12px;" placeholder="Asset type name (e.g. OT Device, Mainframe)">'
    + '<select id="assetTypeReqGroup" class="form-select" style="font-size:12px;">' + groups.map(function(g){ return '<option>' + escapeHTML(g) + '</option>'; }).join('') + '</select>'
    + '</div>'
    + '<textarea id="assetTypeReqReason" class="form-input" rows="2" style="font-size:12px;resize:vertical;" placeholder="Why is this add/delete needed?"></textarea>'
    + '<div style="margin-top:8px;">'
    + (canApprove
      ? '<button class="btn btn-primary btn-sm" onclick="(function(){var a=document.getElementById(\'assetTypeReqAction\').value;var n=document.getElementById(\'assetTypeReqName\').value;var r=document.getElementById(\'assetTypeReqReason\').value;var g=document.getElementById(\'assetTypeReqGroup\').value;applyAssetTypeChangeDirect(a,n,r,g);})()">Apply Change</button>'
      : '<button class="btn btn-secondary btn-sm" onclick="(function(){var a=document.getElementById(\'assetTypeReqAction\').value;var n=document.getElementById(\'assetTypeReqName\').value;var r=document.getElementById(\'assetTypeReqReason\').value;var g=document.getElementById(\'assetTypeReqGroup\').value;submitAssetTypeRequest(a,n,r,g);})()">Request Program Owner Approval</button>')
    + '</div></div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:14px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">All Active Asset Types</div>'
    + (activeTypeRows.length
      ? '<div class="table-scroll"><table class="control-table"><thead><tr><th>Type</th><th style="width:90px;">Source</th><th style="width:200px;">Header Group</th><th style="width:110px;">Actions</th></tr></thead><tbody>'
        + activeTypeRows.map(function(row){
          var selected = row.group || 'Custom';
          var safeType = row.label.replace(/'/g,"\\'");
          var groupCell = '<span style="font-size:12px;color:var(--text-muted);">' + escapeHTML(selected) + '</span>';
          if (row.isCustom && canApprove) {
            groupCell = '<select class="form-select" style="font-size:12px;" onchange="state.customAssetTypeGroups[\'' + safeType + '\']=this.value;markDirty();renderAssetTypeLibrary();">' + groups.map(function(g){ return '<option' + (selected===g?' selected':'') + '>' + escapeHTML(g) + '</option>'; }).join('') + '</select>';
          }
          return '<tr><td style="font-size:12px;color:var(--navy);font-weight:600;">' + escapeHTML(row.label) + '</td>'
            + '<td style="font-size:11px;color:#334155;font-weight:700;text-transform:uppercase;">' + escapeHTML(row.source) + '</td>'
            + '<td>' + groupCell + '</td>'
            + '<td><button class="btn btn-sm" style="font-size:10px;padding:3px 8px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;" onclick="requestOrApplyAssetTypeChange(\'delete\',\'' + safeType + '\',\'' + selected.replace(/'/g,"\\'") + '\')">Delete</button></td></tr>';
        }).join('')
        + '</tbody></table></div>'
      : '<div style="font-size:12px;color:var(--text-muted);">No active asset types available.</div>')
    + '<div style="margin-top:10px;border-top:1px dashed var(--border);padding-top:10px;">'
    + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">Retired Default Types</div>'
    + (retiredBuiltIns.length
      ? '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + retiredBuiltIns.map(function(item){
          var safeLabel = item.label.replace(/'/g,"\\'");
          var safeGroup = item.group.replace(/'/g,"\\'");
          return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 8px;border:1px solid #fed7aa;border-radius:999px;background:#fff7ed;color:#9a3412;">'
            + escapeHTML(item.label)
            + '<button style="border:none;background:none;color:#0369a1;cursor:pointer;font-size:11px;font-weight:700;" onclick="requestOrApplyAssetTypeChange(\'add\',\'' + safeLabel + '\',\'' + safeGroup + '\')">Restore</button>'
            + '</span>';
        }).join('') + '</div>'
      : '<div style="font-size:11px;color:var(--text-muted);">No retired default types.</div>')
    + '</div>'
    + '<div style="margin-top:10px;border-top:1px dashed var(--border);padding-top:10px;">'
    + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">Header Groups</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">These are the overarching section headers used in control asset coverage.</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">'
    + groups.map(function(g){
      var canDelete = g !== 'Custom';
      var safeGroup = g.replace(/'/g,"\\'");
      return '<span style="font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:999px;background:#f8fafc;color:#334155;">' + escapeHTML(g)
        + (canApprove && canDelete ? '<button style="margin-left:6px;border:none;background:none;color:#b91c1c;cursor:pointer;font-size:11px;" onclick="removeAssetTypeHeader(\'' + safeGroup + '\')">✕</button>' : '')
        + '</span>';
    }).join('')
    + '</div>'
    + (canApprove
      ? '<div style="display:flex;gap:8px;"><input id="newAssetTypeHeader" class="form-input" style="font-size:12px;" placeholder="Add header group (e.g. Operational Technology)"><button class="btn btn-secondary btn-sm" onclick="(function(){var v=(document.getElementById(\'newAssetTypeHeader\').value||\'\').trim();if(!v)return;var all=getAllAssetTypeGroups().map(function(x){return x.toLowerCase();});if(all.includes(v.toLowerCase())){showToast(\'Header already exists.\',true);return;}if(!state.customAssetTypeHeaders)state.customAssetTypeHeaders=[];state.customAssetTypeHeaders.push(v);markDirty();renderAssetTypeLibrary();})()">+ Add Header</button></div>'
      : '<div style="font-size:11px;color:var(--text-muted);">Only program owner/admin can edit header groups.</div>')
    + '</div>'
    + '</div></div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:14px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Approval Queue & History</div>'
    + (requests.length ? '<div class="table-scroll"><table class="control-table"><thead><tr><th style="width:90px;">Action</th><th>Type</th><th>Requested By</th><th>Status</th><th>Reasoning</th>' + (canApprove ? '<th style="width:170px;">Decision</th>' : '<th style="width:120px;">Reviewed By</th>') + '</tr></thead><tbody>'
      + requests.map(function(r){
        var statusColor = r.status === 'Approved' ? '#166534' : r.status === 'Rejected' ? '#b45309' : '#92400e';
        return '<tr>'
          + '<td style="font-size:11px;text-transform:uppercase;font-weight:700;color:#334155;">' + escapeHTML(r.action) + '</td>'
          + '<td style="font-size:12px;color:var(--navy);font-weight:600;">' + escapeHTML(r.typeName) + '</td>'
          + '<td style="font-size:11px;color:var(--text-muted);">' + escapeHTML(r.requestedBy || '—') + '<div>' + escapeHTML((r.requestedAt || '').slice(0,10)) + '</div></td>'
          + '<td style="font-size:11px;font-weight:700;color:' + statusColor + ';">' + escapeHTML(r.status) + '</td>'
          + '<td style="font-size:11px;color:var(--text-muted);line-height:1.45;"><div><strong>Request:</strong> ' + escapeHTML(r.reason || '—') + '</div>' + (r.reviewReason ? '<div style="margin-top:4px;"><strong>Decision:</strong> ' + escapeHTML(r.reviewReason) + '</div>' : '') + '</td>'
          + (canApprove
            ? '<td>' + (r.status === 'Pending'
              ? '<button class="btn btn-sm" style="background:#166534;color:white;border:none;font-size:10px;padding:4px 7px;margin-right:6px;" onclick="reviewAssetTypeRequest(\'' + r.id + '\',\'Approved\')">Approve</button><button class="btn btn-sm" style="background:#b45309;color:white;border:none;font-size:10px;padding:4px 7px;" onclick="reviewAssetTypeRequest(\'' + r.id + '\',\'Rejected\')">Reject</button>'
              : '<span style="font-size:11px;color:var(--text-muted);">' + escapeHTML(r.reviewedBy || '—') + '</span>') + '</td>'
            : '<td style="font-size:11px;color:var(--text-muted);">' + escapeHTML(r.reviewedBy || '—') + '</td>')
          + '</tr>';
      }).join('') + '</tbody></table></div>'
      : '<div style="font-size:12px;color:var(--text-muted);">No requests submitted yet.</div>')
    + '</div>'
    + '<div style="margin-top:12px;"><button class="btn btn-secondary btn-sm" onclick="goToAssetWorkspace()">Open Asset Workspace →</button></div>';
}

function getAssetOwnerProfiles() {
  var users = (state.users || []).filter(function(u) {
    var roles = (u.roles && u.roles.length) ? u.roles : [u.role];
    return roles.indexOf('asset-owner') !== -1;
  });
  return users.sort(function(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

function onAssetLibraryOwnerChange() {
  var sel = document.getElementById('assetLibOwnerSelect');
  var newWrap = document.getElementById('assetLibOwnerNewWrap');
  if (!sel) return;
  if (newWrap) newWrap.style.display = sel.value === '__new__' ? '' : 'none';
}

function createAssetFromLibrary() {
  var name = (document.getElementById('assetLibNewName') || {}).value || '';
  var type = (document.getElementById('assetLibNewType') || {}).value || '';
  var ownerSel = (document.getElementById('assetLibOwnerSelect') || {}).value || '';
  var newOwnerName = (document.getElementById('assetLibOwnerNewName') || {}).value || '';
  var newOwnerTitle = (document.getElementById('assetLibOwnerNewTitle') || {}).value || '';
  var newOwnerEmail = (document.getElementById('assetLibOwnerNewEmail') || {}).value || '';
  name = name.trim();
  newOwnerName = newOwnerName.trim();
  newOwnerTitle = newOwnerTitle.trim();
  newOwnerEmail = newOwnerEmail.trim();
  if (!name) { showToast('Asset name is required.', true); return; }
  if (!type) { showToast('Asset type is required.', true); return; }

  var ownerProfiles = getAssetOwnerProfiles();
  var selectedOwner = ownerProfiles.find(function(u) { return u.id === ownerSel; }) || null;
  var ownerName = selectedOwner ? (selectedOwner.name || '') : '';
  var ownerId = selectedOwner ? selectedOwner.id : '';
  var ownerEmail = selectedOwner ? (selectedOwner.email || '') : '';
  if (ownerSel === '__new__') {
    if (!newOwnerName) { showToast('New asset owner name is required.', true); return; }
    if (!newOwnerTitle) { showToast('New asset owner title/role is required.', true); return; }
    if (!newOwnerEmail) { showToast('New asset owner email is required.', true); return; }
    if (!state.users) state.users = [];
    var existingByName = (state.users || []).find(function(u) {
      return String(u.name || '').trim().toLowerCase() === newOwnerName.toLowerCase();
    });
    if (existingByName) {
      if (!existingByName.email) existingByName.email = newOwnerEmail;
      if (!existingByName.note) existingByName.note = newOwnerTitle;
      if (!existingByName.roles) existingByName.roles = [existingByName.role];
      if (existingByName.roles.indexOf('asset-owner') === -1) existingByName.roles.push('asset-owner');
      if (!existingByName.role) existingByName.role = 'asset-owner';
      if (!existingByName.assets) existingByName.assets = [];
      ownerId = existingByName.id;
      ownerName = existingByName.name;
      ownerEmail = existingByName.email || newOwnerEmail;
    } else {
      var newUser = {
        id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: newOwnerName,
        email: newOwnerEmail,
        role: 'asset-owner',
        roles: ['asset-owner'],
        families: [],
        controls: [],
        assets: [],
        note: newOwnerTitle
      };
      state.users.push(newUser);
      ownerId = newUser.id;
      ownerName = newUser.name;
      ownerEmail = newUser.email;
    }
  }

  if (!state.assets) state.assets = [];
  var newAsset = { id: 'asset-' + Date.now(), name: name, type: type, owner: ownerName, ownerId: ownerId, ownerEmail: ownerEmail, description: '' };
  state.assets.push(newAsset);

  if (ownerId) {
    var user = (state.users || []).find(function(u) { return u.id === ownerId; });
    if (user) {
      if (!user.assets) user.assets = [];
      if (user.assets.indexOf(newAsset.id) === -1) user.assets.push(newAsset.id);
    }
  }

  addAuditEntry('asset', newAsset.id, 'Asset created from Asset Library: ' + newAsset.name + (ownerName ? ' (owner: ' + ownerName + ')' : ''));
  markDirty();
  showToast('Asset created: ' + newAsset.name);
  renderAssetLibrary();
  renderSidebarAssets();
}

function renderAssetLibrary() {
  var body = document.getElementById('asset-library-body');
  if (!body) return;
  var assets = (state.assets || []).slice().sort(function(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
  var ownerProfiles = getAssetOwnerProfiles();
  var sspLabel = state.privacyOverlay ? 'SPSP' : 'SSP';

  body.innerHTML = ''
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">'
    + '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">Assets in library</div><div style="font-size:24px;font-weight:800;color:#1d4ed8;">' + assets.length + '</div></div>'
    + '<div style="background:#ecfdf5;border:1px solid #86efac;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;">Asset owner profiles</div><div style="font-size:24px;font-weight:800;color:#166534;">' + ownerProfiles.length + '</div></div>'
    + '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;">Scope</div><div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:8px;">Global catalog (all assets)</div></div>'
    + '</div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Create New Asset</div>'
    + '<div style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px;margin-bottom:8px;">'
    + '<input id="assetLibNewName" class="form-input" style="font-size:12px;" placeholder="Asset name (e.g. HR Management System)">'
    + '<select id="assetLibNewType" class="form-select" style="font-size:12px;">' + buildAssetTypeOptions('') + '</select>'
    + '<select id="assetLibOwnerSelect" class="form-select" style="font-size:12px;" onchange="onAssetLibraryOwnerChange()">'
    + '<option value="">Unassigned</option>'
    + ownerProfiles.map(function(u){
      var roleTitle = (u.note || '').trim();
      var label = u.name + (roleTitle ? ' — ' + roleTitle : '') + (u.email ? ' (' + u.email + ')' : '');
      return '<option value="' + _esc(u.id) + '">' + _esc(label) + '</option>';
    }).join('')
    + '<option value="__new__">+ Create new asset owner profile…</option>'
    + '</select>'
    + '</div>'
    + '<div id="assetLibOwnerNewWrap" style="display:none;margin-bottom:8px;">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">'
    + '<input id="assetLibOwnerNewName" class="form-input" style="font-size:12px;" placeholder="Owner full name">'
    + '<input id="assetLibOwnerNewTitle" class="form-input" style="font-size:12px;" placeholder="Title / role">'
    + '<input id="assetLibOwnerNewEmail" class="form-input" type="email" style="font-size:12px;" placeholder="Email">'
    + '</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Creates a user profile in Users &amp; Roles with the Asset Owner role.</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;">'
    + '<button class="btn btn-primary btn-sm" onclick="createAssetFromLibrary()">Create Asset</button>'
    + '<button class="btn btn-secondary btn-sm" onclick="goToAssetWorkspace()">Open Asset Workspace →</button>'
    + '</div>'
    + '</div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:14px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Asset Catalog</div>'
    + (assets.length
      ? '<div class="table-scroll"><table class="control-table"><thead><tr><th>Asset</th><th>Type</th><th>Asset Owner</th><th style="width:90px;">' + sspLabel + '</th><th style="width:150px;">Actions</th></tr></thead><tbody>'
        + assets.map(function(a){
          var sign = (state.sspSignoffs || {})[a.id] || {};
          var status = sign.status || 'Not Started';
          return '<tr>'
            + '<td style="font-size:12px;font-weight:600;color:var(--navy);">' + _esc(a.name || 'Unnamed') + '</td>'
            + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(a.type || '—') + '</td>'
            + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(a.owner || 'Unassigned') + '</td>'
            + '<td style="font-size:11px;font-weight:700;color:#334155;">' + _esc(status) + '</td>'
            + '<td><button class="btn btn-secondary btn-sm" style="font-size:10px;padding:3px 8px;" onclick="openAssetWizardFromLibrary(\'' + a.id + '\')">Open Wizard</button></td>'
            + '</tr>';
        }).join('')
        + '</tbody></table></div>'
      : '<div style="font-size:12px;color:var(--text-muted);">No assets yet. Use "Create New Asset" to get started.</div>')
    + '</div>';
}

// ─── ASSET TAB DISPATCHER ────────────────────────────────────────────────────
function renderAssetTab() {
  var workspacePanel = document.getElementById('asset-workspace-panel');
  var assetLibraryPanel = document.getElementById('asset-library-panel');
  var libraryPanel = document.getElementById('asset-type-library-panel');
  var assetNav = document.getElementById('nav-asset');
  var assetLibNav = document.getElementById('nav-asset-library');
  var assetTypeLibNav = document.getElementById('nav-asset-type-library');
  if (assetNav) assetNav.classList.toggle('active', !state._assetTypeLibraryMode && !state._assetLibraryMode);
  if (assetLibNav) assetLibNav.classList.toggle('active', !!state._assetLibraryMode);
  if (assetTypeLibNav) assetTypeLibNav.classList.toggle('active', !!state._assetTypeLibraryMode);
  if (state._assetLibraryMode) {
    if (workspacePanel) workspacePanel.style.display = 'none';
    if (libraryPanel) libraryPanel.style.display = 'none';
    if (assetLibraryPanel) assetLibraryPanel.style.display = '';
    renderAssetLibrary();
    return;
  }
  if (state._assetTypeLibraryMode) {
    if (workspacePanel) workspacePanel.style.display = 'none';
    if (assetLibraryPanel) assetLibraryPanel.style.display = 'none';
    if (libraryPanel) libraryPanel.style.display = '';
    renderAssetTypeLibrary();
    return;
  }
  if (assetLibraryPanel) assetLibraryPanel.style.display = 'none';
  if (libraryPanel) libraryPanel.style.display = 'none';
  if (workspacePanel) workspacePanel.style.display = '';
  var listPanel = document.getElementById('asset-list-panel');
  var wizPanel  = document.getElementById('asset-wizard-panel');
  var hasLegacyPanels = !!(listPanel && wizPanel);
  var assetId   = state._selectedAssetId;
  var procId    = state._selectedProcessId;
  var scopedIds = getCurrentPersonAssetIds();
  if (scopedIds && assetId && scopedIds.indexOf(String(assetId)) === -1) {
    state._selectedAssetId = null;
    assetId = null;
  }
  if (!assetId && !procId && scopedIds && scopedIds.length === 1) {
    state._selectedAssetId = scopedIds[0];
    assetId = scopedIds[0];
  }
  var inAsset   = assetId && (state.assets||[]).find(function(a){ return String(a.id)===String(assetId); });
  var inProc    = procId  && (state.processes||[]).find(function(p){ return String(p.id)===String(procId); });

  if (hasLegacyPanels) {
    if (inAsset || inProc) {
      if (listPanel) listPanel.style.display = 'none';
      if (wizPanel)  wizPanel.style.display  = 'flex';
      var step = currentStep.asset || 1;
      for (var i = 1; i <= 3; i++) {
        var s = document.getElementById('asset-step-' + i);
        if (s) s.classList.toggle('active', i === step);
      }
      renderAssetWizardChrome();
      renderAssetStep(step);
    } else {
      state._selectedAssetId   = null;
      state._selectedProcessId = null;
      if (listPanel) listPanel.style.display = '';
      if (wizPanel)  wizPanel.style.display  = 'none';
      renderAssetHome();
    }
    return;
  }

  if (inAsset || inProc) {
    var step2 = currentStep.asset || 1;
    renderAssetWizardChrome();
    renderAssetStep(step2);
  } else {
    state._selectedAssetId = null;
    state._selectedProcessId = null;
    currentStep.asset = 1;
    renderAssetHome();
  }
}

function renderAssetStep(step) {
  var isProc = !!state._selectedProcessId;
  if (step===1) { isProc ? renderProcessSSPStep1() : renderAssetSSPStep1(); }
  if (step===2) { isProc ? renderProcessSSPStep2() : renderAssetSSPStep2(); }
  if (step===3) { isProc ? renderProcessSSPStep3() : renderAssetSSPStep3(); }
}

// ─── ASSET & PROCESS HOME ────────────────────────────────────────────────────
function renderAssetHome() {
  var body = document.getElementById('asset-list-body') || document.getElementById('asset-step-1-body');
  if (!body) return;

  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🏗️</div><div class="es-title">Program Not Ready Yet</div><p>The CISO must complete program setup before System Security Plans can be created.</p></div>';
    return;
  }

  // When logged in as an asset-owner, only show their assigned assets/processes
  var myAssetIds = getCurrentPersonAssetIds();
  var isAssetOwner = !!myAssetIds;

  var assets    = (state.assets    || []).filter(function(a){ return !myAssetIds || myAssetIds.includes(String(a.id)); });
  var processes = (state.processes || []).filter(function(p){ return !myAssetIds || myAssetIds.includes(String(p.id)); });
  var sspLabel  = state.privacyOverlay ? 'SPSP' : 'SSP';

  function sspRow(item, isProc) {
    var controls   = isProc ? getProcessSSPControls(item) : getAssetSSPControls(item);
    var attests    = (state.sspAttestations||{})[item.id] || {};
    var signoff    = (state.sspSignoffs||{})[item.id]     || {};
    var completed  = controls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    var pct        = controls.length ? Math.round(completed/controls.length*100) : 0;
    var status     = signoff.status==='Approved'?'Approved':signoff.status==='Submitted'?'Submitted':completed>0?'In Progress':'Not Started';
    var col        = status==='Approved'?'var(--green)':status==='Submitted'?'var(--blue)':status==='In Progress'?'var(--amber)':'var(--slate)';
    var enterFn    = isProc ? 'enterProcessSSP' : 'enterAssetSSP';
    var removeFn   = isProc ? 'removeProcess'   : 'removeAsset';
    var subtitle   = isProc
      ? ((PROCESS_CATEGORIES.find(function(c){return c.id===item.category;})||{}).label || item.category || 'Process')
      : _esc(item.type||'—');
    return '<tr>'
      + '<td style="font-weight:600;"><a href="#" onclick="event.preventDefault();' + enterFn + '(\'' + item.id + '\')" style="color:var(--teal);text-decoration:none;font-size:13px;" onmouseenter="this.style.textDecoration=\'underline\'" onmouseleave="this.style.textDecoration=\'none\'">' + _esc(item.name||'Unnamed') + '</a>'
      + '<span style="display:block;font-size:11px;font-weight:400;color:var(--text-muted);margin-top:1px;">' + sspLabel + (signoff.signedDate?' · updated '+signoff.signedDate:'') + '</span></td>'
      + '<td style="font-size:12px;color:var(--text-muted);">' + subtitle + '</td>'
      + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(item.owner||'—') + '</td>'
      + '<td style="text-align:center;font-size:13px;font-weight:600;">' + (controls.length||'<span style="color:var(--text-muted);">—</span>') + '</td>'
      + '<td><div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;background:var(--border);border-radius:3px;height:5px;overflow:hidden;"><div style="height:100%;background:'+col+';width:'+pct+'%;border-radius:3px;"></div></div><span style="font-size:11px;font-weight:600;color:'+col+';min-width:30px;text-align:right;">'+pct+'%</span></div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+completed+' / '+controls.length+' attested</div></td>'
      + '<td><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;background:'+col+'22;color:'+col+';white-space:nowrap;">'+status+'</span></td>'
      + (isAssetOwner ? '<td></td>' : '<td style="text-align:center;"><button class="btn btn-secondary btn-sm" onclick="'+removeFn+'(\''+item.id+'\')" style="color:var(--red);padding:3px 8px;" title="Remove">✕</button></td>')
      + '</tr>';
  }

  function sectionTable(items, isProc, icon, label, emptyMsg) {
    var addFn = isProc ? 'openAddItemModal(\'process\')' : 'openAddItemModal(\'asset\')';
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;margin-top:' + (isProc?'32px':'0') + ';">'
      + '<div style="display:flex;align-items:center;gap:8px;">'
      + '<span style="font-size:18px;">' + icon + '</span>'
      + '<span style="font-size:15px;font-weight:700;color:var(--navy);">' + label + '</span>'
      + '<span style="font-size:12px;color:var(--text-muted);margin-left:4px;">(' + items.length + ')</span>'
      + '</div>'
      + (isAssetOwner ? '' : '<button class="btn btn-primary btn-sm" onclick="' + addFn + '">+ Register</button>')
      + '</div>';
    if (!items.length) {
      h += '<div style="background:#f8fafc;border:1px dashed var(--border);border-radius:10px;padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">' + emptyMsg + '</div>';
      return h;
    }
    h += '<div class="table-scroll"><table class="control-table" style="table-layout:fixed;">'
      + '<thead><tr><th style="width:28%;">' + (isProc?'Process':'Asset') + '</th><th style="width:14%;">'+(isProc?'Category':'Type')+'</th><th style="width:14%;">Owner</th><th style="width:10%;">Controls</th><th style="width:18%;">Progress</th><th style="width:10%;">Status</th><th style="width:6%;"></th></tr></thead><tbody id="tbod-${Math.random().toString(36).slice(2,8)}">';
    items.forEach(function(item){ h += sspRow(item, isProc); });
    h += '</tbody></table></div>';
    return h;
  }

  body.innerHTML = sectionTable(assets, false, '🖥️', 'Assets', 'No assets registered yet. Click Register to add a system, application, or infrastructure component.')
    + sectionTable(processes, true, '⚙️', 'Processes', 'No processes registered yet. Click Register to add an operational process in scope for this program.');
}

// ─── GET CONTROLS FOR AN ASSET'S SSP ─────────────────────────────────────────
// Returns controls explicitly mapped to this asset via assetMappings.
// Falls back to type-based matching via assetCoverage if no explicit mappings exist.
function getAssetSSPControls(asset) {
  if (!asset) return [];
  var allControls  = getActiveControls();
  var assetMaps    = state.assetMappings || {};

  // Explicit mappings: control owner ticked this asset in the "Applies To Assets" section
  var explicitIds = [];
  Object.keys(assetMaps).forEach(function(cid) {
    if ((assetMaps[cid]||[]).some(function(id){ return String(id) === String(asset.id); })) {
      explicitIds.push(cid);
    }
  });

  if (explicitIds.length) {
    return allControls.filter(function(c){ return explicitIds.includes(c.id); });
  }

  // Check if it's a custom type
  var customTypes = state.customAssetTypes || [];
  if (customTypes.includes(asset.type)) {
    return allControls.filter(function(c) {
      return !!((state.controlStatus[c.id]||{}).assetCoverage||{})['custom_' + asset.type];
    });
  }

  // Named key lookup via new 2-tier hierarchy
  var typeKey = getAssetTypeKey(asset.type);
  if (!typeKey) return allControls; // 'Other' or unknown legacy type → all controls

  return allControls.filter(function(c) {
    var cov = (state.controlStatus[c.id]||{}).assetCoverage || {};
    return !!cov[typeKey];
  });
}

// ─── ENTER / EXIT SSP WIZARD ─────────────────────────────────────────────────
function enterAssetSSP(assetId) {
  if (!userCanAccessAssetWorkspace()) {
    showToast('Access restricted: only Asset Owners can open the asset SSP wizard.', true);
    return;
  }
  var scopedIds = getCurrentPersonAssetIds();
  if (scopedIds && scopedIds.indexOf(String(assetId)) === -1) {
    showToast('This asset is not assigned to your profile.', true);
    return;
  }
  state._assetTypeLibraryMode = false;
  state._assetLibraryMode = false;
  state._selectedAssetId   = String(assetId);
  state._selectedProcessId = null;
  currentStep.asset = 1;
  var listPanel = document.getElementById('asset-list-panel');
  var wizPanel  = document.getElementById('asset-wizard-panel');
  if (listPanel) listPanel.style.display = 'none';
  if (wizPanel)  wizPanel.style.display  = 'flex';
  for (var i = 1; i <= 3; i++) {
    var s = document.getElementById('asset-step-' + i);
    if (s) s.classList.toggle('active', i === 1);
  }
  renderAssetWizardChrome();
  renderAssetSSPStep1();
}

function enterProcessSSP(procId) {
  state._assetTypeLibraryMode = false;
  state._selectedProcessId = String(procId);
  state._selectedAssetId   = null;
  currentStep.asset = 1;
  var listPanel = document.getElementById('asset-list-panel');
  var wizPanel  = document.getElementById('asset-wizard-panel');
  if (listPanel) listPanel.style.display = 'none';
  if (wizPanel)  wizPanel.style.display  = 'flex';
  for (var i = 1; i <= 3; i++) {
    var s = document.getElementById('asset-step-' + i);
    if (s) s.classList.toggle('active', i === 1);
  }
  renderAssetWizardChrome();
  renderProcessSSPStep1();
}

function exitAssetWizard() {
  state._selectedAssetId   = null;
  state._selectedProcessId = null;
  renderAssetTab();
}

function assetSSPNext(fromStep) {
  goToStep('asset', fromStep + 1);
}

// ─── WIZARD CHROME ───────────────────────────────────────────────────────────
function renderAssetWizardChrome() {
  var chrome = document.getElementById('asset-wizard-chrome');
  if (!chrome) return;
  var step = currentStep.asset || 1;
  var isPrivacy = state.privacyOverlay;
  var sspLabel  = isPrivacy ? 'SPSP' : 'SSP';
  var isProc    = !!state._selectedProcessId;
  var item, subtitle, step1Label;
  if (isProc) {
    item       = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
    if (!item) return;
    var cat    = PROCESS_CATEGORIES.find(function(c){ return c.id === item.category; });
    subtitle   = (cat ? cat.label : item.category||'Process') + ' · Process SSP';
    step1Label = 'Process Profile';
  } else {
    item       = (state.assets||[]).find(function(a){ return String(a.id)===String(state._selectedAssetId); });
    if (!item) return;
    subtitle   = _esc(item.type||'System') + ' · ' + sspLabel;
    step1Label = 'Asset Profile';
  }

  var steps = [
    { n:1, label:step1Label },
    { n:2, label:'Control Attestations' },
    { n:3, label:'Sign Off' }
  ];

  var stepsHtml = steps.map(function(s) {
    var active  = step === s.n;
    var done    = step > s.n;
    var circleStyle = active
      ? 'background:var(--teal);color:white;'
      : done ? 'background:var(--green);color:white;' : 'background:var(--border);color:var(--text-muted);';
    return '<div class="step-item' + (active?' active':'') + '" onclick="goToStep(\'asset\',' + s.n + ')" style="cursor:pointer;">'
      + '<div class="step-circle" style="' + circleStyle + (done?'font-size:12px;':' ') + '">' + (done?'✓':s.n) + '</div>'
      + '<div class="step-info"><div class="step-num">Step ' + s.n + '</div><div class="step-name">' + s.label + '</div></div>'
      + '</div>';
  }).join('<div class="step-connector"></div>');

  chrome.innerHTML = '<div style="display:flex;align-items:center;gap:0;padding:12px 0;">'
    + '<button onclick="exitAssetWizard()" style="border:none;background:none;color:var(--teal);font-size:13px;font-weight:600;cursor:pointer;padding:6px 0;margin-right:24px;white-space:nowrap;">← All Assets &amp; Processes</button>'
    + '<div style="margin-right:24px;flex-shrink:0;">'
    + '<div style="font-size:14px;font-weight:700;color:var(--navy);">' + _esc(item.name) + '</div>'
    + '<div style="font-size:11px;color:var(--text-muted);">' + subtitle + '</div>'
    + '</div>'
    + '<div class="step-nav" style="flex-direction:row;gap:0;padding:0;background:none;border:none;flex:1;">'
    + stepsHtml
    + '</div>'
    + '</div>';
}

// ─── STEP 1: ASSET PROFILE ───────────────────────────────────────────────────
function renderAssetSSPStep1() {
  var body  = document.getElementById('asset-step-1-body');
  if (!body) return;
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) { renderAssetHome(); return; }
  var idx   = state.assets.indexOf(asset);

  body.innerHTML = '<div class="section-title">Asset Profile</div>'
    + '<div class="section-subtitle">Confirm or update the details for this asset. This information is included in the SSP header.</div>'
    + '<div style="max-width:600px;">'
    + '<div class="form-group"><label class="form-label">Asset Name <span style="color:var(--red);">*</span></label>'
    + '<input class="form-input" value="' + _esc(asset.name||'') + '" placeholder="e.g. HR Management System"'
    + ' oninput="state.assets[' + idx + '].name=this.value;renderAssetWizardChrome(); window.markDirty();"></div>'
    + '<div class="form-group"><label class="form-label">Asset Type <span style="color:var(--red);">*</span></label>'
    + '<select class="form-select" onchange="state.assets[' + idx + '].type=this.value;">'
    + buildAssetTypeOptions(asset.type)
    + '</select>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Asset type determines which controls appear in the SSP when no explicit control mappings are set.</div>'
    + '</div>'
    + '<div class="form-group"><label class="form-label">Asset Owner / Responsible Party</label>'
    + '<input class="form-input" value="' + _esc(asset.owner||'') + '" placeholder="Name or role"'
    + ' oninput="state.assets[' + idx + '].owner=this.value; window.markDirty();"></div>'
    + ((['Workstation (Windows)','Workstation (macOS/Linux)','Mobile Device','Virtual Desktop (VDI)'].includes(asset.type))
      ? '<div class="form-group"><label class="form-label">MDM Solution <span style="font-weight:400;color:var(--text-muted);">(optional)</span></label>'
        + '<input class="form-input" value="' + _esc(asset.mdm||'') + '" placeholder="e.g. Jamf Pro, Microsoft Intune, Kandji…"'
        + ' oninput="state.assets[' + idx + '].mdm=this.value; window.markDirty();"></div>'
      : '')
    + '<div class="form-group"><label class="form-label">Description <span style="font-weight:400;color:var(--text-muted);">(optional)</span></label>'
    + '<textarea class="form-input" rows="3" placeholder="Brief description of what this asset does and its sensitivity..." oninput="state.assets[' + idx + '].description=this.value; window.markDirty();">' + _esc(asset.description||'') + '</textarea></div>'
    + '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;font-size:12px;color:#1e40af;">'
    + '<strong>What happens next:</strong> Step 2 lists every control that has been mapped to this asset by your control owners. For each one, you\'ll select an attestation status and provide a brief explanation.'
    + '</div>'
    + '</div>';
}

// ─── STEP 2: CONTROL ATTESTATIONS ────────────────────────────────────────────
function renderAssetSSPStep2() {
  var body  = document.getElementById('asset-step-2-body');
  if (!body) return;
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) return;

  var controls = getAssetSSPControls(asset);
  var attests  = (state.sspAttestations||{})[asset.id] || {};
  var signoff  = (state.sspSignoffs||{})[asset.id]     || {};
  var isSubmitted = signoff.status === 'Submitted' || signoff.status === 'Approved';

  // Update count in footer
  var countEl = document.getElementById('asset-step-2-count');
  if (countEl) {
    var done = controls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    countEl.textContent = done + ' / ' + controls.length + ' attested';
  }

  if (!controls.length) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Mapped Yet</div>'
      + '<p>No controls have been mapped to this asset type yet. Control owners assign controls to assets in the Control Owner tab. Once assigned, they will appear here for attestation.</p></div>';
    return;
  }

  var isPrivacy = state.privacyOverlay;
  var sspLabel  = isPrivacy ? 'SPSP' : 'SSP';

  var html = '<div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">'
    + controls.length + ' controls applicable to this ' + _esc(asset.type||'asset')
    + (isSubmitted ? ' · <span style="color:var(--green);font-weight:600;">✓ Submitted</span>' : '')
    + '</div>';

  // Group by family
  var byFamily = {};
  var famOrder = [];
  controls.forEach(function(c) {
    if (!byFamily[c.f]) { byFamily[c.f] = []; famOrder.push(c.f); }
    byFamily[c.f].push(c);
  });

  famOrder.forEach(function(fam) {
    var famControls = byFamily[fam];
    var famDone = famControls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    html += '<div style="margin-bottom:28px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--border);">'
      + '<span class="family-badge">' + fam + '</span>'
      + '<span style="font-size:13px;font-weight:700;color:var(--navy);">' + ((DOMAIN_DEFAULTS[fam]||{}).label||fam) + '</span>'
      + '<span style="margin-left:auto;font-size:12px;color:var(--text-muted);">' + famDone + ' / ' + famControls.length + '</span>'
      + '</div>';

    famControls.forEach(function(c) {
      var cs      = state.controlStatus[c.id] || {};
      var guidanceHtml = buildGuidanceFromControlOwner(c.id, asset.type || 'General');
      var att     = attests[c.id] || {};
      var statusVal = att.status || '';
      var explanation = att.explanation || '';
      var evidenceLocation = att.evidenceLocation || '';
      var statusColor = SSP_STATUS_COLORS[statusVal] || 'var(--border)';

      html += '<div style="border:1px solid ' + (statusVal?statusColor+'66':'var(--border)') + ';border-radius:10px;padding:16px;margin-bottom:12px;background:' + (statusVal?'white':'#fafbfc') + ';">'
        + '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">'
        + '<span class="control-id" style="flex-shrink:0;">' + c.id + '</span>'
        + '<div style="flex:1;"><div style="font-weight:600;font-size:13px;color:var(--navy);">' + _esc(c.n) + '</div>'
        + (cs.narrative ? '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Impl: ' + _esc(cs.narrative.substring(0,120)) + (cs.narrative.length>120?'…':'') + '</div>' : '')
        + '</div>'
        + '</div>'
        + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 12px;margin-bottom:10px;font-size:12px;">'
          + '<div style="font-weight:600;color:#166534;margin-bottom:4px;">📌 Guidance from Control Owner</div>'
          + '<div style="color:#15803d;line-height:1.5;">' + guidanceHtml + '</div>'
          + '</div>'
        + '<div style="display:grid;grid-template-columns:180px 1fr 1fr;gap:12px;align-items:start;">'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px;">Attestation</label>'
        + '<select style="width:100%;padding:7px 10px;border:1px solid ' + (statusVal?statusColor:'var(--border)') + ';border-radius:6px;font-size:13px;font-weight:' + (statusVal?'600':'400') + ';color:' + (statusVal?statusColor:'var(--text-muted)') + ';background:white;cursor:pointer;"'
        + (isSubmitted ? ' disabled' : '')
        + ' onchange="setSSPAttestation(\'' + asset.id + '\',\'' + c.id + '\',\'status\',this.value);renderAssetSSPStep2();">'
        + '<option value="">— Select status —</option>'
        + SSP_STATUSES.map(function(s){ return '<option value="' + s + '"' + (statusVal===s?' selected':'') + ' style="color:' + (SSP_STATUS_COLORS[s]||'inherit') + ';">' + s + '</option>'; }).join('')
        + '</select></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px;">'
        + (statusVal && statusVal !== 'Complies' ? '<span style="color:var(--red);">*</span> ' : '')
        + 'Explanation / Notes</label>'
        + '<textarea style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;" rows="2"'
        + ' placeholder="' + (statusVal==='Complies'?'Optional — describe how this is implemented...':'Required — explain status...') + '"'
        + (isSubmitted ? ' readonly' : '')
        + ' oninput="setSSPAttestation(\'' + asset.id + '\',\'' + c.id + '\',\'explanation\',this.value)">'
        + _esc(explanation)
        + '</textarea></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px;">Evidence Location</label>'
        + '<input style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit;"'
        + ' placeholder="SharePoint/Drive URL, ticket, folder path, or evidence repo reference"'
        + ' value="' + _esc(evidenceLocation) + '"'
        + (isSubmitted ? ' readonly' : '')
        + ' oninput="setSSPAttestation(\'' + asset.id + '\',\'' + c.id + '\',\'evidenceLocation\',this.value)">'
        + '</div>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
  });

  body.innerHTML = html;
}

// ─── STEP 3: REVIEW & SIGN OFF ───────────────────────────────────────────────
function renderAssetSSPStep3() {
  var body  = document.getElementById('asset-step-3-body');
  if (!body) return;
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) return;

  var controls  = getAssetSSPControls(asset);
  var attests   = (state.sspAttestations||{})[asset.id] || {};
  var signoff   = (state.sspSignoffs||{})[asset.id]     || {};
  var isPrivacy = state.privacyOverlay;
  var sspLabel  = isPrivacy ? 'SPSP' : 'SSP';

  var complies   = controls.filter(function(c){ return (attests[c.id]||{}).status==='Complies'; }).length;
  var partial    = controls.filter(function(c){ return (attests[c.id]||{}).status==='Partially Complies'; }).length;
  var notComply  = controls.filter(function(c){ return (attests[c.id]||{}).status==='Does Not Comply'; }).length;
  var notApply   = controls.filter(function(c){ return (attests[c.id]||{}).status==='Not Applicable'; }).length;
  var inherited  = controls.filter(function(c){ return (attests[c.id]||{}).status==='Inherited'; }).length;
  var unanswered = controls.filter(function(c){ return !(attests[c.id]||{}).status; }).length;
  var isComplete = unanswered === 0;
  var isSubmitted= signoff.status === 'Submitted' || signoff.status === 'Approved';
  var evidenceLocations = controls
    .map(function(c){
      var loc = ((attests[c.id]||{}).evidenceLocation || '').trim();
      if (!loc) return null;
      return { id: c.id, location: loc };
    })
    .filter(Boolean);

  // Submitted banner
  var bannerHtml = '';
  if (signoff.status === 'Approved') {
    bannerHtml = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin-bottom:24px;display:flex;gap:12px;align-items:center;">'
      + '<span style="font-size:20px;">✅</span><div>'
      + '<div style="font-weight:700;color:#166534;">SSP Approved</div>'
      + '<div style="font-size:12px;color:#15803d;">Approved on ' + _esc(signoff.signedDate||'') + '</div>'
      + '</div></div>';
  } else if (signoff.status === 'Submitted') {
    bannerHtml = '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:16px;margin-bottom:24px;display:flex;gap:12px;align-items:center;">'
      + '<span style="font-size:20px;">📬</span><div>'
      + '<div style="font-weight:700;color:#1e40af;">' + sspLabel + ' Submitted — Awaiting Review</div>'
      + '<div style="font-size:12px;color:#2563eb;">Submitted by ' + _esc(signoff.signedBy||'') + ' on ' + _esc(signoff.signedDate||'') + '</div>'
      + '</div></div>';
  }

  // Summary table
  var rows = [
    ['Complies', complies, 'var(--green)'],
    ['Partially Complies', partial, 'var(--amber)'],
    ['Does Not Comply', notComply, 'var(--red)'],
    ['Not Applicable', notApply, 'var(--slate)'],
    ['Inherited', inherited, 'var(--blue)'],
    ['Not yet attested', unanswered, '#94a3b8']
  ];

  var summaryHtml = rows.map(function(r) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">'
      + '<span style="width:12px;height:12px;border-radius:50%;background:' + r[2] + ';display:inline-block;flex-shrink:0;"></span>'
      + '<span style="flex:1;font-size:13px;">' + r[0] + '</span>'
      + '<span style="font-weight:700;font-size:14px;color:' + r[2] + ';">' + r[1] + '</span>'
      + '</div>';
  }).join('');

  // Missing explanations warning
  var needsExplanation = controls.filter(function(c) {
    var s = (attests[c.id]||{}).status;
    return s && s !== 'Complies' && !(attests[c.id]||{}).explanation;
  });

  var warnHtml = '';
  if (needsExplanation.length) {
    warnHtml = '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;margin-bottom:20px;">'
      + '<div style="font-weight:600;color:#92400e;margin-bottom:4px;">⚠️ ' + needsExplanation.length + ' control(s) are missing an explanation</div>'
      + '<div style="font-size:12px;color:#b45309;">Controls not marked "Complies" should include an explanation. Please return to Step 2 to complete: '
      + needsExplanation.map(function(c){ return '<strong>' + c.id + '</strong>'; }).join(', ')
      + '</div></div>';
  }

  // Submit button state
  var submitBtn = document.getElementById('asset-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = isSubmitted || !isComplete;
    submitBtn.style.opacity = (isSubmitted || !isComplete) ? '0.5' : '1';
    submitBtn.textContent = isSubmitted ? (signoff.status==='Approved'?'✓ Approved':'✓ Submitted') : '✓ Sign & Submit ' + sspLabel;
  }

  body.innerHTML = bannerHtml
    + '<div class="section-title">Review &amp; Sign Off</div>'
    + '<div class="section-subtitle">Review your attestation summary before submitting. Once submitted, the SSP will be sent to your ISSM for review.</div>'
    + (!isComplete ? '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 14px;margin-bottom:20px;font-size:13px;color:#b91c1c;"><strong>⚠️ Incomplete:</strong> ' + unanswered + ' control(s) still need an attestation status. Return to Step 2 to complete them.</div>' : '')
    + warnHtml
    + '<div style="max-width:560px;">'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:20px;">'
    + '<div style="font-weight:700;font-size:14px;color:var(--navy);margin-bottom:14px;">Attestation Summary — ' + _esc(asset.name) + '</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">' + _esc(asset.type||'System') + ' · ' + controls.length + ' controls in scope · ' + sspLabel + '</div>'
    + summaryHtml
    + '</div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:20px;">'
    + '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);margin-bottom:8px;">Evidence Locations</div>'
    + (evidenceLocations.length
      ? '<div style="display:flex;flex-direction:column;gap:6px;">' + evidenceLocations.map(function(e){
          return '<div style="font-size:12px;color:#374151;"><span class="control-id" style="margin-right:6px;">' + _esc(e.id) + '</span>' + _esc(e.location) + '</div>';
        }).join('') + '</div>'
      : '<div style="font-size:12px;color:var(--text-muted);">No evidence locations entered yet.</div>')
    + '</div>'
    + (!isSubmitted ? '<div class="form-group"><label class="form-label">Signed by <span style="color:var(--red);">*</span></label>'
      + '<input class="form-input" id="ssp-signedby" placeholder="Your full name" value="' + _esc(signoff.signedBy||getSignerName()) + '"></div>' : '')
    + '</div>';
}

function getSignerName() {
  if (!state.currentUserId) return '';
  var u = (state.users||[]).find(function(u){ return u.id === state.currentUserId; });
  return u ? u.name : '';
}

// ─── SSP STATE HELPERS ────────────────────────────────────────────────────────
function setSSPAttestation(assetId, controlId, field, value) {
  if (!state.sspAttestations) state.sspAttestations = {};
  if (!state.sspAttestations[assetId]) state.sspAttestations[assetId] = {};
  if (!state.sspAttestations[assetId][controlId]) state.sspAttestations[assetId][controlId] = {};
  var prev = state.sspAttestations[assetId][controlId][field];
  state.sspAttestations[assetId][controlId][field] = value;
  state.sspAttestations[assetId][controlId].date = new Date().toISOString().slice(0,10);
  logFieldChange('sspAttestations.' + assetId + '.' + controlId + '.' + field, prev, value);
  markDirty();
}

function submitSSP() {
  if (blockActionIfDemoPlaceholders()) return;
  clearScopedUndoStack('SSP submit');
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) return;
  var controls  = getAssetSSPControls(asset);
  var attests   = (state.sspAttestations||{})[asset.id] || {};
  var unanswered = controls.filter(function(c){ return !(attests[c.id]||{}).status; });
  if (unanswered.length) { showToast('Please attest all ' + unanswered.length + ' remaining controls before submitting.', true); return; }
  var signerInput = document.getElementById('ssp-signedby');
  var signer = signerInput ? signerInput.value.trim() : getSignerName();
  if (!signer) { showToast('Please enter your name before signing.', true); if (signerInput) signerInput.focus(); return; }
  if (!confirm('Submit the SSP for "' + asset.name + '" signed by ' + signer + '?\n\nThis will send it to your ISSM for review.')) return;
  if (!state.sspSignoffs) state.sspSignoffs = {};
  state.sspSignoffs[asset.id] = { signedBy: signer, signedDate: new Date().toISOString().slice(0,10), status: 'Submitted' };
  // Push to ISSM review queue
  if (!state.controlReviewQueue) state.controlReviewQueue = [];
  state.controlReviewQueue.push({ type:'ssp', assetId: asset.id, assetName: asset.name, submittedBy: signer, date: new Date().toISOString().slice(0,10), status:'Pending' });
  addAuditEntry('asset', asset.id, 'SSP submitted by ' + signer);
  markDirty();
  showToast('✅ SSP submitted for ' + asset.name);
  renderAssetSSPStep3();
  updateNotificationBadges();
  showTab('reports');
}

// ─── ASSET MANAGEMENT ────────────────────────────────────────────────────────

function removeAsset(assetId) {
  var asset = (state.assets||[]).find(function(a){ return String(a.id)===String(assetId); });
  if (!asset) return;
  if (!confirm('Remove "' + asset.name + '" from the asset inventory?\n\nThis will also delete its SSP attestations. This cannot be undone.')) return;
  state.assets = state.assets.filter(function(a){ return String(a.id)!==String(assetId); });
  if (state.sspAttestations) delete state.sspAttestations[assetId];
  if (state.sspSignoffs)     delete state.sspSignoffs[assetId];
  if (state.assetMappings)   Object.keys(state.assetMappings).forEach(function(cid){ state.assetMappings[cid] = (state.assetMappings[cid]||[]).filter(function(id){ return String(id)!==String(assetId); }); });
  markDirty();
  renderAssetHome();
  renderSidebarAssets();
}

function removeProcess(procId) {
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(procId); });
  if (!proc) return;
  if (!confirm('Remove "' + proc.name + '"?\n\nThis will also delete its SSP attestations. This cannot be undone.')) return;
  state.processes = state.processes.filter(function(p){ return String(p.id)!==String(procId); });
  if (state.sspAttestations) delete state.sspAttestations[procId];
  if (state.sspSignoffs)     delete state.sspSignoffs[procId];
  markDirty();
  renderAssetHome();
}

// ─── TYPE-PICKER MODAL (Step 0) ───────────────────────────────────────────────
function openAddItemModal(preselect) {
  var overlay = document.createElement('div');
  overlay.id = 'addItemOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;';

  var assetForm = '<div id="_addItemAssetForm"' + (preselect==='process'?' style="display:none;"':'') + '>'
    + '<div class="form-group"><label class="form-label">Asset Name <span style="color:var(--red);">*</span></label>'
    + '<input class="form-input" id="_newAssetName" placeholder="e.g. HR Management System"></div>'
    + '<div class="form-group"><label class="form-label">Asset Type <span style="color:var(--red);">*</span></label>'
    + '<select class="form-select" id="_newAssetType">'
    + buildAssetTypeOptions('')
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">Asset Owner</label>'
    + '<input class="form-input" id="_newAssetOwner" placeholder="Name or role"></div>'
    + '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'addItemOverlay\').remove()">Cancel</button>'
    + '<button class="btn btn-primary" onclick="confirmAddAsset()">Register Asset →</button>'
    + '</div></div>';

  var procForm = '<div id="_addItemProcForm"' + (preselect!=='process'?' style="display:none;"':'') + '>'
    + '<div class="form-group"><label class="form-label">Process Name <span style="color:var(--red);">*</span></label>'
    + '<input class="form-input" id="_newProcName" placeholder="e.g. Vulnerability Management Program"></div>'
    + '<div class="form-group"><label class="form-label">Process Category <span style="color:var(--red);">*</span></label>'
    + '<select class="form-select" id="_newProcCategory"><option value="">— Select category —</option>'
    + PROCESS_CATEGORIES.map(function(c){ return '<option value="' + c.id + '">' + c.label + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">Process Owner</label>'
    + '<input class="form-input" id="_newProcOwner" placeholder="Name or role"></div>'
    + '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'addItemOverlay\').remove()">Cancel</button>'
    + '<button class="btn btn-primary" onclick="confirmAddProcess()">Register Process →</button>'
    + '</div></div>';

  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:32px;width:480px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:4px;">Register New</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Are you registering a system / infrastructure asset, or an operational process?</div>'
    + '<div style="display:flex;gap:10px;margin-bottom:24px;">'
    + '<button id="_typePickerAsset" onclick="document.getElementById(\'_addItemAssetForm\').style.display=\'\';document.getElementById(\'_addItemProcForm\').style.display=\'none\';document.getElementById(\'_typePickerAsset\').style.fontWeight=\'700\';document.getElementById(\'_typePickerProc\').style.fontWeight=\'400\';" '
    + 'style="flex:1;padding:12px;border-radius:10px;border:2px solid var(--teal);background:#f0fdfa;color:var(--navy);cursor:pointer;font-size:13px;font-weight:' + (preselect==='process'?'400':'700') + ';">🖥️ Asset</button>'
    + '<button id="_typePickerProc" onclick="document.getElementById(\'_addItemProcForm\').style.display=\'\';document.getElementById(\'_addItemAssetForm\').style.display=\'none\';document.getElementById(\'_typePickerProc\').style.fontWeight=\'700\';document.getElementById(\'_typePickerAsset\').style.fontWeight=\'400\';" '
    + 'style="flex:1;padding:12px;border-radius:10px;border:2px solid ' + (preselect==='process'?'var(--teal)':'var(--border)') + ';background:' + (preselect==='process'?'#f0fdfa':'white') + ';color:var(--navy);cursor:pointer;font-size:13px;font-weight:' + (preselect==='process'?'700':'400') + ';">⚙️ Process</button>'
    + '</div>'
    + assetForm
    + procForm
    + '</div>';

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  setTimeout(function(){
    var f = preselect==='process' ? document.getElementById('_newProcName') : document.getElementById('_newAssetName');
    if (f) f.focus();
  }, 50);
}
function openAddAssetModal() { openAddItemModal('asset'); }

function confirmAddAsset() {
  var name  = (document.getElementById('_newAssetName')?.value||'').trim();
  var type  = document.getElementById('_newAssetType')?.value||'';
  var owner = (document.getElementById('_newAssetOwner')?.value||'').trim();
  if (!name) { showToast('Please enter an asset name.', true); return; }
  if (!type) { showToast('Please select an asset type.', true); return; }
  if (!state.assets) state.assets = [];
  var newAsset = { id: 'asset-' + Date.now(), name: name, type: type, owner: owner, description: '' };
  state.assets.push(newAsset);
  document.getElementById('addItemOverlay')?.remove();
  markDirty();
  renderSidebarAssets();
  enterAssetSSP(newAsset.id);
}

function confirmAddProcess() {
  var name     = (document.getElementById('_newProcName')?.value||'').trim();
  var category = document.getElementById('_newProcCategory')?.value||'';
  var owner    = (document.getElementById('_newProcOwner')?.value||'').trim();
  if (!name)     { showToast('Please enter a process name.', true); return; }
  if (!category) { showToast('Please select a process category.', true); return; }
  if (!state.processes) state.processes = [];
  var newProc = { id: 'proc-' + Date.now(), name: name, category: category, owner: owner, description: '' };
  state.processes.push(newProc);
  document.getElementById('addItemOverlay')?.remove();
  markDirty();
  enterProcessSSP(newProc.id);
}

// ─── GET CONTROLS FOR A PROCESS SSP ──────────────────────────────────────────
function getProcessSSPControls(proc) {
  if (!proc) return [];
  var cat = PROCESS_CATEGORIES.find(function(c){ return c.id === proc.category; });
  if (!cat) return [];
  var famSet = {};
  cat.families.forEach(function(f){ famSet[f] = true; });
  return getActiveControls().filter(function(c){ return famSet[c.f]; });
}

// ─── PROCESS SSP STEPS ────────────────────────────────────────────────────────
function renderProcessSSPStep1() {
  var body = document.getElementById('asset-step-1-body');
  if (!body) return;
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) { body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">Process Not Found</div></div>'; return; }
  var idx = state.processes.indexOf(proc);
  var cat = PROCESS_CATEGORIES.find(function(c){ return c.id === proc.category; });

  body.innerHTML = '<div class="section-title">Process Profile</div>'
    + '<div class="section-subtitle">Confirm or update the details for this process. This information is included in the Process SSP header.</div>'
    + '<div style="max-width:600px;">'
    + '<div class="form-group"><label class="form-label">Process Name <span style="color:var(--red);">*</span></label>'
    + '<input class="form-input" value="' + _esc(proc.name||'') + '" placeholder="e.g. Vulnerability Management Program"'
    + ' oninput="state.processes[' + idx + '].name=this.value;renderAssetWizardChrome(); window.markDirty();"></div>'
    + '<div class="form-group"><label class="form-label">Process Category <span style="color:var(--red);">*</span></label>'
    + '<select class="form-select" onchange="state.processes[' + idx + '].category=this.value;">'
    + PROCESS_CATEGORIES.map(function(c){ return '<option value="' + c.id + '"' + (proc.category===c.id?' selected':'') + '>' + c.label + '</option>'; }).join('')
    + '</select>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Category determines which control families appear in the process SSP attestations.'
    + (cat ? ' Currently covers: <strong>' + cat.families.join(', ') + '</strong>.' : '') + '</div>'
    + '</div>'
    + '<div class="form-group"><label class="form-label">Process Owner / Responsible Party</label>'
    + '<input class="form-input" value="' + _esc(proc.owner||'') + '" placeholder="Name or role"'
    + ' oninput="state.processes[' + idx + '].owner=this.value; window.markDirty();"></div>'
    + '<div class="form-group"><label class="form-label">Description <span style="font-weight:400;color:var(--text-muted);">(optional)</span></label>'
    + '<textarea class="form-input" rows="3" placeholder="Brief description of this process, its scope, and any key procedures..." oninput="state.processes[' + idx + '].description=this.value; window.markDirty();">' + _esc(proc.description||'') + '</textarea></div>'
    + '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;font-size:12px;color:#1e40af;">'
    + '<strong>What happens next:</strong> Step 2 lists controls from the selected process category families. For each one, attest how this process implements or satisfies the control.'
    + '</div>'
    + '</div>';
}

function renderProcessSSPStep2() {
  var body = document.getElementById('asset-step-2-body');
  if (!body) return;
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) return;

  var controls  = getProcessSSPControls(proc);
  var attests   = (state.sspAttestations||{})[proc.id] || {};
  var signoff   = (state.sspSignoffs||{})[proc.id]     || {};
  var isSubmitted = signoff.status === 'Submitted' || signoff.status === 'Approved';

  var countEl = document.getElementById('asset-step-2-count');
  if (countEl) {
    var done = controls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    countEl.textContent = done + ' / ' + controls.length + ' attested';
  }

  if (!controls.length) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls for This Category</div><p>Change the process category in Step 1 to load applicable controls.</p></div>';
    return;
  }

  var cat = PROCESS_CATEGORIES.find(function(c){ return c.id === proc.category; });
  var html = '<div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">'
    + controls.length + ' controls applicable to ' + _esc((cat||{}).label||proc.category||'this process')
    + (isSubmitted ? ' · <span style="color:var(--green);font-weight:600;">✓ Submitted</span>' : '') + '</div>';

  var byFamily = {};
  var famOrder = [];
  controls.forEach(function(c) {
    if (!byFamily[c.f]) { byFamily[c.f] = []; famOrder.push(c.f); }
    byFamily[c.f].push(c);
  });

  famOrder.forEach(function(fam) {
    var famControls = byFamily[fam];
    var famDone = famControls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    html += '<div style="margin-bottom:28px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--border);">'
      + '<span class="family-badge">' + fam + '</span>'
      + '<span style="font-size:13px;font-weight:700;color:var(--navy);">' + ((DOMAIN_DEFAULTS[fam]||{}).label||fam) + '</span>'
      + '<span style="margin-left:auto;font-size:12px;color:var(--text-muted);">' + famDone + ' / ' + famControls.length + '</span>'
      + '</div>';

    famControls.forEach(function(c) {
      var cs          = state.controlStatus[c.id] || {};
      var guidanceHtml = buildGuidanceFromControlOwner(c.id, 'General');
      var att         = attests[c.id] || {};
      var statusVal   = att.status || '';
      var explanation = att.explanation || '';
      var evidenceLocation = att.evidenceLocation || '';
      var statusColor = SSP_STATUS_COLORS[statusVal] || 'var(--border)';

      html += '<div style="border:1px solid ' + (statusVal?statusColor+'66':'var(--border)') + ';border-radius:10px;padding:16px;margin-bottom:12px;background:' + (statusVal?'white':'#fafbfc') + ';">'
        + '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">'
        + '<span class="control-id" style="flex-shrink:0;">' + c.id + '</span>'
        + '<div style="flex:1;"><div style="font-weight:600;font-size:13px;color:var(--navy);">' + _esc(c.n) + '</div>'
        + (cs.narrative ? '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Impl: ' + _esc(cs.narrative.substring(0,120)) + (cs.narrative.length>120?'…':'') + '</div>' : '')
        + '</div></div>'
        + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 12px;margin-bottom:10px;font-size:12px;">'
        + '<div style="font-weight:600;color:#166534;margin-bottom:4px;">📌 Guidance from Control Owner</div>'
        + '<div style="color:#15803d;line-height:1.5;">' + guidanceHtml + '</div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:180px 1fr 1fr;gap:12px;align-items:start;">'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px;">Attestation</label>'
        + '<select style="width:100%;padding:7px 10px;border:1px solid ' + (statusVal?statusColor:'var(--border)') + ';border-radius:6px;font-size:13px;font-weight:' + (statusVal?'600':'400') + ';color:' + (statusVal?statusColor:'var(--text-muted)') + ';background:white;cursor:pointer;"'
        + (isSubmitted ? ' disabled' : '')
        + ' onchange="setSSPAttestation(\'' + proc.id + '\',\'' + c.id + '\',\'status\',this.value);renderProcessSSPStep2();">'
        + '<option value="">— Select status —</option>'
        + SSP_STATUSES.map(function(s){ return '<option value="' + s + '"' + (statusVal===s?' selected':'') + ' style="color:' + (SSP_STATUS_COLORS[s]||'inherit') + ';">' + s + '</option>'; }).join('')
        + '</select></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px;">'
        + (statusVal && statusVal !== 'Complies' ? '<span style="color:var(--red);">*</span> ' : '')
        + 'Explanation / Notes</label>'
        + '<textarea style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;" rows="2"'
        + ' placeholder="' + (statusVal==='Complies'?'Optional — describe how this process addresses the control...':'Required — explain status...') + '"'
        + (isSubmitted ? ' readonly' : '')
        + ' oninput="setSSPAttestation(\'' + proc.id + '\',\'' + c.id + '\',\'explanation\',this.value)">'
        + _esc(explanation)
        + '</textarea></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px;">Evidence Location</label>'
        + '<input style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit;"'
        + ' placeholder="SharePoint/Drive URL, ticket, folder path, or evidence repo reference"'
        + ' value="' + _esc(evidenceLocation) + '"'
        + (isSubmitted ? ' readonly' : '')
        + ' oninput="setSSPAttestation(\'' + proc.id + '\',\'' + c.id + '\',\'evidenceLocation\',this.value)">'
        + '</div></div></div>';
    });
    html += '</div>';
  });

  body.innerHTML = html;
}

function renderProcessSSPStep3() {
  var body = document.getElementById('asset-step-3-body');
  if (!body) return;
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) return;

  var controls    = getProcessSSPControls(proc);
  var attests     = (state.sspAttestations||{})[proc.id] || {};
  var signoff     = (state.sspSignoffs||{})[proc.id]     || {};
  var complies    = controls.filter(function(c){ return (attests[c.id]||{}).status==='Complies'; }).length;
  var partial     = controls.filter(function(c){ return (attests[c.id]||{}).status==='Partially Complies'; }).length;
  var notComply   = controls.filter(function(c){ return (attests[c.id]||{}).status==='Does Not Comply'; }).length;
  var notApply    = controls.filter(function(c){ return (attests[c.id]||{}).status==='Not Applicable'; }).length;
  var inherited   = controls.filter(function(c){ return (attests[c.id]||{}).status==='Inherited'; }).length;
  var unanswered  = controls.filter(function(c){ return !(attests[c.id]||{}).status; }).length;
  var isComplete  = unanswered === 0;
  var isSubmitted = signoff.status === 'Submitted' || signoff.status === 'Approved';
  var evidenceLocations = controls
    .map(function(c){
      var loc = ((attests[c.id]||{}).evidenceLocation || '').trim();
      if (!loc) return null;
      return { id: c.id, location: loc };
    })
    .filter(Boolean);
  var cat         = PROCESS_CATEGORIES.find(function(c){ return c.id === proc.category; });

  var submitBtn = document.getElementById('asset-submit-btn');
  if (submitBtn) {
    submitBtn.textContent = isSubmitted ? '✓ Submitted' : '✓ Sign & Submit Process SSP';
    submitBtn.onclick = function(){ submitProcessSSP(); };
    submitBtn.disabled = isSubmitted;
  }

  body.innerHTML = (isSubmitted ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;"><span style="font-size:20px;">✅</span><div><div style="font-weight:700;color:#166534;">Process SSP Submitted</div><div style="font-size:12px;color:#15803d;">Signed by ' + _esc(signoff.signedBy||'') + ' on ' + (signoff.signedDate||'') + '</div></div></div>' : '')
    + '<div style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:16px;">Review: ' + _esc(proc.name) + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">'
    + [['Complies',complies,'var(--green)'],['Partial',partial,'var(--amber)'],['Not Comply',notComply,'var(--red)'],['N/A',notApply,'var(--slate)'],['Inherited',inherited,'var(--blue)'],['Unanswered',unanswered,unanswered?'var(--red)':'var(--text-muted)']].map(function(x){
        return '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;"><div style="font-size:20px;font-weight:800;color:'+x[2]+';">'+x[1]+'</div><div style="font-size:11px;color:var(--text-muted);">'+x[0]+'</div></div>';
      }).join('')
    + '</div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:20px;">'
    + '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);margin-bottom:8px;">Evidence Locations</div>'
    + (evidenceLocations.length
      ? '<div style="display:flex;flex-direction:column;gap:6px;">' + evidenceLocations.map(function(e){
          return '<div style="font-size:12px;color:#374151;"><span class="control-id" style="margin-right:6px;">' + _esc(e.id) + '</span>' + _esc(e.location) + '</div>';
        }).join('') + '</div>'
      : '<div style="font-size:12px;color:var(--text-muted);">No evidence locations entered yet.</div>')
    + '</div>'
    + (!isComplete ? '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#c2410c;">⚠️ ' + unanswered + ' control' + (unanswered===1?'':'s') + ' still need attestation before you can submit.</div>' : '')
    + (!isSubmitted && isComplete ? '<div class="form-group" style="max-width:360px;"><label class="form-label">Your Name (Signing Officer)</label>'
      + '<input class="form-input" id="ssp-signedby" value="' + _esc(getSignerName()) + '" placeholder="Enter your full name"></div>' : '');
}

function submitProcessSSP() {
  if (blockActionIfDemoPlaceholders()) return;
  clearScopedUndoStack('Process SSP submit');
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) return;
  var controls   = getProcessSSPControls(proc);
  var attests    = (state.sspAttestations||{})[proc.id] || {};
  var unanswered = controls.filter(function(c){ return !(attests[c.id]||{}).status; });
  if (unanswered.length) { showToast('Please attest all ' + unanswered.length + ' remaining controls before submitting.', true); return; }
  var signerInput = document.getElementById('ssp-signedby');
  var signer = signerInput ? signerInput.value.trim() : getSignerName();
  if (!signer) { showToast('Please enter your name before signing.', true); if (signerInput) signerInput.focus(); return; }
  if (!confirm('Submit the Process SSP for "' + proc.name + '" signed by ' + signer + '?')) return;
  if (!state.sspSignoffs) state.sspSignoffs = {};
  state.sspSignoffs[proc.id] = { signedBy: signer, signedDate: new Date().toISOString().slice(0,10), status: 'Submitted' };
  addAuditEntry('process', proc.id, 'Process SSP submitted by ' + signer);
  markDirty();
  showToast('✅ Process SSP submitted for ' + proc.name);
  renderProcessSSPStep3();
  updateNotificationBadges();
  showTab('reports');
}

// Legacy stubs (keep so old snapshots don't break)
function saveAttestation() { showToast('✅ Attestations saved!'); }
function addAsset() { openAddAssetModal(); }

// ============================================================
// CONTROL TESTER TAB
// ============================================================
function renderTesterTab() { renderTesterStep(currentStep.tester); }

function renderTesterStep(step) {
  if (step===1) renderTesterStep1();
  if (step===2) renderTesterStep2();
  if (step===3) renderTesterStep3();
  if (step===4) renderTesterStep4();
}

function renderTesterStep1() {
  const body = document.getElementById('tester-step-1-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div><p>The CISO must complete all program setup steps first, including baseline selection, PM controls, and control assignment.</p></div>`;
    return;
  }
  const controls = getActiveControls();
  const implemented = controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Implemented');
  body.innerHTML = `
    <div class="section-title">Testing Scope</div>
    <div class="section-subtitle">Select controls to include in this test cycle. Best practice is to test implemented controls.</div>
    <div class="summary-box" style="margin-bottom:20px;">
      <h3>Program Overview</h3>
      <div class="summary-kv"><span class="sk">Total Controls in Scope:</span><span class="sv">${controls.length}</span></div>
      <div class="summary-kv"><span class="sk">Implemented:</span><span class="sv">${implemented.length}</span></div>
      <div class="summary-kv"><span class="sk">Previously Tested:</span><span class="sv">${Object.keys(state.controlTestResults).length}</span></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <strong style="font-size:14px;">Select Controls for Testing</strong>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="selectAllTests(true)">Select All</button>
        <button class="btn btn-secondary btn-sm" onclick="selectAllTests(false)" style="margin-left:6px;">Clear</button>
        <button class="btn btn-secondary btn-sm" onclick="selectImplementedTests()" style="margin-left:6px;">Select Implemented</button>
      </div>
    </div>
    <div class="table-scroll">
      <table class="control-table">
        <thead><tr><th style="width:40px;">✓</th><th style="width:80px;">ID</th><th>Control Name</th><th>Status</th><th>Last Tested</th></tr></thead>
        <tbody id="testScopeTable">
          ${controls.map(c => {
            const cs = state.controlStatus[c.id]||{};
            const tr = state.controlTestResults[c.id]||{};
            return `<tr>
              <td><input type="checkbox" class="test-scope-cb" data-id="${c.id}" ${tr.selected?'checked':''} style="accent-color:var(--teal);"
                onchange="state.controlTestResults['${c.id}']={...(state.controlTestResults['${c.id}']||{}),selected:this.checked}"></td>
              <td><span class="control-id">${c.id}</span></td>
              <td>${c.n}</td>
              <td>${chipHTML(cs.status||'Not Started')}</td>
              <td style="font-size:12px; color:var(--text-muted);">${tr.date||'Never'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function selectAllTests(val) {
  document.querySelectorAll('.test-scope-cb').forEach(cb => {
    cb.checked = val;
    const id = cb.dataset.id;
    if (!state.controlTestResults[id]) state.controlTestResults[id] = {};
    state.controlTestResults[id].selected = val;
  });
}

function selectImplementedTests() {
  document.querySelectorAll('.test-scope-cb').forEach(cb => {
    const id = cb.dataset.id;
    const isImpl = (state.controlStatus[id]||{}).status === 'Implemented';
    cb.checked = isImpl;
    if (!state.controlTestResults[id]) state.controlTestResults[id] = {};
    state.controlTestResults[id].selected = isImpl;
  });
}

function renderTesterStep2() {
  const body = document.getElementById('tester-step-2-body');
  if (!body) return;
  const selected = getActiveControls().filter(c => state.controlTestResults[c.id]?.selected);
  if (!selected.length) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Selected for Testing</div><p>Return to Step 1 and select at least one control that has been implemented. Only implemented controls should be included in test cycles.</p></div>`;
    return;
  }
  body.innerHTML = `
    <div class="section-title">Test Procedures</div>
    <div class="section-subtitle">${selected.length} controls selected for testing. Review standard test procedures below.</div>
    <div class="controls-list scroll-area">
      ${selected.map(c => `
      <div class="ctrl-row" style="flex-direction:column; align-items:stretch; gap:6px;">
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="cr-id">${c.id}</span>
          <span style="font-weight:600; font-size:13px; flex:1;">${c.n}</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); background:#f8fafc; padding:8px 10px; border-radius:6px; border:1px solid var(--border);">
          <strong>Test Procedure:</strong> (1) Review policy documentation for ${c.n.toLowerCase()}. (2) Interview responsible personnel. (3) Observe system configuration or logs. (4) Test a sample of records or outputs for compliance.
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <input class="form-input" style="font-size:12px;" placeholder="Tester notes / procedure modifications..." value="${escapeHTML(state.controlTestResults[c.id]?.procedure||'')}"
            oninput="setTestField('${c.id}','procedure',this.value)">
        </div>
      </div>`).join('')}
    </div>`;
}

function setTestField(id, field, value) {
  if (!state.controlTestResults[id]) state.controlTestResults[id] = {};
  state.controlTestResults[id][field] = value;
}

function renderTesterStep3() {
  const body = document.getElementById('tester-step-3-body');
  if (!body) return;
  const selected = getActiveControls().filter(c => state.controlTestResults[c.id]?.selected);
  if (!selected.length) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Selected for Testing</div><p>Return to Step 1 and select the controls you want to test. Record results after reviewing test procedures in Step 2.</p></div>`;
    return;
  }
  body.innerHTML = `
    <div class="section-title">Record Test Results</div>
    <div class="section-subtitle">Enter test results and evidence for each selected control.</div>
    <div class="controls-list scroll-area">
      ${selected.map(c => {
        const tr = state.controlTestResults[c.id]||{};
        return `
        <div class="ctrl-row" style="flex-direction:column; align-items:stretch; gap:8px;">
          <div style="display:flex; gap:10px; align-items:center;">
            <span class="cr-id">${c.id}</span>
            <span style="font-weight:600; flex:1;">${c.n}</span>
            ${chipHTML(tr.result||'—')}
          </div>
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px;">
            <div>
              <label class="form-label" style="font-size:11px;">Test Result</label>
              <select class="form-select" style="font-size:12px;" onchange="setTestField('${c.id}','result',this.value)">
                <option ${!tr.result?'selected':''}>— Select —</option>
                <option ${tr.result==='Pass'?'selected':''}>Pass</option>
                <option ${tr.result==='Partial'?'selected':''}>Partial</option>
                <option ${tr.result==='Fail'?'selected':''}>Fail</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size:11px;">Test Date</label>
              <input class="form-input" type="date" style="font-size:12px;" value="${tr.date||new Date().toISOString().slice(0,10)}"
                oninput="setTestField('${c.id}','date',this.value)">
            </div>
            <div>
              <label class="form-label" style="font-size:11px;">Tester Name</label>
              <input class="form-input" style="font-size:12px;" placeholder="Your name" value="${tr.tester||''}"
                oninput="setTestField('${c.id}','tester',this.value)">
            </div>
          </div>
          <div>
            <label class="form-label" style="font-size:11px;">Evidence / Findings</label>
            <input class="form-input" style="font-size:12px;" placeholder="Evidence reference and any findings noted..." value="${tr.findings||''}"
              oninput="setTestField('${c.id}','findings',this.value)">
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function saveTestResults() { goToStep('tester', 4); }

function renderTesterStep4() {
  const body = document.getElementById('tester-step-4-body');
  if (!body) return;
  const selected = getActiveControls().filter(c => state.controlTestResults[c.id]?.selected);
  const passed = selected.filter(c => state.controlTestResults[c.id]?.result==='Pass');
  const failed = selected.filter(c => state.controlTestResults[c.id]?.result==='Fail');
  const partial = selected.filter(c => state.controlTestResults[c.id]?.result==='Partial');
  const untested = selected.filter(c => !state.controlTestResults[c.id]?.result || state.controlTestResults[c.id]?.result==='— Select —');

  body.innerHTML = `
    <div class="section-title">Findings &amp; Test Report</div>
    <div class="section-subtitle">Summary of test results and deficiencies requiring remediation.</div>
    <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr); margin-bottom:20px;">
      <div class="metric-card"><div class="mc-value" style="color:var(--green);">${passed.length}</div><div class="mc-label">Passed</div></div>
      <div class="metric-card"><div class="mc-value" style="color:var(--amber);">${partial.length}</div><div class="mc-label">Partial</div></div>
      <div class="metric-card"><div class="mc-value" style="color:var(--red);">${failed.length}</div><div class="mc-label">Failed</div></div>
      <div class="metric-card"><div class="mc-value" style="color:var(--slate);">${untested.length}</div><div class="mc-label">Not Recorded</div></div>
    </div>
    ${failed.length > 0 ? `
    <div style="margin-bottom:20px;">
      <strong style="font-size:14px; color:var(--red);">⚠️ Failed Controls — Remediation Required</strong>
      <div class="controls-list" style="margin-top:10px;">
        ${failed.map(c => {
          const tr = state.controlTestResults[c.id]||{};
          return `<div class="ctrl-row">
            <span class="cr-id">${c.id}</span>
            <span style="flex:1; font-size:13px;">${c.n}</span>
            <span class="chip chip-red">FAIL</span>
            <span style="font-size:12px; color:var(--text-muted); max-width:200px; text-overflow:ellipsis; overflow:hidden;">${tr.findings||'No details'}</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
    <div class="info-alert" style="background:#f0fdf4; border-color:#bbf7d0;">
      <div class="ia-icon">📄</div>
      <div class="ia-text" style="color:#166534;">Click "Finalize Test Report" to lock in these results. Failed controls will appear as open findings in the Reports dashboard.</div>
    </div>`;
}

function finalizeTestReport() {
  state.testReportFinalized = true;
  state.testReportDate = new Date().toLocaleDateString();
  showToast('✅ Test report finalized! Results are now in the Reports dashboard.');
}

// ============================================================
// TEST ADEQUACY VIEW — Control Testing Frequency & Progress
// ============================================================
function openTestAdequacyView(controlId) {
  const ctrl = CONTROLS.find(c => c.id === controlId);
  if (!ctrl) return;

  // Default test frequencies per family
  const defaultFrequencies = {
    AC: 'Quarterly', AT: 'Annual', AU: 'Monthly', CA: 'Quarterly',
    CM: 'Monthly', CP: 'Annual', IA: 'Monthly', IR: 'Annual',
    MA: 'Quarterly', MP: 'Annual', PE: 'Quarterly', PL: 'Annual',
    PM: 'Annual', PS: 'Annual', PT: 'Annual', RA: 'Annual',
    SA: 'Quarterly', SC: 'Monthly', SI: 'Monthly', SR: 'Annual'
  };

  const freq = defaultFrequencies[ctrl.f] || 'Quarterly';
  const adequacy = state.testAdequacy && state.testAdequacy[controlId] || {
    frequency: freq,
    completedTests: 0,
    requiredTests: 4,
    lastTest: null,
    nextTestDue: null
  };

  const overlay = document.createElement('div');
  overlay.id = 'testAdequacyOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:white;border-radius:12px;padding:32px;width:520px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
      <h2 style="margin:0 0 24px 0;color:var(--navy);font-size:18px;">${ctrl.id} — Test Adequacy</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div style="border:1px solid var(--border);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Testing Frequency</div>
          <div style="font-size:16px;font-weight:700;color:var(--teal);">${adequacy.frequency}</div>
        </div>
        <div style="border:1px solid var(--border);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Last Test</div>
          <div style="font-size:14px;color:var(--text);">${adequacy.lastTest ? new Date(adequacy.lastTest).toLocaleDateString() : 'Never'}</div>
        </div>
      </div>

      <div style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px;">Test Progress (${adequacy.completedTests}/${adequacy.requiredTests})</div>
        <div style="display:grid;grid-template-columns:repeat(${adequacy.requiredTests},1fr);gap:8px;">
          ${Array.from({length: adequacy.requiredTests}, (_, i) => `
            <div style="aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:${i < adequacy.completedTests ? 'var(--green)' : 'var(--border)'};color:${i < adequacy.completedTests ? 'white' : 'var(--text-muted)'};">
              ${i < adequacy.completedTests ? '✓' : (i+1)}
            </div>
          `).join('')}
        </div>
      </div>

      ${adequacy.nextTestDue ? `
      <div style="background:rgba(13,148,136,0.05);border:1px solid rgba(13,148,136,0.2);border-radius:8px;padding:12px;margin-bottom:24px;font-size:13px;color:var(--text);">
        Next test due: <strong>${new Date(adequacy.nextTestDue).toLocaleDateString()}</strong>
      </div>
      ` : ''}

      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button onclick="document.getElementById('testAdequacyOverlay').remove()" style="padding:10px 20px;border:1px solid var(--border);background:white;border-radius:6px;cursor:pointer;">Close</button>
        <button onclick="recordTestExecution('${controlId}'); document.getElementById('testAdequacyOverlay').remove();" style="padding:10px 20px;background:var(--teal);color:white;border:none;border-radius:6px;cursor:pointer;">Record Test</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function recordTestExecution(controlId) {
  if (!state.testAdequacy) state.testAdequacy = {};
  const adequacy = state.testAdequacy[controlId] || {
    frequency: 'Quarterly',
    completedTests: 0,
    requiredTests: 4,
    lastTest: null,
    nextTestDue: null
  };
  adequacy.completedTests = (adequacy.completedTests || 0) + 1;
  adequacy.lastTest = new Date().toISOString();
  // Calculate next test due based on frequency
  const now = new Date();
  const freq = adequacy.frequency;
  let nextDue = new Date(now);
  if (freq.includes('Monthly')) nextDue.setMonth(nextDue.getMonth() + 1);
  else if (freq.includes('Quarterly')) nextDue.setMonth(nextDue.getMonth() + 3);
  else if (freq.includes('Annual')) nextDue.setFullYear(nextDue.getFullYear() + 1);
  adequacy.nextTestDue = nextDue.toISOString();
  state.testAdequacy[controlId] = adequacy;
  markDirty();
  showToast('✅ Test execution recorded for ' + controlId);
}

// ============================================================
// REPORTS & PROGRAM DASHBOARD
// renderProgramDashboard (CISO overview card), renderReports
// (full reports tab), renderPolicyRoadmap (Gantt),
// openCISOReview / cisoApprovePolicy / cisoReturnPolicy (modal).
// ============================================================
function openCISOReview(fam) {
  const title = getPolicyMergedTitle(fam);
  const allFams = getPolicyAllFamilies(fam);
  const owner = state.domainOwners[fam] || {};
  const dp = (state.domainPolicies || {})[fam] || {};
  const revHistory = (dp.revisionHistory || []).slice().reverse();
  const badges = allFams.map(f => '<span class="family-badge" style="font-size:11px;padding:2px 6px;">' + f + '</span>').join(' ');
  const purpose = dp.purpose || ((DOMAIN_DEFAULTS[fam]||DOMAIN_DEFAULT_GENERIC).purpose || '');
  const scope = dp.scope || ((DOMAIN_DEFAULTS[fam]||DOMAIN_DEFAULT_GENERIC).scope || '');
  const requirements = dp.requirements || [];

  const existingOverlay = document.getElementById('cisoReviewOverlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'cisoReviewOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 20px;';

  overlay.innerHTML = `
    <div style="background:white;border-radius:16px;width:820px;max-width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.2);overflow:hidden;">
      <!-- Header -->
      <div style="background:var(--navy);padding:20px 28px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">${badges}</div>
          <div style="font-size:20px;font-weight:800;color:white;">${title}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:2px;">Submitted by ${escapeHTML(owner.name||'—')} · ${escapeHTML(owner.role||'')}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:6px;font-weight:600;">Routed for review to: ${escapeHTML(getPolicyPendingReviewerDisplay(fam))}</div>
        </div>
        <button onclick="document.getElementById('cisoReviewOverlay').remove()" style="background:rgba(255,255,255,0.12);border:none;color:white;font-size:18px;cursor:pointer;border-radius:8px;padding:6px 12px;line-height:1;">✕</button>
      </div>

      <!-- Policy Content Preview -->
      <div style="padding:24px 28px;border-bottom:1px solid var(--border);max-height:360px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Purpose</div>
        <div style="font-size:13px;color:var(--navy);line-height:1.7;margin-bottom:16px;">${escapeHTML(purpose||'—')}</div>
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Scope</div>
        <div style="font-size:13px;color:var(--navy);line-height:1.7;margin-bottom:16px;">${escapeHTML(scope||'—')}</div>
        ${requirements.length ? `
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Policy Requirements (${requirements.length})</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${requirements.slice(0,5).map(r=>{
            var reqControls = getRequirementControlIds(r);
            var reqBadges = buildRequirementControlBadgeHtml(reqControls, 6);
            var reqText = stripRequirementNistRef(r.text || r.requirement || '');
            return `<div style="font-size:13px;color:var(--navy);padding:10px 12px;background:var(--bg);border-radius:6px;border-left:3px solid var(--teal);">${reqBadges ? `<div style="margin-bottom:5px;display:flex;flex-wrap:wrap;gap:3px;">${reqBadges}</div>` : ''}${escapeHTML(reqText)}</div>`;
          }).join('')}
          ${requirements.length > 5 ? `<div style="font-size:12px;color:var(--text-muted);padding:4px 0;">…and ${requirements.length - 5} more requirements</div>` : ''}
        </div>` : '<div style="font-size:13px;color:var(--text-muted);">Policy content not yet drafted (Step 3 incomplete).</div>'}
        ${revHistory.length ? `
        <div style="margin-top:16px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Revision History</div>
          ${revHistory.map(r=>`<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${r.date} · v${r.version} · ${escapeHTML(r.changes||'')}</div>`).join('')}
        </div>` : ''}
      </div>

      <!-- Review Action Panel -->
      <div style="padding:24px 28px;">
        <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:10px;">Review Notes</div>
        <textarea id="cisoReviewNotes" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:12px;font-size:13px;resize:vertical;min-height:80px;font-family:inherit;" placeholder="Add your review notes here — required when returning to submitter, optional when approving…"></textarea>
        <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
          <button onclick="document.getElementById('cisoReviewOverlay').remove()" style="padding:10px 20px;border:1px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:var(--text-muted);">Cancel</button>
          <button onclick="cisoReturnPolicy('${fam}')" style="padding:10px 20px;border:1px solid rgba(239,68,68,0.4);border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:var(--red);">↩ Return to ${escapeHTML(owner.name||'Submitter')}</button>
          <button onclick="cisoApprovePolicy('${fam}')" style="padding:10px 20px;border:none;border-radius:8px;background:var(--teal);cursor:pointer;font-size:13px;font-weight:700;color:white;">✓ Approve Policy</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
}

function cisoApprovePolicy(fam) {
  if (!state.policyStatus) state.policyStatus = {};
  const notes = document.getElementById('cisoReviewNotes')?.value.trim() || '';
  var approverTitle = state.programOwnerTitle || 'CISO';
  var prev = state.policyStatus[fam] || {};
  state.policyStatus[fam] = {
    status: 'Approved',
    approvedBy: state.programOwner || approverTitle,
    approvedDate: new Date().toISOString().slice(0, 10),
    notes: notes,
    submittedAt: prev.submittedAt || '',
    submittedTo: prev.submittedTo || '',
    submittedToRole: prev.submittedToRole || '',
    submittedToEmail: prev.submittedToEmail || ''
  };
  // Add to revision history
  if (!state.domainPolicies) state.domainPolicies = {};
  if (!state.domainPolicies[fam]) state.domainPolicies[fam] = {};
  if (!state.domainPolicies[fam].revisionHistory) state.domainPolicies[fam].revisionHistory = [];
  state.domainPolicies[fam].revisionHistory.push({ version: '1.0', date: new Date().toISOString().slice(0,10), author: state.programOwner||approverTitle, changes: 'Approved by ' + approverTitle + '.' + (notes ? ' Notes: ' + notes : '') });
  markDirty();
  document.getElementById('cisoReviewOverlay')?.remove();
  showToast('✅ Policy approved — ' + getPolicyMergedTitle(fam));
  renderReports();
}

function cisoReturnPolicy(fam) {
  const notes = document.getElementById('cisoReviewNotes')?.value.trim() || '';
  if (!notes) { showToast('Please add review notes before returning the policy.', true); return; }
  if (!state.policyStatus) state.policyStatus = {};
  var prevR = state.policyStatus[fam] || {};
  var retBy = state.programOwner || (state.programOwnerTitle || 'CISO');
  state.policyStatus[fam] = {
    status: 'Returned',
    returnedDate: new Date().toISOString().slice(0, 10),
    returnedBy: retBy,
    notes: notes,
    submittedAt: prevR.submittedAt || '',
    submittedTo: prevR.submittedTo || '',
    submittedToRole: prevR.submittedToRole || '',
    submittedToEmail: prevR.submittedToEmail || ''
  };
  if (!state.domainPolicies) state.domainPolicies = {};
  if (!state.domainPolicies[fam]) state.domainPolicies[fam] = {};
  if (!state.domainPolicies[fam].revisionHistory) state.domainPolicies[fam].revisionHistory = [];
  state.domainPolicies[fam].revisionHistory.push({ version: 'R', date: new Date().toISOString().slice(0,10), author: state.programOwner||(state.programOwnerTitle||'CISO'), changes: 'Returned for revision by ' + (state.programOwnerTitle||'CISO') + '. Notes: ' + notes });
  markDirty();
  document.getElementById('cisoReviewOverlay')?.remove();
  showToast('↩ Policy returned to submitter — ' + getPolicyMergedTitle(fam));
  renderReports();
}

function renderProgramDashboard(controls, families) {
  const baseline    = state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High';
  const privSuffix  = state.privacyOverlay ? ' + Privacy' : '';
  const policyFams  = families.filter(f => f !== 'PM');

  // ── Authoritative count for banner (NIST 800-53B baseline, PM shown separately) ──
  const pmSelected  = Object.values(state.pmControls||{}).filter(Boolean).length;
  const authCount   = BASELINE_COUNTS[state.baseline] || controls.length;
  const pmSuffix    = pmSelected ? ' + ' + pmSelected + ' PM' : '';

  // ── Policy stats ──
  const polApproved   = policyFams.filter(f => (state.policyStatus[f]||{}).status === 'Approved').length;
  const polInReview   = policyFams.filter(f => (state.policyStatus[f]||{}).status === 'Under Review');
  const polDraft      = policyFams.filter(f => (state.policyStatus[f]||{}).status === 'Draft').length;
  const polReturned   = policyFams.filter(f => (state.policyStatus[f]||{}).status === 'Returned').length;
  const polNotStarted = policyFams.filter(f => !['Approved','Under Review','Draft','Returned'].includes((state.policyStatus[f]||{}).status)).length;
  const polPct        = policyFams.length ? Math.round((polApproved/policyFams.length)*100) : 0;

  // ── Control stats ──
  // Use authoritative NIST count as the total (abbreviated CONTROLS array is a representative subset)
  const ctrlTotal       = authCount + pmSelected;
  const ctrlImplemented = controls.filter(c => (state.controlStatus[c.id]||{}).status === 'Implemented').length;
  const ctrlInProgress  = controls.filter(c => (state.controlStatus[c.id]||{}).status === 'In Progress').length;
  const ctrlPlanned     = controls.filter(c => (state.controlStatus[c.id]||{}).status === 'Planned').length;
  const ctrlNA          = controls.filter(c => (state.controlStatus[c.id]||{}).status === 'Not Applicable').length;
  const ctrlNotStarted  = ctrlTotal - ctrlImplemented - ctrlInProgress - ctrlPlanned - ctrlNA;
  const implPct         = ctrlTotal ? Math.round((ctrlImplemented/ctrlTotal)*100) : 0;
  const ctrlInScope     = ctrlTotal - ctrlNA;
  const approvedObjectiveControls = new Set();
  function addApprovedObjectiveControls(requirements) {
    (requirements || []).forEach(function(req) {
      var mapped = [];
      if (req) {
        if (Array.isArray(req.controls)) mapped = req.controls;
        else if (typeof req.controls === 'string' && req.controls.trim()) mapped = [req.controls];
        else if (typeof req.controlId === 'string' && req.controlId.trim()) mapped = [req.controlId];
      }
      mapped.forEach(function(cid) {
        var normalized = String(cid || '').trim().toUpperCase();
        if (normalized) approvedObjectiveControls.add(normalized);
      });
    });
  }
  Object.keys(state.domainPolicies || {}).forEach(function(fam) {
    var status = ((state.policyStatus || {})[fam] || {}).status;
    if (status !== 'Approved') return;
    addApprovedObjectiveControls(((state.domainPolicies || {})[fam] || {}).requirements);
  });
  if (getISPStatus() === 'Approved') {
    addApprovedObjectiveControls(((state.infoSecPolicy || {}).requirements || []));
  }
  const withObjective = controls.filter(function(c) {
    if ((state.controlStatus[c.id] || {}).status === 'Not Applicable') return false;
    return approvedObjectiveControls.has(String(c.id || '').trim().toUpperCase());
  }).length;
  const objectivePct = ctrlInScope ? Math.round((withObjective / ctrlInScope) * 100) : 0;
  const withoutObjective = Math.max(0, ctrlInScope - withObjective);

  // ── Asset SSP stats ──
  const allAssets    = state.assets || [];
  const sspAttest    = state.sspAttestations || {};
  const sspSign      = state.sspSignoffs || {};
  let sspTotalCtrl = 0, sspDoneCtrl = 0, sspSubmitted = 0, sspApproved = 0;
  allAssets.forEach(function(a) {
    var ac = getAssetSSPControls(a);
    var at = sspAttest[a.id] || {};
    var sg = sspSign[a.id]   || {};
    sspTotalCtrl += ac.length;
    sspDoneCtrl  += ac.filter(function(c){ return at[c.id] && at[c.id].status; }).length;
    if (sg.status === 'Submitted') sspSubmitted++;
    if (sg.status === 'Approved')  sspApproved++;
  });
  const sspReadyCount = sspSubmitted + sspApproved;
  const sspPct        = sspTotalCtrl ? Math.round(sspDoneCtrl / sspTotalCtrl * 100) : 0;
  const sspLabel      = state.privacyOverlay ? 'SPSP' : 'SSP';

  // ── Activity counts ──
  const activeTasks = ctrlPlanned + ctrlInProgress + polDraft + polInReview.length;
  const underReview = polInReview.length + ctrlInProgress;
  var polReviewNames = [];
  polInReview.forEach(function(f) {
    var w = getPolicyPendingReviewerDisplay(f);
    if (w && polReviewNames.indexOf(w) === -1) polReviewNames.push(w);
  });
  const polReviewFooterSuffix = polInReview.length && polReviewNames.length
    ? ' · ' + polReviewNames.map(function(n) { return escapeHTML(n); }).join('; ')
    : '';

  // ── HTML builder helpers ──
  function pBar(pct, color) {
    return '<div style="height:7px;background:rgba(15,31,61,0.07);border-radius:4px;overflow:hidden;margin:8px 0 12px;">'
      + '<div style="height:100%;background:' + color + ';width:' + Math.min(pct,100) + '%;border-radius:4px;transition:width 0.5s ease;"></div></div>';
  }
  function dot(color, label, count) {
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#4b5563;">'
      + '<span style="width:8px;height:8px;border-radius:50%;background:' + color + ';flex-shrink:0;"></span>'
      + escapeHTML(label) + ' (' + count + ')</span>';
  }

  // ── Awaiting-approval inbox rows ──
  const awaitingHTML = polInReview.map(fam => {
    const o = state.domainOwners[fam] || {};
    const title = getPolicyMergedTitle(fam);
    const allFams = getPolicyAllFamilies(fam);
    const badges = allFams.map(f => '<span class="family-badge" style="font-size:10px;padding:1px 5px;">' + f + '</span>').join(' ');
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border);">'
      + '<div style="display:flex;gap:10px;align-items:center;">'
      + '<span style="font-size:16px;flex-shrink:0;">📄</span>'
      + '<div><div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' + badges + '</div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--navy);">' + escapeHTML(title) + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Submitted by ' + escapeHTML(o.name||fam) + '</div>'
      + '<div style="font-size:11px;color:#6366f1;margin-top:4px;font-weight:600;">With: ' + escapeHTML(getPolicyPendingReviewerDisplay(fam)) + '</div></div>'
      + '</div>'
      + '<button class="btn btn-secondary btn-sm" onclick="openCISOReview(\'' + fam + '\')">Review →</button>'
      + '</div>';
  }).join('');

  const deselectBaselineDash = controls.filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    if (cs.deselectDecision !== 'Approved') return false;
    var inBl = c.bl && (c.bl.indexOf(state.baseline) !== -1 || (state.privacyOverlay && c.bl.indexOf('P') !== -1));
    return inBl;
  }).length;

  return `
    <!-- ╔══ Phase 1 Complete banner ══╗ -->
    <div style="border:1px solid #86efac;border-radius:10px;background:linear-gradient(135deg,#f0fdf4,#e8fdf3);overflow:hidden;margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 16px;border-bottom:1px solid #86efac;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="background:#166534;color:white;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:0.6px;white-space:nowrap;">PHASE 1 · COMPLETE</span>
          <span style="font-size:13px;font-weight:700;color:#166534;">Establish Program Governance</span>
        </div>
        <span style="font-size:11px;color:#166534;opacity:0.75;">✓ All steps complete</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;">
        <div style="width:22px;height:22px;border-radius:50%;background:#166534;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:white;font-size:11px;font-weight:700;">✓</span>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#166534;">Establish Program Governance Setup Complete</div>
          <div style="font-size:11px;color:#15803d;margin-top:3px;">Your governance program foundation is in place — ${baseline}${privSuffix} baseline · ${authCount}${pmSuffix} controls across ${policyFams.length} families · Cyber Program Owner: <strong>${escapeHTML(state.programOwner||'—')}</strong></div>
        </div>
      </div>
    </div>

    ${deselectBaselineDash ? '<div class="callout-deselected-baseline" style="border:1px solid #f59e0b;background:#fffbeb;border-radius:10px;padding:12px 18px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.5;"><strong>Baseline scope note:</strong> ' + deselectBaselineDash + ' control(s) are formally <em>de-selected</em> from the active baseline. They remain in the catalog for audit traceability — open the Control Library and filter <strong>De-selected (baseline)</strong> to review them.</div>' : ''}

    <!-- ╔══ Executive Summary header ══╗ -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div style="font-size:16px;font-weight:800;color:var(--navy);">Executive Summary</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(13,148,136,0.09);border:1px solid rgba(13,148,136,0.2);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--teal);">🔔 Approvals${polInReview.length>0?' · '+polInReview.length:''}</span>
        <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(13,148,136,0.09);border:1px solid rgba(13,148,136,0.2);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--teal);">📋 Policy</span>
        <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(13,148,136,0.09);border:1px solid rgba(13,148,136,0.2);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--teal);">🔧 Controls</span>
        <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(13,148,136,0.09);border:1px solid rgba(13,148,136,0.2);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:var(--teal);">🎯 Objectives</span>
      </div>
    </div>

    <!-- ╔══ Main 2-col layout ══╗ -->
    <div style="display:grid;grid-template-columns:1fr 1.55fr;gap:20px;margin-bottom:18px;align-items:start;">

      <!-- LEFT: Awaiting Your Approval inbox -->
      <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:15px;">📬</span>
          <span style="font-size:14px;font-weight:700;color:var(--navy);">Awaiting Your Approval</span>
          ${polInReview.length > 0 ? '<span style="background:var(--red);color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:10px;">' + polInReview.length + '</span>' : ''}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;">Policies submitted for CISO sign-off</div>
        ${awaitingHTML || '<div style="text-align:center;padding:30px 16px;">'
          + '<div style="font-size:24px;margin-bottom:8px;">📭</div>'
          + '<div style="font-size:13px;font-weight:600;color:var(--navy);margin-bottom:4px;">Nothing awaiting approval</div>'
          + '<div style="font-size:11px;color:var(--text-muted);">Policy owners will submit domain policies here when ready for your review.</div>'
          + '</div>'}
      </div>

      <!-- RIGHT: Three stacked status cards -->
      <div style="display:flex;flex-direction:column;gap:14px;">

        <!-- Policy Status -->
        <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span>📋</span>
              <span style="font-size:13px;font-weight:700;color:var(--navy);">Policy Status</span>
            </div>
            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">${polApproved}/${policyFams.length}</span>
          </div>
          <div style="font-size:21px;font-weight:800;color:${polApproved===policyFams.length&&policyFams.length>0?'var(--green)':'var(--navy)'};">${polPct}% Approved</div>
          ${pBar(polPct,'var(--teal)')}
          <div style="display:flex;flex-wrap:wrap;gap:10px 16px;margin-bottom:12px;">
            ${dot('var(--green)','Approved',polApproved)}
            ${dot('var(--amber)','In Review',polInReview.length)}
            ${dot('#3b82f6','Draft',polDraft)}
            ${dot('#d1d5db','Not Started',polNotStarted)}
          </div>
          <div id="policy-roadmap-toggle" style="display:none;border-top:1px solid var(--border);padding-top:12px;">
            <button onclick="document.getElementById('policy-roadmap-chart').style.display=document.getElementById('policy-roadmap-chart').style.display==='none'?'block':'none';" style="background:none;border:none;cursor:pointer;color:var(--teal);font-size:12px;font-weight:700;padding:0;">📊 View Roadmap →</button>
            <div id="policy-roadmap-chart" style="display:none;margin-top:12px;max-height:280px;overflow-y:auto;font-size:12px;"></div>
          </div>
        </div>

        <!-- Control Implementation -->
        <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span>◎</span>
              <span style="font-size:13px;font-weight:700;color:var(--navy);">Control Implementation</span>
            </div>
            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">${ctrlImplemented}/${ctrlTotal}</span>
          </div>
          <div style="font-size:21px;font-weight:800;color:${implPct===100?'var(--green)':'var(--navy)'};">${implPct}% Implemented</div>
          ${pBar(implPct,'var(--green)')}
          <div style="display:flex;flex-wrap:wrap;gap:10px 16px;">
            ${dot('var(--green)','Implemented',ctrlImplemented)}
            ${dot('#3b82f6','In Review',ctrlInProgress)}
            ${dot('var(--amber)','Planned',ctrlPlanned)}
            ${dot('#d1d5db','Not Started',ctrlNotStarted)}
          </div>
        </div>

        <!-- Control Objectives / Scope -->
        <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span>🎯</span>
              <span style="font-size:13px;font-weight:700;color:var(--navy);">Control Objectives</span>
            </div>
            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">${withObjective}/${ctrlInScope}</span>
          </div>
          <div style="font-size:21px;font-weight:800;color:${objectivePct===100?'var(--green)':'var(--navy)'};">${objectivePct}% Established</div>
          ${pBar(objectivePct,'#86efac')}
          <div style="display:flex;flex-wrap:wrap;gap:10px 16px;">
            ${dot('var(--green)','With Objective',withObjective)}
            ${dot('var(--amber)','Without Objective',withoutObjective)}
            ${dot('#d1d5db','Not Applicable',ctrlNA)}
          </div>
        </div>

        <!-- Asset SSP Coverage -->
        <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span>🖥️</span>
              <span style="font-size:13px;font-weight:700;color:var(--navy);">Asset ${sspLabel} Coverage</span>
            </div>
            <span style="font-size:12px;color:var(--text-muted);font-weight:600;">${sspReadyCount}/${allAssets.length} submitted</span>
          </div>
          <div style="font-size:21px;font-weight:800;color:${sspPct===100&&allAssets.length>0?'var(--green)':'var(--navy)'};">${sspPct}% Attested</div>
          ${pBar(sspPct,'var(--teal)')}
          <div style="display:flex;flex-wrap:wrap;gap:10px 16px;">
            ${dot('var(--green)','Approved',sspApproved)}
            ${dot('var(--blue)','Submitted',sspSubmitted)}
            ${dot('var(--amber)','In Progress',allAssets.length - sspApproved - sspSubmitted - (allAssets.length - sspApproved - sspSubmitted > 0 ? allAssets.filter(function(a){ var s=(sspSign[a.id]||{}).status; return !s||s==='Not Started'; }).length : 0))}
            ${dot('var(--slate)','Not Started',allAssets.filter(function(a){ var s=(sspSign[a.id]||{}).status; return !s; }).length)}
          </div>
        </div>

      </div><!-- /right column -->
    </div><!-- /2-col grid -->

    <!-- ╔══ Footer: task count + roadmap ══╗ -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:rgba(15,31,61,0.03);border:1px solid var(--border);border-radius:8px;margin-bottom:20px;">
      <span style="font-size:12px;color:var(--text-muted);">
        <strong style="color:var(--navy);">${activeTasks}</strong> active tasks ·
        <strong style="color:var(--navy);">${underReview}</strong> under review${polReviewFooterSuffix}
      </span>
      <button style="background:none;border:none;cursor:pointer;color:var(--teal);font-size:12px;font-weight:700;padding:0;"
        onclick="document.getElementById('reports-body').querySelector('.metrics-grid')?.scrollIntoView({behavior:'smooth'})">
        View Roadmap →
      </button>
    </div>

    <!-- ╔══ Action items (only when there's something to do) ══╗ -->
    ${(function(){
      var items = [];
      if (polReturned) items.push({icon:'↩',color:'#ef4444',bg:'#fef2f2',border:'rgba(220,38,38,0.3)',label:polReturned+' polic'+(polReturned===1?'y':'ies')+' returned — needs reassignment',action:'showTab(\'policy\')'});
      if (polInReview.length) {
        var prNames = [];
        polInReview.forEach(function(f) {
          var w = getPolicyPendingReviewerDisplay(f);
          if (w && prNames.indexOf(w) === -1) prNames.push(w);
        });
        var prWho = prNames.length ? ' — with ' + prNames.map(function(n) { return escapeHTML(n); }).join(', ') : '';
        items.push({icon:'👁',color:'#6366f1',bg:'rgba(99,102,241,0.04)',border:'rgba(99,102,241,0.2)',label:polInReview.length+' polic'+(polInReview.length===1?'y':'ies')+' pending review' + prWho,action:'showTab(\'reports\')'});
      }
      var unowned = policyFams.filter(function(f){ var o=state.domainOwners[f]||{}; return !o.name||o.name===(DOMAIN_SUGGESTED_ROLES[f]||''); }).length;
      if (unowned) items.push({icon:'👤',color:'#f59e0b',bg:'#fffbeb',border:'rgba(245,158,11,0.3)',label:unowned+' domain'+(unowned===1?'':'s')+' still need an owner assigned',action:'goToDomainOwnersFromDashboard()'});
      if (!items.length) return '';
      return '<div style="margin-bottom:24px;display:flex;flex-direction:column;gap:8px;">'
        + items.map(function(it){
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid '+it.border+';border-radius:10px;background:'+it.bg+';">'
            + '<div style="display:flex;align-items:center;gap:10px;">'
            + '<span style="font-size:16px;">'+it.icon+'</span>'
            + '<span style="font-size:13px;font-weight:600;color:'+it.color+';">'+it.label+'</span>'
            + '</div>'
            + '<button class="btn btn-sm" style="background:'+it.color+';color:white;border:none;white-space:nowrap;" onclick="'+it.action+'">View →</button>'
            + '</div>';
        }).join('')
        + '</div>';
    })()}

    <!-- ── Divider before detailed reporting ── -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
      <div style="flex:1;height:1px;background:var(--border);"></div>
      <div style="font-size:10px;font-weight:800;letter-spacing:1.2px;color:var(--text-muted);text-transform:uppercase;">Detailed Reporting</div>
      <div style="flex:1;height:1px;background:var(--border);"></div>
    </div>
  `;
}

function getScopedFamilies() {
  if (!state.currentUserId) return getActiveFamilies();
  var user = (state.users||[]).find(function(u){ return u.id === state.currentUserId; });
  if (!user || !user.families || !user.families.length) return getActiveFamilies();
  if (user.role === 'issm' || user.role === 'custodian') return user.families;
  return getActiveFamilies();
}

// True when this login should see the org-level Reports executive block (domain policy approval queue, etc.).
function userSeesProgramExecutiveDashboard(user) {
  if (!user) return false;
  if (user.role === 'ciso' || user.role === 'admin') return true;
  var ids = state._currentPersonIds || [user.id];
  for (var i = 0; i < ids.length; i++) {
    var rec = (state.users || []).find(function(u) { return u.id === ids[i]; });
    if (rec && (rec.role === 'ciso' || rec.role === 'admin')) return true;
  }
  return false;
}


// ─── ASSET OWNER REPORTS VIEW ────────────────────────────────────────────────
// Full replacement for the reports tab when logged in as an asset-owner.
function renderAssetOwnerReport(user) {
  var myAssetIds = (user.assets || []).map(String);
  var myAssets   = (state.assets || []).filter(function(a){ return myAssetIds.includes(String(a.id)); });
  var sspLabel   = state.privacyOverlay ? 'SPSP' : 'SSP';

  // ── Aggregate stats ───────────────────────────────────────────────────────
  var totalControls  = 0;
  var totalAttested  = 0;
  var submitted      = 0;
  var approved       = 0;

  var assetRows = myAssets.map(function(a) {
    var controls = getAssetSSPControls(a);
    var attests  = (state.sspAttestations || {})[a.id] || {};
    var signoff  = (state.sspSignoffs    || {})[a.id]  || {};
    var done     = controls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    var pct      = controls.length ? Math.round(done / controls.length * 100) : 0;
    var status   = signoff.status === 'Approved'  ? 'Approved'
                 : signoff.status === 'Submitted' ? 'Submitted'
                 : done > 0 ? 'In Progress' : 'Not Started';
    var col      = status === 'Approved'  ? 'var(--green)'
                 : status === 'Submitted' ? 'var(--blue)'
                 : status === 'In Progress' ? 'var(--amber)' : 'var(--slate)';

    totalControls += controls.length;
    totalAttested += done;
    if (status === 'Submitted') submitted++;
    if (status === 'Approved')  approved++;

    return { a:a, controls:controls, done:done, pct:pct, status:status, col:col };
  });

  var overallPct  = totalControls ? Math.round(totalAttested / totalControls * 100) : 0;
  var readyCount  = submitted + approved;

  // ── Personal header card ──────────────────────────────────────────────────
  var roleMeta = ROLE_META['asset-owner'] || {};
  var html = '';

  html += '<div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #93c5fd;border-radius:12px;padding:20px;margin-bottom:20px;">'
    + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">'
    + '<span style="font-size:24px;">' + roleMeta.icon + '</span>'
    + '<div><div style="font-size:16px;font-weight:800;color:#1e3a5f;">' + _esc(user.name) + '</div>'
    + '<div style="font-size:12px;color:#2563eb;">Asset Owner — ' + myAssets.length + ' asset' + (myAssets.length !== 1 ? 's' : '') + ' in scope</div></div></div>'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">'
    + '<div style="background:white;border-radius:8px;padding:12px;text-align:center;">'
    +   '<div style="font-size:22px;font-weight:800;color:' + (overallPct >= 80 ? 'var(--green)' : overallPct >= 40 ? 'var(--amber)' : '#dc2626') + ';">' + overallPct + '%</div>'
    +   '<div style="font-size:11px;color:var(--text-muted);">Attestation Progress</div></div>'
    + '<div style="background:white;border-radius:8px;padding:12px;text-align:center;">'
    +   '<div style="font-size:22px;font-weight:800;color:var(--navy);">' + totalAttested + '<span style="font-size:13px;font-weight:400;color:var(--text-muted);">/' + totalControls + '</span></div>'
    +   '<div style="font-size:11px;color:var(--text-muted);">Controls Attested</div></div>'
    + '<div style="background:white;border-radius:8px;padding:12px;text-align:center;">'
    +   '<div style="font-size:22px;font-weight:800;color:' + (readyCount === myAssets.length && myAssets.length > 0 ? 'var(--green)' : 'var(--navy)') + ';">' + readyCount + '<span style="font-size:13px;font-weight:400;color:var(--text-muted);">/' + myAssets.length + '</span></div>'
    +   '<div style="font-size:11px;color:var(--text-muted);">SSPs Submitted</div></div>'
    + '<div style="background:white;border-radius:8px;padding:12px;text-align:center;">'
    +   '<div style="font-size:22px;font-weight:800;color:' + (totalControls - totalAttested === 0 ? 'var(--green)' : 'var(--amber)') + ';">' + (totalControls - totalAttested) + '</div>'
    +   '<div style="font-size:11px;color:var(--text-muted);">Pending Attestations</div></div>'
    + '</div></div>';

  // ── Per-asset SSP status table ────────────────────────────────────────────
  html += '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:20px;">'
    + '<div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:14px;">My ' + sspLabel + ' Status</div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:2px solid var(--border);">'
    + '<th style="text-align:left;padding:6px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Asset</th>'
    + '<th style="text-align:left;padding:6px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Type</th>'
    + '<th style="text-align:center;padding:6px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Controls</th>'
    + '<th style="padding:6px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Progress</th>'
    + '<th style="text-align:center;padding:6px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Status</th>'
    + '<th style="text-align:center;padding:6px 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">Action</th>'
    + '</tr></thead><tbody id="tbod-${Math.random().toString(36).slice(2,8)}">';

  assetRows.forEach(function(r) {
    html += '<tr style="border-bottom:1px solid var(--border);">'
      + '<td style="padding:10px 8px;font-weight:600;color:var(--navy);">' + _esc(r.a.name || 'Unnamed')
      +   '<div style="font-size:11px;font-weight:400;color:var(--text-muted);margin-top:1px;">' + sspLabel + (r.a.description ? ' · ' + _esc(r.a.description.substring(0,60)) + (r.a.description.length > 60 ? '…' : '') : '') + '</div></td>'
      + '<td style="padding:10px 8px;font-size:12px;color:var(--text-muted);">' + _esc(r.a.type || '—') + '</td>'
      + '<td style="padding:10px 8px;text-align:center;font-weight:600;">' + (r.controls.length || '<span style="color:var(--text-muted);">—</span>') + '</td>'
      + '<td style="padding:10px 8px;min-width:140px;">'
      +   '<div style="display:flex;align-items:center;gap:6px;">'
      +     '<div style="flex:1;background:var(--border);border-radius:3px;height:5px;overflow:hidden;"><div style="height:100%;background:' + r.col + ';width:' + r.pct + '%;border-radius:3px;"></div></div>'
      +     '<span style="font-size:11px;font-weight:600;color:' + r.col + ';min-width:30px;text-align:right;">' + r.pct + '%</span>'
      +   '</div>'
      +   '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + r.done + ' / ' + r.controls.length + ' attested</div>'
      + '</td>'
      + '<td style="padding:10px 8px;text-align:center;">'
      +   '<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:10px;background:' + r.col + '22;color:' + r.col + ';white-space:nowrap;">' + r.status + '</span>'
      + '</td>'
      + '<td style="padding:10px 8px;text-align:center;">'
      +   '<button class="btn btn-secondary btn-sm" onclick="openAssetWizardFromLibrary(\'' + r.a.id + '\')" style="font-size:11px;padding:4px 10px;">Open ' + sspLabel + ' →</button>'
      + '</td>'
      + '</tr>';
  });

  if (!assetRows.length) {
    html += '<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--text-muted);">No assets assigned yet.</td></tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

// True when the logged-in viewer should see ISP "awaiting approval" on Reports (CISO/program owner path — not the dedicated approver dashboard).
function shouldShowISPApprovalCallout(user) {
  var p = (state.policyStatus || {}).ISP || {};
  if (p.status !== 'Under Review') return false;
  if (!state.currentUserId) return true;
  if (!user) return false;
  if (user.role === 'ciso' || user.role === 'admin') return true;
  var sub = String(p.submittedTo || '').trim().toLowerCase();
  if (sub && String(user.name || '').trim().toLowerCase() === sub) return true;
  return false;
}

function renderISPApprovalCallout(user) {
  if (!shouldShowISPApprovalCallout(user)) return '';
  var p = (state.policyStatus || {}).ISP || {};
  var title = (state.infoSecPolicy && state.infoSecPolicy.title) || 'Information Security Policy';
  return '<div style="margin-bottom:20px;border:1px solid rgba(99,102,241,0.35);background:rgba(99,102,241,0.06);border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">'
    + '<div><div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;">Action required</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--navy);margin-top:4px;">Information Security Policy is awaiting your approval</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + escapeHTML(title)
    + (p.submittedAt ? ' · Routed for review on ' + escapeHTML(p.submittedAt) : '') + '</div></div>'
    + '<button type="button" class="btn btn-primary btn-sm" onclick="showTab(\'policy\');goToCISOPolicyEditor();">Review & approve →</button>'
    + '</div>';
}

function renderMyDashboard(controls, families) {
  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  if (!user) return '';
  var roleMeta = ROLE_META[user.role] || {};
  var scopedControls = getScopedControls();
  var scopedStatuses = scopedControls.reduce(function(acc, c) {
    var s = (state.controlStatus[c.id]||{}).status||'Not Started';
    acc[s] = (acc[s]||0) + 1; return acc;
  }, {});
  var myImpl = scopedStatuses['Implemented']||0;
  var myTotal = scopedControls.length;
  var myPct = myTotal ? Math.round(myImpl/myTotal*100) : 0;
  var myFamilies = (user.families||[]).filter(function(f){ return f !== 'PM'; });

  // Count overdue items
  var overdue = 0;
  scopedControls.forEach(function(c) {
    var co = (state.controlOwners||{})[c.id] || {};
    if (co.dueDate && co.dueDate < new Date().toISOString().slice(0,10)) overdue++;
  });

  // Pending review count (for ISSM)
  var pendingReview = 0;
  if (user.role === 'issm' || user.role === 'ciso') {
    pendingReview = (state.controlReviewQueue||[]).filter(function(r) {
      if (user.role !== 'issm') return true;
      var fam = (r.controlId||'').replace(/-.*/, '');
      return (user.families||[]).includes(fam);
    }).length;
  }

  return '<div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #93c5fd;border-radius:12px;padding:20px;margin-bottom:20px;">'
    + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">'
    + '<span style="font-size:24px;">' + (roleMeta.icon||'\uD83D\uDC64') + '</span>'
    + '<div><div style="font-size:16px;font-weight:800;color:#1e3a5f;">' + escapeHTML(user.name) + '</div>'
    + '<div style="font-size:12px;color:#2563eb;">' + escapeHTML(roleMeta.label||user.role) + (myFamilies.length ? ' \u2014 ' + myFamilies.join(', ') : '') + '</div></div></div>'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">'
    + '<div style="background:white;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#166534;">' + myPct + '%</div><div style="font-size:11px;color:var(--text-muted);">My Coverage</div></div>'
    + '<div style="background:white;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:800;color:var(--navy);">' + myImpl + '<span style="font-size:13px;font-weight:400;color:var(--text-muted);">/' + myTotal + '</span></div><div style="font-size:11px;color:var(--text-muted);">Implemented</div></div>'
    + '<div style="background:white;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:800;color:' + (overdue?'#dc2626':'#166534') + ';">' + overdue + '</div><div style="font-size:11px;color:var(--text-muted);">Overdue</div></div>'
    + (pendingReview ? '<div style="background:white;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:800;color:#6366f1;">' + pendingReview + '</div><div style="font-size:11px;color:var(--text-muted);">Pending Review</div></div>' : '<div style="background:white;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:800;color:var(--navy);">' + myFamilies.length + '</div><div style="font-size:11px;color:var(--text-muted);">My Families</div></div>')
    + '</div></div>';
}

function toggleReportsView() {
  state._reportsMyView = !state._reportsMyView;
  renderReports();
}

// ── ISP Approval actions (for 'approver' role) ────────────────────────────
function approveISP() {
  var notes = (document.getElementById('isp-approver-notes') || {}).value || '';
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.policyReviewCycle) state.policyReviewCycle = {};
  var rc = state.policyReviewCycle.ISP || (state.policyReviewCycle.ISP = {});
  var prev = state.policyStatus.ISP || {};
  var approverUser = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var approverName = approverUser ? approverUser.name : (rc.approvedBy || 'Approver');
  state.policyStatus.ISP = {
    status: 'Approved',
    approvedBy: approverName,
    approvedDate: new Date().toISOString().slice(0,10),
    approvedAt: new Date().toISOString().slice(0,10),
    notes: notes,
    submittedAt: prev.submittedAt || '',
    submittedTo: prev.submittedTo || rc.approvedBy || '',
    submittedToRole: prev.submittedToRole || rc.approverRole || '',
    submittedToEmail: prev.submittedToEmail || rc.approverEmail || ''
  };
  rc.approvalDate = new Date().toISOString().slice(0,10);
  rc.lastReviewed = new Date().toISOString().slice(0,10);
  if (state.infoSecPolicy) {
    if (!state.infoSecPolicy.revisionHistory) state.infoSecPolicy.revisionHistory = [];
    var ver = '1.' + state.infoSecPolicy.revisionHistory.length;
    state.infoSecPolicy.revisionHistory.push({ version: ver, date: new Date().toISOString().slice(0,10), author: approverName, changes: 'Approved.' + (notes ? ' Notes: ' + notes : '') });
  }
  try { addAuditEntry('policy', 'ISP', 'ISP approved by ' + approverName); } catch(e) {}
  markDirty();
  showToast('\u2705 Information Security Policy approved.');
  goToCISOPolicyEditor();
}

function returnISPToEditor() {
  var notes = (document.getElementById('isp-approver-notes') || {}).value || '';
  if (!notes) { showToast('Please add return comments before returning the policy.', true); return; }
  if (!state.policyStatus) state.policyStatus = {};
  var prev = state.policyStatus.ISP || {};
  state.policyStatus.ISP = {
    status: 'Returned',
    returnedDate: new Date().toISOString().slice(0,10),
    notes: notes,
    submittedAt: prev.submittedAt || '',
    submittedTo: prev.submittedTo || '',
    submittedToRole: prev.submittedToRole || '',
    submittedToEmail: prev.submittedToEmail || ''
  };
  try { addAuditEntry('policy', 'ISP', 'ISP returned with comments: ' + notes); } catch(e) {}
  markDirty();
  showToast('\u21A9 ISP returned to editor with comments.');
  goToCISOPolicyEditor();
}

// ── Approver-role dashboard ────────────────────────────────────────────────
function renderApproverDashboard(user) {
  var isp = state.infoSecPolicy;
  var ispSt = ((state.policyStatus||{}).ISP || {}).status || (isp && isp.title ? 'Under Review' : 'Not Started');
  var rc = (state.policyReviewCycle||{}).ISP || {};
  var submittedBy = rc.submittedTo ? '' : (state.programOwner || 'CISO');
  var approvedDate = ((state.policyStatus||{}).ISP || {}).approvedDate || '';

  var stChip = ispSt === 'Approved'
    ? '<span style="background:rgba(13,148,136,0.1);border:1px solid rgba(13,148,136,0.3);color:var(--teal);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">Approved</span>'
    : ispSt === 'Under Review'
    ? '<span style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);color:#6366f1;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">Pending Your Approval</span>'
    : ispSt === 'Returned'
    ? '<span style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#dc2626;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">Returned</span>'
    : '<span style="background:rgba(100,116,139,0.08);border:1px solid var(--border);color:var(--text-muted);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">Not Started</span>';

  var html = '<div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #93c5fd;border-radius:12px;padding:20px;margin-bottom:20px;">'
    + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">'
    + '<span style="font-size:24px;">\u2705</span>'
    + '<div><div style="font-size:16px;font-weight:800;color:#1e3a5f;">' + escapeHTML(user.name) + '</div>'
    + '<div style="font-size:12px;color:#2563eb;">Policy Approver \u2014 ISP</div></div></div></div>';

  html += '<div style="max-width:700px;">';
  html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:12px;">Your Approval Queue</div>';

  if (!isp || !isp.title) {
    html += '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:32px;text-align:center;">'
      + '<div style="font-size:32px;margin-bottom:12px;">\uD83D\uDCCB</div>'
      + '<div style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:6px;">No policy awaiting approval</div>'
      + '<div style="font-size:13px;color:var(--text-muted);">The CISO has not yet submitted the Information Security Policy for review.</div>'
      + '</div>';
  } else {
    html += '<div style="background:white;border:1px solid ' + (ispSt==='Under Review'?'rgba(99,102,241,0.3)':'var(--border)') + ';border-radius:10px;padding:20px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
      + '<div><span style="font-family:monospace;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:4px;margin-right:8px;">ISP</span>'
      + '<span style="font-size:15px;font-weight:700;color:var(--navy);">' + escapeHTML(isp.title||'Information Security Policy') + '</span></div>'
      + stChip
      + '</div>';

    if (rc.submittedDate || submittedBy) {
      html += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Submitted by ' + escapeHTML(state.programOwner||'CISO') + (rc.submittedDate ? ' on ' + rc.submittedDate : '') + '</div>';
    }

    html += '<button class="btn btn-secondary btn-sm" style="margin-bottom:16px;" onclick="goToCISOPolicyEditor()">📋 View Full Policy →</button>';

    if (ispSt === 'Under Review') {
      html += '<div style="border-top:1px solid var(--border);padding-top:16px;">'
        + '<div style="font-size:12px;font-weight:600;color:var(--navy);margin-bottom:6px;">Review Notes (required to return, optional to approve)</div>'
        + '<textarea id="isp-approver-notes" class="form-input" rows="3" style="font-size:13px;resize:vertical;margin-bottom:12px;" placeholder="Add any notes or conditions for approval…"></textarea>'
        + '<div style="display:flex;gap:10px;">'
        + '<button class="btn btn-sm" style="background:white;border:1px solid rgba(239,68,68,0.4);color:#dc2626;font-weight:600;" onclick="returnISPToEditor()">↩ Return with Comments</button>'
        + '<button class="btn btn-primary btn-sm" onclick="approveISP()">✅ Approve Policy</button>'
        + '</div></div>';
    } else if (ispSt === 'Approved') {
      html += '<div style="font-size:12px;color:var(--teal);font-weight:600;">\u2713 Approved' + (approvedDate ? ' on ' + approvedDate : '') + '</div>';
    } else if (ispSt === 'Returned') {
      html += '<div style="font-size:12px;color:#dc2626;font-weight:600;">\u21A9 Returned — awaiting revision from ' + escapeHTML(state.programOwner||'CISO') + '</div>';
    }

    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderReports() {
  const body = document.getElementById('reports-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">\uD83D\uDCCA</div><div class="es-title">Reports Unavailable \u2014 Setup Required</div><p>The CISO must complete all 4 program setup steps (baseline selection, PM controls, security policy, and role assignments) before reports can be generated. Go to the CISO tab to continue.</p></div>`;
    return;
  }

  // Always use scoped data for non-admin roles — no toggle needed
  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var isScoped = !!user && user.role !== 'admin';
  var showMyView = isScoped; // always scoped for non-admin, always full for admin

  const controls = showMyView ? getScopedControls() : getActiveControls();
  const families = showMyView ? getScopedFamilies() : getActiveFamilies();

  // Asset-owners get a completely different SSP-focused view
  var isAssetOwnerRole = user && user.role === 'asset-owner';
  if (isAssetOwnerRole && showMyView) {
    body.innerHTML = renderAssetOwnerReport(user);
    return;
  }

  // Approvers get a focused ISP approval queue — not the program-wide dashboard
  var isApproverRole = user && user.role === 'approver';
  if (isApproverRole && showMyView) {
    body.innerHTML = renderApproverDashboard(user);
    return;
  }

  // Empty state for scoped users with no assignments
  if (showMyView && controls.length === 0 && families.length === 0) {
    var uName = user ? user.name.split(' ')[0] : 'there';
    body.innerHTML = '<div class="empty-state"><div class="es-icon">\uD83D\uDCCA</div><div class="es-title">Welcome, ' + escapeHTML(uName) + '</div>'
      + '<p>No controls or policy domains have been assigned to you yet. Once your CISO or ISSM assigns work to you, your personal dashboard and reports will appear here.</p></div>';
    return;
  }

  const statuses = controls.reduce((acc, c) => {
    const s = (state.controlStatus[c.id]||{}).status||'Not Started';
    acc[s] = (acc[s]||0) + 1; return acc;
  }, {});
  const implemented = statuses['Implemented']||0;
  const planned = statuses['Planned']||0;
  const notStarted = statuses['Not Started']||0;
  const notApplicable = statuses['Not Applicable']||0;
  const policyStatuses = families.reduce((acc, f) => {
    const s = (state.policyStatus[f]||{}).status||'Not Started';
    acc[s] = (acc[s]||0)+1; return acc;
  }, {});
  const testResults = Object.values(state.controlTestResults||{});
  const passed = testResults.filter(r=>r.result==='Pass').length;
  const failed = testResults.filter(r=>r.result==='Fail').length;
  // Use the same control set everywhere on the dashboard — the `controls` array
  // from getActiveControls()/getScopedControls() already includes PM controls
  // that apply to the selected baseline. Adding state.pmControls on top of that
  // double-counts them, causing the "Total in Scope" card to exceed the sum of
  // the Implementation-Status bars.
  const authTotalInReports = controls.length;
  const coveragePct = authTotalInReports ? Math.round((implemented/authTotalInReports)*100) : 0;

  var postSetupCallout = '';
  if (!user && state.cisoComplete) {
    postSetupCallout = '<div style="background:linear-gradient(135deg,#ecfdf5,#f0fdf4);border:1px solid #86efac;border-radius:12px;padding:18px 22px;margin-bottom:22px;max-width:920px;">'
      + '<div style="font-size:15px;font-weight:800;color:#14532d;margin-bottom:8px;">Program setup is complete</div>'
      + '<div style="font-size:13px;color:#166534;line-height:1.6;margin-bottom:14px;">Choose a <strong>workspace</strong> in the sidebar to build domain policies, document controls, manage assets, or run tests. This screen is your program-wide dashboard and reports.</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:10px;">'
      + '<button type="button" class="btn btn-primary" onclick="goToPoliciesHome()">Open domain policies</button>'
      + '<button type="button" class="btn btn-secondary" onclick="showTab(\'users\')">Users &amp; roles</button>'
      + '<button type="button" class="btn btn-secondary" onclick="exportProgramJson()">Export JSON backup</button>'
      + '</div></div>';
  }

  var showProgramExecDashboard = !user || userSeesProgramExecutiveDashboard(user);
  body.innerHTML = `
    ${postSetupCallout}
    ${isScoped && showMyView ? renderMyDashboard(controls, families) : ''}
    ${renderISPApprovalCallout(user)}
    ${showProgramExecDashboard ? renderProgramDashboard(controls, families) : ''}
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="mc-value">${authTotalInReports}</div>
        <div class="mc-label">Total Controls in Scope</div>
        <div class="mc-sub" style="color:var(--text-muted);">${state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High'}${state.privacyOverlay?'+Privacy':''} Baseline</div>
      </div>
      <div class="metric-card">
        <div class="mc-value" style="color:var(--green);">${coveragePct}%</div>
        <div class="mc-label">Implementation Coverage</div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${coveragePct}%"></div></div>
      </div>
      <div class="metric-card">
        <div class="mc-value" style="color:${policyStatuses['Approved']>0?'var(--green)':'var(--amber)'};">${policyStatuses['Approved']||0}</div>
        <div class="mc-label">Approved Policies</div>
        <div class="mc-sub" style="color:var(--text-muted);">of ${families.length} total domains</div>
      </div>
      <div class="metric-card">
        <div class="mc-value" style="color:${failed===0?'var(--green)':'var(--red)'};">${failed}</div>
        <div class="mc-label">Open Test Findings</div>
        <div class="mc-sub" style="color:var(--green);">${passed} passed</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
      <div style="background:white; border:1px solid var(--border); border-radius:10px; padding:20px;">
        <div style="font-weight:700; font-size:14px; margin-bottom:14px; color:var(--navy);">Control Implementation Status</div>
        ${[['Implemented',implemented,'var(--green)'],['Planned',planned,'var(--amber)'],['Not Started',notStarted,'var(--red)'],['Not Applicable',notApplicable,'var(--slate)']].map(([label,count,color])=>`
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <span style="width:100px; font-size:13px;">${label}</span>
          <div style="flex:1; background:var(--border); border-radius:4px; height:10px; overflow:hidden;">
            <div style="height:100%; background:${color}; width:${authTotalInReports?Math.round(count/authTotalInReports*100):0}%; border-radius:4px;"></div>
          </div>
          <span style="font-size:13px; font-weight:600; min-width:30px; text-align:right;">${count}</span>
        </div>`).join('')}
      </div>
      <div style="background:white; border:1px solid var(--border); border-radius:10px; padding:20px;">
        <div style="font-weight:700; font-size:14px; margin-bottom:14px; color:var(--navy);">Policy Status</div>
        ${[['Approved',policyStatuses['Approved']||0,'var(--green)'],['Under Review',policyStatuses['Under Review']||0,'var(--amber)'],['Returned',policyStatuses['Returned']||0,'#dc2626'],['Draft',policyStatuses['Draft']||0,'var(--blue)'],['Not Started',policyStatuses['Not Started']||families.length-(policyStatuses['Approved']||0)-(policyStatuses['Under Review']||0)-(policyStatuses['Draft']||0)-(policyStatuses['Returned']||0),'var(--slate)']].map(([label,count,color])=>`
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <span style="width:100px; font-size:13px;">${label}</span>
          <div style="flex:1; background:var(--border); border-radius:4px; height:10px; overflow:hidden;">
            <div style="height:100%; background:${color}; width:${families.length?Math.round(count/families.length*100):0}%; border-radius:4px;"></div>
          </div>
          <span style="font-size:13px; font-weight:600; min-width:30px; text-align:right;">${count}</span>
        </div>`).join('')}
      </div>
    </div>

    <div style="background:white; border:1px solid var(--border); border-radius:10px; padding:20px; margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:700; font-size:14px; color:var(--navy);">Control Inventory</div>
        <div style="display:flex; gap:8px;">
          <input type="text" id="reportSearch" placeholder="Search..." style="padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px;" oninput="filterReportTable()">
          <select id="reportFamFilter" style="padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px;" onchange="filterReportTable()">
            <option value="">All Families</option>
            ${families.map(f=>`<option value="${f}">${f}</option>`).join('')}
          </select>
          <select id="reportStatusFilter" style="padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px;" onchange="filterReportTable()">
            <option value="">All Statuses</option>
            <option>Not Started</option><option>Planned</option><option>Implemented</option><option>Not Applicable</option>
          </select>
        </div>
      </div>
      <div class="table-scroll">
        <table class="control-table" id="reportControlTable">
          <thead>
            <tr>
              <th style="width:80px;">ID</th>
              <th>Control Name</th>
              <th style="width:70px;">Family</th>
              <th>Baselines</th>
              <th style="width:130px;">Impl. Status</th>
              <th style="width:100px;">Test Result</th>
            </tr>
          </thead>
          <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">
            ${controls.map(c => {
              const cs = state.controlStatus[c.id]||{};
              const tr = state.controlTestResults[c.id]||{};
              return `<tr data-id="${c.id}" data-family="${c.f}" data-status="${cs.status||'Not Started'}">
                <td><span class="control-id">${c.id}</span></td>
                <td>${c.n}</td>
                <td><span class="family-badge">${c.f}</span></td>
                <td>${pillsHTML(c.bl)}</td>
                <td>${chipHTML(cs.status||'Not Started')}</td>
                <td>${tr.result ? chipHTML(tr.result) : '<span style="color:var(--text-muted); font-size:12px;">Not tested</span>'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div style="background:white; border:1px solid var(--border); border-radius:10px; padding:20px; margin-bottom:20px;">
      <div style="font-weight:700; font-size:14px; margin-bottom:16px; color:var(--navy);">Per-Family Implementation Breakdown</div>
      <div class="table-scroll">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="border-bottom:2px solid var(--border);">
              <th style="text-align:left; padding:10px; font-weight:600;">Family</th>
              <th style="text-align:center; padding:10px; font-weight:600;">Policy</th>
              <th style="text-align:center; padding:10px; font-weight:600;">Controls</th>
              <th style="text-align:center; padding:10px; font-weight:600;">Implemented</th>
              <th style="text-align:center; padding:10px; font-weight:600;">In Progress</th>
              <th style="text-align:center; padding:10px; font-weight:600;">Not Started</th>
              <th style="text-align:center; padding:10px; font-weight:600;">Coverage</th>
            </tr>
          </thead>
          <tbody id="tbod-${Math.random().toString(36).slice(2,8)}">
            ${families.map(fam => {
              const famControls = controls.filter(c => c.f === fam);
              const implemented = famControls.filter(c => (state.controlStatus[c.id]||{}).status === 'Implemented').length;
              const planned = famControls.filter(c => (state.controlStatus[c.id]||{}).status === 'Planned').length;
              const notStarted = famControls.filter(c => (state.controlStatus[c.id]||{}).status === 'Not Started').length;
              const policyStatus = (state.policyStatus[fam]||{}).status || 'Not Started';
              const coverage = famControls.length ? Math.round((implemented / famControls.length) * 100) : 0;
              return `<tr style="border-bottom:1px solid var(--border);">
                <td style="padding:12px 10px; font-weight:600;">${fam}</td>
                <td style="padding:12px 10px; text-align:center;">${chipHTML(policyStatus)}</td>
                <td style="padding:12px 10px; text-align:center; font-weight:600;">${famControls.length}</td>
                <td style="padding:12px 10px; text-align:center; color:var(--green); font-weight:600;">${implemented}</td>
                <td style="padding:12px 10px; text-align:center; color:var(--amber); font-weight:600;">${planned}</td>
                <td style="padding:12px 10px; text-align:center; color:var(--red); font-weight:600;">${notStarted}</td>
                <td style="padding:12px 10px; text-align:center;"><span style="background:${coverage===100?'var(--green-light)':coverage>=50?'var(--amber-light)':'var(--red-light)'};padding:4px 8px; border-radius:4px; font-weight:600;">${coverage}%</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Populate policy roadmap, review queue, and audit trail after HTML is rendered
  setTimeout(() => { renderReviewQueuePanel(); renderPolicyRoadmap(families); renderAuditTrailPanel(); }, 100);
}

function renderPolicyRoadmap(families) {
  const toggle = document.getElementById('policy-roadmap-toggle');
  const chart = document.getElementById('policy-roadmap-chart');
  if (!toggle || !chart || !families || families.length === 0) return;

  const today = new Date();
  const sixMonthsOut = new Date(today.getTime() + 180*24*60*60*1000);

  // Get policy data with deadlines
  const policies = families.filter(f => f !== 'PM').map(fam => {
    const status = (state.policyStatus[fam]||{}).status || 'Not Started';
    const deadline = state.domainDeadlines[fam] || deadlineFromPriority(fam);
    const deadlineDate = new Date(deadline);
    const progress = status === 'Approved' ? 100 : status === 'Under Review' ? 60 : status === 'Draft' ? 30 : 0;
    const isOverdue = deadlineDate < today && progress < 100;
    const title = getPolicyMergedTitle(fam);
    return { fam, title, status, deadline, deadlineDate, progress, isOverdue };
  }).sort((a, b) => a.deadlineDate - b.deadlineDate);

  // Show toggle if there are policies
  toggle.style.display = policies.length > 0 ? 'block' : 'none';

  // ── Roll-up by calendar month ──────────────────────────────────
  // Group policies into month buckets, then render one bar per bucket.
  const buckets = {};
  const bucketOrder = [];
  policies.forEach(function(p) {
    const key = p.deadline.slice(0, 7); // 'YYYY-MM'
    if (!buckets[key]) { buckets[key] = { policies:[], date: p.deadlineDate }; bucketOrder.push(key); }
    buckets[key].policies.push(p);
  });

  const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastBucketDate = buckets[bucketOrder[bucketOrder.length-1]]?.date || sixMonthsOut;
  const maxDate = new Date(lastBucketDate.getFullYear(), lastBucketDate.getMonth()+2, 1);
  const totalMs = maxDate - minDate || 1;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let ganttHTML = '<div style="margin-top:8px;">';
  bucketOrder.forEach(function(key) {
    const bucket  = buckets[key];
    const ps      = bucket.policies;
    const bucketMs = bucket.date - minDate;
    const barWidth = Math.max(4, Math.min(100, (bucketMs / totalMs) * 100));

    // Bucket status: worst-case colour (overdue > not-started > in-progress > approved)
    const hasOverdue  = ps.some(function(p){ return p.isOverdue; });
    const hasApproved = ps.every(function(p){ return p.status === 'Approved'; });
    const hasReview   = ps.some(function(p){ return p.status === 'Under Review'; });
    const barColor = hasOverdue ? 'var(--red)' : hasApproved ? 'var(--green)' : hasReview ? 'var(--amber)' : '#3b82f6';

    const yr = key.slice(0,4), mo = parseInt(key.slice(5),10)-1;
    const label = monthNames[mo] + ' ' + yr;
    const famsLabel = ps.map(function(p){ return p.fam; }).join(', ');
    const countLabel = ps.length + ' ' + (ps.length===1?'policy':'policies');

    ganttHTML += '<div style="margin-bottom:10px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">'
      + '<span style="font-size:12px;font-weight:700;color:var(--navy);">' + label + '</span>'
      + '<span style="font-size:10px;color:var(--text-muted);">' + countLabel + '</span>'
      + '</div>'
      + '<div style="font-size:10px;color:var(--text-muted);margin-bottom:3px);font-family:monospace;">' + escapeHTML(famsLabel) + '</div>'
      + '<div style="height:20px;background:rgba(15,31,61,0.08);border-radius:4px;overflow:hidden;">'
      + '<div style="height:100%;background:' + barColor + ';width:' + barWidth + '%;border-radius:3px;transition:width 0.4s;"></div>'
      + '</div>'
      + '</div>';
  });
  ganttHTML += '</div>';

  chart.innerHTML = ganttHTML;
}

function filterReportTable() {
  const selectAll = document.getElementById('select-all-controls');
  if (selectAll) selectAll.checked = false;
  const selectAllMain = document.getElementById('select-all');
  if (selectAllMain) selectAllMain.checked = false;

  const q = (document.getElementById('reportSearch')?.value||'').toLowerCase();
  const fam = document.getElementById('reportFamFilter')?.value||'';
  const st = document.getElementById('reportStatusFilter')?.value||'';
  document.querySelectorAll('#reportControlTable tbody tr').forEach(row => {
    const id = row.dataset.id||'';
    const family = row.dataset.family||'';
    const status = row.dataset.status||'';
    const name = row.cells[1]?.textContent.toLowerCase()||'';
    row.style.display = (
      (!q || id.toLowerCase().includes(q) || name.includes(q)) &&
      (!fam || family===fam) &&
      (!st || status===st)
    ) ? '' : 'none';
  });
}

function printReport() {
  window.print();
}

function renderAuditTrailPanel() {
  // Append audit trail panel to reports body if it exists
  var body = document.getElementById('reports-body');
  if (!body) return;
  var existing = document.getElementById('auditTrailPanel');
  if (existing) existing.remove();
  var entries = (state.auditTrail || []);
  var fieldCount = (state.changeLog || []).length;
  var mode = state._auditTrailUiMode === 'fields' ? 'fields' : 'events';
  var panel = document.createElement('div');
  panel.id = 'auditTrailPanel';
  panel.style.cssText = 'background:white;border:1px solid var(--border);border-radius:10px;padding:20px;margin-top:20px;';
  var modeRow = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;align-items:center;">'
    + '<span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">View</span>'
    + '<button type="button" class="btn btn-sm ' + (mode === 'events' ? 'btn-primary' : 'btn-secondary') + '" style="font-size:11px;" onclick="setAuditTrailUiMode(\'events\')">Semantic events</button>'
    + '<button type="button" class="btn btn-sm ' + (mode === 'fields' ? 'btn-primary' : 'btn-secondary') + '" style="font-size:11px;" onclick="setAuditTrailUiMode(\'fields\')">Field-level changes</button>'
    + '</div>';
  var eventFilters = mode === 'events'
    ? '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">'
      + '<button type="button" class="btn btn-sm btn-secondary" onclick="filterAuditView(\'all\')" style="font-size:11px;">All</button>'
      + '<button type="button" class="btn btn-sm btn-secondary" onclick="filterAuditView(\'program\')" style="font-size:11px;">Program</button>'
      + '<button type="button" class="btn btn-sm btn-secondary" onclick="filterAuditView(\'policy\')" style="font-size:11px;">Policy</button>'
      + '<button type="button" class="btn btn-sm btn-secondary" onclick="filterAuditView(\'control\')" style="font-size:11px;">Controls</button>'
      + '</div>'
    : '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px;align-items:flex-end;">'
      + '<div><label class="form-label" style="font-size:10px;">User / id contains</label>'
      + '<input class="form-input" style="font-size:12px;min-width:160px;" placeholder="e.g. admin" value="' + escapeHTML(state._changeLogUserFilter || '') + '" oninput="setChangeLogUserFilter(this.value)"></div>'
      + '<div><label class="form-label" style="font-size:10px;">Date contains</label>'
      + '<input class="form-input" style="font-size:12px;min-width:140px;" placeholder="2026-04" value="' + escapeHTML(state._changeLogDateFilter || '') + '" oninput="setChangeLogDateFilter(this.value)"></div>'
      + '</div>';
  panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:10px;">'
    + '<div style="font-weight:700;font-size:14px;color:var(--navy);">Activity &amp; change log</div>'
    + '<div style="font-size:12px;color:var(--text-muted);">' + entries.length + ' events · ' + fieldCount + ' field edits (retained)</div>'
    + '</div>'
    + modeRow
    + eventFilters
    + '<div id="auditTrailContent"></div>';
  body.appendChild(panel);
  syncAuditTrailPanelContent();
}

function filterAuditView(type) {
  state._auditTrailEventCatFilter = type || 'all';
  syncAuditTrailPanelContent();
}

// ── Attestation Review Queue (for CISO / ISSM on Reports) ──────────────
function renderReviewQueuePanel() {
  var body = document.getElementById('reports-body');
  if (!body) return;
  var existing = document.getElementById('reviewQueuePanel');
  if (existing) existing.remove();

  var queue = (state.controlReviewQueue || []);
  // Scope queue to current user's families if ISSM
  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  if (user && user.role === 'issm' && user.families && user.families.length) {
    queue = queue.filter(function(r) {
      var fam = r.family || (r.controlId||'').replace(/-.*/, '');
      return user.families.includes(fam);
    });
  }
  // Only show for admin, ciso, issm
  if (user && user.role !== 'ciso' && user.role !== 'issm') return;
  if (!queue.length) return;

  var panel = document.createElement('div');
  panel.id = 'reviewQueuePanel';
  panel.style.cssText = 'background:white;border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:20px;';

  var rows = queue.map(function(r) {
    var ctrl = CONTROLS.find(function(c){ return c.id === r.controlId; });
    var cs = (state.controlStatus||{})[r.controlId] || {};
    var owner = (state.controlOwners||{})[r.controlId] || {};
    var submitted = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '';
    var statusColor = cs.status === 'Implemented' ? '#16a34a' : cs.status === 'In Progress' ? '#f59e0b' : '#6b7280';
    return '<tr style="border-bottom:1px solid rgba(0,0,0,0.05);">'
      + '<td style="padding:8px 10px;font-family:monospace;font-weight:700;font-size:12px;">' + escapeHTML(r.controlId) + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + escapeHTML(ctrl ? ctrl.n : '') + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + escapeHTML(r.submittedBy || owner.name || '') + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;color:' + statusColor + ';font-weight:600;">' + escapeHTML(cs.status || 'Unknown') + '</td>'
      + '<td style="padding:8px 10px;font-size:11px;color:var(--text-muted);">' + submitted + '</td>'
      + '<td style="padding:8px 6px;text-align:right;white-space:nowrap;">'
      + '<button class="btn btn-sm" style="background:#16a34a;color:white;border:none;font-size:11px;padding:3px 8px;margin-right:4px;" onclick="reviewQueueAction(\'' + r.controlId + '\',\'approve\')">Approve</button>'
      + '<button class="btn btn-sm" style="background:#f59e0b;color:white;border:none;font-size:11px;padding:3px 8px;" onclick="reviewQueueAction(\'' + r.controlId + '\',\'return\')">Request Evidence</button>'
      + '</td></tr>';
  }).join('');

  panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
    + '<div style="display:flex;align-items:center;gap:10px;">'
    + '<span style="font-size:18px;">\uD83D\uDCCB</span>'
    + '<div><div style="font-weight:700;font-size:14px;color:var(--navy);">Attestation Review Queue</div>'
    + '<div style="font-size:12px;color:var(--text-muted);">' + queue.length + ' control' + (queue.length===1?'':'s') + ' awaiting your review</div></div></div>'
    + '<button class="btn btn-sm btn-secondary" style="font-size:11px;" onclick="approveAllReviewQueue()">Approve All</button>'
    + '</div>'
    + '<div class="table-scroll"><table style="width:100%;border-collapse:collapse;">'
    + '<thead><tr style="background:#f8fafc;border-bottom:1px solid var(--border);">'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);">Control</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);">Name</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);">Submitted By</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);">Status</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);">Date</th>'
    + '<th style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text-muted);">Action</th>'
    + '</tr></thead><tbody id="tbod-${Math.random().toString(36).slice(2,8)}">' + rows + '</tbody></table></div>';

  // Insert at the top of reports body, before metrics
  body.insertBefore(panel, body.firstChild);
}

function reviewQueueAction(controlId, action) {
  if (action === 'approve') {
    // Remove from queue, mark as reviewed
    state.controlReviewQueue = (state.controlReviewQueue||[]).filter(function(r){ return r.controlId !== controlId; });
    addAuditEntry('control', controlId, 'Attestation approved');
    showToast('\u2705 ' + controlId + ' approved');
  } else if (action === 'return') {
    // Mark as needing evidence, keep in queue with updated status
    var item = (state.controlReviewQueue||[]).find(function(r){ return r.controlId === controlId; });
    if (item) item.status = 'Evidence Requested';
    addAuditEntry('control', controlId, 'Additional evidence requested');
    showToast('\u26A0\uFE0F Evidence request sent for ' + controlId);
  }
  renderReviewQueuePanel();
}

function approveAllReviewQueue() {
  var queue = state.controlReviewQueue || [];
  if (!queue.length) return;
  if (!confirm('Approve all ' + queue.length + ' pending attestations?')) return;
  queue.forEach(function(r) { addAuditEntry('control', r.controlId, 'Attestation approved (bulk)'); });
  state.controlReviewQueue = [];
  showToast('\u2705 All attestations approved');
  renderReviewQueuePanel();
}

// ============================================================
// USERS & ROLES
// ============================================================

const ROLE_META = {
  'ciso':          { label:'Program Owner',          icon:'🏛️', color:'#6366f1', desc:'Owns the Tier 1 Information Security Policy. High-level program oversight across all domains.' },
  'issm':          { label:'ISSM / Domain Policy Owner',    icon:'🛡️', color:'#0ea5e9', desc:'Drafts and maintains Tier 2 domain-level policies for assigned control families. Oversees ISSOs.' },
  'control-owner': { label:'Control Owner',                 icon:'🔧', color:'#f59e0b', desc:'Implements and attests assigned controls. Writes Tier 3 procedures and produces evidence.' },
  'asset-owner':   { label:'Asset Owner',                   icon:'🖥️', color:'#10b981', desc:'Completes and signs off System Security Plans (SSPs) for assigned assets.' },
  'custodian':     { label:'Policy Custodian',              icon:'📂', color:'#8b5cf6', desc:'Read-only view of assigned policies. Reviews and downloads policy documents.' },
  'approver':      { label:'Policy Approver (ISP)',         icon:'✅', color:'#059669', desc:'Signs off the Tier 1 Information Security Policy when routed for review. Uses Reports and the Policy Library — not the Domain policies workspace (Tier 2 ISSM drafting).' },
};


// Role-specific default workspaces
const ROLE_DEFAULT_TAB = {
  'ciso':          'ciso',
  'issm':          'policy',
  'control-owner': 'control',
  'asset-owner':   'asset',
  'custodian':     'policy',
  'approver':      'reports',
};

function showRolePicker() {
  const overlay = document.getElementById('rolePickerOverlay');
  if (!overlay) return;
  // Sync users from domain owners, control owners, etc. so the picker shows current data
  syncUsersFromState();
  // Update subtitle with org name if set
  const sub = document.getElementById('rolePickerSubtitle');
  if (sub) sub.textContent = 'Select your profile to continue';
  renderRolePickerProfiles();
  overlay.style.display = 'flex';
}

function renderRolePickerProfiles() {
  const container = document.getElementById('rolePickerProfiles');
  if (!container) return;
  if (!state.users || state.users.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:32px;color:rgba(255,255,255,0.35);font-size:14px;">'
      + 'No users have been added yet.<br><span style="font-size:12px;margin-top:6px;display:block;">An admin can add users in the Users &amp; Roles section.</span></div>';
    return;
  }

  // ── Group users by PERSON (name), merging roles ──
  var roleOrder = ['ciso','issm','control-owner','asset-owner','custodian'];
  var byPerson = {};
  var personOrder = [];
  state.users.forEach(function(u) {
    var key = (u.name || '').trim().toLowerCase();
    if (!key) return;
    if (!byPerson[key]) {
      byPerson[key] = { name: u.name, records: [], roles: [], primaryId: u.id };
      personOrder.push(key);
    }
    byPerson[key].records.push(u);
    if (byPerson[key].roles.indexOf(u.role) === -1) byPerson[key].roles.push(u.role);
  });

  // Sort people: CISO first, then by role priority
  personOrder.sort(function(a, b) {
    var ra = 99, rb = 99;
    byPerson[a].roles.forEach(function(r){ var i = roleOrder.indexOf(r); if (i !== -1 && i < ra) ra = i; });
    byPerson[b].roles.forEach(function(r){ var i = roleOrder.indexOf(r); if (i !== -1 && i < rb) rb = i; });
    return ra - rb;
  });

  // Build assignment text for a person across all their records
  var buildAssignText = function(records) {
    var parts = [];
    records.forEach(function(u) {
      if ((u.role === 'issm' || u.role === 'custodian') && u.families && u.families.length)
        parts.push(u.families.join(', '));
      else if (u.role === 'control-owner' && u.controls && u.controls.length)
        parts.push(u.controls.length + ' control(s)');
      else if (u.role === 'asset-owner' && u.assets && u.assets.length)
        parts.push(u.assets.length + ' asset(s)');
    });
    return parts.join(' · ');
  };

  var html = '';
  personOrder.forEach(function(key) {
    var person = byPerson[key];
    var primaryRole = person.roles[0] || 'custodian';
    // Find highest-priority role for the primary color
    for (var rp = 0; rp < roleOrder.length; rp++) {
      if (person.roles.indexOf(roleOrder[rp]) !== -1) { primaryRole = roleOrder[rp]; break; }
    }
    var pm = ROLE_META[primaryRole] || { label: primaryRole, icon:'👤', color:'#64748b', desc:'' };
    var assignText = buildAssignText(person.records);
    // Use the first record's ID for login — applyRoleView will find all sibling records by name
    var loginId = person.primaryId;

    html += '<div onclick="selectUserProfile(\'' + loginId + '\')" '
      + 'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;cursor:pointer;transition:all 0.15s;" '
      + 'onmouseenter="this.style.background=\'rgba(255,255,255,0.12)\';this.style.borderColor=\'' + pm.color + '\';" '
      + 'onmouseleave="this.style.background=\'rgba(255,255,255,0.06)\';this.style.borderColor=\'rgba(255,255,255,0.1)\';">'
      + '<div style="font-size:24px;margin-bottom:10px;">' + pm.icon + '</div>'
      + '<div style="color:white;font-weight:600;font-size:15px;margin-bottom:8px;">' + _esc(person.name) + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
    // Show a badge for each role this person holds
    person.roles.forEach(function(role) {
      var rm = ROLE_META[role] || { label: role, color:'#64748b' };
      html += '<span style="display:inline-block;background:' + rm.color + '22;color:' + rm.color + ';font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;">' + rm.label + '</span>';
    });
    html += '</div>';
    if (assignText) {
      html += '<div style="color:rgba(255,255,255,0.4);font-size:12px;font-family:monospace;">' + _esc(assignText) + '</div>';
    }
    html += '</div>';
  });

  container.innerHTML = html;
}

function selectUserProfile(userId) {
  if(typeof window !== 'undefined') {
    window.selectedControl = null;
    window.selectedDomain = null;
    if(state) state._policyDomain = null;
  }
  const rightPanel = document.getElementById('right-panel-content');
  if(rightPanel) rightPanel.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;">Loading user context...</div>';
  const origText = document.body.style.opacity;
  document.body.style.opacity = '0.7';
  setTimeout(() => { document.body.style.opacity = origText; }, 300);

  const overlay = document.getElementById('rolePickerOverlay');
  if (overlay) overlay.style.display = 'none';
  applyRoleView(userId);
  if (userId === 'admin') {
    showTab('ciso');
    showToast('🔑 Admin mode');
  } else {
    const u = state.users.find(function(x){ return x.id === userId; });
    if (u) showToast('👤 Signed in as ' + u.name);
  }
}

function applyRoleView(userId) {
  state.currentUserId = userId === 'admin' ? null : userId;
  const user = state.currentUserId ? state.users.find(function(u){ return u.id === state.currentUserId; }) : null;

  // Clear transient UI state to prevent stale selections from a different persona
  state._selectedCtrl      = null;
  state._policyDomain      = null;
  state._policyOwnerFilter = '';
  state._selectedAssetId   = null;
  state._selectedProcessId = null;

  // Update profile button label
  const btn = document.getElementById('profileBtn');
  if (btn) btn.textContent = user ? '👤 ' + user.name : '🔑 Admin';

  // Admin: show all tabs (including users & roles)
  if (!user) {
    TAB_IDS.forEach(function(id) {
      const nav = document.getElementById('nav-' + id);
      if (nav) nav.style.display = '';
    });
    const adminSection = document.getElementById('sidebar-users-section');
    if (adminSection) adminSection.style.display = '';
    return;
  }

  // Non-admin: hide Users & Roles nav and admin sidebar section
  const adminSection = document.getElementById('sidebar-users-section');
  if (adminSection) adminSection.style.display = 'none';

  // ── Merge tabs from ALL roles this person holds ──
  // Find every user record with the same name (case-insensitive)
  var nameKey = (user.name || '').trim().toLowerCase();
  var allRecords = (state.users || []).filter(function(u) {
    return u.name && u.name.trim().toLowerCase() === nameKey;
  });
  // Store sibling IDs so other code can check all roles for this person
  state._currentPersonIds = allRecords.map(function(u){ return u.id; });

  var allRoles = [];
  allRecords.forEach(function(rec) {
    var recRoles = (rec.roles && rec.roles.length) ? rec.roles : [rec.role];
    recRoles.forEach(function(r) {
      if (allRoles.indexOf(r) === -1) allRoles.push(r);
    });
  });

  var visible = getPersonVisibleTabIds(user);

  TAB_IDS.forEach(function(id) {
    const nav = document.getElementById('nav-' + id);
    if (nav) nav.style.display = visible.indexOf(id) !== -1 ? '' : 'none';
  });

  // Navigate to the highest-priority role's default tab (approver last — defaults to Reports)
  var rolePriority = ['ciso','issm','control-owner','asset-owner','custodian','approver'];
  var primaryRole = user.role;
  for (var rp = 0; rp < rolePriority.length; rp++) {
    if (allRoles.indexOf(rolePriority[rp]) !== -1) { primaryRole = rolePriority[rp]; break; }
  }
  var defaultTab = ROLE_DEFAULT_TAB[primaryRole] || visible[0] || 'reports';
  if (visible.indexOf(defaultTab) === -1) {
    defaultTab = visible.indexOf('reports') !== -1 ? 'reports' : (visible[0] || 'reports');
  }
  showTab(defaultTab);

  // For policy-based roles: pre-select first assigned family from any ISSM/custodian record
  var policyFams = [];
  allRecords.forEach(function(rec) {
    if ((rec.role === 'issm' || rec.role === 'custodian') && rec.families) {
      rec.families.forEach(function(f){ if (policyFams.indexOf(f) === -1) policyFams.push(f); });
    }
  });
  if (policyFams.length) {
    state._policyDomain = policyFams[0];
    state._policyOwnerFilter = '';
  }

  // For control owners: pre-select first assigned control from any control-owner record
  var ctrlIds = [];
  allRecords.forEach(function(rec) {
    if (rec.role === 'control-owner' && rec.controls) {
      rec.controls.forEach(function(c){ if (ctrlIds.indexOf(c) === -1) ctrlIds.push(c); });
    }
  });
  if (ctrlIds.length) {
    state._selectedCtrl = ctrlIds[0];
    goToStep('control', 1);
  }
}

// ---- User Sync ----

// Upsert a user by name (case-insensitive). If the person already exists:
//   - merges family/control assignments if the role matches
//   - fills in missing email
//   - marks as auto-generated
// If they don't exist, creates a new record.
function upsertUser(data) {
  if (!state.users) state.users = [];
  var nName = data.name.trim().toLowerCase();
  
  var existing = state.users.find(function(u) {
    return u.name.trim().toLowerCase() === nName;
  });

  if (existing) {
    if (data.email && !existing.email) existing.email = data.email;
    if (!existing.families) existing.families = [];
    if (!existing.controls) existing.controls = [];
    if (!existing.assets)   existing.assets   = [];
    
    if(!existing.roles) existing.roles = [existing.role];
    if(data.role && !existing.roles.includes(data.role)) existing.roles.push(data.role);
    
    (data.families || []).forEach(function(f) { if (!existing.families.includes(f)) existing.families.push(f); });
    (data.controls || []).forEach(function(c) { if (!existing.controls.includes(c)) existing.controls.push(c); });
    if (data.assets && data.assets.length>0) existing.assets = data.assets; 
    
    existing._autoGenerated = true;
  } else {
    state.users.push({
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      name: data.name.trim(),
      email: data.email || '',
      role: data.role,
      roles: [data.role],
      families: data.families || [],
      controls: data.controls || [],
      assets: data.assets || [],
      note: data.note || '',
      _autoGenerated: true,
    });
  }
}

// Reads all role assignments made throughout the wizard and syncs them
// into state.users. Called every time the Users tab is rendered so it
// is always up to date without needing explicit save hooks everywhere.
function syncUsersFromState() {
  // 1. Program Owner → CISO (include any domains they own directly)
  if (state.programOwner && state.programOwner.trim()) {
    var cisoFamilies = [];
    var cisoNameKey = state.programOwner.trim().toLowerCase();
    Object.keys(state.domainOwners || {}).forEach(function(fam) {
      var o = state.domainOwners[fam];
      if (o && o.name && o.name.trim().toLowerCase() === cisoNameKey) cisoFamilies.push(fam);
    });
    upsertUser({
      name: state.programOwner,
      email: state.programOwnerEmail || '',
      role: 'ciso',
      families: cisoFamilies,
      note: state.programOwnerTitle || '',
    });
  }

  // 2. Domain Owners → ISSM (aggregate multi-domain owners by name)
  //    Skip if this person is already the CISO (same name) to avoid duplicates
  //    First, clear auto-generated ISSM family assignments so reassignments take effect cleanly
  var cisoKey = (state.programOwner || '').trim().toLowerCase();
  if (state.users) {
    state.users.forEach(function(u) {
      if (u.role === 'issm' && u._autoGenerated) {
        u.families = [];
      }
    });
  }
  var issmByName = {};
  Object.keys(state.domainOwners || {}).forEach(function(fam) {
    var o = state.domainOwners[fam];
    if (!o || !o.name) return;
    var key = o.name.trim().toLowerCase();
    if (key === cisoKey) return;  // CISO already synced above — don't create a second entry
    if (!issmByName[key]) issmByName[key] = { name: o.name.trim(), email: o.email || '', families: [] };
    if (!issmByName[key].families.includes(fam)) issmByName[key].families.push(fam);
  });
  Object.keys(issmByName).forEach(function(k) {
    var d = issmByName[k];
    upsertUser({ name: d.name, email: d.email, role: 'issm', families: d.families });
  });

  // 3a. ISP Custodian (Tier 1 policy) → custodian
  var ispCust = state.infoSecPolicy && state.infoSecPolicy.custodian;
  if (ispCust && ispCust.name && ispCust.name.trim()) {
    upsertUser({ name: ispCust.name.trim(), email: ispCust.email || '', role: 'custodian', families: ['ISP'] });
  }

  // 3. Domain Policy Custodians → custodian (aggregate by name)
  var custByName = {};
  Object.keys(state.policyCustodians || {}).forEach(function(fam) {
    var entry = state.policyCustodians[fam];
    // support both legacy string format and new object format
    var name  = typeof entry === 'string' ? entry : (entry && entry.name) || '';
    var email = typeof entry === 'string' ? '' : (entry && entry.email) || '';
    var role  = typeof entry === 'string' ? '' : (entry && entry.role) || '';
    if (!name || !name.trim()) return;
    var key = name.trim().toLowerCase();
    if (!custByName[key]) custByName[key] = { name: name.trim(), email: email, role: role, families: [] };
    if (!custByName[key].families.includes(fam)) custByName[key].families.push(fam);
    // fill in email/role if we see them later for same person
    if (email && !custByName[key].email) custByName[key].email = email;
    if (role && !custByName[key].role) custByName[key].role = role;
  });
  Object.keys(custByName).forEach(function(k) {
    var d = custByName[k];
    upsertUser({ name: d.name, email: d.email, role: 'custodian', families: d.families });
  });

  // 4. Control Owners → control-owner (aggregate by name)
  var ctrlByName = {};
  Object.keys(state.controlOwners || {}).forEach(function(ctrlId) {
    var o = state.controlOwners[ctrlId];
    if (!o || !o.name) return;
    var key = o.name.trim().toLowerCase();
    if (!ctrlByName[key]) ctrlByName[key] = { name: o.name.trim(), email: o.email || '', controls: [] };
    if (!ctrlByName[key].controls.includes(ctrlId)) ctrlByName[key].controls.push(ctrlId);
  });
  Object.keys(ctrlByName).forEach(function(k) {
    var d = ctrlByName[k];
    upsertUser({ name: d.name, email: d.email, role: 'control-owner', controls: d.controls });
  });

  // 5. Policy Review Approvers (sync custom approvers different from default)
  Object.keys(state.policyReviewCycle || {}).forEach(function(policyKey) {
    var rc = state.policyReviewCycle[policyKey];
    if (!rc || !rc.approvedBy || !rc.approvedBy.trim()) return;

    // Default formal approver is the program owner (CISO) for both ISP and domain policies; ISSM is policy owner, not default approver.
    var defaultApproverName = (state.programOwner || '').trim();

    // Only create a user entry if the approver differs from the default
    var currentApproverName = rc.approvedBy.trim();
    var approverKey = currentApproverName.toLowerCase();
    if (approverKey === defaultApproverName.toLowerCase() || approverKey === cisoKey) return;

    upsertUser({ name: currentApproverName, email: rc.approverEmail || '', role: 'approver', families: [policyKey] });
  });

  // 6. Asset Owners → asset-owner (aggregate by name from state.assets)
  var assetOwnerByName = {};
  (state.assets || []).forEach(function(a) {
    if (!a.owner || !a.owner.trim()) return;
    var key = a.owner.trim().toLowerCase();
    if (!assetOwnerByName[key]) assetOwnerByName[key] = { name: a.owner.trim(), email: a.ownerEmail || '', assets: [] };
    assetOwnerByName[key].assets.push(a.id);
    if (a.ownerEmail && !assetOwnerByName[key].email) assetOwnerByName[key].email = a.ownerEmail;
  });
  Object.keys(assetOwnerByName).forEach(function(k) {
    var d = assetOwnerByName[k];
    upsertUser({ name: d.name, email: d.email, role: 'asset-owner', assets: d.assets });
  });
}

// ---- Users Tab Render ----

function renderUsersTab() {
  const body = document.getElementById('users-body');
  if (!body) return;

  // Pull in any roles assigned elsewhere in the wizard
  syncUsersFromState();

  const families = Object.keys(FAMILIES).sort();
  const allControls = CONTROLS || [];

  let html = '<div style="max-width:900px;">';

  // Summary bar
  const counts = {};
  (state.users || []).forEach(function(u){ counts[u.role] = (counts[u.role]||0)+1; });
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;">';
  Object.keys(ROLE_META).forEach(function(r) {
    const m = ROLE_META[r];
    html += '<div style="background:' + m.color + '18;border:1px solid ' + m.color + '44;border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;">'
      + '<span style="font-size:16px;">' + m.icon + '</span>'
      + '<span style="font-size:13px;font-weight:600;color:' + m.color + ';">' + (counts[r]||0) + '</span>'
      + '<span style="font-size:12px;color:#64748b;">' + m.label + '</span>'
      + '</div>';
  });
  html += '</div>';

  // Add user form (inline)
  html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;">'
    + '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:16px;">➕ Add New User</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Full Name *</label>'
    + '<input id="newUserName" placeholder="Jane Smith" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;" /></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Email</label>'
    + '<input id="newUserEmail" placeholder="jane@agency.gov" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;" /></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Role *</label>'
    + '<select id="newUserRole" onchange="renderNewUserAssignments()" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:white;">'
    + '<option value="">— select role —</option>'
    + Object.keys(ROLE_META).map(function(r){ return '<option value="' + r + '">' + ROLE_META[r].icon + ' ' + ROLE_META[r].label + '</option>'; }).join('')
    + '</select></div>'
    + '</div>'
    + '<div id="newUserAssignments" style="margin-bottom:12px;"></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Note (optional)</label>'
    + '<input id="newUserNote" placeholder="e.g. Primary contact for AC/IA domain" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;" /></div>'
    + '<div style="margin-top:16px;">'
    + '<button class="btn" onclick="saveNewUser()" style="padding:8px 20px;font-size:13px;">Add User</button>'
    + '</div>'
    + '</div>';

  // User list
  if (!state.users || state.users.length === 0) {
    html += '<div style="text-align:center;padding:48px;color:#94a3b8;font-size:14px;background:#f8fafc;border:1px dashed #e2e8f0;border-radius:12px;">'
      + '👥 No users added yet. Add your first user above.</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:12px;">';
    (state.users || []).forEach(function(u, idx) {
      const m = ROLE_META[u.role] || { label:u.role, icon:'👤', color:'#64748b' };
      const assignText = (u.role === 'issm' || u.role === 'custodian')
        ? (u.families && u.families.length ? u.families.map(function(f){ return '<span style="font-family:monospace;font-weight:700;">' + f + '</span>'; }).join(' ') : '<span style="color:#94a3b8;">No domains assigned</span>')
        : u.role === 'control-owner'
          ? (u.controls && u.controls.length ? u.controls.slice(0,6).map(function(c){ return '<span style="font-family:monospace;font-size:11px;background:#f1f5f9;padding:1px 5px;border-radius:3px;">' + c + '</span>'; }).join(' ') + (u.controls.length > 6 ? ' <span style="color:#94a3b8;">+' + (u.controls.length-6) + ' more</span>' : '') : '<span style="color:#94a3b8;">No controls assigned</span>')
          : '';
      html += '<div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;display:flex;align-items:center;gap:16px;">'
        + '<div style="font-size:28px;">' + m.icon + '</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<span style="font-weight:700;font-size:15px;color:#1e293b;">' + _esc(u.name) + '</span>'
        + '<span style="background:' + m.color + '18;color:' + m.color + ';font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;">' + m.label + '</span>'
        + (u._autoGenerated ? '<span style="background:#f0fdf4;color:#16a34a;font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;border:1px solid #bbf7d0;" title="Automatically synced from wizard">⚙ synced</span>' : '<span style="background:#fafafa;color:#94a3b8;font-size:10px;font-weight:500;padding:2px 7px;border-radius:20px;border:1px solid #e2e8f0;">manual</span>')
        + (u.email ? '<span style="color:#94a3b8;font-size:12px;">' + _esc(u.email) + '</span>' : '')
        + '</div>'
        + (assignText ? '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">' + assignText + '</div>' : '')
        + (u.note ? '<div style="color:#94a3b8;font-size:12px;margin-top:4px;">' + _esc(u.note) + '</div>' : '')
        + '</div>'
        + '<div style="display:flex;gap:8px;">'
        + '<button onclick="previewAsUser(\'' + u.id + '\')" title="Preview as this user" style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">👁 Preview</button>'
        + '<button onclick="openEditUserModal(\'' + u.id + '\')" title="Edit user" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">✏️ Edit</button>'
        + '<button onclick="removeUser(\'' + u.id + '\')" title="Remove user" style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">✕</button>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  body.innerHTML = html;
}

function renderNewUserAssignments() {
  const role = document.getElementById('newUserRole').value;
  const container = document.getElementById('newUserAssignments');
  if (!container) return;
  if (!role || role === 'ciso') { container.innerHTML = ''; return; }

  const families = getActiveFamilies ? getActiveFamilies() : Object.keys(FAMILIES);

  if (role === 'issm' || role === 'custodian') {
    container.innerHTML = '<label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Assigned Domains</label>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      + families.filter(function(f){ return f !== 'PM'; }).map(function(f) {
          return '<label style="display:flex;align-items:center;gap:5px;background:#f1f5f9;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;">'
            + '<input type="checkbox" value="' + f + '" name="newUserFam"> <span style="font-family:monospace;font-weight:700;">' + f + '</span> <span style="color:#64748b;">' + (FAMILIES[f]||f) + '</span></label>';
        }).join('')
      + '</div>';
  } else if (role === 'control-owner') {
    const ctrls = (CONTROLS || []).filter(function(c){ return families.includes(c.f); });
    container.innerHTML = '<label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Assigned Controls</label>'
      + '<div style="max-height:180px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;">'
      + ctrls.map(function(c) {
          return '<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;">'
            + '<input type="checkbox" value="' + c.id + '" name="newUserCtrl"> <span style="font-family:monospace;font-weight:600;">' + c.id + '</span></label>';
        }).join('')
      + '</div>';
  }
}

function saveNewUser() {
  const name = (document.getElementById('newUserName').value || '').trim();
  const email = (document.getElementById('newUserEmail').value || '').trim();
  const role = document.getElementById('newUserRole').value;
  const note = (document.getElementById('newUserNote').value || '').trim();
  if (!name) { showToast('⚠️ Name is required'); return; }
  if (!role) { showToast('⚠️ Please select a role'); return; }

  const families = Array.from(document.querySelectorAll('input[name="newUserFam"]:checked')).map(function(cb){ return cb.value; });
  const controls = Array.from(document.querySelectorAll('input[name="newUserCtrl"]:checked')).map(function(cb){ return cb.value; });

  const user = { id: 'u_' + Date.now(), name: name, email: email, role: role, families: families, controls: controls, note: note };
  if (!state.users) state.users = [];
  state.users.push(user);
  showToast('✅ ' + name + ' added');
  renderUsersTab();
}

function removeUser(id) {
  state.users = (state.users || []).filter(function(u){ return u.id !== id; });
  if (state.currentUserId === id) applyRoleView('admin');
  renderUsersTab();
  showToast('User removed');
}

function previewAsUser(id) {
  selectUserProfile(id);
  showToast('👁 Previewing as ' + (state.users.find(function(u){ return u.id===id; })||{}).name);
}

function openEditUserModal(id) {
  var u = (state.users||[]).find(function(u){ return u.id === id; });
  if (!u) return;
  var overlay = document.createElement('div');
  overlay.id = 'editUserOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px 32px;width:460px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:20px;">✏️ Edit User</div>'
    + '<div style="display:flex;flex-direction:column;gap:14px;">'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Full Name</label>'
    + '<input id="_editUserName" class="form-input" value="' + _esc(u.name||'') + '" style="width:100%;box-sizing:border-box;font-size:13px;"></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Email</label>'
    + '<input id="_editUserEmail" class="form-input" value="' + _esc(u.email||'') + '" style="width:100%;box-sizing:border-box;font-size:13px;"></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Title / Note</label>'
    + '<input id="_editUserNote" class="form-input" value="' + _esc(u.note||'') + '" style="width:100%;box-sizing:border-box;font-size:13px;"></div>'
    + '</div>'
    + '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'editUserOverlay\').remove()">Cancel</button>'
    + '<button class="btn btn-primary" onclick="saveEditUser(\'' + id + '\')">Save Changes</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function saveEditUser(id) {
  var u = (state.users||[]).find(function(u){ return u.id === id; });
  if (!u) return;
  var newName  = document.getElementById('_editUserName')?.value.trim();
  var newEmail = document.getElementById('_editUserEmail')?.value.trim();
  var newNote  = document.getElementById('_editUserNote')?.value.trim();
  if (!newName) { showToast('Name cannot be empty.', true); return; }
  u.name  = newName;
  u.email = newEmail;
  u.note  = newNote;
  markDirty();
  document.getElementById('editUserOverlay')?.remove();
  renderUsersTab();
  showToast('✅ User updated.');
}

// ============================================================
// PERSISTENCE  (localStorage + JSON export/import + demo snapshots)
// ============================================================


// ============================================================
// SNAPSHOT MANAGEMENT
// ============================================================

function _closeSnapModal() {
  var m = document.getElementById('snapshotModal');
  if (m) m.remove();
}

function _saveSnapFromModal() {
  var inp = document.getElementById('snapNameInput');
  if (inp) saveCurrentSnapshot(inp.value);
}


function saveCurrentSnapshot(name, quiet) {
  if (!name || !name.trim()) { showToast('Enter a snapshot name.', true); return; }
  var snaps = getSavedSnapshots();
  var entry = {
    name: name.trim(),
    saved: new Date().toISOString(),
    org: state.orgName || '',
    data: JSON.stringify(buildPersistedPayload())
  };
  if (String(name).indexOf('Auto-backup before restore') === 0) snaps.unshift(entry);
  else snaps.push(entry);
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snaps));
    if (!quiet) showToast('Snapshot saved: ' + name.trim());
    pruneAutoRestoreSnapshots();
    renderSnapshotsModal();
  } catch (e) {
    showToast('Could not save snapshot — storage full? Try Export JSON.', true);
  }
}

function deleteSnapshot(idx) {
  var snaps = getSavedSnapshots();
  snaps.splice(idx, 1);
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snaps));
  showToast('Snapshot deleted.');
  renderSnapshotsModal();
}

function getProgramCountsFromPayload(obj) {
  if (!obj || typeof obj !== 'object') return { users: 0, assets: 0, policies: 0, controls: 0 };
  return {
    users: (obj.users || []).length,
    assets: (obj.assets || []).length,
    policies: Object.keys(obj.domainPolicies || {}).length,
    controls: obj.controlStatus ? Object.keys(obj.controlStatus).length : 0
  };
}

function getCurrentProgramCounts() {
  return getProgramCountsFromPayload(buildPersistedPayload());
}

function applySnapshotFromDataString(dataStr) {
  var saved = JSON.parse(dataStr);
  if (!applyLoadedState(saved)) throw new Error('apply');
  Object.keys(currentStep).forEach(function(k) { currentStep[k] = 1; });
  applyRoleView('admin');
  showTab('ciso');
  goToStep('ciso', 1);
  saveToStorage();
  _closeSnapModal();
  showToast('Snapshot loaded.');
}

function openSnapshotRestoreConfirm(displayName, orgLabel, savedLabel, dataStr) {
  var cur = getCurrentProgramCounts();
  var snapCounts;
  try { snapCounts = getProgramCountsFromPayload(JSON.parse(dataStr)); } catch (e) { snapCounts = { users:0, assets:0, policies:0, controls:0 }; }
  saveCurrentSnapshot('Auto-backup before restore ' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19), true);
  pruneAutoRestoreSnapshots();
  var overlay = document.createElement('div');
  overlay.id = 'snapshotRestoreConfirmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10060;display:flex;align-items:center;justify-content:center;padding:16px;';
  var safeName = escapeHTML(displayName || 'Snapshot');
  overlay.innerHTML = '<div style="background:white;border-radius:14px;max-width:520px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:6px;">Restore snapshot?</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;line-height:1.5;"><strong>' + safeName + '</strong>'
    + (orgLabel ? '<br><span style="color:#64748b;">Org:</span> ' + escapeHTML(orgLabel) : '')
    + (savedLabel ? '<br><span style="color:#64748b;">Saved:</span> ' + escapeHTML(String(savedLabel).slice(0, 19)) : '')
    + '</div>'
    + '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#334155;">'
    + '<div style="font-weight:700;margin-bottom:6px;">Size comparison (top-level counts)</div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr><td></td><td style="text-align:right;font-weight:600;padding:4px;">Current</td><td style="text-align:right;font-weight:600;padding:4px;">Snapshot</td></tr>'
    + '<tr><td>Users</td><td style="text-align:right;">' + cur.users + '</td><td style="text-align:right;">' + snapCounts.users + '</td></tr>'
    + '<tr><td>Assets</td><td style="text-align:right;">' + cur.assets + '</td><td style="text-align:right;">' + snapCounts.assets + '</td></tr>'
    + '<tr><td>Domain policies</td><td style="text-align:right;">' + cur.policies + '</td><td style="text-align:right;">' + snapCounts.policies + '</td></tr>'
    + '<tr><td>Control status rows</td><td style="text-align:right;">' + cur.controls + '</td><td style="text-align:right;">' + snapCounts.controls + '</td></tr>'
    + '</table></div>'
    + '<label style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#334155;margin-bottom:16px;cursor:pointer;">'
    + '<input type="checkbox" id="snapshotRestoreAck" style="margin-top:2px;">'
    + '<span>I understand this will replace my current program.</span></label>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button type="button" class="btn btn-secondary" id="snapshotRestoreCancel">Cancel</button>'
    + '<button type="button" class="btn btn-primary" id="snapshotRestoreGo" disabled style="opacity:0.5;">Restore and replace</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  var ack = document.getElementById('snapshotRestoreAck');
  var goBtn = document.getElementById('snapshotRestoreGo');
  ack.addEventListener('change', function() {
    goBtn.disabled = !ack.checked;
    goBtn.style.opacity = ack.checked ? '1' : '0.5';
  });
  document.getElementById('snapshotRestoreCancel').onclick = function() { overlay.remove(); };
  goBtn.onclick = function() {
    if (!ack.checked) return;
    overlay.remove();
    try {
      applySnapshotFromDataString(dataStr);
    } catch (e) {
      console.warn(e);
      showToast('Could not load snapshot.', true);
    }
  };
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

function loadSnapshotByData(dataStr) {
  openSnapshotRestoreConfirm('Program snapshot', '', '', dataStr);
}

function loadSnapshotByIndex(idx) {
  var snaps = getSavedSnapshots();
  if (!snaps[idx]) { showToast('Snapshot not found.', true); return; }
  var s = snaps[idx];
  openSnapshotRestoreConfirm(s.name, s.org || '', s.saved || '', s.data);
}

function loadDemoSnapshot(demoIndex) {
  var demoSnaps = [XMPL_SNAPSHOT, XMPL_DOMAIN_SNAPSHOT];
  var snap = demoSnaps[+demoIndex];
  if (!snap || !snap.data) { showToast('Demo snapshot not found.', true); return; }
  openSnapshotRestoreConfirm(snap.name || 'Demo', snap.org || '', snap.saved || '', snap.data);
}

function renderSnapshotsModal() {
  _closeSnapModal();
  var snaps = getSavedSnapshots();
  var demoSnaps = [XMPL_SNAPSHOT, XMPL_DOMAIN_SNAPSHOT];

  var demoRows = demoSnaps.map(function(snap, i) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;">'
      + '<div><div style="font-weight:600;font-size:13px;">' + escapeHTML(snap.name) + '</div>'
      + '<div style="font-size:11px;color:#64748b;">' + escapeHTML(snap.org) + ' — ' + escapeHTML((snap.saved||'').slice(0,10)) + '</div></div>'
      + '<button class="btn btn-sm btn-secondary" onclick="loadDemoSnapshot(' + i + ')">Load Demo</button>'
      + '</div>';
  }).join('');

  var savedRows = snaps.length
    ? snaps.map(function(s, i) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;">'
          + '<div><div style="font-weight:600;font-size:13px;">' + escapeHTML(s.name) + '</div>'
          + '<div style="font-size:11px;color:#64748b;">' + escapeHTML(s.org||'') + ' — ' + escapeHTML((s.saved||'').slice(0,10)) + '</div></div>'
          + '<div style="display:flex;gap:6px;">'
          + '<button class="btn btn-sm btn-primary" onclick="loadSnapshotByIndex(' + i + ')">Load</button>'
          + '<button class="btn btn-sm" onclick="deleteSnapshot(' + i + ')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;">Del</button>'
          + '</div></div>';
      }).join('')
    : '<div style="color:#64748b;font-size:13px;padding:12px 0;">No saved snapshots yet.</div>';

  var overlay = document.createElement('div');
  overlay.id = 'snapshotModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = '<div style="background:white;border-radius:14px;max-width:560px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);max-height:80vh;overflow-y:auto;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);">Program Snapshots</div>'
    + '<button class="btn btn-secondary btn-sm" onclick="_closeSnapModal()">Close</button>'
    + '</div>'
    + '<div style="font-size:13px;font-weight:700;margin-bottom:8px;">Save Current State</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:20px;">'
    + '<input id="snapNameInput" class="form-input" placeholder="Snapshot name..." style="flex:1;font-size:13px;">'
    + '<button class="btn btn-primary" onclick="_saveSnapFromModal()">Save Snapshot</button>'
    + '</div>'
    + '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">Demo Programs</div>'
    + demoRows
    + '<div style="font-size:13px;font-weight:700;margin:14px 0 4px;">Saved Snapshots</div>'
    + savedRows
    + '</div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

window.getSavedSnapshots = getSavedSnapshots;
window.saveCurrentSnapshot = saveCurrentSnapshot;
window.deleteSnapshot = deleteSnapshot;
window.loadSnapshotByIndex = loadSnapshotByIndex;
window.loadDemoSnapshot = loadDemoSnapshot;
window.renderSnapshotsModal = renderSnapshotsModal;
window._closeSnapModal = _closeSnapModal;
window._saveSnapFromModal = _saveSnapFromModal;
window.setAuditTrailUiMode = setAuditTrailUiMode;
window.setChangeLogUserFilter = setChangeLogUserFilter;
window.setChangeLogDateFilter = setChangeLogDateFilter;
window.handleEvidenceImageUpload = handleEvidenceImageUpload;
window.setEvidenceKind = setEvidenceKind;
window.openEvidenceImageViewerAt = openEvidenceImageViewerAt;
window.openBulkAssignControlModal = openBulkAssignControlModal;
window.applyBulkAssignFromModal = applyBulkAssignFromModal;
window.bulkModalQuickFill = bulkModalQuickFill;

// ============================================================
// INITIALIZATION
// ============================================================

function setupMobileNav() {
  if (document.getElementById('mobileNavToggle')) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'mobileNavToggle';
  btn.setAttribute('aria-label', 'Open navigation menu');
  btn.className = 'mobile-nav-toggle';
  btn.textContent = '☰';
  btn.addEventListener('click', function() {
    document.body.classList.toggle('mobile-nav-open');
  });
  document.body.insertBefore(btn, document.body.firstChild);
  var ov = document.createElement('div');
  ov.id = 'mobileNavBackdrop';
  ov.className = 'mobile-nav-backdrop';
  ov.addEventListener('click', function() { document.body.classList.remove('mobile-nav-open'); });
  document.body.appendChild(ov);
  document.querySelectorAll('.sidebar .sidebar-item').forEach(function(el) {
    el.addEventListener('click', function() {
      if (window.innerWidth <= 768) document.body.classList.remove('mobile-nav-open');
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  try { loadFromStorage(); } catch (e) { console.warn('loadFromStorage:', e); }
  try { applyRoleView('admin'); } catch (e) { console.warn('applyRoleView:', e); }
  try { showTab('ciso'); } catch (e) { console.warn('showTab:', e); }
  try { goToStep('ciso', 1); } catch (e) { console.warn('goToStep:', e); }
  try { setupMobileNav(); } catch (e) { console.warn('setupMobileNav:', e); }
  window.addEventListener('beforeunload', function(ev) {
    if (!window.isDirty) return;
    try { saveToStorage(); } catch (e2) {}
    if (window.isDirty) {
      ev.preventDefault();
      ev.returnValue = '';
    }
  });
});
