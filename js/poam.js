// js/poam.js — Findings & POA&M tracker (NIST CA-5 / PM-4 alignment)

var POAM_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
var POAM_STATUSES = ['Open', 'In Progress', 'Mitigated', 'Risk Accepted', 'Closed'];

function ensurePoamState() {
  if (!Array.isArray(state.poamItems)) state.poamItems = [];
}

function generatePoamId() {
  return 'poam-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function getPoamOpenCount() {
  ensurePoamState();
  return state.poamItems.filter(function(p) {
    return p.status !== 'Closed' && p.status !== 'Mitigated' && p.status !== 'Risk Accepted';
  }).length;
}

function getPoamOverdueCount() {
  ensurePoamState();
  var today = new Date().toISOString().slice(0, 10);
  return state.poamItems.filter(function(p) {
    return p.dueDate && p.dueDate < today && p.status !== 'Closed' && p.status !== 'Mitigated' && p.status !== 'Risk Accepted';
  }).length;
}

function addPoamItem(data) {
  ensurePoamState();
  var item = {
    id: generatePoamId(),
    controlId: String(data.controlId || '').trim().toUpperCase(),
    finding: String(data.finding || '').trim(),
    severity: POAM_SEVERITIES.indexOf(data.severity) !== -1 ? data.severity : 'Medium',
    status: 'Open',
    dueDate: data.dueDate || '',
    assignee: String(data.assignee || '').trim(),
    createdDate: new Date().toISOString().slice(0, 10),
    closedDate: '',
    mitigationPlan: String(data.mitigationPlan || '').trim(),
    evidenceRef: String(data.evidenceRef || '').trim()
  };
  if (!item.finding) {
    showToast('Finding description is required.', true);
    return null;
  }
  state.poamItems.push(item);
  addAuditEntry('poam', item.id, 'POA&M opened: ' + item.severity + ' — ' + item.finding.slice(0, 80));
  markDirty();
  renderPoamTab();
  if (typeof renderHomeTab === 'function') renderHomeTab();
  if (typeof updateNotificationBadges === 'function') updateNotificationBadges();
  return item;
}

function updatePoamField(id, field, value) {
  ensurePoamState();
  var item = state.poamItems.find(function(p) { return p.id === id; });
  if (!item) return;
  var prev = item[field];
  item[field] = value;
  if (field === 'status' && (value === 'Closed' || value === 'Mitigated')) {
    item.closedDate = new Date().toISOString().slice(0, 10);
  }
  logFieldChange('poamItems.' + id + '.' + field, prev, value);
  markDirty();
}

function deletePoamItem(id) {
  if (!window.confirm('Delete this POA&M item?')) return;
  ensurePoamState();
  state.poamItems = state.poamItems.filter(function(p) { return p.id !== id; });
  addAuditEntry('poam', id, 'POA&M item deleted.');
  markDirty();
  renderPoamTab();
}

function openAddPoamModal(prefillControlId) {
  var controls = typeof getActiveControls === 'function' ? getActiveControls() : [];
  var ctrlOpts = controls.slice(0, 400).map(function(c) {
    return '<option value="' + escapeHTML(c.id) + '"' + (prefillControlId === c.id ? ' selected' : '') + '>' + escapeHTML(c.id) + ' — ' + escapeHTML(c.n || '') + '</option>';
  }).join('');
  var overlay = document.createElement('div');
  overlay.id = 'poamModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:3000;display:flex;align-items:center;justify-content:center;padding:24px;';
  overlay.innerHTML = '<div class="poam-modal-card" role="dialog" aria-modal="true">'
    + '<h2 style="margin:0 0 16px;font-size:20px;font-weight:700;">New finding / POA&M item</h2>'
    + '<div class="form-group"><label class="form-label">Related control</label>'
    + '<select id="poamNewControl" class="form-select"><option value="">— optional —</option>' + ctrlOpts + '</select></div>'
    + '<div class="form-group"><label class="form-label">Finding <span class="required">*</span></label>'
    + '<textarea id="poamNewFinding" class="form-input" rows="3" placeholder="Describe the weakness or assessment finding…"></textarea></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    + '<div class="form-group" style="margin:0"><label class="form-label">Severity</label>'
    + '<select id="poamNewSeverity" class="form-select">' + POAM_SEVERITIES.map(function(s) {
      return '<option' + (s === 'Medium' ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select></div>'
    + '<div class="form-group" style="margin:0"><label class="form-label">Due date</label>'
    + '<input id="poamNewDue" type="date" class="form-input"></div></div>'
    + '<div class="form-group"><label class="form-label">Assignee</label>'
    + '<input id="poamNewAssignee" class="form-input" placeholder="Name or email"></div>'
    + '<div class="form-group"><label class="form-label">Mitigation plan</label>'
    + '<textarea id="poamNewPlan" class="form-input" rows="2" placeholder="Planned remediation steps…"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">'
    + '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\'poamModalOverlay\').remove()">Cancel</button>'
    + '<button type="button" class="btn btn-primary" onclick="submitNewPoamFromModal()">Add to POA&M</button>'
    + '</div></div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function submitNewPoamFromModal() {
  var item = addPoamItem({
    controlId: (document.getElementById('poamNewControl') || {}).value || '',
    finding: (document.getElementById('poamNewFinding') || {}).value || '',
    severity: (document.getElementById('poamNewSeverity') || {}).value || 'Medium',
    dueDate: (document.getElementById('poamNewDue') || {}).value || '',
    assignee: (document.getElementById('poamNewAssignee') || {}).value || '',
    mitigationPlan: (document.getElementById('poamNewPlan') || {}).value || ''
  });
  if (item) {
    var ov = document.getElementById('poamModalOverlay');
    if (ov) ov.remove();
    showToast('POA&M item added.');
  }
}

function poamSeverityClass(sev) {
  if (sev === 'Critical') return 'poam-sev-critical';
  if (sev === 'High') return 'poam-sev-high';
  if (sev === 'Low') return 'poam-sev-low';
  return 'poam-sev-medium';
}

function renderPoamTab() {
  var body = document.getElementById('poam-body');
  if (!body) return;
  ensurePoamState();
  var filter = state._poamFilter || 'open';
  var search = (state._poamSearch || '').toLowerCase();
  var today = new Date().toISOString().slice(0, 10);
  var items = state.poamItems.slice().filter(function(p) {
    if (filter === 'open' && (p.status === 'Closed' || p.status === 'Mitigated' || p.status === 'Risk Accepted')) return false;
    if (filter === 'overdue' && (!p.dueDate || p.dueDate >= today || p.status === 'Closed' || p.status === 'Mitigated' || p.status === 'Risk Accepted')) return false;
    if (filter === 'closed' && p.status !== 'Closed' && p.status !== 'Mitigated' && p.status !== 'Risk Accepted') return false;
    if (search) {
      var blob = (p.finding + ' ' + p.controlId + ' ' + p.assignee).toLowerCase();
      if (blob.indexOf(search) === -1) return false;
    }
    return true;
  });
  items.sort(function(a, b) {
    var sa = POAM_SEVERITIES.indexOf(a.severity);
    var sb = POAM_SEVERITIES.indexOf(b.severity);
    if (sa !== sb) return sa - sb;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });

  var open = getPoamOpenCount();
  var overdue = getPoamOverdueCount();

  var rows = items.map(function(p) {
    var isOverdue = p.dueDate && p.dueDate < today && p.status !== 'Closed' && p.status !== 'Mitigated' && p.status !== 'Risk Accepted';
    return '<tr class="poam-row' + (isOverdue ? ' poam-row-overdue' : '') + '">'
      + '<td><span class="poam-sev-pill ' + poamSeverityClass(p.severity) + '">' + escapeHTML(p.severity) + '</span></td>'
      + '<td style="font-weight:700;font-family:monospace;font-size:12px;">' + escapeHTML(p.controlId || '—') + '</td>'
      + '<td style="font-size:13px;max-width:320px;">' + escapeHTML(p.finding) + '</td>'
      + '<td><select class="form-select poam-inline-select" onchange="updatePoamField(\'' + p.id.replace(/'/g, "\\'") + '\',\'status\',this.value);renderPoamTab();">'
      + POAM_STATUSES.map(function(s) {
        return '<option' + (p.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') + '</select></td>'
      + '<td><input type="date" class="form-input poam-inline-date" value="' + escapeHTML(p.dueDate || '') + '" onchange="updatePoamField(\'' + p.id.replace(/'/g, "\\'") + '\',\'dueDate\',this.value);renderPoamTab();"></td>'
      + '<td><input class="form-input poam-inline-input" value="' + escapeHTML(p.assignee || '') + '" oninput="updatePoamField(\'' + p.id.replace(/'/g, "\\'") + '\',\'assignee\',this.value)"></td>'
      + '<td style="white-space:nowrap;">'
      + (p.controlId ? '<button type="button" class="btn btn-secondary btn-sm" onclick="state._selectedCtrl=\'' + p.controlId.replace(/'/g, "\\'") + '\';showTab(\'control\');goToStep(\'control\',2);">Control →</button> ' : '')
      + '<button type="button" class="btn btn-secondary btn-sm" style="color:var(--red);" onclick="deletePoamItem(\'' + p.id.replace(/'/g, "\\'") + '\')">Delete</button>'
      + '</td></tr>';
  }).join('');

  body.innerHTML = ''
    + '<div class="poam-stats">'
    + '<div class="poam-stat-card"><div class="poam-stat-num">' + open + '</div><div class="poam-stat-label">Open items</div></div>'
    + '<div class="poam-stat-card poam-stat-warn"><div class="poam-stat-num">' + overdue + '</div><div class="poam-stat-label">Overdue</div></div>'
    + '<div class="poam-stat-card"><div class="poam-stat-num">' + state.poamItems.length + '</div><div class="poam-stat-label">Total tracked</div></div>'
    + '<button type="button" class="btn btn-primary" style="margin-left:auto;align-self:center;" onclick="openAddPoamModal()">+ New finding</button>'
    + '</div>'
    + '<div class="poam-toolbar">'
    + '<input class="form-input" placeholder="Search findings…" value="' + escapeHTML(state._poamSearch || '') + '" oninput="state._poamSearch=this.value;renderPoamTab();" style="max-width:260px;">'
    + ['open', 'overdue', 'all', 'closed'].map(function(f) {
      return '<button type="button" class="poam-filter-chip' + (filter === f ? ' active' : '') + '" onclick="state._poamFilter=\'' + f + '\';renderPoamTab();">' + f + '</button>';
    }).join('')
    + '</div>'
    + '<div class="poam-table-wrap"><table class="control-table poam-table"><thead><tr>'
    + '<th>Severity</th><th>Control</th><th>Finding</th><th>Status</th><th>Due</th><th>Assignee</th><th></th>'
    + '</tr></thead><tbody>'
    + (rows || '<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted);">No findings yet — add assessment results or control gaps here.</td></tr>')
    + '</tbody></table></div>';
}

function renderPoamSummaryHtml() {
  ensurePoamState();
  var open = getPoamOpenCount();
  var overdue = getPoamOverdueCount();
  if (!state.poamItems.length) return '';
  return '<div class="hub-poam-strip" role="button" tabindex="0" onclick="showTab(\'poam\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();showTab(\'poam\');}">'
    + '<div><strong>' + open + '</strong> open POA&M' + (overdue ? ' · <span style="color:var(--red);">' + overdue + ' overdue</span>' : '') + '</div>'
    + '<span class="hub-link">View POA&M →</span></div>';
}
