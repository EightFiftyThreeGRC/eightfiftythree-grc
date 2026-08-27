// js/hub.js — Command Center (post-setup home dashboard)

function getSetupProgressSummary() {
  var persisted = parseInt(state.cisoSetupStep, 10) || 0;
  var live = (typeof currentStep !== 'undefined' && currentStep.ciso) ? currentStep.ciso : 0;
  var step = persisted || live || 1;
  var total = (typeof CISO_WIZARD_STEPS === 'number') ? CISO_WIZARD_STEPS : 7;
  var labels = (typeof CISO_STEP_LABELS !== 'undefined') ? CISO_STEP_LABELS : ['Organization', 'Program', 'Reg mapping', 'PM Controls', 'InfoSec Policy', 'Policy set', 'Assign Owners'];
  var pct = Math.round((step / total) * 100);
  return { step: step, pct: pct, label: labels[step - 1] || 'Organization', total: total };
}

function startProgramSetup() {
  if (!state.programPath) state.programPath = 'build';
  var step = parseInt(state.cisoSetupStep, 10) || 1;
  if (step < 1) step = 1;
  showTab('ciso');
  goToStep('ciso', step);
}

function startUnifiedProgramSetup() {
  state.programPath = 'build';
  if (!state.cisoSetupStep) state.cisoSetupStep = 1;
  if (typeof markDirty === 'function') markDirty();
  startProgramSetup();
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
  var total = progress.total || 8;

  // One start. Write the ISP in setup; Function policies later in Domain Policies.
  if (!chosen) {
    body.innerHTML = ''
      + '<div class="onboard onboard--cover onboard--paths">'
      + '<div class="onboard-cover-copy">'
      + '<p class="onboard-eyebrow">Program setup</p>'
      + '<h1 class="onboard-title">Stand up your program</h1>'
      + '<p class="onboard-lead">Identity first, then a short profile, then write the Information Security Policy in the wizard. Function policies are written later in Domain Policies.</p>'
      + '<button type="button" class="btn onboard-cta" onclick="startUnifiedProgramSetup()">Start setup</button>'
      + '</div>'
      + '</div>';
    return;
  }

  var title = hasStarted
    ? escapeHTML(progress.label || 'Continue')
    : 'Stand up your program';
  var lead = hasStarted
    ? 'Everything you\u2019ve entered is saved. This is the next screen.'
    : 'Start with who owns the program. Then a short profile so we can suggest overlays and flag systems that may need a higher categorization.';
  var cta = hasStarted ? 'Continue' : 'Start setup';

  body.innerHTML = ''
    + '<div class="onboard onboard--cover onboard--resume">'
    + '<div class="onboard-cover-copy">'
    + '<p class="onboard-eyebrow">Program setup</p>'
    + '<h1 class="onboard-title">' + title + '</h1>'
    + '<p class="onboard-lead">' + lead + '</p>'
    + '<button type="button" class="btn onboard-cta" onclick="startProgramSetup()">' + cta + '</button>'
    + '</div>'
    + '<div class="onboard-cover-progress">'
    + renderOnboardingRingHtml(progress.step || 1, total, progress.label)
    + '</div>'
    + '</div>';
}

/**
 * Real next steps for this acting identity, highest priority first.
 * Every action carries a `stage` id so the guided journey (renderGuidedJourneyHome)
 * can adopt the same routing instead of recomputing it. Pass limit 0 for the
 * unsliced list.
 */
function getNextActions(limit) {
  var actions = [];
  var today = new Date().toISOString().slice(0, 10);

  if (!state.cisoComplete) {
    var p = getSetupProgressSummary();
    var total = p.total || ((typeof CISO_WIZARD_STEPS === 'number') ? CISO_WIZARD_STEPS : 7);
    actions.push({
      priority: 1,
      icon: '🏛️',
      label: 'Continue program setup',
      desc: 'Step ' + p.step + ' of ' + total + ' \u2014 ' + p.label + '.',
      stage: 'setup',
      action: 'startProgramSetup();'
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
        stage: 'policies',
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
        stage: 'attest',
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
        stage: 'attest',
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
    actions.push({ priority: 3, icon: isReturn ? '↩' : '🔧', label: (isReturn ? 'Reassign control: ' : 'Review control: ') + r.controlId, desc: (r.status || 'Pending review'), stage: 'controls', action: action });
  });

  if (typeof getRiskHubNextActions === 'function') {
    getRiskHubNextActions().forEach(function(a) {
      if (a && !a.stage) a.stage = 'risks';
      actions.push(a);
    });
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
        stage: 'govern',
        action: "showTab('reports');goToCISOPolicyEditor();"
      });
    } else {
      var named = typeof ispHasNamedReviewer === 'function' && ispHasNamedReviewer();
      var approverNm = typeof getISPDesignatedApproverName === 'function' ? getISPDesignatedApproverName() : '';
      var canName = typeof canSessionNameISPApprover === 'function' && canSessionNameISPApprover();
      if (!named && canName) {
        actions.push({
          priority: 1,
          icon: '📋',
          label: 'Name the ISP approver',
          desc: 'The program owner cannot approve their own policy. Name a different reviewer.',
          stage: 'govern',
          action: 'openNameISPApproverModal();'
        });
      } else if (named) {
        actions.push({
          priority: 1,
          icon: '📋',
          label: 'Review as ' + approverNm,
          desc: 'Switch into that identity to approve or return the ISP. Admin cannot sign.',
          stage: 'govern',
          action: 'reviewISPAsNamedApprover();'
        });
      } else {
        actions.push({
          priority: 1,
          icon: '📋',
          label: 'ISP awaiting approver',
          desc: 'A reviewer other than the program owner must be named before this policy can be approved.',
          stage: 'govern',
          action: "typeof goToCISOPolicyEditor === 'function' ? goToCISOPolicyEditor() : showTab('reports');"
        });
      }
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
      stage: 'govern',
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
      stage: 'policies',
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
      stage: 'policies',
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
        stage: 'policies',
        action: "typeof openAssignDomainPolicyOwnerModal === 'function' ? openAssignDomainPolicyOwnerModal('" + fam.replace(/'/g, "\\'") + "') : startProgramSetup();"
      });
    });
  }

  (state.assets || []).forEach(function(a) {
    var signoff = (state.sspSignoffs || {})[a.id] || {};
    if (signoff.status === 'Submitted') {
      actions.push({ priority: 4, icon: '🖥️', label: 'SSP submitted: ' + a.name, desc: 'Review asset package on Reports.', stage: 'attest', action: "showTab('reports');" });
    }
  });

  var hubTabs = typeof getHubVisibleTabIds === 'function' ? getHubVisibleTabIds() : [];
  if (hubTabs.indexOf('policy') !== -1) {
    var masters = typeof getMasterPolicyFamilies === 'function' ? getMasterPolicyFamilies() : [];
    var draftFam = null;
    var draftSt = '';
    for (var mi = 0; mi < masters.length; mi++) {
      draftSt = ((state.policyStatus || {})[masters[mi]] || {}).status || 'Not Started';
      if (draftSt === 'Not Started' || draftSt === 'In Progress' || draftSt === 'Draft') {
        draftFam = masters[mi];
        break;
      }
    }
    if (draftFam) {
      var draftTitle = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(draftFam) : draftFam;
      var draftEsc = String(draftFam).replace(/'/g, "\\'");
      actions.push({
        priority: 2,
        icon: '📋',
        label: (draftSt === 'In Progress' || draftSt === 'Draft' ? 'Continue ' : 'Draft ') + draftTitle + ' policy',
        desc: 'Function policy is not submitted yet.',
        stage: 'policies',
        action: "showTab('policy');if(typeof enterPolicyWizard==='function')enterPolicyWizard('" + draftEsc + "');"
      });
    }
  }
  if (hubTabs.indexOf('asset') !== -1 && !(state.assets || []).length) {
    actions.push({
      priority: 3,
      icon: '🖥️',
      label: 'Register a system',
      desc: 'Categorize it under FIPS 199. That sets this system\u2019s 800-53 baseline \u2014 not the organization.',
      stage: 'systems',
      action: "showTab('asset');if(typeof openAddItemModal==='function')openAddItemModal('asset');"
    });
  }
  if (hubTabs.indexOf('control') !== -1 && typeof getActiveControls === 'function') {
    var needsDesign = getActiveControls().some(function(c) {
      var st = (state.controlStatus || {})[c.id];
      var status = st ? st.status : 'Not Started';
      return status !== 'Implemented' && status !== 'Inherited' && status !== 'N/A';
    });
    if (needsDesign) {
      actions.push({
        priority: 4,
        icon: '🔧',
        label: 'Design control implementations',
        desc: 'Document how in-scope 800-53 controls are implemented.',
        stage: 'controls',
        action: "typeof goToControlWorkspace === 'function' ? goToControlWorkspace() : showTab('control');"
      });
    }
  }

  actions.sort(function(a, b) { return a.priority - b.priority; });
  return limit === 0 ? actions : actions.slice(0, limit || 8);
}

// ---------------------------------------------------------------------------
// GUIDED POST-SETUP JOURNEY
//
// Finishing setup used to drop the operator straight into the open-world
// dashboard, which is the moment they know least about what comes next. The
// `home` tab now branches on state.homeJourney.mode: 'guided' hands over one
// stage at a time, 'open' is the full Command Center. Both directions stay
// reachable and the choice persists. Stage completion is always derived from
// program state so the progress shown cannot drift from reality.
// ---------------------------------------------------------------------------

function ensureHomeJourneyState() {
  var j = state.homeJourney;
  if (!j || typeof j !== 'object' || Array.isArray(j)) {
    j = state.homeJourney = { mode: 'guided', focus: '', deferred: {} };
  }
  if (j.mode !== 'open' && j.mode !== 'guided') j.mode = 'guided';
  if (typeof j.focus !== 'string') j.focus = '';
  if (!j.deferred || typeof j.deferred !== 'object' || Array.isArray(j.deferred)) j.deferred = {};
  return j;
}

function getHomeMode() {
  return ensureHomeJourneyState().mode;
}

/** Switch the `home` landing between the guided journey and the open dashboard. */
function setHomeMode(mode) {
  var j = ensureHomeJourneyState();
  j.mode = (mode === 'open') ? 'open' : 'guided';
  if (typeof markDirty === 'function') markDirty();
  setTimeout(function() {
    if (typeof renderHomeTab === 'function') renderHomeTab();
    if (typeof renderProgramPhaseBar === 'function') renderProgramPhaseBar();
  }, 0);
}

/** Pin a stage the operator jumped back to, and un-defer it. */
function focusJourneyStage(stageId) {
  var j = ensureHomeJourneyState();
  j.focus = String(stageId || '');
  if (j.focus) delete j.deferred[j.focus];
  if (typeof markDirty === 'function') markDirty();
  setTimeout(function() { renderHomeTab(); }, 0);
}

/** Park a stage for later. It comes back once nothing else is outstanding. */
function deferJourneyStage(stageId) {
  var id = String(stageId || '');
  if (!id) return;
  var j = ensureHomeJourneyState();
  j.deferred[id] = true;
  if (j.focus === id) j.focus = '';
  if (typeof markDirty === 'function') markDirty();
  setTimeout(function() { renderHomeTab(); }, 0);
}

/**
 * A system counts as categorized once someone has actually made a FIPS 199
 * call: a rationale, selected information types, or an impact above Low.
 * An untouched all-Low row is the default the app wrote, not a decision.
 */
function journeyAssetIsCategorized(assetId) {
  var row = (state.assetCategorization || {})[String(assetId)];
  if (!row) return false;
  if (String(row.rationale || '').trim()) return true;
  if (Array.isArray(row.infoTypes) && row.infoTypes.length) return true;
  return ['confidentiality', 'integrity', 'availability'].some(function(k) {
    var v = String(row[k] || '').trim().toUpperCase().charAt(0);
    return v === 'M' || v === 'H';
  });
}

function journeySspSubmitted(scopeId) {
  var sig = (state.sspSignoffs || {})[String(scopeId)] || {};
  var st = typeof normalizeSspSignoffStatus === 'function'
    ? normalizeSspSignoffStatus(sig.status)
    : String(sig.status || '').trim();
  return st === 'Submitted' || st === 'Approved';
}

/**
 * The post-setup arc, scoped to what this identity can actually reach.
 * Each stage computes its own completion from real state. `dormant` marks a
 * stage with nothing to act on yet (no controls in scope, no gaps surfaced):
 * it is neither done nor focusable, because claiming either would be a lie.
 * `terminal` marks the open-ended final stage so it never blocks completion.
 */
function getJourneyStages() {
  var tabs = typeof getHubVisibleTabIds === 'function' ? getHubVisibleTabIds() : [];
  function has(t) { return tabs.indexOf(t) !== -1; }
  var stages = [];

  var ispStatus = typeof getISPStatus === 'function' ? getISPStatus() : 'Not Started';
  var ispApproved = ispStatus === 'Approved';
  var canApproveIsp = typeof canSessionApproveISP === 'function' && canSessionApproveISP();
  if (has('policy') || canApproveIsp || (typeof canSessionNameISPApprover === 'function' && canSessionNameISPApprover())) {
    var namedReviewer = typeof ispHasNamedReviewer === 'function' && ispHasNamedReviewer();
    var reviewerName = typeof getISPDesignatedApproverName === 'function' ? getISPDesignatedApproverName() : '';
    var reviewerRole = typeof getISPDesignatedApproverRole === 'function' ? getISPDesignatedApproverRole() : '';
    var canNameIsp = typeof canSessionNameISPApprover === 'function' && canSessionNameISPApprover();
    var governCta = 'Open the ISP';
    var governAction = 'goToCISOPolicyEditor()';
    var governSecondaryCta = '';
    var governSecondaryAction = '';
    var governMeta = 'ISP status: ' + ispStatus;
    if (ispStatus === 'Under Review' && canApproveIsp) {
      governCta = 'Review the ISP';
      governAction = 'goToCISOPolicyEditor()';
      governMeta = reviewerName
        ? 'ISP status: Under Review \u00b7 Awaiting ' + reviewerName + (reviewerRole ? ' (' + reviewerRole + ')' : '')
        : governMeta;
    } else if (ispStatus === 'Under Review' && !namedReviewer) {
      governMeta = 'ISP status: Under Review \u00b7 No reviewer named \u2014 the program owner cannot approve their own policy';
      if (canNameIsp) {
        governCta = 'Name the ISP approver';
        governAction = 'openNameISPApproverModal()';
        governSecondaryCta = 'Read the policy';
        governSecondaryAction = 'goToCISOPolicyEditor()';
      } else {
        governCta = 'Read the policy';
        governAction = 'goToCISOPolicyEditor()';
      }
    } else if (ispStatus === 'Under Review' && namedReviewer) {
      governMeta = 'ISP status: Under Review \u00b7 Awaiting ' + reviewerName
        + (reviewerRole ? ' (' + reviewerRole + ')' : '');
      governCta = 'Review as ' + reviewerName;
      governAction = 'reviewISPAsNamedApprover()';
      governSecondaryCta = 'Read the policy';
      governSecondaryAction = 'goToCISOPolicyEditor()';
    }
    stages.push({
      id: 'govern',
      label: 'Govern policy',
      title: ispApproved ? 'Information Security Policy approved'
        : ispStatus === 'Returned' ? 'Revise the returned Information Security Policy'
        : ispStatus === 'Under Review' ? 'Get the Information Security Policy approved'
        : 'Finish the Information Security Policy',
      why: 'The ISP is your Govern layer. Every Function policy and control underneath inherits its authority, so nothing below it is defensible until it is formally approved.',
      meta: governMeta,
      cta: governCta,
      action: governAction,
      secondaryCta: governSecondaryCta,
      secondaryAction: governSecondaryAction,
      complete: ispApproved,
      pct: ispApproved ? 100 : (ispStatus === 'Under Review' ? 60 : ispStatus === 'Not Started' ? 0 : 30)
    });
  }

  if (has('policy')) {
    var masters = typeof getMasterPolicyFamilies === 'function' ? getMasterPolicyFamilies() : [];
    var approvedPolicies = masters.filter(function(fam) {
      return ((state.policyStatus || {})[fam] || {}).status === 'Approved';
    }).length;
    stages.push({
      id: 'policies',
      label: 'Function policies',
      title: approvedPolicies ? 'Keep working through your Function policies' : 'Draft your CSF Function policies',
      why: 'Function policies carry the 800-53 families grouped under Identify, Protect, Detect, Respond and Recover. They turn the ISP\u2019s intent into requirements a named owner can be held to.',
      meta: masters.length
        ? approvedPolicies + ' of ' + masters.length + ' Function policies approved'
        : 'No Function policies in scope',
      cta: 'Open the policy workspace',
      action: 'goToPoliciesHome()',
      complete: masters.length > 0 && approvedPolicies === masters.length,
      dormant: masters.length === 0,
      pct: masters.length ? Math.round((approvedPolicies / masters.length) * 100) : 0
    });
  }

  if (has('asset')) {
    var assets = state.assets || [];
    var categorized = assets.filter(function(a) { return journeyAssetIsCategorized(a.id); }).length;
    stages.push({
      id: 'systems',
      label: 'Systems',
      title: assets.length ? 'Categorize the systems in your inventory' : 'Register your first system',
      why: 'FIPS 199 categorization happens per system, never once for the whole organization. A system\u2019s high-water impact is what sets its 800-53 baseline and the scope of its SSP.',
      meta: assets.length
        ? categorized + ' of ' + assets.length + ' systems categorized'
        : 'Nothing in the inventory yet',
      cta: assets.length ? 'Open Assets & SSP' : 'Register a system',
      action: assets.length
        ? 'goToAssetWorkspace()'
        : "showTab('asset');if(typeof openAddItemModal==='function')openAddItemModal('asset');",
      complete: assets.length > 0 && categorized === assets.length,
      pct: assets.length ? Math.round((categorized / assets.length) * 100) : 0
    });
  }

  if (has('control')) {
    var ctrls = (state.currentUserId && typeof getScopedControls === 'function')
      ? getScopedControls()
      : (typeof getActiveControls === 'function' ? getActiveControls() : []);
    var designed = ctrls.filter(function(c) {
      var st = ((state.controlStatus || {})[c.id] || {}).status || 'Not Started';
      return st === 'Implemented' || st === 'Inherited' || st === 'N/A';
    }).length;
    stages.push({
      id: 'controls',
      label: 'Control design',
      title: 'Design your control implementations',
      why: 'A control is not implemented until somebody writes down how. That narrative is what an assessor tests against and what every SSP attestation points back to.',
      meta: ctrls.length
        ? designed + ' of ' + ctrls.length + ' in-scope controls documented'
        : 'No controls assigned to you yet',
      cta: 'Open the control workspace',
      action: 'goToControlWorkspace()',
      complete: ctrls.length > 0 && designed === ctrls.length,
      dormant: ctrls.length === 0,
      pct: ctrls.length ? Math.round((designed / ctrls.length) * 100) : 0
    });
  }

  if (has('asset')) {
    var scopes = (state.assets || []).concat(state.processes || []);
    var submitted = scopes.filter(function(s) { return journeySspSubmitted(s.id); }).length;
    stages.push({
      id: 'attest',
      label: 'Attestations',
      title: 'Attest and submit your SSP packages',
      why: 'Attestation puts an accountable name against each control for one specific system. It is the evidence a reviewer actually reads, and the input to any authorization decision.',
      meta: scopes.length
        ? submitted + ' of ' + scopes.length + ' packages submitted for review'
        : 'Register a system first',
      cta: 'Open Assets & SSP',
      action: 'goToAssetWorkspace()',
      complete: scopes.length > 0 && submitted === scopes.length,
      dormant: scopes.length === 0,
      pct: scopes.length ? Math.round((submitted / scopes.length) * 100) : 0
    });
  }

  if (has('risk')) {
    var triage = typeof getTriagePendingCount === 'function' ? getTriagePendingCount() : 0;
    var tracked = (state.risks || []).length + (state.issues || []).length;
    var openRi = typeof getCombinedOpenRiskIssueCount === 'function' ? getCombinedOpenRiskIssueCount() : 0;
    stages.push({
      id: 'risks',
      label: 'Risks & issues',
      title: triage ? 'Triage the gaps into risks and issues' : 'Record the gaps you found as risks and issues',
      why: 'The gaps that surfaced while drafting policy and designing controls belong in the register. Unrecorded gaps are the ones that resurface as audit findings.',
      meta: triage
        ? triage + ' suggestion' + (triage === 1 ? '' : 's') + ' waiting in the triage queue'
        : (tracked
          ? openRi + ' open of ' + tracked + ' tracked'
          : 'Nothing has surfaced yet \u2014 gaps appear as you work policies and controls'),
      cta: 'Open the triage queue',
      action: "state._riskView='triage';showTab('risk');",
      complete: triage === 0 && tracked > 0,
      dormant: triage === 0 && tracked === 0,
      pct: triage === 0 && tracked > 0 ? 100 : 0
    });
  }

  if (has('reports')) {
    var boundaries = state.authBoundaries || [];
    var decided = boundaries.filter(function(b) {
      var d = (state.atoDecisions || {})[b && b.id];
      return !!(d && d.decision);
    }).length;
    // Only an AO records the decision. Everyone else is here to read the record,
    // so do not point them at a button they are not allowed to press.
    var sessionRoles = getHubPersonRoles(getHubSessionUser());
    var isAo = !state.currentUserId || sessionRoles.indexOf('ao') !== -1;
    stages.push({
      id: 'report',
      label: isAo ? 'Reports & authorization' : 'Reports',
      title: (isAo && boundaries.length) ? 'Record the authorization decision' : 'Check the program record',
      why: isAo
        ? 'Reports are the record an assessor or auditor is handed. Once a boundary\u2019s package holds up, the authorizing official records the decision against it.'
        : 'Reports are the running record of where the program stands \u2014 policy status, control posture, and open items in one place. Check it before you report upward.',
      meta: (isAo && boundaries.length)
        ? decided + ' of ' + boundaries.length + ' boundaries authorized'
        : 'Program dashboard, audit trail, and review queues',
      cta: 'Open Reports',
      action: "showTab('reports')",
      complete: isAo && boundaries.length > 0 && decided === boundaries.length,
      pct: (isAo && boundaries.length) ? Math.round((decided / boundaries.length) * 100) : 0,
      terminal: true
    });
  }

  // Adopt the routing that "Your next actions" already computes rather than
  // inventing a second one. The unsliced list keeps low-priority stages served.
  var pending = [];
  try { pending = getNextActions(0); } catch (e) { pending = []; }
  stages.forEach(function(s) {
    if (s.complete) return;
    for (var i = 0; i < pending.length; i++) {
      if (pending[i] && pending[i].stage === s.id) { s.next = pending[i]; return; }
    }
  });

  return stages;
}

/**
 * The one stage the guided view puts in front of the operator: their pinned
 * stage if it is still actionable, else the first outstanding stage they have
 * not deferred, else a deferred one (so deferring can never dead-end).
 */
function getJourneyFocusStage(stages) {
  var j = ensureHomeJourneyState();
  var incomplete = stages.filter(function(s) { return !s.complete; });
  if (j.focus) {
    // An explicit pin wins even on a dormant stage: the operator asked for it.
    for (var i = 0; i < incomplete.length; i++) {
      if (incomplete[i].id === j.focus) return incomplete[i];
    }
  }
  var actionable = incomplete.filter(function(s) { return !s.dormant; });
  if (!actionable.length) return null;
  var live = actionable.filter(function(s) { return !j.deferred[s.id]; });
  return live.length ? live[0] : actionable[0];
}

function countJourneyStagesDone(stages) {
  return stages.filter(function(s) { return s.complete; }).length;
}

/**
 * Some roles (a Tier 1 ISP approver, for instance) only ever reach the
 * open-ended Reports stage. A one-row "journey" there is scaffolding with
 * nothing to scaffold, so those identities go straight to the dashboard.
 */
function journeyHasGuidableStages(stages) {
  return stages.some(function(s) { return !s.terminal; });
}

function renderJourneyRailHtml(stages, focusId) {
  var aria = countJourneyStagesDone(stages) + ' of ' + stages.length + ' journey stages complete';
  return '<div class="journey-rail" role="img" aria-label="' + escapeHTML(aria) + '">'
    + stages.map(function(s) {
      var cls = s.complete ? ' is-done' : (s.id === focusId ? ' is-current' : '');
      return '<span class="journey-rail-seg' + cls + '"></span>';
    }).join('')
    + '</div>';
}

function renderJourneyStepsHtml(stages, focusId) {
  var j = ensureHomeJourneyState();
  return stages.map(function(s, i) {
    var isFocus = s.id === focusId;
    var meta = getJourneyStageMeta(s);
    var cls, marker, status;
    if (s.complete) {
      cls = 'is-done'; marker = '\u2713'; status = 'Done';
    } else if (isFocus) {
      // The copy column already spells this stage out; repeating it here just
      // prints the same sentence twice on one screen.
      cls = 'is-current'; marker = String(i + 1); status = 'Current stage';
    } else if (s.dormant) {
      cls = 'is-dormant'; marker = '\u2013'; status = meta;
    } else if (j.deferred[s.id]) {
      cls = 'is-deferred'; marker = String(i + 1); status = 'Deferred \u00b7 ' + meta;
    } else {
      cls = 'is-later'; marker = String(i + 1); status = meta;
    }
    return '<button type="button" class="journey-step ' + cls + '"'
      + (isFocus ? ' aria-current="step"' : '')
      + ' onclick="focusJourneyStage(\'' + hubJsStringLiteral(s.id) + '\')">'
      + '<span class="journey-step-marker" aria-hidden="true">' + marker + '</span>'
      + '<span class="journey-step-text">'
      + '<span class="journey-step-label">' + escapeHTML(s.label) + '</span>'
      + '<span class="journey-step-status">' + escapeHTML(status) + '</span>'
      + '</span></button>';
  }).join('');
}

/* Next-action labels double as status lines ("ISP awaiting Morgan Chen",
   "Overdue: ..."). Only an imperative one can be borrowed for the primary
   button; anything else keeps the stage's own verb and becomes context. */
var JOURNEY_CTA_VERB = /^(Approve|Assign|Categorize|Continue|Design|Draft|Name|Open|Reassign|Record|Register|Review|Revise|Submit|Triage)\b/;

/** The single next action the journey adopts from getNextActions(), or null. */
function getJourneyAdoptedAction(stage) {
  if (!stage || !stage.next || !stage.next.label) return null;
  return JOURNEY_CTA_VERB.test(stage.next.label) ? stage.next : null;
}

/** One line of honest status, plus whoever the work is currently parked with. */
function getJourneyStageMeta(stage) {
  var meta = stage.meta || '';
  if (stage.next && !getJourneyAdoptedAction(stage)) {
    meta = meta ? meta + ' \u00b7 ' + stage.next.label : stage.next.label;
  }
  return meta;
}

/** The one primary action button for a stage. */
function renderJourneyCtaHtml(stage) {
  var adopted = getJourneyAdoptedAction(stage);
  var label = adopted ? adopted.label : stage.cta;
  var html;
  if (adopted && adopted.kind === 'ssp-review') {
    ensureHubActionDelegation();
    html = '<button type="button" class="btn onboard-cta" data-hub-action="ssp-review"'
      + ' data-scope-id="' + escapeHTML(adopted.scopeId || '') + '"'
      + ' data-is-process="' + (adopted.isProcess ? '1' : '0') + '">' + escapeHTML(label) + '</button>';
  } else {
    var action = (adopted && adopted.action) ? adopted.action : stage.action;
    html = '<button type="button" class="btn onboard-cta" onclick="' + action + '">' + escapeHTML(label) + '</button>';
  }
  var secondaryLabel = stage.secondaryCta || '';
  var secondaryAction = stage.secondaryAction || '';
  if (secondaryLabel && secondaryAction) {
    html += '<p class="journey-secondary"><button type="button" class="onboard-path-switch-btn" onclick="'
      + secondaryAction + '">' + escapeHTML(secondaryLabel) + '</button></p>';
  }
  return html;
}

function openNameISPApproverModal() {
  if (typeof canSessionNameISPApprover === 'function' && !canSessionNameISPApprover()) {
    if (typeof showToast === 'function') {
      showToast('Only Admin or the program owner can name the ISP reviewer.', true);
    }
    return;
  }
  var overlay = document.getElementById('ispApproverOverlay');
  if (!overlay) return;
  var rc = ((state.policyReviewCycle || {}).ISP) || {};
  var nameEl = document.getElementById('ispApproverName');
  var roleEl = document.getElementById('ispApproverRole');
  if (nameEl) nameEl.value = (typeof getISPDesignatedApproverName === 'function' ? getISPDesignatedApproverName() : '') || rc.approvedBy || '';
  if (roleEl) roleEl.value = (typeof getISPDesignatedApproverRole === 'function' ? getISPDesignatedApproverRole() : '') || rc.approverRole || '';
  overlay.style.display = 'flex';
  setTimeout(function() { if (nameEl) nameEl.focus(); }, 0);
}

function closeNameISPApproverModal() {
  var overlay = document.getElementById('ispApproverOverlay');
  if (overlay) overlay.style.display = 'none';
}

function saveNamedISPApprover() {
  if (typeof canSessionNameISPApprover === 'function' && !canSessionNameISPApprover()) {
    if (typeof showToast === 'function') {
      showToast('Only Admin or the program owner can name the ISP reviewer.', true);
    }
    return;
  }
  var nameEl = document.getElementById('ispApproverName');
  var roleEl = document.getElementById('ispApproverRole');
  var name = nameEl ? String(nameEl.value || '').trim() : '';
  var role = roleEl ? String(roleEl.value || '').trim() : '';
  if (!name) {
    if (typeof showToast === 'function') showToast('Enter the reviewer\u2019s name.', true);
    if (nameEl) nameEl.focus();
    return;
  }
  if (typeof ispApproverViolatesSeparationOfDuties === 'function'
      && ispApproverViolatesSeparationOfDuties('', name)) {
    if (typeof showToast === 'function') {
      showToast(typeof ispApproverSodMessage === 'function'
        ? ispApproverSodMessage()
        : 'The program owner cannot approve their own policy.', true);
    }
    return;
  }
  if (!state.policyReviewCycle) state.policyReviewCycle = {};
  var rc = state.policyReviewCycle.ISP || (state.policyReviewCycle.ISP = {});
  rc.approvedBy = name;
  rc.approverRole = role;
  rc._customApprover = true;
  if (typeof submitISPForApproval === 'function') submitISPForApproval(false);
  else if (typeof markDirty === 'function') markDirty();
  closeNameISPApproverModal();
  setTimeout(function() {
    if (typeof renderHomeTab === 'function') renderHomeTab();
  }, 0);
}

function reviewISPAsNamedApprover() {
  if (typeof canSessionApproveISP === 'function' && canSessionApproveISP()) {
    if (typeof goToCISOPolicyEditor === 'function') goToCISOPolicyEditor();
    return;
  }
  if (typeof ispHasNamedReviewer === 'function' && !ispHasNamedReviewer()) {
    openNameISPApproverModal();
    return;
  }
  if (typeof syncUsersFromState === 'function') syncUsersFromState();
  var user = typeof findISPApproverRosterUser === 'function' ? findISPApproverRosterUser() : null;
  if (!user || !user.id) {
    if (typeof canSessionNameISPApprover === 'function' && canSessionNameISPApprover()) {
      openNameISPApproverModal();
      return;
    }
    if (typeof showToast === 'function') {
      showToast('The named reviewer is not on the roster yet. Ask the program owner to name them again.', true);
    }
    return;
  }
  state._landIspReviewAfterRoleSwitch = true;
  if (typeof selectUserProfile === 'function') selectUserProfile(user.id);
  else if (typeof applyRoleView === 'function') applyRoleView(user.id);
}

/** Guided landing. Returns false when no stage applies, so home falls back to the dashboard. */
function renderGuidedJourneyHome() {
  var body = document.getElementById('home-body');
  if (!body) return false;
  var stages = getJourneyStages();
  if (!journeyHasGuidableStages(stages)) return false;

  // The stage headline is this screen's only title; the standard page header
  // would just compete with it. renderCommandCenterDashboard() restores it.
  var pageHeader = document.querySelector('#tab-home .page-header');
  if (pageHeader) pageHeader.style.display = 'none';

  var focus = getJourneyFocusStage(stages);
  var done = countJourneyStagesDone(stages);
  var org = String(state.orgName || '').trim();
  var eyebrow = 'Guided journey' + (org ? ' \u00b7 ' + org : '');
  var steps = renderJourneyStepsHtml(stages, focus ? focus.id : '');
  var exitFoot = '<p class="journey-foot">Prefer the open dashboard \u2014 KPIs, CSF outcomes, every workspace? '
    + '<button type="button" class="journey-foot-btn" onclick="setHomeMode(\'open\')">Open the Command Center</button></p>';

  if (!focus) {
    body.innerHTML = ''
      + '<div class="onboard onboard--cover onboard--journey">'
      + '<div class="onboard-cover-copy">'
      + '<p class="onboard-eyebrow">' + escapeHTML(eyebrow + ' \u00b7 clear') + '</p>'
      + '<h1 class="onboard-title">Nothing is waiting on you</h1>'
      + '<p class="onboard-lead">Every stage you can act on right now is clear. The Command Center is the better home from here, and this list stays one click away.</p>'
      + '<button type="button" class="btn onboard-cta" onclick="setHomeMode(\'open\')">Open the Command Center</button>'
      + '</div>'
      + '<div class="journey-side">'
      + '<p class="journey-side-label">' + done + ' of ' + stages.length + ' stages complete</p>'
      + '<div class="journey-steps">' + steps + '</div>'
      + '</div>'
      + '</div>';
    return true;
  }

  body.innerHTML = ''
    + '<div class="onboard onboard--cover onboard--journey">'
    + '<div class="onboard-cover-copy">'
    + '<p class="onboard-eyebrow">' + escapeHTML(eyebrow) + '</p>'
    + renderJourneyRailHtml(stages, focus.id)
    + '<h1 class="onboard-title">' + escapeHTML(focus.title) + '</h1>'
    + '<p class="onboard-lead">' + escapeHTML(focus.why) + '</p>'
    + '<p class="journey-meta">' + escapeHTML(getJourneyStageMeta(focus)) + '</p>'
    + renderJourneyCtaHtml(focus)
    + '<p class="journey-defer"><button type="button" class="onboard-path-switch-btn"'
    + ' onclick="deferJourneyStage(\'' + hubJsStringLiteral(focus.id) + '\')">Come back to this later</button></p>'
    + '</div>'
    + '<div class="journey-side">'
    + '<p class="journey-side-label">Stage ' + (stages.indexOf(focus) + 1) + ' of ' + stages.length
    + ' \u00b7 ' + done + ' complete</p>'
    + '<div class="journey-steps">' + steps + '</div>'
    + '</div>'
    + exitFoot
    + '</div>';
  return true;
}

/** Always-present way back into the guided journey from the open dashboard. */
function renderJourneyResumeBarHtml() {
  var stages = getJourneyStages();
  if (!journeyHasGuidableStages(stages)) return '';
  var focus = getJourneyFocusStage(stages);
  var done = countJourneyStagesDone(stages);
  var line = focus
    ? 'Stage ' + (stages.indexOf(focus) + 1) + ' of ' + stages.length + ' \u2014 ' + focus.title
    : 'Nothing waiting on you right now';
  return '<div class="journey-resume">'
    + '<div class="journey-resume-copy">'
    + '<span class="journey-resume-kicker">Guided journey \u00b7 ' + done + '/' + stages.length + '</span>'
    + '<span class="journey-resume-text">' + escapeHTML(line) + '</span>'
    + '</div>'
    + '<button type="button" class="journey-resume-btn" onclick="setHomeMode(\'guided\')">Resume guided journey</button>'
    + '</div>';
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
      desc: 'CSF 2.0 outcomes \u2014 ISO, SOC 2, HIPAA + tracked laws',
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
  var floor = state.baseline ? (state.baseline === 'L' ? 'Low' : state.baseline === 'M' ? 'Moderate' : 'High') : '\u2014';
  subtitle.textContent = org + ' \u00b7 ' + floor + ' common-control floor \u00b7 posture and next actions';
}

function renderHomeTab() {
  var body = document.getElementById('home-body');
  if (!body) return;

  if (!state.cisoComplete) {
    renderOnboardingHome();
    return;
  }

  if (getHomeMode() === 'guided' && renderGuidedJourneyHome()) return;
  renderCommandCenterDashboard();
}

/** The open-world Command Center: KPIs, CSF outcomes, next actions, workspaces. */
function renderCommandCenterDashboard() {
  var body = document.getElementById('home-body');
  if (!body) return;

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
    + renderJourneyResumeBarHtml()
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

  // First-run setup and the guided post-setup journey both use the cover as the
  // whole UI. A phase caption on top of it is competing chrome.
  var homeIsCover = tab === 'home' && !!document.querySelector('#tab-home .onboard--cover');
  if (tab === 'home' && (!phase1Complete || homeIsCover)) {
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
  window.getHomeMode = getHomeMode;
  window.setHomeMode = setHomeMode;
  window.getJourneyStages = getJourneyStages;
  window.focusJourneyStage = focusJourneyStage;
  window.deferJourneyStage = deferJourneyStage;
  window.openNameISPApproverModal = openNameISPApproverModal;
  window.closeNameISPApproverModal = closeNameISPApproverModal;
  window.saveNamedISPApprover = saveNamedISPApprover;
  window.reviewISPAsNamedApprover = reviewISPAsNamedApprover;
  window.renderCommandCenterDashboard = renderCommandCenterDashboard;
  window.startProgramSetup = startProgramSetup;
  window.startUnifiedProgramSetup = startUnifiedProgramSetup;
} catch (e) {}
