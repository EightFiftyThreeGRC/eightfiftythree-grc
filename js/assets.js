// js/assets.js — assets, SSP, process SSP, type catalog & libraries. Split from app.js (Step 5).
// Globals only; load after controls.js.

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
  { category: 'Process', types: [
    { key: 'proc_risk_mgmt',     label: 'Risk Management' },
    { key: 'proc_vuln_mgmt',     label: 'Vulnerability Management' },
    { key: 'proc_iam',           label: 'Identity & Access Management' },
    { key: 'proc_config_change', label: 'Configuration & Change Management' },
    { key: 'proc_supply_chain',  label: 'Third-Party / Supply Chain Management' },
    { key: 'proc_incident_resp', label: 'Incident Response' },
    { key: 'proc_bcp',           label: 'Business Continuity & Contingency' },
    { key: 'proc_awareness',     label: 'Security Awareness & Training' },
  ]},
];
const SSP_STATUSES = ['Complies','Partially Complies','Does Not Comply','Not Applicable','Inherited'];
const SSP_STATUS_COLORS = {'Complies':'var(--green)','Partially Complies':'var(--amber)','Does Not Comply':'var(--red)','Not Applicable':'var(--slate)','Inherited':'var(--blue)'};

// ─── NIST 800-60 INFORMATION TYPES (catalog) ─────────────────────────────────
// CIA seeds are calibrated to NIST SP 800-60 Vol II provisional values — agencies
// tailor up or down based on their context. Seeds here are deliberately moderate
// so a single selection rarely forces High; PHI / regulated financial / mission-
// critical land on High; generic ops data lands on Low; most other types land on
// Moderate (matches real FedRAMP / FISMA practice).
var INFO_TYPES_800_60 = [
  { id: 'C.1',     label: 'C.1 Mission information',
    desc: 'Core data that drives your primary mission or line of business — the master records your organization exists to manage. Tailor up to High if the mission is life-safety, national security, or critical infrastructure.',
    examples: 'Case files for a legal firm, patient charts for a hospital, academic records for a university, customer transactions for a bank.',
    cia: { c: 'M', i: 'M', a: 'M' } },
  { id: 'C.2.1',   label: 'C.2.1 Security information',
    desc: 'Data that protects the system itself: configurations, credentials, logs, vulnerability findings, incident records. Integrity matters most — tampered logs or configs do real harm.',
    examples: 'Firewall rules, admin passwords, SIEM log archives, vuln scan results, incident tickets, audit reports.',
    cia: { c: 'L', i: 'M', a: 'L' } },
  { id: 'C.2.2',   label: 'C.2.2 Personal data (PII, non-health)',
    desc: 'Information that identifies a specific person — anything that could be used for identity theft or privacy harm. Tailor up to High if the system holds SSNs, biometrics, or large-scale identity records.',
    examples: 'Names, dates of birth, home addresses, driver license numbers, employee HR records, customer contact lists.',
    cia: { c: 'M', i: 'M', a: 'L' } },
  { id: 'C.2.5',   label: 'C.2.5 Health information (PHI)',
    desc: 'Any health or medical record covered by HIPAA or equivalent privacy law. HIPAA confidentiality drives a High C; integrity / availability are typically Moderate unless clinical-care safety is at stake.',
    examples: 'Patient medical records, insurance claims, prescriptions, lab results, mental health notes.',
    cia: { c: 'H', i: 'M', a: 'M' } },
  { id: 'C.2.6',   label: 'C.2.6 Regulated financial data (PCI, banking)',
    desc: 'Payment card data, bank account numbers, or other regulated financial records subject to PCI DSS, GLBA, or similar regimes. Use C.2.8.9 instead for routine internal financial reporting.',
    examples: 'Credit card PANs, ACH bank account numbers, payment processing data, regulated trading records.',
    cia: { c: 'H', i: 'M', a: 'L' } },
  { id: 'C.2.8.9', label: 'C.2.8.9 General operational data',
    desc: 'Routine day-to-day operational data with no sensitive or regulated content. Most internal collaboration and back-office records live here.',
    examples: 'Office floor plans, meeting agendas, internal communications, procurement catalogs, vendor lists, internal financial reporting.',
    cia: { c: 'L', i: 'L', a: 'L' } }
];

// Plain-English scenario framing for each FIPS 199 impact dimension.
// Used by renderAssetCIAGuidedPicker() so asset owners (who typically don't know FIPS 199)
// can reason about their system through "what's the worst-case impact if …" questions.
var FIPS199_GUIDANCE = {
  confidentiality: {
    scenario: 'If the data in this system were disclosed to unauthorized people, what would the worst-case impact be?',
    levels: [
      { v: 'L', label: 'Low',
        hint: 'Limited impact. The data is already public, routine, or non-sensitive — disclosure would cause at most minor embarrassment or inconvenience.',
        examples: 'Public marketing content, published research, meeting room bookings, office floor plans.' },
      { v: 'M', label: 'Moderate',
        hint: 'Serious harm. Non-public business data, internal records, or personal data that could be misused, embarrass individuals, or damage the organization.',
        examples: 'Employee contact lists, internal strategy docs, customer lists, non-sensitive PII.' },
      { v: 'H', label: 'High',
        hint: 'Catastrophic harm. Regulated data or data whose loss would cause severe financial, legal, safety, or reputational damage.',
        examples: 'PHI/HIPAA, SSNs, payment card (PCI) data, bank account numbers, trade secrets, national-security info.' }
    ]
  },
  integrity: {
    scenario: 'If the data in this system were altered or corrupted without detection, what would the worst-case impact be?',
    levels: [
      { v: 'L', label: 'Low',
        hint: 'Limited impact. Errors cause at most minor inconvenience. Data can be easily verified or restored from another source.',
        examples: 'Draft documents, internal wiki pages, non-authoritative reports.' },
      { v: 'M', label: 'Moderate',
        hint: 'Serious impact. Altered data could drive bad business decisions, cause financial loss, or breach a contract / SLA.',
        examples: 'Customer order history, invoice records, HR records, configuration management data.' },
      { v: 'H', label: 'High',
        hint: 'Catastrophic impact. Altered data could cause loss of life, fraud at scale, major regulatory violations, or mission failure.',
        examples: 'Financial ledgers, medical records, safety controls, audit logs, access-control records.' }
    ]
  },
  availability: {
    scenario: 'If this system were unavailable (down or inaccessible), what would the worst-case impact be?',
    levels: [
      { v: 'L', label: 'Low',
        hint: 'Limited impact. Hours of downtime are tolerable. Workarounds exist; no customers or mission-critical processes depend on it.',
        examples: 'Internal KB, non-critical reporting dashboards, dev/test environments.' },
      { v: 'M', label: 'Moderate',
        hint: 'Serious impact. Extended outage (roughly > 1 day) causes significant operational disruption or financial loss.',
        examples: 'Customer-facing web app, payroll processing, internal collaboration platforms.' },
      { v: 'H', label: 'High',
        hint: 'Catastrophic impact. Any meaningful outage threatens life safety, critical operations, regulatory/SLA compliance, or primary mission function.',
        examples: 'Emergency dispatch, clinical systems, trading platforms, industrial control systems.' }
    ]
  }
};

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
          var isElev = typeof isElevatedCustomAssetTypeName === 'function' && isElevatedCustomAssetTypeName(row.label);
          var sourceLabel = isElev ? 'ELEVATED' : row.source;
          var typeCell = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
            + '<span style="font-size:12px;color:var(--navy);font-weight:600;">' + escapeHTML(row.label) + '</span>'
            + (isElev ? '<span style="font-size:9px;font-weight:800;letter-spacing:0.04em;padding:2px 7px;border-radius:6px;background:linear-gradient(135deg,#fff7ed,#fef2f2);color:#b45309;border:1px solid #fdba74;">ELEVATED · catalog subtype</span>' : '')
            + '</div>';
          var groupCell = '<span style="font-size:12px;color:var(--text-muted);">' + escapeHTML(selected) + '</span>';
          if (row.isCustom && canApprove) {
            groupCell = '<select class="form-select" style="font-size:12px;" onchange="state.customAssetTypeGroups[\'' + safeType + '\']=this.value;markDirty();renderAssetTypeLibrary();">' + groups.map(function(g){ return '<option' + (selected===g?' selected':'') + '>' + escapeHTML(g) + '</option>'; }).join('') + '</select>';
          }
          return '<tr><td>' + typeCell + '</td>'
            + '<td style="font-size:11px;color:#334155;font-weight:700;text-transform:uppercase;">' + escapeHTML(sourceLabel) + '</td>'
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

// ─── FIPS 199 + program baseline (V2/V3 baseline elevation) ─────────────────
function getProgramBaselineFipsLetter() {
  if (typeof resolveProgramBaseline === 'function') {
    var eff = resolveProgramBaseline();
    if (eff === 'L' || eff === 'M' || eff === 'H') return eff;
  }
  var b = state.baseline;
  if (b === 'L' || b === 'M' || b === 'H') return b;
  return 'L';
}

function _fipsOrder(ch) {
  return { L: 1, M: 2, H: 3 }[ch] || 0;
}

function _normFipsLetter(v) {
  var s = String(v == null ? '' : v).trim().toUpperCase();
  if (s === 'MODERATE' || s === 'M') return 'M';
  if (s === 'HIGH' || s === 'H') return 'H';
  return 'L';
}

/** High-water security impact from FIPS 199-style CIA triplet. */
function computeAssetOverallFipsImpact(cat) {
  if (!cat || typeof cat !== 'object') return 'L';
  var c = _normFipsLetter(cat.confidentiality);
  var i = _normFipsLetter(cat.integrity);
  var a = _normFipsLetter(cat.availability);
  var m = Math.max(_fipsOrder(c), _fipsOrder(i), _fipsOrder(a));
  return m === 3 ? 'H' : m === 2 ? 'M' : 'L';
}

function ensureAssetCategorizationRow(assetId) {
  if (!state.assetCategorization) state.assetCategorization = {};
  if (!state.assetCategorization[assetId]) {
    state.assetCategorization[assetId] = {
      confidentiality: 'L',
      integrity: 'L',
      availability: 'L',
      rationale: ''
    };
  }
  return state.assetCategorization[assetId];
}

function setAssetCategorizationField(assetId, field, value) {
  ensureAssetCategorizationRow(assetId);
  if (field === 'rationale') {
    state.assetCategorization[assetId].rationale = String(value || '');
    markDirty();
    return;
  }
  if (field === 'confidentiality' || field === 'integrity' || field === 'availability') {
    state.assetCategorization[assetId][field] = _normFipsLetter(value);
  }
  markDirty();
  renderAssetSSPStep1();
}

/** Three radio-card groups (C/I/A) with plain-English scenarios — used in non-FISMA mode. */
function renderAssetCIAGuidedPicker(aid, cat) {
  var fields = [
    { key: 'confidentiality', data: FIPS199_GUIDANCE.confidentiality },
    { key: 'integrity',       data: FIPS199_GUIDANCE.integrity },
    { key: 'availability',    data: FIPS199_GUIDANCE.availability }
  ];
  var aidJson = JSON.stringify(aid);
  return fields.map(function(f) {
    var current = cat[f.key] || 'L';
    var cards = f.data.levels.map(function(o) {
      var sel = (current === o.v);
      var borderColor = sel ? 'var(--teal)' : '#e5e7eb';
      var bg = sel ? '#ecfdf5' : '#fff';
      var badgeBg = sel ? 'var(--teal)' : '#94a3b8';
      var firstSentence = String(o.hint).split('.')[0] + '.';
      var rest = String(o.hint).split('.').slice(1).join('.').trim();
      return '<label style="display:block;border:2px solid ' + borderColor + ';background:' + bg + ';border-radius:8px;padding:10px 12px;margin-bottom:6px;cursor:pointer;transition:border-color .15s, background .15s;">'
        + '<div style="display:flex;gap:10px;align-items:flex-start;">'
        + '<input type="radio" name="cia_' + f.key + '_' + escapeHTML(String(aid)) + '" value="' + o.v + '"' + (sel ? ' checked' : '')
        + ' onchange="setAssetCategorizationField(' + aidJson + ',\'' + f.key + '\',\'' + o.v + '\');setTimeout(function(){ if (typeof renderAssetSSPStep1===\'function\') renderAssetSSPStep1(); },0)" style="margin-top:3px;">'
        + '<div style="flex:1;">'
        + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:3px;">'
        + '<span style="background:' + badgeBg + ';color:#fff;font-size:10px;font-weight:800;letter-spacing:0.5px;padding:2px 8px;border-radius:10px;">' + o.label.toUpperCase() + '</span>'
        + '<span style="font-weight:700;font-size:13px;color:var(--navy);">' + _esc(firstSentence) + '</span>'
        + '</div>'
        + '<div style="font-size:12px;color:#475569;line-height:1.45;">' + _esc(rest) + '</div>'
        + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;"><em>Examples: ' + _esc(o.examples) + '</em></div>'
        + '</div></div></label>';
    }).join('');
    var labelMap = { confidentiality: 'Confidentiality', integrity: 'Integrity', availability: 'Availability' };
    return '<div style="margin-bottom:18px;">'
      + '<div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:2px;">' + labelMap[f.key] + '</div>'
      + '<div style="font-size:12px;color:#475569;margin-bottom:8px;line-height:1.45;">' + _esc(f.data.scenario) + '</div>'
      + cards
      + '</div>';
  }).join('');
}

/** FISMA mode: recompute per-axis C/I/A as high-water mark of selected info types' CIA seeds. */
function applyAssetCategorizationFromInfoTypes(aid) {
  var cat = (state.assetCategorization || {})[aid];
  if (!cat) return;
  var idx = {};
  if (typeof INFO_TYPES_800_60 !== 'undefined') {
    INFO_TYPES_800_60.forEach(function(it) { idx[it.id] = it; });
  }
  var maxC = 1, maxI = 1, maxA = 1;
  (cat.infoTypes || []).forEach(function(row) {
    var it = idx[row.id] || row;
    if (it && it.cia) {
      maxC = Math.max(maxC, _fipsOrder(it.cia.c));
      maxI = Math.max(maxI, _fipsOrder(it.cia.i));
      maxA = Math.max(maxA, _fipsOrder(it.cia.a));
    }
  });
  var letter = function(r) { return r === 3 ? 'H' : r === 2 ? 'M' : 'L'; };
  cat.confidentiality = letter(maxC);
  cat.integrity = letter(maxI);
  cat.availability = letter(maxA);
}

/** FISMA mode: toggle one info type for this asset and recompute C/I/A. Dedup-safe. */
function toggleAssetInfoType(aid, id) {
  ensureAssetCategorizationRow(aid);
  var cat = state.assetCategorization[aid];
  if (!Array.isArray(cat.infoTypes)) cat.infoTypes = [];
  var i = -1;
  for (var k = 0; k < cat.infoTypes.length; k++) { if (cat.infoTypes[k].id === id) { i = k; break; } }
  if (i >= 0) {
    cat.infoTypes.splice(i, 1);
  } else {
    var meta = (typeof INFO_TYPES_800_60 !== 'undefined')
      ? INFO_TYPES_800_60.find(function(x) { return x.id === id; })
      : null;
    if (!meta) return;
    cat.infoTypes.push({ id: meta.id, label: meta.label, cia: Object.assign({}, meta.cia) });
  }
  applyAssetCategorizationFromInfoTypes(aid);
  markDirty();
  setTimeout(function() { try { renderAssetSSPStep1(); } catch (e) {} }, 0);
}

/** FISMA mode: checkbox-grid picker over the 800-60 catalog. */
function renderAssetInfoTypesPicker(aid, cat) {
  if (typeof INFO_TYPES_800_60 === 'undefined') return '';
  var selected = {};
  (cat.infoTypes || []).forEach(function(r) { selected[r.id] = true; });
  var aidJson = JSON.stringify(aid);
  var cards = INFO_TYPES_800_60.map(function(it) {
    var on = !!selected[it.id];
    var border = on ? '2px solid var(--teal)' : '2px solid #e5e7eb';
    var bg = on ? '#ecfdf5' : '#fff';
    var seed = 'C' + it.cia.c + ' / I' + it.cia.i + ' / A' + it.cia.a;
    var seedHigh = Math.max(_fipsOrder(it.cia.c), _fipsOrder(it.cia.i), _fipsOrder(it.cia.a));
    var seedColor = seedHigh === 3 ? '#dc2626' : seedHigh === 2 ? '#d97706' : '#059669';
    return '<label style="display:block;border:' + border + ';background:' + bg + ';border-radius:10px;padding:12px 14px;cursor:pointer;transition:border-color .15s, background .15s;">'
      + '<div style="display:flex;gap:10px;align-items:flex-start;">'
      + '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="toggleAssetInfoType(' + aidJson + ',' + JSON.stringify(it.id) + ')" style="margin-top:3px;flex-shrink:0;">'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:4px;">'
      + '<span style="font-weight:700;font-size:13px;color:var(--navy);">' + _esc(it.label) + '</span>'
      + '<span style="background:' + seedColor + ';color:#fff;font-size:10px;font-weight:800;letter-spacing:0.4px;padding:2px 8px;border-radius:10px;">' + seed + '</span>'
      + '</div>'
      + '<div style="font-size:12px;color:#475569;line-height:1.45;">' + _esc(it.desc || '') + '</div>'
      + (it.examples ? '<div style="font-size:11px;color:var(--text-muted);margin-top:3px;line-height:1.4;"><em>Examples: ' + _esc(it.examples) + '</em></div>' : '')
      + '</div></div></label>';
  }).join('');
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:10px;">' + cards + '</div>';
}

/** Build a starter rationale paragraph from the chosen CIA + info types — saves the asset owner from a blank box. */
function buildAssetCategorizationRationale(asset, cat) {
  var fipsLabels = { L: 'Low', M: 'Moderate', H: 'High' };
  var overall = computeAssetOverallFipsImpact(cat);
  var lines = [];
  lines.push('System: ' + (asset.name || 'this system') + (asset.type ? ' (' + asset.type + ')' : '') + '.');
  lines.push('FIPS 199 categorization: Confidentiality ' + fipsLabels[cat.confidentiality] + ', Integrity ' + fipsLabels[cat.integrity] + ', Availability ' + fipsLabels[cat.availability] + '. Overall high-water: ' + fipsLabels[overall] + '.');
  if (Array.isArray(cat.infoTypes) && cat.infoTypes.length) {
    var types = cat.infoTypes.map(function(t) { return t.label; }).join('; ');
    lines.push('Information types handled: ' + types + '.');
  }
  lines.push('Rationale: select the impact level that reflects the worst-case business, regulatory, or operational consequence of compromise. Adjust this draft as needed.');
  return lines.join(' ');
}

/** Inline button handler: prefill the rationale textarea from the user's current answers. */
function prefillAssetCategorizationRationale(aid) {
  var asset = (state.assets || []).find(function(a) { return String(a.id) === String(aid); });
  if (!asset) return;
  var cat = ensureAssetCategorizationRow(aid);
  cat.rationale = buildAssetCategorizationRationale(asset, cat);
  markDirty();
  setTimeout(function() { try { renderAssetSSPStep1(); } catch (e) {} }, 0);
}

/**
 * System Profile section — rendered inside renderAssetSSPStep1.
 * FISMA-aware: when state.fismaMode is on, asset owners pick 800-60 info types
 * (CIA derives from the selections); when off, they answer plain-English C/I/A
 * scenario questions and pick Low/Moderate/High via radio cards.
 */
function renderAssetSSPStep2_SystemProfile(asset) {
  if (!asset) return '';
  var cat = ensureAssetCategorizationRow(asset.id);
  if (!Array.isArray(cat.infoTypes)) cat.infoTypes = [];
  var programBl = getProgramBaselineFipsLetter();
  var assetImpact = computeAssetOverallFipsImpact(cat);
  var fipsLabels = { L: 'Low', M: 'Moderate', H: 'High' };
  var isFisma = !!state.fismaMode;
  var aidJson = JSON.stringify(asset.id);

  var explainer = isFisma
    ? '<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;padding:12px 16px;margin:14px 0 14px;font-size:12px;color:#3b0764;line-height:1.55;max-width:920px;">'
      + '<div style="font-weight:800;margin-bottom:4px;color:#6d28d9;">FISMA / CUI categorization</div>'
      + 'Pick all the NIST 800-60 information types this system creates, stores, or processes. Each type has a suggested C/I/A — the high-water mark across your selections sets this system\'s overall impact (FIPS 199). '
      + 'You don\'t pick Low/Moderate/High directly here — categorization follows the data.'
      + '</div>'
    : '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:12px 16px;margin:14px 0 14px;font-size:12px;color:#1e3a5f;line-height:1.55;max-width:920px;">'
      + '<div style="font-weight:800;margin-bottom:4px;color:#1e40af;">Not sure how to categorize? Start here.</div>'
      + 'FIPS 199 asks one question for each of three impact dimensions: <strong>what is the worst-case impact if this system\'s data is (a) disclosed, (b) altered, or (c) unavailable?</strong> '
      + 'For each one, pick <strong>Low</strong>, <strong>Moderate</strong>, or <strong>High</strong> based on the examples below. The overall system impact is the highest of the three (the "high-water mark"). '
      + 'If you\'re not sure, err on the side of higher impact — your CISO can review.'
      + '</div>';

  var pickerHeader = isFisma
    ? '<div style="margin:6px 0 10px;"><div style="font-weight:700;font-size:13px;color:var(--navy);">Information types this system handles</div>'
      + '<div style="font-size:12px;color:#475569;line-height:1.45;">Selecting types automatically sets this system\'s C/I/A as the high-water mark across all chosen types.</div></div>'
    : '';
  var pickerBlock = isFisma
    ? renderAssetInfoTypesPicker(asset.id, cat)
    : renderAssetCIAGuidedPicker(asset.id, cat);

  var fipsBlock = ''
    + '<div class="section-title" style="margin-top:8px;">Security categorization (FIPS 199)</div>'
    + '<div class="section-subtitle">Categorize this system so the right controls apply. Overall impact is the high-water mark of C/I/A. Program baseline <strong>' + fipsLabels[programBl] + '</strong> sets organization-wide control coverage; it is not changed here.</div>'
    + explainer
    + '<div style="margin-bottom:8px;font-size:13px;font-weight:700;color:var(--navy);">Overall system impact: <span style="color:var(--teal);">' + fipsLabels[assetImpact] + '</span>'
    + ' <span style="font-size:12px;font-weight:600;color:var(--text-muted);">· Program baseline: ' + fipsLabels[programBl] + '</span></div>'
    + pickerHeader
    + '<div style="' + (isFisma ? '' : 'max-width:720px;') + 'margin-bottom:18px;">' + pickerBlock + '</div>'
    + '<div class="form-group" style="max-width:720px;margin-top:4px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:4px;">'
        + '<label class="form-label" style="margin:0;">Categorization rationale <span style="color:var(--red)">*</span></label>'
        + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 10px;" onclick="prefillAssetCategorizationRationale(' + aidJson + ')">✨ Generate from my answers</button>'
      + '</div>'
      + '<textarea class="form-input" rows="3" placeholder="Explain why the impact levels above are correct for this system. Use the Generate button to start from a template."'
      + ' oninput="setAssetCategorizationField(' + aidJson + ',\'rationale\',this.value)">' + _esc(cat.rationale || '') + '</textarea>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Good rationales name the data (what it is), who\'s affected by loss, and what regulations apply.</div>'
    + '</div>';

  var elevationHtml = '';
  if (typeof maybeAutoMigrateAssetToApprovedSubtype === 'function') {
    maybeAutoMigrateAssetToApprovedSubtype(asset, assetImpact);
  }
  if (typeof processBaselineElevationOnSystemProfile === 'function') {
    elevationHtml = processBaselineElevationOnSystemProfile(asset, assetImpact);
  }

  var mismatchBanner = '';
  if (_fipsOrder(assetImpact) > _fipsOrder(programBl)) {
    mismatchBanner = '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;margin-top:14px;margin-bottom:8px;font-size:12px;color:#92400e;line-height:1.55;max-width:920px;">'
      + '<div style="font-weight:800;margin-bottom:4px;">Categorization above program baseline</div>'
      + 'This asset\'s FIPS high-water mark (<strong>' + fipsLabels[assetImpact] + '</strong>) is above the organization\'s program baseline (<strong>' + fipsLabels[programBl] + '</strong>). '
      + 'The program baseline is <em>not</em> auto-changed. The CISO may approve a tailored elevated asset subtype for this system class (NIST tailoring with additions). Details below.</div>';
  }

  return fipsBlock + mismatchBanner + elevationHtml;
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
    + renderAssetSSPStep2_SystemProfile(asset)
    + '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;font-size:12px;color:#1e40af;margin-top:16px;">'
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
