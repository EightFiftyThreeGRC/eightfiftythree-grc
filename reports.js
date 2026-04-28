// js/reports.js — dashboard, reports tab, CISO/ISP modals, audit & review queue. Split from app.js (Step 7).
// Globals only; load after testing.js.

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

/** Open the org-level ISP in a read-only overlay. Works from any tab / any role. */
function viewISPModal() {
  var isp = state.infoSecPolicy;
  var ispTitle = ((isp && isp.title) ? String(isp.title).trim() : '') || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
  var existingOverlay = document.getElementById('ispViewOverlay');
  if (existingOverlay) existingOverlay.remove();

  var overlay = document.createElement('div');
  overlay.id = 'ispViewOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 20px;';

  var bodyHTML = '';
  if (!isp || !isp.title) {
    bodyHTML = '<div style="font-size:13px;color:var(--text-muted);font-style:italic;padding:24px 28px;">The ' + escapeHTML(ispTitle) + ' has not been finalized yet.</div>';
  } else {
    // Sections
    var hasSections = false;
    var sectionsHTML = '';
    (isp.sections||[]).forEach(function(sec) {
      var content = '';
      if (sec.type === 'purpose')    content = isp.purpose||sec.content||'';
      else if (sec.type === 'scope')      content = isp.scope||sec.content||'';
      else if (sec.type === 'policy')     content = isp.policy||sec.content||'';
      else if (sec.type === 'compliance') content = isp.compliance||sec.content||'';
      else content = sec.content||'';
      if (!content) return;
      hasSections = true;
      sectionsHTML += '<div style="margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">' + escapeHTML(sec.title||sec.type) + '</div>'
        + '<div style="font-size:13px;color:var(--navy);line-height:1.7;white-space:pre-wrap;">' + escapeHTML(content) + '</div>'
        + '</div>';
    });
    if (!hasSections) {
      [['Purpose', isp.purpose||''], ['Scope', isp.scope||''], ['Policy Statement', isp.policy||''], ['Compliance', isp.compliance||'']].forEach(function(pair) {
        if (!pair[1]) return;
        hasSections = true;
        sectionsHTML += '<div style="margin-bottom:20px;">'
          + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">' + pair[0] + '</div>'
          + '<div style="font-size:13px;color:var(--navy);line-height:1.7;white-space:pre-wrap;">' + escapeHTML(pair[1]) + '</div>'
          + '</div>';
      });
    }
    if (!hasSections) {
      sectionsHTML = '<div style="font-size:13px;color:var(--text-muted);font-style:italic;">No content has been added to this policy yet.</div>';
    }
    // Roles & responsibilities
    var rolesHTML = '';
    if ((isp.roles||[]).length) {
      rolesHTML += '<div style="margin-top:8px;margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Roles & Responsibilities</div>';
      (isp.roles||[]).forEach(function(r) {
        if (!r.name) return;
        rolesHTML += '<div style="border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:8px;">'
          + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:4px;">' + escapeHTML(r.name) + '</div>'
          + '<ul style="margin:4px 0 0 16px;padding:0;font-size:13px;color:#374151;line-height:1.6;">'
          + (r.responsibilities||[]).map(function(res){ return '<li>' + escapeHTML(res) + '</li>'; }).join('')
          + '</ul></div>';
      });
      rolesHTML += '</div>';
    }
    var requirementsHTML = '';
    if ((isp.requirements || []).length) {
      requirementsHTML = '<div style="margin-top:8px;margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Policy Requirements</div>'
        + (isp.requirements || []).map(function(r) {
          var reqText = stripRequirementNistRef((r && (r.text || r.requirement)) || '');
          return '<div style="border-left:3px solid var(--teal);padding:10px 12px;background:#f8fafc;border-radius:0 6px 6px 0;margin-bottom:8px;">'
            + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:4px;">' + escapeHTML((r && r.id) || '') + '</div>'
            + '<div style="font-size:13px;color:#374151;line-height:1.6;white-space:pre-wrap;">' + escapeHTML(reqText || '') + '</div>'
            + '</div>';
        }).join('')
        + '</div>';
    }
    var documentsHTML = '';
    if ((isp.documents || []).length) {
      documentsHTML = '<div style="margin-top:8px;margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Referenced Documents</div>'
        + (isp.documents || []).map(function(d) {
          if (!d || !d.title) return '';
          return '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">'
            + '<span style="font-size:13px;color:var(--teal);">🔗</span>'
            + '<div><div style="font-size:13px;font-weight:700;color:var(--navy);">' + escapeHTML(d.title) + '</div>'
            + (d.desc ? '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">' + escapeHTML(d.desc) + '</div>' : '')
            + (d.url ? '<div style="font-size:12px;margin-top:2px;"><a href="' + escapeHTML(d.url) + '" target="_blank" style="color:var(--teal);text-decoration:none;">' + escapeHTML(d.url) + '</a></div>' : '')
            + '</div></div>';
        }).join('')
        + '</div>';
    }
    var revisionHTML = '';
    if ((isp.revisionHistory || []).length) {
      revisionHTML = '<div style="margin-top:8px;margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Revision History</div>'
        + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        + '<thead><tr style="border-bottom:2px solid var(--border);"><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Version</th><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Date</th><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Author</th><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Changes</th></tr></thead><tbody>'
        + (isp.revisionHistory || []).slice().reverse().map(function(r) {
          return '<tr style="border-bottom:1px solid var(--border);">'
            + '<td style="padding:6px 8px;font-family:monospace;font-weight:700;color:var(--teal);">v' + escapeHTML((r && r.version) || '') + '</td>'
            + '<td style="padding:6px 8px;color:var(--text-muted);">' + escapeHTML((r && r.date) || '') + '</td>'
            + '<td style="padding:6px 8px;">' + escapeHTML((r && r.author) || '') + '</td>'
            + '<td style="padding:6px 8px;color:#374151;">' + escapeHTML((r && r.changes) || '') + '</td>'
            + '</tr>';
        }).join('')
        + '</tbody></table></div>';
    }
    var status = (state.policyStatus || {}).ISP || {};
    var reviewLogRows = [];
    if (status.submittedAt || status.submittedTo) reviewLogRows.push({ e:'Submitted for approval', d: status.submittedAt || '', a: state.programOwner || 'Program Owner', n: '' });
    if (status.status === 'Approved') reviewLogRows.push({ e:'Approved', d: status.approvedDate || '', a: status.approvedBy || 'Approver', n: status.notes || '' });
    if (status.status === 'Returned') reviewLogRows.push({ e:'Returned for revision', d: status.returnedDate || '', a: status.returnedBy || status.submittedTo || 'Approver', n: status.notes || '' });
    var reviewLogHTML = '<div style="margin-top:8px;">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Review & Approval Log</div>'
      + (reviewLogRows.length
        ? '<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="border-bottom:2px solid var(--border);"><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Event</th><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Date</th><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">By</th><th style="text-align:left;padding:5px 8px;color:var(--text-muted);font-size:10px;text-transform:uppercase;">Notes</th></tr></thead><tbody>'
          + reviewLogRows.map(function(r) {
            return '<tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 8px;font-weight:600;color:var(--navy);">' + escapeHTML(r.e) + '</td><td style="padding:6px 8px;color:var(--text-muted);">' + escapeHTML(r.d || '—') + '</td><td style="padding:6px 8px;">' + escapeHTML(r.a || '—') + '</td><td style="padding:6px 8px;color:#374151;">' + escapeHTML(r.n || '—') + '</td></tr>';
          }).join('')
          + '</tbody></table>'
        : '<div style="font-size:12px;color:var(--text-muted);font-style:italic;">No review/approval activity has been recorded yet.</div>')
      + '</div>';
    bodyHTML = '<div style="padding:24px 28px;max-height:60vh;overflow-y:auto;">' + sectionsHTML + rolesHTML + requirementsHTML + documentsHTML + revisionHTML + reviewLogHTML + '</div>';
  }

  var rc = (state.policyStatus||{}).ISP || {};
  var statusLabel = rc.status || 'Draft';
  var statusColor = statusLabel === 'Approved' ? '#0d9488' : statusLabel === 'Under Review' ? '#6366f1' : '#6b7280';

  overlay.innerHTML = '<div style="background:white;border-radius:16px;width:820px;max-width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.2);overflow:hidden;">'
    + '<div style="background:var(--navy);padding:20px 28px;display:flex;align-items:center;justify-content:space-between;">'
    + '<div><div style="font-size:20px;font-weight:800;color:white;">' + escapeHTML(ispTitle) + '</div>'
    + '<div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Tier 1 · Owned by ' + escapeHTML(state.programOwner||'CISO') + '</div></div>'
    + '<div style="display:flex;align-items:center;gap:12px;">'
    + '<span style="font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.15);color:white;">' + escapeHTML(statusLabel) + '</span>'
    + '<button onclick="document.getElementById(\'ispViewOverlay\').remove()" style="background:rgba(255,255,255,0.12);border:none;color:white;font-size:18px;cursor:pointer;border-radius:8px;padding:6px 12px;line-height:1;">✕</button>'
    + '</div></div>'
    + bodyHTML
    + '</div>';

  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
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
    // Route back to the current domain owner so this never gets stranded in an old approver queue.
    submittedTo: ((state.domainOwners || {})[fam] || {}).name || prevR.submittedTo || '',
    submittedToRole: ((state.domainOwners || {})[fam] || {}).role || prevR.submittedToRole || '',
    submittedToEmail: ((state.domainOwners || {})[fam] || {}).email || prevR.submittedToEmail || ''
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
  const polInReview = policyFams.filter(function(f) {
    var ps = (state.policyStatus[f] || {});
    if (ps.status === 'Under Review') return true;
    if (ps.status !== 'Returned') return false;
    // Returned items explicitly routed back to CISO/program owner should show in CISO queue for reassignment.
    var routedTo = String(ps.submittedTo || '').trim().toLowerCase();
    var cisoName = String(state.programOwner || '').trim().toLowerCase();
    return !routedTo || (cisoName && routedTo === cisoName);
  });
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
    const p = state.policyStatus[fam] || {};
    const title = getPolicyMergedTitle(fam);
    const allFams = getPolicyAllFamilies(fam);
    const badges = allFams.map(f => '<span class="family-badge" style="font-size:10px;padding:1px 5px;">' + f + '</span>').join(' ');
    const isReturnedToCiso = p.status === 'Returned';
    const returnNotes = isReturnedToCiso ? String(p.notes || '').trim() : '';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border);">'
      + '<div style="display:flex;gap:10px;align-items:center;">'
      + '<span style="font-size:16px;flex-shrink:0;">📄</span>'
      + '<div><div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' + badges + '</div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--navy);">' + escapeHTML(title) + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Submitted by ' + escapeHTML(o.name||fam) + '</div>'
      + (isReturnedToCiso
          ? '<div style="font-size:11px;color:#b45309;margin-top:4px;font-weight:700;">Returned for reassignment by domain owner</div>'
            + (returnNotes ? '<div style="font-size:11px;color:#9a3412;margin-top:4px;line-height:1.4;"><strong>Notes:</strong> ' + escapeHTML(returnNotes) + '</div>' : '')
          : '<div style="font-size:11px;color:#6366f1;margin-top:4px;font-weight:600;">With: ' + escapeHTML(getPolicyPendingReviewerDisplay(fam)) + '</div>')
      + '</div>'
      + '</div>'
      + (isReturnedToCiso
          ? '<button class="btn btn-secondary btn-sm" onclick="openReturnedPolicyReassignment(\'' + fam + '\')">Reassign →</button>'
          : '<button class="btn btn-secondary btn-sm" onclick="openCISOReview(\'' + fam + '\')">Review →</button>')
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
    ${state._reportsPhase1BannerHidden ? '' : `
    <div style="border:1px solid #86efac;border-radius:10px;background:linear-gradient(135deg,#f0fdf4,#e8fdf3);overflow:hidden;margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 16px;border-bottom:1px solid #86efac;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="background:#166534;color:white;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:0.6px;white-space:nowrap;">PHASE 1 · COMPLETE</span>
          <span style="font-size:13px;font-weight:700;color:#166534;">Establish Program Governance</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;color:#166534;opacity:0.75;">✓ All steps complete</span>
          <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 10px;" onclick="setReportsPhase1BannerHidden(true)">Hide</button>
        </div>
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
    </div>`}

    ${deselectBaselineDash ? '<div class="callout-deselected-baseline" style="border:1px solid #f59e0b;background:#fffbeb;border-radius:10px;padding:12px 18px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.5;"><strong>Baseline scope note:</strong> ' + deselectBaselineDash + ' control(s) are formally <em>de-selected</em> from the active baseline. They remain in the catalog for audit traceability — open the Control Library and filter <strong>De-selected (baseline)</strong> to review them.</div>' : ''}

    ${typeof renderBaselineElevationReportsSummaryHtml === 'function' ? renderBaselineElevationReportsSummaryHtml() : ''}
    ${typeof renderBaselineElevationCisoCardsHtml === 'function' ? renderBaselineElevationCisoCardsHtml() : ''}

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

    <!-- ── Divider before detailed reporting ── -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
      <div style="flex:1;height:1px;background:var(--border);"></div>
      <div style="font-size:10px;font-weight:800;letter-spacing:1.2px;color:var(--text-muted);text-transform:uppercase;">Detailed Reporting</div>
      <div style="flex:1;height:1px;background:var(--border);"></div>
    </div>
  `;
}

function openReturnedPolicyReassignment(fam) {
  var user = state.currentUserId ? (state.users || []).find(function(u){ return u.id === state.currentUserId; }) : null;
  var canReassign = !user || user.role === 'ciso' || user.role === 'admin';
  if (!canReassign) {
    showToast('Switch to CISO/Admin mode to reassign returned policies.', true);
    if (typeof showRolePicker === 'function') showRolePicker();
    return;
  }
  var hintOwner = ((state.domainOwners || {})[fam] || {}).name || '';
  var promptMsg = 'Reassign owner for ' + fam + ' policy' + (hintOwner ? ' (current: ' + hintOwner + ')' : '') + ':\nEnter full name';
  var nextOwner = window.prompt(promptMsg, hintOwner);
  if (nextOwner == null) return;
  nextOwner = String(nextOwner || '').trim();
  if (!nextOwner) {
    showToast('Please enter a new owner name.', true);
    return;
  }
  if (typeof reassignReturnedPolicyByName === 'function') {
    var ok = reassignReturnedPolicyByName(fam, nextOwner);
    if (ok) renderReports();
    return;
  }
  showToast('Reassignment helper is unavailable. Open Program Setup Step 5 to reassign.', true);
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
// Callout when reviewer returned an SSP/SPSP (signoff.aoReturnedAt + not Submitted/Approved).
function renderAssetOwnerSspReturnedCallout(user, sspLabel) {
  if (typeof signoffIsReturnedForRevision !== 'function') return '';
  var myAssetIds = (user.assets || []).map(String);
  var uname = (user.name || '').trim().toLowerCase();
  var rows = [];
  (state.assets || []).forEach(function(a) {
    if (!myAssetIds.includes(String(a.id))) return;
    var sig = (state.sspSignoffs || {})[a.id] || {};
    if (!signoffIsReturnedForRevision(sig)) return;
    rows.push({ name: a.name || 'Unnamed', isProcess: false, sidJson: JSON.stringify(String(a.id)), sig: sig });
  });
  (state.processes || []).forEach(function(p) {
    var mine = myAssetIds.includes(String(p.id)) || (p.owner || '').trim().toLowerCase() === uname;
    if (!mine) return;
    var sig = (state.sspSignoffs || {})[p.id] || {};
    if (!signoffIsReturnedForRevision(sig)) return;
    rows.push({ name: p.name || 'Unnamed', isProcess: true, sidJson: JSON.stringify(String(p.id)), sig: sig });
  });
  if (!rows.length) return '';
  var body = rows.map(function(r) {
    var notes = String(r.sig.aoReturnNotes || '').trim();
    var by = _esc(String(r.sig.aoReturnedBy || '').trim() || 'Reviewer');
    var on = _esc(r.sig.aoReturnedAt || '');
    var openFn = r.isProcess ? 'openProcessSspFromLibrary' : 'openAssetWizardFromLibrary';
    return '<div style="border-bottom:1px solid rgba(0,0,0,0.06);padding:12px 0;">'
      + '<div style="font-weight:700;color:var(--navy);">' + _esc(r.name) + ' <span style="font-size:11px;font-weight:600;color:#c2410c;text-transform:uppercase;">' + (r.isProcess ? 'Process' : 'Asset') + ' · returned</span></div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Returned by ' + by + (on ? ' · ' + on : '') + '</div>'
      + '<div style="margin-top:8px;padding:10px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#78350f;line-height:1.45;"><strong>Reviewer notes</strong> — '
      + (notes ? _esc(notes) : '<span style="font-style:italic;color:var(--text-muted);">None provided.</span>') + '</div>'
      + '<button type="button" class="btn btn-primary btn-sm" style="margin-top:10px;font-size:11px;" onclick=\'' + openFn + '(' + r.sidJson + ')\'>Open ' + _esc(sspLabel) + ' to revise →</button>'
      + '</div>';
  }).join('');
  return '<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fcd34d;border-radius:12px;padding:18px 20px;margin-bottom:20px;max-width:920px;">'
    + '<div style="font-size:14px;font-weight:800;color:#92400e;margin-bottom:4px;">' + _esc(sspLabel) + ' returned for your revision</div>'
    + '<div style="font-size:12px;color:#b45309;margin-bottom:12px;line-height:1.45;">Your reviewer sent these packages back. Address the notes, then sign and submit again from Step 4.</div>'
    + body
    + '</div>';
}

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
    var signRaw  = (state.sspSignoffs    || {})[a.id]  || {};
    var done     = controls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    var pct      = controls.length ? Math.round(done / controls.length * 100) : 0;
    var isRet    = typeof signoffIsReturnedForRevision === 'function' && signoffIsReturnedForRevision(signRaw);
    var status   = signRaw.status === 'Approved'  ? 'Approved'
                 : signRaw.status === 'Submitted' ? 'Submitted'
                 : isRet ? 'Returned for revision'
                 : done > 0 ? 'In Progress' : 'Not Started';
    var col      = status === 'Approved'  ? 'var(--green)'
                 : signRaw.status === 'Submitted' ? 'var(--blue)'
                 : isRet ? '#c2410c'
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

  html += renderAssetOwnerSspReturnedCallout(user, sspLabel);

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
  var title = ((state.infoSecPolicy && state.infoSecPolicy.title) ? String(state.infoSecPolicy.title).trim() : '') || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
  return '<div style="margin-bottom:20px;border:1px solid rgba(99,102,241,0.35);background:rgba(99,102,241,0.06);border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">'
    + '<div><div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;">Action required</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--navy);margin-top:4px;">' + escapeHTML(title) + ' is awaiting your approval</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + escapeHTML(title)
    + (p.submittedAt ? ' · Routed for review on ' + escapeHTML(p.submittedAt) : '') + '</div></div>'
    + '<button type="button" class="btn btn-primary btn-sm" onclick="showTab(\'policy\');goToCISOPolicyEditor();">Review & approve →</button>'
    + '</div>';
}

function renderProgramReadinessPanelHtml() {
  return '';
}

function setReportsProgramReadinessHidden(hidden) {
  state._reportsProgramReadinessHidden = !!hidden;
  markDirty();
  renderReports();
}

function setReportsMySummaryHidden(hidden) {
  state._reportsMySummaryHidden = !!hidden;
  markDirty();
  renderReports();
}

function setReportsPhase1BannerHidden(hidden) {
  state._reportsPhase1BannerHidden = !!hidden;
  markDirty();
  renderReports();
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

  // Pending review count (ISSM/CISO: control queue; AO: SSP packages assigned to this reviewer)
  var pendingReview = 0;
  if (user.role === 'ao') {
    pendingReview = (state.controlReviewQueue||[]).filter(function(r) { return sspQueueRowMatchesAo(r, user); }).length;
  } else if (user.role === 'issm' || user.role === 'ciso') {
    pendingReview = (state.controlReviewQueue||[]).filter(function(r) {
      if (r.type === 'ssp') return false;
      if (user.role !== 'issm') return true;
      var fam = (r.controlId||'').replace(/-.*/, '');
      return (user.families||[]).includes(fam);
    }).length;
  }

  if (state._reportsMySummaryHidden) return '';

  return '<div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #93c5fd;border-radius:12px;padding:20px;margin-bottom:20px;">'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:16px;">'
    + '<div style="display:flex;align-items:center;gap:12px;">'
    + '<span style="font-size:24px;">' + (roleMeta.icon||'\uD83D\uDC64') + '</span>'
    + '<div><div style="font-size:16px;font-weight:800;color:#1e3a5f;">' + escapeHTML(user.name) + '</div>'
    + '<div style="font-size:12px;color:#2563eb;">' + escapeHTML(roleMeta.label||user.role) + (myFamilies.length ? ' \u2014 ' + myFamilies.join(', ') : '') + '</div></div></div>'
    + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 10px;" onclick="setReportsMySummaryHidden(true)">Hide</button>'
    + '</div>'
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
  var approvedTitle = ((state.infoSecPolicy && state.infoSecPolicy.title) ? String(state.infoSecPolicy.title).trim() : '') || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
  showToast('\u2705 ' + approvedTitle + ' approved.');
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
    // Always route returned ISP work back to the CISO/program owner editor queue.
    submittedTo: (state.programOwner || '').trim() || prev.submittedTo || '',
    submittedToRole: (state.programOwnerTitle || '').trim() || prev.submittedToRole || '',
    submittedToEmail: (state.programOwnerEmail || '').trim() || prev.submittedToEmail || ''
  };
  try { addAuditEntry('policy', 'ISP', 'ISP returned with comments: ' + notes); } catch(e) {}
  markDirty();
  showToast('\u21A9 ISP returned to editor with comments.');
  goToCISOPolicyEditor();
}

function renderReturnedWorkCallout(user) {
  var cards = [];
  var ispStatus = ((state.policyStatus || {}).ISP || {}).status || '';
  var isCisoViewer = !user || user.role === 'ciso' || (user && state.programOwner && String(user.name || '').trim().toLowerCase() === String(state.programOwner || '').trim().toLowerCase());
  if (ispStatus === 'Returned' && isCisoViewer) {
    cards.push(
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(220,38,38,0.25);border-radius:10px;padding:12px 14px;">'
      + '<div><div style="font-size:13px;font-weight:700;color:#991b1b;">ISP returned for revision</div>'
      + '<div style="font-size:12px;color:#7f1d1d;">' + escapeHTML((((state.infoSecPolicy || {}).title || '').trim()) || 'Information Security Policy') + ' is back in your queue.</div></div>'
      + '<button class="btn btn-secondary btn-sm" onclick="showTab(\'ciso\');goToStep(\'ciso\',3);">Open ISP editor</button>'
      + '</div>'
    );
  }

  if (user && user.families && user.families.length && (user.role === 'issm' || user.role === 'custodian')) {
    var returnedFams = user.families.filter(function(f) {
      return ((state.policyStatus || {})[f] || {}).status === 'Returned';
    });
    if (returnedFams.length) {
      cards.push(
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:12px 14px;">'
        + '<div><div style="font-size:13px;font-weight:700;color:#92400e;">Domain policies returned</div>'
        + '<div style="font-size:12px;color:#78350f;">' + returnedFams.length + ' assigned polic' + (returnedFams.length === 1 ? 'y is' : 'ies are') + ' waiting for your revision.</div></div>'
        + '<button class="btn btn-secondary btn-sm" onclick="goToPoliciesHome()">Open domain policies</button>'
        + '</div>'
      );
    }
  }

  if (user && user.role === 'control-owner') {
    var evidenceReq = (state.controlReviewQueue || []).filter(function(r) {
      if (!r || !r.controlId || r.status !== 'Evidence Requested') return false;
      var owner = (state.controlOwners || {})[r.controlId] || {};
      var nm = String(user.name || '').trim().toLowerCase();
      return (String(r.submittedBy || '').trim().toLowerCase() === nm) || (String(owner.name || '').trim().toLowerCase() === nm);
    });
    if (evidenceReq.length) {
      cards.push(
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(2,132,199,0.28);border-radius:10px;padding:12px 14px;">'
        + '<div><div style="font-size:13px;font-weight:700;color:#0c4a6e;">Evidence requested on controls</div>'
        + '<div style="font-size:12px;color:#155e75;">' + evidenceReq.length + ' control submission' + (evidenceReq.length === 1 ? '' : 's') + ' need updated evidence.</div></div>'
        + '<button class="btn btn-secondary btn-sm" onclick="showTab(\'control\');goToStep(\'control\',4);">Open control submissions</button>'
        + '</div>'
      );
    }
  }

  if (!cards.length) return '';
  return '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:14px 16px;margin-bottom:18px;">'
    + '<div style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:10px;">Action required</div>'
    + cards.join('<div style="height:8px;"></div>')
    + '</div>';
}

// ── AO: SSP / Process SSP approval queue (controlReviewQueue type 'ssp') ─────
function sspQueueRowMatchesAo(r, user) {
  if (!r || r.type !== 'ssp' || !user) return false;
  var st = String(r.status || 'Pending');
  if (st !== 'Pending' && st !== '') return false;
  if (String(r.reviewerUserId || '') === String(user.id || '')) return true;
  if (String(r.reviewerRole || '').toLowerCase() === 'ao' && (r.reviewerName || '').trim() && (user.name || '').trim()) {
    if (String(r.reviewerName).trim().toLowerCase() === String(user.name).trim().toLowerCase()) return true;
  }
  return false;
}

function aoOpenQueuedSsp(scopeId, isProcess) {
  // Read-only package view for reviewers (not the asset-owner editable wizard).
  if (typeof openSspReadOnlyFromQueue === 'function') openSspReadOnlyFromQueue(scopeId, isProcess, 'reports');
}

function aoRemoveSspQueueRow(scopeId, isProcess) {
  var sid = String(scopeId);
  state.controlReviewQueue = (state.controlReviewQueue || []).filter(function(r) {
    if (!r || r.type !== 'ssp') return true;
    if (String(r.assetId) !== sid) return true;
    if (!!r.isProcessSsp !== !!isProcess) return true;
    return false;
  });
}

function aoApproveQueuedSsp(scopeId, isProcess) {
  var sid = String(scopeId);
  var u = state.currentUserId ? (state.users || []).find(function(x) { return x.id === state.currentUserId; }) : null;
  var label = isProcess ? 'Process SSP' : (state.privacyOverlay ? 'SPSP' : 'SSP');
  if (!confirm('Approve this ' + label + ' for authorization?')) return;
  if (!state.sspSignoffs) state.sspSignoffs = {};
  var prev = state.sspSignoffs[sid] || {};
  state.sspSignoffs[sid] = Object.assign({}, prev, {
    status: 'Approved',
    approvedBy: u ? u.name : 'AO',
    approvedDate: new Date().toISOString().slice(0, 10)
  });
  aoRemoveSspQueueRow(sid, isProcess);
  try {
    addAuditEntry(isProcess ? 'process' : 'asset', sid, label + ' approved by AO (' + (u ? u.name : 'AO') + ')');
  } catch (e) {}
  markDirty();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  showToast('\u2705 ' + label + ' approved.');
  renderReports();
}

function aoReturnQueuedSsp(scopeId, isProcess) {
  var sid = String(scopeId);
  var label = isProcess ? 'Process SSP' : (state.privacyOverlay ? 'SPSP' : 'SSP');
  var notes = '';
  try {
    notes = window.prompt('Optional notes to the owner (e.g. what to fix before resubmitting):', '') || '';
  } catch (e) {}
  var u = state.currentUserId ? (state.users || []).find(function(x) { return x.id === state.currentUserId; }) : null;
  var returnedBy = u ? (u.name || '').trim() : '';
  if (!state.sspSignoffs) state.sspSignoffs = {};
  var prev = state.sspSignoffs[sid] || {};
  var next = Object.assign({}, prev);
  delete next.status;
  delete next.signedBy;
  delete next.signedDate;
  next.aoReturnNotes = notes.trim();
  next.aoReturnedAt = new Date().toISOString().slice(0, 10);
  next.aoReturnedBy = returnedBy || (isProcess ? 'Process SSP reviewer' : 'SSP reviewer');
  state.sspSignoffs[sid] = next;
  aoRemoveSspQueueRow(sid, isProcess);
  try {
    addAuditEntry(isProcess ? 'process' : 'asset', sid, label + ' returned to owner by AO' + (notes.trim() ? ': ' + notes.trim() : ''));
  } catch (e) {}
  markDirty();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  showToast(label + ' returned to the owner for revision.');
  renderReports();
}

function renderAoSspApprovalQueueHtml(user) {
  if (!user || user.role !== 'ao') return '';
  var items = (state.controlReviewQueue || []).filter(function(r) { return sspQueueRowMatchesAo(r, user); });
  var sspLabel = state.privacyOverlay ? 'SPSP' : 'SSP';
  if (!items.length) {
    return '<div style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border:1px solid #c4b5fd;border-radius:12px;padding:18px 20px;margin-bottom:20px;max-width:920px;">'
      + '<div style="font-size:13px;font-weight:800;color:#5b21b6;margin-bottom:6px;">ATO / ' + sspLabel + ' approval queue</div>'
      + '<div style="font-size:12px;color:#6b21a8;line-height:1.55;">No packages are waiting on you as the designated reviewer. When an owner submits a ' + sspLabel + ' and selects you as reviewer, it appears here.</div></div>';
  }
  var rows = items.map(function(r) {
    var isProc = !!r.isProcessSsp;
    if (!isProc) {
      var sid = String(r.assetId);
      var hasAsset = (state.assets || []).some(function(a) { return String(a.id) === sid; });
      var hasProc = (state.processes || []).some(function(p) { return String(p.id) === sid; });
      if (hasProc && !hasAsset) isProc = true;
    }
    var sidJson = JSON.stringify(String(r.assetId));
    var name = escapeHTML(r.assetName || 'Package');
    var by = escapeHTML(r.submittedBy || '\u2014');
    var dt = escapeHTML(r.date || '');
    var rev = escapeHTML((r.reviewerName || '').trim() || '\u2014');
    return '<tr style="border-bottom:1px solid rgba(0,0,0,0.06);">'
      + '<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#6d28d9;">' + (isProc ? 'Process' : 'Asset') + '</td>'
      + '<td style="padding:10px 12px;font-size:13px;font-weight:700;color:var(--navy);">' + name + '</td>'
      + '<td style="padding:10px 12px;font-size:12px;color:#475569;">' + by + '</td>'
      + '<td style="padding:10px 12px;font-size:12px;color:var(--text-muted);">' + dt + '</td>'
      + '<td style="padding:10px 12px;font-size:12px;color:var(--text-muted);">' + rev + '</td>'
      + '<td style="padding:10px 12px;text-align:right;white-space:nowrap;">'
      + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;margin-right:6px;" onclick=\'aoOpenQueuedSsp(' + sidJson + ',' + (isProc ? 'true' : 'false') + ')\'>Open</button>'
      + '<button type="button" class="btn btn-sm" style="font-size:11px;margin-right:6px;background:#16a34a;color:white;border:none;" onclick=\'aoApproveQueuedSsp(' + sidJson + ',' + (isProc ? 'true' : 'false') + ')\'>Approve</button>'
      + '<button type="button" class="btn btn-sm" style="font-size:11px;background:#f59e0b;color:white;border:none;" onclick=\'aoReturnQueuedSsp(' + sidJson + ',' + (isProc ? 'true' : 'false') + ')\'>Return</button>'
      + '</td></tr>';
  }).join('');
  return '<div style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border:1px solid #c4b5fd;border-radius:12px;padding:18px 20px;margin-bottom:20px;max-width:100%;">'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">'
    + '<div><div style="font-size:14px;font-weight:800;color:#5b21b6;">ATO / ' + sspLabel + ' approval queue</div>'
    + '<div style="font-size:12px;color:#6b21a8;margin-top:4px;line-height:1.45;">Packages submitted for your review as designated ' + sspLabel + ' reviewer.</div></div>'
    + '<span style="font-size:12px;font-weight:700;background:white;border:1px solid #c4b5fd;border-radius:20px;padding:4px 12px;color:#5b21b6;">' + items.length + ' pending</span></div>'
    + '<div class="table-scroll"><table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e9d5ff;">'
    + '<thead><tr style="background:#f5f3ff;">'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b21b6;">Type</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b21b6;">System / process</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b21b6;">Signed by</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b21b6;">Submitted</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b21b6;">Reviewer</th>'
    + '<th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:#6b21b6;">Actions</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
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
      + '<div style="font-size:13px;color:var(--text-muted);">The CISO has not yet submitted the ' + escapeHTML((typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy')) + ' for review.</div>'
      + '</div>';
  } else {
    html += '<div style="background:white;border:1px solid ' + (ispSt==='Under Review'?'rgba(99,102,241,0.3)':'var(--border)') + ';border-radius:10px;padding:20px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
      + '<div><span style="font-family:monospace;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:4px;margin-right:8px;">ISP</span>'
      + '<span style="font-size:15px;font-weight:700;color:var(--navy);">' + escapeHTML((isp.title || '').trim() || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy')) + '</span></div>'
      + stChip
      + '</div>';

    if (rc.submittedDate || submittedBy) {
      html += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Submitted by ' + escapeHTML(state.programOwner||'CISO') + (rc.submittedDate ? ' on ' + rc.submittedDate : '') + '</div>';
    }

    html += '<button class="btn btn-secondary btn-sm" style="margin-bottom:16px;" onclick="showTab(\'policy\');goToCISOPolicyEditor();">📋 View Full Policy →</button>';

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
  var printBtn = document.getElementById('reportsPrintBtn');
  if (printBtn) printBtn.style.display = (user && user.role === 'approver') ? 'none' : '';
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
  var readinessRestore = state._reportsProgramReadinessHidden
    ? '<div style="margin-bottom:12px;max-width:920px;"><button type="button" class="btn btn-secondary btn-sm" onclick="setReportsProgramReadinessHidden(false)">Show Program Readiness</button></div>'
    : '';
  var mySummaryRestore = state._reportsMySummaryHidden
    ? '<div style="margin-bottom:12px;max-width:920px;"><button type="button" class="btn btn-secondary btn-sm" onclick="setReportsMySummaryHidden(false)">Show My Summary</button></div>'
    : '';
  var phase1Restore = state._reportsPhase1BannerHidden
    ? '<div style="margin-bottom:12px;max-width:920px;"><button type="button" class="btn btn-secondary btn-sm" onclick="setReportsPhase1BannerHidden(false)">Show Phase 1 Banner</button></div>'
    : '';
  body.innerHTML = `
    ${postSetupCallout}
    ${readinessRestore}
    ${mySummaryRestore}
    ${phase1Restore}
    ${renderProgramReadinessPanelHtml()}
    ${typeof renderAuthorizationStatusPanelHtml === 'function' ? renderAuthorizationStatusPanelHtml() : ''}
    ${renderReturnedWorkCallout(user)}
    ${user && user.role === 'ao' ? renderAoSspApprovalQueueHtml(user) : ''}
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

  var queue = (state.controlReviewQueue || []).filter(function(r) {
    return r.type !== 'baseline-elevation' && r.type !== 'ssp';
  });
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
    var rowNotes = String(r.notes || '').trim();
    var queueStatus = String(r.status || '').trim();
    var isReturnForReassignment = queueStatus === 'Returned to Policy Owner' || r.type === 'control-return' || !!cs.returnedToPolicyOwner;
    var statusLabel = isReturnForReassignment ? 'Returned for reassignment' : (queueStatus || cs.status || 'Unknown');
    var statusColor = isReturnForReassignment
      ? '#b45309'
      : (statusLabel === 'Implemented' ? '#16a34a' : statusLabel === 'In Progress' ? '#f59e0b' : '#6b7280');
    var actionHtml = isReturnForReassignment
      ? '<button class="btn btn-sm" style="background:#2563eb;color:white;border:none;font-size:11px;padding:3px 8px;margin-right:4px;" onclick="openControlReassignmentFromQueue(\'' + r.controlId + '\')">Review / Reassign</button>'
        + '<button class="btn btn-sm" style="background:white;color:#334155;border:1px solid var(--border);font-size:11px;padding:3px 8px;" onclick="reviewQueueAction(\'' + r.controlId + '\',\'resolve-return\')">Mark Reviewed</button>'
      : '<button class="btn btn-sm" style="background:#16a34a;color:white;border:none;font-size:11px;padding:3px 8px;margin-right:4px;" onclick="reviewQueueAction(\'' + r.controlId + '\',\'approve\')">Approve</button>'
        + '<button class="btn btn-sm" style="background:#f59e0b;color:white;border:none;font-size:11px;padding:3px 8px;" onclick="reviewQueueAction(\'' + r.controlId + '\',\'return\')">Request Evidence</button>';
    return '<tr style="border-bottom:1px solid rgba(0,0,0,0.05);">'
      + '<td style="padding:8px 10px;font-family:monospace;font-weight:700;font-size:12px;">' + escapeHTML(r.controlId) + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + escapeHTML(ctrl ? ctrl.n : '') + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">'
      + escapeHTML(r.submittedBy || owner.name || '')
      + (rowNotes ? '<div style="font-size:11px;color:#475569;margin-top:3px;line-height:1.35;"><strong>Notes:</strong> ' + escapeHTML(rowNotes) + '</div>' : '')
      + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;color:' + statusColor + ';font-weight:600;">' + escapeHTML(statusLabel) + '</td>'
      + '<td style="padding:8px 10px;font-size:11px;color:var(--text-muted);">' + submitted + '</td>'
      + '<td style="padding:8px 6px;text-align:right;white-space:nowrap;">' + actionHtml + '</td></tr>';
  }).join('');

  panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
    + '<div style="display:flex;align-items:center;gap:10px;">'
    + '<span style="font-size:18px;">\uD83D\uDCCB</span>'
    + '<div><div style="font-weight:700;font-size:14px;color:var(--navy);">Control Review Queue</div>'
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
  } else if (action === 'resolve-return') {
    state.controlReviewQueue = (state.controlReviewQueue||[]).filter(function(r) {
      return !(r && r.controlId === controlId && (r.type === 'control-return' || r.status === 'Returned to Policy Owner'));
    });
    addAuditEntry('control', controlId, 'Returned-control reassignment request reviewed');
    showToast('\u2705 Return request reviewed for ' + controlId);
  }
  markDirty();
  renderReviewQueuePanel();
}

function openControlReassignmentFromQueue(controlId) {
  var fam = String(controlId || '').split('-')[0] || '';
  showTab('policy');
  if (typeof enterPolicyWizard === 'function' && fam) {
    enterPolicyWizard(fam);
    goToStep('policy', 4);
    setTimeout(function() {
      var q = document.getElementById('ctrlOwnerSearch');
      if (q) q.value = controlId;
      if (typeof filterCtrlOwnerTable === 'function') filterCtrlOwnerTable();
    }, 0);
  } else if (typeof goToPoliciesHome === 'function') {
    goToPoliciesHome();
  }
}

function approveAllReviewQueue() {
  var queue = state.controlReviewQueue || [];
  var attestationOnly = queue.filter(function(r) {
    return r.type !== 'baseline-elevation' && r.controlId;
  });
  if (!attestationOnly.length) return;
  if (!confirm('Approve all ' + attestationOnly.length + ' pending attestations?')) return;
  attestationOnly.forEach(function(r) {
    addAuditEntry('control', r.controlId, 'Attestation approved (bulk)');
  });
  state.controlReviewQueue = queue.filter(function(r) {
    return attestationOnly.indexOf(r) === -1;
  });
  markDirty();
  showToast('\u2705 All attestations approved');
  renderReviewQueuePanel();
}
