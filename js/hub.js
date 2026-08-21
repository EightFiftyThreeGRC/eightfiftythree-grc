// js/hub.js — Command Center (post-setup home dashboard)

function getSetupProgressSummary() {
  if (typeof getResolvedProgramPath === 'function' && getResolvedProgramPath() === 'map'
      && typeof getPolicyMapProgressSummary === 'function') {
    return getPolicyMapProgressSummary();
  }
  var step = (typeof currentStep !== 'undefined' && currentStep.ciso) ? currentStep.ciso : 1;
  var pct = Math.round((step / 7) * 100);
  var labels = ['Organization', 'Baseline', 'Reg mapping', 'PM Controls', 'InfoSec Policy', 'Consolidate', 'Assign Owners'];
  return { step: step, pct: pct, label: labels[step - 1] || 'Organization', total: 7 };
}

function startProgramSetup() {
  showTab('ciso');
  goToStep('ciso', 1);
}

/** Escape a value for embedding in an HTML onclick single-quoted JS string literal. */
function hubJsStringLiteral(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Signed-in user for Command Center queue filtering (null = admin / show all pending). */
function getHubCurrentUser() {
  if (!state.currentUserId || !(state.users || []).length) return null;
  return state.users.find(function (u) { return u.id === state.currentUserId; }) || null;
}

/** Command Center → open a queued SSP read-only (same path as Reports queue Open). */
function hubOpenQueuedSsp(scopeId, isProcess) {
  if (typeof ensureBuiltinProgramProcesses === 'function') ensureBuiltinProgramProcesses();
  if (typeof aoOpenQueuedSsp === 'function') {
    aoOpenQueuedSsp(scopeId, !!isProcess);
    return;
  }
  if (typeof openSspReadOnlyFromQueue === 'function') {
    openSspReadOnlyFromQueue(scopeId, !!isProcess, 'reports');
    return;
  }
  showToast('Unable to open SSP package.', true);
}

/** One delegated listener for hub cards that use data-hub-action (avoids brittle inline onclick). */
function ensureHubActionDelegation() {
  if (window._hubActionDelegationBound) return;
  document.addEventListener('click', function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest('[data-hub-action]') : null;
    if (!btn) return;
    var kind = btn.getAttribute('data-hub-action');
    if (kind === 'ssp-review') {
      ev.preventDefault();
      var scopeId = btn.getAttribute('data-scope-id') || '';
      var isProcess = btn.getAttribute('data-is-process') === '1';
      hubOpenQueuedSsp(scopeId, isProcess);
    }
  });
  window._hubActionDelegationBound = true;
}

function renderHubActionCardHtml(a) {
  var inner = '<span class="hub-action-icon">' + (typeof icon === 'function' ? icon(a.icon, 18) : a.icon) + '</span>'
    + '<div><div class="hub-action-label">' + escapeHTML(a.label) + '</div>'
    + '<div class="hub-action-desc">' + escapeHTML(a.desc) + '</div></div>'
    + '<span class="hub-action-arrow">' + (typeof icon === 'function' ? icon('arrow-right', 16) : '\u2192') + '</span>';
  if (a.kind === 'ssp-review') {
    return '<button type="button" class="hub-action-card" data-hub-action="ssp-review" data-scope-id="'
      + escapeHTML(a.scopeId || '') + '" data-is-process="' + (a.isProcess ? '1' : '0') + '">' + inner + '</button>';
  }
  return '<button type="button" class="hub-action-card" onclick="' + a.action + '">' + inner + '</button>';
}

/** Command Center → Reports → Program library page. */
function hubOpenReportsLibrary(page) {
  if (typeof goToReportsLibrary === 'function') goToReportsLibrary(page === 'controls' ? 'controls' : 'policies');
  else if (typeof showTab === 'function') showTab('reports');
}

function renderOnboardingRingHtml(step, total, label) {
  var circ = 326.73;
  var frac = Math.max(0.08, Math.min(1, (Number(step) || 1) / (Number(total) || 7)));
  var offset = (circ * (1 - frac)).toFixed(2);
  var aria = 'Step ' + step + ' of ' + total + (label ? ', ' + label : '');
  return ''
    + '<div class="onboard-ring" role="img" aria-label="' + escapeHTML(aria) + '">'
    + '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">'
    + '<circle class="onboard-ring-track" cx="60" cy="60" r="52" fill="none" stroke-width="8"/>'
    + '<circle class="onboard-ring-fill" cx="60" cy="60" r="52" fill="none" stroke-width="8"'
    + ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"'
    + ' transform="rotate(-90 60 60)"/>'
    + '</svg>'
    + '<div class="onboard-ring-fig">'
    + '<span class="onboard-ring-num">' + escapeHTML(String(step)) + '</span>'
    + '<span class="onboard-ring-den">of ' + escapeHTML(String(total)) + '</span>'
    + '</div>'
    + '</div>';
}

function renderOnboardingHome() {
  var body = document.getElementById('home-body');
  // The cover below is this screen's only headline, so the standard page header
  // would just restate it. renderHomeTab() restores the header for the dashboard.
  var pageHeader = document.querySelector('#tab-home .page-header');
  if (pageHeader) pageHeader.style.display = 'none';
  if (!body) return;

  var chosen = typeof getResolvedProgramPath === 'function' ? getResolvedProgramPath() : (state.programPath || '');
  var progress = getSetupProgressSummary();
  var hasStarted = !!(String(state.orgName || '').trim() || String(state.programOwner || '').trim() || state.baseline);
  var total = progress.total || (chosen === 'map' ? 6 : 7);

  // Nothing chosen yet: two equal-weight path cards. Do not auto-select.
  if (!chosen) {
    body.innerHTML = ''
      + '<div class="onboard onboard--cover onboard--paths">'
      + '<div class="onboard-cover-copy">'
      + '<p class="onboard-eyebrow">Program setup</p>'
      + '<h1 class="onboard-title">How do you want to start?</h1>'
      + '<p class="onboard-lead">Stand up policy from a blank page, or map documents you already have to NIST 800-53.</p>'
      + '</div>'
      + '<div class="onboard-path-grid" role="group" aria-label="Program setup path">'
      + '<button type="button" class="onboard-path-card" onclick="chooseProgramPath(\'build\')">'
      + '<p class="onboard-path-kicker">Path A</p>'
      + '<h2 class="onboard-path-title">Build from scratch</h2>'
      + '<p class="onboard-path-desc">ISP, domain policies, and control assignments in seven steps.</p>'
      + '<span class="onboard-path-cta">Start Path A</span>'
      + '</button>'
      + '<button type="button" class="onboard-path-card" onclick="chooseProgramPath(\'map\')">'
      + '<p class="onboard-path-kicker">Path B</p>'
      + '<h2 class="onboard-path-title">Map what you have</h2>'
      + '<p class="onboard-path-desc">Catalog existing policies and align them to NIST 800-53. See coverage gaps.</p>'
      + '<span class="onboard-path-cta">Start Path B</span>'
      + '</button>'
      + '</div>'
      + '<p class="onboard-path-foot">You can switch later. Mapping work and drafted policies are kept.</p>'
      + '</div>';
    return;
  }

  var isMap = chosen === 'map';
  var continueFn = isMap ? 'continuePolicyMapSetup()' : 'startProgramSetup()';
  var pathLabel = isMap ? 'Map what you have' : 'Build from scratch';
  var title = hasStarted
    ? escapeHTML(progress.label || 'Continue')
    : (isMap ? 'Map your existing policies' : 'Stand up your program');
  var lead = hasStarted
    ? 'Everything you\u2019ve entered is saved. This is the next screen.'
    : (isMap
      ? 'Catalog the documents you already have, map them to NIST 800-53, then close the gaps.'
      : 'Seven short steps. Baseline, policies, controls, owners. One screen at a time.');
  var cta = hasStarted ? 'Continue' : (isMap ? 'Start mapping' : 'Start setup');

  body.innerHTML = ''
    + '<div class="onboard onboard--cover onboard--resume">'
    + '<div class="onboard-cover-copy">'
    + '<p class="onboard-eyebrow">Program setup \u00b7 ' + escapeHTML(pathLabel) + '</p>'
    + '<h1 class="onboard-title">' + title + '</h1>'
    + '<p class="onboard-lead">' + lead + '</p>'
    + '<button type="button" class="btn onboard-cta" onclick="' + continueFn + '">' + cta + '</button>'
    + '<p class="onboard-path-switch"><button type="button" class="onboard-path-switch-btn" onclick="promptSwitchProgramPath()">Choose a different path</button></p>'
    + '</div>'
    + '<div class="onboard-cover-progress">'
    + renderOnboardingRingHtml(progress.step || 1, total, progress.label)
    + '</div>'
    + '</div>';
}

function getNextActions() {
  var actions = [];
  var today = new Date().toISOString().slice(0, 10);

  if (!state.cisoComplete) {
    var p = getSetupProgressSummary();
    var total = p.total || 7;
    var isMap = typeof getResolvedProgramPath === 'function' && getResolvedProgramPath() === 'map';
    actions.push({
      priority: 1,
      icon: '🏛️',
      label: 'Continue program setup',
      desc: 'Step ' + p.step + ' of ' + total + ' \u2014 ' + p.label + '.',
      action: isMap ? 'continuePolicyMapSetup();' : 'startProgramSetup();'
    });
    return actions;
  }

  var polReview = (state.policyStatus || {});
  Object.keys(polReview).forEach(function(fam) {
    if (fam === 'ISP') return;
    var st = (polReview[fam] || {}).status;
    if (st === 'Under Review' && typeof canSessionApproveDomainPolicy === 'function' && canSessionApproveDomainPolicy(fam)) {
      var title = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(fam) : fam;
      actions.push({
        priority: 2,
        icon: '📋',
        label: 'Approve policy: ' + title,
        desc: 'Domain policy awaiting your sign-off.',
        action: "openCISOReview('" + fam.replace(/'/g, "\\'") + "');"
      });
    }
  });

  var hubUser = typeof getHubCurrentUser === 'function' ? getHubCurrentUser() : null;
  if (typeof getSspReviewQueueItemsForUser === 'function') {
    getSspReviewQueueItemsForUser(hubUser).slice(0, 5).forEach(function(r) {
      var isProc = !!r.isProcessSsp;
      actions.push({
        priority: 1,
        icon: '📋',
        label: 'Review SSP: ' + (r.assetName || 'Package'),
        desc: 'Submitted by ' + (r.submittedBy || 'owner') + (r.date ? ' on ' + r.date : ''),
        kind: 'ssp-review',
        scopeId: String(r.assetId || ''),
        isProcess: isProc,
      });
    });
  }

  if (typeof getSspPackagesAwaitingReviewByOthers === 'function') {
    getSspPackagesAwaitingReviewByOthers().slice(0, 3).forEach(function(pkg) {
      actions.push({
        priority: 2,
        icon: '⏳',
        label: 'SSP awaiting review: ' + (pkg.name || 'Package'),
        desc: 'Submitted — with ' + (pkg.reviewerLabel || 'designated reviewer'),
        action: "showTab('reports');"
      });
    });
  }

  (state.controlReviewQueue || []).slice(0, 5).forEach(function(r) {
    if (!r || !r.controlId || r.type === 'ssp') return;
    var cs = (state.controlStatus || {})[r.controlId] || {};
    var isReturn = r.type === 'control-return' || r.status === 'Returned to Policy Owner' || !!cs.returnedToPolicyOwner;
    var escId = r.controlId.replace(/'/g, "\\'");
    var action = isReturn
      ? "openControlReassignmentModal('" + escId + "');"
      : "state._selectedCtrl='" + escId + "';showTab('control');goToStep('control',2);";
    actions.push({ priority: 3, icon: isReturn ? '↩' : '🔧', label: (isReturn ? 'Reassign control: ' : 'Review control: ') + r.controlId, desc: (r.status || 'Pending review'), action: action });
  });

  if (typeof getRiskHubNextActions === 'function') {
    getRiskHubNextActions().forEach(function(a) { actions.push(a); });
  }

  if (typeof getISPStatus === 'function' && getISPStatus() === 'Under Review') {
    var ispTitle = ((state.infoSecPolicy && state.infoSecPolicy.title) ? String(state.infoSecPolicy.title).trim() : '')
      || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
    var ispCanApprove = typeof canSessionApproveISP === 'function' && canSessionApproveISP();
    var ispIsApproverRole = false;
    if (state.currentUserId && state.users) {
      (state._currentPersonIds || [state.currentUserId]).forEach(function(pid) {
        var rec = state.users.find(function(u) { return u.id === pid; });
        if (rec && rec.role === 'approver') ispIsApproverRole = true;
      });
    }
    if (ispCanApprove || ispIsApproverRole) {
      actions.push({
        priority: 0,
        icon: '✅',
        label: 'Approve ISP: ' + ispTitle,
        desc: 'Tier 1 Information Security Policy is awaiting your sign-off.',
        action: "showTab('reports');goToCISOPolicyEditor();"
      });
    }
  }

  if (typeof canSessionReviseReturnedISP === 'function' && canSessionReviseReturnedISP()) {
    var returnedIspTitle = ((state.infoSecPolicy && state.infoSecPolicy.title) ? String(state.infoSecPolicy.title).trim() : '')
      || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
    var returnedNotes = String(((state.policyStatus || {}).ISP || {}).notes || '').trim();
    var returnedDesc = returnedNotes
      ? 'Returned with comments: ' + returnedNotes.slice(0, 80) + (returnedNotes.length > 80 ? '\u2026' : '')
      : 'Tier 1 Information Security Policy was returned for your revision.';
    actions.push({
      priority: 0,
      icon: '\u21A9',
      label: 'Revise ISP: ' + returnedIspTitle,
      desc: returnedDesc,
      action: 'openISPForRevision();'
    });
  }

  var returnedDomainFams = typeof getSessionReturnedDomainPolicyFamilies === 'function'
    ? getSessionReturnedDomainPolicyFamilies() : [];
  returnedDomainFams.forEach(function(fam) {
    var title = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(fam) : fam;
    var domainNotes = String(((state.policyStatus || {})[fam] || {}).notes || '').trim();
    var domainDesc = domainNotes
      ? 'Returned with comments: ' + domainNotes.slice(0, 80) + (domainNotes.length > 80 ? '\u2026' : '')
      : 'Domain policy was returned for your revision and resubmission.';
    actions.push({
      priority: 0,
      icon: '\u21A9',
      label: 'Revise policy: ' + title,
      desc: domainDesc,
      action: "typeof openReturnedDomainPolicyRevision === 'function' ? openReturnedDomainPolicyRevision('" + fam.replace(/'/g, "\\'") + "') : showTab('policy');"
    });
  });

  var returnedNeedOwner = typeof getSessionReturnedDomainPoliciesNeedingOwner === 'function'
    ? getSessionReturnedDomainPoliciesNeedingOwner() : [];
  returnedNeedOwner.forEach(function(fam) {
    var title = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(fam) : fam;
    var domainNotes = String(((state.policyStatus || {})[fam] || {}).notes || '').trim();
    var domainDesc = domainNotes
      ? 'Returned — assign an owner before revision: ' + domainNotes.slice(0, 60) + (domainNotes.length > 60 ? '\u2026' : '')
      : 'Returned domain policy has no owner assigned yet.';
    actions.push({
      priority: 0,
      icon: '\ud83d\udc64',
      label: 'Assign policy owner: ' + title,
      desc: domainDesc,
      action: "typeof openAssignDomainPolicyOwnerModal === 'function' ? openAssignDomainPolicyOwnerModal('" + fam.replace(/'/g, "\\'") + "') : showTab('policy');"
    });
  });

  if (typeof isSessionProgramOwnerActor === 'function' && isSessionProgramOwnerActor()) {
    Object.keys(state.policyStatus || {}).forEach(function(fam) {
      if (fam === 'ISP') return;
      var ps = state.policyStatus[fam] || {};
      if (ps.status !== 'Returned' || !ps.returnedForReassignment) return;
      if (typeof returnedDomainPolicyNeedsOwnerAssignment === 'function'
          && returnedDomainPolicyNeedsOwnerAssignment(fam)) return;
      var title = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(fam) : fam;
      actions.push({
        priority: 1,
        icon: '\u21A9',
        label: 'Reassign policy: ' + title,
        desc: 'A domain owner returned this policy for reassignment.',
        action: "typeof openAssignDomainPolicyOwnerModal === 'function' ? openAssignDomainPolicyOwnerModal('" + fam.replace(/'/g, "\\'") + "') : startProgramSetup();"
      });
    });
  }

  (state.assets || []).forEach(function(a) {
    var signoff = (state.sspSignoffs || {})[a.id] || {};
    if (signoff.status === 'Submitted') {
      actions.push({ priority: 4, icon: '🖥️', label: 'SSP submitted: ' + a.name, desc: 'Review asset package on Reports.', action: "showTab('reports');" });
    }
  });

  actions.sort(function(a, b) { return a.priority - b.priority; });
  return actions.slice(0, 8);
}

function getHubSessionUser() {
  if (!state.currentUserId || !state.users) return null;
  return state.users.find(function(u) { return u.id === state.currentUserId; }) || null;
}

function getHubVisibleTabIds() {
  var user = getHubSessionUser();
  if (!user) return typeof TAB_IDS !== 'undefined' ? TAB_IDS.slice() : ['home', 'reports'];
  return typeof getPersonVisibleTabIds === 'function' ? getPersonVisibleTabIds(user) : ['reports'];
}

function getHubPersonRoles(user) {
  var roles = [];
  if (!user) return roles;
  (state._currentPersonIds || [user.id]).forEach(function(pid) {
    var rec = (state.users || []).find(function(u) { return u.id === pid; });
    if (!rec) return;
    (rec.roles && rec.roles.length ? rec.roles : [rec.role]).forEach(function(r) {
      if (roles.indexOf(r) === -1) roles.push(r);
    });
  });
  return roles;
}

function countPublishedPolicyItems() {
  var n = 0;
  if (typeof getISPStatus === 'function' && getISPStatus() === 'Approved') n++;
  var families = typeof getMasterPolicyFamilies === 'function' ? getMasterPolicyFamilies() : [];
  families.forEach(function(fam) {
    if (((state.policyStatus || {})[fam] || {}).status === 'Approved') n++;
  });
  return n;
}

function countImplementedControls() {
  var n = 0;
  (typeof getActiveControls === 'function' ? getActiveControls() : []).forEach(function(c) {
    var st = (state.controlStatus || {})[c.id];
    if (st && (st.status === 'Implemented' || st.status === 'Inherited')) n++;
  });
  return n;
}

function userHasPolicyDraftWork(user) {
  if (typeof canSessionReviseReturnedISP === 'function' && canSessionReviseReturnedISP()) return true;
  if (typeof getSessionReturnedDomainPoliciesNeedingOwner === 'function' && getSessionReturnedDomainPoliciesNeedingOwner().length) return true;
  if (!user) {
    if (typeof getISPStatus === 'function' && getISPStatus() !== 'Approved') return true;
    var allFams = typeof getMasterPolicyFamilies === 'function' ? getMasterPolicyFamilies() : [];
    return allFams.some(function(fam) {
      var st = ((state.policyStatus || {})[fam] || {}).status || 'Not Started';
      return st !== 'Approved';
    });
  }
  var families = [];
  (state._currentPersonIds || [user.id]).forEach(function(pid) {
    var rec = (state.users || []).find(function(u) { return u.id === pid; });
    if (!rec) return;
    var recRoles = rec.roles && rec.roles.length ? rec.roles : [rec.role];
    if (recRoles.indexOf('issm') !== -1 || recRoles.indexOf('custodian') !== -1 || recRoles.indexOf('ciso') !== -1) {
      (rec.families || []).forEach(function(f) {
        if (families.indexOf(f) === -1) families.push(f);
      });
    }
  });
  if (!families.length) return false;
  return families.some(function(fam) {
    var st = ((state.policyStatus || {})[fam] || {}).status || 'Not Started';
    return st !== 'Approved';
  });
}

function userHasControlDraftWork(user) {
  var scoped = typeof getScopedControls === 'function' ? getScopedControls() : [];
  if (!scoped.length) return false;
  return scoped.some(function(c) {
    var st = (state.controlStatus || {})[c.id];
    var status = st ? st.status : 'Not Started';
    return status !== 'Implemented' && status !== 'Inherited';
  });
}

function userHasFrameworkMapping() {
  if (!state.baseline) return false;
  var fw = typeof getActiveFrameworkIds === 'function' ? getActiveFrameworkIds() : [];
  var laws = typeof getActiveComplianceLawIds === 'function' ? getActiveComplianceLawIds() : [];
  return fw.length > 0 || laws.length > 0;
}

function getScopedRiskIssueOpenCount(user) {
  if (typeof getScopedIssueOpenCount === 'function') return getScopedIssueOpenCount(user);
  return typeof getCombinedOpenRiskIssueCount === 'function' ? getCombinedOpenRiskIssueCount() : 0;
}

function userHasAssetWorkspaceContent(user) {
  var tabs = getHubVisibleTabIds();
  if (tabs.indexOf('asset') === -1) return false;
  var assetIds = typeof getCurrentPersonAssetIds === 'function' ? getCurrentPersonAssetIds() : null;
  if (assetIds && assetIds.length) return true;
  if (!user || !state.currentUserId) return (state.assets || []).length > 0;
  var roles = getHubPersonRoles(user);
  if (roles.indexOf('ao') !== -1 || roles.indexOf('ciso') !== -1 || roles.indexOf('assessor') !== -1) {
    return (state.assets || []).length > 0;
  }
  return false;
}

/** Policy workspace blurb: ISP is Govern; remaining families package as function policies. */
function hubPolicyWorkspaceCopy(publishedPolicies, policyDraft, canEdit) {
  var shape = 'ISP (Govern) and function policies';
  if (canEdit) return shape;
  if (publishedPolicies > 0) {
    return publishedPolicies + ' approved polic' + (publishedPolicies === 1 ? 'y' : 'ies') + ' in catalog';
  }
  return policyDraft ? shape : 'Policy catalog';
}

/** Command Center workspace tiles \u2014 role-visible workspaces, not a leftover content filter. */
function getHubWorkspaces() {
  var user = getHubSessionUser();
  var tabs = getHubVisibleTabIds();
  var workspaces = [];
  var publishedPolicies = countPublishedPolicyItems();
  var policyDraft = userHasPolicyDraftWork(user);
  var implementedControls = countImplementedControls();
  var controlDraft = userHasControlDraftWork(user);
  var canPolicy = tabs.indexOf('policy') !== -1;
  var canControl = tabs.indexOf('control') !== -1;

  if (canPolicy || publishedPolicies > 0 || policyDraft) {
    var policyFn = (policyDraft && canPolicy) ? 'goToPoliciesHome()' : 'goToPolicyLibrary()';
    workspaces.push({
      icon: '\uD83D\uDCCB',
      label: 'Policies',
      desc: hubPolicyWorkspaceCopy(publishedPolicies, policyDraft, policyDraft && canPolicy),
      fn: policyFn,
      group: 'design'
    });
  }

  if (canControl || implementedControls > 0 || controlDraft) {
    var ctrlFn = (controlDraft && canControl) ? 'goToControlWorkspace()' : 'goToControlLibrary()';
    var ctrlDesc = canControl
      ? 'Control design and implementation'
      : (implementedControls > 0
        ? implementedControls + ' implemented control' + (implementedControls === 1 ? '' : 's') + ' in catalog'
        : 'Control catalog');
    workspaces.push({ icon: '\uD83D\uDD27', label: 'Controls', desc: ctrlDesc, fn: ctrlFn, group: 'design' });
  }

  if (tabs.indexOf('frameworks') !== -1) {
    workspaces.push({
      icon: '\u25C7',
      label: 'Frameworks',
      desc: 'CSF 2.0 outcomes \u2014 ISO, SOC 2, HIPAA, SOX overlays',
      fn: "showTab('frameworks')",
      group: 'design'
    });
  }

  if (tabs.indexOf('asset') !== -1) {
    workspaces.push({
      icon: '\uD83D\uDDA5',
      label: 'Assets & SSP',
      desc: 'Inventory & attestations',
      fn: 'goToAssetWorkspace()',
      group: 'compliance'
    });
  }

  if (tabs.indexOf('risk') !== -1) {
    var riskOpen = getScopedRiskIssueOpenCount(user);
    var riskNoun = typeof hasPm4PoamControl === 'function' && hasPm4PoamControl() ? 'POA&M & risks' : 'risks & issues';
    var riskDesc = riskOpen > 0 ? (riskOpen + ' open ' + riskNoun) : 'Register, issues, and triage';
    workspaces.push({ icon: '\u26A1', label: 'Risks & Issues', desc: riskDesc, fn: "showTab('risk')", group: 'compliance' });
  }

  if (tabs.indexOf('reports') !== -1) {
    workspaces.push({ icon: '\uD83D\uDCCA', label: 'Reports', desc: 'Program dashboard', fn: "showTab('reports')", group: 'program' });
    if (typeof userHasReportsLibraryAccess === 'function' && userHasReportsLibraryAccess(user)) {
      workspaces.push({
        icon: '\uD83D\uDCDA',
        label: 'Program library',
        desc: 'Published policies & control requirements',
        fn: "goToReportsLibrary('policies')",
        group: 'program'
      });
    }
  }

  if (tabs.indexOf('users') !== -1) {
    workspaces.push({
      icon: '\uD83D\uDC65',
      label: 'Users & roles',
      desc: 'Program roster and roles',
      fn: "showTab('users')",
      group: 'program'
    });
  }

  return workspaces;
}

function renderHubWorkspaceGroupHtml(title, items) {
  if (!items || !items.length) return '';
  return '<div class="hub-workspace-group">'
    + '<div class="hub-workspace-group-label">' + escapeHTML(title) + '</div>'
    + '<div class="hub-workspace-grid">' + items.map(function(w) {
      return '<button type="button" class="hub-workspace-card" onclick="' + w.fn + '">'
        + '<span class="hub-workspace-icon">' + (typeof icon === 'function' ? icon(w.icon, 20) : w.icon) + '</span>'
        + '<span class="hub-workspace-label">' + escapeHTML(w.label) + '</span>'
        + '<span class="hub-workspace-desc">' + escapeHTML(w.desc) + '</span></button>';
    }).join('') + '</div></div>';
}

function shouldShowHubFrameworkStrip() {
  var tabs = getHubVisibleTabIds();
  return tabs.indexOf('frameworks') !== -1 && userHasFrameworkMapping();
}

function shouldShowHubRiskStrip() {
  var tabs = getHubVisibleTabIds();
  if (tabs.indexOf('risk') === -1) return false;
  return (typeof getCombinedOpenRiskIssueCount === 'function' && getCombinedOpenRiskIssueCount() > 0)
    || (typeof getTriagePendingCount === 'function' && getTriagePendingCount() > 0);
}

function updateCommandCenterPageHeader() {
  var subtitle = document.getElementById('home-page-subtitle');
  if (!subtitle || !state.cisoComplete) return;
  var org = (state.orgName || '').trim() || 'Your organization';
  var baseline = state.baseline ? (state.baseline === 'L' ? 'Low' : state.baseline === 'M' ? 'Moderate' : 'High') : '—';
  subtitle.textContent = org + ' · ' + baseline + ' baseline · posture and next actions';
}

function renderHomeTab() {
  var body = document.getElementById('home-body');
  if (!body) return;

  if (!state.cisoComplete) {
    renderOnboardingHome();
    return;
  }

  var pageHeader = document.querySelector('#tab-home .page-header');
  if (pageHeader) pageHeader.style.display = '';
  updateCommandCenterPageHeader();

  var ctrlTotal = typeof getActiveControls === 'function' ? getActiveControls().length : 0;
  var implemented = 0;
  if (typeof getActiveControls === 'function') {
    getActiveControls().forEach(function(c) {
      var st = (state.controlStatus || {})[c.id];
      if (st && (st.status === 'Implemented' || st.status === 'Inherited')) implemented++;
    });
  }
  var implPct = ctrlTotal ? Math.round((implemented / ctrlTotal) * 100) : 0;
  var ownerCount = countUniquePolicyOwnerEmails();
  var domainsAssigned = countAssignedPolicyDomains();
  var domainTotal = getMasterPolicyFamilies().length;
  var actions = getNextActions();

  var actionHtml = actions.length
    ? actions.map(function(a) { return renderHubActionCardHtml(a); }).join('')
    : '<div class="hub-empty-actions">You\'re caught up — open a workspace from the sidebar or the cards below.</div>';

  ensureHubActionDelegation();

  var workspaces = getHubWorkspaces();
  var designWorkspaces = workspaces.filter(function(w) { return w.group === 'design'; });
  var complianceWorkspaces = workspaces.filter(function(w) { return w.group === 'compliance'; });
  var programWorkspaces = workspaces.filter(function(w) { return w.group === 'program'; });

  var workspaceHtml = workspaces.length
    ? renderHubWorkspaceGroupHtml('Policy & control design', designWorkspaces)
      + renderHubWorkspaceGroupHtml('Asset & process compliance', complianceWorkspaces)
      + (programWorkspaces.length ? renderHubWorkspaceGroupHtml('Program', programWorkspaces) : '')
    : '<div class="hub-empty-actions">No workspaces for your role right now.</div>';

  body.innerHTML = ''
    + '<div class="hub-dashboard">'
    + '<div class="hub-kpi-grid">'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + implPct + '%</div><div class="hub-kpi-label">Controls implemented</div><div class="hub-kpi-sub">' + implemented + ' / ' + ctrlTotal + '</div></div>'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + ownerCount + '</div><div class="hub-kpi-label">Policy owners</div><div class="hub-kpi-sub">' + domainsAssigned + ' / ' + domainTotal + ' domains rostered</div></div>'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + (state.assets || []).length + '</div><div class="hub-kpi-label">Assets in inventory</div></div>'
    + '<div class="hub-kpi"><div class="hub-kpi-val">' + (typeof getCombinedOpenRiskIssueCount === 'function' ? getCombinedOpenRiskIssueCount() : 0) + '</div><div class="hub-kpi-label">Open risks &amp; issues</div></div>'
    + '</div>'
    + (typeof renderCsfCoverageStripHtml === 'function' ? renderCsfCoverageStripHtml('strip') : '')
    + (shouldShowHubFrameworkStrip() && typeof renderFrameworkDashboardStripHtml === 'function' ? renderFrameworkDashboardStripHtml() : '')
    + '<div class="hub-lower-grid">'
    + '<div class="hub-section hub-section-card"><h3 class="hub-section-title">Your next actions</h3><div class="hub-actions">' + actionHtml + '</div></div>'
    + '<div class="hub-section hub-section-card"><h3 class="hub-section-title">Workspaces</h3><div class="hub-workspace-groups">'
    + workspaceHtml
    + '</div></div>'
    + '</div>'
    + (shouldShowHubRiskStrip() && typeof renderRiskSummaryHtml === 'function' ? renderRiskSummaryHtml() : '')
    + '</div>';
}

function getActiveTabIdFromDom() {
  var el = document.querySelector('.tab-panel.active');
  return el && el.id ? el.id.replace(/^tab-/, '') : 'home';
}

/** Top-of-app program lifecycle roadmap (Phase 1–3). */
function renderProgramPhaseBar() {
  var bar = document.getElementById('program-phase-bar');
  if (!bar) return;

  var phase1Complete = !!state.cisoComplete;
  var tab = getActiveTabIdFromDom();

  // First-run and resume-setup Command Center: the cover is the UI. A three-card
  // phase roadmap on top of it is competing chrome.
  if (!phase1Complete && tab === 'home') {
    bar.innerHTML = '';
    bar.style.display = 'none';
    return;
  }
  bar.style.display = '';

  var phase1Tabs = { ciso: 1, policy: 1, control: 1, asset: 1 };
  var focusPhase = !phase1Complete ? 1 : (tab === 'risk' ? 2 : (phase1Tabs[tab] ? 1 : 2));

  var phases = [
    {
      n: 1,
      label: 'Phase 1',
      title: 'Set up program governance',
      desc: 'ISP, domain policies, controls, assets & SSP attestation',
      state: phase1Complete ? 'complete' : 'active',
      focused: focusPhase === 1,
      action: "showTab('ciso')",
      status: phase1Complete ? 'Complete' : 'In progress'
    },
    {
      n: 2,
      label: 'Phase 2',
      title: 'Record issues & risks',
      desc: 'Triage gaps, risk register, and POA&M-compatible remediation',
      state: !phase1Complete ? 'locked' : 'active',
      focused: focusPhase === 2 && phase1Complete,
      action: "state._riskView='triage';showTab('risk');",
      status: !phase1Complete ? 'After Phase 1' : 'Active'
    },
    {
      n: 3,
      label: 'Phase 3',
      title: 'Continuous monitoring',
      desc: 'In-production control testing, process audits, and high-risk area reviews',
      state: 'planned',
      focused: false,
      action: '',
      status: 'Coming soon'
    }
  ];

  var html = '<div class="program-phase-caption">';
  phases.forEach(function(p, idx) {
    if (idx > 0) html += '<span class="program-phase-caption-sep" aria-hidden="true">/</span>';
    var cls = 'program-phase-caption-item program-phase-caption-item--' + p.state + (p.focused ? ' is-active' : '');
    var inner = escapeHTML(p.label) + ' \u00b7 ' + escapeHTML(p.status);
    if (p.action && p.state !== 'locked' && p.state !== 'planned') {
      html += '<button type="button" class="' + cls + '" onclick="' + p.action + '">' + inner + '</button>';
    } else {
      html += '<span class="' + cls + '">' + inner + '</span>';
    }
  });
  html += '</div>';
  bar.innerHTML = html;
}

try {
  window.renderProgramPhaseBar = renderProgramPhaseBar;
  window.getHubCurrentUser = getHubCurrentUser;
  window.hubOpenQueuedSsp = hubOpenQueuedSsp;
  window.ensureHubActionDelegation = ensureHubActionDelegation;
} catch (e) {}
