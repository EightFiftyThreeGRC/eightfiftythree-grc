// js/policies.js — domain policy library, wizards, ISP policy editor, submit flow. Split from app.js (Step 3).
// Globals only; load after js/core.js, js/program.js, and before js/app.js.

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

function ispHasFormalApproval(s) {
  if (!s) return false;
  if ((s.status || '').trim() !== 'Approved') return false;
  return !!(s.approvedDate || s.approvedAt || (s.approvedBy || '').trim());
}

function getISPStatus() {
  var s = ((state.policyStatus || {}).ISP || {});
  var explicit = (s.status || '').trim();
  if (explicit === 'Returned' || (s.returnedDate && !ispHasFormalApproval(s))) return 'Returned';
  if (ispHasFormalApproval(s)) return 'Approved';
  if (explicit === 'Under Review' || explicit === 'Published') return 'Under Review';
  if (explicit === 'Approved') return 'Under Review';
  if (explicit === 'Draft' || explicit === 'In Progress') return explicit;
  if (explicit) return explicit;
  if (s.submittedAt || s.submittedTo) return 'Under Review';
  if (state.infoSecPolicy && state.infoSecPolicy.title) return 'Under Review';
  return 'Not Started';
}

function getEffectivePolicyDeadline(fam) {
  var policyDeadline = (state.policyDeadlines || {})[fam];
  if (policyDeadline) return policyDeadline;
  var domainDeadline = (state.domainDeadlines || {})[fam];
  if (domainDeadline) return domainDeadline;
  if (typeof deadlineFromPriority === 'function') return deadlineFromPriority(fam) || '';
  return '';
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

function canDraftDomainPoliciesFromList() {
  if (state.currentUserId) return true;
  if (typeof isCloudOwnerSession === 'function' && isCloudOwnerSession()) return true;
  return false;
}

function renderPolicyTab() {
  var policyNav = document.getElementById('nav-policy');
  if (policyNav) policyNav.classList.toggle('active', !state._policyLibraryMode);
  if (state._policyLibraryMode) {
    renderPolicyLibraryCatalog();
    return;
  }
  if (state._ispReviewView) {
    renderISPPolicyViewerPanel();
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
    var deadline = getEffectivePolicyDeadline(fam);
    var dp = (state.domainPolicies||{})[fam];
    var version = dp ? (dp.version || '1.0') : '—';
    var reviewCycle = dp ? (dp.reviewCycle || 'Annual') : 'Annual';
    var owner = getDomainOwnerLabelOr(fam, 'Unassigned');
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
    var ispBg = ispSt === 'Approved' ? 'rgba(13,148,136,0.02)' : 'var(--bg-muted)';
    var ispBorder = ispSt === 'Approved' ? 'rgba(13,148,136,0.3)' : 'var(--border)';
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
    var deadline = getEffectivePolicyDeadline(fam);
    var dp = (state.domainPolicies||{})[fam];
    var selected = (state.policySelectedControls||{})[fam] || [];
    var ctrlCount = allControls.filter(function(c){ return c.f === fam || slaves.includes(c.f); }).length;
    totalControls += ctrlCount;

    // Count assigned control owners for this domain
    var assignedOwners = selected.filter(function(cid){ return hasRealControlOwner((state.controlOwners || {})[cid]); }).length;
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
    var returnNotes = status === 'Returned' ? String(((state.policyStatus || {})[fam] || {}).notes || '').trim() : '';

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
      + (returnNotes
        ? '<div style="margin:6px 0 8px 0;padding:8px 10px;background:#fff7ed;border:1px solid #fdba74;border-radius:6px;font-size:11px;line-height:1.45;color:#9a3412;"><strong>Return notes:</strong> ' + _esc(returnNotes) + '</div>'
        : '')
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">' + selected.length + ' controls selected · ' + ctrlCount + ' in baseline</div>'
      + '<div style="font-size:11px;display:flex;align-items:center;">' + reviewStatusDot(fam) + '<span style="color:' + getReviewStatus(fam).color + ';">' + getReviewStatus(fam).label + '</span></div>'
      + ownerBar
      + '<button class="btn btn-primary btn-sm" style="width:100%;" onclick="enterPolicyWizard(\'' + fam + '\')">' + btnLabel + '</button>'
      + '</div>';
  });

  // Header
  var html = '<div style="max-width:780px;">';
  if (typeof renderPolicyElevationBlockingHtml === 'function') {
    html += renderPolicyElevationBlockingHtml();
  }
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
    var chip = chipHTML(st);
    if (st === 'Under Review' && policyKey) {
      var who = getPolicyPendingReviewerDisplay(policyKey);
      if (who) chip += '<div style="font-size:10px;color:#64748b;margin-top:4px;line-height:1.35;">' + _esc(who) + '</div>';
    }
    return chip;
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
    var ownerName = getDomainOwnerLabel(mf);
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
    if (st === 'Approved') return {bg:'rgba(13,148,136,0.06)',border:'rgba(13,148,136,0.25)',text:'var(--teal)'};
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
    + '<td><span style="background:' + ispStyle.bg + ';border:1px solid ' + ispStyle.border + ';color:' + ispStyle.text + ';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + _esc(ispStatus) + '</span></td>'
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
      + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(getDomainOwnerLabel(fam)) + '</td>'
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

/** Toggle the admin-only explainer under Build / Edit Policies (Domain policies home). */
function policyToggleAdminDraftHint(btn) {
  var panel = document.getElementById('policy-admin-draft-hint');
  if (!panel) return;
  var open = panel.style.display !== 'block';
  panel.style.display = open ? 'block' : 'none';
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
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
    const name = getDomainOwnerLabelOr(fam, 'Unassigned');
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

  const isLocalDemoAdmin = typeof isLocalDemoAdminMode === 'function' && isLocalDemoAdminMode();
  const isCloudOwner = typeof isCloudOwnerSession === 'function' && isCloudOwnerSession();
  const canDraft = canDraftDomainPoliciesFromList();

  // Resolve the list of master families to render cards for
  var famsToShow = [];
  if (isCloudOwner) {
    famsToShow = masterFams.slice();
  } else if (sel && ownerMap[sel]) {
    famsToShow = ownerMap[sel];
  } else if (userForcedFams && userForcedFams.length) {
    famsToShow = userForcedFams;
  }

  // ── Domain cards for selected owner / program owner ──
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
      const btnLabel = status === 'Not Started'
        ? (canDraft ? 'Start Drafting \u2192' : 'Not Yet Drafted')
        : status === 'Approved' ? 'View Policy \u2192' : 'View Draft \u2192';
      // title: use merge label if known, else default title
      const mergedTitle = getPolicyMergedTitle(masterFam);
      // family badges: master + slaves
      const allBadges = [masterFam].concat(slaves).map(function(f){
        return '<span class="family-badge" style="font-size:12px;padding:3px 7px;">' + f + '</span>';
      }).join('');

      var cardDisabled = status === 'Not Started' && !canDraft;
      var cardCursor = cardDisabled ? 'default' : 'pointer';
      var cardClick = cardDisabled ? '' : (status === 'Not Started' && canDraft
        ? ' onclick="enterPolicyWizard(\'' + masterFam + '\')"'
        : ' onclick="openPolicyDoc(\'' + masterFam + '\')"');
      var actionBtn = cardDisabled
        ? '<button class="btn btn-secondary btn-sm" style="width:100%;opacity:0.45;" disabled>' + btnLabel + '</button>'
        : (status === 'Not Started' && canDraft
          ? '<button class="btn btn-primary btn-sm" style="width:100%;" onclick="event.stopPropagation(); enterPolicyWizard(\'' + masterFam + '\')">' + btnLabel + '</button>'
          : '<button class="btn btn-primary btn-sm" style="width:100%;" onclick="event.stopPropagation(); openPolicyDoc(\'' + masterFam + '\')">' + btnLabel + '</button>');
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
        + actionBtn
        + (isLocalDemoAdmin && status === 'Not Started'
          ? '<div style="font-size:11px;color:var(--text-muted);margin-top:10px;line-height:1.45;padding:8px 10px;background:#f8fafc;border-radius:8px;border:1px solid var(--border);">'
          + '<span style="color:var(--navy);font-weight:700;">Demo mode:</span> '
          + 'Use <strong>Switch role</strong> in the sidebar to preview a policy owner\'s workspace, or assign yourself as owner in Program setup.</div>'
          : '')
        + '</div>';
    });
  }

  let cardsSection;
  if (famsToShow.length) {
    cardsSection = cards
      ? '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:14px; margin-top:20px;">' + cards + '</div>'
      : '<div style="text-align:center; padding:40px; color:var(--text-muted);">No domains assigned to this role.</div>';
  } else if (state.currentUserId) {
    // Logged-in user but no domains found
    cardsSection = '<div style="text-align:center; padding:48px 32px;">'
      + '<div style="font-size:32px; margin-bottom:12px;">📭</div>'
      + '<div style="font-size:15px; font-weight:600; color:var(--navy); margin-bottom:6px;">No policy domains assigned yet</div>'
      + '<div style="font-size:13px; color:var(--text-muted);">Your CISO hasn\'t assigned any policy domains to your account yet. Contact your CISO or program administrator to get started.</div>'
      + '</div>';
  } else if (isLocalDemoAdmin) {
    cardsSection = '<div style="text-align:center; padding:48px 32px;">'
      + '<div style="font-size:32px; margin-bottom:12px;">\uD83D\uDCCB</div>'
      + '<div style="font-size:15px; font-weight:600; color:var(--navy); margin-bottom:6px;">Select a policy owner above</div>'
      + '<div style="font-size:13px; color:var(--text-muted);">Choose a policy owner from the dropdown to preview their assigned domains in demo mode.</div>'
      + '</div>';
  } else {
    cardsSection = '';
  }

  // ── Full Policy Library — show ALL policies with status ──
  function statusStyle(st) {
    if (st === 'Approved') return {bg:'rgba(13,148,136,0.06)',border:'rgba(13,148,136,0.25)',text:'var(--teal)'};
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
    + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(state.programOwner || state.programOwnerEmail || '—') + '</td>'
    + '<td><span style="background:' + ispStyle.bg + ';border:1px solid ' + ispStyle.border + ';color:' + ispStyle.text + ';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">' + _esc(ispStatus) + '</span></td>'
    + '</tr>';

  masterFams.forEach(function(fam) {
    var slaves = slavesOf[fam] || [];
    var status = (state.policyStatus[fam]||{}).status || 'Not Started';
    var ss = statusStyle(status);
    var owner = getDomainOwnerLabel(fam);
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

  // Local demo only: preview another policy owner's domains (cloud mode uses real sign-in).
  let opts = '<option value="">Select policy owner\u2026</option>';
  ownerNames.forEach(function(name) {
    const n = ownerMap[name].length;
    opts += '<option value="' + name + '"' + (name === sel ? ' selected' : '') + '>'
      + name + ' (' + n + ' ' + (n === 1 ? 'policy' : 'policies') + ')</option>';
  });

  const rolePickerHTML = isLocalDemoAdmin
    ? '<div style="margin-bottom:16px;">'
        + '<div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;">'
        + '<div style="min-width:0;flex:1;">'
        + '<div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:4px;">Build / Edit Policies</div>'
        + '<div style="font-size:13px;color:var(--text-muted);">Preview domains by policy owner (demo mode).</div>'
        + '</div>'
        + '<button type="button" id="policy-admin-draft-hint-btn" class="btn btn-secondary btn-sm" style="white-space:nowrap;flex-shrink:0;" onclick="policyToggleAdminDraftHint(this)" aria-expanded="false" aria-controls="policy-admin-draft-hint" title="Why drafting is disabled in demo admin mode">'
        + '\u2139\uFE0F Why can\u2019t I draft?</button>'
        + '</div>'
        + '<div id="policy-admin-draft-hint" style="display:none;margin-bottom:12px;padding:12px 14px;font-size:13px;line-height:1.5;color:var(--text);background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">'
        + '<strong style="color:var(--navy);">Demo admin is read-only here.</strong> '
        + 'To draft domain policies locally, use <strong>Switch role</strong> in the sidebar and pick the policy owner for that domain. '
        + 'In cloud mode you sign in with your real account instead.</div>'
        + '<label style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); display:block; margin-bottom:8px;">Policy Owner</label>'
        + '<select class="form-select" style="font-size:14px; max-width:420px;" onchange="state._policyOwnerFilter=this.value; renderPolicyList();">' + opts + '</select>'
        + '</div>'
    : '';

  const cloudOwnerBuildHTML = isCloudOwner
    ? '<div style="margin-bottom:16px;">'
      + '<div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:4px;">Build / Edit Policies</div>'
      + '<div style="font-size:13px;color:var(--text-muted);">You\'re signed in as program owner — open any domain below to start or continue drafting.</div>'
      + '</div>'
    : '';

  var policyElevBlock = (typeof renderPolicyElevationBlockingHtml === 'function' ? renderPolicyElevationBlockingHtml() : '');
  body.innerHTML = '<div style="max-width:900px;">'
    + policyElevBlock
    + librarySection
    + (isLocalDemoAdmin ? rolePickerHTML + cardsSection : '')
    + (isCloudOwner ? cloudOwnerBuildHTML + cardsSection : '')
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

function formatRequirementExportLine(req) {
  var id = (req && req.id) ? req.id : 'REQ';
  var text = stripRequirementNistRef((req && (req.text || req.requirement)) || '');
  var controls = getRequirementControlIds(req);
  var line = id + ': ' + text;
  if (controls.length) line += '\nMapped NIST 800-53 controls: ' + controls.join(', ');
  return line;
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

function _policyEscapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function _policyCrc32(bytes) {
  if (!_policyCrc32._table) {
    var tbl = new Uint32Array(256);
    for (var i = 0; i < 256; i++) {
      var c = i;
      for (var j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tbl[i] = c >>> 0;
    }
    _policyCrc32._table = tbl;
  }
  var crc = 0xFFFFFFFF;
  for (var k = 0; k < bytes.length; k++) crc = _policyCrc32._table[(crc ^ bytes[k]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function _policyZipStored(files) {
  var te = new TextEncoder();
  var localParts = [];
  var centralParts = [];
  var offset = 0;

  function pushU16(arr, n) { arr.push(n & 0xFF, (n >>> 8) & 0xFF); }
  function pushU32(arr, n) { arr.push(n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF); }

  files.forEach(function(f) {
    var nameBytes = te.encode(f.name);
    var dataBytes = te.encode(f.content);
    var crc = _policyCrc32(dataBytes);
    var local = [];
    pushU32(local, 0x04034b50);
    pushU16(local, 20);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU32(local, crc);
    pushU32(local, dataBytes.length);
    pushU32(local, dataBytes.length);
    pushU16(local, nameBytes.length);
    pushU16(local, 0);
    localParts.push(new Uint8Array(local), nameBytes, dataBytes);

    var central = [];
    pushU32(central, 0x02014b50);
    pushU16(central, 20);
    pushU16(central, 20);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU32(central, crc);
    pushU32(central, dataBytes.length);
    pushU32(central, dataBytes.length);
    pushU16(central, nameBytes.length);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU16(central, 0);
    pushU32(central, 0);
    pushU32(central, offset);
    centralParts.push(new Uint8Array(central), nameBytes);

    offset += local.length + nameBytes.length + dataBytes.length;
  });

  var centralSize = 0;
  centralParts.forEach(function(p) { centralSize += p.length; });
  var end = [];
  pushU32(end, 0x06054b50);
  pushU16(end, 0);
  pushU16(end, 0);
  pushU16(end, files.length);
  pushU16(end, files.length);
  pushU32(end, centralSize);
  pushU32(end, offset);
  pushU16(end, 0);
  var endArr = new Uint8Array(end);

  var total = offset + centralSize + endArr.length;
  var out = new Uint8Array(total);
  var ptr = 0;
  localParts.concat(centralParts).concat([endArr]).forEach(function(p) {
    out.set(p, ptr);
    ptr += p.length;
  });
  return out;
}

function _policyBuildDocxFromLines(title, lines) {
  var allLines = [title || 'Policy'].concat(lines || []);
  var bodyXml = allLines.map(function(line) {
    if (!line) return '<w:p/>';
    return '<w:p><w:r><w:t xml:space="preserve">' + _policyEscapeXml(line) + '</w:t></w:r></w:p>';
  }).join('');
  var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"'
    + ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
    + ' xmlns:o="urn:schemas-microsoft-com:office:office"'
    + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
    + ' xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"'
    + ' xmlns:v="urn:schemas-microsoft-com:vml"'
    + ' xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"'
    + ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'
    + ' xmlns:w10="urn:schemas-microsoft-com:office:word"'
    + ' xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
    + ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"'
    + ' xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"'
    + ' xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"'
    + ' xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"'
    + ' xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"'
    + ' mc:Ignorable="w14 wp14"><w:body>' + bodyXml
    + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
    + '</w:body></w:document>';
  var relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>';
  var contentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>';
  return _policyZipStored([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: relsXml },
    { name: 'word/document.xml', content: documentXml }
  ]);
}

function _policyFileSafeName(name) {
  return String(name || 'Policy').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function _buildISPExportPayload() {
  var isp = state.infoSecPolicy || {};
  var title = (isp.title || 'Information Security Policy').trim();
  var sections = [];
  (isp.sections || []).forEach(function(sec) {
    var txt = (sec && sec.content) ? String(sec.content).trim() : '';
    if (txt) sections.push({ heading: sec.title || sec.type || 'Section', content: txt });
  });
  if ((isp.roles || []).length) {
    var rolesText = (isp.roles || []).map(function(r) {
      var rs = (r.responsibilities || []).map(function(x) { return '- ' + x; }).join('\n');
      return (r.name || 'Role') + (rs ? '\n' + rs : '');
    }).join('\n\n');
    sections.push({ heading: 'Roles & Responsibilities', content: rolesText });
  }
  if ((isp.requirements || []).length) {
    sections.push({ heading: 'Policy Requirements', content: (isp.requirements || []).map(formatRequirementExportLine).join('\n\n') });
  }
  if ((isp.documents || []).length) {
    sections.push({ heading: 'Referenced Documents', content: (isp.documents || []).map(function(d) { return (d.title || 'Document') + (d.url ? ' — ' + d.url : '') + (d.desc ? '\n' + d.desc : ''); }).join('\n\n') });
  }
  if ((isp.revisionHistory || []).length) {
    sections.push({ heading: 'Revision History', content: (isp.revisionHistory || []).map(function(r) { return 'v' + (r.version || '') + ' | ' + (r.date || '') + ' | ' + (r.author || '') + ' | ' + (r.changes || ''); }).join('\n') });
  }
  return { title: title, sections: sections };
}

function _buildDomainExportPayload(fam) {
  var dp = ((state.domainPolicies || {})[fam]) || {};
  var title = (dp.title || getPolicyMergedTitle(fam) || (fam + ' Policy')).trim();
  var sections = [];
  if (dp.purpose) sections.push({ heading: 'Purpose', content: String(dp.purpose) });
  if (dp.scope) sections.push({ heading: 'Scope', content: String(dp.scope) });
  if ((dp.roles || []).length) {
    sections.push({ heading: 'Roles & Responsibilities', content: (dp.roles || []).map(function(r) {
      var rs = (r.responsibilities || []).map(function(x) { return '- ' + x; }).join('\n');
      return (r.name || 'Role') + (rs ? '\n' + rs : '');
    }).join('\n\n') });
  }
  if ((dp.requirements || []).length) {
    sections.push({ heading: 'Policy Requirements', content: (dp.requirements || []).map(formatRequirementExportLine).join('\n\n') });
  }
  if ((dp.references || []).length) {
    sections.push({ heading: 'References', content: (dp.references || []).map(function(r) { return (r.title || 'Reference') + (r.url ? ' — ' + r.url : '') + (r.description ? '\n' + r.description : ''); }).join('\n\n') });
  }
  if ((dp.revisionHistory || []).length) {
    sections.push({ heading: 'Revision History', content: (dp.revisionHistory || []).map(function(r) { return 'v' + (r.version || '') + ' | ' + (r.date || '') + ' | ' + (r.author || '') + ' | ' + (r.changes || ''); }).join('\n') });
  }
  return { title: title, sections: sections };
}

function _renderPolicyExportHtml(payload) {
  var rows = (payload.sections || []).map(function(s) {
    return '<section style="margin-bottom:20px;"><h2 style="font-size:14pt;margin:0 0 8px 0;color:#0f172a;">' + escapeHTML(s.heading || '') + '</h2>'
      + '<div style="font-size:11pt;line-height:1.55;white-space:pre-wrap;color:#111827;">' + escapeHTML(s.content || '') + '</div></section>';
  }).join('');
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHTML(payload.title || 'Policy') + '</title></head>'
    + '<body style="font-family:Calibri,Arial,sans-serif;padding:24px;"><h1 style="font-size:20pt;margin:0 0 16px 0;">' + escapeHTML(payload.title || 'Policy') + '</h1>' + rows + '</body></html>';
}

function _buildPolicyPayload(kind, fam) {
  return kind === 'isp' ? _buildISPExportPayload() : _buildDomainExportPayload(fam);
}

function printPolicyDocument(kind, fam) {
  var payload = _buildPolicyPayload(kind, fam);
  var w = window.open('', '_blank');
  if (!w) { showToast('Popup blocked — allow popups to print.', true); return; }
  w.document.open();
  w.document.write(_renderPolicyExportHtml(payload));
  w.document.close();
  setTimeout(function() { try { w.focus(); w.print(); } catch (e) {} }, 150);
}

function exportPolicyDocumentDocx(kind, fam) {
  var payload = _buildPolicyPayload(kind, fam);
  var lines = [];
  (payload.sections || []).forEach(function(s) {
    lines.push((s.heading || '').toUpperCase());
    lines.push(s.content || '');
    lines.push('');
  });
  var bytes = _policyBuildDocxFromLines(payload.title, lines);
  var blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = _policyFileSafeName(payload.title) + '.docx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 5000);
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
    + '<button class="btn btn-secondary btn-sm" onclick="printPolicyDocument(\'domain\',\''+fam+'\')">🖨️ Print / Save PDF</button>'
    + '<button class="btn btn-secondary btn-sm" onclick="exportPolicyDocumentDocx(\'domain\',\''+fam+'\')">⬇ Export Word (.docx)</button>'
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
    +   'Owner: <strong>' + escapeHTML(getDomainOwnerLabelOr(fam, 'Unassigned')) + '</strong>'
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
  const deadline = getEffectivePolicyDeadline(fam);
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
  // Explicitly route the returned policy back to CISO/program owner so it appears in their reassignment queue.
  state.policyStatus[fam].submittedTo = (state.programOwner || '').trim() || (state.programOwnerTitle || 'Program Owner');
  state.policyStatus[fam].submittedToRole = (state.programOwnerTitle || '').trim() || 'Program Owner';
  state.policyStatus[fam].submittedToEmail = (state.programOwnerEmail || '').trim() || '';
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
    <button class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:6px;" onclick="addControlsFromOtherFamilies('${fam}')">+ Add control(s) from other families</button>
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

function addControlsFromOtherFamilies(fam) {
  if (!fam) return;
  var allFams = getPolicyAllFamilies(fam);
  var candidateControls = getActiveControls().filter(function(c) {
    return allFams.indexOf(c.f) === -1;
  });
  if (!candidateControls.length) {
    showToast('No controls from other families are available in the current baseline scope.', true);
    return;
  }
  var preview = candidateControls.slice(0, 40).map(function(c) { return c.id + ' (' + c.f + ')'; }).join(', ');
  var extra = candidateControls.length > 40 ? '\n... and ' + (candidateControls.length - 40) + ' more.' : '';
  var input = prompt(
    'Add controls from other families.\n\nEnter one or more control IDs, comma-separated (e.g., AC-2, IA-5, SC-7).\n\nAvailable examples:\n'
    + preview + extra
  );
  if (!input) return;
  var requested = input.split(',').map(function(s) { return String(s || '').trim(); }).filter(Boolean);
  if (!requested.length) return;
  if (!state.policySelectedControls) state.policySelectedControls = {};
  if (!state.policySelectedControls[fam]) state.policySelectedControls[fam] = [];
  var selected = state.policySelectedControls[fam];
  var candidateIdSet = {};
  candidateControls.forEach(function(c) { candidateIdSet[c.id] = true; });
  var added = 0;
  var invalid = [];
  requested.forEach(function(raw) {
    var canonical = typeof resolveCatalogControlId === 'function' ? resolveCatalogControlId(raw) : String(raw || '').toUpperCase();
    if (!canonical || !candidateIdSet[canonical]) {
      invalid.push(raw);
      return;
    }
    if (selected.indexOf(canonical) === -1) {
      selected.push(canonical);
      added++;
    }
  });
  if (added > 0) autoPopulateControlOwnersFromDomain(fam);
  markDirty();
  renderPolicyStep2();
  if (invalid.length) {
    showToast('Added ' + added + ' control(s). Some IDs were not eligible here: ' + invalid.join(', '), true);
  } else {
    showToast('Added ' + added + ' control(s) from other families.');
  }
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

// Navigate to ISP — read-only document viewer (admin, approver, library links).
function goToCISOPolicyEditor() {
  state._policyLibraryMode = false;
  state._policyDocView = false;
  state._ispReviewView = true;
  showTab('policy');
}

function exitISPPolicyViewer() {
  state._ispReviewView = false;
  var user = state.currentUserId && state.users
    ? state.users.find(function(u) { return u.id === state.currentUserId; })
    : null;
  if (user && typeof getPersonVisibleTabIds === 'function') {
    var vis = getPersonVisibleTabIds(user);
    if (vis.indexOf('policy') === -1) {
      showTab(vis.indexOf('reports') !== -1 ? 'reports' : (vis[0] || 'reports'));
      return;
    }
  }
  if (!state.currentUserId) {
    renderPolicyTab();
    return;
  }
  showTab('reports');
}

function renderISPPolicyViewerPanel() {
    var listPanel = document.getElementById('policy-list-panel');
    var wizPanel = document.getElementById('policy-wizard-panel');
    if (listPanel) listPanel.style.display = '';
    if (wizPanel) wizPanel.style.display = 'none';
    var hdr = listPanel ? listPanel.querySelector('.page-header') : null;
    var ispViewStatus = getISPStatus();
    var ispHdrSub = ispViewStatus === 'Approved'
      ? 'Tier 1 organizational policy — approved and owned by the CISO.'
      : ispViewStatus === 'Under Review'
      ? 'Tier 1 organizational policy — submitted and awaiting designated approver sign-off.'
      : ispViewStatus === 'Returned'
      ? 'Tier 1 organizational policy — returned to the program owner for revision.'
      : ispViewStatus === 'Draft' || ispViewStatus === 'In Progress'
      ? 'Tier 1 organizational policy — draft in progress; not yet approved.'
      : 'Tier 1 organizational policy — owned by the CISO.';
    if (hdr) hdr.innerHTML = '<div class="role-badge">📋 Policy</div>'
      + '<h1>Information Security Policy</h1>'
      + '<p>' + ispHdrSub + '</p>';
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
      + '<span style="margin-right:10px;">' + chipHTML(ispViewStatus) + '</span>'
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
      [['Purpose', isp.purpose||''], ['Scope', isp.scope||''], ['Policy Statement', isp.policy||'']].forEach(function(pair) {
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
        actor: state.programOwner || 'Program Owner',
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
        actor: ispStatusLog.returnedBy || ispRcLog.approvedBy || 'Approver',
        notes: ispStatusLog.notes || ''
      });
    }
    if (ispRcLog.lastReviewed || ispRcLog.nextReviewDue) {
      logRows.push({
        event: 'Review cycle updated',
        date: ispRcLog.lastReviewed || '',
        actor: state.programOwner || ispRcLog.approvedBy || 'Program Owner',
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
    if (ispViewStatus === 'Returned') {
      var returnNotes = String((((state.policyStatus || {}).ISP || {}).notes) || '').trim();
      ispHTML += '<div style="margin:16px 0;padding:14px 16px;background:#fffbeb;border:1px solid rgba(245,158,11,0.35);border-radius:10px;">'
        + '<div style="font-size:12px;font-weight:700;color:#b45309;margin-bottom:6px;">Returned for revision</div>'
        + '<div style="font-size:13px;color:#78350f;line-height:1.6;">'
        + (returnNotes ? _esc(returnNotes) : 'No return comments were recorded.')
        + '</div></div>';
    } else if (ispViewStatus === 'Under Review') {
      var pendingApprover = typeof getISPDesignatedApproverName === 'function' ? getISPDesignatedApproverName() : '';
      var pendingEmail = typeof getISPDesignatedApproverEmail === 'function' ? getISPDesignatedApproverEmail() : '';
      ispHTML += '<div style="margin:16px 0;padding:14px 16px;background:#eef2ff;border:1px solid rgba(99,102,241,0.25);border-radius:10px;">'
        + '<div style="font-size:12px;font-weight:700;color:#4338ca;margin-bottom:6px;">Awaiting approver sign-off</div>'
        + '<div style="font-size:13px;color:#3730a3;line-height:1.6;">This policy is not approved yet. '
        + (pendingApprover ? 'Routed to <strong>' + _esc(pendingApprover) + '</strong>' : 'Routed to the designated approver')
        + (pendingEmail ? ' (' + _esc(pendingEmail) + ')' : '')
        + '.</div></div>';
    }
    var viewerUser = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
    var ispSt2 = ispViewStatus || ((state.policyStatus||{}).ISP || {}).status || 'Under Review';
    var ispIsApproved = ispViewStatus === 'Approved';
    var viewerCanApproveISP = typeof canSessionApproveISP === 'function' && canSessionApproveISP();
    ispHTML += '<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;align-items:flex-start;">';
    ispHTML += '<button class="btn btn-secondary btn-sm" onclick="exitISPPolicyViewer()">← Back</button>';
    ispHTML += '<button class="btn btn-secondary btn-sm" onclick="printPolicyDocument(\'isp\')">🖨️ Print / Save PDF</button>';
    ispHTML += '<button class="btn btn-secondary btn-sm" onclick="exportPolicyDocumentDocx(\'isp\')">⬇ Export Word (.docx)</button>';
    if (!state.currentUserId && ispIsApproved) {
      ispHTML += '<button class="btn btn-primary btn-sm" onclick="openISPSuggestionModal()">📝 Propose Change</button>';
    }
    if (viewerCanApproveISP) {
      ispHTML += '</div><div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">'
        + '<div style="font-size:12px;font-weight:600;color:var(--navy);margin-bottom:6px;">Review Notes (required to return, optional to approve)</div>'
        + '<textarea id="isp-approver-notes" class="form-input" rows="3" style="font-size:13px;resize:vertical;margin-bottom:10px;" placeholder="Add any notes or conditions for approval…"></textarea>'
        + '<div style="display:flex;gap:10px;">'
        + '<button class="btn btn-sm" style="background:white;border:1px solid rgba(239,68,68,0.4);color:#dc2626;font-weight:600;" onclick="returnISPToEditor()">↩ Return with Comments</button>'
        + '<button class="btn btn-primary btn-sm" onclick="approveISP()">✅ Approve Policy</button>'
        + '</div></div>';
    } else {
      ispHTML += '</div>';
      if (ispSt2 === 'Under Review') {
        var pendingApprover = typeof getISPDesignatedApproverName === 'function' ? getISPDesignatedApproverName() : '';
        var pendingEmail = typeof getISPDesignatedApproverEmail === 'function' ? getISPDesignatedApproverEmail() : '';
        ispHTML += '<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">'
          + '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">'
          + 'Awaiting approval from <strong>' + _esc(pendingApprover || 'the designated approver') + '</strong>'
          + (pendingEmail ? ' (' + _esc(pendingEmail) + ')' : '')
          + '. Sign in with that account to approve or return this policy.</div></div>';
      }
    }
    // Annual review working draft (kickoff — promoted from approved suggestions)
    var ispDraft = state.infoSecPolicyReviewDraft;
    if (ispIsApproved && ispDraft && ispDraft.content) {
      ispHTML += '<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">📋 Annual Review Working Draft</div>'
        + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Draft <strong>v' + _esc(String(ispDraft.version != null ? ispDraft.version : '1')) + '</strong>'
        + ' · Started ' + _esc(ispDraft.createdAt || '—') + ' · Updated ' + _esc(ispDraft.updatedAt || '—') + '</div>'
        + '<div style="font-size:13px;color:var(--navy);line-height:1.7;white-space:pre-wrap;border:1px solid var(--border);border-radius:8px;padding:14px;background:#f8fafc;">' + _esc(ispDraft.content) + '</div>'
        + '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">Use this consolidated text when you open the next formal review in the CISO wizard (copy into sections or attach as change notes).</div>'
        + '</div>';
    }
    // Suggested changes log (post-approval draft queue — only after formal CIO sign-off)
    if (ispIsApproved) {
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
    }
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

function exportDomainPolicyPDF(fam) {
  printPolicyDocument('domain', fam);
}

function exportDomainPolicyWord(fam) {
  exportPolicyDocumentDocx('domain', fam);
}

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
  const assignedCount = selected.filter(function(cid) { return hasRealControlOwner((state.controlOwners || {})[cid]); }).length;

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
          <button class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:6px;" onclick="clearDomainControlOwners('${fam}')">Clear all assignments</button>
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
            if (cardDOwner && getOwnerDisplayName(cardDOwner) !== '—' && !cardUsers.find(function(u){ return u.name===cardDOwner.name; }))
              cardUsers.unshift({ id:'_downer', name: cardDOwner.name, role: cardDOwner.role||'', email: cardDOwner.email||'' });
            window._s4People = cardUsers.map(function(u){ const m=ROLE_META[u.role]||{}; return { name:u.name, role:m.label||u.role||'', email:u.email||'' }; });
            return selected.map(function(cid) {
              const ctrl = CONTROLS.find(function(c){ return c.id===cid; });
              const co = state.controlOwners[cid]||{};
              const ownerName = getOwnerDisplayName(co);
              const isAssigned = hasRealControlOwner(co);
              const cidSafe = cid.replace(/[()]/g,'_');
              // Find index of currently assigned person in roster
              const assignedIdx = ownerName !== '—' ? cardUsers.findIndex(function(u){ return u.name===co.name; }) : -1;
              const customSel = assignedIdx < 0 && ownerName !== '—' ? ' selected' : '';
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
                + '<input class="form-input co-name" data-cid="' + cid + '" style="font-size:12px;width:100%;box-sizing:border-box;" placeholder="Owner name (optional if you picked someone above)" value="' + escapeHTML(ownerName !== '—' ? (co.name || '') : '') + '" oninput="setCtrlOwner(\'' + cid + '\',\'name\',this.value);step4RosterSync(\'' + cid + '\');_coCardUpdate(\'' + cid + '\',this.value);">'
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

function clearDomainControlOwners(fam) {
  var selected = ((state.policySelectedControls || {})[fam]) || [];
  if (!selected.length) {
    showToast('No controls in scope to clear.', true);
    return;
  }
  var assignedNow = selected.filter(function(cid) { return hasRealControlOwner((state.controlOwners || {})[cid]); }).length;
  if (!assignedNow) {
    showToast('No control owner assignments to clear.', true);
    return;
  }
  if (!confirm('Clear owner assignments for ' + assignedNow + ' control(s) in this domain?')) return;
  if (!state.controlOwners) state.controlOwners = {};
  selected.forEach(function(cid) {
    if (state.controlOwners[cid]) delete state.controlOwners[cid];
  });
  addAuditEntry('policy', fam, 'Cleared control owner assignments for ' + assignedNow + ' control(s) in ' + fam + '.');
  markDirty();
  renderPolicyStep4();
  showToast('Cleared ' + assignedNow + ' control owner assignment' + (assignedNow === 1 ? '' : 's') + '.');
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
  const assignedCount = selected.filter(function(c){ return hasRealControlOwner((state.controlOwners || {})[c]); }).length;
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
  const assignedCount = selected.filter(function(cid) { return hasRealControlOwner((state.controlOwners || {})[cid]); }).length;
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
      if (!overwrite && hasRealControlOwner(state.controlOwners[cid])) continue;
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
  const cidList = selected.filter(function(cid) { return overwrite || !hasRealControlOwner((state.controlOwners || {})[cid]); });
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
      + '<td style="padding:6px 8px;font-size:11px;color:var(--text-muted);">' + escapeHTML(getControlOwnerDisplayName(co)) + '</td>'
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
  const assigned = selected.filter(function(cid) { return hasRealControlOwner((state.controlOwners || {})[cid]); }).length;
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
