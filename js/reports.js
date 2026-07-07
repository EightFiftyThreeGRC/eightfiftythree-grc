// js/reports.js — dashboard, reports tab, CISO/ISP modals, audit & review queue. Split from app.js (Step 7).
// Globals only; load after testing.js.

// ============================================================
// REPORTS LIBRARY (read-only published policies + planned+ controls)
// ============================================================
var REPORTS_CONTROL_PLANNED_PLUS = ['Planned', 'In Progress', 'Implemented', 'Not Applicable', 'Inherited'];

function goToReportsDashboard() {
  state._reportsLibraryView = null;
  state._reportsLibraryPolicyFam = null;
  showTab('reports');
}

function goToReportsLibrary(page) {
  var _valid = ['controls','policies','assets','processes'];
  state._reportsLibraryView = _valid.indexOf(page) !== -1 ? page : 'policies';
  state._reportsLibraryPolicyFam = null;
  state._policyLibraryMode = false;
  state._controlLibraryMode = false;
  if (typeof toggleSidebarReportsList === 'function') toggleSidebarReportsList(true);
  showTab('reports');
}

function openPublishedPolicyFromReports(fam) {
  if (fam === 'ISP') {
    if (typeof getISPStatus === 'function' && getISPStatus() !== 'Approved') return;
  } else if ((state.policyStatus[fam] || {}).status !== 'Approved') {
    return;
  }
  state._reportsLibraryPolicyFam = fam;
  renderReports();
}

function backToReportsPolicyLibrary() {
  state._reportsLibraryPolicyFam = null;
  renderReports();
}

function syncReportsLibraryNavActive() {
  var polNav = document.getElementById('nav-reports-library-policies');
  var ctrlNav = document.getElementById('nav-reports-library-controls');
  var assetNav = document.getElementById('nav-reports-library-assets');
  var procNav = document.getElementById('nav-reports-library-processes');
  var _v = state._reportsLibraryView;
  if (polNav) polNav.classList.toggle('active', _v === 'policies');
  if (ctrlNav) ctrlNav.classList.toggle('active', _v === 'controls');
  if (assetNav) assetNav.classList.toggle('active', _v === 'assets');
  if (procNav) procNav.classList.toggle('active', _v === 'processes');
}

function userHasReportsLibraryAccess(user) {
  if (!state.baseline) return false;
  if (!user) return true;
  if (typeof getPersonVisibleTabIds === 'function') {
    return getPersonVisibleTabIds(user).indexOf('reports') !== -1;
  }
  return true;
}

function renderReportsLibraryEntryHtml() {
  // Library entry banner removed 2026-07-04 — the library is reachable from the
  // sidebar (Reports ▸ Library). Function kept so existing call sites are no-ops.
  return '';
}

function renderReportsLibraryShell() {
  var dashPanel = document.getElementById('reports-dashboard-panel');
  var libPanel = document.getElementById('reports-library-panel');
  var hdr = document.getElementById('reports-library-header');
  var body = document.getElementById('reports-library-body');
  if (dashPanel) dashPanel.style.display = 'none';
  if (libPanel) libPanel.style.display = '';
  syncReportsLibraryNavActive();

  if (!body || !hdr) return;

  if (!state.baseline) {
    hdr.innerHTML = '<div class="role-badge">📚 Library</div><h1>Program Library</h1><p>Published policies and control requirements.</p>';
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">Setup Required</div><p>Complete program setup before the library is available.</p></div>';
    return;
  }

  if (state._reportsLibraryPolicyFam) {
    hdr.innerHTML = '<div class="role-badge">📚 Library · Published policies</div><h1>Policy document</h1><p>Read-only view for staff and auditors.</p>';
    if (state._reportsLibraryPolicyFam === 'ISP') {
      if (typeof renderPublishedISPDocInReports === 'function') renderPublishedISPDocInReports(body);
    } else if (typeof renderPolicyDocViewer === 'function') {
      renderPolicyDocViewer(state._reportsLibraryPolicyFam, {
        bodyEl: body,
        readOnly: true,
        backOnclick: 'backToReportsPolicyLibrary()',
        backLabel: '← Published policies'
      });
    }
    return;
  }

  if (state._reportsLibraryView === 'policies') {
    hdr.innerHTML = '<div class="page-header-row"><div><div class="role-badge">📁 Policies</div><h1>Policies</h1><p>Every domain policy — owner, custodian, status, version, and control count. Open an approved policy to read the document.</p></div>'
      + '<div class="page-header-actions"><button type="button" class="btn btn-secondary" onclick="goToReportsDashboard()">← Reports dashboard</button></div></div>';
    renderPoliciesInventory(body);
    return;
  }

  if (state._reportsLibraryView === 'controls') {
    hdr.innerHTML = '<div class="page-header-row"><div><div class="role-badge">🔧 Controls</div><h1>Controls</h1><p>Every in-scope control — owner, governing policy, asset/process types, and design status. Open a control for its read-only design detail.</p></div>'
      + '<div class="page-header-actions"><button type="button" class="btn btn-secondary" onclick="goToReportsDashboard()">← Reports dashboard</button></div></div>';
    renderControlsInventory(body);
    return;
  }

  if (state._reportsLibraryView === 'assets') {
    hdr.innerHTML = '<div class="page-header-row"><div><div class="role-badge">🖥️ Asset inventory</div><h1>Asset inventory</h1><p>Manage asset categories and subtypes — rename, add, or remove entries. Coverage keys stay stable so control design checkboxes remain checked after renames.</p></div>'
      + '<div class="page-header-actions"><button type="button" class="btn btn-secondary" onclick="goToReportsDashboard()">← Reports dashboard</button></div></div>';
    renderAssetTypesInventory(body);
    return;
  }

  if (state._reportsLibraryView === 'processes') {
    hdr.innerHTML = '<div class="page-header-row"><div><div class="role-badge">⚙️ Process inventory</div><h1>Process inventory</h1><p>Manage process categories and subtypes — rename, add, or remove entries. Coverage keys stay stable so control design checkboxes remain checked after renames.</p></div>'
      + '<div class="page-header-actions"><button type="button" class="btn btn-secondary" onclick="goToReportsDashboard()">← Reports dashboard</button></div></div>';
    renderProcessTypesInventory(body);
    return;
  }
}

function showReportsDashboardPanels() {
  var dashPanel = document.getElementById('reports-dashboard-panel');
  var libPanel = document.getElementById('reports-library-panel');
  if (dashPanel) dashPanel.style.display = '';
  if (libPanel) libPanel.style.display = 'none';
  syncReportsLibraryNavActive();
}

// ============================================================
// REPORTS INVENTORIES (Controls Inventory, Policies Inventory)
// Read views under Reports ▸ Inventory. Added 2026-07-06.
// ============================================================
function _invScopedControls() {
  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var isScoped = !!user && user.role !== 'admin';
  var controls = (isScoped && typeof getScopedControls === 'function') ? getScopedControls() : (typeof getActiveControls === 'function' ? getActiveControls() : (CONTROLS||[]));
  var families = (isScoped && typeof getScopedFamilies === 'function') ? getScopedFamilies() : (typeof getActiveFamilies === 'function' ? getActiveFamilies() : Object.keys(FAMILIES).sort());
  return { controls: controls, families: families };
}

function renderControlsInventory(body) {
  if (!body) return;
  var sc = _invScopedControls();
  var controls = sc.controls, families = sc.families;
  function ownerCell(id){ var o=(state.controlOwners||{})[id]||{}; return o.name ? escapeHTML(o.name) : '<span style="color:#94a3b8;">Unassigned</span>'; }
  function policyCell(fam){
    var target = (state.policyMerges||{})[fam] || fam;
    var ps = (state.policyStatus[target]||{}).status || (state.policyStatus[fam]||{}).status || 'Not Started';
    if (ps === 'Not Started') return '<span style="color:#94a3b8;">N/A</span>';
    var title = (typeof getPolicyMergedTitle==='function') ? getPolicyMergedTitle(fam) : (fam + ' Policy');
    return escapeHTML(title) + ' ' + chipHTML(ps);
  }
  function typesCell(id){
    var t = (typeof getCtrlCoveredAssetTypes==='function' ? getCtrlCoveredAssetTypes(id) : []).map(function(x){ return x.label; });
    if (!t.length) return '<span style="color:#94a3b8;">N/A</span>';
    return t.map(function(x){ return '<span style="display:inline-block;background:#f1f5f9;border-radius:4px;padding:1px 6px;margin:1px;font-size:11px;">' + escapeHTML(x) + '</span>'; }).join('');
  }
  var html = '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
    + '<div style="font-size:12px;color:var(--text-muted);">' + controls.length + ' controls in scope · click a row for read-only design detail</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<input type="text" id="ctrlInvSearch" placeholder="Search…" oninput="filterCtrlInvTable()" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;">'
    + '<select id="ctrlInvFamFilter" onchange="filterCtrlInvTable()" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;"><option value="">All Families</option>' + families.map(function(f){ return '<option value="'+f+'">'+f+'</option>'; }).join('') + '</select>'
    + '<select id="ctrlInvStatusFilter" onchange="filterCtrlInvTable()" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;"><option value="">All Statuses</option><option>Not Started</option><option>Planned</option><option>Implemented</option><option>Not Applicable</option></select>'
    + '</div></div>'
    + '<div class="table-scroll"><table class="control-table" id="ctrlInvTable"><thead><tr>'
    + '<th style="width:74px;">ID</th><th>Control Name</th><th style="width:56px;">Family</th><th>Owner</th><th>Associated Policy</th><th>Asset / Process Types</th><th style="width:74px;">Designed</th><th style="width:120px;">Impl. Status</th>'
    + '</tr></thead><tbody>'
    + controls.map(function(c){
        var cs = state.controlStatus[c.id]||{};
        var designed = (typeof isControlDesigned==='function') && isControlDesigned(c.id);
        return '<tr data-id="'+c.id+'" data-family="'+c.f+'" data-status="'+(cs.status||'Not Started')+'" style="cursor:pointer;" onclick="openControlLibraryReadOnly(\''+c.id+'\')" title="Open read-only design detail">'
          + '<td><span class="control-id">'+c.id+'</span></td>'
          + '<td>'+escapeHTML(c.n)+'</td>'
          + '<td><span class="family-badge">'+c.f+'</span></td>'
          + '<td>'+ownerCell(c.id)+'</td>'
          + '<td>'+policyCell(c.f)+'</td>'
          + '<td>'+typesCell(c.id)+'</td>'
          + '<td style="font-weight:700;color:'+(designed?'#166534':'#94a3b8')+';">'+(designed?'Yes':'No')+'</td>'
          + '<td>'+chipHTML(cs.status||'Not Started')+'</td>'
          + '</tr>';
      }).join('')
    + '</tbody></table></div></div>';
  body.innerHTML = html;
}

function filterCtrlInvTable() {
  var q = ((document.getElementById('ctrlInvSearch')||{}).value || '').toLowerCase();
  var fam = (document.getElementById('ctrlInvFamFilter')||{}).value || '';
  var st = (document.getElementById('ctrlInvStatusFilter')||{}).value || '';
  var rows = document.querySelectorAll('#ctrlInvTable tbody tr');
  rows.forEach(function(tr){
    var okQ = !q || (tr.textContent||'').toLowerCase().indexOf(q) !== -1;
    var okF = !fam || tr.getAttribute('data-family') === fam;
    var okS = !st || tr.getAttribute('data-status') === st;
    tr.style.display = (okQ && okF && okS) ? '' : 'none';
  });
}

function renderPoliciesInventory(body) {
  if (!body) return;
  var sc = _invScopedControls();
  var families = sc.families;
  var merges = state.policyMerges || {};
  var rows = families.filter(function(f){ return !merges[f]; });
  function pName(o){ return (o && o.name) ? escapeHTML(o.name) : '<span style="color:#94a3b8;">Unassigned</span>'; }
  function policyRow(fam){
    var title = (typeof getPolicyMergedTitle==='function') ? getPolicyMergedTitle(fam) : (fam+' Policy');
    var allFams = (typeof getPolicyAllFamilies==='function') ? getPolicyAllFamilies(fam) : [fam];
    var owner = (state.domainOwners||{})[fam] || {};
    var cust = (state.policyCustodians||{})[fam] || {};
    var ps = (state.policyStatus[fam]||{}).status || 'Not Started';
    var vers = (state.policyVersions||{})[fam];
    var vlabel = (vers && vers.length) ? escapeHTML(String(vers[vers.length-1].version || '—')) : '—';
    var ctrlCount = allFams.reduce(function(a,f){ return a + (((state.policySelectedControls||{})[f])||[]).length; }, 0);
    if (!ctrlCount) ctrlCount = allFams.reduce(function(a,f){ return a + (CONTROLS||[]).filter(function(c){return c.f===f;}).length; }, 0);
    var famBadges = allFams.map(function(f){ return '<span class="family-badge" style="font-size:10px;padding:1px 5px;">'+f+'</span>'; }).join(' ');
    var clickable = ps === 'Approved';
    var onclick = clickable ? ' onclick="openPublishedPolicyFromReports(\''+fam+'\')" title="Open policy document"' : '';
    return '<tr style="border-bottom:1px solid var(--border);'+(clickable?'cursor:pointer;':'')+'"'+onclick+'>'
      + '<td style="padding:11px 10px;">'+famBadges+'</td>'
      + '<td style="padding:11px 10px;font-weight:600;color:'+(clickable?'var(--teal)':'inherit')+';">'+escapeHTML(title)+(clickable?' <span style="font-size:11px;">↗</span>':'')+'</td>'
      + '<td style="padding:11px 10px;">'+pName(owner)+'</td>'
      + '<td style="padding:11px 10px;">'+pName(cust)+'</td>'
      + '<td style="padding:11px 10px;">'+chipHTML(ps)+'</td>'
      + '<td style="padding:11px 10px;text-align:center;">'+vlabel+'</td>'
      + '<td style="padding:11px 10px;text-align:center;font-weight:600;">'+ctrlCount+'</td>'
      + '</tr>';
  }
  var ispStatus = (typeof getISPStatus==='function') ? getISPStatus() : (((state.policyStatus||{}).ISP||{}).status || 'Not Started');
  var ispClickable = ispStatus === 'Approved';
  var ispOnclick = ispClickable ? ' onclick="openPublishedPolicyFromReports(\'ISP\')" title="Open policy document"' : '';
  var ispRow = '<tr style="border-bottom:1px solid var(--border);background:#f8fafc;'+(ispClickable?'cursor:pointer;':'')+'"'+ispOnclick+'>'
    + '<td style="padding:11px 10px;"><span class="family-badge" style="font-size:10px;padding:1px 5px;background:#e0f2fe;color:#0369a1;">ISP</span></td>'
    + '<td style="padding:11px 10px;font-weight:600;color:'+(ispClickable?'var(--teal)':'inherit')+';">Information Security Policy'+(ispClickable?' <span style="font-size:11px;">↗</span>':'')+'</td>'
    + '<td style="padding:11px 10px;">'+((state.programOwner)?escapeHTML(state.programOwner):'<span style="color:#94a3b8;">Unassigned</span>')+'</td>'
    + '<td style="padding:11px 10px;color:#94a3b8;">—</td>'
    + '<td style="padding:11px 10px;">'+chipHTML(ispStatus)+'</td>'
    + '<td style="padding:11px 10px;text-align:center;color:#94a3b8;">—</td>'
    + '<td style="padding:11px 10px;text-align:center;color:#94a3b8;">—</td>'
    + '</tr>';
  var html = '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;">'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">' + (rows.length+1) + ' policies · open an approved policy to read the document</div>'
    + '<div class="table-scroll"><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="border-bottom:2px solid var(--border);text-align:left;">'
    + '<th style="padding:10px;font-weight:600;">Domain</th><th style="padding:10px;font-weight:600;">Policy</th><th style="padding:10px;font-weight:600;">Owner</th><th style="padding:10px;font-weight:600;">Custodian</th><th style="padding:10px;font-weight:600;">Status</th><th style="padding:10px;font-weight:600;text-align:center;">Version</th><th style="padding:10px;font-weight:600;text-align:center;">Controls</th>'
    + '</tr></thead><tbody>'
    + ispRow
    + rows.map(policyRow).join('')
    + '</tbody></table></div></div>';
  body.innerHTML = html;
}

function _invBuildTypeCoverageIndex() {
  var sc = _invScopedControls();
  var index = {};
  sc.controls.forEach(function(c) {
    var cov = ((state.controlStatus[c.id] || {}).assetCoverage) || {};
    Object.keys(cov).forEach(function(key) {
      if (!cov[key]) return;
      if (!index[key]) index[key] = [];
      index[key].push(c.id);
    });
  });
  return index;
}

function _invControlBadgesHtml(ctrlIds) {
  if (!ctrlIds || !ctrlIds.length) {
    return '<span style="color:#94a3b8;">None</span>';
  }
  return ctrlIds.map(function(id) {
    return '<span class="control-id" style="display:inline-block;margin:1px 2px;cursor:pointer;" onclick="event.stopPropagation();openControlLibraryReadOnly(\'' + id + '\')" title="Open read-only design detail">' + escapeHTML(id) + '</span>';
  }).join(' ');
}

function _invAssetTypeRows() {
  var rows = [];
  if (typeof getActiveAssetTypeCatalog === 'function') {
    getActiveAssetTypeCatalog().forEach(function(cat) {
      if (cat.category === 'Process') return;
      cat.types.forEach(function(t) {
        rows.push({
          key: t.key,
          label: typeof getAssetTypeDisplayLabel === 'function' ? getAssetTypeDisplayLabel(t.key) : t.label,
          category: cat.category,
          isCustom: false
        });
      });
    });
  }
  (state.customAssetTypes || []).forEach(function(name) {
    if (!name || !String(name).trim()) return;
    var group = ((state.customAssetTypeGroups || {})[name] || 'Custom').trim() || 'Custom';
    rows.push({ key: 'custom_' + name, label: name, category: group, isCustom: true });
  });
  return rows;
}

function _invProcessCategorySections() {
  if (typeof getActiveProcessCategories !== 'function' || typeof getActiveProcessTypeRows !== 'function') return [];
  var categories = getActiveProcessCategories();
  var rows = getActiveProcessTypeRows();
  return categories.map(function(cat) {
    return {
      id: cat.id,
      label: cat.label,
      isBuiltIn: cat.isBuiltIn,
      types: rows.filter(function(r) { return r.categoryId === cat.id; })
    };
  });
}

function _invRetiredProcessCategories() {
  return (state.removedBuiltInProcessCategories || []).map(function(id) {
    var builtIn = (typeof PROCESS_CATEGORIES !== 'undefined' ? PROCESS_CATEGORIES : []).find(function(c) { return c.id === id; });
    return { id: id, label: builtIn ? builtIn.label : id };
  });
}

function _invRetiredProcessTypes() {
  var retired = [];
  (state.removedBuiltInAssetTypeKeys || []).forEach(function(key) {
    if (String(key).indexOf('proc_') !== 0) return;
    ASSET_TYPES.forEach(function(cat) {
      if (cat.category !== 'Process') return;
      cat.types.forEach(function(t) {
        if (t.key === key) {
          retired.push({
            key: t.key,
            label: t.label,
            categoryId: typeof getProcessTypeCategoryId === 'function' ? getProcessTypeCategoryId(t.key) : ''
          });
        }
      });
    });
  });
  return retired;
}

function invApplyProcessTypeChange(action, label, categoryId) {
  if (typeof applyProcessTypeChangeDirect === 'function') {
    applyProcessTypeChangeDirect(action, label, categoryId);
  }
}

function invApplyProcessCategoryChange(action, labelOrId) {
  if (typeof applyProcessCategoryChangeDirect === 'function') {
    applyProcessCategoryChangeDirect(action, labelOrId);
  }
}

function invRestoreProcessCategory(categoryId) {
  if (typeof restoreProcessCategoryDirect === 'function') restoreProcessCategoryDirect(categoryId);
}

function invSubmitNewProcessCategoryFromReports() {
  var el = document.getElementById('procInvNewCategory');
  var name = ((el && el.value) || '').trim();
  if (!name) { showToast('Process category name is required.', true); if (el) el.focus(); return; }
  invApplyProcessCategoryChange('add', name);
  if (el) el.value = '';
}

function invSubmitNewProcessTypeFromReports(categoryId) {
  var catId = String(categoryId || '').trim();
  var nameEl = catId ? document.getElementById('procInvSubtype_' + invSafeDomId(catId)) : document.getElementById('procInvNewName');
  var groupEl = document.getElementById('procInvNewGroup');
  var name = ((nameEl && nameEl.value) || '').trim();
  var group = catId || ((groupEl && groupEl.value) || '').trim();
  if (!name) { showToast('Process subtype name is required.', true); if (nameEl) nameEl.focus(); return; }
  if (!group) { showToast('Select a process category.', true); return; }
  invApplyProcessTypeChange('add', name, group);
  if (nameEl) nameEl.value = '';
}

function invUpdateCustomProcessType(typeKey, label, categoryId) {
  if (typeof updateCustomProcessType !== 'function') return;
  var ok = updateCustomProcessType(typeKey, label, categoryId);
  if (!ok) { showToast('Could not update process subtype.', true); return; }
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('program', 'process-types', 'Custom process subtype updated (Reports process inventory): "' + label + '"');
  }
  markDirty();
  if (typeof refreshProcessTypeCatalogViews === 'function') refreshProcessTypeCatalogViews();
}

function _invRenderProcessSubtypeRow(row, coverage, categories) {
  var ctrlIds = coverage[row.key] || [];
  var procs = _invRegisteredProcessesForType(row.key);
  var safeKey = String(row.key).replace(/'/g, "\\'");
  var safeLabel = String(row.label).replace(/'/g, "\\'");
  var safeCatId = String(row.categoryId).replace(/'/g, "\\'");
  var catLabel = typeof getProcessCategoryLabel === 'function' ? getProcessCategoryLabel(row.categoryId) : row.categoryId;
  var nameCell = '<input type="text" class="form-input" style="font-size:12px;font-weight:600;" value="' + escapeHTML(row.label) + '" onchange="invRenameProcessSubtype(\'' + safeKey + '\',this.value,' + (row.isCustom ? 'true' : 'false') + ',\'' + safeCatId + '\')">';
  var catCell = row.isCustom
    ? '<select class="form-select" style="font-size:12px;" onchange="invUpdateCustomProcessType(\'' + safeKey + '\',\'' + safeLabel + '\',this.value)">'
      + categories.map(function(c) {
          return '<option value="' + escapeHTML(c.id) + '"' + (c.id === row.categoryId ? ' selected' : '') + '>' + escapeHTML(c.label) + '</option>';
        }).join('')
      + '</select>'
    : escapeHTML(catLabel);
  return '<tr data-category="' + escapeHTML(row.categoryId) + '" data-label="' + escapeHTML(row.label.toLowerCase()) + '">'
    + '<td>' + nameCell + (row.isCustom ? ' <span style="font-size:10px;color:#64748b;font-weight:400;">(custom)</span>' : ' <span style="font-size:10px;color:#64748b;font-weight:400;">(built-in)</span>') + '</td>'
    + '<td>' + catCell + '</td>'
    + '<td style="text-align:center;font-weight:700;color:' + (ctrlIds.length ? '#166534' : '#94a3b8') + ';">' + ctrlIds.length + '</td>'
    + '<td>' + _invControlBadgesHtml(ctrlIds) + '</td>'
    + '<td>' + _invRegisteredNamesCell(procs, 'None registered') + '</td>'
    + '<td><button type="button" class="btn btn-sm" style="font-size:10px;padding:3px 8px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;" onclick="invApplyProcessTypeChange(\'delete\',\'' + safeLabel + '\')">Remove</button></td>'
    + '</tr>';
}

function _invRegisteredAssetsForType(row) {
  var assets = state.assets || [];
  if (row.isCustom) {
    return assets.filter(function(a) { return String(a.type || '').trim() === row.label; });
  }
  return assets.filter(function(a) {
    if (typeof getAssetTypeKey === 'function') {
      var k = getAssetTypeKey(a.type);
      if (k === row.key) return true;
    }
    return String(a.type || '').trim() === row.label;
  });
}

function _invRegisteredProcessesForType(typeKey) {
  return (state.processes || []).filter(function(p) {
    return String(p.typeKey || '').trim() === typeKey;
  });
}

function _invRegisteredNamesCell(items, emptyLabel) {
  if (!items.length) return '<span style="color:#94a3b8;">' + (emptyLabel || 'None') + '</span>';
  var names = items.map(function(x) { return String(x.name || x.id || '—').trim() || '—'; });
  var preview = names.slice(0, 4).map(function(n) {
    return '<span style="display:inline-block;background:#f8fafc;border:1px solid var(--border);border-radius:4px;padding:1px 6px;margin:1px;font-size:11px;">' + escapeHTML(n) + '</span>';
  }).join('');
  if (names.length > 4) {
    preview += ' <span style="font-size:11px;color:var(--text-muted);">+' + (names.length - 4) + ' more</span>';
  }
  return '<div style="font-weight:600;margin-bottom:2px;">' + items.length + '</div>' + preview;
}

function _invAssetCategorySections() {
  if (typeof ensureAssetTypeMetadata === 'function') ensureAssetTypeMetadata();
  var sections = {};
  function ensureSection(name, isBuiltIn, isCustomHeader) {
    if (!sections[name]) {
      sections[name] = {
        name: name,
        displayName: typeof getAssetCategoryDisplayLabel === 'function' ? getAssetCategoryDisplayLabel(name) : name,
        isBuiltIn: !!isBuiltIn,
        isCustomHeader: !!isCustomHeader,
        types: []
      };
    }
  }
  if (typeof getActiveAssetTypeCatalog === 'function') {
    getActiveAssetTypeCatalog().forEach(function(cat) {
      if (cat.category === 'Process') return;
      ensureSection(cat.category, true, false);
      cat.types.forEach(function(t) {
        sections[cat.category].types.push({ key: t.key, label: t.label, category: cat.category, isCustom: false });
      });
    });
  }
  (state.customAssetTypes || []).forEach(function(name) {
    if (!name || !String(name).trim()) return;
    var group = ((state.customAssetTypeGroups || {})[name] || 'Custom').trim() || 'Custom';
    if (group === 'Process') return;
    ensureSection(group, false, (state.customAssetTypeHeaders || []).indexOf(group) !== -1);
    sections[group].types.push({ key: 'custom_' + name, label: name, category: group, isCustom: true });
  });
  (state.customAssetTypeHeaders || []).forEach(function(h) {
    if (!h || !String(h).trim() || h === 'Process') return;
    ensureSection(h, false, true);
  });
  return Object.keys(sections).sort().map(function(k) { return sections[k]; });
}

function _invRetiredAssetCategories() {
  return (state.removedBuiltInAssetTypeGroups || []).filter(function(g) { return g !== 'Process'; });
}

function _invRetiredBuiltInAssetTypes() {
  var retired = [];
  (state.removedBuiltInAssetTypeKeys || []).forEach(function(key) {
    ASSET_TYPES.forEach(function(cat) {
      if (cat.category === 'Process') return;
      cat.types.forEach(function(t) {
        if (t.key === key) retired.push({ key: t.key, label: t.label, category: cat.category });
      });
    });
  });
  return retired;
}

function invApplyAssetTypeChange(action, typeName, groupName) {
  if (typeof applyAssetTypeChangeDirect !== 'function') return;
  applyAssetTypeChangeDirect(action, typeName, '', groupName || 'Custom');
}

function invApplyAssetCategoryChange(action, categoryName) {
  if (typeof applyAssetTypeHeaderChangeDirect === 'function') {
    applyAssetTypeHeaderChangeDirect(action, categoryName);
  }
}

function invRestoreAssetCategory(categoryName) {
  if (typeof restoreAssetTypeCategoryDirect === 'function') restoreAssetTypeCategoryDirect(categoryName);
}

function invSubmitNewAssetCategoryFromReports() {
  var el = document.getElementById('assetInvNewCategory');
  var name = ((el && el.value) || '').trim();
  if (!name) { showToast('Category name is required.', true); if (el) el.focus(); return; }
  invApplyAssetCategoryChange('add', name);
  if (el) el.value = '';
}

function invSafeDomId(str) {
  return String(str || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function invSubmitNewAssetTypeFromReports(categoryName) {
  var cat = String(categoryName || '').trim();
  var nameEl = cat ? document.getElementById('assetInvSubtype_' + invSafeDomId(cat)) : document.getElementById('assetInvNewName');
  var groupEl = document.getElementById('assetInvNewGroup');
  var name = ((nameEl && nameEl.value) || '').trim();
  var group = cat || ((groupEl && groupEl.value) || 'Custom').trim() || 'Custom';
  if (!name) { showToast('Subtype name is required.', true); if (nameEl) nameEl.focus(); return; }
  invApplyAssetTypeChange('add', name, group);
  if (nameEl) nameEl.value = '';
}

function invRenameAssetCategory(canonicalName, newLabel) {
  if (typeof renameAssetCategory !== 'function') return;
  if (!renameAssetCategory(canonicalName, newLabel)) { showToast('Could not rename category.', true); return; }
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('program', 'asset-types', 'Asset category renamed to "' + newLabel + '" (Reports asset inventory)');
  }
  markDirty();
  if (typeof refreshAssetTypeCatalogViews === 'function') refreshAssetTypeCatalogViews();
}

function invRenameAssetSubtype(typeKey, oldLabel, newLabel, isCustom, categoryCanonical) {
  var clean = String(newLabel || '').trim();
  if (!clean || clean === oldLabel) return;
  var ok = typeof renameAssetTypeLabel === 'function'
    && renameAssetTypeLabel(isCustom ? oldLabel : typeKey, clean, isCustom);
  if (!ok) { showToast('Could not rename subtype.', true); return; }
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('program', 'asset-types', 'Asset subtype renamed to "' + clean + '" (Reports asset inventory)');
  }
  markDirty();
  if (typeof refreshAssetTypeCatalogViews === 'function') refreshAssetTypeCatalogViews();
}

function invRenameProcessCategory(categoryId, newLabel) {
  if (typeof renameProcessCategoryLabel !== 'function') return;
  if (!renameProcessCategoryLabel(categoryId, newLabel)) { showToast('Could not rename process category.', true); return; }
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('program', 'process-types', 'Process category renamed to "' + newLabel + '" (Reports process inventory)');
  }
  markDirty();
  if (typeof refreshProcessTypeCatalogViews === 'function') refreshProcessTypeCatalogViews();
}

function invRenameProcessSubtype(typeKey, newLabel, isCustom, categoryId) {
  var clean = String(newLabel || '').trim();
  if (!clean) return;
  var ok = typeof renameProcessTypeLabel === 'function'
    && renameProcessTypeLabel(typeKey, clean, isCustom);
  if (!ok) { showToast('Could not rename process subtype.', true); return; }
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('program', 'process-types', 'Process subtype renamed to "' + clean + '" (Reports process inventory)');
  }
  markDirty();
  if (typeof refreshProcessTypeCatalogViews === 'function') refreshProcessTypeCatalogViews();
}

function invChangeCustomAssetTypeGroup(typeName, groupName) {
  var name = String(typeName || '').trim();
  var group = String(groupName || 'Custom').trim() || 'Custom';
  if (!name) return;
  if (!state.customAssetTypeGroups) state.customAssetTypeGroups = {};
  state.customAssetTypeGroups[name] = group;
  markDirty();
  if (typeof addAuditEntry === 'function') {
    addAuditEntry('program', 'asset-types', 'Custom asset subtype "' + name + '" moved to category "' + group + '" (Reports asset inventory)');
  }
  setTimeout(function() { renderReportsLibraryShell(); }, 0);
}

function _invRenderAssetSubtypeRow(row, coverage, groups) {
  var ctrlIds = coverage[row.key] || [];
  var assets = _invRegisteredAssetsForType(row);
  var safeKey = String(row.key).replace(/'/g, "\\'");
  var safeLabel = String(row.label).replace(/'/g, "\\'");
  var safeGroup = String(row.category).replace(/'/g, "\\'");
  var catCell = row.isCustom
    ? '<select class="form-select" style="font-size:12px;" onchange="invChangeCustomAssetTypeGroup(\'' + safeLabel + '\',this.value)">'
      + groups.map(function(g) {
          var display = typeof getAssetCategoryDisplayLabel === 'function' ? getAssetCategoryDisplayLabel(g) : g;
          return '<option value="' + escapeHTML(g) + '"' + (g === row.category ? ' selected' : '') + '>' + escapeHTML(display) + '</option>';
        }).join('')
      + '</select>'
    : escapeHTML(typeof getAssetCategoryDisplayLabel === 'function' ? getAssetCategoryDisplayLabel(row.category) : row.category);
  var nameCell = row.isCustom
    ? '<input type="text" class="form-input" style="font-size:12px;font-weight:600;" value="' + escapeHTML(row.label) + '" onchange="invRenameAssetSubtype(\'' + safeKey + '\',\'' + safeLabel + '\',this.value,true,\'' + safeGroup + '\')">'
    : '<input type="text" class="form-input" style="font-size:12px;font-weight:600;" value="' + escapeHTML(row.label) + '" onchange="invRenameAssetSubtype(\'' + safeKey + '\',\'' + safeLabel + '\',this.value,false,\'' + safeGroup + '\')">';
  return '<tr data-category="' + escapeHTML(row.category) + '" data-label="' + escapeHTML(row.label.toLowerCase()) + '">'
    + '<td>' + nameCell + (row.isCustom ? ' <span style="font-size:10px;color:#64748b;font-weight:400;">(custom)</span>' : ' <span style="font-size:10px;color:#64748b;font-weight:400;">(built-in)</span>') + '</td>'
    + '<td>' + catCell + '</td>'
    + '<td style="text-align:center;font-weight:700;color:' + (ctrlIds.length ? '#166534' : '#94a3b8') + ';">' + ctrlIds.length + '</td>'
    + '<td>' + _invControlBadgesHtml(ctrlIds) + '</td>'
    + '<td>' + _invRegisteredNamesCell(assets, 'None registered') + '</td>'
    + '<td><button type="button" class="btn btn-sm" style="font-size:10px;padding:3px 8px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;" onclick="invApplyAssetTypeChange(\'delete\',\'' + safeLabel + '\',\'' + safeGroup + '\')">Remove</button></td>'
    + '</tr>';
}

function renderAssetTypesInventory(body) {
  if (!body) return;
  if (typeof ensureAssetTypeMetadata === 'function') ensureAssetTypeMetadata();
  var sections = _invAssetCategorySections();
  var coverage = _invBuildTypeCoverageIndex();
  var retiredCats = _invRetiredAssetCategories();
  var retiredTypes = _invRetiredBuiltInAssetTypes();
  var groups = (typeof getAllAssetTypeGroups === 'function') ? getAllAssetTypeGroups().filter(function(g) { return g !== 'Process'; }) : [];
  var subtypeCount = sections.reduce(function(n, s) { return n + s.types.length; }, 0);
  var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
    + '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:16px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Add category</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Creates a new section header in control design (e.g. Operational Technology).</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<input type="text" id="assetInvNewCategory" class="form-input" placeholder="Category name" style="font-size:12px;flex:1;min-width:160px;">'
    + '<button type="button" class="btn btn-primary btn-sm" onclick="invSubmitNewAssetCategoryFromReports()">+ Add category</button>'
    + '</div></div>'
    + '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:16px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Add subtype</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Adds an asset type under a category — appears in control design checkboxes.</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    + '<input type="text" id="assetInvNewName" class="form-input" placeholder="Subtype name (e.g. OT Device)" style="font-size:12px;flex:1;min-width:140px;">'
    + '<select id="assetInvNewGroup" class="form-select" style="font-size:12px;min-width:160px;">'
    + groups.map(function(g) {
        var display = typeof getAssetCategoryDisplayLabel === 'function' ? getAssetCategoryDisplayLabel(g) : g;
        return '<option value="' + escapeHTML(g) + '">' + escapeHTML(display) + '</option>';
      }).join('')
    + '</select>'
    + '<button type="button" class="btn btn-primary btn-sm" onclick="invSubmitNewAssetTypeFromReports()">+ Add subtype</button>'
    + '</div></div></div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
    + '<div style="font-size:12px;color:var(--text-muted);">' + sections.length + ' categories · ' + subtypeCount + ' subtypes · synced with control design</div>'
    + '<input type="text" id="assetInvSearch" placeholder="Search categories or subtypes…" oninput="filterAssetInvTable()" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;min-width:220px;">'
    + '</div>';

  if (!sections.length) {
    html += '<div class="empty-state" style="padding:24px;"><div class="es-title">No asset categories</div><p>Add a category above, then add subtypes under it.</p></div>';
  }

  sections.forEach(function(section) {
    var safeCat = String(section.name).replace(/'/g, "\\'");
    var domId = invSafeDomId(section.name);
    var badge = section.isBuiltIn
      ? '<span style="font-size:10px;font-weight:700;color:#1d4ed8;background:#eff6ff;padding:2px 7px;border-radius:6px;margin-left:8px;">Built-in</span>'
      : (section.isCustomHeader ? '<span style="font-size:10px;font-weight:700;color:#0f766e;background:#ecfdf5;padding:2px 7px;border-radius:6px;margin-left:8px;">Custom</span>' : '');
    html += '<div class="asset-inv-category" data-category="' + escapeHTML(section.displayName || section.name) + '" style="margin-bottom:18px;border:1px solid var(--border);border-radius:10px;overflow:hidden;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;background:#f8fafc;border-bottom:1px solid var(--border);flex-wrap:wrap;">'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
      + '<input type="text" class="form-input" style="font-size:14px;font-weight:800;color:var(--navy);min-width:180px;max-width:320px;" value="' + escapeHTML(section.displayName || section.name) + '" onchange="invRenameAssetCategory(\'' + safeCat + '\',this.value)" title="Rename category">'
      + badge
      + ' <span style="font-size:11px;font-weight:600;color:var(--text-muted);">' + section.types.length + ' subtype(s)</span></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
      + '<input type="text" id="assetInvSubtype_' + domId + '" class="form-input" placeholder="Add subtype…" style="font-size:11px;min-width:160px;padding:5px 8px;">'
      + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;" onclick="invSubmitNewAssetTypeFromReports(\'' + safeCat + '\')">+ Subtype</button>'
      + '<button type="button" class="btn btn-sm" style="font-size:10px;padding:4px 10px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;" onclick="invApplyAssetCategoryChange(\'delete\',\'' + safeCat + '\')">Remove category</button>'
      + '</div></div>';
    if (section.types.length) {
      html += '<div class="table-scroll"><table class="control-table asset-inv-subtype-table"><thead><tr>'
        + '<th>Subtype</th><th style="width:160px;">Category</th><th style="width:72px;text-align:center;">Controls</th><th>Scoped controls</th><th style="width:180px;">Registered assets</th><th style="width:88px;">Actions</th>'
        + '</tr></thead><tbody>'
        + section.types.map(function(row) { return _invRenderAssetSubtypeRow(row, coverage, groups); }).join('')
        + '</tbody></table></div>';
    } else {
      html += '<div style="padding:16px;font-size:12px;color:var(--text-muted);">No subtypes yet — use the field above to add one to this category.</div>';
    }
    html += '</div>';
  });

  if (retiredCats.length) {
    html += '<div style="margin-top:8px;border-top:1px dashed var(--border);padding-top:14px;">'
      + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">Retired categories (' + retiredCats.length + ')</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      + retiredCats.map(function(cat) {
          var safeCat = String(cat).replace(/'/g, "\\'");
          return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 10px;border:1px solid #fed7aa;border-radius:999px;background:#fff7ed;color:#9a3412;">'
            + escapeHTML(cat)
            + '<button type="button" style="border:none;background:none;color:#0369a1;cursor:pointer;font-size:11px;font-weight:700;" onclick="invRestoreAssetCategory(\'' + safeCat + '\')">Restore category</button>'
            + '</span>';
        }).join('')
      + '</div></div>';
  }

  if (retiredTypes.length) {
    html += '<div style="margin-top:14px;border-top:1px dashed var(--border);padding-top:14px;">'
      + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">Retired built-in subtypes (' + retiredTypes.length + ')</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Individual subtypes removed from the catalog. Restoring adds them back to control design.</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      + retiredTypes.map(function(item) {
          var safeLabel = String(item.label).replace(/'/g, "\\'");
          var safeGroup = String(item.category).replace(/'/g, "\\'");
          return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 10px;border:1px solid #fed7aa;border-radius:999px;background:#fff7ed;color:#9a3412;">'
            + escapeHTML(item.label)
            + ' <span style="color:#78716c;">(' + escapeHTML(item.category) + ')</span>'
            + '<button type="button" style="border:none;background:none;color:#0369a1;cursor:pointer;font-size:11px;font-weight:700;" onclick="invApplyAssetTypeChange(\'add\',\'' + safeLabel + '\',\'' + safeGroup + '\')">Restore</button>'
            + '</span>';
        }).join('')
      + '</div></div>';
  }

  html += '</div>';
  body.innerHTML = html;
}

function filterAssetInvTable() {
  var q = ((document.getElementById('assetInvSearch') || {}).value || '').toLowerCase();
  document.querySelectorAll('.asset-inv-category').forEach(function(block) {
    var catName = (block.getAttribute('data-category') || '').toLowerCase();
    var catMatch = !q || catName.indexOf(q) !== -1 || (block.textContent || '').toLowerCase().indexOf(q) !== -1;
    block.style.display = catMatch ? '' : 'none';
    if (!q) {
      block.querySelectorAll('.asset-inv-subtype-table tbody tr').forEach(function(tr) { tr.style.display = ''; });
      return;
    }
    var anyVisible = catName.indexOf(q) !== -1;
    block.querySelectorAll('.asset-inv-subtype-table tbody tr').forEach(function(tr) {
      var rowMatch = (tr.textContent || '').toLowerCase().indexOf(q) !== -1;
      tr.style.display = rowMatch ? '' : 'none';
      if (rowMatch) anyVisible = true;
    });
    block.style.display = anyVisible ? '' : 'none';
  });
}

function renderProcessTypesInventory(body) {
  if (!body) return;
  if (typeof ensureProcessTypeMetadata === 'function') ensureProcessTypeMetadata();
  var sections = _invProcessCategorySections();
  var coverage = _invBuildTypeCoverageIndex();
  var retiredCats = _invRetiredProcessCategories();
  var retiredTypes = _invRetiredProcessTypes();
  var categories = (typeof getActiveProcessCategories === 'function') ? getActiveProcessCategories() : [];
  var subtypeCount = sections.reduce(function(n, s) { return n + s.types.length; }, 0);
  var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
    + '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:16px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Add category</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Creates a process domain header (e.g. Privacy Operations).</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<input type="text" id="procInvNewCategory" class="form-input" placeholder="Category name" style="font-size:12px;flex:1;min-width:160px;">'
    + '<button type="button" class="btn btn-primary btn-sm" onclick="invSubmitNewProcessCategoryFromReports()">+ Add category</button>'
    + '</div></div>'
    + '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:16px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px;">Add subtype</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Adds a process type under a category — appears in control design checkboxes.</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    + '<input type="text" id="procInvNewName" class="form-input" placeholder="Subtype name" style="font-size:12px;flex:1;min-width:140px;">'
    + '<select id="procInvNewGroup" class="form-select" style="font-size:12px;min-width:160px;">'
    + categories.map(function(c) { return '<option value="' + escapeHTML(c.id) + '">' + escapeHTML(c.label) + '</option>'; }).join('')
    + '</select>'
    + '<button type="button" class="btn btn-primary btn-sm" onclick="invSubmitNewProcessTypeFromReports()">+ Add subtype</button>'
    + '</div></div></div>'
    + '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
    + '<div style="font-size:12px;color:var(--text-muted);">' + sections.length + ' categories · ' + subtypeCount + ' subtypes · synced with control design</div>'
    + '<input type="text" id="procInvSearch" placeholder="Search categories or subtypes…" oninput="filterProcInvTable()" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;min-width:220px;">'
    + '</div>';

  if (!sections.length) {
    html += '<div class="empty-state" style="padding:24px;"><div class="es-title">No process categories</div><p>Add a category above, then add subtypes under it.</p></div>';
  }

  sections.forEach(function(section) {
    var safeCatId = String(section.id).replace(/'/g, "\\'");
    var domId = invSafeDomId(section.id);
    var badge = section.isBuiltIn
      ? '<span style="font-size:10px;font-weight:700;color:#1d4ed8;background:#eff6ff;padding:2px 7px;border-radius:6px;margin-left:8px;">Built-in</span>'
      : '<span style="font-size:10px;font-weight:700;color:#0f766e;background:#ecfdf5;padding:2px 7px;border-radius:6px;margin-left:8px;">Custom</span>';
    html += '<div class="proc-inv-category" data-category="' + escapeHTML(section.label) + '" data-category-id="' + escapeHTML(section.id) + '" style="margin-bottom:18px;border:1px solid var(--border);border-radius:10px;overflow:hidden;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;background:#f8fafc;border-bottom:1px solid var(--border);flex-wrap:wrap;">'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
      + '<input type="text" class="form-input" style="font-size:14px;font-weight:800;color:var(--navy);min-width:180px;max-width:320px;" value="' + escapeHTML(section.label) + '" onchange="invRenameProcessCategory(\'' + safeCatId + '\',this.value)" title="Rename category">'
      + badge
      + ' <span style="font-size:11px;font-weight:600;color:var(--text-muted);">' + section.types.length + ' subtype(s)</span></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
      + '<input type="text" id="procInvSubtype_' + domId + '" class="form-input" placeholder="Add subtype…" style="font-size:11px;min-width:160px;padding:5px 8px;">'
      + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;" onclick="invSubmitNewProcessTypeFromReports(\'' + safeCatId + '\')">+ Subtype</button>'
      + '<button type="button" class="btn btn-sm" style="font-size:10px;padding:4px 10px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;" onclick="invApplyProcessCategoryChange(\'delete\',\'' + safeCatId + '\')">Remove category</button>'
      + '</div></div>';
    if (section.types.length) {
      html += '<div class="table-scroll"><table class="control-table proc-inv-subtype-table"><thead><tr>'
        + '<th>Subtype</th><th style="width:180px;">Category</th><th style="width:72px;text-align:center;">Controls</th><th>Scoped controls</th><th style="width:180px;">Registered processes</th><th style="width:88px;">Actions</th>'
        + '</tr></thead><tbody>'
        + section.types.map(function(row) { return _invRenderProcessSubtypeRow(row, coverage, categories); }).join('')
        + '</tbody></table></div>';
    } else {
      html += '<div style="padding:16px;font-size:12px;color:var(--text-muted);">No subtypes yet — use the field above to add one to this category.</div>';
    }
    html += '</div>';
  });

  if (retiredCats.length) {
    html += '<div style="margin-top:8px;border-top:1px dashed var(--border);padding-top:14px;">'
      + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">Retired categories (' + retiredCats.length + ')</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      + retiredCats.map(function(cat) {
          var safeId = String(cat.id).replace(/'/g, "\\'");
          return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 10px;border:1px solid #fed7aa;border-radius:999px;background:#fff7ed;color:#9a3412;">'
            + escapeHTML(cat.label)
            + '<button type="button" style="border:none;background:none;color:#0369a1;cursor:pointer;font-size:11px;font-weight:700;" onclick="invRestoreProcessCategory(\'' + safeId + '\')">Restore category</button>'
            + '</span>';
        }).join('')
      + '</div></div>';
  }

  if (retiredTypes.length) {
    html += '<div style="margin-top:14px;border-top:1px dashed var(--border);padding-top:14px;">'
      + '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px;">Retired built-in subtypes (' + retiredTypes.length + ')</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      + retiredTypes.map(function(item) {
          var safeLabel = String(item.label).replace(/'/g, "\\'");
          return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 10px;border:1px solid #fed7aa;border-radius:999px;background:#fff7ed;color:#9a3412;">'
            + escapeHTML(item.label)
            + '<button type="button" style="border:none;background:none;color:#0369a1;cursor:pointer;font-size:11px;font-weight:700;" onclick="invApplyProcessTypeChange(\'add\',\'' + safeLabel + '\',\'' + String(item.categoryId).replace(/'/g, "\\'") + '\')">Restore</button>'
            + '</span>';
        }).join('')
      + '</div></div>';
  }

  html += '</div>';
  body.innerHTML = html;
}

function filterProcInvTable() {
  var q = ((document.getElementById('procInvSearch') || {}).value || '').toLowerCase();
  document.querySelectorAll('.proc-inv-category').forEach(function(block) {
    var catName = (block.getAttribute('data-category') || '').toLowerCase();
    var anyVisible = !q || catName.indexOf(q) !== -1;
    if (!q) {
      block.style.display = '';
      block.querySelectorAll('.proc-inv-subtype-table tbody tr').forEach(function(tr) { tr.style.display = ''; });
      return;
    }
    block.querySelectorAll('.proc-inv-subtype-table tbody tr').forEach(function(tr) {
      var rowMatch = (tr.textContent || '').toLowerCase().indexOf(q) !== -1;
      tr.style.display = rowMatch ? '' : 'none';
      if (rowMatch) anyVisible = true;
    });
    block.style.display = anyVisible ? '' : 'none';
  });
}

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
  const canDecide = typeof canSessionApproveDomainPolicy === 'function' && canSessionApproveDomainPolicy(fam);
  const pendingApprover = typeof getDomainDesignatedApproverName === 'function' ? getDomainDesignatedApproverName(fam) : getPolicyPendingReviewerDisplay(fam);
  const sodBlocked = !canDecide && typeof domainPolicyApproverViolatesSeparationOfDuties === 'function'
    && domainPolicyApproverViolatesSeparationOfDuties(fam, typeof getSessionEmailForApproval === 'function' ? getSessionEmailForApproval() : '', '');

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
        ${canDecide ? `
        <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:10px;">Review Notes</div>
        <textarea id="cisoReviewNotes" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:12px;font-size:13px;resize:vertical;min-height:80px;font-family:inherit;" placeholder="Add your review notes here — required when returning to submitter, optional when approving…"></textarea>
        <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
          <button onclick="document.getElementById('cisoReviewOverlay').remove()" style="padding:10px 20px;border:1px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:var(--text-muted);">Cancel</button>
          <button onclick="cisoReturnPolicy('${fam}')" style="padding:10px 20px;border:1px solid rgba(239,68,68,0.4);border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:var(--red);">↩ Return to ${escapeHTML(owner.name||'Submitter')}</button>
          <button onclick="cisoApprovePolicy('${fam}')" style="padding:10px 20px;border:none;border-radius:8px;background:var(--teal);cursor:pointer;font-size:13px;font-weight:700;color:white;">✓ Approve Policy</button>
        </div>` : `
        <div style="font-size:13px;color:var(--text-muted);line-height:1.6;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:14px 16px;">
          This policy is awaiting approval from <strong>${escapeHTML(pendingApprover || 'the designated approver')}</strong>.
          ${sodBlocked
            ? ' You drafted this policy — a different person must approve it (separation of duties).'
            : ' Only the designated approver can sign off from this screen.'}
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
          <button onclick="document.getElementById('cisoReviewOverlay').remove()" style="padding:10px 20px;border:1px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:var(--text-muted);">Close</button>
        </div>`}
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
      else content = sec.content||'';
      if (!content) return;
      hasSections = true;
      sectionsHTML += '<div style="margin-bottom:20px;">'
        + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">' + escapeHTML(sec.title||sec.type) + '</div>'
        + '<div style="font-size:13px;color:var(--navy);line-height:1.7;white-space:pre-wrap;">' + escapeHTML(content) + '</div>'
        + '</div>';
    });
    if (!hasSections) {
      [['Purpose', isp.purpose||''], ['Scope', isp.scope||''], ['Policy Statement', isp.policy||'']].forEach(function(pair) {
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
            + (d.url && safeUrl(d.url) ? '<div style="font-size:12px;margin-top:2px;"><a href="' + escapeHTML(safeUrl(d.url)) + '" target="_blank" rel="noopener noreferrer" style="color:var(--teal);text-decoration:none;">' + escapeHTML(d.url) + '</a></div>' : (d.url ? '<div style="font-size:12px;margin-top:2px;color:var(--text-muted);">' + escapeHTML(d.url) + '</div>' : ''))
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
  if (typeof canSessionApproveDomainPolicy === 'function' && !canSessionApproveDomainPolicy(fam)) {
    showToast('Only the designated approver can approve this policy. The drafter cannot approve their own work (separation of duties).', true);
    return;
  }
  if (!state.policyStatus) state.policyStatus = {};
  const notes = document.getElementById('cisoReviewNotes')?.value.trim() || '';
  var approverTitle = typeof getDomainDesignatedApproverName === 'function'
    ? getDomainDesignatedApproverName(fam) : (state.programOwnerTitle || 'CISO');
  var actorName = typeof getSessionActorName === 'function'
    ? getSessionActorName(approverTitle) : approverTitle;
  var prev = state.policyStatus[fam] || {};
  state.policyStatus[fam] = {
    status: 'Approved',
    approvedBy: actorName || approverTitle,
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
  state.domainPolicies[fam].revisionHistory.push({ version: '1.0', date: new Date().toISOString().slice(0,10), author: actorName||approverTitle, changes: 'Approved by ' + (actorName||approverTitle) + '.' + (notes ? ' Notes: ' + notes : '') });
  markDirty();
  document.getElementById('cisoReviewOverlay')?.remove();
  showToast('✅ Policy approved — ' + getPolicyMergedTitle(fam));
  if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
    cloudPushNow().finally(renderReports);
  } else {
    renderReports();
  }
}

function cisoReturnPolicy(fam) {
  if (typeof canSessionApproveDomainPolicy === 'function' && !canSessionApproveDomainPolicy(fam)) {
    showToast('Only the designated approver can return this policy for revision.', true);
    return;
  }
  const notes = document.getElementById('cisoReviewNotes')?.value.trim() || '';
  if (!notes) { showToast('Please add review notes before returning the policy.', true); return; }
  if (!state.policyStatus) state.policyStatus = {};
  var prevR = state.policyStatus[fam] || {};
  var revisee = typeof resolveEffectiveDomainOwner === 'function'
    ? resolveEffectiveDomainOwner(fam)
    : ((state.domainOwners || {})[fam] || {});
  // Keep roster row when program owner also owns domain policies (common small-team setup).
  if (state.cisoIsISSM && typeof isValidOwnerEmail === 'function' && isValidOwnerEmail(state.programOwnerEmail)) {
    if (!state.domainOwners) state.domainOwners = {};
    if (!isValidOwnerEmail((state.domainOwners[fam] || {}).email)) {
      state.domainOwners[fam] = {
        name: (state.programOwner || '').trim(),
        email: (state.programOwnerEmail || '').trim(),
        role: (state.programOwnerTitle || '').trim() || 'Program Owner'
      };
      var merges = state.policyMerges || {};
      if (typeof getActiveFamilies === 'function') {
        getActiveFamilies().filter(function(f) { return merges[f] === fam; }).forEach(function(mf) {
          state.domainOwners[mf] = Object.assign({}, state.domainOwners[fam]);
        });
      }
      revisee = state.domainOwners[fam];
    }
  }
  var retBy = typeof getSessionActorName === 'function'
    ? getSessionActorName(typeof getDomainDesignatedApproverName === 'function' ? getDomainDesignatedApproverName(fam) : (state.programOwner || 'CISO'))
    : (state.programOwner || (state.programOwnerTitle || 'CISO'));
  state.policyStatus[fam] = {
    status: 'Returned',
    returnedForRevision: true,
    returnedDate: new Date().toISOString().slice(0, 10),
    returnedBy: retBy,
    notes: notes,
    submittedAt: prevR.submittedAt || '',
    submittedTo: (revisee.name || '').trim() || prevR.submittedTo || '',
    submittedToRole: (revisee.role || '').trim() || prevR.submittedToRole || '',
    submittedToEmail: (revisee.email || '').trim() || prevR.submittedToEmail || ''
  };
  if (!state.domainPolicies) state.domainPolicies = {};
  if (!state.domainPolicies[fam]) state.domainPolicies[fam] = {};
  if (!state.domainPolicies[fam].revisionHistory) state.domainPolicies[fam].revisionHistory = [];
  state.domainPolicies[fam].revisionHistory.push({ version: 'R', date: new Date().toISOString().slice(0,10), author: state.programOwner||(state.programOwnerTitle||'CISO'), changes: 'Returned for revision by ' + (state.programOwnerTitle||'CISO') + '. Notes: ' + notes });
  markDirty();
  document.getElementById('cisoReviewOverlay')?.remove();
  showToast('↩ Policy returned to submitter — ' + getPolicyMergedTitle(fam));
  if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
    cloudPushNow().finally(renderReports);
  } else {
    renderReports();
  }
}

// ─── TEAM WORKLOAD PANEL ─────────────────────────────────────────────────────
// Program-owner view: everything assigned, by person — policies owned, control
// design progress, pending reviews, and open risks/issues. Answers "who is doing
// what and how far along are they" without opening each workspace.
function renderTeamWorkloadPanelHtml(controls, families) {
  try {
    var people = {};
    var nameIndex = {}; // normalized name -> people key (merges roster + assignment records)
    function normName(n) { return String(n || '').trim().toLowerCase(); }
    function normEmail(e) { return String(e || '').trim().toLowerCase(); }
    function getPerson(name, email, role) {
      var e = normEmail(email), n = normName(name);
      if (!e && !n) return null;
      var key = e ? 'e:' + e : 'n:' + n;
      if (!people[key] && n && nameIndex[n]) key = nameIndex[n];
      if (!people[key]) {
        people[key] = {
          name: String(name || '').trim(), email: String(email || '').trim(), role: String(role || '').trim(),
          polOwned: 0, polApproved: 0, polInReview: 0, polReturned: 0, polOther: 0,
          ctrlTotal: 0, ctrlDesigned: 0, ctrlImplemented: 0, ctrlInProgress: 0,
          reviews: [], sspOwned: 0, sspSubmitted: 0, openIssues: 0, openRisks: 0
        };
      }
      var p = people[key];
      if (!p.name && name) p.name = String(name).trim();
      if (!p.email && email) p.email = String(email).trim();
      if (!p.role && role) p.role = String(role).trim();
      if (n && !nameIndex[n]) nameIndex[n] = key;
      return p;
    }

    (state.users || []).forEach(function(u) { getPerson(u.name, u.email, u.role); });

    // Policies — count per merge-target family (one card per policy document).
    var mergedAway = state.policyMerges || {};
    var policyFams = (families || []).filter(function(f) { return f !== 'PM' && !mergedAway[f]; });
    var polUnassigned = 0;
    policyFams.forEach(function(f) {
      var o = (state.domainOwners || {})[f] || {};
      var st = ((state.policyStatus || {})[f] || {}).status || 'Not Started';
      var p = getPerson(o.name, o.email, o.role || 'Policy owner');
      if (!p) { polUnassigned++; return; }
      p.polOwned++;
      if (st === 'Approved') p.polApproved++;
      else if (st === 'Under Review') p.polInReview++;
      else if (st === 'Returned') p.polReturned++;
      else p.polOther++;
    });

    // Policies waiting on a reviewer (incl. ISP), attributed to that reviewer.
    var reviewFams = policyFams.slice();
    if ((state.policyStatus || {}).ISP) reviewFams.push('ISP');
    reviewFams.forEach(function(f) {
      var ps = (state.policyStatus || {})[f] || {};
      if (ps.status !== 'Under Review') return;
      var p = getPerson(ps.submittedTo, ps.submittedToEmail, ps.submittedToRole);
      if (p) p.reviews.push((f === 'ISP' ? 'ISP' : 'Policy ' + f) + ' approval');
    });

    // Controls — owner assignment, design + implementation progress.
    var ctrlUnassigned = 0;
    (controls || []).forEach(function(c) {
      var o = (state.controlOwners || {})[c.id];
      var cs = (state.controlStatus || {})[c.id] || {};
      if (cs.status === 'Not Applicable') return;
      var p = o ? getPerson(o.name, o.email, o.role || 'Control owner') : null;
      if (!p) { ctrlUnassigned++; return; }
      p.ctrlTotal++;
      if (typeof isControlDesigned === 'function' && isControlDesigned(c.id)) p.ctrlDesigned++;
      if (cs.status === 'Implemented') p.ctrlImplemented++;
      else if (cs.status === 'In Progress') p.ctrlInProgress++;
    });

    // Control-design packages sitting in someone's review queue.
    (state.controlReviewQueue || []).forEach(function(r) {
      if (!r || r.type === 'baseline-elevation' || r.type === 'ssp') return;
      var p = getPerson(r.reviewerName || r.policyOwner, r.reviewerEmail || r.policyOwnerEmail, '');
      if (p) p.reviews.push('Control design ' + (r.controlId || ''));
    });

    // SSP scopes — owners plus packages awaiting a designated reviewer.
    var scopes = (state.assets || []).concat(state.processes || []);
    scopes.forEach(function(s) {
      var sg = (state.sspSignoffs || {})[s.id] || {};
      var p = getPerson(s.owner, s.ownerEmail, 'Asset owner');
      if (p) {
        p.sspOwned++;
        if (sg.status === 'Submitted' || sg.status === 'Approved') p.sspSubmitted++;
      }
      if (sg.status === 'Submitted') {
        var rev = getPerson(sg.reviewerName, sg.reviewerEmail, sg.reviewerRole);
        if (rev) rev.reviews.push('SSP review: ' + (s.name || s.id));
      }
    });

    // Open remediation issues and risks.
    (state.issues || []).forEach(function(i) {
      if (typeof issueIsOpen === 'function' && !issueIsOpen(i)) return;
      var p = getPerson(i.assigneeName, i.assigneeEmail, '');
      if (p) p.openIssues++;
    });
    (state.risks || []).forEach(function(r) {
      if (r && (r.status === 'Closed' || r.status === 'Accepted')) return;
      var p = getPerson(r.ownerName, r.ownerEmail, '');
      if (p) p.openRisks++;
    });

    var rows = Object.keys(people).map(function(k) { return people[k]; }).filter(function(p) {
      return p.name && (p.polOwned || p.ctrlTotal || p.reviews.length || p.sspOwned || p.openIssues || p.openRisks || p.role);
    });
    if (!rows.length && !polUnassigned && !ctrlUnassigned) return '';

    rows.sort(function(a, b) {
      var wa = a.reviews.length * 3 + a.polOwned + a.ctrlTotal + a.openIssues + a.openRisks;
      var wb = b.reviews.length * 3 + b.polOwned + b.ctrlTotal + b.openIssues + b.openRisks;
      return wb - wa;
    });

    var ROLE_LABELS = {
      'ciso': 'CISO / Program owner', 'issm': 'ISSM', 'control-owner': 'Control owner',
      'asset-owner': 'Asset owner', 'custodian': 'Custodian', 'assessor': 'Assessor',
      'ao': 'Authorizing Official', 'approver': 'Policy approver', 'admin': 'Admin'
    };
    function chip(text, fg, bg) {
      return '<span style="display:inline-block;font-size:11px;font-weight:600;color:' + fg + ';background:' + bg + ';border-radius:10px;padding:2px 8px;margin:1px 2px 1px 0;white-space:nowrap;">' + text + '</span>';
    }
    function miniBar(done, total, color) {
      var pct = total ? Math.round(done / total * 100) : 0;
      return '<div style="display:flex;align-items:center;gap:8px;min-width:130px;">'
        + '<div style="flex:1;height:6px;background:rgba(15,31,61,0.07);border-radius:3px;overflow:hidden;">'
        + '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:3px;"></div></div>'
        + '<span style="font-size:11px;font-weight:700;color:var(--navy);white-space:nowrap;">' + done + '/' + total + '</span></div>';
    }

    var bodyRows = rows.map(function(p) {
      var roleLabel = ROLE_LABELS[p.role] || (p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : '—');
      var polCell = p.polOwned
        ? '<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:3px;">' + p.polOwned + ' polic' + (p.polOwned === 1 ? 'y' : 'ies') + '</div>'
          + chip(p.polApproved + ' approved', '#166534', '#dcfce7')
          + (p.polInReview ? chip(p.polInReview + ' in review', '#92400e', '#fef3c7') : '')
          + (p.polReturned ? chip(p.polReturned + ' returned', '#9a3412', '#ffedd5') : '')
          + (p.polOther ? chip(p.polOther + ' not started', '#475569', '#f1f5f9') : '')
        : '<span style="font-size:11px;color:var(--text-muted);">—</span>';
      var ctrlCell = p.ctrlTotal
        ? '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">designed</div>' + miniBar(p.ctrlDesigned, p.ctrlTotal, 'var(--teal)')
          + (p.ctrlImplemented || p.ctrlInProgress
              ? '<div style="margin-top:4px;">' + (p.ctrlImplemented ? chip(p.ctrlImplemented + ' implemented', '#166534', '#dcfce7') : '') + (p.ctrlInProgress ? chip(p.ctrlInProgress + ' in progress', '#1d4ed8', '#dbeafe') : '') + '</div>'
              : '')
        : '<span style="font-size:11px;color:var(--text-muted);">—</span>';
      var revCell = p.reviews.length
        ? '<div style="font-size:12px;font-weight:700;color:#b45309;margin-bottom:3px;">' + p.reviews.length + ' waiting</div>'
          + p.reviews.slice(0, 4).map(function(r) { return '<div style="font-size:11px;color:#92400e;line-height:1.5;">• ' + escapeHTML(r) + '</div>'; }).join('')
          + (p.reviews.length > 4 ? '<div style="font-size:11px;color:var(--text-muted);">+' + (p.reviews.length - 4) + ' more</div>' : '')
        : '<span style="font-size:11px;color:var(--text-muted);">—</span>';
      var sspCell = p.sspOwned
        ? '<div style="font-size:12px;font-weight:700;color:var(--navy);">' + p.sspSubmitted + '/' + p.sspOwned + ' submitted</div>'
        : '<span style="font-size:11px;color:var(--text-muted);">—</span>';
      var riCell = (p.openIssues || p.openRisks)
        ? (p.openIssues ? chip(p.openIssues + ' issue' + (p.openIssues === 1 ? '' : 's'), '#9a3412', '#ffedd5') : '')
          + (p.openRisks ? chip(p.openRisks + ' risk' + (p.openRisks === 1 ? '' : 's'), '#991b1b', '#fee2e2') : '')
        : '<span style="font-size:11px;color:var(--text-muted);">—</span>';
      return '<tr style="border-bottom:1px solid var(--border);vertical-align:top;">'
        + '<td style="padding:12px 10px 12px 0;min-width:150px;">'
        + '<div style="font-size:13px;font-weight:700;color:var(--navy);">' + escapeHTML(p.name) + '</div>'
        + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + escapeHTML(roleLabel) + '</div>'
        + (p.email ? '<div style="font-size:10px;color:var(--text-muted);margin-top:1px;">' + escapeHTML(p.email) + '</div>' : '')
        + '</td>'
        + '<td style="padding:12px 10px;">' + polCell + '</td>'
        + '<td style="padding:12px 10px;">' + ctrlCell + '</td>'
        + '<td style="padding:12px 10px;">' + revCell + '</td>'
        + '<td style="padding:12px 10px;">' + sspCell + '</td>'
        + '<td style="padding:12px 0 12px 10px;">' + riCell + '</td>'
        + '</tr>';
    }).join('');

    var unassignedNote = (polUnassigned || ctrlUnassigned)
      ? '<div style="margin-top:10px;font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;">'
        + '<strong>Unassigned:</strong> '
        + (polUnassigned ? polUnassigned + ' polic' + (polUnassigned === 1 ? 'y' : 'ies') : '')
        + (polUnassigned && ctrlUnassigned ? ' · ' : '')
        + (ctrlUnassigned ? ctrlUnassigned + ' control' + (ctrlUnassigned === 1 ? '' : 's') : '')
        + ' with no owner yet — assign them in Program Setup or Domain Policies.</div>'
      : '';

    return '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:18px;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
      + '<span style="font-size:15px;">👥</span>'
      + '<span style="font-size:14px;font-weight:700;color:var(--navy);">Team workload</span>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">Everything assigned, by person — policy ownership, control design progress, pending reviews, and open risks &amp; issues.</div>'
      + '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">'
      + '<thead><tr style="border-bottom:2px solid var(--border);">'
      + '<th style="text-align:left;font-size:10px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);padding:0 10px 8px 0;">Person</th>'
      + '<th style="text-align:left;font-size:10px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);padding:0 10px 8px;">Policies</th>'
      + '<th style="text-align:left;font-size:10px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);padding:0 10px 8px;">Controls</th>'
      + '<th style="text-align:left;font-size:10px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);padding:0 10px 8px;">In their review queue</th>'
      + '<th style="text-align:left;font-size:10px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);padding:0 10px 8px;">SSP scopes</th>'
      + '<th style="text-align:left;font-size:10px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);padding:0 0 8px 10px;">Risks &amp; issues</th>'
      + '</tr></thead><tbody>' + bodyRows + '</tbody></table></div>'
      + unassignedNote
      + '</div>';
  } catch (e) {
    return '';
  }
}

function renderProgramDashboard(controls, families) {
  const baseline    = state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High';
  const privSuffix  = state.privacyOverlay ? ' + Privacy' : '';
  const policyFams  = families.filter(f => f !== 'PM');

  // ── Control count source of truth for this dashboard ──
  // Use the same in-memory control set that drives the detailed reporting cards.
  // This keeps top-level tallies and lower metrics in sync.
  const authCount   = controls.length;

  // ── Policy stats ──
  const polApproved   = policyFams.filter(f => (state.policyStatus[f]||{}).status === 'Approved').length;
  const polInReview = policyFams.filter(function(f) {
    var ps = (state.policyStatus[f] || {});
    if (ps.status === 'Under Review') return true;
    if (ps.status !== 'Returned') return false;
    if (ps.returnedForRevision) return false;
    if (ps.returnedForReassignment) return true;
    // Legacy returned items explicitly routed back to CISO/program owner for reassignment.
    var routedTo = String(ps.submittedTo || '').trim().toLowerCase();
    var cisoName = String(state.programOwner || '').trim().toLowerCase();
    return !routedTo || (cisoName && routedTo === cisoName);
  });
  const polDraft      = policyFams.filter(f => (state.policyStatus[f]||{}).status === 'Draft').length;
  const polReturned   = policyFams.filter(f => (state.policyStatus[f]||{}).status === 'Returned').length;
  const polNotStarted = policyFams.filter(f => !['Approved','Under Review','Draft','Returned'].includes((state.policyStatus[f]||{}).status)).length;
  const polPct        = policyFams.length ? Math.round((polApproved/policyFams.length)*100) : 0;

  // ── Control stats ──
  // Use the same scoped control set used across the reports tab.
  const ctrlTotal       = authCount;
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
    const isReturnedToCiso = p.status === 'Returned' && !!p.returnedForReassignment;
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
          : ((typeof canSessionApproveDomainPolicy === 'function' && canSessionApproveDomainPolicy(fam))
              ? '<button class="btn btn-secondary btn-sm" onclick="openCISOReview(\'' + fam + '\')">Review →</button>'
              : '<span style="font-size:11px;color:var(--text-muted);font-style:italic;">Awaiting designated approver</span>'))
      + '</div>';
  }).join('');

  const deselectBaselineDash = controls.filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    if (cs.deselectDecision !== 'Approved') return false;
    var inBl = c.bl && (c.bl.indexOf(state.baseline) !== -1 || (state.privacyOverlay && c.bl.indexOf('P') !== -1));
    return inBl;
  }).length;

  return `
    ${deselectBaselineDash ? '<div class="callout-deselected-baseline" style="border:1px solid #f59e0b;background:#fffbeb;border-radius:10px;padding:12px 18px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.5;"><strong>Baseline scope note:</strong> ' + deselectBaselineDash + ' control(s) are formally <em>de-selected</em> from the active baseline. They remain in the catalog for audit traceability — open the Control Library and filter <strong>De-selected (baseline)</strong> to review them.</div>' : ''}

    ${typeof renderBaselineElevationReportsSummaryHtml === 'function' ? renderBaselineElevationReportsSummaryHtml() : ''}
    ${typeof renderBaselineElevationCisoCardsHtml === 'function' ? renderBaselineElevationCisoCardsHtml() : ''}
    ${typeof renderFrameworkDashboardStripHtml === 'function' ? renderFrameworkDashboardStripHtml() : ''}

    ${polInReview.length ? `
    <!-- Awaiting Your Approval — only rendered when something actually needs sign-off -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:14px;font-weight:700;color:var(--navy);">Awaiting your approval</span>
        <span style="background:var(--red);color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:10px;">${polInReview.length}</span>
      </div>
      ${awaitingHTML}
    </div>` : ''}

    ${renderTeamWorkloadPanelHtml(controls, families)}

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
  if (typeof openAssignDomainPolicyOwnerModal === 'function') {
    openAssignDomainPolicyOwnerModal(fam);
    return;
  }
  var canReassign = typeof canReassignProgramWork === 'function'
    ? canReassignProgramWork()
    : (!state.currentUserId || ((state.users || []).find(function(u){ return u.id === state.currentUserId; }) || {}).role === 'ciso');
  if (!canReassign) {
    showToast('Only the CISO or program owner can reassign returned policies.', true);
    return;
  }
  showToast('Assignment modal is unavailable. Open Program Setup to reassign.', true);
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
  if (typeof renderReturnedSspWorkCallout === 'function') {
    return renderReturnedSspWorkCallout(user);
  }
  return '';
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
                 : isRet ? 'Returned for revision'
                 : signRaw.status === 'Submitted' ? 'Submitted'
                 : done > 0 ? 'In Progress' : 'Not Started';
    var col      = status === 'Approved'  ? 'var(--green)'
                 : isRet ? '#c2410c'
                 : status === 'Submitted' ? 'var(--blue)'
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
  // Only the session that can actually approve sees the "Review & approve" CTA.
  // The ISP must be approved by someone other than the program owner (SoD), so a
  // raw !currentUserId / role==ciso fallback would show the owner a CTA they
  // cannot act on.
  return typeof canSessionApproveISP === 'function' && canSessionApproveISP();
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
    + '<button type="button" class="btn btn-primary btn-sm" onclick="goToCISOPolicyEditor();">Review & approve →</button>'
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

  // Pending review count (SSP packages + control design queue)
  var pendingReview = 0;
  if (typeof getSspReviewQueueItemsForUser === 'function') {
    pendingReview += getSspReviewQueueItemsForUser(user).length;
  }
  if (user.role === 'issm' || user.role === 'ciso') {
    pendingReview += (state.controlReviewQueue||[]).filter(function(r) {
      if (!r || r.type === 'ssp' || r.type === 'baseline-elevation') return false;
      if (user.role !== 'issm') return true;
      var fam = (r.controlId||'').replace(/-.*/, '');
      return (user.families||[]).includes(fam);
    }).length;
  } else if (user.role !== 'ao' && user.role !== 'approver' && user.role !== 'asset-owner') {
    pendingReview += (state.controlReviewQueue||[]).filter(function(r) {
      return r && r.type !== 'ssp' && r.type !== 'baseline-elevation' && typeof controlDesignQueueMatchesReviewer === 'function' && controlDesignQueueMatchesReviewer(r);
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
  if (typeof canSessionApproveISP === 'function' && !canSessionApproveISP()) {
    var approverEmail = typeof getISPDesignatedApproverEmail === 'function' ? getISPDesignatedApproverEmail() : '';
    var msg = approverEmail
      ? 'Only the designated ISP approver (' + approverEmail + ') can approve this policy. Sign in with that account.'
      : 'Only the designated ISP approver can approve this policy.';
    showToast(msg, true);
    return;
  }
  var notes = (document.getElementById('isp-approver-notes') || {}).value || '';
  if (!state.policyStatus) state.policyStatus = {};
  if (!state.policyReviewCycle) state.policyReviewCycle = {};
  var rc = state.policyReviewCycle.ISP || (state.policyReviewCycle.ISP = {});
  var prev = state.policyStatus.ISP || {};
  var approverUser = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  var approverName = approverUser ? approverUser.name : (typeof getSessionActorName === 'function' ? getSessionActorName(rc.approvedBy || 'Approver') : (rc.approvedBy || 'Approver'));
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
  if (typeof ensureIspTierControlOwners === 'function') ensureIspTierControlOwners();
  markDirty();
  try { if (typeof saveToStorage === 'function') saveToStorage(); } catch (e) { /* ignore */ }
  var approvedTitle = ((state.infoSecPolicy && state.infoSecPolicy.title) ? String(state.infoSecPolicy.title).trim() : '') || (typeof getDefaultISPTitle === 'function' ? getDefaultISPTitle() : 'Information Security Policy');
  showToast('\u2705 ' + approvedTitle + ' approved.');
  var afterApprove = function() {
    if (typeof exitISPPolicyViewer === 'function') exitISPPolicyViewer();
    else showTab('reports');
  };
  if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
    cloudPushNow().finally(afterApprove);
  } else {
    afterApprove();
  }
}

function returnISPToEditor() {
  if (typeof canSessionApproveISP === 'function' && !canSessionApproveISP()) {
    var approverEmail = typeof getISPDesignatedApproverEmail === 'function' ? getISPDesignatedApproverEmail() : '';
    var msg = approverEmail
      ? 'Only the designated ISP approver (' + approverEmail + ') can return this policy. Sign in with that account.'
      : 'Only the designated ISP approver can return this policy.';
    showToast(msg, true);
    return;
  }
  var notes = (document.getElementById('isp-approver-notes') || {}).value || '';
  if (!notes) { showToast('Please add return comments before returning the policy.', true); return; }
  if (!state.policyStatus) state.policyStatus = {};
  var prev = state.policyStatus.ISP || {};
  var rc = (state.policyReviewCycle || {}).ISP || {};
  var approverUser = state.currentUserId ? (state.users || []).find(function(u) { return u.id === state.currentUserId; }) : null;
  var returnedBy = approverUser ? approverUser.name
    : (typeof getSessionActorName === 'function' ? getSessionActorName(rc.approvedBy || 'Approver') : (rc.approvedBy || 'Approver'));
  state.policyStatus.ISP = {
    status: 'Returned',
    returnedDate: new Date().toISOString().slice(0,10),
    returnedBy: returnedBy,
    notes: notes,
    submittedAt: prev.submittedAt || '',
    // Always route returned ISP work back to the CISO/program owner editor queue.
    submittedTo: (state.programOwner || '').trim() || prev.submittedTo || '',
    submittedToRole: (state.programOwnerTitle || '').trim() || prev.submittedToRole || '',
    submittedToEmail: (state.programOwnerEmail || '').trim() || prev.submittedToEmail || ''
  };
  if (state.infoSecPolicy) {
    if (!state.infoSecPolicy.revisionHistory) state.infoSecPolicy.revisionHistory = [];
    state.infoSecPolicy.revisionHistory.push({
      version: 'R' + (state.infoSecPolicy.revisionHistory.length + 1),
      date: new Date().toISOString().slice(0, 10),
      author: returnedBy,
      changes: 'Returned for revision. Notes: ' + notes
    });
  }
  try { addAuditEntry('policy', 'ISP', 'ISP returned with comments: ' + notes); } catch(e) {}
  markDirty();
  try { if (typeof saveToStorage === 'function') saveToStorage(); } catch (e) { /* ignore */ }
  showToast('\u21A9 ISP returned to editor with comments.');
  var afterReturn = function() {
    if (typeof exitISPPolicyViewer === 'function') exitISPPolicyViewer();
    else showTab('reports');
  };
  if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
    cloudPushNow().finally(afterReturn);
  } else {
    afterReturn();
  }
}

function renderReturnedWorkCallout(user) {
  var cards = [];
  if (typeof canSessionReviseReturnedISP === 'function' && canSessionReviseReturnedISP()) {
    cards.push(
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(220,38,38,0.25);border-radius:10px;padding:12px 14px;">'
      + '<div><div style="font-size:13px;font-weight:700;color:#991b1b;">ISP returned for revision</div>'
      + '<div style="font-size:12px;color:#7f1d1d;">' + escapeHTML((((state.infoSecPolicy || {}).title || '').trim()) || 'Information Security Policy') + ' is back in your queue.</div></div>'
      + '<button class="btn btn-primary btn-sm" onclick="openISPForRevision()">✏️ Edit &amp; resubmit</button>'
      + '</div>'
    );
  }

  if (typeof getSessionReturnedDomainPoliciesNeedingOwner === 'function') {
    getSessionReturnedDomainPoliciesNeedingOwner().forEach(function(fam) {
      var title = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(fam) : fam;
      var notes = String(((state.policyStatus || {})[fam] || {}).notes || '').trim();
      cards.push(
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:12px 14px;">'
        + '<div><div style="font-size:13px;font-weight:700;color:#92400e;">' + escapeHTML(title) + ' needs an owner</div>'
        + '<div style="font-size:12px;color:#78350f;">' + escapeHTML(notes || 'Returned — assign a policy owner to continue.') + '</div></div>'
        + '<button class="btn btn-primary btn-sm" onclick="typeof openAssignDomainPolicyOwnerModal===\'function\'?openAssignDomainPolicyOwnerModal(\'' + fam.replace(/'/g, "\\'") + '\'):goToPoliciesHome()">Assign owner</button>'
        + '</div>'
      );
    });
  }

  if (typeof getSessionReturnedDomainPolicyFamilies === 'function') {
    getSessionReturnedDomainPolicyFamilies().forEach(function(fam) {
      var title = typeof getPolicyMergedTitle === 'function' ? getPolicyMergedTitle(fam) : fam;
      var notes = String(((state.policyStatus || {})[fam] || {}).notes || '').trim();
      cards.push(
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:12px 14px;">'
        + '<div><div style="font-size:13px;font-weight:700;color:#92400e;">' + escapeHTML(title) + ' returned for revision</div>'
        + '<div style="font-size:12px;color:#78350f;">' + escapeHTML(notes || 'Update the policy and resubmit when ready.') + '</div></div>'
        + '<button class="btn btn-primary btn-sm" onclick="typeof openReturnedDomainPolicyRevision===\'function\'?openReturnedDomainPolicyRevision(\'' + fam.replace(/'/g, "\\'") + '\'):goToPoliciesHome()">&#x270f;&#xfe0f; Edit &amp; resubmit</button>'
        + '</div>'
      );
    });
  } else if (user && user.families && user.families.length && (user.role === 'issm' || user.role === 'custodian')) {
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

  if (typeof getReturnedSspPackagesForUser === 'function') {
    getReturnedSspPackagesForUser(user).forEach(function(r) {
      var notes = String(r.sign.aoReturnNotes || '').trim();
      var sidEsc = String(r.scopeId || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      var isProcJs = r.isProcess ? 'true' : 'false';
      cards.push(
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:12px 14px;">'
        + '<div><div style="font-size:13px;font-weight:700;color:#92400e;">' + escapeHTML(r.name || 'Package') + ' ' + escapeHTML(r.sspLabel || 'SSP') + ' returned</div>'
        + '<div style="font-size:12px;color:#78350f;">' + escapeHTML(notes || 'Update attestations and resubmit from Step 4.') + '</div></div>'
        + '<button class="btn btn-primary btn-sm" onclick="openReturnedSspForRevision(\'' + sidEsc + '\',' + isProcJs + ')">Open &amp; revise</button>'
        + '</div>'
      );
    });
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

// ── SSP / Process SSP approval queue (controlReviewQueue type 'ssp') ─────
function sspQueueRowMatchesAo(r, user) {
  return typeof sspQueueRowMatchesReviewer === 'function' && sspQueueRowMatchesReviewer(r, user);
}

function aoOpenQueuedSsp(scopeId, isProcess) {
  if (typeof openSspReadOnlyFromQueue === 'function') {
    openSspReadOnlyFromQueue(scopeId, isProcess, 'reports');
    return;
  }
  showToast('Unable to open SSP package.', true);
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

function aoApproveQueuedSsp(scopeId, isProcess, opts) {
  opts = opts || {};
  var sid = String(scopeId);
  if (typeof sspReviewerCanActOnPackage === 'function' && !sspReviewerCanActOnPackage(sid)) {
    showToast('You are not the designated reviewer for this package (separation of duties).', true);
    return;
  }
  var u = state.currentUserId ? (state.users || []).find(function(x) { return x.id === state.currentUserId; }) : null;
  var actor = typeof getSessionActorName === 'function' ? getSessionActorName('AO') : (u ? u.name : 'AO');
  var label = isProcess ? 'Process SSP' : (state.privacyOverlay ? 'SPSP' : 'SSP');
  if (!confirm('Approve this ' + label + ' for authorization?')) return;
  if (!state.sspSignoffs) state.sspSignoffs = {};
  var prev = state.sspSignoffs[sid] || {};
  var collected = typeof collectSspReviewerCommentsFromDraft === 'function'
    ? collectSspReviewerCommentsFromDraft(sid)
    : { overall: '', byControl: {} };
  state.sspSignoffs[sid] = Object.assign({}, prev, {
    status: 'Approved',
    approvedBy: actor,
    approvedDate: new Date().toISOString().slice(0, 10),
    reviewerApprovalNotes: collected.overall || '',
    reviewerControlComments: Object.assign({}, collected.byControl)
  });
  if (typeof clearSspReviewerDraft === 'function') clearSspReviewerDraft(sid);
  aoRemoveSspQueueRow(sid, isProcess);
  try {
    var auditMsg = label + ' approved by AO (' + actor + ')';
    if (collected.overall) auditMsg += ': ' + collected.overall;
    addAuditEntry(isProcess ? 'process' : 'asset', sid, auditMsg);
  } catch (e) {}
  markDirty();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  showToast('\u2705 ' + label + ' approved.');
  var afterApprove = function() {
    if (opts.fromReview && typeof closeSspReadOnlyReview === 'function') {
      closeSspReadOnlyReview();
    } else if (typeof renderReports === 'function') {
      renderReports();
    }
  };
  if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
    cloudPushNow().finally(afterApprove);
  } else {
    afterApprove();
  }
}

function aoReturnQueuedSsp(scopeId, isProcess, opts) {
  opts = opts || {};
  var sid = String(scopeId);
  if (typeof sspReviewerCanActOnPackage === 'function' && !sspReviewerCanActOnPackage(sid)) {
    showToast('You are not the designated reviewer for this package (separation of duties).', true);
    return;
  }
  var label = isProcess ? 'Process SSP' : (state.privacyOverlay ? 'SPSP' : 'SSP');
  var collected = typeof collectSspReviewerCommentsFromDraft === 'function'
    ? collectSspReviewerCommentsFromDraft(sid)
    : { overall: '', byControl: {} };
  var notes = typeof buildSspReturnNotesFromDraft === 'function'
    ? buildSspReturnNotesFromDraft(sid)
    : '';
  if (!notes && !opts.fromReview) {
    try {
      notes = window.prompt('Optional notes to the owner (e.g. what to fix before resubmitting):', '') || '';
    } catch (e) {}
  }
  if (!String(notes || '').trim()) {
    showToast('Add an overall comment or at least one per-control comment before returning.', true);
    return;
  }
  var u = state.currentUserId ? (state.users || []).find(function(x) { return x.id === state.currentUserId; }) : null;
  var returnedBy = (u && (u.name || '').trim())
    || (typeof getSessionActorName === 'function' ? getSessionActorName('') : '');
  if (!state.sspSignoffs) state.sspSignoffs = {};
  var prev = state.sspSignoffs[sid] || {};
  var next = Object.assign({}, prev);
  delete next.status;
  delete next.signedBy;
  delete next.signedDate;
  next.aoReturnNotes = String(notes).trim();
  next.aoReturnedAt = new Date().toISOString().slice(0, 10);
  next.aoReturnedBy = returnedBy || (isProcess ? 'Process SSP reviewer' : 'SSP reviewer');
  next.reviewerControlComments = Object.assign({}, collected.byControl);
  delete next.reviewerDraft;
  state.sspSignoffs[sid] = next;
  aoRemoveSspQueueRow(sid, isProcess);
  try {
    addAuditEntry(isProcess ? 'process' : 'asset', sid, label + ' returned to owner by AO' + (notes.trim() ? ': ' + notes.trim() : ''));
  } catch (e) {}
  markDirty();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  showToast(label + ' returned to the owner for revision.');
  var afterReturn = function() {
    if (opts.fromReview && typeof closeSspReadOnlyReview === 'function') {
      closeSspReadOnlyReview();
    } else if (typeof renderReports === 'function') {
      renderReports();
    }
  };
  if (typeof cloudPushNow === 'function' && typeof isCloudSessionActive === 'function' && isCloudSessionActive()) {
    cloudPushNow().finally(afterReturn);
  } else {
    afterReturn();
  }
}

function renderSspApprovalQueueHtml(user) {
  if (user && typeof userMayReceiveSspReviews === 'function' && !userMayReceiveSspReviews(user)) return '';
  var items = typeof getSspReviewQueueItemsForUser === 'function'
    ? getSspReviewQueueItemsForUser(user)
    : (state.controlReviewQueue || []).filter(function(r) { return sspQueueRowMatchesAo(r, user); });
  var sspLabel = state.privacyOverlay ? 'SPSP' : 'SSP';
  if (!items.length) return '';
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
      + '<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;">' + (isProc ? 'Process' : 'Asset') + '</td>'
      + '<td style="padding:10px 12px;font-size:13px;font-weight:700;color:var(--navy);">' + name + '</td>'
      + '<td style="padding:10px 12px;font-size:12px;color:#475569;">' + by + '</td>'
      + '<td style="padding:10px 12px;font-size:12px;color:var(--text-muted);">' + dt + '</td>'
      + '<td style="padding:10px 12px;font-size:12px;color:var(--text-muted);">' + rev + '</td>'
      + '<td style="padding:10px 12px;text-align:right;white-space:nowrap;">'
      + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;" onclick=\'aoOpenQueuedSsp(' + sidJson + ',' + (isProc ? 'true' : 'false') + ')\'>Open &amp; review</button>'
      + '</td></tr>';
  }).join('');
  return '<div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;max-width:100%;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">'
    + '<div style="display:flex;align-items:center;gap:8px;">'
    + '<span style="font-size:14px;font-weight:700;color:var(--navy);">' + sspLabel + ' review queue</span>'
    + '<span style="background:var(--red);color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:10px;">' + items.length + '</span></div>'
    + '<span style="font-size:11px;color:var(--text-muted);">Open a package to inspect attestations and approve or return</span></div>'
    + '<div class="table-scroll"><table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid var(--border);">'
    + '<thead><tr style="background:#f8fafc;">'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#475569;">Type</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#475569;">System / process</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#475569;">Signed by</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#475569;">Submitted</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#475569;">Reviewer</th>'
    + '<th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:#475569;">Review</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

// ── Approver-role dashboard ────────────────────────────────────────────────
function renderApproverDashboard(user) {
  var isp = state.infoSecPolicy;
  var ispSt = typeof getISPStatus === 'function' ? getISPStatus() : (((state.policyStatus||{}).ISP || {}).status || (isp && isp.title ? 'Under Review' : 'Not Started'));
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

  var html = (typeof renderReturnedSspWorkCallout === 'function' ? renderReturnedSspWorkCallout(user) : '')
    + '<div style="background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #93c5fd;border-radius:12px;padding:20px;margin-bottom:20px;">'
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

    html += '<button class="btn btn-secondary btn-sm" style="margin-bottom:16px;" onclick="goToCISOPolicyEditor()">📋 View Full Policy →</button>';

    if (ispSt === 'Under Review') {
      var canApprove = typeof canSessionApproveISP === 'function' && canSessionApproveISP();
      html += '<div style="border-top:1px solid var(--border);padding-top:16px;">';
      if (canApprove) {
        html += '<div style="font-size:12px;font-weight:600;color:var(--navy);margin-bottom:6px;">Review Notes (required to return, optional to approve)</div>'
          + '<textarea id="isp-approver-notes" class="form-input" rows="3" style="font-size:13px;resize:vertical;margin-bottom:12px;" placeholder="Add any notes or conditions for approval…"></textarea>'
          + '<div style="display:flex;gap:10px;">'
          + '<button class="btn btn-sm" style="background:white;border:1px solid rgba(239,68,68,0.4);color:#dc2626;font-weight:600;" onclick="returnISPToEditor()">↩ Return with Comments</button>'
          + '<button class="btn btn-primary btn-sm" onclick="approveISP()">✅ Approve Policy</button>'
          + '</div>';
      } else {
        var approverEmail = typeof getISPDesignatedApproverEmail === 'function' ? getISPDesignatedApproverEmail() : '';
        html += '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">'
          + 'Awaiting approval from <strong>' + escapeHTML(getISPDesignatedApproverName() || 'the designated approver') + '</strong>'
          + (approverEmail ? ' (' + escapeHTML(approverEmail) + ')' : '')
          + '. Sign in with that account to approve or return this policy.</div>';
      }
      html += '</div>';
    } else if (ispSt === 'Approved') {
      html += '<div style="font-size:12px;color:var(--teal);font-weight:600;">\u2713 Approved' + (approvedDate ? ' on ' + approvedDate : '') + '</div>';
    } else if (ispSt === 'Returned') {
      html += '<div style="font-size:12px;color:#dc2626;font-weight:600;">\u21A9 Returned — awaiting revision from ' + escapeHTML(state.programOwner||'CISO') + '</div>';
    }

    html += '</div>';
  }
  html += '</div>';
  html += typeof renderReportsLibraryEntryHtml === 'function' ? renderReportsLibraryEntryHtml() : '';
  html += typeof renderSspApprovalQueueHtml === 'function' ? renderSspApprovalQueueHtml(user) : '';
  return html;
}

function renderReports() {
  if (state._reportsLibraryView) {
    renderReportsLibraryShell();
    return;
  }
  showReportsDashboardPanels();

  const body = document.getElementById('reports-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">\uD83D\uDCCA</div><div class="es-title">Reports Unavailable \u2014 Setup Required</div><p>The CISO must complete all 7 program setup steps (baseline selection, PM controls, security policy, and role assignments) before reports can be generated. Go to the CISO tab to continue.</p></div>`;
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

  // Approvers (and designated ISP approvers in cloud mode) get a focused ISP approval queue.
  var isApproverRole = user && user.role === 'approver';
  var isDesignatedIspApprover = typeof canSessionApproveISP === 'function' && canSessionApproveISP();
  if ((isApproverRole || isDesignatedIspApprover) && (showMyView || isDesignatedIspApprover)) {
    var dashUser = user || { name: typeof getSessionActorName === 'function' ? getSessionActorName('Approver') : 'Approver', role: 'approver' };
    body.innerHTML = renderApproverDashboard(dashUser);
    return;
  }

  // Empty state for scoped users with no assignments
  if (showMyView && controls.length === 0 && families.length === 0) {
    var uName = user ? user.name.split(' ')[0] : 'there';
    // renderReturnedWorkCallout already includes returned-SSP cards alongside
    // returned ISP / domain-policy / evidence work, so use it alone here to avoid
    // both dropping non-SSP work and double-rendering SSP cards.
    var returnedWorkHtml = typeof renderReturnedWorkCallout === 'function' ? renderReturnedWorkCallout(user) : '';
    body.innerHTML = returnedWorkHtml
      + '<div class="empty-state"><div class="es-icon">\uD83D\uDCCA</div><div class="es-title">Welcome, ' + escapeHTML(uName) + '</div>'
      + '<p>No controls or policy domains have been assigned to you yet. Once your CISO or ISSM assigns work to you, your personal dashboard and reports will appear here.</p></div>'
      + (typeof renderReportsLibraryEntryHtml === 'function' && userHasReportsLibraryAccess(user) ? renderReportsLibraryEntryHtml() : '');
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
  // from getActiveControls()/getScopedControls() already includes the PM controls
  // the program selected in setup (state.pmControls). Adding state.pmControls on
  // top of that double-counts them, causing the "Total in Scope" card to exceed
  // the sum of the Implementation-Status bars.
  const authTotalInReports = controls.length;
  const coveragePct = authTotalInReports ? Math.round((implemented/authTotalInReports)*100) : 0;

  var showProgramExecDashboard = !user || userSeesProgramExecutiveDashboard(user);
  var readinessRestore = state._reportsProgramReadinessHidden
    ? '<div style="margin-bottom:12px;max-width:920px;"><button type="button" class="btn btn-secondary btn-sm" onclick="setReportsProgramReadinessHidden(false)">Show Program Readiness</button></div>'
    : '';
  var mySummaryRestore = state._reportsMySummaryHidden
    ? '<div style="margin-bottom:12px;max-width:920px;"><button type="button" class="btn btn-secondary btn-sm" onclick="setReportsMySummaryHidden(false)">Show My Summary</button></div>'
    : '';
  body.innerHTML = `
    ${readinessRestore}
    ${mySummaryRestore}
    ${renderProgramReadinessPanelHtml()}
    ${typeof renderAuthorizationStatusPanelHtml === 'function' ? renderAuthorizationStatusPanelHtml() : ''}
    ${renderReturnedWorkCallout(user)}
    ${userHasReportsLibraryAccess(user) ? renderReportsLibraryEntryHtml() : ''}
    ${typeof renderRiskPosturePanelHtml === 'function' ? renderRiskPosturePanelHtml() : ''}
    ${renderSspApprovalQueueHtml(user)}
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

    <div style="background:white; border:1px solid var(--border); border-radius:10px; padding:16px 20px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
      <div><div style="font-weight:700; font-size:14px; color:var(--navy);">Controls Inventory</div><div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Full control list with owner, governing policy, and associated asset/process types — now its own view.</div></div>
      <button type="button" class="btn btn-secondary btn-sm" onclick="goToReportsLibrary('controls')">Open Controls →</button>
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
  if (state._reportsAuditLogHidden) {
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'
      + '<div style="font-weight:700;font-size:14px;color:var(--navy);">Activity &amp; change log</div>'
      + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;" onclick="setReportsAuditLogHidden(false)">Show</button>'
      + '</div>';
    body.appendChild(panel);
    return;
  }
  panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:10px;">'
    + '<div style="font-weight:700;font-size:14px;color:var(--navy);">Activity &amp; change log</div>'
    + '<div style="display:flex;align-items:center;gap:10px;">'
    + '<div style="font-size:12px;color:var(--text-muted);">' + entries.length + ' events · ' + fieldCount + ' field edits (retained)</div>'
    + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;" onclick="setReportsAuditLogHidden(true)">Hide</button>'
    + '</div>'
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

function setReportsAuditLogHidden(hidden) {
  state._reportsAuditLogHidden = !!hidden;
  markDirty();
  renderAuditTrailPanel();
}
window.setReportsAuditLogHidden = setReportsAuditLogHidden;

// ── Attestation Review Queue (for CISO / ISSM on Reports) ──────────────
function controlDesignQueueMatchesReviewer(r) {
  if (!r || r.type === 'baseline-elevation' || r.type === 'ssp') return false;
  var reviewerEmail = typeof normalizeOwnerEmail === 'function'
    ? normalizeOwnerEmail(r.reviewerEmail || r.policyOwnerEmail || '')
    : String(r.reviewerEmail || '').trim().toLowerCase();
  var reviewerName = String(r.reviewerName || r.policyOwner || '').trim().toLowerCase();
  var sessionEmail = typeof getSessionEmailForApproval === 'function' ? getSessionEmailForApproval() : '';
  var sessionName = String(typeof getSessionActorName === 'function' ? getSessionActorName('') : '').trim().toLowerCase();
  if (sessionEmail && reviewerEmail && sessionEmail === reviewerEmail) return true;
  if (sessionName && reviewerName && sessionName === reviewerName) return true;
  return false;
}

function renderReviewQueuePanel() {
  var body = document.getElementById('reports-body');
  if (!body) return;
  var existing = document.getElementById('reviewQueuePanel');
  if (existing) existing.remove();

  var queue = (state.controlReviewQueue || []).filter(function(r) {
    return r.type !== 'baseline-elevation' && r.type !== 'ssp';
  });
  // Scope queue to current user's families if ISSM, or designated reviewer if routed elsewhere.
  var user = state.currentUserId ? (state.users||[]).find(function(u){ return u.id === state.currentUserId; }) : null;
  if (user && user.role === 'issm' && user.families && user.families.length) {
    queue = queue.filter(function(r) {
      var fam = r.family || (r.controlId||'').replace(/-.*/, '');
      return user.families.includes(fam) || controlDesignQueueMatchesReviewer(r);
    });
  } else if (user && user.role !== 'ciso' && user.role !== 'issm') {
    queue = queue.filter(controlDesignQueueMatchesReviewer);
    if (!queue.length) return;
  }
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
      + (r.reviewerName && String(r.reviewerName).trim() && String(r.reviewerName).trim() !== String(r.submittedBy || '').trim()
        ? '<div style="font-size:11px;color:#475569;margin-top:3px;line-height:1.35;"><strong>Reviewer:</strong> ' + escapeHTML(r.reviewerName) + '</div>'
        : '')
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
  if (typeof openControlReassignmentModal === 'function') {
    openControlReassignmentModal(controlId);
    return;
  }
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

window.goToReportsDashboard = goToReportsDashboard;
window.goToReportsLibrary = goToReportsLibrary;
window.renderControlsInventory = renderControlsInventory;
window.renderPoliciesInventory = renderPoliciesInventory;
window.filterCtrlInvTable = filterCtrlInvTable;
window.openPublishedPolicyFromReports = openPublishedPolicyFromReports;
window.backToReportsPolicyLibrary = backToReportsPolicyLibrary;
window.renderReportsLibraryEntryHtml = renderReportsLibraryEntryHtml;
window.userHasReportsLibraryAccess = userHasReportsLibraryAccess;
window.aoOpenQueuedSsp = aoOpenQueuedSsp;
window.aoApproveQueuedSsp = aoApproveQueuedSsp;
window.aoReturnQueuedSsp = aoReturnQueuedSsp;
