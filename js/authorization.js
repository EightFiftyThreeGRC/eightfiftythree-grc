// js/authorization.js — AO decision data + modal-only entry point.
//
// As of 2026-04-27, the Control Assessment and Authorization workspaces
// (tab-tester, tab-ato) and their wizards have been removed. The underlying
// data model — state.authBoundaries, state.assessmentPlans, state.atoDecisions
// — is preserved for any program that already has assessment data, and AOs
// can still record an authorization decision through openAtoDecisionModal(),
// launched from the Reports dashboard.
//
// This file is the only surviving home for ATO logic. Globals only.

// ---- State shape guarantees ------------------------------------------------

function atoEnsureState() {
  if (!Array.isArray(state.authBoundaries)) state.authBoundaries = [];
  if (!state.assessmentPlans || typeof state.assessmentPlans !== 'object') state.assessmentPlans = {};
  if (!state.atoDecisions || typeof state.atoDecisions !== 'object') state.atoDecisions = {};
}

function _atoBaselineRank(ch) {
  return { L: 1, M: 2, H: 3 }[ch] || 1;
}

function _atoBaselineLetter(r) {
  return r === 3 ? 'H' : r === 2 ? 'M' : 'L';
}

/** FIPS 199 high-water of member assets, or an explicit boundary override. */
function getAuthBoundaryBaseline(boundary) {
  if (!boundary) return 'L';
  if (boundary.baseline === 'L' || boundary.baseline === 'M' || boundary.baseline === 'H') return boundary.baseline;
  var max = 1;
  (boundary.assetIds || []).forEach(function(id) {
    var cat = (state.assetCategorization || {})[String(id)];
    var impact = (typeof computeAssetOverallFipsImpact === 'function') ? computeAssetOverallFipsImpact(cat) : 'L';
    max = Math.max(max, _atoBaselineRank(impact));
  });
  return _atoBaselineLetter(max);
}

function setAuthBoundaryBaseline(boundaryId, letter) {
  atoEnsureState();
  var b = (state.authBoundaries || []).find(function(x) { return x.id === boundaryId; });
  if (!b) return;
  var next = (letter === 'M' || letter === 'H' || letter === 'L') ? letter : 'L';
  var prev = b.baseline || '';
  b.baseline = next;
  if (typeof logFieldChange === 'function') logFieldChange('authBoundaries.' + boundaryId + '.baseline', prev, next);
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('ato', boundaryId, 'Authorization-boundary baseline set to ' + next + ' (FIPS 199 / 800-53B for this system boundary, not the organization).');
  }
  if (typeof markDirty === 'function') markDirty();
  if (typeof renderReports === 'function') setTimeout(function() { renderReports(); }, 0);
  else if (typeof renderDashboard === 'function') setTimeout(function() { renderDashboard(); }, 0);
}

function atoNameByUserId(id) {
  var u = (state.users || []).find(function(x) { return x.id === id; });
  return u ? u.name : '';
}

function atoGetCurrentUser() {
  return state.currentUserId ? (state.users || []).find(function(u) { return u.id === state.currentUserId; }) : null;
}

function atoCurrentRoles() {
  var me = atoGetCurrentUser();
  if (!me) return ['admin'];
  var ids = state._currentPersonIds || [me.id];
  var roles = [];
  ids.forEach(function(id) {
    var rec = (state.users || []).find(function(u) { return u.id === id; });
    if (!rec) return;
    var arr = (rec.roles && rec.roles.length) ? rec.roles : [rec.role];
    arr.forEach(function(r) { if (r && roles.indexOf(r) === -1) roles.push(r); });
  });
  if (!roles.length && me.role) roles.push(me.role);
  return roles;
}

function atoCanDecide(boundary) {
  if (!boundary) return false;
  if (!state.currentUserId) return true; // admin mode (no signed-in user) = program owner / admin
  var roles = atoCurrentRoles();
  if (roles.indexOf('ao') === -1 && roles.indexOf('ciso') === -1) return false;
  var ids = state._currentPersonIds || [state.currentUserId];
  return ids.indexOf(boundary.aoUserId) !== -1 || roles.indexOf('ciso') !== -1;
}

function atoDecisionDefaultExpiry(decision) {
  var d = new Date();
  // IATT is a test authorization: DoDI 8510.01 wants the shortest period needed to
  // finish testing, so default to 90 days rather than half a year. An ATO issued with
  // conditions is time-boxed to the remediation window, so default to one year.
  if (decision === 'IATT') d.setDate(d.getDate() + 90);
  else if (decision === 'ATO-Conditions') d.setFullYear(d.getFullYear() + 1);
  else d.setFullYear(d.getFullYear() + 3);
  return d.toISOString().slice(0, 10);
}

// ---- AO Decision modal -----------------------------------------------------

/** Open a modal for the AO to record a decision on `boundaryId`. */
function openAtoDecisionModal(boundaryId) {
  atoEnsureState();
  var boundary = (state.authBoundaries || []).find(function(b) { return b.id === boundaryId; });
  if (!boundary) { showToast('Boundary not found.', true); return; }
  var canDecide = atoCanDecide(boundary);
  if (!canDecide) { showToast('Only the assigned AO (or CISO) can record this decision.', true); return; }
  var d = state.atoDecisions[boundaryId] || {};
  var existing = state.atoDecisions[boundaryId] && state.atoDecisions[boundaryId].decidedAt;
  closeAtoDecisionModal();
  var aoName = boundary.aoUserId ? atoNameByUserId(boundary.aoUserId) : '';
  var overlay = document.createElement('div');
  overlay.id = 'atoDecisionOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.6);z-index:10070;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = ''
    + '<div style="background:white;border-radius:14px;width:min(560px,96vw);max-height:92vh;overflow:auto;padding:22px 24px;box-shadow:0 24px 80px rgba(0,0,0,0.35);">'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">'
    + '<div>'
    + '<div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted);">Authorization decision</div>'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-top:2px;">' + escapeHTML(boundary.name || '(unnamed boundary)') + '</div>'
    + (aoName ? '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">AO: <strong>' + escapeHTML(aoName) + '</strong></div>' : '')
    + (existing ? '<div style="font-size:11px;color:#92400e;margin-top:6px;">⚠ A previous decision was recorded on ' + escapeHTML(String(d.decidedAt).slice(0,10)) + '. Submitting will overwrite it.</div>' : '')
    + '</div>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="closeAtoDecisionModal()" aria-label="Close">✕</button>'
    + '</div>'
    + '<div style="margin-top:14px;font-size:12px;font-weight:700;color:var(--text-muted);">Decision</div>'
    + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:6px;">'
    + '<label style="font-size:13px;font-weight:600;"><input type="radio" name="ato-modal-decision" value="ATO" ' + (d.decision === 'ATO' ? 'checked' : '') + '> ATO</label>'
    + '<label style="font-size:13px;font-weight:600;"><input type="radio" name="ato-modal-decision" value="ATO-Conditions" ' + (d.decision === 'ATO-Conditions' ? 'checked' : '') + '> ATO with conditions</label>'
    + '<label style="font-size:13px;font-weight:600;"><input type="radio" name="ato-modal-decision" value="IATT" ' + (d.decision === 'IATT' ? 'checked' : '') + '> IATT</label>'
    + '<label style="font-size:13px;font-weight:600;"><input type="radio" name="ato-modal-decision" value="Denial" ' + (d.decision === 'Denial' ? 'checked' : '') + '> Denial</label>'
    + '</div>'
    + '<div style="margin-top:12px;font-size:12px;font-weight:700;color:var(--text-muted);">Conditions <span style="font-weight:500;">(one per line \u2014 required for an ATO with conditions)</span></div>'
    + '<textarea id="atoModalConditions" class="form-input" rows="2" placeholder="e.g. Mitigate AC-2 finding within 30 days">' + escapeHTML(d.conditionsRaw || (Array.isArray(d.conditions) ? d.conditions.join('\n') : '')) + '</textarea>'
    + '<div style="margin-top:12px;font-size:12px;font-weight:700;color:var(--text-muted);">Expires</div>'
    + '<input id="atoModalExpires" class="form-input" type="date" style="max-width:220px;" value="' + escapeHTML(d.expiresAt || '') + '">'
    + '<div style="margin-top:12px;font-size:12px;font-weight:700;color:var(--text-muted);">Residual risk narrative</div>'
    + '<textarea id="atoModalNarrative" class="form-input" rows="3" placeholder="Describe residual risk and rationale for accepting it">' + escapeHTML(d.residualRiskNarrative || '') + '</textarea>'
    + '<div style="margin-top:12px;font-size:12px;font-weight:700;color:var(--text-muted);">Digital signature</div>'
    + '<input id="atoModalSignature" class="form-input" placeholder="Type full name as signature" value="' + escapeHTML(d.signature || '') + '">'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">'
    + '<button type="button" class="btn btn-secondary" onclick="closeAtoDecisionModal()">Cancel</button>'
    + '<button type="button" class="btn btn-navy" onclick="submitAtoDecisionFromModal(' + JSON.stringify(boundaryId) + ')">✓ Record AO Decision</button>'
    + '</div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeAtoDecisionModal(); });
  setTimeout(function() {
    var first = overlay.querySelector('input[name="ato-modal-decision"]:checked, input[name="ato-modal-decision"]');
    if (first) first.focus();
  }, 0);
}

function closeAtoDecisionModal() {
  var ov = document.getElementById('atoDecisionOverlay');
  if (ov) ov.remove();
}

/** Pulls the form values out of the modal and persists the decision. */
function submitAtoDecisionFromModal(boundaryId) {
  atoEnsureState();
  var boundary = (state.authBoundaries || []).find(function(b) { return b.id === boundaryId; });
  if (!boundary) { showToast('Boundary not found.', true); return; }
  if (!atoCanDecide(boundary)) {
    showToast('Only the assigned AO (or CISO) can record this decision.', true);
    return;
  }
  var picked = document.querySelector('input[name="ato-modal-decision"]:checked');
  var decision = picked ? picked.value : '';
  var conditionsRaw = (document.getElementById('atoModalConditions') || {}).value || '';
  var expiresAt = (document.getElementById('atoModalExpires') || {}).value || '';
  var narrative = (document.getElementById('atoModalNarrative') || {}).value || '';
  var signature = ((document.getElementById('atoModalSignature') || {}).value || '').trim();
  if (!decision) { showToast('Select an authorization decision.', true); return; }
  if (!signature) { showToast('Digital signature is required.', true); return; }
  if (decision === 'ATO-Conditions' && !String(conditionsRaw).trim()) {
    showToast('List at least one condition for an ATO with conditions.', true);
    return;
  }
  if (!expiresAt && decision !== 'Denial') expiresAt = atoDecisionDefaultExpiry(decision);
  var ids = state._currentPersonIds || [state.currentUserId];
  var conditions = String(conditionsRaw).split('\n').map(function(x) { return x.trim(); }).filter(Boolean);
  var record = {
    boundaryId: boundaryId,
    decision: decision,
    conditionsRaw: conditionsRaw,
    conditions: conditions,
    expiresAt: expiresAt,
    residualRiskNarrative: narrative,
    signature: signature,
    decidedByUserId: ids[0] || state.currentUserId || '',
    decidedAt: new Date().toISOString()
  };
  state.atoDecisions[boundaryId] = record;
  boundary.atoStatus = decision === 'ATO' ? 'ato-granted'
    : decision === 'ATO-Conditions' ? 'ato-conditions'
    : decision === 'IATT' ? 'iatt' : 'denied';
  boundary.atoGrantedDate = (decision !== 'Denial') ? new Date().toISOString().slice(0, 10) : '';
  boundary.atoExpiresDate = expiresAt || '';
  boundary.conditions = conditions;
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('ato', boundary.id, 'AO decision: ' + decision + '; expires ' + (boundary.atoExpiresDate || 'n/a'));
  }
  markDirty();
  closeAtoDecisionModal();
  showToast('Authorization decision recorded.');
  // Re-render dashboard if it's currently visible so the new status shows up.
  if (typeof renderReports === 'function') {
    var rt = document.getElementById('tab-reports');
    if (rt && rt.classList.contains('active')) setTimeout(renderReports, 0);
  }
}

// Backwards-compat alias: any caller still invoking submitAtoDecision()
// (e.g. from snapshot-loaded inline handlers) should still resolve.
function submitAtoDecision() {
  showToast('The AO decision form lives in the Reports dashboard now. Open it there.', true);
}

// ---- Reports-dashboard panel ----------------------------------------------

/** Compact status card listing all authorization boundaries with their current
 * ATO status and a "Record decision" action for AOs/CISOs. Returns '' when
 * there are no boundaries at all so the dashboard stays uncluttered for
 * programs that aren't running an authorization process. */
/** One authorization boundary per registered system so Reports can show FIPS 199 / system baseline. */
function ensureAuthBoundaryForAsset(asset) {
  atoEnsureState();
  if (!asset || !asset.id) return null;
  var aid = String(asset.id);
  var existing = (state.authBoundaries || []).find(function(b) {
    return b && ((b.assetIds || []).indexOf(aid) !== -1);
  });
  if (existing) return existing;
  var b = {
    id: 'bnd-' + aid,
    name: (asset.name || 'System') + ' authorization boundary',
    description: 'Authorization boundary for this system. FIPS 199 sets the 800-53 baseline here \u2014 not for the organization.',
    assetTypes: asset.type ? [asset.type] : [],
    assetIds: [aid],
    processIds: [],
    aoUserId: '',
    assessorUserIds: [],
    atoStatus: 'pending',
    atoGrantedDate: '',
    atoExpiresDate: '',
    conditions: []
  };
  state.authBoundaries.push(b);
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('ato', b.id, 'Authorization boundary created for system ' + (asset.name || aid));
  }
  if (typeof markDirty === 'function') markDirty();
  return b;
}

function ensureAuthBoundariesForAssets() {
  (state.assets || []).forEach(function(a) {
    if (a && a.id) ensureAuthBoundaryForAsset(a);
  });
}

function renderAuthorizationStatusPanelHtml() {
  atoEnsureState();
  ensureAuthBoundariesForAssets();
  var boundaries = state.authBoundaries || [];
  if (!boundaries.length) {
    return ''
      + '<div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:18px;max-width:920px;">'
      + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:6px;">\uD83D\uDEE1\uFE0F Authorization status</div>'
      + '<div style="font-size:12px;color:var(--text-muted);line-height:1.55;margin-bottom:10px;">No systems yet. Each information system gets its own authorization boundary. FIPS 199 categorization there sets that system\u2019s 800-53 baseline \u2014 not an organizational Low / Moderate / High pick.</div>'
      + '<button type="button" class="btn btn-primary btn-sm" onclick="showTab(\'asset\');if(typeof openAddItemModal===\'function\')openAddItemModal(\'asset\');">Register a system</button>'
      + '</div>';
  }
  var rows = boundaries.map(function(b) {
    var status = b.atoStatus || 'pending';
    var label = status === 'ato-granted' ? 'ATO granted'
      : status === 'ato-conditions' ? 'ATO with conditions'
      : status === 'iatt' ? 'IATT'
      : status === 'denied' ? 'Denied'
      : status === 'sar-submitted' ? 'SAR submitted'
      : 'Pending';
    var color = status === 'ato-granted' ? '#166534'
      : status === 'ato-conditions' ? '#92400e'
      : status === 'iatt' ? '#92400e'
      : status === 'denied' ? '#991b1b'
      : '#475569';
    var bg = status === 'ato-granted' ? '#dcfce7'
      : status === 'ato-conditions' ? '#fef3c7'
      : status === 'iatt' ? '#fef3c7'
      : status === 'denied' ? '#fee2e2'
      : '#f1f5f9';
    var aoName = b.aoUserId ? atoNameByUserId(b.aoUserId) : '';
    var canDecide = atoCanDecide(b);
    var expires = b.atoExpiresDate ? ' · expires ' + escapeHTML(b.atoExpiresDate) : '';
    var sysBl = getAuthBoundaryBaseline(b);
    var blOpts = ['L', 'M', 'H'].map(function(letter) {
      var name = letter === 'H' ? 'High' : letter === 'M' ? 'Moderate' : 'Low';
      return '<option value="' + letter + '"' + (sysBl === letter ? ' selected' : '') + '>' + name + '</option>';
    }).join('');
    var bidJs = JSON.stringify(b.id);
    return '<tr>'
      + '<td style="padding:8px 10px;border-top:1px solid var(--border);font-weight:600;">' + escapeHTML(b.name || '(unnamed)') + '</td>'
      + '<td style="padding:8px 10px;border-top:1px solid var(--border);">'
      + '<select class="form-select" style="max-width:130px;font-size:12px;padding:4px 8px;" title="800-53 baseline for this authorization boundary" onchange="setAuthBoundaryBaseline(' + bidJs + ', this.value)">' + blOpts + '</select>'
      + '</td>'
      + '<td style="padding:8px 10px;border-top:1px solid var(--border);"><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;color:' + color + ';background:' + bg + ';">' + label + '</span><span style="font-size:11px;color:var(--text-muted);margin-left:6px;">' + expires + '</span></td>'
      + '<td style="padding:8px 10px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted);">' + escapeHTML(aoName || '—') + '</td>'
      + '<td style="padding:8px 10px;border-top:1px solid var(--border);text-align:right;">'
      + (canDecide
          ? '<button type="button" class="btn btn-secondary btn-sm" onclick="openAtoDecisionModal(' + JSON.stringify(b.id) + ')">Record decision</button>'
          : '<span style="font-size:11px;color:var(--text-muted);">AO-only</span>')
      + '</td>'
      + '</tr>';
  }).join('');
  return ''
    + '<div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:18px;max-width:920px;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);">🛡️ Authorization status</div>'
    + '<div style="font-size:11px;color:var(--text-muted);">System baseline is chosen per boundary (FIPS 199) \u2014 not for the organization</div>'
    + '</div>'
    + '<div class="table-scroll" style="max-height:none;overflow-x:auto;">'
    + '<table style="width:100%;min-width:560px;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-muted);">'
    + '<th style="text-align:left;padding:6px 10px;">Boundary</th>'
    + '<th style="text-align:left;padding:6px 10px;">System baseline</th>'
    + '<th style="text-align:left;padding:6px 10px;">Status</th>'
    + '<th style="text-align:left;padding:6px 10px;">AO</th>'
    + '<th style="text-align:right;padding:6px 10px;">Action</th>'
    + '</tr></thead><tbody>'
    + rows
    + '</tbody></table></div>'
    + '</div>';
}
