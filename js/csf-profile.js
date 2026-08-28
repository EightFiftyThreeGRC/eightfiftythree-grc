// js/csf-profile.js -- NIST CSF 2.0 Organizational Profile, derived from program data.
// Globals only. Load after nist-csf-map.js. Rendered inside the Framework alignment tab.
//
// Concept (CSF 2.0 sec. 3 / SP 1301): an Organizational Profile pairs a Target
// Profile (which outcomes the organization prioritizes) with a Current Profile
// (what it achieves today). This program DERIVES both instead of surveying:
//   Target  = the CSF outcomes committed to in the ISP (Govern) and the five
//             Function policy packages (state.csfSelectedSubcats; before a
//             Function's outcomes have been curated, any outcome with in-scope
//             mapped controls counts as implicitly targeted).
//   Current = live implementation status of the 800-53 controls whose primary
//             CSF tag lands on each outcome (NIST_CSF_MAP; enhancements inherit).
// No questionnaire, no self-scoring: the profile moves when the program does.

function computeCsfOrganizationalProfile() {
  var out = { functions: [], totals: { targetedSubs: 0, metSubs: 0, controls: 0, implemented: 0 } };
  if (typeof CSF_FUNCTIONS === 'undefined' || typeof state === 'undefined') return out;
  var scopeIds = (typeof getCsfCoverageControlIds === 'function') ? getCsfCoverageControlIds() : [];

  // Bucket in-scope controls by primary subcategory / category-level tag.
  var bySub = {}, byCatOnly = {};
  scopeIds.forEach(function(id) {
    var m = (typeof getCsfPrimaryMapping === 'function') ? getCsfPrimaryMapping(id) : null;
    if (!m) return;
    if (m.sub) { (bySub[m.sub] = bySub[m.sub] || []).push(id); }
    else if (m.cat) { (byCatOnly[m.cat] = byCatOnly[m.cat] || []).push(id); }
  });

  var selMap = (state && state.csfSelectedSubcats && typeof state.csfSelectedSubcats === 'object')
    ? state.csfSelectedSubcats : {};

  ['GV', 'ID', 'PR', 'DE', 'RS', 'RC'].forEach(function(fn) {
    var fnMeta = CSF_FUNCTIONS[fn] || { name: fn };
    var fnRow = { fn: fn, name: fnMeta.name, categories: [], targetedSubs: 0, metSubs: 0, subCount: 0, controls: 0, implemented: 0, designed: 0 };
    var fnSubIds = (typeof getCsfSubcategoryIdsForFunction === 'function') ? getCsfSubcategoryIdsForFunction(fn) : [];
    var seeded = fnSubIds.some(function(id) { return Object.prototype.hasOwnProperty.call(selMap, id); });

    var cats = (typeof getCsfCategoriesForFunction === 'function') ? getCsfCategoriesForFunction(fn) : [];
    cats.forEach(function(cat) {
      var subIds = (typeof getCsfSubcategoryIdsForCategory === 'function') ? getCsfSubcategoryIdsForCategory(cat.id) : [];
      var catRow = { id: cat.id, name: cat.name, subs: [], targeted: 0, met: 0, controls: 0, implemented: 0, designed: 0 };
      subIds.forEach(function(sub) {
        var ids = bySub[sub] || [];
        var impl = ids.filter(function(id) { return typeof isCsfControlImplemented === 'function' && isCsfControlImplemented(id); }).length;
        var desg = ids.filter(function(id) { return typeof isCsfControlDesigned === 'function' && isCsfControlDesigned(id); }).length;
        var targeted = seeded ? !!selMap[sub] : ids.length > 0;
        var status;
        if (!targeted) status = 'not-targeted';
        else if (!ids.length) status = 'policy-only';
        else if (impl === ids.length) status = 'met';
        else if (impl > 0 || desg > 0) status = 'in-progress';
        else status = 'not-started';
        catRow.subs.push({ id: sub, targeted: targeted, status: status, controls: ids.length, implemented: impl, designed: desg });
        if (targeted) catRow.targeted++;
        if (targeted && status === 'met') catRow.met++;
        catRow.controls += ids.length; catRow.implemented += impl; catRow.designed += desg;
      });
      // Category-level-tagged controls count toward the category roll-up only.
      var extra = byCatOnly[cat.id] || [];
      catRow.controls += extra.length;
      catRow.implemented += extra.filter(function(id) { return typeof isCsfControlImplemented === 'function' && isCsfControlImplemented(id); }).length;
      catRow.designed += extra.filter(function(id) { return typeof isCsfControlDesigned === 'function' && isCsfControlDesigned(id); }).length;
      catRow.pct = catRow.controls ? Math.round((catRow.implemented / catRow.controls) * 100) : 0;
      fnRow.categories.push(catRow);
      fnRow.targetedSubs += catRow.targeted; fnRow.metSubs += catRow.met; fnRow.subCount += subIds.length;
      fnRow.controls += catRow.controls; fnRow.implemented += catRow.implemented; fnRow.designed += catRow.designed;
    });
    fnRow.pct = fnRow.controls ? Math.round((fnRow.implemented / fnRow.controls) * 100) : 0;
    out.functions.push(fnRow);
    out.totals.targetedSubs += fnRow.targetedSubs; out.totals.metSubs += fnRow.metSubs;
    out.totals.controls += fnRow.controls; out.totals.implemented += fnRow.implemented;
  });
  return out;
}

function csfProfileStatusChipHtml(status) {
  var meta = {
    'met':          { label: 'Met',           bg: '#dcfce7', fg: '#166534' },
    'policy-only':  { label: 'No mapped control', bg: '#f1f5f9', fg: '#475569' },
    'in-progress':  { label: 'In progress',   bg: '#fef9c3', fg: '#854d0e' },
    'not-started':  { label: 'Not started',   bg: '#fee2e2', fg: '#991b1b' },
    'not-targeted': { label: 'Not targeted',  bg: '#f1f5f9', fg: '#526071' }
  }[status] || { label: status, bg: '#f1f5f9', fg: '#526071' };
  return '<span style="display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:'
    + meta.bg + ';color:' + meta.fg + ';white-space:nowrap;">' + meta.label + '</span>';
}

function renderCsfProfilePanelHtml(opts) {
  opts = opts || {};
  if (typeof escapeHTML !== 'function') return '';
  var p = computeCsfOrganizationalProfile();
  var detail = !!state._csfProfileDetail;

  var fnBlocks = p.functions.map(function(fnRow) {
    var catRows = fnRow.categories.map(function(cat) {
      var gapNote = '';
      var rowStatus = !cat.targeted ? 'not-targeted'
        : (cat.controls === 0 ? 'policy-only'
        : (cat.implemented === cat.controls ? 'met'
        : (cat.implemented > 0 || cat.designed > 0 ? 'in-progress' : 'not-started')));
      var subDetail = '';
      if (detail) {
        subDetail = cat.subs.map(function(s) {
          var name = (typeof CSF_SUBCATEGORIES !== 'undefined' && CSF_SUBCATEGORIES[s.id]) ? CSF_SUBCATEGORIES[s.id] : '';
          return '<tr style="background:var(--bg, #fafaf7);">'
            + '<td></td>'
            + '<td style="font-size:11px;font-weight:700;color:var(--text-muted);white-space:nowrap;">' + escapeHTML(s.id) + '</td>'
            + '<td style="font-size:11px;color:var(--text-muted);">' + escapeHTML(name) + '</td>'
            + '<td style="font-size:11px;text-align:center;">' + (s.controls ? (s.implemented + ' / ' + s.controls) : '—') + '</td>'
            + '<td>' + csfProfileStatusChipHtml(s.status) + '</td>'
            + '</tr>';
        }).join('');
      }
      return '<tr>'
        + '<td><span class="csf-tag csf-fn-' + fnRow.fn.toLowerCase() + '">' + escapeHTML(cat.id) + '</span></td>'
        + '<td style="font-size:12px;font-weight:600;">' + escapeHTML(cat.name) + gapNote + '</td>'
        + '<td style="font-size:12px;color:var(--text-muted);white-space:nowrap;">' + cat.targeted + ' of ' + cat.subs.length + ' outcomes</td>'
        + '<td style="font-size:12px;text-align:center;white-space:nowrap;">' + (cat.controls ? (cat.implemented + ' / ' + cat.controls) : '—') + '</td>'
        + '<td>' + csfProfileStatusChipHtml(rowStatus) + '</td>'
        + '</tr>' + subDetail;
    }).join('');
    return '<tbody>'
      + '<tr><th colspan="5" style="text-align:left;padding-top:14px;font-size:12px;">'
      + '<span class="csf-tag csf-fn-' + fnRow.fn.toLowerCase() + '">' + fnRow.fn + '</span> '
      + escapeHTML(fnRow.name)
      + ' <span style="font-weight:400;color:var(--text-muted);">— ' + fnRow.targetedSubs + ' of ' + fnRow.subCount
      + ' outcomes targeted · ' + (fnRow.controls ? fnRow.pct + '% of mapped controls implemented' : 'no mapped controls in scope') + '</span>'
      + '</th></tr>'
      + catRows
      + '</tbody>';
  }).join('');

  return '<div class="csf-panel csf-profile-panel">'
    + '<div class="csf-panel-head">'
    + (opts.standalone
      ? '<div><div class="csf-panel-title">Outcome coverage</div>'
        + '<div class="csf-panel-sub">Target vs Current, by CSF Function and Category.</div></div>'
      : '<div><div class="csf-panel-title">NIST CSF 2.0 Organizational Profile</div>'
        + '<div class="csf-panel-sub">Derived from the program — not a questionnaire.</div></div>')
    + '<div style="display:flex;gap:8px;align-items:center;">'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="state._csfProfileDetail=!state._csfProfileDetail;refreshCsfProfileView()">'
    + (detail ? 'Hide outcome detail' : 'Show outcome detail') + '</button>'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="exportCsfProfileCsv()">Export CSV</button>'
    + '</div></div>'
    + '<p style="font-size:12.5px;line-height:1.6;color:var(--text-muted);margin:6px 0 12px;">'
    + 'CSF 2.0 pairs a <strong>Target Profile</strong> (the outcomes you prioritize) with a <strong>Current Profile</strong> '
    + '(what you achieve today). Most tools collect both with a questionnaire. This program derives them instead: '
    + 'Target comes from the outcomes your ISP and Function policies commit to, and Current comes from the live '
    + 'implementation status of the 800-53 controls mapped to each outcome — so the profile moves the moment the program does. Privacy (PT) controls have no dedicated CSF 2.0 outcome \u2014 they roll up to GV.OC-03 (privacy obligations); the Privacy Framework is the deeper lens there.</p>'
    + '<div class="table-scroll"><table class="control-table" style="min-width:640px;">'
    + '<thead><tr><th style="width:88px;">Category</th><th>Name</th><th style="width:150px;">Target</th>'
    + '<th style="width:110px;">Controls done</th><th style="width:120px;">Current</th></tr></thead>'
    + fnBlocks
    + '</table></div>'
    + (typeof renderCsfDisclaimerHtml === 'function' ? renderCsfDisclaimerHtml() : '')
    + '</div>';
}

function exportCsfProfileCsv() {
  var p = computeCsfOrganizationalProfile();
  var rows = [['Function', 'Category', 'Subcategory', 'Outcome', 'Targeted', 'In-scope controls', 'Designed', 'Implemented', 'Status']];
  p.functions.forEach(function(fnRow) {
    fnRow.categories.forEach(function(cat) {
      cat.subs.forEach(function(s) {
        var name = (typeof CSF_SUBCATEGORIES !== 'undefined' && CSF_SUBCATEGORIES[s.id]) ? CSF_SUBCATEGORIES[s.id] : '';
        rows.push([fnRow.name + ' (' + fnRow.fn + ')', cat.id + ' ' + cat.name, s.id, name,
          s.targeted ? 'Yes' : 'No', s.controls, s.designed, s.implemented, s.status]);
      });
    });
  });
  var csv = rows.map(function(r) {
    return r.map(function(v) {
      v = String(v == null ? '' : v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',');
  }).join('\r\n');
  var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'csf-2-0-organizational-profile.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 0);
  if (typeof addAuditEntry === 'function') addAuditEntry('reports', 'csf-profile', 'Exported CSF 2.0 Organizational Profile CSV');
}

/** Render the standalone CSF Profile tab (sidebar: Program → CSF Profile). */
function renderCsfProfileTab() {
  var body = document.getElementById('csfprofile-body');
  if (!body) return;
  body.innerHTML = renderCsfProfilePanelHtml({ standalone: true });
}

/** Re-render whichever surface is currently showing the profile. */
function refreshCsfProfileView() {
  var panel = document.getElementById('tab-csfprofile');
  if (panel && panel.classList.contains('active')) { renderCsfProfileTab(); return; }
  if (typeof renderFrameworksTab === 'function') renderFrameworksTab();
}
