// js/frameworks.js — multi-framework alignment (ISO 27001, SOC 2, HIPAA) + evidence storage helpers (SharePoint, Google Drive, OneDrive)

var FRAMEWORK_META = {
  iso27001: { id: 'iso27001', label: 'ISO 27001', subtitle: 'Annex A (2022)', color: '#5856D6', bg: '#f5f3ff' },
  soc2:     { id: 'soc2',     label: 'SOC 2',     subtitle: 'Trust Services Criteria', color: '#FF9500', bg: '#fff7ed' },
  hipaa:    { id: 'hipaa',    label: 'HIPAA',     subtitle: 'Security Rule', color: '#34C759', bg: '#f0fdf4' }
};

// Family-level crosswalk defaults — applied to every control in the family unless overridden.
var FAMILY_FRAMEWORK_REFS = {
  AC: { iso27001: ['A.5.15','A.5.16','A.5.17','A.5.18','A.8.2','A.8.3','A.8.5'], soc2: ['CC6.1','CC6.2','CC6.3','CC6.6'], hipaa: ['§164.308(a)(3)','§164.308(a)(4)','§164.312(a)(1)'] },
  AT: { iso27001: ['A.6.3','A.6.4'], soc2: ['CC1.4','CC2.2'], hipaa: ['§164.308(a)(5)'] },
  AU: { iso27001: ['A.8.15','A.8.16'], soc2: ['CC7.2','CC7.3'], hipaa: ['§164.312(b)'] },
  CA: { iso27001: ['A.8.8','A.8.9'], soc2: ['CC8.1'], hipaa: ['§164.308(a)(8)'] },
  CM: { iso27001: ['A.8.9','A.8.19','A.8.32'], soc2: ['CC8.1'], hipaa: ['§164.310(d)(1)'] },
  CP: { iso27001: ['A.5.29','A.5.30','A.8.13','A.8.14'], soc2: ['A1.2','A1.3'], hipaa: ['§164.308(a)(7)'] },
  IA: { iso27001: ['A.5.16','A.5.17','A.8.5'], soc2: ['CC6.1','CC6.6'], hipaa: ['§164.312(d)'] },
  IR: { iso27001: ['A.5.24','A.5.25','A.5.26','A.5.27'], soc2: ['CC7.4','CC7.5'], hipaa: ['§164.308(a)(6)'] },
  MA: { iso27001: ['A.7.13','A.8.1'], soc2: ['CC8.1'], hipaa: ['§164.310(a)(2)'] },
  MP: { iso27001: ['A.5.10','A.5.11','A.5.12','A.7.10'], soc2: ['CC6.7'], hipaa: ['§164.310(c)'] },
  PE: { iso27001: ['A.7.1','A.7.2','A.7.3','A.7.4'], soc2: ['CC6.4'], hipaa: ['§164.310(a)(1)','§164.310(b)'] },
  PL: { iso27001: ['A.5.1','A.5.2','A.5.4'], soc2: ['CC1.1','CC2.1'], hipaa: ['§164.308(a)(1)'] },
  PM: { iso27001: ['A.5.1','A.5.2','A.5.4','A.5.35'], soc2: ['CC1.1','CC1.2'], hipaa: ['§164.308(a)(1)','§164.316'] },
  PS: { iso27001: ['A.6.1','A.6.2','A.6.4'], soc2: ['CC1.4'], hipaa: ['§164.308(a)(3)(ii)(A)'] },
  PT: { iso27001: ['A.5.33','A.5.34','A.8.10','A.8.11'], soc2: ['P1.1','P2.1'], hipaa: ['§164.308(a)(1)','§164.502'] },
  RA: { iso27001: ['A.5.7','A.5.8','A.8.8'], soc2: ['CC3.1','CC3.2'], hipaa: ['§164.308(a)(1)(ii)(A)'] },
  SA: { iso27001: ['A.5.19','A.5.20','A.5.21','A.5.23'], soc2: ['CC9.2'], hipaa: ['§164.308(b)'] },
  SC: { iso27001: ['A.5.14','A.8.20','A.8.21','A.8.22'], soc2: ['CC6.6','CC6.7'], hipaa: ['§164.312(e)(1)'] },
  SI: { iso27001: ['A.8.7','A.8.8'], soc2: ['CC7.1'], hipaa: ['§164.308(a)(5)(ii)(B)'] },
  SR: { iso27001: ['A.5.19','A.5.20','A.5.21','A.5.22'], soc2: ['CC9.2'], hipaa: ['§164.308(b)(1)'] }
};

// Control-specific refinements for high-traffic controls.
var CONTROL_FRAMEWORK_OVERRIDES = {
  'AC-1':  { iso27001: ['A.5.1','A.5.37'], soc2: ['CC1.1','CC2.2'], hipaa: ['§164.308(a)(1)'] },
  'AC-2':  { iso27001: ['A.5.16','A.5.18','A.8.2'], soc2: ['CC6.1','CC6.2'], hipaa: ['§164.312(a)(1)','§164.312(a)(2)(i)'] },
  'AC-3':  { iso27001: ['A.8.3'], soc2: ['CC6.1'], hipaa: ['§164.312(a)(1)'] },
  'AU-2':  { iso27001: ['A.8.15'], soc2: ['CC7.2'], hipaa: ['§164.312(b)'] },
  'CM-2':  { iso27001: ['A.8.9'], soc2: ['CC8.1'], hipaa: ['§164.310(d)(1)'] },
  'CP-1':  { iso27001: ['A.5.29'], soc2: ['A1.2'], hipaa: ['§164.308(a)(7)'] },
  'IA-2':  { iso27001: ['A.8.5'], soc2: ['CC6.1'], hipaa: ['§164.312(d)'] },
  'IR-1':  { iso27001: ['A.5.24'], soc2: ['CC7.4'], hipaa: ['§164.308(a)(6)'] },
  'PL-1':  { iso27001: ['A.5.1'], soc2: ['CC1.1'], hipaa: ['§164.308(a)(1)'] },
  'PM-1':  { iso27001: ['A.5.1'], soc2: ['CC1.1'], hipaa: ['§164.308(a)(1)'] },
  'RA-1':  { iso27001: ['A.5.7'], soc2: ['CC3.1'], hipaa: ['§164.308(a)(1)(ii)(A)'] },
  'SC-7':  { iso27001: ['A.8.20'], soc2: ['CC6.6'], hipaa: ['§164.312(e)(1)'] },
  'SI-2':  { iso27001: ['A.8.8'], soc2: ['CC7.1'], hipaa: ['§164.308(a)(5)(ii)(B)'] }
};

function getActiveFrameworkIds() {
  var af = state && state.activeFrameworks;
  if (!af || typeof af !== 'object') return ['iso27001', 'soc2', 'hipaa'];
  return Object.keys(FRAMEWORK_META).filter(function(k) { return !!af[k]; });
}

function getFrameworkRefsForControl(ctrlId) {
  var fam = (ctrlId || '').split('-')[0];
  var base = FAMILY_FRAMEWORK_REFS[fam] || {};
  var over = CONTROL_FRAMEWORK_OVERRIDES[ctrlId] || {};
  var out = {};
  Object.keys(FRAMEWORK_META).forEach(function(fw) {
    var refs = over[fw] || base[fw] || [];
    if (refs.length) out[fw] = refs.slice();
  });
  return out;
}

function renderFrameworkBadgesHtml(ctrlId, compact) {
  var active = getActiveFrameworkIds();
  var refs = getFrameworkRefsForControl(ctrlId);
  var parts = [];
  active.forEach(function(fw) {
    var list = refs[fw];
    if (!list || !list.length) return;
    var meta = FRAMEWORK_META[fw];
    var label = compact ? meta.label.split(' ')[0] : (list[0] + (list.length > 1 ? ' +' + (list.length - 1) : ''));
    parts.push('<span class="fw-badge" style="background:' + meta.bg + ';color:' + meta.color + ';border:1px solid ' + meta.color + '33;" title="' + escapeHTML(meta.label + ': ' + list.join(', ')) + '">' + escapeHTML(label) + '</span>');
  });
  return parts.join('');
}

function toggleActiveFramework(fwId) {
  if (!state.activeFrameworks) state.activeFrameworks = { iso27001: true, soc2: true, hipaa: true };
  var current = state.activeFrameworks[fwId] !== false;
  state.activeFrameworks[fwId] = !current;
  markDirty();
  renderFrameworksTab();
  if (typeof refreshCurrentCisoStep === 'function') refreshCurrentCisoStep();
  else if (typeof renderCISOStep3Integrations === 'function' && document.getElementById('ciso-step-3-body')) renderCISOStep3Integrations();
}

function computeFrameworkCoverage(fwId) {
  if (!state.baseline || typeof getActiveControls !== 'function') return { total: 0, mapped: 0, implemented: 0, pct: 0 };
  var controls = getActiveControls();
  var mapped = 0;
  var implemented = 0;
  controls.forEach(function(c) {
    var refs = getFrameworkRefsForControl(c.id);
    if (!refs[fwId] || !refs[fwId].length) return;
    mapped++;
    var st = (state.controlStatus || {})[c.id];
    if (st && (st.status === 'Implemented' || st.status === 'Inherited')) implemented++;
  });
  return {
    total: controls.length,
    mapped: mapped,
    implemented: implemented,
    pct: mapped ? Math.round((implemented / mapped) * 100) : 0
  };
}

function renderFrameworksTab() {
  var body = document.getElementById('frameworks-body');
  if (!body) return;
  var active = getActiveFrameworkIds();
  var filterFw = state._frameworkFilter || '';
  var search = (state._frameworkSearch || '').toLowerCase();

  var cards = Object.keys(FRAMEWORK_META).map(function(fwId) {
    var meta = FRAMEWORK_META[fwId];
    var on = !!(state.activeFrameworks || {})[fwId];
    var cov = computeFrameworkCoverage(fwId);
    return '<div class="fw-coverage-card' + (on ? '' : ' fw-coverage-card-off') + '" style="--fw-color:' + meta.color + ';">'
      + '<div class="fw-coverage-head">'
      + '<div><div class="fw-coverage-title">' + escapeHTML(meta.label) + '</div>'
      + '<div class="fw-coverage-sub">' + escapeHTML(meta.subtitle) + '</div></div>'
      + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="toggleActiveFramework(\'' + fwId + '\')"><span class="fw-toggle-track"></span></label>'
      + '</div>'
      + (on
        ? '<div class="fw-coverage-bar-wrap"><div class="fw-coverage-bar" style="width:' + cov.pct + '%;"></div></div>'
          + '<div class="fw-coverage-stats">'
          + '<span><strong>' + cov.pct + '%</strong> implemented</span>'
          + '<span>' + cov.implemented + ' / ' + cov.mapped + ' mapped controls</span>'
          + '</div>'
          + '<button type="button" class="btn btn-secondary btn-sm" onclick="state._frameworkFilter=\'' + fwId + '\';renderFrameworksTab();">View mapping →</button>'
        : '<div class="fw-coverage-stats" style="opacity:0.6;">Tracking off — enable to see crosswalk</div>')
      + '</div>';
  }).join('');

  var controls = (typeof getActiveControls === 'function' ? getActiveControls() : (typeof CONTROLS !== 'undefined' ? CONTROLS : []))
    .filter(function(c) {
      if (!filterFw) return true;
      var refs = getFrameworkRefsForControl(c.id);
      return refs[filterFw] && refs[filterFw].length;
    })
    .filter(function(c) {
      if (!search) return true;
      return c.id.toLowerCase().indexOf(search) !== -1 || (c.n || '').toLowerCase().indexOf(search) !== -1;
    });

  var rows = controls.slice(0, 200).map(function(c) {
    var refs = getFrameworkRefsForControl(c.id);
    var st = (state.controlStatus || {})[c.id] || {};
    var status = st.status || 'Not Started';
    var refCells = active.map(function(fw) {
      var list = refs[fw] || [];
      var meta = FRAMEWORK_META[fw];
      return '<td style="font-size:11px;color:' + meta.color + ';font-weight:600;">' + (list.length ? escapeHTML(list.join(', ')) : '<span style="color:var(--text-muted);font-weight:400;">—</span>') + '</td>';
    }).join('');
    return '<tr class="fw-map-row" onclick="goToControlFromFramework(\'' + c.id.replace(/'/g, "\\'") + '\')" style="cursor:pointer;">'
      + '<td style="font-weight:700;color:var(--accent);">' + escapeHTML(c.id) + '</td>'
      + '<td style="font-size:12px;">' + escapeHTML(c.n || '') + '</td>'
      + '<td><span class="status-pill status-' + status.replace(/\s+/g, '-').toLowerCase() + '">' + escapeHTML(status) + '</span></td>'
      + refCells
      + '</tr>';
  }).join('');

  var headCols = active.map(function(fw) {
    return '<th style="font-size:11px;color:' + FRAMEWORK_META[fw].color + ';">' + escapeHTML(FRAMEWORK_META[fw].label) + '</th>';
  }).join('');

  body.innerHTML = ''
    + '<div class="fw-intro">'
    + '<p>EightFiftyThree maps your NIST 800-53 program to <strong>ISO 27001</strong>, <strong>SOC 2</strong>, and <strong>HIPAA</strong> so one control implementation satisfies multiple audit lenses. Enable the frameworks you care about — coverage updates as control owners mark implementation.</p>'
    + '</div>'
    + '<div class="fw-coverage-grid">' + cards + '</div>'
    + '<div class="fw-map-panel">'
    + '<div class="fw-map-toolbar">'
    + '<input class="form-input" placeholder="Search controls…" value="' + escapeHTML(state._frameworkSearch || '') + '" oninput="state._frameworkSearch=this.value;renderFrameworksTab();" style="max-width:280px;">'
    + '<select class="form-select" style="max-width:200px;" onchange="state._frameworkFilter=this.value;renderFrameworksTab();">'
    + '<option value="">All active frameworks</option>'
    + Object.keys(FRAMEWORK_META).map(function(fw) {
      return '<option value="' + fw + '"' + (filterFw === fw ? ' selected' : '') + '>' + escapeHTML(FRAMEWORK_META[fw].label) + ' only</option>';
    }).join('')
    + '</select>'
    + (filterFw ? '<button type="button" class="btn btn-secondary btn-sm" onclick="state._frameworkFilter=\'\';renderFrameworksTab();">Clear filter</button>' : '')
    + '<span style="font-size:12px;color:var(--text-muted);margin-left:auto;">' + controls.length + ' control' + (controls.length === 1 ? '' : 's') + '</span>'
    + '</div>'
    + '<div style="overflow-x:auto;">'
    + '<table class="control-table fw-map-table"><thead><tr>'
    + '<th>Control</th><th>Name</th><th>Status</th>' + headCols
    + '</tr></thead><tbody>'
    + (rows || '<tr><td colspan="' + (3 + active.length) + '" style="padding:24px;text-align:center;color:var(--text-muted);">No controls match — set a baseline in Program setup first.</td></tr>')
    + '</tbody></table>'
    + (controls.length > 200 ? '<div style="font-size:12px;color:var(--text-muted);padding:12px;">Showing first 200 of ' + controls.length + ' controls. Refine search to narrow.</div>' : '')
    + '</div></div>';
}

function goToControlFromFramework(ctrlId) {
  state._selectedCtrl = ctrlId;
  state._controlLibraryMode = false;
  showTab('control');
  if (typeof goToStep === 'function') goToStep('control', 2);
}

function renderFrameworkDashboardStripHtml() {
  if (!state.baseline || typeof getActiveFrameworkIds !== 'function') return '';
  var active = getActiveFrameworkIds();
  if (!active.length) return '';
  var cards = active.map(function(fw) {
    var meta = FRAMEWORK_META[fw];
    var cov = computeFrameworkCoverage(fw);
    return '<button type="button" class="fw-dash-chip" style="--fw-color:' + meta.color + ';" onclick="showTab(\'frameworks\')">'
      + '<span class="fw-dash-chip-label">' + escapeHTML(meta.label) + '</span>'
      + '<span class="fw-dash-chip-pct">' + cov.pct + '%</span>'
      + '<span class="fw-dash-chip-sub">implemented</span>'
      + '</button>';
  }).join('');
  return '<div class="fw-dash-strip">'
    + '<div class="fw-dash-strip-head"><span>Multi-framework posture</span>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="showTab(\'frameworks\')">View alignment →</button></div>'
    + '<div class="fw-dash-chips">' + cards + '</div></div>';
}

function renderFrameworkSetupSectionHtml() {
  var af = state.activeFrameworks || {};
  var chips = Object.keys(FRAMEWORK_META).map(function(fwId) {
    var meta = FRAMEWORK_META[fwId];
    var on = af[fwId] !== false;
    return '<button type="button" class="fw-setup-chip' + (on ? ' fw-setup-chip-on' : '') + '" style="--fw-color:' + meta.color + ';" onclick="toggleActiveFramework(\'' + fwId + '\')">'
      + '<span class="fw-setup-chip-dot"></span>'
      + escapeHTML(meta.label)
      + '</button>';
  }).join('');
  return '<div class="fw-setup-section">'
    + '<div class="section-title" style="margin-bottom:4px;">Additional compliance frameworks</div>'
    + '<div class="section-subtitle" style="margin-bottom:12px;">NIST 800-53 is your anchor — enable other lenses to see crosswalks on every control and track multi-framework coverage.</div>'
    + '<div class="fw-setup-chips">' + chips + '</div>'
    + '</div>';
}

// ─── SharePoint evidence helpers ───────────────────────────────────────────

function getSharePointConfig() {
  var cfg = state.sharePointConfig || {};
  return {
    enabled: !!cfg.enabled,
    siteUrl: String(cfg.siteUrl || '').replace(/\/+$/, ''),
    libraryName: String(cfg.libraryName || 'Evidence').trim() || 'Evidence',
    defaultFolder: String(cfg.defaultFolder || 'GRC/Evidence').replace(/^\/+|\/+$/g, '')
  };
}

function isSharePointUrl(url) {
  return /sharepoint\.com/i.test(String(url || '')) || /sharepoint\.us/i.test(String(url || ''));
}

function buildSharePointEvidenceUrl(relativePath) {
  var cfg = getSharePointConfig();
  if (!cfg.siteUrl) return '';
  var path = String(relativePath || '').replace(/^\/+/, '');
  if (!path) return cfg.siteUrl;
  if (isSharePointUrl(path)) return path;
  var lib = encodeURIComponent(cfg.libraryName).replace(/%20/g, '%20');
  var folder = cfg.defaultFolder ? '/' + cfg.defaultFolder.split('/').map(encodeURIComponent).join('/') : '';
  return cfg.siteUrl + '/' + lib + '/Forms/AllItems.aspx?id=' + encodeURIComponent(cfg.siteUrl + '/' + cfg.libraryName + folder + '/' + path);
}

function openSharePointSite() {
  var cfg = getSharePointConfig();
  if (!cfg.siteUrl) {
    showToast('Set your SharePoint site URL in Program setup first.', true);
    return;
  }
  window.open(cfg.siteUrl, '_blank', 'noopener,noreferrer');
}

function openSharePointEvidenceFolder() {
  var cfg = getSharePointConfig();
  if (!cfg.siteUrl) {
    showToast('Set your SharePoint site URL in Program setup first.', true);
    return;
  }
  var url = cfg.siteUrl + '/' + encodeURIComponent(cfg.libraryName) + '/Forms/AllItems.aspx'
    + (cfg.defaultFolder ? '?id=' + encodeURIComponent(cfg.siteUrl + '/' + cfg.libraryName + '/' + cfg.defaultFolder) : '');
  window.open(url, '_blank', 'noopener,noreferrer');
}

function setSharePointConfigField(field, value) {
  if (!state.sharePointConfig) state.sharePointConfig = { enabled: false, siteUrl: '', libraryName: 'Evidence', defaultFolder: 'GRC/Evidence' };
  var prev = state.sharePointConfig[field];
  state.sharePointConfig[field] = value;
  if (field === 'enabled') state.sharePointConfig.enabled = !!value;
  logFieldChange('sharePointConfig.' + field, prev, value);
  markDirty();
}

function renderSharePointSetupCardHtml() {
  var cfg = getSharePointConfig();
  return '<div class="sp-setup-card">'
    + '<div class="sp-setup-head">'
    + '<div><div class="sp-setup-title">Evidence in SharePoint</div>'
    + '<div class="sp-setup-sub">Store artifacts in SharePoint — this tool keeps links and context, not file copies.</div></div>'
    + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (cfg.enabled ? ' checked' : '') + ' onchange="setSharePointConfigField(\'enabled\',this.checked);if(typeof refreshCurrentCisoStep===\'function\')refreshCurrentCisoStep();"><span class="fw-toggle-track"></span></label>'
    + '</div>'
    + (cfg.enabled
      ? '<div class="sp-setup-fields">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">SharePoint site URL</label>'
        + '<input class="form-input" placeholder="https://contoso.sharepoint.com/sites/compliance" value="' + escapeHTML(state.sharePointConfig.siteUrl || '') + '" oninput="setSharePointConfigField(\'siteUrl\',this.value);">'
        + '<div class="form-hint">Your organization\'s compliance or GRC site.</div></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Document library</label>'
        + '<input class="form-input" placeholder="Evidence" value="' + escapeHTML(state.sharePointConfig.libraryName || 'Evidence') + '" oninput="setSharePointConfigField(\'libraryName\',this.value);"></div>'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Default folder path</label>'
        + '<input class="form-input" placeholder="GRC/Evidence" value="' + escapeHTML(state.sharePointConfig.defaultFolder || '') + '" oninput="setSharePointConfigField(\'defaultFolder\',this.value);"></div>'
        + '</div>'
        + '<div class="sp-setup-actions">'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="openSharePointSite()">Open site</button>'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="openSharePointEvidenceFolder()">Open evidence folder</button>'
        + '</div></div>'
      : '<div class="sp-setup-off">Enable to link control evidence directly to SharePoint documents.</div>')
    + '</div>';
}

function addSharePointEvidence(ctrlId) {
  if (!state.controlStatus) state.controlStatus = {};
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = { status: 'Not Started', evidence: [] };
  if (!state.controlStatus[ctrlId].evidence) state.controlStatus[ctrlId].evidence = [];
  state.controlStatus[ctrlId].evidence.push({
    kind: 'sharepoint',
    type: 'Document',
    title: '',
    description: '',
    url: '',
    spPath: ''
  });
  markDirty();
  renderControlStep2();
}

function applySharePointPathToEvidence(ctrlId, idx, path) {
  if (!state.controlStatus[ctrlId] || !state.controlStatus[ctrlId].evidence[idx]) return;
  var row = state.controlStatus[ctrlId].evidence[idx];
  row.spPath = path;
  if (!row.url || !isSharePointUrl(row.url)) {
    row.url = buildSharePointEvidenceUrl(path);
    row.ref = row.url;
  }
  markDirty();
  renderControlStep2();
}

// ─── Google Drive evidence helpers ────────────────────────────────────────────

function getGoogleDriveConfig() {
  var cfg = state.googleDriveConfig || {};
  return {
    enabled: !!cfg.enabled,
    folderUrl: String(cfg.folderUrl || '').trim()
  };
}

function isGoogleDriveUrl(url) {
  return /drive\.google\.com/i.test(String(url || '')) || /docs\.google\.com/i.test(String(url || ''));
}

function openGoogleDriveFolder() {
  var cfg = getGoogleDriveConfig();
  if (!cfg.folderUrl) {
    showToast('Set your Google Drive evidence folder URL in Program setup first.', true);
    return;
  }
  window.open(cfg.folderUrl, '_blank', 'noopener,noreferrer');
}

function setGoogleDriveConfigField(field, value) {
  if (!state.googleDriveConfig) state.googleDriveConfig = { enabled: false, folderUrl: '' };
  var prev = state.googleDriveConfig[field];
  state.googleDriveConfig[field] = value;
  if (field === 'enabled') state.googleDriveConfig.enabled = !!value;
  logFieldChange('googleDriveConfig.' + field, prev, value);
  markDirty();
}

function renderGoogleDriveSetupCardHtml() {
  var cfg = getGoogleDriveConfig();
  return '<div class="sp-setup-card">'
    + '<div class="sp-setup-head">'
    + '<div><div class="sp-setup-title">Evidence in Google Drive</div>'
    + '<div class="sp-setup-sub">Link control evidence to files in Google Drive — we store links, not copies.</div></div>'
    + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (cfg.enabled ? ' checked' : '') + ' onchange="setGoogleDriveConfigField(\'enabled\',this.checked);if(typeof refreshCurrentCisoStep===\'function\')refreshCurrentCisoStep();"><span class="fw-toggle-track"></span></label>'
    + '</div>'
    + (cfg.enabled
      ? '<div class="sp-setup-fields">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Evidence folder URL</label>'
        + '<input class="form-input" placeholder="https://drive.google.com/drive/folders/..." value="' + escapeHTML(state.googleDriveConfig.folderUrl || '') + '" oninput="setGoogleDriveConfigField(\'folderUrl\',this.value);">'
        + '<div class="form-hint">Right-click your evidence folder in Google Drive → Get link → paste here.</div></div>'
        + '<div class="sp-setup-actions">'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="openGoogleDriveFolder()">Open folder</button>'
        + '</div></div>'
      : '<div class="sp-setup-off">Enable to link control evidence directly to Google Drive documents.</div>')
    + '</div>';
}

function addGoogleDriveEvidence(ctrlId) {
  if (!state.controlStatus) state.controlStatus = {};
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = { status: 'Not Started', evidence: [] };
  if (!state.controlStatus[ctrlId].evidence) state.controlStatus[ctrlId].evidence = [];
  state.controlStatus[ctrlId].evidence.push({
    kind: 'gdrive',
    type: 'Document',
    title: '',
    description: '',
    url: ''
  });
  markDirty();
  renderControlStep2();
}

// ─── OneDrive evidence helpers ────────────────────────────────────────────────

function getOneDriveConfig() {
  var cfg = state.oneDriveConfig || {};
  return {
    enabled: !!cfg.enabled,
    folderUrl: String(cfg.folderUrl || '').trim()
  };
}

function isOneDriveUrl(url) {
  var s = String(url || '');
  return /onedrive\.live\.com/i.test(s) || /1drv\.ms/i.test(s) || /-my\.sharepoint\.com/i.test(s);
}

function openOneDriveFolder() {
  var cfg = getOneDriveConfig();
  if (!cfg.folderUrl) {
    showToast('Set your OneDrive evidence folder URL in Program setup first.', true);
    return;
  }
  window.open(cfg.folderUrl, '_blank', 'noopener,noreferrer');
}

function setOneDriveConfigField(field, value) {
  if (!state.oneDriveConfig) state.oneDriveConfig = { enabled: false, folderUrl: '' };
  var prev = state.oneDriveConfig[field];
  state.oneDriveConfig[field] = value;
  if (field === 'enabled') state.oneDriveConfig.enabled = !!value;
  logFieldChange('oneDriveConfig.' + field, prev, value);
  markDirty();
}

function renderOneDriveSetupCardHtml() {
  var cfg = getOneDriveConfig();
  return '<div class="sp-setup-card">'
    + '<div class="sp-setup-head">'
    + '<div><div class="sp-setup-title">Evidence in OneDrive</div>'
    + '<div class="sp-setup-sub">Link control evidence to files in OneDrive — we store links, not copies.</div></div>'
    + '<label class="fw-toggle" onclick="event.stopPropagation();"><input type="checkbox"' + (cfg.enabled ? ' checked' : '') + ' onchange="setOneDriveConfigField(\'enabled\',this.checked);if(typeof refreshCurrentCisoStep===\'function\')refreshCurrentCisoStep();"><span class="fw-toggle-track"></span></label>'
    + '</div>'
    + (cfg.enabled
      ? '<div class="sp-setup-fields">'
        + '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Evidence folder URL</label>'
        + '<input class="form-input" placeholder="https://onedrive.live.com/..." value="' + escapeHTML(state.oneDriveConfig.folderUrl || '') + '" oninput="setOneDriveConfigField(\'folderUrl\',this.value);">'
        + '<div class="form-hint">Open your evidence folder in OneDrive → Share → Copy link → paste here.</div></div>'
        + '<div class="sp-setup-actions">'
        + '<button type="button" class="btn btn-secondary btn-sm" onclick="openOneDriveFolder()">Open folder</button>'
        + '</div></div>'
      : '<div class="sp-setup-off">Enable to link control evidence directly to OneDrive documents.</div>')
    + '</div>';
}

function addOneDriveEvidence(ctrlId) {
  if (!state.controlStatus) state.controlStatus = {};
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = { status: 'Not Started', evidence: [] };
  if (!state.controlStatus[ctrlId].evidence) state.controlStatus[ctrlId].evidence = [];
  state.controlStatus[ctrlId].evidence.push({
    kind: 'onedrive',
    type: 'Document',
    title: '',
    description: '',
    url: ''
  });
  markDirty();
  renderControlStep2();
}
