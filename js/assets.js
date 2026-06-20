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
  // COSAiS-aligned themes (NIST SP 800-53 Control Overlays for Securing AI Systems — use cases, not new control IDs).
  { category: 'Artificial Intelligence / ML Systems', types: [
    { key: 'ai_gen_assistant',   label: 'Generative AI — Assistant / LLM Deployment' },
    { key: 'ai_predictive_ft',   label: 'Predictive ML — Including Fine-Tuned Models' },
    { key: 'ai_agent_single',    label: 'AI Agent — Single-Agent Orchestration' },
    { key: 'ai_agent_multi',     label: 'AI Agent — Multi-Agent' },
    { key: 'ai_dev_toolchain',   label: 'AI/ML Development Toolchain (Data, Weights, Experiments, Registry)' },
  ]},
];
const SSP_STATUSES = ['Complies','Partially Complies','Does Not Comply','Not Applicable','Inherited'];

function isBuiltInAiAssetTypeKey(key) {
  return typeof key === 'string' && key.indexOf('ai_') === 0;
}

/** Extra FIPS 199 / SSP context for built-in AI asset types (plain language; not NIST overlay text). */
function renderAiAssetSystemProfileCallout(asset) {
  if (!asset || typeof getAssetTypeKey !== 'function') return '';
  var k = getAssetTypeKey(asset.type);
  if (!isBuiltInAiAssetTypeKey(k)) return '';
  return '<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:12px 16px;margin:0 0 14px;font-size:12px;color:#4c1d95;line-height:1.55;max-width:920px;">'
    + '<div style="font-weight:800;margin-bottom:6px;color:#6b21a8;">AI / ML system — categorization tips</div>'
    + '<ul style="margin:0;padding-left:18px;">'
    + '<li><strong>Confidentiality:</strong> Consider prompts, retrieved context, training or fine-tuning data, and model outputs — not only traditional application data.</li>'
    + '<li><strong>Integrity:</strong> Consider whether altered prompts, poisoned data, or tampered weights could change decisions or safety behavior.</li>'
    + '<li><strong>Availability:</strong> Consider impact if inference, training jobs, or the model registry were unavailable to mission or business processes.</li>'
    + '</ul>'
    + '<div style="margin-top:10px;font-size:11px;color:#5b21b6;">NIST\'s <a href="https://csrc.nist.gov/projects/cosais" target="_blank" rel="noopener noreferrer" style="color:#6d28d9;font-weight:700;">COSAiS</a> project develops overlays for applying SP 800-53 to AI use cases — see that site for emerging official guidance.</div>'
    + '</div>';
}
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
  var cleanType = (typeName || '').trim();
  var cleanReason = (reason || '').trim();
  var normalizedAction = action === 'delete' ? 'delete' : 'add';
  if (!cleanType) { showToast('Asset type name is required.', true); return; }
  if (normalizedAction === 'delete') {
    if (!confirm('Permanently remove "' + cleanType + '" from the asset type catalog?\n\nThis may affect control coverage mappings that reference this type.')) return;
  }
  var auditNote = cleanReason || (normalizedAction === 'delete' ? 'Removed via Asset Type Library.' : 'Added via Asset Type Library.');
  var changed = normalizedAction === 'add' ? applyAssetTypeAdd(cleanType, groupName) : applyAssetTypeDelete(cleanType);
  if (!changed) { showToast('No change applied (already exists or already removed).', true); return; }
  addAuditEntry('program', 'asset-types', 'Asset type ' + normalizedAction + ' by ' + getCurrentActorName() + ' for "' + cleanType + '": ' + auditNote);
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
  applyAssetTypeChangeDirect(action, cleanType, '', defaultGroupName || 'Custom');
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
    + '<textarea id="assetTypeReqReason" class="form-input" rows="2" style="font-size:12px;resize:vertical;" placeholder="Optional note for the audit trail"></textarea>'
    + '<div style="margin-top:8px;">'
    + '<button class="btn btn-primary btn-sm" onclick="(function(){var a=document.getElementById(\'assetTypeReqAction\').value;var n=document.getElementById(\'assetTypeReqName\').value;var r=document.getElementById(\'assetTypeReqReason\').value;var g=document.getElementById(\'assetTypeReqGroup\').value;applyAssetTypeChangeDirect(a,n,r,g);})()">Apply Change</button>'
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
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Request history</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.45;">New changes apply immediately. This table only lists requests created before the catalog was opened to all editors, or entries kept for audit.</div>'
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
      ? '<div class="table-scroll"><table class="control-table"><thead><tr><th>Asset</th><th>Type</th><th>Asset Owner</th><th>Reviewer</th><th style="min-width:118px;">' + sspLabel + '</th><th style="width:150px;">Actions</th></tr></thead><tbody>'
        + assets.map(function(a){
          var aidEsc = String(a.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          var sign = getSspSignoffFromState(a.id);
          var rawSt = sign.status || 'Not Started';
          var normSt = normalizeSspSignoffStatus(sign.status);
          var displaySt = normSt || rawSt;
          var canViewPkg = normSt === 'Submitted' || normSt === 'Approved';
          var hasLog = canViewPkg || !!(sign.signedBy || '').trim() || !!(sign.signedDate || '').trim()
            || sign.aoReturnedAt || !!(sign.approvedBy || '').trim();
          var sspCol = '<div style="font-size:11px;line-height:1.45;">'
            + '<div style="font-weight:700;color:#334155;">' + _esc(displaySt) + '</div>';
          if (canViewPkg) {
            sspCol += '<div style="margin-top:4px;"><a href="javascript:void(0)" style="font-size:11px;font-weight:600;color:var(--teal);text-decoration:underline;cursor:pointer;" onclick="openSspReadOnlyFromLibrary(\'' + aidEsc + '\');return false;">View ' + sspLabel + '</a></div>';
          }
          if (hasLog) {
            sspCol += '<div style="margin-top:2px;"><a href="javascript:void(0)" style="font-size:10px;color:#475569;text-decoration:underline;cursor:pointer;" onclick="openSspApprovalLogModal(\'' + aidEsc + '\',false);return false;">Approval log</a></div>';
          }
          sspCol += '</div>';
          var canWiz = typeof userCanAccessAssetWorkspace !== 'function' || userCanAccessAssetWorkspace();
          var actCell = canWiz
            ? '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:3px 8px;" onclick="openAssetWizardFromLibrary(\'' + aidEsc + '\')">Open Wizard</button>'
            : '<span style="font-size:10px;color:var(--text-muted);">—</span>';
          return '<tr>'
            + '<td style="font-size:12px;font-weight:600;color:var(--navy);">' + _esc(a.name || 'Unnamed') + '</td>'
            + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(a.type || '—') + '</td>'
            + '<td style="font-size:12px;color:var(--text-muted);">' + _esc(a.owner || 'Unassigned') + '</td>'
            + '<td style="font-size:11px;color:#334155;">' + _esc(formatSspReviewerDisplay(sign)) + '</td>'
            + '<td style="vertical-align:top;">' + sspCol + '</td>'
            + '<td>' + actCell + '</td>'
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
      for (var i = 1; i <= 4; i++) {
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
  if (state._sspReviewerReadOnly) {
    renderSspReadOnlyReviewInWizard();
    return;
  }
  var isProc = !!state._selectedProcessId;
  if (step===1) { isProc ? renderProcessSSPStep1() : renderAssetSSPStep1(); }
  if (step===2) { isProc ? renderProcessSSPStep4_Attestations() : renderAssetSSPStep4_Attestations(); }
  if (step===3) { isProc ? renderProcessSSPStep3_Interconnections() : renderAssetSSPStep3_Interconnections(); }
  if (step===4) { isProc ? renderProcessSSPStep5_SignOff() : renderAssetSSPStep5_SignOff(); }
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
      + '<thead><tr><th style="width:28%;">' + (isProc?'Process':'Asset') + '</th><th style="width:14%;">'+(isProc?'Category':'Type')+'</th><th style="width:14%;">Owner</th><th style="width:10%;">Controls</th><th style="width:18%;">Progress</th><th style="width:10%;">Status</th><th style="width:6%;"></th></tr></thead><tbody id="tbod-' + Math.random().toString(36).slice(2,8) + '">';
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
  if (state._sspReviewerReadOnly) state._sspReviewerReadOnly = false;
  if (!userCanAccessAssetWorkspace()) {
    showToast('You do not have access to edit this SSP in the asset-owner workspace.', true);
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
  for (var i = 1; i <= 4; i++) {
    var s = document.getElementById('asset-step-' + i);
    if (s) s.classList.toggle('active', i === 1);
  }
  renderAssetWizardChrome();
  renderAssetSSPStep1();
}

function enterProcessSSP(procId) {
  if (state._sspReviewerReadOnly) state._sspReviewerReadOnly = false;
  state._assetTypeLibraryMode = false;
  state._selectedProcessId = String(procId);
  state._selectedAssetId   = null;
  currentStep.asset = 1;
  var listPanel = document.getElementById('asset-list-panel');
  var wizPanel  = document.getElementById('asset-wizard-panel');
  if (listPanel) listPanel.style.display = 'none';
  if (wizPanel)  wizPanel.style.display  = 'flex';
  for (var i = 1; i <= 4; i++) {
    var s = document.getElementById('asset-step-' + i);
    if (s) s.classList.toggle('active', i === 1);
  }
  renderAssetWizardChrome();
  renderProcessSSPStep1();
}

function exitAssetWizard() {
  state._sspReviewerReadOnly = false;
  state._sspReadOnlyExitTab = null;
  if (typeof _restoreAssetWizardLayoutAfterReadOnly === 'function') _restoreAssetWizardLayoutAfterReadOnly();
  state._selectedAssetId   = null;
  state._selectedProcessId = null;
  renderAssetTab();
}

/** After read-only SSP package view: return to Reports queue or Asset Library catalog. */
function closeSspReadOnlyReview() {
  var dest = state._sspReadOnlyExitTab === 'library' ? 'library' : 'reports';
  state._sspReadOnlyExitTab = null;
  state._sspReviewerReadOnly = false;
  state._selectedAssetId = null;
  state._selectedProcessId = null;
  if (typeof _restoreAssetWizardLayoutAfterReadOnly === 'function') _restoreAssetWizardLayoutAfterReadOnly();
  if (dest === 'library') {
    state._assetLibraryMode = true;
    state._assetTypeLibraryMode = false;
    if (typeof showTab === 'function') showTab('asset');
    else renderAssetTab();
  } else {
    if (typeof showTab === 'function') showTab('reports');
    else renderAssetTab();
  }
}

/** @deprecated Use closeSspReadOnlyReview — kept for inline onclick compatibility. */
function closeSspReadOnlyReviewToReports() {
  closeSspReadOnlyReview();
}

function _applySspReadOnlyLayout() {
  var tab = document.getElementById('tab-asset');
  if (!tab) return;
  var nav = tab.querySelector('.wizard-container > .step-nav');
  if (nav) nav.style.display = 'none';
  for (var i = 2; i <= 4; i++) {
    var st = document.getElementById('asset-step-' + i);
    if (st) {
      st.style.display = 'none';
      st.classList.remove('active');
    }
  }
  var st1 = document.getElementById('asset-step-1');
  if (st1) {
    st1.style.display = '';
    st1.classList.add('active');
    var ft = st1.querySelector('.wizard-step-footer');
    if (ft) ft.style.display = 'none';
  }
}

function _restoreAssetWizardLayoutAfterReadOnly() {
  var tab = document.getElementById('tab-asset');
  if (!tab) return;
  var nav = tab.querySelector('.wizard-container > .step-nav');
  if (nav) nav.style.removeProperty('display');
  for (var i = 1; i <= 4; i++) {
    var st = document.getElementById('asset-step-' + i);
    if (st) st.style.removeProperty('display');
    if (st) {
      var ft = st.querySelector('.wizard-step-footer');
      if (ft) ft.style.removeProperty('display');
    }
  }
}

/**
 * Open a submitted SSP/SPSP for read-only package view (queue or library). Does not use the asset-owner wizard gates.
 * @param {string} exitTab 'reports' (default) or 'library' — controls Back navigation.
 */
function openSspReadOnlyFromQueue(scopeId, isProcess, exitTab) {
  var sid = String(scopeId);
  var asset = (state.assets || []).find(function(a) { return String(a.id) === sid; });
  var proc = (state.processes || []).find(function(p) { return String(p.id) === sid; });
  if (!isProcess && proc && !asset) isProcess = true;
  if (isProcess && !proc) { showToast('Process not found.', true); return; }
  if (!isProcess && !asset) { showToast('Asset not found.', true); return; }

  state._sspReadOnlyExitTab = exitTab === 'library' ? 'library' : 'reports';
  state._sspReviewerReadOnly = true;
  state._assetTypeLibraryMode = false;
  state._assetLibraryMode = false;
  if (isProcess) {
    state._selectedProcessId = sid;
    state._selectedAssetId = null;
  } else {
    state._selectedAssetId = sid;
    state._selectedProcessId = null;
  }
  currentStep.asset = 1;

  if (typeof goToAssetWorkspace === 'function') goToAssetWorkspace();
  else {
    if (typeof showTab === 'function') showTab('asset');
  }

  var listPanel = document.getElementById('asset-list-panel');
  var wizPanel = document.getElementById('asset-wizard-panel');
  if (listPanel) listPanel.style.display = 'none';
  if (wizPanel) wizPanel.style.display = 'flex';

  _applySspReadOnlyLayout();
  if (typeof renderAssetWizardChrome === 'function') renderAssetWizardChrome();
  renderSspReadOnlyReviewInWizard();
}

/** Read-only SSP from Asset Library catalog (Back returns to library). */
function openSspReadOnlyFromLibrary(scopeId, isProcess) {
  openSspReadOnlyFromQueue(scopeId, !!isProcess, 'library');
}

/** Modal: sign-off snapshot + audit trail rows for this asset/process SSP. */
function openSspApprovalLogModal(scopeId, isProcess) {
  var sid = String(scopeId);
  var prev = document.getElementById('sspApprovalLogOverlay');
  if (prev) prev.remove();
  var item = isProcess
    ? (state.processes || []).find(function(p) { return String(p.id) === sid; })
    : (state.assets || []).find(function(a) { return String(a.id) === sid; });
  if (!item) {
    showToast('Package not found.', true);
    return;
  }
  var sspLabel = state.privacyOverlay ? 'SPSP' : 'SSP';
  var pkgLabel = isProcess ? 'Process SSP' : sspLabel;
  var sign = getSspSignoffFromState(sid);
  var normSt = normalizeSspSignoffStatus(sign.status);
  var displaySt = normSt || (sign.status || 'Not started');

  var dl = '';
  var row = function(k, v) {
    return '<dt style="font-weight:700;color:var(--text-muted);font-size:11px;margin:10px 0 2px 0;">' + _esc(k) + '</dt><dd style="margin:0;font-size:13px;color:#334155;">' + v + '</dd>';
  };
  dl += row('Workflow status', _esc(displaySt));
  if ((sign.signedBy || '').trim() || (sign.signedDate || '').trim()) {
    dl += row('Owner / submitter signature', _esc((sign.signedBy || '').trim() || '—') + (sign.signedDate ? ' · ' + _esc(sign.signedDate) : ''));
  }
  dl += row('Designated reviewer', _esc(formatSspReviewerDisplay(sign)));
  if (normSt === 'Approved' && ((sign.approvedBy || '').trim() || (sign.approvedDate || '').trim())) {
    dl += row('AO / approver decision', _esc((sign.approvedBy || '').trim() || '—') + (sign.approvedDate ? ' · ' + _esc(sign.approvedDate) : ''));
  }
  if (sign.aoReturnedAt || (sign.aoReturnedBy || '').trim()) {
    var retNote = (String(sign.aoReturnNotes || '').trim())
      ? _esc(String(sign.aoReturnNotes).trim())
      : '<span style="color:var(--text-muted);font-style:italic;">None</span>';
    dl += row('Returned to owner', _esc((sign.aoReturnedBy || '').trim() || '—') + (sign.aoReturnedAt ? ' · ' + _esc(sign.aoReturnedAt) : ''));
    dl += row('Reviewer notes (return)', retNote);
  }

  var catWant = isProcess ? 'process' : 'asset';
  var events = (state.auditTrail || []).filter(function(e) {
    return e && String(e.ref) === sid && String(e.cat || '') === catWant;
  }).slice().reverse();

  var evRows = events.map(function(e) {
    return '<tr style="border-bottom:1px solid var(--border);">'
      + '<td style="padding:8px 10px;font-size:11px;color:#64748b;white-space:nowrap;">' + _esc(String(e.t != null ? e.t : '')) + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;color:#334155;">' + _esc(String(e.msg != null ? e.msg : '')) + '</td>'
      + '</tr>';
  }).join('');

  var auditBlock = events.length
    ? '<div style="font-size:12px;font-weight:700;color:var(--navy);margin:18px 0 8px 0;">Program audit log (' + _esc(catWant) + ')</div>'
      + '<div class="table-scroll" style="max-height:240px;border:1px solid var(--border);border-radius:8px;">'
      + '<table class="control-table" style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">'
      + '<th style="padding:8px 10px;text-align:left;font-size:11px;">Time</th>'
      + '<th style="padding:8px 10px;text-align:left;font-size:11px;">Event</th>'
      + '</tr></thead><tbody>' + evRows + '</tbody></table></div>'
    : '<div style="font-size:12px;color:var(--text-muted);margin-top:16px;">No matching audit entries for this package in the program log.</div>';

  var overlay = document.createElement('div');
  overlay.id = 'sspApprovalLogOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 16px;';
  overlay.innerHTML = '<div role="dialog" aria-modal="true" style="background:white;border-radius:16px;padding:24px 28px;width:640px;max-width:96vw;box-shadow:0 20px 60px rgba(0,0,0,0.22);margin-bottom:40px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">'
    + '<div><div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">' + _esc(pkgLabel) + ' approval log</div>'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-top:4px;">' + _esc(item.name || 'Unnamed') + '</div></div>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById(\'sspApprovalLogOverlay\').remove()">Close</button></div>'
    + '<dl style="margin:0 0 8px 0;border:1px solid var(--border);border-radius:10px;padding:12px 16px;background:#fafafa;">' + dl + '</dl>'
    + auditBlock
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(ev) { if (ev.target === overlay) overlay.remove(); });
}

function _controlShortName(ctrlId) {
  var c = (typeof CONTROLS !== 'undefined' && CONTROLS) ? CONTROLS.find(function(x) { return x.id === ctrlId; }) : null;
  return c ? (c.n || ctrlId) : ctrlId;
}

/** Read categorization without creating defaults (reviewer read-only must not mutate state). */
function getAssetCategorizationSnapshot(assetId) {
  var key = String(assetId);
  var row = (state.assetCategorization || {})[key];
  if (!row) {
    return { confidentiality: 'L', integrity: 'L', availability: 'L', rationale: '', infoTypes: [] };
  }
  return Object.assign({ infoTypes: [] }, row, { infoTypes: Array.isArray(row.infoTypes) ? row.infoTypes.slice() : [] });
}

/** Read-only digest of Step 1 profile (description, categorization / info types, rationale). */
function buildSspReadOnlyStep1ProfileHtml(item, isProc) {
  if (!item) return '';
  var dtStyle = 'font-weight:700;color:var(--text-muted);font-size:11px;text-transform:uppercase;margin-top:12px;';
  var ddStyle = 'margin:4px 0 0 0;font-size:13px;color:#334155;line-height:1.55;';
  if (isProc) {
    var cat = PROCESS_CATEGORIES.find(function(c) { return c.id === item.category; });
    var desc = String(item.description || '').trim();
    return '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:20px;">'
      + '<div style="font-size:13px;font-weight:800;color:var(--navy);margin-bottom:4px;">Process profile (Step 1)</div>'
      + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Name, category, owner, and description from the process SSP header.</div>'
      + '<dl style="margin:0;">'
      + '<dt style="' + dtStyle + 'margin-top:0;">Process name</dt><dd style="' + ddStyle + 'font-weight:600;">' + _esc(item.name || '—') + '</dd>'
      + '<dt style="' + dtStyle + '">Category</dt><dd style="' + ddStyle + '">' + _esc((cat || {}).label || item.category || '—')
      + (cat && cat.families && cat.families.length ? ' <span style="color:var(--text-muted);font-size:12px;">(families: ' + _esc(cat.families.join(', ')) + ')</span>' : '')
      + '</dd>'
      + '<dt style="' + dtStyle + '">Owner / responsible party</dt><dd style="' + ddStyle + '">' + _esc(item.owner || '—') + '</dd>'
      + '<dt style="' + dtStyle + '">Description</dt><dd style="' + ddStyle + ';white-space:pre-wrap;">' + (desc ? _esc(desc) : '<span style="color:var(--text-muted);font-style:italic;">Not provided.</span>') + '</dd>'
      + '</dl></div>';
  }
  var asset = item;
  var cat = getAssetCategorizationSnapshot(asset.id);
  if (!Array.isArray(cat.infoTypes)) cat.infoTypes = [];
  var fipsL = { L: 'Low', M: 'Moderate', H: 'High' };
  var impact = typeof computeAssetOverallFipsImpact === 'function' ? computeAssetOverallFipsImpact(cat) : 'L';
  var programBl = typeof getProgramBaselineFipsLetter === 'function' ? getProgramBaselineFipsLetter() : (state.baseline || 'L');
  var desc = String(asset.description || '').trim();
  var rationale = String(cat.rationale || '').trim();
  var infoLines = '';
  if (cat.infoTypes && cat.infoTypes.length) {
    infoLines = '<dt style="' + dtStyle + '">Information types</dt><dd style="' + ddStyle + '"><ul style="margin:4px 0 0 18px;padding:0;">'
      + cat.infoTypes.map(function(t) {
        return '<li>' + _esc(t.label || t.id || '') + '</li>';
      }).join('')
      + '</ul></dd>';
  } else if (state.fismaMode) {
    infoLines = '<dt style="' + dtStyle + '">Information types</dt><dd style="' + ddStyle + '"><span style="color:var(--text-muted);font-style:italic;">None selected.</span></dd>';
  }
  var mdmBlock = '';
  if (['Workstation (Windows)', 'Workstation (macOS/Linux)', 'Mobile Device', 'Virtual Desktop (VDI)'].indexOf(asset.type) !== -1 && (asset.mdm || '').trim()) {
    mdmBlock = '<dt style="' + dtStyle + '">MDM solution</dt><dd style="' + ddStyle + '">' + _esc(String(asset.mdm).trim()) + '</dd>';
  }
  return '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:20px;">'
    + '<div style="font-size:13px;font-weight:800;color:var(--navy);margin-bottom:4px;">Asset profile &amp; system categorization (Step 1)</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Inventory, description, FIPS 199 / information types, and categorization rationale.</div>'
    + '<dl style="margin:0;">'
    + '<dt style="' + dtStyle + 'margin-top:0;">Asset name</dt><dd style="' + ddStyle + 'font-weight:600;">' + _esc(asset.name || '—') + '</dd>'
    + '<dt style="' + dtStyle + '">Asset type</dt><dd style="' + ddStyle + '">' + _esc(asset.type || '—') + '</dd>'
    + '<dt style="' + dtStyle + '">Owner / responsible party</dt><dd style="' + ddStyle + '">' + _esc(asset.owner || '—') + '</dd>'
    + mdmBlock
    + '<dt style="' + dtStyle + '">Description</dt><dd style="' + ddStyle + ';white-space:pre-wrap;">' + (desc ? _esc(desc) : '<span style="color:var(--text-muted);font-style:italic;">Not provided.</span>') + '</dd>'
    + '<dt style="' + dtStyle + '">Security categorization (FIPS 199)</dt><dd style="' + ddStyle + '">'
    + 'Confidentiality <strong>' + _esc(fipsL[cat.confidentiality] || cat.confidentiality || 'Low') + '</strong>'
    + ' · Integrity <strong>' + _esc(fipsL[cat.integrity] || cat.integrity || 'Low') + '</strong>'
    + ' · Availability <strong>' + _esc(fipsL[cat.availability] || cat.availability || 'Low') + '</strong>'
    + '<br><span style="font-size:12px;color:var(--text-muted);">Overall system impact: <strong style="color:var(--navy);">' + _esc(fipsL[impact] || impact) + '</strong>'
    + ' · Program baseline: <strong>' + _esc(fipsL[programBl] || programBl) + '</strong></span>'
    + '</dd>'
    + infoLines
    + '<dt style="' + dtStyle + '">Categorization rationale</dt><dd style="' + ddStyle + ';white-space:pre-wrap;">' + (rationale ? _esc(rationale) : '<span style="color:var(--text-muted);font-style:italic;">Not provided.</span>') + '</dd>'
    + '</dl></div>';
}

function getSspInterconnectionsSnapshot(scopeId) {
  var k = String(scopeId);
  var rows = (state.sspInterconnections || {})[k];
  return Array.isArray(rows) ? rows : [];
}

function buildSspInterconnectionsReadOnlyHtml(scopeId) {
  var rows = getSspInterconnectionsSnapshot(scopeId);
  if (!rows.length) {
    return '<div style="font-size:12px;color:var(--text-muted);">No interconnections documented.</div>';
  }
  var dirLabel = { inbound: 'Inbound', outbound: 'Outbound', bidirectional: 'Both' };
  var sensLabel = { L: 'Low', M: 'Moderate', H: 'High' };
  var tr = rows.map(function(r) {
    return '<tr style="border-bottom:1px solid var(--border);">'
      + '<td style="padding:8px 10px;font-size:12px;">' + _esc(r.name || '—') + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + _esc(dirLabel[r.direction] || r.direction || '—') + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + _esc(sensLabel[r.dataSensitivity] || r.dataSensitivity || '—') + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + _esc(r.provider || '—') + '</td>'
      + '<td style="padding:8px 10px;font-size:11px;color:#475569;">' + _esc(r.isaRef || '') + '</td>'
      + '<td style="padding:8px 10px;font-size:11px;color:#475569;">' + _esc(r.notes || '') + '</td>'
      + '</tr>';
  }).join('');
  return '<div class="table-scroll"><table class="control-table" style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Connection / system</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Direction</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Sensitivity</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Provider / owner</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">ISA / agreement</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Notes</th>'
    + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
}

function renderSspReadOnlyReviewInWizard() {
  var body = document.getElementById('asset-step-1-body');
  if (!body) return;
  var isProc = !!state._selectedProcessId;
  var scopeId = isProc ? state._selectedProcessId : state._selectedAssetId;
  var item = isProc
    ? (state.processes || []).find(function(p) { return String(p.id) === String(scopeId); })
    : (state.assets || []).find(function(a) { return String(a.id) === String(scopeId); });
  if (!item) {
    body.innerHTML = '<div class="empty-state"><p>Package not found.</p></div>';
    return;
  }
  var sspLabel = state.privacyOverlay ? 'SPSP' : 'SSP';
  var controls = isProc ? getProcessSSPControls(item) : getAssetSSPControls(item);
  var attests = (state.sspAttestations || {})[item.id] || {};
  var sign = getSspSignoffFromState(item.id);
  var st = normalizeSspSignoffStatus(sign.status);
  var step1Block = buildSspReadOnlyStep1ProfileHtml(item, isProc);
  var interHtml = buildSspInterconnectionsReadOnlyHtml(item.id);

  var attRows = controls.map(function(c) {
    var a = attests[c.id] || {};
    var status = a.status ? _esc(a.status) : '<span style="color:var(--text-muted);">—</span>';
    var expl = (a.explanation || '').trim();
    var ev = (a.evidenceLocation || '').trim();
    return '<tr style="border-bottom:1px solid var(--border);">'
      + '<td style="padding:8px 10px;font-family:monospace;font-size:12px;font-weight:700;">' + _esc(c.id) + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + _esc(_controlShortName(c.id)) + '</td>'
      + '<td style="padding:8px 10px;font-size:12px;">' + status + '</td>'
      + '<td style="padding:8px 10px;font-size:11px;color:#475569;">' + (expl ? _esc(expl) : '—') + '</td>'
      + '<td style="padding:8px 10px;font-size:11px;color:#475569;">' + (ev ? _esc(ev) : '—') + '</td>'
      + '</tr>';
  }).join('');

  var signBlock = '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:18px;">'
    + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:8px;">Submission &amp; reviewer</div>'
    + '<div style="font-size:12px;color:#475569;line-height:1.6;">'
    + '<div><strong>Status:</strong> ' + _esc(st || 'In progress / not submitted') + '</div>'
    + (sign.signedBy ? '<div><strong>Signed by:</strong> ' + _esc(sign.signedBy) + (sign.signedDate ? ' · ' + _esc(sign.signedDate) : '') + '</div>' : '')
    + '<div><strong>Designated reviewer:</strong> ' + _esc(formatSspReviewerDisplay(sign)) + '</div>'
    + '</div></div>';

  var backLabel = state._sspReadOnlyExitTab === 'library' ? '← Back to Asset Library' : '← Back to Reports &amp; Dashboard';

  var returnBlock = '';
  if (signoffIsReturnedForRevision(sign)) {
    returnBlock = '<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px 16px;margin-bottom:18px;">'
      + '<div style="font-size:12px;font-weight:700;color:#9a3412;margin-bottom:6px;">Returned to owner (read-only snapshot)</div>'
      + '<div style="font-size:12px;color:#78350f;line-height:1.5;">'
      + (sign.aoReturnedBy ? '<div><strong>Returned by:</strong> ' + _esc(sign.aoReturnedBy) + (sign.aoReturnedAt ? ' · ' + _esc(sign.aoReturnedAt) : '') + '</div>' : '')
      + '<div style="margin-top:8px;"><strong>Reviewer notes:</strong> ' + (String(sign.aoReturnNotes || '').trim() ? _esc(String(sign.aoReturnNotes).trim()) : '<span style="font-style:italic;color:var(--text-muted);">None.</span>') + '</div>'
      + '</div></div>';
  }

  body.innerHTML = ''
    + '<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;">'
    + '<div><div style="font-size:11px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:0.04em;">Read-only ' + sspLabel + ' review</div>'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-top:4px;">' + _esc(item.name || 'Unnamed') + '</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + (isProc ? 'Process SSP' : _esc(item.type || 'System')) + ' · ' + controls.length + ' control(s) in scope</div></div>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="closeSspReadOnlyReview()">' + backLabel + '</button>'
    + '</div>'
    + step1Block
    + signBlock
    + returnBlock
    + '<div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:10px;">Control attestations</div>'
    + '<div class="table-scroll" style="margin-bottom:22px;"><table class="control-table" style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Control</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Requirement</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Status</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Explanation</th>'
    + '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;">Evidence</th>'
    + '</tr></thead><tbody>' + (attRows || '<tr><td colspan="5" style="padding:16px;color:var(--text-muted);">No controls in scope.</td></tr>') + '</tbody></table></div>'
    + '<div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:10px;">Interconnections</div>'
    + interHtml
    + '<div style="margin-top:24px;"><button type="button" class="btn btn-secondary" onclick="closeSspReadOnlyReview()">' + backLabel + '</button></div>';
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
    { n:3, label:'Interconnections' },
    { n:4, label:'Review & Sign Off' }
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
  var key = String(assetId);
  if (!state.assetCategorization) state.assetCategorization = {};
  if (!state.assetCategorization[key]) {
    state.assetCategorization[key] = {
      confidentiality: 'L',
      integrity: 'L',
      availability: 'L',
      rationale: ''
    };
  }
  return state.assetCategorization[key];
}

/** Single-quoted JS string for use inside a double-quoted HTML on* attribute (avoids `\'rationale\'` clipping the attribute). */
function jsQuotedIdForHtmlAttr(id) {
  return '\'' + String(id).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\'';
}

function setAssetCategorizationField(assetId, field, value) {
  assetId = String(assetId);
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
  var aidQ = jsQuotedIdForHtmlAttr(aid);
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
        + ' onchange="setAssetCategorizationField(' + aidQ + ', \'' + f.key + '\', \'' + o.v + '\');setTimeout(function(){ if (typeof renderAssetSSPStep1===\'function\') renderAssetSSPStep1(); },0)" style="margin-top:3px;">'
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
  var cat = (state.assetCategorization || {})[String(aid)];
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
  aid = String(aid);
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
  var aidQ = jsQuotedIdForHtmlAttr(aid);
  var cards = INFO_TYPES_800_60.map(function(it) {
    var on = !!selected[it.id];
    var border = on ? '2px solid var(--teal)' : '2px solid #e5e7eb';
    var bg = on ? '#ecfdf5' : '#fff';
    var seed = 'C' + it.cia.c + ' / I' + it.cia.i + ' / A' + it.cia.a;
    var seedHigh = Math.max(_fipsOrder(it.cia.c), _fipsOrder(it.cia.i), _fipsOrder(it.cia.a));
    var seedColor = seedHigh === 3 ? '#dc2626' : seedHigh === 2 ? '#d97706' : '#059669';
    return '<label style="display:block;border:' + border + ';background:' + bg + ';border-radius:10px;padding:12px 14px;cursor:pointer;transition:border-color .15s, background .15s;">'
      + '<div style="display:flex;gap:10px;align-items:flex-start;">'
      + '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="toggleAssetInfoType(' + aidQ + ', ' + JSON.stringify(it.id) + ')" style="margin-top:3px;flex-shrink:0;">'
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
  var aidQ = jsQuotedIdForHtmlAttr(asset.id);

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
  var aiCiaCallout = renderAiAssetSystemProfileCallout(asset);
  var pickerBlock = isFisma
    ? renderAssetInfoTypesPicker(asset.id, cat)
    : renderAssetCIAGuidedPicker(asset.id, cat);

  var fipsBlock = ''
    + '<div class="section-title" style="margin-top:8px;">Security categorization (FIPS 199)</div>'
    + '<div class="section-subtitle">Categorize this system so the right controls apply. Overall impact is the high-water mark of C/I/A. Program baseline <strong>' + fipsLabels[programBl] + '</strong> sets organization-wide control coverage; it is not changed here.</div>'
    + explainer
    + aiCiaCallout
    + '<div style="margin-bottom:8px;font-size:13px;font-weight:700;color:var(--navy);">Overall system impact: <span style="color:var(--teal);">' + fipsLabels[assetImpact] + '</span>'
    + ' <span style="font-size:12px;font-weight:600;color:var(--text-muted);">· Program baseline: ' + fipsLabels[programBl] + '</span></div>'
    + pickerHeader
    + '<div style="' + (isFisma ? '' : 'max-width:720px;') + 'margin-bottom:18px;">' + pickerBlock + '</div>'
    + '<div class="form-group" style="max-width:720px;margin-top:4px;">'
      + '<div style="margin-bottom:4px;">'
        + '<label class="form-label" style="margin:0;">Categorization rationale <span style="color:var(--red)">*</span></label>'
      + '</div>'
      + '<textarea class="form-input" rows="3" placeholder="Explain why the impact levels above are correct for this system."'
      + ' oninput="setAssetCategorizationField(' + aidQ + ', \'rationale\', this.value)">' + _esc(cat.rationale || '') + '</textarea>'
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

function renderAssetSSPStep2_SystemProfileStep() {
  var body = document.getElementById('asset-step-2-body');
  if (!body) return;
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) return;
  body.innerHTML = ''
    + '<div class="section-title">System Profile</div>'
    + '<div class="section-subtitle">Document security categorization and rationale for this system. This profile supports defensible SSP scoping and downstream attestation context.</div>'
    + renderAssetSSPStep2_SystemProfile(asset);
}

function renderProcessSSPStep2_SystemProfile() {
  var body = document.getElementById('asset-step-2-body');
  if (!body) return;
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) return;
  body.innerHTML = ''
    + '<div class="section-title">System Profile</div>'
    + '<div class="section-subtitle">Process-based SSPs do not require FIPS system categorization. Confirm this process context and continue to interconnections and attestation.</div>'
    + '<div style="max-width:820px;background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-size:12px;color:#334155;line-height:1.55;">'
    + '<div style="font-weight:700;color:var(--navy);margin-bottom:6px;">' + _esc(proc.name || 'Process') + '</div>'
    + '<div><strong>Category:</strong> ' + _esc(((PROCESS_CATEGORIES.find(function(c){ return c.id === proc.category; })||{}).label || proc.category || '—')) + '</div>'
    + '<div><strong>Owner:</strong> ' + _esc(proc.owner || '—') + '</div>'
    + (proc.description ? '<div style="margin-top:6px;"><strong>Description:</strong> ' + _esc(proc.description) + '</div>' : '')
    + '</div>';
}

function getSSPInterconnectionStore(scopeId) {
  if (!state.sspInterconnections) state.sspInterconnections = {};
  if (!state.sspInterconnections[scopeId]) state.sspInterconnections[scopeId] = [];
  return state.sspInterconnections[scopeId];
}

function renderInterconnectionRows(scopeId, readOnly) {
  var rows = getSSPInterconnectionStore(scopeId);
  var scopeJs = '\'' + String(scopeId).replace(/'/g, "\\'") + '\'';
  if (!rows.length) {
    return '<div style="background:#f8fafc;border:1px dashed var(--border);border-radius:10px;padding:16px;color:var(--text-muted);font-size:12px;">No interconnections documented yet.</div>';
  }
  return '<div style="display:flex;flex-direction:column;gap:10px;">' + rows.map(function(r, idx) {
    var id = String(idx);
    return '<div style="border:1px solid var(--border);border-radius:10px;padding:12px;background:white;">'
      + '<div style="display:grid;grid-template-columns:1.1fr 140px 120px 1fr;gap:10px;">'
      + '<div><label class="form-label" style="font-size:10px;">Connection / system</label><input class="form-input" ' + (readOnly ? 'readonly ' : '') + 'value="' + _esc(r.name || '') + '" oninput="setSSPInterconnectionField(' + scopeJs + ',' + id + ',\'name\',this.value)"></div>'
      + '<div><label class="form-label" style="font-size:10px;">Direction</label><select class="form-select" ' + (readOnly ? 'disabled ' : '') + 'onchange="setSSPInterconnectionField(' + scopeJs + ',' + id + ',\'direction\',this.value)"><option value="inbound"' + (r.direction==='inbound'?' selected':'') + '>Inbound</option><option value="outbound"' + (r.direction==='outbound'?' selected':'') + '>Outbound</option><option value="bidirectional"' + (r.direction==='bidirectional'?' selected':'') + '>Both</option></select></div>'
      + '<div><label class="form-label" style="font-size:10px;">Sensitivity</label><select class="form-select" ' + (readOnly ? 'disabled ' : '') + 'onchange="setSSPInterconnectionField(' + scopeJs + ',' + id + ',\'dataSensitivity\',this.value)"><option value="L"' + (r.dataSensitivity==='L'?' selected':'') + '>Low</option><option value="M"' + (r.dataSensitivity==='M'?' selected':'') + '>Moderate</option><option value="H"' + (r.dataSensitivity==='H'?' selected':'') + '>High</option></select></div>'
      + '<div><label class="form-label" style="font-size:10px;">Provider / owner</label><input class="form-input" ' + (readOnly ? 'readonly ' : '') + 'value="' + _esc(r.provider || '') + '" oninput="setSSPInterconnectionField(' + scopeJs + ',' + id + ',\'provider\',this.value)"></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;margin-top:10px;">'
      + '<div><label class="form-label" style="font-size:10px;">ISA / agreement reference</label><input class="form-input" ' + (readOnly ? 'readonly ' : '') + 'value="' + _esc(r.isaRef || '') + '" oninput="setSSPInterconnectionField(' + scopeJs + ',' + id + ',\'isaRef\',this.value)"></div>'
      + '<div><label class="form-label" style="font-size:10px;">Notes</label><input class="form-input" ' + (readOnly ? 'readonly ' : '') + 'value="' + _esc(r.notes || '') + '" oninput="setSSPInterconnectionField(' + scopeJs + ',' + id + ',\'notes\',this.value)"></div>'
      + (!readOnly ? '<div style="display:flex;align-items:flex-end;"><button type="button" class="btn btn-secondary btn-sm" style="color:var(--red);" onclick="removeSSPInterconnection(' + scopeJs + ',' + id + ')">Remove</button></div>' : '<div></div>')
      + '</div>'
      + '</div>';
  }).join('') + '</div>';
}

function renderAssetSSPStep3_Interconnections() {
  var body = document.getElementById('asset-step-3-body');
  if (!body) return;
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) return;
  var assetJs = '\'' + String(asset.id).replace(/'/g, "\\'") + '\'';
  body.innerHTML = ''
    + '<div class="section-title">Interconnections</div>'
    + '<div class="section-subtitle">Document external systems, services, or data exchanges connected to this system. Include direction, sensitivity, and ISA/security agreement references where applicable.</div>'
    + '<div style="max-width:1100px;">'
    + renderInterconnectionRows(asset.id, false)
    + '<div style="display:flex;justify-content:flex-end;margin-top:10px;"><button class="btn btn-secondary btn-sm" onclick="addSSPInterconnection(' + assetJs + ')">+ Add interconnection</button></div>'
    + '</div>';
}

function renderProcessSSPStep3_Interconnections() {
  var body = document.getElementById('asset-step-3-body');
  if (!body) return;
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) return;
  var procJs = '\'' + String(proc.id).replace(/'/g, "\\'") + '\'';
  body.innerHTML = ''
    + '<div class="section-title">Interconnections</div>'
    + '<div class="section-subtitle">Document upstream/downstream systems or services this process relies on to execute control activities.</div>'
    + '<div style="max-width:1100px;">'
    + renderInterconnectionRows(proc.id, false)
    + '<div style="display:flex;justify-content:flex-end;margin-top:10px;"><button class="btn btn-secondary btn-sm" onclick="addSSPInterconnection(' + procJs + ')">+ Add interconnection</button></div>'
    + '</div>';
}

function addSSPInterconnection(scopeId) {
  var rows = getSSPInterconnectionStore(scopeId);
  rows.push({ id: 'ic-' + Date.now(), name: '', direction: 'bidirectional', dataSensitivity: 'L', provider: '', isaRef: '', notes: '' });
  markDirty();
  renderAssetStep(3);
}

function setSSPInterconnectionField(scopeId, idx, field, value) {
  var rows = getSSPInterconnectionStore(scopeId);
  if (!rows[idx]) return;
  rows[idx][field] = value;
  markDirty();
}

function removeSSPInterconnection(scopeId, idx) {
  var rows = getSSPInterconnectionStore(scopeId);
  if (!rows[idx]) return;
  rows.splice(idx, 1);
  markDirty();
  renderAssetStep(3);
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
    + '<select class="form-select" onchange="state.assets[' + idx + '].type=this.value; window.markDirty();">'
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

// ─── STEP 4: CONTROL ATTESTATIONS ────────────────────────────────────────────
function renderAssetSSPStep4_Attestations() {
  var body  = document.getElementById('asset-step-2-body');
  if (!body) return;
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) return;

  var controls = getAssetSSPControls(asset);
  var attests  = (state.sspAttestations||{})[asset.id] || {};
  ensureSspDefaultReviewer(asset.id);
  var signRaw  = getSspSignoffFromState(asset.id);
  var signSt   = normalizeSspSignoffStatus(signRaw.status);
  var isSubmitted = signSt === 'Submitted' || signSt === 'Approved';
  var signoff  = Object.assign({}, signRaw, { status: signSt });
  var isReviewerPickerLocked = signSt === 'Approved';

  // Update count in footer
  var countEl = document.getElementById('asset-step-2-count');
  if (countEl) {
    var done = controls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    countEl.textContent = done + ' / ' + controls.length + ' attested';
  }

  if (!controls.length) {
    var reviewerStrip = isReviewerPickerLocked
      ? '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px;color:#334155;"><strong>SSP Reviewer:</strong> ' + _esc(formatSspReviewerDisplay(signoff)) + '</div>'
      : buildSspReviewerSelectorHtml(asset.id, getSspSignoffFromState(asset.id), false);
    body.innerHTML = reviewerStrip + '<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Mapped Yet</div>'
      + '<p>No controls have been mapped to this asset type yet. Control owners assign controls to assets in the Control Owner tab. Once assigned, they will appear here for attestation.</p></div>';
    return;
  }

  var isPrivacy = state.privacyOverlay;
  var sspLabel  = isPrivacy ? 'SPSP' : 'SSP';

  var reviewerTop = isReviewerPickerLocked
    ? '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:12px;color:#334155;"><strong>SSP Reviewer:</strong> ' + _esc(formatSspReviewerDisplay(signoff)) + '</div>'
    : buildSspReviewerSelectorHtml(asset.id, getSspSignoffFromState(asset.id), false);

  var html = reviewerTop
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">'
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
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">'
        + '<span>Attestation</span>'
        + (!isSubmitted ? '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openSSPFieldBulkModal(\'asset\',\'' + asset.id + '\',\'' + c.id + '\',\'status\')">Apply to controls…</button>' : '')
        + '</label>'
        + '<select style="width:100%;padding:7px 10px;border:1px solid ' + (statusVal?statusColor:'var(--border)') + ';border-radius:6px;font-size:13px;font-weight:' + (statusVal?'600':'400') + ';color:' + (statusVal?statusColor:'var(--text-muted)') + ';background:white;cursor:pointer;"'
        + (isSubmitted ? ' disabled' : '')
        + ' onchange="setSSPAttestation(\'' + asset.id + '\',\'' + c.id + '\',\'status\',this.value);renderAssetSSPStep4_Attestations();">'
        + '<option value="">— Select status —</option>'
        + SSP_STATUSES.map(function(s){ return '<option value="' + s + '"' + (statusVal===s?' selected':'') + ' style="color:' + (SSP_STATUS_COLORS[s]||'inherit') + ';">' + s + '</option>'; }).join('')
        + '</select></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">'
        + '<span>' + (statusVal && statusVal !== 'Complies' ? '<span style="color:var(--red);">*</span> ' : '') + 'Explanation / Notes</span>'
        + (!isSubmitted ? '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openSSPFieldBulkModal(\'asset\',\'' + asset.id + '\',\'' + c.id + '\',\'explanation\')">Apply to controls…</button>' : '')
        + '</label>'
        + '<textarea style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;" rows="2"'
        + ' placeholder="' + (statusVal==='Complies'?'Optional — describe how this is implemented...':'Required — explain status...') + '"'
        + (isSubmitted ? ' readonly' : '')
        + ' oninput="setSSPAttestation(\'' + asset.id + '\',\'' + c.id + '\',\'explanation\',this.value)">'
        + _esc(explanation)
        + '</textarea></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">'
        + '<span>Evidence Location</span>'
        + (!isSubmitted ? '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openSSPFieldBulkModal(\'asset\',\'' + asset.id + '\',\'' + c.id + '\',\'evidenceLocation\')">Apply to controls…</button>' : '')
        + '</label>'
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

/** Step 4 sign-off: recap Step 1 description, NIST 800-60 types, rationale, and FIPS 199 C/I/A. */
function buildAssetSspSignoffStep1SummaryHtml(asset) {
  if (!asset) return '';
  var aid = String(asset.id);
  var cat = ensureAssetCategorizationRow(aid);
  var fipsLabels = { L: 'Low', M: 'Moderate', H: 'High' };
  var c = _normFipsLetter(cat.confidentiality);
  var i = _normFipsLetter(cat.integrity);
  var a = _normFipsLetter(cat.availability);
  var overall = computeAssetOverallFipsImpact(cat);
  var isFisma = !!state.fismaMode;

  var descBlock = (asset.description && String(asset.description).trim())
    ? '<div style="font-size:12px;font-weight:700;color:var(--navy);margin:0 0 6px;">Asset description</div>'
      + '<div style="font-size:12px;color:#374151;line-height:1.55;margin-bottom:14px;white-space:pre-wrap;">' + _esc(String(asset.description).trim()) + '</div>'
    : '';

  var infoBlock = '';
  if (isFisma) {
    var types = Array.isArray(cat.infoTypes) ? cat.infoTypes : [];
    if (types.length) {
      infoBlock = '<div style="font-size:12px;font-weight:700;color:var(--navy);margin:0 0 8px;">NIST SP 800-60 information types</div>'
        + '<ul style="margin:0;padding-left:18px;font-size:12px;color:#374151;line-height:1.5;list-style:disc;">'
        + types.map(function(t) {
          var tid = (t.id || '').trim();
          var meta = (typeof INFO_TYPES_800_60 !== 'undefined')
            ? INFO_TYPES_800_60.find(function(x) { return x.id === tid; })
            : null;
          var lab = ((t.label || (meta && meta.label) || tid || '')).trim();
          var cia = (t.cia && (t.cia.c || t.cia.i || t.cia.a)) ? t.cia : ((meta && meta.cia) ? meta.cia : {});
          var cc = _normFipsLetter(cia.c || c);
          var ii = _normFipsLetter(cia.i || i);
          var aa = _normFipsLetter(cia.a || a);
          var seed = 'C' + cc + ' / I' + ii + ' / A' + aa;
          var desc = (meta && meta.desc) ? meta.desc : '';
          return '<li style="margin-bottom:10px;"><strong>' + _esc(lab || tid) + '</strong>'
            + (tid && lab !== tid ? ' <span style="color:var(--text-muted);font-weight:500;">(' + _esc(tid) + ')</span>' : '')
            + ' <span style="color:var(--text-muted);">· ' + _esc(seed) + '</span>'
            + (desc ? '<div style="font-size:11px;color:var(--text-muted);margin:4px 0 0;padding-left:0;max-width:520px;line-height:1.45;">' + _esc(desc) + '</div>' : '')
            + '</li>';
        }).join('')
        + '</ul>';
    } else {
      infoBlock = '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">'
        + '<strong>NIST SP 800-60 information types:</strong> none selected. If this system handles cataloged data, return to Step 1 and use the checkboxes so selections persist.</div>';
    }
  } else {
    infoBlock = '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">'
      + 'This program uses <strong>guided FIPS 199 scenarios</strong> on Step 1 (not the NIST 800-60 information-type catalog).</div>';
  }

  var ciaRow = '<div style="display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-top:10px;font-size:12px;color:#374151;">'
    + '<span><strong>Confidentiality:</strong> ' + fipsLabels[c] + '</span>'
    + '<span><strong>Integrity:</strong> ' + fipsLabels[i] + '</span>'
    + '<span><strong>Availability:</strong> ' + fipsLabels[a] + '</span>'
    + '<span style="padding:2px 10px;border-radius:6px;background:#ecfdf5;font-weight:700;color:var(--teal);font-size:11px;">Overall impact: ' + fipsLabels[overall] + '</span>'
    + '</div>';

  var rat = (cat.rationale || '').trim();
  var ratBlock = rat
    ? '<div style="font-size:12px;font-weight:700;color:var(--navy);margin:14px 0 6px;">Categorization rationale (Step 1)</div>'
      + '<div style="font-size:12px;color:#374151;line-height:1.55;white-space:pre-wrap;padding:10px 12px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;">' + _esc(rat) + '</div>'
    : '';

  return '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin-bottom:20px;">'
    + '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);margin-bottom:10px;">Asset profile — Step 1</div>'
    + descBlock
    + infoBlock
    + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin:14px 0 6px;">FIPS 199 security categorization</div>'
    + ciaRow
    + ratBlock
    + '</div>';
}

// ─── STEP 5: REVIEW & SIGN OFF ───────────────────────────────────────────────
function renderAssetSSPStep5_SignOff() {
  var body  = document.getElementById('asset-step-4-body');
  if (!body) return;
  var asset = (state.assets||[]).find(function(a){ return String(a.id) === String(state._selectedAssetId); });
  if (!asset) return;

  var controls  = getAssetSSPControls(asset);
  var attests   = (state.sspAttestations||{})[asset.id] || {};
  ensureSspDefaultReviewer(asset.id);
  var signRaw   = getSspSignoffFromState(asset.id);
  var signSt    = normalizeSspSignoffStatus(signRaw.status);
  var signoff   = Object.assign({}, signRaw, { status: signSt });
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
  var isReviewerReadOnly = signoff.status === 'Approved';
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
      + '<div style="font-size:12px;color:#15803d;">Approved on ' + _esc(signoff.approvedDate || signoff.signedDate || '') + '</div>'
      + '</div></div>';
  } else if (signoff.status === 'Submitted') {
    bannerHtml = '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:16px;margin-bottom:24px;display:flex;gap:12px;align-items:center;">'
      + '<span style="font-size:20px;">📬</span><div>'
      + '<div style="font-weight:700;color:#1e40af;">' + sspLabel + ' Submitted — Awaiting Review</div>'
      + '<div style="font-size:12px;color:#2563eb;">Submitted by ' + _esc(signoff.signedBy||'') + ' on ' + _esc(signoff.signedDate||'') + '</div>'
      + '</div></div>';
  } else if (signoffIsReturnedForRevision(signRaw)) {
    var revBy = _esc((signRaw.aoReturnedBy || 'Reviewer').trim() || 'Reviewer');
    var revOn = _esc(signRaw.aoReturnedAt || '');
    var revNotes = String(signRaw.aoReturnNotes || '').trim();
    bannerHtml = '<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:16px;margin-bottom:24px;display:flex;gap:12px;align-items:flex-start;">'
      + '<span style="font-size:20px;">↩</span><div style="flex:1;min-width:0;">'
      + '<div style="font-weight:700;color:#9a3412;">' + sspLabel + ' returned for revision</div>'
      + '<div style="font-size:12px;color:#c2410c;margin-top:4px;">Returned by ' + revBy + (revOn ? ' on ' + revOn : '') + '.</div>'
      + '<div style="margin-top:10px;padding:10px 12px;background:white;border:1px solid #fed7aa;border-radius:8px;font-size:12px;color:#431407;line-height:1.45;">'
      + '<strong>Reviewer notes</strong> — ' + (revNotes ? _esc(revNotes) : '<span style="color:var(--text-muted);font-style:italic;">No written notes were provided.</span>')
      + '</div></div></div>';
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
    + buildAssetSspSignoffStep1SummaryHtml(asset)
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
    + (isSubmitted && signoff.status === 'Submitted' && !(signoff.reviewerUserId || (signoff.reviewerName || '').trim())
      ? '<div style="margin-top:12px;margin-bottom:8px;padding:10px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#92400e;line-height:1.45;">'
      + 'This SSP is already marked <strong>Submitted</strong> but had no reviewer on file. Assign an SSP reviewer below (or in <strong>Step 2</strong> attestations); the pending review queue will update.</div>'
      : '')
    + (isReviewerReadOnly
      ? '<div style="margin-top:16px;padding:12px 14px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;font-size:12px;color:#334155;line-height:1.5;">'
        + '<strong>SSP Reviewer:</strong> ' + _esc(formatSspReviewerDisplay(getSspSignoffFromState(asset.id)))
        + '</div>'
      : buildSspReviewerSelectorHtml(asset.id, getSspSignoffFromState(asset.id), false))
    + '</div>';
}

function getSignerName() {
  if (!state.currentUserId) return '';
  var u = (state.users||[]).find(function(u){ return u.id === state.currentUserId; });
  return u ? u.name : '';
}

/** Canonical SSP sign-off status (handles legacy casing / stray whitespace). */
function normalizeSspSignoffStatus(st) {
  var s = String(st == null ? '' : st).trim();
  var low = s.toLowerCase();
  if (low === 'submitted') return 'Submitted';
  if (low === 'approved') return 'Approved';
  return s;
}

/** True when reviewer returned the package and owner must revise before resubmitting. */
function signoffIsReturnedForRevision(rawSig) {
  if (!rawSig || !rawSig.aoReturnedAt) return false;
  var st = normalizeSspSignoffStatus(rawSig.status);
  return st !== 'Submitted' && st !== 'Approved';
}

function getSspSignoffFromState(scopeId) {
  var m = state.sspSignoffs || {};
  var a = String(scopeId);
  if (m[a]) return m[a];
  if (m[scopeId]) return m[scopeId];
  return {};
}

/** After reviewer change, keep the latest pending SSP queue row in sync. */
function syncSspReviewerToReviewQueue(scopeId, isProcessSsp) {
  var k = String(scopeId);
  var sig = getSspSignoffFromState(scopeId);
  if (!state.controlReviewQueue || !sig) return;
  for (var i = state.controlReviewQueue.length - 1; i >= 0; i--) {
    var q = state.controlReviewQueue[i];
    if (!q || q.type !== 'ssp') continue;
    if (String(q.assetId) !== k) continue;
    if (!!q.isProcessSsp !== !!isProcessSsp) continue;
    if (q.status && q.status !== 'Pending') continue;
    q.reviewerUserId = sig.reviewerUserId || '';
    q.reviewerName = sig.reviewerName || '';
    q.reviewerEmail = sig.reviewerEmail || '';
    q.reviewerRole = sig.reviewerRole || '';
    return;
  }
}

/** Default SSP reviewer: first ISSM, else first AO, approver, or CISO (small-org assumption). The formal authorization decision lives in the Authorization tab. */
function getDefaultSspReviewerUser() {
  var list = state.users || [];
  var order = ['issm', 'ao', 'approver', 'ciso'];
  for (var r = 0; r < order.length; r++) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].role === order[r]) return list[i];
    }
  }
  for (var j = 0; j < list.length; j++) {
    if (list[j] && list[j].id) return list[j];
  }
  return null;
}

/** Users who may receive SSP / process SSP for review (ISSM / AO / CISO / approver). */
function getSspReviewerCandidateUsers() {
  var roles = { issm: 0, ao: 1, ciso: 2, approver: 3 };
  var list = (state.users || []).filter(function(u) {
    return u && (u.role === 'issm' || u.role === 'ao' || u.role === 'approver' || u.role === 'ciso');
  }).sort(function(a, b) {
    var ra = roles.hasOwnProperty(a.role) ? roles[a.role] : 9;
    var rb = roles.hasOwnProperty(b.role) ? roles[b.role] : 9;
    if (ra !== rb) return ra - rb;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
  if (list.length) return list;
  return (state.users || []).filter(function(u) { return u && u.id; });
}

function ensureSspDefaultReviewer(scopeId) {
  scopeId = String(scopeId);
  if (!state.sspSignoffs) state.sspSignoffs = {};
  var s = state.sspSignoffs[scopeId];
  if (s && normalizeSspSignoffStatus(s.status) === 'Approved') return;
  if (s && s.reviewerUserId) return;
  var def = getDefaultSspReviewerUser();
  if (!def) return;
  if (!state.sspSignoffs[scopeId]) state.sspSignoffs[scopeId] = {};
  state.sspSignoffs[scopeId].reviewerUserId = def.id;
  state.sspSignoffs[scopeId].reviewerName = def.name || '';
  state.sspSignoffs[scopeId].reviewerEmail = def.email || '';
  state.sspSignoffs[scopeId].reviewerRole = def.role || '';
  markDirty();
}

function setSspReviewerFromSelect(scopeId, userId) {
  scopeId = String(scopeId);
  var u = (state.users || []).find(function(x) { return String(x.id) === String(userId); });
  if (!u) return;
  if (!state.sspSignoffs) state.sspSignoffs = {};
  if (!state.sspSignoffs[scopeId]) state.sspSignoffs[scopeId] = {};
  var s = state.sspSignoffs[scopeId];
  if (normalizeSspSignoffStatus(s.status) === 'Approved') return;
  s.reviewerUserId = u.id;
  s.reviewerName = u.name || '';
  s.reviewerEmail = u.email || '';
  s.reviewerRole = u.role || '';
  markDirty();
  syncSspReviewerToReviewQueue(scopeId, !!(state._selectedProcessId && String(state._selectedProcessId) === String(scopeId)));
  if (typeof currentStep !== 'undefined' && currentStep.asset === 2) {
    if (state._selectedAssetId && String(state._selectedAssetId) === String(scopeId)) renderAssetSSPStep4_Attestations();
    else if (state._selectedProcessId && String(state._selectedProcessId) === String(scopeId)) renderProcessSSPStep4_Attestations();
  }
  if (typeof currentStep !== 'undefined' && currentStep.asset === 4) {
    if (state._selectedAssetId && String(state._selectedAssetId) === String(scopeId)) renderAssetSSPStep5_SignOff();
    else if (state._selectedProcessId && String(state._selectedProcessId) === String(scopeId)) renderProcessSSPStep5_SignOff();
  }
}

function formatSspReviewerDisplay(sign) {
  if (!sign) return '—';
  if ((sign.reviewerName || '').trim()) {
    var role = (sign.reviewerRole || '').trim();
    var email = (sign.reviewerEmail || '').trim();
    return (sign.reviewerName || '').trim()
      + (role ? ' (' + role + ')' : '')
      + (email ? ' · ' + email : '');
  }
  return 'Not assigned';
}

/** Footer row: add a new roster person (persists to state.users / Users & roles). */
function buildSspReviewerAddPersonRowHtml(scopeJs, disabled) {
  if (disabled) return '';
  var ro = typeof isUsersReadOnlyForCurrentUser === 'function' && isUsersReadOnlyForCurrentUser();
  var btn = ro
    ? '<button type="button" class="btn btn-secondary btn-sm" disabled title="Read-only in this profile">+ Add person…</button>'
    : '<button type="button" class="btn btn-secondary btn-sm" onclick=\'openSspAddReviewerModal(' + scopeJs + ')\'>+ Add person…</button>';
  return '<div style="margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:12px;">'
    + btn
    + '<span style="font-size:11px;color:var(--text-muted);line-height:1.45;">Adds to <strong>Users &amp; roles</strong> for the whole program and selects them here.</span></div>';
}

function openSspAddReviewerModal(scopeId) {
  if (typeof isUsersReadOnlyForCurrentUser === 'function' && isUsersReadOnlyForCurrentUser()) {
    showToast('Read-only: switch to Admin or CISO to add users.', true);
    return;
  }
  var old = document.getElementById('sspAddReviewerOverlay');
  if (old) old.remove();
  var rolesOpts = ['issm', 'ao', 'ciso', 'approver'].map(function(r) {
    var m = (typeof ROLE_META !== 'undefined' && ROLE_META[r]) ? ROLE_META[r] : { label: r, icon: '👤' };
    var sel = r === 'issm' ? ' selected' : '';
    return '<option value="' + r + '"' + sel + '>' + _esc(m.icon + ' ' + m.label) + '</option>';
  }).join('');
  var overlay = document.createElement('div');
  overlay.id = 'sspAddReviewerOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:10020;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = '<div style="background:white;border-radius:14px;padding:22px 24px;width:440px;max-width:96vw;box-shadow:0 20px 50px rgba(0,0,0,0.2);border:1px solid var(--border);" onclick="event.stopPropagation()">'
    + '<div style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:4px;">Add person to roster</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;line-height:1.45;">Saved in <strong>Administration → Users &amp; roles</strong> and assigned as this SSP\'s reviewer.</div>'
    + '<input type="hidden" id="sspAddReviewerScopeId" value="' + _esc(String(scopeId)) + '">'
    + '<div class="form-group"><label class="form-label">Full name <span style="color:var(--red)">*</span></label>'
    + '<input class="form-input" id="_sspRevName" placeholder="e.g. Jordan Kim" autocomplete="name"></div>'
    + '<div class="form-group"><label class="form-label">Email</label>'
    + '<input class="form-input" id="_sspRevEmail" placeholder="name@org.gov" autocomplete="email"></div>'
    + '<div class="form-group"><label class="form-label">Role <span style="color:var(--red)">*</span></label>'
    + '<select class="form-select" id="_sspRevRole">' + rolesOpts + '</select>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">ISSM / AO / CISO / policy approver — matches who can receive SSP review in this tool.</div></div>'
    + '<div class="form-group"><label class="form-label">Note <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>'
    + '<input class="form-input" id="_sspRevNote" placeholder="e.g. Acting ISSM, SSP review staff"></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">'
    + '<button type="button" class="btn btn-secondary" onclick="closeSspAddReviewerModal()">Cancel</button>'
    + '<button type="button" class="btn" onclick="saveSspReviewerNewUser()">Add &amp; assign</button>'
    + '</div></div>';
  overlay.onclick = function() { closeSspAddReviewerModal(); };
  document.body.appendChild(overlay);
  var n = document.getElementById('_sspRevName');
  if (n) n.focus();
}

function closeSspAddReviewerModal() {
  var ov = document.getElementById('sspAddReviewerOverlay');
  if (ov) ov.remove();
}

function saveSspReviewerNewUser() {
  if (typeof isUsersReadOnlyForCurrentUser === 'function' && isUsersReadOnlyForCurrentUser()) {
    showToast('Read-only: you cannot add users.', true);
    return;
  }
  var hid = document.getElementById('sspAddReviewerScopeId');
  var scopeId = hid ? String(hid.value || '').trim() : '';
  if (!scopeId) { closeSspAddReviewerModal(); return; }
  var nameEl = document.getElementById('_sspRevName');
  var emailEl = document.getElementById('_sspRevEmail');
  var roleEl = document.getElementById('_sspRevRole');
  var noteEl = document.getElementById('_sspRevNote');
  var name = nameEl ? String(nameEl.value || '').trim() : '';
  var email = emailEl ? String(emailEl.value || '').trim() : '';
  var role = roleEl ? String(roleEl.value || '').trim() : '';
  var note = noteEl ? String(noteEl.value || '').trim() : '';
  if (!name) { showToast('Name is required.', true); return; }
  if (!role || ['issm', 'ao', 'ciso', 'approver'].indexOf(role) === -1) { showToast('Select a valid reviewer role.', true); return; }
  var dup = (state.users || []).some(function(u) {
    return u && String(u.name || '').trim().toLowerCase() === name.toLowerCase();
  });
  if (dup) {
    showToast('That name is already in the roster — choose them from the reviewer list.', true);
    return;
  }
  if (!state.users) state.users = [];
  var id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  state.users.push({
    id: id,
    name: name,
    email: email,
    role: role,
    roles: [role],
    families: [],
    controls: [],
    assets: [],
    note: note
  });
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('users', id, 'Added from SSP reviewer picker: ' + name + ' (' + role + ')');
  }
  markDirty();
  closeSspAddReviewerModal();
  showToast('Added ' + name + ' to Users & roles and assigned as reviewer.');
  setSspReviewerFromSelect(scopeId, id);
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
}

function buildSspReviewerSelectorHtml(scopeId, signoff, disabled) {
  var scopeJs = JSON.stringify(String(scopeId));
  var candidates = getSspReviewerCandidateUsers();
  var selId = signoff.reviewerUserId || '';
  if (!candidates.length) {
    return '<div style="margin-bottom:16px;">'
      + '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;font-size:12px;color:#92400e;">'
      + '<strong>SSP Reviewer:</strong> No one in the roster yet — use <strong>Add person</strong> below or add users under <strong>Administration → Users &amp; roles</strong>.</div>'
      + buildSspReviewerAddPersonRowHtml(scopeJs, disabled)
      + '</div>';
  }
  var opts = candidates.map(function(u) {
    var lab = (u.name || 'User') + (u.email ? ' · ' + u.email : '') + ' — ' + (u.role || '');
    return '<option value="' + _esc(String(u.id)) + '"' + (String(u.id) === String(selId) ? ' selected' : '') + '>' + _esc(lab) + '</option>';
  }).join('');
  return '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:16px;">'
    + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">SSP Reviewer</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.45;">Pre-selected reviewer follows program order: <strong>ISSM</strong> if present, otherwise <strong>AO</strong>, then <strong>approver</strong>, then <strong>CISO</strong>, otherwise the first user in the roster. Change below before signing.</div>'
    + '<label class="form-label" style="font-size:10px;">Assigned reviewer</label>'
    + '<select class="form-select" style="font-size:12px;max-width:520px;" ' + (disabled ? 'disabled ' : '')
    + 'onchange=\'setSspReviewerFromSelect(' + scopeJs + ', this.value)\'>'
    + opts
    + '</select>'
    + buildSspReviewerAddPersonRowHtml(scopeJs, disabled)
    + '</div>';
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

function getSSPBulkControls(scopeType, scopeId) {
  if (scopeType === 'asset') {
    var asset = (state.assets || []).find(function(a) { return String(a.id) === String(scopeId); });
    return asset ? getAssetSSPControls(asset) : [];
  }
  if (scopeType === 'process') {
    var proc = (state.processes || []).find(function(p) { return String(p.id) === String(scopeId); });
    return proc ? getProcessSSPControls(proc) : [];
  }
  return [];
}

function getSSPBulkRenderFn(scopeType) {
  return scopeType === 'process' ? renderProcessSSPStep4_Attestations : renderAssetSSPStep4_Attestations;
}

function openSSPFieldBulkModal(scopeType, scopeId, sourceCtrlId, field) {
  var controls = getSSPBulkControls(scopeType, scopeId);
  var sourceControl = controls.find(function(c) { return c.id === sourceCtrlId; }) || CONTROLS.find(function(c) { return c.id === sourceCtrlId; });
  var eligible = controls.filter(function(c) { return c.id !== sourceCtrlId; });
  if (!eligible.length) {
    showToast('No other controls available for bulk apply.', true);
    return;
  }

  var attestsByScope = (state.sspAttestations || {})[scopeId] || {};
  var sourceAtt = attestsByScope[sourceCtrlId] || {};
  var sourceValue = sourceAtt[field];
  var fieldMeta = {
    status: { label: 'Attestation', emptyMsg: 'Select an attestation status on the source control first.' },
    explanation: { label: 'Explanation / Notes', emptyMsg: 'Enter explanation/notes on the source control first.' },
    evidenceLocation: { label: 'Evidence Location', emptyMsg: 'Enter evidence location on the source control first.' }
  };
  var meta = fieldMeta[field];
  if (!meta) return;
  if (!String(sourceValue || '').trim()) {
    showToast(meta.emptyMsg, true);
    return;
  }

  var selected = {};
  var defaultFamily = sourceControl ? sourceControl.f : '';
  eligible.forEach(function(c) { selected[c.id] = !!(defaultFamily && c.f === defaultFamily); });

  window._sspBulkFieldState = {
    scopeType: scopeType,
    scopeId: scopeId,
    sourceCtrlId: sourceCtrlId,
    field: field,
    familyFilter: defaultFamily,
    search: '',
    selected: selected
  };

  var existing = document.getElementById('sspBulkFieldOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'sspBulkFieldOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:10080;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:28px 18px;';
  overlay.innerHTML = ''
    + '<div style="background:white;border-radius:14px;width:920px;max-width:100%;box-shadow:0 24px 60px rgba(2,6,23,0.22);overflow:hidden;">'
    + '  <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">'
    + '    <div>'
    + '      <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:4px;">Apply ' + escapeHTML(meta.label) + ' to other controls</div>'
    + '      <div style="font-size:12px;color:var(--text-muted);line-height:1.45;">Source: <span class="control-id">' + escapeHTML(sourceCtrlId) + '</span> — ' + escapeHTML((sourceControl && sourceControl.n) || '') + '</div>'
    + '      <div style="font-size:11px;color:#334155;line-height:1.45;margin-top:4px;"><strong>Value:</strong> ' + escapeHTML(String(sourceValue || '').slice(0, 180) + (String(sourceValue || '').length > 180 ? '…' : '')) + '</div>'
    + '    </div>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="closeSSPFieldBulkModal()">Close</button>'
    + '  </div>'
    + '  <div id="sspBulkFieldBody" style="padding:16px 20px;"></div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeSSPFieldBulkModal(); });
  renderSSPFieldBulkModalBody();
}

function closeSSPFieldBulkModal() {
  var overlay = document.getElementById('sspBulkFieldOverlay');
  if (overlay) overlay.remove();
  window._sspBulkFieldState = null;
}

function renderSSPFieldBulkModalBody() {
  var st = window._sspBulkFieldState;
  var body = document.getElementById('sspBulkFieldBody');
  if (!st || !body) return;

  var controls = getSSPBulkControls(st.scopeType, st.scopeId);
  var sourceControl = controls.find(function(c) { return c.id === st.sourceCtrlId; });
  var eligible = controls.filter(function(c) { return c.id !== st.sourceCtrlId; });
  var families = Array.from(new Set(eligible.map(function(c) { return c.f; }))).sort();
  var q = String(st.search || '').toLowerCase();
  var familyFilter = String(st.familyFilter || '');
  var filtered = eligible.filter(function(c) {
    if (familyFilter && c.f !== familyFilter) return false;
    if (!q) return true;
    return String(c.id).toLowerCase().indexOf(q) !== -1 || String(c.n || '').toLowerCase().indexOf(q) !== -1;
  });
  var selectedCount = eligible.filter(function(c) { return !!st.selected[c.id]; }).length;
  var filteredSelected = filtered.filter(function(c) { return !!st.selected[c.id]; }).length;
  var allFilteredSelected = !!filtered.length && filteredSelected === filtered.length;

  body.innerHTML = ''
    + '<div style="display:grid;grid-template-columns:180px 1fr;gap:10px;align-items:end;margin-bottom:12px;">'
    + '  <div><label class="form-label" style="font-size:10px;">Family filter</label>'
    + '    <select class="form-select" style="font-size:12px;" onchange="window._sspBulkFieldState.familyFilter=this.value;renderSSPFieldBulkModalBody();">'
    + '      <option value="">All families</option>'
    +        families.map(function(f) {
              return '<option value="' + escapeHTML(f) + '"' + (familyFilter === f ? ' selected' : '') + '>' + escapeHTML(f + ' — ' + (FAMILIES[f] || f)) + '</option>';
            }).join('')
    + '    </select></div>'
    + '  <div><label class="form-label" style="font-size:10px;">Search</label>'
    + '    <input class="form-input" style="font-size:12px;" placeholder="Filter by control ID or name" value="' + escapeHTML(st.search || '') + '" oninput="window._sspBulkFieldState.search=this.value;renderSSPFieldBulkModalBody();"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
    + '  <div style="font-size:12px;color:var(--text-muted);">' + selectedCount + ' selected of ' + eligible.length + ' controls'
    + (sourceControl && sourceControl.f ? ' · default scope: ' + escapeHTML(sourceControl.f) : '')
    + '  </div>'
    + '  <div style="display:flex;gap:8px;">'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="sspBulkFieldSelectFiltered(true)">Select all eligible</button>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="sspBulkFieldSelectFiltered(false)">Clear</button>'
    + '  </div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;max-height:360px;overflow:auto;">'
    + '  <table class="control-table" style="margin:0;">'
    + '    <thead><tr>'
    + '      <th style="width:42px;"><input type="checkbox" ' + (allFilteredSelected ? 'checked' : '') + ' onchange="sspBulkFieldSelectFiltered(this.checked)" style="accent-color:var(--teal);"></th>'
    + '      <th style="width:95px;">Control</th>'
    + '      <th>Name</th>'
    + '      <th style="width:70px;">Family</th>'
    + '    </tr></thead>'
    + '    <tbody>'
    +      (filtered.length ? filtered.map(function(c) {
            var checked = !!st.selected[c.id];
            return '<tr>'
              + '<td><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="sspBulkFieldSetOne(\'' + c.id.replace(/'/g, "\\'") + '\',this.checked)" style="accent-color:var(--teal);"></td>'
              + '<td><span class="control-id">' + escapeHTML(c.id) + '</span></td>'
              + '<td style="font-size:12px;color:var(--navy);">' + escapeHTML(c.n) + '</td>'
              + '<td><span class="family-badge">' + escapeHTML(c.f) + '</span></td>'
              + '</tr>';
          }).join('') : '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No controls match current filter.</td></tr>')
    + '    </tbody>'
    + '  </table>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">'
    + '  <button type="button" class="btn btn-secondary btn-sm" onclick="closeSSPFieldBulkModal()">Cancel</button>'
    + '  <button type="button" class="btn btn-primary btn-sm" onclick="applySSPFieldBulkToSelected()">Apply to selected controls</button>'
    + '</div>';
}

function sspBulkFieldSetOne(ctrlId, checked) {
  var st = window._sspBulkFieldState;
  if (!st) return;
  st.selected[ctrlId] = !!checked;
  renderSSPFieldBulkModalBody();
}

function sspBulkFieldSelectFiltered(checked) {
  var st = window._sspBulkFieldState;
  if (!st) return;
  var eligible = getSSPBulkControls(st.scopeType, st.scopeId).filter(function(c) { return c.id !== st.sourceCtrlId; });
  var q = String(st.search || '').toLowerCase();
  var familyFilter = String(st.familyFilter || '');
  eligible.forEach(function(c) {
    if (familyFilter && c.f !== familyFilter) return;
    if (q && String(c.id).toLowerCase().indexOf(q) === -1 && String(c.n || '').toLowerCase().indexOf(q) === -1) return;
    st.selected[c.id] = !!checked;
  });
  renderSSPFieldBulkModalBody();
}

function applySSPFieldBulkToSelected() {
  var st = window._sspBulkFieldState;
  if (!st) return;
  var controls = getSSPBulkControls(st.scopeType, st.scopeId);
  var eligible = controls.filter(function(c) { return c.id !== st.sourceCtrlId; });
  var selectedIds = eligible.map(function(c) { return c.id; }).filter(function(id) { return !!st.selected[id]; });
  if (!selectedIds.length) {
    showToast('Select at least one control to update.', true);
    return;
  }
  if (!state.sspAttestations) state.sspAttestations = {};
  if (!state.sspAttestations[st.scopeId]) state.sspAttestations[st.scopeId] = {};
  var sourceAtt = state.sspAttestations[st.scopeId][st.sourceCtrlId] || {};
  var sourceValue = sourceAtt[st.field];
  if (!String(sourceValue || '').trim()) {
    showToast('Source value is empty.', true);
    return;
  }
  var label = st.field === 'status' ? 'attestation status' : st.field === 'explanation' ? 'explanation/notes' : 'evidence location';
  if (!window.confirm('Apply this ' + label + ' to ' + selectedIds.length + ' control' + (selectedIds.length === 1 ? '' : 's') + '?')) return;

  var applied = 0;
  var skipped = 0;
  selectedIds.forEach(function(ctrlId) {
    if (!state.sspAttestations[st.scopeId][ctrlId]) state.sspAttestations[st.scopeId][ctrlId] = {};
    var targetAtt = state.sspAttestations[st.scopeId][ctrlId];
    if (String(targetAtt[st.field] || '') === String(sourceValue || '')) {
      skipped++;
      return;
    }
    targetAtt[st.field] = sourceValue;
    targetAtt.date = new Date().toISOString().slice(0,10);
    applied++;
  });

  addAuditEntry(st.scopeType === 'process' ? 'process' : 'asset', st.scopeId, 'Bulk-applied ' + label + ' from ' + st.sourceCtrlId + ' to ' + applied + ' control(s)' + (skipped ? ' (' + skipped + ' unchanged)' : '') + '.');
  markDirty();
  closeSSPFieldBulkModal();
  showToast('✅ Applied ' + label + ' to ' + applied + ' control' + (applied === 1 ? '' : 's') + (skipped ? ' · ' + skipped + ' unchanged' : '') + '.');
  var rerender = getSSPBulkRenderFn(st.scopeType);
  rerender();
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
  if (!state.sspSignoffs) state.sspSignoffs = {};
  ensureSspDefaultReviewer(asset.id);
  var prevSign = state.sspSignoffs[asset.id] || {};
  if (!prevSign.reviewerUserId) {
    showToast('Select a reviewer (ISSM / AO / CISO / approver) before submitting.', true);
    return;
  }
  var revName = (prevSign.reviewerName || '').trim() || formatSspReviewerDisplay(prevSign);
  if (!confirm('Submit the SSP for "' + asset.name + '" signed by ' + signer + '?\n\nThis will send it to ' + revName + ' for review.')) return;
  state.sspSignoffs[asset.id] = Object.assign({}, prevSign, {
    signedBy: signer,
    signedDate: new Date().toISOString().slice(0,10),
    status: 'Submitted'
  });
  delete state.sspSignoffs[asset.id].aoReturnNotes;
  delete state.sspSignoffs[asset.id].aoReturnedAt;
  delete state.sspSignoffs[asset.id].aoReturnedBy;
  // Push to ISSM review queue
  if (!state.controlReviewQueue) state.controlReviewQueue = [];
  state.controlReviewQueue.push({
    type: 'ssp',
    assetId: asset.id,
    assetName: asset.name,
    submittedBy: signer,
    date: new Date().toISOString().slice(0,10),
    status: 'Pending',
    reviewerUserId: state.sspSignoffs[asset.id].reviewerUserId || '',
    reviewerName: state.sspSignoffs[asset.id].reviewerName || '',
    reviewerEmail: state.sspSignoffs[asset.id].reviewerEmail || '',
    reviewerRole: state.sspSignoffs[asset.id].reviewerRole || ''
  });
  addAuditEntry('asset', asset.id, 'SSP submitted by ' + signer + ' for reviewer ' + revName);
  markDirty();
  showToast('✅ SSP submitted for ' + asset.name);
  renderAssetSSPStep5_SignOff();
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
  if (state.sspInterconnections) delete state.sspInterconnections[assetId];
  if (state.assetCategorization) delete state.assetCategorization[assetId];
  if (state.assetMappings)   Object.keys(state.assetMappings).forEach(function(cid){ state.assetMappings[cid] = (state.assetMappings[cid]||[]).filter(function(id){ return String(id)!==String(assetId); }); });
  if (state.controlReviewQueue) state.controlReviewQueue = state.controlReviewQueue.filter(function(r){ return r && String(r.assetId || r.scopeId || '') !== String(assetId); });
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
  if (state.sspInterconnections) delete state.sspInterconnections[procId];
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
    + '<select class="form-select" onchange="state.processes[' + idx + '].category=this.value; window.markDirty();">'
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

function renderProcessSSPStep4_Attestations() {
  var body = document.getElementById('asset-step-2-body');
  if (!body) return;
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) return;

  var controls  = getProcessSSPControls(proc);
  var attests   = (state.sspAttestations||{})[proc.id] || {};
  ensureSspDefaultReviewer(proc.id);
  var signRawP  = getSspSignoffFromState(proc.id);
  var signStP   = normalizeSspSignoffStatus(signRawP.status);
  var isSubmitted = signStP === 'Submitted' || signStP === 'Approved';
  var isReviewerPickerLockedP = signStP === 'Approved';
  var signoff   = Object.assign({}, signRawP, { status: signStP });

  var countEl = document.getElementById('asset-step-2-count');
  if (countEl) {
    var done = controls.filter(function(c){ return attests[c.id] && attests[c.id].status; }).length;
    countEl.textContent = done + ' / ' + controls.length + ' attested';
  }

  if (!controls.length) {
    var reviewerStripP = isReviewerPickerLockedP
      ? '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px;color:#334155;"><strong>SSP Reviewer:</strong> ' + _esc(formatSspReviewerDisplay(signoff)) + '</div>'
      : buildSspReviewerSelectorHtml(proc.id, getSspSignoffFromState(proc.id), false);
    body.innerHTML = reviewerStripP + '<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls for This Category</div><p>Change the process category in Step 1 to load applicable controls.</p></div>';
    return;
  }

  var cat = PROCESS_CATEGORIES.find(function(c){ return c.id === proc.category; });
  var reviewerTopP = isReviewerPickerLockedP
    ? '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:12px;color:#334155;"><strong>SSP Reviewer:</strong> ' + _esc(formatSspReviewerDisplay(signoff)) + '</div>'
    : buildSspReviewerSelectorHtml(proc.id, getSspSignoffFromState(proc.id), false);
  var html = reviewerTopP + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">'
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
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">'
        + '<span>Attestation</span>'
        + (!isSubmitted ? '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openSSPFieldBulkModal(\'process\',\'' + proc.id + '\',\'' + c.id + '\',\'status\')">Apply to controls…</button>' : '')
        + '</label>'
        + '<select style="width:100%;padding:7px 10px;border:1px solid ' + (statusVal?statusColor:'var(--border)') + ';border-radius:6px;font-size:13px;font-weight:' + (statusVal?'600':'400') + ';color:' + (statusVal?statusColor:'var(--text-muted)') + ';background:white;cursor:pointer;"'
        + (isSubmitted ? ' disabled' : '')
        + ' onchange="setSSPAttestation(\'' + proc.id + '\',\'' + c.id + '\',\'status\',this.value);renderProcessSSPStep4_Attestations();">'
        + '<option value="">— Select status —</option>'
        + SSP_STATUSES.map(function(s){ return '<option value="' + s + '"' + (statusVal===s?' selected':'') + ' style="color:' + (SSP_STATUS_COLORS[s]||'inherit') + ';">' + s + '</option>'; }).join('')
        + '</select></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">'
        + '<span>' + (statusVal && statusVal !== 'Complies' ? '<span style="color:var(--red);">*</span> ' : '') + 'Explanation / Notes</span>'
        + (!isSubmitted ? '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openSSPFieldBulkModal(\'process\',\'' + proc.id + '\',\'' + c.id + '\',\'explanation\')">Apply to controls…</button>' : '')
        + '</label>'
        + '<textarea style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;" rows="2"'
        + ' placeholder="' + (statusVal==='Complies'?'Optional — describe how this process addresses the control...':'Required — explain status...') + '"'
        + (isSubmitted ? ' readonly' : '')
        + ' oninput="setSSPAttestation(\'' + proc.id + '\',\'' + c.id + '\',\'explanation\',this.value)">'
        + _esc(explanation)
        + '</textarea></div>'
        + '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">'
        + '<span>Evidence Location</span>'
        + (!isSubmitted ? '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openSSPFieldBulkModal(\'process\',\'' + proc.id + '\',\'' + c.id + '\',\'evidenceLocation\')">Apply to controls…</button>' : '')
        + '</label>'
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

function renderProcessSSPStep5_SignOff() {
  var body = document.getElementById('asset-step-4-body');
  if (!body) return;
  var proc = (state.processes||[]).find(function(p){ return String(p.id)===String(state._selectedProcessId); });
  if (!proc) return;

  var controls    = getProcessSSPControls(proc);
  var attests     = (state.sspAttestations||{})[proc.id] || {};
  ensureSspDefaultReviewer(proc.id);
  var signRawPr   = getSspSignoffFromState(proc.id);
  var signStPr    = normalizeSspSignoffStatus(signRawPr.status);
  var signoff     = Object.assign({}, signRawPr, { status: signStPr });
  var complies    = controls.filter(function(c){ return (attests[c.id]||{}).status==='Complies'; }).length;
  var partial     = controls.filter(function(c){ return (attests[c.id]||{}).status==='Partially Complies'; }).length;
  var notComply   = controls.filter(function(c){ return (attests[c.id]||{}).status==='Does Not Comply'; }).length;
  var notApply    = controls.filter(function(c){ return (attests[c.id]||{}).status==='Not Applicable'; }).length;
  var inherited   = controls.filter(function(c){ return (attests[c.id]||{}).status==='Inherited'; }).length;
  var unanswered  = controls.filter(function(c){ return !(attests[c.id]||{}).status; }).length;
  var isComplete  = unanswered === 0;
  var isSubmitted = signoff.status === 'Submitted' || signoff.status === 'Approved';
  var isReviewerReadOnlyPr = signoff.status === 'Approved';
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
    submitBtn.textContent = isSubmitted ? (signoff.status === 'Approved' ? '✓ Approved' : '✓ Submitted') : '✓ Sign & Submit Process SSP';
    submitBtn.onclick = function(){ submitProcessSSP(); };
    submitBtn.disabled = isSubmitted || !isComplete;
    submitBtn.style.opacity = (isSubmitted || !isComplete) ? '0.5' : '1';
  }

  var retBannerPr = '';
  if (signoffIsReturnedForRevision(signRawPr)) {
    var prBy = _esc((signRawPr.aoReturnedBy || 'Reviewer').trim() || 'Reviewer');
    var prOn = _esc(signRawPr.aoReturnedAt || '');
    var prNotes = String(signRawPr.aoReturnNotes || '').trim();
    var sspLabPr = state.privacyOverlay ? 'SPSP' : 'SSP';
    retBannerPr = '<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:16px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;">'
      + '<span style="font-size:20px;">↩</span><div style="flex:1;min-width:0;">'
      + '<div style="font-weight:700;color:#9a3412;">Process ' + sspLabPr + ' returned for revision</div>'
      + '<div style="font-size:12px;color:#c2410c;margin-top:4px;">Returned by ' + prBy + (prOn ? ' on ' + prOn : '') + '.</div>'
      + '<div style="margin-top:10px;padding:10px 12px;background:white;border:1px solid #fed7aa;border-radius:8px;font-size:12px;color:#431407;line-height:1.45;">'
      + '<strong>Reviewer notes</strong> — ' + (prNotes ? _esc(prNotes) : '<span style="color:var(--text-muted);font-style:italic;">No written notes were provided.</span>')
      + '</div></div></div>';
  }

  body.innerHTML = retBannerPr + (isSubmitted ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;"><span style="font-size:20px;">✅</span><div><div style="font-weight:700;color:#166534;">Process SSP Submitted</div><div style="font-size:12px;color:#15803d;">Signed by ' + _esc(signoff.signedBy||'') + ' on ' + (signoff.signedDate||'') + '</div></div></div>' : '')
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
      + '<input class="form-input" id="ssp-signedby" value="' + _esc(getSignerName()) + '" placeholder="Enter your full name"></div>' : '')
    + (isSubmitted && signoff.status === 'Submitted' && !(signoff.reviewerUserId || (signoff.reviewerName || '').trim())
      ? '<div style="margin-top:12px;margin-bottom:8px;padding:10px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#92400e;line-height:1.45;">'
      + 'This process SSP is already <strong>Submitted</strong> but had no reviewer on file. Assign a reviewer below; the pending review queue will update.</div>'
      : '')
    + (isReviewerReadOnlyPr
      ? '<div style="margin-top:16px;padding:12px 14px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;font-size:12px;color:#334155;line-height:1.5;">'
        + '<strong>SSP Reviewer:</strong> ' + _esc(formatSspReviewerDisplay(getSspSignoffFromState(proc.id)))
        + '</div>'
      : buildSspReviewerSelectorHtml(proc.id, getSspSignoffFromState(proc.id), false));
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
  if (!state.sspSignoffs) state.sspSignoffs = {};
  ensureSspDefaultReviewer(proc.id);
  var prevProcSign = state.sspSignoffs[proc.id] || {};
  if (!prevProcSign.reviewerUserId) {
    showToast('Select a reviewer (ISSM / AO / CISO / approver) before submitting.', true);
    return;
  }
  var revProcName = (prevProcSign.reviewerName || '').trim() || formatSspReviewerDisplay(prevProcSign);
  if (!confirm('Submit the Process SSP for "' + proc.name + '" signed by ' + signer + '?\n\nThis will send it to ' + revProcName + ' for review.')) return;
  state.sspSignoffs[proc.id] = Object.assign({}, prevProcSign, {
    signedBy: signer,
    signedDate: new Date().toISOString().slice(0,10),
    status: 'Submitted'
  });
  delete state.sspSignoffs[proc.id].aoReturnNotes;
  delete state.sspSignoffs[proc.id].aoReturnedAt;
  delete state.sspSignoffs[proc.id].aoReturnedBy;
  if (!state.controlReviewQueue) state.controlReviewQueue = [];
  state.controlReviewQueue.push({
    type: 'ssp',
    assetId: proc.id,
    assetName: proc.name,
    isProcessSsp: true,
    submittedBy: signer,
    date: new Date().toISOString().slice(0,10),
    status: 'Pending',
    reviewerUserId: state.sspSignoffs[proc.id].reviewerUserId || '',
    reviewerName: state.sspSignoffs[proc.id].reviewerName || '',
    reviewerEmail: state.sspSignoffs[proc.id].reviewerEmail || '',
    reviewerRole: state.sspSignoffs[proc.id].reviewerRole || ''
  });
  addAuditEntry('process', proc.id, 'Process SSP submitted by ' + signer + ' for reviewer ' + revProcName);
  markDirty();
  showToast('✅ Process SSP submitted for ' + proc.name);
  renderProcessSSPStep5_SignOff();
  updateNotificationBadges();
  showTab('reports');
}

// Legacy stubs (keep so old snapshots don't break)
function saveAttestation() { showToast('✅ Attestations saved!'); }
function addAsset() { openAddAssetModal(); }
