// js/program.js — CISO program setup, ISP workflow, merge/prefill helpers. Split from app.js (Step 2).
// Globals only; load after js/core.js and before js/app.js.

function openISPSuggestionModal() {
  if (typeof getISPStatus === 'function' && getISPStatus() !== 'Approved') {
    if (typeof showToast === 'function') showToast('Proposed changes are only available after the ISP is formally approved.', true);
    return;
  }
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
          + '<button class="btn btn-sm" style="background:#166534;color:white;border:none;white-space:nowrap;" onclick="showTab(\'home\')">Go to Command Center \u2192</button>';
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
  return masters.every(fam => isValidOwnerEmail((state.domainOwners[fam] || {}).email));
}

function updateCISOFinishBtn() {
  var demoNames = getDemoPlaceholderNames();
  if (demoNames.length && document.getElementById('ciso-finalise-btn')) {
    const btn = document.getElementById('ciso-finalise-btn');
    btn.disabled = true;
    btn.innerHTML = '⚠️ Replace demo placeholder owners';
    btn.style.opacity = '0.5';
    if (!document.getElementById('fake-review-panel')) {
      btn.insertAdjacentHTML('beforebegin', '<div id="fake-review-panel" style="padding:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:16px;"><h4 style="color:#92400e;margin:0 0 8px 0;">Demo placeholder owners</h4><p style="font-size:12px;color:#78350f;margin:0 0 8px 0;">The following names are flagged as portfolio demo data and cannot be used for real attestations: <strong>' + escapeHTML(demoNames.join(', ')) + '</strong>. Replace demo emails in Step 7 to clear the DEMO badge, then finalize.</p></div>');
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
    btn.innerHTML = '✓ Setup Complete &nbsp;·&nbsp; Command Center →';
    btn.onclick = function(){ showTab('home'); };
    btn.style.background = 'var(--teal)';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    return;
  }

  // Step 6 (consolidate): hide finalize — use Next in footer to reach step 7
  if (currentStep.ciso === 6) {
    btn.style.display = 'none';
    return;
  }
  // Step 7 (owners): show finalize when all owners assigned
  if (currentStep.ciso === 7) {
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

// ============================================================
// CISO WIZARD — STEP DISPATCH & SHARED HELPERS
// renderCISOStep router, cisoNext, allOwnersAssigned,
// updateCISOFinishBtn, goToStep, prefillFakeOwners, etc.
// ============================================================
var CISO_WIZARD_STEPS = 7;
var CISO_STEP_LABELS = ['Organization', 'Baseline', 'Reg mapping', 'PM Controls', 'InfoSec Policy', 'Consolidate', 'Assign Owners'];

function updateCisoSetupProgress(step) {
  var s = step || (typeof currentStep !== 'undefined' ? currentStep.ciso : 1) || 1;
  var fill = document.getElementById('ciso-setup-progress-fill');
  var label = document.getElementById('ciso-setup-progress-label');
  var desc = document.getElementById('ciso-setup-header-desc');
  if (fill) fill.style.width = Math.round((s / CISO_WIZARD_STEPS) * 100) + '%';
  var name = CISO_STEP_LABELS[s - 1] || '';
  if (label) label.textContent = 'Step ' + s + ' of ' + CISO_WIZARD_STEPS + ' · ' + name;
  if (desc) desc.textContent = 'Step ' + s + ' of ' + CISO_WIZARD_STEPS + ' — ' + name + '. One decision at a time.';
}

function cisoStepProgressHtml(step, label) {
  return '<div class="ciso-step-progress" style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:16px;">Step '
    + step + ' of ' + CISO_WIZARD_STEPS + ' · ' + escapeHTML(label) + '</div>';
}

function refreshCurrentCisoStep() {
  renderCISOStep(currentStep.ciso);
}

function renderCISOStep(step) {
  if (step===1) renderCISOStep1();
  if (step===2) renderCISOStep2Baseline();
  if (step===3) renderCISOStep3Integrations();
  if (step===4) renderCISOStep2();
  if (step===5) renderCISOStep3();
  if (step===6) renderCISOStep4a();
  if (step===7) renderCISOStep4b();
  updateCisoSetupProgress(step);
}

/** After merge/unmerge while on setup steps 6 or 7, refresh the visible panel only. */
function renderActiveCisoSetupStep() {
  if (currentStep.ciso === 7) renderCISOStep4b();
  else if (currentStep.ciso === 6) renderCISOStep4a();
}

function cisoNext(fromStep) {
  if (fromStep >= CISO_WIZARD_STEPS) return;
  if (fromStep===1) {
    if (!state.orgName || !state.orgName.trim()) { showToast('Please enter your Organization / Agency Name before continuing.', true); document.getElementById('orgNameInput')?.focus(); return; }
    if (!state.programOwner || !state.programOwner.trim()) { showToast('Please enter the Security Program Owner name before continuing.', true); document.getElementById('programOwnerInput')?.focus(); return; }
    if (!state.programOwnerTitle || !state.programOwnerTitle.trim()) { showToast('Please enter the Program Owner title before continuing.', true); document.getElementById('programOwnerTitleInput')?.focus(); return; }
    if (!isValidOwnerEmail(state.programOwnerEmail)) { showToast('Please enter the program owner email before continuing.', true); document.getElementById('programOwnerEmailInput')?.focus(); return; }
    if (typeof isOrgClassificationComplete === 'function' && !isOrgClassificationComplete()) {
      showToast('Select organization type' + (state.orgOwnership === 'government' ? ', government level,' : '') + ' and sector before continuing.', true);
      return;
    }
  }
  if (fromStep===2) {
    if (state.fismaMode) {
      if (!Array.isArray(state.programInfoTypes) || state.programInfoTypes.length === 0) {
        showToast('FISMA / CUI mode is on — pick at least one information type so a baseline can be derived.', true);
        return;
      }
      var _derived = computeBaselineFromInfoTypes(state.programInfoTypes);
      var _override = state.baselineOverride;
      var _isTailored = (_override === 'L' || _override === 'M' || _override === 'H') && _override !== _derived;
      if (_isTailored && !(state.baselineOverrideRationale || '').trim()) {
        showToast('Tailoring rationale is required when the applied baseline differs from the derived one.', true);
        return;
      }
    } else if (!state.baseline) {
      showToast('Please select a baseline impact level before continuing.', true);
      return;
    }
  }
  if (fromStep===5) {
    var ispRc = (state.policyReviewCycle || {}).ISP || {};
    if (typeof validateISPApproverAssignment === 'function') {
      if (!validateISPApproverAssignment(ispRc, false)) return;
    } else if (ispRc._customApprover) {
      var approverEm = String(ispRc.approverEmail || '').trim();
      if (!isValidOwnerEmail(approverEm)) {
        showToast('Enter a valid approver email — they will receive a sign-up link to review the ISP.', true);
        return;
      }
    } else {
      showToast('Assign a different ISP approver (not the program owner) for separation of duties.', true);
      return;
    }
    // Finalize the ISP and submit to the selected approver for review.
    try { submitISPForApproval(false, { forceEmail: true }); } catch (e) { console.warn('submitISPForApproval failed:', e); }
  }
  goToStep('ciso', fromStep+1);
}

// Open the dedicated returned-ISP revision workspace (policy tab — not program setup).
function openISPForRevision() {
  if (typeof canSessionReviseReturnedISP === 'function' && !canSessionReviseReturnedISP()) {
    showToast('Only the program owner can edit a returned ISP.', true);
    return;
  }
  state._ispReviewView = false;
  state._policyLibraryMode = false;
  state._ispRevisionView = true;
  showTab('policy');
}

function exitISPRevisionEditor() {
  state._ispRevisionView = false;
}

function exitISPRevisionToViewer() {
  exitISPRevisionEditor();
  if (typeof goToCISOPolicyEditor === 'function') goToCISOPolicyEditor();
  else showTab('home');
}

// Resubmit a returned ISP to the designated CIO/approver after edits.
function resubmitISPForApproval() {
  if (typeof canSessionReviseReturnedISP === 'function' && !canSessionReviseReturnedISP()) {
    showToast('Only the program owner can resubmit the ISP.', true);
    return;
  }
  if (typeof getISPStatus === 'function' && getISPStatus() !== 'Returned') {
    showToast('This policy is not awaiting resubmission.', true);
    return;
  }
  submitISPForApproval(false, { forceResubmit: true });
  exitISPRevisionEditor();
  markDirty();
  try { if (typeof saveToStorage === 'function') saveToStorage(); } catch (e) { /* ignore */ }
  if (typeof isCloudSessionActive === 'function' && isCloudSessionActive() && typeof cloudPushNow === 'function') {
    cloudPushNow().finally(function() {
      if (typeof renderHomeTab === 'function') renderHomeTab();
    });
  }
  showTab('home');
}

// Auto-submits the ISP to the assigned approver when the CISO advances past Step 5.
// options.forceEmail — re-send approver invite when leaving ISP step (even if already Under Review).
// options.forceResubmit — program owner resubmitting after approver returned the ISP.
function submitISPForApproval(silent, options) {
  options = options || {};
  var forceEmail = !!options.forceEmail;
  var forceResubmit = !!options.forceResubmit;
  if (!state.infoSecPolicy) return;
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.policyReviewCycle) state.policyReviewCycle = {};
  var rc = state.policyReviewCycle.ISP || (state.policyReviewCycle.ISP = {});

  if (typeof validateISPApproverAssignment === 'function') {
    if (!validateISPApproverAssignment(rc, silent)) return;
  }

  // Determine approver — ISP requires a different person than the program owner.
  var isCustom = !!rc._customApprover;
  if (!isCustom) {
    if (!silent && typeof showToast === 'function') {
      showToast('The ISP must be approved by someone other than the program owner. Turn on "Different approver" and assign a separate reviewer.', true);
    }
    return;
  }
  var approverName = (rc.approvedBy || '').trim();
  var approverRole  = (rc.approverRole  || '').trim();
  var approverEmail = (rc.approverEmail || '').trim();
  if (typeof ispApproverViolatesSeparationOfDuties === 'function'
      && ispApproverViolatesSeparationOfDuties(approverEmail, approverName)) {
    if (!silent && typeof showToast === 'function') {
      showToast('The ISP approver must be a different person than the program owner (separation of duties).', true);
    }
    return;
  }

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
    state.infoSecPolicy.title = getDefaultISPTitle();
  }

  // Only (re)submit if the ISP isn't already approved. Approved policies shouldn't regress on re-edit.
  var current = (state.policyStatus.ISP || {}).status;
  var justSubmitted = false;
  var wantApproverEmail = isCustom && approverEmail && current !== 'Approved' && (forceEmail || forceResubmit || current !== 'Under Review');
  if (current === 'Returned' && !forceEmail && !forceResubmit) return;
  if (current !== 'Approved') {
    justSubmitted = current !== 'Under Review' || forceResubmit;
    if (forceResubmit && state.infoSecPolicy) {
      if (!state.infoSecPolicy.revisionHistory) state.infoSecPolicy.revisionHistory = [];
      var actor = typeof resolveProgramOwnerActorName === 'function'
        ? resolveProgramOwnerActorName()
        : ((state.programOwner || '').trim() || 'Program Owner');
      if (!actor && typeof getSessionActorName === 'function') {
        actor = getSessionActorName('Program Owner');
      }
      state.infoSecPolicy.revisionHistory.push({
        version: 'R' + (state.infoSecPolicy.revisionHistory.length + 1),
        date: new Date().toISOString().slice(0, 10),
        author: actor,
        changes: 'Revised and resubmitted for approver review.'
      });
    }
    state.policyStatus.ISP = {
      status: 'Under Review',
      submittedTo: approverName,
      submittedToRole: approverRole,
      submittedToEmail: approverEmail,
      submittedAt: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toLocaleDateString(),
      version: (state.infoSecPolicy && state.infoSecPolicy.version) || '1.0'
    };
    var auditMsg = forceResubmit
      ? 'ISP revised and resubmitted for approval — routed to ' + approverName + (approverRole ? ' (' + approverRole + ')' : '')
      : 'ISP submitted for approval — routed to ' + approverName + (approverRole ? ' (' + approverRole + ')' : '');
    try { addAuditEntry('policy', 'ISP', auditMsg); } catch (e) { console.warn('audit log failed:', e); }
    var cloudActive = typeof isCloudSessionActive === 'function' && isCloudSessionActive();
    var willEmail = wantApproverEmail
      && typeof sendISPApprovalRequestEmail === 'function'
      && cloudActive;
    if (!silent && !willEmail) {
      if (isCustom && approverEmail && !cloudActive) {
        showToast('ISP submitted to ' + approverName + '. Sign in (cloud mode) to email ' + approverEmail + ' a sign-up link.', true);
      } else if (isCustom && approverEmail && current === 'Approved') {
        showToast('ISP is already approved — no approver email sent.', true);
      } else if (forceResubmit) {
        showToast('📨 ISP resubmitted to ' + approverName + ' for review.');
      } else {
        showToast('📨 ISP submitted to ' + approverName + ' for review.');
      }
    }
  }

  if (wantApproverEmail && typeof sendISPApprovalRequestEmail === 'function') {
    // Roster the approver and push to cloud before emailing so RLS lets them in when they click the link.
    try { if (typeof syncUsersFromState === 'function') syncUsersFromState(); } catch (e) { console.warn('syncUsersFromState failed:', e); }
    try { markDirty(); } catch (e) { console.warn('markDirty failed:', e); }
    var pushThenEmail = Promise.resolve();
    if (typeof isCloudSessionActive === 'function' && isCloudSessionActive() && typeof cloudPushNow === 'function') {
      pushThenEmail = cloudPushNow().catch(function(e) {
        console.warn('cloudPushNow before approver email', e);
      });
    }
    pushThenEmail.then(function() {
      return sendISPApprovalRequestEmail({
        approverEmail: approverEmail,
        approverName: approverName,
        programOwnerName: (state.programOwner || '').trim(),
        orgName: state.orgName || 'your organization'
      });
    }).then(function(res) {
      if (res && res.ok) {
        if (!silent) {
          showToast('📨 ISP submitted to ' + approverName + '. Sign-up email sent to ' + approverEmail + '.');
        }
        try { addAuditEntry('policy', 'ISP', 'Approver sign-in link sent to ' + approverEmail); } catch (e) { /* ignore */ }
      } else if (res && res.reason === 'not_cloud') {
        if (!silent) showToast('ISP submitted to ' + approverName + '. Sign in (cloud mode) to email ' + approverEmail + ' a sign-up link.', true);
      } else if (!silent) {
        var fmtFail = typeof formatApproverEmailFailure === 'function' ? formatApproverEmailFailure : function(r) { return r || 'unknown error'; };
        var detail = (res && res.reason) ? fmtFail(res.reason) : 'unknown error';
        showToast('ISP submitted, but could not email ' + approverEmail + ': ' + detail, true);
      }
    }).catch(function(err) {
      console.warn('submitISPForApproval email', err);
      if (!silent) {
        var fmtErr = typeof formatApproverEmailFailure === 'function' ? formatApproverEmailFailure : function(r) { return r || 'unknown error'; };
        var msg = fmtErr(err && err.message ? err.message : String(err));
        showToast('Could not send approver email: ' + msg, true);
      }
    });
  } else {
    try { if (typeof syncUsersFromState === 'function') syncUsersFromState(); } catch (e) { console.warn('syncUsersFromState failed:', e); }
    try { markDirty(); } catch (e) { console.warn('markDirty failed:', e); }
  }

  try { renderSidebarBadges(); } catch (e) { console.warn('renderSidebarBadges failed:', e); }
}

function getDefaultISPTitle() {
  return state.privacyOverlay ? 'Information Security and Privacy Policy' : 'Information Security Policy';
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
  const unassigned = masters.filter(f => !isValidOwnerEmail((state.domainOwners[f] || {}).email));

  if (unassigned.length > 0) {
    showToast('Assign an owner email for all ' + unassigned.length + ' domain(s) before finalizing. Use the program owner button in Step 7.', true);
    return;
  }
  clearScopedUndoStack('program finalization');

  // Auto-assign ISP-tier controls (PM + XX-1) to the program owner when Tier 1 is in scope.
  if (typeof ensureIspTierControlOwners === 'function') ensureIspTierControlOwners();
  else (function() {
    var ownerEmail = (state.programOwnerEmail || '').trim();
    var ownerName  = (state.programOwner || '').trim() || getOwnerDisplayName({ email: ownerEmail, name: '' });
    var ownerRole  = (state.programOwnerTitle || '').trim();
    if (!ownerEmail && !ownerName) return;
    if (!state.controlOwners) state.controlOwners = {};
    var pmControls = state.pmControls || {};
    Object.keys(pmControls).forEach(function(cid) {
      if (!pmControls[cid]) return;
      if (hasRealControlOwner(state.controlOwners[cid])) return;
      state.controlOwners[cid] = { name: ownerName, role: ownerRole, email: ownerEmail };
    });
  })();

  state.cisoComplete = true;
  addAuditEntry('program', null, 'Program setup completed by CISO');
  renderSidebarBadges();
  updateCISOFinishBtn();
  if (typeof applySetupFocusMode === 'function') applySetupFocusMode();
  showTab('home');
  showToast('✅ Program setup complete! Command Center is your new home base.');
}

function toggleSidebarPoliciesList(forceOpen) {
  if (typeof state._sidebarPoliciesExpanded !== 'boolean') state._sidebarPoliciesExpanded = false;
  if (forceOpen === true) state._sidebarPoliciesExpanded = true;
  else if (forceOpen === false) state._sidebarPoliciesExpanded = false;
  else state._sidebarPoliciesExpanded = !state._sidebarPoliciesExpanded;
  var list = document.getElementById('sidebar-policies-list');
  var btn = document.getElementById('sidebar-policies-toggle');
  if (list) list.classList.toggle('sidebar-sub-list--collapsed', !state._sidebarPoliciesExpanded);
  if (btn) {
    btn.textContent = state._sidebarPoliciesExpanded ? '▾' : '▸';
    btn.setAttribute('aria-expanded', state._sidebarPoliciesExpanded ? 'true' : 'false');
  }
}

function toggleSidebarControlsList(forceOpen) {
  if (typeof state._sidebarControlsExpanded !== 'boolean') state._sidebarControlsExpanded = false;
  if (forceOpen === true) state._sidebarControlsExpanded = true;
  else if (forceOpen === false) state._sidebarControlsExpanded = false;
  else state._sidebarControlsExpanded = !state._sidebarControlsExpanded;
  var list = document.getElementById('sidebar-controls-list');
  var btn = document.getElementById('sidebar-controls-toggle');
  if (list) list.classList.toggle('sidebar-sub-list--collapsed', !state._sidebarControlsExpanded);
  if (btn) {
    btn.textContent = state._sidebarControlsExpanded ? '▾' : '▸';
    btn.setAttribute('aria-expanded', state._sidebarControlsExpanded ? 'true' : 'false');
  }
}

function toggleSidebarReportsList(forceOpen) {
  if (typeof state._sidebarReportsExpanded !== 'boolean') state._sidebarReportsExpanded = false;
  if (forceOpen === true) state._sidebarReportsExpanded = true;
  else if (forceOpen === false) state._sidebarReportsExpanded = false;
  else state._sidebarReportsExpanded = !state._sidebarReportsExpanded;
  var list = document.getElementById('sidebar-reports-list');
  var btn = document.getElementById('sidebar-reports-toggle');
  if (list) list.classList.toggle('sidebar-sub-list--collapsed', !state._sidebarReportsExpanded);
  if (btn) {
    btn.textContent = state._sidebarReportsExpanded ? '▾' : '▸';
    btn.setAttribute('aria-expanded', state._sidebarReportsExpanded ? 'true' : 'false');
  }
}

function toggleSidebarAssetsList(forceOpen) {
  if (typeof state._sidebarAssetsExpanded !== 'boolean') state._sidebarAssetsExpanded = false;
  if (forceOpen === true) state._sidebarAssetsExpanded = true;
  else if (forceOpen === false) state._sidebarAssetsExpanded = false;
  else state._sidebarAssetsExpanded = !state._sidebarAssetsExpanded;
  var list = document.getElementById('sidebar-assets-list');
  var btn = document.getElementById('sidebar-assets-toggle');
  if (list) list.classList.toggle('sidebar-sub-list--collapsed', !state._sidebarAssetsExpanded);
  if (btn) {
    btn.textContent = state._sidebarAssetsExpanded ? '▾' : '▸';
    btn.setAttribute('aria-expanded', state._sidebarAssetsExpanded ? 'true' : 'false');
  }
}

function applyPostSetupNav() {
  var cisoNav = document.getElementById('nav-ciso');
  if (cisoNav) cisoNav.style.display = state.cisoComplete ? 'none' : '';
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
  const wsSection = document.getElementById('sidebar-workspaces-section');
  const designSection = document.getElementById('sidebar-design-workspace-section');
  const complianceSection = document.getElementById('sidebar-compliance-workspace-section');
  if (pList) {
    var showPolicySidebar = !user || visibleTabs.includes('policy') || visibleTabs.includes('ciso') || (hasApprover && !isTier1OnlyApprover);
    var showDesignWorkspace = showPolicySidebar || (!isTier1OnlyApprover && visibleTabs.includes('control'));
    var showComplianceWorkspace = !user || (!isTier1OnlyApprover && visibleTabs.includes('asset'));
    if (designSection) designSection.style.display = showDesignWorkspace ? '' : 'none';
    if (complianceSection) complianceSection.style.display = showComplianceWorkspace ? '' : 'none';
    if (wsSection) wsSection.style.display = (showDesignWorkspace || showComplianceWorkspace) ? '' : 'none';

    const ispDone = !!(state.infoSecPolicy && state.infoSecPolicy.title);
    const showISP = !user || userRole === 'ciso' || hasApprover;
    const ispLabel = (state.infoSecPolicy && (state.infoSecPolicy.title || '').trim()) || getDefaultISPTitle();
    const ispEntry = showISP ? `<div class="sidebar-item" style="padding-left:28px;font-size:12px;cursor:pointer;" onclick="goToCISOPolicyEditor()">
      <span style="font-size:12px;margin-right:5px;">\uD83D\uDCCB</span>
      <span style="font-weight:600;color:${ispDone?'var(--green)':'var(--text-muted)'};">${escapeHTML(ispLabel)} (Tier 1)</span>
    </div>` : '';

    // Pure Tier-1 ISP approver: no Tier-2 domain shortcuts in the sidebar (ISSM/CUST/CISO see domains)
    var policyEntries = isTier1OnlyApprover ? '' : masterFams.map(fam => {
      const o = state.domainOwners[fam] || {};
      const done = isValidOwnerEmail(o.email);
      const slaves = slavesOf[fam] || [];
      const mergedTitle = getPolicyMergedTitle(fam);
      const famGroup = [fam, ...slaves];
      const isOwned = userOwnsFam(fam);

      // For ISSM/custodian: hide policies they don't own (show only theirs)
      if ((userRole === 'issm' || userRole === 'custodian') && !isOwned) return '';

      const ownerMarker = (userRole === 'issm' || userRole === 'custodian') && isOwned
        ? '<span style="margin-left:4px;font-size:9px;color:var(--green);" title="Your policy">\u2605</span>' : '';

      return `<div class="sidebar-item" style="padding-left:28px;font-size:12px;" onclick="openPolicyDoc('${fam}')">
        <span style="font-family:monospace;font-weight:700;color:${done?'var(--green)':'var(--text-muted)'};">${famGroup.join('+')}</span>
        <span style="margin-left:6px;color:var(--text-muted);">${mergedTitle}</span>${ownerMarker}
      </div>`;
    }).join('');

    pList.innerHTML = ispEntry + policyEntries;
    if (typeof state._sidebarPoliciesExpanded !== 'boolean') state._sidebarPoliciesExpanded = false;
    pList.classList.toggle('sidebar-sub-list--collapsed', !state._sidebarPoliciesExpanded);
    var polToggle = document.getElementById('sidebar-policies-toggle');
    if (polToggle) {
      polToggle.textContent = state._sidebarPoliciesExpanded ? '▾' : '▸';
      polToggle.setAttribute('aria-expanded', state._sidebarPoliciesExpanded ? 'true' : 'false');
      polToggle.style.visibility = (ispEntry || policyEntries) ? 'visible' : 'hidden';
    }
  }

  // Populate Controls sidebar — collapsed by default
  const cList = document.getElementById('sidebar-controls-list');
  if (cList) {
    const scopedControls = getScopedControls();
    const isScoped = user && userRole === 'control-owner';
    const label = isScoped ? 'My controls' : 'All controls';
    const count = scopedControls.length;
    cList.innerHTML = count
      ? '<div class="sidebar-item" style="padding-left:28px;font-size:12px;" onclick="showTab(\'control\');goToStep(\'control\',1);">'
        + '<span style="font-weight:600;color:var(--text);">' + label + '</span>'
        + '<span style="margin-left:6px;color:var(--text-muted);font-size:11px;">(' + count + ')</span></div>'
      : '';
    if (typeof state._sidebarControlsExpanded !== 'boolean') state._sidebarControlsExpanded = false;
    cList.classList.toggle('sidebar-sub-list--collapsed', !state._sidebarControlsExpanded);
    var ctrlToggle = document.getElementById('sidebar-controls-toggle');
    if (ctrlToggle) {
      ctrlToggle.textContent = state._sidebarControlsExpanded ? '▾' : '▸';
      ctrlToggle.setAttribute('aria-expanded', state._sidebarControlsExpanded ? 'true' : 'false');
      ctrlToggle.style.visibility = count ? 'visible' : 'hidden';
    }
  }

  // Update notification badges and asset sidebar whenever sidebar is rendered
  applyPostSetupNav();
  setTimeout(updateNotificationBadges, 50);
  setTimeout(renderSidebarAssets, 60);
  setTimeout(function() {
    if (typeof enhanceKeyboardAccessibility === 'function') enhanceKeyboardAccessibility();
  }, 80);
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

  // Reports badge: pending review queue items for ISSM/CISO, or ISP awaiting approver sign-off
  var reviewCount = 0;
  if (typeof canSessionApproveISP === 'function' && canSessionApproveISP()) {
    reviewCount = 1;
  } else if (role === 'approver' && typeof getISPStatus === 'function' && getISPStatus() === 'Under Review') {
    reviewCount = 1;
  } else if (role === 'issm' || role === 'ciso' || !user) {
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

  if (typeof getPoamOverdueCount === 'function') {
    setBadge('badge-poam', getPoamOverdueCount());
  }
}

function renderSidebarAssets() {
  var list = document.getElementById('sidebar-assets-list');
  if (!list) return;

  var assets = state.assets || [];

  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var role = user ? user.role : 'admin';
  var visibleTabs = (typeof getRoleTabs === 'function') ? getRoleTabs(role) : (ROLE_TABS[role] || TAB_IDS);
  var wsSection = document.getElementById('sidebar-workspaces-section');
  var complianceSection = document.getElementById('sidebar-compliance-workspace-section');
  if (complianceSection && !visibleTabs.includes('asset') && role !== 'admin' && user) {
    return;
  }

  var scopedIds = getCurrentPersonAssetIds();
  if (scopedIds) {
    assets = assets.filter(function(a){ return scopedIds.indexOf(String(a.id)) !== -1; });
  }

  if (!assets.length) {
    list.innerHTML = '';
    var assetToggle = document.getElementById('sidebar-assets-toggle');
    if (assetToggle) assetToggle.style.visibility = 'hidden';
    if (typeof state._sidebarAssetsExpanded !== 'boolean') state._sidebarAssetsExpanded = false;
    list.classList.add('sidebar-sub-list--collapsed');
    return;
  }

  list.innerHTML = assets.map(function(a) {
    var signoff = (state.sspSignoffs||{})[a.id] || {};
    var attests = (state.sspAttestations||{})[a.id] || {};
    var controls = getAssetSSPControls(a);
    var done = controls.filter(function(c){ return (attests[c.id]||{}).status; }).length;
    var statusDot = signoff.status === 'Approved'  ? 'var(--green)'
                  : signoff.status === 'Submitted' ? 'var(--accent)'
                  : done > 0                       ? '#f59e0b'
                  :                                  'var(--border)';
    return '<div class="sidebar-item" style="padding-left:28px;font-size:12px;cursor:pointer;" onclick="openAssetWizardFromLibrary(\'' + a.id + '\')">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:' + statusDot + ';display:inline-block;margin-right:6px;flex-shrink:0;"></span>'
      + '<span style="color:var(--text);font-weight:500;">' + _esc(a.name) + '</span>'
      + '<span style="margin-left:4px;color:var(--text-muted);font-size:10px;">' + _esc(a.type||'') + '</span>'
      + '</div>';
  }).join('')
    + '<div class="sidebar-item" style="padding-left:28px;font-size:12px;cursor:pointer;" onclick="showTab(\'asset\');openAddAssetModal()">'
    + '<span style="color:var(--teal);font-weight:600;">+ Add Asset</span>'
    + '</div>';

  if (typeof state._sidebarAssetsExpanded !== 'boolean') state._sidebarAssetsExpanded = false;
  list.classList.toggle('sidebar-sub-list--collapsed', !state._sidebarAssetsExpanded);
  var assetsToggle = document.getElementById('sidebar-assets-toggle');
  if (assetsToggle) {
    assetsToggle.textContent = state._sidebarAssetsExpanded ? '▾' : '▸';
    assetsToggle.setAttribute('aria-expanded', state._sidebarAssetsExpanded ? 'true' : 'false');
    assetsToggle.style.visibility = 'visible';
  }
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

/** Asset tab landing: SSP inventory (assets + processes), not library or a single SSP wizard. */
function goToAssetSspHome() {
  state._assetLibraryMode = false;
  state._assetTypeLibraryMode = false;
  state._sspReviewerReadOnly = false;
  state._selectedAssetId = null;
  state._selectedProcessId = null;
  if (typeof currentStep !== 'undefined' && currentStep) currentStep.asset = 1;
  showTab('asset');
}

function goToAssetWorkspace() {
  goToAssetSspHome();
}

function goToAssetLibrary() {
  state._assetLibraryMode = true;
  state._assetTypeLibraryMode = false;
  state._selectedAssetId = null;
  state._selectedProcessId = null;
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
    showToast('You do not have access to open the asset-owner SSP workspace for this system.', true);
    return;
  }
  state._assetLibraryMode = false;
  state._assetTypeLibraryMode = false;
  showTab('asset');
  enterAssetSSP(assetId);
}

/** Open a process SSP wizard from library / reports (no asset-owner-only gate). */
function openProcessSspFromLibrary(procId) {
  state._assetLibraryMode = false;
  state._assetTypeLibraryMode = false;
  showTab('asset');
  if (typeof enterProcessSSP === 'function') enterProcessSSP(procId);
}

// ============================================================
// CISO STEP 1 — ORGANIZATION
// CISO STEP 2 — BASELINE & SCOPE
// CISO STEP 3 — REGULATORY MAPPING
// ============================================================
function renderCISOStep1() {
  const body = document.getElementById('ciso-step-1-body');
  if (!body) return;

  body.innerHTML = `
    ${cisoStepProgressHtml(1, 'Organization')}
    <div class="section-title">Who owns this program?</div>
    <div class="section-subtitle">Start with the basics — your organization and the senior official accountable for the security program.</div>

    <div style="display:flex;flex-direction:column;gap:14px;margin-top:8px;">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Organization / Agency Name <span class="required">*</span></label>
        <input class="form-input" id="orgNameInput" placeholder="e.g., Acme Corp, Department of Defense — Agency X" value="${escapeHTML(state.orgName)}" oninput="state.orgName=this.value; window.markDirty();">
        <div class="form-hint">Full legal name of the organization this information security program governs.</div>
      </div>
      ${typeof renderOrgClassificationFieldsHtml === 'function' ? renderOrgClassificationFieldsHtml() : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Security Program Owner — Full Name <span class="required">*</span></label>
          <input class="form-input" id="programOwnerInput" placeholder="e.g., Jane Smith" value="${escapeHTML(state.programOwner)}" oninput="state.programOwner=this.value; window.markDirty();">
          <div class="form-hint">Senior official responsible for the security program (CISO, SAISO, or equivalent).</div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Title / Role <span class="required">*</span></label>
          <input class="form-input" id="programOwnerTitleInput" placeholder="${escapeHTML(getDefaultProgramOwnerTitle())}" value="${escapeHTML(state.programOwnerTitle)}" oninput="state.programOwnerTitle=this.value; window.markDirty();">
          <div class="form-hint">Official title — flows into policy documents as the accountable role.</div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Email Address <span class="required">*</span></label>
          <input class="form-input" id="programOwnerEmailInput" type="email" placeholder="e.g., jsmith@agency.gov" value="${escapeHTML(state.programOwnerEmail)}" oninput="state.programOwnerEmail=this.value; window.markDirty();">
          <div class="form-hint">Used for the owner roster and sign-in. Domain owners only need email during setup — they add name and title on first login.</div>
        </div>
      </div>
      <label style="display:inline-flex;align-items:center;gap:10px;margin-top:4px;padding:10px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;cursor:pointer;user-select:none;">
        <input type="checkbox" ${state.cisoIsISSM ? 'checked' : ''} onchange="state.cisoIsISSM=this.checked;renderCISOStep1(); window.markDirty();" style="width:16px;height:16px;accent-color:#0369a1;cursor:pointer;">
        <div>
          <span style="font-size:13px;color:#0369a1;font-weight:600;">Program Owner also owns domain policies</span>
          <span style="font-size:12px;color:#64748b;"> — common in teams under ~100 people.</span>
        </div>
      </label>
    </div>
  `;
}

function renderCISOStep2Baseline() {
  const body = document.getElementById('ciso-step-2-body');
  if (!body) return;

  if (state.privacyOverlay) {
    var _syncTitle = (state.programOwnerTitle || '').trim();
    if (_syncTitle === DEFAULT_PROGRAM_OWNER_TITLE) {
      state.programOwnerTitle = DEFAULT_PROGRAM_OWNER_TITLE_WITH_PRIVACY;
      if (typeof markDirty === 'function') markDirty();
    }
  }

  const lCount = baselineCount('L');
  const mCount = baselineCount('M');
  const hCount = baselineCount('H');
  const privCount = typeof getPrivacyOnlyCatalogControlCount === 'function' ? getPrivacyOnlyCatalogControlCount() : 0;
  const isFisma = !!state.fismaMode;
  const selectedTypes = Array.isArray(state.programInfoTypes) ? state.programInfoTypes : [];

  const fismaToggleCard = `
    <div class="privacy-toggle-card ${isFisma?'selected':''}" onclick="toggleProgramFismaMode()" style="margin-bottom:14px;border-color:${isFisma?'#7c3aed':'var(--border)'};${isFisma?'background:#f5f3ff;':''}">
      <div class="pt-icon">🏛️</div>
      <div class="pt-info">
        <div class="pt-name">FISMA / CUI program (info-types-driven baseline)</div>
        <div class="pt-desc">Turn on if this program must comply with FISMA, FedRAMP, DoD RMF, or handle CUI. Derives baseline from NIST 800-60 information types.</div>
      </div>
      <div class="toggle-switch ${isFisma?'on':''}"></div>
    </div>`;

  let baselineBlock = '';
  if (!isFisma) {
    baselineBlock = `
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
      </div>`;
  } else {
    const derivedBaseline = computeBaselineFromInfoTypes(selectedTypes);
    const override = (state.baselineOverride === 'L' || state.baselineOverride === 'M' || state.baselineOverride === 'H') ? state.baselineOverride : null;
    const effectiveBaseline = override || derivedBaseline;
    const effectiveCount = BASELINE_COUNTS[effectiveBaseline] || 0;
    const labelOf = (b) => b === 'H' ? 'High' : b === 'M' ? 'Moderate' : 'Low';
    const isTailored = !!override && override !== derivedBaseline;
    const tailorDir = isTailored ? (_fipsRank(override) > _fipsRank(derivedBaseline) ? 'up' : 'down') : null;
    const derivedPill = (b) => derivedBaseline === b
      ? ' <span style="background:#7c3aed;color:white;font-size:10px;padding:2px 6px;border-radius:10px;margin-left:4px;font-weight:700;">DERIVED</span>'
      : '';
    baselineBlock = `
      <div style="margin-bottom:8px;">
        <div class="section-title" style="margin-bottom:2px;">Program baseline <span style="font-size:11px;font-weight:600;color:#7c3aed;background:#ede9fe;padding:2px 8px;border-radius:10px;margin-left:6px;letter-spacing:0.4px;">FISMA</span></div>
        <div class="section-subtitle">FIPS 199 high-water mark across the information types below sets the derived baseline. NIST allows tailoring up (or down with justification) — click a card to tailor.</div>
      </div>
      <div class="baseline-grid">
        <div class="baseline-card bc-low ${effectiveBaseline==='L'?'selected':''}" onclick="setProgramBaselineOverride('L')" style="cursor:pointer;">
          <div class="bc-label">LOW IMPACT${derivedPill('L')}</div>
          <div class="bc-name">Low Baseline</div>
          <div class="bc-desc">${lCount} controls.</div>
        </div>
        <div class="baseline-card bc-mod ${effectiveBaseline==='M'?'selected':''}" onclick="setProgramBaselineOverride('M')" style="cursor:pointer;">
          <div class="bc-label">MODERATE IMPACT${derivedPill('M')}</div>
          <div class="bc-name">Moderate Baseline</div>
          <div class="bc-desc">${mCount} controls.</div>
        </div>
        <div class="baseline-card bc-high ${effectiveBaseline==='H'?'selected':''}" onclick="setProgramBaselineOverride('H')" style="cursor:pointer;">
          <div class="bc-label">HIGH IMPACT${derivedPill('H')}</div>
          <div class="bc-name">High Baseline</div>
          <div class="bc-desc">${hCount} controls.</div>
        </div>
      </div>
      ${selectedTypes.length === 0
        ? `<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:10px 14px;margin:10px 0 8px;font-size:13px;color:#92400e;line-height:1.5;">
            <strong>No information types selected yet.</strong> Pick at least one type below — until you do, the derived baseline defaults to Low.
          </div>`
        : isTailored
          ? `<div style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:12px 14px;margin:10px 0 8px;font-size:13px;color:#713f12;line-height:1.55;">
              <div style="font-weight:800;margin-bottom:4px;">⚠️ Baseline tailored ${tailorDir} (${derivedBaseline} → ${override})</div>
              Derived from your information types: <strong>${labelOf(derivedBaseline)} (${derivedBaseline})</strong>. You've tailored ${tailorDir} to <strong>${labelOf(effectiveBaseline)} (${effectiveBaseline})</strong> — ${effectiveCount} controls.
              ${tailorDir === 'down'
                ? ` Tailoring <em>down</em> reduces controls below what FIPS 199 would normally require — your rationale must explain compensating controls or risk acceptance.`
                : ` Tailoring <em>up</em> is always permitted; capture why for the audit trail.`}
              <button class="btn btn-secondary btn-sm" type="button" onclick="setProgramBaselineOverride(null)" style="margin-left:8px;font-size:11px;padding:3px 10px;">Revert to derived</button>
            </div>
            <div class="form-group" style="margin-top:8px;max-width:720px;">
              <label class="form-label" style="font-size:12px;">Tailoring rationale <span style="color:var(--red)">*</span></label>
              <textarea class="form-input" rows="2" placeholder="Why is this baseline appropriate? Reference threats, mission context, regulatory drivers, or compensating controls." oninput="setProgramBaselineOverrideRationale(this.value)">${escapeHTML(state.baselineOverrideRationale || '')}</textarea>
            </div>`
          : `<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:10px 14px;margin:10px 0 8px;font-size:13px;color:#065f46;line-height:1.5;">
              <strong>Effective baseline: ${labelOf(effectiveBaseline)} (${effectiveBaseline}) — ${effectiveCount} controls.</strong> Matches the FIPS 199 high-water mark across your selected information types. Click a different card above to tailor up or down.
            </div>`
      }
      <div style="margin:14px 0 8px;">
        <div class="section-title" style="margin-bottom:2px;">Information types this program will handle</div>
        <div class="section-subtitle">Select every category your systems will create, store, or process. Each one carries a NIST 800-60 suggested C/I/A — the highest across your selections sets the derived baseline.</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:10px;margin-bottom:14px;">
        ${(typeof INFO_TYPES_800_60 !== 'undefined' ? INFO_TYPES_800_60 : []).map(function(it) {
          var on = selectedTypes.indexOf(it.id) >= 0;
          var border = on ? '2px solid var(--teal)' : '2px solid #e5e7eb';
          var bg = on ? '#ecfdf5' : '#fff';
          var seed = 'C' + it.cia.c + ' / I' + it.cia.i + ' / A' + it.cia.a;
          var seedHigh = _fipsLetterFromRank(Math.max(_fipsRank(it.cia.c), _fipsRank(it.cia.i), _fipsRank(it.cia.a)));
          var seedColor = seedHigh === 'H' ? '#dc2626' : seedHigh === 'M' ? '#d97706' : '#059669';
          var idEsc = escapeHTML(it.id).replace(/'/g, "\\'");
          return `<label style="display:block;border:${border};background:${bg};border-radius:10px;padding:12px 14px;cursor:pointer;transition:border-color .15s, background .15s;">
            <div style="display:flex;gap:10px;align-items:flex-start;">
              <input type="checkbox" ${on?'checked':''} onchange="toggleProgramInfoType('${idEsc}')" style="margin-top:3px;flex-shrink:0;">
              <div style="flex:1;min-width:0;">
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px;">
                  <span style="font-weight:700;font-size:13px;color:var(--navy);">${escapeHTML(it.label)}</span>
                  <span style="background:${seedColor};color:#fff;font-size:10px;font-weight:800;letter-spacing:0.4px;padding:2px 8px;border-radius:10px;">${seed}</span>
                </div>
                <div style="font-size:12px;color:#475569;line-height:1.45;">${escapeHTML(it.desc || '')}</div>
                ${it.examples ? `<div style="font-size:11px;color:var(--text-muted);margin-top:3px;line-height:1.4;"><em>Examples: ${escapeHTML(it.examples)}</em></div>` : ''}
              </div>
            </div>
          </label>`;
        }).join('')}
      </div>`;
  }

  body.innerHTML = `
    ${cisoStepProgressHtml(2, 'Baseline & scope')}
    ${fismaToggleCard}
    ${baselineBlock}

    <div class="privacy-toggle-card ${state.privacyOverlay?'selected':''}" onclick="togglePrivacy()" style="margin-top:8px;">
      <div class="pt-icon">🔒</div>
      <div class="pt-info">
        <div class="pt-name">Add Privacy Overlay (PT family + P-baseline controls + PM-18 through PM-28)</div>
        <div class="pt-desc">Adds <strong>${privCount}</strong> catalog controls for PII processing, plus tiered PM privacy controls you confirm in Step 4. Use when systems process Personally Identifiable Information (PII).</div>
      </div>
      <div class="toggle-switch ${state.privacyOverlay?'on':''}"></div>
    </div>

    ${state.baseline ? `
    <div class="summary-box">
      <h3>📊 Selected Program Scope</h3>
      <div class="summary-kv"><span class="sk">Baseline:</span><span class="sv">${state.baseline==='L'?'Low Impact':state.baseline==='M'?'Moderate Impact':'High Impact'}</span></div>
      <div class="summary-kv"><span class="sk">Privacy Overlay:</span><span class="sv">${state.privacyOverlay?'Yes — PT (Privacy) family included':'No'}</span></div>
      <div class="summary-kv"><span class="sk">Total Controls in Scope:</span><span class="sv">${BASELINE_COUNTS[state.baseline] || 0} controls across ${getActiveFamilies().filter(f=>f!=='PM').length} families${Object.values(state.pmControls||{}).filter(Boolean).length ? ' + ' + Object.values(state.pmControls||{}).filter(Boolean).length + ' PM controls' : ''}</span></div>
      <div class="summary-kv"><span class="sk">Organization:</span><span class="sv">${state.orgName||'Not yet set'}</span></div>
      <div class="summary-kv"><span class="sk">Program Owner:</span><span class="sv">${state.programOwner ? state.programOwner + ' — ' + (((state.programOwnerTitle || '').trim()) || getDefaultProgramOwnerTitle()) + (state.programOwnerEmail ? ' &lt;' + state.programOwnerEmail + '&gt;' : '') : 'Not yet assigned'}</span></div>
    </div>` : ''}
  `;
}

function renderCISOStep3Integrations() {
  const body = document.getElementById('ciso-step-3-body');
  if (!body) return;

  body.innerHTML = `
    ${cisoStepProgressHtml(3, 'Reg mapping')}
    <div class="section-title">Regulatory &amp; framework mapping</div>
    <div class="section-subtitle">NIST 800-53 is your anchor. Choose voluntary standards and applicable laws — suggestions follow the organization profile you set in Step 1.</div>

    ${typeof renderFrameworkSetupSectionHtml === 'function' ? renderFrameworkSetupSectionHtml() : ''}

    ${typeof renderComplianceLawSetupSectionHtml === 'function' ? renderComplianceLawSetupSectionHtml() : ''}

    ${typeof renderCustomRegAddFormHtml === 'function' ? renderCustomRegAddFormHtml() : ''}
  `;
}

// Checkbox only — domain owner emails are assigned explicitly in Step 7 (Apply button).
function applyCisoIsISSM() {}

function selectBaseline(bl) {
  state.baseline = bl;
  // Reset privacy PM controls so they re-apply correctly when Step 2 is next rendered
  resetPrivacyPMDefaults();
  renderCISOStep2Baseline();
  renderSidebarBadges();
}

function togglePrivacy() {
  state.privacyOverlay = !state.privacyOverlay;
  // Reset privacy PM controls so renderCISOStep2 re-applies the right tier
  resetPrivacyPMDefaults();
  var prevIspDefault = state.privacyOverlay ? 'Information Security Policy' : 'Information Security and Privacy Policy';
  var nextIspDefault = getDefaultISPTitle();
  if (state.infoSecPolicy && typeof state.infoSecPolicy.title === 'string') {
    var currentIspTitle = (state.infoSecPolicy.title || '').trim();
    if (!currentIspTitle || currentIspTitle === prevIspDefault) {
      state.infoSecPolicy.title = nextIspDefault;
      if (typeof markDirty === 'function') markDirty();
    }
  }
  var pt = (state.programOwnerTitle || '').trim();
  if (state.privacyOverlay) {
    if (!pt || pt === DEFAULT_PROGRAM_OWNER_TITLE) {
      state.programOwnerTitle = getDefaultProgramOwnerTitle();
      if (typeof markDirty === 'function') markDirty();
    }
  } else {
    if (pt === DEFAULT_PROGRAM_OWNER_TITLE_WITH_PRIVACY) {
      state.programOwnerTitle = DEFAULT_PROGRAM_OWNER_TITLE;
      if (typeof markDirty === 'function') markDirty();
    }
    if (state.policySelectedControls && state.policySelectedControls.PT) {
      delete state.policySelectedControls.PT;
    }
  }
  renderCISOStep2Baseline();
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

// ─── FISMA / CUI MODE (info-types-driven baseline) ──────────────────────────
// state.fismaMode reframes Step 1: instead of picking L/M/H directly, the CISO
// picks the information types this program is expected to handle (NIST 800-60).
// The program baseline is then derived as the high-water mark of those types'
// CIA seeds. NIST 800-37 / 800-60 §3.4 explicitly allow tailoring this derived
// baseline up (or down with documented justification) — see setProgramBaselineOverride.
function _fipsRank(ch) { return { L: 1, M: 2, H: 3 }[ch] || 1; }
function _fipsLetterFromRank(r) { return r === 3 ? 'H' : r === 2 ? 'M' : 'L'; }

/** High-water mark of the C/I/A seeds across selected program info types (returns 'L' if none). */
function computeBaselineFromInfoTypes(typeIds) {
  if (!Array.isArray(typeIds) || !typeIds.length) return 'L';
  if (typeof INFO_TYPES_800_60 === 'undefined') return 'L';
  var idx = {};
  INFO_TYPES_800_60.forEach(function(it) { idx[it.id] = it; });
  var max = 1;
  typeIds.forEach(function(id) {
    var it = idx[id];
    if (it && it.cia) {
      max = Math.max(max, _fipsRank(it.cia.c), _fipsRank(it.cia.i), _fipsRank(it.cia.a));
    }
  });
  return _fipsLetterFromRank(max);
}

/** Resolve the *effective* baseline (derived ∪ FISMA tailoring override). */
function resolveProgramBaseline() {
  if (!state.fismaMode) return state.baseline || null;
  var derived = computeBaselineFromInfoTypes(state.programInfoTypes);
  var ov = state.baselineOverride;
  if (ov === 'L' || ov === 'M' || ov === 'H') return ov;
  return derived;
}

/** Recompute state.baseline as the effective baseline. */
function _refreshEffectiveProgramBaseline() {
  state.baseline = resolveProgramBaseline();
}

/** Toggle FISMA / CUI mode. When turning on, derive baseline from current info-type selections. */
function toggleProgramFismaMode() {
  state.fismaMode = !state.fismaMode;
  if (state.fismaMode) {
    if (!Array.isArray(state.programInfoTypes)) state.programInfoTypes = [];
    _refreshEffectiveProgramBaseline();
    resetPrivacyPMDefaults();
    if (typeof addAuditEntry === 'function') addAuditEntry('program', '', 'FISMA / CUI mode enabled — baseline now derived from selected information types.');
  } else {
    // Leaving FISMA mode: clear any tailoring override so the manual L/M/H pick is the source of truth again.
    state.baselineOverride = null;
    state.baselineOverrideRationale = '';
    if (typeof addAuditEntry === 'function') addAuditEntry('program', '', 'FISMA / CUI mode disabled — baseline is now picked manually.');
  }
  if (typeof markDirty === 'function') markDirty();
  renderCISOStep2Baseline();
  if (typeof renderSidebarBadges === 'function') renderSidebarBadges();
}

/** Toggle one info type in or out of the program-level selection (FISMA mode only). */
function toggleProgramInfoType(id) {
  if (!Array.isArray(state.programInfoTypes)) state.programInfoTypes = [];
  var i = state.programInfoTypes.indexOf(id);
  if (i >= 0) state.programInfoTypes.splice(i, 1);
  else state.programInfoTypes.push(id);
  _refreshEffectiveProgramBaseline();
  resetPrivacyPMDefaults();
  if (typeof markDirty === 'function') markDirty();
  renderCISOStep2Baseline();
  if (typeof renderSidebarBadges === 'function') renderSidebarBadges();
}

/**
 * Tailor the FISMA-derived baseline up or down. Pass 'L', 'M', 'H', or null
 * (null clears the override and reverts to the derived value). Audit-logs
 * the tailoring decision.
 */
function setProgramBaselineOverride(letter) {
  var clear = letter == null;
  var valid = letter === 'L' || letter === 'M' || letter === 'H';
  if (!clear && !valid) return;
  var derived = computeBaselineFromInfoTypes(state.programInfoTypes);
  var prev = state.baselineOverride;
  state.baselineOverride = clear ? null : letter;
  if (clear) state.baselineOverrideRationale = '';
  _refreshEffectiveProgramBaseline();
  resetPrivacyPMDefaults();
  if (typeof addAuditEntry === 'function') {
    if (clear) {
      addAuditEntry('program', '', 'Baseline tailoring cleared — reverted to derived baseline (' + derived + ').');
    } else if (prev !== letter) {
      var dir = _fipsRank(letter) > _fipsRank(derived) ? 'UP' : (_fipsRank(letter) < _fipsRank(derived) ? 'DOWN' : 'EQUAL');
      addAuditEntry('program', '', 'Baseline tailored ' + dir + ' from derived ' + derived + ' to ' + letter + '.');
    }
  }
  if (typeof markDirty === 'function') markDirty();
  renderCISOStep2Baseline();
  if (typeof renderSidebarBadges === 'function') renderSidebarBadges();
}

/** Persist the rationale for the baseline tailoring decision. */
function setProgramBaselineOverrideRationale(text) {
  state.baselineOverrideRationale = text || '';
  if (typeof markDirty === 'function') markDirty();
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
  const body = document.getElementById('ciso-step-4-body');
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
      <div class="ia-text"><strong>PM-1, PM-2, and PM-9 are pre-selected</strong> as they form the foundation of any security program. All other PM controls are optional — select those applicable to your organization. PM controls are organization-wide and apply regardless of impact level.${state.privacyOverlay ? ` <strong style="color:#6366f1;">Privacy overlay is active:</strong> PM-18 through PM-${state.baseline==='H'?'28':state.baseline==='M'?'25':'20(1)'} are also pre-selected — these support the privacy program plan, leadership, disclosures, and PII governance requirements appropriate for your ${state.baseline==='H'?'High':state.baseline==='M'?'Moderate':'Low'} baseline. Policy requirements for these controls are automatically added to your Tier 1 policy in Step 3.` : ''}</div>
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
function getDefaultISPEnforcementContent(orgNameVal) {
  var org = orgNameVal || state.orgName || 'the organization';
  return org + ' shall enforce this policy through documented procedures, monitoring, and corrective action. Violations may result in disciplinary action up to and including termination of employment or contract, civil or criminal penalties where applicable, and revocation of access to information systems. The CISO (or designee) shall investigate reported violations and coordinate remediation with Human Resources and legal counsel as appropriate.';
}

function getDefaultISPExceptionsContent(orgNameVal) {
  var org = orgNameVal || state.orgName || 'the organization';
  return org + ' may grant exceptions to this policy when business necessity, technical constraints, or risk acceptance warrants a deviation. All exceptions shall be documented in writing, approved by the CISO or executive leadership based on residual risk, assigned an expiration date, and tracked in the organization\'s risk register or POA&M. Exceptions shall not reduce baseline security controls below the authorized impact level without formal risk acceptance.';
}

function buildDefaultISPRoles(ownerTitle) {
  var roles = [
    { name:'Executive Leadership', responsibilities:['Approve and endorse the organization information security policy at the highest organizational level','Allocate resources (budget, personnel, technology) sufficient to execute the information security program','Accept enterprise-level risk on behalf of the organization and communicate risk tolerance to the CISO','Champion a security-aware culture across the organization'] },
    { name: ownerTitle, responsibilities:['Draft, approve, and maintain this Tier 1 organizational information security policy','Report to executive leadership on security posture and program effectiveness','Oversee the information security program, including risk management, compliance, and continuous monitoring','Accept and formally document cyber risk decisions within delegated authority','Coordinate incident response at the program level and ensure lessons learned are integrated into policy'] },
  ];
  if (state.privacyOverlay) {
    roles.push({ name:'Senior Agency Official for Privacy (SAOP)', responsibilities:['Lead the organization privacy program and serve as the accountable official for privacy compliance','Review and approve privacy policies, notices, and PII processing activities','Coordinate with the CISO on integrated security and privacy control implementation','Report to executive leadership on privacy program effectiveness and risk'] });
  }
  roles.push(
    { name:'Information System Security Managers (ISSMs)', responsibilities:['Draft, approve, and maintain Tier 2 domain-level policies for assigned NIST 800-53 control families','Provide program-level oversight of ISSOs and ensure consistent application of this policy across the system portfolio','Review and approve SSPs, POA&Ms, and significant change requests before escalation to the AO','Coordinate common control identification and inheritance documentation across managed systems'] },
    { name:'All Personnel', responsibilities:['Comply with this policy and all subordinate domain policies applicable to their role','Complete security awareness training within required timeframes','Report suspected security incidents, policy violations, or vulnerabilities to the designated reporting channel'] }
  );
  return roles;
}

function ensureISPSectionMigrations() {
  var isp = state.infoSecPolicy;
  if (!isp || !isp.sections) return;
  var orgNameVal = state.orgName || 'the organization';
  function insertAfter(afterType, section) {
    if (isp.sections.some(function(s) { return s.type === section.type; })) return;
    var idx = isp.sections.findIndex(function(s) { return s.type === afterType; });
    var insertAt = idx >= 0 ? idx + 1 : isp.sections.length;
    isp.sections.splice(insertAt, 0, section);
  }
  insertAfter('requirements', { type:'enforcement', title:'Enforcement & Violations', content: getDefaultISPEnforcementContent(orgNameVal) });
  insertAfter('enforcement', { type:'exceptions', title:'Exceptions & Waivers', content: getDefaultISPExceptionsContent(orgNameVal) });
  isp.sections = (isp.sections || []).filter(function(s) { return s.type !== 'compliance'; });
  isp.sections.forEach(function(sec) {
    if (sec.type === 'enforcement' && !sec.content) sec.content = getDefaultISPEnforcementContent(orgNameVal);
    if (sec.type === 'exceptions' && !sec.content) sec.content = getDefaultISPExceptionsContent(orgNameVal);
  });
}

function ensureISPPrivacyRoles() {
  var isp = state.infoSecPolicy;
  if (!isp || !isp.roles || !state.privacyOverlay) return;
  var hasSaop = isp.roles.some(function(r) { return /saop|senior agency official for privacy|privacy officer/i.test(r.name || ''); });
  if (hasSaop) return;
  var insertAt = Math.min(2, isp.roles.length);
  isp.roles.splice(insertAt, 0, {
    name:'Senior Agency Official for Privacy (SAOP)',
    responsibilities:['Lead the organization privacy program and serve as the accountable official for privacy compliance','Review and approve privacy policies, notices, and PII processing activities','Coordinate with the CISO on integrated security and privacy control implementation','Report to executive leadership on privacy program effectiveness and risk']
  });
}

function draftUnmappedPMRequirements(rerender) {
  var isp = state.infoSecPolicy;
  if (!isp || !isp.requirements) return 0;
  var allActivePM = Object.keys(state.pmControls || {}).filter(function(id) { return state.pmControls[id]; });
  var mapped = isp.requirements.flatMap(function(r) { return r.controls || []; });
  var unmapped = allActivePM.filter(function(id) { return mapped.indexOf(id) < 0; });
  if (!unmapped.length) return 0;
  var orgNameVal = state.orgName || 'the organization';
  var stmts = {
    'PM-1': orgNameVal + ' shall develop, document, and disseminate an organization-wide information security program plan. [NIST 800-53: PM-1]',
    'PM-2': orgNameVal + ' shall appoint a senior information security official with the mission and resources to coordinate the program. [NIST 800-53: PM-2]',
    'PM-3': orgNameVal + ' shall include information security and privacy resources in capital planning and investment requests. [NIST 800-53: PM-3]',
    'PM-4': orgNameVal + ' shall implement a process to ensure plans of action and milestones are developed and maintained. [NIST 800-53: PM-4]',
    'PM-5': orgNameVal + ' shall develop and maintain an inventory of organizational information systems. [NIST 800-53: PM-5]',
    'PM-6': orgNameVal + ' shall develop, monitor, and report on information security measures of performance. [NIST 800-53: PM-6]',
    'PM-7': orgNameVal + ' shall develop an enterprise architecture with consideration for information security. [NIST 800-53: PM-7]',
    'PM-8': orgNameVal + ' shall develop and implement a Critical Infrastructure Protection plan. [NIST 800-53: PM-8]',
    'PM-9': orgNameVal + ' shall develop an enterprise-wide risk management strategy for information security. [NIST 800-53: PM-9]',
    'PM-10': orgNameVal + ' shall ensure an adequate security authorization process is established for information systems. [NIST 800-53: PM-10]',
    'PM-11': orgNameVal + ' shall define mission and business processes with consideration for information security and privacy. [NIST 800-53: PM-11]',
    'PM-12': orgNameVal + ' shall implement an insider threat program. [NIST 800-53: PM-12]',
    'PM-13': orgNameVal + ' shall establish an information security workforce development program. [NIST 800-53: PM-13]',
    'PM-14': orgNameVal + ' shall periodically test plans of action and milestones. [NIST 800-53: PM-14]',
    'PM-15': orgNameVal + ' shall establish contacts with security groups and associations. [NIST 800-53: PM-15]',
    'PM-16': orgNameVal + ' shall implement a threat awareness program with cross-organization sharing. [NIST 800-53: PM-16]',
    'PM-17': orgNameVal + ' shall authenticate information before taking protective action on security reports. [NIST 800-53: PM-17]'
  };
  unmapped.forEach(function(pmId) {
    var n = isp.requirements.length + 1;
    isp.requirements.push({ id:'IS-REQ-' + n, text: stmts[pmId] || (orgNameVal + ' shall implement ' + pmId + ' per NIST 800-53 Rev. 5. [NIST 800-53: ' + pmId + ']'), controls:[pmId] });
  });
  renumberReqs();
  if (typeof markDirty === 'function') markDirty();
  if (rerender !== false && typeof renderCISOStep3 === 'function') renderCISOStep3();
  return unmapped.length;
}

function renderCISOStep3() {
  if (state._ispRevisionView && typeof renderISPRevisionPanel === 'function') {
    renderISPRevisionPanel();
    return;
  }
  var body = document.getElementById('ciso-step-5-body');
  if (!body) return;
  renderISPEditorBody(body, { context: 'setup' });
}

function buildISPRevisionBannerHtml() {
  var notes = String((((state.policyStatus || {}).ISP || {}).notes) || '').trim();
  var returnedBy = String((((state.policyStatus || {}).ISP || {}).returnedBy) || '').trim();
  return '<div class="isp-revision-banner">'
    + '<div class="isp-revision-banner-title">↩ Returned for revision</div>'
    + (returnedBy ? '<div class="isp-revision-banner-meta">Returned by ' + escapeHTML(returnedBy) + '</div>' : '')
    + '<div class="isp-revision-banner-body">'
    + escapeHTML(notes || 'Your approver returned this policy. Update the content below, then resubmit for sign-off.')
    + '</div></div>';
}

function buildISPRevisionFooterHtml() {
  return '<div class="isp-revision-footer">'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="exitISPRevisionToViewer()">← Back to policy view</button>'
    + '<button type="button" class="btn btn-primary btn-sm" onclick="resubmitISPForApproval()">📨 Resubmit for approval</button>'
    + '</div>';
}

function renderISPEditorBody(body, opts) {
  opts = opts || {};
  var isRevision = opts.context === 'revision';
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">No Baseline Selected</div><p>Return to Step 2 to choose an impact level (Low, Moderate, or High) that matches your system\'s risk profile.</p></div>';
    return;
  }
  // Init policy state
  if (!state.infoSecPolicy) {
    const minus1 = getActiveControls().filter(function(c) { return isPolicyAndProceduresControl(c.id); }).map(function(c) { return c.id; });
    const ownerName  = state.programOwner || 'Program Owner';
    const ownerTitle = (state.programOwnerTitle || '').trim() || getDefaultProgramOwnerTitle();
    const orgNameVal = state.orgName || 'the organization';
    state.infoSecPolicy = {
      title: getDefaultISPTitle(),
      custodian: { name: '', role: '', email: '' },
      sections: [
        { type:'purpose', title:'Purpose', content:`This policy establishes ${orgNameVal}'s commitment to information security and provides the overarching framework for all subordinate security policies. It defines the strategic direction, governance structure, and accountability for the protection of information assets. This policy is built on the NIST Risk Management Framework (SP 800-37 Rev. 2), which provides the lifecycle for managing security risk, and implements the security${state.privacyOverlay ? ' and privacy' : ''} controls cataloged in NIST SP 800-53 Rev. 5.` },
        { type:'scope', title:'Scope', content:`This policy applies to all employees, contractors, third-party service providers, and any individual or system that accesses ${orgNameVal}'s information assets. It encompasses all information systems, business processes, and data regardless of form, format, or location, including cloud-hosted systems, mobile devices, and remote access connections.` },
        { type:'roles', title:'Roles & Responsibilities' },
        { type:'requirements', title:'Policy Requirements' },
        { type:'enforcement', title:'Enforcement & Violations', content: getDefaultISPEnforcementContent(orgNameVal) },
        { type:'exceptions', title:'Exceptions & Waivers', content: getDefaultISPExceptionsContent(orgNameVal) },
        { type:'documents', title:'Related Documents & Standards' },
        { type:'revision-history', title:'Revision History' },
      ],
      roles: buildDefaultISPRoles(ownerTitle),
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
      { type:'enforcement', title:'Enforcement & Violations' },
      { type:'exceptions', title:'Exceptions & Waivers' },
      { type:'documents', title:'Related Documents & Standards' },
      { type:'revision-history', title:'Revision History' },
    ];
    if (!state.infoSecPolicy.documents) {
      state.infoSecPolicy.documents = [
        { title:'NIST SP 800-53B', desc:'Control Baselines for Information Systems and Organizations.' },
        { title:'NIST SP 800-53 Rev. 5', desc:'Security and Privacy Controls for Information Systems and Organizations.' },
        { title:'NIST SP 800-37 Rev. 2 (RMF)', desc:'Risk Management Framework.' },
      ];
    }
  }
  if (!state.infoSecPolicy.title || !String(state.infoSecPolicy.title).trim()) {
    state.infoSecPolicy.title = getDefaultISPTitle();
  }

  // Ensure custodian object exists (migration for old saves)
  if (!state.infoSecPolicy.custodian) state.infoSecPolicy.custodian = { name: '', role: '', email: '' };

  ensureISPSectionMigrations();
  ensureISPPrivacyRoles();

  if (state.infoSecPolicy && !state.infoSecPolicy._pmAutoSeeded) {
    draftUnmappedPMRequirements(false);
    state.infoSecPolicy._pmAutoSeeded = true;
  }

  // Keep CISO role name in sync with Step 1 title
  var cisoTitle = (state.programOwnerTitle || '').trim() || getDefaultProgramOwnerTitle();
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
    if (sec.type === 'purpose' || sec.type === 'scope' || sec.type === 'enforcement' || sec.type === 'exceptions') {
      const hint = sec.type === 'purpose'
        ? 'Define the strategic intent and rationale for this information security policy.'
        : sec.type === 'scope'
        ? 'Define who and what this policy covers — people, systems, data, and organizational boundaries.'
        : sec.type === 'enforcement'
        ? 'Describe consequences for policy violations and the investigation process.'
        : 'Document how exceptions and waivers are requested, approved, tracked, and expired.';
      if ((sec.type === 'enforcement' || sec.type === 'exceptions') && !sec.content) {
        sec.content = sec.type === 'enforcement'
          ? getDefaultISPEnforcementContent(state.orgName || 'the organization')
          : getDefaultISPExceptionsContent(state.orgName || 'the organization');
      }
      content = `
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">${hint}</div>
        <textarea class="form-input" rows="6" style="font-size:13px;line-height:1.8;padding:16px 18px;border-radius:8px;background:white;border:1px solid var(--border);resize:vertical;min-height:120px;" oninput="setISPSectionContent(${si}, this.value);">${escapeHTML(sec.content||'')}</textarea>`;
    } else if (sec.type === 'roles') {
      content = renderRolesSection();
    } else if (sec.type === 'requirements') {
      content = renderRequirementsSection(unmappedPM);
    } else if (sec.type === 'documents') {
      content = renderDocumentsSection();
    } else if (sec.type === 'revision-history') {
      content = renderRevisionHistorySection(si);
    } else if (sec.type === 'controls') {
      content = renderControlsSection(activeControls, mappedControls, allActivePM);
    } else if (sec.type === 'custom') {
      content = `
        <div style="margin-bottom:8px;">
          <input class="form-input" style="font-size:14px;font-weight:600;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:4px 0;background:transparent;" value="${escapeHTML(sec.title)}" oninput="setISPSectionTitle(${si}, this.value, true);" placeholder="Section title">
        </div>
        <textarea class="form-input" rows="6" style="font-size:13px;line-height:1.8;padding:16px 18px;border-radius:8px;background:white;border:1px solid var(--border);resize:vertical;min-height:100px;" oninput="setISPSectionContent(${si}, this.value);" placeholder="Enter section content…">${escapeHTML(sec.content||'')}</textarea>`;
    }

    return `<div class="isp-section" data-section-idx="${si}" ${dragAttr} style="margin-bottom:28px;padding:4px;border-radius:6px;transition:background 0.15s;">${hdr}${content}</div>`;
  }).join('');

  body.innerHTML = (isRevision ? buildISPRevisionBannerHtml() : '')
    + (isRevision ? '' : '<div class="section-title">' + escapeHTML((isp.title || '').trim() || getDefaultISPTitle()) + '</div>'
      + '<div class="section-subtitle">Review and edit your organization\'s overall security policy here. The domain policies your teams write later should line up with this document.</div>')
    + `
    <div style="border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:20px;background:white;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:4px;">Policy title</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Choose the name shown in the app, reports, and exports (for example on a cover page or table of contents).</div>
      <input class="form-input" style="max-width:640px;font-size:14px;font-weight:600;" value="${escapeHTML((isp.title || '').trim() || getDefaultISPTitle())}" oninput="setISPTitle(this.value);" placeholder="${escapeHTML(getDefaultISPTitle())}">
    </div>

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
    ${renderReviewCycleCard('ISP', (isp.title || '').trim() || getDefaultISPTitle())}

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
    ${isRevision ? buildISPRevisionFooterHtml() : ''}
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
  const canonical = typeof resolveCatalogControlId === 'function' ? resolveCatalogControlId(cid) : null;
  if (!canonical) {
    showToast('Not a valid NIST SP 800-53 control ID in this app\'s catalog (e.g. AV-2 does not exist). Check spelling and family code.', true);
    return;
  }
  const reqs = state.infoSecPolicy.requirements;
  if (!reqs || !reqs[reqIdx]) return;
  if (!reqs[reqIdx].controls) reqs[reqIdx].controls = [];
  if (!reqs[reqIdx].controls.includes(canonical)) {
    reqs[reqIdx].controls.push(canonical);
  }
  try { markDirty(); } catch (e) {}
  renderCISOStep3();
}

function setISPCustodian(field, value) {
  if (!state.infoSecPolicy) return;
  if (!state.infoSecPolicy.custodian) state.infoSecPolicy.custodian = { name:'', role:'', email:'' };
  var prev = state.infoSecPolicy.custodian[field];
  state.infoSecPolicy.custodian[field] = value;
  if (typeof logFieldChange === 'function') logFieldChange('infoSecPolicy.custodian.' + field, prev, value);
  markDirty();
}

// ISP edit helpers — wrap raw mutations so the field-level change log captures them.
function setISPTitle(value) {
  if (!state.infoSecPolicy) return;
  var prev = state.infoSecPolicy.title || '';
  state.infoSecPolicy.title = value;
  if (typeof logFieldChange === 'function') logFieldChange('infoSecPolicy.title', prev, value);
  markDirty();
}

function setISPSectionContent(idx, value) {
  if (!state.infoSecPolicy || !state.infoSecPolicy.sections) return;
  var sec = state.infoSecPolicy.sections[idx];
  if (!sec) return;
  var prev = sec.content || '';
  sec.content = value;
  if (typeof logFieldChange === 'function') logFieldChange('infoSecPolicy.sections[' + idx + '].content', prev, value);
  markDirty();
}

function setISPSectionTitle(idx, value, rerender) {
  if (!state.infoSecPolicy || !state.infoSecPolicy.sections) return;
  var sec = state.infoSecPolicy.sections[idx];
  if (!sec) return;
  var prev = sec.title || '';
  sec.title = value;
  if (typeof logFieldChange === 'function') logFieldChange('infoSecPolicy.sections[' + idx + '].title', prev, value);
  markDirty();
  if (rerender && typeof renderCISOStep3 === 'function') renderCISOStep3();
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
          <input class="form-input" style="font-size:12px;color:#3b82f6;border:none;border-radius:0;padding:0;background:transparent;flex:1;min-width:0;" value="${escapeHTML(d.url||'')}" oninput="state.infoSecPolicy.documents[${i}].url=this.value; window.markDirty();" placeholder="Paste any URL — SharePoint, Confluence, external site…">
          ${d.url ? `<a href="${escapeHTML(d.url)}" target="_blank" style="font-size:11px;color:var(--teal);white-space:nowrap;text-decoration:none;font-weight:600;flex-shrink:0;">↗ Open</a>` : ''}
        </div>
      </div>
      <button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:4px;opacity:0.6;flex-shrink:0;" onclick="removePolicyDoc(${i})">🗑</button>
    </div>`).join('')}`;
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
              ${(() => {
                var domainLabel = getOwnerDisplayName(state.domainOwners[c.f]);
                var ctrlLabel = getOwnerDisplayName((state.controlOwners || {})[c.id]);
                var label = domainLabel !== '—' ? domainLabel : (ctrlLabel !== '—' ? ctrlLabel : 'Unassigned');
                return '<span style="display:inline-flex;align-items:center;gap:4px;">👤 ' + escapeHTML(label) + '</span>';
              })()}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// Auto-draft unmapped PM controls
function autoDraftUnmappedPM() {
  draftUnmappedPMRequirements(true);
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
const PRIORITY_DEFAULTS = { IR:'now', AC:'now', IA:'now', CP:'now', AT:'later', PE:'later', PT:'soon' };
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

function formatRoadmapDate(iso) {
  if (!iso) return '';
  var d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderPolicyPriorityRoadmapHTML(masters, merges, families, controls) {
  var byTier = { now: [], soon: [], later: [] };
  masters.forEach(function(fam) {
    var tier = getPriority(fam);
    var merged = families.filter(function(f) { return merges[f] === fam; });
    var ctrlCount = controls.filter(function(c) { return c.f === fam; }).length +
      merged.reduce(function(s, mf) {
        return s + controls.filter(function(c) { return c.f === mf; }).length;
      }, 0);
    byTier[tier].push({
      fam: fam,
      title: getPolicyMergedTitle(fam),
      badges: [fam].concat(merged),
      ctrlCount: ctrlCount,
      deadline: deadlineFromPriority(fam)
    });
  });
  ['now', 'soon', 'later'].forEach(function(t) {
    byTier[t].sort(function(a, b) {
      return a.deadline.localeCompare(b.deadline) || a.fam.localeCompare(b.fam);
    });
  });

  var todayLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  var trackSegments = [
    { tier: 'now', width: '22%' },
    { tier: 'soon', width: '39%' },
    { tier: 'later', width: '39%' }
  ];

  return `
    <div class="priority-roadmap" aria-label="Policy implementation roadmap by priority">
      <div class="priority-roadmap-head">
        <div>
          <div class="priority-roadmap-title">Implementation roadmap</div>
          <div class="priority-roadmap-sub">Policy documents grouped by urgency — updates as you change priorities below.</div>
        </div>
        <div class="priority-roadmap-today">Starts ${escapeHTML(todayLabel)}</div>
      </div>
      <div class="priority-roadmap-track" role="presentation">
        ${trackSegments.map(function(seg) {
          var m = PRIORITY_META[seg.tier];
          return '<div class="priority-roadmap-segment priority-roadmap-segment--' + seg.tier + '" style="flex:0 0 ' + seg.width + ';background:' + m.bar + ';" title="' + escapeHTML(m.label + ' · ' + m.hint) + '"><span>' + m.label + '</span><small>' + m.hint + '</small></div>';
        }).join('')}
      </div>
      <div class="priority-roadmap-lanes">
        ${['now', 'soon', 'later'].map(function(tier) {
          var m = PRIORITY_META[tier];
          var items = byTier[tier];
          return `
          <div class="priority-roadmap-lane priority-roadmap-lane--${tier}">
            <div class="priority-roadmap-lane-head" style="border-color:${m.bar};color:${m.fg};">
              <span class="priority-roadmap-lane-dot" style="background:${m.bar};"></span>
              <span class="priority-roadmap-lane-label">${m.label}</span>
              <span class="priority-roadmap-lane-count">${items.length}</span>
            </div>
            <div class="priority-roadmap-cards">
              ${items.length ? items.map(function(item) {
                return `
                <div class="priority-roadmap-card" style="border-left-color:${m.bar};">
                  <div class="priority-roadmap-card-badges">
                    ${item.badges.map(function(b) {
                      return '<span class="family-badge priority-roadmap-badge">' + escapeHTML(b) + '</span>';
                    }).join('')}
                  </div>
                  <div class="priority-roadmap-card-title">${escapeHTML(item.title)}</div>
                  <div class="priority-roadmap-card-meta">${item.ctrlCount} control${item.ctrlCount !== 1 ? 's' : ''} · target ${escapeHTML(formatRoadmapDate(item.deadline))}</div>
                </div>`;
              }).join('') : '<div class="priority-roadmap-empty">No domains in this window</div>'}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
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
    const email = (o.email || '').trim();
    if (!isValidOwnerEmail(email)) return;
    const key = normalizeOwnerEmail(email);
    if (!groups[key]) groups[key] = { name: getOwnerDisplayName(o), role: o.role || '', email: email, families: [] };
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
  const body = document.getElementById('ciso-step-6-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">No Baseline Selected</div><p>Complete Step 2 first.</p></div>';
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
      <span style="opacity:0.55;margin-right:8px;">Step 6 of 7</span> Consolidate &amp; Prioritize
    </div>

    <div class="section-title">Consolidate &amp; Prioritize Policies</div>
    <div class="section-subtitle">First, merge any domains that belong in a single policy document. Then set the urgency for each — this drives the draft deadlines in the next step.</div>

    <!-- Priority summary pills -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      ${Object.entries(PRIORITY_META).map(([tier,m]) => `
      <div style="background:${m.bg};border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${m.bar};"></div>
        <span style="font-size:12px;font-weight:700;color:${m.fg};">${m.label}</span>
        <span style="font-size:12px;color:${m.fg};opacity:0.8;">${priorityCounts[tier]} domain${priorityCounts[tier]!==1?'s':''} · ${m.hint}</span>
      </div>`).join('')}
    </div>

    ${renderPolicyPriorityRoadmapHTML(masters, merges, families, controls)}

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

function ensureDefaultDeadlinesForMasters(masters) {
  var changed = false;
  masters.forEach(function(fam) {
    if (!state.domainDeadlines[fam]) {
      state.domainDeadlines[fam] = deadlineFromPriority(fam);
      changed = true;
    }
  });
  if (changed && typeof markDirty === 'function') markDirty();
}

function applyOwnerEmailToFamilies(famList, email, meta) {
  var em = (email || '').trim();
  if (!isValidOwnerEmail(em)) return 0;
  meta = meta || {};
  var families = getActiveFamilies().filter(function(f) { return f !== 'PM'; });
  var merges = state.policyMerges || {};
  var count = 0;
  famList.forEach(function(fam) {
    state.domainOwners[fam] = {
      email: em,
      name: (meta.name || '').trim(),
      role: (meta.role || '').trim() || DOMAIN_SUGGESTED_ROLES[fam] || 'Security Manager'
    };
    delete state.domainOwners[fam].isDemoPlaceholder;
    families.filter(function(f) { return merges[f] === fam; }).forEach(function(mf) {
      state.domainOwners[mf] = Object.assign({}, state.domainOwners[fam]);
    });
    autoPopulateControlOwnersFromDomain(fam);
    count++;
  });
  if (count && typeof markDirty === 'function') markDirty();
  return count;
}

function applyProgramOwnerToAllDomains() {
  var email = (state.programOwnerEmail || '').trim();
  if (!isValidOwnerEmail(email)) {
    showToast('Add the program owner email in Step 1 first.', true);
    goToStep('ciso', 1);
    return;
  }
  var families = getActiveFamilies().filter(function(f) { return f !== 'PM'; });
  var merges = state.policyMerges || {};
  var masters = families.filter(function(f) { return !merges[f]; });
  ensureDefaultDeadlinesForMasters(masters);
  applyOwnerEmailToFamilies(masters, email, {
    name: (state.programOwner || '').trim(),
    role: (state.programOwnerTitle || '').trim() || getDefaultProgramOwnerTitle()
  });
  showToast('Program owner email assigned to all ' + masters.length + ' policy domains. Owners complete name and title on first sign-in.');
  renderActiveCisoSetupStep();
}

// --- Step 7: Assign Owners & Deadlines ---
function renderCISOStep4b() {
  const body = document.getElementById('ciso-step-7-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><div class="es-title">No Baseline Selected</div><p>Complete Step 2 first.</p></div>';
    return;
  }
  const families = getActiveFamilies().filter(f => f !== 'PM');
  const merges = state.policyMerges || {};
  const masters = families.filter(f => !merges[f]);

  const assigned = masters.filter(f => isValidOwnerEmail((state.domainOwners[f] || {}).email)).length;
  const pct = Math.round(assigned / masters.length * 100);

  const returnedFams = families.filter(f => (state.policyStatus[f]||{}).status === 'Returned');
  ensureDefaultDeadlinesForMasters(masters);

  var programOwnerEmail = (state.programOwnerEmail || '').trim();
  var canApplyOwner = isValidOwnerEmail(programOwnerEmail);

  body.innerHTML = `
    ${cisoStepProgressHtml(7, 'Assign owners')}
    <div class="section-title">Assign owners</div>
    <div class="section-subtitle">Add people by email only. They enter name and title on first sign-in.</div>

    <div class="owner-step-hero${pct === 100 ? ' owner-step-hero--complete' : ''}">
      <div class="owner-step-hero-top">
        <div>
          <div class="owner-step-hero-label">Program owner email</div>
          <div class="owner-step-hero-email">${canApplyOwner ? escapeHTML(programOwnerEmail) : '<span class="owner-step-hero-missing">Add email in Step 1</span>'}</div>
        </div>
        <div class="owner-step-hero-stat">
          <div class="owner-step-hero-stat-num">${assigned}<span>/${masters.length}</span></div>
          <div class="owner-step-hero-stat-label">domains assigned</div>
        </div>
      </div>
      <div class="owner-step-hero-bar" aria-hidden="true"><div class="owner-step-hero-bar-fill" style="width:${pct}%;"></div></div>
      <div class="owner-step-hero-actions">
        ${canApplyOwner
          ? '<button type="button" class="btn btn-primary" onclick="applyProgramOwnerToAllDomains()">Assign all domains</button>'
          : '<button type="button" class="btn btn-secondary" onclick="goToStep(\'ciso\',1)">Go to Step 1 — add email</button>'}
        ${state.cisoIsISSM && canApplyOwner ? '<p class="owner-step-hero-note">Program owner also owns domain policies — click when ready.</p>' : ''}
      </div>
    </div>
    ${returnedFams.length ? `
    <div class="owner-step-alert">
      <div class="owner-step-alert-head"><span>↩</span> Returned for reassignment (${returnedFams.length})</div>
      ${returnedFams.map(f => `
      <div class="owner-step-alert-row">
        <span class="family-badge owner-step-alert-badge">${f}</span>
        <div class="owner-step-alert-meta">
          <div class="owner-step-alert-title">${getPolicyMergedTitle(f)}</div>
          <div class="owner-step-alert-sub">Returned ${(state.policyStatus[f]||{}).returnedAt||''}</div>
        </div>
        <input class="form-input owner-step-alert-input" id="reassign-input-${f}" type="email" placeholder="new.owner@company.com" value="">
        <button type="button" class="btn btn-sm owner-step-alert-btn" onclick="reassignReturnedPolicy('${f}')">Reassign</button>
      </div>`).join('')}
    </div>` : ''}

    <div class="owner-step-list-head">
      <span>Domain roster</span>
      <span class="owner-step-list-hint">Override email or deadline per domain if needed</span>
    </div>
    <div class="owner-step-list">
      ${masters.map(fam => {
        const o = state.domainOwners[fam] || {};
        const merged = families.filter(f => merges[f] === fam);
        const isReturned = (state.policyStatus[fam]||{}).status === 'Returned';
        const tier = getPriority(fam);
        const pm = PRIORITY_META[tier];
        const deadline = deadlineFromPriority(fam);
        const isCustomDeadline = !!state.domainDeadlines[fam];
        const hasOwner = isValidOwnerEmail(o.email);
        const policyTitle = state.domainCustomNames[fam] || getPolicyMergedTitle(fam);
        return `
        <div class="owner-step-row${hasOwner ? ' owner-step-row--assigned' : ''}${isReturned ? ' owner-step-row--returned' : ''}">
          <div class="owner-step-row-main">
            <div class="owner-step-row-badges">
              <span class="family-badge">${fam}</span>
              <span class="owner-step-priority" style="background:${pm.bg};color:${pm.fg};">${pm.label}</span>
              ${merged.map(mf => '<span class="family-badge owner-step-merge">+' + mf + '</span>').join('')}
            </div>
            <div class="owner-step-row-title">${escapeHTML(policyTitle)}</div>
          </div>
          <div class="owner-step-row-fields">
            <input class="form-input owner-step-email${hasOwner ? ' owner-step-email--set' : ''}" type="email" placeholder="owner@company.com" value="${escapeHTML(o.email||'')}"
              oninput="setDomainOwner('${fam}','email',this.value);${merged.map(mf=>`setDomainOwner('${mf}','email',this.value);`).join('')}">
            <input type="date" class="owner-step-date${isCustomDeadline ? ' owner-step-date--custom' : ''}" value="${deadline}" onchange="setDomainDeadline('${fam}',this.value)" title="Draft deadline">
          </div>
          <div class="owner-step-row-status">${hasOwner ? '✓' : '—'}</div>
        </div>`;
      }).join('')}
    </div>

    <p class="owner-step-footnote">PM controls stay with the program owner. Draft deadlines come from your Step 6 priorities.</p>
  `;
  updateCISOFinishBtn();
}

function reassignReturnedPolicy(fam) {
  if (typeof openAssignDomainPolicyOwnerModal === 'function') {
    openAssignDomainPolicyOwnerModal(fam);
    return;
  }
  const input = document.getElementById('reassign-input-' + fam);
  const newEmail = (input ? input.value : '').trim();
  if (!isValidOwnerEmail(newEmail)) { showToast('Please enter a valid owner email.', true); return; }
  reassignReturnedPolicyByEmail(fam, newEmail);
  renderActiveCisoSetupStep();
}

/** Assign (or reassign) the policy owner for a returned domain — no wizard. */
function assignOwnerToReturnedDomainPolicy(fam, meta) {
  meta = meta || {};
  var name = (meta.name || '').trim();
  var email = (meta.email || '').trim();
  var role = (meta.role || '').trim() || (DOMAIN_SUGGESTED_ROLES[fam] || 'Security Manager');
  if (!isValidOwnerEmail(email)) {
    showToast('Enter a valid owner email.', true);
    return false;
  }
  if (!name) {
    showToast('Enter the policy owner name.', true);
    return false;
  }
  if (!state.domainOwners) state.domainOwners = {};
  if (!state.policyStatus) state.policyStatus = {};
  var merges = state.policyMerges || {};
  var families = getActiveFamilies().filter(function(f) { return f !== 'PM'; });
  var masterFam = merges[fam] || fam;
  var relatedFams = [masterFam].concat(families.filter(function(f) { return merges[f] === masterFam; }));
  var psMaster = state.policyStatus[masterFam] || {};
  var keepReturned = psMaster.status === 'Returned'
    && (psMaster.returnedForRevision || !psMaster.returnedForReassignment);
  var policyTitle = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(masterFam) : masterFam;

  relatedFams.forEach(function(targetFam) {
    state.domainOwners[targetFam] = { name: name, email: email, role: role };
    delete state.domainOwners[targetFam].isDemoPlaceholder;
    if (!state.policyStatus[targetFam]) state.policyStatus[targetFam] = {};
    if (keepReturned) {
      state.policyStatus[targetFam].status = 'Returned';
      state.policyStatus[targetFam].returnedForRevision = true;
      state.policyStatus[targetFam].submittedTo = name;
      state.policyStatus[targetFam].submittedToEmail = email;
      state.policyStatus[targetFam].submittedToRole = role;
    } else {
      state.policyStatus[targetFam].status = 'Not Started';
      delete state.policyStatus[targetFam].returnedAt;
      delete state.policyStatus[targetFam].returnedDate;
      delete state.policyStatus[targetFam].returnedBy;
      delete state.policyStatus[targetFam].returnedForReassignment;
      delete state.policyStatus[targetFam].returnedForRevision;
      delete state.policyStatus[targetFam].notes;
    }
    if (typeof autoPopulateControlOwnersFromDomain === 'function') {
      autoPopulateControlOwnersFromDomain(targetFam);
    }
  });
  if (typeof syncUsersFromState === 'function') syncUsersFromState();
  addAuditEntry('policy', masterFam, 'Assigned policy owner ' + name + ' (' + email + ') for returned ' + policyTitle + '.');
  markDirty();
  showToast('\u2705 Policy owner assigned \u2014 ' + name);
  return true;
}

function reassignReturnedPolicyByName(fam, newOwner) {
  var ownerName = String(newOwner || '').trim();
  if (!ownerName) {
    showToast('Please enter a new owner name.', true);
    return false;
  }
  return reassignReturnedPolicyByEmail(fam, ownerName.indexOf('@') > -1 ? ownerName : '');
}

function reassignReturnedPolicyByEmail(fam, newEmail) {
  var email = String(newEmail || '').trim();
  if (!isValidOwnerEmail(email)) {
    showToast('Please enter a valid owner email.', true);
    return false;
  }
  if (!state.domainOwners) state.domainOwners = {};
  if (!state.policyStatus) state.policyStatus = {};
  var merges = state.policyMerges || {};
  var families = getActiveFamilies().filter(function(f){ return f !== 'PM'; });
  var masterFam = merges[fam] || fam;
  var relatedFams = [masterFam].concat(families.filter(function(f){ return merges[f] === masterFam; }));
  var existingMaster = state.domainOwners[masterFam] || {};
  var reassigned = [];
  relatedFams.forEach(function(targetFam) {
    var prior = state.domainOwners[targetFam] || {};
    state.domainOwners[targetFam] = {
      email: email,
      name: (existingMaster.name || prior.name || '').trim(),
      role: (existingMaster.role || prior.role || DOMAIN_SUGGESTED_ROLES[targetFam] || '')
    };
    if (!state.policyStatus[targetFam]) state.policyStatus[targetFam] = {};
    state.policyStatus[targetFam].status = 'Not Started';
    delete state.policyStatus[targetFam].returnedAt;
    delete state.policyStatus[targetFam].returnedDate;
    delete state.policyStatus[targetFam].returnedBy;
    reassigned.push(targetFam);
  });
  addAuditEntry('policy', masterFam, 'Reassigned returned domain policy owner to ' + email + ' for ' + reassigned.join(', ') + '.');
  markDirty();
  showToast('✅ Reassigned ' + reassigned.join(', ') + ' to ' + email + '.');
  return true;
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
        if (masterOwner && (isValidOwnerEmail(masterOwner.email) || getOwnerDisplayName(masterOwner) !== '—')) {
          state.domainOwners[sf] = Object.assign({}, masterOwner);
        }
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
  const masterOwner = state.domainOwners[masterFam];
  if (masterOwner && (isValidOwnerEmail(masterOwner.email) || getOwnerDisplayName(masterOwner) !== '—')) {
    state.domainOwners[slaveFam] = Object.assign({}, masterOwner);
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
  if (field === 'name' || field === 'email') {
    updateCISOFinishBtn();
    autoPopulateControlOwnersFromDomain(fam);
  }
}

// When a domain owner is assigned, auto-fill all controls in that family
// with the domain owner as the default control owner (unless already assigned to someone else).
function autoPopulateControlOwnersFromDomain(fam) {
  var owner = state.domainOwners[fam];
  if (!owner) return;
  var displayName = getOwnerDisplayName(owner);
  if (displayName === '—' && !isValidOwnerEmail(owner.email)) return;
  if (!state.controlOwners) state.controlOwners = {};
  // Get all selected controls for this family (from policy wizard step 2)
  var selected = (state.policySelectedControls || {})[fam] || [];
  // If no controls selected yet, try the baseline controls for this family
  if (!selected.length) {
    selected = getActiveControls().filter(function(c) {
      return c.f === fam && !isPolicyAndProceduresControl(c.id);
    }).map(function(c) { return c.id; });
  }
  // Also handle merged families
  var merges = state.policyMerges || {};
  var slaveFams = getActiveFamilies().filter(function(f) { return merges[f] === fam; });
  slaveFams.forEach(function(sf) {
    var sfSelected = (state.policySelectedControls || {})[sf] || [];
    if (!sfSelected.length) {
      sfSelected = getActiveControls().filter(function(c) {
        return c.f === sf && !isPolicyAndProceduresControl(c.id);
      }).map(function(c) { return c.id; });
    }
    selected = selected.concat(sfSelected);
  });
  selected.forEach(function(cid) {
    if (!state.controlOwners[cid] || !hasRealControlOwner(state.controlOwners[cid])) {
      state.controlOwners[cid] = {
        name: displayName,
        role: owner.role || '',
        email: owner.email || '',
        dueDate: state.policyDeadlines[fam] || ''
      };
      if (owner.isDemoPlaceholder) state.controlOwners[cid].isDemoPlaceholder = true;
      else delete state.controlOwners[cid].isDemoPlaceholder;
    }
    if (typeof markControlPlannedIfAssigned === 'function') markControlPlannedIfAssigned(cid);
  });
}

function prefillDemoOwners() {
  if (state.cisoComplete) {
    showToast('Cannot inject demo owners after program setup is finalized.', true);
    return;
  }
  if (!confirm('This will populate domain owners with synthetic identities ("Alex Rivera", etc.) for demonstration only. Any record marked as a demo placeholder will be blocked from finalize/submit until you replace it with a real person. Continue?')) return;
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
  if (!confirm('This will populate ' + title + ' control owners with synthetic identities for demo only. Demo placeholder records will be blocked from policy submit until you replace them with real people. Continue?')) return;
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

  // Ensure each person exists in state.users so they can log in. Tag demo
  // identities so the role picker can refuse to impersonate them — non-repudiation
  // shortcut: real attestations must come from real people.
  FAKE_CO_ROSTER.forEach(function(p) {
    const existing = state.users.find(function(u) { return u.name === p.name; });
    if (!existing) {
      state.users.push({
        id: 'u_co_' + p.name.replace(/\s+/g,'_').toLowerCase(),
        name: p.name, role: p.role, note: p.note, email: p.email,
        families: [], controls: [], isDemoPlaceholder: true
      });
    } else if (!existing.isDemoPlaceholder) {
      // Pre-existing user with the same name — leave them alone.
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
