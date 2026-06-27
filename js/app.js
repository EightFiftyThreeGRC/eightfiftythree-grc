// js/app.js — shared UI helpers, audit/change log, tab shell, snapshots, page init. Load last.
// Preceding scripts: core → program → policies → controls → assets → testing → reports → admin → this file.

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
  if (policyKey === 'ISP' && !isCustom) {
    checkbox.checked = true;
    if (typeof showToast === 'function') {
      showToast('The ISP must be approved by someone other than the program owner (separation of duties).', true);
    }
    return;
  }
  if (policyKey !== 'ISP' && !isCustom
      && typeof domainPolicyRequiresSeparateApprover === 'function'
      && domainPolicyRequiresSeparateApprover(policyKey)) {
    checkbox.checked = true;
    if (typeof showToast === 'function') {
      showToast('This domain policy must be approved by someone other than the policy drafter (separation of duties).', true);
    }
    return;
  }
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
  if (policyKey === 'ISP' && !rc._customApprover) {
    rc._customApprover = true;
  }
  if (policyKey !== 'ISP'
      && typeof domainPolicyRequiresSeparateApprover === 'function'
      && domainPolicyRequiresSeparateApprover(policyKey)
      && !rc._customApprover) {
    rc._customApprover = true;
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
  var requiresSeparate = policyKey !== 'ISP'
    && typeof domainPolicyRequiresSeparateApprover === 'function'
    && domainPolicyRequiresSeparateApprover(policyKey);
  var approverHTML = '';
  if (policyKey === 'ISP' || requiresSeparate) {
    var sodNote = policyKey === 'ISP'
      ? 'The Tier 1 ISP must be approved by someone other than the program owner (separation of duties). Assign a senior reviewer below.'
      : 'You are drafting this domain policy — it must be approved by someone other than you (separation of duties). Assign a separate reviewer below.';
    approverHTML = '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.45;">'
      + sodNote + '</div>'
      + '<div id="custom-approver-' + policyKey + '" style="display:block;margin-top:0;">'
      + '<div style="display:flex;gap:4px;">'
      + '<input class="form-input" style="font-size:12px;width:33%;" placeholder="Approver name" autocomplete="off" value="' + escapeHTML(rc.approvedBy||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].approvedBy=this.value; window.markDirty();">'
      + '<input class="form-input" style="font-size:12px;width:33%;" placeholder="Role (e.g. CIO)" autocomplete="off" value="' + escapeHTML(rc.approverRole||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].approverRole=this.value; window.markDirty();">'
      + '<input class="form-input" style="font-size:12px;width:33%;" placeholder="Email" autocomplete="off" value="' + escapeHTML(rc.approverEmail||'') + '" oninput="state.policyReviewCycle[\'' + escKey + '\'].approverEmail=this.value; window.markDirty();"></div>'
      + '</div>';
  } else {
    approverHTML = '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.2);border-radius:8px;font-size:12px;font-weight:600;color:var(--navy);">'
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
  }

  return '<div style="border:1px solid ' + rs.border + ';border-radius:10px;padding:16px 18px;margin-bottom:16px;background:' + rs.bg + ';">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);display:flex;align-items:center;">' + reviewStatusDot(policyKey) + ' Policy Review Status — ' + escapeHTML(label || '') + '</div>'
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
// - Control owners see only planned controls (assigned + policy ready)
// - Admins in the workspace see the same planned queue (not the full baseline)
var CONTROL_POLICY_READY = ['Draft', 'Under Review', 'Approved', 'Returned'];

function isControlIspTier(ctrl) {
  if (!ctrl || !ctrl.id) return false;
  if (ctrl.f === 'PM') return !!(state.pmControls && state.pmControls[ctrl.id]);
  return typeof isPolicyAndProceduresControl === 'function' && isPolicyAndProceduresControl(ctrl.id);
}

function getControlDesignGroup(ctrl) {
  if (!ctrl) return '';
  if (isControlIspTier(ctrl)) return 'ISP';
  return ctrl.f;
}

function getDesignGroupLabel(group) {
  if (group === 'ISP') return 'ISP — Information Security Policy';
  return group + (FAMILIES[group] ? ' — ' + FAMILIES[group] : '');
}

function getPolicyFamilyKeyForControl(ctrl) {
  if (!ctrl) return '';
  if (isControlIspTier(ctrl)) return 'ISP';
  var merges = state.policyMerges || {};
  return merges[ctrl.f] || ctrl.f;
}

function isControlFamilyPolicyReady(fam) {
  if (!fam) return false;
  if (fam === 'ISP' || fam === 'PM') {
    return CONTROL_POLICY_READY.indexOf(((state.policyStatus || {}).ISP || {}).status) !== -1;
  }
  return CONTROL_POLICY_READY.indexOf(((state.policyStatus || {})[fam] || {}).status) !== -1;
}

function isPolicyReadyForControl(ctrl) {
  if (!ctrl || !ctrl.id) return false;
  var policyFam = getPolicyFamilyKeyForControl(ctrl);
  if (!isControlFamilyPolicyReady(policyFam)) return false;
  if (isControlIspTier(ctrl)) return true;
  var sel = (state.policySelectedControls || {})[policyFam];
  if (!sel || !Array.isArray(sel) || !sel.length) return false;
  return sel.indexOf(ctrl.id) !== -1;
}

function markControlPlannedIfAssigned(ctrlId) {
  if (!state.controlStatus) state.controlStatus = {};
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var co = (state.controlOwners || {})[ctrlId] || {};
  if (!hasRealControlOwner(co)) return;
  var st = state.controlStatus[ctrlId].status || 'Not Started';
  if (st === 'Not Started') {
    state.controlStatus[ctrlId].status = 'Planned';
    if (typeof logFieldChange === 'function') logFieldChange('controlStatus.' + ctrlId + '.status', 'Not Started', 'Planned');
  }
}

function ensureIspTierControlOwners() {
  var ownerEmail = (state.programOwnerEmail || '').trim();
  var ownerName = (state.programOwner || '').trim();
  var ownerRole = (state.programOwnerTitle || '').trim();
  if (!ownerEmail && !ownerName) return;
  if (!isControlFamilyPolicyReady('ISP')) return;
  if (!state.controlOwners) state.controlOwners = {};
  getActiveControls().forEach(function(c) {
    if (!isControlIspTier(c)) return;
    if (hasRealControlOwner(state.controlOwners[c.id])) {
      markControlPlannedIfAssigned(c.id);
      return;
    }
    state.controlOwners[c.id] = { name: ownerName, role: ownerRole, email: ownerEmail };
    markControlPlannedIfAssigned(c.id);
  });
}

function isControlAssignedToSessionUser(ctrlId, primaryUser, rosterControlIds) {
  var co = (state.controlOwners || {})[ctrlId] || {};
  if (!hasRealControlOwner(co)) return false;
  if (!primaryUser) return true;
  if ((rosterControlIds || []).indexOf(ctrlId) !== -1) return true;
  var nameKey = (primaryUser.name || '').trim().toLowerCase();
  var emailKey = (primaryUser.email || '').trim().toLowerCase();
  if (emailKey && typeof normalizeOwnerEmail === 'function' && normalizeOwnerEmail(co.email) === emailKey) return true;
  if (nameKey && (co.name || '').trim().toLowerCase() === nameKey) return true;
  return false;
}

function getControlsAssignedToSessionUser() {
  var primaryUser = state.currentUserId ? (state.users || []).find(function(u) { return u.id === state.currentUserId; }) : null;
  var rosterIds = _sessionRosterControlIds();
  return getActiveControls().filter(function(c) {
    return isControlAssignedToSessionUser(c.id, primaryUser, rosterIds);
  });
}

function isControlInPlannedQueue(ctrl) {
  if (!ctrl || !ctrl.id) return false;
  if (!getActiveControls().some(function(c) { return c.id === ctrl.id; })) return false;
  if (!isPolicyReadyForControl(ctrl)) return false;
  if (!isControlAssignedToSessionUser(ctrl.id, state.currentUserId ? (state.users || []).find(function(u) { return u.id === state.currentUserId; }) : null, _sessionRosterControlIds())) return false;
  return true;
}

function _sessionRosterControlIds() {
  if (!state.currentUserId) return [];
  var primaryUser = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  if (!primaryUser) return [];
  var nameKey = (primaryUser.name || '').trim().toLowerCase();
  var ids = [];
  (state.users || []).filter(function(u) { return u.name && u.name.trim().toLowerCase() === nameKey; }).forEach(function(u) {
    (u.controls || []).forEach(function(cid) { if (ids.indexOf(cid) === -1) ids.push(cid); });
  });
  return ids;
}

function isControlSelectedInDomainPolicy(ctrlId, fam) {
  var sel = (state.policySelectedControls || {})[fam];
  if (!sel || !Array.isArray(sel) || !sel.length) return false;
  return sel.indexOf(ctrlId) !== -1;
}

function controlPassesPolicyGate(ctrl) {
  return isPolicyReadyForControl(ctrl);
}

function getAssignedControlsForCurrentUser() {
  return getActiveControls().filter(function(c) { return isControlInPlannedQueue(c); });
}

function getScopedControls() {
  return getAssignedControlsForCurrentUser();
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
  delete state._cisoAutoOwnerEmail;
  state._currentPersonIds = null;
  state._sidebarPoliciesExpanded = false;
  state.currentUserId = null;
  state.entraSession = null;
  // Reset step counters
  Object.keys(currentStep).forEach(function(k){ currentStep[k] = 1; });
  reapplySessionRoleView();
  renderSidebarBadges();
  showTab('ciso');
  goToStep('ciso', 1);
  try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_KEY + '-ts'); } catch(e) {}
  try {
    if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
      cloudPushNow();
    }
  } catch (ePush) { console.warn('cloudPushNow after reset:', ePush); }
  showToast('\u21BA Program reset. Starting fresh.');
}

// ============================================================
// TAB ROUTING & APP SHELL
// Tab IDs, showTab, role-view routing, CISO wizard shell
// (step dispatch, toast, cisoFinish, sidebar badges).
// ============================================================
const TAB_IDS = ['home','ciso','policy','control','asset','frameworks','reports','users'];
try { window.TAB_IDS = TAB_IDS; } catch (e) {}


function showProgramOverviewTab() {
  if (!state.cisoComplete || !state.currentUserId) {
    showTab('ciso');
    return;
  }
  showTab('reports');
}

/** Tab IDs for a role slug (built-in ROLE_TABS or custom program role tabsTemplate). */
function getRoleTabs(role) {
  if (!role) return ['reports'];
  if (typeof ROLE_TABS !== 'undefined' && ROLE_TABS[role]) return ROLE_TABS[role].slice();
  var custom = (state.customProgramRoles || []).find(function(x) { return x && x.slug === role; });
  if (custom) {
    if (String(custom.tabsTemplate || 'assessor') === 'reports-only') return ['reports'];
    return (typeof ROLE_TABS !== 'undefined' && ROLE_TABS.assessor) ? ROLE_TABS.assessor.slice() : ['reports'];
  }
  return ['reports'];
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
      var tabs = getRoleTabs(r);
      tabs.forEach(function(t) {
        if (visible.indexOf(t) === -1) visible.push(t);
      });
    });
  });
  if (!visible.length) {
    var roles = (user.roles && user.roles.length) ? user.roles : [user.role];
    roles.forEach(function(r) {
      var tabs = getRoleTabs(r);
      tabs.forEach(function(t) {
        if (visible.indexOf(t) === -1) visible.push(t);
      });
    });
  }
  if (state.cisoComplete) {
    visible = visible.filter(function(t) { return t !== 'ciso'; });
  }
  // If this person is assigned as a control owner for any control, they need the
  // control implementation workspace — regardless of their primary role (e.g. CISO
  // who also owns PM controls). Tier-1 ISP approvers never get control workspace.
  var personIsApproverOnly = false;
  if (user) {
    var personIds = state._currentPersonIds || [user.id];
    var hasApproverRole = false;
    var hasImplRole = false;
    personIds.forEach(function(pid) {
      var rec = (state.users || []).find(function(u) { return u.id === pid; });
      if (!rec) return;
      (rec.roles && rec.roles.length ? rec.roles : [rec.role]).forEach(function(r) {
        if (r === 'approver') hasApproverRole = true;
        if (r === 'ciso' || r === 'issm' || r === 'control-owner') hasImplRole = true;
      });
    });
    personIsApproverOnly = hasApproverRole && !hasImplRole;
  }
  if (visible.indexOf('control') === -1 && !personIsApproverOnly) {
    var userNameKey = (user.name || '').trim().toLowerCase();
    var isControlOwner = Object.values(state.controlOwners || {}).some(function(co) {
      return co && (co.name || '').trim().toLowerCase() === userNameKey;
    });
    if (isControlOwner) visible.push('control');
  }
  return visible.length ? visible : ['reports'];
}

function goToProgramSetupOrDashboard() {
  if (state.cisoComplete) showTab('home');
  else showTab('ciso');
}

/** From dashboard: open domain-owner step in CISO wizard (admin), or explain when PO no longer has that workspace. */
function goToDomainOwnersFromDashboard() {
  if (!state.currentUserId) {
    showTab('ciso');
    goToStep('ciso', 7);
    return;
  }
  if (state.cisoComplete) {
    showToast('Domain owners are edited in Program Setup. Sign out and open Admin (🔑), or ask your administrator.', true);
    return;
  }
  showTab('ciso');
  goToStep('ciso', 7);
}

function showTab(tabId) {
  if (tabId !== 'policy') {
    if (state._ispReviewView) state._ispReviewView = false;
    if (state._ispRevisionView) state._ispRevisionView = false;
  }
  if (tabId !== 'asset' && state._sspReviewerReadOnly) {
    state._sspReviewerReadOnly = false;
    state._sspReadOnlyExitTab = null;
    state._selectedAssetId = null;
    state._selectedProcessId = null;
    if (typeof _restoreAssetWizardLayoutAfterReadOnly === 'function') _restoreAssetWizardLayoutAfterReadOnly();
  }
  if (tabId !== 'asset' && state._sspOwnerRevisionMode) {
    state._sspOwnerRevisionMode = false;
    state._selectedAssetId = null;
    state._selectedProcessId = null;
  }
  if (state.currentUserId && state.users) {
    var cu = state.users.find(function(u) { return u.id === state.currentUserId; });
    if (cu) {
      var vis = getPersonVisibleTabIds(cu);
      var allowLibraryTab =
        (tabId === 'policy' && (state._policyLibraryMode || state._policyDocView || !!state._policyDomain || state._ispReviewView || state._ispRevisionView)) ||
        (tabId === 'control' && state._controlLibraryMode) ||
        (tabId === 'asset' && (state._assetTypeLibraryMode || state._assetLibraryMode || state._sspReviewerReadOnly || state._sspOwnerRevisionMode));
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
  // Library modes still highlight parent workspace nav
  if (tabId === 'policy' && state._policyLibraryMode) {
    var polNav = document.getElementById('nav-policy');
    if (polNav) polNav.classList.add('active');
  }
  if (tabId === 'control' && state._controlLibraryMode) {
    var ctrlNav = document.getElementById('nav-control');
    if (ctrlNav) ctrlNav.classList.add('active');
  }
  if (tabId === 'asset' && (state._assetLibraryMode || state._assetTypeLibraryMode)) {
    var assetNav = document.getElementById('nav-asset');
    if (assetNav) assetNav.classList.add('active');
  }
  var targetTab = document.getElementById('tab-' + tabId);
  var targetNav = document.getElementById('nav-' + tabId);
  if (targetTab) targetTab.classList.add('active');
  if (targetNav) targetNav.classList.add('active');
  if (tabId === 'home')      renderHomeTab();
  if (tabId === 'ciso')     renderCISOTab();
  if (tabId === 'policy')   renderPolicyTab();
  if (tabId === 'control')  renderControlTab();
  if (tabId === 'asset')    renderAssetTab();
  if (tabId === 'frameworks') renderFrameworksTab();
  if (tabId === 'reports')    renderReports();
  if (tabId === 'users')    renderUsersTab();
  updateNotificationBadges();
  enhanceKeyboardAccessibility();
  if (typeof applySetupFocusMode === 'function') applySetupFocusMode();
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



const currentStep = { ciso:1, policy:1, control:1, asset:1 };

function goToStep(tabId, step) {
  const maxSteps = { ciso:7, policy:4, control:4, asset:4 };
  const max = maxSteps[tabId] || 4;
  if (step < 1 || step > max) return;
  if (tabId === 'asset') {
    if (state._sspReviewerReadOnly) step = 1;
    var hasAsset = !!(state._selectedAssetId && (state.assets || []).find(function(a){ return String(a.id) === String(state._selectedAssetId); }));
    var hasProc = !!(state._selectedProcessId && (state.processes || []).find(function(p){ return String(p.id) === String(state._selectedProcessId); }));
    if (!hasAsset && !hasProc) step = 1;
    if (hasProc && step === 3) step = 4;
  }
  // Validate CISO step progression
  if (tabId === 'ciso' && step > 1) {
    if (!state.orgName || !state.orgName.trim()) { showToast('Please enter your Organization / Agency Name before continuing.', true); document.getElementById('orgNameInput')?.focus(); return; }
    if (!state.programOwner || !state.programOwner.trim()) { showToast('Please enter the Security Program Owner name before continuing.', true); document.getElementById('programOwnerInput')?.focus(); return; }
    if (!state.programOwnerTitle || !state.programOwnerTitle.trim()) { showToast('Please enter the Program Owner title before continuing.', true); document.getElementById('programOwnerTitleInput')?.focus(); return; }
  }
  if (tabId === 'ciso' && step > 2 && !state.baseline) {
    showToast('Please select a baseline impact level first.', true);
    return;
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
  if (tabId==='ciso') {
    renderCISOStep(step);
    if (typeof updateCisoSetupProgress === 'function') updateCisoSetupProgress(step);
  }
  if (tabId==='policy') { renderPolicyWizardChrome(step); renderPolicyStep(step); }
  if (tabId==='control') renderControlStep(step);
  if (tabId==='asset') {
    renderAssetWizardChrome();
    renderAssetStep(step);
    if (typeof syncAssetSspStepNavLayout === 'function') syncAssetSspStepNavLayout(step);
    if (typeof syncAssetSspFooterNav === 'function') syncAssetSspFooterNav();
  }
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
  reapplySessionRoleView();
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
window.setEvidenceKind = setEvidenceKind;
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

function applySetupFocusMode() {
  var inSetup = !state.cisoComplete;
  document.body.classList.toggle('setup-focus-mode', inSetup);
  if (typeof applyPostSetupNav === 'function') applyPostSetupNav();
}

/* Reusable wizard walkthrough modal. The same #wizardVideoOverlay is used for every
   wizard; the trigger button passes the mp4 path and modal title to openWizardVideo. */
var _wizardVideoLastFocus = null;

function openWizardVideo(src, title) {
  var ov = document.getElementById('wizardVideoOverlay');
  var v  = document.getElementById('wizardVideoEl');
  var t  = document.getElementById('wizardVideoTitle');
  if (!ov || !v) return;
  try { _wizardVideoLastFocus = document.activeElement; } catch (e) {}
  if (t && title) t.textContent = title;
  try {
    while (v.firstChild) v.removeChild(v.firstChild);
    v.src = src;
    v.currentTime = 0;
    v.muted = false;
  } catch (eS) {}
  ov.classList.add('is-visible');
  ov.removeAttribute('aria-hidden');
  try { document.body.style.overflow = 'hidden'; } catch (e2) {}
  setTimeout(function() {
    try {
      var btn = ov.querySelector('.wizard-video-close');
      if (btn) btn.focus();
    } catch (e3) {}
    try { v.play(); } catch (e4) {}
  }, 50);
}

function closeWizardVideo() {
  var ov = document.getElementById('wizardVideoOverlay');
  var v  = document.getElementById('wizardVideoEl');
  if (v) {
    try { v.pause(); } catch (eP) {}
    try { v.currentTime = 0; } catch (eT) {}
    try { v.muted = true; } catch (eM) {}
    /* Drop the src so the browser stops downloading the file in the background. */
    try { v.removeAttribute('src'); v.load(); } catch (eC) {}
  }
  if (ov) {
    ov.classList.remove('is-visible');
    ov.setAttribute('aria-hidden', 'true');
  }
  try { document.body.style.overflow = ''; } catch (e5) {}
  setTimeout(function() {
    try { if (_wizardVideoLastFocus && _wizardVideoLastFocus.focus) _wizardVideoLastFocus.focus(); } catch (e6) {}
  }, 0);
}

document.addEventListener('keydown', function(ev) {
  if (ev.key !== 'Escape') return;
  var ov = document.getElementById('wizardVideoOverlay');
  if (ov && ov.classList.contains('is-visible')) closeWizardVideo();
});

// Render the app UI once `state` has been loaded from the shared backend.
// Safe to call more than once (cloud realtime re-invokes it after a remote update).
function bootAfterStateReady() {
  try { renderSidebarBadges(); } catch (e) { console.warn('renderSidebarBadges:', e); }
  try { applySetupFocusMode(); } catch (e) { console.warn('applySetupFocusMode:', e); }
  try { showTab('home'); } catch (e) { console.warn('showTab:', e); }
}
window.bootAfterStateReady = bootAfterStateReady;

function reapplySessionRoleView() {
  if (typeof isCloudSessionActive === 'function' && isCloudSessionActive()
      && typeof mapCloudIdentityToRoleView === 'function') {
    mapCloudIdentityToRoleView();
    return;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Auth-independent UI wiring.
  try { setupMobileNav(); } catch (e) { console.warn('setupMobileNav:', e); }
  try {
    var wvo = document.getElementById('wizardVideoOverlay');
    if (wvo) {
      wvo.addEventListener('click', function(ev) {
        if (ev.target === wvo) closeWizardVideo();
      });
    }
  } catch (eBd) { console.warn('wizardVideoOverlay backdrop wiring:', eBd); }
  window.addEventListener('beforeunload', function(ev) {
    if (!window.isDirty) return;
    try { saveToStorage(); } catch (e2) {}
    if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
      try { cloudPushNow(); } catch (e3) {}
    }
    if (window.isDirty) {
      ev.preventDefault();
      ev.returnValue = '';
    }
  });

  try {
    if (typeof initCloudAuth === 'function') {
      initCloudAuth().catch(function(e) {
        console.warn('initCloudAuth:', e);
        if (typeof showCloudSignInGate === 'function') {
          showCloudSignInGate('Sign-in failed to initialize. Check your connection and try again.');
        }
      });
    } else if (typeof showCloudSignInGate === 'function') {
      showCloudSignInGate('Sign-in is not available. Reload the page or check your deployment.');
    }
  } catch (e) {
    console.warn('initCloudAuth threw:', e);
    if (typeof showCloudSignInGate === 'function') {
      showCloudSignInGate('Sign-in failed to initialize. Check your connection and try again.');
    }
  }
});
