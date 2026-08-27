// js/session.js — who is acting, and what are they allowed to do.
//
// The program runs entirely in this browser. There is no login: you either work
// in Admin mode (state.currentUserId === null, full program-owner oversight) or
// you impersonate a rostered person from the role picker (admin.js).
//
// Several helpers below keep their historical `*Cloud*` names because they are
// called from ~200 sites across js/. They now answer from local state only:
//   isCloudSessionActive() -> always false (no remote session)
//   isCloudLocked()        -> always false (impersonation is always allowed)
//   isCloudOwnerSession()  -> true in Admin mode
//
// Globals only, defensive typeof guards — same conventions as the rest of js/.

function _sessionNormalizeEmail(value) {
  return typeof normalizeOwnerEmail === 'function'
    ? normalizeOwnerEmail(value)
    : String(value || '').trim().toLowerCase();
}

/** Every roster record belonging to the person currently being impersonated. */
function getSessionPersonRecords() {
  if (!state.currentUserId || !state.users) return [];
  var ids = state._currentPersonIds || [state.currentUserId];
  var out = [];
  ids.forEach(function(id) {
    var u = state.users.find(function(x) { return x.id === id; });
    if (u) out.push(u);
  });
  return out;
}

/** The roster record being impersonated, or null in Admin mode. */
function getActingUser() {
  if (!state.currentUserId || !state.users) return null;
  return state.users.find(function(u) { return u.id === state.currentUserId; }) || null;
}

// ── compatibility shims for the retired cloud session ───────────────────────
/** No remote session exists any more — local storage is the only backing store. */
function isCloudSessionActive() {
  return false;
}

/** Impersonation is never locked now that identity is chosen, not authenticated. */
function isCloudLocked() {
  return false;
}

/** Admin mode carries program-owner oversight (full visibility, no role scoping). */
function isCloudOwnerSession() {
  return !state.currentUserId;
}

function isCloudProgramOwner() {
  return !state.currentUserId;
}

function getCloudSessionEmail() {
  var u = getActingUser();
  return u && u.email ? String(u.email).trim() : '';
}

function getCloudSessionName() {
  var u = getActingUser();
  if (u && u.name) return String(u.name).trim();
  var email = getCloudSessionEmail();
  return email ? email.split('@')[0] : '';
}

/** The roster record for the acting identity. */
function getMatchedCloudProgramUser() {
  return getActingUser() || null;
}

/** Human-friendly name for the acting identity. */
function getCloudSessionDisplayName() {
  var matched = getMatchedCloudProgramUser();
  if (matched) {
    var dn = typeof getOwnerDisplayName === 'function'
      ? getOwnerDisplayName(matched)
      : String(matched.name || '').trim();
    if (dn && dn !== '—') return dn;
  }
  if (isSessionProgramOwnerActor()) {
    var po = resolveProgramOwnerActorName();
    if (po) return po;
  }
  return getCloudSessionName() || 'Admin mode';
}

// ── acting identity ─────────────────────────────────────────────────────────
/** Best display name for the program owner, from the roster when available. */
function resolveProgramOwnerActorName() {
  var po = (state.programOwner || '').trim();
  if (po) return po;
  var ownerEmail = _sessionNormalizeEmail(state.programOwnerEmail);
  if (ownerEmail && state.users) {
    var match = state.users.find(function(u) {
      var em = _sessionNormalizeEmail(u.email);
      return em && em === ownerEmail;
    });
    if (match && match.name) return match.name;
  }
  return '';
}

/** True when the acting identity is the CISO / program owner. */
function isSessionProgramOwnerActor() {
  if (isCloudOwnerSession()) return true;

  var ownerName = String(state.programOwner || '').trim().toLowerCase();
  var ownerEmail = _sessionNormalizeEmail(state.programOwnerEmail);

  var records = getSessionPersonRecords();
  for (var i = 0; i < records.length; i++) {
    var u = records[i];
    if (u.role === 'ciso') return true;
    if (ownerName && String(u.name || '').trim().toLowerCase() === ownerName) return true;
    var uEm = _sessionNormalizeEmail(u.email);
    if (ownerEmail && uEm && uEm === ownerEmail) return true;
  }
  return false;
}

function getSessionActorName(fallback) {
  if (isSessionProgramOwnerActor()) {
    var programOwnerName = resolveProgramOwnerActorName();
    if (programOwnerName) return programOwnerName;
  }
  var u = getActingUser();
  if (u && u.name) return u.name;
  return fallback || state.programOwner || 'Program Owner';
}

function getControlWorkspaceTitle() {
  if (state.currentUserId) return 'My Controls';
  if (isCloudOwnerSession()) return 'Control design queue';
  return 'Controls';
}

function canReassignProgramWork() {
  if (!state.currentUserId) return true;
  var user = getActingUser();
  if (!user) return false;
  return user.role === 'ciso' || user.role === 'admin';
}

// ── ISP approver authorization (separation of duties) ───────────────────────
function ispApproverSodMessage() {
  return 'The person who owns and authors the Information Security Policy cannot also approve it (segregation of duties). Assign a different reviewer.';
}

function getISPDesignatedApproverEmail() {
  var ps = (state.policyStatus || {}).ISP || {};
  var rc = (state.policyReviewCycle || {}).ISP || {};
  var email = _sessionNormalizeEmail(ps.submittedToEmail || rc.approverEmail || '');
  if (email && ispApproverViolatesSeparationOfDuties(email, '')) return '';
  return email;
}

function getISPDesignatedApproverName() {
  var ps = (state.policyStatus || {}).ISP || {};
  var rc = (state.policyReviewCycle || {}).ISP || {};
  var nm = (ps.submittedTo || rc.approvedBy || '').trim();
  if (nm && ispApproverViolatesSeparationOfDuties('', nm)) return '';
  return nm;
}

function getISPDesignatedApproverRole() {
  var ps = (state.policyStatus || {}).ISP || {};
  var rc = (state.policyReviewCycle || {}).ISP || {};
  return (ps.submittedToRole || rc.approverRole || '').trim();
}

function ispHasNamedReviewer() {
  return !!(getISPDesignatedApproverEmail() || getISPDesignatedApproverName());
}

/** Admin or the program owner can name who reviews the ISP. Not a signatory. */
function canSessionNameISPApprover() {
  if (!state.currentUserId) return true;
  return isSessionProgramOwnerActor();
}

function findISPApproverRosterUser() {
  var email = getISPDesignatedApproverEmail();
  var name = getISPDesignatedApproverName();
  var users = state.users || [];
  function isApprover(u) {
    if (!u) return false;
    if (u.role === 'approver') return true;
    return (u.roles || []).indexOf('approver') !== -1;
  }
  if (email) {
    var em = email;
    var byEmail = users.find(function(u) {
      return isApprover(u) && _sessionNormalizeEmail(u.email) === em;
    });
    if (byEmail) return byEmail;
  }
  if (name) {
    var nm = name.toLowerCase();
    var withIsp = users.find(function(u) {
      return isApprover(u) && (u.name || '').trim().toLowerCase() === nm
        && (u.families || []).indexOf('ISP') !== -1;
    });
    if (withIsp) return withIsp;
    return users.find(function(u) {
      return isApprover(u) && (u.name || '').trim().toLowerCase() === nm;
    }) || null;
  }
  return null;
}

/** Email of the acting identity, or '' in Admin mode (which has no mailbox). */
function getSessionEmailForApproval() {
  var u = getActingUser();
  return (u && u.email) ? _sessionNormalizeEmail(u.email) : '';
}

function ispApproverViolatesSeparationOfDuties(approverEmail, approverName) {
  var ownerEmail = _sessionNormalizeEmail(state.programOwnerEmail);
  var ownerName = (state.programOwner || '').trim().toLowerCase();
  var em = _sessionNormalizeEmail(approverEmail);
  var nm = (approverName || '').trim().toLowerCase();
  if (em && ownerEmail && em === ownerEmail) return true;
  if (nm && ownerName && nm === ownerName) return true;
  return false;
}

function canSessionApproveISP() {
  var ispSt = ((state.policyStatus || {}).ISP || {}).status || '';
  if (ispSt !== 'Under Review') return false;
  // Admin mode and the program owner author the ISP — they cannot record their own approval.
  if (isSessionProgramOwnerActor()) return false;
  var user = getActingUser();
  var sessionEmail = getSessionEmailForApproval();
  var sessionName = user && user.name ? user.name : '';
  if (ispApproverViolatesSeparationOfDuties(sessionEmail, sessionName)) return false;
  var approverEmail = getISPDesignatedApproverEmail();
  if (approverEmail) {
    return !!sessionEmail && sessionEmail === approverEmail;
  }
  // No approver email collected in setup — match the rostered reviewer by name.
  if (!state.currentUserId) return false;
  if (!user || user.role !== 'approver' || (user.families || []).indexOf('ISP') === -1) return false;
  var approverName = getISPDesignatedApproverName().toLowerCase();
  return !!(approverName && user.name && user.name.trim().toLowerCase() === approverName);
}

/** True when the acting identity is the program owner who should revise a returned ISP. */
function canSessionReviseReturnedISP() {
  if (typeof getISPStatus === 'function' && getISPStatus() !== 'Returned') return false;
  return isSessionProgramOwnerActor();
}

// ── domain policy ownership + approver authorization ────────────────────────
/** True when the acting identity owns (drafts) the given policy family. */
function isSessionDomainPolicyOwnerActor(fam) {
  if (!fam) return false;
  var owner = typeof resolveEffectiveDomainOwner === 'function'
    ? resolveEffectiveDomainOwner(fam)
    : ((state.domainOwners || {})[fam] || {});
  var ownerName = (owner.name || '').trim().toLowerCase();
  var ownerEmail = _sessionNormalizeEmail(owner.email);
  if (!ownerName && !ownerEmail) return false;

  var poName = (state.programOwner || '').trim().toLowerCase();
  var poEmail = _sessionNormalizeEmail(state.programOwnerEmail);
  var ownerIsProgramOwner = (ownerEmail && poEmail && ownerEmail === poEmail)
    || (ownerName && poName && ownerName === poName);
  if (ownerIsProgramOwner && isSessionProgramOwnerActor()) return true;

  var records = getSessionPersonRecords();
  for (var i = 0; i < records.length; i++) {
    var uName = (records[i].name || '').trim().toLowerCase();
    var uEmail = _sessionNormalizeEmail(records[i].email);
    if (ownerName && uName && ownerName === uName) return true;
    if (ownerEmail && uEmail && ownerEmail === uEmail) return true;
  }
  return false;
}

function canSessionReviseReturnedDomainPolicy(fam) {
  var ps = (state.policyStatus || {})[fam] || {};
  if (ps.status !== 'Returned') return false;
  if (ps.returnedForReassignment) return false;
  if (typeof returnedDomainPolicyNeedsOwnerAssignment === 'function'
      && returnedDomainPolicyNeedsOwnerAssignment(fam)) return false;
  if (isSessionDomainPolicyOwnerActor(fam)) return true;
  // The program owner also owns domain policies — approver returns should still
  // land with them even if the per-domain roster row was cleared.
  if (state.cisoIsISSM && isSessionProgramOwnerActor()) {
    if (ps.returnedForRevision) return true;
    if ((state.domainPolicies || {})[fam]) return true;
  }
  return false;
}

function getSessionReturnedDomainPolicyFamilies() {
  var out = [];
  var families = typeof getMasterPolicyFamilies === 'function' ? getMasterPolicyFamilies() : [];
  families.forEach(function(fam) {
    if (canSessionReviseReturnedDomainPolicy(fam)) out.push(fam);
  });
  return out;
}

function getSessionReturnedDomainPoliciesNeedingOwner() {
  var out = [];
  if (typeof returnedDomainPolicyNeedsOwnerAssignment !== 'function') return out;
  if (!isSessionProgramOwnerActor()) return out;
  var families = typeof getMasterPolicyFamilies === 'function' ? getMasterPolicyFamilies() : [];
  families.forEach(function(fam) {
    if (returnedDomainPolicyNeedsOwnerAssignment(fam)) out.push(fam);
  });
  return out;
}

function validateISPApproverAssignment(rc, silent, opts) {
  opts = opts || {};
  rc = rc || (state.policyReviewCycle || {}).ISP || {};
  var approverEmail = (rc.approverEmail || '').trim();
  var approverName = (rc.approvedBy || '').trim();
  if (ispApproverViolatesSeparationOfDuties(approverEmail, approverName)) {
    if (!silent && typeof showToast === 'function') showToast(ispApproverSodMessage(), true);
    return false;
  }
  if (opts.requireNamed && !approverName && !approverEmail) {
    if (!silent && typeof showToast === 'function') {
      showToast('Assign a reviewer other than the program owner before this policy can be approved.', true);
    }
    return false;
  }
  return true;
}

function getDomainPolicyOwnerIdentity(fam) {
  var owner = ((state.domainOwners || {})[fam] || {});
  return {
    email: _sessionNormalizeEmail(owner.email),
    name: (owner.name || '').trim().toLowerCase()
  };
}

/** True when the domain owner is also the default approver (program owner). */
function domainPolicyRequiresSeparateApprover(fam) {
  var owner = getDomainPolicyOwnerIdentity(fam);
  var poEmail = _sessionNormalizeEmail(state.programOwnerEmail);
  var poName = (state.programOwner || '').trim().toLowerCase();
  if (owner.email && poEmail && owner.email === poEmail) return true;
  if (owner.name && poName && owner.name === poName) return true;
  return false;
}

function getDomainDesignatedApproverEmail(fam) {
  var ps = (state.policyStatus || {})[fam] || {};
  var rc = (state.policyReviewCycle || {})[fam] || {};
  var email = (ps.submittedToEmail || rc.approverEmail || '').trim();
  if (!email && !rc._customApprover) email = (state.programOwnerEmail || '').trim();
  return _sessionNormalizeEmail(email);
}

function getDomainDesignatedApproverName(fam) {
  var ps = (state.policyStatus || {})[fam] || {};
  var rc = (state.policyReviewCycle || {})[fam] || {};
  var nm = (ps.submittedTo || rc.approvedBy || '').trim();
  if (!nm && !rc._customApprover) nm = (state.programOwner || '').trim();
  return nm;
}

function domainPolicyApproverViolatesSeparationOfDuties(fam, approverEmail, approverName) {
  var owner = getDomainPolicyOwnerIdentity(fam);
  var em = _sessionNormalizeEmail(approverEmail);
  var nm = (approverName || '').trim().toLowerCase();
  if (owner.email && em && owner.email === em) return true;
  if (owner.name && nm && owner.name === nm) return true;
  return false;
}

function validateDomainApproverAssignment(fam, rc, silent) {
  rc = rc || (state.policyReviewCycle || {})[fam] || {};
  if (domainPolicyRequiresSeparateApprover(fam) && !rc._customApprover) {
    if (!silent && typeof showToast === 'function') {
      showToast('This domain policy must be approved by someone other than the policy drafter. Turn on "Different approver" and assign a separate reviewer.', true);
    }
    return false;
  }
  var useCustom = !!rc._customApprover;
  var approverEmail = useCustom ? (rc.approverEmail || '').trim() : (state.programOwnerEmail || '').trim();
  var approverName = useCustom ? (rc.approvedBy || '').trim() : (state.programOwner || '').trim();
  if (useCustom && !approverName) {
    if (!silent && typeof showToast === 'function') {
      showToast('Enter the approver name in the Policy Review card.', true);
    }
    return false;
  }
  if (domainPolicyApproverViolatesSeparationOfDuties(fam, approverEmail, approverName)) {
    if (!silent && typeof showToast === 'function') {
      showToast('The policy approver must be a different person than the domain policy owner who drafted it (separation of duties).', true);
    }
    return false;
  }
  return true;
}

function canSessionApproveDomainPolicy(fam) {
  var ps = (state.policyStatus || {})[fam] || {};
  if (ps.status !== 'Under Review') return false;
  var approverEmail = getDomainDesignatedApproverEmail(fam);
  if (approverEmail) {
    var sessionEmail = getSessionEmailForApproval();
    if (domainPolicyApproverViolatesSeparationOfDuties(fam, sessionEmail, '')) return false;
    if (sessionEmail && sessionEmail === approverEmail) return true;
  }
  if (!state.currentUserId) {
    return !domainPolicyApproverViolatesSeparationOfDuties(fam, state.programOwnerEmail, state.programOwner);
  }
  var user = getActingUser();
  if (!user) return false;
  if (domainPolicyApproverViolatesSeparationOfDuties(fam, user.email, user.name)) return false;
  var approverName = getDomainDesignatedApproverName(fam).toLowerCase();
  return !!(approverName && user.name && user.name.trim().toLowerCase() === approverName);
}

try {
  window.getSessionPersonRecords = getSessionPersonRecords;
  window.getActingUser = getActingUser;
  window.isCloudSessionActive = isCloudSessionActive;
  window.isCloudLocked = isCloudLocked;
  window.isCloudOwnerSession = isCloudOwnerSession;
  window.isCloudProgramOwner = isCloudProgramOwner;
  window.getCloudSessionEmail = getCloudSessionEmail;
  window.getCloudSessionName = getCloudSessionName;
  window.getCloudSessionDisplayName = getCloudSessionDisplayName;
  window.getMatchedCloudProgramUser = getMatchedCloudProgramUser;
  window.resolveProgramOwnerActorName = resolveProgramOwnerActorName;
  window.isSessionProgramOwnerActor = isSessionProgramOwnerActor;
  window.getSessionActorName = getSessionActorName;
  window.getControlWorkspaceTitle = getControlWorkspaceTitle;
  window.canReassignProgramWork = canReassignProgramWork;
  window.getISPDesignatedApproverEmail = getISPDesignatedApproverEmail;
  window.getISPDesignatedApproverName = getISPDesignatedApproverName;
  window.getISPDesignatedApproverRole = getISPDesignatedApproverRole;
  window.ispHasNamedReviewer = ispHasNamedReviewer;
  window.canSessionNameISPApprover = canSessionNameISPApprover;
  window.findISPApproverRosterUser = findISPApproverRosterUser;
  window.getSessionEmailForApproval = getSessionEmailForApproval;
  window.ispApproverSodMessage = ispApproverSodMessage;
  window.ispApproverViolatesSeparationOfDuties = ispApproverViolatesSeparationOfDuties;
  window.canSessionApproveISP = canSessionApproveISP;
  window.canSessionReviseReturnedISP = canSessionReviseReturnedISP;
  window.isSessionDomainPolicyOwnerActor = isSessionDomainPolicyOwnerActor;
  window.canSessionReviseReturnedDomainPolicy = canSessionReviseReturnedDomainPolicy;
  window.getSessionReturnedDomainPolicyFamilies = getSessionReturnedDomainPolicyFamilies;
  window.getSessionReturnedDomainPoliciesNeedingOwner = getSessionReturnedDomainPoliciesNeedingOwner;
  window.validateISPApproverAssignment = validateISPApproverAssignment;
  window.getDomainPolicyOwnerIdentity = getDomainPolicyOwnerIdentity;
  window.domainPolicyRequiresSeparateApprover = domainPolicyRequiresSeparateApprover;
  window.getDomainDesignatedApproverEmail = getDomainDesignatedApproverEmail;
  window.getDomainDesignatedApproverName = getDomainDesignatedApproverName;
  window.domainPolicyApproverViolatesSeparationOfDuties = domainPolicyApproverViolatesSeparationOfDuties;
  window.validateDomainApproverAssignment = validateDomainApproverAssignment;
  window.canSessionApproveDomainPolicy = canSessionApproveDomainPolicy;
} catch (e) {}
