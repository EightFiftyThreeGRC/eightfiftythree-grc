// js/risk.js — Phase 2: Risks & Issues (NIST 800-30 / CA-5 / PM-4)

var RISK_LIKELIHOODS = ['Low', 'Medium', 'High'];
var RISK_IMPACTS = ['Low', 'Medium', 'High'];
var RISK_TREATMENTS = ['Mitigate', 'Accept', 'Transfer', 'Avoid'];
var RISK_STATUSES = ['Proposed', 'Open', 'In Treatment', 'Accepted', 'Closed'];
var ISSUE_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
var ISSUE_STATUSES = ['Proposed', 'Open', 'In Progress', 'Remediated', 'Verified', 'Closed', 'Risk Accepted'];
var ISSUE_DUE_DAYS = { Critical: 30, High: 60, Medium: 90, Low: 180 };

function ensureRiskState() {
  if (!Array.isArray(state.risks)) state.risks = [];
  if (!Array.isArray(state.issues)) state.issues = [];
  if (!state.riskTriageDismissals || typeof state.riskTriageDismissals !== 'object') state.riskTriageDismissals = {};
}

/** PM-4 selected in CISO wizard → show POA&M terminology for issues view. */
function hasPm4PoamControl() {
  return !!(state.pmControls && state.pmControls['PM-4']);
}

function getIssuesViewLabel() {
  return hasPm4PoamControl() ? 'Issues (POA&M)' : 'Issues';
}

function getRiskTabSubtitle() {
  return hasPm4PoamControl()
    ? 'Identify, triage, and manage risks and POA&M-compatible issues — aligned to NIST 800-30, PM-4, and CA-5.'
    : 'Identify, triage, and manage risks and remediation issues — aligned to NIST 800-30 and CA-5.';
}

function generateRiskId() {
  return 'risk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function generateIssueId() {
  return 'issue-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function computeRiskRating(likelihood, impact) {
  var li = RISK_LIKELIHOODS.indexOf(likelihood);
  var im = RISK_IMPACTS.indexOf(impact);
  if (li < 0 || im < 0) return 'Low';
  if (li === 2 && im === 2) return 'Critical';
  if (li === 2 || im === 2) return 'High';
  if (li === 1 && im === 1) return 'Moderate';
  if (li === 1 || im === 1) return 'Moderate';
  return 'Low';
}

function riskRatingClass(rating) {
  if (rating === 'Critical') return 'poam-sev-critical';
  if (rating === 'High') return 'poam-sev-high';
  if (rating === 'Moderate') return 'poam-sev-medium';
  return 'poam-sev-low';
}

function issueSeverityClass(sev) {
  if (sev === 'Critical') return 'poam-sev-critical';
  if (sev === 'High') return 'poam-sev-high';
  if (sev === 'Low') return 'poam-sev-low';
  return 'poam-sev-medium';
}

function defaultIssueDueDate(severity) {
  var days = ISSUE_DUE_DAYS[severity] || 90;
  var d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function riskEscJs(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getRiskSessionUser() {
  if (!state.currentUserId || !state.users) return null;
  return state.users.find(function(u) { return u.id === state.currentUserId; }) || null;
}

function sessionIdentityTokens() {
  var name = String(typeof getSessionActorName === 'function' ? getSessionActorName('') : '').trim().toLowerCase();
  var email = String(typeof getSessionEmailForApproval === 'function' ? getSessionEmailForApproval() : '').trim().toLowerCase();
  var user = getRiskSessionUser();
  if (!name && user && user.name) name = String(user.name).trim().toLowerCase();
  if (!email && user && user.email) email = String(user.email).trim().toLowerCase();
  return { name: name, email: email };
}

function identityMatchesField(fieldVal, tokens) {
  var f = String(fieldVal || '').trim().toLowerCase();
  if (!f) return false;
  return (tokens.name && f === tokens.name) || (tokens.email && f === tokens.email);
}

function getRiskSessionRoles() {
  var user = getRiskSessionUser();
  if (!user) {
    if (typeof isSessionProgramOwnerActor === 'function' && isSessionProgramOwnerActor()) return ['ciso'];
    return [];
  }
  var roles = [];
  (state._currentPersonIds || [user.id]).forEach(function(pid) {
    var rec = (state.users || []).find(function(u) { return u.id === pid; });
    if (!rec) return;
    (rec.roles && rec.roles.length ? rec.roles : [rec.role]).forEach(function(r) {
      if (roles.indexOf(r) === -1) roles.push(r);
    });
  });
  return roles;
}

function canSessionTriageRisk() {
  if (typeof isSessionProgramOwnerActor === 'function' && isSessionProgramOwnerActor()) return true;
  var roles = getRiskSessionRoles();
  return roles.indexOf('ciso') !== -1 || roles.indexOf('issm') !== -1;
}

function riskScopeInAoBoundary(scopeId, aoUserId) {
  if (!scopeId || !aoUserId) return false;
  return (state.authBoundaries || []).some(function(b) {
    if (!b || String(b.aoUserId || '') !== String(aoUserId)) return false;
    var aids = (b.assetIds || []).map(String);
    var pids = (b.processIds || []).map(String);
    return aids.indexOf(String(scopeId)) !== -1 || pids.indexOf(String(scopeId)) !== -1;
  });
}

function canSessionAcceptRisk(risk) {
  if (!risk) return false;
  var tokens = sessionIdentityTokens();
  if (identityMatchesField(risk.ownerName, tokens) || identityMatchesField(risk.ownerEmail, tokens)) return false;
  if (typeof isSessionProgramOwnerActor === 'function' && isSessionProgramOwnerActor()) return true;
  var user = getRiskSessionUser();
  if (user && user.role === 'ao') {
    var scopes = risk.scopeIds || [];
    for (var i = 0; i < scopes.length; i++) {
      if (riskScopeInAoBoundary(scopes[i], user.id)) return true;
    }
  }
  return false;
}

function canSessionVerifyIssue(issue) {
  if (!issue) return false;
  var tokens = sessionIdentityTokens();
  if (identityMatchesField(issue.assigneeName, tokens) || identityMatchesField(issue.assigneeEmail, tokens)) return false;
  if (typeof isSessionProgramOwnerActor === 'function' && isSessionProgramOwnerActor()) return true;
  var roles = getRiskSessionRoles();
  return roles.indexOf('ciso') !== -1 || roles.indexOf('issm') !== -1
    || roles.indexOf('assessor') !== -1 || roles.indexOf('ao') !== -1;
}

function issueIsOpen(issue) {
  return issue && issue.status !== 'Closed' && issue.status !== 'Verified' && issue.status !== 'Risk Accepted';
}

function riskIsOpen(risk) {
  return risk && risk.status !== 'Closed';
}

function getIssueOpenCount() {
  ensureRiskState();
  return state.issues.filter(issueIsOpen).length;
}

function getRiskOpenCount() {
  ensureRiskState();
  return state.risks.filter(function(r) { return r.status !== 'Closed' && r.status !== 'Accepted'; }).length;
}

function getCombinedOpenRiskIssueCount() {
  return getIssueOpenCount() + getRiskOpenCount();
}

function getIssueOverdueCount() {
  ensureRiskState();
  var today = new Date().toISOString().slice(0, 10);
  return state.issues.filter(function(i) {
    return issueIsOpen(i) && i.dueDate && i.dueDate < today;
  }).length;
}

function getTriagePendingCount() {
  if (!canSessionTriageRisk()) return 0;
  return getTriageSuggestions().length;
}

function getScopedIssueOpenCount(user) {
  ensureRiskState();
  var tabs = typeof getHubVisibleTabIds === 'function' ? getHubVisibleTabIds() : (typeof TAB_IDS !== 'undefined' ? TAB_IDS : []);
  if (tabs.indexOf('risk') === -1) return 0;
  var open = state.issues.filter(issueIsOpen);
  if (!user || !state.currentUserId) return open.length;
  if (canSessionTriageRisk()) return open.length;
  var tokens = { name: (user.name || '').trim().toLowerCase(), email: (user.email || '').trim().toLowerCase() };
  return open.filter(function(i) {
    return identityMatchesField(i.assigneeName, tokens) || identityMatchesField(i.assigneeEmail, tokens)
      || i.status === 'Proposed';
  }).length;
}

function scopeNameForId(scopeId) {
  if (!scopeId) return '';
  var asset = (state.assets || []).find(function(a) { return String(a.id) === String(scopeId); });
  if (asset) return asset.name || scopeId;
  var proc = (state.processes || []).find(function(p) { return String(p.id) === String(scopeId); });
  if (proc) return proc.name || scopeId;
  return scopeId;
}

function triageKeyExists(key) {
  ensureRiskState();
  if (state.riskTriageDismissals[key]) return true;
  return state.issues.some(function(i) { return i.sourceKey === key; })
    || state.risks.some(function(r) { return r.source === key || (r.source && String(r.source).indexOf(key) !== -1); });
}

function getTriageSuggestions() {
  ensureRiskState();
  var out = [];
  var today = new Date().toISOString().slice(0, 10);

  function pushSuggestion(key, kind, title, desc, meta) {
    if (triageKeyExists(key)) return;
    out.push({ key: key, kind: kind, title: title, desc: desc, meta: meta || {} });
  }

  var scopes = [];
  (state.assets || []).forEach(function(a) { if (a && a.id) scopes.push({ id: a.id, name: a.name, isProcess: false }); });
  (state.processes || []).forEach(function(p) { if (p && p.id) scopes.push({ id: p.id, name: p.name, isProcess: true }); });

  scopes.forEach(function(scope) {
    var attests = (state.sspAttestations || {})[scope.id] || {};
    Object.keys(attests).forEach(function(ctrlId) {
      var a = attests[ctrlId] || {};
      var st = String(a.status || '');
      if (st === 'Does Not Comply') {
        pushSuggestion('h1:' + scope.id + ':' + ctrlId, 'issue',
          ctrlId + ' — does not comply',
          (scope.name || scope.id) + ': attestation marked Does Not Comply.',
          { hook: 'h1', scopeId: scope.id, controlIds: [ctrlId], severity: 'High', isProcess: scope.isProcess });
      } else if (st === 'Partially Complies') {
        pushSuggestion('h2:' + scope.id + ':' + ctrlId, 'issue',
          ctrlId + ' — partially complies',
          (scope.name || scope.id) + ': attestation marked Partially Complies.',
          { hook: 'h2', scopeId: scope.id, controlIds: [ctrlId], severity: 'Medium', isProcess: scope.isProcess });
      }
    });
  });

  (typeof getActiveControls === 'function' ? getActiveControls() : []).forEach(function(c) {
    if (!c || !c.id) return;
    var cs = (state.controlStatus || {})[c.id] || {};
    var impl = cs.status === 'Implemented' || cs.status === 'Inherited';
    var dl = (state.controlDeadlines || {})[c.id];
    if (dl && dl < today && !impl) {
      pushSuggestion('h3:' + c.id, 'issue',
        c.id + ' — past implementation deadline',
        'Control not implemented by due date ' + dl + '.',
        { hook: 'h3', controlIds: [c.id], severity: 'High', dueDate: dl });
    }
    var tr = (state.controlTestResults || {})[c.id];
    if (tr && String(tr.result || '').toLowerCase() === 'fail') {
      pushSuggestion('h4:' + c.id, 'issue',
        c.id + ' — test failure',
        String(tr.findings || 'Control test marked Fail.').slice(0, 200),
        { hook: 'h4', controlIds: [c.id], severity: 'High' });
    }
  });

  Object.keys(state.atoDecisions || {}).forEach(function(bid) {
    var dec = state.atoDecisions[bid];
    if (!dec || !Array.isArray(dec.conditions)) return;
    var boundary = (state.authBoundaries || []).find(function(b) { return String(b.id) === String(bid); });
    var bname = boundary ? boundary.name : bid;
    dec.conditions.forEach(function(cond, idx) {
      var text = String(cond || '').trim();
      if (!text) return;
      pushSuggestion('h5:' + bid + ':' + idx, 'issue',
        'ATO condition — ' + bname,
        text.slice(0, 200),
        { hook: 'h5', scopeId: bid, severity: 'High', dueDate: dec.expiresAt || '', description: text });
    });
  });

  return out;
}

function dismissTriageSuggestion(key) {
  if (!canSessionTriageRisk()) {
    showToast('Only CISO, ISSM, or the program owner can dismiss triage suggestions.', true);
    return;
  }
  ensureRiskState();
  state.riskTriageDismissals[key] = {
    by: typeof getSessionActorName === 'function' ? getSessionActorName('') : '',
    at: new Date().toISOString()
  };
  addAuditEntry('risk', key, 'Triage suggestion dismissed.');
  markDirty();
  renderRiskTab();
  if (typeof renderHomeTab === 'function') renderHomeTab();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
}

function promoteTriageSuggestion(key, asType, suggestion) {
  if (!canSessionTriageRisk()) {
    showToast('Only CISO, ISSM, or the program owner can promote triage items.', true);
    return;
  }
  if (!suggestion) {
    suggestion = getTriageSuggestions().find(function(s) { return s.key === key; });
  }
  if (!suggestion) return;
  var meta = suggestion.meta || {};
  if (asType === 'risk') {
    addRisk({
      title: suggestion.title,
      statement: suggestion.desc,
      source: 'triage:' + (meta.hook || 'hook'),
      controlIds: meta.controlIds || [],
      scopeIds: meta.scopeId ? [meta.scopeId] : [],
      likelihood: 'Medium',
      impact: meta.severity === 'High' ? 'High' : 'Medium',
      status: 'Open'
    });
  } else {
    addIssue({
      title: suggestion.title,
      description: suggestion.desc,
      source: 'triage:' + (meta.hook || 'hook'),
      sourceKey: key,
      controlIds: meta.controlIds || [],
      scopeId: meta.scopeId || '',
      severity: meta.severity || 'Medium',
      dueDate: meta.dueDate || defaultIssueDueDate(meta.severity || 'Medium'),
      status: 'Open'
    });
  }
  ensureRiskState();
  state.riskTriageDismissals[key] = {
    by: typeof getSessionActorName === 'function' ? getSessionActorName('') : '',
    at: new Date().toISOString()
  };
  addAuditEntry('risk', key, 'Triage suggestion promoted.');
  markDirty();
  renderRiskTab();
  if (typeof renderHomeTab === 'function') renderHomeTab();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  showToast(asType === 'risk' ? 'Promoted to risk register.' : 'Promoted to ' + getIssuesViewLabel() + '.');
}

function addRisk(data) {
  ensureRiskState();
  var actor = typeof getSessionActorName === 'function' ? getSessionActorName('') : '';
  var item = {
    id: generateRiskId(),
    title: String(data.title || '').trim(),
    statement: String(data.statement || data.description || '').trim(),
    source: data.source || 'manual',
    controlIds: Array.isArray(data.controlIds) ? data.controlIds.slice() : (data.controlId ? [String(data.controlId).trim().toUpperCase()] : []),
    scopeIds: Array.isArray(data.scopeIds) ? data.scopeIds.slice() : (data.scopeId ? [String(data.scopeId)] : []),
    families: Array.isArray(data.families) ? data.families.slice() : [],
    likelihood: RISK_LIKELIHOODS.indexOf(data.likelihood) !== -1 ? data.likelihood : 'Medium',
    impact: RISK_IMPACTS.indexOf(data.impact) !== -1 ? data.impact : 'Medium',
    treatment: RISK_TREATMENTS.indexOf(data.treatment) !== -1 ? data.treatment : '',
    treatmentPlan: String(data.treatmentPlan || ''),
    ownerName: String(data.ownerName || ''),
    ownerEmail: String(data.ownerEmail || ''),
    status: canSessionTriageRisk() && !data.forceProposed ? (RISK_STATUSES.indexOf(data.status) !== -1 ? data.status : 'Open') : 'Proposed',
    acceptance: null,
    reviewBy: data.reviewBy || '',
    issueIds: [],
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy: actor,
    closedAt: '',
    closedBy: ''
  };
  if (!item.title) {
    showToast('Risk title is required.', true);
    return null;
  }
  state.risks.push(item);
  addAuditEntry('risk', item.id, 'Risk opened: ' + computeRiskRating(item.likelihood, item.impact) + ' — ' + item.title.slice(0, 80));
  markDirty();
  state._riskView = 'risks';
  renderRiskTab();
  if (typeof renderHomeTab === 'function') renderHomeTab();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  return item;
}

function addIssue(data) {
  ensureRiskState();
  var actor = typeof getSessionActorName === 'function' ? getSessionActorName('') : '';
  var sev = ISSUE_SEVERITIES.indexOf(data.severity) !== -1 ? data.severity : 'Medium';
  var item = {
    id: generateIssueId(),
    title: String(data.title || '').trim(),
    description: String(data.description || data.finding || '').trim(),
    source: data.source || 'manual',
    sourceKey: String(data.sourceKey || ''),
    controlIds: Array.isArray(data.controlIds) ? data.controlIds.slice() : (data.controlId ? [String(data.controlId).trim().toUpperCase()] : []),
    scopeId: String(data.scopeId || ''),
    severity: sev,
    remediationPlan: String(data.remediationPlan || data.mitigationPlan || ''),
    milestones: Array.isArray(data.milestones) ? data.milestones.slice() : [],
    dueDate: data.dueDate || defaultIssueDueDate(sev),
    assigneeName: String(data.assigneeName || data.assignee || ''),
    assigneeEmail: String(data.assigneeEmail || ''),
    status: canSessionTriageRisk() && !data.forceProposed ? (ISSUE_STATUSES.indexOf(data.status) !== -1 ? data.status : 'Open') : 'Proposed',
    verification: null,
    evidenceRef: String(data.evidenceRef || ''),
    riskId: String(data.riskId || ''),
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy: actor,
    closedAt: '',
    closedBy: ''
  };
  if (!item.title && !item.description) {
    showToast('Issue title or description is required.', true);
    return null;
  }
  if (!item.title) item.title = item.description.slice(0, 120);
  state.issues.push(item);
  var poamLabel = hasPm4PoamControl() ? 'POA&M item' : 'issue';
  addAuditEntry('issue', item.id, poamLabel + ' opened: ' + item.severity + ' — ' + item.title.slice(0, 80));
  markDirty();
  state._riskView = 'issues';
  renderRiskTab();
  if (typeof renderHomeTab === 'function') renderHomeTab();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  return item;
}

function updateRiskField(id, field, value) {
  ensureRiskState();
  var item = state.risks.find(function(r) { return r.id === id; });
  if (!item) return;
  var prev = item[field];
  if (field === 'status' && value === 'Accepted') {
    showToast('Use Accept risk action to record acceptance with rationale.', true);
    return;
  }
  item[field] = value;
  if (field === 'status' && value === 'Closed') {
    item.closedAt = new Date().toISOString().slice(0, 10);
    item.closedBy = typeof getSessionActorName === 'function' ? getSessionActorName('') : '';
  }
  logFieldChange('risks.' + id + '.' + field, prev, value);
  markDirty();
}

function updateIssueField(id, field, value) {
  ensureRiskState();
  var item = state.issues.find(function(i) { return i.id === id; });
  if (!item) return;
  var prev = item[field];
  if (field === 'status' && (value === 'Verified' || value === 'Closed')) {
    showToast('Use Verify action to close with separation of duties.', true);
    return;
  }
  if (field === 'status' && value === 'Risk Accepted') {
    showToast('Use Risk Accepted workflow to link an acceptance record.', true);
    return;
  }
  item[field] = value;
  if (field === 'severity' && !item.dueDate) item.dueDate = defaultIssueDueDate(value);
  logFieldChange('issues.' + id + '.' + field, prev, value);
  markDirty();
}

function deleteRiskItem(id) {
  if (!window.confirm('Delete this risk record?')) return;
  ensureRiskState();
  state.risks = state.risks.filter(function(r) { return r.id !== id; });
  addAuditEntry('risk', id, 'Risk deleted.');
  markDirty();
  renderRiskTab();
}

function deleteIssueItem(id) {
  if (!window.confirm('Delete this issue?')) return;
  ensureRiskState();
  state.issues = state.issues.filter(function(i) { return i.id !== id; });
  addAuditEntry('issue', id, 'Issue deleted.');
  markDirty();
  renderRiskTab();
}

function openAcceptRiskModal(riskId) {
  var risk = (state.risks || []).find(function(r) { return r.id === riskId; });
  if (!risk) return;
  if (!canSessionAcceptRisk(risk)) {
    showToast('Risk acceptance requires program owner or boundary AO — not the risk owner.', true);
    return;
  }
  var overlay = document.createElement('div');
  overlay.id = 'riskModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:3000;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML = '<div class="poam-modal-card" role="dialog" aria-modal="true">'
    + '<h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">Accept risk</h2>'
    + '<p style="font-size:12px;color:var(--text-muted);margin:0 0 16px;">' + escapeHTML(risk.title) + '</p>'
    + '<div class="form-group"><label class="form-label">Rationale <span class="required">*</span></label>'
    + '<textarea id="riskAcceptRationale" class="form-input" rows="3" placeholder="Why is this risk acceptable within tolerance?"></textarea></div>'
    + '<div class="form-group"><label class="form-label">Acceptance expires</label>'
    + '<input id="riskAcceptExpires" type="date" class="form-input"></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">'
    + '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\'riskModalOverlay\').remove()">Cancel</button>'
    + '<button type="button" class="btn btn-primary" onclick="submitRiskAcceptance(\'' + riskEscJs(riskId) + '\')">Record acceptance</button>'
    + '</div></div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function submitRiskAcceptance(riskId) {
  var risk = (state.risks || []).find(function(r) { return r.id === riskId; });
  if (!risk || !canSessionAcceptRisk(risk)) return;
  var rationale = String((document.getElementById('riskAcceptRationale') || {}).value || '').trim();
  if (!rationale) { showToast('Acceptance rationale is required.', true); return; }
  var expires = (document.getElementById('riskAcceptExpires') || {}).value || '';
  risk.treatment = 'Accept';
  risk.status = 'Accepted';
  risk.acceptance = {
    by: typeof getSessionActorName === 'function' ? getSessionActorName('') : '',
    byEmail: typeof getSessionEmailForApproval === 'function' ? getSessionEmailForApproval() : '',
    at: new Date().toISOString(),
    rationale: rationale,
    expiresAt: expires
  };
  addAuditEntry('risk', riskId, 'Risk accepted: ' + rationale.slice(0, 80));
  markDirty();
  var ov = document.getElementById('riskModalOverlay');
  if (ov) ov.remove();
  renderRiskTab();
  showToast('Risk acceptance recorded.');
}

function openVerifyIssueModal(issueId) {
  var issue = (state.issues || []).find(function(i) { return i.id === issueId; });
  if (!issue) return;
  if (!canSessionVerifyIssue(issue)) {
    showToast('Verifier must differ from the assignee.', true);
    return;
  }
  var overlay = document.createElement('div');
  overlay.id = 'riskModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:3000;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML = '<div class="poam-modal-card" role="dialog" aria-modal="true">'
    + '<h2 style="margin:0 0 12px;font-size:20px;font-weight:700;">Verify remediation</h2>'
    + '<p style="font-size:12px;color:var(--text-muted);margin:0 0 16px;">' + escapeHTML(issue.title) + '</p>'
    + '<div class="form-group"><label class="form-label">Verification note</label>'
    + '<textarea id="issueVerifyNote" class="form-input" rows="2" placeholder="How was remediation verified?"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">'
    + '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\'riskModalOverlay\').remove()">Cancel</button>'
    + '<button type="button" class="btn btn-primary" onclick="submitIssueVerification(\'' + riskEscJs(issueId) + '\')">Verify &amp; close</button>'
    + '</div></div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function submitIssueVerification(issueId) {
  var issue = (state.issues || []).find(function(i) { return i.id === issueId; });
  if (!issue || !canSessionVerifyIssue(issue)) return;
  var note = String((document.getElementById('issueVerifyNote') || {}).value || '').trim();
  issue.status = 'Closed';
  issue.verification = {
    by: typeof getSessionActorName === 'function' ? getSessionActorName('') : '',
    byEmail: typeof getSessionEmailForApproval === 'function' ? getSessionEmailForApproval() : '',
    at: new Date().toISOString(),
    note: note
  };
  issue.closedAt = new Date().toISOString().slice(0, 10);
  issue.closedBy = issue.verification.by;
  addAuditEntry('issue', issueId, 'Issue verified and closed.');
  markDirty();
  var ov = document.getElementById('riskModalOverlay');
  if (ov) ov.remove();
  renderRiskTab();
  showToast('Issue verified and closed.');
}

function openAddRiskModal() {
  var overlay = document.createElement('div');
  overlay.id = 'riskModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:3000;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML = '<div class="poam-modal-card" role="dialog" aria-modal="true">'
    + '<h2 style="margin:0 0 16px;font-size:20px;font-weight:700;">New risk</h2>'
    + '<div class="form-group"><label class="form-label">Title <span class="required">*</span></label>'
    + '<input id="riskNewTitle" class="form-input" placeholder="Short risk name"></div>'
    + '<div class="form-group"><label class="form-label">Risk statement</label>'
    + '<textarea id="riskNewStatement" class="form-input" rows="3" placeholder="If … then …"></textarea></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    + '<div class="form-group" style="margin:0"><label class="form-label">Likelihood</label>'
    + '<select id="riskNewLikelihood" class="form-select">' + RISK_LIKELIHOODS.map(function(v) {
      return '<option' + (v === 'Medium' ? ' selected' : '') + '>' + v + '</option>';
    }).join('') + '</select></div>'
    + '<div class="form-group" style="margin:0"><label class="form-label">Impact</label>'
    + '<select id="riskNewImpact" class="form-select">' + RISK_IMPACTS.map(function(v) {
      return '<option' + (v === 'Medium' ? ' selected' : '') + '>' + v + '</option>';
    }).join('') + '</select></div></div>'
    + '<div class="form-group"><label class="form-label">Owner</label>'
    + '<input id="riskNewOwner" class="form-input" placeholder="Name or email"></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">'
    + '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\'riskModalOverlay\').remove()">Cancel</button>'
    + '<button type="button" class="btn btn-primary" onclick="submitNewRiskFromModal()">Add risk</button>'
    + '</div></div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function submitNewRiskFromModal() {
  var item = addRisk({
    title: (document.getElementById('riskNewTitle') || {}).value || '',
    statement: (document.getElementById('riskNewStatement') || {}).value || '',
    likelihood: (document.getElementById('riskNewLikelihood') || {}).value || 'Medium',
    impact: (document.getElementById('riskNewImpact') || {}).value || 'Medium',
    ownerName: (document.getElementById('riskNewOwner') || {}).value || ''
  });
  if (item) {
    var ov = document.getElementById('riskModalOverlay');
    if (ov) ov.remove();
    showToast('Risk added.');
  }
}

function openAddIssueModal(prefill) {
  prefill = prefill || {};
  state._issueModalSource = prefill.source || 'manual';
  state._issueModalSourceKey = prefill.sourceKey || '';
  state._issueModalScopeId = prefill.scopeId || '';
  var controls = typeof getActiveControls === 'function' ? getActiveControls() : [];
  var ctrlOpts = controls.slice(0, 400).map(function(c) {
    var sel = (prefill.controlIds && prefill.controlIds[0] === c.id) || prefill.controlId === c.id;
    return '<option value="' + escapeHTML(c.id) + '"' + (sel ? ' selected' : '') + '>' + escapeHTML(c.id) + ' — ' + escapeHTML(c.n || '') + '</option>';
  }).join('');
  var overlay = document.createElement('div');
  overlay.id = 'riskModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:3000;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML = '<div class="poam-modal-card" role="dialog" aria-modal="true">'
    + '<h2 style="margin:0 0 16px;font-size:20px;font-weight:700;">New ' + escapeHTML(getIssuesViewLabel().toLowerCase()) + '</h2>'
    + '<div class="form-group"><label class="form-label">Title <span class="required">*</span></label>'
    + '<input id="issueNewTitle" class="form-input" value="' + escapeHTML(prefill.title || '') + '"></div>'
    + '<div class="form-group"><label class="form-label">Description</label>'
    + '<textarea id="issueNewDesc" class="form-input" rows="3">' + escapeHTML(prefill.description || '') + '</textarea></div>'
    + '<div class="form-group"><label class="form-label">Related control</label>'
    + '<select id="issueNewControl" class="form-select"><option value="">— optional —</option>' + ctrlOpts + '</select></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    + '<div class="form-group" style="margin:0"><label class="form-label">Severity</label>'
    + '<select id="issueNewSeverity" class="form-select">' + ISSUE_SEVERITIES.map(function(s) {
      return '<option' + ((prefill.severity || 'Medium') === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select></div>'
    + '<div class="form-group" style="margin:0"><label class="form-label">Due date</label>'
    + '<input id="issueNewDue" type="date" class="form-input" value="' + escapeHTML(prefill.dueDate || '') + '"></div></div>'
    + '<div class="form-group"><label class="form-label">Assignee</label>'
    + '<input id="issueNewAssignee" class="form-input" placeholder="Name or email"></div>'
    + '<div class="form-group"><label class="form-label">Remediation plan</label>'
    + '<textarea id="issueNewPlan" class="form-input" rows="2"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">'
    + '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\'riskModalOverlay\').remove()">Cancel</button>'
    + '<button type="button" class="btn btn-primary" onclick="submitNewIssueFromModal()">Add</button>'
    + '</div></div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function submitNewIssueFromModal() {
  var ctrl = (document.getElementById('issueNewControl') || {}).value || '';
  var item = addIssue({
    title: (document.getElementById('issueNewTitle') || {}).value || '',
    description: (document.getElementById('issueNewDesc') || {}).value || '',
    controlIds: ctrl ? [ctrl] : [],
    severity: (document.getElementById('issueNewSeverity') || {}).value || 'Medium',
    dueDate: (document.getElementById('issueNewDue') || {}).value || '',
    assigneeName: (document.getElementById('issueNewAssignee') || {}).value || '',
    remediationPlan: (document.getElementById('issueNewPlan') || {}).value || '',
    source: state._issueModalSource || 'manual',
    sourceKey: state._issueModalSourceKey || '',
    scopeId: state._issueModalScopeId || ''
  });
  state._issueModalSource = '';
  state._issueModalSourceKey = '';
  state._issueModalScopeId = '';
  if (item) {
    var ov = document.getElementById('riskModalOverlay');
    if (ov) ov.remove();
    showToast('Issue added.');
  }
}

function openRaiseIssueFromSspReview(scopeId, controlId, isProcess) {
  var draft = typeof ensureSspReviewerDraft === 'function' ? ensureSspReviewerDraft(scopeId) : { byControl: {} };
  var comment = String((draft.byControl || {})[controlId] || '').trim();
  var scopeName = scopeNameForId(scopeId);
  state._riskView = 'issues';
  showTab('risk');
  openAddIssueModal({
    title: controlId + ' — SSP review finding',
    description: comment || ('Reviewer raised an issue for ' + controlId + ' on ' + scopeName + '.'),
    controlIds: [controlId],
    scopeId: scopeId,
    source: 'ssp-review',
    severity: 'Medium'
  });
}

function exportIssuesCsv() {
  ensureRiskState();
  var rows = [['Severity', 'Title', 'Description', 'Controls', 'Scope', 'Status', 'Due', 'Assignee', 'Remediation']];
  state.issues.forEach(function(i) {
    rows.push([
      i.severity || '',
      i.title || '',
      (i.description || '').replace(/\n/g, ' '),
      (i.controlIds || []).join('; '),
      scopeNameForId(i.scopeId),
      i.status || '',
      i.dueDate || '',
      i.assigneeName || '',
      (i.remediationPlan || '').replace(/\n/g, ' ')
    ]);
  });
  var csv = rows.map(function(r) {
    return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'issues-export-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildRiskHeatMapHtml() {
  var grid = {};
  RISK_IMPACTS.forEach(function(im) {
    RISK_LIKELIHOODS.forEach(function(li) {
      grid[im + ':' + li] = 0;
    });
  });
  (state.risks || []).filter(riskIsOpen).forEach(function(r) {
    var k = r.impact + ':' + r.likelihood;
    if (grid[k] !== undefined) grid[k]++;
  });
  var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">';
  RISK_IMPACTS.slice().reverse().forEach(function(im) {
    html += '<div style="display:flex;flex-direction:column;gap:4px;">';
    RISK_LIKELIHOODS.forEach(function(li) {
      var n = grid[im + ':' + li] || 0;
      var rating = computeRiskRating(li, im);
      html += '<div style="width:52px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;" class="' + riskRatingClass(rating) + '">' + n + '</div>';
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function filterRiskRegisterItems() {
  ensureRiskState();
  var filter = state._riskFilter || 'open';
  var search = (state._riskSearch || '').toLowerCase();
  var scoped = !canSessionTriageRisk();
  var tokens = sessionIdentityTokens();
  return state.risks.filter(function(r) {
    if (scoped) {
      var mine = identityMatchesField(r.ownerName, tokens) || identityMatchesField(r.ownerEmail, tokens) || r.status === 'Proposed';
      if (!mine) return false;
    }
    if (filter === 'open' && r.status === 'Closed') return false;
    if (filter === 'accepted' && r.status !== 'Accepted') return false;
    if (search) {
      var blob = (r.title + ' ' + r.statement + ' ' + (r.ownerName || '')).toLowerCase();
      if (blob.indexOf(search) === -1) return false;
    }
    return true;
  });
}

function filterIssueItems() {
  ensureRiskState();
  var filter = state._issueFilter || 'open';
  var search = (state._issueSearch || '').toLowerCase();
  var today = new Date().toISOString().slice(0, 10);
  var scoped = !canSessionTriageRisk();
  var tokens = sessionIdentityTokens();
  return state.issues.filter(function(i) {
    if (scoped) {
      var mine = identityMatchesField(i.assigneeName, tokens) || identityMatchesField(i.assigneeEmail, tokens) || i.status === 'Proposed';
      if (!mine) return false;
    }
    if (filter === 'open' && !issueIsOpen(i)) return false;
    if (filter === 'overdue' && (!i.dueDate || i.dueDate >= today || !issueIsOpen(i))) return false;
    if (filter === 'closed' && i.status !== 'Closed' && i.status !== 'Verified') return false;
    if (search) {
      var blob = (i.title + ' ' + i.description + ' ' + (i.controlIds || []).join(' ') + ' ' + (i.assigneeName || '')).toLowerCase();
      if (blob.indexOf(search) === -1) return false;
    }
    return true;
  });
}

function renderTriageViewHtml() {
  var suggestions = getTriageSuggestions();
  if (!canSessionTriageRisk()) {
    return '<div class="empty-state" style="padding:32px;"><div class="es-title">Triage queue</div>'
      + '<p>Suggested risks and issues from Phase 1 signals appear here for CISO, ISSM, or the program owner to review.</p></div>';
  }
  if (!suggestions.length) {
    return '<div class="empty-state" style="padding:32px;"><div class="es-icon">✓</div><div class="es-title">Nothing to triage</div>'
      + '<p>No new suggestions from SSP attestations, missed deadlines, test failures, or ATO conditions.</p></div>';
  }
  var cards = suggestions.map(function(s) {
    var keyJs = riskEscJs(s.key);
    return '<div style="background:var(--white);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:16px 18px;margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
      + '<div><div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Suggested ' + escapeHTML(s.kind) + '</div>'
      + '<div style="font-size:15px;font-weight:700;margin:4px 0;">' + escapeHTML(s.title) + '</div>'
      + '<div style="font-size:12px;color:#475569;line-height:1.5;">' + escapeHTML(s.desc) + '</div></div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;">'
      + '<button type="button" class="btn btn-primary btn-sm" onclick="promoteTriageSuggestion(\'' + keyJs + '\',\'issue\')">→ Issue</button>'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="promoteTriageSuggestion(\'' + keyJs + '\',\'risk\')">→ Risk</button>'
      + '<button type="button" class="btn btn-secondary btn-sm" onclick="dismissTriageSuggestion(\'' + keyJs + '\')">Dismiss</button>'
      + '</div></div></div>';
  }).join('');
  return '<div style="margin-bottom:12px;font-size:13px;color:var(--text-muted);">'
    + suggestions.length + ' suggestion' + (suggestions.length === 1 ? '' : 's') + ' from Phase 1 — promote to the register or dismiss (recorded for audit).</div>'
    + cards;
}

function renderRiskRegisterViewHtml() {
  var items = filterRiskRegisterItems();
  items.sort(function(a, b) {
    var ra = computeRiskRating(a.likelihood, a.impact);
    var rb = computeRiskRating(b.likelihood, b.impact);
    var order = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
    return (order[ra] || 9) - (order[rb] || 9);
  });
  var filter = state._riskFilter || 'open';
  var rows = items.map(function(r) {
    var rating = computeRiskRating(r.likelihood, r.impact);
    var idJs = riskEscJs(r.id);
    var acceptBtn = (r.status !== 'Accepted' && r.status !== 'Closed' && canSessionAcceptRisk(r))
      ? '<button type="button" class="btn btn-secondary btn-sm" onclick="openAcceptRiskModal(\'' + idJs + '\')">Accept</button> '
      : '';
    var sel = state._selectedRiskId === r.id ? ' poam-row-selected' : '';
    return '<tr class="' + sel.trim() + '" data-risk-id="' + escapeHTML(r.id) + '">'
      + '<td><span class="poam-sev-pill ' + riskRatingClass(rating) + '">' + escapeHTML(rating) + '</span></td>'
      + '<td style="font-weight:700;font-size:13px;">' + escapeHTML(r.title) + '</td>'
      + '<td style="font-size:12px;max-width:280px;">' + escapeHTML((r.statement || '').slice(0, 120)) + '</td>'
      + '<td>' + escapeHTML(r.treatment || '—') + '</td>'
      + '<td>' + escapeHTML(r.ownerName || '—') + '</td>'
      + '<td><select class="form-select poam-inline-select" onchange="updateRiskField(\'' + idJs + '\',\'status\',this.value);setTimeout(renderRiskTab,0);">'
      + RISK_STATUSES.map(function(s) {
        return '<option' + (r.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') + '</select></td>'
      + '<td style="white-space:nowrap;">' + acceptBtn
      + '<button type="button" class="btn btn-secondary btn-sm" style="color:var(--red);" onclick="deleteRiskItem(\'' + idJs + '\')">Delete</button></td>'
      + '</tr>';
  }).join('');
  return buildRiskHeatMapHtml()
    + '<div class="poam-toolbar">'
    + '<input class="form-input" placeholder="Search risks…" value="' + escapeHTML(state._riskSearch || '') + '" oninput="state._riskSearch=this.value;renderRiskTab();" style="max-width:260px;">'
    + ['open', 'accepted', 'all'].map(function(f) {
      return '<button type="button" class="poam-filter-chip' + (filter === f ? ' active' : '') + '" onclick="state._riskFilter=\'' + f + '\';renderRiskTab();">' + f + '</button>';
    }).join('')
    + '<button type="button" class="btn btn-primary" style="margin-left:auto;" onclick="openAddRiskModal()">+ New risk</button>'
    + '</div>'
    + '<div class="poam-table-wrap"><table class="control-table poam-table"><thead><tr>'
    + '<th>Rating</th><th>Title</th><th>Statement</th><th>Treatment</th><th>Owner</th><th>Status</th><th></th>'
    + '</tr></thead><tbody>'
    + (rows || '<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted);">No risks in the register yet.</td></tr>')
    + '</tbody></table></div>';
}

function renderIssuesViewHtml() {
  var items = filterIssueItems();
  var today = new Date().toISOString().slice(0, 10);
  var filter = state._issueFilter || 'open';
  items.sort(function(a, b) {
    var sa = ISSUE_SEVERITIES.indexOf(a.severity);
    var sb = ISSUE_SEVERITIES.indexOf(b.severity);
    if (sa !== sb) return sa - sb;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });
  var rows = items.map(function(i) {
    var isOverdue = i.dueDate && i.dueDate < today && issueIsOpen(i);
    var idJs = riskEscJs(i.id);
    var verifyBtn = (issueIsOpen(i) && i.status === 'Remediated' && canSessionVerifyIssue(i))
      ? '<button type="button" class="btn btn-primary btn-sm" onclick="openVerifyIssueModal(\'' + idJs + '\')">Verify</button> '
      : '';
    var ctrl = (i.controlIds && i.controlIds[0]) ? i.controlIds[0] : '—';
    var sel = state._selectedIssueId === i.id ? ' poam-row-selected' : '';
    return '<tr class="poam-row' + (isOverdue ? ' poam-row-overdue' : '') + sel + '" data-issue-id="' + escapeHTML(i.id) + '">'
      + '<td><span class="poam-sev-pill ' + issueSeverityClass(i.severity) + '">' + escapeHTML(i.severity) + '</span></td>'
      + '<td style="font-weight:700;font-size:13px;">' + escapeHTML(i.title) + '</td>'
      + '<td style="font-family:monospace;font-size:12px;">' + escapeHTML(ctrl) + '</td>'
      + '<td style="font-size:12px;">' + escapeHTML(scopeNameForId(i.scopeId) || '—') + '</td>'
      + '<td><select class="form-select poam-inline-select" onchange="updateIssueField(\'' + idJs + '\',\'status\',this.value);setTimeout(renderRiskTab,0);">'
      + ISSUE_STATUSES.map(function(s) {
        return '<option' + (i.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') + '</select></td>'
      + '<td><input type="date" class="form-input poam-inline-date" value="' + escapeHTML(i.dueDate || '') + '" onchange="updateIssueField(\'' + idJs + '\',\'dueDate\',this.value);renderRiskTab();"></td>'
      + '<td><input class="form-input poam-inline-input" value="' + escapeHTML(i.assigneeName || '') + '" oninput="updateIssueField(\'' + idJs + '\',\'assigneeName\',this.value)"></td>'
      + '<td style="white-space:nowrap;">' + verifyBtn
      + '<button type="button" class="btn btn-secondary btn-sm" style="color:var(--red);" onclick="deleteIssueItem(\'' + idJs + '\')">Delete</button></td>'
      + '</tr>';
  }).join('');
  var open = getIssueOpenCount();
  var overdue = getIssueOverdueCount();
  return '<div class="poam-stats">'
    + '<div class="poam-stat-card"><div class="poam-stat-num">' + open + '</div><div class="poam-stat-label">Open items</div></div>'
    + '<div class="poam-stat-card poam-stat-warn"><div class="poam-stat-num">' + overdue + '</div><div class="poam-stat-label">Overdue</div></div>'
    + '<div class="poam-stat-card"><div class="poam-stat-num">' + state.issues.length + '</div><div class="poam-stat-label">Total tracked</div></div>'
    + '<button type="button" class="btn btn-primary" style="margin-left:auto;align-self:center;" onclick="openAddIssueModal()">+ New issue</button>'
    + (hasPm4PoamControl() ? '<button type="button" class="btn btn-secondary" style="align-self:center;" onclick="exportIssuesCsv()">Export CSV</button>' : '')
    + '</div>'
    + '<div class="poam-toolbar">'
    + '<input class="form-input" placeholder="Search…" value="' + escapeHTML(state._issueSearch || '') + '" oninput="state._issueSearch=this.value;renderRiskTab();" style="max-width:260px;">'
    + ['open', 'overdue', 'all', 'closed'].map(function(f) {
      return '<button type="button" class="poam-filter-chip' + (filter === f ? ' active' : '') + '" onclick="state._issueFilter=\'' + f + '\';renderRiskTab();">' + f + '</button>';
    }).join('')
    + '</div>'
    + '<div class="poam-table-wrap"><table class="control-table poam-table"><thead><tr>'
    + '<th>Severity</th><th>Title</th><th>Control</th><th>Scope</th><th>Status</th><th>Due</th><th>Assignee</th><th></th>'
    + '</tr></thead><tbody>'
    + (rows || '<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--text-muted);">No issues yet.</td></tr>')
    + '</tbody></table></div>';
}

function renderRiskTab() {
  var body = document.getElementById('risk-body');
  if (!body) return;
  ensureRiskState();
  var view = state._riskView || 'triage';
  var triageCount = getTriagePendingCount();
  var tabs = [
    { id: 'triage', label: 'Triage' + (triageCount ? ' (' + triageCount + ')' : '') },
    { id: 'risks', label: 'Risk register' },
    { id: 'issues', label: getIssuesViewLabel() }
  ];
  var tabHtml = tabs.map(function(t) {
    return '<button type="button" class="poam-filter-chip' + (view === t.id ? ' active' : '') + '" onclick="state._riskView=\'' + t.id + '\';renderRiskTab();">' + escapeHTML(t.label) + '</button>';
  }).join('');
  var content = view === 'triage' ? renderTriageViewHtml()
    : view === 'risks' ? renderRiskRegisterViewHtml()
    : renderIssuesViewHtml();
  body.innerHTML = '<div class="poam-toolbar" style="margin-bottom:20px;">' + tabHtml + '</div>' + content;
  var hdr = document.getElementById('risk-page-subtitle');
  if (hdr) hdr.textContent = getRiskTabSubtitle();
  scrollRiskTabSelectionIntoView();
}

function scrollRiskTabSelectionIntoView() {
  setTimeout(function() {
    var row = null;
    if (state._selectedRiskId) {
      row = document.querySelector('[data-risk-id="' + state._selectedRiskId.replace(/"/g, '\\"') + '"]');
    } else if (state._selectedIssueId) {
      row = document.querySelector('[data-issue-id="' + state._selectedIssueId.replace(/"/g, '\\"') + '"]');
    }
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, 0);
}

function isPhase2LiveForUser(user) {
  if (!state.cisoComplete || !state.baseline) return false;
  if (!user) return true;
  if (typeof getPersonVisibleTabIds === 'function') {
    return getPersonVisibleTabIds(user).indexOf('risk') !== -1;
  }
  return false;
}

function getSidebarScopedRisks() {
  var items = filterRiskRegisterItems().filter(function(r) {
    return r.status !== 'Closed';
  });
  items.sort(function(a, b) {
    var ra = computeRiskRating(a.likelihood, a.impact);
    var rb = computeRiskRating(b.likelihood, b.impact);
    var order = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
    return (order[ra] || 9) - (order[rb] || 9);
  });
  return items.slice(0, 15);
}

function getSidebarScopedIssues() {
  var today = new Date().toISOString().slice(0, 10);
  var items = filterIssueItems().filter(issueIsOpen);
  items.sort(function(a, b) {
    var sa = ISSUE_SEVERITIES.indexOf(a.severity);
    var sb = ISSUE_SEVERITIES.indexOf(b.severity);
    if (sa !== sb) return sa - sb;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });
  return items.slice(0, 15);
}

function toggleSidebarRiskList(forceOpen) {
  if (typeof toggleSidebarReportsList === 'function') {
    toggleSidebarReportsList(forceOpen === false ? false : true);
  }
}

function goToRiskWorkspace() {
  if (!state.cisoComplete) {
    if (typeof showTab === 'function') showTab('ciso');
    return;
  }
  state._reportsLibraryView = null;
  state._selectedRiskId = null;
  state._selectedIssueId = null;
  if (typeof canSessionTriageRisk === 'function' && canSessionTriageRisk() && getTriagePendingCount() > 0) {
    state._riskView = 'triage';
  } else {
    state._riskView = 'issues';
  }
  if (typeof toggleSidebarReportsList === 'function') toggleSidebarReportsList(true);
  showTab('risk');
}

function openRiskFromSidebar(riskId) {
  state._selectedRiskId = riskId;
  state._selectedIssueId = null;
  state._riskView = 'risks';
  state._riskFilter = 'all';
  state._riskSearch = '';
  toggleSidebarRiskList(true);
  showTab('risk');
}

function openIssueFromSidebar(issueId) {
  state._selectedIssueId = issueId;
  state._selectedRiskId = null;
  state._riskView = 'issues';
  state._issueFilter = 'all';
  state._issueSearch = '';
  toggleSidebarRiskList(true);
  showTab('risk');
}

/** Risks & Issues Reports sub-nav (visible after setup for roles with risk access). */
function renderSidebarRiskInventory() {
  var navRisk = document.getElementById('nav-reports-library-risks');
  if (!navRisk) return;

  var user = state.currentUserId && state.users
    ? state.users.find(function(u) { return u.id === state.currentUserId; })
    : null;
  var live = isPhase2LiveForUser(user);
  navRisk.style.display = live ? '' : 'none';
}

function renderRiskSummaryHtml() {
  ensureRiskState();
  var open = getCombinedOpenRiskIssueCount();
  var triage = getTriagePendingCount();
  if (!open && !triage) return '';
  var label = hasPm4PoamControl() ? 'risks & POA&M' : 'risks & issues';
  return '<div class="hub-poam-strip" role="button" tabindex="0" onclick="showTab(\'risk\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();showTab(\'risk\');}">'
    + '<div><strong>' + open + '</strong> open ' + label
    + (triage ? ' · <span style="color:#b45309;">' + triage + ' to triage</span>' : '')
    + (getIssueOverdueCount() ? ' · <span style="color:var(--red);">' + getIssueOverdueCount() + ' overdue</span>' : '')
    + '</div><span class="hub-link">View →</span></div>';
}

function renderRiskPosturePanelHtml() {
  ensureRiskState();
  if (!state.baseline) return '';
  var openIssues = getIssueOpenCount();
  var openRisks = getRiskOpenCount();
  var overdue = getIssueOverdueCount();
  var triage = getTriagePendingCount();
  var expiring = (state.risks || []).filter(function(r) {
    if (!r.acceptance || !r.acceptance.expiresAt) return false;
    var exp = r.acceptance.expiresAt;
    var in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return exp <= in30.toISOString().slice(0, 10) && r.status === 'Accepted';
  }).length;
  var topOverdue = state.issues.filter(function(i) {
    return issueIsOpen(i) && i.dueDate && i.dueDate < new Date().toISOString().slice(0, 10);
  }).slice(0, 5);
  var list = topOverdue.map(function(i) {
    return '<li style="font-size:12px;margin:4px 0;">' + escapeHTML(i.severity) + ' — ' + escapeHTML(i.title) + ' (due ' + escapeHTML(i.dueDate) + ')</li>';
  }).join('');
  // Only surface this panel when something actually needs attention — raw open
  // counts already live on the Command Center. (Redesign 2026-07-04.)
  var actionable = overdue || expiring || (canSessionTriageRisk() && triage);
  if (!actionable) return '';
  var parts = [];
  if (overdue) parts.push('<span><strong>' + overdue + '</strong> overdue ' + (hasPm4PoamControl() ? 'POA&M item' : 'issue') + (overdue === 1 ? '' : 's') + '</span>');
  if (canSessionTriageRisk() && triage) parts.push('<span><strong>' + triage + '</strong> pending triage</span>');
  if (expiring) parts.push('<span style="color:#b45309;"><strong>' + expiring + '</strong> acceptance' + (expiring === 1 ? '' : 's') + ' expiring ≤30d</span>');
  return '<div style="background:white;border:1px solid var(--border);border-left:3px solid var(--amber);border-radius:10px;padding:14px 18px;margin:0 0 20px;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
    + '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">'
    + '<span style="font-size:13px;font-weight:700;color:var(--navy);">Risks &amp; issues</span>'
    + '<span style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#475569;">' + parts.join('') + '</span></div>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="showTab(\'risk\')">Open →</button></div>'
    + (list ? '<ul style="margin:10px 0 0;padding-left:18px;color:#78350f;">' + list + '</ul>' : '')
    + '</div>';
}

function getRiskHubNextActions() {
  var actions = [];
  var today = new Date().toISOString().slice(0, 10);
  if (canSessionTriageRisk()) {
    var triage = getTriagePendingCount();
    if (triage > 0) {
      actions.push({ priority: 0, icon: '🔍', label: triage + ' item' + (triage === 1 ? '' : 's') + ' to triage', desc: 'Review Phase 1 signals and promote or dismiss.', action: "state._riskView='triage';showTab('risk');" });
    }
  }
  var tokens = sessionIdentityTokens();
  (state.issues || []).forEach(function(i) {
    if (!issueIsOpen(i) || !i.dueDate) return;
    var mine = canSessionTriageRisk() || identityMatchesField(i.assigneeName, tokens) || identityMatchesField(i.assigneeEmail, tokens);
    if (!mine) return;
    if (i.dueDate < today) {
      actions.push({ priority: 1, icon: '⚠️', label: 'Overdue: ' + i.title.slice(0, 40), desc: 'Due ' + i.dueDate, action: "state._riskView='issues';showTab('risk');" });
    } else if (i.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) {
      actions.push({ priority: 3, icon: '📅', label: 'Due soon: ' + i.title.slice(0, 40), desc: 'Due ' + i.dueDate, action: "state._riskView='issues';showTab('risk');" });
    }
  });
  (state.risks || []).forEach(function(r) {
    if (!riskIsOpen(r) || !r.reviewBy || r.reviewBy >= today) return;
    var mine = canSessionTriageRisk() || identityMatchesField(r.ownerName, tokens) || identityMatchesField(r.ownerEmail, tokens);
    if (!mine) return;
    actions.push({ priority: 2, icon: '📋', label: 'Review risk: ' + r.title.slice(0, 40), desc: 'Past review date ' + r.reviewBy, action: "state._riskView='risks';showTab('risk');" });
  });
  (state.risks || []).forEach(function(r) {
    if (r.status !== 'Accepted' || !r.acceptance || !r.acceptance.expiresAt) return;
    var exp = r.acceptance.expiresAt;
    var in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    if (exp > in30.toISOString().slice(0, 10)) return;
    if (!canSessionAcceptRisk(r) && !canSessionTriageRisk()) return;
    actions.push({ priority: 1, icon: '⏳', label: 'Acceptance expiring: ' + r.title.slice(0, 36), desc: 'Expires ' + exp, action: "state._riskView='risks';showTab('risk');" });
  });
  return actions;
}

function getRiskOverdueBadgeCount() {
  return getIssueOverdueCount() + (canSessionTriageRisk() ? getTriagePendingCount() : 0);
}

try {
  window.renderRiskTab = renderRiskTab;
  window.addIssue = addIssue;
  window.addRisk = addRisk;
  window.getIssueOpenCount = getIssueOpenCount;
  window.getRiskOpenCount = getRiskOpenCount;
  window.getCombinedOpenRiskIssueCount = getCombinedOpenRiskIssueCount;
  window.getRiskOverdueBadgeCount = getRiskOverdueBadgeCount;
  window.renderRiskSummaryHtml = renderRiskSummaryHtml;
  window.renderRiskPosturePanelHtml = renderRiskPosturePanelHtml;
  window.getRiskHubNextActions = getRiskHubNextActions;
  window.openRaiseIssueFromSspReview = openRaiseIssueFromSspReview;
  window.getScopedIssueOpenCount = getScopedIssueOpenCount;
  window.getTriagePendingCount = getTriagePendingCount;
  window.toggleSidebarRiskList = toggleSidebarRiskList;
  window.goToRiskWorkspace = goToRiskWorkspace;
  window.openRiskFromSidebar = openRiskFromSidebar;
  window.openIssueFromSidebar = openIssueFromSidebar;
  window.renderSidebarRiskInventory = renderSidebarRiskInventory;
  window.isPhase2LiveForUser = isPhase2LiveForUser;
} catch (e) {}
