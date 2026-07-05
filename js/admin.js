// js/admin.js — users & roles, role picker, profile sync. Split from app.js (Step 8).
// Globals only; load after reports.js (snapshots in app.js call applyRoleView from here).

// ============================================================
// USERS & ROLES
// ============================================================

const ROLE_META = {
  'ciso':          { label:'Program Owner',          icon:'🏛️', color:'#6366f1', desc:'Owns the Tier 1 Information Security Policy. High-level program oversight across all domains.' },
  'issm':          { label:'ISSM / Domain Policy Owner',    icon:'🛡️', color:'#0ea5e9', desc:'Drafts and maintains Tier 2 domain-level policies for assigned control families. Oversees ISSOs.' },
  'control-owner': { label:'Control Owner',                 icon:'🔧', color:'#f59e0b', desc:'Implements and attests assigned controls. Writes Tier 3 procedures and produces evidence.' },
  'asset-owner':   { label:'Asset Owner',                   icon:'🖥️', color:'#10b981', desc:'Completes and signs off System Security Plans (SSPs) for assigned assets.' },
  'assessor':      { label:'Security Assessor',             icon:'🧪', color:'#0f766e', desc:'Builds assessment scope, procedures, and results for authorization boundaries.' },
  'ao':            { label:'Authorizing Official (AO)',     icon:'🖋️', color:'#7c3aed', desc:'Makes final authorization decisions (ATO/IATT/Denial) based on assessment results and residual risk.' },
  'custodian':     { label:'Policy Custodian',              icon:'📂', color:'#8b5cf6', desc:'Read-only view of assigned policies. Reviews and downloads policy documents.' },
  'approver':      { label:'Policy Approver (ISP)',         icon:'✅', color:'#059669', desc:'Signs off the Tier 1 Information Security Policy when routed for review. Uses Command Center and Reports only — no control or asset workspaces.' },
};

function getProgramRoleMeta(role) {
  if (!role) return { label: '', icon: '👤', color: '#64748b', desc: '' };
  if (ROLE_META[role]) return ROLE_META[role];
  var c = (state.customProgramRoles || []).find(function(x) { return x && x.slug === role; });
  if (c) return { label: c.label, icon: '✦', color: '#0d9488', desc: 'Custom program role' };
  return { label: role, icon: '👤', color: '#64748b', desc: '' };
}

function buildProgramRoleSelectOptions(selectedValue) {
  var html = '<option value="">— select role —</option>';
  Object.keys(ROLE_META).forEach(function(r) {
    html += '<option value="' + _esc(r) + '"' + (selectedValue === r ? ' selected' : '') + '>' + _esc(ROLE_META[r].icon + ' ' + ROLE_META[r].label) + '</option>';
  });
  (state.customProgramRoles || []).forEach(function(c) {
    if (!c || !c.slug) return;
    html += '<option value="' + _esc(c.slug) + '"' + (selectedValue === c.slug ? ' selected' : '') + '>✦ ' + _esc(c.label) + '</option>';
  });
  return html;
}

function isKnownProgramRole(role) {
  if (!role) return false;
  if (ROLE_META[role]) return true;
  return (state.customProgramRoles || []).some(function(x) { return x && x.slug === role; });
}

function addCustomProgramRole() {
  if (isUsersReadOnlyForCurrentUser()) { showToast('Read-only: AO cannot modify users.', true); return; }
  var label = String((document.getElementById('customRoleLabel') || {}).value || '').trim();
  var slugIn = String((document.getElementById('customRoleSlug') || {}).value || '').trim().toLowerCase();
  var tpl = String((document.getElementById('customRoleTabs') || {}).value || 'assessor');
  if (!label) { showToast('Display label is required.', true); return; }
  var slug = slugIn || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  if (!slug || slug.length < 2) { showToast('Enter a role id (letters, numbers, hyphens), e.g. independent-sca.', true); return; }
  if (ROLE_META[slug]) { showToast('That id is reserved for a built-in role.', true); return; }
  if ((state.customProgramRoles || []).some(function(x) { return x.slug === slug; })) { showToast('That role id already exists.', true); return; }
  if (!state.customProgramRoles) state.customProgramRoles = [];
  state.customProgramRoles.push({ slug: slug, label: label, tabsTemplate: tpl === 'reports-only' ? 'reports-only' : 'assessor' });
  markDirty();
  showToast('Custom role added.');
  renderUsersTab();
}

function removeCustomProgramRole(slug) {
  if (isUsersReadOnlyForCurrentUser()) { showToast('Read-only: AO cannot modify users.', true); return; }
  var usersWith = (state.users || []).filter(function(u) { return u.role === slug; });
  if (usersWith.length) { showToast('Reassign ' + usersWith.length + ' user(s) before deleting this role.', true); return; }
  if (!confirm('Delete custom role "' + slug + '"?')) return;
  state.customProgramRoles = (state.customProgramRoles || []).filter(function(x) { return x.slug !== slug; });
  markDirty();
  renderUsersTab();
}

// Role-specific default workspaces
const ROLE_DEFAULT_TAB = {
  'ciso':          'home',
  'issm':          'home',
  'control-owner': 'control',
  'asset-owner':   'asset',
  'assessor':      'home',
  'ao':            'home',
  'custodian':     'policy',
  'approver':      'reports',
};

function getPersonRecordsForUser(user) {
  if (!user) return [];
  var emailKey = normalizeOwnerEmail(user.email);
  var nameKey = (user.name || '').trim().toLowerCase();
  return (state.users || []).filter(function(u) {
    if (u.id === user.id) return true;
    if (emailKey && normalizeOwnerEmail(u.email) === emailKey) return true;
    if (nameKey && u.name && u.name.trim().toLowerCase() === nameKey) return true;
    return false;
  });
}

function getPersonIdentityKey(user) {
  var emailKey = normalizeOwnerEmail(user.email);
  if (emailKey) return 'email:' + emailKey;
  var nameKey = (user.name || '').trim().toLowerCase();
  return nameKey ? 'name:' + nameKey : 'id:' + user.id;
}

function renderProfileButtonContent(user) {
  if (typeof isCloudLocked === 'function' && isCloudLocked()) {
    var display = typeof getCloudSessionDisplayName === 'function'
      ? getCloudSessionDisplayName()
      : ((typeof getCloudSessionName === 'function' ? getCloudSessionName() : '') || (typeof getCloudSessionEmail === 'function' ? getCloudSessionEmail() : '') || 'Signed in');
    var roleHint = 'Signed in · Sign out';
    if (!user && typeof isCloudOwnerSession === 'function' && isCloudOwnerSession()) {
      var ownerName = typeof resolveProgramOwnerActorName === 'function' ? resolveProgramOwnerActorName() : '';
      if (ownerName) display = ownerName;
      roleHint = 'Program owner · Sign out';
    } else if (user) {
      var rm = getProgramRoleMeta(user.role);
      if (rm && rm.label) roleHint = rm.label + ' · Sign out';
    }
    return ''
      + '<span class="profile-btn-line"><span>👤</span><span>' + _esc(display) + '</span></span>'
      + '<span class="profile-btn-sub">' + _esc(roleHint) + '</span>';
  }
  return ''
    + '<span class="profile-btn-line"><span>👤</span><span>Sign in</span></span>'
    + '<span class="profile-btn-sub">Account</span>';
}

function openProfileMenu() {
  if (typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
    if (typeof showCloudAccountMenu === 'function') showCloudAccountMenu();
    return;
  }
  if (typeof showCloudSignInGate === 'function') showCloudSignInGate();
}

// Legacy name kept for any stale onclick references.
function showRolePicker() {
  openProfileMenu();
}

function applyRoleView(userId) {
  state.currentUserId = userId === 'admin' ? null : userId;
  const user = state.currentUserId ? state.users.find(function(u){ return u.id === state.currentUserId; }) : null;

  // Clear transient UI state to prevent stale selections from a different persona
  state._selectedCtrl      = null;
  state._policyDomain      = null;
  state._policyOwnerFilter = '';
  state._selectedAssetId   = null;
  state._selectedProcessId = null;

  // Update profile button label
  const btn = document.getElementById('profileBtn');
  if (btn) {
    btn.innerHTML = renderProfileButtonContent(user);
    btn.title = 'Your account';
    btn.setAttribute('aria-label', 'Your account');
  }

  // Admin: show all tabs and clear any impersonation context
  if (!user) {
    state._currentPersonIds = null;
    if (typeof hideProfileSetupModal === 'function') hideProfileSetupModal();
    TAB_IDS.forEach(function(id) {
      const nav = document.getElementById('nav-' + id);
      if (nav) nav.style.display = '';
    });
    const adminSection = document.getElementById('sidebar-program-section');
    if (adminSection) adminSection.style.display = '';
    if (typeof applySetupFocusMode === 'function') applySetupFocusMode();
    if (typeof renderSidebarBadges === 'function') renderSidebarBadges();
    if (typeof syncReportsLibrarySidebar === 'function') syncReportsLibrarySidebar(null);
    return;
  }

  // Non-admin: hide Users & Roles nav and admin sidebar section
  const adminSection = document.getElementById('sidebar-program-section');
  if (adminSection) adminSection.style.display = '';

  // ── Merge tabs from ALL roles this person holds ──
  var allRecords = getPersonRecordsForUser(user);
  // Store sibling IDs so other code can check all roles for this person
  state._currentPersonIds = allRecords.map(function(u){ return u.id; });

  var allRoles = [];
  allRecords.forEach(function(rec) {
    var recRoles = (rec.roles && rec.roles.length) ? rec.roles : [rec.role];
    recRoles.forEach(function(r) {
      if (allRoles.indexOf(r) === -1) allRoles.push(r);
    });
  });

  var visible = getPersonVisibleTabIds(user);

  TAB_IDS.forEach(function(id) {
    const nav = document.getElementById('nav-' + id);
    if (nav) nav.style.display = visible.indexOf(id) !== -1 ? '' : 'none';
  });
  if (adminSection) {
    var programTabIds = ['ciso', 'reports', 'frameworks', 'risk', 'users'];
    var showProgramSection = programTabIds.some(function(id) { return visible.indexOf(id) !== -1; });
    adminSection.style.display = showProgramSection ? '' : 'none';
  }
  if (typeof syncReportsLibrarySidebar === 'function') syncReportsLibrarySidebar(user);

  // Navigate to the highest-priority role's default tab (approver last — defaults to Reports)
  var rolePriority = ['ciso','ao','assessor','issm','control-owner','asset-owner','custodian','approver'];
  var primaryRole = user.role;
  for (var rp = 0; rp < rolePriority.length; rp++) {
    if (allRoles.indexOf(rolePriority[rp]) !== -1) { primaryRole = rolePriority[rp]; break; }
  }
  var defaultTab = ROLE_DEFAULT_TAB[primaryRole];
  if (!defaultTab) defaultTab = visible[0] || 'reports';
  if (state.cisoComplete && visible.indexOf('home') !== -1) {
    defaultTab = 'home';
  }
  if (typeof canSessionApproveISP === 'function' && canSessionApproveISP() && visible.indexOf('reports') !== -1) {
    defaultTab = 'reports';
  }
  if (visible.indexOf(defaultTab) === -1) {
    defaultTab = visible.indexOf('reports') !== -1 ? 'reports' : (visible[0] || 'reports');
  }
  showTab(defaultTab);

  // For policy-based roles: pre-select first assigned family from any ISSM/custodian record
  var policyFams = [];
  allRecords.forEach(function(rec) {
    if ((rec.role === 'issm' || rec.role === 'custodian') && rec.families) {
      rec.families.forEach(function(f){ if (policyFams.indexOf(f) === -1) policyFams.push(f); });
    }
  });
  if (policyFams.length) {
    state._policyDomain = policyFams[0];
    state._policyOwnerFilter = '';
  }

  // For control owners: pre-select first assigned control from any control-owner record
  var ctrlIds = [];
  allRecords.forEach(function(rec) {
    if (rec.role === 'control-owner' && rec.controls) {
      rec.controls.forEach(function(c){ if (ctrlIds.indexOf(c) === -1) ctrlIds.push(c); });
    }
  });
  if (ctrlIds.length) {
    state._selectedCtrl = ctrlIds[0];
    goToStep('control', 1);
  }
}

function showProfileSetupModal(user) {
  var overlay = document.getElementById('profileSetupOverlay');
  if (!overlay || !user) return;
  var emailEl = document.getElementById('profileSetupEmail');
  var nameEl = document.getElementById('profileSetupName');
  var titleEl = document.getElementById('profileSetupTitleInput');
  if (emailEl) emailEl.textContent = user.email || '—';
  if (nameEl) {
    nameEl.value = (user.name && user.name !== 'Pending user') ? user.name : '';
    nameEl.focus();
  }
  if (titleEl) titleEl.value = user.note || '';
  overlay.dataset.userId = user.id;
  overlay.style.display = 'flex';
}

function hideProfileSetupModal() {
  var overlay = document.getElementById('profileSetupOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    delete overlay.dataset.userId;
  }
}

function saveProfileSetup() {
  var overlay = document.getElementById('profileSetupOverlay');
  var userId = overlay && overlay.dataset.userId;
  if (!userId) return;
  var user = (state.users || []).find(function(u) { return u.id === userId; });
  if (!user) return;
  var nameEl = document.getElementById('profileSetupName');
  var titleEl = document.getElementById('profileSetupTitleInput');
  var name = nameEl ? nameEl.value.trim() : '';
  var title = titleEl ? titleEl.value.trim() : '';
  if (!name) {
    showToast('Enter your full name to continue.', true);
    if (nameEl) nameEl.focus();
    return;
  }
  if (!title) {
    showToast('Enter your title or role to continue.', true);
    if (titleEl) titleEl.focus();
    return;
  }
  completeUserProfile(user, name, title);
}

function completeUserProfile(user, name, title) {
  var emailKey = normalizeOwnerEmail(user.email);
  var records = getPersonRecordsForUser(user);
  records.forEach(function(u) {
    u.name = name;
    u.note = title;
    u.profileComplete = true;
  });

  if (emailKey) {
    Object.keys(state.domainOwners || {}).forEach(function(fam) {
      var o = state.domainOwners[fam];
      if (o && normalizeOwnerEmail(o.email) === emailKey) {
        o.name = name;
        if (title) o.role = title;
      }
    });
    Object.keys(state.controlOwners || {}).forEach(function(cid) {
      var o = state.controlOwners[cid];
      if (o && normalizeOwnerEmail(o.email) === emailKey) {
        o.name = name;
        if (title) o.role = title;
      }
    });
  }

  if (user.role === 'ciso' || (user.roles && user.roles.indexOf('ciso') !== -1)) {
    state.programOwner = name;
    state.programOwnerTitle = title;
    if (user.email) state.programOwnerEmail = user.email;
  }

  markDirty();
  hideProfileSetupModal();
  applyRoleView(user.id);
  var btn = document.getElementById('profileBtn');
  if (btn) {
    btn.innerHTML = renderProfileButtonContent((state.users || []).find(function(u) { return u.id === user.id; }));
  }
  showToast('Profile saved — welcome, ' + name + '.');
}

function maybePromptProfileSetup(user) {
  if (!user || !userNeedsProfileSetup(user)) return;
  showProfileSetupModal(user);
}

function isUsersReadOnlyForCurrentUser() {
  if (!state.currentUserId) return false;
  var me = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  if (!me) return false;
  var ids = state._currentPersonIds || [me.id];
  var roles = [];
  ids.forEach(function(id) {
    var rec = (state.users || []).find(function(u) { return u.id === id; });
    if (!rec) return;
    var r = (rec.roles && rec.roles.length) ? rec.roles : [rec.role];
    r.forEach(function(x) { if (x && roles.indexOf(x) === -1) roles.push(x); });
  });
  if (!roles.length && me.role) roles.push(me.role);
  return roles.indexOf('ao') !== -1 && roles.indexOf('ciso') === -1;
}

// ---- User Sync ----

// Upsert a user by email (preferred) or name (case-insensitive). If the person already exists:
//   - merges family/control assignments if the role matches
//   - fills in missing email or name
//   - marks as auto-generated
// If they don't exist, creates a new record.
function upsertUser(data) {
  if (!state.users) state.users = [];
  var emailKey = normalizeOwnerEmail(data.email);
  var nameKey = (data.name || '').trim().toLowerCase();
  var existing = null;

  if (emailKey) {
    existing = state.users.find(function(u) {
      return normalizeOwnerEmail(u.email) === emailKey && u.role === data.role;
    });
    if (!existing) {
      existing = state.users.find(function(u) { return normalizeOwnerEmail(u.email) === emailKey; });
    }
  }
  if (!existing && nameKey) {
    existing = state.users.find(function(u) {
      return u.name && u.name.trim().toLowerCase() === nameKey && u.role === data.role;
    });
    if (!existing) {
      existing = state.users.find(function(u) { return u.name && u.name.trim().toLowerCase() === nameKey; });
    }
  }

  var displayName = (data.name || '').trim();
  if (!displayName && emailKey) displayName = emailKey.split('@')[0] || 'Pending user';
  var profileComplete = data.profileComplete;
  if (profileComplete === undefined) {
    profileComplete = !!(displayName && displayName !== 'Pending user' && (data.note || '').trim());
  }

  if (existing) {
    if (data.email && !existing.email) existing.email = data.email;
    if (displayName && displayName !== 'Pending user' && (!existing.name || existing.name === 'Pending user' || userNeedsProfileSetup(existing))) {
      existing.name = displayName;
    }
    if (data.note && !existing.note) existing.note = data.note;
    if (profileComplete) existing.profileComplete = true;
    else if (existing.profileComplete !== true && data.profileComplete === false) existing.profileComplete = false;
    if (!existing.families) existing.families = [];
    if (!existing.controls) existing.controls = [];
    if (!existing.assets)   existing.assets   = [];

    if(!existing.roles) existing.roles = [existing.role];
    if(data.role && !existing.roles.includes(data.role)) existing.roles.push(data.role);

    (data.families || []).forEach(function(f) { if (!existing.families.includes(f)) existing.families.push(f); });
    (data.controls || []).forEach(function(c) { if (!existing.controls.includes(c)) existing.controls.push(c); });
    if (data.assets && data.assets.length>0) existing.assets = data.assets;

    existing._autoGenerated = true;
  } else {
    state.users.push({
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      name: displayName || 'Pending user',
      email: data.email || '',
      role: data.role,
      roles: [data.role],
      families: data.families || [],
      controls: data.controls || [],
      assets: data.assets || [],
      note: data.note || '',
      profileComplete: profileComplete,
      _autoGenerated: true,
    });
  }
}

// Reads all role assignments made throughout the wizard and syncs them
// into state.users. Called every time the Users tab is rendered so it
// is always up to date without needing explicit save hooks everywhere.
function syncUsersFromState() {
  // 1. Program Owner → CISO (include any domains they own directly)
  if (state.programOwnerEmail && state.programOwnerEmail.trim()) {
    var cisoFamilies = [];
    var cisoEmailKey = normalizeOwnerEmail(state.programOwnerEmail);
    Object.keys(state.domainOwners || {}).forEach(function(fam) {
      var o = state.domainOwners[fam];
      if (o && normalizeOwnerEmail(o.email) === cisoEmailKey) cisoFamilies.push(fam);
    });
    upsertUser({
      name: state.programOwner || '',
      email: state.programOwnerEmail || '',
      role: 'ciso',
      families: cisoFamilies,
      note: state.programOwnerTitle || '',
      profileComplete: !!(state.programOwner && state.programOwner.trim() && state.programOwnerTitle && state.programOwnerTitle.trim()),
    });
  } else if (state.programOwner && state.programOwner.trim()) {
    var cisoFamiliesByName = [];
    var cisoNameKey = state.programOwner.trim().toLowerCase();
    Object.keys(state.domainOwners || {}).forEach(function(fam) {
      var o = state.domainOwners[fam];
      if (o && o.name && o.name.trim().toLowerCase() === cisoNameKey) cisoFamiliesByName.push(fam);
    });
    upsertUser({
      name: state.programOwner,
      email: state.programOwnerEmail || '',
      role: 'ciso',
      families: cisoFamiliesByName,
      note: state.programOwnerTitle || '',
      profileComplete: !!(state.programOwnerTitle && state.programOwnerTitle.trim()),
    });
  }

  // 2. Domain Owners → ISSM (aggregate multi-domain owners by email)
  var cisoEmailKey = normalizeOwnerEmail(state.programOwnerEmail);
  var cisoNameKey = (state.programOwner || '').trim().toLowerCase();
  if (state.users) {
    state.users.forEach(function(u) {
      if (u.role === 'issm' && u._autoGenerated) {
        u.families = [];
      }
    });
  }
  var issmByEmail = {};
  Object.keys(state.domainOwners || {}).forEach(function(fam) {
    var o = state.domainOwners[fam];
    if (!o || !isValidOwnerEmail(o.email)) return;
    var key = normalizeOwnerEmail(o.email);
    if (key === cisoEmailKey) return;
    if (o.name && o.name.trim().toLowerCase() === cisoNameKey && cisoNameKey) return;
    if (!issmByEmail[key]) issmByEmail[key] = { name: (o.name || '').trim(), email: o.email.trim(), families: [] };
    if (o.name && !issmByEmail[key].name) issmByEmail[key].name = o.name.trim();
    if (!issmByEmail[key].families.includes(fam)) issmByEmail[key].families.push(fam);
  });
  Object.keys(issmByEmail).forEach(function(k) {
    var d = issmByEmail[k];
    upsertUser({
      name: d.name,
      email: d.email,
      role: 'issm',
      families: d.families,
      profileComplete: !!(d.name && d.name.trim()),
    });
  });

  // 3a. ISP Custodian (Tier 1 policy) → custodian
  var ispCust = state.infoSecPolicy && state.infoSecPolicy.custodian;
  if (ispCust && ispCust.name && ispCust.name.trim()) {
    upsertUser({ name: ispCust.name.trim(), email: ispCust.email || '', role: 'custodian', families: ['ISP'] });
  }

  // 3. Domain Policy Custodians → custodian (aggregate by name)
  var custByName = {};
  Object.keys(state.policyCustodians || {}).forEach(function(fam) {
    var entry = state.policyCustodians[fam];
    // support both legacy string format and new object format
    var name  = typeof entry === 'string' ? entry : (entry && entry.name) || '';
    var email = typeof entry === 'string' ? '' : (entry && entry.email) || '';
    var role  = typeof entry === 'string' ? '' : (entry && entry.role) || '';
    if (!name || !name.trim()) return;
    var key = name.trim().toLowerCase();
    if (!custByName[key]) custByName[key] = { name: name.trim(), email: email, role: role, families: [] };
    if (!custByName[key].families.includes(fam)) custByName[key].families.push(fam);
    // fill in email/role if we see them later for same person
    if (email && !custByName[key].email) custByName[key].email = email;
    if (role && !custByName[key].role) custByName[key].role = role;
  });
  Object.keys(custByName).forEach(function(k) {
    var d = custByName[k];
    upsertUser({ name: d.name, email: d.email, role: 'custodian', families: d.families });
  });

  // 4. Control Owners → control-owner (aggregate by work email for sign-up)
  var ctrlByEmail = {};
  Object.keys(state.controlOwners || {}).forEach(function(ctrlId) {
    var o = state.controlOwners[ctrlId];
    if (!o || !(o.name || '').trim() || !isValidOwnerEmail(o.email)) return;
    var key = normalizeOwnerEmail(o.email);
    if (!ctrlByEmail[key]) ctrlByEmail[key] = { name: o.name.trim(), email: o.email.trim(), controls: [] };
    if (!ctrlByEmail[key].controls.includes(ctrlId)) ctrlByEmail[key].controls.push(ctrlId);
  });
  Object.keys(ctrlByEmail).forEach(function(k) {
    var d = ctrlByEmail[k];
    upsertUser({ name: d.name, email: d.email, role: 'control-owner', controls: d.controls });
  });

  // 5. Policy Review Approvers (sync custom approvers different from default)
  Object.keys(state.policyReviewCycle || {}).forEach(function(policyKey) {
    var rc = state.policyReviewCycle[policyKey];
    if (!rc || !rc.approvedBy || !rc.approvedBy.trim()) return;

    // Default formal approver is the program owner (CISO) for both ISP and domain policies; ISSM is policy owner, not default approver.
    var defaultApproverName = (state.programOwner || '').trim();

    // Only create a user entry if the approver differs from the default
    var currentApproverName = rc.approvedBy.trim();
    var approverKey = currentApproverName.toLowerCase();
    if (approverKey === defaultApproverName.toLowerCase() || approverKey === cisoNameKey) return;

    upsertUser({ name: currentApproverName, email: rc.approverEmail || '', role: 'approver', families: [policyKey] });
  });

  // 6. Asset Owners → asset-owner (aggregate by name from state.assets)
  var assetOwnerByName = {};
  (state.assets || []).forEach(function(a) {
    if (!a.owner || !a.owner.trim()) return;
    var key = a.owner.trim().toLowerCase();
    if (!assetOwnerByName[key]) assetOwnerByName[key] = { name: a.owner.trim(), email: a.ownerEmail || '', assets: [] };
    assetOwnerByName[key].assets.push(a.id);
    if (a.ownerEmail && !assetOwnerByName[key].email) assetOwnerByName[key].email = a.ownerEmail;
  });
  Object.keys(assetOwnerByName).forEach(function(k) {
    var d = assetOwnerByName[k];
    upsertUser({ name: d.name, email: d.email, role: 'asset-owner', assets: d.assets });
  });
}

// ---- Users Tab Render ----

function renderUsersTab() {
  const body = document.getElementById('users-body');
  if (!body) return;

  // Pull in any roles assigned elsewhere in the wizard
  syncUsersFromState();

  const families = Object.keys(FAMILIES).sort();
  const allControls = CONTROLS || [];
  var readOnly = isUsersReadOnlyForCurrentUser();

  let html = '<div style="max-width:900px;">';
  if (readOnly) {
    html += '<div style="margin-bottom:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;font-size:12px;color:#92400e;">'
      + '<strong>Read-only access:</strong> Authorizing Official can view users and assignments, but only admin/CISO can edit this roster.'
      + '</div>';
  }

  // Summary bar
  const counts = {};
  (state.users || []).forEach(function(u){ counts[u.role] = (counts[u.role]||0)+1; });
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;">';
  Object.keys(ROLE_META).forEach(function(r) {
    const m = ROLE_META[r];
    html += '<div style="background:' + m.color + '18;border:1px solid ' + m.color + '44;border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;">'
      + '<span style="font-size:16px;">' + m.icon + '</span>'
      + '<span style="font-size:13px;font-weight:600;color:' + m.color + ';">' + (counts[r]||0) + '</span>'
      + '<span style="font-size:12px;color:#64748b;">' + m.label + '</span>'
      + '</div>';
  });
  (state.customProgramRoles || []).forEach(function(c) {
    if (!c || !c.slug) return;
    var n = counts[c.slug] || 0;
    html += '<div style="background:#0d948818;border:1px solid #0d948844;border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;">'
      + '<span style="font-size:16px;">✦</span>'
      + '<span style="font-size:13px;font-weight:600;color:#0d9488;">' + n + '</span>'
      + '<span style="font-size:12px;color:#64748b;">' + _esc(c.label) + '</span>'
      + '</div>';
  });
  html += '</div>';

  if (typeof renderEntraAdminSetupHtml === 'function') {
    html += renderEntraAdminSetupHtml();
  }

  html += '<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;' + (readOnly ? 'opacity:0.7;' : '') + '">'
    + '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px;">Custom program roles</div>'
    + '<div style="font-size:12px;color:#64748b;margin-bottom:14px;line-height:1.5;">Define extra personas (e.g. 3PAO, independent SCA). Assign them from the Role dropdown when adding users. <strong>Assessor-like</strong> grants the Authorization &amp; Testing workspace; <strong>Reports only</strong> is for stakeholders who should not edit boundaries.</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">'
    + (state.customProgramRoles || []).map(function(c) {
      if (!c || !c.slug) return '';
      return '<div style="display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:12px;">'
        + '<span style="font-weight:600;color:#0f172a;">' + _esc(c.label) + '</span>'
        + '<span style="color:#94a3b8;font-family:monospace;">' + _esc(c.slug) + '</span>'
        + '<span style="color:#64748b;">(' + _esc(c.tabsTemplate === 'reports-only' ? 'reports' : 'assessor tabs') + ')</span>'
        + (readOnly ? '' : '<button type="button" onclick="removeCustomProgramRole(' + JSON.stringify(c.slug) + ')" style="margin-left:6px;color:#b91c1c;border:none;background:none;cursor:pointer;font-size:12px;">Remove</button>')
        + '</div>';
    }).join('')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end;">'
    + '<div><label style="font-size:11px;font-weight:600;color:#475569;">Display label</label>'
    + '<input id="customRoleLabel" class="form-input" placeholder="e.g. Independent SCA" style="width:100%;margin-top:4px;font-size:13px;" ' + (readOnly ? 'disabled ' : '') + '/></div>'
    + '<div><label style="font-size:11px;font-weight:600;color:#475569;">Role id (slug)</label>'
    + '<input id="customRoleSlug" class="form-input" placeholder="auto from label if empty" style="width:100%;margin-top:4px;font-size:13px;" ' + (readOnly ? 'disabled ' : '') + '/></div>'
    + '<div><label style="font-size:11px;font-weight:600;color:#475569;">Tab access</label>'
    + '<select id="customRoleTabs" class="form-select" style="width:100%;margin-top:4px;font-size:13px;" ' + (readOnly ? 'disabled ' : '') + '>'
    + '<option value="assessor">Like Security Assessor (Testing + Reports)</option>'
    + '<option value="reports-only">Reports only</option>'
    + '</select></div>'
    + '<button type="button" class="btn btn-primary btn-sm" ' + (readOnly ? 'disabled ' : 'onclick="addCustomProgramRole()"') + ' style="margin-bottom:2px;">Add role</button>'
    + '</div></div>';

  // Add user form (inline)
  html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;' + (readOnly ? 'opacity:0.7;' : '') + '">'
    + '<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:16px;">➕ Add New User</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Full Name *</label>'
    + '<input id="newUserName" ' + (readOnly ? 'disabled ' : '') + 'placeholder="Jane Smith" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;" /></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Email</label>'
    + '<input id="newUserEmail" ' + (readOnly ? 'disabled ' : '') + 'placeholder="jane@agency.gov" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;" /></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Role *</label>'
    + '<select id="newUserRole" ' + (readOnly ? 'disabled ' : '') + ' onchange="renderNewUserAssignments()" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:white;">'
    + buildProgramRoleSelectOptions('')
    + '</select></div>'
    + '</div>'
    + '<div id="newUserAssignments" style="margin-bottom:12px;"></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Note (optional)</label>'
    + '<input id="newUserNote" ' + (readOnly ? 'disabled ' : '') + ' placeholder="e.g. Primary contact for AC/IA domain" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;" /></div>'
    + '<div style="margin-top:16px;">'
    + '<button class="btn" ' + (readOnly ? 'disabled ' : 'onclick="saveNewUser()"') + ' style="padding:8px 20px;font-size:13px;">Add User</button>'
    + '</div>'
    + '</div>';

  // User list
  if (!state.users || state.users.length === 0) {
    html += '<div style="text-align:center;padding:48px;color:#94a3b8;font-size:14px;background:#f8fafc;border:1px dashed #e2e8f0;border-radius:12px;">'
      + '👥 No users added yet. Add your first user above.</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:12px;">';
    (state.users || []).forEach(function(u, idx) {
      const m = getProgramRoleMeta(u.role);
      const assignText = (u.role === 'issm' || u.role === 'custodian')
        ? (u.families && u.families.length ? u.families.map(function(f){ return '<span style="font-family:monospace;font-weight:700;">' + f + '</span>'; }).join(' ') : '<span style="color:#94a3b8;">No domains assigned</span>')
        : u.role === 'control-owner'
          ? (u.controls && u.controls.length ? u.controls.slice(0,6).map(function(c){ return '<span style="font-family:monospace;font-size:11px;background:#f1f5f9;padding:1px 5px;border-radius:3px;">' + c + '</span>'; }).join(' ') + (u.controls.length > 6 ? ' <span style="color:#94a3b8;">+' + (u.controls.length-6) + ' more</span>' : '') : '<span style="color:#94a3b8;">No controls assigned</span>')
          : '';
      html += '<div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;display:flex;align-items:center;gap:16px;">'
        + '<div style="font-size:28px;">' + m.icon + '</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<span style="font-weight:700;font-size:15px;color:#1e293b;">' + _esc(u.name) + '</span>'
        + '<span style="background:' + m.color + '18;color:' + m.color + ';font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;">' + m.label + '</span>'
        + (u._autoGenerated ? '<span style="background:#f0fdf4;color:#16a34a;font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;border:1px solid #bbf7d0;" title="Automatically synced from wizard">⚙ synced</span>' : '<span style="background:#fafafa;color:#94a3b8;font-size:10px;font-weight:500;padding:2px 7px;border-radius:20px;border:1px solid #e2e8f0;">manual</span>')
        + (u.email ? '<span style="color:#94a3b8;font-size:12px;">' + _esc(u.email) + '</span>' : '')
        + '</div>'
        + (assignText ? '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">' + assignText + '</div>' : '')
        + (u.note ? '<div style="color:#94a3b8;font-size:12px;margin-top:4px;">' + _esc(u.note) + '</div>' : '')
        + '</div>'
        + '<div style="display:flex;gap:8px;">'
        + '<button ' + (readOnly ? 'disabled ' : 'onclick="openEditUserModal(\'' + u.id + '\')"') + ' title="Edit user" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">✏️ Edit</button>'
        + '<button ' + (readOnly ? 'disabled ' : 'onclick="removeUser(\'' + u.id + '\')"') + ' title="Remove user" style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;">✕</button>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  body.innerHTML = html;
  if (state._newUserRolePreset) {
    var presetSel = document.getElementById('newUserRole');
    if (presetSel) {
      presetSel.value = state._newUserRolePreset;
      renderNewUserAssignments();
    }
    state._newUserRolePreset = '';
  }
}

function renderNewUserAssignments() {
  const role = document.getElementById('newUserRole').value;
  const container = document.getElementById('newUserAssignments');
  if (!container) return;
  if (!role || role === 'ciso') { container.innerHTML = ''; return; }

  const families = getActiveFamilies ? getActiveFamilies() : Object.keys(FAMILIES);

  if (role === 'issm' || role === 'custodian') {
    container.innerHTML = '<label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Assigned Domains</label>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      + families.filter(function(f){ return f !== 'PM'; }).map(function(f) {
          return '<label style="display:flex;align-items:center;gap:5px;background:#f1f5f9;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;">'
            + '<input type="checkbox" value="' + f + '" name="newUserFam"> <span style="font-family:monospace;font-weight:700;">' + f + '</span> <span style="color:#64748b;">' + (FAMILIES[f]||f) + '</span></label>';
        }).join('')
      + '</div>';
  } else if (role === 'control-owner') {
    const ctrls = (CONTROLS || []).filter(function(c){ return families.includes(c.f); });
    container.innerHTML = '<label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Assigned Controls</label>'
      + '<div style="max-height:180px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;padding:8px;display:flex;flex-wrap:wrap;gap:6px;">'
      + ctrls.map(function(c) {
          return '<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;">'
            + '<input type="checkbox" value="' + c.id + '" name="newUserCtrl"> <span style="font-family:monospace;font-weight:600;">' + c.id + '</span></label>';
        }).join('')
      + '</div>';
  } else {
    container.innerHTML = '';
  }
}

/** Add a user row (no domain/control assignment). Returns new user or null. Used from Users tab and ATO assessor quick-add. */
function addProgramUserFromFields(name, email, role, note) {
  if (isUsersReadOnlyForCurrentUser()) { showToast('Read-only: AO cannot modify users.', true); return null; }
  name = String(name || '').trim();
  email = String(email || '').trim();
  role = String(role || '').trim();
  if (!name) { showToast('Name is required.', true); return null; }
  if (!role) { showToast('Select a role.', true); return null; }
  if (!isKnownProgramRole(role)) { showToast('Invalid role selection.', true); return null; }
  if (!state.users) state.users = [];
  var user = { id: 'u_' + Date.now(), name: name, email: email, role: role, families: [], controls: [], note: String(note || '').trim() };
  state.users.push(user);
  markDirty();
  try { addAuditEntry('users', user.id, 'User added: ' + name + ' (' + role + ')'); } catch (e) {}
  return user;
}

function saveNewUser() {
  if (isUsersReadOnlyForCurrentUser()) { showToast('Read-only: AO cannot modify users.', true); return; }
  const name = (document.getElementById('newUserName').value || '').trim();
  const email = (document.getElementById('newUserEmail').value || '').trim();
  const role = document.getElementById('newUserRole').value;
  const note = (document.getElementById('newUserNote').value || '').trim();
  if (!name) { showToast('⚠️ Name is required'); return; }
  if (!role) { showToast('⚠️ Please select a role'); return; }
  if (!isKnownProgramRole(role)) { showToast('⚠️ Invalid role selection', true); return; }

  const families = Array.from(document.querySelectorAll('input[name="newUserFam"]:checked')).map(function(cb){ return cb.value; });
  const controls = Array.from(document.querySelectorAll('input[name="newUserCtrl"]:checked')).map(function(cb){ return cb.value; });

  const user = { id: 'u_' + Date.now(), name: name, email: email, role: role, families: families, controls: controls, note: note };
  if (!state.users) state.users = [];
  state.users.push(user);
  markDirty();
  showToast('✅ ' + name + ' added');
  renderUsersTab();
}

function removeUser(id) {
  if (isUsersReadOnlyForCurrentUser()) { showToast('Read-only: AO cannot modify users.', true); return; }
  state.users = (state.users || []).filter(function(u){ return u.id !== id; });
  if (state.currentUserId === id) {
    if (typeof mapCloudIdentityToRoleView === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
      mapCloudIdentityToRoleView();
    } else {
      applyRoleView('admin');
    }
  }
  renderUsersTab();
  showToast('User removed');
}

function openEditUserModal(id) {
  if (isUsersReadOnlyForCurrentUser()) { showToast('Read-only: AO cannot modify users.', true); return; }
  var u = (state.users||[]).find(function(u){ return u.id === id; });
  if (!u) return;
  var overlay = document.createElement('div');
  overlay.id = 'editUserOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px 32px;width:460px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-bottom:20px;">✏️ Edit User</div>'
    + '<div style="display:flex;flex-direction:column;gap:14px;">'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Full Name</label>'
    + '<input id="_editUserName" class="form-input" value="' + _esc(u.name||'') + '" style="width:100%;box-sizing:border-box;font-size:13px;"></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Email</label>'
    + '<input id="_editUserEmail" class="form-input" value="' + _esc(u.email||'') + '" style="width:100%;box-sizing:border-box;font-size:13px;"></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Role</label>'
    + '<select id="_editUserRole" class="form-select" style="width:100%;box-sizing:border-box;font-size:13px;margin-top:4px;">'
    + buildProgramRoleSelectOptions(u.role || '')
    + '</select></div>'
    + '<div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">Title / Note</label>'
    + '<input id="_editUserNote" class="form-input" value="' + _esc(u.note||'') + '" style="width:100%;box-sizing:border-box;font-size:13px;"></div>'
    + '</div>'
    + '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'editUserOverlay\').remove()">Cancel</button>'
    + '<button class="btn btn-primary" onclick="saveEditUser(\'' + id + '\')">Save Changes</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function saveEditUser(id) {
  if (isUsersReadOnlyForCurrentUser()) { showToast('Read-only: AO cannot modify users.', true); return; }
  var u = (state.users||[]).find(function(u){ return u.id === id; });
  if (!u) return;
  var newName  = document.getElementById('_editUserName')?.value.trim();
  var newEmail = document.getElementById('_editUserEmail')?.value.trim();
  var newNote  = document.getElementById('_editUserNote')?.value.trim();
  var newRole  = (document.getElementById('_editUserRole') || {}).value || '';
  if (!newName) { showToast('Name cannot be empty.', true); return; }
  if (!newRole || !isKnownProgramRole(newRole)) { showToast('Select a valid role.', true); return; }
  if (typeof logFieldChange === 'function') {
    logFieldChange('users.' + id + '.name',  u.name  || '', newName);
    logFieldChange('users.' + id + '.email', u.email || '', newEmail);
    logFieldChange('users.' + id + '.note',  u.note  || '', newNote);
    logFieldChange('users.' + id + '.role',  u.role  || '', newRole);
  }
  u.name  = newName;
  u.email = newEmail;
  u.note  = newNote;
  u.role  = newRole;
  markDirty();
  document.getElementById('editUserOverlay')?.remove();
  renderUsersTab();
  showToast('✅ User updated.');
}

function openUsersRolePreset(role) {
  state._newUserRolePreset = role || '';
  showTab('users');
  setTimeout(function() {
    var sel = document.getElementById('newUserRole');
    if (!sel) return;
    sel.value = state._newUserRolePreset || '';
    renderNewUserAssignments();
  }, 0);
}
