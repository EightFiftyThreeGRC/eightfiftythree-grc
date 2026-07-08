// js/core.js — foundation (load first). Split from app.js (Step 1).
// Globals only; no IIFE. Depends on nothing; other scripts depend on this file.

// NIST CSF 2.0 catalog: js/csf-catalog.js (FUNCTIONS, CATEGORIES, SUBCATEGORIES)

const ROLE_TABS = {
  // The Control Assessment + Authorization workspaces were removed (2026-04-27).
  // AOs still record decisions through openAtoDecisionModal() launched from the
  // Reports dashboard. Asssessors no longer have a dedicated workspace —
  // assessment data persists in state but is not edited via UI.
  'ciso':          ['home','ciso','policy','asset','frameworks','risk','reports'],
  'issm':          ['home','policy','asset','frameworks','risk','reports'],
  'control-owner': ['home','control','frameworks','risk','reports'],
  'asset-owner':   ['home','asset','risk','reports'],
  'custodian':     ['home','policy','reports'],
  'assessor':      ['home','risk','reports'],
  'ao':            ['home','asset','risk','reports','users'],
  'approver':      ['home','reports'],
};

// Default program-owner title (CISO wizard Step 1).
const DEFAULT_PROGRAM_OWNER_TITLE = 'Chief Information Security Officer';

function getDefaultProgramOwnerTitle() {
  return DEFAULT_PROGRAM_OWNER_TITLE;
}

// ============================================================
// APP STATE
// ============================================================
const state = {
  selectedCategories: null,  // { 'GV.OC': true, ... } — null until CISO step 2 seeds all categories
  policyStructure: 'category', // 'function' | 'category' — Tier 2 policy granularity
  gvSubcategories: {},         // { 'GV.PO-01': true, ... } — Tier 1 Govern outcomes in scope
  categoryMerges: {},          // { 'PR.AT': 'PR.AA' } — category policy mode only
  orgName: '',
  orgOwnership: '',
  orgGovLevel: '',
  orgSector: '',
  customRegFrameworks: [],
  programOwner: '',
  programOwnerTitle: 'Chief Information Security Officer',
  programOwnerEmail: '',
  cisoIsISSM: false,
  domainOwners: {},
  policyDeadlines: {},      // { 'AC': '2026-06-01', ... }
  policyStatus: {},         // { 'AC': { status, version, notes, lastUpdated } }
  controlStatus: {},        // { 'AC-1': { status, evidence, narrative, owner } }
  controlOwnerAttested: false,   // true = control owner has checked attestation
  _ctrlEvidenceFilter: 'all',    // 'all' | 'missing' | 'has'
  controlTestResults: {},   // { 'AC-1': { result, date, tester, findings } }
  authBoundaries: [],       // [{ id, name, description, assetTypes, assetIds, processIds, aoUserId, assessorUserIds, atoStatus, atoGrantedDate, atoExpiresDate, conditions }]
  /** User-defined roles (slug on user.role); tabsTemplate: 'assessor' | 'reports-only' */
  customProgramRoles: [],
  roleLabelOverrides: {},        // { 'ciso':'Domain Owner', ... } relabel built-in/custom roles
  assessmentPlans: {},      // { [boundaryId]: { scopeMode, inScopeControlIds[], controlPlans{} } }
  atoDecisions: {},         // { [boundaryId]: { boundaryId, decision, decidedByUserId, decidedAt, conditions[], expiresAt, residualRiskNarrative, signature } }
  _atoLibraryFilter: { families: [], assetTypes: [], assetIds: [], statuses: [], search: '' },
  assets: [],               // [{ id, name, type, description, owner, ownerId }]
  assetCategorization: {},  // { [assetId]: { confidentiality:'L'|'M'|'H', integrity, availability, rationale } } — FIPS 199 high-water for SSP / V3 elevation
  baselineElevationRecommendations: [], // V3 CISO workflow: elevated-baseline subtype proposals (never mutates state.baseline)
  processes: [],            // [{ id, name, category, description, owner }]
  attestations: {},         // legacy — superseded by sspAttestations
  sspAttestations: {},      // { assetId|procId: { controlId: { status, explanation, date } } }
  sspSignoffs: {},          // { assetId|procId: { signedBy, signedDate, status, reviewerUserId, reviewerName, reviewerEmail, reviewerRole } }
  sspInterconnections: {},  // { assetId|procId: [{ id, name, direction, dataTypes, agreement, ... }] } SSP interconnection records
  customAssetTypes: [],     // user-defined asset types added by control owners
  customAssetTypeGroups: {}, // { 'OT Device':'Infrastructure', ... }
  customAssetTypeHeaders: [], // user-defined group headers shown in asset coverage
  removedBuiltInAssetTypeKeys: [],   // built-in asset type keys the user has removed
  removedBuiltInAssetTypeGroups: [], // built-in asset type group headers the user has removed
  customProcessCategories: [],       // [{ id, label }] user-defined process domains
  customProcessTypes: [],            // [{ typeKey, label, categoryId }] custom process subtypes for control design
  removedBuiltInProcessCategories: [], // PROCESS_CATEGORIES ids removed from the catalog
  assetTypeLabelOverrides: {},         // { typeKey: displayLabel } built-in asset/process subtypes
  assetCategoryLabelOverrides: {},     // { canonicalCategoryName: displayLabel }
  processCategoryLabelOverrides: {},   // { categoryId: displayLabel }
  cisoComplete: false,
  infoSecPolicy: null,
  policySelectedControls: null,  // { 'AC': ['AC-1', 'AC-2', ...] }
  domainPolicies: null,          // { 'AC': { title, purpose, scope, roles, requirements, ... } }
  controlOwners: null,           // { 'AC-1': { name, role, email, dueDate } }
  policyMerges: {},              // alias: category merges when policyStructure === 'category'
  policyPriorities: {},          // { 'AC': 'now'|'soon'|'later' }
  domainDeadlines: {},           // { 'AC': 'YYYY-MM-DD' } per-domain deadline overrides
  domainCustomNames: {},         // { 'AC': 'Custom Policy Name' } user-defined policy titles
  _policyDomain: null,           // currently active domain in Policy tab
  _policyWizardMode: false,      // true = wizard open, false = domain list
  _policyDocView: false,         // true = show read-only policy document viewer
  _ispReviewView: false,         // true = read-only Tier 1 ISP viewer (approvers without policy tab)
  _ispRevisionView: false,       // true = dedicated returned-ISP editor (policy tab, not setup wizard)
  _policyLibraryMode: false,     // true = show global policy library, false = policy workspace/home
  _policyOwnerFilter: '',        // selected owner name on landing page
  _controlLibraryMode: false,    // true = show global control library, false = control-owner workspace
  _controlLibraryFamilyFilter: '',
  _controlLibraryStatusFilter: '',
  _controlLibraryAssetTypeFilter: '',
  _controlLibrarySearch: '',
  _controlLibraryColFilters: {},  // { control:'', name:'', owner:'', impl:'', asset:'', compliance:'', lifecycle:'' }
  _controlQueueFilters: { search: '', families: [], owners: [], statuses: [] },
  _controlDesignFamily: null,    // active family sub-step in Steps 1–2 design flow
  _assetLibraryMode: false,    // true = show global asset library, false = asset workspace
  _assetTypeLibraryMode: false, // true = show asset type library, false = asset workspace
  _sspReviewerReadOnly: false,  // true = AO/ISSM viewing submitted SSP in read-only package view (not owner wizard)
  _sspReadOnlyExitTab: null,     // 'reports' | 'library' — where Back returns after read-only SSP view
  assetTypeRequests: [],        // [{id, action, typeName, reason, requestedBy, requestedAt, status, reviewedBy, reviewedAt, reviewReason}]
  policyCustodians: {},          // { 'AC': { name, role, email } }
  users: [],                     // [{ id, name, email, role, families[], controls[], note }]
  currentUserId: null,           // null = admin mode; string id = logged-in user

  // NEW FEATURES: Deadlines, Versioning, Workflow, Asset Mapping
  controlDeadlines: {},          // { 'AC-1': 'YYYY-MM-DD' } implementation deadline per control
  controlWorkflowState: {},      // { 'AC-1': 'draft'|'in-progress'|'awaiting-review'|'approved' }
  controlReviewQueue: [],        // [{ controlId, owner, status, submittedAt }] pending reviews
  controlDesignSubmission: null, // { submittedAt, submitterName, designedCount, totalCount, notes } last design submission
  assetMappings: {},             // { 'AC-1': ['asset-1', 'asset-2'] } which assets a control affects
  policyVersions: {},            // { 'AC': [{ version:'1.0', approvedAt:'2026-02-01', approved:true }, ...] }
  policyAcknowledgments: {},     // { 'AC': { 'user-1': '2026-03-15', 'user-2': null } }
  testAdequacy: {},              // { 'AC-1': { frequency:'Monthly', completedTests:3, requiredTests:6, lastTest:'2026-03-15', nextTestDue:'2026-04-15' } }
  // Policy review cycle tracking (NIST annual review requirement)
  policyReviewCycle: {},         // { 'ISP': { lastReviewed, nextReviewDue, approvedBy, approvalDate }, 'AC': {...}, ... }
  infoSecPolicySuggestions: [],  // [{ id, createdAt, suggestedBy, summary, status: Proposed|Approved|Rejected|Promoted }]
  infoSecPolicyReviewDraft: null, // { version, createdAt, updatedAt, content, promotedSuggestionIds } — annual review working draft seeded from approved suggestions

  // Phase 2 — Risks & Issues (replaces legacy poamItems)
  risks: [],                     // risk register — see js/risk.js
  issues: [],                    // POA&M-compatible issues list
  riskTriageDismissals: {},      // { 'h1:asset-3:AC-2': { by, at } }
  controlEvidence: {},           // { 'AC-1': { url, hash, attestationDate, type, description } }
  auditTrail: [],                // [{ t, cat, ref, msg }] activity log for reports / accountability
  changeLog: [],                 // field-level edits: { t, u, p, o, n } — capped FIFO
  _auditTrailUiMode: 'events',   // 'events' | 'fields' — reports audit panel toggle
  _auditTrailEventCatFilter: 'all', // category chip for events tab
  _changeLogUserFilter: '',      // field-change tab filter (substring on user id)
  _changeLogDateFilter: '',      // field-change tab filter (substring on ISO date)
  _undoStack: [],                // scoped structural undo (max 20)
  _reportsProgramReadinessHidden: false, // true = collapse Program Readiness panel in Reports
  _reportsMySummaryHidden: false, // true = collapse "My dashboard" summary card in Reports
  _reportsPhase1BannerHidden: false, // true = collapse Phase 1 completion banner in Reports
  _reportsLibraryView: null,     // null = dashboard; 'policies' | 'controls' = read-only library under Reports
  _reportsLibraryPolicyFam: null, // set when drilling into a published policy from Reports library
  activeFrameworks: {}, // voluntary standards crosswalk lenses (off until user enables)
  activeComplianceLaws: {}, // laws & regulations (HIPAA, GLBA, …) tracked separately
  _regMappingInitialized: false,
  sharePointConfig: { enabled: false, siteUrl: '', libraryName: 'Evidence', defaultFolder: 'GRC/Evidence' },
  entraConfig: { enabled: false, clientId: '', tenantId: 'organizations', redirectUri: '' },
  entraSession: null, // { email, name, oid, matchedUserId, signedInAt } when signed in via Entra
  _frameworkFilter: '',
  _frameworkSearch: '',
  _riskView: 'triage',           // 'triage' | 'risks' | 'issues'
  _riskFilter: 'open',
  _riskSearch: '',
  _issueFilter: 'open',
  _issueSearch: '',
  _sidebarRiskExpanded: false,
  _phase2SidebarFirstLive: false,
  _selectedRiskId: null,
  _selectedIssueId: null,

  // Transient UI flags previously written ad-hoc across modules; declared here so
  // resetStateToDefaults() clears them and STATE_ALLOWED_KEYS stays the single
  // source of truth for the state shape (2026-07 QA follow-up).
  _controlDesignReviewOverrides: {}, // per-control review decision overrides (controls.js)
  _controlSubmitSelection: {},       // checked controls on the design-submit step (controls.js)
  _ctrlStep3Filter: '',              // '' = 'all'; asset-requirements filter (controls.js)
  _currentPersonIds: null,           // ids matching the signed-in identity (admin.js/app.js)
  _domainPolicyReqSyncSigByFam: {},  // last-synced requirement signatures per family (policies.js)
  _issueModalScopeId: '',            // Raise-issue modal prefill (risk.js)
  _issueModalSource: '',             // Raise-issue modal prefill (risk.js)
  _issueModalSourceKey: '',          // Raise-issue modal prefill (risk.js)
  _newUserRolePreset: '',            // role preselected when opening Add User (admin.js)
  _reportsControlLibFamily: '',      // Reports control library family filter (reports.js)
  _reportsControlLibSearch: '',      // Reports control library search (reports.js)
  _reportsMyView: false,             // per-user "my view" toggle on Reports (reports.js)
  _selectedAssetId: null,            // wizard selection (assets.js)
  _selectedCtrl: null,               // wizard selection (controls.js)
  _selectedProcessId: null,          // wizard selection (assets.js)
  _sidebarAssetsExpanded: false,     // sidebar inventory expanders (hub.js/app.js)
  _sidebarControlsExpanded: false,
  _sidebarPoliciesExpanded: false,
  _sidebarReportsExpanded: true,
  _reportsAuditLogHidden: false, // true = collapse Activity & change log panel on Reports
  _suggestedOwner: {},               // per-family suggested owner inputs (program.js)
};
const STATE_DEFAULTS = JSON.parse(JSON.stringify(state));
const STATE_ALLOWED_KEYS = Object.keys(STATE_DEFAULTS);
const STORAGE_KEY = 'eightfiftythree-csf-v1';
// Mirror onto window so Playwright / external scripts can access state directly.
try { window.state = state; window.STATE_DEFAULTS = STATE_DEFAULTS; } catch (e) {}
const SNAPSHOTS_KEY = 'eightfiftythree-csf-snapshots';
// One-time migration from legacy storage keys. Runs at script parse time and
// only copies forward if the new keys are empty. Legacy keys are removed after
// copy so they never reappear on subsequent loads. Two prior brand names are
// covered: the original "hawthorn-*" prefix and the interim "larsen-*" prefix.
(function migrateLegacyStorageKeys() {
  try {
    var LEGACY_PREFIXES = ['larsen-grc', 'hawthorn-grc'];
    for (var i = 0; i < LEGACY_PREFIXES.length; i++) {
      var pfx = LEGACY_PREFIXES[i];
      var LEGACY_STATE = pfx + '-v1';
      var LEGACY_TS = pfx + '-v1-ts';
      var LEGACY_SNAPS = pfx + '-snapshots';
      if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STATE)) {
        localStorage.setItem(STORAGE_KEY, localStorage.getItem(LEGACY_STATE));
        var ts = localStorage.getItem(LEGACY_TS);
        if (ts) localStorage.setItem(STORAGE_KEY + '-ts', ts);
      }
      if (!localStorage.getItem(SNAPSHOTS_KEY) && localStorage.getItem(LEGACY_SNAPS)) {
        localStorage.setItem(SNAPSHOTS_KEY, localStorage.getItem(LEGACY_SNAPS));
      }
      localStorage.removeItem(LEGACY_STATE);
      localStorage.removeItem(LEGACY_TS);
      localStorage.removeItem(LEGACY_SNAPS);
    }
  } catch (e) { /* storage unavailable (private mode) — safe to ignore */ }
})();

function cloneStateValue(v) {
  return JSON.parse(JSON.stringify(v));
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function normalizeStateShape() {
  STATE_ALLOWED_KEYS.forEach(function(k) {
    if (state[k] === undefined || state[k] === null) {
      state[k] = cloneStateValue(STATE_DEFAULTS[k]);
      return;
    }
    if (Array.isArray(STATE_DEFAULTS[k]) && !Array.isArray(state[k])) {
      state[k] = cloneStateValue(STATE_DEFAULTS[k]);
      return;
    }
    if (isPlainObject(STATE_DEFAULTS[k]) && !isPlainObject(state[k])) {
      state[k] = cloneStateValue(STATE_DEFAULTS[k]);
    }
  });
  migrateRegMappingStateShape();
  migrateISPWorkflowStatus();
  migratePoamItemsToIssues();
  ensureGvSubcategoriesAssignedToCiso();
  syncCategoryMergesToPolicyMerges();
}

/** One-time migration: legacy Phase-1 poamItems → Phase-2 issues records. */
function migratePoamItemsToIssues() {
  var legacy = state.poamItems;
  if (!Array.isArray(legacy) || !legacy.length) {
    if (legacy !== undefined) delete state.poamItems;
    return;
  }
  if (!Array.isArray(state.issues)) state.issues = [];
  var actor = typeof getSessionActorName === 'function' ? getSessionActorName('') : '';
  legacy.forEach(function(p) {
    if (!p || typeof p !== 'object') return;
    if (state.issues.some(function(i) { return i && i.id === p.id; })) return;
    var sev = ['Critical', 'High', 'Medium', 'Low'].indexOf(p.severity) !== -1 ? p.severity : 'Medium';
    var st = p.status || 'Open';
    if (st === 'Mitigated') st = 'Remediated';
    state.issues.push({
      id: p.id || ('issue-mig-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
      title: String(p.finding || 'Migrated finding').slice(0, 120),
      description: String(p.finding || ''),
      source: 'manual',
      sourceKey: '',
      controlIds: p.controlId ? [String(p.controlId).trim().toUpperCase()] : [],
      scopeId: '',
      severity: sev,
      remediationPlan: String(p.mitigationPlan || ''),
      milestones: [],
      dueDate: p.dueDate || '',
      assigneeName: String(p.assignee || ''),
      assigneeEmail: '',
      status: st,
      verification: null,
      evidenceRef: String(p.evidenceRef || ''),
      riskId: '',
      createdAt: p.createdDate || new Date().toISOString().slice(0, 10),
      createdBy: actor,
      closedAt: p.closedDate || '',
      closedBy: ''
    });
  });
  delete state.poamItems;
}

function migrateRegMappingStateShape() {
  if (!state.activeComplianceLaws || typeof state.activeComplianceLaws !== 'object') {
    state.activeComplianceLaws = {};
  }
  if (!state.activeFrameworks || typeof state.activeFrameworks !== 'object') {
    state.activeFrameworks = cloneStateValue(STATE_DEFAULTS.activeFrameworks);
  }
  if (state.activeFrameworks.hipaa) {
    if (state.activeComplianceLaws.hipaa !== false) state.activeComplianceLaws.hipaa = true;
    delete state.activeFrameworks.hipaa;
  }
  if (state.activeFrameworks.cis) delete state.activeFrameworks.cis;
  if (state.activeComplianceLaws.mar_e) delete state.activeComplianceLaws.mar_e;
  if (state._regMappingInitialized === undefined) state._regMappingInitialized = false;
  if (!Array.isArray(state.customRegFrameworks)) state.customRegFrameworks = [];
  if (!state.orgOwnership && state.orgSector) {
    var legacySector = state.orgSector;
    if (legacySector === 'federal') {
      state.orgOwnership = 'government';
      state.orgGovLevel = 'federal';
      state.orgSector = 'civilian';
    } else if (legacySector === 'state_local') {
      state.orgOwnership = 'government';
      state.orgGovLevel = 'slg';
      state.orgSector = 'general';
    } else if (['commercial', 'healthcare', 'financial', 'education', 'critical_infra'].indexOf(legacySector) >= 0) {
      state.orgOwnership = 'private';
    }
  }
}

/** Legacy ISP used a display-only "Published" status before formal approver sign-off existed. */
function migrateISPWorkflowStatus() {
  if (!state.policyStatus || typeof state.policyStatus !== 'object') return;
  var s = state.policyStatus.ISP;
  if (!s || typeof s !== 'object') return;
  var st = (s.status || '').trim();
  var hasApproval = !!(s.approvedDate || s.approvedAt || (s.approvedBy || '').trim());
  if (st === 'Published' || (st === 'Approved' && !hasApproval)) {
    s.status = (s.submittedAt || s.submittedTo) ? 'Under Review' : 'Draft';
    delete s.approvedDate;
    delete s.approvedAt;
    delete s.approvedBy;
    state.policyStatus.ISP = s;
  }
}

/** PM (Tier 1 / ISP) controls belong to the CISO — never the external ISP approver. */
function ensureGvSubcategoriesAssignedToCiso() {
  if (!state.gvSubcategories) return;
  var ownerName = (state.programOwner || '').trim();
  var ownerEmail = (state.programOwnerEmail || '').trim();
  var ownerRole = (state.programOwnerTitle || '').trim();
  if (!ownerName && !ownerEmail) return;
  if (!state.controlOwners) state.controlOwners = {};
  Object.keys(state.gvSubcategories).forEach(function(subId) {
    if (!state.gvSubcategories[subId]) return;
    if (!state.controlOwners[subId] || !isValidOwnerEmail((state.controlOwners[subId] || {}).email)) {
      state.controlOwners[subId] = { name: ownerName, email: ownerEmail, role: ownerRole };
    }
  });
}

function syncCategoryMergesToPolicyMerges() {
  if (state.policyStructure === 'category') {
    state.policyMerges = Object.assign({}, state.categoryMerges || {});
  } else {
    state.policyMerges = {};
  }
}

function syncPolicyMergesToCategoryMerges() {
  if (state.policyStructure === 'category') {
    state.categoryMerges = Object.assign({}, state.policyMerges || {});
  }
}

function resetStateToDefaults() {
  STATE_ALLOWED_KEYS.forEach(function(k) {
    state[k] = cloneStateValue(STATE_DEFAULTS[k]);
  });
}

/** Legacy saved states may use string custodian entries; normalize when needed. */
function migrateCustodianFormats() {
  var pc = state.policyCustodians;
  if (!pc || typeof pc !== 'object') return;
  Object.keys(pc).forEach(function(fam) {
    var v = pc[fam];
    if (typeof v === 'string' && v.trim()) {
      pc[fam] = { name: v.trim(), role: '', email: '' };
    }
  });
}

var _SUGGESTED_ROLE_BUCKET_LABELS = null;
function getSuggestedRoleBucketLabelSet() {
  if (!_SUGGESTED_ROLE_BUCKET_LABELS) {
    _SUGGESTED_ROLE_BUCKET_LABELS = {};
    Object.keys(DOMAIN_SUGGESTED_ROLES).forEach(function(fam) {
      var label = DOMAIN_SUGGESTED_ROLES[fam];
      if (label) _SUGGESTED_ROLE_BUCKET_LABELS[label] = true;
    });
  }
  return _SUGGESTED_ROLE_BUCKET_LABELS;
}

function isSuggestedRoleBucketLabel(name) {
  if (!name) return false;
  return !!getSuggestedRoleBucketLabelSet()[String(name).trim()];
}

/** Legacy placeholder owner names (single letters) were never valid ISSM names. */
function migrateLegacySingleLetterOwnerNames() {
  var owners = state.domainOwners;
  if (!owners || typeof owners !== 'object') return;
  Object.keys(owners).forEach(function(fam) {
    var o = owners[fam];
    if (!o || !o.name) return;
    if (o.name.length === 1 && DOMAIN_SUGGESTED_ROLES[fam]) {
      if (!o.role) o.role = DOMAIN_SUGGESTED_ROLES[fam];
      delete o.name;
    }
  });
}

/** Older builds stored suggested role bucket labels (e.g. "GRC/Risk Lead") as owner names. */
function migrateLegacyRoleBucketOwnerNames() {
  var changed = false;
  var owners = state.domainOwners;
  if (owners && typeof owners === 'object') {
    Object.keys(owners).forEach(function(fam) {
      var o = owners[fam];
      if (!o) return;
      var name = (o.name || '').trim();
      if (!name || !isSuggestedRoleBucketLabel(name)) return;
      if (isValidOwnerEmail(o.email)) return;
      if (!o.role) o.role = name;
      delete o.name;
      changed = true;
      if (!o.email && !o.role && !o.name) delete owners[fam];
    });
  }
  var ctrlOwners = state.controlOwners;
  if (ctrlOwners && typeof ctrlOwners === 'object') {
    Object.keys(ctrlOwners).forEach(function(cid) {
      var o = ctrlOwners[cid];
      if (!o) return;
      var name = (o.name || '').trim();
      if (!name || !isSuggestedRoleBucketLabel(name)) return;
      if (isValidOwnerEmail(o.email)) return;
      delete ctrlOwners[cid];
      changed = true;
    });
  }
  if (changed && typeof markDirty === 'function') markDirty();
}

function migrateAtoStateShape() {
  if (!Array.isArray(state.authBoundaries)) state.authBoundaries = [];
  if (!state.assessmentPlans || typeof state.assessmentPlans !== 'object' || Array.isArray(state.assessmentPlans)) {
    state.assessmentPlans = {};
  }
  if (!state.atoDecisions || typeof state.atoDecisions !== 'object' || Array.isArray(state.atoDecisions)) {
    state.atoDecisions = {};
  }
  if (!state._atoLibraryFilter || typeof state._atoLibraryFilter !== 'object' || Array.isArray(state._atoLibraryFilter)) {
    state._atoLibraryFilter = { families: [], assetTypes: [], assetIds: [], statuses: [], search: '' };
  }
  if (!Array.isArray(state._atoLibraryFilter.families)) state._atoLibraryFilter.families = [];
  if (!Array.isArray(state._atoLibraryFilter.assetTypes)) state._atoLibraryFilter.assetTypes = [];
  if (!Array.isArray(state._atoLibraryFilter.assetIds)) state._atoLibraryFilter.assetIds = [];
  if (!Array.isArray(state._atoLibraryFilter.statuses)) state._atoLibraryFilter.statuses = [];
  if (state._atoLibraryFilter.search == null) state._atoLibraryFilter.search = '';

  state.authBoundaries = state.authBoundaries.map(function(b) {
    if (!b || typeof b !== 'object') return null;
    if (!Array.isArray(b.assetTypes)) b.assetTypes = [];
    if (!Array.isArray(b.assetIds)) b.assetIds = [];
    if (!Array.isArray(b.processIds)) b.processIds = [];
    if (!Array.isArray(b.assessorUserIds)) b.assessorUserIds = [];
    if (!Array.isArray(b.conditions)) b.conditions = [];
    if (!b.atoStatus) b.atoStatus = 'not-started';
    if (b.atoGrantedDate == null) b.atoGrantedDate = '';
    if (b.atoExpiresDate == null) b.atoExpiresDate = '';
    return b;
  }).filter(Boolean);
  migrateCustomProgramRoles();
}

function migrateCustomProgramRoles() {
  if (!Array.isArray(state.customProgramRoles)) state.customProgramRoles = [];
  if (!state.roleLabelOverrides || typeof state.roleLabelOverrides !== 'object' || Array.isArray(state.roleLabelOverrides)) state.roleLabelOverrides = {};
  state.customProgramRoles = state.customProgramRoles.filter(function(x) {
    return x && typeof x === 'object' && String(x.slug || '').trim() && String(x.label || '').trim();
  }).map(function(x) {
    var tpl = String(x.tabsTemplate || 'assessor').toLowerCase();
    if (tpl !== 'reports-only') tpl = 'assessor';
    return { slug: String(x.slug).trim(), label: String(x.label).trim(), tabsTemplate: tpl };
  });
}

function seedXmplAtoDemoDataIfMissing() {
  var org = String(state.orgName || '').toLowerCase();
  if (org.indexOf('xmpl') === -1) return;
  if ((state.authBoundaries || []).length) return;
  var firstAsset = (state.assets || [])[0] || null;
  var firstAo = (state.users || []).find(function(u) { return u.role === 'ao' || u.role === 'approver'; });
  var firstAssessor = null;
  if (typeof atoPickDemoAssessorUserId === 'function') firstAssessor = atoPickDemoAssessorUserId(firstAsset);
  if (!firstAssessor) firstAssessor = (state.users || []).find(function(u) { return u.role === 'assessor' || u.role === 'issm'; });
  var boundaryId = 'ato-b-xmpl-demo';
  state.authBoundaries.push({
    id: boundaryId,
    name: 'XMPL Core Collaboration Boundary',
    description: 'Demo boundary for RMF Assess + Authorize walkthrough.',
    assetTypes: firstAsset ? [firstAsset.type] : [],
    assetIds: firstAsset ? [firstAsset.id] : [],
    processIds: [],
    aoUserId: firstAo ? firstAo.id : '',
    assessorUserIds: firstAssessor ? [firstAssessor.id] : [],
    atoStatus: 'in-assessment',
    atoGrantedDate: '',
    atoExpiresDate: '',
    conditions: []
  });
  if (!state.assessmentPlans) state.assessmentPlans = {};
  state.assessmentPlans[boundaryId] = {
    boundaryId: boundaryId,
    scopeMode: 'boundary',
    inScopeControlIds: [],
    controlPlans: {}
  };
}

function applyLoadedState(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return false;
  STATE_ALLOWED_KEYS.forEach(function(k) {
    if (k in saved) state[k] = saved[k];
  });
  normalizeStateShape();
  // Migrate legacy custodian string formats to object format
  migrateCustodianFormats();
  migrateLegacySingleLetterOwnerNames();
  migrateLegacyRoleBucketOwnerNames();
  migrateAtoStateShape();
  seedXmplAtoDemoDataIfMissing();
  if (state.cisoComplete && state.baseline && typeof seedAllControlScopeDefaults === 'function') {
    seedAllControlScopeDefaults();
  }
  return true;
}

/** Append one row to the activity trail (used by merges, approvals, imports, etc.). */
function addAuditEntry(category, refId, message) {
  if (!state.auditTrail) state.auditTrail = [];
  state.auditTrail.push({
    t: new Date().toISOString(),
    cat: category || 'program',
    ref: refId != null ? refId : '',
    msg: (message || '').toString()
  });
  if (state.auditTrail.length > 800) state.auditTrail = state.auditTrail.slice(-800);
}

// ── Field-level change log (NotebookLM Task 2) ─────────────────────────────
function valuesEqualForChangeLog(a, b) {
  if (a === b) return true;
  try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
}

function logFieldChange(path, oldVal, newVal) {
  if (valuesEqualForChangeLog(oldVal, newVal)) return;
  if (!state.changeLog) state.changeLog = [];
  var uid = state.currentUserId || (state.entraSession && state.entraSession.email) || 'admin';
  state.changeLog.push({
    t: new Date().toISOString(),
    u: uid,
    p: String(path || ''),
    o: oldVal,
    n: newVal
  });
  if (state.changeLog.length > 2000) state.changeLog = state.changeLog.slice(-2000);
  markDirty();
}

function normalizeOwnerEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidOwnerEmail(email) {
  var em = normalizeOwnerEmail(email);
  return em.length > 3 && em.indexOf('@') > 0 && em.indexOf('@') < em.length - 1;
}

function getOwnerDisplayName(owner) {
  if (!owner) return '—';
  var name = (owner.name || '').trim();
  if (name && !isSuggestedRoleBucketLabel(name)) return name;
  var email = (owner.email || '').trim();
  if (email) return email;
  return '—';
}

/** Domain owner for a family — explicit roster row, else program owner when they wear all domain hats. */
function resolveEffectiveDomainOwner(fam) {
  var owner = (state.domainOwners || {})[fam] || {};
  var name = (owner.name || '').trim();
  var email = (owner.email || '').trim();
  if (name || isValidOwnerEmail(email)) {
    return { name: name, email: email, role: (owner.role || '').trim() };
  }
  if (state.cisoIsISSM) {
    return {
      name: (state.programOwner || '').trim(),
      email: (state.programOwnerEmail || '').trim(),
      role: (state.programOwnerTitle || '').trim()
    };
  }
  var ps = (state.policyStatus || {})[fam] || {};
  return {
    name: (ps.submittedTo || '').trim(),
    email: (ps.submittedToEmail || '').trim(),
    role: (ps.submittedToRole || '').trim()
  };
}

/** Policy domain owner for tables — name, else email, else em dash. */
function getDomainOwnerLabel(fam) {
  return getOwnerDisplayName(resolveEffectiveDomainOwner(fam));
}

function getDomainOwnerLabelOr(fam, fallback) {
  var label = getDomainOwnerLabel(fam);
  return label === '—' ? (fallback || '—') : label;
}

/** True when a returned policy has no rostered owner email (needs assignment before revision). */
function returnedDomainPolicyNeedsOwnerAssignment(fam) {
  var ps = (state.policyStatus || {})[fam] || {};
  if (ps.status !== 'Returned') return false;
  return !isValidOwnerEmail(((state.domainOwners || {})[fam] || {}).email);
}

function hasRealControlOwner(co) {
  if (!co) return false;
  var name = (co.name || '').trim();
  if (name && !isSuggestedRoleBucketLabel(name)) return true;
  return isValidOwnerEmail(co.email);
}

/** True when a control owner can be invited to sign up (name + valid work email). */
function isControlOwnerInviteReady(co) {
  if (!co || co.isDemoPlaceholder) return false;
  if (!(co.name || '').trim()) return false;
  return isValidOwnerEmail(co.email);
}

/** True when this email already belongs to someone on the program roster (not a new invite). */
function isKnownProgramUserEmail(email) {
  var key = normalizeOwnerEmail(email);
  if (!key) return false;
  if (normalizeOwnerEmail(state.programOwnerEmail) === key) return true;
  if ((state.users || []).some(function(u) {
    return !u.isDemoPlaceholder && normalizeOwnerEmail(u.email) === key;
  })) return true;
  var owners = state.domainOwners || {};
  return Object.keys(owners).some(function(fam) {
    var o = owners[fam];
    return o && normalizeOwnerEmail(o.email) === key;
  });
}

/** Status line for domain policy step 4 control-owner rows. */
function getControlOwnerAssignStatus(co) {
  if (!isControlOwnerInviteReady(co)) {
    var ownerName = getOwnerDisplayName(co || {});
    if (ownerName !== '—' && !isValidOwnerEmail((co || {}).email)) {
      return { text: '⚠ Work email required for sign-up', color: '#b45309' };
    }
    return { text: 'Name and email required', color: 'var(--text-muted)' };
  }
  if (isKnownProgramUserEmail(co.email)) {
    return { text: '✓ Assigned — on program roster', color: 'var(--teal)' };
  }
  return { text: '✓ Ready — new user can sign up with this email', color: 'var(--teal)' };
}

/** NIST XX-1 policy-and-procedures controls — covered by the Tier 1 ISP, not domain policy pickers. */
function isPolicyAndProceduresControl(ctrlId) {
  return /^[A-Z]{2}-1$/.test(String(ctrlId || '').trim());
}

function getControlOwnerDisplayName(co) {
  var label = getOwnerDisplayName(co);
  return label === '—' ? 'Unassigned' : label;
}

function userNeedsProfileSetup(user) {
  if (!user || user.isDemoPlaceholder) return false;
  if (user.profileComplete === true) return false;
  if (user.profileComplete === false) return true;
  var email = normalizeOwnerEmail(user.email);
  if (!email) return false;
  var name = (user.name || '').trim();
  if (!name) return true;
  if (name.toLowerCase() === email.split('@')[0]) return true;
  return name === 'Pending user';
}

function getMasterPolicyFamilies() {
  return getMasterPolicyUnits();
}

function getMasterPolicyUnits() {
  var units = typeof getActivePolicyUnits === 'function' ? getActivePolicyUnits() : getActiveCategories();
  var merges = state.policyMerges || {};
  return units.filter(function(u) { return !merges[u]; });
}

function getActivePolicyUnits() {
  if (state.policyStructure === 'function') {
    return typeof getActiveFunctions === 'function' ? getActiveFunctions() : [];
  }
  return typeof getActiveCategories === 'function' ? getActiveCategories() : [];
}

function getPolicyUnitLabel(unit) {
  if (state.policyStructure === 'function') {
    return (FUNCTIONS && FUNCTIONS[unit]) || unit;
  }
  var cat = typeof getCategoryById === 'function' ? getCategoryById(unit) : null;
  return cat ? cat.id + ' — ' + cat.name : unit;
}

function getSuggestedRoleForPolicyUnit(unit) {
  if (state.policyStructure === 'function') {
    return (FUNCTION_SUGGESTED_ROLES && FUNCTION_SUGGESTED_ROLES[unit]) || 'Policy Owner';
  }
  return (CATEGORY_SUGGESTED_ROLES && CATEGORY_SUGGESTED_ROLES[unit]) || 'Policy Owner';
}

function countAssignedPolicyDomains() {
  return getMasterPolicyFamilies().filter(function(fam) {
    return isValidOwnerEmail((state.domainOwners[fam] || {}).email);
  }).length;
}

function countUniquePolicyOwnerEmails() {
  var seen = {};
  getMasterPolicyFamilies().forEach(function(fam) {
    var em = normalizeOwnerEmail((state.domainOwners[fam] || {}).email);
    if (isValidOwnerEmail(em)) seen[em] = true;
  });
  return Object.keys(seen).length;
}

function getDemoPlaceholderNames() {
  var names = [];
  var seen = {};
  function add(n) {
    n = (n || '').trim();
    if (!n || seen[n]) return;
    seen[n] = true;
    names.push(n);
  }
  Object.keys(state.domainOwners || {}).forEach(function(fam) {
    var o = state.domainOwners[fam];
    if (o && o.isDemoPlaceholder) add(o.name);
  });
  Object.keys(state.controlOwners || {}).forEach(function(cid) {
    var o = state.controlOwners[cid];
    if (o && o.isDemoPlaceholder) add(o.name);
  });
  // Demo placeholder users (tagged when the prefill helpers seed state.users).
  (state.users || []).forEach(function(u) {
    if (u && u.isDemoPlaceholder) add(u.name);
  });
  return names;
}

function hasDemoPlaceholderOwners() {
  return getDemoPlaceholderNames().length > 0;
}

function blockActionIfDemoPlaceholders() {
  var names = getDemoPlaceholderNames();
  if (!names.length) return false;
  showToast('Demo placeholder owners detected. Replace ' + names.join(', ') + ' with real people before submitting.', true);
  return true;
}

function clearScopedUndoStack(reason) {
  state._undoStack = [];
}

var __undoToastTimer = null;
function pushScopedUndo(entry) {
  if (!state._undoStack) state._undoStack = [];
  state._undoStack.push(entry);
  if (state._undoStack.length > 20) state._undoStack = state._undoStack.slice(-20);
  showUndoActionToast(entry.label || 'Action recorded');
}

function showUndoActionToast(msg) {
  var existing = document.getElementById('__undo_toast__');
  if (existing) existing.remove();
  if (__undoToastTimer) clearTimeout(__undoToastTimer);
  var t = document.createElement('div');
  t.id = '__undo_toast__';
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:10040;background:#1e293b;color:white;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.25);display:flex;align-items:center;gap:12px;max-width:360px;';
  t.innerHTML = '<span>' + escapeHTML(msg) + '</span><button type="button" id="__undo_btn" style="background:#334155;color:white;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer;">Undo</button>';
  document.body.appendChild(t);
  document.getElementById('__undo_btn').onclick = function() {
    var last = state._undoStack && state._undoStack.pop();
    if (last && typeof last.undo === 'function') {
      try { last.undo(); } catch (e) { console.warn('undo failed', e); }
      markDirty();
      showToast('Last action undone');
      try { renderActiveCisoSetupStep(); } catch (e1) {}
      try { renderPolicyStep3(); } catch (e2) {}
      try { renderCISOStep3(); } catch (e3) {}
      try { renderControlStep1(); } catch (e4) {}
      try { renderControlStep2(); } catch (e5) {}
      try { renderPolicyStep2(); } catch (e6) {}
    }
    t.remove();
  };
  __undoToastTimer = setTimeout(function() {
    var el = document.getElementById('__undo_toast__');
    if (el) el.remove();
  }, 10000);
}

/* Recursion guard for imported JSON: legitimate program exports never nest more
   than a few levels, so anything deeper is malformed or adversarial. */
function exceedsMaxDepth(v, maxDepth) {
  if (maxDepth < 0) return true;
  if (v === null || typeof v !== 'object') return false;
  var keys = Array.isArray(v) ? v : Object.keys(v).map(function(k) { return v[k]; });
  for (var i = 0; i < keys.length; i++) {
    if (exceedsMaxDepth(keys[i], maxDepth - 1)) return true;
  }
  return false;
}

function validateProgramShape(parsed) {
  var errors = [];
  var warnings = [];
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, errors: ['Root must be a plain object'], warnings: [] };
  }
  if (exceedsMaxDepth(parsed, 24)) {
    return { ok: false, errors: ['Program data is nested too deeply — file appears malformed'], warnings: [] };
  }
  Object.keys(parsed).forEach(function(k) {
    if (STATE_ALLOWED_KEYS.indexOf(k) === -1) {
      warnings.push('Unknown top-level key: ' + k);
      try { console.warn('[import]', warnings[warnings.length - 1]); } catch (e) {}
    }
  });
  function valType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (isPlainObject(v)) return 'object';
    return typeof v;
  }
  STATE_ALLOWED_KEYS.forEach(function(k) {
    if (!(k in parsed)) return;
    var exp = valType(STATE_DEFAULTS[k]);
    var got = valType(parsed[k]);
    if (exp !== got) {
      errors.push('Field "' + k + '" must be ' + exp + ', got ' + got);
    }
  });
  if ('baseline' in parsed && parsed.baseline != null && ['L', 'M', 'H'].indexOf(parsed.baseline) === -1) {
    errors.push('baseline must be null, "L", "M", or "H"');
  }
  if (errors.length > 5) errors = errors.slice(0, 5);
  return { ok: errors.length === 0, errors: errors, warnings: warnings };
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const _esc = escapeHTML;

function buildPersistedPayload() {
  var payload = {};
  STATE_ALLOWED_KEYS.forEach(function(k) {
    payload[k] = state[k];
  });
  return payload;
}

function stripLegacyEvidenceImages() {
  if (typeof normalizeControlDesignState !== 'function') return;
  Object.keys(state.controlStatus || {}).forEach(function(ctrlId) {
    normalizeControlDesignState(ctrlId);
  });
}

function saveToStorage() {
  try {
    stripLegacyEvidenceImages();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedPayload()));
    localStorage.setItem(STORAGE_KEY + '-ts', new Date().toISOString());
    _updateSaveIndicator(true);
    window.isDirty = false;
    // In multi-user (cloud) mode, also push the program to the shared backend.
    if (typeof cloudPushDebounced === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
      cloudPushDebounced();
    }
  } catch (e) {
    console.warn('saveToStorage', e);
    var cloud = typeof isCloudSessionActive === 'function' && isCloudSessionActive();
    showToast(cloud
      ? 'Could not sync your program. Check your connection and try again.'
      : 'Could not save to browser storage (quota or private mode).', true);
  }
}

function loadFromStorage() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var saved = JSON.parse(raw);
    return applyLoadedState(saved);
  } catch (e) {
    console.warn('loadFromStorage', e);
    return false;
  }
}

function exportProgramJson() {
  function doExport() {
    try {
      var blob = new Blob([JSON.stringify(buildPersistedPayload(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      var base = ((state.orgName || '') + '').replace(/[^\w\-.]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'grc-program';
      a.href = URL.createObjectURL(blob);
      a.download = base + '-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      showToast('JSON export downloaded — keep it as a backup outside the browser.');
    } catch (e) {
      showToast('Export failed.', true);
    }
  }
  if (!hasDemoPlaceholderOwners()) {
    doExport();
    return;
  }
  var overlay = document.createElement('div');
  overlay.id = 'exportDemoWarnOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = '<div style="background:white;border-radius:14px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:8px;">Demo placeholder owners</div>'
    + '<p style="font-size:13px;color:var(--text-muted);line-height:1.55;margin:0 0 16px 0;">This program contains demo placeholder owners. Export anyway for testing, or cancel to replace them first.</p>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" type="button" id="exportDemoCancel">Cancel</button>'
    + '<button class="btn btn-primary" type="button" id="exportDemoAnyway">Export anyway</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  document.getElementById('exportDemoCancel').onclick = function() { overlay.remove(); };
  document.getElementById('exportDemoAnyway').onclick = function() { overlay.remove(); doExport(); };
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

function importProgramFromFile(ev) {
  var input = ev && ev.target;
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function() {
    try {
      var saved = JSON.parse(reader.result);
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('invalid');
      var vr = validateProgramShape(saved);
      if (!vr.ok) {
        var msg = (vr.errors || []).slice(0, 5).map(function(e) { return escapeHTML(e); }).join('<br>');
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;';
        overlay.innerHTML = '<div style="background:white;border-radius:14px;max-width:520px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
          + '<div style="font-size:17px;font-weight:800;color:#b91c1c;margin-bottom:10px;">Import validation failed</div>'
          + '<div style="font-size:13px;color:#334155;line-height:1.5;margin-bottom:16px;">' + (msg || 'Unknown validation error') + '</div>'
          + '<button class="btn btn-primary" type="button" id="importErrClose">OK</button></div>';
        document.body.appendChild(overlay);
        document.getElementById('importErrClose').onclick = function() { overlay.remove(); };
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
        if (input) input.value = '';
        return;
      }
      var backupName = 'Pre-import backup ' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveCurrentSnapshot(backupName, true);
      showToast('Current program saved as auto-backup snapshot before import.');
      if (!applyLoadedState(saved)) throw new Error('apply');
      Object.keys(currentStep).forEach(function(k) { currentStep[k] = 1; });
      if (typeof isCloudSessionActive === 'function' && isCloudSessionActive()
          && typeof mapCloudIdentityToRoleView === 'function') {
        mapCloudIdentityToRoleView();
      }
      showTab('ciso');
      goToStep('ciso', 1);
      saveToStorage();
      showToast('Program imported from file.');
    } catch (err) {
      console.warn('importProgramFromFile', err);
      showToast('Could not import that file. Choose a valid program JSON export.', true);
    }
    if (input) input.value = '';
  };
  reader.onerror = function() {
    showToast('Could not read the file.', true);
    if (input) input.value = '';
  };
  reader.readAsText(file);
}

window.saveToStorage = saveToStorage;
window.loadFromStorage = loadFromStorage;
window.exportProgramJson = exportProgramJson;
window.importProgramFromFile = importProgramFromFile;

// ============================================================
// STATE PERSISTENCE HELPERS
// ============================================================
// markDirty() is called from 70+ places in the codebase whenever state mutates
// (oninput handlers, delete actions, wizard advancement, approval actions). It
// flags the state as dirty and schedules a debounced save to localStorage.
// Missing this function caused bare `markDirty()` calls to throw ReferenceError
// and silently abort their caller — for example, the ISP approve/return buttons.
var _saveDebounceTimer = null;
function markDirty() {
  window.isDirty = true;
  try { _updateSaveIndicator(false); } catch (e) { /* indicator DOM may not exist yet */ }
  if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(function() {
    _saveDebounceTimer = null;
    try { if (typeof saveToStorage === 'function') saveToStorage(); } catch (e) { console.warn('saveToStorage failed:', e); }
  }, 400);
}
window.markDirty = markDirty;

// _updateSaveIndicator(saved) toggles the small "Saved / Saving…" pill in the
// top-right. It's defensive — if the element isn't in the DOM (e.g. during
// early initialization or in printable views) it no-ops.
function _updateSaveIndicator(saved) {
  var el = document.getElementById('saveIndicator');
  if (!el) return;
  var cloud = typeof isCloudSessionActive === 'function' && isCloudSessionActive();
  if (saved) {
    el.textContent = cloud ? '✓ Synced' : '✓ Saved';
    el.style.color = 'var(--teal)';
  } else {
    el.textContent = cloud ? '… Syncing' : '… Saving';
    el.style.color = 'var(--text-muted)';
  }
}

function getActiveControls() {
  return getActiveSubcategories().map(function(s) {
    return { id: s.id, f: s.fn, cat: s.cat, n: s.n };
  });
}

function isCategoryInScope(catId) {
  if (!state.selectedCategories) return true;
  return !!state.selectedCategories[catId];
}

function getActiveCategories() {
  if (!CATEGORIES) return [];
  return CATEGORIES.filter(function(c) { return isCategoryInScope(c.id); }).map(function(c) { return c.id; });
}

function getActiveSubcategories() {
  if (!SUBCATEGORIES) return [];
  return SUBCATEGORIES.filter(function(s) { return isCategoryInScope(s.cat); });
}

function getActiveFunctions() {
  var fns = {};
  getActiveSubcategories().forEach(function(s) { fns[s.fn] = true; });
  return Object.keys(fns).sort();
}

function getActiveFamilies() {
  return getActiveFunctions();
}

function getPrivacyOnlyCatalogControlCount() {
  return 0;
}

function getProgramScopeReady() {
  return !!(state.selectedCategories && Object.keys(state.selectedCategories).some(function(k) { return state.selectedCategories[k]; }));
}

function resolveCatalogSubcategoryId(input) {
  if (input == null || typeof input !== 'string') return null;
  var t = input.trim();
  if (!t) return null;
  for (var i = 0; i < SUBCATEGORIES.length; i++) {
    var id = SUBCATEGORIES[i].id;
    if (id === t || id.toUpperCase() === t.toUpperCase()) return id;
  }
  return null;
}

function resolveCatalogControlId(input) {
  return resolveCatalogSubcategoryId(input);
}

function getSubcategoriesForPolicyUnit(unit) {
  if (state.policyStructure === 'function') {
    return getActiveSubcategories().filter(function(s) { return s.fn === unit; });
  }
  var allUnits = typeof getPolicyAllUnits === 'function' ? getPolicyAllUnits(unit) : [unit];
  return getActiveSubcategories().filter(function(s) { return allUnits.indexOf(s.cat) !== -1; });
}

function getPolicyAllUnits(unit) {
  var merges = state.policyMerges || {};
  var slaves = Object.keys(merges).filter(function(k) { return merges[k] === unit; });
  return [unit].concat(slaves);
}

function getPolicyAllFamilies(fam) {
  return getPolicyAllUnits(fam);
}

function getSavedSnapshots() {
  try {
    var raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function pruneAutoRestoreSnapshots() {
  var snaps = getSavedSnapshots();
  var auto = [];
  var rest = [];
  snaps.forEach(function(s) {
    if (s && s.name && String(s.name).indexOf('Auto-backup before restore') === 0) auto.push(s);
    else rest.push(s);
  });
  auto.sort(function(a, b) { return String(b.saved).localeCompare(String(a.saved)); });
  var keep = auto.slice(0, 5);
  var merged = keep.concat(rest);
  if (merged.length !== snaps.length) {
    try { localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(merged)); } catch (e) {}
  }
}

// Demo snapshots: js/csf-snapshots.js
