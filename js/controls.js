// js/controls.js — control implementation workspace & library. Split from app.js (Step 4).
// Load after policies.js; globals only.

// ============================================================
// CONTROL OWNER TAB
// ============================================================
function renderControlTab() {
  var workspace = document.getElementById('control-workspace-panel');
  var library = document.getElementById('control-library-panel');
  var controlNav = document.getElementById('nav-control');
  if (controlNav) controlNav.classList.toggle('active', !state._controlLibraryMode);
  if (state._controlLibraryMode) {
    if (workspace) workspace.style.display = 'none';
    if (library) library.style.display = '';
    renderControlLibraryView();
    return;
  }
  if (library) library.style.display = 'none';
  if (workspace) workspace.style.display = '';
  renderControlStep(currentStep.control);
}

function getControlComplianceSummary(controlId) {
  var totalTargets = 0;
  var answered = 0;
  var complies = 0;
  var statuses = {};
  (state.assets || []).forEach(function(a) {
    var controls = getAssetSSPControls(a) || [];
    if (!controls.some(function(c) { return c.id === controlId; })) return;
    totalTargets++;
    var att = ((state.sspAttestations || {})[a.id] || {})[controlId] || {};
    if (att.status) {
      answered++;
      statuses[att.status] = (statuses[att.status] || 0) + 1;
      if (att.status === 'Complies') complies++;
    }
  });
  (state.processes || []).forEach(function(p) {
    var controls = getProcessSSPControls(p) || [];
    if (!controls.some(function(c) { return c.id === controlId; })) return;
    totalTargets++;
    var att = ((state.sspAttestations || {})[p.id] || {})[controlId] || {};
    if (att.status) {
      answered++;
      statuses[att.status] = (statuses[att.status] || 0) + 1;
      if (att.status === 'Complies') complies++;
    }
  });
  var pct = answered ? Math.round((complies / answered) * 100) : null;
  return { totalTargets: totalTargets, answered: answered, complies: complies, pct: pct, statuses: statuses };
}

function getControlDeselectLifecycle(ctrlId) {
  var cs = state.controlStatus[ctrlId] || {};
  var proposed = !!cs.recommendedDeselect;
  var decision = cs.deselectDecision || '';
  var status = 'Not Proposed';
  if (proposed && !decision) status = 'Proposed';
  if (decision === 'Approved') status = 'Approved';
  if (decision === 'Rejected') status = 'Rejected';
  return {
    status: status,
    proposed: proposed,
    reason: cs.deselectReason || '',
    proposedAt: cs.deselectProposedAt || '',
    proposedBy: cs.deselectProposedBy || '',
    decidedAt: cs.deselectDecidedAt || '',
    decidedBy: cs.deselectDecidedBy || '',
    decisionReason: cs.deselectDecisionReason || ''
  };
}

function renderControlLibraryView() {
  var body = document.getElementById('control-library-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div><p>Complete baseline selection to generate the control catalog.</p></div>';
    return;
  }
  var controls = getActiveControls();
  var families = Array.from(new Set(controls.map(function(c) { return c.f; }))).sort();
  var allTypeLabels = [];
  ASSET_TYPES.forEach(function(cat) { cat.types.forEach(function(t) { allTypeLabels.push(t.label); }); });
  (state.customAssetTypes || []).forEach(function(t) { if (t && !allTypeLabels.includes(t)) allTypeLabels.push(t); });
  var familyFilter = state._controlLibraryFamilyFilter || '';
  var statusFilter = state._controlLibraryStatusFilter || '';
  var assetTypeFilter = state._controlLibraryAssetTypeFilter || '';
  var q = (state._controlLibrarySearch || '').toLowerCase();
  var cf = state._controlLibraryColFilters || {};
  function inActiveBaseline(c) {
    return c.bl && (c.bl.indexOf(state.baseline) !== -1 || (state.privacyOverlay && c.bl.indexOf('P') !== -1));
  }
  var deselectBaselineCount = controls.filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    return cs.deselectDecision === 'Approved' && inActiveBaseline(c);
  }).length;
  var rows = controls.filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    var status = cs.status || 'Not Started';
    var cov = getCtrlCoveredAssetTypes(c.id).map(function(t) { return t.label; });
    var typeMatch = !assetTypeFilter || cov.includes(assetTypeFilter);
    var qMatch = !q || c.id.toLowerCase().includes(q) || c.n.toLowerCase().includes(q);
    var deselBaseline = cs.deselectDecision === 'Approved' && inActiveBaseline(c);
    if (statusFilter === '__deselected__' && !deselBaseline) return false;
    if (!(!familyFilter || c.f === familyFilter) || !(!statusFilter || statusFilter === '__deselected__' || status === statusFilter) || !typeMatch || !qMatch) return false;
    // Per-column text filters
    var owner = (state.controlOwners || {})[c.id] || {};
    if (cf.control && !c.id.toLowerCase().includes(cf.control.toLowerCase())) return false;
    if (cf.name && !c.n.toLowerCase().includes(cf.name.toLowerCase())) return false;
    if (cf.owner && !(owner.name || 'Unassigned').toLowerCase().includes(cf.owner.toLowerCase())) return false;
    if (cf.impl && !status.toLowerCase().includes(cf.impl.toLowerCase())) return false;
    if (cf.asset && !cov.join(' ').toLowerCase().includes(cf.asset.toLowerCase())) return false;
    if (cf.lifecycle) {
      var lc = getControlDeselectLifecycle(c.id);
      if (!lc.status.toLowerCase().includes(cf.lifecycle.toLowerCase())) return false;
    }
    return true;
  });
  var selectedTypeCount = rows.filter(function(c) { return getCtrlCoveredAssetTypes(c.id).length > 0; }).length;
  var designedCount = rows.filter(function(c) { return isControlDesigned(c.id); }).length;
  body.innerHTML = (deselectBaselineCount ? '<div class="callout-deselected-baseline" style="border:1px solid #f59e0b;background:#fffbeb;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:12px;color:#92400e;"><strong>Baseline de-selections:</strong> ' + deselectBaselineCount + ' control(s) are formally de-selected from the active baseline but remain visible here for traceability. Use the status filter <em>De-selected (baseline)</em> to list them.</div>' : '')
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">'
    + '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">Controls</div><div style="font-size:24px;font-weight:800;color:#1d4ed8;">' + rows.length + '</div></div>'
    + '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;">Designed</div><div style="font-size:24px;font-weight:800;color:#166534;">' + designedCount + '</div></div>'
    + '<div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#6366f1;text-transform:uppercase;">With Asset Applicability</div><div style="font-size:24px;font-weight:800;color:#6366f1;">' + selectedTypeCount + '</div></div>'
    + '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;"><div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;">De-select Proposed</div><div style="font-size:24px;font-weight:800;color:#92400e;">' + rows.filter(function(c){ return (state.controlStatus[c.id]||{}).recommendedDeselect; }).length + '</div></div>'
    + '</div>'
    + '<div class="filter-bar" style="margin-bottom:12px;">'
    + '<input class="form-input" value="' + escapeHTML(state._controlLibrarySearch || '') + '" placeholder="Search control ID or name..." oninput="state._controlLibrarySearch=this.value;renderControlLibraryView()">'
    + '<select class="form-select" onchange="state._controlLibraryFamilyFilter=this.value;renderControlLibraryView()"><option value="">All families</option>'
    + families.map(function(f){ return '<option value="' + f + '"' + (familyFilter===f?' selected':'') + '>' + f + ' — ' + (FAMILIES[f]||f) + '</option>'; }).join('')
    + '</select>'
    + '<select class="form-select" onchange="state._controlLibraryStatusFilter=this.value;renderControlLibraryView()"><option value="">All statuses</option>'
    + ['Not Started','Planned','In Progress','Implemented','Not Applicable','Inherited'].map(function(s){ return '<option' + (statusFilter===s?' selected':'') + '>' + s + '</option>'; }).join('')
    + '<option value="__deselected__"' + (statusFilter==='__deselected__'?' selected':'') + '>De-selected (baseline)</option>'
    + '</select>'
    + '<select class="form-select" onchange="state._controlLibraryAssetTypeFilter=this.value;renderControlLibraryView()"><option value="">All asset types</option>'
    + allTypeLabels.map(function(t){ return '<option value="' + escapeHTML(t) + '"' + (assetTypeFilter===t?' selected':'') + '>' + escapeHTML(t) + '</option>'; }).join('')
    + '</select>'
    + '</div>'
    + (function(){
        var fi = 'style="width:100%;box-sizing:border-box;padding:3px 6px;font-size:11px;border:1px solid var(--border);border-radius:5px;background:var(--bg);color:var(--navy);font-family:inherit;" placeholder="Filter…" onclick="event.stopPropagation()"';
        var cfv = state._controlLibraryColFilters || {};
        function fval(k){ return escapeHTML(cfv[k]||''); }
        function finput(k){ return '<input ' + fi + ' value="' + fval(k) + '" oninput="if(!state._controlLibraryColFilters)state._controlLibraryColFilters={};state._controlLibraryColFilters[\'' + k + '\']=this.value;renderControlLibraryView()">'; }
        return '<div class="table-scroll"><table class="control-table"><thead>'
          + '<tr><th style="width:92px;">Control</th><th>Name</th><th style="width:150px;">Owner</th><th style="width:120px;">Implementation</th><th style="width:220px;">Asset Applicability</th><th style="width:90px;">Req Targets</th><th style="width:110px;">Compliance</th><th style="width:140px;">De-select Lifecycle</th></tr>'
          + '<tr style="background:var(--bg);">'
          + '<th style="padding:4px 6px;">' + finput('control') + '</th>'
          + '<th style="padding:4px 6px;">' + finput('name') + '</th>'
          + '<th style="padding:4px 6px;">' + finput('owner') + '</th>'
          + '<th style="padding:4px 6px;">' + finput('impl') + '</th>'
          + '<th style="padding:4px 6px;">' + finput('asset') + '</th>'
          + '<th style="padding:4px 6px;"></th>'
          + '<th style="padding:4px 6px;"></th>'
          + '<th style="padding:4px 6px;">' + finput('lifecycle') + '</th>'
          + '</tr>'
          + '</thead><tbody>';
      })()
    + rows.map(function(c) {
      var cs = state.controlStatus[c.id] || {};
      var owner = (state.controlOwners || {})[c.id] || {};
      var cov = getCtrlCoveredAssetTypes(c.id).map(function(t) { return t.label; });
      var linksCount = (cs.linkedAssets || []).length + (cs.linkedProcesses || []).length;
      var compliance = getControlComplianceSummary(c.id);
      var lifecycle = getControlDeselectLifecycle(c.id);
      var lcColor = lifecycle.status === 'Approved' ? '#166534' : lifecycle.status === 'Rejected' ? '#b45309' : lifecycle.status === 'Proposed' ? '#92400e' : '#64748b';
      var deselBaseline = cs.deselectDecision === 'Approved' && inActiveBaseline(c);
      return '<tr class="' + (deselBaseline ? 'tr-deselected-baseline ' : '') + 'control-lib-row" style="cursor:pointer;" onclick="openControlFromLibrary(\'' + c.id.replace(/'/g,"\\'") + '\')">'
        + '<td><span class="control-id">' + c.id + '</span></td>'
        + '<td style="font-size:12px;color:var(--navy);">' + escapeHTML(c.n) + '</td>'
        + '<td style="font-size:12px;color:var(--text-muted);">' + escapeHTML(owner.name || 'Unassigned') + '</td>'
        + '<td>' + chipHTML(cs.status || 'Not Started') + '</td>'
        + '<td style="font-size:11px;color:var(--text-muted);">' + (cov.length ? escapeHTML(cov.slice(0, 2).join(' · ')) + (cov.length > 2 ? ' +' + (cov.length - 2) : '') : 'Not scoped') + '</td>'
        + '<td style="font-size:12px;color:var(--navy);">' + linksCount + '</td>'
        + '<td style="font-size:11px;color:var(--text-muted);">' + (compliance.pct === null ? 'Pending' : compliance.pct + '%') + (compliance.totalTargets ? '<div style="font-size:10px;">' + compliance.answered + '/' + compliance.totalTargets + ' attested</div>' : '<div style="font-size:10px;">No targets yet</div>') + '</td>'
        + '<td style="font-size:11px;color:' + lcColor + ';font-weight:700;">' + lifecycle.status + (lifecycle.reason ? '<div style="font-size:10px;color:var(--text-muted);font-weight:400;">' + escapeHTML(lifecycle.reason.slice(0, 56)) + (lifecycle.reason.length > 56 ? '…' : '') + '</div>' : '') + '</td>'
        + '</tr>';
    }).join('')
    + '</tbody></table></div>';
}

function renderControlStep(step) {
  if (step===1) renderControlStep1();
  if (step===2) renderControlStep2();
  if (step===3) renderControlStep3();
  if (step===4) renderControlStep4();
}

// ── STEP 1: MY CONTROLS ──────────────────────────────────────────────────────
function renderControlStep1() {
  const body = document.getElementById('control-step-1-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div><p>The CISO must complete program setup to select controls and assign owners.</p><button class="btn btn-primary" onclick="goToProgramSetupOrDashboard()" style="margin-top:16px;">${state.cisoComplete ? 'Go to Dashboard →' : 'Go to CISO Setup →'}</button></div>`;
    return;
  }
  const allControls = getScopedControls();
  const controls    = allControls.filter(c => !(state.controlStatus[c.id]||{}).returnedToPolicyOwner && !(state.controlStatus[c.id]||{}).recommendedDeselect);
  const returnedControls = allControls.filter(c => (state.controlStatus[c.id]||{}).returnedToPolicyOwner);
  const deselectControls = allControls.filter(c => (state.controlStatus[c.id]||{}).recommendedDeselect);
  const families = [...new Set(controls.map(c => c.f).filter(Boolean))];

  if (allControls.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Assigned</div><p>The CISO must assign controls to you before you can document implementation.</p><button class="btn btn-primary" onclick="goToProgramSetupOrDashboard()" style="margin-top:16px;">${state.cisoComplete ? 'Go to Dashboard →' : 'View CISO Setup →'}</button></div>`;
    return;
  }
  const now  = new Date();
  const soon = new Date(now.getTime() + 30*24*60*60*1000);

  const totalDesigned = controls.filter(c => {
    const cs = state.controlStatus[c.id]||{};
    return cs.designSource || (cs.approach && cs.approach.trim()) || (cs.designParts && Object.values(cs.designParts).some(v => v && v.trim()));
  }).length;
  const totalInProg = controls.filter(c => ['In Progress','Planned'].includes((state.controlStatus[c.id]||{}).status)).length;
  const totalNA     = controls.filter(c => (state.controlStatus[c.id]||{}).status === 'Not Applicable').length;
  const pctDesigned = controls.length ? Math.round((totalDesigned / controls.length) * 100) : 0;

  const dueSoon = controls.filter(c => {
    const dd = (state.controlOwners||{})[c.id]?.dueDate;
    if (!dd) return false;
    const d = new Date(dd);
    return d >= now && d <= soon && (state.controlStatus[c.id]||{}).status !== 'Implemented';
  }).length;

  body.innerHTML = `
    <div class="section-title">${state.currentUserId ? 'My Controls' : 'Control Library'}</div>
    <div class="section-subtitle">${controls.length} controls in your design queue — ${state.baseline==='L'?'Low':state.baseline==='M'?'Moderate':'High'} baseline${state.privacyOverlay?' + Privacy Overlay':''}</div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
      ${[
        ['Designed',    totalDesigned,                                          '#166534','#dcfce7','✅'],
        ['In Progress', totalInProg,                                            '#92400e','#fef3c7','🔄'],
        ['Not Started', controls.length - totalDesigned - totalInProg - totalNA,'#1e3a5f','#eff6ff','⏳'],
        ['N / A',       totalNA,                                                '#64748b','#f1f5f9','—'],
      ].map(([label,count,color,bg,icon]) => `
        <div style="background:${bg};border:1px solid ${color}22;border-radius:10px;padding:14px 16px;border-left:3px solid ${color};">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${color};">${label}</div>
            <div style="font-size:18px;">${icon}</div>
          </div>
          <div style="font-size:28px;font-weight:800;color:${color};line-height:1.1;margin-top:4px;">${count}</div>
          <div style="font-size:10px;color:${color};opacity:0.7;margin-top:2px;">of ${controls.length} controls</div>
        </div>`).join('')}
    </div>

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;color:var(--navy);">Design Progress</div>
        <div style="font-size:13px;font-weight:700;color:var(--teal);">${pctDesigned}% designed</div>
      </div>
      <div style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;">
        <div style="background:var(--teal);height:100%;width:${pctDesigned}%;border-radius:99px;transition:width 0.3s;"></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">A control is "designed" when you've documented the implementation approach in Step 2.</div>
    </div>

    ${dueSoon > 0 ? `<div class="info-alert" style="border-color:#f59e0b;background:#fffbeb;margin-bottom:16px;">
      <div class="ia-icon">⚠️</div>
      <div class="ia-text"><strong>${dueSoon} control${dueSoon>1?'s have':' has'} a due date within 30 days</strong> and ${dueSoon>1?'are':'is'} not yet designed. Head to Step 2 to document these first.</div>
    </div>` : ''}

    <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#1e40af;">
      <strong>💡 Tip:</strong> Use <strong>↩ Return</strong> if a control was assigned to you in error. Use <strong>✗ Propose De-select</strong> if you believe a control should not be in scope — both go back to the policy owner for action.
    </div>

    <div class="filter-bar">
      <input type="text" id="ctrlSearch" placeholder="🔍  Search by ID or name…" oninput="filterControlList()">
      <select id="ctrlFamilyFilter" onchange="filterControlList()">
        <option value="">All Families</option>
        ${families.map(f=>`<option value="${f}">${f} — ${FAMILIES[f]||f}</option>`).join('')}
      </select>
      <select id="ctrlStatusFilter" onchange="filterControlList()">
        <option value="">All Statuses</option>
        <option>Not Started</option><option>Planned</option><option>In Progress</option><option>Implemented</option><option>Not Applicable</option>
      </select>
      <select id="ctrlDeselectFilter" onchange="filterControlList()" title="Filter by baseline de-selection status">
        <option value="">All scope states</option>
        <option value="deselected">De-selected (baseline) only</option>
      </select>
    </div>

    <div class="table-scroll">
      <table class="control-table" id="controlInventoryTable">
        <thead>
          <tr>
            <th style="width:80px;">Control</th>
            <th>Name</th>
            <th style="width:70px;">Family</th>
            <th style="width:90px;">Baselines</th>
            <th style="width:90px;">Policy Req.</th>
            <th style="width:140px;">Owner</th>
            <th style="width:95px;">Due Date</th>
            <th style="width:120px;">Status</th>
            <th style="width:150px;">Actions</th>
          </tr>
        </thead>
        <tbody id="ctrlMainTbody">
          ${controls.map(c => {
            const cs  = state.controlStatus[c.id] || {};
            const co  = (state.controlOwners||{})[c.id] || {};
            const st  = cs.status || 'Not Started';
            const dd  = co.dueDate;
            const isDueSoon = dd && new Date(dd)>=now && new Date(dd)<=soon && st!=='Implemented';
            const ddStr = dd ? new Date(dd).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'}) : '—';
            const pReqs = getControlPolicyReqs(c.id);
            const pReqCell = pReqs.length
              ? `<span title="${pReqs.map(r=>r.reqId).join(', ')}" style="font-family:monospace;font-size:10px;font-weight:700;background:rgba(99,102,241,0.1);color:#6366f1;padding:2px 6px;border-radius:4px;cursor:default;">${pReqs.length} req${pReqs.length>1?'s':''}</span>`
              : `<span style="font-size:11px;color:var(--text-muted);font-style:italic;">—</span>`;
            const cid = c.id.replace(/'/g,"\\'");
            const deselBaseline = cs.deselectDecision === 'Approved' && c.bl && (c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P')));
            return `<tr data-id="${c.id}" data-family="${c.f}" data-status="${st}" data-deselected="${deselBaseline?'1':'0'}" class="${deselBaseline?'tr-deselected-baseline':''}" style="cursor:pointer;" onmouseover="this.style.background='rgba(13,148,136,0.04)'" onmouseout="this.style.background=''" onclick="goToControlDetail('${cid}')">
              <td><span class="control-id">${c.id}</span></td>
              <td style="font-size:13px;">${c.n}</td>
              <td><span class="family-badge">${c.f}</span></td>
              <td>${pillsHTML(c.bl)}</td>
              <td>${pReqCell}</td>
              <td style="font-size:12px;color:${co.name?'var(--navy)':'var(--text-muted)'};font-style:${co.name?'normal':'italic'};">${co.name||'Unassigned'}</td>
              <td style="font-size:12px;font-weight:${isDueSoon?'700':'400'};color:${isDueSoon?'#d97706':'var(--text-muted)'};">${ddStr}${isDueSoon?' ⚠️':''}</td>
              <td>${chipHTML(st)}</td>
              <td onclick="event.stopPropagation();" style="white-space:nowrap;">
                <button class="btn btn-sm" style="font-size:10px;padding:3px 7px;background:white;border:1px solid rgba(220,38,38,0.35);color:#dc2626;margin-right:3px;" onclick="returnControlToPolicyOwner('${cid}')" title="Return to policy owner — assigned in error">↩ Return</button>
                <button class="btn btn-sm" style="font-size:10px;padding:3px 7px;background:white;border:1px solid rgba(245,158,11,0.4);color:#d97706;" onclick="recommendControlDeselect('${cid}')" title="Propose this control be removed from scope">✗ De-select?</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    ${returnedControls.length > 0 ? `
    <div style="margin-top:20px;">
      <div style="font-size:12px;font-weight:700;color:#991b1b;padding:6px 0;border-bottom:1px solid #fca5a5;margin-bottom:8px;">↩ Returned to Policy Owner (${returnedControls.length})</div>
      ${returnedControls.map(c => {
        const cs  = state.controlStatus[c.id]||{};
        const cid = c.id.replace(/'/g,"\\'");
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;margin-bottom:6px;">
          <span class="control-id" style="opacity:0.7;">${c.id}</span>
          <span style="font-size:12px;color:var(--text-muted);">${c.n}</span>
          ${cs.returnReason ? `<span style="font-size:11px;color:#b91c1c;font-style:italic;">Reason: ${escapeHTML(cs.returnReason)}</span>` : ''}
          <button class="btn btn-sm" style="font-size:10px;padding:2px 7px;background:white;border:1px solid var(--border);color:var(--navy);margin-left:auto;" onclick="unreturnControl('${cid}')">Undo Return</button>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${deselectControls.length > 0 ? `
    <div style="margin-top:20px;">
      <div style="font-size:12px;font-weight:700;color:#92400e;padding:6px 0;border-bottom:1px solid #fcd34d;margin-bottom:6px;">✗ Proposed for De-selection (${deselectControls.length})</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">These controls are flagged as "Recommended for De-selection" and will appear in the policy owner's queue for decision.</div>
      ${deselectControls.map(c => {
        const cs  = state.controlStatus[c.id]||{};
        const cid = c.id.replace(/'/g,"\\'");
        const decision = cs.deselectDecision || 'Proposed';
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;margin-bottom:6px;">
          <span class="control-id" style="opacity:0.7;">${c.id}</span>
          <span style="font-size:12px;color:var(--text-muted);">${c.n}</span>
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${decision==='Approved'?'#166534':decision==='Rejected'?'#b45309':'#92400e'};">${decision}</span>
          ${cs.deselectReason ? `<span style="font-size:11px;color:#92400e;font-style:italic;">Reason: ${escapeHTML(cs.deselectReason)}</span>` : ''}
          ${cs.deselectDecisionReason ? `<span style="font-size:11px;color:#334155;font-style:italic;">Decision: ${escapeHTML(cs.deselectDecisionReason)}</span>` : ''}
          <button class="btn btn-sm" style="font-size:10px;padding:2px 7px;background:white;border:1px solid var(--border);color:var(--navy);margin-left:auto;" onclick="unrecommendControlDeselect('${cid}')">Undo</button>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${(function() {
      const outsideQueue = [];
      if (state.policySelectedControls) {
        Object.keys(state.policySelectedControls).forEach(fam => {
          const sel = state.policySelectedControls[fam];
          const famControls = CONTROLS.filter(c => c.f === fam && (c.bl.includes(state.baseline) || (state.privacyOverlay && c.bl.includes('P'))));
          famControls.forEach(c => {
            if (sel.includes(c.id)) return;
            const owner = (state.controlOwners || {})[c.id] || {};
            const domainOwner = (state.domainOwners || {})[fam] || {};
            let reason = 'Not selected in ' + fam + ' policy control set';
            if (owner.name && domainOwner.name && owner.name.trim().toLowerCase() === domainOwner.name.trim().toLowerCase()) {
              reason = 'Retained by domain policy owner';
            } else if (owner.name) {
              reason = 'Owned outside your queue — ' + owner.name;
            }
            outsideQueue.push({ ...c, deselFam: fam, queueReason: reason });
          });
        });
      }
      if (!outsideQueue.length) return '';
      return `<details style="margin-top:16px;"><summary style="cursor:pointer;font-size:12px;font-weight:700;color:var(--text-muted);padding:8px 0;user-select:none;">▶ ${outsideQueue.length} controls outside your control-owner queue</summary>
        <div style="font-size:11px;color:var(--text-muted);margin:4px 0 8px 0;">These controls are managed at the domain-policy level or routed to another owner; they are not removed from the overall program unless the domain policy owner formally de-selects them.</div>
        <div class="table-scroll" style="margin-top:8px;">
          <table class="control-table"><thead><tr><th style="width:80px;">Control</th><th>Name</th><th style="width:70px;">Family</th><th style="width:220px;">Reason</th></tr></thead>
          <tbody>${outsideQueue.map(c => `<tr style="opacity:0.62;"><td><span class="control-id" style="opacity:0.8;">${c.id}</span></td><td style="font-size:13px;color:var(--text-muted);">${c.n}</td><td><span class="family-badge" style="opacity:0.65;">${c.f}</span></td><td style="font-size:11px;color:#334155;font-weight:600;">${escapeHTML(c.queueReason)}</td></tr>`).join('')}</tbody>
          </table></div></details>`;
    })()}`;
}

function filterControlList() {
  const q   = (document.getElementById('ctrlSearch')?.value||'').toLowerCase();
  const fam = document.getElementById('ctrlFamilyFilter')?.value||'';
  const st  = document.getElementById('ctrlStatusFilter')?.value||'';
  const des = document.getElementById('ctrlDeselectFilter')?.value||'';
  document.querySelectorAll('#controlInventoryTable tbody tr').forEach(row => {
    const matchQ = !q   || (row.dataset.id||'').toLowerCase().includes(q) || (row.cells[1]?.textContent||'').toLowerCase().includes(q);
    const matchF = !fam || row.dataset.family===fam;
    const matchS = !st  || row.dataset.status===st;
    const matchD = !des || (des === 'deselected' && row.dataset.deselected === '1');
    row.style.display = (matchQ && matchF && matchS && matchD) ? '' : 'none';
  });
}

function goToControlDetail(ctrlId) {
  state._controlLibraryMode = false;
  state._selectedCtrl = ctrlId;
  showTab('control');
  goToStep('control', 2);
}

function userCanAccessControlWorkspace() {
  if (!state.currentUserId) return true; // admin mode
  var user = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  if (!user) return false;
  var visibleTabs = getPersonVisibleTabIds(user) || [];
  return visibleTabs.indexOf('control') !== -1;
}

function openControlFromLibrary(ctrlId) {
  if (userCanAccessControlWorkspace()) {
    goToControlDetail(ctrlId);
    return;
  }
  openControlLibraryReadOnly(ctrlId);
}

function openControlLibraryReadOnly(ctrlId) {
  var ctrl = (getActiveControls() || []).find(function(c) { return c.id === ctrlId; });
  if (!ctrl) { showToast('Control not found.', true); return; }
  normalizeControlDesignState(ctrlId);
  var cs = state.controlStatus[ctrlId] || {};
  var owner = (state.controlOwners || {})[ctrlId] || {};
  var reqs = cs.assetOwnerRequirements || [];
  var covered = getCtrlCoveredAssetTypes(ctrlId);
  var policyReqs = getControlPolicyReqs(ctrlId);
  var nistParts = parseControlParts(ctrlId) || {};
  var designSource = cs.designSource || (cs.externalDocRef ? 'external' : 'inline');
  var linkedAssetNames = (cs.linkedAssets || []).map(function(aid) {
    var a = (state.assets || []).find(function(x) { return String(x.id) === String(aid); });
    return a ? a.name : String(aid);
  });
  var linkedProcessNames = (cs.linkedProcesses || []).map(function(pid) {
    var p = (state.processes || []).find(function(x) { return String(x.id) === String(pid); });
    return p ? p.name : String(pid);
  });
  var nistRequirementText = (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrlId])
    ? NIST_CONTROL_TEXT[ctrlId]
    : ctrlShortDesc(ctrl);
  var policyObjectivesHtml = policyReqs.length
    ? '<div style="display:flex;flex-direction:column;gap:8px;">' + policyReqs.map(function(r) {
        return '<div style="border:1px solid #c7d2fe;background:#eef2ff;border-radius:6px;padding:8px 10px;">'
          + '<div style="font-size:11px;font-weight:700;color:#4338ca;margin-bottom:3px;">' + escapeHTML((r.reqId || 'Policy objective') + ' · ' + (r.policyTitle || r.fam || 'Policy')) + '</div>'
          + '<div style="font-size:12px;color:#1f2937;line-height:1.5;">' + escapeHTML(r.reqText || 'No objective text captured.') + '</div>'
          + '</div>';
      }).join('') + '</div>'
    : '<div style="font-size:12px;color:var(--text-muted);">No policy objectives linked.</div>';

  var designHtml = '';
  if (designSource === 'external') {
    designHtml = '<div style="display:grid;grid-template-columns:1fr;gap:8px;">'
      + '<div><strong>External reference:</strong> ' + escapeHTML(cs.externalDocTitle || '—') + '</div>'
      + '<div><strong>Location:</strong> ' + escapeHTML(cs.externalDocRef || '—') + '</div>'
      + '<div><strong>Coverage summary:</strong> ' + escapeHTML(cs.externalDocSummary || '—') + '</div>'
      + '</div>';
  } else {
    var partKeys = Object.keys(nistParts);
    if (partKeys.length) {
      designHtml = '<div style="display:flex;flex-direction:column;gap:8px;">'
        + partKeys.map(function(letter) {
            var partText = ((cs.designParts || {})[letter] || '').trim();
            return '<div style="border:1px solid var(--border);border-radius:6px;padding:8px 10px;">'
              + '<div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:3px;">Part ' + letter + '</div>'
              + '<div style="font-size:12px;color:#374151;line-height:1.5;">' + escapeHTML(partText || 'Not documented') + '</div>'
              + '</div>';
          }).join('')
        + '</div>';
    } else {
      designHtml = '<div style="font-size:12px;color:#374151;line-height:1.6;">' + escapeHTML((cs.approach || cs.narrative || '').trim() || 'No design narrative documented.') + '</div>';
    }
  }

  var reqTable = reqs.length
    ? '<div class="table-scroll"><table class="control-table"><thead><tr><th style="width:140px;">Asset Type</th><th>Required Actions</th><th>Required Evidence</th><th>Acceptance Criteria</th></tr></thead><tbody>'
      + reqs.map(function(r) {
          return '<tr><td style="font-size:11px;font-weight:700;color:#334155;">' + escapeHTML(r.assetType || 'General') + '</td>'
            + '<td style="font-size:12px;color:#374151;">' + escapeHTML(r.requirement || '—') + '</td>'
            + '<td style="font-size:12px;color:#374151;">' + escapeHTML(r.evidenceNeeded || '—') + '</td>'
            + '<td style="font-size:12px;color:#374151;">' + escapeHTML(r.acceptanceCriteria || '—') + '</td></tr>';
        }).join('')
      + '</tbody></table></div>'
    : '<div style="font-size:12px;color:var(--text-muted);">No asset-owner requirements documented yet.</div>';

  var overlay = document.createElement('div');
  overlay.id = 'controlLibraryReadOnlyOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.58);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = '<div style="background:white;width:min(980px,96vw);max-height:92vh;overflow:auto;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,0.3);">'
    + '<div style="position:sticky;top:0;background:white;border-bottom:1px solid var(--border);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;z-index:2;">'
    + '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Control Library · Read-only</div>'
    + '<div style="font-size:18px;font-weight:800;color:var(--navy);margin-top:2px;">' + escapeHTML(ctrl.id) + ' — ' + escapeHTML(ctrl.n) + '</div>'
    + '<div style="font-size:12px;color:var(--text-muted);margin-top:3px;">Owner: ' + escapeHTML(owner.name || 'Unassigned') + ' · Status: ' + escapeHTML(cs.status || 'Not Started') + '</div></div>'
    + '<button onclick="document.getElementById(\'controlLibraryReadOnlyOverlay\').remove()" style="border:none;background:#f8fafc;color:#334155;font-size:16px;font-weight:700;border-radius:8px;padding:6px 10px;cursor:pointer;">✕</button></div>'
    + '<div style="padding:18px;">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Policy Objectives</div>'
    + policyObjectivesHtml
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">Asset Scope</div>'
    + '<div style="font-size:12px;color:#374151;">' + (covered.length ? covered.map(function(t){ return escapeHTML(t.label); }).join(' · ') : 'No asset types selected') + '</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:5px;">Linked assets: ' + escapeHTML(linkedAssetNames.length ? linkedAssetNames.join(', ') : 'None') + '</div>'
    + '<div style="font-size:11px;color:var(--text-muted);">Linked processes: ' + escapeHTML(linkedProcessNames.length ? linkedProcessNames.join(', ') : 'None') + '</div>'
    + '</div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">'
    + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">NIST Requirements</div>'
    + '<div style="font-size:12px;color:#374151;line-height:1.65;white-space:pre-line;">' + escapeHTML(nistRequirementText || 'No NIST requirement text available.') + '</div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">'
    + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Control Design</div>'
    + designHtml
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;">'
    + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Asset-Type Requirements & Required Evidence</div>'
    + reqTable
    + '</div>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

// ── RETURN & PROPOSE DE-SELECT ────────────────────────────────────────────────
function returnControlToPolicyOwner(ctrlId) {
  const ctrl   = CONTROLS.find(c => c.id === ctrlId);
  const cName  = ctrl ? ctrl.n : ctrlId;
  const pOwner = ctrl ? ((state.domainOwners[ctrl.f]||{}).name || state.programOwnerTitle || 'Policy Owner') : 'Policy Owner';
  const cid    = ctrlId.replace(/'/g,"\\'");
  const overlay = document.createElement('div');
  overlay.id = 'returnCtrlOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px;width:460px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:22px;margin-bottom:8px;">↩</div>'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:6px;">Return to Policy Owner?</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">You are about to return <strong>' + escapeHTML(ctrlId) + ' — ' + escapeHTML(cName) + '</strong> to <strong>' + escapeHTML(pOwner) + '</strong>. It will be excluded from your design queue. Your progress is preserved.</div>'
    + '<div style="margin-bottom:16px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);display:block;margin-bottom:6px;">Reason (optional)</label>'
    + '<textarea id="returnCtrlReason" rows="2" class="form-input" style="font-size:12px;resize:vertical;" placeholder="e.g. This control belongs to the IAM team, not my remit…"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="closeReturnCtrlModal()">Cancel</button>'
    + '<button class="btn" style="background:#dc2626;color:white;border:none;" onclick="confirmReturnControl(\'' + cid + '\')">↩ Return to Policy Owner</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function confirmReturnControl(ctrlId) {
  const reason = document.getElementById('returnCtrlReason')?.value.trim() || '';
  closeReturnCtrlModal();
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlReviewQueue) state.controlReviewQueue = [];
  var family = String(ctrlId || '').split('-')[0] || '';
  var currentUser = state.currentUserId ? (state.users || []).find(function(u){ return u.id === state.currentUserId; }) : null;
  var returnedBy = (currentUser && currentUser.name) ? currentUser.name : (state.programOwner || 'Control Owner');
  state.controlStatus[ctrlId].returnedToPolicyOwner = true;
  state.controlStatus[ctrlId].returnReason  = reason;
  state.controlStatus[ctrlId].returnedAt    = new Date().toLocaleDateString();
  state.controlStatus[ctrlId].returnedBy    = returnedBy;
  var existingQueueItem = state.controlReviewQueue.find(function(r) { return r && r.controlId === ctrlId; });
  if (existingQueueItem) {
    existingQueueItem.type = 'control-return';
    existingQueueItem.family = family || existingQueueItem.family || '';
    existingQueueItem.policyOwner = ((state.domainOwners || {})[family] || {}).name || existingQueueItem.policyOwner || '';
    existingQueueItem.status = 'Returned to Policy Owner';
    existingQueueItem.submittedBy = returnedBy;
    existingQueueItem.submittedAt = new Date().toISOString();
    existingQueueItem.notes = reason || '';
  } else {
    state.controlReviewQueue.push({
      type: 'control-return',
      controlId: ctrlId,
      family: family,
      policyOwner: ((state.domainOwners || {})[family] || {}).name || '',
      submittedBy: returnedBy,
      submittedAt: new Date().toISOString(),
      status: 'Returned to Policy Owner',
      notes: reason || ''
    });
  }
  markDirty();
  addAuditEntry('control', ctrlId, 'Control returned to policy owner' + (reason ? ': ' + reason : ''));
  showToast('↩ ' + ctrlId + ' returned to policy owner.');
  renderControlStep1();
}

function closeReturnCtrlModal() { document.getElementById('returnCtrlOverlay')?.remove(); }

function unreturnControl(ctrlId) {
  if (!state.controlStatus[ctrlId]) return;
  state.controlStatus[ctrlId].returnedToPolicyOwner = false;
  state.controlStatus[ctrlId].returnReason = '';
  state.controlStatus[ctrlId].returnedBy = '';
  if (state.controlReviewQueue && state.controlReviewQueue.length) {
    state.controlReviewQueue = state.controlReviewQueue.filter(function(r) {
      return !(r && r.controlId === ctrlId && (r.type === 'control-return' || r.status === 'Returned to Policy Owner'));
    });
  }
  markDirty();
  showToast('Control ' + ctrlId + ' restored to your queue.');
  renderControlStep1();
}

function recommendControlDeselect(ctrlId) {
  const ctrl   = CONTROLS.find(c => c.id === ctrlId);
  const cName  = ctrl ? ctrl.n : ctrlId;
  const pOwner = ctrl ? ((state.domainOwners[ctrl.f]||{}).name || state.programOwnerTitle || 'Policy Owner') : 'Policy Owner';
  const cid    = ctrlId.replace(/'/g,"\\'");
  const overlay = document.createElement('div');
  overlay.id = 'deselectCtrlOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px;width:480px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:22px;margin-bottom:8px;">✗</div>'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:6px;">Propose De-selection?</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;line-height:1.6;">You are proposing that <strong>' + escapeHTML(ctrlId) + ' — ' + escapeHTML(cName) + '</strong> be removed from scope.</div>'
    + '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#92400e;">This flags the control as "Recommended for De-selection" in the library for <strong>' + escapeHTML(pOwner) + '</strong> to decide on. It does not remove the control immediately.</div>'
    + '<div style="margin-bottom:16px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);display:block;margin-bottom:6px;">Reason <span style="color:var(--red);">*</span></label>'
    + '<textarea id="deselectCtrlReason" rows="3" class="form-input" style="font-size:12px;resize:vertical;" placeholder="Explain why this control should not be in scope (e.g. technical environment does not support this, another system handles this, risk formally accepted at CISO level…)"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="closeDeselectCtrlModal()">Cancel</button>'
    + '<button class="btn" style="background:#d97706;color:white;border:none;" onclick="confirmRecommendDeselect(\'' + cid + '\')">✗ Propose De-selection</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function getCurrentActorName() {
  if (!state.currentUserId) return state.programOwner || 'Admin';
  var user = (state.users || []).find(function(u) { return u.id === state.currentUserId; });
  return (user && user.name) ? user.name : (state.programOwner || 'User');
}

function appendDeselectHistory(ctrlId, action, reason) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].deselectHistory) state.controlStatus[ctrlId].deselectHistory = [];
  state.controlStatus[ctrlId].deselectHistory.push({
    action: action,
    reason: reason || '',
    by: getCurrentActorName(),
    at: new Date().toISOString()
  });
}

function confirmRecommendDeselect(ctrlId) {
  const reason = document.getElementById('deselectCtrlReason')?.value.trim() || '';
  if (!reason) { showToast('Please provide a reason for the de-selection proposal.', true); return; }
  closeDeselectCtrlModal();
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  state.controlStatus[ctrlId].recommendedDeselect     = true;
  state.controlStatus[ctrlId].deselectReason          = reason;
  state.controlStatus[ctrlId].deselectProposedAt      = new Date().toLocaleDateString();
  state.controlStatus[ctrlId].deselectProposedBy      = getCurrentActorName();
  state.controlStatus[ctrlId].deselectDecision        = '';
  state.controlStatus[ctrlId].deselectDecisionReason  = '';
  state.controlStatus[ctrlId].deselectDecidedAt       = '';
  state.controlStatus[ctrlId].deselectDecidedBy       = '';
  appendDeselectHistory(ctrlId, 'Proposed', reason);
  markDirty();
  addAuditEntry('control', ctrlId, 'De-selection proposed by ' + state.controlStatus[ctrlId].deselectProposedBy + ': ' + reason);
  showToast('✗ ' + ctrlId + ' proposed for de-selection — policy owner will review.');
  renderControlStep1();
}

function closeDeselectCtrlModal() { document.getElementById('deselectCtrlOverlay')?.remove(); }

function unrecommendControlDeselect(ctrlId) {
  if (!state.controlStatus[ctrlId]) return;
  state.controlStatus[ctrlId].recommendedDeselect = false;
  state.controlStatus[ctrlId].deselectDecision = 'Withdrawn';
  state.controlStatus[ctrlId].deselectDecisionReason = 'Proposal withdrawn by submitter';
  state.controlStatus[ctrlId].deselectDecidedAt = new Date().toLocaleDateString();
  state.controlStatus[ctrlId].deselectDecidedBy = getCurrentActorName();
  appendDeselectHistory(ctrlId, 'Withdrawn', 'Proposal withdrawn by submitter');
  markDirty();
  addAuditEntry('control', ctrlId, 'De-selection proposal withdrawn by ' + getCurrentActorName());
  showToast('De-selection proposal withdrawn for ' + ctrlId + '.');
  renderControlStep1();
}

function policyOwnerDecideDeselect(ctrlId, decision) {
  const ctrl = CONTROLS.find(c => c.id === ctrlId);
  const overlay = document.createElement('div');
  overlay.id = 'deselectDecisionOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="background:white;border-radius:16px;padding:28px;width:500px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'
    + '<div style="font-size:17px;font-weight:800;color:var(--navy);margin-bottom:6px;">' + (decision === 'Approved' ? 'Approve' : 'Reject') + ' De-selection</div>'
    + '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">Control: <strong>' + escapeHTML(ctrlId + ' — ' + ((ctrl && ctrl.n) || '')) + '</strong></div>'
    + '<div style="margin-bottom:16px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-muted);display:block;margin-bottom:6px;">Decision rationale <span style="color:var(--red);">*</span></label>'
    + '<textarea id="deselectDecisionReason" rows="3" class="form-input" style="font-size:12px;resize:vertical;" placeholder="Document the reasoning for this decision for audit traceability..."></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\'deselectDecisionOverlay\')?.remove()">Cancel</button>'
    + '<button class="btn" style="background:' + (decision === 'Approved' ? '#166534' : '#b45309') + ';color:white;border:none;" onclick="confirmPolicyOwnerDeselectDecision(\'' + ctrlId.replace(/'/g,"\\'") + '\',\'' + decision + '\')">Confirm ' + (decision === 'Approved' ? 'Approval' : 'Rejection') + '</button>'
    + '</div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
}

function confirmPolicyOwnerDeselectDecision(ctrlId, decision) {
  var reason = (document.getElementById('deselectDecisionReason') || {}).value || '';
  reason = reason.trim();
  if (!reason) { showToast('Decision rationale is required for audit purposes.', true); return; }
  document.getElementById('deselectDecisionOverlay')?.remove();
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var cs = state.controlStatus[ctrlId];
  if (decision === 'Approved') {
    var snap = {
      recommendedDeselect: cs.recommendedDeselect,
      deselectDecision: cs.deselectDecision,
      deselectDecisionReason: cs.deselectDecisionReason,
      deselectDecidedAt: cs.deselectDecidedAt,
      deselectDecidedBy: cs.deselectDecidedBy
    };
    pushScopedUndo({
      label: 'De-selection approved: ' + ctrlId,
      undo: function() {
        var c = state.controlStatus[ctrlId];
        if (!c) return;
        c.recommendedDeselect = snap.recommendedDeselect;
        c.deselectDecision = snap.deselectDecision;
        c.deselectDecisionReason = snap.deselectDecisionReason;
        c.deselectDecidedAt = snap.deselectDecidedAt;
        c.deselectDecidedBy = snap.deselectDecidedBy;
        try { renderPolicyStep2(); } catch (eR) {}
      }
    });
  }
  cs.deselectDecision = decision;
  cs.deselectDecisionReason = reason;
  cs.deselectDecidedAt = new Date().toLocaleDateString();
  cs.deselectDecidedBy = getCurrentActorName();
  cs.recommendedDeselect = decision === 'Approved';
  appendDeselectHistory(ctrlId, decision, reason);
  markDirty();
  addAuditEntry('control', ctrlId, 'De-selection ' + decision.toLowerCase() + ' by ' + cs.deselectDecidedBy + ': ' + reason);
  showToast('De-selection ' + (decision === 'Approved' ? 'approved' : 'rejected') + ' for ' + ctrlId + '.');
  renderPolicyStep2();
}

// ── STEP 2: DESIGN THE CONTROL ────────────────────────────────────────────────
function renderControlStep2() {
  const body = document.getElementById('control-step-2-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div></div>`;
    return;
  }
  // Preserve scroll positions across re-renders so button clicks do not jump to top.
  var prevListEl = document.getElementById('ctrlDetailList');
  var prevFormEl = document.getElementById('ctrlDetailForm');
  var hadPrevList = !!prevListEl;
  var hadPrevForm = !!prevFormEl;
  var prevListScrollTop = prevListEl ? prevListEl.scrollTop : 0;
  var prevFormScrollTop = prevFormEl ? prevFormEl.scrollTop : 0;
  var prevPageScrollTop = window.scrollY || document.documentElement.scrollTop || 0;

  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  controls.forEach(c => {
    if (!state.controlStatus[c.id]) state.controlStatus[c.id] = { status:'Not Started', approach:'', narrative:'', evidence:[], notes:'' };
    if (!state.controlStatus[c.id].evidence) state.controlStatus[c.id].evidence = [];
  });
  if (!state._selectedCtrl || !controls.find(c=>c.id===state._selectedCtrl)) {
    state._selectedCtrl = controls[0]?.id || null;
  }
  const sel = controls.find(c=>c.id===state._selectedCtrl);

  body.innerHTML = `
    <div style="display:flex;min-height:500px;height:calc(100vh - 320px);overflow:hidden;margin:-4px;">
      <!-- LEFT: control list -->
      <div style="width:260px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;background:#fafbfc;">
        <div style="padding:12px 14px;border-bottom:1px solid var(--border);">
          <input type="text" class="form-input" style="font-size:12px;" placeholder="🔍  Filter controls…" id="ctrlDetailSearch" oninput="filterCtrlDetailList()">
        </div>
        <div style="overflow-y:auto;flex:1;" id="ctrlDetailList">
          ${controls.map(c => {
            const cs  = state.controlStatus[c.id]||{};
            const designed = !!(cs.designSource || (cs.approach&&cs.approach.trim()) || (cs.designParts&&Object.values(cs.designParts).some(v=>v&&v.trim())));
            const st  = cs.status||'Not Started';
            const isSel = c.id===state._selectedCtrl;
            const dot = designed ? '#166534' : st==='In Progress' ? '#92400e' : st==='Planned' ? '#d97706' : '#94a3b8';
            const cid = c.id.replace(/'/g,"\\'");
            return `<div onclick="selectCtrlDetail('${cid}')" data-ctrl-id="${c.id}" data-ctrl-name="${c.n.toLowerCase()}"
              style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;background:${isSel?'rgba(13,148,136,0.07)':'transparent'};border-left:3px solid ${isSel?'var(--teal)':'transparent'};transition:all 0.15s;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="font-family:monospace;font-size:11px;font-weight:700;color:${isSel?'var(--teal)':'var(--navy)'};">${c.id}</span>
                <div style="width:7px;height:7px;border-radius:50%;background:${dot};margin-left:auto;flex-shrink:0;" title="${designed?'Design documented':'Not yet designed'}"></div>
              </div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.n}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <!-- RIGHT: detail form -->
      <div style="flex:1;overflow-y:auto;padding:20px 24px;" id="ctrlDetailForm">
        ${sel ? renderControlDetailForm(sel) : '<div class="empty-state"><div class="es-title">Select a control from the list</div></div>'}
      </div>
    </div>`;

  // Restore prior scroll positions after DOM replacement.
  setTimeout(function() {
    var nextListEl = document.getElementById('ctrlDetailList');
    var nextFormEl = document.getElementById('ctrlDetailForm');
    if (hadPrevList && nextListEl) nextListEl.scrollTop = prevListScrollTop;
    if (hadPrevForm && nextFormEl) nextFormEl.scrollTop = prevFormScrollTop;
    if (Math.abs((window.scrollY || 0) - prevPageScrollTop) > 4) {
      window.scrollTo(0, prevPageScrollTop);
    }
  }, 0);
}

function filterCtrlDetailList() {
  const q = (document.getElementById('ctrlDetailSearch')?.value||'').toLowerCase();
  document.querySelectorAll('#ctrlDetailList [data-ctrl-id]').forEach(el => {
    const id   = (el.dataset.ctrlId||'').toLowerCase();
    const name = (el.dataset.ctrlName||'').toLowerCase();
    el.style.display = (!q || id.includes(q) || name.includes(q)) ? '' : 'none';
  });
}

function selectCtrlDetail(ctrlId) {
  state._selectedCtrl = ctrlId;
  renderControlStep2();
}

// Return list of {reqId, reqText, policyTitle, fam} for all requirements that cite ctrlId
function getControlPolicyReqs(ctrlId) {
  var hits = [];
  // Search domain policies (Tier 2)
  if (state.domainPolicies) {
    Object.keys(state.domainPolicies).forEach(function(fam) {
      var dp = state.domainPolicies[fam];
      if (!dp || !dp.requirements) return;
      dp.requirements.forEach(function(req) {
        var cids = Array.isArray(req.controls) ? req.controls : (req.controlId ? [req.controlId] : []);
        if (cids.some(function(c){ return String(c).trim() === ctrlId; })) {
          hits.push({ reqId: req.id||'', reqText: req.text||'', policyTitle: dp.title || getPolicyMergedTitle(fam), fam: fam });
        }
      });
    });
  }
  // Search ISP (Tier 1) — covers PM controls and any cross-cutting requirements
  var isp = state.infoSecPolicy || {};
  (isp.requirements || []).forEach(function(req) {
    var cids = Array.isArray(req.controls) ? req.controls : (req.controlId ? [req.controlId] : []);
    if (cids.some(function(c){ return String(c).trim() === ctrlId; })) {
      hits.push({ reqId: req.id||'', reqText: req.text||'', policyTitle: isp.title || 'Information Security Policy', fam: 'ISP' });
    }
  });
  return hits;
}

function isControlDesigned(ctrlId) {
  const cs = state.controlStatus[ctrlId] || {};
  if (cs.designSource === 'external') {
    return !!((cs.externalDocTitle || '').trim() && (cs.externalDocRef || '').trim());
  }
  if (cs.designParts && Object.values(cs.designParts).some(function(v) { return v && String(v).trim(); })) return true;
  return !!((cs.approach && cs.approach.trim()) || (cs.narrative && cs.narrative.trim()));
}

function normalizeControlDesignState(ctrlId) {
  if (!state.controlStatus) state.controlStatus = {};
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var cs = state.controlStatus[ctrlId];
  if (!cs.assetOwnerRequirements) cs.assetOwnerRequirements = [];
  cs.assetOwnerRequirements = cs.assetOwnerRequirements.map(function(r) {
    return {
      assetType: r.assetType || 'General',
      requirement: r.requirement || '',
      evidenceNeeded: r.evidenceNeeded || '',
      acceptanceCriteria: r.acceptanceCriteria || '',
      procedureRefs: r.procedureRefs || ''
    };
  });
  // Backward compatibility: older snapshots used one free-text assetGuidance field.
  if ((cs.assetGuidance || '').trim() && !cs.assetOwnerRequirements.some(function(r) { return (r.requirement || '').trim(); })) {
    cs.assetOwnerRequirements.push({
      assetType: 'General',
      requirement: cs.assetGuidance,
      evidenceNeeded: '',
      acceptanceCriteria: '',
      procedureRefs: ''
    });
  }
  if (!Array.isArray(cs.evidence)) cs.evidence = [];
  cs.evidence = cs.evidence.map(function(ev) {
    var e = Object.assign({}, ev);
    if (e.dataUrl && String(e.dataUrl).indexOf('data:image') === 0) {
      e.kind = 'image';
    }
    if (e.kind === 'image') {
      e.caption = e.caption != null ? String(e.caption) : (e.ref != null ? String(e.ref) : '');
      if (e.mime !== 'image/png' && e.mime !== 'image/jpeg') {
        e.mime = String(e.dataUrl || '').indexOf('image/png') !== -1 ? 'image/png' : 'image/jpeg';
      }
      delete e.type;
      delete e.ref;
    } else {
      e.kind = 'ref';
      e.type = e.type || 'Policy';
      e.title = e.title != null ? String(e.title) : '';
      e.description = e.description != null ? String(e.description) : '';
      e.url = e.url != null ? String(e.url) : (e.ref != null ? String(e.ref) : '');
      e.ref = e.ref != null ? String(e.ref) : e.url;
      delete e.dataUrl;
      delete e.mime;
      delete e.caption;
    }
    return e;
  });
}

function getDesignChecklist(ctrl) {
  var cs = state.controlStatus[ctrl.id] || {};
  var designSource = cs.designSource || 'inline';
  var nistParts = parseControlParts(ctrl.id);
  var coveredTypes = getCtrlCoveredAssetTypes(ctrl.id);
  var linkedCount = (cs.linkedAssets || []).length + (cs.linkedProcesses || []).length;
  var coverageReady = coveredTypes.length > 0 || linkedCount > 0;
  var policyReqs = getControlPolicyReqs(ctrl.id);
  var sourceReady = true;
  var sourceDetail = '';
  if (designSource === 'external') {
    var hasTitle = !!(cs.externalDocTitle || '').trim();
    var hasRef = !!(cs.externalDocRef || '').trim();
    var hasSummary = !!(cs.externalDocSummary || '').trim();
    sourceReady = hasTitle && hasRef && hasSummary;
    sourceDetail = sourceReady ? 'Reference captured with coverage summary' : 'Provide title, location, and coverage summary';
  } else if (nistParts) {
    var letters = Object.keys(nistParts);
    var answered = letters.filter(function(letter) { return (cs.designParts || {})[letter] && String((cs.designParts || {})[letter]).trim(); }).length;
    sourceReady = answered === letters.length;
    sourceDetail = answered + ' of ' + letters.length + ' NIST letter parts addressed';
  } else {
    sourceReady = !!(cs.approach || '').trim();
    sourceDetail = sourceReady ? 'Design narrative documented' : 'Add a design description';
  }
  return {
    sourceReady: sourceReady,
    sourceDetail: sourceDetail,
    coverageReady: coverageReady,
    coverageDetail: coverageReady ? 'Assets/processes identified' : 'Identify asset type or inventory scope',
    policyReady: policyReqs.length > 0 ? true : !!sourceReady,
    policyDetail: policyReqs.length ? (policyReqs.length + ' linked policy requirement(s)') : 'No explicit policy requirement link; NIST coverage required'
  };
}

function getControlRequirementCoverage(ctrl) {
  normalizeControlDesignState(ctrl.id);
  var cs = state.controlStatus[ctrl.id] || {};
  var reqs = cs.assetOwnerRequirements || [];
  var coveredTypes = getCtrlCoveredAssetTypes(ctrl.id).map(function(t) { return t.label; });
  var targets = coveredTypes.length ? coveredTypes : ['General'];
  var satisfied = targets.filter(function(typeLabel) {
    var entry = reqs.find(function(r) { return r.assetType === typeLabel; }) || reqs.find(function(r) { return r.assetType === 'General'; });
    return !!(entry && ((entry.requirement || '').trim() || (entry.evidenceNeeded || '').trim()));
  });
  var hasCriteria = targets.filter(function(typeLabel) {
    var entry = reqs.find(function(r) { return r.assetType === typeLabel; }) || reqs.find(function(r) { return r.assetType === 'General'; });
    return !!(entry && (entry.acceptanceCriteria || '').trim());
  }).length;
  return {
    targetCount: targets.length,
    satisfiedCount: satisfied.length,
    criteriaCount: hasCriteria
  };
}

// Parse a NIST 800-53 control statement into top-level letter parts (a, b, c, …)
// Returns null when control has no meaningful sub-parts
function parseControlParts(ctrlId) {
  var text = (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrlId]) ? NIST_CONTROL_TEXT[ctrlId] : '';
  if (!text) return null;
  var positions = [];
  var re = /(?:^|\n)([a-z])\.\s/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    positions.push({ letter: m[1], start: m.index + (m[0].charAt(0) === '\n' ? 1 : 0) });
  }
  if (positions.length < 2) return null;
  var parts = {};
  for (var i = 0; i < positions.length; i++) {
    var end = i < positions.length - 1 ? positions[i+1].start : text.length;
    var raw = text.substring(positions[i].start, end).trim().replace(/^[a-z]\.\s*/, '');
    parts[positions[i].letter] = raw.trim();
  }
  return Object.keys(parts).length >= 2 ? parts : null;
}

function extractNistAssignments(text) {
  var src = String(text || '');
  if (!src) return [];
  var out = [];
  var seen = {};
  var re = /\[Assignment:\s*([^\]]+)\]/gi;
  var m;
  while ((m = re.exec(src)) !== null) {
    var raw = (m[1] || '').trim();
    if (!raw) continue;
    var key = raw.toLowerCase();
    if (seen[key]) continue;
    seen[key] = true;
    out.push(raw);
  }
  return out;
}

function setCtrlDesignSource(ctrlId, source) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  state.controlStatus[ctrlId].designSource = source;
  if (source && (!state.controlStatus[ctrlId].status || state.controlStatus[ctrlId].status === 'Not Started')) {
    state.controlStatus[ctrlId].status = 'Planned';
  }
  markDirty();
  setTimeout(function(){ renderControlStep2(); }, 0);
}

function getBulkDesignSourceEligibleControls(sourceCtrlId) {
  var source = CONTROLS.find(function(c) { return c.id === sourceCtrlId; });
  var controls = getScopedControls().filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    if (c.id === sourceCtrlId) return false;
    if (cs.returnedToPolicyOwner || cs.recommendedDeselect) return false;
    return true;
  });
  controls.sort(function(a, b) {
    if (source && a.f === source.f && b.f !== source.f) return -1;
    if (source && b.f === source.f && a.f !== source.f) return 1;
    return String(a.id).localeCompare(String(b.id));
  });
  return controls;
}

function openBulkDesignSourceModal(sourceCtrlId) {
  var source = CONTROLS.find(function(c) { return c.id === sourceCtrlId; });
  var sourceStatus = (state.controlStatus || {})[sourceCtrlId] || {};
  var eligible = getBulkDesignSourceEligibleControls(sourceCtrlId);
  if (!eligible.length) {
    showToast('No other eligible controls found in your queue.', true);
    return;
  }
  var sameFamily = source ? source.f : '';
  var selected = {};
  eligible.forEach(function(c) {
    selected[c.id] = !!(sameFamily && c.f === sameFamily);
  });
  window._bulkDesignSourceState = {
    sourceCtrlId: sourceCtrlId,
    familyFilter: sameFamily,
    search: '',
    overwrite: false,
    selected: selected
  };

  var existing = document.getElementById('bulkDesignSourceOverlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'bulkDesignSourceOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:10050;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:28px 18px;';
  overlay.innerHTML = ''
    + '<div style="background:white;border-radius:14px;width:940px;max-width:100%;box-shadow:0 24px 60px rgba(2,6,23,0.22);overflow:hidden;">'
    + '  <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">'
    + '    <div>'
    + '      <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:4px;">Apply this design source to other controls</div>'
    + '      <div style="font-size:12px;color:var(--text-muted);line-height:1.45;">Source: <span class="control-id">' + escapeHTML(sourceCtrlId) + '</span> — ' + escapeHTML((source && source.n) || '') + '</div>'
    + '      <div style="font-size:11px;color:var(--text-muted);line-height:1.45;margin-top:3px;">'
    + escapeHTML((sourceStatus.externalDocTitle || '').trim() || 'Untitled reference')
    + ' · '
    + escapeHTML((sourceStatus.externalDocType || '').trim() || 'Document')
    + '      </div>'
    + '    </div>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkDesignSourceModal()">Close</button>'
    + '  </div>'
    + '  <div id="bulkDesignSourceBody" style="padding:16px 20px;"></div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBulkDesignSourceModal(); });
  renderBulkDesignSourceModalBody();
}

function closeBulkDesignSourceModal() {
  var overlay = document.getElementById('bulkDesignSourceOverlay');
  if (overlay) overlay.remove();
  window._bulkDesignSourceState = null;
}

function renderBulkDesignSourceModalBody() {
  var st = window._bulkDesignSourceState;
  var body = document.getElementById('bulkDesignSourceBody');
  if (!st || !body) return;
  var eligible = getBulkDesignSourceEligibleControls(st.sourceCtrlId);
  var source = CONTROLS.find(function(c) { return c.id === st.sourceCtrlId; });
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
    + '<div style="display:grid;grid-template-columns:180px 1fr auto;gap:10px;align-items:end;margin-bottom:12px;">'
    + '  <div><label class="form-label" style="font-size:10px;">Family filter</label>'
    + '    <select class="form-select" style="font-size:12px;" onchange="window._bulkDesignSourceState.familyFilter=this.value;renderBulkDesignSourceModalBody();">'
    + '      <option value="">All families</option>'
    +        families.map(function(f) {
              return '<option value="' + escapeHTML(f) + '"' + (familyFilter === f ? ' selected' : '') + '>' + escapeHTML(f + ' — ' + (FAMILIES[f] || f)) + '</option>';
            }).join('')
    + '    </select></div>'
    + '  <div><label class="form-label" style="font-size:10px;">Search</label>'
    + '    <input class="form-input" style="font-size:12px;" placeholder="Filter by control ID or name" value="' + escapeHTML(st.search || '') + '" oninput="window._bulkDesignSourceState.search=this.value;renderBulkDesignSourceModalBody();"></div>'
    + '  <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--navy);white-space:nowrap;padding-bottom:8px;">'
    + '    <input type="checkbox" ' + (st.overwrite ? 'checked' : '') + ' onchange="window._bulkDesignSourceState.overwrite=this.checked;renderBulkDesignSourceModalBody();" style="accent-color:var(--teal);">'
    + '    Overwrite existing external-source fields'
    + '  </label>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
    + '  <div style="font-size:12px;color:var(--text-muted);">' + selectedCount + ' selected of ' + eligible.length + ' eligible controls'
    + (source && source.f ? ' · default scope: ' + escapeHTML(source.f) : '')
    + '  </div>'
    + '  <div style="display:flex;gap:8px;">'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkDesignSourceSelectFiltered(true)">Select all eligible</button>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkDesignSourceSelectFiltered(false)">Clear</button>'
    + '  </div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;max-height:360px;overflow:auto;">'
    + '  <table class="control-table" style="margin:0;">'
    + '    <thead><tr>'
    + '      <th style="width:42px;"><input type="checkbox" ' + (allFilteredSelected ? 'checked' : '') + ' onchange="bulkDesignSourceSelectFiltered(this.checked)" style="accent-color:var(--teal);"></th>'
    + '      <th style="width:95px;">Control</th>'
    + '      <th>Name</th>'
    + '      <th style="width:70px;">Family</th>'
    + '      <th style="width:130px;">Current Source</th>'
    + '    </tr></thead>'
    + '    <tbody>'
    +      (filtered.length ? filtered.map(function(c) {
            var cs = (state.controlStatus || {})[c.id] || {};
            var curSource = cs.designSource || (cs.externalDocRef ? 'external' : 'inline');
            var checked = !!st.selected[c.id];
            return '<tr>'
              + '<td><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="bulkDesignSourceSetOne(\'' + c.id.replace(/'/g, "\\'") + '\',this.checked)" style="accent-color:var(--teal);"></td>'
              + '<td><span class="control-id">' + escapeHTML(c.id) + '</span></td>'
              + '<td style="font-size:12px;color:var(--navy);">' + escapeHTML(c.n) + '</td>'
              + '<td><span class="family-badge">' + escapeHTML(c.f) + '</span></td>'
              + '<td style="font-size:11px;color:var(--text-muted);">' + escapeHTML(curSource === 'external' ? 'External reference' : 'Inline design') + '</td>'
              + '</tr>';
          }).join('') : '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No controls match current filter.</td></tr>')
    + '    </tbody>'
    + '  </table>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">'
    + '  <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkDesignSourceModal()">Cancel</button>'
    + '  <button type="button" class="btn btn-primary btn-sm" onclick="applyBulkDesignSourceToSelected()">Apply to selected controls</button>'
    + '</div>';
}

function bulkDesignSourceSetOne(ctrlId, checked) {
  var st = window._bulkDesignSourceState;
  if (!st) return;
  st.selected[ctrlId] = !!checked;
  renderBulkDesignSourceModalBody();
}

function bulkDesignSourceSelectFiltered(checked) {
  var st = window._bulkDesignSourceState;
  if (!st) return;
  var eligible = getBulkDesignSourceEligibleControls(st.sourceCtrlId);
  var q = String(st.search || '').toLowerCase();
  var familyFilter = String(st.familyFilter || '');
  eligible.forEach(function(c) {
    if (familyFilter && c.f !== familyFilter) return;
    if (q && String(c.id).toLowerCase().indexOf(q) === -1 && String(c.n || '').toLowerCase().indexOf(q) === -1) return;
    st.selected[c.id] = !!checked;
  });
  renderBulkDesignSourceModalBody();
}

function applyBulkDesignSourceToSelected() {
  var st = window._bulkDesignSourceState;
  if (!st) return;
  var sourceId = st.sourceCtrlId;
  var sourceStatus = (state.controlStatus || {})[sourceId] || {};
  var sourcePayload = {
    designSource: 'external',
    externalDocTitle: String(sourceStatus.externalDocTitle || ''),
    externalDocType: String(sourceStatus.externalDocType || ''),
    externalDocRef: String(sourceStatus.externalDocRef || ''),
    externalDocSummary: String(sourceStatus.externalDocSummary || '')
  };
  var selectedIds = getBulkDesignSourceEligibleControls(sourceId)
    .map(function(c) { return c.id; })
    .filter(function(id) { return !!st.selected[id]; });
  if (!selectedIds.length) {
    showToast('Select at least one control to update.', true);
    return;
  }
  if (!sourcePayload.externalDocTitle.trim() || !sourcePayload.externalDocRef.trim() || !sourcePayload.externalDocSummary.trim()) {
    showToast('Complete source title, reference, and coverage summary before bulk apply.', true);
    return;
  }
  if (!window.confirm('Apply this external design source to ' + selectedIds.length + ' control' + (selectedIds.length === 1 ? '' : 's') + '?')) {
    return;
  }

  var idx = 0;
  var appliedCount = 0;
  var skippedCount = 0;
  var overwrite = !!st.overwrite;
  var fields = ['externalDocTitle', 'externalDocType', 'externalDocRef', 'externalDocSummary'];

  function applyChunk() {
    var end = Math.min(idx + 30, selectedIds.length);
    for (; idx < end; idx++) {
      var ctrlId = selectedIds[idx];
      if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
      var target = state.controlStatus[ctrlId];
      var changed = false;

      if (target.designSource !== 'external') {
        target.designSource = 'external';
        changed = true;
      }
      fields.forEach(function(key) {
        var currentVal = String(target[key] || '');
        var nextVal = String(sourcePayload[key] || '');
        if (overwrite) {
          if (currentVal !== nextVal) {
            target[key] = nextVal;
            changed = true;
          }
        } else if (!currentVal.trim() && nextVal.trim()) {
          target[key] = nextVal;
          changed = true;
        }
      });
      if (target.designSource && (!target.status || target.status === 'Not Started')) {
        target.status = 'Planned';
        changed = true;
      }

      if (changed) appliedCount++;
      else skippedCount++;
    }

    if (idx < selectedIds.length) {
      requestAnimationFrame(applyChunk);
      return;
    }

    addAuditEntry('control', sourceId, 'Bulk-applied design source from ' + sourceId + ' to ' + appliedCount + ' control(s)' + (skippedCount ? ' (' + skippedCount + ' unchanged)' : '') + '.');
    markDirty();
    closeBulkDesignSourceModal();
    showToast('✅ Applied source to ' + appliedCount + ' control' + (appliedCount === 1 ? '' : 's') + (skippedCount ? ' · ' + skippedCount + ' unchanged' : '') + '.');
    renderControlStep2();
  }

  applyChunk();
}

function setCtrlDesignPart(ctrlId, letter, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].designParts) state.controlStatus[ctrlId].designParts = {};
  state.controlStatus[ctrlId].designParts[letter] = value;
  markDirty();
}

function setCtrlPartAssignment(ctrlId, letter, assignmentLabel, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].designPartParams) state.controlStatus[ctrlId].designPartParams = {};
  if (!state.controlStatus[ctrlId].designPartParams[letter]) state.controlStatus[ctrlId].designPartParams[letter] = {};
  state.controlStatus[ctrlId].designPartParams[letter][assignmentLabel] = value;
  markDirty();
}

function setCtrlAssignment(ctrlId, assignmentLabel, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].designParams) state.controlStatus[ctrlId].designParams = {};
  state.controlStatus[ctrlId].designParams[assignmentLabel] = value;
  markDirty();
}

function setCtrlAssetTypeStatus(ctrlId, typeKey, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].assetTypeStatus) state.controlStatus[ctrlId].assetTypeStatus = {};
  state.controlStatus[ctrlId].assetTypeStatus[typeKey] = value;
  markDirty();
}

function getCtrlCoveredAssetTypes(ctrlId) {
  var cs = state.controlStatus[ctrlId] || {};
  var coverage = cs.assetCoverage || {};
  var result = [];
  ASSET_TYPES.forEach(function(cat) {
    cat.types.forEach(function(t) { if (coverage[t.key]) result.push({ key: t.key, label: t.label }); });
  });
  (state.customAssetTypes||[]).forEach(function(at) {
    if (coverage['custom_' + at]) result.push({ key: 'custom_' + at, label: at });
  });
  return result;
}

function toggleCtrlAssetLink(ctrlId, assetId, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].linkedAssets) state.controlStatus[ctrlId].linkedAssets = [];
  if (checked) {
    if (!state.controlStatus[ctrlId].linkedAssets.includes(assetId)) state.controlStatus[ctrlId].linkedAssets.push(assetId);
  } else {
    state.controlStatus[ctrlId].linkedAssets = state.controlStatus[ctrlId].linkedAssets.filter(a => a !== assetId);
  }
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

function toggleCtrlProcessLink(ctrlId, processId, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].linkedProcesses) state.controlStatus[ctrlId].linkedProcesses = [];
  if (checked) {
    if (!state.controlStatus[ctrlId].linkedProcesses.includes(processId)) state.controlStatus[ctrlId].linkedProcesses.push(processId);
  } else {
    state.controlStatus[ctrlId].linkedProcesses = state.controlStatus[ctrlId].linkedProcesses.filter(p => p !== processId);
  }
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

var __EVIDENCE_IMAGE_MAX_BYTES = 100 * 1024;

function buildEvidenceArtifactSectionHTML(ctrl) {
  normalizeControlDesignState(ctrl.id);
  var cs = state.controlStatus[ctrl.id] || {};
  var cid = ctrl.id.replace(/'/g, "\\'");
  var ev = cs.evidence || [];
  var g = FAMILY_EVIDENCE_GUIDANCE[ctrl.f];
  var hint = g && g.evidence ? '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;line-height:1.5;"><strong>Examples for ' + escapeHTML(g.label || ctrl.f) + ':</strong> ' + escapeHTML(g.evidence.slice(0, 3).join(' · ')) + '</div>' : '';
  var rows = ev.map(function(evRow, idx) {
    var kind = evRow.kind === 'image' ? 'image' : (evRow.kind === 'sharepoint' ? 'sharepoint' : 'ref');
    var refPart = kind === 'sharepoint'
      ? '<div style="margin-top:8px;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
        + '<span class="sp-evidence-badge">SharePoint</span>'
        + '<button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:4px 10px;" onclick="openSharePointEvidenceFolder()">Browse folder</button>'
        + '</div>'
        + '<input class="form-input" style="font-size:12px;margin-bottom:8px;" placeholder="Document name (e.g., AC-2 Access Review Q1 2026)" value="' + escapeHTML(evRow.title || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'title\',this.value)">'
        + '<input class="form-input" style="font-size:12px;margin-bottom:8px;" placeholder="Relative path in library (e.g., AC/AC-2/review-report.pdf)" value="' + escapeHTML(evRow.spPath || '') + '" oninput="applySharePointPathToEvidence(\'' + cid + '\',' + idx + ',this.value)">'
        + '<input class="form-input" style="font-size:12px;margin-bottom:8px;" placeholder="Or paste full SharePoint link" value="' + escapeHTML(evRow.url || evRow.ref || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'url\',this.value)">'
        + '<input class="form-input" style="font-size:12px;" placeholder="How this document proves the control" value="' + escapeHTML(evRow.description || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'description\',this.value)">'
        + (evRow.url && isSharePointUrl(evRow.url) ? '<a href="' + escapeHTML(evRow.url) + '" target="_blank" rel="noopener noreferrer" class="sp-evidence-link">Open in SharePoint ↗</a>' : '')
        + '</div>'
      : kind === 'ref'
      ? '<div style="display:grid;grid-template-columns:130px 1fr;gap:8px;margin-top:8px;">'
        + '<select class="form-select" style="font-size:11px;" onchange="setEvidenceField(\'' + cid + '\',' + idx + ',\'type\',this.value)">'
        + ['Policy', 'Procedure', 'Screenshot', 'Log excerpt', 'Report', 'Ticket', 'Other'].map(function(tp) {
          return '<option' + ((evRow.type || '') === tp ? ' selected' : '') + '>' + tp + '</option>';
        }).join('')
        + '</select>'
        + '<input class="form-input" style="font-size:12px;" placeholder="Evidence name (e.g., CP Procedure v2.1)" value="' + escapeHTML(evRow.title || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'title\',this.value)">'
        + '</div>'
        + '<div style="margin-top:8px;">'
        + '<input class="form-input" style="font-size:12px;margin-bottom:8px;" placeholder="Description / context" value="' + escapeHTML(evRow.description || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'description\',this.value)">'
        + '<input class="form-input" style="font-size:12px;" placeholder="URL, path, or reference ID" value="' + escapeHTML(evRow.url || evRow.ref || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'url\',this.value)">'
        + '</div>'
      : '<div style="margin-top:8px;">'
        + '<input class="form-input" style="font-size:11px;margin-bottom:6px;" placeholder="Caption / context" value="' + escapeHTML(evRow.caption || '') + '" oninput="setEvidenceField(\'' + cid + '\',' + idx + ',\'caption\',this.value)">'
        + '<input type="file" accept="image/png,image/jpeg" style="font-size:11px;margin-bottom:6px;" onchange="handleEvidenceImageUpload(\'' + cid + '\',' + idx + ',this)">'
        + (evRow.dataUrl
          ? '<div style="display:flex;align-items:center;gap:10px;"><img src="' + evRow.dataUrl + '" alt="" style="max-height:72px;border-radius:6px;border:1px solid var(--border);cursor:zoom-in;" onclick="openEvidenceImageViewerAt(\'' + cid + '\',' + idx + ')"><span style="font-size:10px;color:var(--text-muted);">Click preview for full size</span></div>'
          : '<div style="font-size:10px;color:var(--text-muted);">No image yet — choose PNG/JPEG up to 100 KB.</div>')
        + '</div>';
    return '<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:#fafbff;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">'
      + '<div style="font-size:10px;font-weight:700;color:var(--navy);text-transform:uppercase;">Evidence row ' + (idx + 1) + '</div>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      + '<select class="form-select" style="font-size:11px;padding:3px 8px;" onchange="setEvidenceKind(\'' + cid + '\',' + idx + ',this.value)">'
      + '<option value="ref"' + (kind === 'ref' ? ' selected' : '') + '>Document / reference</option>'
      + (getSharePointConfig().enabled ? '<option value="sharepoint"' + (kind === 'sharepoint' ? ' selected' : '') + '>SharePoint link</option>' : '')
      + '<option value="image"' + (kind === 'image' ? ' selected' : '') + '>Screenshot (PNG/JPEG)</option>'
      + '</select>'
      + '<button type="button" class="btn btn-sm" style="font-size:10px;padding:2px 8px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;" onclick="openBulkEvidenceRowModal(\'' + cid + '\',' + idx + ')">Apply to controls…</button>'
      + '<button type="button" class="btn btn-sm" style="font-size:10px;padding:2px 8px;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;" onclick="removeCtrlEvidence(\'' + cid + '\',' + idx + ')">Remove</button>'
      + '</div></div>'
      + refPart
      + '</div>';
  }).join('');
  var spEnabled = typeof getSharePointConfig === 'function' && getSharePointConfig().enabled;
  var fwBadges = typeof renderFrameworkBadgesHtml === 'function' ? renderFrameworkBadgesHtml(ctrl.id, false) : '';
  return '<div class="evidence-card">'
    + '<div class="evidence-card-head">'
    + '<div><div class="evidence-card-title">Evidence</div>'
    + '<div class="evidence-card-sub">' + (spEnabled ? 'Link to SharePoint or attach small screenshots. Files live in your document library — we store pointers only.' : 'Attach references or small screenshots. Images stay in-browser only — max 100 KB each.') + '</div>'
    + (fwBadges ? '<div class="evidence-fw-badges" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">' + fwBadges + '</div>' : '')
    + '</div></div>'
    + hint
    + (rows || '<div class="evidence-empty">No evidence yet — add a link or screenshot below.</div>')
    + '<div class="evidence-actions">'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="addCtrlEvidence(\'' + cid + '\')">Add reference</button>'
    + (spEnabled ? '<button type="button" class="btn btn-primary btn-sm" onclick="addSharePointEvidence(\'' + cid + '\')">Link from SharePoint</button>' : '')
    + '</div>'
    + '</div>';
}

function setEvidenceKind(ctrlId, idx, kind) {
  if (!state.controlStatus[ctrlId] || !state.controlStatus[ctrlId].evidence || !state.controlStatus[ctrlId].evidence[idx]) return;
  var row = state.controlStatus[ctrlId].evidence[idx];
  if (kind === 'image') {
    row.kind = 'image';
    row.mime = row.mime || 'image/png';
    row.caption = row.caption != null ? row.caption : '';
    row.dataUrl = row.dataUrl || '';
    delete row.type;
    delete row.ref;
    delete row.spPath;
  } else if (kind === 'sharepoint') {
    row.kind = 'sharepoint';
    row.type = row.type || 'Document';
    row.title = row.title != null ? row.title : '';
    row.description = row.description != null ? row.description : '';
    row.url = row.url != null ? row.url : '';
    row.ref = row.ref != null ? row.ref : row.url;
    row.spPath = row.spPath != null ? row.spPath : '';
    delete row.dataUrl;
    delete row.mime;
    delete row.caption;
  } else {
    row.kind = 'ref';
    row.type = row.type || 'Policy';
    row.title = row.title != null ? row.title : '';
    row.description = row.description != null ? row.description : '';
    row.url = row.url != null ? row.url : (row.ref != null ? row.ref : (row.caption || ''));
    row.ref = row.ref != null ? row.ref : row.url;
    delete row.dataUrl;
    delete row.mime;
    delete row.caption;
  }
  markDirty();
  renderControlStep2();
}

function handleEvidenceImageUpload(ctrlId, idx, input) {
  var f = input.files && input.files[0];
  if (!f) return;
  if (f.type !== 'image/png' && f.type !== 'image/jpeg') {
    showToast('Only PNG or JPEG images are allowed for evidence screenshots.', true);
    input.value = '';
    return;
  }
  if (f.size > __EVIDENCE_IMAGE_MAX_BYTES) {
    showToast('Image too large — max ' + Math.round(__EVIDENCE_IMAGE_MAX_BYTES / 1024) + ' KB per screenshot.', true);
    input.value = '';
    return;
  }
  var reader = new FileReader();
  reader.onload = function() {
    if (!state.controlStatus[ctrlId] || !state.controlStatus[ctrlId].evidence || !state.controlStatus[ctrlId].evidence[idx]) return;
    var url = reader.result;
    var prev = state.controlStatus[ctrlId].evidence[idx].dataUrl;
    state.controlStatus[ctrlId].evidence[idx].kind = 'image';
    state.controlStatus[ctrlId].evidence[idx].dataUrl = url;
    state.controlStatus[ctrlId].evidence[idx].mime = f.type;
    logFieldChange('controlStatus.' + ctrlId + '.evidence[' + idx + '].image', prev ? '(replaced)' : '(none)', '(binary)');
    markDirty();
    renderControlStep2();
    showToast('Image attached — use Save now to persist.');
  };
  reader.onerror = function() { showToast('Could not read image file.', true); };
  reader.readAsDataURL(f);
  input.value = '';
}

function openEvidenceImageViewerAt(ctrlId, idx) {
  var row = ((state.controlStatus[ctrlId] || {}).evidence || [])[idx];
  if (!row || !row.dataUrl) return;
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:10100;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = '<div style="position:relative;max-width:96vw;max-height:96vh;">'
    + '<button type="button" id="evFullClose" style="position:absolute;top:-44px;right:0;background:white;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;">Close</button>'
    + '<img alt="Evidence" style="max-width:92vw;max-height:88vh;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.5);">'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('img').src = row.dataUrl;
  document.getElementById('evFullClose').onclick = function() { overlay.remove(); };
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

// ── CONTROL DETAIL FORM (Step 2 right panel) ──────────────────────────────────
function renderControlDetailForm(ctrl) {
  normalizeControlDesignState(ctrl.id);
  const cs  = state.controlStatus[ctrl.id] || {};
  const co  = (state.controlOwners||{})[ctrl.id] || {};
  const st  = cs.status || 'Not Started';
  const pn  = (() => {
    const ctrls = getScopedControls().filter(c =>
      !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
      !(state.controlStatus[c.id]||{}).recommendedDeselect);
    const idx = ctrls.findIndex(c=>c.id===ctrl.id);
    return { prev: idx>0?ctrls[idx-1].id:null, next: idx<ctrls.length-1?ctrls[idx+1].id:null };
  })();
  const designSource    = cs.designSource || '';
  const designParts     = cs.designParts  || {};
  const nistParts       = parseControlParts(ctrl.id);
  const nistFullText    = (typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrl.id]) ? NIST_CONTROL_TEXT[ctrl.id] : '';
  const controlAssignments = extractNistAssignments(nistFullText);
  const designParams    = cs.designParams || {};
  const coveredTypes    = getCtrlCoveredAssetTypes(ctrl.id);
  const assetTypeStatus = cs.assetTypeStatus || {};
  const policyReqs      = getControlPolicyReqs(ctrl.id);
  const designChecklist = getDesignChecklist(ctrl);
  const cid = ctrl.id.replace(/'/g,"\\'");

  return `
    <!-- ① Control header -->
    <div style="background:var(--navy);color:white;border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-family:monospace;font-size:18px;font-weight:800;">${ctrl.id}</span>
            <span class="family-badge" style="background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.2);">${ctrl.f}</span>
          </div>
          <div style="font-size:15px;font-weight:600;margin-bottom:8px;">${ctrl.n}</div>
          <div>${pillsHTML(ctrl.bl)}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.7;margin-bottom:4px;">Status</div>
          ${chipHTML(st)}
        </div>
      </div>
    </div>

    <!-- ② Design Requirements Context -->
    <div style="background:#fafbff;border:2px solid var(--navy);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:16px;">📋</span>
        <div>
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;color:var(--navy);">Requirements Your Design Must Satisfy</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Your control design must demonstrate how it addresses ALL of the following.</div>
        </div>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin-bottom:${policyReqs.length ? '12px' : '0'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1d4ed8;">① NIST SP 800-53 Rev. 5 — Control Requirement</div>
          <a href="https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_1_1/home?element=${ctrl.id}" target="_blank" rel="noopener" style="font-size:11px;color:#1d4ed8;text-decoration:none;font-weight:600;border:1px solid #bfdbfe;padding:2px 8px;border-radius:4px;white-space:nowrap;">🔗 NIST Catalog</a>
        </div>
        <div style="font-size:12px;color:#1e3a5f;line-height:1.7;white-space:pre-line;">${(typeof NIST_CONTROL_TEXT !== 'undefined' && NIST_CONTROL_TEXT[ctrl.id]) ? escapeHTML(NIST_CONTROL_TEXT[ctrl.id]) : escapeHTML(ctrlShortDesc(ctrl))}</div>
      </div>

      ${policyReqs.length ? `
      <div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6366f1;margin-bottom:10px;">② Policy Requirements Linked to this Control (${policyReqs.length})</div>
        ${policyReqs.map(r =>
          '<div style="border-left:3px solid #6366f1;padding:8px 12px;margin-bottom:8px;background:rgba(99,102,241,0.03);border-radius:0 6px 6px 0;">'
          + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
          + '<span style="font-family:monospace;font-size:11px;font-weight:700;background:rgba(99,102,241,0.1);color:#6366f1;padding:1px 6px;border-radius:4px;">' + escapeHTML(r.reqId) + '</span>'
          + '<span style="font-size:11px;color:var(--text-muted);">' + escapeHTML(r.policyTitle) + '</span>'
          + '</div>'
          + '<div style="font-size:12px;color:var(--navy);line-height:1.6;">' + escapeHTML(r.reqText) + '</div>'
          + '</div>'
        ).join('')}
      </div>` : `
      <div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.15);border-radius:8px;padding:10px 14px;font-size:11px;color:#6366f1;">
        ② No policy requirements explicitly link to this control yet — your design still needs to satisfy the NIST requirement above.
      </div>`}
    </div>

    <!-- ③ Asset & Process Scope -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Asset &amp; Process Scope</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">
        Identify which asset types and processes this control applies to. Your design must address how it works for <strong>each type you check</strong>. Assessors will validate coverage by asset type.
      </div>

      ${((state.assets||[]).length > 0 || (state.processes||[]).length > 0) ? `
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:var(--navy);margin-bottom:8px;">Link Specific Assets &amp; Processes from Inventory</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:100px;overflow-y:auto;padding:4px;">
          ${(state.assets||[]).map(a => {
            const linked = (cs.linkedAssets||[]).includes(a.id||a.name);
            const aid = (a.id||a.name||'').replace(/'/g,"\\'");
            return `<label style="display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 8px;background:${linked?'rgba(13,148,136,0.08)':'#f8fafc'};border:1px solid ${linked?'var(--teal)':'var(--border)'};border-radius:6px;cursor:pointer;white-space:nowrap;"><input type="checkbox" ${linked?'checked':''} style="accent-color:var(--teal);" onchange="toggleCtrlAssetLink('${cid}','${aid}',this.checked)">${escapeHTML(a.name||a.id)}</label>`;
          }).join('')}
          ${(state.processes||[]).map(p => {
            const linked = (cs.linkedProcesses||[]).includes(p.id||p.name);
            const pid = (p.id||p.name||'').replace(/'/g,"\\'");
            return `<label style="display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 8px;background:${linked?'rgba(99,102,241,0.08)':'#f8fafc'};border:1px solid ${linked?'rgba(99,102,241,0.4)':'var(--border)'};border-radius:6px;cursor:pointer;white-space:nowrap;"><input type="checkbox" ${linked?'checked':''} style="accent-color:#6366f1;" onchange="toggleCtrlProcessLink('${cid}','${pid}',this.checked)">⚙️ ${escapeHTML(p.name||p.id)}</label>`;
          }).join('')}
        </div>
      </div>` : `
      <div style="background:#f8fafc;border:1px dashed var(--border);border-radius:6px;padding:8px 12px;font-size:11px;color:var(--text-muted);margin-bottom:14px;">
        No assets or processes in inventory yet — add them in the Assets &amp; SSP tab. Asset type coverage below still applies.
      </div>`}

      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="font-size:11px;font-weight:700;color:var(--navy);">Asset Type Coverage <span style="font-weight:400;color:var(--text-muted);">(check all that apply)</span></div>
        <button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openBulkControlFieldModal('${cid}','assetCoverage')">Apply to controls…</button>
      </div>
      ${buildAssetCoverageHTML(ctrl.id)}
    </div>

    <!-- ④ Control Design -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Control Design</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">Document how this control is designed and implemented. This must address all parts of the NIST requirement above. Assessors use this to verify your implementation covers all sub-requirements.</div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        ${[
          ['Design Source Complete', designChecklist.sourceReady, designChecklist.sourceDetail],
          ['Asset/Process Scope Set', designChecklist.coverageReady, designChecklist.coverageDetail],
          ['Policy/NIST Alignment', designChecklist.policyReady, designChecklist.policyDetail]
        ].map(([label, ok, detail]) => `
          <div style="background:${ok?'#f0fdf4':'#fff7ed'};border:1px solid ${ok?'#86efac':'#fdba74'};border-radius:8px;padding:8px 10px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:${ok?'#166534':'#b45309'};">${ok?'✓':'⚠'} ${label}</div>
            <div style="font-size:10px;color:${ok?'#166534':'#92400e'};margin-top:3px;line-height:1.45;">${detail}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <label style="display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border:2px solid ${!designSource||designSource==='inline'?'var(--teal)':'var(--border)'};border-radius:8px;cursor:pointer;flex:1;background:${!designSource||designSource==='inline'?'rgba(13,148,136,0.04)':'white'};">
          <input type="radio" name="ctrlDesignSrc_${ctrl.id}" value="inline" ${!designSource||designSource==='inline'?'checked':''} onchange="setCtrlDesignSource('${cid}','inline')" style="margin-top:2px;accent-color:var(--teal);">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--navy);">Document the design here</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Write the control design directly. Recommended when no existing procedure covers this control.</div>
          </div>
        </label>
        <label style="display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border:2px solid ${designSource==='external'?'var(--teal)':'var(--border)'};border-radius:8px;cursor:pointer;flex:1;background:${designSource==='external'?'rgba(13,148,136,0.04)':'white'};">
          <input type="radio" name="ctrlDesignSrc_${ctrl.id}" value="external" ${designSource==='external'?'checked':''} onchange="setCtrlDesignSource('${cid}','external')" style="margin-top:2px;accent-color:var(--teal);">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--navy);">Point to an existing procedure or standard</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Reference a procedure, standard, or policy that already captures this control design.</div>
          </div>
        </label>
      </div>

      ${designSource === 'external' ? `
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px;">
        <div style="display:grid;grid-template-columns:1fr 160px;gap:10px;margin-bottom:10px;">
          <div>
            <label class="form-label" style="font-size:10px;">Document Title</label>
            <input class="form-input" style="font-size:12px;" value="${escapeHTML(cs.externalDocTitle||'')}" placeholder="e.g. Account Management Procedure v2.1" oninput="setCtrlField('${cid}','externalDocTitle',this.value)">
          </div>
          <div>
            <label class="form-label" style="font-size:10px;">Document Type</label>
            <select class="form-select" style="font-size:12px;" onchange="setCtrlField('${cid}','externalDocType',this.value)">
              ${['','Procedure','Standard','Policy','SOP','Framework Control','Work Instruction','Other'].map(t=>`<option ${(cs.externalDocType||'')=== t?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <label class="form-label" style="font-size:10px;">Reference / Location (URL, file path, or document ID)</label>
          <input class="form-input" style="font-size:12px;" value="${escapeHTML(cs.externalDocRef||'')}" placeholder="e.g. https://wiki.company.com/procedures/ac-2  or  ISMS-PROC-AC-002" oninput="setCtrlField('${cid}','externalDocRef',this.value)">
        </div>
        <div>
          <label class="form-label" style="font-size:10px;">Coverage Summary <span style="font-weight:400;">(briefly explain how the document addresses each NIST sub-requirement)</span></label>
          <textarea class="form-input" rows="3" style="font-size:12px;resize:vertical;" placeholder="e.g. Section 3.1 addresses sub-req (a–d): account types and approval. Section 4 covers (g): monitoring. Section 5 covers (h–l): lifecycle notifications." oninput="setCtrlField('${cid}','externalDocSummary',this.value)">${escapeHTML(cs.externalDocSummary||'')}</textarea>
        </div>
        <div style="margin-top:10px;display:flex;justify-content:flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openBulkDesignSourceModal('${cid}')">Apply this source to other controls</button>
        </div>
      </div>
      ` : nistParts ? `
      <div style="font-size:11px;color:#166534;margin-bottom:12px;padding:8px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;">
        ✅ NIST ${ctrl.id} has ${Object.keys(nistParts).length} sub-requirements (${Object.keys(nistParts)[0].toUpperCase()}–${Object.keys(nistParts).slice(-1)[0].toUpperCase()}). Document how your design addresses each one below.
      </div>
      ${Object.keys(nistParts).map(letter => {
        const partText = nistParts[letter];
        const savedVal = designParts[letter] || '';
        const assignments = extractNistAssignments(partText);
        const partParams = ((cs.designPartParams || {})[letter]) || {};
        return `<div style="border:1px solid var(--border);border-radius:8px;margin-bottom:12px;overflow:hidden;">
          <div style="background:#f8fafc;padding:10px 14px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:flex-start;">
            <span style="font-family:monospace;font-size:14px;font-weight:800;color:var(--navy);background:rgba(30,58,95,0.08);padding:2px 8px;border-radius:4px;flex-shrink:0;">${letter.toUpperCase()}</span>
            <div style="font-size:11px;color:var(--text-muted);line-height:1.6;">${escapeHTML(partText.length > 220 ? partText.substring(0,220)+'…' : partText)}</div>
          </div>
          <div style="padding:10px 14px;">
            <label class="form-label" style="font-size:10px;">How does your design address sub-requirement ${letter.toUpperCase()}?</label>
            <textarea class="form-input" rows="3" style="font-size:12px;line-height:1.6;resize:vertical;" placeholder="Describe the specific process, system, or mechanism that satisfies this sub-requirement…" oninput="setCtrlDesignPart('${cid}','${letter}',this.value)">${escapeHTML(savedVal)}</textarea>
            ${assignments.length ? `<div style="margin-top:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 12px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#1d4ed8;margin-bottom:6px;">Tailoring Required for This Sub-Requirement</div>
              <div style="font-size:11px;color:#1e3a8a;margin-bottom:8px;">Fill organization-defined values referenced in this specific subcomponent.</div>
              ${assignments.map(a => {
                const safeA = a.replace(/'/g,"\\'");
                const savedA = partParams[a] || '';
                return `<label class="form-label" style="font-size:10px;margin-top:6px;">${escapeHTML(a)}</label>
                <input class="form-input" style="font-size:12px;" value="${escapeHTML(savedA)}" placeholder="Define value for: ${escapeHTML(a)}" oninput="setCtrlPartAssignment('${cid}','${letter}','${safeA}',this.value)">`;
              }).join('')}
            </div>` : ''}
          </div>
        </div>`;
      }).join('')}
      ` : `
      <div>
        <label class="form-label">Control Design Description</label>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">Describe how this control is designed and implemented. Be specific about systems, processes, configurations, and responsible roles. Assessors use this to verify your implementation.</div>
        <textarea class="form-input" rows="5" style="font-size:12px;line-height:1.6;resize:vertical;" placeholder="Describe how this control operates in your environment…" oninput="setCtrlField('${cid}','approach',this.value)">${escapeHTML(cs.approach||'')}</textarea>
        ${controlAssignments.length ? `<div style="margin-top:10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 12px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#1d4ed8;margin-bottom:6px;">Tailoring Required</div>
          <div style="font-size:11px;color:#1e3a8a;margin-bottom:8px;">This control statement includes organization-defined values. Define them here as part of the design.</div>
          ${controlAssignments.map(a => {
            const safeA = a.replace(/'/g,"\\'");
            const savedA = designParams[a] || '';
            return `<label class="form-label" style="font-size:10px;margin-top:6px;">${escapeHTML(a)}</label>
            <input class="form-input" style="font-size:12px;" value="${escapeHTML(savedA)}" placeholder="Define value for: ${escapeHTML(a)}" oninput="setCtrlAssignment('${cid}','${safeA}',this.value)">`;
          }).join('')}
        </div>` : ''}
      </div>
      `}

      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <label class="form-label" style="margin-bottom:0;">Auditor-Ready Narrative <span style="font-weight:400;font-size:11px;color:var(--text-muted);">(optional — integrates all sub-reqs into one statement)</span></label>
          <button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openBulkControlFieldModal('${cid}','narrative')">Apply to controls…</button>
        </div>
        <textarea class="form-input" rows="3" style="font-size:12px;line-height:1.6;resize:vertical;" placeholder="The organization implements ${ctrl.id} through…" oninput="setCtrlField('${cid}','narrative',this.value)">${escapeHTML(cs.narrative||'')}</textarea>
      </div>
    </div>

    ${buildEvidenceArtifactSectionHTML(ctrl)}

    <!-- ⑤ Implementation Status -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:4px;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);">Implementation Status</div>
        <button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openBulkControlFieldModal('${cid}','implementationStatus')">Apply to controls…</button>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">Set the overall status. If asset types are in scope, you can also track status per asset type to reflect partial rollout.</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:${coveredTypes.length>0?'14px':'0'};">
        <div>
          <label class="form-label" style="font-size:10px;">Overall Status</label>
          <select class="form-select" onchange="setCtrlStatus('${cid}',this.value)">
            ${['Not Started','Planned','In Progress','Implemented','Not Applicable','Inherited'].map(s=>`<option ${st===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        ${st==='Planned'||st==='In Progress' ? `
        <div>
          <label class="form-label" style="font-size:10px;">Target Completion Date</label>
          <input class="form-input" type="date" style="font-size:12px;" value="${escapeHTML(co.dueDate||'')}" oninput="setCtrlOwnerField('${cid}','dueDate',this.value)">
        </div>` : ''}
      </div>

      ${coveredTypes.length > 0 ? `
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:12px 14px;">
        <div style="font-size:11px;font-weight:700;color:var(--navy);margin-bottom:10px;">Status by Asset Type</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${coveredTypes.map(t => {
            const tStatus = assetTypeStatus[t.key] || '';
            const tkey = t.key.replace(/'/g,"\\'");
            return `<div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:11px;color:var(--navy);min-width:220px;">${escapeHTML(t.label)}</span>
              <select class="form-select" style="flex:1;font-size:11px;padding:5px 8px;" onchange="setCtrlAssetTypeStatus('${cid}','${tkey}',this.value)">
                ${['','Not Started','Planned','In Progress','Implemented','Not Applicable','Inherited'].map(s=>`<option ${tStatus===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      ${st === 'Not Applicable' ? `
      <div style="margin-top:14px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:14px;">
        <label class="form-label" style="color:#c2410c;font-size:10px;">⚠️ Not Applicable — Justification Required <span class="required">*</span></label>
        <textarea class="form-input" rows="3" style="font-size:12px;resize:vertical;" placeholder="Explain why this control does not apply…" oninput="setCtrlField('${cid}','naJustification',this.value)">${escapeHTML(cs.naJustification||'')}</textarea>
      </div>` : ''}
      ${st === 'Inherited' ? `
      <div style="margin-top:14px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:14px;">
        <label class="form-label" style="color:#1d4ed8;font-size:10px;">🔗 Inherited From — Source Required</label>
        <input class="form-input" style="font-size:12px;" placeholder="e.g. AWS GovCloud (FedRAMP High), or Corporate AD managed by IT Ops…" value="${escapeHTML(cs.inheritedFrom||'')}" oninput="setCtrlField('${cid}','inheritedFrom',this.value)">
      </div>` : ''}
    </div>

    <!-- ⑥ Internal Notes -->
    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:4px;">Internal Notes <span style="font-weight:400;font-size:11px;color:var(--text-muted);">(not included in reports)</span></div>
      <textarea class="form-input" rows="2" style="font-size:12px;resize:vertical;" placeholder="Gaps, remediation plans, open questions, implementation blockers…" oninput="setCtrlField('${cid}','notes',this.value)">${escapeHTML(cs.notes||'')}</textarea>
    </div>

    <!-- ⑦ Return / De-select -->
    <div style="border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 16px;background:rgba(239,68,68,0.02);margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:2px;">Not your control?</div>
          <div style="font-size:11px;color:var(--text-muted);">Return it to the policy owner for reassignment, or propose that it be removed from scope.</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;margin-left:auto;">
          <button class="btn btn-sm" style="background:white;border:1px solid rgba(220,38,38,0.4);color:#dc2626;font-weight:600;white-space:nowrap;" onclick="returnControlToPolicyOwner('${cid}')">↩ Return to Policy Owner</button>
          <button class="btn btn-sm" style="background:white;border:1px solid rgba(245,158,11,0.4);color:#d97706;font-weight:600;white-space:nowrap;" onclick="recommendControlDeselect('${cid}')">✗ Propose De-selection</button>
        </div>
      </div>
    </div>

    <!-- Prev / Next -->
    <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);">
      <button class="btn btn-secondary btn-sm" onclick="${pn.prev?`selectCtrlDetail('${pn.prev.replace(/'/g,"\\'")}')`:''}" ${!pn.prev?'disabled style="opacity:0.5;cursor:not-allowed;"':''}>← Prev Control</button>
      <button class="btn btn-secondary btn-sm" onclick="${pn.next?`selectCtrlDetail('${pn.next.replace(/'/g,"\\'")}')`:''}" ${!pn.next?'disabled style="opacity:0.5;cursor:not-allowed;"':''}>Next Control →</button>
    </div>`;
}

function setCtrlStatus(ctrlId, status) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var oldStatus = state.controlStatus[ctrlId].status || 'Not Started';
  state.controlStatus[ctrlId].status = status;
  logFieldChange('controlStatus.' + ctrlId + '.status', oldStatus, status);
  if (oldStatus !== status) addAuditEntry('control', ctrlId, 'Status changed: ' + oldStatus + ' → ' + status);
  renderControlStep2();
}

var __CTRL_FIELD_LOG_SKIP = { approach: 1, narrative: 1, notes: 1, naJustification: 1, externalDocSummary: 1 };
function setCtrlField(ctrlId, field, value) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  var prev = state.controlStatus[ctrlId][field];
  state.controlStatus[ctrlId][field] = value;
  if (!__CTRL_FIELD_LOG_SKIP[field]) logFieldChange('controlStatus.' + ctrlId + '.' + field, prev, value);
  markDirty();
}

function setCtrlOwnerField(ctrlId, field, value) {
  if (!state.controlOwners) state.controlOwners = {};
  if (!state.controlOwners[ctrlId]) state.controlOwners[ctrlId] = {};
  var prev = state.controlOwners[ctrlId][field];
  state.controlOwners[ctrlId][field] = value;
  if (field === 'name' || field === 'email') delete state.controlOwners[ctrlId].isDemoPlaceholder;
  logFieldChange('controlOwners.' + ctrlId + '.' + field, prev, value);
  markDirty();
}

function addCtrlEvidence(ctrlId) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].evidence) state.controlStatus[ctrlId].evidence = [];
  state.controlStatus[ctrlId].evidence.push({ kind: 'ref', type: 'Policy', title: '', description: '', url: '', ref: '' });
  markDirty();
  renderControlStep2();
}

function removeCtrlEvidence(ctrlId, idx) {
  if (!state.controlStatus[ctrlId] || !state.controlStatus[ctrlId].evidence) return;
  state.controlStatus[ctrlId].evidence.splice(idx, 1);
  markDirty();
  renderControlStep2();
}

function setEvidenceField(ctrlId, idx, field, value) {
  if (state.controlStatus[ctrlId]?.evidence?.[idx]) {
    var prev = state.controlStatus[ctrlId].evidence[idx][field];
    state.controlStatus[ctrlId].evidence[idx][field] = value;
    if (field === 'url') state.controlStatus[ctrlId].evidence[idx].ref = value;
    if (field === 'ref' && !state.controlStatus[ctrlId].evidence[idx].url) state.controlStatus[ctrlId].evidence[idx].url = value;
    logFieldChange('controlStatus.' + ctrlId + '.evidence[' + idx + '].' + field, prev, value);
    markDirty();
  }
}

function getBulkEvidenceEligibleControls(sourceCtrlId) {
  return getScopedControls().filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    if (c.id === sourceCtrlId) return false;
    if (cs.returnedToPolicyOwner || cs.recommendedDeselect) return false;
    return true;
  });
}

function buildEvidenceRowSignature(row) {
  if (!row) return '';
  var kind = row.kind === 'image' ? 'image' : 'ref';
  if (kind === 'image') {
    return 'image|' + String(row.caption || '').trim() + '|' + String(row.dataUrl || '').trim();
  }
  return 'ref|' + String(row.type || '').trim() + '|' + String(row.title || '').trim() + '|' + String(row.url || row.ref || '').trim() + '|' + String(row.description || '').trim();
}

function cloneEvidenceRowForCopy(row) {
  if (!row) return null;
  if (row.kind === 'image') {
    return {
      kind: 'image',
      caption: String(row.caption || ''),
      dataUrl: String(row.dataUrl || ''),
      mime: String(row.mime || (String(row.dataUrl || '').indexOf('image/jpeg') !== -1 ? 'image/jpeg' : 'image/png'))
    };
  }
  return {
    kind: 'ref',
    type: String(row.type || 'Policy'),
    title: String(row.title || ''),
    description: String(row.description || ''),
    url: String(row.url || row.ref || ''),
    ref: String(row.url || row.ref || '')
  };
}

function openBulkEvidenceRowModal(sourceCtrlId, rowIdx) {
  normalizeControlDesignState(sourceCtrlId);
  var sourceControl = CONTROLS.find(function(c) { return c.id === sourceCtrlId; });
  var sourceRows = ((state.controlStatus || {})[sourceCtrlId] || {}).evidence || [];
  var sourceRow = sourceRows[rowIdx];
  if (!sourceRow) {
    showToast('Evidence row not found.', true);
    return;
  }
  var sourceSignature = buildEvidenceRowSignature(sourceRow);
  if (!sourceSignature) {
    showToast('Complete the evidence row first before bulk apply.', true);
    return;
  }
  var eligible = getBulkEvidenceEligibleControls(sourceCtrlId);
  if (!eligible.length) {
    showToast('No other eligible controls found in your queue.', true);
    return;
  }

  var selected = {};
  var defaultFamily = sourceControl ? sourceControl.f : '';
  eligible.forEach(function(c) { selected[c.id] = !!(defaultFamily && c.f === defaultFamily); });

  window._bulkEvidenceRowState = {
    sourceCtrlId: sourceCtrlId,
    sourceRowIdx: rowIdx,
    familyFilter: defaultFamily,
    search: '',
    selected: selected
  };

  var existing = document.getElementById('bulkEvidenceRowOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'bulkEvidenceRowOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:10060;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:28px 18px;';
  overlay.innerHTML = ''
    + '<div style="background:white;border-radius:14px;width:940px;max-width:100%;box-shadow:0 24px 60px rgba(2,6,23,0.22);overflow:hidden;">'
    + '  <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">'
    + '    <div>'
    + '      <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:4px;">Apply this evidence row to other controls</div>'
    + '      <div style="font-size:12px;color:var(--text-muted);line-height:1.45;">Source: <span class="control-id">' + escapeHTML(sourceCtrlId) + '</span> · Evidence row ' + (rowIdx + 1) + '</div>'
    + '    </div>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkEvidenceRowModal()">Close</button>'
    + '  </div>'
    + '  <div id="bulkEvidenceRowBody" style="padding:16px 20px;"></div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBulkEvidenceRowModal(); });
  renderBulkEvidenceRowModalBody();
}

function closeBulkEvidenceRowModal() {
  var overlay = document.getElementById('bulkEvidenceRowOverlay');
  if (overlay) overlay.remove();
  window._bulkEvidenceRowState = null;
}

function renderBulkEvidenceRowModalBody() {
  var st = window._bulkEvidenceRowState;
  var body = document.getElementById('bulkEvidenceRowBody');
  if (!st || !body) return;
  var eligible = getBulkEvidenceEligibleControls(st.sourceCtrlId);
  var sourceControl = CONTROLS.find(function(c) { return c.id === st.sourceCtrlId; });
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
    + '    <select class="form-select" style="font-size:12px;" onchange="window._bulkEvidenceRowState.familyFilter=this.value;renderBulkEvidenceRowModalBody();">'
    + '      <option value="">All families</option>'
    +        families.map(function(f) {
              return '<option value="' + escapeHTML(f) + '"' + (familyFilter === f ? ' selected' : '') + '>' + escapeHTML(f + ' — ' + (FAMILIES[f] || f)) + '</option>';
            }).join('')
    + '    </select></div>'
    + '  <div><label class="form-label" style="font-size:10px;">Search</label>'
    + '    <input class="form-input" style="font-size:12px;" placeholder="Filter by control ID or name" value="' + escapeHTML(st.search || '') + '" oninput="window._bulkEvidenceRowState.search=this.value;renderBulkEvidenceRowModalBody();"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
    + '  <div style="font-size:12px;color:var(--text-muted);">' + selectedCount + ' selected of ' + eligible.length + ' eligible controls'
    + (sourceControl && sourceControl.f ? ' · default scope: ' + escapeHTML(sourceControl.f) : '')
    + '  </div>'
    + '  <div style="display:flex;gap:8px;">'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkEvidenceSelectFiltered(true)">Select all eligible</button>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkEvidenceSelectFiltered(false)">Clear</button>'
    + '  </div>'
    + '</div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Evidence is appended; duplicate rows (same type+reference or same image+caption) are skipped.</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;max-height:360px;overflow:auto;">'
    + '  <table class="control-table" style="margin:0;">'
    + '    <thead><tr>'
    + '      <th style="width:42px;"><input type="checkbox" ' + (allFilteredSelected ? 'checked' : '') + ' onchange="bulkEvidenceSelectFiltered(this.checked)" style="accent-color:var(--teal);"></th>'
    + '      <th style="width:95px;">Control</th>'
    + '      <th>Name</th>'
    + '      <th style="width:70px;">Family</th>'
    + '      <th style="width:100px;">Evidence Rows</th>'
    + '    </tr></thead>'
    + '    <tbody>'
    +      (filtered.length ? filtered.map(function(c) {
            var cs = (state.controlStatus || {})[c.id] || {};
            var checked = !!st.selected[c.id];
            var evCount = (cs.evidence || []).length;
            return '<tr>'
              + '<td><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="bulkEvidenceSetOne(\'' + c.id.replace(/'/g, "\\'") + '\',this.checked)" style="accent-color:var(--teal);"></td>'
              + '<td><span class="control-id">' + escapeHTML(c.id) + '</span></td>'
              + '<td style="font-size:12px;color:var(--navy);">' + escapeHTML(c.n) + '</td>'
              + '<td><span class="family-badge">' + escapeHTML(c.f) + '</span></td>'
              + '<td style="font-size:11px;color:var(--text-muted);">' + evCount + '</td>'
              + '</tr>';
          }).join('') : '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No controls match current filter.</td></tr>')
    + '    </tbody>'
    + '  </table>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">'
    + '  <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkEvidenceRowModal()">Cancel</button>'
    + '  <button type="button" class="btn btn-primary btn-sm" onclick="applyBulkEvidenceRowToSelected()">Apply evidence row</button>'
    + '</div>';
}

function bulkEvidenceSetOne(ctrlId, checked) {
  var st = window._bulkEvidenceRowState;
  if (!st) return;
  st.selected[ctrlId] = !!checked;
  renderBulkEvidenceRowModalBody();
}

function bulkEvidenceSelectFiltered(checked) {
  var st = window._bulkEvidenceRowState;
  if (!st) return;
  var eligible = getBulkEvidenceEligibleControls(st.sourceCtrlId);
  var q = String(st.search || '').toLowerCase();
  var familyFilter = String(st.familyFilter || '');
  eligible.forEach(function(c) {
    if (familyFilter && c.f !== familyFilter) return;
    if (q && String(c.id).toLowerCase().indexOf(q) === -1 && String(c.n || '').toLowerCase().indexOf(q) === -1) return;
    st.selected[c.id] = !!checked;
  });
  renderBulkEvidenceRowModalBody();
}

function applyBulkEvidenceRowToSelected() {
  var st = window._bulkEvidenceRowState;
  if (!st) return;
  normalizeControlDesignState(st.sourceCtrlId);
  var sourceRows = ((state.controlStatus || {})[st.sourceCtrlId] || {}).evidence || [];
  var sourceRow = sourceRows[st.sourceRowIdx];
  if (!sourceRow) {
    showToast('Source evidence row not found.', true);
    return;
  }
  var copiedRow = cloneEvidenceRowForCopy(sourceRow);
  if (!copiedRow) {
    showToast('Unable to copy source evidence row.', true);
    return;
  }
  var sourceSig = buildEvidenceRowSignature(copiedRow);
  if (!sourceSig) {
    showToast('Complete the source evidence row first.', true);
    return;
  }
  var selectedIds = getBulkEvidenceEligibleControls(st.sourceCtrlId)
    .map(function(c) { return c.id; })
    .filter(function(id) { return !!st.selected[id]; });
  if (!selectedIds.length) {
    showToast('Select at least one control to update.', true);
    return;
  }
  if (!window.confirm('Apply this evidence row to ' + selectedIds.length + ' control' + (selectedIds.length === 1 ? '' : 's') + '?')) {
    return;
  }

  var idx = 0;
  var appliedCount = 0;
  var skippedCount = 0;

  function applyChunk() {
    var end = Math.min(idx + 30, selectedIds.length);
    for (; idx < end; idx++) {
      var ctrlId = selectedIds[idx];
      normalizeControlDesignState(ctrlId);
      var cs = state.controlStatus[ctrlId] || {};
      if (!Array.isArray(cs.evidence)) cs.evidence = [];
      var signatures = {};
      cs.evidence.forEach(function(r) { signatures[buildEvidenceRowSignature(r)] = true; });
      if (signatures[sourceSig]) {
        skippedCount++;
        continue;
      }
      cs.evidence.push(cloneEvidenceRowForCopy(copiedRow));
      appliedCount++;
    }
    if (idx < selectedIds.length) {
      requestAnimationFrame(applyChunk);
      return;
    }

    addAuditEntry('control', st.sourceCtrlId, 'Bulk-applied evidence row ' + (st.sourceRowIdx + 1) + ' from ' + st.sourceCtrlId + ' to ' + appliedCount + ' control(s)' + (skippedCount ? ' (' + skippedCount + ' duplicates skipped)' : '') + '.');
    markDirty();
    closeBulkEvidenceRowModal();
    showToast('✅ Evidence applied to ' + appliedCount + ' control' + (appliedCount === 1 ? '' : 's') + (skippedCount ? ' · ' + skippedCount + ' duplicates skipped' : '') + '.');
    renderControlStep2();
  }

  applyChunk();
}

function getGenericBulkEligibleControls(sourceCtrlId) {
  return getScopedControls().filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    if (c.id === sourceCtrlId) return false;
    if (cs.returnedToPolicyOwner || cs.recommendedDeselect) return false;
    return true;
  });
}

function openBulkControlFieldModal(sourceCtrlId, mode) {
  var source = CONTROLS.find(function(c) { return c.id === sourceCtrlId; });
  var sourceStatus = (state.controlStatus || {})[sourceCtrlId] || {};
  var eligible = getGenericBulkEligibleControls(sourceCtrlId);
  if (!eligible.length) {
    showToast('No other eligible controls found in your queue.', true);
    return;
  }
  var modeMeta = {
    assetCoverage: {
      title: 'Apply asset coverage to other controls',
      summary: 'Copies selected asset types from this control. Existing target coverage is replaced.',
      preview: function() {
        var keys = Object.keys(sourceStatus.assetCoverage || {}).filter(function(k) { return !!(sourceStatus.assetCoverage || {})[k]; });
        return keys.length ? (keys.length + ' selected asset type(s)') : 'No asset types currently selected';
      }
    },
    narrative: {
      title: 'Apply auditor-ready narrative to other controls',
      summary: 'Copies Auditor-Ready Narrative text from this control.',
      preview: function() {
        var txt = String(sourceStatus.narrative || '').trim();
        return txt ? (txt.length > 120 ? txt.slice(0, 120) + '…' : txt) : 'No narrative text entered';
      }
    },
    implementationStatus: {
      title: 'Apply implementation status to other controls',
      summary: 'Copies overall Implementation Status and status by asset type. Existing status fields are replaced.',
      preview: function() {
        var status = String(sourceStatus.status || 'Not Started');
        var byType = Object.keys(sourceStatus.assetTypeStatus || {}).filter(function(k){ return !!(sourceStatus.assetTypeStatus || {})[k]; }).length;
        return status + (byType ? (' · ' + byType + ' asset-type override(s)') : '');
      }
    }
  };
  var meta = modeMeta[mode];
  if (!meta) return;

  var selected = {};
  var defaultFamily = source ? source.f : '';
  eligible.forEach(function(c) { selected[c.id] = !!(defaultFamily && c.f === defaultFamily); });

  window._bulkControlFieldState = {
    sourceCtrlId: sourceCtrlId,
    mode: mode,
    familyFilter: defaultFamily,
    search: '',
    selected: selected
  };

  var existing = document.getElementById('bulkControlFieldOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'bulkControlFieldOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:10070;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:28px 18px;';
  overlay.innerHTML = ''
    + '<div style="background:white;border-radius:14px;width:940px;max-width:100%;box-shadow:0 24px 60px rgba(2,6,23,0.22);overflow:hidden;">'
    + '  <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">'
    + '    <div>'
    + '      <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:4px;">' + escapeHTML(meta.title) + '</div>'
    + '      <div style="font-size:12px;color:var(--text-muted);line-height:1.45;">Source: <span class="control-id">' + escapeHTML(sourceCtrlId) + '</span> — ' + escapeHTML((source && source.n) || '') + '</div>'
    + '      <div style="font-size:11px;color:#334155;line-height:1.45;margin-top:4px;"><strong>Preview:</strong> ' + escapeHTML(meta.preview()) + '</div>'
    + '      <div style="font-size:11px;color:var(--text-muted);line-height:1.45;margin-top:3px;">' + escapeHTML(meta.summary) + '</div>'
    + '    </div>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkControlFieldModal()">Close</button>'
    + '  </div>'
    + '  <div id="bulkControlFieldBody" style="padding:16px 20px;"></div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBulkControlFieldModal(); });
  renderBulkControlFieldModalBody();
}

function closeBulkControlFieldModal() {
  var overlay = document.getElementById('bulkControlFieldOverlay');
  if (overlay) overlay.remove();
  window._bulkControlFieldState = null;
}

function renderBulkControlFieldModalBody() {
  var st = window._bulkControlFieldState;
  var body = document.getElementById('bulkControlFieldBody');
  if (!st || !body) return;
  var eligible = getGenericBulkEligibleControls(st.sourceCtrlId);
  var sourceControl = CONTROLS.find(function(c) { return c.id === st.sourceCtrlId; });
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
    + '    <select class="form-select" style="font-size:12px;" onchange="window._bulkControlFieldState.familyFilter=this.value;renderBulkControlFieldModalBody();">'
    + '      <option value="">All families</option>'
    +        families.map(function(f) {
              return '<option value="' + escapeHTML(f) + '"' + (familyFilter === f ? ' selected' : '') + '>' + escapeHTML(f + ' — ' + (FAMILIES[f] || f)) + '</option>';
            }).join('')
    + '    </select></div>'
    + '  <div><label class="form-label" style="font-size:10px;">Search</label>'
    + '    <input class="form-input" style="font-size:12px;" placeholder="Filter by control ID or name" value="' + escapeHTML(st.search || '') + '" oninput="window._bulkControlFieldState.search=this.value;renderBulkControlFieldModalBody();"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
    + '  <div style="font-size:12px;color:var(--text-muted);">' + selectedCount + ' selected of ' + eligible.length + ' eligible controls'
    + (sourceControl && sourceControl.f ? ' · default scope: ' + escapeHTML(sourceControl.f) : '')
    + '  </div>'
    + '  <div style="display:flex;gap:8px;">'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkControlFieldSelectFiltered(true)">Select all eligible</button>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkControlFieldSelectFiltered(false)">Clear</button>'
    + '  </div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;max-height:360px;overflow:auto;">'
    + '  <table class="control-table" style="margin:0;">'
    + '    <thead><tr>'
    + '      <th style="width:42px;"><input type="checkbox" ' + (allFilteredSelected ? 'checked' : '') + ' onchange="bulkControlFieldSelectFiltered(this.checked)" style="accent-color:var(--teal);"></th>'
    + '      <th style="width:95px;">Control</th>'
    + '      <th>Name</th>'
    + '      <th style="width:70px;">Family</th>'
    + '    </tr></thead>'
    + '    <tbody>'
    +      (filtered.length ? filtered.map(function(c) {
            var checked = !!st.selected[c.id];
            return '<tr>'
              + '<td><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="bulkControlFieldSetOne(\'' + c.id.replace(/'/g, "\\'") + '\',this.checked)" style="accent-color:var(--teal);"></td>'
              + '<td><span class="control-id">' + escapeHTML(c.id) + '</span></td>'
              + '<td style="font-size:12px;color:var(--navy);">' + escapeHTML(c.n) + '</td>'
              + '<td><span class="family-badge">' + escapeHTML(c.f) + '</span></td>'
              + '</tr>';
          }).join('') : '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No controls match current filter.</td></tr>')
    + '    </tbody>'
    + '  </table>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">'
    + '  <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkControlFieldModal()">Cancel</button>'
    + '  <button type="button" class="btn btn-primary btn-sm" onclick="applyBulkControlFieldToSelected()">Apply to selected controls</button>'
    + '</div>';
}

function bulkControlFieldSetOne(ctrlId, checked) {
  var st = window._bulkControlFieldState;
  if (!st) return;
  st.selected[ctrlId] = !!checked;
  renderBulkControlFieldModalBody();
}

function bulkControlFieldSelectFiltered(checked) {
  var st = window._bulkControlFieldState;
  if (!st) return;
  var eligible = getGenericBulkEligibleControls(st.sourceCtrlId);
  var q = String(st.search || '').toLowerCase();
  var familyFilter = String(st.familyFilter || '');
  eligible.forEach(function(c) {
    if (familyFilter && c.f !== familyFilter) return;
    if (q && String(c.id).toLowerCase().indexOf(q) === -1 && String(c.n || '').toLowerCase().indexOf(q) === -1) return;
    st.selected[c.id] = !!checked;
  });
  renderBulkControlFieldModalBody();
}

function applyBulkControlFieldToSelected() {
  var st = window._bulkControlFieldState;
  if (!st) return;
  var sourceId = st.sourceCtrlId;
  var mode = st.mode;
  var sourceCs = (state.controlStatus || {})[sourceId] || {};
  var selectedIds = getGenericBulkEligibleControls(sourceId)
    .map(function(c) { return c.id; })
    .filter(function(id) { return !!st.selected[id]; });
  if (!selectedIds.length) {
    showToast('Select at least one control to update.', true);
    return;
  }

  if (mode === 'narrative' && !String(sourceCs.narrative || '').trim()) {
    showToast('Enter Auditor-Ready Narrative text first.', true);
    return;
  }
  if (mode === 'assetCoverage') {
    var covKeys = Object.keys(sourceCs.assetCoverage || {}).filter(function(k){ return !!(sourceCs.assetCoverage || {})[k]; });
    if (!covKeys.length) {
      showToast('Select at least one asset type coverage checkbox first.', true);
      return;
    }
  }

  if (!window.confirm('Apply this to ' + selectedIds.length + ' control' + (selectedIds.length === 1 ? '' : 's') + '?')) return;

  var idx = 0;
  var appliedCount = 0;
  var skippedCount = 0;

  function applyChunk() {
    var end = Math.min(idx + 30, selectedIds.length);
    for (; idx < end; idx++) {
      var ctrlId = selectedIds[idx];
      normalizeControlDesignState(ctrlId);
      var target = state.controlStatus[ctrlId] || {};
      var changed = false;

      if (mode === 'assetCoverage') {
        var nextCoverage = JSON.parse(JSON.stringify(sourceCs.assetCoverage || {}));
        var prevSig = JSON.stringify(target.assetCoverage || {});
        var nextSig = JSON.stringify(nextCoverage || {});
        if (prevSig !== nextSig) {
          target.assetCoverage = nextCoverage;
          changed = true;
        }
      } else if (mode === 'narrative') {
        var nextNarrative = String(sourceCs.narrative || '');
        if (String(target.narrative || '') !== nextNarrative) {
          target.narrative = nextNarrative;
          changed = true;
        }
      } else if (mode === 'implementationStatus') {
        var nextStatus = String(sourceCs.status || 'Not Started');
        var prevStatus = String(target.status || 'Not Started');
        var prevAssetTypeStatusSig = JSON.stringify(target.assetTypeStatus || {});
        var nextAssetTypeStatus = JSON.parse(JSON.stringify(sourceCs.assetTypeStatus || {}));
        var nextAssetTypeStatusSig = JSON.stringify(nextAssetTypeStatus || {});
        if (prevStatus !== nextStatus) {
          target.status = nextStatus;
          changed = true;
        }
        if (prevAssetTypeStatusSig !== nextAssetTypeStatusSig) {
          target.assetTypeStatus = nextAssetTypeStatus;
          changed = true;
        }
      }

      if (changed) appliedCount++;
      else skippedCount++;
    }

    if (idx < selectedIds.length) {
      requestAnimationFrame(applyChunk);
      return;
    }

    var modeLabel = mode === 'assetCoverage' ? 'asset coverage'
      : mode === 'narrative' ? 'auditor-ready narrative'
      : 'implementation status';
    addAuditEntry('control', sourceId, 'Bulk-applied ' + modeLabel + ' from ' + sourceId + ' to ' + appliedCount + ' control(s)' + (skippedCount ? ' (' + skippedCount + ' unchanged)' : '') + '.');
    markDirty();
    closeBulkControlFieldModal();
    showToast('✅ Applied ' + modeLabel + ' to ' + appliedCount + ' control' + (appliedCount === 1 ? '' : 's') + (skippedCount ? ' · ' + skippedCount + ' unchanged' : '') + '.');
    renderControlStep2();
  }

  applyChunk();
}

function setAssetCoverage(ctrlId, typeKey, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].assetCoverage) state.controlStatus[ctrlId].assetCoverage = {};
  state.controlStatus[ctrlId].assetCoverage[typeKey] = checked;
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

function getAllAssetTypes() {
  ensureAssetTypeMetadata();
  var custom = (state.customAssetTypes || []).filter(function(t){ return t && t.trim(); });
  var standard = [];
  getActiveAssetTypeCatalog().forEach(function(cat){ cat.types.forEach(function(t){ standard.push(t.label); }); });
  return standard.concat(custom).concat(['Other']);
}

function getAssetTypeKey(label) {
  var catalog = getActiveAssetTypeCatalog();
  for (var i = 0; i < catalog.length; i++) {
    for (var j = 0; j < catalog[i].types.length; j++) {
      if (catalog[i].types[j].label === label) return catalog[i].types[j].key;
    }
  }
  return null;
}

function buildAssetTypeOptions(selectedLabel) {
  var html = '<option value="">— Select type —</option>';
  var activeLabels = [];
  getActiveAssetTypeCatalog().forEach(function(cat) {
    html += '<optgroup label="' + cat.category + '">';
    cat.types.forEach(function(t) {
      activeLabels.push(t.label);
      html += '<option value="' + t.label + '"' + (selectedLabel === t.label ? ' selected' : '') + '>' + t.label + '</option>';
    });
    html += '</optgroup>';
  });
  var custom = (state.customAssetTypes || []).filter(function(t){ return t && t.trim(); });
  if (custom.length) {
    html += '<optgroup label="Custom">';
    custom.forEach(function(t) {
      html += '<option value="' + t + '"' + (selectedLabel === t ? ' selected' : '') + '>' + t + '</option>';
    });
    html += '</optgroup>';
  }
  if (selectedLabel && selectedLabel !== 'Other' && activeLabels.indexOf(selectedLabel) === -1 && custom.indexOf(selectedLabel) === -1) {
    html += '<optgroup label="Retired / Unlisted"><option value="' + _esc(selectedLabel) + '" selected>' + _esc(selectedLabel) + '</option></optgroup>';
  }
  html += '<option value="Other"' + (selectedLabel === 'Other' ? ' selected' : '') + '>Other</option>';
  return html;
}

function setCustomAssetCoverage(ctrlId, typeName, checked) {
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  if (!state.controlStatus[ctrlId].assetCoverage) state.controlStatus[ctrlId].assetCoverage = {};
  state.controlStatus[ctrlId].assetCoverage['custom_' + typeName] = checked;
  markDirty();
  if (state._selectedCtrl === ctrlId) renderControlStep2();
}

function addCustomAssetType(ctrlId) {
  var input = document.getElementById('_newAssetTypeName');
  var groupInput = document.getElementById('_newAssetTypeCategory');
  if (!input) return;
  var name = input.value.trim();
  var groupName = (groupInput && groupInput.value ? groupInput.value : 'Custom').trim() || 'Custom';
  if (!name) { showToast('Please enter a type name.', true); input.focus(); return; }
  var allExisting = getAllAssetTypes().map(function(t){ return t.toLowerCase(); });
  if (allExisting.includes(name.toLowerCase())) {
    showToast('"' + name + '" already exists.', true); input.select(); return;
  }
  input.value = '';
  applyAssetTypeAdd(name, groupName);
  addAuditEntry('program', 'asset-types', 'Asset type added by ' + getCurrentActorName() + ': "' + name + '" in group "' + groupName + '" (from control design coverage editor)');
  markDirty();
  showToast('✅ Added asset type "' + name + '"');
  setCustomAssetCoverage(ctrlId, name, true);
  var coverageDiv = document.getElementById('asset-coverage-' + ctrlId);
  if (coverageDiv) coverageDiv.outerHTML = buildAssetCoverageHTML(ctrlId);
}

function removeCustomAssetType(typeName) {
  var clean = String(typeName || '').trim();
  if (!clean) return;
  if (!confirm('Permanently remove "' + clean + '" from the asset type catalog?\n\nThis may affect control coverage mappings that reference this type.')) return;
  var removed = applyAssetTypeDelete(clean);
  if (!removed) { showToast('Type not found or already removed.', true); return; }
  addAuditEntry('program', 'asset-types', 'Asset type removed by ' + getCurrentActorName() + ': "' + clean + '" (from control design coverage editor)');
  markDirty();
  showToast('Removed asset type "' + clean + '"');
  renderControlStep2();
}

// When AI built-in asset types are checked on a control, suggest other in-scope controls teams often review (heuristic — not NIST COSAiS).
var HEURISTIC_AI_GOVERNANCE_CONTROL_IDS = ['SA-3', 'SA-8', 'SA-10', 'SA-11', 'SA-15', 'SI-7', 'SI-10', 'AC-3', 'AC-6', 'AU-2', 'AU-6', 'CM-2', 'CM-6', 'RA-3', 'RA-5', 'SC-28', 'PL-8', 'SR-3', 'SR-5'];

function buildAssetCoverageHTML(ctrlId) {
  ensureAssetTypeMetadata();
  var cs = state.controlStatus[ctrlId] || {};
  var customTypes = state.customAssetTypes || [];
  var cov = cs.assetCoverage || {};
  var hasAiAssetTypeInCoverage = false;
  getActiveAssetTypeCatalog().forEach(function(cat) {
    cat.types.forEach(function(t) {
      if (typeof isBuiltInAiAssetTypeKey === 'function' && isBuiltInAiAssetTypeKey(t.key) && cov[t.key]) hasAiAssetTypeInCoverage = true;
    });
  });

  var cosaisCalloutHTML = '';
  if (hasAiAssetTypeInCoverage) {
    var inScopeSet = {};
    if (typeof getActiveControls === 'function') {
      getActiveControls().forEach(function(c) { inScopeSet[c.id] = true; });
    }
    var suggested = [];
    HEURISTIC_AI_GOVERNANCE_CONTROL_IDS.forEach(function(id) {
      var canon = typeof resolveCatalogControlId === 'function' ? resolveCatalogControlId(id) : id;
      if (canon && canon !== ctrlId && inScopeSet[canon] && suggested.indexOf(canon) === -1) suggested.push(canon);
    });
    cosaisCalloutHTML = '<div style="grid-column:1/-1;font-size:11px;line-height:1.55;color:#4c1d95;background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 12px;margin-bottom:6px;">'
      + '<div style="font-weight:800;margin-bottom:4px;color:#6b21a8;">AI asset types in scope for this control</div>'
      + 'NIST\'s <a href="https://csrc.nist.gov/projects/cosais" target="_blank" rel="noopener noreferrer" style="color:#6d28d9;font-weight:700;">COSAiS</a> (Control Overlays for Securing AI Systems) develops overlays for applying SP 800-53 to AI use cases — consult that project for emerging official guidance alongside your baseline.'
      + (suggested.length ? '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(107,33,168,0.25);">'
        + '<span style="font-weight:700;color:#6b21a8;">Heuristic only (not from NIST):</span> teams often scrutinize these other in-scope controls when AI types apply: '
        + suggested.map(function(id) {
          return '<span style="font-family:monospace;font-weight:700;background:rgba(255,255,255,0.9);padding:1px 6px;border-radius:4px;margin-right:4px;">' + escapeHTML(id) + '</span>';
        }).join('')
        + '.</div>' : '')
      + '</div>';
  }

  var standardHTML = getActiveAssetTypeCatalog().map(function(cat) {
    var groupHTML = '<div style="grid-column:1/-1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-top:8px;margin-bottom:2px;">' + cat.category + '</div>';
    cat.types.forEach(function(t) {
      var chk = (cs.assetCoverage||{})[t.key];
      groupHTML += '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--navy);cursor:pointer;padding:3px 0;">'
        + '<input type="checkbox"' + (chk?' checked':'') + ' style="accent-color:var(--teal);" onchange="setAssetCoverage(\'' + ctrlId + '\',\'' + t.key + '\',this.checked)">'
        + t.label + '</label>';
    });
    return groupHTML;
  }).join('');

  var groupedCustom = {};
  customTypes.forEach(function(at) {
    var grp = (state.customAssetTypeGroups || {})[at] || 'Custom';
    if (!groupedCustom[grp]) groupedCustom[grp] = [];
    groupedCustom[grp].push(at);
  });
  var customHTML = Object.keys(groupedCustom).sort().map(function(groupName) {
    var groupHeader = '<div style="grid-column:1/-1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#0f766e;margin-top:8px;margin-bottom:2px;">' + _esc(groupName) + '</div>';
    var rows = groupedCustom[groupName].map(function(at) {
      var chk = (cs.assetCoverage||{})['custom_' + at];
      var safeAt = at.replace(/'/g, "\\'");
      return '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--navy);cursor:pointer;padding:3px 0;">'
        + '<input type="checkbox"' + (chk?' checked':'') + ' style="accent-color:var(--teal);" onchange="setCustomAssetCoverage(\'' + ctrlId + '\',\'' + safeAt + '\',this.checked)">'
        + _esc(at)
        + '<span onclick="removeCustomAssetType(\'' + safeAt + '\')" title="Request delete for this type" style="margin-left:4px;color:var(--red);cursor:pointer;font-size:10px;opacity:0.6;" onmouseenter="this.style.opacity=\'1\'" onmouseleave="this.style.opacity=\'0.6\'">✕</span>'
        + '</label>';
    }).join('');
    return groupHeader + rows;
  }).join('');

  var groupOpts = getAllAssetTypeGroups().map(function(g){ return '<option value="' + _esc(g) + '">' + _esc(g) + '</option>'; }).join('');
  var addRowHTML = '<div style="grid-column:1/-1;display:grid;grid-template-columns:1fr 190px auto;align-items:center;gap:6px;margin-top:6px;padding-top:8px;border-top:1px dashed var(--border);">'
    + '<input id="_newAssetTypeName" class="form-input" style="font-size:12px;padding:5px 8px;" placeholder="Add custom type (e.g. IoT Device, Mainframe…)"'
    + ' onkeydown="if(event.key===\'Enter\')addCustomAssetType(\'' + ctrlId + '\')">'
    + '<select id="_newAssetTypeCategory" class="form-select" style="font-size:12px;padding:5px 8px;">' + groupOpts + '</select>'
    + '<button class="btn btn-secondary btn-sm" onclick="addCustomAssetType(\'' + ctrlId + '\')">+ Add</button>'
    + '</div>';

  return '<div id="asset-coverage-' + ctrlId + '" style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;margin-bottom:8px;">'
    + cosaisCalloutHTML + standardHTML + customHTML + addRowHTML
    + '</div>';
}

function toggleAssetMapping(controlId, assetId, checked) {
  if (!state.assetMappings) state.assetMappings = {};
  if (!state.assetMappings[controlId]) state.assetMappings[controlId] = [];
  if (checked) {
    if (!state.assetMappings[controlId].includes(assetId)) state.assetMappings[controlId].push(assetId);
  } else {
    state.assetMappings[controlId] = state.assetMappings[controlId].filter(a => a !== assetId);
  }
  markDirty();
  renderControlStep2();
}

// ── STEP 3: ASSET OWNER REQUIREMENTS ─────────────────────────────────────────
function renderControlStep3() {
  const body = document.getElementById('control-step-3-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div></div>`;
    return;
  }
  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  const designedControls = controls.filter(function(c) {
    const cs = state.controlStatus[c.id] || {};
    return cs.designSource || (cs.approach && cs.approach.trim()) ||
           (cs.designParts && Object.values(cs.designParts).some(v => v && v.trim()));
  });

  if (designedControls.length === 0) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Designed Yet</div><p>Go to Step 2 to design at least one control. Once you've documented the design, you'll define what asset owners need to do to comply.</p><button class="btn btn-primary" onclick="goToStep('control',2)" style="margin-top:16px;">Go to Step 2 →</button></div>`;
    return;
  }

  const filter     = state._ctrlStep3Filter || 'all';
  const allFams    = [...new Set(designedControls.map(c=>c.f))];
  const shown      = filter === 'all' ? designedControls : designedControls.filter(c => c.f === filter);
  const withReqs   = designedControls.filter(function(c) {
    normalizeControlDesignState(c.id);
    return ((state.controlStatus[c.id]||{}).assetOwnerRequirements||[]).some(r =>
      (r.requirement && r.requirement.trim()) || (r.evidenceNeeded && r.evidenceNeeded.trim())
    );
  }).length;
  const uniqueTypes = [...new Set(designedControls.flatMap(c => getCtrlCoveredAssetTypes(c.id).map(t => t.label)))].length;

  body.innerHTML = `
    <div class="section-title">Asset-Type Requirements &amp; Required Evidence</div>
    <div class="section-subtitle">For each designed control, define downstream obligations by asset type: what asset/process owners must do, what evidence they must provide, and how reviewers should judge sufficiency. These definitions flow into the Assets &amp; SSP attestation workflow.</div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px;border-left:3px solid #166534;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#166534;">Controls Designed</div>
        <div style="font-size:26px;font-weight:800;color:#166534;">${designedControls.length}</div>
        <div style="font-size:10px;color:#166534;opacity:0.7;">of ${controls.length} assigned</div>
      </div>
      <div style="background:${withReqs>0?'#f0fdf4':'#f8fafc'};border:1px solid ${withReqs>0?'#86efac':'var(--border)'};border-radius:10px;padding:14px 16px;border-left:3px solid ${withReqs>0?'#166534':'#94a3b8'};">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${withReqs>0?'#166534':'#64748b'};">Requirements Defined</div>
        <div style="font-size:26px;font-weight:800;color:${withReqs>0?'#166534':'#64748b'};">${withReqs}</div>
        <div style="font-size:10px;color:${withReqs>0?'#166534':'#64748b'};opacity:0.7;">controls with asset owner reqs</div>
      </div>
      <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;border-left:3px solid #1d4ed8;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#1d4ed8;">Asset Types in Scope</div>
        <div style="font-size:26px;font-weight:800;color:#1d4ed8;">${uniqueTypes}</div>
        <div style="font-size:10px;color:#1d4ed8;opacity:0.7;">unique types across all controls</div>
      </div>
    </div>

      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#92400e;">
      <strong>💡 Design intent:</strong> You are defining implementation obligations, not attesting compliance. Asset owners will later attest in their own workspace using the requirements/evidence expectations you define here.
    </div>

    <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:16px;flex-wrap:wrap;width:fit-content;">
      ${[['all','All Controls',designedControls.length]].concat(allFams.map(f => [f, f + ' — ' + (FAMILIES[f]||f), designedControls.filter(c=>c.f===f).length])).map(([val,label,count]) =>
        `<button onclick="state._ctrlStep3Filter='${val}';renderControlStep3();" style="padding:7px 14px;font-size:11px;font-weight:600;border:none;cursor:pointer;background:${filter===val?'var(--navy)':'white'};color:${filter===val?'white':'var(--text-muted)'};border-right:1px solid var(--border);">${label} <span style="background:${filter===val?'rgba(255,255,255,0.2)':'#e2e8f0'};border-radius:99px;padding:1px 7px;font-size:10px;margin-left:4px;">${count}</span></button>`
      ).join('')}
    </div>

    <div id="ctrlStep3List">
      ${shown.map(c => {
        normalizeControlDesignState(c.id);
        const cs       = state.controlStatus[c.id] || {};
        const covTypes = getCtrlCoveredAssetTypes(c.id);
        const pReqs    = getControlPolicyReqs(c.id);
        const existing = cs.assetOwnerRequirements || [];
        const cid      = c.id.replace(/'/g,"\\'");

        const typeBlocks = covTypes.length > 0 ? covTypes.map(t => {
          const req   = existing.find(r => r.assetType === t.label) || { assetType: t.label, requirement: '', evidenceNeeded: '', acceptanceCriteria: '' };
          const tlabel = escapeHTML(t.label).replace(/'/g,"\\'");
          return `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px;">
            <div style="background:#f8fafc;padding:8px 12px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--navy);">📦 ${escapeHTML(t.label)}</div>
            <div style="padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label class="form-label" style="font-size:10px;">Required implementation actions <span class="required">*</span></label>
                <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. Review all service accounts quarterly, revoke stale accounts, and document manager approval before reactivation." oninput="setAssetOwnerReq('${cid}','${tlabel}','requirement',this.value)">${escapeHTML(req.requirement||'')}</textarea>
              </div>
              <div>
                <label class="form-label" style="font-size:10px;">Required evidence artifacts</label>
                <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. Signed review report, identity export with timestamps, workflow ticket showing approver and closure." oninput="setAssetOwnerReq('${cid}','${tlabel}','evidenceNeeded',this.value)">${escapeHTML(req.evidenceNeeded||'')}</textarea>
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label" style="font-size:10px;">Evidence acceptance criteria</label>
                <textarea class="form-input" rows="2" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. Must be from current quarter, include asset owner + approver names, and show closure of all exceptions." oninput="setAssetOwnerReq('${cid}','${tlabel}','acceptanceCriteria',this.value)">${escapeHTML(req.acceptanceCriteria||'')}</textarea>
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label" style="font-size:10px;">Procedure / standard references</label>
                <textarea class="form-input" rows="2" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. CP Policy v2.1 §4.3, BCP SOP-07, DR Test Runbook 2026-Q2" oninput="setAssetOwnerReq('${cid}','${tlabel}','procedureRefs',this.value)">${escapeHTML(req.procedureRefs||'')}</textarea>
              </div>
            </div>
          </div>`;
        }).join('') : `
        <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;">
          <div style="background:#f8fafc;padding:8px 12px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--navy);">General Compliance Requirements <span style="font-size:10px;font-weight:400;color:#d97706;">(no asset types identified — go to Step 2 to set asset coverage)</span></div>
          <div style="padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label class="form-label" style="font-size:10px;">Required implementation actions</label>
              <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="Describe compliance requirements for all asset owners…" oninput="setAssetOwnerReq('${cid}','General','requirement',this.value)">${escapeHTML((existing.find(r=>r.assetType==='General')||{}).requirement||'')}</textarea>
            </div>
            <div>
              <label class="form-label" style="font-size:10px;">Required evidence artifacts</label>
              <textarea class="form-input" rows="3" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="What evidence or documentation is needed to prove compliance…" oninput="setAssetOwnerReq('${cid}','General','evidenceNeeded',this.value)">${escapeHTML((existing.find(r=>r.assetType==='General')||{}).evidenceNeeded||'')}</textarea>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label" style="font-size:10px;">Evidence acceptance criteria</label>
              <textarea class="form-input" rows="2" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="Define what makes evidence acceptable for review." oninput="setAssetOwnerReq('${cid}','General','acceptanceCriteria',this.value)">${escapeHTML((existing.find(r=>r.assetType==='General')||{}).acceptanceCriteria||'')}</textarea>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label" style="font-size:10px;">Procedure / standard references</label>
              <textarea class="form-input" rows="2" style="font-size:11px;line-height:1.6;resize:vertical;" placeholder="e.g. Program SOP-12, control procedure wiki page, approved standard ID" oninput="setAssetOwnerReq('${cid}','General','procedureRefs',this.value)">${escapeHTML((existing.find(r=>r.assetType==='General')||{}).procedureRefs||'')}</textarea>
            </div>
          </div>
        </div>`;

        return `<div style="background:white;border:1px solid var(--border);border-radius:10px;margin-bottom:18px;overflow:hidden;">
          <div style="background:#fafbfc;padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
            <span class="control-id">${c.id}</span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;color:var(--navy);">${escapeHTML(c.n)}</div>
              ${covTypes.length > 0
                ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${covTypes.map(t=>escapeHTML(t.label)).join(' · ')}</div>`
                : `<div style="font-size:11px;color:#d97706;margin-top:2px;">⚠ No asset types identified — set coverage in Step 2</div>`}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick="openBulkAssetOwnerReqModal('${cid}')">Apply to controls…</button>
            ${chipHTML(cs.status||'Not Started')}
          </div>
          <div style="padding:16px 18px;">
            ${pReqs.length > 0 ? `<div style="background:#faf5ff;border:1px solid rgba(99,102,241,0.2);border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:11px;color:#6366f1;"><strong>Policy reqs:</strong> ${pReqs.map(r=>escapeHTML(r.reqId)).join(', ')} — ${escapeHTML(pReqs[0].policyTitle)}</div>` : ''}
            ${typeBlocks}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function getStep3DesignedEligibleControls(sourceCtrlId) {
  return getScopedControls().filter(function(c) {
    var cs = state.controlStatus[c.id] || {};
    if (c.id === sourceCtrlId) return false;
    if (cs.returnedToPolicyOwner || cs.recommendedDeselect) return false;
    return !!(
      cs.designSource ||
      (cs.approach && cs.approach.trim()) ||
      (cs.designParts && Object.values(cs.designParts).some(function(v) { return v && v.trim(); }))
    );
  });
}

function cloneAssetOwnerRequirementsForCopy(reqs) {
  return (reqs || []).map(function(r) {
    return {
      assetType: r.assetType || 'General',
      requirement: r.requirement || '',
      evidenceNeeded: r.evidenceNeeded || '',
      acceptanceCriteria: r.acceptanceCriteria || '',
      procedureRefs: r.procedureRefs || ''
    };
  });
}

function signatureAssetOwnerRequirements(reqs) {
  var normalized = cloneAssetOwnerRequirementsForCopy(reqs).slice().sort(function(a, b) {
    return String(a.assetType || '').localeCompare(String(b.assetType || ''));
  });
  return JSON.stringify(normalized);
}

function openBulkAssetOwnerReqModal(sourceCtrlId) {
  normalizeControlDesignState(sourceCtrlId);
  var source = CONTROLS.find(function(c) { return c.id === sourceCtrlId; });
  var sourceReqs = ((state.controlStatus[sourceCtrlId] || {}).assetOwnerRequirements || []);
  if (!sourceReqs.length) {
    showToast('Add at least one Step 3 requirement block before bulk apply.', true);
    return;
  }
  var eligible = getStep3DesignedEligibleControls(sourceCtrlId);
  if (!eligible.length) {
    showToast('No other eligible Step 3 controls found in your queue.', true);
    return;
  }
  var selected = {};
  var defaultFamily = source ? source.f : '';
  eligible.forEach(function(c) { selected[c.id] = !!(defaultFamily && c.f === defaultFamily); });

  window._bulkAssetOwnerReqState = {
    sourceCtrlId: sourceCtrlId,
    familyFilter: defaultFamily,
    search: '',
    selected: selected
  };

  var existing = document.getElementById('bulkAssetOwnerReqOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'bulkAssetOwnerReqOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:10075;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:28px 18px;';
  overlay.innerHTML = ''
    + '<div style="background:white;border-radius:14px;width:940px;max-width:100%;box-shadow:0 24px 60px rgba(2,6,23,0.22);overflow:hidden;">'
    + '  <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">'
    + '    <div>'
    + '      <div style="font-size:15px;font-weight:800;color:var(--navy);margin-bottom:4px;">Apply Step 3 requirements to other controls</div>'
    + '      <div style="font-size:12px;color:var(--text-muted);line-height:1.45;">Source: <span class="control-id">' + escapeHTML(sourceCtrlId) + '</span> — ' + escapeHTML((source && source.n) || '') + '</div>'
    + '      <div style="font-size:11px;color:#334155;line-height:1.45;margin-top:4px;"><strong>Copies:</strong> all Step 3 requirement blocks (actions, evidence, criteria, and procedure references).</div>'
    + '    </div>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkAssetOwnerReqModal()">Close</button>'
    + '  </div>'
    + '  <div id="bulkAssetOwnerReqBody" style="padding:16px 20px;"></div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBulkAssetOwnerReqModal(); });
  renderBulkAssetOwnerReqModalBody();
}

function closeBulkAssetOwnerReqModal() {
  var overlay = document.getElementById('bulkAssetOwnerReqOverlay');
  if (overlay) overlay.remove();
  window._bulkAssetOwnerReqState = null;
}

function renderBulkAssetOwnerReqModalBody() {
  var st = window._bulkAssetOwnerReqState;
  var body = document.getElementById('bulkAssetOwnerReqBody');
  if (!st || !body) return;
  var eligible = getStep3DesignedEligibleControls(st.sourceCtrlId);
  var sourceControl = CONTROLS.find(function(c) { return c.id === st.sourceCtrlId; });
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
    + '    <select class="form-select" style="font-size:12px;" onchange="window._bulkAssetOwnerReqState.familyFilter=this.value;renderBulkAssetOwnerReqModalBody();">'
    + '      <option value="">All families</option>'
    +        families.map(function(f) {
              return '<option value="' + escapeHTML(f) + '"' + (familyFilter === f ? ' selected' : '') + '>' + escapeHTML(f + ' — ' + (FAMILIES[f] || f)) + '</option>';
            }).join('')
    + '    </select></div>'
    + '  <div><label class="form-label" style="font-size:10px;">Search</label>'
    + '    <input class="form-input" style="font-size:12px;" placeholder="Filter by control ID or name" value="' + escapeHTML(st.search || '') + '" oninput="window._bulkAssetOwnerReqState.search=this.value;renderBulkAssetOwnerReqModalBody();"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
    + '  <div style="font-size:12px;color:var(--text-muted);">' + selectedCount + ' selected of ' + eligible.length + ' eligible controls'
    + (sourceControl && sourceControl.f ? ' · default scope: ' + escapeHTML(sourceControl.f) : '')
    + '  </div>'
    + '  <div style="display:flex;gap:8px;">'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkAssetOwnerReqSelectFiltered(true)">Select all eligible</button>'
    + '    <button type="button" class="btn btn-secondary btn-sm" onclick="bulkAssetOwnerReqSelectFiltered(false)">Clear</button>'
    + '  </div>'
    + '</div>'
    + '<div style="border:1px solid var(--border);border-radius:10px;max-height:360px;overflow:auto;">'
    + '  <table class="control-table" style="margin:0;">'
    + '    <thead><tr>'
    + '      <th style="width:42px;"><input type="checkbox" ' + (allFilteredSelected ? 'checked' : '') + ' onchange="bulkAssetOwnerReqSelectFiltered(this.checked)" style="accent-color:var(--teal);"></th>'
    + '      <th style="width:95px;">Control</th>'
    + '      <th>Name</th>'
    + '      <th style="width:70px;">Family</th>'
    + '    </tr></thead>'
    + '    <tbody>'
    +      (filtered.length ? filtered.map(function(c) {
            var checked = !!st.selected[c.id];
            return '<tr>'
              + '<td><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="bulkAssetOwnerReqSetOne(\'' + c.id.replace(/'/g, "\\'") + '\',this.checked)" style="accent-color:var(--teal);"></td>'
              + '<td><span class="control-id">' + escapeHTML(c.id) + '</span></td>'
              + '<td style="font-size:12px;color:var(--navy);">' + escapeHTML(c.n) + '</td>'
              + '<td><span class="family-badge">' + escapeHTML(c.f) + '</span></td>'
              + '</tr>';
          }).join('') : '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No controls match current filter.</td></tr>')
    + '    </tbody>'
    + '  </table>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">'
    + '  <button type="button" class="btn btn-secondary btn-sm" onclick="closeBulkAssetOwnerReqModal()">Cancel</button>'
    + '  <button type="button" class="btn btn-primary btn-sm" onclick="applyBulkAssetOwnerReqToSelected()">Apply to selected controls</button>'
    + '</div>';
}

function bulkAssetOwnerReqSetOne(ctrlId, checked) {
  var st = window._bulkAssetOwnerReqState;
  if (!st) return;
  st.selected[ctrlId] = !!checked;
  renderBulkAssetOwnerReqModalBody();
}

function bulkAssetOwnerReqSelectFiltered(checked) {
  var st = window._bulkAssetOwnerReqState;
  if (!st) return;
  var eligible = getStep3DesignedEligibleControls(st.sourceCtrlId);
  var q = String(st.search || '').toLowerCase();
  var familyFilter = String(st.familyFilter || '');
  eligible.forEach(function(c) {
    if (familyFilter && c.f !== familyFilter) return;
    if (q && String(c.id).toLowerCase().indexOf(q) === -1 && String(c.n || '').toLowerCase().indexOf(q) === -1) return;
    st.selected[c.id] = !!checked;
  });
  renderBulkAssetOwnerReqModalBody();
}

function applyBulkAssetOwnerReqToSelected() {
  var st = window._bulkAssetOwnerReqState;
  if (!st) return;
  normalizeControlDesignState(st.sourceCtrlId);
  var sourceCs = (state.controlStatus || {})[st.sourceCtrlId] || {};
  var sourceReqs = cloneAssetOwnerRequirementsForCopy(sourceCs.assetOwnerRequirements || []);
  if (!sourceReqs.length) {
    showToast('Source control has no Step 3 requirements to copy.', true);
    return;
  }
  var selectedIds = getStep3DesignedEligibleControls(st.sourceCtrlId)
    .map(function(c) { return c.id; })
    .filter(function(id) { return !!st.selected[id]; });
  if (!selectedIds.length) {
    showToast('Select at least one control to update.', true);
    return;
  }
  if (!window.confirm('Apply Step 3 requirements to ' + selectedIds.length + ' control' + (selectedIds.length === 1 ? '' : 's') + '?')) return;

  var idx = 0;
  var appliedCount = 0;
  var skippedCount = 0;
  var sourceSig = signatureAssetOwnerRequirements(sourceReqs);

  function applyChunk() {
    var end = Math.min(idx + 30, selectedIds.length);
    for (; idx < end; idx++) {
      var ctrlId = selectedIds[idx];
      normalizeControlDesignState(ctrlId);
      var targetCs = state.controlStatus[ctrlId] || {};
      var prevSig = signatureAssetOwnerRequirements(targetCs.assetOwnerRequirements || []);
      if (prevSig === sourceSig) {
        skippedCount++;
        continue;
      }
      targetCs.assetOwnerRequirements = cloneAssetOwnerRequirementsForCopy(sourceReqs);
      appliedCount++;
    }

    if (idx < selectedIds.length) {
      requestAnimationFrame(applyChunk);
      return;
    }

    addAuditEntry('control', st.sourceCtrlId, 'Bulk-applied Step 3 requirements from ' + st.sourceCtrlId + ' to ' + appliedCount + ' control(s)' + (skippedCount ? ' (' + skippedCount + ' unchanged)' : '') + '.');
    markDirty();
    closeBulkAssetOwnerReqModal();
    showToast('✅ Applied Step 3 requirements to ' + appliedCount + ' control' + (appliedCount === 1 ? '' : 's') + (skippedCount ? ' · ' + skippedCount + ' unchanged' : '') + '.');
    renderControlStep3();
  }

  applyChunk();
}

function setAssetOwnerReq(ctrlId, assetTypeLabel, field, value) {
  normalizeControlDesignState(ctrlId);
  if (!state.controlStatus[ctrlId]) state.controlStatus[ctrlId] = {};
  const reqs = state.controlStatus[ctrlId].assetOwnerRequirements;
  let existing = reqs.find(r => r.assetType === assetTypeLabel);
  var prev = existing ? existing[field] : undefined;
  if (existing) {
    existing[field] = value;
  } else {
    const newReq = { assetType: assetTypeLabel, requirement: '', evidenceNeeded: '', acceptanceCriteria: '', procedureRefs: '' };
    newReq[field] = value;
    reqs.push(newReq);
  }
  logFieldChange('controlStatus.' + ctrlId + '.assetOwnerReq:' + assetTypeLabel + ':' + field, prev, value);
  markDirty();
}

function getControlOwnerGuidanceForScope(ctrlId, scopeLabel) {
  normalizeControlDesignState(ctrlId);
  var cs = state.controlStatus[ctrlId] || {};
  var reqs = cs.assetOwnerRequirements || [];
  var exact = reqs.find(function(r) { return r.assetType === scopeLabel; });
  var general = reqs.find(function(r) { return r.assetType === 'General'; });
  var selected = exact || general || reqs[0] || null;
  if (!selected) {
    return {
      actions: (cs.assetGuidance || '').trim(),
      evidence: '',
      criteria: '',
      refs: ''
    };
  }
  return {
    actions: selected.requirement || '',
    evidence: selected.evidenceNeeded || '',
    criteria: selected.acceptanceCriteria || '',
    refs: selected.procedureRefs || ''
  };
}

function buildGuidanceFromControlOwner(ctrlId, scopeLabel) {
  var g = getControlOwnerGuidanceForScope(ctrlId, scopeLabel);
  var hasAny = (g.actions || '').trim() || (g.evidence || '').trim() || (g.criteria || '').trim() || (g.refs || '').trim();
  if (!hasAny) {
    return '<em style="color:#86efac;">No requirements defined yet by control owner in Control Wizard Step 3.</em>';
  }
  var html = '';
  if ((g.actions || '').trim()) {
    html += '<div style="margin-bottom:6px;"><strong>Required actions:</strong> ' + _esc(g.actions) + '</div>';
  }
  if ((g.evidence || '').trim()) {
    html += '<div style="margin-bottom:6px;"><strong>Required evidence:</strong> ' + _esc(g.evidence) + '</div>';
  }
  if ((g.criteria || '').trim()) {
    html += '<div><strong>Acceptance criteria:</strong> ' + _esc(g.criteria) + '</div>';
  }
  if ((g.refs || '').trim()) {
    html += '<div style="margin-top:6px;"><strong>Procedure/standard references:</strong> ' + _esc(g.refs) + '</div>';
  }
  return html;
}

// ── STEP 4: REVIEW & SUBMIT DESIGN ───────────────────────────────────────────
function renderControlStep4() {
  const body = document.getElementById('control-step-4-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div></div>`;
    return;
  }
  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  if (!state._controlSubmitSelection) state._controlSubmitSelection = {};
  controls.forEach(function(c) {
    if (state._controlSubmitSelection[c.id] === undefined) {
      const st = (state.controlStatus[c.id] || {}).status || 'Not Started';
      state._controlSubmitSelection[c.id] = st !== 'Not Started';
    }
  });
  const submitEligibleControls = controls.filter(c => ((state.controlStatus[c.id]||{}).status || 'Not Started') !== 'Not Started');
  const selectedForSubmit = submitEligibleControls.filter(c => !!state._controlSubmitSelection[c.id]);
  const notStartedCount = controls.length - submitEligibleControls.length;
  const families = [...new Set(controls.map(c=>c.f))];

  const isDesigned = c => isControlDesigned(c.id);
  const designedControls = controls.filter(isDesigned);
  const withReqs   = controls.filter(c => getControlRequirementCoverage(c).satisfiedCount > 0);
  const fullyMappedReqs = controls.filter(c => {
    const cov = getControlRequirementCoverage(c);
    return cov.targetCount > 0 && cov.satisfiedCount >= cov.targetCount;
  });
  const withCriteria = controls.filter(c => getControlRequirementCoverage(c).criteriaCount > 0);
  const withStatus = controls.filter(c => { const st=(state.controlStatus[c.id]||{}).status; return st && st!=='Not Started'; });
  const cnt = {
    Implemented:      controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Implemented').length,
    'In Progress':    controls.filter(c=>(state.controlStatus[c.id]||{}).status==='In Progress').length,
    Planned:          controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Planned').length,
    'Not Applicable': controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Not Applicable').length,
    'Not Started':    controls.filter(c=>!(state.controlStatus[c.id]||{}).status||(state.controlStatus[c.id]||{}).status==='Not Started').length,
  };
  const returnedCount  = getScopedControls().filter(c=>(state.controlStatus[c.id]||{}).returnedToPolicyOwner).length;
  const deselectCount  = getScopedControls().filter(c=>(state.controlStatus[c.id]||{}).recommendedDeselect).length;
  const currentUser = state.currentUserId ? (state.users||[]).find(function(u){ return u.id===state.currentUserId; }) : null;
  const currentName = (currentUser && currentUser.name) ? String(currentUser.name).trim().toLowerCase() : '';
  const evidenceRequests = (state.controlReviewQueue || []).filter(function(r) {
    if (!r || r.status !== 'Evidence Requested' || !r.controlId || !currentName) return false;
    const owner = (state.controlOwners || {})[r.controlId] || {};
    const submittedBy = String(r.submittedBy || '').trim().toLowerCase();
    const ownerName = String(owner.name || '').trim().toLowerCase();
    return submittedBy === currentName || ownerName === currentName;
  });
  const pctDesigned    = controls.length ? Math.round((designedControls.length/controls.length)*100) : 0;

  body.innerHTML = `
    <div class="section-title">Review &amp; Submit Design</div>
    <div class="section-subtitle">Review your control design documentation before submitting to the policy owner for review. This is a <em>design submission</em> — not a compliance attestation. Asset owners submit compliance evidence separately in the Assets &amp; SSP workspace.</div>

    <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#1e40af;">
      <strong>📌 What you're submitting:</strong> A design-only package: policy/NIST-aligned control design, scoped assets/processes, and required implementation/evidence expectations for asset and process owners.
    </div>

    ${evidenceRequests.length ? `
    <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#9a3412;">
      <strong>⚠ Additional evidence requested:</strong> ${evidenceRequests.length} control submission${evidenceRequests.length===1?'':'s'} need updates.
      <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">
        ${evidenceRequests.slice(0,10).map(function(r){ return '<span class="control-id">' + escapeHTML(r.controlId) + '</span>'; }).join('')}
        ${evidenceRequests.length > 10 ? `<span style="font-size:11px;color:#9a3412;">+${evidenceRequests.length - 10} more</span>` : ''}
      </div>
      <div style="font-size:11px;color:#7c2d12;margin-top:8px;">Update the control design/evidence notes and resubmit from this step.</div>
    </div>` : ''}

    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:22px;">
      ${[
        ['In Queue',       controls.length,          'var(--navy)', '#eff6ff'],
        ['Design Done',    designedControls.length,  '#166534',     '#f0fdf4'],
        ['Reqs Defined',   withReqs.length,           '#6366f1',     '#faf5ff'],
        ['Req Mapping',    fullyMappedReqs.length,    '#0f766e',     '#f0fdfa'],
        ['Status Set',     withStatus.length,         '#d97706',     '#fffbeb'],
      ].map(([label,count,color,bg]) => `
        <div style="background:${bg};border:1px solid ${color}22;border-radius:10px;padding:14px 16px;border-left:3px solid ${color};">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${color};">${label}</div>
          <div style="font-size:28px;font-weight:800;color:${color};line-height:1.1;margin-top:4px;">${count}</div>
          <div style="font-size:10px;color:${color};opacity:0.7;margin-top:2px;">of ${controls.length} controls</div>
        </div>`).join('')}
    </div>

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;color:var(--navy);">Design Completion</div>
        <div style="font-size:13px;font-weight:700;color:var(--teal);">${pctDesigned}%</div>
      </div>
      <div style="background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;margin-bottom:10px;">
        <div style="background:${pctDesigned===100?'#166534':'var(--teal)'};height:100%;width:${pctDesigned}%;border-radius:99px;transition:width 0.3s;"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:var(--text-muted);">
        <div>✅ <strong>${designedControls.length}</strong> controls with design documented</div>
        <div>📝 <strong>${withReqs.length}</strong> controls with downstream requirements</div>
        <div>🔗 <strong>${fullyMappedReqs.length}</strong> controls mapped across scoped asset types</div>
        <div>🧪 <strong>${withCriteria.length}</strong> controls with evidence acceptance criteria</div>
        ${returnedCount > 0 ? `<div>↩ <strong>${returnedCount}</strong> returned to policy owner</div>` : ''}
        ${deselectCount > 0 ? `<div>✗ <strong>${deselectCount}</strong> proposed for de-selection</div>` : ''}
      </div>
    </div>

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--navy);margin-bottom:14px;">Before You Submit</div>
      ${[
        [designedControls.length > 0,         'At least one control has a design documented',         'Go to Step 2 to document control designs'],
        [designedControls.length===controls.length, 'All controls have design documentation',          designedControls.length + ' of ' + controls.length + ' documented — ' + (controls.length-designedControls.length) + ' still need design in Step 2'],
        [withStatus.length===controls.length,  'All controls have implementation status set',      withStatus.length + ' of ' + controls.length + ' have status set'],
        [withReqs.length > 0,                  'Downstream requirements/evidence are defined',          'Go to Step 3 to define required actions and evidence'],
        [fullyMappedReqs.length===controls.length, 'Requirements are mapped for each scoped asset type/process', fullyMappedReqs.length + ' of ' + controls.length + ' fully mapped'],
      ].map(([ok,label,hint]) =>
        `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:16px;flex-shrink:0;margin-top:1px;">${ok?'✅':'⚠️'}</div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;color:var(--navy);">${label}</div>
            ${!ok ? `<div style="font-size:11px;color:#d97706;margin-top:2px;">${hint}</div>` : ''}
          </div>
        </div>`
      ).join('')}
      <div style="font-size:11px;color:var(--text-muted);padding-top:8px;">You can submit with incomplete items; policy owner and CISO reviewers will see QA gaps in this summary.</div>
    </div>

    <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid var(--border);">Design Summary by Family</div>
    ${families.map(fam => {
      const fc   = controls.filter(c=>c.f===fam);
      const fd   = fc.filter(isDesigned);
      const fpct = fc.length ? Math.round(fd.length/fc.length*100) : 0;
      return `<div style="border:1px solid var(--border);border-radius:8px;margin-bottom:8px;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fafbfc;cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <span class="family-badge">${fam}</span>
          <div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--navy);">${FAMILIES[fam]||fam}</div><div style="font-size:11px;color:var(--text-muted);">${fc.length} controls · ${fd.length} designed</div></div>
          <div style="display:flex;align-items:center;gap:8px;"><div style="width:80px;background:#e2e8f0;border-radius:99px;height:5px;overflow:hidden;"><div style="background:${fpct===100?'#166534':'var(--teal)'};height:100%;width:${fpct}%;border-radius:99px;"></div></div><div style="font-size:12px;font-weight:700;color:${fpct===100?'#166534':'var(--navy)'};width:36px;text-align:right;">${fpct}%</div></div>
          <span style="font-size:14px;flex-shrink:0;">▼</span>
        </div>
        <div style="display:none;padding:0 16px 12px;">
          <table class="control-table" style="margin-top:8px;">
            <thead><tr><th style="width:80px;">Control</th><th>Name</th><th style="width:130px;">Status</th><th style="width:80px;">Design</th><th style="width:80px;">Reqs</th><th style="width:80px;">Criteria</th></tr></thead>
            <tbody>${fc.map(c => {
              const cs = state.controlStatus[c.id]||{};
              const hd = isDesigned(c);
              const cov = getControlRequirementCoverage(c);
              const hr = cov.targetCount > 0 && cov.satisfiedCount >= cov.targetCount;
              const hc = cov.criteriaCount > 0;
              return `<tr><td><span class="control-id">${c.id}</span></td><td style="font-size:12px;">${escapeHTML(c.n)}</td><td>${chipHTML(cs.status||'Not Started')}</td><td style="text-align:center;">${hd?'<span style="color:#166534;font-size:15px;">✓</span>':'<span style="color:#d97706;font-size:11px;">—</span>'}</td><td style="text-align:center;">${hr?'<span style="color:#166534;font-size:15px;">✓</span>':'<span style="color:var(--text-muted);font-size:11px;">—</span>'}</td><td style="text-align:center;">${hc?'<span style="color:#0f766e;font-size:15px;">✓</span>':'<span style="color:var(--text-muted);font-size:11px;">—</span>'}</td></tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>`;
    }).join('')}

    <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:18px 20px;margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:700;color:var(--navy);">Select Controls to Submit for Review</div>
        <div style="font-size:11px;color:var(--text-muted);">${selectedForSubmit.length} selected of ${submitEligibleControls.length} eligible</div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">Controls with status <strong>Not Started</strong> are excluded from submission by default and cannot be submitted.</div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="btn btn-secondary btn-sm" onclick="setAllControlSubmitSelections(true)">Select all eligible</button>
        <button class="btn btn-secondary btn-sm" onclick="setAllControlSubmitSelections(false)">Clear selection</button>
      </div>
      <div class="table-scroll">
        <table class="control-table">
          <thead><tr><th style="width:42px;"></th><th style="width:90px;">Control</th><th>Name</th><th style="width:130px;">Status</th><th style="width:90px;">Design</th></tr></thead>
          <tbody>
            ${controls.map(c => {
              const st = (state.controlStatus[c.id] || {}).status || 'Not Started';
              const canSubmit = st !== 'Not Started';
              const checked = canSubmit && !!state._controlSubmitSelection[c.id];
              return `<tr>
                <td><input type="checkbox" ${checked ? 'checked' : ''} ${canSubmit ? '' : 'disabled'} onchange="setControlSubmitSelection('${c.id.replace(/'/g,"\\'")}',this.checked)" style="accent-color:var(--teal);"></td>
                <td><span class="control-id">${c.id}</span></td>
                <td style="font-size:12px;color:var(--navy);">${escapeHTML(c.n)}</td>
                <td>${chipHTML(st)}</td>
                <td style="font-size:11px;color:${isDesigned(c)?'#166534':'#d97706'};font-weight:700;">${isDesigned(c)?'Ready':'Missing'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${notStartedCount ? `<div style="font-size:11px;color:#b45309;margin-top:8px;">${notStartedCount} control${notStartedCount===1?'':'s'} are Not Started and excluded.</div>` : ''}
    </div>

    <div style="background:white;border:2px solid var(--navy);border-radius:12px;padding:24px;margin-top:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:20px;">📤</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--navy);">Submit Design for Policy Owner Review</div>
          <div style="font-size:12px;color:var(--text-muted);">Your design package is routed for review. Asset-owner attestation remains separate in Assets &amp; SSP.</div>
        </div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:11px;color:var(--text-muted);">
        Submitter is captured from your active user profile: <strong>${escapeHTML(((state.users||[]).find(u=>u.id===state.currentUserId)||{}).name || 'Current user')}</strong>.
      </div>
      <div style="margin-bottom:14px;">
        <label class="form-label" style="font-size:11px;">Notes for Policy Owner (optional)</label>
        <textarea class="form-input" id="designSubmitNotes" rows="2" style="font-size:12px;resize:vertical;" placeholder="Any context, caveats, or open items the policy owner should be aware of…">${escapeHTML(state.controlDesignSubmission?.notes||'')}</textarea>
      </div>
      ${state.controlDesignSubmission?.submittedAt ? `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#166534;">
        ✅ Last submitted: ${state.controlDesignSubmission.submittedAt} by ${escapeHTML(state.controlDesignSubmission.submitterName||'—')} — ${state.controlDesignSubmission.designedCount} of ${state.controlDesignSubmission.totalCount} controls designed.
      </div>` : ''}
      <button class="btn btn-primary" onclick="submitControlDesign()" style="width:100%;padding:12px;font-size:14px;font-weight:700;" ${selectedForSubmit.length === 0 ? 'disabled title="Select at least one eligible control above"' : ''}>
        📤 Submit ${selectedForSubmit.length} Control${selectedForSubmit.length === 1 ? '' : 's'} for Review
      </button>
    </div>`;
}

function submitControlDesign() {
  if (blockActionIfDemoPlaceholders()) return;
  clearScopedUndoStack('control design submit');
  const currentUser = state.currentUserId ? (state.users||[]).find(u=>u.id===state.currentUserId) : null;
  const name = (currentUser && currentUser.name) ? currentUser.name : 'Control Owner';
  const title = (currentUser && currentUser.title) ? currentUser.title : '';
  const notes = document.getElementById('designSubmitNotes')?.value.trim() || '';

  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  const submitEligibleControls = controls.filter(c => ((state.controlStatus[c.id]||{}).status || 'Not Started') !== 'Not Started');
  const selectedControls = submitEligibleControls.filter(c => !!(state._controlSubmitSelection || {})[c.id]);
  if (!selectedControls.length) {
    showToast('Select at least one eligible control to submit. Not Started controls are excluded.', true);
    return;
  }
  const designedControls = controls.filter(c => isControlDesigned(c.id));
  const fullyMappedReqs = controls.filter(c => {
    const cov = getControlRequirementCoverage(c);
    return cov.targetCount > 0 && cov.satisfiedCount >= cov.targetCount;
  });

  const myControls  = currentUser ? selectedControls.filter(c=>(state.controlOwners[c.id]||{}).name===currentUser.name) : selectedControls;
  const famsInvolved = [...new Set(myControls.map(c=>c.f).filter(Boolean))];
  const policyOwnerNames = [...new Set(famsInvolved.map(fam=>(state.domainOwners[fam]||{}).name).filter(Boolean))];
  const recipientLabel = policyOwnerNames.length ? policyOwnerNames.join(', ') : 'Policy Owner';

  state.controlDesignSubmission = {
    submitterName: name, submitterTitle: title, notes: notes,
    submittedAt: new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
    designedCount: designedControls.length, totalCount: controls.length,
    fullyMappedReqCount: fullyMappedReqs.length, submittedControlCount: selectedControls.length,
    timestamp: Date.now(), routedTo: policyOwnerNames,
  };

  if (!state.controlReviewQueue) state.controlReviewQueue = [];
  myControls.forEach(function(c) {
    const ex = state.controlReviewQueue.find(r=>r.controlId===c.id);
    if (ex) {
      ex.status='Design Submitted';
      ex.submittedAt=new Date().toISOString();
      ex.submittedBy=name;
      ex.notes = notes || '';
    } else {
      state.controlReviewQueue.push({
        controlId:c.id,
        family:c.f,
        policyOwner:(state.domainOwners[c.f]||{}).name||'',
        submittedBy:name,
        submittedAt:new Date().toISOString(),
        status:'Design Submitted',
        notes: notes || ''
      });
    }
  });

  addAuditEntry('control', null, 'Control design submitted by ' + name + ': ' + selectedControls.length + ' selected for review (' + designedControls.length + '/' + controls.length + ' designed, ' + fullyMappedReqs.length + '/' + controls.length + ' fully mapped), routed to ' + recipientLabel);
  showToast('✅ Submitted ' + selectedControls.length + ' selected control' + (selectedControls.length===1?'':'s') + ' to ' + recipientLabel + '.');
  markDirty();
  renderControlStep4();
}

function setControlSubmitSelection(ctrlId, checked) {
  if (!state._controlSubmitSelection) state._controlSubmitSelection = {};
  const st = (state.controlStatus[ctrlId] || {}).status || 'Not Started';
  if (st === 'Not Started') {
    state._controlSubmitSelection[ctrlId] = false;
    showToast('Not Started controls cannot be submitted.', true);
  } else {
    state._controlSubmitSelection[ctrlId] = !!checked;
  }
  markDirty();
  renderControlStep4();
}

function setAllControlSubmitSelections(checked) {
  if (!state._controlSubmitSelection) state._controlSubmitSelection = {};
  const controls = getScopedControls().filter(c =>
    !(state.controlStatus[c.id]||{}).returnedToPolicyOwner &&
    !(state.controlStatus[c.id]||{}).recommendedDeselect
  );
  controls.forEach(function(c) {
    const st = (state.controlStatus[c.id] || {}).status || 'Not Started';
    state._controlSubmitSelection[c.id] = st === 'Not Started' ? false : !!checked;
  });
  markDirty();
  renderControlStep4();
}

// Stub retained for backward compatibility (referenced by old snapshots)
function submitControlImplementation() { submitControlDesign(); }
function updateCtrlSubmitBtn() {}
function saveAttestDraft() {}

function setControlField(id, field, value) {
  if (!state.controlStatus[id]) state.controlStatus[id] = {};
  state.controlStatus[id][field] = value;
}
